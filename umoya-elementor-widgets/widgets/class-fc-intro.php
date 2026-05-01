<?php
namespace Umoya_EW\Widgets;

use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * FC Intro — Section 02-intro: Introduction statement.
 *
 * Centred single-column layout with eyebrow, heading, decorative
 * rule divider, body copy (rich text), and CTA button.
 * All visual properties are editable from the Elementor sidebar.
 */
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
        return array( 'fc-scroll-reveal' );
    }

    public function get_keywords() {
        return array( 'umoya', 'intro', 'introduction', 'welcome' );
    }

    /* ─── Controls ─────────────────────────────────────────────── */

    protected function register_controls() {

        $t = $this->get_design_tokens();

        /* ── Content Tab: Content ───────────────────────────────── */
        $this->start_controls_section( 'section_content', array(
            'label' => 'Content',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->add_control( 'eyebrow', array(
            'label'   => 'Eyebrow Text',
            'type'    => Controls_Manager::TEXT,
            'default' => '',
        ) );

        $this->add_control( 'heading', array(
            'label'   => 'Heading',
            'type'    => Controls_Manager::TEXTAREA,
            'default' => 'The Umoya Afrika Tours Founders Circle is an exclusive community of travelers committed to experiencing Africa with intention.',
            'rows'    => 4,
        ) );

        $this->add_control( 'body', array(
            'label'   => 'Body Text',
            'type'    => Controls_Manager::WYSIWYG,
            'default' => '<p>Through thoughtfully curated heritage journeys, we offer travelers of African descent intentional opportunities to return to the continent, not as tourists, but as kin. Founders Circle members will be the first to access a one-of-a-kind cultural travel experience unlike anything offered in mainstream tourism.</p>',
        ) );

        $this->end_controls_section();

        /* ── Content Tab: CTA Button ────────────────────────────── */
        $this->start_controls_section( 'section_cta', array(
            'label' => 'CTA Button',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->register_button_controls( 'cta', 'CTA Button', array(
            'text'          => 'Reserve Your Place',
            'link'          => '#fc-form-section',
            'bg'            => $t['brown'],
            'bg_hover'      => $t['terra'],
            'color'         => $t['white'],
            'color_hover'   => $t['white'],
            'border_radius' => '0',
        ), '.fc-intro-btn' );

        $this->end_controls_section();

        /* ── Style Tab: Section ──────────────────────────────────── */
        $this->start_controls_section( 'section_style_section', array(
            'label' => 'Section',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_control( 'bg_color', array(
            'label'     => 'Background Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['cream'],
            'selectors' => array(
                '{{WRAPPER}} #fc-intro' => 'background-color: {{VALUE}};',
            ),
        ) );

        $this->register_section_padding( '#fc-intro', array(
            'top'    => '80',
            'right'  => '20',
            'bottom' => '80',
            'left'   => '20',
        ) );

        $this->add_responsive_control( 'content_max_width', array(
            'label'      => 'Content Max Width',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => array( 'px', '%' ),
            'range'      => array(
                'px' => array( 'min' => 400, 'max' => 1400, 'step' => 10 ),
                '%'  => array( 'min' => 50, 'max' => 100 ),
            ),
            'default'    => array( 'size' => 1140, 'unit' => 'px' ),
            'selectors'  => array(
                '{{WRAPPER}} .fc-intro-wrap' => 'max-width: {{SIZE}}{{UNIT}};',
            ),
        ) );

        $this->end_controls_section();

        /* ── Style Tab: Eyebrow ──────────────────────────────────── */
        $this->start_controls_section( 'section_style_eyebrow', array(
            'label' => 'Eyebrow',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'eyebrow_typography',
            'label'    => 'Typography',
            'selector' => '{{WRAPPER}} .fc-intro-eyebrow',
        ) );

        $this->add_control( 'eyebrow_color', array(
            'label'     => 'Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array(
                '{{WRAPPER}} .fc-intro-eyebrow' => 'color: {{VALUE}};',
            ),
        ) );

        $this->add_responsive_control( 'eyebrow_margin_bottom', array(
            'label'      => 'Bottom Spacing',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => array( 'px', 'em' ),
            'range'      => array(
                'px' => array( 'min' => 0, 'max' => 80 ),
                'em' => array( 'min' => 0, 'max' => 5, 'step' => 0.1 ),
            ),
            'default'    => array( 'size' => 1, 'unit' => 'em' ),
            'selectors'  => array(
                '{{WRAPPER}} .fc-intro-eyebrow' => 'margin-bottom: {{SIZE}}{{UNIT}};',
            ),
        ) );

        $this->end_controls_section();

        /* ── Style Tab: Heading ──────────────────────────────────── */
        $this->start_controls_section( 'section_style_heading', array(
            'label' => 'Heading',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'           => 'heading_typography',
            'label'          => 'Typography',
            'selector'       => '{{WRAPPER}} .fc-intro-heading',
            'fields_options' => array(
                'font_family' => array(
                    'default' => '',
                ),
            ),
        ) );

        $this->add_control( 'heading_color', array(
            'label'     => 'Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['brown'],
            'selectors' => array(
                '{{WRAPPER}} .fc-intro-heading' => 'color: {{VALUE}};',
            ),
        ) );

        $this->add_responsive_control( 'heading_margin_bottom', array(
            'label'      => 'Bottom Spacing',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => array( 'px', 'em', 'rem' ),
            'range'      => array(
                'px'  => array( 'min' => 0, 'max' => 120 ),
                'em'  => array( 'min' => 0, 'max' => 6, 'step' => 0.1 ),
                'rem' => array( 'min' => 0, 'max' => 6, 'step' => 0.1 ),
            ),
            'default'    => array( 'size' => 2.5, 'unit' => 'rem' ),
            'selectors'  => array(
                '{{WRAPPER}} .fc-intro-heading' => 'margin-bottom: {{SIZE}}{{UNIT}};',
            ),
        ) );

        $this->end_controls_section();

        /* ── Style Tab: Rule Divider ─────────────────────────────── */
        $this->start_controls_section( 'section_style_rule', array(
            'label' => 'Rule Divider',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_responsive_control( 'rule_width', array(
            'label'      => 'Width',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => array( 'px' ),
            'range'      => array(
                'px' => array( 'min' => 1, 'max' => 10 ),
            ),
            'default'    => array( 'size' => 1, 'unit' => 'px' ),
            'selectors'  => array(
                '{{WRAPPER}} .fc-dec-line' => 'width: {{SIZE}}{{UNIT}};',
            ),
        ) );

        $this->add_responsive_control( 'rule_height', array(
            'label'      => 'Height',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => array( 'px' ),
            'range'      => array(
                'px' => array( 'min' => 10, 'max' => 120 ),
            ),
            'default'    => array( 'size' => 60, 'unit' => 'px' ),
            'selectors'  => array(
                '{{WRAPPER}} .fc-dec-line' => 'height: {{SIZE}}{{UNIT}};',
            ),
        ) );

        $this->add_control( 'rule_color', array(
            'label'     => 'Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => 'rgba(217, 126, 83, 0.4)',
            'selectors' => array(
                '{{WRAPPER}} .fc-dec-line' => 'background-color: {{VALUE}};',
            ),
        ) );

        $this->add_responsive_control( 'rule_margin', array(
            'label'      => 'Margin',
            'type'       => Controls_Manager::DIMENSIONS,
            'size_units' => array( 'px', 'em', 'rem' ),
            'default'    => array(
                'top'    => '0',
                'right'  => '0',
                'bottom' => '40',
                'left'   => '0',
                'unit'   => 'px',
                'isLinked' => false,
            ),
            'selectors'  => array(
                '{{WRAPPER}} .fc-dec-line' => 'margin: {{TOP}}{{UNIT}} auto {{BOTTOM}}{{UNIT}} auto;',
            ),
        ) );

        $this->end_controls_section();

        /* ── Style Tab: Body ─────────────────────────────────────── */
        $this->start_controls_section( 'section_style_body', array(
            'label' => 'Body',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'body_typography',
            'label'    => 'Typography',
            'selector' => '{{WRAPPER}} .fc-intro-body',
        ) );

        $this->add_control( 'body_color', array(
            'label'     => 'Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['text'],
            'selectors' => array(
                '{{WRAPPER}} .fc-intro-body' => 'color: {{VALUE}};',
            ),
        ) );

        $this->add_responsive_control( 'body_max_width', array(
            'label'      => 'Max Width',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => array( 'px', '%' ),
            'range'      => array(
                'px' => array( 'min' => 300, 'max' => 1200, 'step' => 10 ),
                '%'  => array( 'min' => 50, 'max' => 100 ),
            ),
            'default'    => array( 'size' => 900, 'unit' => 'px' ),
            'selectors'  => array(
                '{{WRAPPER}} .fc-intro-body' => 'max-width: {{SIZE}}{{UNIT}};',
            ),
        ) );

        $this->add_responsive_control( 'body_margin_bottom', array(
            'label'      => 'Bottom Spacing',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => array( 'px', 'em', 'rem' ),
            'range'      => array(
                'px'  => array( 'min' => 0, 'max' => 120 ),
                'em'  => array( 'min' => 0, 'max' => 6, 'step' => 0.1 ),
                'rem' => array( 'min' => 0, 'max' => 6, 'step' => 0.1 ),
            ),
            'default'    => array( 'size' => 3.5, 'unit' => 'rem' ),
            'selectors'  => array(
                '{{WRAPPER}} .fc-intro-body' => 'margin-bottom: {{SIZE}}{{UNIT}};',
            ),
        ) );

        $this->end_controls_section();
    }

    /* ─── Render ───────────────────────────────────────────────── */

    protected function render() {
        $s  = $this->get_settings_for_display();
        $is_editor = \Elementor\Plugin::$instance->editor->is_edit_mode();

        // Scroll reveal classes — show immediately in editor.
        $rv  = $is_editor ? 'fc-intro-rv fc-intro-on' : 'fc-intro-rv';
        $d0  = $is_editor ? 'fc-intro-rv fc-d0 fc-intro-on' : 'fc-intro-rv fc-d0';
        $d1  = $is_editor ? 'fc-intro-rv fc-d1 fc-intro-on' : 'fc-intro-rv fc-d1';
        $d2  = $is_editor ? 'fc-intro-rv fc-d2 fc-intro-on' : 'fc-intro-rv fc-d2';
        $d3  = $is_editor ? 'fc-intro-rv fc-d3 fc-intro-on' : 'fc-intro-rv fc-d3';

        $eyebrow = ! empty( $s['eyebrow'] ) ? $s['eyebrow'] : '';
        $heading = ! empty( $s['heading'] ) ? $s['heading'] : '';
        $body    = ! empty( $s['body'] ) ? $s['body'] : '';
        ?>
        <section id="fc-intro" aria-label="Founder's Circle Introduction">
          <div class="fc-intro-wrap">

            <!-- Decorative line -->
            <div class="fc-dec-line <?php echo esc_attr( $d0 ); ?>" aria-hidden="true"></div>

            <?php if ( $eyebrow ) : ?>
              <span class="fc-intro-eyebrow <?php echo esc_attr( $d1 ); ?>"><?php echo esc_html( $eyebrow ); ?></span>
            <?php endif; ?>

            <?php if ( $heading ) : ?>
              <h2 class="fc-intro-heading <?php echo esc_attr( $d1 ); ?>">
                <?php echo esc_html( $heading ); ?>
              </h2>
            <?php endif; ?>

            <?php if ( $body ) : ?>
              <div class="fc-intro-body <?php echo esc_attr( $d2 ); ?>">
                <?php echo wp_kses_post( $body ); ?>
              </div>
            <?php endif; ?>

            <div class="fc-intro-btn-wrap <?php echo esc_attr( $d3 ); ?>">
              <?php $this->render_button( $s, 'cta', 'fc-intro-btn' ); ?>
            </div>

          </div>
        </section>

        <?php if ( ! $is_editor ) : ?>
        <script>
        (function(){
          'use strict';
          function init() {
            if (typeof window.fcReveal === 'function') {
              window.fcReveal('.fc-intro-rv', 'fc-intro-on');
            } else {
              var els = document.querySelectorAll('#fc-intro .fc-intro-rv');
              if ('IntersectionObserver' in window) {
                var obs = new IntersectionObserver(function(entries) {
                  entries.forEach(function(e) {
                    if (e.isIntersecting) {
                      e.target.classList.add('fc-intro-on');
                      obs.unobserve(e.target);
                    }
                  });
                }, { threshold: 0.1 });
                els.forEach(function(el) { obs.observe(el); });
              } else {
                els.forEach(function(el) { el.classList.add('fc-intro-on'); });
              }
            }
          }
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
          } else {
            init();
          }
        }());
        </script>
        <?php endif; ?>
        <?php
    }
}
