# Cummins Engine Diagnostic AI

A multi-agent diagnostic assistant for Cummins diesel engines (ISX15, X15, ISB6.7, ISL9, ISC8.3, QSB, QSK). Technicians enter fault codes and symptom notes; a six-agent pipeline driven by an Orchestrator produces root-cause analysis, INSITE-guided repair procedures, parts recommendations, and live warehouse stock availability.

---

## Quick start

### Prerequisites

- Node.js 18+ and npm

### Install and run

```bash
cd engine-diagnostic
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build for production

```bash
npm run build       # outputs to dist/
npm run preview     # serves the production build locally
```

---

## API key setup (online mode)

Copy `.env.txt` to `.env` in the project root and replace the placeholder with your Anthropic API key:

```
VITE_ANTHROPIC_API_KEY=sk-ant-...your-key-here...
```

> **Important:** The key is exposed in the browser bundle because this tool calls the Anthropic API directly from the client. This is intentional for a local/internal tool but is **not safe for public deployment**. Use a backend proxy before any external hosting.

Without an API key the app runs entirely offline — see below.

---

## Online vs offline behaviour

The app detects your internet connection at runtime and switches modes automatically. A status indicator in the top-right header shows **ONLINE** (green) or **OFFLINE** (yellow).

| Agent | Online | Offline |
|-------|--------|---------|
| FaultParser | Claude extracts and validates SPN/FMI codes, engine model, severity | Regex pattern-matches SPN/FMI codes; severity defaults to `medium` |
| Diagnostic | Claude cross-references codes + symptoms for ranked root-cause analysis | Queries the built-in 8-code SPN/FMI knowledge base (`CUMMINS_OFFLINE_KB`) |
| Troubleshoot | Claude generates INSITE-guided procedures with QSOL references | Pulls pre-written steps from the offline KB |
| Parts | Claude recommends Cummins OEM / Recon / Fleetguard parts with pricing | Maps codes to parts via offline KB |
| Warehouse | **Always offline** — queries the local synthetic distribution DB | Same |
| Alternative Parts | Claude suggests exchange programmes and substitutes for out-of-stock items | Falls back to static alternative suggestions from the local DB |

**Offline is fully functional** for the 8 fault codes in the local knowledge base. Unknown codes will return a message directing you to connect INSITE and go online for AI-assisted diagnosis.

### Preset scenarios (no API key needed)

Three ready-made fault scenarios are available on the Input tab — they exercise the offline KB fully and are a good starting point:

- **ISX15 EGR Fault** — SPN 2791 FMI 7
- **DPF Overload** — SPN 3251 FMI 0
- **Low Rail Pressure** — SPN 157 FMI 18

---

## How to run a diagnostic

1. Open the **INPUT DATA** tab.
2. Click an engine platform chip (e.g. `ISX15`) or type it in the Engine Platform field.
3. Fill in Vehicle / Fleet #, Odometer / Hours, and SPN/FMI Fault Codes (e.g. `SPN 2791 FMI 7, SPN 3251 FMI 0`).
4. Add technician observations in the Symptom Notes field.
5. Click **LAUNCH DIAGNOSTIC PIPELINE**.

The app switches to the **AGENT PIPELINE** tab and shows each agent's status in real time (idle → running → done/error). When all six agents complete it automatically navigates to the **DIAGNOSTIC REPORT** tab.

---

## Decision log

After every run, a **Decision Log** table is appended at the bottom of the Diagnostic Report tab (section ⑦). It is visible after the Alternatives section.

Each row captures one agent execution:

| Column | Description |
|--------|-------------|
| RUN ID | Unique ID for the pipeline run (e.g. `RUN-M9KX3A`) |
| CASE ID | Stable hash of fault codes + engine type — same input always produces the same Case ID |
| AGENT | Sub-agent name (`fault-parser`, `diagnostic`, etc.) |
| STARTED AT / ENDED AT | ISO timestamps truncated to the second |
| INPUTS HASH | FNV-style 32-bit hex hash of the agent's input data |
| OUTPUTS HASH | 32-bit hex hash of the agent's output (`00000000` on error) |
| CONFIDENCE | Confidence value from the diagnostic agent; severity label from fault-parser; `N/A` for others |
| MODE | `ONLINE` (green) or `OFFLINE` (amber) badge |
| MODEL | `claude-sonnet-4-20250514` when online; `local-kb` when offline |
| TKN BUDGET | Max-tokens cap passed to Claude for this agent (0 for offline-only agents) |
| TKN CUMUL. | Running total of token budget consumed across all agents so far |
| ERROR | Error message if the agent threw an exception; `—` otherwise |

If a human approval was given during the run (see below), an additional green-highlighted **HUMAN APPROVAL** row appears at the end of the log, recording the approver's name and timestamp.

---

## Human approval gate

Some diagnostic runs automatically trigger a mandatory approval gate before repair actions are shown. This enforces human accountability for safety-critical procedures, warranty-impacting repairs, and high-cost parts authorisation.

### When approval is required

The Risk Classifier (`src/RiskClassifier.js`) fires after the pipeline completes and checks three rule categories:

| Category | Badge | Examples |
|----------|-------|---------|
| **SAFETY** | Red | DPF forced regen (fire risk), turbocharger structural failure, HP fuel system (>2000 bar), CKP sudden-shutdown risk |
| **WARRANTY** | Amber | SCR/DEF EPA emissions compliance, NOx sensor replacement |
| **BILLING** | Blue | EGR valve replacement above $500 threshold |

Any fault classified as high or critical severity also triggers the warranty/safety gate automatically.

### What gets blocked

When approval is required, the **Troubleshoot**, **Parts**, **Warehouse**, and **Alternatives** sections are covered by a 🔒 lock overlay. The FaultParser and Diagnostic results remain fully visible so the technician can review the diagnosis while waiting for approval.

### How to approve

An approval form appears between the Diagnostic and action sections:

1. Review the listed approval triggers.
2. Enter the **Approver Name / Badge ID** (required).
3. Check the **acknowledgment checkbox** confirming you have reviewed the findings and authorise the repair costs.
4. Click **APPROVE & UNLOCK REPAIR ACTIONS**.

The button is disabled until both fields are completed. Once clicked:

- The lock overlay disappears and all action sections become visible.
- The approval gate header turns green showing the approver's name and UTC timestamp.
- A **HUMAN APPROVAL** row is written to the Decision Log with `model_name: human:<name>` and `confidence: APPROVED`.

### Rejecting a run

To reject a diagnostic run (e.g. if more data is needed), enter a **Rejection Reason** (required) and click **REJECT**. The run status is updated in the audit trail and the repair actions remain locked.

---

## Settings bar

A settings bar below the header lets you configure:

| Setting | Options | Purpose |
|---------|---------|---------|
| **LLM** | Claude (API) / Ollama (open-source) | Choose AI backend; Ollama uses local models (Mistral, Llama, Phi) |
| **Tech level** | 1 Junior / 2 Intermediate / 3 Expert | Drives "ASK SENIOR" cues and competency badges on procedures |
| **Cache results** | On/Off | Caches diagnostic results for identical inputs (1hr TTL) to speed repeat runs |

---

## Field vs back-office mode

Toggle **FIELD** / **BACK-OFFICE** in the header to switch views.

- **Field mode** — Full diagnostic workflow (Input → Pipeline → Report).
- **Back-office mode** — Adds an **APPROVAL QUEUE** tab showing runs (pending approval first). Click **View** to load a run and approve or reject it. Supports case handoff from field to back-office for human oversight.

---

## Junior tech safety

Procedures show **LEVEL** badges (1–3) and **ASK SENIOR** when the fault requires a higher competency than the selected tech level. A **SAFETY CHECKLIST** appears for high-risk procedures (fuel system depressurisation, DPF regen, emissions) — complete each item before starting work.

---

## Speed resolution

- **TRY FIRST** — Diagnostic details are sorted by "quick win" score; connector/filter fixes appear first.
- **~Estimated time** — Shows repair time per fault and per procedure.
- **Cache** — Identical inputs return cached results instantly (online only).

---

## Export and audit

- **EXPORT JSON** — Downloads the decision log as JSON for compliance.
- **PRINT / PDF** — Opens a print dialog; use "Save as PDF" for report export.

---

## Orchestrator and agent architecture

The pipeline is coordinated by an Orchestrator (`src/Orchestrator.js`) that owns budget enforcement, decision logging, and escalation rules. The six diagnostic sub-agents are called sequentially under its control.

**Budgets per run:**

| Budget | Default | Purpose |
|--------|---------|---------|
| `maxTokens` | 6000 | Total Claude token budget across all agents |
| `maxSteps` | 6 | Maximum number of sub-agent executions |
| `timeoutMs` | 45 000 ms | Wall-clock timeout for the full pipeline |

**Escalation rules** (in addition to the approval gate):

| Rule | Action |
|------|--------|
| Critical severity fault detected | Flag (annotate, continue) |
| Diagnostic confidence < 50% | Flag |
| Any sub-agent error | Flag |
| Token budget exceeded | **Abort** remaining agents |
| Timeout exceeded | **Abort** |
| Max steps exceeded | **Abort** |

Escalations appear as a banner at the top of the Diagnostic Report tab when any rules fire.

---

## Project structure

```
engine-diagnostic/
├── src/
│   ├── App.jsx            # Main React component and all UI
│   ├── Orchestrator.js    # Main agent — coordinates sub-agents, budgets, decision log
│   ├── RiskClassifier.js  # Risk classification for the human approval gate
│   ├── llmProvider.js     # Configurable LLM backend (Claude API, Ollama)
│   ├── competencyHelper.js # Competency levels, safety checklists, ask-senior cues
│   ├── resultCache.js    # Caches results for identical inputs
│   ├── quickWinHelper.js # Ranks faults by likely quick fix
│   ├── main.jsx           # React entry point
│   └── index.css          # Global styles
├── index.html
├── vite.config.js
├── .env.txt               # Rename to .env and add your API key
└── package.json
```

---

## Ollama (open-source LLM)

To use Ollama instead of Claude, select **Ollama (open-source)** in the settings bar. Install [Ollama](https://ollama.com) and run:

```bash
ollama serve
ollama pull mistral
```

Set `VITE_OLLAMA_URL` in `.env` if Ollama runs on a different host (default: `http://localhost:11434`).

---

## Model and licence notes

- **AI model:** Claude Sonnet (Anthropic) or Mistral/Llama/Phi via Ollama. Select in the settings bar.
- **Direct browser API calls:** This project uses `anthropic-dangerous-direct-browser-access: true` to call the Anthropic API directly from the browser. This header exists specifically for local/demo tools. **Do not deploy this publicly** without moving the API call to a server-side proxy.
- **Synthetic data:** All warehouse locations, part numbers, prices, and stock levels are fabricated for demonstration purposes and do not represent real Cummins inventory.
- **Not a Cummins product:** This tool is an independent demonstration project and is not affiliated with, endorsed by, or supported by Cummins Inc.
- **Anthropic API usage** is subject to the [Anthropic usage policies](https://www.anthropic.com/legal/usage-policy) and your API plan's rate limits and costs.
