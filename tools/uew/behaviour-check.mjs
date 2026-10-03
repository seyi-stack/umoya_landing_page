/**
 * Behaviour check: does each section's own script still work once an editor
 * has added or removed list items?
 *
 *   node tools/uew/behaviour-check.mjs [--only=fc_early_access,ab_who]
 *
 * The edit check proves the MARKUP is right after "Add Item" or "Delete". This
 * proves the BEHAVIOUR is: a slideshow that indexes its dots by slide number,
 * an accordion that pairs buttons with panels by id, a carousel counting its
 * cards. The Founder's Circle slideshow used to keep slides and dots in
 * separate lists, and a slide added without a dot threw on its first turn.
 *
 * For every section that has a script and a list, two pages: every list one
 * row longer (the new row exactly as "Add Item" fills it), and every list one
 * row shorter. On each it clicks through every arrow, dot, tab and accordion
 * trigger -- buttons only, never links or submits -- lets auto-advancing
 * slideshows turn, and fails on any page error. It also checks that each
 * merged list (a slide and its dot) still renders the same number of items in
 * every place.
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

/** Rows exactly as Section_Widget::repeater_defaults() builds them. */
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

/** A row as Elementor's "Add Item" creates it: every control at its default. */
function addedRow( definition, n ) {
	const row = { _id: 'uewadd' + n };
	for ( const field of definition.controls ) {
		const value = field.default ?? '';
		row[ field.id ] = ( 'url' === field.control || 'media' === field.control ) ? { url: value } : value;
	}
	return row;
}

function variantSettings( schema, variant ) {
	const settings = {};
	schema.repeaters.forEach( ( definition, index ) => {
		const rows = defaultRows( definition );
		if ( 'more' === variant ) {
			settings[ definition.id ] = rows.concat( [ addedRow( definition, index + 1 ) ] );
		} else if ( rows.length > 1 ) {
			settings[ definition.id ] = rows.slice( 0, rows.length - 1 );
		}
	} );
	return settings;
}

/** Runs in the page: click every safe control in the section, in order. */
async function exercise( rootSelector, rounds ) {
	const root = document.querySelector( rootSelector );
	if ( ! root ) return { clicked: 0, error: 'root missing' };

	const isSafe = ( element ) => {
		if ( element.closest( 'form' ) && 'submit' === ( element.getAttribute( 'type' ) || 'submit' ).toLowerCase() && 'BUTTON' === element.tagName ) return false;
		if ( 'A' === element.tagName ) return false;
		// CookieYes triggers hand off to a third-party panel. Without CookieYes
		// -- always, in the harness -- their designed fallback leaves the page
		// (footer) or raises an alert (Cookie Policy), so they are not ours to
		// exercise here.
		if ( element.classList.contains( 'cky-banner-element' ) ) return false;
		return true;
	};
	const controls = Array.from( root.querySelectorAll( 'button, [role="tab"], [aria-expanded]' ) ).filter( isSafe );

	let clicked = 0;
	for ( let round = 0; round < rounds; round += 1 ) {
		for ( const control of controls ) {
			if ( ! control.isConnected ) continue;
			control.click();
			clicked += 1;
			await new Promise( ( resolve ) => setTimeout( resolve, 30 ) );
		}
	}
	// Close anything a click opened, so the next page starts clean.
	document.dispatchEvent( new KeyboardEvent( 'keydown', { key: 'Escape', bubbles: true } ) );
	return { clicked };
}

/** Runs in the page: each merged list must render the same count everywhere. */
function countLoops( rowIds ) {
	return rowIds.map( ( ids ) => ids.map( ( id ) => document.querySelectorAll( '.elementor-repeater-item-' + id ).length ) );
}

/* -------------------------------------------------------------------- main */

console.log( '\nUmoya widget behaviour check' );
console.log( '============================\n' );
console.log( 'Every list one longer, then one shorter; every arrow, dot, tab and trigger clicked through.\n' );

const keys = Object.keys( manifest ).filter( ( key ) => {
	if ( onlyKeys && ! onlyKeys.has( key ) ) return false;
	const schema = schemaOf( key );
	return schema.script && schema.repeaters.length;
} );

const job = { pages: [] };
const plans = {};
for ( const key of keys ) {
	const schema = schemaOf( key );
	plans[ key ] = { schema, variants: {} };
	for ( const variant of [ 'more', 'fewer' ] ) {
		const settings = variantSettings( schema, variant );
		const slug = 'uew-behaviour-' + key.replace( /_/g, '-' ) + '-' + variant;
		plans[ key ].variants[ variant ] = { slug, settings };
		job.pages.push( { slug, title: 'UEW behaviour: ' + schema.title + ' (' + variant + ')', widgets: [ { name: schema.name, settings } ] } );
	}
}

