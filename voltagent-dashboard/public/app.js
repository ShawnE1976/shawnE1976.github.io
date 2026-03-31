// ============================================================================
// AgentHub - Real-time Dashboard Frontend
// Connects to server via WebSocket for live agent orchestration
// ============================================================================

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------

  let state = { agents: [], tasks: [], logs: [], config: {} };
  let ws = null;
  let currentDetailAgent = null;
  let currentDetailTab = 'logs';
  let logFilterText = '';
  let reconnectTimer = null;

  // --------------------------------------------------------------------------
  // WEBSOCKET
  // --------------------------------------------------------------------------

  function connect() {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${proto}//${location.host}`);

    ws.onopen = () => {
      showToast('Connected to AgentHub server', 'success');
      if (reconnectTimer) { clearInterval(reconnectTimer); reconnectTimer = null; }
    };

    ws.onmessage = (evt) => {
      let msg;
      try { msg = JSON.parse(evt.data); } catch { return; }

      switch (msg.type) {
        case 'state':
          state = msg.data;
          renderAll();
          break;
        case 'log':
          state.logs.push(msg.data);
          if (state.logs.length > 500) state.logs = state.logs.slice(-400);
          renderLogs();
          break;
        case 'agent-progress': {
          const a = state.agents.find(ag => ag.id === msg.data.id);
          if (a) {
            a.progress = msg.data.progress;
            a.elapsed = msg.data.elapsed;
            renderAgents();
            renderTimeline();
            renderStats();
            if (currentDetailAgent === msg.data.id) renderAgentDetail();
          }
          break;
        }
        case 'toast':
          showToast(msg.data.message, msg.data.toastType);
          break;
      }
    };

    ws.onclose = () => {
      showToast('Disconnected - reconnecting...', 'warn');
      if (!reconnectTimer) {
        reconnectTimer = setInterval(() => {
          if (!ws || ws.readyState === WebSocket.CLOSED) connect();
        }, 3000);
      }
    };

    ws.onerror = () => {};
  }

  function send(action, data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action, ...data }));
    }
  }

  // --------------------------------------------------------------------------
  // UTILITY
  // --------------------------------------------------------------------------

  function el(id) { return document.getElementById(id); }

  function fmtElapsed(s) {
    const m = Math.floor(s / 60);
    return m + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  }

  function fmtTokens(n) { return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n); }
  function fmtCost(c) { return '$' + c.toFixed(4); }

  function statusColor(s) {
    return { running: '#3b82f6', completed: '#22c55e', queued: '#f59e0b', failed: '#ef4444', idle: '#64748b' }[s] || '#64748b';
  }

  function priorityColor(p) {
    return { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }[p] || '#22c55e';
  }

  function agentIcon(type) {
    return { builder: '\u2692', researcher: '\uD83D\uDD0D', tester: '\uD83E\uddEA', reviewer: '\uD83D\uDCCB', debugger: '\uD83D\uDC1B' }[type] || '\u2699';
  }

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  function renderAll() {
    renderStats();
    renderAgents();
    renderTasks();
    renderLogs();
    renderTimeline();
    renderTemplates();
    if (currentDetailAgent) renderAgentDetail();
    var qc = el('queue-count');
    if (qc) qc.textContent = state.tasks.length + ' pending';
  }

  function renderStats() {
    const agents = state.agents || [];
    var e;
    e = el('stat-total'); if (e) e.textContent = agents.length;
    e = el('stat-running'); if (e) e.textContent = agents.filter(a => a.status === 'running').length;
    e = el('stat-queued'); if (e) e.textContent = agents.filter(a => a.status === 'queued').length;
    e = el('stat-completed'); if (e) e.textContent = agents.filter(a => a.status === 'completed').length;
    e = el('stat-failed'); if (e) e.textContent = agents.filter(a => a.status === 'failed').length;
  }

  function renderAgents() {
    const container = el('agents-container');
    if (!container) return;
    if (!state.agents.length) {
      container.innerHTML = '<div class="empty-state">No agents. Click "+ Spawn Agent" to begin.</div>';
      return;
    }
    container.innerHTML = state.agents.map(a => {
      const sc = statusColor(a.status);
      const icon = agentIcon(a.type);
      return `<div class="agent-card" data-agent-id="${a.id}">
        <div class="agent-card-header">
          <div class="agent-card-title">
            <span class="agent-icon">${icon}</span>
            <span class="agent-name">${a.name}</span>
            <span class="agent-type-badge">${a.type}</span>
          </div>
          <span class="status-badge" style="background:${sc};">${a.status}</span>
        </div>
        <div class="agent-task">${a.task}</div>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width:${a.progress}%;background:${sc};"></div>
        </div>
        <div class="agent-meta">
          <span>${a.progress}%</span>
          <span>${fmtElapsed(a.elapsed)}</span>
          <span>${fmtTokens(a.tokensUsed)} tokens</span>
          <span>${fmtCost(a.cost)}</span>
        </div>
        <div class="agent-actions">
          ${a.status === 'running' ? `<button class="btn btn-sm btn-warn" onclick="Hub.pauseAgent('${a.id}')">Pause</button>` : ''}
          ${a.status === 'idle' || a.status === 'failed' ? `<button class="btn btn-sm btn-success" onclick="Hub.promptRunAgent('${a.id}')">Run Task</button>` : ''}
          <button class="btn btn-sm btn-info" onclick="Hub.openDetail('${a.id}')">Details</button>
          <button class="btn btn-sm btn-danger" onclick="Hub.removeAgent('${a.id}')">Remove</button>
        </div>
      </div>`;
    }).join('');
  }

  function renderTasks() {
    const container = el('task-queue');
    if (!container) return;
    if (!state.tasks.length) {
      container.innerHTML = '<div class="empty-state">No tasks in queue</div>';
      return;
    }
    container.innerHTML = state.tasks.map(t => {
      const pc = priorityColor(t.priority);
      return `<div class="task-item">
        <div class="task-header">
          <span class="priority-dot" style="background:${pc};"></span>
          <span class="task-name">${t.name}</span>
          <span class="task-priority-label">${t.priority}</span>
        </div>
        <div class="task-desc">${t.desc}</div>
        <div class="task-meta">
          <span class="task-agent-type">${t.agentType}</span>
          <button class="btn btn-sm btn-success" onclick="Hub.assignTask('${t.id}')">Assign</button>
        </div>
      </div>`;
    }).join('');
  }

  function renderLogs() {
    const container = el('log-stream');
    if (!container) return;
    let logs = state.logs || [];
    if (logFilterText) {
      const lower = logFilterText.toLowerCase();
      logs = logs.filter(l => l.message.toLowerCase().includes(lower) || l.agent.toLowerCase().includes(lower));
    }
    const visible = logs.slice(-100);
    container.innerHTML = visible.map(l => {
      const ac = state.agents.find(a => a.name === l.agent);
      const color = l.agent === 'system' ? '#a78bfa' : l.agent === 'Supervisor' ? '#00d4ff' : ac ? statusColor(ac.status) : '#94a3b8';
      return `<div class="log-line">
        <span class="log-time">${l.time}</span>
        <span class="log-agent" style="color:${color};">[${l.agent}]</span>
        <span class="log-message">${l.message}</span>
      </div>`;
    }).join('');
    container.scrollTop = container.scrollHeight;
  }

  function renderTimeline() {
    const container = el('timeline-container');
    if (!container) return;
    container.innerHTML = (state.agents || []).map(a => {
      const sc = statusColor(a.status);
      return `<div class="timeline-row">
        <div class="timeline-label">${a.name}</div>
        <div class="timeline-bar-track">
          <div class="timeline-bar" style="width:${a.progress}%;background:${sc};"></div>
        </div>
        <div class="timeline-pct">${a.progress}%</div>
      </div>`;
    }).join('');
  }

  const TEMPLATES = {
    'Full App Build': { desc: 'Complete app from scratch', count: 10 },
    'Bug Fix Sprint': { desc: 'Triage, fix, test, review', count: 5 },
    'Add Feature': { desc: 'Research, build, integrate', count: 6 },
    'Code Review': { desc: 'Analyze, review, report', count: 4 },
  };

  function renderTemplates() {
    const container = el('templates-container');
    if (!container) return;
    const icons = { 'Full App Build': '\uD83D\uDE80', 'Bug Fix Sprint': '\u26A1', 'Add Feature': '\u2699', 'Code Review': '\uD83D\uDD0D' };
    container.innerHTML = Object.entries(TEMPLATES).map(([name, t]) =>
      `<div class="template-card" onclick="Hub.loadTemplate('${name}')">
        <span class="template-icon">${icons[name] || '\u2699'}</span>
        <div class="template-info">
          <span class="template-name">${name}</span>
          <span class="template-desc">${t.desc}</span>
        </div>
        <span class="template-count">${t.count} tasks</span>
      </div>`
    ).join('');
  }

  // --------------------------------------------------------------------------
  // AGENT DETAIL MODAL
  // --------------------------------------------------------------------------

  function renderAgentDetail() {
    const agent = state.agents.find(a => a.id === currentDetailAgent);
    if (!agent) { closeDetail(); return; }

    el('agent-detail-modal').classList.add('active');
    var e;
    e = el('detail-agent-name'); if (e) e.textContent = agent.name;
    e = el('detail-agent-type'); if (e) e.textContent = agent.type;
    e = el('detail-agent-status'); if (e) { e.textContent = agent.status; e.style.background = statusColor(agent.status); }
    e = el('detail-progress'); if (e) e.textContent = agent.progress + '%';
    e = el('detail-tokens'); if (e) e.textContent = fmtTokens(agent.tokensUsed);
    e = el('detail-cost'); if (e) e.textContent = fmtCost(agent.cost);
    e = el('detail-completed'); if (e) e.textContent = agent.completedTasks;

    const tabLogs = el('detail-tab-logs');
    const tabPerf = el('detail-tab-perf');
    if (tabLogs) { tabLogs.classList.toggle('active', currentDetailTab === 'logs'); tabLogs.onclick = () => { currentDetailTab = 'logs'; renderAgentDetail(); }; }
    if (tabPerf) { tabPerf.classList.toggle('active', currentDetailTab === 'perf'); tabPerf.onclick = () => { currentDetailTab = 'perf'; renderAgentDetail(); }; }

    if (currentDetailTab === 'logs') {
      const lc = el('detail-logs');
      if (lc) {
        lc.style.display = 'block';
        const logs = (agent.logs || []).slice(-50);
        lc.innerHTML = logs.length ? logs.map(l =>
          `<div class="log-line"><span class="log-time">${l.time}</span> <span class="log-message">${l.message}</span></div>`
        ).join('') : '<div class="empty-state">No logs yet</div>';
        lc.scrollTop = lc.scrollHeight;
      }
      const pc = el('detail-perf-content'); if (pc) pc.style.display = 'none';
    } else {
      const lc = el('detail-logs'); if (lc) lc.style.display = 'none';
      const pc = el('detail-perf-content');
      if (pc) {
        pc.style.display = 'block';
        const tpm = agent.elapsed > 0 ? Math.round(agent.tokensUsed / (agent.elapsed / 60)) : 0;
        const avg = agent.completedTasks > 0 ? Math.round(agent.elapsed / agent.completedTasks) : 0;
        pc.innerHTML = `<div class="perf-grid">
          <div class="perf-item"><div class="perf-value">${tpm}</div><div class="perf-label">Tokens/min</div></div>
          <div class="perf-item"><div class="perf-value">${fmtElapsed(avg)}</div><div class="perf-label">Avg Task Time</div></div>
          <div class="perf-item"><div class="perf-value">${agent.completedTasks}</div><div class="perf-label">Tasks Done</div></div>
          <div class="perf-item"><div class="perf-value">${fmtElapsed(agent.elapsed)}</div><div class="perf-label">Total Time</div></div>
        </div>`;
      }
    }
  }

  function openDetail(id) { currentDetailAgent = id; currentDetailTab = 'logs'; renderAgentDetail(); }
  function closeDetail() { currentDetailAgent = null; el('agent-detail-modal')?.classList.remove('active'); }

  // --------------------------------------------------------------------------
  // ACTIONS
  // --------------------------------------------------------------------------

  function spawnAgent(type) {
    send('spawn-agent', { agentType: type || 'builder' });
  }

  function pauseAgent(id) { send('pause-agent', { agentId: id }); }

  function removeAgent(id) {
    if (!confirm('Remove this agent?')) return;
    send('remove-agent', { agentId: id });
    if (currentDetailAgent === id) closeDetail();
  }

  function assignTask(taskId) { send('assign-task', { taskId }); }

  function promptRunAgent(agentId) {
    const task = prompt('Enter a task for this agent:');
    if (task) send('run-agent', { agentId, task });
  }

  function createTask() {
    const name = el('task-name')?.value?.trim();
    if (!name) { showToast('Task name required', 'error'); return; }
    send('create-task', {
      name,
      desc: el('task-desc')?.value?.trim() || '',
      priority: el('task-priority')?.value || 'medium',
      agentType: el('task-agent-type')?.value || 'builder',
    });
    if (el('task-name')) el('task-name').value = '';
    if (el('task-desc')) el('task-desc').value = '';
    el('new-task-modal')?.classList.remove('active');
  }

  function loadTemplate(name) { send('load-template', { template: name }); }

  function exportLogs() {
    const blob = new Blob([JSON.stringify(state.logs, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'agenthub-logs-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  function clearLogs() { send('clear-logs'); }

  // --------------------------------------------------------------------------
  // TOAST
  // --------------------------------------------------------------------------

  function showToast(message, type) {
    const container = el('toast-container');
    if (!container) return;
    const t = document.createElement('div');
    t.className = 'toast toast-' + (type || 'info');
    const icons = { success: '\u2713', error: '\u2717', warn: '\u26A0', info: '\u2139' };
    t.innerHTML = '<span class="toast-icon">' + (icons[type] || '') + '</span> ' + message;
    container.appendChild(t);
    requestAnimationFrame(() => t.classList.add('toast-show'));
    setTimeout(() => {
      t.classList.remove('toast-show');
      t.classList.add('toast-hide');
      setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
    }, 4000);
  }

  // --------------------------------------------------------------------------
  // KEYBOARD SHORTCUTS
  // --------------------------------------------------------------------------

  document.addEventListener('keydown', (e) => {
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      if (e.key === 'Escape') { e.target.blur(); closeAllModals(); }
      return;
    }
    if (e.key === 'n') { e.preventDefault(); el('new-task-modal')?.classList.add('active'); el('task-name')?.focus(); }
    else if (e.key === 's') { e.preventDefault(); spawnAgent(); }
    else if (e.key === 'l') { e.preventDefault(); const p = el('logs-panel'); if (p) p.style.display = p.style.display === 'none' ? '' : 'none'; }
    else if (e.key === 'Escape') closeAllModals();
    else if (e.key === '/') { e.preventDefault(); el('log-search')?.focus(); }
    else if (e.key === '?') { e.preventDefault(); el('shortcuts-modal')?.classList.toggle('active'); }
  });

  function closeAllModals() {
    closeDetail();
    el('new-task-modal')?.classList.remove('active');
    el('shortcuts-modal')?.classList.remove('active');
  }

  // --------------------------------------------------------------------------
  // EVENTS
  // --------------------------------------------------------------------------

  document.addEventListener('DOMContentLoaded', () => {
    // Log search
    const search = el('log-search');
    if (search) search.addEventListener('input', function () { logFilterText = this.value; renderLogs(); });

    // Modal click-to-close
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => { if (e.target === overlay) closeAllModals(); });
    });

    // Connect
    connect();
  });

  // --------------------------------------------------------------------------
  // PUBLIC API
  // --------------------------------------------------------------------------

  window.Hub = {
    spawnAgent, pauseAgent, removeAgent, assignTask, promptRunAgent,
    createTask, loadTemplate, exportLogs, clearLogs,
    openDetail, closeDetail,
    showToast, getState: () => state,
  };
})();
