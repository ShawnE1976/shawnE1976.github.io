// ============================================================
//  DockLedger — Application Logic
// ============================================================

let map;
let markerCluster;
let allMarkers = [];
let expenses = [];
let maintLog = [];
let currentUser = null;
let currentMaintFilter = 'all';

const TYPE_COLORS = {
  'full-service': '#4fc3f7',
  'liveaboard':   '#22c55e',
  'fuel':         '#fb923c',
  'boatyard':     '#a78bfa',
  'anchorage':    '#f59e0b'
};

// ── LOGIN / AUTH ─────────────────────────────────────────────

function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim() || 'Captain';
  currentUser = username;
  localStorage.setItem('dockledger_user', username);
  showApp();
}

function handleLogout() {
  localStorage.removeItem('dockledger_user');
  currentUser = null;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login-screen').style.display = '';
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('header-username').textContent = currentUser;
  document.getElementById('dash-username').textContent = currentUser;
  updateDashboard();
}

// ── INIT ─────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  loadData();
  setDefaultDates();

  const savedUser = localStorage.getItem('dockledger_user');
  if (savedUser) {
    currentUser = savedUser;
    showApp();
  }
});

function setDefaultDates() {
  const today = new Date().toISOString().split('T')[0];
  const dateFields = ['expense-date', 'maint-date'];
  dateFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = today;
  });
}

// ── MAP ──────────────────────────────────────────────────────

let mapInitialized = false;

function initMap() {
  if (mapInitialized) return;
  mapInitialized = true;

  map = L.map('map', {
    center: [30, -80],
    zoom: 5,
    minZoom: 3,
    maxZoom: 18,
    zoomControl: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(map);

  markerCluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 50,
    iconCreateFunction: cluster => {
      const count = cluster.getChildCount();
      return L.divIcon({
        html: '<div class="cluster-icon">' + count + '</div>',
        className: '',
        iconSize: [38, 38]
      });
    }
  });

  map.addLayer(markerCluster);
  buildMarkers();
}

