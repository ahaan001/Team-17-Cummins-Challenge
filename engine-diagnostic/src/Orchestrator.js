// ─────────────────────────────────────────────────────────────────────────────
// CUMMINS ENGINE DIAGNOSTIC — ORCHESTRATOR AGENT
// Main agent that owns the pipeline. Sub-agents (fault-parser, diagnostic,
// troubleshoot, parts, warehouse, alternative) are called sequentially under
// its control. The Orchestrator validates inputs, enforces budgets, writes
// every decision log entry, and fires escalation rules.
// ─────────────────────────────────────────────────────────────────────────────

// ── Escalation rule table ────────────────────────────────────────────────────
// Each rule has:
//   id          — machine-readable identifier
//   description — human label shown in the UI
//   trigger     — function(agentId, result, budget) → bool
//   action      — "flag"  (continue, but annotate) |
//                 "abort" (halt remaining sub-agents immediately)
//   message     — string or function(agentId) → string
// ─────────────────────────────────────────────────────────────────────────────
export var ESCALATION_RULES = [
  {
    id: "critical-severity",
    description: "Critical severity fault detected",
    trigger: function(agentId, result) {
      return agentId === "fault-parser" && result != null && result.severity === "critical";
    },
    action: "flag",
    message: "Critical severity fault — immediate escalation to Cummins Technical Assistance Center required",
  },
  {
    id: "low-confidence",
    description: "Diagnostic confidence below 50%",
    trigger: function(agentId, result) {
      if (agentId !== "diagnostic" || !result || !Array.isArray(result.details)) return false;
      return result.details.some(function(d) {
        var pct = parseFloat(d.confidence);
        return !isNaN(pct) && pct < 50;
      });
    },
    action: "flag",
    message: "Diagnostic confidence < 50% — recommend additional INSITE snapshot data before repair",
  },
  {
    id: "agent-error",
    description: "Sub-agent execution error",
    trigger: function(agentId, result) {
      return result != null && result.error != null;
    },
    action: "flag",
    message: function(agentId) {
      return "Sub-agent '" + agentId + "' failed — results may be incomplete, verify manually";
    },
  },
  {
    id: "token-budget-exceeded",
    description: "Token budget exhausted",
    trigger: function(agentId, result, budget) {
      return budget.tokensUsed > budget.maxTokens;
    },
    action: "abort",
    message: "Token budget exhausted — aborting remaining sub-agents",
  },
  {
    id: "timeout-exceeded",
    description: "Execution timeout exceeded",
    trigger: function(agentId, result, budget) {
      return budget.elapsedMs >= budget.timeoutMs;
    },
    action: "abort",
    message: "Execution timeout exceeded — aborting remaining sub-agents",
  },
  {
    id: "step-budget-exceeded",
    description: "Maximum pipeline steps exceeded",
    trigger: function(agentId, result, budget) {
      return budget.stepsCompleted > budget.maxSteps;
    },
    action: "abort",
    message: "Maximum pipeline steps exceeded — aborting",
  },
];

