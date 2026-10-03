/**
 * About Us section registry.
 *
 * Eight sections, in the placement order of _NEW-PAGES-NOTES.md, between the
 * shared site nav and the shared footer.
 *
 * The hosts section makes statements about real, named people. Its copy was
 * corrected from client feedback on 2026-08-22 and its photographs are the
 * resolved identities in CLAUDE.md -- the widget exposes them for editing, but
 * a change there is a factual claim, not a design tweak.
 */

export const category = {
	slug: 'umoya-about',
	title: 'Umoya - About Us',
	icon: 'eicon-info-box',
	keywords: [ 'about', 'about us', 'story' ],
};

export const sections = [
	{
		key: 'ab_hero',
		source: 'about/section-01-hero.html',
		name: 'umoya-ab-hero',
		title: 'About Hero',
		class_name: 'About_Hero',
		icon: 'eicon-banner',
		description: 'Centred hero with a poster image and an optional background video that fades in once it can play.',
	},
	{
		key: 'ab_who',
		source: 'about/section-02-who-we-are.html',
		name: 'umoya-ab-who',
		title: 'About Who We Are',
		class_name: 'About_Who',
		icon: 'eicon-slides',
		description: 'The meaning of "Umoya" beside an auto-advancing photo carousel with dot navigation.',
	},
	{
		key: 'ab_mission',
		source: 'about/section-03-mission.html',
		name: 'umoya-ab-mission',
		title: 'About Our Mission',
		class_name: 'About_Mission',
		icon: 'eicon-blockquote',
		description: 'The page\'s dark-brown accent band: the mission statement.',
	},
	{
		key: 'ab_story',
		source: 'about/section-04-our-story.html',
		name: 'umoya-ab-story',
		title: 'About Our Story',
		class_name: 'About_Story',
		icon: 'eicon-image-box',
		description: 'Founder\'s story: portrait left, copy right.',
	},
	{
		key: 'ab_choose',
		source: 'about/section-05-how-we-choose.html',
		name: 'umoya-ab-choose',
		title: 'About How We Choose',
		class_name: 'About_Choose',
		icon: 'eicon-text',
		description: 'Centred statement on white: the honesty and ownership position.',
	},
	{
		key: 'ab_hosts',
		source: 'about/section-06-hosts.html',
		name: 'umoya-ab-hosts',
		title: 'About Meet Our Hosts',
		class_name: 'About_Hosts',
		icon: 'eicon-person',
		description: 'Six host cards. Each names a real person or place; check identities in CLAUDE.md before swapping a photo.',
	},
	{
		key: 'ab_difference',
		source: 'about/section-07-difference.html',
		name: 'umoya-ab-difference',
		title: 'About The Umoya Difference',
		class_name: 'About_Difference',
		icon: 'eicon-icon-box',
		description: 'Four icon cards on what sets an Umoya journey apart.',
	},
	{
		key: 'ab_cta',
		source: 'about/section-08-cta.html',
		name: 'umoya-ab-cta',
		title: 'About Closing CTA',
		class_name: 'About_CTA',
		icon: 'eicon-call-to-action',
		description: 'Full-bleed image band with the page\'s closing call to action.',
	},
];
