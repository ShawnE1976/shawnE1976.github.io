// ============================================================
//  DockLedger — Liveaboard Marina Companion App
// ============================================================

const STRIPE_URL = 'https://buy.stripe.com/5kQaEZ5zy4QI4vJaLr83C04';

let map, markerCluster;
let allMarkers = [];
let expenses = [];
let maintenanceTasks = [];
let userBoats = [];
let isPremium = false;
let settings = {};

// Colors for marina markers
const MARINA_COLORS = {
  affordable: '#22c55e',
  moderate: '#f59e0b',
  premium: '#ef4444'
};

// ── INIT ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadExpenses();
  loadMaintenance();
  loadBoats();
  checkPremium();
  initMap();
  renderExpensesList();
  renderMaintenanceList();
  renderAnalytics();
  updateSidebarStats();
  showPaywallDelayed();
  populateFilters();
});

// ── MAP ───────────────────────────────────────────────────────
function initMap() {
  map = L.map('map', { center: [30, -85], zoom: 4, minZoom: 3, maxZoom: 18, zoomControl: true });

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
  buildMarinaMarkers();
}

function buildMarinaMarkers() {
  allMarkers = [];
  markerCluster.clearLayers();

  MARINAS.forEach(m => {
    const color = m.price < 350 ? MARINA_COLORS.affordable : 
                  m.price < 500 ? MARINA_COLORS.moderate : 
                  MARINA_COLORS.premium;
    
    const icon = L.divIcon({
      html: `<div style="
        width:20px;height:20px;
        background:${color};
        border:2px solid rgba(255,255,255,0.9);
        border-radius:4px;
        box-shadow:0 0 8px ${color}88;
      "></div>`,
      className: '', iconSize: [20, 20], iconAnchor: [10, 10]
    });

    const marker = L.marker([m.lat, m.lng], { icon });
    const amenities = m.amenities.slice(0, 3).join(', ');
    
    marker.bindPopup(`
      <div class="popup-title">${escHtml(m.name)}</div>
      <div class="popup-loc">📍 ${escHtml(m.location)}</div>
      <div class="popup-price">$${m.price}/mo</div>
      <div class="popup-amenities">${amenities}</div>
      <div class="popup-liveaboard">${m.liveaboard ? '✅ Liveaboard OK' : '❌ No Liveaboard'}</div>
      <button class="popup-btn" onclick="openMarinaModal(${m.id})">
        View Details
      </button>
    `, { maxWidth: 280 });

    marker._marinaData = m;
    allMarkers.push(marker);
    markerCluster.addLayer(marker);
  });
}

function openMarinaModal(id) {
  const m = MARINAS.find(x => x.id === id);
  if (!m) return;

  document.getElementById('modal-content').innerHTML = `
    <h2>${escHtml(m.name)}</h2>
    <div class="modal-meta">
      <span>📍 ${escHtml(m.location)}</span>
      <span>$${m.price}/month</span>
    </div>
    <div class="modal-amenities">
      <h4>Amenities:</h4>
      <div class="amenity-tags">
        ${m.amenities.map(a => `<span class="amenity-tag">${a}</span>`).join('')}
      </div>
    </div>
    <div class="modal-contact">
      <h4>Contact:</h4>
      <p>📞 ${escHtml(m.contact)}</p>
      <p>🌐 <a href="${m.website}" target="_blank">${m.website}</a></p>
    </div>
    <div class="modal-actions">
      <button class="btn-map" onclick="flyToMarina(${m.lat},${m.lng})">📍 Show on Map</button>
      <button class="btn-map" onclick="saveFavoriteMarina(${m.id})">⭐ Save Favorite</button>
    </div>
  `;

  document.getElementById('modal-overlay').classList.add('open');
}

function flyToMarina(lat, lng) {
  closeModal();
  showPanel('map', document.querySelector('.snav[data-panel="map"]'));
  setTimeout(() => map.flyTo([lat, lng], 10, { duration: 1.2 }), 100);
}

function saveFavoriteMarina(id) {
  const favs = JSON.parse(localStorage.getItem('dockledger_favorites') || '[]');
  if (!favs.includes(id)) {
    favs.push(id);
    localStorage.setItem('dockledger_favorites', JSON.stringify(favs));
    alert('Marina saved to favorites!');
  } else {
    alert('Already in favorites!');
  }
}

