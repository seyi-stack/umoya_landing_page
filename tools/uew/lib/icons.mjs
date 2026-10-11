/**
 * The icon library the editor's icon picker offers (includes/sections/icons.json).
 *
 * Built from every schema on disk, not just the sections this run compiled, so
 * a `--only` build cannot shrink it:
 *
 *   1. every icon the section files already use, labelled by the row it sits in
 *      ("Visas & Entry") -- so the site's own drawings are always offered;
 *   2. a curated set of line icons from Lucide (ISC licence);
 *   3. social marks from Simple Icons (CC0), for the footer's social links.
 *
 * Each entry is only the inside of a 24x24 `<svg>`. The `<svg>` element stays
 * the section's own, so its class, size and stroke or fill rules keep applying
 * -- which is why Lucide's outer attributes (stroke-width 2) are dropped: the
 * section's own CSS draws the line at its own weight.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The packages' own folders. Simple Icons does not export its package.json, so
// they are found where npm puts them rather than through require.resolve().
const modules = path.join( path.dirname( fileURLToPath( import.meta.url ) ), '..', 'node_modules' );

/** Line icons a travel site reaches for, by Lucide name and the label shown. */
const LINE = [
	[ 'plane', 'Plane' ], [ 'plane-takeoff', 'Departure' ], [ 'plane-landing', 'Arrival' ], [ 'route', 'Route' ],
	[ 'map', 'Map' ], [ 'map-pin', 'Location' ], [ 'compass', 'Compass' ], [ 'globe', 'Globe' ], [ 'earth', 'Earth' ],
	[ 'signpost', 'Signpost' ], [ 'calendar', 'Calendar' ], [ 'calendar-days', 'Dates' ], [ 'clock', 'Time' ],
	[ 'luggage', 'Luggage' ], [ 'briefcase', 'Briefcase' ], [ 'backpack', 'Backpack' ], [ 'id-card', 'ID / Passport' ],
	[ 'book-open', 'Guide' ], [ 'languages', 'Languages' ], [ 'shield-check', 'Insurance / Safety' ],
	[ 'heart-pulse', 'Health' ], [ 'stethoscope', 'Medical' ], [ 'syringe', 'Vaccination' ], [ 'pill', 'Medication' ],
	[ 'thermometer', 'Climate' ], [ 'sun', 'Sun' ], [ 'sunrise', 'Sunrise' ], [ 'cloud-sun', 'Weather' ],
	[ 'umbrella', 'Umbrella' ], [ 'credit-card', 'Card payment' ], [ 'wallet', 'Wallet' ], [ 'banknote', 'Cash' ],
	[ 'coins', 'Coins' ], [ 'receipt', 'Receipt' ], [ 'phone', 'Phone' ], [ 'smartphone', 'Mobile' ],
	[ 'mail', 'Email' ], [ 'message-circle', 'Message' ], [ 'wifi', 'Wi-Fi' ], [ 'plug', 'Power plug' ],
	[ 'headphones', 'Concierge' ], [ 'user', 'Person' ], [ 'users', 'Group' ], [ 'baby', 'Children' ],
	[ 'accessibility', 'Accessibility' ], [ 'handshake', 'Handshake' ], [ 'hand-heart', 'Care' ],
	[ 'house', 'Home' ], [ 'hotel', 'Hotel' ], [ 'bed-double', 'Bed' ], [ 'utensils', 'Dining' ], [ 'wine', 'Wine' ],
	[ 'coffee', 'Coffee' ], [ 'car', 'Car' ], [ 'car-taxi-front', 'Transfer' ], [ 'bus', 'Coach' ],
	[ 'train-front', 'Train' ], [ 'ship', 'Ship' ], [ 'sailboat', 'Sailing' ], [ 'camera', 'Camera' ],
	[ 'binoculars', 'Safari' ], [ 'paw-print', 'Wildlife' ], [ 'fish', 'Ocean life' ], [ 'waves', 'Coast' ],
	[ 'mountain', 'Mountains' ], [ 'trees', 'Forest' ], [ 'leaf', 'Nature' ], [ 'sprout', 'Growth' ],
	[ 'tent', 'Camp' ], [ 'footprints', 'Walking' ], [ 'landmark', 'Heritage' ], [ 'church', 'Place of worship' ],
	[ 'drama', 'Theatre' ], [ 'music', 'Music' ], [ 'mic', 'Speaker' ], [ 'palette', 'Art' ], [ 'book', 'Story' ],
	[ 'graduation-cap', 'Learning' ], [ 'shopping-bag', 'Shopping' ], [ 'gift', 'Gift' ], [ 'ticket', 'Ticket' ],
	[ 'key', 'Key' ], [ 'lock', 'Secure' ], [ 'flag', 'Flag' ], [ 'star', 'Star' ], [ 'sparkles', 'Sparkle' ],
	[ 'award', 'Award' ], [ 'gem', 'Gem' ], [ 'crown', 'Crown' ], [ 'heart', 'Heart' ], [ 'info', 'Information' ],
	[ 'circle-help', 'Question' ], [ 'circle-check', 'Included' ], [ 'check', 'Check' ], [ 'file-text', 'Document' ],
];

