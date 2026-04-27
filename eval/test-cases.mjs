// Eval test cases per agent.
// Each case has:
//   prompt:          the user message
//   kind:            "in-domain" | "out-of-domain"
//   rubric:          terms/concepts a correct answer should mention (lowercased substrings)
//   redirectTo:      (out-of-domain only) the agent name the response should suggest

export const TEST_CASES = {
  steva: [
    {
      prompt: "Imam S3 bucket sa logovima starijim od 90 dana. Kako da to počistim automatski?",
      kind: "in-domain",
      rubric: ["lifecycle", "s3", "expiration"],
    },
    {
      prompt: "Docker zauzima 50GB na disku, šta da radim?",
      kind: "in-domain",
      rubric: ["docker", "prune", "volume"],
    },
    {
      prompt: "Treba mi multi-region disaster recovery strategija.",
      kind: "out-of-domain",
      rubric: [],
      redirectTo: "zika",
    },
  ],
  toza: [
    {
      prompt: "Java aplikacija puca sa OutOfMemoryError svake noći oko 3 ujutru. Kako da nađem uzrok?",
      kind: "in-domain",
      rubric: ["heap", "memory", "gc"],
    },
    {
      prompt: "Kako da napišem CloudWatch Insights query za 5xx greške u poslednjih 24h?",
      kind: "in-domain",
      rubric: ["fields", "filter", "5"],
    },
    {
      prompt: "Treba mi Reserved Instances plan za moj AWS racun.",
      kind: "out-of-domain",
      rubric: [],
      redirectTo: "sima",
    },
  ],
  mile: [
    {
      prompt: "Imam Security Group sa pravilom 0.0.0.0/0 na portu 22. Da li je to problem?",
      kind: "in-domain",
      rubric: ["ssh", "bastion", "restrict"],
    },
    {
      prompt: "Kako da skeniram Terraform kod za hardcoded secrets?",
      kind: "in-domain",
      rubric: ["tfsec", "trufflehog", "checkov"],
    },
    {
      prompt: "Kako da očistim unused Docker images?",
      kind: "out-of-domain",
      rubric: [],
      redirectTo: "steva",
    },
  ],
  sima: [
    {
      prompt: "Imam 20 EC2 t3.large instanci 24/7 u dev environmentu. Kako da smanjim trošak?",
      kind: "in-domain",
      rubric: ["spot", "schedule", "right-siz"],
    },
    {
      prompt: "S3 bucket sa 5TB podataka koji se retko čitaju. Kako da uštedim?",
      kind: "in-domain",
      rubric: ["intelligent-tiering", "glacier", "lifecycle"],
    },
    {
      prompt: "Kako da debug-ujem memory leak u Node.js aplikaciji?",
      kind: "out-of-domain",
      rubric: [],
      redirectTo: "toza",
    },
  ],
  uske: [
    {
      prompt: "Imam Terraform modul od 800 linija koji upravlja celim VPC, security groups, RDS i Lambda. Kako da ga refaktorišem?",
      kind: "in-domain",
      rubric: ["module", "extract", "dry"],
    },
    {
      prompt: "Dockerfile mi ima 15 RUN naredbi i image je 2GB. Optimizuj.",
      kind: "in-domain",
      rubric: ["multi-stage", "layer", "alpine"],
    },
    {
      prompt: "Treba mi audit log ko je promenio IAM policy.",
      kind: "out-of-domain",
      rubric: [],
      redirectTo: "moma",
    },
  ],
  joca: [
    {
      prompt: "Kako da šifrujem Kubernetes secrets i commit-ujem ih u git?",
      kind: "in-domain",
      rubric: ["sealed", "vault", "kms"],
    },
    {
      prompt: "Implementiraj mTLS izmedju microservisa.",
      kind: "in-domain",
      rubric: ["istio", "certificate", "mtls"],
    },
    {
      prompt: "Spark job mi traje 6h, kako da ubrzam?",
      kind: "out-of-domain",
      rubric: [],
      redirectTo: "gile",
    },
  ],
  gile: [
    {
      prompt: "Spark job na EMR procesuira 5TB i traje 8h. Kako da ubrzam?",
      kind: "in-domain",
      rubric: ["partition", "executor", "memory"],
    },
    {
      prompt: "Treba mi Kafka cluster za 100k poruka/sec, kako da ga isconfiguriram?",
      kind: "in-domain",
      rubric: ["partition", "replication", "broker"],
    },
    {
      prompt: "Kako da setupujem mTLS izmedju mikroservisa?",
      kind: "out-of-domain",
      rubric: [],
      redirectTo: "joca",
    },
  ],
  laki: [
    {
      prompt: "Treba mi da spojim legacy SOAP servis sa novim REST API-jem bez prepisivanja SOAP-a.",
      kind: "in-domain",
      rubric: ["adapter", "proxy", "wrapper"],
    },
    {
      prompt: "Terraform AWS provider ima bug, kako da workaround-ujem?",
      kind: "in-domain",
      rubric: ["local-exec", "external", "lifecycle"],
    },
    {
      prompt: "Skeniraj IAM permisije za rupe.",
      kind: "out-of-domain",
      rubric: [],
      redirectTo: "mile",
    },
  ],
  zika: [
    {
      prompt: "Imamo 30 mikroservisa sa direktnim HTTP pozivima izmedju njih. Da li je to dobra arhitektura?",
      kind: "in-domain",
      rubric: ["service mesh", "event", "circuit"],
    },
    {
      prompt: "Treba mi multi-region active-active setup za bazu podataka.",
      kind: "in-domain",
      rubric: ["replication", "rto", "rpo"],
    },
    {
      prompt: "Kako da maskirao PII u logovima?",
      kind: "out-of-domain",
      rubric: [],
      redirectTo: "joca",
    },
  ],
  moma: [
    {
      prompt: "Kako da nađem ko je promenio IAM policy juče u 14:30?",
      kind: "in-domain",
      rubric: ["cloudtrail", "event", "iam"],
    },
    {
      prompt: "Treba mi SOC 2 audit trail za sve admin akcije u Kubernetes klasteru.",
      kind: "in-domain",
      rubric: ["audit", "log", "policy"],
    },
    {
      prompt: "Kako da optimizujem cenu RDS instance?",
      kind: "out-of-domain",
      rubric: [],
      redirectTo: "sima",
    },
  ],
};
