/**
 * For Groups section registry.
 *
 * Eight sections, in the placement order of _NEW-PAGES-NOTES.md, between the
 * shared site nav and the shared footer.
 *
 * The form submits to its own HubSpot form ("Group Journey Inquiry", c201e387)
 * with source `for_groups_page`. `group_type` is one of the only two REQUIRED
 * custom HubSpot fields on any Umoya form, which is why its MERGE2 field name
 * must stay in step with the alias table in class-submissions.php.
 */

export const category = {
	slug: 'umoya-fg',
	title: 'Umoya - For Groups',
	icon: 'eicon-person',
	keywords: [ 'groups', 'for groups', 'group travel' ],
};

export const sections = [
	{
		key: 'fg_hero',
		source: 'for-groups/section-01-hero.html',
		name: 'umoya-fg-hero',
		title: 'Groups Hero',
		class_name: 'FG_Hero',
		icon: 'eicon-banner',
		description: 'Full-bleed image hero, "Bring Your Circle", left-aligned.',
	},
	{
		key: 'fg_intro',
		source: 'for-groups/section-02-intro.html',
		name: 'umoya-fg-intro',
		title: 'Groups Intro',
		class_name: 'FG_Intro',
		icon: 'eicon-info-circle-o',
		description: 'Traveling Together: centred editorial intro on cream.',
	},
	{
		key: 'fg_who',
		source: 'for-groups/section-03-who-travels.html',
		name: 'umoya-fg-who',
		title: 'Groups Who Travels With Us',
		class_name: 'FG_Who',
		icon: 'eicon-gallery-grid',
		description: 'Four photo cards for the group types Umoya hosts.',
	},
	{
		key: 'fg_organizer',
		source: 'for-groups/section-04-for-the-organizer.html',
		name: 'umoya-fg-organizer',
		title: 'Groups For the Organizer',
		class_name: 'FG_Organizer',
		icon: 'eicon-icon-box',
		description: 'The dark-brown accent band: four promises to the person who brings everyone along.',
	},
	{
		key: 'fg_how',
		source: 'for-groups/section-05-how-it-works.html',
		name: 'umoya-fg-how',
		title: 'Groups Planning Steps',
		class_name: 'FG_How',
		icon: 'eicon-number-field',
		description: 'Planning for Your Group: four numbered steps from first enquiry to arrival.',
	},
	{
		key: 'fg_journey',
		source: 'for-groups/section-06-journey-teaser.html',
		name: 'umoya-fg-journey',
		title: 'Groups Journey Teaser',
		class_name: 'FG_Journey',
		icon: 'eicon-post-list',
		description: 'Ten Days, Three Chapters: a preview of the Signature Journey. The hero links here.',
		spec: {
			// Names for this section's blocks where the automatic ones ("Content 1",
			// "Card") would not tell an editor which part of the page they are.
			regionLabels: {
				'.fg-jr-c': 'Text & button',
				'.fg-jr-chips': 'Chapters',
			},
		},
	},
	{
		key: 'fg_sizes',
		source: 'for-groups/section-07-sizes.html',
		name: 'umoya-fg-sizes',
		title: 'Groups Travel Fit for Any Size',
		class_name: 'FG_Sizes',
		icon: 'eicon-text',
		description: 'Short centred statement on scaling from a close circle to a full chapter.',
	},
	{
		key: 'fg_plan_form',
		source: 'for-groups/section-08-plan-form.html',
		name: 'umoya-fg-plan-form',
		title: 'Groups Plan a Journey Form',
		class_name: 'FG_Plan_Form',
		icon: 'eicon-form-horizontal',
		description: 'Group enquiry form. Posts to WordPress first, then the Group Journey HubSpot form. Every "Plan a Group Journey" button targets it.',
		spec: {
			// Names for this section's blocks where the automatic ones ("Content 1",
			// "Card") would not tell an editor which part of the page they are.
			regionLabels: {
				'.fg-pl-card': 'Form',
			},
			optionNotices: {
				'#fgType': '<strong>These values must match the HubSpot property <code>group_type</code> exactly.</strong> ' +
					'It is a required dropdown on the Group Journey Inquiry form, so a value HubSpot does not list gets the whole enquiry rejected. Change both together.',
			},
		},
	},
];
