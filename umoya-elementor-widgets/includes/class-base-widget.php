<?php
namespace Umoya_EW;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Border;
use Elementor\Group_Control_Box_Shadow;

/**
 * Abstract base widget for all Founder's Circle sections.
 * Provides shared category, icon, design tokens, and render helpers.
 */
abstract class Base_Widget extends \Elementor\Widget_Base {

    public function get_categories() {
        return array( 'umoya-fc' );
    }

    public function get_icon() {
        return 'eicon-globe';
    }

    public function get_style_depends() {
        return array( 'fc-shared' );
    }

    /**
     * Full design-token palette — confirmed values.
     */
    protected function get_design_tokens() {
        return array(
            'cream'      => '#F5F0EB',
            'cream_lt'   => '#F5F0EB',
            'cream_dk'   => '#F5F0EB',
            'brown'      => '#4B2E2B',
            'brown_mid'  => '#4B2E2B',
            'terra'      => '#D97E53',
            'terra_dk'   => '#C06840',
            'terra_lt'   => '#D97E53',
            'gold'       => '#D97E53',
            'gold_lt'    => '#D97E53',
            'olive'      => '#708238',
            'text'       => '#4B2E2B',
            'text_mid'   => '#4B2E2B',
            'text_muted' => '#4B2E2B',
            'white'      => '#FFFFFF',
        );
    }

    /* ─── Shared Control Registration Helpers ─────────────── */

    /**
     * Register a complete CTA button control group.
     *
     * @param string $prefix   Control ID prefix (e.g. 'cta', 'hero_cta').
     * @param string $label    Human label (e.g. 'CTA Button').
     * @param array  $defaults Default values: text, link, bg, bg_hover, color, color_hover, border_radius.
     * @param string $selector CSS selector for the button element.
     */
    protected function register_button_controls( $prefix, $label, $defaults, $selector ) {
        $t = $this->get_design_tokens();

        $this->add_control( $prefix . '_text', array(
            'label'   => $label . ' Text',
            'type'    => Controls_Manager::TEXT,
            'default' => isset( $defaults['text'] ) ? $defaults['text'] : 'Join Now',
        ) );

        $this->add_control( $prefix . '_link', array(
            'label'       => $label . ' Link',
            'type'        => Controls_Manager::URL,
            'default'     => array(
                'url' => isset( $defaults['link'] ) ? $defaults['link'] : '#fc-form-section',
            ),
            'placeholder' => '#fc-form-section',
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => $prefix . '_typography',
            'label'    => $label . ' Typography',
            'selector' => '{{WRAPPER}} ' . $selector,
        ) );

        $this->start_controls_tabs( $prefix . '_tabs' );

        /* Normal */
        $this->start_controls_tab( $prefix . '_normal', array(
            'label' => 'Normal',
        ) );
        $this->add_control( $prefix . '_bg', array(
            'label'     => 'Background',
            'type'      => Controls_Manager::COLOR,
            'default'   => isset( $defaults['bg'] ) ? $defaults['bg'] : $t['terra'],
            'selectors' => array( '{{WRAPPER}} ' . $selector => 'background-color: {{VALUE}};' ),
        ) );
        $this->add_control( $prefix . '_color', array(
            'label'     => 'Text Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => isset( $defaults['color'] ) ? $defaults['color'] : $t['white'],
            'selectors' => array( '{{WRAPPER}} ' . $selector => 'color: {{VALUE}};' ),
        ) );
        $this->add_group_control( Group_Control_Border::get_type(), array(
            'name'     => $prefix . '_border',
            'selector' => '{{WRAPPER}} ' . $selector,
        ) );
        $this->end_controls_tab();

        /* Hover */
        $this->start_controls_tab( $prefix . '_hover', array(
            'label' => 'Hover',
        ) );
        $this->add_control( $prefix . '_bg_hover', array(
            'label'     => 'Background',
            'type'      => Controls_Manager::COLOR,
            'default'   => isset( $defaults['bg_hover'] ) ? $defaults['bg_hover'] : $t['terra_dk'],
            'selectors' => array( '{{WRAPPER}} ' . $selector . ':hover' => 'background-color: {{VALUE}};' ),
        ) );
        $this->add_control( $prefix . '_color_hover', array(
            'label'     => 'Text Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => isset( $defaults['color_hover'] ) ? $defaults['color_hover'] : $t['white'],
            'selectors' => array( '{{WRAPPER}} ' . $selector . ':hover' => 'color: {{VALUE}};' ),
        ) );
        $this->add_control( $prefix . '_border_color_hover', array(
            'label'     => 'Border Color',
            'type'      => Controls_Manager::COLOR,
            'selectors' => array( '{{WRAPPER}} ' . $selector . ':hover' => 'border-color: {{VALUE}};' ),
        ) );
        $this->add_group_control( Group_Control_Box_Shadow::get_type(), array(
            'name'     => $prefix . '_shadow_hover',
            'selector' => '{{WRAPPER}} ' . $selector . ':hover',
        ) );
        $this->end_controls_tab();

        $this->end_controls_tabs();

        $this->add_control( $prefix . '_border_radius', array(
            'label'      => 'Border Radius',
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => array( 'px', '%' ),
            'default'    => array(
                'top'    => isset( $defaults['border_radius'] ) ? $defaults['border_radius'] : '4',
                'right'  => isset( $defaults['border_radius'] ) ? $defaults['border_radius'] : '4',
                'bottom' => isset( $defaults['border_radius'] ) ? $defaults['border_radius'] : '4',
                'left'   => isset( $defaults['border_radius'] ) ? $defaults['border_radius'] : '4',
                'unit'   => 'px',
            ),
            'selectors'  => array(
                '{{WRAPPER}} ' . $selector => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
            ),
            'separator' => 'before',
        ) );

        $this->add_responsive_control( $prefix . '_padding', array(
            'label'      => 'Padding',
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => array( 'px', 'em' ),
            'selectors'  => array(
                '{{WRAPPER}} ' . $selector => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
            ),
        ) );
    }

