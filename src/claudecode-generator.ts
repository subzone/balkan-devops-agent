import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { AGENTS, AgentDefinition } from "./agents";

const CLAUDE_USER_AGENTS_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || "~",
  ".claude",
  "agents"
);

function escapeYaml(value: string): string {
  return value.replace(/"/g, '\\"').replace(/\n/g, " ").trim();
}

function generateAgentMarkdown(agent: AgentDefinition, knowledgeBase: string | null): string {
  const description = escapeYaml(
    `${agent.role} — ${agent.character} Pozovi kad korisnik traži pomoć oko: ${agent.role.toLowerCase()}.`
  );

  const frontmatter = [
    "---",
    `name: balkan-${agent.name}`,
    `description: "${description}"`,
    "---",
    "",
  ].join("\n");

  let body = `# ${agent.fullName} — ${agent.role}\n\n`;
  body += `## Karakter\n${agent.character}\n\n`;
  body += `## System Prompt\n${agent.systemPrompt}\n\n`;
  body += `## Pravila\n`;
  body += `- Odgovaraš na srpskom jeziku\n`;
  body += `- Tehničke termine (nazive servisa, komande, kod) ostavljaš na engleskom\n`;
  body += `- Uvek ostani u karakteru — nikad ne izlazi iz role\n`;
  body += `- Daješ tehnički precizne odgovore u svom karakteru\n\n`;
  body += `## Drugi agenti\n`;
  body += `Ako pitanje nije iz tvoje oblasti, preporuči relevantnog agenta:\n`;
  body += `- Troškovi/FinOps → balkan-sima\n`;
  body += `- Security/IAM → balkan-mile\n`;
  body += `- Arhitektura → balkan-zika\n`;
  body += `- Debugging/Logs → balkan-toza\n`;
  body += `- Cleanup/Data → balkan-steva\n`;
  body += `- Refactoring → balkan-uske\n`;
  body += `- Encryption → balkan-joca\n`;
  body += `- Big Data → balkan-gile\n`;
  body += `- Workarounds → balkan-laki\n`;
  body += `- Auditing → balkan-moma\n`;

  if (knowledgeBase) {
    body += `\n## Knowledge Base\n${knowledgeBase}`;
  }

  return frontmatter + body;
}

async function loadKnowledgeBase(agentName: string): Promise<string | null> {
  const extPath = vscode.extensions.getExtension("subzone.balkan-devops-agents")?.extensionPath;
  if (!extPath) return null;

  const knowledgeDir = path.join(extPath, "knowledge", agentName);
  if (!fs.existsSync(knowledgeDir)) return null;

  let content = "";
  for (const file of fs.readdirSync(knowledgeDir)) {
    if (file.endsWith(".md")) {
      content += "\n\n" + fs.readFileSync(path.join(knowledgeDir, file), "utf-8");
    }
  }
  return content || null;
}

async function pickAgents(): Promise<AgentDefinition[] | undefined> {
  const items = AGENTS.map((a) => ({
    label: `${a.fullName}`,
    description: a.role,
    detail: a.character,
    picked: true,
    agent: a,
  }));

  const selected = await vscode.window.showQuickPick(items, {
    canPickMany: true,
    placeHolder: "Izaberi agente za generisanje (svi su selektovani)",
    title: "Balkan DevOps — Izbor agenata za Claude Code",
  });

  return selected?.map((s) => s.agent);
}

async function writeAgentFiles(targetDir: string, agents: AgentDefinition[]): Promise<number> {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  let count = 0;
  for (const agent of agents) {
    const kb = await loadKnowledgeBase(agent.name);
    const content = generateAgentMarkdown(agent, kb);
    const filePath = path.join(targetDir, `balkan-${agent.name}.md`);
    fs.writeFileSync(filePath, content, "utf-8");
    count++;
  }
  return count;
}

export async function installClaudeCodeUserAgents() {
  const agents = await pickAgents();
  if (!agents || agents.length === 0) return;

  const confirm = await vscode.window.showWarningMessage(
    `Generisaćemo ${agents.length} subagent fajl(ova) u ~/.claude/agents/. Postojeći fajlovi sa istim imenom će biti prepisani.`,
    { modal: true },
    "Generiši"
  );
  if (confirm !== "Generiši") return;

  const count = await writeAgentFiles(CLAUDE_USER_AGENTS_DIR, agents);

  vscode.window.showInformationMessage(
    `✅ Generisano ${count} Claude Code subagent(a) u ~/.claude/agents/. Pozovi sa @balkan-${agents[0].name} ili pusti Claude Code da automatski rutira.`
  );
}

export async function installClaudeCodeProjectAgents() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage("Nema otvorenog workspace-a.");
    return;
  }

  let targetFolder = workspaceFolders[0].uri.fsPath;
  if (workspaceFolders.length > 1) {
    const picked = await vscode.window.showWorkspaceFolderPick({
      placeHolder: "Izaberi workspace folder za .claude/agents/",
    });
    if (!picked) return;
    targetFolder = picked.uri.fsPath;
  }

  const agents = await pickAgents();
  if (!agents || agents.length === 0) return;

  const agentsDir = path.join(targetFolder, ".claude", "agents");

  const confirm = await vscode.window.showWarningMessage(
    `Generisaćemo ${agents.length} subagent fajl(ova) u ${path.relative(targetFolder, agentsDir)}/. Postojeći fajlovi sa istim imenom će biti prepisani.`,
    { modal: true },
    "Generiši"
  );
  if (confirm !== "Generiši") return;

  const count = await writeAgentFiles(agentsDir, agents);

  vscode.window.showInformationMessage(
    `✅ Generisano ${count} Claude Code subagent(a) u .claude/agents/. Commituj u git da podeliš sa timom.`
  );
}

export async function installClaudeCode() {
  const choice = await vscode.window.showQuickPick(
    [
      {
        label: "👤 User Level — Subagents",
        description: "~/.claude/agents/",
        detail: "Pozivaj agente sa @balkan-{ime} u Claude Code chatu. Radi u svim projektima.",
        target: "user",
      },
      {
        label: "📁 Project Level — Subagents",
        description: ".claude/agents/",
        detail: "Agenti se automatski učitavaju u ovom projektu. Deli se sa timom preko git-a.",
        target: "project",
      },
      {
        label: "🔄 Oba",
        description: "User + Project agents",
        detail: "Instaliraj na oba mesta.",
        target: "both",
      },
    ],
    {
      placeHolder: "Gde da instaliramo Balkan DevOps agente za Claude Code?",
      title: "Balkan DevOps → Claude Code",
    }
  );

  if (!choice) return;

  if (choice.target === "user" || choice.target === "both") {
    await installClaudeCodeUserAgents();
  }
  if (choice.target === "project" || choice.target === "both") {
    await installClaudeCodeProjectAgents();
  }
}
