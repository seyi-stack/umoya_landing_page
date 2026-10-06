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
import { deriveSection, GENERIC_ROLES } from './lib/derive.mjs';
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

/**
 * Attributes that exist for screen readers and assistive tech. They are filed
 * on the Advanced tab: a client changing a headline never needs them, and
 * dotted between the headline and the button they made the Content tab read
 * like a form to fill in.
 */
const ACCESSIBILITY_ATTRS = new Set( [ 'aria-label', 'aria-roledescription', 'aria-labelledby', 'aria-describedby', 'role', 'title' ] );

/**
 * Elements that only arrange others: a row of two fields, the box around a
 * label and its input. They are listed last, under "Layout".
 */
const LAYOUT_ROLES = new Set( [ ...GENERIC_ROLES, 'Row', 'Field Wrapper', 'Grid' ] );

/** What a plain wrapper under "Layout" can be styled with. */
const LAYOUT_FEATURES = new Set( [ 'padding', 'margin', 'measure', 'flex_container', 'grid_container', 'effects' ] );

/** Rows beyond which a list is drawn in a panel of its own. */
const LONG_LIST_ROWS = 24;

/** Controls whose own label says more than the element's name would. */
const SELF_NAMED = new Set( [ 'media', 'url', 'switcher', 'select' ] );

/**
 * The three tabs, organised the way Elementor organises its own widgets: by
 * what is on the page, not by HTML element.
 *
 * Content -- one panel per visible block (see deriveRegions()), in page order.
 * Inside, each thing a person sees is one entry: a field's label and its box,
 * a button's link and its wording. An entry with one setting is that setting,
 * named after the element; an entry with several gets a heading. Lists sit in
 * the block they belong to.
 *
 * Style -- "Section" first (the colours, the section box, anything styled
 * section-wide), then one panel per block. Every element is ONE row that opens
 * its settings in a pop-out, the way Typography does, instead of a panel of its
 * own.
 *
 * Advanced -- accessibility attributes, link and media behaviour, form field
 * rules and the HubSpot wiring: settings for whoever maintains the site, out of
 * the client's way.
 */
