<?php
namespace Umoya_EW;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

abstract class Base_Widget extends \Elementor\Widget_Base {

    public function get_categories() {
        return array( 'umoya-fc' );
    }

    public function get_icon() {
        return 'eicon-globe';
    }

    public function get_style_depends() {
        return array( 'fc-shared' );
    }

    protected function render_template( $template ) {
        $path = UMOYA_EW_PATH . 'templates/' . ltrim( $template, '/\\' );

        if ( file_exists( $path ) ) {
            include $path;
        }
    }

    protected function render_section_template( $template ) {
        $this->render_template( $template );
    }
}
