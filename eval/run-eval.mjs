#!/usr/bin/env node
// Eval harness for Balkan DevOps agents.
//
// Modes:
//   --static            Static-only: token estimates, knowledge bloat, structure checks. No API calls.
//   --live              Run each agent on its test prompts.
//   --judge             Score live responses with an LLM judge.
//   --all               static + live + judge.
//   --agents x,y        Limit to specific agent names. Default: all.
//   --limit N           Cap test cases per agent. Default: all.
//   --provider name     'claude-cli' (default, local) | 'github-models' (works in CI).
//   --model name        Model id for the provider. Provider-specific defaults apply.
//   --judge-model name  Model id for the judge. Defaults match the provider.
//   --budget USD        Per-call budget (claude-cli only). Default: 0.05.
//
// Output goes to ./eval/results/{static,live,judge,summary}.{json,csv}.

import { createRequire } from "node:module";
import { writeFileSync, readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { TEST_CASES } from "./test-cases.mjs";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const RESULTS = join(__dirname, "results");

// Pull AGENTS array from compiled output.
const { AGENTS } = require(join(ROOT, "out", "agents.js"));

// ---------- args ----------

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};

const RUN_STATIC = flag("--static") || flag("--all");
const RUN_LIVE = flag("--live") || flag("--all");
const RUN_JUDGE = flag("--judge") || flag("--all");
const AGENT_FILTER = opt("--agents", null)?.split(",").map((s) => s.trim()).filter(Boolean);
const LIMIT = parseInt(opt("--limit", "999"), 10);
const PROVIDER_NAME = opt("--provider", "claude-cli");
const MODEL = opt("--model", null);
const JUDGE_MODEL = opt("--judge-model", null);
const BUDGET = parseFloat(opt("--budget", "0.05"));

if (!RUN_STATIC && !RUN_LIVE && !RUN_JUDGE) {
  console.error("Usage: node eval/run-eval.mjs [--static|--live|--judge|--all] [--agents x,y] [--limit N] [--provider claude-cli|github-models] [--model id] [--budget 0.05]");
  process.exit(1);
}

// Lazy-load the provider only if we need it (static-only runs need no provider).
let provider = null;
const loadProvider = async () => {
  if (provider) return provider;
  if (PROVIDER_NAME === "claude-cli") {
    provider = await import("./providers/claude-cli.mjs");
  } else if (PROVIDER_NAME === "github-models") {
    provider = await import("./providers/github-models.mjs");
  } else {
    throw new Error(`Unknown provider: ${PROVIDER_NAME}. Valid: claude-cli, github-models`);
  }
  return provider;
};

const targetAgents = AGENTS.filter((a) => !AGENT_FILTER || AGENT_FILTER.includes(a.name));
if (targetAgents.length === 0) {
  console.error("No agents matched filter:", AGENT_FILTER);
  process.exit(1);
}

// ---------- helpers ----------

// Rough token count: GPT/Claude tokenizers average ~3.8 chars/token for English-ish text.
// Cyrillic/Serbian Latin runs slightly higher, so we use 3.5 as a conservative ratio.
const estimateTokens = (s) => Math.round((s || "").length / 3.5);

const loadKnowledge = (agentName) => {
  const dir = join(ROOT, "knowledge", agentName);
  if (!existsSync(dir)) return { content: "", files: [] };
  const files = readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => {
    const full = join(dir, f);
    const content = readFileSync(full, "utf-8");
    return { name: f, bytes: statSync(full).size, content };
  });
  return {
    content: files.map((f) => f.content).join("\n\n"),
    files,
  };
};

