import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { v4 as uuid } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

// Load .env manually (no dotenv dependency)
const envPath = join(dirname(fileURLToPath(import.meta.url)), '.env');
if (existsSync(envPath)) {
  readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  });
}

const PORT = parseInt(process.env.PORT || '3000', 10);
const API_KEY = process.env.ANTHROPIC_API_KEY;
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'claude-sonnet-4-6';
const MAX_AGENTS = parseInt(process.env.MAX_CONCURRENT_AGENTS || '5', 10);
const TIMEOUT_MIN = parseInt(process.env.AGENT_TIMEOUT_MINUTES || '30', 10);

let anthropic = null;
const hasApiKey = API_KEY && !API_KEY.startsWith('sk-ant-xxxxx');

if (hasApiKey) {
  anthropic = new Anthropic({ apiKey: API_KEY });
} else {
  console.warn('\n  WARNING: No ANTHROPIC_API_KEY set in .env');
  console.warn('  Dashboard will run in demo mode (simulated agents).');
  console.warn('  To use real Claude agents: edit .env and restart.\n');
}

// ============================================================================
// STATE
// ============================================================================

const state = {
  agents: new Map(),
  tasks: [],
  logs: [],
  nextAgentNum: 1,
  nextTaskNum: 1,
};

function agentToJSON(agent) {
  return {
    id: agent.id,
    name: agent.name,
    type: agent.type,
    status: agent.status,
    task: agent.task,
    progress: agent.progress,
    elapsed: agent.elapsed,
    tokensUsed: agent.tokensUsed,
    cost: agent.cost,
    completedTasks: agent.completedTasks,
    model: agent.model,
    logs: agent.logs.slice(-50),
  };
}

function getFullState() {
  return {
    agents: Array.from(state.agents.values()).map(agentToJSON),
    tasks: state.tasks,
    logs: state.logs.slice(-200),
    config: {
      maxAgents: MAX_AGENTS,
      timeoutMinutes: TIMEOUT_MIN,
      defaultModel: DEFAULT_MODEL,
    },
  };
}

// ============================================================================
// LOGGING
// ============================================================================

function addLog(agentName, message) {
  const now = new Date();
  const time = now.toTimeString().slice(0, 8);
  const entry = { time, agent: agentName, message, timestamp: Date.now() };
  state.logs.push(entry);
  if (state.logs.length > 1000) state.logs = state.logs.slice(-800);

  // Also add to agent's logs
  for (const a of state.agents.values()) {
    if (a.name === agentName) {
      a.logs.push(entry);
      if (a.logs.length > 200) a.logs = a.logs.slice(-150);
    }
  }

  broadcast({ type: 'log', data: entry });
}

// ============================================================================
// AGENT ORCHESTRATION
// ============================================================================

async function runAgent(agent) {
  agent.status = 'running';
  agent.startedAt = Date.now();
  agent.progress = 0;
  broadcast({ type: 'state', data: getFullState() });

  const taskPrompt = agent.task;
  addLog(agent.name, `Starting task: ${taskPrompt}`);

  // ---- DEMO MODE (no API key) ----
  if (!anthropic) {
    await runAgentDemo(agent);
    return;
  }

  // ---- REAL MODE (Claude API) ----
  const systemPrompt = getSystemPrompt(agent.type);

  try {
    const stream = anthropic.messages.stream({
      model: agent.model || DEFAULT_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: taskPrompt }],
    });

    let totalTokens = 0;
    let chunks = 0;
    const totalExpectedChunks = 40;

    stream.on('text', (text) => {
      chunks++;
      agent.progress = Math.min(95, Math.round((chunks / totalExpectedChunks) * 100));
      agent.elapsed = Math.round((Date.now() - agent.startedAt) / 1000);

      if (chunks % 8 === 0) {
        const preview = text.trim().slice(0, 80);
        if (preview) addLog(agent.name, preview + (text.length > 80 ? '...' : ''));
      }

      broadcast({ type: 'agent-progress', data: { id: agent.id, progress: agent.progress, elapsed: agent.elapsed } });
    });

    const finalMessage = await stream.finalMessage();
    totalTokens = (finalMessage.usage?.input_tokens || 0) + (finalMessage.usage?.output_tokens || 0);

    agent.tokensUsed += totalTokens;
    agent.cost = agent.tokensUsed * 0.003 / 1000;
    agent.progress = 100;
    agent.status = 'completed';
    agent.completedTasks++;
    agent.elapsed = Math.round((Date.now() - agent.startedAt) / 1000);
    agent.lastResult = finalMessage.content?.[0]?.text || '';

    addLog(agent.name, `Task completed: ${agent.task} (${totalTokens} tokens, ${agent.elapsed}s)`);
    broadcast({ type: 'toast', data: { message: `${agent.name} completed "${agent.task}"`, toastType: 'success' } });

    // Auto-assign next matching task
    const nextTask = state.tasks.find(t => t.agentType === agent.type);
    if (nextTask) {
      state.tasks = state.tasks.filter(t => t.id !== nextTask.id);
      agent.task = nextTask.name + ': ' + nextTask.desc;
      addLog('Supervisor', `Auto-assigned "${nextTask.name}" to ${agent.name}`);
      await runAgent(agent);
    }
  } catch (err) {
    agent.status = 'failed';
    agent.elapsed = Math.round((Date.now() - agent.startedAt) / 1000);
    addLog(agent.name, `Error: ${err.message}`);
    broadcast({ type: 'toast', data: { message: `${agent.name} failed: ${err.message}`, toastType: 'error' } });
  }

  broadcast({ type: 'state', data: getFullState() });
}

