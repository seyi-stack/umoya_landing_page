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
import puppeteer from 'puppeteer-core';

import { BASE, findChrome, gotoWithRetry, wp, harness } from './lib/browser.mjs';

const here = path.dirname( fileURLToPath( import.meta.url ) );
const repoRoot = path.resolve( here, '..', '..' );
const pluginRoot = path.join( repoRoot, 'umoya-elementor-widgets' );
const shotDir = harness( repoRoot ).shotDir;

const args = process.argv.slice( 2 );
const only = ( args.find( ( a ) => a.startsWith( '--only=' ) ) || '' ).replace( '--only=', '' );
const onlyKeys = only ? new Set( only.split( ',' ).map( ( s ) => s.trim() ) ) : null;
const wantShots = args.includes( '--shots' );

const manifest = JSON.parse( fs.readFileSync( path.join( pluginRoot, 'includes', 'sections', 'index.json' ), 'utf8' ) );

async function login( page ) {
	await gotoWithRetry( page, BASE + '/wp-login.php', { waitUntil: 'domcontentloaded' } );
	await page.type( '#user_login', 'admin' );
	await page.type( '#user_pass', 'admin' );
	// The first admin page after a server restart rebuilds WordPress's and
	// Elementor's caches, and on a single-threaded server that can take well
	// past puppeteer's default 30 s.
	await Promise.all( [
		page.waitForNavigation( { waitUntil: 'domcontentloaded', timeout: 120000 } ),
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
const raw = wp( repoRoot, [ 'eval-file', path.join( here, 'make-test-pages.php' ) ] );
pages = JSON.parse( raw.slice( raw.indexOf( '{' ) ) );

if ( wantShots ) fs.mkdirSync( shotDir, { recursive: true } );

// Log in once per browser; the session cookie lives on the browser context, so
// every section can then open its own page without logging in again.
async function launch() {
	const fresh = await puppeteer.launch( {
		executablePath: findChrome(),
		headless: 'shell',
		args: [ '--no-sandbox', '--disable-dev-shm-usage' ],
	} );
	const loginPage = await fresh.newPage();
	await loginPage.setViewport( { width: 1600, height: 1000 } );
	await login( loginPage );
	await loginPage.close();
	return fresh;
}
let browser = await launch();

const rows = [];
let failures = 0;

for ( const [ key, section ] of Object.entries( manifest ) ) {
	if ( onlyKeys && ! onlyKeys.has( key ) ) continue;

	const entry = pages[ key ];

	// Booting an Elementor editor pulls ~50 assets through a single-threaded PHP
	// server. Thirty-three of them back to back saturates it, and the dropped
	// request lands on whichever section is unlucky. A short pause between
	// sections costs a minute and removes the cause rather than retrying past it.
	if ( rows.length ) {
		await new Promise( ( resolve ) => setTimeout( resolve, 1500 ) );
	}

	let row = await inspectSafely( key, section, entry );

	// Confirm before reporting, as the browser check does. Booting 33 editors in
	// a row against a single-threaded PHP server drops the occasional script,
	// which surfaces as `wp is not defined` and an empty canvas -- a WordPress
	// bootstrap race, not a widget fault. It was reproducible only in the crowd:
	// the same section passed twice in isolation immediately afterwards.
	const failed = ( candidate ) => ! candidate.rendered || ! candidate.panels ||
		candidate.errors.length || ( section.script && '1' !== candidate.scriptRan ) ||
		'FAILED' === candidate.liveEdit || 'FAILED' === candidate.liveStyle;

	if ( failed( row ) ) {
		// Let the server drain before looking again. The failures here are the
		// editor's own bundle not loading -- `@elementor/env was not loaded`, and
		// no preview iframe at all -- which is a dropped request, not a widget
		// fault: the same section passes twice in isolation straight afterwards.
		await new Promise( ( resolve ) => setTimeout( resolve, 4000 ) );
		const second = await inspectSafely( key, section, entry );
		if ( ! failed( second ) ) {
			second.recovered = true;
			row = second;
		}
	}

	const ok = ! failed( row );
	if ( ! ok ) failures += 1;
	row.ok = ok;

	rows.push( row );
	console.log( describeRow( row, section ) );
}

/**
 * Chrome itself going away -- killed, or the machine sleeping mid-run -- takes
 * every later section with it, and it can surface anywhere, even in opening the
 * next page. Whenever the browser has gone, start a fresh, logged-in one and
 * take the section again from the top.
 */
async function inspectSafely( key, section, entry ) {
	for ( let attempt = 1; ; attempt += 1 ) {
		try {
			if ( ! browser.connected ) {
				await browser.close().catch( () => {} );
				browser = await launch();
			}
			return await inspect( key, section, entry );
		} catch ( error ) {
			if ( browser.connected || attempt >= 2 ) throw error;
		}
	}
}

async function inspect( key, section, entry ) {
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
	const started = Date.now();

	// A page per section. Reusing one page left Elementor's preview iframe
	// detached from the previous document -- every section after the first
	// failure reported the same stale frame id, which looked like seven broken
	// widgets and was one broken page object.
	const page = await browser.newPage();
	await page.setViewport( { width: 1600, height: 1000 } );
	page.on( 'pageerror', onError );
	page.on( 'console', onConsole );

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

		// Edit something, the way an editor does: change a text control through
		// Elementor's own command, which re-renders the widget on the server and
		// swaps the fresh markup into the canvas. That is the path where a
		// section script has to initialise AGAIN on new markup, and where a
		// dialog that moved itself to <body> would otherwise leave a stale copy
		// behind -- so it is checked here, not assumed.
		const schema = JSON.parse( fs.readFileSync( path.join( pluginRoot, 'includes', 'sections', key + '.json' ), 'utf8' ) );
		const field = schema.fields.find( ( f ) => 'text' === f.control && 'post' === f.esc && ! f.tab && ! f.internal );
		if ( field ) {
			const probe = 'Uew live edit ' + key;
			await page.evaluate( ( widgetName, controlId, value ) => {
				const doc = document.querySelector( '#elementor-preview-iframe' ).contentDocument;
				const element = doc.querySelector( '.elementor-widget-' + widgetName );
				window.$e.run( 'document/elements/settings', {
					container: window.elementor.getContainer( element.dataset.id ),
					settings: { [ controlId ]: value },
				} );
			}, section.name, field.id, probe );

			const editFrame = await ( await page.$( '#elementor-preview-iframe' ) ).contentFrame();
			try {
				// The ready latch only exists where there is a script to latch;
				// a section without one is re-rendered text and nothing more.
				await editFrame.waitForFunction(
					( selector, text, scripted ) => {
						const root = document.querySelector( selector );
						return root && root.textContent.includes( text ) &&
							( ! scripted || '1' === root.getAttribute( 'data-uew-ready' ) );
					},
					{ timeout: 45000 },
					section.root_selector,
					probe,
					!! section.script
				);
				row.liveEdit = 'ok';
			} catch ( error ) {
				row.liveEdit = 'FAILED';
				row.notes.push( 'live edit: the canvas never showed the new text with the section script re-initialised' );
			}

			if ( schema.portals && schema.portals.length ) {
				const copies = await editFrame.evaluate( ( ids ) => ids.map( ( id ) => ( {
					id,
					live: document.querySelectorAll( '[id="' + id + '"]' ).length,
					visibleStale: Array.from( document.querySelectorAll( '[data-uew-retired]' ) )
						.filter( ( node ) => 'none' !== getComputedStyle( node ).display ).length,
				} ) ), schema.portals.map( ( p ) => p.selector.replace( /^#/, '' ) ) );
				for ( const copy of copies ) {
					if ( 1 !== copy.live || copy.visibleStale ) {
						row.liveEdit = 'FAILED';
						row.notes.push( 'live edit: #' + copy.id + ' has ' + copy.live + ' live copies and ' + copy.visibleStale + ' visible stale ones after a re-render' );
					}
				}
			}
		} else {
			row.liveEdit = 'n/a';
		}

		// Style a panel live as well. In the editor, Elementor writes control CSS
		// in the browser, not in PHP -- a separate code path that has to handle
		// the portal branch and its {{ID}} too. For a section with a portal the
		// panel is one inside the dialog, and the dialog is opened first, so the
		// value is read where a visitor would see it: in <body>.
		const portal = ( schema.portals || [] )[ 0 ];
		const fullOf = ( part ) => ( part.absolute ? part.selector : ( part.selector ? schema.root_selector + ' ' + part.selector : schema.root_selector ) );
		const candidates = schema.style_parts.filter( ( part ) =>
			( part.features || [] ).includes( 'effects' ) && part.selector && ! ( part.animated || [] ).includes( 'opacity' )
		);
		const stylePart = portal
			? candidates.find( ( part ) => fullOf( part ).startsWith( portal.selector + ' ' ) ) || candidates[ 0 ]
			: candidates[ 0 ];
		if ( stylePart ) {
			await page.evaluate( ( widgetName, controlId ) => {
				const doc = document.querySelector( '#elementor-preview-iframe' ).contentDocument;
				const element = doc.querySelector( '.elementor-widget-' + widgetName ) || doc.querySelector( '[data-widget_type^="' + widgetName + '."]' );
				window.$e.run( 'document/elements/settings', {
					container: window.elementor.getContainer( element.dataset.id ),
					settings: { [ controlId ]: { unit: 'px', size: 0.37, sizes: [] } },
				} );
			}, section.name, stylePart.id + '_opacity' );

			const styleFrame = await ( await page.$( '#elementor-preview-iframe' ) ).contentFrame();
			if ( portal && portal.trigger ) {
				await styleFrame.evaluate( ( trigger ) => {
					let element = document.querySelector( trigger );
					if ( ! element ) {
						const attribute = ( trigger.match( /^\[([A-Za-z0-9_-]+)\]$/ ) || [] )[ 1 ];
						if ( ! attribute ) return;
						element = document.createElement( 'button' );
						element.type = 'button';
						element.setAttribute( attribute, '' );
						document.body.appendChild( element );
					}
					element.click();
				}, portal.trigger );
			}

			try {
				await styleFrame.waitForFunction(
					( selector ) => {
						const element = document.querySelector( selector );
						return element && Math.abs( parseFloat( getComputedStyle( element ).opacity ) - 0.37 ) < 0.001;
					},
					{ timeout: 20000 },
					fullOf( stylePart )
				);
				row.liveStyle = 'ok';
			} catch ( error ) {
				row.liveStyle = 'FAILED';
				row.notes.push( 'live style: "' + stylePart.label + '" opacity never reached ' + fullOf( stylePart ) + ' in the canvas' );
			}
		} else {
			row.liveStyle = 'n/a';
		}

		if ( wantShots ) {
			// Elementor keeps a full-screen loading splash up until the editor is
			// fully booted. Screenshotting before it clears photographs the splash,
			// not the panel.
			await page.waitForFunction( () => {
				const loader = document.querySelector( '#elementor-loading' );
				return ! loader || 'none' === getComputedStyle( loader ).display || 0 === parseFloat( getComputedStyle( loader ).opacity );
			}, { timeout: 60000 } ).catch( () => {} );
			await new Promise( ( resolve ) => setTimeout( resolve, 800 ) );

			// The panel is the subject; the canvas beside it is not.
			const panel = await page.$( '#elementor-panel' );
			await ( panel || page ).screenshot( { path: path.join( shotDir, 'editor-' + key + '-content.png' ) } );

			// The Style tab is where the panel naming has to earn its keep, so it
			// gets its own shot. Switching tabs goes through Elementor's router
			// rather than a DOM click: the tab markup has moved between versions,
			// the route has not.
			const switched = await page.evaluate( () => {
				try {
					window.$e.route( 'panel/editor/style' );
					return true;
				} catch ( error ) {
					return false;
				}
			} );

			if ( switched ) {
				await new Promise( ( resolve ) => setTimeout( resolve, 1200 ) );
				const stylePanel = await page.$( '#elementor-panel' );
				await ( stylePanel || page ).screenshot( { path: path.join( shotDir, 'editor-' + key + '-style.png' ) } );
			}
		}
	} catch ( error ) {
		row.notes.push( String( error.message || error ).slice( 0, 180 ) );
	}

	await page.close().catch( () => {} );

	row.errors = [ ...new Set( errors ) ];
	row.hostNoise = [ ...new Set( hostNoise ) ];
	row.total = Date.now() - started;

	return row;
}

function describeRow( row, section ) {
	const tabs = row.byTab ? Object.entries( row.byTab ).map( ( [ tab, n ] ) => n + ' ' + tab ).join( ', ' ) : '';

	return (
		row.key.padEnd( 26 ) +
		( row.rendered ? 'rendered' : 'NOT RENDERED' ).padEnd( 14 ) +
		( ! section.script ? 'no script' : ( '1' === row.scriptRan ? 'script ok' : 'SCRIPT DID NOT RUN' ) ).padEnd( 20 ) +
		String( row.ms ).padStart( 6 ) + 'ms  ' +
		String( row.panels ).padStart( 3 ) + ' panels (' + tabs + ')' +
		'  live edit ' + ( row.liveEdit || '-' ) + ', style ' + ( row.liveStyle || '-' ) +
		( row.errors.length ? '   ' + row.errors.length + ' console error(s)' : '' ) +
		( row.hostNoise.length ? '   (' + row.hostNoise.length + ' Elementor AI/MCP warnings ignored)' : '' ) +
		( row.recovered ? '   [passed on retry]' : '' )
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
