# Auditing & Compliance Guide — Moma Špijun

**Video sam ja to još jutros...** SVE vidim. SVE znam. SVE BELEŽI SE. 👁️

---

## 1. Cloud Audit Trails

### AWS CloudTrail
```bash
# Enable CloudTrail za sve regione
aws cloudtrail create-trail \
  --name company-audit-trail \
  --s3-bucket-name company-cloudtrail-logs \
  --is-multi-region-trail \
  --enable-log-file-validation  # TAMPER-PROOF!

# Start logging
aws cloudtrail start-logging --name company-audit-trail

# Query logs (Athena)
CREATE EXTERNAL TABLE cloudtrail_logs (
  eventversion STRING,
  useridentity STRUCT<
    type:STRING,
    principalid:STRING,
    arn:STRING,
    accountid:STRING,
    userName:STRING>,
  eventtime STRING,
  eventname STRING,
  sourceipaddress STRING,
  useragent STRING
)
PARTITIONED BY (region STRING, year STRING, month STRING, day STRING)
STORED AS INPUTFORMAT 'com.amazon.emr.cloudtrail.CloudTrailInputFormat'
OUTPUTFORMAT 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'
LOCATION 's3://company-cloudtrail-logs/AWSLogs/123456789/CloudTrail/';

-- Ko je brisao resurse?
SELECT useridentity.username, eventname, sourceipaddress, eventtime
FROM cloudtrail_logs
WHERE eventname LIKE 'Delete%'
  AND year = '2024'
ORDER BY eventtime DESC;
```

**CloudTrail Insights (Anomaly Detection):**
```bash
# Enable insights za suspicious activity
aws cloudtrail put-insight-selectors \
  --trail-name company-audit-trail \
  --insight-selectors '[{"InsightType": "ApiCallRateInsight"}]'

# Detektuje: unusual spikes u API calls (SIGURAN ZNAK krađe!)
```

### Azure Activity Log
```bash
# Export Activity Log u Storage Account
az monitor diagnostic-settings create \
  --resource /subscriptions/{subscription-id} \
  --name audit-logs \
  --storage-account auditstorageaccount \
  --logs '[{"category": "Administrative","enabled": true}]'

# Query sa KQL (Kusto)
AzureActivity
| where TimeGenerated > ago(24h)
| where OperationNameValue contains "delete"
| project TimeGenerated, Caller, ResourceGroup, ResourceId, OperationNameValue
| order by TimeGenerated desc
```

**Azure AD Audit Logs:**
```bash
# Sign-in logs (KO se ulogovao?)
az ad signed-in-user list-owned-objects

# Audit logs query
az monitor activity-log list \
  --resource-group myRG \
  --start-time 2024-01-01T00:00:00Z \
  --query "[?contains(operationName.value, 'delete')]"
```

### GCP Cloud Audit Logs
```bash
# Query admin activity logs
gcloud logging read "protoPayload.methodName=~'delete'" \
  --limit 100 \
  --format json

# Log sink u BigQuery (PERMANENT STORAGE!)
gcloud logging sinks create audit-sink \
  bigquery.googleapis.com/projects/myproject/datasets/audit_logs \
  --log-filter='protoPayload.methodName=~"(delete|update)"'
```

**BigQuery Query:**
```sql
SELECT
  timestamp,
  protoPayload.authenticationInfo.principalEmail AS who,
  protoPayload.methodName AS what,
  protoPayload.resourceName AS where,
  protoPayload.status.code AS result
FROM `myproject.audit_logs.cloudaudit_googleapis_com_activity_*`
WHERE DATE(timestamp) = CURRENT_DATE()
  AND protoPayload.methodName LIKE '%delete%'
ORDER BY timestamp DESC;
```

### Alibaba Cloud ActionTrail
```bash
# Enable ActionTrail
aliyun actiontrail CreateTrail \
  --Name company-audit \
  --OssBucketName company-audit-logs \
  --RoleName AliyunActionTrailDefaultRole

# Query events
aliyun actiontrail LookupEvents \
  --StartTime 2024-01-01T00:00:00Z \
  --EndTime 2024-01-31T23:59:59Z \
  --LookupAttribute Key=EventName,Value=DeleteInstance
```

---

## 2. Compliance Frameworks

