// ============================================================
//  PhenoMap v2 — Application Logic
// ============================================================

const STRIPE_URL = 'https://buy.stripe.com/5kQaEZ5zy4QI4vJaLr83C04';

let map, markerCluster, heatLayer;
let allMarkers = [];
let userSightings = [];
let isPremium = false;
let settings = {};
let timelineYears = [];

const SOURCE_COLORS = {
  gov:      '#f59e0b',
  mil:      '#ef4444',
  civilian: '#22c55e',
  aaro:     '#00d4ff'
};

// ── INIT ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadUserSightings();
  checkPremium();
  initMap();
  initTimeline();
  populateYearFilter();
  renderSightingsList();
  renderGovIncidents();
  renderAnalytics();
  updateSidebarStats();
  showPaywallDelayed();
  showRandomAlert();
});

// ── MAP ───────────────────────────────────────────────────────
function initMap() {
  map = L.map('map', { center: [25, 5], zoom: 2, minZoom: 2, maxZoom: 18, zoomControl: true });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(map);

  markerCluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 50,
    iconCreateFunction: c => L.divIcon({
      html: `<div class="cluster-icon">${c.getChildCount()}</div>`,
      className: '', iconSize: [36, 36]
    })
  });

  map.addLayer(markerCluster);
  buildMarkers();
}

function buildMarkers() {
  allMarkers = [];
  markerCluster.clearLayers();

  [...SIGHTINGS, ...userSightings].forEach(s => {
    if (!s.lat || !s.lng) return;
    const color = SOURCE_COLORS[s.source] || '#94a3b8';
    const isVerified = s.status === 'verified';

    const icon = L.divIcon({
      html: `<div style="
        width:${isVerified ? 16 : 12}px;
        height:${isVerified ? 16 : 12}px;
        background:${color};
        border:2px solid rgba(255,255,255,${isVerified ? 0.9 : 0.6});
        border-radius:50%;
        box-shadow:0 0 ${isVerified ? 10 : 6}px ${color};
        ${isVerified ? 'outline:2px solid ' + color + '44;outline-offset:2px;' : ''}
      "></div>`,
      className: '', iconSize: [16, 16], iconAnchor: [8, 8]
    });

    const marker = L.marker([s.lat, s.lng], { icon });
    const shortDesc = (s.description || '').slice(0, 100) + (s.description?.length > 100 ? '…' : '');

    marker.bindPopup(`
      <div class="popup-title">${escHtml(s.title)}</div>
      <div class="popup-date">${formatDate(s.date)} · ${sourceLabel(s.source)}</div>
      <div class="popup-loc">📍 ${escHtml(s.location)}</div>
      <div class="popup-desc">${escHtml(shortDesc)}</div>
      <button class="popup-btn" onclick="openModal(${JSON.stringify(s.id ?? 'u' + s.uid)})">
        View Details ${s.videos?.length ? '▶' : ''}
      </button>
    `, { maxWidth: 280 });

    marker._sightingData = s;
    allMarkers.push(marker);
    markerCluster.addLayer(marker);
  });

  updateCount();
}

function applyFilters() {
  const src    = document.getElementById('filter-source').value;
  const shape  = document.getElementById('filter-shape').value;
  const year   = document.getElementById('filter-year').value;
  const status = document.getElementById('filter-status').value;
  const video  = document.getElementById('filter-video').value;

  markerCluster.clearLayers();
  let visible = 0;

  allMarkers.forEach(m => {
    const s = m._sightingData;
    const sy = s.date?.split('-')[0] || '';
    const ss = (s.shape || '').toLowerCase();

    const ok =
      (src    === 'all' || s.source === src) &&
      (shape  === 'all' || ss.includes(shape)) &&
      (year   === 'all' || sy === year) &&
      (status === 'all' || s.status === status) &&
      (video  === 'all' || (video === 'yes' && s.videos?.length));

    if (ok) { markerCluster.addLayer(m); visible++; }
  });

  document.getElementById('sighting-count').textContent = `${visible} sightings`;
}

function updateCount() {
  document.getElementById('sighting-count').textContent = `${allMarkers.length} sightings`;
}

// ── TIMELINE ─────────────────────────────────────────────────
function initTimeline() {
  const all = [...SIGHTINGS, ...userSightings];
  timelineYears = [...new Set(all.map(s => parseInt(s.date)))].filter(Boolean).sort();
  const slider = document.getElementById('timeline-slider');
  if (slider) {
    slider.min = 0;
    slider.max = timelineYears.length;
    slider.value = timelineYears.length;
  }
}

