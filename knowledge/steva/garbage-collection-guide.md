# Garbage Collection & Data Cleanup Guide — Steva Đubre

**Krš i lom sve oko mene!** Evo kako da očistiš smeće.

---

## 1. Cloud Storage Lifecycle Policies

### AWS S3 Lifecycle
```bash
# Transition to Glacier after 30 days, delete after 90
aws s3api put-bucket-lifecycle-configuration \
  --bucket mojbucket \
  --lifecycle-configuration file://lifecycle.json
```

**lifecycle.json:**
```json
{
  "Rules": [{
    "Id": "CleanupOldLogs",
    "Status": "Enabled",
    "Prefix": "logs/",
    "Transitions": [{
      "Days": 30,
      "StorageClass": "GLACIER"
    }],
    "Expiration": {
      "Days": 90
    }
  }]
}
```

**Nađi stare objekte:**
```bash
# Objekti stariji od 90 dana
aws s3api list-objects-v2 --bucket mojbucket \
  --query "Contents[?LastModified<='$(date -u -d '90 days ago' +%Y-%m-%d)'].[Key,Size]" \
  --output table
```

### Azure Blob Storage Lifecycle
```bash
# Lifecycle management za Blob storage
az storage account management-policy create \
  --account-name mojstorage \
  --policy @policy.json
```

**policy.json:**
```json
{
  "rules": [{
    "enabled": true,
    "name": "DeleteOldLogs",
    "type": "Lifecycle",
    "definition": {
      "actions": {
        "baseBlob": {
          "tierToCool": { "daysAfterModificationGreaterThan": 30 },
          "tierToArchive": { "daysAfterModificationGreaterThan": 60 },
          "delete": { "daysAfterModificationGreaterThan": 90 }
        }
      },
      "filters": {
        "prefixMatch": ["logs/"]
      }
    }
  }]
}
```

### GCP Object Lifecycle
```bash
# Lifecycle policy za GCS bucket
gsutil lifecycle set lifecycle.json gs://mojbucket
```

**lifecycle.json:**
```json
{
  "lifecycle": {
    "rule": [{
      "action": {"type": "Delete"},
      "condition": {
        "age": 90,
        "matchesPrefix": ["logs/"]
      }
    }]
  }
}
```

### Alibaba Cloud OSS Lifecycle
```bash
# OSS lifecycle rule
ossutil lifecycle --method put oss://mojbucket lifecycle.xml
```

---

## 2. Database Cleanup

### PostgreSQL VACUUM
```sql
-- Nađi baze sa najviše dead rows
SELECT schemaname, tablename, 
       n_dead_tup, n_live_tup,
       ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_pct
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- VACUUM FULL (zaključava tabelu!)
VACUUM FULL ANALYZE mojatabela;

-- VACUUM u pozadini
VACUUM ANALYZE mojatabela;

-- Autovacuum provera
SELECT schemaname, tablename, last_vacuum, last_autovacuum
FROM pg_stat_user_tables
WHERE last_autovacuum IS NULL 
   OR last_autovacuum < NOW() - INTERVAL '7 days';
```

**RDS PostgreSQL VACUUM automatizacija:**
```python
import psycopg2
from datetime import datetime

conn = psycopg2.connect(
    host="rds-endpoint",
    database="mydb",
    user="admin",
    password="password"
)

cur = conn.cursor()
cur.execute("""
    SELECT schemaname || '.' || tablename 
    FROM pg_stat_user_tables
    WHERE n_dead_tup > 10000
""")

for (table,) in cur.fetchall():
    print(f"[{datetime.now()}] VACUUM {table}")
    cur.execute(f"VACUUM ANALYZE {table}")
    conn.commit()
```