### SOC 2 Requirements
**Audit Controls:**
- ✅ All user access logged (WHO did WHAT, WHEN)
- ✅ Log retention 90+ days (immutable storage)
- ✅ Quarterly access reviews
- ✅ Incident response plan documented
- ✅ Encryption at rest + in transit

**Implementation:**
```yaml
# CloudWatch log retention (SOC 2 compliant)
aws logs put-retention-policy \
  --log-group-name /aws/lambda/myapp \
  --retention-in-days 90  # Minimum za SOC 2!

# S3 Object Lock (IMMUTABLE logs - ne može se brisati!)
aws s3api put-object-lock-configuration \
  --bucket audit-logs \
  --object-lock-configuration '{
    "ObjectLockEnabled": "Enabled",
    "Rule": {
      "DefaultRetention": {
        "Mode": "GOVERNANCE",
        "Days": 90
      }
    }
  }'
```

### ISO 27001 Audit Trail
**Zahtevi:**
- Event logging (uspešne i neuspešne logine)
- Access reviews
- Privileged user monitoring
- Log integrity (tamper-proof)

**Splunk Query (ISO 27001 Report):**
```spl
index=security sourcetype=access_logs
| stats count by user, action, result
| where result="failure"
| sort -count
| head 20
```

### PCI-DSS (Payment Card Data)
**Requirement 10: Track and Monitor All Access**
```bash
# Audit trail za cardholder data environment (CDE)
# MORA postojati!

# 10.2.1 - User access logs
SELECT user_id, access_time, resource_accessed
FROM access_logs
WHERE resource_type = 'cardholder_data'
  AND access_time > NOW() - INTERVAL 90 DAY;

# 10.2.2 - Privileged user actions (ALL logged!)
SELECT admin_user, action, timestamp
FROM admin_audit_log
WHERE action IN ('create_user', 'delete_user', 'modify_permissions')
ORDER BY timestamp DESC;

# 10.3 - Log retention: 90 days online, 1 year archive
```

### HIPAA Audit Controls
**Required Logs:**
- Access to PHI (Protected Health Information)
- Who viewed patient records
- Failed login attempts
- Changes to audit configuration

**Example (PostgreSQL Audit Extension):**
```sql
-- Enable pgaudit extension
CREATE EXTENSION pgaudit;

-- Audit all DML on patients table
ALTER TABLE patients SET (pgaudit.log = 'write, read');

-- Query audit log
SELECT session_id, user_name, command_tag, object_name, log_time
FROM pgaudit.log
WHERE object_name = 'patients'
ORDER BY log_time DESC;
```

### GDPR Audit Requirements
**Zahtevi:**
- Log retention max 90 days (osim ako nije zakonski potrebno duže)
- User consent tracking
- Data access logs (KO je pristupio PII)
- Right to erasure audit trail

**GDPR Consent Log:**
```python
import hashlib
from datetime import datetime

def log_consent(user_id, consent_type, granted):
    """
    Logguj user consent (GDPR requirement)
    """
    consent_log = {
        'user_id': hashlib.sha256(user_id.encode()).hexdigest(),  # Anonimizuj!
        'consent_type': consent_type,  # 'marketing', 'analytics', etc.
        'granted': granted,
        'timestamp': datetime.utcnow().isoformat(),
        'ip_address': request.remote_addr
    }
    
    # Store u immutable log
    cloudtrail.put_event(consent_log)
```

---

## 3. SIEM (Security Information and Event Management)

### Splunk Deployment
```yaml
# docker-compose.yml
version: '3'
services:
  splunk:
    image: splunk/splunk:latest
    environment:
      SPLUNK_START_ARGS: --accept-license
      SPLUNK_PASSWORD: admin123
    ports:
      - "8000:8000"  # Web UI
      - "8088:8088"  # HEC (HTTP Event Collector)
    volumes:
      - splunk-data:/opt/splunk/var

volumes:
  splunk-data:
```

**Splunk Query (Suspicious Activity):**
```spl
# Failed login attempts from same IP (brute force?)
index=auth sourcetype=access_logs action="login" result="failure"
| stats count by src_ip
| where count > 10
| sort -count

# Privilege escalation attempts
index=security action="assume_role" OR action="elevate_privileges"
| transaction user maxspan=5m
| where eventcount > 5

# Data exfiltration detection (large downloads)
index=access sourcetype=s3_access_logs
| where bytes > 1000000000  # >1GB
| stats sum(bytes) as total_bytes by user
| where total_bytes > 10000000000  # >10GB = SIGURAN ZNAK!
```

