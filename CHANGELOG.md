# Changelog

All notable changes to the "Balkan DevOps Agents" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/subzone/balkan-devops-agent/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/subzone/balkan-devops-agent/releases/tag/v0.0.1
