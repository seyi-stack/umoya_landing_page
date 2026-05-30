<?php
/**
 * Plugin Name: Umoya Elementor Widgets
 * Plugin URI:  https://umoyaafrikatours.co.za
 * Description: Custom Elementor widgets for the Umoya Afrika Tours homepage and Founder's Circle landing page.
 * Version:     1.1.0
 * Author:      Umoya Afrika Tours
 * Author URI:  https://umoyaafrikatours.co.za
 * Text Domain: umoya-elementor-widgets
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Elementor tested up to: 3.20
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'UMOYA_EW_VERSION', '1.1.0' );
define( 'UMOYA_EW_PATH', plugin_dir_path( __FILE__ ) );
define( 'UMOYA_EW_URL', plugin_dir_url( __FILE__ ) );

function umoya_ew_init() {
    require_once UMOYA_EW_PATH . 'includes/class-submissions.php';
    \Umoya_EW\Submissions::instance();

    require_once UMOYA_EW_PATH . 'includes/class-console-cleanup.php';
    \Umoya_EW\Console_Cleanup::instance();

    if ( ! did_action( 'elementor/loaded' ) ) {
        add_action( 'admin_notices', 'umoya_ew_missing_elementor_notice' );
        return;
    }

    require_once UMOYA_EW_PATH . 'includes/class-plugin.php';
    \Umoya_EW\Plugin::instance();
}
add_action( 'plugins_loaded', 'umoya_ew_init' );

function umoya_ew_missing_elementor_notice() {
    echo '<div class="notice notice-error"><p><strong>Umoya Elementor Widgets</strong> requires <strong>Elementor</strong> to be installed and activated.</p></div>';
}
