(function () {
  'use strict';

  /* ── Scroll reveal ─────────────────────────── */
  var revEls = document.querySelectorAll('.fc-bf-reveal');
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('fc-bf-in'); e.target.style.willChange = 'auto'; obs.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    revEls.forEach(function (el) { obs.observe(el); });
  } else {
    revEls.forEach(function (el) { el.classList.add('fc-bf-in'); });
  }

  /* ── Slideshow ─────────────────────────────── */
  var slides = document.querySelectorAll('.fc-ss-slide');
  var dots   = document.querySelectorAll('.fc-ss-dot');
  var prev   = document.getElementById('fc3Prev');
  var next   = document.getElementById('fc3Next');
  var cur    = 0;
  var timer  = null;

  function goTo(n) {
    slides[cur].classList.remove('fc-ss-on');
    dots[cur].classList.remove('fc-ss-on');
    dots[cur].setAttribute('aria-selected', 'false');
    cur = (n + slides.length) % slides.length;
    slides[cur].classList.add('fc-ss-on');
    dots[cur].classList.add('fc-ss-on');
    dots[cur].setAttribute('aria-selected', 'true');
  }

  function startAuto() { timer = setInterval(function () { goTo(cur + 1); }, 5500); }
  function stopAuto()  { clearInterval(timer); }

  if (prev) prev.addEventListener('click', function () { stopAuto(); goTo(cur - 1); startAuto(); });
  if (next) next.addEventListener('click', function () { stopAuto(); goTo(cur + 1); startAuto(); });

  dots.forEach(function (d) {
    d.addEventListener('click', function () {
      stopAuto();
      goTo(parseInt(d.getAttribute('data-fci'), 10));
      startAuto();
    });
  });

  startAuto();
}());
