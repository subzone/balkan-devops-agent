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
@sima koji EC2 instancei troše najviše para?
```
> *"A ko će OVO da plati?! Dev environment 24/7?! PA SI POLUDEO! Ugasi noću, uštedi $500 mesečno!"*

### Architecture Review — Žika Kurta
```
@zika pregledaj ovu microservices arhitekturu
```
> *"E moj ti... monolith na EC2 bez load balancera? KO TE TO UČIO?! Slušaj sad, objasniću ti kako se to radi PRAVILNO..."*

### Security — Mile Pacov
```
@mile proveri ove IAM permisije
```
> *"Pazi vamo... Security Group sa 0.0.0.0/0 na port 22? Pa ti si otvorio vrata za SVE lopove!"*

### Debugging — Toza Vampir
```
@toza analiziraj ovaj stack trace
```
> *"Mirno je. Previše mirno. NullPointerException. Linija 247. Noćas u 3:17. Uvek noćas u 3:17."*

### Garbage Collection — Steva Đubre
```
@steva počisti Docker images starije od 30 dana
```
> *"Pa dokle više sa ovim smecem?! Logovi od 2019. godine?! KRŠ I LOM! Čistim sad!"*

---

## � Ažuriranja

Ekstenzija se **automatski ažurira** preko VS Code Marketplace-a:

- ✅ VS Code proverava nove verzije u pozadini
- ✅ Ažuriranja se automatski preuzimaju i instaliraju
- ✅ Dobijaš notifikaciju sa "Šta je novo?" linkom
- ✅ Sve promene su dokumentovane u [CHANGELOG.md](CHANGELOG.md)

**Ručna provera:**
- Otvori Extensions panel (Cmd+Shift+X)
- Potraži "Balkan DevOps Agents"
- Klikni **Update** ako je dostupno

Detaljne informacije: [docs/UPDATES.md](docs/UPDATES.md)

---

## ⚠️ Disclaimer

**Koristi na sopstvenu odgovornost.**

Ova ekstenzija je eksperimentalna i ne garantuje tačnost predloga. Agenti su AI asistenata koji mogu grešiti.

- ❌ Ne koristite za kritične production sisteme bez pregleda
- ❌ Ne primenjujte sugestije agenata bez validacije
- ❌ Ne šaljite osetljive podatke u chat
- ✅ Uvek pregledajte kod/infrastrukturu pre izvršavanja
- ✅ Tretirajte odgovore kao **savete**, ne garantovane rešenja

**Autor ne snosi odgovornost za** štetu, data loss, troškove ili incident koji nastanu upotrebom ovog softvera. MIT licenca eksplicitno naznačava: **NO WARRANTY**.

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

MIT © Milenko Mitrović
# balkan-devops-agent
