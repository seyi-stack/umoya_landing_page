<?php
/**
 * Elementor test-page helpers shared by make-test-pages.php and make-pages.php.
 *
 * Loaded inside `wp eval-file`, so WordPress and Elementor are already booted.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}

/**
 * Minimal Elementor document: one container holding the given widgets.
 *
 * Each entry is a widget name, `array( 'html' => '<markup>' )` to place
 * Elementor's own HTML widget, or `array( 'name' => ..., 'settings' => ... )`
 * for a section widget with explicit control values. The second form is what
 * lets the browser check compare a compiled section widget against the very
 * same section pasted in the way the site is built today; the third is what
 * lets the control check set a value on every control and look for it.
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

		$settings = new stdClass();
		if ( is_array( $name ) && isset( $name['name'] ) ) {
			if ( ! empty( $name['settings'] ) ) {
				$settings = $name['settings'];
			}
			$name = $name['name'];
		}

		$children[] = array(
			'id'         => $element_id( 'widget-' . $index ),
			'elType'     => 'widget',
			'widgetType' => $name,
			'settings'   => $settings,
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

/**
 * Create or refresh a published Elementor Canvas page. Pages are keyed by slug
 * and reused, so re-running refreshes them in place rather than piling up.
 */
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
