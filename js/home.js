/* ===========================
   Arab TV - Home Page Module
   Hero + Content Rows
   =========================== */

document.addEventListener('DOMContentLoaded', () => {
  loadHero();
  loadTrendingMovies();
  loadTrendingSeries();
  loadTopChannels();
});

// ── Hero Banner - Trending movie/show ──
async function loadHero() {
  try {
    const data = await tmdbFetch('trending/all/day');
    const items = (data.results || []).filter(i => i.backdrop_path && i.overview);
    if (!items.length) return;

    // Pick a random item from top 5
    const item = items[Math.floor(Math.random() * Math.min(5, items.length))];
    const type = item.media_type || (item.title ? 'movie' : 'tv');
    const title = item.title || item.name || '';
    const year = (item.release_date || item.first_air_date || '').substring(0, 4);
    const rating = item.vote_average ? item.vote_average.toFixed(1) : '';
    const overview = item.overview.length > 150 ? item.overview.substring(0, 150) + '...' : item.overview;

    const hero = document.getElementById('heroSection');
    if (!hero) return;

    hero.style.backgroundImage = `url(${TMDB_IMG}w1280${item.backdrop_path})`;
    hero.innerHTML = `
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <h1 class="hero-title">${title}</h1>
        <div class="hero-meta">
          ${year ? `<span><i class="fas fa-calendar-alt"></i> ${year}</span>` : ''}
          ${rating ? `<span class="hero-rating"><i class="fas fa-star"></i> ${rating}</span>` : ''}
          <span><i class="fas fa-${type === 'movie' ? 'film' : 'tv'}"></i> ${type === 'movie' ? 'فيلم' : 'مسلسل'}</span>
        </div>
        <p class="hero-desc">${overview}</p>
        <div class="hero-actions">
          <a href="player.html?type=${type}&id=${item.id}" class="btn btn-primary btn-lg"><i class="fas fa-play"></i> شاهد الآن</a>
          <button class="btn btn-secondary btn-lg" onclick="toggleFavItem('${type}', ${item.id}); this.querySelector('i').classList.toggle('fas'); this.querySelector('i').classList.toggle('far');"><i class="far fa-heart"></i> المفضلة</button>
        </div>
      </div>
    `;
    hero.classList.add('loaded');
  } catch (e) {
    console.error('Hero load error:', e);
  }
}

// ── Trending Movies Row ──
async function loadTrendingMovies() {
  try {
    const data = await tmdbFetch('trending/movie/week');
    const movies = (data.results || []).filter(m => m.poster_path).slice(0, 20);
    renderRow('moviesRow', movies, 'movie');
  } catch (e) {
    console.error('Trending movies error:', e);
  }
}

// ── Trending Series Row ──
async function loadTrendingSeries() {
  try {
    const data = await tmdbFetch('trending/tv/week');
    const series = (data.results || []).filter(s => s.poster_path).slice(0, 20);
    renderRow('seriesRow', series, 'tv');
  } catch (e) {
    console.error('Trending series error:', e);
  }
}

// ── Top Channels (from IPTV API) ──
async function loadTopChannels() {
  try {
    const [channelsRes, streamsRes, logosRes] = await Promise.all([
      fetch('https://iptv-org.github.io/api/channels.json'),
      fetch('https://iptv-org.github.io/api/streams.json'),
      fetch('https://iptv-org.github.io/api/logos.json').catch(() => null)
    ]);

    const [channels, streams] = await Promise.all([
      channelsRes.json(), streamsRes.json()
    ]);

    // Build logos lookup
    const logos = {};
    if (logosRes && logosRes.ok) {
      try {
        const logosRaw = await logosRes.json();
        logosRaw.forEach(l => { if (l.channel && l.url && !logos[l.channel]) logos[l.channel] = l.url; });
      } catch(e) {}
    }

    // Build stream lookup
    const streamSet = new Set(streams.map(s => s.channel));

    // Arabic character check
    const isArabic = str => /[\u0600-\u06FF]/.test(str);

    // Filter: Arabic language channels with streams, prioritize those with logos
    const arabicChannels = channels
      .filter(ch => streamSet.has(ch.id) && (ch.languages || []).includes('ara'))
      .map(ch => ({
        id: ch.id,
        name: ch.name,
        displayName: (ch.alt_names || []).find(n => isArabic(n)) || ch.name,
        logo: ch.logo || logos[ch.id] || '',
        categories: ch.categories || []
      }))
      .filter(ch => ch.logo) // Only show channels with logos on home
      .slice(0, 30);

    renderChannelRow('channelsRow', arabicChannels);
  } catch (e) {
    console.error('Channels load error:', e);
  }
}

// ── Render media row ──
function renderRow(containerId, items, type) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = items.map(item => {
    const title = item.title || item.name || '';
    const poster = TMDB_IMG + 'w342' + item.poster_path;
    const rating = item.vote_average ? item.vote_average.toFixed(1) : '';
    return `
      <div class="scroll-card" onclick="openPlayer('${type}', ${item.id})">
        <img src="${poster}" alt="${title}" loading="lazy">
        <div class="scroll-card-overlay">
          <i class="fas fa-play-circle"></i>
        </div>
        ${rating ? `<div class="scroll-badge"><i class="fas fa-star"></i> ${rating}</div>` : ''}
        <div class="scroll-title">${title}</div>
      </div>
    `;
  }).join('');
}

// ── Render channel row ──
function renderChannelRow(containerId, channels) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = channels.map(ch => `
    <a href="live.html#${ch.id}" class="channel-card">
      <div class="channel-card-logo">
        <img src="${ch.logo}" alt="${ch.displayName}" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='<i class=\\'fas fa-tv\\'></i>'">
      </div>
      <div class="channel-card-name">${ch.displayName}</div>
    </a>
  `).join('');
}

// ── Scroll buttons ──
function scrollRow(containerId, dir) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const amount = el.clientWidth * 0.7;
  el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
}
