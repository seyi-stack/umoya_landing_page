(function () {
    'use strict';

    /* ── Scroll reveal ─────────────────────────── */
    var revEls = document.querySelectorAll('.fc-det-rev');
    if ('IntersectionObserver' in window) {
      var revObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('fc-det-in'); e.target.style.willChange = 'auto'; revObs.unobserve(e.target); }
        });
      }, { threshold: 0.1 });
      revEls.forEach(function (el) { revObs.observe(el); });
    } else {
      revEls.forEach(function (el) { el.classList.add('fc-det-in'); });
    }

    /* ── Accordion ─────────────────────────────── */
    var items = document.querySelectorAll('.fc-acc-item');

    items.forEach(function (item) {
      var btn = item.querySelector('.fc-acc-btn');
      if (!btn) return;

      btn.addEventListener('click', function () {
        var isOpen = item.classList.contains('fc-det-open');

        /* Close all */
        items.forEach(function (i) {
          i.classList.remove('fc-det-open');
          var b = i.querySelector('.fc-acc-btn');
          if (b) b.setAttribute('aria-expanded', 'false');
        });

        /* Open the clicked one (unless it was already open) */
        if (!isOpen) {
          item.classList.add('fc-det-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });

  }());
