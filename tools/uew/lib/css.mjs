/**
 * CSS layer for the Umoya widget compiler.
 *
 * A small block-aware parser -- not a regex sweep -- so nested at-rules,
 * strings and comments cannot throw the reader off. It is used for three
 * things, all read-only: harvesting the section's design tokens, learning
 * which elements are flex/grid containers so the right layout controls get
 * offered, and spotting properties a media query overrides (which is why we
 * never seed a non-responsive control's default from the stylesheet).
 */

/** Strip comments while preserving byte length is unnecessary here; we only read. */
function stripComments( css ) {
	let out = '';
	let i = 0;
	while ( i < css.length ) {
		if ( css[ i ] === '/' && css[ i + 1 ] === '*' ) {
			const end = css.indexOf( '*/', i + 2 );
			i = end < 0 ? css.length : end + 2;
			continue;
		}
		if ( css[ i ] === '"' || css[ i ] === "'" ) {
			const quote = css[ i ];
			let j = i + 1;
			while ( j < css.length && css[ j ] !== quote ) {
				if ( css[ j ] === '\\' ) j += 1;
				j += 1;
			}
			out += css.slice( i, j + 1 );
			i = j + 1;
			continue;
		}
		out += css[ i ];
		i += 1;
	}
	return out;
}

/**
 * Parse a stylesheet into a flat list of rules:
 *   { selectors: string[], declarations: {prop, value}[], media: string|null }
 * At-rules other than @media (keyframes, supports, font-face) are recorded but
 * their inner rules are not treated as style targets.
 */
export function parseStylesheet( rawCss ) {
	const css = stripComments( rawCss );
	const rules = [];
	const atRules = [];

	function parseBlock( text, offset, mediaStack ) {
		let i = 0;
		let buffer = '';

		while ( i < text.length ) {
			const ch = text[ i ];

			if ( ch === '"' || ch === "'" ) {
				const quote = ch;
				let j = i + 1;
				while ( j < text.length && text[ j ] !== quote ) {
					if ( text[ j ] === '\\' ) j += 1;
					j += 1;
				}
				buffer += text.slice( i, j + 1 );
				i = j + 1;
				continue;
			}

			if ( ch === '{' ) {
				// Find the matching close brace.
				let depth = 1;
				let j = i + 1;
				while ( j < text.length && depth > 0 ) {
					if ( text[ j ] === '"' || text[ j ] === "'" ) {
						const quote = text[ j ];
						j += 1;
						while ( j < text.length && text[ j ] !== quote ) {
							if ( text[ j ] === '\\' ) j += 1;
							j += 1;
						}
					} else if ( text[ j ] === '{' ) depth += 1;
					else if ( text[ j ] === '}' ) depth -= 1;
					j += 1;
				}

				const prelude = buffer.trim();
				const body = text.slice( i + 1, j - 1 );
				buffer = '';
				i = j;

				if ( prelude.startsWith( '@' ) ) {
					const name = ( prelude.match( /^@([a-zA-Z-]+)/ ) || [] )[ 1 ] || '';
					atRules.push( { name, prelude, body } );
					if ( name === 'media' || name === 'supports' || name === 'layer' || name === 'container' ) {
						parseBlock( body, offset + i, mediaStack.concat( name === 'media' ? prelude : [] ) );
					}
					continue;
				}

				rules.push( {
					selectors: splitSelectors( prelude ),
					declarations: parseDeclarations( body ),
					media: mediaStack.length ? mediaStack.join( ' and ' ) : null,
				} );
				continue;
			}

			buffer += ch;
			i += 1;
		}
	}

	parseBlock( css, 0, [] );
	return { rules, atRules };
}

function splitSelectors( prelude ) {
	const out = [];
	let depth = 0;
	let buffer = '';
	for ( let i = 0; i < prelude.length; i += 1 ) {
		const ch = prelude[ i ];
		if ( ch === '(' || ch === '[' ) depth += 1;
		if ( ch === ')' || ch === ']' ) depth -= 1;
		if ( ch === ',' && depth === 0 ) {
			out.push( buffer.trim() );
			buffer = '';
			continue;
		}
		buffer += ch;
	}
	if ( buffer.trim() ) out.push( buffer.trim() );
	return out.filter( Boolean );
}

function parseDeclarations( body ) {
	const out = [];
	let depth = 0;
	let buffer = '';
	for ( let i = 0; i < body.length; i += 1 ) {
		const ch = body[ i ];
		if ( ch === '"' || ch === "'" ) {
			const quote = ch;
			let j = i + 1;
			while ( j < body.length && body[ j ] !== quote ) {
				if ( body[ j ] === '\\' ) j += 1;
				j += 1;
			}
			buffer += body.slice( i, j + 1 );
			i = j;
			continue;
		}
		if ( ch === '(' ) depth += 1;
		if ( ch === ')' ) depth -= 1;
		if ( ch === ';' && depth === 0 ) {
			pushDeclaration( out, buffer );
			buffer = '';
			continue;
		}
		if ( ch === '{' ) {
			// Nested block (e.g. a stray at-rule) -- skip it wholesale.
			let d = 1;
			let j = i + 1;
			while ( j < body.length && d > 0 ) {
				if ( body[ j ] === '{' ) d += 1;
				if ( body[ j ] === '}' ) d -= 1;
				j += 1;
			}
			i = j - 1;
			buffer = '';
			continue;
		}
		buffer += ch;
	}
	pushDeclaration( out, buffer );
	return out;
}

