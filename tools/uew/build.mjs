/**
 * Umoya Elementor widget compiler.
 *
 *   node tools/uew/build.mjs [--only=fc_hero,fc_form] [--no-verify]
 *
 * Reads the section HTML files listed in sections/*.mjs and writes, per
 * section: a PHP render template, the section's CSS and JS as plugin assets, a
 * control schema, and a thin widget class.
 *
 * The build refuses to finish unless the template reproduces its source byte
 * for byte when rendered with its own defaults. That check is what the previous
 * generator lacked -- it round-tripped strings in JavaScript, which cannot see
 * what PHP escaping will do to them. Here the verification runs the real
 * template through real PHP with WordPress loaded, so `wp_kses_post`,
 * `esc_attr` and `esc_url` are the actual functions that will run in production.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

import { createDocument, outerRange } from './lib/html.mjs';
import { deriveSection } from './lib/derive.mjs';
import { emitTemplate, emitScript, emitCss, emitWidgetClass, emitSchema, guardPhpNewlines } from './lib/emit.mjs';
import * as fcRegistry from './sections/founders-circle.mjs';

const here = path.dirname( fileURLToPath( import.meta.url ) );
const repoRoot = path.resolve( here, '..', '..' );
const pluginRoot = path.join( repoRoot, 'umoya-elementor-widgets' );
const localPhp = path.join( repoRoot, 'local-env', 'php', 'php.exe' );
const localPhpIni = path.join( repoRoot, 'local-env', 'php', 'php.ini' );
const localWpLoad = path.join( repoRoot, 'local-env', 'wordpress', 'wp-load.php' );

const args = process.argv.slice( 2 );
const only = ( args.find( ( a ) => a.startsWith( '--only=' ) ) || '' ).replace( '--only=', '' );
const onlyKeys = only ? new Set( only.split( ',' ).map( ( s ) => s.trim() ) ) : null;
const verify = ! args.includes( '--no-verify' );

const registries = [ fcRegistry ];

/* ------------------------------------------------------------------- utils */

function readSource( relativePath ) {
	const full = path.join( repoRoot, relativePath );
	if ( ! fs.existsSync( full ) ) throw new Error( 'Missing source file: ' + relativePath );
	// Strip a UTF-8 BOM (homepage-section-03 had one; it broke patching before)
	// and normalise CRLF so byte comparisons are about content, not line endings.
	return fs.readFileSync( full, 'utf8' ).replace( /^﻿/, '' ).replace( /\r\n/g, '\n' );
}

function writeFile( relativePath, contents ) {
	const full = path.join( pluginRoot, relativePath );
	fs.mkdirSync( path.dirname( full ), { recursive: true } );
	const normalized = contents
		.replace( /\r\n/g, '\n' )
		.split( '\n' )
		.map( ( line ) => line.replace( /[ \t]+$/g, '' ) )
		.join( '\n' );
	fs.writeFileSync( full, normalized, 'utf8' );
	return normalized;
}

/**
 * Pull `<style>` and `<script>` blocks out of the section, using parser-reported
 * offsets rather than a regex -- a regex for `<style>` is exactly the failure
 * that ate the footer's opt-out popup (CLAUDE.md phase 21), because it cannot
 * tell a real tag from one named inside a comment.
 *
 * Each block is removed together with the whitespace-only remainder of its own
 * line, so the leftover markup has no orphan blank lines. That trimmed markup is
 * the contract: it is what the template must reproduce exactly.
 */
function splitSection( raw ) {
	const doc = createDocument( raw );
	const styles = [];
	const scripts = [];
	const edits = [];

	for ( const { node } of doc.entries ) {
		const tag = node.tagName.toLowerCase();
		if ( tag !== 'style' && tag !== 'script' ) continue;
		// Leave SVG-embedded style blocks alone; they belong to the graphic.
		const range = outerRange( node );
		const inner = ( node.childNodes || [] ).map( ( c ) => c.value || '' ).join( '' );
		( tag === 'style' ? styles : scripts ).push( inner.trim() );

		let start = range.start;
		while ( start > 0 && ( raw[ start - 1 ] === ' ' || raw[ start - 1 ] === '\t' ) ) start -= 1;
		let end = range.end;
		while ( end < raw.length && ( raw[ end ] === ' ' || raw[ end ] === '\t' ) ) end += 1;
		if ( raw[ end ] === '\n' ) end += 1;
		if ( start > 0 && raw[ start - 1 ] === '\n' && raw[ end ] === '\n' ) end += 1;

		edits.push( { start, end, replacement: '' } );
	}

	let markup = raw;
	for ( const edit of edits.sort( ( a, b ) => b.start - a.start ) ) {
		markup = markup.slice( 0, edit.start ) + edit.replacement + markup.slice( edit.end );
	}

	return { markup: markup.trim() + '\n', css: styles.join( '\n\n' ), scripts };
}

