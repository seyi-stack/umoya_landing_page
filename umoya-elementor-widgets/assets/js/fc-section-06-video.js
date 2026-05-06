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
    var section = document.getElementById('fc-why');
    var trigger = section ? section.querySelector('.fc-vid-ph') : null;
    var modal = section ? section.querySelector('.fc-video-modal') : null;
    var player = section ? section.querySelector('.fc-video-player') : null;
    var closeEls = section ? section.querySelectorAll('[data-fc-video-close]') : [];
    var closeBtn = section ? section.querySelector('.fc-video-close') : null;
    var lastFocus = null;
    var closeTimer = null;

    function closeVideoModal() {
      if (!modal || !player) return;
      if (closeTimer) {
        window.clearTimeout(closeTimer);
      }
      player.pause();
      try { player.currentTime = 0; } catch (err) {}
      modal.classList.remove('fc-video-open');
      document.removeEventListener('keydown', onVideoKeydown);
      closeTimer = window.setTimeout(function () {
        if (!modal.classList.contains('fc-video-open')) {
          modal.hidden = true;
          if (lastFocus && typeof lastFocus.focus === 'function') {
            lastFocus.focus();
          }
          lastFocus = null;
        }
      }, 430);
    }

    function onVideoKeydown(e) {
      if (e.key === 'Escape') {
        closeVideoModal();
      }
    }

    function openVideoModal() {
      if (!modal || !player) return;
      if (closeTimer) {
        window.clearTimeout(closeTimer);
      }
      lastFocus = document.activeElement;
      modal.hidden = false;
      modal.offsetHeight;
      modal.classList.add('fc-video-open');
      document.addEventListener('keydown', onVideoKeydown);
      if (closeBtn) closeBtn.focus();
      var p = player.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () {});
      }
    }

    if (trigger && modal && player) {
      trigger.addEventListener('click', openVideoModal);
      modal.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      for (var c = 0; c < closeEls.length; c++) {
        closeEls[c].addEventListener('click', closeVideoModal);
      }
    }
  }());
