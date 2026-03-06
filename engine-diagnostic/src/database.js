// ─────────────────────────────────────────────────────────────────────────────
// DATABASE.JS — localStorage-based Audit Log Storage
// Maintains the same function API as a SQLite implementation but uses
// localStorage for full browser compatibility with Vite.
// ─────────────────────────────────────────────────────────────────────────────

const DB_RUNS_KEY = 'cummins_db_runs';
const DB_LOGS_KEY = 'cummins_db_logs';

function loadRuns() {
  try { return JSON.parse(localStorage.getItem(DB_RUNS_KEY) || '[]'); } catch { return []; }
}

function saveRuns(runs) {
  try { localStorage.setItem(DB_RUNS_KEY, JSON.stringify(runs)); } catch (e) { void e; }
}

function loadLogs() {
  try { return JSON.parse(localStorage.getItem(DB_LOGS_KEY) || '[]'); } catch { return []; }
}

function saveLogs(logs) {
  try { localStorage.setItem(DB_LOGS_KEY, JSON.stringify(logs)); } catch (e) { void e; }
}

/**
 * Initialize the database (no-op for localStorage — tables always exist)
 */
export function initializeDatabase() {
  try {
    if (!localStorage.getItem(DB_RUNS_KEY)) saveRuns([]);
    if (!localStorage.getItem(DB_LOGS_KEY)) saveLogs([]);
    console.log('Database (localStorage) initialized');
    return true;
  } catch(err) {
    console.error('Database initialization error:', err);
    return false;
  }
}

/**
 * Start a new diagnostic run
 */
export function startDiagnosticRun(runId, caseId, input) {
  try {
    const runs = loadRuns();
    runs.unshift({
      id: runId,
      case_id: caseId,
      started_at: new Date().toISOString(),
      ended_at: null,
      aborted: 0,
      abort_reason: null,
      created_at: new Date().toISOString(),
      status: 'completed',
      approval_status: 'pending',
      approval_rejection_reason: null,
      input: input || null,
    });
    saveRuns(runs);
    console.log(`Started diagnostic run: ${runId}`);
    return true;
  } catch(err) {
    console.error('Error starting diagnostic run:', err);
    return false;
  }
}

/**
 * End a diagnostic run
 */
export function endDiagnosticRun(runId, aborted = false, abortReason = null) {
  try {
    const runs = loadRuns();
    const idx = runs.findIndex(r => r.id === runId);
    if (idx !== -1) {
      runs[idx].ended_at = new Date().toISOString();
      runs[idx].aborted = aborted ? 1 : 0;
      runs[idx].abort_reason = abortReason;
      saveRuns(runs);
    }
    console.log(`Ended diagnostic run: ${runId}`);
    return true;
  } catch(err) {
    console.error('Error ending diagnostic run:', err);
    return false;
  }
}

/**
 * Log a single agent decision.
 *
 * Expected fields on logEntry:
 *   run_id, case_id, agent_name, started_at, ended_at,
 *   inputs_hash, outputs_hash, confidence, mode, model_name,
 *   token_budget, tokens_used_cumulative,
 *   approval_status   — "pending" | "approved" | "rejected"
 *   approver_id       — technician name/ID who approved (null until approved)
 *   approval_timestamp — ISO timestamp of approval action (null until approved)
 *   approval_reason   — human-readable reason approval was required (null until approved)
 *   warehouse_selected — warehouse ID that fulfilled parts (e.g. "CDW-001"), null for non-warehouse agents
 *   technician_accepted — true if tech followed the recommendation, null until confirmed
 *   error             — error message string (optional, only on failure)
 */
export function logDecision(logEntry) {
  try {
    const logs = loadLogs();
    logs.push({ ...logEntry, id: logs.length + 1, created_at: new Date().toISOString() });
    saveLogs(logs);
    console.log(`Logged decision from agent: ${logEntry.agent_name}`);
    return true;
  } catch(err) {
    console.error('Error logging decision:', err);
    return false;
  }
}

/**
 * Get all logs for a specific run
 */
export function getRunLogs(runId) {
  try {
    const logs = loadLogs()
      .filter(l => l.run_id === runId)
      .sort((a, b) => a.started_at.localeCompare(b.started_at));
    console.log(`Retrieved ${logs.length} logs for run: ${runId}`);
    return logs;
  } catch(err) {
    console.error('Error retrieving logs:', err);
    return [];
  }
}

/**
 * Get all diagnostic runs (most recent first)
 */
export function getAllRuns(limit = 100) {
  try {
    const runs = loadRuns().slice(0, limit);
    console.log(`Retrieved ${runs.length} diagnostic runs`);
    return runs;
  } catch(err) {
    console.error('Error retrieving runs:', err);
    return [];
  }
}

/**
 * Get a single diagnostic run
 */
export function getRun(runId) {
  try {
    return loadRuns().find(r => r.id === runId) || null;
  } catch(err) {
    console.error('Error retrieving run:', err);
    return null;
  }
}

/**
 * Get statistics about decision logs
 */
export function getStatistics() {
  try {
    const runs = loadRuns();
    const logs = loadLogs();
    return { totalRuns: runs.length, totalLogs: logs.length };
  } catch(err) {
    console.error('Error calculating statistics:', err);
    return {};
  }
}

/**
 * Delete old logs (older than specified days)
 */
export function cleanupOldLogs(days = 365) {
  try {
    const cutoff = new Date(Date.now() - days * 86400000).toISOString();
    const logs = loadLogs().filter(l => l.created_at >= cutoff);
    saveLogs(logs);
    console.log(`Cleaned up logs older than ${days} days`);
    return true;
  } catch(err) {
    console.error('Error cleaning up logs:', err);
    return false;
  }
}

/**
 * Export all logs as JSON (for backup)
 */
export function exportAllLogs() {
  try {
    return {
      exported_at: new Date().toISOString(),
      runs: loadRuns(),
      logs: loadLogs(),
      statistics: getStatistics(),
    };
  } catch(err) {
    console.error('Error exporting logs:', err);
    return null;
  }
}

/**
 * Update run approval status (for audit trail)
 */
export function updateRunApprovalStatus(runId, status, approverId, rejectionReason) {
  try {
    const runs = loadRuns();
    const idx = runs.findIndex(r => r.id === runId);
    if (idx !== -1) {
      runs[idx].approval_status = status;
      runs[idx].approver_id = approverId || null;
      runs[idx].approval_timestamp = new Date().toISOString();
      runs[idx].approval_rejection_reason = rejectionReason || null;
      saveRuns(runs);
    }
    return true;
  } catch (err) {
    console.error('Error updating approval:', err);
    return false;
  }
}

/**
 * Get runs pending approval (for back-office dashboard)
 */
export function getRunsPendingApproval() {
  try {
    return loadRuns().filter(r => r.approval_status === 'requires_approval');
  } catch (e) {
    void e;
    return [];
  }
}

/**
 * Close the database connection (no-op for localStorage)
 */
export function closeDatabase() {
  // No persistent connection to close
}
