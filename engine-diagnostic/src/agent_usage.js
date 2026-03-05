// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE: Using Expanded CUMMINS_OFFLINE_KB with Diagnostic Agents
// Demonstrates how the Fault Parser, Diagnostic, and Troubleshoot agents
// leverage the expanded database for real-time field diagnostics
// ─────────────────────────────────────────────────────────────────────────────

import { CUMMINS_OFFLINE_KB_EXPANDED as KB } from './ExpandedKBdatabase.js';

// ─────────────────────────────────────────────────────────────────────────────
// FAULT PARSER AGENT — parses raw fault codes and enriches with KB data
// ─────────────────────────────────────────────────────────────────────────────

const FaultParserAgent = {
  id: "fault-parser",
  fn: async (previousResults) => {
    // Input: Raw fault codes from vehicle telemetry or scanner
    // Example: "SPN 27 FMI 2" from INSITE scanner output
    
    const rawFaultCodes = [
      "SPN 27 FMI 2",
      "SPN 157 FMI 0",
      "SPN 102 FMI 16"
    ];
    
    const engineType = "ISX15";  // From vehicle VIN decode

    // Step 1: Parse each code and enrich with KB data
    const parsedFaults = rawFaultCodes.map(code => {
      const kbEntry = KB[code];
      
      if (!kbEntry) {
        return {
          code,
          found: false,
          error: "Code not in offline knowledge base"
        };
      }

      // Step 2: Determine severity and applicability
      const isApplicable = kbEntry.engine.includes(engineType);
      const severityLevel = { 
        "critical": 4, 
        "high": 3, 
        "medium": 2, 
        "low": 1 
      }[kbEntry.severity] || 1;

      return {
        code,
        found: true,
        issue: kbEntry.issue,
        severity: kbEntry.severity,
        severityScore: severityLevel,
        applicableToEngine: isApplicable,
        description: kbEntry.issue,
        possibleCauses: kbEntry.causes.slice(0, 3),  // Top 3 causes for quick ref
        recommendedAction: isApplicable 
          ? "Proceed with diagnosis — code applies to this engine"
          : "Verify engine model — code may not apply to ISX15 variant"
      };
    });

    // Step 3: Sort by severity for triage
    const prioritized = parsedFaults.sort((a, b) => 
      (b.severityScore || 0) - (a.severityScore || 0)
    );

    return {
      faultCount: parsedFaults.length,
      faults: prioritized,
      topUrgency: prioritized[0],
      readyForDiagnosis: parsedFaults.every(f => f.found),
      timestamp: new Date().toISOString()
    };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DIAGNOSTIC AGENT — digs deeper into root causes using KB procedures
// ─────────────────────────────────────────────────────────────────────────────

const DiagnosticAgent = {
  id: "diagnostic",
  fn: async (previousResults) => {
    // Input: Parsed faults from Fault Parser Agent
    const { faults } = previousResults["fault-parser"] || { faults: [] };

    // Generate diagnostic procedures for each fault
    const diagnostics = faults.map(fault => {
      const kbEntry = KB[fault.code];
      
      if (!kbEntry || !fault.found) {
        return {
          code: fault.code,
          diagnosticProcedure: [],
          confidence: "0%"
        };
      }

      // Step 1: Extract diagnostic procedure from KB
      const diagnosticSteps = kbEntry.steps.slice(0, 5);  // First 5 steps are usually diagnosis-focused

      // Step 2: Estimate confidence based on symptom clarity
      // If all top causes are electrical (wiring, connector), confidence is high
      const hasElectricalCauses = kbEntry.causes.some(c => 
        /connector|wiring|circuit|voltage|short/.test(c.toLowerCase())
      );
      const hasEnvironmentalCauses = kbEntry.causes.some(c =>
        /vibration|moisture|contamination|age/.test(c.toLowerCase())
      );

      // Electrical issues are easier to diagnose (80% confidence)
      // Environmental issues are harder (50% confidence) — require extended testing
      const confidence = hasElectricalCauses ? "80%" : "55%";

      return {
        code: fault.code,
        issue: kbEntry.issue,
        severity: kbEntry.severity,
        rootCauses: kbEntry.causes,
        diagnosticSteps: diagnosticSteps,
        estimatedDiagnosticTime: kbEntry.estimatedTime,
        confidence: confidence,
        nextStep: diagnosticSteps[0],  // Start tech here
        recommendation: fault.applicableToEngine
          ? "Perform procedures in order; stop if cause is confirmed"
          : "Cross-check engine model before proceeding"
      };
    });

    return {
      diagnosticCount: diagnostics.length,
      details: diagnostics,
      totalEstimatedTime: faults.reduce((sum, f) => {
        const kbEntry = KB[f.code];
        if (!kbEntry) return sum;
        // Parse "X.Y hours" format
        const hours = parseFloat(kbEntry.estimatedTime.match(/[\d.]+/)?.[0] || 0);
        return sum + hours;
      }, 0),
      overallDifficulty: diagnostics.some(d => d.severity === "critical") ? "EXPERT" : "INTERMEDIATE"
    };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// TROUBLESHOOT AGENT — provides repair steps and parts info from KB
// ─────────────────────────────────────────────────────────────────────────────

const TroubleshootAgent = {
  id: "troubleshoot",
  fn: async (previousResults) => {
    // Input: Confirmed faults and their probable root causes
    const { faults } = previousResults["fault-parser"] || { faults: [] };

    // Generate troubleshooting procedures for confirmed failures
    const troubleSteps = faults
      .filter(f => f.found && f.applicableToEngine)
      .map(fault => {
        const kbEntry = KB[fault.code];

        // Step 1: Build complete repair procedure
        const fullProcedure = {
          code: fault.code,
          issue: kbEntry.issue,
          symptom: "Engine fault flag; possible derate or limp mode",
          rootCauseRange: kbEntry.causes
        };

        // Step 2: Extract repair-focused steps (typically steps 4-10 in KB)
        const repairSteps = kbEntry.steps.slice(4, kbEntry.steps.length);

        // Step 3: Identify required parts and tools
        const requiredParts = Object.entries(kbEntry.partNumbers || {})
          .map(([component, partNum]) => ({
            component,
            partNumber: partNum,
            vendorSuggestion: "Cummins Authorized Dealer or CDW-001"
          }));

        return {
          code: fault.code,
          repairProcedure: repairSteps,
          requiredParts: requiredParts,
          estimatedRepairTime: kbEntry.estimatedTime,
          safetyNotes: fault.severity === "critical" 
            ? ["DO NOT operate vehicle until repair is complete", "Ensure vehicle is on level ground with parking brake set"]
            : []
        };
      });

    return {
      troubleshootingCases: troubleSteps.length,
      repairs: troubleSteps,
      totalRepairTime: troubleSteps.reduce((sum, t) => {
        const hours = parseFloat(t.estimatedRepairTime.match(/[\d.]+/)?.[0] || 0);
        return sum + hours;
      }, 0),
      partInventoryNeeded: troubleSteps.flatMap(t => t.requiredParts),
      recommendation: troubleSteps.length > 0
        ? "Order parts immediately; schedule repair window"
        : "No repairs identified — monitor fault recurrence"
    };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PARTS AGENT — cross-references KB parts with warehouse inventory
// ─────────────────────────────────────────────────────────────────────────────

const PartsAgent = {
  id: "parts",
  fn: async (previousResults) => {
    const { repairs } = previousResults["troubleshoot"] || { repairs: [] };

    // Extract unique parts needed across all repairs
    const partsNeeded = repairs.flatMap(r => r.requiredParts);
    const uniqueParts = Array.from(
      new Map(partsNeeded.map(p => [p.partNumber, p])).values()
    );

    // Step 1: Map parts to warehouse inventory
    // (In real scenario, this queries CUMMINS_WAREHOUSE_DB)
    const partsWithInventory = uniqueParts.map(part => {
      // Simulated warehouse lookup
      const inventoryStatus = {
        "4089661": { location: "CDW-001", qty: 4 },
        "4928260": { location: "CDW-002", qty: 5 },
        "4921431": { location: "CDW-001", qty: 2 },
        "3598770RX": { location: "CDW-001", qty: 1 },
        "4326867": { location: "CDW-004", qty: 3 }
      }[part.partNumber] || { location: "BACKORDER", qty: 0 };

      return {
        ...part,
        warehouse: inventoryStatus.location,
        available: inventoryStatus.qty,
        readyForPickup: inventoryStatus.qty > 0
      };
    });

    return {
      partsRequired: partsWithInventory.length,
      parts: partsWithInventory,
      allPartsAvailable: partsWithInventory.every(p => p.available > 0),
      recommendation: partsWithInventory.every(p => p.available > 0)
        ? "All parts in stock — ready to proceed with repair"
        : "Some parts on backorder — contact vendor for lead times",
      warehousePrimary: "CDW-001 Columbus Distribution Hub"
    };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE USAGE — Running diagnostic pipeline with expanded KB
// ─────────────────────────────────────────────────────────────────────────────

export const runDiagnosticWithExpandedKB = async () => {
  console.log("═══════════════════════════════════════════════════════");
  console.log("CUMMINS DIAGNOSTIC PIPELINE — Using Expanded KB");
  console.log("═══════════════════════════════════════════════════════\n");

  // Simulate field technician input
  const fieldInput = {
    faultCodes: "SPN 27 FMI 2, SPN 157 FMI 0",
    engineType: "ISX15",
    symptoms: "Rough idle, intermittent power loss"
  };

  console.log(`Input: ${JSON.stringify(fieldInput)}\n`);

  // Step 1: Fault Parser
  console.log("► STAGE 1: Fault Parser Agent");
  const faultParserResult = await FaultParserAgent.fn({});
  console.log(JSON.stringify(faultParserResult, null, 2));
  console.log(`\n✓ Found ${faultParserResult.faultCount} faults\n`);

  // Step 2: Diagnostic Agent
  console.log("► STAGE 2: Diagnostic Agent");
  const diagnosticResult = await DiagnosticAgent.fn({
    "fault-parser": faultParserResult
  });
  console.log(JSON.stringify(diagnosticResult, null, 2));
  console.log(`\n✓ Estimated diagnostic time: ${diagnosticResult.totalEstimatedTime} hours\n`);

  // Step 3: Troubleshoot Agent
  console.log("► STAGE 3: Troubleshoot Agent");
  const troubleshootResult = await TroubleshootAgent.fn({
    "fault-parser": faultParserResult
  });
  console.log(JSON.stringify(troubleshootResult, null, 2));
  console.log(`\n✓ Estimated repair time: ${troubleshootResult.totalRepairTime} hours\n`);

  // Step 4: Parts Agent
  console.log("► STAGE 4: Parts Availability Agent");
  const partsResult = await PartsAgent.fn({
    "troubleshoot": troubleshootResult
  });
  console.log(JSON.stringify(partsResult, null, 2));
  console.log(`\n✓ Parts check complete\n`);

  // Summary
  console.log("═══════════════════════════════════════════════════════");
  console.log("DIAGNOSTIC SUMMARY");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`Faults Found: ${faultParserResult.faultCount}`);
  console.log(`Total Diagnostic Time: ${diagnosticResult.totalEstimatedTime} hours`);
  console.log(`Total Repair Time: ${troubleshootResult.totalRepairTime} hours`);
  console.log(`Parts Required: ${partsResult.partsRequired}`);
  console.log(`All Parts Available: ${partsResult.allPartsAvailable ? "✓ YES" : "✗ NO"}`);
  console.log(`Status: ${partsResult.recommendation}`);
};

// ─────────────────────────────────────────────────────────────────────────────
// SEARCHING THE EXPANDED KB PROGRAMMATICALLY
// ─────────────────────────────────────────────────────────────────────────────

export const searchKB = {
  
  // Find all codes for a specific engine
  byEngine: (engineType) => {
    return Object.entries(KB).filter(([code, entry]) => 
      entry.engine.includes(engineType)
    );
  },

  // Find all codes of a specific severity
  bySeverity: (severity) => {
    return Object.entries(KB).filter(([code, entry]) => 
      entry.severity === severity
    );
  },

  // Find codes by system (EGR, Turbo, Fuel, etc.)
  bySystem: (systemKeyword) => {
    return Object.entries(KB).filter(([code, entry]) =>
      entry.issue.toLowerCase().includes(systemKeyword.toLowerCase())
    );
  },

  // Find codes that match a symptom
  bySymptom: (symptomKeyword) => {
    return Object.entries(KB).filter(([code, entry]) =>
      entry.causes.some(c => 
        c.toLowerCase().includes(symptomKeyword.toLowerCase())
      )
    );
  },

  // Fuzzy match on issue description
  byIssueDescription: (query) => {
    return Object.entries(KB).filter(([code, entry]) =>
      entry.issue.toLowerCase().includes(query.toLowerCase()) ||
      code.toLowerCase().includes(query.toLowerCase())
    );
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE: Search Queries
// ─────────────────────────────────────────────────────────────────────────────

export const exampleSearches = () => {
  console.log("\n### EXAMPLE SEARCHES ###\n");

  // Query 1: All ISB6.7 codes
  console.log("1. All ISB6.7 fault codes:");
  const isb67Codes = searchKB.byEngine("ISB6.7");
  console.log(`   Found ${isb67Codes.length} codes\n`);

  // Query 2: All critical severity faults
  console.log("2. All CRITICAL severity codes:");
  const criticalCodes = searchKB.bySeverity("critical");
  console.log(`   Found ${criticalCodes.length} codes:`);
  criticalCodes.forEach(([code, entry]) => {
    console.log(`   - ${code}: ${entry.issue}`);
  });

  // Query 3: All turbo-related codes
  console.log("\n3. All turbo/VGT codes:");
  const turboCodes = searchKB.bySystem("turbo");
  console.log(`   Found ${turboCodes.length} codes`);

  // Query 4: Codes related to wiring issues
  console.log("\n4. Codes with wiring-related causes:");
  const wiringCodes = searchKB.bySymptom("wiring");
  console.log(`   Found ${wiringCodes.length} codes`);

  // Query 5: EGR valve issues
  console.log("\n5. EGR-related codes:");
  const egrCodes = searchKB.byIssueDescription("EGR");
  console.log(`   Found ${egrCodes.length} codes:`);
  egrCodes.forEach(([code, entry]) => {
    console.log(`   - ${code}: ${entry.issue}`);
  });
};

// Export agent definitions for use in App.jsx
export const DIAGNOSTIC_AGENTS_WITH_EXPANDED_KB = [
  FaultParserAgent,
  DiagnosticAgent,
  TroubleshootAgent,
  PartsAgent
];

export default {
  runDiagnosticWithExpandedKB,
  searchKB,
  exampleSearches,
  DIAGNOSTIC_AGENTS_WITH_EXPANDED_KB
};