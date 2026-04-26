# 🇷🇸 Balkan DevOps Agents

**KRŠ I LOM!** Dosta više ljubaznih AI asistenata!

10 GitHub Copilot chat agenata koji ZAPRAVO govore kako treba - bez uvijanja, bez corporate floskula, direktno u stvar. 
Svaki agent ima muda da ti kaže šta misli. Srpski jezik. Balkanski karakter. Tehnička preciznost.

📖 **[Dokumentacija](https://subzone.github.io/balkan-devops-agent/)** (ako nisi lenj da pročitaš)

[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue)](https://marketplace.visualstudio.com/items?itemName=subzone.balkan-devops-agents)
[![GitHub Release](https://img.shields.io/github/v/release/subzone/balkan-devops-agent)](https://github.com/subzone/balkan-devops-agent/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🚀 Instalacija

**BACAJ TO u VS Code!**

### Brzo (Marketplace)

```bash
ext install subzone.balkan-devops-agents
```

ILI otvori Extensions (Cmd+Shift+X), kucaj "Balkan DevOps Agents", Install, GOTOVO!

### Development (za one koji znaju)

```bash
git clone https://github.com/subzone/balkan-devops-agents
cd balkan-devops-agents
npm install
npm run compile
# F5 u VS Code, znaš već
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

## 💬 Kako se koristi

**Otvori Copilot Chat, kucaj `@` i biraš ko ti treba.**

### @sima — Kad te bocka račun
```
@sima koji EC2 instancei troše najviše para?
```
> *"A ko će OVO da plati?! Dev environment 24/7?! PA SI POLUDEO! Ugasi noću, uštedi $500 mesečno! Spot instances - ODMAH!"*

### @zika — Kad ne znaš šta radiš
```
@zika pregledaj ovu microservices arhitekturu
```
> *"E moj ti... monolith na EC2 bez load balancera? KO TE TO UČIO?! Slušaj sad, objasniću ti kako se to radi PRAVILNO..."*

### @mile — Kad te zanima security (a TREBA DA TE ZANIMA!)
```
@mile proveri ove IAM permisije
```
> *"Pazi vamo... Security Group sa 0.0.0.0/0 na port 22? Pa ti si otvorio vrata za SVE lopove! Admin* permisije za Lambda? BRAVO!"*

### @toza — Kad pukne u 3 ujutru
```
@toza analiziraj ovaj stack trace
```
> *"Mirno je. Previše mirno. NullPointerException. Linija 247. Noćas u 3:17. Uvek noćas u 3:17. Memory leak. Kao i pre mesec dana."*

### @steva — Kad treba POČISTITI
```
@steva počisti Docker images starije od 30 dana
```
> *"Pa dokle više sa ovim smecem?! Logovi od 2019. godine?! KRŠ I LOM! Čistim sad! docker system prune -af --volumes - GOTOVO!"*

---

## � Ažuriranja

**Automatski se ažurira.** VS Code se brine o tome.

Ako si nervozan i moraš ručno da proveriš: Extensions (Cmd+Shift+X) → potraži "Balkan DevOps Agents" → Update.

Promene: [CHANGELOG.md](CHANGELOG.md)

---

## ⚠️ Disclaimer

**NE GARANTUJEM NIŠTA.**

Ovo su AI agenti, ne bogovi. Mogu da zajebu. TI si odgovoran za svoje sisteme.

- ❌ Production bez pregleda? Tvoj problem.
- ❌ Slepo izvršavaš komande? Tvoj problem.
- ❌ Osetljivi podaci u chat? Tvoj problem.
- ✅ Pregledaj kod UVEK pre izvršavanja.
- ✅ Saveti, ne garancije.

**Pokvaريš nešto? Tvoja briga.** Data loss? Troškovi? Incidenti? **TVOJ PROBLEM.**

MIT licenca kaže: **NO WARRANTY**. Razumeš? Dobro.

---

## 🛠️ Razvoj

**Za developere:**

```
src/
  ├── extension.ts    # Entry point
  └── agents.ts       # 10 agenata ovde
package.json          # Manifest
```

**Dodaj novog agenta:**
1. `src/agents.ts` → dodaj u `AGENTS` niz
2. `package.json` → registruj u `contributes.chatParticipants`
3. Kompajliraj, testuj, gotovo

Znaš već.

---

## 📋 Šta ti treba

- VS Code (noviji od 1.90)
- GitHub Copilot (MORA biti aktivna pretplata)
- Node.js 20+ (za dev)

Nemaš Copilot pretplatu? Onda ovo ne radi. Jednostavno.

---

## 📄 Licenca

MIT © Milenko Mitrović / subzone
# balkan-devops-agent
