# Big Data & Heavy Processing Guide — Gile Zver

**DAJ MI JOŠ SNAGE!** RAM, GPU, CORES - SVE!

---

## 1. Apache Spark Optimization

### Executor Configuration
```bash
# LOŠE (default) - premalo snage!
spark-submit myapp.py

# DOBRO! - DAJ MI SVE!
spark-submit \
  --master yarn \
  --deploy-mode cluster \
  --driver-memory 8g \
  --driver-cores 4 \
  --executor-memory 16g \
  --executor-cores 5 \
  --num-executors 20 \
  --conf spark.executor.memoryOverhead=2g \
  --conf spark.memory.fraction=0.8 \
  --conf spark.memory.storageFraction=0.3 \
  --conf spark.sql.shuffle.partitions=400 \
  --conf spark.default.parallelism=400 \
  myapp.py
```

**Pravilo (Gile's formula):**
```
Executor memory = (Node RAM / num_executors) - 1GB overhead
Executor cores = 4-5 (najbolje za I/O)
Num executors = (Total cores / executor_cores) - 1 (za YARN AM)

# Za 10 nodes × 64GB RAM × 16 cores:
Executors: 31 (10*16/5 - 1)
Executor memory: 19GB ((64/2) - 1 - overhead)
Executor cores: 5
```

### Partitioning Strategy
```python
from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("GileApp").getOrCreate()

# LOŠE - default partitions (200)
df = spark.read.parquet("s3://mybucket/data/")
df.count()  # Sporo!

# DOBRO! - repartition za optimal parallelism
df_optimized = df.repartition(400)  # 2x num_cores

# ILI partition po columni
df_partitioned = df.repartition(400, "date")

# Coalesce za smanjenje (posle filtera)
df_filtered = df.filter(df.amount > 1000)
df_coalesced = df_filtered.coalesce(100)  # Manje partitiona = brže!
```

### Broadcast Join (Manje table)
```python
from pyspark.sql.functions import broadcast

# LOŠE - shuffle join (SPORO!)
result = large_df.join(small_df, "id")

# DOBRO! - broadcast small table (BEZ shuffle)
result = large_df.join(broadcast(small_df), "id")

# Broadcast threshold config
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", 100 * 1024 * 1024)  # 100MB
```

### Caching Strategy
```python
# Cache intermediary results
df_filtered = df.filter(df.status == "active")
df_filtered.cache()  # Čuva u RAM!

df_filtered.count()  # Prvi run - popunjava cache
df_filtered.count()  # Drugi run - iz cache-a! BRZO!

# Persist sa storage level
from pyspark import StorageLevel

df_large.persist(StorageLevel.MEMORY_AND_DISK)  # Spilluje na disk ako nema RAM
df_large.count()

# Unpersist kad završiš
df_large.unpersist()
```

### Avoid UDFs (User Defined Functions)
```python
# LOŠE - Python UDF (SERIALIZATION overhead!)
from pyspark.sql.functions import udf
from pyspark.sql.types import IntegerType

def my_func(x):
    return x * 2

my_udf = udf(my_func, IntegerType())
df.withColumn("doubled", my_udf(df.value))

# DOBRO! - Built-in functions (kompajlirano!)
from pyspark.sql.functions import col

df.withColumn("doubled", col("value") * 2)

# Pandas UDF za batch operacije (brže od row UDF)
from pyspark.sql.functions import pandas_udf
import pandas as pd

@pandas_udf(IntegerType())
def pandas_func(s: pd.Series) -> pd.Series:
    return s * 2

df.withColumn("doubled", pandas_func(df.value))
```

---

## 2. Spark on Cloud (EMR/Dataproc/Databricks)

### AWS EMR Optimization
```bash
# Launch cluster sa instance fleet (Spot + On-Demand)
aws emr create-cluster \
  --name "Gile-Cluster" \
  --release-label emr-6.10.0 \
  --applications Name=Spark Name=Hadoop \
  --instance-fleets \
    InstanceFleetType=MASTER,TargetOnDemandCapacity=1,InstanceTypeConfigs=['{InstanceType=m5.2xlarge}'] \
    InstanceFleetType=CORE,TargetSpotCapacity=4,InstanceTypeConfigs=['{InstanceType=r5.4xlarge,BidPrice=0.50}'] \
    InstanceFleetType=TASK,TargetSpotCapacity=10,InstanceTypeConfigs=['{InstanceType=c5.4xlarge,BidPrice=0.30}'] \
  --configurations file://spark-config.json

# spark-config.json
[
  {
    "Classification": "spark-defaults",
    "Properties": {
      "spark.executor.memory": "24g",
      "spark.executor.cores": "5",
      "spark.dynamicAllocation.enabled": "true",
      "spark.shuffle.service.enabled": "true"
    }
  }
]
```

### GCP Dataproc with Preemptible VMs
```bash
gcloud dataproc clusters create gile-cluster \
  --region us-central1 \
  --master-machine-type n1-highmem-8 \
  --num-workers 5 \
  --worker-machine-type n1-highmem-16 \
  --num-preemptible-workers 20 \
  --preemptible-worker-boot-disk-size 100 \
  --properties spark:spark.executor.memory=24g,spark:spark.executor.cores=5
```

### Azure HDInsight
```bash
az hdinsight create \
  --name gile-cluster \
  --resource-group myRG \
  --type spark \
  --component-version Spark=3.1 \
  --head-node-size Standard_D13_V2 \
  --worker-node-size Standard_D14_V2 \
  --worker-node-count 10 \
  --ssh-user admin
```

---

## 3. Kafka High-Throughput Configuration

### Producer Optimization
```java
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("acks", "1");  // Leader ack (brže od "all")
props.put("compression.type", "lz4");  // KOMPRESIJA!
props.put("batch.size", 32768);  // 32KB batch
props.put("linger.ms", 10);  // Čeka 10ms za batch
props.put("buffer.memory", 67108864);  // 64MB buffer
props.put("max.in.flight.requests.per.connection", 5);

KafkaProducer<String, String> producer = new KafkaProducer<>(props);
```

**Python (kafka-python):**
```python
from kafka import KafkaProducer

producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    compression_type='lz4',
    batch_size=32768,
    linger_ms=10,
    buffer_memory=67108864,
    acks=1
)

for i in range(1000000):
    producer.send('mytopic', value=b'message')

producer.flush()
```

### Consumer Optimization
```java
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("group.id", "gile-consumer-group");
props.put("fetch.min.bytes", 1048576);  // 1MB minimum fetch
props.put("fetch.max.wait.ms", 500);  // Čeka max 500ms
props.put("max.partition.fetch.bytes", 10485760);  // 10MB po partitioni
props.put("max.poll.records", 1000);  // 1000 records po poll-u

KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);
consumer.subscribe(Arrays.asList("mytopic"));

while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
    // Process batch
}
```

### Kafka Broker Tuning
```properties
# server.properties

# Više partitiona = više parallelism!
num.partitions=32

# Replication factor
default.replication.factor=3

# Network threads (1 po 3GB throughput)
num.network.threads=8

# I/O threads (2x broj diskova)
num.io.threads=16

# Socket buffer (DAJ MI VIŠE!)
socket.send.buffer.bytes=1048576
socket.receive.buffer.bytes=1048576

# Log segment size
log.segment.bytes=1073741824  # 1GB

# Compression
compression.type=lz4
```

---

## 4. GPU Workloads (CUDA, TensorFlow, PyTorch)

### Kubernetes GPU Node Pool
```yaml
# AWS EKS nodegroup sa GPU
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: gile-cluster
  region: us-east-1

nodeGroups:
  - name: gpu-nodes
    instanceType: p3.8xlarge  # 4x NVIDIA V100
    desiredCapacity: 3
    minSize: 1
    maxSize: 10
    volumeSize: 100
    labels:
      workload: gpu
    taints:
      - key: nvidia.com/gpu
        value: "true"
        effect: NoSchedule
```

**GPU Pod:**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-job
spec:
  containers:
  - name: pytorch
    image: pytorch/pytorch:latest
    resources:
      limits:
        nvidia.com/gpu: 2  # 2 GPUs!
    command: ["python", "train.py"]
  nodeSelector:
    workload: gpu
  tolerations:
  - key: nvidia.com/gpu
    operator: Exists
```

### CUDA C++ Example
```cuda
// vector_add.cu
__global__ void vectorAdd(float *a, float *b, float *c, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) {
        c[i] = a[i] + b[i];
    }
}

