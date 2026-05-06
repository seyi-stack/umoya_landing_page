<?php if ( ! defined( 'ABSPATH' ) ) { exit; } ?>

<!--
=================================================================
  UMOYA FOUNDER'S CIRCLE — SECTION 01: HERO
  Layout: CENTRE-ALIGNED — eyebrow, title, body, buttons
  All audit fixes retained (font sizes, contrast, height guards)
=================================================================
  ELEMENTOR: First HTML widget on the page.
  id="fc-hero" is required — sticky nav bar watches this element.
  Swap <img> for <video autoplay muted loop playsinline poster="">
  when your video asset is ready.
=================================================================
-->

  <section id="fc-hero" aria-label="Founder's Circle — Hero">

    <div class="fc-h1-bg">
      <!-- Poster image loads instantly; video lazy-loads 2s after page load -->
      <img
        src="https://umoyaafrikatours.co.za/wp-content/uploads/2025/10/umoya_image-1.jpg"
        alt="Umoya Afrika Tours — heritage journey through South Africa"
        style="width:100%;height:100%;object-fit:cover;object-position:center 25%;"
      />
      <video
        id="fc-hero-vid"
        muted
        loop
        playsinline
        preload="none"
        poster="https://umoyaafrikatours.co.za/wp-content/uploads/2025/10/umoya_image-1.jpg"
        aria-label="Umoya Afrika Tours — heritage journey through South Africa"
        style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 25%;opacity:0;transition:opacity .8s ease;"
      >
        <source src="https://umoyaafrikatours.co.za/wp-content/uploads/2026/videos/umoya_hd_optimized_720.mp4" type="video/mp4" />
      </video>
    </div>

    <!-- Centre-aligned content block -->
    <div class="fc-h1-content">
      <div class="fc-h1-brand">
        <img
          src="https://umoyaafrikatours.co.za/wp-content/uploads/2025/10/Property-1Umoya-Afrika-Logo_v3.svg"
          alt="Umoya Afrika Tours"
        />
      </div>
      <span class="fc-h1-eye">An Exclusive Community</span>
      <h1 class="fc-h1-title">
        Founder's Circle
      </h1>
      <p class="fc-h1-sub">Your journey into the heart of South Africa begins here.</p>
      <div class="fc-h1-btns">
        <a href="#fc-form-section" class="fc-h1-btn fc-h1-btn-primary">
          Join the Founder's Circle
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="13 6 19 12 13 18"/>
          </svg>
        </a>
      </div>
    </div>

    <div class="fc-h1-scroll" aria-hidden="true">
      <span class="fc-h1-scroll-lbl">Scroll</span>
      <div class="fc-h1-track"></div>
    </div>

  </section>
