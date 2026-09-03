/**
 * End-to-end check against the local WordPress + Elementor harness.
 *
 *   node tools/uew/render-check.mjs
 *
 * The build's fidelity check proves the template reproduces the source when
 * rendered in isolation. This one proves it survives the real path: Elementor
 * builds the page, the widget renders inside a container, WordPress filters the
 * output, and the section's CSS and JS are enqueued. It compares the section
 * element as served with the section element in the source file, node by node,
 * and reports anything missing rather than a byte count.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

import { createDocument, outerRange, allElements, attr, classList, children, isComment, isTextNode } from './lib/html.mjs';

const here = path.dirname( fileURLToPath( import.meta.url ) );
const repoRoot = path.resolve( here, '..', '..' );
const pluginRoot = path.join( repoRoot, 'umoya-elementor-widgets' );
const wpDir = path.join( repoRoot, 'local-env', 'wordpress' );
const php = path.join( repoRoot, 'local-env', 'php', 'php.exe' );
const phpIni = path.join( repoRoot, 'local-env', 'php', 'php.ini' );
const wpCli = path.join( repoRoot, 'local-env', 'bin', 'wp-cli.phar' );

const manifest = JSON.parse( fs.readFileSync( path.join( pluginRoot, 'includes', 'sections', 'index.json' ), 'utf8' ) );

/* ------------------------------------------------------------------ helpers */

function wp( args ) {
	return execFileSync( php, [ '-c', phpIni, wpCli, ...args ], { cwd: wpDir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 } );
}

async function fetchPage( url ) {
	const response = await fetch( url, { headers: { 'User-Agent': 'uew-render-check' } } );
	return { status: response.status, body: await response.text() };
}

/** Structural fingerprint used to compare source and served markup. */
function fingerprint( html, rootSelector ) {
	const doc = createDocument( html );
	const root = doc.query( rootSelector );
	if ( ! root ) return null;

	const nodes = [];
	const walk = ( node, depth ) => {
		for ( const child of children( node ) ) {
			if ( isComment( child ) ) {
				nodes.push( { kind: 'comment', depth, value: child.data.trim() } );
				continue;
			}
			if ( isTextNode( child ) ) {
				const text = child.value.replace( /\s+/g, ' ' ).trim();
				if ( text ) nodes.push( { kind: 'text', depth, value: text } );
				continue;
			}
			nodes.push( {
				kind: 'element',
				depth,
				tag: child.tagName.toLowerCase(),
				classes: classList( child ).sort().join( ' ' ),
				attrs: ( child.attrs || [] )
					.map( ( a ) => a.name.toLowerCase() + '=' + a.value )
					.sort()
					.join( '|' ),
			} );
			walk( child, depth + 1 );
		}
	};

	nodes.push( {
		kind: 'element',
		depth: 0,
		tag: root.tagName.toLowerCase(),
		classes: classList( root ).sort().join( ' ' ),
		attrs: ( root.attrs || [] ).map( ( a ) => a.name.toLowerCase() + '=' + a.value ).sort().join( '|' ),
	} );
	walk( root, 1 );

	return nodes;
}

/** Say precisely what differs: the tag, a class, or one attribute. */
function explain( index, expectedNode, actualNode ) {
	if ( ! expectedNode ) return '  node ' + index + ': extra node served -- ' + describe( actualNode );
	if ( ! actualNode ) return '  node ' + index + ': node missing from the served page -- ' + describe( expectedNode );

	const a = normalizeNode( expectedNode );
	const b = normalizeNode( actualNode );

	if ( a.kind !== b.kind || a.depth !== b.depth || a.tag !== b.tag ) {
		return [
			'  node ' + index,
			'    source : ' + describe( expectedNode ) + ' (depth ' + a.depth + ')',
			'    served : ' + describe( actualNode ) + ' (depth ' + b.depth + ')',
		].join( '\n' );
	}

	if ( 'element' !== a.kind ) {
		return [
			'  node ' + index + ' (' + a.kind + ' inside ' + describe( expectedNode ) + ')',
			'    source : ' + a.value,
			'    served : ' + b.value,
		].join( '\n' );
	}

	const toMap = ( attrs ) => Object.fromEntries( attrs.split( '|' ).filter( Boolean ).map( ( pair ) => {
		const eq = pair.indexOf( '=' );
		return [ pair.slice( 0, eq ), pair.slice( eq + 1 ) ];
	} ) );

	const left = toMap( a.attrs );
	const right = toMap( b.attrs );
	const names = [ ...new Set( [ ...Object.keys( left ), ...Object.keys( right ) ] ) ].sort();
	const lines = [ '  node ' + index + ' ' + describe( expectedNode ) ];

	for ( const name of names ) {
		if ( left[ name ] === right[ name ] ) continue;
		lines.push( '    [' + name + ']' );
		lines.push( '      source : ' + ( left[ name ] === undefined ? '<absent>' : JSON.stringify( left[ name ] ) ) );
		lines.push( '      served : ' + ( right[ name ] === undefined ? '<absent>' : JSON.stringify( right[ name ] ) ) );
	}

	return lines.join( '\n' );
}

function describe( node ) {
	if ( node.kind === 'element' ) {
		return '<' + node.tag + ( node.classes ? ' class="' + node.classes + '"' : '' ) + '>';
	}
	if ( node.kind === 'comment' ) return '<!-- ' + node.value.slice( 0, 50 ) + ' -->';
	return '"' + node.value.slice( 0, 60 ) + '"';
}

/**
 * Attributes WordPress core adds to images inside builder content
 * (`wp_filter_content_tags` on `the_content`). They are additions, not losses,
 * and a hand-pasted HTML widget gets exactly the same treatment -- so they are
 * normalised away rather than reported as drift.
 */
