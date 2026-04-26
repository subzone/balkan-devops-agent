# Encryption & Secrets Management Guide — Joca Mutni

**ŠIFRUJ SVE!** Ko ti je dao dozvolu da čitaš ovo?

---

## 1. Key Management Services (KMS)

### AWS KMS
```bash
# Kreiraj KMS key
aws kms create-key \
  --description "App encryption key" \
  --key-usage ENCRYPT_DECRYPT

# Kreiraj alias
aws kms create-alias \
  --alias-name alias/myapp \
  --target-key-id <key-id>

# Encrypt podatak
echo "secret data" | aws kms encrypt \
  --key-id alias/myapp \
  --plaintext fileb:///dev/stdin \
  --output text --query CiphertextBlob | base64 -d > encrypted.bin

# Decrypt
aws kms decrypt \
  --ciphertext-blob fileb://encrypted.bin \
  --output text --query Plaintext | base64 -d
```

**KMS sa envelope encryption:**
```python
import boto3
import base64
from cryptography.fernet import Fernet

kms = boto3.client('kms')

# Generate data key (envelope encryption)
response = kms.generate_data_key(
    KeyId='alias/myapp',
    KeySpec='AES_256'
)

plaintext_key = response['Plaintext']
encrypted_key = response['CiphertextBlob']

# Encrypt data sa data key
f = Fernet(base64.urlsafe_b64encode(plaintext_key[:32]))
encrypted_data = f.encrypt(b"sensitive data")

# Store encrypted_key + encrypted_data
# Za decrypt: prvo decrypt data key sa KMS, pa decrypt data
```

### Azure Key Vault
```bash
# Kreiraj Key Vault
az keyvault create \
  --name mykeyvault \
  --resource-group myRG \
  --location eastus

# Dodaj secret
az keyvault secret set \
  --vault-name mykeyvault \
  --name db-password \
  --value "SuperSecretPass123!"

# Čitaj secret
az keyvault secret show \
  --vault-name mykeyvault \
  --name db-password \
  --query value -o tsv

# Encrypt/Decrypt sa Key Vault key
az keyvault key encrypt \
  --vault-name mykeyvault \
  --name mykey \
  --algorithm RSA-OAEP \
  --value "plaintext"
```

**Azure Key Vault u aplikaciji:**
```csharp
using Azure.Identity;
using Azure.Security.KeyVault.Secrets;

var client = new SecretClient(
    new Uri("https://mykeyvault.vault.azure.net/"),
    new DefaultAzureCredential()
);

KeyVaultSecret secret = await client.GetSecretAsync("db-password");
string password = secret.Value;  // ŠIFROVANO u tranzitu!
```

### GCP KMS
```bash
# Kreiraj key ring
gcloud kms keyrings create myring \
  --location global

# Kreiraj key
gcloud kms keys create mykey \
  --location global \
  --keyring myring \
  --purpose encryption

# Encrypt fajl
gcloud kms encrypt \
  --key mykey \
  --keyring myring \
  --location global \
  --plaintext-file secret.txt \
  --ciphertext-file secret.enc

# Decrypt
gcloud kms decrypt \
  --key mykey \
  --keyring myring \
  --location global \
  --ciphertext-file secret.enc \
  --plaintext-file decrypted.txt
```

### HashiCorp Vault
```bash
# Start Vault dev server
vault server -dev

# Enable KV v2 secrets engine
vault secrets enable -path=secret kv-v2

# Store secret
vault kv put secret/myapp/db \
  username=admin \
  password="SecretPass123"

# Read secret
vault kv get secret/myapp/db

# Transit encryption engine (encrypt data)
vault secrets enable transit
vault write -f transit/keys/mykey

echo "sensitive data" | base64 | \
  vault write transit/encrypt/mykey plaintext=-

# Output: vault:v1:8SDd3WHDOjf7mq69CyCqYjBXAiQQAVZRkFM96...
```

---

## 2. Secrets Management

### AWS Secrets Manager
```bash
# Store secret
aws secretsmanager create-secret \
  --name myapp/db \
  --secret-string '{"username":"admin","password":"Pass123"}'

# Retrieve secret
aws secretsmanager get-secret-value \
  --secret-id myapp/db \
  --query SecretString --output text

# Rotate secret (Lambda automatski)
aws secretsmanager rotate-secret \
  --secret-id myapp/db \
  --rotation-lambda-arn arn:aws:lambda:...
```

