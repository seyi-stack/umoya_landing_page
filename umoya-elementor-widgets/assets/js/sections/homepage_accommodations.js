(function(){
    'use strict';
    var root = document.getElementById('umoya-accommodations');
    if (!root) return;

    var images = Array.prototype.slice.call(root.querySelectorAll('.umoya-acc-image'));
    var prev = root.querySelector('[data-acc-prev]');
    var next = root.querySelector('[data-acc-next]');
    var index = 0;

    function normalizeIndex(value) {
      return (value + images.length) % images.length;
    }

    function imageIsReady(image) {
      return image && image.complete && image.naturalWidth > 0;
    }

    function render(nextIndex) {
      index = normalizeIndex(nextIndex);
      images.forEach(function(img, imgIndex) {
        img.classList.toggle('is-active', imgIndex === index);
      });
    }

    function renderWhenDecoded(nextIndex) {
      var targetIndex = normalizeIndex(nextIndex);
      var targetImage = images[targetIndex];

      if (!targetImage || typeof targetImage.decode !== 'function') {
        render(targetIndex);
        return;
      }

      targetImage.decode().catch(function() {
        return null;
      }).then(function() {
        render(targetIndex);
      });
    }

    function requestImage(nextIndex) {
      var targetIndex = normalizeIndex(nextIndex);
      var targetImage = images[targetIndex];

      /* Avoid revealing the gallery background while a remote image is still loading. */
      if (imageIsReady(targetImage)) {
        renderWhenDecoded(targetIndex);
        return;
      }

      function cleanup() {
        targetImage.removeEventListener('load', onReady);
        targetImage.removeEventListener('error', cleanup);
      }

      function onReady() {
        cleanup();
        renderWhenDecoded(targetIndex);
      }

      targetImage.addEventListener('load', onReady, { once: true });
      targetImage.addEventListener('error', cleanup, { once: true });
    }

    prev && prev.addEventListener('click', function() { requestImage(index - 1); });
    next && next.addEventListener('click', function() { requestImage(index + 1); });
  }());
