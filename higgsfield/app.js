// ============================================================
//  HiggsField Hub v1 — Application Logic
// ============================================================

const CHECKOUT_URL = '#';

let map, markerCluster, heatLayer;
let allMarkers = [];
let userCreations = [];
let isPremium = false;
let settings = {};
let timelineYears = [];

const SOURCE_COLORS = {
  wan:       '#f59e0b',
  cinema:    '#ef4444',
  community: '#22c55e',
  kling:     '#00d4ff'
};

// -- INIT --
window.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadUserCreations();
  checkPremium();
  initMap();
  initTimeline();
  populateYearFilter();
  renderCreationsList();
  renderFeaturedList();
  renderAnalytics();
  updateSidebarStats();
  showPaywallDelayed();
  showRandomAlert();
});

// -- MAP --
function initMap() {
  map = L.map('map', { center: [25, 5], zoom: 2, minZoom: 2, maxZoom: 18, zoomControl: true });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(map);

  markerCluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 50,
    iconCreateFunction: c => L.divIcon({
      html: '<div class="cluster-icon">' + c.getChildCount() + '</div>',
      className: '', iconSize: [36, 36]
    })
  });

  map.addLayer(markerCluster);
  buildMarkers();
}

function buildMarkers() {
  allMarkers = [];
  markerCluster.clearLayers();

  [...CREATIONS, ...userCreations].forEach(s => {
    if (!s.lat || !s.lng) return;
    var color = SOURCE_COLORS[s.source] || '#94a3b8';
    var isFeatured = s.status === 'featured';

    var icon = L.divIcon({
      html: '<div style="' +
        'width:' + (isFeatured ? 16 : 12) + 'px;' +
        'height:' + (isFeatured ? 16 : 12) + 'px;' +
        'background:' + color + ';' +
        'border:2px solid rgba(255,255,255,' + (isFeatured ? 0.9 : 0.6) + ');' +
        'border-radius:50%;' +
        'box-shadow:0 0 ' + (isFeatured ? 10 : 6) + 'px ' + color + ';' +
        (isFeatured ? 'outline:2px solid ' + color + '44;outline-offset:2px;' : '') +
      '"></div>',
      className: '', iconSize: [16, 16], iconAnchor: [8, 8]
    });

    var marker = L.marker([s.lat, s.lng], { icon: icon });
    var shortDesc = (s.description || '').slice(0, 100) + (s.description && s.description.length > 100 ? '...' : '');

    marker.bindPopup(
      '<div class="popup-title">' + escHtml(s.title) + '</div>' +
      '<div class="popup-date">' + formatDate(s.date) + ' · ' + sourceLabel(s.source) + '</div>' +
      '<div class="popup-loc">📍 ' + escHtml(s.location) + '</div>' +
      '<div class="popup-desc">' + escHtml(shortDesc) + '</div>' +
      '<button class="popup-btn" onclick="openModal(' + JSON.stringify(s.id || ('u' + s.uid)) + ')">View Details ' + (s.videos && s.videos.length ? '▶' : '') + '</button>'
    , { maxWidth: 280 });

    marker._creationData = s;
    allMarkers.push(marker);
    markerCluster.addLayer(marker);
  });

  updateCount();
}

function applyFilters() {
  var src    = document.getElementById('filter-source').value;
  var style  = document.getElementById('filter-style').value;
  var year   = document.getElementById('filter-year').value;
  var status = document.getElementById('filter-status').value;
  var video  = document.getElementById('filter-video').value;

  markerCluster.clearLayers();
  var visible = 0;

  allMarkers.forEach(function(m) {
    var s = m._creationData;
    var sy = s.date ? s.date.split('-')[0] : '';
    var ss = (s.style || '').toLowerCase();

    var ok =
      (src    === 'all' || s.source === src) &&
      (style  === 'all' || ss.includes(style)) &&
      (year   === 'all' || sy === year) &&
      (status === 'all' || s.status === status) &&
      (video  === 'all' || (video === 'yes' && s.videos && s.videos.length));

    if (ok) { markerCluster.addLayer(m); visible++; }
  });

  document.getElementById('creation-count').textContent = visible + ' creations';
}

