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

import { splitSection, readSectionFile } from './lib/split.mjs';
import { deriveSection } from './lib/derive.mjs';
import { emitTemplate, emitScript, emitCss, emitWidgetClass, emitSchema, guardPhpNewlines } from './lib/emit.mjs';
import { registries } from './sections/index.mjs';

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
	const tabbed = { integration: [], form: [], behaviour: [], inline_style: [], media: [] };
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
		panels.push( {
			id: 'content_' + part.id,
			label: part.label,
			sample: part.sample || '',
			region_label: part.parent_label || '',
			controls: sortControls( controls ).map( ( c ) => ( { ...c, part_label: part.label } ) ),
		} );
	}

	// Anything unattached (shouldn't happen, but never drop a control silently).
	for ( const [ group, controls ] of byGroup ) {
		if ( ! controls.length ) continue;
		panels.push( { id: 'content_' + group, label: 'Other content', controls: sortControls( controls ) } );
	}

	const merged = mergeSmallPanels( panels );
	merged.forEach( dedupeControlLabels );

	return { panels: merged, tabbed };
}

/**
 * Number Content-tab panels that share a name, in page order.
 *
 * Element panels are named uniquely, but a panel that absorbs its small
 * neighbours takes its region's name afterwards, and two regions can share one:
 * the nav's Content tab read "Navigation, Logo, Logo, Navigation". Elementor's
 * panel has no search, so a name that does not single out its panel is a name
 * the editor has to open to find out. List panels share the tab, so their names
 * count as taken.
 */
function dedupePanelLabels( panels, repeaters ) {
	const counts = new Map();
	for ( const label of panels.map( ( p ) => p.label ).concat( repeaters.map( ( r ) => r.label ) ) ) {
		counts.set( label, ( counts.get( label ) || 0 ) + 1 );
	}

	// A number can already be taken -- the footer has a panel named "Content 2"
	// from the element naming -- so each new name skips the ones in use.
	const used = new Set( counts.keys() );
	const next = new Map();
	for ( const panel of panels ) {
		const base = panel.label;
		if ( ( counts.get( base ) || 0 ) < 2 ) continue;
		let n = next.get( base ) || 1;
		while ( used.has( base + ' ' + n ) ) n += 1;
		panel.label = base + ' ' + n;
		used.add( panel.label );
		next.set( base, n + 1 );
	}
}

/**
 * Number repeated control labels within a panel.
 *
 * Two elements that share a CSS selector share a style panel -- correctly, they
 * are styled together -- but their content is separate, so the panel ends up
 * with two controls both called "Text" and no way to tell which is which.
 */
function dedupeControlLabels( panel ) {
	const counts = new Map();
	for ( const control of panel.controls ) {
		counts.set( control.label, ( counts.get( control.label ) || 0 ) + 1 );
	}

	const seen = new Map();
	for ( const control of panel.controls ) {
		if ( ( counts.get( control.label ) || 0 ) < 2 ) continue;
		const n = ( seen.get( control.label ) || 0 ) + 1;
		seen.set( control.label, n );
		control.label = control.label + ' ' + n;
	}
}

function sortControls( controls ) {
	return [ ...controls ].sort( ( a, b ) => ( a.sort || 0 ) - ( b.sort || 0 ) );
}

/**
 * Fold single-control panels into the previous one, up to the size cap.
 *
 * Merging is what keeps the Content tab from being forty panels of one control
 * each. The catch is that two different elements can share a control label --
 * a section with a header Title and a button Title ends up with two controls
 * both called "Title" and no way to tell them apart. When that happens the
 * control takes its part's (already unique) name instead.
 *
 * The root Section panel is never merged into: it holds attributes of the
 * section itself, which is a different kind of thing from its contents.
 */
function mergeSmallPanels( panels ) {
	const out = [];

	for ( const panel of panels ) {
		const previous = out[ out.length - 1 ];
		const mergeable = previous &&
			'Section' !== previous.label &&
			panel.controls.length === 1 &&
			previous.controls.length + 1 <= MAX_CONTROLS_PER_PANEL;

		if ( ! mergeable ) {
			out.push( panel );
			continue;
		}

		const taken = new Set( previous.controls.map( ( c ) => c.label ) );
		for ( const control of panel.controls ) {
			if ( taken.has( control.label ) && control.part_label && control.part_label !== control.label ) {
				control.label = control.part_label;
			}
			taken.add( control.label );
			previous.controls.push( control );
		}

		// Once a panel holds more than one element it is a region, not that
		// element, and keeping the first one's name ("Eyebrow" for a panel of
		// six controls) misdescribes it.
		previous.merged = true;
		previous.label = previous.region_label || 'Content';
	}

	return out;
}

/* ------------------------------------------------------------------ build */

