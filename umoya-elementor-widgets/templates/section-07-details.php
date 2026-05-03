<?php if ( ! defined( 'ABSPATH' ) ) { exit; } ?>

<!--
=================================================================
  UMOYA FOUNDER'S CIRCLE — SECTION 07: JOURNEY DETAILS
=================================================================
  ELEMENTOR USAGE:
  • Add an "HTML" widget as the final section before the footer.
  • Background: cream-dark (#F5F0EB) — one shade deeper than
    the cream-light sections above to signal a natural close.
  • The accordion is collapsible: clicking any item expands it
    and collapses any previously open item (one open at a time).
  • Item 1 is open by default via the fc-det-open class.
  • Elementor note: the [Feature: Section will be collapsible]
    note from the brief is fulfilled by this accordion.
  • 6 items: Small-Group · Departures · Personalisation ·
    Travel Protection · Journey Lengths · Cuisine & Dietary Care
=================================================================
-->

  <section id="fc-details" aria-label="Journey Details — Frequently Asked Questions">
    <div class="fc-det-wrap">

      <!-- Section header -->
      <div class="fc-det-hd fc-det-rev">
        <span class="fc-det-eyebrow">Everything You Need to Know</span>
        <h2 class="fc-det-title">Travel <em>Essentials</em></h2>
        <span class="fc-det-rule" aria-hidden="true"></span>
        <p class="fc-det-lead">Travel with clarity and confidence, knowing every detail has been carefully considered. From customization to comfort, each element combines cultural depth, local access, and seamless execution.</p>
      </div>

      <!-- Accordion list -->
      <div class="fc-acc fc-det-rev fc-d1" role="list">

        <!-- ── Item 1: Guaranteed Departures (open by default) ── -->
        <div class="fc-acc-item fc-det-open" role="listitem">
          <button
            class="fc-acc-btn"
            aria-expanded="true"
            aria-controls="fc-det-body-2"
            id="fc-det-btn-2"
          >
            <div class="fc-acc-left">
              <div class="fc-acc-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div>
                <p class="fc-acc-title">Plan with Absolute Confidence</p>
                <p class="fc-acc-sub">Guaranteed Departures</p>
              </div>
            </div>
            <div class="fc-acc-chev" aria-hidden="true">
              <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </button>
          <div class="fc-acc-body" id="fc-det-body-2" role="region" aria-labelledby="fc-det-btn-2">
            <div class="fc-acc-content">
              All journeys are guaranteed to depart, allowing travelers to plan with full confidence. Once you have secured your spot, you can book your flights and make arrangements knowing your journey will proceed as planned.
            </div>
          </div>
        </div>

        <!-- ── Item 3: Personalization ────────────────── -->
        <div class="fc-acc-item" role="listitem">
          <button
            class="fc-acc-btn"
            aria-expanded="false"
            aria-controls="fc-det-body-3"
            id="fc-det-btn-3"
          >
            <div class="fc-acc-left">
              <div class="fc-acc-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </div>
              <div>
                <p class="fc-acc-title">Personalize Your Journey, Your Way</p>
                <p class="fc-acc-sub">Thoughtful personalization</p>
              </div>
            </div>
            <div class="fc-acc-chev" aria-hidden="true">
              <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </button>
          <div class="fc-acc-body" id="fc-det-body-3" role="region" aria-labelledby="fc-det-btn-3">
            <div class="fc-acc-content">
              While each itinerary is carefully designed, we understand every traveler's interests are unique. Optional add-on experiences allow guests to explore extended time at particular sites, private wine tastings, or exclusive access to local artists and designers.
            </div>
          </div>
        </div>

        <!-- ── Item 4: Travel Protection ─────────────── -->
        <div class="fc-acc-item" role="listitem">
          <button
            class="fc-acc-btn"
            aria-expanded="false"
            aria-controls="fc-det-body-4"
            id="fc-det-btn-4"
          >
            <div class="fc-acc-left">
              <div class="fc-acc-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <p class="fc-acc-title">Peace of Mind for Your Investment</p>
                <p class="fc-acc-sub">Travel Protection</p>
              </div>
            </div>
            <div class="fc-acc-chev" aria-hidden="true">
              <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </button>
          <div class="fc-acc-body" id="fc-det-body-4" role="region" aria-labelledby="fc-det-btn-4">
            <div class="fc-acc-content">
              We <strong>strongly recommend purchasing travel insurance</strong> at the time of booking to ensure coverage for unexpected changes. Our team is happy to provide guidance and recommendations for reputable providers so you can focus entirely on your journey, not logistics.
            </div>
          </div>
        </div>

        <!-- ── Item 5: Flexible Journey Lengths ───────── -->
        <div class="fc-acc-item" role="listitem">
          <button
            class="fc-acc-btn"
            aria-expanded="false"
            aria-controls="fc-det-body-5"
            id="fc-det-btn-5"
          >
            <div class="fc-acc-left">
              <div class="fc-acc-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div>
                <p class="fc-acc-title">Journeys that reflect Your Schedule</p>
                <p class="fc-acc-sub">Signature Journey Structure</p>
              </div>
            </div>
            <div class="fc-acc-chev" aria-hidden="true">
              <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </button>
          <div class="fc-acc-body" id="fc-det-body-5" role="region" aria-labelledby="fc-det-btn-5">
            <div class="fc-acc-content">
              Our signature journey spans 15 days across four provinces. This duration allows for the proper pacing and cultural depth that defines the Umoya experience. Speak with your dedicated travel expert about customizing the itinerary to your specific interests within this timeframe.
            </div>
          </div>
        </div>

        <!-- ── Item 6: Cuisine & Dietary Care ─────────── -->
        <div class="fc-acc-item" role="listitem">
          <button
            class="fc-acc-btn"
            aria-expanded="false"
            aria-controls="fc-det-body-6"
            id="fc-det-btn-6"
          >
            <div class="fc-acc-left">
              <div class="fc-acc-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                  <line x1="6"  y1="1" x2="6"  y2="4"/>
                  <line x1="10" y1="1" x2="10" y2="4"/>
                  <line x1="14" y1="1" x2="14" y2="4"/>
                </svg>
              </div>
              <div>
                <p class="fc-acc-title">Authentic flavors that meet your specific needs</p>
                <p class="fc-acc-sub">Regional Cuisine &amp; Dietary Care</p>
              </div>
            </div>
            <div class="fc-acc-chev" aria-hidden="true">
              <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </button>
          <div class="fc-acc-body" id="fc-det-body-6" role="region" aria-labelledby="fc-det-btn-6">
            <div class="fc-acc-content">
              Guests experience regional cuisine prepared by local chefs throughout the journey. Dietary restrictions are collected in advance so we can coordinate thoughtfully with our culinary partners. We approach all dietary needs with care and transparency, because respecting your wellbeing is part of the journey.
            </div>
          </div>
        </div>

      </div><!-- /.fc-acc -->

      <!-- Footer CTA -->
      <div class="fc-det-foot fc-det-rev">
        <h3>Still have questions? We'd love to speak with you</h3>
        <p>Your dedicated Umoya travel expert is ready to help you plan the perfect South African experience.</p>
        <a href="#fc-form-section" class="fc-det-foot-btn">Speak with a Travel Expert</a>
      </div>

    </div>
  </section>
