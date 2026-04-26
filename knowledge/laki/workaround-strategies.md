# Workarounds & Legacy Bridges Guide — Laki Zmija

**Imam ja jednu prečicu...** Ne pitaj kako, ALI RADI! 🐍

---

## 1. Legacy System Integration

### SOAP to REST Adapter (Mainframe Bridge)
```python
from flask import Flask, request, jsonify
from zeep import Client

app = Flask(__name__)

# SOAP client (stari mainframe)
soap_client = Client('http://legacy-mainframe:8080/services/CustomerService?wsdl')

@app.route('/api/customers/<customer_id>', methods=['GET'])
def get_customer(customer_id):
    # Zovi SOAP sa modernog REST API-ja (PREČICA!)
    response = soap_client.service.GetCustomer(CustomerID=customer_id)
    
    # Transform SOAP XML u JSON
    return jsonify({
        'id': response.CustomerID,
        'name': response.CustomerName,
        'email': response.Email
    })

if __name__ == '__main__':
    app.run(port=5000)
```

### FTP to S3 Sync (Legacy Upload Bridge)
```bash
#!/bin/bash
# Legacy sistem uploaduje na FTP, mi syncujemo u S3

FTP_HOST="legacy.ftp.server"
FTP_USER="olduser"
FTP_PASS="oldpass"
S3_BUCKET="s3://modern-bucket/legacy-data/"

# Mount FTP sa curlftpfs
mkdir -p /mnt/legacy-ftp
curlftpfs -o user=${FTP_USER}:${FTP_PASS} ${FTP_HOST} /mnt/legacy-ftp

# Sync u S3 (PREČICA!)
aws s3 sync /mnt/legacy-ftp/ ${S3_BUCKET} \
  --exclude "*.tmp" \
  --delete

# Unmount
fusermount -u /mnt/legacy-ftp
```

### COBOL Integration (IBM zOS Bridge)
```python
# z/OS Connect API bridge
import requests
import base64

def call_cobol_program(program_name, input_data):
    """
    Poziva COBOL program kroz z/OS Connect
    """
    url = f"https://zos-connect.legacy.com/api/v1/{program_name}"
    
    # EBCDIC encoding za COBOL (stari encoding!)
    payload = {
        "input": base64.b64encode(input_data.encode('cp037')).decode()
    }
    
    response = requests.post(url, json=payload, 
                            auth=('zosuser', 'zospass'))
    
    # Decode EBCDIC output
    output = base64.b64decode(response.json()['output']).decode('cp037')
    return output

# Usage
result = call_cobol_program("CUSTINQ", "12345")
print(result)
```

---

## 2. API Workarounds & Hacks

### Rate Limiting Bypass (Exponential Backoff)
```python
import time
import requests
from functools import wraps

def retry_with_backoff(max_retries=5, base_delay=1):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except requests.exceptions.HTTPError as e:
                    if e.response.status_code == 429:  # Rate limited
                        if attempt == max_retries - 1:
                            raise
                        
                        # Exponential backoff (PREČICA!)
                        delay = base_delay * (2 ** attempt)
                        print(f"Rate limited. Čekam {delay}s...")
                        time.sleep(delay)
                    else:
                        raise
        return wrapper
    return decorator

@retry_with_backoff(max_retries=5)
def call_api(url):
    response = requests.get(url)
    response.raise_for_status()
    return response.json()
```

### Pagination Workaround (Auto-fetch All Pages)
```python
def fetch_all_pages(base_url, params={}):
    """
    Auto-paginate kroz sve strane (API pagination hack)
    """
    all_results = []
    page = 1
    
    while True:
        params['page'] = page
        params['per_page'] = 100  # MAX per page!
        
        response = requests.get(base_url, params=params)
        data = response.json()
        
        if not data or len(data) == 0:
            break  # Nema više
        
        all_results.extend(data)
        page += 1
        
        # Respect rate limits (PAMETNO!)
        time.sleep(0.1)
    
    return all_results

# Usage
all_users = fetch_all_pages('https://api.example.com/users')
```

### GraphQL Batching (Multiple Queries in One)
```python
import requests

def graphql_batch_query(queries):
    """
    Batch multiple GraphQL queries u jedan request (PREČICA!)
    """
    batch_query = "query {\n"
    
    for i, query in enumerate(queries):
        alias = f"query{i}"
        batch_query += f"  {alias}: {query}\n"
    
    batch_query += "}"
    
    response = requests.post('https://api.example.com/graphql', 
                            json={'query': batch_query})
    return response.json()

# Usage (1 request umesto 3!)
results = graphql_batch_query([
    "user(id: 1) { name email }",
    "user(id: 2) { name email }",
    "user(id: 3) { name email }"
])
```