// ── PANELS ────────────────────────────────────────────────────
function showPanel(name, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.snav').forEach(b => b.classList.remove('active'));
  document.getElementById(`panel-${name}`).classList.add('active');
  if (btn) btn.classList.add('active');
  if (name === 'map') setTimeout(() => map?.invalidateSize(), 50);
  if (name === 'expenses') renderExpensesList();
  if (name === 'maintenance') renderMaintenanceList();
  if (name === 'analytics') renderAnalytics();
  if (window.innerWidth < 768) document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ── EXPENSES ─────────────────────────────────────────────────
function renderExpensesList() {
  const cat = document.getElementById('expense-category-filter')?.value || 'all';
  const filtered = cat === 'all' ? expenses : expenses.filter(e => e.category === cat);
  
  const container = document.getElementById('expenses-list');
  if (!container) return;

  const total = filtered.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

  container.innerHTML = `
    <div class="expense-summary">
      <span>Total: <strong>$${total.toFixed(2)}</strong></span>
      <span>${filtered.length} expenses</span>
    </div>
    ${filtered.map(e => `
      <div class="expense-card" onclick="openExpenseModal(${e.id})">
        <div class="expense-left">
          <span class="expense-category">${e.category}</span>
          <span class="expense-desc">${escHtml(e.description)}</span>
        </div>
        <div class="expense-right">
          <span class="expense-amount">$${parseFloat(e.amount).toFixed(2)}</span>
          <span class="expense-date">${formatDate(e.date)}</span>
        </div>
      </div>
    `).join('')}
    ${filtered.length === 0 ? '<div class="empty-state">No expenses yet. Add one!</div>' : ''}
  `;
}

function openExpenseModal(id) {
  const e = expenses.find(x => x.id === id);
  if (!e) return;

  document.getElementById('modal-content').innerHTML = `
    <h2>${escHtml(e.description)}</h2>
    <div class="modal-meta">
      <span>${e.category}</span> · <span>${formatDate(e.date)}</span>
    </div>
    <div class="modal-amount">$${parseFloat(e.amount).toFixed(2)}</div>
    ${e.notes ? `<div class="modal-notes">${escHtml(e.notes)}</div>` : ''}
    <div class="modal-actions">
      <button class="btn-map" onclick="deleteExpense(${e.id})">🗑 Delete</button>
    </div>
  `;

  document.getElementById('modal-overlay').classList.add('open');
}

function handleExpenseSubmit(e) {
  e.preventDefault();
  
  const expense = {
    id: Date.now(),
    amount: document.getElementById('expense-amount').value,
    category: document.getElementById('expense-category').value,
    description: document.getElementById('expense-desc').value,
    date: document.getElementById('expense-date').value,
    notes: document.getElementById('expense-notes').value,
    boatId: document.getElementById('expense-boat')?.value || null
  };

  expenses.push(expense);
  saveExpenses();
  renderExpensesList();
  updateSidebarStats();
  document.getElementById('expense-form').reset();
  showToast('Expense added!');
}

function deleteExpense(id) {
  expenses = expenses.filter(e => e.id !== id);
  saveExpenses();
  closeModal();
  renderExpensesList();
  updateSidebarStats();
}

// ── MAINTENANCE ───────────────────────────────────────────────
function renderMaintenanceList() {
  const status = document.getElementById('maintenance-status-filter')?.value || 'all';
  const filtered = status === 'all' ? maintenanceTasks : maintenanceTasks.filter(t => t.status === status);
  
  const container = document.getElementById('maintenance-list');
  if (!container) return;

  container.innerHTML = filtered.map(t => `
    <div class="maintenance-card" onclick="openMaintenanceModal(${t.id})">
      <div class="maintenance-header">
        <span class="maintenance-title">${escHtml(t.title)}</span>
        <span class="status-badge status-${t.status.toLowerCase().replace(' ', '-')}">${t.status}</span>
      </div>
      <div class="maintenance-meta">
        <span>${t.category}</span> · <span>${t.boatName || 'No boat assigned'}</span>
      </div>
      <div class="maintenance-desc">${escHtml(t.description)}</div>
    </div>
  `).join('');

  if (filtered.length === 0) {
    container.innerHTML += '<div class="empty-state">No maintenance tasks. Add one!</div>';
  }
}

function openMaintenanceModal(id) {
  const t = maintenanceTasks.find(x => x.id === id);
  if (!t) return;

  document.getElementById('modal-content').innerHTML = `
    <h2>${escHtml(t.title)}</h2>
    <div class="modal-meta">
      <span>${t.category}</span> · <span class="status-badge status-${t.status.toLowerCase().replace(' ', '-')}">${t.status}</span>
    </div>
    <div class="modal-desc">${escHtml(t.description)}</div>
    ${t.cost ? `<div class="modal-cost">Cost: $${t.cost}</div>` : ''}
    ${t.dueDate ? `<div class="modal-due">Due: ${formatDate(t.dueDate)}</div>` : ''}
    <div class="modal-actions">
      <button class="btn-map" onclick="deleteMaintenance(${t.id})">🗑 Delete</button>
    </div>
  `;

  document.getElementById('modal-overlay').classList.add('open');
}

function handleMaintenanceSubmit(e) {
  e.preventDefault();
  
  const task = {
    id: Date.now(),
    title: document.getElementById('task-title').value,
    category: document.getElementById('task-category').value,
    status: document.getElementById('task-status').value,
    description: document.getElementById('task-desc').value,
    dueDate: document.getElementById('task-due').value,
    cost: document.getElementById('task-cost').value,
    boatId: document.getElementById('task-boat')?.value || null,
    boatName: document.getElementById('task-boat')?.selectedOptions?.[0]?.text || ''
  };

  maintenanceTasks.push(task);
  saveMaintenance();
  renderMaintenanceList();
  updateSidebarStats();
  document.getElementById('maintenance-form').reset();
  showToast('Task added!');
}

function deleteMaintenance(id) {
  maintenanceTasks = maintenanceTasks.filter(t => t.id !== id);
  saveMaintenance();
  closeModal();
  renderMaintenanceList();
  updateSidebarStats();
}

// ── ANALYTICS ────────────────────────────────────────────────
function renderAnalytics() {
  // Expense by category
  const catTotals = {};
  expenses.forEach(e => {
    catTotals[e.category] = (catTotals[e.category] || 0) + parseFloat(e.amount || 0);
  });
  renderBarChart('chart-expenses', Object.entries(catTotals).sort((a,b) => b[1] - a[1]).slice(0, 6));

  // Maintenance by status
  const statusCounts = {};
  maintenanceTasks.forEach(t => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
  });
  renderBarChart('chart-maintenance', Object.entries(statusCounts), null);

  // Monthly trend
  const monthlyTotals = {};
  expenses.forEach(e => {
    const month = e.date?.slice(0, 7) || 'Unknown';
    monthlyTotals[month] = (monthlyTotals[month] || 0) + parseFloat(e.amount || 0);
  });
  const sortedMonths = Object.entries(monthlyTotals).sort((a,b) => a[0].localeCompare(b[0])).slice(-6);
  renderBarChart('chart-trend', sortedMonths, null);
}

