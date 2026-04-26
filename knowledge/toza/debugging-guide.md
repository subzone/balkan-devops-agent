# Debugging Night Shift Guide - Toza Vampir

## Toza's Philosophy

> "Mirno je. Previše mirno."

Greške se dešavaju noću. Kad svi spavaju, sistem pokazuje svoje pravo lice.

---

## Log Analysis Patterns

### 1. Stack Trace Analiza

```python
# Anatomy of a stack trace
Traceback (most recent call last):
  File "app.py", line 247, in process_order
    payment = stripe.charge(amount)  # ← Top of stack (gde se desila greška)
  File "stripe.py", line 89, in charge
    return self.api_call(endpoint, data)
  File "stripe.py", line 34, in api_call
    response = requests.post(url, json=data)
  File "requests/models.py", line 1023, in raise_for_status
    raise HTTPError(http_error_msg, response=self)
requests.exceptions.HTTPError: 402 Payment Required  # ← Root cause
```

**Toza's Steps:**
1. **Bottom to top**: Počni od poslednje linije (root cause)
2. **Find your code**: Ignoriši library frames, nađi SVE linije
3. **Context matters**: Linija 247 u `app.py` - šta je tu?
4. **Time correlation**: Kad se tačno desilo? Da li ima pattern?

### 2. Log Aggregation Query Patterns

```
CloudWatch Insights / Datadog / ELK queries:

# Find all errors in last hour
fields @timestamp, @message
| filter @message like /ERROR|Exception|Failed/
| sort @timestamp desc
| limit 100

# Group errors by type
fields @message
| parse @message "Exception: *" as error_type
| stats count() by error_type
| sort count desc

# Trace single request through multiple services
fields @timestamp, service, request_id, @message
| filter request_id = "abc-123-def"
| sort @timestamp asc

# Find anomalies (unusual error rates)
fields @timestamp
| filter level = "ERROR"
| stats count() as error_count by bin(5min)
| filter error_count > 10  # Threshold
```

### 3. Correlation Analysis

**Šta se desilo PRE greške?**
```bash
# Log timeline reconstruction
grep "request_id=abc123" app.log | sort -k1

2024-04-26 03:17:01 INFO  [request_id=abc123] Request received
2024-04-26 03:17:02 INFO  [request_id=abc123] Database query started
2024-04-26 03:17:45 WARN  [request_id=abc123] Query slow (43s)  # ← Smell!
2024-04-26 03:17:45 ERROR [request_id=abc123] Timeout exception
```

**Pattern Detection:**
- Uvek u 3:17 ujutru? → Scheduled job problem
- Samo vikendom? → Different traffic pattern
- Posle deploya? → Regression introduced
- Tokom high load? → Resource exhaustion

---

## Debugging Toolbox

### 4. Live Debugging (Production)

```bash
# Toza's weapons of choice

# 1. Real-time log tailing
tail -f /var/log/app.log | grep ERROR

# 2. Follow logs za specific service (Docker)
docker logs -f container_name --tail=100

# 3. Kubernetes pod logs
kubectl logs -f pod-name -n namespace --previous  # previous = crashed pod

# 4. AWS CloudWatch live tail (requires AWS CLI v2)
aws logs tail /aws/lambda/my-function --follow --format short

# 5. systemd journal real-time
journalctl -u my-service -f
```

### 5. Post-Mortem Investigation

```bash
# Reconstruct what happened

# 1. Application logs za vremenski period
aws logs filter-log-events \
  --log-group-name /aws/app/production \
  --start-time $(date -d '2024-04-26 03:00' +%s)000 \
  --end-time $(date -d '2024-04-26 04:00' +%s)000 \
  --filter-pattern "ERROR"

# 2. System metrics (CPU, Memory, Disk)
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --dimensions Name=InstanceId,Value=i-1234567890abcdef \
  --start-time 2024-04-26T03:00:00Z \
  --end-time 2024-04-26T04:00:00Z \
  --period 300 \
  --statistics Average,Maximum

# 3. Network activity (VPC Flow Logs)
# Analyze sa Athena ili CloudWatch Insights

# 4. Database slow query log
# MySQL
SELECT * FROM mysql.slow_log WHERE start_time > '2024-04-26 03:00:00';
# PostgreSQL
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 20;
```

### 6. Memory Leak Detection

```python
# Python memory profiling
import tracemalloc
import gc

# Start tracking
tracemalloc.start()

# ... your code runs ...

# Check current memory
current, peak = tracemalloc.get_traced_memory()
print(f"Current: {current / 10**6:.1f}MB, Peak: {peak / 10**6:.1f}MB")

# Top memory consumers
snapshot = tracemalloc.take_snapshot()
top_stats = snapshot.statistics('lineno')
for stat in top_stats[:10]:
    print(stat)

# Garbage collection stats
print(f"Garbage objects: {len(gc.get_objects())}")
```

```bash
# System-level memory debugging

# 1. Check memory usage per process
ps aux --sort=-%mem | head -10

# 2. Memory map za specific process
pmap -x PID

# 3. Heap analysis (requires debugging symbols)
gdb -p PID
(gdb) call malloc_stats()

# 4. Java heap dump
jmap -dump:format=b,file=heapdump.hprof PID
# Analyze sa Eclipse MAT
```

### 7. Network Debugging

```bash
# Toza's network investigation

# 1. DNS resolution issues
dig example.com
nslookup example.com

# 2. Connection testing
telnet hostname 443
nc -zv hostname 443

# 3. SSL/TLS issues
openssl s_client -connect example.com:443 -servername example.com
# Check certificate expiry, cipher suite

# 4. Packet capture (careful in production!)
tcpdump -i eth0 -w capture.pcap host 10.0.1.5 and port 443
# Analyze sa Wireshark

# 5. HTTP request debugging
curl -v https://api.example.com/endpoint
# Shows full request/response headers

# 6. Latency measurement
ping -c 10 hostname
traceroute hostname
mtr hostname  # Combines ping + traceroute
```

