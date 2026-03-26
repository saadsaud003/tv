/* ===========================
   Arab TV - Series Module
   Sidebar + Advanced Search
   =========================== */

let currentPage = 1;
let currentSort = 'popular';
let currentGenre = 0;
let currentYear = '';
let currentLang = '';
let totalPages = 1;
let totalResults = 0;
let genres = [];
let isSearching = false;
let searchQuery = '';

document.addEventListener('DOMContentLoaded', async () => {
  buildYearFilter();
  await loadGenres();
  loadSeries();
});

function buildYearFilter() {
  const sel = document.getElementById('yearFilter');
  if (!sel) return;
  const now = new Date().getFullYear();
  for (let y = now; y >= 1950; y--) {
    sel.innerHTML += `<option value="${y}">${y}</option>`;
  }
}

async function loadGenres() {
  try {
    const data = await tmdbFetch('genre/tv/list');
    genres = data.genres || [];
    const list = document.getElementById('genreList');
    if (!list) return;

    let html = genreItem(0, 'الكل', 'fas fa-globe', true);
    genres.forEach(g => {
      const icon = genreIcon(g.id);
      html += genreItem(g.id, g.name, icon);
    });
    list.innerHTML = html;
  } catch (e) {
    console.error('Failed to load genres:', e);
  }
}

function genreIcon(id) {
  const map = {
    10759:'fas fa-fist-raised', 16:'fas fa-wand-magic-sparkles', 35:'fas fa-face-laugh',
    80:'fas fa-user-secret', 99:'fas fa-book', 18:'fas fa-masks-theater',
    10751:'fas fa-people-roof', 10762:'fas fa-child', 9648:'fas fa-magnifying-glass',
    10763:'fas fa-newspaper', 10764:'fas fa-users', 10765:'fas fa-rocket',
    10766:'fas fa-tv', 10767:'fas fa-microphone', 10768:'fas fa-shield-halved',
    37:'fas fa-hat-cowboy'
  };
  return map[id] || 'fas fa-video';
}

function genreItem(id, name, icon, active = false) {
  return `<div class="category-item ${active ? 'active' : ''}" data-id="${id}" onclick="selectGenre(${id})">
    <span class="cat-icon"><i class="${icon}"></i></span>
    <span class="cat-name">${name}</span>
    <span class="cat-count" id="gc_${id}">-</span>
  </div>`;
}

function selectGenre(id) {
  currentGenre = id;
  currentPage = 1;
  isSearching = false;
  document.getElementById('searchInput').value = '';

  document.querySelectorAll('#genreList .category-item').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.id) === id);
  });

  const genreName = id === 0 ? 'الكل' : (genres.find(g => g.id === id)?.name || '');
  document.getElementById('activeGenre').textContent = genreName;

  loadSeries();
}

function applyFilters() {
  currentSort = document.getElementById('sortFilter')?.value || 'popular';
  currentYear = document.getElementById('yearFilter')?.value || '';
  currentLang = document.getElementById('langFilter')?.value || '';
  currentPage = 1;
  isSearching = false;
  loadSeries();
}

async function loadSeries(page = 1) {
  const grid = document.getElementById('seriesGrid');
  if (page === 1) {
    grid.innerHTML = Array(8).fill('<div class="media-card skeleton" style="aspect-ratio:2/3"></div>').join('');
  }

  try {
    let data;
    const params = { page };

    if (currentGenre > 0 || currentYear || currentLang) {
      params.sort_by = sortParam(currentSort);
      if (currentGenre > 0) params.with_genres = currentGenre;
      if (currentYear) params.first_air_date_year = currentYear;
      if (currentLang === 'subtitled_ar') {
        params.without_original_language = 'ar';
        params['vote_count.gte'] = 100;
      } else {
        if (currentLang) params.with_original_language = currentLang;
        params['vote_count.gte'] = 5;
      }
      data = await tmdbFetch('discover/tv', params);
    } else {
      data = await tmdbFetch(`tv/${currentSort}`, params);
    }

    totalPages = Math.min(data.total_pages || 1, 500);
    totalResults = data.total_results || 0;
    currentPage = page;

    let series = (data.results || []).filter(s => s.poster_path);
    if (currentLang === 'subtitled_ar') series = series.filter(s => s.overview && s.overview.trim().length > 0);

    if (page === 1) grid.innerHTML = '';

    if (series.length === 0 && page === 1) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><i class="fas fa-video"></i><span>لا توجد نتائج</span></div>';
      document.getElementById('resultCount').textContent = '0 نتيجة';
      return;
    }

    grid.innerHTML += series.map(s => buildMediaCard(s, 'tv')).join('');
    document.getElementById('resultCount').textContent = `${totalResults.toLocaleString()} مسلسل`;

    const lm = document.getElementById('loadMore');
    if (lm) lm.style.display = currentPage < totalPages ? 'flex' : 'none';

  } catch (e) {
    console.error('Failed to load series:', e);
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><i class="fas fa-exclamation-triangle"></i><span>فشل التحميل</span><button class="btn btn-primary" onclick="loadSeries()" style="margin-top:0.5rem">إعادة المحاولة</button></div>';
  }
}

function sortParam(sort) {
  const map = { popular: 'popularity.desc', top_rated: 'vote_average.desc', on_the_air: 'first_air_date.desc', airing_today: 'popularity.desc' };
  return map[sort] || 'popularity.desc';
}

function loadNextPage() {
  if (currentPage >= totalPages) return;
  if (isSearching) searchPage(currentPage + 1);
  else loadSeries(currentPage + 1);
}

// ── Dynamic Search ──
const onSearch = debounce(async (query) => {
  searchQuery = query;
  if (!query || query.length < 2) {
    isSearching = false;
    loadSeries(1);
    return;
  }
  isSearching = true;
  currentPage = 1;

  const grid = document.getElementById('seriesGrid');
  grid.innerHTML = Array(6).fill('<div class="media-card skeleton" style="aspect-ratio:2/3"></div>').join('');

  try {
    const data = await tmdbFetch('search/tv', { query, page: 1 });
    totalPages = Math.min(data.total_pages || 1, 500);
    totalResults = data.total_results || 0;
    currentPage = 1;

    const series = (data.results || []).filter(s => s.poster_path);
    document.getElementById('resultCount').textContent = `${totalResults.toLocaleString()} نتيجة لـ "${query}"`;
    document.getElementById('activeGenre').textContent = 'بحث';

    if (series.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><i class="fas fa-search"></i><span>لا توجد نتائج لـ "${query}"</span></div>`;
      return;
    }

    grid.innerHTML = series.map(s => buildMediaCard(s, 'tv')).join('');

    const lm = document.getElementById('loadMore');
    if (lm) lm.style.display = currentPage < totalPages ? 'flex' : 'none';
  } catch (e) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><i class="fas fa-exclamation-triangle"></i><span>خطأ في البحث</span></div>';
  }
}, 350);

async function searchPage(page) {
  try {
    const data = await tmdbFetch('search/tv', { query: searchQuery, page });
    currentPage = page;
    const series = (data.results || []).filter(s => s.poster_path);
    document.getElementById('seriesGrid').innerHTML += series.map(s => buildMediaCard(s, 'tv')).join('');
    const lm = document.getElementById('loadMore');
    if (lm) lm.style.display = currentPage < totalPages ? 'flex' : 'none';
  } catch (e) { showToast('خطأ في تحميل المزيد'); }
}
