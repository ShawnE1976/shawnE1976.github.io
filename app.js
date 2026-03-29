// ============================================================
//  PhenoMap — Application Logic
// ============================================================

let map;
let markerCluster;
let allMarkers = [];
let userSightings = [];

const SOURCE_COLORS = {
  gov:      '#f59e0b',
  mil:      '#ef4444',
  civilian: '#22c55e',
  aaro:     '#00d4ff'
};

// ── PAYWALL ───────────────────────────────────────────────────
// Replace YOUR_GUMROAD_PRODUCT_URL with your actual Gumroad link
const GUMROAD_URL = 'https://shawnsmith27.gumroad.com/l/ykpinc';

let isPremium = false;

function initPaywall() {
  // Check if user already unlocked (stored in localStorage)
  const token = localStorage.getItem('phenomap_premium');
  if (token === 'true') {
    isPremium = true;
    return;
  }
  // Show paywall after 1.5s
  setTimeout(() => {
    document.getElementById('paywall-overlay').classList.add('show');
  }, 1500);
}

function activateFree() {
  document.getElementById('paywall-overlay').classList.remove('show');
}

function openGumroad() {
  // Opens Gumroad overlay widget if script loaded, else fallback to new tab
  if (window.GumroadOverlay) {
    window.GumroadOverlay.show(GUMROAD_URL);
  } else {
    window.open(GUMROAD_URL, '_blank', 'noopener,noreferrer');
  }
}

// Call this after Gumroad purchase confirmation
function activatePremium() {
  isPremium = true;
  localStorage.setItem('phenomap_premium', 'true');
  document.getElementById('paywall-overlay').classList.remove('show');
  alert('Premium activated! Thank you for supporting PhenoMap.');
}

// ── INIT ─────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  populateYearFilter();
  loadUserSightings();
  initMap();
  renderList();
  renderGovIncidents();
  initPaywall();
});

function initMap() {
  map = L.map('map', {
    center: [25, 5],
    zoom: 2,
    minZoom: 2,
    maxZoom: 18,
    zoomControl: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(map);

  markerCluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 50,
    iconCreateFunction: cluster => {
      const count = cluster.getChildCount();
      return L.divIcon({
        html: `<div class="cluster-icon">${count}</div>`,
        className: '',
        iconSize: [38, 38]
      });
    }
  });

  map.addLayer(markerCluster);
  buildMarkers();
}

// ── MARKERS ──────────────────────────────────────────────────

