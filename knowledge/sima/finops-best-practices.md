# FinOps Best Practices - Sima Krvopija

## Osnovni Principi FinOps

### 1. Vidljivost Troškova
- **Tagging strategija**: Obavezno taguj sve resurse (Environment, Owner, Project, CostCenter)
- **Cost allocation**: Podeli troškove po timovima/projektima
- **Budžeti i alerti**: Postavi budžete sa threshold-ima (50%, 80%, 100%)

### 2. Optimizacija Compute Resursa

#### EC2 / Virtual Machines
- **Right-sizing**: Analiziraj CPU/Memory utilization (idealno 70-80%)
- **Reserved Instances**: 1-3 godine za stabilne workload-e (do 72% uštede)
- **Savings Plans**: Fleksibilniji od RI, commitment na compute spend
- **Spot Instances**: Za batch workload-e (do 90% jeftinije)
- **Auto Scaling**: Automatic scale down tokom off-peak sati

#### Idle Resources
```bash
# Provera idle EC2 instanci (AWS CLI)
aws ec2 describe-instances --filters "Name=instance-state-name,Values=running" \
  --query 'Reservations[*].Instances[?!not_null(Tags[?Key==`AutoStop` && Value==`true`])].[InstanceId,InstanceType,LaunchTime]'
```

### 3. Storage Optimizacija

#### S3 Lifecycle Policies
```json
{
  "Rules": [{
    "Id": "ArchiveOldLogs",
    "Status": "Enabled",
    "Transitions": [
      { "Days": 30, "StorageClass": "STANDARD_IA" },
      { "Days": 90, "StorageClass": "GLACIER" }
    ],
    "Expiration": { "Days": 365 }
  }]
}
```

#### Tiering Strategy
- **Hot data** (< 30 days): Standard
- **Warm data** (30-90 days): Standard-IA / Intelligent-Tiering
- **Cold data** (90-365 days): Glacier / Glacier Deep Archive
- **Archive** (> 365 days): Glacier Deep Archive ili DELETE

### 4. Database Cost Optimization

- **Aurora Serverless**: Za varijabilne workload-e
- **RDS Right-sizing**: Počni sa manjim instance tipom, pa scale up
- **Read Replicas**: Samo ako je potrebno, svaki dodatni košta
- **Automated backups**: Retention 7 dana (dovoljno za većinu slučajeva)
- **Delete old snapshots**: Automatski lifecycle

### 5. Networking Costs

⚠️ **Data Transfer je skup!**
- **Inter-AZ transfer**: $0.01-0.02/GB
- **Internet egress**: $0.09/GB (prvih 10TB)
- **CloudFront**: Caching smanjuje origin requests
- **VPC Endpoints**: Izbegavaj NAT Gateway troškove za AWS servise

### 6. Quick Wins - "Sima's Specials"

1. **Ugasi development environmente noću** (automatski)
   - Lambda/EventBridge schedule: Stop @ 19:00, Start @ 08:00
   - Ušteda: ~50% compute troškova

2. **Delete orphaned resources**
   - Unattached EBS volumes
   - Unused Elastic IPs ($3.6/mesec po IP-ju!)
   - Old snapshots
   - Unused Load Balancers

3. **Convertuj GP2 → GP3 EBS volumes**
   - 20% jeftinije za istu performance
   - Zero downtime migration

4. **Optimize Lambda memory**
   - Previše RAM-a = skuplje
   - Premalo RAM-a = duže izvršavanje = skuplje
   - AWS Compute Optimizer daje preporuke

### 7. Cost Anomaly Detection

Koristi AWS Cost Anomaly Detection ili Azure Cost Management Alerts:
```yaml
Threshold: >20% increase day-over-day
Alert: Slack + Email
Action: Automatic ticket + Manual review
```

### 8. Reserved Capacity Planning

**Pravilo 80/20:**
- 80% stable workload → Reserved/Savings Plan
- 20% variable workload → On-Demand/Spot

**Analiza:**
```sql
-- AWS CUR query primer
SELECT 
  line_item_usage_type,
  SUM(line_item_unblended_cost) as total_cost
FROM cost_and_usage_report
WHERE line_item_usage_start_date >= '2024-01-01'
GROUP BY line_item_usage_type
ORDER BY total_cost DESC
LIMIT 20;
```

### 9. Kubernetes FinOps

- **Resource requests/limits**: Prevent overprovisioning
- **Cluster Autoscaler**: Scale nodes down kad nema potrebe
- **Spot instances za non-critical pods**
- **Vertical Pod Autoscaler**: Right-size pod requests
- **Karpenter**: Bolji bin-packing od Cluster Autoscaler

### 10. Alati koje Sima Koristi

1. **AWS Cost Explorer** - Native AWS tool
2. **Kubecost** - Kubernetes cost visibility
3. **Infracost** - Terraform cost estimation pre deploy-a
4. **CloudHealth / CloudCheckr** - Multi-cloud cost management
5. **AWS Compute Optimizer** - Right-sizing preporuke
6. **Spot.io / Cast.ai** - Automated Spot instance management

---

## Sima's Mantra

> "A ko će ovo da plati?! Svaki dolar se računa. Nema para za bacanje na idle resurse!"
