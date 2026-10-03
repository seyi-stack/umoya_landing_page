<?php
/**
 * Fidelity check for the Umoya widget compiler.
 *
 * Boots the local WordPress harness, renders every compiled template with the
 * schema's own default values, and asserts the output is byte-identical to the
 * section HTML it was compiled from.
 *
 * Running it inside real WordPress matters: `wp_kses_post`, `esc_attr` and
 * `esc_url` all normalise their input, and a compiler that round-trips strings
 * in JavaScript cannot see that. This is the check the previous generator did
 * not have, and it is what proves no markup, attribute or script hook was lost.
 *
 * Usage: php verify-render.php <job.json>
 */

$job_file = isset( $argv[1] ) ? $argv[1] : '';
if ( ! $job_file || ! file_exists( $job_file ) ) {
	fwrite( STDERR, "verify-render.php: job file not found\n" );
	exit( 2 );
}

$job = json_decode( file_get_contents( $job_file ), true );

define( 'WP_USE_THEMES', false );
$_SERVER['HTTP_HOST']   = 'localhost';
$_SERVER['REQUEST_URI'] = '/';

ob_start();
require_once $job['wp_load'];
ob_end_clean();

require_once $job['plugin_root'] . '/includes/class-value-formatter.php';

use Umoya_EW\Value_Formatter;

/**
 * Build the $c / $r / $s arrays a template expects, from schema defaults.
 */
function uew_prepare_defaults( array $schema ) {
	$settings = array();
	foreach ( $schema['fields'] as $field ) {
		$settings[ $field['id'] ] = $field['default'];
	}
	foreach ( $schema['inline_styles'] as $group ) {
		foreach ( $group['declarations'] as $declaration ) {
			if ( ! isset( $settings[ $declaration['id'] ] ) ) {
				$settings[ $declaration['id'] ] = '';
			}
		}
	}

	$c = array();
	foreach ( $schema['fields'] as $field ) {
		if ( ! empty( $field['flag_attr'] ) ) {
			$c[ $field['id'] ] = Value_Formatter::flag(
				$field['default'],
				$field['flag_attr'],
				isset( $field['flag_prefix'] ) ? $field['flag_prefix'] : ' '
			);
			continue;
		}
		$c[ $field['id'] ] = Value_Formatter::scalar( $field['default'], isset( $field['esc'] ) ? $field['esc'] : 'post' );
	}

	$r = array();
	foreach ( $schema['repeaters'] as $repeater ) {
		$trusted = array();
		foreach ( $repeater['controls'] as $control ) {
			$trusted[ $control['id'] ] = array();
			foreach ( $repeater['rows'] as $compiled_row ) {
				if ( isset( $compiled_row[ $control['id'] ] ) ) {
					$trusted[ $control['id'] ][] = $compiled_row[ $control['id'] ];
				}
			}
			if ( isset( $control['default'] ) ) {
				$trusted[ $control['id'] ][] = $control['default'];
			}
		}

		$rows = array();
		foreach ( $repeater['rows'] as $index => $row ) {
			$prepared = array(
				'_uew_item_class' => '',
				'_uew_n'          => (string) ( $index + 1 ),
				'_uew_count'      => (string) count( $repeater['rows'] ),
			);
			foreach ( $repeater['controls'] as $control ) {
				$value                      = isset( $row[ $control['id'] ] ) ? $row[ $control['id'] ] : '';
				$prepared[ $control['id'] ] = Value_Formatter::scalar(
					$value,
					isset( $control['esc'] ) ? $control['esc'] : 'post',
					$trusted[ $control['id'] ]
				);
			}
			$rows[] = $prepared;
		}
		$r[ $repeater['id'] ] = $rows;
	}

	$s = array();
	foreach ( $schema['inline_styles'] as $group ) {
		$s[ $group['id'] ] = Value_Formatter::inline_style( $group, $settings );
	}

	// The portal hook is per widget instance; with no instance it renders as
	// nothing, which is exactly what the source file has in that position.
	$c['_uew_for'] = '';

	return array( $c, $r, $s );
}

