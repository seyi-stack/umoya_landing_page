/**
 * Derivation: turn a parsed section into an Elementor control schema plus a
 * PHP render template.
 *
 * The guiding rule is that markup is never invented and never dropped. The
 * template IS the source file, with a small number of `<?php echo ?>` splices
 * at byte offsets the parser reported. Everything else -- comments, entities,
 * SVG, whitespace, attribute order -- is copied through verbatim, and build.mjs
 * proves it by rendering the template with its own defaults and diffing.
 *
 * Styling never touches markup. Every style control is an Elementor `selectors`
 * entry, which is how native widgets work: the section's own stylesheet stays
 * the baseline and controls layer CSS on top of it.
 */
import {
	createDocument, attr, classList, elementChildren, children, isElement, isTextNode, isComment,
	innerRange, innerText, innerHtml, outerHtml, outerRange, attrValueRange, attrWholeRange, isTextual, splice,
	startTagInsertOffset,
} from './html.mjs';
import { parseStylesheet, buildSelectorIndex, layoutModeFor, collectTokens, splitInlineStyle, normalizeSelector } from './css.mjs';

/* ------------------------------------------------------------------- tables */

/** Tags whose internals are drawing instructions, not editable layout. */
const SVG_INTERNALS = new Set( [
	'path', 'line', 'polyline', 'polygon', 'circle', 'ellipse', 'rect', 'g', 'defs', 'use', 'stop',
	'lineargradient', 'radialgradient', 'clippath', 'mask', 'symbol', 'marker', 'filter', 'fegaussianblur',
	'feoffset', 'feblend', 'femerge', 'femergenode', 'title', 'desc', 'animate', 'animatetransform', 'textpath',
] );

const VOID_TAGS = new Set( [ 'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr' ] );

const TEXT_TAGS = new Set( [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'li', 'label', 'legend', 'figcaption', 'blockquote', 'cite', 'dt', 'dd', 'strong', 'em', 'small', 'summary', 'th', 'td', 'a', 'button' ] );

