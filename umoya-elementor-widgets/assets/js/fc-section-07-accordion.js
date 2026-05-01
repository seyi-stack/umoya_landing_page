/**
 * Umoya Founder's Circle — Section 07: Accordion (ES5)
 *
 * One-item-open-at-a-time accordion with:
 * - aria-expanded toggle
 * - Content panel show/hide
 * - Mobile: scrollIntoView on open
 * - Keyboard: Enter/Space to toggle
 */
(function () {
  'use strict';

  function initAccordion() {
    var section = document.querySelector('.fc-det-accordion');
    if (!section) return;

    var items = section.querySelectorAll('.fc-det-item');

    items.forEach(function (item) {
      var trigger = item.querySelector('.fc-det-trigger');
      var content = item.querySelector('.fc-det-content');

      if (!trigger || !content) return;

      trigger.addEventListener('click', function () {
        var isOpen = item.classList.contains('fc-det-open');

        // Close all items
        items.forEach(function (other) {
          other.classList.remove('fc-det-open');
          var otherTrigger = other.querySelector('.fc-det-trigger');
          var otherContent = other.querySelector('.fc-det-content');
          if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
          if (otherContent) otherContent.setAttribute('aria-hidden', 'true');
        });

        // Open clicked item (unless it was already open)
        if (!isOpen) {
          item.classList.add('fc-det-open');
          trigger.setAttribute('aria-expanded', 'true');
          content.setAttribute('aria-hidden', 'false');

          // Mobile: scroll into view
          if (window.innerWidth <= 768) {
            setTimeout(function () {
              item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 300);
          }
        }
      });

      // Keyboard support
      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          trigger.click();
        }
      });
    });

    // Scroll reveal
    if (typeof window.fcReveal === 'function') {
      window.fcReveal('.fc-det-rv', 'fc-det-on');
    } else {
      var rvEls = document.querySelectorAll('.fc-det-rv');
      if ('IntersectionObserver' in window) {
        var obs = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              e.target.classList.add('fc-det-on');
              obs.unobserve(e.target);
            }
          });
        }, { threshold: 0.1 });
        rvEls.forEach(function (el) { obs.observe(el); });
      } else {
        rvEls.forEach(function (el) { el.classList.add('fc-det-on'); });
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAccordion);
  } else {
    initAccordion();
  }
}());
