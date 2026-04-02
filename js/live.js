/* ===========================
   Arab TV - Live TV Module
   Optimized for Smart TV
   =========================== */

let allChannels = [];
let currentCategory = 'all';
let currentChannel = null;
let hlsPlayer = null;
let countriesData = {};
let languagesData = {};
let logosData = {};
let currentPlayerEngine = localStorage.getItem('playerEngine') || 'default';

const CATEGORY_MAP = {
  'all': { name: 'الكل', icon: 'fas fa-globe' },
  'animation': { name: 'رسوم متحركة', icon: 'fas fa-wand-magic-sparkles' },
  'auto': { name: 'سيارات', icon: 'fas fa-car' },
  'business': { name: 'اقتصاد', icon: 'fas fa-chart-line' },
  'classic': { name: 'كلاسيك', icon: 'fas fa-clock' },
  'comedy': { name: 'كوميديا', icon: 'fas fa-face-laugh' },
  'cooking': { name: 'طبخ', icon: 'fas fa-utensils' },
  'culture': { name: 'ثقافة', icon: 'fas fa-landmark' },
  'documentary': { name: 'وثائقية', icon: 'fas fa-book' },
  'education': { name: 'تعليمية', icon: 'fas fa-graduation-cap' },
  'entertainment': { name: 'ترفيه', icon: 'fas fa-masks-theater' },
  'family': { name: 'عائلي', icon: 'fas fa-people-roof' },
  'general': { name: 'عامة', icon: 'fas fa-tv' },
  'kids': { name: 'أطفال', icon: 'fas fa-child' },
  'legislative': { name: 'برلمان', icon: 'fas fa-landmark-dome' },
  'lifestyle': { name: 'لايف ستايل', icon: 'fas fa-heart' },
  'movies': { name: 'أفلام', icon: 'fas fa-film' },
  'music': { name: 'موسيقى', icon: 'fas fa-music' },
  'news': { name: 'أخبار', icon: 'fas fa-newspaper' },
  'outdoor': { name: 'خارجي', icon: 'fas fa-mountain-sun' },
  'relax': { name: 'استرخاء', icon: 'fas fa-spa' },
  'religious': { name: 'دينية', icon: 'fas fa-mosque' },
  'science': { name: 'علوم', icon: 'fas fa-flask' },
  'series': { name: 'مسلسلات', icon: 'fas fa-video' },
  'shop': { name: 'تسوق', icon: 'fas fa-shopping-bag' },
  'sports': { name: 'رياضة', icon: 'fas fa-futbol' },
  'travel': { name: 'سفر', icon: 'fas fa-plane' },
  'weather': { name: 'طقس', icon: 'fas fa-cloud-sun' },
  'xxx': { name: 'للكبار', icon: 'fas fa-ban' }
};

