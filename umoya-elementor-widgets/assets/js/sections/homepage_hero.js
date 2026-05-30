(function(){
    'use strict';
    var vid = document.getElementById('umoya-hero-vid');
    if(!vid) return;

    var retryTimer = null;
    var playAttempts = 0;
    var maxAutoplayAttempts = 12;

    function primeVideo(){
      vid.muted = true;
      vid.defaultMuted = true;
      vid.volume = 0;
      vid.autoplay = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.setAttribute('muted', '');
      vid.setAttribute('autoplay', '');
      vid.setAttribute('loop', '');
      vid.setAttribute('playsinline', '');
      vid.setAttribute('webkit-playsinline', '');
      vid.preload = 'auto';
    }

    function revealVid(){
      vid.style.opacity = '1';
    }

    function scheduleRetry(delay){
      if(playAttempts >= maxAutoplayAttempts) return;
      if(retryTimer) window.clearTimeout(retryTimer);
      retryTimer = window.setTimeout(playVid, delay);
    }

    function playVid(){
      primeVideo();
      if(!vid.paused && !vid.ended){
        revealVid();
        return;
      }
      if(vid.readyState === 0){
        try { vid.load(); } catch(e) {}
      }
      playAttempts += 1;
      var p = vid.play();
      if(p && typeof p.then === 'function'){
        p.then(function(){
          playAttempts = 0;
          revealVid();
        }).catch(function(){
          scheduleRetry(playAttempts < 4 ? 450 : 1200);
        });
      } else {
        revealVid();
      }
    }

    primeVideo();
    vid.addEventListener('playing', revealVid);
    vid.addEventListener('canplay', playVid);
    vid.addEventListener('loadedmetadata', playVid);
    vid.addEventListener('loadeddata', function(){
      if(!vid.paused) revealVid();
      playVid();
    });

    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', function(){ setTimeout(playVid, 150); });
    } else {
      setTimeout(playVid, 150);
    }
    window.addEventListener('pageshow', function(){ setTimeout(playVid, 100); });
    window.addEventListener('focus', function(){ setTimeout(playVid, 100); });
    window.addEventListener('load', function(){ setTimeout(playVid, 900); });
    window.addEventListener('scroll', function(){ playVid(); }, { once: true, passive: true });
    document.addEventListener('visibilitychange', function(){
      if(!document.hidden) playVid();
    });
    ['touchstart', 'pointerdown', 'click'].forEach(function(evt){
      document.addEventListener(evt, playVid, { once: true, passive: true });
    });
  }());
