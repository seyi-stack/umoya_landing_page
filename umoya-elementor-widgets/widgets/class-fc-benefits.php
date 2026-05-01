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
 * FC Benefits — Section 04: Member Benefits (dark section).
 *
 * Two-column layout: portrait image left + checklist right.
 * Full sidebar controls for all content and visual properties.
 */
class FC_Benefits extends \Umoya_EW\Base_Widget {

    public function get_name() {
        return 'fc-benefits';
    }

    public function get_title() {
        return 'FC Benefits';
    }

    public function get_icon() {
        return 'eicon-check-circle';
    }

    public function get_style_depends() {
        return array( 'fc-shared', 'fc-section-04' );
    }

    public function get_script_depends() {
        return array( 'fc-scroll-reveal' );
    }

    public function get_keywords() {
        return array( 'umoya', 'benefits', 'checklist', 'founders', 'membership' );
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
            'default' => 'Membership Privileges',
        ) );

        $this->add_control( 'title', array(
            'label'   => 'Title (before emphasis)',
            'type'    => Controls_Manager::TEXT,
            'default' => 'What Your',
        ) );

        $this->add_control( 'title_em', array(
            'label'   => 'Title (italic emphasis)',
            'type'    => Controls_Manager::TEXT,
            'default' => 'Membership',
        ) );

        $this->add_control( 'title_suffix', array(
            'label'   => 'Title (after emphasis)',
            'type'    => Controls_Manager::TEXT,
            'default' => 'Includes',
        ) );

        $this->end_controls_section();

        /* ── Image ───────────────────────────────────────────────── */
        $this->start_controls_section( 'section_image', array(
            'label' => 'Image',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->add_control( 'image', array(
            'label'   => 'Portrait Image',
            'type'    => Controls_Manager::MEDIA,
            'default' => array(
                'url' => 'https://umoyaafrikatours.co.za/wp-content/uploads/2025/10/umoya_image-5.jpg',
            ),
        ) );

        $this->add_control( 'image_alt', array(
            'label'   => 'Alt Text',
            'type'    => Controls_Manager::TEXT,
            'default' => 'Umoya Founder\'s Circle — heritage traveler',
        ) );

        $this->end_controls_section();

        /* ── Checklist ───────────────────────────────────────────── */
        $this->start_controls_section( 'section_checklist', array(
            'label' => 'Checklist',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $repeater = new Repeater();

        $repeater->add_control( 'text', array(
            'label'   => 'Benefit',
            'type'    => Controls_Manager::TEXT,
            'default' => '',
        ) );

        $this->add_control( 'items', array(
            'label'       => 'Benefits',
            'type'        => Controls_Manager::REPEATER,
            'fields'      => $repeater->get_controls(),
            'title_field' => '{{{ text }}}',
            'default'     => array(
                array( 'text' => 'Exclusive promotions reserved for Founder\'s Circle members only' ),
                array( 'text' => 'Priority access to book before journeys open to the general public' ),
                array( 'text' => 'A dedicated travel expert to guide you personally from enquiry to arrival' ),
                array( 'text' => 'Seamless, concierge-style booking and journey planning experience' ),
                array( 'text' => 'Pre-departure orientation and cultural preparation materials' ),
                array( 'text' => 'Arrival welcome gift and an opening ceremony in South Africa' ),
                array( 'text' => 'Early access to all future journey announcements and Umoya experiences' ),
            ),
        ) );

        $this->end_controls_section();

        /* ── CTA Button ──────────────────────────────────────────── */
        $this->start_controls_section( 'section_cta', array(
            'label' => 'CTA Button',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->register_button_controls( 'cta', 'CTA Button', array(
            'text'     => 'Become a Founder\'s Circle Member',
            'link'     => '#fc-form-section',
            'bg'       => $t['terra'],
            'bg_hover' => $t['terra_dk'],
            'color'    => $t['white'],
        ), '.fc-ben-btn' );

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
            'default'   => $t['brown'],
            'selectors' => array( '{{WRAPPER}} #fc-benefits' => 'background-color: {{VALUE}};' ),
        ) );

        $this->register_section_padding( '#fc-benefits' );

        $this->add_control( 'show_glow', array(
            'label'        => 'Show Ambient Glow',
            'type'         => Controls_Manager::SWITCHER,
            'default'      => 'yes',
            'label_on'     => 'Yes',
            'label_off'    => 'No',
            'return_value' => 'yes',
        ) );

        $this->end_controls_section();

        /* ── Image ───────────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_image', array(
            'label' => 'Image',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_control( 'img_border_radius', array(
            'label'      => 'Border Radius',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => array( 'px' ),
            'range'      => array( 'px' => array( 'min' => 0, 'max' => 30 ) ),
            'default'    => array( 'size' => 10, 'unit' => 'px' ),
            'selectors'  => array( '{{WRAPPER}} .fc-ben-photo img' => 'border-radius: {{SIZE}}{{UNIT}};' ),
        ) );

        $this->add_group_control( Group_Control_Box_Shadow::get_type(), array(
            'name'     => 'img_shadow',
            'selector' => '{{WRAPPER}} .fc-ben-photo img',
        ) );

        $this->add_control( 'img_aspect', array(
            'label'   => 'Aspect Ratio',
            'type'    => Controls_Manager::SELECT,
            'default' => '4/5',
            'options' => array(
                '4/5'  => '4:5 (Portrait)',
                '3/4'  => '3:4 (Portrait Tall)',
                '1/1'  => '1:1 (Square)',
                '16/9' => '16:9 (Landscape)',
            ),
            'selectors' => array( '{{WRAPPER}} .fc-ben-photo' => 'aspect-ratio: {{VALUE}};' ),
        ) );

        $this->add_control( 'accent_block_color', array(
            'label'     => 'Corner Accent Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-ben-photo::after' => 'background-color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();

        /* ── Eyebrow ─────────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_eyebrow', array(
            'label' => 'Eyebrow',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'eyebrow_typography',
            'selector' => '{{WRAPPER}} .fc-ben-eyebrow',
        ) );

        $this->add_control( 'eyebrow_color', array(
            'label'     => 'Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-ben-eyebrow' => 'color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();

        /* ── Title ───────────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_title', array(
            'label' => 'Title',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'title_typography',
            'selector' => '{{WRAPPER}} .fc-ben-title',
        ) );

        $this->add_control( 'title_color', array(
            'label'     => 'Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['cream'],
            'selectors' => array( '{{WRAPPER}} .fc-ben-title' => 'color: {{VALUE}};' ),
        ) );

        $this->add_control( 'title_em_color', array(
            'label'     => 'Italic Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-ben-title em' => 'color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();

        /* ── Checklist ───────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_checklist', array(
            'label' => 'Checklist',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'item_typography',
            'selector' => '{{WRAPPER}} .fc-ben-list li',
        ) );

        $this->add_control( 'item_color', array(
            'label'     => 'Text Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => 'rgba(245,240,235,0.78)',
            'selectors' => array( '{{WRAPPER}} .fc-ben-list li' => 'color: {{VALUE}};' ),
        ) );

        $this->add_control( 'check_bg', array(
            'label'     => 'Check Circle Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-chk' => 'background-color: {{VALUE}};' ),
        ) );

        $this->add_control( 'check_icon_color', array(
            'label'     => 'Check Icon Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['white'],
            'selectors' => array( '{{WRAPPER}} .fc-chk svg' => 'stroke: {{VALUE}};' ),
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
            'selectors' => array( '{{WRAPPER}} .fc-ben-rule' => 'background-color: {{VALUE}};' ),
        ) );

        $this->add_control( 'rule_width', array(
            'label'      => 'Width',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => array( 'px' ),
            'range'      => array( 'px' => array( 'min' => 20, 'max' => 120 ) ),
            'default'    => array( 'size' => 44, 'unit' => 'px' ),
            'selectors'  => array( '{{WRAPPER}} .fc-ben-rule' => 'width: {{SIZE}}{{UNIT}};' ),
        ) );

        $this->end_controls_section();
    }

    /* ─── Render ───────────────────────────────────────────────── */

    protected function render() {
        $s = $this->get_settings_for_display();

        $is_editor = \Elementor\Plugin::$instance->editor->is_edit_mode();
        $rv  = $is_editor ? 'fc-ben-reveal fc-ben-in' : 'fc-ben-reveal';
        $rv1 = $is_editor ? 'fc-ben-reveal fc-d1 fc-ben-in' : 'fc-ben-reveal fc-d1';

        $image_url = ! empty( $s['image']['url'] ) ? $s['image']['url'] : '';
        $image_alt = ! empty( $s['image_alt'] ) ? $s['image_alt'] : '';
        $show_glow = 'yes' === $s['show_glow'] ? ' fc-ben-glow' : '';
        ?>
        <section id="fc-benefits" class="<?php echo esc_attr( trim( $show_glow ) ); ?>" aria-label="Founder's Circle Member Benefits">
          <div class="fc-ben-wrap">
            <div class="fc-ben-grid">

              <!-- Image -->
              <div class="fc-ben-photo <?php echo esc_attr( $rv ); ?>">
                <?php if ( $image_url ) : ?>
                  <img
                    src="<?php echo esc_url( $image_url ); ?>"
                    alt="<?php echo esc_attr( $image_alt ); ?>"
                    loading="lazy"
                  />
                <?php endif; ?>
              </div>

              <!-- Copy + Checklist -->
              <div class="<?php echo esc_attr( $rv1 ); ?>">

                <?php $this->render_eyebrow( $s['eyebrow'], 'fc-ben-eyebrow' ); ?>

                <h2 class="fc-ben-title">
                  <?php echo esc_html( $s['title'] ); ?>
                  <?php if ( ! empty( $s['title_em'] ) ) : ?>
                    <em><?php echo esc_html( $s['title_em'] ); ?></em>
                  <?php endif; ?>
                  <?php echo esc_html( $s['title_suffix'] ); ?>
                </h2>

                <?php $this->render_rule( 'fc-ben-rule' ); ?>

                <?php if ( ! empty( $s['items'] ) ) : ?>
                  <ul class="fc-ben-list" aria-label="Founder's Circle member benefits">
                    <?php foreach ( $s['items'] as $item ) : ?>
                      <li>
                        <?php $this->render_check_icon(); ?>
                        <?php echo esc_html( $item['text'] ); ?>
                      </li>
                    <?php endforeach; ?>
                  </ul>
                <?php endif; ?>

                <?php $this->render_button( $s, 'cta', 'fc-ben-btn' ); ?>

              </div>

            </div>
          </div>
        </section>
        <?php
    }
}
