/**
 * Umoya Founder's Circle — Section 03: Slideshow Carousel (ES5)
 *
 * Fade-based carousel with dot navigation, arrow buttons,
 * keyboard support, touch swipe, and full ARIA accessibility.
 *
 * Reads data-speed attribute from .fc-ss-outer for configurable
 * auto-advance interval (default 5500ms).
 */
(function () {
  'use strict';

  function initCarousel() {
    var carousel = document.querySelector('.fc-ss-outer');
    if (!carousel) return;

    var slides = carousel.querySelectorAll('.fc-ss-slide');
    var dots   = carousel.querySelectorAll('.fc-ss-dot');
    var prev   = carousel.querySelector('.fc-ss-prev');
    var next   = carousel.querySelector('.fc-ss-next');

    if (!slides.length) return;

    var current  = 0;
    var count    = slides.length;
    var speed    = parseInt(carousel.getAttribute('data-speed'), 10) || 5500;
    var timer    = null;
    var paused   = false;

    function goTo(index) {
      if (index < 0) index = count - 1;
      if (index >= count) index = 0;
      current = index;

      // Fade: toggle .fc-ss-on on slides
      for (var s = 0; s < slides.length; s++) {
        if (s === current) {
          slides[s].classList.add('fc-ss-on');
          slides[s].setAttribute('aria-hidden', 'false');
        } else {
          slides[s].classList.remove('fc-ss-on');
          slides[s].setAttribute('aria-hidden', 'true');
        }
      }

      // Update dots
      for (var d = 0; d < dots.length; d++) {
        if (d === current) {
          dots[d].classList.add('fc-ss-on');
          dots[d].setAttribute('aria-selected', 'true');
          dots[d].setAttribute('tabindex', '0');
        } else {
          dots[d].classList.remove('fc-ss-on');
          dots[d].setAttribute('aria-selected', 'false');
          dots[d].setAttribute('tabindex', '-1');
        }
      }
    }

    function startAuto() {
      stopAuto();
      if (!paused) {
        timer = setInterval(function () { goTo(current + 1); }, speed);
      }
    }

    function stopAuto() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    // Arrow buttons
    if (prev) {
      prev.addEventListener('click', function () {
        goTo(current - 1);
        stopAuto();
        startAuto();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        goTo(current + 1);
        stopAuto();
        startAuto();
      });
    }

    // Dot navigation
    for (var i = 0; i < dots.length; i++) {
      (function (idx) {
        dots[idx].addEventListener('click', function () {
          goTo(idx);
          stopAuto();
          startAuto();
        });
        dots[idx].addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            var ni = (idx + 1) % count;
            goTo(ni);
            if (dots[ni]) dots[ni].focus();
          }
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            var pi = idx - 1 < 0 ? count - 1 : idx - 1;
            goTo(pi);
            if (dots[pi]) dots[pi].focus();
          }
        });
      })(i);
    }

    // Pause on hover/focus
    carousel.addEventListener('mouseenter', function () { paused = true; stopAuto(); });
    carousel.addEventListener('mouseleave', function () { paused = false; startAuto(); });
    carousel.addEventListener('focusin', function () { paused = true; stopAuto(); });
    carousel.addEventListener('focusout', function () { paused = false; startAuto(); });

    // Keyboard navigation on carousel
    carousel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { goTo(current - 1); stopAuto(); startAuto(); }
      if (e.key === 'ArrowRight') { goTo(current + 1); stopAuto(); startAuto(); }
    });

    // Touch swipe
    var touchStartX = 0;

    carousel.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    carousel.addEventListener('touchend', function (e) {
      var diff = touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) { goTo(current + 1); }
        else { goTo(current - 1); }
        stopAuto();
        startAuto();
      }
    }, { passive: true });

    // Initialize first slide
    goTo(0);
    startAuto();

    // Scroll reveal for the section
    if (typeof window.fcReveal === 'function') {
      window.fcReveal('.fc-bf-reveal', 'fc-bf-in');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCarousel);
  } else {
    initCarousel();
  }
}());