function updateCount() {
  document.getElementById('creation-count').textContent = allMarkers.length + ' creations';
}

// -- TIMELINE --
function initTimeline() {
  var all = [].concat(CREATIONS, userCreations);
  timelineYears = [];
  var seen = {};
  all.forEach(function(s) {
    var y = parseInt(s.date);
    if (y && !seen[y]) { seen[y] = true; timelineYears.push(y); }
  });
  timelineYears.sort(function(a,b){return a-b;});
  var slider = document.getElementById('timeline-slider');
  if (slider) {
    slider.min = 0;
    slider.max = timelineYears.length;
    slider.value = timelineYears.length;
  }
}

function onTimelineChange(val) {
  var idx = parseInt(val);
  var label = document.getElementById('timeline-year-label');
  if (idx >= timelineYears.length) {
    if (label) label.textContent = 'All';
    buildMarkers();
    return;
  }
  var year = timelineYears[idx];
  if (label) label.textContent = year;

  markerCluster.clearLayers();
  allMarkers.forEach(function(m) {
    var sy = parseInt(m._creationData.date);
    if (sy <= year) markerCluster.addLayer(m);
  });
}

// -- HEATMAP --
function toggleHeatmap() {
  var btn = document.getElementById('btn-heat');
  if (heatLayer && map.hasLayer(heatLayer)) {
    map.removeLayer(heatLayer);
    btn.classList.remove('active');
    return;
  }

  var pts = [].concat(CREATIONS, userCreations)
    .filter(function(s) { return s.lat && s.lng; })
    .map(function(s) { return [s.lat, s.lng, 0.5]; });

  pts.forEach(function(p) {
    L.circle([p[0], p[1]], {
      radius: 150000,
      color: 'transparent',
      fillColor: '#ef4444',
      fillOpacity: 0.04
    }).addTo(map);
  });

  btn.classList.add('active');
}

function locateMe() {
  if (!navigator.geolocation) return alert('Geolocation not available.');
  navigator.geolocation.getCurrentPosition(function(pos) {
    map.flyTo([pos.coords.latitude, pos.coords.longitude], 8, { duration: 1.5 });
  }, function() { alert('Could not get your location.'); });
}

