/**
 * Control-reach check: does every Style-tab panel actually style its element?
 *
 *   node tools/uew/control-check.mjs [--only=home_form_popup,site_footer]
 *
 * Every style control is an Elementor `selectors` entry, and Elementor will
 * happily write a rule for a selector that matches nothing. The other checks
 * never set a style control, so a dead selector passed all of them -- and the
 * inquiry popups shipped with an entire Style tab that did nothing, because the
 * dialog moves itself to <body>, out from under the widget wrapper every rule
 * is scoped to.
 *
 * So, per section, one page with a DIFFERENT value set on every panel at once:
 *
 *   panels     each style panel's Opacity gets a unique value (0.301, 0.302…)
 *   tokens     each design token gets a unique value
 *   rows       each repeater's first row gets a unique "This row only" colour
 *
 * Then, in a real browser, AFTER the section's own script has run and any
 * dialog has been opened (and so moved to <body>), it reads the computed style
 * of the elements each panel is meant for. A panel whose selector matches
 * nothing, or whose value never arrives, is reported by name.
 *
 * A value that loses to an inline `style` attribute is reported separately:
 * that is how inline styles work, and those properties have their own panel
 * (Inline Styles) that writes the attribute itself.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

import { findChrome, gotoWithRetry, stubExternalAssets, settle, wp } from './lib/browser.mjs';

const here = path.dirname( fileURLToPath( import.meta.url ) );
const repoRoot = path.resolve( here, '..', '..' );
const pluginRoot = path.join( repoRoot, 'umoya-elementor-widgets' );

const args = process.argv.slice( 2 );
const only = ( args.find( ( a ) => a.startsWith( '--only=' ) ) || '' ).replace( '--only=', '' );
const onlyKeys = only ? new Set( only.split( ',' ).map( ( s ) => s.trim() ) ) : null;

const manifest = JSON.parse( fs.readFileSync( path.join( pluginRoot, 'includes', 'sections', 'index.json' ), 'utf8' ) );
const schemaOf = ( key ) => JSON.parse( fs.readFileSync( path.join( pluginRoot, 'includes', 'sections', key + '.json' ), 'utf8' ) );

/* ----------------------------------------------------------------- probes */

/** Repeater rows exactly as Section_Widget::repeater_defaults() builds them. */
function defaultRows( definition ) {
	return definition.rows.map( ( row, index ) => {
		const prepared = { _id: crypto.createHash( 'md5' ).update( definition.id + '|' + index ).digest( 'hex' ).slice( 0, 7 ) };
		for ( const field of definition.controls ) {
			const value = row[ field.id ] ?? field.default ?? '';
			prepared[ field.id ] = ( 'url' === field.control || 'media' === field.control ) ? { url: value } : value;
		}
		return prepared;
	} );
}

/** Opacity probes are 0.301, 0.302 …; three decimals keeps them exact. */
const opacityProbe = ( index ) => Math.round( ( 0.301 + index * 0.001 ) * 1000 ) / 1000;

