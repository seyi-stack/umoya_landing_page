/**
 * Edit check: change every control and prove the change lands where it should.
 *
 *   node tools/uew/edit-check.mjs [--only=fc_form,site_footer]
 *
 * The build, render and browser checks all prove that a widget's DEFAULTS
 * reproduce the source file. None of them edits anything, so a control wired to
 * nothing -- or wired to the wrong spot, or one that breaks the markup when
 * changed -- passed all of them. This drives edit-check.php, which renders each
 * widget through Elementor's real code path once per control, per repeater
 * operation, and once with hostile input in every field. See that file for
 * exactly what is asserted.
 *
 * Needs the local harness installed, not the server.
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const here = path.dirname( fileURLToPath( import.meta.url ) );
const repoRoot = path.resolve( here, '..', '..' );
const wpDir = path.join( repoRoot, 'local-env', 'wordpress' );
const php = path.join( repoRoot, 'local-env', 'php', 'php.exe' );
const phpIni = path.join( repoRoot, 'local-env', 'php', 'php.ini' );
const wpCli = path.join( repoRoot, 'local-env', 'bin', 'wp-cli.phar' );

const args = process.argv.slice( 2 );
const only = ( args.find( ( a ) => a.startsWith( '--only=' ) ) || '' ).replace( '--only=', '' );
const keys = only ? only.split( ',' ).map( ( s ) => s.trim() ).filter( Boolean ) : [];

console.log( '\nUmoya widget edit check' );
console.log( '=======================\n' );
console.log( 'Changing every control, repeater row and field, and checking where the change lands.\n' );

const jobFile = path.join( os.tmpdir(), 'uew-edit-check-' + process.pid + '.json' );
fs.writeFileSync( jobFile, JSON.stringify( { keys } ), 'utf8' );

let results;
try {
	const out = execFileSync(
		php,
		[ '-c', phpIni, wpCli, 'eval-file', path.join( here, 'edit-check.php' ), jobFile ],
		{ cwd: wpDir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
	);
	results = JSON.parse( out.slice( out.indexOf( '{' ) ) );
} catch ( error ) {
	console.error( 'The edit check could not run:\n' + ( error.stdout || '' ) + ( error.stderr || error.message ) );
	process.exit( 1 );
} finally {
	fs.rmSync( jobFile, { force: true } );
}

const pad = ( value, width ) => String( value ).padEnd( width );
console.log( pad( 'section', 26 ) + pad( 'controls', 10 ) + pad( 'repeaters', 11 ) + 'result' );
console.log( '-'.repeat( 66 ) );

let failures = 0;
let controls = 0;
let repeaters = 0;
for ( const [ key, row ] of Object.entries( results ) ) {
	controls += row.scalars;
	repeaters += row.repeaters;
	if ( row.failures.length ) failures += 1;
	console.log( pad( key, 26 ) + pad( row.scalars, 10 ) + pad( row.repeaters, 11 ) + ( row.failures.length ? row.failures.length + ' FAILURE(S)' : 'OK' ) );
}

for ( const [ key, row ] of Object.entries( results ) ) {
	if ( ! row.failures.length ) continue;
	console.log( '\n--- ' + key + ' ---' );
	for ( const failure of row.failures.slice( 0, 25 ) ) console.log( '  ' + failure );
	if ( row.failures.length > 25 ) console.log( '  … ' + ( row.failures.length - 25 ) + ' more' );
}

console.log(
	'\n' + controls + ' controls and ' + repeaters + ' repeaters exercised across ' + Object.keys( results ).length + ' sections.\n' +
	( failures ? failures + ' section(s) have controls that do not edit what they say they edit.' : 'Every control edits exactly its own part of the markup, safely.' )
);
process.exitCode = failures ? 1 : 0;
