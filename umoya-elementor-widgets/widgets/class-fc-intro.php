<?php
namespace Umoya_EW\Widgets;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class FC_Intro extends \Umoya_EW\Base_Widget {

    public function get_name() {
        return 'fc-intro';
    }

    public function get_title() {
        return 'FC Intro';
    }

    public function get_icon() {
        return 'eicon-text';
    }

    public function get_style_depends() {
        return array( 'fc-shared', 'fc-section-02-intro' );
    }

    public function get_script_depends() {
        return array( 'fc-section-02-intro' );
    }

    public function get_keywords() {
        return array( 'umoya', 'intro', 'introduction' );
    }

    protected function register_controls() {}

    protected function render() {
        $this->render_template( 'section-02-intro.php' );
    }
}
