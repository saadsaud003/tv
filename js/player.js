/* ===========================
   Arab TV - Pro Player Module
   Multi-Source Player
   =========================== */

let mediaData = null;
let mediaType = 'movie';
let mediaId = 0;
let subtitles = [];
let currentSeason = 1;
let currentEpisode = 1;
let trailerKey = null;
let currentSourceIndex = parseInt(localStorage.getItem('lastSource') || '0');

// ── Multiple Embed Sources ──
const SOURCES = [
  { name: 'سيرفر 1', type: 'server', getUrl: (t, id, s, e) => t === 'movie' ? `https://vidsrc.cc/v2/embed/movie/${id}` : `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}` },
  { name: 'سيرفر 2', type: 'server', getUrl: (t, id, s, e) => t === 'movie' ? `https://player.autoembed.cc/embed/movie/${id}` : `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}` },
  { name: 'سيرفر 3', type: 'server', getUrl: (t, id, s, e) => t === 'movie' ? `https://player.videasy.net/movie/${id}` : `https://player.videasy.net/tv/${id}/${s}/${e}` },
  { name: 'Video.js', type: 'engine', icon: 'fab fa-js', getUrl: (t, id, s, e) => t === 'movie' ? `https://vidsrc.net/embed/movie/?tmdb=${id}` : `https://vidsrc.net/embed/tv/?tmdb=${id}&season=${s}&episode=${e}` },
  { name: 'Plyr', type: 'engine', icon: 'fas fa-play-circle', getUrl: (t, id, s, e) => t === 'movie' ? `https://2embed.skin/embed/movie/${id}` : `https://2embed.skin/embed/tv/${id}/${s}/${e}` },
  { name: 'ZWPlayer', type: 'engine', icon: 'fas fa-bolt', getUrl: (t, id, s, e) => t === 'movie' ? `https://moviesapi.club/movie/${id}` : `https://moviesapi.club/tv/${id}-${s}-${e}` },
];
if (currentSourceIndex < 0 || currentSourceIndex >= SOURCES.length) currentSourceIndex = 0;

function getEmbedUrl(type, id, s, e) {
  return SOURCES[currentSourceIndex].getUrl(type, id, s, e);
}

// ── Parse URL ──
const urlParams = new URLSearchParams(window.location.search);
mediaType = urlParams.get('type') || 'movie';
mediaId = parseInt(urlParams.get('id')) || 0;

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  if (!mediaId) {
    showPlayerError('لم يتم تحديد محتوى للتشغيل');
    return;
  }
  loadMediaDetails();
});

// ── Load media details from TMDB ──
async function loadMediaDetails() {
  try {
    const endpoint = mediaType === 'movie' ? `movie/${mediaId}` : `tv/${mediaId}`;

    const [details, credits, similar, videos] = await Promise.all([
      tmdbFetch(endpoint, { append_to_response: 'external_ids' }),
      tmdbFetch(`${endpoint}/credits`),
      tmdbFetch(`${endpoint}/similar`),
      tmdbFetch(`${endpoint}/videos`, { language: 'ar,en' })
    ]);

    mediaData = details;
    document.title = (details.title || details.name) + ' - تلفزيون العرب';

    // Set top bar title
    document.getElementById('topTitle').textContent = details.title || details.name || '';

    // Render info
    renderDetails(details, credits);
    renderSimilar(similar.results || []);

    // Save trailer
    const vids = videos.results || [];
    const trailer = vids.find(v => v.type === 'Trailer' && v.site === 'YouTube')
                 || vids.find(v => v.site === 'YouTube');
    if (trailer) {
      trailerKey = trailer.key;
      const tb = document.getElementById('trailerBtn');
      if (tb) tb.style.display = '';
    }

    // Start embed player
    embedPlayer();

    // Load subtitles
    loadSubtitles(details);

    // Episodes for TV
    if (mediaType === 'tv' && details.number_of_seasons > 0) {
      document.getElementById('episodeSection').style.display = 'block';
      renderSeasonTabs(details.number_of_seasons);
      loadEpisodes(1);
    }

    document.getElementById('detailsLoading').style.display = 'none';
    document.getElementById('detailsContent').style.display = 'block';

  } catch (e) {
    console.error('Load error:', e);
    document.getElementById('detailsLoading').innerHTML =
      '<i class="fas fa-exclamation-triangle" style="font-size:2rem;color:var(--accent-red)"></i>' +
      '<span>فشل تحميل البيانات</span>' +
      '<button class="btn btn-primary" onclick="loadMediaDetails()" style="margin-top:0.5rem">إعادة المحاولة</button>';
  }
}

