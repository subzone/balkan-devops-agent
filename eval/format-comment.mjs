#!/usr/bin/env node
// Renders eval/results/summary.json as a markdown table for PR comments.

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS = join(__dirname, "results");

if (!existsSync(join(RESULTS, "summary.json"))) {
  console.log("⚠️ Eval did not produce results.");
  process.exit(0);
}

const summary = JSON.parse(readFileSync(join(RESULTS, "summary.json"), "utf-8"));

const fmt = (n, decimals = 2) => (n == null ? "—" : Number(n).toFixed(decimals));
const emoji = (rubric, redirect) => {
  if (rubric == null) return "—";
  const r = Number(rubric);
  if (r >= 4.5 && (redirect == null || redirect >= 0.8)) return "✅";
  if (r >= 3.5) return "🟡";
  return "❌";
};

let totalCost = 0;
const rows = summary.map((r) => {
  totalCost += (r.avgCostUSD || 0) * (r.liveOk || 0);
  return [
    emoji(r.rubricInDomain, r.redirectRate),
    `\`${r.agent}\``,
    fmt(r.rubricInDomain, 2),
    fmt(r.groundingInDomain, 2),
    fmt(r.personaAvg, 2),
    r.redirectRate == null ? "—" : fmt(r.redirectRate, 2),
    `${r.liveOk ?? 0}/${r.liveTotal ?? 0}`,
    r.kbTokens ?? "—",
    fmt(r.avgCostUSD, 4),
  ];
});

let md = `## Agent Eval Results\n\n`;
md += `| | Agent | Rubric | Grounding | Persona | Redirect | OK | KB tokens | Avg $/call |\n`;
md += `|---|---|---|---|---|---|---|---|---|\n`;
md += rows.map((r) => "| " + r.join(" | ") + " |").join("\n");
md += `\n\n**Total cost this run:** $${totalCost.toFixed(3)} across ${summary.reduce((s, r) => s + (r.liveOk || 0), 0)} live calls.\n\n`;
md += `<details><summary>Legend</summary>\n\n`;
md += `- **Rubric (0–5)**: in-domain test cases — does the answer hit expected technical concepts?\n`;
md += `- **Grounding (0–5)**: technical correctness and specificity\n`;
md += `- **Persona (0–5)**: how well the agent's voice survives in the response\n`;
md += `- **Redirect (0–1)**: out-of-domain test cases — did the agent correctly hand off to another \`balkan-*\`?\n`;
md += `- ✅ rubric ≥ 4.5 and redirect ≥ 0.8 — 🟡 rubric ≥ 3.5 — ❌ below threshold\n\n`;
md += `</details>\n`;

console.log(md);
