import type { ChecklistCategory } from "../types/checklist";

export const cloudCategories: ChecklistCategory[] = [
  {
    id: "cloud-metadata",
    name: "Cloud Metadata & SSRF Exploits",
    emoji: "🛰️",
    description: "Validate authorized metadata reachability; prefer non-secret canaries and bound impact to the actual identity permissions.",
    reference: "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instancedata-data-retrieval.html",
    items: [
      {
        id: "cloud-meta-aws-1",
        text: "AWS IMDSv1 Credential Theft via SSRF",
        how: "With cloud-owner authorization, test the SSRF fetcher against non-secret instance metadata first. The role-list path below returns role names, not credentials; do not append a role or use credentials without explicit permission. Direct curl on your machine does not exercise the application's SSRF path. Alternate address parsing is client-dependent.",
        payloads: [
          "http://169.254.169.254/latest/meta-data/iam/security-credentials/",
          "http://[::ffff:169.254.169.254]/latest/meta-data/iam/security-credentials/",
          "http://2852039166/latest/meta-data/iam/security-credentials/"
        ],
        payloadNotes: [
          "Standard AWS IMDSv1 query: fetches list of attached IAM roles; append the role name to get AccessKeyId, SecretAccessKey, and Token.",
          "IPv6 mapped IPv4 address: evades simple regex filters checking for string '169.254.169.254'.",
          "Dword (decimal) IP representation: 2852039166 translates directly to 169.254.169.254, bypassing basic URL string matching."
        ],
        expectedResponse: {
          vulnerable: "The caller reads metadata forbidden by application policy. A role-list response exposes names, not credentials; credential impact requires separately authorized proof and actual IAM scope assessment.",
          safe: "The tested fetch is explicitly blocked while an owned permitted control succeeds. A tokenless IMDS 401 is consistent with required IMDSv2; hop limit is a separate setting. Timeout alone is inconclusive."
        },
        severity: "critical",
        tags: { tech: ["aws"] }
      },
      {
        id: "cloud-meta-aws-2",
        text: "AWS IMDSv2 Token Fetch & Header Injection",
        how: "On an authorized EC2 lab, test whether the application fetcher can send PUT plus the TTL header, return the opaque token, then send a separate token-bearing GET. Header injection alone does not change GET to PUT. HttpTokens=required, token-response hop limit and allowed request methods are separate controls; hop limit 1 is not a universal SSRF defense.",
        payloads: [
          "TOKEN=$(curl --fail --max-time 3 -sS -X PUT 'http://169.254.169.254/latest/api/token' -H 'X-aws-ec2-metadata-token-ttl-seconds: 60')",
          "curl --fail --max-time 3 -sS -H \"X-aws-ec2-metadata-token: $TOKEN\" 'http://169.254.169.254/latest/meta-data/instance-id'"
        ],
        payloadNotes: [
          "IMDSv2 token creation: requires HTTP PUT and specific TTL header; the returned token is subsequently passed in X-aws-ec2-metadata-token.",
          "Separate non-secret GET using the token; these local lab commands illustrate the two requests that must actually be reproducible through the SSRF fetcher."
        ],
        expectedResponse: {
          vulnerable: "The unauthorized application caller can obtain an opaque IMDS token and use it through the same fetcher to read forbidden metadata. Token format is unspecified; severity depends on exposed data and role permissions.",
          safe: "The application rejects the required PUT/header/token-bearing GET path while the permitted control succeeds. A failed probe does not identify hop-limit configuration without instance/network evidence."
        },
        severity: "critical",
        tags: { tech: ["aws"] }
      },
      {
        id: "cloud-meta-gcp-1",
        text: "Google Cloud (GCP) Metadata & Service Account Token",
        how: "Only on an authorized GCP fixture, confirm Metadata-Flavor header control through the actual fetcher. Prefer a non-secret instance ID first; token retrieval and use require separate owner permission. Effective access depends on the service account IAM permissions and applicable OAuth scopes.",
        payloads: [
          "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
          "http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token",
          "curl -H \"Metadata-Flavor: Google\" http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token"
        ],
        payloadNotes: [
          "Standard GCP service account endpoint: returns an OAuth 2.0 access token with instance scopes.",
          "Numeric IP alias: alternative hostname that points to the local hypervisor metadata server in GCP environments.",
          "Required header: GCP requires 'Metadata-Flavor: Google'; test if proxy/SSRF allows injecting or forwarding this header."
        ],
        expectedResponse: {
          vulnerable: "The unauthorized fetcher discloses a genuine service-account token; its effective access is bounded by IAM, scopes and resource policy, not automatic project compromise.",
          safe: "The actual fetch path explicitly rejects metadata while an owned permitted control succeeds. A missing-header error or timeout does not rule out header-capable SSRF."
        },
        severity: "critical",
        tags: { tech: ["gcp"] }
      },
      {
        id: "cloud-meta-azure-1",
        text: "Azure Instance Metadata Service (IMDS) Managed Identity Token",
        how: "Use an authorized Azure VM fixture and verify that the fetcher can supply Metadata: true. Start with non-secret instance metadata; acquiring or using managed-identity tokens needs explicit permission. Validate audience and role assignments separately.",
        payloads: [
          "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/",
          "http://169.254.169.254/metadata/instance?api-version=2021-02-01"
        ],
        payloadNotes: [
          "Azure Managed Identity token endpoint: requires header 'Metadata: true' and api-version; returns JWT bearer token for Azure Management API.",
          "Instance metadata endpoint: returns VM details, subscription ID, resource group name, and network configuration."
        ],
        expectedResponse: {
          vulnerable: "The unauthorized caller receives a real managed-identity token; access is limited to its requested audience and the identity's granted roles, not the whole subscription.",
          safe: "The actual fetch path rejects the metadata request with the required header while the permitted control works; a missing-header error or timeout alone is inconclusive."
        },
        severity: "critical",
        tags: { tech: ["azure"] }
      }
    ]
  },
  {
    id: "cloud-storage",
    name: "Cloud Storage Misconfigurations & Dangling Buckets",
    emoji: "🪣",
    description: "Identify publicly writable, readable, or claimable object storage buckets across cloud providers.",
    reference: "https://cloud.hacktricks.xyz/pentesting-cloud/aws-security/aws-privilege-escalation/aws-s3-privilege-escalation",
    items: [
      {
        id: "cloud-s3-1",
        text: "S3 Bucket Public Listing & Arbitrary Upload",
        how: "Confirm the bucket is in scope and determine its intended sharing policy. Listing, reading known objects and writing are distinct permissions. For write testing use an owned test bucket, a unique non-executable marker key and If-None-Match: * to avoid overwrites; verify it then clean up only that marker with owner credentials.",
        payloads: [
          "aws s3 ls s3://target-bucket-name --no-sign-request",
          "curl -s https://target-bucket-name.s3.amazonaws.com/",
          "aws s3api put-object --bucket owned-test-bucket --key assessment/unique-marker-42.txt --body marker.txt --if-none-match '*' --no-sign-request"
        ],
        payloadNotes: [
          "Anonymous listing tests s3:ListBucket. AuthenticatedUsers is not the same as anonymous AllUsers; listing does not imply object read or write access.",
          "Direct HTTP listing: checks if the S3 XML response lists contents or says AccessDenied.",
          "Owned-bucket-only conditional marker write; verify installed AWS CLI supports --if-none-match. Never upload executable content or overwrite an existing object."
        ],
        expectedResponse: {
          vulnerable: "Anonymous access exposes a known private canary or permits a marker write contrary to the owner's policy. Intentionally public assets/listings are not automatically a bug.",
          safe: "The tested operation respects the intended sharing policy. AccessDenied for listing says nothing about direct object reads or writes."
        },
        severity: "high",
        tags: { tech: ["aws"] }
      },
      {
        id: "cloud-s3-2",
        text: "Dangling S3 Bucket Takeover (NoSuchBucket)",
        how: "Inspect an in-scope DNS CNAME and its provider response. NoSuchBucket is only a candidate: establish exact name/region, provider ownership checks and continued domain linkage. Reproduce claimability with an owned disposable domain/bucket; claiming a target name requires explicit owner permission.",
        payloads: [
          "curl -i https://assets.target.com",
          "# Owned lab only: aws s3 mb s3://YOUR-OWN-UNIQUE-LAB-BUCKET --region us-east-1"
        ],
        payloadNotes: [
          "Inspect HTTP response: look for HTTP 404 with '<Code>NoSuchBucket</Code>' in the response body.",
          "Owned lab reproduction only; a target bucket creation or domain claim is not a default test. Use a harmless marker and coordinate cleanup of lab DNS before deleting the bucket."
        ],
        expectedResponse: {
          vulnerable: "With explicit authorization, provider claimability and harmless content serving through the dangling domain are demonstrated. NoSuchBucket alone is not confirmed takeover.",
          safe: "Provider ownership evidence establishes the expected owner controls the exact linked resource, or the dangling DNS/link is removed. Valid content alone does not identify its owner."
        },
        severity: "high"
      },
      {
        id: "cloud-blob-1",
        text: "Azure Blob Storage & SAS Token Leakage",
        how: "Search client-side JavaScript, GitHub repos, and API responses for Azure Storage accounts with public container access or unexpired SAS tokens.",
        payloads: [
          "curl 'https://ACCOUNT.blob.core.windows.net/CONTAINER?restype=container&comp=list&maxresults=1'",
          "https://<account_name>.blob.core.windows.net/<container>/secret.pdf?<sas_token>"
        ],
        payloadNotes: [
          "Container listing: tests if the container public access level is set to 'Container (anonymous read access for containers and blobs)'.",
          "SAS token inspection: parse the query string for 'se' (expiry time) and 'sp' (permissions like r, w, d, l) to determine scope."
        ],
        expectedResponse: {
          vulnerable: "A private canary is exposed or a leaked SAS grants unauthorized operations within its signed account/service/resource scope; public containers may be intentional.",
          safe: "The tested operation matches the sharing policy and SAS constraints. An error for one container or operation does not rule out access via a valid SAS or direct blob URL."
        },
        severity: "high",
        tags: { tech: ["azure"] }
      }
    ]
  },
  {
    id: "cloud-cicd",
    name: "CI/CD Pipeline & Supply Chain Security",
    emoji: "⚙️",
    description: "Exploit automation workflows, GitHub Actions, GitLab CI, and build runners to access production secrets.",
    reference: "https://securitylab.github.com/research/github-actions-preventing-pwn-requests/",
    items: [
      {
        id: "cloud-cicd-1",
        text: "GitHub Actions pull_request_target 'Pwn-Request' exploit",
        how: "Trace pull_request_target from attacker-triggerable events through PR-head checkout to actual execution (install hooks, tests, local actions or build scripts). Inspect effective workflow/job token permissions, explicitly referenced secrets, environments and persisted checkout credentials. Prove with a harmless marker in an owned repo; a checkout alone is not code execution and secrets are not automatically all environment variables.",
        payloads: [
          "- uses: actions/checkout@v4\n  with:\n    ref: ${{ github.event.pull_request.head.sha }}",
          "npm test # owned lab package.json pretest: node -e \"console.log('UNTRUSTED_CODE_MARKER')\""
        ],
        payloadNotes: [
          "Untrusted checkout candidate; follow it to executable code and actual granted token/secret exposure.",
          "Harmless execution marker in an owned fixture. Record which granted credentials the executing step can actually access, without printing or exfiltrating them."
        ],
        expectedResponse: {
          vulnerable: "An untrusted contributor can trigger code execution in a privileged job with demonstrated access to granted token permissions, explicitly supplied secrets or trusted deployment state.",
          safe: "Untrusted code is isolated from privileged jobs/credentials and approvals bind the reviewed immutable commit; trigger name alone does not prove safety."
        },
        severity: "critical",
        tags: { tech: ["github-actions"] }
      },
      {
        id: "cloud-cicd-2",
        text: "Expression injection in GitHub Actions workflows",
        how: "Look for workflows interpolating untrusted variables directly into inline `run:` bash steps instead of environment variables.",
        payloads: [
          "Issue Title (owned lab): \"; printf 'INJECTION_MARKER\\n'; #",
          "run: echo \"Processing issue title: ${{ github.event.issue.title }}\""
        ],
        payloadNotes: [
          "Attacker-controlled issue title: injects quotes and semicolon into the bash command before it is sent to the runner shell.",
          "Vulnerable script line: direct ${{ ... }} interpolation in `run:` allows full command injection on the runner VM."
        ],
        expectedResponse: {
          vulnerable: "The owned workflow executes the injected marker command; impact is assessed from the job's actual permissions and reachable resources without secret dumping.",
          safe: "Untrusted values pass via env and are quoted as data, e.g. printf '%s\\n' \"$TITLE\", never eval'ed or interpolated into generated shell code. Validate option arguments and multiline GITHUB_ENV/OUTPUT delimiters separately."
        },
        severity: "high",
        tags: { tech: ["github-actions"] }
      },
      {
        id: "cloud-cicd-3",
        text: "Build logs credential exposure & artifact leaks",
        how: "Review only authorized repositories and bounded logs/artifacts for synthetic canaries or candidate credentials. Redact evidence; confirm intended audience and owner-approved validity without exercising unrelated services. Masked logs alone do not establish artifact safety.",
        payloads: [
          "Search keywords in logs: 'ghp_', 'AWS_SECRET', 'BEGIN PRIVATE KEY', 'Bearer', 'password', 'npm_token'",
          "curl -s https://api.github.com/repos/:owner/:repo/actions/artifacts"
        ],
        payloadNotes: [
          "Log scraping: search failed build logs, debugging verbose output, and npm/docker build logs for unmasked tokens.",
          "Artifact analysis: download compiled zip files or test reports to look for embedded `.env` files or staging credentials."
        ],
        expectedResponse: {
          vulnerable: "Build logs or artifacts contain active secrets, private keys, or API tokens allowing lateral movement.",
          safe: "The inspected logs/artifacts contain no unauthorized canary disclosure and access/retention match policy. Masking alone cannot prove all secret forms or artifacts are protected."
        },
        severity: "medium"
      },
      {
        id: "cloud-cicd-oidc",
        text: "CI OIDC audience, subject and deployment trust boundaries",
        how: "Review the cloud role's federated trust conditions alongside workflow/job id-token: write, environment gates and reusable-workflow identity. In an owned test repo/role compare a permitted branch/environment with a fork, unexpected branch or repository. Request only a least-privilege test session and verify identity; never exercise production privileges. Inspect aud, sub, issuer and any configured job_workflow_ref/repository identity constraints, including subject customization.",
        payloads: ["# Review trust policy for token.actions.githubusercontent.com:aud and :sub against the exact intended repo/ref/environment", "aws sts get-caller-identity --profile owned-oidc-test"],
        payloadNotes: ["id-token: write permits requesting an OIDC token; it does not itself grant cloud permissions. A broad wildcard or missing subject check is a candidate until a disallowed identity can assume the role.", "Read-only identity verification after an owner-approved test role exchange. Record subject/audience/role and outcome without retaining the token."],
        expectedResponse: { vulnerable: "A disallowed owned repository/ref/environment successfully obtains the protected test role because issuer/audience/subject constraints or deployment gates are insufficient.", safe: "The authorized identity can assume the test role while disallowed identities are rejected by the relevant trust condition; evaluate each provider's claim support separately." },
        severity: "high", reference: "https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services"
      },
      {
        id: "cloud-cicd-workflow-run",
        text: "workflow_run artifact and cache trust crossing",
        how: "Trace a low-trust producer's artifact/cache into a privileged workflow_run consumer. Verify repository, immutable run/head SHA, event, branch and artifact provenance before extraction or execution. In an owned repo replace one expected artifact/cache fixture with a harmless marker and observe whether privileged code consumes or executes it. A hash supplied by the same untrusted producer is not independent provenance.",
        payloads: ["# Trace actions/download-artifact run-id/repository and the subsequent build/execute steps", "# Owned fixture: put a marker-printing script in the expected artifact or cache entry"],
        payloadNotes: ["workflow_run can have permissions/secrets absent from the producer; downloading an artifact alone is not execution.", "Demonstrate a specific reachable producer-to-consumer cache key/ref path. No real secrets, release publishing or shared cache poisoning."],
        expectedResponse: { vulnerable: "The untrusted marker is executed or changes a trusted build output in a privileged consumer with documented granted capabilities.", safe: "The consumer verifies trusted provenance and isolates untrusted content; cache/artifact data cannot become privileged executable input in the tested path." },
        severity: "high", reference: "https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run"
      },
      {
        id: "cloud-cicd-runner-isolation",
        text: "Self-hosted runner isolation and cross-job persistence",
        how: "Review which untrusted events can select self-hosted runner labels/groups, plus lifecycle, network and credential boundaries. In an isolated owner-controlled runner place a unique marker in an approved scratch path during one low-trust job, then check whether a separate trusted fixture job observes it. Inspect inherited credentials and reachable services from configuration; do not install persistence or pivot into the organization's network.",
        payloads: ["# Review runs-on labels, runner groups and ephemeral runner lifecycle", "# Owned two-job fixture: create then read one scratch marker; remove it after the test"],
        payloadNotes: ["A public-repository runner is a risk indicator, not automatic host compromise; prove attacker-triggerability and granted execution.", "A marker proves shared state only. Demonstrate a security-relevant trusted consumer before claiming cross-job code execution."],
        expectedResponse: { vulnerable: "Untrusted code can influence a later privileged job or access a protected runner capability beyond the documented isolation boundary.", safe: "The tested trust levels use isolated ephemeral environments and protected runner routing, with no shared writable executable state." },
        severity: "high", reference: "https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions"
      }
    ]
  },
  {
    id: "cloud-k8s",
    name: "Container & Kubernetes Security",
    emoji: "☸️",
    description: "Privilege escalation and escape techniques in Docker containers and Kubernetes clusters.",
    reference: "https://cloud.hacktricks.xyz/pentesting-cloud/kubernetes-security",
    items: [
      {
        id: "cloud-k8s-1",
        text: "Docker daemon socket mount container escape",
        how: "When possessing remote code execution inside a container, check if `/var/run/docker.sock` is mounted inside the container.",
        payloads: [
          "ls -l /var/run/docker.sock",
          "docker -H unix:///var/run/docker.sock version"
        ],
        payloadNotes: [
          "Socket existence is a lead; effective Unix permissions, authorization plugins and rootless/user namespaces affect impact.",
          "Read-only daemon version probe, not proof of permission to create containers or mount the host. Review daemon policy or reproduce escalation only in an isolated owned lab."
        ],
        expectedResponse: {
          vulnerable: "Policy review or an isolated fixture proves the untrusted workload can invoke forbidden daemon operations; socket presence or version output alone is insufficient for host compromise.",
          safe: "The tested workload cannot perform forbidden daemon operations under its effective identity. Rootless mode reduces impact but is not by itself a complete authorization boundary."
        },
        severity: "critical",
        tags: { tech: ["docker", "kubernetes"] }
      },
      {
        id: "cloud-k8s-2",
        text: "Kubernetes ServiceAccount token theft & API enumeration",
        how: "In a compromised pod, extract the default mounted ServiceAccount JWT token and query the internal Kubernetes API server.",
        payloads: [
          "TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)",
          "curl -k -H \"Authorization: Bearer $TOKEN\" https://kubernetes.default.svc/api/v1/namespaces/default/pods",
          "kubectl auth can-i get pods --namespace=owned-test --token=\"$TOKEN\""
        ],
        payloadNotes: [
          "Token location: Kubernetes automatically mounts the pod's service account token at this fixed filesystem path.",
          "This path lists pods in default only, not secrets or services. Use a designated test namespace and the mounted CA instead of disabling TLS verification in real assessments.",
          "Bounded permission query for one action and owned namespace; evaluate granted rights against workload requirements, not a universal zero-permissions baseline."
        ],
        expectedResponse: {
          vulnerable: "The ServiceAccount has excessive RBAC privileges (e.g., can list secrets, create pods, or exec into other pods).",
          safe: "The workload's effective RBAC and token mounting match required least privilege. Some API permissions are legitimate, and disabling automount does not exclude explicitly supplied credentials."
        },
        severity: "high",
        tags: { tech: ["kubernetes"] }
      }
    ]
  },
  {
    id: "cloud-dangling",
    name: "Modern SaaS & CDN Dangling CNAME Takeovers",
    emoji: "🎯",
    description: "Detect abandoned subdomains pointing to cloud services that can be claimed by an external party.",
    reference: "https://github.com/EdOverflow/can-i-take-over-xyz",
    items: [
      {
        id: "cloud-takeover-1",
        text: "Modern platform takeover (Vercel, Netlify, Render, Cloudflare)",
        how: "Resolve subdomains and inspect HTTP response headers/bodies for signature error messages from unclaimed SaaS platforms.",
        payloads: [
          "Vercel: CNAME cname.vercel-dns.com -> '404: NOT_FOUND' / 'The deployment could not be found on Vercel.'",
          "Netlify: CNAME *.netlify.app -> 'Not Found - Request ID:' / 'Netlify 404'",
          "Render: CNAME *.onrender.com -> 'Not Found' (Render default placeholder)",
          "Cloudflare Pages: CNAME *.pages.dev -> 'Pages Not Found'"
        ],
        payloadNotes: [
          "Inspect DNS CNAME: verify the DNS record points to a third-party hosting service.",
          "Check HTTP response: an unclaimed project returns a recognizable provider error code.",
          "Render error pages are candidates only; reproduce claimability on an owned disposable hostname.",
          "Cloudflare Pages errors do not prove claimability. Verify provider ownership checks; never claim a target custom domain without explicit permission."
        ],
        expectedResponse: {
          vulnerable: "The third-party service allows adding and verifying the custom domain without domain ownership verification TXT records.",
          safe: "The service requires DNS TXT verification before routing traffic to an account, or the dangling DNS record is removed."
        },
        severity: "high"
      }
    ]
  }
];
