/**
 * Umoya Founder's Circle — Shared Scroll Reveal (ES5)
 *
 * Usage:  window.fcReveal('.fc-ben-reveal', 'fc-ben-in');
 *
 * Observes all elements matching `selector` and adds `onClass`
 * once they scroll into view. Falls back to immediate reveal
 * when IntersectionObserver is unavailable.
 */
(function () {
  'use strict';

  window.fcReveal = function (selector, onClass, threshold) {
    var els = document.querySelectorAll(selector);
    if (!els.length) return;

    threshold = typeof threshold === 'number' ? threshold : 0.1;

    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add(onClass);
            obs.unobserve(e.target);
          }
        });
      }, { threshold: threshold });

      els.forEach(function (el) { obs.observe(el); });
    } else {
      // Fallback: show everything immediately.
      els.forEach(function (el) { el.classList.add(onClass); });
    }
  };

  // Auto-init for Benefits section (Section 04).
  // Additional sections will call fcReveal() from their own scripts.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window.fcReveal('.fc-ben-reveal', 'fc-ben-in');
    });
  } else {
    window.fcReveal('.fc-ben-reveal', 'fc-ben-in');
  }
}());