---

## 3. Migration Strategies (Strangler Fig Pattern)

### Nginx Routing (Gradual Migration)
```nginx
# Stari sistem na legacy.internal:8080
# Novi sistem na modern.internal:3000

upstream legacy_backend {
    server legacy.internal:8080;
}

upstream modern_backend {
    server modern.internal:3000;
}

server {
    listen 80;
    server_name api.example.com;
    
    # Novi endpoints idu na moderan API
    location /api/v2/ {
        proxy_pass http://modern_backend;
    }
    
    # Stari endpoints (postepeno migriramo)
    location /api/v1/users {
        proxy_pass http://modern_backend;  # MIGRIRANO!
    }
    
    location /api/v1/orders {
        proxy_pass http://modern_backend;  # MIGRIRANO!
    }
    
    # Sve ostalo ide na legacy (za sad)
    location / {
        proxy_pass http://legacy_backend;
    }
}
```

### Dual Writes (Write to Both Systems)
```python
class DualWriteRepository:
    """
    Piše u stari I novi sistem tokom migracije
    """
    def __init__(self, legacy_db, modern_db):
        self.legacy = legacy_db
        self.modern = modern_db
    
    def save_user(self, user_data):
        # Write to legacy (mora raditi!)
        try:
            self.legacy.insert_user(user_data)
        except Exception as e:
            print(f"Legacy write failed: {e}")
            raise  # KRITIČNO ako legacy fail-uje
        
        # Write to modern (best effort)
        try:
            self.modern.insert_user(user_data)
        except Exception as e:
            print(f"Modern write failed: {e}")
            # NE bacaj error - modern još nije kritičan
    
    def get_user(self, user_id):
        # Read from modern (ako ima)
        try:
            user = self.modern.get_user(user_id)
            if user:
                return user
        except Exception:
            pass
        
        # Fallback na legacy
        return self.legacy.get_user(user_id)
```

### Feature Flags (Toggle Migration)
```python
from flagsmith import Flagsmith

flagsmith = Flagsmith(environment_key="ser.xxx")

def get_customer(customer_id):
    # Feature flag za migration
    flags = flagsmith.get_identity_flags(customer_id)
    
    if flags.is_feature_enabled("use_modern_api"):
        # Novi sistem (PREČICA!)
        return modern_api.get_customer(customer_id)
    else:
        # Stari sistem (fallback)
        return legacy_api.get_customer(customer_id)
```

---

## 4. Cross-Cloud Data Transfer

### AWS to Azure Transfer (az copy)
```bash
#!/bin/bash
# S3 → Azure Blob prečica

S3_BUCKET="s3://mybucket/data/"
AZURE_CONTAINER="https://mystorageaccount.blob.core.windows.net/data"
AZURE_SAS_TOKEN="?sv=2021-08-06&ss=bfqt&srt=sco&sp=rwdlacupitfx&se=..."

# Download iz S3
aws s3 sync ${S3_BUCKET} /tmp/s3-data/

# Upload u Azure
azcopy copy "/tmp/s3-data/*" \
  "${AZURE_CONTAINER}${AZURE_SAS_TOKEN}" \
  --recursive

# Cleanup
rm -rf /tmp/s3-data/
```

### GCP to AWS via rsync (VM Bridge)
```bash
#!/bin/bash
# GCS → S3 over rsync (PREČICA kroz VM!)

# Mount GCS bucket (gcsfuse)
gcsfuse gcp-bucket /mnt/gcs

# Sync u S3
aws s3 sync /mnt/gcs/ s3://aws-bucket/ \
  --storage-class INTELLIGENT_TIERING

# Unmount
fusermount -u /mnt/gcs
```

### Rclone (Universal Cloud Sync)
```bash
# Configure AWS S3
rclone config create aws s3 \
  provider AWS \
  access_key_id xxx \
  secret_access_key yyy \
  region us-east-1

# Configure Azure Blob
rclone config create azure azureblob \
  account mystorageaccount \
  key zzz

# Sync (PREČICA za sve cloud!)
rclone sync aws:mybucket azure:mycontainer \
  --progress \
  --transfers 32 \
  --checkers 16
```

