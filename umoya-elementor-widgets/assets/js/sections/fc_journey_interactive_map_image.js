(function(){
    'use strict';

    var root = document.getElementById('fc-journey');
    if(!root) return;

    var rvEls = root.querySelectorAll('.fc-jrn-rv');

    function fcRevealAll(){
      rvEls.forEach(function(el){
        el.classList.add('on');
        el.style.willChange = 'auto';
      });
    }

    if('IntersectionObserver' in window){
      var rvObs = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(e.isIntersecting){ e.target.classList.add('on'); e.target.style.willChange = 'auto'; rvObs.unobserve(e.target); }
        });
      },{threshold:.06});
      rvEls.forEach(function(el){ rvObs.observe(el); });
    } else {
      fcRevealAll();
    }

    window.setTimeout(fcRevealAll, 900);

    var ptTabs   = root.querySelectorAll('.fc-pt-tab');
    var ptPanels = root.querySelectorAll('.fc-pt-panel');
    var ptImgs   = root.querySelectorAll('.fc-pt-img');

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

    var paItems    = root.querySelectorAll('.fc-pa-item');
    var paTriggers = root.querySelectorAll('.fc-pa-trigger');

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

    var routeMaps = root.querySelectorAll('.fc-route-map-graphic');

    function clamp(n, min, max) {
      return Math.max(min, Math.min(max, n));
    }

    function initRouteMapPanZoom(mapEl) {
      var img = mapEl.querySelector('.fc-route-map-img');
      var zoomControls = mapEl.querySelectorAll('[data-fc-map-zoom]');
      if(!img) return;

      var state = { scale: 1, x: 0, y: 0, dragging: false, lastX: 0, lastY: 0 };
      var minScale = 1;
      var maxScale = 4;

      function bounds() {
        var rect = mapEl.getBoundingClientRect();
        return {
          x: Math.max(0, (rect.width * state.scale - rect.width) / 2),
          y: Math.max(0, (rect.height * state.scale - rect.height) / 2)
        };
      }

      function apply() {
        var b = bounds();
        state.x = clamp(state.x, -b.x, b.x);
        state.y = clamp(state.y, -b.y, b.y);
        img.style.transform = 'translate(' + state.x + 'px, ' + state.y + 'px) scale(' + state.scale + ')';
      }

      function zoomBy(multiplier) {
        var oldScale = state.scale;
        state.scale = clamp(state.scale * multiplier, minScale, maxScale);
        if(state.scale === oldScale) return;
        state.x = state.x * (state.scale / oldScale);
        state.y = state.y * (state.scale / oldScale);
        apply();
      }

      for(var z = 0; z < zoomControls.length; z++) {
        zoomControls[z].addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          zoomBy(this.getAttribute('data-fc-map-zoom') === 'in' ? 1.25 : 0.8);
        });
        zoomControls[z].addEventListener('pointerdown', function(e) {
          e.stopPropagation();
        });
      }

      mapEl.addEventListener('wheel', function(e) {
        e.preventDefault();
        var rect = mapEl.getBoundingClientRect();
        var oldScale = state.scale;
        var delta = e.deltaY < 0 ? 1.12 : 0.88;
        state.scale = clamp(state.scale * delta, minScale, maxScale);
        var cx = e.clientX - rect.left - rect.width / 2;
        var cy = e.clientY - rect.top - rect.height / 2;
        state.x = cx - (cx - state.x) * (state.scale / oldScale);
        state.y = cy - (cy - state.y) * (state.scale / oldScale);
        apply();
      }, { passive: false });

      mapEl.addEventListener('pointerdown', function(e) {
        if(e.button !== 0) return;
        if(e.target.closest && e.target.closest('.fc-route-map-control')) return;
        state.dragging = true;
        state.lastX = e.clientX;
        state.lastY = e.clientY;
        mapEl.classList.add('fc-map-dragging');
        mapEl.setPointerCapture(e.pointerId);
      });

      mapEl.addEventListener('pointermove', function(e) {
        if(!state.dragging) return;
        state.x += e.clientX - state.lastX;
        state.y += e.clientY - state.lastY;
        state.lastX = e.clientX;
        state.lastY = e.clientY;
        apply();
      });

      function endDrag(e) {
        state.dragging = false;
        mapEl.classList.remove('fc-map-dragging');
        if(e && mapEl.hasPointerCapture(e.pointerId)) {
          mapEl.releasePointerCapture(e.pointerId);
        }
      }

      mapEl.addEventListener('pointerup', endDrag);
      mapEl.addEventListener('pointercancel', endDrag);
      mapEl.addEventListener('dblclick', function() {
        state.scale = 1;
        state.x = 0;
        state.y = 0;
        apply();
      });
      window.addEventListener('resize', apply, { passive: true });
      apply();
    }

    for(var m = 0; m < routeMaps.length; m++){
      initRouteMapPanZoom(routeMaps[m]);
    }
  }());
