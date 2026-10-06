/**
 * Site-wide section registry: the shared nav and footer, and the stand-alone
 * content pages that sit between them.
 *
 * Deliberately NOT compiled, although they live in shared/:
 *
 *   page-email-preferences.html  The footer's Email Opt-out became a popup
 *                                inside the footer on 2026-09-02. The page is
 *                                kept, unpublished, only in case the standalone
 *                                route is wanted back (CLAUDE.md Phase 21).
 *   color-scheme-lock.html       Not a section -- a style block and a script
 *                                with no element to render. The nav and footer
 *                                widgets already carry the same lock.
 *   section-00-nav - backup.html A backup copy.
 *
 * The legal pages' copy is the client's own drafting, reproduced verbatim with
 * British spellings. Editing it in the panel edits a legal document.
 */

export const category = {
	slug: 'umoya-site',
	title: 'Umoya - Site-wide',
	icon: 'eicon-theme-builder',
	keywords: [ 'site', 'global', 'shared' ],
};

export const sections = [
	{
		key: 'site_nav',
		source: 'shared/section-00-nav.html',
		name: 'umoya-site-nav',
		title: 'Site Navigation',
		class_name: 'Site_Nav',
		icon: 'eicon-nav-menu',
		description: 'The one navigation for every page: docks above the hero, sticks and hides on scroll down, returns on scroll up. Place it first.',
		spec: {
			// Names for this section's blocks where the automatic ones ("Content 1",
			// "Card") would not tell an editor which part of the page they are.
			regionLabels: {
				'.umoya-nav-inner': 'Bar',
				'.umoya-nav-links': 'Links',
				'.umoya-nav-dropdown-list': 'Phone menu',
				'.umoya-nav-dropdown-cta-row': 'Phone menu button',
			},
		},
	},
	{
		key: 'site_footer',
		source: 'shared/section-99-footer.html',
		name: 'umoya-site-footer',
		title: 'Site Footer',
		class_name: 'Site_Footer',
		icon: 'eicon-footer',
		description: 'The one footer for every page, with the Founder\'s Circle signup and the Email Opt-out dialog. Place it last.',
		spec: {
			// Names for this section's blocks where the automatic ones ("Content 1",
			// "Card") would not tell an editor which part of the page they are.
			regionLabels: {
				'.umoya-ft-brand': 'Brand',
				'.umoya-ft-signup': 'Sign-up',
				'.umoya-ft-bottom-inner': 'Bottom bar',
				'.umoya-ep-dialog': 'Email opt-out pop-up',
			},
			// Element names the class names cannot supply.
			overrides: {
				'.umoya-ft-descriptor': { label: 'Description' },
				'.umoya-ft-contact > a': { label: 'Email Link' },
				'.umoya-ft-fine > a': { label: 'Privacy Link' },
				'.umoya-ft-legalline': { label: 'Copyright Line' },
				'span': { label: 'Year' },
				'.umoya-ft-tag': { label: 'Tagline' },
				'#umoya-email-optout a': { label: 'Email Link' },
			},
			// The opt-out dialog appends itself to <body> on init so a transformed
			// ancestor cannot break its position: fixed. Its style controls need
			// the portal branch to follow it there.
			portals: [ { selector: '#umoya-email-optout', trigger: '[data-umoya-email-optout]' } ],
		},
	},
	{
		key: 'page_404',
		source: 'shared/page-404.html',
		name: 'umoya-page-404',
		title: '404 Page',
		class_name: 'Page_404',
		icon: 'eicon-error-404',
		description: 'Page-not-found body. Use it in the Theme Builder 404 template, never on a published page, or the dead URL answers 200.',
		spec: {
			// Names for this section's blocks where the automatic ones ("Content 1",
			// "Card") would not tell an editor which part of the page they are.
			regionLabels: {
				'#umoya-404': 'Watermark',
				'.um404-c': 'Message',
			},
		},
	},
	{
		key: 'page_travel_essentials',
		source: 'shared/page-travel-essentials.html',
		name: 'umoya-page-travel-essentials',
		title: 'Travel Essentials Page',
		class_name: 'Page_Travel_Essentials',
		icon: 'eicon-document-file',
		description: 'The /travel-essentials/ page: visas, entry and insurance, consolidated.',
		spec: {
			// Names for this section's blocks where the automatic ones ("Content 1",
			// "Card") would not tell an editor which part of the page they are.
			regionLabels: {
				'.te-c': 'Note',
				'.te-contact': 'Questions',
			},
		},
	},
	{
		key: 'page_privacy',
		source: 'shared/page-privacy-policy.html',
		name: 'umoya-page-privacy',
		title: 'Privacy Policy Page',
		class_name: 'Page_Privacy',
		icon: 'eicon-lock-user',
		description: 'Privacy Policy v1.1 for /privacy/, with its contents list. Verbatim legal copy.',
	},
	{
		key: 'page_cookie',
		source: 'shared/page-cookie-policy.html',
		name: 'umoya-page-cookie',
		title: 'Cookie Policy Page',
		class_name: 'Page_Cookie',
		icon: 'eicon-lock',
		description: 'Cookie Policy v1.2 for /cookie-policy/, with the in-page CookieYes settings button. Verbatim legal copy.',
	},
];
