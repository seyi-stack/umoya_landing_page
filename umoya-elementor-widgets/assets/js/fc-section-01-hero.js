(function(){
    'use strict';
    var vid = document.getElementById('fc-hero-vid');
    if(!vid) return;

    function revealVid(){
      vid.style.opacity = '1';
    }

    function playVid(){
      vid.muted = true;
      vid.defaultMuted = true;
      vid.setAttribute('muted', '');
      vid.setAttribute('autoplay', '');
      vid.setAttribute('playsinline', '');
      vid.setAttribute('webkit-playsinline', '');
      vid.preload = 'auto';
      if(vid.readyState === 0){
        try { vid.load(); } catch(e) {}
      }
      var p = vid.play();
      if(p && typeof p.then === 'function'){
        p.then(revealVid)
         .catch(function(){ /* autoplay blocked - poster stays visible */ });
      } else {
        revealVid();
      }
    }

    vid.addEventListener('playing', revealVid);
    vid.addEventListener('loadeddata', function(){
      if(!vid.paused) revealVid();
    });

    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', function(){ setTimeout(playVid, 150); });
    } else {
      setTimeout(playVid, 150);
    }
    window.addEventListener('load', function(){ setTimeout(playVid, 900); });
    document.addEventListener('visibilitychange', function(){
      if(!document.hidden) playVid();
    });
    ['touchstart', 'pointerdown', 'click'].forEach(function(evt){
      document.addEventListener(evt, playVid, { once: true, passive: true });
    });
  }());
