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
	startTagInsertOffset, loc,
} from './html.mjs';
import { parseStylesheet, buildSelectorIndex, layoutModeFor, collectTokens, splitInlineStyle, normalizeSelector, animatedProperties, keyframeProperties, layoutModeOfRules } from './css.mjs';

/* ------------------------------------------------------------------- tables */

/** Tags whose internals are drawing instructions, not editable layout. */
const SVG_INTERNALS = new Set( [
	'path', 'line', 'polyline', 'polygon', 'circle', 'ellipse', 'rect', 'g', 'defs', 'use', 'stop',
	'lineargradient', 'radialgradient', 'clippath', 'mask', 'symbol', 'marker', 'filter', 'fegaussianblur',
	'feoffset', 'feblend', 'femerge', 'femergenode', 'title', 'desc', 'animate', 'animatetransform', 'textpath',
] );

const VOID_TAGS = new Set( [ 'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr' ] );

/**
 * Elements that never paint a box of their own. A style panel for a <source>
 * can do nothing -- the browser never renders it -- so they get none, and their
 * content controls (a video source URL) file under the element that holds them.
 */
/**
 * Elements no visitor ever sees: hidden inputs (the HubSpot cookie, the split
 * first and last name), dropdown options (the browser draws those), and the
 * hidden frame a form posts into. Style panels for them were noise -- the
 * contact form alone had eight for hidden inputs.
 */
function isInvisible( node ) {
	const tag = node.tagName.toLowerCase();
	if ( 'input' === tag && 'hidden' === ( attr( node, 'type' ) || '' ).toLowerCase() ) return true;
	if ( 'option' === tag || 'optgroup' === tag ) return true;
	if ( 'iframe' === tag && /display\s*:\s*none/i.test( attr( node, 'style' ) || '' ) ) return true;
	return isScreenReaderOnly( node );
}

/**
 * Text only screen readers get: the visually-hidden pattern (`.umoya-ft-sr`,
 * `.ct-f-sr`, `.sr-only`) that labels a field whose placeholder does the job
 * on screen. Styling it would change nothing anyone sees, and its wording is
 * an accessibility setting, not page copy.
 */
function isScreenReaderOnly( node ) {
	return classList( node ).some( ( cls ) => /(^|-)(sr|sr-only|visually-hidden|screen-reader-text)$/.test( cls ) );
}

/**
 * Text that is only punctuation -- a required-field asterisk, the full stop
 * left over after a link -- is not copy anyone would rewrite. It stays in the
 * markup as written; it just gets no control of its own.
 */
const SYMBOL_ONLY = /^[\s*•·|/—–:;+.,!?-]+$/;

const NON_RENDERED_TAGS = new Set( [ 'source', 'track', 'param', 'br', 'wbr', 'template', 'meta', 'link', 'base', 'noscript' ] );

