(function(){
    'use strict';

    var bar      = document.getElementById('fcNavBar');
    var burger   = document.getElementById('fcNavBurger');
    var dropdown = document.getElementById('fcNavDropdown');

    if(!bar) return;

    /* ── HAMBURGER TOGGLE ───────────────────────────────────── */
    function open(){
      bar.classList.add('fc-open');
      dropdown.classList.add('fc-mob-open');
      burger.setAttribute('aria-expanded','true');
      burger.setAttribute('aria-label','Close navigation menu');
    }

    function close(){
      bar.classList.remove('fc-open');
      dropdown.classList.remove('fc-mob-open');
      burger.setAttribute('aria-expanded','false');
      burger.setAttribute('aria-label','Open navigation menu');
    }

    if(burger){
      burger.addEventListener('click', function(){
        bar.classList.contains('fc-open') ? close() : open();
      });
      burger.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); burger.click(); }
      });
    }

    /* Close on any dropdown link or CTA tap */
    if(dropdown){
      dropdown.querySelectorAll('a').forEach(function(a){
        a.addEventListener('click', function(){ close(); });
      });
    }

    /* Close when clicking outside the bar */
    document.addEventListener('click', function(e){
      if(!bar.contains(e.target)) close();
    });

    /* ── ACTIVE SECTION TRACKING ────────────────────────────── */
    var ids = [
      'fc-intro',
      'fc-form-section',
      'fc-benefits',
      'fc-journey',
      'fc-why',
      'fc-details'
    ];

    function setActive(activeId){
      ids.forEach(function(id){
        /* desktop items */
        var desktopItem = bar.querySelector('.fc-nav-item[data-s="' + id + '"]');
        if(desktopItem) desktopItem.classList.toggle('fc-active', id === activeId);
        /* mobile dropdown items */
        var mobileItem = bar.querySelector('.fc-nav-dropdown-item[data-s="' + id + '"]');
        if(mobileItem) mobileItem.classList.toggle('fc-active', id === activeId);
      });
    }

    if('IntersectionObserver' in window){
      var obs = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting) setActive(entry.target.id);
        });
      },{
        rootMargin: '-64px 0px -50% 0px',
        threshold: 0
      });
      ids.forEach(function(id){
        var el = document.getElementById(id);
        if(el) obs.observe(el);
      });
    }

    /* ── SMOOTH SCROLL ──────────────────────────────────────── */
    var navH = bar.offsetHeight || 64;

    /* Logo — always scrolls to the very top of the page */
    var logoLink = bar.querySelector('.fc-nav-logo');
    if(logoLink){
      logoLink.addEventListener('click', function(e){
        e.preventDefault();
        'scrollBehavior' in document.documentElement.style
          ? window.scrollTo({top: 0, behavior: 'smooth'})
          : window.scrollTo(0, 0);
      });
    }

    /* All other hash links — offset by nav height */
    bar.querySelectorAll('a[href^="#"]').forEach(function(a){
      if(a.classList.contains('fc-nav-logo')) return; /* skip logo */
      a.addEventListener('click', function(e){
        var target = document.getElementById(a.getAttribute('href').slice(1));
        if(!target) return;
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.pageYOffset - navH;
        'scrollBehavior' in document.documentElement.style
          ? window.scrollTo({top: top, behavior: 'smooth'})
          : window.scrollTo(0, top);
      });
    });

  }());
