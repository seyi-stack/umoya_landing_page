<?php
namespace Umoya_EW;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

abstract class Base_Widget extends \Elementor\Widget_Base {

    protected function section_key() {
        return '';
    }

    protected function section_config() {
        return Section_Registry::get( $this->section_key() );
    }

    public function get_name() {
        $config = $this->section_config();

        return ! empty( $config['name'] ) ? $config['name'] : 'umoya-section';
    }

    public function get_title() {
        $config = $this->section_config();

        return ! empty( $config['title'] ) ? $config['title'] : 'Umoya Section';
    }

    public function get_categories() {
        $config = $this->section_config();

        return array( ! empty( $config['category'] ) ? $config['category'] : 'umoya-fc' );
    }

    public function get_icon() {
        $config = $this->section_config();

        return ! empty( $config['icon'] ) ? $config['icon'] : 'eicon-globe';
    }

    public function get_keywords() {
        $config = $this->section_config();

        return ! empty( $config['keywords'] ) && is_array( $config['keywords'] )
            ? $config['keywords']
            : array( 'umoya' );
    }

    public function get_style_depends() {
        $config = $this->section_config();
        $styles = array( 'fc-shared' );

        if ( ! empty( $config['style_handle'] ) ) {
            $styles[] = $config['style_handle'];
        }

        return array_values( array_unique( array_filter( $styles ) ) );
    }

    public function get_script_depends() {
        $config = $this->section_config();

        return ! empty( $config['script_handle'] ) ? array( $config['script_handle'] ) : array();
    }

    protected function register_controls() {
        $config = $this->section_config();
        $fields = ! empty( $config['fields'] ) && is_array( $config['fields'] ) ? $config['fields'] : array();

        $this->register_field_group(
            'uew_text_fields',
            'Text Fields',
            $this->filter_fields( $fields, array( 'text', 'textarea' ) )
        );

        $this->register_field_group(
            'uew_links_media',
            'Links & Media',
            $this->filter_fields( $fields, array( 'url', 'media' ) )
        );

        $this->register_field_group(
            'uew_labels_attrs',
            'Labels & Attributes',
            $this->filter_fields( $fields, array( 'attribute' ) )
        );

        $this->register_field_group(
            'uew_form_integrations',
            'Form Integrations',
            $this->filter_fields( $fields, array( 'integration' ) )
        );

        $this->register_style_controls( $config );
        $this->register_advanced_controls( $config );
    }

    protected function render() {
        $this->render_editable_section( $this->section_key() );
    }

    protected function render_template( $template ) {
        $path = UMOYA_EW_PATH . 'templates/' . ltrim( $template, '/\\' );

        if ( file_exists( $path ) ) {
            include $path;
        }
    }

    protected function render_section_template( $template ) {
        $this->render_template( $template );
    }