**Lambda rotation function:**
```python
import boto3
import json

def lambda_handler(event, context):
    service_client = boto3.client('secretsmanager')
    arn = event['SecretId']
    token = event['ClientRequestToken']
    step = event['Step']
    
    if step == "createSecret":
        # Generate new password
        new_password = generate_random_password()
        service_client.put_secret_value(
            SecretId=arn,
            ClientRequestToken=token,
            SecretString=json.dumps({"password": new_password}),
            VersionStages=['AWSPENDING']
        )
    
    elif step == "setSecret":
        # Update database password
        update_database_password(new_password)
    
    elif step == "testSecret":
        # Test new password works
        test_connection(new_password)
    
    elif step == "finishSecret":
        # Mark as current
        service_client.update_secret_version_stage(
            SecretId=arn,
            VersionStage='AWSCURRENT',
            MoveToVersionId=token
        )
```

### Kubernetes Sealed Secrets
```bash
# Install controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.18.0/controller.yaml

# Install kubeseal CLI
brew install kubeseal

# Create sealed secret
echo -n "supersecret" | kubectl create secret generic mysecret \
  --dry-run=client \
  --from-file=password=/dev/stdin \
  -o yaml | \
  kubeseal -o yaml > sealed-secret.yaml

# Apply (samo controller može decrypt!)
kubectl apply -f sealed-secret.yaml
```

**sealed-secret.yaml:**
```yaml
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: mysecret
spec:
  encryptedData:
    password: AgBi8+7cQ5JKLwXxT...  # ŠIFROVANO!
```

### External Secrets Operator (ESO)
```yaml
# SecretStore - povezuje sa AWS Secrets Manager
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secretsmanager
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa

---
# ExternalSecret - syncuje secret iz AWS
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: myapp-db-secret
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secretsmanager
    kind: SecretStore
  target:
    name: myapp-db  # K8s secret name
  data:
  - secretKey: password
    remoteRef:
      key: myapp/db
      property: password
```

---

## 3. Encryption at Rest

### AWS EBS Encryption
```bash
# Enable default encryption
aws ec2 enable-ebs-encryption-by-default --region us-east-1

# Launch instance sa encrypted EBS
aws ec2 run-instances \
  --image-id ami-12345 \
  --instance-type t3.micro \
  --block-device-mappings \
    'DeviceName=/dev/xvda,Ebs={VolumeSize=20,Encrypted=true,KmsKeyId=alias/mykey}'
```

### AWS S3 Encryption
```bash
# Default encryption za bucket
aws s3api put-bucket-encryption \
  --bucket mybucket \
  --server-side-encryption-configuration \
    '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"aws:kms","KMSMasterKeyID":"alias/mykey"}}]}'

# Upload sa SSE-KMS
aws s3 cp file.txt s3://mybucket/ \
  --server-side-encryption aws:kms \
  --ssekms-key-id alias/mykey
```

### Azure Storage Service Encryption
```bash
# Storage account sa encryption
az storage account create \
  --name mystorage \
  --resource-group myRG \
  --encryption-services blob file \
  --encryption-key-source Microsoft.Keyvault \
  --encryption-key-vault https://mykeyvault.vault.azure.net/ \
  --encryption-key-name mykey
```

### GCP Default Encryption
```bash
# GCP encryptuje sve default (Google-managed keys)

# Customer-managed encryption keys (CMEK)
gcloud compute disks create mydisk \
  --size 100GB \
  --kms-key projects/myproject/locations/us-east1/keyRings/myring/cryptoKeys/mykey
```

### MongoDB Encryption at Rest
```yaml
# mongod.conf
security:
  enableEncryption: true
  encryptionKeyFile: /path/to/keyfile
```

### PostgreSQL pgcrypto
```sql
-- Enable extension
CREATE EXTENSION pgcrypto;

-- Encrypt data
INSERT INTO users (email, ssn_encrypted)
VALUES ('user@example.com', 
        pgp_sym_encrypt('123-45-6789', 'encryption_key'));

-- Decrypt
SELECT email, pgp_sym_decrypt(ssn_encrypted::bytea, 'encryption_key') AS ssn
FROM users;
```

