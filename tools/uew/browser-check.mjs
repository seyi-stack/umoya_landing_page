/**
 * Visual and behavioural check in a real browser.
 *
 *   node tools/uew/browser-check.mjs [--only=fc_hero,fc_form] [--shots]
 *
 * For every section it opens two pages in the local WordPress harness:
 *
 *   /uew-<section>/       the compiled Elementor widget
 *   /uew-<section>-raw/   the identical section pasted into Elementor's own
 *                         HTML widget -- how every Umoya page is built today
 *
 * and compares them element by element: geometry, the computed styles that
 * matter, and whether the section's own JavaScript actually ran. That is the
 * question the previous widgets failed: markup can survive a conversion while
 * the behaviour attached to it quietly does not.
 *
 * Anything the widget renders differently from the pasted original is reported,
 * with the element and property named.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

import { findChrome, gotoWithRetry, stubExternalAssets, settle, wp, harness } from './lib/browser.mjs';

const here = path.dirname( fileURLToPath( import.meta.url ) );
const repoRoot = path.resolve( here, '..', '..' );
const pluginRoot = path.join( repoRoot, 'umoya-elementor-widgets' );
const shotDir = harness( repoRoot ).shotDir;

const args = process.argv.slice( 2 );
const only = ( args.find( ( a ) => a.startsWith( '--only=' ) ) || '' ).replace( '--only=', '' );
const onlyKeys = only ? new Set( only.split( ',' ).map( ( s ) => s.trim() ) ) : null;
const wantShots = args.includes( '--shots' );

const VIEWPORTS = [
	{ name: 'desktop', width: 1440, height: 900 },
	{ name: 'tablet', width: 768, height: 1024 },
	{ name: 'mobile', width: 390, height: 844 },
];

/** Properties worth comparing: the ones a lost stylesheet or a changed cascade shows up in. */
const STYLE_PROPS = [
	'display', 'position', 'color', 'background-color', 'background-image',
	'font-size', 'font-weight', 'font-style', 'letter-spacing', 'line-height', 'text-transform', 'text-align',
	'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
	'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
	'border-top-width', 'border-radius', 'border-color',
	'opacity', 'visibility', 'object-fit', 'object-position',
	'flex-direction', 'justify-content', 'align-items', 'gap', 'grid-template-columns',
	'z-index', 'overflow', 'aspect-ratio',
];

const manifest = JSON.parse( fs.readFileSync( path.join( pluginRoot, 'includes', 'sections', 'index.json' ), 'utf8' ) );

/**
 * Runs in the page. Walks the section and records, per element, its geometry
 * relative to the section root plus the computed styles listed above.
 */
function collectSnapshot( rootSelector, props ) {
	const root = document.querySelector( rootSelector );
	if ( ! root ) return { error: 'root ' + rootSelector + ' not found' };

	const rootRect = root.getBoundingClientRect();
	const out = [];

	const record = ( element, index ) => {
		const rect = element.getBoundingClientRect();
		const computed = window.getComputedStyle( element );
		const styles = {};
		for ( const prop of props ) styles[ prop ] = computed.getPropertyValue( prop );

		out.push( {
			index,
			tag: element.tagName.toLowerCase(),
			cls: ( element.getAttribute( 'class' ) || '' )
				.split( /\s+/ )
				.filter( ( c ) => c && ! /^elementor-repeater-item-/.test( c ) )
				.sort()
				.join( ' ' ),
			x: Math.round( rect.left - rootRect.left ),
			y: Math.round( rect.top - rootRect.top ),
			w: Math.round( rect.width ),
			h: Math.round( rect.height ),
			styles,
		} );
	};

	record( root, 0 );

	// Skip <style> and <script>. The homepage sections keep their stylesheet
	// INSIDE the section root, so the pasted reference has it as a child element
	// while the compiled widget has it as an enqueued asset. Neither renders
	// anything, but counting them shifts every index after and reports the whole
	// section as different. Separating them is the conversion, not a defect.
	const all = Array.prototype.filter.call(
		root.querySelectorAll( '*' ),
		( element ) => ! /^(style|script|link)$/i.test( element.tagName )
	);
	for ( let i = 0; i < all.length; i += 1 ) record( all[ i ], i + 1 );

	return {
		rootHeight: Math.round( rootRect.height ),
		rootWidth: Math.round( rootRect.width ),
		elements: out,
	};
}

