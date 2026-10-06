/**
 * Signature Journey section registry.
 *
 * Eight widgets from nine files. `section-07-cta.html` is deliberately NOT
 * compiled: the client had it removed because it duplicated the "Speak With a
 * Travel Expert" button in section 06's Offers panel, and `#sj-cta` no longer
 * exists on the page. The file is kept for history — see
 * signature-journey/_NOTES.md — so building a widget from it would hand an
 * editor a section that was explicitly taken off the page.
 *
 * Order matches the Elementor placement order in that same file.
 */

export const category = {
	slug: 'umoya-sj',
	title: 'Umoya - Signature Journey',
	icon: 'eicon-map-pin',
	keywords: [ 'signature journey', 'journey' ],
};

export const sections = [
	{
		key: 'sj_nav',
		source: 'signature-journey/section-00-nav.html',
		name: 'umoya-sj-nav',
		title: 'SJ Navigation',
		class_name: 'SJ_Nav',
		icon: 'eicon-nav-menu',
		description: 'Fixed top navigation for the Signature Journey page.',
		spec: {
			// Names for this section's blocks where the automatic ones ("Content 1",
			// "Card") would not tell an editor which part of the page they are.
			regionLabels: {
				'.sj-nav-inner': 'Bar',
				'.sj-nav-links': 'Links',
				'.sj-nav-dropdown-list': 'Phone menu',
				'.sj-nav-dropdown-cta-row': 'Phone menu button',
			},
		},
	},
	{
		key: 'sj_hero',
		source: 'signature-journey/section-01-hero.html',
		name: 'umoya-sj-hero',
		title: 'SJ Hero',
		class_name: 'SJ_Hero',
		icon: 'eicon-banner',
		description: 'One Journey, in Three Chapters — image only; the video was removed.',
	},
	{
		key: 'sj_overview',
		source: 'signature-journey/section-02-intro.html',
		name: 'umoya-sj-overview',
		title: 'SJ Overview',
		class_name: 'SJ_Overview',
		icon: 'eicon-info-circle-o',
		description: 'Intro copy, then the stat bar (10 Days · 3 Chapters · 2 Extensions · 7 Signature Moments).',
	},
	{
		key: 'sj_chapters',
		source: 'signature-journey/section-03-journey-chapters.html',
		name: 'umoya-sj-chapters',
		title: 'SJ Journey Chapters',
		class_name: 'SJ_Chapters',
		icon: 'eicon-post-list',
		description: 'The three chapters: History & Culture, Safari, The Cape.',
	},
	{
		key: 'sj_extensions',
		source: 'signature-journey/section-04-extensions.html',
		name: 'umoya-sj-extensions',
		title: 'SJ Extensions',
		class_name: 'SJ_Extensions',
		icon: 'eicon-plus-square',
		description: 'Optional extensions — Victoria Falls and Chobe — on the dark band.',
	},
	{
		key: 'sj_stays',
		source: 'signature-journey/section-05-stays.html',
		name: 'umoya-sj-stays',
		title: 'SJ Where You Stay',
		class_name: 'SJ_Stays',
		icon: 'eicon-image-rollover',
		description: 'Three hotel slideshows, advancing together on one shared clock.',
	},
	{
		key: 'sj_inclusions',
		source: 'signature-journey/section-06-inclusions-offers.html',
		name: 'umoya-sj-inclusions',
		title: 'SJ Inclusions & Offers',
		class_name: 'SJ_Inclusions',
		icon: 'eicon-price-list',
		description: 'Inclusions grid plus the sticky Offers panel. Its button opens the inquiry popup.',
		spec: {
			// Names for this section's blocks where the automatic ones ("Content 1",
			// "Card") would not tell an editor which part of the page they are.
			regionLabels: {
				'.sj-inc-cards': 'Included',
				'.sj-inc-price': 'Investment',
				'.sj-offers': 'Offers',
			},
		},
	},
	{
		key: 'sj_form_popup',
		source: 'signature-journey/section-08-form-popup.html',
		name: 'umoya-sj-form-popup',
		title: 'SJ Inquiry Popup',
		class_name: 'SJ_Form_Popup',
		icon: 'eicon-form-horizontal',
		description: 'Inquiry popup, lead source signature_journey_popup. Required on the page or the Offers button does nothing.',
		spec: {
			// Names for this section's blocks where the automatic ones ("Content 1",
			// "Card") would not tell an editor which part of the page they are.
			regionLabels: {
				'.umoya-form-dialog': 'Pop-up',
				'.umoya-form-card': 'Form',
			},
			// Moves itself to <body> on init; see the homepage popup's entry.
			portals: [ { selector: '#umoya-form-popup', trigger: '[data-umoya-form-popup]' } ],
		},
	},
];