// Eight registries now feed one manifest. A repeated key would overwrite a
// widget's files, and a repeated name or class would make WordPress register
// one widget twice and the other not at all -- refuse before writing anything.
{
	const seen = { key: new Map(), name: new Map(), class_name: new Map(), slug: new Map() };
	const clash = [];
	for ( const registry of registries ) {
		const slugOwner = seen.slug.get( registry.category.slug );
		if ( slugOwner ) clash.push( 'category ' + registry.category.slug + ' is declared twice' );
		seen.slug.set( registry.category.slug, true );

		for ( const section of registry.sections ) {
			for ( const field of [ 'key', 'name', 'class_name' ] ) {
				const owner = seen[ field ].get( section[ field ] );
				if ( owner ) clash.push( field + ' "' + section[ field ] + '" is used by both ' + owner + ' and ' + section.source );
				seen[ field ].set( section[ field ], section.source );
			}
		}
	}
	if ( clash.length ) throw new Error( 'Registry conflicts:\n  ' + clash.join( '\n  ' ) );
}

const manifest = {};
const report = [];

for ( const registry of registries ) {
	for ( const section of registry.sections ) {
		if ( onlyKeys && ! onlyKeys.has( section.key ) ) continue;

		const raw = readSource( section.source );
		const { markup, css, scripts } = splitSection( raw );

		// A script that moves part of the section to <body> takes it out from
		// under the widget wrapper every style control is scoped to. That killed
		// the inquiry popups' whole Style tab without a single error, so it is
		// refused here until the registry says which element moves.
		const portals = ( section.spec && section.spec.portals ) || [];
		if ( scripts.some( ( s ) => /document\.body\.(appendChild|insertBefore|prepend|append)\s*\(/.test( s ) ) && ! portals.length ) {
			throw new Error(
				section.key + ' (' + section.source + '): its script moves an element to <body>. ' +
				'Declare it in the registry as spec.portals, or its style controls will not reach it.'
			);
		}

		let derived;
		try {
			derived = deriveSection( { key: section.key, markup, css, spec: section.spec || {} } );
		} catch ( error ) {
			error.message = section.key + ' (' + section.source + '): ' + error.message;
			throw error;
		}
		const { panels, tabbed } = buildContentPanels( derived.fields, derived.parts );
		dedupePanelLabels( panels, derived.repeaters );

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
			// The panel search matches these. Every widget used to carry "founders
			// circle", so searching for it listed the whole plugin.
			keywords: [ ...new Set( [
				'umoya',
				...( registry.category.keywords || [] ),
				...section.title.toLowerCase().split( /[^a-z0-9]+/ ).filter( ( word ) => word.length > 1 ),
			] ) ],
		};

		const schema = {
			...meta,
			portals: derived.portals,
			tokens: derived.tokens,
			content_panels: panels,
			integration_controls: tabbed.integration,
			form_controls: tabbed.form,
			behaviour_controls: tabbed.behaviour,
			inline_style_controls: tabbed.inline_style,
			media_controls: tabbed.media,
			repeaters: derived.repeaters,
			style_parts: derived.parts,
			inline_styles: derived.fields.filter( ( f ) => f.control === 'inline_style_group' ),
			fields: derived.fields.filter( ( f ) => ! f.internal ),
		};

		writeFile( paths.template, emitTemplate( { ...meta }, guardPhpNewlines( derived.template ) ) );
		if ( meta.style ) writeFile( paths.css, emitCss( meta, css ) );
		if ( meta.script ) writeFile( paths.js, emitScript( { ...meta, script_requires_root: section.script_requires_root, portals: derived.portals }, scripts ) );
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

/*
 * The manifest is the registry: a key missing from it is a widget WordPress
 * will not register. A `--only` run must therefore merge into what is already
 * there, not replace it -- writing just the section being worked on silently
 * unregisters the other eleven, which is exactly what happened once here and
 * looked for all the world like the widgets had broken.
 */
const manifestPath = path.join( pluginRoot, 'includes', 'sections', 'index.json' );
let merged = manifest;
if ( onlyKeys && fs.existsSync( manifestPath ) ) {
	const existing = JSON.parse( fs.readFileSync( manifestPath, 'utf8' ) );
	merged = { ...existing, ...manifest };

	// Keep the registry in the registries' own order, so the widget panel lists
	// sections in the order they are placed on the page.
	const ordered = {};
	for ( const registry of registries ) {
		for ( const section of registry.sections ) {
			if ( merged[ section.key ] ) ordered[ section.key ] = merged[ section.key ];
		}
	}
	merged = ordered;
}

writeFile( 'includes/sections/index.json', JSON.stringify( merged, null, '\t' ) + '\n' );

/*
 * Categories are emitted rather than hardcoded in PHP, so adding a page family
 * is a registry file and nothing else. Written from every registry, not only the
 * ones this run touched, or a `--only` run would drop the others.
 */
writeFile(
	'includes/sections/categories.json',
	JSON.stringify(
		registries.map( ( registry ) => ( {
			slug: registry.category.slug,
			title: registry.category.title,
			icon: registry.category.icon || 'eicon-globe',
		} ) ),
		null,
		'\t'
	) + '\n'
);

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
