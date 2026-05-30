<?php
namespace Umoya_EW;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

final class Section_Registry {

    private static $sections = null;

    public static function all() {
        if ( null === self::$sections ) {
            $path = UMOYA_EW_PATH . 'includes/section-definitions.json';
            $json = file_exists( $path ) ? file_get_contents( $path ) : '';
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