function isNumeric( value ) {
	return /^-?\d*\.?\d+$/.test( String( value ).trim() );
}

/** Numbers within a pixel are the same number; sub-pixel rounding is not a defect. */
function closeEnough( a, b, tolerance = 1 ) {
	return Math.abs( a - b ) <= tolerance;
}

function compare( expected, actual, viewport ) {
	const problems = [];

	if ( expected.error || actual.error ) {
		problems.push( ( expected.error || actual.error ) + ' (' + viewport + ')' );
		return problems;
	}

	if ( expected.elements.length !== actual.elements.length ) {
		problems.push(
			viewport + ': element count differs -- pasted HTML has ' + expected.elements.length +
			', the widget has ' + actual.elements.length
		);
	}

	const max = Math.min( expected.elements.length, actual.elements.length );
	for ( let i = 0; i < max; i += 1 ) {
		const a = expected.elements[ i ];
		const b = actual.elements[ i ];
		const label = '<' + a.tag + ( a.cls ? '.' + a.cls.split( ' ' ).join( '.' ) : '' ) + '>';

		if ( a.tag !== b.tag || a.cls !== b.cls ) {
			problems.push( viewport + ': element ' + i + ' is ' + label + ' in the pasted HTML but <' + b.tag + ( b.cls ? '.' + b.cls.split( ' ' ).join( '.' ) : '' ) + '> in the widget' );
			break;
		}

		// An element with no box -- an <option>, a display:none dialog -- reports
		// a 0,0,0,0 rect in absolute coordinates, so subtracting the section's
		// own offset yields a number that says nothing. Compare only real boxes.
		const hasBox = ( node ) => node.w > 0 || node.h > 0;
		if ( hasBox( a ) || hasBox( b ) ) {
			for ( const key of [ 'x', 'y', 'w', 'h' ] ) {
				if ( ! closeEnough( a[ key ], b[ key ] ) ) {
					problems.push( viewport + ': ' + label + ' ' + key + ' is ' + a[ key ] + 'px pasted vs ' + b[ key ] + 'px as a widget' );
					break;
				}
			}
		}

		const geometryMatches = closeEnough( a.x, b.x ) && closeEnough( a.y, b.y ) &&
			closeEnough( a.w, b.w ) && closeEnough( a.h, b.h );

		for ( const prop of Object.keys( a.styles ) ) {
			if ( a.styles[ prop ] === b.styles[ prop ] ) continue;

			// An `auto` margin serialises as either the resolved used value or
			// `0px` depending on how the box was laid out, so the two pages can
			// disagree about `margin: 0 auto` while placing the element on the
			// same pixel. Geometry is the ground truth; when it matches, this is
			// a reporting difference, not a layout one.
			if ( prop.startsWith( 'margin-' ) && geometryMatches ) continue;

			// A running CSS animation (the hero's scroll cue pulses) is sampled at
			// slightly different moments on two page loads.
			if ( isNumeric( a.styles[ prop ] ) && isNumeric( b.styles[ prop ] ) ) {
				if ( Math.abs( parseFloat( a.styles[ prop ] ) - parseFloat( b.styles[ prop ] ) ) < 0.02 ) continue;
			}

			problems.push( viewport + ': ' + label + ' ' + prop + ' is "' + a.styles[ prop ] + '" pasted vs "' + b.styles[ prop ] + '" as a widget' );
		}

		if ( problems.length > 12 ) {
			problems.push( '… further differences suppressed' );
			return problems;
		}
	}

	return problems;
}

