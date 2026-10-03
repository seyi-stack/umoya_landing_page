<?php
/**
 * Edit check: does every control actually edit what it says it edits?
 *
 *   php wp-cli.phar eval-file tools/uew/edit-check.php <job.json>
 *
 * The other checks prove a widget renders its DEFAULTS exactly like the source
 * file. None of them changes a control. This one does, through the real widget
 * code path (Elementor's own element factory, get_settings_for_display(), the
 * plugin's Value_Formatter), and asserts for every section:
 *
 *   scalars    Each content control, set to a probe, shows the probe, and
 *              putting the default back in its place restores the default
 *              render byte for byte -- so the control changes its own spot and
 *              nothing else. Switchers toggle exactly their attribute; each
 *              dropdown option renders.
 *   repeaters  Removing, adding, reversing and emptying rows renders that many
 *              rows, in that order, with no duplicated ids.
 *   hostile    Script tags, event-handler attributes and javascript: URLs typed
 *              into every field at once do not survive into the markup.
 *   warnings   No PHP notice or warning is raised by any of the above.
 *
 * The job is { "keys": [ ... ] } (empty for every section). Prints JSON.
 * Analysis that needs only strings happens here, so megabytes of rendered
 * variants never have to cross the process boundary.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}

use Umoya_EW\Value_Formatter;

$job_file = isset( $args[0] ) ? $args[0] : '';
$job      = ( $job_file && file_exists( $job_file ) ) ? json_decode( file_get_contents( $job_file ), true ) : array();
$only     = ! empty( $job['keys'] ) ? array_flip( $job['keys'] ) : null;

$manifest = json_decode( file_get_contents( UMOYA_EW_PATH . 'includes/sections/index.json' ), true );

// Make sure the widget types are registered before asking for instances.
\Elementor\Plugin::$instance->widgets_manager->get_widget_types();

/* ------------------------------------------------------------------ render */

/**
 * Render one widget with the given settings. Returns [ html, errors ].
 * Every PHP notice and warning raised while rendering is captured: an
 * "Undefined array key" on an edit is exactly the kind of fault this hunts.
 */
function uew_edit_render( $name, array $settings ) {
	$widget = \Elementor\Plugin::$instance->elements_manager->create_element_instance(
		array(
			'id'         => 'uewtest',
			'elType'     => 'widget',
			'widgetType' => $name,
			'settings'   => $settings,
			'elements'   => array(),
		)
	);

	if ( ! $widget ) {
		return array( '', array( 'widget ' . $name . ' could not be instantiated' ) );
	}

	$errors = array();
	set_error_handler( function ( $no, $message, $file, $line ) use ( &$errors ) {
		$errors[] = $message . ' @ ' . basename( $file ) . ':' . $line;
		return true;
	} );

	ob_start();
	try {
		$widget->render_content();
	} catch ( \Throwable $e ) {
		$errors[] = 'threw: ' . $e->getMessage() . ' @ ' . basename( $e->getFile() ) . ':' . $e->getLine();
	}
	$html = ob_get_clean();

	restore_error_handler();

	return array( $html, $errors );
}

/** Number of element start tags, a cheap proxy for "the markup did not break". */
function uew_tag_count( $html ) {
	return preg_match_all( '/<[a-zA-Z][a-zA-Z0-9-]*[\s>\/]/', $html );
}

/** Default rows exactly as Section_Widget::repeater_defaults() builds them. */
function uew_default_rows( array $definition ) {
	$rows = array();
	foreach ( $definition['rows'] as $index => $row ) {
		$prepared = array( '_id' => substr( md5( $definition['id'] . '|' . $index ), 0, 7 ) );
		foreach ( $definition['controls'] as $field ) {
			$value = isset( $row[ $field['id'] ] ) ? $row[ $field['id'] ] : ( isset( $field['default'] ) ? $field['default'] : '' );
			$prepared[ $field['id'] ] = in_array( $field['control'], array( 'url', 'media' ), true ) ? array( 'url' => $value ) : $value;
		}
		$rows[] = $prepared;
	}
	return $rows;
}

