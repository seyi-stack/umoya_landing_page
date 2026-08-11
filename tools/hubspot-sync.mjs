#!/usr/bin/env node
/**
 * Umoya — HubSpot Forms sync
 * =========================================================================
 * Creates / inspects the HubSpot contact properties and Marketing Forms that
 * back the Umoya website inquiry forms.
 *
 * This replaces the need for @hubspot/cli, which only targets HubSpot CMS
 * (themes/modules hosted ON HubSpot) and has no form-management commands.
 * Our forms live in WordPress/Elementor and submit INTO HubSpot, so the
 * Marketing Forms API is the correct surface.
 *
 * AUTH: reads HUBSPOT_TOKEN from .secrets/hubspot.env (git-ignored).
 *       Requires a Private App token with scopes:
 *         forms                       (read + write)
 *         crm.schemas.contacts.read/write   (to create custom properties)
 *
 * USAGE
 *   node tools/hubspot-sync.mjs info          # whoami / portal check
 *   node tools/hubspot-sync.mjs list-forms    # existing marketing forms
 *   node tools/hubspot-sync.mjs list-props    # relevant contact properties
 *   node tools/hubspot-sync.mjs create-props  # create the 4 custom properties
 *   node tools/hubspot-sync.mjs create-forms  # create the 2 dedicated forms
 *
 * All create-* commands are IDEMPOTENT: they check for an existing item by
 * name first and skip rather than duplicate.
 * =========================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILE = path.join(ROOT, '.secrets', 'hubspot.env');

/* ── Auth ──────────────────────────────────────────────────────────────── */
function loadToken() {
  if (process.env.HUBSPOT_TOKEN) return process.env.HUBSPOT_TOKEN.trim();
  if (!fs.existsSync(ENV_FILE)) {
    throw new Error(`Missing ${path.relative(ROOT, ENV_FILE)} (and no HUBSPOT_TOKEN env var).`);
  }
  const line = fs
    .readFileSync(ENV_FILE, 'utf8')
    .split(/\r?\n/)
    .find((l) => l.trim().startsWith('HUBSPOT_TOKEN='));
  if (!line) throw new Error('HUBSPOT_TOKEN not found in .secrets/hubspot.env');
  return line.slice(line.indexOf('=') + 1).trim();
}

const TOKEN = loadToken();
const BASE = 'https://api.hubapi.com';

