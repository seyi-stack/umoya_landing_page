<?php
namespace Umoya_EW\Widgets;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class FC_Details extends \Umoya_EW\Base_Widget {

    public function get_name() {
        return 'fc-details';
    }

    public function get_title() {
        return 'FC Journey Details';
    }

    public function get_icon() {
        return 'eicon-help-o';
    }

    public function get_style_depends() {
        return array( 'fc-shared', 'fc-section-07' );
    }

    public function get_script_depends() {
        return array( 'fc-section-07-accordion' );
    }

    public function get_keywords() {
        return array( 'umoya', 'details', 'accordion', 'faq' );
    }

    protected function register_controls() {}

    protected function render() {
        $this->render_template( 'section-07-details.php' );
    }
}
