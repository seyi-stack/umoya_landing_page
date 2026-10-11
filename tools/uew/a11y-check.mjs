/**
 * Accessibility check: every compiled widget, as a visitor's browser sees it,
 * through axe-core (WCAG 2.0 / 2.1 / 2.2, levels A and AA).
 *
 *   node tools/uew/a11y-check.mjs [--only=site_footer,fc_form] [--verbose]
 *
 * Each widget's own test page (/uew-<section>/) is loaded, scrolled through so
 * reveal animations finish, and any dialog it carries is opened -- a dialog
 * that is never opened is never checked. Only the section itself is examined
 * (its root and any dialog it moves to <body>), so the theme around the test
 * page cannot fail it.
 *
 * Known findings that are a brand decision rather than a defect are listed in
 * ACCEPTED with the reason; they are reported but do not fail the run.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

import { BASE, findChrome, gotoWithRetry, stubExternalAssets, settle } from './lib/browser.mjs';

const here = path.dirname( fileURLToPath( import.meta.url ) );
const pluginRoot = path.resolve( here, '..', '..', 'umoya-elementor-widgets' );
const axeSource = fs.readFileSync( path.join( here, 'node_modules', 'axe-core', 'axe.min.js' ), 'utf8' );

const args = process.argv.slice( 2 );
const only = ( args.find( ( a ) => a.startsWith( '--only=' ) ) || '' ).replace( '--only=', '' );
const onlyKeys = only ? new Set( only.split( ',' ).map( ( s ) => s.trim() ) ) : null;
const verbose = args.includes( '--verbose' );

const manifest = JSON.parse( fs.readFileSync( path.join( pluginRoot, 'includes', 'sections', 'index.json' ), 'utf8' ) );
const schemaOf = ( key ) => JSON.parse( fs.readFileSync( path.join( pluginRoot, 'includes', 'sections', key + '.json' ), 'utf8' ) );

/**
 * Findings that stay, on purpose, each with a reason a reviewer can check.
 */
const ACCEPTED = [
	{
		rule: 'color-contrast',
		// The brand palette itself: terracotta text on cream (2.62:1), the darker
		// terracotta (3.5:1), white on terracotta buttons (2.97:1) and the muted
		// brown body text (4.1-4.3:1). Changing them changes the look of the
		// whole site, so it is the client's decision -- see CLAUDE.md, Phase 29.
		// Anything worse than 2.5:1 is not the palette, and still fails.
		test: ( node ) => parseFloat( ( ( node.failureSummary || '' ).match( /contrast of ([0-9.]+)/ ) || [] )[ 1 ] ) >= 2.5,
		why: 'brand palette contrast (2.6-4.4:1 against the AA 4.5:1 / 3:1), awaiting the client\'s decision -- see CLAUDE.md Phase 29.',
	},
];

function accepted( violation, node ) {
	return ACCEPTED.find( ( entry ) => entry.rule === violation.id && entry.test( node ) );
}