const CORE_IMAGE_ADDITIONS = new Set( [ 'decoding', 'fetchpriority', 'srcset', 'sizes' ] );

/**
 * Elementor's own repeater-item class is expected on rows; ignore it so it does
 * not read as a difference.
 */
function normalizeNode( node ) {
	if ( node.kind !== 'element' ) return node;
	const strip = ( value ) => value.split( ' ' ).filter( ( c ) => c && ! /^elementor-repeater-item-/.test( c ) ).join( ' ' );
	return {
		...node,
		classes: strip( node.classes ),
		attrs: node.attrs
			.split( '|' )
			.map( ( pair ) => ( pair.startsWith( 'class=' ) ? 'class=' + strip( pair.slice( 6 ) ) : pair ) )
			// A class attribute that existed only to carry the repeater-item hook
			// is not a difference in the markup.
			.filter( ( pair ) => pair !== 'class=' && pair !== '' )
			.filter( ( pair ) => {
				if ( 'img' !== node.tag && 'iframe' !== node.tag ) return true;
				return ! CORE_IMAGE_ADDITIONS.has( pair.slice( 0, Math.max( 0, pair.indexOf( '=' ) ) ) );
			} )
			.map( ( pair ) => {
				const eq = pair.indexOf( '=' );
				return eq < 0 ? pair : pair.slice( 0, eq + 1 ) + decode( pair.slice( eq + 1 ) );
			} )
			.join( '|' ),
	};
}

function sameNode( a, b ) {
	const x = normalizeNode( a );
	const y = normalizeNode( b );
	if ( x.kind !== y.kind || x.depth !== y.depth ) return false;
	if ( x.kind === 'element' ) return x.tag === y.tag && x.classes === y.classes && x.attrs === y.attrs;
	// Entity spellings differ after esc_attr; compare the decoded text.
	return decode( x.value ) === decode( y.value );
}

function decode( value ) {
	return value
		.replace( /&#0?39;|&apos;|&#x27;/g, "'" )
		.replace( /&quot;|&#0?34;/g, '"' )
		.replace( /&amp;/g, '&' );
}

/* -------------------------------------------------------------------- main */

console.log( '\nUmoya widget render check (local WordPress + Elementor)' );
console.log( '======================================================\n' );

let pages;
try {
	const raw = wp( [ 'eval-file', path.join( here, 'make-test-pages.php' ) ] );
	pages = JSON.parse( raw.slice( raw.indexOf( '{' ) ) );
} catch ( error ) {
	console.error( 'Could not create test pages:\n' + ( error.stdout || '' ) + ( error.stderr || error.message ) );
	process.exit( 1 );
}

let failures = 0;
const rows = [];

for ( const [ key, section ] of Object.entries( manifest ) ) {
	const page = pages[ key ];
	if ( ! page ) {
		rows.push( { key, status: 'no test page' } );
		failures += 1;
		continue;
	}

	const { status, body } = await fetchPage( page.url );
	const sourceFile = path.join( repoRoot, section.source );
	const sourceHtml = fs.readFileSync( sourceFile, 'utf8' ).replace( /^﻿/, '' ).replace( /\r\n/g, '\n' );

	const expected = fingerprint( sourceHtml, section.root_selector );
	const actual = fingerprint( body, section.root_selector );

	const row = { key, status: 'OK', http: status };

	if ( 200 !== status ) {
		row.status = 'HTTP ' + status;
	} else if ( ! actual ) {
		row.status = 'section root ' + section.root_selector + ' not found in the rendered page';
	} else {
		const problems = [];
		const max = Math.max( expected.length, actual.length );
		for ( let i = 0; i < max; i += 1 ) {
			if ( expected[ i ] && actual[ i ] && sameNode( expected[ i ], actual[ i ] ) ) continue;
			problems.push(
				'  node ' + i + '\n    source : ' + ( expected[ i ] ? describe( expected[ i ] ) : '<missing>' ) +
				'\n    served : ' + ( actual[ i ] ? describe( actual[ i ] ) : '<missing>' )
			);
			if ( problems.length >= 3 ) break;
		}

		if ( problems.length ) {
			row.status = 'STRUCTURE DIFFERS';
			row.detail = problems.join( '\n' ) + '\n  (' + expected.length + ' source nodes, ' + actual.length + ' served nodes)';
		}

		// Assets: the section's stylesheet and script must actually be on the page.
		const missingAssets = [];
		if ( section.style && ! body.includes( path.basename( section.style.file ) ) ) missingAssets.push( 'CSS' );
		if ( section.script && ! body.includes( path.basename( section.script.file ) ) ) missingAssets.push( 'JS' );
		if ( missingAssets.length ) {
			row.status = ( 'OK' === row.status ? '' : row.status + ' + ' ) + 'MISSING ' + missingAssets.join( ' & ' );
		}

		row.nodes = expected.length;
	}

	if ( ! row.status.startsWith( 'OK' ) ) failures += 1;
	rows.push( row );
}

const pad = ( value, width ) => String( value ).padEnd( width );
console.log( pad( 'section', 20 ) + pad( 'nodes', 7 ) + 'result' );
console.log( '-'.repeat( 62 ) );
for ( const row of rows ) {
	console.log( pad( row.key, 20 ) + pad( row.nodes ?? '-', 7 ) + row.status );
}
for ( const row of rows ) {
	if ( row.detail ) {
		console.log( '\n--- ' + row.key + ' ---\n' + row.detail );
	}
}

console.log( '\nCombined page: ' + ( pages.__all__ ? pages.__all__.url : 'n/a' ) );
console.log( failures ? failures + ' section(s) FAILED.' : 'Every section renders through Elementor exactly as the source file does.' );
process.exitCode = failures ? 1 : 0;
