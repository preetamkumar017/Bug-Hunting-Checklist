export type DorkEngine = "google" | "github" | "shodan";

export interface Dork {
  /** Query template. `{domain}` is replaced with the target (e.g. example.com), `{org}` with its first label. */
  query: string;
  what: string; // what a hit means
  severity: "critical" | "high" | "medium" | "low" | "info";
  engine?: DorkEngine; // defaults to google
}

export interface DorkGroup {
  id: string;
  name: string;
  description: string;
  dorks: Dork[];
}

export const DORK_GROUPS: DorkGroup[] = [
  {
    id: "files",
    name: "Exposed Files & Backups",
    description: "Config, env, backup and database dumps that got indexed.",
    dorks: [
      { query: "site:{domain} ext:env | ext:ini | ext:conf | ext:cfg | ext:yml | ext:yaml", what: "Config files with DB creds / API keys", severity: "high" },
      { query: "site:{domain} ext:sql | ext:db | ext:dbf | ext:mdb", what: "Database dumps or DB files", severity: "critical" },
      { query: "site:{domain} ext:bak | ext:old | ext:backup | ext:swp | ext:zip | ext:tar | ext:gz", what: "Backup / archive files with source or data", severity: "high" },
      { query: "site:{domain} ext:log", what: "Log files leaking paths, tokens, stack traces", severity: "medium" },
      { query: "site:{domain} ext:pdf | ext:xls | ext:xlsx | ext:doc | ext:docx | ext:csv \"confidential\" | \"internal use only\"", what: "Internal documents never meant to be public", severity: "medium" },
      { query: "site:{domain} intitle:\"index of\" \"parent directory\"", what: "Open directory listing", severity: "medium" },
      { query: "site:{domain} inurl:\".git\" intitle:\"index of\"", what: "Exposed .git directory (source code + secrets)", severity: "critical" },
    ],
  },
  {
    id: "panels",
    name: "Login, Admin & Dev Panels",
    description: "Admin consoles, dev/staging pages and debug endpoints.",
    dorks: [
      { query: "site:{domain} inurl:admin | inurl:login | inurl:dashboard | inurl:portal", what: "Admin / login surfaces to test for auth bypass, default creds", severity: "info" },
      { query: "site:{domain} inurl:phpinfo | inurl:info.php", what: "phpinfo() disclosure", severity: "medium" },
      { query: "site:{domain} inurl:swagger | inurl:api-docs | inurl:openapi | inurl:graphql", what: "Exposed API docs / GraphQL endpoints", severity: "medium" },
      { query: "site:{domain} inurl:actuator | inurl:jolokia | inurl:/server-status | inurl:/debug", what: "Spring Actuator / Apache status / debug endpoints", severity: "high" },
      { query: "site:{domain} inurl:jenkins | inurl:grafana | inurl:kibana | inurl:phpmyadmin | inurl:adminer", what: "Exposed internal tools", severity: "high" },
      { query: "site:*.{domain} inurl:dev | inurl:staging | inurl:test | inurl:uat", what: "Non-prod environments (weaker security)", severity: "medium" },
    ],
  },
  {
    id: "errors",
    name: "Errors & Injection Hints",
    description: "Pages showing SQL/stack-trace errors, and URLs with injectable params.",
    dorks: [
      { query: "site:{domain} \"sql syntax near\" | \"mysql_fetch\" | \"ORA-0\" | \"PostgreSQL query failed\"", what: "SQL error messages (SQLi indicator)", severity: "high" },
      { query: "site:{domain} \"Warning: include(\" | \"Fatal error:\" | \"Stack trace:\" | \"Traceback (most recent call last)\"", what: "Verbose stack traces / file paths", severity: "medium" },
      { query: "site:{domain} inurl:\"?id=\" | inurl:\"?page=\" | inurl:\"?file=\" | inurl:\"?cat=\"", what: "Params to test for SQLi / LFI / IDOR", severity: "info" },
      { query: "site:{domain} inurl:\"redirect=\" | inurl:\"url=\" | inurl:\"next=\" | inurl:\"return=\"", what: "Open redirect / SSRF candidates", severity: "info" },
      { query: "site:{domain} inurl:\"=http\" | inurl:\"=https\" | inurl:\"=//\"", what: "Params that take URLs (SSRF / redirect)", severity: "info" },
    ],
  },
  {
    id: "secrets",
    name: "Keys, Tokens & Credentials",
    description: "Secrets that leaked onto indexed pages or JS.",
    dorks: [
      { query: "site:{domain} \"api_key\" | \"apikey\" | \"secret_key\" | \"access_token\" ext:js | ext:json", what: "Hardcoded keys in JS/JSON", severity: "high" },
      { query: "site:{domain} \"BEGIN RSA PRIVATE KEY\" | \"BEGIN OPENSSH PRIVATE KEY\"", what: "Private key exposed on page", severity: "critical" },
      { query: "site:{domain} \"AKIA\" ext:js | ext:txt | ext:env", what: "AWS access key ID pattern", severity: "critical" },
      { query: "site:{domain} intext:\"password\" filetype:txt | filetype:log", what: "Plaintext password in text/log files", severity: "high" },
    ],
  },
  {
    id: "third-party",
    name: "Third-Party Leaks (Paste / Cloud)",
    description: "Leaks of the target outside its own domain.",
    dorks: [
      { query: "site:pastebin.com | site:paste.ee | site:ghostbin.com \"{domain}\"", what: "Pastes mentioning the domain (creds, dumps)", severity: "high" },
      { query: "site:trello.com \"{domain}\" password | credentials", what: "Public Trello boards with creds", severity: "high" },
      { query: "site:s3.amazonaws.com \"{org}\"", what: "Public S3 buckets named after the org", severity: "high" },
      { query: "site:blob.core.windows.net \"{org}\"", what: "Azure blob storage", severity: "high" },
      { query: "site:storage.googleapis.com \"{org}\"", what: "GCS buckets", severity: "high" },
      { query: "site:docs.google.com/spreadsheets \"{domain}\"", what: "Public Google Sheets with internal data", severity: "medium" },
      { query: "site:atlassian.net | site:jira.com \"{domain}\" -inurl:browse", what: "Public Jira/Confluence pages", severity: "medium" },
      { query: "site:hackerone.com/reports \"{domain}\"", what: "Prior disclosed reports — known weak areas", severity: "info" },
    ],
  },
  {
    id: "code",
    name: "GitHub Code Search",
    description: "Open on GitHub — secrets committed by employees or in org repos.",
    dorks: [
      { query: "\"{domain}\" password", what: "Passwords next to the domain", severity: "high", engine: "github" },
      { query: "\"{domain}\" api_key OR apikey OR secret OR token", what: "API keys / tokens tied to the domain", severity: "high", engine: "github" },
      { query: "\"{domain}\" filename:.env", what: ".env files mentioning the domain", severity: "critical", engine: "github" },
      { query: "\"{domain}\" filename:id_rsa OR filename:.npmrc OR filename:.dockercfg", what: "SSH keys / registry creds", severity: "critical", engine: "github" },
      { query: "\"{domain}\" jdbc OR mongodb+srv OR postgres://", what: "DB connection strings", severity: "critical", engine: "github" },
    ],
  },
  {
    id: "shodan",
    name: "Shodan Exposure",
    description: "Open on Shodan — services on the org's hosts (needs Shodan login for some filters).",
    dorks: [
      { query: "hostname:{domain}", what: "All indexed hosts under the domain", severity: "info", engine: "shodan" },
      { query: "ssl.cert.subject.cn:{domain}", what: "Hosts with a cert for the domain (finds origin IPs)", severity: "info", engine: "shodan" },
      { query: "hostname:{domain} http.title:\"Dashboard\" | \"Login\" | \"Admin\"", what: "Admin/login panels on org hosts", severity: "medium", engine: "shodan" },
      { query: "hostname:{domain} port:9200,6379,27017,5432", what: "Elasticsearch/Redis/Mongo/Postgres exposed", severity: "critical", engine: "shodan" },
      { query: "hostname:{domain} port:21,22,23,25,3389", what: "FTP/SSH/Telnet/SMTP/RDP exposed to internet", severity: "high", engine: "shodan" },
      { query: "hostname:{domain} http.favicon.hash:-1616143106", what: "Default Cisco/Juniper/router login page", severity: "medium", engine: "shodan" },
    ],
  },
  {
    id: "subdomains",
    name: "Subdomains & Network",
    description: "Subdomain enumeration, forgotten hosts, and network asset discovery.",
    dorks: [
      { query: "site:*.{domain} -www", what: "All indexed subdomains (excluding www)", severity: "info" },
      { query: "site:*.{domain} inurl:api | inurl:v1 | inurl:v2 | inurl:v3", what: "API versioned subdomains", severity: "medium" },
      { query: "site:*.{domain} inurl:mail | inurl:webmail | inurl:smtp | inurl:imap", what: "Mail-related subdomains (often weaker auth)", severity: "medium" },
      { query: "site:*.{domain} inurl:vpn | inurl:remote | inurl:citrix | inurl:pulse", what: "Remote access / VPN portals", severity: "high" },
      { query: "site:*.{domain} inurl:cdn | inurl:assets | inurl:static | inurl:media", what: "CDN/asset hosts that may expose sensitive files", severity: "low" },
      { query: "site:*.{domain} \"404\" | \"403\" | \"401\" -inurl:error", what: "Restricted or forgotten subdomains (subdomain takeover hints)", severity: "medium" },
      { query: "site:{domain} inurl:internal | inurl:corp | inurl:intranet | inurl:private", what: "Internal network portals accidentally indexed", severity: "high" },
    ],
  },
  {
    id: "cloud",
    name: "Cloud & Storage Misconfigs",
    description: "Misconfigured AWS, GCP, Azure, and other cloud storage assets.",
    dorks: [
      { query: "site:s3.amazonaws.com \"{org}\" -inurl:download", what: "Public S3 buckets with org name", severity: "high" },
      { query: "site:s3.amazonaws.com intitle:\"index of\"", what: "Open S3 bucket directory listings", severity: "critical" },
      { query: "site:blob.core.windows.net \"{org}\"", what: "Azure Blob Storage with org data", severity: "high" },
      { query: "site:storage.googleapis.com \"{org}\" | \"{domain}\"", what: "Public GCS buckets", severity: "high" },
      { query: "site:firebaseio.com \"{org}\"", what: "Firebase databases (check .json endpoint)", severity: "critical" },
      { query: "site:digitaloceanspaces.com \"{org}\"", what: "DigitalOcean Spaces public buckets", severity: "high" },
      { query: "\"{org}\" site:files.slack.com | site:drive.google.com", what: "Internal files shared publicly on Slack/Drive", severity: "high" },
      { query: "site:{domain} ext:yaml | ext:yml \"bucket\" | \"aws_access\" | \"azure\"", what: "Cloud config files with credentials", severity: "critical" },
    ],
  },
  {
    id: "api",
    name: "API & Endpoint Discovery",
    description: "Hidden API endpoints, webhooks, and exposed API gateways.",
    dorks: [
      { query: "site:{domain} inurl:/api/ | inurl:/rest/ | inurl:/graphql | inurl:/rpc", what: "Generic API paths to test for unauthed access", severity: "info" },
      { query: "site:{domain} inurl:webhook | inurl:callback | inurl:notify", what: "Webhook / callback endpoints (SSRF / takeover risk)", severity: "medium" },
      { query: "site:{domain} filetype:json inurl:api | inurl:config | inurl:settings", what: "JSON API config or response files indexed", severity: "high" },
      { query: "site:{domain} inurl:token | inurl:oauth | inurl:auth | inurl:sso inurl:callback", what: "OAuth / SSO callback URLs", severity: "high" },
      { query: "site:{domain} inurl:/api/v1/users | inurl:/api/users | inurl:/api/accounts", what: "User enumeration API endpoints", severity: "high" },
      { query: "site:{domain} inurl:wsdl | inurl:soap | inurl:asmx", what: "SOAP / WSDL service descriptions", severity: "medium" },
      { query: "site:{domain} \"application/json\" | \"Content-Type: application/json\"", what: "Pages returning JSON (API response leak)", severity: "low" },
    ],
  },
  {
    id: "cms",
    name: "CMS & Framework Fingerprint",
    description: "Identify CMS, frameworks, and tech stacks to target known CVEs.",
    dorks: [
      { query: "site:{domain} inurl:wp-content | inurl:wp-admin | inurl:wp-login.php", what: "WordPress installation (check for outdated plugins/themes)", severity: "medium" },
      { query: "site:{domain} inurl:/administrator/index.php | inurl:/joomla/", what: "Joomla admin panel", severity: "medium" },
      { query: "site:{domain} inurl:/typo3/ | inurl:/magento/ | inurl:/drupal/", what: "TYPO3 / Magento / Drupal CMS identified", severity: "medium" },
      { query: "site:{domain} inurl:laravel | inurl:symfony | inurl:django | inurl:rails", what: "Framework path hints — check for debug mode / CSRF issues", severity: "low" },
      { query: "site:{domain} \"Powered by\" | \"Built with\" | \"Running on\" intext:version", what: "Version disclosure in footers", severity: "low" },
      { query: "site:{domain} intitle:\"Welcome to nginx\" | intitle:\"Apache HTTP Server\"", what: "Default web server pages (unconfigured servers)", severity: "medium" },
      { query: "site:{domain} inurl:struts | inurl:action | intext:\"Struts Problem Report\"", what: "Apache Struts (S2-045 / CVE-2017-5638 class of vulns)", severity: "critical" },
    ],
  },
  {
    id: "sensitive",
    name: "Sensitive Pages & Info Disclosure",
    description: "Exposed internal pages, PII, financial data, and privacy-related content.",
    dorks: [
      { query: "site:{domain} intext:\"ssn\" | intext:\"social security\" | intext:\"date of birth\" filetype:pdf | filetype:xls", what: "PII in indexed documents", severity: "critical" },
      { query: "site:{domain} intext:\"credit card\" | intext:\"cvv\" | intext:\"expiry date\" filetype:txt | filetype:csv", what: "Payment card data exposure", severity: "critical" },
      { query: "site:{domain} intitle:\"Page Not Found\" | intitle:\"Error 500\" | intitle:\"Application Error\"", what: "Custom error pages leaking tech stack info", severity: "low" },
      { query: "site:{domain} inurl:sitemap.xml | inurl:robots.txt", what: "Disallowed paths in robots.txt / full sitemap", severity: "info" },
      { query: "site:{domain} intext:\"internal only\" | intext:\"do not share\" | intext:\"confidential\"", what: "Pages with confidential markings that are indexed", severity: "high" },
      { query: "site:{domain} filetype:xml inurl:feed | inurl:rss | inurl:atom", what: "RSS/XML feeds leaking post metadata, user IDs", severity: "low" },
      { query: "site:{domain} inurl:tracking | inurl:order-status | inurl:invoice | inurl:receipt", what: "Order/invoice pages — test for IDOR via order IDs", severity: "high" },
    ],
  },
  {
    id: "idor",
    name: "IDOR & Access Control",
    description: "Parameters and URL patterns commonly vulnerable to IDOR, BAC, or privilege escalation.",
    dorks: [
      { query: "site:{domain} inurl:user_id= | inurl:account_id= | inurl:profile_id=", what: "Numeric user IDs in URL (classic IDOR surface)", severity: "high" },
      { query: "site:{domain} inurl:order_id= | inurl:invoice_id= | inurl:ticket_id=", what: "Object reference params — swap IDs for other users' data", severity: "high" },
      { query: "site:{domain} inurl:download?file= | inurl:fetch?url= | inurl:get?path=", what: "File download params (LFI / path traversal / SSRF)", severity: "high" },
      { query: "site:{domain} inurl:role= | inurl:permission= | inurl:access=", what: "Role / permission params (privilege escalation via param tampering)", severity: "high" },
      { query: "site:{domain} inurl:export | inurl:download | inurl:report inurl:format=", what: "Export/report endpoints leaking bulk data", severity: "medium" },
      { query: "site:{domain} inurl:admin inurl:user | inurl:admin inurl:manage | inurl:admin inurl:delete", what: "Admin actions on user objects (BAC)", severity: "high" },
    ],
  },
  {
    id: "js",
    name: "JavaScript & Source Maps",
    description: "Client-side secrets, source maps, and exposed JS build artifacts.",
    dorks: [
      { query: "site:{domain} ext:js inurl:main | inurl:app | inurl:bundle | inurl:chunk", what: "Built JS bundles (look for hardcoded keys, internal URLs)", severity: "medium" },
      { query: "site:{domain} ext:js.map | filetype:map inurl:.js", what: "Source maps exposing original TypeScript/React source code", severity: "high" },
      { query: "site:{domain} ext:js \"localStorage.setItem\" | \"sessionStorage\" | \"document.cookie\"", what: "JS storing sensitive tokens in browser storage", severity: "medium" },
      { query: "site:{domain} ext:js \"process.env\" | \"API_URL\" | \"BASE_URL\" | \"SECRET\"", what: "Env vars baked into production JS bundle", severity: "high" },
      { query: "site:{domain} ext:js \"firebase\" | \"supabase\" | \"amplify\" intext:apiKey", what: "Firebase / Supabase / Amplify API keys in JS", severity: "critical" },
      { query: "site:{domain} ext:js \"Authorization:\" | \"Bearer \" | \"X-API-Key\"", what: "Hardcoded auth headers in frontend JS", severity: "critical" },
      { query: "\"{domain}\" filename:*.js \"apiKey\" OR \"clientSecret\" OR \"privateKey\"", what: "Keys in JS files on GitHub", severity: "critical", engine: "github" },
    ],
  },
];

