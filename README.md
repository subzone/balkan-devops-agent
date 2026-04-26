# 🇷🇸 Balkan DevOps Agents

10 GitHub Copilot chat agenata sa autentičnim Balkanskim karakterima za svaku DevOps disciplinu.
Svaki agent je specijalizovan za određenu oblast i ima sopstveni stil komunikacije.

📖 **[View Full Documentation](https://subzone.github.io/balkan-devops-agent/)**

[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue)](https://marketplace.visualstudio.com/items?itemName=subzone.balkan-devops-agents)
[![GitHub Release](https://img.shields.io/github/v/release/subzone/balkan-devops-agent)](https://github.com/subzone/balkan-devops-agent/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🚀 Instalacija

### Development (lokalno)

```bash
git clone https://github.com/subzone/balkan-devops-agents
cd balkan-devops-agents
npm install
npm run compile
```

Potom u VS Code: `F5` → otvori se novi Extension Development Host prozor.

### Iz Marketplace

```
ext install subzone.balkan-devops-agents
```

---

## 👥 Agenti

| Agent | Uloga | Poziv |
|-------|-------|-------|
| **Steva Đubre** | Garbage Collection & Data Cleanup | `@steva` |
| **Toza Vampir** | Night Shift Monitoring & Debugging | `@toza` |
| **Mile Pacov** | Penetration Testing & Security Audit | `@mile` |
| **Sima Krvopija** | FinOps & Cloud Cost Optimization | `@sima` |
| **Uške Satara** | Code Refactoring & Deletion | `@uske` |
| **Joca Mutni** | Encryption & Data Masking | `@joca` |
| **Gile Zver** | Heavy Processing & Big Data | `@gile` |
| **Laki Zmija** | Workarounds & Legacy Bridges | `@laki` |
| **Žika Kurta** | Architecture Advisor & Critic | `@zika` |
| **Moma Špijun** | Auditing & User Activity Tracking | `@moma` |

---

## 💬 Primeri upotrebe

### FinOps — Sima Krvopija
```
@sima koji EC2 instancei nisu korišćeni više od 7 dana?
```
> *"A ko će ovo da plati?! Imam ovde 14 m5.xlarge instanci koje samo troše pare..."*

### Architecture Review — Žika Kurta
```
@zika pregledaj ovu microservices arhitekturu
```
> *"E moj ti... ko te to učio? Ovo nema veze sa Well-Architected Frameworkom. Slušaj sad..."*

### Security — Mile Pacov
```
@mile pazi, ima nešto sumnjivo u ovim IAM permisijama
```
> *"Njušim nešto... ovaj role ima AdministratorAccess bez ijednog condition bloka. Pazi vamo..."*

### Debugging — Toza Vampir
```
@toza analiziraj ovaj stack trace iz produkcije
```
> *"NullPointerException. Linija 247. Noćas u 3:17. Uvek noćas u 3:17."*

---

## 🛠️ Razvoj

### Struktura projekta

```
balkan-devops-agents/
├── src/
│   ├── extension.ts    # Glavni entry point, registracija agenata
│   └── agents.ts       # Definicije svih 10 agenata
├── .vscode/
│   ├── launch.json     # Debug konfiguracija
│   └── tasks.json      # Build taskovi
├── package.json        # Extension manifest + chatParticipants
└── tsconfig.json
```

### Dodavanje novog agenta

1. Dodaj objekat u `AGENTS` niz u `src/agents.ts`
2. Registruj u `package.json` pod `contributes.chatParticipants`
3. Dodaj follow-up predloge u `getFollowupsForAgent()` u `extension.ts`

### Pakovanje

```bash
npm run package
# Generiše balkan-devops-agents-1.0.0.vsix
```

---

## 📋 Zahtevi

- VS Code `^1.90.0`
- GitHub Copilot Chat (aktivna pretplata)
- Node.js `^20.0.0`

---

## 📄 Licenca

MIT © Milenko Mitrović / HTEC Group
# balkan-devops-agent
