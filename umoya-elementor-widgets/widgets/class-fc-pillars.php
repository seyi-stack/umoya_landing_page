<?php
namespace Umoya_EW\Widgets;

use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Repeater;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * FC Pillars — Section 06b: Brand Pillars.
 *
 * Full-bleed background image with four text columns anchored to bottom.
 * Mobile: horizontal swipe carousel.
 */
class FC_Pillars extends \Umoya_EW\Base_Widget {

    public function get_name() {
        return 'fc-pillars';
    }

    public function get_title() {
        return 'FC Brand Pillars';
    }

    public function get_icon() {
        return 'eicon-columns';
    }

    public function get_style_depends() {
        return array( 'fc-shared', 'fc-section-06b' );
    }

    public function get_script_depends() {
        return array( 'fc-scroll-reveal', 'fc-section-06b-pillars' );
    }

    public function get_keywords() {
        return array( 'umoya', 'pillars', 'brand', 'values', 'columns' );
    }

    /* ─── Controls ─────────────────────────────────────────────── */

    protected function register_controls() {

        $t = $this->get_design_tokens();

        /* ══ CONTENT TAB ═══════════════════════════════════════════ */

        /* ── Background ──────────────────────────────────────────── */
        $this->start_controls_section( 'section_bg', array(
            'label' => 'Background Image',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->add_control( 'bg_image', array(
            'label'   => 'Image',
            'type'    => Controls_Manager::MEDIA,
            'default' => array(
                'url' => 'https://umoyaafrikatours.co.za/wp-content/uploads/2026/optimized/compressed_victor zaviano itffa-160.jpg',
            ),
        ) );

        $this->add_control( 'bg_alt', array(
            'label'   => 'Alt Text',
            'type'    => Controls_Manager::TEXT,
            'default' => 'South African landscape — Umoya brand pillars',
        ) );

        $this->end_controls_section();

        /* ── Pillars ─────────────────────────────────────────────── */
        $this->start_controls_section( 'section_pillars', array(
            'label' => 'Pillars',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $repeater = new Repeater();

        $repeater->add_control( 'title', array(
            'label'   => 'Title',
            'type'    => Controls_Manager::TEXT,
            'default' => '',
        ) );

        $repeater->add_control( 'body', array(
            'label'   => 'Body',
            'type'    => Controls_Manager::TEXTAREA,
            'default' => '',
        ) );

        $repeater->add_control( 'accent', array(
            'label'       => 'Accent (top border for first column)',
            'type'        => Controls_Manager::SWITCHER,
            'default'     => '',
            'label_on'    => 'Yes',
            'label_off'   => 'No',
        ) );

        $this->add_control( 'pillars', array(
            'label'       => 'Pillars',
            'type'        => Controls_Manager::REPEATER,
            'fields'      => $repeater->get_controls(),
            'title_field' => '{{{ title }}}',
            'default'     => array(
                array(
                    'title'  => 'Historically Grounded',
                    'body'   => 'Every journey is built on historical research and cultural expertise. We work with historians, cultural custodians, and community leaders to create experiences rooted in lived knowledge — not tourist narratives.',
                    'accent' => 'yes',
                ),
                array(
                    'title' => 'Diaspora-Centered',
                    'body'  => 'Our journeys are designed specifically for the global African diaspora. We understand the emotional significance of return, and every moment is crafted with that awareness.',
                ),
                array(
                    'title' => 'Intimate & Intentional',
                    'body'  => 'Small groups. Dedicated experts. Boutique stays. Every element is intentional — from the guides we select to the communities we visit. Nothing is mass-market.',
                ),
                array(
                    'title' => 'Transformative by Design',
                    'body'  => 'These are not vacations. They are encounters with identity, heritage, and belonging — designed to leave travelers profoundly changed.',
                ),
            ),
        ) );

        $this->end_controls_section();

        /* ══ STYLE TAB ═════════════════════════════════════════════ */

        $this->start_controls_section( 'section_style', array(
            'label' => 'Pillars',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_control( 'min_height', array(
            'label'      => 'Min Height',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => array( 'vh', 'px' ),
            'range'      => array(
                'vh' => array( 'min' => 30, 'max' => 100 ),
                'px' => array( 'min' => 300, 'max' => 900 ),
            ),
            'default'    => array( 'size' => 62, 'unit' => 'vh' ),
            'selectors'  => array( '{{WRAPPER}} #fc-pillars' => 'min-height: {{SIZE}}{{UNIT}};' ),
        ) );

        $this->add_control( 'accent_border_color', array(
            'label'     => 'Accent Border Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-pil-col.fc-pil-accent' => 'border-top-color: {{VALUE}};' ),
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'pil_title_typography',
            'label'    => 'Title',
            'selector' => '{{WRAPPER}} .fc-pil-title',
        ) );

        $this->add_control( 'pil_title_color', array(
            'label'     => 'Title Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['white'],
            'selectors' => array( '{{WRAPPER}} .fc-pil-title' => 'color: {{VALUE}};' ),
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'pil_body_typography',
            'label'    => 'Body',
            'selector' => '{{WRAPPER}} .fc-pil-body',
        ) );

        $this->add_control( 'pil_body_color', array(
            'label'     => 'Body Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => 'rgba(245,240,235,0.78)',
            'selectors' => array( '{{WRAPPER}} .fc-pil-body' => 'color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();
    }

    /* ─── Render ───────────────────────────────────────────────── */

    protected function render() {
        $this->render_section_template( 'section-06b-pillars.php' );
        return;

        $s = $this->get_settings_for_display();

        $is_editor = \Elementor\Plugin::$instance->editor->is_edit_mode();
        $pillars   = ! empty( $s['pillars'] ) ? $s['pillars'] : array();
        $bg_url    = ! empty( $s['bg_image']['url'] ) ? $s['bg_image']['url'] : '';
        $bg_alt    = ! empty( $s['bg_alt'] ) ? $s['bg_alt'] : '';
        ?>
        <section id="fc-pillars" aria-label="Umoya Afrika Tours — Brand Pillars">

          <div class="fc-pil-bg" aria-hidden="true">
            <?php if ( $bg_url ) : ?>
              <img src="<?php echo esc_url( $bg_url ); ?>" alt="<?php echo esc_attr( $bg_alt ); ?>" loading="lazy" />
            <?php endif; ?>
          </div>

          <div class="fc-pil-content">
            <div class="fc-pil-grid">
              <?php foreach ( $pillars as $i => $pillar ) :
                $accent = ! empty( $pillar['accent'] ) && 'yes' === $pillar['accent'] ? ' fc-pil-accent' : '';
                $delay  = $i > 0 ? ' d' . $i : '';
                $rv_cls = $is_editor ? 'fc-pil-rv fc-pil-on' . $delay : 'fc-pil-rv' . $delay;
              ?>
                <div class="fc-pil-col<?php echo esc_attr( $accent ); ?> <?php echo esc_attr( $rv_cls ); ?>">
                  <p class="fc-pil-title"><?php echo esc_html( $pillar['title'] ); ?></p>
                  <p class="fc-pil-body"><?php echo esc_html( $pillar['body'] ); ?></p>
                </div>
              <?php endforeach; ?>
            </div>
          </div>

        </section>
        <?php
    }
}