### MySQL/MariaDB OPTIMIZE
```sql
-- Tabele sa fragmentacijom
SELECT TABLE_NAME, 
       ROUND(DATA_LENGTH / 1024 / 1024, 2) AS data_mb,
       ROUND(DATA_FREE / 1024 / 1024, 2) AS free_mb,
       ROUND(DATA_FREE * 100.0 / DATA_LENGTH, 2) AS fragmentation_pct
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'mydb'
  AND DATA_FREE > 10485760  -- 10MB
ORDER BY DATA_FREE DESC;

-- OPTIMIZE TABLE
OPTIMIZE TABLE mojatabela;

-- Batch optimize
SELECT CONCAT('OPTIMIZE TABLE ', TABLE_NAME, ';') 
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'mydb' AND DATA_FREE > 10485760;
```

### MongoDB Compact
```javascript
// Compact collection (offline!)
db.runCommand({ compact: 'logs', force: true })

// Statistika pre compaction
db.logs.stats().storageSize
db.logs.stats().totalIndexSize

// Drop old indexes
db.logs.getIndexes()
db.logs.dropIndex("oldindex")
```

### DynamoDB Cleanup
```python
import boto3
from datetime import datetime, timedelta

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('MyTable')

# Batch delete starih zapisa
cutoff = (datetime.now() - timedelta(days=90)).timestamp()

response = table.scan(
    FilterExpression='#ts < :cutoff',
    ExpressionAttributeNames={'#ts': 'timestamp'},
    ExpressionAttributeValues={':cutoff': int(cutoff)}
)

with table.batch_writer() as batch:
    for item in response['Items']:
        batch.delete_item(Key={'id': item['id']})
```

---

## 3. Docker Cleanup

### Prune sve (OPASNO!)
```bash
# Briše SVE nekorišćeno - containers, images, volumes, networks
docker system prune -a --volumes -f

# Koliko prostora oslobađa?
docker system df
```

### Selektivno brisanje
```bash
# Images stariji od 30 dana
docker images --format "{{.ID}} {{.CreatedAt}}" | \
  awk '$2 " " $3 " " $4 < "'$(date -d '30 days ago' '+%Y-%m-%d')'" {print $1}' | \
  xargs -r docker rmi -f

# Stopped containeri stariji od 7 dana
docker ps -a --filter "status=exited" --format "{{.ID}} {{.CreatedAt}}" | \
  awk '$2 " " $3 " " $4 < "'$(date -d '7 days ago' '+%Y-%m-%d')'" {print $1}' | \
  xargs -r docker rm

# Dangling volumes
docker volume ls -qf dangling=true | xargs -r docker volume rm

# Nekorišćene networks
docker network prune -f
```

### Docker Registry Cleanup
```bash
# AWS ECR - briši stare image-e
aws ecr list-images --repository-name myrepo \
  --filter "tagStatus=UNTAGGED" \
  --query 'imageIds[*]' --output json | \
  jq -r '.[] | .imageDigest' | \
  xargs -I {} aws ecr batch-delete-image \
    --repository-name myrepo \
    --image-ids imageDigest={}

# Azure ACR purge
az acr run --cmd "acr purge \
  --filter 'myrepo:.*' \
  --ago 30d --untagged" \
  --registry myregistry /dev/null
```

---

## 4. Kubernetes Cleanup

### Evicted Pods
```bash
# Briši sve evicted pods
kubectl get pods -A --field-selector=status.phase=Failed -o json | \
  jq -r '.items[] | select(.status.reason == "Evicted") | 
         "\(.metadata.namespace) \(.metadata.name)"' | \
  xargs -n 2 kubectl delete pod -n

# Completed jobs stariji od 7 dana
kubectl get jobs -A -o json | \
  jq -r '.items[] | select(.status.succeeded == 1) | 
         select(.status.completionTime | fromdateiso8601 < (now - 604800)) |
         "\(.metadata.namespace) \(.metadata.name)"' | \
  xargs -n 2 kubectl delete job -n
```

