# Code Refactoring & Deletion Guide — Uške Satara

**Ovo ide NA PANJ!** Seći bez milosti.

---

## 1. Dead Code Detection

### Python - vulture
```bash
# Install
pip install vulture

# Scan projekat
vulture myproject/

# Output:
# myproject/utils.py:45: unused function 'old_helper' (60% confidence)
# myproject/models.py:120: unused variable 'temp' (80% confidence)

# Whitelist false positives
vulture myproject/ --make-whitelist > whitelist.py
vulture myproject/ whitelist.py
```

### JavaScript/TypeScript - knip
```bash
# Install
npm install -g knip

# Scan
knip

# Output example:
# Unused files (5)
# src/old-api.ts
# src/deprecated.js

# Unused dependencies (3)
# lodash
# moment

# Unused exports (12)
# src/utils.ts: oldFunction, deprecatedHelper
```

### JavaScript - depcheck
```bash
npm install -g depcheck

# Check unused dependencies
depcheck

# Output:
# Unused dependencies
# * lodash
# * axios
# 
# Missing dependencies
# * express
```

### Go - deadcode
```bash
go install golang.org/x/tools/cmd/deadcode@latest

# Find dead code
deadcode ./...

# Output:
# github.com/myorg/myapp/utils.go:45:6: func oldHelper is unused
```

### Java - UCDetector (Eclipse plugin)
```bash
# Maven plugin
mvn com.github.ucdetector:ucdetector-maven-plugin:detect

# Generiše izveštaj sa unused:
# - classes
# - methods  
# - fields
# - constants
```

---

## 2. Code Complexity Analysis

### Cyclomatic Complexity

**Python - radon**
```bash
pip install radon

# Complexity report
radon cc myproject/ -a -s

# Output:
# myproject/views.py
#   F 45:0 process_order - C (12)  # Previše kompleksno!
#   M 67:4 validate_data - A (2)   # OK

# Maintainability Index
radon mi myproject/ -s

# Thresholds:
# A: 20+ (odlično)
# B: 10-19 (OK)
# C: 0-9 (NA PANJ!)
```

**JavaScript - complexity-report**
```bash
npm install -g complexity-report

# Analyze
cr --format json src/**/*.js > complexity.json

# CLI output
cr src/app.js

# Cyclomatic: 25  # NA PANJ! Maksimum 10
# Halstead difficulty: 45
```

**Go - gocyclo**
```bash
go install github.com/fzipp/gocyclo/cmd/gocyclo@latest

# Find complex functions (>10)
gocyclo -over 10 .

# Output:
# 25 main ProcessOrder cmd/api/handlers.go:120:1
# 18 utils ValidateInput pkg/utils/validator.go:45:1
```

### Cognitive Complexity (SonarQube)
```yaml
# sonar-project.properties
sonar.projectKey=myproject
sonar.sources=src
sonar.exclusions=**/test/**

# Cognitive Complexity > 15 = NA PANJ!
```

---

## 3. Refactoring Patterns

### Extract Method
**Bilo (NA PANJ!):**
```python
def process_order(order):
    # 100 linija koda...
    if order.status == 'pending':
        # validacija - 20 linija
        if not order.items:
            raise ValueError("No items")
        for item in order.items:
            if item.quantity <= 0:
                raise ValueError("Invalid quantity")
            # još 15 linija...
        
        # payment processing - 30 linija
        if order.payment_method == 'card':
            # card logic...
            pass
        elif order.payment_method == 'paypal':
            # paypal logic...
            pass
        
        # shipping - 25 linija
        # ...
```

**Postalo (DOBRO!):**
```python
def process_order(order):
    validate_order(order)
    process_payment(order)
    arrange_shipping(order)
    send_confirmation(order)

def validate_order(order):
    if not order.items:
        raise ValueError("No items")
    for item in order.items:
        validate_item(item)

def validate_item(item):
    if item.quantity <= 0:
        raise ValueError(f"Invalid quantity for {item.name}")
    if item.price < 0:
        raise ValueError(f"Invalid price for {item.name}")
```

### Replace Conditional with Polymorphism
**Bilo:**
```javascript
function calculatePrice(customer) {
  if (customer.type === 'regular') {
    return customer.order.total * 1.0;
  } else if (customer.type === 'premium') {
    return customer.order.total * 0.9;
  } else if (customer.type === 'vip') {
    return customer.order.total * 0.8;
  }
}
```

