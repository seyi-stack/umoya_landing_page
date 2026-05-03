<?php if ( ! defined( 'ABSPATH' ) ) { exit; } ?>

<!--
=================================================================
  UMOYA FOUNDER'S CIRCLE — SECTION 05: YOUR JOURNEY BEGINS HERE
  Map: Leaflet.js — dynamically injected CSS + JS (Elementor safe)
=================================================================
  WHY DYNAMIC INJECTION:
  Elementor HTML widgets sometimes strip <link> tags and <script>
  src attributes. Injecting Leaflet CSS and JS programmatically
  via document.createElement guarantees they load in all cases.

  MAP HEIGHT FIX:
  Previous version used position:absolute which collapses to 0px
  when the parent has no explicit height. Now the map uses an
  explicit pixel height set from the right content column height
  via JS, with a 460px fallback — so Leaflet always has a non-zero
  container to render into.
=================================================================
-->

  <section id="fc-journey" aria-label="Signature Heritage Journey — Your Journey Begins Here">
    <div class="fc-jrn-c">

      <!-- ── A. HEADER + STATS ──────────────────────────── -->
      <div class="fc-jrn-hd fc-jrn-rv">
        <div>
          <span class="fc-jrn-eye">Our Signature Journey</span>
          <h2 class="fc-jrn-ttl">Your Journey <em>Begins Here</em></h2>
        </div>
        <div class="fc-jrn-stats" role="list">
          <div class="fc-jrn-stat" role="listitem">
            <div class="fc-jrn-stat-n">15</div>
            <div class="fc-jrn-stat-l">Days</div>
          </div>
          <div class="fc-jrn-stat" role="listitem">
            <div class="fc-jrn-stat-n">4</div>
            <div class="fc-jrn-stat-l">Provinces</div>
          </div>
          <div class="fc-jrn-stat" role="listitem">
            <div class="fc-jrn-stat-n">16</div>
            <div class="fc-jrn-stat-l">Guests</div>
          </div>
        </div>
      </div>

    </div><!-- /.fc-jrn-c -->

    <!-- B. PROVINCE TABS + ACCORDION -->
    <div class="fc-jrn-tabs-wrap">
      <div class="fc-prov-tabs fc-jrn-rv d1">

        <!-- Left: title tabs -->
        <div class="fc-pt-list" role="tablist" aria-label="Signature journey — five sections">

          <button class="fc-pt-tab fc-pt-active" type="button" role="tab"
                  id="fc-pt-tab-1" aria-controls="fc-pt-panel-1"
                  aria-selected="true" tabindex="0">
            <span class="fc-pt-tab-inner">
              <span class="fc-pt-reg">The Route</span>
              <span class="fc-pt-nm">Journey Across Four Provinces</span>
            </span>
          </button>

          <button class="fc-pt-tab" type="button" role="tab"
                  id="fc-pt-tab-2" aria-controls="fc-pt-panel-2"
                  aria-selected="false" tabindex="-1">
            <span class="fc-pt-num" aria-hidden="true">01</span>
            <span class="fc-pt-tab-inner">
              <span class="fc-pt-reg">Gauteng</span>
              <span class="fc-pt-nm">Liberation History<br />&amp; Urban Culture</span>
            </span>
          </button>

          <button class="fc-pt-tab" type="button" role="tab"
                  id="fc-pt-tab-3" aria-controls="fc-pt-panel-3"
                  aria-selected="false" tabindex="-1">
            <span class="fc-pt-num" aria-hidden="true">02</span>
            <span class="fc-pt-tab-inner">
              <span class="fc-pt-reg">Mpumalanga</span>
              <span class="fc-pt-nm">Safari &amp; Scenic<br />Landscapes</span>
            </span>
          </button>
          <button class="fc-pt-tab" type="button" role="tab"
                  id="fc-pt-tab-5" aria-controls="fc-pt-panel-5"
                  aria-selected="false" tabindex="-1">
            <span class="fc-pt-num" aria-hidden="true">03</span>
            <span class="fc-pt-tab-inner">
              <span class="fc-pt-reg">KwaZulu-Natal</span>
              <span class="fc-pt-nm">Zulu Culture<br />&amp; Coastal Beauty</span>
            </span>
          </button>

          <button class="fc-pt-tab" type="button" role="tab"
                  id="fc-pt-tab-6" aria-controls="fc-pt-panel-6"
                  aria-selected="false" tabindex="-1">
            <span class="fc-pt-num" aria-hidden="true">04</span>
            <span class="fc-pt-tab-inner">
              <span class="fc-pt-reg">Western Cape</span>
              <span class="fc-pt-nm">Cape Peninsula<br />&amp; Winelands</span>
            </span>
          </button>

        </div>

        <!-- Middle: content panels -->
        <div class="fc-pt-content">

          <div class="fc-pt-panel fc-pt-active" role="tabpanel"
               id="fc-pt-panel-1" aria-labelledby="fc-pt-tab-1">
            <span class="fc-pt-eye">The Route</span>
            <h3 class="fc-pt-ttl">Journey Across<br />Four Provinces</h3>
            <span class="fc-pt-rule" aria-hidden="true"></span>
            <p class="fc-pt-body">Your Signature Journey is a 15-day experience across four provinces of South Africa, designed as a rare opportunity to encounter the country through authentic local perspectives. The journey unfolds through a series of intimate, thoughtfully curated moments not typically accessible to most travelers.</p>
          </div>

          <div class="fc-pt-panel" role="tabpanel"
               id="fc-pt-panel-2" aria-labelledby="fc-pt-tab-2">
            <span class="fc-pt-eye">Gauteng</span>
            <h3 class="fc-pt-ttl">Liberation History<br />&amp; Urban Culture</h3>
            <span class="fc-pt-rule" aria-hidden="true"></span>
            <p class="fc-pt-body">The economic heart of Africa. Home to the liberation struggle that changed a continent. Walk through the powerful exhibits of the Apartheid Museum with expert context and experience authentic Soweto with community-rooted guides who lived these stories. Visit landmarks like Nelson Mandela House on Vilakazi Street and explore Freedom Park for a comprehensive historical perspective. This is where you encounter the struggle for freedom through local perspectives.</p>
          </div>

          <div class="fc-pt-panel" role="tabpanel"
               id="fc-pt-panel-3" aria-labelledby="fc-pt-tab-3">
            <span class="fc-pt-eye">Mpumalanga</span>
            <h3 class="fc-pt-ttl">Safari &amp; Scenic<br />Landscapes</h3>
            <span class="fc-pt-rule" aria-hidden="true"></span>
            <p class="fc-pt-body">Where humanity's earliest ancestors walked. A landscape as ancient as the story of us all. Journey along the scenic Panorama Route, taking in sweeping views of Blyde River Canyon, one of the world's largest green canyons. Experience private game drives in Kruger National Park with expert guides leading you through vast landscapes teeming with Big Five wildlife. Visit the historic Inzalo ye Langa stone circle site, an astronomical calendar demonstrating sophisticated pre-colonial African science, and explore the ancient Sudwala Caves.</p>
          </div>
          <div class="fc-pt-panel" role="tabpanel"
               id="fc-pt-panel-5" aria-labelledby="fc-pt-tab-5">
            <span class="fc-pt-eye">KwaZulu-Natal</span>
            <h3 class="fc-pt-ttl">Zulu Culture<br />&amp; Coastal Beauty</h3>
            <span class="fc-pt-rule" aria-hidden="true"></span>
            <p class="fc-pt-body">Zulu kingdom territory. Where one of history's greatest resistances against colonial rule was fought. Explore key historical sites with specialist guides who provide expert context on the military innovations and cultural legacy of the Zulu nation. The region's stunning Indian Ocean coastline offers pristine beaches, warm subtropical waters, and dramatic coastal scenery. Experience luxury beachfront accommodations, scenic coastal drives along the Dolphin Coast, and exclusive access to secluded beach areas.</p>
          </div>

          <div class="fc-pt-panel" role="tabpanel"
               id="fc-pt-panel-6" aria-labelledby="fc-pt-tab-6">
            <span class="fc-pt-eye">Western Cape</span>
            <h3 class="fc-pt-ttl">Cape Peninsula<br />&amp; Winelands</h3>
            <span class="fc-pt-rule" aria-hidden="true"></span>
            <p class="fc-pt-body">From a port of arrival to one of the world's most celebrated cities. Contemporary African creativity thrives here. Stand on Robben Island where Nelson Mandela spent 18 of his 27 years, guided by former political prisoners who share stories of resilience that changed a nation. Ascend Table Mountain for panoramic views and explore the dramatic Cape Peninsula coastline including Chapman's Peak and Cape Point. Experience private tastings at exclusive wine estates, and discover Cape Town's vibrant creative scene through curated gallery visits and studio access.</p>
          </div>

        </div>

        <!-- Right: image panels. Panel 1 contains the interactive
             Leaflet map; panels 2–6 use province photographs. -->
        <div class="fc-pt-images" aria-hidden="true">

          <!-- Panel 1: Leaflet map (Overview) -->
          <div class="fc-pt-img fc-pt-active" id="fc-pt-img-map">
            <div class="fc-map-loading" id="fcMapLoading">
              <div class="fc-map-loading-inner">
                <div class="fc-map-spinner"></div>
                <span class="fc-map-loading-txt">Loading map&hellip;</span>
              </div>
            </div>
            <div id="fcLeafletMap" aria-label="South Africa route map — four provinces"></div>
          </div>

          <!-- Panel 2: Gauteng -->
          <div class="fc-pt-img">
            <!-- ★ SWAP: Gauteng image -->
            <img src="https://umoyaafrikatours.co.za/wp-content/uploads/2025/12/IMG_6762-scaled.webp"
                 alt="" loading="lazy" />
            <div class="fc-pt-img-ov"></div>
          </div>

          <!-- Panel 3: Mpumalanga -->
          <div class="fc-pt-img">
            <!-- ★ SWAP: IMG_7057-scaled.webp -->
            <img src="https://umoyaafrikatours.co.za/wp-content/uploads/2026/optimized/compressed_dsc02927.jpg"
                 alt="" loading="lazy" />
            <div class="fc-pt-img-ov"></div>
          </div>
          <!-- Panel 4: KwaZulu-Natal -->
          <div class="fc-pt-img">
            <img src="https://umoyaafrikatours.co.za/wp-content/uploads/2026/04/DSC04415.jpg"
                 alt="" loading="lazy" />
            <div class="fc-pt-img-ov"></div>
          </div>

          <!-- Panel 5: Western Cape -->
          <div class="fc-pt-img">
            <!-- ★ SWAP: IMG_7630-scaled.webp -->
            <img src="https://umoyaafrikatours.co.za/wp-content/uploads/2026/optimized/compressed_img_7634.jpeg"
                 alt="" loading="lazy" />
            <div class="fc-pt-img-ov"></div>
          </div>

        </div>

      </div>

      <!-- ── B-MOBILE. PROVINCE ACCORDION ──────────────────
           Renders only at ≤900px (CSS toggle). Mirrors the
           desktop tabs above as a stacked FAQ-style reveal. -->
      <div class="fc-prov-acc fc-jrn-rv d1" aria-label="Signature journey — five sections">

        <!-- 01 Overview -->
        <article class="fc-pa-item fc-pa-active">
          <h3 class="fc-pa-h">
            <button class="fc-pa-trigger" type="button"
                    id="fc-pa-trig-1" aria-expanded="true" aria-controls="fc-pa-body-1">
              <span class="fc-pa-label-wrap">
                <span class="fc-pa-reg">The Route</span>
                <span class="fc-pa-ttl">Journey Across Four Provinces</span>
              </span>
              <span class="fc-pa-chev" aria-hidden="true">
                <svg viewBox="0 0 14 14" width="14" height="14" fill="none">
                  <path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.8"
                        stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </button>
          </h3>
          <div class="fc-pa-body" id="fc-pa-body-1" role="region" aria-labelledby="fc-pa-trig-1">
            <div class="fc-pa-body-inner">
              <div class="fc-pa-image fc-pa-image-map" aria-hidden="true">
                <div id="fcLeafletMapMob" aria-label="South Africa route map"></div>
              </div>
              <span class="fc-pa-rule" aria-hidden="true"></span>
              <p class="fc-pa-text">Your Signature Journey is a 15-day experience across four provinces of South Africa, designed as a rare opportunity to encounter the country through authentic local perspectives. The journey unfolds through a series of intimate, thoughtfully curated moments not typically accessible to most travelers.</p>
            </div>
          </div>
        </article>

        <!-- 02 Gauteng -->
        <article class="fc-pa-item">
          <h3 class="fc-pa-h">
            <button class="fc-pa-trigger" type="button"
                    id="fc-pa-trig-2" aria-expanded="false" aria-controls="fc-pa-body-2">
              <span class="fc-pa-num" aria-hidden="true">01</span>
              <span class="fc-pa-label-wrap">
                <span class="fc-pa-reg">Gauteng</span>
                <span class="fc-pa-ttl">Liberation History &amp; Urban Culture</span>
              </span>
              <span class="fc-pa-chev" aria-hidden="true">
                <svg viewBox="0 0 14 14" width="14" height="14" fill="none">
                  <path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.8"
                        stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </button>
          </h3>
          <div class="fc-pa-body" id="fc-pa-body-2" role="region" aria-labelledby="fc-pa-trig-2">
            <div class="fc-pa-body-inner">
              <div class="fc-pa-image">
                <img src="https://umoyaafrikatours.co.za/wp-content/uploads/2025/12/IMG_6762-scaled.webp"
                     alt="" loading="lazy" />
              </div>
              <span class="fc-pa-rule" aria-hidden="true"></span>
              <p class="fc-pa-text">The economic heart of Africa. Home to the liberation struggle that changed a continent. Walk through the powerful exhibits of the Apartheid Museum with expert context and experience authentic Soweto with community-rooted guides who lived these stories. Visit landmarks like Nelson Mandela House on Vilakazi Street and explore Freedom Park for a comprehensive historical perspective. This is where you encounter the struggle for freedom through local perspectives.</p>
            </div>
          </div>
        </article>

        <!-- 03 Mpumalanga -->
        <article class="fc-pa-item">
          <h3 class="fc-pa-h">
            <button class="fc-pa-trigger" type="button"
                    id="fc-pa-trig-3" aria-expanded="false" aria-controls="fc-pa-body-3">
              <span class="fc-pa-num" aria-hidden="true">02</span>
              <span class="fc-pa-label-wrap">
                <span class="fc-pa-reg">Mpumalanga</span>
                <span class="fc-pa-ttl">Safari &amp; Scenic Landscapes</span>
              </span>
              <span class="fc-pa-chev" aria-hidden="true">
                <svg viewBox="0 0 14 14" width="14" height="14" fill="none">
                  <path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.8"
                        stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </button>
          </h3>
          <div class="fc-pa-body" id="fc-pa-body-3" role="region" aria-labelledby="fc-pa-trig-3">
            <div class="fc-pa-body-inner">
              <div class="fc-pa-image">
                <img src="https://umoyaafrikatours.co.za/wp-content/uploads/2026/optimized/compressed_dsc02927.jpg"
                     alt="" loading="lazy" />
              </div>
              <span class="fc-pa-rule" aria-hidden="true"></span>
              <p class="fc-pa-text">Where humanity's earliest ancestors walked. A landscape as ancient as the story of us all. Journey along the scenic Panorama Route, taking in sweeping views of Blyde River Canyon, one of the world's largest green canyons. Experience private game drives in Kruger National Park with expert guides leading you through vast landscapes teeming with Big Five wildlife. Visit the historic Inzalo ye Langa stone circle site, an astronomical calendar demonstrating sophisticated pre-colonial African science, and explore the ancient Sudwala Caves.</p>
            </div>
          </div>
        </article>
        <!-- 04 KwaZulu-Natal -->
        <article class="fc-pa-item">
          <h3 class="fc-pa-h">
            <button class="fc-pa-trigger" type="button"
                    id="fc-pa-trig-5" aria-expanded="false" aria-controls="fc-pa-body-5">
              <span class="fc-pa-num" aria-hidden="true">03</span>
              <span class="fc-pa-label-wrap">
                <span class="fc-pa-reg">KwaZulu-Natal</span>
                <span class="fc-pa-ttl">Zulu Culture &amp; Coastal Beauty</span>
              </span>
              <span class="fc-pa-chev" aria-hidden="true">
                <svg viewBox="0 0 14 14" width="14" height="14" fill="none">
                  <path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.8"
                        stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </button>
          </h3>
          <div class="fc-pa-body" id="fc-pa-body-5" role="region" aria-labelledby="fc-pa-trig-5">
            <div class="fc-pa-body-inner">
              <div class="fc-pa-image">
                <img src="https://umoyaafrikatours.co.za/wp-content/uploads/2026/04/DSC04415.jpg"
                     alt="" loading="lazy" />
              </div>
              <span class="fc-pa-rule" aria-hidden="true"></span>
              <p class="fc-pa-text">Zulu kingdom territory. Where one of history's greatest resistances against colonial rule was fought. Explore key historical sites with specialist guides who provide expert context on the military innovations and cultural legacy of the Zulu nation. The region's stunning Indian Ocean coastline offers pristine beaches, warm subtropical waters, and dramatic coastal scenery. Experience luxury beachfront accommodations, scenic coastal drives along the Dolphin Coast, and exclusive access to secluded beach areas.</p>
            </div>
          </div>
        </article>

        <!-- 05 Western Cape -->
        <article class="fc-pa-item">
          <h3 class="fc-pa-h">
            <button class="fc-pa-trigger" type="button"
                    id="fc-pa-trig-6" aria-expanded="false" aria-controls="fc-pa-body-6">
              <span class="fc-pa-num" aria-hidden="true">04</span>
              <span class="fc-pa-label-wrap">
                <span class="fc-pa-reg">Western Cape</span>
                <span class="fc-pa-ttl">Cape Peninsula &amp; Winelands</span>
              </span>
              <span class="fc-pa-chev" aria-hidden="true">
                <svg viewBox="0 0 14 14" width="14" height="14" fill="none">
                  <path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.8"
                        stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </button>
          </h3>
          <div class="fc-pa-body" id="fc-pa-body-6" role="region" aria-labelledby="fc-pa-trig-6">
            <div class="fc-pa-body-inner">
              <div class="fc-pa-image">
                <img src="https://umoyaafrikatours.co.za/wp-content/uploads/2026/optimized/compressed_img_7634.jpeg"
                     alt="" loading="lazy" />
              </div>
              <span class="fc-pa-rule" aria-hidden="true"></span>
              <p class="fc-pa-text">From a port of arrival to one of the world's most celebrated cities. Contemporary African creativity thrives here. Stand on Robben Island where Nelson Mandela spent 18 of his 27 years, guided by former political prisoners who share stories of resilience that changed a nation. Ascend Table Mountain for panoramic views and explore the dramatic Cape Peninsula coastline including Chapman's Peak and Cape Point. Experience private tastings at exclusive wine estates, and discover Cape Town's vibrant creative scene through curated gallery visits and studio access.</p>
            </div>
          </div>
        </article>

      </div>

    </div><!-- /.fc-jrn-tabs-wrap -->

  </section>