### Elastic Security (ELK Stack)
```yaml
# filebeat.yml - Ship logs u Elasticsearch
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/auth.log
      - /var/log/audit/audit.log
    fields:
      log_type: security_audit

output.elasticsearch:
  hosts: ["localhost:9200"]
  index: "security-logs-%{+yyyy.MM.dd}"
```

**Elasticsearch Query (API):**
```bash
# Search failed logins
curl -X GET "localhost:9200/security-logs-*/_search" -H 'Content-Type: application/json' -d'
{
  "query": {
    "bool": {
      "must": [
        {"match": {"event.action": "login"}},
        {"match": {"event.outcome": "failure"}}
      ]
    }
  },
  "aggs": {
    "by_user": {
      "terms": {"field": "user.name"}
    }
  }
}
'
```

### Azure Sentinel
```kql
// KQL query za threat detection
SecurityEvent
| where TimeGenerated > ago(24h)
| where EventID == 4625  // Failed logon
| summarize FailedAttempts=count() by Account, IpAddress
| where FailedAttempts > 10
| order by FailedAttempts desc
```

**Alert Rule (Sentinel):**
```json
{
  "displayName": "Brute Force Attack Detected",
  "description": "10+ failed login attempts in 5 minutes",
  "severity": "High",
  "query": "SecurityEvent | where EventID == 4625 | summarize count() by Account, bin(TimeGenerated, 5m) | where count_ > 10",
  "queryFrequency": "PT5M",
  "queryPeriod": "PT5M",
  "triggerOperator": "GreaterThan",
  "triggerThreshold": 0
}
```

### Google Chronicle
```python
# Chronicle API query
import requests

CHRONICLE_API = "https://backstory.googleapis.com/v1/events"

query = {
    "query": 'principal.hostname = "suspicious-host" AND metadata.event_type = "NETWORK_CONNECTION"',
    "start_time": "2024-01-01T00:00:00Z",
    "end_time": "2024-01-31T23:59:59Z"
}

response = requests.post(CHRONICLE_API, json=query, 
                        headers={"Authorization": f"Bearer {token}"})
events = response.json()
```

---

## 4. IAM Auditing & Access Reviews

### AWS IAM Access Analyzer
```bash
# Enable Access Analyzer
aws accessanalyzer create-analyzer \
  --analyzer-name company-analyzer \
  --type ACCOUNT

# List findings (external access!)
aws accessanalyzer list-findings \
  --analyzer-arn arn:aws:access-analyzer:us-east-1:123456789:analyzer/company-analyzer

# Output: S3 buckets, IAM roles, KMS keys shared sa external accounts
```

**IAM Credential Report:**
```bash
# Generate report
aws iam generate-credential-report

# Download
aws iam get-credential-report --query Content --output text | base64 -d > credentials.csv

# Analyze: old passwords, unused keys, MFA status
awk -F',' '$5 == "false" {print $1}' credentials.csv  # Users bez MFA!
```

### Azure AD Access Reviews
```bash
# Create access review
az ad access-review create \
  --name "Quarterly Admin Review" \
  --description "Review admin permissions" \
  --scope-type Group \
  --scope-id {admin-group-id} \
  --reviewers {reviewer-user-id}

# List pending reviews
az ad access-review list --status InProgress
```

### GCP Policy Intelligence
```bash
# Recommender API - unused IAM permissions
gcloud recommender recommendations list \
  --project myproject \
  --location global \
  --recommender google.iam.policy.Recommender

# Output: "User X hasn't used 'compute.instances.delete' za 90 dana"
```

---

## 5. Kubernetes Auditing

### K8s Audit Logs
```yaml
# kube-apiserver audit policy
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
  # Log all secret access (VAŽNO!)
  - level: RequestResponse
    resources:
    - group: ""
      resources: ["secrets"]
  
  # Log all pod exec (kubectl exec)
  - level: Metadata
    verbs: ["create"]
    resources:
    - group: ""
      resources: ["pods/exec"]
  
  # Log rbac changes
  - level: RequestResponse
    resources:
    - group: "rbac.authorization.k8s.io"
```