// -- PANELS --
function showPanel(name, btn) {
  document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.snav').forEach(function(b) { b.classList.remove('active'); });
  document.getElementById('panel-' + name).classList.add('active');
  if (btn) btn.classList.add('active');
  if (name === 'map') setTimeout(function() { if (map) map.invalidateSize(); }, 50);
  if (name === 'creations') renderCreationsList();
  if (name === 'analytics') renderAnalytics();
  if (window.innerWidth < 768) document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// -- CREATIONS LIST --
function renderCreationsList() {
  var q      = (document.getElementById('search-input') ? document.getElementById('search-input').value : '').toLowerCase();
  var style  = document.getElementById('list-style') ? document.getElementById('list-style').value : 'all';
  var status = document.getElementById('list-status') ? document.getElementById('list-status').value : 'all';
  var combined = [].concat(CREATIONS, userCreations);

  var filtered = combined.filter(function(s) {
    var matchQ = !q || (s.title && s.title.toLowerCase().includes(q)) || (s.location && s.location.toLowerCase().includes(q)) || (s.description && s.description.toLowerCase().includes(q));
    var matchStyle = style === 'all' || (s.style || '').toLowerCase().includes(style);
    var matchStatus = status === 'all' || s.status === status;
    return matchQ && matchStyle && matchStatus;
  });

  var container = document.getElementById('creations-list');
  if (!container) return;

  container.innerHTML = filtered.map(function(s) {
    return '<div class="sighting-card" onclick="openModal(' + JSON.stringify(s.id || ('u' + s.uid)) + ')">' +
      '<div class="card-top">' +
        '<span class="card-title">' + escHtml(s.title) + '</span>' +
        '<div class="card-right">' +
          '<span class="card-date">' + formatDate(s.date) + '</span>' +
          '<span class="status-badge status-' + (s.status || 'pending') + '">' + (s.status || 'pending') + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="card-meta">📍 ' + escHtml(s.location) + (s.creator ? ' · by ' + escHtml(s.creator) : '') + '</div>' +
      '<div class="card-desc">' + escHtml(s.description) + '</div>' +
      '<div class="card-tags">' +
        '<span class="tag tag-' + s.source + '">' + sourceLabel(s.source) + '</span>' +
        (s.videos && s.videos.length ? '<span class="tag tag-video">▶ Demo</span>' : '') +
        (s.userSubmitted ? '<span class="tag tag-user">User</span>' : '') +
        (s.style ? '<span class="tag" style="background:var(--bg4);color:var(--text-muted)">' + escHtml(s.style) + '</span>' : '') +
      '</div>' +
    '</div>';
  }).join('');
}

// -- FEATURED LIST --
function renderFeaturedList() {
  var list = CREATIONS.filter(function(s) { return s.status === 'featured'; });
  var container = document.getElementById('featured-list');
  if (!container) return;

  container.innerHTML = list.map(function(s) {
    return '<div class="sighting-card" onclick="openModal(' + s.id + ')">' +
      '<div class="card-top">' +
        '<span class="card-title">' + escHtml(s.title) + '</span>' +
        '<div class="card-right">' +
          '<span class="card-date">' + formatDate(s.date) + '</span>' +
          '<span class="status-badge status-' + (s.status || 'featured') + '">' + (s.status || 'featured') + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="card-meta">📍 ' + escHtml(s.location) + '</div>' +
      '<div class="card-desc">' + escHtml(s.ref || '') + '</div>' +
      '<div class="card-tags">' +
        '<span class="tag tag-' + s.source + '">' + sourceLabel(s.source) + '</span>' +
        (s.videos && s.videos.length ? '<span class="tag tag-video">▶ Demo</span>' : '') +
      '</div>' +
    '</div>';
  }).join('');
}

// -- ANALYTICS --
function renderAnalytics() {
  var all = [].concat(CREATIONS, userCreations);

  // Source chart
  var srcCounts = {};
  all.forEach(function(s) { srcCounts[s.source] = (srcCounts[s.source] || 0) + 1; });
  renderBarChart('chart-source', Object.entries(srcCounts).sort(function(a,b){return b[1]-a[1];}), {
    'wan':'#f59e0b','cinema':'#ef4444','kling':'#00d4ff','community':'#22c55e'
  });

  // Month chart
  var monthCounts = {};
  all.forEach(function(s) {
    var parts = s.date ? s.date.split('-') : [];
    if (parts.length >= 2) {
      var key = parts[0] + '-' + parts[1];
      monthCounts[key] = (monthCounts[key] || 0) + 1;
    }
  });
  renderBarChart('chart-decade', Object.entries(monthCounts).sort(function(a,b){return a[0].localeCompare(b[0]);}), null);

  // Style chart
  var styleCounts = {};
  all.forEach(function(s) {
    var st = (s.style || 'Unknown').split('/')[0].trim();
    styleCounts[st] = (styleCounts[st] || 0) + 1;
  });
  renderBarChart('chart-styles', Object.entries(styleCounts).sort(function(a,b){return b[1]-a[1];}).slice(0,6), null);

  // Countries
  var countryCounts = {};
  all.forEach(function(s) {
    var parts = s.location ? s.location.split(',') : ['Unknown'];
    var c = parts[parts.length-1].trim();
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  });
  renderBarChart('chart-countries', Object.entries(countryCounts).sort(function(a,b){return b[1]-a[1];}).slice(0,6), null);

  // Video chart
  var withVideo = all.filter(function(s) { return s.videos && s.videos.length; }).length;
  renderBarChart('chart-video', [['With Demo', withVideo], ['Without Demo', all.length - withVideo]], {
    'With Demo':'#7c3aed', 'Without Demo':'#1e3350'
  });

  // Featured donut
  var featured = all.filter(function(s) { return s.status === 'featured'; }).length;
  var pending = all.length - featured;
  var pct = Math.round(featured / all.length * 100);
  var donut = document.getElementById('chart-verify');
  if (donut) {
    donut.innerHTML =
      '<svg viewBox="0 0 100 100" width="100" height="100">' +
        '<circle cx="50" cy="50" r="38" fill="none" stroke="#1e3350" stroke-width="12"/>' +
        '<circle cx="50" cy="50" r="38" fill="none" stroke="#22c55e" stroke-width="12"' +
          ' stroke-dasharray="' + (pct * 2.39) + ' ' + ((100-pct)*2.39) + '"' +
          ' stroke-dashoffset="59.5" stroke-linecap="round"/>' +
        '<text x="50" y="54" text-anchor="middle" fill="#e2e8f0" font-size="18" font-weight="700">' + pct + '%</text>' +
      '</svg>' +
      '<div style="font-size:0.75rem;color:var(--text-muted);text-align:center">' +
        '<div><span style="color:#22c55e">■</span> Featured: ' + featured + '</div>' +
        '<div><span style="color:#f59e0b">■</span> Pending: ' + pending + '</div>' +
      '</div>';
  }
}

function renderBarChart(containerId, entries, colorMap) {
  var container = document.getElementById(containerId);
  if (!container || !entries.length) return;
  var max = Math.max.apply(null, entries.map(function(e){return e[1];}));
  var colors = ['#00d4ff','#7c3aed','#f59e0b','#22c55e','#ef4444','#06b6d4','#8b5cf6'];

  container.innerHTML = entries.map(function(entry, i) {
    var label = entry[0], val = entry[1];
    var color = colorMap ? (colorMap[label] || colors[i % colors.length]) : colors[i % colors.length];
    var pct = Math.round(val / max * 100);
    return '<div class="bar-row">' +
      '<span class="bar-label">' + escHtml(String(label)) + '</span>' +
      '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%;background:' + color + '"></div></div>' +
      '<span class="bar-val">' + val + '</span>' +
    '</div>';
  }).join('');
}

// -- SIDEBAR STATS --
function updateSidebarStats() {
  var all = [].concat(CREATIONS, userCreations);
  var countrySet = {};
  all.forEach(function(s) {
    var parts = s.location ? s.location.split(',') : [];
    var c = parts[parts.length-1] ? parts[parts.length-1].trim() : '';
    if (c) countrySet[c] = true;
  });
  var countries = Object.keys(countrySet).length;
  var now = new Date();
  var thisMonth = all.filter(function(s) {
    if (!s.date) return false;
    var d = new Date(s.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  var featured = all.filter(function(s) { return s.status === 'featured'; }).length;

  document.getElementById('sb-total').textContent   = all.length;
  document.getElementById('sb-verified').textContent = featured;
  document.getElementById('sb-countries').textContent = countries;
  document.getElementById('sb-month').textContent   = thisMonth || all.length;
}

// -- MODAL --
function openModal(id) {
  var all = [].concat(CREATIONS, userCreations);
  var s;
  if (typeof id === 'string' && id.charAt(0) === 'u') {
    s = userCreations.find(function(x) { return String(x.uid) === id.slice(1); });
  } else {
    s = all.find(function(x) { return x.id === id; });
  }
  if (!s) return;

  document.getElementById('modal-content').innerHTML =
    '<h2>' + escHtml(s.title) + '</h2>' +
    '<div class="modal-meta">' +
      '<span>' + formatDate(s.date) + '</span> · ' +
      '<span>📍 ' + escHtml(s.location) + '</span> · ' +
      '<span class="tag tag-' + s.source + '" style="font-size:0.7rem">' + sourceLabel(s.source) + '</span> ' +
      '<span class="status-badge status-' + (s.status || 'pending') + '" style="font-size:0.7rem">' + (s.status || 'pending') + '</span>' +
    '</div>' +
    (s.creator ? '<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.6rem">🎬 Creator: ' + escHtml(s.creator) + '</div>' : '') +
    (s.style ? '<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.6rem">🎨 Style: ' + escHtml(s.style) + '</div>' : '') +
    (s.duration ? '<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.6rem">⏱ Duration: ' + escHtml(s.duration) + '</div>' : '') +
    '<div class="modal-desc">' + escHtml(s.description) + '</div>' +
    buildVideoHtml(s.videos || []) +
    (s.ref ? '<div class="modal-source"><strong>Reference:</strong> ' + escHtml(s.ref) + '</div>' : '') +
    (s.userSubmitted && s.submittedBy ? '<div class="modal-source">Submitted by: ' + escHtml(s.submittedBy) + '</div>' : '') +
    '<div class="modal-actions">' +
      '<button class="btn-map" onclick="flyToOnMap(' + s.lat + ',' + s.lng + ')">📍 Show on Map</button>' +
      '<button class="btn-map" onclick="shareModal(\'' + escHtml(s.title) + '\')">🔗 Share</button>' +
    '</div>';

  document.getElementById('modal-overlay').classList.add('open');
}

function buildVideoHtml(videos) {
  if (!videos.length) return '';
  var items = videos.map(function(url) {
    url = url.trim();
    var embed = toEmbedUrl(url);
    return embed
      ? '<iframe class="video-embed" src="' + escHtml(embed) + '" allowfullscreen loading="lazy"></iframe>'
      : '<a class="video-link" href="' + escHtml(url) + '" target="_blank" rel="noopener noreferrer">▶ ' + escHtml(url) + '</a>';
  }).join('');
  return '<div class="modal-videos"><h3>Demo Video</h3>' + items + '</div>';
}

function toEmbedUrl(url) {
  try {
    if (url.includes('youtube.com/embed/') || url.includes('player.vimeo.com')) return url;
    var yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (yt) return 'https://www.youtube.com/embed/' + yt[1];
    if (url.includes('rumble.com/embed/')) return url;
    var vm = url.match(/vimeo\.com\/(\d+)/);
    if (vm) return 'https://player.vimeo.com/video/' + vm[1];
  } catch (e) {}
  return null;
}

function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }

function flyToOnMap(lat, lng) {
  closeModal();
  showPanel('map', document.querySelector('.snav[data-panel="map"]'));
  setTimeout(function() { map.flyTo([lat, lng], 7, { duration: 1.2 }); }, 100);
}

function shareModal(title) {
  var url = window.location.href;
  if (navigator.share) {
    navigator.share({ title: 'HiggsField Hub: ' + title, url: url });
  } else {
    if (navigator.clipboard) navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  }
}

// -- SUBMIT --
function handleSubmit(e) {
  e.preventDefault();

  var title   = document.getElementById('sub-title').value.trim();
  var city    = document.getElementById('sub-city').value.trim();
  var state   = document.getElementById('sub-state').value.trim();
  var country = document.getElementById('sub-country').value.trim();
  var lat     = parseFloat(document.getElementById('sub-lat').value) || geoGuess(city);
  var lng     = parseFloat(document.getElementById('sub-lng').value) || geoGuessLng(city);
  var date    = document.getElementById('sub-date').value;
  var desc    = document.getElementById('sub-desc').value.trim();
  var style   = document.getElementById('sub-style').value;
  var dur     = document.getElementById('sub-duration').value.trim();
  var video   = document.getElementById('sub-video').value.trim();
  var model   = document.getElementById('sub-model').value || 'community';
  var name    = document.getElementById('sub-name').value.trim() || 'Anonymous';
  var anon    = document.getElementById('sub-anon').checked;
  var src     = document.getElementById('sub-source').value.trim();

  var location = [city, state, country].filter(Boolean).join(', ');
  var videos = video ? video.split(',').map(function(v){return v.trim();}).filter(Boolean) : [];

  var newCreation = {
    uid: Date.now(), title: title, location: location, lat: lat, lng: lng, date: date,
    source: model, status: 'pending',
    description: desc, style: style, duration: dur, videos: videos,
    creator: anon ? 'Anonymous' : name,
    ref: src,
    submittedBy: anon ? 'Anonymous' : name,
    userSubmitted: true
  };

  userCreations.push(newCreation);
  saveUserCreations();
  buildMarkers();
  updateSidebarStats();
  initTimeline();

  document.getElementById('submit-form').reset();
  var succ = document.getElementById('submit-success');
  succ.style.display = 'block';
  setTimeout(function() { succ.style.display = 'none'; }, 8000);
}

// -- SETTINGS --
function loadSettings() {
  try {
    var s = localStorage.getItem('higgsfield_settings');
    settings = s ? JSON.parse(s) : {};
  } catch (e) { settings = {}; }
}

function saveSettings() {
  settings = {
    darkMode:      document.getElementById('s-darkmode') ? document.getElementById('s-darkmode').checked : true,
    cluster:       document.getElementById('s-cluster') ? document.getElementById('s-cluster').checked : true,
    timeline:      document.getElementById('s-timeline') ? document.getElementById('s-timeline').checked : true,
    nearbyAlert:   document.getElementById('s-nearby') ? document.getElementById('s-nearby').checked : false,
    featuredAlert: document.getElementById('s-verified-alert') ? document.getElementById('s-verified-alert').checked : true,
    wan:           document.getElementById('s-wan') ? document.getElementById('s-wan').checked : true,
    cinema:        document.getElementById('s-cinema') ? document.getElementById('s-cinema').checked : true,
    community:     document.getElementById('s-community') ? document.getElementById('s-community').checked : true,
    featuredOnly:  document.getElementById('s-featuredonly') ? document.getElementById('s-featuredonly').checked : false,
    anon:          document.getElementById('s-anon') ? document.getElementById('s-anon').checked : true,
  };
  try { localStorage.setItem('higgsfield_settings', JSON.stringify(settings)); } catch (e) {}
}

function toggleDarkMode(cb) {
  document.body.style.filter = cb.checked ? '' : 'invert(0.85) hue-rotate(180deg)';
  saveSettings();
}

function toggleClustering(cb) {
  if (cb.checked) map.addLayer(markerCluster);
  else map.removeLayer(markerCluster);
  saveSettings();
}

function toggleTimeline(cb) {
  document.getElementById('timeline-bar').style.display = cb.checked ? '' : 'none';
  saveSettings();
}

// -- EXPORT --
function exportCSV() {
  var all = [].concat(CREATIONS, userCreations);
  var cols = ['id','title','location','lat','lng','date','source','status','style','duration','description','ref'];
  var rows = [cols.join(',')].concat(all.map(function(s) {
    return cols.map(function(c) { return JSON.stringify(s[c] != null ? s[c] : ''); }).join(',');
  }));
  download('higgsfield-creations.csv', rows.join('\n'), 'text/csv');
}

function exportJSON() {
  download('higgsfield-creations.json', JSON.stringify([].concat(CREATIONS, userCreations), null, 2), 'application/json');
}

function download(filename, content, type) {
  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: type }));
  a.download = filename;
  a.click();
}

