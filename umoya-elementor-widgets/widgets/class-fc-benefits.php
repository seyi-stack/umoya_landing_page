<?php
namespace Umoya_EW\Widgets;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class FC_Benefits extends \Umoya_EW\Base_Widget {

    public function get_name() {
        return 'fc-benefits';
    }

    public function get_title() {
        return 'FC Benefits';
    }

    public function get_icon() {
        return 'eicon-check-circle';
    }

    public function get_style_depends() {
        return array( 'fc-shared', 'fc-section-04' );
    }

    public function get_script_depends() {
        return array( 'fc-section-04-benefits' );
    }

    public function get_keywords() {
        return array( 'umoya', 'benefits', 'value' );
    }

    protected function register_controls() {}

    protected function render() {
        $this->render_template( 'section-04-benefits.php' );
    }
}
