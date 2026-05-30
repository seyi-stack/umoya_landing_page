(function(){
  'use strict';
  var root = document.getElementById('fc-pricing');
  if (!root) return;

  var rvEls = root.querySelectorAll('.fc-pri-rv');
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) { e.target.classList.add('fc-pri-on'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    rvEls.forEach(function(el) { obs.observe(el); });
  } else {
    rvEls.forEach(function(el) { el.classList.add('fc-pri-on'); });
  }
})();
