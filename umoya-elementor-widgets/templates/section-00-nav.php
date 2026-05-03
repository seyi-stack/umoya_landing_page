<?php if ( ! defined( 'ABSPATH' ) ) { exit; } ?>

<!--
=================================================================
  UMOYA FOUNDER'S CIRCLE — SECTION 00: STICKY NAVIGATION
=================================================================
  BEHAVIOUR:
  • Renders as a normal in-flow element directly below the hero
  • When user scrolls and the bar reaches the top of the viewport,
    it pins there — position: sticky; top: 0
  • No show/hide animation. No IntersectionObserver on the hero.
    The browser handles the stick natively and performantly.

  IMPORTANT — ELEMENTOR:
  • This widget must be placed immediately AFTER the hero widget
    (Section 01.1) in the Elementor panel — not before it.
  • Do NOT wrap this widget in an Elementor section that has
    overflow: hidden — that will break sticky positioning.
  • The Elementor section container for this widget should have
    no top/bottom padding and no background colour set.

  STRUCTURE:
  • Logo         — left, links to main site
  • Nav links    — centre, 6 section anchors with active state
  • CTA button   — right, anchors to form
  • Hamburger    — mobile only, opens dropdown inside the nav bar
=================================================================
-->

  <!-- ── NAV BAR (sticky) ──────────────────────────────────────── -->
  <nav id="fcNavBar" aria-label="Founder's Circle page navigation">

    <div class="fc-nav-inner">

      <!-- Logo -->
      <a class="fc-nav-logo" href="#fc-hero" aria-label="Umoya Afrika Tours — back to top">
        <img
          src="https://umoyaafrikatours.co.za/wp-content/uploads/2025/10/Umoya-Afrika-Logomark.svg"
          alt="Umoya Afrika Tours logo"
          onerror="this.style.display='none';document.getElementById('fcNLT').style.display='inline';"
        />
        <span class="fc-nav-logo-text" id="fcNLT" style="display:none;">Umoya</span>
      </a>

      <!-- Desktop section links -->
      <ul class="fc-nav-links" role="list">
        <li class="fc-nav-item" data-s="fc-intro">
          <a class="fc-nav-link" href="#fc-intro">Overview</a>
        </li>
        <li class="fc-nav-item" data-s="fc-form-section">
          <a class="fc-nav-link" href="#fc-form-section">How to Inquire</a>
        </li>
        <li class="fc-nav-item" data-s="fc-benefits">
          <a class="fc-nav-link" href="#fc-benefits">Membership Offers</a>
        </li>
        <li class="fc-nav-item" data-s="fc-journey">
          <a class="fc-nav-link" href="#fc-journey">Signature Journey Details</a>
        </li>
        <li class="fc-nav-item" data-s="fc-why">
          <a class="fc-nav-link" href="#fc-why">Why Umoya Afrika Tours?</a>
        </li>
        <li class="fc-nav-item" data-s="fc-details">
          <a class="fc-nav-link" href="#fc-details">Travel Essentials</a>
        </li>
      </ul>

      <!-- Desktop CTA -->
      <a class="fc-nav-cta" href="#fc-form-section">Reserve Your Place</a>

      <!-- Hamburger -->
      <button
        class="fc-nav-burger"
        id="fcNavBurger"
        aria-label="Open navigation menu"
        aria-expanded="false"
        aria-controls="fcNavDropdown"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <!-- Mobile dropdown — inside the nav so it follows sticky position -->
      <div class="fc-nav-dropdown" id="fcNavDropdown" role="menu" aria-label="Page sections">

        <ul class="fc-nav-dropdown-list" role="list">
          <li class="fc-nav-dropdown-item" data-s="fc-intro">
            <a class="fc-nav-dropdown-link" href="#fc-intro" role="menuitem">Overview</a>
          </li>
          <li class="fc-nav-dropdown-item" data-s="fc-form-section">
            <a class="fc-nav-dropdown-link" href="#fc-form-section" role="menuitem">How to Inquire</a>
          </li>
          <li class="fc-nav-dropdown-item" data-s="fc-benefits">
            <a class="fc-nav-dropdown-link" href="#fc-benefits" role="menuitem">Membership Offers</a>
          </li>
          <li class="fc-nav-dropdown-item" data-s="fc-journey">
            <a class="fc-nav-dropdown-link" href="#fc-journey" role="menuitem">Signature Journey Details</a>
          </li>
          <li class="fc-nav-dropdown-item" data-s="fc-why">
            <a class="fc-nav-dropdown-link" href="#fc-why" role="menuitem">Why Umoya Afrika Tours?</a>
          </li>
          <li class="fc-nav-dropdown-item" data-s="fc-details">
            <a class="fc-nav-dropdown-link" href="#fc-details" role="menuitem">Travel Essentials</a>
          </li>
        </ul>

        <div class="fc-nav-dropdown-cta-row">
          <a class="fc-nav-dropdown-cta" href="#fc-form-section">Reserve Your Place</a>
        </div>

      </div><!-- /.fc-nav-dropdown -->

    </div><!-- /.fc-nav-inner -->

  </nav>
