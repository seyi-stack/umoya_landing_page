/**
 * Founder's Circle section registry.
 *
 * `source` points at founders-circle-revamp/, which is the current working copy
 * (the flat founders-circle/ folder is the superseded original -- see CLAUDE.md
 * section 6, "Which folder is current?"). The legacy generator pointed at the
 * old folder, which is why re-running it never picked up recent work.
 *
 * Order matches the recommended Elementor placement order in
 * founders-circle-revamp/_REVAMP-NOTES.md.
 */

export const category = {
	slug: 'umoya-fc',
	title: "Umoya - Founder's Circle",
	icon: 'eicon-globe',
};

export const sections = [
	{
		key: 'fc_nav',
		source: 'founders-circle-revamp/section-00-nav.html',
		name: 'umoya-fc-nav',
		title: 'FC Navigation',
		class_name: 'FC_Nav',
		icon: 'eicon-nav-menu',
		description: 'Sticky Founder’s Circle navigation with the section table-of-contents bar.',
	},
	{
		key: 'fc_hero',
		source: 'founders-circle-revamp/section-01-hero.html',
		name: 'umoya-fc-hero',
		title: 'FC Hero',
		class_name: 'FC_Hero',
		icon: 'eicon-banner',
		description: 'Full-viewport hero with poster image, optional background video and a single CTA.',
	},
	{
		key: 'fc_invitation',
		source: 'founders-circle-revamp/section-02-invitation.html',
		name: 'umoya-fc-invitation',
		title: 'FC Invitation',
		class_name: 'FC_Invitation',
		icon: 'eicon-info-circle-o',
		description: 'Centred invitation statement: eyebrow, heading, body copy and outline CTA.',
	},
	{
		key: 'fc_privileges',
		source: 'founders-circle-revamp/section-03-membership-privileges.html',
		name: 'umoya-fc-privileges',
		title: 'FC Membership Privileges',
		class_name: 'FC_Privileges',
		icon: 'eicon-check-circle',
		description: 'Membership privileges checklist beside a portrait image.',
	},
	{
		key: 'fc_form',
		source: 'founders-circle-revamp/section-04-inquiry-form.html',
		name: 'umoya-fc-form',
		title: 'FC Inquiry Form',
		class_name: 'FC_Form',
		icon: 'eicon-form-horizontal',
		description: "Founder's Circle inquiry form. Posts to WordPress first, then HubSpot.",
	},
	{
		key: 'fc_journey',
		source: 'founders-circle-revamp/section-05-journey.html',
		name: 'umoya-fc-journey',
		title: 'FC Journey',
		class_name: 'FC_Journey',
		icon: 'eicon-map-pin',
		description: 'Journey stats, the three immersive-chapter tiles and the two extension tiles.',
	},
	{
		key: 'fc_early_access',
		source: 'founders-circle-revamp/section-06-early-access.html',
		name: 'umoya-fc-early-access',
		title: 'FC Early Access',
		class_name: 'FC_Early_Access',
		icon: 'eicon-star',
		description: 'Exclusive early-access copy with the supporting image collage.',
	},
	{
		key: 'fc_founding_offer',
		source: 'founders-circle-revamp/section-07-founding-offer.html',
		name: 'umoya-fc-founding-offer',
		title: 'FC Founding Offer',
		class_name: 'FC_Founding_Offer',
		icon: 'eicon-price-table',
		description: 'The founding offer statement on brand brown, with the reserve CTA.',
	},
	{
		key: 'fc_approach',
		source: 'founders-circle-revamp/section-08-our-approach.html',
		name: 'umoya-fc-approach',
		title: 'FC Our Approach',
		class_name: 'FC_Approach',
		icon: 'eicon-play-o',
		description: 'Our Approach copy balanced against the brand video panel.',
	},
	{
		key: 'fc_why',
		source: 'founders-circle-revamp/section-09-why-umoya.html',
		name: 'umoya-fc-why',
		title: 'FC Why Umoya',
		class_name: 'FC_Why',
		icon: 'eicon-columns',
		description: 'The four Why Umoya pillars over a darkened image.',
	},
	{
		key: 'fc_essentials',
		source: 'founders-circle-revamp/section-10-travel-essentials.html',
		name: 'umoya-fc-essentials',
		title: 'FC Travel Essentials',
		class_name: 'FC_Essentials',
		icon: 'eicon-accordion',
		description: 'Travel Essentials accordion; one item open at a time.',
	},
	{
		key: 'fc_closing_cta',
		source: 'founders-circle-revamp/section-11-closing-cta.html',
		name: 'umoya-fc-closing-cta',
		title: 'FC Closing CTA',
		class_name: 'FC_Closing_CTA',
		icon: 'eicon-call-to-action',
		description: 'Closing "Speak With a Travel Expert" band.',
	},
];