function buildPanels( derived ) {
	const regionLabel = new Map( derived.regions.map( ( region ) => [ region.id, region.label ] ) );
	const fields = derived.fields.filter( ( field ) => ! field.internal );

	const content = [];
	const inlineByPart = new Map();
	const advanced = { accessibility: [], behaviour: [], form: [], integration: [] };

	for ( const field of fields ) {
		if ( field.css_only ) {
			content.push( field ); // a photo the stylesheet paints is still a photo
			continue;
		}
		switch ( field.tab ) {
			case 'integration':
				advanced.integration.push( field );
				break;
			case 'form':
				advanced.form.push( field );
				break;
			case 'behaviour':
				advanced.behaviour.push( field );
				break;
			case 'inline_style':
				if ( ! inlineByPart.has( field.group ) ) inlineByPart.set( field.group, [] );
				inlineByPart.get( field.group ).push( field );
				break;
			case 'media':
				( field.unseen ? advanced.behaviour : content ).push( field );
				break;
			default:
				// Words only a screen reader speaks -- a field's visually hidden
				// label -- are set with the other accessibility text.
				if ( field.screen_reader ) advanced.accessibility.push( { ...field, label: 'Screen Reader Label' } );
				// Where a form posts is wiring.
				else if ( 'action' === field.attr ) advanced.integration.push( field );
				// A link's or button's words sit beside its Link as "Text"; the
				// entry's name already says which link it is.
				else if ( 'action' === field.owner_kind && ! field.attr && [ 'text', 'textarea' ].includes( field.control ) ) content.push( { ...field, label: 'Text' } );
				// A form field's own words are its Label, beside its Placeholder.
				else if ( 'field' === field.owner_kind && ! field.attr && [ 'text', 'textarea' ].includes( field.control ) ) content.push( { ...field, label: field.label.replace( /^(Text|Label)\b/, 'Label' ) } );
				else if ( field.attr && ACCESSIBILITY_ATTRS.has( field.attr ) ) advanced.accessibility.push( field );
				else if ( field.unseen ) advanced.behaviour.push( field );
				else content.push( field );
		}
	}

	/* -------------------------------------------------------------- content */

	const blocks = [ { id: '', label: 'Section' }, ...derived.regions ];
	const contentPanels = [];
	for ( const block of blocks ) {
		const items = [];

		const owners = new Map();
		for ( const field of content.filter( ( candidate ) => ( candidate.region || '' ) === block.id ) ) {
			const key = field.owner || 'g_' + field.group;
			if ( ! owners.has( key ) ) {
				owners.set( key, { kind: 'group', label: field.owner_label || field.part_label || 'Content', order: field.order ?? 0, controls: [] } );
			}
			owners.get( key ).controls.push( field );
		}
		for ( const group of owners.values() ) {
			// A button's words come before where it goes, as on Elementor's own
			// Button widget, even when the words sit in a span inside it.
			group.controls = sortControls( group.controls ).sort( ( x, y ) => ( 'Text' === y.label ) - ( 'Text' === x.label ) );
			const only = group.controls[ 0 ];
			// A lone link field takes its entry's name when that name says more
			// than "Link": an icon link reads "Instagram".
			const namedLink = 'url' === only.control && ! /^(Link|Links|Button|Buttons)( \d+)?$/.test( group.label );
			if ( 1 === group.controls.length && ( ! SELF_NAMED.has( only.control ) || namedLink ) ) {
				// One setting: name it after the element ("Title", "Note"), with
				// no heading above it repeating the same word.
				group.controls[ 0 ] = { ...group.controls[ 0 ], label: group.label };
			}
			dedupeControlLabels( group );
			items.push( group );
		}

		// A long list gets a panel of its own, straight after its block's.
		// Elementor draws every row of a list when its panel opens, so the
		// 200-country dropdown made the contact form's first panel take 26
		// seconds to appear; on its own it is only drawn when asked for.
		const longLists = [];
		for ( const definition of derived.repeaters.filter( ( candidate ) => ( candidate.region || '' ) === block.id ) ) {
			if ( ( definition.rows || [] ).length > LONG_LIST_ROWS ) {
				longLists.push( definition );
				continue;
			}
			items.push( { kind: 'list', id: definition.id, label: definition.block_label || definition.label, order: definition.order ?? 0 } );
		}

		if ( items.length ) {
			items.sort( ( a, b ) => a.order - b.order );
			contentPanels.push( { id: 'content_' + ( block.id || 'section' ), label: block.label, items: items.map( strip ) } );
		}
		for ( const definition of longLists ) {
			contentPanels.push( {
				id: 'content_list_' + definition.id,
				label: definition.label,
				items: [ { kind: 'list', id: definition.id, label: definition.label, order: 0 } ],
			} );
		}
	}

	/* ---------------------------------------------------------------- style */

	const rowFor = ( part ) => {
		const inline = inlineByPart.get( part.id ) || [];
		return {
			part: part.id,
			label: part.display || part.label,
			inline: inline.map( strip ),
			// A stylesheet control for a property the element also sets inline
			// could never win; the pop-out offers the inline one in its place.
			inline_props: [ ...new Set( inline.map( ( field ) => field.css_prop ).filter( Boolean ) ) ],
		};
	};
	// A plain wrapper is listed under "Layout", after the things a person came
	// to style. Words and a block's own frame are never plain wrappers.
	const isLayout = ( part ) => LAYOUT_ROLES.has( part.short_label ) && ! part.box && ! part.frame && ! ( part.features || [] ).includes( 'text' );

	// Plain wrappers listed under "Layout" keep only what arranges things:
	// spacing, max width, the flex or grid settings, opacity. A wrapper with a
	// background or border worth styling is not a plain wrapper -- it is named
	// as a box or a card -- and the rest made a form's panel too heavy to open
	// promptly (see editor-check's PANEL_CONTROL_BUDGET).
	const leanParts = new Set();
	const stylePanels = [];
	for ( const block of blocks ) {
		const parts = derived.parts.filter( ( part ) => ( part.region || '' ) === block.id ).sort( ( a, b ) => a.order - b.order );
		const rows = [];

		if ( '' === block.id ) {
			const root = parts.find( ( part ) => '' === part.selector );
			if ( root ) rows.push( rowFor( root ) );
			parts.filter( ( part ) => part.everywhere ).forEach( ( part, index ) => {
				rows.push( { ...rowFor( part ), heading: 0 === index ? 'Across the section' : undefined } );
			} );
		} else {
			parts.filter( ( part ) => ! isLayout( part ) ).forEach( ( part ) => rows.push( rowFor( part ) ) );
		}

		const layout = parts.filter( ( part ) =>
			'' !== part.selector && ! part.everywhere && ( '' === block.id || isLayout( part ) )
		);
		layout.forEach( ( part, index ) => {
			rows.push( { ...rowFor( part ), heading: 0 === index ? 'Layout' : undefined } );
			if ( isLayout( part ) ) leanParts.add( part.id );
		} );

		if ( ! rows.length && '' !== block.id ) continue;
		stylePanels.push( { id: 'style_' + ( block.id || 'section' ), label: block.label, tokens: '' === block.id, rows } );
	}

	/* ------------------------------------------------------------- advanced */

	const grouped = ( list ) => {
		const groups = new Map();
		for ( const field of list ) {
			const owner = field.owner_label || field.part_label || '';
			const where = field.region ? regionLabel.get( field.region ) : '';
			const label = [ where, owner ].filter( Boolean ).join( ' › ' ) || 'Section';
			if ( ! groups.has( label ) ) groups.set( label, { kind: 'group', label, order: field.order ?? 0, controls: [] } );
			groups.get( label ).controls.push( field );
		}
		return [ ...groups.values() ].sort( ( a, b ) => a.order - b.order ).map( ( group ) => {
			dedupeControlLabels( group );
			return strip( group );
		} );
	};

	const advancedPanels = [
		{
			id: 'uew_accessibility',
			label: 'Accessibility',
			notice: 'What screen readers announce for each element. Visitors do not see these; keep them short and descriptive.',
			groups: grouped( advanced.accessibility ),
		},
		{ id: 'uew_behaviour', label: 'Links &amp; Behaviour', notice: '', groups: grouped( advanced.behaviour ) },
		{ id: 'uew_form', label: 'Form Field Rules', notice: '', groups: grouped( advanced.form ) },
		{
			id: 'uew_integration',
			label: 'Form Connection (HubSpot)',
			notice: 'These values wire the form to HubSpot and to the WordPress submission log. Changing a field <code>name</code> stops that field being saved unless the alias table in <code>class-submissions.php</code> is updated to match.',
			groups: grouped( advanced.integration ),
		},
	].filter( ( panel ) => panel.groups.length );

	return { contentPanels, stylePanels, advancedPanels, leanParts };
}

