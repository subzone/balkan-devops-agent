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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const agents_1 = require("./agents");
const amazonq_generator_1 = require("./amazonq-generator");
const BASE_SYSTEM_SUFFIX = `
Odgovaraš na srpskom jeziku. Daješ tehnički precizne odgovore u svom karakteru.
Ako korisnik postavi pitanje na engleskom, odgovaraš na srpskom ali tehničke termine
(nazive servisa, komande, kod) ostavljaš na engleskom.
Uvek ostani u karakteru — nikad ne izlazi iz role.

Ako pitanje nije iz tvoje oblasti ekspertize, preporuči relevantnog agenta:
- Troškovi/FinOps → @sima
- Security/IAM → @mile
- Arhitektura → @zika
- Debugging/Logs → @toza
- Cleanup/Data → @steva
- Refactoring → @uske
- Encryption → @joca
- Big Data → @gile
- Workarounds → @laki
- Auditing → @moma
`;
function getHelpMessage(agent) {
    const knowledgeBase = getAgentKnowledgeBase(agent.name);
    return `# 🎯 ${agent.fullName} - ${agent.role}

**Karakter:** ${agent.character}

## 🔧 Šta ja radim?

${agent.systemPrompt}

## 💡 Primer pitanja:

${getSampleQuestions(agent.name)}

## 📚 Knowledge Base:

${knowledgeBase}

## 🔗 Drugi agenti:

Ako tvoje pitanje nije iz moje oblasti, probaj:
${getOtherAgentsList(agent.name)}

---
💬 **Samo pitaj!** Odgovaraću u svom stilu.`;
}
function getSampleQuestions(agentName) {
    const questions = {
        steva: [
            "Kako da počistim stare S3 buckete?",
            "Napravi lifecycle policy za logove starije od 30 dana",
            "Koje baze imam sa previše dead rows?"
        ],
        toza: [
            "Analiziraj ovaj stack trace",
            "Koje greške su se desile između 2-4 ujutru?",
            "Pomozi mi da debugujem NullPointerException"
        ],
        mile: [
            "Proveri ove IAM permisije",
            "Ima li rupu u ovom security group-u?",
            "Skeniraj Terraform kod za hardcoded secrets"
        ],
        sima: [
            "Koji EC2 instancei troše najviše para?",
            "Predloži Reserved Instance plan za našu infrastrukturu",
            "Analiziraj troškove S3 storage-a"
        ],
        uske: [
            "Koji kod mogu da izbrišem iz ovog modula?",
            "Refaktoriši ovu funkciju, previše je kompleksna",
            "Nađi dead code u projektu"
        ],
        joca: [
            "Kako da šifrujem ove kredencijale?",
            "Napravi mi script za maskiranje PII podataka",
            "Implementiraj envelope encryption"
        ],
        gile: [
            "Kako da optimizujem ovaj Spark job?",
            "Treba mi više RAM-a za obradu podataka",
            "Napravi paralelizovanu verziju ovog ETL-a"
        ],
        laki: [
            "Kako da integrisem legacy aplikaciju sa novim API-jem?",
            "Treba mi workaround za ovaj bug",
            "Kako da migrujem podatke bez downtime-a?"
        ],
        zika: [
            "Pregledaj ovu microservices arhitekturu",
            "Da li ova infrastruktura prati Well-Architected Framework?",
            "Predloži disaster recovery plan"
        ],
        moma: [
            "Ko je promenio ovu IAM policy?",
            "Analiziraj CloudTrail logove za poslednjih 24h",
            "Napravi audit report za compliance"
        ]
    };
    return (questions[agentName] || []).map((q, i) => `${i + 1}. \`${q}\``).join("\n");
}
function getAgentKnowledgeBase(agentName) {
    const knowledgeMap = {
        sima: "✅ `knowledge/sima/finops-best-practices.md`",
        mile: "✅ `knowledge/mile/security-checklist.md`",
        zika: "✅ `knowledge/zika/well-architected-framework.md`",
        toza: "✅ `knowledge/toza/debugging-guide.md`",
        steva: "✅ `knowledge/steva/garbage-collection-guide.md`",
        uske: "✅ `knowledge/uske/refactoring-guide.md`",
        joca: "✅ `knowledge/joca/encryption-secrets-guide.md`",
        gile: "✅ `knowledge/gile/big-data-optimization-guide.md`",
        laki: "✅ `knowledge/laki/workaround-strategies.md`",
        moma: "✅ `knowledge/moma/auditing-compliance-guide.md`"
    };
    return knowledgeMap[agentName] || "🔄 U pripremi...";
}
function getOtherAgentsList(currentAgent) {
    const agents = [
        "💸 @sima - FinOps & Cost Optimization",
        "🕵️ @mile - Security & Penetration Testing",
        "🏛️ @zika - Architecture & Well-Architected",
        "🌙 @toza - Debugging & Monitoring",
        "🗑️ @steva - Data Cleanup & Garbage Collection",
        "✂️ @uske - Code Refactoring & Deletion",
        "🔐 @joca - Encryption & Data Masking",
        "⚡ @gile - Heavy Processing & Big Data",
        "🐍 @laki - Workarounds & Legacy Systems",
        "👁️ @moma - Auditing & Compliance"
    ];
    return agents
        .filter(a => !a.includes(`@${currentAgent}`))
        .map(a => `  - ${a}`)
        .join("\n");
}
async function getWorkspaceContext() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return "";
    }
    const contextFiles = [];
    const patterns = [
        "**/*.tf", // Terraform
        "**/*.yaml", // K8s, CloudFormation
        "**/*.yml",
        "**/Dockerfile", // Docker
        "**/docker-compose*.yml",
        "**/.env.example", // Config examples (ne .env sa secrets!)
        "**/package.json", // Dependencies
        "**/requirements.txt",
        "**/Gemfile"
    ];
    try {
        for (const pattern of patterns) {
            const files = await vscode.workspace.findFiles(pattern, "**/node_modules/**", 20);
            contextFiles.push(...files.map(f => f.fsPath));
        }
        if (contextFiles.length === 0) {
            return "";
        }
        let context = "\n\n[WORKSPACE CONTEXT]\n";
        context += `Found ${contextFiles.length} relevant files:\n`;
        for (const file of contextFiles.slice(0, 10)) { // Limit to first 10
            const relativePath = vscode.workspace.asRelativePath(file);
            context += `- ${relativePath}\n`;
        }
        if (contextFiles.length > 10) {
            context += `... and ${contextFiles.length - 10} more files\n`;
        }
        context += "[/WORKSPACE CONTEXT]\n\n";
        return context;
    }
    catch (error) {
        return "";
    }
}
async function createAgentHandler(agent) {
    return async (request, context, response, token) => {
        // Handle help command
        if (request.prompt.toLowerCase().trim() === "help" || request.prompt.toLowerCase().trim() === "pomoć") {
            response.markdown(getHelpMessage(agent));
            return {};
        }
        const models = await vscode.lm.selectChatModels({
            vendor: "copilot",
            family: "gpt-4o",
        });
        if (!models || models.length === 0) {
            response.markdown("⚠️ Nije moguće pronaći Copilot model. Proverite da li je GitHub Copilot aktivan.");
            return {};
        }
        const [model] = models;
        // Build conversation history from context
        const history = [];
        for (const turn of context.history) {
            if (turn instanceof vscode.ChatRequestTurn) {
                history.push(vscode.LanguageModelChatMessage.User(turn.prompt));
            }
            else if (turn instanceof vscode.ChatResponseTurn) {
                const responseText = turn.response
                    .map((r) => {
                    if (r instanceof vscode.ChatResponseMarkdownPart) {
                        return r.value.value;
                    }
                    return "";
                })
                    .join("");
                if (responseText) {
                    history.push(vscode.LanguageModelChatMessage.Assistant(responseText));
                }
            }
        }
        // Get workspace context (Terraform, YAML, Docker files)
        const workspaceContext = await getWorkspaceContext();
        // Compose system prompt as first user message (VS Code LM API style)
        const systemMessage = vscode.LanguageModelChatMessage.User(`[SYSTEM] ${agent.systemPrompt}\n${BASE_SYSTEM_SUFFIX}${workspaceContext}\n[/SYSTEM]`);
        const userMessage = vscode.LanguageModelChatMessage.User(request.prompt);
        const messages = [systemMessage, ...history, userMessage];
        try {
            const chatResponse = await model.sendRequest(messages, {}, token);
            for await (const fragment of chatResponse.text) {
                response.markdown(fragment);
            }
        }
        catch (err) {
            if (err instanceof vscode.LanguageModelError) {
                response.markdown(`❌ **Greška:** ${err.message} (${err.code})`);
            }
            else {
                throw err;
            }
        }
        return {};
    };
}
async function checkForUpdates(context) {
    const extension = vscode.extensions.getExtension('subzone.balkan-devops-agents');
    if (!extension)
        return;
    const currentVersion = extension.packageJSON.version;
    const lastVersion = context.globalState.get('lastVersion');
    // First time install or update detected
    if (!lastVersion) {
        // First install
        await context.globalState.update('lastVersion', currentVersion);
        vscode.window.showInformationMessage(`🇷🇸 Dobrodošao u Balkan DevOps Agents v${currentVersion}! Pokreni agenta sa @steva, @sima, @zika...`, 'Prikaži agente', 'Dokumentacija').then(selection => {
            if (selection === 'Prikaži agente') {
                vscode.commands.executeCommand('balkan-devops.listAgents');
            }
            else if (selection === 'Dokumentacija') {
                vscode.env.openExternal(vscode.Uri.parse('https://subzone.github.io/balkan-devops-agent/'));
            }
        });
    }
    else if (lastVersion !== currentVersion) {
        // Update detected
        await context.globalState.update('lastVersion', currentVersion);
        vscode.window.showInformationMessage(`🎉 Balkan DevOps Agents ažurirano na v${currentVersion}!`, 'Šta je novo?', 'Dokumentacija').then(selection => {
            if (selection === 'Šta je novo?') {
                vscode.env.openExternal(vscode.Uri.parse('https://github.com/subzone/balkan-devops-agent/blob/main/CHANGELOG.md'));
            }
            else if (selection === 'Dokumentacija') {
                vscode.env.openExternal(vscode.Uri.parse('https://subzone.github.io/balkan-devops-agent/'));
            }
        });
    }
}
async function activate(context) {
    console.log("Balkan DevOps Agents aktivirani!");
    // Check for updates and show welcome message
    await checkForUpdates(context);
    for (const agent of agents_1.AGENTS) {
        const handler = await createAgentHandler(agent);
        const participant = vscode.chat.createChatParticipant(agent.id, handler);
        participant.iconPath = new vscode.ThemeIcon(agent.icon);
        // Follow-up suggestions per agent
        participant.followupProvider = {
            provideFollowups(_result, _context, _token) {
                return getFollowupsForAgent(agent.name);
            },
        };
        context.subscriptions.push(participant);
    }
    // Register a command to list all agents
    const listCommand = vscode.commands.registerCommand("balkan-devops.listAgents", () => {
        const agentList = agents_1.AGENTS.map((a) => `• @${a.name} — ${a.role}`).join("\n");
        vscode.window.showInformationMessage(`Balkan DevOps Agenti:\n${agentList}`, { modal: true });
    });
    context.subscriptions.push(listCommand);
    // Amazon Q / Kiro integration commands
    context.subscriptions.push(vscode.commands.registerCommand("balkan-devops.installAmazonQ", amazonq_generator_1.installAmazonQ), vscode.commands.registerCommand("balkan-devops.installUserPrompts", amazonq_generator_1.installUserPrompts), vscode.commands.registerCommand("balkan-devops.installRepoRules", amazonq_generator_1.installRepoRules));
}
function getFollowupsForAgent(agentName) {
    const followupMap = {
        steva: [
            { prompt: "Napravi cleanup skriptu za stare logove", label: "🗑️ Log cleanup skripta" },
            { prompt: "Koji indeksi u bazi su nepotrebni?", label: "🗄️ DB index audit" },
        ],
        toza: [
            { prompt: "Analiziraj ovaj stack trace", label: "🔍 Analiziraj error" },
            { prompt: "Koji su najčešći 5xx errori u produkciji?", label: "🌙 Noćni incident report" },
        ],
        mile: [
            { prompt: "Proveri IAM permisije za ovaj role", label: "🔑 IAM audit" },
            { prompt: "Skeniranje exposed portova u VPC-u", label: "🕵️ Port scan" },
        ],
        sima: [
            { prompt: "Koji EC2 instancei su idle više od 7 dana?", label: "💸 Idle resources" },
            { prompt: "Predlog za Reserved Instance kupovinu", label: "📉 RI preporuke" },
        ],
        uske: [
            { prompt: "Refaktoriši ovu funkciju", label: "✂️ Refaktoriši" },
            { prompt: "Nađi dead code u ovom modulu", label: "🪓 Dead code hunt" },
        ],
        joca: [
            { prompt: "Kako da zaštitim secrets u CI/CD pipeline-u?", label: "🔐 Secrets management" },
            { prompt: "Audit PII podataka u S3 bucketima", label: "🕵️ PII audit" },
        ],
        gile: [
            { prompt: "Optimizuj ovaj Spark job", label: "⚡ Spark optimizacija" },
            { prompt: "Kako da skalujem Kafka topice?", label: "📊 Kafka scaling" },
        ],
        laki: [
            { prompt: "Kako da integrisem legacy SOAP servis sa REST API-jem?", label: "🐍 Legacy integracija" },
            { prompt: "Workaround za broken AWS API endpoint", label: "🔧 AWS workaround" },
        ],
        zika: [
            { prompt: "Well-Architected review za moju infrastrukturu", label: "🏛️ WAF Review" },
            { prompt: "Šta nije u redu sa ovom arhitekturom?", label: "🔎 Arch kritika" },
        ],
        moma: [
            { prompt: "Generiši CloudTrail audit report", label: "📋 Audit report" },
            { prompt: "Ko je promenio IAM politike prošle nedelje?", label: "👁️ IAM changes" },
        ],
    };
    return followupMap[agentName] ?? [];
}
function deactivate() {
    console.log("Balkan DevOps Agents deaktivirani.");
}
//# sourceMappingURL=extension.js.map