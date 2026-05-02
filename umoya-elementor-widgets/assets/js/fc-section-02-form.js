(function(){
  'use strict';

  /* ── Scroll reveal ──────────────────────────────────────── */
  var rvEls = document.querySelectorAll('#fc-form-section .fc-f2-rv');
  if('IntersectionObserver' in window){
    var obs = new IntersectionObserver(function(e){
      e.forEach(function(x){
        if(x.isIntersecting){
          x.target.classList.add('fc-f2-on');
          x.target.style.willChange = 'auto';
          obs.unobserve(x.target);
        }
      });
    },{threshold:.06});
    rvEls.forEach(function(el){ obs.observe(el); });
  } else {
    rvEls.forEach(function(el){ el.classList.add('fc-f2-on'); });
  }

  /* ── Form validation + AJAX submission ──────────────────── */
  var form = document.getElementById('fc2Form');
  var btn  = document.getElementById('fc2Btn');
  if(!form || !btn) return;

  var submitting   = false;
  var originalText = btn.textContent;

  function isValidEmail(v){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();

    /* Rate limit: block double-clicks and spam */
    if(submitting) return;

    /* Client-side validation */
    var reqs  = form.querySelectorAll('[required]');
    var valid = true;

    reqs.forEach(function(f){
      if(!f.value.trim()){
        valid = false;
        f.style.borderColor = '#D97E53';
        f.style.boxShadow   = '0 0 0 3px rgba(217,126,83,.12)';
      } else {
        f.style.borderColor = '';
        f.style.boxShadow   = '';
      }
    });

    /* Email-specific validation */
    var emailField = form.querySelector('[name="MERGE0"], [type="email"]');
    if(emailField && emailField.value && !isValidEmail(emailField.value)){
      valid = false;
      emailField.style.borderColor = '#D97E53';
      emailField.style.boxShadow   = '0 0 0 3px rgba(217,126,83,.12)';
    }

    if(!valid){
      var first = Array.prototype.find.call(reqs, function(f){ return !f.value.trim(); });
      if(first) first.focus();
      return;
    }

    /* Lock UI */
    submitting      = true;
    btn.disabled    = true;
    btn.textContent = 'Sending\u2026';
    btn.style.opacity = '0.7';

    /*
     * ★ MAILCHIMP AJAX SUBMISSION
     * When you have your Mailchimp action URL, uncomment Option A
     * below and replace YOUR_MAILCHIMP_POST_JSON_URL with your URL.
     * Change "/post?" to "/post-json?" and add "&c=mailchimpCallback"
     * for JSONP. Then remove the Option B placeholder block.
     */

    /* Collect form data */
    var data = new FormData(form);
    var params = [];
    data.forEach(function(val, key){
      params.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
    });

    /* ── Option A: Mailchimp JSONP (uncomment when ready) ─── */
    /*
    var mcURL = 'YOUR_MAILCHIMP_POST_JSON_URL';
    var script = document.createElement('script');
    script.src = mcURL + '&' + params.join('&') + '&c=mailchimpCallback';
    document.body.appendChild(script);
    window.mailchimpCallback = function(resp){
      if(resp.result === 'success'){
        showSuccess();
      } else {
        showError(resp.msg || 'Something went wrong. Please try again.');
      }
      if(script.parentNode) document.body.removeChild(script);
    };
    */

    /* ── Option B: Placeholder success (remove when Mailchimp is live) */
    setTimeout(function(){ showSuccess(); }, 800);
  });

  function showSuccess(){
    btn.textContent       = 'Inquiry Received \u2014 We\u2019ll Be in Touch Soon';
    btn.disabled          = true;
    btn.style.background  = '#708238';
    btn.style.borderColor = '#708238';
    btn.style.opacity     = '1';
  }

  function showError(msg){
    btn.textContent   = originalText;
    btn.disabled      = false;
    btn.style.opacity = '1';
    submitting = false;

    /* Show error below button */
    var existing = form.querySelector('.fc-f2-error');
    if(existing) existing.remove();
    var err = document.createElement('p');
    err.className   = 'fc-f2-error';
    err.style.cssText = 'color:#D97E53;font-size:0.85rem;text-align:center;margin-top:10px;';
    err.textContent = msg;
    btn.parentNode.appendChild(err);
    setTimeout(function(){ if(err.parentNode) err.remove(); }, 8000);
  }

  /* Clear validation styling on input */
  form.querySelectorAll('input, select, textarea').forEach(function(f){
    f.addEventListener('input', function(){
      f.style.borderColor = '';
      f.style.boxShadow   = '';
    });
  });

}());