function renderBarChart(containerId, entries, colorMap) {
  const container = document.getElementById(containerId);
  if (!container || !entries.length) return;
  const max = Math.max(...entries.map(e => e[1]));
  const colors = ['#00d4ff','#7c3aed','#f59e0b','#22c55e','#ef4444','#06b6d4'];

  container.innerHTML = entries.map(([label, val], i) => {
    const color = colorMap ? (colorMap[label] || colors[i % colors.length]) : colors[i % colors.length];
    const pct = max > 0 ? Math.round(val / max * 100) : 0;
    return `
      <div class="bar-row">
        <span class="bar-label">${escHtml(String(label))}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <span class="bar-val">${typeof val === 'number' && val > 100 ? '$' + val.toFixed(0) : val}</span>
      </div>
    `;
  }).join('');
}

// ── SIDEBAR STATS ─────────────────────────────────────────────
function updateSidebarStats() {
  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const pendingTasks = maintenanceTasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
  const completedTasks = maintenanceTasks.filter(t => t.status === 'Completed').length;
  const savedMarinas = (JSON.parse(localStorage.getItem('dockledger_favorites') || '[]')).length;

  document.getElementById('sb-expenses').textContent = `$${totalExpenses.toFixed(0)}`;
  document.getElementById('sb-tasks').textContent = pendingTasks;
  document.getElementById('sb-completed').textContent = completedTasks;
  document.getElementById('sb-marinas').textContent = savedMarinas;
}

// ── MODAL ─────────────────────────────────────────────────────
function closeModal() { 
  document.getElementById('modal-overlay').classList.remove('open'); 
}

