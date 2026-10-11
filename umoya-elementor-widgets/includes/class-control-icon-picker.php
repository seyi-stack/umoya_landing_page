<?php
/**
 * Icon picker: a grid of icons in place of a box of SVG code.
 *
 * The value it stores is the icon's drawing -- the inside of its `<svg>` --
 * exactly what the old "Icon (HTML)" box held. So the control ids, every value
 * already saved on a page, and the section file's own icons are all unchanged;
 * only the way of choosing one is new. An icon picked here ships with the
 * plugin (Icon_Library) and prints as drawn; anything else that reaches the
 * value is still filtered on output (Value_Formatter::scalar(), `raw`).
 *
 * The grid is drawn by assets/js/editor-icon-picker.js from the library alone.
 * A saved value is never inserted into the editor as markup, so a value written
 * by someone else cannot run in the editor of whoever opens the panel next.
 *
 * @package Umoya_EW
 */

namespace Umoya_EW;

use Elementor\Base_Data_Control;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Control_Icon_Picker extends Base_Data_Control {

	const TYPE = 'umoya_icon';

	public function get_type() {
		return self::TYPE;
	}

	/**
	 * @param string $family `line` or `brand`.
	 * @return string[]
	 */
	public static function markups( $family ) {
		return Icon_Library::markups( $family );
	}

	protected function get_default_settings() {
		return array(
			'label_block' => true,
			'family'      => 'line',
		);
	}

	public function enqueue() {
		wp_enqueue_style(
			'umoya-icon-picker',
			UMOYA_EW_URL . 'assets/css/editor-icon-picker.css',
			array(),
			UMOYA_EW_VERSION
		);
		wp_enqueue_script(
			'umoya-icon-picker',
			UMOYA_EW_URL . 'assets/js/editor-icon-picker.js',
			array( 'jquery' ),
			UMOYA_EW_VERSION,
			true
		);
		// wp_json_encode escapes "/", so no icon can close the script element.
		wp_add_inline_script( 'umoya-icon-picker', 'window.UmoyaIconLibrary = ' . wp_json_encode( Icon_Library::all() ) . ';', 'before' );
	}

	public function content_template() {
		?>
		<div class="elementor-control-field elementor-control-field--umoya-icon">
			<label class="elementor-control-title">{{{ data.label }}}</label>
			<div class="elementor-control-input-wrapper umoya-icon-picker" data-family="{{ data.family }}">
				<input type="search" class="umoya-icon-picker__filter" placeholder="<?php echo esc_attr__( 'Search icons', 'umoya-elementor-widgets' ); ?>" aria-label="<?php echo esc_attr__( 'Search icons', 'umoya-elementor-widgets' ); ?>">
				<div class="umoya-icon-picker__grid" role="group" aria-label="{{ data.label }}"></div>
				<p class="umoya-icon-picker__note" aria-live="polite"></p>
			</div>
		</div>
		<# if ( data.description ) { #>
		<div class="elementor-control-field-description">{{{ data.description }}}</div>
		<# } #>
		<?php
	}
}