const jobFile = path.join( os.tmpdir(), 'uew-behaviour-check-' + process.pid + '.json' );
fs.writeFileSync( jobFile, JSON.stringify( job ), 'utf8' );
let pages;
try {
	const raw = wp( repoRoot, [ 'eval-file', path.join( here, 'make-pages.php' ), jobFile ] );
	pages = JSON.parse( raw.slice( raw.indexOf( '{' ) ) );
} catch ( error ) {
	console.error( 'Could not create behaviour pages:\n' + ( error.stdout || '' ) + ( error.stderr || error.message ) );
	process.exit( 1 );
} finally {
	fs.rmSync( jobFile, { force: true } );
}

const browser = await puppeteer.launch( {
	executablePath: findChrome(),
	headless: 'shell',
	args: [ '--no-sandbox', '--disable-dev-shm-usage' ],
} );

const rows = [];
let failures = 0;

for ( const key of keys ) {
	const { schema, variants } = plans[ key ];
	const row = { key, results: {}, problems: [] };

	for ( const variant of [ 'more', 'fewer' ] ) {
		const { slug, settings } = variants[ variant ];
		const entry = pages[ slug ];
		if ( ! entry ) {
			row.problems.push( variant + ': no page' );
			continue;
		}

		const page = await browser.newPage();
		await page.setViewport( { width: 1440, height: 900 } );
		await stubExternalAssets( page );
		const errors = [];
		page.on( 'pageerror', ( error ) => errors.push( String( error ).slice( 0, 200 ) ) );
		// A dialog blocks the page until answered, which would hang the run
		// rather than report anything. Dismiss it, and say it happened.
		const dialogs = [];
		page.on( 'dialog', async ( dialog ) => {
			dialogs.push( dialog.type() + ': ' + dialog.message().slice( 0, 100 ) );
			await dialog.dismiss().catch( () => {} );
		} );

		try {
			await gotoWithRetry( page, entry.url, { waitUntil: 'domcontentloaded', timeout: 60000 } );
			await page.waitForSelector( schema.root_selector, { timeout: 20000 } );
			await settle( page, 600 );

			const ready = await page.evaluate( ( selector ) => {
				const root = document.querySelector( selector );
				return root ? root.getAttribute( 'data-uew-ready' ) : null;
			}, schema.root_selector );
			if ( '1' !== ready ) row.problems.push( variant + ': the section script did not initialise' );

			// Two rounds through every control, so a slideshow wraps past its
			// new last item and back to the first.
			const longest = Math.max( 1, ...schema.repeaters.map( ( r ) => r.rows.length + 1 ) );
			const exercised = await page.evaluate( exercise, schema.root_selector, Math.min( 3, Math.ceil( ( longest + 1 ) / 3 ) + 1 ) );

			// Let auto-advancing slideshows (5 s clocks) turn at least once.
			await new Promise( ( resolve ) => setTimeout( resolve, 5600 ) );

			// Merged lists: a slide and its dot are one row, so every place a
			// row renders must have the same count.
			const merged = schema.repeaters.filter( ( r ) => ( r.loops || 1 ) > 1 );
			if ( merged.length ) {
				const ids = merged.map( ( r ) => ( settings[ r.id ] || [] ).map( ( item ) => item._id ) );
				const counts = await page.evaluate( countLoops, ids );
				merged.forEach( ( r, index ) => {
					const off = counts[ index ].filter( ( count ) => count !== r.loops );
					if ( off.length ) row.problems.push( variant + ': "' + r.label + '" rows render in ' + off.join( '/' ) + ' places, expected ' + r.loops );
				} );
			}

			row.results[ variant ] = exercised.clicked;
		} catch ( error ) {
			row.problems.push( variant + ': ' + String( error.message || error ).slice( 0, 180 ) );
		}

		for ( const error of errors ) row.problems.push( variant + ': page error -- ' + error );
		for ( const dialog of dialogs ) row.problems.push( variant + ': a click raised a ' + dialog );
		await page.close().catch( () => {} );
	}

	if ( row.problems.length ) failures += 1;
	rows.push( row );
}

await browser.close();

const pad = ( value, width ) => String( value ).padEnd( width );
console.log( pad( 'section', 26 ) + pad( 'lists', 7 ) + pad( 'clicks +1', 11 ) + pad( 'clicks -1', 11 ) + 'result' );
console.log( '-'.repeat( 68 ) );
for ( const row of rows ) {
	const schema = plans[ row.key ].schema;
	console.log(
		pad( row.key, 26 ) + pad( schema.repeaters.length, 7 ) + pad( row.results.more ?? '-', 11 ) + pad( row.results.fewer ?? '-', 11 ) +
		( row.problems.length ? row.problems.length + ' PROBLEM(S)' : 'OK' )
	);
}
for ( const row of rows ) {
	if ( ! row.problems.length ) continue;
	console.log( '\n--- ' + row.key + ' ---' );
	for ( const problem of row.problems ) console.log( '  ' + problem );
}

console.log( '\n' + ( failures ? failures + ' section(s) misbehave once their lists change.' : 'Every section still works with items added and removed.' ) );
process.exitCode = failures ? 1 : 0;
