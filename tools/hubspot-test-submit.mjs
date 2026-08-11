#!/usr/bin/env node
/**
 * Umoya — DIAGNOSTIC (HISTORICAL): replay exactly what the live website used
 * to send to the legacy shared HubSpot form.
 *
 * NOTE: the form targeted here (cb87d460-…) has been RETIRED — every page now
 * posts to its own dedicated form. This script is kept because it is the
 * reproduction that proved the silent data-loss bug: it returns HTTP 200 while
 * the travel/message values are discarded. See CLAUDE.md Section 21.
 * For live checks use tools/hubspot-verify-forms.mjs instead.
 *
 * Uses the RFC-2606 reserved domain example.com so no real mailbox can be hit.
 * If the field names are wrong, HubSpot rejects the whole submission with 400
 * and NO contact is created.
 *
 * Usage: node tools/hubspot-test-submit.mjs
 */
const PORTAL = '246097317';
const FORM = 'cb87d460-fb2d-4c53-8c32-7daaa05067d7';
const TEST_EMAIL = 'umoya-integration-test@example.com';

/* Exactly the property names the live site's hubspotFieldMap emits */
const liveSitePayload = {
  fields: [
    { name: 'firstname', value: 'IntegrationTest' },
    { name: 'lastname', value: 'PleaseIgnore' },
    { name: 'email', value: TEST_EMAIL },
    { name: 'phone', value: '+27000000000' },
    { name: 'country', value: 'Honeymoon' },                        // P&T sends occasion here
    { name: 'city', value: 'Test Org' },                            // FG sends organization here
    { name: 'preferred_travel_season', value: 'June' },             // <-- form calls it when_would_you_like_to_travel
    { name: 'preferred_travel_year', value: '2027' },               // <-- form calls it preferred_year
    { name: 'preferred_journey_length', value: '4' },               // <-- form calls it how_would_you_like_to_travel
    { name: 'founders_circle_message', value: 'diagnostic only' },  // <-- form calls it message
  ],
  context: { pageName: 'Umoya integration diagnostic' },
};

/* The same data using the form's ACTUAL field names */
const correctedPayload = {
  fields: [
    { name: 'firstname', value: 'IntegrationTest' },
    { name: 'lastname', value: 'PleaseIgnore' },
    { name: 'email', value: TEST_EMAIL },
    { name: 'phone', value: '+27000000000' },
    { name: 'country', value: 'Honeymoon' },
    { name: 'city', value: 'Test Org' },
    { name: 'when_would_you_like_to_travel', value: 'June' },
    { name: 'preferred_year', value: '2027' },
    { name: 'how_would_you_like_to_travel', value: 'Private & Tailormade' },
    { name: 'message', value: 'diagnostic only' },
  ],
  context: { pageName: 'Umoya integration diagnostic' },
};

async function attempt(label, payload) {
  const res = await fetch(
    `https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL}/${FORM}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
  );
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = text; }
  console.log(`\n=== ${label} ===`);
  console.log(`HTTP ${res.status}`);
  if (res.ok) {
    console.log('ACCEPTED — a contact WAS created/updated.');
    console.log('inlineMessage:', (data && data.inlineMessage) || '(none)');
  } else {
    console.log('REJECTED — no contact created.');
    console.log('message:', (data && data.message) || text);
    if (data && data.errors) {
      data.errors.forEach((e) => console.log('   •', e.message || JSON.stringify(e)));
    }
  }
  return res.ok;
}

console.log('Diagnostic against the SHARED form all four site forms use.');
console.log('Test address:', TEST_EMAIL, '(RFC-2606 reserved — cannot reach a real inbox)');

const liveOk = await attempt('A) Field names the LIVE WEBSITE currently sends', liveSitePayload);
const fixedOk = await attempt("B) Field names matching the FORM's real definition", correctedPayload);

console.log('\n──────── VERDICT ────────');
console.log('Live site payload  :', liveOk ? 'accepted' : 'REJECTED (leads are being lost)');
console.log('Corrected payload  :', fixedOk ? 'accepted' : 'rejected');