// Build the same prompt that claudecode-generator.ts emits, minus the YAML frontmatter
// (which Claude Code uses for routing, not as input to the model). This is the prompt
// payload the agent actually runs with.
const buildAgentSystemPrompt = (agent, knowledge) => {
  let body = `# ${agent.fullName} — ${agent.role}\n\n`;
  body += `## Karakter\n${agent.character}\n\n`;
  body += `## System Prompt\n${agent.systemPrompt}\n\n`;
  body += `## Pravila\n`;
  body += `- Odgovaraš na srpskom jeziku\n`;
  body += `- Tehničke termine (nazive servisa, komande, kod) ostavljaš na engleskom\n`;
  body += `- Uvek ostani u karakteru — nikad ne izlazi iz role\n`;
  body += `- Daješ tehnički precizne odgovore u svom karakteru\n`;
  body += `- VAŽNO: Pre odgovora proveri rutiranje ispod. Ako pitanje primarno spada u tuđu ekspertizu, preporuči tog agenta i STANI — ne odgovaraj sam, čak i ako tema dotiče tvoju oblast\n\n`;
  body += `## Drugi agenti\n`;
  body += `Rutiraj ka odgovarajućem agentu (u zagradama su ključne reči koje pokazuju da pitanje pripada tom agentu):\n`;
  body += `- Troškovi (cost, billing, RI, Spot, Reserved, FinOps, ušteda) → balkan-sima\n`;
  body += `- Security/Pentest (penetration test, security scan, IAM permission gap, tfsec, exposed port) → balkan-mile\n`;
  body += `- Arhitektura (microservices design, multi-region, Well-Architected, arhitektura review) → balkan-zika\n`;
  body += `- Debugging/Logovi (debugging, stack trace, OOM, log analysis, APM, memory leak) → balkan-toza\n`;
  body += `- Čišćenje (cleanup, lifecycle policy, brisanje, prune, VACUUM) → balkan-steva\n`;
  body += `- Refactoring (dead code, complexity, Dockerfile optimize) → balkan-uske\n`;
  body += `- Šifrovanje (encryption, secrets, certificates, PII masking, maskiranje podataka, KMS, Vault) → balkan-joca\n`;
  body += `- Big Data (Spark, Kafka, Hadoop, ETL, GPU compute) → balkan-gile\n`;
  body += `- Workaround/Legacy (legacy bridge, workaround, hack, SOAP-to-REST, migration) → balkan-laki\n`;
  body += `- Auditing (audit log, CloudTrail, Activity Log, ko je promenio, compliance trail) → balkan-moma\n`;
  if (knowledge) body += `\n## Knowledge Base\n${knowledge}`;
  return body;
};

// Dispatches a single inference call through the loaded provider.
// All providers normalize to the same response shape:
//   { result, is_error, total_cost_usd, usage:{input_tokens,output_tokens,cache_creation_input_tokens}, errors }
const runInference = async (systemPrompt, userPrompt, { model, budget = BUDGET } = {}) => {
  const p = await loadProvider();
  return p.run(systemPrompt, userPrompt, {
    model: model || MODEL || p.defaultModel,
    budget,
  });
};

const writeJSON = (name, data) => {
  writeFileSync(join(RESULTS, `${name}.json`), JSON.stringify(data, null, 2));
};

const writeCSV = (name, rows) => {
  if (rows.length === 0) return;
  const cols = Object.keys(rows[0]);
  const escape = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => escape(r[c])).join(","))].join("\n");
  writeFileSync(join(RESULTS, `${name}.csv`), csv);
};

// ---------- 1. STATIC ----------