/** Attributes that are structural: editing them breaks the section's own CSS/JS. */
const LOCKED_ATTRS = new Set( [ 'id', 'class', 'style', 'for', 'aria-controls', 'aria-labelledby', 'aria-describedby', 'role', 'aria-hidden', 'tabindex', 'data-slide', 'data-index', 'viewbox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'd', 'points', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'x', 'y', 'width', 'height', 'preserveaspectratio', 'fill-rule', 'clip-rule' ] );

/** Attributes surfaced on the Content tab as plain text. */
const TEXT_ATTRS = new Set( [ 'alt', 'title', 'aria-label', 'aria-roledescription', 'placeholder', 'label', 'datetime', 'download' ] );

/** Attributes that carry a URL. */
const URL_ATTRS = new Set( [ 'href', 'action', 'formaction', 'cite' ] );

/** Attributes that carry media. */
const MEDIA_ATTRS = new Set( [ 'src', 'poster' ] );

/**
 * The control a media attribute gets. Only an image is chosen from the Media
 * Library; a video file, a <source>, or whatever an <iframe> loads is a link to
 * type in. The homepage film is a YouTube embed -- a library picker would have
 * left no way to paste a new video's link at all.
 */
function mediaControlFor( node, value ) {
	if ( [ 'iframe', 'embed', 'object', 'source' ].includes( node.tagName.toLowerCase() ) ) return 'url';
	return /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test( value || '' ) ? 'url' : 'media';
}

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

/**
 * Attributes with a fixed set of legal values become dropdowns, the way
 * Elementor's own Video widget offers Preload as a select rather than a text
 * box. A free-text field here is an invitation to typo an attribute into
 * silence.
 */
const ATTRIBUTE_OPTIONS = {
	preload: [ 'auto', 'metadata', 'none' ],
	loading: [ 'eager', 'lazy' ],
	decoding: [ 'sync', 'async', 'auto' ],
	fetchpriority: [ 'high', 'low', 'auto' ],
	target: [ '_self', '_blank', '_parent', '_top' ],
	referrerpolicy: [ 'no-referrer', 'no-referrer-when-downgrade', 'origin', 'origin-when-cross-origin', 'same-origin', 'strict-origin', 'strict-origin-when-cross-origin', 'unsafe-url' ],
	crossorigin: [ 'anonymous', 'use-credentials' ],
	method: [ 'get', 'post' ],
	enctype: [ 'application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain' ],
	inputmode: [ 'text', 'numeric', 'tel', 'email', 'url', 'decimal', 'search', 'none' ],
	wrap: [ 'soft', 'hard' ],
};

/** Attributes that describe media behaviour. */
const MEDIA_BEHAVIOUR_ATTRS = new Set( [ 'loading', 'decoding', 'fetchpriority', 'sizes', 'srcset', 'autoplay', 'muted', 'loop', 'playsinline', 'controls', 'preload', 'target', 'rel', 'referrerpolicy', 'allow', 'allowfullscreen', 'frameborder', 'crossorigin' ] );

/* ------------------------------------------------------- boolean attributes */

/**
 * Boolean attributes an element type should be able to toggle, named the way
 * Elementor's own widgets name them.
 *
 * The video row is deliberately Elementor's Video widget vocabulary -- Autoplay,
 * Play On Mobile, Mute, Loop, Player Controls, Download Button -- because that
 * is what an editor coming from the native widget will look for. `playsinline`
 * is what "Play On Mobile" actually means in HTML: without it, iOS takes the
 * video fullscreen instead of playing it in place.
 *
 * A flag listed here but absent from the source is still offered, defaulting to
 * off, so the markup is unchanged until someone switches it on.
 */
const FLAGS_BY_TAG = {
	video: [
		{ attr: 'autoplay', label: 'Autoplay', tab: 'media', description: 'Browsers only allow autoplay while the video is muted.' },
		{ attr: 'muted', label: 'Mute', tab: 'media' },
		{ attr: 'playsinline', label: 'Play On Mobile', tab: 'media', description: 'Without this, iOS opens the video fullscreen instead of playing it in place.' },
		{ attr: 'loop', label: 'Loop', tab: 'media' },
		{ attr: 'controls', label: 'Player Controls', tab: 'media' },
		{ attr: 'disablepictureinpicture', label: 'Disable Picture-in-Picture', tab: 'media' },
	],
	audio: [
		{ attr: 'autoplay', label: 'Autoplay', tab: 'media' },
		{ attr: 'muted', label: 'Mute', tab: 'media' },
		{ attr: 'loop', label: 'Loop', tab: 'media' },
		{ attr: 'controls', label: 'Player Controls', tab: 'media' },
	],
	iframe: [
		{ attr: 'allowfullscreen', label: 'Allow Fullscreen', tab: 'media' },
	],
	input: [
		{ attr: 'required', label: 'Required', tab: 'form' },
		{ attr: 'disabled', label: 'Disabled', tab: 'form' },
		{ attr: 'readonly', label: 'Read Only', tab: 'form' },
		{ attr: 'checked', label: 'Checked By Default', tab: 'form', types: [ 'checkbox', 'radio' ] },
	],
	select: [
		{ attr: 'required', label: 'Required', tab: 'form' },
		{ attr: 'disabled', label: 'Disabled', tab: 'form' },
		{ attr: 'multiple', label: 'Allow Multiple', tab: 'form' },
	],
	textarea: [
		{ attr: 'required', label: 'Required', tab: 'form' },
		{ attr: 'disabled', label: 'Disabled', tab: 'form' },
		{ attr: 'readonly', label: 'Read Only', tab: 'form' },
	],
	form: [
		{ attr: 'novalidate', label: 'Skip Browser Validation', tab: 'form' },
	],
	button: [
		{ attr: 'disabled', label: 'Disabled', tab: 'form' },
	],
};

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
	num: 'Number', ov: 'Overlay', ph: 'Placeholder', pic: 'Picture', pl: 'Place', pri: 'Privilege',
	req: 'Required', sec: 'Section', ss: 'Slideshow', sub: 'Subtitle', tgl: 'Toggle',
	ttl: 'Title', txt: 'Text', vid: 'Video', wrap: 'Wrapper', jrn: 'Journey',
	f2: 'Form', h1: 'Hero', bf: 'Panel', det: 'Details', ben: 'Benefits',
	c: 'Container', n: 'Number', l: 'Label', t: 'Text', p: 'Paragraph', h: 'Heading', li: 'Item',
	inner: 'Inner', outer: 'Outer', body: 'Body', head: 'Header', top: 'Top',
};

/**
 * What an element *is*, in the words Elementor uses for its own widgets.
 *
 * A panel called "Title" or "Icon" is findable; one called "Ttl" or
 * "Rv › Div › Em" is not. Class names are only a hint towards the answer -- the
 * tag is often the better one, so both are consulted, class first.
 */
const ROLE_BY_KEYWORD = [
	[ /(^|-)(eyebrow|eye|kicker|overline)$/, 'Eyebrow' ],
	[ /(^|-)(title|ttl|heading|headline)$/, 'Title' ],
	[ /(^|-)(subtitle|sub|standfirst|deck)$/, 'Subtitle' ],
	[ /(^|-)(lead|intro|body|copy|text|txt|desc|description|p)$/, 'Text' ],
	[ /(^|-)(req|required)$/, 'Required Marker' ],
	[ /(^|-)(grouplabel|group-label)$/, 'Group Label' ],
	[ /(^|-)(flag|note)$/, 'Note' ],
	[ /(^|-)(close|dismiss)$/, 'Close Button' ],
	[ /(^|-)(status|feedback)$/, 'Status Message' ],
	[ /(^|-)(addr|address)$/, 'Address' ],
	[ /(^|-)(fine|fineprint|smallprint|legal)$/, 'Fine Print' ],
	[ /(^|-)(social|socials)$/, 'Social Links' ],
	[ /(^|-)(tagline|slogan|strapline)$/, 'Tagline' ],
	[ /(^|-)(btn|button|cta)$/, 'Button' ],
	[ /(^|-)(link|anchor)$/, 'Link' ],
	[ /(^|-)(img|image|pic|picture|photo)$/, 'Image' ],
	[ /(^|-)(vid|video|player)$/, 'Video' ],
	[ /(^|-)(icon|ico|svg|mark|glyph)$/, 'Icon' ],
	[ /(^|-)(rule|divider|line|hr|sep|separator)$/, 'Divider' ],
	[ /(^|-)(overlay|ov|scrim|veil)$/, 'Overlay' ],
	[ /(^|-)(badge|tag|pill|chip|label|lbl)$/, 'Label' ],
	[ /(^|-)(card|tile|panel)$/, 'Card' ],
	[ /(^|-)(step)$/, 'Step' ],
	[ /(^|-)(offer|ofr)$/, 'Offer' ],
	[ /(^|-)(item|entry)$/, 'Item' ],
	[ /(^|-)(row)$/, 'Row' ],
	[ /(^|-)(list|items|grid|stack)$/, 'List' ],
	[ /(^|-)(nav|menu)$/, 'Navigation' ],
	[ /(^|-)(header|head|hd|hdr|top|masthead)$/, 'Header' ],
	[ /(^|-)(footer|foot|bottom)$/, 'Footer' ],
	[ /(^|-)(wrap|wrapper|inner|outer|container|shell|frame|c)$/, 'Container' ],
	[ /(^|-)(col|column)$/, 'Column' ],
	[ /(^|-)(stats|metrics)$/, 'Stats' ],
	[ /(^|-)(stat|metric|figure)$/, 'Stat' ],
	[ /(^|-)(slide|slideshow|ss|carousel)$/, 'Slide' ],
	[ /(^|-)(dot|dots|bullet)$/, 'Dot' ],
	[ /(^|-)(arw|arrow|prev|next)$/, 'Arrow' ],
	[ /(^|-)(field|input)$/, 'Field' ],
	[ /(^|-)(form)$/, 'Form' ],
	[ /(^|-)(consent)$/, 'Consent' ],
	[ /(^|-)(scroll|cue)$/, 'Scroll Cue' ],
	[ /(^|-)(accordion|acc|toggle|tgl)$/, 'Accordion' ],
	[ /(^|-)(brand|logo)$/, 'Logo' ],
	[ /(^|-)(bg|background)$/, 'Background' ],
	[ /(^|-)(content|main|copy-col)$/, 'Content' ],
];

const ROLE_BY_TAG = {
	h1: 'Heading', h2: 'Heading', h3: 'Heading', h4: 'Heading', h5: 'Heading', h6: 'Heading',
	p: 'Text', span: 'Text', em: 'Italic Text', strong: 'Bold Text', small: 'Small Print', address: 'Address',
	a: 'Link', button: 'Button',
	img: 'Image', video: 'Video', source: 'Video Source', iframe: 'Embed', svg: 'Icon',
	ul: 'List', ol: 'List', li: 'Item', dl: 'List', dt: 'Term', dd: 'Definition',
	form: 'Form', label: 'Label', input: 'Field', select: 'Dropdown', textarea: 'Message',
	fieldset: 'Field Group', legend: 'Legend',
	nav: 'Navigation', header: 'Header', footer: 'Footer', main: 'Content',
	article: 'Card', aside: 'Aside', figure: 'Figure', figcaption: 'Caption',
	blockquote: 'Quote', section: 'Section', div: 'Container',
};

/**
 * What a text box shows for words written with an entity. "Terms &amp;
 * Conditions" reads as code to the person editing it, so `&amp;` is shown as
 * the `&` it means. Only that one: every path that prints these fields --
 * kses, esc_attr, esc_html -- writes a bare `&` back out as `&amp;`, so the
 * page stays byte for byte what it was. Never where it starts something that
 * looks like an entity, which would then be read as one, and never in raw
 * markup, which is printed as it stands.
 */
const READABLE_ESCAPES = new Set( [ 'post', 'attr', 'html' ] );
export function readableText( value, control, esc ) {
	if ( 'string' !== typeof value || ! [ 'text', 'textarea' ].includes( control ) || ! READABLE_ESCAPES.has( esc ) ) return value;
	return value.replace( /&amp;(?![a-zA-Z][a-zA-Z0-9]*;|#[0-9]+;|#x[0-9a-fA-F]+;)/g, '&' );
}

/** Where an icon link goes, by the name a person would say. */
const LINK_DESTINATIONS = [
	[ /instagram\.com/i, 'Instagram' ],
	[ /facebook\.com|fb\.com/i, 'Facebook' ],
	[ /tiktok\.com/i, 'TikTok' ],
	[ /linkedin\.com/i, 'LinkedIn' ],
	[ /youtube\.com|youtu\.be/i, 'YouTube' ],
	[ /(twitter|x)\.com/i, 'X' ],
	[ /pinterest\./i, 'Pinterest' ],
	[ /wa\.me|whatsapp\./i, 'WhatsApp' ],
];

/**
 * What a link or button would be called by someone looking at it: its words,
 * or for an icon-only link, where it goes. Empty when neither says anything.
 */
function actionName( node ) {
	const href = attr( node, 'href' ) || '';
	const destination = LINK_DESTINATIONS.find( ( [ pattern ] ) => pattern.test( href ) );
	if ( destination ) return destination[ 1 ];
	const words = innerText( node ).replace( /\s+/g, ' ' ).trim();
	if ( ! words ) return '';
	return words.length <= 28 ? words : words.slice( 0, 26 ).replace( /\s+\S*$/, '' ) + '…';
}

/** Tags an empty, id-carrying scroll target is made of. */
const ANCHOR_TAGS = new Set( [ 'span', 'div', 'a', 'section', 'b', 'i' ] );

/** The Elementor-style name for an element. */
export function semanticName( node, prefixes ) {
	const tag = node.tagName.toLowerCase();

	// A tick box is a tick box, whatever its class says.
	if ( 'input' === tag ) {
		const type = ( attr( node, 'type' ) || '' ).toLowerCase();
		if ( 'checkbox' === type ) return 'Checkbox';
		if ( 'radio' === type ) return 'Radio Button';
	}

	const textual = isTextual( node, { allowLinks: true } );

	for ( const cls of classList( node ).filter( ( c ) => ! isUtilityClass( c ) ) ) {
		let stem = cls;
		for ( const prefix of prefixes ) {
			if ( stem.startsWith( prefix ) && stem.length > prefix.length ) {
				stem = stem.slice( prefix.length );
				break;
			}
		}
		for ( const [ pattern, role ] of ROLE_BY_KEYWORD ) {
			if ( ! pattern.test( stem ) ) continue;
			// A `-txt` wrapper that holds an eyebrow and a title is the content
			// region, not a piece of text. Calling it Text makes every child read
			// as "Text Eyebrow", "Text Title".
			if ( 'Text' === role && ! textual ) return 'p' === tag ? 'Text' : 'Content';
			// The box around a label and its input is not the input.
			if ( 'Field' === role && ! [ 'input', 'select', 'textarea' ].includes( tag ) ) return 'Field Wrapper';
			return role;
		}
	}

	// An element with an id, no content and no children exists to be scrolled
	// to. Calling it "Text" describes neither what it is nor what it does.
	// A form field or a photo is empty in the same way and is neither.
	if ( ANCHOR_TAGS.has( tag ) && attr( node, 'id' ) && ! elementChildren( node ).length && ! innerText( node ).trim() ) {
		return 'Anchor';
	}

	const byTag = ROLE_BY_TAG[ tag ];

	// An unnamed <div> holding "10" is not a container, it is a piece of text.
	// Calling it Container hides what it is and makes every sibling look alike.
	if ( byTag && GENERIC_ROLES.has( byTag ) && textual ) {
		return 'Text';
	}

	if ( byTag ) return byTag;

	return humanizeClass( namingClass( node ), prefixes );
}

/**
 * Roles that say nothing about what an element is for. They are still used as
 * panel names when there is nothing better, but never as a prefix on a child --
 * "Container Title" is no more informative than "Title".
 */
export const GENERIC_ROLES = new Set( [ 'Container', 'Column', 'Wrapper', 'Section', 'Content' ] );

/** Attribute control labels, in Elementor's wording. */
const ATTRIBUTE_LABELS = {
	src: 'Source',
	href: 'Link',
	poster: 'Poster',
	alt: 'Alt Text',
	title: 'Title Attribute',
	'aria-label': 'Accessible Name',
	'aria-roledescription': 'Accessible Role',
	placeholder: 'Placeholder',
	action: 'Form Action',
	method: 'Method',
	target: 'Link Target',
	rel: 'Link Relationship',
	loading: 'Loading',
	preload: 'Preload',
	type: 'Type',
	name: 'Field Name',
	value: 'Value',
	autocomplete: 'Autocomplete',
	maxlength: 'Maximum Length',
	rows: 'Rows',
	srcset: 'Source Set',
	sizes: 'Sizes',
	allow: 'Permissions',
	referrerpolicy: 'Referrer Policy',
	'data-short': 'Short Label (phones)',
	// The in-page navs (FC, SJ) light up the item whose section is on screen;
	// this holds that section's id, and must match the item's #link.
	'data-s': 'Section to Highlight',
};

function attributeLabel( name, node ) {
	// Checked before the table: `src` is "Source" generally, but on an image it
	// is the picker Elementor's own Image widget calls "Choose Image".
	if ( 'src' === name && 'img' === node.tagName.toLowerCase() ) return 'Choose Image';
	if ( ATTRIBUTE_LABELS[ name ] ) return ATTRIBUTE_LABELS[ name ];

	return titleCase( name.replace( /^data-/, '' ) );
}

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

	const parentNode = parentEntry ? parentEntry.node : rootNode;
	const base = parentNode === rootNode ? '' : buildSelector( doc, parentNode, rootNode ).selector + ' > ';

	// The element's KIND: the same path with every position dropped -- every
	// label in every field of the form, every paragraph of every policy
	// section. Styled together, as Elementor's own Form widget styles "Labels"
	// rather than the third label. Picking each one out by position gave the
	// contact form 60 style panels nobody would open one by one.
	const kind = base.replace( /:nth-of-type\(\d+\)/g, '' ) + tag;
	const kin = doc.queryAll( scope( kind ) );
	if ( kin.length > 1 && kin.includes( node ) && kin.every( ( other ) => other.tagName === node.tagName ) ) {
		return { selector: kind, shared: true, matched: kin };
	}

	// Last resort: positional.
	const sameTag = elementChildren( parentNode ).filter( ( c ) => c.tagName === node.tagName );
	const nth = sameTag.indexOf( node ) + 1;
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

/** Text that forms its own block, so it can be aligned and spaced. */
const TEXT_BLOCK_TAGS = new Set( [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote', 'figcaption', 'legend', 'summary', 'dt', 'dd', 'th', 'td' ] );

/** Text that runs inside a line. */
const INLINE_TEXT_TAGS = new Set( [ 'span', 'strong', 'em', 'b', 'i', 'small', 'cite', 'sup', 'sub', 'mark', 'time', 'abbr', 'q' ] );

/**
 * Which style settings an element gets: the ones that matter for its KIND, the
 * way Elementor's own widgets choose -- a Heading has colour and type, an Image
 * has fit and filters, a Button has colours with a hover state.
 *
 * Every element used to get everything: background with gradient and image,
 * border, shadow, sizing, position, z-index, flex-item rules, text shadow and
 * stroke -- about 130 controls each, most of which no one would reach for on a
 * paragraph. Elementor draws every control in a panel when it opens, hidden or
 * not, so a block of ten elements took two seconds to open, and each pop-out
 * was a scroll. Anything not offered here is one line in the Advanced tab's
 * Custom CSS.
 *
 *   text         colour, font, size, weight, line height, spacing, case, italic
 *   align        text alignment              (a block of text)
 *   fill         background colour           (a box)
 *   border       border and corner radius    (a box)
 *   radius       corner radius alone         (a photo)
 *   shadow       box shadow
 *   padding      inner spacing
 *   margin       outer spacing
 *   measure      max width
 *   min_height   minimum height              (the section itself)
 *   flex_container / grid_container   layout of the children
 *   media_fit    fit, position, height, aspect ratio
 *   filters      brightness, contrast, saturation
 *   svg          stroke, fill, line weight, size
 *   states       hover colours               (links, buttons)
 *   focus        focus border colour         (form fields)
 *   tick         tick colour and box size    (checkboxes, radio buttons)
 *   placeholder_color
 *   effects      opacity
 *   visibility   hide per device
 */
function featuresFor( node, layoutMode, isRoot ) {
	const tag = node.tagName.toLowerCase();
	const layout = 'flex' === layoutMode ? [ 'flex_container' ] : 'grid' === layoutMode ? [ 'grid_container' ] : [];
	const ownText = children( node ).some( ( child ) => isTextNode( child ) && child.value.trim() );

	if ( isRoot ) return [ 'fill', 'border', 'padding', 'min_height', ...layout, 'effects' ];
	if ( 'svg' === tag ) return [ 'svg', 'effects', 'visibility' ];
	if ( 'img' === tag || 'video' === tag ) return [ 'media_fit', 'filters', 'radius', 'shadow', 'margin', 'effects', 'visibility' ];
	if ( 'iframe' === tag ) return [ 'media_fit', 'radius', 'margin', 'effects', 'visibility' ];
	const type = ( attr( node, 'type' ) || '' ).toLowerCase();
	if ( 'input' === tag && ( 'checkbox' === type || 'radio' === type ) ) return [ 'tick', 'margin', 'effects' ];
	if ( 'input' === tag || 'select' === tag || 'textarea' === tag ) {
		return [ 'text', 'placeholder_color', 'fill', 'border', 'padding', 'margin', 'focus', 'effects' ];
	}
	// Links, buttons and blocks of text can be hidden per device -- a second
	// button on phones, say -- the way Elementor hides a whole widget.
	if ( 'a' === tag || 'button' === tag ) {
		return [ 'text', 'fill', 'border', 'shadow', 'padding', 'margin', ...layout, 'states', 'effects', 'visibility' ];
	}
	if ( TEXT_BLOCK_TAGS.has( tag ) || ( ownText && ( 'li' === tag || 'label' === tag ) ) ) {
		return [ 'text', 'align', 'margin', 'effects', 'visibility' ];
	}
	if ( INLINE_TEXT_TAGS.has( tag ) ) return [ 'text', 'effects' ];

	// A box: a wrapper, a card, a column, a list. One that also carries words of
	// its own gets their type settings too.
	return [
		...( ownText ? [ 'text', 'align' ] : [] ),
		'fill', 'border', 'shadow', 'padding', 'margin', 'measure', ...layout, 'effects', 'visibility',
	];
}

/* ------------------------------------------------------------------ deriving */

export function deriveSection( options ) {
	const { key, markup, css, spec = {} } = options;
	const notes = [];       // build-report lines

	const doc = createDocument( markup );

	// A section file can have more than one top-level element: the homepage
	// journey section is preceded by a bare <span id="umoya-journey-anchor">
	// scroll target. Taking the FIRST parentless element made that anchor the
	// styling root, which silently pointed every style selector at an empty
	// span. The root is the top-level element with the most descendants.
	const topLevel = doc.entries.filter( ( e ) => ! doc.parentsOf.get( e.node )?.node );
	if ( ! topLevel.length ) throw new Error( key + ': no root element found' );

	const descendantCount = ( node ) =>
		doc.entries.filter( ( e ) => contains( doc, node, e.node ) ).length;

	const rootNode = topLevel
		.map( ( e ) => ( { node: e.node, size: descendantCount( e.node ) } ) )
		.reduce( ( best, current ) => ( current.size > best.size ? current : best ) ).node;

	if ( topLevel.length > 1 ) {
		notes.push(
			'section has ' + topLevel.length + ' top-level elements; ' +
			rootSelectorOf( rootNode ) + ' is the styling root, the others are styled from the widget wrapper'
		);
	}

	const rootSelector = rootSelectorOf( rootNode );
	const parsedCss = parseStylesheet( css );
	const cssIndex = buildSelectorIndex( parsedCss );
	const prefixes = detectClassPrefixes( doc );
	const tokens = deriveTokens( collectTokens( parsedCss ), prefixes );

	// The top-level element a node lives under. Selectors are built relative to
	// it: a node in a second top-level element (the footer's opt-out dialog) is
	// addressed from that element, never from the section root it is not in.
	const topOf = ( node ) => {
		let current = node;
		while ( doc.parentsOf.get( current )?.node ) current = doc.parentsOf.get( current ).node;
		return current;
	};

	const portals = resolvePortals( doc, spec.portals || [], key );

	// Which stylesheet rules apply to which element, found by matching each
	// rule against the section itself. Comparing selector strings instead
	// missed every rule not written from the root -- `.fc-h1-brand { … }`
	// rather than `#fc-hero .fc-h1-brand` -- so flex containers declared that
	// way got no layout controls, and animated elements went unrecognised.
	const keyframes = keyframeProperties( parsedCss );
	const rulesByNode = new Map();
	for ( const rule of parsedCss.rules ) {
		for ( const selector of rule.selectors ) {
			let matched;
			try {
				matched = doc.queryAll( normalizeSelector( selector ) );
			} catch ( error ) {
				continue; // outside the selector subset this compiler reads
			}
			for ( const node of matched ) {
				if ( ! rulesByNode.has( node ) ) rulesByNode.set( node, [] );
				rulesByNode.get( node ).push( rule );
			}
		}
	}

	const edits = [];
	const fields = [];      // flat list of scalar content controls
	const repeaters = [];   // repeater definitions
	const parts = [];       // style panels
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
	const plans = [];
	const repeaterLabels = [];
	for ( const group of detectRepeaters( doc, rootNode, spec ) ) {
		// Elementor repeaters do not nest. A run inside an already-accepted
		// repeater is skipped: its values are still bound individually inside
		// the outer row template, so nothing becomes uneditable.
		const nested = accepted.some( ( outer ) =>
			outer.nodes.some( ( item ) => group.nodes.some( ( inner ) => contains( doc, item, inner ) ) )
		);
		if ( nested ) continue;

		// Form fields are a contract, not a list. Each field's `name` is what
		// the submission script and the CRM alias table expect; "Add Item" would
		// post a second FNAME, and "Delete" could drop the email field or the
		// POPIA consent box. Such runs stay individually editable instead.
		const field = group.nodes.map( ( item ) => namedFormControl( doc, item ) ).find( Boolean );
		if ( field ) {
			notes.push(
				'repeater "' + group.id + '" (x' + group.nodes.length + ') not offered: its items are form fields (' +
				field + '), which the form script and CRM mapping expect by name'
			);
			continue;
		}

		const plan = buildRepeater( doc, group, { markup, notes, prefixes } );
		if ( ! plan ) continue;

		// The value of an <option> is what the form submits. Say so on the
		// panel, and say more where the registry knows the list must match a
		// HubSpot dropdown property exactly.
		const select = selectOwning( doc, group.nodes[ 0 ] );
		if ( select ) {
			// Keyed by `#id` (two selects on the contact page are both MERGE2)
			// or by field name.
			const notices = spec.optionNotices || {};
			const extra = notices[ '#' + ( attr( select, 'id' ) || '' ) ] || notices[ attr( select, 'name' ) || '' ] || '';
			plan.notice =
				'Each option&rsquo;s <strong>Value</strong> is what the form submits. ' +
				'Edit labels freely; change a value only if whatever receives it expects the new one.' +
				( extra ? '<br><br>' + extra : '' );
		}

		// A list inside a dialog that moves itself to <body> needs its per-row
		// style rules to follow it there; see resolvePortals().
		const portal = portals.find( ( p ) => p.node === topOf( group.nodes[ 0 ] ) );
		plan.portal = portal ? portal.selector : null;

		accepted.push( group );
		plans.push( plan );
	}

	// Lists that must stay the same length -- slides and their dots -- become
	// one repeater rendering in each place. Everything else stays one-to-one.
	for ( const coupled of coupleParallelPlans( doc, plans ) ) {
		const built = emitRepeater( coupled, { uniqueId } );
		built.definition.notice = coupled[ 0 ].notice || '';
		built.definition.portal = coupled[ 0 ].portal;
		if ( coupled.length > 1 ) {
			notes.push(
				'repeater "' + built.definition.id + '" drives ' + coupled.length + ' parallel lists (' +
				coupled.map( ( plan ) => plan.groupId ).join( ' + ' ) + '), so a row adds or removes one of each'
			);
		}
		// Several selects each yield a list of options, so "Options" alone names
		// five different panels. Qualify by the owning element -- its id reads
		// best: fc2Country becomes "Country Options".
		repeaterLabels.push( {
			definition: built.definition,
			owner: doc.parentsOf.get( coupled[ 0 ].nodes[ 0 ] )?.node,
			item: coupled[ 0 ].nodes[ 0 ],
		} );
		repeaters.push( built.definition );
		edits.push( ...built.edits );
		bareEdits.push( ...built.bareEdits );
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
	const nodesOfPart = new Map(); // part id -> every element it styles

	for ( const entry of orderedEntries ) {
		const node = entry.node;
		if ( skip.has( node ) || duplicateItems.has( node ) ) continue;

		const insideRepeater = repeaterOwned.has( node );
		const isRepeaterItem = accepted.some( ( g ) => g.nodes[ 0 ] === node );
		const isRoot = node === rootNode;

		const scopeNode = topOf( node );
		let selectorInfo;
		if ( isRoot ) {
			selectorInfo = { selector: '', shared: false };
		} else if ( scopeNode === rootNode ) {
			selectorInfo = buildSelector( doc, node, rootNode );
		} else if ( node === scopeNode ) {
			// Outside the root -- a sibling scroll anchor, a dialog. Its selector
			// is absolute against the widget wrapper; scoping it under the root
			// would match nothing.
			selectorInfo = { selector: rootSelectorOf( node ), shared: false, absolute: true };
		} else {
			// Inside that sibling. Built relative to it, as the root's own
			// descendants are relative to the root. Taking the element's bare
			// tag or first class instead produced `{{WRAPPER}} p`, which matched
			// every paragraph in the widget, not just the dialog's.
			const inner = buildSelector( doc, node, scopeNode );
			selectorInfo = {
				selector: rootSelectorOf( scopeNode ) + ' ' + inner.selector,
				shared: inner.shared,
				absolute: true,
			};
		}
		const fullSelector = isRoot
			? rootSelector
			: ( selectorInfo.absolute ? selectorInfo.selector : rootSelector + ' ' + selectorInfo.selector );
		const appliedRules = rulesByNode.get( node ) || [];
		const layoutMode = layoutModeOfRules( appliedRules ) || layoutModeFor( cssIndex, normalizeSelector( fullSelector ) );

		// Panels are named the way Elementor names its own -- "Header", "Title",
		// "Icon" -- not after the CSS class that happens to be on the element.
		// The copy preview that used to be appended to the header moves inside the
		// panel as a descriptor, so the header stays scannable but an editor can
		// still tell two "Title" panels apart.
		const baseLabel = isRoot
			? 'Section'
			: overrides[ selectorInfo.selector ]?.label || semanticName( node, prefixes );
		const sample = ! isRoot && isTextual( node, { allowLinks: true } )
			? previewText( innerText( node ), 48 )
			: '';
		const label = baseLabel;

		// --- style part -------------------------------------------------
		//
		// Two elements can resolve to the same selector -- a shared class that
		// matches a run of siblings. Only the first gets a panel, and the rest
		// must file their content controls under THAT panel's id. Minting a fresh
		// id for them left their controls pointing at a panel that was never
		// created, and they fell into an unnamed "Other content" bucket.
		const existingPart = partBySelector.get( selectorInfo.selector );
		const nonRendered = ! isRoot && ( NON_RENDERED_TAGS.has( node.tagName.toLowerCase() ) || isInvisible( node ) );
		const holder = nonRendered ? nearestPart( doc, node, partByNode ) : null;
		const partId = holder
			? holder.id
			: existingPart
				? existingPart.id
				: uniqueId( 'p_' + ( isRoot ? 'section' : ( slug( selectorInfo.selector ) || node.tagName ) ) );

		if ( ! nonRendered ) {
			if ( ! nodesOfPart.has( partId ) ) nodesOfPart.set( partId, [] );
			nodesOfPart.get( partId ).push( node );
		}

		if ( ! hidden.has( selectorInfo.selector ) && ! existingPart && ! nonRendered ) {
			// The Elementor panel has no control search, so a section with 70-odd
			// style panels needs its list to be scannable. Panels are in document
			// order and each carries its nearest named ancestor, which groups
			// related elements together visually: "Form card > Submit".
			const ancestors = ancestorParts( doc, node, partByNode );
			const region = ancestors.find( ( candidate ) => ! GENERIC_ROLES.has( candidate.short_label ) ) || null;
			const parentLabel = region ? region.short_label : '';

			const part = {
				id: partId,
				label,
				short_label: baseLabel,
				parent_label: parentLabel && parentLabel !== baseLabel ? parentLabel : '',
				// Where the element sits, by id: labels repeat ("Field", "Card"),
				// so grouping content panels by label would merge strangers.
				// Build-time only; stripped before the schema is written.
				region_id: region ? region.id : '',
				region_name: region ? region.short_label : '',
				ancestor_ids: ancestors.map( ( ancestor ) => ancestor.id ),
				sample,
				selector: isRoot ? '' : selectorInfo.selector,
				tag: node.tagName.toLowerCase(),
				features: overrides[ selectorInfo.selector ]?.features || featuresFor( node, layoutMode, isRoot ),
				// Properties the element's own keyframe animation drives; their
				// controls have to outrank the animation to arrive at all.
				animated: animatedProperties( appliedRules, keyframes ),
				shared: !! selectorInfo.shared,
				absolute: !! selectorInfo.absolute,
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
				// Ids come from where the element sits in the markup, never from
				// its display name: a saved value must survive a better name.
				// Names once fed the ids, and renaming "Addr" to "Address" would
				// have quietly reset every saved address. `c_` keeps them clear
				// of the style controls' `p_` ids.
				idStem: 'c_' + partId.replace( /^p_/, '' ),
				group: partId,
				push: ( field, edit ) => {
					// The element the field edits, for grouping the Content tab by
					// what is on the page. Build-time only, never written out.
					Object.defineProperty( field, '_node', { value: node, enumerable: false } );
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

	/* -------------------------------------------------- stylesheet photos */

	// A photo painted from the stylesheet has no element of its own to edit:
	// the Our Approach video poster lives on `.fc-vid-ph::before`, so a Style-
	// tab background on the button sits BEHIND it, and the picture could not be
	// changed at all. Each such rule gets an image control aimed at that exact
	// selector, pseudo-element included, filed under the element it paints.
	//
	// Its default is the stylesheet's own URL, so the editor sees the current
	// picture -- unless a media query swaps the image, in which case a default
	// would pin one picture at every width, and the control starts empty.
	for ( const rule of parsedCss.rules ) {
		if ( rule.media ) continue;
		for ( const declaration of rule.declarations ) {
			if ( ! /^background(-image)?$/.test( declaration.prop ) ) continue;
			const photo = declaration.value.match( /url\(\s*(['"]?)(https?:\/\/[^'")\s]+)\1\s*\)/ );
			if ( ! photo ) continue;

			for ( const selector of rule.selectors ) {
				let painted = null;
				try {
					painted = doc.queryAll( normalizeSelector( selector ) )[ 0 ] || null;
				} catch ( error ) {
					painted = null; // outside the selector subset this compiler reads
				}
				if ( ! painted ) {
					notes.push( 'stylesheet photo on "' + selector + '" not offered: no element in the section matches it' );
					continue;
				}

				let owner = painted;
				while ( owner && ! partByNode.get( owner ) ) owner = doc.parentsOf.get( owner )?.node;
				const part = owner ? partByNode.get( owner ) : null;
				// Any background change at a breakpoint means one value cannot
				// stand for every width, so the control starts empty.
				const swapped = parsedCss.rules.some( ( other ) =>
					other.media && other.selectors.includes( selector ) &&
					other.declarations.some( ( d ) => /^background(-image)?$/.test( d.prop ) )
				);

				// Write back EVERY image layer, with only the photo replaced. The
				// 404 paints `radial-gradient(…), url(photo)` in one declaration;
				// writing `url(photo)` alone dropped the brown overlay that keeps
				// its copy legible -- caught by the browser check.
				const layers = backgroundImageLayers( declaration );
				const template = layers.map( ( layer ) => ( layer.includes( photo[ 2 ] ) ? 'url("{{URL}}")' : layer ) ).join( ', ' );

				fields.push( {
					id: uniqueId( 'c_' + ( part ? part.id.replace( /^p_/, '' ) : 'section' ) + '_background_image' ),
					control: 'media',
					label: 'Background Image',
					description: 'Painted from the section stylesheet' +
						( /::?(before|after)/.test( selector ) ? ' as a layer over the element' : '' ) +
						( layers.length > 1 ? ', under its overlay' : '' ) +
						'. Choosing an image here replaces the photo' + ( layers.length > 1 ? ' and keeps the overlay.' : '.' ),
					default: { url: swapped ? '' : photo[ 2 ] },
					css_selector: selector,
					css_value: 'background-image: ' + template + ';',
					css_only: true,
					esc: 'url',
					group: part ? part.id : ( parts[ 0 ] ? parts[ 0 ].id : 'content' ),
					sort: 2,
				} );
				Object.defineProperty( fields[ fields.length - 1 ], '_node', { value: painted, enumerable: false } );
			}
		}
	}

	/* ------------------------------------------------------------ portals */

	// The instance hook on each element the section's script moves to <body>.
	// It renders as ` data-uew-for="<element id>"` on the page and as nothing
	// in the fidelity check, so the template still reproduces its source
	// exactly. Zero-width, so it cannot overlap an attribute edit.
	for ( const portal of portals ) {
		const at = startTagInsertOffset( markup, portal.node );
		edits.push( { start: at, end: at, replacement: "<?php echo $c['_uew_for']; ?>" } );
	}

	/* --------------------------------------------------------- assemble */

	// Panel names are assigned last, once every part is known, so a repeated name
	// can be told apart by the region it sits in rather than by a chain of every
	// ancestor. "Header Title" and "Card Title", not "Rv > Div > Title".
	assignPartLabels( parts );
	assignRepeaterLabels( repeaterLabels, prefixes, doc );

	// The visible blocks of the section, which the Content and Style tabs are
	// organised by -- see deriveRegions().
	const regions = deriveRegions( {
		doc,
		tops: topLevel.map( ( entry ) => entry.node ),
		rootNode,
		parts,
		partByNode,
		nodesOfPart,
		fields,
		repeaterLabels,
		listItems: new Set( accepted.flatMap( ( group ) => group.nodes ) ),
		portals,
		prefixes,
		spec,
	} );

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
		regions,
		template,
		templateBare,
		notes,
		prefixes,
		portals: portals.map( ( p ) => ( { selector: p.selector, trigger: p.trigger } ) ),
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
				if ( value && ! SYMBOL_ONLY.test( value ) ) {
					const hasMarkup = /<[a-zA-Z]/.test( value );
					const id = ctx.uniqueId( ctx.idStem + '_text' );
					ctx.push(
						{
							id,
							control: hasMarkup || value.length > 90 ? 'textarea' : 'text',
							label: ctx.prefixLabel,
							description: hasMarkup ? 'Inline formatting tags are preserved.' : '',
							default: readableText( value, 'text', 'post' ),
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
					if ( ! value || SYMBOL_ONLY.test( value ) ) continue;
					runIndex += 1;
					const id = ctx.uniqueId( ctx.idStem + '_text' + ( runIndex > 1 ? '_' + runIndex : '' ) );
					ctx.push(
						{
							id,
							control: value.length > 90 ? 'textarea' : 'text',
							label: runIndex > 1 ? 'Text ' + runIndex : 'Text',
							default: readableText( value, 'text', 'post' ),
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

		// Boolean attributes carry no value, so the loop below cannot bind them --
		// which is why the hero video had no autoplay, mute or loop control at
		// all. Each becomes a switcher that writes the attribute or omits it, and
		// an element that SHOULD offer a flag it does not currently carry (a video
		// with no `controls`) gets an insertion point for it.
		collectFlags( node, ctx );

		// Attributes.
		for ( const a of node.attrs || [] ) {
			const name = a.name.toLowerCase();
			if ( LOCKED_ATTRS.has( name ) ) continue;
			if ( name === 'value' && tag === 'option' ) continue; // handled by the option repeater
			const range = attrValueRange( markup, node, name );
			if ( ! range ) continue; // valueless boolean attribute -- see collectFlags

			const info = classifyAttr( name, node, a.value );
			if ( ! info ) continue;

			const id = ctx.uniqueId( ctx.idStem + '_' + name );
			ctx.push(
				{
					id,
					control: info.control,
					label: info.label || attributeLabel( name, node ),
					default: info.control === 'url' || info.control === 'media' ? { url: a.value } : readableText( a.value, info.control, info.esc ),
					options: info.options,
					esc: info.esc,
					group: info.tab === 'content' ? ctx.group : info.tab,
					tab: info.tab,
					sort: 1,
					// Which attribute it writes. build.mjs files the accessibility
					// ones (aria-label, title, role) away from the content.
					attr: name,
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
			const groupId = ctx.uniqueId( ctx.idStem + '_inline_style' );
			const pieces = [];
			let cursor = 0;

			for ( const decl of declarations ) {
				const map = INLINE_STYLE_CONTROLS[ decl.prop.toLowerCase() ] || { type: 'text' };
				const id = ctx.uniqueId( ctx.idStem + '_css_' + decl.prop );
				ctx.push( {
					id,
					control: map.type,
					label: titleCase( decl.prop ),
					description: 'Inline style on the element itself; overrides any CSS rule.',
					default: decl.value,
					options: map.options,
					esc: 'attr',
					group: ctx.group,
					tab: 'inline_style',
					sort: 3,
					// The property it sets. A stylesheet control for the same
					// property on the same element could never win, so the
					// element's style pop-out offers this one in its place.
					css_prop: decl.prop.toLowerCase(),
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

	/**
	 * Bind an element's boolean attributes, and offer the ones its type supports
	 * but does not currently have.
	 *
	 * A present flag binds its own span (with the leading space) so switching it
	 * off removes the attribute cleanly. An absent flag gets a zero-width
	 * insertion point before the `>`, which renders nothing until switched on --
	 * so the default output is still byte-identical to the source.
	 */
	function collectFlags( node, ctx ) {
		const tag = node.tagName.toLowerCase();
		const offered = FLAGS_BY_TAG[ tag ];
		if ( ! offered ) return;

		const present = new Set( ( node.attrs || [] ).map( ( a ) => a.name.toLowerCase() ) );
		const additions = [];
		const type = ( attr( node, 'type' ) || 'text' ).toLowerCase();

		for ( const flag of offered ) {
			// A hidden input has no state a visitor could meet, and only a box
			// or a radio button can be checked: offer those what they carry.
			if ( ! present.has( flag.attr ) && ( 'hidden' === type || ( flag.types && ! flag.types.includes( type ) ) ) ) continue;
			const id = ctx.uniqueId( ctx.idStem + '_' + flag.attr );

			if ( present.has( flag.attr ) ) {
				const range = attrWholeRange( markup, node, flag.attr );
				if ( ! range ) continue;

				// Keep the author's own separator. The hero's <video> puts every
				// attribute on its own line; assuming a single space would fold
				// them all onto one and the render would stop matching the source.
				const prefix = markup.slice( range.start, range.end - flag.attr.length );

				ctx.push(
					{
						id,
						control: 'switcher',
						label: flag.label,
						description: flag.description || '',
						default: 'yes',
						flag_attr: flag.attr,
						flag_prefix: prefix,
						esc: 'raw',
						group: ctx.group,
						tab: flag.tab || 'behaviour',
						sort: 1,
					},
					{ start: range.start, end: range.end, replacement: phpEcho( id ) }
				);
				continue;
			}

			// Not in the source: offer it, defaulting to off.
			ctx.push(
				{
					id,
					control: 'switcher',
					label: flag.label,
					description: flag.description || '',
					default: '',
					flag_attr: flag.attr,
					flag_prefix: ' ',
					esc: 'raw',
					group: ctx.group,
					tab: flag.tab || 'behaviour',
					sort: 1,
				},
				null
			);
			additions.push( id );
		}

		if ( additions.length ) {
			const at = startTagInsertOffset( markup, node );
			edits.push( {
				start: at,
				end: at,
				replacement: additions.map( ( id ) => phpEcho( id ) ).join( '' ),
			} );
		}
	}

	function classifyAttr( name, node, value ) {
		if ( isIntegrationAttr( name, node ) ) {
			return { control: 'text', esc: 'attr', tab: 'integration' };
		}
		if ( URL_ATTRS.has( name ) ) return { control: 'url', esc: 'url', tab: 'content' };
		if ( MEDIA_ATTRS.has( name ) ) {
			return { control: mediaControlFor( node, value ), esc: 'url', tab: 'content' };
		}
		if ( TEXT_ATTRS.has( name ) ) return { control: 'text', esc: 'attr', tab: 'content' };

		const options = ATTRIBUTE_OPTIONS[ name ];
		const owner = node.tagName.toLowerCase();

		// `type` means two different things. On an <input> it is the control kind;
		// on a <source>, <link> or <script> it is a MIME type, and filing it under
		// "Field Behaviour" sends the editor looking in the wrong place.
		if ( 'type' === name && [ 'source', 'link', 'script', 'style', 'embed', 'object' ].includes( owner ) ) {
			return { control: 'text', esc: 'attr', tab: 'media', label: 'MIME Type' };
		}

		if ( FORM_ATTRS.has( name ) ) {
			return { control: options ? 'select' : 'text', options, esc: 'attr', tab: 'form' };
		}
		if ( MEDIA_BEHAVIOUR_ATTRS.has( name ) ) {
			// A media attribute on a <video>/<audio> belongs with its playback
			// options, not in a separate list the editor has to go find.
			const tab = ( 'video' === owner || 'audio' === owner || 'source' === owner ) ? 'media' : 'behaviour';
			return { control: options ? 'select' : 'text', options, esc: 'attr', tab };
		}
		if ( name.startsWith( 'data-' ) ) return { control: 'text', esc: 'attr', tab: 'behaviour' };
		return null;
	}
}

/**
 * Give every part a name that is unique within the section, preferring the
 * shortest form that still distinguishes it: the bare role, then the parent's
 * role in front of it, then a number.
 */
function assignPartLabels( parts ) {
	const count = ( key, list ) => list.filter( ( p ) => p === key ).length;

	const bare = parts.map( ( part ) => part.label );
	const withParent = parts.map( ( part, index ) =>
		count( bare[ index ], bare ) > 1 && part.parent_label
			? part.parent_label + ' ' + part.label
			: bare[ index ]
	);

	const seen = new Map();
	parts.forEach( ( part, index ) => {
		let name = withParent[ index ];
		if ( count( name, withParent ) > 1 ) {
			const n = ( seen.get( name ) || 0 ) + 1;
			seen.set( name, n );
			name = name + ' ' + n;
		}
		part.label = name;
	} );
}

/**
 * Elements that ARE content: their own text, media or field is what a person
 * sees. A wrapper is anything else; a wrapper holding one of these holds
 * content itself.
 */
const CONTENT_TAGS = new Set( [
	'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'button', 'img', 'picture', 'video', 'iframe',
	'svg', 'input', 'select', 'textarea', 'label', 'span', 'strong', 'em', 'small', 'b', 'i',
	'br', 'hr', 'blockquote', 'figcaption', 'time', 'code', 'address', 'cite', 'q', 'sup', 'sub',
] );

/** Elements that read as one thing however much is inside them. */
const UNIT_TAGS = new Set( [ 'ul', 'ol', 'dl', 'table', 'form', 'fieldset', 'figure' ] );

/**
 * The visible blocks of a section: what a person points at when they say
 * "change that" -- the brand block, each link column, the sign-up, the bottom
 * bar. The Content and Style tabs get one panel per block, named the way the
 * block reads on the page, instead of one panel per HTML element: the footer
 * had 27 Content panels and 52 Style panels, most of them for wrappers no one
 * can see.
 *
 * Blocks are found by walking down from each top-level element through
 * wrappers that hold nothing but other wrappers. The first element that holds
 * content itself -- a heading, text, an image, a field -- is a block, with
 * everything inside it; so is a list's parent, and a form or list element.
 * Near the top of the section (or of a dialog) an element can hold content
 * AND further wrappers -- a heading above a card grid; that one is split: its
 * own content is a block, and each wrapper is walked in turn.
 *
 * Labels prefer a name the block already shows: a role a person would use
 * ("Header", "Form") when only one block has it, else the block's own
 * aria-label or heading ("Journeys", "Join the Founder's Circle"). The
 * registry's `regionLabels` overrides any of them by selector.
 *
 * Annotates every part with `region`, `order` and `display` (its name within
 * its block), and every repeater with `region` and `order`; returns the blocks
 * in page order.
 */
function deriveRegions( ctx ) {
	const { doc, tops, rootNode, parts, partByNode, nodesOfPart, fields, repeaterLabels, listItems, portals, prefixes, spec } = ctx;

	const order = new Map( doc.entries.map( ( entry, index ) => [ entry.node, index ] ) );
	const listParents = new Set( repeaterLabels.map( ( entry ) => entry.owner ).filter( Boolean ) );

	const kidsOf = ( node ) => elementChildren( node ).filter( ( kid ) =>
		! [ 'style', 'script', 'template', 'noscript' ].includes( kid.tagName.toLowerCase() )
	);
	const isContent = ( node ) => CONTENT_TAGS.has( node.tagName.toLowerCase() ) || isTextual( node, { allowLinks: true } );
	const ownText = ( node ) => children( node ).some( ( child ) => isTextNode( child ) && child.value.trim() );
	const holdsContent = ( node ) => ownText( node ) || kidsOf( node ).some( isContent );
	// An empty element is decoration (an overlay, a rule); it is never a block.
	const isWrapper = ( node ) => ! isContent( node ) && ( kidsOf( node ).length > 0 || ownText( node ) );

	// One of a run of similar siblings -- each footer column, each chapter,
	// each policy section -- is a block of its own, however it is built inside.
	//
	// Similar means: same tag, same first class, and each one carries its own
	// heading. Two different columns that merely share a layout class (a text
	// column and an image column, both `-col`) are not a run.
	const firstClass = ( node ) => classList( node ).filter( ( c ) => ! isUtilityClass( c ) )[ 0 ] || '';
	const ownHeading = ( node ) => {
		const queue = [ ...kidsOf( node ) ];
		while ( queue.length ) {
			const current = queue.shift();
			if ( listItems.has( current ) ) continue;
			if ( /^h[1-4]$/.test( current.tagName.toLowerCase() ) ) return true;
			queue.push( ...kidsOf( current ) );
		}
		return false;
	};
	const isRunMember = ( node ) => {
		const cls = firstClass( node );
		if ( ! cls || ! kidsOf( node ).length || ! ownHeading( node ) ) return false;
		const parent = doc.parentsOf.get( node )?.node;
		return !! parent && kidsOf( parent ).some( ( sibling ) =>
			sibling !== node && sibling.tagName === node.tagName && firstClass( sibling ) === cls && ownHeading( sibling )
		);
	};

	const found = [];
	const visit = ( node, topish ) => {
		if ( listParents.has( node ) || UNIT_TAGS.has( node.tagName.toLowerCase() ) ) {
			found.push( { node, own: false, run: ! topish && isRunMember( node ) } );
			return;
		}
		if ( ! topish && isRunMember( node ) ) {
			found.push( { node, own: false, run: true } );
			return;
		}
		if ( holdsContent( node ) ) {
			const wrappers = kidsOf( node ).filter( isWrapper );
			if ( topish && wrappers.length ) {
				found.push( { node, own: true, run: false } );
				wrappers.forEach( ( kid ) => visit( kid, false ) );
				return;
			}
			found.push( { node, own: false, run: false } );
			return;
		}
		const wrappers = kidsOf( node ).filter( isWrapper );
		wrappers.forEach( ( kid ) => visit( kid, topish && wrappers.length === 1 ) );
	};
	tops.forEach( ( top ) => visit( top, true ) );
	found.sort( ( a, b ) => order.get( a.node ) - order.get( b.node ) );

	const portalTops = new Set( portals.map( ( portal ) => portal.node ) );
	const topOf = ( node ) => {
		let current = node;
		while ( doc.parentsOf.get( current )?.node ) current = doc.parentsOf.get( current ).node;
		return current;
	};
	const inPortal = ( node ) => portalTops.has( topOf( node ) );
	const mixedTops = found.some( ( entry ) => inPortal( entry.node ) ) && found.some( ( entry ) => ! inPortal( entry.node ) );

	// The first heading a block shows, for naming it. A split block names
	// itself from its own content only, not from the blocks inside it.
	// A list item's heading names the item, not the block -- the trip-types
	// carousel is not "The Wedding" -- so items are not searched.
	const headingIn = ( entry ) => {
		const nested = new Set( found.filter( ( other ) => other !== entry ).map( ( other ) => other.node ) );
		const queue = [ ...kidsOf( entry.node ) ];
		while ( queue.length ) {
			const node = queue.shift();
			if ( entry.own && nested.has( node ) ) continue;
			if ( listItems.has( node ) ) continue;
			if ( /^h[1-4]$/.test( node.tagName.toLowerCase() ) || 'legend' === node.tagName.toLowerCase() ) {
				return innerText( node ).replace( /\s+/g, ' ' ).trim()
					// Text runs split by markup lose their space: "1.Introduction".
					.replace( /([.,;:!?])(?=[A-Za-z])/g, '$1 ' );
			}
			queue.push( ...kidsOf( node ) );
		}
		return '';
	};
	const fits = ( text ) => ( text && text.length <= 30 ? text.replace( /[.:]+$/, '' ) : '' );
	const shortened = ( text ) => {
		if ( ! text ) return '';
		if ( text.length <= 30 ) return text.replace( /[.:]+$/, '' );
		const words = text.split( ' ' );
		let out = '';
		for ( const word of words ) {
			if ( ( out + ' ' + word ).trim().length > 27 ) break;
			out = ( out + ' ' + word ).trim();
		}
		return ( out || text.slice( 0, 27 ) ).replace( /[.,;:]+$/, '' ) + '…';
	};
	const listLabel = new Map( repeaterLabels.map( ( entry ) => [ entry.owner, entry.definition.label ] ) );

	const curated = spec.regionLabels || {};
	const curatedFor = ( node ) => {
		for ( const [ selector, label ] of Object.entries( curated ) ) {
			let match = null;
			try {
				match = doc.query( selector );
			} catch ( error ) {
				match = null;
			}
			if ( match === node ) return label;
		}
		return '';
	};

	// A block that is nothing but a list takes the list's name ("Cards",
	// "Steps"); a text column whose paragraphs happen to be a list is not
	// "Paragraphs" -- it holds a title and a button too.
	const pureList = ( node ) => {
		const entry = repeaterLabels.find( ( candidate ) => candidate.owner === node );
		if ( ! entry ) return '';
		// Items differ by stagger and state classes (`d1`, `is-active`), so they
		// are compared by their naming class.
		const shape = namingClass( entry.item ) + '|' + entry.item.tagName;
		return kidsOf( node ).every( ( kid ) => namingClass( kid ) + '|' + kid.tagName === shape )
			? entry.definition.label
			: '';
	};
	const has = ( node, test ) => doc.entries.some( ( entry ) => entry.node !== node && contains( doc, node, entry.node ) && test( entry.node ) );
	const tagIs = ( ...tags ) => ( node ) => tags.includes( node.tagName.toLowerCase() );
	const plainName = ( entry, heading ) => {
		// A split block names itself from its own content only; what it holds
		// further down belongs to the blocks found inside it.
		if ( entry.own ) return heading ? 'Header' : 'Content';
		if ( listParents.has( entry.node ) || has( entry.node, ( node ) => listParents.has( node ) ) ) return 'Content';
		if ( has( entry.node, tagIs( 'form' ) ) ) return 'Form';
		const media = has( entry.node, tagIs( 'img', 'video', 'picture', 'iframe' ) );
		const words = has( entry.node, ( node ) => /^h[1-6]$|^p$|^a$|^button$/.test( node.tagName.toLowerCase() ) );
		if ( media && ! words ) return has( entry.node, tagIs( 'video', 'iframe' ) ) ? 'Video' : 'Image';
		// A heading with at most a line or two of text and nothing to click is
		// the section's header: eyebrow, title, intro.
		const actions = has( entry.node, tagIs( 'a', 'button', 'ul', 'ol', 'form', 'img', 'video' ) );
		const texts = doc.entries.filter( ( e ) => e.node !== entry.node && contains( doc, entry.node, e.node ) && isTextual( e.node, { allowLinks: false } ) ).length;
		if ( heading && ! actions && texts <= 4 ) return 'Header';
		return 'Content';
	};

	const regions = found.map( ( entry ) => {
		let role = pureList( entry.node ) || semanticName( entry.node, prefixes );
		if ( 'Figure' === role ) role = 'Image';
		if ( entry.own || GENERIC_ROLES.has( role ) ) role = '';
		const aria = attr( entry.node, 'aria-label' ) || '';
		const heading = headingIn( entry );
		// A heading names a block only where it is how people tell the blocks
		// apart -- footer columns, chapters, policy sections -- and is unlikely
		// to be rewritten. A marketing headline would go stale the day the client
		// edits it, so elsewhere a functional name and a number do the job.
		const numbered = /^\d+\.\s/.test( heading );
		const named = entry.run || numbered
			? ( aria.split( ' ' ).length <= 4 ? fits( aria ) : '' ) || shortened( heading )
			: '';
		return {
			entry,
			curated: curatedFor( entry.node ),
			// A run member's heading beats its role: three columns are
			// "Journeys", "Support", "Legal", not "Navigation 1-3".
			role: named ? '' : role,
			named,
			plain: plainName( entry, heading ),
		};
	} );

	// A functional name ("Header", "Cards", "Content") wherever it is unique;
	// where several blocks would share one, each uses its own heading instead.
	const plainCount = new Map();
	for ( const region of regions ) {
		const plain = region.role || region.plain;
		plainCount.set( plain, ( plainCount.get( plain ) || 0 ) + 1 );
	}

	const labelCount = new Map();
	for ( const region of regions ) {
		const plain = region.role || region.plain;
		let label = region.curated || region.named || plain;
		if ( mixedTops && inPortal( region.entry.node ) && ! /pop-?up$/i.test( label ) ) label += ' pop-up';
		region.label = label;
		labelCount.set( label, ( labelCount.get( label ) || 0 ) + 1 );
	}

	const usedIds = new Set();
	const seenLabels = new Map();
	for ( const region of regions ) {
		if ( labelCount.get( region.label ) > 1 ) {
			const n = ( seenLabels.get( region.label ) || 0 ) + 1;
			seenLabels.set( region.label, n );
			region.label = region.label + ' ' + n;
		}
		let id = 'r_' + ( slug( region.label ) || 'block' );
		while ( usedIds.has( id ) ) id += '_x';
		usedIds.add( id );
		region.id = id;
	}

	/* ---------------------------------------------- parts and lists -> blocks */

	const regionByNode = new Map( regions.map( ( region ) => [ region.entry.node, region ] ) );
	const regionOf = ( node ) => {
		for ( let current = node; current; current = doc.parentsOf.get( current )?.node ) {
			if ( regionByNode.has( current ) ) return regionByNode.get( current );
		}
		return null;
	};

	const nodeOfPart = new Map();
	for ( const [ node, part ] of partByNode ) {
		if ( ! nodeOfPart.has( part.id ) ) nodeOfPart.set( part.id, node );
	}
	// Every node a part styles, not just the first: siblings sharing a class
	// share the part, and its name.
	const partOfNode = new Map( partByNode );
	const partsById = new Map( parts.map( ( part ) => [ part.id, part ] ) );
	for ( const [ id, nodes ] of nodesOfPart ) {
		for ( const node of nodes ) if ( ! partOfNode.has( node ) && partsById.has( id ) ) partOfNode.set( node, partsById.get( id ) );
	}

	for ( const part of parts ) {
		const nodes = nodesOfPart.get( part.id ) || [ nodeOfPart.get( part.id ) ].filter( Boolean );
		const first = nodes[ 0 ];
		part.order = first ? order.get( first ) : 0;
		part.box = false;
		part.everywhere = false;
		// The section root is styled from the Section panel, whatever block it
		// would otherwise head.
		if ( ! first || first === rootNode ) {
			part.region = '';
			continue;
		}
		// One set of controls styling elements in several blocks -- every
		// paragraph of every policy section -- belongs to the section as a
		// whole. Filing it under the first block would make a change there
		// silently restyle all the others.
		const ids = new Set( nodes.map( ( node ) => ( regionOf( node ) || { id: '' } ).id ) );
		if ( ids.size > 1 ) {
			part.region = '';
			part.everywhere = true;
			continue;
		}
		part.region = [ ...ids ][ 0 ];
		const region = regionOf( first );
		part.box = !! ( region && region.entry.node === first && 1 === nodes.length );

		// A wrapper whose only child is a block is that block's outer frame: the
		// full-width strip behind the bottom bar, the backdrop behind a dialog.
		// It carries the background a person means when they style "the bottom
		// bar", so it belongs in the block's panel, not loose in the Section's.
		if ( ! part.region && 1 === nodes.length ) {
			let current = first;
			while ( current && ! regionByNode.has( current ) ) {
				const kids = kidsOf( current );
				current = 1 === kids.length ? kids[ 0 ] : null;
			}
			if ( current ) {
				const framed = regionByNode.get( current );
				part.region = framed.id;
				part.frame = portalTops.has( first ) ? 'backdrop' : 'outer';
				framed.framed = true;
			}
		}
	}

	// Elements styled section-wide inside a run -- the heading of every footer
	// column -- are named by the run they repeat in: "Column Headings", not a
	// bare "Headings" that could be any heading on the section.
	const partById = new Map( parts.map( ( part ) => [ part.id, part ] ) );
	for ( const part of parts ) {
		if ( ! part.everywhere ) continue;
		const run = ( part.ancestor_ids || [] ).map( ( id ) => partById.get( id ) ).filter( ( ancestor ) => ancestor && ancestor.everywhere ).pop();
		if ( run && run.short_label && run.short_label !== part.short_label ) part.run_label = run.short_label;
	}

	// A part's name within its block: "Heading", "Links", "Block" -- the block
	// already says where it is, so the section-wide prefix ("Item Link 3") goes.
	// The block's own element is "Block" everywhere, so every panel opens the
	// same way; a dialog's is "Dialog", over its "Backdrop".
	const regionById = new Map( regions.map( ( region ) => [ region.id, region ] ) );
	// A pop-up's own box is its outermost block; the image, header and form
	// inside it are blocks like any other.
	const isDialog = ( region ) => {
		if ( ! inPortal( region.entry.node ) ) return false;
		for ( let current = doc.parentsOf.get( region.entry.node )?.node; current; current = doc.parentsOf.get( current )?.node ) {
			if ( regionByNode.has( current ) ) return false;
		}
		return true;
	};
	const FIXED_NAMES = new Set( [ 'Section', 'Block', 'Inner Block', 'Dialog', 'Backdrop' ] );
	const byRegion = new Map();
	for ( const part of parts ) {
		if ( ! byRegion.has( part.region ) ) byRegion.set( part.region, [] );
		byRegion.get( part.region ).push( part );
	}
	for ( const group of byRegion.values() ) {
		group.sort( ( a, b ) => a.order - b.order );
		const base = ( part ) => {
			if ( nodeOfPart.get( part.id ) === rootNode ) return 'Section';
			if ( 'backdrop' === part.frame ) return 'Backdrop';
			if ( 'outer' === part.frame ) return 'Block';
			if ( part.box ) {
				const region = regionById.get( part.region );
				if ( region && isDialog( region ) ) return 'Dialog';
				return region && region.framed ? 'Inner Block' : 'Block';
			}
			// An unnamed grid is what lays the columns out; "Content" or
			// "Container" says nothing about that.
			const own = GENERIC_ROLES.has( part.short_label ) && ( part.features || [] ).includes( 'grid_container' ) ? 'Grid' : part.short_label;
			const name = part.shared || part.everywhere ? pluralise( own ) : own;
			return part.run_label ? part.run_label + ' ' + name : name;
		};
		let names = group.map( base );
		// Two texts in one card are told apart the way a designer would: a short
		// line above the heading is its eyebrow, the text under it the
		// description. Two buttons are told apart by what they say.
		names = names.map( ( name, index ) => {
			if ( names.filter( ( other ) => other === name ).length < 2 ) return name;
			const part = group[ index ];
			const node = nodeOfPart.get( part.id );
			if ( ! node || FIXED_NAMES.has( name ) ) return name;
			const tag = node.tagName.toLowerCase();
			if ( ( 'a' === tag || 'button' === tag ) && ! part.shared && actionName( node ) ) return actionName( node );
			if ( 'Text' !== part.short_label ) return name;
			const parent = doc.parentsOf.get( node )?.node;
			const siblings = parent ? kidsOf( parent ) : [];
			const heading = siblings.findIndex( ( sibling ) => /^h[1-6]$/.test( sibling.tagName.toLowerCase() ) );
			const at = siblings.indexOf( node );
			if ( heading < 0 ) return name;
			const role = at < heading && innerText( node ).trim().split( /\s+/ ).length <= 6 ? 'Eyebrow' : at > heading ? 'Description' : '';
			if ( ! role ) return name;
			const own = part.shared || part.everywhere ? pluralise( role ) : role;
			return part.run_label ? part.run_label + ' ' + own : own;
		} );
		const count = ( name ) => names.filter( ( other ) => other === name ).length;
		const prefixed = group.map( ( part, index ) => {
			const name = names[ index ];
			if ( count( name ) < 2 || ! part.parent_label || FIXED_NAMES.has( name ) ) return name;
			return part.parent_label + ' ' + name;
		} );
		const seen = new Map();
		group.forEach( ( part, index ) => {
			let name = prefixed[ index ];
			if ( prefixed.filter( ( other ) => other === name ).length > 1 ) {
				const n = ( seen.get( name ) || 0 ) + 1;
				seen.set( name, n );
				name = name + ' ' + n;
			}
			part.display = name;
		} );
	}

	/* ----------------------------------------------------- content owners */

	// The Content tab groups fields by the thing a person sees: a field's
	// label and its box are one "Email address" entry, a button's link and its
	// wording are one "Button".
	const FIELD_TAGS = new Set( [ 'input', 'select', 'textarea' ] );
	const parentOf = ( node ) => doc.parentsOf.get( node )?.node || null;
	const visibleControls = ( node ) => doc.entries
		.map( ( entry ) => entry.node )
		.filter( ( other ) => contains( doc, node, other ) && FIELD_TAGS.has( other.tagName.toLowerCase() ) && ! isInvisible( other ) );
	const ownerOf = ( node, region ) => {
		const stop = region ? region.entry.node : null;
		for ( let current = node; current && current !== stop; current = parentOf( current ) ) {
			const tag = current.tagName.toLowerCase();
			if ( 'a' === tag || 'button' === tag ) return { node: current, kind: 'action' };
		}
		const tag = node.tagName.toLowerCase();
		const inLabel = ( () => {
			for ( let current = node; current && current !== stop; current = parentOf( current ) ) {
				if ( 'label' === current.tagName.toLowerCase() ) return true;
			}
			return false;
		} )();
		// A label tied to its field by `for` belongs with that field, wherever
		// the two sit: the footer's name box and its screen-reader label.
		const target = 'label' === tag && attr( node, 'for' ) ? byId( attr( node, 'for' ) ) : null;
		if ( target && FIELD_TAGS.has( target.tagName.toLowerCase() ) ) return ownerOf( target, region );
		if ( FIELD_TAGS.has( tag ) || inLabel ) {
			for ( let current = parentOf( node ); current && current !== stop; current = parentOf( current ) ) {
				const kind = current.tagName.toLowerCase();
				if ( 'form' === kind ) break;
				if ( 1 === visibleControls( current ).length ) return { node: current, kind: 'field' };
			}
			// Not wrapped: the field is its own entry.
			if ( FIELD_TAGS.has( tag ) ) return { node, kind: 'field' };
		}
		return { node, kind: 'element' };
	};
	const byId = ( id ) => doc.entries.map( ( entry ) => entry.node ).find( ( other ) => attr( other, 'id' ) === id ) || null;
	const clean = ( text ) => text.replace( /\*/g, '' ).replace( /\((required|optional)\)/gi, '' ).replace( /\s+/g, ' ' ).trim();
	const fieldName = ( node ) => {
		const nodes = doc.entries.map( ( entry ) => entry.node );
		const field = FIELD_TAGS.has( node.tagName.toLowerCase() ) ? node : nodes.find( ( other ) => contains( doc, node, other ) && FIELD_TAGS.has( other.tagName.toLowerCase() ) );
		const label = nodes.find( ( other ) => 'label' === other.tagName.toLowerCase() && contains( doc, node, other ) )
			|| ( field && attr( field, 'id' ) ? nodes.find( ( other ) => 'label' === other.tagName.toLowerCase() && attr( other, 'for' ) === attr( field, 'id' ) ) : null );
		const text = clean( label ? innerText( label ) : '' )
			|| clean( field ? attr( field, 'aria-label' ) || attr( field, 'placeholder' ) || '' : '' );
		// The field's own question, shortened if long: "How many guests will…".
		if ( text ) return shortened( text.replace( /[:?]+$/, '' ) );
		// A hidden input is known by its name: "Hubspot Form Id", not "Field 3".
		const name = field ? attr( field, 'name' ) || '' : '';
		return name ? name.replace( /([a-z])([A-Z])/g, '$1 $2' ).replace( /[_-]+/g, ' ' ).replace( /\b\w/g, ( c ) => c.toUpperCase() ) : 'Field';
	};

	// An element's own name in its block's Style row ("Eyebrow", "Description")
	// names it on the Content tab as well -- unless that row styles several
	// elements at once, or is the block's own frame.
	const contentName = ( node ) => {
		const part = partOfNode.get( node );
		if ( ! part ) return semanticName( node, prefixes );
		const own = part.display && ! part.shared && ! part.everywhere && ! FIXED_NAMES.has( part.display ) && ! /\s\d+$/.test( part.display );
		return own ? part.display : part.short_label;
	};

	const owners = new Map(); // owner node -> { key, region, label, order }
	for ( const field of fields ) {
		const node = field._node;
		if ( ! node || field.internal ) continue;
		const region = node === rootNode ? null : regionOf( node );
		const owner = ownerOf( node, region );
		if ( ! owners.has( owner.node ) ) {
			owners.set( owner.node, {
				key: 'o' + order.get( owner.node ),
				region: region ? region.id : '',
				order: order.get( owner.node ),
				// The same name its Style row has, so "Tagline" on the Content tab
				// is "Tagline" on the Style tab.
				base: owner.node === rootNode ? 'Section'
					: 'field' === owner.kind ? fieldName( owner.node )
						: contentName( owner.node ),
				kind: owner.kind,
				alt: 'action' === owner.kind ? actionName( owner.node ) : '',
			} );
		}
		const entry = owners.get( owner.node );
		field.region = entry.region;
		field.owner = entry.key;
		field.owner_kind = entry.kind;
		field.order = order.get( node );
		// Settings on something no visitor sees (a hidden input, the frame a
		// form posts into) are wiring, not content -- except words written for
		// screen readers, which are accessibility settings.
		if ( isScreenReaderOnly( node ) ) field.screen_reader = true;
		else if ( isInvisible( node ) ) field.unseen = true;
	}

	// Owner names, unique within their block: "Image", "Title", "Button 2".
	//
	// Where a block holds several links or buttons, each is named by what it
	// says -- "Terms & Conditions", "Privacy Policy" -- or, for an icon link,
	// by where it goes: "Instagram". "Link 1" to "Link 4" made the Legal column
	// a guessing game. The name is taken from the source, so it stays right
	// unless a link is re-pointed or reworded beyond recognition.
	const ownersByRegion = new Map();
	for ( const entry of owners.values() ) {
		if ( ! ownersByRegion.has( entry.region ) ) ownersByRegion.set( entry.region, [] );
		ownersByRegion.get( entry.region ).push( entry );
	}
	const ownerLabels = new Map();
	for ( const group of ownersByRegion.values() ) {
		group.sort( ( a, b ) => a.order - b.order );
		const actions = group.filter( ( entry ) => 'action' === entry.kind );
		const repeated = actions.some( ( entry ) => actions.filter( ( other ) => other.base === entry.base ).length > 1 );
		for ( const entry of actions ) {
			// A lone link is named by its words too: "Privacy Policy" says more
			// than "Link". A lone button keeps "Button", which is how the Style
			// tab knows it.
			if ( ! repeated && 'Link' !== entry.base ) continue;
			const unique = entry.alt && 1 === group.filter( ( other ) => other.alt === entry.alt || other.base === entry.alt ).length;
			if ( unique ) entry.base = entry.alt;
		}
		// A form field named like something else in the block -- the "Title"
		// dropdown under the card's title -- is the field: "Title Field".
		for ( const entry of group ) {
			if ( 'field' !== entry.kind ) continue;
			if ( group.some( ( other ) => other !== entry && 'field' !== other.kind && other.base === entry.base ) ) entry.base += ' Field';
		}
		const seen = new Map();
		for ( const entry of group ) {
			let name = entry.base;
			if ( group.filter( ( other ) => other.base === name ).length > 1 ) {
				const n = ( seen.get( name ) || 0 ) + 1;
				seen.set( name, n );
				name = name + ' ' + n;
			}
			ownerLabels.set( entry.key, name );
		}
	}
	for ( const field of fields ) {
		if ( field.owner ) field.owner_label = ownerLabels.get( field.owner );
	}

	// A list's name within its block. The block already says which list it is,
	// so the Journeys column's list is "Links", not "Journeys Items" -- and a
	// list whose rows are each one link is a list of links, whatever tag holds
	// them.
	const actionsOnly = ( item ) => {
		const tag = item.tagName.toLowerCase();
		if ( 'a' === tag ) return 'Links';
		if ( 'button' === tag ) return 'Buttons';
		const actions = doc.entries.map( ( entry ) => entry.node )
			.filter( ( node ) => node !== item && contains( doc, item, node ) && [ 'a', 'button' ].includes( node.tagName.toLowerCase() ) );
		if ( 1 !== actions.length ) return '';
		const words = ( node ) => innerText( node ).replace( /\s+/g, ' ' ).trim();
		if ( words( item ) !== words( actions[ 0 ] ) ) return '';
		return 'a' === actions[ 0 ].tagName.toLowerCase() ? 'Links' : 'Buttons';
	};
	for ( const { definition, owner, item } of repeaterLabels ) {
		const region = regionOf( owner || item );
		definition.region = region ? region.id : '';
		definition.order = order.get( item ) || 0;
		// A dropdown's options keep their field's name ("Enquiry Type Options"):
		// the field is what a person looks for.
		const options = 'option' === item.tagName.toLowerCase() || 'optgroup' === item.tagName.toLowerCase();
		definition.block_label = actionsOnly( item ) || ( options ? definition.label : definition.base_label || definition.label );
	}
	// Two lists in one block keep their full names.
	for ( const definition of repeaterLabels.map( ( entry ) => entry.definition ) ) {
		const twins = repeaterLabels.filter( ( entry ) => entry.definition.region === definition.region && entry.definition.block_label === definition.block_label );
		if ( twins.length > 1 ) twins.forEach( ( entry ) => { entry.definition.block_label_clash = true; } );
	}
	for ( const { definition } of repeaterLabels ) {
		if ( definition.block_label_clash ) definition.block_label = definition.label;
		delete definition.block_label_clash;
	}

	return regions.map( ( region ) => ( {
		id: region.id,
		label: region.label,
		portal: inPortal( region.entry.node ),
		// What the registry's `regionLabels` would key this block by.
		hint: attr( region.entry.node, 'id' ) ? '#' + attr( region.entry.node, 'id' )
			: region.entry.node.tagName.toLowerCase() + classList( region.entry.node ).filter( ( c ) => ! isUtilityClass( c ) ).map( ( c ) => '.' + c ).join( '' ),
	} ) );
}

/** The style part of the closest ancestor that has one. */
function nearestPart( doc, node, partByNode ) {
	for ( let current = doc.parentsOf.get( node )?.node; current; current = doc.parentsOf.get( current )?.node ) {
		const part = partByNode.get( current );
		if ( part ) return part;
	}
	return null;
}

/**
 * Every ancestor that already has its own style panel, closest first. The
 * closest one that is not a generic wrapper names the region a panel sits in,
 * so a panel can say where in the section it is. The section root counts as
 * generic -- prefixing everything with "Section" would say nothing.
 */
function ancestorParts( doc, node, partByNode ) {
	const found = [];

	for ( let current = doc.parentsOf.get( node )?.node; current; current = doc.parentsOf.get( current )?.node ) {
		const part = partByNode.get( current );
		if ( part ) found.push( part );
	}

	return found;
}

function contains( doc, ancestor, node ) {
	let current = node;
	while ( current ) {
		if ( current === ancestor ) return true;
		current = doc.parentsOf.get( current )?.node;
	}
	return false;
}

/**
 * The first named form control an element is or contains, described for the
 * build report -- or '' if there is none. Hidden inputs count: they carry the
 * split first/last name and the HubSpot tracking cookie.
 */
function namedFormControl( doc, node ) {
	for ( const { node: candidate } of doc.entries ) {
		if ( candidate !== node && ! contains( doc, node, candidate ) ) continue;
		const tag = candidate.tagName.toLowerCase();
		if ( ! [ 'input', 'select', 'textarea', 'button' ].includes( tag ) ) continue;
		const name = attr( candidate, 'name' );
		if ( name ) return tag + '[name=' + name + ']';
	}
	return '';
}

/**
 * The image layers of a `background` or `background-image` declaration, in
 * order: `[ 'radial-gradient(…)', 'url("…")' ]`. From the shorthand, each
 * comma-separated layer contributes its image (a gradient or a url()) or
 * `none`; position, size and repeat stay with the stylesheet's own rule.
 */
function backgroundImageLayers( declaration ) {
	const layers = [];
	let depth = 0;
	let quote = null;
	let buffer = '';
	for ( const ch of declaration.value ) {
		if ( quote ) {
			if ( ch === quote ) quote = null;
		} else if ( '"' === ch || "'" === ch ) {
			quote = ch;
		} else if ( '(' === ch ) {
			depth += 1;
		} else if ( ')' === ch ) {
			depth -= 1;
		} else if ( ',' === ch && 0 === depth ) {
			layers.push( buffer.trim() );
			buffer = '';
			continue;
		}
		buffer += ch;
	}
	layers.push( buffer.trim() );

	// A gradient written over several lines reads the same on one.
	const tidy = ( layer ) => layer.replace( /\s+/g, ' ' );
	if ( 'background-image' === declaration.prop ) return layers.map( tidy );

	return layers.map( tidy ).map( ( layer ) => {
		const start = layer.search( /(?:repeating-)?(?:linear|radial|conic)-gradient\(|url\(/ );
		if ( start < 0 ) return 'none';
		let level = 0;
		for ( let i = layer.indexOf( '(', start ); i < layer.length; i += 1 ) {
			if ( '(' === layer[ i ] ) level += 1;
			if ( ')' === layer[ i ] && 0 === ( level -= 1 ) ) return layer.slice( start, i + 1 );
		}
		return 'none';
	} );
}

/**
 * Quoted url() references in a piece of CSS, with the offsets of the URL
 * itself. Unquoted ones are left alone: there a parenthesis or a space in the
 * URL would end it, and escaping that safely is not worth the special case.
 */
function* cssUrls( css ) {
	for ( const match of css.matchAll( /url\(\s*(['"])([^'"]+)\1\s*\)/g ) ) {
		const start = match.index + match[ 0 ].indexOf( match[ 1 ] ) + 1;
		yield { value: match[ 2 ], start, end: start + match[ 2 ].length };
	}
}

/** Names of every data-* attribute on an element and inside it, as one string. */
function dataAttributeNames( doc, node ) {
	const names = new Set();
	for ( const { node: candidate } of doc.entries ) {
		if ( candidate !== node && ! contains( doc, node, candidate ) ) continue;
		for ( const a of candidate.attrs || [] ) {
			if ( a.name.startsWith( 'data-' ) ) names.add( a.name );
		}
	}
	return [ ...names ].sort().join( ' ' );
}

/** The <select> an <option> belongs to, through an <optgroup> if need be. */
function selectOwning( doc, node ) {
	if ( 'option' !== node.tagName.toLowerCase() ) return null;
	let current = doc.parentsOf.get( node )?.node;
	while ( current && 'optgroup' === current.tagName.toLowerCase() ) current = doc.parentsOf.get( current )?.node;
	return current && 'select' === current.tagName.toLowerCase() ? current : null;
}

/* ---------------------------------------------------------------- portals */

/**
 * Resolve the elements a section's own script moves to `<body>`.
 *
 * Every Elementor style control is scoped under the widget wrapper. A dialog
 * that appends itself to `<body>` -- the inquiry popups do it on init, the
 * footer's opt-out dialog too, because a `position: fixed` element inside a
 * transformed ancestor is positioned against that ancestor -- leaves the
 * wrapper behind, and every rule written for it stops matching. Before this,
 * the inquiry popups' entire Style tab did nothing at all.
 *
 * A portal must be declared in the registry (`spec.portals`) and must be a
 * top-level element with an id: the id is what the second selector branch is
 * built on, and a nested element would need its ancestors carried along too.
 * build.mjs refuses to compile a section whose script moves something to
 * <body> without one, so this cannot regress silently.
 */
function resolvePortals( doc, declared, key ) {
	return declared.map( ( entry ) => {
		const selector = typeof entry === 'string' ? entry : entry.selector;
		const found = doc.queryAll( selector );
		if ( found.length !== 1 ) {
			throw new Error( key + ': portal "' + selector + '" must match exactly one element, matched ' + found.length );
		}

		const node = found[ 0 ];
		if ( doc.parentsOf.get( node )?.node ) {
			throw new Error( key + ': portal "' + selector + '" must be a top-level element of the section file' );
		}

		const id = attr( node, 'id' );
		if ( ! id ) throw new Error( key + ': portal "' + selector + '" needs an id' );

		return {
			selector: '#' + id,
			node,
			trigger: ( typeof entry === 'object' && entry.trigger ) || null,
		};
	} );
}

/* ----------------------------------------------------------------- tokens */

/**
 * Give each token a control id and label. An unscoped token keeps the id the
 * runtime has always computed (`uew_token_` + name), so values already saved
 * on a page survive a rebuild. A name declared with different values in
 * different scopes gets one control per scope, labelled by where it lives.
 */
function deriveTokens( collected, prefixes ) {
	const used = new Set();

	return collected.map( ( token ) => {
		const base = 'uew_token_' + token.name.toLowerCase().replace( /-/g, '_' ).replace( /[^a-z0-9_]/g, '' );
		const scope = token.scoped ? scopeLabel( token.selectors[ 0 ], prefixes ) : '';

		let id = scope ? base + '_' + slug( scope ) : base;
		let n = 2;
		while ( used.has( id ) ) {
			id = base + '_' + n;
			n += 1;
		}
		used.add( id );

		return {
			...token,
			id,
			label: titleCase( token.name ) + ( scope ? ' (' + scope + ')' : '' ),
		};
	} );
}

/** "#umoya-hero .btn" -> "Btn": the last compound, humanised. */
function scopeLabel( selector, prefixes ) {
	const last = selector.trim().split( /\s+|>/ ).filter( Boolean ).pop() || selector;
	const name = ( last.match( /[.#]([A-Za-z0-9_-]+)(?![\s\S]*[.#])/ ) || [ '', last ] )[ 1 ];
	return humanizeClass( name, prefixes );
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

/**
 * Items of one list share a tag and their identifying classes. Position
 * classes are left out: the first slide carries `fc-ss-on`, the third card
 * `d2`, and grouping on the full class list split every carousel and card grid
 * into "item 1" plus a list of the rest -- which let an editor add a slide with
 * no matching dot. Those classes are rebuilt from the row's position instead;
 * see positionalRule().
 */
function repeaterSignature( node ) {
	const classes = classList( node ).filter( ( c ) => ! isPositionalClass( c ) ).sort().join( '.' );
	return node.tagName.toLowerCase() + ( classes ? '.' + classes : '' );
}

/**
 * Classes that say where an item is, or what state it starts in, rather than
 * what it is: reveal and stagger hooks (`-rv`, `d1`), the active item
 * (`-on`, `is-active`, `fc-det-open`), variants (`is-ghost`).
 */
function isPositionalClass( cls ) {
	return isUtilityClass( cls ) || /^(is|has)-/.test( cls );
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

	// Items carrying different behaviour hooks are different controls, not
	// entries in a list: a carousel's prev arrow has `data-wtt-prev`, its next
	// arrow `data-wtt-next`, and a third arrow would be meaningless.
	const hooks = group.nodes.map( ( node ) => dataAttributeNames( doc, node ) );
	if ( new Set( hooks ).size > 1 ) {
		return reject( 'items carry different behaviour hooks (' + [ ...new Set( hooks ) ].map( ( h ) => h || 'none' ).join( ' / ' ) + ')' );
	}

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
	// Where items differ in their class list (the active slide, a stagger
	// delay) or in the whitespace between attributes (the dots line their
	// attributes up in columns), those spans are bound per row too. They are
	// turned into expressions on the row's position once the round trip has
	// proved the binding is exact -- see positionalRule().
	const variance = mapPositionalVariance( group.nodes, markup );
	const bindings = collectRepeaterBindings( doc, template, markup, attrPresence, opaquePaths, variance, ctx.prefixes || [] );
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

	let finalTemplate = rowTemplate;
	let finalTemplateBare = rowTemplateBare;
	const derivedIds = new Set();
	const replaceEcho = ( bindingId, expression ) => {
		finalTemplate = finalTemplate.split( phpEchoItem( bindingId ) ).join( expression );
		finalTemplateBare = finalTemplateBare.split( phpEchoItem( bindingId ) ).join( expression );
		rows.forEach( ( row ) => delete row[ bindingId ] );
		derivedIds.add( bindingId );
	};

	// Values that are just "<prefix><row number><suffix>" -- the accordion's
	// fc-det-btn-3..6 wiring, a slide's "2 of 5" -- become an expression on the
	// row's position instead of stored data. Adding a row in Elementor then
	// produces correctly numbered, unique ids and a correct total, rather than a
	// copy of row 1's that would break the aria-controls pairing.
	for ( const entry of detectIndexPatterns( bindings, rows ) ) {
		replaceEcho( entry.id, '<?php echo ' + entry.segments.map( segmentExpression ).join( ' . ' ) + '; ?>' );
	}

	// Classes, start-tag spacing and state attributes that differ only by
	// position: the first slide is the active one, the third card waits `d2`.
	// They follow the row's position rather than the row, so whichever item is
	// first after a reorder is the active one, and a new row never arrives
	// carrying row 1's "active" state.
	let firstState = false;
	for ( const binding of bindings ) {
		if ( derivedIds.has( binding.id ) ) continue;
		const values = rows.map( ( row ) => row[ binding.id ] );
		const mechanical = binding.positional || ( 'attr' === binding.kind && POSITIONAL_ATTRS.has( binding.attr ) );
		if ( ! mechanical || new Set( values ).size < 2 ) continue;

		if ( 'class' === binding.positional ) {
			const offending = classDifferences( values ).filter( ( cls ) => ! isPositionalClass( cls ) );
			if ( offending.length ) {
				return reject( 'items differ by class ' + offending.join( ', ' ) + ', which is content, not position' );
			}
		}

		const rule = positionalRule( values );
		if ( 'first' === rule.kind && ( 'class' === binding.positional || 'attr' === binding.kind ) ) firstState = true;
		replaceEcho( binding.id, '<?php echo ' + rule.expression + '; ?>' );
	}

	const labelBinding = pickLabelBinding( bindings.filter( ( b ) => ! derivedIds.has( b.id ) ) );
	const kept = bindings.filter( ( b ) => ! derivedIds.has( b.id ) );
	const labels = rowControlLabels( kept, ctx.prefixes || [] );

	return {
		groupId: group.id,
		label: pluralise( semanticName( template, ctx.prefixes || [] ) ),
		item_label: labelBinding ? '{{{ ' + labelBinding.id + ' }}}' : '',
		controls: kept.map( ( b ) => ( {
			id: b.id,
			// Wiring a row needs but an editor never should -- role, ids,
			// viewBox, aria state, lazy-loading -- is kept per row but out of
			// sight, so a row's panel shows its content and nothing else.
			control: 'attr' === b.kind && isRowWiringAttr( b.attr ) ? 'hidden' : b.control,
			label: labels.get( b.id ),
			esc: b.esc,
			options: b.options,
			default: modeOf( rows.map( ( row ) => row[ b.id ] ) ),
		} ) ),
		rows,
		perRowSeparator,
		separator,
		rowTemplate: finalTemplate,
		rowTemplateBare: finalTemplateBare,
		range: { start: first.start, end: last.end },
		nodes: group.nodes,
		signature: group.signature,
		firstState,
		// Only a class-bearing item can be styled as a group; an <option> or a
		// bare hidden <input> has nothing to hang a rule on.
		selector: ( group.signature.startsWith( 'option' ) || ! classList( template ).length )
			? null
			: '.' + classList( template ).filter( ( c ) => ! isPositionalClass( c ) ).sort().join( '.' ),
	};
}

/* ------------------------------------------------------ repeater emission */

/**
 * Turn one or more repeater plans into a definition and its template edits.
 *
 * One plan is an ordinary repeater. Several are lists that must stay the same
 * length -- a slideshow's slides and its dots, the homepage journey's images,
 * captions and dots -- merged into one repeater that renders in each place, so
 * an editor adds a slide and its dot in one move. Before this, slides and dots
 * were separate lists, and the Founder's Circle slideshow, which indexes its
 * dots by slide number, threw on the first slide that had no dot.
 */
function emitRepeater( plans, ctx ) {
	const id = ctx.uniqueId( 'rep_' + plans[ 0 ].groupId );
	const merged = plans.length > 1;

	// In a merged repeater each list's values live side by side in one row, so
	// each list's ids get their own namespace.
	const prefixOf = ( index ) => ( merged ? 'l' + ( index + 1 ) + '_' : '' );
	const rename = ( template, plan, prefix ) => {
		if ( ! prefix ) return template;
		let out = template;
		for ( const control of plan.controls ) {
			out = out.split( phpEchoItem( control.id ) ).join( phpEchoItem( prefix + control.id ) );
		}
		return out.split( "$it['_uew_sep']" ).join( "$it['" + prefix + "_uew_sep']" );
	};

	const controls = [];
	const rows = plans[ 0 ].rows.map( () => ( {} ) );
	const edits = [];
	const bareEdits = [];

	plans.forEach( ( plan, index ) => {
		const prefix = prefixOf( index );
		for ( const control of plan.controls ) controls.push( { ...control, id: prefix + control.id } );
		// Rows were proved against the source with their values as written;
		// what the editor shows is the readable form (see readableText()).
		const byId = new Map( plan.controls.map( ( control ) => [ control.id, control ] ) );
		plan.rows.forEach( ( row, rowIndex ) => {
			for ( const [ key, value ] of Object.entries( row ) ) {
				const control = byId.get( key );
				rows[ rowIndex ][ prefix + key ] = control ? readableText( value, control.control, control.esc ) : value;
			}
		} );
		if ( plan.perRowSeparator ) {
			// A new row gets the spacing but not row 2's numbered comment --
			// "<!-- Slide 2 -->" in front of a sixth slide would only mislead.
			const spacing = plan.separator.replace( /<!--[\s\S]*?-->/g, '' ).replace( /\n[ \t]*(?=\n)/g, '' );
			controls.push( { id: prefix + '_uew_sep', control: 'hidden', label: 'Separator markup', esc: 'raw', default: spacing } );
		}

		const loop = ( body ) =>
			'<?php $__i = 0; foreach ( $r[' + phpString( id ) + '] as $it ) : ' +
			( plan.perRowSeparator
				? "if ( $__i ++ ) { echo $it['" + prefix + "_uew_sep']; } ?>"
				: 'if ( $__i ++ ) { echo ' + phpString( plan.separator ) + '; } ?>' ) +
			body +
			'<?php endforeach; ?>';

		edits.push( { ...plan.range, replacement: loop( rename( plan.rowTemplate, plan, prefix ) ) } );
		bareEdits.push( { ...plan.range, replacement: loop( rename( plan.rowTemplateBare, plan, prefix ) ) } );
	} );

	const lead = plans[ 0 ];
	const leadPrefix = prefixOf( 0 );
	return {
		definition: {
			id,
			label: lead.label,
			item_label: lead.item_label ? lead.item_label.replace( /\{\{\{ (\w+) \}\}\}/, '{{{ ' + leadPrefix + '$1 }}}' ) : '',
			controls,
			rows,
			// How many places each row renders in -- a slide and its dot is 2.
			loops: plans.length,
			selector: lead.selector,
		},
		edits,
		bareEdits,
	};
}

/**
 * Group repeater plans that are parallel lists of one widget: same length,
 * each starting with an "active" first item, close together in the tree. The
 * deepest common ancestor wins, and a group never holds two lists of the same
 * kind -- three hotel slideshows side by side are three slideshows, not one.
 */
function coupleParallelPlans( doc, plans ) {
	const candidates = plans.filter( ( plan ) => plan.firstState );
	const depth = ( node ) => {
		let d = 0;
		for ( let current = node; current; current = doc.parentsOf.get( current )?.node ) d += 1;
		return d;
	};
	const ancestors = ( node ) => {
		const out = [];
		for ( let current = node; current; current = doc.parentsOf.get( current )?.node ) out.push( current );
		return out;
	};
	const parentOf = ( plan ) => doc.parentsOf.get( plan.nodes[ 0 ] )?.node || null;

	const pairs = [];
	for ( let i = 0; i < candidates.length; i += 1 ) {
		for ( let j = i + 1; j < candidates.length; j += 1 ) {
			const a = candidates[ i ];
			const b = candidates[ j ];
			if ( a.rows.length !== b.rows.length || a.signature === b.signature ) continue;
			const pa = parentOf( a );
			const pb = parentOf( b );
			if ( ! pa || ! pb ) continue;
			const shared = ancestors( pa ).find( ( node ) => ancestors( pb ).includes( node ) );
			if ( ! shared ) continue;
			// Close: within two levels of each list's own container.
			if ( depth( pa ) - depth( shared ) > 2 || depth( pb ) - depth( shared ) > 2 ) continue;
			pairs.push( { a, b, depth: depth( shared ) } );
		}
	}

	pairs.sort( ( x, y ) => y.depth - x.depth );
	const groupOf = new Map( plans.map( ( plan ) => [ plan, [ plan ] ] ) );
	for ( const { a, b } of pairs ) {
		const ga = groupOf.get( a );
		const gb = groupOf.get( b );
		if ( ga === gb ) continue;
		const signatures = new Set( ga.map( ( p ) => p.signature ) );
		if ( gb.some( ( p ) => signatures.has( p.signature ) ) ) continue;
		const joined = ga.concat( gb );
		for ( const plan of joined ) groupOf.set( plan, joined );
	}

	// Keep document order, both between groups and within each.
	const seen = new Set();
	const groups = [];
	for ( const plan of plans ) {
		const group = groupOf.get( plan );
		if ( seen.has( group ) ) continue;
		seen.add( group );
		groups.push( group.slice().sort( ( x, y ) => x.range.start - y.range.start ) );
	}
	return groups;
}

/** The most common value; ties go to the earliest. What "Add Item" fills in. */
function modeOf( values ) {
	const counts = new Map();
	for ( const value of values ) counts.set( value, ( counts.get( value ) || 0 ) + 1 );
	let best = values[ 0 ];
	for ( const value of values ) if ( counts.get( value ) > counts.get( best ) ) best = value;
	return best ?? '';
}

/**
 * State attributes whose value can follow position: which item is selected,
 * current or expanded, and whether it is focusable.
 */
const POSITIONAL_ATTRS = new Set( [
	'aria-selected', 'aria-current', 'aria-expanded', 'aria-pressed', 'aria-checked', 'aria-hidden', 'tabindex',
] );

/**
 * Labels for a row's controls, unique within the row. A card holds two images,
 * so "Alt Text" alone names two controls: qualify by the element first
 * ("Image Alt Text"), and number only what that still leaves ambiguous.
 */
function rowControlLabels( bindings, prefixes ) {
	const labels = new Map( bindings.map( ( b ) => [ b.id, b.label ] ) );
	const tally = ( map ) => {
		const counts = new Map();
		for ( const label of map.values() ) counts.set( label, ( counts.get( label ) || 0 ) + 1 );
		return counts;
	};

	let counts = tally( labels );
	for ( const b of bindings ) {
		if ( counts.get( labels.get( b.id ) ) < 2 || ! [ 'attr', 'attr_part' ].includes( b.kind ) ) continue;
		const owner = semanticName( b.node, prefixes );
		if ( ! labels.get( b.id ).startsWith( owner ) ) labels.set( b.id, owner + ' ' + labels.get( b.id ) );
	}

	counts = tally( labels );
	const seen = new Map();
	for ( const b of bindings ) {
		const label = labels.get( b.id );
		if ( counts.get( label ) < 2 ) continue;
		const n = ( seen.get( label ) || 0 ) + 1;
		seen.set( label, n );
		labels.set( b.id, label + ' ' + n );
	}
	return labels;
}

/**
 * Attributes a row needs but whose control belongs out of sight. `data-*` is
 * deliberately not here: the ones that are wiring (`data-fci="0"`) count with
 * the row and have already become expressions, and what is left is content --
 * the journey stats' `data-short` is the label phones show.
 */
function isRowWiringAttr( name ) {
	return /^(role|id|for|tabindex|viewbox|xmlns|focusable|type|loading|decoding|fetchpriority|sizes|referrerpolicy|crossorigin)$/.test( name ) ||
		/^aria-(hidden|expanded|selected|current|pressed|checked|controls|labelledby|describedby|roledescription|live|atomic|haspopup|modal|orientation)$/.test( name );
}

/**
 * Express a list of per-row values as a function of the row's position.
 *
 *   first  row 1 differs, every other row agrees   (the active slide)
 *   table  anything else, repeating with the list (stagger delays)
 *
 * The values are the source file's own, printed verbatim.
 */
function positionalRule( values ) {
	const position = "( (int) $it['_uew_n'] )";
	if ( values.length > 1 && values[ 0 ] !== values[ 1 ] && values.slice( 1 ).every( ( v ) => v === values[ 1 ] ) ) {
		return { kind: 'first', expression: '( 1 === ' + position + ' ? ' + phpString( values[ 0 ] ) + ' : ' + phpString( values[ 1 ] ) + ' )' };
	}
	return {
		kind: 'table',
		expression: 'array( ' + values.map( phpString ).join( ', ' ) + ' )[ ( ' + position + ' - 1 ) % ' + values.length + ' ]',
	};
}

/** Classes present on some rows' class attribute but not all. */
function classDifferences( values ) {
	const lists = values.map( ( value ) => new Set( String( value ).trim().split( /\s+/ ).filter( Boolean ) ) );
	const all = new Set( lists.flatMap( ( list ) => [ ...list ] ) );
	return [ ...all ].filter( ( cls ) => ! lists.every( ( list ) => list.has( cls ) ) );
}

/**
 * One piece of an index-pattern expression. `_uew_n` (the row's position) and
 * `_uew_count` (how many rows) are supplied by the runtime, never stored, so an
 * added, removed or reordered row is always numbered right.
 */
function segmentExpression( segment ) {
	if ( 'literal' === segment.kind ) return phpString( segment.value );
	if ( 'count' === segment.kind ) return "$it['_uew_count']";
	return segment.offset ? "( (int) $it['_uew_n'] + " + segment.offset + ' )' : "$it['_uew_n']";
}

/**
 * Where the items of a run differ in their class attribute or in the
 * whitespace between their attributes, by element position within the item.
 */
function mapPositionalVariance( nodes, markup ) {
	const classPaths = new Set();
	const gapPaths = new Map();
	const lateAttrs = new Map();
	const triviaPaths = new Map();

	const visit = ( targets, path ) => {
		const key = path.join( '.' );

		// The whitespace and comments between child elements, where they differ
		// between items and hold nothing else -- a note on one card's photo.
		const childCounts = new Set( targets.map( ( node ) => elementChildren( node ).length ) );
		if ( 1 === childCounts.size && ! targets.some( ( node ) => VOID_TAGS.has( node.tagName.toLowerCase() ) ) ) {
			const count = elementChildren( targets[ 0 ] ).length;
			for ( let i = 0; i <= count; i += 1 ) {
				const texts = targets.map( ( node ) => {
					const range = childGapRange( node, i );
					return range ? markup.slice( range.start, range.end ) : null;
				} );
				if ( texts.some( ( text ) => null === text ) || new Set( texts ).size < 2 ) continue;
				if ( ! texts.every( ( text ) => /^(?:\s|<!--[\s\S]*?-->)*$/.test( text ) ) ) continue;
				if ( ! texts.some( ( text ) => text.includes( '<!--' ) ) ) continue;
				if ( ! triviaPaths.has( key ) ) triviaPaths.set( key, new Set() );
				triviaPaths.get( key ).add( i );
			}
		}
		const classes = targets.map( ( node ) => attr( node, 'class' ) );
		if ( classes.every( ( value ) => null !== value ) && new Set( classes ).size > 1 ) classPaths.add( key );

		// Attributes some later item carries but the first does not -- one
		// moment photo's `style="object-position: center 82%"`, the brochure
		// link's `target="_blank" rel="noopener"`. The first item is the row
		// template, so each run of them needs a slot in it, anchored on the
		// attribute row 1 also has that comes just before the run (or on the
		// tag name, when the run comes first).
		const firstNames = ( targets[ 0 ].attrs || [] ).map( ( a ) => a.name );
		const anchors = new Set();
		for ( const node of targets.slice( 1 ) ) {
			const names = ( node.attrs || [] ).map( ( a ) => a.name );
			for ( let i = 0; i < names.length; ) {
				if ( firstNames.includes( names[ i ] ) ) {
					i += 1;
					continue;
				}
				anchors.add( i ? names[ i - 1 ] : null );
				while ( i < names.length && ! firstNames.includes( names[ i ] ) ) i += 1;
			}
		}
		if ( anchors.size ) lateAttrs.set( key, [ ...anchors ].map( ( anchor ) => ( { anchor, firstNames } ) ) );

		// Spacing between attributes, only where every item carries the same
		// attributes in the same order -- otherwise the gaps do not correspond.
		const names = targets.map( ( node ) => ( node.attrs || [] ).map( ( a ) => a.name ).join( ' ' ) );
		if ( new Set( names ).size === 1 ) {
			const count = ( targets[ 0 ].attrs || [] ).length;
			for ( let k = 0; k + 1 < count; k += 1 ) {
				const gaps = targets.map( ( node ) => attributeGap( markup, node, k ) );
				if ( gaps.every( ( gap ) => null !== gap ) && new Set( gaps ).size > 1 ) {
					if ( ! gapPaths.has( key ) ) gapPaths.set( key, new Set() );
					gapPaths.get( key ).add( k );
				}
			}
		}

		const counts = targets.map( ( node ) => elementChildren( node ).length );
		if ( new Set( counts ).size !== 1 ) return;
		for ( let i = 0; i < counts[ 0 ]; i += 1 ) {
			visit( targets.map( ( node ) => elementChildren( node )[ i ] ), path.concat( i ) );
		}
	};

	visit( nodes, [] );
	return { classPaths, gapPaths, lateAttrs, triviaPaths };
}

/**
 * Byte range of the content between child element i - 1 and child element i
 * of a node: i = 0 is before the first child, i = count is after the last.
 */
function childGapRange( node, i ) {
	if ( ! node.sourceCodeLocation || ! node.sourceCodeLocation.startTag ) return null;
	const inner = innerRange( node );
	const kids = elementChildren( node );
	const start = 0 === i ? inner.start : ( kids[ i - 1 ] ? outerRange( kids[ i - 1 ] ).end : null );
	const end = i === kids.length ? inner.end : ( kids[ i ] ? outerRange( kids[ i ] ).start : null );
	return null === start || null === end || end < start ? null : { start, end };
}

/**
 * Where a run of late attributes goes in a start tag: the end of its anchor
 * attribute, or the end of the tag name when the run comes first.
 */
function lateAttributeSlot( node, anchor ) {
	const location = loc( node );
	if ( null === anchor ) {
		const tag = location.startTag || location;
		return tag.startOffset + 1 + node.tagName.length;
	}
	const before = ( location.attrs || {} )[ anchor ];
	return before ? before.endOffset : null;
}

/**
 * The text an item's run of late attributes adds after an anchor: from the
 * anchor's end to the end of the run's last attribute, leading whitespace
 * included. Empty when the item has no such run there; null when the item
 * lacks the anchor itself, so the slot cannot be placed.
 */
function lateAttributeText( markup, node, anchor, firstNames ) {
	const names = ( node.attrs || [] ).map( ( a ) => a.name );
	const start = null === anchor ? 0 : names.indexOf( anchor ) + 1;
	if ( null !== anchor && 0 === start ) return null;

	let end = start;
	while ( end < names.length && ! firstNames.includes( names[ end ] ) ) end += 1;
	if ( end === start ) return '';

	const from = lateAttributeSlot( node, anchor );
	const last = ( loc( node ).attrs || {} )[ names[ end - 1 ] ];
	return null === from || ! last ? null : markup.slice( from, last.endOffset );
}

/** Byte range of the whitespace between attribute k and k + 1 of a start tag. */
function attributeGapRange( node, k ) {
	const location = loc( node );
	const attrs = node.attrs || [];
	if ( k + 1 >= attrs.length || ! location.attrs ) return null;
	const left = location.attrs[ attrs[ k ].name ];
	const right = location.attrs[ attrs[ k + 1 ].name ];
	if ( ! left || ! right || right.startOffset < left.endOffset ) return null;
	return { start: left.endOffset, end: right.startOffset };
}

function attributeGap( markup, node, k ) {
	const range = attributeGapRange( node, k );
	return range ? markup.slice( range.start, range.end ) : null;
}

/** The row control most worth showing as the repeater item's title. */
function pickLabelBinding( bindings ) {
	// What an editor can see and recognise the row by -- never wiring. A slide
	// row used to be titled by its `role`, so every slide read "group".
	const visible = ( b ) =>
		! b.positional && 'hidden' !== b.control && ! ( 'attr' === b.kind && isRowWiringAttr( b.attr ) );

	return (
		bindings.find( ( b ) => visible( b ) && b.kind === 'inner' && b.control === 'text' ) ||
		bindings.find( ( b ) => visible( b ) && ( b.kind === 'inner' || b.kind === 'text_run' ) ) ||
		bindings.find( ( b ) => visible( b ) && 'attr' === b.kind && [ 'alt', 'aria-label', 'title' ].includes( b.attr ) ) ||
		bindings.find( ( b ) => visible( b ) && b.control === 'text' ) ||
		null
	);
}

/**
 * What to call a row element's content control. A link's or a button's own
 * words are its "Text" -- its URL is the "Link" -- as in Elementor's Button
 * widget. Where the role says little ("Text", "Heading"), the element's own
 * class says more: a host card's `ab-ho-role` and `ab-ho-desc` are "Role" and
 * "Description", not "Text 1" and "Text 2".
 */
function rowElementLabel( node, prefixes ) {
	const tag = node.tagName.toLowerCase();
	if ( 'a' === tag || 'button' === tag ) return 'Text';

	const role = semanticName( node, prefixes );
	if ( [ 'Text', 'Heading', 'Container', 'Content', 'Item' ].includes( role ) ) {
		const cls = namingClass( node );
		if ( cls !== tag ) {
			const named = humanizeClass( cls, prefixes );
			if ( named && named !== role ) return named;
		}
	}
	return role;
}

/**
 * Find bindings whose value across the rows is exactly `<prefix><n><suffix>`
 * with n counting up by one. Those are mechanical (ids, aria wiring), not
 * content, and become an expression on the row's position.
 *
 * The count need not start at 1. The Travel Essentials accordion's first item
 * is open by default and so is not part of the repeater; the run it starts is
 * numbered 3, 4, 5, 6. Recognising only a run from 1 left those ids as plain
 * text, and Elementor's "Add Item" -- which fills a new row with row 1's values
 * -- gave the new item a second `fc-det-btn-3`.
 */
function detectIndexPatterns( bindings, rows ) {
	if ( rows.length < 2 ) return [];
	const found = [];

	for ( const binding of bindings ) {
		if ( binding.kind !== 'attr' ) continue;
		const values = rows.map( ( row ) => row[ binding.id ] );
		if ( values.some( ( value ) => typeof value !== 'string' ) ) continue;

		const first = values[ 0 ];
		for ( const match of first.matchAll( /\d+/g ) ) {
			// A leading zero would not survive being rebuilt from a number.
			if ( match[ 0 ].length > 1 && match[ 0 ].startsWith( '0' ) ) continue;

			const start = parseInt( match[ 0 ], 10 );
			const prefix = first.slice( 0, match.index );
			const suffix = first.slice( match.index + match[ 0 ].length );
			const counts = values.every( ( value, index ) => value === prefix + ( start + index ) + suffix );
			if ( counts ) {
				found.push( {
					id: binding.id,
					segments: [
						...totalSegments( prefix, rows.length ),
						{ kind: 'index', offset: start - 1 },
						...totalSegments( suffix, rows.length ),
					],
				} );
				break;
			}
		}
	}

	return found;
}

/**
 * Split a constant around the list's own length when it is stated as a total
 * -- the " of 5" in a slide's "2 of 5" -- so the total grows with the list.
 * Only "of N" and "/ N" count: a bare 2 inside `sj-ch2-` is a chapter number
 * that happens to match a two-item list, not a total.
 */
function totalSegments( text, total ) {
	if ( ! text ) return [];
	const match = total > 1 ? text.match( new RegExp( '(\\bof\\s+|/\\s*)(' + total + ')(?!\\d)' ) ) : null;
	if ( ! match ) return [ { kind: 'literal', value: text } ];

	const at = match.index + match[ 1 ].length;
	const after = at + match[ 2 ].length;
	return [
		{ kind: 'literal', value: text.slice( 0, at ) },
		{ kind: 'count' },
		...( after < text.length ? [ { kind: 'literal', value: text.slice( after ) } ] : [] ),
	];
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

	// Comments are not part of the shape. One host card carries a note about
	// which photograph is the approved one; counting it made that card's whole
	// image wrapper raw markup in EVERY row, and six image pickers became one
	// HTML box. Comments that differ between items are bound per row instead --
	// see the "trivia" bindings.
	const shapeOf = ( node ) => elementChildren( node ).map( ( c ) => c.tagName.toLowerCase() ).join( ',' );

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

function collectRepeaterBindings( doc, template, markup, presence, opaquePaths, variance, prefixes = [] ) {
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
					label: rowElementLabel( node, prefixes ) + ' (HTML)',
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
					label: rowElementLabel( node, prefixes ),
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
					label: rowElementLabel( node, prefixes ),
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

		// Where items differ in the comments between their children -- one host
		// card's note on which photo is approved -- that whole span (comments
		// and the whitespace around them) is the row's own, so the note travels
		// with its card and a card without one renders without one.
		const triviaRanges = [];
		const trivia = ! consumedSubtree && variance ? variance.triviaPaths.get( path.join( '.' ) ) : null;
		for ( const gapIndex of trivia ? [ ...trivia ] : [] ) {
			const range = childGapRange( node, gapIndex );
			if ( ! range ) continue;
			triviaRanges.push( range );
			bindings.push( {
				id: uniqueBinding( 'notes', bindings, seen ),
				control: 'hidden',
				label: 'Notes',
				esc: 'trivia',
				range,
				kind: 'trivia',
				gapIndex,
				node,
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
				// Already carried, with its surroundings, by a trivia span.
				if ( triviaRanges.some( ( range ) => location.startOffset >= range.start && location.endOffset <= range.end ) ) continue;
				const id = uniqueBinding( 'note', bindings, seen );
				bindings.push( {
					id,
					control: 'hidden',
					label: 'Note',
					// Printed between `<!--` and `-->`: an edit must not close it.
					esc: 'comment',
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
		const key = path.join( '.' );

		for ( const a of node.attrs || [] ) {
			const name = a.name.toLowerCase();

			// A class list that differs between items -- `fc-ss-on` on the first
			// slide, `d2` on the third card -- is bound here and then rebuilt from
			// the row's position. Only the value is bound; the repeater-item class
			// is still appended after it.
			if ( 'class' === name && variance && variance.classPaths.has( key ) ) {
				const range = attrValueRange( markup, node, 'class' );
				if ( range ) {
					bindings.push( {
						id: uniqueBinding( 'class', bindings, seen ),
						control: 'hidden',
						label: 'Class',
						esc: 'attr',
						range: { start: range.start, end: range.end },
						kind: 'attr',
						attr: 'class',
						positional: 'class',
						node,
					} );
				}
				continue;
			}

			// A photo set in the row's own style attribute -- the hotel slides'
			// `background-image:url('…')` -- is an image, not CSS to type. Each
			// quoted url() becomes its own image control; the CSS around it stays
			// as written and the round trip proves every row shares it.
			if ( 'style' === name && isPresentOnAll( presence, node, name, path ) ) {
				const range = attrValueRange( markup, node, 'style' );
				const urls = range ? [ ...cssUrls( markup.slice( range.start, range.end ) ) ] : [];
				if ( urls.length ) {
					urls.forEach( ( url, partIndex ) => {
						bindings.push( {
							id: uniqueBinding( 'background_image', bindings, seen ),
							control: 'media',
							label: 'Background Image',
							esc: 'cssurl',
							range: { start: range.start + url.start, end: range.start + url.end },
							kind: 'attr_part',
							attr: 'style',
							partIndex,
							node,
						} );
					} );
					continue;
				}
			}

			// Inside a repeater, wiring attributes (`id`, `for`, `aria-controls`)
			// legitimately differ per row, so they are bound rather than locked.
			// An unvarying `class` stays locked: it carries the styling hook and
			// the injected repeater-item class.
			if ( REPEATER_LOCKED_ATTRS.has( name ) ) continue;

			const presentOnAll = isPresentOnAll( presence, node, name, path );
			const range = presentOnAll ? attrValueRange( markup, node, name ) : attrWholeRange( markup, node, name );
			if ( ! range ) continue;

			const control =
				! presentOnAll ? 'hidden'
					: URL_ATTRS.has( name ) ? 'url'
						: MEDIA_ATTRS.has( name ) ? mediaControlFor( node, attr( node, name ) )
							: 'text';
			// An optional attribute is printed inside the start tag, so it is
			// escaped as attributes (`attrs`), never as post content: a value
			// with no tags in it would sail through kses and could open an
			// event handler. See Value_Formatter::attrs().
			const esc = ( control === 'url' || control === 'media' ) ? 'url' : ( presentOnAll ? 'attr' : 'attrs' );
			const id = uniqueBinding( name === 'value' ? 'value' : slug( name ), bindings, seen );
			bindings.push( {
				id,
				control,
				label: presentOnAll ? attributeLabel( name, node ) : titleCase( name ) + ' (optional attribute)',
				esc,
				range: { start: range.start, end: range.end },
				kind: presentOnAll ? 'attr' : 'attr_whole',
				attr: name,
				node,
			} );
		}

		// Attributes only a later item carries get a zero-width slot here; the
		// row stores the whole ` name="value"` or nothing.
		for ( const late of ( variance && variance.lateAttrs.get( key ) ) || [] ) {
			const at = lateAttributeSlot( node, late.anchor );
			if ( null === at ) continue;
			bindings.push( {
				id: uniqueBinding( 'extra_attributes', bindings, seen ),
				control: 'hidden',
				label: 'Extra attributes (optional)',
				esc: 'attrs',
				range: { start: at, end: at },
				kind: 'attr_slot',
				anchor: late.anchor,
				firstNames: late.firstNames,
				node,
			} );
		}

		// Spacing between attributes that differs between items. The dots line
		// their attributes up in columns, so the first dot -- whose class is
		// longer -- has fewer spaces after it than the rest.
		const gaps = variance && variance.gapPaths.get( key );
		for ( const k of gaps ? [ ...gaps ] : [] ) {
			const range = attributeGapRange( node, k );
			if ( ! range ) continue;
			bindings.push( {
				id: uniqueBinding( 'gap', bindings, seen ),
				control: 'hidden',
				label: 'Spacing',
				esc: 'ws',
				range,
				kind: 'gap',
				gapIndex: k,
				positional: 'gap',
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

/**
 * Make repeater panel names unique. A form with five dropdowns produces five
 * panels called "Options"; each is qualified by the element that owns it, whose
 * id usually reads best (`fc2Country` -> "Country Options").
 */
function assignRepeaterLabels( entries, prefixes, doc ) {
	// Work out which names collide BEFORE renaming any of them. Counting as we
	// go would qualify the first few and leave the last one bare, because by
	// then it is the only panel still called "Options".
	const tally = new Map();
	for ( const entry of entries ) {
		// The plain name, before qualifying: within its own block a list
		// needs no "Journeys" in front to tell it apart (deriveRegions).
		entry.definition.base_label = entry.definition.label;
		tally.set( entry.definition.label, ( tally.get( entry.definition.label ) || 0 ) + 1 );
	}

	for ( const entry of entries ) {
		if ( ( tally.get( entry.definition.label ) || 0 ) < 2 || ! entry.owner ) continue;

		// The hotel slideshows name themselves on the slides, not on the track:
		// `aria-label="The Da Vinci — 1 of 3"`. Fall back to the first item once
		// the owner chain has nothing to offer.
		const hint = ownerHint( entry.owner, prefixes, doc ) || firstItemHint( entry.item );
		if ( hint ) entry.definition.label = hint + ' ' + entry.definition.label;
	}

	// Number what still collides -- counted BEFORE renaming, for the same
	// reason as above: counting as we go left the last of three lists named
	// plain "Cards" after the first two became "Cards 1" and "Cards 2".
	const remaining = new Map();
	for ( const entry of entries ) {
		remaining.set( entry.definition.label, ( remaining.get( entry.definition.label ) || 0 ) + 1 );
	}
	const seen = new Map();
	for ( const entry of entries ) {
		const name = entry.definition.label;
		if ( ( remaining.get( name ) || 0 ) < 2 ) continue;
		const n = ( seen.get( name ) || 0 ) + 1;
		seen.set( name, n );
		entry.definition.label = name + ' ' + n;
	}
}

/**
 * A human name for the element that owns a list: its id, name or label. When
 * the immediate parent says nothing -- an unnamed <div> wrapping a slide track --
 * look a couple of levels up, so the three hotel slideshows come out as
 * "The Da Vinci Slides" rather than "Slides 1", "Slides 2", "Slides".
 */
function ownerHint( node, prefixes, doc, depth = 3 ) {
	let current = node;
	for ( let level = 0; level < depth && current; level += 1 ) {
		const hint = ownerHintFrom( current, prefixes );
		if ( hint ) return hint;
		current = doc ? doc.parentsOf.get( current )?.node : null;
	}
	return '';
}

/**
 * A name taken from the first item of a list, for when the list itself is
 * anonymous. `aria-label="The Da Vinci — 1 of 3"` gives "The Da Vinci": the
 * counter after the dash is what makes each item unique, so it is dropped.
 */
function firstItemHint( node ) {
	if ( ! node ) return '';

	const label = attr( node, 'aria-label' ) || attr( node, 'title' ) || '';
	if ( ! label ) return '';

	const stem = label.split( /\s+[—–-]\s+/ )[ 0 ].trim();
	if ( ! stem || /^\d/.test( stem ) || stem.length > 28 ) return '';

	return titleCase( previewText( stem, 28 ) );
}

function ownerHintFrom( node, prefixes ) {
	const id = attr( node, 'id' ) || '';
	const name = attr( node, 'name' ) || '';
	const aria = attr( node, 'aria-label' ) || '';

	// `fc2Country` -> "Country". Strip a short lowercase/numeric prefix and split
	// camelCase; an id like MERGE2 says nothing, so it is not used.
	// `fc2Country` -> `Country`, `umoyaTitle` -> `Title`. Only the section's own
	// namespace is stripped, and only when a capitalised word follows it:
	// guessing at any lowercase run would turn `emailAddress` into `Address`.
	const namespaces = [ ...new Set( prefixes.flatMap( ( prefix ) => prefix.split( '-' ) ).filter( Boolean ) ) ]
		.sort( ( a, b ) => b.length - a.length );
	// `[0-9]` rather than `\d`: this pattern is assembled as a string, and a lone
	// backslash in a string literal is an escape, not a backslash.
	const pattern = namespaces.length ? '^(?:' + namespaces.join( '|' ) + ')[0-9]*([A-Z].*)$' : '^$';
	const fromId = ( id.match( new RegExp( pattern ) ) || [ '', id ] )[ 1 ]
		.replace( /([a-z])([A-Z])/g, '$1 $2' )
		.trim();
	if ( fromId && ! /^\d+$/.test( fromId ) ) return titleCase( fromId );

	if ( aria ) return titleCase( previewText( aria, 22 ) );
	if ( name && ! /^MERGE\d+$/i.test( name ) ) return titleCase( name );

	return '';
}

/**
 * A repeater panel holds a list, so its name says so: Slides, Stats, Items.
 * English being English, a couple of endings need care.
 */
function pluralise( name ) {
	// A run of <p> is named Text, and "Texts" is not a word anyone uses for it.
	if ( /(^|\s)Text$/.test( name ) ) return name.replace( /Text$/, 'Paragraphs' );
	if ( /s$/i.test( name ) ) return name;
	if ( /(ch|sh|x|z)$/i.test( name ) ) return name + 'es';
	if ( /[^aeiou]y$/i.test( name ) ) return name.slice( 0, -1 ) + 'ies';
	return name + 's';
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
		} else if ( b.kind === 'trivia' ) {
			const range = childGapRange( target, b.gapIndex );
			const text = range ? markup.slice( range.start, range.end ) : null;
			if ( null === text || ! /^(?:\s|<!--[\s\S]*?-->)*$/.test( text ) ) {
				lastExtractFailure = 'binding "' + b.id + '" expected only whitespace and comments at child gap ' + b.gapIndex + ' of <' + target.tagName + '>';
				return null;
			}
			values[ b.id ] = text;
		} else if ( b.kind === 'attr_part' ) {
			const range = attrValueRange( markup, target, b.attr );
			const url = range ? [ ...cssUrls( markup.slice( range.start, range.end ) ) ][ b.partIndex ] : null;
			if ( ! url ) {
				lastExtractFailure = 'binding "' + b.id + '" expected url() number ' + ( b.partIndex + 1 ) + ' in [' + b.attr + ']';
				return null;
			}
			values[ b.id ] = url.value;
		} else if ( b.kind === 'attr_slot' ) {
			const text = lateAttributeText( markup, target, b.anchor, b.firstNames );
			if ( null === text ) {
				lastExtractFailure = 'binding "' + b.id + '" needs [' + b.anchor + '], which this item does not have';
				return null;
			}
			values[ b.id ] = text;
		} else if ( b.kind === 'gap' ) {
			const gap = attributeGap( markup, target, b.gapIndex );
			if ( null === gap ) {
				lastExtractFailure = 'binding "' + b.id + '" expected spacing after attribute ' + ( b.gapIndex + 1 ) + ' of <' + target.tagName + '>';
				return null;
			}
			values[ b.id ] = gap;
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
