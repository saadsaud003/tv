/* ===========================
   Arab TV - Smart TV Module
   Enhanced D-pad Navigation
   =========================== */

(function() {
  'use strict';

  // -- TV Detection --
  const TV_UA = /SmartTV|Tizen|webOS|Web0S|BRAVIA|AndroidTV|Android TV|GoogleTV|Roku|Vizio|Hisense|PhilipsTV|Opera TV|NetCast|NETTV|HbbTV|CrKey|FireTV|Fire TV|AFTM|AFTT|AFTS/i;
  const isTV = TV_UA.test(navigator.userAgent) || localStorage.getItem('tv_mode') === '1';

  if (new URLSearchParams(location.search).has('tv')) {
    localStorage.setItem('tv_mode', '1');
  }

  if (isTV || localStorage.getItem('tv_mode') === '1') {
    document.body.classList.add('tv-mode');
  }

  // -- Focusable selector (expanded for full TV navigation) --
  const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    '[tabindex="0"]',
    '.nav-back',
    '.filter-select',
    '.engine-btn',
    '.source-btn',
    '.cat-tab',
    '.ch-grid-item',
    '.channel-card',
    '.scroll-card',
    '.quick-nav-card',
    '.load-more button',
    '.sub-item',
    '.sub-dl',
    'select.filter-select',
    'input[type="text"]',
    'input[type="range"]',
    '.player-controls button',
    '.custom-controls button'
  ].join(',');

  // Elements to auto-add tabindex
  const MAKE_FOCUSABLE = '.home-card,.media-card,.channel-item,.ch-grid-item,.channel-card,.category-item,.cat-tab,.episode-item,.season-tab,.source-btn,.engine-btn,.nav-back,.filter-select,.load-more button,.sub-item,.sub-dl,.player-controls button,.custom-controls button,.quick-nav-card,.scroll-card';

  // Make elements focusable - debounced & throttled
  let _focusTimer = null;
  let _lastFocus = 0;
  function makeFocusable() {
    if (_focusTimer) return;
    const now = Date.now();
    const delay = now - _lastFocus < 1000 ? 500 : 150;
    _focusTimer = setTimeout(() => {
      _focusTimer = null;
      _lastFocus = Date.now();
      const els = document.querySelectorAll(MAKE_FOCUSABLE);
      for (let i = 0; i < els.length; i++) {
        if (!els[i].hasAttribute('tabindex')) els[i].setAttribute('tabindex', '0');
      }
    }, delay);
  }

  // -- Spatial Navigation (optimized) --
  function findNext(direction) {
    const current = document.activeElement;
    if (!current || current === document.body) return null;

    const cr = current.getBoundingClientRect();
    const cx = cr.left + cr.width / 2;
    const cy = cr.top + cr.height / 2;

    const candidates = document.querySelectorAll(FOCUSABLE);
    let best = null;
    let bestDist = Infinity;

    for (let i = 0; i < candidates.length; i++) {
      const el = candidates[i];
      if (el === current || el.offsetWidth === 0) continue;
      // Skip hidden elements
      if (el.offsetParent === null && el.style.position !== 'fixed') continue;

      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;

      const ex = r.left + r.width / 2;
      const ey = r.top + r.height / 2;
      let valid = false, dist = 0;

      switch (direction) {
        case 'up':    valid = ey < cy - 5; dist = (cy - ey) + Math.abs(cx - ex) * 0.4; break;
        case 'down':  valid = ey > cy + 5; dist = (ey - cy) + Math.abs(cx - ex) * 0.4; break;
        case 'left':  valid = ex < cx - 5; dist = (cx - ex) + Math.abs(cy - ey) * 0.4; break;
        case 'right': valid = ex > cx + 5; dist = (ex - cx) + Math.abs(cy - ey) * 0.4; break;
      }

      if (valid && dist < bestDist) {
        bestDist = dist;
        best = el;
      }
    }
    return best;
  }

  function scrollIntoViewIfNeeded(el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // -- Key mapping --
  const KEY_MAP = {
    'ArrowUp':'up','ArrowDown':'down','ArrowLeft':'left','ArrowRight':'right',
    'Enter':'enter',' ':'enter',
    'Escape':'back','Backspace':'back','XF86Back':'back',
    'MediaPlayPause':'playpause','MediaPlay':'play','MediaPause':'pause','MediaStop':'stop'
  };

  function handleKeydown(e) {
    if (!document.body.classList.contains('tv-mode')) return;

    // Allow typing in inputs - only intercept Escape
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      if (e.key === 'Escape') { e.target.blur(); e.preventDefault(); }
      return;
    }

    // Allow select navigation with arrow keys
    if (e.target.tagName === 'SELECT') {
      if (e.key === 'Escape') { e.target.blur(); e.preventDefault(); }
      // Let up/down work on select natively, only intercept left/right for exiting
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const next = findNext(e.key === 'ArrowLeft' ? 'left' : 'right');
        if (next) { next.focus({ preventScroll: true }); scrollIntoViewIfNeeded(next); }
      }
      return;
    }

    const action = KEY_MAP[e.key] || KEY_MAP[e.keyCode];
    if (!action) return;

    switch (action) {
      case 'up': case 'down': case 'left': case 'right': {
        e.preventDefault();
        const next = findNext(action);
        if (next) { next.focus({ preventScroll: true }); scrollIntoViewIfNeeded(next); }
        break;
      }
      case 'enter': {
        e.preventDefault();
        const active = document.activeElement;
        if (active && active !== document.body) {
          // For selects, simulate click to open dropdown
          if (active.tagName === 'SELECT') {
            active.focus();
            // Try to open dropdown
            const event = new MouseEvent('mousedown', { bubbles: true });
            active.dispatchEvent(event);
          } else {
            active.click();
          }
        }
        break;
      }
      case 'back': {
        e.preventDefault();
        const modal = document.querySelector('.modal-backdrop.show');
        const drawer = document.querySelector('.sidebar-drawer-overlay.open');
        const subPanel = document.querySelector('.sub-panel-overlay.open');
        if (modal) modal.classList.remove('show');
        else if (subPanel) subPanel.classList.remove('open');
        else if (drawer) drawer.classList.remove('open');
        else history.back();
        break;
      }
      case 'playpause': case 'play': case 'pause': {
        e.preventDefault();
        const video = document.getElementById('videoPlayer');
        if (video) { video.paused ? video.play().catch(()=>{}) : video.pause(); }
        break;
      }
      case 'stop': {
        e.preventDefault();
        const video = document.getElementById('videoPlayer');
        if (video) { video.pause(); video.currentTime = 0; }
        break;
      }
    }
  }

  // -- Init --
  function initTV() {
    makeFocusable();

    // Lightweight observer
    const observer = new MutationObserver(makeFocusable);
    observer.observe(document.body, { childList: true, subtree: true });

    // Smart initial focus - focus on back button first, then content
    setTimeout(() => {
      const backBtn = document.querySelector('.nav-back');
      const first = backBtn
        || document.querySelector('.quick-nav-card,.home-card,.ch-grid-item,.channel-item,.media-card,.nav-tabs a.active,.cat-tab.active');
      if (first) first.focus({ preventScroll: true });
    }, 600);

    document.addEventListener('keydown', handleKeydown, { capture: true });
  }

  // -- Public API --
  window.TVMode = {
    enable() { localStorage.setItem('tv_mode', '1'); document.body.classList.add('tv-mode'); makeFocusable(); },
    disable() { localStorage.removeItem('tv_mode'); document.body.classList.remove('tv-mode'); },
    toggle() { document.body.classList.contains('tv-mode') ? this.disable() : this.enable(); },
    isTV() { return document.body.classList.contains('tv-mode'); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initTV);
  else initTV();
})();