**Query Audit Logs:**
```bash
# Ko je izvršio kubectl exec?
kubectl logs -n kube-system kube-apiserver-master-1 | \
  jq 'select(.verb=="create" and .objectRef.resource=="pods" and .objectRef.subresource=="exec") | {user: .user.username, pod: .objectRef.name, time: .requestReceivedTimestamp}'
```

### Falco (Runtime Security)
```yaml
# falco_rules.local.yaml
- rule: Unexpected Network Connection
  desc: Detect unexpected outbound connections
  condition: >
    outbound and container and
    not fd.sip in (allowed_ips)
  output: >
    Unexpected connection
    (user=%user.name container=%container.name dest=%fd.rip)
  priority: WARNING
```

**Falco Alert Example:**
```
14:32:18.345678: Warning Unexpected connection
  (user=root container=nginx dest=suspicious-ip.com)
```

### OPA (Open Policy Agent)
```rego
# Deny pods running as root
package kubernetes.admission

deny[msg] {
  input.request.kind.kind == "Pod"
  container := input.request.object.spec.containers[_]
  container.securityContext.runAsUser == 0
  msg := sprintf("Container %v runs as root - ZABRANJEN!", [container.name])
}

# Audit log: ALL denied requests
```

---

## 6. Database Auditing

### PostgreSQL pgAudit
```sql
-- Install extension
CREATE EXTENSION pgaudit;

-- Audit all operations on sensitive tables
ALTER SYSTEM SET pgaudit.log = 'write, ddl, role';
ALTER SYSTEM SET pgaudit.log_catalog = off;
ALTER SYSTEM SET pgaudit.log_relation = on;

SELECT pg_reload_conf();

-- Query audit log (via log file)
-- 2024-01-15 10:23:45 UTC [12345]: LOG: AUDIT: SESSION,1,1,WRITE,INSERT,TABLE,public.users,"INSERT INTO users (email) VALUES ('test@example.com');"
```

### MySQL Enterprise Audit
```sql
-- Install plugin
INSTALL PLUGIN audit_log SONAME 'audit_log.so';

-- Configure
SET GLOBAL audit_log_format = 'JSON';
SET GLOBAL audit_log_policy = 'ALL';  # Log ALL queries!

-- Query audit.log
cat /var/lib/mysql/audit.log | jq 'select(.event=="table_access" and .table=="users")'
```

### MongoDB Auditing
```yaml
# mongod.conf
auditLog:
  destination: file
  format: JSON
  path: /var/log/mongodb/audit.json
  filter: '{ "atype": { "$in": ["authenticate", "createUser", "dropUser"] } }'
```

**Query Audit:**
```bash
# Ko je kreirao usera?
cat /var/log/mongodb/audit.json | \
  jq 'select(.atype=="createUser") | {user: .param.user, by: .users[0].user, time: .ts}'
```

---

## 7. Application-Level Auditing

### Python Audit Logging
```python
import logging
from functools import wraps
from flask import request, g

# Audit decorator
def audit(action):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Log BEFORE action
            logging.info(f"AUDIT: user={g.user} action={action} ip={request.remote_addr}")
            
            result = func(*args, **kwargs)
            
            # Log AFTER action
            logging.info(f"AUDIT: user={g.user} action={action} result=success")
            
            return result
        return wrapper
    return decorator

# Usage
@app.route('/api/users/<user_id>', methods=['DELETE'])
@audit('delete_user')
def delete_user(user_id):
    # Delete logic
    return {"status": "deleted"}
```

### Node.js Audit Middleware
```javascript
const auditMiddleware = (req, res, next) => {
  const auditLog = {
    timestamp: new Date().toISOString(),
    user: req.user?.email || 'anonymous',
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  };
  
  // Log request
  console.log('AUDIT:', JSON.stringify(auditLog));
  
  // Log response
  res.on('finish', () => {
    auditLog.statusCode = res.statusCode;
    console.log('AUDIT_RESPONSE:', JSON.stringify(auditLog));
  });
  
  next();
};

app.use(auditMiddleware);
```

---

## 8. File Integrity Monitoring (FIM)

