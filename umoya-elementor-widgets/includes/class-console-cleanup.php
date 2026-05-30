<?php
namespace Umoya_EW;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

final class Console_Cleanup {

    private static $instance = null;

    public static function instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    private function __construct() {
        add_action( 'wp_enqueue_scripts', array( $this, 'dequeue_homepage_only_assets' ), 1000 );
        add_action( 'wp_print_scripts', array( $this, 'dequeue_homepage_only_assets' ), 1 );
        add_action( 'wp_head', array( $this, 'print_homepage_css_overrides' ), 100 );
        add_action( 'wp_head', array( $this, 'print_founders_circle_head_shims' ), 1 );
        add_action( 'wp_body_open', array( $this, 'print_founders_circle_cookieadmin_shim' ), 1 );
    }

    public function dequeue_homepage_only_assets() {
        if ( ! $this->is_homepage_request() ) {
            return;
        }

        $handles = array(
            'stripe-js',
            'stripe-custom-checkout',
            'uah-archive-hero',
        );

        foreach ( $handles as $handle ) {
            wp_dequeue_script( $handle );
            wp_deregister_script( $handle );
        }
    }

    public function print_homepage_css_overrides() {
        if ( ! $this->is_homepage_request() ) {
            return;
        }
        ?>
<style id="umoya-homepage-console-cleanup">
.elementor-element-63b2bfb:not(.elementor-motion-effects-element-type-background),
.elementor-element-63b2bfb > .elementor-motion-effects-container > .elementor-motion-effects-layer {
    background-image: none !important;
}
</style>
        <?php
    }

    public function print_founders_circle_head_shims() {
        if ( ! $this->is_founders_circle_request() ) {
            return;
        }
        ?>
<style id="umoya-founder-cookieadmin-shim-css">
[data-umoya-cookieadmin-shim] {
    display: none !important;
}
</style>
<script id="umoya-founder-console-shims">
(function() {
    function setHiddenShimAttrs(el) {
        el.setAttribute('data-umoya-cookieadmin-shim', '1');
        el.setAttribute('aria-hidden', 'true');
    }

    function appendShimButton(parent, className) {
        var button = document.createElement('button');
        button.className = className;
        button.type = 'button';
        button.tabIndex = -1;
        parent.appendChild(button);
        return button;
    }

    function ensureCookieAdminShim() {
        if (!document.body) return;

        if (!document.querySelector('.cookieadmin_law_container')) {
            var lawContainer = document.createElement('div');
            lawContainer.className = 'cookieadmin_law_container';
            setHiddenShimAttrs(lawContainer);
            appendShimButton(lawContainer, 'cookieadmin_customize_btn');
            appendShimButton(lawContainer, 'cookieadmin_accept_btn');
            appendShimButton(lawContainer, 'cookieadmin_reject_btn');
            document.body.insertBefore(lawContainer, document.body.firstChild);
        }

        if (!document.querySelector('.cookieadmin_cookie_modal')) {
            var modal = document.createElement('div');
            modal.className = 'cookieadmin_cookie_modal';
            setHiddenShimAttrs(modal);
            appendShimButton(modal, 'cookieadmin_close_pref');

            var footer = document.createElement('div');
            footer.className = 'cookieadmin_modal_footer';
            appendShimButton(footer, 'cookieadmin_save_btn');
            appendShimButton(footer, 'cookieadmin_accept_btn');
            appendShimButton(footer, 'cookieadmin_reject_btn');
            modal.appendChild(footer);

            ['necessary', 'functional', 'analytics', 'advertisement'].forEach(function(category) {
                var categoryContainer = document.createElement('div');
                categoryContainer.className = 'cookieadmin-' + category;
                modal.appendChild(categoryContainer);
            });

            document.body.insertBefore(modal, document.body.firstChild);
        }

        if (!document.querySelector('.cookieadmin_re_consent')) {
            var reconsent = appendShimButton(document.body, 'cookieadmin_re_consent');
            setHiddenShimAttrs(reconsent);
        }
    }

    window.umoyaEnsureCookieAdminShim = ensureCookieAdminShim;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureCookieAdminShim, true);
    } else {
        ensureCookieAdminShim();
    }

    if (typeof window.Swiper === 'undefined') {
        window.Swiper = function UmoyaSwiperNoop() {
            return {
                destroy: function() {},
                update: function() {},
                on: function() {},
                off: function() {}
            };
        };
    }
}());
</script>
        <?php
    }

    public function print_founders_circle_cookieadmin_shim() {
        if ( ! $this->is_founders_circle_request() ) {
            return;
        }
        ?>
<div class="cookieadmin_law_container" data-umoya-cookieadmin-shim="1" aria-hidden="true">
    <button class="cookieadmin_customize_btn" type="button" tabindex="-1"></button>
    <button class="cookieadmin_accept_btn" type="button" tabindex="-1"></button>
    <button class="cookieadmin_reject_btn" type="button" tabindex="-1"></button>
</div>
<div class="cookieadmin_cookie_modal" data-umoya-cookieadmin-shim="1" aria-hidden="true">
    <button class="cookieadmin_close_pref" type="button" tabindex="-1"></button>
    <div class="cookieadmin_modal_footer">
        <button class="cookieadmin_save_btn" type="button" tabindex="-1"></button>
        <button class="cookieadmin_accept_btn" type="button" tabindex="-1"></button>
        <button class="cookieadmin_reject_btn" type="button" tabindex="-1"></button>
    </div>
    <div class="cookieadmin-necessary"></div>
    <div class="cookieadmin-functional"></div>
    <div class="cookieadmin-analytics"></div>
    <div class="cookieadmin-advertisement"></div>
</div>
<button class="cookieadmin_re_consent" type="button" tabindex="-1" data-umoya-cookieadmin-shim="1" aria-hidden="true"></button>
        <?php
    }

    private function is_homepage_request() {
        return ! is_admin() && ( is_front_page() || is_home() );
    }

    private function is_founders_circle_request() {
        if ( is_admin() ) {
            return false;
        }

        if ( is_page( 'founders-circle' ) ) {
            return true;
        }

        $request_uri = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
        $path        = trim( (string) wp_parse_url( $request_uri, PHP_URL_PATH ), '/' );

        return 'founders-circle' === $path;
    }
}