int main() {
    int n = 1000000;
    float *d_a, *d_b, *d_c;
    
    // Allocate GPU memory
    cudaMalloc(&d_a, n * sizeof(float));
    cudaMalloc(&d_b, n * sizeof(float));
    cudaMalloc(&d_c, n * sizeof(float));
    
    // Launch kernel (MELJEEEE!)
    int threadsPerBlock = 256;
    int blocksPerGrid = (n + threadsPerBlock - 1) / threadsPerBlock;
    vectorAdd<<<blocksPerGrid, threadsPerBlock>>>(d_a, d_b, d_c, n);
    
    cudaDeviceSynchronize();
    return 0;
}
```

### TensorFlow GPU
```python
import tensorflow as tf

# List GPUs
print("GPUs:", tf.config.list_physical_devices('GPU'))

# Force GPU placement
with tf.device('/GPU:0'):
    a = tf.constant([[1.0, 2.0], [3.0, 4.0]])
    b = tf.constant([[1.0, 1.0], [0.0, 1.0]])
    c = tf.matmul(a, b)
    print(c)

# Multi-GPU strategy
strategy = tf.distribute.MirroredStrategy()

with strategy.scope():
    model = tf.keras.models.Sequential([
        tf.keras.layers.Dense(512, activation='relu'),
        tf.keras.layers.Dense(10, activation='softmax')
    ])
    model.compile(optimizer='adam', loss='sparse_categorical_crossentropy')
