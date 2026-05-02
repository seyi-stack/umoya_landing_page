<?php
namespace Umoya_EW\Widgets;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * FC Pricing — Section 05a: Founder's Circle pricing offer.
 */
class FC_Pricing extends \Umoya_EW\Base_Widget {

    public function get_name() {
        return 'fc-pricing';
    }

    public function get_title() {
        return 'FC Pricing';
    }

    public function get_icon() {
        return 'eicon-price-table';
    }

    public function get_style_depends() {
        return array( 'fc-shared', 'fc-section-05a' );
    }

    public function get_script_depends() {
        return array( 'fc-section-05a-pricing' );
    }

    public function get_keywords() {
        return array( 'umoya', 'pricing', 'offer', 'founders' );
    }

    protected function register_controls() {}

    protected function render() {
        $this->render_section_template( 'section-05a-pricing.php' );
    }
}