---

## 5. Bash Wizardry (jq, awk, sed, xargs)

### jq JSON Parsing Hacks
```bash
# Extract nested values
curl https://api.example.com/users | \
  jq '.data[] | select(.status=="active") | .email'

# Transform JSON structure
jq '.users | map({id: .userId, name: .fullName})' input.json

# Flatten nested arrays
jq '[.items[] | .tags[]] | unique' input.json

# Update JSON in-place
jq '.settings.enabled = true' config.json > tmp.json && mv tmp.json config.json

# Multi-file merge
jq -s '.[0] * .[1]' file1.json file2.json
```

### awk Power Moves
```bash
# Sum column
awk '{sum += $3} END {print sum}' data.txt

# Filter rows
awk '$4 > 100 {print $1, $2}' data.txt

# CSV to JSON (PREČICA!)
awk -F',' 'NR>1 {printf "{\"name\":\"%s\",\"age\":%s}\n", $1, $2}' data.csv

# Calculate average
awk '{sum+=$1; count++} END {print sum/count}' numbers.txt
```

### sed Stream Editing
```bash
# Replace in-place
sed -i 's/old/new/g' file.txt

# Delete lines matching pattern
sed '/ERROR/d' logfile.txt

# Extract range of lines
sed -n '100,200p' large-file.txt

# Multi-line replacement
sed -e :a -e 'N;s/\n/ /;ta' file.txt  # Join lines
```

### xargs Parallel Processing
```bash
# Parallel downloads (BRZO!)
cat urls.txt | xargs -P 10 -I {} curl -O {}

# Parallel file processing
find . -name "*.log" | xargs -P 4 gzip

# Batch operations
echo "file1 file2 file3" | xargs -n 1 aws s3 cp --recursive

# Conditional execution
find . -type f -name "*.tmp" | xargs -I {} sh -c 'test -f {} && rm {}'
```

---

## 6. Docker Workarounds

### Multi-Arch Builds (AMD64 + ARM64)
```dockerfile
# Dockerfile
FROM --platform=$BUILDPLATFORM golang:1.20 AS builder

ARG TARGETPLATFORM
ARG BUILDPLATFORM

WORKDIR /app
COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=$(echo $TARGETPLATFORM | cut -d'/' -f2) \
    go build -o myapp .

FROM alpine:latest
COPY --from=builder /app/myapp /myapp
CMD ["/myapp"]
```

```bash
# Build za obe platforme (PREČICA!)
docker buildx build --platform linux/amd64,linux/arm64 \
  -t myimage:latest \
  --push .
```

### Bind Mount Workaround (Local Dev)
```yaml
# docker-compose.yml
services:
  app:
    image: myapp
    volumes:
      # Delegated mode (brže na macOS!)
      - ./src:/app/src:delegated
      - ./node_modules:/app/node_modules:ro  # Read-only
      
      # Named volume za cache (PREČICA!)
      - node_cache:/root/.npm
    environment:
      - NODE_ENV=development

volumes:
  node_cache:
```

### Docker BuildKit Cache (Brži Build)
```dockerfile
# syntax=docker/dockerfile:1.4

FROM node:18

# Cache mount (PREČICA - npm install cache!)
RUN --mount=type=cache,target=/root/.npm \
    npm install

COPY . .
RUN npm run build
```

```bash
# Build sa cache
DOCKER_BUILDKIT=1 docker build -t myapp .
```

---

## 7. Kubernetes Workarounds

### Init Container (DB Migration)
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  initContainers:
  - name: db-migration
    image: myapp:latest
    command: ['sh', '-c', 'npm run migrate']
    env:
    - name: DATABASE_URL
      valueFrom:
        secretKeyRef:
          name: db-secret
          key: url
  containers:
  - name: app
    image: myapp:latest
    # Startuje TEK kad init container završi (PREČICA!)
```

### Sidecar Proxy (Legacy Service Mesh)
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers:
  - name: app
    image: myapp:latest
    env:
    - name: DATABASE_HOST
      value: localhost  # Proxy preko sidecar-a!
    
  - name: cloudsql-proxy
    image: gcr.io/cloudsql-docker/gce-proxy:latest
    command:
      - "/cloud_sql_proxy"
      - "-instances=myproject:us-central1:mydb=tcp:5432"
    # App vidi DB kao localhost:5432 (PREČICA!)
```