// ─── TARGET RECONNAISSANCE ────────────────────────────────────────────────────
// These dorks are NOT about finding vulnerabilities on a specific domain.
// They help you research the TARGET COMPANY / ORGANISATION itself — employees,
// tech stack, acquisitions, leaked credentials, and more.
// Template tokens: {org} = company/org name (e.g. "acme"), {domain} = full domain.

export interface TargetReconGroup {
  id: string;
  name: string;
  description: string;
  /** Placeholder label shown in the input — "company name", "domain", etc. */
  inputHint: string;
  dorks: Dork[];
}

export const TARGET_RECON_GROUPS: TargetReconGroup[] = [
  {
    id: "recon-company",
    name: "Company & Brand OSINT",
    description: "General information about the company — news, filings, acquisitions, subsidiaries.",
    inputHint: "company name or domain",
    dorks: [
      { query: "\"{org}\" site:linkedin.com/company", what: "Official LinkedIn company page — employee count, tech used", severity: "info" },
      { query: "\"{org}\" site:crunchbase.com", what: "Funding rounds, acquisitions, tech stack from Crunchbase", severity: "info" },
      { query: "\"{org}\" acquisition | merger | subsidiary filetype:pdf", what: "M&A documents — reveals hidden scope (acquired companies)", severity: "info" },
      { query: "\"{org}\" \"press release\" | \"annual report\" | \"10-K\" site:sec.gov | site:prnewswire.com", what: "SEC filings / press releases revealing infra, products, vendors", severity: "info" },
      { query: "\"{org}\" \"responsible disclosure\" | \"security.txt\" | \"bug bounty\"", what: "Existing bug bounty program and scope hints", severity: "info" },
      { query: "\"{org}\" intext:\"terms of service\" | intext:\"privacy policy\" site:{domain}", what: "Legal pages mentioning sub-products, third-party integrations", severity: "info" },
      { query: "site:opencorporates.com \"{org}\"", what: "Registered subsidiaries and related legal entities", severity: "info" },
    ],
  },
  {
    id: "recon-employees",
    name: "Employee & Email Enumeration",
    description: "Find employees, emails, and social accounts to map the attack surface.",
    inputHint: "company name or domain",
    dorks: [
      { query: "site:linkedin.com/in \"{org}\" \"security\" | \"devops\" | \"infrastructure\" | \"engineer\"", what: "Tech employees — reveals stack, cloud provider, tools used", severity: "info" },
      { query: "\"{domain}\" site:hunter.io | site:phonebook.cz | site:emailformat.com", what: "Email pattern discovery tools indexed", severity: "info" },
      { query: "\"@{domain}\" site:pastebin.com | site:paste.ee | site:ghostbin.com", what: "Employee emails in pastes (credential dumps)", severity: "high" },
      { query: "\"@{domain}\" filetype:csv | filetype:xls | filetype:xlsx", what: "Spreadsheets with employee emails", severity: "high" },
      { query: "site:linkedin.com/in \"{org}\" \"former\" | \"ex-\" | \"previously\"", what: "Former employees — may have left with internal knowledge / repos", severity: "info" },
      { query: "\"{domain}\" \"resume\" | \"CV\" | \"curriculum vitae\" filetype:pdf", what: "Employee CVs mentioning internal tools / infra", severity: "medium" },
    ],
  },
  {
    id: "recon-techstack",
    name: "Tech Stack & Infrastructure",
    description: "Discover what technologies, cloud providers, and third-party services the target uses.",
    inputHint: "company name or domain",
    dorks: [
      { query: "site:stackshare.io \"{org}\"", what: "Public tech stack on StackShare (languages, frameworks, services)", severity: "info" },
      { query: "site:builtwith.com \"{domain}\"", what: "Technology fingerprint from BuiltWith", severity: "info" },
      { query: "site:wappalyzer.com \"{domain}\"", what: "Wappalyzer tech detection results", severity: "info" },
      { query: "\"{org}\" job listing \"AWS\" | \"Azure\" | \"GCP\" | \"Kubernetes\" | \"Terraform\"", what: "Job listings revealing cloud/infra stack (attack surface mapping)", severity: "info" },
      { query: "\"{org}\" job listing \"React\" | \"Django\" | \"Spring Boot\" | \"Laravel\" | \"Rails\"", what: "Job listings revealing backend/frontend frameworks", severity: "info" },
      { query: "site:github.com \"{org}\" README language:*", what: "Open source repos owned by org (tech stack + secret leak risk)", severity: "medium", engine: "github" },
      { query: "\"{domain}\" \"cdn-cgi\" | \"cloudflare\" | \"fastly\" | \"akamai\" | \"cloudfront\"", what: "CDN/WAF provider (helps plan bypass strategies)", severity: "info" },
    ],
  },
  {
    id: "recon-jobs",
    name: "Job Listings Intelligence",
    description: "Job postings reveal tech stack, security gaps, and internal project names.",
    inputHint: "company name",
    dorks: [
      { query: "site:linkedin.com/jobs \"{org}\" \"security\" | \"penetration\" | \"SOC\" | \"SIEM\"", what: "Security team size / maturity (are they hiring?)", severity: "info" },
      { query: "site:indeed.com | site:glassdoor.com \"{org}\" \"engineer\" | \"developer\"", what: "Job listings with tech stack details", severity: "info" },
      { query: "\"{org}\" site:jobs.lever.co | site:greenhouse.io | site:workday.com", what: "ATS job boards — may expose internal team names, projects", severity: "info" },
      { query: "\"{org}\" \"looking for\" \"pentest\" | \"red team\" | \"vulnerability\"", what: "Active security assessments planned (easier window to test)", severity: "info" },
      { query: "\"{org}\" \"remote\" \"devops\" | \"platform\" | \"cloud\" | \"SRE\"", what: "DevOps/SRE roles revealing infra tooling (Terraform, Helm, etc.)", severity: "info" },
    ],
  },
  {
    id: "recon-breach",
    name: "Breach & Credential Exposure",
    description: "Check if the org has appeared in known breach data or credential dumps.",
    inputHint: "company name or domain",
    dorks: [
      { query: "site:haveibeenpwned.com \"{domain}\"", what: "Check domain in HIBP breach database", severity: "high" },
      { query: "\"{domain}\" \"leaked\" | \"dump\" | \"breach\" site:pastebin.com | site:raidforums.com", what: "Credential dumps referencing the domain", severity: "critical" },
      { query: "site:dehashed.com \"{domain}\"", what: "DeHashed breach search for domain emails", severity: "high" },
      { query: "\"{domain}\" password site:github.com", what: "Passwords committed to GitHub repos with domain reference", severity: "critical", engine: "github" },
      { query: "\"{org}\" \"database leak\" | \"data breach\" | \"hacked\" -site:{domain}", what: "News/forum posts about past breaches of the org", severity: "high" },
      { query: "site:telegram.me | site:t.me \"{org}\" \"leak\" | \"dump\" | \"database\"", what: "Telegram channels selling/sharing org data", severity: "critical" },
    ],
  },
  {
    id: "recon-social",
    name: "Social Media & Forums",
    description: "Find the org's social presence, employee discussions, and internal info leaks on public forums.",
    inputHint: "company name or domain",
    dorks: [
      { query: "site:reddit.com \"{org}\" | \"{domain}\" \"internal\" | \"issue\" | \"outage\" | \"security\"", what: "Reddit posts about the org's infra or incidents", severity: "info" },
      { query: "site:twitter.com | site:x.com \"{domain}\" \"vulnerability\" | \"bug\" | \"breach\"", what: "Public tweets mentioning vulns or issues", severity: "medium" },
      { query: "site:stackoverflow.com | site:serverfault.com \"{domain}\"", what: "Dev questions exposing internal architecture, endpoints, tokens", severity: "medium" },
      { query: "site:medium.com | site:dev.to \"{org}\" \"how we built\" | \"our stack\" | \"postmortem\"", what: "Engineering blogs revealing internal infra and past incidents", severity: "info" },
      { query: "site:youtube.com \"{org}\" \"demo\" | \"webinar\" | \"how it works\"", what: "Product demos leaking UI, endpoints, internal tooling", severity: "low" },
      { query: "site:reddit.com \"{org}\" \"interview\" | \"offer\" | \"rejected\" site:reddit.com/r/cscareerquestions", what: "Interview posts revealing hiring tech stack and team info", severity: "info" },
    ],
  },
  {
    id: "recon-code",
    name: "GitHub / Code Repositories",
    description: "Find org's public repos, forks, and code mentioning the target.",
    inputHint: "company name or domain",
    dorks: [
      { query: "org:\"{org}\"", what: "All public repos owned by the org on GitHub", severity: "info", engine: "github" },
      { query: "\"{domain}\" language:Python | language:JavaScript | language:Go", what: "Code files mentioning the domain (hardcoded endpoints, keys)", severity: "high", engine: "github" },
      { query: "\"{org}\" filename:.env | filename:config.yml | filename:secrets.json", what: "Env/config files in any repo mentioning the org", severity: "critical", engine: "github" },
      { query: "\"{domain}\" \"TODO\" | \"FIXME\" | \"HACK\" | \"XXX\"", what: "Dev comments revealing unfinished security-critical code", severity: "medium", engine: "github" },
      { query: "\"{org}\" fork:true stars:0", what: "Low-visibility forks that may contain internal code", severity: "medium", engine: "github" },
      { query: "\"{domain}\" \"internal\" | \"private\" | \"do not publish\"", what: "Code marked private/internal that was accidentally pushed", severity: "high", engine: "github" },
    ],
  },
];

