import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { AGENTS, AgentDefinition } from "./agents";

const AMAZONQ_PROMPTS_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || "~",
  ".aws",
  "amazonq",
  "prompts"
);

function generatePromptContent(agent: AgentDefinition): string {
  return `# ${agent.fullName} — ${agent.role}

${agent.systemPrompt}

## Karakter
${agent.character}

## Pravila
- Odgovaraš na srpskom jeziku
- Tehničke termine (nazive servisa, komande, kod) ostavljaš na engleskom
- Uvek ostani u karakteru — nikad ne izlazi iz role
- Daješ tehnički precizne odgovore u svom karakteru

## Drugi agenti
Ako pitanje nije iz tvoje oblasti, preporuči relevantnog agenta:
- Troškovi/FinOps → @prompt sima
- Security/IAM → @prompt mile
- Arhitektura → @prompt zika
- Debugging/Logs → @prompt toza
- Cleanup/Data → @prompt steva
- Refactoring → @prompt uske
- Encryption → @prompt joca
- Big Data → @prompt gile
- Workarounds → @prompt laki
- Auditing → @prompt moma
`;
}

function generateRuleContent(agent: AgentDefinition): string {
  return `# ${agent.fullName} — ${agent.role}

Kada korisnik pomene "${agent.name}" ili traži pomoć oko ${agent.role.toLowerCase()}, odgovaraj u sledećem stilu:

## Karakter
${agent.character}

## Ekspertiza
${agent.systemPrompt}

## Ton komunikacije
- Srpski jezik, tehnički termini na engleskom
- Ostani u karakteru
`;
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
    title: "Balkan DevOps — Izbor agenata",
  });

  return selected?.map((s) => s.agent);
}

export async function installUserPrompts() {
  const agents = await pickAgents();
  if (!agents || agents.length === 0) return;

  const confirm = await vscode.window.showWarningMessage(
    `Generisaćemo ${agents.length} saved prompt(s) u ~/.aws/amazonq/prompts/. Postojeći fajlovi sa istim imenom će biti prepisani.`,
    { modal: true },
    "Generiši"
  );
  if (confirm !== "Generiši") return;

  if (!fs.existsSync(AMAZONQ_PROMPTS_DIR)) {
    fs.mkdirSync(AMAZONQ_PROMPTS_DIR, { recursive: true });
  }

  let count = 0;
  for (const agent of agents) {
    let content = generatePromptContent(agent);
    const kb = await loadKnowledgeBase(agent.name);
    if (kb) {
      content += `\n## Knowledge Base\n${kb}`;
    }

    const filePath = path.join(AMAZONQ_PROMPTS_DIR, `${agent.name}.md`);
    fs.writeFileSync(filePath, content, "utf-8");
    count++;
  }

  vscode.window.showInformationMessage(
    `✅ Generisano ${count} Amazon Q prompt(s) u ~/.aws/amazonq/prompts/. Koristi @prompt ${agents[0].name} u Amazon Q chatu.`
  );
}

export async function installRepoRules() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage("Nema otvorenog workspace-a.");
    return;
  }

  let targetFolder = workspaceFolders[0].uri.fsPath;
  if (workspaceFolders.length > 1) {
    const picked = await vscode.window.showWorkspaceFolderPick({
      placeHolder: "Izaberi workspace folder za .amazonq/rules/",
    });
    if (!picked) return;
    targetFolder = picked.uri.fsPath;
  }

  const agents = await pickAgents();
  if (!agents || agents.length === 0) return;

  const rulesDir = path.join(targetFolder, ".amazonq", "rules");

  const confirm = await vscode.window.showWarningMessage(
    `Generisaćemo ${agents.length} rule fajl(ova) u ${path.relative(targetFolder, rulesDir)}/. Postojeći fajlovi sa istim imenom će biti prepisani.`,
    { modal: true },
    "Generiši"
  );
  if (confirm !== "Generiši") return;

  if (!fs.existsSync(rulesDir)) {
    fs.mkdirSync(rulesDir, { recursive: true });
  }

  let count = 0;
  for (const agent of agents) {
    let content = generateRuleContent(agent);
    const kb = await loadKnowledgeBase(agent.name);
    if (kb) {
      content += `\n## Knowledge Base\n${kb}`;
    }

    const filePath = path.join(rulesDir, `balkan-${agent.name}.md`);
    fs.writeFileSync(filePath, content, "utf-8");
    count++;
  }

  vscode.window.showInformationMessage(
    `✅ Generisano ${count} rule fajl(ova) u .amazonq/rules/. Automatski se dodaju u svaki Amazon Q chat request.`
  );
}

export async function installAmazonQ() {
  const choice = await vscode.window.showQuickPick(
    [
      {
        label: "👤 User Level — Saved Prompts",
        description: "~/.aws/amazonq/prompts/",
        detail: "Pozivaj agente sa @prompt ime u Amazon Q chatu. Radi u svim projektima.",
        target: "user",
      },
      {
        label: "📁 Repo Level — Workspace Rules",
        description: ".amazonq/rules/",
        detail: "Agenti se automatski dodaju kao kontekst u ovom projektu. Deli se sa timom preko git-a.",
        target: "repo",
      },
      {
        label: "🔄 Oba",
        description: "User prompts + Repo rules",
        detail: "Instaliraj i saved prompts i workspace rules.",
        target: "both",
      },
    ],
    {
      placeHolder: "Gde da instaliramo Balkan DevOps agente?",
      title: "Balkan DevOps → Amazon Q / Kiro",
    }
  );

  if (!choice) return;

  if (choice.target === "user" || choice.target === "both") {
    await installUserPrompts();
  }
  if (choice.target === "repo" || choice.target === "both") {
    await installRepoRules();
  }
}