### Admission Webhook (Auto-inject Secrets)
```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: MutatingWebhookConfiguration
metadata:
  name: secret-injector
webhooks:
- name: inject.secrets.example.com
  clientConfig:
    service:
      name: secret-injector
      namespace: default
      path: "/inject"
  rules:
  - operations: ["CREATE"]
    apiGroups: [""]
    apiVersions: ["v1"]
    resources: ["pods"]
  # Automatski dodaje secrets u pod-ove (PREČICA!)
```

---

## 8. Terraform Workarounds

### local-exec Provisioner (Post-deploy Scripts)
```hcl
resource "aws_instance" "web" {
  ami           = "ami-12345"
  instance_type = "t3.micro"
  
  # Run script POSLE kreiranja (PREČICA!)
  provisioner "local-exec" {
    command = <<EOF
      sleep 30  # Čekaj boot
      ansible-playbook -i '${self.public_ip},' setup.yml
    EOF
  }
}
```

### External Data Source (Dynamic Config)
```hcl
data "external" "latest_ami" {
  program = ["bash", "${path.module}/get_latest_ami.sh"]
}

resource "aws_instance" "web" {
  ami = data.external.latest_ami.result.ami_id
}
```

**get_latest_ami.sh:**
```bash
#!/bin/bash
# Vrati JSON sa latest AMI ID (PREČICA!)

AMI_ID=$(aws ec2 describe-images \
  --owners amazon \
  --filters "Name=name,Values=amzn2-ami-hvm-*" \
  --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
  --output text)

echo "{\"ami_id\": \"${AMI_ID}\"}"
```

### Terraform Workspaces (Multi-Environment)
```bash
# Dev environment
terraform workspace new dev
terraform apply -var-file=dev.tfvars

# Prod environment
terraform workspace new prod
terraform apply -var-file=prod.tfvars

# Conditional resources (PREČICA!)
resource "aws_instance" "web" {
  count = terraform.workspace == "prod" ? 3 : 1  # 3 u prod, 1 u dev
}
```

---

## 9. SSH Tunneling (Access Internal Services)

### SSH Port Forward (Bastionhost)
```bash
# Forward remote port na local
ssh -L 8080:internal-service:80 user@bastion.example.com

# Sada možeš pristupiti:
curl http://localhost:8080  # → internal-service:80 (PREČICA!)

# Reverse tunnel (expose local na remote)
ssh -R 8080:localhost:3000 user@remote-server.com
```

### Dynamic Port Forward (SOCKS Proxy)
```bash
# Start SOCKS proxy
ssh -D 9090 user@bastion.example.com

# Configure browser ili curl
curl --socks5 localhost:9090 http://internal-service/
```

### SSH Config Shortcut
```bash
# ~/.ssh/config
Host bastion
  HostName bastion.example.com
  User admin
  IdentityFile ~/.ssh/bastion.pem
  LocalForward 5432 rds.internal:5432
  LocalForward 6379 redis.internal:6379

# Usage (PREČICA!)
ssh bastion
# Localhost:5432 → RDS
# Localhost:6379 → Redis
```

---

## 10. Zero-Downtime Deployment Hacks

### Blue-Green Deployment (AWS ALB)
```bash
# Trenutno: blue environment (target group 1)
# Deploy green environment (target group 2)

# Kreiraj novi target group
aws elbv2 create-target-group \
  --name myapp-green \
  --protocol HTTP \
  --port 80 \
  --vpc-id vpc-xxx

# Deploy novi instances u green
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name myapp-green \
  --launch-template LaunchTemplateName=myapp-v2 \
  --target-group-arns arn:aws:elasticloadbalancing:...:targetgroup/myapp-green/...

# Test green environment
curl http://green-alb.example.com

# Switch traffic (PREČICA - atomic!)
aws elbv2 modify-listener \
  --listener-arn arn:aws:elasticloadbalancing:...:listener/... \
  --default-actions Type=forward,TargetGroupArn=arn:.../myapp-green/...

# Ako nešto pukne - rollback za 5 sekundi!
```

### Canary Deployment (Nginx Weighted)
```nginx
upstream backend {
    # 90% na stari
    server old-backend:8080 weight=9;
    
    # 10% na novi (canary!)
    server new-backend:8080 weight=1;
}

server {
    location / {
        proxy_pass http://backend;
    }
}
```

---

**Laki kaže:** Najbolje rešenje je ono koje RADI. Ne pitaj kako, ALI RADI! Svaka prečica je dobrodošla. 🐍
