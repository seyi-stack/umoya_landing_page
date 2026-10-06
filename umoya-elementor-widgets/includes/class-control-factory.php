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
 * Each element is ONE row in its block's panel: a pop-out toggle, the way
 * Elementor's own Typography row works. One panel per element made the
 * footer's Style tab a list of 52 panels. Like Typography, the settings only
 * apply while the row is set to Custom -- "Back to default" undoes them in one
 * click.
 *
 * What a pop-out holds depends on the kind of element (derive.mjs,
 * featuresFor()): type for text, colours and a hover state for buttons, fit and
 * filters for photos, layout for containers. Elementor draws every control in a
 * panel when it opens, hidden or not, so a generous set per element is paid
 * for in seconds: at about 130 controls each, a block of ten took two seconds
 * to open.
 *
 * Elementor cannot nest a pop-out inside a pop-out, and its Typography, Box
 * Shadow, Text Shadow, Text Stroke and CSS Filter groups are pop-outs. Inside
 * an element's pop-out those are therefore plain controls writing the same CSS.
 *
 * @package Umoya_EW
 */

namespace Umoya_EW;

use Elementor\Controls_Manager;
use Elementor\Group_Control_Border;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Control_Factory {

	/** Length units offered wherever a single length is set. */
	const LENGTH_UNITS = array( 'px', '%', 'em', 'rem', 'vw', 'vh' );

	/** Units for box spacing. */
	const BOX_UNITS = array( 'px', '%', 'em', 'rem', 'vh', 'vw' );

	/**
	 * Second selector branch for an element that has moved itself to <body>.
	 *
	 * The section's script stamps nothing; the template prints
	 * `data-uew-for="<element id>"` on the moving element, and `{{ID}}` is the
	 * placeholder Elementor fills with that same id when it writes the CSS --
	 * on the page and in the editor alike. The attribute is repeated three
	 * times on purpose: `{{WRAPPER}}` expands to three classes, so this branch
	 * carries exactly the specificity the wrapper branch does, and a control
	 * wins or loses against the section's own stylesheet the same way whether
	 * the dialog has moved yet or not.
	 */
	const PORTAL_HOOK = '[data-uew-for="{{ID}}"][data-uew-for="{{ID}}"][data-uew-for="{{ID}}"]';

	/** The condition every control in the open pop-out carries. */
	private static $condition = array();

	/** CSS properties the element sets in its own style attribute. */
	private static $inline_props = array();

	/** Controls added to the open pop-out so far. */
	private static $added = 0;

	/**
	 * Add one element's style row -- a pop-out toggle and its settings -- to the
	 * panel currently open on the widget.
	 *
	 * @param \Elementor\Widget_Base $widget        Widget being built.
	 * @param array                  $part          Style-part definition from the schema.
	 * @param string                 $root_selector The section root, e.g. `#fc-hero`.
	 * @param array                  $portals       Schema portals: elements the section moves to <body>.
	 * @param string                 $label         The row's name within its block.
	 * @param array                  $inline_fields Controls for the element's own style attribute.
	 * @param array                  $inline_props  CSS properties that attribute sets.
	 * @param callable               $add_field     Registers one schema field as a control.
	 */
	public static function add_part_popover( $widget, array $part, $root_selector, array $portals, $label, array $inline_fields, array $inline_props, callable $add_field ) {
		$id = $part['id'];

		// An element outside the section root -- a sibling scroll anchor, say --
		// is addressed from the widget wrapper. Scoping it under the root would
		// produce a selector that matches nothing.
		$full     = empty( $part['absolute'] )
			? trim( $root_selector . ' ' . (string) $part['selector'] )
			: (string) $part['selector'];
		$target   = self::scoped( $full, $portals );
		$features = isset( $part['features'] ) ? (array) $part['features'] : array();
		$toggle   = $id . '_style';

		$widget->add_control(
			$toggle,
			array(
				'label'        => $label,
				'type'         => Controls_Manager::POPOVER_TOGGLE,
				'label_off'    => 'Default',
				'label_on'     => 'Custom',
				'return_value' => 'yes',
			)
		);

		$widget->start_popover();
		self::$condition    = array( $toggle => 'yes' );
		self::$inline_props = array_map( 'strtolower', $inline_props );
		self::$added        = 0;

		// Which element this is, and whether it is one of several.
		if ( ! empty( $part['sample'] ) ) {
			self::note( $widget, $id . '_sample', '&ldquo;' . esc_html( $part['sample'] ) . '&rdquo;' );
		}
		if ( ! empty( $part['shared'] ) || ! empty( $part['everywhere'] ) ) {
			self::note( $widget, $id . '_shared_notice', 'Styles every one of these in the section at once.' );
		}

		$tag = isset( $part['tag'] ) ? (string) $part['tag'] : '';

		self::add_text( $widget, $id, $target, $features );
		self::add_tick( $widget, $id, $target, $features );
		self::add_box( $widget, $id, $target, $features );
		self::add_media( $widget, $id, $target, $features, $tag );
		self::add_svg( $widget, $id, $target, $features );
		self::add_layout( $widget, $id, $target, $features );
		self::add_spacing( $widget, $id, $target, $features );
		self::add_states( $widget, $id, $target, $features );
		self::add_visibility( $widget, $id, $target, $features, isset( $part['animated'] ) ? (array) $part['animated'] : array() );

		// Values written into the element's own style attribute. They are markup,
		// not CSS, so they carry no Custom condition: hiding them would blank the
		// attribute. They win over everything above, which is why any stylesheet
		// control for the same property was left out.
		if ( $inline_fields ) {
			self::heading( $widget, $id . '_inline_heading', 'Set on the element itself' );
			foreach ( $inline_fields as $field ) {
				call_user_func( $add_field, $field );
				self::$added++;
			}
		}

		// A pop-out must hold at least one control, or Elementor never closes it.
		if ( 0 === self::$added ) {
			self::note( $widget, $id . '_empty', 'Nothing to style on this element.' );
		}

		$widget->end_popover();
		self::$condition    = array();
		self::$inline_props = array();
	}

	/* ------------------------------------------------------------- plumbing */

	/**
	 * Add a control to the open pop-out: with its Custom condition, and not at
	 * all if the element's own style attribute already sets the property.
	 */
	private static function control( $widget, $id, array $args, $responsive = false ) {
		if ( self::overridden( $args ) ) {
			return;
		}
		$args['condition'] = isset( $args['condition'] ) ? array_merge( $args['condition'], self::$condition ) : self::$condition;
		if ( $responsive ) {
			$widget->add_responsive_control( $id, $args );
		} else {
			$widget->add_control( $id, $args );
		}
		self::$added++;
	}

	/** A group control (Background, Border) in the open pop-out. */
	private static function group( $widget, $type, array $args, array $properties ) {
		if ( array_intersect( $properties, self::$inline_props ) ) {
			return;
		}
		$args['condition'] = self::$condition;
		$widget->add_group_control( $type, $args );
		self::$added++;
	}

	/** True when every property a control writes is set inline on the element. */
	private static function overridden( array $args ) {
		if ( empty( self::$inline_props ) || empty( $args['selectors'] ) ) {
			return false;
		}
		$properties = array();
		foreach ( (array) $args['selectors'] as $declaration ) {
			if ( preg_match_all( '/(?:^|;)\s*([a-z-]+)\s*:/i', (string) $declaration, $matches ) ) {
				foreach ( $matches[1] as $property ) {
					$properties[] = strtolower( $property );
				}
			}
		}
		return $properties && ! array_diff( $properties, self::$inline_props );
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
				'condition' => self::$condition,
			)
		);
	}

	private static function note( $widget, $id, $html ) {
		$widget->add_control(
			$id,
			array(
				'type'            => Controls_Manager::RAW_HTML,
				'raw'             => $html,
				'content_classes' => 'elementor-descriptor',
				'condition'       => self::$condition,
			)
		);
		self::$added++;
	}

	/**
	 * `{{WRAPPER}}` scopes the rule to this widget instance, so two copies of a
	 * section on one page do not style each other.
	 */
	public static function selector( $root_selector, $part_selector ) {
		$selector = trim( $root_selector . ' ' . (string) $part_selector );

		return '{{WRAPPER}} ' . $selector;
	}

	/**
	 * The Elementor selector for a selector written relative to the widget:
	 * `{{WRAPPER}} <selector>`, plus a portal branch when the selector starts
	 * at an element the section moves to <body> (see PORTAL_HOOK).
	 *
	 * Rules on the document itself (`:root`, `html`, `body`) cannot sit under
	 * the wrapper, so they are left unscoped.
	 *
	 * @param string $full    Selector relative to the widget wrapper.
	 * @param array  $portals Schema portals, each { selector, trigger }.
	 * @return string
	 */
	public static function scoped( $full, array $portals = array() ) {
		$full = trim( (string) $full );

		if ( preg_match( '/^(:root|html|body)\b/', $full ) ) {
			return $full;
		}

		$branches = array( '{{WRAPPER}} ' . $full );

		foreach ( $portals as $portal ) {
			$start = isset( $portal['selector'] ) ? (string) $portal['selector'] : '';
			if ( '' === $start || 0 !== strpos( $full, $start ) ) {
				continue;
			}

			// `#umoya-form-popup-x` must not count as starting at `#umoya-form-popup`.
			$rest = (string) substr( $full, strlen( $start ) );
			if ( '' !== $rest && preg_match( '/^[A-Za-z0-9_-]/', $rest ) ) {
				continue;
			}

			$branches[] = $start . self::PORTAL_HOOK . $rest;
		}

		return implode( ', ', $branches );
	}

	/**
	 * Append a pseudo-class, pseudo-element or descendant to EVERY branch of a
	 * selector list. Appending to the string would only qualify the last branch,
	 * so `a, b` + `:hover` would make the hover colour permanent on `a`.
	 *
	 * @param string $target Selector list.
	 * @param string $suffix e.g. `:hover`, `::placeholder`, ` *`.
	 * @return string
	 */
	public static function with_suffix( $target, $suffix ) {
		$branches = array_map( 'trim', self::split_selector_list( $target ) );

		return implode( ', ', array_map( function ( $branch ) use ( $suffix ) {
			return $branch . $suffix;
		}, $branches ) );
	}

	/** Split a selector list on top-level commas (not those inside () or []). */
	private static function split_selector_list( $selector ) {
		$out    = array();
		$depth  = 0;
		$buffer = '';
		$length = strlen( $selector );

		for ( $i = 0; $i < $length; $i++ ) {
			$char = $selector[ $i ];
			if ( '(' === $char || '[' === $char ) {
				$depth++;
			} elseif ( ')' === $char || ']' === $char ) {
				$depth--;
			} elseif ( ',' === $char && 0 === $depth ) {
				$out[]  = $buffer;
				$buffer = '';
				continue;
			}
			$buffer .= $char;
		}
		$out[] = $buffer;

		return array_values( array_filter( $out, function ( $branch ) {
			return '' !== trim( $branch );
		} ) );
	}

	/* ------------------------------------------------------------------ text */

	/**
	 * Colour first -- it is what people come to change -- then the settings
	 * Elementor's Typography pop-out offers, as plain controls.
	 */
	private static function add_text( $widget, $id, $target, array $features ) {
		if ( ! in_array( 'text', $features, true ) ) {
			return;
		}

		self::heading( $widget, $id . '_text_heading', 'Text' );

		self::control( $widget, $id . '_color', array(
			'label'     => 'Text Color',
			'type'      => Controls_Manager::COLOR,
			'selectors' => array( $target => 'color: {{VALUE}};' ),
		) );

		self::control( $widget, $id . '_font_family', array(
			'label'     => 'Font Family',
			'type'      => Controls_Manager::FONT,
			'default'   => '',
			'selectors' => array( $target => 'font-family: "{{VALUE}}";' ),
		) );

		self::control( $widget, $id . '_font_size', array(
			'label'      => 'Size',
			'type'       => Controls_Manager::SLIDER,
			'size_units' => array( 'px', 'em', 'rem', 'vw' ),
			'range'      => array( 'px' => array( 'min' => 1, 'max' => 200 ), 'em' => array( 'min' => 0.1, 'max' => 10, 'step' => 0.1 ), 'rem' => array( 'min' => 0.1, 'max' => 10, 'step' => 0.1 ) ),
			'selectors'  => array( $target => 'font-size: {{SIZE}}{{UNIT}};' ),
		), true );

		self::control( $widget, $id . '_font_weight', array(
			'label'     => 'Weight',
			'type'      => Controls_Manager::SELECT,
			'options'   => array(
				''    => 'Default',
				'300' => '300 (Light)',
				'400' => '400 (Normal)',
				'500' => '500 (Medium)',
				'600' => '600 (Semi Bold)',
				'700' => '700 (Bold)',
				'800' => '800 (Extra Bold)',
			),
			'selectors' => array( $target => 'font-weight: {{VALUE}};' ),
		) );

		self::control( $widget, $id . '_line_height', array(
			'label'      => 'Line Height',
			'type'       => Controls_Manager::SLIDER,
			'size_units' => array( 'em', 'px' ),
			'range'      => array( 'em' => array( 'min' => 0.5, 'max' => 4, 'step' => 0.05 ), 'px' => array( 'min' => 1, 'max' => 200 ) ),
			'selectors'  => array( $target => 'line-height: {{SIZE}}{{UNIT}};' ),
		), true );

		self::control( $widget, $id . '_letter_spacing', array(
			'label'      => 'Letter Spacing',
			'type'       => Controls_Manager::SLIDER,
			'size_units' => array( 'px', 'em' ),
			'range'      => array( 'px' => array( 'min' => -5, 'max' => 10, 'step' => 0.1 ), 'em' => array( 'min' => -0.5, 'max' => 1, 'step' => 0.01 ) ),
			'selectors'  => array( $target => 'letter-spacing: {{SIZE}}{{UNIT}};' ),
		) );

		self::control( $widget, $id . '_text_transform', array(
			'label'     => 'Case',
			'type'      => Controls_Manager::SELECT,
			'options'   => array( '' => 'Default', 'uppercase' => 'UPPERCASE', 'capitalize' => 'Title Case', 'lowercase' => 'lowercase', 'none' => 'As typed' ),
			'selectors' => array( $target => 'text-transform: {{VALUE}};' ),
		) );

		self::control( $widget, $id . '_font_style', array(
			'label'     => 'Style',
			'type'      => Controls_Manager::SELECT,
			'options'   => array( '' => 'Default', 'normal' => 'Normal', 'italic' => 'Italic' ),
			'selectors' => array( $target => 'font-style: {{VALUE}};' ),
		) );

		if ( in_array( 'align', $features, true ) ) {
			self::control( $widget, $id . '_align', array(
				'label'     => 'Alignment',
				'type'      => Controls_Manager::CHOOSE,
				'options'   => array(
					'left'    => array( 'title' => 'Left', 'icon' => 'eicon-text-align-left' ),
					'center'  => array( 'title' => 'Center', 'icon' => 'eicon-text-align-center' ),
					'right'   => array( 'title' => 'Right', 'icon' => 'eicon-text-align-right' ),
					'justify' => array( 'title' => 'Justified', 'icon' => 'eicon-text-align-justify' ),
				),
				'selectors' => array( $target => 'text-align: {{VALUE}};' ),
			), true );
		}

		if ( in_array( 'placeholder_color', $features, true ) ) {
			self::control( $widget, $id . '_placeholder_color', array(
				'label'     => 'Placeholder Color',
				'type'      => Controls_Manager::COLOR,
				'selectors' => array( self::with_suffix( $target, '::placeholder' ) => 'color: {{VALUE}};' ),
			) );
		}
	}

	/* ------------------------------------------------------------------ tick */

	/** A checkbox or radio button: the browser draws it, so colour and size. */
	private static function add_tick( $widget, $id, $target, array $features ) {
		if ( ! in_array( 'tick', $features, true ) ) {
			return;
		}

		self::heading( $widget, $id . '_tick_heading', 'Box' );

		self::control( $widget, $id . '_accent', array(
			'label'     => 'Tick Color',
			'type'      => Controls_Manager::COLOR,
			'selectors' => array( $target => 'accent-color: {{VALUE}};' ),
		) );

		self::control( $widget, $id . '_tick_size', array(
			'label'      => 'Size',
			'type'       => Controls_Manager::SLIDER,
			'size_units' => array( 'px', 'em', 'rem' ),
			'range'      => array( 'px' => array( 'min' => 8, 'max' => 40 ) ),
			'selectors'  => array( $target => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};' ),
		) );
	}

	/* ------------------------------------------------------------------- box */

	/**
	 * A plain Background Color, not Elementor's Background group: the group
	 * keeps its video and slideshow fields even when only colour and gradient
	 * are allowed -- some sixty controls per element, all drawn when the panel
	 * opens. A photo the stylesheet paints has its own control on the Content
	 * tab.
	 */
	private static function add_box( $widget, $id, $target, array $features ) {
		$fill   = in_array( 'fill', $features, true );
		$border = in_array( 'border', $features, true );
		$radius = $border || in_array( 'radius', $features, true );
		$shadow = in_array( 'shadow', $features, true );
		if ( ! $fill && ! $radius && ! $shadow ) {
			return;
		}

		$photo = in_array( 'media_fit', $features, true );
		self::heading( $widget, $id . '_box_heading', $photo ? 'Frame' : ( $fill ? 'Background &amp; Border' : 'Border' ) );

		if ( $fill ) {
			self::control( $widget, $id . '_bg_color', array(
				'label'     => 'Background Color',
				'type'      => Controls_Manager::COLOR,
				'selectors' => array( $target => 'background-color: {{VALUE}};' ),
			) );
		}

		if ( $border ) {
			self::group(
				$widget,
				Group_Control_Border::get_type(),
				array(
					'name'     => $id . '_border',
					'selector' => $target,
				),
				array( 'border', 'border-style', 'border-width', 'border-color' )
			);
		}

		if ( $radius ) {
			self::control( $widget, $id . '_radius', array(
				'label'      => 'Border Radius',
				'type'       => Controls_Manager::DIMENSIONS,
				'size_units' => array( 'px', '%', 'em', 'rem' ),
				'selectors'  => array(
					$target => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				),
			) );
		}

		if ( $shadow ) {
			self::control( $widget, $id . '_box_shadow', array(
				'label'     => 'Box Shadow',
				'type'      => Controls_Manager::BOX_SHADOW,
				'selectors' => array( $target => 'box-shadow: {{HORIZONTAL}}px {{VERTICAL}}px {{BLUR}}px {{SPREAD}}px {{COLOR}};' ),
			) );
		}
	}

	/* ----------------------------------------------------------------- media */

	private static function add_media( $widget, $id, $target, array $features, $tag ) {
		if ( ! in_array( 'media_fit', $features, true ) ) {
			return;
		}

		self::heading( $widget, $id . '_media_heading', 'img' === $tag ? 'Image' : 'Video' );

		self::control( $widget, $id . '_object_fit', array(
			'label'     => 'Fit',
			'type'      => Controls_Manager::SELECT,
			'options'   => array(
				''        => 'Default',
				'cover'   => 'Fill the frame (crop)',
				'contain' => 'Show it all',
				'fill'    => 'Stretch',
			),
			'selectors' => array( $target => 'object-fit: {{VALUE}};' ),
		) );

		self::control( $widget, $id . '_object_position', array(
			'label'       => 'Position',
			'type'        => Controls_Manager::TEXT,
			'placeholder' => 'e.g. center 25%',
			'description' => 'Which part stays in view when the frame crops it. Try this before replacing a photo that looks cut off.',
			'selectors'   => array( $target => 'object-position: {{VALUE}};' ),
		), true );

		self::control( $widget, $id . '_media_height', array(
			'label'      => 'Height',
			'type'       => Controls_Manager::SLIDER,
			'size_units' => array( 'px', 'vh', '%', 'rem' ),
			'range'      => array( 'px' => array( 'min' => 0, 'max' => 1200 ), 'vh' => array( 'min' => 0, 'max' => 100 ), '%' => array( 'min' => 0, 'max' => 100 ) ),
			'selectors'  => array( $target => 'height: {{SIZE}}{{UNIT}};' ),
		), true );

		self::control( $widget, $id . '_aspect_ratio', array(
			'label'       => 'Aspect Ratio',
			'type'        => Controls_Manager::TEXT,
			'placeholder' => 'e.g. 4 / 3',
			'selectors'   => array( $target => 'aspect-ratio: {{VALUE}};' ),
		) );

		if ( in_array( 'filters', $features, true ) ) {
			// One `filter` declaration carries every function, so each slider
			// writes all three, reading its siblings' values and falling back to
			// "no change" for any left empty. Separate `filter` rules would
			// overwrite each other.
			$filter = 'filter: brightness( {{' . $id . '_filter_brightness.SIZE || 100}}% ) contrast( {{' . $id . '_filter_contrast.SIZE || 100}}% ) saturate( {{' . $id . '_filter_saturate.SIZE || 100}}% );';

			foreach ( array(
				'brightness' => 'Brightness',
				'contrast'   => 'Contrast',
				'saturate'   => 'Saturation',
			) as $name => $label ) {
				self::control( $widget, $id . '_filter_' . $name, array(
					'label'      => $label,
					'type'       => Controls_Manager::SLIDER,
					'size_units' => array( '%' ),
					'range'      => array( '%' => array( 'min' => 0, 'max' => 200, 'step' => 1 ) ),
					'selectors'  => array( $target => $filter ),
				) );
			}
		}
	}

	/* ------------------------------------------------------------------- svg */

	private static function add_svg( $widget, $id, $target, array $features ) {
		if ( ! in_array( 'svg', $features, true ) ) {
			return;
		}

		self::heading( $widget, $id . '_icon_heading', 'Icon' );

		self::control( $widget, $id . '_svg_stroke', array(
			'label'     => 'Line Color',
			'type'      => Controls_Manager::COLOR,
			'selectors' => array( $target => 'stroke: {{VALUE}};', self::with_suffix( $target, ' *' ) => 'stroke: {{VALUE}};' ),
		) );

		self::control( $widget, $id . '_svg_fill', array(
			'label'     => 'Fill Color',
			'type'      => Controls_Manager::COLOR,
			'selectors' => array( $target => 'fill: {{VALUE}};', self::with_suffix( $target, ' *' ) => 'fill: {{VALUE}};' ),
		) );

		self::control( $widget, $id . '_svg_stroke_width', array(
			'label'     => 'Line Weight',
			'type'      => Controls_Manager::SLIDER,
			'range'     => array( 'px' => array( 'min' => 0, 'max' => 12, 'step' => 0.1 ) ),
			'selectors' => array( $target => 'stroke-width: {{SIZE}};', self::with_suffix( $target, ' *' ) => 'stroke-width: {{SIZE}};' ),
		) );

		self::control( $widget, $id . '_svg_size', array(
			'label'      => 'Size',
			'type'       => Controls_Manager::SLIDER,
			'size_units' => array( 'px', 'em', 'rem' ),
			'range'      => array( 'px' => array( 'min' => 4, 'max' => 200 ) ),
			'selectors'  => array( $target => 'width: {{SIZE}}{{UNIT}}; height: {{SIZE}}{{UNIT}};' ),
		), true );
	}

	/* ---------------------------------------------------------------- layout */

	private static function add_layout( $widget, $id, $target, array $features ) {
		$flex = in_array( 'flex_container', $features, true );
		$grid = in_array( 'grid_container', $features, true );
		if ( ! $flex && ! $grid ) {
			return;
		}

		self::heading( $widget, $id . '_layout_heading', 'Layout' );

		if ( $flex ) {
			self::control( $widget, $id . '_flex_direction', array(
				'label'     => 'Direction',
				'type'      => Controls_Manager::SELECT,
				'options'   => array(
					''               => 'Default',
					'row'            => 'Side by side',
					'column'         => 'Stacked',
					'row-reverse'    => 'Side by side, reversed',
					'column-reverse' => 'Stacked, reversed',
				),
				'selectors' => array( $target => 'flex-direction: {{VALUE}};' ),
			), true );

			self::control( $widget, $id . '_justify_content', array(
				'label'     => 'Justify Content',
				'type'      => Controls_Manager::SELECT,
				'options'   => array(
					''              => 'Default',
					'flex-start'    => 'Start',
					'center'        => 'Center',
					'flex-end'      => 'End',
					'space-between' => 'Space between',
					'space-around'  => 'Space around',
					'space-evenly'  => 'Space evenly',
				),
				'selectors' => array( $target => 'justify-content: {{VALUE}};' ),
			) );

			self::control( $widget, $id . '_align_items', array(
				'label'     => 'Align Items',
				'type'      => Controls_Manager::SELECT,
				'options'   => array( '' => 'Default', 'flex-start' => 'Start', 'center' => 'Center', 'flex-end' => 'End', 'stretch' => 'Stretch' ),
				'selectors' => array( $target => 'align-items: {{VALUE}};' ),
			) );
		}

		if ( $grid ) {
			self::control( $widget, $id . '_grid_columns', array(
				'label'       => 'Columns',
				'type'        => Controls_Manager::NUMBER,
				'min'         => 1,
				'max'         => 12,
				'description' => 'Equal columns. Leave empty to keep the designed layout.',
				'selectors'   => array( $target => 'grid-template-columns: repeat({{VALUE}}, minmax(0, 1fr));' ),
			), true );

			self::control( $widget, $id . '_grid_align_items', array(
				'label'     => 'Align Items',
				'type'      => Controls_Manager::SELECT,
				'options'   => array( '' => 'Default', 'start' => 'Start', 'center' => 'Center', 'end' => 'End', 'stretch' => 'Stretch' ),
				'selectors' => array( $target => 'align-items: {{VALUE}};' ),
			) );
		}

		self::control( $widget, $id . '_gap', array(
			'label'      => 'Gap',
			'type'       => Controls_Manager::SLIDER,
			'size_units' => array( 'px', 'em', 'rem', '%' ),
			'range'      => array( 'px' => array( 'min' => 0, 'max' => 200 ) ),
			'selectors'  => array( $target => 'gap: {{SIZE}}{{UNIT}};' ),
		), true );
	}

	/* --------------------------------------------------------- size, spacing */

	private static function add_spacing( $widget, $id, $target, array $features ) {
		$measure = in_array( 'measure', $features, true );
		$min     = in_array( 'min_height', $features, true );
		$padding = in_array( 'padding', $features, true );
		$margin  = in_array( 'margin', $features, true );
		if ( ! $measure && ! $min && ! $padding && ! $margin ) {
			return;
		}

		self::heading( $widget, $id . '_spacing_heading', $measure || $min ? 'Size &amp; Spacing' : 'Spacing' );

		if ( $measure ) {
			self::control( $widget, $id . '_max_width', array(
				'label'      => 'Max Width',
				'type'       => Controls_Manager::SLIDER,
				'size_units' => self::LENGTH_UNITS,
				'range'      => array( 'px' => array( 'min' => 0, 'max' => 1600 ), '%' => array( 'min' => 0, 'max' => 100 ), 'vw' => array( 'min' => 0, 'max' => 100 ) ),
				'selectors'  => array( $target => 'max-width: {{SIZE}}{{UNIT}};' ),
			), true );
		}

		if ( $min ) {
			self::control( $widget, $id . '_min_height', array(
				'label'      => 'Min Height',
				'type'       => Controls_Manager::SLIDER,
				'size_units' => array( 'px', 'vh', 'dvh', 'rem' ),
				'range'      => array( 'px' => array( 'min' => 0, 'max' => 1200 ), 'vh' => array( 'min' => 0, 'max' => 100 ), 'dvh' => array( 'min' => 0, 'max' => 100 ) ),
				'selectors'  => array( $target => 'min-height: {{SIZE}}{{UNIT}};' ),
			), true );
		}

		if ( $padding ) {
			self::control( $widget, $id . '_padding', array(
				'label'      => 'Padding',
				'type'       => Controls_Manager::DIMENSIONS,
				'size_units' => self::BOX_UNITS,
				'selectors'  => array(
					$target => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				),
			), true );
		}

		if ( $margin ) {
			self::control( $widget, $id . '_margin', array(
				'label'              => 'Margin',
				'type'               => Controls_Manager::DIMENSIONS,
				'size_units'         => self::BOX_UNITS,
				'allowed_dimensions' => 'all',
				'selectors'          => array(
					$target => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				),
			), true );
		}
	}

	/* ---------------------------------------------------------------- states */

	/**
	 * Hover and focus colours. Elementor shows these as Normal / Hover tabs on
	 * its own buttons, but tabs cannot sit inside a pop-out, so each state is
	 * named in its label instead.
	 */
	private static function add_states( $widget, $id, $target, array $features ) {
		$hover = in_array( 'states', $features, true );
		$focus = in_array( 'focus', $features, true );
		if ( ! $hover && ! $focus ) {
			return;
		}

		self::heading( $widget, $id . '_states_heading', $hover ? 'Hover' : 'Focus' );

		if ( $hover ) {
			self::control( $widget, $id . '_hover_color', array(
				'label'     => 'Hover: Text Color',
				'type'      => Controls_Manager::COLOR,
				'selectors' => array( self::with_suffix( $target, ':hover' ) => 'color: {{VALUE}};' ),
			) );
			self::control( $widget, $id . '_hover_bg', array(
				'label'     => 'Hover: Background Color',
				'type'      => Controls_Manager::COLOR,
				'selectors' => array( self::with_suffix( $target, ':hover' ) => 'background-color: {{VALUE}};' ),
			) );
			self::control( $widget, $id . '_hover_border', array(
				'label'     => 'Hover: Border Color',
				'type'      => Controls_Manager::COLOR,
				'selectors' => array( self::with_suffix( $target, ':hover' ) => 'border-color: {{VALUE}};' ),
			) );
		}

		if ( $focus ) {
			self::control( $widget, $id . '_focus_border', array(
				'label'       => 'Focus: Border Color',
				'type'        => Controls_Manager::COLOR,
				'description' => 'Keep the focused field easy to see: it is how keyboard users know where they are.',
				'selectors'   => array( self::with_suffix( $target, ':focus' ) => 'border-color: {{VALUE}};' ),
			) );
		}
	}

	/* ------------------------------------------------------------ visibility */

	private static function add_visibility( $widget, $id, $target, array $features, array $animated = array() ) {
		$opacity = in_array( 'effects', $features, true );
		$hide    = in_array( 'visibility', $features, true );
		if ( ! $opacity && ! $hide ) {
			return;
		}

		self::heading( $widget, $id . '_visibility_heading', 'Visibility' );

		if ( $opacity ) {
			// An element whose own entrance animation drives its opacity holds the
			// animation's last frame for good (`fill-mode: both`), and an animated
			// value beats any normal declaration. Only `!important` outranks it, so
			// that is what this control writes there -- and it says what it costs.
			$fades = in_array( 'opacity', $animated, true );

			self::control( $widget, $id . '_opacity', array(
				'label'       => 'Opacity',
				'type'        => Controls_Manager::SLIDER,
				'range'       => array( 'px' => array( 'min' => 0, 'max' => 1, 'step' => 0.01 ) ),
				'selectors'   => array( $target => $fades ? 'opacity: {{SIZE}} !important;' : 'opacity: {{SIZE}};' ),
				'description' => $fades ? 'This element fades in as the page loads; a value here replaces that fade.' : '',
			) );
		}

		if ( $hide ) {
			self::control( $widget, $id . '_hide', array(
				'label'       => 'Display',
				'type'        => Controls_Manager::SELECT,
				'options'     => array( '' => 'Shown', 'none' => 'Hidden' ),
				'description' => 'Hidden on desktop hides it everywhere. To hide it on phones only, switch the editor to phone view first.',
				'selectors'   => array( $target => 'display: {{VALUE}};' ),
			), true );
		}
	}
}
