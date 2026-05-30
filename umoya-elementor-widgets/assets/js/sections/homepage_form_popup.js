(function(){
  'use strict';

  var popup = document.getElementById('umoya-form-popup');
  if (!popup || popup.dataset.ready === 'true') return;
  popup.dataset.ready = 'true';

  var form = document.getElementById('umoyaPopupForm');
  var closeBtn = popup.querySelector('[data-umoya-form-close]');
  var lastFocus = null;
  var submitBtn = form ? form.querySelector('.umoya-form-submit') : null;
  var statusEl = form ? form.querySelector('.umoya-form-status') : null;
  var submitText = submitBtn ? submitBtn.textContent : '';
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

  function movePopupToBody() {
    if (popup.parentElement !== document.body) {
      document.body.appendChild(popup);
    }
  }

  function openPopup() {
    lastFocus = document.activeElement;
    movePopupToBody();
    if (form && form.getAttribute('data-submitted') === 'true') {
      resetFormState(true);
    }
    popup.classList.add('is-open');
    popup.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    window.setTimeout(function() {
      var first = form ? form.querySelector('input:not([type="hidden"]), select, textarea') : closeBtn;
      if (first) first.focus();
    }, 40);
    document.addEventListener('keydown', onKeydown);
  }

  movePopupToBody();

  function closePopup() {
    popup.classList.remove('is-open');
    popup.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKeydown);
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function resetFormState(clearValues) {
    if (!form) return;
    if (clearValues) form.reset();
    form.removeAttribute('data-submitted');
    form.removeAttribute('aria-busy');
    form.querySelectorAll('input, select, textarea').forEach(function(field) {
      field.style.borderColor = '';
      field.style.boxShadow = '';
    });
    if (statusEl) {
      statusEl.textContent = '';
      statusEl.classList.remove('is-visible');
      statusEl.classList.remove('is-error');
    }
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = submitText;
    }
  }

  function showStatus(message, isError) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.toggle('is-error', !!isError);
    statusEl.classList.add('is-visible');
  }

  function setSubmitting(isSubmitting) {
    if (!form || !submitBtn) return;
    submitBtn.disabled = isSubmitting;
    submitBtn.textContent = isSubmitting ? 'Sending...' : submitText;
    form.setAttribute('aria-busy', isSubmitting ? 'true' : 'false');
  }

  function getFormValue(fieldName) {
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
    setHiddenValue('pageName', document.title || 'Umoya Afrika Tours');
  }

  function identifyHubSpotVisitor() {
    var email = getFormValue('EMAIL');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    window._hsq = window._hsq || [];
    window._hsq.push(['identify', { email: email }]);
    window._hsq.push(['trackPageView']);
  }

  function buildHubSpotPayload() {
    syncTrackingFields();
    var fields = [];

    Object.keys(hubspotFieldMap).forEach(function(fieldName) {
      var value = getFormValue(fieldName);
      if (value) {
        fields.push({
          name: hubspotFieldMap[fieldName],
          value: value
        });
      }
    });

    var context = {
      pageUri: window.location.href,
      pageName: document.title || 'Umoya Afrika Tours'
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
      rawFields[fieldName] = getFormValue(fieldName);
    });

    return {
      submissionId: createSubmissionId(),
      source: (form.getAttribute('data-umoya-form-source') || 'homepage_popup').trim(),
      hubspotPortalId: (form.getAttribute('data-hubspot-portal-id') || '').trim(),
      hubspotFormId: (form.getAttribute('data-hubspot-form-id') || '').trim(),
      consentText: (form.getAttribute('data-hubspot-consent-text') || '').trim(),
      hutk: getCookie('hubspotutk'),
      pageUri: window.location.href,
      pageName: document.title || 'Umoya Afrika Tours',
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

  if (form) {
    window.setTimeout(flushPendingBackups, 1200);
    syncTrackingFields();
    window.setTimeout(syncTrackingFields, 1500);
  }

  function onKeydown(event) {
    if (event.key === 'Escape') closePopup();
  }

  document.addEventListener('click', function(event) {
    var trigger = event.target.closest('[data-umoya-form-popup], .umoya-open-form-popup');
    if (!trigger) return;
    event.preventDefault();
    openPopup();
  });

  closeBtn && closeBtn.addEventListener('click', closePopup);
  popup.addEventListener('click', function(event) {
    if (event.target === popup) closePopup();
  });

  if (form) {
    form.addEventListener('submit', function(event) {
      event.preventDefault();
      syncTrackingFields();

      var required = Array.prototype.slice.call(form.querySelectorAll('[required]'));
      var valid = true;
      var firstInvalid = null;

      required.forEach(function(field) {
        if (!field.value.trim()) {
          valid = false;
          if (!firstInvalid) firstInvalid = field;
          field.style.borderColor = '#D97E53';
          field.style.boxShadow = '0 0 0 3px rgba(217,126,83,.12)';
        } else {
          field.style.borderColor = '';
          field.style.boxShadow = '';
        }
      });

      var email = form.querySelector('[type="email"]');
      if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        valid = false;
        if (!firstInvalid) firstInvalid = email;
        email.style.borderColor = '#D97E53';
        email.style.boxShadow = '0 0 0 3px rgba(217,126,83,.12)';
      }

      if (!valid) {
        showStatus('Please complete the required fields.', true);
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      setSubmitting(true);
      showStatus('Sending your inquiry...', false);
      syncTrackingFields();
      identifyHubSpotVisitor();

      var backupPayload = buildWordPressBackupPayload();

      submitToWordPressBackup(backupPayload)
        .then(function() {
          form.setAttribute('data-submitted', 'true');
          form.removeAttribute('aria-busy');
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Inquiry Received - We Will Be in Touch Soon';
          }
          showStatus('Thank you. Your inquiry has been received.', false);
        })
        .catch(function(error) {
          submitToHubSpot()
            .then(function() {
              queuePendingBackup(backupPayload);
              form.setAttribute('data-submitted', 'true');
              form.removeAttribute('aria-busy');
              if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Inquiry Received - We Will Be in Touch Soon';
              }
              showStatus('Thank you. Your inquiry has been received.', false);
            })
            .catch(function(fallbackError) {
              setSubmitting(false);
              showStatus((error.message || 'WordPress could not save the submission.') + ' ' + (fallbackError.message || 'HubSpot fallback also failed.'), true);
            });
        });
    });

    form.querySelectorAll('input, select, textarea').forEach(function(field) {
      field.addEventListener('input', function() {
        field.style.borderColor = '';
        field.style.boxShadow = '';
        if (statusEl) {
          statusEl.classList.remove('is-visible');
          statusEl.classList.remove('is-error');
        }
      });
    });
  }
}());
