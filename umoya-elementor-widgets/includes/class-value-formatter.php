<?php
/**
 * Turns a control's stored value into the string that goes into the markup.
 *
 * This is deliberately a standalone class with no Elementor dependency, because
 * the build's fidelity check calls exactly these functions when it proves a
 * template still reproduces its source file. If escaping lived inside the widget
 * the check would be testing a copy of the logic rather than the logic itself.
 *
 * @package Umoya_EW
 */

namespace Umoya_EW;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Value_Formatter {

	/**
	 * Escape one scalar value for its position in the markup.
	 *
	 * `post` is used for element content rather than `esc_html` because the
	 * section copy legitimately contains inline formatting (`<em>`, `<strong>`)
	 * and named entities (`&times;`), both of which wp_kses_post preserves and
	 * esc_html would double-encode.
	 *
	 * @param mixed              $value   Raw setting value. Media/URL controls arrive as arrays.
	 * @param string             $esc     One of post|attr|url|html|raw.
	 * @param string|array|null  $trusted Compiled value(s) for this field, used to
	 *                                    decide whether a `raw` value is still the
	 *                                    markup this repository produced.
	 * @return string
	 */
	public static function scalar( $value, $esc = 'post', $trusted = null ) {
		$value = self::flatten( $value );

		switch ( $esc ) {
			case 'url':
				return esc_url( $value );

			case 'attr':
				return esc_attr( $value );

			case 'html':
				return esc_html( $value );

			case 'raw':
				return self::raw( $value, $trusted );

			case 'attrs':
				return self::attrs( $value, $trusted );

			case 'comment':
				return self::comment( $value, $trusted );

			case 'trivia':
				// Whitespace and source comments between two elements of a row.
				// Unchanged, it is the section file's own; anything edited is
				// reduced to its whitespace, since nothing else belongs there.
				if ( self::is_trusted( $value, $trusted ) ) {
					return $value;
				}
				return preg_replace( '/\S/', '', $value );

			case 'cssurl':
				// A URL inside a quoted CSS url() inside an attribute. esc_url
				// makes it a safe URL; quotes and backslashes are then
				// percent-encoded so it cannot end the CSS string it sits in.
				return esc_attr( str_replace( array( "'", '"', '\\' ), array( '%27', '%22', '%5C' ), esc_url_raw( $value ) ) );

			case 'ws':
				// Spacing between two attributes: whitespace only, and never
				// none, or the attributes either side would run together.
				$value = preg_replace( '/\S/', '', $value );
				return '' === $value ? ' ' : $value;

			case 'post':
			default:
				return wp_kses_post( $value );
		}
	}

	/**
	 * True when a value can be printed exactly as stored: either it is one the
	 * compiler produced from the section file, or the current user may post
	 * unfiltered HTML anyway -- the same rule WordPress applies everywhere else.
	 *
	 * @param string            $value   Current value.
	 * @param string|array|null $trusted Compiled value(s) for this field.
	 * @return bool
	 */
	private static function is_trusted( $value, $trusted ) {
		if ( null !== $trusted ) {
			$allowed = is_array( $trusted ) ? $trusted : array( $trusted );
			if ( in_array( $value, array_map( 'strval', $allowed ), true ) ) {
				return true;
			}
		}

		return function_exists( 'current_user_can' ) && current_user_can( 'unfiltered_html' );
	}

