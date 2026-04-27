"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.installClaudeCodeUserAgents = installClaudeCodeUserAgents;
exports.installClaudeCodeProjectAgents = installClaudeCodeProjectAgents;
exports.installClaudeCode = installClaudeCode;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const agents_1 = require("./agents");
const CLAUDE_USER_AGENTS_DIR = path.join(process.env.HOME || process.env.USERPROFILE || "~", ".claude", "agents");
function escapeYaml(value) {
    return value.replace(/"/g, '\\"').replace(/\n/g, " ").trim();
}
function generateAgentMarkdown(agent, knowledgeBase) {
    const description = escapeYaml(`${agent.role} — ${agent.character} Pozovi kad korisnik traži pomoć oko: ${agent.role.toLowerCase()}.`);
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
    if (knowledgeBase) {
        body += `\n## Knowledge Base\n${knowledgeBase}`;
    }
    return frontmatter + body;
}
async function loadKnowledgeBase(agentName) {
    const extPath = vscode.extensions.getExtension("subzone.balkan-devops-agents")?.extensionPath;
    if (!extPath)
        return null;
    const knowledgeDir = path.join(extPath, "knowledge", agentName);
    if (!fs.existsSync(knowledgeDir))
        return null;
    let content = "";
    for (const file of fs.readdirSync(knowledgeDir)) {
        if (file.endsWith(".md")) {
            content += "\n\n" + fs.readFileSync(path.join(knowledgeDir, file), "utf-8");
        }
    }
    return content || null;
}
async function pickAgents() {
    const items = agents_1.AGENTS.map((a) => ({
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
async function writeAgentFiles(targetDir, agents) {
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
async function installClaudeCodeUserAgents() {
    const agents = await pickAgents();
    if (!agents || agents.length === 0)
        return;
    const confirm = await vscode.window.showWarningMessage(`Generisaćemo ${agents.length} subagent fajl(ova) u ~/.claude/agents/. Postojeći fajlovi sa istim imenom će biti prepisani.`, { modal: true }, "Generiši");
    if (confirm !== "Generiši")
        return;
    const count = await writeAgentFiles(CLAUDE_USER_AGENTS_DIR, agents);
    vscode.window.showInformationMessage(`✅ Generisano ${count} Claude Code subagent(a) u ~/.claude/agents/. Pozovi sa @balkan-${agents[0].name} ili pusti Claude Code da automatski rutira.`);
}
async function installClaudeCodeProjectAgents() {
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
        if (!picked)
            return;
        targetFolder = picked.uri.fsPath;
    }
    const agents = await pickAgents();
    if (!agents || agents.length === 0)
        return;
    const agentsDir = path.join(targetFolder, ".claude", "agents");
    const confirm = await vscode.window.showWarningMessage(`Generisaćemo ${agents.length} subagent fajl(ova) u ${path.relative(targetFolder, agentsDir)}/. Postojeći fajlovi sa istim imenom će biti prepisani.`, { modal: true }, "Generiši");
    if (confirm !== "Generiši")
        return;
    const count = await writeAgentFiles(agentsDir, agents);
    vscode.window.showInformationMessage(`✅ Generisano ${count} Claude Code subagent(a) u .claude/agents/. Commituj u git da podeliš sa timom.`);
}
async function installClaudeCode() {
    const choice = await vscode.window.showQuickPick([
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
    ], {
        placeHolder: "Gde da instaliramo Balkan DevOps agente za Claude Code?",
        title: "Balkan DevOps → Claude Code",
    });
    if (!choice)
        return;
    if (choice.target === "user" || choice.target === "both") {
        await installClaudeCodeUserAgents();
    }
    if (choice.target === "project" || choice.target === "both") {
        await installClaudeCodeProjectAgents();
    }
}
//# sourceMappingURL=claudecode-generator.js.map