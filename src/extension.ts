import * as vscode from "vscode";
import { AGENTS, AgentDefinition } from "./agents";

const BASE_SYSTEM_SUFFIX = `
Odgovaraš na srpskom jeziku. Daješ tehnički precizne odgovore u svom karakteru.
Ako korisnik postavi pitanje na engleskom, odgovaraš na srpskom ali tehničke termine
(nazive servisa, komande, kod) ostavljaš na engleskom.
Uvek ostani u karakteru — nikad ne izlazi iz role.
`;

async function createAgentHandler(agent: AgentDefinition) {
  return async (
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    response: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<vscode.ChatResult> => {
    const models = await vscode.lm.selectChatModels({
      vendor: "copilot",
      family: "gpt-4o",
    });

    if (!models || models.length === 0) {
      response.markdown(
        "⚠️ Nije moguće pronaći Copilot model. Proverite da li je GitHub Copilot aktivan."
      );
      return {};
    }

    const [model] = models;

    // Build conversation history from context
    const history: vscode.LanguageModelChatMessage[] = [];

    for (const turn of context.history) {
      if (turn instanceof vscode.ChatRequestTurn) {
        history.push(
          vscode.LanguageModelChatMessage.User(turn.prompt)
        );
      } else if (turn instanceof vscode.ChatResponseTurn) {
        const responseText = turn.response
          .map((r) => {
            if (r instanceof vscode.ChatResponseMarkdownPart) {
              return r.value.value;
            }
            return "";
          })
          .join("");
        if (responseText) {
          history.push(
            vscode.LanguageModelChatMessage.Assistant(responseText)
          );
        }
      }
    }

    // Compose system prompt as first user message (VS Code LM API style)
    const systemMessage = vscode.LanguageModelChatMessage.User(
      `[SYSTEM] ${agent.systemPrompt}\n${BASE_SYSTEM_SUFFIX}\n[/SYSTEM]`
    );

    const userMessage = vscode.LanguageModelChatMessage.User(
      request.prompt
    );

    const messages = [systemMessage, ...history, userMessage];

    try {
      const chatResponse = await model.sendRequest(messages, {}, token);

      for await (const fragment of chatResponse.text) {
        response.markdown(fragment);
      }
    } catch (err) {
      if (err instanceof vscode.LanguageModelError) {
        response.markdown(
          `❌ **Greška:** ${err.message} (${err.code})`
        );
      } else {
        throw err;
      }
    }

    return {};
  };
}

export async function activate(context: vscode.ExtensionContext) {
  console.log("Balkan DevOps Agents aktivirani!");

  for (const agent of AGENTS) {
    const handler = await createAgentHandler(agent);

    const participant = vscode.chat.createChatParticipant(
      agent.id,
      handler
    );

    participant.iconPath = new vscode.ThemeIcon(agent.icon);

    // Follow-up suggestions per agent
    participant.followupProvider = {
      provideFollowups(
        _result: vscode.ChatResult,
        _context: vscode.ChatContext,
        _token: vscode.CancellationToken
      ): vscode.ChatFollowup[] {
        return getFollowupsForAgent(agent.name);
      },
    };

    context.subscriptions.push(participant);
  }

  // Register a command to list all agents
  const listCommand = vscode.commands.registerCommand(
    "balkan-devops.listAgents",
    () => {
      const agentList = AGENTS.map(
        (a) => `• @${a.name} — ${a.role}`
      ).join("\n");
      vscode.window.showInformationMessage(
        `Balkan DevOps Agenti:\n${agentList}`,
        { modal: true }
      );
    }
  );

  context.subscriptions.push(listCommand);
}

function getFollowupsForAgent(agentName: string): vscode.ChatFollowup[] {
  const followupMap: Record<string, vscode.ChatFollowup[]> = {
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

export function deactivate() {
  console.log("Balkan DevOps Agents deaktivirani.");
}
