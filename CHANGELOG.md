# Changelog

All notable changes to the "Balkan DevOps Agents" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.8] - 2026-04-26

### Added
- **Antigravity (Gemini Code Assist) podrška** — Export Balkan DevOps agenata u Antigravity Knowledge Items (KIs).
  - Nova komanda: `Balkan DevOps: Instaliraj agente za Antigravity (Gemini)`
  - Generiše `metadata.json` i `artifacts/agent.md` u `~/.gemini/antigravity/knowledge/balkan-{ime}/`
  - Antigravity automatski usvaja "personu" i bazu znanja agenta.
- **Claude Code podrška** — I CLAUDE CODE radi! Anthropic-ovi subagents.
  - Nova komanda: `Balkan DevOps: Instaliraj agente za Claude Code` — multi-AI platforme u istoj ekstenziji!
  - **User Level** (`~/.claude/agents/`) — generiše subagents, pozivaj sa `@balkan-sima` u Claude Code
  - **Project Level** (`.claude/agents/`) — workspace-specifični agenti, deli se preko git-a
  - Markdown fajlovi sa YAML frontmatter (`name`, `description`) + system prompt + knowledge base
  - Automatski routing na osnovu description polja — opiši problem, Claude rutira na pravog agenta
  - Nema dependency-ja, čist markdown — tools nasleđuju iz parent sesije
- Novi fajl: `src/claudecode-generator.ts` — kompletna logika za Claude Code generisanje
- Novi fajl: `src/antigravity-generator.ts` — logika za Antigravity (Gemini)
- 4 nove komande u Command Palette:
  - `Balkan DevOps: Instaliraj agente za Antigravity (Gemini)`
  - `Balkan DevOps: Instaliraj agente za Claude Code` (glavni entry point)
  - `Balkan DevOps: Generiši Claude Code Subagents (User Level)`
  - `Balkan DevOps: Generiši Claude Code Subagents (Project Level)`

### Changed
- Ažurirana dokumentacija sa Claude Code sekcijama — README, agent docs
- Struktura projekta: dodao `claudecode-generator.ts` pored `amazonq-generator.ts`
- Requirements sekcija: sada navodi GitHub Copilot **ILI** Amazon Q **ILI** Claude Code
- README tabela sa opcijama za User/Project/Oba nivoa instalacije

### Improved
- Multi-platform AI podrška: GitHub Copilot + Amazon Q + Claude Code u jednoj ekstenziji
- Svaki agent može da radi na 3 različite AI platforme sa konzistentnim ponašanjem

## [0.0.7] - 2026-04-26

### Added
- **Amazon Q / Kiro podrška** — KRŠ I LOM, nisi više vezan za Copilot!
  - Nova komanda: `Balkan DevOps: Instaliraj agente za Amazon Q / Kiro` — jedan klik, biraš gde
  - **User Level** (`~/.aws/amazonq/prompts/`) — generiše saved prompts, pozivaj sa `@prompt sima` u Q chatu
  - **Repo Level** (`.amazonq/rules/`) — generiše workspace rules, automatski kontekst u svakom Q requestu
  - Multi-select agent picker — biraš koje agente hoćeš, svi selektovani po defaultu
  - Modal confirmation pre pisanja — pita te pre nego što prepiše fajlove, nismo divljaci
  - Knowledge base sadržaj se automatski uključuje u generisane fajlove
  - Cross-agent preporuke u svakom generisanom promptu
- Novi fajl: `src/amazonq-generator.ts` — kompletna logika za generisanje
- 3 nove komande u Command Palette:
  - `Balkan DevOps: Instaliraj agente za Amazon Q / Kiro` (glavni entry point)
  - `Balkan DevOps: Generiši Amazon Q Saved Prompts (User Level)`
  - `Balkan DevOps: Generiši Amazon Q Workspace Rules (Repo Level)`

