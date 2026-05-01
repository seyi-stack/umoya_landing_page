<?php
namespace Umoya_EW\Widgets;

use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Repeater;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * FC Province Cards — Section 05B: 5 flip cards with front image
 * and back content. Full sidebar controls for all visual properties.
 */
class FC_Province_Cards extends \Umoya_EW\Base_Widget {

    public function get_name() {
        return 'fc-province-cards';
    }

    public function get_title() {
        return 'FC Province Cards';
    }

    public function get_icon() {
        return 'eicon-gallery-grid';
    }

    public function get_style_depends() {
        return array( 'fc-shared', 'fc-section-05' );
    }

    public function get_script_depends() {
        return array( 'fc-scroll-reveal', 'fc-section-05-cards' );
    }

    public function get_keywords() {
        return array( 'umoya', 'province', 'cards', 'flip', 'journey' );
    }

    /* ─── Controls ─────────────────────────────────────────────── */

    protected function register_controls() {

        $t = $this->get_design_tokens();

        /* ══ CONTENT TAB ═══════════════════════════════════════════ */

        $this->start_controls_section( 'section_cards', array(
            'label' => 'Province Cards',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ) );

        $repeater = new Repeater();

        $repeater->add_control( 'heading_front', array(
            'label' => 'FRONT FACE',
            'type'  => Controls_Manager::HEADING,
        ) );

        $repeater->add_control( 'image', array(
            'label'   => 'Image',
            'type'    => Controls_Manager::MEDIA,
            'default' => array( 'url' => '' ),
        ) );

        $repeater->add_control( 'image_alt', array(
            'label'   => 'Image Alt Text',
            'type'    => Controls_Manager::TEXT,
            'default' => '',
        ) );

        $repeater->add_control( 'region_label', array(
            'label'   => 'Region Label',
            'type'    => Controls_Manager::TEXT,
            'default' => '',
        ) );

        $repeater->add_control( 'province_name', array(
            'label'       => 'Province Name',
            'type'        => Controls_Manager::TEXTAREA,
            'rows'        => 2,
            'default'     => '',
            'description' => 'Use &lt;br /&gt; for line breaks.',
        ) );

        $repeater->add_control( 'heading_back', array(
            'label'     => 'BACK FACE',
            'type'      => Controls_Manager::HEADING,
            'separator' => 'before',
        ) );

        $repeater->add_control( 'back_eyebrow', array(
            'label'   => 'Back Eyebrow (e.g. "Stop 1")',
            'type'    => Controls_Manager::TEXT,
            'default' => '',
        ) );

        $repeater->add_control( 'back_title', array(
            'label'       => 'Back Title',
            'type'        => Controls_Manager::TEXTAREA,
            'rows'        => 2,
            'default'     => '',
            'description' => 'Use &lt;br /&gt; for line breaks.',
        ) );

        $repeater->add_control( 'back_body', array(
            'label'   => 'Back Description',
            'type'    => Controls_Manager::TEXTAREA,
            'rows'    => 4,
            'default' => '',
        ) );

        $this->add_control( 'cards', array(
            'label'       => 'Cards',
            'type'        => Controls_Manager::REPEATER,
            'fields'      => $repeater->get_controls(),
            'title_field' => '{{{ region_label }}}',
            'default'     => array(
                array(
                    'image'         => array( 'url' => 'https://umoyaafrikatours.co.za/wp-content/uploads/2025/12/IMG_6762-scaled.webp' ),
                    'image_alt'     => 'Gauteng and Limpopo — Sacred Origins and Living Heritage',
                    'region_label'  => 'Gauteng & Limpopo',
                    'province_name' => 'Sacred Origins<br />&amp; Living Heritage',
                    'back_eyebrow'  => 'Stop 1',
                    'back_title'    => 'Sacred Origins<br />&amp; Living Heritage',
                    'back_body'     => 'Walk the cradle of humankind, visit living cultural villages, and connect with historians who carry the ancient stories of this land in their voices.',
                ),
                array(
                    'image'         => array( 'url' => 'https://umoyaafrikatours.co.za/wp-content/uploads/2025/12/IMG_7057-scaled.webp' ),
                    'image_alt'     => 'Mpumalanga — Wonders of Nature',
                    'region_label'  => 'Mpumalanga',
                    'province_name' => 'Wonders of<br />Nature',
                    'back_eyebrow'  => 'Stop 2',
                    'back_title'    => 'Wonders of<br />Nature',
                    'back_body'     => 'Stand at the edge of the Blyde River Canyon, witness the grandeur of God\'s Window, and feel the raw pulse of the African wilderness around you.',
                ),
                array(
                    'image'         => array( 'url' => 'https://umoyaafrikatours.co.za/wp-content/uploads/2025/12/IMG_9149.webp' ),
                    'image_alt'     => 'KwaZulu-Natal — Be Welcomed and Embraced by Royalty',
                    'region_label'  => 'KwaZulu-Natal',
                    'province_name' => 'Be Welcomed<br />&amp; Embraced by Royalty',
                    'back_eyebrow'  => 'Stop 3',
                    'back_title'    => 'Be Welcomed<br />&amp; Embraced by Royalty',
                    'back_body'     => 'Experience the warmth of Zulu royal traditions, share in sacred ceremonies, and be received not as a visitor — but as kin returning home.',
                ),
                array(
                    'image'         => array( 'url' => 'https://umoyaafrikatours.co.za/wp-content/uploads/2025/12/IMG_7630-scaled.webp' ),
                    'image_alt'     => 'Western Cape — Wine, Oceans and Cultural Elegance',
                    'region_label'  => 'Western Cape',
                    'province_name' => 'Wine, Oceans<br />&amp; Culture',
                    'back_eyebrow'  => 'Stop 4',
                    'back_title'    => 'Wine, Oceans<br />&amp; Culture',
                    'back_body'     => 'Journey through the Cape Winelands, taste cuisine shaped by centuries of culture, and let the meeting of two oceans mark the close of a transformative journey.',
                ),
                array(
                    'image'         => array( 'url' => 'https://umoyaafrikatours.co.za/wp-content/uploads/2025/10/umoya_image-19.jpg' ),
                    'image_alt'     => 'Luxury Journeys of Transformation',
                    'region_label'  => 'All Provinces',
                    'province_name' => 'Luxury Journeys<br />of Transformation',
                    'back_eyebrow'  => '18 Days',
                    'back_title'    => 'Luxury Journeys<br />of Transformation',
                    'back_body'     => 'Across five provinces, 18 days, and a lifetime of memories — this journey is designed to return something to you that travel alone cannot: a true sense of belonging.',
                ),
            ),
        ) );

        $this->end_controls_section();

        /* ══ STYLE TAB ═════════════════════════════════════════════ */

        /* ── Front Face ──────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_front', array(
            'label' => 'Front Face',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_control( 'card_border_radius', array(
            'label'      => 'Card Border Radius',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => array( 'px' ),
            'range'      => array( 'px' => array( 'min' => 0, 'max' => 20 ) ),
            'default'    => array( 'size' => 8, 'unit' => 'px' ),
            'selectors'  => array(
                '{{WRAPPER}} .fc-prov-card' => 'border-radius: {{SIZE}}{{UNIT}};',
            ),
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'region_typography',
            'label'    => 'Region Label',
            'selector' => '{{WRAPPER}} .fc-prov-reg',
        ) );

        $this->add_control( 'region_color', array(
            'label'     => 'Region Label Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array( '{{WRAPPER}} .fc-prov-reg' => 'color: {{VALUE}};' ),
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'province_typography',
            'label'    => 'Province Name',
            'selector' => '{{WRAPPER}} .fc-prov-nm',
        ) );

        $this->add_control( 'province_color', array(
            'label'     => 'Province Name Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['cream'],
            'selectors' => array( '{{WRAPPER}} .fc-prov-nm' => 'color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();

        /* ── Back Face ───────────────────────────────────────────── */
        $this->start_controls_section( 'section_style_back', array(
            'label' => 'Back Face',
            'tab'   => Controls_Manager::TAB_STYLE,
        ) );

        $this->add_control( 'back_bg_color', array(
            'label'     => 'Background',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['brown'],
            'selectors' => array( '{{WRAPPER}} .fc-prov-back' => 'background-color: {{VALUE}};' ),
        ) );

        $this->add_control( 'back_accent_color', array(
            'label'     => 'Accent Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['terra'],
            'selectors' => array(
                '{{WRAPPER}} .fc-prov-back::before'  => 'background-color: {{VALUE}};',
                '{{WRAPPER}} .fc-prov-back-eye'      => 'color: {{VALUE}};',
                '{{WRAPPER}} .fc-prov-back-rule'     => 'background-color: {{VALUE}};',
            ),
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'back_title_typography',
            'label'    => 'Title',
            'selector' => '{{WRAPPER}} .fc-prov-back-ttl',
        ) );

        $this->add_control( 'back_title_color', array(
            'label'     => 'Title Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => $t['cream'],
            'selectors' => array( '{{WRAPPER}} .fc-prov-back-ttl' => 'color: {{VALUE}};' ),
        ) );

        $this->add_group_control( Group_Control_Typography::get_type(), array(
            'name'     => 'back_body_typography',
            'label'    => 'Description',
            'selector' => '{{WRAPPER}} .fc-prov-back-body',
        ) );

        $this->add_control( 'back_body_color', array(
            'label'     => 'Description Color',
            'type'      => Controls_Manager::COLOR,
            'default'   => 'rgba(245,240,235,0.78)',
            'selectors' => array( '{{WRAPPER}} .fc-prov-back-body' => 'color: {{VALUE}};' ),
        ) );

        $this->end_controls_section();
    }

