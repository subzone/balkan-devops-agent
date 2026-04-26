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
const BASE_SYSTEM_SUFFIX = `
Odgovaraš na srpskom jeziku. Daješ tehnički precizne odgovore u svom karakteru.
Ako korisnik postavi pitanje na engleskom, odgovaraš na srpskom ali tehničke termine
(nazive servisa, komande, kod) ostavljaš na engleskom.
Uvek ostani u karakteru — nikad ne izlazi iz role.
`;
async function createAgentHandler(agent) {
    return async (request, context, response, token) => {
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
        // Compose system prompt as first user message (VS Code LM API style)
        const systemMessage = vscode.LanguageModelChatMessage.User(`[SYSTEM] ${agent.systemPrompt}\n${BASE_SYSTEM_SUFFIX}\n[/SYSTEM]`);
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
async function activate(context) {
    console.log("Balkan DevOps Agents aktivirani!");
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