/** Social marks by Simple Icons slug. LinkedIn is not in Simple Icons; the site's own mark covers it. */
const BRAND = [
	[ 'instagram', 'Instagram' ], [ 'facebook', 'Facebook' ], [ 'tiktok', 'TikTok' ], [ 'youtube', 'YouTube' ],
	[ 'x', 'X (Twitter)' ], [ 'whatsapp', 'WhatsApp' ], [ 'pinterest', 'Pinterest' ], [ 'threads', 'Threads' ],
	[ 'tripadvisor', 'Tripadvisor' ], [ 'spotify', 'Spotify' ], [ 'vimeo', 'Vimeo' ],
];

/** The inside of an `<svg>` file, its children only, one element after another. */
function innerOf( svg ) {
	const body = svg.replace( /<!--[\s\S]*?-->/g, '' ).replace( /^[\s\S]*?<svg\b[^>]*>/, '' ).replace( /<\/svg>\s*$/, '' );
	return body
		.replace( /<title>[\s\S]*?<\/title>/g, '' )
		.replace( />\s+</g, '><' )
		.replace( /\s*\/>/g, '/>' )
		.trim();
}

const normalise = ( markup ) => String( markup ).replace( /\s+/g, ' ' ).replace( />\s+</g, '><' ).replace( /\s*\/>/g, '/>' ).trim();

const plainText = ( html ) => String( html || '' )
	.replace( /<[^>]*>/g, ' ' )
	.replace( /&amp;/g, '&' ).replace( /&rsquo;|&#8217;/g, '’' ).replace( /&[a-z]+;/g, ' ' )
	.replace( /\s+/g, ' ' ).trim();

/**
 * @param {string} schemaDir includes/sections
 * @returns {{ line: object[], brand: object[] }}
 */
export function buildIconLibrary( schemaDir ) {
	const library = { line: [], brand: [] };
	const seen = { line: new Set(), brand: new Set() };
	const add = ( family, id, label, markup ) => {
		const key = normalise( markup );
		if ( ! markup || seen[ family ].has( key ) ) return;
		seen[ family ].add( key );
		library[ family ].push( { id, label, markup } );
	};

	// 1. The site's own icons, first, labelled by their row.
	const files = fs.readdirSync( schemaDir ).filter( ( f ) => f.endsWith( '.json' ) && ! [ 'index.json', 'categories.json', 'icons.json' ].includes( f ) ).sort();
	for ( const file of files ) {
		const schema = JSON.parse( fs.readFileSync( path.join( schemaDir, file ), 'utf8' ) );
		for ( const repeater of schema.repeaters || [] ) {
			const labelId = ( repeater.item_label || '' ).replace( /^\{\{\{ (\w+) \}\}\}$/, '$1' );
			for ( const control of repeater.controls ) {
				if ( 'icon' !== control.control ) continue;
				const family = control.family || 'line';
				repeater.rows.forEach( ( row, index ) => {
					const label = plainText( row[ labelId ] ).replace( /^Umoya Afrika Tours on /, '' ) || 'Icon ' + ( index + 1 );
					add( family, 'site-' + slug( schema.key + '-' + label ), label, row[ control.id ] ?? control.default );
				} );
			}
		}
	}

	// 2 and 3. The curated sets, after the site's own.
	const lucide = path.join( modules, 'lucide-static' );
	for ( const [ name, label ] of LINE ) {
		add( 'line', 'lucide-' + name, label, innerOf( fs.readFileSync( path.join( lucide, 'icons', name + '.svg' ), 'utf8' ) ) );
	}
	const simple = path.join( modules, 'simple-icons' );
	const brandLabels = new Set( library.brand.map( ( icon ) => icon.label ) );
	for ( const [ name, label ] of BRAND ) {
		if ( brandLabels.has( label ) ) continue; // the site's own mark wins
		add( 'brand', 'si-' + name, label, innerOf( fs.readFileSync( path.join( simple, 'icons', name + '.svg' ), 'utf8' ) ) );
	}

	return library;
}

function slug( value ) {
	return String( value ).toLowerCase().replace( /[^a-z0-9]+/g, '-' ).replace( /^-+|-+$/g, '' );
}
