<?php
namespace Umoya_EW\Widgets;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class FC_Pillars extends \Umoya_EW\Base_Widget {

    public function get_name() {
        return 'fc-pillars';
    }

    public function get_title() {
        return 'FC Brand Pillars';
    }

    public function get_icon() {
        return 'eicon-columns';
    }

    public function get_style_depends() {
        return array( 'fc-shared', 'fc-section-06b' );
    }

    public function get_script_depends() {
        return array( 'fc-section-06b-pillars' );
    }

    public function get_keywords() {
        return array( 'umoya', 'pillars', 'brand', 'values' );
    }

    protected function register_controls() {}

    protected function render() {
        $this->render_template( 'section-06b-pillars.php' );
    }
}
