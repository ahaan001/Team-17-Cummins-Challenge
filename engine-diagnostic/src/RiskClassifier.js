// ─────────────────────────────────────────────────────────────────────────────
// CUMMINS ENGINE DIAGNOSTIC — RISK CLASSIFIER
// Determines whether a diagnostic run requires human approval before repair
// actions (procedures, parts, ordering) can be shown or acted upon.
//
// Three approval categories:
//   safety   — procedures that risk injury, fire, or drivability loss
//   warranty — actions that may void Cummins engine warranty or ESC coverage
//   billing  — high-cost parts that require purchase authorisation
//
// Returns { requiresApproval: bool, reasons: [{ text, category }] }
// ─────────────────────────────────────────────────────────────────────────────

// ── Per-SPN/FMI code rules ────────────────────────────────────────────────────
var HIGH_RISK_CODES = {
  "SPN 3251 FMI 0": {
    reason: "Forced DPF regeneration raises exhaust temps above 600 °C — fire risk near combustibles, area must be clear",
    category: "safety",
  },
  "SPN 641 FMI 5": {
    reason: "Turbocharger structural failure risk at highway speed — vehicle must not be operated until turbo integrity is confirmed",
    category: "safety",
  },
  "SPN 651 FMI 5": {
    reason: "Common-rail fuel system operates above 2000 bar — mandatory depressurisation and PPE required before any fuel work",
    category: "safety",
  },
  "SPN 157 FMI 18": {
    reason: "High-pressure fuel system inspection — safety lock-out/tag-out procedures mandatory per Cummins SM guidelines",
    category: "safety",
  },
  "SPN 636 FMI 2": {
    reason: "Crankshaft position loss can cause sudden uncontrolled shutdown — no vehicle movement until CKP fault is resolved",
    category: "safety",
  },
  "SPN 3364 FMI 18": {
    reason: "SCR/DEF system repair — EPA Tier 4 / ARB emissions compliance required; failure to use OEM parts voids CARB certification",
    category: "warranty",
  },
  "SPN 3216 FMI 18": {
    reason: "Upstream NOx sensor replacement affects emissions monitoring — regulatory warranty review and Cummins Care documentation required",
    category: "warranty",
  },
  "SPN 2791 FMI 7": {
    reason: "EGR valve replacement cost exceeds $500 — billing authorisation and active warranty status check required",
    category: "billing",
  },
};

// ── Category metadata (used by UI for badge colour and label) ─────────────────
export var RISK_CATEGORIES = {
  safety:   { label: "SAFETY",   color: "#FF1744", bg: "rgba(255,23,68,0.15)",   border: "rgba(255,23,68,0.45)"  },
  warranty: { label: "WARRANTY", color: "#FFC107", bg: "rgba(255,193,7,0.12)",   border: "rgba(255,193,7,0.45)"  },
  billing:  { label: "BILLING",  color: "#4FC3F7", bg: "rgba(79,195,247,0.12)",  border: "rgba(79,195,247,0.45)" },
};

// ── classifyRisk ──────────────────────────────────────────────────────────────
// parsedFaults — result object from the fault-parser agent
// diagnostic   — result object from the diagnostic agent
// ─────────────────────────────────────────────────────────────────────────────
export function classifyRisk(parsedFaults, diagnostic) {
  var reasons = [];

  // 1. Severity gate — any high/critical severity triggers approval
  var severity = (parsedFaults && parsedFaults.severity) || "";
  if (severity === "critical") {
    reasons.push({
      text: "Critical fault severity — procedures may disable safety-critical vehicle systems",
      category: "safety",
    });
  } else if (severity === "high") {
    reasons.push({
      text: "High severity fault — warranty impact assessment and supervisor sign-off required before repair",
      category: "warranty",
    });
  }

  // 2. Per-SPN/FMI code rules
  var codes = (parsedFaults && parsedFaults.codes) || [];
  codes.forEach(function(code) {
    var rule = HIGH_RISK_CODES[code];
    if (rule) {
      reasons.push({ text: rule.reason, category: rule.category });
    }
  });

  // 3. Diagnostic agent cross-check — catches AI-derived severity labels
  //    that may not be captured by the offline KB severity field
  if (diagnostic && Array.isArray(diagnostic.details)) {
    diagnostic.details.forEach(function(d) {
      var hasSeverityReason = reasons.some(function(r) {
        return r.category === "safety" || r.category === "warranty";
      });
      if (!hasSeverityReason && (d.severity === "critical" || d.severity === "high")) {
        reasons.push({
          text: (d.severity === "critical" ? "Critical" : "High") + " severity identified: " +
                (d.issue || d.code) + " — supervisor review required before proceeding",
          category: "safety",
        });
      }
    });
  }

  // De-duplicate by reason text
  var seen = {};
  var unique = reasons.filter(function(r) {
    if (seen[r.text]) return false;
    seen[r.text] = true;
    return true;
  });

  return {
    requiresApproval: unique.length > 0,
    reasons: unique,
  };
}