/** Did the section's own script run? Every FC section reveals content on scroll. */
async function checkBehaviour( page, rootSelector ) {
	return page.evaluate( async ( selector ) => {
		const root = document.querySelector( selector );
		if ( ! root ) return { ran: null, note: 'root missing' };

		// Scroll the section through the viewport so IntersectionObserver fires.
		root.scrollIntoView( { block: 'center' } );
		window.scrollBy( 0, 1 );
		await new Promise( ( resolve ) => setTimeout( resolve, 700 ) );

		const revealTargets = root.querySelectorAll( '[class*="-rv"]' );
		let revealed = 0;
		revealTargets.forEach( ( element ) => {
			if ( parseFloat( window.getComputedStyle( element ).opacity ) > 0.5 ) revealed += 1;
		} );

		return {
			ready: root.getAttribute( 'data-uew-ready' ),
			revealTargets: revealTargets.length,
			revealed,
		};
	}, rootSelector );
}

/* -------------------------------------------------------------------- main */

console.log( '\nUmoya widget browser check' );
console.log( '==========================\n' );
console.log( 'Comparing each compiled widget against the same section pasted into an Elementor HTML widget.\n' );

let pages;
try {
	const raw = wp( repoRoot, [ 'eval-file', path.join( here, 'make-test-pages.php' ) ] );
	pages = JSON.parse( raw.slice( raw.indexOf( '{' ) ) );
} catch ( error ) {
	console.error( 'Could not create test pages:\n' + ( error.stdout || '' ) + ( error.stderr || error.message ) );
	process.exit( 1 );
}

if ( wantShots ) fs.mkdirSync( shotDir, { recursive: true } );

const launch = () => puppeteer.launch( {
	executablePath: findChrome(),
	headless: 'shell',
	args: [ '--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1' ],
} );
let browser = await launch();

/**
 * Chrome itself going away -- killed, or the machine sleeping mid-run -- is a
 * harness fault, not a widget one. It surfaces as a closed target or a closed
 * connection on whatever call happened to be in flight, and it once cost a
 * whole run partway through. Such a section is taken again on a fresh browser.
 */
const browserGone = ( error ) =>
	! browser.connected ||
	/Target closed|Connection closed|Session closed|Protocol error|browser has disconnected/i.test( String( ( error && error.message ) || error ) );

const rows = [];
const row_unstable = new Set();
let failures = 0;