const runStatic = () => {
  console.log("\n=== STATIC EVAL ===");
  const rows = [];
  for (const agent of targetAgents) {
    const kb = loadKnowledge(agent.name);
    const systemPrompt = buildAgentSystemPrompt(agent, kb.content);
    const sysPromptOnly = buildAgentSystemPrompt(agent, "");

    const sysTokens = estimateTokens(sysPromptOnly);
    const kbTokens = estimateTokens(kb.content);
    const totalTokens = estimateTokens(systemPrompt);

    // Structural lint
    const sp = agent.systemPrompt || "";
    const issues = [];
    if (!/Ekspertiza/i.test(sp)) issues.push("missing-expertise-section");
    if (!/Ti si/i.test(sp)) issues.push("missing-persona-anchor");
    if (sp.length < 200) issues.push("very-short-prompt");
    if (kb.files.length === 0) issues.push("no-knowledge-files");
    if (kbTokens > 8000) issues.push("knowledge-bloat-8k+");

    rows.push({
      agent: agent.name,
      fullName: agent.fullName,
      role: agent.role,
      systemPromptTokens: sysTokens,
      knowledgeTokens: kbTokens,
      totalContextTokens: totalTokens,
      knowledgeFiles: kb.files.length,
      knowledgeBytes: kb.files.reduce((s, f) => s + f.bytes, 0),
      issues: issues.join("|") || "ok",
    });
    console.log(`  ${agent.name.padEnd(7)} sys=${sysTokens.toString().padStart(4)}t  kb=${kbTokens.toString().padStart(5)}t  total=${totalTokens.toString().padStart(5)}t  files=${kb.files.length}  ${issues.length ? "⚠ " + issues.join(",") : "✓"}`);
  }
  writeJSON("static", rows);
  writeCSV("static", rows);
  console.log(`Wrote ${RESULTS}/static.{json,csv}`);
  return rows;
};

// ---------- 2. LIVE ----------

const runLive = async () => {
  console.log("\n=== LIVE EVAL ===");
  const p = await loadProvider();
  console.log(`Provider: ${p.name}, model: ${MODEL || p.defaultModel}, budget per call: $${BUDGET}`);
  const rows = [];
  let totalCost = 0;

  for (const agent of targetAgents) {
    const cases = (TEST_CASES[agent.name] || []).slice(0, LIMIT);
    if (cases.length === 0) {
      console.log(`  ${agent.name}: no test cases defined, skipping`);
      continue;
    }
    const kb = loadKnowledge(agent.name);
    const systemPrompt = buildAgentSystemPrompt(agent, kb.content);

    for (let i = 0; i < cases.length; i++) {
      const tc = cases[i];
      process.stdout.write(`  ${agent.name} [${i + 1}/${cases.length}] ${tc.kind.padEnd(13)} ... `);
      const t0 = Date.now();
      try {
        const result = await runInference(systemPrompt, tc.prompt);
        const ms = Date.now() - t0;
        const usage = result.usage || {};
        const cost = result.total_cost_usd || 0;
        totalCost += cost;
        const ok = !result.is_error;
        rows.push({
          agent: agent.name,
          caseIndex: i,
          kind: tc.kind,
          prompt: tc.prompt,
          response: result.result || "",
          inputTokens: usage.input_tokens || 0,
          cacheCreate: usage.cache_creation_input_tokens || 0,
          outputTokens: usage.output_tokens || 0,
          costUSD: cost,
          durationMs: ms,
          ok,
          error: ok ? "" : result.result || result.errors?.join(";") || "unknown",
        });
        console.log(`${ok ? "✓" : "✗"} ${ms}ms $${cost.toFixed(4)} (${(result.result || "").length}c)`);
      } catch (e) {
        rows.push({
          agent: agent.name,
          caseIndex: i,
          kind: tc.kind,
          prompt: tc.prompt,
          response: "",
          inputTokens: 0,
          cacheCreate: 0,
          outputTokens: 0,
          costUSD: 0,
          durationMs: Date.now() - t0,
          ok: false,
          error: e.message,
        });
        console.log(`✗ ERROR: ${e.message}`);
      }
    }
  }

  writeJSON("live", rows);
  writeCSV("live", rows);
  console.log(`Total live cost: $${totalCost.toFixed(4)} across ${rows.length} calls`);
  console.log(`Wrote ${RESULTS}/live.{json,csv}`);
  return rows;
};

// ---------- 3. JUDGE ----------

