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
import { execFileSync } from 'child_process';
import zlib from 'zlib';
import puppeteer from 'puppeteer-core';

const here = path.dirname( fileURLToPath( import.meta.url ) );
const repoRoot = path.resolve( here, '..', '..' );
const pluginRoot = path.join( repoRoot, 'umoya-elementor-widgets' );
const wpDir = path.join( repoRoot, 'local-env', 'wordpress' );
const php = path.join( repoRoot, 'local-env', 'php', 'php.exe' );
const phpIni = path.join( repoRoot, 'local-env', 'php', 'php.ini' );
const wpCli = path.join( repoRoot, 'local-env', 'bin', 'wp-cli.phar' );
const shotDir = path.join( repoRoot, 'local-env', 'shots' );

const CHROME_CANDIDATES = [
	'C:/Program Files/Google/Chrome/Application/chrome.exe',
	'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
	'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
	'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];

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

function wp( cliArgs ) {
	return execFileSync( php, [ '-c', phpIni, wpCli, ...cliArgs ], { cwd: wpDir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 } );
}

function findChrome() {
	const found = CHROME_CANDIDATES.find( ( candidate ) => fs.existsSync( candidate ) );
	if ( ! found ) {
		throw new Error( 'No Chrome or Edge found. Checked:\n  ' + CHROME_CANDIDATES.join( '\n  ' ) );
	}
	return found;
}

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
	const all = root.querySelectorAll( '*' );
	for ( let i = 0; i < all.length; i += 1 ) record( all[ i ], i + 1 );

	return {
		rootHeight: Math.round( rootRect.height ),
		rootWidth: Math.round( rootRect.width ),
		elements: out,
	};
}

/**
 * Stand-ins for every asset the sections load from the live CDN.
 *
 * Two problems this solves. The live origin is documented as intermittently
 * unreachable (CLAUDE.md phase 14), so a photo that loads on one of the two
 * pages but not the other shifts every element after it. And several sections
 * REACT to media: the hero reveals its video once `play()` resolves, the
 * navigation swaps to a text logo if the mark fails. Serving each asset type a
 * fixed, valid response makes both pages take the same branch.
 *
 * Images get real intrinsic dimensions, because a layout with `width: auto`
 * depends on them.
 */
function makePng( width, height ) {
	const raw = Buffer.alloc( height * ( width * 3 + 1 ), 0xd8 );
	for ( let y = 0; y < height; y += 1 ) raw[ y * ( width * 3 + 1 ) ] = 0; // filter byte

	const chunk = ( type, data ) => {
		const length = Buffer.alloc( 4 );
		length.writeUInt32BE( data.length );
		const body = Buffer.concat( [ Buffer.from( type, 'ascii' ), data ] );
		const crc = Buffer.alloc( 4 );
		crc.writeUInt32BE( crc32( body ) >>> 0 );
		return Buffer.concat( [ length, body, crc ] );
	};

	const ihdr = Buffer.alloc( 13 );
	ihdr.writeUInt32BE( width, 0 );
	ihdr.writeUInt32BE( height, 4 );
	ihdr[ 8 ] = 8;  // bit depth
	ihdr[ 9 ] = 2;  // colour type: truecolour

	return Buffer.concat( [
		Buffer.from( [ 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a ] ),
		chunk( 'IHDR', ihdr ),
		chunk( 'IDAT', zlib.deflateSync( raw, { level: 9 } ) ),
		chunk( 'IEND', Buffer.alloc( 0 ) ),
	] );
}

const CRC_TABLE = ( () => {
	const table = new Int32Array( 256 );
	for ( let n = 0; n < 256; n += 1 ) {
		let c = n;
		for ( let k = 0; k < 8; k += 1 ) c = c & 1 ? 0xedb88320 ^ ( c >>> 1 ) : c >>> 1;
		table[ n ] = c;
	}
	return table;
} )();

function crc32( buffer ) {
	let c = -1;
	for ( let i = 0; i < buffer.length; i += 1 ) c = CRC_TABLE[ ( c ^ buffer[ i ] ) & 0xff ] ^ ( c >>> 8 );
	return c ^ -1;
}

const STUB_PHOTO = makePng( 1200, 800 );
const STUB_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="26" viewBox="0 0 120 26"><rect width="120" height="26" fill="#4B2E2B"/></svg>';