---

## 4. Encryption in Transit

### TLS/SSL Certificates

**Let's Encrypt (certbot):**
```bash
# Install
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone \
  -d example.com \
  -d www.example.com

# Auto-renewal (cron)
0 0 * * * certbot renew --quiet
```

**cert-manager (Kubernetes):**
```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: myapp-tls
spec:
  secretName: myapp-tls-secret
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - myapp.example.com
```

### mTLS (Mutual TLS)

**Nginx mTLS:**
```nginx
server {
    listen 443 ssl;
    server_name api.example.com;
    
    # Server cert
    ssl_certificate /etc/nginx/certs/server.crt;
    ssl_certificate_key /etc/nginx/certs/server.key;
    
    # Client cert verification (mTLS!)
    ssl_client_certificate /etc/nginx/certs/ca.crt;
    ssl_verify_client on;
    ssl_verify_depth 2;
    
    location / {
        if ($ssl_client_verify != SUCCESS) {
            return 403;  # GREH! Nema client certa!
        }
        proxy_pass http://backend;
    }
}
```

**Kubernetes Istio mTLS:**
```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: myapp
spec:
  mtls:
    mode: STRICT  # Obavezan mTLS!
```

### WireGuard VPN
```bash
# Install
sudo apt-get install wireguard

# Generate keys
wg genkey | tee privatekey | wg pubkey > publickey

# /etc/wireguard/wg0.conf
[Interface]
PrivateKey = <private-key>
Address = 10.0.0.1/24
ListenPort = 51820

[Peer]
PublicKey = <peer-public-key>
AllowedIPs = 10.0.0.2/32

# Start VPN
sudo wg-quick up wg0
```

---

## 5. Data Masking & Tokenization

### PII Detection (AWS Macie)
```bash
# Start discovery job
aws macie2 create-classification-job \
  --job-type ONE_TIME \
  --s3-job-definition '{
    "bucketDefinitions": [{
      "accountId": "123456789",
      "buckets": ["mybucket"]
    }]
  }'

# Results: Pronalazi SSN, credit cards, emails...
```

### PostgreSQL Data Masking
```sql
-- Create masking function
CREATE OR REPLACE FUNCTION mask_email(email TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(email, '^(.{2}).*(@.*)$', '\1***\2');
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT mask_email('john.doe@example.com');
-- Output: jo***@example.com

-- Mask credit cards
CREATE OR REPLACE FUNCTION mask_cc(cc TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(cc, '^\d{12}', '****-****-****-');
END;
$$ LANGUAGE plpgsql;
```

### Tokenization (Vault)
```bash
# Enable transform engine
vault secrets enable transform

# Create transformation
vault write transform/role/payments \
  transformations=creditcard

vault write transform/transformation/creditcard \
  type=fpe \
  template="builtin/creditcardnumber" \
  tweak_source=internal \
  allowed_roles=payments

# Tokenize
vault write transform/encode/payments value="4111-1111-1111-1111"
# Output: 8521-3984-1123-9932 (reverzibilno!)

# Detokenize
vault write transform/decode/payments value="8521-3984-1123-9932"
# Output: 4111-1111-1111-1111
```

---

## 6. Secrets Scanning (Pre-Commit Hooks)

### git-secrets
```bash
# Install
brew install git-secrets  # macOS
# ili
pip install git-secrets

# Setup u repo
cd myrepo
git secrets --install
git secrets --register-aws  # AWS patterns

# Scan
git secrets --scan

# Pre-commit hook (automatski)
# .git/hooks/pre-commit already created
```

### TruffleHog
```bash
pip install trufflehog

# Scan repo history
trufflehog git https://github.com/user/repo

# Output:
# Found: AWS Access Key (Entropy: 4.5)
# File: config.py
# Line: 12
```

### detect-secrets
```bash
pip install detect-secrets

# Baseline scan
detect-secrets scan > .secrets.baseline

# Pre-commit hook (.pre-commit-config.yaml)
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
```

### GitGuardian (CI/CD)
```yaml
# .github/workflows/secrets-scan.yml
name: GitGuardian scan
on: [push, pull_request]
jobs:
  scanning:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - uses: GitGuardian/ggshield-action@v1
        env:
          GITGUARDIAN_API_KEY: ${{ secrets.GITGUARDIAN_API_KEY }}
```

