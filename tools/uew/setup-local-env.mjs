/**
 * Build the local WordPress + Elementor harness the widget checks run against.
 *
 *   node tools/uew/setup-local-env.mjs          install (idempotent)
 *   node tools/uew/setup-local-env.mjs --serve  install, then start the server
 *
 * Everything lands in local-env/, which is git-ignored. Nothing is installed
 * system-wide and nothing outside this directory is touched: PHP is the
 * portable Windows build, the database is SQLite via WordPress's own drop-in,
 * so there is no MySQL, no Docker and no admin rights involved.
 *
 * Elementor is pinned to the version the live site runs (see ELEMENTOR_VERSION
 * below). Testing against a different build would prove very little.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync, spawn } from 'child_process';
import zlib from 'zlib';

const here = path.dirname( fileURLToPath( import.meta.url ) );
const repoRoot = path.resolve( here, '..', '..' );
const env = path.join( repoRoot, 'local-env' );
const downloads = path.join( env, '_dl' );

const PHP_VERSION = '8.2.33';
const ELEMENTOR_VERSION = '4.2.4'; // Matches umoyaafrikatours.co.za, checked 2026-09-03.
const PORT = 8765;

const SOURCES = {
	'php.zip': `https://windows.php.net/downloads/releases/php-${ PHP_VERSION }-nts-Win32-vs16-x64.zip`,
	'wp.zip': 'https://wordpress.org/latest.zip',
	'elementor.zip': `https://downloads.wordpress.org/plugin/elementor.${ ELEMENTOR_VERSION }.zip`,
	'sqlite.zip': 'https://downloads.wordpress.org/plugin/sqlite-database-integration.zip',
	'wp-cli.phar': 'https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar',
};

const PHP_INI = `; Portable PHP for the Umoya local WordPress test environment.
extension_dir = "ext"
extension=mbstring
extension=sqlite3
extension=pdo_sqlite
extension=curl
extension=openssl
extension=zip
extension=gd
extension=exif
extension=fileinfo
extension=intl
extension=sodium

; OPcache. Without it every request recompiles WordPress and Elementor from
; source, and the checks -- hundreds of page loads through a single-threaded
; server -- spend most of their time doing exactly that. The built-in server is
; the CLI SAPI, hence enable_cli. revalidate_freq=0 re-checks file timestamps on
; every request, so an edited plugin file is picked up immediately.
zend_extension=opcache
opcache.enable=1
opcache.enable_cli=1
opcache.memory_consumption=256
opcache.max_accelerated_files=20000
opcache.validate_timestamps=1
opcache.revalidate_freq=0

memory_limit = 512M
max_execution_time = 300
upload_max_filesize = 64M
post_max_size = 64M
display_errors = On
display_startup_errors = On
error_reporting = E_ALL
log_errors = On
date.timezone = UTC
`;

const ROUTER = `<?php
/**
 * Router for PHP's built-in server so WordPress pretty permalinks work.
 * Real files (assets, wp-admin/*.php) are served directly; everything else
 * falls through to WordPress's front controller.
 */
$docroot = __DIR__ . '/wordpress';
$path    = parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH );
$full    = $docroot . urldecode( $path );

if ( '/' !== $path && file_exists( $full ) && ! is_dir( $full ) ) {
	return false; // let the built-in server handle it (PHP files still execute)
}

if ( is_dir( $full ) && file_exists( rtrim( $full, '/' ) . '/index.php' ) ) {
	$_SERVER['SCRIPT_NAME'] = rtrim( $path, '/' ) . '/index.php';
	require rtrim( $full, '/' ) . '/index.php';
	return true;
}

$_SERVER['SCRIPT_NAME'] = '/index.php';
require $docroot . '/index.php';
`;

const WP_CONFIG = `<?php
/**
 * Local test-only WordPress config for the Umoya Elementor widget harness.
 * SQLite-backed; never deployed anywhere.
 */
