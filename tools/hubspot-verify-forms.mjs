#!/usr/bin/env node
/**
 * Umoya — end-to-end verification of the two new dedicated forms.
 *
 * Submits the exact payload the updated website will send, then reads the
 * resulting contact back to prove every field actually persisted (HubSpot
 * silently drops fields that are not BOTH a real contact property AND defined
 * on the form, so a 200 response alone proves nothing).
 *
 * Test addresses use the RFC-2606 reserved domain example.com.
 * Usage: node tools/hubspot-verify-forms.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const line = fs.readFileSync(path.join(ROOT, '.secrets', 'hubspot.env'), 'utf8')
  .split(/\r?\n/).find((l) => l.trim().startsWith('HUBSPOT_TOKEN='));
const TOKEN = line.slice(line.indexOf('=') + 1).trim();
const PORTAL = '246097317';

/* Shared field set for the three inquiry popups (FC / homepage / SJ) */
function popupFields(tag, email) {
  return {
    salutation: 'Ms.',
    firstname: tag,
    lastname: 'PleaseDelete',
    email,
    phone: '+27000000009',
    country: 'Nigeria',
    city: 'Lagos',
    preferred_travel_season: 'June',
    preferred_travel_year: '2027',
    party_size: 'Small Group (3 to 9)',
    founders_circle_message: `${tag} verification payload`,
  };
}

const CASES = [
  {
    label: 'Private & Tailormade Inquiry',
    formId: '28e4e3e3-9a47-47a5-b3de-851981535664',
    email: 'umoya-verify-pt@example.com',
    fields: {
      firstname: 'VerifyPT',
      lastname: 'PleaseDelete',
      email: 'umoya-verify-pt@example.com',
      phone: '+27000000001',
      trip_occasion: 'Honeymoon',
      preferred_travel_season: 'June',
      preferred_travel_year: '2027',
      party_size: '4',
      founders_circle_message: 'PT verification payload',
    },
  },
  {
    label: 'Group Journey Inquiry',
    formId: 'c201e387-ca7b-4d73-9417-f060566bcf6a',
    email: 'umoya-verify-fg@example.com',
    fields: {
      firstname: 'VerifyFG',
      lastname: 'PleaseDelete',
      email: 'umoya-verify-fg@example.com',
      phone: '+27000000002',
      organization: 'Delta Sigma Theta — Test Chapter',
      group_type: 'Sorority or fraternity',
      party_size: '11 to 15',
      preferred_travel_season: 'September',
      preferred_travel_year: '2028',
      founders_circle_message: 'FG verification payload',
    },
  },
  {
    label: "Founder's Circle Inquiry",
    formId: 'b3c06e8a-9bbc-44e1-bc67-00e35528b9b9',
    email: 'umoya-verify-fc@example.com',
    fields: popupFields('VerifyFC', 'umoya-verify-fc@example.com'),
  },
  {
    label: 'Homepage Popup Inquiry',
    formId: 'a9e947b4-cb2e-45da-b2c7-b83b4228dfb5',
    email: 'umoya-verify-hp@example.com',
    fields: popupFields('VerifyHP', 'umoya-verify-hp@example.com'),
  },
  {
    label: 'Signature Journey Inquiry',
    formId: '71181d17-e836-43d6-aa6d-a46e73945504',
    email: 'umoya-verify-sj@example.com',
    fields: popupFields('VerifySJ', 'umoya-verify-sj@example.com'),
  },
  {
    label: 'Footer Newsletter Signup',
    formId: '40d535ad-fc91-4831-8231-eddc05208624',
    email: 'umoya-verify-nl@example.com',
    fields: {
      email: 'umoya-verify-nl@example.com',
      firstname: 'VerifyNL',
    },
  },
];

let allGood = true;

for (const c of CASES) {
  console.log(`\n══════ ${c.label} ══════`);
  const submitRes = await fetch(
    `https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL}/${c.formId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: Object.entries(c.fields).map(([name, value]) => ({ name, value })),
        context: { pageName: 'Umoya form verification' },
      }),
    }
  );
  console.log(`submit → HTTP ${submitRes.status}`);
  if (!submitRes.ok) { console.log(await submitRes.text()); allGood = false; continue; }

  await new Promise((r) => setTimeout(r, 4000)); // let HubSpot process

  const names = Object.keys(c.fields);
  const searchRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: c.email }] }],
      properties: names,
      limit: 1,
    }),
  });
  const data = await searchRes.json();
  if (!data.results || !data.results.length) { console.log('  ✗ contact not found'); allGood = false; continue; }

  const got = data.results[0].properties;
  console.log(`  contact id ${data.results[0].id}`);
  for (const n of names) {
    const expected = c.fields[n];
    const actual = got[n];
    const ok = String(actual || '') === String(expected);
    if (!ok) allGood = false;
    console.log(`   ${ok ? 'OK  ' : 'LOST'} ${n.padEnd(26)} expected="${expected}" got="${actual ?? ''}"`);
  }
}

console.log(`\n════════ ${allGood ? 'ALL FIELDS PERSISTED ✅' : 'SOME FIELDS LOST ❌'} ════════`);
process.exit(allGood ? 0 : 1);