---

## 7. Application-Level Encryption

### AES-256 Encryption (Python)
```python
from cryptography.fernet import Fernet
import base64
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

# Generate key iz passworda
def generate_key(password: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    return base64.urlsafe_b64encode(kdf.derive(password.encode()))

# Encrypt
password = "supersecret"
salt = b'fixed_salt_16byt'  # U produkciji: random!
key = generate_key(password, salt)
f = Fernet(key)

encrypted = f.encrypt(b"sensitive data")
print(encrypted)

# Decrypt
decrypted = f.decrypt(encrypted)
print(decrypted)  # b'sensitive data'
```

### Node.js crypto
```javascript
const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

// Encrypt
function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Decrypt
function decrypt(encrypted) {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const encrypted = encrypt('sensitive data');
const decrypted = decrypt(encrypted);
```

---

## 8. Compliance & Best Practices

### GDPR Encryption Requirements
- ✅ Personal data **MORA** biti encrypted at rest
- ✅ Transmission **MORA** biti TLS 1.2+
- ✅ Encryption keys **NE SMU** biti hardcoded
- ✅ Key rotation **MORA** biti automatska
- ✅ Access logs **MORAJU** postojati

### PCI-DSS (Payment Card Data)
- ✅ TLS 1.2+ za card data u tranzitu
- ✅ AES-256 ili RSA-2048 za storage
- ✅ Key management dokumentovan
- ✅ Quarterly key rotation
- ✅ Separate key custodians

### HIPAA (Healthcare)
- ✅ Encryption at rest (AES-256)
- ✅ Secure key storage (HSM ili KMS)
- ✅ Audit logs za sve key access
- ✅ Business Associate Agreements
- ✅ Breach notification plan

---

## 9. Joca's Paranoia Checklist

### ✅ OBAVEZNO:
- [ ] **Plain text ZABRANJEN** - passwords, API keys, tokens NIKAD u plain text
- [ ] **Environment variables** - secrets iz env vars, NE iz koda
- [ ] **Secrets manager** - AWS Secrets Manager / Azure Key Vault / HashiCorp Vault
- [ ] **TLS 1.2+** - HTTP **ZABRANJEN** (samo HTTPS)
- [ ] **Certificate validation** - verify SSL certs (no `verify=False`!)
- [ ] **Encryption at rest** - database, S3, EBS, disk encryption
- [ ] **Key rotation** - automatski rotate keys (30-90 dana)
- [ ] **Access logs** - audit trail za svaki secrets access
- [ ] **Least privilege** - IAM policies minimalni permissions
- [ ] **Secrets scanning** - pre-commit hooks, CI/CD scanning

### 🚫 GREH! (Nikad ne raditi)
- ❌ Hardcoded passwords u kodu
- ❌ API keys u Git history
- ❌ Plain text u logovima (mask secrets!)
- ❌ Self-signed certs u produkciji
- ❌ `chmod 777` na key fajlovima
- ❌ Deljenje production secrets preko Slack/email
- ❌ `.env` fajl u Git repo
- ❌ `kubectl get secret -o yaml` bez filtriranja
- ❌ Root certifikati u application kodu

---

## 10. Emergency Response - Leaked Secret

### Incident Response Plan:
1. **ODMAH ROTIRAJ** leaked secret
2. **REVOKE** compromised credentials
3. **AUDIT** ko je koristio leaked secret
4. **NOTIFY** security team/management
5. **POST-MORTEM** kako se desilo, kako sprečiti

**GitHub leaked secret:**
```bash
# 1. Rotate secret u AWS/Azure/GCP
aws iam delete-access-key --access-key-id AKIAIOSFODNN7EXAMPLE

# 2. BFG iz Git history
bfg --replace-text passwords.txt repo.git

# 3. Force push
git push --force

# 4. Notify GitHub security
# GitHub će automatski disabled leaked GitHub tokens
```

---

**Joca kaže:** Ako nisi paranoičan, nisi dovoljno siguran. **ŠIFRUJ SVE!** Nikome ne veruj. Proveravaj UVEK. Plain text je **GREH!**
