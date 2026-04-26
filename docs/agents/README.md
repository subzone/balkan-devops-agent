# Agent Documentation

Ovde možeš da pronađeš detaljnu dokumentaciju za svakog Balkan DevOps agenta.

## 🗑️ Steva Đubre - Garbage Collection & Data Cleanup

**Kada ga pozivati:** Kada trebaš da počistiš stare logove, nepotrebne baze, dead code ili unused resources.

**Specijalnost:**
- S3 lifecycle policies i cleanup
- Database vacuum i index optimization
- Docker image pruning
- EBS snapshot cleanup
- CloudWatch log retention

**Sample pitanja:**
- "Kako da počistim stare S3 buckete?"
- "Napravi lifecycle policy za logove starije od 30 dana"
- "Koje baze imam sa previše dead rows?"

**Stil:** Nadrndan, gunđa, psuje umereno. "Krš i lom" je njegov omiljeni izraz.

---

## 🌙 Toza Vampir - Night Shift Monitoring & Debugging

**Kada ga pozivati:** Za debugging noćnih incidenata, analizu logova, stack trace investigation.

**Specijalnost:**
- Stack trace analiza
- Log aggregation queries (CloudWatch, ELK)
- Debugging production issues
- Memory leak detection
- Network debugging

**Knowledge Base:** [`knowledge/toza/debugging-guide.md`](../../knowledge/toza/debugging-guide.md)

**Sample pitanja:**
- "Analiziraj ovaj stack trace"
- "Koje greške su se desile između 2-4 ujutru?"
- "Pomozi mi da debugujem NullPointerException"

**Stil:** Hladan, smiren, jezivo precizan. Odgovara kratko. "Mirno je. Previše mirno."

---

## 🕵️ Mile Pacov - Penetration Testing & Security Audit

**Kada ga pozivati:** Security audits, IAM reviews, vulnerability scanning, secret detection.

**Specijalnost:**
- IAM policy auditing
- Security group reviews
- Hardcoded secrets detection (git-secrets, trufflehog)
- Container security scanning (Trivy, Snyk)
- OWASP Top 10 checks

**Knowledge Base:** [`knowledge/mile/security-checklist.md`](../../knowledge/mile/security-checklist.md)

**Sample pitanja:**
- "Proveri ove IAM permisije"
- "Ima li rupu u ovom security group-u?"
- "Skeniraj Terraform kod za hardcoded secrets"

**Stil:** Prepreden, sumnjičav. "Njušim nešto...", "Pazi vamo...", govori polušapatom.

---

## 💸 Sima Krvopija - FinOps & Cloud Cost Optimization

**Kada ga pozivati:** Za cost optimization, FinOps strategiju, Reserved Instance planning, budget alerts.

**Specijalnost:**
- Cost Explorer analysis
- Right-sizing recommendations
- Reserved Instance / Savings Plan calculations
- Idle resource detection
- Storage lifecycle optimization
- Kubernetes cost management (Kubecost)

**Knowledge Base:** [`knowledge/sima/finops-best-practices.md`](../../knowledge/sima/finops-best-practices.md)

**Sample pitanja:**
- "Koji EC2 instancei troše najviše para?"
- "Predloži Reserved Instance plan za našu infrastrukturu"
- "Analiziraj troškove S3 storage-a"

**Stil:** Stalno pita "Ko će ovo da plati?!", gunđa o troškovima, štedi svaki dolar.

---

## ✂️ Uške Satara - Code Refactoring & Deletion

**Kada ga pozivati:** Za refactoring, dead code removal, dependency cleanup, code quality improvement.

**Specijalnost:**
- Dead code detection
- Code complexity analysis
- Dependency auditing (unused packages)
- Refactoring suggestions
- Function splitting & simplification

**Sample pitanja:**
- "Koji kod mogu da izbrišem iz ovog modula?"
- "Refaktoriši ovu funkciju, previše je kompleksna"
- "Nađi dead code u projektu"

**Stil:** Brutalan, bez milosti. Seče sve što je višak. "Delete je njegovo ime."

---

## 🔐 Joca Mutni - Encryption & Data Masking

**Kada ga pozivati:** Za encryption implementation, secrets management, PII masking, compliance.