// Demo mode: simulates agent work without API calls
async function runAgentDemo(agent) {
  const SIM_MESSAGES = {
    builder: ['Generating component structure...', 'Writing API handler...', 'Creating migration file...', 'Scaffolding controllers...', 'Compiling modules...', 'Building auth flow...', 'Writing validation schemas...'],
    researcher: ['Analyzing dependency graph...', 'Evaluating patterns...', 'Reviewing best practices...', 'Comparing solutions...', 'Assessing vulnerabilities...'],
    tester: ['Running test suite...', 'Executing load test...', 'Validating API schemas...', 'Testing edge cases...', 'Checking error paths...'],
    reviewer: ['Reviewing code style...', 'Checking security patterns...', 'Validating error handling...', 'Analyzing complexity...'],
    debugger: ['Tracing execution...', 'Analyzing stack trace...', 'Inspecting network logs...', 'Profiling CPU usage...', 'Checking race conditions...'],
  };
  const msgs = SIM_MESSAGES[agent.type] || SIM_MESSAGES.builder;

  for (let i = 0; i <= 20; i++) {
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
    agent.progress = Math.min(100, Math.round((i / 20) * 100));
    agent.elapsed = Math.round((Date.now() - agent.startedAt) / 1000);
    agent.tokensUsed += 50 + Math.floor(Math.random() * 150);
    agent.cost = agent.tokensUsed * 0.003 / 1000;

    if (Math.random() < 0.4) {
      addLog(agent.name, msgs[Math.floor(Math.random() * msgs.length)]);
    }

    broadcast({ type: 'agent-progress', data: { id: agent.id, progress: agent.progress, elapsed: agent.elapsed } });
  }

  agent.progress = 100;
  agent.status = 'completed';
  agent.completedTasks++;
  agent.elapsed = Math.round((Date.now() - agent.startedAt) / 1000);
  addLog(agent.name, `[DEMO] Task completed: ${agent.task}`);
  broadcast({ type: 'toast', data: { message: `${agent.name} completed "${agent.task}" (demo mode)`, toastType: 'success' } });

  // Auto-assign next matching task
  const nextTask = state.tasks.find(t => t.agentType === agent.type);
  if (nextTask) {
    state.tasks = state.tasks.filter(t => t.id !== nextTask.id);
    agent.task = nextTask.name + ': ' + nextTask.desc;
    addLog('Supervisor', `Auto-assigned "${nextTask.name}" to ${agent.name}`);
    await runAgentDemo(agent);
  }

  broadcast({ type: 'state', data: getFullState() });
}

