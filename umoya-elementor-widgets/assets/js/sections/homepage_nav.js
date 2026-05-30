(function(){
    'use strict';

    var bar = document.getElementById('umoyaHomepageNav');
    if (!bar || bar.dataset.ready === 'true') return;
    bar.dataset.ready = 'true';

    var burger = bar.querySelector('.umoya-nav-burger');
    var dropdown = bar.querySelector('.umoya-nav-dropdown');
    var sections = ['umoya-hero', 'umoya-about', 'umoya-journey-anchor', 'fc-pillars', 'fc-details'];
    var ticking = false;

    function openMenu() {
      bar.classList.add('is-open');
      dropdown.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Close navigation menu');
    }

    function closeMenu() {
      bar.classList.remove('is-open');
      dropdown.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Open navigation menu');
    }

    function setActive(activeId) {
      sections.forEach(function(id) {
        bar.querySelectorAll('[data-section="' + id + '"]').forEach(function(item) {
          item.classList.toggle('is-active', id === activeId);
        });
      });
    }

    function updateActive() {
      ticking = false;
      var navHeight = bar.offsetHeight || 64;
      var activeId = sections[0];

      sections.forEach(function(id) {
        var section = document.getElementById(id);
        if (!section) return;
        var top = section.getBoundingClientRect().top + window.pageYOffset - navHeight - 80;
        if (window.pageYOffset >= top) activeId = id;
      });

      setActive(activeId);
    }

    function requestActiveUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateActive);
    }

    function getScrollTop() {
      return window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
    }

    function scrollToTarget(targetId, attempt) {
      var target = document.getElementById(targetId);
      attempt = attempt || 0;

      if (!target) {
        if (attempt < 12) {
          window.setTimeout(function() {
            scrollToTarget(targetId, attempt + 1);
          }, 80);
          return;
        }

        window.location.hash = targetId;
        return;
      }

      var navHeight = bar.offsetHeight || 64;
      var top = targetId === 'umoya-hero' ? 0 : Math.max(0, target.getBoundingClientRect().top + getScrollTop() - navHeight);

      if (window.history && window.history.pushState) {
        window.history.pushState(null, '', '#' + targetId);
      }

      if ('scrollBehavior' in document.documentElement.style) {
        window.scrollTo({ top: top, behavior: 'smooth' });
      } else {
        window.scrollTo(0, top);
      }

      window.setTimeout(requestActiveUpdate, 420);
    }

    burger.addEventListener('click', function() {
      bar.classList.contains('is-open') ? closeMenu() : openMenu();
    });

    bar.addEventListener('click', function(event) {
      var link = event.target.closest && event.target.closest('a[href^="#"]');
      if (!link || !bar.contains(link)) return;

      var targetId = link.getAttribute('href').slice(1);
      if (!targetId) return;

      event.preventDefault();
      event.stopPropagation();
      closeMenu();
      scrollToTarget(targetId, 0);
    }, true);

    bar.querySelectorAll('[data-umoya-form-popup]').forEach(function(trigger) {
      trigger.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', function(event) {
      if (!bar.contains(event.target)) closeMenu();
    });

    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') closeMenu();
    });

    window.addEventListener('scroll', requestActiveUpdate, { passive: true });
    window.addEventListener('resize', requestActiveUpdate);
    updateActive();
  }());
