/**
 * Section Edit System — Extracted from draft-writer.md
 *
 * Handles auth-gated section editing with bridge server integration,
 * real-time progress indicator, and keyboard accessibility.
 *
 * Template variables (replaced at generation time):
 *   {{ARTICLE_TOPIC}} — article topic string (must escape single quotes)
 *   {{ARTICLE_FILENAME}} — article filename
 */
(function() {
  var ARTICLE_TOPIC = '{{ARTICLE_TOPIC}}';
  var ARTICLE_FILE = '{{ARTICLE_FILENAME}}';
  var BRIDGE_URL = 'http://127.0.0.1:19847';
  var AUTH_TOKEN_KEY = 'article-engine-token';

  // ── Token Management ──────────────────────────────────────
  function getStoredToken() { return localStorage.getItem(AUTH_TOKEN_KEY); }
  function storeToken(token) { localStorage.setItem(AUTH_TOKEN_KEY, token); }
  function clearToken() { localStorage.removeItem(AUTH_TOKEN_KEY); }

  // ── Prompt Builder ────────────────────────────────────────
  function buildEditPrompt(sectionId, sType, sRole, sPurpose, sHeading, userInput) {
    return 'SECTION_EDIT:\nUse the autonomous-article-engine skill to update section ' + sectionId + '.\n\nTopic: ' + ARTICLE_TOPIC + '\nArticle file: ' + ARTICLE_FILE + '\nSection ID: ' + sectionId + '\nSection type: ' + sType + '\nSection role: ' + sRole + '\nSection purpose: ' + sPurpose + '\nCurrent section heading: ' + sHeading + '\n\nUser requested change: ' + userInput + '\n\nRULES:\n- Update only this section unless a minimal surrounding adjustment is required for consistency\n- Preserve topic domain integrity\n- Preserve page style and component compatibility\n- Improve the section intelligently and professionally, not just literally\n- Keep the result aligned with the rest of the article\n- If the edit affects a heading, update the sidebar TOC entry to match\n- Maintain the section\'s data attributes (data-section-id, data-section-type, data-section-role)';
  }

  // ── Bridge Health Check with Retry ───────────────────────
  function checkBridge(retries, delay) {
    retries = retries || 3;
    delay = delay || 2000;
    return new Promise(function(resolve) {
      var attempt = 0;
      function tryOnce() {
        attempt++;
        fetch(BRIDGE_URL + '/health', { method: 'GET' })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (data && data.status === 'ok') { resolve(true); }
            else if (attempt < retries) { setTimeout(tryOnce, delay); }
            else { resolve(false); }
          })
          .catch(function() {
            if (attempt < retries) { setTimeout(tryOnce, delay); }
            else { resolve(false); }
          });
      }
      tryOnce();
    });
  }

  // ── Status Display ────────────────────────────────────────
  function showEditStatus(type, msg) {
    var el = document.getElementById('edit-status');
    el.className = 'section-edit-status visible section-edit-status--' + type;
    var icon = type === 'success'
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    el.innerHTML = icon + '<span class="section-edit-status-text"></span>';
    el.querySelector('.section-edit-status-text').textContent = msg;
    el.setAttribute('role', 'alert');
  }

  function showAuthStatus(type, text) {
    var el = document.getElementById('auth-status');
    el.className = 'auth-status visible auth-status--' + type;
    el.textContent = text;
    el.setAttribute('role', 'alert');
  }

  function showPanel(which) {
    document.getElementById('auth-panel').style.display = which === 'auth' ? 'block' : 'none';
    document.getElementById('edit-panel').style.display = which === 'edit' ? 'block' : 'none';
  }

  // ── Progress Indicator — Claude Code-style ───────────────
  var editStartTime = null;
  var elapsedTimer = null;

  function showProgress(stage, percent) {
    var el = document.getElementById('edit-progress');
    if (!el) return;
    el.classList.add('visible');
    var fill = el.querySelector('.section-edit-progress-fill');
    var label = el.querySelector('.stage-label');
    if (fill) fill.style.width = percent + '%';
    if (label) {
      var dots = '<span class="streaming-dots"><span></span><span></span><span></span></span>';
      label.innerHTML = '';
      var textNode = document.createTextNode(stage);
      label.appendChild(textNode);
      if (percent < 100) {
        var dotsEl = document.createElement('span');
        dotsEl.className = 'streaming-dots';
        dotsEl.innerHTML = '<span></span><span></span><span></span>';
        label.appendChild(dotsEl);
      }
    }
    // Update elapsed time
    var elapsedEl = el.querySelector('.section-edit-elapsed');
    if (elapsedEl && editStartTime) {
      var secs = Math.floor((Date.now() - editStartTime) / 1000);
      elapsedEl.textContent = secs + 's';
    }
    // Announce to screen readers
    var liveRegion = document.getElementById('edit-progress-live');
    if (liveRegion) liveRegion.textContent = stage + ' ' + percent + '% complete';
  }

  function startProgressTimer() {
    editStartTime = Date.now();
    if (elapsedTimer) clearInterval(elapsedTimer);
    elapsedTimer = setInterval(function() {
      var el = document.getElementById('edit-progress');
      if (!el) return;
      var elapsedEl = el.querySelector('.section-edit-elapsed');
      if (elapsedEl && editStartTime) {
        var secs = Math.floor((Date.now() - editStartTime) / 1000);
        var min = Math.floor(secs / 60);
        var sec = secs % 60;
        elapsedEl.textContent = min > 0 ? min + 'm ' + sec + 's' : sec + 's';
      }
    }, 1000);
  }

  function hideProgress() {
    var el = document.getElementById('edit-progress');
    if (el) el.classList.remove('visible');
    if (elapsedTimer) { clearInterval(elapsedTimer); elapsedTimer = null; }
    editStartTime = null;
  }

  // ── Version Control System ──────────────────────────────
  // Stores per-section edit history in sessionStorage
  var VERSION_KEY = 'chainiq-edit-versions';

  function getVersionStore() {
    try {
      var raw = sessionStorage.getItem(VERSION_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }

  function saveVersionStore(store) {
    try { sessionStorage.setItem(VERSION_KEY, JSON.stringify(store)); } catch {}
  }

  function snapshotSection(sectionId, label) {
    var section = document.getElementById(sectionId);
    if (!section) return;
    var store = getVersionStore();
    if (!store[sectionId]) store[sectionId] = [];
    store[sectionId].push({
      html: section.innerHTML,
      label: label || 'Edit',
      time: new Date().toISOString(),
      id: Date.now()
    });
    // Keep max 10 versions per section
    if (store[sectionId].length > 10) store[sectionId] = store[sectionId].slice(-10);
    saveVersionStore(store);
  }

  function getSectionVersions(sectionId) {
    var store = getVersionStore();
    return store[sectionId] || [];
  }

  function restoreVersion(sectionId, versionId) {
    var versions = getSectionVersions(sectionId);
    var version = versions.find(function(v) { return v.id === versionId; });
    if (!version) return false;
    var section = document.getElementById(sectionId);
    if (!section) return false;
    // Snapshot current state before restoring (so user can redo)
    snapshotSection(sectionId, 'Before restore');
    section.innerHTML = version.html;
    return true;
  }

  function undoLastEdit(sectionId) {
    var versions = getSectionVersions(sectionId);
    if (versions.length < 1) return false;
    var previous = versions[versions.length - 1];
    var section = document.getElementById(sectionId);
    if (!section) return false;
    section.innerHTML = previous.html;
    // Remove the restored version from stack
    var store = getVersionStore();
    store[sectionId].pop();
    saveVersionStore(store);
    return true;
  }

  function renderVersionPanel(sectionId) {
    var panel = document.getElementById('edit-versions-panel');
    if (!panel) return;
    var versions = getSectionVersions(sectionId);
    if (versions.length === 0) {
      panel.classList.remove('visible');
      return;
    }
    panel.classList.add('visible');
    var list = panel.querySelector('.version-list');
    var undoBtn = panel.querySelector('.version-btn--undo');
    if (undoBtn) undoBtn.disabled = versions.length === 0;
    if (!list) return;
    list.innerHTML = '';
    versions.slice().reverse().forEach(function(v, i) {
      var item = document.createElement('div');
      item.className = 'version-item' + (i === 0 ? ' active' : '');
      var d = new Date(v.time);
      var timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      item.innerHTML =
        '<span class="version-item-label">' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
          v.label +
        '</span>' +
        '<span class="version-item-time">' + timeStr + '</span>';
      item.addEventListener('click', function() {
        if (restoreVersion(sectionId, v.id)) {
          showEditStatus('success', 'Restored to "' + v.label + '"');
          renderVersionPanel(sectionId);
        }
      });
      list.appendChild(item);
    });
  }

  // ── Focus Trap (T3-06 Accessibility) ──────────────────────
  function trapFocus(container) {
    var focusable = container.querySelectorAll(
      'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return null;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    function handler(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    container.addEventListener('keydown', handler);
    first.focus();
    return function() { container.removeEventListener('keydown', handler); };
  }

  var releaseFocusTrap = null;

  // ── Escape Key Handler (T3-06) ────────────────────────────
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var overlay = document.getElementById('section-edit-overlay');
      if (overlay && overlay.classList.contains('active')) {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
        if (releaseFocusTrap) { releaseFocusTrap(); releaseFocusTrap = null; }
        // Return focus to the trigger that opened the overlay
        var triggerId = overlay.getAttribute('data-trigger-source');
        if (triggerId) {
          var trigger = document.querySelector('[data-edit-section="' + triggerId + '"]');
          if (trigger) trigger.focus();
        }
      }
    }
  });

  // ── Auth Toggle ───────────────────────────────────────────
  var isSignup = false;
  function handleAuthToggle() {
    isSignup = !isSignup;
    document.getElementById('auth-panel-title').textContent = isSignup ? 'Create Account' : 'Login to Edit';
    document.getElementById('auth-submit-btn').textContent = isSignup ? 'Sign Up' : 'Login';
    document.getElementById('auth-toggle-text').innerHTML = isSignup
      ? 'Already have an account? <a id="auth-toggle-link">Login</a>'
      : 'Don\'t have an account? <a id="auth-toggle-link">Sign up</a>';
    document.getElementById('auth-status').className = 'auth-status';
    document.getElementById('auth-toggle-link')?.addEventListener('click', handleAuthToggle);
  }
  document.getElementById('auth-toggle-link')?.addEventListener('click', handleAuthToggle);

  // ── Auth Cancel ───────────────────────────────────────────
  document.getElementById('auth-cancel-btn')?.addEventListener('click', function() {
    var overlay = document.getElementById('section-edit-overlay');
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    if (releaseFocusTrap) { releaseFocusTrap(); releaseFocusTrap = null; }
  });

  // ── Auth Submit ───────────────────────────────────────────
  document.getElementById('auth-submit-btn')?.addEventListener('click', function() {
    var email = document.getElementById('auth-email').value.trim();
    var password = document.getElementById('auth-password').value;
    if (!email || !password) { showAuthStatus('error', 'Please enter email and password.'); return; }

    var btn = document.getElementById('auth-submit-btn');
    btn.disabled = true;
    btn.textContent = isSignup ? 'Creating...' : 'Logging in...';

    fetch(BRIDGE_URL + (isSignup ? '/auth/signup' : '/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.status === 'success') {
        if (isSignup) {
          showAuthStatus('success', 'Account created! Your access is pending admin approval.');
          btn.textContent = 'Sign Up'; btn.disabled = false;
        } else {
          if (data.subscription && data.subscription.status === 'active') {
            storeToken(data.access_token);
            showPanel('edit');
            document.getElementById('edit-section-input')?.focus();
          } else {
            showAuthStatus('error', 'Your account is pending approval. Contact the admin for access.');
            btn.textContent = 'Login'; btn.disabled = false;
          }
        }
      } else {
        showAuthStatus('error', data.error || 'Something went wrong.');
        btn.textContent = isSignup ? 'Sign Up' : 'Login'; btn.disabled = false;
      }
    })
    .catch(function() {
      showAuthStatus('error', 'Cannot connect to bridge server. Run /start-bridge first.');
      btn.textContent = isSignup ? 'Sign Up' : 'Login'; btn.disabled = false;
    });
  });

  // ── Edit Trigger Buttons ──────────────────────────────────
  document.querySelectorAll('.section-edit-trigger').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var sectionId = btn.getAttribute('data-edit-section');
      var section = document.getElementById(sectionId);
      if (!section) return;

      var sType = section.getAttribute('data-section-type') || 'unknown';
      var sRole = section.getAttribute('data-section-role') || 'unknown';
      var sHeading = section.getAttribute('data-section-heading') || 'Untitled';
      var sPurpose = section.getAttribute('data-section-purpose') || '';

      document.getElementById('edit-section-title').textContent = 'Edit: ' + sHeading;
      var metaEl = document.getElementById('edit-section-meta');
      metaEl.innerHTML = '<span></span><span></span>';
      metaEl.children[0].textContent = sType;
      metaEl.children[1].textContent = sRole.substring(0, 60);

      var overlay = document.getElementById('section-edit-overlay');
      overlay.setAttribute('data-current-section', sectionId);
      overlay.setAttribute('data-current-type', sType);
      overlay.setAttribute('data-current-role', sRole);
      overlay.setAttribute('data-current-heading', sHeading);
      overlay.setAttribute('data-current-purpose', sPurpose);
      overlay.setAttribute('data-trigger-source', sectionId);

      // Reset state
      document.getElementById('edit-section-input').value = '';
      document.getElementById('edit-status').className = 'section-edit-status';
      document.getElementById('edit-fallback-toggle').classList.remove('visible');
      document.getElementById('edit-prompt-result').classList.remove('visible');
      document.getElementById('auth-email').value = '';
      document.getElementById('auth-password').value = '';
      document.getElementById('auth-status').className = 'auth-status';
      hideProgress();
      // Show version history for this section
      renderVersionPanel(sectionId);

      var token = getStoredToken();
      if (token) {
        fetch(BRIDGE_URL + '/auth/verify', { headers: { 'Authorization': 'Bearer ' + token } })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.status === 'ok' && data.subscription && data.subscription.status === 'active') {
            showPanel('edit');
            overlay.classList.add('active');
            overlay.setAttribute('aria-hidden', 'false');
            releaseFocusTrap = trapFocus(overlay);
            document.getElementById('edit-section-input').focus();
          } else {
            clearToken();
            showPanel('auth');
            overlay.classList.add('active');
            overlay.setAttribute('aria-hidden', 'false');
            releaseFocusTrap = trapFocus(overlay);
          }
        })
        .catch(function() {
          clearToken();
          showPanel('auth');
          overlay.classList.add('active');
          overlay.setAttribute('aria-hidden', 'false');
          releaseFocusTrap = trapFocus(overlay);
        });
      } else {
        showPanel('auth');
        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
        releaseFocusTrap = trapFocus(overlay);
      }
    });
  });

  // ── Logout ────────────────────────────────────────────────
  document.getElementById('edit-logout-btn')?.addEventListener('click', function() {
    clearToken();
    showPanel('auth');
  });

  // ── Cancel (edit panel) ───────────────────────────────────
  document.getElementById('edit-cancel-btn')?.addEventListener('click', function() {
    var overlay = document.getElementById('section-edit-overlay');
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    if (releaseFocusTrap) { releaseFocusTrap(); releaseFocusTrap = null; }
  });

  // ── Click outside to close ────────────────────────────────
  document.getElementById('section-edit-overlay')?.addEventListener('click', function(e) {
    if (e.target === e.currentTarget) {
      e.currentTarget.classList.remove('active');
      e.currentTarget.setAttribute('aria-hidden', 'true');
      if (releaseFocusTrap) { releaseFocusTrap(); releaseFocusTrap = null; }
    }
  });

  // ── Stage Name Mapping (machine → human-readable) ────────
  var STAGE_LABELS = {
    'queued': 'Queued...',
    'starting': 'Starting edit...',
    'analyzing': 'Analyzing section...',
    'reading': 'Reading surrounding context...',
    'rewriting': 'Claude is rewriting the section...',
    'formatting': 'Formatting output...',
    'validating': 'Validating output...',
    'complete': 'Complete'
  };

  var activeEventSource = null;

  function cleanupSSE() {
    if (activeEventSource) {
      activeEventSource.close();
      activeEventSource = null;
    }
  }

  // ── Apply Edit (SSE progress via job queue) ─────────────
  document.getElementById('edit-generate-btn')?.addEventListener('click', function() {
    var overlay = document.getElementById('section-edit-overlay');
    var userInput = document.getElementById('edit-section-input').value.trim();
    if (!userInput) return;

    var prompt = buildEditPrompt(
      overlay.getAttribute('data-current-section'),
      overlay.getAttribute('data-current-type'),
      overlay.getAttribute('data-current-role'),
      overlay.getAttribute('data-current-purpose'),
      overlay.getAttribute('data-current-heading'),
      userInput
    );
    var token = getStoredToken();
    document.getElementById('edit-prompt-text').textContent = prompt;

    var btn = document.getElementById('edit-generate-btn');
    btn.textContent = 'Checking server...'; btn.disabled = true;

    // Snapshot current section content before editing (for undo)
    var currentSectionId = overlay.getAttribute('data-current-section');
    snapshotSection(currentSectionId, 'Before: ' + userInput.substring(0, 40));

    // Pre-flight: check bridge is reachable (3 retries, 2s apart)
    showProgress('Connecting to bridge server...', 2);
    startProgressTimer();
    checkBridge(3, 2000).then(function(bridgeOk) {
      if (!bridgeOk) {
        hideProgress();
        showEditStatus('error', 'Bridge server is not running. Start it with: npm run bridge');
        document.getElementById('edit-fallback-toggle').classList.add('visible');
        document.getElementById('edit-prompt-result').classList.add('visible');
        btn.textContent = 'Apply Edit'; btn.disabled = false;
        return;
      }

    btn.textContent = 'Sending...';
    showProgress('Submitting edit...', 5);

    // Clean up any previous SSE connection
    cleanupSSE();

    fetch(BRIDGE_URL + '/apply-edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (token || '') },
      body: JSON.stringify({ prompt: prompt })
    })
    .then(function(r) {
      var httpStatus = r.status;
      return r.json().then(function(data) { data._httpStatus = httpStatus; return data; });
    })
    .then(function(data) {
      if (data._httpStatus === 401) {
        hideProgress();
        clearToken();
        showPanel('auth');
        showAuthStatus('error', data.error || 'Session expired. Please log in again.');
        btn.textContent = 'Apply Edit'; btn.disabled = false;
        return;
      }
      if (data._httpStatus >= 400) {
        hideProgress();
        showEditStatus('error', data.error || 'Edit failed.');
        document.getElementById('edit-fallback-toggle').classList.add('visible');
        btn.textContent = 'Apply Edit'; btn.disabled = false;
        return;
      }

      if (data.status === 'queued' && data.job_id) {
        // Connect to SSE progress stream
        showProgress('Analyzing section...', 10);
        var progressUrl = BRIDGE_URL + data.progress_url + '?token=' + encodeURIComponent(token || '');
        var es = new EventSource(progressUrl);
        activeEventSource = es;

        es.onmessage = function(event) {
          try {
            var evt = JSON.parse(event.data);
            if (evt.event === 'progress') {
              var label = STAGE_LABELS[evt.stage] || evt.stage;
              showProgress(label, evt.percent);
            } else if (evt.event === 'completed') {
              showProgress('Complete', 100);
              showEditStatus('success', 'Section updated! Refresh to see changes.');
              btn.textContent = 'Done!';
              renderVersionPanel(currentSectionId);
              cleanupSSE();
              setTimeout(function() {
                btn.textContent = 'Apply Edit'; btn.disabled = false;
                hideProgress();
              }, 4000);
            } else if (evt.event === 'failed') {
              hideProgress();
              showEditStatus('error', evt.error || 'Edit failed.');
              document.getElementById('edit-fallback-toggle').classList.add('visible');
              btn.textContent = 'Apply Edit'; btn.disabled = false;
              cleanupSSE();
            } else if (evt.event === 'cancelled') {
              hideProgress();
              showEditStatus('error', 'Edit was cancelled.');
              btn.textContent = 'Apply Edit'; btn.disabled = false;
              cleanupSSE();
            }
          } catch (_) {}
        };

        es.onerror = function() {
          // SSE connection lost — show fallback
          cleanupSSE();
          hideProgress();
          showEditStatus('error', 'Lost connection to bridge server.');
          document.getElementById('edit-fallback-toggle').classList.add('visible');
          btn.textContent = 'Apply Edit'; btn.disabled = false;
        };
      } else if (data.status === 'success') {
        // Sync mode fallback response
        showProgress('Complete', 100);
        showEditStatus('success', 'Section updated! Refresh to see changes.');
        btn.textContent = 'Done!';
        renderVersionPanel(currentSectionId);
        setTimeout(function() {
          btn.textContent = 'Apply Edit'; btn.disabled = false;
          hideProgress();
        }, 4000);
      } else {
        hideProgress();
        showEditStatus('error', data.error || 'Unexpected response.');
        btn.textContent = 'Apply Edit'; btn.disabled = false;
      }
    })
    .catch(function() {
      hideProgress();
      showEditStatus('error', 'Cannot connect to bridge server. Showing prompt for manual copy.');
      document.getElementById('edit-fallback-toggle').classList.add('visible');
      document.getElementById('edit-prompt-result').classList.add('visible');
      btn.textContent = 'Apply Edit'; btn.disabled = false;
    });

    }); // end checkBridge().then()
  });

  // ── Fallback Toggle ───────────────────────────────────────
  document.getElementById('edit-fallback-toggle')?.addEventListener('click', function() {
    document.getElementById('edit-prompt-result').classList.toggle('visible');
  });

  // ── Copy Button ───────────────────────────────────────────
  document.getElementById('edit-copy-btn')?.addEventListener('click', function() {
    var promptText = document.getElementById('edit-prompt-text').textContent;
    navigator.clipboard.writeText(promptText).then(function() {
      var btn = document.getElementById('edit-copy-btn');
      btn.textContent = 'Copied!';
      setTimeout(function() { btn.textContent = 'Copy to clipboard'; }, 2000);
    });
  });

  // ── Version Control — Undo Button ──────────────────────
  document.querySelector('.version-btn--undo')?.addEventListener('click', function() {
    var overlay = document.getElementById('section-edit-overlay');
    var sectionId = overlay.getAttribute('data-current-section');
    if (!sectionId) return;
    if (undoLastEdit(sectionId)) {
      showEditStatus('success', 'Reverted to previous version.');
      renderVersionPanel(sectionId);
    } else {
      showEditStatus('error', 'No previous version to restore.');
    }
  });
})();