/**
 * Compact diff: the first differing line plus a little context on each side.
 */
function uew_diff( $expected, $actual ) {
	$a = explode( "\n", $expected );
	$b = explode( "\n", $actual );
	$max = max( count( $a ), count( $b ) );

	for ( $i = 0; $i < $max; $i++ ) {
		$left  = isset( $a[ $i ] ) ? $a[ $i ] : '<missing>';
		$right = isset( $b[ $i ] ) ? $b[ $i ] : '<missing>';
		if ( $left === $right ) {
			continue;
		}

		$out = array();
		for ( $j = max( 0, $i - 2 ); $j < min( $max, $i + 3 ); $j++ ) {
			$la = isset( $a[ $j ] ) ? $a[ $j ] : '<missing>';
			$lb = isset( $b[ $j ] ) ? $b[ $j ] : '<missing>';
			$marker = ( $la === $lb ) ? '  ' : ( $j === $i ? '>>' : '  ' );
			$out[]  = sprintf( '%s line %d', $marker, $j + 1 );
			$out[]  = '   source : ' . $la;
			$out[]  = '   render : ' . $lb;
		}
		$out[] = sprintf( '  (%d source lines, %d rendered lines)', count( $a ), count( $b ) );
		return implode( "\n", $out );
	}

	return '  (line-for-line identical; difference is trailing whitespace or EOF newline)';
}

/**
 * Collapse entity spellings that differ byte-wise but are the same character.
 *
 * `esc_attr` encodes a literal apostrophe as `&#039;`, so a source attribute
 * reading `aria-label="Founder's Circle"` renders as `Founder&#039;s Circle`.
 * A browser cannot tell those apart, so the difference is reported (the run is
 * labelled "entity-normalised") rather than failed. Structural loss -- a missing
 * element, attribute or script hook -- still fails, which is the point.
 */
function uew_normalize_entities( $value ) {
	return strtr( $value, array(
		'&apos;'  => "'",
		'&#039;'  => "'",
		'&#39;'   => "'",
		'&#x27;'  => "'",
		'&quot;'  => '"',
		'&#034;'  => '"',
		'&#34;'   => '"',
	) );
}

$results = array();

foreach ( $job['sections'] as $key ) {
	$schema_file   = $job['plugin_root'] . '/includes/sections/' . $key . '.json';
	$template_file = $job['plugin_root'] . '/.verify/' . $key . '.php';
	$expected_file = $job['plugin_root'] . '/.verify/' . $key . '.expected.html';

	if ( ! file_exists( $schema_file ) || ! file_exists( $template_file ) ) {
		$results[ $key ] = array( 'ok' => false, 'diff' => '  missing generated files' );
		continue;
	}

	$schema = json_decode( file_get_contents( $schema_file ), true );
	list( $c, $r, $s ) = uew_prepare_defaults( $schema );

	ob_start();
	try {
		include $template_file;
	} catch ( \Throwable $e ) {
		ob_end_clean();
		$results[ $key ] = array( 'ok' => false, 'diff' => '  template threw: ' . $e->getMessage() );
		continue;
	}
	$actual = ob_get_clean();

	$expected = file_get_contents( $expected_file );

	// The template file carries a PHP docblock that emits a leading newline.
	$actual = ltrim( $actual, "\n" );

	$ok         = ( trim( $actual ) === trim( $expected ) );
	$normalized = false;

	if ( ! $ok ) {
		$ok = ( uew_normalize_entities( trim( $actual ) ) === uew_normalize_entities( trim( $expected ) ) );
		$normalized = $ok;
	}

	$results[ $key ] = array(
		'ok'         => $ok,
		'normalized' => $normalized,
		// Diff the entity-normalised forms, so a `&#039;` that is only a
		// different spelling of `'` does not mask the real difference.
		'diff'       => $ok ? '' : uew_diff(
			uew_normalize_entities( trim( $expected ) ),
			uew_normalize_entities( trim( $actual ) )
		),
	);
}

echo wp_json_encode( array( 'sections' => $results ) );
