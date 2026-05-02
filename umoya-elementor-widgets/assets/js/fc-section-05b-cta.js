(function(){
  'use strict';

  /* ── Scroll reveal ─────────────────────────────────────── */
  var rvEls = document.querySelectorAll('#fc-cta .fc-cta-rv');
  var section = document.getElementById('fc-cta');
  if (section) {
    rvEls = [section];
  }
  if ('IntersectionObserver' in window) {
    var rvObs = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting) { e.target.classList.add('on'); rvObs.unobserve(e.target); }
      });
    }, { threshold: 0.06 });
    rvEls.forEach(function(el){ rvObs.observe(el); });
  } else {
    rvEls.forEach(function(el){ el.classList.add('on'); });
  }

}());
