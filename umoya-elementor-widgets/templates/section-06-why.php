<?php if ( ! defined( 'ABSPATH' ) ) { exit; } ?>

<!--
=================================================================
  UMOYA FOUNDER'S CIRCLE — SECTION 06: WHY UMOYA AFRIKA TOURS
=================================================================
  ELEMENTOR USAGE:
  • Add an "HTML" widget after Section 05 (Journey).
  • Layout: two-column — copy left, video + CTA right.
  • VIDEO: Replace the placeholder div with your actual embed:
      Primary: Brand Video (Coming Soon)
      Backup: Google Drive backup video from brief
=================================================================
-->

  <section id="fc-why" aria-label="Why Umoya Afrika Tours">
    <div class="fc-why-wrap">

      <!-- Two-column grid -->
      <div class="fc-why-grid">

        <!-- ── LEFT: Philosophy copy ───────────────── -->
        <div class="fc-why-rev">
          <span class="fc-why-eyebrow">Our Philosophy</span>
          <h2 class="fc-why-title">We Live &amp; Breathe <em>Africa Differently.</em></h2>
          <span class="fc-why-rule" aria-hidden="true"></span>

          <p class="fc-why-lead"><strong>We believe the spirit of Africa lives in the details.</strong></p>

          <p class="fc-why-body">At Umoya Afrika Tours, we approach each journey with an unwavering dedication to every need of our guests. Nothing is left to chance. Every detail considered. Every moment crafted to feel effortless.</p>

          <p class="fc-why-body">Intimate in scale and guided by those with deep ties to the continent, our journeys bring together cultural depth, intentional design, and quiet wonder. A refined expression of African luxury that stays with you long after it ends.</p>
          <a href="#fc-form-section" class="fc-why-btn">Inquire Now</a>
        </div>

        <!-- ── RIGHT: Video + CTA ─────────────────── -->
        <div class="fc-why-aside fc-why-rev fc-d2">

          <!-- Video block -->
          <div class="fc-vid-wrap">
            <button class="fc-vid-ph" type="button" aria-label="Play Umoya brand video" aria-haspopup="dialog" aria-controls="fc-why-video-modal">
              <span class="fc-play" aria-hidden="true">
                <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </span>
            </button>
          </div>

        </div>

      </div><!-- /.fc-why-grid -->


    </div>
    <div class="fc-video-modal" id="fc-why-video-modal" role="dialog" aria-modal="true" aria-label="Umoya Afrika Tours video" hidden>
      <div class="fc-video-backdrop" data-fc-video-close></div>
      <div class="fc-video-dialog">
        <button class="fc-video-close" type="button" aria-label="Close video" data-fc-video-close>
          <span aria-hidden="true">&times;</span>
        </button>
        <video
          class="fc-video-player"
          src="https://umoyaafrikatours.co.za/wp-content/uploads/2026/videos/umoya_hd_optimized_720.mp4"
          preload="metadata"
          controls
          controlsList="nodownload"
          playsinline
          aria-label="Umoya Afrika Tours video">
        </video>
      </div>
    </div>
  </section>
