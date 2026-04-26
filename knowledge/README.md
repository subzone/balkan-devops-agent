# Knowledge Base Structure

Svaki agent ima svoju **knowledge base** - kolekciju dokumenata sa domain expertise, best practices, i praktičnim primerima.

## Struktura

```
knowledge/
├── steva/          # Garbage Collection & Data Cleanup
├── toza/           # Night Shift Debugging (✅ debugging-guide.md)
├── mile/           # Security & Pen Testing (✅ security-checklist.md)
├── sima/           # FinOps & Cost Optimization (✅ finops-best-practices.md)
├── uske/           # Code Refactoring & Deletion
├── joca/           # Encryption & Data Masking
├── gile/           # Heavy Processing & Big Data
├── laki/           # Workarounds & Legacy Bridges
├── zika/           # Architecture (✅ well-architected-framework.md)
└── moma/           # Auditing & Compliance
```

## Kako Agenti Koriste Knowledge Base

Agenti imaju pristup fajlovima u svojim folderima tokom konverzacije. Kada korisnik postavi pitanje, agent:

1. **Kontekst**: Učitava relevantne knowledge base fajlove
2. **Analiza**: Kombinuje svoju ekspertizu sa dokumentovanim best practices
3. **Odgovor**: Daje tehnički precizan odgovor u svom karakteru

## Dodavanje Novog Sadržaja

```bash
# 1. Napravi markdown fajl u odgovarajućem folderu
knowledge/sima/aws-cost-optimization.md

# 2. Struktura dokumenta:
# - Kratko objašnjenje (why)
# - Praktični primeri (how)
# - Code snippets
# - Best practices
# - Common pitfalls
# - Tools & resources

# 3. Format: Markdown sa code blocks
# - YAML/JSON za config primere
# - Bash za CLI komande
# - Python/JS za skripte
# - SQL za database queries
```

## Knowledge Base Principi

### 1. **Practical First**
Fokus na praktične primere, ne teoriju. Svaki dokument treba da reši realan problem.

### 2. **Code-Heavy**
Više code snippets, manje text. Engineers learn by example.

### 3. **Real-World Scenarios**
"Šta da radim kad..." pitanja sa konkretnim rešenjima.

### 4. **Agent Personality**
Dokumenti prate personality agenta - Sima priča o parama, Mile o security rupama.

### 5. **Reference Links**
Linkovi na official dokumentaciju, tools, i externe resurse.

## Trenutni Coverage

| Agent | Knowledge Files | Status |
|-------|-----------------|--------|
| 🗑️ Steva | - | 🔴 TODO |
| 🌙 Toza | debugging-guide.md | ✅ Done |
| 🕵️ Mile | security-checklist.md | ✅ Done |
| 💸 Sima | finops-best-practices.md | ✅ Done |
| ✂️ Uške | - | 🔴 TODO |
| 🔐 Joca | - | 🔴 TODO |
| ⚡ Gile | - | 🔴 TODO |
| 🐍 Laki | - | 🔴 TODO |
| 🏛️ Žika | well-architected-framework.md | ✅ Done |
| 👁️ Moma | - | 🔴 TODO |

## Roadmap

### Phase 1: Core Documents (Current)
- [x] Sima: FinOps best practices
- [x] Mile: Security checklist
- [x] Žika: Well-Architected Framework
- [x] Toza: Debugging guide
- [ ] Steva: Data cleanup patterns
- [ ] Uške: Refactoring strategies
- [ ] Joca: Encryption handbook
- [ ] Gile: Big data processing
- [ ] Laki: Legacy integration patterns
- [ ] Moma: Audit & compliance

### Phase 2: Advanced Topics
- Cloud provider specific guides (AWS, Azure, GCP)
- IaC templates (Terraform, CloudFormation)
- CI/CD pipeline examples
- Disaster recovery playbooks
- Performance tuning guides

### Phase 3: Interactive
- Code templates za common tasks
- Troubleshooting decision trees
- Cost calculator scripts
- Security scanning automation

## Doprinos

Dodavanje novog sadržaja:
1. Pretraži postojeće fajlove za overlap
2. Napravi PR sa novim markdown fajlom
3. Follow dokumentacioni stil postojećih fajlova
4. Peer review od relevantnog domain experta

---

**Made with ❤️ for the Balkan DevOps Community**
