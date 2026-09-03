<?php
/**
 * Registry for the FIRST-GENERATION generated widgets (homepage only).
 *
 * The Founder's Circle sections have moved to the compiler in tools/uew, whose
 * schemas live in includes/sections/. This class is what still drives the
 * homepage widgets in includes/section-definitions.json, and it exists only
 * until those are migrated too -- at which point this file, class-base-widget.php
 * and section-definitions.json all go.
 *
 * @package Umoya_EW
 */

namespace Umoya_EW;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Legacy_Registry {

	private static $sections = null;

	public static function all() {
		if ( null === self::$sections ) {
			$path = UMOYA_EW_PATH . 'includes/section-definitions.json';
			$json = file_exists( $path ) ? file_get_contents( $path ) : ''; // phpcs:ignore WordPress.WP.AlternativeFunctions
			$data = $json ? json_decode( $json, true ) : array();

			self::$sections = is_array( $data ) ? $data : array();
		}

		return self::$sections;
	}

	public static function get( $key ) {
		$sections = self::all();

		return isset( $sections[ $key ] ) && is_array( $sections[ $key ] ) ? $sections[ $key ] : array();
	}

	public static function widgets() {
		$widgets = array();

		foreach ( self::all() as $section ) {
			if ( empty( $section['widget_file'] ) || empty( $section['class_name'] ) ) {
				continue;
			}

			$widgets[] = $section;
		}

		return $widgets;
	}

	public static function styles() {
		$styles = array();

		foreach ( self::all() as $section ) {
			if ( empty( $section['style_handle'] ) || empty( $section['style_file'] ) ) {
				continue;
			}

			$styles[ $section['style_handle'] ] = array(
				'file' => $section['style_file'],
				'deps' => array( 'fc-shared' ),
			);
		}

		return $styles;
	}

	public static function scripts() {
		$scripts = array();

		foreach ( self::all() as $section ) {
			if ( empty( $section['script_handle'] ) || empty( $section['script_file'] ) ) {
				continue;
			}

			$scripts[ $section['script_handle'] ] = array(
				'file' => $section['script_file'],
				'deps' => array(),
			);
		}

		return $scripts;
	}
}
