<?php
namespace Umoya_EW;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

final class Plugin {

    private static $instance = null;

    public static function instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    private function __construct() {
        add_action( 'elementor/elements/categories_registered', array( $this, 'register_categories' ) );
        add_action( 'elementor/widgets/register', array( $this, 'register_widgets' ) );
        add_action( 'elementor/frontend/after_register_styles', array( $this, 'register_styles' ) );
        add_action( 'elementor/frontend/after_register_scripts', array( $this, 'register_scripts' ) );
        add_action( 'elementor/editor/after_enqueue_styles', array( $this, 'enqueue_editor_styles' ) );
    }

    public function register_categories( $elements_manager ) {
        $elements_manager->add_category( 'umoya-fc', array(
            'title' => "Umoya - Founder's Circle",
            'icon'  => 'eicon-globe',
        ) );
    }

    public function register_widgets( $widgets_manager ) {
        require_once UMOYA_EW_PATH . 'includes/class-base-widget.php';

        foreach ( self::widgets() as $widget ) {
            require_once UMOYA_EW_PATH . 'widgets/' . $widget['file'];
            $class_name = '\\Umoya_EW\\Widgets\\' . $widget['class'];
            $widgets_manager->register( new $class_name() );
        }
    }

    public function register_styles() {
        $base_url = UMOYA_EW_URL . 'assets/css/';

        foreach ( self::styles() as $handle => $style ) {
            wp_register_style( $handle, $base_url . $style['file'], $style['deps'], UMOYA_EW_VERSION );
        }
    }

    public function register_scripts() {
        $base_url = UMOYA_EW_URL . 'assets/js/';

        foreach ( self::scripts() as $handle => $script ) {
            wp_register_script( $handle, $base_url . $script['file'], $script['deps'], UMOYA_EW_VERSION, true );
        }
    }

    public function enqueue_editor_styles() {
        $this->register_styles();

        foreach ( array_keys( self::styles() ) as $handle ) {
            wp_enqueue_style( $handle );
        }
    }

    private static function widgets() {
        return array(
            array( 'file' => 'class-fc-nav.php',            'class' => 'FC_Nav' ),
            array( 'file' => 'class-fc-hero.php',           'class' => 'FC_Hero' ),
            array( 'file' => 'class-fc-intro.php',          'class' => 'FC_Intro' ),
            array( 'file' => 'class-fc-form.php',           'class' => 'FC_Form' ),
            array( 'file' => 'class-fc-be-first.php',       'class' => 'FC_Be_First' ),
            array( 'file' => 'class-fc-benefits.php',       'class' => 'FC_Benefits' ),
            array( 'file' => 'class-fc-journey-header.php', 'class' => 'FC_Journey_Header' ),
            array( 'file' => 'class-fc-pricing.php',        'class' => 'FC_Pricing' ),
            array( 'file' => 'class-fc-cta.php',            'class' => 'FC_CTA' ),
            array( 'file' => 'class-fc-why.php',            'class' => 'FC_Why' ),
            array( 'file' => 'class-fc-pillars.php',        'class' => 'FC_Pillars' ),
            array( 'file' => 'class-fc-details.php',        'class' => 'FC_Details' ),
        );
    }

    private static function styles() {
        return array(
            'fc-shared'           => array( 'file' => 'fc-shared.css',            'deps' => array() ),
            'fc-section-00'       => array( 'file' => 'fc-section-00.css',        'deps' => array( 'fc-shared' ) ),
            'fc-section-01'       => array( 'file' => 'fc-section-01.css',        'deps' => array( 'fc-shared' ) ),
            'fc-section-02-intro' => array( 'file' => 'fc-section-02-intro.css',  'deps' => array( 'fc-shared' ) ),
            'fc-section-02-form'  => array( 'file' => 'fc-section-02-form.css',   'deps' => array( 'fc-shared' ) ),
            'fc-section-03'       => array( 'file' => 'fc-section-03.css',        'deps' => array( 'fc-shared' ) ),
            'fc-section-04'       => array( 'file' => 'fc-section-04.css',        'deps' => array( 'fc-shared' ) ),
            'fc-section-05'       => array( 'file' => 'fc-section-05.css',        'deps' => array( 'fc-shared' ) ),
            'fc-section-05a'      => array( 'file' => 'fc-section-05a.css',       'deps' => array( 'fc-shared' ) ),
            'fc-section-05b'      => array( 'file' => 'fc-section-05b.css',       'deps' => array( 'fc-shared' ) ),
            'fc-section-06'       => array( 'file' => 'fc-section-06.css',        'deps' => array( 'fc-shared' ) ),
            'fc-section-06b'      => array( 'file' => 'fc-section-06b.css',       'deps' => array( 'fc-shared' ) ),
            'fc-section-07'       => array( 'file' => 'fc-section-07.css',        'deps' => array( 'fc-shared' ) ),
        );
    }

    private static function scripts() {
        return array(
            'fc-section-00-nav'       => array( 'file' => 'fc-section-00-nav.js',       'deps' => array() ),
            'fc-section-01-hero'      => array( 'file' => 'fc-section-01-hero.js',      'deps' => array() ),
            'fc-section-02-intro'     => array( 'file' => 'fc-section-02-intro.js',     'deps' => array() ),
            'fc-section-02-form'      => array( 'file' => 'fc-section-02-form.js',      'deps' => array() ),
            'fc-section-03-slideshow' => array( 'file' => 'fc-section-03-slideshow.js', 'deps' => array() ),
            'fc-section-04-benefits'  => array( 'file' => 'fc-section-04-benefits.js',  'deps' => array() ),
            'fc-section-05-journey'   => array( 'file' => 'fc-section-05-journey.js',   'deps' => array() ),
            'fc-section-05a-pricing'  => array( 'file' => 'fc-section-05a-pricing.js',  'deps' => array() ),
            'fc-section-05b-cta'      => array( 'file' => 'fc-section-05b-cta.js',      'deps' => array() ),
            'fc-section-06-video'     => array( 'file' => 'fc-section-06-video.js',     'deps' => array() ),
            'fc-section-06b-pillars'  => array( 'file' => 'fc-section-06b-pillars.js',  'deps' => array() ),
            'fc-section-07-accordion' => array( 'file' => 'fc-section-07-accordion.js', 'deps' => array() ),
        );
    }
}
