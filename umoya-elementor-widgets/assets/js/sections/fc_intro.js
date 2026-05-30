(function () {
  'use strict';
  var els = document.querySelectorAll('#fc-intro .fc-intro-rv');
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('fc-intro-on');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    els.forEach(function (el) { obs.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('fc-intro-on'); });
  }
}());