**Postalo:**
```javascript
class Customer {
  calculatePrice() {
    return this.order.total * this.getDiscount();
  }
}

class RegularCustomer extends Customer {
  getDiscount() { return 1.0; }
}

class PremiumCustomer extends Customer {
  getDiscount() { return 0.9; }
}

class VIPCustomer extends Customer {
  getDiscount() { return 0.8; }
}
```

### Strangler Fig Pattern (Legacy Rewrite)
```
┌─────────────────┐
│   Legacy App    │  ← Stari sistem (NA PANJ!)
└────────┬────────┘
         │
    ┌────▼─────┐
    │  Proxy   │  ← Ruter koji šalje na stari/novi
    └────┬─────┘
         │
    ┌────▼──────┐
    │  New App  │  ← Novi sistem (DOBRO!)
    └───────────┘
```

**Nginx proxy za strangler:**
```nginx
server {
    listen 80;
    
    # Novi endpointi
    location /api/v2/ {
        proxy_pass http://new-app:8080;
    }
    
    # Legacy fallback
    location / {
        proxy_pass http://legacy-app:8000;
    }
}
```

---

## 4. Terraform Module Refactoring

### Extract Repeated Code into Module
**Bilo (NA PANJ!):**
```hcl
# vpc.tf
resource "aws_vpc" "dev" {
  cidr_block = "10.0.0.0/16"
  tags = { Name = "dev-vpc" }
}

resource "aws_subnet" "dev_public_1" {
  vpc_id     = aws_vpc.dev.id
  cidr_block = "10.0.1.0/24"
  availability_zone = "us-east-1a"
}

resource "aws_subnet" "dev_public_2" {
  vpc_id     = aws_vpc.dev.id
  cidr_block = "10.0.2.0/24"
  availability_zone = "us-east-1b"
}

# ... još 50 linija za staging
# ... još 50 linija za production
```

**Postalo (DOBRO!):**
```hcl
# modules/vpc/main.tf
resource "aws_vpc" "this" {
  cidr_block = var.cidr_block
  tags       = var.tags
}

resource "aws_subnet" "public" {
  count             = length(var.public_subnets)
  vpc_id            = aws_vpc.this.id
  cidr_block        = var.public_subnets[count.index]
  availability_zone = var.azs[count.index]
}

# Korišćenje:
module "vpc_dev" {
  source = "./modules/vpc"
  cidr_block = "10.0.0.0/16"
  public_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  azs = ["us-east-1a", "us-east-1b"]
}
```

### DRY with locals
```hcl
locals {
  common_tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
    Project     = "MyApp"
  }
  
  name_prefix = "${var.project}-${var.environment}"
}

resource "aws_instance" "web" {
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-web"
  })
}
```

---

## 5. Dockerfile Optimization

### Multi-Stage Build
**Bilo (NA PANJ! - 1.2GB):**
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install  # Dev dependencies!
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

**Postalo (DOBRO! - 150MB):**
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
USER node
CMD ["node", "dist/index.js"]
```

### Layer Optimization
```dockerfile
# LOŠE - svaka COPY kreira layer
COPY file1.txt /app/
COPY file2.txt /app/
COPY file3.txt /app/

# DOBRO - jedan layer
COPY file1.txt file2.txt file3.txt /app/

# ODLIČNO - samo potrebno
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/  # Samo build output
```

---

## 6. Kubernetes Resource Optimization

### Remove Duplicate YAML with Helm
**Bilo (NA PANJ!):**
```yaml
# deployment-dev.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-dev
spec:
  replicas: 2
  # ... 50 linija

# deployment-staging.yaml  
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-staging
spec:
  replicas: 3
  # ... 50 linija (99% isto!)

# deployment-prod.yaml
# ...
```

**Postalo (DOBRO! - Helm Chart):**
```yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "myapp.fullname" . }}
spec:
  replicas: {{ .Values.replicaCount }}
  template:
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        resources:
{{ toYaml .Values.resources | indent 12 }}

# values-dev.yaml
replicaCount: 2
resources:
  limits:
    cpu: 200m
    memory: 256Mi

# values-prod.yaml
replicaCount: 5
resources:
  limits:
    cpu: 1000m
    memory: 2Gi
```

### Kustomize Overlays
```
base/
├── deployment.yaml
├── service.yaml
└── kustomization.yaml

