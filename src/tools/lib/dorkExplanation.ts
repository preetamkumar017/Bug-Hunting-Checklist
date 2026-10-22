export interface DorkOperator {
  op: string;
  label: string;
  desc: string;
}

export interface DorkExplanation {
  whatItDoes: string;
  whyItMatters: string;
  vulnClass: string;
  operators: DorkOperator[];
  hunterTips: string[];
}

/**
 * Parses query strings to detect operators and provide contextual syntax explanation.
 */
export function extractDorkOperators(query: string, engine: string = "google"): DorkOperator[] {
  const ops: DorkOperator[] = [];

  if (query.includes("site:")) {
    const match = query.match(/site:([^\s]+)/);
    ops.push({
      op: "site:",
      label: "Target Domain Scope",
      desc: match ? `Limits Google results exclusively to ${match[1]}` : "Restricts results strictly to the target host and its subdomains.",
    });
  }

  if (query.includes("ext:") || query.includes("filetype:")) {
    const extMatch = query.match(/(?:ext|filetype):([a-zA-Z0-9_|]+)/g);
    ops.push({
      op: "ext: / filetype:",
      label: "File Extension Filter",
      desc: extMatch
        ? `Filters search to specific file formats: ${extMatch.map(m => m.replace(/^(ext|filetype):/, "")).join(", ")}`
        : "Matches indexed files ending in specific extensions like .env, .sql, .bak, or .pdf.",
    });
  }

  if (query.includes("inurl:")) {
    const inurlMatches = query.match(/inurl:([^\s|]+)/g);
    ops.push({
      op: "inurl:",
      label: "URL Path / Parameter Match",
      desc: inurlMatches
        ? `Searches for keyword inside URL paths or query strings: ${inurlMatches.slice(0, 3).map(m => m.replace("inurl:", "")).join(", ")}${inurlMatches.length > 3 ? "..." : ""}`
        : "Finds pages where the specified text appears in the URL path, endpoint, or query parameter.",
    });
  }

  if (query.includes("intitle:")) {
    ops.push({
      op: "intitle:",
      label: "HTML Title Tag Match",
      desc: "Matches text appearing inside the HTML <title> tag (e.g. 'index of', 'Admin Dashboard').",
    });
  }

  if (query.includes("intext:")) {
    ops.push({
      op: "intext:",
      label: "Body Text Match",
      desc: "Searches for specific strings anywhere within the visible text of indexed web pages.",
    });
  }

  if (query.includes("|") || query.includes(" OR ")) {
    ops.push({
      op: "| or OR",
      label: "Boolean OR Operator",
      desc: "Returns results that match any of the separated conditions in a single query.",
    });
  }

  if (query.includes('"')) {
    ops.push({
      op: '"..."',
      label: "Exact Phrase Matching",
      desc: "Forces search engines to match the exact string without synonyms or fuzzy substitutions.",
    });
  }

  if (query.includes("-")) {
    const negMatch = query.match(/-([a-zA-Z0-9:.*_-]+)/);
    if (negMatch && !negMatch[1].startsWith(" ")) {
      ops.push({
        op: "- (minus)",
        label: "Exclusion Operator",
        desc: `Excludes results containing '${negMatch[1]}' to remove false positives and noise.`,
      });
    }
  }

  // Engine specific operators
  if (engine === "github") {
    if (query.includes("filename:")) {
      ops.push({
        op: "filename:",
        label: "GitHub File Filter",
        desc: "Matches exact filenames inside Git repositories (e.g. .env, id_rsa, wp-config.php).",
      });
    }
    if (query.includes("org:")) {
      ops.push({
        op: "org:",
        label: "GitHub Organization",
        desc: "Limits code search strictly to repositories belonging to the target GitHub organization.",
      });
    }
  }

  if (engine === "shodan") {
    if (query.includes("hostname:")) {
      ops.push({
        op: "hostname:",
        label: "Shodan Hostname Filter",
        desc: "Filters Shodan's indexed server IPs associated with the target domain name.",
      });
    }
    if (query.includes("port:")) {
      ops.push({
        op: "port:",
        label: "Open Port Filter",
        desc: "Filters for target hosts running specific listening services on exposed TCP/UDP ports.",
      });
    }
    if (query.includes("ssl.cert")) {
      ops.push({
        op: "ssl.cert.*",
        label: "SSL Certificate Subject",
        desc: "Finds origin IP addresses by matching SSL certificate domain names, bypassing CDNs like Cloudflare.",
      });
    }
    if (query.includes("http.favicon.hash")) {
      ops.push({
        op: "http.favicon.hash",
        label: "Favicon MurmurHash",
        desc: "Fingerprints specific software, firewalls, and admin panels by their unique favicon hash.",
      });
    }
  }

  return ops;
}