/** How the default value of a field appears in the rendered markup. */
function uew_rendered_default( array $field ) {
	if ( 'inline_style' === ( isset( $field['tab'] ) ? $field['tab'] : '' ) ) {
		return esc_attr( Value_Formatter::flatten( $field['default'] ) );
	}
	return Value_Formatter::scalar( $field['default'], isset( $field['esc'] ) ? $field['esc'] : 'post' );
}

/** A probe value of the right shape for a control, and how it renders. */
function uew_probe_for( array $field, $n ) {
	$word = 'Uewprobe' . $n . 'x';

	switch ( $field['control'] ) {
		case 'url':
			return array( array( 'url' => 'https://example.com/' . strtolower( $word ), 'is_external' => '', 'nofollow' => '' ), 'https://example.com/' . strtolower( $word ) );
		case 'media':
			return array( array( 'url' => 'https://example.com/' . strtolower( $word ) . '.jpg', 'id' => '' ), 'https://example.com/' . strtolower( $word ) . '.jpg' );
		case 'color':
			return array( '#0a0b' . sprintf( '%02x', $n % 256 ), '#0a0b' . sprintf( '%02x', $n % 256 ) );
		default:
			return array( $word, $word );
	}
}

/* ------------------------------------------------------------------- check */

$results = array();

