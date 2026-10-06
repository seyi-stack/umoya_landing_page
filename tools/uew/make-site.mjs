/**
 * Build the whole website on the local harness, one page per live page, with
 * every section widget in its real order -- for testing by hand.
 *
 *   node tools/uew/make-site.mjs
 *
 * Re-running refreshes the pages in place (they are keyed by slug), so it also
 * resets them after you have edited them. The homepage becomes the site's
 * front page. Slugs match the live site.
 *
 * Every page uses the navigation it uses live: the homepage, Founder's Circle
 * and Signature Journey keep their own, every other page the Site Navigation.
 * That way each of the 63 widgets appears exactly once.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { wp } from './lib/browser.mjs';

const repoRoot = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '..', '..' );
const index = JSON.parse( fs.readFileSync( path.join( repoRoot, 'umoya-elementor-widgets', 'includes', 'sections', 'index.json' ), 'utf8' ) );
const widgets = Array.isArray( index ) ? index : Object.values( index.sections || index );

// Every widget in a category, in placement order.
const family = ( category ) => widgets.filter( ( w ) => w.category === category ).map( ( w ) => w.name );

const NAV = 'umoya-site-nav';
const FOOTER = 'umoya-site-footer';

const pages = [
	{ slug: 'home', title: 'Home', widgets: [ ...family( 'umoya-homepage' ), FOOTER ] },
	{ slug: 'signature-journey', title: 'The Signature Journey', widgets: [ ...family( 'umoya-sj' ), FOOTER ] },
	{ slug: 'private-and-tailormade', title: 'Private & Tailormade', widgets: [ NAV, ...family( 'umoya-pt' ), FOOTER ] },
	{ slug: 'for-groups', title: 'For Groups', widgets: [ NAV, ...family( 'umoya-fg' ), FOOTER ] },
	{ slug: 'about-us', title: 'About Us', widgets: [ NAV, ...family( 'umoya-about' ), FOOTER ] },
	{ slug: 'founders-circle', title: "Founder's Circle", widgets: [ ...family( 'umoya-fc' ), FOOTER ] },
	{ slug: 'contact', title: 'Contact', widgets: [ NAV, ...family( 'umoya-contact' ), FOOTER ] },
	{ slug: 'privacy', title: 'Privacy Policy', widgets: [ NAV, 'umoya-page-privacy', FOOTER ] },
	{ slug: 'cookie-policy', title: 'Cookie Policy', widgets: [ NAV, 'umoya-page-cookie', FOOTER ] },
	{ slug: 'travel-essentials', title: 'Travel Essentials', widgets: [ NAV, 'umoya-page-travel-essentials', FOOTER ] },
	// Live, the 404 goes in a Theme Builder template; here it is a page to look at.
	{ slug: 'page-not-found-preview', title: '404 Page (preview)', widgets: [ NAV, 'umoya-page-404', FOOTER ] },
];

const placed = new Set( pages.flatMap( ( p ) => p.widgets ) );
const missing = widgets.map( ( w ) => w.name ).filter( ( name ) => ! placed.has( name ) );
if ( missing.length ) throw new Error( 'Widgets on no page: ' + missing.join( ', ' ) );

const job = path.join( os.tmpdir(), 'uew-site-job.json' );
fs.writeFileSync( job, JSON.stringify( { pages } ) );
const result = JSON.parse( wp( repoRoot, [ 'eval-file', path.join( repoRoot, 'tools', 'uew', 'make-pages.php' ), job ] ).trim().split( '\n' ).pop() );
fs.unlinkSync( job );

wp( repoRoot, [ 'option', 'update', 'show_on_front', 'page' ] );
wp( repoRoot, [ 'option', 'update', 'page_on_front', String( result.home.id ) ] );

console.log( '\n' + pages.length + ' pages, ' + placed.size + ' widgets:\n' );
for ( const page of pages ) {
	const url = page.slug === 'home' ? result.home.url.replace( /home\/?$/, '' ) : result[ page.slug ].url;
	console.log( '  ' + page.title.padEnd( 24 ) + url );
}
console.log( '\nEdit any of them: Pages > All Pages > Edit with Elementor.\n' );