// ── Utilities ────────────────────────────────────────────────────────────────
function simpleHash(obj) {
  var str = JSON.stringify(obj) || "";
  var h = 0;
  for (var i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function extractConfidence(agentId, result) {
  if (!result || result.error) return "N/A";
  if (
    agentId === "diagnostic" &&
    Array.isArray(result.details) &&
    result.details[0] &&
    result.details[0].confidence
  ) {
    return result.details[0].confidence;
  }
  if (agentId === "fault-parser" && result.severity) return result.severity;
  return "N/A";
}

// ── Orchestrator class ───────────────────────────────────────────────────────
export function Orchestrator(config) {
  config = config || {};

  // Budget caps enforced across the entire pipeline run
  this.budget = {
    maxTokens:  config.maxTokens  != null ? config.maxTokens  : 6000,
    maxSteps:   config.maxSteps   != null ? config.maxSteps   : 6,
    timeoutMs:  config.timeoutMs  != null ? config.timeoutMs  : 45000,
    tokensUsed: 0,
    stepsCompleted: 0,
    elapsedMs: 0,
  };

  this.stepDelayMs      = config.stepDelayMs      != null ? config.stepDelayMs : 450;
  this.escalationRules  = config.escalationRules  || ESCALATION_RULES;
  this.model = config.model || "mistral:7b-instruct";
  this.isOnline         = config.isOnline         || false;

  // React state callbacks — wired from App.jsx so the Orchestrator stays
  // framework-agnostic while still driving live UI updates.
  this.onAgentStart    = config.onAgentStart    || null; // (agentId, stepIndex)
  this.onAgentComplete = config.onAgentComplete || null; // (agentId, result, errorMsg|null)
  this.onLogEntry      = config.onLogEntry      || null; // (logEntry)
  this.onEscalation    = config.onEscalation    || null; // (escalation)
}

// validate — ensures the minimum required fields are present before launching
// the pipeline. Returns { valid: bool, missing: string[] }.
Orchestrator.prototype.validate = function(input) {
  var missing = [];
  if (!((input.faultCodes || "").trim()) && !((input.symptoms || "").trim())) {
    missing.push("faultCodes or symptoms");
  }
  if (!((input.engineType || "").trim())) missing.push("engineType");
  return { valid: missing.length === 0, missing: missing };
};

// _checkEscalation — evaluates all escalation rules against the current
// agent result and accumulated budget. Returns the first matching escalation
// object, or null if none fire.
Orchestrator.prototype._checkEscalation = function(agentId, result) {
  for (var i = 0; i < this.escalationRules.length; i++) {
    var rule = this.escalationRules[i];
    if (rule.trigger(agentId, result, this.budget)) {
      var msg = typeof rule.message === "function" ? rule.message(agentId) : rule.message;
      return {
        ruleId:      rule.id,
        description: rule.description,
        action:      rule.action,
        message:     msg,
        agentId:     agentId,
        timestamp:   new Date().toISOString(),
      };
    }
  }
  return null;
};

// run — main entry point. Validates input, then drives each sub-agent in
// order. Writes a decision log entry per step. Fires escalation rules after
// every step (and checks budget abort rules before each step). Returns a
// summary object with { runId, caseId, results, escalations, aborted,
// abortReason, budget }.
Orchestrator.prototype.run = async function(input, agentDefs) {
  var validation = this.validate(input);
  if (!validation.valid) {
    return {
      aborted:     true,
      abortReason: "Validation failed — missing: " + validation.missing.join(", "),
      results:     {},
      escalations: [],
      budget:      Object.assign({}, this.budget),
    };
  }

  var runId     = "RUN-" + Date.now().toString(36).toUpperCase();
  var caseId    = "CASE-" + simpleHash({ faultCodes: input.faultCodes, engineType: input.engineType });
  var startTime = Date.now();
  var results   = {};
  var escalations = [];
  var aborted   = false;
  var abortReason = null;

  for (var i = 0; i < agentDefs.length; i++) {
    var step = agentDefs[i];

    // ── Pre-step: check budget / timeout abort rules ─────────────────────────
    this.budget.elapsedMs = Date.now() - startTime;
    var preEsc = this._checkEscalation("__budget__", null);
    if (preEsc && preEsc.action === "abort") {
      aborted     = true;
      abortReason = preEsc.message;
      escalations.push(preEsc);
      if (this.onEscalation) this.onEscalation(preEsc);
      break;
    }

    var agentMode  = step.id === "warehouse" ? "offline" : (this.isOnline ? "online" : "offline");
    var agentModel = (this.isOnline && step.id !== "warehouse") ? this.model : "local-kb";
    var inputsHash = simpleHash(i === 0 ? input : results);
    var startedAt  = new Date().toISOString();

    if (this.onAgentStart) this.onAgentStart(step.id, i);

    // ── Execute sub-agent ────────────────────────────────────────────────────
    var result;
    var errorMsg = null;
    try {
      result = await step.fn(results);
      this.budget.stepsCompleted += 1;
      this.budget.tokensUsed     += (step.tokenBudget != null ? step.tokenBudget : 0);
      this.budget.elapsedMs       = Date.now() - startTime;
    } catch (err) {
      errorMsg = err.message;
      result   = { error: errorMsg };
      this.budget.stepsCompleted += 1;
      this.budget.elapsedMs       = Date.now() - startTime;
    }

    results[step.id] = result;

    // ── Write decision log entry ─────────────────────────────────────────────
    var endedAt  = new Date().toISOString();
    var warehouseSelected = null;
    if (step.id === "warehouse" && !errorMsg) {
      var firstInStock = (result.availability || []).find(function(a) { return a.stock > 0; });
      warehouseSelected = firstInStock ? firstInStock.warehouse.id : null;
    }
    var logEntry = {
      run_id:                  runId,
      case_id:                 caseId,
      agent_name:              step.id,
      started_at:              startedAt,
      ended_at:                endedAt,
      inputs_hash:             inputsHash,
      outputs_hash:            errorMsg ? "00000000" : simpleHash(result),
      confidence:              extractConfidence(step.id, result),
      mode:                    agentMode,
      model_name:              agentModel,
      token_budget:            step.tokenBudget != null ? step.tokenBudget : 0,
      tokens_used_cumulative:  this.budget.tokensUsed,
      approval_status:         "pending",
      approver_id:             null,
      approval_timestamp:      null,
      approval_reason:         null,
      warehouse_selected:      warehouseSelected,
      technician_accepted:     null,
    };
    if (errorMsg) logEntry.error = errorMsg;

    if (this.onLogEntry) this.onLogEntry(logEntry);
    if (this.onAgentComplete) this.onAgentComplete(step.id, result, errorMsg);

    // ── Post-step: check all escalation rules ────────────────────────────────
    var postEsc = this._checkEscalation(step.id, result);
    if (postEsc) {
      escalations.push(postEsc);
      if (this.onEscalation) this.onEscalation(postEsc);
      if (postEsc.action === "abort") {
        aborted     = true;
        abortReason = postEsc.message;
        break;
      }
    }

    // ── Inter-step delay (visual pacing in the UI) ───────────────────────────
    if (this.stepDelayMs && i < agentDefs.length - 1) {
      var delay = this.stepDelayMs;
      await new Promise(function(resolve) { setTimeout(resolve, delay); });
    }
  }

  return {
    runId:      runId,
    caseId:     caseId,
    results:    results,
    escalations: escalations,
    aborted:    aborted,
    abortReason: abortReason,
    budget:     Object.assign({}, this.budget),
  };
};
