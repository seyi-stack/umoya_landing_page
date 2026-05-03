<?php
namespace Umoya_EW\Widgets;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class FC_Journey_Header extends \Umoya_EW\Base_Widget {

    public function get_name() {
        return 'fc-journey-header';
    }

    public function get_title() {
        return 'FC Journey';
    }

    public function get_icon() {
        return 'eicon-map-pin';
    }

    public function get_style_depends() {
        return array( 'fc-shared', 'fc-section-05' );
    }

    public function get_script_depends() {
        return array( 'fc-section-05-journey' );
    }

    public function get_keywords() {
        return array( 'umoya', 'journey', 'provinces', 'map' );
    }

    protected function register_controls() {}

    protected function render() {
        $this->render_template( 'section-05-journey.php' );
    }
}