    /**
     * Register section padding controls.
     */
    protected function register_section_padding( $selector, $defaults = array() ) {
        $this->add_responsive_control( 'section_padding', array(
            'label'      => 'Section Padding',
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => array( 'px', 'em', 'vh' ),
            'default'    => array(
                'top'    => isset( $defaults['top'] ) ? $defaults['top'] : '100',
                'right'  => isset( $defaults['right'] ) ? $defaults['right'] : '0',
                'bottom' => isset( $defaults['bottom'] ) ? $defaults['bottom'] : '100',
                'left'   => isset( $defaults['left'] ) ? $defaults['left'] : '0',
                'unit'   => 'px',
            ),
            'selectors'  => array(
                '{{WRAPPER}} ' . $selector => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
            ),
        ) );
    }

    /* ─── Render Helpers ─────────────────────────────────── */

    /**
     * Render an eyebrow label.
     */
    protected function render_eyebrow( $text, $class = '' ) {
        if ( empty( $text ) ) {
            return;
        }
        printf( '<span class="%s">%s</span>', esc_attr( $class ), esc_html( $text ) );
    }

    /**
     * Render a terracotta rule divider.
     */
    protected function render_rule( $class = '' ) {
        printf( '<span class="%s" aria-hidden="true"></span>', esc_attr( $class ) );
    }

    /**
     * Render a CTA button from settings.
     *
     * @param array  $settings Widget settings array.
     * @param string $prefix   Button control prefix.
     * @param string $class    CSS class.
     */
    protected function render_button( $settings, $prefix, $class = '' ) {
        $text = isset( $settings[ $prefix . '_text' ] ) ? $settings[ $prefix . '_text' ] : '';
        if ( empty( $text ) ) {
            return;
        }
        $link = isset( $settings[ $prefix . '_link' ]['url'] ) ? $settings[ $prefix . '_link' ]['url'] : '#';
        $target = ! empty( $settings[ $prefix . '_link' ]['is_external'] ) ? ' target="_blank"' : '';
        $nofollow = ! empty( $settings[ $prefix . '_link' ]['nofollow'] ) ? ' rel="nofollow"' : '';

        printf(
            '<a href="%s" class="%s"%s%s>%s</a>',
            esc_url( $link ),
            esc_attr( $class ),
            $target,
            $nofollow,
            esc_html( $text )
        );
    }

    /**
     * Render the checkmark SVG icon used in checklists.
     */
    protected function render_check_icon() {
        echo '<span class="fc-chk" aria-hidden="true">';
        echo '<svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3"/></svg>';
        echo '</span>';
    }
}
