import { useState, useRef, useEffect } from "react";
import { Orchestrator } from "./Orchestrator.js";
import { classifyRisk, RISK_CATEGORIES } from "./RiskClassifier.js";

// ─────────────────────────────────────────────────────────────────────────────
// CUMMINS SYNTHETIC WAREHOUSE & PARTS DATABASE
// ─────────────────────────────────────────────────────────────────────────────
const CUMMINS_WAREHOUSE_DB = {
  warehouses: [
    { id: "CDW-001", name: "Cummins Distribution Hub — Columbus", city: "Columbus", state: "IN", phone: "+1-812-377-5000", distance: "8 mi", type: "Primary Distribution" },
    { id: "CDW-002", name: "Cummins Parts Depot — Nashville", city: "Nashville", state: "TN", phone: "+1-615-555-0210", distance: "31 mi", type: "Regional Depot" },
    { id: "CDW-003", name: "Cummins Authorized Dealer — Louisville", city: "Louisville", state: "KY", phone: "+1-502-555-0334", distance: "52 mi", type: "Authorized Dealer" },
    { id: "CDW-004", name: "Cummins Care Center — Indianapolis", city: "Indianapolis", state: "IN", phone: "+1-317-555-0480", distance: "78 mi", type: "Care Center" },
    { id: "CDW-005", name: "Cummins Parts Center — Cincinnati", city: "Cincinnati", state: "OH", phone: "+1-513-555-0521", distance: "110 mi", type: "Parts Center" },
  ],
  parts: {
    // ISX15 / X15 Parts
    "Fuel Injector (ISX15)": [
      { partNum: "4928260", brand: "Cummins OEM", price: "$385.00", engine: "ISX15/X15", wh: ["CDW-001", "CDW-002"], stock: { "CDW-001": 12, "CDW-002": 5 } },
      { partNum: "4928260RX", brand: "Cummins Recon", price: "$265.00", engine: "ISX15/X15 (Remanufactured)", wh: ["CDW-001", "CDW-003"], stock: { "CDW-001": 8, "CDW-003": 3 } },
    ],
    "EGR Valve (ISX15)": [
      { partNum: "4089661", brand: "Cummins OEM", price: "$520.00", engine: "ISX15/X15", wh: ["CDW-001"], stock: { "CDW-001": 4 } },
      { partNum: "4089661RX", brand: "Cummins Recon", price: "$345.00", engine: "ISX15/X15 (Remanufactured)", wh: ["CDW-002", "CDW-004"], stock: { "CDW-002": 2, "CDW-004": 1 } },
    ],
    "DPF Pressure Sensor": [
      { partNum: "4928594", brand: "Cummins OEM", price: "$148.00", engine: "ISX15/ISL9/ISB6.7", wh: ["CDW-001", "CDW-002", "CDW-003"], stock: { "CDW-001": 18, "CDW-002": 11, "CDW-003": 7 } },
    ],
    "NOx Sensor (Upstream)": [
      { partNum: "4326867", brand: "Cummins OEM", price: "$210.00", engine: "ISX15/X15/ISL9", wh: ["CDW-001", "CDW-004"], stock: { "CDW-001": 9, "CDW-004": 4 } },
      { partNum: "4326867AF", brand: "Cummins Fleetguard", price: "$178.00", engine: "ISX15/X15/ISL9", wh: ["CDW-002", "CDW-005"], stock: { "CDW-002": 6, "CDW-005": 3 } },
    ],
    "Turbocharger (ISX15)": [
      { partNum: "3598770RX", brand: "Cummins Recon", price: "$1850.00", engine: "ISX15 (Remanufactured Holset)", wh: ["CDW-001"], stock: { "CDW-001": 2 } },
      { partNum: "3598770", brand: "Cummins OEM Holset", price: "$2450.00", engine: "ISX15 New", wh: ["CDW-001", "CDW-002"], stock: { "CDW-001": 1, "CDW-002": 1 } },
    ],
    // ISB6.7 Parts
    "Fuel Injector (ISB6.7)": [
      { partNum: "4991704", brand: "Cummins OEM", price: "$295.00", engine: "ISB6.7", wh: ["CDW-001", "CDW-002", "CDW-003"], stock: { "CDW-001": 24, "CDW-002": 16, "CDW-003": 8 } },
      { partNum: "4991704RX", brand: "Cummins Recon", price: "$195.00", engine: "ISB6.7 (Remanufactured)", wh: ["CDW-001", "CDW-004"], stock: { "CDW-001": 18, "CDW-004": 6 } },
    ],
    "EGR Cooler (ISB6.7)": [
      { partNum: "4936371", brand: "Cummins OEM", price: "$680.00", engine: "ISB6.7", wh: ["CDW-001", "CDW-002"], stock: { "CDW-001": 5, "CDW-002": 3 } },
    ],
    "Crankshaft Position Sensor": [
      { partNum: "3408523", brand: "Cummins OEM", price: "$68.00", engine: "ISX15/ISB6.7/ISL9", wh: ["CDW-001", "CDW-002", "CDW-003", "CDW-004"], stock: { "CDW-001": 22, "CDW-002": 15, "CDW-003": 9, "CDW-004": 7 } },
    ],
    "Camshaft Position Sensor": [
      { partNum: "3408524", brand: "Cummins OEM", price: "$72.00", engine: "ISX15/ISB6.7/ISL9", wh: ["CDW-001", "CDW-002", "CDW-003"], stock: { "CDW-001": 14, "CDW-002": 10, "CDW-003": 6 } },
    ],
    // ISL9 Parts
    "Fuel Pump (ISL9)": [
      { partNum: "4921431", brand: "Cummins OEM", price: "$1240.00", engine: "ISL9", wh: ["CDW-001"], stock: { "CDW-001": 3 } },
      { partNum: "4921431RX", brand: "Cummins Recon", price: "$875.00", engine: "ISL9 (Remanufactured)", wh: ["CDW-001", "CDW-002"], stock: { "CDW-001": 4, "CDW-002": 2 } },
    ],
    "EGR Valve (ISL9)": [
      { partNum: "4955421", brand: "Cummins OEM", price: "$475.00", engine: "ISL9", wh: ["CDW-002", "CDW-003"], stock: { "CDW-002": 3, "CDW-003": 2 } },
    ],
    // DEF / SCR System
    "DEF Dosing Injector": [
      { partNum: "4326838", brand: "Cummins OEM", price: "$320.00", engine: "ISX15/ISL9/ISB6.7 (SCR)", wh: ["CDW-001", "CDW-002", "CDW-003", "CDW-004"], stock: { "CDW-001": 16, "CDW-002": 12, "CDW-003": 8, "CDW-004": 5 } },
    ],
    "SCR Catalyst": [
      { partNum: "4965013", brand: "Cummins OEM", price: "$2100.00", engine: "ISX15/ISL9 (EPA10+)", wh: ["CDW-001"], stock: { "CDW-001": 2 } },
    ],
    "DPF Filter (ISX15)": [
      { partNum: "4965014", brand: "Cummins OEM", price: "$1650.00", engine: "ISX15", wh: ["CDW-001", "CDW-002"], stock: { "CDW-001": 3, "CDW-002": 1 } },
    ],
    // Fleetguard Filters
    "Fleetguard Fuel Filter Kit": [
      { partNum: "FS1006-FF5488", brand: "Fleetguard", price: "$48.00", engine: "ISX15/ISB6.7/ISL9", wh: ["CDW-001", "CDW-002", "CDW-003", "CDW-004", "CDW-005"], stock: { "CDW-001": 60, "CDW-002": 48, "CDW-003": 36, "CDW-004": 24, "CDW-005": 20 } },
    ],
    "Fleetguard Oil Filter": [
      { partNum: "LF9009", brand: "Fleetguard", price: "$22.00", engine: "ISX15/ISB6.7/ISL9/ISC8.3", wh: ["CDW-001", "CDW-002", "CDW-003", "CDW-004", "CDW-005"], stock: { "CDW-001": 80, "CDW-002": 65, "CDW-003": 50, "CDW-004": 40, "CDW-005": 30 } },
    ],
  },
  alternatives: {
    "3598770RX": ["Contact Cummins Care Center for priority exchange program", "Holset Turbo direct supply — 7-10 business days", "Rebuilt core exchange via CDW-001 depot"],
    "4921431RX": ["Cummins Exchange Program (send core to CDW-001 for rebuild)", "Special order new unit — lead time 5-7 business days"],
    "4089661": ["4089661RX (Recon) — available at CDW-002, CDW-004", "Cummins Care Direct — next-day air freight available"],
    "4965013": ["Contact Cummins Emissions Solutions at 1-800-CUMMINS", "DPF/SCR cleaning service at authorized Cummins Care Centers", "Lease program available for fleet operators"],
    "4965014": ["DPF cleaning service at CDW-003 Louisville (24hr turnaround)", "4965014-REMAN remanufactured core — 3-5 day lead time"],
    "4928260": ["4928260RX Recon available CDW-001, CDW-003", "Bosch heavy duty compatible — verify VIN compatibility first"],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CUMMINS OFFLINE KNOWLEDGE BASE (SPN/FMI Fault Codes)
// ─────────────────────────────────────────────────────────────────────────────
const CUMMINS_OFFLINE_KB = {
  "SPN 651 FMI 5": {
    issue: "Injector Cylinder #1 — Open Circuit",
    engine: ["ISX15", "X15", "ISB6.7"],
    causes: ["Injector solenoid open circuit", "Damaged wiring harness to injector", "Faulty ECM driver circuit", "Corroded injector connector", "Failed fuel injector"],
    steps: [
      "Connect INSITE diagnostic software and confirm fault is active",
      "Perform injector cutout test — monitor RPM drop per cylinder",
      "Measure injector solenoid resistance: nominal 0.5–2.0 ohms",
      "Inspect injector harness connector for corrosion or damage",
      "Check ECM pin voltage for injector #1 driver circuit",
      "Replace injector if resistance is out of spec or solenoid fails",
    ],
    parts: ["Fuel Injector (ISX15)", "Fuel Injector (ISB6.7)"],
    severity: "high",
  },
  "SPN 2791 FMI 7": {
    issue: "EGR Valve — Mechanical Fault / Stuck",
    engine: ["ISX15", "X15", "ISL9"],
    causes: ["Carbon buildup jamming EGR valve", "Failed EGR actuator motor", "EGR cooler restriction", "Damaged valve seat", "Coolant contamination in EGR system"],
    steps: [
      "Use INSITE to command EGR valve through full range — observe actual vs commanded position",
      "Remove EGR valve and inspect for carbon deposits and mechanical binding",
      "Clean EGR valve and passages with approved carbon cleaner (Cummins #3824483)",
      "Inspect EGR cooler for internal leaks or blockage — perform pressure test",
      "Check EGR actuator motor resistance: nominal 8–15 ohms",
      "Replace EGR valve if actuator fails or valve is mechanically damaged",
    ],
    parts: ["EGR Valve (ISX15)", "EGR Valve (ISL9)"],
    severity: "high",
  },
  "SPN 3364 FMI 18": {
    issue: "Aftertreatment DEF Dosing — Rate Below Normal",
    engine: ["ISX15", "ISL9", "ISB6.7"],
    causes: ["Clogged DEF dosing injector", "DEF quality below spec (contaminated)", "Low DEF tank level", "DEF pump pressure fault", "Frozen DEF supply line (cold weather)"],
    steps: [
      "Check DEF tank level — minimum 10% required for dosing",
      "Test DEF quality using refractometer — urea concentration must be 31.8–33.2%",
      "Perform DEF dosing injector purge cycle via INSITE",
      "Inspect DEF supply line and strainer for blockage or ice",
      "Check DEF pump output pressure: nominal 80–130 PSI",
      "Replace DEF dosing injector if purge cycle fails to restore flow",
    ],
    parts: ["DEF Dosing Injector"],
    severity: "medium",
  },
  "SPN 3251 FMI 0": {
    issue: "DPF Differential Pressure — High (Soot Overloaded)",
    engine: ["ISX15", "ISB6.7", "ISL9"],
    causes: ["DPF soot accumulation above threshold", "Failed active regen due to low exhaust temp", "Restricted DPF pressure sensor port", "Short-haul duty cycle (insufficient regen temps)", "Oil consumption contaminating DPF"],
    steps: [
      "Check INSITE for soot load % — above 100% requires forced regen",
      "Perform parked forced regeneration via INSITE (engine must reach >550°C DPF inlet)",
      "Inspect DPF differential pressure sensor and ports for blockage",
      "Review duty cycle — frequent short trips prevent passive regen",
      "Check engine oil consumption — excessive blow-by contaminates DPF",
      "If forced regen fails to reduce soot below 70%, remove DPF for cleaning or replacement",
    ],
    parts: ["DPF Pressure Sensor", "DPF Filter (ISX15)"],
    severity: "critical",
  },
  "SPN 636 FMI 2": {
    issue: "Crankshaft Position Sensor — Erratic Signal",
    engine: ["ISX15", "ISB6.7", "ISL9", "ISC8.3"],
    causes: ["Damaged or worn CKP sensor", "Crankshaft reluctor ring damage", "Air gap out of specification", "Wiring harness chafing near sensor", "Electromagnetic interference from accessories"],
    steps: [
      "Inspect CKP sensor and mounting for physical damage",
      "Measure air gap between sensor and reluctor ring: nominal 0.5–1.5 mm",
      "Check sensor output voltage with scope — look for missing or erratic pulses",
      "Inspect wiring harness routing for chafing against engine block",
      "Measure sensor resistance: nominal 900–1100 ohms for magnetic pickup type",
      "Inspect reluctor ring for missing or damaged teeth",
      "Replace CKP sensor and re-check air gap",
    ],
    parts: ["Crankshaft Position Sensor"],
    severity: "high",
  },
  "SPN 641 FMI 5": {
    issue: "Variable Geometry Turbocharger (VGT) Actuator — Open Circuit",
    engine: ["ISX15", "X15"],
    causes: ["Failed VGT actuator solenoid", "Open circuit in actuator wiring", "Corroded actuator connector", "ECM driver circuit fault", "Mechanical jam in VGT vanes"],
    steps: [
      "Use INSITE to command VGT actuator — observe actual vs commanded vane position",
      "Measure actuator solenoid resistance: nominal 5–12 ohms",
      "Inspect actuator wiring and connector for corrosion or damage",
      "Perform VGT vane movement test — vanes should move freely through full range",
      "Check for carbon buildup on VGT vanes — clean with approved solvent if needed",
      "Replace turbocharger assembly if actuator or vane mechanism is mechanically failed",
    ],
    parts: ["Turbocharger (ISX15)"],
    severity: "high",
  },
  "SPN 3216 FMI 18": {
    issue: "NOx Sensor (Upstream) — Signal Below Normal Range",
    engine: ["ISX15", "X15", "ISL9"],
    causes: ["Failed upstream NOx sensor", "NOx sensor heater circuit fault", "Contaminated sensor element (oil/coolant)", "Wiring harness damage", "Poor ECM ground connection"],
    steps: [
      "Allow engine to reach full operating temperature — NOx sensor requires heat to activate",
      "Check sensor heater circuit resistance: nominal 3–10 ohms",
      "Inspect sensor connector and wiring harness for damage or moisture",
      "Verify ECM ground integrity — resistance to chassis ground must be <0.5 ohm",
      "Use INSITE live data to monitor NOx sensor output vs engine load",
      "Replace NOx sensor if output is flat or erratic under varying engine load",
    ],
    parts: ["NOx Sensor (Upstream)"],
    severity: "medium",
  },
  "SPN 157 FMI 18": {
    issue: "Fuel Rail Pressure — Below Normal (Low Rail Pressure)",
    engine: ["ISX15", "ISB6.7", "ISL9"],
    causes: ["Restricted fuel supply (clogged filter)", "Worn fuel pump", "Leaking fuel injector return", "Low lift pump pressure", "Aerated fuel supply"],
    steps: [
      "Check Fleetguard primary and secondary fuel filter condition — replace if overdue",
      "Measure lift pump supply pressure: nominal 8–15 PSI",
      "Monitor fuel rail pressure via INSITE — should reach >1800 bar at full load on ISX15",
      "Check fuel return restriction — measure back-pressure at tank return port",
      "Inspect HP fuel pump drive gear for wear",
      "Replace fuel filter kit first — most common root cause of low rail pressure",
    ],
    parts: ["Fleetguard Fuel Filter Kit", "Fuel Pump (ISL9)"],
    severity: "high",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// AGENT DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
const AGENTS = [
  { id: "fault-parser", name: "FaultParser Agent", icon: "⚙️", color: "#E31837", role: "Parses Cummins SPN/FMI fault codes and technician input data" },
  { id: "diagnostic", name: "Diagnostic Agent", icon: "🔬", color: "#C41230", role: "Analyzes Cummins engine faults and generates root cause hypothesis" },
  { id: "troubleshoot", name: "Troubleshoot Agent", icon: "🔧", color: "#FF6B35", role: "Generates INSITE-guided step-by-step repair procedures" },
  { id: "parts", name: "Parts Agent", icon: "🔩", color: "#FFA500", role: "Recommends Cummins OEM, Recon and Fleetguard replacement parts" },
  { id: "warehouse", name: "Warehouse Agent", icon: "🏭", color: "#FFD700", role: "Locates nearest Cummins distribution center with required stock" },
  { id: "alternative", name: "Alternative Parts Agent", icon: "🔄", color: "#FF8C00", role: "Suggests Cummins Recon, exchange programs and alternatives" },
];

const AGENT_DESCRIPTIONS = {
  "fault-parser": "Parses raw technician input to extract and validate Cummins SPN/FMI fault codes, engine model (ISX15, ISB6.7, ISL9, etc.), vehicle/equipment info, and odometer/hours. Assigns a severity level and identifies the affected system. Works offline by pattern-matching standard Cummins diagnostic codes.",
  "diagnostic": "The core Cummins diagnostic engine. Cross-references SPN/FMI codes with engine symptoms, operating hours, engine model, and duty cycle to generate a ranked list of probable root causes. Online: uses Claude AI for Cummins-specific multi-code correlation. Offline: queries the built-in Cummins local knowledge base.",
  "troubleshoot": "Generates INSITE diagnostic software-guided, numbered repair procedures specific to Cummins engines. Includes required Cummins service tools (INSITE, Inline 7 adapter), safety warnings per Cummins service literature, and step-by-step instructions. Designed for Cummins-certified technicians.",
  "parts": "Recommends Cummins OEM, Cummins Recon (remanufactured), and Fleetguard replacement parts with part numbers, pricing, and compatibility. Prioritizes Cummins-genuine parts to maintain warranty and Cummins Care coverage. Flags parts eligible for core exchange programs.",
  "warehouse": "Queries the Cummins distribution database — including Cummins Distribution Hubs, Parts Depots, Authorized Dealers, and Care Centers — to find which locations stock required parts, unit pricing, and contact numbers. Runs entirely on local data — fully offline capable.",
  "alternative": "When Cummins OEM parts are out of stock, suggests Cummins Recon exchange units, Fleetguard alternatives, Cummins Care expedited freight options, and authorized rebuild programs. Prioritizes genuine Cummins alternatives to protect engine warranty and ESC coverage.",
};

const PIPELINE_LABELS = [
  "Input to Structured Data",
  "Structured Data to Root Causes",
  "Root Causes to Procedures",
  "Root Causes to Parts List",
  "Parts List to Stock Info",
  "Parts List to Alternatives",
];

const PRESETS = [
  { label: "ISX15 EGR Fault", codes: "SPN 2791 FMI 7", eng: "ISX15 EPA13", sym: "Engine derate to 60% power, black smoke at medium load, elevated EGT, fault active since yesterday", model: "2019 Kenworth T680 — 387,000 mi", mi: "387,000 mi" },
  { label: "DPF Overload", codes: "SPN 3251 FMI 0", eng: "ISB6.7 EPA10", sym: "Regen lamp on solid, power loss, operator reporting short urban routes only, no regen completed in 3 days", model: "2020 Freightliner M2 106 — 94,000 mi", mi: "94,000 mi" },
  { label: "Low Rail Pressure", codes: "SPN 157 FMI 18", eng: "ISL9 EPA17", sym: "Hard start, rough idle, low power at highway speed, fuel filters last changed 8 months ago", model: "2021 Peterbilt 579 — 210,000 mi", mi: "210,000 mi" },
];

// ─────────────────────────────────────────────────────────────────────────────
// CLAUDE API CALL
// ─────────────────────────────────────────────────────────────────────────────
async function callClaude(systemPrompt, userMessage, maxTokens) {
  var tokens = maxTokens || 800;
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
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
  if (!response.ok) throw new Error("API error " + response.status);
  const data = await response.json();
  return data.content.map(function(b) { return b.text || ""; }).join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// AGENT FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────
export default function CumminsDiagnosticSystem() {
  const [engineType, setEngineType] = useState("");
  const [faultCodes, setFaultCodes] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [mileage, setMileage] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [running, setRunning] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);
  const [agentResults, setAgentResults] = useState({});
  const [agentStatus, setAgentStatus] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [tab, setTab] = useState("input");
  const [decisionLog, setDecisionLog] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [approval, setApproval] = useState({ required: false, reasons: [], approved: false, approverName: "", approverChecked: false, timestamp: null });
  const [runMeta, setRunMeta] = useState(null);          // { runId, caseId, runAt, mode }
  const [pendingSync, setPendingSync] = useState([]);    // offline runs queued for reconciliation
  const [syncMessage, setSyncMessage] = useState(null);  // transient confirmation banner
  const resultsRef = useRef(null);

  useEffect(function() {
    function goUp() { setIsOnline(true); }
    function goDn() { setIsOnline(false); }
    window.addEventListener("online", goUp);
    window.addEventListener("offline", goDn);
    return function() {
      window.removeEventListener("online", goUp);
      window.removeEventListener("offline", goDn);
    };
  }, []);

  // Bootstrap pending-sync queue from localStorage on first mount
  useEffect(function() {
    try {
      var stored = localStorage.getItem("cummins_pending_sync");
      if (stored) setPendingSync(JSON.parse(stored));
    } catch(e) {}
  }, []);

  async function runFaultParserAgent(input) {
    var spnFmiPattern = /SPN\s*\d+\s*FMI\s*\d+/gi;
    var codes = (input.faultCodes.toUpperCase().match(spnFmiPattern) || []).map(function(c) { return c.replace(/\s+/g, " ").trim(); });
    if (!isOnline) {
      return { codes: codes, engineType: input.engineType, vehicle: input.vehicleModel, mileage: input.mileage, rawSymptoms: input.symptoms, severity: "medium" };
    }
    try {
      var raw = await callClaude(
        "You are a Cummins FaultParser Agent. Extract and validate all Cummins SPN/FMI fault codes, engine model (ISX15, X15, ISB6.7, ISL9, ISC8.3, QSB, QSK etc.), vehicle/equipment info, and hours/mileage from technician input. Return valid JSON only with no markdown fences.",
        "Engine: " + input.engineType + "\nVehicle/Equipment: " + input.vehicleModel + "\nMileage/Hours: " + input.mileage + "\nFault Codes: " + input.faultCodes + "\nSymptoms: " + input.symptoms + "\n\nReturn JSON: { \"codes\": [], \"engineType\": \"\", \"vehicle\": \"\", \"mileage\": \"\", \"rawSymptoms\": \"\", \"severity\": \"low|medium|high|critical\", \"affectedSystem\": \"\" }"
      );
      return JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch(e) {
      return { codes: codes, engineType: input.engineType, vehicle: input.vehicleModel, mileage: input.mileage, rawSymptoms: input.symptoms, severity: "medium", affectedSystem: "Unknown" };
    }
  }

  async function runDiagnosticAgent(parsed) {
    var details = (parsed.codes || []).map(function(code) {
      var kb = CUMMINS_OFFLINE_KB[code];
      if (kb) return { code: code, issue: kb.issue, causes: kb.causes, confidence: "88%", severity: kb.severity, engines: kb.engine };
      return { code: code, issue: "Fault not in offline Cummins KB — connect online for AI diagnosis", causes: ["Refer to Cummins QSOL service literature", "Connect to internet for AI-assisted diagnosis"], confidence: "N/A", severity: "unknown", engines: [] };
    });
    if (!isOnline) {
      return { summary: details.length > 0 ? "Found " + details.length + " fault pattern(s) in Cummins local knowledge base." : "No matching Cummins codes found offline. Connect INSITE and go online for full diagnosis.", details: details };
    }
    try {
      var raw = await callClaude(
        "You are a Cummins Diagnostic Agent with deep expertise in ISX15, X15, ISB6.7, ISL9, ISC8.3, QSB and QSK engine platforms. Analyze SPN/FMI fault codes and symptoms to identify root causes with confidence scores. Reference Cummins QSOL service procedures. Return valid JSON only with no markdown fences.",
        "Parsed fault data: " + JSON.stringify(parsed) + "\n\nReturn JSON: { \"summary\": \"\", \"details\": [{ \"code\": \"\", \"issue\": \"\", \"causes\": [], \"confidence\": \"\", \"severity\": \"\", \"affectedSystem\": \"\" }] }",
        1000
      );
      return JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch(e) {
      return { summary: "AI parse error — showing Cummins local KB results.", details: details };
    }
  }

  async function runTroubleshootAgent(parsed, diagnostic) {
    var procedures = (parsed.codes || []).map(function(code) {
      var kb = CUMMINS_OFFLINE_KB[code];
      if (kb) {
        return { code: code, title: kb.issue, tools: ["Cummins INSITE 8.x", "Inline 7 or 8 Adapter", "Fluke 87V Multimeter", "Cummins Fuel Pressure Test Kit 3824581"], safetyNote: "Depressurize fuel system before working on high-pressure components. Rail pressure can exceed 2000 bar on common rail engines.", steps: kb.steps };
      }
      return { code: code, title: "General Cummins Inspection", tools: ["Cummins INSITE", "Inline 7 Adapter"], safetyNote: "Refer to Cummins QSOL for engine-specific torque specs and safety procedures.", steps: ["Connect INSITE and confirm fault codes active vs inactive", "Review fault code snapshot data for conditions at time of fault", "Perform applicable INSITE diagnostic tests for fault code", "Consult QSOL service manual for engine-specific procedure", "Contact Cummins Technical Assistance if root cause not identified"] };
    });
    if (!procedures.length) {
      procedures = [{ code: "GENERAL", title: "General Cummins Procedure", tools: ["Cummins INSITE", "Inline 7 Adapter"], safetyNote: "", steps: ["Connect INSITE and document all active and inactive faults", "Review engine snapshot data", "Consult Cummins QSOL for fault-specific procedures", "Contact Cummins Technical Assistance Center: 1-800-CUMMINS"] }];
    }
    if (!isOnline) {
      return { procedures: procedures };
    }
    try {
      var raw = await callClaude(
        "You are a Cummins Master Technician. Generate detailed Cummins INSITE-guided step-by-step repair procedures for each SPN/FMI fault. Include Cummins-specific service tools, QSOL references, and safety warnings per Cummins service literature. Return valid JSON only with no markdown fences.",
        "Vehicle: " + parsed.vehicle + ", Engine: " + parsed.engineType + ", Mileage/Hours: " + parsed.mileage + "\nDiagnosis: " + JSON.stringify(diagnostic) + "\n\nReturn JSON: { \"procedures\": [{ \"code\": \"\", \"title\": \"\", \"tools\": [], \"safetyNote\": \"\", \"qsolRef\": \"\", \"steps\": [] }] }",
        1200
      );
      return JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch(e) {
      return { procedures: procedures };
    }
  }

  async function runPartsAgent(parsed, diagnostic) {
    var parts = [];
    (parsed.codes || []).forEach(function(code) {
      var kb = CUMMINS_OFFLINE_KB[code];
      if (kb) {
        kb.parts.forEach(function(partName) {
          if (!parts.find(function(p) { return p.partName === partName; })) {
            parts.push({ partName: partName, reason: "Required for " + code + " — " + kb.issue, priority: kb.severity === "critical" ? "immediate" : kb.severity === "high" ? "immediate" : "soon", estimatedCost: "See warehouse", oem: "Cummins Genuine OEM", aftermarket: "Cummins Recon / Fleetguard" });
          }
        });
      }
    });
    if (!parts.length) {
      parts = [{ partName: "Refer to Cummins QSOL parts catalog", reason: "No offline parts data for these codes", priority: "unknown", estimatedCost: "—", oem: "—", aftermarket: "—" }];
    }
    if (!isOnline) {
      return { parts: parts };
    }
    try {
      var raw = await callClaude(
        "You are a Cummins Parts Specialist. Recommend Cummins OEM, Cummins Recon (remanufactured), and Fleetguard replacement parts with genuine Cummins part numbers where possible. Prioritize Cummins-genuine parts. Return valid JSON only with no markdown fences.",
        "Diagnosis: " + JSON.stringify(diagnostic) + "\nEngine: " + parsed.engineType + ", Vehicle: " + parsed.vehicle + "\n\nReturn JSON: { \"parts\": [{ \"partName\": \"\", \"reason\": \"\", \"priority\": \"immediate|soon|preventive\", \"estimatedCost\": \"$\", \"oem\": \"\", \"aftermarket\": \"\", \"coreExchange\": true|false }] }",
        800
      );
      var result = JSON.parse(raw.replace(/```json|```/g, "").trim());
      result.parts = (result.parts || []).map(function(p) {
        return Object.assign({}, p, { warehouseOptions: CUMMINS_WAREHOUSE_DB.parts[p.partName] || [] });
      });
      return result;
    } catch(e) {
      return { parts: parts };
    }
  }

  async function runWarehouseAgent(partsResult) {
    var availability = [];
    (partsResult.parts || []).forEach(function(partInfo) {
      var dbOptions = CUMMINS_WAREHOUSE_DB.parts[partInfo.partName] || [];
      dbOptions.forEach(function(opt) {
        opt.wh.forEach(function(whId) {
          var wh = CUMMINS_WAREHOUSE_DB.warehouses.find(function(w) { return w.id === whId; });
          if (wh) {
            availability.push({ partName: partInfo.partName, partNum: opt.partNum, brand: opt.brand, engine: opt.engine, price: opt.price, warehouse: wh, stock: opt.stock[whId] || 0 });
          }
        });
      });
    });
    availability.sort(function(a, b) { return parseFloat(a.warehouse.distance) - parseFloat(b.warehouse.distance); });
    return { availability: availability, checkedAt: new Date().toLocaleTimeString() };
  }

  async function runAlternativeAgent(partsResult, warehouseResult) {
    var outOfStock = (partsResult.parts || []).filter(function(p) {
      return !(warehouseResult.availability || []).some(function(a) { return a.partName === p.partName && a.stock > 0; });
    });
    var alternatives = {};
    outOfStock.forEach(function(p) {
      var opts = CUMMINS_WAREHOUSE_DB.parts[p.partName] || [];
      var altKeys = [];
      opts.forEach(function(o) {
        var alts = CUMMINS_WAREHOUSE_DB.alternatives[o.partNum] || [];
        alts.forEach(function(a) { altKeys.push(a); });
      });
      alternatives[p.partName] = altKeys.length ? altKeys : [
        "Contact Cummins Care Direct: 1-800-CUMMINS for expedited freight",
        "Check Cummins QuickServe Online (QSOL) parts cross-reference",
        "Cummins ReCon Exchange Program — send core for priority rebuild",
        "Contact nearest Cummins Authorized Dealer for emergency sourcing",
      ];
    });
    if (isOnline && outOfStock.length > 0) {
      try {
        var raw = await callClaude(
          "You are a Cummins Alternative Parts Agent and procurement specialist. For out-of-stock Cummins parts, suggest Cummins ReCon units, Fleetguard alternatives, Cummins Care programs, and cross-reference options. Prioritize genuine Cummins alternatives. Return valid JSON only with no markdown fences.",
          "Out of stock Cummins parts: " + JSON.stringify(outOfStock) + "\n\nReturn JSON: { \"suggestions\": { \"partName\": { \"alternatives\": [], \"cumminsPrograms\": [] } } }",
          600
        );
        var ai = JSON.parse(raw.replace(/```json|```/g, "").trim());
        Object.keys(ai.suggestions || {}).forEach(function(k) {
          var aiAlts = (ai.suggestions[k] && ai.suggestions[k].alternatives) ? ai.suggestions[k].alternatives : [];
          alternatives[k] = (alternatives[k] || []).concat(aiAlts);
        });
      } catch(e) {}
    }
    return { outOfStock: outOfStock.map(function(p) { return p.partName; }), alternatives: alternatives };
  }

  // ── Export decision log as a downloadable JSON file ────────────────────────
  function exportDecisionLog() {
    var data = {
      exportedAt:  new Date().toISOString(),
      runId:       runMeta ? runMeta.runId  : null,
      caseId:      runMeta ? runMeta.caseId : null,
      runAt:       runMeta ? runMeta.runAt  : null,
      mode:        runMeta ? runMeta.mode   : null,
      log:         decisionLog,
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement("a");
    a.href     = url;
    a.download = "cummins-audit-" + (runMeta ? runMeta.runId : "export") + ".json";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Reconcile queued offline runs → mark synced in localStorage ────────────
  function syncPendingRuns() {
    var count = pendingSync.length;
    if (count === 0) return;
    pendingSync.forEach(function(run) {
      try {
        localStorage.setItem(
          "cummins_run_" + run.runId,
          JSON.stringify(Object.assign({}, run, { synced: true }))
        );
      } catch(e) {}
    });
    setPendingSync([]);
    try { localStorage.removeItem("cummins_pending_sync"); } catch(e) {}
    setSyncMessage("✓ " + count + " offline run" + (count !== 1 ? "s" : "") + " committed to local store");
    setTimeout(function() { setSyncMessage(null); }, 4000);
  }

  async function runDiagnosticPipeline() {
    if (!engineType && !faultCodes && !symptoms) return;
    setRunning(true);
    setShowResults(false);
    setAgentResults({});
    setAgentStatus({});
    setDecisionLog([]);
    setEscalations([]);
    setApproval({ required: false, reasons: [], approved: false, approverName: "", approverChecked: false, timestamp: null });
    setRunMeta(null);
    setTab("pipeline");

    var input = { engineType: engineType, faultCodes: faultCodes, symptoms: symptoms, mileage: mileage, vehicleModel: vehicleModel };

    // Sub-agent definitions — fn receives the accumulated results map.
    // tokenBudget is the max_tokens passed to Claude for that agent; the
    // Orchestrator tracks these toward the overall maxTokens budget.
    var agentDefs = [
      { id: "fault-parser",  tokenBudget: 800,  fn: function()  { return runFaultParserAgent(input); } },
      { id: "diagnostic",    tokenBudget: 1000, fn: function(r) { return runDiagnosticAgent(r["fault-parser"]); } },
      { id: "troubleshoot",  tokenBudget: 1200, fn: function(r) { return runTroubleshootAgent(r["fault-parser"], r["diagnostic"]); } },
      { id: "parts",         tokenBudget: 800,  fn: function(r) { return runPartsAgent(r["fault-parser"], r["diagnostic"]); } },
      { id: "warehouse",     tokenBudget: 0,    fn: function(r) { return runWarehouseAgent(r["parts"]); } },
      { id: "alternative",   tokenBudget: 600,  fn: function(r) { return runAlternativeAgent(r["parts"], r["warehouse"]); } },
    ];

    // localLog accumulates synchronously alongside the React state updates so we
    // have a stable snapshot to persist to localStorage once the run finishes.
    var localLog = [];

    var orch = new Orchestrator({
      maxTokens:   6000,   // sum of all agent tokenBudgets is 4400 — 6000 gives headroom
      maxSteps:    6,
      timeoutMs:   45000,
      stepDelayMs: 450,
      isOnline:    isOnline,
      onAgentStart: function(agentId, stepIndex) {
        setCurrentStep(stepIndex);
        setActiveAgent(agentId);
        setAgentStatus(function(s) { return Object.assign({}, s, { [agentId]: "running" }); });
      },
      onAgentComplete: function(agentId, result, errorMsg) {
        setAgentResults(function(r) { return Object.assign({}, r, { [agentId]: result }); });
        setAgentStatus(function(s) { return Object.assign({}, s, { [agentId]: errorMsg ? "error" : "done" }); });
      },
      onLogEntry: function(entry) {
        localLog.push(entry);
        setDecisionLog(function(l) { return l.concat([entry]); });
      },
      onEscalation: function(esc) {
        setEscalations(function(e) { return e.concat([esc]); });
      },
    });

    var orchResult = await orch.run(input, agentDefs);

    // ── Persist run record ──────────────────────────────────────────────────
    var runAt = new Date().toISOString();
    var runMode = isOnline ? "online" : "offline";
    setRunMeta({ runId: orchResult.runId, caseId: orchResult.caseId, runAt: runAt, mode: runMode });
    var runRecord = {
      runId:    orchResult.runId,
      caseId:   orchResult.caseId,
      runAt:    runAt,
      mode:     runMode,
      input:    { engineType: engineType, faultCodes: faultCodes, symptoms: symptoms, mileage: mileage, vehicleModel: vehicleModel },
      log:      localLog,
      synced:   isOnline,
    };
    try { localStorage.setItem("cummins_run_" + orchResult.runId, JSON.stringify(runRecord)); } catch(e) {}
    if (!isOnline) {
      var newQueue = pendingSync.concat([runRecord]);
      setPendingSync(newQueue);
      try { localStorage.setItem("cummins_pending_sync", JSON.stringify(newQueue)); } catch(e) {}
    }

    // Risk classification — runs after all agents complete. Uses fault-parser
    // severity + code list and diagnostic findings to decide whether a human
    // approver must sign off before repair actions are shown.
    var riskResult = classifyRisk(
      orchResult.results["fault-parser"],
      orchResult.results["diagnostic"]
    );
    if (riskResult.requiresApproval) {
      setApproval(function(a) { return Object.assign({}, a, { required: true, reasons: riskResult.reasons }); });
    }

    setActiveAgent(null);
    setRunning(false);
    setShowResults(true);
    setTab("results");
    setTimeout(function() { if (resultsRef.current) { resultsRef.current.scrollIntoView({ behavior: "smooth" }); } }, 200);
  }

  function handleApprove() {
    var ts = new Date().toISOString();
    var name = approval.approverName.trim();
    setApproval(function(a) { return Object.assign({}, a, { approved: true, timestamp: ts }); });
    // Write a human-approval row into the decision log so the audit trail is
    // complete — every approval is timestamped and attributed to a named person.
    var firstEntry = decisionLog[0] || {};
    setDecisionLog(function(l) {
      return l.concat([{
        type:                   "approval",
        run_id:                 firstEntry.run_id  || "—",
        case_id:                firstEntry.case_id || "—",
        agent_name:             "human-approval",
        started_at:             ts,
        ended_at:               ts,
        inputs_hash:            "—",
        outputs_hash:           "—",
        confidence:             "APPROVED",
        mode:                   "human",
        model_name:             "human:" + name,
        token_budget:           0,
        tokens_used_cumulative: "—",
      }]);
    });
  }

  var statusColor = { running: "#E31837", done: "#00C853", error: "#FF1744", idle: "#444" };
  var statusIcon = { running: "◉", done: "✓", error: "✗", idle: "○" };

  var baseInput = {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(227,24,55,0.25)",
    borderRadius: 6,
    padding: "12px 14px",
    color: "#f0f0f0",
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: 14,
  };

  var baseLabel = {
    display: "block",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 10,
    color: "#E31837",
    letterSpacing: 2,
    marginBottom: 7,
    textTransform: "uppercase",
  };

  function SectionHeader(props) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, marginTop: 26 }}>
        <div style={{ width: 3, height: 20, background: props.color, borderRadius: 2 }} />
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: props.color, fontSize: 11, letterSpacing: 3, textTransform: "uppercase" }}>{props.children}</span>
      </div>
    );
  }

  function Card(props) {
    return (
      <div style={Object.assign({ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: 16, marginBottom: 12 }, props.style || {})}>
        {props.children}
      </div>
    );
  }

  function Badge(props) {
    return (
      <span style={{ padding: "3px 10px", background: props.bg || "rgba(227,24,55,0.12)", border: "1px solid " + (props.border || "rgba(227,24,55,0.35)"), borderRadius: 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: props.color || "#E31837" }}>
        {props.children}
      </span>
    );
  }

  var severityStyle = {
    critical: { bg: "rgba(255,23,68,0.15)", border: "rgba(255,23,68,0.5)", color: "#FF1744" },
    high: { bg: "rgba(227,24,55,0.12)", border: "rgba(227,24,55,0.4)", color: "#E31837" },
    medium: { bg: "rgba(255,165,0,0.1)", border: "rgba(255,165,0,0.35)", color: "#FFA500" },
    low: { bg: "rgba(0,200,83,0.08)", border: "rgba(0,200,83,0.3)", color: "#00C853" },
    immediate: { bg: "rgba(255,23,68,0.15)", border: "rgba(255,23,68,0.5)", color: "#FF1744" },
    soon: { bg: "rgba(255,165,0,0.1)", border: "rgba(255,165,0,0.35)", color: "#FFA500" },
    preventive: { bg: "rgba(0,200,83,0.08)", border: "rgba(0,200,83,0.3)", color: "#00C853" },
  };

  return (
    <>
      <style>{[
        "@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Sans+Condensed:wght@600;700&display=swap');",
        "* { box-sizing: border-box; margin: 0; padding: 0; }",
        "::-webkit-scrollbar { width: 4px; }",
        "::-webkit-scrollbar-track { background: #0d0d0d; }",
        "::-webkit-scrollbar-thumb { background: #E31837; border-radius: 2px; }",
        "@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }",
        "@keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }",
        "@keyframes glow { 0%,100% { box-shadow: 0 0 4px rgba(227,24,55,0.25); } 50% { box-shadow: 0 0 18px rgba(227,24,55,0.65); } }",
        "@keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(400%); } }",
        ".agent-running { animation: glow 1.1s ease-in-out infinite; }",
        ".fade-in { animation: slideIn 0.35s ease forwards; }",
        "input:focus, textarea:focus { border-color: rgba(227,24,55,0.6) !important; outline: none; }",
        "textarea { resize: vertical; }",
        "button:hover { opacity: 0.88; }",
      ].join(" ")}</style>

      <div style={{ minHeight: "100vh", background: "#0d0d0d", color: "#e8e8e8", fontFamily: "'IBM Plex Sans', sans-serif" }}>

        {/* Background subtle grid */}
        <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(227,24,55,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(227,24,55,0.025) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none", zIndex: 0 }} />

        {/* TOP HEADER BAR */}
        <div style={{ background: "#E31837", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 48, position: "sticky", top: 0, zIndex: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Cummins wordmark style */}
            <div style={{ fontFamily: "'IBM Plex Sans Condensed', sans-serif", fontWeight: 700, fontSize: 22, color: "#fff", letterSpacing: 3, textTransform: "uppercase" }}>CUMMINS</div>
            <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.3)" }} />
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.85)", letterSpacing: 2 }}>ENGINE DIAGNOSTIC AI</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.7)" }}>MULTI-AGENT SYSTEM v1.0</div>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.3)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: isOnline ? "#00E676" : "#FFD600", animation: "pulse 2s infinite" }} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#fff" }}>{isOnline ? "ONLINE" : "OFFLINE"}</span>
            </div>
            {pendingSync.length > 0 ? (
              <>
                <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.3)" }} />
                <button
                  onClick={syncPendingRuns}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,165,0,0.18)", border: "1px solid rgba(255,165,0,0.5)", borderRadius: 4, padding: "4px 12px", cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#FFA500" }}
                >
                  <span style={{ animation: "pulse 1.4s infinite" }}>●</span>
                  PENDING SYNC: {pendingSync.length} · SYNC NOW
                </button>
              </>
            ) : null}
            {syncMessage ? (
              <>
                <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.3)" }} />
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#00E676" }}>{syncMessage}</span>
              </>
            ) : null}
          </div>
        </div>

        {/* SECONDARY NAV */}
        <div style={{ background: "#161616", borderBottom: "1px solid rgba(227,24,55,0.2)", padding: "0 24px", display: "flex", alignItems: "center", gap: 0, position: "sticky", top: 48, zIndex: 199 }}>
          {[
            { id: "input", label: "INPUT DATA" },
            { id: "pipeline", label: "AGENT PIPELINE" },
            { id: "results", label: "DIAGNOSTIC REPORT" },
            { id: "agents", label: "AGENT GUIDE" },
          ].map(function(t) {
            return (
              <button
                key={t.id}
                onClick={function() { setTab(t.id); }}
                style={{ padding: "14px 20px", background: "transparent", border: "none", borderBottom: tab === t.id ? "2px solid #E31837" : "2px solid transparent", color: tab === t.id ? "#E31837" : "#666", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 11, cursor: "pointer", letterSpacing: 2, transition: "all 0.2s", marginBottom: -1 }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 24px", position: "relative", zIndex: 1 }}>

          {/* ── INPUT TAB ── */}
          {tab === "input" && (
            <div className="fade-in">
              {/* Engine selector chips */}
              <div style={{ marginBottom: 24, padding: "14px 18px", background: "rgba(227,24,55,0.05)", border: "1px solid rgba(227,24,55,0.15)", borderRadius: 8 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#E31837", letterSpacing: 2, marginBottom: 10 }}>SUPPORTED CUMMINS PLATFORMS</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["ISX15", "X15 Efficiency", "X15 Performance", "ISB6.7", "ISL9", "ISC8.3", "ISX12", "QSB6.7", "QSK19", "QSX15"].map(function(eng) {
                    return (
                      <span key={eng} style={{ padding: "4px 12px", background: engineType === eng ? "#E31837" : "rgba(255,255,255,0.05)", border: "1px solid " + (engineType === eng ? "#E31837" : "rgba(255,255,255,0.1)"), borderRadius: 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: engineType === eng ? "#fff" : "#888", cursor: "pointer", transition: "all 0.15s" }} onClick={function() { setEngineType(eng); }}>
                        {eng}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={baseLabel}>Vehicle / Equipment / Fleet #</label>
                  <input value={vehicleModel} onChange={function(e) { setVehicleModel(e.target.value); }} placeholder="e.g. 2021 Kenworth T680 — Unit #4412" style={baseInput} />
                </div>
                <div>
                  <label style={baseLabel}>Engine Platform</label>
                  <input value={engineType} onChange={function(e) { setEngineType(e.target.value); }} placeholder="e.g. ISX15 EPA13 — S/N 79387652" style={baseInput} />
                </div>
                <div>
                  <label style={baseLabel}>Odometer / Engine Hours</label>
                  <input value={mileage} onChange={function(e) { setMileage(e.target.value); }} placeholder="e.g. 412,000 mi / 18,400 hrs" style={baseInput} />
                </div>
                <div>
                  <label style={baseLabel}>SPN / FMI Fault Codes</label>
                  <input value={faultCodes} onChange={function(e) { setFaultCodes(e.target.value); }} placeholder="e.g. SPN 2791 FMI 7, SPN 3251 FMI 0" style={baseInput} />
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={baseLabel}>Technician Observations / Symptom Notes</label>
                <textarea
                  value={symptoms}
                  onChange={function(e) { setSymptoms(e.target.value); }}
                  placeholder="Describe: power derate level (%), smoke color, when fault occurs (cold start / under load / at idle), recent service history, INSITE snapshot notes, ambient conditions, regen history..."
                  rows={5}
                  style={baseInput}
                />
              </div>

              {/* Quick Presets */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 10 }}>COMMON FAULT SCENARIOS</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                  {PRESETS.map(function(p) {
                    return (
                      <button
                        key={p.label}
                        onClick={function() { setFaultCodes(p.codes); setEngineType(p.eng); setSymptoms(p.sym); setVehicleModel(p.model); setMileage(p.mi); }}
                        style={{ padding: "12px 16px", background: "rgba(227,24,55,0.06)", border: "1px solid rgba(227,24,55,0.2)", borderRadius: 8, color: "#e8e8e8", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}
                      >
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#E31837", marginBottom: 4, letterSpacing: 1 }}>{p.codes}</div>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>{p.label}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>{p.eng} · {p.mi}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={runDiagnosticPipeline}
                disabled={running}
                style={{ width: "100%", padding: "16px 0", background: running ? "rgba(227,24,55,0.15)" : "#E31837", border: "none", borderRadius: 8, color: "#fff", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 14, letterSpacing: 3, cursor: running ? "not-allowed" : "pointer", textTransform: "uppercase", transition: "all 0.3s", boxShadow: running ? "none" : "0 4px 20px rgba(227,24,55,0.4)" }}
              >
                {running ? "◉  AGENTS RUNNING..." : "▶  LAUNCH DIAGNOSTIC PIPELINE"}
              </button>
            </div>
          )}

          {/* ── PIPELINE TAB ── */}
          {tab === "pipeline" && (
            <div className="fade-in">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
                {AGENTS.map(function(agent) {
                  var status = agentStatus[agent.id] || "idle";
                  var isActive = activeAgent === agent.id;
                  return (
                    <div
                      key={agent.id}
                      className={isActive ? "agent-running" : ""}
                      style={{ background: "#161616", border: "1px solid " + (isActive ? agent.color : status === "done" ? "rgba(0,200,83,0.35)" : status === "error" ? "rgba(255,23,68,0.35)" : "rgba(255,255,255,0.06)"), borderRadius: 8, padding: 18, transition: "all 0.3s" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                        <div style={{ width: 40, height: 40, background: agent.color + "18", border: "1px solid " + agent.color + "44", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{agent.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "'IBM Plex Sans Condensed', sans-serif", fontWeight: 700, fontSize: 14, color: agent.color, letterSpacing: 0.5 }}>{agent.name}</div>
                          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: statusColor[status] }}>
                            {statusIcon[status]} {status.toUpperCase()}
                            {isActive ? <span style={{ animation: "pulse 0.8s infinite" }}> ◌</span> : null}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: "#777", lineHeight: 1.55 }}>{agent.role}</div>
                      {agentResults[agent.id] && !agentResults[agent.id].error ? (
                        <div style={{ marginTop: 10, padding: "5px 10px", background: "rgba(0,200,83,0.07)", borderRadius: 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#00C853" }}>✓ Result captured</div>
                      ) : null}
                      {agentResults[agent.id] && agentResults[agent.id].error ? (
                        <div style={{ marginTop: 10, padding: "5px 10px", background: "rgba(255,23,68,0.07)", borderRadius: 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#FF1744" }}>✗ {agentResults[agent.id].error}</div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {running ? (
                <div style={{ marginTop: 20, padding: "14px 20px", background: "rgba(227,24,55,0.06)", border: "1px solid rgba(227,24,55,0.2)", borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#E31837", animation: "pulse 1.4s infinite" }}>
                    ◉ EXECUTING — AGENT {currentStep + 1} OF {AGENTS.length} : {AGENTS[currentStep] ? AGENTS[currentStep].name : ""}
                  </div>
                </div>
              ) : null}

              {showResults ? (
                <button
                  onClick={function() { setTab("results"); }}
                  style={{ marginTop: 16, width: "100%", padding: 14, background: "#E31837", border: "none", borderRadius: 8, color: "#fff", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 13, letterSpacing: 3, cursor: "pointer" }}
                >
                  VIEW DIAGNOSTIC REPORT →
                </button>
              ) : null}
            </div>
          )}

          {/* ── RESULTS TAB ── */}
          {tab === "results" && (
            <div className="fade-in" ref={resultsRef}>
              {!showResults ? (
                <div style={{ textAlign: "center", padding: 80, color: "#555" }}>
                  <div style={{ fontFamily: "'IBM Plex Sans Condensed', sans-serif", fontSize: 20, marginBottom: 8, color: "#444" }}>NO DIAGNOSTIC DATA</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#333" }}>Go to Input Data tab and launch the pipeline to generate a report</div>
                </div>
              ) : (
                <div>

                  {/* RUN IDENTITY PANEL */}
                  {runMeta ? (
                    <div style={{ display: "flex", gap: 16, marginBottom: 20, padding: "12px 20px", background: "rgba(79,195,247,0.05)", border: "1px solid rgba(79,195,247,0.18)", borderRadius: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#4FC3F7", letterSpacing: 2, marginBottom: 3 }}>RUN ID</div>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "#e8e8e8", letterSpacing: 1 }}>{runMeta.runId}</div>
                      </div>
                      <div style={{ width: 1, height: 30, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
                      <div>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#4FC3F7", letterSpacing: 2, marginBottom: 3 }}>CASE ID</div>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "#e8e8e8", letterSpacing: 1 }}>{runMeta.caseId}</div>
                      </div>
                      <div style={{ width: 1, height: 30, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
                      <div>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#4FC3F7", letterSpacing: 2, marginBottom: 3 }}>RUN AT</div>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "#e8e8e8" }}>{runMeta.runAt.replace("T", " ").split(".")[0]} UTC</div>
                      </div>
                      <div style={{ width: 1, height: 30, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
                      <div>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#4FC3F7", letterSpacing: 2, marginBottom: 3 }}>MODE</div>
                        <span style={{ padding: "2px 8px", background: runMeta.mode === "online" ? "rgba(0,200,83,0.1)" : "rgba(255,165,0,0.1)", border: "1px solid " + (runMeta.mode === "online" ? "rgba(0,200,83,0.3)" : "rgba(255,165,0,0.3)"), borderRadius: 3, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: runMeta.mode === "online" ? "#00C853" : "#FFA500" }}>{(runMeta.mode || "").toUpperCase()}</span>
                      </div>
                      <div style={{ marginLeft: "auto" }}>
                        <span style={{ padding: "3px 10px", background: runMeta.synced !== false ? "rgba(0,200,83,0.07)" : "rgba(255,165,0,0.07)", border: "1px solid " + (runMeta.synced !== false ? "rgba(0,200,83,0.2)" : "rgba(255,165,0,0.2)"), borderRadius: 3, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: runMeta.synced !== false ? "#00C853" : "#FFA500" }}>
                          {runMeta.mode === "online" ? "✓ Saved" : "⚠ Offline — queued for sync"}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {/* ORCHESTRATOR ESCALATION BANNER */}
                  {escalations.length > 0 ? (
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, marginTop: 4 }}>
                        <div style={{ width: 3, height: 20, background: "#FF6B35", borderRadius: 2 }} />
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#FF6B35", fontSize: 11, letterSpacing: 3, textTransform: "uppercase" }}>Orchestrator Escalations</span>
                        <span style={{ marginLeft: "auto", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#555" }}>{escalations.length} rule{escalations.length !== 1 ? "s" : ""} fired</span>
                      </div>
                      {escalations.map(function(esc, i) {
                        var isAbort = esc.action === "abort";
                        var bg     = isAbort ? "rgba(255,23,68,0.07)"   : "rgba(255,165,0,0.05)";
                        var border = isAbort ? "rgba(255,23,68,0.35)"   : "rgba(255,165,0,0.3)";
                        var clr    = isAbort ? "#FF1744"                : "#FFA500";
                        return (
                          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 16px", marginBottom: 8, background: bg, border: "1px solid " + border, borderRadius: 8 }}>
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color: clr, marginTop: 1 }}>{isAbort ? "✗" : "⚠"}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                                <span style={{ padding: "2px 8px", background: isAbort ? "rgba(255,23,68,0.15)" : "rgba(255,165,0,0.12)", border: "1px solid " + border, borderRadius: 3, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: clr }}>{esc.action.toUpperCase()}</span>
                                <span style={{ padding: "2px 8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#E31837" }}>{esc.ruleId}</span>
                                {esc.agentId && esc.agentId !== "__budget__" ? (
                                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#555" }}>agent: {esc.agentId}</span>
                                ) : null}
                                <span style={{ marginLeft: "auto", fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#444" }}>{esc.timestamp ? esc.timestamp.replace("T", " ").split(".")[0] : ""}</span>
                              </div>
                              <div style={{ fontSize: 13, color: isAbort ? "#FF7070" : "#FFBE6A", lineHeight: 1.5 }}>{esc.message}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {/* FAULT PARSER */}
                  {agentResults["fault-parser"] ? (
                    <div>
                      <SectionHeader color="#E31837">① FaultParser Agent — Parsed Input</SectionHeader>
                      <Card>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10, marginBottom: 14 }}>
                          {[
                            { label: "Vehicle / Fleet", val: agentResults["fault-parser"].vehicle || vehicleModel || "—" },
                            { label: "Engine Platform", val: agentResults["fault-parser"].engineType || engineType || "—" },
                            { label: "Odometer / Hours", val: agentResults["fault-parser"].mileage || mileage || "—" },
                            { label: "Severity", val: agentResults["fault-parser"].severity || "—" },
                            { label: "Affected System", val: agentResults["fault-parser"].affectedSystem || "—" },
                          ].map(function(f) {
                            return (
                              <div key={f.label} style={{ background: "rgba(227,24,55,0.05)", border: "1px solid rgba(227,24,55,0.12)", borderRadius: 6, padding: "10px 14px" }}>
                                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#E31837", letterSpacing: 2, marginBottom: 4 }}>{f.label.toUpperCase()}</div>
                                <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: 13 }}>{f.val}</div>
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 8 }}>EXTRACTED FAULT CODES</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {(agentResults["fault-parser"].codes || []).map(function(c) {
                            return (
                              <span key={c} style={{ padding: "5px 14px", background: "rgba(227,24,55,0.12)", border: "1px solid rgba(227,24,55,0.4)", borderRadius: 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#E31837", letterSpacing: 1 }}>{c}</span>
                            );
                          })}
                        </div>
                      </Card>
                    </div>
                  ) : null}

                  {/* DIAGNOSTIC */}
                  {agentResults["diagnostic"] ? (
                    <div>
                      <SectionHeader color="#C41230">② Diagnostic Agent — Root Cause Analysis</SectionHeader>
                      <Card>
                        <p style={{ color: "#aaa", fontSize: 14, marginBottom: 16, lineHeight: 1.65, fontStyle: "italic" }}>{agentResults["diagnostic"].summary}</p>
                        {(agentResults["diagnostic"].details || []).map(function(d, i) {
                          var sv = severityStyle[d.severity] || severityStyle["medium"];
                          return (
                            <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                                <span style={{ padding: "3px 12px", background: sv.bg, border: "1px solid " + sv.border, borderRadius: 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: sv.color }}>{d.code}</span>
                                <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: 15 }}>{d.issue}</span>
                                {d.confidence ? <span style={{ marginLeft: "auto", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#666", background: "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: 4 }}>CONFIDENCE: {d.confidence}</span> : null}
                                {d.severity ? <span style={{ padding: "2px 8px", background: sv.bg, borderRadius: 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: sv.color }}>{(d.severity || "").toUpperCase()}</span> : null}
                              </div>
                              {d.engines && d.engines.length > 0 ? (
                                <div style={{ marginBottom: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                                  {d.engines.map(function(eng, j) {
                                    return <span key={j} style={{ padding: "2px 8px", background: "rgba(255,255,255,0.04)", borderRadius: 3, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#888" }}>{eng}</span>;
                                  })}
                                </div>
                              ) : null}
                              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#555", letterSpacing: 2, marginBottom: 8 }}>PROBABLE ROOT CAUSES</div>
                              <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                                {(d.causes || []).map(function(c, j) {
                                  return (
                                    <li key={j} style={{ display: "flex", gap: 10, fontSize: 13, color: "#ccc", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                      <span style={{ color: "#E31837", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, marginTop: 1 }}>{"0" + (j + 1)}</span>
                                      {c}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          );
                        })}
                      </Card>
                    </div>
                  ) : null}

                  {/* ── APPROVAL GATE ──────────────────────────────────────── */}
                  {approval.required ? (
                    <div style={{ margin: "8px 0 24px", border: "2px solid " + (approval.approved ? "rgba(0,200,83,0.4)" : "rgba(255,193,7,0.45)"), borderRadius: 10, overflow: "hidden" }}>

                      {/* Header */}
                      <div style={{ background: approval.approved ? "rgba(0,200,83,0.08)" : "rgba(255,193,7,0.1)", padding: "14px 22px", display: "flex", alignItems: "center", gap: 14 }}>
                        <span style={{ fontSize: 22 }}>{approval.approved ? "✅" : "🔐"}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "'IBM Plex Sans Condensed', sans-serif", fontWeight: 700, fontSize: 17, color: approval.approved ? "#00C853" : "#FFC107" }}>
                            {approval.approved ? "APPROVED — REPAIR ACTIONS UNLOCKED" : "HUMAN APPROVAL REQUIRED"}
                          </div>
                          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#777", marginTop: 3 }}>
                            {approval.approved
                              ? "Approved by " + approval.approverName + "  ·  " + (approval.timestamp || "").replace("T", " ").split(".")[0] + " UTC"
                              : "Repair procedures and parts ordering are locked. A qualified approver must sign off before proceeding."}
                          </div>
                        </div>
                        {approval.approved ? (
                          <span style={{ padding: "4px 14px", background: "rgba(0,200,83,0.12)", border: "1px solid rgba(0,200,83,0.4)", borderRadius: 6, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#00C853", whiteSpace: "nowrap" }}>✓ LOGGED</span>
                        ) : null}
                      </div>

                      {!approval.approved ? (
                        <div style={{ padding: "22px 24px" }}>

                          {/* Risk reasons */}
                          <div style={{ marginBottom: 22 }}>
                            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: 2, color: "#555", marginBottom: 10 }}>APPROVAL TRIGGERS</div>
                            {approval.reasons.map(function(r, i) {
                              var cat = RISK_CATEGORIES[r.category] || { label: r.category.toUpperCase(), color: "#888", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)" };
                              return (
                                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                  <span style={{ padding: "2px 8px", background: cat.bg, border: "1px solid " + cat.border, borderRadius: 3, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: cat.color, whiteSpace: "nowrap", marginTop: 2, letterSpacing: 1 }}>{cat.label}</span>
                                  <span style={{ fontSize: 13, color: "#ccc", lineHeight: 1.6 }}>{r.text}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Approver form */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <div>
                              <label style={{ display: "block", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#FFC107", letterSpacing: 2, marginBottom: 8 }}>APPROVER NAME / BADGE ID (REQUIRED)</label>
                              <input
                                value={approval.approverName}
                                onChange={function(e) { setApproval(function(a) { return Object.assign({}, a, { approverName: e.target.value }); }); }}
                                placeholder="e.g. Jane Smith — Shop Foreman #4412"
                                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,193,7,0.35)", borderRadius: 6, padding: "11px 14px", color: "#f0f0f0", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14 }}
                              />
                            </div>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8 }}>
                              <input
                                type="checkbox"
                                id="approval-check"
                                checked={approval.approverChecked}
                                onChange={function(e) { setApproval(function(a) { return Object.assign({}, a, { approverChecked: e.target.checked }); }); }}
                                style={{ width: 16, height: 16, marginTop: 3, cursor: "pointer", accentColor: "#FFC107", flexShrink: 0 }}
                              />
                              <label htmlFor="approval-check" style={{ fontSize: 13, color: "#ccc", lineHeight: 1.65, cursor: "pointer" }}>
                                I have reviewed the diagnostic findings and risk classifications above. I authorize the recommended repair procedures, parts procurement, and associated labour and parts costs for this vehicle/engine.
                              </label>
                            </div>
                            <button
                              disabled={!approval.approverName.trim() || !approval.approverChecked}
                              onClick={handleApprove}
                              style={{ padding: "14px", background: (!approval.approverName.trim() || !approval.approverChecked) ? "rgba(255,193,7,0.08)" : "#FFC107", border: "1px solid rgba(255,193,7,0.4)", borderRadius: 8, color: (!approval.approverName.trim() || !approval.approverChecked) ? "#555" : "#000", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 13, letterSpacing: 2, cursor: (!approval.approverName.trim() || !approval.approverChecked) ? "not-allowed" : "pointer", transition: "all 0.2s" }}
                            >
                              {(!approval.approverName.trim() || !approval.approverChecked) ? "ENTER APPROVER NAME AND CHECK ACKNOWLEDGMENT TO UNLOCK" : "✓  APPROVE & UNLOCK REPAIR ACTIONS"}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {/* ── ACTION SECTIONS ─────────────────────────────────────── */}
                  {/* Troubleshoot, Parts, Warehouse, Alternatives are repair   */}
                  {/* actions — blurred behind a lock overlay until approved    */}
                  <div style={{ position: "relative", minHeight: approval.required && !approval.approved ? 240 : "auto" }}>
                    {approval.required && !approval.approved ? (
                      <div style={{ position: "absolute", inset: 0, zIndex: 10, background: "rgba(13,13,13,0.92)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 6, pointerEvents: "all" }}>
                        <div style={{ fontSize: 38 }}>🔒</div>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#FFC107", letterSpacing: 2 }}>REPAIR ACTIONS LOCKED</div>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#444" }}>Complete the approval gate above to unlock</div>
                      </div>
                    ) : null}

                  {/* TROUBLESHOOT */}
                  {agentResults["troubleshoot"] ? (
                    <div>
                      <SectionHeader color="#FF6B35">③ Troubleshoot Agent — INSITE-Guided Repair Procedures</SectionHeader>
                      {(agentResults["troubleshoot"].procedures || []).map(function(proc, i) {
                        return (
                          <Card key={i}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                              <span style={{ padding: "3px 12px", background: "rgba(255,107,53,0.12)", border: "1px solid rgba(255,107,53,0.35)", borderRadius: 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#FF6B35" }}>{proc.code}</span>
                              <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: 15 }}>{proc.title || "Repair Procedure"}</span>
                              {proc.qsolRef ? <span style={{ marginLeft: "auto", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#666" }}>QSOL: {proc.qsolRef}</span> : null}
                            </div>
                            {proc.safetyNote ? (
                              <div style={{ background: "rgba(255,193,7,0.07)", border: "1px solid rgba(255,193,7,0.25)", borderRadius: 6, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#FFC107", lineHeight: 1.5 }}>
                                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: 1 }}>⚠ SAFETY — </span>{proc.safetyNote}
                              </div>
                            ) : null}
                            {proc.tools && proc.tools.length > 0 ? (
                              <div style={{ marginBottom: 14 }}>
                                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#555", letterSpacing: 2, marginBottom: 8 }}>REQUIRED SERVICE TOOLS</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                  {proc.tools.map(function(t, j) {
                                    return <span key={j} style={{ padding: "4px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, fontSize: 12, color: "#aaa", fontFamily: "'IBM Plex Mono', monospace" }}>🔧 {t}</span>;
                                  })}
                                </div>
                              </div>
                            ) : null}
                            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#555", letterSpacing: 2, marginBottom: 10 }}>PROCEDURE STEPS</div>
                            <ol style={{ paddingLeft: 0, listStyle: "none" }}>
                              {(proc.steps || []).map(function(s, j) {
                                return (
                                  <li key={j} style={{ display: "flex", gap: 14, padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 13, color: "#ccc", lineHeight: 1.6 }}>
                                    <span style={{ width: 26, height: 26, minWidth: 26, background: "rgba(255,107,53,0.12)", border: "1px solid rgba(255,107,53,0.25)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#FF6B35", marginTop: 1 }}>{j + 1}</span>
                                    {String(s).replace(/^\d+\.\s*/, "")}
                                  </li>
                                );
                              })}
                            </ol>
                          </Card>
                        );
                      })}
                    </div>
                  ) : null}

                  {/* PARTS */}
                  {agentResults["parts"] ? (
                    <div>
                      <SectionHeader color="#FFA500">④ Parts Agent — Cummins Replacement Parts</SectionHeader>
                      {(agentResults["parts"].parts || []).map(function(p, i) {
                        var pv = severityStyle[p.priority] || { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", color: "#888" };
                        return (
                          <Card key={i}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: 16, color: "#FFA500" }}>🔩 {p.partName}</div>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {p.priority ? (
                                  <span style={{ padding: "3px 10px", background: pv.bg, border: "1px solid " + pv.border, borderRadius: 4, fontSize: 10, color: pv.color, fontFamily: "'IBM Plex Mono', monospace" }}>{p.priority.toUpperCase()}</span>
                                ) : null}
                                {p.coreExchange ? (
                                  <span style={{ padding: "3px 10px", background: "rgba(0,200,83,0.08)", border: "1px solid rgba(0,200,83,0.3)", borderRadius: 4, fontSize: 10, color: "#00C853", fontFamily: "'IBM Plex Mono', monospace" }}>CORE EXCHANGE</span>
                                ) : null}
                                {p.estimatedCost && p.estimatedCost !== "See warehouse" ? (
                                  <span style={{ padding: "3px 10px", background: "rgba(255,165,0,0.08)", border: "1px solid rgba(255,165,0,0.25)", borderRadius: 4, fontSize: 10, color: "#FFA500", fontFamily: "'IBM Plex Mono', monospace" }}>{p.estimatedCost}</span>
                                ) : null}
                              </div>
                            </div>
                            {p.reason ? <p style={{ fontSize: 13, color: "#888", marginBottom: 12, lineHeight: 1.5 }}>{p.reason}</p> : null}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                              {p.oem ? (
                                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "10px 14px" }}>
                                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#E31837", letterSpacing: 2, marginBottom: 4 }}>CUMMINS OEM</div>
                                  <div style={{ fontSize: 13 }}>{p.oem}</div>
                                </div>
                              ) : null}
                              {p.aftermarket ? (
                                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "10px 14px" }}>
                                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#FFA500", letterSpacing: 2, marginBottom: 4 }}>RECON / FLEETGUARD</div>
                                  <div style={{ fontSize: 13 }}>{p.aftermarket}</div>
                                </div>
                              ) : null}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  ) : null}

                  {/* WAREHOUSE */}
                  {agentResults["warehouse"] ? (
                    <div>
                      <SectionHeader color="#FFD700">⑤ Warehouse Agent — Cummins Distribution Availability</SectionHeader>
                      <Card>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#555", marginBottom: 14 }}>Inventory checked at: {agentResults["warehouse"].checkedAt}</div>
                        {(!agentResults["warehouse"].availability || agentResults["warehouse"].availability.length === 0) ? (
                          <div style={{ color: "#FF1744", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: "10px 0" }}>⚠ No matching Cummins parts found in distribution database</div>
                        ) : (
                          <div style={{ display: "grid", gap: 10 }}>
                            {agentResults["warehouse"].availability.map(function(a, i) {
                              return (
                                <div key={i} style={{ display: "flex", alignItems: "stretch", gap: 0, background: "rgba(255,215,0,0.03)", border: "1px solid rgba(255,215,0,0.1)", borderRadius: 8, overflow: "hidden", flexWrap: "wrap" }}>
                                  <div style={{ borderLeft: "3px solid " + (a.stock > 10 ? "#00C853" : a.stock > 0 ? "#FFA500" : "#FF1744"), padding: "14px 16px", flex: 1, minWidth: 220 }}>
                                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#FFD700", marginBottom: 4 }}>{a.partNum}</div>
                                    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{a.partName}</div>
                                    <div style={{ fontSize: 12, color: "#888" }}>{a.brand} · {a.engine}</div>
                                  </div>
                                  <div style={{ padding: "14px 16px", flex: 2, minWidth: 240, background: "rgba(255,255,255,0.02)" }}>
                                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#555", marginBottom: 6, letterSpacing: 1 }}>{a.warehouse.type.toUpperCase()}</div>
                                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>🏭 {a.warehouse.name}</div>
                                    <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>{a.warehouse.city}, {a.warehouse.state} · {a.warehouse.distance}</div>
                                    <div style={{ fontSize: 12, color: "#4FC3F7" }}>📞 {a.warehouse.phone}</div>
                                  </div>
                                  <div style={{ padding: "14px 20px", display: "flex", gap: 24, alignItems: "center", background: "rgba(255,255,255,0.02)" }}>
                                    <div style={{ textAlign: "center" }}>
                                      <div style={{ fontFamily: "'IBM Plex Sans Condensed', sans-serif", fontWeight: 700, fontSize: 20, color: "#FFD700" }}>{a.price}</div>
                                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#555" }}>UNIT PRICE</div>
                                    </div>
                                    <div style={{ textAlign: "center" }}>
                                      <div style={{ fontFamily: "'IBM Plex Sans Condensed', sans-serif", fontWeight: 700, fontSize: 20, color: a.stock > 10 ? "#00C853" : a.stock > 0 ? "#FFA500" : "#FF1744" }}>{a.stock}</div>
                                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#555" }}>IN STOCK</div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </Card>
                    </div>
                  ) : null}

                  {/* ALTERNATIVES */}
                  {agentResults["alternative"] ? (
                    <div>
                      <SectionHeader color="#FF8C00">⑥ Alternative Parts Agent — Cummins Exchange Programs</SectionHeader>
                      {(!agentResults["alternative"].outOfStock || agentResults["alternative"].outOfStock.length === 0) ? (
                        <Card>
                          <div style={{ color: "#00C853", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>✓ All required Cummins parts are in stock at distribution centers — no alternatives needed</div>
                        </Card>
                      ) : (
                        Object.keys(agentResults["alternative"].alternatives || {}).map(function(part, i) {
                          var alts = agentResults["alternative"].alternatives[part] || [];
                          return (
                            <Card key={i}>
                              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: 15, color: "#FF8C00", marginBottom: 12 }}>🔄 Alternatives for: {part}</div>
                              <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                                {alts.map(function(a, j) {
                                  return (
                                    <li key={j} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 13, color: "#ccc", lineHeight: 1.5 }}>
                                      <span style={{ color: "#FF8C00", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, marginTop: 2 }}>{"0" + (j + 1)}</span>
                                      {a}
                                    </li>
                                  );
                                })}
                              </ul>
                            </Card>
                          );
                        })
                      )}
                    </div>
                  ) : null}

                  </div>{/* /ACTION SECTIONS */}

                  {/* DECISION LOG */}
                  {decisionLog.length > 0 ? (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, marginTop: 26 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 3, height: 20, background: "#4FC3F7", borderRadius: 2 }} />
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#4FC3F7", fontSize: 11, letterSpacing: 3, textTransform: "uppercase" }}>⑦ Decision Log — Agent Execution Audit Trail</span>
                        </div>
                        <button
                          onClick={exportDecisionLog}
                          style={{ padding: "6px 16px", background: "rgba(79,195,247,0.08)", border: "1px solid rgba(79,195,247,0.3)", borderRadius: 5, color: "#4FC3F7", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: 2, cursor: "pointer" }}
                        >
                          ⬇ EXPORT JSON
                        </button>
                      </div>
                      <Card>
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
                            <thead>
                              <tr>
                                {["RUN ID", "CASE ID", "AGENT", "STARTED AT", "ENDED AT", "INPUTS HASH", "OUTPUTS HASH", "CONFIDENCE", "MODE", "MODEL", "TKN BUDGET", "TKN CUMUL.", "ERROR"].map(function(h) {
                                  return (
                                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", borderBottom: "1px solid rgba(79,195,247,0.25)", color: "#4FC3F7", fontSize: 9, letterSpacing: 2, whiteSpace: "nowrap" }}>{h}</th>
                                  );
                                })}
                              </tr>
                            </thead>
                            <tbody>
                              {decisionLog.map(function(entry, i) {
                                var isApproval = entry.type === "approval";
                                if (isApproval) {
                                  return (
                                    <tr key={i} style={{ background: "rgba(0,200,83,0.07)", borderBottom: "1px solid rgba(0,200,83,0.15)", borderTop: "1px solid rgba(0,200,83,0.15)" }}>
                                      <td style={{ padding: "8px 12px", color: "#00C853", whiteSpace: "nowrap" }}>{entry.run_id}</td>
                                      <td style={{ padding: "8px 12px", color: "#00C853", whiteSpace: "nowrap" }}>{entry.case_id}</td>
                                      <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                                        <span style={{ padding: "3px 10px", background: "rgba(0,200,83,0.15)", border: "1px solid rgba(0,200,83,0.4)", borderRadius: 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#00C853", letterSpacing: 1 }}>✓ HUMAN APPROVAL</span>
                                      </td>
                                      <td style={{ padding: "8px 12px", color: "#00C853", whiteSpace: "nowrap" }}>{entry.started_at.replace("T", " ").split(".")[0]}</td>
                                      <td style={{ padding: "8px 12px", color: "#555" }}>—</td>
                                      <td style={{ padding: "8px 12px", color: "#555" }}>—</td>
                                      <td style={{ padding: "8px 12px", color: "#555" }}>—</td>
                                      <td style={{ padding: "8px 12px" }}>
                                        <span style={{ padding: "2px 8px", background: "rgba(0,200,83,0.1)", border: "1px solid rgba(0,200,83,0.3)", borderRadius: 3, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#00C853" }}>APPROVED</span>
                                      </td>
                                      <td style={{ padding: "8px 12px" }}>
                                        <span style={{ padding: "2px 8px", background: "rgba(0,200,83,0.08)", border: "1px solid rgba(0,200,83,0.2)", borderRadius: 3, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#00C853" }}>HUMAN</span>
                                      </td>
                                      <td colSpan={4} style={{ padding: "8px 12px", color: "#00C853", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>{entry.model_name}</td>
                                    </tr>
                                  );
                                }
                                return (
                                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent" }}>
                                    <td style={{ padding: "8px 12px", color: "#4FC3F7", whiteSpace: "nowrap" }}>{entry.run_id}</td>
                                    <td style={{ padding: "8px 12px", color: "#888", whiteSpace: "nowrap" }}>{entry.case_id}</td>
                                    <td style={{ padding: "8px 12px", color: "#E31837", whiteSpace: "nowrap" }}>{entry.agent_name}</td>
                                    <td style={{ padding: "8px 12px", color: "#666", whiteSpace: "nowrap" }}>{entry.started_at.replace("T", " ").split(".")[0]}</td>
                                    <td style={{ padding: "8px 12px", color: "#666", whiteSpace: "nowrap" }}>{entry.ended_at.replace("T", " ").split(".")[0]}</td>
                                    <td style={{ padding: "8px 12px", color: "#00C853", fontFamily: "'IBM Plex Mono', monospace" }}>{entry.inputs_hash}</td>
                                    <td style={{ padding: "8px 12px", color: "#00C853", fontFamily: "'IBM Plex Mono', monospace" }}>{entry.outputs_hash}</td>
                                    <td style={{ padding: "8px 12px", color: "#FFA500" }}>{entry.confidence}</td>
                                    <td style={{ padding: "8px 12px" }}>
                                      <span style={{ padding: "2px 8px", background: entry.mode === "online" ? "rgba(0,200,83,0.1)" : "rgba(255,165,0,0.1)", border: "1px solid " + (entry.mode === "online" ? "rgba(0,200,83,0.3)" : "rgba(255,165,0,0.3)"), borderRadius: 3, color: entry.mode === "online" ? "#00C853" : "#FFA500", fontSize: 10 }}>
                                        {entry.mode.toUpperCase()}
                                      </span>
                                    </td>
                                    <td style={{ padding: "8px 12px", color: "#666", whiteSpace: "nowrap" }}>{entry.model_name}</td>
                                    <td style={{ padding: "8px 12px", color: "#4FC3F7", textAlign: "right" }}>{entry.token_budget != null ? entry.token_budget : "—"}</td>
                                    <td style={{ padding: "8px 12px", color: "#4FC3F7", textAlign: "right" }}>{entry.tokens_used_cumulative != null ? entry.tokens_used_cumulative : "—"}</td>
                                    <td style={{ padding: "8px 12px", color: "#FF1744" }}>{entry.error || "—"}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    </div>
                  ) : null}

                </div>
              )}
            </div>
          )}

          {/* ── AGENT GUIDE TAB ── */}
          {tab === "agents" && (
            <div className="fade-in">
              <div style={{ marginBottom: 24, padding: "16px 20px", background: "rgba(227,24,55,0.05)", border: "1px solid rgba(227,24,55,0.15)", borderRadius: 8 }}>
                <div style={{ fontFamily: "'IBM Plex Sans Condensed', sans-serif", fontWeight: 700, fontSize: 17, color: "#E31837", marginBottom: 8, letterSpacing: 0.5 }}>Cummins Multi-Agent Diagnostic Architecture</div>
                <p style={{ fontSize: 13, color: "#aaa", lineHeight: 1.75 }}>
                  6 specialized AI agents work in a sequential pipeline, each with a dedicated role in the Cummins diagnostic workflow. The system operates online with full Claude AI inference, or offline using the built-in Cummins SPN/FMI knowledge base and local distribution inventory. All agents are tuned for Cummins ISX15, X15, ISB6.7, ISL9, ISC8.3, QSB, and QSK engine platforms.
                </p>
              </div>

              {AGENTS.map(function(agent, i) {
                return (
                  <div key={agent.id} style={{ background: "#161616", border: "1px solid " + agent.color + "28", borderRadius: 10, padding: 22, marginBottom: 12 }}>
                    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                      <div style={{ width: 52, height: 52, background: agent.color + "18", border: "1px solid " + agent.color + "40", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{agent.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#555", background: "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: 3, letterSpacing: 2 }}>AGENT {i + 1}</span>
                          <span style={{ fontFamily: "'IBM Plex Sans Condensed', sans-serif", fontWeight: 700, fontSize: 18, color: agent.color }}>{agent.name}</span>
                        </div>
                        <p style={{ fontSize: 13, color: "#999", lineHeight: 1.75, marginBottom: 14 }}>{AGENT_DESCRIPTIONS[agent.id]}</p>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ padding: "4px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, fontSize: 11, color: "#777", fontFamily: "'IBM Plex Mono', monospace" }}>
                            {agent.id === "warehouse" ? "🔌 Always Offline-capable" : isOnline ? "🌐 Online: Claude AI" : "📴 Offline: Local KB"}
                          </span>
                          <span style={{ padding: "4px 12px", background: agent.color + "10", border: "1px solid " + agent.color + "35", borderRadius: 4, fontSize: 11, color: agent.color, fontFamily: "'IBM Plex Mono', monospace" }}>
                            {PIPELINE_LABELS[i]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pipeline Flow */}
              <div style={{ marginTop: 24, padding: "20px 24px", background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 16 }}>PIPELINE EXECUTION FLOW</div>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                  {AGENTS.map(function(agent, i) {
                    return (
                      <div key={agent.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ background: agent.color + "18", border: "1px solid " + agent.color + "45", borderRadius: 6, padding: "7px 14px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 12, color: agent.color }}>
                          {agent.icon} {agent.name.replace(" Agent", "")}
                        </div>
                        {i < AGENTS.length - 1 ? <span style={{ color: "#333", fontSize: 16 }}>→</span> : null}
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(0,200,83,0.05)", border: "1px solid rgba(0,200,83,0.15)", borderRadius: 6, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#00C853" }}>
                  ✓ Troubleshoot + Parts agents execute concurrently after Diagnostic completes · Warehouse + Alternative execute after Parts agent
                </div>
                <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(227,24,55,0.04)", border: "1px solid rgba(227,24,55,0.12)", borderRadius: 6, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#888" }}>
                  ℹ Warehouse Agent queries local Cummins distribution DB — always works offline · All other agents fall back to built-in SPN/FMI knowledge base when internet is unavailable
                </div>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 40 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#333" }}>© 2025 CUMMINS INC. — INTERNAL DIAGNOSTIC TOOL — FOR AUTHORIZED TECHNICIANS ONLY</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#333" }}>POWERED BY CLAUDE AI · CUMMINS QSOL INTEGRATED</div>
        </div>

      </div>
    </>
  );
}