    public function render_editable_section( $section_key ) {
        $config = Section_Registry::get( $section_key );
        if ( empty( $config ) ) {
            return;
        }

        $settings = $this->get_settings_for_display();

        if ( ! empty( $settings['uew_html_override'] ) ) {
            echo $this->clean_raw_html( $settings['uew_html_override'] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
            $this->print_custom_css( $settings );
            return;
        }

        $template = ! empty( $config['template'] ) ? UMOYA_EW_PATH . ltrim( $config['template'], '/\\' ) : '';
        if ( ! $template || ! file_exists( $template ) ) {
            return;
        }

        $html = file_get_contents( $template );
        $html = $this->replace_placeholders( $html, $config, $settings );
        $html = $this->apply_custom_replacements( $html, $settings );
        $html = $this->add_extra_class( $html, isset( $settings['uew_extra_class'] ) ? $settings['uew_extra_class'] : '' );

        echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
        $this->print_custom_css( $settings );
    }

    private function filter_fields( $fields, $kinds ) {
        return array_values(
            array_filter(
                $fields,
                function ( $field ) use ( $kinds ) {
                    return ! empty( $field['kind'] ) && in_array( $field['kind'], $kinds, true );
                }
            )
        );
    }

    private function register_field_group( $section_id, $label, $fields ) {
        if ( empty( $fields ) ) {
            return;
        }

        $this->start_controls_section(
            $section_id,
            array(
                'label' => $label,
                'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
            )
        );

        foreach ( $fields as $field ) {
            $this->register_field_control( $field );
        }

        $this->end_controls_section();
    }

    private function register_field_control( $field ) {
        if ( empty( $field['id'] ) ) {
            return;
        }

        $kind    = ! empty( $field['kind'] ) ? $field['kind'] : 'text';
        $default = isset( $field['default'] ) ? $field['default'] : '';
        $label   = ! empty( $field['label'] ) ? $field['label'] : $field['id'];

        if ( 'media' === $kind ) {
            $this->add_control(
                $field['id'],
                array(
                    'label'       => $label,
                    'type'        => \Elementor\Controls_Manager::MEDIA,
                    'default'     => array( 'url' => $default ),
                    'dynamic'     => array( 'active' => true ),
                    'label_block' => true,
                )
            );
            return;
        }

        if ( 'url' === $kind ) {
            $this->add_control(
                $field['id'],
                array(
                    'label'       => $label,
                    'type'        => \Elementor\Controls_Manager::URL,
                    'default'     => array( 'url' => $default ),
                    'dynamic'     => array( 'active' => true ),
                    'label_block' => true,
                )
            );
            return;
        }

        $control_type = ( 'textarea' === $kind || 'integration' === $kind || strlen( (string) $default ) > 84 )
            ? \Elementor\Controls_Manager::TEXTAREA
            : \Elementor\Controls_Manager::TEXT;

        $this->add_control(
            $field['id'],
            array(
                'label'       => $label,
                'type'        => $control_type,
                'default'     => $default,
                'dynamic'     => array( 'active' => true ),
                'label_block' => true,
                'rows'        => 'textarea' === $kind || 'integration' === $kind ? 4 : 2,
            )
        );
    }

    private function register_style_controls( $config ) {
        $root = $this->root_selector( $config );
        if ( ! $root ) {
            return;
        }

        $this->start_controls_section(
            'uew_layout_style',
            array(
                'label' => 'Layout & Style',
                'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
            )
        );

        $this->add_responsive_control(
            'uew_section_min_height',
            array(
                'label'      => 'Minimum Height',
                'type'       => \Elementor\Controls_Manager::SLIDER,
                'size_units' => array( 'px', 'vh', 'svh' ),
                'range'      => array(
                    'px'  => array( 'min' => 0, 'max' => 1200 ),
                    'vh'  => array( 'min' => 0, 'max' => 100 ),
                    'svh' => array( 'min' => 0, 'max' => 100 ),
                ),
                'selectors'  => array(
                    '{{WRAPPER}} ' . $root => 'min-height: {{SIZE}}{{UNIT}};',
                ),
            )
        );

        $this->add_responsive_control(
            'uew_section_padding',
            array(
                'label'      => 'Section Padding',
                'type'       => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => array( 'px', 'em', 'rem', '%', 'vw' ),
                'selectors'  => array(
                    '{{WRAPPER}} ' . $root => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ),
            )
        );

        $this->add_responsive_control(
            'uew_section_margin',
            array(
                'label'      => 'Section Margin',
                'type'       => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => array( 'px', 'em', 'rem', '%', 'vw' ),
                'selectors'  => array(
                    '{{WRAPPER}} ' . $root => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ),
            )
        );

        $this->add_group_control(
            \Elementor\Group_Control_Background::get_type(),
            array(
                'name'     => 'uew_section_background',
                'label'    => 'Background',
                'selector' => '{{WRAPPER}} ' . $root,
            )
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            array(
                'name'     => 'uew_heading_typography',
                'label'    => 'Heading Typography',
                'selector' => '{{WRAPPER}} ' . $root . ' h1, {{WRAPPER}} ' . $root . ' h2, {{WRAPPER}} ' . $root . ' h3, {{WRAPPER}} ' . $root . ' h4',
            )
        );

        $this->add_control(
            'uew_heading_color',
            array(
                'label'     => 'Heading Color',
                'type'      => \Elementor\Controls_Manager::COLOR,
                'selectors' => array(
                    '{{WRAPPER}} ' . $root . ' h1, {{WRAPPER}} ' . $root . ' h2, {{WRAPPER}} ' . $root . ' h3, {{WRAPPER}} ' . $root . ' h4' => 'color: {{VALUE}};',
                ),
            )
        );

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            array(
                'name'     => 'uew_body_typography',
                'label'    => 'Body Typography',
                'selector' => '{{WRAPPER}} ' . $root . ' p, {{WRAPPER}} ' . $root . ' li, {{WRAPPER}} ' . $root . ' label, {{WRAPPER}} ' . $root . ' input, {{WRAPPER}} ' . $root . ' select, {{WRAPPER}} ' . $root . ' textarea',
            )
        );

        $this->add_control(
            'uew_body_color',
            array(
                'label'     => 'Body Color',
                'type'      => \Elementor\Controls_Manager::COLOR,
                'selectors' => array(
                    '{{WRAPPER}} ' . $root . ' p, {{WRAPPER}} ' . $root . ' li, {{WRAPPER}} ' . $root . ' label, {{WRAPPER}} ' . $root . ' input, {{WRAPPER}} ' . $root . ' select, {{WRAPPER}} ' . $root . ' textarea' => 'color: {{VALUE}};',
                ),
            )
        );

        $button_selector = '{{WRAPPER}} ' . $root . ' a[class*="btn"], {{WRAPPER}} ' . $root . ' button[class*="btn"], {{WRAPPER}} ' . $root . ' a[class*="cta"], {{WRAPPER}} ' . $root . ' button[class*="cta"], {{WRAPPER}} ' . $root . ' .fc-nav-cta, {{WRAPPER}} ' . $root . ' .umoya-nav-cta';

        $this->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            array(
                'name'     => 'uew_button_typography',
                'label'    => 'Button Typography',
                'selector' => $button_selector,
            )
        );