/** Attributes that are structural: editing them breaks the section's own CSS/JS. */
const LOCKED_ATTRS = new Set( [ 'id', 'class', 'style', 'for', 'aria-controls', 'aria-labelledby', 'aria-describedby', 'role', 'aria-hidden', 'tabindex', 'data-slide', 'data-index', 'viewbox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'd', 'points', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'x', 'y', 'width', 'height', 'preserveaspectratio', 'fill-rule', 'clip-rule' ] );

/** Attributes surfaced on the Content tab as plain text. */
const TEXT_ATTRS = new Set( [ 'alt', 'title', 'aria-label', 'aria-roledescription', 'placeholder', 'label', 'datetime', 'download' ] );

/** Attributes that carry a URL. */
const URL_ATTRS = new Set( [ 'href', 'action', 'formaction', 'cite' ] );

/** Attributes that carry media. */
const MEDIA_ATTRS = new Set( [ 'src', 'poster' ] );

/** Attributes that belong to the CRM / form plumbing rather than to design. */
function isIntegrationAttr( name, node ) {
	if ( name.startsWith( 'data-hubspot' ) ) return true;
	if ( name === 'data-umoya-form-source' ) return true;
	if ( name === 'data-wordpress-backup-endpoint' ) return true;
	if ( name === 'data-hs-do-not-collect' ) return true;
	if ( name === 'name' && [ 'input', 'select', 'textarea', 'form' ].includes( node.tagName ) ) return true;
	if ( name === 'value' && node.tagName === 'input' && ( attr( node, 'type' ) || '' ).toLowerCase() === 'hidden' ) return true;
	return false;
}

/** Attributes that describe form behaviour. */
const FORM_ATTRS = new Set( [ 'type', 'required', 'maxlength', 'minlength', 'min', 'max', 'step', 'pattern', 'autocomplete', 'inputmode', 'rows', 'cols', 'multiple', 'accept', 'novalidate', 'method', 'enctype', 'checked', 'selected', 'disabled', 'readonly' ] );

/** Attributes that describe media behaviour. */
const MEDIA_BEHAVIOUR_ATTRS = new Set( [ 'loading', 'decoding', 'fetchpriority', 'sizes', 'srcset', 'autoplay', 'muted', 'loop', 'playsinline', 'controls', 'preload', 'target', 'rel', 'referrerpolicy', 'allow', 'allowfullscreen', 'frameborder', 'crossorigin' ] );

/* ------------------------------------------------- inline-style control map */

/**
 * Inline `style` attributes beat any stylesheet Elementor can generate, so they
 * are never hoisted into CSS (that would need specificity tricks and could
 * reorder the cascade). Instead each declared property becomes its own control
 * and the attribute is rebuilt, in source order, from those controls.
 */
const INLINE_STYLE_CONTROLS = {
	'object-fit': { type: 'select', options: [ 'cover', 'contain', 'fill', 'none', 'scale-down' ] },
	'object-position': { type: 'text' },
	'width': { type: 'text' },
	'height': { type: 'text' },
	'opacity': { type: 'text' },
	'transition': { type: 'text' },
	'position': { type: 'select', options: [ 'static', 'relative', 'absolute', 'fixed', 'sticky' ] },
	'inset': { type: 'text' },
	'top': { type: 'text' },
	'right': { type: 'text' },
	'bottom': { type: 'text' },
	'left': { type: 'text' },
	'display': { type: 'text' },
	'background': { type: 'text' },
	'background-image': { type: 'text' },
	'color': { type: 'color' },
	'max-width': { type: 'text' },
	'min-height': { type: 'text' },
	'aspect-ratio': { type: 'text' },
	'z-index': { type: 'text' },
};

/* ------------------------------------------------------------------ helpers */

function titleCase( value ) {
	return value
		.replace( /[-_]+/g, ' ' )
		.replace( /\s+/g, ' ' )
		.trim()
		.replace( /\b([a-z])/g, ( m ) => m.toUpperCase() );
}

function slug( value ) {
	return String( value )
		.toLowerCase()
		.replace( /[^a-z0-9]+/g, '_' )
		.replace( /^_+|_+$/g, '' );
}

function previewText( value, limit = 40 ) {
	const clean = String( value ).replace( /<[^>]*>/g, ' ' ).replace( /\s+/g, ' ' ).trim();
	return clean.length > limit ? clean.slice( 0, limit - 1 ) + '…' : clean;
}

/** Longest shared class prefix in the section, stripped from panel labels. */
function detectClassPrefixes( doc ) {
	const counts = new Map();
	for ( const { node } of doc.entries ) {
		for ( const cls of classList( node ) ) {
			const parts = cls.split( '-' );
			for ( let i = 1; i <= Math.min( 3, parts.length - 1 ); i += 1 ) {
				const prefix = parts.slice( 0, i ).join( '-' ) + '-';
				counts.set( prefix, ( counts.get( prefix ) || 0 ) + 1 );
			}
		}
	}
	return [ ...counts.entries() ]
		.filter( ( [ , n ] ) => n >= 3 )
		.sort( ( a, b ) => b[ 0 ].length - a[ 0 ].length || b[ 1 ] - a[ 1 ] )
		.map( ( [ prefix ] ) => prefix );
}

/**
 * These sections name their classes tersely -- `fc-f2-ttl`, `fc-ss-arw` -- which
 * makes for panel labels like "Ttl" and "Arw". Expanding them is the difference
 * between a scannable list of panels and a wall of abbreviations.
 */
const NAME_EXPANSIONS = {
	acc: 'Accordion', arw: 'Arrow', bd: 'Body', bg: 'Background', btn: 'Button',
	cap: 'Caption', chk: 'Check', col: 'Column', cta: 'CTA', desc: 'Description',
	dec: 'Decorative', dot: 'Dot', ext: 'Extension', eye: 'Eyebrow', ftr: 'Footer',
	hd: 'Header', hdr: 'Header', ico: 'Icon', img: 'Image', inr: 'Inner',
	lbl: 'Label', loc: 'Location', msg: 'Message', nav: 'Navigation', nm: 'Name',
	num: 'Number', ov: 'Overlay', ph: 'Placeholder', pic: 'Picture', pri: 'Privilege',
	req: 'Required', sec: 'Section', ss: 'Slideshow', sub: 'Subtitle', tgl: 'Toggle',
	ttl: 'Title', txt: 'Text', vid: 'Video', wrap: 'Wrapper', jrn: 'Journey',
	f2: 'Form', h1: 'Hero', bf: 'Panel', det: 'Details', ben: 'Benefits',
	c: 'Container', n: 'Number', l: 'Label', t: 'Text', p: 'Paragraph',
	inner: 'Inner', outer: 'Outer', body: 'Body', head: 'Header', top: 'Top',
};

/** Classes that carry behaviour, not identity: reveal hooks and stagger delays. */
function isUtilityClass( cls ) {
	return /(^|-)(rv|on|active|open|is|has)$/.test( cls ) || /(^|-)d\d+$/.test( cls );
}

/**
 * The class that best names an element: the most specific one that is not a
 * behaviour hook. `.fc-f2-hd.fc-f2-rv.fc-d1` is the section header, not "Rv".
 */
export function namingClass( node ) {
	const classes = classList( node ).filter( ( c ) => ! isUtilityClass( c ) );
	if ( ! classes.length ) return node.tagName.toLowerCase();

	return classes.reduce( ( best, current ) => ( current.length > best.length ? current : best ) );
}

function humanizeClass( cls, prefixes ) {
	let name = cls;
	for ( const prefix of prefixes ) {
		if ( name.startsWith( prefix ) && name.length > prefix.length ) {
			name = name.slice( prefix.length );
			break;
		}
	}

	const words = name
		.split( /[-_]+/ )
		.filter( Boolean )
		.map( ( word ) => NAME_EXPANSIONS[ word.toLowerCase() ] || titleCase( word ) );

	return words.join( ' ' ) || titleCase( name );
}

/* -------------------------------------------------------- selector building */

/**
 * Build a selector for a node, relative to the section root. Prefers the
 * shortest form that is either unique or matches exactly one homogeneous run of
 * siblings (which is what a repeater's items look like, and is what we want a
 * style rule to hit).
 */
function buildSelector( doc, node, rootNode ) {
	const candidates = [];
	const classes = classList( node ).filter( ( c ) => ! /^(is|has)-/.test( c ) );
	const tag = node.tagName.toLowerCase();

	if ( classes.length ) {
		for ( let take = 1; take <= classes.length; take += 1 ) {
			// Most descriptive class first: the longest one is usually the semantic one.
			const ordered = [ ...classes ].sort( ( a, b ) => b.length - a.length ).slice( 0, take );
			candidates.push( '.' + ordered.sort().join( '.' ) );
		}
		candidates.push( tag + '.' + [ ...classes ].sort().join( '.' ) );
	} else {
		candidates.push( tag );
	}

	const scope = ( sel ) => ( rootSelectorOf( rootNode ) + ' ' + sel ).trim();

	for ( const candidate of candidates ) {
		const matched = doc.queryAll( scope( candidate ) );
		if ( matched.length === 1 && matched[ 0 ] === node ) return { selector: candidate, shared: false, matched };
		if ( matched.includes( node ) && isHomogeneousRun( doc, matched ) ) {
			return { selector: candidate, shared: true, matched };
		}
	}

	// Walk up: prefix with the nearest classed ancestor and try again.
	const parentEntry = doc.parentsOf.get( node );
	if ( parentEntry && parentEntry.node !== rootNode ) {
		const parent = buildSelector( doc, parentEntry.node, rootNode );
		for ( const candidate of candidates ) {
			const combined = parent.selector + ' > ' + candidate;
			const matched = doc.queryAll( scope( combined ) );
			if ( matched.length === 1 && matched[ 0 ] === node ) return { selector: combined, shared: false, matched };
			if ( matched.includes( node ) && isHomogeneousRun( doc, matched ) ) {
				return { selector: combined, shared: true, matched };
			}
		}
	}

	// Last resort: positional.
	const parentNode = parentEntry ? parentEntry.node : rootNode;
	const sameTag = elementChildren( parentNode ).filter( ( c ) => c.tagName === node.tagName );
	const nth = sameTag.indexOf( node ) + 1;
	const base = parentNode === rootNode ? '' : buildSelector( doc, parentNode, rootNode ).selector + ' > ';
	const selector = base + tag + ':nth-of-type(' + nth + ')';
	return { selector, shared: false, matched: doc.queryAll( scope( selector ) ) };
}

function rootSelectorOf( rootNode ) {
	const id = attr( rootNode, 'id' );
	if ( id ) return '#' + id;
	const classes = classList( rootNode );
	if ( classes.length ) return '.' + classes[ 0 ];
	return rootNode.tagName.toLowerCase();
}

/** True when every matched node is a sibling of the others under one parent. */
function isHomogeneousRun( doc, nodes ) {
	if ( nodes.length < 2 ) return false;
	const parents = new Set( nodes.map( ( n ) => doc.parentsOf.get( n )?.node ) );
	if ( parents.size !== 1 ) return false;
	const tags = new Set( nodes.map( ( n ) => n.tagName ) );
	return tags.size === 1;
}

/* ------------------------------------------------------------ style features */

/**
 * Which style panels an element gets. Deliberately generous -- the brief is
 * "all properties of every element fully exposed" -- but tuned per element type
 * so a `<path>` does not get padding controls and a heading does not get
 * object-fit.
 */
function featuresFor( node, layoutMode, isRoot ) {
	const tag = node.tagName.toLowerCase();
	const base = [ 'spacing', 'sizing', 'background', 'border', 'shadow', 'effects', 'position', 'visibility' ];

	if ( tag === 'svg' ) return [ 'svg', 'sizing', 'spacing', 'effects', 'visibility' ];
	if ( tag === 'img' || tag === 'video' || tag === 'iframe' ) {
		return [ ...base, 'media_fit', 'filters', 'transition' ];
	}
	if ( tag === 'input' || tag === 'select' || tag === 'textarea' ) {
		return [ ...base, 'typography', 'text_color', 'placeholder_color', 'align', 'transition', 'states' ];
	}
	if ( tag === 'a' || tag === 'button' ) {
		return [ ...base, 'typography', 'text_color', 'text_shadow', 'align', 'transition', 'states', 'flex_container' ];
	}
	if ( TEXT_TAGS.has( tag ) ) {
		return [ ...base, 'typography', 'text_color', 'text_shadow', 'text_stroke', 'align', 'transition' ];
	}

	const features = [ ...base, 'align', 'typography', 'text_color', 'transition' ];
	if ( layoutMode === 'flex' ) features.push( 'flex_container' );
	if ( layoutMode === 'grid' ) features.push( 'grid_container' );
	if ( ! isRoot ) features.push( 'flex_item' );
	return features;
}

/* ------------------------------------------------------------------ deriving */

export function deriveSection( options ) {
	const { key, markup, css, spec = {} } = options;

	const doc = createDocument( markup );
	const rootNode = doc.entries.map( ( e ) => e.node ).find( ( n ) => ! doc.parentsOf.get( n )?.node );
	if ( ! rootNode ) throw new Error( key + ': no root element found' );

	const rootSelector = rootSelectorOf( rootNode );
	const parsedCss = parseStylesheet( css );
	const cssIndex = buildSelectorIndex( parsedCss );
	const tokens = collectTokens( parsedCss ).map( ( t ) => ( {
		...t,
		label: titleCase( t.name ),
	} ) );
	const prefixes = detectClassPrefixes( doc );

	const edits = [];
	const fields = [];      // flat list of scalar content controls
	const repeaters = [];   // repeater definitions
	const parts = [];       // style panels
	const notes = [];       // build-report lines
	const usedIds = new Set();
	const skip = new Set();      // nodes consumed by a repeater
	const textOwned = new Set(); // nodes inside another element's rich-text control

	function uniqueId( base ) {
		let id = slug( base ) || 'f';
		if ( /^[0-9]/.test( id ) ) id = 'f_' + id;
		let candidate = id;
		let n = 2;
		while ( usedIds.has( candidate ) ) {
			candidate = id + '_' + n;
			n += 1;
		}
		usedIds.add( candidate );
		return candidate;
	}

	const overrides = spec.overrides || {};
	const hidden = new Set( spec.hideParts || [] );

	/* ---------------------------------------------------------- repeaters */

	// Repeaters are resolved FIRST. A run that cannot be proved to round-trip
	// is rejected here, and its items then fall through to the ordinary
	// per-element treatment below -- so a rejected repeater costs a nicer panel,
	// never a loss of editability or of markup.
	const bareEdits = [];
	const accepted = [];
	for ( const group of detectRepeaters( doc, rootNode, spec ) ) {
		// Elementor repeaters do not nest. A run inside an already-accepted
		// repeater is skipped: its values are still bound individually inside
		// the outer row template, so nothing becomes uneditable.
		const nested = accepted.some( ( outer ) =>
			outer.nodes.some( ( item ) => group.nodes.some( ( inner ) => contains( doc, item, inner ) ) )
		);
		if ( nested ) continue;

		const built = buildRepeater( doc, group, { uniqueId, markup, notes } );
		if ( ! built ) continue;
		accepted.push( group );
		repeaters.push( built.definition );
		edits.push( built.edit );
		bareEdits.push( built.editBare );
	}

	// Everything an accepted repeater owns: the item roots and all their
	// descendants. The repeater rewrites that whole range in one edit, so no
	// other edit may land inside it -- and only the first item contributes style
	// parts, since every item shares one class selector.
	const repeaterOwned = new Set();
	const duplicateItems = new Set();
	for ( const group of accepted ) {
		group.nodes.forEach( ( item, index ) => {
			for ( const { node } of doc.entries ) {
				if ( ! contains( doc, item, node ) ) continue;
				repeaterOwned.add( node );
				if ( index > 0 ) duplicateItems.add( node );
			}
		} );
	}

	/* ------------------------------------------------------ node processing */

	const orderedEntries = doc.entries.filter( ( e ) => {
		const tag = e.node.tagName.toLowerCase();
		if ( SVG_INTERNALS.has( tag ) ) return false;
		return true;
	} );

	const partBySelector = new Map();
	const partByNode = new Map();

	for ( const entry of orderedEntries ) {
		const node = entry.node;
		if ( skip.has( node ) || duplicateItems.has( node ) ) continue;

		const insideRepeater = repeaterOwned.has( node );
		const isRepeaterItem = accepted.some( ( g ) => g.nodes[ 0 ] === node );
		const isRoot = node === rootNode;

		const selectorInfo = isRoot ? { selector: '', shared: false } : buildSelector( doc, node, rootNode );
		const fullSelector = isRoot ? rootSelector : rootSelector + ' ' + selectorInfo.selector;
		const layoutMode = layoutModeFor( cssIndex, normalizeSelector( fullSelector ) );

		// A panel is far easier to find by the words it contains than by a class
		// name, so text-bearing elements carry a short preview of their own copy.
		const baseLabel = isRoot
			? 'Section'
			: overrides[ selectorInfo.selector ]?.label || humanizeClass( namingClass( node ), prefixes );
		// Only leaf text elements get a preview. On a wrapper it would just be the
		// whole subtree's copy run together, which is noise.
		const sample = ! isRoot && isTextual( node, { allowLinks: true } )
			? previewText( innerText( node ), 28 )
			: '';
		const label = sample && ! overrides[ selectorInfo.selector ]?.label
			? baseLabel + ' — ' + sample
			: baseLabel;

		// --- style part -------------------------------------------------
		const partId = uniqueId( 'p_' + ( isRoot ? 'section' : ( slug( selectorInfo.selector ) || node.tagName ) ) );
		if ( ! hidden.has( selectorInfo.selector ) && ! partBySelector.has( selectorInfo.selector ) ) {
			// The Elementor panel has no control search, so a section with 70-odd
			// style panels needs its list to be scannable. Panels are in document
			// order and each carries its nearest named ancestor, which groups
			// related elements together visually: "Form card > Submit".
			const parentLabel = nearestPartLabel( doc, node, partByNode );

			const part = {
				id: partId,
				label: parentLabel && parentLabel !== baseLabel ? parentLabel + ' › ' + label : label,
				short_label: baseLabel,
				selector: isRoot ? '' : selectorInfo.selector,
				tag: node.tagName.toLowerCase(),
				features: overrides[ selectorInfo.selector ]?.features || featuresFor( node, layoutMode, isRoot ),
				shared: !! selectorInfo.shared,
				repeater: isRepeaterItem ? accepted.find( ( g ) => g.nodes[ 0 ] === node ).id : null,
			};
			parts.push( part );
			partBySelector.set( selectorInfo.selector, part );
			partByNode.set( node, part );
		}

		// --- content ----------------------------------------------------
		if ( ! insideRepeater && ! textOwned.has( node ) ) {
			const consumedSubtree = collectContent( node, {
				prefixLabel: label,
				group: partId,
				push: ( field, edit ) => {
					fields.push( field );
					if ( edit ) edits.push( edit );
				},
				uniqueId,
			} );

			// When an element's whole inner range became one rich-text control,
			// its descendants are inside that control's text. Binding them again
			// would produce overlapping edits, so they are claimed here.
			if ( consumedSubtree ) {
				for ( const { node: descendant } of doc.entries ) {
					if ( descendant !== node && contains( doc, node, descendant ) ) textOwned.add( descendant );
				}
			}
		}
	}

	/* --------------------------------------------------------- assemble */

	const template = splice( markup, edits );
	// Identical template minus the Elementor repeater-item classes. build.mjs
	// renders THIS one to prove the compiler reproduces the source byte for byte.
	const templateBare = splice( markup, edits.filter( ( e ) => ! bareEdits.some( ( b ) => b.start === e.start && b.end === e.end ) ).concat( bareEdits ) );

	return {
		rootSelector,
		tokens,
		fields,
		repeaters,
		parts,
		template,
		templateBare,
		notes,
		prefixes,
	};

	/* ------------------------------------------------------ inner helpers */

	function collectContent( node, ctx ) {
		const tag = node.tagName.toLowerCase();
		let consumedSubtree = false;

		// Editable inner content. Two shapes: an element whose content is one
		// editable block, or an element mixing text with styled children -- in
		// which case each loose text run gets its own control so nothing is
		// left uneditable.
		if ( ! [ 'script', 'style', 'option' ].includes( tag ) ) {
			if ( isTextual( node, { allowLinks: false } ) ) {
				consumedSubtree = true;
				const range = innerRange( node );
				const raw = markup.slice( range.start, range.end );
				const leading = raw.match( /^\s*/ )[ 0 ];
				const trailing = raw.length > leading.length ? raw.match( /\s*$/ )[ 0 ] : '';
				const value = raw.slice( leading.length, raw.length - trailing.length );
				if ( value ) {
					const hasMarkup = /<[a-zA-Z]/.test( value );
					const id = ctx.uniqueId( ctx.prefixLabel + '_text' );
					ctx.push(
						{
							id,
							control: hasMarkup || value.length > 90 ? 'textarea' : 'text',
							label: ctx.prefixLabel,
							description: hasMarkup ? 'Inline formatting tags are preserved.' : '',
							default: value,
							esc: 'post',
							group: ctx.group,
							sort: 0,
						},
						{ start: range.start + leading.length, end: range.end - trailing.length, replacement: phpEcho( id ) }
					);
				}
			} else {
				let runIndex = 0;
				for ( const child of children( node ) ) {
					if ( ! isTextNode( child ) || ! child.value.trim() ) continue;
					const location = child.sourceCodeLocation;
					if ( ! location ) continue;
					const raw = markup.slice( location.startOffset, location.endOffset );
					const leading = raw.match( /^\s*/ )[ 0 ];
					const trailing = raw.match( /\s*$/ )[ 0 ];
					const value = raw.slice( leading.length, raw.length - trailing.length );
					if ( ! value ) continue;
					runIndex += 1;
					const id = ctx.uniqueId( ctx.prefixLabel + '_text' + ( runIndex > 1 ? '_' + runIndex : '' ) );
					ctx.push(
						{
							id,
							control: value.length > 90 ? 'textarea' : 'text',
							label: ctx.prefixLabel + ( runIndex > 1 ? ' (part ' + runIndex + ')' : '' ),
							default: value,
							esc: 'post',
							group: ctx.group,
							sort: 0,
						},
						{
							start: location.startOffset + leading.length,
							end: location.endOffset - trailing.length,
							replacement: phpEcho( id ),
						}
					);
				}
			}
		}

		// Attributes.
		for ( const a of node.attrs || [] ) {
			const name = a.name.toLowerCase();
			if ( LOCKED_ATTRS.has( name ) ) continue;
			if ( name === 'value' && tag === 'option' ) continue; // handled by the option repeater
			const range = attrValueRange( markup, node, name );
			if ( ! range ) continue; // valueless boolean attribute

			const info = classifyAttr( name, node, a.value );
			if ( ! info ) continue;

			const id = ctx.uniqueId( ctx.prefixLabel + '_' + name );
			ctx.push(
				{
					id,
					control: info.control,
					label: ctx.prefixLabel + ' – ' + titleCase( name.replace( /^data-/, '' ) ),
					default: info.control === 'url' || info.control === 'media' ? { url: a.value } : a.value,
					options: info.options,
					esc: info.esc,
					group: info.tab === 'content' ? ctx.group : info.tab,
					tab: info.tab,
					sort: 1,
				},
				{ start: range.start, end: range.end, replacement: phpEcho( id ) }
			);
		}

		// Inline style. It is NOT hoisted into the stylesheet: an inline
		// declaration beats anything Elementor can generate, so hoisting would
		// need specificity tricks and could reorder the cascade. Instead each
		// declaration becomes its own control and the attribute is rebuilt from
		// them, preserving the author's exact spacing and semicolons.
		const styleValue = attr( node, 'style' );
		if ( styleValue && styleValue.trim() ) {
			const range = attrValueRange( markup, node, 'style' );
			const raw = markup.slice( range.start, range.end );
			const declarations = splitInlineStyle( raw );
			const groupId = ctx.uniqueId( ctx.prefixLabel + '_inline_style' );
			const pieces = [];
			let cursor = 0;

			for ( const decl of declarations ) {
				const map = INLINE_STYLE_CONTROLS[ decl.prop.toLowerCase() ] || { type: 'text' };
				const id = ctx.uniqueId( ctx.prefixLabel + '_css_' + decl.prop );
				ctx.push( {
					id,
					control: map.type,
					label: ctx.prefixLabel + ' – ' + titleCase( decl.prop ),
					description: 'Inline style on the element itself; overrides any CSS rule.',
					default: decl.value,
					options: map.options,
					esc: 'attr',
					group: ctx.group,
					tab: 'inline_style',
					sort: 3,
				}, null );
				pieces.push( { prefix: raw.slice( cursor, decl.valueStart ), id } );
				cursor = decl.valueEnd;
			}

			edits.push( {
				start: range.start,
				end: range.end,
				replacement: '<?php echo $s[' + phpString( groupId ) + ']; ?>',
			} );

			fields.push( {
				id: groupId,
				control: 'inline_style_group',
				declarations: pieces,
				tail: raw.slice( cursor ),
				internal: true,
			} );
		}

		return consumedSubtree;
	}

	function classifyAttr( name, node, value ) {
		if ( isIntegrationAttr( name, node ) ) {
			return { control: 'text', esc: 'attr', tab: 'integration' };
		}
		if ( URL_ATTRS.has( name ) ) return { control: 'url', esc: 'url', tab: 'content' };
		if ( MEDIA_ATTRS.has( name ) ) {
			const isVideo = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test( value ) || node.tagName === 'source';
			return { control: isVideo ? 'url' : 'media', esc: 'url', tab: 'content' };
		}
		if ( TEXT_ATTRS.has( name ) ) return { control: 'text', esc: 'attr', tab: 'content' };
		if ( FORM_ATTRS.has( name ) ) return { control: 'text', esc: 'attr', tab: 'form' };
		if ( MEDIA_BEHAVIOUR_ATTRS.has( name ) ) return { control: 'text', esc: 'attr', tab: 'behaviour' };
		if ( name.startsWith( 'data-' ) ) return { control: 'text', esc: 'attr', tab: 'behaviour' };
		return null;
	}
}

/**
 * The label of the closest ancestor that already has its own style panel, so a
 * panel can say where in the section it sits. The section root is skipped --
 * prefixing everything with "Section" would say nothing.
 */
function nearestPartLabel( doc, node, partByNode ) {
	let current = doc.parentsOf.get( node )?.node;

	while ( current ) {
		const part = partByNode.get( current );
		if ( part && 'Section' !== part.short_label ) return part.short_label;
		current = doc.parentsOf.get( current )?.node;
	}

	return '';
}

function contains( doc, ancestor, node ) {
	let current = node;
	while ( current ) {
		if ( current === ancestor ) return true;
		current = doc.parentsOf.get( current )?.node;
	}
	return false;
}

/* ------------------------------------------------------------- repeaters */

/**
 * A repeater is a run of two or more consecutive sibling elements with the same
 * tag and the same class signature. `<option>` runs qualify too, which is what
 * keeps the inquiry form's 235 options out of the style panel.
 */
function detectRepeaters( doc, rootNode, spec ) {
	const groups = [];
	const disable = new Set( spec.noRepeat || [] );

	for ( const entry of doc.entries ) {
		// A drawing's <path>/<line> siblings are not a list, and neither is a run
		// of <em>/<strong> inside a sentence.
		if ( SVG_INTERNALS.has( entry.node.tagName.toLowerCase() ) || entry.node.tagName.toLowerCase() === 'svg' ) continue;

		const kids = elementChildren( entry.node ).filter( ( kid ) => ! SVG_INTERNALS.has( kid.tagName.toLowerCase() ) );
		if ( kids.length < 2 ) continue;

		let run = [ kids[ 0 ] ];
		const flush = () => {
			if ( run.length >= 2 && isListLike( run[ 0 ] ) ) {
				const signature = repeaterSignature( run[ 0 ] );
				if ( ! disable.has( signature ) ) {
					groups.push( { id: slug( signature ) || 'items', nodes: [ ...run ], parent: entry.node, signature } );
				}
			}
			run = [];
		};

		for ( let i = 1; i < kids.length; i += 1 ) {
			const sameShape = repeaterSignature( kids[ i ] ) === repeaterSignature( kids[ i - 1 ] );
			// Items must also be CONTIGUOUS. Two <span class="fc-jrn-nm"> with a
			// sentence between them are names inside a paragraph, not a list, and
			// treating them as a run would pull that prose into the loop.
			if ( sameShape && gapIsSeparatorOnly( doc.source, kids[ i - 1 ], kids[ i ] ) ) {
				run.push( kids[ i ] );
			} else {
				flush();
				run = [ kids[ i ] ];
			}
		}
		flush();
	}

	// De-duplicate ids.
	const seen = new Map();
	for ( const group of groups ) {
		const n = ( seen.get( group.id ) || 0 ) + 1;
		seen.set( group.id, n );
		if ( n > 1 ) group.id = group.id + '_' + n;
	}
	return groups;
}

/**
 * True when the text between two sibling elements is only whitespace and HTML
 * comments -- i.e. they really are consecutive items in a list.
 */
function gapIsSeparatorOnly( source, previous, next ) {
	const gap = source.slice( outerRange( previous ).end, outerRange( next ).start );
	return /^(?:\s|<!--[\s\S]*?-->)*$/.test( gap );
}

/** Inline formatting tags with no class of their own are prose, not list items. */
const INLINE_FORMATTING = new Set( [ 'em', 'strong', 'b', 'i', 'u', 'small', 'sup', 'sub', 'mark', 'code', 'abbr', 'br', 'wbr' ] );

function isListLike( node ) {
	const tag = node.tagName.toLowerCase();
	if ( INLINE_FORMATTING.has( tag ) ) return false;
	if ( ( tag === 'span' || tag === 'a' ) && ! classList( node ).length ) return false;
	return true;
}

function repeaterSignature( node ) {
	const classes = classList( node ).slice().sort().join( '.' );
	return node.tagName.toLowerCase() + ( classes ? '.' + classes : '' );
}

/**
 * Build a repeater from a detected run. The first item becomes the row
 * template; every item is then re-rendered from its own extracted values and
 * compared byte-for-byte with the original. If any item fails to reproduce, the
 * repeater is rejected and the caller keeps the markup flat -- an item that
 * differs structurally is exactly the case that used to silently lose content.
 */
function buildRepeater( doc, group, ctx ) {
	const { markup } = ctx;
	const template = group.nodes[ 0 ];
	const reject = ( reason ) => {
		ctx.notes.push( 'repeater "' + group.id + '" (x' + group.nodes.length + ') rejected: ' + reason );
		return null;
	};

	// Which attributes appear on EVERY item at a given position. One that does
	// not (a `disabled selected` only on the placeholder option, an
	// `aria-required` only on the first consent row) is bound as a whole
	// attribute, so a row can carry it or omit it.
	const attrPresence = mapAttributePresence( doc, group.nodes, markup );
	// Where the items' internal shape diverges -- the accordion gives each item a
	// different icon, one with two <path>s and one with one -- the shallowest
	// divergent element's contents become a single per-row markup value. That
	// keeps the surrounding text controls intact instead of rejecting the whole
	// repeater.
	const opaquePaths = findOpaquePaths( group.nodes );
	const bindings = collectRepeaterBindings( doc, template, markup, attrPresence, opaquePaths );
	if ( ! bindings.length ) return reject( 'no editable values found in the first item' );


	const templateRange = outerRange( template );
	const templateSource = markup.slice( templateRange.start, templateRange.end );
	const bindingEdits = bindings.map( ( b ) => ( {
		start: b.range.start - templateRange.start,
		end: b.range.end - templateRange.start,
		replacement: phpEchoItem( b.id ),
	} ) );

	// Two variants: `bare` is what the round-trip assertion compares against;
	// the emitted one additionally carries the repeater-item class Elementor
	// needs for {{CURRENT_ITEM}}. Both come from one splice so offsets stay
	// anchored to the original source.
	const rowTemplateBare = splice( templateSource, bindingEdits );
	const rowTemplate = splice( templateSource, bindingEdits.concat( [ itemClassEdit( markup, template, templateRange ) ] ) );

	// Extract each row and verify it round-trips.
	const rows = [];
	for ( let index = 0; index < group.nodes.length; index += 1 ) {
		const node = group.nodes[ index ];
		const values = extractRowValues( doc, node, template, bindings, markup );
		if ( ! values ) return reject( 'item ' + ( index + 1 ) + ' has a different shape from item 1 -- ' + lastExtractFailure );
		const rendered = renderRow( rowTemplateBare, bindings, values );
		const original = outerHtml( markup, node );
		if ( rendered !== original ) {
			const at = firstDiff( rendered, original );
			const window = ( text ) => JSON.stringify( text.slice( Math.max( 0, at - 40 ), at + 40 ) );
			return reject(
				'item ' + ( index + 1 ) + ' does not round-trip; first difference at char ' + at +
				'\n      template -> ' + window( rendered ) +
				'\n      source   -> ' + window( original )
			);
		}
		rows.push( values );
	}

	// An opaque binding is meant for a small divergence -- one item's icon has an
	// extra <path>. When it swallows something substantial the repeater stops
	// being an editing win: the row becomes a wall of raw HTML and the structure
	// inside it loses its own controls. The size that matters is the LARGEST row,
	// not the template's: the inquiry form's first field is a short text input
	// while its fifth holds a 200-option country list.
	const OPAQUE_LIMIT = 600;
	for ( const binding of bindings ) {
		if ( 'opaque' !== binding.kind ) continue;
		const longest = rows.reduce( ( max, row ) => Math.max( max, String( row[ binding.id ] || '' ).length ), 0 );
		if ( longest > OPAQUE_LIMIT ) {
			return reject(
				'items differ too deeply -- "' + binding.label + '" would become ' + longest +
				' characters of raw markup on one row'
			);
		}
	}

	// Whitespace between items must be preserved by the loop.
	const separators = [];
	for ( let i = 1; i < group.nodes.length; i += 1 ) {
		const previous = outerRange( group.nodes[ i - 1 ] );
		const current = outerRange( group.nodes[ i ] );
		separators.push( markup.slice( previous.end, current.start ) );
	}
	const uniqueSeparators = [ ...new Set( separators ) ];
	// A uniform gap is emitted as a literal. When the gaps differ -- usually a
	// numbered comment such as `<!-- Slide 3 -->` -- each row carries its own,
	// so those comments survive instead of being flattened onto one value.
	const perRowSeparator = uniqueSeparators.length > 1;
	const separator = uniqueSeparators[ 0 ] ?? '\n';
	if ( perRowSeparator ) {
		rows.forEach( ( row, index ) => {
			row._uew_sep = index === 0 ? '' : separators[ index - 1 ];
		} );
	}

	const first = outerRange( group.nodes[ 0 ] );
	const last = outerRange( group.nodes[ group.nodes.length - 1 ] );

	const id = ctx.uniqueId( 'rep_' + group.id );

	// Values that are just "<prefix><row number><suffix>" -- the accordion's
	// fc-det-btn-1..5 wiring, for instance -- become an expression on the row
	// index instead of stored data. Adding a row in Elementor then produces
	// correctly numbered, unique ids rather than a duplicate that would break
	// the aria-controls pairing.
	const indexed = detectIndexPatterns( bindings, rows );
	let finalTemplate = rowTemplate;
	let finalTemplateBare = rowTemplateBare;
	for ( const entry of indexed ) {
		const expression = '<?php echo ' + phpString( entry.prefix ) + " . \$it['_uew_n'] . " + phpString( entry.suffix ) + '; ?>';
		finalTemplate = finalTemplate.split( phpEchoItem( entry.id ) ).join( expression );
		finalTemplateBare = finalTemplateBare.split( phpEchoItem( entry.id ) ).join( expression );
		rows.forEach( ( row ) => delete row[ entry.id ] );
	}
	// `_uew_n` is supplied by the runtime from the loop position, not stored per
	// row, so an added or reordered row always numbers itself correctly.
	const indexedIds = new Set( indexed.map( ( entry ) => entry.id ) );

	const labelBinding = pickLabelBinding( bindings.filter( ( b ) => ! indexedIds.has( b.id ) ) );

	const makeLoop = ( body ) =>
		'<?php $__i = 0; foreach ( $r[' + phpString( id ) + '] as $it ) : ' +
		( perRowSeparator
			? "if ( $__i ++ ) { echo $it['_uew_sep']; } ?>"
			: 'if ( $__i ++ ) { echo ' + phpString( separator ) + '; } ?>' ) +
		body +
		'<?php endforeach; ?>';

	return {
		definition: {
			id,
			label: titleCase( group.id.replace( /_/g, ' ' ) ),
			item_label: labelBinding ? '{{{ ' + labelBinding.id + ' }}}' : '',
			controls: bindings
				.filter( ( b ) => ! indexedIds.has( b.id ) )
				.map( ( b ) => ( {
					id: b.id,
					control: b.control,
					label: b.label,
					esc: b.esc,
					options: b.options,
					default: rows.length ? rows[ 0 ][ b.id ] : '',
				} ) )
				.concat( perRowSeparator ? [ {
					id: '_uew_sep',
					control: 'hidden',
					label: 'Separator markup',
					esc: 'raw',
					default: separator,
				} ] : [] ),
			rows,
			// Only a class-bearing item can be styled as a group; an <option> or a
			// bare hidden <input> has nothing to hang a rule on.
			selector: ( group.signature.startsWith( 'option' ) || ! classList( template ).length )
				? null
				: '.' + classList( template ).sort().join( '.' ),
		},
		edit: { start: first.start, end: last.end, replacement: makeLoop( finalTemplate ) },
		// Same loop without the repeater-item class, so the build can compute the
		// exact markup the template is expected to reproduce from its defaults.
		editBare: { start: first.start, end: last.end, replacement: makeLoop( finalTemplateBare ) },
	};
}

/** The row control most worth showing as the repeater item's title. */
function pickLabelBinding( bindings ) {
	return (
		bindings.find( ( b ) => b.kind === 'inner' && b.control === 'text' ) ||
		bindings.find( ( b ) => b.kind === 'inner' || b.kind === 'text_run' ) ||
		bindings.find( ( b ) => b.control === 'text' ) ||
		null
	);
}

/**
 * Find bindings whose value across the rows is exactly `<prefix><n><suffix>`
 * with n counting from 1. Those are mechanical (ids, aria wiring), not content.
 */
function detectIndexPatterns( bindings, rows ) {
	if ( rows.length < 2 ) return [];
	const found = [];

	for ( const binding of bindings ) {
		if ( binding.kind !== 'attr' ) continue;
		const values = rows.map( ( row ) => row[ binding.id ] );
		if ( values.some( ( value ) => typeof value !== 'string' ) ) continue;

		const first = values[ 0 ];
		const position = first.indexOf( '1' );
		if ( position < 0 ) continue;

		const prefix = first.slice( 0, position );
		const suffix = first.slice( position + 1 );
		const matches = values.every( ( value, index ) => value === prefix + ( index + 1 ) + suffix );
		if ( matches ) found.push( { id: binding.id, prefix, suffix } );
	}

	return found;
}

/**
 * Walk every item in lockstep and return the paths where their internal shape
 * stops matching. Those elements' contents become one per-row markup value.
 *
 * "Shape" counts element children by tag plus the number of comment children --
 * enough to spot a missing `<span>`, an extra `<path>` or a note that only one
 * item carries, without being upset by whitespace.
 */
function findOpaquePaths( nodes ) {
	const opaque = new Set();

	const shapeOf = ( node ) =>
		elementChildren( node ).map( ( c ) => c.tagName.toLowerCase() ).join( ',' ) +
		'|' + children( node ).filter( isComment ).length;

	const walk = ( path ) => {
		const targets = nodes.map( ( node ) => nodeAtPath( node, path ) );
		if ( targets.some( ( t ) => ! t ) ) return;

		const shapes = new Set( targets.map( shapeOf ) );
		if ( shapes.size > 1 ) {
			opaque.add( path.join( '.' ) );
			return;
		}

		const count = elementChildren( targets[ 0 ] ).length;
		for ( let i = 0; i < count; i += 1 ) walk( path.concat( i ) );
	};

	walk( [] );
	return opaque;
}

/**
 * For every element position inside a repeater's items, record which attributes
 * are present on all of them. An attribute that only some rows carry has to be
 * bound whole (name and value together) so a row can leave it out.
 */
function mapAttributePresence( doc, nodes, markup ) {
	const counts = new Map();

	const visit = ( node, path ) => {
		const key = path.join( '.' );
		if ( ! counts.has( key ) ) counts.set( key, new Map() );
		const bucket = counts.get( key );
		for ( const a of node.attrs || [] ) {
			const name = a.name.toLowerCase();
			bucket.set( name, ( bucket.get( name ) || 0 ) + 1 );
		}
		elementChildren( node ).forEach( ( child, index ) => visit( child, path.concat( index ) ) );
	};

	nodes.forEach( ( node ) => visit( node, [] ) );

	return { counts, total: nodes.length };
}

/**
 * The `elementor-repeater-item-<id>` class Elementor needs to resolve
 * `{{CURRENT_ITEM}}`, which is what makes per-row style overrides possible.
 * It goes INSIDE the existing class attribute -- appending it before the `>`
 * would produce a bogus bare attribute instead of a class.
 */
function itemClassEdit( markup, template, templateRange ) {
	const marker = "<?php echo $it['_uew_item_class']; ?>";
	const classRange = attrValueRange( markup, template, 'class' );

	if ( classRange ) {
		const at = classRange.end - templateRange.start;
		return { start: at, end: at, replacement: ' ' + marker };
	}

	const at = startTagInsertOffset( markup, template ) - templateRange.start;
	return { start: at, end: at, replacement: ' class="' + marker + '"' };
}

function collectRepeaterBindings( doc, template, markup, presence, opaquePaths ) {
	const bindings = [];
	const seen = new Set();

	const visit = ( node, path ) => {
		const tag = node.tagName.toLowerCase();

		// Divergent subtree: bind its contents whole and stop descending. The
		// element's own tag, class and attributes still come from the template,
		// so the CSS hooks survive; only what is inside it varies per row.
		if ( opaquePaths && opaquePaths.has( path.join( '.' ) ) ) {
			const range = innerRange( node );
			if ( range.end > range.start ) {
				bindings.push( {
					id: uniqueBinding( labelFor( node, tag ) + '_markup', bindings, seen ),
					control: 'textarea',
					label: titleCase( labelFor( node, tag ) ) + ' markup (HTML)',
					esc: 'raw',
					range: { start: range.start, end: range.end },
					kind: 'opaque',
					node,
				} );
			}
			bindItemAttributes( node, path );
			return;
		}

		// Inside a repeater the drawing itself can vary per row -- the Travel
		// Essentials accordion gives every item a different icon -- so an SVG's
		// geometry is bound as hidden per-row data rather than skipped.
		if ( SVG_INTERNALS.has( tag ) ) {
			for ( const a of node.attrs || [] ) {
				const name = a.name.toLowerCase();
				if ( ! SVG_GEOMETRY_ATTRS.has( name ) ) continue;
				const range = attrValueRange( markup, node, name );
				if ( ! range ) continue;
				bindings.push( {
					id: uniqueBinding( 'icon_' + slug( name ), bindings, seen ),
					control: 'hidden',
					label: 'Icon ' + titleCase( name ),
					esc: 'attr',
					range: { start: range.start, end: range.end },
					kind: 'attr',
					attr: name,
					node,
				} );
			}
			elementChildren( node ).forEach( ( child, index ) => visit( child, path.concat( index ) ) );
			return;
		}

		// An element whose whole inner range becomes one control owns its
		// subtree; recursing into it would bind the same bytes twice.
		let consumedSubtree = false;

		if ( isTextual( node, { allowLinks: false } ) && tag !== 'option' ) {
			consumedSubtree = true;
			const range = innerRange( node );
			const raw = markup.slice( range.start, range.end );
			const leading = raw.match( /^\s*/ )[ 0 ];
			const trailing = raw.length > leading.length ? raw.match( /\s*$/ )[ 0 ] : '';
			const value = raw.slice( leading.length, raw.length - trailing.length );
			if ( value ) {
				const id = uniqueBinding( labelFor( node, tag ), bindings, seen );
				bindings.push( {
					id,
					control: /<[a-zA-Z]/.test( value ) || value.length > 90 ? 'textarea' : 'text',
					label: titleCase( labelFor( node, tag ) ),
					esc: 'post',
					range: { start: range.start + leading.length, end: range.end - trailing.length },
					kind: 'inner',
					node,
				} );
			}
		} else if ( tag !== 'option' ) {
			// Loose text runs beside styled children, so nothing in a row is
			// left uneditable.
			let runIndex = 0;
			for ( const child of children( node ) ) {
				if ( ! isTextNode( child ) || ! child.value.trim() || ! child.sourceCodeLocation ) continue;
				const location = child.sourceCodeLocation;
				const raw = markup.slice( location.startOffset, location.endOffset );
				const leading = raw.match( /^\s*/ )[ 0 ];
				const trailing = raw.match( /\s*$/ )[ 0 ];
				const value = raw.slice( leading.length, raw.length - trailing.length );
				if ( ! value ) continue;
				runIndex += 1;
				const id = uniqueBinding( labelFor( node, tag ), bindings, seen );
				bindings.push( {
					id,
					control: value.length > 90 ? 'textarea' : 'text',
					label: titleCase( labelFor( node, tag ) ),
					esc: 'post',
					range: { start: location.startOffset + leading.length, end: location.endOffset - trailing.length },
					kind: 'text_run',
					textIndex: runIndex,
					node,
				} );
			}
		}

		if ( tag === 'option' ) {
			const range = innerRange( node );
			const id = uniqueBinding( 'label', bindings, seen );
			bindings.push( {
				id, control: 'text', label: 'Label', esc: 'html',
				range: { start: range.start, end: range.end }, kind: 'inner', node,
			} );
		}

		// Comments inside an item are per-row content too. The journey tiles
		// carry `<!-- ★ SWAP: Victoria Falls image -->` / `Chobe`, and dropping
		// the difference would quietly rewrite one tile's note onto the other.
		if ( ! consumedSubtree ) {
			let commentIndex = 0;
			for ( const child of children( node ) ) {
				if ( ! isComment( child ) || ! child.sourceCodeLocation ) continue;
				commentIndex += 1;
				const location = child.sourceCodeLocation;
				const id = uniqueBinding( 'note', bindings, seen );
				bindings.push( {
					id,
					control: 'hidden',
					label: 'Note',
					esc: 'raw',
					range: { start: location.startOffset + 4, end: location.endOffset - 3 },
					kind: 'comment',
					commentIndex,
					node,
				} );
			}
		}

		bindItemAttributes( node, path );

		if ( ! consumedSubtree && tag !== 'option' ) {
			elementChildren( node ).forEach( ( child, index ) => visit( child, path.concat( index ) ) );
		}
	};

	function bindItemAttributes( node, path ) {
		for ( const a of node.attrs || [] ) {
			const name = a.name.toLowerCase();
			// Inside a repeater, wiring attributes (`id`, `for`, `aria-controls`)
			// legitimately differ per row, so they are bound rather than locked.
			// `class` stays locked: it carries the styling hook and the injected
			// repeater-item class.
			if ( REPEATER_LOCKED_ATTRS.has( name ) ) continue;

			const presentOnAll = isPresentOnAll( presence, node, name, path );
			const range = presentOnAll ? attrValueRange( markup, node, name ) : attrWholeRange( markup, node, name );
			if ( ! range ) continue;

			const control =
				! presentOnAll ? 'hidden'
					: URL_ATTRS.has( name ) ? 'url'
						: MEDIA_ATTRS.has( name ) ? 'media'
							: 'text';
			const esc = ( control === 'url' || control === 'media' ) ? 'url' : ( presentOnAll ? 'attr' : 'raw' );
			const id = uniqueBinding( name === 'value' ? 'value' : slug( name ), bindings, seen );
			bindings.push( {
				id,
				control,
				label: presentOnAll ? titleCase( name.replace( /^data-/, '' ) ) : titleCase( name ) + ' (optional attribute)',
				esc,
				range: { start: range.start, end: range.end },
				kind: presentOnAll ? 'attr' : 'attr_whole',
				attr: name,
				node,
			} );
		}
	}

	visit( template, [] );
	return bindings.sort( ( a, b ) => a.range.start - b.range.start );
}

/**
 * Attributes that must never become per-row values. `class` carries the CSS
 * hook and the injected repeater-item class; `style` and SVG geometry describe
 * the drawing rather than the content.
 */
const REPEATER_LOCKED_ATTRS = new Set( [
	'class', 'xmlns', 'preserveaspectratio', 'fill-rule', 'clip-rule',
	'stroke-linecap', 'stroke-linejoin',
] );

/** Shape data on an SVG primitive: per-row content, not styling. */
const SVG_GEOMETRY_ATTRS = new Set( [
	'd', 'points', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'transform',
] );

function isPresentOnAll( presence, node, name, path ) {
	if ( ! presence ) return true;
	const bucket = presence.counts.get( path.join( '.' ) );
	if ( ! bucket ) return true;
	return ( bucket.get( name ) || 0 ) === presence.total;
}

/** A short, human name for a node: its most descriptive class, else its tag. */
function labelFor( node, tag ) {
	const classes = classList( node );
	const own = classes.length ? classes[ classes.length - 1 ] : tag;
	return own.replace( /^[a-z]+-[a-z0-9]+-/, '' ) || tag;
}

function uniqueBinding( base, bindings, seen ) {
	let id = slug( base ) || 'v';
	let candidate = id;
	let n = 2;
	while ( seen.has( candidate ) ) {
		candidate = id + '_' + n;
		n += 1;
	}
	seen.add( candidate );
	return candidate;
}

/**
 * Read one item's values by walking it in lockstep with the template. If the
 * shapes diverge at any point the item is rejected (returns null).
 */
function extractRowValues( doc, node, template, bindings, markup ) {
	const templatePath = new Map();
	bindings.forEach( ( b ) => {
		const path = pathFrom( doc, template, b.node );
		if ( ! path ) return;
		templatePath.set( b.id, { path, binding: b } );
	} );

	const values = {};
	for ( const b of bindings ) {
		const entry = templatePath.get( b.id );
		if ( ! entry ) {
			lastExtractFailure = 'no path for binding "' + b.id + '"';
			return null;
		}
		const target = nodeAtPath( node, entry.path );
		if ( ! target || target.tagName !== b.node.tagName ) {
			lastExtractFailure = 'binding "' + b.id + '" expected <' + b.node.tagName + '> at [' + entry.path.join( ',' ) + '], found ' + ( target ? '<' + target.tagName + '>' : 'nothing' );
			return null;
		}

		if ( b.kind === 'inner' ) {
			const range = innerRange( target );
			const raw = markup.slice( range.start, range.end );
			if ( b.node.tagName === 'option' ) {
				values[ b.id ] = raw;
			} else {
				const leading = raw.match( /^\s*/ )[ 0 ];
				const trailing = raw.length > leading.length ? raw.match( /\s*$/ )[ 0 ] : '';
				values[ b.id ] = raw.slice( leading.length, raw.length - trailing.length );
			}
		} else if ( b.kind === 'text_run' ) {
			const runs = children( target ).filter( ( c ) => isTextNode( c ) && c.value.trim() && c.sourceCodeLocation );
			const run = runs[ b.textIndex - 1 ];
			if ( ! run ) {
				lastExtractFailure = 'binding "' + b.id + '" expected text run ' + b.textIndex + ' inside <' + target.tagName + '>';
				return null;
			}
			const raw = markup.slice( run.sourceCodeLocation.startOffset, run.sourceCodeLocation.endOffset );
			const leading = raw.match( /^\s*/ )[ 0 ];
			const trailing = raw.match( /\s*$/ )[ 0 ];
			values[ b.id ] = raw.slice( leading.length, raw.length - trailing.length );
		} else if ( b.kind === 'opaque' ) {
			const range = innerRange( target );
			values[ b.id ] = markup.slice( range.start, range.end );
		} else if ( b.kind === 'comment' ) {
			const comments = children( target ).filter( ( c ) => isComment( c ) && c.sourceCodeLocation );
			const comment = comments[ b.commentIndex - 1 ];
			if ( ! comment ) {
				lastExtractFailure = 'binding "' + b.id + '" expected comment ' + b.commentIndex + ' inside <' + target.tagName + '>';
				return null;
			}
			values[ b.id ] = markup.slice( comment.sourceCodeLocation.startOffset + 4, comment.sourceCodeLocation.endOffset - 3 );
		} else if ( b.kind === 'attr_whole' ) {
			// Optional attribute: the row stores the whole ` name="value"` or an
			// empty string, so an item that omits it renders identically.
			const range = attrWholeRange( markup, target, b.attr );
			values[ b.id ] = range ? markup.slice( range.start, range.end ) : '';
		} else {
			const range = attrValueRange( markup, target, b.attr );
			if ( ! range ) {
				lastExtractFailure = 'binding "' + b.id + '" needs attribute [' + b.attr + '] which this item does not have';
				return null;
			}
			values[ b.id ] = markup.slice( range.start, range.end );
		}
	}
	return values;
}

let lastExtractFailure = '';

function firstDiff( a, b ) {
	const max = Math.min( a.length, b.length );
	for ( let i = 0; i < max; i += 1 ) {
		if ( a[ i ] !== b[ i ] ) return i;
	}
	return max;
}

function pathFrom( doc, ancestor, node ) {
	const path = [];
	let current = node;
	while ( current && current !== ancestor ) {
		const parentEntry = doc.parentsOf.get( current );
		if ( ! parentEntry || ! parentEntry.node ) return null;
		const index = elementChildren( parentEntry.node ).indexOf( current );
		if ( index < 0 ) return null;
		path.unshift( index );
		current = parentEntry.node;
	}
	return current === ancestor ? path : null;
}

function nodeAtPath( root, path ) {
	let current = root;
	for ( const index of path ) {
		const kids = elementChildren( current );
		if ( index >= kids.length ) return null;
		current = kids[ index ];
	}
	return current;
}

/** Re-render a row template with literal values, for the round-trip assertion. */
function renderRow( rowTemplate, bindings, values ) {
	let out = rowTemplate;
	for ( const b of bindings ) {
		out = out.replace( phpEchoItem( b.id ), values[ b.id ] );
	}
	return out;
}

/* -------------------------------------------------------------- PHP output */

export function phpString( value ) {
	return "'" + String( value ).replace( /\\/g, '\\\\' ).replace( /'/g, "\\'" ) + "'";
}

export function phpEcho( id ) {
	return '<?php echo $c[' + phpString( id ) + ']; ?>';
}

export function phpEchoItem( id ) {
	return '<?php echo $it[' + phpString( id ) + ']; ?>';
}