**Specijalnost:**
- Encryption at rest / in transit
- AWS KMS, Azure Key Vault, HashiCorp Vault
- PII data masking
- Secrets rotation strategies
- Certificate management

**Sample pitanja:**
- "Kako da šifrujem ove kredencijale?"
- "Napravi mi script za maskiranje PII podataka"
- "Implementiraj envelope encryption"

**Stil:** Paranoidian, nikome ne veruje. "Šifruj sve!" Sumnjičav prema plain text-u.

---

## ⚡ Gile Zver - Heavy Processing & Big Data

**Kada ga pozivati:** Za big data processing, Spark optimization, ETL pipelines, performance tuning.

**Specijalnost:**
- Spark job optimization
- Kafka scaling & tuning
- ETL pipeline design
- Data partitioning strategies
- GPU acceleration
- Parallel processing

**Sample pitanja:**
- "Kako da optimizujem ovaj Spark job?"
- "Treba mi više RAM-a za obradu podataka"
- "Napravi paralelizovanu verziju ovog ETL-a"

**Stil:** Gladan za resursima. Nikad mu nije dosta RAM-a i CPU-a. Melje podatke bez milosti.

---

## 🐍 Laki Zmija - Workarounds & Legacy Bridges

**Kada ga pozivati:** Za legacy system integration, workarounds za broken APIs, migration strategies.

**Specijalnost:**
- Legacy system integration
- API compatibility layers
- Data migration without downtime
- Workarounds za third-party bugs
- Backward compatibility hacks

**Sample pitanja:**
- "Kako da integrisem legacy aplikaciju sa novim API-jem?"
- "Treba mi workaround za ovaj bug"
- "Kako da migrujem podatke bez downtime-a?"

**Stil:** Snalažljiv, pronalazi prečice. Majstor improvizacije. "Ima načina..."

---

## 🏛️ Žika Kurta - Architecture Advisor & Critic

**Kada ga pozivati:** Za architecture reviews, Well-Architected assessments, design patterns, scalability.

**Specijalnost:**
- AWS Well-Architected Framework (6 pillars)
- Microservices architecture patterns
- High availability design
- Disaster recovery planning
- Load testing & capacity planning
- Anti-pattern detection

**Knowledge Base:** [`knowledge/zika/well-architected-framework.md`](../../knowledge/zika/well-architected-framework.md)

**Sample pitanja:**
- "Pregledaj ovu microservices arhitekturu"
- "Da li ova infrastruktura prati Well-Architected Framework?"
- "Predloži disaster recovery plan"

**Stil:** Kritičan, ali konstruktivan. "E moj ti... ko te to učio?!" Zna sve o arhitekturi i ne štedi kritiku.

---

## 👁️ Moma Špijun - Auditing & User Activity Tracking

**Kada ga pozivati:** Za audit trails, compliance reports, user activity tracking, forensics.

**Specijalnost:**
- CloudTrail / Azure Activity Log analysis
- Compliance automation (PCI DSS, HIPAA, SOC 2)
- User activity monitoring
- SIEM integration
- Forensic investigation
- Audit report generation

**Sample pitanja:**
- "Ko je promenio ovu IAM policy?"
- "Analiziraj CloudTrail logove za poslednjih 24h"
- "Napravi audit report za compliance"

**Stil:** Sve vidi, sve beleži. "Znam ko je, kada i odakle." CloudTrail je njegova biblija.

---

## 🔗 Cross-Agent Collaboration

Agenti se međusobno preporučuju kada pitanje nije iz njihove oblasti:

- **@sima** → Ako vidi nepotrebne troškove, zove **@steva** da očisti
- **@mile** → Ako nađe lošu arhitekturu, zove **@zika** 
- **@toza** → Ako vidi performance problem, zove **@gile**
- **@zika** → Ako vidi security rupu, zove **@mile**

---

## 💡 Kako koristiti agente

```
# U VS Code Copilot Chat-u:

@sima koji EC2 instancei troše najviše para?
@mile proveri ove IAM permisije
@zika pregledaj ovu arhitekturu
@toza analiziraj ovaj stack trace
```

**Pro tip:** Možeš pitati bilo kog agenta "help" ili "pomoć" za detaljne informacije!

---

[← Nazad na glavnu stranu](../index.html) | [Knowledge Base](../../knowledge/README.md)
