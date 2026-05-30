(function(){
    'use strict';

    var rvEls = document.querySelectorAll('#fc-journey .fc-jrn-rv');
    if('IntersectionObserver' in window){
      var rvObs = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(e.isIntersecting){ e.target.classList.add('on'); e.target.style.willChange = 'auto'; rvObs.unobserve(e.target); }
        });
      },{threshold:.06});
      rvEls.forEach(function(el){ rvObs.observe(el); });
    } else {
      rvEls.forEach(function(el){ el.classList.add('on'); });
    }

    var ptTabs   = document.querySelectorAll('#fc-journey .fc-pt-tab');
    var ptPanels = document.querySelectorAll('#fc-journey .fc-pt-panel');
    var ptImgs   = document.querySelectorAll('#fc-journey .fc-pt-img');

    function fcActivateTab(idx){
      var i;
      for(i = 0; i < ptTabs.length; i++){
        if(i === idx){
          ptTabs[i].classList.add('fc-pt-active');
          ptTabs[i].setAttribute('aria-selected', 'true');
          ptTabs[i].setAttribute('tabindex', '0');
        } else {
          ptTabs[i].classList.remove('fc-pt-active');
          ptTabs[i].setAttribute('aria-selected', 'false');
          ptTabs[i].setAttribute('tabindex', '-1');
        }
      }
      for(i = 0; i < ptPanels.length; i++){
        if(i === idx) ptPanels[i].classList.add('fc-pt-active');
        else          ptPanels[i].classList.remove('fc-pt-active');
      }
      for(i = 0; i < ptImgs.length; i++){
        if(i === idx) ptImgs[i].classList.add('fc-pt-active');
        else          ptImgs[i].classList.remove('fc-pt-active');
      }
    }

    for(var t = 0; t < ptTabs.length; t++){
      (function(tabEl, idx){
        tabEl.addEventListener('click', function(){ fcActivateTab(idx); });
        tabEl.addEventListener('keydown', function(e){
          var horizontal = window.innerWidth <= 900;
          var prevKey = horizontal ? 'ArrowLeft' : 'ArrowUp';
          var nextKey = horizontal ? 'ArrowRight' : 'ArrowDown';
          var next = idx;
          if(e.key === prevKey){
            e.preventDefault();
            next = (idx - 1 + ptTabs.length) % ptTabs.length;
          } else if(e.key === nextKey){
            e.preventDefault();
            next = (idx + 1) % ptTabs.length;
          } else if(e.key === 'Home'){
            e.preventDefault();
            next = 0;
          } else if(e.key === 'End'){
            e.preventDefault();
            next = ptTabs.length - 1;
          } else {
            return;
          }
          fcActivateTab(next);
          ptTabs[next].focus();
        });
      })(ptTabs[t], t);
    }

    var paItems    = document.querySelectorAll('#fc-journey .fc-pa-item');
    var paTriggers = document.querySelectorAll('#fc-journey .fc-pa-trigger');

    for(var a = 0; a < paTriggers.length; a++){
      (function(triggerEl, idx){
        triggerEl.addEventListener('click', function(){
          var wasActive = paItems[idx].classList.contains('fc-pa-active');
          var i;
          for(i = 0; i < paItems.length; i++){
            paItems[i].classList.remove('fc-pa-active');
            paTriggers[i].setAttribute('aria-expanded', 'false');
          }
          if(!wasActive){
            paItems[idx].classList.add('fc-pa-active');
            paTriggers[idx].setAttribute('aria-expanded', 'true');
          }
        });
      })(paTriggers[a], a);
    }
  }());