---

## Common Night Shift Incidents

### 8. The 3 AM Classics

#### 🌙 Out of Memory (OOM) Killer

```bash
# Symptoms
dmesg | grep -i "out of memory"
# Output: "Out of memory: Kill process 1234 (java) score 823"

# Investigation
1. Check OOM killer log: journalctl -k | grep -i "killed process"
2. Find memory hog: ps aux | sort -k4 -r | head -10
3. Check swap usage: free -h
4. Review application metrics pre-crash

# Prevention
- Set proper memory limits (Docker/K8s)
- Memory leak detection in staging
- Horizontal scaling before vertical scaling
```

#### 🌙 Database Connection Pool Exhausted

```
ERROR: could not obtain connection from pool
connection pool exhausted (max: 100, active: 100, idle: 0)
```

```python
# Investigation
# 1. Check active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

# 2. Find long-running queries
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;

# 3. Kill stuck connections (carefully!)
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE ...;

# Prevention
- Proper connection pooling (PgBouncer, HikariCP)
- Connection timeout settings
- Query timeout enforcement
- Connection leak detection
```

#### 🌙 Disk Space Full

```bash
df: /var/log: No space left on device
```

```bash
# Quick triage
df -h  # Check which filesystem is full
du -sh /* | sort -h | tail -10  # Find big directories
du -sh /var/log/* | sort -h | tail -10  # Drill down

# Emergency cleanup
find /var/log -name "*.log" -mtime +7 -delete  # Delete old logs
journalctl --vacuum-time=3d  # Clean systemd journal
docker system prune -a  # Clean Docker resources

# Find what's writing NOW
lsof | grep deleted  # Find deleted files still open
lsof +L1  # Same, alternative method

# Prevention
- Log rotation (logrotate)
- Monitoring disk usage alerts (> 80% → warning)
- Automated cleanup scripts
```

#### 🌙 Certificate Expiry

```
SSL: CERTIFICATE_VERIFY_FAILED
```

```bash
# Check certificate expiry
echo | openssl s_client -connect example.com:443 2>/dev/null | \
  openssl x509 -noout -dates

# notBefore=Mar 26 00:00:00 2024 GMT
# notAfter=Apr 26 23:59:59 2024 GMT  # ← Expired!

# Quick fix (Let's Encrypt)
certbot renew --force-renewal
systemctl reload nginx

# Prevention
- Automated certificate renewal (certbot cron)
- Monitoring: Alert 30 days before expiry
- Use managed services (AWS Certificate Manager)
```

#### 🌙 Cascading Failures

```
Service A → Service B → Service C
     ↓          ↓          ↓
  Timeout    Retry     Crash
```

**Toza's Cascade Detection:**
1. Check service dependency graph
2. Find initial failure point (usually external dependency)
3. Review retry logic (exponential backoff?)
4. Check circuit breaker status

**Circuit Breaker Pattern:**
```python
from pybreaker import CircuitBreaker

breaker = CircuitBreaker(
    fail_max=5,        # Open after 5 failures
    timeout_duration=60  # Try again after 60s
)

@breaker
def call_external_service():
    return requests.get("https://unreliable-api.com")
```

---

## Toza's Incident Response Checklist

### 9. When Pager Goes Off at 3 AM

**Phase 1: Acknowledge (< 5 min)**
- [ ] Acknowledge alert (stop paging)
- [ ] Check severity (P1 = customer impact)
- [ ] Notify team if needed

**Phase 2: Triage (< 15 min)**
- [ ] Symptoms: Što users see?
- [ ] Scope: Koliko users affected?
- [ ] Timeline: Kad je počelo?
- [ ] Recent changes: Deploys, config changes?

**Phase 3: Mitigate (< 30 min)**
- [ ] Immediate mitigation (rollback, failover, scale up)
- [ ] Verify mitigation worked (check metrics)
- [ ] Update status page

**Phase 4: Root Cause (next day)**
- [ ] Log analysis
- [ ] Timeline reconstruction
- [ ] Post-mortem document
- [ ] Action items (prevent recurrence)

---

## Toza's Debugging Principles

### 1. **Reproduce First**
> "Ako ne možeš da reprodukuješ, ne možeš da fix-uješ. Uvek prvo reproduce."

### 2. **Change One Thing at a Time**
> "Promenio si 5 stvari, nešto se popravilo? E sad ne znaš šta."

### 3. **Logs Don't Lie**
> "Tvoje sećanje laže. Logovi ne lažu. Timestamp je proof."

### 4. **Correlate, Don't Speculate**
> "Misliš da je to? Dokazi. Pokazuje ti stack trace nešto drugo."

### 5. **Document as You Go**
> "U 3 ujutru, zapamtiš samo pola. Piši sve odmah. Incident timeline je zlata vredan."

---

## Tools Toza Lives By

1. **ELK Stack** (Elasticsearch, Logstash, Kibana) - Log aggregation
2. **Datadog / New Relic** - APM & distributed tracing
3. **PagerDuty / Opsgenie** - Incident management
4. **Grafana** - Metrics visualization
5. **Sentry** - Error tracking & alerting
6. **kubectl / docker** - Container debugging
7. **AWS X-Ray / Jaeger** - Distributed tracing
8. **strace / ltrace** - System call tracing (last resort)

---

## Toza's Mantra

> "NullPointerException. Linija 247. Noćas u 3:17. Uvek noćas u 3:17."

**The night is dark and full of errors. But Toza sees all.**