### Changed
- Ažurirana dokumentacija sa Amazon Q / Kiro sekcijama — README, GitHub Pages, agent docs
- Struktura projekta proširena sa `amazonq-generator.ts`
- Requirements sekcija: sada navodi i Amazon Q kao alternativu Copilot-u

## [0.0.6] - 2026-04-26

### Added
- **Complete Knowledge Base**: Svih 10 agenata sada imaju comprehensive domain guides:
  - **Steva**: `knowledge/steva/garbage-collection-guide.md` - Multi-cloud lifecycle policies, Docker/K8s cleanup, log management, Terraform state cleanup, CI/CD artifacts, automated scripts
  - **Uške**: `knowledge/uske/refactoring-guide.md` - Dead code detection, complexity analysis, refactoring patterns, IaC optimization, SQL tuning, git history cleanup
  - **Joca**: `knowledge/joca/encryption-secrets-guide.md` - KMS (AWS/Azure/GCP/Vault), secrets management, TLS/mTLS, PII masking, compliance (GDPR/PCI-DSS/HIPAA)
  - **Gile**: `knowledge/gile/big-data-optimization-guide.md` - Spark optimization, Kafka tuning, GPU workloads, ETL pipelines, Kubernetes HPA/VPA/KEDA
  - **Laki**: `knowledge/laki/workaround-strategies.md` - Legacy system integration, API workarounds, migration patterns, cross-cloud transfers, SSH tunneling
  - **Moma**: `knowledge/moma/auditing-compliance-guide.md` - Cloud audit trails, SIEM (Splunk/ELK/Sentinel), compliance frameworks (SOC 2/ISO 27001), forensics
- Extension now references all 10 knowledge base files in help command

### Changed
- **BRUTAL DOCUMENTATION REWRITE** - All docs now in authentic Steva Đubre style:
  - README.md: "KRŠ I LOM! Dosta više ljubaznih AI asistenata!"
  - Marketplace description: Direct, no corporate BS
  - GitHub Pages: Aggressive intro, "NE GARANTUJEM NIŠTA" disclaimer
  - Installation: "BACAJ TO u VS Code!"
  - Requirements: "Nemaš Copilot? Onda ovo ne radi. Jednostavno."
  - Contributing: "Znaš već kako se radi."
- Footer changed to "KRŠ I LOM! 🇷🇸" (removed soft corporate messaging)

### Improved
- All knowledge base guides include:
  - Multi-cloud examples (AWS/Azure/GCP/Alibaba)
  - Code snippets and practical commands
  - Best practices and anti-patterns
  - Authentic agent voice throughout
  - 10+ major sections each (500-700 lines)

## [0.0.5] - 2026-04-26

### Added
- **Multi-cloud expertise**: Svi agenti sada pokrivaju AWS, Azure, GCP i Alibaba Cloud
- **Infrastructure as Code**: Expanded Terraform, CloudFormation, ARM templates support
- **Container orchestration**: Deep Kubernetes, Docker, Helm, Kustomize knowledge
- **Linux expertise**: System administration, performance tuning, security hardening

### Changed
- Updated all agent system prompts with comprehensive multi-cloud capabilities
- Sample questions now showcase AWS/Azure/GCP/Alibaba examples
- Cross-cloud migration scenarios (AWS → Azure, etc.)
- Kubernetes and container-native workflows emphasized

### Improved
- **Steva**: Multi-cloud storage cleanup (S3/Blob/GCS/OSS), container cleanup
- **Toza**: Multi-cloud log aggregation (CloudWatch/Azure Monitor/GCP Logging)
- **Mile**: Cross-cloud IAM (AWS IAM, Azure RBAC, GCP IAM, Alibaba RAM)
- **Sima**: Multi-cloud cost optimization across all major providers
- **Uške**: IaC refactoring (Terraform modules, Dockerfile optimization)
- **Joca**: Multi-cloud KMS (AWS/Azure/GCP Key Management), K8s secrets
- **Gile**: Cloud-native big data (EMR, HDInsight, Dataproc, MaxCompute)
- **Laki**: Cross-cloud migration workarounds, multi-arch Docker builds
- **Žika**: Multi-cloud Well-Architected frameworks, Kubernetes architecture
- **Moma**: Multi-cloud audit (CloudTrail, Azure Activity Log, GCP Audit Logs)