const COUNTRY_AR = {
  'AF':'أفغانستان','AL':'ألبانيا','DZ':'الجزائر','AD':'أندورا','AO':'أنغولا',
  'AR':'الأرجنتين','AM':'أرمينيا','AU':'أستراليا','AT':'النمسا','AZ':'أذربيجان',
  'BH':'البحرين','BD':'بنغلاديش','BY':'بيلاروسيا','BE':'بلجيكا','BJ':'بنين',
  'BO':'بوليفيا','BA':'البوسنة','BR':'البرازيل','BN':'بروناي','BG':'بلغاريا',
  'KH':'كمبوديا','CM':'الكاميرون','CA':'كندا','CF':'أفريقيا الوسطى','TD':'تشاد',
  'CL':'تشيلي','CN':'الصين','CO':'كولومبيا','KM':'جزر القمر','CG':'الكونغو',
  'CR':'كوستاريكا','HR':'كرواتيا','CU':'كوبا','CY':'قبرص','CZ':'التشيك',
  'DK':'الدنمارك','DJ':'جيبوتي','DO':'الدومينيكان','EC':'الإكوادور','EG':'مصر',
  'SV':'السلفادور','GQ':'غينيا الاستوائية','ER':'إريتريا','EE':'إستونيا','ET':'إثيوبيا',
  'FI':'فنلندا','FR':'فرنسا','GA':'الغابون','GM':'غامبيا','GE':'جورجيا',
  'DE':'ألمانيا','GH':'غانا','GR':'اليونان','GT':'غواتيمالا','GN':'غينيا',
  'HT':'هايتي','HN':'هندوراس','HK':'هونغ كونغ','HU':'المجر','IS':'آيسلندا',
  'IN':'الهند','ID':'إندونيسيا','IR':'إيران','IQ':'العراق','IE':'أيرلندا',
  'IL':'إسرائيل','IT':'إيطاليا','JM':'جامايكا','JP':'اليابان','JO':'الأردن',
  'KZ':'كازاخستان','KE':'كينيا','KW':'الكويت','KG':'قيرغيزستان','LA':'لاوس',
  'LV':'لاتفيا','LB':'لبنان','LY':'ليبيا','LT':'ليتوانيا','LU':'لوكسمبورغ',
  'MO':'ماكاو','MK':'مقدونيا','MG':'مدغشقر','MY':'ماليزيا','ML':'مالي',
  'MT':'مالطا','MR':'موريتانيا','MU':'موريشيوس','MX':'المكسيك','MD':'مولدوفا',
  'MN':'منغوليا','ME':'الجبل الأسود','MA':'المغرب','MZ':'موزمبيق','MM':'ميانمار',
  'NA':'ناميبيا','NP':'نيبال','NL':'هولندا','NZ':'نيوزيلندا','NI':'نيكاراغوا',
  'NE':'النيجر','NG':'نيجيريا','KP':'كوريا الشمالية','NO':'النرويج','OM':'عُمان',
  'PK':'باكستان','PS':'فلسطين','PA':'بنما','PY':'باراغواي','PE':'بيرو',
  'PH':'الفلبين','PL':'بولندا','PT':'البرتغال','QA':'قطر','RO':'رومانيا',
  'RU':'روسيا','RW':'رواندا','SA':'السعودية','SN':'السنغال','RS':'صربيا',
  'SG':'سنغافورة','SK':'سلوفاكيا','SI':'سلوفينيا','SO':'الصومال','ZA':'جنوب أفريقيا',
  'KR':'كوريا الجنوبية','ES':'إسبانيا','LK':'سريلانكا','SD':'السودان','SE':'السويد',
  'CH':'سويسرا','SY':'سوريا','TW':'تايوان','TJ':'طاجيكستان','TZ':'تنزانيا',
  'TH':'تايلاند','TN':'تونس','TR':'تركيا','TM':'تركمانستان','UG':'أوغندا',
  'UA':'أوكرانيا','AE':'الإمارات','GB':'بريطانيا','US':'أمريكا','UY':'أوروغواي',
  'UZ':'أوزبكستان','VE':'فنزويلا','VN':'فيتنام','YE':'اليمن','ZM':'زامبيا','ZW':'زيمبابوي',
  'UNDEFINED': 'غير محدد', 'INT': 'دولي'
};

