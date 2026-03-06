// ─────────────────────────────────────────────────────────────────────────────
// RESULT CACHE — Speeds resolution by caching diagnostic results for repeated
// inputs (same codes + engine). Cache expires after 1 hour.
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_KEY_PREFIX = "cummins_cache_";
const CACHE_TTL_MS = 60 * 60 * 1000;

function cacheKey(input) {
  var str = JSON.stringify({
    engineType: (input.engineType || "").trim(),
    faultCodes: (input.faultCodes || "").trim().toUpperCase(),
    symptoms: (input.symptoms || "").trim().slice(0, 200),
  });
  var h = 0;
  for (var i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return CACHE_KEY_PREFIX + (h >>> 0).toString(16);
}

export function getCachedResult(input) {
  try {
    var key = cacheKey(input);
    var raw = localStorage.getItem(key);
    if (!raw) return null;
    var entry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.result;
  } catch (e) {
    void e;
    return null;
  }
}

export function setCachedResult(input, result) {
  try {
    var key = cacheKey(input);
    localStorage.setItem(key, JSON.stringify({
      result: result,
      timestamp: Date.now(),
    }));
  } catch (e) {
    void e;
  }
}