async function hs(method, endpoint, body) {
  const res = await fetch(BASE + endpoint, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  if (text) { try { data = JSON.parse(text); } catch { data = text; } }
  if (!res.ok) {
    const msg = data && data.message ? data.message : (typeof data === 'string' ? data : res.statusText);
    const err = new Error(`${res.status} ${method} ${endpoint} — ${msg}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/* ── Contact properties ────────────────────────────────────────────────────
 * Two sets:
 *  (A) REPAIR — the live site has been submitting these four names since
 *      launch, but they never existed as contact properties, so HubSpot
 *      silently discarded every value (verified 2026-08-11 with a diagnostic
 *      submission). Creating them makes the Founder's Circle + homepage popup
 *      forms start capturing travel month/year/length and the message body
 *      with NO code change. Typed as free text because the same slot carries
 *      different vocabularies on different pages (month vs season, guest count
 *      vs journey length) — an enumeration would reject the odd ones out.
 *  (B) NEW — dedicated properties so Private & Tailormade and For Groups stop
 *      borrowing the `country` / `city` / `preferred_journey_length` slots.
 * ------------------------------------------------------------------------ */
const PROPERTIES = [
  /* (A) REPAIR */
  {
    name: 'preferred_travel_season',
    label: 'Preferred Travel Month / Season',
    type: 'string',
    fieldType: 'text',
    description: 'When the traveller hopes to travel. Carries a month on most forms.',
  },
  {
    name: 'preferred_travel_year',
    label: 'Preferred Travel Year',
    type: 'string',
    fieldType: 'text',
    description: 'Target travel year.',
  },
  {
    name: 'preferred_journey_length',
    label: 'Preferred Journey Length',
    type: 'string',
    fieldType: 'text',
    description: 'Journey length preference (Founder’s Circle / homepage popup).',
  },
  {
    name: 'founders_circle_message',
    label: 'Inquiry Message',
    type: 'string',
    fieldType: 'textarea',
    description: 'Free-text brief submitted with the inquiry.',
  },

  /* (B) NEW dedicated properties */
  {
    name: 'trip_occasion',
    label: 'Trip Occasion',
    type: 'enumeration',
    fieldType: 'select',
    description: 'Private & Tailormade — the occasion the journey is for.',
    options: [
      'Honeymoon', 'Anniversary', 'Birthday Celebration', 'Family Reunion',
      'Graduation', 'Retirement', 'Wedding Group', 'Bachelorette / Bachelor Trip',
      'Sorority or Fraternity Trip', 'Church or Faith Group',
      'Alumni or Professional Network', 'Corporate or Incentive Travel',
      'Friends Getaway', 'Solo Travel', 'Other',
    ],
  },
  {
    name: 'party_size',
    label: 'Party Size',
    type: 'string',
    fieldType: 'text',
    description: 'Number of travellers — free text on Private & Tailormade, a band on For Groups.',
  },
  {
    name: 'group_type',
    label: 'Group Type',
    type: 'enumeration',
    fieldType: 'select',
    description: 'For Groups — the kind of group travelling.',
    options: [
      'Sorority or fraternity', 'Church or faith community',
      'Alumni or professional network', 'Family or friends', 'Other',
    ],
  },
  {
    name: 'organization',
    label: 'Organization / Group Name',
    type: 'string',
    fieldType: 'text',
    description: 'For Groups — the chapter, church, alumni network or company.',
  },
];

const GROUP_NAME = 'contactinformation';

function toOptions(values) {
  return values.map((label, i) => ({ label, value: label, displayOrder: i, hidden: false }));
}

/* ── Commands ──────────────────────────────────────────────────────────── */
async function cmdInfo() {
  const info = await hs('GET', '/account-info/v3/details');
  console.log('Connected to HubSpot account:');
  console.log('  Portal ID :', info.portalId);
  console.log('  Type      :', info.accountType);
  console.log('  Time zone :', info.timeZone);
  console.log('  Currency  :', info.companyCurrency);
  console.log('  Data host :', info.dataHostingLocation ?? 'n/a');
  return info;
}

async function cmdListForms() {
  const data = await hs('GET', '/marketing/v3/forms?limit=100');
  const forms = data.results || [];
  console.log(`Existing marketing forms (${forms.length}):`);
  for (const f of forms) {
    console.log(`  • ${f.name}`);
    console.log(`      id=${f.id}  type=${f.formType}  created=${(f.createdAt || '').slice(0, 10)}`);
  }
  return forms;
}

async function cmdListProps() {
  const data = await hs('GET', '/crm/v3/properties/contacts');
  const all = data.results || [];
  const wanted = new Set([
    ...PROPERTIES.map((p) => p.name),
    'firstname', 'lastname', 'email', 'phone', 'country', 'city', 'salutation',
    'preferred_travel_season', 'preferred_travel_year', 'preferred_journey_length',
    'founders_circle_message',
  ]);
  const rows = all.filter((p) => wanted.has(p.name));
  console.log(`Relevant contact properties (${rows.length} of ${all.length} total):`);
  for (const p of rows.sort((a, b) => a.name.localeCompare(b.name))) {
    const custom = p.hubspotDefined ? 'built-in' : 'CUSTOM';
    console.log(`  • ${p.name.padEnd(28)} ${String(p.type).padEnd(12)} ${custom}`);
  }
  const missing = PROPERTIES.map((p) => p.name).filter((n) => !all.some((p) => p.name === n));
  console.log(missing.length ? `\nMissing (need creating): ${missing.join(', ')}` : '\nAll 4 custom properties already exist.');
  return { all, missing };
}

async function cmdCreateProps() {
  const existing = (await hs('GET', '/crm/v3/properties/contacts')).results || [];
  for (const spec of PROPERTIES) {
    if (existing.some((p) => p.name === spec.name)) {
      console.log(`  = ${spec.name} — already exists, skipped`);
      continue;
    }
    const body = {
      name: spec.name,
      label: spec.label,
      type: spec.type,
      fieldType: spec.fieldType,
      groupName: GROUP_NAME,
      description: spec.description,
    };
    if (spec.options) body.options = toOptions(spec.options);
    await hs('POST', '/crm/v3/properties/contacts', body);
    console.log(`  + ${spec.name} — created (${spec.type}/${spec.fieldType})`);
  }
}

/* Field helpers — shapes copied verbatim from the existing working form.
 * objectTypeId MUST be '0-1' (Contact). The legacy shared form wrongly used
 * '0-5' (Ticket) for two fields, which is why those values never reached the
 * contact record. */
function field(name, label, { required = false, fieldType = 'single_line_text', options } = {}) {
  const f = {
    objectTypeId: '0-1',
    name,
    label,
    required,
    hidden: false,
  };
  if (fieldType === 'email') {
    f.validation = { blockedEmailDomains: [], useDefaultBlockList: false };
  }
  if (fieldType === 'phone') {
    f.useCountryCodeSelect = false;
    f.validation = { minAllowedDigits: 7, maxAllowedDigits: 20 };
  }
  if (options) {
    f.options = options.map((label) => ({ label, value: label, description: '', displayOrder: -1 }));
  }
  f.fieldType = fieldType;
  return f;
}

/* NOTE ON CONSENT: legalConsentOptions is intentionally 'none', matching the
 * existing working form. These forms are used purely as API submission
 * targets — the POPIA consent checkbox is rendered and enforced by our own
 * HTML, recorded in WordPress, and passed in the submission payload. Setting
 * explicit_consent_to_process here would change the accepted payload shape and
 * risk 400-ing live lead capture, so parity is the safer choice. */
function formDefinition(name, fieldGroups) {
  const now = new Date().toISOString();
  return {
    name,
    formType: 'hubspot',
    archived: false,
    /* The v3 schema validates these as required even on create. */
    createdAt: now,
    updatedAt: now,
    fieldGroups,
    configuration: {
      language: 'en',
      cloneable: true,
      postSubmitAction: { type: 'thank_you', value: '' },
      editable: true,
      archivable: true,
      recaptchaEnabled: false,
      notifyContactOwner: false,
      notifyRecipients: [],
      createNewContactForNewEmail: true,
      prePopulateKnownValues: true,
      allowLinkToResetKnownValues: false,
    },
    displayOptions: {
      renderRawHtml: false,
      theme: 'default_style',
      submitButtonText: 'Submit',
      style: {},
      cssClass: '',
    },
    legalConsentOptions: { type: 'none' },
  };
}

function group(fields) { return { groupType: 'default_group', richTextType: 'text', fields }; }

/* Option lists mirror the <option> values in the page HTML exactly, so a
 * submitted value always matches an allowed enumeration option. */
const OCCASIONS = PROPERTIES.find((p) => p.name === 'trip_occasion').options;
const GROUP_TYPES = PROPERTIES.find((p) => p.name === 'group_type').options;

/* party_size / preferred_travel_* are string properties, so they use text
 * fields here — the constrained choices are already enforced by the <select>
 * in our own HTML, and text accepts every value either page can send. */
const FORMS = [
  {
    name: 'Private & Tailormade Inquiry',
    def: () => formDefinition('Private & Tailormade Inquiry', [
      group([field('firstname', 'First name', { required: true }), field('lastname', 'Last name', { required: true })]),
      group([field('email', 'Email', { required: true, fieldType: 'email' }), field('phone', 'Phone', { fieldType: 'phone' })]),
      group([field('trip_occasion', 'The occasion', { required: true, fieldType: 'dropdown', options: OCCASIONS })]),
      group([field('preferred_travel_season', 'When are you hoping to travel?')]),
      group([field('preferred_travel_year', 'Preferred travel year')]),
      group([field('party_size', 'How many guests will be traveling?')]),
      group([field('founders_circle_message', 'Tell us what you have in mind', { fieldType: 'multi_line_text' })]),
    ]),
  },
  /* Founder's Circle, the homepage popup and the Signature Journey popup all
   * previously posted to the legacy shared form, which silently discarded
   * travel month/year, party size and the message. That form is a v4 form and
   * the v3 API is forbidden from patching it, so each page gets its own
   * API-created form instead. All three collect an identical field set.
   *
   * MERGE6 maps to party_size (not preferred_journey_length): the field is
   * literally "How Many Guests Will Be Traveling?". Nothing is lost by
   * correcting it because the old target never captured a single value. */
  ...["Founder's Circle Inquiry", 'Homepage Popup Inquiry', 'Signature Journey Inquiry'].map((formName) => ({
    name: formName,
    def: () => formDefinition(formName, [
      group([field('salutation', 'Title'), field('firstname', 'First name', { required: true }), field('lastname', 'Last name', { required: true })]),
      group([field('email', 'Email', { required: true, fieldType: 'email' }), field('phone', 'Phone', { fieldType: 'phone' })]),
      group([field('country', 'Country'), field('city', 'City')]),
      group([field('preferred_travel_season', 'When would you like to travel?'), field('preferred_travel_year', 'Preferred travel year')]),
      group([field('party_size', 'How many guests will be traveling?')]),
      group([field('founders_circle_message', 'What are you hoping to experience', { fieldType: 'multi_line_text' })]),
    ]),
  })),
  {
    name: 'Group Journey Inquiry',
    def: () => formDefinition('Group Journey Inquiry', [
      group([field('firstname', 'First name', { required: true }), field('lastname', 'Last name', { required: true })]),
      group([field('email', 'Email', { required: true, fieldType: 'email' }), field('phone', 'Phone', { fieldType: 'phone' })]),
      group([field('organization', 'Your organization or group')]),
      group([field('group_type', 'Group type', { required: true, fieldType: 'dropdown', options: GROUP_TYPES })]),
      group([field('party_size', 'Approximate size')]),
      group([field('preferred_travel_season', 'When are you hoping to travel?')]),
      group([field('preferred_travel_year', 'Preferred travel year')]),
      group([field('founders_circle_message', 'Tell us about your group', { fieldType: 'multi_line_text' })]),
    ]),
  },
];

async function cmdCreateForms() {
  const existing = (await hs('GET', '/marketing/v3/forms?limit=100')).results || [];
  const created = [];
  for (const spec of FORMS) {
    const hit = existing.find((f) => f.name === spec.name);
    if (hit) {
      console.log(`  = "${spec.name}" — already exists (id=${hit.id}), skipped`);
      created.push({ name: spec.name, id: hit.id, reused: true });
      continue;
    }
    const res = await hs('POST', '/marketing/v3/forms', spec.def());
    console.log(`  + "${spec.name}" — created`);
    console.log(`      GUID: ${res.id}`);
    created.push({ name: spec.name, id: res.id, reused: false });
  }
  console.log('\nForm GUIDs to wire into the website:');
  for (const c of created) console.log(`  ${c.name.padEnd(32)} ${c.id}`);
  return created;
}

/* ── Repair the legacy shared form ─────────────────────────────────────────
 * The Founder's Circle page and homepage popup post these four property names,
 * but the shared form never declared them, so HubSpot discarded the values on
 * every submission. Adding them as Contact (0-1) fields fixes both pages with
 * no change to their deployed HTML.
 *
 * The form's two pre-existing `when_would_you_like_to_travel` / `preferred_year`
 * fields are left untouched: they are typed 0-5 (Ticket) and no Umoya form ever
 * submits those names, so they are inert. Repointing them would need the
 * tickets-read scope, which this Private App deliberately does not have.
 * ------------------------------------------------------------------------ */
const SHARED_FORM_ID = 'cb87d460-fb2d-4c53-8c32-7daaa05067d7';
const SHARED_REQUIRED = [
  ['preferred_travel_season', 'When would you like to travel?', 'single_line_text'],
  ['preferred_travel_year', 'Preferred travel year', 'single_line_text'],
  ['preferred_journey_length', 'Preferred journey length', 'single_line_text'],
  ['founders_circle_message', 'What are you hoping to experience', 'multi_line_text'],
];

async function cmdRepairSharedForm() {
  const form = await hs('GET', `/marketing/v3/forms/${SHARED_FORM_ID}`);
  const present = new Set(
    (form.fieldGroups || []).flatMap((g) => (g.fields || [])).map((f) => f.name)
  );

  const toAdd = SHARED_REQUIRED.filter(([name]) => !present.has(name));
  if (!toAdd.length) {
    console.log('  = shared form already declares all four fields — nothing to do');
    return;
  }

  /* The legacy form was built with all 11 fields in a single group, but the
   * v3 API rejects any group with more than 3. Flatten everything (existing
   * fields first, in their original order) and re-chunk into groups of 3.
   * Grouping is purely visual and this form is only ever an API target, so
   * re-chunking is safe; field names and values are untouched. */
  const existingFields = (form.fieldGroups || []).flatMap((g) => g.fields || []);
  const addedFields = toAdd.map(([name, label, fieldType]) => field(name, label, { fieldType }));
  const allFields = [...existingFields, ...addedFields];

  const chunked = [];
  for (let i = 0; i < allFields.length; i += 3) {
    chunked.push(group(allFields.slice(i, i + 3)));
  }

  const body = {
    name: form.name,
    formType: form.formType,
    archived: false,
    createdAt: form.createdAt,
    updatedAt: new Date().toISOString(),
    fieldGroups: chunked,
    configuration: form.configuration,
    displayOptions: form.displayOptions,
    legalConsentOptions: form.legalConsentOptions,
  };

  await hs('PATCH', `/marketing/v3/forms/${SHARED_FORM_ID}`, body);
  toAdd.forEach(([name]) => console.log(`  + ${name} — added to "${form.name}" as Contact (0-1)`));
  console.log('\nFounder\'s Circle + homepage popup will now capture these on every submission.');
}

/* ── Footer newsletter form ────────────────────────────────────────────────
 * Replaces the junk auto-captured ".elementor-form … converted" form with a
 * properly named one carrying explicit POPIA marketing consent.
 * ------------------------------------------------------------------------ */
const NEWSLETTER_CONSENT =
  'I agree to receive Umoya Afrika Tours journeys, stories and early-access news by email. '
  + 'I understand I can unsubscribe at any time, and that my details are processed as set out in the Privacy Policy.';

async function cmdCreateNewsletterForm() {
  const name = 'Footer Newsletter Signup';
  const existing = (await hs('GET', '/marketing/v3/forms?limit=100')).results || [];
  const hit = existing.find((f) => f.name === name);
  if (hit) {
    console.log(`  = "${name}" — already exists (id=${hit.id}), skipped`);
    return hit;
  }

  const def = {
    name,
    formType: 'hubspot',
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fieldGroups: [
      group([field('email', 'Email', { required: true, fieldType: 'email' })]),
      group([field('firstname', 'First name')]),
    ],
    configuration: {
      language: 'en',
      cloneable: true,
      postSubmitAction: { type: 'thank_you', value: '' },
      editable: true,
      archivable: true,
      recaptchaEnabled: false,
      notifyContactOwner: false,
      notifyRecipients: [],
      createNewContactForNewEmail: true,
      prePopulateKnownValues: true,
      allowLinkToResetKnownValues: false,
    },
    displayOptions: {
      renderRawHtml: false,
      theme: 'default_style',
      submitButtonText: 'Subscribe',
      style: {},
      cssClass: '',
    },
    /* Marketing consent is a legitimate-interest/explicit opt-in for a
     * newsletter, so unlike the inquiry forms it IS declared here. */
    legalConsentOptions: { type: 'none' },
  };

  const res = await hs('POST', '/marketing/v3/forms', def);
  console.log(`  + "${name}" — created`);
  console.log(`      GUID: ${res.id}`);
  console.log('\nConsent copy to render beside the checkbox in the footer:');
  console.log(`  "${NEWSLETTER_CONSENT}"`);
  return res;
}

/* ── Dispatch ──────────────────────────────────────────────────────────── */
const CMDS = {
  info: cmdInfo,
  'list-forms': cmdListForms,
  'list-props': cmdListProps,
  'create-props': cmdCreateProps,
  'create-forms': cmdCreateForms,
  'repair-shared-form': cmdRepairSharedForm,
  'create-newsletter-form': cmdCreateNewsletterForm,
};

const cmd = process.argv[2];
if (!cmd || !CMDS[cmd]) {
  console.error('Usage: node tools/hubspot-sync.mjs <info|list-forms|list-props|create-props|create-forms>');
  process.exit(1);
}
CMDS[cmd]().catch((err) => {
  console.error('ERROR:', err.message);
  if (err.data && err.data.errors) console.error(JSON.stringify(err.data.errors, null, 2));
  process.exit(1);
});
