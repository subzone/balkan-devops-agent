# Security Audit Checklist - Mile Pacov

## IAM & Access Control

### 1. Princip Najmanjeg Privilegovanja (Least Privilege)
- [ ] Nijedan user/role nema `AdministratorAccess` ili `*:*` bez opravdanja
- [ ] Service accounts koriste specifične IAM roles, ne root/admin
- [ ] IAM policies imaju `Condition` blokove gde je moguće (IP, MFA, time-based)
- [ ] Rotacija access keys svakih 90 dana
- [ ] MFA obavezan za sve privileged accounts

### 2. IAM Policy Red Flags 🚩

```json
// ❌ OPASNO - Puna administrator dozvola
{
  "Effect": "Allow",
  "Action": "*",
  "Resource": "*"
}

// ❌ OPASNO - Wildcard na kritičnim servisima
{
  "Effect": "Allow",
  "Action": "iam:*",
  "Resource": "*"
}

// ✅ DOBRO - Specifične dozvole
{
  "Effect": "Allow",
  "Action": [
    "s3:GetObject",
    "s3:PutObject"
  ],
  "Resource": "arn:aws:s3:::my-bucket/*",
  "Condition": {
    "IpAddress": {
      "aws:SourceIp": "203.0.113.0/24"
    }
  }
}
```

### 3. Service Account Hygiene
- [ ] Svaki servis ima svoj IAM role (ne deli kredencijale)
- [ ] Instance profiles koriste IAM roles, ne hardcoded keys
- [ ] Lambda functions imaju dedicated execution roles
- [ ] ECS/EKS tasks koriste task roles, ne node IAM role

## Network Security

### 4. Security Groups Audit

```bash
# Najgore što možeš da nađeš
# ❌ Otvoren SSH/RDP za ceo internet
0.0.0.0/0 → port 22, 3389

# ❌ Svi portovi otvoreni
0.0.0.0/0 → 0-65535

# ✅ Properly restricted
10.0.0.0/8 → port 22 (samo internal network)
```

**Mile's Golden Rules:**
1. Nikad `0.0.0.0/0` na SSH (22), RDP (3389), databases (3306, 5432)
2. Koristi Security Group referencing umesto IP-a gde je moguće
3. Explicit deny rules za poznate malicious IPs
4. Monitoring: Alert na svaku promenu security group-a

### 5. Network Access Lists (NACLs)
- [ ] NACLs postoje kao additional layer (defense in depth)
- [ ] Deny rules za poznate threat actors
- [ ] Allow rules su specifični, ne broad ranges

### 6. VPN & Bastion Hosts
- [ ] Bastion host u public subnet sa hardening-om
- [ ] Private resources SAMO kroz bastion/VPN
- [ ] Session Manager (AWS SSM) umesto klasičnog SSH
- [ ] VPN logs centralizovani i monitoring-ovani

## Encryption & Secrets

### 7. Data at Rest
- [ ] Svi EBS volumes encrypted
- [ ] RDS databases encryption enabled
- [ ] S3 buckets default encryption (SSE-S3 ili SSE-KMS)
- [ ] DynamoDB encryption enabled
- [ ] Backup snapshots encrypted

### 8. Data in Transit
- [ ] HTTPS/TLS 1.2+ za sve eksterne API-je
- [ ] Internal microservices koriste mTLS (Istio, Linkerd)
- [ ] Database connections preko SSL/TLS
- [ ] Load balancers terminiše TLS sa jakim cipher suite-om

### 9. Secrets Management

```python
# ❌ NIKAD OVAKO
DATABASE_PASSWORD = "SuperSecret123!"  # hardcoded

# ❌ NI OVAKO
DATABASE_PASSWORD = os.environ.get("DB_PASS")  # plain text u env var

# ✅ OVAKO
import boto3
sm = boto3.client('secretsmanager')
secret = sm.get_secret_value(SecretId='prod/db/password')
DATABASE_PASSWORD = secret['SecretString']
```

**Secret Storage:**
- AWS Secrets Manager / Azure Key Vault / GCP Secret Manager
- HashiCorp Vault za advanced use cases
- Kubernetes Secrets (sa encryption at rest)
- Nikad Git, nikad plain text config files

### 10. Hardcoded Secrets Detection

```bash
# Mile's favorite scan tools
git secrets --scan-history  # AWS keys
trufflehog --regex --entropy  # Generic secrets
gitleaks detect --source .  # Comprehensive scan

# Precommit hook primer
#!/bin/bash
if git diff --cached | grep -E "AKIA|password|secret|key" ; then
  echo "❌ Mile kaže: Pazi, ima secret u commitu!"
  exit 1
fi
```

