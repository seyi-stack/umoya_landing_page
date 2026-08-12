#!/usr/bin/env node
/**
 * Umoya — DIAGNOSTIC: why submissions appear under "Non-HubSpot Forms".
 *
 * Lists every form of every type (including the ones the HubSpot tracking
 * script auto-captures), and reports how many submissions each of our real
 * forms has actually received.
 *
 * Usage: node tools/hubspot-diagnose-capture.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const line = fs.readFileSync(path.join(ROOT, '.secrets', 'hubspot.env'), 'utf8')
  .split(/\r?\n/).find((l) => l.trim().startsWith('HUBSPOT_TOKEN='));
const TOKEN = line.slice(line.indexOf('=') + 1).trim();

async function hs(url) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  const text = await res.text();
  let d = null; try { d = JSON.parse(text); } catch { d = text; }
  return { ok: res.ok, status: res.status, data: d };
}

const OURS = {
  '28e4e3e3-9a47-47a5-b3de-851981535664': 'Private & Tailormade Inquiry',
  'c201e387-ca7b-4d73-9417-f060566bcf6a': 'Group Journey Inquiry',
  'b3c06e8a-9bbc-44e1-bc67-00e35528b9b9': "Founder's Circle Inquiry",
  'a9e947b4-cb2e-45da-b2c7-b83b4228dfb5': 'Homepage Popup Inquiry',
  '71181d17-e836-43d6-aa6d-a46e73945504': 'Signature Journey Inquiry',
  '40d535ad-fc91-4831-8231-eddc05208624': 'Footer Newsletter Signup',
  'cb87d460-fb2d-4c53-8c32-7daaa05067d7': 'Umoya Website Form Submissions (RETIRED)',
};

console.log('══════ ALL FORMS BY TYPE ══════');
for (const t of ['hubspot', 'captured', 'flow', 'blog_comment']) {
  const r = await hs(`https://api.hubapi.com/marketing/v3/forms?limit=100&formTypes=${t}`);
  if (!r.ok) { console.log(`\n[${t}] error ${r.status}: ${r.data && r.data.message}`); continue; }
  const forms = r.data.results || [];
  console.log(`\n[${t}] ${forms.length} form(s)`);
  forms.forEach((f) => {
    const mine = OURS[f.id] ? '  ← OURS' : '';
    console.log(`   • ${f.name}`);
    console.log(`     ${f.id}  created ${(f.createdAt || '').slice(0, 10)}${mine}`);
  });
}

console.log('\n\n══════ SUBMISSION COUNTS (last 50 per form) ══════');
for (const [id, name] of Object.entries(OURS)) {
  const r = await hs(`https://api.hubapi.com/form-integrations/v1/submissions/forms/${id}?limit=50`);
  if (!r.ok) {
    console.log(`  ${name.padEnd(44)} error ${r.status}: ${(r.data && r.data.message) || ''}`);
    continue;
  }
  const subs = r.data.results || [];
  let latest = '—';
  if (subs.length) {
    const t = Math.max(...subs.map((s) => s.submittedAt || 0));
    latest = new Date(t).toISOString().replace('T', ' ').slice(0, 16);
  }
  console.log(`  ${name.padEnd(44)} ${String(subs.length).padStart(3)} submission(s)   latest: ${latest}`);
}
