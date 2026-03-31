/**
 * VoltAgent Configuration
 * Multi-agent orchestrator for parallel task execution
 *
 * Setup:
 *   npm install @voltagent/core @voltagent/vercel-ai @ai-sdk/anthropic
 *   npm install @voltagent/server-hono @voltagent/libsql
 *
 * Run:
 *   node voltagent.config.js
 */

// ===== AGENT DEFINITIONS =====
// These map to the dashboard agent types

const agentDefinitions = {
  supervisor: {
    name: 'Supervisor',
    instructions: `You are a project supervisor agent. Your role is to:
      1. Break large tasks into smaller, parallelizable chunks
      2. Assign chunks to specialized sub-agents
      3. Monitor progress and handle failures
      4. Merge results when all sub-agents complete
      Never let a single task run longer than 30 minutes.
      If a sub-agent stalls, reassign the task to a fresh agent.`,
    model: 'claude-opus-4-6',
    maxConcurrent: 1,
  },

  builder: {
    name: 'Builder',
    instructions: `You are a code builder agent. You write clean, production-ready code.
      Focus on one module at a time. Keep files under 300 lines.
      Always include error handling and type safety.
      Report progress as percentage after each major step.`,
    model: 'claude-sonnet-4-6',
    maxConcurrent: 3,
  },

  reviewer: {
    name: 'Reviewer',
    instructions: `You are a code review agent. You check for:
      - Security vulnerabilities (OWASP top 10)
      - Performance bottlenecks
      - Code style consistency
      - Missing error handling
      - Test coverage gaps
      Provide actionable feedback, not vague suggestions.`,
    model: 'claude-sonnet-4-6',
    maxConcurrent: 2,
  },

  tester: {
    name: 'Tester',
    instructions: `You are a testing agent. You write and run tests.
      Generate unit tests, integration tests, and edge case tests.
      Aim for 80%+ coverage on critical paths.
      Report failures immediately with reproduction steps.`,
    model: 'claude-sonnet-4-6',
    maxConcurrent: 2,
  },

  researcher: {
    name: 'Researcher',
    instructions: `You are a research agent. You investigate solutions,
      find best practices, and compile recommendations.
      Always cite sources. Provide code examples where applicable.
      Keep research summaries under 500 words.`,
    model: 'claude-haiku-4-5',
    maxConcurrent: 3,
  },

  debugger: {
    name: 'Debugger',
    instructions: `You are a debugging agent. You diagnose and fix issues.
      Start with error messages and stack traces.
      Identify root cause before attempting fixes.
      Document what caused the bug and how you fixed it.`,
    model: 'claude-sonnet-4-6',
    maxConcurrent: 2,
  },
};

// ===== ORCHESTRATION CONFIG =====
const orchestrationConfig = {
  // Supervisor pattern: one supervisor delegates to sub-agents
  mode: 'supervisor',

  // Max agents running simultaneously
  maxParallelAgents: 5,

  // Per-agent timeout in minutes (prevents 24hr+ hangs)
  agentTimeoutMinutes: 30,

  // Auto-retry failed tasks with exponential backoff
  autoRetry: {
    enabled: true,
    maxRetries: 3,
    backoffMs: [2000, 8000, 30000],
  },

  // Task decomposition strategy
  taskSplitting: {
    strategy: 'auto-decompose',
    maxChunkSize: 500, // lines of code per chunk
    dependencyGraph: true, // respect task dependencies
  },

  // Memory persistence
  memory: {
    provider: 'libsql',
    // For local dev, use file-based SQLite
    url: 'file:./voltagent-memory.db',
  },
};

// ===== TASK TEMPLATES =====
// Pre-built task decomposition templates for common operations
const taskTemplates = {
  'build-app': {
    name: 'Build Full Application',
    subtasks: [
      { name: 'Project scaffolding', agent: 'builder', priority: 'high', deps: [] },
      { name: 'Database schema', agent: 'builder', priority: 'high', deps: [] },
      { name: 'API endpoints', agent: 'builder', priority: 'high', deps: ['Database schema'] },
      { name: 'Authentication', agent: 'builder', priority: 'high', deps: ['API endpoints'] },
      { name: 'UI components', agent: 'builder', priority: 'medium', deps: ['Project scaffolding'] },
      { name: 'Page layouts', agent: 'builder', priority: 'medium', deps: ['UI components'] },
      { name: 'State management', agent: 'builder', priority: 'medium', deps: ['API endpoints', 'UI components'] },
      { name: 'Tests', agent: 'tester', priority: 'medium', deps: ['API endpoints', 'Authentication'] },
      { name: 'Code review', agent: 'reviewer', priority: 'low', deps: ['Tests'] },
      { name: 'Performance audit', agent: 'researcher', priority: 'low', deps: ['Code review'] },
    ],
  },

  'fix-bugs': {
    name: 'Bug Fix Sprint',
    subtasks: [
      { name: 'Triage & reproduce', agent: 'debugger', priority: 'high', deps: [] },
      { name: 'Root cause analysis', agent: 'debugger', priority: 'high', deps: ['Triage & reproduce'] },
      { name: 'Implement fixes', agent: 'builder', priority: 'high', deps: ['Root cause analysis'] },
      { name: 'Regression tests', agent: 'tester', priority: 'medium', deps: ['Implement fixes'] },
      { name: 'Review fixes', agent: 'reviewer', priority: 'medium', deps: ['Regression tests'] },
    ],
  },

  'add-feature': {
    name: 'Add Feature',
    subtasks: [
      { name: 'Research & design', agent: 'researcher', priority: 'high', deps: [] },
      { name: 'Backend implementation', agent: 'builder', priority: 'high', deps: ['Research & design'] },
      { name: 'Frontend implementation', agent: 'builder', priority: 'high', deps: ['Research & design'] },
      { name: 'Integration', agent: 'builder', priority: 'medium', deps: ['Backend implementation', 'Frontend implementation'] },
      { name: 'Tests', agent: 'tester', priority: 'medium', deps: ['Integration'] },
      { name: 'Review', agent: 'reviewer', priority: 'low', deps: ['Tests'] },
    ],
  },
};

// ===== EXPORT =====
if (typeof module !== 'undefined') {
  module.exports = { agentDefinitions, orchestrationConfig, taskTemplates };
}
