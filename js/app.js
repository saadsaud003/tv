/* ===========================
   Arab TV - Core App Module
   =========================== */

// PWA Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/s/tv/sw.js').catch(() => {});
  });
}

// PWA Install
let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallBanner('native');
});

// Show install banner - works on TV and all platforms
function showInstallBanner(mode) {
  const banner = document.getElementById('installBanner');
  if (!banner || localStorage.getItem('pwa_dismissed')) return;

  const text = document.getElementById('installText');
  const btn = document.getElementById('installBtn');

  if (mode === 'native' && deferredPrompt) {
    // Chrome/Edge/Android - native install prompt
    if (text) text.textContent = 'ثبّت التطبيق على جهازك للوصول السريع';
    if (btn) { btn.style.display = ''; btn.textContent = 'تثبيت'; }
  } else {
    // TV / Safari / unsupported browsers - show instructions
    const ua = navigator.userAgent;
    let instructions = 'أضف هذا الموقع إلى الشاشة الرئيسية لتجربة أفضل';

    if (/Tizen/i.test(ua)) {
      instructions = 'Samsung TV: اضغط على زر القائمة ← أضف إلى التطبيقات';
    } else if (/webOS|Web0S/i.test(ua)) {
      instructions = 'LG TV: أضف الرابط إلى المفضلة من المتصفح';
    } else if (/Android/i.test(ua)) {
      instructions = 'اضغط على ⋮ القائمة ← أضف إلى الشاشة الرئيسية';
    } else if (/iPhone|iPad/i.test(ua)) {
      instructions = 'اضغط على مشاركة ← أضف إلى الشاشة الرئيسية';
    }

    if (text) text.textContent = instructions;
    if (btn) btn.style.display = 'none';
  }

  banner.style.display = 'flex';
}

// Auto-show install banner after short delay
window.addEventListener('load', () => {
  setTimeout(() => {
    if (!deferredPrompt && !localStorage.getItem('pwa_dismissed')) {
      showInstallBanner('manual');
    }
  }, 2000);
});

function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(r => {
      if (r.outcome === 'accepted') showToast('تم تثبيت التطبيق بنجاح');
      deferredPrompt = null;
      const banner = document.getElementById('installBanner');
      if (banner) banner.style.display = 'none';
    });
  }
}

function dismissInstall() {
  const banner = document.getElementById('installBanner');
  if (banner) banner.style.display = 'none';
  localStorage.setItem('pwa_dismissed', '1');
}

// Settings
function openSettings() {
  document.getElementById('settingsModal')?.classList.add('show');
  loadSettings();
}

function closeSettings() {
  document.getElementById('settingsModal')?.classList.remove('show');
}

function loadSettings() {
  const font = localStorage.getItem('fontFamily') || "'Cairo', sans-serif";
  const size = localStorage.getItem('fontSize') || '14';
  const quality = localStorage.getItem('defaultQuality') || 'auto';
  const subLang = localStorage.getItem('subtitleLang') || 'ara';
  const tvMode = localStorage.getItem('tv_mode_setting') || 'auto';

  const fontEl = document.getElementById('fontFamily');
  const sizeEl = document.getElementById('fontSize');
  const sizeValEl = document.getElementById('fontSizeVal');
  const qualityEl = document.getElementById('defaultQuality');
  const subLangEl = document.getElementById('subtitleLang');
  const tvEl = document.getElementById('tvModeSetting');

  if (fontEl) fontEl.value = font;
  if (sizeEl) sizeEl.value = size;
  if (sizeValEl) sizeValEl.textContent = size;
  if (qualityEl) qualityEl.value = quality;
  if (subLangEl) subLangEl.value = subLang;
  if (tvEl) tvEl.value = tvMode;
}

function handleTVSetting(value) {
  localStorage.setItem('tv_mode_setting', value);
  if (value === 'on') {
    localStorage.setItem('tv_mode', '1');
    document.body.classList.add('tv-mode');
  } else if (value === 'off') {
    localStorage.removeItem('tv_mode');
    document.body.classList.remove('tv-mode');
  } else {
    // Auto - let tv.js handle detection
    localStorage.removeItem('tv_mode');
    location.reload();
  }
}