/** Drop the build-time bookkeeping a schema does not need. */
function strip( item ) {
	if ( 'group' === item.kind ) return { ...item, controls: item.controls.map( strip ) };
	if ( 'list' === item.kind ) return item;
	const { region, owner, owner_label, owner_kind, order, unseen, screen_reader, attr, css_prop, ...rest } = item;
	return rest;
}

/**
 * Number repeated control labels within a group.
 *
 * Two elements that share a CSS selector share a style panel -- correctly, they
 * are styled together -- but their content is separate, so a group can end up
 * with two controls both called "Text" and no way to tell which is which.
 */
function dedupeControlLabels( group ) {
	const counts = new Map();
	for ( const control of group.controls ) {
		counts.set( control.label, ( counts.get( control.label ) || 0 ) + 1 );
	}

	// Numbering must not mint a label the group already has: "Text", "Text 2"
	// and a second "Text" became "Text 1", "Text 2", "Text 2".
	const taken = new Set( group.controls.map( ( control ) => control.label ) );
	const seen = new Map();
	group.controls = group.controls.map( ( control ) => {
		if ( ( counts.get( control.label ) || 0 ) < 2 ) return control;
		let n = seen.get( control.label ) || 0;
		let label;
		do {
			n += 1;
			label = control.label + ' ' + n;
		} while ( taken.has( label ) );
		seen.set( control.label, n );
		taken.add( label );
		return { ...control, label };
	} );
}

/** Page order first, then the compiler's own ordering within one element. */
function sortControls( controls ) {
	return [ ...controls ].sort( ( a, b ) => ( ( a.order ?? 0 ) - ( b.order ?? 0 ) ) || ( ( a.sort || 0 ) - ( b.sort || 0 ) ) );
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
		const { contentPanels, stylePanels, advancedPanels, leanParts } = buildPanels( derived );

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
			regions: derived.regions.map( ( { id, label, portal } ) => ( { id, label, portal } ) ),
			content_panels: contentPanels,
			style_panels: stylePanels,
			advanced_panels: advancedPanels,
			repeaters: derived.repeaters,
			style_parts: derived.parts.map( ( { region_id, region_name, ancestor_ids, ...part } ) => (
				leanParts.has( part.id ) ? { ...part, features: ( part.features || [] ).filter( ( feature ) => LAYOUT_FEATURES.has( feature ) ) } : part
			) ),
			inline_styles: derived.fields.filter( ( f ) => f.control === 'inline_style_group' ),
			fields: derived.fields.filter( ( f ) => ! f.internal ).map( strip ),
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