```

---

## 5. ETL Pipeline Optimization (Airflow/dbt)

### Airflow DAG Parallelism
```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime

default_args = {
    'owner': 'gile',
    'retries': 3,
}

with DAG(
    'heavy_etl',
    default_args=default_args,
    schedule_interval='@hourly',
    max_active_runs=5,  # Parallel DAG runs
    concurrency=32,  # Max parallel tasks
    catchup=False,
) as dag:
    
    tasks = []
    for i in range(20):
        task = PythonOperator(
            task_id=f'process_partition_{i}',
            python_callable=process_data,
            op_kwargs={'partition': i},
            pool='heavy_pool',  # Resource pool
        )
        tasks.append(task)
    
    # Parallel processing!
    tasks  # All run simultaneously
```

**Airflow config (airflow.cfg):**
```ini
[core]
parallelism = 64  # Max parallel tasks globally
dag_concurrency = 32  # Per DAG
max_active_runs_per_dag = 5

[celery]
worker_concurrency = 16  # Per worker
```

### dbt Parallelization
```yaml
# dbt_project.yml
models:
  my_project:
    +materialized: table
    staging:
      +materialized: view
    marts:
      +materialized: table

# Run sa više threads
dbt run --threads 16  # MELJE 16 models parallel!

# Full refresh parallel
dbt run --full-refresh --threads 32
```

---

## 6. Database Performance Tuning

### PostgreSQL for Analytics
```sql
-- Parallel query execution (SNAGA!)
SET max_parallel_workers_per_gather = 4;
SET max_parallel_workers = 16;

-- Increase work memory za sorting/joins
SET work_mem = '256MB';
SET maintenance_work_mem = '2GB';

-- Effective cache size
SET effective_cache_size = '32GB';

-- Analyze tables
ANALYZE orders;

-- EXPLAIN ANALYZE za performance debug
EXPLAIN (ANALYZE, BUFFERS) 
SELECT customer_id, SUM(amount) 
FROM orders 
WHERE created_at > '2024-01-01'
GROUP BY customer_id;
```

### Redshift Optimization
```sql
-- Distribution key (za JOINs)
CREATE TABLE orders (
    order_id INT,
    customer_id INT,
    amount DECIMAL
)
DISTKEY(customer_id)  # Co-locate sa customers table
SORTKEY(created_at);

-- Vacuum (defragment)
VACUUM orders;

-- Analyze statistics
ANALYZE orders;

-- Column encoding
ANALYZE COMPRESSION orders;
ALTER TABLE orders ALTER COLUMN status ENCODE lzo;
```

### BigQuery Optimization
```sql
-- Partition table (OBAVEZNO za velike tabele!)
CREATE TABLE myproject.mydataset.orders
PARTITION BY DATE(created_at)
CLUSTER BY customer_id, status
AS SELECT * FROM old_table;

-- Query sa partition filter (JEFTINO!)
SELECT *
FROM orders
WHERE DATE(created_at) = '2024-01-01';

-- BI Engine reservation (in-memory!)
bq mk --reservation \
  --project=myproject \
  --location=US \
  --bi_reservation \
  --size=100GB
```

---

## 7. Distributed Computing (Ray, Dask)

### Ray (Python Parallel Computing)
```python
import ray