// -- PAYWALL --
function checkPremium() {
  isPremium = localStorage.getItem('higgsfield_premium') === 'true';
}

function showPaywall() {
  document.getElementById('paywall-overlay').classList.add('show');
}

function closePaywall() {
  document.getElementById('paywall-overlay').classList.remove('show');
}

function showPaywallDelayed() {
  if (isPremium) return;
  setTimeout(showPaywall, 2500);
}

function openCheckout() {
  if (CHECKOUT_URL !== '#') {
    window.open(CHECKOUT_URL, '_blank', 'noopener,noreferrer');
  } else {
    alert('Checkout coming soon!');
  }
}

function activatePremium() {
  isPremium = true;
  localStorage.setItem('higgsfield_premium', 'true');
  closePaywall();
}

// -- ALERTS --
function showRandomAlert() {
  var msgs = [
    'New cinematic creation trending from Tokyo',
    'WAN 2.5 creation featured: Desert Chase scene',
    'New demo video submitted from Berlin',
    'Cinema Studio 2.5 — 3 new featured creations',
    'Creation cluster detected: NYC filmmakers'
  ];
  setTimeout(function() {
    var banner = document.getElementById('alert-banner');
    var text = document.getElementById('alert-text');
    if (banner && text) {
      text.textContent = msgs[Math.floor(Math.random() * msgs.length)];
      banner.style.display = 'flex';
      setTimeout(function() { banner.style.display = 'none'; }, 6000);
    }
  }, 5000);
}

