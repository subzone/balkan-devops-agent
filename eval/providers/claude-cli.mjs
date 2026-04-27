// Local provider: shells out to the `claude` CLI using the user's existing OAuth.
// Works on a developer's machine; does NOT work in CI.

import { spawn } from "node:child_process";

export const name = "claude-cli";

// Default model alias when the caller passes nothing.
export const defaultModel = "haiku";

export const run = (systemPrompt, userPrompt, { model = defaultModel, budget = 0.05 } = {}) => {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "claude",
      [
        "-p",
        "--tools", "",
        "--disable-slash-commands",
        "--output-format", "json",
        "--no-session-persistence",
        "--max-budget-usd", String(budget),
        "--model", model,
        "--setting-sources", "",
        "--system-prompt", systemPrompt,
        userPrompt,
      ],
      { cwd: "/tmp", env: { ...process.env, NO_COLOR: "1" } }
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("close", (code) => {
      if (code !== 0 && !stdout) {
        return reject(new Error(`claude exited ${code}: ${stderr.slice(0, 500)}`));
      }
      try {
        const r = JSON.parse(stdout);
        // Normalize to provider-agnostic shape
        resolve({
          result: r.result || "",
          is_error: !!r.is_error,
          total_cost_usd: r.total_cost_usd || 0,
          usage: {
            input_tokens: r.usage?.input_tokens || 0,
            output_tokens: r.usage?.output_tokens || 0,
            cache_creation_input_tokens: r.usage?.cache_creation_input_tokens || 0,
          },
          errors: r.errors || [],
        });
      } catch (e) {
        reject(new Error(`bad JSON from claude: ${stdout.slice(0, 300)}`));
      }
    });
  });
};