function buildProbes( key, schema ) {
	const settings = {};
	const probes = { parts: [], tokens: [], rows: [] };
	const root = schema.root_selector;

	schema.style_parts.forEach( ( part, index ) => {
		const full = part.absolute ? part.selector : ( part.selector ? root + ' ' + part.selector : root );
		if ( ( part.features || [] ).includes( 'effects' ) ) {
			const value = opacityProbe( index );
			settings[ part.id + '_opacity' ] = { unit: 'px', size: value, sizes: [] };
			probes.parts.push( { id: part.id, label: part.label, full, value } );
		} else {
			probes.parts.push( { id: part.id, label: part.label, full, value: null } );
		}
	} );

	schema.tokens.forEach( ( token, index ) => {
		const value = 'color' === token.kind ? 'rgb(1, 2, ' + ( index + 1 ) + ')' : 'uew-token-probe-' + ( index + 1 );
		settings[ token.id ] = value;
		probes.tokens.push( { id: token.id, name: token.name, label: token.label, selectors: token.selectors || [ root ], value } );
	} );

	schema.repeaters.forEach( ( definition, index ) => {
		const rows = defaultRows( definition );
		if ( ! rows.length ) return;
		const value = 'rgb(3, 4, ' + ( index + 1 ) + ')';
		rows[ 0 ].uew_row_color = value;
		settings[ definition.id ] = rows;
		probes.rows.push( { id: definition.id, label: definition.label, rowId: rows[ 0 ]._id, value } );
	} );

	// Photos painted from the stylesheet: their control writes CSS, so it is
	// read back from the element -- or pseudo-element -- the rule paints.
	probes.backgrounds = [];
	schema.fields.filter( ( field ) => field.css_only && field.css_selector ).forEach( ( field, index ) => {
		const url = 'https://example.com/uew-probe-background-' + ( index + 1 ) + '.png';
		settings[ field.id ] = { url, id: '' };
		const pseudo = ( field.css_selector.match( /::?(before|after)\b/ ) || [] )[ 0 ] || null;
		probes.backgrounds.push( {
			id: field.id,
			label: field.label,
			element: field.css_selector.replace( /::?(before|after)\b/, '' ).replace( /:(hover|focus|active|focus-visible)\b/g, '' ).trim(),
			pseudo: pseudo ? '::' + pseudo.replace( /^:+/, '' ) : null,
			url,
			// A new photo must keep any overlay layered over the old one.
			keepsGradient: /gradient\(/.test( field.css_value || '' ),
		} );
	} );

	return { settings, probes };
}

/* ------------------------------------------------------------- in-browser */

/** Runs in the page: read back every probe. */
function readProbes( probes ) {
	const near = ( a, b ) => Math.abs( a - b ) < 0.0004;
	const out = { parts: [], tokens: [], rows: [] };

	// Which panel does an opacity value belong to? Lets a mismatch say which
	// other panel's rule won, rather than just "wrong value".
	const byValue = new Map( probes.parts.filter( ( p ) => p.value !== null ).map( ( p ) => [ p.value, p ] ) );

	for ( const part of probes.parts ) {
		if ( null === part.value ) {
			out.parts.push( { id: part.id, label: part.label, status: 'no-probe' } );
			continue;
		}

		let elements;
		try {
			elements = Array.from( document.querySelectorAll( part.full ) );
		} catch ( error ) {
			out.parts.push( { id: part.id, label: part.label, full: part.full, status: 'bad-selector', detail: String( error ) } );
			continue;
		}

		if ( ! elements.length ) {
			out.parts.push( { id: part.id, label: part.label, full: part.full, status: 'dead' } );
			continue;
		}

		const misses = [];
		let shadowed = 0;
		let inline = 0;
		for ( const element of elements ) {
			const actual = parseFloat( getComputedStyle( element ).opacity );
			if ( near( actual, part.value ) ) continue;

			if ( element.style && '' !== element.style.opacity ) {
				inline += 1;
				continue;
			}

			// Another panel's value, from a panel whose selector also matches
			// this element: a more specific panel won, which is correct.
			const winner = [ ...byValue.entries() ].find( ( [ value ] ) => near( value, actual ) );
			if ( winner && element.matches( winner[ 1 ].full ) ) {
				shadowed += 1;
				continue;
			}

			misses.push( '<' + element.tagName.toLowerCase() + ( element.className && 'string' === typeof element.className ? '.' + element.className.trim().split( /\s+/ ).join( '.' ) : '' ) + '> opacity ' + actual );
		}

		out.parts.push( {
			id: part.id,
			label: part.label,
			full: part.full,
			matched: elements.length,
			status: misses.length ? 'unreached' : ( inline === elements.length ? 'inline' : 'ok' ),
			shadowed,
			inline,
			detail: misses.slice( 0, 3 ).join( '; ' ),
		} );
	}

	for ( const token of probes.tokens ) {
		const failures = [];
		let checked = 0;
		for ( const selector of token.selectors ) {
			// A token declared under a state (`:hover`) cannot be read without
			// that state; it is the same rule, so the plain declarations stand in.
			if ( /:(hover|focus|active|focus-visible|focus-within)\b/.test( selector ) ) continue;
			let elements = [];
			try {
				elements = Array.from( document.querySelectorAll( selector ) );
			} catch ( error ) {
				failures.push( selector + ' is not a valid selector' );
				continue;
			}
			if ( ! elements.length ) {
				failures.push( selector + ' matches nothing' );
				continue;
			}
			for ( const element of elements ) {
				checked += 1;
				const actual = getComputedStyle( element ).getPropertyValue( '--' + token.name ).trim();
				if ( actual !== token.value ) failures.push( selector + ' has --' + token.name + ': ' + ( actual || '(unset)' ) );
			}
		}
		out.tokens.push( { id: token.id, label: token.label, status: failures.length ? 'unreached' : 'ok', checked, detail: failures.slice( 0, 2 ).join( '; ' ) } );
	}

	for ( const row of probes.rows ) {
		const element = document.querySelector( '.elementor-repeater-item-' + row.rowId );
		if ( ! element ) {
			out.rows.push( { id: row.id, label: row.label, status: 'dead' } );
			continue;
		}
		const actual = getComputedStyle( element ).color;
		out.rows.push( { id: row.id, label: row.label, status: actual === row.value ? 'ok' : 'unreached', detail: actual === row.value ? '' : 'color ' + actual } );
	}

	out.backgrounds = [];
	for ( const background of probes.backgrounds || [] ) {
		const element = document.querySelector( background.element );
		if ( ! element ) {
			out.backgrounds.push( { id: background.id, label: background.label, status: 'dead', detail: background.element + ' matches nothing' } );
			continue;
		}
		const actual = getComputedStyle( element, background.pseudo ).backgroundImage;
		const arrived = actual.includes( background.url );
		const overlay = ! background.keepsGradient || /gradient\(/.test( actual );
		const ok = arrived && overlay;
		out.backgrounds.push( {
			id: background.id,
			label: background.label,
			status: ok ? 'ok' : 'unreached',
			detail: ok ? '' : background.element + ( background.pseudo || '' ) + ( arrived ? ' lost its overlay: ' : ' shows ' ) + actual.slice( 0, 120 ),
		} );
	}

	return out;
}

/** Open each portal the way a visitor would, injecting a trigger if the page has none. */
async function openPortals( page, portals ) {
	for ( const portal of portals || [] ) {
		if ( ! portal.trigger ) continue;
		await page.evaluate( ( trigger ) => {
			let element = document.querySelector( trigger );
			if ( ! element ) {
				const attribute = ( trigger.match( /^\[([A-Za-z0-9_-]+)\]$/ ) || [] )[ 1 ];
				if ( ! attribute ) return;
				element = document.createElement( 'button' );
				element.type = 'button';
				element.setAttribute( attribute, '' );
				element.textContent = 'uew portal trigger';
				document.body.insertBefore( element, document.body.firstChild );
			}
			element.click();
		}, portal.trigger );
		await new Promise( ( resolve ) => setTimeout( resolve, 700 ) );
	}
}

/* -------------------------------------------------------------------- main */

console.log( '\nUmoya widget control-reach check' );
console.log( '================================\n' );
console.log( 'Setting every style panel, design token and row colour at once, then reading them back in a browser.\n' );

const keys = Object.keys( manifest ).filter( ( key ) => ! onlyKeys || onlyKeys.has( key ) );
const plans = {};
const job = { pages: [] };
for ( const key of keys ) {
	const schema = schemaOf( key );
	const { settings, probes } = buildProbes( key, schema );
	const slug = 'uew-probe-' + key.replace( /_/g, '-' );
	plans[ key ] = { schema, probes, slug };
	job.pages.push( { slug, title: 'UEW probe: ' + schema.title, widgets: [ { name: schema.name, settings } ] } );
}

const jobFile = path.join( os.tmpdir(), 'uew-control-check-' + process.pid + '.json' );
fs.writeFileSync( jobFile, JSON.stringify( job ), 'utf8' );
let pages;
try {
	const raw = wp( repoRoot, [ 'eval-file', path.join( here, 'make-pages.php' ), jobFile ] );
	pages = JSON.parse( raw.slice( raw.indexOf( '{' ) ) );
} catch ( error ) {
	console.error( 'Could not create probe pages:\n' + ( error.stdout || '' ) + ( error.stderr || error.message ) );
	process.exit( 1 );
} finally {
	fs.rmSync( jobFile, { force: true } );
}

const browser = await puppeteer.launch( {
	executablePath: findChrome(),
	headless: 'shell',
	args: [ '--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1' ],
} );

const rows = [];
let failures = 0;

for ( const key of keys ) {
	const { schema, probes, slug } = plans[ key ];
	const entry = pages[ slug ];
	const row = { key, problems: [], notes: [] };

	if ( ! entry ) {
		row.problems.push( 'no probe page was created' );
		rows.push( row );
		failures += 1;
		continue;
	}

	const page = await browser.newPage();
	await page.setViewport( { width: 1440, height: 900, deviceScaleFactor: 1 } );
	await stubExternalAssets( page );
	const errors = [];
	page.on( 'pageerror', ( error ) => errors.push( String( error ).slice( 0, 160 ) ) );

	try {
		await gotoWithRetry( page, entry.url, { waitUntil: 'domcontentloaded', timeout: 60000 } );
		await page.waitForSelector( schema.root_selector, { timeout: 20000 } );
		await settle( page, 900 );
		await openPortals( page, schema.portals );

		const result = await page.evaluate( readProbes, probes );
		row.result = result;

		for ( const part of result.parts ) {
			if ( 'dead' === part.status ) row.problems.push( 'panel "' + part.label + '": selector ' + part.full + ' matches nothing' );
			if ( 'bad-selector' === part.status ) row.problems.push( 'panel "' + part.label + '": invalid selector ' + part.full );
			if ( 'unreached' === part.status ) row.problems.push( 'panel "' + part.label + '" (' + part.full + '): value never arrives -- ' + part.detail );
			if ( 'inline' === part.status ) row.notes.push( 'panel "' + part.label + '": an inline style attribute decides opacity here (use the Inline Styles panel)' );
		}
		for ( const token of result.tokens ) {
			if ( 'ok' !== token.status ) row.problems.push( 'token "' + token.label + '": ' + token.detail );
		}
		for ( const repeater of result.rows ) {
			if ( 'dead' === repeater.status ) row.problems.push( 'repeater "' + repeater.label + '": its first row has no row hook in the page' );
			if ( 'unreached' === repeater.status ) row.problems.push( 'repeater "' + repeater.label + '": "This row only" colour never arrives -- ' + repeater.detail );
		}
		for ( const background of result.backgrounds ) {
			if ( 'ok' !== background.status ) row.problems.push( 'control "' + background.label + '": ' + background.detail );
		}
	} catch ( error ) {
		row.problems.push( String( error.message || error ).slice( 0, 200 ) );
	}

	for ( const error of errors ) row.problems.push( 'page error: ' + error );

	await page.close();
	if ( row.problems.length ) failures += 1;
	rows.push( row );
}

await browser.close();

const pad = ( value, width ) => String( value ).padEnd( width );
console.log( pad( 'section', 26 ) + pad( 'panels', 10 ) + pad( 'tokens', 9 ) + pad( 'rows', 7 ) + 'result' );
console.log( '-'.repeat( 66 ) );
for ( const row of rows ) {
	const r = row.result || { parts: [], tokens: [], rows: [] };
	const okParts = r.parts.filter( ( p ) => 'ok' === p.status || 'inline' === p.status ).length;
	const okTokens = r.tokens.filter( ( t ) => 'ok' === t.status ).length;
	const okRows = r.rows.filter( ( t ) => 'ok' === t.status ).length;
	console.log(
		pad( row.key, 26 ) + pad( okParts + '/' + r.parts.length, 10 ) + pad( okTokens + '/' + r.tokens.length, 9 ) +
		pad( okRows + '/' + r.rows.length, 7 ) + ( row.problems.length ? row.problems.length + ' PROBLEM(S)' : 'OK' )
	);
}

for ( const row of rows ) {
	if ( ! row.problems.length && ! row.notes.length ) continue;
	console.log( '\n--- ' + row.key + ' ---' );
	for ( const problem of row.problems.slice( 0, 30 ) ) console.log( '  ' + problem );
	if ( row.problems.length > 30 ) console.log( '  … ' + ( row.problems.length - 30 ) + ' more' );
	for ( const note of row.notes ) console.log( '  note: ' + note );
}

console.log( '\n' + ( failures ? failures + ' section(s) have style controls that do not reach their element.' : 'Every style panel, token and row colour reaches the element it is for.' ) );
process.exitCode = failures ? 1 : 0;
