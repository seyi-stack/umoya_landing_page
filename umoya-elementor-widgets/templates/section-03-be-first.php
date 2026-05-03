<?php if ( ! defined( 'ABSPATH' ) ) { exit; } ?>

<!--
=================================================================
  UMOYA FOUNDER'S CIRCLE — SECTION 03: BE AMONG THE FIRST
=================================================================
  ELEMENTOR USAGE:
  • Add an "HTML" widget after the Form section.
  • id="fc-be-first" is the anchor target from the Hero's
    "Learn More" ghost button.
  • The right column is a 4-slide auto-advancing carousel.
    Arrows and dot-nav are fully accessible (ARIA roles set).
  • IMAGES: Replace each <img> src with your Founder's Circle
    Drive images. Order: Image 1 → 2 → 3 → 4 from the brief.
=================================================================
-->

<section id="fc-be-first" aria-label="Experience South Africa Differently">
  <div class="fc-bf-wrap">
    <div class="fc-bf-grid">

      <!-- ── COPY ──────────────────────────────── -->
      <div class="fc-bf-reveal">
        <span class="fc-bf-eyebrow">Exclusive Early Access</span>
        <h2 class="fc-bf-title">
          Experience South Africa <em>Differently</em>
        </h2>
        <span class="fc-bf-rule" aria-hidden="true"></span>

        <div class="fc-bf-body">
          <p>This is more than early registration. It's an invitation to be part of the founding chapter of Umoya Afrika Tours, a premium travel company delivering exceptional South African experiences.</p>
          <p>Founder's Circle membership is intentionally limited to a small group of founding guests who will be the first to experience our signature journey.</p>
        </div>

        <div class="fc-bf-pull">
          Join now to secure your place on our inaugural journey before we open to the public. Once this founding cohort is complete, these exclusive benefits close permanently.
        </div>

        <a href="#fc-form-section" class="fc-bf-btn">Join Now</a>
      </div>

      <!-- ── SLIDESHOW ──────────────────────────── -->
      <div
        class="fc-ss-outer fc-bf-reveal fc-d2"
        role="region"
        aria-label="Journey imagery — slideshow"
        aria-roledescription="carousel"
      >
        <div class="fc-ss-track">

          <!-- Slide 1 — ★ SWAP src with Drive Image 1 -->
          <div class="fc-ss-slide fc-ss-on" role="group" aria-label="1 of 2" aria-roledescription="slide">
            <img
              src="https://umoyaafrikatours.co.za/wp-content/uploads/2026/optimized/compressed_dsc02384.jpg"
              alt="Heritage journey — South Africa landscape"
              loading="lazy"
            />
            <span class="fc-ss-cap">Return to the land of your ancestors</span>
          </div>

          <!-- Slide 2 — ★ SWAP src with Drive Image 2 -->
          <div class="fc-ss-slide" role="group" aria-label="2 of 2" aria-roledescription="slide">
            <img
              src="https://umoyaafrikatours.co.za/wp-content/uploads/2026/optimized/compressed_kzn(1).jpg"
              alt="Luxury lodge — Umoya journey accommodation"
              loading="lazy"
            />
            <span class="fc-ss-cap">Boutique stays. Concierge care.</span>
          </div>
        </div><!-- /.fc-ss-track -->

        <!-- Arrows -->
        <button class="fc-ss-arrow fc-ss-prev" id="fc3Prev" aria-label="Previous slide">
          <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button class="fc-ss-arrow fc-ss-next" id="fc3Next" aria-label="Next slide">
          <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
        </button>

        <!-- Dots -->
        <div class="fc-ss-dots" role="tablist" aria-label="Slide navigation">
          <button class="fc-ss-dot fc-ss-on" role="tab" aria-selected="true"  aria-label="Slide 1" data-fci="0"></button>
          <button class="fc-ss-dot"          role="tab" aria-selected="false" aria-label="Slide 2" data-fci="1"></button>
        </div>

      </div><!-- /.fc-ss-outer -->

    </div>
  </div>
</section>
