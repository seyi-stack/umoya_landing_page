(function () {
    'use strict';
    var els = document.querySelectorAll('.fc-why-rev');
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('fc-why-in'); e.target.style.willChange = 'auto'; obs.unobserve(e.target); }
        });
      }, { threshold: 0.1 });
      els.forEach(function (el) { obs.observe(el); });
    } else {
      els.forEach(function (el) { el.classList.add('fc-why-in'); });
    }

    /* ── Video play overlay ──────────────────────── */
    var vid = document.querySelector('#fc-why .fc-vid');
    var ph  = document.querySelector('#fc-why .fc-vid-ph');
    if (vid && ph) {
      ph.addEventListener('click', function () {
        vid.setAttribute('controls', 'controls');
        var p = vid.play();
        if (p && typeof p.then === 'function') {
          p.then(function () { ph.classList.add('fc-vid-hide'); })
           .catch(function () { ph.classList.add('fc-vid-hide'); });
        } else {
          ph.classList.add('fc-vid-hide');
        }
      });
    }
  }());
