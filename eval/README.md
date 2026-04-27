# Balkan DevOps Agents — Eval Harness

Evaluates the 10 agents on four axes: **rubric correctness, persona fidelity, technical grounding, redirect behavior**, plus token / cost / latency.

## How it works

1. **Static** — token estimates and structure lint over the prompt + knowledge base. No API calls, no cost.
2. **Live** — runs each agent's compiled system prompt (matches what `claudecode-generator.ts` writes) against a fixed set of test prompts via the `claude` CLI you're already authenticated with. No separate API key needed.
3. **Judge** — an LLM judge (Haiku) scores each response 0–5 on rubric/persona/grounding and 0/1 on redirect-correctness for out-of-domain prompts.

Test cases live in [test-cases.mjs](test-cases.mjs) — three per agent (2 in-domain, 1 out-of-domain).

## Run

```sh
# 1. Compile the project so the harness can load AGENTS
npm run compile

# 2. Static only (free, instant)
node eval/run-eval.mjs --static

# 3. Live + judge on one agent locally via your claude CLI auth
node eval/run-eval.mjs --live --judge --agents sima

# 4. Full sweep, local
node eval/run-eval.mjs --all

# 5. Same sweep using GitHub Models (works in CI)
GITHUB_TOKEN=ghp_... node eval/run-eval.mjs --all --provider github-models --model openai/gpt-4o-mini
```

### Flags

| Flag | Default | Meaning |
|---|---|---|
| `--static` | | Run static layer |
| `--live` | | Run live layer |
| `--judge` | | Run LLM judge over live results |
| `--all` | | All three |
| `--agents x,y` | all | Comma-separated agent names |
| `--limit N` | all | Cap test cases per agent |
| `--provider name` | `claude-cli` | `claude-cli` (local OAuth) or `github-models` (token-based, CI) |
| `--model id` | provider default | Model id passed to the provider |
| `--judge-model id` | matches agent model | Model used by the judge |
| `--budget USD` | `0.05` | Per-call max budget (claude-cli only) |

### Providers

- **`claude-cli`** — shells out to your locally authenticated `claude` CLI. Best fidelity (mirrors the Claude Code experience), but doesn't work in CI.
- **`github-models`** — POSTs to `https://models.github.ai/inference` using `GITHUB_TOKEN`. Free quota, works in Actions with `permissions: { models: read }`. Catalog: see [GitHub Marketplace › Models](https://github.com/marketplace/models).

To test the GitHub Models provider locally, your token needs the `models:read` scope:

```sh
gh auth refresh -s models:read
export GITHUB_TOKEN=$(gh auth token)
node eval/run-eval.mjs --all --provider github-models --model openai/gpt-4o-mini
```

## Output

All artifacts go to `eval/results/`:

- `static.{json,csv}` — token / structure metrics per agent
- `live.{json,csv}` — one row per (agent, prompt) call: response, tokens, cost, latency
- `judge.{json,csv}` — one row per call: rubric/persona/grounding/redirect scores
- `summary.{json,csv}` — one row per agent: avg cost/latency/scores

## What good looks like

- **rubricInDomain ≥ 4** — the agent reliably hits expected technical concepts
- **personaAvg ≥ 4** — voice survives across response types
- **groundingInDomain ≥ 3.5** — answers are concrete, not generic platitudes
- **redirectRate ≥ 0.8** — agents redirect out-of-domain prompts to the right peer

If `kbTokens > 8000` for an agent that scores poorly, the knowledge file is bloated noise rather than usable signal — trim it.

## CI

[.github/workflows/eval.yml](../.github/workflows/eval.yml) runs the full sweep:

- **Nightly** at 04:00 UTC against `main` — establishes a rolling baseline.
- **On PR** when `src/agents.ts`, `knowledge/**`, or `eval/**` changes — posts a sticky comment with the score table.
- **Manual** via `workflow_dispatch` with optional `model` and `agents` inputs.

Uses `github-models` provider with `openai/gpt-4o-mini` by default (free, fast). Auth is the auto-provided `GITHUB_TOKEN` with `models: read` permission — no secrets needed.

[eval/check-thresholds.mjs](check-thresholds.mjs) fails the run if any agent drops below threshold (rubric ≥ 3.0, redirect ≥ 0.5). Tighten these once you have a few green runs as a baseline.

## Caveats

- LLM-as-judge is biased toward keyword matching. For hard calls, spot-check `live.json` directly.
- Three test cases per agent is light. Add more in `test-cases.mjs` once you trust the harness.
- The harness uses `--disable-slash-commands --setting-sources ""` to keep input-token cost low; if you want to test agents inside the full Claude Code harness (skills, memory, etc.), drop those flags.
