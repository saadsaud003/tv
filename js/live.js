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
let currentPlayerEngine = localStorage.getItem('playerEngine') || 'default';
let vjsPlayer = null;
let plyrPlayer = null;

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

    // Step 1: Fetch ONLY channels + streams (essential data)
    const [channelsRes, streamsRes] = await Promise.all([
      fetch('https://iptv-org.github.io/api/channels.json'),
      fetch('https://iptv-org.github.io/api/streams.json')
    ]);

    const [channelsRaw, streamsRaw] = await Promise.all([
      channelsRes.json(), streamsRes.json()
    ]);

    // Build stream lookup
    const streamMap = {};
    streamsRaw.forEach(s => {
      if (!streamMap[s.channel]) streamMap[s.channel] = [];
      streamMap[s.channel].push(s);
    });

    // Build channels - only those with streams
    let num = 0;
    allChannels = channelsRaw
      .filter(ch => streamMap[ch.id])
      .map(ch => {
        num++;
        const countryCode = ch.country || '';
        const countryName = COUNTRY_AR[countryCode] || countryCode;
        const langNames = (ch.languages || []).map(l => LANG_AR[l] || l);
        return {
          id: ch.id,
          name: ch.name,
          alt_names: ch.alt_names,
          country: ch.country,
          languages: ch.languages,
          categories: ch.categories,
          streams: streamMap[ch.id],
          num,
          countryName,
          langNames,
          logoUrl: ch.logo || ''
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
  const countryCounts = {};
  const langCounts = {};

  allChannels.forEach(ch => {
    (ch.categories || []).forEach(cat => { catCounts[cat] = (catCounts[cat] || 0) + 1; });
    if (ch.country) { countryCounts[ch.country] = (countryCounts[ch.country] || 0) + 1; }
    (ch.languages || []).forEach(l => { langCounts[l] = (langCounts[l] || 0) + 1; });
  });

  let html = '';

  // All + Favorites
  html += catItem('all', 'الكل', 'fas fa-globe', allChannels.length, true);
  html += catItem('favorites', 'المفضلة', 'fas fa-heart', getFavorites('live').length);

  // Categories (max ~25 items)
  html += catSeparator('حسب التصنيف');
  Object.entries(catCounts)
    .filter(([k]) => k !== 'all')
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const info = CATEGORY_MAP[cat] || { name: cat, icon: 'fas fa-folder' };
      html += catItem('cat_' + cat, info.name, info.icon, count);
    });

  // Languages (top 20 only)
  html += catSeparator('حسب اللغة');
  Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([code, count]) => {
      const name = LANG_AR[code] || code;
      html += catItem('lang_' + code, name, 'fas fa-language', count);
    });

  // Countries (top 30 only)
  html += catSeparator('حسب الدولة');
  Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .forEach(([code, count]) => {
      const name = COUNTRY_AR[code] || code;
      html += catItem('country_' + code, name, 'fas fa-flag', count);
    });

  document.getElementById('categoryList').innerHTML = html;
  const mobile = document.getElementById('mobileCategoryList');
  if (mobile) mobile.innerHTML = html;
}

function catItem(id, name, icon, count, active = false) {
  return `<div class="category-item ${active ? 'active' : ''}" data-cat="${id}" onclick="selectCategory('${id}')">
    <span class="cat-count">${count}</span><span class="cat-name">${name}</span><span class="cat-icon"><i class="${icon}"></i></span>
  </div>`;
}
function catSeparator(label) {
  return `<div style="padding:0.5rem 1rem;font-size:0.72rem;color:var(--accent);font-weight:700;border-bottom:1px solid var(--border);background:var(--bg-card)">${label}</div>`;
}

function selectCategory(catId) {
  currentCategory = catId;
  document.querySelectorAll('.category-item').forEach(el => {
    el.classList.toggle('active', el.dataset.cat === catId);
  });
  renderChannels();
  closeMobileCategories();
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

  const list = document.getElementById('channelList');
  list.onscroll = () => {
    if (renderedCount < filteredChannels.length && list.scrollTop + list.clientHeight >= list.scrollHeight - 300) {
      renderBatch();
    }
  };
}

