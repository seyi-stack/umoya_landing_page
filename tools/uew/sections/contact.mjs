/**
 * Contact page section registry.
 *
 * Three sections, in the placement order of contact/_NOTES.md, between the
 * shared site nav and the shared footer. Live at /contact/.
 *
 * The forms widget holds both panels and both HubSpot forms (Journey 1e38d41f,
 * General & Media ffececd7). Panel 2's enquiry-type <option> values are a
 * HubSpot ENUMERATION: an option edited here that HubSpot does not also know
 * is rejected on submit, so the two lists change together or not at all.
 */

export const category = {
	slug: 'umoya-contact',
	title: 'Umoya - Contact',
	icon: 'eicon-contact',
	keywords: [ 'contact', 'enquiry', 'enquiries' ],
};

export const sections = [
	{
		key: 'ct_hero',
		source: 'contact/section-01-hero.html',
		name: 'umoya-ct-hero',
		title: 'Contact Hero',
		class_name: 'Contact_Hero',
		icon: 'eicon-heading',
		description: 'Short centred header: eyebrow, "Talk to Us", rule and lead.',
	},
	{
		key: 'ct_forms',
		source: 'contact/section-02-forms.html',
		name: 'umoya-ct-forms',
		title: 'Contact Enquiry Forms',
		class_name: 'Contact_Forms',
		icon: 'eicon-form-horizontal',
		description: 'The two enquiry panels, Plan a Journey and General & Media, each on its own HubSpot form.',
		spec: {
			optionNotices: {
				'#ctGenType': '<strong>These values must match the HubSpot property <code>enquiry_type</code> exactly.</strong> ' +
					'It is a dropdown property: a value HubSpot does not list is not stored, and can get the enquiry rejected. Change both together.',
			},
		},
	},
	{
		key: 'ct_direct',
		source: 'contact/section-03-direct.html',
		name: 'umoya-ct-direct',
		title: 'Contact Direct Strip',
		class_name: 'Contact_Direct',
		icon: 'eicon-envelope',
		description: 'Email, media and office-address band for anyone who would rather not use a form.',
	},
];
