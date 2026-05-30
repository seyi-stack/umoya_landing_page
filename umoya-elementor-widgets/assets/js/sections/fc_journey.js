(function(){
    'use strict';

    /* ── Scroll reveal ─────────────────────────────────────── */
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

    /* ── Dynamic Leaflet loader ────────────────────────────────
     * Injects both the CSS and JS programmatically so they load
     * regardless of how Elementor processes the HTML widget.
     * -----------------------------------------------------------*/
    var LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    var LEAFLET_JS  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

    function injectCSS(href){
      /* Skip if already loaded */
      if(document.querySelector('link[href*="leaflet"]')) return;
      var link = document.createElement('link');
      link.rel  = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }

    function injectJS(src, cb){
      /* Skip if Leaflet is already available */
      if(typeof L !== 'undefined'){ cb(); return; }
      /* Skip if script already injected */
      if(document.querySelector('script[src*="leaflet"]')){
        var wait = setInterval(function(){
          if(typeof L !== 'undefined'){ clearInterval(wait); cb(); }
        }, 50);
        return;
      }
      var script    = document.createElement('script');
      script.src    = src;
      script.async  = true;
      script.onload = cb;
      script.onerror = function(){
        /* Try cdnjs fallback */
        var fb = document.createElement('script');
        fb.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
        fb.async  = true;
        fb.onload = cb;
        document.head.appendChild(fb);
      };
      document.head.appendChild(script);
    }

    var fcMap    = null;  /* desktop map instance */
    var fcMapMob = null;  /* mobile/tablet map instance */
    var stops = [
      { num:1, lat:-26.2,  lng:28.04, label:'Gauteng'       },
      { num:2, lat:-25.0,  lng:31.5,  label:'Mpumalanga'    },
      { num:3, lat:-29.85, lng:30.55, label:'KwaZulu-Natal' },
      { num:4, lat:-33.55, lng:18.42, label:'Western Cape'  }
    ];
    var stopBounds = stops.map(function(s){ return [s.lat, s.lng]; });

      function buildMap(){
        var isDesktop   = window.innerWidth > 900;
        var containerId = isDesktop ? 'fcLeafletMap' : 'fcLeafletMapMob';
        var loadingId   = isDesktop ? 'fcMapLoading' : null;
        if(isDesktop  && fcMap)    return;
        if(!isDesktop && fcMapMob) return;
        var mapEl   = document.getElementById(containerId);
        var loading = loadingId ? document.getElementById(loadingId) : null;
        if(!mapEl || typeof L === 'undefined') return;
        var m = L.map(containerId, {
          center:[-29.0,25.5], zoom:5, zoomControl:true,
          scrollWheelZoom:false, tap:true, touchZoom:true, dragging:true,
          attributionControl:false
        });
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
          {attribution:'',subdomains:'abcd',maxZoom:18}).addTo(m);
        if(loading){
          m.once('tileload',function(){ loading.classList.add('fc-map-ready'); });
          setTimeout(function(){ loading.classList.add('fc-map-ready'); },3000);
        }
        function qBez(p1,p2,bend,n){
          n=n||64;
          var mx=(p1[0]+p2[0])/2,my=(p1[1]+p2[1])/2;
          var dx=p2[0]-p1[0],dy=p2[1]-p1[1];
          var cpx=mx-dy*bend,cpy=my+dx*bend;
          var pts=[];
          for(var i=0;i<=n;i++){
            var t=i/n,u=1-t;
            pts.push([u*u*p1[0]+2*u*t*cpx+t*t*p2[0],u*u*p1[1]+2*u*t*cpy+t*t*p2[1]]);
          }
          return pts;
        }
        function brng(p1,p2){return Math.atan2(p2[1]-p1[1],p2[0]-p1[0])*180/Math.PI;}
        var segs=[
          {a:[stops[0].lat,stops[0].lng],b:[stops[1].lat,stops[1].lng],bend:-0.15},
          {a:[stops[1].lat,stops[1].lng],b:[stops[2].lat,stops[2].lng],bend:-0.18},
          {a:[stops[2].lat,stops[2].lng],b:[stops[3].lat,stops[3].lng],bend: 0.22}
        ];
        var ls={color:'#4B2E2B',weight:1.8,opacity:0.72,dashArray:'7 5',lineCap:'round'};
        segs.forEach(function(seg){
          var pts=qBez(seg.a,seg.b,seg.bend);
          L.polyline(pts,ls).addTo(m);
          var qi=Math.floor(pts.length*0.80);
          var ang=brng(pts[qi],pts[Math.min(qi+2,pts.length-1)]);
          var arrHtml='<svg width="10" height="10" viewBox="0 0 10 10" '+
            'style="display:block;transform:rotate('+ang+'deg);transform-origin:5px 5px;">'+
            '<polygon points="5,0 10,10 0,10" fill="#4B2E2B" opacity="0.75"/></svg>';
          L.marker(pts[qi],{icon:L.divIcon({html:arrHtml,iconSize:[10,10],iconAnchor:[5,5],className:''}),interactive:false}).addTo(m);
        });
        stops.forEach(function(s){
          var mHtml='<div class="fc-lm-wrap"><div class="fc-lm-dot">'+s.num+'</div>'+
            '<span class="fc-lm-label">'+s.label+'</span></div>';
          L.marker([s.lat,s.lng],{icon:L.divIcon({html:mHtml,iconSize:[28,28],iconAnchor:[14,14],className:''}),title:s.label,interactive:false}).addTo(m);
        });
        var padPx=window.innerWidth<=420?30:window.innerWidth<=768?44:56;
        m.fitBounds(stopBounds,{padding:[padPx,padPx]});
        if(isDesktop) fcMap=m; else fcMapMob=m;
      }

    /* ── Province tabs — click to switch active panel ─────────
     * Only one title/content/image triplet visible at a time.
     * Keyboard: Arrow Up/Down (vertical desktop layout) or
     * Arrow Left/Right (horizontal pill strip on ≤900px),
     * Home and End jump to first/last. Roving tabindex.
     * -----------------------------------------------------------*/
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
      /* Refresh map tile layout when the map panel is activated */
      if(idx === 0 && fcMap){ fcMap.invalidateSize(); }
    }

    for(var t = 0; t < ptTabs.length; t++){
      (function(tabEl, idx){
        tabEl.addEventListener('click', function(){
          fcActivateTab(idx);
        });
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

    /* ── Province accordion (mobile/tablet) — FAQ-style reveal ──
     * Click a trigger to expand its image + text. Clicking the
     * already-open item collapses it. Only one open at a time.
     * -----------------------------------------------------------*/
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
            if(idx === 0 && fcMapMob){
              setTimeout(function(){ fcMapMob.invalidateSize(); }, 320);
            }
          }
        });
      })(paTriggers[a], a);
    }

    /* Inject Leaflet CSS and JS then build the map.
     * PERFORMANCE: Only called when Section 05 scrolls into view
     * via IntersectionObserver — never on initial page load.
     * This eliminates Leaflet CDN + CartoDB tile requests for
     * visitors who never scroll to this section. */
    var mapInitialised = false;
    function init(){
      if(mapInitialised) return;
      mapInitialised = true;
      injectCSS(LEAFLET_CSS);
      injectJS(LEAFLET_JS, function(){
        /* Small delay lets layout reflow settle */
        setTimeout(function(){
          buildMap();
        }, 80);
      });

      /* Resize: invalidate + re-fit; init correct map if crossing viewport boundary */
      var resizeTimer;
      window.addEventListener('resize', function(){
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function(){
          var isDesk = window.innerWidth > 900;
          var p2=window.innerWidth<=420?30:window.innerWidth<=768?44:56;
          if(isDesk){
            if(fcMap){ fcMap.invalidateSize(); fcMap.fitBounds(stopBounds,{padding:[p2,p2]}); }
            else { buildMap(); }
          } else {
            if(fcMapMob){ fcMapMob.invalidateSize(); }
            else { buildMap(); }
          }
        }, 200);
      }, { passive: true });

      /* Orientation change */
      window.addEventListener('orientationchange', function(){
        setTimeout(function(){
          if(window.innerWidth > 900){ if(fcMap) fcMap.invalidateSize(); }
          else { if(fcMapMob) fcMapMob.invalidateSize(); }
        }, 400);
      }, { passive: true });
    }

    /* Lazy-load: only init the map when Section 05 scrolls into view.
     * No Leaflet CDN or CartoDB tile requests until user reaches this section. */
    var section = document.getElementById('fc-journey');
    if(section && 'IntersectionObserver' in window){
      var sectObs = new IntersectionObserver(function(entries){
        if(entries[0].isIntersecting){
          init();
          sectObs.unobserve(section);
        }
      }, { threshold: 0.05 });
      sectObs.observe(section);
    } else {
      /* Fallback for browsers without IntersectionObserver */
      init();
    }

  }());
