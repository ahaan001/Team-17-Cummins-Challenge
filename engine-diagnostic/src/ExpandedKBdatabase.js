// ─────────────────────────────────────────────────────────────────────────────
// EXPANDED CUMMINS OFFLINE KNOWLEDGE BASE (SPN/FMI Fault Codes)
// Real data from Cummins technical bulletins + synthetic entries matching style
// ─────────────────────────────────────────────────────────────────────────────

export const CUMMINS_OFFLINE_KB_EXPANDED = {
  // ─────────────────────────────────────────────────────────────────────────
  // EGR & TURBO SYSTEM FAULTS
  // ─────────────────────────────────────────────────────────────────────────
  "SPN 27 FMI 2": {
    issue: "EGR Valve Position — Data Erratic, Intermittent, Or Incorrect",
    engine: ["ISX15", "ISX12", "ISL9", "ISB6.7"],
    severity: "medium",
    causes: [
      "EGR valve position sensor connector loose or corroded",
      "Damaged wiring harness between EGR sensor and ECM",
      "EGR valve actuator sticking or binding",
      "Intermittent sensor signal due to high vibration",
      "ECM internal circuit fault"
    ],
    steps: [
      "Connect INSITE and monitor EGR Valve Position parameter in real-time — look for erratic jumps",
      "Key on, engine off: Measure EGR position sensor voltage at connector (typical 0–5V range)",
      "Perform visual inspection of EGR valve and position sensor for corrosion or mechanical damage",
      "Attempt manual EGR valve actuation using INSITE to isolate electrical vs. mechanical fault",
      "If electrical, check wiring resistance between ECM and sensor connectors (typically <1 ohm)",
      "Clear codes and perform road test — if code returns immediately, suspect sensor failure",
      "Replace EGR position sensor if resistance is out of spec; replace EGR valve assembly if stuck"
    ],
    estimatedTime: "2.5 hours",
    partNumbers: {
      sensor: "4089661",
      wiring: "Harness assembly per schematic"
    }
  },

  "SPN 27 FMI 4": {
    issue: "EGR Valve Position — Voltage Below Normal Or Shorted To Low Source",
    engine: ["ISX15", "ISX12", "ISL9", "ISB6.7"],
    severity: "medium",
    causes: [
      "Sensor signal wire shorted to ground or battery return",
      "Failed EGR position sensor (internal short to ground)",
      "Corroded connector pin allowing low-voltage leakage",
      "Damaged wiring harness allowing moisture ingress"
    ],
    steps: [
      "Disconnect EGR position sensor connector — observe ECM parameter goes to 0V",
      "Measure resistance between signal wire and ground (should be open circuit)",
      "If resistance is <5k ohms, suspect short in wiring — continuity test from ECM pin to harness connectors",
      "Inspect connector pins for corrosion; spray with electrical contact cleaner and reconnect",
      "If still faulting, replace EGR position sensor and re-test",
      "Verify no other sensors on same supply branch are affected"
    ],
    estimatedTime: "1.5 hours",
    partNumbers: {
      sensor: "3408521"
    }
  },

  "SPN 32 FMI 0": {
    issue: "Wastegate Turbocharger Position — Data Above Normal Range",
    engine: ["ISX15", "ISL9", "QSX15"],
    severity: "high",
    causes: [
      "Turbocharger boost pressure exceeding design limits (over-boost condition)",
      "VGT (Variable Geometry Turbocharger) actuator stuck in full open position",
      "ECM algorithm error or calibration mismatch",
      "Boost control solenoid failure preventing vane closure"
    ],
    steps: [
      "Connect INSITE and log Turbocharger Boost Pressure during rated load operation",
      "Monitor wastegate position actuator output voltage — should vary 0–12V per load",
      "Perform VGT solenoid coil resistance check (typical: 6–12 ohms)",
      "Inspect boost pressure hose and intercooler connections for leaks or blockages",
      "Clear code and run boost ramp test under controlled conditions — observe pressure curve",
      "If pressure exceeds 25 psi at full load with clean air filter, suspect turbo degradation",
      "Have turbocharger inspected for blade erosion or bearing play; replace if necessary"
    ],
    estimatedTime: "3 hours",
    partNumbers: {
      actuator: "3598770RX",
      solenoid: "4089662"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FUEL INJECTION SYSTEM FAULTS
  // ─────────────────────────────────────────────────────────────────────────
  "SPN 157 FMI 0": {
    issue: "Engine Fuel Rail Pressure — Data Valid But Above Normal Operating Range",
    engine: ["ISX15", "X15", "ISL9", "ISB6.7"],
    severity: "high",
    causes: [
      "Fuel rail pressure regulator stuck closed or not responding to ECM commands",
      "Contaminated or clogged fuel filter restricting flow",
      "High-pressure fuel pump leakage past check valve",
      "ECM fuel pressure control algorithm malfunction",
      "Fuel pressure sensor reading too high (sensor calibration error)"
    ],
    steps: [
      "Connect INSITE and confirm rail pressure reading at idle and load — normal 5,000–26,000 psi depending on mode",
      "Perform fuel filter inspection; replace if visibly contaminated or bypass indicator shows blockage",
      "Key on, engine off: Fuel pump should pressurize rail to ~10 psi within 5 seconds; listen for pump operation",
      "Manually command fuel rail pressure regulator using INSITE — observe pressure drop in real-time",
      "If pressure does not decrease, regulator is stuck; remove and inspect for debris or corrosion",
      "Replace fuel rail pressure sensor and retest if readings remain erratic after regulator check",
      "Road test under load; if pressure spikes above 26,000 psi, replace fuel pump or pressure regulator"
    ],
    estimatedTime: "4 hours",
    partNumbers: {
      pump: "4921431",
      regulator: "4928593",
      sensor: "4326867"
    }
  },

  "SPN 251 FMI 5": {
    issue: "Injector Control Pressure — Current Below Normal Or Open Circuit",
    engine: ["ISX15", "ISL9", "ISB6.7"],
    severity: "critical",
    causes: [
      "Fuel injector solenoid open circuit or coil winding failure",
      "Damaged wiring harness to fuel injector connector",
      "Corroded or loose injector connector pin",
      "ECM injector driver circuit fault",
      "Multiple injectors affected indicates ECM failure"
    ],
    steps: [
      "Identify which cylinder by fault code designation (SPN 251–256 = cylinders 1–6)",
      "Disconnect suspect injector electrical connector — perform ohm test on solenoid (typical: 0.5–2.0 ohms)",
      "If open (infinite resistance), injector has failed and must be replaced",
      "If resistance is within spec, check wiring harness continuity from ECM connector to injector — should be <0.1 ohm",
      "Inspect connector pins for corrosion, moisture, or poor seating; clean with electrical contact spray",
      "Reconnect and retest — if code clears, problem was connection-related",
      "If multiple cylinders show this fault simultaneously, suspect ECM driver circuit — contact Cummins Technical Assistance Center"
    ],
    estimatedTime: "2 hours per injector",
    partNumbers: {
      injector: "4928260"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SENSOR & ACTUATOR FAULTS
  // ─────────────────────────────────────────────────────────────────────────
  "SPN 84 FMI 2": {
    issue: "Wheel-Based Vehicle Speed — Data Erratic, Intermittent Or Incorrect",
    engine: ["ISX15", "ISX12", "ISL9", "ISB6.7"],
    severity: "medium",
    causes: [
      "ABS wheel speed sensor air gap out of specification",
      "Damaged tone ring on axle hub (missing or broken teeth)",
      "Corroded or loose wheel speed sensor wiring",
      "Electromagnetic interference from alternator or ignition system",
      "ABS module fault or CAN communication error"
    ],
    steps: [
      "Connect INSITE and monitor wheel speed parameters for all four wheels — look for one wheel reading as zero or fluctuating",
      "Raise vehicle and manually spin each wheel while monitoring speed signal in INSITE — sensor should show clean, increasing pulses",
      "Visual inspection: Remove wheel and inspect tone ring teeth for damage, corrosion, or deformation",
      "Measure ABS sensor air gap: position gap gauge between sensor and tone ring — typical 0.020–0.040 inch",
      "If gap is excessive, check for wheel bearing play or sensor bracket position — may require bearing adjustment",
      "Check wheel speed sensor connector for moisture, corrosion, or loose pins; clean or replace as needed",
      "If one sensor continuously faults while tone ring is intact, replace ABS wheel speed sensor",
      "Clear code and road test at highway speed — confirm speed signal tracks vehicle motion smoothly"
    ],
    estimatedTime: "2.5 hours",
    partNumbers: {
      sensor: "3408523",
      toneRing: "Various per axle assembly"
    }
  },

  "SPN 100 FMI 1": {
    issue: "Engine Oil Pressure — Data Valid But Below Normal Operational Range (Most Severe)",
    engine: ["ISX15", "ISX12", "ISL9", "ISB6.7", "QSB6.7"],
    severity: "critical",
    causes: [
      "Engine oil level below minimum (check dipstick)",
      "Low oil viscosity due to overheat or fuel dilution",
      "Oil pump wear or cavitation (inadequate supply)",
      "Clogged oil filter or filter bypass opening",
      "Oil pressure relief valve stuck open",
      "ECM-commanded engine derate due to protective strategy"
    ],
    steps: [
      "IMMEDIATELY stop engine and check oil level on dipstick — add oil if below MIN mark",
      "Inspect oil color and odor — dark/burnt smell indicates overheating; milky appearance indicates water contamination",
      "Connect INSITE and capture oil pressure graph during engine start and warm-up — pressure should rise to 30–60 psi within 10 seconds",
      "At idle (warm), oil pressure should be minimum 10 psi; at full load, 50+ psi",
      "If pressure is low despite adequate oil level, perform oil circulation test: feel warmth at thermostat housing and oil gallery ports",
      "Replace oil filter and verify pressure — if still low, oil pump may be failing (requires engine tear-down)",
      "Clear code after remedial action; monitor for recurrence during next 50-mile test drive"
    ],
    estimatedTime: "1 hour (oil change); 8+ hours (pump replacement)",
    partNumbers: {
      filter: "LF9009",
      oil: "Cummins Premium Plus or equivalent 15W-40"
    }
  },

  "SPN 102 FMI 16": {
    issue: "Engine Intake Manifold #1 Pressure — Data Valid But Above Normal Operating Range",
    engine: ["ISX15", "ISL9", "ISB6.7"],
    severity: "medium",
    causes: [
      "Air intake filter clogged or bypass valve stuck closed",
      "Turbocharger boost control malfunction (over-boost)",
      "Intake manifold blockage from soot or oil vapor accumulation",
      "Boost pressure sensor reading high (sensor drift or calibration error)",
      "VGT vane position stuck in full closed position"
    ],
    steps: [
      "Visually inspect engine air intake: filter restriction indicator should not be in red zone",
      "Replace air filter if indicator shows blockage; clean air intake ducting",
      "Connect INSITE and monitor Intake Manifold Pressure parameter during acceleration — should peak at 20–25 psi",
      "Monitor Turbocharger Speed simultaneously — if turbo RPM is high but intake pressure is normal, boost sensor may be faulty",
      "Perform boost pressure sensor calibration check using INSITE; if out of spec, replace sensor",
      "Inspect intake manifold interior for carbon or oil buildup using endoscope; chemical cleaning may help",
      "If code persists, perform VGT actuator position test — actuator should respond to ECM commands",
      "Road test with clean filter and confirmed sensor accuracy — code should clear"
    ],
    estimatedTime: "2 hours",
    partNumbers: {
      filter: "FS1006-FF5488",
      sensor: "4928594"
    }
  },

  "SPN 110 FMI 0": {
    issue: "Engine Coolant Temperature — Data Valid But Above Normal Operational Range (Most Severe)",
    engine: ["ISX15", "ISX12", "ISL9", "ISB6.7"],
    severity: "critical",
    causes: [
      "Engine coolant level low (loss due to leak or boilover)",
      "Thermostat stuck closed — coolant not flowing to radiator",
      "Radiator core clogged with sediment or air blockage",
      "Coolant pump impeller cavitation or bearing failure",
      "Fan clutch not engaging — no air flow through radiator",
      "ECM thermostatic radiator fan control malfunction"
    ],
    steps: [
      "DO NOT open radiator cap while engine is hot — risk of scalding",
      "Allow engine to cool to <140°F; visually inspect coolant level in surge tank — should be at 'FULL' line",
      "Check for external leaks around hoses, gaskets, and heater connections",
      "Inspect radiator condition from front; look for debris, mud dauber nests, or bent fins blocking airflow",
      "Connect INSITE and monitor Coolant Temperature trend during loaded operation — normal rise should be 1–2°F per minute",
      "Observe coolant flow through heater hose when engine reaches 150°F — hose should feel hot and be pressurized",
      "If hose remains cool, thermostat is stuck closed — thermostat housing must be removed and replaced",
      "Perform cooling system flush if sediment is visible; refill with Cummins-approved coolant (concentration 50/50)",
      "Clear code and monitor thermal trend during next 50-mile test run"
    ],
    estimatedTime: "3.5 hours",
    partNumbers: {
      thermostat: "4928586",
      pump: "4936370",
      coolant: "Cummins Fleetcooler or equivalent"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // EMISSION CONTROL SYSTEM FAULTS
  // ─────────────────────────────────────────────────────────────────────────
  "SPN 3251 FMI 0": {
    issue: "Aftertreatment 1 Diesel Particulate Filter — Differential Pressure Too High",
    engine: ["ISX15", "ISL9", "X15"],
    severity: "high",
    causes: [
      "Diesel Particulate Filter (DPF) soot loading at maximum capacity",
      "DPF regeneration not occurring or incomplete",
      "Fuel injector fouling preventing in-cylinder burn temperature rise needed for regen",
      "EGR cooler or intake system severely restricted",
      "DPF mechanical blockage (engine damage or coolant intrusion)"
    ],
    steps: [
      "Connect INSITE and check DPF Soot Load percentage — normal range 0–50%; >85% requires immediate regen",
      "Monitor fuel pressure during idle — if <5,000 psi consistently, fuel injector cleaning may be needed",
      "Attempt passive regen by operating engine at 1200–1600 RPM steady load for 30+ minutes — monitor pressure drop",
      "If passive regen fails, enable ECM-controlled active regen (consult INSITE help on 'DPF Regeneration' procedure)",
      "CAUTION: Active regen raises exhaust temperature above 600°C — ensure vehicle is in open area away from flammable materials",
      "If regen still does not reduce pressure below 10 psi, DPF may be mechanically blocked — requires off-vehicle cleaning or replacement",
      "Post-regen: Road test and monitor soot load trend — should remain <25% during normal operation",
      "If soot rapidly accumulates again, diagnose root cause: check fuel consumption, EGR operation, and turbo boost"
    ],
    estimatedTime: "2 hours (passive regen); 6+ hours (DPF removal/cleaning)",
    partNumbers: {
      dpf: "4965014",
      cleaner: "Cummins DPF Chemical Additive"
    }
  },

  "SPN 3364 FMI 18": {
    issue: "SCR/NOx Catalyst System — Circuit Failure Or Out Of Specification",
    engine: ["ISX15", "ISL9"],
    severity: "high",
    causes: [
      "Selective Catalyst Reduction (SCR) catalyst degradation or coating failure",
      "DEF (Diesel Exhaust Fluid) injector malfunction or blockage",
      "DEF quality issue (contaminated, wrong concentration, or expired)",
      "Ammonia slip monitor threshold exceeded",
      "NOx sensor reading exceeds acceptable delta from upstream/downstream comparison"
    ],
    steps: [
      "Connect INSITE and perform NOx Sensor Diagnostic Test — this compares upstream (pre-SCR) and downstream (post-SCR) NOx levels",
      "Normal condition: downstream NOx should be 80–90% lower than upstream after SCR conversion",
      "If delta is insufficient, examine DEF system: tank level, concentration (should be 31.8–32.2%), and injection strategy",
      "Inspect DEF dosing injector; if blockage is suspected, flush with distilled water only (never use solvents)",
      "Review DEF supply history: DEF shelf life is 3 years from manufacture date — expired fluid may stratify or crystallize",
      "Replace DEF tank contents and retest NOx conversion efficiency after 100 miles of highway operation",
      "If conversion remains poor, SCR catalyst may be chemically degraded — replacement required (EPA-regulated part)",
      "Document DEF sourcing to ensure OEM-quality fluid in future — non-compliance DEF can permanently damage SCR coating"
    ],
    estimatedTime: "2.5 hours",
    partNumbers: {
      scr: "4965013",
      injector: "4326838",
      def: "Cummins Premium DEF"
    }
  },

  "SPN 3216 FMI 18": {
    issue: "Aftertreatment 1 NOx Sensor (Upstream) — Out Of Specification Or Signal Erratic",
    engine: ["ISX15", "ISL9"],
    severity: "medium",
    causes: [
      "NOx sensor window fouled by soot or carbon deposits",
      "Sensor heater element failure preventing sensor warm-up",
      "Sensing element drift or age-related degradation (>500k miles)",
      "Exhaust system air leak upstream of sensor allowing false rich condition",
      "CAN communication error between sensor module and ECM"
    ],
    steps: [
      "Connect INSITE and log NOx Sensor Voltage during idle and steady load — voltage should rise from 0.5V at startup to 3–4V when warm",
      "Perform NOx Sensor Heater resistance check: key on, measure heater element ohms (typical 9–12 ohms)",
      "If heater is open (infinite ohms), sensor heater circuit has failed and sensor must be replaced",
      "Visual exhaust inspection: look for soot buildup on sensor element or gray/white deposits indicating ash accumulation",
      "If fouled, carefully remove sensor and use soft brush and acetone (or equivalent) to clean sensing tip",
      "Reinstall sensor and retest — if voltage signal normalizes, sensor is recoverable",
      "If signal remains erratic after cleaning, sensor is aged and requires replacement",
      "Ensure downstream aftertreatment (DPF, SCR) is functioning properly — sensor fault often indicates upstream blockage or misfire"
    ],
    estimatedTime: "1.5 hours",
    partNumbers: {
      sensor: "4326867"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ELECTRICAL & CONTROL SYSTEM FAULTS
  // ─────────────────────────────────────────────────────────────────────────
  "SPN 190 FMI 2": {
    issue: "Engine Speed/Position — Loss Of Signal Or Erratic/Intermittent Data",
    engine: ["ISX15", "ISX12", "ISL9", "ISB6.7"],
    severity: "critical",
    causes: [
      "Crankshaft Position Sensor (CKP) connector loose or corroded",
      "CKP sensor air gap out of specification (too far from trigger ring)",
      "Damaged CKP wiring harness or shorted/open conductor",
      "Trigger ring (reluctor) teeth chipped, missing, or worn",
      "Engine cranking but no signal to ECM — ECM cannot establish TDC reference",
      "Secondary ECM fault or internal CKP channel failure"
    ],
    steps: [
      "Attempt engine start — if engine will not crank or cranks but does not fire, suspect CKP failure",
      "Connect INSITE in diagnostic mode — ECM will display CKP signal status and frequency",
      "Key on, engine off: Measure CKP sensor voltage with engine NOT running — should be 0V steady state",
      "Crank engine and observe CKP voltage signal oscillation on multimeter — should show 1–5V AC ripple pattern",
      "If no AC signal during cranking, perform CKP sensor resistance check: typical 800–2000 ohms, DC ohms mode",
      "Visually inspect CKP sensor connector for moisture, corrosion, or pin damage; clean and test",
      "Measure CKP sensor air gap: should be 0.030–0.050 inch between sensor tip and trigger ring",
      "Inspect trigger ring teeth for damage; if even one tooth is missing, signal will dropout at that engine position",
      "If sensor resistance and gap are within spec but signal is still missing, replace CKP sensor",
      "If multiple sensors fault or problem recurs, contact Cummins Technical Assistance Center for ECM diagnostics"
    ],
    estimatedTime: "2.5 hours",
    partNumbers: {
      sensor: "3408523",
      ring: "Trigger ring assembly per engine model"
    }
  },

  "SPN 231 FMI 9": {
    issue: "Data Link — J1939 or J1708 Communication Error Or Missing Data",
    engine: ["ISX15", "ISX12", "ISL9", "ISB6.7"],
    severity: "medium",
    causes: [
      "CAN (Controller Area Network) bus cable damaged, shorted, or open circuit",
      "Loose connectors at ECM or auxiliary module (transmission, ABS, gateway)",
      "Incorrect CAN terminating resistors (should be 120 ohm on each end of bus)",
      "CAN transceiver IC failure in ECM or module",
      "Software mismatch between ECM and connected modules"
    ],
    steps: [
      "Connect INSITE and check Module Communication Status — will show which modules are missing data",
      "Visually inspect CAN bus harness routing and connectors for damage, moisture, or loose pins",
      "At the ECM connector, measure CAN_H and CAN_L voltages relative to ground: should be ~2.5V DC each at idle",
      "With engine OFF, measure resistance between CAN_H and CAN_L at ECM connector — should be ~60 ohms (two 120-ohm resistors in parallel)",
      "If resistance is not ~60 ohms, check terminating resistor network at both ends of bus; replace faulty resistor pack if needed",
      "Perform CAN bus continuity test: measure DC ohms from CAN_H (ECM) to CAN_H (transmisison module) and CAN_L (ECM) to CAN_L (transmission) — should be <1 ohm",
      "If continuity is broken, inspect splice points and connector shells for corrosion or brittle insulation",
      "After repair, power cycle all modules (key off for 30 seconds) to allow system re-enumeration",
      "Clear code and verify module communication status in INSITE returns to normal"
    ],
    estimatedTime: "3 hours",
    partNumbers: {
      harness: "CAN bus harness assembly per vehicle configuration"
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SYNTHETIC/COMMON FAULT CODES (following Cummins style)
  // ─────────────────────────────────────────────────────────────────────────
  "SPN 98 FMI 1": {
    issue: "Engine Oil Level — Data Valid But Below Normal Operating Range",
    engine: ["ISX15", "ISL9", "ISB6.7"],
    severity: "medium",
    causes: [
      "Oil consumption elevated due to worn rings or valve stems",
      "Oil level sensor reads low but actual level is adequate (sensor drift)",
      "Crankcase breather clogged, causing pressure blowby into crankcase",
      "Oil leak from pan gasket, drain plug, or turbo seal"
    ],
    steps: [
      "Stop engine and allow 2 minutes for oil to settle in pan",
      "Remove dipstick and wipe clean, then reinsert fully to get accurate level reading",
      "Oil should be between MIN and MAX marks — add 15W-40 oil if below MIN",
      "Connect INSITE and monitor Oil Level parameter — should stabilize after adding oil",
      "Inspect engine exterior for visible oil seepage; check pan drain plug for tightness",
      "If oil level is actually adequate but sensor reads low, oil level sensor may need recalibration or replacement",
      "Road test and monitor consumption rate over 500 miles — oil loss >1 quart per 500 miles indicates internal wear"
    ],
    estimatedTime: "1 hour",
    partNumbers: {
      oil: "Cummins Premium Plus 15W-40"
    }
  },

  "SPN 145 FMI 4": {
    issue: "Cruise Control Enable Switch — Circuit Failure Or Voltage Out Of Range",
    engine: ["ISX15", "ISL9", "ISB6.7", "ISX12"],
    severity: "low",
    causes: [
      "Cruise control stalk switch worn or contacts intermittent",
      "Steering column wiring harness damaged or loose connector",
      "ECM input circuit voltage reading outside 0–5V range",
      "Faulty voltage divider or power supply to cruise switch circuit"
    ],
    steps: [
      "Locate cruise control stalk on steering column and inspect connector for corrosion or loose pins",
      "Clean connector with electrical contact spray and fully reseat",
      "Test cruise control button functions: SET, RESUME, CANCEL — listen for audible click feedback",
      "Connect INSITE and monitor Cruise Control Switch Status parameter — status should change as buttons are pressed",
      "If status does not change, measure switch continuity using multimeter in ohms mode",
      "If switch is internally open, stalk assembly must be replaced",
      "Clear code after repair and test cruise control operation at highway speed"
    ],
    estimatedTime: "1 hour",
    partNumbers: {
      stalk: "Steering column cruise control stalk assembly"
    }
  },

  "SPN 168 FMI 1": {
    issue: "Engine ECM/PCM Power Supply Voltage — Below Normal Or Intermittent",
    engine: ["ISX15", "ISX12", "ISL9", "ISB6.7", "QSB6.7"],
    severity: "critical",
    causes: [
      "Battery voltage chronically low (<11V at rest) due to weak battery or charging system fault",
      "Loose battery cable terminal connections or corroded battery posts",
      "Alternator not charging or output below 13.5V at engine speed",
      "High-resistance connection in main power distribution (fused disconnect, battery contactor, or fusible links)",
      "ECM power supply filter capacitor failure or internal regulator fault"
    ],
    steps: [
      "With engine OFF, measure battery voltage — should be 12.5–13.2V for fully charged battery",
      "If voltage is <12.0V, battery may be weak — perform load test or check for parasitic drain while vehicle is sleeping",
      "Start engine and measure voltage at battery posts and at ECM 12V input — should be 13.5–14.5V",
      "If alternator output is low, test alternator output: disconnect battery ground and measure voltage between alternator output and ground — should be <0.1V AC ripple",
      "Perform visual inspection of battery cable terminals, engine ground straps, and ECM main power connector for corrosion or looseness",
      "Clean all battery and power connections with a wire brush; apply dielectric grease to posts",
      "Test starting system: engine should crank at 250+ RPM during cold start — slow cranking indicates low system voltage or bad starter",
      "Clear code after remedial action and monitor for recurrence; if voltage remains below 13V at engine speed, alternator replacement is required"
    ],
    estimatedTime: "2 hours",
    partNumbers: {
      battery: "Heavy-duty truck battery per specification",
      alternator: "Cummins OEM alternator per model"
    }
  },

  "SPN 326 FMI 0": {
    issue: "Aftertreatment 1 Temperature Below Operating Temperature Threshold",
    engine: ["ISX15", "ISL9"],
    severity: "medium",
    causes: [
      "DPF or SCR catalyst not warming up due to low exhaust temperature during idle or light load",
      "Engine operating below normal combustion temperature (thermostat malfunction)",
      "Extended idle operation preventing regeneration or chemical activation",
      "Fuel delivery or combustion efficiency reduced due to fuel injector fouling or EGR blockage"
    ],
    steps: [
      "Connect INSITE and monitor Aftertreatment Temperature during warm-up cycle — should rise from ambient to >300°C within 10 minutes of loaded operation",
      "Verify engine coolant temperature is rising normally — coolant temp should reach 160–180°F within 5 minutes",
      "Check that EGR flow is occurring: Intake temperature should be elevated due to EGR heat addition",
      "For DPF regeneration to occur, exhaust temp must exceed 600°C — this requires sustained load or ECM-controlled active regen",
      "If temperature remains low despite normal coolant temp, exhaust restriction or turbo underboost may be limiting flow — see relevant fault codes",
      "Allow extended idle (10+ minutes) for passive warming, then perform dynamic regen by operating at 1200–1400 RPM under load"
    ],
    estimatedTime: "1.5 hours",
    partNumbers: {}
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DIAGNOSTIC SUMMARY CODES FOR QUICK REFERENCE
  // ─────────────────────────────────────────────────────────────────────────
  "SPN 51 FMI 2": {
    issue: "Engine Throttle Valve 1 Position — Data Erratic, Intermittent, Or Incorrect",
    engine: ["ISX15", "ISL9"],
    severity: "medium",
    causes: [
      "Throttle position sensor connector loose or corroded",
      "Throttle actuator mechanical binding or sticking",
      "Wiring harness damage or moisture intrusion"
    ],
    steps: [
      "Visually inspect throttle valve for carbon buildup or mechanical damage",
      "Perform throttle position sensor voltage test: key on, measure 0–5V across sensor signal pin",
      "Command throttle open using INSITE — observe smooth voltage rise",
      "If voltage is erratic or steps are observed, sensor is failing and must be replaced"
    ],
    estimatedTime: "1 hour",
    partNumbers: {}
  },

  "SPN 636 FMI 2": {
    issue: "Crankshaft Position — Loss Of Signal Or Signal Below Threshold",
    engine: ["ISX15", "ISX12", "ISL9", "ISB6.7"],
    severity: "critical",
    causes: [
      "Crankshaft position sensor trigger ring damaged or worn",
      "Sensor air gap out of specification",
      "Wiring short or open circuit"
    ],
    steps: [
      "Engine will not start if CKP signal is completely lost",
      "Verify sensor air gap (0.030–0.050 inch) and trigger ring tooth integrity",
      "Measure sensor resistance and perform voltage signal test during cranking"
    ],
    estimatedTime: "2 hours",
    partNumbers: {
      sensor: "3408523"
    }
  }
};

export default CUMMINS_OFFLINE_KB_EXPANDED;