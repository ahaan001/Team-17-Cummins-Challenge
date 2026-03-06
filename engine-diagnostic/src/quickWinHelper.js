// ─────────────────────────────────────────────────────────────────────────────
// QUICK WIN HELPER — Ranks faults by "likely quick fix" vs "likely longer repair"
// to speed resolution (try quick wins first)
// ─────────────────────────────────────────────────────────────────────────────

// Keywords that suggest quick/electrical fixes (connector, filter, etc.)
var QUICK_WIN_KEYWORDS = /connector|loose|corroded|wiring|circuit|filter|sensor.*voltage|cleaning|reseat|reconnect/i;

// Keywords that suggest longer/mechanical work
var LONG_REPAIR_KEYWORDS = /replace|turbo|turbocharger|fuel pump|injector|EGR valve|EGR cooler|DPF|SCR catalyst|bearing|rebuild/i;

export function getQuickWinScore(detail) {
  if (!detail) return 0.5;
  var causes = (detail.causes || []).join(" ").toLowerCase();
  var issue = (detail.issue || "").toLowerCase();
  var text = causes + " " + issue;
  var quick = text.match(QUICK_WIN_KEYWORDS) ? 1 : 0;
  var long = text.match(LONG_REPAIR_KEYWORDS) ? 1 : 0;
  if (quick && !long) return 0.9;
  if (long && !quick) return 0.2;
  if (quick && long) return 0.5;
  return 0.5;
}

export function sortByQuickWin(details) {
  var scored = (details || []).map(function(d) {
    return { detail: d, score: getQuickWinScore(d) };
  });
  scored.sort(function(a, b) { return b.score - a.score; });
  return scored.map(function(s) { return s.detail; });
}

export function isQuickWin(detail) {
  return getQuickWinScore(detail) >= 0.7;
}
