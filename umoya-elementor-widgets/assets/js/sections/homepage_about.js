(function(){
    'use strict';
    var items = document.querySelectorAll('#umoya-about .umoya-about-rv');
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      items.forEach(function(item) { obs.observe(item); });
    } else {
      items.forEach(function(item) { item.classList.add('is-visible'); });
    }
  }());
