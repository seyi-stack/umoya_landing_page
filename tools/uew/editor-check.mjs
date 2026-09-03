/**
 * Open each section in the real Elementor editor and check it is usable there.
 *
 *   node tools/uew/editor-check.mjs [--only=fc_form] [--shots]
 *
 * The front end is only half the story. Widgets are injected into the editor
 * canvas long after DOMContentLoaded, so a section whose script assumes a normal
 * page load renders as a dead husk in the editor while looking perfect on the
 * published page. This check opens the editor, waits for the canvas, and asserts
 * for every section that:
 *
 *   - the section root actually rendered inside the preview iframe,
 *   - its own JavaScript initialised there (the data-uew-ready latch),
 *   - selecting the widget opens a panel with its control sections,
 *   - nothing threw.
 *
 * It also times the panel, because a widget with a thousand controls is only
 * "fully editable" if the panel still opens promptly.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import puppeteer from 'puppeteer-core';

const here = path.dirname( fileURLToPath( import.meta.url ) );
const repoRoot = path.resolve( here, '..', '..' );
const pluginRoot = path.join( repoRoot, 'umoya-elementor-widgets' );
const wpDir = path.join( repoRoot, 'local-env', 'wordpress' );
const php = path.join( repoRoot, 'local-env', 'php', 'php.exe' );
const phpIni = path.join( repoRoot, 'local-env', 'php', 'php.ini' );
const wpCli = path.join( repoRoot, 'local-env', 'bin', 'wp-cli.phar' );
const shotDir = path.join( repoRoot, 'local-env', 'shots' );

const BASE = 'http://localhost:8765';
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

const manifest = JSON.parse( fs.readFileSync( path.join( pluginRoot, 'includes', 'sections', 'index.json' ), 'utf8' ) );

function wp( cliArgs ) {
	return execFileSync( php, [ '-c', phpIni, wpCli, ...cliArgs ], { cwd: wpDir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 } );
}

function findChrome() {
	const found = CHROME_CANDIDATES.find( ( candidate ) => fs.existsSync( candidate ) );
	if ( ! found ) throw new Error( 'No Chrome or Edge found.' );
	return found;
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

async function login( page ) {
	await gotoWithRetry( page, BASE + '/wp-login.php', { waitUntil: 'domcontentloaded' } );
	await page.type( '#user_login', 'admin' );
	await page.type( '#user_pass', 'admin' );
	await Promise.all( [
		page.waitForNavigation( { waitUntil: 'domcontentloaded' } ),
		page.click( '#wp-submit' ),
	] );
	if ( ! page.url().includes( '/wp-admin' ) ) throw new Error( 'Login failed; still at ' + page.url() );
}

/**
 * Elementor's own AI ("Angie") and MCP editor packages throw on load when the
 * editor has no AI connection, which is the normal state of a local harness
 * with no Pro licence. Every symbol below was confirmed to live in Elementor's
 * own bundles under assets/js/packages, not in anything this plugin ships.
 *
 * They are counted and reported separately rather than suppressed outright, so
 * a genuine error thrown from inside Elementor by one of our widgets still
 * fails the run.
 */
const HOST_EDITOR_SYMBOLS = [
	'getMCPByDomain', 'toolPrompts', 'createTransformer', 'injectIntoCssClassConvert',
	'getAngieSdk', 'isAngieAvailable', 'McpServer', 'GLOBAL_STYLES_IMPORTED_EVENT',
	'GlobalStylesImportListener', 'InjectedComponent',
];

function isHostEditorNoise( text ) {
	return HOST_EDITOR_SYMBOLS.some( ( symbol ) => text.includes( symbol ) );
}

/* -------------------------------------------------------------------- main */

console.log( '\nUmoya widget editor check' );
console.log( '=========================\n' );

let pages;
const raw = wp( [ 'eval-file', path.join( here, 'make-test-pages.php' ) ] );
pages = JSON.parse( raw.slice( raw.indexOf( '{' ) ) );

if ( wantShots ) fs.mkdirSync( shotDir, { recursive: true } );

const browser = await puppeteer.launch( {
	executablePath: findChrome(),
	headless: 'shell',
	args: [ '--no-sandbox', '--disable-dev-shm-usage' ],
} );

const page = await browser.newPage();
await page.setViewport( { width: 1600, height: 1000 } );
await login( page );

const rows = [];
let failures = 0;

