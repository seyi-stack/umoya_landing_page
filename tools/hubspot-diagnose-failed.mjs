#!/usr/bin/env node
/**
 * Umoya — DIAGNOSTIC: why WordPress reports "failed" for for_groups_page and
 * private_tailormade_page while the other three sources report "sent".
 *
 * Hypothesis: the live plugin is still the OLD class-submissions.php, so its
 * server-side alias table maps
 *     merge2 -> country, merge3 -> city, merge6 -> preferred_journey_length
 * and it forwards those property names to the NEW dedicated forms, which do
 * not declare them. This replays both payloads and prints HubSpot's real
 * response so the failure mode is observed, not guessed.
 *
 * RFC-2606 example.com addresses only.
 * Usage: node tools/hubspot-diagnose-failed.mjs
 */
const PORTAL = '246097317';

const CASES = [
  {
    label: 'For Groups → OLD plugin payload (country/city/preferred_journey_length)',
    formId: 'c201e387-ca7b-4d73-9417-f060566bcf6a',
    fields: {
      firstname: 'DiagFG', lastname: 'PleaseIgnore', email: 'umoya-diag-fg-old@example.com',
      phone: '+27000000011',
      country: 'Sorority or fraternity',        // old merge2 target — NOT on the new form
      city: 'Delta Chapter',                    // old merge3 target — NOT on the new form
      preferred_journey_length: '11 to 15',     // old merge6 target — NOT on the new form
      preferred_travel_season: 'September', preferred_travel_year: '2028',
      founders_circle_message: 'diagnostic',
    },
  },
  {
    label: 'For Groups → NEW plugin payload (group_type/organization/party_size)',
    formId: 'c201e387-ca7b-4d73-9417-f060566bcf6a',
    fields: {
      firstname: 'DiagFG', lastname: 'PleaseIgnore', email: 'umoya-diag-fg-new@example.com',
      phone: '+27000000012',
      group_type: 'Sorority or fraternity', organization: 'Delta Chapter', party_size: '11 to 15',
      preferred_travel_season: 'September', preferred_travel_year: '2028',
      founders_circle_message: 'diagnostic',
    },
  },
  {
    label: 'P&T → OLD plugin payload (country/preferred_journey_length)',
    formId: '28e4e3e3-9a47-47a5-b3de-851981535664',
    fields: {
      firstname: 'DiagPT', lastname: 'PleaseIgnore', email: 'umoya-diag-pt-old@example.com',
      phone: '+27000000013',
      country: 'Honeymoon',                     // old merge2 target — NOT on the new form
      preferred_journey_length: '4',            // old merge6 target — NOT on the new form
      preferred_travel_season: 'June', preferred_travel_year: '2027',
      founders_circle_message: 'diagnostic',
    },
  },
  {
    label: "Founder's Circle → OLD plugin payload (country/city ARE on that form)",
    formId: 'b3c06e8a-9bbc-44e1-bc67-00e35528b9b9',
    fields: {
      firstname: 'DiagFC', lastname: 'PleaseIgnore', email: 'umoya-diag-fc-old@example.com',
      phone: '+27000000014',
      country: 'Nigeria', city: 'Lagos',
      preferred_journey_length: 'Small Group (3 to 9)',  // NOT on the new form
      preferred_travel_season: 'June', preferred_travel_year: '2027',
      founders_circle_message: 'diagnostic',
    },
  },
];

for (const c of CASES) {
  const res = await fetch(
    `https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL}/${c.formId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: Object.entries(c.fields).map(([name, value]) => ({ name, value })),
        context: { pageName: 'Umoya failure diagnostic' },
      }),
    }
  );
  const text = await res.text();
  let d = null; try { d = JSON.parse(text); } catch { d = text; }

  console.log(`\n══ ${c.label}`);
  console.log(`   HTTP ${res.status}  ${res.ok ? 'ACCEPTED' : 'REJECTED'}`);
  if (!res.ok) {
    console.log(`   message: ${(d && d.message) || text}`);
    if (d && d.errors) d.errors.forEach((e) => console.log(`     • ${e.message || JSON.stringify(e)}`));
  }
}
