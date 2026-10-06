<?php
/**
 * Loads the compiled section schemas.
 *
 * `includes/sections/index.json` is the manifest -- one entry per widget, with
 * everything needed to register it. The full schema (controls, repeaters, style
 * parts) lives in a file per section and is only read when that widget is
 * actually built, so a page using one section does not parse the other eleven.
 *
 * @package Umoya_EW
 */

namespace Umoya_EW;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Section_Registry {

	private static $manifest = null;
	private static $schemas  = array();

	/** @return array Manifest entries keyed by section key. */
	public static function manifest() {
		if ( null === self::$manifest ) {
			self::$manifest = self::read_json( UMOYA_EW_PATH . 'includes/sections/index.json' );
		}

		return self::$manifest;
	}

	/**
	 * Full schema for one section, manifest fields included.
	 *
	 * @param string $key Section key.
	 * @return array
	 */
	public static function get( $key ) {
		if ( ! isset( self::$schemas[ $key ] ) ) {
			$schema = self::read_json( UMOYA_EW_PATH . 'includes/sections/' . sanitize_file_name( $key ) . '.json' );

			// Defaults so a widget never has to guard every lookup.
			self::$schemas[ $key ] = array_merge(
				array(
					'regions'             => array(),
					'content_panels'      => array(),
					'style_panels'        => array(),
					'advanced_panels'     => array(),
					'repeaters'           => array(),
					'style_parts'         => array(),
					'inline_styles'       => array(),
					'fields'              => array(),
					'tokens'              => array(),
				),
				$schema
			);
		}

		return self::$schemas[ $key ];
	}

	/**
	 * Elementor categories, emitted by the compiler from the section registries.
	 *
	 * Kept in a file rather than hardcoded here so that adding a page family is a
	 * registry file and nothing else.
	 *
	 * @return array List of { slug, title, icon }.
	 */
	public static function categories() {
		$categories = self::read_json( UMOYA_EW_PATH . 'includes/sections/categories.json' );

		return array_values( array_filter( $categories, function ( $category ) {
			return ! empty( $category['slug'] ) && ! empty( $category['title'] );
		} ) );
	}

	/** @return array Manifest entries that have a widget class to register. */
	public static function widgets() {
		return array_filter(
			self::manifest(),
			function ( $section ) {
				return ! empty( $section['widget_file'] ) && ! empty( $section['class_name'] );
			}
		);
	}

	/** @return array handle => [file, deps] for every section stylesheet. */
	public static function styles() {
		$styles = array();

		foreach ( self::manifest() as $section ) {
			if ( empty( $section['style']['handle'] ) ) {
				continue;
			}

			$styles[ $section['style']['handle'] ] = array(
				'file' => $section['style']['file'],
				'deps' => array(),
			);
		}

		return $styles;
	}

	/** @return array handle => [file, deps] for every section script. */
	public static function scripts() {
		$scripts = array();

		foreach ( self::manifest() as $section ) {
			if ( empty( $section['script']['handle'] ) ) {
				continue;
			}

			$scripts[ $section['script']['handle'] ] = array(
				'file' => $section['script']['file'],
				// Load after Elementor's frontend so `elementorFrontend.hooks` is
				// already there when the section registers its element_ready
				// handler, rather than having to wait for an event.
				'deps' => array( 'elementor-frontend' ),
			);
		}

		return $scripts;
	}

	private static function read_json( $path ) {
		if ( ! file_exists( $path ) ) {
			return array();
		}

		$data = json_decode( file_get_contents( $path ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions

		return is_array( $data ) ? $data : array();
	}
}
