/**
 * HTML layer for the Umoya widget compiler.
 *
 * The previous generator rewrote section markup with regular expressions, which
 * is how content went missing: `>([^<]+)<` cannot see comments, nested inline
 * tags or entities, and a mis-fire silently deleted markup. This module instead
 * parses with parse5 (a spec-compliant HTML5 parser) and keeps every node's
 * exact byte offsets in the ORIGINAL source. All rewriting is expressed as
 * offset-anchored splices, so any byte we do not deliberately touch survives
 * untouched -- and the build asserts that.
 */
import { parseFragment, serialize } from 'parse5';

/* ------------------------------------------------------------------ parsing */

export function parse( html ) {
	return parseFragment( html, { sourceCodeLocationInfo: true } );
}

export function isElement( node ) {
	return !! node && !! node.tagName;
}

export function isTextNode( node ) {
	return !! node && node.nodeName === '#text';
}

export function isComment( node ) {
	return !! node && node.nodeName === '#comment';
}

export function children( node ) {
	return ( node.childNodes || [] ).filter( ( c ) => c.nodeName !== '#documentType' );
}

export function elementChildren( node ) {
	return children( node ).filter( isElement );
}

export function attr( node, name ) {
	if ( ! isElement( node ) ) return null;
	const found = ( node.attrs || [] ).find( ( a ) => a.name === name.toLowerCase() );
	return found ? found.value : null;
}

export function classList( node ) {
	const value = attr( node, 'class' );
	return value ? value.trim().split( /\s+/ ).filter( Boolean ) : [];
}

/** Depth-first walk, parents before children. */
export function walk( node, visit, parent = null, index = 0 ) {
	if ( isElement( node ) && visit( node, parent, index ) === false ) return;
	children( node ).forEach( ( child, i ) => walk( child, visit, node, i ) );
}

/** Every element in document order, with its parent and sibling index. */
export function allElements( root ) {
	const out = [];
	walk( root, ( node, parent, index ) => {
		out.push( { node, parent, index } );
	} );
	return out;
}

/* ---------------------------------------------------------------- selectors */

/**
 * A deliberately small CSS subset: `tag`, `#id`, `.class`, `[attr]`,
 * `[attr="value"]`, `:nth-of-type(n)`, descendant and `>` combinators, and
 * comma-separated selector lists. Everything the section specs need, with no
 * dependency and no surprises. Anything outside the subset throws at build
 * time rather than silently matching nothing.
 */