const JUDGE_SYSTEM = `You are an evaluation judge. You receive an agent persona, a user prompt, the rubric, and the agent's response.
Score on four 0-5 axes and return STRICT JSON, nothing else:

{
  "rubric": <0-5 int>,        // how many rubric concepts are addressed correctly (5 = all, 0 = none)
  "persona": <0-5 int>,       // how well the response matches the agent's described persona/voice (5 = strong match, 0 = generic)
  "grounding": <0-5 int>,     // for in-domain: technical correctness and specificity (5 = expert, 0 = wrong/vague). For out-of-domain: 0.
  "redirect": <0|1>,          // 1 if response correctly suggests another balkan-* agent (only meaningful for out-of-domain). 0 otherwise.
  "notes": "<one short sentence>"
}

Be strict. Vague keyword-matching without real technical content scores 1-2 on rubric.`;

const buildJudgePrompt = (agent, tc, response) => {
  const rubricText = tc.rubric.length ? tc.rubric.join(", ") : "(none — out-of-domain)";
  const expectedRedirect = tc.kind === "out-of-domain" ? `Expected redirect to: balkan-${tc.redirectTo}` : "N/A (in-domain)";
  return `AGENT: ${agent.fullName} — ${agent.role}
PERSONA: ${agent.character}
KIND: ${tc.kind}
RUBRIC TERMS (concepts to look for): ${rubricText}
${expectedRedirect}

USER PROMPT:
${tc.prompt}

AGENT RESPONSE:
${response}

Return JSON only.`;
};

const runJudge = async (liveRows) => {
  const p = await loadProvider();
  // For claude-cli, keep the historical default of haiku for the judge.
  // For other providers, use the agent model unless --judge-model overrides.
  const judgeModel = JUDGE_MODEL || (p.name === "claude-cli" ? "haiku" : (MODEL || p.defaultModel));
  console.log(`\n=== JUDGE === (model: ${judgeModel})`);
  const rows = [];
  let totalCost = 0;

  for (let i = 0; i < liveRows.length; i++) {
    const lr = liveRows[i];
    if (!lr.ok || !lr.response) {
      rows.push({ ...lr, rubric: 0, persona: 0, grounding: 0, redirect: 0, notes: "skip: failed live call", judgeCost: 0 });
      continue;
    }
    const agent = AGENTS.find((a) => a.name === lr.agent);
    const tc = TEST_CASES[lr.agent][lr.caseIndex];
    process.stdout.write(`  judging ${lr.agent} [${lr.caseIndex + 1}] ${lr.kind.padEnd(13)} ... `);
    try {
      const result = await runInference(JUDGE_SYSTEM, buildJudgePrompt(agent, tc, lr.response), { model: judgeModel, budget: BUDGET });
      totalCost += result.total_cost_usd || 0;
      const text = (result.result || "").trim();
      // Strip code fences if any
      const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
      let scored;
      try {
        scored = JSON.parse(cleaned);
      } catch {
        // try to find first {...} block
        const m = cleaned.match(/\{[\s\S]*\}/);
        scored = m ? JSON.parse(m[0]) : { rubric: 0, persona: 0, grounding: 0, redirect: 0, notes: "parse-fail" };
      }
      rows.push({
        agent: lr.agent,
        caseIndex: lr.caseIndex,
        kind: lr.kind,
        prompt: lr.prompt,
        rubric: scored.rubric ?? 0,
        persona: scored.persona ?? 0,
        grounding: scored.grounding ?? 0,
        redirect: scored.redirect ?? 0,
        notes: (scored.notes || "").slice(0, 200),
        liveCostUSD: lr.costUSD,
        liveOutputTokens: lr.outputTokens,
        judgeCostUSD: result.total_cost_usd || 0,
      });
      console.log(`r=${scored.rubric} p=${scored.persona} g=${scored.grounding} ${tc.kind === "out-of-domain" ? `redir=${scored.redirect}` : ""}`);
    } catch (e) {
      rows.push({ agent: lr.agent, caseIndex: lr.caseIndex, kind: lr.kind, prompt: lr.prompt, rubric: 0, persona: 0, grounding: 0, redirect: 0, notes: `judge-error: ${e.message}`, liveCostUSD: lr.costUSD, liveOutputTokens: lr.outputTokens, judgeCostUSD: 0 });
      console.log(`✗ ${e.message}`);
    }
  }

  writeJSON("judge", rows);
  writeCSV("judge", rows);
  console.log(`Total judge cost: $${totalCost.toFixed(4)}`);
  console.log(`Wrote ${RESULTS}/judge.{json,csv}`);
  return rows;
};

