// ─────────────────────────────────────────────────────────────────────────────
// LLM PROVIDER — Configurable AI backend (Claude API vs Ollama open-source)
// Supports the goal of "demonstrable with open-source LLMs"
// ─────────────────────────────────────────────────────────────────────────────

const OLLAMA_URL = typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_OLLAMA_URL
  ? import.meta.env.VITE_OLLAMA_URL
  : "http://localhost:11434";

/**
 * Call Claude (Anthropic API)
 */
export async function callClaude(systemPrompt, userMessage, maxTokens) {
  var tokens = maxTokens || 800;
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: tokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  if (!response.ok) throw new Error("Claude API error " + response.status);
  const data = await response.json();
  return data.content.map(function(b) { return b.text || ""; }).join("\n");
}

/**
 * Call Ollama (local open-source LLM — Mistral, Llama, etc.)
 */
export async function callOllama(systemPrompt, userMessage, maxTokens, model) {
  var tokens = maxTokens || 800;
  var ollamaModel = model || "mistral";
  const response = await fetch(OLLAMA_URL + "/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: ollamaModel,
      stream: false,
      options: { num_predict: tokens },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });
  if (!response.ok) throw new Error("Ollama error " + response.status + " — is Ollama running? Try: ollama serve");
  const data = await response.json();
  return (data.message && data.message.content) || "";
}

/**
 * Unified LLM call — picks provider based on config
 * @param provider "claude" | "ollama"
 * @param systemPrompt
 * @param userMessage
 * @param maxTokens
 * @param modelOverride — for Ollama: model name (e.g. "mistral", "llama3.2")
 */
export async function callLLM(provider, systemPrompt, userMessage, maxTokens, modelOverride) {
  if (provider === "ollama") {
    return callOllama(systemPrompt, userMessage, maxTokens, modelOverride);
  }
  return callClaude(systemPrompt, userMessage, maxTokens);
}
