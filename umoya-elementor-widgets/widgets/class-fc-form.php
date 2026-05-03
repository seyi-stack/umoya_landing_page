<?php
namespace Umoya_EW\Widgets;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class FC_Form extends \Umoya_EW\Base_Widget {

    public function get_name() {
        return 'fc-form';
    }

    public function get_title() {
        return 'FC Form';
    }

    public function get_icon() {
        return 'eicon-form-horizontal';
    }

    public function get_style_depends() {
        return array( 'fc-shared', 'fc-section-02-form' );
    }

    public function get_script_depends() {
        return array( 'fc-section-02-form' );
    }

    public function get_keywords() {
        return array( 'umoya', 'form', 'application' );
    }

    protected function register_controls() {}

    protected function render() {
        $this->render_template( 'section-02-form.php' );
    }
}
