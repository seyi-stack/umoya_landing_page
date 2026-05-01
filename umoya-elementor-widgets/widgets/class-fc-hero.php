<?php
namespace Umoya_EW\Widgets;

use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Background;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * FC Hero — Section 01: Full-viewport hero with background image/video,
 * centred content (eyebrow, headline, body, CTA), and scroll indicator.
 *
 * CRITICAL: The outer element MUST have id="fc-hero" — the sticky nav's
 * IntersectionObserver depends on it.
 */
class FC_Hero extends \Umoya_EW\Base_Widget {

    public function get_name() {
        return 'fc-hero';
    }

    public function get_title() {
        return 'FC Hero';
    }

    public function get_icon() {
        return 'eicon-banner';
    }

    public function get_style_depends() {
        return array( 'fc-shared', 'fc-section-01' );
    }

    public function get_script_depends() {
        return array( 'fc-scroll-reveal' );
    }

    public function get_keywords() {
        return array( 'umoya', 'hero', 'banner', 'header' );
    }

    /* ─── Controls ─────────────────────────────────────────────── */

    protected function register_controls() {

        /* ══════════════════════════════════════════════════════════
         * CONTENT TAB
         * ══════════════════════════════════════════════════════════ */

        /* ── Background ─────────────────────────────────────────── */
        $this->start_controls_section( 'section_background', array(
            'label' => 'Background',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->add_control( 'bg_image', array(
            'label'   => 'Hero Image',
            'type'    => Controls_Manager::MEDIA,
            'default' => array(
                'url' => 'https://umoyaafrikatours.co.za/wp-content/uploads/2025/10/umoya_image-1.jpg',
            ),
        ) );

        $this->add_control( 'bg_image_alt', array(
            'label'   => 'Image Alt Text',
            'type'    => Controls_Manager::TEXT,
            'default' => 'Umoya Afrika Tours — heritage journey through South Africa',
            'label_block' => true,
        ) );

        $this->end_controls_section();

        /* ── Content ────────────────────────────────────────────── */
        $this->start_controls_section( 'section_content', array(
            'label' => 'Content',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->add_control( 'eyebrow', array(
            'label'   => 'Eyebrow Text',
            'type'    => Controls_Manager::TEXT,
            'default' => 'An Exclusive Community',
            'label_block' => true,
        ) );

        $this->add_control( 'title_part1', array(
            'label'       => 'Title Part 1',
            'type'        => Controls_Manager::TEXT,
            'default'     => 'Founder\'s',
            'label_block' => true,
            'description' => 'Displayed in italic style.',
        ) );

        $this->add_control( 'title_italic', array(
            'label'       => 'Title Italic Part',
            'type'        => Controls_Manager::TEXT,
            'default'     => 'Circle',
            'label_block' => true,
            'description' => 'Displayed on a separate line in regular (non-italic) weight.',
        ) );

        $this->add_control( 'body_text', array(
            'label'   => 'Body Text',
            'type'    => Controls_Manager::TEXTAREA,
            'default' => 'Experience South Africa through a rare and transformative journey.',
            'rows'    => 4,
        ) );

        $this->end_controls_section();

        /* ── CTA Button ─────────────────────────────────────────── */
        $this->start_controls_section( 'section_cta', array(
            'label' => 'CTA Button',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->register_button_controls( 'cta', 'Primary CTA', array(
            'text'          => 'Be the First to Return',
            'link'          => '#fc-form-section',
            'bg'            => '#D97E53',
            'bg_hover'      => '#C06840',
            'color'         => '#FFFFFF',
            'color_hover'   => '#FFFFFF',
            'border_radius' => '0',
        ), '.fc-h1-btn-primary' );

        $this->add_control( 'cta_show_arrow', array(
            'label'        => 'Show Arrow Icon',
            'type'         => Controls_Manager::SWITCHER,
            'label_on'     => 'Yes',
            'label_off'    => 'No',
            'return_value' => 'yes',
            'default'      => 'yes',
            'separator'    => 'before',
        ) );

        $this->end_controls_section();

        /* ══════════════════════════════════════════════════════════
         * STYLE TAB
         * ══════════════════════════════════════════════════════════ */

        /* ── Section ────────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_section', array(
            'label' => 'Section',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_responsive_control( 'min_height', array(
            'label'      => 'Minimum Height',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => array( 'vh', 'px' ),
            'range'      => array(
                'vh' => array( 'min' => 50, 'max' => 100 ),
                'px' => array( 'min' => 400, 'max' => 1200, 'step' => 10 ),
            ),
            'default'    => array(
                'unit' => 'vh',
                'size' => 100,
            ),
            'selectors'  => array(
                '{{WRAPPER}} #fc-hero' => 'min-height: max({{SIZE}}{{UNIT}}, 640px);',
            ),
        ) );

        $this->add_control( 'overlay_opacity', array(
            'label'   => 'Overlay Opacity',
            'type'    => Controls_Manager::SLIDER,
            'range'   => array(
                'px' => array( 'min' => 0, 'max' => 1, 'step' => 0.05 ),
            ),
            'default' => array( 'size' => 0.88 ),
            'selectors' => array(
                '{{WRAPPER}} .fc-h1-bg::after' => 'background: linear-gradient(180deg, rgba(28,13,6,calc({{SIZE}} * 0.4)) 0%, rgba(28,13,6,calc({{SIZE}} * 0.23)) 28%, rgba(28,13,6,calc({{SIZE}} * 0.51)) 60%, rgba(28,13,6,{{SIZE}}) 100%);',
            ),
        ) );

        $this->add_control( 'bg_color', array(
            'label'     => 'Fallback Background Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => '#4B2E2B',
            'selectors' => array(
                '{{WRAPPER}} #fc-hero' => 'background-color: {{VALUE}};',
            ),
        ) );

        $this->end_controls_section();

        /* ── Eyebrow Style ──────────────────────────────────────── */
        $this->start_controls_section( 'section_style_eyebrow', array(
            'label' => 'Eyebrow',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'eyebrow_typography',
            'label'    => 'Typography',
            'selector' => '{{WRAPPER}} .fc-h1-eye',
        ) );

        $this->add_control( 'eyebrow_color', array(
            'label'     => 'Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => '#D97E53',
            'selectors' => array(
                '{{WRAPPER}} .fc-h1-eye' => 'color: {{VALUE}};',
            ),
        ) );

        $this->add_control( 'eyebrow_rule_color', array(
            'label'     => 'Accent Rules Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => '#D97E53',
            'selectors' => array(
                '{{WRAPPER}} .fc-h1-eye::before, {{WRAPPER}} .fc-h1-eye::after' => 'background-color: {{VALUE}};',
            ),
        ) );

        $this->end_controls_section();

        /* ── Title Style ────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_title', array(
            'label' => 'Title',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'title_typography',
            'label'    => 'Typography',
            'selector' => '{{WRAPPER}} .fc-h1-title',
        ) );

        $this->add_control( 'title_color', array(
            'label'     => 'Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => '#F5F0EB',
            'selectors' => array(
                '{{WRAPPER}} .fc-h1-title' => 'color: {{VALUE}};',
            ),
        ) );

        $this->add_control( 'title_italic_color', array(
            'label'     => 'Italic Part Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => '',
            'selectors' => array(
                '{{WRAPPER}} .fc-h1-title strong' => 'color: {{VALUE}};',
            ),
            'description' => 'Leave blank to inherit main title color.',
        ) );

        $this->end_controls_section();

        /* ── Body Style ─────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_body', array(
            'label' => 'Body Text',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'body_typography',
            'label'    => 'Typography',
            'selector' => '{{WRAPPER}} .fc-h1-sub',
        ) );

        $this->add_control( 'body_color', array(
            'label'     => 'Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => 'rgba(245,240,235,0.9)',
            'selectors' => array(
                '{{WRAPPER}} .fc-h1-sub' => 'color: {{VALUE}};',
            ),
        ) );

        $this->add_responsive_control( 'body_max_width', array(
            'label'      => 'Max Width',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => array( 'px', '%' ),
            'range'      => array(
                'px' => array( 'min' => 300, 'max' => 900, 'step' => 10 ),
                '%'  => array( 'min' => 30, 'max' => 100 ),
            ),
            'default'    => array(
                'unit' => 'px',
                'size' => 620,
            ),
            'selectors'  => array(
                '{{WRAPPER}} .fc-h1-sub' => 'max-width: {{SIZE}}{{UNIT}};',
            ),
        ) );

        $this->end_controls_section();

        /* ── Scroll Indicator Style ─────────────────────────────── */
        $this->start_controls_section( 'section_style_scroll', array(
            'label' => 'Scroll Indicator',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_control( 'scroll_show', array(
            'label'        => 'Show Scroll Indicator',
            'type'         => Controls_Manager::SWITCHER,
            'label_on'     => 'Show',
            'label_off'    => 'Hide',
            'return_value' => 'yes',
            'default'      => 'yes',
        ) );

        $this->add_control( 'scroll_color', array(
            'label'     => 'Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => 'rgba(245,240,235,0.4)',
            'selectors' => array(
                '{{WRAPPER}} .fc-h1-scroll-lbl' => 'color: {{VALUE}};',
                '{{WRAPPER}} .fc-h1-track' => 'background-color: {{VALUE}};',
            ),
            'condition' => array( 'scroll_show' => 'yes' ),
        ) );

        $this->add_control( 'scroll_accent_color', array(
            'label'     => 'Accent (animated line)',
            'type'      => Controls_Manager::COLOR,
            'default'   => '#D97E53',
            'selectors' => array(
                '{{WRAPPER}} .fc-h1-track::after' => 'background: linear-gradient(to bottom, transparent, {{VALUE}}, transparent);',
            ),
            'condition' => array( 'scroll_show' => 'yes' ),
        ) );

        $this->end_controls_section();
    }

    /* ─── Render ───────────────────────────────────────────────── */

    protected function render() {
        $s = $this->get_settings_for_display();
        $t = $this->get_design_tokens();

        $is_editor = \Elementor\Plugin::$instance->editor->is_edit_mode();

        // Image
        $image_url = ! empty( $s['bg_image']['url'] ) ? $s['bg_image']['url'] : '';
        $image_alt = ! empty( $s['bg_image_alt'] ) ? $s['bg_image_alt'] : '';

        // CTA link
        $cta_text   = ! empty( $s['cta_text'] ) ? $s['cta_text'] : '';
        $cta_url    = ! empty( $s['cta_link']['url'] ) ? $s['cta_link']['url'] : '#fc-form-section';
        $cta_target = ! empty( $s['cta_link']['is_external'] ) ? ' target="_blank"' : '';
        $cta_rel    = ! empty( $s['cta_link']['nofollow'] ) ? ' rel="nofollow"' : '';
        $show_arrow = ! empty( $s['cta_show_arrow'] ) && 'yes' === $s['cta_show_arrow'];

        // Scroll indicator
        $show_scroll = ! empty( $s['scroll_show'] ) && 'yes' === $s['scroll_show'];

        // In editor, skip entrance animation
        $anim_class = $is_editor ? ' fc-h1-no-anim' : '';
        ?>
        <section id="fc-hero" class="fc-h1-section<?php echo esc_attr( $anim_class ); ?>" aria-label="Founder's Circle — Hero">

          <!-- Background -->
          <div class="fc-h1-bg">
            <?php if ( $image_url ) : ?>
              <img
                src="<?php echo esc_url( $image_url ); ?>"
                alt="<?php echo esc_attr( $image_alt ); ?>"
              />
            <?php endif; ?>
          </div>

          <!-- Centre-aligned content -->
          <div class="fc-h1-content">

            <?php if ( ! empty( $s['eyebrow'] ) ) : ?>
              <span class="fc-h1-eye"><?php echo esc_html( $s['eyebrow'] ); ?></span>
            <?php endif; ?>

            <h1 class="fc-h1-title">
              <?php echo esc_html( $s['title_part1'] ); ?>
              <?php if ( ! empty( $s['title_italic'] ) ) : ?>
                <strong><?php echo esc_html( $s['title_italic'] ); ?></strong>
              <?php endif; ?>
            </h1>

            <?php if ( ! empty( $s['body_text'] ) ) : ?>
              <p class="fc-h1-sub"><?php echo esc_html( $s['body_text'] ); ?></p>
            <?php endif; ?>

            <?php if ( ! empty( $cta_text ) ) : ?>
              <div class="fc-h1-btns">
                <a href="<?php echo esc_url( $cta_url ); ?>" class="fc-h1-btn fc-h1-btn-primary"<?php echo $cta_target . $cta_rel; ?>>
                  <?php echo esc_html( $cta_text ); ?>
                  <?php if ( $show_arrow ) : ?>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="13 6 19 12 13 18"/>
                    </svg>
                  <?php endif; ?>
                </a>
              </div>
            <?php endif; ?>

          </div>

          <?php if ( $show_scroll ) : ?>
            <div class="fc-h1-scroll" aria-hidden="true">
              <span class="fc-h1-scroll-lbl">Scroll</span>
              <div class="fc-h1-track"></div>
            </div>
          <?php endif; ?>

        </section>
        <?php
    }
}
