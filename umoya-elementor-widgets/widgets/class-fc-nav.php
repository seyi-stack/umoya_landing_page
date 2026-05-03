<?php
namespace Umoya_EW\Widgets;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class FC_Nav extends \Umoya_EW\Base_Widget {

    public function get_name() {
        return 'fc-nav';
    }

    public function get_title() {
        return 'FC Sticky Nav';
    }

    public function get_icon() {
        return 'eicon-header';
    }

    public function get_style_depends() {
        return array( 'fc-shared', 'fc-section-00' );
    }

    public function get_script_depends() {
        return array( 'fc-section-00-nav' );
    }

    public function get_keywords() {
        return array( 'umoya', 'navigation', 'header', 'sticky' );
    }

    protected function register_controls() {}

    protected function render() {
        $this->render_template( 'section-00-nav.php' );
    }
}