// ── SETTINGS ─────────────────────────────────────────────────
function loadSettings() {
  try {
    const s = localStorage.getItem('dockledger_settings');
    settings = s ? JSON.parse(s) : {};
  } catch (e) { settings = {}; }
}

function saveSettings() {
  settings = {
    darkMode: document.getElementById('s-darkmode')?.checked,
    units: document.getElementById('s-units')?.value,
    currency: document.getElementById('s-currency')?.value,
  };
  try { localStorage.setItem('dockledger_settings', JSON.stringify(settings)); } catch (e) {}
}

function toggleDarkMode(cb) {
  document.body.classList.toggle('dark-mode', cb.checked);
  saveSettings();
}

// ── EXPORT ────────────────────────────────────────────────────
function exportExpensesCSV() {
  const rows = [['Date', 'Category', 'Description', 'Amount', 'Notes'], 
    ...expenses.map(e => [e.date, e.category, e.description, e.amount, e.notes || ''])];
  const csv = rows.map(r => r.join(',')).join('\n');
  download('dockledger-expenses.csv', csv, 'text/csv');
}

function exportMaintenanceJSON() {
  download('dockledger-maintenance.json', JSON.stringify(maintenanceTasks, null, 2), 'application/json');
}

function download(filename, content, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = filename;
  a.click();
}

// ── PAYWALL ───────────────────────────────────────────────────
function checkPremium() {
  isPremium = localStorage.getItem('dockledger_premium') === 'true';
}

function showPaywall() {
  document.getElementById('paywall-overlay').classList.add('show');
}

function closePaywall() {
  document.getElementById('paywall-overlay').classList.remove('show');
}

function showPaywallDelayed() {
  if (isPremium) return;
  setTimeout(showPaywall, 3000);
}

function openStripe() {
  window.open(STRIPE_URL, '_blank');
}

function activatePremium() {
  isPremium = true;
  localStorage.setItem('dockledger_premium', 'true');
  closePaywall();
  showToast('Premium activated!');
}

// ── HELPERS ───────────────────────────────────────────────────
function populateFilters() {
  // Populate expense categories
  const expCat = document.getElementById('expense-category');
  const expCatFilter = document.getElementById('expense-category-filter');
  EXPENSE_CATEGORIES.forEach(c => {
    if (expCat) {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      expCat.appendChild(opt);
    }
    if (expCatFilter) {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      expCatFilter.appendChild(opt);
    }
  });

  // Populate maintenance categories
  const mtnCat = document.getElementById('task-category');
  const mtnStatus = document.getElementById('task-status');
  const mtnFilter = document.getElementById('maintenance-status-filter');
  
  MAINTENANCE_CATEGORIES.forEach(c => {
    if (mtnCat) {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      mtnCat.appendChild(opt);
    }
  });

  MAINTENANCE_STATUS.forEach(s => {
    if (mtnStatus) {
      const opt = document.createElement('option');
      opt.value = s; opt.textContent = s;
      mtnStatus.appendChild(opt);
    }
    if (mtnFilter) {
      const opt = document.createElement('option');
      opt.value = s; opt.textContent = s;
      mtnFilter.appendChild(opt);
    }
  });
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(d) {
  if (!d) return 'N/A';
  try {
    const [y, m, day] = d.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(m,10)-1] || ''} ${day}, ${y}`;
  } catch (e) { return d; }
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
}

// ── LOCAL STORAGE ─────────────────────────────────────────────
function saveExpenses() {
  try { localStorage.setItem('dockledger_expenses', JSON.stringify(expenses)); } catch (e) {}
}

function loadExpenses() {
  try {
    const raw = localStorage.getItem('dockledger_expenses');
    if (raw) expenses = JSON.parse(raw);
  } catch (e) { expenses = []; }
}

function saveMaintenance() {
  try { localStorage.setItem('dockledger_maintenance', JSON.stringify(maintenanceTasks)); } catch (e) {}
}

function loadMaintenance() {
  try {
    const raw = localStorage.getItem('dockledger_maintenance');
    if (raw) maintenanceTasks = JSON.parse(raw);
  } catch (e) { maintenanceTasks = []; }
}

function loadBoats() {
  try {
    const raw = localStorage.getItem('dockledger_boats');
    if (raw) userBoats = JSON.parse(raw);
  } catch (e) { userBoats = []; }
}