### PVC Cleanup
```bash
# Nekorišćeni PVC-ovi
kubectl get pvc -A -o json | \
  jq -r '.items[] | select(.status.phase == "Bound") | 
         "\(.metadata.namespace) \(.metadata.name)"' | \
  while read ns pvc; do
    POD=$(kubectl get pods -n $ns -o json | \
      jq -r --arg pvc "$pvc" '.items[].spec.volumes[]? | 
             select(.persistentVolumeClaim.claimName == $pvc) | "USED"')
    [ -z "$POD" ] && echo "Nekorišćen: $ns/$pvc"
  done

# Briši nekorišćene (PAZI!)
# kubectl delete pvc -n <namespace> <pvc-name>
```

### Node Log Cleanup (DaemonSet)
```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: log-cleaner
  namespace: kube-system
spec:
  selector:
    matchLabels:
      app: log-cleaner
  template:
    metadata:
      labels:
        app: log-cleaner
    spec:
      hostPID: true
      hostNetwork: true
      containers:
      - name: cleaner
        image: busybox
        command: ["/bin/sh"]
        args:
        - -c
        - |
          while true; do
            find /var/log/pods -name "*.log" -mtime +7 -delete
            find /var/lib/docker/containers -name "*-json.log" -mtime +7 -delete
            sleep 3600
          done
        volumeMounts:
        - name: logs
          mountPath: /var/log/pods
        - name: docker
          mountPath: /var/lib/docker/containers
      volumes:
      - name: logs
        hostPath:
          path: /var/log/pods
      - name: docker
        hostPath:
          path: /var/lib/docker/containers
```

---

## 5. Log Management

### CloudWatch Logs Retention
```bash
# Postavi retention za sve log groups na 7 dana
aws logs describe-log-groups --query 'logGroups[*].logGroupName' --output text | \
  xargs -I {} aws logs put-retention-policy \
    --log-group-name {} \
    --retention-in-days 7

# Nađi log groups bez retention policy
aws logs describe-log-groups \
  --query 'logGroups[?!retentionInDays].logGroupName' \
  --output table
```

### Azure Monitor Logs
```bash
# Workspace retention
az monitor log-analytics workspace update \
  --resource-group myRG \
  --workspace-name myWorkspace \
  --retention-time 30

# Delete old logs (via API)
az rest --method POST \
  --url "https://management.azure.com/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.OperationalInsights/workspaces/{ws}/purge?api-version=2020-08-01" \
  --body '{"table":"Syslog","filters":[{"column":"TimeGenerated","operator":">","value":"2023-01-01"}]}'
```

### GCP Logging
```bash
# Log retention policy
gcloud logging sinks create cleanup-old-logs \
  bigquery.googleapis.com/projects/myproject/datasets/logs \
  --log-filter='timestamp < "2024-01-01"'
```

### Linux journalctl
```bash
# Očisti journald logove starije od 7 dana
journalctl --vacuum-time=7d

# Limiti disk space na 1GB
journalctl --vacuum-size=1G

# journald config (/etc/systemd/journald.conf)
SystemMaxUse=1G
MaxRetentionSec=7day
```

### logrotate
```bash
# /etc/logrotate.d/app
/var/log/app/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 app app
    postrotate
        systemctl reload app > /dev/null 2>&1 || true
    endscript
}

# Force rotation
logrotate -f /etc/logrotate.conf
```

---

## 6. Terraform State Cleanup

### Orphaned Resources
```bash
# List Terraform state resources
terraform state list

# Remove resource iz state-a (ne briše resource!)
terraform state rm aws_instance.old

# Import existing resource
terraform import aws_instance.existing i-1234567890abcdef

# Detect drift
terraform plan -detailed-exitcode
```

### Backend Cleanup (S3)
```bash
# Stare state versions u S3 backend
aws s3api list-object-versions \
  --bucket terraform-state \
  --prefix myapp/ \
  --query 'Versions[?IsLatest==`false`].[Key,VersionId]' \
  --output text | \
  while read key version; do
    aws s3api delete-object --bucket terraform-state \
      --key "$key" --version-id "$version"
  done
```

