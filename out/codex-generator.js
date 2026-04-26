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
exports.installCodexUserAgents = installCodexUserAgents;
exports.installCodexUserAgentsMd = installCodexUserAgentsMd;
exports.installCodexProjectAgents = installCodexProjectAgents;
exports.installCodexProjectAgentsMd = installCodexProjectAgentsMd;
exports.installCodex = installCodex;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const agents_1 = require("./agents");
const CODEX_USER_AGENTS_DIR = path.join(process.env.HOME || process.env.USERPROFILE || "~", ".codex", "agents");
const CODEX_USER_AGENTS_MD_PATH = path.join(process.env.HOME || process.env.USERPROFILE || "~", ".codex", "AGENTS.md");
function escapeTomlString(value) {
    return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ").trim();
}
function toAsciiNickname(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Za-z0-9 _-]/g, "")
        .trim();
}
function generateAgentToml(agent, knowledgeBase) {
    const description = escapeTomlString(`${agent.role} — ${agent.character} Pozovi kad korisnik traži pomoć oko ${agent.role.toLowerCase()}.`);
    const nickname = toAsciiNickname(agent.fullName.split(" ")[0]) || `Balkan ${agent.name}`;
    let content = `name = "balkan_${agent.name}"\n`;
    content += `description = "${description}"\n`;
    content += `nickname_candidates = ["${nickname}"]\n`;
    content += `developer_instructions = """\n`;
    content += `Ti si ${agent.fullName} — ${agent.role}.\n\n`;
    content += `Karakter:\n${agent.character}\n\n`;
    content += `System prompt:\n${agent.systemPrompt}\n\n`;
    content += `Pravila:\n`;
    content += `- Odgovaraš na srpskom jeziku.\n`;
    content += `- Tehničke termine (nazive servisa, komande, kod) ostavljaš na engleskom.\n`;
    content += `- Uvek ostani u karakteru i ne izlazi iz role.\n`;
    content += `- Daješ tehnički precizne odgovore u svom karakteru.\n`;
    content += `- Ako pitanje nije iz tvoje oblasti, preporuči relevantnog Balkan DevOps agenta.\n\n`;
    content += `Drugi agenti:\n`;
    content += `- Troškovi/FinOps -> balkan_sima\n`;
    content += `- Security/IAM -> balkan_mile\n`;
    content += `- Arhitektura -> balkan_zika\n`;
    content += `- Debugging/Logs -> balkan_toza\n`;
    content += `- Cleanup/Data -> balkan_steva\n`;
    content += `- Refactoring -> balkan_uske\n`;
    content += `- Encryption -> balkan_joca\n`;
    content += `- Big Data -> balkan_gile\n`;
    content += `- Workarounds -> balkan_laki\n`;
    content += `- Auditing -> balkan_moma\n`;
    if (knowledgeBase) {
        content += `\nKnowledge Base:\n${knowledgeBase}\n`;
    }
    content += `"""\n`;
    return content;
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
        title: "Balkan DevOps — Izbor agenata za Codex",
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
        const content = generateAgentToml(agent, kb);
        const filePath = path.join(targetDir, `balkan-${agent.name}.toml`);
        fs.writeFileSync(filePath, content, "utf-8");
        count++;
    }
    return count;
}
async function generateAgentsMdContent(agents) {
    let content = `# Balkan DevOps Agents for Codex\n\n`;
    content += `Ovaj projekat koristi Balkan DevOps agente kao specijalizovane persona-instrukcije za DevOps, cloud, bezbednost, debugging i refactoring zadatke.\n\n`;
    content += `Opsta pravila:\n`;
    content += `- Odgovaraj na srpskom jeziku.\n`;
    content += `- Tehnicke termine, nazive servisa, komande i kod ostavi na engleskom.\n`;
    content += `- Budi tehnicki precizan i direktan.\n`;
    content += `- Kada zadatak jasno spada u jednu oblast, preuzmi stil i ekspertizu najrelevantnijeg agenta ispod.\n`;
    content += `- Ako su dostupni custom agenti iz .codex/agents ili ~/.codex/agents, mozes i eksplicitno da spawn-ujes odgovarajuceg agenta: balkan_sima, balkan_mile, balkan_zika, balkan_toza, balkan_steva, balkan_uske, balkan_joca, balkan_gile, balkan_laki, balkan_moma.\n\n`;
    content += `## Agenti\n\n`;
    for (const agent of agents) {
        content += `### ${agent.fullName} (${agent.role})\n`;
        content += `Karakter: ${agent.character}\n\n`;
        content += `${agent.systemPrompt}\n\n`;
        const kb = await loadKnowledgeBase(agent.name);
        if (kb) {
            content += `Knowledge Base:\n${kb}\n\n`;
        }
    }
    content += `## Rutiranje\n\n`;
    content += `- Troskovi/FinOps -> Sima Krvopija / balkan_sima\n`;
    content += `- Security/IAM -> Mile Pacov / balkan_mile\n`;
    content += `- Arhitektura -> Zika Kurta / balkan_zika\n`;
    content += `- Debugging/Logs -> Toza Vampir / balkan_toza\n`;
    content += `- Cleanup/Data -> Steva Djubre / balkan_steva\n`;
    content += `- Refactoring -> Uske Satara / balkan_uske\n`;
    content += `- Encryption -> Joca Mutni / balkan_joca\n`;
    content += `- Big Data -> Gile Zver / balkan_gile\n`;
    content += `- Workarounds -> Laki Zmija / balkan_laki\n`;
    content += `- Auditing -> Moma Spijun / balkan_moma\n`;
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
async function installCodexUserAgents() {
    const agents = await pickAgents();
    if (!agents || agents.length === 0)
        return;
    const confirm = await vscode.window.showWarningMessage(`Generisaćemo ${agents.length} Codex agent fajl(ova) u ~/.codex/agents/. Postojeći fajlovi sa istim imenom će biti prepisani.`, { modal: true }, "Generiši");
    if (confirm !== "Generiši")
        return;
    const count = await writeAgentFiles(CODEX_USER_AGENTS_DIR, agents);
    vscode.window.showInformationMessage(`✅ Generisano ${count} Codex agent(a) u ~/.codex/agents/. Pozovi ih tako što eksplicitno tražiš spawn za balkan_${agents[0].name} agenta u Codex-u.`);
}
async function installCodexUserAgentsMd() {
    const agents = await pickAgents();
    if (!agents || agents.length === 0)
        return;
    const confirm = await vscode.window.showWarningMessage(`Generisaćemo Codex global instructions u ~/.codex/AGENTS.md. Postojeći fajl će biti prepisan.`, { modal: true }, "Generiši");
    if (confirm !== "Generiši")
        return;
    await writeAgentsMdFile(CODEX_USER_AGENTS_MD_PATH, agents);
    vscode.window.showInformationMessage(`✅ Generisan Codex globalni AGENTS.md u ~/.codex/AGENTS.md. Važi za sve Codex projekte.`);
}
async function installCodexProjectAgents() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("Nema otvorenog workspace-a.");
        return;
    }
    let targetFolder = workspaceFolders[0].uri.fsPath;
    if (workspaceFolders.length > 1) {
        const picked = await vscode.window.showWorkspaceFolderPick({
            placeHolder: "Izaberi workspace folder za .codex/agents/",
        });
        if (!picked)
            return;
        targetFolder = picked.uri.fsPath;
    }
    const agents = await pickAgents();
    if (!agents || agents.length === 0)
        return;
    const agentsDir = path.join(targetFolder, ".codex", "agents");
    const confirm = await vscode.window.showWarningMessage(`Generisaćemo ${agents.length} Codex agent fajl(ova) u ${path.relative(targetFolder, agentsDir)}/. Postojeći fajlovi sa istim imenom će biti prepisani.`, { modal: true }, "Generiši");
    if (confirm !== "Generiši")
        return;
    const count = await writeAgentFiles(agentsDir, agents);
    vscode.window.showInformationMessage(`✅ Generisano ${count} Codex agent(a) u .codex/agents/. Commituj u git da podeliš sa timom.`);
}
async function installCodexProjectAgentsMd() {
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
    const confirm = await vscode.window.showWarningMessage(`Generisaćemo Codex project instructions u ${path.relative(targetFolder, targetPath) || "AGENTS.md"}. Postojeći fajl će biti prepisan.`, { modal: true }, "Generiši");
    if (confirm !== "Generiši")
        return;
    await writeAgentsMdFile(targetPath, agents);
    vscode.window.showInformationMessage(`✅ Generisan Codex project AGENTS.md u root-u projekta. Commituj u git da podeliš sa timom.`);
}
async function installCodex() {
    const choice = await vscode.window.showQuickPick([
        {
            label: "👤 User Level — Custom Agents",
            description: "~/.codex/agents/",
            detail: "Radi u svim projektima u Codex CLI/app okruženju.",
            target: "user",
        },
        {
            label: "📁 Project Level — Custom Agents",
            description: ".codex/agents/",
            detail: "Agenti važe za ovaj projekat i mogu da se dele preko git-a.",
            target: "project",
        },
        {
            label: "🌍 User Level — AGENTS.md",
            description: "~/.codex/AGENTS.md",
            detail: "Globalna Codex pravila za sve projekte.",
            target: "user-agents-md",
        },
        {
            label: "🧭 Project Level — AGENTS.md",
            description: "AGENTS.md u root-u projekta",
            detail: "Project-level Codex pravila koja se dele preko git-a.",
            target: "project-agents-md",
        },
        {
            label: "🔄 Oba",
            description: "Custom agents + AGENTS.md",
            detail: "Instaliraj user i project custom agente, plus oba AGENTS.md fajla.",
            target: "all",
        },
    ], {
        placeHolder: "Gde da instaliramo Balkan DevOps agente za Codex?",
        title: "Balkan DevOps → Codex",
    });
    if (!choice)
        return;
    if (choice.target === "user" || choice.target === "all") {
        await installCodexUserAgents();
    }
    if (choice.target === "project" || choice.target === "all") {
        await installCodexProjectAgents();
    }
    if (choice.target === "user-agents-md" || choice.target === "all") {
        await installCodexUserAgentsMd();
    }
    if (choice.target === "project-agents-md" || choice.target === "all") {
        await installCodexProjectAgentsMd();
    }
}
//# sourceMappingURL=codex-generator.js.map