// ── Embed Player ──
function embedPlayer() {
  renderSourceButtons();
  const container = document.getElementById('playerContainer');
  const loading = document.getElementById('playerLoading');

  const old = container.querySelector('iframe');
  if (old) old.remove();
  const err = container.querySelector('.player-error');
  if (err) err.remove();
  if (loading) loading.style.display = 'flex';

  const url = getEmbedUrl(mediaType, mediaId, currentSeason, currentEpisode);

  const iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.allow = 'autoplay; fullscreen; encrypted-media; picture-in-picture; clipboard-write';
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'origin';
  iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none;z-index:2';
  iframe.addEventListener('load', () => { if (loading) loading.style.display = 'none'; });
  setTimeout(() => { if (loading) loading.style.display = 'none'; }, 5000);
  container.appendChild(iframe);
}

// ── Switch Source ──
function switchSource(index) {
  if (index < 0 || index >= SOURCES.length) return;
  currentSourceIndex = index;
  localStorage.setItem('lastSource', String(index));
  embedPlayer();
  showToast('تم التبديل إلى ' + SOURCES[index].name);
}

// ── Render Source Buttons ──
function renderSourceButtons() {
  const serverDiv = document.getElementById('sourceButtons');
  const engineDiv = document.getElementById('engineButtons');
  if (!serverDiv) return;

  // Server buttons
  serverDiv.innerHTML = SOURCES
    .map((src, i) => ({ src, i }))
    .filter(x => x.src.type === 'server')
    .map(x => `<button class="source-btn ${x.i === currentSourceIndex ? 'active' : ''}" data-idx="${x.i}" onclick="switchSource(${x.i})">${x.src.name}</button>`)
    .join('');

  // Engine buttons
  if (engineDiv) {
    engineDiv.innerHTML = SOURCES
      .map((src, i) => ({ src, i }))
      .filter(x => x.src.type === 'engine')
      .map(x => `<button class="source-btn engine-src ${x.i === currentSourceIndex ? 'active' : ''}" data-idx="${x.i}" onclick="switchSource(${x.i})"><i class="${x.src.icon || 'fas fa-play'}"></i> ${x.src.name}</button>`)
      .join('');
  }
}