// ---------- 4. SUMMARY ----------

const summarize = (staticRows, liveRows, judgeRows) => {
  console.log("\n=== SUMMARY ===");
  const byAgent = {};
  for (const a of targetAgents) byAgent[a.name] = { agent: a.name, fullName: a.fullName };

  if (staticRows) {
    for (const r of staticRows) {
      if (!byAgent[r.agent]) continue;
      Object.assign(byAgent[r.agent], {
        sysTokens: r.systemPromptTokens,
        kbTokens: r.knowledgeTokens,
        totalTokens: r.totalContextTokens,
        staticIssues: r.issues,
      });
    }
  }
  if (liveRows && liveRows.length) {
    for (const a of targetAgents) {
      const rows = liveRows.filter((r) => r.agent === a.name && r.ok);
      if (!rows.length) continue;
      const avgOut = Math.round(rows.reduce((s, r) => s + r.outputTokens, 0) / rows.length);
      const avgCost = rows.reduce((s, r) => s + r.costUSD, 0) / rows.length;
      const avgMs = Math.round(rows.reduce((s, r) => s + r.durationMs, 0) / rows.length);
      Object.assign(byAgent[a.name], {
        avgOutTokens: avgOut,
        avgCostUSD: +avgCost.toFixed(5),
        avgLatencyMs: avgMs,
        liveOk: rows.length,
        liveTotal: liveRows.filter((r) => r.agent === a.name).length,
      });
    }
  }
  if (judgeRows && judgeRows.length) {
    for (const a of targetAgents) {
      const inDomain = judgeRows.filter((r) => r.agent === a.name && r.kind === "in-domain");
      const outDomain = judgeRows.filter((r) => r.agent === a.name && r.kind === "out-of-domain");
      const avg = (xs, k) => (xs.length ? +(xs.reduce((s, r) => s + r[k], 0) / xs.length).toFixed(2) : 0);
      Object.assign(byAgent[a.name], {
        rubricInDomain: avg(inDomain, "rubric"),
        groundingInDomain: avg(inDomain, "grounding"),
        personaAvg: avg([...inDomain, ...outDomain], "persona"),
        redirectRate: outDomain.length ? +(outDomain.filter((r) => r.redirect === 1).length / outDomain.length).toFixed(2) : null,
      });
    }
  }

  const summary = Object.values(byAgent);
  writeJSON("summary", summary);
  writeCSV("summary", summary);
  console.log(`Wrote ${RESULTS}/summary.{json,csv}`);
  console.table(summary);
};

// ---------- main ----------

(async () => {
  let staticRows, liveRows, judgeRows;

  if (RUN_STATIC) staticRows = runStatic();
  else if (existsSync(join(RESULTS, "static.json"))) {
    staticRows = JSON.parse(readFileSync(join(RESULTS, "static.json"), "utf-8"));
  }

  if (RUN_LIVE) liveRows = await runLive();
  else if (existsSync(join(RESULTS, "live.json"))) {
    liveRows = JSON.parse(readFileSync(join(RESULTS, "live.json"), "utf-8"));
  }

  if (RUN_JUDGE) {
    if (!liveRows || liveRows.length === 0) {
      console.error("--judge requires live results. Run with --live first.");
      process.exit(1);
    }
    judgeRows = await runJudge(liveRows);
  } else if (existsSync(join(RESULTS, "judge.json"))) {
    judgeRows = JSON.parse(readFileSync(join(RESULTS, "judge.json"), "utf-8"));
  }

  summarize(staticRows, liveRows, judgeRows);
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
