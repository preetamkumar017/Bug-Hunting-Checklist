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
