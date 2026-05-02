(function(){
  'use strict';

  /* ── Scroll reveal (desktop) ───────────────────── */
  var rvEls = document.querySelectorAll('#fc-pillars .fc-pil-rv');
  if ('IntersectionObserver' in window) {
    var rvObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) { e.target.classList.add('fc-pil-on'); rvObs.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    rvEls.forEach(function(el) { rvObs.observe(el); });
  } else {
    rvEls.forEach(function(el) { el.classList.add('fc-pil-on'); });
  }

  /* ── Infinite swipe carousel (mobile) ──────────── */
  var MOBILE_BP = 768;
  var container = document.querySelector('#fc-pillars .fc-pil-grid');
  if (!container) return;

  var origCols = [];
  var children = container.children;
  var i;
  for (i = 0; i < children.length; i++) {
    origCols.push(children[i]);
  }
  var colCount = origCols.length;
  var isSetup = false;
  var offset = 0;
  var dragging = false;
  var startX = 0;
  var startOffset = 0;
  var colWidth = 0;
  var totalOrigWidth = 0;

  function getColWidth() {
    var first = container.querySelector('.fc-pil-col');
    if (!first) return 0;
    return first.offsetWidth;
  }

  function applyTransform(smooth) {
    if (smooth) {
      container.style.transition = 'transform 0.35s cubic-bezier(.25,.46,.45,.94)';
    } else {
      container.style.transition = 'none';
    }
    container.style.transform = 'translateX(' + offset + 'px)';
  }

  function wrapOffset() {
    if (offset > 0) {
      offset -= totalOrigWidth;
      applyTransform(false);
    } else if (offset < -totalOrigWidth * 2 + colWidth) {
      offset += totalOrigWidth;
      applyTransform(false);
    }
  }

  function snapToNearest() {
    colWidth = getColWidth();
    totalOrigWidth = colWidth * colCount;
    var drift = offset - startOffset;
    var threshold = colWidth * 0.15;
    var snapped;
    if (drift < -threshold) {
      snapped = Math.floor(offset / colWidth) * colWidth;
    } else if (drift > threshold) {
      snapped = Math.ceil(offset / colWidth) * colWidth;
    } else {
      snapped = Math.round(startOffset / colWidth) * colWidth;
    }
    offset = snapped;
    applyTransform(true);
    setTimeout(function(){ wrapOffset(); }, 380);
  }

  function setupCarousel() {
    if (window.innerWidth > MOBILE_BP) {
      if (isSetup) teardown();
      return;
    }
    if (isSetup) return;
    isSetup = true;

    for (i = 0; i < colCount; i++) {
      var cloneAfter = origCols[i].cloneNode(true);
      cloneAfter.classList.add('fc-pil-clone');
      cloneAfter.setAttribute('aria-hidden', 'true');
      container.appendChild(cloneAfter);
    }
    for (i = 0; i < colCount; i++) {
      var cloneBefore = origCols[i].cloneNode(true);
      cloneBefore.classList.add('fc-pil-clone');
      cloneBefore.setAttribute('aria-hidden', 'true');
      container.insertBefore(cloneBefore, container.children[i]);
    }

    colWidth = getColWidth();
    totalOrigWidth = colWidth * colCount;
    offset = -totalOrigWidth;
    applyTransform(false);

    container.addEventListener('touchstart', onTouchStart, {passive: true});
    container.addEventListener('touchmove', onTouchMove, {passive: false});
    container.addEventListener('touchend', onTouchEnd);
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  function teardown() {
    isSetup = false;
    container.removeEventListener('touchstart', onTouchStart);
    container.removeEventListener('touchmove', onTouchMove);
    container.removeEventListener('touchend', onTouchEnd);
    container.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    var clones = container.querySelectorAll('.fc-pil-clone');
    for (i = 0; i < clones.length; i++) {
      clones[i].parentNode.removeChild(clones[i]);
    }
    container.style.transform = '';
    container.style.transition = '';
    container.classList.remove('fc-pil-dragging');
  }

  /* Touch */
  function onTouchStart(e) {
    dragging = true;
    startX = e.touches[0].clientX;
    startOffset = offset;
    container.style.transition = 'none';
  }
  function onTouchMove(e) {
    if (!dragging) return;
    var dx = e.touches[0].clientX - startX;
    offset = startOffset + dx;
    applyTransform(false);
    if (Math.abs(dx) > 5) e.preventDefault();
  }
  function onTouchEnd() {
    if (!dragging) return;
    dragging = false;
    snapToNearest();
  }

  /* Mouse */
  function onMouseDown(e) {
    dragging = true;
    startX = e.clientX;
    startOffset = offset;
    container.style.transition = 'none';
    container.classList.add('fc-pil-dragging');
    e.preventDefault();
  }
  function onMouseMove(e) {
    if (!dragging) return;
    var dx = e.clientX - startX;
    offset = startOffset + dx;
    applyTransform(false);
  }
  function onMouseUp() {
    if (!dragging) return;
    dragging = false;
    container.classList.remove('fc-pil-dragging');
    snapToNearest();
  }

  setupCarousel();
  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      if (window.innerWidth > MOBILE_BP && isSetup) {
        teardown();
      } else if (window.innerWidth <= MOBILE_BP && !isSetup) {
        setupCarousel();
      } else if (isSetup) {
        colWidth = getColWidth();
        totalOrigWidth = colWidth * colCount;
        offset = -totalOrigWidth;
        applyTransform(false);
      }
    }, 150);
  });
})();