	/**
	 * Optional attributes a repeater row carries or omits (` disabled selected`
	 * on one `<option>`, ` aria-required="true"` on one consent row).
	 *
	 * These are printed INSIDE a start tag. Post-content filtering does not
	 * help there: `" onmouseover="..."` contains no tag, so wp_kses_post passes
	 * it untouched and it becomes a live event handler. An edited value is
	 * therefore rebuilt from scratch as clean `name="value"` pairs -- event
	 * handlers dropped, URL-bearing values run through esc_url().
	 *
	 * @param string            $value   Current value.
	 * @param string|array|null $trusted Compiled value(s) for this field.
	 * @return string
	 */
	public static function attrs( $value, $trusted = null ) {
		if ( self::is_trusted( $value, $trusted ) ) {
			return $value;
		}

		// Each attribute must start after whitespace and end at whitespace or
		// the end, and its name is plain letters, digits and hyphens. Anything
		// that does not parse that strictly -- a stray quote, a half-open
		// value, `javascript:` posing as a name -- is dropped, not repaired.
		preg_match_all(
			'/(?:^|\s)([A-Za-z][A-Za-z0-9-]*)(?:\s*=\s*(?:"([^"]*)"|\'([^\']*)\'|([^\s"\'=<>`]+)))?(?=\s|$)/',
			(string) $value,
			$matches,
			PREG_SET_ORDER
		);

		$out = '';
		foreach ( $matches as $match ) {
			$name = strtolower( $match[1] );
			if ( 0 === strpos( $name, 'on' ) ) {
				continue;
			}

			// PCRE omits trailing groups that did not take part, so a bare
			// boolean attribute comes back as just [ whole, name ].
			if ( count( $match ) <= 2 ) {
				$out .= ' ' . $name;
				continue;
			}

			// Double-quoted, single-quoted or unquoted, whichever matched.
			$attr_value = isset( $match[4] ) && '' !== $match[4]
				? $match[4]
				: ( isset( $match[3] ) && '' !== $match[3] ? $match[3] : $match[2] );

			$attr_value = in_array( $name, array( 'href', 'src', 'action', 'formaction', 'poster', 'xlink:href' ), true )
				? esc_url( $attr_value )
				: esc_attr( $attr_value );

			$out .= ' ' . $name . '="' . $attr_value . '"';
		}

		return $out;
	}

	/**
	 * Text kept inside an HTML comment (a `★ SWAP` note on one journey tile).
	 * An edited value must not be able to close the comment and start markup.
	 *
	 * @param string            $value   Current value.
	 * @param string|array|null $trusted Compiled value(s) for this field.
	 * @return string
	 */
	public static function comment( $value, $trusted = null ) {
		if ( self::is_trusted( $value, $trusted ) ) {
			return $value;
		}

		return str_replace( array( '--', '>' ), array( '- -', '&gt;' ), (string) $value );
	}

	/**
	 * The post-content allow-list plus inline SVG.
	 *
	 * Markup fields carry icons -- every Travel Essentials row has its own
	 * `<svg>` -- and wp_kses_post strips SVG entirely. On this multisite install
	 * only super admins hold unfiltered_html, so without this a site admin who
	 * edited one accordion row would silently lose its icon.
	 *
	 * @return array
	 */
	public static function allowed_markup() {
		static $allowed = null;
		if ( null !== $allowed ) {
			return $allowed;
		}

		$shape = array_fill_keys(
			array(
				'class', 'id', 'style', 'role', 'aria-hidden', 'aria-label', 'focusable', 'xmlns', 'viewbox',
				'preserveaspectratio', 'width', 'height', 'fill', 'fill-rule', 'fill-opacity', 'stroke',
				'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray',
				'stroke-dashoffset', 'stroke-opacity', 'opacity', 'clip-rule', 'transform', 'vector-effect',
				'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'points', 'offset',
				'stop-color', 'stop-opacity', 'gradientunits', 'gradienttransform',
			),
			true
		);

		$allowed = wp_kses_allowed_html( 'post' );
		foreach ( array( 'svg', 'g', 'path', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'rect', 'title', 'desc', 'defs', 'lineargradient', 'radialgradient', 'stop' ) as $tag ) {
			$allowed[ $tag ] = $shape;
		}

		return $allowed;
	}

