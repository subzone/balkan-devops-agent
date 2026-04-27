// GitHub Models provider: HTTPS calls to GitHub's OpenAI-compatible inference endpoint.
// Auth: GITHUB_TOKEN (or a PAT with `models:read`). In Actions, request the permission:
//   permissions:
//     models: read
//
// Endpoint and catalog: https://github.com/marketplace/models

const ENDPOINT = process.env.GITHUB_MODELS_ENDPOINT || "https://models.github.ai/inference";

export const name = "github-models";

// Cheap default — small, fast, free quota. Override with --model if you want something stronger.
export const defaultModel = "openai/gpt-4o-mini";

// GH Models doesn't expose per-call pricing in the response, so we estimate against a
// small lookup. Numbers are rough — use them for relative comparison, not invoicing.
const PRICE_PER_M_TOKENS = {
  // model id : [input $/1M, output $/1M]   — defaults if unknown
  "openai/gpt-4o-mini": [0.15, 0.60],
  "openai/gpt-4o": [2.50, 10.00],
  "openai/gpt-4.1-mini": [0.40, 1.60],
  "openai/gpt-4.1": [2.00, 8.00],
  "openai/o4-mini": [1.10, 4.40],
  "meta/Llama-3.3-70B-Instruct": [0.10, 0.30],
};

const estimateCost = (model, inTok, outTok) => {
  const [pi, po] = PRICE_PER_M_TOKENS[model] || [0, 0];
  return (inTok / 1_000_000) * pi + (outTok / 1_000_000) * po;
};

export const run = async (systemPrompt, userPrompt, { model = defaultModel, budget = 0.05, signal } = {}) => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN is not set. In Actions: 'permissions: { models: read }'. Locally: export a PAT with models:read.");
  }

  const body = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    // Keep responses bounded so a runaway agent can't blow the rate-limit quota.
    max_tokens: 2000,
    temperature: 0.7,
  };

  const res = await fetch(`${ENDPOINT}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub Models ${res.status}: ${text.slice(0, 400)}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  const result = choice?.message?.content || "";
  const usage = data.usage || {};
  const inTok = usage.prompt_tokens || 0;
  const outTok = usage.completion_tokens || 0;

  return {
    result,
    is_error: !result,
    total_cost_usd: estimateCost(model, inTok, outTok),
    usage: {
      input_tokens: inTok,
      output_tokens: outTok,
      cache_creation_input_tokens: 0,
    },
    errors: [],
    finish_reason: choice?.finish_reason,
  };
};