function parseCompound( text ) {
	const compound = { tag: null, id: null, classes: [], attrs: [], nth: null };
	let rest = text.trim();
	if ( ! rest ) throw new Error( 'Empty selector compound' );

	const tagMatch = rest.match( /^([a-zA-Z][a-zA-Z0-9-]*|\*)/ );
	if ( tagMatch ) {
		compound.tag = tagMatch[ 1 ] === '*' ? null : tagMatch[ 1 ].toLowerCase();
		rest = rest.slice( tagMatch[ 0 ].length );
	}

	while ( rest.length ) {
		let m;
		if ( ( m = rest.match( /^#([A-Za-z0-9_-]+)/ ) ) ) {
			compound.id = m[ 1 ];
		} else if ( ( m = rest.match( /^\.([A-Za-z0-9_-]+)/ ) ) ) {
			compound.classes.push( m[ 1 ] );
		} else if ( ( m = rest.match( /^\[([A-Za-z0-9_:-]+)(?:([~|^$*]?=)"([^"]*)")?\]/ ) ) ) {
			compound.attrs.push( { name: m[ 1 ].toLowerCase(), op: m[ 2 ] || null, value: m[ 3 ] ?? null } );
		} else if ( ( m = rest.match( /^:nth-of-type\((\d+)\)/ ) ) ) {
			compound.nth = parseInt( m[ 1 ], 10 );
		} else {
			throw new Error( 'Unsupported selector syntax at "' + rest + '" in "' + text + '"' );
		}
		rest = rest.slice( m[ 0 ].length );
	}

	return compound;
}

function parseSelector( selector ) {
	return selector.split( ',' ).map( ( branch ) => {
		const steps = [];
		const tokens = branch.trim().split( /\s+/ );
		let combinator = ' ';
		for ( const token of tokens ) {
			if ( token === '>' ) {
				combinator = '>';
				continue;
			}
			steps.push( { combinator, compound: parseCompound( token ) } );
			combinator = ' ';
		}
		if ( ! steps.length ) throw new Error( 'Empty selector branch in "' + selector + '"' );
		return steps;
	} );
}

function matchesCompound( node, compound, parent ) {
	if ( ! isElement( node ) ) return false;
	if ( compound.tag && node.tagName.toLowerCase() !== compound.tag ) return false;
	if ( compound.id && attr( node, 'id' ) !== compound.id ) return false;
	if ( compound.classes.length ) {
		const list = classList( node );
		if ( ! compound.classes.every( ( c ) => list.includes( c ) ) ) return false;
	}
	for ( const a of compound.attrs ) {
		const value = attr( node, a.name );
		if ( value === null ) return false;
		if ( a.op === '=' && value !== a.value ) return false;
		if ( a.op === '*=' && ! value.includes( a.value ) ) return false;
		if ( a.op === '^=' && ! value.startsWith( a.value ) ) return false;
		if ( a.op === '$=' && ! value.endsWith( a.value ) ) return false;
		if ( a.op === '~=' && ! value.split( /\s+/ ).includes( a.value ) ) return false;
	}
	if ( compound.nth !== null ) {
		if ( ! parent ) return false;
		const sameType = elementChildren( parent ).filter( ( c ) => c.tagName === node.tagName );
		if ( sameType.indexOf( node ) !== compound.nth - 1 ) return false;
	}
	return true;
}

/** Walk up the ancestor chain built during traversal. */
function matchesBranch( entry, steps, parentsOf ) {
	let current = entry;
	let i = steps.length - 1;

	if ( ! matchesCompound( current.node, steps[ i ].compound, current.parent ) ) return false;
	i -= 1;

	while ( i >= 0 ) {
		const step = steps[ i + 1 ];
		if ( step.combinator === '>' ) {
			const parent = parentsOf.get( current.node );
			if ( ! parent || ! matchesCompound( parent.node, steps[ i ].compound, parent.parent ) ) return false;
			current = parent;
		} else {
			let ancestor = parentsOf.get( current.node );
			let found = null;
			while ( ancestor ) {
				if ( matchesCompound( ancestor.node, steps[ i ].compound, ancestor.parent ) ) {
					found = ancestor;
					break;
				}
				ancestor = parentsOf.get( ancestor.node );
			}
			if ( ! found ) return false;
			current = found;
		}
		i -= 1;
	}

	return true;
}

export function createDocument( html ) {
	const root = parse( html );
	const entries = allElements( root );
	const byNode = new Map();
	for ( const entry of entries ) byNode.set( entry.node, entry );

	const parentsOf = new Map();
	for ( const entry of entries ) {
		parentsOf.set( entry.node, entry.parent ? byNode.get( entry.parent ) || null : null );
	}

	function queryAll( selector ) {
		const branches = parseSelector( selector );
		return entries
			.filter( ( entry ) => branches.some( ( steps ) => matchesBranch( entry, steps, parentsOf ) ) )
			.map( ( entry ) => entry.node );
	}

	function query( selector ) {
		const found = queryAll( selector );
		return found.length ? found[ 0 ] : null;
	}

	return { root, source: html, entries, byNode, parentsOf, queryAll, query };
}

/* ------------------------------------------------------------------- ranges */

export function loc( node ) {
	const location = node.sourceCodeLocation;
	if ( ! location ) throw new Error( 'Node <' + ( node.tagName || node.nodeName ) + '> has no source location' );
	return location;
}

/** Byte range of an element's inner content (between > and </tag). */
export function innerRange( node ) {
	const location = loc( node );
	if ( ! location.startTag ) throw new Error( '<' + node.tagName + '> has no start tag location' );
	const start = location.startTag.endOffset;
	const end = location.endTag ? location.endTag.startOffset : location.endOffset;
	if ( end < start ) throw new Error( '<' + node.tagName + '> has an inverted inner range' );
	return { start, end };
}

/**
 * Byte range of a single attribute's *value*, inside the quotes. parse5 reports
 * the whole `name="value"` span, so the quotes are located by hand -- valueless
 * attributes (`autoplay`, `muted`) return null rather than a bogus range.
 */
export function attrValueRange( source, node, name ) {
	const location = loc( node );
	const attrs = location.attrs || {};
	const found = attrs[ name.toLowerCase() ];
	if ( ! found ) return null;

	const text = source.slice( found.startOffset, found.endOffset );
	const eq = text.indexOf( '=' );
	if ( eq < 0 ) return null;

	let start = eq + 1;
	while ( start < text.length && /\s/.test( text[ start ] ) ) start += 1;
	const quote = text[ start ];
	if ( quote !== '"' && quote !== "'" ) {
		// Unquoted attribute value: runs to the end of the reported span.
		return { start: found.startOffset + start, end: found.endOffset, quote: '' };
	}
	return {
		start: found.startOffset + start + 1,
		end: found.startOffset + text.lastIndexOf( quote ),
		quote,
	};
}

/** Byte range of the whole `name="value"` attribute, including leading space. */
export function attrWholeRange( source, node, name ) {
	const location = loc( node );
	const found = ( location.attrs || {} )[ name.toLowerCase() ];
	if ( ! found ) return null;
	let start = found.startOffset;
	while ( start > 0 && /\s/.test( source[ start - 1 ] ) ) start -= 1;
	return { start, end: found.endOffset };
}

/** Byte range of the whole element, start tag through end tag. */
export function outerRange( node ) {
	const location = loc( node );
	return { start: location.startOffset, end: location.endOffset };
}

/** Insertion point just before the `>` of an element's start tag. */
export function startTagInsertOffset( source, node ) {
	const location = loc( node );
	const tag = location.startTag || location;
	let end = tag.endOffset - 1;
	while ( end > tag.startOffset && /[\s/]/.test( source[ end - 1 ] ) ) end -= 1;
	return end;
}

/* -------------------------------------------------------------- text helpers */

export function innerText( node ) {
	let out = '';
	for ( const child of children( node ) ) {
		if ( isTextNode( child ) ) out += child.value;
		else if ( isElement( child ) ) out += innerText( child );
	}
	return out;
}

export function innerHtml( source, node ) {
	const range = innerRange( node );
	return source.slice( range.start, range.end );
}

export function outerHtml( source, node ) {
	const range = outerRange( node );
	return source.slice( range.start, range.end );
}

/**
 * True when an element's content is plain enough to edit as a single text /
 * rich-text control: text nodes plus a handful of inline formatting tags.
 */
const INLINE_TAGS = new Set( [
	'em', 'strong', 'b', 'i', 'span', 'br', 'small', 'sup', 'sub', 'u', 'mark', 'code', 'abbr', 'time', 'a',
] );

export function isTextual( node, { allowLinks = false } = {} ) {
	const kids = children( node ).filter( ( c ) => ! isComment( c ) );
	if ( ! kids.length ) return false;
	let hasText = false;
	for ( const child of kids ) {
		if ( isTextNode( child ) ) {
			if ( child.value.trim() ) hasText = true;
			continue;
		}
		if ( ! isElement( child ) ) return false;
		const tag = child.tagName.toLowerCase();
		if ( ! INLINE_TAGS.has( tag ) ) return false;
		if ( tag === 'a' && ! allowLinks ) return false;
		// An inline child carrying attributes is a styled element in its own
		// right (`<span class="fc-jrn-loc">`). Swallowing it into the parent's
		// rich-text field would let an edit delete the hook its CSS depends on,
		// so the parent is not textual and the child gets its own control.
		if ( ( child.attrs || [] ).length ) return false;
		if ( innerText( child ).trim() ) {
			if ( ! isTextual( child, { allowLinks } ) ) return false;
			hasText = true;
		}
	}
	return hasText;
}

/* ------------------------------------------------------------ edit splicing */

/**
 * Apply offset-anchored replacements to the original source. Edits must not
 * overlap; the function asserts that rather than producing quiet corruption.
 */
export function splice( source, edits ) {
	const sorted = [ ...edits ].sort( ( a, b ) => a.start - b.start || a.end - b.end );
	for ( let i = 1; i < sorted.length; i += 1 ) {
		if ( sorted[ i ].start < sorted[ i - 1 ].end ) {
			throw new Error(
				'Overlapping edits: [' + sorted[ i - 1 ].start + ',' + sorted[ i - 1 ].end + ') and [' +
				sorted[ i ].start + ',' + sorted[ i ].end + ')'
			);
		}
	}

	let out = '';
	let cursor = 0;
	for ( const edit of sorted ) {
		out += source.slice( cursor, edit.start );
		out += edit.replacement;
		cursor = edit.end;
	}
	return out + source.slice( cursor );
}

export { serialize };