        $this->add_control(
            'uew_button_text_color',
            array(
                'label'     => 'Button Text Color',
                'type'      => \Elementor\Controls_Manager::COLOR,
                'selectors' => array(
                    $button_selector => 'color: {{VALUE}};',
                ),
            )
        );

        $this->add_control(
            'uew_button_background',
            array(
                'label'     => 'Button Background',
                'type'      => \Elementor\Controls_Manager::COLOR,
                'selectors' => array(
                    $button_selector => 'background-color: {{VALUE}}; border-color: {{VALUE}};',
                ),
            )
        );

        $this->end_controls_section();

        $this->register_design_token_controls( $config, $root );
    }

    private function register_design_token_controls( $config, $root ) {
        if ( empty( $config['css_vars'] ) || ! is_array( $config['css_vars'] ) ) {
            return;
        }

        $this->start_controls_section(
            'uew_design_tokens',
            array(
                'label' => 'Design Tokens',
                'tab'   => \Elementor\Controls_Manager::TAB_STYLE,
            )
        );

        foreach ( $config['css_vars'] as $var ) {
            if ( empty( $var['name'] ) ) {
                continue;
            }

            $name = sanitize_key( str_replace( '-', '_', $var['name'] ) );
            $this->add_control(
                'uew_var_' . $name,
                array(
                    'label'       => ucwords( str_replace( '-', ' ', $var['name'] ) ),
                    'type'        => \Elementor\Controls_Manager::COLOR,
                    'placeholder' => ! empty( $var['default'] ) ? $var['default'] : '',
                    'selectors'   => array(
                        '{{WRAPPER}} ' . $root => '--' . $var['name'] . ': {{VALUE}};',
                    ),
                )
            );
        }

        $this->end_controls_section();
    }

    private function register_advanced_controls( $config ) {
        $root = $this->root_selector( $config );

        $this->start_controls_section(
            'uew_advanced_section',
            array(
                'label' => 'Advanced Section Editing',
                'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
            )
        );

        $this->add_control(
            'uew_extra_class',
            array(
                'label'       => 'Additional CSS Class',
                'type'        => \Elementor\Controls_Manager::TEXT,
                'label_block' => true,
            )
        );

        $repeater = new \Elementor\Repeater();
        $repeater->add_control(
            'search',
            array(
                'label'       => 'Find',
                'type'        => \Elementor\Controls_Manager::TEXTAREA,
                'rows'        => 3,
                'label_block' => true,
            )
        );
        $repeater->add_control(
            'replace',
            array(
                'label'       => 'Replace With',
                'type'        => \Elementor\Controls_Manager::TEXTAREA,
                'rows'        => 4,
                'label_block' => true,
            )
        );
        $this->add_control(
            'uew_custom_replacements',
            array(
                'label'       => 'Additional Text/HTML Replacements',
                'type'        => \Elementor\Controls_Manager::REPEATER,
                'fields'      => $repeater->get_controls(),
                'title_field' => '{{{ search }}}',
            )
        );

        $this->add_control(
            'uew_custom_css',
            array(
                'label'       => 'Custom CSS',
                'type'        => \Elementor\Controls_Manager::TEXTAREA,
                'rows'        => 8,
                'placeholder' => '{{WRAPPER}} ' . $root . ' { }',
                'label_block' => true,
            )
        );

        $this->add_control(
            'uew_html_override',
            array(
                'label'       => 'Full HTML Override',
                'type'        => \Elementor\Controls_Manager::TEXTAREA,
                'rows'        => 12,
                'label_block' => true,
            )
        );

        $this->end_controls_section();
    }

    private function root_selector( $config ) {
        return ! empty( $config['root_selector'] ) ? $config['root_selector'] : '';
    }

    private function replace_placeholders( $html, $config, $settings ) {
        if ( empty( $config['fields'] ) || ! is_array( $config['fields'] ) ) {
            return $html;
        }

        foreach ( $config['fields'] as $field ) {
            if ( empty( $field['placeholder'] ) || empty( $field['id'] ) ) {
                continue;
            }

            $value = $this->field_setting_value( $field, $settings );
            $html  = str_replace( $field['placeholder'], $this->sanitize_field_output( $value, $field ), $html );
        }

        return $html;
    }

    private function field_setting_value( $field, $settings ) {
        $id = $field['id'];

        if ( array_key_exists( $id, $settings ) ) {
            $value = $settings[ $id ];
        } else {
            $value = isset( $field['default'] ) ? $field['default'] : '';
        }

        if ( is_array( $value ) ) {
            $value = isset( $value['url'] ) ? $value['url'] : '';
        }

        return (string) $value;
    }

    private function sanitize_field_output( $value, $field ) {
        $kind = ! empty( $field['kind'] ) ? $field['kind'] : 'text';

        if ( 'url' === $kind || 'media' === $kind ) {
            return esc_url( $value );
        }

        if ( 'attribute' === $kind || 'integration' === $kind ) {
            return esc_attr( $value );
        }

        return esc_html( $value );
    }

    private function apply_custom_replacements( $html, $settings ) {
        if ( empty( $settings['uew_custom_replacements'] ) || ! is_array( $settings['uew_custom_replacements'] ) ) {
            return $html;
        }

        foreach ( $settings['uew_custom_replacements'] as $row ) {
            if ( ! is_array( $row ) || ! isset( $row['search'] ) || '' === (string) $row['search'] ) {
                continue;
            }

            $replace = isset( $row['replace'] ) ? (string) $row['replace'] : '';
            $replace = current_user_can( 'unfiltered_html' ) ? $replace : wp_kses_post( $replace );
            $html    = str_replace( (string) $row['search'], $replace, $html );
        }

        return $html;
    }

    private function add_extra_class( $html, $extra_class ) {
        $classes = array_filter(
            array_map(
                'sanitize_html_class',
                preg_split( '/\s+/', (string) $extra_class )
            )
        );

        if ( empty( $classes ) ) {
            return $html;
        }

        $extra = implode( ' ', $classes );

        return preg_replace_callback(
            '/<(section|nav|div|header|footer|main)\b([^>]*)>/i',
            function ( $match ) use ( $extra ) {
                $tag = $match[0];

                if ( preg_match( '/\sclass=(["\'])(.*?)\1/i', $tag ) ) {
                    return preg_replace_callback(
                        '/\sclass=(["\'])(.*?)\1/i',
                        function ( $class_match ) use ( $extra ) {
                            return ' class=' . $class_match[1] . trim( $class_match[2] . ' ' . $extra ) . $class_match[1];
                        },
                        $tag,
                        1
                    );
                }

                return rtrim( $tag, '>' ) . ' class="' . esc_attr( $extra ) . '">';
            },
            $html,
            1
        );
    }

    private function clean_raw_html( $html ) {
        return current_user_can( 'unfiltered_html' ) ? $html : wp_kses_post( $html );
    }

    private function print_custom_css( $settings ) {
        if ( empty( $settings['uew_custom_css'] ) ) {
            return;
        }

        $wrapper = '.elementor-element-' . $this->get_id();
        $css     = str_replace( '{{WRAPPER}}', $wrapper, (string) $settings['uew_custom_css'] );
        $css     = current_user_can( 'unfiltered_html' ) ? $css : wp_strip_all_tags( $css );
        $css     = str_replace( '</', '<\/', $css );

        if ( '' === trim( $css ) ) {
            return;
        }

        echo '<style id="uew-custom-css-' . esc_attr( $this->get_id() ) . '">' . $css . '</style>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    }
}
