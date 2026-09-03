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

/**
 * Minimal Elementor document: one container holding the given widgets.
 *
 * Each entry is either a widget name, or `array( 'html' => '<markup>' )` to
 * place Elementor's own HTML widget. The second form is what lets the browser
 * check compare a compiled section widget against the very same section pasted
 * in the way the site is built today.
 */
function uew_test_document( array $widget_names, $seed ) {
	$children = array();

	// Ids must be unique across the document. When the container and a widget
	// share one, Elementor writes both their generated rules under the same
	// `.elementor-element-<id>` selector and the container silently loses its
	// own settings -- which showed up as a phantom layout difference.
	$element_id = function ( $suffix ) use ( $seed ) {
		return substr( md5( $seed . '|' . $suffix ), 0, 7 );
	};

	foreach ( $widget_names as $index => $name ) {
		if ( is_array( $name ) && isset( $name['html'] ) ) {
			$children[] = array(
				'id'         => $element_id( 'html-' . $index ),
				'elType'     => 'widget',
				'widgetType' => 'html',
				'settings'   => array( 'html' => $name['html'] ),
				'elements'   => array(),
			);
			continue;
		}

		$children[] = array(
			'id'         => $element_id( 'widget-' . $index ),
			'elType'     => 'widget',
			'widgetType' => $name,
			'settings'   => new stdClass(),
			'elements'   => array(),
		);
	}

	return array(
		array(
			'id'       => $element_id( 'container' ),
			'elType'   => 'container',
			'settings' => array(
				'content_width' => 'full',
				'padding'       => array( 'unit' => 'px', 'top' => '0', 'right' => '0', 'bottom' => '0', 'left' => '0', 'isLinked' => true ),
			),
			'elements' => $children,
			'isInner'  => false,
		),
	);
}

function uew_upsert_page( $slug, $title, array $widget_names ) {
	$existing = get_page_by_path( $slug, OBJECT, 'page' );

	$postarr = array(
		'post_title'   => $title,
		'post_name'    => $slug,
		'post_status'  => 'publish',
		'post_type'    => 'page',
		'post_content' => '',
	);

	if ( $existing ) {
		$postarr['ID'] = $existing->ID;
		$id            = wp_update_post( $postarr, true );
	} else {
		$id = wp_insert_post( $postarr, true );
	}

	if ( is_wp_error( $id ) ) {
		WP_CLI::warning( $slug . ': ' . $id->get_error_message() );
		return null;
	}

	update_post_meta( $id, '_elementor_edit_mode', 'builder' );
	update_post_meta( $id, '_elementor_template_type', 'wp-page' );
	update_post_meta( $id, '_elementor_version', ELEMENTOR_VERSION );
	update_post_meta( $id, '_wp_page_template', 'elementor_canvas' );
	update_post_meta( $id, '_elementor_data', wp_slash( wp_json_encode( uew_test_document( $widget_names, $slug ) ) ) );

	// Force Elementor to rebuild this page's CSS on the next request.
	$css = \Elementor\Core\Files\CSS\Post::create( $id );
	$css->delete();

	// Elementor also caches each element's rendered HTML in post meta
	// (Document::CACHE_META_KEY, on by default). Without clearing it a page
	// keeps serving the markup produced by the PREVIOUS version of the widget,
	// and every check silently measures stale output.
	delete_post_meta( $id, \Elementor\Core\Base\Document::CACHE_META_KEY );

	return $id;
}

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