const LANG_AR = {
  'ara':'العربية','eng':'الإنجليزية','fra':'الفرنسية','spa':'الإسبانية','deu':'الألمانية',
  'por':'البرتغالية','tur':'التركية','fas':'الفارسية','urd':'الأردو','hin':'الهندية',
  'rus':'الروسية','zho':'الصينية','jpn':'اليابانية','kor':'الكورية','ita':'الإيطالية',
  'nld':'الهولندية','pol':'البولندية','ron':'الرومانية','tha':'التايلاندية','vie':'الفيتنامية',
  'ind':'الإندونيسية','msa':'الملايوية','ben':'البنغالية','swa':'السواحيلية','tam':'التاميلية',
  'tel':'التيلوغية','pus':'البشتو','kur':'الكردية','heb':'العبرية','aze':'الأذرية',
  'uzb':'الأوزبكية','ukr':'الأوكرانية','kat':'الجورجية','bul':'البلغارية','srp':'الصربية',
  'hrv':'الكرواتية','ell':'اليونانية','ces':'التشيكية','hun':'المجرية','swe':'السويدية',
  'nor':'النرويجية','dan':'الدنماركية','fin':'الفنلندية','cat':'الكتالانية','eus':'الباسكية',
  'amh':'الأمهرية','som':'الصومالية','hau':'الهوسا','yor':'اليوروبا','ibo':'الإيبو',
  'mul':'متعددة'
};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    document.getElementById('channelList').innerHTML = '<div class="loading-state"><div class="spinner"></div><span>جاري التحميل...</span></div>';

    // Step 1: Fetch channels + streams + logos
    const [channelsRes, streamsRes, logosRes] = await Promise.all([
      fetch('https://iptv-org.github.io/api/channels.json'),
      fetch('https://iptv-org.github.io/api/streams.json'),
      fetch('https://iptv-org.github.io/api/logos.json').catch(() => null)
    ]);

    const [channelsRaw, streamsRaw] = await Promise.all([
      channelsRes.json(), streamsRes.json()
    ]);

    // Build logos lookup by channel ID
    if (logosRes && logosRes.ok) {
      try {
        const logosRaw = await logosRes.json();
        logosRaw.forEach(l => {
          if (l.channel && l.url) {
            // Keep the first (best) logo per channel
            if (!logosData[l.channel]) logosData[l.channel] = l.url;
          }
        });
      } catch(e) { /* logos non-critical */ }
    }

    // Build stream lookup
    const streamMap = {};
    streamsRaw.forEach(s => {
      if (!streamMap[s.channel]) streamMap[s.channel] = [];
      streamMap[s.channel].push(s);
    });

    // Build channels - only those with streams
    let num = 0;
    // Arabic character range check
    const isArabic = str => /[\u0600-\u06FF]/.test(str);

    allChannels = channelsRaw
      .filter(ch => streamMap[ch.id])
      .map(ch => {
        num++;
        const countryCode = ch.country || '';
        const countryName = COUNTRY_AR[countryCode] || countryCode;
        const langNames = (ch.languages || []).map(l => LANG_AR[l] || l);
        // Prefer Arabic name from alt_names
        const arName = (ch.alt_names || []).find(n => isArabic(n));
        const displayName = arName || ch.name;
        return {
          id: ch.id,
          name: ch.name,
          displayName,
          alt_names: ch.alt_names,
          country: ch.country,
          languages: ch.languages,
          categories: ch.categories,
          streams: streamMap[ch.id],
          num,
          countryName,
          langNames,
          logoUrl: ch.logo || logosData[ch.id] || ''
        };
      });

    // Render immediately with essential data
    buildCategories();
    renderChannels();
    document.getElementById('channelCount').textContent = `القنوات (${allChannels.length})`;

    // Step 2: Lazily load supplementary data (countries/languages names)
    loadSupplementaryData();

  } catch (err) {
    console.error('Failed to load channels:', err);
    document.getElementById('channelList').innerHTML =
      '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><span>فشل تحميل القنوات</span><button class="btn btn-primary" onclick="init()" style="margin-top:0.5rem">إعادة المحاولة</button></div>';
  }
}

// Load countries/languages in background (non-blocking)
async function loadSupplementaryData() {
  try {
    const [countriesRes, languagesRes] = await Promise.all([
      fetch('https://iptv-org.github.io/api/countries.json'),
      fetch('https://iptv-org.github.io/api/languages.json')
    ]);
    const [countriesRaw, languagesRaw] = await Promise.all([
      countriesRes.json(), languagesRes.json()
    ]);
    countriesRaw.forEach(c => { countriesData[c.code] = c; });
    languagesRaw.forEach(l => { languagesData[l.code] = l; });
  } catch (e) {
    // Non-critical, silently fail
  }
}

