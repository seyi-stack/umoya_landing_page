/**
 * Homepage section registry.
 *
 * `source` points at homepage-revamp/, which is the current working copy. The
 * flat homepage/ folder is the superseded original — it is a materially
 * different page, not an older spelling of this one: the revamp added Ways to
 * Travel, Legends and Film + Award, and dropped the old pricing and homecoming
 * sections. The first-generation generator read homepage/, which is why
 * re-running it never picked up any of this.
 *
 * Order matches the Elementor placement order in
 * homepage-revamp/_REVAMP-NOTES.md. The popup is listed last because it is
 * position-independent — it moves itself to document.body — but it must be on
 * the page for any `data-umoya-form-popup` trigger to work.
 */

export const category = {
	slug: 'umoya-homepage',
	title: 'Umoya - Homepage',
	icon: 'eicon-home',
};

export const sections = [
	{
		key: 'home_nav',
		source: 'homepage-revamp/homepage-section-00-nav.html',
		name: 'umoya-home-nav',
		title: 'Home Navigation',
		class_name: 'Home_Nav',
		icon: 'eicon-nav-menu',
		description: 'Sticky homepage navigation, including the Ways to Travel link.',
	},
	{
		key: 'home_hero',
		source: 'homepage-revamp/homepage-section-01-hero.html',
		name: 'umoya-home-hero',
		title: 'Home Hero',
		class_name: 'Home_Hero',
		icon: 'eicon-banner',
		description: 'Homepage hero with the single Founder’s Circle call to action.',
	},
	{
		key: 'home_about',
		source: 'homepage-revamp/homepage-section-02-about.html',
		name: 'umoya-home-about',
		title: 'Home About',
		class_name: 'Home_About',
		icon: 'eicon-info-circle-o',
		description: 'About Umoya, directly below the hero.',
	},
	{
		key: 'home_signature_journey',
		source: 'homepage-revamp/homepage-section-03-signature-journey.html',
		name: 'umoya-home-signature-journey',
		title: 'Home Signature Journey',
		class_name: 'Home_Signature_Journey',
		icon: 'eicon-slider-push',
		description: 'Our Flagship Experience: stats plus the three-chapter carousel.',
	},
	{
		key: 'home_ways_to_travel',
		source: 'homepage-revamp/homepage-section-04-ways-to-travel.html',
		name: 'umoya-home-ways-to-travel',
		title: 'Home Ways to Travel',
		class_name: 'Home_Ways_To_Travel',
		icon: 'eicon-posts-carousel',
		description: 'Scroll-snap card carousel of the six ways to travel.',
	},
	{
		key: 'home_legends',
		source: 'homepage-revamp/homepage-section-05-legends.html',
		name: 'umoya-home-legends',
		title: 'Home Legends',
		class_name: 'Home_Legends',
		icon: 'eicon-person',
		description: 'Signature Moments Guided by South African Legends — the custodian cards.',
	},
	{
		key: 'home_hotel_stays',
		source: 'homepage-revamp/homepage-section-06-hotel-stays.html',
		name: 'umoya-home-hotel-stays',
		title: 'Home Hotel Stays',
		class_name: 'Home_Hotel_Stays',
		icon: 'eicon-image-rollover',
		description: 'Hotel Stays Worthy of the Journey — the three named properties.',
	},
	{
		key: 'home_founders_circle',
		source: 'homepage-revamp/homepage-section-07-founders-circle.html',
		name: 'umoya-home-founders-circle',
		title: 'Home Founder’s Circle',
		class_name: 'Home_Founders_Circle',
		icon: 'eicon-call-to-action',
		description: 'The condensed Founder’s Circle invitation.',
	},
	{
		key: 'home_film_award',
		source: 'homepage-revamp/homepage-section-08-film-award.html',
		name: 'umoya-home-film-award',
		title: 'Home Film & Award',
		class_name: 'Home_Film_Award',
		icon: 'eicon-play-o',
		description: 'Brand film (click to load) plus the ITFFA award callout.',
	},
	{
		key: 'home_why',
		source: 'homepage-revamp/homepage-section-09-why-umoya.html',
		name: 'umoya-home-why',
		title: 'Home Why Umoya',
		class_name: 'Home_Why',
		icon: 'eicon-columns',
		description: 'The four Why Umoya pillars.',
	},
	{
		key: 'home_essentials',
		source: 'homepage-revamp/homepage-section-10-travel-essentials.html',
		name: 'umoya-home-essentials',
		title: 'Home Travel Essentials',
		class_name: 'Home_Essentials',
		icon: 'eicon-accordion',
		description: 'Travel Essentials FAQ accordion.',
	},
	{
		key: 'home_speak_expert',
		source: 'homepage-revamp/homepage-section-11-speak-with-expert.html',
		name: 'umoya-home-speak-expert',
		title: 'Home Speak With an Expert',
		class_name: 'Home_Speak_Expert',
		icon: 'eicon-chat',
		description: 'Closing “We’d love to speak with you” band.',
	},
	{
		key: 'home_form_popup',
		source: 'homepage-revamp/homepage-form-popup.html',
		name: 'umoya-home-form-popup',
		title: 'Home Inquiry Popup',
		class_name: 'Home_Form_Popup',
		icon: 'eicon-form-horizontal',
		description: 'Shared inquiry popup. Must be on the page for any data-umoya-form-popup trigger to open.',
		// The dialog moves itself to document.body on init, so re-running the
		// script would leave a second copy behind rather than a fresh one.
		script_requires_root: true,
	},
];
