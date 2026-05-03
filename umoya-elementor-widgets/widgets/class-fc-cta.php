<?php
namespace Umoya_EW\Widgets;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class FC_CTA extends \Umoya_EW\Base_Widget {

    public function get_name() {
        return 'fc-cta';
    }

    public function get_title() {
        return 'FC Closing CTA';
    }

    public function get_icon() {
        return 'eicon-call-to-action';
    }

    public function get_style_depends() {
        return array( 'fc-shared', 'fc-section-05b' );
    }

    public function get_script_depends() {
        return array( 'fc-section-05b-cta' );
    }

    public function get_keywords() {
        return array( 'umoya', 'cta', 'closing', 'join' );
    }

    protected function register_controls() {}

    protected function render() {
        $this->render_template( 'section-05b-cta.php' );
    }
}
