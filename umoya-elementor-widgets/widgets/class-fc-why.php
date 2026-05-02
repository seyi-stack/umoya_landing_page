<?php
namespace Umoya_EW\Widgets;

use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Box_Shadow;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * FC Why — Section 06: Why Umoya Afrika Tours.
 *
 * Two-column: philosophy copy left + video/CTA right.
 * All content and styling exposed as Elementor controls.
 */
class FC_Why extends \Umoya_EW\Base_Widget {

    public function get_name() {
        return 'fc-why';
    }

    public function get_title() {
        return 'FC Why Umoya';
    }

    public function get_icon() {
        return 'eicon-info-circle';
    }

    public function get_style_depends() {
        return array( 'fc-shared', 'fc-section-06' );
    }

    public function get_script_depends() {
        return array( 'fc-scroll-reveal', 'fc-section-06-video' );
    }

    public function get_keywords() {
        return array( 'umoya', 'why', 'about', 'philosophy', 'video' );
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
            'default' => 'Our Philosophy',
        ) );

        $this->add_control( 'title', array(
            'label'   => 'Title (before emphasis)',
            'type'    => Controls_Manager::TEXT,
            'default' => 'Why',
        ) );

        $this->add_control( 'title_em', array(
            'label'   => 'Title (italic emphasis)',
            'type'    => Controls_Manager::TEXTAREA,
            'default' => 'Umoya Afrika Tours?',
        ) );

        $this->end_controls_section();

        /* ── Body ────────────────────────────────────────────────── */
        $this->start_controls_section( 'section_body', array(
            'label' => 'Body Content',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->add_control( 'lead', array(
            'label'   => 'Lead Paragraph',
            'type'    => Controls_Manager::TEXTAREA,
            'default' => 'Umoya Afrika Tours is not conventional tourism. We design intimate, small-group heritage journeys across South Africa created specifically for the global African diaspora.',
        ) );

        $this->add_control( 'body', array(
            'label'   => 'Body Text',
            'type'    => Controls_Manager::WYSIWYG,
            'default' => '<p>Our work is rooted in a simple belief: returning to the continent should be intentional, historically grounded, and guided by those who carry its living knowledge. This is not a checklist itinerary — it is a carefully structured cultural immersion.</p>',
        ) );

        $this->end_controls_section();

        /* ── Video ───────────────────────────────────────────────── */
        $this->start_controls_section( 'section_video', array(
            'label' => 'Video',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->add_control( 'video_url', array(
            'label'       => 'Video URL',
            'type'        => Controls_Manager::TEXT,
            'default'     => 'https://umoyaafrikatours.co.za/wp-content/uploads/2025/videos/the-sacred-return-18day-heritage-journey-1.mp4',
            'description' => 'Direct URL to the video file (MP4).',
        ) );

        $this->add_control( 'video_label', array(
            'label'   => 'ARIA Label',
            'type'    => Controls_Manager::TEXT,
            'default' => 'The Sacred Return — 18-Day Heritage Journey',
        ) );

        $this->end_controls_section();

        /* ── CTA Buttons ─────────────────────────────────────────── */
        $this->start_controls_section( 'section_cta', array(
            'label' => 'CTA Button',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->register_button_controls( 'cta', 'CTA Button', array(
            'text'     => 'Inquire Now',
            'link'     => '#fc-form-section',
            'bg'       => $t['brown'],
            'bg_hover' => '#3A2220',
            'color'    => $t['white'],
        ), '.fc-why-btn' );

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
            'selectors' => array( '{{WRAPPER}} #fc-why' => 'background-color: {{VALUE}};' ),
        ) );

        $this->register_section_padding( '#fc-why', array(
            'top' => '120', 'bottom' => '120',
        ) );

        $this->end_controls_section();

        /* ── Eyebrow ─────────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_eyebrow', array(
            'label' => 'Eyebrow',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'eyebrow_typography',
            'selector' => '{{WRAPPER}} .fc-why-eyebrow',
        ) );

        $this->add_control( 'eyebrow_color', array(
            'label'     => 'Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-why-eyebrow' => 'color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();

        /* ── Title ───────────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_title', array(
            'label' => 'Title',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'title_typography',
            'selector' => '{{WRAPPER}} .fc-why-title',
        ) );

        $this->add_control( 'title_color', array(
            'label'     => 'Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['brown'],
            'selectors' => array( '{{WRAPPER}} .fc-why-title' => 'color: {{VALUE}};' ),
        ) );

        $this->add_control( 'title_em_color', array(
            'label'     => 'Italic Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-why-title em' => 'color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();

        /* ── Lead ────────────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_lead', array(
            'label' => 'Lead Paragraph',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'lead_typography',
            'selector' => '{{WRAPPER}} .fc-why-lead',
        ) );

        $this->add_control( 'lead_color', array(
            'label'     => 'Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['brown'],
            'selectors' => array( '{{WRAPPER}} .fc-why-lead' => 'color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();

        /* ── Body ────────────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_body', array(
            'label' => 'Body Text',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'body_typography',
            'selector' => '{{WRAPPER}} .fc-why-body',
        ) );

        $this->add_control( 'body_color', array(
            'label'     => 'Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['text'],
            'selectors' => array( '{{WRAPPER}} .fc-why-body' => 'color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();

        /* ── Video ───────────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_video', array(
            'label' => 'Video',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_control( 'vid_border_radius', array(
            'label'      => 'Border Radius',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => array( 'px' ),
            'range'      => array( 'px' => array( 'min' => 0, 'max' => 30 ) ),
            'default'    => array( 'size' => 12, 'unit' => 'px' ),
            'selectors'  => array( '{{WRAPPER}} .fc-vid-wrap' => 'border-radius: {{SIZE}}{{UNIT}};' ),
        ) );

        $this->add_group_control( Group_Control_Box_Shadow::get_type(), array(
            'name'     => 'vid_shadow',
            'selector' => '{{WRAPPER}} .fc-vid-wrap',
        ) );

        $this->end_controls_section();

        /* ── Rule ────────────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_rule', array(
            'label' => 'Rule Divider',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_control( 'rule_color', array(
            'label'     => 'Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-why-rule' => 'background-color: {{VALUE}};' ),
        ) );

        $this->add_control( 'rule_width', array(
            'label'      => 'Width',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => array( 'px' ),
            'range'      => array( 'px' => array( 'min' => 20, 'max' => 120 ) ),
            'default'    => array( 'size' => 44, 'unit' => 'px' ),
            'selectors'  => array( '{{WRAPPER}} .fc-why-rule' => 'width: {{SIZE}}{{UNIT}};' ),
        ) );

        $this->end_controls_section();
    }

    /* ─── Render ───────────────────────────────────────────────── */

    protected function render() {
        $this->render_section_template( 'section-06-why.php' );
        return;

        $s = $this->get_settings_for_display();

        $is_editor = \Elementor\Plugin::$instance->editor->is_edit_mode();
        $rv  = $is_editor ? 'fc-why-rev fc-why-in' : 'fc-why-rev';
        $rv2 = $is_editor ? 'fc-why-rev fc-d2 fc-why-in' : 'fc-why-rev fc-d2';

        $video_url = ! empty( $s['video_url'] ) ? $s['video_url'] : '';
        $video_lbl = ! empty( $s['video_label'] ) ? $s['video_label'] : '';
        ?>
        <section id="fc-why" aria-label="Why Umoya Afrika Tours">
          <div class="fc-why-wrap">
            <div class="fc-why-grid">

              <!-- LEFT: Copy -->
              <div class="<?php echo esc_attr( $rv ); ?>">
                <?php $this->render_eyebrow( $s['eyebrow'], 'fc-why-eyebrow' ); ?>

                <h2 class="fc-why-title">
                  <?php echo esc_html( $s['title'] ); ?>
                  <?php if ( ! empty( $s['title_em'] ) ) : ?>
                    <em><?php echo nl2br( esc_html( $s['title_em'] ) ); ?></em>
                  <?php endif; ?>
                </h2>

                <?php $this->render_rule( 'fc-why-rule' ); ?>

                <?php if ( ! empty( $s['lead'] ) ) : ?>
                  <p class="fc-why-lead"><strong><?php echo esc_html( $s['lead'] ); ?></strong></p>
                <?php endif; ?>

                <?php if ( ! empty( $s['body'] ) ) : ?>
                  <div class="fc-why-body-wrap"><?php echo wp_kses_post( $s['body'] ); ?></div>
                <?php endif; ?>
              </div>

              <!-- RIGHT: Video + CTA -->
              <div class="fc-why-aside <?php echo esc_attr( $rv2 ); ?>">

                <?php if ( $video_url ) : ?>
                  <div class="fc-vid-wrap">
                    <video
                      class="fc-vid"
                      src="<?php echo esc_url( $video_url ); ?>"
                      preload="metadata"
                      playsinline
                      aria-label="<?php echo esc_attr( $video_lbl ); ?>">
                    </video>
                    <button class="fc-vid-ph" type="button" aria-label="Play Umoya brand video">
                      <span class="fc-play" aria-hidden="true">
                        <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      </span>
                    </button>
                  </div>
                <?php endif; ?>

                <?php $this->render_button( $s, 'cta', 'fc-why-btn' ); ?>

              </div>

            </div>
          </div>
        </section>
        <?php
    }
}