function onTimelineChange(val) {
  const idx = parseInt(val);
  const label = document.getElementById('timeline-year-label');
  if (idx >= timelineYears.length) {
    if (label) label.textContent = 'All';
    buildMarkers();
    return;
  }
  const year = timelineYears[idx];
  if (label) label.textContent = year;

  markerCluster.clearLayers();
  allMarkers.forEach(m => {
    const sy = parseInt(m._sightingData.date);
    if (sy <= year) markerCluster.addLayer(m);
  });
}

// ── HEATMAP ───────────────────────────────────────────────────
function toggleHeatmap() {
  const btn = document.getElementById('btn-heat');
  if (heatLayer && map.hasLayer(heatLayer)) {
    map.removeLayer(heatLayer);
    btn.classList.remove('active');
    return;
  }

  const pts = [...SIGHTINGS, ...userSightings]
    .filter(s => s.lat && s.lng)
    .map(s => [s.lat, s.lng, 0.5]);

  // Simple CSS-based visual since we can't load heatmap plugin
  pts.forEach(([lat, lng]) => {
    L.circle([lat, lng], {
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
  navigator.geolocation.getCurrentPosition(pos => {
    map.flyTo([pos.coords.latitude, pos.coords.longitude], 8, { duration: 1.5 });
  }, () => alert('Could not get your location.'));
}

// ── PANELS ────────────────────────────────────────────────────
function showPanel(name, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.snav').forEach(b => b.classList.remove('active'));
  document.getElementById(`panel-${name}`).classList.add('active');
  if (btn) btn.classList.add('active');
  if (name === 'map') setTimeout(() => map?.invalidateSize(), 50);
  if (name === 'sightings') renderSightingsList();
  if (name === 'analytics') renderAnalytics();
  // Close sidebar on mobile
  if (window.innerWidth < 768) document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ── SIGHTINGS LIST ─────────────────────────────────────────────
function renderSightingsList() {
  const q      = (document.getElementById('search-input')?.value || '').toLowerCase();
  const shape  = document.getElementById('list-shape')?.value || 'all';
  const status = document.getElementById('list-status')?.value || 'all';
  const combined = [...SIGHTINGS, ...userSightings];

  const filtered = combined.filter(s => {
    const matchQ = !q || s.title?.toLowerCase().includes(q) || s.location?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q);
    const matchShape = shape === 'all' || (s.shape || '').toLowerCase().includes(shape);
    const matchStatus = status === 'all' || s.status === status;
    return matchQ && matchShape && matchStatus;
  });

  const container = document.getElementById('sightings-list');
  if (!container) return;

  container.innerHTML = filtered.map(s => `
    <div class="sighting-card" onclick="openModal(${JSON.stringify(s.id ?? 'u' + s.uid)})">
      <div class="card-top">
        <span class="card-title">${escHtml(s.title)}</span>
        <div class="card-right">
          <span class="card-date">${formatDate(s.date)}</span>
          <span class="status-badge status-${s.status || 'pending'}">${s.status || 'pending'}</span>
        </div>
      </div>
      <div class="card-meta">📍 ${escHtml(s.location)}${s.witnesses ? ` · ${s.witnesses} witness(es)` : ''}</div>
      <div class="card-desc">${escHtml(s.description)}</div>
      <div class="card-tags">
        <span class="tag tag-${s.source}">${sourceLabel(s.source)}</span>
        ${s.videos?.length ? '<span class="tag tag-video">▶ Video</span>' : ''}
        ${s.userSubmitted ? '<span class="tag tag-user">User</span>' : ''}
        ${s.shape ? `<span class="tag" style="background:var(--bg4);color:var(--text-muted)">${escHtml(s.shape)}</span>` : ''}
      </div>
    </div>
  `).join('');
}

// ── GOV INCIDENTS ─────────────────────────────────────────────
function renderGovIncidents() {
  const list = SIGHTINGS.filter(s => ['gov','mil','aaro'].includes(s.source));
  const container = document.getElementById('gov-incidents-list');
  if (!container) return;

  container.innerHTML = list.map(s => `
    <div class="sighting-card" onclick="openModal(${s.id})">
      <div class="card-top">
        <span class="card-title">${escHtml(s.title)}</span>
        <div class="card-right">
          <span class="card-date">${formatDate(s.date)}</span>
          <span class="status-badge status-${s.status || 'verified'}">${s.status || 'verified'}</span>
        </div>
      </div>
      <div class="card-meta">📍 ${escHtml(s.location)}</div>
      <div class="card-desc">${escHtml(s.gov_ref || '')}</div>
      <div class="card-tags">
        <span class="tag tag-${s.source}">${sourceLabel(s.source)}</span>
        ${s.videos?.length ? '<span class="tag tag-video">▶ Video</span>' : ''}
      </div>
    </div>
  `).join('');
}

// ── ANALYTICS ────────────────────────────────────────────────
function renderAnalytics() {
  const all = [...SIGHTINGS, ...userSightings];

  // Source chart
  const srcCounts = {};
  all.forEach(s => srcCounts[s.source] = (srcCounts[s.source] || 0) + 1);
  renderBarChart('chart-source', Object.entries(srcCounts).sort((a,b)=>b[1]-a[1]), {
    'gov':'#f59e0b','mil':'#ef4444','aaro':'#00d4ff','civilian':'#22c55e'
  });

  // Decade chart
  const decadeCounts = {};
  all.forEach(s => {
    const yr = parseInt(s.date);
    if (yr) {
      const dec = Math.floor(yr/10)*10;
      decadeCounts[dec+'s'] = (decadeCounts[dec+'s'] || 0) + 1;
    }
  });
  renderBarChart('chart-decade', Object.entries(decadeCounts).sort((a,b)=>a[0].localeCompare(b[0])), null);

  // Shape chart
  const shapeCounts = {};
  all.forEach(s => {
    const sh = (s.shape || 'Unknown').split('/')[0].trim().split(' ')[0];
    shapeCounts[sh] = (shapeCounts[sh] || 0) + 1;
  });
  renderBarChart('chart-shapes', Object.entries(shapeCounts).sort((a,b)=>b[1]-a[1]).slice(0,6), null);

  // Countries
  const countryCounts = {};
  all.forEach(s => {
    const c = s.location?.split(',').pop()?.trim() || 'Unknown';
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  });
  renderBarChart('chart-countries', Object.entries(countryCounts).sort((a,b)=>b[1]-a[1]).slice(0,6), null);

  // Video chart
  const withVideo = all.filter(s => s.videos?.length).length;
  renderBarChart('chart-video', [['With Video', withVideo], ['Without Video', all.length - withVideo]], {
    'With Video':'#7c3aed', 'Without Video':'#1e3350'
  });

  // Verification donut
  const verified = all.filter(s => s.status === 'verified').length;
  const pending = all.length - verified;
  const pct = Math.round(verified / all.length * 100);
  const donut = document.getElementById('chart-verify');
  if (donut) {
    donut.innerHTML = `
      <svg viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="38" fill="none" stroke="#1e3350" stroke-width="12"/>
        <circle cx="50" cy="50" r="38" fill="none" stroke="#22c55e" stroke-width="12"
          stroke-dasharray="${pct * 2.39} ${(100-pct)*2.39}"
          stroke-dashoffset="59.5" stroke-linecap="round"/>
        <text x="50" y="54" text-anchor="middle" fill="#e2e8f0" font-size="18" font-weight="700">${pct}%</text>
      </svg>
      <div style="font-size:0.75rem;color:var(--text-muted);text-align:center">
        <div><span style="color:#22c55e">■</span> Verified: ${verified}</div>
        <div><span style="color:#f59e0b">■</span> Pending: ${pending}</div>
      </div>
    `;
  }
}

function renderBarChart(containerId, entries, colorMap) {
  const container = document.getElementById(containerId);
  if (!container || !entries.length) return;
  const max = Math.max(...entries.map(e => e[1]));
  const colors = ['#00d4ff','#7c3aed','#f59e0b','#22c55e','#ef4444','#06b6d4','#8b5cf6'];

  container.innerHTML = entries.map(([label, val], i) => {
    const color = colorMap ? (colorMap[label] || colors[i % colors.length]) : colors[i % colors.length];
    const pct = Math.round(val / max * 100);
    return `
      <div class="bar-row">
        <span class="bar-label">${escHtml(String(label))}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <span class="bar-val">${val}</span>
      </div>
    `;
  }).join('');
}

// ── SIDEBAR STATS ─────────────────────────────────────────────
function updateSidebarStats() {
  const all = [...SIGHTINGS, ...userSightings];
  const countries = new Set(all.map(s => s.location?.split(',').pop()?.trim())).size;
  const now = new Date();
  const thisMonth = all.filter(s => {
    if (!s.date) return false;
    const d = new Date(s.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const verified = all.filter(s => s.status === 'verified').length;

  document.getElementById('sb-total').textContent   = all.length;
  document.getElementById('sb-verified').textContent = verified;
  document.getElementById('sb-countries').textContent = countries;
  document.getElementById('sb-month').textContent   = thisMonth || all.length;
}

// ── MODAL ─────────────────────────────────────────────────────
function openModal(id) {
  const all = [...SIGHTINGS, ...userSightings];
  let s;
  if (typeof id === 'string' && id.startsWith('u')) {
    s = userSightings.find(x => String(x.uid) === id.slice(1));
  } else {
    s = all.find(x => x.id === id);
  }
  if (!s) return;

  document.getElementById('modal-content').innerHTML = `
    <h2>${escHtml(s.title)}</h2>
    <div class="modal-meta">
      <span>${formatDate(s.date)}</span> ·
      <span>📍 ${escHtml(s.location)}</span> ·
      <span class="tag tag-${s.source}" style="font-size:0.7rem">${sourceLabel(s.source)}</span>
      <span class="status-badge status-${s.status || 'pending'}" style="font-size:0.7rem">${s.status || 'pending'}</span>
    </div>
    ${s.witnesses ? `<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.6rem">👥 Witnesses: ${escHtml(String(s.witnesses))}</div>` : ''}
    ${s.shape ? `<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.6rem">🔷 Shape: ${escHtml(s.shape)}</div>` : ''}
    ${s.duration ? `<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.6rem">⏱ Duration: ${escHtml(s.duration)}</div>` : ''}
    <div class="modal-desc">${escHtml(s.description)}</div>
    ${buildVideoHtml(s.videos || [])}
    ${s.gov_ref ? `<div class="modal-source"><strong>Government Reference:</strong> ${escHtml(s.gov_ref)}</div>` : ''}
    ${s.userSubmitted && s.submittedBy ? `<div class="modal-source">Submitted by: ${escHtml(s.submittedBy)}</div>` : ''}
    <div class="modal-actions">
      <button class="btn-map" onclick="flyToOnMap(${s.lat},${s.lng})">📍 Show on Map</button>
      <button class="btn-map" onclick="shareModal('${escHtml(s.title)}')">🔗 Share</button>
    </div>
  `;

  document.getElementById('modal-overlay').classList.add('open');
}

function buildVideoHtml(videos) {
  if (!videos.length) return '';
  const items = videos.map(url => {
    url = url.trim();
    const embed = toEmbedUrl(url);
    return embed
      ? `<iframe class="video-embed" src="${escHtml(embed)}" allowfullscreen loading="lazy"></iframe>`
      : `<a class="video-link" href="${escHtml(url)}" target="_blank" rel="noopener noreferrer">▶ ${escHtml(url)}</a>`;
  }).join('');
  return `<div class="modal-videos"><h3>Video Evidence</h3>${items}</div>`;
}

function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }

function flyToOnMap(lat, lng) {
  closeModal();
  showPanel('map', document.querySelector('.snav[data-panel="map"]'));
  setTimeout(() => map.flyTo([lat, lng], 7, { duration: 1.2 }), 100);
}

function shareModal(title) {
  const url = window.location.href;
  if (navigator.share) {
    navigator.share({ title: 'PhenoMap: ' + title, url });
  } else {
    navigator.clipboard?.writeText(url);
    alert('Link copied to clipboard!');
  }
}

// ── SUBMIT ────────────────────────────────────────────────────
function handleSubmit(e) {
  e.preventDefault();

  const title   = document.getElementById('sub-title').value.trim();
  const city    = document.getElementById('sub-city').value.trim();
  const state   = document.getElementById('sub-state').value.trim();
  const country = document.getElementById('sub-country').value.trim();
  const lat     = parseFloat(document.getElementById('sub-lat').value) || geoGuess(city);
  const lng     = parseFloat(document.getElementById('sub-lng').value) || geoGuessLng(city);
  const date    = document.getElementById('sub-date').value;
  const desc    = document.getElementById('sub-desc').value.trim();
  const shape   = document.getElementById('sub-shape').value;
  const dur     = document.getElementById('sub-duration').value.trim();
  const video   = document.getElementById('sub-video').value.trim();
  const wit     = document.getElementById('sub-witnesses').value || '1';
  const name    = document.getElementById('sub-name').value.trim() || 'Anonymous';
  const anon    = document.getElementById('sub-anon').checked;
  const src     = document.getElementById('sub-source').value.trim();

  const location = [city, state, country].filter(Boolean).join(', ');
  const videos = video ? video.split(',').map(v => v.trim()).filter(Boolean) : [];

  const newSighting = {
    uid: Date.now(), title, location, lat, lng, date,
    source: 'civilian', status: 'pending',
    description: desc, shape, duration: dur, videos,
    witnesses: parseInt(wit),
    gov_ref: src,
    submittedBy: anon ? 'Anonymous' : name,
    userSubmitted: true
  };

  userSightings.push(newSighting);
  saveUserSightings();
  buildMarkers();
  updateSidebarStats();
  initTimeline();

  document.getElementById('submit-form').reset();
  const succ = document.getElementById('submit-success');
  succ.style.display = 'block';
  setTimeout(() => succ.style.display = 'none', 8000);
}

// ── SETTINGS ─────────────────────────────────────────────────
function loadSettings() {
  settings = readSettings();
}

function saveSettings() {
  settings = {
    darkMode:      document.getElementById('s-darkmode')?.checked,
    cluster:       document.getElementById('s-cluster')?.checked,
    timeline:      document.getElementById('s-timeline')?.checked,
    nearbyAlert:   document.getElementById('s-nearby')?.checked,
    verifiedAlert: document.getElementById('s-verified-alert')?.checked,
    nuforc:        document.getElementById('s-nuforc')?.checked,
    mufon:         document.getElementById('s-mufon')?.checked,
    community:     document.getElementById('s-community')?.checked,
    govOnly:       document.getElementById('s-govonly')?.checked,
    anon:          document.getElementById('s-anon')?.checked,
  };
  writeSettings(settings);
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

// ── EXPORT ────────────────────────────────────────────────────
function exportCSV() {
  const all = [...SIGHTINGS, ...userSightings];
  const cols = ['id','title','location','lat','lng','date','source','status','shape','duration','description','gov_ref'];
  const rows = [cols.join(','), ...all.map(s => cols.map(c => JSON.stringify(s[c] ?? '')).join(','))];
  download('phenomap-sightings.csv', rows.join('\n'), 'text/csv');
}

function exportJSON() {
  download('phenomap-sightings.json', JSON.stringify([...SIGHTINGS, ...userSightings], null, 2), 'application/json');
}

function download(filename, content, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = filename;
  a.click();
}

// ── PAYWALL ───────────────────────────────────────────────────
function checkPremium() {
  isPremium = readPremium();
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

function openStripe() {
  window.open(STRIPE_URL, '_blank', 'noopener,noreferrer');
}

function activatePremium() {
  isPremium = true;
  writePremium(true);
  closePaywall();
}

// ── ALERTS ────────────────────────────────────────────────────
function showRandomAlert() {
  const msgs = [
    'New sighting reported near Phoenix, AZ',
    'Gov sighting verified: USS Nimitz 2004',
    'New video submitted from Texas',
    'AARO released 3 new cases',
    'Sighting cluster detected over Pacific'
  ];
  setTimeout(() => {
    const banner = document.getElementById('alert-banner');
    const text = document.getElementById('alert-text');
    if (banner && text) {
      text.textContent = msgs[Math.floor(Math.random() * msgs.length)];
      banner.style.display = 'flex';
      setTimeout(() => banner.style.display = 'none', 6000);
    }
  }, 5000);
}

// ── HELPERS ───────────────────────────────────────────────────
function populateYearFilter() {
  const years = [...new Set([...SIGHTINGS,...userSightings].map(s => s.date?.split('-')[0]).filter(Boolean))].sort().reverse();
  const sel = document.getElementById('filter-year');
  if (!sel) return;
  years.forEach(y => {
    const o = document.createElement('option');
    o.value = y; o.textContent = y;
    sel.appendChild(o);
  });
}

function saveUserSightings() {
  writeUserSightings(userSightings);
}

function loadUserSightings() {
  userSightings = readUserSightings();
}