function buildMarkers() {
  allMarkers = [];
  if (markerCluster) markerCluster.clearLayers();

  MARINAS.forEach(m => {
    const color = TYPE_COLORS[m.type] || '#94a3b8';
    const icon = L.divIcon({
      html: '<div style="' +
        'width:14px;height:14px;' +
        'background:' + color + ';' +
        'border:2px solid rgba(255,255,255,0.85);' +
        'border-radius:50%;' +
        'box-shadow:0 0 8px ' + color + ';' +
      '"></div>',
      className: '',
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    const marker = L.marker([m.lat, m.lng], { icon });

    const shortDesc = m.description.length > 100
      ? m.description.slice(0, 100) + '...'
      : m.description;

    const amenityStr = m.amenities.slice(0, 4).join(', ');

    marker.bindPopup(
      '<div class="popup-title">' + escHtml(m.name) + '</div>' +
      '<div class="popup-date">' + escHtml(m.location) + ' &middot; ' + typeLabel(m.type) + '</div>' +
      '<div class="popup-desc">' + escHtml(shortDesc) + '</div>' +
      '<div class="popup-amenities">' + escHtml(amenityStr) + '</div>' +
      '<div class="popup-rate">Slip: ' + escHtml(m.slipRate) + '</div>' +
      '<button class="popup-btn" onclick="openModal(' + m.id + ')">View Details</button>',
      { maxWidth: 280 }
    );

    marker._marinaData = m;
    allMarkers.push(marker);
    markerCluster.addLayer(marker);
  });

  updateMarinaCount();
}

function applyFilters() {
  const typeFilter = document.getElementById('filter-type').value;
  const regionFilter = document.getElementById('filter-region').value;

  markerCluster.clearLayers();
  let visible = 0;

  allMarkers.forEach(marker => {
    const m = marker._marinaData;

    const typeOk = typeFilter === 'all' || m.type === typeFilter ||
      (typeFilter === 'liveaboard' && m.liveaboard);
    const regionOk = regionFilter === 'all' || m.region === regionFilter;

    if (typeOk && regionOk) {
      markerCluster.addLayer(marker);
      visible++;
    }
  });

  document.getElementById('marina-count').textContent = visible + ' marinas';
}

function updateMarinaCount() {
  document.getElementById('marina-count').textContent = allMarkers.length + ' marinas';
}

// ── PANELS ───────────────────────────────────────────────────

function showPanel(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  document.getElementById('panel-' + name).classList.add('active');
  document.getElementById('btn-' + name).classList.add('active');

  if (name === 'map') {
    initMap();
    setTimeout(() => map && map.invalidateSize(), 50);
  }
  if (name === 'dashboard') updateDashboard();
  if (name === 'expenses') renderExpenses();
  if (name === 'maintenance') renderMaintenance();
}

// ── MARINA MODAL ─────────────────────────────────────────────

function openModal(id) {
  const m = MARINAS.find(x => x.id === id);
  if (!m) return;

  const amenityHtml = m.amenities.map(a => '<span class="amenity-chip">' + escHtml(a) + '</span>').join('');
  const fuelStr = [];
  if (m.fuel.gas) fuelStr.push('Gas');
  if (m.fuel.diesel) fuelStr.push('Diesel');

  const stars = '&#9733;'.repeat(Math.floor(m.rating)) +
    (m.rating % 1 >= 0.5 ? '&#9734;' : '');

  document.getElementById('modal-content').innerHTML =
    '<h2>' + escHtml(m.name) + '</h2>' +
    '<div class="modal-meta">' +
      '<span>' + escHtml(m.location) + '</span>' +
      '<span>&middot;</span>' +
      '<span class="tag tag-' + m.type + '">' + typeLabel(m.type) + '</span>' +
      (m.liveaboard ? '<span class="tag tag-liveaboard">Liveaboard OK</span>' : '') +
    '</div>' +
    '<div class="modal-rating">' +
      '<span class="stars">' + stars + '</span>' +
      '<span>' + m.rating + ' (' + m.reviews + ' reviews)</span>' +
    '</div>' +
    '<div class="modal-desc">' + escHtml(m.description) + '</div>' +
    '<div class="modal-section">' +
      '<h3>Slip Rate</h3>' +
      '<p>' + escHtml(m.slipRate) + '</p>' +
    '</div>' +
    '<div class="modal-section">' +
      '<h3>Amenities</h3>' +
      '<div class="amenity-grid">' + amenityHtml + '</div>' +
    '</div>' +
    (fuelStr.length ? '<div class="modal-section"><h3>Fuel</h3><p>' + fuelStr.join(', ') + '</p></div>' : '') +
    (m.phone ? '<div class="modal-section"><h3>Contact</h3><p>' + escHtml(m.phone) + '</p></div>' : '') +
    '<div class="modal-actions">' +
      '<button class="popup-btn" onclick="flyToMarina(' + m.lat + ',' + m.lng + ')">Show on Map</button>' +
    '</div>';

  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

function flyToMarina(lat, lng) {
  closeModal();
  showPanel('map');
  setTimeout(() => {
    map.flyTo([lat, lng], 14, { duration: 1.2 });
  }, 100);
}

// ── EXPENSES ─────────────────────────────────────────────────

function addExpense(e) {
  e.preventDefault();

  const expense = {
    id: Date.now(),
    amount: parseFloat(document.getElementById('expense-amount').value),
    category: document.getElementById('expense-category').value,
    date: document.getElementById('expense-date').value,
    location: document.getElementById('expense-location').value.trim(),
    notes: document.getElementById('expense-notes').value.trim()
  };

  expenses.push(expense);
  saveData();
  document.getElementById('expense-form').reset();
  setDefaultDates();
  renderExpenses();
  updateDashboard();
}

function deleteExpense(id) {
  expenses = expenses.filter(e => e.id !== id);
  saveData();
  renderExpenses();
  updateDashboard();
}

function renderExpenses() {
  const list = document.getElementById('expense-list');
  if (!list) return;

  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) {
    list.innerHTML = '<p class="empty-state">No expenses yet. Add your first one above!</p>';
  } else {
    list.innerHTML = sorted.map(exp => {
      const cat = CATEGORY_INFO[exp.category] || CATEGORY_INFO.other;
      return '<div class="expense-item">' +
        '<div class="expense-left">' +
          '<span class="expense-icon">' + cat.icon + '</span>' +
          '<div class="expense-info">' +
            '<span class="expense-cat">' + escHtml(cat.label) + '</span>' +
            '<span class="expense-detail">' +
              escHtml(exp.notes || exp.location || '') +
              ' &middot; ' + formatDate(exp.date) +
            '</span>' +
          '</div>' +
        '</div>' +
        '<div class="expense-right">' +
          '<span class="expense-amt">$' + exp.amount.toFixed(2) + '</span>' +
          '<button class="delete-btn" onclick="deleteExpense(' + exp.id + ')" title="Delete">&times;</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  renderBreakdown();
}

function renderBreakdown() {
  const grid = document.getElementById('breakdown-grid');
  if (!grid) return;

  const now = new Date();
  const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

  const monthExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
  const totals = {};
  let grandTotal = 0;

  monthExpenses.forEach(e => {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
    grandTotal += e.amount;
  });

  if (grandTotal === 0) {
    grid.innerHTML = '<p class="empty-state">No expenses this month yet.</p>';
    return;
  }

  grid.innerHTML = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, total]) => {
      const info = CATEGORY_INFO[cat] || CATEGORY_INFO.other;
      const pct = ((total / grandTotal) * 100).toFixed(0);
      return '<div class="breakdown-item">' +
        '<div class="breakdown-header">' +
          '<span>' + info.icon + ' ' + info.label + '</span>' +
          '<span>$' + total.toFixed(2) + '</span>' +
        '</div>' +
        '<div class="breakdown-bar">' +
          '<div class="breakdown-fill" style="width:' + pct + '%;background:' + info.color + '"></div>' +
        '</div>' +
      '</div>';
    }).join('') +
    '<div class="breakdown-total">Total: $' + grandTotal.toFixed(2) + '</div>';
}

// ── MAINTENANCE LOG ──────────────────────────────────────────

function addMaintenance(e) {
  e.preventDefault();

  const entry = {
    id: Date.now(),
    title: document.getElementById('maint-title').value.trim(),
    category: document.getElementById('maint-category').value,
    date: document.getElementById('maint-date').value,
    status: document.getElementById('maint-status').value,
    notes: document.getElementById('maint-notes').value.trim()
  };

  maintLog.push(entry);
  saveData();
  document.getElementById('maint-form').reset();
  setDefaultDates();
  renderMaintenance();
  updateDashboard();
}

function deleteMaint(id) {
  maintLog = maintLog.filter(m => m.id !== id);
  saveData();
  renderMaintenance();
  updateDashboard();
}

function toggleMaintStatus(id) {
  const entry = maintLog.find(m => m.id === id);
  if (!entry) return;
  const cycle = { 'scheduled': 'in-progress', 'in-progress': 'completed', 'completed': 'scheduled' };
  entry.status = cycle[entry.status] || 'completed';
  saveData();
  renderMaintenance();
  updateDashboard();
}

function filterMaint(filter, btn) {
  currentMaintFilter = filter;
  document.querySelectorAll('.maint-filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderMaintenance();
}

function renderMaintenance() {
  const list = document.getElementById('maint-list');
  if (!list) return;

  let filtered = [...maintLog].sort((a, b) => b.date.localeCompare(a.date));
  if (currentMaintFilter !== 'all') {
    filtered = filtered.filter(m => m.status === currentMaintFilter);
  }

  if (filtered.length === 0) {
    list.innerHTML = '<p class="empty-state">No maintenance entries' +
      (currentMaintFilter !== 'all' ? ' with status "' + currentMaintFilter + '"' : '') +
      '.</p>';
    return;
  }

  list.innerHTML = filtered.map(entry => {
    const cat = MAINT_CATEGORY_INFO[entry.category] || MAINT_CATEGORY_INFO.other;
    const statusClass = 'status-' + entry.status;
    const statusLabel = entry.status.replace('-', ' ');

    return '<div class="maint-item">' +
      '<div class="maint-left">' +
        '<span class="maint-icon">' + cat.icon + '</span>' +
        '<div class="maint-info">' +
          '<span class="maint-title">' + escHtml(entry.title) + '</span>' +
          '<span class="maint-detail">' +
            escHtml(cat.label) + ' &middot; ' + formatDate(entry.date) +
          '</span>' +
          (entry.notes ? '<span class="maint-notes">' + escHtml(entry.notes) + '</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="maint-right">' +
        '<span class="maint-status ' + statusClass + '" onclick="toggleMaintStatus(' + entry.id + ')">' +
          statusLabel +
        '</span>' +
        '<button class="delete-btn" onclick="deleteMaint(' + entry.id + ')" title="Delete">&times;</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ── DASHBOARD ────────────────────────────────────────────────

function updateDashboard() {
  const now = new Date();
  const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  const monthExpenses = expenses.filter(e => e.date.startsWith(currentMonth));

  const slipTotal = monthExpenses.filter(e => e.category === 'slip').reduce((s, e) => s + e.amount, 0);
  const maintTotal = monthExpenses.filter(e => e.category === 'maintenance' || e.category === 'rigging').reduce((s, e) => s + e.amount, 0);
  const provTotal = monthExpenses.filter(e => e.category === 'provisioning').reduce((s, e) => s + e.amount, 0);
  const total = monthExpenses.reduce((s, e) => s + e.amount, 0);

  document.getElementById('stat-slip').textContent = '$' + slipTotal.toFixed(0);
  document.getElementById('stat-maint').textContent = '$' + maintTotal.toFixed(0);
  document.getElementById('stat-prov').textContent = '$' + provTotal.toFixed(0);
  document.getElementById('stat-total').textContent = '$' + total.toFixed(0);

  // Recent expenses
  const recentEl = document.getElementById('recent-expenses');
  if (recentEl) {
    const recent = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    if (recent.length === 0) {
      recentEl.innerHTML = '<p class="empty-state">No expenses yet. Start tracking!</p>';
    } else {
      recentEl.innerHTML = recent.map(exp => {
        const cat = CATEGORY_INFO[exp.category] || CATEGORY_INFO.other;
        return '<div class="recent-item">' +
          '<span>' + cat.icon + ' ' + escHtml(cat.label) + '</span>' +
          '<span>$' + exp.amount.toFixed(2) + '</span>' +
        '</div>';
      }).join('');
    }
  }

  // Upcoming maintenance
  const upcomingEl = document.getElementById('upcoming-maintenance');
  if (upcomingEl) {
    const upcoming = maintLog
      .filter(m => m.status === 'scheduled' || m.status === 'in-progress')
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
    if (upcoming.length === 0) {
      upcomingEl.innerHTML = '<p class="empty-state">No upcoming maintenance.</p>';
    } else {
      upcomingEl.innerHTML = upcoming.map(entry => {
        const cat = MAINT_CATEGORY_INFO[entry.category] || MAINT_CATEGORY_INFO.other;
        const statusClass = 'status-' + entry.status;
        return '<div class="recent-item">' +
          '<span>' + cat.icon + ' ' + escHtml(entry.title) + '</span>' +
          '<span class="maint-status ' + statusClass + '" style="font-size:0.7rem">' +
            entry.status.replace('-', ' ') +
          '</span>' +
        '</div>';
      }).join('');
    }
  }
}

// ── PERSISTENCE ──────────────────────────────────────────────

function saveData() {
  try {
    localStorage.setItem('dockledger_expenses', JSON.stringify(expenses));
    localStorage.setItem('dockledger_maintenance', JSON.stringify(maintLog));
  } catch (e) {}
}

function loadData() {
  try {
    const expRaw = localStorage.getItem('dockledger_expenses');
    if (expRaw) expenses = JSON.parse(expRaw);
    const maintRaw = localStorage.getItem('dockledger_maintenance');
    if (maintRaw) maintLog = JSON.parse(maintRaw);
  } catch (e) {
    expenses = [];
    maintLog = [];
  }
}

// ── HELPERS ──────────────────────────────────────────────────

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return (d ? d + ' ' : '') + months[parseInt(m, 10) - 1] + ' ' + y;
  } catch (e) { return dateStr; }
}

function typeLabel(type) {
  const labels = {
    'full-service': 'Full Service',
    'liveaboard': 'Liveaboard',
    'fuel': 'Fuel Dock',
    'boatyard': 'Boatyard',
    'anchorage': 'Anchorage'
  };
  return labels[type] || type;
}