function pushDeclaration( out, text ) {
	const trimmed = text.trim();
	if ( ! trimmed ) return;
	const colon = trimmed.indexOf( ':' );
	if ( colon < 0 ) return;
	out.push( {
		prop: trimmed.slice( 0, colon ).trim(),
		value: trimmed.slice( colon + 1 ).trim(),
	} );
}

/* --------------------------------------------------------------- harvesting */

/**
 * Design tokens: custom properties declared anywhere outside a media query.
 * Colour-valued tokens become COLOR controls; the rest become TEXT so numeric
 * and easing tokens stay editable too.
 */
export function collectTokens( parsed ) {
	const seen = new Map();
	for ( const rule of parsed.rules ) {
		if ( rule.media ) continue;
		for ( const decl of rule.declarations ) {
			if ( ! decl.prop.startsWith( '--' ) ) continue;
			const name = decl.prop.slice( 2 );
			if ( seen.has( name ) ) continue;
			seen.set( name, { name, value: decl.value, kind: isColorValue( decl.value ) ? 'color' : 'text' } );
		}
	}
	return [ ...seen.values() ];
}

const COLOR_RE = /^(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(|color-mix\(|transparent$|currentColor$|white$|black$)/i;

export function isColorValue( value ) {
	return COLOR_RE.test( value.trim() );
}

/**
 * Index of "which declared property values apply to which selector", used to
 * decide what layout controls an element should get and to flag properties
 * that a media query already overrides.
 */
export function buildSelectorIndex( parsed ) {
	const index = new Map();
	for ( const rule of parsed.rules ) {
		for ( const selector of rule.selectors ) {
			const key = normalizeSelector( selector );
			if ( ! index.has( key ) ) index.set( key, [] );
			index.get( key ).push( rule );
		}
	}
	return index;
}

/** Drop pseudo-classes/elements so `.x:hover` and `.x` share a bucket. */
export function normalizeSelector( selector ) {
	return selector
		.replace( /::?[a-zA-Z-]+(\([^)]*\))?/g, '' )
		.replace( /\s+/g, ' ' )
		.trim();
}

/**
 * Look up the declared value of a property for a selector, ignoring media
 * queries. Returns { value, overriddenByMedia } so a caller can tell whether a
 * non-responsive control could safely be seeded with it. (We never seed --
 * see the note in build.mjs -- but the flag drives a build report.)
 */
export function lookupProperty( index, selectorKey, prop ) {
	const rules = index.get( selectorKey );
	if ( ! rules ) return null;
	let base = null;
	let overriddenByMedia = false;
	for ( const rule of rules ) {
		for ( const decl of rule.declarations ) {
			if ( decl.prop !== prop ) continue;
			if ( rule.media ) overriddenByMedia = true;
			else base = decl.value;
		}
	}
	if ( base === null ) return null;
	return { value: base, overriddenByMedia };
}

/** Selector keys whose base rule sets `display: flex` / `inline-flex`. */
export function layoutModeFor( index, selectorKey ) {
	const display = lookupProperty( index, selectorKey, 'display' );
	if ( ! display ) return null;
	const value = display.value.toLowerCase();
	if ( value.includes( 'grid' ) ) return 'grid';
	if ( value.includes( 'flex' ) ) return 'flex';
	return null;
}

/* ------------------------------------------------------------- inline styles */

/** Parse an inline `style="..."` attribute into declarations. */
export function parseInlineStyle( value ) {
	return parseDeclarations( value );
}

/**
 * Split an inline style attribute into declarations WITH the byte offsets of
 * each value. The compiler needs the offsets so it can rebuild the attribute
 * from controls while preserving the author's exact spacing and semicolons --
 * re-serialising from parsed declarations would silently reformat it.
 */
export function splitInlineStyle( source ) {
	const out = [];
	let depth = 0;
	let start = 0;

	const flush = ( end ) => {
		const chunk = source.slice( start, end );
		if ( ! chunk.trim() ) return;
		const colon = chunk.indexOf( ':' );
		if ( colon < 0 ) return;

		const propRaw = chunk.slice( 0, colon );
		let valueStart = start + colon + 1;
		while ( valueStart < end && /\s/.test( source[ valueStart ] ) ) valueStart += 1;
		let valueEnd = end;
		while ( valueEnd > valueStart && /\s/.test( source[ valueEnd - 1 ] ) ) valueEnd -= 1;

		out.push( {
			prop: propRaw.trim(),
			value: source.slice( valueStart, valueEnd ),
			valueStart,
			valueEnd,
		} );
	};

	for ( let i = 0; i < source.length; i += 1 ) {
		const ch = source[ i ];
		if ( ch === '"' || ch === "'" ) {
			const quote = ch;
			i += 1;
			while ( i < source.length && source[ i ] !== quote ) {
				if ( source[ i ] === '\\' ) i += 1;
				i += 1;
			}
			continue;
		}
		if ( ch === '(' ) depth += 1;
		if ( ch === ')' ) depth -= 1;
		if ( ch === ';' && depth === 0 ) {
			flush( i );
			start = i + 1;
		}
	}
	flush( source.length );
	return out;
}

export function stringifyDeclarations( declarations ) {
	return declarations.map( ( d ) => d.prop + ': ' + d.value + ';' ).join( ' ' );
}
