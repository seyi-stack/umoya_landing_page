/**
 * Private & Tailormade section registry.
 *
 * Five sections, in the placement order of _NEW-PAGES-NOTES.md. The page sits
 * between the shared site nav (first) and the shared footer (last), which live
 * in the Site-wide category.
 *
 * The form submits to its own HubSpot form ("Private & Tailormade Inquiry",
 * 28e4e3e3) with source `private_tailormade_page`. Its MERGE* field names are
 * resolved per source by class-submissions.php, so they must not be renamed
 * from the widget panel without updating that alias table too.
 */

export const category = {
	slug: 'umoya-pt',
	title: 'Umoya - Private & Tailormade',
	icon: 'eicon-user-preferences',
	keywords: [ 'private', 'tailormade', 'tailor made', 'bespoke' ],
};

export const sections = [
	{
		key: 'pt_hero',
		source: 'private-tailormade/section-01-hero.html',
		name: 'umoya-pt-hero',
		title: 'P&T Hero',
		class_name: 'PT_Hero',
		icon: 'eicon-banner',
		description: 'Full-bleed image hero, "A Journey Entirely Your Own".',
	},
	{
		key: 'pt_intro',
		source: 'private-tailormade/section-02-intro.html',
		name: 'umoya-pt-intro',
		title: 'P&T Intro',
		class_name: 'PT_Intro',
		icon: 'eicon-info-circle-o',
		description: 'Make It Your Own: centred editorial intro on cream.',
	},
	{
		key: 'pt_trip_types',
		source: 'private-tailormade/section-03-trip-types.html',
		name: 'umoya-pt-trip-types',
		title: 'P&T Trip Types',
		class_name: 'PT_Trip_Types',
		icon: 'eicon-posts-carousel',
		description: 'Scroll-snap rail of the six trip-type cards plus the blank-page card, with arrows. The hero links here.',
		spec: {
			// Names for this section's blocks where the automatic ones ("Content 1",
			// "Card") would not tell an editor which part of the page they are.
			regionLabels: {
				'.pt-tt-c': 'Scroll hint',
				'.pt-tt-stage': 'Cards',
			},
		},
	},
	{
		key: 'pt_how',
		source: 'private-tailormade/section-04-how-it-works.html',
		name: 'umoya-pt-how',
		title: 'P&T How Tailoring Works',
		class_name: 'PT_How',
		icon: 'eicon-number-field',
		description: 'Three numbered steps on the cream band.',
	},
	{
		key: 'pt_design_form',
		source: 'private-tailormade/section-05-design-form.html',
		name: 'umoya-pt-design-form',
		title: 'P&T Design Your Journey Form',
		class_name: 'PT_Design_Form',
		icon: 'eicon-form-horizontal',
		description: 'Inquiry form. Posts to WordPress first, then the Private & Tailormade HubSpot form. Every "Design Your Journey" button targets it.',
		spec: {
			// Names for this section's blocks where the automatic ones ("Content 1",
			// "Card") would not tell an editor which part of the page they are.
			regionLabels: {
				'.pt-df-card': 'Form',
			},
			optionNotices: {
				'#ptOccasion': '<strong>These values must match the HubSpot property <code>trip_occasion</code> exactly.</strong> ' +
					'It is a required dropdown on the Private &amp; Tailormade Inquiry form, so a value HubSpot does not list gets the whole enquiry rejected. Change both together.',
			},
		},
	},
];
