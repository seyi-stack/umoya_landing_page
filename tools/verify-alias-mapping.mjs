#!/usr/bin/env node
/**
 * Umoya — verifies the source-aware alias table in class-submissions.php.
 *
 * PHP is not installed locally, so this parses the two alias arrays straight
 * out of the PHP source and replays normalize_submission()'s resolution rules
 * in JS, asserting each form's MERGE* slots land on the intended HubSpot
 * property — and, critically, that they no longer ALSO land on the borrowed
 * country/city/preferred_journey_length slots.
 *
 * Usage: node tools/verify-alias-mapping.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const php = fs.readFileSync(path.join(ROOT, 'umoya-elementor-widgets/includes/class-submissions.php'), 'utf8');

/* Pull `'key' => array( 'a', 'b' ),` pairs out of a PHP array block */
function parsePairs(block) {
  const out = {};
  const re = /'([a-z0-9_]+)'\s*=>\s*array\(([^)]*)\)/g;
  let m;
  while ((m = re.exec(block))) {
    out[m[1]] = [...m[2].matchAll(/'([a-z0-9_]+)'/g)].map((x) => x[1]);
  }
  return out;
}

function block(startMarker) {
  const i = php.indexOf(startMarker);
  if (i === -1) throw new Error(`marker not found: ${startMarker}`);
  let depth = 0, j = php.indexOf('array(', i) + 'array('.length - 1;
  const start = j;
  do {
    if (php[j] === '(') depth++;
    else if (php[j] === ')') depth--;
    j++;
  } while (depth > 0 && j < php.length);
  return php.slice(start, j);
}

const defaults = parsePairs(block('$aliases = array('));
const overridesBlock = block('$source_aliases = array(');

/* Split the per-source sub-arrays */
function sourceOverrides(name) {
  const i = overridesBlock.indexOf(`'${name}'`);
  if (i === -1) return {};
  let depth = 0, j = overridesBlock.indexOf('array(', i) + 'array('.length - 1;
  const start = j;
  do {
    if (overridesBlock[j] === '(') depth++;
    else if (overridesBlock[j] === ')') depth--;
    j++;
  } while (depth > 0 && j < overridesBlock.length);
  return parsePairs(overridesBlock.slice(start, j));
}

/* Replay: first alias with a non-empty value wins (mirrors the PHP loop) */
function resolve(aliases, raw) {
  const out = {};
  for (const [target, keys] of Object.entries(aliases)) {
    out[target] = '';
    for (const k of keys) {
      if (raw[k]) { out[target] = raw[k]; break; }
    }
  }
  return out;
}

const CASES = [
  {
    source: 'private_tailormade_page',
    raw: { fname: 'A', lname: 'B', email: 'a@example.com', phone: '1234567',
           merge2: 'Honeymoon', merge4: 'June', merge5: '2027', merge6: '4', merge7: 'brief' },
    expect: { trip_occasion: 'Honeymoon', party_size: '4', preferred_travel_season: 'June',
              preferred_travel_year: '2027', founders_circle_message: 'brief',
              country: '', preferred_journey_length: '' },
  },
  {
    source: 'for_groups_page',
    raw: { fname: 'A', lname: 'B', email: 'b@example.com', phone: '1234567',
           merge2: 'Sorority or fraternity', merge3: 'Delta Chapter', merge4: 'September',
           merge5: '2028', merge6: '11 to 15', merge7: 'brief' },
    expect: { group_type: 'Sorority or fraternity', organization: 'Delta Chapter',
              party_size: '11 to 15', preferred_travel_season: 'September',
              preferred_travel_year: '2028', founders_circle_message: 'brief',
              country: '', city: '', preferred_journey_length: '' },
  },
  /* These three keep country/city but move MERGE6 onto party_size. */
  ...['founders_circle_page', 'homepage_popup', 'signature_journey_popup'].map((source) => ({
    source,
    raw: { fname: 'A', lname: 'B', email: 'c@example.com', merge1: 'Ms.',
           merge2: 'Nigeria', merge3: 'Lagos', merge4: 'June', merge5: '2027',
           merge6: 'Small Group (3 to 9)', merge7: 'hello' },
    expect: { salutation: 'Ms.', country: 'Nigeria', city: 'Lagos',
              preferred_travel_season: 'June', preferred_travel_year: '2027',
              party_size: 'Small Group (3 to 9)', founders_circle_message: 'hello',
              preferred_journey_length: '' },
  })),
  {
    /* Footer newsletter: only two fields, both handled by the defaults —
       it deliberately has no source override. */
    source: 'footer_newsletter',
    raw: { fname: 'Thandi', email: 'n@example.com' },
    expect: { firstname: 'Thandi', email: 'n@example.com',
              country: '', city: '', party_size: undefined },
  },
  {
    /* RESEND RECOVERY — mirrors get_submission_from_meta() re-normalising a
       stored _umoya_payload from one of the submissions WordPress logged as
       "failed". The browser had already been updated (so the payload carries
       group_type/organization/party_size) while the server plugin had not.
       Re-normalising must fill the dedicated properties AND leave the
       borrowed ones empty, or HubSpot rejects the resend with
       "Required field 'group_type' is missing". */
    source: 'for_groups_page',
    raw: {
      firstname: 'FG_Test', lastname: 'FG', email: 'fg@example.com', phone: '3614007',
      group_type: 'Sorority or fraternity', organization: 'Delta Chapter',
      party_size: '11 to 15',
      merge2: 'Sorority or fraternity', merge3: 'Delta Chapter', merge6: '11 to 15',
      preferred_travel_season: 'September', preferred_travel_year: '2028',
      founders_circle_message: 'recovered',
    },
    expect: {
      group_type: 'Sorority or fraternity', organization: 'Delta Chapter',
      party_size: '11 to 15', founders_circle_message: 'recovered',
      country: '', city: '', preferred_journey_length: '',
    },
  },
  {
    /* Regression guard: an unknown source must fall back to the defaults. */
    source: 'some_future_form',
    raw: { fname: 'A', email: 'd@example.com', merge2: 'Ghana', merge6: '10 days' },
    expect: { country: 'Ghana', preferred_journey_length: '10 days' },
  },
];

let pass = true;
for (const c of CASES) {
  const aliases = { ...defaults, ...sourceOverrides(c.source) };
  const got = resolve(aliases, c.raw);
  console.log(`\n══ source: ${c.source} ══`);
  for (const [k, want] of Object.entries(c.expect)) {
    const ok = want === undefined ? (got[k] === undefined) : ((got[k] ?? '') === want);
    if (!ok) pass = false;
    console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${k.padEnd(26)} want="${want}" got="${got[k] ?? ''}"`);
  }
}
console.log(`\n════ ${pass ? 'ALIAS MAPPING CORRECT ✅' : 'ALIAS MAPPING BROKEN ❌'} ════`);
process.exit(pass ? 0 : 1);