/* ----------------------------------------------------------------- panels */

const MAX_CONTROLS_PER_PANEL = 8;

/**
 * Group content controls into panels. A control belongs to the style part it
 * was derived from; parts are then merged upwards until each panel holds a
 * readable number of controls, which keeps the Content tab navigable without
 * hiding anything.
 */
function buildContentPanels( fields, parts ) {
	// Fields carrying a `tab` belong to a dedicated panel -- CRM wiring, field
	// behaviour, media attributes -- rather than to the element they sit on.
	// Splitting first is what stops them landing in an unnamed catch-all.
	const tabbed = { integration: [], form: [], behaviour: [], inline_style: [] };
	const labelByPart = new Map( parts.map( ( part ) => [ part.id, part.label ] ) );

	const byGroup = new Map();
	for ( const field of fields ) {
		if ( field.internal ) continue;

		if ( field.tab && tabbed[ field.tab ] ) {
			tabbed[ field.tab ].push( { ...field, part_label: labelByPart.get( field.group ) || '' } );
			continue;
		}

		const group = field.group || 'content';
		if ( ! byGroup.has( group ) ) byGroup.set( group, [] );
		byGroup.get( group ).push( field );
	}

	const panels = [];

	for ( const part of parts ) {
		const controls = byGroup.get( part.id );
		byGroup.delete( part.id );
		if ( ! controls || ! controls.length ) continue;
		panels.push( { id: 'content_' + part.id, label: part.label, controls: sortControls( controls ) } );
	}

	// Anything unattached (shouldn't happen, but never drop a control silently).
	for ( const [ group, controls ] of byGroup ) {
		if ( ! controls.length ) continue;
		panels.push( { id: 'content_' + group, label: 'Other content', controls: sortControls( controls ) } );
	}

	return { panels: mergeSmallPanels( panels ), tabbed };
}

function sortControls( controls ) {
	return [ ...controls ].sort( ( a, b ) => ( a.sort || 0 ) - ( b.sort || 0 ) );
}

/** Fold single-control panels into the previous one, up to the size cap. */
function mergeSmallPanels( panels ) {
	const out = [];
	for ( const panel of panels ) {
		const previous = out[ out.length - 1 ];
		if (
			previous &&
			panel.controls.length === 1 &&
			previous.controls.length + 1 <= MAX_CONTROLS_PER_PANEL
		) {
			previous.controls.push( ...panel.controls );
			continue;
		}
		out.push( panel );
	}
	return out;
}

/* ------------------------------------------------------------------ build */

const manifest = {};
const report = [];

for ( const registry of registries ) {
	for ( const section of registry.sections ) {
		if ( onlyKeys && ! onlyKeys.has( section.key ) ) continue;

		const raw = readSource( section.source );
		const { markup, css, scripts } = splitSection( raw );

		let derived;
		try {
			derived = deriveSection( { key: section.key, markup, css, spec: section.spec || {} } );
		} catch ( error ) {
			error.message = section.key + ' (' + section.source + '): ' + error.message;
			throw error;
		}
		const { panels, tabbed } = buildContentPanels( derived.fields, derived.parts );

		const paths = {
			template: 'templates/sections/' + section.key + '.php',
			css: 'assets/css/sections/' + section.key + '.css',
			js: 'assets/js/sections/' + section.key + '.js',
			schema: 'includes/sections/' + section.key + '.json',
			widget: 'widgets/class-' + section.name.replace( /^umoya-/, '' ) + '.php',
		};

		const meta = {
			key: section.key,
			name: section.name,
			title: section.title,
			description: section.description || '',
			icon: section.icon,
			category: registry.category.slug,
			source: section.source,
			class_name: section.class_name,
			widget_file: paths.widget,
			root_selector: derived.rootSelector,
			template: paths.template,
			style: css.trim() ? { handle: 'uew-' + section.name, file: paths.css } : null,
			script: scripts.length ? { handle: 'uew-' + section.name, file: paths.js } : null,
			keywords: [ 'umoya', 'founders circle', ...section.title.toLowerCase().split( /[^a-z0-9]+/ ).filter( Boolean ) ],
		};

		const schema = {
			...meta,
			tokens: derived.tokens,
			content_panels: panels,
			integration_controls: tabbed.integration,
			form_controls: tabbed.form,
			behaviour_controls: tabbed.behaviour,
			inline_style_controls: tabbed.inline_style,
			repeaters: derived.repeaters,
			style_parts: derived.parts,
			inline_styles: derived.fields.filter( ( f ) => f.control === 'inline_style_group' ),
			fields: derived.fields.filter( ( f ) => ! f.internal ),
		};

		writeFile( paths.template, emitTemplate( { ...meta }, guardPhpNewlines( derived.template ) ) );
		if ( meta.style ) writeFile( paths.css, emitCss( meta, css ) );
		if ( meta.script ) writeFile( paths.js, emitScript( { ...meta, script_requires_root: section.script_requires_root }, scripts ) );
		writeFile( paths.widget, emitWidgetClass( meta ) );
		writeFile( paths.schema, emitSchema( schema ) );

		// The bare template (no repeater-item classes) is what the fidelity
		// check renders, so a pass means "byte-identical to the section file".
		fs.mkdirSync( path.join( pluginRoot, '.verify' ), { recursive: true } );
		fs.writeFileSync(
			path.join( pluginRoot, '.verify', section.key + '.php' ),
			emitTemplate( meta, guardPhpNewlines( derived.templateBare ) ),
			'utf8'
		);
		fs.writeFileSync( path.join( pluginRoot, '.verify', section.key + '.expected.html' ), markup, 'utf8' );

		manifest[ section.key ] = meta;
		report.push( {
			key: section.key,
			parts: derived.parts.length,
			fields: schema.fields.length,
			repeaters: derived.repeaters.length,
			rows: derived.repeaters.reduce( ( n, r ) => n + r.rows.length, 0 ),
			tokens: derived.tokens.length,
			notes: derived.notes,
		} );
	}
}

