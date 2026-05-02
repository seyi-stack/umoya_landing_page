<?php
namespace Umoya_EW\Widgets;

use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Repeater;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * FC Journey Includes — Section 05C: Includes list with map,
 * pricing block, outline CTA, and closing CTA dark card.
 * Full sidebar controls for all content and visual properties.
 */
class FC_Journey_Includes extends \Umoya_EW\Base_Widget {

    public function get_name() {
        return 'fc-journey-includes';
    }

    public function get_title() {
        return 'FC Journey Includes';
    }

    public function get_icon() {
        return 'eicon-bullet-list';
    }

    public function get_style_depends() {
        return array( 'fc-shared', 'fc-section-05' );
    }

    public function get_script_depends() {
        return array( 'fc-section-05-journey' );
    }

    public function show_in_panel() {
        return false;
    }

    public function get_keywords() {
        return array( 'umoya', 'journey', 'includes', 'map', 'pricing' );
    }

    /* ─── Controls ─────────────────────────────────────────────── */

    protected function register_controls() {

        $t = $this->get_design_tokens();

        /* ══ CONTENT TAB ═══════════════════════════════════════════ */

        /* ── Includes Header ────────────────────────────────────── */
        $this->start_controls_section( 'section_inc_header', array(
            'label' => 'Includes Header',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->add_control( 'inc_eyebrow', array(
            'label'   => 'Eyebrow',
            'type'    => Controls_Manager::TEXT,
            'default' => 'Included in Every Journey',
        ) );

        $this->add_control( 'inc_title', array(
            'label'       => 'Title',
            'type'        => Controls_Manager::TEXTAREA,
            'rows'        => 2,
            'default'     => 'Every Journey<br />Includes',
            'description' => 'Use &lt;br /&gt; for line breaks.',
        ) );

        $this->end_controls_section();

        /* ── Includes List ──────────────────────────────────────── */
        $this->start_controls_section( 'section_inc_list', array(
            'label' => 'Includes List',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $repeater = new Repeater();

        $repeater->add_control( 'text', array(
            'label'   => 'Item',
            'type'    => Controls_Manager::TEXT,
            'default' => '',
        ) );

        $this->add_control( 'includes', array(
            'label'       => 'What\'s Included',
            'type'        => Controls_Manager::REPEATER,
            'fields'      => $repeater->get_controls(),
            'title_field' => '{{{ text }}}',
            'default'     => array(
                array( 'text' => 'Curated travel across five South African provinces' ),
                array( 'text' => 'Premium lodging and thoughtfully selected accommodations' ),
                array( 'text' => 'Cultural experiences led by historians, elders & cultural custodians' ),
                array( 'text' => 'Regional cuisine by local chefs — all dietary needs accommodated' ),
                array( 'text' => 'A likeminded community of travelers dedicated to reconnection' ),
            ),
        ) );

        $this->end_controls_section();

        /* ── Pricing ────────────────────────────────────────────── */
        $this->start_controls_section( 'section_pricing', array(
            'label' => 'Pricing',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->add_control( 'price_from_label', array(
            'label'   => 'From Label',
            'type'    => Controls_Manager::TEXT,
            'default' => 'Starting from',
        ) );

        $this->add_control( 'price_amount', array(
            'label'       => 'Price',
            'type'        => Controls_Manager::TEXT,
            'default'     => '$[Price]',
            'description' => 'Replace with actual price, e.g. "$8,500".',
        ) );

        $this->add_control( 'price_per', array(
            'label'   => 'Per Label',
            'type'    => Controls_Manager::TEXT,
            'default' => 'per person',
        ) );

        $this->add_control( 'price_note', array(
            'label'   => 'Price Note',
            'type'    => Controls_Manager::TEXTAREA,
            'rows'    => 2,
            'default' => 'Founder\'s Circle members receive an exclusive discount of $[Amount]',
        ) );

        $this->end_controls_section();

        /* ── Includes CTA ───────────────────────────────────────── */
        $this->start_controls_section( 'section_inc_cta', array(
            'label' => 'Includes CTA',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->register_button_controls( 'inc_btn', 'Includes CTA', array(
            'text'     => 'Become a Founder\'s Circle Member',
            'link'     => '#fc-form-section',
            'bg'       => 'transparent',
            'bg_hover' => $t['terra'],
            'color'    => $t['terra'],
            'color_hover' => $t['white'],
        ), '.fc-ji-btn' );

        $this->end_controls_section();

        /* ── Closing CTA ────────────────────────────────────────── */
        $this->start_controls_section( 'section_close_cta', array(
            'label' => 'Closing CTA',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->add_control( 'close_text', array(
            'label'   => 'Closing Paragraph',
            'type'    => Controls_Manager::TEXTAREA,
            'rows'    => 4,
            'default' => 'Umoya Afrika Tours is for those who feel called to be part of something intentional from the very beginning. If you are ready to move beyond another vacation and into a sacred journey of remembrance — we invite you to take your place among the founding travelers.',
        ) );

        $this->register_button_controls( 'close_btn', 'Closing CTA', array(
            'text'     => 'Become a Founder\'s Circle Member',
            'link'     => '#fc-form-section',
            'bg'       => $t['terra'],
            'bg_hover' => $t['terra_dk'],
            'color'    => $t['white'],
        ), '.fc-jrn-close-btn' );

        $this->end_controls_section();

        /* ══ STYLE TAB ═════════════════════════════════════════════ */

        /* ── Eyebrow ────────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_eyebrow', array(
            'label' => 'Eyebrow',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'inc_eyebrow_typography',
            'selector' => '{{WRAPPER}} .fc-ji-eye',
        ) );

        $this->add_control( 'inc_eyebrow_color', array(
            'label'     => 'Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-ji-eye' => 'color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();

        /* ── Title ──────────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_title', array(
            'label' => 'Title',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'inc_title_typography',
            'selector' => '{{WRAPPER}} .fc-ji-ttl',
        ) );

        $this->add_control( 'inc_title_color', array(
            'label'     => 'Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['brown'],
            'selectors' => array( '{{WRAPPER}} .fc-ji-ttl' => 'color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();

        /* ── List Items ─────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_list', array(
            'label' => 'List Items',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'list_typography',
            'selector' => '{{WRAPPER}} .fc-inc-list li',
        ) );

        $this->add_control( 'list_color', array(
            'label'     => 'Text Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['text'],
            'selectors' => array( '{{WRAPPER}} .fc-inc-list li' => 'color: {{VALUE}};' ),
        ) );

        $this->add_control( 'dot_color', array(
            'label'     => 'Dot Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-inc-dot' => 'background-color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();

        /* ── Pricing ────────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_pricing', array(
            'label' => 'Pricing',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'price_amount_typography',
            'label'    => 'Price Amount',
            'selector' => '{{WRAPPER}} .fc-price-amt',
        ) );

        $this->add_control( 'price_amount_color', array(
            'label'     => 'Price Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['brown'],
            'selectors' => array( '{{WRAPPER}} .fc-price-amt' => 'color: {{VALUE}};' ),
        ) );

        $this->add_control( 'price_label_color', array(
            'label'     => 'Label Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['text'],
            'selectors' => array(
                '{{WRAPPER}} .fc-price-from' => 'color: {{VALUE}};',
                '{{WRAPPER}} .fc-price-amt span' => 'color: {{VALUE}};',
            ),
        ) );

        $this->add_control( 'price_note_color', array(
            'label'     => 'Note Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-price-note' => 'color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();

        /* ── Rule ───────────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_rule', array(
            'label' => 'Rule Divider',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_control( 'rule_color', array(
            'label'     => 'Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-ji-rule' => 'background-color: {{VALUE}};' ),
        ) );

        $this->add_control( 'rule_width', array(
            'label'      => 'Width',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => array( 'px' ),
            'range'      => array( 'px' => array( 'min' => 20, 'max' => 120 ) ),
            'default'    => array( 'size' => 44, 'unit' => 'px' ),
            'selectors'  => array( '{{WRAPPER}} .fc-ji-rule' => 'width: {{SIZE}}{{UNIT}};' ),
        ) );

        $this->end_controls_section();

        /* ── Closing Card ───────────────────────────────────────── */
        $this->start_controls_section( 'section_style_close', array(
            'label' => 'Closing Card',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_control( 'close_bg_color', array(
            'label'     => 'Background',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['brown'],
            'selectors' => array( '{{WRAPPER}} .fc-jrn-close' => 'background-color: {{VALUE}};' ),
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'close_text_typography',
            'label'    => 'Paragraph',
            'selector' => '{{WRAPPER}} .fc-jrn-close-p',
        ) );

        $this->add_control( 'close_text_color', array(
            'label'     => 'Text Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['cream'],
            'selectors' => array( '{{WRAPPER}} .fc-jrn-close-p' => 'color: {{VALUE}};' ),
        ) );

        $this->add_control( 'close_border_radius', array(
            'label'      => 'Border Radius',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => array( 'px' ),
            'range'      => array( 'px' => array( 'min' => 0, 'max' => 24 ) ),
            'default'    => array( 'size' => 10, 'unit' => 'px' ),
            'selectors'  => array( '{{WRAPPER}} .fc-jrn-close' => 'border-radius: {{SIZE}}{{UNIT}};' ),
        ) );

        $this->end_controls_section();
    }

    /* ─── Render ───────────────────────────────────────────────── */

    protected function render() {
        return;

        $s  = $this->get_settings_for_display();
        $is_editor = \Elementor\Plugin::$instance->editor->is_edit_mode();
        $rv = $is_editor ? 'fc-jrn-rv on' : 'fc-jrn-rv';
        ?>
        <!-- Full-bleed Map + Includes -->
        <div class="fc-ji-section <?php echo esc_attr( $rv ); ?>">
          <div class="fc-ji-outer" id="fcJiOuter">

            <!-- LEFT: Leaflet map -->
            <div class="fc-map-col" id="fcMapCol">
              <div class="fc-map-loading" id="fcMapLoading">
                <div class="fc-map-loading-inner">
                  <div class="fc-map-spinner"></div>
                  <span class="fc-map-loading-txt">Loading map&hellip;</span>
                </div>
              </div>
              <div id="fcLeafletMap" aria-label="South Africa route map"></div>
            </div>

            <!-- RIGHT: Includes content -->
            <div class="fc-ji-copy" id="fcJiCopy">

              <?php $this->render_eyebrow( $s['inc_eyebrow'], 'fc-ji-eye' ); ?>

              <h3 class="fc-ji-ttl"><?php echo wp_kses_post( $s['inc_title'] ); ?></h3>
              <?php $this->render_rule( 'fc-ji-rule' ); ?>

              <?php if ( ! empty( $s['includes'] ) ) : ?>
                <ul class="fc-inc-list" aria-label="Journey inclusions">
                  <?php foreach ( $s['includes'] as $item ) : ?>
                    <li>
                      <span class="fc-inc-dot" aria-hidden="true"></span>
                      <?php echo esc_html( $item['text'] ); ?>
                    </li>
                  <?php endforeach; ?>
                </ul>
              <?php endif; ?>

              <!-- Pricing -->
              <div class="fc-price-blk" role="note">
                <p class="fc-price-from"><?php echo esc_html( $s['price_from_label'] ); ?></p>
                <p class="fc-price-amt">
                  <?php echo esc_html( $s['price_amount'] ); ?>
                  <span><?php echo esc_html( $s['price_per'] ); ?></span>
                </p>
                <p class="fc-price-note"><?php echo esc_html( $s['price_note'] ); ?></p>
              </div>

              <?php $this->render_button( $s, 'inc_btn', 'fc-ji-btn' ); ?>

            </div>
          </div>
        </div>

        <!-- Closing CTA -->
        <div class="fc-jrn-c">
          <div class="fc-jrn-close <?php echo esc_attr( $rv ); ?>">
            <p class="fc-jrn-close-p"><?php echo esc_html( $s['close_text'] ); ?></p>
            <?php $this->render_button( $s, 'close_btn', 'fc-jrn-close-btn' ); ?>
          </div>
        </div>
        <?php
    }
}
