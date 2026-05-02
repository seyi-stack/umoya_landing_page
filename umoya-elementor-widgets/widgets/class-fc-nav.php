<?php
namespace Umoya_EW\Widgets;

use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * FC Sticky Nav — Section 00: Sticky Navigation Bar.
 *
 * Renders a fixed/sticky nav bar with logo, centre label, and CTA button.
 * All content and styling exposed as Elementor sidebar controls.
 */
class FC_Nav extends \Umoya_EW\Base_Widget {

    public function get_name() {
        return 'fc-nav';
    }

    public function get_title() {
        return 'FC Sticky Nav';
    }

    public function get_icon() {
        return 'eicon-header';
    }

    public function get_style_depends() {
        return array( 'fc-shared', 'fc-section-00' );
    }

    public function get_script_depends() {
        return array( 'fc-section-00-nav' );
    }

    public function get_keywords() {
        return array( 'umoya', 'nav', 'navigation', 'header', 'sticky' );
    }

    /* ─── Controls ─────────────────────────────────────────────── */

    protected function register_controls() {

        /* ── Content Tab: Logo ──────────────────────────────────── */
        $this->start_controls_section( 'section_logo', array(
            'label' => 'Logo',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->add_control( 'logo', array(
            'label'   => 'Logo Image',
            'type'    => Controls_Manager::MEDIA,
            'default' => array(
                'url' => 'https://umoyaafrikatours.co.za/wp-content/uploads/2025/10/Umoya-Afrika-Logomark.svg',
            ),
        ) );

        $this->add_control( 'logo_alt', array(
            'label'   => 'Logo Alt Text',
            'type'    => Controls_Manager::TEXT,
            'default' => 'Umoya Afrika Tours logo',
        ) );

        $this->add_control( 'logo_link', array(
            'label'       => 'Logo Link',
            'type'        => Controls_Manager::URL,
            'default'     => array(
                'url' => '#fc-hero',
            ),
            'placeholder' => '#fc-hero',
        ) );

        $this->end_controls_section();

        /* ── Content Tab: Center Label ──────────────────────────── */
        $this->start_controls_section( 'section_label', array(
            'label' => 'Center Label',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->add_control( 'center_label', array(
            'label'   => 'Label Text',
            'type'    => Controls_Manager::TEXT,
            'default' => "Founder\u{2019}s Circle \u{2014} Limited Membership",
        ) );

        $this->end_controls_section();

        /* ── Content Tab: CTA Button ────────────────────────────── */
        $this->start_controls_section( 'section_cta', array(
            'label' => 'CTA Button',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->register_button_controls( 'cta', 'CTA Button', array(
            'text'     => 'Join the Founder\'s Circle',
            'link'     => '#fc-form-section',
            'bg'       => '#D97E53',
            'bg_hover' => '#C06840',
        ), '.fc-nav-btn' );

        $this->end_controls_section();

        /* ── Style Tab: Section Style ───────────────────────────── */
        $this->start_controls_section( 'section_style_bar', array(
            'label' => 'Bar Style',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_control( 'bar_bg', array(
            'label'     => 'Background Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => 'rgba(245,240,235,0.97)',
            'selectors' => array(
                '{{WRAPPER}} .fc-nav-bar' => 'background-color: {{VALUE}};',
            ),
        ) );

        $this->add_responsive_control( 'bar_height', array(
            'label'      => 'Height',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => array( 'px' ),
            'range'      => array(
                'px' => array(
                    'min' => 40,
                    'max' => 120,
                ),
            ),
            'default'    => array(
                'size' => 64,
                'unit' => 'px',
            ),
            'selectors'  => array(
                '{{WRAPPER}} .fc-nav-bar'   => 'height: {{SIZE}}{{UNIT}};',
                '{{WRAPPER}} .fc-nav-inner' => 'height: {{SIZE}}{{UNIT}};',
            ),
        ) );

        $this->add_control( 'bar_zindex', array(
            'label'     => 'Z-Index',
            'type'      => Controls_Manager::NUMBER,
            'default'   => 9999,
            'selectors' => array(
                '{{WRAPPER}} .fc-nav-bar' => 'z-index: {{VALUE}};',
            ),
        ) );

        $this->end_controls_section();

        /* ── Style Tab: Logo ────────────────────────────────────── */
        $this->start_controls_section( 'section_style_logo', array(
            'label' => 'Logo',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_responsive_control( 'logo_max_height', array(
            'label'      => 'Max Height',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => array( 'px' ),
            'range'      => array(
                'px' => array(
                    'min' => 16,
                    'max' => 80,
                ),
            ),
            'default'    => array(
                'size' => 28,
                'unit' => 'px',
            ),
            'selectors'  => array(
                '{{WRAPPER}} .fc-nav-logo img' => 'height: {{SIZE}}{{UNIT}}; width: auto;',
            ),
        ) );

        $this->end_controls_section();

        /* ── Style Tab: Center Label ────────────────────────────── */
        $this->start_controls_section( 'section_style_label', array(
            'label' => 'Center Label',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'label_typography',
            'label'    => 'Typography',
            'selector' => '{{WRAPPER}} .fc-nav-label',
        ) );

        $this->add_control( 'label_color', array(
            'label'     => 'Text Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => '#4B2E2B',
            'selectors' => array(
                '{{WRAPPER}} .fc-nav-label' => 'color: {{VALUE}};',
            ),
        ) );

        $this->end_controls_section();
    }

    /* ─── Render ───────────────────────────────────────────────── */

    protected function render() {
        $this->render_section_template( 'section-00-nav.php' );
        return;

        $s = $this->get_settings_for_display();

        $is_editor  = \Elementor\Plugin::$instance->editor->is_edit_mode();
        $logo_url   = ! empty( $s['logo']['url'] ) ? $s['logo']['url'] : '';
        $logo_alt   = ! empty( $s['logo_alt'] ) ? $s['logo_alt'] : '';
        $logo_link  = ! empty( $s['logo_link']['url'] ) ? $s['logo_link']['url'] : '#fc-hero';
        $logo_target = ! empty( $s['logo_link']['is_external'] ) ? ' target="_blank"' : '';
        $label_text = ! empty( $s['center_label'] ) ? $s['center_label'] : '';

        // In the editor, always show the bar (skip the hidden-by-default behavior).
        $bar_class = 'fc-nav-bar';
        if ( $is_editor ) {
            $bar_class .= ' fc-nav-visible';
        }
        ?>
        <nav id="fcNavBar" class="<?php echo esc_attr( $bar_class ); ?>" aria-label="Founder's Circle page navigation" data-editor="<?php echo $is_editor ? '1' : '0'; ?>">

            <div class="fc-nav-inner">

                <!-- Logo -->
                <a class="fc-nav-logo" href="<?php echo esc_url( $logo_link ); ?>"<?php echo $logo_target; ?> aria-label="Umoya Afrika Tours — back to top">
                    <?php if ( $logo_url ) : ?>
                        <img
                            src="<?php echo esc_url( $logo_url ); ?>"
                            alt="<?php echo esc_attr( $logo_alt ); ?>"
                        />
                    <?php endif; ?>
                    <span class="fc-nav-logo-text">Umoya</span>
                </a>

                <!-- Center Label -->
                <?php if ( $label_text ) : ?>
                    <span class="fc-nav-label"><?php echo esc_html( $label_text ); ?></span>
                <?php endif; ?>

                <!-- CTA Button -->
                <?php $this->render_button( $s, 'cta', 'fc-nav-btn' ); ?>

            </div>

        </nav>
        <?php
    }
}