writeFile( 'includes/sections/index.json', JSON.stringify( manifest, null, '\t' ) + '\n' );

/* ----------------------------------------------------------- verification */

let verifyResult = null;
if ( verify ) {
	if ( ! fs.existsSync( localPhp ) || ! fs.existsSync( localWpLoad ) ) {
		console.error(
			'\nFidelity check SKIPPED: the local WordPress harness is not installed.\n' +
			'Run `node tools/uew/setup-local-env.mjs` first, or pass --no-verify to accept unverified output.\n'
		);
		process.exitCode = 1;
	} else {
		const job = {
			plugin_root: pluginRoot.replace( /\\/g, '/' ),
			wp_load: localWpLoad.replace( /\\/g, '/' ),
			sections: Object.keys( manifest ),
		};
		const jobFile = path.join( pluginRoot, '.verify', 'job.json' );
		fs.writeFileSync( jobFile, JSON.stringify( job ), 'utf8' );

		try {
			const out = execFileSync(
				localPhp,
				[ '-c', localPhpIni, path.join( here, 'verify-render.php' ), jobFile ],
				{ encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
			);
			verifyResult = JSON.parse( out.slice( out.indexOf( '{' ) ) );
		} catch ( error ) {
			console.error( 'Fidelity check failed to run:\n' + ( error.stdout || '' ) + ( error.stderr || error.message ) );
			process.exitCode = 1;
		}
	}
}

/* ----------------------------------------------------------------- report */

console.log( '\nUmoya Elementor widget compiler' );
console.log( '================================\n' );
const pad = ( value, width ) => String( value ).padStart( width );
console.log( 'section'.padEnd( 20 ) + pad( 'parts', 6 ) + pad( 'fields', 7 ) + pad( 'repeat', 7 ) + pad( 'rows', 6 ) + pad( 'tokens', 8 ) + '  fidelity' );
console.log( '-'.repeat( 74 ) );

let failures = 0;
for ( const row of report ) {
	const result = verifyResult ? verifyResult.sections[ row.key ] : null;
	const status = ! verifyResult ? 'not run' : result && result.ok ? ( result.normalized ? 'OK (entity-normalised)' : 'OK' ) : 'MISMATCH';
	if ( verifyResult && ( ! result || ! result.ok ) ) failures += 1;
	console.log(
		row.key.padEnd( 20 ) + pad( row.parts, 6 ) + pad( row.fields, 7 ) + pad( row.repeaters, 7 ) +
		pad( row.rows, 6 ) + pad( row.tokens, 8 ) + '  ' + status
	);
	for ( const note of row.notes ) console.log( '  · ' + note );
}

if ( verifyResult ) {
	for ( const [ key, result ] of Object.entries( verifyResult.sections ) ) {
		if ( result.ok ) continue;
		console.log( '\n--- ' + key + ' fidelity diff ---' );
		console.log( result.diff );
	}
}

console.log( '\n' + report.length + ' section(s) compiled.' );
if ( failures ) {
	console.log( failures + ' section(s) FAILED the byte-fidelity check.' );
	process.exitCode = 1;
} else if ( verifyResult ) {
	console.log( 'All templates reproduce their source markup exactly.' );
}