define( 'DB_ENGINE', 'sqlite' );
define( 'DB_NAME', 'umoya_local' );
define( 'DB_USER', 'root' );
define( 'DB_PASSWORD', '' );
define( 'DB_HOST', 'localhost' );
define( 'DB_CHARSET', 'utf8mb4' );
define( 'DB_COLLATE', '' );

define( 'AUTH_KEY',         'umoya-local-auth' );
define( 'SECURE_AUTH_KEY',  'umoya-local-secure-auth' );
define( 'LOGGED_IN_KEY',    'umoya-local-logged-in' );
define( 'NONCE_KEY',        'umoya-local-nonce' );
define( 'AUTH_SALT',        'umoya-local-auth-salt' );
define( 'SECURE_AUTH_SALT', 'umoya-local-secure-auth-salt' );
define( 'LOGGED_IN_SALT',   'umoya-local-logged-in-salt' );
define( 'NONCE_SALT',       'umoya-local-nonce-salt' );

$table_prefix = 'wp_';

define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );
define( 'SCRIPT_DEBUG', true );
define( 'DISABLE_WP_CRON', true );
define( 'WP_ENVIRONMENT_TYPE', 'local' );
define( 'AUTOMATIC_UPDATER_DISABLED', true );

// No outbound HTTP from PHP. The harness renders local pages; it has no use
// for WordPress.org or Elementor's remote APIs, and on a single-threaded
// server one of those calls blocks every other request until it times out --
// the first admin page after a restart once took long enough to fail login.
define( 'WP_HTTP_BLOCK_EXTERNAL', true );
define( 'WP_AUTO_UPDATE_CORE', false );
define( 'FS_METHOD', 'direct' );

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}
require_once ABSPATH . 'wp-settings.php';
`;

/* ----------------------------------------------------------------- helpers */

function log( message ) {
	console.log( '  ' + message );
}

async function download( name, url ) {
	const target = path.join( downloads, name );
	if ( fs.existsSync( target ) && fs.statSync( target ).size > 1024 ) {
		log( name + ' already downloaded' );
		return target;
	}

	log( 'downloading ' + name + ' …' );
	const response = await fetch( url, { redirect: 'follow' } );
	if ( ! response.ok ) throw new Error( 'Download failed (' + response.status + '): ' + url );
	fs.writeFileSync( target, Buffer.from( await response.arrayBuffer() ) );
	return target;
}

/** Extract a zip with PHP's ZipArchive -- no extra Node dependency needed. */
function unzip( phpBinary, zipFile, destination ) {
	fs.mkdirSync( destination, { recursive: true } );
	const script =
		'$zip = new ZipArchive(); ' +
		'if ( $zip->open( $argv[1] ) !== true ) { fwrite( STDERR, "cannot open zip" ); exit( 1 ); } ' +
		'$zip->extractTo( $argv[2] ); $zip->close(); echo "ok";';
	execFileSync( phpBinary, [ '-d', 'extension_dir=ext', '-d', 'extension=zip', '-r', script, zipFile, destination ], {
		cwd: path.dirname( phpBinary ),
		encoding: 'utf8',
	} );
}

function run( phpBinary, iniFile, args, options = {} ) {
	return execFileSync( phpBinary, [ '-c', iniFile, ...args ], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, ...options } );
}

/* -------------------------------------------------------------------- main */

console.log( '\nUmoya local WordPress harness' );
console.log( '============================\n' );

fs.mkdirSync( downloads, { recursive: true } );

const phpDir = path.join( env, 'php' );
const phpBinary = path.join( phpDir, 'php.exe' );
const phpIni = path.join( phpDir, 'php.ini' );
const wpDir = path.join( env, 'wordpress' );
const wpCli = path.join( env, 'bin', 'wp-cli.phar' );

// 1. PHP -------------------------------------------------------------------
if ( ! fs.existsSync( phpBinary ) ) {
	const zip = await download( 'php.zip', SOURCES[ 'php.zip' ] );
	fs.mkdirSync( phpDir, { recursive: true } );
	// Bootstrap problem: we need PHP to unzip, and this IS PHP. Node's zlib can
	// only inflate a raw stream, so the first archive is unpacked by hand.
	extractZipWithNode( zip, phpDir );
	log( 'PHP ' + PHP_VERSION + ' installed' );
} else {
	log( 'PHP already installed' );
}

fs.writeFileSync( phpIni, PHP_INI, 'utf8' );

// 2. WordPress core --------------------------------------------------------
if ( ! fs.existsSync( path.join( wpDir, 'wp-settings.php' ) ) ) {
	const zip = await download( 'wp.zip', SOURCES[ 'wp.zip' ] );
	unzip( phpBinary, zip, env );
	log( 'WordPress installed' );
} else {
	log( 'WordPress already present' );
}

// 3. Plugins ---------------------------------------------------------------
const pluginsDir = path.join( wpDir, 'wp-content', 'plugins' );
fs.mkdirSync( pluginsDir, { recursive: true } );

const elementorMain = path.join( pluginsDir, 'elementor', 'elementor.php' );
const elementorInstalled = fs.existsSync( elementorMain ) &&
	fs.readFileSync( elementorMain, 'utf8' ).includes( 'Version: ' + ELEMENTOR_VERSION );
if ( ! elementorInstalled ) {
	fs.rmSync( path.join( pluginsDir, 'elementor' ), { recursive: true, force: true } );
	unzip( phpBinary, await download( 'elementor.zip', SOURCES[ 'elementor.zip' ] ), pluginsDir );
	log( 'Elementor ' + ELEMENTOR_VERSION + ' installed' );
} else {
	log( 'Elementor ' + ELEMENTOR_VERSION + ' already installed' );
}

if ( ! fs.existsSync( path.join( pluginsDir, 'sqlite-database-integration' ) ) ) {
	unzip( phpBinary, await download( 'sqlite.zip', SOURCES[ 'sqlite.zip' ] ), pluginsDir );
	log( 'SQLite integration installed' );
}

// The drop-in falls back to locating the plugin folder itself, so a straight
// copy works without any placeholder substitution.
fs.copyFileSync(
	path.join( pluginsDir, 'sqlite-database-integration', 'db.copy' ),
	path.join( wpDir, 'wp-content', 'db.php' )
);

// 4. wp-cli, config, router ------------------------------------------------
fs.mkdirSync( path.join( env, 'bin' ), { recursive: true } );
if ( ! fs.existsSync( wpCli ) ) {
	fs.copyFileSync( await download( 'wp-cli.phar', SOURCES[ 'wp-cli.phar' ] ), wpCli );
}

fs.writeFileSync( path.join( wpDir, 'wp-config.php' ), WP_CONFIG, 'utf8' );
fs.writeFileSync( path.join( env, 'router.php' ), ROUTER, 'utf8' );

// 5. Install WordPress -----------------------------------------------------
const installed = ( () => {
	try {
		run( phpBinary, phpIni, [ wpCli, 'core', 'is-installed' ], { cwd: wpDir, stdio: 'pipe' } );
		return true;
	} catch ( error ) {
		return false;
	}
} )();

if ( ! installed ) {
	run( phpBinary, phpIni, [
		wpCli, 'core', 'install',
		'--url=http://localhost:' + PORT,
		'--title=Umoya Widget Lab',
		'--admin_user=admin',
		'--admin_password=admin',
		'--admin_email=dev@example.com',
		'--skip-email',
	], { cwd: wpDir } );
	log( 'WordPress installed (admin / admin)' );
} else {
	log( 'WordPress already configured' );
}

run( phpBinary, phpIni, [ wpCli, 'rewrite', 'structure', '/%postname%/' ], { cwd: wpDir, stdio: 'pipe' } );

// 6. Link the plugin under test -------------------------------------------
const linkTarget = path.join( pluginsDir, 'umoya-elementor-widgets' );
if ( ! fs.existsSync( linkTarget ) ) {
	try {
		fs.symlinkSync( path.join( repoRoot, 'umoya-elementor-widgets' ), linkTarget, 'junction' );
		log( 'plugin linked into WordPress' );
	} catch ( error ) {
		throw new Error( 'Could not link the plugin into WordPress: ' + error.message );
	}
} else {
	log( 'plugin already linked' );
}

for ( const plugin of [ 'elementor', 'umoya-elementor-widgets' ] ) {
	run( phpBinary, phpIni, [ wpCli, 'plugin', 'activate', plugin ], { cwd: wpDir, stdio: 'pipe' } );
}
log( 'Elementor and the Umoya plugin are active' );

console.log( '\nReady.' );
console.log( '  Start the server : node tools/uew/setup-local-env.mjs --serve' );
console.log( '  Site             : http://127.0.0.1:' + PORT + '/' );
console.log( '  Admin            : http://127.0.0.1:' + PORT + '/wp-admin/  (admin / admin)' );
console.log( '  Compile widgets  : node tools/uew/build.mjs' );
console.log( '  Compare rendering: node tools/uew/render-check.mjs' );
console.log( '  Compare visually : node tools/uew/browser-check.mjs\n' );

if ( process.argv.includes( '--serve' ) ) {
	const server = spawn( phpBinary, [ '-c', phpIni, '-S', '127.0.0.1:' + PORT, '-t', wpDir, path.join( env, 'router.php' ) ], {
		stdio: 'inherit',
	} );
	process.on( 'SIGINT', () => server.kill() );
}

/* ------------------------------------------------------------ zip fallback */

/**
 * Minimal ZIP reader for the one archive we cannot use PHP to open: PHP itself.
 * Handles the two methods the official Windows builds use -- stored and
 * deflated -- and nothing else, deliberately.
 */
function extractZipWithNode( zipFile, destination ) {
	const buffer = fs.readFileSync( zipFile );

	// Locate the end-of-central-directory record.
	let eocd = -1;
	for ( let i = buffer.length - 22; i >= 0 && i > buffer.length - 66000; i -= 1 ) {
		if ( 0x06054b50 === buffer.readUInt32LE( i ) ) {
			eocd = i;
			break;
		}
	}
	if ( eocd < 0 ) throw new Error( 'Not a zip file: ' + zipFile );

	const entryCount = buffer.readUInt16LE( eocd + 10 );
	let offset = buffer.readUInt32LE( eocd + 16 );

	for ( let i = 0; i < entryCount; i += 1 ) {
		if ( 0x02014b50 !== buffer.readUInt32LE( offset ) ) throw new Error( 'Corrupt central directory' );

		const method = buffer.readUInt16LE( offset + 10 );
		const compressedSize = buffer.readUInt32LE( offset + 20 );
		const nameLength = buffer.readUInt16LE( offset + 28 );
		const extraLength = buffer.readUInt16LE( offset + 30 );
		const commentLength = buffer.readUInt16LE( offset + 32 );
		const localOffset = buffer.readUInt32LE( offset + 42 );
		const name = buffer.toString( 'utf8', offset + 46, offset + 46 + nameLength );

		const localNameLength = buffer.readUInt16LE( localOffset + 26 );
		const localExtraLength = buffer.readUInt16LE( localOffset + 28 );
		const dataStart = localOffset + 30 + localNameLength + localExtraLength;
		const data = buffer.subarray( dataStart, dataStart + compressedSize );

		const outPath = path.join( destination, name );
		if ( name.endsWith( '/' ) ) {
			fs.mkdirSync( outPath, { recursive: true } );
		} else {
			fs.mkdirSync( path.dirname( outPath ), { recursive: true } );
			fs.writeFileSync( outPath, 0 === method ? data : zlib.inflateRawSync( data ) );
		}

		offset += 46 + nameLength + extraLength + commentLength;
	}
}
