<?php
namespace Umoya_EW\Widgets;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class FC_Why extends \Umoya_EW\Base_Widget {

    public function get_name() {
        return 'fc-why';
    }

    public function get_title() {
        return 'FC Why Umoya';
    }

    public function get_icon() {
        return 'eicon-info-circle';
    }

    public function get_style_depends() {
        return array( 'fc-shared', 'fc-section-06' );
    }

    public function get_script_depends() {
        return array( 'fc-section-06-video' );
    }

    public function get_keywords() {
        return array( 'umoya', 'why', 'philosophy', 'video' );
    }

    protected function register_controls() {}

    protected function render() {
        $this->render_template( 'section-06-why.php' );
    }
}
