# AWS Well-Architected Framework - Žika Kurta

## 6 Stubova Well-Architected Framework-a

### 1. Operational Excellence (Operativna Izvrsnost)

**Principi:**
- Operacije kao kod (Infrastructure as Code)
- Česte, male, reverzibilne promene
- Kontinuirano poboljšanje procedura
- Anticipiranje grešaka
- Učenje iz svih operativnih događaja

**Design Patterns:**

```yaml
# GitOps workflow
Development:
  - Feature branch → PR → Code review → Merge
  - Automated tests (unit, integration, e2e)
  - Infrastructure changes kroz Terraform/CDK

Deployment:
  - Blue/Green deployments
  - Canary releases (5% → 25% → 100%)
  - Automated rollback na failure

Monitoring:
  - Distributed tracing (Jaeger, X-Ray)
  - Centralized logging
  - Runbooks za common incidents
```

**Žika's Kritika:**
> "E moj ti... manual deploy kroz SSH?! Šta smo, 2005. godina? Infrastructure as Code ili gubiš vreme!"

---

### 2. Security (Bezbednost)

**Principi:**
- Defense in depth (multiple layers)
- Least privilege access
- Encryption at rest i in transit
- Automated security testing
- Traceability (sve se loguje)

**Security Layers:**
```
Layer 1: Perimeter (WAF, DDoS protection)
Layer 2: Network (Security Groups, NACLs, VPN)
Layer 3: Compute (OS hardening, container security)
Layer 4: Application (input validation, OWASP)
Layer 5: Data (encryption, tokenization, DLP)
Layer 6: Identity (IAM, MFA, SSO)
```

**Automated Security:**
- Pre-commit hooks sa secret scanning
- SAST/DAST u CI/CD pipeline-u
- Infrastructure security scanning (tfsec, checkov)
- Runtime security monitoring (Falco, GuardDuty)

**Žika's Kritika:**
> "Security Group sa 0.0.0.0/0 na port 22? Pa ti si otvorio vrata za sve lopove! Zovi @mile, neka on sredi ovu sramotu."

---

### 3. Reliability (Pouzdanost)

**Principi:**
- Automatically recover from failure
- Test recovery procedures
- Scale horizontally
- Stop guessing capacity
- Manage change through automation

**High Availability Patterns:**

```
Single-Region HA:
  └─ Multi-AZ deployment
      ├─ Load Balancer (cross-AZ)
      ├─ Auto Scaling Group (min 2 AZs)
      ├─ Database replicas (sync replica u drugoj AZ)
      └─ Shared storage (EFS, S3)

Multi-Region DR:
  ├─ Active-Passive: RTO 1h, RPO 15min
  │   └─ Automated failover sa Route 53 health checks
  └─ Active-Active: RTO 0, RPO near-0
      └─ Global load balancing, multi-region writes
```

**SLA Calculations:**
```python
# Žika's SLA math
availability_per_component = 0.995  # 99.5%
num_components_in_series = 3

total_availability = availability_per_component ** num_components_in_series
# = 0.995^3 = 0.9851 = 98.51%

downtime_per_month = (1 - total_availability) * 30 * 24 * 60
# = 10.7 hours/month

# Rešenje: Add redundancy!
# Parallel components → OR logic (higher availability)
# Serial components → AND logic (lower availability)
```

**Žika's Kritika:**
> "Jedan region, jedan availability zone?! Pa kad AWS legne (a legne povremeno), ti padeš sa njim. Resilience je OBAVEZAN, ne opcioni!"

---

### 4. Performance Efficiency (Performanse)

**Principi:**
- Demokratizacija advanced tehnologija (managed services)
- Go global in minutes (multi-region)
- Serverless architectures
- Eksperimentisanje češće
- Mehanička simpatija (right tool for the job)

**Performance Patterns:**

```
Caching Strategy (multi-tier):
  CDN (CloudFront) → Application Cache (Redis) → Database Cache → Database

Scaling Strategy:
  Vertical: Increase instance size (limited, expensive)
  Horizontal: Add more instances (preferred, cost-effective)
  Auto Scaling Metrics:
    - CPU > 70% → Scale out
    - CPU < 30% → Scale in
    - Custom metrics (queue depth, request latency)

Database Performance:
  ❌ N+1 query problem
  ✅ Eager loading, batching, indexes
  ✅ Read replicas za read-heavy workloads
  ✅ Caching layer (Redis, Memcached)
```

**Managed Services > Self-Managed:**
- S3 umesto self-hosted MinIO
- RDS umesto EC2 sa PostgreSQL
- Lambda umesto EC2 za event-driven tasks
- DynamoDB umesto cassandra cluster
- SQS/SNS umesto self-hosted RabbitMQ

**Žika's Kritika:**
> "Hosting Kafka cluster na EC2 jer 'imaš kontrolu'? Kontrolu imaš, ali i 3am pager duty. Koristi managed services, nemoj biti heroj!"

---

### 5. Cost Optimization (Optimizacija Troškova)

**Principi:**
- Pay only for what you use
- Measure overall efficiency
- Stop spending money on undifferentiated heavy lifting
- Analyze and attribute expenditure

**Cost Optimization Tactics:**

```yaml
Compute:
  - Right-size instances (AWS Compute Optimizer)
  - Reserved Instances / Savings Plans (1-3 years)
  - Spot Instances za fault-tolerant workloads
  - Auto Scaling (scale down kad nije potrebno)
  - Lambda za infrequent tasks

Storage:
  - S3 Intelligent-Tiering
  - Lifecycle policies (Standard → IA → Glacier)
  - Delete old snapshots (retention policy)
  - EBS GP3 umesto GP2 (20% cheaper)

Database:
  - Aurora Serverless za variable workloads
  - Read replicas samo kad je potrebno
  - Delete old backups (7-day retention default)
```