// -- HELPERS --
function populateYearFilter() {
  var yearSet = {};
  [].concat(CREATIONS, userCreations).forEach(function(s) {
    var y = s.date ? s.date.split('-')[0] : '';
    if (y) yearSet[y] = true;
  });
  var years = Object.keys(yearSet).sort().reverse();
  var sel = document.getElementById('filter-year');
  if (!sel) return;
  years.forEach(function(y) {
    var o = document.createElement('option');
    o.value = y; o.textContent = y;
    sel.appendChild(o);
  });
}

function escHtml(str) {
  return String(str != null ? str : '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(d) {
  if (!d) return 'Unknown';
  try {
    var parts = d.split('-');
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return (parts[2] ? parts[2] + ' ' : '') + (months[parseInt(parts[1],10)-1] || '') + ' ' + parts[0];
  } catch (e) { return d; }
}

function sourceLabel(src) {
  return { wan:'WAN 2.5', cinema:'Cinema Studio', community:'Community', kling:'Kling 3.0' }[src] || src;
}

function geoGuess(city) {
  var m = { 'phoenix':33.4484,'new york':40.7128,'los angeles':34.0522,'chicago':41.8781,
    'houston':29.7604,'dallas':32.7767,'miami':25.7617,'seattle':47.6062,
    'denver':39.7392,'atlanta':33.749,'las vegas':36.1699,'washington':38.9072,
    'london':51.5074,'paris':48.8566,'tokyo':35.6762,'sydney':-33.8688,
    'san francisco':37.7749,'berlin':52.52,'toronto':43.6532 };
  var l = (city||'').toLowerCase();
  for (var k in m) if (l.includes(k)) return m[k];
  return 0;
}

function geoGuessLng(city) {
  var m = { 'phoenix':-112.074,'new york':-74.006,'los angeles':-118.2437,'chicago':-87.6298,
    'houston':-95.3698,'dallas':-96.797,'miami':-80.1918,'seattle':-122.3321,
    'denver':-104.9903,'atlanta':-84.388,'las vegas':-115.1398,'washington':-77.0369,
    'london':-0.1278,'paris':2.3522,'tokyo':139.6503,'sydney':151.2093,
    'san francisco':-122.4194,'berlin':13.405,'toronto':-79.3832 };
  var l = (city||'').toLowerCase();
  for (var k in m) if (l.includes(k)) return m[k];
  return 0;
}

function saveUserCreations() {
  try { localStorage.setItem('higgsfield_user_creations', JSON.stringify(userCreations)); } catch (e) {}
}

function loadUserCreations() {
  try {
    var raw = localStorage.getItem('higgsfield_user_creations');
    if (raw) userCreations = JSON.parse(raw);
  } catch (e) { userCreations = []; }
}
