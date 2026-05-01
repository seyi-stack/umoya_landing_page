/**
 * Umoya Founder's Circle — Section 06: Video Player (ES5)
 *
 * Handles play/pause toggle on the brand video.
 * Clicking the placeholder button starts the video and hides the overlay.
 * Clicking the video pauses/plays.
 */
(function () {
  'use strict';

  function initVideo() {
    var wraps = document.querySelectorAll('.fc-vid-wrap');

    wraps.forEach(function (wrap) {
      var video  = wrap.querySelector('.fc-vid');
      var phBtn  = wrap.querySelector('.fc-vid-ph');

      if (!video || !phBtn) return;

      phBtn.addEventListener('click', function () {
        video.play();
        video.setAttribute('controls', '');
        phBtn.classList.add('fc-vid-ph-hidden');
      });

      video.addEventListener('click', function () {
        if (video.paused) {
          video.play();
        } else {
          video.pause();
        }
      });

      video.addEventListener('ended', function () {
        phBtn.classList.remove('fc-vid-ph-hidden');
        video.removeAttribute('controls');
        video.currentTime = 0;
      });
    });

    // Scroll reveal
    if (typeof window.fcReveal === 'function') {
      window.fcReveal('.fc-why-rev', 'fc-why-in');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVideo);
  } else {
    initVideo();
  }
}());