for ( const [ key, section ] of Object.entries( manifest ) ) {
	if ( onlyKeys && ! onlyKeys.has( key ) ) continue;

	const entry = pages[ key ];
	const errors = [];
	const hostNoise = [];
	const row = { key, rendered: false, scriptRan: null, panels: 0, ms: 0, notes: [] };

	const onError = ( error ) => errors.push( String( error ).slice( 0, 160 ) );
	const onConsole = ( message ) => {
		if ( 'error' !== message.type() ) return;
		const text = message.text();
		if ( text.includes( '404' ) || text.includes( 'net::ERR' ) ) return; // live CDN, not us
		if ( isHostEditorNoise( text ) ) {
			hostNoise.push( text.slice( 0, 120 ) );
			return;
		}
		errors.push( text.slice( 0, 160 ) );
	};
	page.on( 'pageerror', onError );
	page.on( 'console', onConsole );

	const started = Date.now();

	try {
		await gotoWithRetry( page, BASE + '/wp-admin/post.php?post=' + entry.id + '&action=elementor', { waitUntil: 'domcontentloaded', timeout: 90000 } );

		// The canvas lives in an iframe; Elementor builds it after its own boot.
		await page.waitForSelector( '#elementor-preview-iframe', { timeout: 90000 } );
		const frameHandle = await page.$( '#elementor-preview-iframe' );
		const frame = await frameHandle.contentFrame();

		await frame.waitForSelector( section.root_selector, { timeout: 90000 } );
		row.rendered = true;

		// Give the element_ready hook time to fire and the section to initialise.
		await new Promise( ( resolve ) => setTimeout( resolve, 2500 ) );
		row.scriptRan = await frame.evaluate(
			( selector ) => {
				const root = document.querySelector( selector );
				return root ? root.getAttribute( 'data-uew-ready' ) : null;
			},
			section.root_selector
		);

		// Select the widget through Elementor's own command rather than a canvas
		// click: a click can land on an overlay and quietly select nothing.
		const panelStarted = Date.now();
		await page.evaluate( ( widgetName ) => {
			const doc = document.querySelector( '#elementor-preview-iframe' ).contentDocument;
			const element = doc.querySelector( '.elementor-widget-' + widgetName );
			if ( ! element ) throw new Error( 'widget not found in the canvas' );
			window.$e.run( 'document/elements/select', { container: window.elementor.getContainer( element.dataset.id ) } );
		}, section.name );

		await page.waitForFunction(
			( expected ) => {
				const title = document.querySelector( '#elementor-panel-header-title' );
				return title && title.textContent.trim() === 'Edit ' + expected;
			},
			{ timeout: 60000 },
			section.title
		);
		row.ms = Date.now() - panelStarted;

		// Elementor only renders the controls of the open section, so the panel's
		// DOM count is small by design. What matters is that the widget's control
		// stack reached the editor at all, and that both tabs list their sections.
		const panel = await page.evaluate( ( widgetName ) => {
			const cache = window.elementor.widgetsCache[ widgetName ] || {};
			const controls = cache.controls ? Object.keys( cache.controls ) : [];
			const sections = controls.filter( ( id ) => 'section' === cache.controls[ id ].type );
			const byTab = {};
			for ( const id of sections ) {
				const tab = cache.controls[ id ].tab || 'content';
				byTab[ tab ] = ( byTab[ tab ] || 0 ) + 1;
			}
			return { controls: controls.length, sections: sections.length, byTab };
		}, section.name );

		row.panels = panel.sections;
		row.controls = panel.controls;
		row.byTab = panel.byTab;

		if ( wantShots ) {
			await page.screenshot( { path: path.join( shotDir, 'editor-' + key + '.png' ) } );
		}
	} catch ( error ) {
		row.notes.push( String( error.message || error ).slice( 0, 180 ) );
	}

	page.off( 'pageerror', onError );
	page.off( 'console', onConsole );

	row.errors = [ ...new Set( errors ) ];
	row.hostNoise = [ ...new Set( hostNoise ) ];
	row.total = Date.now() - started;

	const ok = row.rendered && row.panels > 0 && ! row.errors.length &&
		( ! section.script || '1' === row.scriptRan );
	if ( ! ok ) failures += 1;
	row.ok = ok;

	rows.push( row );
	const tabs = row.byTab ? Object.entries( row.byTab ).map( ( [ tab, n ] ) => n + ' ' + tab ).join( ', ' ) : '';
	console.log(
		row.key.padEnd( 20 ) +
		( row.rendered ? 'rendered' : 'NOT RENDERED' ).padEnd( 14 ) +
		( ! section.script ? 'no script' : ( '1' === row.scriptRan ? 'script ok' : 'SCRIPT DID NOT RUN' ) ).padEnd( 20 ) +
		String( row.ms ).padStart( 6 ) + 'ms  ' +
		String( row.panels ).padStart( 3 ) + ' panels (' + tabs + ')' +
		( row.errors.length ? '   ' + row.errors.length + ' console error(s)' : '' ) +
		( row.hostNoise.length ? '   (' + row.hostNoise.length + ' Elementor AI/MCP warnings ignored)' : '' )
	);
}

await browser.close();

for ( const row of rows ) {
	if ( ! row.notes.length && ! row.errors.length ) continue;
	console.log( '\n--- ' + row.key + ' ---' );
	for ( const note of row.notes ) console.log( '  ' + note );
	for ( const error of row.errors ) console.log( '  console: ' + error );
}

if ( wantShots ) console.log( '\nEditor screenshots: ' + shotDir );
console.log( '\n' + ( failures ? failures + ' section(s) have a problem in the editor.' : 'Every section renders, initialises and opens its panel in the Elementor editor.' ) );
process.exitCode = failures ? 1 : 0;