overlays/
├── dev/
│   ├── kustomization.yaml
│   └── replica-patch.yaml
└── prod/
    ├── kustomization.yaml
    └── replica-patch.yaml
```

---

## 7. SQL Query Optimization (Seče sporost)

### Index Missing Detection
```sql
-- PostgreSQL - slow queries bez indexa
SELECT schemaname, tablename, 
       seq_scan, seq_tup_read, 
       idx_scan, idx_tup_fetch
FROM pg_stat_user_tables
WHERE seq_scan > 1000 
  AND idx_scan < seq_scan
ORDER BY seq_scan DESC;

-- Dodaj index NA PANJ!
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_created ON orders(created_at);
```

### N+1 Query Problem
**Bilo (NA PANJ! - 101 queries):**
```python
# Django ORM
orders = Order.objects.all()  # 1 query
for order in orders:
    print(order.customer.name)  # N queries!
```

**Postalo (DOBRO! - 1 query):**
```python
orders = Order.objects.select_related('customer').all()
for order in orders:
    print(order.customer.name)  # Već učitano!
```

---

## 8. Dependency Cleanup

### npm/yarn unused packages
```bash
# depcheck
npm install -g depcheck
depcheck

# Remove unused
npm uninstall lodash moment

# Check bundle size impact
npm install -g webpack-bundle-analyzer
webpack-bundle-analyzer dist/stats.json
```

### Python unused packages
```bash
pip install pip-autoremove

# Remove package + dependencies
pip-autoremove pandas -y
```

### Go mod tidy
```bash
# Cleanup go.mod
go mod tidy

# Verify
go mod verify
```

---

## 9. Git History Cleanup

### Remove Large Files from History (BFG)
```bash
# Install BFG
brew install bfg  # macOS

# Briši fajlove > 10MB iz istorije
bfg --strip-blobs-bigger-than 10M repo.git

# Cleanup
cd repo.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (OPASNO!)
git push --force
```

### Remove Sensitive Data
```bash
# git-filter-repo (bolje od BFG)
pip install git-filter-repo

# Ukloni credentials.txt iz cele istorije
git filter-repo --path credentials.txt --invert-paths

# Ukloni sve *.pem fajlove
git filter-repo --path-glob '*.pem' --invert-paths
```

---

## 10. Code Review Checklist - Uške's Cut List

### ✂️ Seći odmah:
- [ ] Funkcije > 50 linija → **Extract Method**
- [ ] Cyclomatic complexity > 10 → **Refaktoriši**
- [ ] Copy-paste kod → **Extract Module/Class**
- [ ] Dead code (unused functions) → **BRIŠI**
- [ ] Commented-out code → **BRIŠI** (git pamti)
- [ ] TODO stariji od 6 meseci → **REŠI ili BRIŠI**
- [ ] Duplicate logic → **DRY principle**
- [ ] God class (> 500 linija) → **Split**
- [ ] Magic numbers → **Const/Config**
- [ ] Deep nesting (> 4 nivoa) → **Early return**

### 🔍 Proveri:
- [ ] Ima li testova? (Coverage > 70%)
- [ ] Postoji li dokumentacija?
- [ ] Da li je optimizovano?
- [ ] Da li sledi coding standards?

---

## 11. Automated Refactoring Tools

### SonarQube
```bash
# Docker run
docker run -d --name sonarqube -p 9000:9000 sonarqube:latest

# Scan projekat
sonar-scanner \
  -Dsonar.projectKey=myproject \
  -Dsonar.sources=src \
  -Dsonar.host.url=http://localhost:9000

# Prati: Code Smells, Bugs, Vulnerabilities, Technical Debt
```

### Prettier (Auto-format)
```bash
npm install --save-dev prettier

# Format sve
npx prettier --write "src/**/*.{js,ts,jsx,tsx}"

# .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2
}
```

### ESLint --fix
```bash
npm install --save-dev eslint

# Auto-fix što može
npx eslint --fix src/

# eslint.config.js
module.exports = {
  rules: {
    "no-unused-vars": "error",
    "no-console": "warn",
    "complexity": ["error", 10]
  }
};
```

---

**Uške kaže:** Ako kod ne služi svrsi - **IDE NA PANJ!** Bez sentimentalnosti. Legacy kod je teret, ne nasleđe. SEČE SE!
