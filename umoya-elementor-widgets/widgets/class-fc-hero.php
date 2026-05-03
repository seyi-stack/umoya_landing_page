<?php
namespace Umoya_EW\Widgets;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class FC_Hero extends \Umoya_EW\Base_Widget {

    public function get_name() {
        return 'fc-hero';
    }

    public function get_title() {
        return 'FC Hero';
    }

    public function get_icon() {
        return 'eicon-banner';
    }

    public function get_style_depends() {
        return array( 'fc-shared', 'fc-section-01' );
    }

    public function get_script_depends() {
        return array( 'fc-section-01-hero' );
    }

    public function get_keywords() {
        return array( 'umoya', 'hero', 'founders', 'circle' );
    }

    protected function register_controls() {}

    protected function render() {
        $this->render_template( 'section-01-hero.php' );
    }
}
