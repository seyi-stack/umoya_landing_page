(function(){
    'use strict';

    var script = document.currentScript;
    var root = script && script.closest ? script.closest('#umoya-journey') : document.getElementById('umoya-journey');
    if (!root) return;

    /*
      Elementor can rerender HTML widgets while editing. Rebuild the carousel
      bindings each time this script runs so stale timers/listeners cannot keep
      the first slide frozen.
    */
    if (root.__umoyaJourneyTimer) {
      window.clearInterval(root.__umoyaJourneyTimer);
      root.__umoyaJourneyTimer = null;
    }
    if (root.__umoyaJourneyClick) {
      root.removeEventListener('click', root.__umoyaJourneyClick);
    }
    if (root.__umoyaJourneyFocusIn) {
      root.removeEventListener('focusin', root.__umoyaJourneyFocusIn);
    }
    if (root.__umoyaJourneyFocusOut) {
      root.removeEventListener('focusout', root.__umoyaJourneyFocusOut);
    }

    var images = Array.prototype.slice.call(root.querySelectorAll('.umoya-journey-image'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('.umoya-journey-dot'));
    var index = 0;
    var AUTOPLAY_DELAY = 5000;

    if (!images.length) return;

    function normalizeIndex(value) {
      return (value + images.length) % images.length;
    }

    function showSlide(nextIndex) {
      index = normalizeIndex(nextIndex);
      images.forEach(function(image, imageIndex) {
        image.classList.toggle('is-active', imageIndex === index);
      });
      dots.forEach(function(dot, dotIndex) {
        var isActive = dotIndex === index;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-current', isActive ? 'true' : 'false');
      });
    }

    function requestSlide(nextIndex) {
      showSlide(nextIndex);
    }

    function startAutoplay() {
      if (root.__umoyaJourneyTimer || images.length < 2) return;
      root.__umoyaJourneyTimer = window.setInterval(function() {
        requestSlide(index + 1);
      }, AUTOPLAY_DELAY);
    }

    function stopAutoplay() {
      if (!root.__umoyaJourneyTimer) return;
      window.clearInterval(root.__umoyaJourneyTimer);
      root.__umoyaJourneyTimer = null;
    }

    function activateDot(dot, event) {
      var targetIndex = parseInt(dot.getAttribute('data-journey-dot'), 10);
      if (isNaN(targetIndex)) return;

      if (event && event.preventDefault) event.preventDefault();
      if (event && event.stopPropagation) event.stopPropagation();
      stopAutoplay();
      requestSlide(targetIndex);
      startAutoplay();
    }

    dots.forEach(function(dot) {
      dot.onclick = function(event) {
        activateDot(dot, event);
      };
    });

    root.__umoyaJourneyClick = function(event) {
      var dot = event.target.closest ? event.target.closest('.umoya-journey-dot') : null;
      if (!dot || !root.contains(dot)) return;
      activateDot(dot, event);
    };

    root.__umoyaJourneyFocusIn = stopAutoplay;
    root.__umoyaJourneyFocusOut = startAutoplay;

    root.addEventListener('click', root.__umoyaJourneyClick);
    root.addEventListener('focusin', root.__umoyaJourneyFocusIn);
    root.addEventListener('focusout', root.__umoyaJourneyFocusOut);

    showSlide(0);
    startAutoplay();
  }());