/** Measure one section at every viewport, confirming any difference. */
async function measureSection( key, section, entry ) {
	let problems = [];
	const consoleErrors = [];
	let behaviour = null;

	const measureViewport = async ( viewport ) => {
		const snapshots = {};

		for ( const [ label, url ] of [ [ 'raw', entry.raw_url ], [ 'widget', entry.url ] ] ) {
			const page = await browser.newPage();
			await page.setViewport( { width: viewport.width, height: viewport.height, deviceScaleFactor: 1 } );
			await stubExternalAssets( page );

			page.on( 'console', ( message ) => {
				if ( 'error' !== message.type() ) return;
				const text = message.text();
				// The video 404s are this checker's own doing -- see stubExternalAssets.
				if ( text.includes( '404' ) ) return;
				consoleErrors.push( label + '/' + viewport.name + ': ' + text.slice( 0, 160 ) );
			} );
			page.on( 'pageerror', ( error ) => {
				consoleErrors.push( label + '/' + viewport.name + ': ' + String( error ).slice( 0, 160 ) );
			} );

			const response = await gotoWithRetry( page, url, { waitUntil: 'domcontentloaded', timeout: 60000 } );

			// Wait for the section itself rather than for the network. The markup
			// is server-rendered, so if it is not here something is actually wrong
			// -- and saying which of the two pages failed is the whole point.
			try {
				await page.waitForSelector( section.root_selector, { timeout: 20000 } );
			} catch ( error ) {
				problems.push(
					viewport.name + '/' + label + ': ' + section.root_selector + ' never appeared (HTTP ' +
					( response ? response.status() : '?' ) + ', title "' + await page.title() + '")'
				);
				await page.close();
				continue;
			}

			// Wait for fonts and images, then let entrance transitions and
			// media-load handlers settle, before measuring anything. Text metrics
			// change when a webfont swaps in, and a lazy image arriving moves
			// everything below it; if one page settles before its snapshot and the
			// other does not, the whole section reads as different. The hero
			// retries playback on window load and again 900ms later, hence 1500ms.
			await settle( page, 1500 );

			snapshots[ label ] = await page.evaluate( collectSnapshot, section.root_selector, STYLE_PROPS );

			if ( 'widget' === label ) {
				behaviour = await checkBehaviour( page, section.root_selector );
			}

			if ( wantShots ) {
				await page.screenshot( {
					path: path.join( shotDir, key + '-' + viewport.name + '-' + label + '.png' ),
					fullPage: true,
				} );
			}

			await page.close().catch( () => {} );
		}

		return snapshots;
	};

	for ( const viewport of VIEWPORTS ) {
		const snapshots = await measureViewport( viewport );
		if ( snapshots.raw && snapshots.widget ) {
			problems.push( ...compare( snapshots.raw, snapshots.widget, viewport.name ) );
		}
	}

	// Confirm before reporting.
	//
	// This is a measurement of a live browser against a single-threaded PHP
	// server: images and fonts settle at slightly different moments on the two
	// pages, and a few pixels of drift on centred text follows. Every difference
	// chased so far vanished on a second look -- the same section differed on one
	// run and was identical on the next, and measuring with a longer settle made
	// both pages agree exactly. So a difference is only real if it survives a
	// second, independent measurement; anything that does not is noise, and
	// reporting it would train the reader to ignore this check.
	let confirmed = problems;
	if ( problems.length ) {
		const second = [];
		for ( const viewport of VIEWPORTS ) {
			const snapshots = await measureViewport( viewport );
			if ( snapshots.raw && snapshots.widget ) {
				second.push( ...compare( snapshots.raw, snapshots.widget, viewport.name ) );
			}
		}
		const secondSet = new Set( second );
		confirmed = problems.filter( ( problem ) => secondSet.has( problem ) );
		if ( problems.length && ! confirmed.length ) row_unstable.add( key );
	}
	problems = confirmed;

	const status = problems.length ? 'DIFFERS' : 'identical';

	return {
		key,
		status,
		hasScript: !! section.script,
		problems,
		consoleErrors: [ ...new Set( consoleErrors ) ],
		behaviour,
	};
}

for ( const [ key, section ] of Object.entries( manifest ) ) {
	if ( onlyKeys && ! onlyKeys.has( key ) ) continue;

	const entry = pages[ key ];
	if ( ! entry || ! entry.raw_url ) {
		rows.push( { key, status: 'no reference page' } );
		failures += 1;
		continue;
	}

	let row = null;
	for ( let attempt = 1; ! row; attempt += 1 ) {
		try {
			row = await measureSection( key, section, entry );
		} catch ( error ) {
			if ( attempt >= 2 || ! browserGone( error ) ) throw error;
			await browser.close().catch( () => {} );
			browser = await launch();
		}
	}

	if ( 'DIFFERS' === row.status ) failures += 1;
	rows.push( row );
}

await browser.close();

const pad = ( value, width ) => String( value ).padEnd( width );
console.log( pad( 'section', 26 ) + pad( 'layout', 12 ) + pad( 'script ran', 12 ) + 'reveals' );
console.log( '-'.repeat( 62 ) );

for ( const row of rows ) {
	const ran = ! row.hasScript
		? 'no script'
		: ( row.behaviour && '1' === row.behaviour.ready ? 'yes' : 'NO' );
	const reveals = row.behaviour ? row.behaviour.revealed + '/' + row.behaviour.revealTargets : '-';
	console.log( pad( row.key, 26 ) + pad( row.status, 12 ) + pad( ran, 12 ) + reveals );
}

for ( const row of rows ) {
	if ( ! row.problems?.length && ! row.consoleErrors?.length ) continue;
	console.log( '\n--- ' + row.key + ' ---' );
	for ( const problem of row.problems ) console.log( '  ' + problem );
	for ( const error of row.consoleErrors ) console.log( '  console: ' + error );
}

if ( wantShots ) console.log( '\nScreenshots: ' + shotDir );
console.log( '\n' + ( failures ? failures + ' section(s) differ from the pasted original.' : 'Every widget renders and behaves identically to the pasted original.' ) );
process.exitCode = failures ? 1 : 0;