// ── Watch trailer ──
function watchTrailer() {
  if (!trailerKey) return;

  const container = document.getElementById('playerContainer');
  const loading = document.getElementById('playerLoading');
  const old = container.querySelector('iframe');
  if (old) old.remove();
  if (loading) loading.style.display = 'none';

  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1&hl=ar`;
  iframe.allow = 'autoplay; fullscreen; picture-in-picture';
  iframe.allowFullscreen = true;
  iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none;z-index:2';
  container.appendChild(iframe);

  // Deselect source buttons
  document.querySelectorAll('#sourceBar .source-btn[data-idx]').forEach(btn => btn.classList.remove('active'));
  showToast('جاري عرض التريلر');
}

// ── Open in new tab ──
function openInNewTab() {
  const url = getEmbedUrl(mediaType, mediaId, currentSeason, currentEpisode);
  window.open(url, '_blank');
}

// ── Show error ──
function showPlayerError(msg) {
  const container = document.getElementById('playerContainer');
  const loading = document.getElementById('playerLoading');
  if (loading) loading.style.display = 'none';

  const div = document.createElement('div');
  div.className = 'player-error';
  div.innerHTML = `
    <i class="fas fa-exclamation-circle"></i>
    <span>${msg}</span>
    <div class="error-actions">
      <button class="btn btn-primary" onclick="tryNextSource()">تجربة سيرفر آخر</button>
    </div>
  `;
  container.appendChild(div);
}

// ── Try next source ──
function tryNextSource() {
  const next = (currentSourceIndex + 1) % SOURCES.length;
  switchSource(next);
}

// ── Render details ──
function renderDetails(details, credits) {
  const title = details.title || details.name || '';
  const year = (details.release_date || details.first_air_date || '').substring(0, 4);
  const rating = details.vote_average ? details.vote_average.toFixed(1) : '';
  const runtime = details.runtime || (details.episode_run_time?.[0]) || 0;
  const genres = (details.genres || []).map(g => g.name).join('، ');
  const overview = details.overview || 'لا يوجد وصف متاح';
  const status = details.status === 'Released' ? 'صدر' : details.status === 'Returning Series' ? 'مستمر' : details.status || '';
  const director = credits?.crew?.find(c => c.job === 'Director');
  const cast = (credits?.cast || []).slice(0, 5).map(c => c.name).join('، ');

  document.getElementById('mediaTitle').textContent = title;

  let metaHTML = '';
  if (year) metaHTML += `<span><i class="fas fa-calendar-alt"></i> ${year}</span>`;
  if (rating) metaHTML += `<span class="rating"><i class="fas fa-star"></i> ${rating}/10</span>`;
  if (runtime) metaHTML += `<span><i class="far fa-clock"></i> ${formatRuntime(runtime)}</span>`;
  if (status) metaHTML += `<span><i class="fas fa-info-circle"></i> ${status}</span>`;
  if (genres) metaHTML += `<span><i class="fas fa-tags"></i> ${genres}</span>`;
  document.getElementById('mediaMeta').innerHTML = metaHTML;

  let overviewHTML = overview;
  if (director) overviewHTML += `<br><strong>الإخراج:</strong> ${director.name}`;
  if (cast) overviewHTML += `<br><strong>التمثيل:</strong> ${cast}`;
  document.getElementById('mediaOverview').innerHTML = overviewHTML;

  updateFavButton();
}

// ── Similar ──
function renderSimilar(items) {
  const filtered = items.filter(i => i.poster_path).slice(0, 12);
  const grid = document.getElementById('similarGrid');
  if (!grid) return;
  if (filtered.length === 0) {
    document.getElementById('similarSection').style.display = 'none';
    return;
  }
  grid.innerHTML = filtered.map(i => buildMediaCard(i, mediaType)).join('');
}

// ── Seasons & Episodes ──
function renderSeasonTabs(numSeasons) {
  let html = '';
  for (let i = 1; i <= numSeasons; i++) {
    html += `<button class="season-tab ${i === 1 ? 'active' : ''}" onclick="loadEpisodes(${i})" data-season="${i}">الموسم ${i}</button>`;
  }
  document.getElementById('seasonTabs').innerHTML = html;
}

async function loadEpisodes(seasonNum) {
  currentSeason = seasonNum;
  document.querySelectorAll('.season-tab').forEach(t => {
    t.classList.toggle('active', parseInt(t.dataset.season) === seasonNum);
  });

  const list = document.getElementById('episodeList');
  list.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';

  try {
    const data = await tmdbFetch(`tv/${mediaId}/season/${seasonNum}`);
    const episodes = data.episodes || [];

    if (episodes.length === 0) {
      list.innerHTML = '<div class="empty-state"><span>لا توجد حلقات</span></div>';
      return;
    }

    list.innerHTML = episodes.map(ep => {
      const still = ep.still_path ? TMDB_IMG + 'w300' + ep.still_path : '';
      return `
        <div class="episode-item" onclick="playEpisode(${seasonNum}, ${ep.episode_number})" data-ep="${ep.episode_number}">
          <div class="ep-thumb">
            ${still
              ? `<img src="${still}" alt="حلقة ${ep.episode_number}" loading="lazy">`
              : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--bg-surface)"><i class="fas fa-play" style="color:var(--text-muted)"></i></div>`
            }
          </div>
          <div class="ep-info">
            <div class="ep-title">الحلقة ${ep.episode_number}${ep.name ? ': ' + ep.name : ''}</div>
            <div class="ep-meta">
              ${ep.air_date || ''}
              ${ep.runtime ? ' • ' + formatRuntime(ep.runtime) : ''}
              ${ep.vote_average ? ' • <i class="fas fa-star" style="color:var(--accent-orange)"></i> ' + ep.vote_average.toFixed(1) : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch (e) {
    list.innerHTML = '<div class="empty-state"><span>فشل تحميل الحلقات</span></div>';
  }
}

