<?php
namespace Umoya_EW\Widgets;

use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Repeater;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * FC Journey Header — Section 05A: Eyebrow, title, and stats row.
 * Full sidebar controls for all content and visual properties.
 */
class FC_Journey_Header extends \Umoya_EW\Base_Widget {

    public function get_name() {
        return 'fc-journey-header';
    }

    public function get_title() {
        return 'FC Journey Header';
    }

    public function get_icon() {
        return 'eicon-t-letter-bold';
    }

    public function get_style_depends() {
        return array( 'fc-shared', 'fc-section-05' );
    }

    public function get_script_depends() {
        return array( 'fc-scroll-reveal' );
    }

    public function get_keywords() {
        return array( 'umoya', 'journey', 'header', 'stats' );
    }

    /* ─── Controls ─────────────────────────────────────────────── */

    protected function register_controls() {

        $t = $this->get_design_tokens();

        /* ══ CONTENT TAB ═══════════════════════════════════════════ */

        $this->start_controls_section( 'section_header', array(
            'label' => 'Header',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->add_control( 'eyebrow', array(
            'label'   => 'Eyebrow',
            'type'    => Controls_Manager::TEXT,
            'default' => 'Our Inaugural Journey',
        ) );

        $this->add_control( 'title', array(
            'label'   => 'Title (before emphasis)',
            'type'    => Controls_Manager::TEXT,
            'default' => 'Your Journey',
        ) );

        $this->add_control( 'title_em', array(
            'label'   => 'Title (italic emphasis)',
            'type'    => Controls_Manager::TEXT,
            'default' => 'Begins Here',
        ) );

        $this->end_controls_section();

        /* ── Stats ───────────────────────────────────────────────── */
        $this->start_controls_section( 'section_stats', array(
            'label' => 'Stats',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $repeater = new Repeater();

        $repeater->add_control( 'value', array(
            'label'   => 'Number',
            'type'    => Controls_Manager::TEXT,
            'default' => '',
        ) );

        $repeater->add_control( 'label', array(
            'label'   => 'Label',
            'type'    => Controls_Manager::TEXT,
            'default' => '',
        ) );

        $this->add_control( 'stats', array(
            'label'       => 'Stats',
            'type'        => Controls_Manager::REPEATER,
            'fields'      => $repeater->get_controls(),
            'title_field' => '{{{ value }}} {{{ label }}}',
            'default'     => array(
                array( 'value' => '18', 'label' => 'Days' ),
                array( 'value' => '5',  'label' => 'Provinces' ),
                array( 'value' => '20', 'label' => 'Guests Max' ),
            ),
        ) );

        $this->end_controls_section();

        /* ══ STYLE TAB ═════════════════════════════════════════════ */

        /* ── Eyebrow ─────────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_eyebrow', array(
            'label' => 'Eyebrow',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'eyebrow_typography',
            'selector' => '{{WRAPPER}} .fc-jrn-eye',
        ) );

        $this->add_control( 'eyebrow_color', array(
            'label'     => 'Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-jrn-eye' => 'color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();

        /* ── Title ───────────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_title', array(
            'label' => 'Title',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'title_typography',
            'selector' => '{{WRAPPER}} .fc-jrn-ttl',
        ) );

        $this->add_control( 'title_color', array(
            'label'     => 'Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['brown'],
            'selectors' => array( '{{WRAPPER}} .fc-jrn-ttl' => 'color: {{VALUE}};' ),
        ) );

        $this->add_control( 'title_em_color', array(
            'label'     => 'Italic Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-jrn-ttl em' => 'color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();

        /* ── Stats ───────────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_stats', array(
            'label' => 'Stats',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'stat_number_typography',
            'label'    => 'Number',
            'selector' => '{{WRAPPER}} .fc-jrn-stat-n',
        ) );

        $this->add_control( 'stat_number_color', array(
            'label'     => 'Number Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-jrn-stat-n' => 'color: {{VALUE}};' ),
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'stat_label_typography',
            'label'    => 'Label',
            'selector' => '{{WRAPPER}} .fc-jrn-stat-l',
        ) );

        $this->add_control( 'stat_label_color', array(
            'label'     => 'Label Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['text'],
            'selectors' => array( '{{WRAPPER}} .fc-jrn-stat-l' => 'color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();
    }

    /* ─── Render ───────────────────────────────────────────────── */

    protected function render() {
        $s = $this->get_settings_for_display();
        $is_editor = \Elementor\Plugin::$instance->editor->is_edit_mode();
        $rv = $is_editor ? 'fc-jrn-rv on' : 'fc-jrn-rv';
        ?>
        <div class="fc-jrn-hd <?php echo esc_attr( $rv ); ?>">
          <div>
            <?php $this->render_eyebrow( $s['eyebrow'], 'fc-jrn-eye' ); ?>
            <h2 class="fc-jrn-ttl">
              <?php echo esc_html( $s['title'] ); ?>
              <?php if ( ! empty( $s['title_em'] ) ) : ?>
                <em><?php echo esc_html( $s['title_em'] ); ?></em>
              <?php endif; ?>
            </h2>
          </div>
          <?php if ( ! empty( $s['stats'] ) ) : ?>
            <div class="fc-jrn-stats" role="list">
              <?php foreach ( $s['stats'] as $stat ) : ?>
                <div class="fc-jrn-stat" role="listitem">
                  <div class="fc-jrn-stat-n"><?php echo esc_html( $stat['value'] ); ?></div>
                  <div class="fc-jrn-stat-l"><?php echo esc_html( $stat['label'] ); ?></div>
                </div>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>
        </div>
        <?php
    }
}