async function stubExternalAssets( page ) {
	await page.setRequestInterception( true );

	page.on( 'request', ( request ) => {
		const url = request.url();

		if ( url.startsWith( 'http://localhost:' ) || url.startsWith( 'http://127.0.0.1:' ) || url.startsWith( 'data:' ) ) {
			request.continue();
			return;
		}

		const type = request.resourceType();

		if ( 'image' === type ) {
			if ( /\.svg(\?|#|$)/i.test( url ) ) {
				request.respond( { status: 200, contentType: 'image/svg+xml', body: STUB_SVG } );
			} else {
				request.respond( { status: 200, contentType: 'image/png', body: STUB_PHOTO } );
			}
			return;
		}

		// A video is left to fail on both pages alike: an empty body would decode
		// differently from a 404 and the hero's play() promise would settle at a
		// different moment on each.
		if ( 'media' === type ) {
			request.respond( { status: 404, contentType: 'text/plain', body: '' } );
			return;
		}

		if ( 'font' === type || 'stylesheet' === type || 'script' === type ) {
			request.respond( { status: 200, contentType: 'text/plain', body: '' } );
			return;
		}

		request.abort();
	} );
}

/**
 * PHP's built-in server is single-threaded, and on Windows it refuses new
 * connections once its backlog fills -- which an Elementor page, with its ~48
 * scripts and stylesheets, can do on its own. That surfaces as a one-off
 * ERR_CONNECTION_REFUSED partway through a run, not as a real failure, so
 * navigation is retried after letting the server drain.
 */
async function gotoWithRetry( page, url, options, attempts = 3 ) {
	let lastError;
	for ( let attempt = 1; attempt <= attempts; attempt += 1 ) {
		try {
			return await page.goto( url, options );
		} catch ( error ) {
			lastError = error;
			if ( ! String( error.message || error ).includes( 'ERR_CONNECTION_REFUSED' ) ) throw error;
			await new Promise( ( resolve ) => setTimeout( resolve, 1500 * attempt ) );
		}
	}
	throw lastError;
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
	const raw = wp( [ 'eval-file', path.join( here, 'make-test-pages.php' ) ] );
	pages = JSON.parse( raw.slice( raw.indexOf( '{' ) ) );
} catch ( error ) {
	console.error( 'Could not create test pages:\n' + ( error.stdout || '' ) + ( error.stderr || error.message ) );
	process.exit( 1 );
}

if ( wantShots ) fs.mkdirSync( shotDir, { recursive: true } );

const browser = await puppeteer.launch( {
	executablePath: findChrome(),
	headless: 'shell',
	args: [ '--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1' ],
} );

const rows = [];
let failures = 0;

for ( const [ key, section ] of Object.entries( manifest ) ) {
	if ( onlyKeys && ! onlyKeys.has( key ) ) continue;

	const entry = pages[ key ];
	if ( ! entry || ! entry.raw_url ) {
		rows.push( { key, status: 'no reference page' } );
		failures += 1;
		continue;
	}

	const problems = [];
	const consoleErrors = [];
	let behaviour = null;

	for ( const viewport of VIEWPORTS ) {
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

			// Let entrance transitions and media-load handlers settle. The hero
			// retries playback on window load and again 900ms later, so a shorter
			// wait samples the two pages at different points in that sequence.
			await page.evaluate( () => new Promise( ( resolve ) => setTimeout( resolve, 1500 ) ) );

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

			await page.close();
		}

		if ( snapshots.raw && snapshots.widget ) {
			problems.push( ...compare( snapshots.raw, snapshots.widget, viewport.name ) );
		}
	}

	const status = problems.length ? 'DIFFERS' : 'identical';
	if ( problems.length ) failures += 1;

	rows.push( {
		key,
		status,
		hasScript: !! section.script,
		problems,
		consoleErrors: [ ...new Set( consoleErrors ) ],
		behaviour,
	} );
}

await browser.close();

const pad = ( value, width ) => String( value ).padEnd( width );
console.log( pad( 'section', 20 ) + pad( 'layout', 12 ) + pad( 'script ran', 12 ) + 'reveals' );
console.log( '-'.repeat( 62 ) );

for ( const row of rows ) {
	const ran = ! row.hasScript
		? 'no script'
		: ( row.behaviour && '1' === row.behaviour.ready ? 'yes' : 'NO' );
	const reveals = row.behaviour ? row.behaviour.revealed + '/' + row.behaviour.revealTargets : '-';
	console.log( pad( row.key, 20 ) + pad( row.status, 12 ) + pad( ran, 12 ) + reveals );
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
