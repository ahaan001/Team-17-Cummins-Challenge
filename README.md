# Cummins Engine Diagnostic System

An AI-assisted diagnostic tool for Cummins diesel engines. Enter SPN/FMI fault codes, engine model, and symptoms to receive root cause analysis, step-by-step INSITE repair procedures, Cummins OEM/Recon part recommendations, and local warehouse stock availability — all in one pipeline.

Works fully **offline** using a built-in knowledge base, or **online** with an LLM for deeper multi-code analysis.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19 |
| Build | Vite 7 |
| AI (online) | Mistral 7B Instruct via Ollama (local inference) |
| AI (online fallback) | Mistral 7B Instruct (Ollama REST API) |
| Styling | Inline styles (no CSS framework) |
| Storage | `localStorage` (run queue + audit log) |

No backend. No database server. Runs entirely in the browser.

---

## Getting Started

### 1. Install dependencies

```bash
cd engine-diagnostic
npm install
```

### 2. (Optional) Run Ollama locally

Install [Ollama](https://ollama.com) and pull the Mistral model:

```bash
ollama pull mistral
ollama serve
```

> Without Ollama running the app falls back to **offline mode** — all agents use the local knowledge base.

### 3. Run the dev server

```bash
npm run dev
```

Other commands:

```bash
npm run build      # production build
npm run preview    # preview production build
npm run lint       # ESLint
```

---

## How It Works

### Agent Pipeline

Each diagnostic run passes through six agents in sequence, coordinated by the `Orchestrator`:

```
[Technician Input]
        │
        ▼
  1. FaultParser        — Extracts & validates SPN/FMI codes; enriches with KB data; sorts by severity
        │
        ▼
  2. Diagnostic         — Root cause analysis with confidence scoring; fuzzy KB fallback for unknown codes
        │
        ▼
  3. Troubleshoot       — INSITE-guided step-by-step repair procedures with safety notes and part numbers
        │
        ▼
  4. Parts              — Recommends Cummins OEM, Recon, and Fleetguard parts
        │
        ▼
  5. Warehouse          — Checks local Cummins distribution center stock by distance
        │
        ▼
  6. Alternative        — Suggests Recon exchange programs and alternatives for out-of-stock parts
```

### Online vs Offline Mode

The app detects network connectivity automatically.

| Feature | Online | Offline |
|---|---|---|
| Fault parsing | Mistral via Ollama | Regex + KB lookup |
| Root cause analysis | Mistral via Ollama | Local KB (confidence scored) |
| Repair procedures | Mistral via Ollama | Local KB steps |
| Parts recommendation | Mistral via Ollama | Local KB `partNumbers` |
| Warehouse stock | Local DB | Local DB |
| Alternative parts | Mistral via Ollama + Local DB | Local DB |

### Risk Classifier

Before showing repair procedures or parts, `RiskClassifier.js` evaluates the run for three risk categories:

- **Safety** — e.g. DPF forced regen (fire risk), high-pressure fuel work (2000+ bar)
- **Warranty** — e.g. SCR/DEF system repair (EPA/CARB compliance)
- **Billing** — parts exceeding cost thresholds

If any rules fire, the UI requires a named technician to check an approval box before results are displayed. Every approval is timestamped and written to the decision log.

### Decision Log & Audit Storage

Every agent run produces a structured decision log (agent ID, result summary, escalations, timestamps, mode). Each log entry is written to `localStorage` via `database.js`, which exposes the same API as a SQLite backend but uses the browser's built-in `localStorage` for zero-dependency persistence.

Runs completed while offline are queued in `localStorage` under `cummins_pending_sync`. When connectivity returns, the sync button commits them to the local store.

---

## Source Files

```
engine-diagnostic/src/
├── App.jsx                 Main UI component + all six agent functions + pipeline runner
├── main.jsx                React entry point
├── Orchestrator.js         Runs agents sequentially; enforces token/step/time budgets and escalation rules
├── RiskClassifier.js       Determines if a run needs human approval (safety / warranty / billing)
├── ExpandedKBdatabase.js   Offline knowledge base — SPN/FMI codes with causes, steps, part numbers, estimated times
├── agent_usage.js          KB search utilities and example agent pipeline using the expanded KB
└── database.js             localStorage-backed audit log (initializeDatabase, logDecision, getAllRuns, etc.)
```

### Orchestrator (`Orchestrator.js`)

The Orchestrator drives the six-agent pipeline with configurable budget controls:

- **Default model**: `mistral:7b-instruct` via Ollama (local inference at `http://localhost:11434`)
- **Token budget**: 6,000 tokens across all agents
- **Step budget**: max 6 steps
- **Timeout**: 45 seconds

Escalation rules fire automatically for critical severity faults, low diagnostic confidence, agent errors, or budget overruns.

### Knowledge Base (`ExpandedKBdatabase.js`)

Replaces the original inline `CUMMINS_OFFLINE_KB`. Each entry covers one SPN/FMI code:

```js
"SPN 27 FMI 2": {
  issue: "EGR Valve Position — Data Erratic, Intermittent, Or Incorrect",
  engine: ["ISX15", "ISX12", "ISL9", "ISB6.7"],
  severity: "medium",                  // low | medium | high | critical
  causes: [ /* ordered list */ ],
  steps: [ /* INSITE-guided steps */ ],
  estimatedTime: "2.5 hours",
  partNumbers: { sensor: "4089661", wiring: "Harness assembly per schematic" }
}
```

### KB Search Utilities (`agent_usage.js`)

```js
import { searchKB } from "./agent_usage.js";

searchKB.byEngine("ISB6.7")             // all codes for this engine
searchKB.bySeverity("critical")         // all critical-severity codes
searchKB.bySystem("turbo")             // codes whose issue contains "turbo"
searchKB.bySymptom("wiring")           // codes with "wiring" in any cause
searchKB.byIssueDescription("EGR")    // fuzzy match on issue text or code string
```

`searchKB` is also used internally — when a fault code isn't found in the KB, the Diagnostic agent runs `searchKB.bySymptom()` against the technician's symptom text and surfaces related codes in the result.

### Audit Database (`database.js`)

Persistent audit log backed by `localStorage`. Key functions:

```js
import { initializeDatabase, startDiagnosticRun, endDiagnosticRun, logDecision, getAllRuns, getRunLogs } from './database';

initializeDatabase()                          // call once on app startup
startDiagnosticRun(runId, caseId)            // record run start
endDiagnosticRun(runId, aborted, reason)     // record run end
logDecision(logEntry)                         // write one agent decision entry
getAllRuns(limit)                              // retrieve recent runs
getRunLogs(runId)                             // retrieve all logs for a run
```

---

## Supported Engine Platforms

ISX15 / X15 · ISB6.7 · ISL9 · ISX12 · ISC8.3 · QSB · QSX15 · QSK

---

## Warehouse Locations (Built-in)

| ID | Location | Type | Distance |
|---|---|---|---|
| CDW-001 | Columbus, IN | Primary Distribution Hub | 8 mi |
| CDW-002 | Nashville, TN | Regional Depot | 31 mi |
| CDW-003 | Louisville, KY | Authorized Dealer | 52 mi |
| CDW-004 | Indianapolis, IN | Care Center | 78 mi |
| CDW-005 | Cincinnati, OH | Parts Center | 110 mi |

Results are sorted by distance from the primary hub.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_OLLAMA_URL` | No | Ollama base URL for online Mistral inference. Defaults to `http://localhost:11434`. Without Ollama running the app uses offline-only mode. |

---

## Quick Test Presets

The UI includes three preset scenarios to demo the pipeline without manual input:

- **ISX15 EGR Fault** — `SPN 2791 FMI 7` on a 2019 Kenworth T680 at 387k mi
- **DPF Overload** — `SPN 3251 FMI 0` on a 2020 Freightliner M2 at 94k mi
- **Low Rail Pressure** — `SPN 157 FMI 18` on a 2021 Peterbilt 579 at 210k mi
