<?php
namespace Umoya_EW\Widgets;

use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Box_Shadow;
use Elementor\Repeater;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * FC Be First — Section 03: Be Among the First to Journey Home.
 *
 * Two-column layout: copy left + 4-slide carousel right.
 * All content and styling exposed as Elementor sidebar controls.
 */
class FC_Be_First extends \Umoya_EW\Base_Widget {

    public function get_name() {
        return 'fc-be-first';
    }

    public function get_title() {
        return 'FC Be First';
    }

    public function get_icon() {
        return 'eicon-posts-carousel';
    }

    public function get_style_depends() {
        return array( 'fc-shared', 'fc-section-03' );
    }

    public function get_script_depends() {
        return array( 'fc-scroll-reveal', 'fc-section-03-slideshow' );
    }

    public function get_keywords() {
        return array( 'umoya', 'first', 'exclusive', 'carousel', 'slideshow' );
    }

    /* ─── Controls ─────────────────────────────────────────────── */

    protected function register_controls() {

        $t = $this->get_design_tokens();

        /* ══ CONTENT TAB ═══════════════════════════════════════════ */

        /* ── Header ──────────────────────────────────────────────── */
        $this->start_controls_section( 'section_header', array(
            'label' => 'Header',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->add_control( 'eyebrow', array(
            'label'   => 'Eyebrow',
            'type'    => Controls_Manager::TEXT,
            'default' => 'Exclusive Early Access',
        ) );

        $this->add_control( 'title', array(
            'label'   => 'Title (before emphasis)',
            'type'    => Controls_Manager::TEXT,
            'default' => 'Be the First',
        ) );

        $this->add_control( 'title_em', array(
            'label'   => 'Title (italic emphasis)',
            'type'    => Controls_Manager::TEXT,
            'default' => 'to Return',
        ) );

        $this->end_controls_section();

        /* ── Body ────────────────────────────────────────────────── */
        $this->start_controls_section( 'section_body', array(
            'label' => 'Body Content',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->add_control( 'body', array(
            'label'   => 'Body Text',
            'type'    => Controls_Manager::WYSIWYG,
            'default' => '<p><strong>This is more than early registration.</strong> It\'s an invitation to take part in the founding chapter of a travel movement dedicated to reconnecting the global African diaspora with homeland.</p><p>Founder\'s Circle membership is intentionally limited to a small group of early travelers who will help shape the beginning of the Umoya community.</p>',
        ) );

        $this->add_control( 'pull_quote', array(
            'label'   => 'Pull Quote',
            'type'    => Controls_Manager::TEXTAREA,
            'default' => 'Join now to reserve your personalized heritage journey before Founder\'s Circle access closes and journeys open to the public. Once this founding cohort is complete, membership closes permanently.',
        ) );

        $this->end_controls_section();

        /* ── CTA Button ──────────────────────────────────────────── */
        $this->start_controls_section( 'section_cta', array(
            'label' => 'CTA Button',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->register_button_controls( 'cta', 'CTA Button', array(
            'text'    => 'Join Now',
            'link'    => '#fc-form-section',
            'bg'      => $t['terra'],
            'bg_hover' => $t['terra_dk'],
        ), '.fc-bf-btn' );

        $this->end_controls_section();

        /* ── Slideshow ───────────────────────────────────────────── */
        $this->start_controls_section( 'section_slideshow', array(
            'label' => 'Slideshow',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $repeater = new Repeater();

        $repeater->add_control( 'image', array(
            'label' => 'Image',
            'type'  => Controls_Manager::MEDIA,
        ) );

        $repeater->add_control( 'alt', array(
            'label'   => 'Alt Text',
            'type'    => Controls_Manager::TEXT,
            'default' => '',
        ) );

        $repeater->add_control( 'caption', array(
            'label'   => 'Caption',
            'type'    => Controls_Manager::TEXT,
            'default' => '',
        ) );

        $this->add_control( 'slides', array(
            'label'       => 'Slides',
            'type'        => Controls_Manager::REPEATER,
            'fields'      => $repeater->get_controls(),
            'title_field' => '{{{ caption }}}',
            'default'     => array(
                array(
                    'image'   => array( 'url' => 'https://umoyaafrikatours.co.za/wp-content/uploads/2026/optimized/compressed_dsc02384.jpg' ),
                    'alt'     => 'Heritage journey — South Africa landscape',
                    'caption' => 'Return to the land of your ancestors',
                ),
                array(
                    'image'   => array( 'url' => 'https://umoyaafrikatours.co.za/wp-content/uploads/2026/optimized/compressed_kzn(1).jpg' ),
                    'alt'     => 'Luxury lodge — Umoya journey accommodation',
                    'caption' => 'Boutique stays. Concierge care.',
                ),
                array(
                    'image'   => array( 'url' => 'https://umoyaafrikatours.co.za/wp-content/uploads/2026/optimized/compressed_victor zaviano itffa-176.jpg' ),
                    'alt'     => 'South African coastline — Western Cape',
                    'caption' => 'Walk the land. Feel the sky.',
                ),
                array(
                    'image'   => array( 'url' => 'https://umoyaafrikatours.co.za/wp-content/uploads/2026/optimized/compressed_dsc05189.jpg' ),
                    'alt'     => 'KwaZulu-Natal — cultural welcome ceremony',
                    'caption' => 'Be welcomed as kin, not as tourist',
                ),
            ),
        ) );

        $this->add_control( 'autoplay_speed', array(
            'label'   => 'Autoplay Speed (ms)',
            'type'    => Controls_Manager::NUMBER,
            'default' => 5500,
            'min'     => 2000,
            'max'     => 15000,
            'step'    => 500,
        ) );

        $this->end_controls_section();

        /* ══ STYLE TAB ═════════════════════════════════════════════ */

        /* ── Section ─────────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_section', array(
            'label' => 'Section',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_control( 'bg_color', array(
            'label'     => 'Background',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['cream'],
            'selectors' => array( '{{WRAPPER}} #fc-be-first' => 'background-color: {{VALUE}};' ),
        ) );

        $this->register_section_padding( '#fc-be-first' );

        $this->end_controls_section();

        /* ── Eyebrow ─────────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_eyebrow', array(
            'label' => 'Eyebrow',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'eyebrow_typography',
            'selector' => '{{WRAPPER}} .fc-bf-eyebrow',
        ) );

        $this->add_control( 'eyebrow_color', array(
            'label'     => 'Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-bf-eyebrow' => 'color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();

        /* ── Title ───────────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_title', array(
            'label' => 'Title',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'title_typography',
            'selector' => '{{WRAPPER}} .fc-bf-title',
        ) );

        $this->add_control( 'title_color', array(
            'label'     => 'Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['brown'],
            'selectors' => array( '{{WRAPPER}} .fc-bf-title' => 'color: {{VALUE}};' ),
        ) );

        $this->add_control( 'title_em_color', array(
            'label'     => 'Italic Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-bf-title em' => 'color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();

        /* ── Body ────────────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_body', array(
            'label' => 'Body Text',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'body_typography',
            'selector' => '{{WRAPPER}} .fc-bf-body p',
        ) );

        $this->add_control( 'body_color', array(
            'label'     => 'Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['text'],
            'selectors' => array( '{{WRAPPER}} .fc-bf-body p' => 'color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();

        /* ── Pull Quote ──────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_pull', array(
            'label' => 'Pull Quote',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'pull_typography',
            'selector' => '{{WRAPPER}} .fc-bf-pull',
        ) );

        $this->add_control( 'pull_color', array(
            'label'     => 'Text Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['text'],
            'selectors' => array( '{{WRAPPER}} .fc-bf-pull' => 'color: {{VALUE}};' ),
        ) );

        $this->add_control( 'pull_border_color', array(
            'label'     => 'Left Border',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-bf-pull' => 'border-left-color: {{VALUE}};' ),
        ) );

        $this->add_control( 'pull_bg', array(
            'label'     => 'Background',
            'type'      => Controls_Manager::COLOR,
            'default'   => 'rgba(217,126,83,0.04)',
            'selectors' => array( '{{WRAPPER}} .fc-bf-pull' => 'background-color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();

        /* ── Rule Divider ────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_rule', array(
            'label' => 'Rule Divider',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_control( 'rule_color', array(
            'label'     => 'Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-bf-rule' => 'background-color: {{VALUE}};' ),
        ) );

        $this->add_control( 'rule_width', array(
            'label'      => 'Width',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => array( 'px' ),
            'range'      => array( 'px' => array( 'min' => 20, 'max' => 120 ) ),
            'default'    => array( 'size' => 44, 'unit' => 'px' ),
            'selectors'  => array( '{{WRAPPER}} .fc-bf-rule' => 'width: {{SIZE}}{{UNIT}};' ),
        ) );

        $this->end_controls_section();

        /* ── Slideshow ───────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_slideshow', array(
            'label' => 'Slideshow',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_control( 'ss_border_radius', array(
            'label'      => 'Border Radius',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => array( 'px' ),
            'range'      => array( 'px' => array( 'min' => 0, 'max' => 30 ) ),
            'default'    => array( 'size' => 10, 'unit' => 'px' ),
            'selectors'  => array( '{{WRAPPER}} .fc-ss-outer' => 'border-radius: {{SIZE}}{{UNIT}};' ),
        ) );

        $this->add_group_control( Group_Control_Box_Shadow::get_type(), array(
            'name'     => 'ss_shadow',
            'selector' => '{{WRAPPER}} .fc-ss-outer',
        ) );

        $this->add_control( 'ss_aspect', array(
            'label'   => 'Aspect Ratio',
            'type'    => Controls_Manager::SELECT,
            'default' => '3/4',
            'options' => array(
                '3/4'  => '3:4 (Portrait)',
                '4/3'  => '4:3 (Landscape)',
                '1/1'  => '1:1 (Square)',
                '16/9' => '16:9 (Wide)',
            ),
            'selectors' => array( '{{WRAPPER}} .fc-ss-outer' => 'aspect-ratio: {{VALUE}};' ),
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'caption_typography',
            'label'    => 'Caption Typography',
            'selector' => '{{WRAPPER}} .fc-ss-cap',
        ) );

        $this->add_control( 'caption_color', array(
            'label'     => 'Caption Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => 'rgba(245,240,235,0.88)',
            'selectors' => array( '{{WRAPPER}} .fc-ss-cap' => 'color: {{VALUE}};' ),
        ) );

        $this->add_control( 'dot_color', array(
            'label'     => 'Active Dot Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-ss-dot.fc-ss-on::after' => 'background-color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();
    }

    /* ─── Render ───────────────────────────────────────────────── */

    protected function render() {
        $s = $this->get_settings_for_display();

        $is_editor = \Elementor\Plugin::$instance->editor->is_edit_mode();
        $rv  = $is_editor ? 'fc-bf-reveal fc-bf-in' : 'fc-bf-reveal';
        $rv2 = $is_editor ? 'fc-bf-reveal fc-d2 fc-bf-in' : 'fc-bf-reveal fc-d2';

        $slides = ! empty( $s['slides'] ) ? $s['slides'] : array();
        $count  = count( $slides );
        ?>
        <section id="fc-be-first" aria-label="Be the First to Return">
          <div class="fc-bf-wrap">
            <div class="fc-bf-grid">

              <!-- Copy -->
              <div class="<?php echo esc_attr( $rv ); ?>">
                <?php $this->render_eyebrow( $s['eyebrow'], 'fc-bf-eyebrow' ); ?>

                <h2 class="fc-bf-title">
                  <?php echo esc_html( $s['title'] ); ?>
                  <?php if ( ! empty( $s['title_em'] ) ) : ?>
                    <em><?php echo esc_html( $s['title_em'] ); ?></em>
                  <?php endif; ?>
                </h2>

                <?php $this->render_rule( 'fc-bf-rule' ); ?>

                <?php if ( ! empty( $s['body'] ) ) : ?>
                  <div class="fc-bf-body"><?php echo wp_kses_post( $s['body'] ); ?></div>
                <?php endif; ?>

                <?php if ( ! empty( $s['pull_quote'] ) ) : ?>
                  <div class="fc-bf-pull"><?php echo esc_html( $s['pull_quote'] ); ?></div>
                <?php endif; ?>

                <?php $this->render_button( $s, 'cta', 'fc-bf-btn' ); ?>
              </div>

              <!-- Slideshow -->
              <div
                class="fc-ss-outer <?php echo esc_attr( $rv2 ); ?>"
                role="region"
                aria-label="Journey imagery — slideshow"
                aria-roledescription="carousel"
                data-speed="<?php echo esc_attr( $s['autoplay_speed'] ); ?>"
              >
                <div class="fc-ss-track">
                  <?php foreach ( $slides as $i => $slide ) :
                    $active  = ( 0 === $i ) ? ' fc-ss-on' : '';
                    $img_url = ! empty( $slide['image']['url'] ) ? $slide['image']['url'] : '';
                    $img_alt = ! empty( $slide['alt'] ) ? $slide['alt'] : '';
                    $label   = ( $i + 1 ) . ' of ' . $count;
                  ?>
                    <div class="fc-ss-slide<?php echo esc_attr( $active ); ?>" role="group" aria-label="<?php echo esc_attr( $label ); ?>" aria-roledescription="slide">
                      <?php if ( $img_url ) : ?>
                        <img src="<?php echo esc_url( $img_url ); ?>" alt="<?php echo esc_attr( $img_alt ); ?>" loading="lazy" />
                      <?php endif; ?>
                      <?php if ( ! empty( $slide['caption'] ) ) : ?>
                        <span class="fc-ss-cap"><?php echo esc_html( $slide['caption'] ); ?></span>
                      <?php endif; ?>
                    </div>
                  <?php endforeach; ?>
                </div>

                <!-- Arrows -->
                <button class="fc-ss-arrow fc-ss-prev" aria-label="Previous slide">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button class="fc-ss-arrow fc-ss-next" aria-label="Next slide">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
                </button>

                <!-- Dots -->
                <div class="fc-ss-dots" role="tablist" aria-label="Slide navigation">
                  <?php for ( $i = 0; $i < $count; $i++ ) :
                    $active_class = ( 0 === $i ) ? ' fc-ss-on' : '';
                    $selected     = ( 0 === $i ) ? 'true' : 'false';
                  ?>
                    <button class="fc-ss-dot<?php echo esc_attr( $active_class ); ?>" role="tab" aria-selected="<?php echo esc_attr( $selected ); ?>" aria-label="Slide <?php echo esc_attr( $i + 1 ); ?>" data-fci="<?php echo esc_attr( $i ); ?>"></button>
                  <?php endfor; ?>
                </div>

              </div>

            </div>
          </div>
        </section>
        <?php
    }
}