function applyFont() {
  const fontEl = document.getElementById('fontFamily');
  const sizeEl = document.getElementById('fontSize');
  const preview = document.getElementById('fontPreview');

  const font = fontEl?.value || "'Cairo', sans-serif";
  const size = sizeEl?.value || '14';

  document.documentElement.style.setProperty('--font-family', font);
  document.documentElement.style.setProperty('font-size', size + 'px');

  if (preview) {
    preview.style.fontFamily = font;
    preview.style.fontSize = size + 'px';
  }

  localStorage.setItem('fontFamily', font);
  localStorage.setItem('fontSize', size);
}

function saveSetting(key, value) {
  localStorage.setItem(key, value);
}

// Apply saved font on load
(function() {
  const font = localStorage.getItem('fontFamily');
  const size = localStorage.getItem('fontSize');
  if (font) document.documentElement.style.setProperty('--font-family', font);
  if (size) document.documentElement.style.setProperty('font-size', size + 'px');
})();

// Toast notifications
function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// TMDB API Helper
const TMDB_IMG = 'https://image.tmdb.org/t/p/';
const TMDB_KEY = '25139e4f6eccde28a014b9230c815e83';
const TMDB_BASE = 'https://api.themoviedb.org/3';

async function tmdbFetch(endpoint, params = {}) {
  params.api_key = TMDB_KEY;
  if (!params.language) params.language = 'ar';
  const query = new URLSearchParams(params).toString();
  const url = `${TMDB_BASE}/${endpoint}?${query}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('TMDB Error: ' + res.status);
  return res.json();
}

// Favorites
function getFavorites(type) {
  return JSON.parse(localStorage.getItem('fav_' + type) || '[]');
}

function isFavorite(type, id) {
  return getFavorites(type).includes(String(id));
}

function toggleFavItem(type, id) {
  let favs = getFavorites(type);
  id = String(id);
  if (favs.includes(id)) {
    favs = favs.filter(f => f !== id);
    showToast('تمت الإزالة من المفضلة');
  } else {
    favs.push(id);
    showToast('تمت الإضافة للمفضلة');
  }
  localStorage.setItem('fav_' + type, JSON.stringify(favs));
  return favs.includes(id);
}

// Utility: Debounce
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Utility: Format runtime
function formatRuntime(mins) {
  if (!mins) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}س ${m}د` : `${m}د`;
}

// Utility: Rating stars
function ratingStars(vote) {
  const stars = Math.round((vote || 0) / 2);
  let html = '';
  for (let i = 0; i < 5; i++) {
    html += `<i class="fa${i < stars ? 's' : 'r'} fa-star"></i>`;
  }
  return html;
}

// Build media card HTML
function buildMediaCard(item, type = 'movie') {
  const title = item.title || item.name || '';
  const year = (item.release_date || item.first_air_date || '').substring(0, 4);
  const poster = item.poster_path ? TMDB_IMG + 'w342' + item.poster_path : '';
  const rating = item.vote_average ? item.vote_average.toFixed(1) : '';
  const id = item.id;

  return `
    <div class="media-card fade-in" onclick="openPlayer('${type}', ${id})">
      ${poster
        ? `<img class="poster" src="${poster}" alt="${title}" loading="lazy">`
        : `<div class="poster" style="display:flex;align-items:center;justify-content:center;background:var(--bg-surface)"><i class="fas fa-film" style="font-size:2rem;color:var(--text-muted)"></i></div>`
      }
      <div class="play-overlay"><i class="fas fa-play-circle"></i></div>
      ${rating ? `<div class="card-badge"><i class="fas fa-star"></i> ${rating}</div>` : ''}
      <div class="card-body">
        <div class="card-title">${title}</div>
        <div class="card-meta">
          ${year ? `<span class="card-year">${year}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

function openPlayer(type, id) {
  window.location.href = `player.html?type=${type}&id=${id}`;
}

// Close modal on backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('show');
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop.show').forEach(m => m.classList.remove('show'));
  }
});
