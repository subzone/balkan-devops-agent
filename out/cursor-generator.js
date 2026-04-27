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
exports.installCursorUserRules = installCursorUserRules;
exports.installCursorProjectRules = installCursorProjectRules;
exports.installCursorUserAgentsMd = installCursorUserAgentsMd;
exports.installCursorProjectAgentsMd = installCursorProjectAgentsMd;
exports.installCursor = installCursor;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const agents_1 = require("./agents");
const CURSOR_USER_RULES_DIR = path.join(process.env.HOME || process.env.USERPROFILE || "~", ".cursor", "rules");
const CURSOR_USER_AGENTS_MD_PATH = path.join(process.env.HOME || process.env.USERPROFILE || "~", ".cursor", "AGENTS.md");
function yamlEscapeDoubleQuoted(value) {
    return value
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, " ")
        .trim();
}
function generateAgentMdc(agent, knowledgeBase) {
    const description = yamlEscapeDoubleQuoted(`Balkan DevOps — ${agent.fullName} (${agent.role}). Uključi ovu rule kad radiš na temama iz ove oblasti; tehnički termini ostaju na engleskom, odgovori na srpskom.`);
    const frontmatter = [
        "---",
        `description: "${description}"`,
        "alwaysApply: false",
        "---",
        "",
    ].join("\n");
    let body = `# ${agent.fullName} — ${agent.role}\n\n`;
    body += `Kada je ova Cursor rule aktivna, ponašaj se isključivo kao ovaj agent.\n\n`;
    body += `## Karakter\n${agent.character}\n\n`;
    body += `## System Prompt\n${agent.systemPrompt}\n\n`;
    body += `## Pravila\n`;
    body += `- Odgovaraš na srpskom jeziku\n`;
    body += `- Tehničke termine (nazive servisa, komande, kod) ostavljaš na engleskom\n`;
    body += `- Uvek ostani u karakteru — nikad ne izlazi iz role\n`;
    body += `- Daješ tehnički precizne odgovore u svom karakteru\n`;
    body += `- VAŽNO: Pre odgovora proveri rutiranje ispod. Ako pitanje primarno spada u tuđu ekspertizu, preporuči tu rule/agenta i STANI — ne odgovaraj sam, čak i ako tema dotiče tvoju oblast\n\n`;
    body += `## Drugi agenti\n`;
    body += `Rutiraj ka odgovarajućoj Balkan DevOps rule (u zagradama su ključne reči):\n`;
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
        title: "Balkan DevOps — Izbor agenata za Cursor",
    });
    return selected?.map((s) => s.agent);
}
async function writeRuleFiles(targetDir, agents) {
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    let count = 0;
    for (const agent of agents) {
        const kb = await loadKnowledgeBase(agent.name);
        const content = generateAgentMdc(agent, kb);
        const filePath = path.join(targetDir, `balkan-${agent.name}.mdc`);
        fs.writeFileSync(filePath, content, "utf-8");
        count++;
    }
    return count;
}
async function generateAgentsMdContent(agents) {
    let content = `# Balkan DevOps Agents for Cursor\n\n`;
    content += `Ovaj projekat koristi Balkan DevOps agente kao specijalizovane persona-instrukcije za DevOps, cloud, bezbednost, debugging i refactoring.\n\n`;
    content += `Cursor učitava \`.cursor/rules/*.mdc\` kao Project Rules; pojedinačne persona fajlove uključuj kad ti treba odgovarajući ton i ekspertiza.\n\n`;
    content += `Opšta pravila:\n`;
    content += `- Odgovaraj na srpskom jeziku.\n`;
    content += `- Tehničke termine, nazive servisa, komande i kod ostavi na engleskom.\n`;
    content += `- Budi tehnički precizan i direktan.\n`;
    content += `- Kada zadatak jasno spada u jednu oblast, koristi odgovarajući agent/personu ispod.\n\n`;
    content += `## Agenti\n\n`;
    for (const agent of agents) {
        content += `### ${agent.fullName} (${agent.role})\n`;
        content += `Rule fajl: \`.cursor/rules/balkan-${agent.name}.mdc\`\n\n`;
        content += `Karakter: ${agent.character}\n\n`;
        content += `${agent.systemPrompt}\n\n`;
        const kb = await loadKnowledgeBase(agent.name);
        if (kb) {
            content += `Knowledge Base:\n${kb}\n\n`;
        }
    }
    content += `## Rutiranje\n\n`;
    content += `- Troškovi (cost, billing, RI, Spot, Reserved, FinOps, ušteda) → Sima / balkan-sima\n`;
    content += `- Security/Pentest → Mile / balkan-mile\n`;
    content += `- Arhitektura → Žika / balkan-zika\n`;
    content += `- Debugging/Logovi → Toza / balkan-toza\n`;
    content += `- Čišćenje → Steva / balkan-steva\n`;
    content += `- Refactoring → Uške / balkan-uske\n`;
    content += `- Šifrovanje → Joca / balkan-joca\n`;
    content += `- Big Data → Gile / balkan-gile\n`;
    content += `- Workaround/Legacy → Laki / balkan-laki\n`;
    content += `- Auditing → Moma / balkan-moma\n`;
    return content;
}
async function writeAgentsMdFile(targetPath, agents) {
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
    }
    const content = await generateAgentsMdContent(agents);
    fs.writeFileSync(targetPath, content, "utf-8");
}
async function installCursorUserRules() {
    const agents = await pickAgents();
    if (!agents || agents.length === 0)
        return;
    const confirm = await vscode.window.showWarningMessage(`Generisaćemo ${agents.length} Cursor rule fajl(ova) (.mdc) u ~/.cursor/rules/. Postojeći fajlovi sa istim imenom će biti prepisani.`, { modal: true }, "Generiši");
    if (confirm !== "Generiši")
        return;
    const count = await writeRuleFiles(CURSOR_USER_RULES_DIR, agents);
    vscode.window.showInformationMessage(`✅ Generisano ${count} Cursor rule(a) u ~/.cursor/rules/. Uključi odgovarajuću rule u Cursor-u kad treba taj agent (alwaysApply je isključen da se agenti ne mešaju).`);
}
async function installCursorProjectRules() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("Nema otvorenog workspace-a.");
        return;
    }
    let targetFolder = workspaceFolders[0].uri.fsPath;
    if (workspaceFolders.length > 1) {
        const picked = await vscode.window.showWorkspaceFolderPick({
            placeHolder: "Izaberi workspace folder za .cursor/rules/",
        });
        if (!picked)
            return;
        targetFolder = picked.uri.fsPath;
    }
    const agents = await pickAgents();
    if (!agents || agents.length === 0)
        return;
    const rulesDir = path.join(targetFolder, ".cursor", "rules");
    const confirm = await vscode.window.showWarningMessage(`Generisaćemo ${agents.length} Cursor rule fajl(ova) u ${path.relative(targetFolder, rulesDir)}/. Postojeći fajlovi sa istim imenom će biti prepisani.`, { modal: true }, "Generiši");
    if (confirm !== "Generiši")
        return;
    const count = await writeRuleFiles(rulesDir, agents);
    vscode.window.showInformationMessage(`✅ Generisano ${count} Cursor rule(a) u .cursor/rules/. Commituj u git da podeliš sa timom.`);
}
async function installCursorUserAgentsMd() {
    const agents = await pickAgents();
    if (!agents || agents.length === 0)
        return;
    const confirm = await vscode.window.showWarningMessage(`Generisaćemo Cursor AGENTS.md u ~/.cursor/AGENTS.md. Postojeći fajl će biti prepisan.`, { modal: true }, "Generiši");
    if (confirm !== "Generiši")
        return;
    await writeAgentsMdFile(CURSOR_USER_AGENTS_MD_PATH, agents);
    vscode.window.showInformationMessage(`✅ Generisan ~/.cursor/AGENTS.md. Možeš ga referencirati ili kopirati sadržaj u Project Rules po potrebi.`);
}
async function installCursorProjectAgentsMd() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("Nema otvorenog workspace-a.");
        return;
    }
    let targetFolder = workspaceFolders[0].uri.fsPath;
    if (workspaceFolders.length > 1) {
        const picked = await vscode.window.showWorkspaceFolderPick({
            placeHolder: "Izaberi workspace folder za AGENTS.md",
        });
        if (!picked)
            return;
        targetFolder = picked.uri.fsPath;
    }
    const agents = await pickAgents();
    if (!agents || agents.length === 0)
        return;
    const targetPath = path.join(targetFolder, "AGENTS.md");
    const confirm = await vscode.window.showWarningMessage(`Generisaćemo AGENTS.md u ${path.relative(targetFolder, targetPath) || "AGENTS.md"}. Postojeći fajl će biti prepisan.`, { modal: true }, "Generiši");
    if (confirm !== "Generiši")
        return;
    await writeAgentsMdFile(targetPath, agents);
    vscode.window.showInformationMessage(`✅ Generisan AGENTS.md u root-u projekta. Cursor često koristi ovaj fajl kao kontekst za agenta.`);
}
async function installCursor() {
    const choice = await vscode.window.showQuickPick([
        {
            label: "👤 User Level — Project Rules (.mdc)",
            description: "~/.cursor/rules/",
            detail: "Globalne .mdc rule za sve projekte na ovoj mašini.",
            target: "user",
        },
        {
            label: "📁 Project Level — Project Rules (.mdc)",
            description: ".cursor/rules/",
            detail: "Rule fajlovi u repou — deli se sa timom preko git-a.",
            target: "project",
        },
        {
            label: "🌍 User Level — AGENTS.md",
            description: "~/.cursor/AGENTS.md",
            detail: "Sažetak agenata i rutiranja u home .cursor folderu.",
            target: "user-agents-md",
        },
        {
            label: "🧭 Project Level — AGENTS.md",
            description: "AGENTS.md u root-u projekta",
            detail: "Repo-level instrukcije koje Cursor može da uključi u kontekst.",
            target: "project-agents-md",
        },
        {
            label: "🔄 Oba (.mdc + AGENTS.md)",
            description: "User i project — sve varijante",
            detail: "Generiši sve četiri koraka redom (izaći će više quick pick dijaloga).",
            target: "all",
        },
    ], {
        placeHolder: "Gde da instaliramo Balkan DevOps agente za Cursor?",
        title: "Balkan DevOps → Cursor",
    });
    if (!choice)
        return;
    if (choice.target === "user" || choice.target === "all") {
        await installCursorUserRules();
    }
    if (choice.target === "project" || choice.target === "all") {
        await installCursorProjectRules();
    }
    if (choice.target === "user-agents-md" || choice.target === "all") {
        await installCursorUserAgentsMd();
    }
    if (choice.target === "project-agents-md" || choice.target === "all") {
        await installCursorProjectAgentsMd();
    }
}
//# sourceMappingURL=cursor-generator.js.map