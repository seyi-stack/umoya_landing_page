#!/usr/bin/env node
/**
 * Umoya — DIAGNOSTIC: inspect which properties actually landed on a contact.
 * Usage: node tools/hubspot-check-contact.mjs <email>
 * Requires the Private App to have crm.objects.contacts.read.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const line = fs.readFileSync(path.join(ROOT, '.secrets', 'hubspot.env'), 'utf8')
  .split(/\r?\n/).find((l) => l.trim().startsWith('HUBSPOT_TOKEN='));
const TOKEN = line.slice(line.indexOf('=') + 1).trim();

const email = process.argv[2] || 'umoya-integration-test@example.com';

const props = [
  'email', 'firstname', 'lastname', 'phone', 'country', 'city',
  'when_would_you_like_to_travel', 'preferred_year', 'how_would_you_like_to_travel', 'message',
  'preferred_travel_season', 'preferred_travel_year', 'preferred_journey_length', 'founders_circle_message',
];

const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
  method: 'POST',
  headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }],
    properties: props,
    limit: 1,
  }),
});
const data = await res.json();
if (!res.ok) { console.error(`ERROR ${res.status}:`, data.message); process.exit(1); }
if (!data.results || !data.results.length) { console.log('No contact found for', email); process.exit(0); }

const c = data.results[0];
console.log(`Contact ${c.id} — ${email}\n`);
console.log('Property'.padEnd(34), 'Value');
console.log('-'.repeat(60));
for (const p of props) {
  const v = c.properties[p];
  console.log(p.padEnd(34), v === null || v === undefined || v === '' ? '(empty)' : v);
}
console.log('\nContact id for cleanup:', c.id);
