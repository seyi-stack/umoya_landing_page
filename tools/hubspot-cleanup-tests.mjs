#!/usr/bin/env node
/**
 * Umoya — delete ONLY the diagnostic contacts created during form verification.
 *
 * Hard-coded to three RFC-2606 example.com addresses; it will refuse to touch
 * anything else, so it cannot remove a real lead.
 *
 * Usage: node tools/hubspot-cleanup-tests.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const line = fs.readFileSync(path.join(ROOT, '.secrets', 'hubspot.env'), 'utf8')
  .split(/\r?\n/).find((l) => l.trim().startsWith('HUBSPOT_TOKEN='));
const TOKEN = line.slice(line.indexOf('=') + 1).trim();

const ALLOWED = [
  'umoya-integration-test@example.com',
  'umoya-verify-pt@example.com',
  'umoya-verify-fg@example.com',
  'umoya-verify-fc@example.com',
  'umoya-verify-hp@example.com',
  'umoya-verify-sj@example.com',
  'umoya-verify-nl@example.com',
];

for (const email of ALLOWED) {
  if (!email.endsWith('@example.com')) { console.log('REFUSED (not a test address):', email); continue; }

  const s = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }],
      properties: ['email'],
      limit: 1,
    }),
  });
  const d = await s.json();
  if (!d.results || !d.results.length) { console.log('  – not found (already gone):', email); continue; }

  const id = d.results[0].id;
  if (d.results[0].properties.email !== email) { console.log('  ! safety check failed, skipping', id); continue; }

  const del = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  console.log(del.ok ? `  ✓ deleted ${email} (id ${id})` : `  ✗ failed ${email}: HTTP ${del.status}`);
}
