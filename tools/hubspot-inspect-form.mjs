#!/usr/bin/env node
/**
 * Umoya — inspect a HubSpot form's field definition.
 * Usage: node tools/hubspot-inspect-form.mjs <formId> [<formId> ...]
 * Auth: HUBSPOT_TOKEN from .secrets/hubspot.env (git-ignored).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const line = fs.readFileSync(path.join(ROOT, '.secrets', 'hubspot.env'), 'utf8')
  .split(/\r?\n/).find((l) => l.trim().startsWith('HUBSPOT_TOKEN='));
const TOKEN = line.slice(line.indexOf('=') + 1).trim();

const ids = process.argv.slice(2);
if (!ids.length) { console.error('Pass at least one form id.'); process.exit(1); }

for (const id of ids) {
  const res = await fetch(`https://api.hubapi.com/marketing/v3/forms/${id}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const d = await res.json();
  if (!res.ok) { console.log(`\n=== ${id} === ERROR ${res.status}: ${d.message}`); continue; }
  console.log(`\n=== ${d.name} ===`);
  console.log(`   id: ${d.id}  type: ${d.formType}`);
  const fields = [];
  (d.fieldGroups || []).forEach((g) => (g.fields || []).forEach((f) => fields.push(f)));
  console.log(`   fields (${fields.length}):`);
  fields.forEach((f) => console.log(`     - ${f.name.padEnd(30)} ${String(f.fieldType).padEnd(18)}${f.required ? ' *required' : ''}`));
  const lco = d.legalConsentOptions || {};
  console.log(`   legalConsent: ${lco.type || 'none'}`);
}
