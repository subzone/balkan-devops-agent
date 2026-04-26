import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { AGENTS, AgentDefinition } from "./agents";

const ANTIGRAVITY_KNOWLEDGE_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || "~",
  ".gemini",
  "antigravity",
  "knowledge"
);

function generateAgentMarkdown(agent: AgentDefinition, knowledgeBase: string | null): string {
  let body = `# Persona: ${agent.fullName} — ${agent.role}\n\n`;
  body += `## Karakter\n${agent.character}\n\n`;
  body += `## System Prompt (Ekspertiza)\n${agent.systemPrompt}\n\n`;
  body += `## Pravila Komunikacije\n`;
  body += `- Obavezno odgovaraj na **srpskom jeziku** (osim tehničkih termina koji ostaju na engleskom).\n`;
  body += `- Tvoj jedini cilj je da ispuniš zahteve korisnika, ali **isključivo iz ugla svog karaktera**.\n`;
  body += `- Nikad ne izlazi iz role. Zadrži svoj specifičan ton, rečnik i način izražavanja iz opisa karaktera.\n\n`;
  body += `## Drugi agenti\n`;
  body += `Ako korisnik postavi pitanje koje nije iz tvoje oblasti, preporuči relevantnog agenta iz Balkan DevOps tima:\n`;
  body += `- Troškovi/FinOps → Sima Krvopija (balkan-sima)\n`;
  body += `- Security/IAM → Mile Pacov (balkan-mile)\n`;
  body += `- Arhitektura → Žika Kurta (balkan-zika)\n`;
  body += `- Debugging/Logs → Toza Vampir (balkan-toza)\n`;
  body += `- Cleanup/Data → Steva Đubre (balkan-steva)\n`;
  body += `- Refactoring → Uške Satara (balkan-uske)\n`;
  body += `- Encryption → Joca Mutni (balkan-joca)\n`;
  body += `- Big Data → Gile Zver (balkan-gile)\n`;
  body += `- Workarounds → Laki Zmija (balkan-laki)\n`;
  body += `- Auditing → Moma Špijun (balkan-moma)\n`;

  if (knowledgeBase) {
    body += `\n## Specifična Baza Znanja\n${knowledgeBase}`;
  }

  return body;
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
    title: "Balkan DevOps — Izbor agenata za Antigravity",
  });

  return selected?.map((s) => s.agent);
}

export async function installAntigravityAgents() {
  const agents = await pickAgents();
  if (!agents || agents.length === 0) return;

  const confirm = await vscode.window.showWarningMessage(
    `Generisaćemo ${agents.length} Knowledge Items (KIs) u ~/.gemini/antigravity/knowledge/. Postojeći folderi sa istim imenom će biti prepisani.`,
    { modal: true },
    "Generiši"
  );
  if (confirm !== "Generiši") return;

  if (!fs.existsSync(ANTIGRAVITY_KNOWLEDGE_DIR)) {
    fs.mkdirSync(ANTIGRAVITY_KNOWLEDGE_DIR, { recursive: true });
  }

  let count = 0;
  for (const agent of agents) {
    const kb = await loadKnowledgeBase(agent.name);
    const content = generateAgentMarkdown(agent, kb);
    
    const agentKIDir = path.join(ANTIGRAVITY_KNOWLEDGE_DIR, `balkan-${agent.name}`);
    const agentArtifactsDir = path.join(agentKIDir, "artifacts");
    
    if (!fs.existsSync(agentArtifactsDir)) {
      fs.mkdirSync(agentArtifactsDir, { recursive: true });
    }

    // Write metadata.json
    const metadata = {
      summary: `Uputstvo, karakter i ekspertiza za Balkan DevOps agenta: ${agent.fullName} (${agent.role})`,
      references: [
        "https://github.com/subzone/balkan-devops-agents"
      ],
      createdAt: new Date().toISOString()
    };
    fs.writeFileSync(path.join(agentKIDir, "metadata.json"), JSON.stringify(metadata, null, 2), "utf-8");

    // Write artifact markdown
    fs.writeFileSync(path.join(agentArtifactsDir, "agent.md"), content, "utf-8");
    count++;
  }

  vscode.window.showInformationMessage(
    `✅ Generisano ${count} Antigravity Knowledge Items (KIs) u ~/.gemini/antigravity/knowledge/.`
  );
}