## [0.0.4] - 2026-04-26

### Added
- **Help command**: Svaki agent sada odgovara na "help" ili "pomoć" sa detaljnim informacijama
- **Sample questions**: Svi agenti imaju predefinisane primere pitanja u package.json
- **Knowledge base system**: Markdown fajlovi sa domain expertise za svaki tim:
  - Sima: FinOps best practices (finops-best-practices.md)
  - Mile: Security checklist (security-checklist.md)
  - Žika: Well-Architected Framework (well-architected-framework.md)
  - Toza: Debugging guide (debugging-guide.md)
- **Workspace context awareness**: Agenti automatski detektuju Terraform, YAML, Docker i config fajlove u workspace-u
- **Cross-agent references**: Agenti preporučuju jedni druge kada je pitanje van njihove oblasti
- **Agent documentation pages**: Kompletna dokumentacija svih agenata na docs/agents/README.md
- Knowledge base README sa strukturom i principima

### Changed
- Prošireni system prompt-ovi da uključuju cross-agent recommendations
- Ažuriran getFollowups() sa relevantnim follow-up pitanjima za svaki tim

## [0.0.3] - 2026-04-26

### Changed
- Povećana rezolucija ikone ekstenzije na 1024x1024px za bolji prikaz na marketplace-u
- Ažuriran SVG fajl ikone za veću rezoluciju

### Added
- Favicon za GitHub Pages (PNG i SVG)
- Automatsko prikazivanje najnovije verzije sa GitHub API-ja
- Changelog sekcija na GitHub Pages sajtu

## [0.0.2] - 2026-04-26

### Added
- Extension icon (assets/icon.png)
- SVG icon source file (assets/icon.svg)

## [0.0.1] - 2026-04-26

### Added
- Initial pre-release of Balkan DevOps Agents
- 10 specialized DevOps agents with unique personalities:
  - 🗑️ Steva Đubre - Garbage Collection & Data Cleanup
  - 🌙 Toza Vampir - Night Shift Monitoring & Debugging
  - 🕵️ Mile Pacov - Penetration Testing & Security Audit
  - 💸 Sima Krvopija - FinOps & Cloud Cost Optimization
  - ✂️ Uške Satara - Code Refactoring & Deletion
  - 🔐 Joca Mutni - Encryption & Data Masking
  - ⚡ Gile Zver - Heavy Processing & Big Data
  - 🐍 Laki Zmija - Workarounds & Legacy Bridges
  - 🏛️ Žika Kurta - Architecture Advisor & Critic
  - 👁️ Moma Špijun - Auditing & User Activity Tracking
- Custom SVG icons for each agent
- Serbian language support in agent communications
- GitHub Copilot Chat integration
- Comprehensive documentation and GitHub Pages site

### Changed
- N/A (initial release)

### Deprecated
- N/A (initial release)

### Removed
- N/A (initial release)

### Fixed
- N/A (initial release)

### Security
- N/A (initial release)

---

## Version History

[Unreleased]: https://github.com/subzone/balkan-devops-agent/compare/v0.0.7...HEAD
[0.0.7]: https://github.com/subzone/balkan-devops-agent/compare/v0.0.6...v0.0.7
[0.0.6]: https://github.com/subzone/balkan-devops-agent/compare/v0.0.5...v0.0.6
[0.0.5]: https://github.com/subzone/balkan-devops-agent/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/subzone/balkan-devops-agent/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/subzone/balkan-devops-agent/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/subzone/balkan-devops-agent/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/subzone/balkan-devops-agent/releases/tag/v0.0.1
