/**
 * Browser plumbing shared by the checks that drive Chrome: finding a browser,
 * talking to the single-threaded harness server, and stubbing the live CDN.
 */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { execFileSync } from 'child_process';

export const BASE = 'http://localhost:8765';

const CHROME_CANDIDATES = [
	'C:/Program Files/Google/Chrome/Application/chrome.exe',
	'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
	'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
	'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];

export function findChrome() {
	const found = CHROME_CANDIDATES.find( ( candidate ) => fs.existsSync( candidate ) );
	if ( ! found ) {
		throw new Error( 'No Chrome or Edge found. Checked:\n  ' + CHROME_CANDIDATES.join( '\n  ' ) );
	}
	return found;
}

/** Paths into the local harness. */
export function harness( repoRoot ) {
	return {
		wpDir: path.join( repoRoot, 'local-env', 'wordpress' ),
		php: path.join( repoRoot, 'local-env', 'php', 'php.exe' ),
		phpIni: path.join( repoRoot, 'local-env', 'php', 'php.ini' ),
		wpCli: path.join( repoRoot, 'local-env', 'bin', 'wp-cli.phar' ),
		shotDir: path.join( repoRoot, 'local-env', 'shots' ),
	};
}

/** Run wp-cli in the harness. */
export function wp( repoRoot, cliArgs ) {
	const h = harness( repoRoot );
	return execFileSync( h.php, [ '-c', h.phpIni, h.wpCli, ...cliArgs ], { cwd: h.wpDir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 } );
}

/**
 * PHP's built-in server is single-threaded, and on Windows it refuses new
 * connections once its backlog fills -- which an Elementor page, with its ~48
 * scripts and stylesheets, can do on its own. That surfaces as a one-off
 * ERR_CONNECTION_REFUSED partway through a run, not as a real failure, so
 * navigation is retried after letting the server drain.
 */
export async function gotoWithRetry( page, url, options, attempts = 3 ) {
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

/**
 * Stand-ins for every asset the sections load from the live CDN.
 *
 * Two problems this solves. The live origin is documented as intermittently
 * unreachable (CLAUDE.md phase 14), so a photo that loads on one of two pages
 * but not the other shifts every element after it. And several sections REACT
 * to media: the hero reveals its video once `play()` resolves, the navigation
 * swaps to a text logo if the mark fails. Serving each asset type a fixed,
 * valid response makes every page take the same branch.
 *
 * Images get real intrinsic dimensions, because a layout with `width: auto`
 * depends on them.
 */
export function makePng( width, height ) {
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

export async function stubExternalAssets( page ) {
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

		// A video is left to fail on every page alike: an empty body would
		// decode differently from a 404 and the hero's play() promise would
		// settle at a different moment on each.
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
 * Wait for images and fonts, so measurements are of a settled page. Lazy
 * images are forced to load: `loading="lazy"` leaves `complete` false until
 * the image scrolls into view, so waiting on it would otherwise return at once.
 */
export async function settle( page, ms = 1500 ) {
	await page.evaluate( async () => {
		for ( const image of Array.from( document.images ) ) {
			image.loading = 'eager';
			if ( ! image.getAttribute( 'src' ) ) continue;
			image.src = image.src; // eslint-disable-line no-self-assign
		}

		await Promise.all( Array.from( document.images ).map( ( image ) =>
			image.complete
				? Promise.resolve()
				: new Promise( ( resolve ) => {
					image.addEventListener( 'load', resolve, { once: true } );
					image.addEventListener( 'error', resolve, { once: true } );
				} )
		) );

		await document.fonts.ready;
	} );

	await page.evaluate( ( wait ) => new Promise( ( resolve ) => setTimeout( resolve, wait ) ), ms );
}