	/**
	 * `raw` fields hold markup the compiler lifted straight out of the section
	 * file -- an icon's `<svg>`, the whitespace between repeater rows. That
	 * content has to pass through untouched or the icons break, but it must not
	 * become a hole through which an editor can inject arbitrary HTML.
	 *
	 * So: a value that still matches one the compiler produced is trusted,
	 * because it came from this repository. Anything an editor has changed is
	 * filtered like ordinary post content unless they hold `unfiltered_html` --
	 * the same rule WordPress applies everywhere else.
	 *
	 * The trusted set is per field across all rows, not a single default: the
	 * separator between repeater rows legitimately differs row by row (one
	 * carries `<!-- Slide 3 -->`, the next `<!-- Slide 4 -->`), and wp_kses_post
	 * strips comments, so comparing against one value would delete them.
	 *
	 * @param string            $value   Current value.
	 * @param string|array|null $trusted Compiled value(s) for this field.
	 * @return string
	 */
	private static function raw( $value, $trusted ) {
		if ( self::is_trusted( $value, $trusted ) ) {
			return $value;
		}

		return wp_kses( $value, self::allowed_markup() );
	}

	/**
	 * Render a boolean HTML attribute from a switcher.
	 *
	 * `autoplay`, `muted`, `loop`, `playsinline`, `required` and friends carry no
	 * value: they are either present or absent. The whitespace that preceded the
	 * attribute belongs to it, so switching it off leaves no double space behind
	 * -- and switching it on restores the author's own formatting. The hero's
	 * <video> puts each attribute on its own line; assuming a single space would
	 * fold them together and the render would stop matching the source.
	 *
	 * @param mixed  $value  Switcher setting ('yes' or '').
	 * @param string $attr   Attribute name.
	 * @param string $prefix Whitespace that preceded it in the source.
	 * @return string
	 */
	public static function flag( $value, $attr, $prefix = ' ' ) {
		$on = 'yes' === $value || '1' === $value || true === $value;

		if ( ! $on ) {
			return '';
		}

		$attr = preg_replace( '/[^a-z0-9-]/', '', strtolower( (string) $attr ) );
		if ( ! $attr ) {
			return '';
		}

		// Only whitespace may separate attributes; anything else would be markup.
		$prefix = preg_replace( '/[^\s]/', '', (string) $prefix );

		return ( '' === $prefix ? ' ' : $prefix ) . $attr;
	}

	/**
	 * Elementor's MEDIA and URL controls store arrays. Everything else is scalar.
	 *
	 * @param mixed $value Setting value.
	 * @return string
	 */
	public static function flatten( $value ) {
		if ( is_array( $value ) ) {
			if ( isset( $value['url'] ) ) {
				return (string) $value['url'];
			}
			if ( isset( $value['id'] ) && $value['id'] ) {
				$url = wp_get_attachment_url( (int) $value['id'] );
				return $url ? $url : '';
			}
			return '';
		}

		if ( is_bool( $value ) ) {
			return $value ? '1' : '';
		}

		return (string) $value;
	}

	/**
	 * Rebuild an inline `style` attribute from its per-property controls.
	 *
	 * Each declaration carries the literal text that preceded its value in the
	 * source (`'width:'`, `';height:'`), so the author's original spacing and
	 * semicolons survive a round trip exactly. Emptying a property drops that
	 * declaration instead of emitting `width:;`.
	 *
	 * @param array $group    Schema entry: declarations[] plus a trailing literal.
	 * @param array $settings Widget settings.
	 * @return string
	 */
	public static function inline_style( array $group, array $settings ) {
		$out = '';

		foreach ( $group['declarations'] as $declaration ) {
			$id    = $declaration['id'];
			$value = isset( $settings[ $id ] ) ? self::flatten( $settings[ $id ] ) : '';

			if ( '' === trim( $value ) ) {
				continue;
			}

			$out .= $declaration['prefix'] . esc_attr( $value );
		}

		if ( '' === $out ) {
			return '';
		}

		return $out . ( isset( $group['tail'] ) ? $group['tail'] : '' );
	}
}
