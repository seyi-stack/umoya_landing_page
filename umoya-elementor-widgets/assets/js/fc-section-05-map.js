/**
 * Umoya Founder's Circle — Leaflet Map (ES5)
 *
 * Dynamically injects Leaflet CSS+JS, builds the route map
 * with 4 province stops, curved route lines, and arrowheads.
 * Map height syncs with the right content column on desktop.
 *
 * Province stop coordinates are read from data-fc-stops on
 * #fcLeafletMap if present, otherwise defaults are used.
 */
(function () {
  'use strict';

  var LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  var LEAFLET_JS  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

  function injectCSS(href) {
    if (document.querySelector('link[href*="leaflet"]')) return;
    var link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function injectJS(src, cb) {
    if (typeof L !== 'undefined') { cb(); return; }
    if (document.querySelector('script[src*="leaflet"]')) {
      var wait = setInterval(function () {
        if (typeof L !== 'undefined') { clearInterval(wait); cb(); }
      }, 50);
      return;
    }
    var script    = document.createElement('script');
    script.src    = src;
    script.async  = true;
    script.onload = cb;
    script.onerror = function () {
      var fb = document.createElement('script');
      fb.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      fb.async  = true;
      fb.onload = cb;
      document.head.appendChild(fb);
    };
    document.head.appendChild(script);
  }

  function syncMapHeight() {
    if (window.innerWidth <= 768) return;
    var copy   = document.getElementById('fcJiCopy');
    var mapCol = document.getElementById('fcMapCol');
    var mapEl  = document.getElementById('fcLeafletMap');
    if (!copy || !mapCol || !mapEl) return;

    var h = Math.max(copy.offsetHeight, 380);
    mapCol.style.height = h + 'px';
    mapEl.style.height  = h + 'px';
  }

  var fcMap = null;

  function buildMap() {
    var mapEl   = document.getElementById('fcLeafletMap');
    var loading = document.getElementById('fcMapLoading');
    if (!mapEl || typeof L === 'undefined') return;

    syncMapHeight();

    var isMobile = window.innerWidth <= 768;
    var isSmall  = window.innerWidth <= 420;
    var fallbackH = isSmall ? 200 : isMobile ? 240 : 460;

    if (mapEl.offsetHeight === 0) {
      mapEl.style.height = fallbackH + 'px';
      var col = document.getElementById('fcMapCol');
      if (col) col.style.height = fallbackH + 'px';
    }

    var stops = [
      { num: 1, lat: -25.8,  lng: 28.2,  label: 'Gauteng & Limpopo' },
      { num: 2, lat: -25.0,  lng: 31.5,  label: 'Mpumalanga'        },
      { num: 3, lat: -29.85, lng: 31.05, label: 'KwaZulu-Natal'     },
      { num: 4, lat: -33.92, lng: 18.42, label: 'Western Cape'      }
    ];

    fcMap = L.map('fcLeafletMap', {
      center: [-29.0, 25.5],
      zoom: 5,
      zoomControl: true,
      scrollWheelZoom: false,
      tap: true,
      touchZoom: true,
      dragging: true,
      attributionControl: false
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { attribution: '', subdomains: 'abcd', maxZoom: 18 }
    ).addTo(fcMap);

    fcMap.once('load', function () {
      if (loading) loading.classList.add('fc-map-ready');
    });
    fcMap.once('tileload', function () {
      if (loading) loading.classList.add('fc-map-ready');
    });
    setTimeout(function () { if (loading) loading.classList.add('fc-map-ready'); }, 3000);

    /* Quadratic bezier curve */
    function qBez(p1, p2, bend, n) {
      n = n || 64;
      var mx = (p1[0]+p2[0])/2, my = (p1[1]+p2[1])/2;
      var dx = p2[0]-p1[0],     dy = p2[1]-p1[1];
      var cpx = mx - dy*bend,   cpy = my + dx*bend;
      var pts = [];
      for (var i = 0; i <= n; i++) {
        var t = i/n, u = 1-t;
        pts.push([
          u*u*p1[0] + 2*u*t*cpx + t*t*p2[0],
          u*u*p1[1] + 2*u*t*cpy + t*t*p2[1]
        ]);
      }
      return pts;
    }

    function brng(p1, p2) {
      return Math.atan2(p2[1]-p1[1], p2[0]-p1[0]) * 180 / Math.PI;
    }

    var segs = [
      { a: [stops[0].lat, stops[0].lng], b: [stops[1].lat, stops[1].lng], bend:  0.20 },
      { a: [stops[1].lat, stops[1].lng], b: [stops[2].lat, stops[2].lng], bend: -0.18 },
      { a: [stops[2].lat, stops[2].lng], b: [stops[3].lat, stops[3].lng], bend:  0.22 }
    ];

    var lineStyle = {
      color: '#2c1c0e', weight: 1.8, opacity: 0.72,
      dashArray: '7 5', lineCap: 'round'
    };

    segs.forEach(function (seg) {
      var pts = qBez(seg.a, seg.b, seg.bend);
      L.polyline(pts, lineStyle).addTo(fcMap);

      var idx = Math.floor(pts.length * 0.80);
      var p1  = pts[idx];
      var p2  = pts[Math.min(idx+2, pts.length-1)];
      var ang = brng(p1, p2);

      var arrIcon = L.divIcon({
        html: '<svg width="10" height="10" viewBox="0 0 10 10" ' +
              'style="display:block;transform:rotate(' + ang + 'deg);transform-origin:5px 5px;">' +
              '<polygon points="5,0 10,10 0,10" fill="#2c1c0e" opacity="0.75"/></svg>',
        iconSize: [10, 10], iconAnchor: [5, 5], className: ''
      });
      L.marker(p1, { icon: arrIcon, interactive: false }).addTo(fcMap);
    });

    stops.forEach(function (s) {
      var icon = L.divIcon({
        html: '<div class="fc-lm-wrap">' +
                '<div class="fc-lm-dot">' + s.num + '</div>' +
                '<span class="fc-lm-label">' + s.label + '</span>' +
              '</div>',
        iconSize: [28, 28], iconAnchor: [14, 14], className: ''
      });
      L.marker([s.lat, s.lng], {
        icon: icon, title: s.label, interactive: false
      }).addTo(fcMap);
    });

    var bounds = stops.map(function (s) { return [s.lat, s.lng]; });
    var padPx  = window.innerWidth <= 420 ? 30 : window.innerWidth <= 768 ? 44 : 56;
    fcMap.fitBounds(bounds, { padding: [padPx, padPx] });
  }

  function init() {
    syncMapHeight();
    injectCSS(LEAFLET_CSS);
    injectJS(LEAFLET_JS, function () {
      setTimeout(function () {
        syncMapHeight();
        buildMap();
      }, 80);
    });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        syncMapHeight();
        if (fcMap) {
          fcMap.invalidateSize();
          var stops2 = [
            [-25.8, 28.2], [-25.0, 31.5],
            [-29.85, 31.05], [-33.92, 18.42]
          ];
          var pad2 = window.innerWidth <= 420 ? 30 : window.innerWidth <= 768 ? 44 : 56;
          fcMap.fitBounds(stops2, { padding: [pad2, pad2] });
        }
      }, 200);
    }, { passive: true });

    window.addEventListener('orientationchange', function () {
      setTimeout(function () {
        syncMapHeight();
        if (fcMap) fcMap.invalidateSize();
      }, 400);
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  var section = document.getElementById('fc-journey');
  if (section && 'IntersectionObserver' in window && !fcMap) {
    var sectObs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        if (!fcMap) { syncMapHeight(); buildMap(); }
        sectObs.unobserve(section);
      }
    }, { threshold: 0.05 });
    sectObs.observe(section);
  }
}());