function buildCategories() {
  const catCounts = { all: allChannels.length };

  allChannels.forEach(ch => {
    (ch.categories || []).forEach(cat => { catCounts[cat] = (catCounts[cat] || 0) + 1; });
  });

  const tabs = document.getElementById('categoryTabs');
  if (!tabs) return;

  const item = (id, icon, name, count, active) =>
    `<div class="cat-item${active ? ' active' : ''}" data-cat="${id}" onclick="selectCategory('${id}')">
      <i class="${icon}"></i><span class="cat-name">${name}</span><span class="cat-count">${count}</span>
    </div>`;

  let html = '';
  html += item('all', 'fas fa-globe', 'الكل', allChannels.length, true);
  html += item('favorites', 'fas fa-heart', 'المفضلة', getFavorites('live').length, false);

  // Top categories by count
  Object.entries(catCounts)
    .filter(([k]) => k !== 'all')
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const info = CATEGORY_MAP[cat] || { name: cat, icon: 'fas fa-folder' };
      html += item('cat_' + cat, info.icon, info.name, count, false);
    });

  // Top languages
  const langCounts = {};
  allChannels.forEach(ch => {
    (ch.languages || []).forEach(l => { langCounts[l] = (langCounts[l] || 0) + 1; });
  });
  Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([code, count]) => {
      const name = LANG_AR[code] || code;
      html += item('lang_' + code, 'fas fa-language', name, count, false);
    });

  // Top countries
  const countryCounts = {};
  allChannels.forEach(ch => {
    if (ch.country) countryCounts[ch.country] = (countryCounts[ch.country] || 0) + 1;
  });
  Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([code, count]) => {
      const name = COUNTRY_AR[code] || code;
      html += item('country_' + code, 'fas fa-flag', name, count, false);
    });

  tabs.innerHTML = html;
}

function selectCategory(catId) {
  currentCategory = catId;
  document.querySelectorAll('.cat-item').forEach(el => {
    el.classList.toggle('active', el.dataset.cat === catId);
  });
  renderChannels();
}

// ── Render channels (small batches for TV) ──
const RENDER_BATCH = 40;
let renderedCount = 0;
let filteredChannels = [];

function renderChannels(filter = '') {
  filteredChannels = [...allChannels];

  if (currentCategory === 'favorites') {
    const favs = getFavorites('live');
    filteredChannels = filteredChannels.filter(ch => favs.includes(ch.id));
  } else if (currentCategory.startsWith('cat_')) {
    const cat = currentCategory.replace('cat_', '');
    filteredChannels = filteredChannels.filter(ch => (ch.categories || []).includes(cat));
  } else if (currentCategory.startsWith('country_')) {
    const country = currentCategory.replace('country_', '');
    filteredChannels = filteredChannels.filter(ch => ch.country === country);
  } else if (currentCategory.startsWith('lang_')) {
    const lang = currentCategory.replace('lang_', '');
    filteredChannels = filteredChannels.filter(ch => (ch.languages || []).includes(lang));
  }

  if (filter) {
    const q = filter.toLowerCase();
    filteredChannels = filteredChannels.filter(ch =>
      (ch.displayName || '').toLowerCase().includes(q) ||
      (ch.name || '').toLowerCase().includes(q) ||
      (ch.alt_names || []).some(n => n.toLowerCase().includes(q)) ||
      (ch.countryName || '').toLowerCase().includes(q)
    );
  }

  document.getElementById('channelCount').textContent = `القنوات (${filteredChannels.length})`;

  if (filteredChannels.length === 0) {
    document.getElementById('channelList').innerHTML =
      '<div class="empty-state"><i class="fas fa-tv"></i><span>لا توجد قنوات</span></div>';
    return;
  }

  renderedCount = 0;
  document.getElementById('channelList').innerHTML = '';
  renderBatch();

  const wrap = document.getElementById('channelGridWrap');
  if (wrap) {
    wrap.onscroll = () => {
      if (renderedCount < filteredChannels.length && wrap.scrollTop + wrap.clientHeight >= wrap.scrollHeight - 300) {
        renderBatch();
      }
    };
  }
}