    /* ─── Render ───────────────────────────────────────────────── */

    protected function render() {
        $s  = $this->get_settings_for_display();
        $is_editor = \Elementor\Plugin::$instance->editor->is_edit_mode();
        $rv = $is_editor ? 'fc-prov-grid fc-jrn-rv d1 on' : 'fc-prov-grid fc-jrn-rv d1';

        if ( empty( $s['cards'] ) ) {
            return;
        }
        ?>
        <div class="<?php echo esc_attr( $rv ); ?>" role="list" aria-label="Five provinces of the signature journey">
          <?php foreach ( $s['cards'] as $card ) :
              $img_url = ! empty( $card['image']['url'] ) ? $card['image']['url'] : '';
              $img_alt = ! empty( $card['image_alt'] ) ? $card['image_alt'] : '';
              $aria    = ! empty( $card['region_label'] ) ? $card['region_label'] . ' — tap to read more' : '';
          ?>
            <article class="fc-prov-card" role="listitem" tabindex="0"
                     aria-label="<?php echo esc_attr( $aria ); ?>">
                <div class="fc-prov-front">
                  <?php if ( $img_url ) : ?>
                    <img src="<?php echo esc_url( $img_url ); ?>"
                         alt="<?php echo esc_attr( $img_alt ); ?>" loading="lazy" />
                  <?php endif; ?>
                  <div class="fc-prov-ov" aria-hidden="true"></div>
                  <div class="fc-prov-info">
                    <p class="fc-prov-reg"><?php echo esc_html( $card['region_label'] ); ?></p>
                    <p class="fc-prov-nm"><?php echo wp_kses_post( $card['province_name'] ); ?></p>
                  </div>
                </div>
                <div class="fc-prov-back" aria-hidden="true">
                  <span class="fc-prov-back-eye"><?php echo esc_html( $card['back_eyebrow'] ); ?></span>
                  <h4 class="fc-prov-back-ttl"><?php echo wp_kses_post( $card['back_title'] ); ?></h4>
                  <span class="fc-prov-back-rule"></span>
                  <p class="fc-prov-back-body"><?php echo esc_html( $card['back_body'] ); ?></p>
                </div>
            </article>
          <?php endforeach; ?>
        </div>
        <?php
    }
}