foreach ( $manifest as $key => $meta ) {
	if ( null !== $only && ! isset( $only[ $key ] ) ) {
		continue;
	}

	$schema = \Umoya_EW\Section_Registry::get( $key );
	$name   = $meta['name'];
	$out    = array(
		'scalars'   => 0,
		'repeaters' => 0,
		'failures'  => array(),
		'notes'     => array(),
	);

	$fail = function ( $what, $why ) use ( &$out ) {
		$out['failures'][] = $what . ': ' . $why;
	};

	list( $default, $errors ) = uew_edit_render( $name, array() );
	foreach ( $errors as $error ) {
		$fail( 'default render', $error );
	}
	if ( '' === trim( $default ) ) {
		$fail( 'default render', 'rendered nothing' );
		$results[ $key ] = $out;
		continue;
	}
	$default_tags = uew_tag_count( $default );

	/* ---- scalars ------------------------------------------------------ */

	$n = 0;
	foreach ( $schema['fields'] as $field ) {
		// CSS-only controls never touch the markup; control-check.mjs reads
		// them back from the page instead.
		if ( ! empty( $field['internal'] ) || ! empty( $field['css_only'] ) || 'hidden' === $field['control'] ) {
			continue;
		}
		$n++;
		$out['scalars']++;
		$id = $field['id'];

		if ( 'switcher' === $field['control'] ) {
			$flipped = ( 'yes' === $field['default'] ) ? '' : 'yes';
			list( $html, $errors ) = uew_edit_render( $name, array( $id => $flipped ) );
			foreach ( $errors as $error ) {
				$fail( $id, $error );
			}

			$token = ( isset( $field['flag_prefix'] ) && '' !== preg_replace( '/[^\s]/', '', $field['flag_prefix'] ) ? preg_replace( '/[^\s]/', '', $field['flag_prefix'] ) : ' ' ) . $field['flag_attr'];
			$delta = strlen( $default ) - strlen( $html );
			$want  = ( 'yes' === $field['default'] ) ? strlen( $token ) : -strlen( ' ' . $field['flag_attr'] );
			if ( $html === $default ) {
				$fail( $id, 'switching it changed nothing' );
			} elseif ( $delta !== $want ) {
				$fail( $id, 'switching it changed ' . abs( $delta ) . ' bytes, expected exactly the attribute "' . trim( $token ) . '"' );
			}
			continue;
		}

		if ( 'select' === $field['control'] ) {
			// Wiring is proven with a probe, as for text: counting an option's
			// occurrences cannot work when one value contains another ("sync"
			// is inside "async", "origin" inside "strict-origin").
			$probe = 'Uewprobe' . $n . 'x';
			list( $html, $errors ) = uew_edit_render( $name, array( $id => $probe ) );
			foreach ( $errors as $error ) {
				$fail( $id, $error );
			}
			if ( 0 === substr_count( $html, $probe ) ) {
				$fail( $id, 'the value does not reach the markup (control is wired to nothing)' );
			} elseif ( str_replace( $probe, uew_rendered_default( $field ), $html ) !== $default ) {
				$fail( $id, 'changing it also changed something else' );
			}

			// And every real option renders cleanly.
			foreach ( (array) $field['options'] as $option ) {
				if ( (string) $option === (string) $field['default'] ) {
					continue;
				}
				list( $html, $errors ) = uew_edit_render( $name, array( $id => $option ) );
				foreach ( $errors as $error ) {
					$fail( $id . '=' . $option, $error );
				}
				if ( str_replace( esc_attr( $option ), $probe, $html ) === $html ) {
					$fail( $id . '=' . $option, 'the option does not appear in the markup' );
				} elseif ( uew_tag_count( $html ) !== $default_tags ) {
					$fail( $id . '=' . $option, 'choosing it changed the markup structure' );
				}
			}
			continue;
		}

		list( $value, $rendered ) = uew_probe_for( $field, $n );
		list( $html, $errors )    = uew_edit_render( $name, array( $id => $value ) );
		foreach ( $errors as $error ) {
			$fail( $id, $error );
		}

		$hits = substr_count( $html, $rendered );
		if ( 0 === $hits ) {
			$fail( $id, 'the value does not reach the markup (control is wired to nothing)' );
			continue;
		}

		$restored = str_replace( $rendered, uew_rendered_default( $field ), $html );
		if ( $restored !== $default ) {
			$at  = 0;
			$max = min( strlen( $restored ), strlen( $default ) );
			while ( $at < $max && $restored[ $at ] === $default[ $at ] ) {
				$at++;
			}
			$fail(
				$id,
				'changing it also changed something else; first difference at byte ' . $at .
				': default ' . wp_json_encode( substr( $default, max( 0, $at - 30 ), 70 ) ) .
				' vs ' . wp_json_encode( substr( $restored, max( 0, $at - 30 ), 70 ) )
			);
		}
	}

	/* ---- repeaters ---------------------------------------------------- */

	foreach ( $schema['repeaters'] as $definition ) {
		$out['repeaters']++;
		$rid   = $definition['id'];
		$rows  = uew_default_rows( $definition );
		$cnt   = count( $rows );
		// A row of a merged repeater renders once per list -- a slide and its
		// dot -- so it carries its hook that many times.
		$loops = isset( $definition['loops'] ) ? max( 1, (int) $definition['loops'] ) : 1;

		$class_order = function ( $html ) {
			preg_match_all( '/elementor-repeater-item-([A-Za-z0-9_-]+)/', $html, $m );
			return $m[1];
		};
		// Row order as the first list renders it.
		$row_order = function ( $html, $ids ) use ( $class_order ) {
			return array_values( array_unique( array_values( array_intersect( $class_order( $html ), $ids ) ) ) );
		};

		// Explicit default rows must render exactly what the defaults do.
		list( $html, $errors ) = uew_edit_render( $name, array( $rid => $rows ) );
		foreach ( $errors as $error ) {
			$fail( $rid . ' (as saved)', $error );
		}
		if ( $html !== $default ) {
			$fail( $rid . ' (as saved)', 'rows saved explicitly render differently from the defaults' );
		}
		$ids = $class_order( $html );
		$own = array_values( array_intersect( $ids, wp_list_pluck( $rows, '_id' ) ) );
		if ( count( $own ) !== $cnt * $loops ) {
			$fail( $rid, 'expected ' . ( $cnt * $loops ) . ' row hooks, found ' . count( $own ) );
		}

		// Remove the last row.
		if ( $cnt > 1 ) {
			$fewer = array_slice( $rows, 0, $cnt - 1 );
			list( $html, $errors ) = uew_edit_render( $name, array( $rid => $fewer ) );
			foreach ( $errors as $error ) {
				$fail( $rid . ' (row removed)', $error );
			}
			$seen = $row_order( $html, wp_list_pluck( $rows, '_id' ) );
			if ( $seen !== wp_list_pluck( $fewer, '_id' ) ) {
				$fail( $rid . ' (row removed)', 'rendered rows ' . implode( ',', $seen ) . ', expected ' . implode( ',', wp_list_pluck( $fewer, '_id' ) ) );
			}
			if ( count( array_intersect( $class_order( $html ), wp_list_pluck( $rows, '_id' ) ) ) !== ( $cnt - 1 ) * $loops ) {
				$fail( $rid . ' (row removed)', 'a list driven by this repeater did not lose its row' );
			}
		}

		// Add a row exactly as Elementor's "Add Item" does: every control at its
		// default (which is row 1's value) under a fresh _id. This is the case
		// that matters -- it is what an editor gets -- and it is where a row's
		// ids collide with row 1's unless the compiler numbered them.
		$added = array( '_id' => 'uewnew1' );
		foreach ( $definition['controls'] as $field ) {
			$value = isset( $field['default'] ) ? $field['default'] : '';
			$added[ $field['id'] ] = in_array( $field['control'], array( 'url', 'media' ), true ) ? array( 'url' => $value ) : $value;
		}
		list( $html, $errors ) = uew_edit_render( $name, array( $rid => array_merge( $rows, array( $added ) ) ) );
		foreach ( $errors as $error ) {
			$fail( $rid . ' (Add Item)', $error );
		}
		if ( $loops !== substr_count( $html, 'elementor-repeater-item-uewnew1' ) ) {
			$fail( $rid . ' (Add Item)', 'the added row rendered ' . substr_count( $html, 'elementor-repeater-item-uewnew1' ) . ' time(s), expected ' . $loops );
		}

		// A new row never arrives "active". Where row 1 alone carries a state
		// class (the shown slide, the open accordion item) and rows 2..n agree,
		// a new row must look like row 2, not like row 1.
		$classes_of = function ( $html, $row_id ) {
			if ( ! preg_match( '/\bclass="([^"]*\belementor-repeater-item-' . preg_quote( $row_id, '/' ) . '\b[^"]*)"/', $html, $m ) ) {
				return null;
			}
			return trim( preg_replace( '/\s+/', ' ', preg_replace( '/\belementor-repeater-item-\S+/', '', $m[1] ) ) );
		};
		// Needs three rows: with two, "rows 2..n agree" is trivially true, and a
		// two-row d1/d2 stagger is a counter, not a first-item state.
		if ( $cnt >= 3 ) {
			$shape = array();
			foreach ( $rows as $row ) {
				$shape[] = $classes_of( $html, $row['_id'] );
			}
			$rest = array_unique( array_slice( $shape, 1 ) );
			if ( null !== $shape[0] && $shape[0] !== $shape[1] && 1 === count( $rest ) ) {
				$new = $classes_of( $html, 'uewnew1' );
				if ( $new !== $shape[1] ) {
					$fail( $rid . ' (Add Item)', 'the new row renders as "' . $new . '" instead of "' . $shape[1] . '" -- it copied row 1\'s starting state' );
				}
			}
		}

		// Ids must stay unique when a row is added: a numbered id pattern
		// (fc-det-btn-3..6) has to number the new row, not repeat row 1's.
		preg_match_all( '/\sid="([^"]+)"/', $default, $before );
		preg_match_all( '/\sid="([^"]+)"/', $html, $after );
		$dupes_before = array_keys( array_filter( array_count_values( $before[1] ), function ( $c ) {
			return $c > 1;
		} ) );
		$dupes_after  = array_keys( array_filter( array_count_values( $after[1] ), function ( $c ) {
			return $c > 1;
		} ) );
		$new_dupes = array_diff( $dupes_after, $dupes_before );
		if ( $new_dupes ) {
			$fail( $rid . ' (Add Item)', 'a new row duplicates the id(s) ' . implode( ', ', $new_dupes ) . ' -- its ARIA wiring and any script lookup by id will hit row 1' );
		}

		// And content typed into a new row reaches the markup.
		$probe = 'Uewrowprobe';
		$typed = $added;
		$typed['_id'] = 'uewnew2';
		$has_text = false;
		foreach ( $definition['controls'] as $field ) {
			if ( in_array( $field['control'], array( 'text', 'textarea' ), true ) && 'post' === $field['esc'] ) {
				$typed[ $field['id'] ] = $probe;
				$has_text = true;
			}
		}
		if ( $has_text ) {
			list( $html, $errors ) = uew_edit_render( $name, array( $rid => array_merge( $rows, array( $typed ) ) ) );
			foreach ( $errors as $error ) {
				$fail( $rid . ' (new row text)', $error );
			}
			if ( false === strpos( $html, $probe ) ) {
				$fail( $rid . ' (new row text)', "a new row's text does not reach the markup" );
			}
		}

		// Reverse the order.
		if ( $cnt > 1 ) {
			$reversed = array_reverse( $rows );
			list( $html, $errors ) = uew_edit_render( $name, array( $rid => $reversed ) );
			foreach ( $errors as $error ) {
				$fail( $rid . ' (reversed)', $error );
			}
			$seen = $row_order( $html, wp_list_pluck( $rows, '_id' ) );
			if ( $seen !== wp_list_pluck( $reversed, '_id' ) ) {
				$fail( $rid . ' (reversed)', 'rows did not render in the new order' );
			}
		}

		// No rows at all.
		list( $html, $errors ) = uew_edit_render( $name, array( $rid => array() ) );
		foreach ( $errors as $error ) {
			$fail( $rid . ' (emptied)', $error );
		}
	}

	/* ---- hostile input ------------------------------------------------ */

	$settings = array();
	$script   = '<script>uewXss(1)</script><img src=x onerror=uewXss(2)><b>ok</b>';
	$attr     = '" onmouseover="uewXss(3)';
	$js_url   = 'javascript:uewXss(4)';

	$hostile_value = function ( array $field ) use ( $script, $attr, $js_url ) {
		$esc = isset( $field['esc'] ) ? $field['esc'] : '';
		switch ( $field['control'] ) {
			case 'url':
				return array( 'url' => $js_url, 'is_external' => '', 'nofollow' => '' );
			case 'media':
				return array( 'url' => $js_url, 'id' => '' );
			case 'switcher':
			case 'select':
				return null;
			default:
				// Printed inside a start tag: try to open a handler there.
				if ( 'attrs' === $esc ) {
					return 'x' . $attr . '" href="' . $js_url;
				}
				// Printed inside a comment: try to close it and start markup.
				if ( 'comment' === $esc ) {
					return '--><img src=x onerror=uewXss(5)><!--';
				}
				return ( 'attr' === $esc || 'inline_style' === ( isset( $field['tab'] ) ? $field['tab'] : '' ) ) ? $attr : $script;
		}
	};

	foreach ( $schema['fields'] as $field ) {
		if ( ! empty( $field['internal'] ) || ! empty( $field['css_only'] ) ) {
			continue;
		}
		$value = $hostile_value( $field );
		if ( null !== $value ) {
			$settings[ $field['id'] ] = $value;
		}
	}
	foreach ( $schema['repeaters'] as $definition ) {
		$rows = uew_default_rows( $definition );
		foreach ( $rows as &$row ) {
			foreach ( $definition['controls'] as $field ) {
				$value = $hostile_value( $field );
				if ( null !== $value ) {
					$row[ $field['id'] ] = $value;
				}
			}
		}
		unset( $row );
		$settings[ $definition['id'] ] = $rows;
	}

	list( $html, $errors ) = uew_edit_render( $name, $settings );
	foreach ( $errors as $error ) {
		$fail( 'hostile input', $error );
	}
	// Text inside a comment is inert. A payload that broke OUT of its comment
	// would end the comment early, so stripping comments first cannot hide it.
	$html = preg_replace( '/<!--[\s\S]*?-->/', '', $html );
	$context = function ( $offset ) use ( $html ) {
		return wp_json_encode( substr( $html, max( 0, $offset - 70 ), 140 ) );
	};
	if ( preg_match( '/<script\b/i', $html, $m, PREG_OFFSET_CAPTURE ) ) {
		$fail( 'hostile input', 'a <script> tag survived into the markup: ' . $context( $m[0][1] ) );
	}
	// A URL value, not just the word: `href="javascript:…"`, `src='javascript:…`.
	if ( preg_match( '/(?:href|src|action|formaction|poster|url\()\s*=?\s*["\']?\s*javascript:uewXss/i', $html, $m, PREG_OFFSET_CAPTURE ) ) {
		$fail( 'hostile input', 'a javascript: URL survived into the markup: ' . $context( $m[0][1] ) );
	}
	if ( preg_match( '/<[^>]*\son[a-z]+\s*=\s*["\']?uewXss[^>]*>/i', $html, $m, PREG_OFFSET_CAPTURE ) ) {
		$fail( 'hostile input', 'an event-handler attribute survived into the markup: ' . $context( $m[0][1] ) );
	}

	$results[ $key ] = $out;
}

echo wp_json_encode( $results ) . "\n";