function getSystemPrompt(type) {
  const prompts = {
    builder: `You are a code builder agent. Write clean, production-ready code.
Focus on one module at a time. Keep files under 300 lines.
Always include error handling. Report what you're building step by step.`,

    researcher: `You are a research agent. Investigate solutions, find best practices,
and compile recommendations. Always provide code examples. Keep summaries concise.`,

    tester: `You are a testing agent. Write comprehensive tests - unit tests,
integration tests, and edge cases. Aim for 80%+ coverage on critical paths.
Report findings clearly.`,

    reviewer: `You are a code review agent. Check for security vulnerabilities,
performance issues, code style consistency, missing error handling, and test gaps.
Provide specific, actionable feedback.`,

    debugger: `You are a debugging agent. Start with error messages and stack traces.
Identify root cause before attempting fixes. Document what caused the bug and how to fix it.`,
  };
  return prompts[type] || prompts.builder;
}

// ============================================================================
// WEBSOCKET
// ============================================================================

const clients = new Set();

function broadcast(message) {
  const json = JSON.stringify(message);
  for (const ws of clients) {
    if (ws.readyState === 1) ws.send(json);
  }
}

function handleWSMessage(ws, raw) {
  let msg;
  try { msg = JSON.parse(raw); } catch { return; }

  switch (msg.action) {
    case 'get-state':
      ws.send(JSON.stringify({ type: 'state', data: getFullState() }));
      break;

    case 'spawn-agent': {
      const type = msg.agentType || 'builder';
      const num = state.nextAgentNum++;
      const id = `agent-${String(num).padStart(3, '0')}`;
      const names = { builder: 'Builder', researcher: 'Researcher', tester: 'Tester', reviewer: 'Reviewer', debugger: 'Debugger' };
      const agent = {
        id,
        name: `${names[type] || 'Agent'} ${num}`,
        type,
        status: 'idle',
        task: 'Standing by',
        progress: 0,
        elapsed: 0,
        tokensUsed: 0,
        cost: 0,
        completedTasks: 0,
        model: msg.model || DEFAULT_MODEL,
        logs: [],
        startedAt: null,
        lastResult: '',
      };
      state.agents.set(id, agent);
      addLog('Supervisor', `Spawned ${agent.name} (${type})`);
      broadcast({ type: 'state', data: getFullState() });
      broadcast({ type: 'toast', data: { message: `${agent.name} spawned`, toastType: 'success' } });
      break;
    }

    case 'create-task': {
      const id = `task-${String(state.nextTaskNum++).padStart(3, '0')}`;
      const task = {
        id,
        name: msg.name || 'Unnamed task',
        desc: msg.desc || '',
        priority: msg.priority || 'medium',
        agentType: msg.agentType || 'builder',
        dependencies: msg.dependencies || [],
      };
      state.tasks.push(task);
      addLog('Supervisor', `Task queued: ${task.name} [${task.priority}]`);
      broadcast({ type: 'state', data: getFullState() });
      break;
    }

    case 'assign-task': {
      const task = state.tasks.find(t => t.id === msg.taskId);
      if (!task) break;
      const agent = Array.from(state.agents.values()).find(
        a => a.type === task.agentType && (a.status === 'idle' || a.status === 'queued')
      );
      if (!agent) {
        broadcast({ type: 'toast', data: { message: `No available ${task.agentType} agent`, toastType: 'warn' } });
        break;
      }
      state.tasks = state.tasks.filter(t => t.id !== task.id);
      agent.task = task.name + ': ' + task.desc;
      runAgent(agent); // fire and forget
      break;
    }

    case 'run-agent': {
      const agent = state.agents.get(msg.agentId);
      if (!agent) break;
      if (msg.task) agent.task = msg.task;
      runAgent(agent);
      break;
    }

    case 'pause-agent': {
      const agent = state.agents.get(msg.agentId);
      if (agent) {
        agent.status = 'idle';
        addLog(agent.name, 'Agent paused');
        broadcast({ type: 'state', data: getFullState() });
      }
      break;
    }

    case 'remove-agent': {
      const agent = state.agents.get(msg.agentId);
      if (agent) {
        state.agents.delete(msg.agentId);
        addLog('Supervisor', `Removed ${agent.name}`);
        broadcast({ type: 'state', data: getFullState() });
      }
      break;
    }

    case 'load-template': {
      const templates = {
        'Full App Build': [
          { name: 'Project scaffolding', agentType: 'builder', priority: 'high' },
          { name: 'Database schema design', agentType: 'builder', priority: 'high' },
          { name: 'API layer', agentType: 'builder', priority: 'high' },
          { name: 'Authentication system', agentType: 'builder', priority: 'high' },
          { name: 'Frontend shell', agentType: 'builder', priority: 'medium' },
          { name: 'UI components', agentType: 'builder', priority: 'medium' },
          { name: 'Integration tests', agentType: 'tester', priority: 'medium' },
          { name: 'Architecture review', agentType: 'researcher', priority: 'low' },
          { name: 'Code review', agentType: 'reviewer', priority: 'low' },
          { name: 'Performance testing', agentType: 'tester', priority: 'low' },
        ],
        'Bug Fix Sprint': [
          { name: 'Reproduce bugs', agentType: 'debugger', priority: 'high' },
          { name: 'Root cause analysis', agentType: 'researcher', priority: 'high' },
          { name: 'Implement fixes', agentType: 'builder', priority: 'high' },
          { name: 'Regression tests', agentType: 'tester', priority: 'medium' },
          { name: 'Fix review', agentType: 'reviewer', priority: 'medium' },
        ],
        'Add Feature': [
          { name: 'Research requirements', agentType: 'researcher', priority: 'high' },
          { name: 'Design architecture', agentType: 'researcher', priority: 'high' },
          { name: 'Backend implementation', agentType: 'builder', priority: 'high' },
          { name: 'Frontend implementation', agentType: 'builder', priority: 'high' },
          { name: 'Write tests', agentType: 'tester', priority: 'medium' },
          { name: 'Code review', agentType: 'reviewer', priority: 'medium' },
        ],
        'Code Review': [
          { name: 'Static analysis', agentType: 'reviewer', priority: 'high' },
          { name: 'Security audit', agentType: 'researcher', priority: 'high' },
          { name: 'Performance review', agentType: 'tester', priority: 'medium' },
          { name: 'Documentation check', agentType: 'reviewer', priority: 'low' },
        ],
      };
      const tmpl = templates[msg.template];
      if (!tmpl) break;
      tmpl.forEach(sub => {
        const id = `task-${String(state.nextTaskNum++).padStart(3, '0')}`;
        state.tasks.push({ id, name: sub.name, desc: `From: ${msg.template}`, priority: sub.priority, agentType: sub.agentType, dependencies: [] });
      });
      addLog('Supervisor', `Loaded template "${msg.template}" (${tmpl.length} tasks)`);
      broadcast({ type: 'state', data: getFullState() });
      broadcast({ type: 'toast', data: { message: `Template loaded: ${tmpl.length} tasks`, toastType: 'success' } });
      break;
    }

    case 'clear-logs':
      state.logs = [];
      for (const a of state.agents.values()) a.logs = [];
      addLog('system', 'Logs cleared');
      broadcast({ type: 'state', data: getFullState() });
      break;
  }
}

