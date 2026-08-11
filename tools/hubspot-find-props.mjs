#!/usr/bin/env node
/**
 * Umoya — search the full contact-property schema for given names/keywords.
 * Usage: node tools/hubspot-find-props.mjs travel year journey message occasion
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const line = fs.readFileSync(path.join(ROOT, '.secrets', 'hubspot.env'), 'utf8')
  .split(/\r?\n/).find((l) => l.trim().startsWith('HUBSPOT_TOKEN='));
const TOKEN = line.slice(line.indexOf('=') + 1).trim();

const terms = process.argv.slice(2).map((t) => t.toLowerCase());
const res = await fetch('https://api.hubapi.com/crm/v3/properties/contacts', {
  headers: { Authorization: `Bearer ${TOKEN}` },
});
const data = await res.json();
const all = data.results || [];
console.log(`Total contact properties: ${all.length}\n`);

const exact = [
  'when_would_you_like_to_travel', 'preferred_year', 'how_would_you_like_to_travel', 'message',
  'preferred_travel_season', 'preferred_travel_year', 'preferred_journey_length',
  'founders_circle_message', 'salutation', 'title',
];
console.log('EXACT-NAME CHECK (names used by the form definition and/or the website):');
for (const n of exact) {
  const p = all.find((x) => x.name === n);
  console.log(`  ${p ? 'EXISTS ' : 'MISSING'}  ${n.padEnd(32)} ${p ? `${p.type}/${p.fieldType} ${p.hubspotDefined ? '(built-in)' : '(custom)'}` : ''}`);
}

if (terms.length) {
  console.log('\nKEYWORD MATCHES:');
  for (const t of terms) {
    const hits = all.filter((p) => p.name.toLowerCase().includes(t) || (p.label || '').toLowerCase().includes(t));
    console.log(`\n  "${t}" → ${hits.length} match(es)`);
    hits.slice(0, 25).forEach((p) => console.log(`     ${p.name.padEnd(34)} ${String(p.type).padEnd(12)} ${p.hubspotDefined ? 'built-in' : 'CUSTOM'}  "${p.label}"`));
  }
}
