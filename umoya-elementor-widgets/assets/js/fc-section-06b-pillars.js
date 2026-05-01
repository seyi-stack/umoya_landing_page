/**
 * Umoya Founder's Circle — Section 06b: Brand Pillars (ES5)
 *
 * Scroll reveal for pillar columns + mobile horizontal swipe.
 */
(function () {
  'use strict';

  function init() {
    // Scroll reveal for pillar columns
    if (typeof window.fcReveal === 'function') {
      window.fcReveal('.fc-pil-rv', 'fc-pil-on');
    } else {
      var els = document.querySelectorAll('#fc-pillars .fc-pil-rv');
      if ('IntersectionObserver' in window) {
        var obs = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              e.target.classList.add('fc-pil-on');
              obs.unobserve(e.target);
            }
          });
        }, { threshold: 0.15 });
        els.forEach(function (el) { obs.observe(el); });
      } else {
        els.forEach(function (el) { el.classList.add('fc-pil-on'); });
      }
    }

    // Mobile: enable horizontal scroll snap on the grid
    var grid = document.querySelector('#fc-pillars .fc-pil-grid');
    if (!grid) return;

    // On touch devices at mobile widths, the grid becomes a horizontal scroller
    // via CSS (overflow-x: auto, scroll-snap-type). No additional JS needed
    // for the scroll behavior — CSS handles it.
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