// ============================================================================
// HTTP + WS SERVER
// ============================================================================

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Serve dashboard UI
app.use(express.static(join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', agents: state.agents.size, tasks: state.tasks.length });
});

// REST fallback for state
app.get('/api/state', (req, res) => {
  res.json(getFullState());
});

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: 'state', data: getFullState() }));
  ws.on('message', (raw) => handleWSMessage(ws, raw.toString()));
  ws.on('close', () => clients.delete(ws));
});

server.listen(PORT, () => {
  const mode = hasApiKey ? 'LIVE (Claude API)' : 'DEMO (no API key)';
  console.log('');
  console.log('  ┌─────────────────────────────────────────┐');
  console.log('  │                                         │');
  console.log('  │   ⚙  AgentHub - Multi-Agent Dashboard   │');
  console.log('  │                                         │');
  console.log(`  │   → http://localhost:${PORT}               │`);
  console.log('  │                                         │');
  console.log(`  │   Mode:      ${mode.padEnd(24)}│`);
  console.log(`  │   Model:     ${DEFAULT_MODEL.padEnd(24)}│`);
  console.log(`  │   Max agents: ${String(MAX_AGENTS).padEnd(22)}│`);
  console.log(`  │   Timeout:    ${String(TIMEOUT_MIN)}min                   │`);
  console.log('  │                                         │');
  if (!hasApiKey) {
  console.log('  │   Add your key to .env for live mode    │');
  console.log('  │                                         │');
  }
  console.log('  └─────────────────────────────────────────┘');
  console.log('');
});
