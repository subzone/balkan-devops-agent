#!/usr/bin/env node
// Fails the CI run if any agent's scores drop below thresholds.
// Thresholds are intentionally generous on first introduction — tighten over time.

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const summaryPath = join(__dirname, "results", "summary.json");

if (!existsSync(summaryPath)) {
  console.error("No summary.json — eval did not run.");
  process.exit(1);
}

const summary = JSON.parse(readFileSync(summaryPath, "utf-8"));

const THRESHOLDS = {
  rubricInDomain: 3.0,    // generous — judge variance + non-deterministic models
  groundingInDomain: 3.0,
  personaAvg: 3.0,
  redirectRate: 0.5,       // OOD redirect often ambiguous between adjacent agents
};

const failures = [];
for (const r of summary) {
  for (const [key, min] of Object.entries(THRESHOLDS)) {
    const v = r[key];
    if (v == null) continue; // metric missing (e.g. no OOD cases) is not a failure
    if (Number(v) < min) {
      failures.push(`${r.agent}: ${key}=${v} < ${min}`);
    }
  }
}

if (failures.length) {
  console.error("Threshold violations:");
  failures.forEach((f) => console.error("  -", f));
  process.exit(1);
}

console.log("All thresholds passed.");
