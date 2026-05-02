<?php
namespace Umoya_EW\Widgets;

use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Box_Shadow;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * FC Form — Section 02: Your Homecoming Awaits.
 *
 * Two-column layout: image left (1fr) + form right (2fr).
 * The form itself is handled by Contact Form 7 — this widget
 * renders the visual wrapper/layout and a CF7 shortcode field.
 */
class FC_Form extends \Umoya_EW\Base_Widget {

    public function get_name() {
        return 'fc-form';
    }

    public function get_title() {
        return 'FC Form';
    }

    public function get_icon() {
        return 'eicon-form-horizontal';
    }

    public function get_style_depends() {
        return array( 'fc-shared', 'fc-section-02-form' );
    }

    public function get_script_depends() {
        return array( 'fc-section-02-form' );
    }

    public function get_keywords() {
        return array( 'umoya', 'form', 'contact', 'register', 'founders' );
    }

    /* ─── Controls ─────────────────────────────────────────────── */

    protected function register_controls() {

        $t = $this->get_design_tokens();

        /* ══ CONTENT TAB ═══════════════════════════════════════════ */

        /* ── Left Column Image ───────────────────────────────────── */
        $this->start_controls_section( 'section_image', array(
            'label' => 'Left Column — Image',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->add_control( 'image', array(
            'label'   => 'Background Image',
            'type'    => Controls_Manager::MEDIA,
            'default' => array(
                'url' => 'https://umoyaafrikatours.co.za/wp-content/uploads/2026/optimized/compressed_dsc04418(1).jpg',
            ),
        ) );

        $this->add_control( 'image_alt', array(
            'label'   => 'Alt Text',
            'type'    => Controls_Manager::TEXT,
            'default' => 'Umoya Afrika Tours — heritage journey',
        ) );

        $this->end_controls_section();

        /* ── Left Column Overlay Text ────────────────────────────── */
        $this->start_controls_section( 'section_overlay', array(
            'label' => 'Left Column — Overlay Text',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->add_control( 'ov_eyebrow', array(
            'label'   => 'Eyebrow',
            'type'    => Controls_Manager::TEXT,
            'default' => 'Inquiry Form',
        ) );

        $this->add_control( 'ov_title', array(
            'label'   => 'Title',
            'type'    => Controls_Manager::TEXT,
            'default' => 'Heritage Journey',
        ) );

        $this->add_control( 'ov_subtitle', array(
            'label'   => 'Descriptor',
            'type'    => Controls_Manager::TEXT,
            'default' => '18 Days | 5 Provinces | [TBD: Month Year]',
        ) );

        $this->end_controls_section();

        /* ── Right Column Header ─────────────────────────────────── */
        $this->start_controls_section( 'section_header', array(
            'label' => 'Right Column — Header',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->add_control( 'hd_eyebrow', array(
            'label'   => 'Eyebrow',
            'type'    => Controls_Manager::TEXT,
            'default' => 'Reserve Your Place',
        ) );

        $this->add_control( 'hd_title', array(
            'label'   => 'Title (before emphasis)',
            'type'    => Controls_Manager::TEXT,
            'default' => 'Your',
        ) );

        $this->add_control( 'hd_title_em', array(
            'label'   => 'Title (italic emphasis)',
            'type'    => Controls_Manager::TEXT,
            'default' => 'Homecoming',
        ) );

        $this->add_control( 'hd_title_suffix', array(
            'label'   => 'Title (after emphasis)',
            'type'    => Controls_Manager::TEXT,
            'default' => 'Awaits',
        ) );

        $this->add_control( 'hd_subtitle', array(
            'label'   => 'Subtitle',
            'type'    => Controls_Manager::TEXTAREA,
            'default' => 'Tell us about yourself and the journey you\'re hoping for. A dedicated Umoya travel expert will reach out personally to guide you forward.',
        ) );

        $this->end_controls_section();

        /* ── Form (CF7 Shortcode) ────────────────────────────────── */
        $this->start_controls_section( 'section_form', array(
            'label' => 'Form',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->add_control( 'cf7_shortcode', array(
            'label'       => 'Contact Form 7 Shortcode',
            'type'        => Controls_Manager::TEXTAREA,
            'default'     => '[contact-form-7 id="YOUR_FORM_ID" title="Founders Circle"]',
            'description' => 'Paste your CF7 shortcode here. The form will render inside the card.',
            'rows'        => 3,
        ) );

        $this->add_control( 'watermark_text', array(
            'label'   => 'Watermark Text',
            'type'    => Controls_Manager::TEXT,
            'default' => 'UMOYA',
        ) );

        $this->end_controls_section();

        /* ══ STYLE TAB ═════════════════════════════════════════════ */

        /* ── Section ─────────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_section', array(
            'label' => 'Section',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_control( 'form_col_bg', array(
            'label'     => 'Form Column Background',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['cream'],
            'selectors' => array( '{{WRAPPER}} .fc-f2-form-col' => 'background-color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();

        /* ── Overlay Text ────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_overlay', array(
            'label' => 'Overlay Text',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'ov_eyebrow_typography',
            'label'    => 'Eyebrow',
            'selector' => '{{WRAPPER}} .fc-f2-img-eye',
        ) );

        $this->add_control( 'ov_eyebrow_color', array(
            'label'     => 'Eyebrow Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-f2-img-eye' => 'color: {{VALUE}};' ),
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'ov_title_typography',
            'label'    => 'Title',
            'selector' => '{{WRAPPER}} .fc-f2-img-ttl',
        ) );

        $this->add_control( 'ov_title_color', array(
            'label'     => 'Title Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['cream'],
            'selectors' => array( '{{WRAPPER}} .fc-f2-img-ttl' => 'color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();

        /* ── Form Header ─────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_header', array(
            'label' => 'Form Header',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'hd_eyebrow_typography',
            'label'    => 'Eyebrow',
            'selector' => '{{WRAPPER}} .fc-f2-eye',
        ) );

        $this->add_control( 'hd_eyebrow_color', array(
            'label'     => 'Eyebrow Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-f2-eye' => 'color: {{VALUE}};' ),
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'hd_title_typography',
            'label'    => 'Title',
            'selector' => '{{WRAPPER}} .fc-f2-ttl',
        ) );

        $this->add_control( 'hd_title_color', array(
            'label'     => 'Title Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['brown'],
            'selectors' => array( '{{WRAPPER}} .fc-f2-ttl' => 'color: {{VALUE}};' ),
        ) );

        $this->add_control( 'hd_em_color', array(
            'label'     => 'Italic Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-f2-ttl em' => 'color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();

        /* ── Card ────────────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_card', array(
            'label' => 'Form Card',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_control( 'card_bg', array(
            'label'     => 'Background',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['white'],
            'selectors' => array( '{{WRAPPER}} .fc-f2-card' => 'background-color: {{VALUE}};' ),
        ) );

        $this->add_control( 'card_border_radius', array(
            'label'      => 'Border Radius',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => array( 'px' ),
            'range'      => array( 'px' => array( 'min' => 0, 'max' => 30 ) ),
            'default'    => array( 'size' => 10, 'unit' => 'px' ),
            'selectors'  => array( '{{WRAPPER}} .fc-f2-card' => 'border-radius: {{SIZE}}{{UNIT}};' ),
        ) );

        $this->add_group_control( Group_Control_Box_Shadow::get_type(), array(
            'name'     => 'card_shadow',
            'selector' => '{{WRAPPER}} .fc-f2-card',
        ) );

        $this->add_control( 'rule_color', array(
            'label'     => 'Rule Divider Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array(
                '{{WRAPPER}} .fc-f2-rule'     => 'background-color: {{VALUE}};',
                '{{WRAPPER}} .fc-f2-img-rule' => 'background-color: {{VALUE}};',
            ),
        ) );

        $this->add_control( 'watermark_color', array(
            'label'     => 'Watermark Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => 'rgba(75,46,43,0.03)',
            'selectors' => array( '{{WRAPPER}} .fc-f2-wm' => 'color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();
    }

    /* ─── Render ───────────────────────────────────────────────── */

    protected function render() {
        $this->render_section_template( 'section-02-form.php' );
        return;

        $s = $this->get_settings_for_display();

        $is_editor = \Elementor\Plugin::$instance->editor->is_edit_mode();
        $rv  = $is_editor ? 'fc-f2-rv fc-f2-on' : 'fc-f2-rv';
        $rv1 = $is_editor ? 'fc-f2-rv d1 fc-f2-on' : 'fc-f2-rv d1';

        $img_url = ! empty( $s['image']['url'] ) ? $s['image']['url'] : '';
        $img_alt = ! empty( $s['image_alt'] ) ? $s['image_alt'] : '';
        ?>
        <section id="fc-form-section" aria-label="Join the Founder's Circle — Inquiry Form">
          <div class="fc-f2-outer">

            <!-- LEFT — Image panel -->
            <div class="fc-f2-img-col" aria-hidden="true">
              <?php if ( $img_url ) : ?>
                <img src="<?php echo esc_url( $img_url ); ?>" alt="<?php echo esc_attr( $img_alt ); ?>" />
              <?php endif; ?>
              <div class="fc-f2-img-ov"></div>
              <div class="fc-f2-img-txt">
                <?php if ( ! empty( $s['ov_eyebrow'] ) ) : ?>
                  <span class="fc-f2-img-eye"><?php echo esc_html( $s['ov_eyebrow'] ); ?></span>
                <?php endif; ?>
                <?php if ( ! empty( $s['ov_title'] ) ) : ?>
                  <h2 class="fc-f2-img-ttl"><?php echo esc_html( $s['ov_title'] ); ?></h2>
                <?php endif; ?>
                <span class="fc-f2-img-rule"></span>
                <?php if ( ! empty( $s['ov_subtitle'] ) ) : ?>
                  <p class="fc-f2-img-body"><?php echo esc_html( $s['ov_subtitle'] ); ?></p>
                <?php endif; ?>
              </div>
            </div>

            <!-- RIGHT — Form panel -->
            <div class="fc-f2-form-col">
              <?php if ( ! empty( $s['watermark_text'] ) ) : ?>
                <div class="fc-f2-wm" aria-hidden="true"><?php echo esc_html( $s['watermark_text'] ); ?></div>
              <?php endif; ?>

              <div class="fc-f2-inner">
                <!-- Header -->
                <div class="fc-f2-hd <?php echo esc_attr( $rv ); ?>">
                  <?php if ( ! empty( $s['hd_eyebrow'] ) ) : ?>
                    <span class="fc-f2-eye"><?php echo esc_html( $s['hd_eyebrow'] ); ?></span>
                  <?php endif; ?>
                  <h2 class="fc-f2-ttl">
                    <?php echo esc_html( $s['hd_title'] ); ?>
                    <?php if ( ! empty( $s['hd_title_em'] ) ) : ?>
                      <em><?php echo esc_html( $s['hd_title_em'] ); ?></em>
                    <?php endif; ?>
                    <?php echo esc_html( $s['hd_title_suffix'] ); ?>
                  </h2>
                  <span class="fc-f2-rule" aria-hidden="true"></span>
                  <?php if ( ! empty( $s['hd_subtitle'] ) ) : ?>
                    <p class="fc-f2-sub"><?php echo esc_html( $s['hd_subtitle'] ); ?></p>
                  <?php endif; ?>
                </div>

                <!-- Form Card -->
                <div class="fc-f2-card <?php echo esc_attr( $rv1 ); ?>">
                  <?php
                  if ( ! empty( $s['cf7_shortcode'] ) ) {
                      echo do_shortcode( $s['cf7_shortcode'] );
                  }
                  ?>
                </div>
              </div>
            </div>

          </div>
        </section>
        <?php
    }
}