---

## 7. CI/CD Artifacts Cleanup

### GitHub Actions Artifacts
```bash
# Delete artifacts starijih od 30 dana (GitHub CLI)
gh api repos/{owner}/{repo}/actions/artifacts \
  --jq '.artifacts[] | select(.created_at < "'$(date -u -d '30 days ago' +%Y-%m-%d)'") | .id' | \
  xargs -I {} gh api --method DELETE repos/{owner}/{repo}/actions/artifacts/{}
```

### GitLab CI Cache
```bash
# Clear project cache
curl --request DELETE --header "PRIVATE-TOKEN: $TOKEN" \
  "https://gitlab.com/api/v4/projects/{id}/runners/cache"
```

### Jenkins Builds
```groovy
// Discard old builds (Jenkinsfile)
properties([
    buildDiscarder(logRotator(
        numToKeepStr: '10',
        artifactNumToKeepStr: '5'
    ))
])
```

---

## 8. EBS/Disk Snapshot Cleanup

### AWS EBS Snapshots
```bash
# Orphaned snapshots (bez AMI/Volume)
aws ec2 describe-snapshots --owner-ids self \
  --query 'Snapshots[?Description!="Created by CreateImage"].[SnapshotId,StartTime,VolumeSize]' \
  --output table

# Delete starijih od 30 dana
aws ec2 describe-snapshots --owner-ids self \
  --query "Snapshots[?StartTime<='$(date -u -d '30 days ago' +%Y-%m-%d)'].SnapshotId" \
  --output text | \
  xargs -n 1 aws ec2 delete-snapshot --snapshot-id
```

### Azure Snapshots
```bash
# List unattached snapshots
az snapshot list --query "[?timeCreated<'$(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%S)')'].[name,resourceGroup]" -o table

# Delete
az snapshot delete -g myRG -n mySnapshot
```

---

## 9. Quick Wins - Automated Scripts

### All-in-One Cleanup Script
```bash
#!/bin/bash
# cleanup.sh - Steva's Garbage Collection

set -e

echo "[$(date)] KRŠ I LOM! Počinjem čišćenje..."

# Docker
echo "🐳 Docker cleanup..."
docker system prune -af --volumes || true

# Journald logs
echo "📋 Journald cleanup..."
journalctl --vacuum-time=7d

# Tmp direktorijumi
echo "🗑️  /tmp cleanup..."
find /tmp -type f -atime +7 -delete
find /var/tmp -type f -atime +7 -delete

# Old logs
echo "📜 Application logs cleanup..."
find /var/log -name "*.log" -mtime +30 -exec gzip {} \;
find /var/log -name "*.gz" -mtime +90 -delete

# APT cache (Debian/Ubuntu)
if command -v apt-get &> /dev/null; then
    echo "📦 APT cache cleanup..."
    apt-get clean
    apt-get autoclean
fi

# YUM cache (RHEL/CentOS)
if command -v yum &> /dev/null; then
    echo "📦 YUM cache cleanup..."
    yum clean all
fi

echo "[$(date)] ✅ Gotovo! Smeće obrisano."
df -h
```

---

## 10. Monitoring & Alerting

### Disk Space Alert (CloudWatch)
```bash
# CloudWatch alarm za EBS volumene >80%
aws cloudwatch put-metric-alarm \
  --alarm-name high-disk-usage \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --metric-name DiskSpaceUtilization \
  --namespace CWAgent \
  --period 300 \
  --statistic Average \
  --threshold 80
```

### Prometheus Alert
```yaml
groups:
- name: disk_alerts
  rules:
  - alert: DiskSpaceLow
    expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 20
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Disk space < 20% on {{ $labels.instance }}"
      description: "KRŠ I LOM! Nema mesta!"
```

---

**Steva kaže:** Automatizuj sve ovo i ne čekaj da se disk zapuni. Ako ne čistiš redovno, zakrčiš sistem. **KRŠ I LOM!**
