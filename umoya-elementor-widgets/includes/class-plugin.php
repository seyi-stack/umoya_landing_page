<?php
namespace Umoya_EW;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Plugin loader — singleton.
 * Registers the widget category, shared assets, and all widget classes.
 */
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

        // Also register in editor preview so widgets render correctly.
        add_action( 'elementor/editor/after_enqueue_styles', array( $this, 'enqueue_editor_styles' ) );
    }

    /**
     * Register the "Umoya — Founder's Circle" widget category.
     */
    public function register_categories( $elements_manager ) {
        $elements_manager->add_category( 'umoya-fc', array(
            'title' => 'Umoya — Founder\'s Circle',
            'icon'  => 'eicon-globe',
        ) );
    }

    /**
     * Register all widget classes.
     */
    public function register_widgets( $widgets_manager ) {
        require_once UMOYA_EW_PATH . 'includes/class-base-widget.php';

        // Section 00: Sticky Nav
        require_once UMOYA_EW_PATH . 'widgets/class-fc-nav.php';
        $widgets_manager->register( new \Umoya_EW\Widgets\FC_Nav() );

        // Section 01: Hero
        require_once UMOYA_EW_PATH . 'widgets/class-fc-hero.php';
        $widgets_manager->register( new \Umoya_EW\Widgets\FC_Hero() );

        // Section 02: Intro + Form
        require_once UMOYA_EW_PATH . 'widgets/class-fc-intro.php';
        require_once UMOYA_EW_PATH . 'widgets/class-fc-form.php';
        $widgets_manager->register( new \Umoya_EW\Widgets\FC_Intro() );
        $widgets_manager->register( new \Umoya_EW\Widgets\FC_Form() );

        // Section 03: Be Among the First
        require_once UMOYA_EW_PATH . 'widgets/class-fc-be-first.php';
        $widgets_manager->register( new \Umoya_EW\Widgets\FC_Be_First() );

        // Section 04: Benefits
        require_once UMOYA_EW_PATH . 'widgets/class-fc-benefits.php';
        $widgets_manager->register( new \Umoya_EW\Widgets\FC_Benefits() );

        // Section 05: Journey (3 sub-widgets)
        require_once UMOYA_EW_PATH . 'widgets/class-fc-journey-header.php';
        require_once UMOYA_EW_PATH . 'widgets/class-fc-province-cards.php';
        require_once UMOYA_EW_PATH . 'widgets/class-fc-journey-includes.php';
        $widgets_manager->register( new \Umoya_EW\Widgets\FC_Journey_Header() );
        $widgets_manager->register( new \Umoya_EW\Widgets\FC_Province_Cards() );
        $widgets_manager->register( new \Umoya_EW\Widgets\FC_Journey_Includes() );

        // Section 06: Why Umoya + Pillars
        require_once UMOYA_EW_PATH . 'widgets/class-fc-why.php';
        require_once UMOYA_EW_PATH . 'widgets/class-fc-pillars.php';
        $widgets_manager->register( new \Umoya_EW\Widgets\FC_Why() );
        $widgets_manager->register( new \Umoya_EW\Widgets\FC_Pillars() );

        // Section 07: Journey Details
        require_once UMOYA_EW_PATH . 'widgets/class-fc-details.php';
        $widgets_manager->register( new \Umoya_EW\Widgets\FC_Details() );
    }

    /**
     * Register shared and per-section CSS.
     */
    public function register_styles() {
        $v = UMOYA_EW_VERSION;
        $u = UMOYA_EW_URL . 'assets/css/';

        wp_register_style( 'fc-shared',          $u . 'fc-shared.css',          array(),            $v );
        wp_register_style( 'fc-section-00',      $u . 'fc-section-00.css',      array( 'fc-shared' ), $v );
        wp_register_style( 'fc-section-01',      $u . 'fc-section-01.css',      array( 'fc-shared' ), $v );
        wp_register_style( 'fc-section-02-intro',$u . 'fc-section-02-intro.css', array( 'fc-shared' ), $v );
        wp_register_style( 'fc-section-02-form', $u . 'fc-section-02-form.css',  array( 'fc-shared' ), $v );
        wp_register_style( 'fc-section-03',      $u . 'fc-section-03.css',      array( 'fc-shared' ), $v );
        wp_register_style( 'fc-section-04',      $u . 'fc-section-04.css',      array( 'fc-shared' ), $v );
        wp_register_style( 'fc-section-05',      $u . 'fc-section-05.css',      array( 'fc-shared' ), $v );
        wp_register_style( 'fc-section-06',      $u . 'fc-section-06.css',      array( 'fc-shared' ), $v );
        wp_register_style( 'fc-section-06b',     $u . 'fc-section-06b.css',     array( 'fc-shared' ), $v );
        wp_register_style( 'fc-section-07',      $u . 'fc-section-07.css',      array( 'fc-shared' ), $v );
    }

    /**
     * Register shared and per-section JS.
     */
    public function register_scripts() {
        $v = UMOYA_EW_VERSION;
        $u = UMOYA_EW_URL . 'assets/js/';

        wp_register_script( 'fc-scroll-reveal',        $u . 'fc-scroll-reveal.js',        array(), $v, true );
        wp_register_script( 'fc-section-00-nav',       $u . 'fc-section-00-nav.js',       array(), $v, true );
        wp_register_script( 'fc-section-03-slideshow', $u . 'fc-section-03-slideshow.js',  array( 'fc-scroll-reveal' ), $v, true );
        wp_register_script( 'fc-section-05-cards',     $u . 'fc-section-05-cards.js',      array(), $v, true );
        wp_register_script( 'fc-section-05-map',       $u . 'fc-section-05-map.js',        array(), $v, true );
        wp_register_script( 'fc-section-06-video',     $u . 'fc-section-06-video.js',      array(), $v, true );
        wp_register_script( 'fc-section-06b-pillars',  $u . 'fc-section-06b-pillars.js',   array( 'fc-scroll-reveal' ), $v, true );
        wp_register_script( 'fc-section-07-accordion', $u . 'fc-section-07-accordion.js',  array(), $v, true );
    }

    /**
     * Enqueue shared styles inside the Elementor editor iframe.
     */
    public function enqueue_editor_styles() {
        $v = UMOYA_EW_VERSION;
        $u = UMOYA_EW_URL . 'assets/css/';

        wp_enqueue_style( 'fc-shared',          $u . 'fc-shared.css',          array(),            $v );
        wp_enqueue_style( 'fc-section-00',      $u . 'fc-section-00.css',      array( 'fc-shared' ), $v );
        wp_enqueue_style( 'fc-section-01',      $u . 'fc-section-01.css',      array( 'fc-shared' ), $v );
        wp_enqueue_style( 'fc-section-02-intro',$u . 'fc-section-02-intro.css', array( 'fc-shared' ), $v );
        wp_enqueue_style( 'fc-section-02-form', $u . 'fc-section-02-form.css',  array( 'fc-shared' ), $v );
        wp_enqueue_style( 'fc-section-03',      $u . 'fc-section-03.css',      array( 'fc-shared' ), $v );
        wp_enqueue_style( 'fc-section-04',      $u . 'fc-section-04.css',      array( 'fc-shared' ), $v );
        wp_enqueue_style( 'fc-section-05',      $u . 'fc-section-05.css',      array( 'fc-shared' ), $v );
        wp_enqueue_style( 'fc-section-06',      $u . 'fc-section-06.css',      array( 'fc-shared' ), $v );
        wp_enqueue_style( 'fc-section-06b',     $u . 'fc-section-06b.css',     array( 'fc-shared' ), $v );
        wp_enqueue_style( 'fc-section-07',      $u . 'fc-section-07.css',      array( 'fc-shared' ), $v );
    }
}
