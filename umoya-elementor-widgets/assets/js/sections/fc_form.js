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

  var submitting   = false;
  var originalText = btn ? btn.textContent : '';
  var pendingBackupKey = 'umoyaPendingFormBackups';
  var pendingBackupMaxAge = 24 * 60 * 60 * 1000;

  /*
   * HubSpot setup:
   * 1. Paste the HubSpot Portal ID into data-hubspot-portal-id on the form.
   * 2. Paste the HubSpot Form GUID into data-hubspot-form-id on the form.
   * 3. Make sure each mapped property exists on the HubSpot form.
   */
  var hubspotFieldMap = {
    MERGE1: 'salutation',
    FNAME: 'firstname',
    LNAME: 'lastname',
    EMAIL: 'email',
    PHONE: 'phone',
    MERGE2: 'country',
    MERGE3: 'city',
    MERGE4: 'preferred_travel_season',
    MERGE5: 'preferred_travel_year',
    MERGE6: 'preferred_journey_length',
    MERGE7: 'founders_circle_message'
  };

  function isValidEmail(v){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function getFieldValue(fieldName) {
    var field = form.elements[fieldName];
    if (!field) return '';
    return String(field.value || '').trim();
  }

  function getCookie(name) {
    var parts = document.cookie ? document.cookie.split('; ') : [];
    for (var i = 0; i < parts.length; i += 1) {
      var item = parts[i].split('=');
      if (item[0] === name) return decodeURIComponent(item.slice(1).join('='));
    }
    return '';
  }

  function setHiddenValue(fieldName, value) {
    var field = form && form.elements ? form.elements[fieldName] : null;
    if (field) field.value = value || '';
  }

  function syncTrackingFields() {
    if (!form) return;
    setHiddenValue('hutk', getCookie('hubspotutk'));
    setHiddenValue('pageUri', window.location.href);
    setHiddenValue('pageName', document.title || 'Umoya Founder\'s Circle');
  }

  function identifyHubSpotVisitor() {
    var email = getFieldValue('EMAIL');
    if (!email || !isValidEmail(email)) return;
    window._hsq = window._hsq || [];
    window._hsq.push(['identify', { email: email }]);
    window._hsq.push(['trackPageView']);
  }

  function buildHubSpotPayload() {
    syncTrackingFields();
    var fields = [];

    Object.keys(hubspotFieldMap).forEach(function(fieldName) {
      var value = getFieldValue(fieldName);
      if (value) {
        fields.push({
          name: hubspotFieldMap[fieldName],
          value: value
        });
      }
    });

    var context = {
      pageUri: window.location.href,
      pageName: document.title || 'Umoya Founder\'s Circle'
    };
    var hutk = getCookie('hubspotutk');
    if (hutk) context.hutk = hutk;

    var payload = {
      fields: fields,
      context: context
    };

    var consentText = (form.getAttribute('data-hubspot-consent-text') || '').trim();
    if (consentText) {
      payload.legalConsentOptions = {
        consent: {
          consentToProcess: true,
          text: consentText
        }
      };
    }

    return payload;
  }

  function submitToHubSpot() {
    var portalId = (form.getAttribute('data-hubspot-portal-id') || '').trim();
    var formId = (form.getAttribute('data-hubspot-form-id') || '').trim();

    if (!portalId || !formId) {
      return Promise.reject(new Error('HubSpot is not configured yet. Add the Portal ID and Form ID to this form.'));
    }

    return fetch('https://api.hsforms.com/submissions/v3/integration/submit/' + encodeURIComponent(portalId) + '/' + encodeURIComponent(formId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(buildHubSpotPayload())
    }).then(function(response) {
      return response.text().then(function(text) {
        var data = null;
        if (text) {
          try { data = JSON.parse(text); } catch (ignore) {}
        }

        if (!response.ok) {
          var message = data && (data.message || data.error) ? (data.message || data.error) : 'HubSpot could not receive the submission. Please try again.';
          throw new Error(message);
        }

        return data;
      });
    });
  }

  function buildWordPressBackupPayload() {
    var hubspotPayload = buildHubSpotPayload();
    var rawFields = {};

    Object.keys(hubspotFieldMap).forEach(function(fieldName) {
      rawFields[fieldName] = getFieldValue(fieldName);
    });

    return {
      submissionId: createSubmissionId(),
      source: (form.getAttribute('data-umoya-form-source') || 'founders_circle_page').trim(),
      hubspotPortalId: (form.getAttribute('data-hubspot-portal-id') || '').trim(),
      hubspotFormId: (form.getAttribute('data-hubspot-form-id') || '').trim(),
      consentText: (form.getAttribute('data-hubspot-consent-text') || '').trim(),
      hutk: getCookie('hubspotutk'),
      pageUri: window.location.href,
      pageName: document.title || 'Umoya Founder\'s Circle',
      rawFields: rawFields,
      fields: hubspotPayload.fields,
      context: hubspotPayload.context
    };
  }

  function createSubmissionId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }

    return 'umoya-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }

  function getPendingBackups() {
    try {
      return JSON.parse(window.localStorage.getItem(pendingBackupKey) || '[]').filter(function(item) {
        return item && (!item.queuedAt || Date.now() - item.queuedAt < pendingBackupMaxAge);
      });
    } catch (ignore) {
      return [];
    }
  }

  function savePendingBackups(items) {
    try {
      window.localStorage.setItem(pendingBackupKey, JSON.stringify(items.slice(-8)));
    } catch (ignore) {}
  }

  function queuePendingBackup(payload) {
    payload.hubspotAlreadySent = true;
    payload.queuedAt = Date.now();
    var items = getPendingBackups();
    items.push(payload);
    savePendingBackups(items);
  }

  function flushPendingBackups() {
    var items = getPendingBackups();
    if (!items.length) return;

    var endpoint = (form.getAttribute('data-wordpress-backup-endpoint') || '/wp-json/umoya/v1/submissions').trim();
    var remaining = items.slice();

    items.forEach(function(item) {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(item)
      }).then(function(response) {
        if (!response.ok) return;
        remaining = remaining.filter(function(entry) {
          return entry.submissionId !== item.submissionId;
        });
        savePendingBackups(remaining);
      }).catch(function() {});
    });
  }

  function submitToWordPressBackup(payload) {
    var endpoint = (form.getAttribute('data-wordpress-backup-endpoint') || '/wp-json/umoya/v1/submissions').trim();

    return fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    }).then(function(response) {
      return response.text().then(function(text) {
        var data = null;
        if (text) {
          try { data = JSON.parse(text); } catch (ignore) {}
        }

        if (!response.ok || !data || data.saved !== true) {
          var message = data && data.message ? data.message : 'WordPress could not save the submission. Please try again.';
          throw new Error(message);
        }

        return data;
      });
    });
  }

  if (form) window.setTimeout(flushPendingBackups, 1200);
  if (form) {
    syncTrackingFields();
    window.setTimeout(syncTrackingFields, 1500);
  }

  function handleFounderCircleSubmit(e, submittedForm) {
    form = submittedForm || form;
    btn = form ? (form.querySelector('#fc2Btn, .fc-f2-sub-btn') || btn) : btn;
    if (!form || !btn) return;
    syncTrackingFields();
    identifyHubSpotVisitor();
    if (!btn.getAttribute('data-umoya-original-text')) {
      btn.setAttribute('data-umoya-original-text', btn.textContent);
    }
    originalText = btn.getAttribute('data-umoya-original-text');

    e.preventDefault();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();

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
    var emailField = form.querySelector('[name="EMAIL"], [type="email"]');
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

    var backupPayload = buildWordPressBackupPayload();

    /* Save to WordPress first; the WordPress endpoint forwards the submission to HubSpot. */
    submitToWordPressBackup(backupPayload)
      .then(function(){ showSuccess(); })
      .catch(function(error){
        submitToHubSpot()
          .then(function(){
            queuePendingBackup(backupPayload);
            showSuccess();
          })
          .catch(function(fallbackError){
            showError((error.message || 'WordPress could not save the submission.') + ' ' + (fallbackError.message || 'HubSpot fallback also failed.'));
          });
      });
  }

  document.addEventListener('submit', function(e) {
    var submittedForm = e.target;
    if (!submittedForm || !submittedForm.matches || !submittedForm.matches('#fc2Form, .fc-f2-form')) return;
    handleFounderCircleSubmit(e, submittedForm);
  }, true);

  if (form) {
    form.addEventListener('submit', function(e){
      handleFounderCircleSubmit(e, form);
    });
  }

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
  if (form) {
    form.querySelectorAll('input, select, textarea').forEach(function(f){
      f.addEventListener('input', function(){
        f.style.borderColor = '';
        f.style.boxShadow   = '';
      });
    });
  }

}());
