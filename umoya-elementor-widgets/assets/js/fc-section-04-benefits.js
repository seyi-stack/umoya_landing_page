(function () {
    'use strict';
    var els = document.querySelectorAll('.fc-ben-reveal');
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('fc-ben-in'); e.target.style.willChange = 'auto'; obs.unobserve(e.target); }
        });
      }, { threshold: 0.1 });
      els.forEach(function (el) { obs.observe(el); });
    } else {
      els.forEach(function (el) { el.classList.add('fc-ben-in'); });
    }
  }());
