<?php
/**
 * Create Elementor test pages from a JSON job, for checks that need widgets
 * with specific control values rather than their defaults.
 *
 *   php wp-cli.phar eval-file tools/uew/make-pages.php <job.json>
 *
 * The job is { "pages": [ { "slug", "title", "widgets": [ entry, ... ] } ] }
 * where each entry is { "name": "<widget>", "settings": { ... } } or
 * { "html": "<markup>" }. Prints { slug: { id, url } } as JSON.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}

require_once __DIR__ . '/lib/pages.php';

$job_file = isset( $args[0] ) ? $args[0] : '';
if ( ! $job_file || ! file_exists( $job_file ) ) {
	WP_CLI::error( 'make-pages.php: job file not found: ' . $job_file );
}

$job = json_decode( file_get_contents( $job_file ), true );
if ( ! is_array( $job ) || empty( $job['pages'] ) ) {
	WP_CLI::error( 'make-pages.php: job has no pages' );
}

// Element caching would hide the very changes these pages exist to test.
update_option( 'elementor_element_cache_ttl', 'disable' );

$results = array();
foreach ( $job['pages'] as $page ) {
	$id = uew_upsert_page( $page['slug'], $page['title'], $page['widgets'] );
	if ( $id ) {
		$results[ $page['slug'] ] = array( 'id' => $id, 'url' => get_permalink( $id ) );
	}
}

echo wp_json_encode( $results ) . "\n";