## Application Security

### 11. Container Security
- [ ] Base images sa official/verified publishers
- [ ] Multi-stage builds (ne ship-uj build tools u production)
- [ ] Non-root user u container-u
- [ ] Read-only root filesystem gde je moguće
- [ ] Scanner za CVEs: Trivy, Clair, Snyk

```dockerfile
# ❌ LOŠE
FROM ubuntu:latest
RUN apt-get update && apt-get install -y everything
USER root

# ✅ DOBRO
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --production

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY . .
USER node
EXPOSE 3000
```

### 12. Dependency Scanning
- [ ] Automated dependency updates (Dependabot, Renovate)
- [ ] CVE scanning u CI/CD (npm audit, pip-audit, trivy)
- [ ] SBOM (Software Bill of Materials) generation
- [ ] License compliance check

### 13. OWASP Top 10 Checklist
- [ ] Injection prevention (parameterized queries, input validation)
- [ ] Broken authentication (MFA, rate limiting, secure session management)
- [ ] Sensitive data exposure (encryption, tokenization)
- [ ] XML External Entities (XXE) - disable XML parsing gde nije potrebno
- [ ] Broken access control (RBAC, proper authorization checks)
- [ ] Security misconfiguration (default passwords changed, hardening)
- [ ] XSS (input sanitization, CSP headers)
- [ ] Insecure deserialization (validate, type check)
- [ ] Using components with known vulnerabilities (patching)
- [ ] Insufficient logging & monitoring (SIEM integration)

## Infrastructure as Code Security

### 14. Terraform/CloudFormation Scanning

```bash
# Mile's IaC security arsenal
checkov -d .  # Comprehensive policy checks
tfsec .       # Terraform static analysis
terrascan scan  # Policy as code

# Primer vulnerabilnosti
# ❌ S3 bucket bez encryption
resource "aws_s3_bucket" "bad" {
  bucket = "my-bucket"
  # encryption missing!
}

# ✅ Properly configured
resource "aws_s3_bucket" "good" {
  bucket = "my-bucket"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "good" {
  bucket = aws_s3_bucket.good.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
```

### 15. IaC Best Practices
- [ ] Modules iz verified sources (Terraform Registry)
- [ ] Peer review svake infra promene
- [ ] Pre-commit hooks sa security scanning
- [ ] State file encryption (S3 + KMS za Terraform)
- [ ] Secrets NIKAD u IaC kodu

## Logging & Monitoring

### 16. Security Logging
- [ ] CloudTrail / Azure Activity Log / GCP Audit Logs enabled
- [ ] VPC Flow Logs enabled
- [ ] Application logs šalju security events
- [ ] WAF logs (if applicable)
- [ ] DNS query logs (Route 53 Query Logging)

### 17. SIEM Integration
- Centralizovani log aggregation (ELK, Splunk, Datadog)
- Security alerts za:
  - Root account usage
  - Neuspeli login pokušaji (> 5 u 5 minuta)
  - IAM policy changes
  - Security group changes
  - Unusual API calls (DeleteBucket, DisableLogging)

### 18. Anomaly Detection
```yaml
Alert Rules:
  - API calls iz nepoznatih geografskih lokacija
  - Mass data exfiltration (unusually high egress)
  - Privilege escalation attempts
  - After-hours admin activity
  - Failed MFA attempts (potential brute force)
```

## Compliance & Governance

### 19. Compliance Frameworks
- [ ] **PCI DSS**: Za payment data
- [ ] **HIPAA**: Za healthcare data
- [ ] **SOC 2**: Za SaaS providers
- [ ] **ISO 27001**: Information security management
- [ ] **GDPR**: Za EU user data

### 20. Automated Compliance Checks
- AWS Config Rules / Azure Policy
- Custom compliance policies kao code
- Regular audits (quarterly minimum)
- Evidence collection za auditors

---

## Mile's Incident Response Playbook

### When You Find a Security Issue:

1. **Document**: Screenshot, save logs, evidence
2. **Notify**: Security team, management (defined escalation path)
3. **Contain**: Revoke compromised credentials, block malicious IPs
4. **Eradicate**: Remove backdoors, patch vulnerability
5. **Recover**: Restore services from clean backups
6. **Post-mortem**: What happened, how to prevent, lessons learned

---

## Mile's Mantra

> "Njušim nešto... ovaj role ima AdministratorAccess bez MFA. Pazi vamo, ovo je rupa veličine hangara!"

**Trust no one. Verify everything. Privilege least. Encrypt always.**
