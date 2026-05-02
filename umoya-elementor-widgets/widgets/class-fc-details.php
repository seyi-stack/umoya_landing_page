<?php
namespace Umoya_EW\Widgets;

use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Repeater;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * FC Details — Section 07: Journey Details (Accordion).
 *
 * Single-column centered layout with header, 5-item accordion,
 * and footer CTA. One item open at a time.
 */
class FC_Details extends \Umoya_EW\Base_Widget {

    public function get_name() {
        return 'fc-details';
    }

    public function get_title() {
        return 'FC Journey Details';
    }

    public function get_icon() {
        return 'eicon-accordion';
    }

    public function get_style_depends() {
        return array( 'fc-shared', 'fc-section-07' );
    }

    public function get_script_depends() {
        return array( 'fc-scroll-reveal', 'fc-section-07-accordion' );
    }

    public function get_keywords() {
        return array( 'umoya', 'details', 'accordion', 'faq', 'journey' );
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
            'default' => 'Everything You Need to Know',
        ) );

        $this->add_control( 'title', array(
            'label'   => 'Title (before emphasis)',
            'type'    => Controls_Manager::TEXT,
            'default' => 'Travel',
        ) );

        $this->add_control( 'title_em', array(
            'label'   => 'Title (italic emphasis)',
            'type'    => Controls_Manager::TEXT,
            'default' => 'Essentials',
        ) );

        $this->add_control( 'subtitle', array(
            'label'   => 'Subtitle',
            'type'    => Controls_Manager::TEXTAREA,
            'default' => 'Travel with clarity and confidence, knowing every detail has been carefully considered. From customization to comfort, each element is designed to support a seamless and intentional journey.',
        ) );

        $this->end_controls_section();

        /* ── Accordion ───────────────────────────────────────────── */
        $this->start_controls_section( 'section_accordion', array(
            'label' => 'Accordion Items',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $repeater = new Repeater();

        $repeater->add_control( 'title', array(
            'label'   => 'Title',
            'type'    => Controls_Manager::TEXT,
            'default' => '',
        ) );

        $repeater->add_control( 'subtitle', array(
            'label'   => 'Subtitle',
            'type'    => Controls_Manager::TEXT,
            'default' => '',
        ) );

        $repeater->add_control( 'icon_svg', array(
            'label'       => 'Icon SVG (inner path)',
            'type'        => Controls_Manager::TEXTAREA,
            'description' => 'SVG content inside &lt;svg viewBox="0 0 24 24"&gt;',
            'default'     => '',
            'rows'        => 3,
        ) );

        $repeater->add_control( 'content', array(
            'label'   => 'Content',
            'type'    => Controls_Manager::WYSIWYG,
            'default' => '',
        ) );

        $this->add_control( 'items', array(
            'label'       => 'Accordion Items',
            'type'        => Controls_Manager::REPEATER,
            'fields'      => $repeater->get_controls(),
            'title_field' => '{{{ title }}}',
            'default'     => array(
                array(
                    'title'    => 'Plan with Absolute Confidence',
                    'subtitle' => 'Guaranteed Departures',
                    'icon_svg' => '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
                    'content'  => 'All journeys are <strong>guaranteed to depart with a minimum of five guests</strong>, allowing travelers to plan with full confidence. Once you have secured your spot, you can book your flights and make arrangements knowing your journey will proceed as planned.',
                ),
                array(
                    'title'    => 'Personalize Your Journey, Your Way',
                    'subtitle' => 'Thoughtful personalization',
                    'icon_svg' => '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
                    'content'  => 'While each itinerary is carefully designed, we understand every traveler\'s interests are unique. <strong>Optional add-on experiences</strong> allow guests to explore the places and themes that matter most to them — whether deeper genealogical research, extended time at a particular site, or a private encounter with a cultural custodian.',
                ),
                array(
                    'title'    => 'Peace of Mind for Your Investment',
                    'subtitle' => 'Travel Protection',
                    'icon_svg' => '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
                    'content'  => 'We <strong>strongly recommend purchasing travel insurance</strong> at the time of booking to ensure coverage for unexpected changes. Our team is happy to provide guidance and recommendations for reputable providers so you can focus entirely on your journey, not logistics.',
                ),
                array(
                    'title'    => 'Journeys that reflect Your Schedule',
                    'subtitle' => 'Flexible Journey Length',
                    'icon_svg' => '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
                    'content'  => 'Our signature heritage journey spans <strong>18 days across multiple provinces</strong>. For travelers with limited time, we also offer shorter regional experiences that maintain the same level of cultural depth and thoughtful design. Speak with your dedicated travel expert about the option that best fits your schedule.',
                ),
                array(
                    'title'    => 'Authentic flavors that meet your specific needs',
                    'subtitle' => 'Regional Cuisine & Dietary Care',
                    'icon_svg' => '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>',
                    'content'  => 'Guests experience <strong>regional cuisine prepared by local chefs</strong> throughout the journey. Dietary restrictions are collected in advance so we can coordinate thoughtfully with our culinary partners. We approach all dietary needs with care, transparency, and respect — your wellbeing is part of the journey.',
                ),
            ),
        ) );

        $this->end_controls_section();

        /* ── Footer CTA ──────────────────────────────────────────── */
        $this->start_controls_section( 'section_footer', array(
            'label' => 'Footer CTA',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $this->add_control( 'foot_heading', array(
            'label'   => 'Heading',
            'type'    => Controls_Manager::TEXTAREA,
            'default' => 'Still have questions? We\'d love to speak with you.',
        ) );

        $this->add_control( 'foot_subtitle', array(
            'label'   => 'Subtitle',
            'type'    => Controls_Manager::TEXTAREA,
            'default' => 'Your dedicated Umoya travel expert is ready to walk you through everything and find the journey that feels like home.',
        ) );

        $this->register_button_controls( 'cta', 'CTA Button', array(
            'text'     => 'Speak with a Travel Expert',
            'link'     => '#fc-form-section',
            'bg'       => $t['terra'],
            'bg_hover' => $t['terra_dk'],
            'color'    => $t['white'],
        ), '.fc-det-foot-btn' );

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
            'selectors' => array( '{{WRAPPER}} #fc-details' => 'background-color: {{VALUE}};' ),
        ) );

        $this->register_section_padding( '#fc-details' );

        $this->end_controls_section();

        /* ── Header ──────────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_header', array(
            'label' => 'Header',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'eyebrow_typography',
            'label'    => 'Eyebrow',
            'selector' => '{{WRAPPER}} .fc-det-eyebrow',
        ) );

        $this->add_control( 'eyebrow_color', array(
            'label'     => 'Eyebrow Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-det-eyebrow' => 'color: {{VALUE}};' ),
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'title_typography',
            'label'    => 'Title',
            'selector' => '{{WRAPPER}} .fc-det-title',
        ) );

        $this->add_control( 'title_color', array(
            'label'     => 'Title Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['brown'],
            'selectors' => array( '{{WRAPPER}} .fc-det-title' => 'color: {{VALUE}};' ),
        ) );

        $this->add_control( 'title_em_color', array(
            'label'     => 'Italic Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-det-title em' => 'color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();

        /* ── Accordion ───────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_accordion', array(
            'label' => 'Accordion',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'acc_title_typography',
            'label'    => 'Item Title',
            'selector' => '{{WRAPPER}} .fc-acc-title',
        ) );

        $this->add_control( 'acc_title_color', array(
            'label'     => 'Title Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['brown'],
            'selectors' => array( '{{WRAPPER}} .fc-acc-title' => 'color: {{VALUE}};' ),
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'acc_sub_typography',
            'label'    => 'Item Subtitle',
            'selector' => '{{WRAPPER}} .fc-acc-sub',
        ) );

        $this->add_control( 'acc_sub_color', array(
            'label'     => 'Subtitle Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['text'],
            'selectors' => array( '{{WRAPPER}} .fc-acc-sub' => 'color: {{VALUE}};' ),
        ) );

        $this->add_control( 'acc_icon_bg', array(
            'label'     => 'Icon Background (Open)',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-acc-item.fc-det-open .fc-acc-icon' => 'background-color: {{VALUE}};' ),
        ) );

        $this->add_control( 'acc_icon_bg_closed', array(
            'label'     => 'Icon Background (Closed)',
            'type'      => Controls_Manager::COLOR,
            'default'   => 'rgba(217,126,83,0.08)',
            'selectors' => array( '{{WRAPPER}} .fc-acc-icon' => 'background-color: {{VALUE}};' ),
        ) );

        $this->add_control( 'acc_border_color', array(
            'label'     => 'Item Border Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => 'rgba(75,46,43,0.08)',
            'selectors' => array( '{{WRAPPER}} .fc-acc-item' => 'border-bottom-color: {{VALUE}};' ),
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'acc_content_typography',
            'label'    => 'Content',
            'selector' => '{{WRAPPER}} .fc-acc-content',
        ) );

        $this->add_control( 'acc_content_color', array(
            'label'     => 'Content Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['text'],
            'selectors' => array( '{{WRAPPER}} .fc-acc-content' => 'color: {{VALUE}};' ),
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
            'selectors' => array( '{{WRAPPER}} .fc-det-rule' => 'background-color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();
    }

    /* ─── Render ───────────────────────────────────────────────── */

    protected function render() {
        $this->render_section_template( 'section-07-details.php' );
        return;

        $s = $this->get_settings_for_display();

        $is_editor = \Elementor\Plugin::$instance->editor->is_edit_mode();
        $rv  = $is_editor ? 'fc-det-rev fc-det-in' : 'fc-det-rev';
        $rv1 = $is_editor ? 'fc-det-rev fc-d1 fc-det-in' : 'fc-det-rev fc-d1';

        $items = ! empty( $s['items'] ) ? $s['items'] : array();
        ?>
        <section id="fc-details" aria-label="Journey Details — Frequently Asked Questions">
          <div class="fc-det-wrap">

            <!-- Header -->
            <div class="fc-det-hd <?php echo esc_attr( $rv ); ?>">
              <?php $this->render_eyebrow( $s['eyebrow'], 'fc-det-eyebrow' ); ?>
              <h2 class="fc-det-title">
                <?php echo esc_html( $s['title'] ); ?>
                <?php if ( ! empty( $s['title_em'] ) ) : ?>
                  <em><?php echo esc_html( $s['title_em'] ); ?></em>
                <?php endif; ?>
              </h2>
              <?php $this->render_rule( 'fc-det-rule' ); ?>
              <?php if ( ! empty( $s['subtitle'] ) ) : ?>
                <p class="fc-det-lead"><?php echo esc_html( $s['subtitle'] ); ?></p>
              <?php endif; ?>
            </div>

            <!-- Accordion -->
            <div class="fc-acc <?php echo esc_attr( $rv1 ); ?>" role="list">
              <?php foreach ( $items as $i => $item ) :
                $open    = ( 0 === $i ) ? ' fc-det-open' : '';
                $expanded = ( 0 === $i ) ? 'true' : 'false';
                $btn_id  = 'fc-det-btn-' . $i;
                $body_id = 'fc-det-body-' . $i;
                $icon    = ! empty( $item['icon_svg'] ) ? $item['icon_svg'] : '';
              ?>
                <div class="fc-acc-item<?php echo esc_attr( $open ); ?>" role="listitem">
                  <button
                    class="fc-acc-btn"
                    aria-expanded="<?php echo esc_attr( $expanded ); ?>"
                    aria-controls="<?php echo esc_attr( $body_id ); ?>"
                    id="<?php echo esc_attr( $btn_id ); ?>"
                  >
                    <div class="fc-acc-left">
                      <div class="fc-acc-icon" aria-hidden="true">
                        <?php if ( $icon ) : ?>
                          <svg viewBox="0 0 24 24"><?php echo $icon; ?></svg>
                        <?php endif; ?>
                      </div>
                      <div>
                        <p class="fc-acc-title"><?php echo esc_html( $item['title'] ); ?></p>
                        <p class="fc-acc-sub"><?php echo esc_html( $item['subtitle'] ); ?></p>
                      </div>
                    </div>
                    <div class="fc-acc-chev" aria-hidden="true">
                      <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </button>
                  <div class="fc-acc-body" id="<?php echo esc_attr( $body_id ); ?>" role="region" aria-labelledby="<?php echo esc_attr( $btn_id ); ?>">
                    <div class="fc-acc-content">
                      <?php echo wp_kses_post( $item['content'] ); ?>
                    </div>
                  </div>
                </div>
              <?php endforeach; ?>
            </div>

            <!-- Footer CTA -->
            <div class="fc-det-foot <?php echo esc_attr( $rv ); ?>">
              <?php if ( ! empty( $s['foot_heading'] ) ) : ?>
                <h3><?php echo esc_html( $s['foot_heading'] ); ?></h3>
              <?php endif; ?>
              <?php if ( ! empty( $s['foot_subtitle'] ) ) : ?>
                <p><?php echo esc_html( $s['foot_subtitle'] ); ?></p>
              <?php endif; ?>
              <?php $this->render_button( $s, 'cta', 'fc-det-foot-btn' ); ?>
            </div>

          </div>
        </section>
        <?php
    }
}
