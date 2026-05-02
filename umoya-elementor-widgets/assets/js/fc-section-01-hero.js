(function(){
    'use strict';
    var vid = document.getElementById('fc-hero-vid');
    if(!vid) return;
    /* Wait 2s after page load, then start loading the video */
    function loadVid(){
      vid.preload = 'auto';
      vid.load();
      var p = vid.play();
      if(p && typeof p.then === 'function'){
        p.then(function(){ vid.style.opacity = '1'; })
         .catch(function(){ /* autoplay blocked — poster stays visible */ });
      } else {
        vid.style.opacity = '1';
      }
    }
    if(document.readyState === 'complete'){
      setTimeout(loadVid, 2000);
    } else {
      window.addEventListener('load', function(){ setTimeout(loadVid, 2000); });
    }
  }());
