/**
 * Every page family the compiler builds, in the order their categories appear
 * in Elementor's widget panel.
 *
 * Site-wide comes first because every page starts with its navigation. Within
 * a family, sections are listed in the order they are placed on the page.
 */
import * as site from './site.mjs';
import * as foundersCircle from './founders-circle.mjs';
import * as homepage from './homepage.mjs';
import * as signatureJourney from './signature-journey.mjs';
import * as privateTailormade from './private-tailormade.mjs';
import * as about from './about.mjs';
import * as forGroups from './for-groups.mjs';
import * as contact from './contact.mjs';

export const registries = [
	site,
	foundersCircle,
	homepage,
	signatureJourney,
	privateTailormade,
	about,
	forGroups,
	contact,
];

/** Every section entry, flattened, with its registry's category attached. */
export function allSections() {
	return registries.flatMap( ( registry ) =>
		registry.sections.map( ( section ) => ( { ...section, category: registry.category } ) )
	);
}
