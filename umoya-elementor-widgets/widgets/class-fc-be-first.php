<?php
namespace Umoya_EW\Widgets;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class FC_Be_First extends \Umoya_EW\Base_Widget {

    public function get_name() {
        return 'fc-be-first';
    }

    public function get_title() {
        return 'FC Be First';
    }

    public function get_icon() {
        return 'eicon-posts-carousel';
    }

    public function get_style_depends() {
        return array( 'fc-shared', 'fc-section-03' );
    }

    public function get_script_depends() {
        return array( 'fc-section-03-slideshow' );
    }

    public function get_keywords() {
        return array( 'umoya', 'first', 'gallery', 'slideshow' );
    }

    protected function register_controls() {}

    protected function render() {
        $this->render_template( 'section-03-be-first.php' );
    }
}