function buildMarkers() {
  allMarkers = [];
  markerCluster.clearLayers();

  const combined = [...SIGHTINGS, ...userSightings];

  combined.forEach(s => {
    if (!s.lat || !s.lng) return;

    const color = SOURCE_COLORS[s.source] || '#94a3b8';
    const icon = L.divIcon({
      html: `<div style="
        width:14px;height:14px;
        background:${color};
        border:2px solid rgba(255,255,255,0.85);
        border-radius:50%;
        box-shadow:0 0 8px ${color};
      "></div>`,
      className: '',
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    const marker = L.marker([s.lat, s.lng], { icon });

    const shortDesc = s.description.length > 120
      ? s.description.slice(0, 120) + '…'
      : s.description;

    marker.bindPopup(`
      <div class="popup-title">${escHtml(s.title)}</div>
      <div class="popup-date">${formatDate(s.date)} &nbsp;·&nbsp; ${sourceLabel(s.source)}</div>
      <div class="popup-desc">${escHtml(shortDesc)}</div>
      <button class="popup-btn" onclick="openModal(${s.id !== undefined ? s.id : '"u' + s.uid + '"'})">
        View Details ${s.videos && s.videos.length ? '▶' : ''}
      </button>
    `, { maxWidth: 280 });

    marker._sightingData = s;
    allMarkers.push(marker);
    markerCluster.addLayer(marker);
  });

  updateCount();
}

function applyFilters() {
  const srcFilter  = document.getElementById('filter-source').value;
  const yearFilter = document.getElementById('filter-year').value;
  const vidFilter  = document.getElementById('filter-video').value;

  markerCluster.clearLayers();
  let visible = 0;

  allMarkers.forEach(marker => {
    const s = marker._sightingData;
    const year = s.date ? s.date.split('-')[0] : '';
    const hasVideo = s.videos && s.videos.length > 0;

    const srcOk  = srcFilter  === 'all' || s.source === srcFilter;
    const yearOk = yearFilter === 'all' || year === yearFilter;
    const vidOk  = vidFilter  === 'all' || (vidFilter === 'yes' && hasVideo);

    if (srcOk && yearOk && vidOk) {
      markerCluster.addLayer(marker);
      visible++;
    }
  });

  document.getElementById('sighting-count').textContent = `${visible} sightings`;
}

function updateCount() {
  const total = allMarkers.length;
  document.getElementById('sighting-count').textContent = `${total} sightings`;
}

// ── PANELS ───────────────────────────────────────────────────

function showPanel(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  document.getElementById(`panel-${name}`).classList.add('active');
  document.getElementById(`btn-${name}`).classList.add('active');

  if (name === 'map') {
    setTimeout(() => map && map.invalidateSize(), 50);
  }
  if (name === 'list') renderList();
}

// ── SIGHTINGS LIST ────────────────────────────────────────────

function renderList() {
  const query = (document.getElementById('search-input')?.value || '').toLowerCase();
  const combined = [...SIGHTINGS, ...userSightings];

  const filtered = combined.filter(s =>
    !query ||
    s.title.toLowerCase().includes(query) ||
    s.location.toLowerCase().includes(query) ||
    s.description.toLowerCase().includes(query)
  );

  const container = document.getElementById('sightings-list');
  if (!container) return;

  container.innerHTML = filtered.map(s => `
    <div class="sighting-card" onclick="openModal(${s.id !== undefined ? s.id : '"u' + s.uid + '"'})">
      <div class="card-header">
        <span class="card-title">${escHtml(s.title)}</span>
        <span class="card-date">${formatDate(s.date)}</span>
      </div>
      <div class="card-desc">${escHtml(s.location)} — ${escHtml(s.description)}</div>
      <div class="card-tags">
        <span class="tag tag-${s.source}">${sourceLabel(s.source)}</span>
        ${s.videos && s.videos.length ? '<span class="tag tag-video">▶ Video</span>' : ''}
        ${s.userSubmitted ? '<span class="tag" style="background:rgba(148,163,184,0.15);color:#94a3b8;">User Submitted</span>' : ''}
      </div>
    </div>
  `).join('');
}

// ── GOV INCIDENTS (About panel) ───────────────────────────────

function renderGovIncidents() {
  const govList = SIGHTINGS.filter(s => s.source === 'gov' || s.source === 'mil' || s.source === 'aaro');
  const container = document.getElementById('gov-incidents-list');
  if (!container) return;

  container.innerHTML = govList.map(s => `
    <div class="sighting-card" onclick="openModal(${s.id})">
      <div class="card-header">
        <span class="card-title">${escHtml(s.title)}</span>
        <span class="card-date">${formatDate(s.date)}</span>
      </div>
      <div class="card-desc"><strong>${escHtml(s.location)}</strong> — ${escHtml(s.gov_ref || '')}</div>
      <div class="card-tags">
        <span class="tag tag-${s.source}">${sourceLabel(s.source)}</span>
        ${s.videos && s.videos.length ? '<span class="tag tag-video">▶ Video</span>' : ''}
      </div>
    </div>
  `).join('');
}

// ── MODAL ─────────────────────────────────────────────────────

function openModal(id) {
  let s;
  if (typeof id === 'string' && id.startsWith('u')) {
    const uid = id.slice(1);
    s = userSightings.find(x => String(x.uid) === uid);
  } else {
    s = [...SIGHTINGS, ...userSightings].find(x => x.id === id);
  }
  if (!s) return;

  const videoHtml = buildVideoHtml(s.videos || []);

  document.getElementById('modal-content').innerHTML = `
    <h2>${escHtml(s.title)}</h2>
    <div class="modal-meta">
      <span>${formatDate(s.date)}</span>
      <span>·</span>
      <span>${escHtml(s.location)}</span>
      <span>·</span>
      <span class="tag tag-${s.source}" style="font-size:0.72rem;">${sourceLabel(s.source)}</span>
      ${s.shape ? `<span>· Shape: ${escHtml(s.shape)}</span>` : ''}
      ${s.duration ? `<span>· Duration: ${escHtml(s.duration)}</span>` : ''}
    </div>
    ${s.witnesses ? `<div style="font-size:0.82rem;color:#94a3b8;margin-bottom:0.75rem;">Witnesses: ${escHtml(s.witnesses)}</div>` : ''}
    <div class="modal-desc">${escHtml(s.description)}</div>
    ${videoHtml}
    ${s.gov_ref ? `<div class="modal-source"><strong>Government Reference:</strong> ${escHtml(s.gov_ref)}</div>` : ''}
    ${s.userSubmitted && s.submittedBy ? `<div class="modal-source">Submitted by: ${escHtml(s.submittedBy)}</div>` : ''}
    <div style="margin-top:1rem;">
      <button class="popup-btn" onclick="flyToOnMap(${s.lat}, ${s.lng})" style="font-size:0.8rem;">
        📍 Show on Map
      </button>
    </div>
  `;

  document.getElementById('modal-overlay').classList.add('open');
}

function buildVideoHtml(videos) {
  if (!videos || videos.length === 0) return '';

  const items = videos.map(url => {
    url = url.trim();
    const embedUrl = toEmbedUrl(url);
    if (embedUrl) {
      return `<iframe class="video-embed" src="${escHtml(embedUrl)}" allowfullscreen loading="lazy"></iframe>`;
    }
    return `<a class="video-link" href="${escHtml(url)}" target="_blank" rel="noopener noreferrer">▶ ${escHtml(url)}</a>`;
  }).join('');

  return `<div class="modal-videos"><h3>Video Evidence</h3>${items}</div>`;
}

function toEmbedUrl(url) {
  try {
    // Already embed format
    if (url.includes('youtube.com/embed/') || url.includes('player.vimeo.com')) return url;
    // YouTube watch
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    // Rumble embed
    if (url.includes('rumble.com/embed/')) return url;
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  } catch (e) {}
  return null;
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

function flyToOnMap(lat, lng) {
  closeModal();
  showPanel('map');
  setTimeout(() => {
    map.flyTo([lat, lng], 7, { duration: 1.2 });
  }, 100);
}

// ── SUBMIT ────────────────────────────────────────────────────

function handleSubmit(e) {
  e.preventDefault();

  const date     = document.getElementById('sub-date').value;
  const location = document.getElementById('sub-location').value.trim();
  const country  = document.getElementById('sub-country').value.trim();
  const lat      = parseFloat(document.getElementById('sub-lat').value) || null;
  const lng      = parseFloat(document.getElementById('sub-lng').value) || null;
  const desc     = document.getElementById('sub-desc').value.trim();
  const videoRaw = document.getElementById('sub-video').value.trim();
  const image    = document.getElementById('sub-image').value.trim();
  const source   = document.getElementById('sub-source').value.trim();
  const name     = document.getElementById('sub-name').value.trim() || 'Anonymous';

  const videos = videoRaw
    ? videoRaw.split(',').map(v => v.trim()).filter(Boolean)
    : [];

  const newSighting = {
    uid: Date.now(),
    title: `${location}, ${country}`,
    location: `${location}, ${country}`,
    lat: lat || geoGuess(location),
    lng: lng || null,
    date,
    source: 'civilian',
    description: desc,
    videos,
    image,
    gov_ref: source,
    shape: '',
    duration: '',
    witnesses: name,
    submittedBy: name,
    userSubmitted: true
  };

  userSightings.push(newSighting);
  saveUserSightings();
  buildMarkers();
  renderList();

  document.getElementById('submit-form').reset();
  document.getElementById('submit-success').style.display = 'block';
  setTimeout(() => {
    document.getElementById('submit-success').style.display = 'none';
  }, 8000);
}

// Rough lat/lng guesses for common US cities (fallback)
function geoGuess(location) {
  const lower = location.toLowerCase();
  const known = {
    'phoenix': 33.4484, 'new york': 40.7128, 'los angeles': 34.0522,
    'chicago': 41.8781, 'houston': 29.7604, 'dallas': 32.7767,
    'miami': 25.7617, 'seattle': 47.6062, 'denver': 39.7392,
    'atlanta': 33.749, 'las vegas': 36.1699, 'washington': 38.9072
  };
  for (const [city, lat] of Object.entries(known)) {
    if (lower.includes(city)) return lat;
  }
  return 0;
}

// ── PERSISTENCE ───────────────────────────────────────────────

function saveUserSightings() {
  try {
    localStorage.setItem('phenomap_user_sightings', JSON.stringify(userSightings));
  } catch (e) {}
}

function loadUserSightings() {
  try {
    const raw = localStorage.getItem('phenomap_user_sightings');
    if (raw) userSightings = JSON.parse(raw);
  } catch (e) {
    userSightings = [];
  }
}

// ── HELPERS ───────────────────────────────────────────────────

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  if (!dateStr) return 'Date unknown';
  try {
    const [y, m, d] = dateStr.split('-');
    if (!m) return y;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${d ? d + ' ' : ''}${months[parseInt(m,10)-1]} ${y}`;
  } catch (e) { return dateStr; }
}

function sourceLabel(src) {
  const labels = { gov:'US Gov', mil:'Military', civilian:'Civilian', aaro:'AARO' };
  return labels[src] || src;
}
