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
exports.installAntigravityAgents = installAntigravityAgents;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const agents_1 = require("./agents");
const ANTIGRAVITY_KNOWLEDGE_DIR = path.join(process.env.HOME || process.env.USERPROFILE || "~", ".gemini", "antigravity", "knowledge");
function generateAgentMarkdown(agent, knowledgeBase) {
    let body = `# Persona: ${agent.fullName} — ${agent.role}\n\n`;
    body += `## Karakter\n${agent.character}\n\n`;
    body += `## System Prompt (Ekspertiza)\n${agent.systemPrompt}\n\n`;
    body += `## Pravila Komunikacije\n`;
    body += `- Obavezno odgovaraj na **srpskom jeziku** (osim tehničkih termina koji ostaju na engleskom).\n`;
    body += `- Tvoj jedini cilj je da ispuniš zahteve korisnika, ali **isključivo iz ugla svog karaktera**.\n`;
    body += `- Nikad ne izlazi iz role. Zadrži svoj specifičan ton, rečnik i način izražavanja iz opisa karaktera.\n`;
    body += `- **VAŽNO**: Pre odgovora proveri rutiranje ispod. Ako pitanje primarno spada u tuđu ekspertizu, preporuči tog agenta i **STANI** — ne odgovaraj sam, čak i ako tema dotiče tvoju oblast.\n\n`;
    body += `## Drugi agenti\n`;
    body += `Rutiraj ka odgovarajućem agentu iz Balkan DevOps tima (u zagradama su ključne reči koje pokazuju da pitanje pripada tom agentu):\n`;
    body += `- Troškovi (cost, billing, RI, Spot, Reserved, FinOps, ušteda) → Sima Krvopija (balkan-sima)\n`;
    body += `- Security/Pentest (penetration test, security scan, IAM permission gap, tfsec, exposed port) → Mile Pacov (balkan-mile)\n`;
    body += `- Arhitektura (microservices design, multi-region, Well-Architected, arhitektura review) → Žika Kurta (balkan-zika)\n`;
    body += `- Debugging/Logovi (debugging, stack trace, OOM, log analysis, APM, memory leak) → Toza Vampir (balkan-toza)\n`;
    body += `- Čišćenje (cleanup, lifecycle policy, brisanje, prune, VACUUM) → Steva Đubre (balkan-steva)\n`;
    body += `- Refactoring (dead code, complexity, Dockerfile optimize) → Uške Satara (balkan-uske)\n`;
    body += `- Šifrovanje (encryption, secrets, certificates, PII masking, maskiranje podataka, KMS, Vault) → Joca Mutni (balkan-joca)\n`;
    body += `- Big Data (Spark, Kafka, Hadoop, ETL, GPU compute) → Gile Zver (balkan-gile)\n`;
    body += `- Workaround/Legacy (legacy bridge, workaround, hack, SOAP-to-REST, migration) → Laki Zmija (balkan-laki)\n`;
    body += `- Auditing (audit log, CloudTrail, Activity Log, ko je promenio, compliance trail) → Moma Špijun (balkan-moma)\n`;
    if (knowledgeBase) {
        body += `\n## Specifična Baza Znanja\n${knowledgeBase}`;
    }
    return body;
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
        title: "Balkan DevOps — Izbor agenata za Antigravity",
    });
    return selected?.map((s) => s.agent);
}
async function installAntigravityAgents() {
    const agents = await pickAgents();
    if (!agents || agents.length === 0)
        return;
    const confirm = await vscode.window.showWarningMessage(`Generisaćemo ${agents.length} Knowledge Items (KIs) u ~/.gemini/antigravity/knowledge/. Postojeći folderi sa istim imenom će biti prepisani.`, { modal: true }, "Generiši");
    if (confirm !== "Generiši")
        return;
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
    vscode.window.showInformationMessage(`✅ Generisano ${count} Antigravity Knowledge Items (KIs) u ~/.gemini/antigravity/knowledge/.`);
}
//# sourceMappingURL=antigravity-generator.js.map