function playEpisode(season, episode) {
  currentSeason = season;
  currentEpisode = episode;

  document.querySelectorAll('.episode-item').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.ep) === episode);
  });

  // Re-embed with correct season/episode
  embedPlayer();

  // Subtitles
  if (mediaData) loadSubtitles(mediaData, season, episode);

  showToast(`الموسم ${season} - الحلقة ${episode}`);

  // Scroll to player
  document.getElementById('playerContainer')?.scrollIntoView({ behavior: 'smooth' });
}

// ── Subtitles ──
async function loadSubtitles(details, season = 0, episode = 0) {
  const lang = localStorage.getItem('subtitleLang') || 'ara';
  const imdbId = details.external_ids?.imdb_id || details.imdb_id || '';
  const title = details.title || details.name || '';

  try {
    const p = new URLSearchParams({
      tmdb_id: details.id, imdb_id: imdbId, title, lang,
      type: mediaType, season, episode
    });
    const res = await fetch('api/subtitles.php?' + p);
    const data = await res.json();
    subtitles = data.results || [];
  } catch (e) {
    console.warn('Subtitles not available');
  }
}

// ── Subtitle Panel (Substital-style) ──
function openSubPanel() {
  document.getElementById('subPanelOverlay')?.classList.add('open');
  // Set saved language
  const saved = localStorage.getItem('subtitleLang') || 'ara';
  const sel = document.getElementById('subLangSelect');
  if (sel) sel.value = saved;
  // Auto-search if we have data
  if (mediaData) searchSubtitles();
}

function closeSubPanel() {
  document.getElementById('subPanelOverlay')?.classList.remove('open');
}

