<?php
/**
 * Builds the Style-tab controls for one element of a section.
 *
 * Every control here works the way Elementor's own widgets work: it declares a
 * `selectors` map and Elementor writes the CSS. Nothing in this file touches
 * markup. That is deliberate and it is what makes the widgets safe -- the
 * section's own stylesheet stays the baseline, controls layer on top of it, and
 * an empty control means "leave the stylesheet alone".
 *
 * It also means no control carries a default read out of the CSS. Seeding, say,
 * `font-size: 0.75rem` from the desktop rule would emit un-mediaqueried CSS at
 * higher specificity and silently defeat the section's own 768px override. An
 * empty control cannot do that.
 *
 * @package Umoya_EW
 */

namespace Umoya_EW;

use Elementor\Controls_Manager;
use Elementor\Group_Control_Background;
use Elementor\Group_Control_Border;
use Elementor\Group_Control_Box_Shadow;
use Elementor\Group_Control_Css_Filter;
use Elementor\Group_Control_Text_Shadow;
use Elementor\Group_Control_Text_Stroke;
use Elementor\Group_Control_Typography;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Control_Factory {

	/** Length units offered wherever a single length is set. */
	const LENGTH_UNITS = array( 'px', '%', 'em', 'rem', 'vw', 'vh' );

	/** Units for box spacing. */
	const BOX_UNITS = array( 'px', '%', 'em', 'rem', 'vh', 'vw' );

	/**
	 * Add one element's style panel to a widget.
	 *
	 * @param \Elementor\Widget_Base $widget        Widget being built.
	 * @param array                  $part          Style-part definition from the schema.
	 * @param string                 $root_selector The section root, e.g. `#fc-hero`.
	 */
	public static function register_part( $widget, array $part, $root_selector ) {
		$id       = $part['id'];
		$target   = self::selector( $root_selector, $part['selector'] );
		$features = isset( $part['features'] ) ? (array) $part['features'] : array();

		$widget->start_controls_section(
			'style_' . $id,
			array(
				'label' => $part['label'],
				'tab'   => Controls_Manager::TAB_STYLE,
			)
		);

		// The panel header names the element; this line says which one it is.
		// It replaces the copy preview that used to be appended to the header and
		// made the panel list hard to scan.
		if ( ! empty( $part['sample'] ) ) {
			$widget->add_control(
				$id . '_sample',
				array(
					'type'            => Controls_Manager::RAW_HTML,
					'raw'             => '&ldquo;' . esc_html( $part['sample'] ) . '&rdquo;',
					'content_classes' => 'elementor-descriptor',
				)
			);
		}

		if ( ! empty( $part['shared'] ) ) {
			$widget->add_control(
				$id . '_shared_notice',
				array(
					'type'            => Controls_Manager::RAW_HTML,
					'raw'             => 'Applies to every <code>' . esc_html( $part['selector'] ) . '</code> in this section.',
					'content_classes' => 'elementor-descriptor',
				)
			);
		}

		self::add_typography( $widget, $id, $target, $features );
		self::add_box( $widget, $id, $target, $features );
		self::add_layout( $widget, $id, $target, $features );
		self::add_media( $widget, $id, $target, $features );
		self::add_svg( $widget, $id, $target, $features );
		self::add_effects( $widget, $id, $target, $features );
		self::add_states( $widget, $id, $target, $features );

		$widget->end_controls_section();
	}

	/**
	 * Elementor breaks a long panel into named groups with a HEADING rather than
	 * running forty controls together -- see the Accordion widget's Header panel,
	 * which separates "Title" from "Icon" exactly this way.
	 */
	private static function heading( $widget, $id, $label ) {
		$widget->add_control(
			$id,
			array(
				'label'     => $label,
				'type'      => Controls_Manager::HEADING,
				'separator' => 'before',
			)
		);
	}

	/**
	 * `{{WRAPPER}}` scopes the rule to this widget instance, so two copies of a
	 * section on one page do not style each other.
	 */
	public static function selector( $root_selector, $part_selector ) {
		$selector = trim( $root_selector . ' ' . (string) $part_selector );

		return '{{WRAPPER}} ' . $selector;
	}

	/* ------------------------------------------------------------ typography */

	private static function add_typography( $widget, $id, $target, array $features ) {
		if ( ! in_array( 'typography', $features, true ) ) {
			return;
		}

		self::heading( $widget, $id . '_typography_heading', 'Typography' );

		$widget->add_group_control(
			Group_Control_Typography::get_type(),
			array(
				'name'     => $id . '_typography',
				'label'    => 'Typography',
				'selector' => $target,
			)
		);

		$widget->add_control(
			$id . '_color',
			array(
				'label'     => 'Text Color',
				'type'      => Controls_Manager::COLOR,
				'selectors' => array( $target => 'color: {{VALUE}};' ),
			)
		);

		if ( in_array( 'text_shadow', $features, true ) ) {
			$widget->add_group_control(
				Group_Control_Text_Shadow::get_type(),
				array(
					'name'     => $id . '_text_shadow',
					'selector' => $target,
				)
			);
		}

		if ( in_array( 'text_stroke', $features, true ) ) {
			$widget->add_group_control(
				Group_Control_Text_Stroke::get_type(),
				array(
					'name'     => $id . '_text_stroke',
					'selector' => $target,
				)
			);
		}

		if ( in_array( 'align', $features, true ) ) {
			$widget->add_responsive_control(
				$id . '_align',
				array(
					'label'     => 'Text Alignment',
					'type'      => Controls_Manager::CHOOSE,
					'options'   => array(
						'left'    => array( 'title' => 'Left', 'icon' => 'eicon-text-align-left' ),
						'center'  => array( 'title' => 'Center', 'icon' => 'eicon-text-align-center' ),
						'right'   => array( 'title' => 'Right', 'icon' => 'eicon-text-align-right' ),
						'justify' => array( 'title' => 'Justified', 'icon' => 'eicon-text-align-justify' ),
					),
					'selectors' => array( $target => 'text-align: {{VALUE}};' ),
				)
			);
		}

		if ( in_array( 'placeholder_color', $features, true ) ) {
			$widget->add_control(
				$id . '_placeholder_color',
				array(
					'label'     => 'Placeholder Color',
					'type'      => Controls_Manager::COLOR,
					'selectors' => array( $target . '::placeholder' => 'color: {{VALUE}};' ),
				)
			);
		}
	}

	/* ------------------------------------------------------------------- box */

	private static function add_box( $widget, $id, $target, array $features ) {
		if ( in_array( 'background', $features, true ) || in_array( 'border', $features, true ) || in_array( 'shadow', $features, true ) ) {
			self::heading( $widget, $id . '_box_heading', 'Background & Border' );
		}

		if ( in_array( 'background', $features, true ) ) {
			$widget->add_group_control(
				Group_Control_Background::get_type(),
				array(
					'name'     => $id . '_background',
					'label'    => 'Background',
					'types'    => array( 'classic', 'gradient' ),
					'selector' => $target,
				)
			);
		}

		if ( in_array( 'border', $features, true ) ) {
			$widget->add_group_control(
				Group_Control_Border::get_type(),
				array(
					'name'     => $id . '_border',
					'selector' => $target,
				)
			);

			$widget->add_responsive_control(
				$id . '_radius',
				array(
					'label'      => 'Border Radius',
					'type'       => Controls_Manager::DIMENSIONS,
					'size_units' => array( 'px', '%', 'em', 'rem' ),
					'selectors'  => array(
						$target => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
					),
				)
			);
		}

		if ( in_array( 'shadow', $features, true ) ) {
			$widget->add_group_control(
				Group_Control_Box_Shadow::get_type(),
				array(
					'name'     => $id . '_box_shadow',
					'selector' => $target,
				)
			);
		}

		if ( in_array( 'spacing', $features, true ) ) {
			self::heading( $widget, $id . '_spacing_heading', 'Spacing' );

			$widget->add_responsive_control(
				$id . '_padding',
				array(
					'label'      => 'Padding',
					'type'       => Controls_Manager::DIMENSIONS,
					'size_units' => self::BOX_UNITS,
					'selectors'  => array(
						$target => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
					),
				)
			);

			$widget->add_responsive_control(
				$id . '_margin',
				array(
					'label'       => 'Margin',
					'type'        => Controls_Manager::DIMENSIONS,
					'size_units'  => self::BOX_UNITS,
					'allowed_dimensions' => 'all',
					'selectors'   => array(
						$target => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
					),
				)
			);
		}
	}

	/* ---------------------------------------------------------------- layout */

	private static function add_layout( $widget, $id, $target, array $features ) {
		if ( in_array( 'sizing', $features, true ) ) {
			self::heading( $widget, $id . '_sizing_heading', 'Size' );

			foreach ( array(
				'width'      => 'Width',
				'max_width'  => 'Max Width',
				'height'     => 'Height',
				'min_height' => 'Min Height',
			) as $property => $label ) {
				$widget->add_responsive_control(
					$id . '_' . $property,
					array(
						'label'      => $label,
						'type'       => Controls_Manager::SLIDER,
						'size_units' => self::LENGTH_UNITS,
						'range'      => array(
							'px'  => array( 'min' => 0, 'max' => 1600 ),
							'%'   => array( 'min' => 0, 'max' => 100 ),
							'vw'  => array( 'min' => 0, 'max' => 100 ),
							'vh'  => array( 'min' => 0, 'max' => 200 ),
							'em'  => array( 'min' => 0, 'max' => 80 ),
							'rem' => array( 'min' => 0, 'max' => 80 ),
						),
						'selectors'  => array(
							$target => str_replace( '_', '-', $property ) . ': {{SIZE}}{{UNIT}};',
						),
					)
				);
			}

			$widget->add_responsive_control(
				$id . '_display',
				array(
					'label'     => 'Display',
					'type'      => Controls_Manager::SELECT,
					'options'   => array(
						''             => 'Default',
						'block'        => 'Block',
						'inline-block' => 'Inline block',
						'flex'         => 'Flex',
						'inline-flex'  => 'Inline flex',
						'grid'         => 'Grid',
						'none'         => 'Hidden',
					),
					'default'   => '',
					'selectors' => array( $target => 'display: {{VALUE}};' ),
				)
			);

			$widget->add_control(
				$id . '_overflow',
				array(
					'label'     => 'Overflow',
					'type'      => Controls_Manager::SELECT,
					'options'   => array(
						''        => 'Default',
						'visible' => 'Visible',
						'hidden'  => 'Hidden',
						'auto'    => 'Auto',
						'scroll'  => 'Scroll',
					),
					'selectors' => array( $target => 'overflow: {{VALUE}};' ),
				)
			);
		}

		if ( in_array( 'flex_container', $features, true ) ) {
			$widget->add_control(
				$id . '_flex_heading',
				array( 'label' => 'Flex Layout', 'type' => Controls_Manager::HEADING, 'separator' => 'before' )
			);

			$widget->add_responsive_control(
				$id . '_flex_direction',
				array(
					'label'     => 'Direction',
					'type'      => Controls_Manager::SELECT,
					'options'   => array(
						''               => 'Default',
						'row'            => 'Row',
						'row-reverse'    => 'Row reversed',
						'column'         => 'Column',
						'column-reverse' => 'Column reversed',
					),
					'selectors' => array( $target => 'flex-direction: {{VALUE}};' ),
				)
			);

			$widget->add_responsive_control(
				$id . '_justify_content',
				array(
					'label'     => 'Justify Content',
					'type'      => Controls_Manager::SELECT,
					'options'   => self::alignment_options(),
					'selectors' => array( $target => 'justify-content: {{VALUE}};' ),
				)
			);

			$widget->add_responsive_control(
				$id . '_align_items',
				array(
					'label'     => 'Align Items',
					'type'      => Controls_Manager::SELECT,
					'options'   => array(
						''         => 'Default',
						'flex-start' => 'Start',
						'center'   => 'Center',
						'flex-end' => 'End',
						'stretch'  => 'Stretch',
						'baseline' => 'Baseline',
					),
					'selectors' => array( $target => 'align-items: {{VALUE}};' ),
				)
			);

			$widget->add_responsive_control(
				$id . '_flex_wrap',
				array(
					'label'     => 'Wrap',
					'type'      => Controls_Manager::SELECT,
					'options'   => array( '' => 'Default', 'nowrap' => 'No wrap', 'wrap' => 'Wrap', 'wrap-reverse' => 'Wrap reversed' ),
					'selectors' => array( $target => 'flex-wrap: {{VALUE}};' ),
				)
			);
		}

		if ( in_array( 'grid_container', $features, true ) ) {
			$widget->add_control(
				$id . '_grid_heading',
				array( 'label' => 'Grid Layout', 'type' => Controls_Manager::HEADING, 'separator' => 'before' )
			);

			$widget->add_responsive_control(
				$id . '_grid_columns',
				array(
					'label'       => 'Template Columns',
					'type'        => Controls_Manager::TEXT,
					'placeholder' => 'e.g. repeat(3, 1fr)',
					'selectors'   => array( $target => 'grid-template-columns: {{VALUE}};' ),
				)
			);

			$widget->add_responsive_control(
				$id . '_grid_rows',
				array(
					'label'       => 'Template Rows',
					'type'        => Controls_Manager::TEXT,
					'placeholder' => 'e.g. auto 1fr',
					'selectors'   => array( $target => 'grid-template-rows: {{VALUE}};' ),
				)
			);

			$widget->add_responsive_control(
				$id . '_grid_align_items',
				array(
					'label'     => 'Align Items',
					'type'      => Controls_Manager::SELECT,
					'options'   => array( '' => 'Default', 'start' => 'Start', 'center' => 'Center', 'end' => 'End', 'stretch' => 'Stretch' ),
					'selectors' => array( $target => 'align-items: {{VALUE}};' ),
				)
			);
		}

		if ( in_array( 'flex_container', $features, true ) || in_array( 'grid_container', $features, true ) ) {
			$widget->add_responsive_control(
				$id . '_gap',
				array(
					'label'      => 'Gap',
					'type'       => Controls_Manager::SLIDER,
					'size_units' => array( 'px', 'em', 'rem', '%' ),
					'range'      => array( 'px' => array( 'min' => 0, 'max' => 200 ) ),
					'selectors'  => array( $target => 'gap: {{SIZE}}{{UNIT}};' ),
				)
			);
		}

		if ( in_array( 'flex_item', $features, true ) ) {
			$widget->add_responsive_control(
				$id . '_align_self',
				array(
					'label'     => 'Align Self',
					'type'      => Controls_Manager::SELECT,
					'options'   => array( '' => 'Default', 'flex-start' => 'Start', 'center' => 'Center', 'flex-end' => 'End', 'stretch' => 'Stretch' ),
					'selectors' => array( $target => 'align-self: {{VALUE}};' ),
					'separator' => 'before',
				)
			);

			$widget->add_responsive_control(
				$id . '_order',
				array(
					'label'     => 'Order',
					'type'      => Controls_Manager::NUMBER,
					'selectors' => array( $target => 'order: {{VALUE}};' ),
				)
			);
		}

		if ( in_array( 'position', $features, true ) ) {
			$widget->add_control(
				$id . '_position',
				array(
					'label'     => 'Position',
					'type'      => Controls_Manager::SELECT,
					'options'   => array(
						''         => 'Default',
						'static'   => 'Static',
						'relative' => 'Relative',
						'absolute' => 'Absolute',
						'fixed'    => 'Fixed',
						'sticky'   => 'Sticky',
					),
					'selectors' => array( $target => 'position: {{VALUE}};' ),
					'separator' => 'before',
				)
			);

			$widget->add_control(
				$id . '_z_index',
				array(
					'label'     => 'Z-index',
					'type'      => Controls_Manager::NUMBER,
					'selectors' => array( $target => 'z-index: {{VALUE}};' ),
				)
			);
		}
	}

	/* ----------------------------------------------------------------- media */

	private static function add_media( $widget, $id, $target, array $features ) {
		if ( ! in_array( 'media_fit', $features, true ) ) {
			return;
		}

		self::heading( $widget, $id . '_media_heading', 'Image Fit' );

		$widget->add_control(
			$id . '_object_fit',
			array(
				'label'     => 'Object Fit',
				'type'      => Controls_Manager::SELECT,
				'options'   => array(
					''           => 'Default',
					'cover'      => 'Cover',
					'contain'    => 'Contain',
					'fill'       => 'Fill',
					'none'       => 'None',
					'scale-down' => 'Scale down',
				),
				'selectors' => array( $target => 'object-fit: {{VALUE}};' ),
			)
		);

		$widget->add_responsive_control(
			$id . '_object_position',
			array(
				'label'       => 'Object Position',
				'type'        => Controls_Manager::TEXT,
				'placeholder' => 'e.g. center 25%',
				'description' => 'Where the image sits inside its frame. Use this before replacing a photo that looks cropped.',
				'selectors'   => array( $target => 'object-position: {{VALUE}};' ),
			)
		);

		$widget->add_responsive_control(
			$id . '_aspect_ratio',
			array(
				'label'       => 'Aspect Ratio',
				'type'        => Controls_Manager::TEXT,
				'placeholder' => 'e.g. 16 / 9',
				'selectors'   => array( $target => 'aspect-ratio: {{VALUE}};' ),
			)
		);

		if ( in_array( 'filters', $features, true ) ) {
			$widget->add_group_control(
				Group_Control_Css_Filter::get_type(),
				array(
					'name'     => $id . '_filters',
					'selector' => $target,
				)
			);
		}
	}

	/* ------------------------------------------------------------------- svg */

	private static function add_svg( $widget, $id, $target, array $features ) {
		if ( ! in_array( 'svg', $features, true ) ) {
			return;
		}

		self::heading( $widget, $id . '_icon_heading', 'Icon' );

		$widget->add_control(
			$id . '_svg_stroke',
			array(
				'label'     => 'Stroke Color',
				'type'      => Controls_Manager::COLOR,
				'selectors' => array( $target => 'stroke: {{VALUE}};', $target . ' *' => 'stroke: {{VALUE}};' ),
			)
		);

		$widget->add_control(
			$id . '_svg_fill',
			array(
				'label'     => 'Fill Color',
				'type'      => Controls_Manager::COLOR,
				'selectors' => array( $target => 'fill: {{VALUE}};', $target . ' *' => 'fill: {{VALUE}};' ),
			)
		);

		$widget->add_control(
			$id . '_svg_stroke_width',
			array(
				'label'     => 'Stroke Width',
				'type'      => Controls_Manager::SLIDER,
				'range'     => array( 'px' => array( 'min' => 0, 'max' => 12, 'step' => 0.1 ) ),
				'selectors' => array( $target => 'stroke-width: {{SIZE}};', $target . ' *' => 'stroke-width: {{SIZE}};' ),
			)
		);

		$widget->add_responsive_control(
			$id . '_svg_size',
			array(
				'label'      => 'Icon Size',
				'type'       => Controls_Manager::SLIDER,
				'size_units' => array( 'px', 'em', 'rem' ),
				'range'      => array( 'px' => array( 'min' => 4, 'max' => 200 ) ),
				'selectors'  => array( $target => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};' ),
			)
		);
	}

	/* --------------------------------------------------------------- effects */

	private static function add_effects( $widget, $id, $target, array $features ) {
		if ( ! in_array( 'effects', $features, true ) ) {
			return;
		}

		self::heading( $widget, $id . '_effects_heading', 'Effects' );

		$widget->add_responsive_control(
			$id . '_opacity',
			array(
				'label'     => 'Opacity',
				'type'      => Controls_Manager::SLIDER,
				'range'     => array( 'px' => array( 'min' => 0, 'max' => 1, 'step' => 0.01 ) ),
				'selectors' => array( $target => 'opacity: {{SIZE}};' ),
				'separator' => 'before',
			)
		);

		$widget->add_control(
			$id . '_blend_mode',
			array(
				'label'     => 'Blend Mode',
				'type'      => Controls_Manager::SELECT,
				'options'   => array(
					''           => 'Normal',
					'multiply'   => 'Multiply',
					'screen'     => 'Screen',
					'overlay'    => 'Overlay',
					'darken'     => 'Darken',
					'lighten'    => 'Lighten',
					'color-dodge' => 'Color dodge',
					'saturation' => 'Saturation',
					'color'      => 'Color',
					'difference' => 'Difference',
					'exclusion'  => 'Exclusion',
					'luminosity' => 'Luminosity',
				),
				'selectors' => array( $target => 'mix-blend-mode: {{VALUE}};' ),
			)
		);

		if ( in_array( 'transition', $features, true ) ) {
			$widget->add_control(
				$id . '_transition',
				array(
					'label'     => 'Transition Duration',
					'type'      => Controls_Manager::SLIDER,
					'size_units' => array( 's' ),
					'range'     => array( 's' => array( 'min' => 0, 'max' => 3, 'step' => 0.05 ) ),
					'selectors' => array( $target => 'transition-duration: {{SIZE}}s;' ),
				)
			);
		}
	}

	/* ---------------------------------------------------------------- states */

	private static function add_states( $widget, $id, $target, array $features ) {
		if ( ! in_array( 'states', $features, true ) ) {
			return;
		}

		self::heading( $widget, $id . '_states_heading', 'States' );

		$widget->start_controls_tabs( $id . '_state_tabs' );

		$widget->start_controls_tab( $id . '_state_normal', array( 'label' => 'Normal' ) );
		$widget->add_control(
			$id . '_state_bg',
			array(
				'label'     => 'Background Color',
				'type'      => Controls_Manager::COLOR,
				'selectors' => array( $target => 'background-color: {{VALUE}};' ),
			)
		);
		$widget->end_controls_tab();

		$widget->start_controls_tab( $id . '_state_hover', array( 'label' => 'Hover' ) );
		$widget->add_control(
			$id . '_hover_color',
			array(
				'label'     => 'Text Color',
				'type'      => Controls_Manager::COLOR,
				'selectors' => array( $target . ':hover' => 'color: {{VALUE}};' ),
			)
		);
		$widget->add_control(
			$id . '_hover_bg',
			array(
				'label'     => 'Background Color',
				'type'      => Controls_Manager::COLOR,
				'selectors' => array( $target . ':hover' => 'background-color: {{VALUE}};' ),
			)
		);
		$widget->add_control(
			$id . '_hover_border',
			array(
				'label'     => 'Border Color',
				'type'      => Controls_Manager::COLOR,
				'selectors' => array( $target . ':hover' => 'border-color: {{VALUE}};' ),
			)
		);
		$widget->end_controls_tab();

		$widget->start_controls_tab( $id . '_state_focus', array( 'label' => 'Focus' ) );
		$widget->add_control(
			$id . '_focus_border',
			array(
				'label'       => 'Border Color',
				'type'        => Controls_Manager::COLOR,
				'description' => 'Keep a visible focus ring: it is how keyboard users see where they are.',
				'selectors'   => array( $target . ':focus' => 'border-color: {{VALUE}};' ),
			)
		);
		$widget->add_control(
			$id . '_focus_outline',
			array(
				'label'     => 'Outline Color',
				'type'      => Controls_Manager::COLOR,
				'selectors' => array( $target . ':focus-visible' => 'outline-color: {{VALUE}};' ),
			)
		);
		$widget->end_controls_tab();

		$widget->end_controls_tabs();
	}

	private static function alignment_options() {
		return array(
			''              => 'Default',
			'flex-start'    => 'Start',
			'center'        => 'Center',
			'flex-end'      => 'End',
			'space-between' => 'Space between',
			'space-around'  => 'Space around',
			'space-evenly'  => 'Space evenly',
		);
	}
}