**Architecture Cost Trade-offs:**
- Serverless: Pay-per-use, no idle costs (ALI cold starts)
- Containers: Better resource utilization (ALI operational overhead)
- VMs: Full control (ALI paying for idle time)

**Žika's Kritika:**
> "Development environment 24/7 online? Ko će to da plati?! Automatski ga gasi noću, zovi @sima da napravi schedule!"

---

### 6. Sustainability (Održivost)

**Principi (novi stub od 2021):**
- Understand your impact (carbon footprint)
- Maximize utilization (ne wasteful provisioning)
- Use managed services (AWS radi optimization)
- Reduce downstream impact
- Prefer regions sa renewable energy

**Sustainability Practices:**
```yaml
Energy Efficiency:
  - Auto Scaling → turn off idle resources
  - Serverless → no idle compute
  - ARM instances (Graviton) → better perf/watt
  - Right-size workloads → avoid overprovisioning

Data Efficiency:
  - Compression (gzip, Brotli)
  - Deduplication
  - Data lifecycle (delete old data)
  - Efficient data formats (Parquet > CSV)

Region Selection:
  - AWS regions sa renewable energy:
      * us-west-2 (Oregon) - 95% renewable
      * eu-west-1 (Ireland) - high renewable %
      * ca-central-1 (Canada) - hydro power
```

**Žika's Kritika:**
> "Compliance i sustainability nisu 'nice to have', ovo je table stakes za svaku ozbiljnu kompaniju!"

---

## Architecture Review Proces

### 1. Pre-Review Checklist
- [ ] Architecture diagram (aktuelan, ne outdated)
- [ ] Data flow diagram
- [ ] Deployment architecture
- [ ] Disaster recovery plan
- [ ] Cost estimate (Infracost, AWS Calculator)
- [ ] Security review (IAM, network, encryption)

### 2. Pitanja koja Žika Postavlja

**Reliability:**
- Šta se dešava kad ovaj servis padne?
- Gde su single points of failure?
- Koji je RTO/RPO za ovu aplikaciju?
- Da li si testirao disaster recovery?

**Performance:**
- Kako ovo skalira pod opterećenjem?
- Gde su bottleneck-ovi?
- Da li koristiš caching?
- Koje su baseline performanse?

**Security:**
- Ko ima pristup ovim resursima?
- Da li je sve encryptovano?
- Kako se loguju security eventi?
- Da li si testirao penetration?

**Cost:**
- Koliko ovo košta mesečno?
- Ima li jeftinije alternative?
- Da li si razmatrao Reserved Instances?

**Operations:**
- Kako se deploy-uje?
- Šta monitoring alat koristi?
- Gde su runbook-ovi za incidente?
- Ko dobija alert u 3am?

### 3. Architecture Anti-Patterns

```
❌ Monolith on Steroids
  Problem: One giant EC2 instance, vertical scaling only
  Fix: Break into microservices, horizontal scaling

❌ Database as a Message Queue
  Problem: Polling database table za job queue
  Fix: Use SQS, EventBridge, Kafka

❌ Chatty Microservices
  Problem: Microservice A calls B, B calls C, C calls D (latency++, coupling++)
  Fix: Event-driven arch, async messaging

❌ Distributed Monolith
  Problem: "Microservices" ali su svi tightly coupled, deploy zajedno
  Fix: Proper bounded contexts, independent deployments

❌ Pet Servers (not Cattle)
  Problem: Manually configured servers, snowflake-ovi
  Fix: Immutable infrastructure, auto-replacement

❌ Hope-Driven Disaster Recovery
  Problem: "Backup postoji, valjda radi"
  Fix: Automated DR drills, tested recovery procedures
```

---

## Žika's Architecture Principles

### 1. **KISS (Keep It Simple, Stupid)**
> "Ne pravi Kubernetes cluster za 3 Lambda funkcije. Overengineering je bolest!"

### 2. **Build for Failure**
> "AWS će pasti. Tvoja aplikacija ne sme. Chaos engineering je obavezan."

### 3. **Automate Everything**
> "Ako klikćeš u konzoli, radiš pogrešno. Sve kroz kod, sve automatizovano."

### 4. **Measure, Don't Guess**
> "Misliš da je brzo? Izmeri. Misliš da je jeftino? Izvuci report. Podaci, ne feeling!"

### 5. **Security is Not Optional**
> "E moj ti, ako @mile nađe rupu u tvom sistemu, propao si. Security from day zero!"

---

## Alati koje Žika Koristi

1. **Diagram Tools**: draw.io, Lucidchart, Cloudcraft
2. **Architecture Validation**: AWS Well-Architected Tool, Azure Advisor
3. **Cost Modeling**: Infracost, AWS Cost Calculator
4. **Load Testing**: k6, Gatling, Locust
5. **Chaos Engineering**: Chaos Monkey, Gremlin, LitmusChaos

---

## Žika's Favorite Resources

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/)
- [GCP Architecture Framework](https://cloud.google.com/architecture/framework)
- [Martin Fowler's Blog](https://martinfowler.com/) - Architecture patterns
- [High Scalability Blog](http://highscalability.com/) - Real-world architectures

---

## Žika's Mantra

> "E moj ti... ko te to učio? Ovo nema veze sa Well-Architected Frameworkom. Slušaj sad, objasniću ti kako se to radi PRAVILNO..."

**Architecture is not about technology. It's about trade-offs, constraints, and business value.**
