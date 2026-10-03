<?php
/**
 * Create one Elementor page per compiled section in the local harness, plus a
 * combined page with every section in reading order.
 *
 * Run with:
 *   php wp-cli.phar eval-file tools/uew/make-test-pages.php
 *
 * Pages are keyed by slug and reused, so re-running refreshes them in place
 * rather than piling up drafts.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}

$manifest_file = UMOYA_EW_PATH . 'includes/sections/index.json';
if ( ! file_exists( $manifest_file ) ) {
	WP_CLI::error( 'No compiled sections found. Run node tools/uew/build.mjs first.' );
}

$manifest = json_decode( file_get_contents( $manifest_file ), true );

require_once __DIR__ . '/lib/pages.php';

// Element caching would hide the very changes these pages exist to test.
update_option( 'elementor_element_cache_ttl', 'disable' );

$results = array();
$all     = array();

$repo_root = dirname( dirname( __DIR__ ) );

foreach ( $manifest as $key => $section ) {
	$all[] = $section['name'];
	$slug  = 'uew-' . str_replace( '_', '-', $key );

	$id = uew_upsert_page( $slug, 'UEW: ' . $section['title'], array( $section['name'] ) );
	if ( $id ) {
		$results[ $key ] = array( 'id' => $id, 'url' => get_permalink( $id ) );
	}

	// Reference page: the same section pasted into Elementor's HTML widget,
	// which is how every Umoya page is built today. The browser check measures
	// one against the other.
	$source_file = $repo_root . '/' . $section['source'];
	if ( file_exists( $source_file ) ) {
		$raw = file_get_contents( $source_file );
		$ref = uew_upsert_page( $slug . '-raw', 'UEW raw: ' . $section['title'], array( array( 'html' => $raw ) ) );
		if ( $ref && isset( $results[ $key ] ) ) {
			$results[ $key ]['raw_url'] = get_permalink( $ref );
		}
	}
}

$combined = uew_upsert_page( 'uew-all-sections', 'UEW: All Founder\'s Circle sections', $all );
if ( $combined ) {
	$results['__all__'] = array( 'id' => $combined, 'url' => get_permalink( $combined ) );
}

echo wp_json_encode( $results ) . "\n";