/**
 * Returns a comprehensive explanation, security risk, and bug hunter testing advice for any dork.
 */
export function getDorkExplanation(
  query: string,
  what: string,
  severity: string,
  engine: string = "google",
  tip?: string
): DorkExplanation {
  const q = query.toLowerCase();
  const operators = extractDorkOperators(query, engine);

  // 1. Environment & Config files
  if (q.includes("ext:env") || q.includes(".env") || q.includes("ext:ini") || q.includes("ext:conf") || q.includes("ext:yml")) {
    return {
      whatItDoes: "Searches Google index for exposed configuration and environment files (.env, .conf, .yml) that web servers fail to restrict.",
      whyItMatters: "Environment files frequently leak plaintext database credentials (MySQL, PostgreSQL), third-party API keys (Stripe, AWS, SendGrid), and JWT signing secrets.",
      vulnClass: "CWE-200: Information Exposure / Credential Leakage",
      operators,
      hunterTips: [
        "If a file is accessible, immediately check if keys belong to production or staging/test.",
        "Verify if AWS keys (AKIA...) or Stripe keys are active using read-only calls (never write or delete).",
        "Scope check: Most bug bounty programs award P1/Critical bounties for live production .env leaks.",
        "PoC guidance: Mask sensitive secret values in your report screenshots (leave first/last 4 chars).",
      ],
    };
  }

  // 2. Database dumps & SQL files
  if (q.includes("ext:sql") || q.includes("ext:db") || q.includes("ext:dbf") || q.includes("ext:mdb")) {
    return {
      whatItDoes: "Discovers indexed database backups (.sql, .db, .mdb) left directly in web-accessible document roots by developers or backup scripts.",
      whyItMatters: "Complete database dumps expose user personally identifiable information (PII), password hashes (bcrypt, MD5), and proprietary business logic.",
      vulnClass: "CWE-552: Files or Directories Accessible to External Parties",
      operators,
      hunterTips: [
        "Download only the minimum bytes necessary to prove existence (e.g. `head -n 20 dump.sql`) to avoid privacy violations.",
        "Do not download the entire database — downloading full user tables can violate program Safe Harbor policies.",
        "Document the exact URL, file size, and timestamp visible in HTTP response headers.",
      ],
    };
  }

  // 3. Backup and archive files
  if (q.includes("ext:bak") || q.includes("ext:old") || q.includes("ext:backup") || q.includes("ext:zip") || q.includes("ext:tar")) {
    return {
      whatItDoes: "Targets backup copies of source files created automatically by text editors (.swp, .old, ~) or manual zip archives created by sysadmins.",
      whyItMatters: "Backup files often contain original source code before security patches, uncompiled PHP/Python scripts, or hardcoded API credentials.",
      vulnClass: "CWE-530: Exposure of Backup File to an Unauthorized Control Sphere",
      operators,
      hunterTips: [
        "Check index.php.bak, config.php.old, or site-backup.zip patterns.",
        "Verify if the web server serves .bak files as plaintext rather than executing them dynamically.",
        "Search extracted archives for hardcoded salts, private encryption keys, and internal API routes.",
      ],
    };
  }

  // 4. Git directory exposure
  if (q.includes(".git") || q.includes("inurl:\".git\"")) {
    return {
      whatItDoes: "Looks for exposed .git version control repositories indexed by search engines due to missing web server directory rules.",
      whyItMatters: "An exposed .git folder allows an attacker to dump the entire source code repository, commit history, and hidden secrets using git-dumper tools.",
      vulnClass: "CWE-527: Exposure of Version Control System to an Unauthorized Control Sphere",
      operators,
      hunterTips: [
        "Verify exposure by requesting `/.git/HEAD` or `/.git/config`. It should return `ref: refs/heads/master` or git config syntax.",
        "This is generally classified as P1 or P2 depending on whether proprietary source code and credentials are recovered.",
        "Safe Harbor notice: Do not pull the entire company history; fetching `.git/HEAD` and `.git/config` is sufficient PoC.",
      ],
    };
  }

  // 5. Admin and Login Panels
  if (q.includes("inurl:admin") || q.includes("inurl:login") || q.includes("inurl:dashboard") || q.includes("inurl:portal")) {
    return {
      whatItDoes: "Finds administrative interfaces, CMS backends, and internal management consoles exposed to the public internet.",
      whyItMatters: "Internal or forgotten portals often lack Web Application Firewalls (WAF), enforce no Multi-Factor Authentication (MFA), or run on outdated vulnerable software.",
      vulnClass: "CWE-287: Improper Authentication / Attack Surface Expansion",
      operators,
      hunterTips: [
        "Test for default credentials (e.g., admin/admin, admin/password) with maximum 1-2 attempts to avoid account lockout.",
        "Check the software and version displayed in page footer or HTTP response headers for known CVEs.",
        "Test for authentication bypass flaws (SQLi in username field, header spoofing like X-Forwarded-For: 127.0.0.1).",
      ],
    };
  }

  // 6. Spring Actuator / Debug endpoints
  if (q.includes("actuator") || q.includes("jolokia") || q.includes("server-status") || q.includes("/debug")) {
    return {
      whatItDoes: "Identifies Spring Boot Actuator, Apache server-status, and development debug endpoints exposed without authentication.",
      whyItMatters: "Actuator endpoints like `/actuator/env` expose environment variables, `/actuator/heapdump` leaks memory containing session tokens, and `/actuator/gateway/routes` allows RCE in vulnerable versions.",
      vulnClass: "CWE-200: Information Exposure Through Debug Endpoints",
      operators,
      hunterTips: [
        "Check `/actuator/health`, `/actuator/env`, `/actuator/mappings`, and `/actuator/beans`.",
        "If `/actuator/env` returns active DB passwords or AWS credentials, this is an instant High/Critical finding.",
        "Always check if the endpoint allows POST methods or if read-only access is permitted.",
      ],
    };
  }

  // 7. Error messages & SQL Injection indicators
  if (q.includes("sql syntax") || q.includes("mysql_fetch") || q.includes("ora-0") || q.includes("postgresql")) {
    return {
      whatItDoes: "Discovers pages indexed by Google while displaying raw SQL database syntax errors or unhandled database exceptions.",
      whyItMatters: "Reveals exact database technology (MySQL, Oracle, PostgreSQL), table and column names, and directly flags endpoints vulnerable to SQL Injection.",
      vulnClass: "CWE-89: SQL Injection / Verbose Error Disclosure",
      operators,
      hunterTips: [
        "Observe the URL query parameters that triggered the error in Google's cache.",
        "Test with harmless SQLi verification: `' OR '1'='1` or arithmetic payload like `id=5-1` vs `id=4`.",
        "Never run destructive SQL statements (`DROP`, `UPDATE`, `INSERT`). Proof of database version (`version()` or `@@version`) is sufficient.",
      ],
    };
  }

  // 8. Parameter fuzzing / Injection candidates
  if (q.includes("inurl:\"?id=\"") || q.includes("inurl:\"?page=\"") || q.includes("inurl:\"?file=\"") || q.includes("inurl:\"?cat=\"")) {
    return {
      whatItDoes: "Extracts dynamic web pages with URL query parameters that accept user input directly into backend logic.",
      whyItMatters: "Parameters like `?id=` are prime candidates for IDOR (BOLA) and SQL Injection, while `?file=` or `?page=` frequently suffer from Path Traversal / LFI.",
      vulnClass: "CWE-639: IDOR / CWE-22: Path Traversal",
      operators,
      hunterTips: [
        "For `?id=`: change the numerical value (e.g. 1001 to 1002) to verify if another user's private data is returned (IDOR).",
        "For `?file=` / `?page=`: test for LFI using harmless relative paths like `../../../../etc/passwd` or file wrappers (`php://filter`).",
        "Always test with benign characters (quotes, backslashes, percent signs) to inspect error handling.",
      ],
    };
  }

  // 9. Open Redirect / SSRF
  if (q.includes("redirect=") || q.includes("url=") || q.includes("next=") || q.includes("return=") || q.includes("=http")) {
    return {
      whatItDoes: "Filters URLs containing redirection and target destination parameters commonly used in login redirects and external link forwards.",
      whyItMatters: "Improperly validated redirect parameters lead to phishing via Open Redirect, OAuth token theft, or Server-Side Request Forgery (SSRF) if fetched server-side.",
      vulnClass: "CWE-601: Open Redirect / CWE-918: Server-Side Request Forgery (SSRF)",
      operators,
      hunterTips: [
        "Test for Open Redirect using standard bypasses: `https://evil.com`, `//evil.com`, or `https://target.com.evil.com`.",
        "Escalate to SSRF: test if the backend server fetches the URL by pointing to your Burp Collaborator or interactsh listener.",
        "Check if the redirect URL receives sensitive tokens in URL fragment or OAuth callbacks (`redirect_uri` parameter).",
      ],
    };
  }

  // 10. API Keys & AWS tokens
  if (q.includes("api_key") || q.includes("apikey") || q.includes("akia") || q.includes("begin rsa private key")) {
    return {
      whatItDoes: "Scans indexed JavaScript files, error logs, and public pages for hardcoded secrets, cryptographic private keys, and cloud API tokens.",
      whyItMatters: "AWS keys starting with `AKIA` grant programmatic access to cloud infrastructure. Leaked RSA private keys permit SSH access or SSL decryption.",
      vulnClass: "CWE-798: Use of Hardcoded Credentials",
      operators,
      hunterTips: [
        "For AWS keys: verify with `aws sts get-caller-identity` to check key validity without modifying cloud assets.",
        "Check if API keys are client-facing public keys (e.g. Google Maps API, Firebase public key) vs sensitive backend secrets (Stripe sk_live).",
        "Always report leaked private keys immediately as High/Critical.",
      ],
    };
  }

  // 11. Third-party cloud storage (S3, Azure, GCS, Firebase)
  if (q.includes("s3.amazonaws.com") || q.includes("blob.core.windows.net") || q.includes("storage.googleapis.com") || q.includes("firebaseio.com")) {
    return {
      whatItDoes: "Locates public cloud storage buckets and Firebase real-time databases associated with the target organization.",
      whyItMatters: "Misconfigured public cloud buckets often allow unauthorized read/write access to customer documents, backups, and media assets.",
      vulnClass: "CWE-276: Incorrect Default Permissions / Cloud Misconfiguration",
      operators,
      hunterTips: [
        "Test for open bucket listing via AWS CLI: `aws s3 ls s3://bucket-name --no-sign-request`.",
        "For Firebase: append `.json` to the URL (e.g. `https://<org>.firebaseio.com/.json`) to test for unauthenticated read/write access.",
        "Never upload malicious files; test write permissions using a benign `test-<hunter>.txt` file and delete it immediately.",
      ],
    };
  }

  // 12. security.txt & Vulnerability Disclosure Policies
  if (q.includes("security.txt")) {
    return {
      whatItDoes: "Finds domains with an active RFC 9116 security.txt file disclosing official vulnerability reporting channels and bug bounty policies.",
      whyItMatters: "Targets with security.txt have officially invited security researchers to report vulnerabilities, providing clear legal Safe Harbor.",
      vulnClass: "Security Policy & Legal Safe Harbor Discovery",
      operators,
      hunterTips: [
        "Open `/.well-known/security.txt` and verify the `Policy:` and `Contact:` directives.",
        "Check the `Expires:` field to verify if the security policy is actively maintained.",
        "Always review the in-scope and out-of-scope rules before starting any active testing.",
      ],
    };
  }

  // 13. Subdomain enumeration & Takeover hints
  if (q.includes("site:*.") && (q.includes("404") || q.includes("403") || q.includes("-www"))) {
    return {
      whatItDoes: "Maps out all indexed subdomains while filtering out standard www hosts, pinpointing forgotten or misconfigured services.",
      whyItMatters: "Dangling CNAME records pointing to decommissioned third-party services (GitHub Pages, AWS S3, Heroku, Zendesk) can be claimed for Subdomain Takeover.",
      vulnClass: "CWE-284: Improper Access Control / Subdomain Takeover",
      operators,
      hunterTips: [
        "Query DNS using `dig sub.target.com CNAME` to inspect where the domain resolves.",
        "Look for provider-specific error pages like 'There isn't a GitHub Pages site here' or 'NoSuchBucket'.",
        "Subdomain takeover gives the hunter control over cookies, session tokens, and SSL on the main domain.",
      ],
    };
  }

  // 14. GitHub Code Search
  if (engine === "github") {
    return {
      whatItDoes: "Leverages GitHub's code search engine across public repositories to detect target company domain references, credentials, and internal code.",
      whyItMatters: "Developers frequently commit testing configurations, staging `.env` files, or proprietary API keys to personal or public repos by mistake.",
      vulnClass: "CWE-538: Insertion of Sensitive Information into Externally-Accessible Code",
      operators,
      hunterTips: [
        "Check commit history — even if a secret was removed in the latest commit, it may persist in past commit diffs.",
        "Inspect forks created by target employees for staging configurations.",
        "Confirm if the repository belongs to an official employee or is an unauthorized copy before filing.",
      ],
    };
  }

  // 15. Shodan Search
  if (engine === "shodan") {
    return {
      whatItDoes: "Queries Shodan's internet-wide port scanner to detect open network services, exposed databases, and server banners under the target's IP ranges.",
      whyItMatters: "Identifies infrastructure directly exposed to the internet without firewall protection (e.g. unauthenticated Redis, Elasticsearch, FTP, RDP).",
      vulnClass: "CWE-1188: Insecure Default Initialization of Network Resource",
      operators,
      hunterTips: [
        "Test for unauthenticated access on database ports (Redis on 6379, Elasticsearch on 9200).",
        "Use `ssl.cert.subject.cn` to uncover the actual origin web server IP hidden behind Cloudflare/Akamai.",
        "Never exploit or execute commands on discovered services; capturing the banner or open port response is sufficient PoC.",
      ],
    };
  }

  // Default intelligent fallback based on 'what' and severity
  return {
    whatItDoes: tip || `Executes a targeted search query designed to discover: "${what}".`,
    whyItMatters: severity === "critical" || severity === "high"
      ? "Finding accessible assets of this category represents significant attack surface expansion and potential direct security compromise."
      : "Provides valuable intelligence for passive reconnaissance and attack surface mapping without sending active network packets.",
    vulnClass: severity === "critical"
      ? "CWE-200: Critical Exposure / Privilege Compromise"
      : severity === "high"
      ? "CWE-200: Sensitive Information Disclosure"
      : "Reconnaissance / Attack Surface Mapping",
    operators,
    hunterTips: tip ? [tip] : [
      "Confirm target ownership and verify whether the discovered asset falls within program scope.",
      "Check HTTP status codes (200 OK vs 403 Forbidden vs 404 Not Found) before attempting deeper validation.",
      "Always document full URL, timestamp, and response headers for clear bug bounty submission.",
    ],
  };
}
