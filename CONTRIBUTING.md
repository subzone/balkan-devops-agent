# Contributing to Balkan DevOps Agents

Hvala što želiš da doprinesiš Balkan DevOps Agents projektu! 🇷🇸

## Kako doprineti

### Prijavljivanje bagova

Ako pronađeš bag, otvori [GitHub Issue](https://github.com/subzone/balkan-devops-agent/issues) sa:
- Opisom problema
- Koracima za reprodukciju
- Očekivanim i stvarnim ponašanjem
- VS Code verzijom i OS-om
- Screenshot-ovima ako je moguće

### Predlaganje novih funkcija

Imaš ideju? Super! Otvori Issue sa:
- Detaljnim opisom funkcionalnosti
- Use case scenario
- Mockup-ovima ili primerima ako imaš

### Dodavanje ili poboljšanje agenata

Želiš da dodaš novog agenta ili poboljšaš postojeće?

1. **Fork repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/balkan-devops-agent.git
   cd balkan-devops-agent
   ```

2. **Kreiraj branch**
   ```bash
   git checkout -b feature/novi-agent-dragan
   ```

3. **Dodaj agenta** u `src/agents.ts`:
   ```typescript
   {
     id: 'balkan-devops.dragan',
     name: 'dragan',
     fullName: 'Dragan Majstor',
     systemPrompt: `Ti si Dragan Majstor...`,
   }
   ```

4. **Registruj u** `package.json`:
   ```json
   {
     "id": "balkan-devops.dragan",
     "name": "dragan",
     "fullName": "Dragan Majstor",
     "description": "...",
     "isSticky": false,
     "icon": "assets/agents/dragan.svg"
   }
   ```

5. **Dodaj ikonu** u `assets/agents/dragan.svg`

6. **Testiraj lokalno**
   ```bash
   npm install
   npm run compile
   # Pritisni F5 u VS Code
   ```

7. **Commit i push**
   ```bash
   git add .
   git commit -m "feat: add Dragan Majstor agent for database optimization"
   git push origin feature/novi-agent-dragan
   ```

8. **Otvori Pull Request**

### Razvoj

#### Struktura projekta
```
src/
├── agents.ts       # Definicije svih agenata
├── extension.ts    # Entry point, registracija
assets/
├── agents/         # Ikone za agente
docs/
├── index.html      # GitHub Pages dokumentacija
```

#### Pokretanje u development modu
```bash
npm install
npm run watch       # Auto-compile on change
# Pritisni F5 u VS Code za debugging
```

#### Code Style

- TypeScript sa strict mode
- Komentari na engleskom
- Agent prompts i komunikacija na srpskom
- ESLint za code quality

#### Commit Messages

Koristi [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` nova funkcionalnost
- `fix:` ispravka baga
- `docs:` dokumentacija
- `style:` formatiranje
- `refactor:` refaktoring koda
- `test:` testovi
- `chore:` ostalo (dependencies, config)

Primeri:
```
feat: add Dragan agent for database optimization
fix: correct Steva's system prompt typo
docs: update installation instructions
```

### Testiranje

```bash
npm run compile
npm test           # Kada dodamo testove
```

### Review Process

1. Svi PR-ovi moraju proći code review
2. CI/CD mora biti zeleno
3. Dokumentacija mora biti ažurirana
4. Ikone moraju biti dodane za nove agente

### Pitanja?

Otvori [Discussion](https://github.com/subzone/balkan-devops-agent/discussions) ili pošalji Issue.

---

**Hvala na doprinosu! 🚀**
