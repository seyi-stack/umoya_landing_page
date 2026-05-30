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
        $elements_manager->add_category(
            'umoya-homepage',
            array(
                'title' => 'Umoya - Homepage',
                'icon'  => 'eicon-home',
            )
        );

        $elements_manager->add_category(
            'umoya-fc',
            array(
                'title' => "Umoya - Founder's Circle",
                'icon'  => 'eicon-globe',
            )
        );
    }

    public function register_widgets( $widgets_manager ) {
        require_once UMOYA_EW_PATH . 'includes/class-section-registry.php';
        require_once UMOYA_EW_PATH . 'includes/class-base-widget.php';

        foreach ( Section_Registry::widgets() as $widget ) {
            $file = UMOYA_EW_PATH . 'widgets/' . ltrim( $widget['widget_file'], '/\\' );
            if ( ! file_exists( $file ) ) {
                continue;
            }

            require_once $file;

            $class_name = '\\Umoya_EW\\Widgets\\' . $widget['class_name'];
            if ( class_exists( $class_name ) ) {
                $widgets_manager->register( new $class_name() );
            }
        }
    }

    public function register_styles() {
        foreach ( $this->styles() as $handle => $style ) {
            wp_register_style(
                $handle,
                UMOYA_EW_URL . ltrim( $style['file'], '/\\' ),
                $style['deps'],
                UMOYA_EW_VERSION
            );
        }
    }

    public function register_scripts() {
        foreach ( $this->scripts() as $handle => $script ) {
            wp_register_script(
                $handle,
                UMOYA_EW_URL . ltrim( $script['file'], '/\\' ),
                $script['deps'],
                UMOYA_EW_VERSION,
                true
            );
        }
    }

    public function enqueue_editor_styles() {
        $this->register_styles();

        foreach ( array_keys( $this->styles() ) as $handle ) {
            wp_enqueue_style( $handle );
        }
    }

    private function styles() {
        require_once UMOYA_EW_PATH . 'includes/class-section-registry.php';

        return array_merge(
            array(
                'fc-shared' => array(
                    'file' => 'assets/css/fc-shared.css',
                    'deps' => array(),
                ),
            ),
            Section_Registry::styles()
        );
    }

    private function scripts() {
        require_once UMOYA_EW_PATH . 'includes/class-section-registry.php';

        return Section_Registry::scripts();
    }
}