async function searchSubtitles() {
  if (!mediaData) return;

  const lang = document.getElementById('subLangSelect')?.value || 'ara';
  localStorage.setItem('subtitleLang', lang);

  const resultsDiv = document.getElementById('subResults');
  if (!resultsDiv) return;
  resultsDiv.innerHTML = '<div class="sub-empty"><div class="spinner" style="margin:0 auto 0.5rem"></div>جاري البحث عن ترجمات...</div>';

  const imdbId = mediaData.external_ids?.imdb_id || mediaData.imdb_id || '';
  const title = mediaData.title || mediaData.name || '';

  try {
    const p = new URLSearchParams({
      tmdb_id: mediaData.id,
      imdb_id: imdbId,
      title: title,
      lang: lang,
      type: mediaType,
      season: mediaType === 'tv' ? currentSeason : 0,
      episode: mediaType === 'tv' ? currentEpisode : 0
    });

    const res = await fetch('api/subtitles.php?' + p);
    const data = await res.json();
    const subs = data.results || [];

    if (subs.length === 0) {
      resultsDiv.innerHTML = '<div class="sub-empty"><i class="fas fa-search" style="font-size:2rem;opacity:0.3;display:block;margin-bottom:0.5rem"></i>لا توجد ترجمات متاحة لهذه اللغة<br><small>جرب لغة أخرى</small></div>';
      return;
    }

    // Group by source
    const grouped = {};
    subs.forEach(sub => {
      const src = sub.source || 'Unknown';
      if (!grouped[src]) grouped[src] = [];
      grouped[src].push(sub);
    });

    let html = '';
    const sourceIcons = {
      'OpenSubtitles': 'fas fa-globe',
      'Podnapisi': 'fas fa-database',
      'YTS': 'fas fa-film',
      'Subscene': 'fas fa-align-left'
    };

    Object.entries(grouped).forEach(([source, items]) => {
      const icon = sourceIcons[source] || 'fas fa-file-alt';
      html += `<div class="sub-source-label"><i class="${icon}"></i> ${source} (${items.length})</div>`;
      items.forEach((sub, idx) => {
        const dlCount = sub.download_count ? sub.download_count.toLocaleString() : '';
        const rating = sub.rating ? '⭐ ' + Number(sub.rating).toFixed(1) : '';
        const format = sub.format || 'srt';
        html += `<div class="sub-item" tabindex="0">
          <div class="sub-info">
            <div class="sub-name">${sub.name || 'ترجمة'}</div>
            <div class="sub-meta">
              ${dlCount ? `<span><i class="fas fa-download"></i> ${dlCount}</span>` : ''}
              ${rating ? `<span>${rating}</span>` : ''}
              <span>${format.toUpperCase()}</span>
            </div>
          </div>
          <button class="sub-dl" onclick="downloadSubtitle('${source}', ${idx})" tabindex="0"><i class="fas fa-download"></i> تحميل</button>
        </div>`;
      });
    });

    resultsDiv.innerHTML = html;

    // Save for download
    window._subResults = grouped;

  } catch (e) {
    console.error('Subtitle search error:', e);
    resultsDiv.innerHTML = '<div class="sub-empty"><i class="fas fa-exclamation-triangle" style="color:var(--accent-red);font-size:1.5rem;display:block;margin-bottom:0.5rem"></i>فشل البحث عن ترجمات</div>';
  }
}

function downloadSubtitle(source, idx) {
  if (!window._subResults || !window._subResults[source]) return;
  const sub = window._subResults[source][idx];
  if (!sub) return;

  let downloadUrl = '';

  if (sub.file_id) {
    // OpenSubtitles - download via our proxy
    downloadUrl = 'api/subtitles.php?action=download&url=' + encodeURIComponent('https://api.opensubtitles.com/api/v1/download') + '&file_id=' + sub.file_id;
  } else if (sub.url) {
    // Direct URL (Podnapisi, YTS, Subscene)
    downloadUrl = 'api/subtitles.php?action=download&url=' + encodeURIComponent(sub.url);
  }

  if (downloadUrl) {
    // Open download in new tab/trigger download
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = (sub.name || 'subtitle') + '.' + (sub.format || 'srt');
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('جاري تحميل الترجمة: ' + (sub.name || source));
  } else {
    showToast('رابط التحميل غير متاح');
  }
}

// ── Fullscreen ──
function toggleFullscreen() {
  const el = document.getElementById('playerContainer');
  if (!el) return;
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    el.requestFullscreen().catch(() => {});
  }
}

// ── Favorites ──
function toggleFav() {
  if (!mediaData) return;
  toggleFavItem(mediaType, mediaData.id);
  updateFavButton();
}

function updateFavButton() {
  if (!mediaData) return;
  const btn = document.getElementById('favBtn');
  const fav = isFavorite(mediaType, mediaData.id);
  if (btn) btn.innerHTML = `<i class="fa${fav ? 's' : 'r'} fa-heart" style="color:${fav ? 'var(--accent-red)' : ''}"></i> المفضلة`;
}

// ── Share ──
function shareMedia() {
  if (!mediaData) return;
  const title = mediaData.title || mediaData.name;
  const url = window.location.href;
  if (navigator.share) {
    navigator.share({ title, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => showToast('تم نسخ الرابط'));
  }
}

// ── Keyboard shortcuts ──
document.addEventListener('keydown', e => {
  if (e.key === 'f' || e.key === 'F') toggleFullscreen();
  if (e.key === 'Escape' && document.fullscreenElement) document.exitFullscreen();
});