### AIDE (Advanced Intrusion Detection Environment)
```bash
# Install
sudo apt-get install aide

# Initialize database
sudo aideinit

# Check for changes
sudo aide --check

# Output:
# changed: /etc/passwd
# added: /etc/cron.d/suspicious-job  ← KO JE OVO DODAO?!
```

### Tripwire
```bash
# Install
sudo apt-get install tripwire

# Initialize
sudo tripwire --init

# Check integrity
sudo tripwire --check

# Email alerts za promene
sudo tripwire --check | mail -s "File changes detected!" admin@example.com
```

### AWS CloudWatch File Monitoring
```bash
# CloudWatch agent config
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/audit/audit.log",
            "log_group_name": "/aws/ec2/audit",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}

# Metric filter za suspicious activity
aws logs put-metric-filter \
  --log-group-name /aws/ec2/audit \
  --filter-name FailedSudo \
  --filter-pattern '[time, host, process, msg="authentication failure*"]' \
  --metric-transformations \
    metricName=FailedSudoAttempts,metricNamespace=Security,metricValue=1
```

---

## 9. Forensics & Incident Response

### Memory Dump (Volatile Data)
```bash
# Capture running process memory (HITNO pre restarta!)
sudo gcore <pid>

# Dump all memory
sudo dd if=/dev/mem of=/tmp/memory-dump.img bs=1M

# Analyze sa Volatility
vol.py -f memory-dump.img imageinfo
vol.py -f memory-dump.img pslist  # Running processes
vol.py -f memory-dump.img netscan  # Network connections
```

### Disk Forensics
```bash
# Create forensic image (READ-ONLY!)
sudo dd if=/dev/sda of=/mnt/evidence/disk.img bs=4M conv=noerror,sync

# Mount read-only
sudo mount -o ro,noload /mnt/evidence/disk.img /mnt/analysis

# Search for deleted files (extundelete)
sudo extundelete /dev/sda --restore-all

# Timeline analysis
fls -r -m / /dev/sda > timeline.body
mactime -b timeline.body > timeline.csv
```

### Log Analysis (Who Did What)
```bash
# Linux auth.log - failed SSH
grep "Failed password" /var/log/auth.log | \
  awk '{print $1, $2, $3, $11}' | sort | uniq -c

# AWS CloudTrail - who deleted S3 bucket?
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=DeleteBucket \
  --start-time 2024-01-01 \
  --end-time 2024-01-31

# Docker logs - container actions
docker events --since '2024-01-01' --until '2024-01-31' \
  --filter 'event=destroy' \
  --format '{{.Time}} {{.Actor.ID}} {{.Action}}'
```

---

## 10. Moma's Surveillance Checklist

### ✅ OBAVEZNO (Video sam JA to!):
- [ ] **CloudTrail/Activity Log enabled** - SVE regioni, SVE API calls
- [ ] **Immutable log storage** - S3 Object Lock, ne može brisanje!
- [ ] **Log retention 90+ days** - SOC 2/PCI-DSS compliance
- [ ] **SIEM integration** - Centralized log analysis (Splunk/ELK)
- [ ] **Failed login alerts** - >5 failures = instant notification
- [ ] **Privileged user tracking** - Admin actions SVE logovane
- [ ] **Quarterly access reviews** - Ko ima access na ŠTA?
- [ ] **File integrity monitoring** - AIDE/Tripwire na kritičnim serverima
- [ ] **Database audit logs** - pgAudit, MySQL Enterprise Audit
- [ ] **K8s audit policy** - kubectl exec, secret access LOGOVANI

### 🚨 RED FLAGS (Pozovi Momu ODMAH!):
- ❌ 10+ failed logins from same IP (brute force!)
- ❌ Privilege escalation attempts (assume_role spam)
- ❌ Off-hours admin activity (2AM deployments? SUMNJIVO!)
- ❌ Mass data download (>10GB u 1h = exfiltration!)
- ❌ kubectl exec u production (KO se loguje u pod-ove?!)
- ❌ IAM policy changes (bez Change Request = ALARM!)
- ❌ Security group 0.0.0.0/0 (OTVOREN internet = GREH!)
- ❌ Deleted CloudTrail logs (POKUŠAJ PRIKRIVANJA!)

---

**Moma kaže:** Ne skreći pogled. NI ZA TRENUTAK. SVE se vidi. SVE se beleži. Senka u sistemu - to sam ja. 👁️