/** "#d97e53 on #f5f0eb (2.62:1)" from an axe contrast summary. */
function colourPair( summary ) {
	const m = String( summary ).match( /contrast of ([0-9.]+) \(foreground color: (#[0-9a-f]+), background color: (#[0-9a-f]+)/ );
	return m ? m[ 2 ] + ' on ' + m[ 3 ] + ' (' + m[ 1 ] + ':1)' : null;
}

console.log( '\nUmoya widget accessibility check' );
console.log( '================================\n' );
console.log( 'axe-core ' + JSON.parse( fs.readFileSync( path.join( here, 'node_modules', 'axe-core', 'package.json' ), 'utf8' ) ).version + ', WCAG 2.2 A + AA, on each widget\'s own test page.\n' );

const browser = await puppeteer.launch( {
	executablePath: findChrome(),
	headless: 'shell',
	args: [ '--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1' ],
} );

const results = [];
let failing = 0;

for ( const key of Object.keys( manifest ).filter( ( k ) => ! onlyKeys || onlyKeys.has( k ) ) ) {
	const schema = schemaOf( key );
	const url = BASE + '/uew-' + key.replace( /_/g, '-' ) + '/';
	const page = await browser.newPage();
	await page.setViewport( { width: 1280, height: 900, deviceScaleFactor: 1 } );
	await stubExternalAssets( page );
	const row = { key, problems: [], accepted: [], error: '' };

	try {
		await gotoWithRetry( page, url, { waitUntil: 'domcontentloaded', timeout: 60000 } );
		await page.waitForSelector( schema.root_selector, { timeout: 20000 } );
		await settle( page, 600 );

		// Finish every reveal animation: scroll the whole page through, then
		// stop transitions so nothing is measured half-faded.
		await page.evaluate( async () => {
			for ( let y = 0; y < document.body.scrollHeight; y += 400 ) {
				window.scrollTo( 0, y );
				await new Promise( ( resolve ) => setTimeout( resolve, 60 ) );
			}
			window.scrollTo( 0, 0 );
			const style = document.createElement( 'style' );
			style.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}';
			document.head.appendChild( style );
			await new Promise( ( resolve ) => setTimeout( resolve, 400 ) );
		} );

		await page.evaluate( axeSource );

		const contexts = [ schema.root_selector ];
		const runAxe = ( include ) => page.evaluate( async ( selectors ) => {
			const present = selectors.filter( ( s ) => document.querySelector( s ) );
			if ( ! present.length ) return { violations: [] };
			return window.axe.run( { include: present.map( ( s ) => [ s ] ) }, {
				runOnly: { type: 'tag', values: [ 'wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa' ] },
				resultTypes: [ 'violations' ],
			} );
		}, include );

		const found = [];
		found.push( ...( await runAxe( contexts ) ).violations );

		// Dialogs: open each the way a visitor would, then check it open.
		for ( const portal of schema.portals || [] ) {
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
			found.push( ...( await runAxe( [ portal.selector ] ) ).violations );
		}

		for ( const violation of found ) {
			for ( const node of violation.nodes ) {
				const entry = { rule: violation.id, impact: violation.impact, target: node.target.join( ' ' ), html: node.html.slice( 0, 140 ), summary: ( node.failureSummary || '' ).split( '\n' ).slice( 1, 2 ).join( '' ).trim(), pair: colourPair( node.failureSummary ) };
				( accepted( violation, node ) ? row.accepted : row.problems ).push( entry );
			}
		}
	} catch ( error ) {
		row.error = String( error.message || error ).slice( 0, 200 );
	}

	await page.close();
	if ( row.problems.length || row.error ) failing += 1;
	results.push( row );
}

await browser.close();

const pad = ( value, width ) => String( value ).padEnd( width );
console.log( pad( 'section', 26 ) + pad( 'problems', 10 ) + pad( 'accepted', 10 ) + 'result' );
console.log( '-'.repeat( 60 ) );
for ( const row of results ) {
	console.log( pad( row.key, 26 ) + pad( row.problems.length, 10 ) + pad( row.accepted.length, 10 ) + ( row.error ? 'ERROR' : row.problems.length ? 'FAIL' : 'OK' ) );
}

for ( const row of results ) {
	if ( ! row.problems.length && ! row.error && ! ( verbose && row.accepted.length ) ) continue;
	console.log( '\n--- ' + row.key + ' ---' );
	if ( row.error ) console.log( '  error: ' + row.error );
	for ( const p of row.problems ) console.log( '  [' + p.impact + '] ' + p.rule + ' at ' + p.target + '\n      ' + p.html + ( p.summary ? '\n      ' + p.summary : '' ) );
	if ( verbose ) for ( const p of row.accepted ) console.log( '  accepted: ' + p.rule + ' at ' + p.target );
}

const acceptedTotal = results.reduce( ( n, r ) => n + r.accepted.length, 0 );
if ( acceptedTotal ) {
	console.log( '\n' + acceptedTotal + ' accepted finding(s), by reason:' );
	for ( const entry of ACCEPTED ) console.log( '  ' + entry.rule + ': ' + entry.why );
	const pairs = new Map();
	for ( const row of results ) {
		for ( const p of row.accepted ) if ( p.pair ) pairs.set( p.pair, ( pairs.get( p.pair ) || 0 ) + 1 );
	}
	for ( const [ pair, count ] of [ ...pairs ].sort( ( a, b ) => b[ 1 ] - a[ 1 ] ) ) console.log( '    ' + String( count ).padStart( 4 ) + '  ' + pair );
}
console.log( '\n' + ( failing ? failing + ' section(s) have accessibility problems.' : 'No accessibility problems in any section.' ) );
process.exitCode = failing ? 1 : 0;