ray.init()

@ray.remote
def heavy_computation(x):
    # Simulate heavy work
    import time
    time.sleep(1)
    return x ** 2

# Sequential (SPORO!)
results = [heavy_computation(i) for i in range(100)]

# Parallel sa Ray (BRZO!)
futures = [heavy_computation.remote(i) for i in range(100)]
results = ray.get(futures)  # DAJ MI SVE odjednom!

# Ray cluster sa GPU
@ray.remote(num_gpus=1)
def gpu_task(data):
    import tensorflow as tf
    # GPU processing
    return result
```

### Dask (Pandas na steroidima)
```python
import dask.dataframe as dd

# LOŠE - Pandas in-memory (OOM!)
import pandas as pd
df = pd.read_csv('huge_file.csv')  # OutOfMemoryError!

# DOBRO! - Dask parallel + out-of-core
ddf = dd.read_csv('huge_file_*.csv')  # Lazy loading!
result = ddf.groupby('customer_id').amount.sum().compute()  # DAJ MI REZULTAT!

# Dask cluster
from dask.distributed import Client

client = Client(n_workers=20, threads_per_worker=4, memory_limit='16GB')
result = ddf.compute()
```

---

## 8. Memory Management & JVM Tuning

### Spark Driver/Executor JVM
```bash
spark-submit \
  --conf spark.driver.extraJavaOptions="-XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:InitiatingHeapOccupancyPercent=35" \
  --conf spark.executor.extraJavaOptions="-XX:+UseG1GC -XX:MaxGCPauseMillis=200" \
  myapp.jar
```

### Java Heap Size Monitoring
```java
Runtime runtime = Runtime.getRuntime();

long maxMemory = runtime.maxMemory();
long allocatedMemory = runtime.totalMemory();
long freeMemory = runtime.freeMemory();

System.out.println("Max: " + (maxMemory / 1024 / 1024) + " MB");
System.out.println("Allocated: " + (allocatedMemory / 1024 / 1024) + " MB");
System.out.println("Free: " + (freeMemory / 1024 / 1024) + " MB");
```

---

## 9. Data Formats (Parquet > CSV)

### Parquet Advantages
```python
# CSV (LOŠE - 10GB, spora deserializacija)
df.write.csv("s3://bucket/data.csv")

# Parquet (DOBRO! - 2GB compressed, columnar, brzo čitanje)
df.write.parquet("s3://bucket/data.parquet", 
                 compression='snappy',
                 mode='overwrite')

# ORC (alternative)
df.write.orc("s3://bucket/data.orc", 
             compression='zlib')

# Avro (za streaming)
df.write.format("avro").save("s3://bucket/data.avro")
```

**Performance comparison:**
```
Format    | Size  | Write Time | Read Time
----------|-------|------------|----------
CSV       | 10GB  | 120s       | 180s
JSON      | 12GB  | 150s       | 200s
Parquet   | 2GB   | 60s        | 30s  ← DAJ MI OVO!
ORC       | 1.8GB | 55s        | 28s
```

---

## 10. Kubernetes HPA/VPA for Heavy Workloads

### Horizontal Pod Autoscaler (Scale OUT!)
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: spark-executor-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: spark-executors
  minReplicas: 5
  maxReplicas: 50  # DAJ MI 50 EXECUTORS!
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Vertical Pod Autoscaler (Scale UP!)
```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: spark-driver-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: spark-driver
  updatePolicy:
    updateMode: "Auto"  # Automatski povećava resources!
  resourcePolicy:
    containerPolicies:
    - containerName: driver
      minAllowed:
        cpu: 1
        memory: 2Gi
      maxAllowed:
        cpu: 16  # MAX 16 CORES!
        memory: 64Gi  # MAX 64GB RAM!
```

### KEDA (Event-driven autoscaling)
```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: kafka-consumer-scaler
spec:
  scaleTargetRef:
    name: kafka-consumer
  minReplicaCount: 1
  maxReplicaCount: 100  # 100 CONSUMERS!
  triggers:
  - type: kafka
    metadata:
      bootstrapServers: kafka:9092
      consumerGroup: my-group
      topic: heavy-topic
      lagThreshold: "1000"  # Scale kad je lag > 1000
```

---

**Gile kaže:** Uvek traži VIŠE - više RAM-a, više cores, više GPU-a. Default konfiguracija je za slabićе. **MELJEEEEEEEE!**
