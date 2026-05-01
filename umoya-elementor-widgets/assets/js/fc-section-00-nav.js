/**
 * Umoya Founder's Circle — Section 00: Sticky Nav (ES5)
 *
 * Shows the nav bar once #fc-hero scrolls out of the viewport.
 * Uses IntersectionObserver with a fallback to scroll position.
 */
(function () {
  'use strict';

  function init() {
    var bar  = document.getElementById('fcNavBar');
    if (!bar) return;

    // In Elementor editor, bar is always visible.
    if (bar.getAttribute('data-editor') === '1') return;

    var hero = document.getElementById('fc-hero');

    if (hero && 'IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            bar.classList.remove('fc-nav-visible');
          } else {
            bar.classList.add('fc-nav-visible');
          }
        });
      }, { threshold: 0 });
      obs.observe(hero);
    } else {
      // Fallback: show after 300px scroll.
      var ticking = false;
      window.addEventListener('scroll', function () {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(function () {
            if (window.scrollY > 300) {
              bar.classList.add('fc-nav-visible');
            } else {
              bar.classList.remove('fc-nav-visible');
            }
            ticking = false;
          });
        }
      }, { passive: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
