// ============================================================================
// AgentHub - Multi-Agent Orchestration Dashboard
// Complete self-contained JS module
// ============================================================================

(function () {
  "use strict";

  // --------------------------------------------------------------------------
  // DEFAULT DATA
  // --------------------------------------------------------------------------

  const DEFAULT_AGENTS = [
    {
      id: "agent-001",
      name: "Builder Alpha",
      type: "builder",
      status: "running",
      task: "Scaffolding project structure",
      progress: 72,
      elapsed: 184,
      tokensUsed: 14320,
      cost: 0.04296,
      logs: [],
      startedAt: Date.now() - 184000,
      completedTasks: 3,
    },
    {
      id: "agent-002",
      name: "Builder Beta",
      type: "builder",
      status: "running",
      task: "Generating UI components",
      progress: 45,
      elapsed: 97,
      tokensUsed: 8750,
      cost: 0.02625,
      logs: [],
      startedAt: Date.now() - 97000,
      completedTasks: 1,
    },
    {
      id: "agent-003",
      name: "Researcher",
      type: "researcher",
      status: "running",
      task: "Analyzing architecture patterns",
      progress: 88,
      elapsed: 241,
      tokensUsed: 22100,
      cost: 0.0663,
      logs: [],
      startedAt: Date.now() - 241000,
      completedTasks: 5,
    },
    {
      id: "agent-004",
      name: "Tester",
      type: "tester",
      status: "queued",
      task: "Awaiting build completion",
      progress: 0,
      elapsed: 0,
      tokensUsed: 0,
      cost: 0,
      logs: [],
      startedAt: null,
      completedTasks: 0,
    },
    {
      id: "agent-005",
      name: "Reviewer",
      type: "reviewer",
      status: "queued",
      task: "Queued for code review",
      progress: 0,
      elapsed: 0,
      tokensUsed: 0,
      cost: 0,
      logs: [],
      startedAt: null,
      completedTasks: 0,
    },
    {
      id: "agent-006",
      name: "Debugger",
      type: "debugger",
      status: "idle",
      task: "Standing by",
      progress: 0,
      elapsed: 0,
      tokensUsed: 0,
      cost: 0,
      logs: [],
      startedAt: null,
      completedTasks: 0,
    },
  ];

  const DEFAULT_TASKS = [
    {
      id: "task-001",
      name: "Build API endpoints",
      desc: "Create REST API endpoints for user management and authentication",
      priority: "high",
      agentType: "builder",
      dependencies: [],
    },
    {
      id: "task-002",
      name: "Database schema",
      desc: "Design and implement the database schema with migrations",
      priority: "high",
      agentType: "builder",
      dependencies: [],
    },
    {
      id: "task-003",
      name: "Payment integration",
      desc: "Integrate Stripe payment processing with webhook handlers",
      priority: "medium",
      agentType: "builder",
      dependencies: ["task-001"],
    },
    {
      id: "task-004",
      name: "Push notifications",
      desc: "Implement push notification service with FCM integration",
      priority: "medium",
      agentType: "builder",
      dependencies: ["task-001"],
    },
    {
      id: "task-005",
      name: "Performance audit",
      desc: "Run comprehensive performance audit and generate report",
      priority: "low",
      agentType: "tester",
      dependencies: [],
    },
  ];

  const DEFAULT_TEMPLATES = {
    "Full App Build": {
      description: "Complete application build from scratch",
      subtasks: [
        { name: "Project scaffolding", agentType: "builder", priority: "high", dependencies: [] },
        { name: "Database design", agentType: "builder", priority: "high", dependencies: [] },
        { name: "API layer", agentType: "builder", priority: "high", dependencies: ["Project scaffolding", "Database design"] },
        { name: "Auth system", agentType: "builder", priority: "high", dependencies: ["API layer"] },
        { name: "Frontend shell", agentType: "builder", priority: "medium", dependencies: ["Project scaffolding"] },
        { name: "UI components", agentType: "builder", priority: "medium", dependencies: ["Frontend shell"] },
        { name: "Integration tests", agentType: "tester", priority: "medium", dependencies: ["API layer", "Auth system"] },
        { name: "Architecture review", agentType: "researcher", priority: "low", dependencies: ["API layer"] },
        { name: "Code review", agentType: "reviewer", priority: "low", dependencies: ["UI components", "Auth system"] },
        { name: "Performance testing", agentType: "tester", priority: "low", dependencies: ["Integration tests"] },
      ],
    },
    "Bug Fix Sprint": {
      description: "Rapid bug triage and resolution cycle",
      subtasks: [
        { name: "Reproduce bugs", agentType: "debugger", priority: "high", dependencies: [] },
        { name: "Root cause analysis", agentType: "researcher", priority: "high", dependencies: ["Reproduce bugs"] },
        { name: "Implement fixes", agentType: "builder", priority: "high", dependencies: ["Root cause analysis"] },
        { name: "Regression tests", agentType: "tester", priority: "medium", dependencies: ["Implement fixes"] },
        { name: "Fix review", agentType: "reviewer", priority: "medium", dependencies: ["Implement fixes"] },
      ],
    },
    "Add Feature": {
      description: "End-to-end feature development workflow",
      subtasks: [
        { name: "Research requirements", agentType: "researcher", priority: "high", dependencies: [] },
        { name: "Design architecture", agentType: "researcher", priority: "high", dependencies: ["Research requirements"] },
        { name: "Backend implementation", agentType: "builder", priority: "high", dependencies: ["Design architecture"] },
        { name: "Frontend implementation", agentType: "builder", priority: "high", dependencies: ["Design architecture"] },
        { name: "Write tests", agentType: "tester", priority: "medium", dependencies: ["Backend implementation", "Frontend implementation"] },
        { name: "Code review", agentType: "reviewer", priority: "medium", dependencies: ["Write tests"] },
      ],
    },
    "Code Review": {
      description: "Comprehensive codebase review process",
      subtasks: [
        { name: "Static analysis", agentType: "reviewer", priority: "high", dependencies: [] },
        { name: "Security audit", agentType: "researcher", priority: "high", dependencies: [] },
        { name: "Performance review", agentType: "tester", priority: "medium", dependencies: ["Static analysis"] },
        { name: "Documentation check", agentType: "reviewer", priority: "low", dependencies: ["Static analysis", "Security audit"] },
      ],
    },
  };

  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------

  let state = {
    agents: [],
    tasks: [],
    logs: [],
    templates: {},
    config: {
      simulationInterval: 2000,
      autoAssign: true,
      maxConcurrentAgents: 10,
      tokenCostPer1k: 0.003,
    },
    stats: {
      totalAgents: 0,
      running: 0,
      queued: 0,
      completed: 0,
      failed: 0,
    },
    nextAgentId: 7,
    nextTaskId: 6,
  };

  let currentDetailAgent = null;
  let currentDetailTab = "logs";
  let logFilterText = "";
  let logFilterAgent = "";
  let simulationTimer = null;

  // --------------------------------------------------------------------------
  // PERSISTENCE
  // --------------------------------------------------------------------------

  function saveState() {
    try {
      var saved = {
        agents: state.agents,
        tasks: state.tasks,
        logs: state.logs,
        nextAgentId: state.nextAgentId,
        nextTaskId: state.nextTaskId,
      };
      localStorage.setItem("agenthub-state", JSON.stringify(saved));
    } catch (e) {
      // storage full or unavailable - silently ignore
    }
  }

  function loadState() {
    try {
      var raw = localStorage.getItem("agenthub-state");
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed.agents && parsed.agents.length > 0) {
          state.agents = parsed.agents;
          state.tasks = parsed.tasks || [];
          state.logs = parsed.logs || [];
          state.nextAgentId = parsed.nextAgentId || 7;
          state.nextTaskId = parsed.nextTaskId || 6;
          state.templates = DEFAULT_TEMPLATES;
          recalcStats();
          return;
        }
      }
    } catch (e) {
      // corrupt data, fall through to defaults
    }
    // Load defaults
    state.agents = JSON.parse(JSON.stringify(DEFAULT_AGENTS));
    state.tasks = JSON.parse(JSON.stringify(DEFAULT_TASKS));
    state.logs = [];
    state.templates = DEFAULT_TEMPLATES;
    state.nextAgentId = 7;
    state.nextTaskId = 6;
    addLog("system", "AgentHub initialized with default configuration");
    recalcStats();
  }

  // --------------------------------------------------------------------------
  // UTILITY
  // --------------------------------------------------------------------------

  function recalcStats() {
    state.stats.totalAgents = state.agents.length;
    state.stats.running = state.agents.filter(function (a) { return a.status === "running"; }).length;
    state.stats.queued = state.agents.filter(function (a) { return a.status === "queued"; }).length;
    state.stats.completed = state.agents.filter(function (a) { return a.status === "completed"; }).length;
    state.stats.failed = state.agents.filter(function (a) { return a.status === "failed"; }).length;
  }

  function ts() {
    var d = new Date();
    return (
      String(d.getHours()).padStart(2, "0") + ":" +
      String(d.getMinutes()).padStart(2, "0") + ":" +
      String(d.getSeconds()).padStart(2, "0")
    );
  }

  function addLog(agentName, message) {
    var entry = { time: ts(), agent: agentName, message: message, timestamp: Date.now() };
    state.logs.push(entry);
    // Also push to the agent's own logs
    var agent = state.agents.find(function (a) { return a.name === agentName; });
    if (agent) {
      agent.logs.push(entry);
    }
    // Keep log size manageable
    if (state.logs.length > 500) {
      state.logs = state.logs.slice(-400);
    }
  }

  function fmtElapsed(seconds) {
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return String(m).padStart(2, "0") + ":" + String(Math.floor(s)).padStart(2, "0");
  }

  function fmtCost(cost) {
    return "$" + cost.toFixed(4);
  }

  function fmtTokens(n) {
    if (n >= 1000) return (n / 1000).toFixed(1) + "k";
    return String(n);
  }

  function el(id) {
    return document.getElementById(id);
  }

  function priorityColor(p) {
    if (p === "high") return "#ef4444";
    if (p === "medium") return "#f59e0b";
    return "#22c55e";
  }

  function statusColor(s) {
    if (s === "running") return "#3b82f6";
    if (s === "completed") return "#22c55e";
    if (s === "queued") return "#f59e0b";
    if (s === "failed") return "#ef4444";
    return "#64748b";
  }

  function agentTypeIcon(type) {
    var icons = {
      builder: "\u2692",
      researcher: "\uD83D\uDD0D",
      tester: "\uD83E\uddEA",
      reviewer: "\uD83D\uDCCB",
      debugger: "\uD83D\uDC1B",
    };
    return icons[type] || "\u2699";
  }

  // --------------------------------------------------------------------------
  // RENDER FUNCTIONS
  // --------------------------------------------------------------------------

  function renderAll() {
    recalcStats();
    renderStats();
    renderAgents();
    renderTasks();
    renderLogs();
    renderTimeline();
    renderTemplates();
    if (currentDetailAgent) {
      renderAgentDetail();
    }
  }

  function renderStats() {
    var e;
    e = el("stat-total");
    if (e) e.textContent = state.stats.totalAgents;
    e = el("stat-running");
    if (e) e.textContent = state.stats.running;
    e = el("stat-queued");
    if (e) e.textContent = state.stats.queued;
    e = el("stat-completed");
    if (e) e.textContent = state.stats.completed;
    e = el("stat-failed");
    if (e) e.textContent = state.stats.failed;
  }

  function renderAgents() {
    var container = el("agents-container");
    if (!container) return;
    var html = "";
    state.agents.forEach(function (agent) {
      var sColor = statusColor(agent.status);
      var icon = agentTypeIcon(agent.type);
      html +=
        '<div class="agent-card" data-agent-id="' + agent.id + '">' +
          '<div class="agent-card-header">' +
            '<div class="agent-card-title">' +
              '<span class="agent-icon">' + icon + "</span>" +
              '<span class="agent-name">' + agent.name + "</span>" +
              '<span class="agent-type-badge">' + agent.type + "</span>" +
            "</div>" +
            '<span class="status-badge" style="background:' + sColor + ';">' + agent.status + "</span>" +
          "</div>" +
          '<div class="agent-task">' + agent.task + "</div>" +
          '<div class="progress-bar-container">' +
            '<div class="progress-bar" style="width:' + agent.progress + "%;background:" + sColor + ';"></div>' +
          "</div>" +
          '<div class="agent-meta">' +
            "<span>" + agent.progress + "%</span>" +
            "<span>" + fmtElapsed(agent.elapsed) + "</span>" +
            "<span>" + fmtTokens(agent.tokensUsed) + " tokens</span>" +
            "<span>" + fmtCost(agent.cost) + "</span>" +
          "</div>" +
          '<div class="agent-actions">' +
            (agent.status === "running"
              ? '<button class="btn btn-sm btn-warn" onclick="AgentHub.pauseAgent(\'' + agent.id + "')\">Pause</button>"
              : "") +
            (agent.status === "idle" || agent.status === "queued"
              ? '<button class="btn btn-sm btn-success" onclick="AgentHub.startAgent(\'' + agent.id + "')\">Start</button>"
              : "") +
            (agent.status === "failed"
              ? '<button class="btn btn-sm btn-success" onclick="AgentHub.startAgent(\'' + agent.id + "')\">Restart</button>"
              : "") +
            '<button class="btn btn-sm btn-info" onclick="AgentHub.openAgentDetail(\'' + agent.id + "')\">Details</button>" +
            '<button class="btn btn-sm btn-danger" onclick="AgentHub.removeAgent(\'' + agent.id + "')\">Remove</button>" +
          "</div>" +
        "</div>";
    });
    container.innerHTML = html;
  }

  function renderTasks() {
    var container = el("task-queue");
    if (!container) return;
    if (state.tasks.length === 0) {
      container.innerHTML = '<div class="empty-state">No tasks in queue</div>';
      return;
    }
    var html = "";
    state.tasks.forEach(function (task) {
      var pColor = priorityColor(task.priority);
      var deps = task.dependencies.length > 0 ? " (deps: " + task.dependencies.join(", ") + ")" : "";
      html +=
        '<div class="task-item" data-task-id="' + task.id + '">' +
          '<div class="task-header">' +
            '<span class="priority-dot" style="background:' + pColor + ';" title="' + task.priority + ' priority"></span>' +
            '<span class="task-name">' + task.name + "</span>" +
            '<span class="task-priority-label">' + task.priority + "</span>" +
          "</div>" +
          '<div class="task-desc">' + task.desc + deps + "</div>" +
          '<div class="task-meta">' +
            '<span class="task-agent-type">Agent: ' + task.agentType + "</span>" +
            '<button class="btn btn-sm btn-success" onclick="AgentHub.assignTask(\'' + task.id + "')\">Assign</button>" +
          "</div>" +
        "</div>";
    });
    container.innerHTML = html;
  }

  function renderLogs() {
    var container = el("log-stream");
    if (!container) return;
    var filtered = state.logs;
    if (logFilterText) {
      var lower = logFilterText.toLowerCase();
      filtered = filtered.filter(function (l) {
        return l.message.toLowerCase().indexOf(lower) !== -1 ||
               l.agent.toLowerCase().indexOf(lower) !== -1;
      });
    }
    if (logFilterAgent) {
      var aLower = logFilterAgent.toLowerCase();
      filtered = filtered.filter(function (l) {
        return l.agent.toLowerCase() === aLower;
      });
    }
    // Show last 100
    var visible = filtered.slice(-100);
    var html = "";
    visible.forEach(function (entry) {
      var agentColor = "#94a3b8";
      var agent = state.agents.find(function (a) { return a.name === entry.agent; });
      if (agent) agentColor = statusColor(agent.status);
      if (entry.agent === "system") agentColor = "#a78bfa";
      html +=
        '<div class="log-line">' +
          '<span class="log-time">' + entry.time + "</span>" +
          '<span class="log-agent" style="color:' + agentColor + ';">[' + entry.agent + "]</span> " +
          '<span class="log-message">' + entry.message + "</span>" +
        "</div>";
    });
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
  }

  function renderTimeline() {
    var container = el("timeline-container");
    if (!container) return;
    var html = "";
    state.agents.forEach(function (agent) {
      var sColor = statusColor(agent.status);
      html +=
        '<div class="timeline-row">' +
          '<div class="timeline-label">' + agent.name + "</div>" +
          '<div class="timeline-bar-track">' +
            '<div class="timeline-bar" style="width:' + agent.progress + "%;background:" + sColor + ';"></div>' +
          "</div>" +
          '<div class="timeline-pct">' + agent.progress + "%</div>" +
        "</div>";
    });
    container.innerHTML = html;
  }

  function renderTemplates() {
    var container = el("templates-container");
    if (!container) return;
    var html = "";
    Object.keys(state.templates).forEach(function (name) {
      var tmpl = state.templates[name];
      html +=
        '<div class="template-card" onclick="AgentHub.loadTemplate(\'' + name.replace(/'/g, "\\'") + "')\">" +
          '<div class="template-name">' + name + "</div>" +
          '<div class="template-desc">' + tmpl.description + "</div>" +
          '<div class="template-count">' + tmpl.subtasks.length + " subtasks</div>" +
        "</div>";
    });
    container.innerHTML = html;
  }

  // --------------------------------------------------------------------------
  // AGENT DETAIL MODAL
  // --------------------------------------------------------------------------

  function renderAgentDetail() {
    if (!currentDetailAgent) return;
    var agent = state.agents.find(function (a) { return a.id === currentDetailAgent; });
    if (!agent) {
      closeAgentDetail();
      return;
    }

    var modal = el("agent-detail-modal");
    if (modal) modal.classList.add("active");

    var e;
    e = el("detail-agent-name");
    if (e) e.textContent = agent.name;
    e = el("detail-agent-type");
    if (e) e.textContent = agent.type;
    e = el("detail-agent-status");
    if (e) {
      e.textContent = agent.status;
      e.style.background = statusColor(agent.status);
    }
    e = el("detail-progress");
    if (e) e.textContent = agent.progress + "%";
    e = el("detail-tokens");
    if (e) e.textContent = fmtTokens(agent.tokensUsed);
    e = el("detail-cost");
    if (e) e.textContent = fmtCost(agent.cost);
    e = el("detail-completed");
    if (e) e.textContent = agent.completedTasks;

    // Tabs
    var tabLogs = el("detail-tab-logs");
    var tabPerf = el("detail-tab-perf");
    if (tabLogs) {
      tabLogs.classList.toggle("active", currentDetailTab === "logs");
      tabLogs.onclick = function () {
        currentDetailTab = "logs";
        renderAgentDetail();
      };
    }
    if (tabPerf) {
      tabPerf.classList.toggle("active", currentDetailTab === "perf");
      tabPerf.onclick = function () {
        currentDetailTab = "perf";
        renderAgentDetail();
      };
    }

    if (currentDetailTab === "logs") {
      var logsContainer = el("detail-logs");
      if (logsContainer) {
        logsContainer.style.display = "block";
        var html = "";
        var agentLogs = agent.logs.slice(-50);
        if (agentLogs.length === 0) {
          html = '<div class="empty-state">No logs yet</div>';
        } else {
          agentLogs.forEach(function (entry) {
            html +=
              '<div class="log-line">' +
                '<span class="log-time">' + entry.time + "</span> " +
                '<span class="log-message">' + entry.message + "</span>" +
              "</div>";
          });
        }
        logsContainer.innerHTML = html;
        logsContainer.scrollTop = logsContainer.scrollHeight;
      }
      var perfContent = el("detail-perf-content");
      if (perfContent) perfContent.style.display = "none";
    } else {
      var logsContainer2 = el("detail-logs");
      if (logsContainer2) logsContainer2.style.display = "none";
      var perfContent2 = el("detail-perf-content");
      if (perfContent2) {
        perfContent2.style.display = "block";
        var tokensPerMin = agent.elapsed > 0 ? Math.round(agent.tokensUsed / (agent.elapsed / 60)) : 0;
        var avgTaskTime = agent.completedTasks > 0 ? Math.round(agent.elapsed / agent.completedTasks) : 0;
        perfContent2.innerHTML =
          '<div class="perf-grid">' +
            '<div class="perf-item"><div class="perf-value">' + tokensPerMin + '</div><div class="perf-label">Tokens/min</div></div>' +
            '<div class="perf-item"><div class="perf-value">' + fmtElapsed(avgTaskTime) + '</div><div class="perf-label">Avg Task Time</div></div>' +
            '<div class="perf-item"><div class="perf-value">' + agent.completedTasks + '</div><div class="perf-label">Tasks Completed</div></div>' +
            '<div class="perf-item"><div class="perf-value">' + fmtElapsed(agent.elapsed) + '</div><div class="perf-label">Total Elapsed</div></div>' +
          "</div>" +
          '<div class="detail-actions">' +
            (agent.status === "running"
              ? '<button class="btn btn-warn" onclick="AgentHub.pauseAgent(\'' + agent.id + "');AgentHub.renderAgentDetail();\">Pause</button>"
              : '<button class="btn btn-success" onclick="AgentHub.startAgent(\'' + agent.id + "');AgentHub.renderAgentDetail();\">Resume</button>") +
            '<button class="btn btn-danger" onclick="AgentHub.removeAgent(\'' + agent.id + "')\">Remove</button>" +
          "</div>";
      }
    }
  }

  function openAgentDetail(id) {
    currentDetailAgent = id;
    currentDetailTab = "logs";
    renderAgentDetail();
  }

  function closeAgentDetail() {
    currentDetailAgent = null;
    var modal = el("agent-detail-modal");
    if (modal) modal.classList.remove("active");
  }

  // --------------------------------------------------------------------------
  // ACTIONS
  // --------------------------------------------------------------------------

  function spawnAgent() {
    var types = ["builder", "researcher", "tester", "reviewer", "debugger"];
    var names = [
      "Builder Gamma", "Builder Delta", "Researcher II", "Tester Beta",
      "Reviewer Beta", "Debugger II", "Builder Epsilon", "Analyst",
      "Builder Zeta", "Tester Gamma",
    ];
    var type = types[Math.floor(Math.random() * types.length)];
    var id = "agent-" + String(state.nextAgentId).padStart(3, "0");
    var name = names[Math.floor(Math.random() * names.length)] + " " + id.slice(-3);
    var agent = {
      id: id,
      name: name,
      type: type,
      status: "idle",
      task: "Standing by",
      progress: 0,
      elapsed: 0,
      tokensUsed: 0,
      cost: 0,
      logs: [],
      startedAt: null,
      completedTasks: 0,
    };
    state.agents.push(agent);
    state.nextAgentId++;
    addLog("system", "Spawned new agent: " + name + " (" + type + ")");
    showToast("Agent " + name + " spawned", "success");
    saveState();
    renderAll();
  }

  function pauseAgent(id) {
    var agent = state.agents.find(function (a) { return a.id === id; });
    if (!agent) return;
    agent.status = "idle";
    addLog(agent.name, "Agent paused");
    saveState();
    renderAll();
  }

  function startAgent(id) {
    var agent = state.agents.find(function (a) { return a.id === id; });
    if (!agent) return;
    if (agent.status === "failed") {
      agent.progress = 0;
    }
    agent.status = "running";
    agent.startedAt = agent.startedAt || Date.now();
    addLog(agent.name, "Agent started");
    showToast(agent.name + " is now running", "info");
    saveState();
    renderAll();
  }

  function removeAgent(id) {
    var agent = state.agents.find(function (a) { return a.id === id; });
    if (!agent) return;
    if (!confirm("Remove agent " + agent.name + "?")) return;
    state.agents = state.agents.filter(function (a) { return a.id !== id; });
    addLog("system", "Removed agent: " + agent.name);
    if (currentDetailAgent === id) closeAgentDetail();
    saveState();
    renderAll();
  }

  function assignTask(taskId) {
    var task = state.tasks.find(function (t) { return t.id === taskId; });
    if (!task) return;
    // Find idle or queued agent matching type
    var agent = state.agents.find(function (a) {
      return a.type === task.agentType && (a.status === "idle" || a.status === "queued");
    });
    if (!agent) {
      showToast("No available " + task.agentType + " agent for this task", "warn");
      return;
    }
    agent.task = task.name;
    agent.status = "running";
    agent.progress = 0;
    agent.startedAt = Date.now();
    // Remove task from queue
    state.tasks = state.tasks.filter(function (t) { return t.id !== taskId; });
    addLog(agent.name, "Assigned task: " + task.name);
    showToast(task.name + " assigned to " + agent.name, "success");
    saveState();
    renderAll();
  }

  function createTask() {
    var nameField = el("task-name");
    var descField = el("task-desc");
    var typeField = el("task-agent-type");
    var prioField = el("task-priority");
    if (!nameField || !nameField.value.trim()) {
      showToast("Task name is required", "error");
      return;
    }
    var task = {
      id: "task-" + String(state.nextTaskId).padStart(3, "0"),
      name: nameField.value.trim(),
      desc: descField ? descField.value.trim() : "",
      priority: prioField ? prioField.value : "medium",
      agentType: typeField ? typeField.value : "builder",
      dependencies: [],
    };
    state.tasks.push(task);
    state.nextTaskId++;
    addLog("system", "New task created: " + task.name);
    showToast("Task added: " + task.name, "info");
    // Clear fields
    if (nameField) nameField.value = "";
    if (descField) descField.value = "";
    // Close modal
    var modal = el("new-task-modal");
    if (modal) modal.classList.remove("active");
    saveState();
    renderAll();
  }

  function loadTemplate(name) {
    var tmpl = state.templates[name];
    if (!tmpl) return;
    tmpl.subtasks.forEach(function (sub) {
      var task = {
        id: "task-" + String(state.nextTaskId).padStart(3, "0"),
        name: sub.name,
        desc: "From template: " + name,
        priority: sub.priority,
        agentType: sub.agentType,
        dependencies: sub.dependencies.slice(),
      };
      state.tasks.push(task);
      state.nextTaskId++;
    });
    addLog("system", 'Loaded template "' + name + '" (' + tmpl.subtasks.length + " tasks)");
    showToast('Template "' + name + '" loaded with ' + tmpl.subtasks.length + " tasks", "success");
    saveState();
    renderAll();
  }

  // --------------------------------------------------------------------------
  // LOG SEARCH / FILTER
  // --------------------------------------------------------------------------

  function filterLogs(searchText) {
    logFilterText = searchText || "";
    renderLogs();
  }

  function filterLogsByAgent(agentName) {
    logFilterAgent = agentName || "";
    renderLogs();
  }

  function exportLogs() {
    var blob = new Blob([JSON.stringify(state.logs, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "agenthub-logs-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Logs exported", "info");
  }

  function clearLogs() {
    state.logs = [];
    state.agents.forEach(function (a) { a.logs = []; });
    addLog("system", "Logs cleared");
    saveState();
    renderLogs();
  }

  // --------------------------------------------------------------------------
  // TOAST NOTIFICATIONS
  // --------------------------------------------------------------------------

  function showToast(message, type) {
    type = type || "info";
    var container = el("toast-container");
    if (!container) return;
    var toast = document.createElement("div");
    toast.className = "toast toast-" + type;
    var icons = { success: "\u2713", error: "\u2717", warn: "\u26A0", info: "\u2139" };
    toast.innerHTML = '<span class="toast-icon">' + (icons[type] || "") + "</span> " + message;
    container.appendChild(toast);
    // Trigger animation
    requestAnimationFrame(function () {
      toast.classList.add("toast-show");
    });
    setTimeout(function () {
      toast.classList.remove("toast-show");
      toast.classList.add("toast-hide");
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 4000);
  }

  // --------------------------------------------------------------------------
  // SIMULATION
  // --------------------------------------------------------------------------

  var SIM_MESSAGES = {
    builder: [
      "Generating component structure...",
      "Writing API handler for /api/v1/users",
      "Creating database migration file",
      "Scaffolding route controllers",
      "Compiling TypeScript modules",
      "Setting up middleware chain",
      "Writing unit tests for service layer",
      "Generating GraphQL resolvers",
      "Building authentication flow",
      "Optimizing bundle configuration",
      "Creating Docker configuration",
      "Writing validation schemas",
    ],
    researcher: [
      "Analyzing dependency graph",
      "Evaluating architecture patterns",
      "Reviewing best practices for caching",
      "Comparing ORM solutions",
      "Assessing security vulnerabilities",
      "Researching rate limiting strategies",
      "Evaluating message queue options",
      "Analyzing performance bottlenecks",
    ],
    tester: [
      "Running integration test suite",
      "Executing load test scenario",
      "Validating API response schemas",
      "Testing edge cases for auth flow",
      "Running regression test batch",
      "Verifying database constraints",
      "Testing WebSocket connections",
      "Checking error handling paths",
    ],
    reviewer: [
      "Reviewing code style compliance",
      "Checking for security anti-patterns",
      "Validating error handling coverage",
      "Reviewing API documentation",
      "Checking test coverage metrics",
      "Reviewing database query efficiency",
      "Analyzing code complexity metrics",
    ],
    debugger: [
      "Attaching to process for inspection",
      "Tracing memory allocation patterns",
      "Analyzing stack trace",
      "Inspecting network request logs",
      "Profiling CPU usage spikes",
      "Checking for race conditions",
      "Examining deadlock candidates",
    ],
  };

  var FAIL_MESSAGES = [
    "Error: Connection timeout exceeded",
    "Error: Out of memory during compilation",
    "Error: Unhandled promise rejection",
    "Error: Module resolution failed",
    "Error: Test assertion failed unexpectedly",
    "Error: API rate limit exceeded",
  ];

  function simulate() {
    var changed = false;
    state.agents.forEach(function (agent) {
      if (agent.status !== "running") return;
      changed = true;

      // Failure chance: 2%
      if (Math.random() < 0.02) {
        agent.status = "failed";
        var failMsg = FAIL_MESSAGES[Math.floor(Math.random() * FAIL_MESSAGES.length)];
        addLog(agent.name, failMsg);
        showToast(agent.name + " failed: " + failMsg, "error");
        return;
      }

      // Progress
      var gain = 1 + Math.floor(Math.random() * 4);
      agent.progress = Math.min(100, agent.progress + gain);

      // Elapsed
      agent.elapsed += 2;

      // Tokens
      var newTokens = 50 + Math.floor(Math.random() * 151);
      agent.tokensUsed += newTokens;
      agent.cost = agent.tokensUsed * state.config.tokenCostPer1k / 1000;

      // Random log message
      if (Math.random() < 0.4) {
        var msgs = SIM_MESSAGES[agent.type] || SIM_MESSAGES.builder;
        var msg = msgs[Math.floor(Math.random() * msgs.length)];
        addLog(agent.name, msg);
      }

      // Completion
      if (agent.progress >= 100) {
        agent.progress = 100;
        agent.status = "completed";
        agent.completedTasks++;
        addLog(agent.name, "Task completed: " + agent.task);
        showToast(agent.name + ' completed "' + agent.task + '"', "success");

        // Auto-assign next matching task
        var nextTask = state.tasks.find(function (t) { return t.agentType === agent.type; });
        if (nextTask) {
          agent.task = nextTask.name;
          agent.status = "running";
          agent.progress = 0;
          agent.startedAt = Date.now();
          state.tasks = state.tasks.filter(function (t) { return t.id !== nextTask.id; });
          addLog(agent.name, "Auto-assigned next task: " + nextTask.name);
        }
      }
    });

    if (changed) {
      saveState();
      renderAll();
    }
  }

  // --------------------------------------------------------------------------
  // KEYBOARD SHORTCUTS
  // --------------------------------------------------------------------------

  function initKeyboard() {
    document.addEventListener("keydown", function (e) {
      // Don't capture when typing in inputs
      var tag = e.target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") {
        if (e.key === "Escape") {
          e.target.blur();
          closeAllModals();
        }
        return;
      }

      if (e.key === "n") {
        e.preventDefault();
        var modal = el("new-task-modal");
        if (modal) modal.classList.add("active");
        var nameField = el("task-name");
        if (nameField) nameField.focus();
      } else if (e.key === "s") {
        e.preventDefault();
        spawnAgent();
      } else if (e.key === "l") {
        e.preventDefault();
        var logPanel = el("log-stream");
        if (logPanel) {
          logPanel.parentElement.classList.toggle("collapsed");
        }
      } else if (e.key === "Escape") {
        closeAllModals();
      } else if (e.key === "/") {
        e.preventDefault();
        var search = el("log-search");
        if (search) search.focus();
      }
    });
  }

  function closeAllModals() {
    closeAgentDetail();
    var taskModal = el("new-task-modal");
    if (taskModal) taskModal.classList.remove("active");
  }

  // --------------------------------------------------------------------------
  // EVENT BINDINGS
  // --------------------------------------------------------------------------

  function initEvents() {
    // Log search
    var searchInput = el("log-search");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        filterLogs(this.value);
      });
    }

    // Modal overlay click-to-close
    var modals = document.querySelectorAll(".modal-overlay");
    modals.forEach(function (overlay) {
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) {
          closeAllModals();
        }
      });
    });

    // Also handle agent-detail-modal and new-task-modal direct click
    var detailModal = el("agent-detail-modal");
    if (detailModal) {
      detailModal.addEventListener("click", function (e) {
        if (e.target === detailModal) closeAgentDetail();
      });
    }
    var taskModal = el("new-task-modal");
    if (taskModal) {
      taskModal.addEventListener("click", function (e) {
        if (e.target === taskModal) {
          taskModal.classList.remove("active");
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // INIT
  // --------------------------------------------------------------------------

  function init() {
    loadState();
    renderAll();
    simulationTimer = setInterval(simulate, state.config.simulationInterval);
    initKeyboard();
    initEvents();
    addLog("system", "Dashboard loaded - " + state.agents.length + " agents, " + state.tasks.length + " tasks in queue");
    renderLogs();
  }

  // Start when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // --------------------------------------------------------------------------
  // PUBLIC API (exposed on window.AgentHub)
  // --------------------------------------------------------------------------

  window.AgentHub = {
    // State access
    getState: function () { return state; },

    // Actions
    spawnAgent: spawnAgent,
    pauseAgent: pauseAgent,
    startAgent: startAgent,
    removeAgent: removeAgent,
    assignTask: assignTask,
    createTask: createTask,
    loadTemplate: loadTemplate,

    // Detail modal
    openAgentDetail: openAgentDetail,
    closeAgentDetail: closeAgentDetail,
    renderAgentDetail: renderAgentDetail,

    // Logs
    filterLogs: filterLogs,
    filterLogsByAgent: filterLogsByAgent,
    exportLogs: exportLogs,
    clearLogs: clearLogs,

    // Rendering
    renderAll: renderAll,

    // Toast
    showToast: showToast,

    // Persistence
    saveState: saveState,
    loadState: loadState,
  };
})();
