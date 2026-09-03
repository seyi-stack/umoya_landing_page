<?php
/**
 * Elementor integration: categories, widget registration and asset handles.
 *
 * Two generations of widget live here at the moment. The Founder's Circle
 * sections are compiled by tools/uew and registered from
 * includes/sections/index.json; the homepage sections are still on the original
 * generator and registered from includes/section-definitions.json. Both are
 * wired up below, and the second set goes away when the homepage is migrated.
 *
 * @package Umoya_EW
 */

namespace Umoya_EW;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Plugin {

	private static $instance = null;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	private function __construct() {
		add_action( 'elementor/elements/categories_registered', array( $this, 'register_categories' ) );
		add_action( 'elementor/widgets/register', array( $this, 'register_widgets' ) );
		add_action( 'elementor/frontend/after_register_styles', array( $this, 'register_styles' ) );
		add_action( 'elementor/frontend/after_register_scripts', array( $this, 'register_scripts' ) );
		add_action( 'elementor/editor/after_enqueue_styles', array( $this, 'enqueue_editor_styles' ) );
	}

	public function register_categories( $elements_manager ) {
		$elements_manager->add_category(
			'umoya-fc',
			array(
				'title' => "Umoya - Founder's Circle",
				'icon'  => 'eicon-globe',
			)
		);

		$elements_manager->add_category(
			'umoya-homepage',
			array(
				'title' => 'Umoya - Homepage',
				'icon'  => 'eicon-home',
			)
		);
	}

	public function register_widgets( $widgets_manager ) {
		require_once UMOYA_EW_PATH . 'includes/class-value-formatter.php';
		require_once UMOYA_EW_PATH . 'includes/class-section-registry.php';
		require_once UMOYA_EW_PATH . 'includes/class-control-factory.php';
		require_once UMOYA_EW_PATH . 'includes/class-section-widget.php';

		foreach ( Section_Registry::widgets() as $section ) {
			$this->register_one( $widgets_manager, $section['widget_file'], $section['class_name'] );
		}

		require_once UMOYA_EW_PATH . 'includes/class-legacy-registry.php';
		require_once UMOYA_EW_PATH . 'includes/class-base-widget.php';

		foreach ( Legacy_Registry::widgets() as $section ) {
			$this->register_one( $widgets_manager, 'widgets/' . $section['widget_file'], $section['class_name'] );
		}
	}

	private function register_one( $widgets_manager, $relative_file, $class_name ) {
		$file = UMOYA_EW_PATH . ltrim( $relative_file, '/\\' );
		if ( ! file_exists( $file ) ) {
			return;
		}

		require_once $file;

		$class = '\\Umoya_EW\\Widgets\\' . $class_name;
		if ( class_exists( $class ) ) {
			$widgets_manager->register( new $class() );
		}
	}

	public function register_styles() {
		foreach ( $this->styles() as $handle => $style ) {
			wp_register_style(
				$handle,
				UMOYA_EW_URL . ltrim( $style['file'], '/\\' ),
				$style['deps'],
				UMOYA_EW_VERSION
			);
		}
	}

	public function register_scripts() {
		foreach ( $this->scripts() as $handle => $script ) {
			wp_register_script(
				$handle,
				UMOYA_EW_URL . ltrim( $script['file'], '/\\' ),
				$script['deps'],
				UMOYA_EW_VERSION,
				true
			);
		}
	}

	/**
	 * The editor iframe does not go through the frontend enqueue path for widgets
	 * that are not yet on the page, so every section stylesheet is loaded there.
	 * Without it a freshly dragged-in section renders unstyled until reload.
	 */
	public function enqueue_editor_styles() {
		$this->register_styles();

		foreach ( array_keys( $this->styles() ) as $handle ) {
			wp_enqueue_style( $handle );
		}
	}

	private function styles() {
		require_once UMOYA_EW_PATH . 'includes/class-section-registry.php';
		require_once UMOYA_EW_PATH . 'includes/class-legacy-registry.php';

		return array_merge(
			array(
				'fc-shared' => array(
					'file' => 'assets/css/fc-shared.css',
					'deps' => array(),
				),
			),
			Section_Registry::styles(),
			Legacy_Registry::styles()
		);
	}

	private function scripts() {
		require_once UMOYA_EW_PATH . 'includes/class-section-registry.php';
		require_once UMOYA_EW_PATH . 'includes/class-legacy-registry.php';

		return array_merge(
			Section_Registry::scripts(),
			Legacy_Registry::scripts()
		);
	}
}