function renderBatch() {
  const list = document.getElementById('channelList');
  const end = Math.min(renderedCount + RENDER_BATCH, filteredChannels.length);

  const frag = document.createDocumentFragment();
  for (let i = renderedCount; i < end; i++) {
    const ch = filteredChannels[i];
    const isActive = currentChannel && currentChannel.id === ch.id;

    const div = document.createElement('div');
    div.className = 'ch-list-item' + (isActive ? ' active' : '');
    div.dataset.id = ch.id;
    div.onclick = () => playChannel(ch.id);
    div.innerHTML = `<span class="ch-num">${i + 1}</span>
    <div class="ch-list-logo">${ch.logoUrl
      ? `<img src="${ch.logoUrl}" alt="" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='<i class=\\'fas fa-tv\\'></i>'">`
      : '<i class="fas fa-tv"></i>'
    }</div>
    <div class="ch-list-info">
      <div class="ch-list-name">${ch.displayName}</div>
      <div class="ch-list-sub">${ch.country || ''} ${ch.countryName}</div>
    </div>`;
    frag.appendChild(div);
  }
  list.appendChild(frag);
  renderedCount = end;
}

const filterChannels = debounce(value => renderChannels(value), 250);

function playChannel(channelId) {
  const ch = allChannels.find(c => c.id === channelId);
  if (!ch || !ch.streams.length) { showToast('لا يتوفر بث لهذه القناة'); return; }

  currentChannel = ch;
  document.querySelectorAll('.ch-list-item.active').forEach(el => el.classList.remove('active'));
  const el = document.querySelector(`.ch-list-item[data-id="${channelId}"]`);
  if (el) el.classList.add('active');

  const infoBar = document.getElementById('playerInfo');
  if (infoBar) infoBar.style.display = 'flex';

  document.getElementById('infoName').textContent = ch.displayName;
  document.getElementById('infoCat').textContent =
    ch.countryName + (ch.langNames?.length ? ' • ' + ch.langNames[0] : '') +
    (ch.categories?.length ? ' • ' + (CATEGORY_MAP[ch.categories[0]]?.name || ch.categories[0]) : '');

  const infoLogo = document.getElementById('infoLogo');
  infoLogo.innerHTML = ch.logoUrl
    ? `<img src="${ch.logoUrl}" alt="${ch.name}">`
    : '<i class="fas fa-tv" style="font-size:1.5rem;color:var(--text-muted)"></i>';

  updateFavBtn();
  const overlay = document.getElementById('playerOverlay');
  if (overlay) overlay.style.display = 'none';

  playStream(ch.streams[0].url);
}

// ── Destroy all player instances ──
function destroyAllPlayers() {
  if (hlsPlayer) { hlsPlayer.destroy(); hlsPlayer = null; }
}

// ── Reset video element ──
function resetVideoElement() {
  const wrapper = document.getElementById('playerWrapper');
  const controls = wrapper.querySelector('.custom-controls');

  // Remove old video elements
  const oldVideos = wrapper.querySelectorAll('video');
  oldVideos.forEach(el => el.remove());

  // Create fresh video element
  const video = document.createElement('video');
  video.id = 'videoPlayer';
  video.setAttribute('playsinline', '');
  video.style.cssText = 'width:100%;height:100%';

  if (controls) {
    wrapper.insertBefore(video, controls);
  } else {
    wrapper.appendChild(video);
  }
  return video;
}

// ── Play stream with selected engine ──
function playStream(url) {
  destroyAllPlayers();
  const video = resetVideoElement();

  const proxyUrl = 'api/proxy.php?url=' + encodeURIComponent(url);
  const isHLS = url.includes('.m3u8') || url.includes('m3u8');
  const controls = document.querySelector('.custom-controls');

  switch (currentPlayerEngine) {
    case 'exoplayer':
      if (controls) controls.style.display = 'flex';
      playWithExoPlayer(video, url, isHLS, proxyUrl);
      break;
    case 'zwplayer':
      if (controls) controls.style.display = 'flex';
      playWithZWPlayer(video, url, isHLS, proxyUrl);
      break;
    default:
      if (controls) controls.style.display = 'flex';
      playDefault(video, url, isHLS, proxyUrl);
      break;
  }
  updatePlayBtn(true);
}

// ── Default HLS.js Player ──
function playDefault(video, url, isHLS, proxyUrl) {
  if (isHLS) {
    if (Hls.isSupported()) {
      hlsPlayer = new Hls({ maxBufferLength: 15, maxMaxBufferLength: 30, startLevel: -1 });
      hlsPlayer.loadSource(proxyUrl);
      hlsPlayer.attachMedia(video);
      hlsPlayer.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      hlsPlayer.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          hlsPlayer.destroy();
          hlsPlayer = new Hls({ maxBufferLength: 10, maxMaxBufferLength: 20 });
          hlsPlayer.loadSource(url);
          hlsPlayer.attachMedia(video);
          hlsPlayer.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.play().catch(() => {});
    }
  } else {
    video.src = proxyUrl;
    video.play().catch(() => { video.src = url; video.play().catch(() => {}); });
  }
}

// ── ExoPlayer (Adaptive Streaming Engine) ──
function playWithExoPlayer(video, url, isHLS, proxyUrl) {
  video.style.cssText = 'width:100%;height:100%;object-fit:contain;background:#000';
  video.controls = false;

  if (isHLS) {
    if (Hls.isSupported()) {
      hlsPlayer = new Hls({
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        startLevel: -1,
        capLevelToPlayerSize: true,
        testBandwidth: true,
        lowLatencyMode: false,
        backBufferLength: 120,
        abrEwmaDefaultEstimate: 500000,
        abrBandWidthFactor: 0.95,
        abrBandWidthUpFactor: 0.7,
        progressive: true,
        enableWorker: true
      });
      hlsPlayer.loadSource(proxyUrl);
      hlsPlayer.attachMedia(video);
      hlsPlayer.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        video.play().catch(() => {});
        if (data.levels && data.levels.length > 1) {
          const best = data.levels[data.levels.length - 1];
          showToast('ExoPlayer: ' + data.levels.length + ' جودات • ' + (best.height || '?') + 'p');
        }
      });
      hlsPlayer.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          hlsPlayer.destroy();
          hlsPlayer = new Hls({ maxBufferLength: 30, maxMaxBufferLength: 60 });
          hlsPlayer.loadSource(url);
          hlsPlayer.attachMedia(video);
          hlsPlayer.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.play().catch(() => {});
    }
  } else {
    video.src = proxyUrl;
    video.play().catch(() => { video.src = url; video.play().catch(() => {}); });
  }
}

// ── ZWPlayer (Enhanced HLS Player) ──
function playWithZWPlayer(video, url, isHLS, proxyUrl) {
  video.style.cssText = 'width:100%;height:100%;object-fit:contain;background:#000';
  video.controls = false;

  if (isHLS) {
    if (Hls.isSupported()) {
      hlsPlayer = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startLevel: -1,
        capLevelToPlayerSize: true,
        testBandwidth: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hlsPlayer.loadSource(proxyUrl);
      hlsPlayer.attachMedia(video);
      hlsPlayer.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        video.play().catch(() => {});
        // Show quality info
        if (data.levels && data.levels.length > 1) {
          showToast('ZWPlayer: ' + data.levels.length + ' جودات متاحة');
        }
      });
      hlsPlayer.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          hlsPlayer.destroy();
          hlsPlayer = new Hls({ maxBufferLength: 15, maxMaxBufferLength: 30 });
          hlsPlayer.loadSource(url);
          hlsPlayer.attachMedia(video);
          hlsPlayer.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.play().catch(() => {});
    }
  } else {
    video.src = proxyUrl;
    video.play().catch(() => { video.src = url; video.play().catch(() => {}); });
  }
}

// ── Set Player Engine ──
function setPlayerEngine(engine) {
  currentPlayerEngine = engine;
  localStorage.setItem('playerEngine', engine);
  updateEngineButtons();

  if (currentChannel && currentChannel.streams && currentChannel.streams.length) {
    playStream(currentChannel.streams[0].url);
  }
  showToast('تم التبديل إلى مشغل ' + getEngineName(engine));
}

function getEngineName(engine) {
  const names = { 'default': 'HLS', 'exoplayer': 'ExoPlayer', 'zwplayer': 'ZWPlayer' };
  return names[engine] || engine;
}

function updateEngineButtons() {
  document.querySelectorAll('.engine-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.engine === currentPlayerEngine);
  });
}

// Initialize engine buttons on load
document.addEventListener('DOMContentLoaded', () => {
  updateEngineButtons();
});

// ── Get active video element ──
function getActiveVideo() {
  return document.getElementById('videoPlayer') || document.querySelector('#playerWrapper video');
}

// Controls
function togglePlay() { const v = getActiveVideo(); if (!v) return; v.paused ? v.play().catch(()=>{}) : v.pause(); updatePlayBtn(!v.paused); }
function updatePlayBtn(p) { const b = document.getElementById('playBtn'); if(b) b.innerHTML = `<i class="fas fa-${p?'pause':'play'}"></i>`; }
function toggleMute() { const v = getActiveVideo(); if(!v) return; v.muted=!v.muted; document.getElementById('muteBtn').innerHTML=`<i class="fas fa-volume-${v.muted?'mute':'up'}"></i>`; document.getElementById('volumeSlider').value=v.muted?0:v.volume*100; }
function setVolume(val) { const v=getActiveVideo(); if(!v) return; v.volume=val/100; v.muted=val==0; document.getElementById('muteBtn').innerHTML=`<i class="fas fa-volume-${val==0?'mute':val<50?'down':'up'}"></i>`; }
function toggleFullscreen() { const w=document.getElementById('playerWrapper'); if(!w) return; document.fullscreenElement ? document.exitFullscreen() : w.requestFullscreen().catch(()=>{}); }
function togglePiP() { const v=getActiveVideo(); if(!v) return; document.pictureInPictureElement ? document.exitPictureInPicture() : v.requestPictureInPicture().catch(()=>{}); }
function toggleFavorite() { if(!currentChannel) return; toggleFavItem('live', currentChannel.id); updateFavBtn(); buildCategories(); }
function updateFavBtn() { if(!currentChannel) return; const b=document.getElementById('favBtnPlayer'); const f=isFavorite('live', currentChannel.id); if(b) b.innerHTML=`<i class="fa${f?'s':'r'} fa-heart" style="color:${f?'var(--accent-red)':''}"></i>`; }

document.addEventListener('DOMContentLoaded', () => {
  // Bind play/pause events using event delegation on wrapper
  const wrapper = document.getElementById('playerWrapper');
  if (wrapper) {
    wrapper.addEventListener('play', () => updatePlayBtn(true), true);
    wrapper.addEventListener('pause', () => updatePlayBtn(false), true);
  }
});

function showMobileSearch() { document.getElementById('searchInput')?.focus(); }
function toggleView() { showToast('عرض القائمة'); }