// ─── TARGET FINDER ────────────────────────────────────────────────────────────
// These dorks help you DISCOVER good hunting targets — websites that have
// bug bounty programs, VDPs, or high probability of containing bugs.
// Unlike DORK_GROUPS, these do NOT require a specific target domain.
// Optional token: {keyword} = sector / technology filter (e.g. "fintech", "healthcare")
// Leave input blank to get the generic version of each dork.

export interface TargetFinderGroup {
  id: string;
  name: string;
  description: string;
  emoji: string;
  dorks: Array<{
    query: string;
    what: string;
    severity: "critical" | "high" | "medium" | "low" | "info";
    engine?: DorkEngine;
    tip?: string; // extra hunting tip shown in UI
  }>;
}

export const TARGET_FINDER_GROUPS: TargetFinderGroup[] = [
  {
    id: "finder-securitytxt",
    name: "security.txt Programs",
    emoji: "📄",
    description: "Sites that publicly declare a bug bounty / responsible disclosure contact via security.txt — these are OPTED-IN targets.",
    dorks: [
      { query: "inurl:\"/.well-known/security.txt\" \"bug bounty\" | \"bounty\"", what: "Sites with security.txt advertising a bounty program", severity: "info", tip: "security.txt at /.well-known/security.txt is the RFC 9116 standard — these companies WANT reports." },
      { query: "inurl:\"/security.txt\" \"Contact:\" \"Expires:\"", what: "Properly formatted security.txt files indexed by Google", severity: "info" },
      { query: "inurl:\"security.txt\" \"Policy:\" \"https://hackerone.com\"", what: "Sites pointing their security.txt to HackerOne", severity: "info", tip: "Policy: field pointing to H1 means they have an active managed program." },
      { query: "inurl:\"security.txt\" \"Policy:\" \"https://bugcrowd.com\"", what: "Sites pointing security.txt to Bugcrowd", severity: "info" },
      { query: "inurl:\"security.txt\" \"Policy:\" \"https://intigriti.com\" | \"https://yeswehack.com\"", what: "European platforms (Intigriti / YesWeHack) programs", severity: "info" },
      { query: "filetype:txt \"Acknowledgments:\" \"Contact:\" \"Expires:\" inurl:security", what: "security.txt with acknowledgment page — active program with past payouts", severity: "info", tip: "If they have an Acknowledgments page, they've paid researchers before." },
      { query: "inurl:\"security.txt\" \"{keyword}\"", what: "security.txt files matching your sector/keyword", severity: "info" },
    ],
  },
  {
    id: "finder-bounty-pages",
    name: "Bug Bounty Pages on Sites",
    emoji: "🏆",
    description: "Companies that host their own bounty page on their domain — not always on H1/Bugcrowd.",
    dorks: [
      { query: "inurl:\"/security\" | inurl:\"/bug-bounty\" | inurl:\"/responsible-disclosure\" intext:\"reward\" | intext:\"bounty\"", what: "Self-hosted bug bounty pages with reward info", severity: "info" },
      { query: "intitle:\"Bug Bounty\" | intitle:\"Responsible Disclosure\" | intitle:\"Vulnerability Disclosure\" intext:\"report\" | intext:\"submit\"", what: "Dedicated bounty landing pages", severity: "info" },
      { query: "inurl:\"/security\" intext:\"Hall of Fame\" | intext:\"Acknowledgements\" | intext:\"Thank you\"", what: "Sites with HOF — confirmed active program with past reporters", severity: "info", tip: "Hall of Fame = real bugs get acknowledged. Higher chance they have undiscovered ones too." },
      { query: "intext:\"responsible disclosure\" intext:\"reward\" | intext:\"gift card\" | intext:\"swag\" -site:hackerone.com -site:bugcrowd.com", what: "Self-managed programs with rewards (often less competitive)", severity: "info" },
      { query: "intext:\"we do not offer monetary rewards\" intext:\"responsible disclosure\"", what: "VDP-only (no bounty) — less competition, easier to find bugs", severity: "info", tip: "VDPs have fewer hunters since no monetary reward — more bugs left unfound." },
      { query: "inurl:\"/security\" intext:\"scope\" intext:\"out of scope\" \"{keyword}\"", what: "Bounty pages in your keyword sector with scope defined", severity: "info" },
    ],
  },
  {
    id: "finder-platforms",
    name: "Platform Program Discovery",
    emoji: "🎯",
    description: "Find programs listed on major bug bounty platforms — filter by sector or tech stack.",
    dorks: [
      { query: "site:hackerone.com/programs \"{keyword}\"", what: "HackerOne programs matching keyword/sector", severity: "info", tip: "Add keywords like 'fintech', 'crypto', 'healthcare', 'saas' to filter." },
      { query: "site:bugcrowd.com/programs \"{keyword}\"", what: "Bugcrowd programs matching keyword", severity: "info" },
      { query: "site:intigriti.com/programs \"{keyword}\"", what: "Intigriti programs (European companies — less crowded)", severity: "info", tip: "Intigriti has many European targets with fewer hunters than H1/Bugcrowd." },
      { query: "site:yeswehack.com/programs \"{keyword}\"", what: "YesWeHack programs (French platform — less competition)", severity: "info" },
      { query: "site:federacy.com | site:openbugbounty.org \"{keyword}\"", what: "Smaller platforms — significantly less competition", severity: "info", tip: "OpenBugBounty lists VDPs across thousands of sites — mostly uncontested." },
      { query: "site:hackerone.com/programs intext:\"private\" | intext:\"invite only\"", what: "Private program references indexed — request invites", severity: "info" },
      { query: "site:hackenproof.com/programs \"{keyword}\"", what: "HackenProof programs (crypto / Web3 focused)", severity: "info" },
    ],
  },
  {
    id: "finder-vdp",
    name: "VDP — Gov & Edu Targets",
    emoji: "🏛️",
    description: "Government and university sites often run VDPs (no cash but legal protection). Less competition, more bugs.",
    dorks: [
      { query: "site:.gov intext:\"responsible disclosure\" | intext:\"vulnerability disclosure\" | intext:\"security.txt\"", what: "US government sites with disclosure programs", severity: "info", tip: "Govt sites have mandatory VDPs under CISA directive — legally safe to hunt." },
      { query: "site:.gov.uk | site:.gov.au | site:.gov.in intext:\"responsible disclosure\"", what: "UK / AU / IN government VDPs", severity: "info" },
      { query: "site:.edu intext:\"responsible disclosure\" | intext:\"bug bounty\" | inurl:security.txt", what: "University sites with disclosure programs", severity: "info", tip: "Universities often run old, unpatched software — high bug density." },
      { query: "site:hackerone.com/programs site:.gov | site:.mil", what: "US Federal / Military programs on HackerOne (H1 govt programs)", severity: "info" },
      { query: "intext:\"coordinated vulnerability disclosure\" site:.gov | site:.edu intext:\"contact\"", what: "CVD programs — government standard for responsible reporting", severity: "info" },
      { query: "inurl:\"/.well-known/security.txt\" site:.gov | site:.edu", what: "Govt/Edu sites with properly set-up security.txt", severity: "info" },
    ],
  },
  {
    id: "finder-highprob",
    name: "High Bug-Probability Targets",
    emoji: "🐛",
    description: "Sites showing signs of weak security hygiene — exposed panels, outdated software, misconfigured servers.",
    dorks: [
      { query: "inurl:wp-login.php -site:wordpress.com intitle:\"WordPress\" intext:\"Remember Me\"", what: "WordPress sites (check for CVE-prone outdated plugins)", severity: "medium", tip: "Find the WP version via /readme.html or /wp-admin/js/common.js, then check for unpatched CVEs." },
      { query: "intitle:\"Joomla!\" inurl:/administrator/index.php -site:joomla.org", what: "Joomla admin panels — often outdated", severity: "medium" },
      { query: "intitle:\"phpMyAdmin\" inurl:\"/phpmyadmin/\" -site:phpmyadmin.net", what: "Exposed phpMyAdmin instances (DB access, SQLi, auth bypass)", severity: "high", tip: "phpMyAdmin exposed = potential unauthenticated DB access or auth bypass CVEs." },
      { query: "intitle:\"Laravel\" intext:\"Whoops\" | intext:\"APP_DEBUG=true\" | intext:\"Stack trace\"", what: "Laravel apps in debug mode — route list, env vars exposed", severity: "high", tip: "Laravel debug = full stack trace with DB creds, .env contents, and internal paths." },
      { query: "inurl:\"/actuator/health\" | inurl:\"/actuator/env\" | inurl:\"/actuator/mappings\"", what: "Spring Boot Actuator exposed — internal config, heap dumps, routes", severity: "high" },
      { query: "intitle:\"Grafana\" inurl:\"/login\" -site:grafana.com | intitle:\"Kibana\" inurl:\":5601\"", what: "Exposed Grafana / Kibana dashboards (often default creds)", severity: "high" },
      { query: "inurl:\"/cgi-bin/\" inurl:admin | inurl:login | inurl:manage -site:github.com", what: "Legacy CGI admin interfaces (old tech = more bugs)", severity: "medium" },
      { query: "intitle:\"index of\" inurl:backup | inurl:old | inurl:archive -site:github.com -site:archive.org", what: "Open directory with backup/archive files (high value data)", severity: "high" },
    ],
  },
  {
    id: "finder-new-programs",
    name: "New & Low-Competition Programs",
    emoji: "🆕",
    description: "Recently launched programs or sectors with fewer hunters — higher chance of finding first bugs.",
    dorks: [
      { query: "\"we launched our bug bounty\" | \"starting our bug bounty\" | \"announcing our bug bounty\" site:medium.com | site:blog.*", what: "Companies announcing new programs (bugs not yet picked)", severity: "info", tip: "First week of a new program = highest bug density. Monitor these announcements." },
      { query: "site:hackerone.com \"program launched\" | \"just launched\" inurl:/reports", what: "HackerOne activity logs showing newly launched programs", severity: "info" },
      { query: "\"bug bounty\" site:twitter.com | site:x.com intext:\"launched\" | intext:\"new program\" after:2024-01-01", what: "Twitter/X announcements of new bug bounty programs", severity: "info" },
      { query: "site:intigriti.com/programs \"new\" | \"launching\"", what: "New Intigriti programs (European — lower competition)", severity: "info" },
      { query: "intext:\"bug bounty\" intext:\"$50\" | intext:\"$100\" | intext:\"up to $500\" -site:hackerone.com -site:bugcrowd.com", what: "Small self-managed programs with low payouts = almost no hunters", severity: "info", tip: "Low payout = less competition. A $50 XSS is still a valid finding and builds your reputation." },
      { query: "\"responsible disclosure\" intext:\"first\" | intext:\"initial\" intext:\"report\" site:medium.com | site:blog.*", what: "Companies writing about receiving their first vuln report = new program", severity: "info" },
    ],
  },
  {
    id: "finder-sector",
    name: "Sector-Specific Programs",
    emoji: "🏢",
    description: "Target a specific industry vertical — fintech, crypto, SaaS, healthcare — to specialize your hunting.",
    dorks: [
      { query: "site:hackerone.com/programs \"{keyword}\" intext:\"$\" | intext:\"bounty\"", what: "HackerOne programs in your target sector with payouts", severity: "info" },
      { query: "intext:\"bug bounty\" | intext:\"responsible disclosure\" site:.io \"{keyword}\"", what: "SaaS / startup .io domains in your sector (often newer, fewer hunters)", severity: "info", tip: ".io startups often have younger codebases with more injection/auth bugs." },
      { query: "intext:\"security.txt\" | intext:\"responsible disclosure\" \"{keyword}\" intext:\"fintech\" | intext:\"crypto\" | intext:\"blockchain\"", what: "Fintech / crypto sector programs (higher bounties)", severity: "info" },
      { query: "\"{keyword}\" intext:\"bug bounty\" site:linkedin.com/company", what: "LinkedIn company pages in sector mentioning bug bounty program", severity: "info" },
      { query: "intext:\"hall of fame\" | intext:\"acknowledgements\" \"{keyword}\" -site:hackerone.com -site:bugcrowd.com", what: "Self-hosted HOF pages in your sector — confirmed active programs", severity: "info" },
      { query: "\"{keyword}\" site:openbugbounty.org", what: "OpenBugBounty sector listings — no signup needed, report directly", severity: "info", tip: "OpenBugBounty = instant submission, no invitation needed. Good for beginners." },
    ],
  },
];

/** Strip scheme/path/wildcard so "https://*.Example.com/x" -> "example.com". */
export function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/^\*\./, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "");
}

export function orgFromDomain(domain: string): string {
  const parts = domain.split(".");
  return parts.length >= 2 ? parts[parts.length - 2] : domain;
}

export function buildQuery(template: string, domain: string): string {
  return template.replace(/\{domain\}/g, domain).replace(/\{org\}/g, orgFromDomain(domain));
}

export function searchUrl(engine: DorkEngine = "google", query: string): string {
  const q = encodeURIComponent(query);
  switch (engine) {
    case "github":
      return `https://github.com/search?type=code&q=${q}`;
    case "shodan":
      return `https://www.shodan.io/search?query=${q}`;
    default:
      return `https://www.google.com/search?q=${q}`;
  }
}