function renderBatch() {
  const list = document.getElementById('channelList');
  const end = Math.min(renderedCount + RENDER_BATCH, filteredChannels.length);

  const frag = document.createDocumentFragment();
  for (let i = renderedCount; i < end; i++) {
    const ch = filteredChannels[i];
    const isActive = currentChannel && currentChannel.id === ch.id;
    const langStr = ch.langNames?.length ? ch.langNames[0] : '';

    const div = document.createElement('div');
    div.className = 'channel-item' + (isActive ? ' active' : '');
    div.dataset.id = ch.id;
    div.onclick = () => playChannel(ch.id);
    div.innerHTML = `<div class="ch-logo">${ch.logoUrl
      ? `<img src="${ch.logoUrl}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('i'),{className:'fas fa-tv',style:'color:var(--text-muted)'}))">`
      : '<i class="fas fa-tv" style="color:var(--text-muted)"></i>'
    }</div>
    <div class="ch-info"><div class="ch-name">${ch.name}</div><div class="ch-cat">${ch.countryName}${langStr ? ' • ' + langStr : ''}${ch.categories?.length ? ' • ' + (CATEGORY_MAP[ch.categories[0]]?.name || ch.categories[0]) : ''}</div></div>
    <span class="ch-num">${ch.num}</span>`;
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
  document.querySelectorAll('.channel-item.active').forEach(el => el.classList.remove('active'));
  const el = document.querySelector(`.channel-item[data-id="${channelId}"]`);
  if (el) el.classList.add('active');

  const infoBar = document.getElementById('playerInfo');
  if (infoBar) infoBar.style.display = 'flex';

  document.getElementById('infoName').textContent = ch.name;
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
  if (vjsPlayer) {
    try { vjsPlayer.dispose(); } catch(e) {}
    vjsPlayer = null;
  }
  if (plyrPlayer) {
    try { plyrPlayer.destroy(); } catch(e) {}
    plyrPlayer = null;
  }
}

// ── Reset video element ──
function resetVideoElement() {
  const wrapper = document.getElementById('playerWrapper');
  const controls = wrapper.querySelector('.custom-controls');

  // Remove Video.js containers
  const vjsEls = wrapper.querySelectorAll('.video-js');
  vjsEls.forEach(el => el.remove());

  // Remove Plyr containers
  const plyrEls = wrapper.querySelectorAll('.plyr');
  plyrEls.forEach(el => el.remove());

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
    case 'videojs':
      if (controls) controls.style.display = 'none';
      playWithVideoJS(video, isHLS ? proxyUrl : proxyUrl, isHLS, url);
      break;
    case 'plyr':
      if (controls) controls.style.display = 'none';
      playWithPlyr(video, isHLS ? proxyUrl : proxyUrl, isHLS, url);
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

// ── Video.js Player ──
function playWithVideoJS(video, streamUrl, isHLS, originalUrl) {
  video.className = 'video-js vjs-default-skin vjs-big-play-centered';
  video.id = 'vjsLivePlayer';

  try {
    vjsPlayer = videojs(video, {
      autoplay: true,
      controls: true,
      liveui: true,
      fluid: false,
      fill: true,
      responsive: true,
      html5: {
        vhs: { overrideNative: true },
        nativeAudioTracks: false,
        nativeVideoTracks: false
      }
    });

    vjsPlayer.src({
      type: isHLS ? 'application/x-mpegURL' : 'video/mp4',
      src: streamUrl
    });
    vjsPlayer.play().catch(() => {});

    // Fallback to direct URL on error
    vjsPlayer.on('error', () => {
      if (originalUrl !== streamUrl) {
        vjsPlayer.src({
          type: isHLS ? 'application/x-mpegURL' : 'video/mp4',
          src: originalUrl
        });
        vjsPlayer.play().catch(() => {});
      }
    });
  } catch(e) {
    console.error('Video.js init error:', e);
    showToast('خطأ في تشغيل Video.js، جاري التبديل للمشغل الافتراضي');
    const controls = document.querySelector('.custom-controls');
    if (controls) controls.style.display = 'flex';
    const newVideo = resetVideoElement();
    playDefault(newVideo, originalUrl, isHLS, streamUrl);
  }
}

// ── Plyr Player ──
function playWithPlyr(video, streamUrl, isHLS, originalUrl) {
  // Initialize HLS first if needed
  if (isHLS && Hls.isSupported()) {
    hlsPlayer = new Hls({ maxBufferLength: 15, maxMaxBufferLength: 30 });
    hlsPlayer.loadSource(streamUrl);
    hlsPlayer.attachMedia(video);

    hlsPlayer.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal && originalUrl !== streamUrl) {
        hlsPlayer.destroy();
        hlsPlayer = new Hls({ maxBufferLength: 10, maxMaxBufferLength: 20 });
        hlsPlayer.loadSource(originalUrl);
        hlsPlayer.attachMedia(video);
        hlsPlayer.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      }
    });
  } else {
    video.src = streamUrl;
  }

  try {
    plyrPlayer = new Plyr(video, {
      controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'pip', 'fullscreen'],
      tooltips: { controls: true },
      i18n: {
        play: 'تشغيل',
        pause: 'إيقاف',
        mute: 'كتم',
        unmute: 'إلغاء الكتم',
        enterFullscreen: 'ملء الشاشة',
        exitFullscreen: 'خروج من ملء الشاشة',
        pip: 'صورة في صورة'
      }
    });

    if (isHLS && hlsPlayer) {
      hlsPlayer.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
    } else {
      video.play().catch(() => {});
    }
  } catch(e) {
    console.error('Plyr init error:', e);
    showToast('خطأ في تشغيل Plyr، جاري التبديل للمشغل الافتراضي');
    destroyAllPlayers();
    const controls = document.querySelector('.custom-controls');
    if (controls) controls.style.display = 'flex';
    const newVideo = resetVideoElement();
    playDefault(newVideo, originalUrl, isHLS, streamUrl);
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
  const names = { 'default': 'HLS', 'videojs': 'Video.js', 'plyr': 'Plyr', 'zwplayer': 'ZWPlayer' };
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

// ── Get active video element (works for all engines) ──
function getActiveVideo() {
  if (vjsPlayer) {
    try { return vjsPlayer.el().querySelector('video'); } catch(e) {}
  }
  if (plyrPlayer) {
    try { return plyrPlayer.media; } catch(e) {}
  }
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

function showMobileSearch() { document.getElementById('searchInput')?.focus(); window.scrollTo({top:0,behavior:'smooth'}); }
function openMobileCategories() { document.getElementById('mobileDrawer')?.classList.add('open'); }
function closeMobileCategories() { document.getElementById('mobileDrawer')?.classList.remove('open'); }
function toggleView() { showToast('عرض القائمة'); }
