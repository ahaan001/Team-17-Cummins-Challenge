// ─────────────────────────────────────────────────────────────────────────────
// COMPETENCY HELPER — Junior tech safety: competency levels, ask-senior cues,
// safety checklists, escalation paths
// ─────────────────────────────────────────────────────────────────────────────

// Per-SPN/FMI: minimum competency level (1=junior OK, 2=intermediate, 3=expert/senior)
// Codes not listed default to 1
export const COMPETENCY_LEVELS = {
  "SPN 3251 FMI 0": 3,  // DPF regen — fire risk
  "SPN 641 FMI 5": 3,   // Turbo structural
  "SPN 651 FMI 5": 3,   // High-pressure fuel 2000 bar
  "SPN 157 FMI 18": 2,  // Rail pressure — depressurize
  "SPN 636 FMI 2": 3,   // CKP — sudden shutdown
  "SPN 3364 FMI 18": 2, // SCR/DEF warranty
  "SPN 32 FMI 0": 2,    // Turbo over-boost
  "SPN 27 FMI 2": 1,
  "SPN 27 FMI 4": 1,
};

// Safety checklist items for high-risk procedures
export const SAFETY_CHECKLISTS = {
  fuel_high_pressure: [
    "Depressurize fuel system per Cummins SM",
    "Lock-out/tag-out ECM if required",
    "Wear safety glasses and gloves",
    "No ignition sources nearby",
  ],
  dpf_regen: [
    "Ensure exhaust area is clear of combustibles",
    "Verify ambient temp within spec",
    "Park brake set, chock wheels",
    "Notify operator of elevated exhaust temps",
  ],
  turbo: [
    "Do not operate vehicle until turbo integrity confirmed",
    "Inspect exhaust for oil leakage",
    "Check for blade contact or bearing play",
  ],
  emissions: [
    "Verify EPA/CARB compliance requirements",
    "Use OEM parts to maintain warranty",
    "Document for emissions records",
  ],
};

export function getCompetencyLevel(code) {
  return COMPETENCY_LEVELS[code] || 1;
}

export function requiresSeniorReview(codes, techLevel) {
  var maxRequired = 1;
  (codes || []).forEach(function(c) {
    var lvl = getCompetencyLevel(c);
    if (lvl > maxRequired) maxRequired = lvl;
  });
  return (techLevel || 1) < maxRequired;
}

export function getSafetyChecklistForCode(code, severity) {
  if (severity === "critical" || /157|651|641|636/.test((code || ""))) {
    return SAFETY_CHECKLISTS.fuel_high_pressure.concat(SAFETY_CHECKLISTS.turbo).filter(function(v, i, a) { return a.indexOf(v) === i; });
  }
  if (/3251/.test(code || "")) return SAFETY_CHECKLISTS.dpf_regen;
  if (/3364|3216/.test(code || "")) return SAFETY_CHECKLISTS.emissions;
  return [];
}
