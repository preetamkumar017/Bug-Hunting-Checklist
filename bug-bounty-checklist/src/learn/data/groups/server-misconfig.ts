import type { LearnGroup } from "@/learn/data/types";

// Advanced, P3/P4-focused group: the "misconfigured surface" tier. Each leaf is
// scored off Bugcrowd VRT release 2026-07-08. Individually these are low/medium
// hygiene bugs — the craft is recognising which variant tips up (an exposed ADMIN
// portal is P1, not P3), and knowing which ones GATE other bugs: a missing rate
// limit turns a guess into a brute force, a WAF bypass unlocks the payloads the
// edge was dropping, a missing HttpOnly flag turns reflected XSS into session theft.
export const serverMisconfigGroup: LearnGroup = {
  id: "server-misconfig",
  name: "Server Security Misconfiguration",
  emoji: "⚙️",
  blurb:
    "The misconfigured server/app surface: exposed portals, absent rate limits, weak cookie/header hygiene, OAuth and DBMS misconfig, skipped password re-auth, broken CAPTCHA and WAF bypass. Each is P3/P4 alone — their value is that they stack and gate the P1/P2 bugs you hunt next.",
  topics: [
    {
      id: "exposed-portal",
      name: "Exposed Portal",
      emoji: "🚪",
      intro:
        "An authentication portal or management interface reachable from a sphere it was never meant to serve — an internal/staff login indexed on the public internet, a /admin panel with no network ACL, a vendor console (Jenkins, Grafana, Kibana, phpMyAdmin, Tomcat Manager, printer/IoT UIs) exposed to anonymous clients. The whole priority hinges on what the portal is: a non-admin portal (a plain user/login surface that still enforces auth) is P3, but an exposed ADMIN portal is P1 because it is a direct foothold into privileged functionality, and a portal that is genuinely protected (IP-allowlisted, mTLS, behind SSO that actually blocks you) is P5. The subtle findability is that these rarely appear in the main app's sitemap — they surface through certificate-transparency hostnames, non-standard ports, forgotten vhosts and default context paths, and a single wrong Host header can reveal one the front door hides.",
      howToFind: [
        {
          title: "Discover portals off the main sitemap",
          steps: [
            "Build the host list from CT logs + subfinder, then fingerprint everything live: httpx -title -status-code -tech-detect -favicon over the resolved hosts and non-standard ports.",
            "Favicon hashing is the fastest classifier — a known Jenkins/Grafana/phpMyAdmin favicon hash on an anonymous host is an exposed-console candidate before you even load the page.",
            "Fuzz default context paths on each live host (/admin, /manage, /console, /actuator, /_dashboard, /wp-admin, /jenkins, /grafana) and watch for a 200 login or an unauthenticated landing rather than a redirect to SSO.",
          ],
        },
        {
          title: "Classify admin vs non-admin vs protected",
          steps: [
            "Read the portal's own labelling and routes: does it offer administrative/management functions (user management, config, deploy, DB) → admin → P1 path, or is it an end-user login → non-admin → P3?",
            "Confirm it is actually reachable and NOT protected: a page that loads for an anonymous client is exposed; one that bounces you to an IP-allowlist block, mTLS prompt or enforced SSO is P5 — prove which by requesting it with no cookies from an external IP.",
            "Stop at the login boundary. Proving exposure is loading the portal and reading its role; do not attempt default creds or auth bypass unless the program's scope explicitly invites it — flag the exposure to the user first.",
          ],
        },
      ],
      payloads: [
        "httpx -l hosts.txt -title -status-code -tech-detect -favicon -json   (fingerprint every live host/port)",
        "curl -s -o /dev/null -w '%{http_code}' https://target/admin   (200 login vs 302-to-SSO vs 403 tells exposed from protected)",
        "ffuf -u https://target/FUZZ -w admin-panels.txt -mc 200,401   (default console context paths)",
        "curl -s https://target/actuator/env | head   (Spring Boot actuator left open = exposed management surface)",
      ],
      example:
        "CT logs revealed internal-ops.target.com; httpx flagged it with a Grafana favicon hash and a 200 anonymous landing. As a monitoring portal that still gated its data behind a login, it triaged P3 (non-admin exposed portal). A separate host served a Jenkins instance whose /script Groovy console loaded without auth — an administrative portal exposed to anonymous callers — which is the P1 variant and was flagged to the program owner immediately rather than exercised.",
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › Exposed Portal › Non-Admin Portal",
        bugcrowdPriority: "P3",
        bugcrowdCvss: "AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N",
        hackeroneCwe: "CWE-668: Exposure of Resource to Wrong Sphere",
        cvssSeverity: "Medium (non-admin) → Critical for an exposed admin portal",
        note:
          "Non-admin portal = P3 (AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N). An exposed ADMIN portal is P1 — a direct privileged foothold. A genuinely protected portal (IP allowlist / mTLS / enforced SSO) is P5. Priority follows what the portal exposes, not that it merely answered.",
      },
      checklistCategoryId: "recon-content",
      references: [
        { label: "httpx (ProjectDiscovery)", url: "https://github.com/projectdiscovery/httpx" },
        { label: "OWASP WSTG: Admin interfaces", url: "https://owasp.org/www-project-web-security-testing-guide/" },
      ],
    },
    {
      id: "no-rate-limiting",
      name: "No Rate Limiting on Form",
      emoji: "⏱️",
      intro:
        "A security-relevant endpoint that accepts unlimited high-rate requests from a single client because there is no throttle, lockout, or cost control. Bugcrowd scores the standalone misconfiguration at P4 across its variants — login (feeds credential stuffing / password spray), registration (mass/automated account creation), and the resource-burning SMS- and email-triggering forms (OTP, verification, reset, invite) that cost the target money and can harass third parties. The nuance is that it is almost never the headline itself; it is the enabler that converts an otherwise-safe guessing surface into a working attack — the same missing limit on a 6-digit OTP endpoint is the difference between a theoretical and a practical account takeover. Findability is a single burst, but the real test is bypass-awareness: many 'limits' key only on IP or only on the happy-path header, so rotating X-Forwarded-For, casing the path, or switching the request shape often walks straight through.",
      howToFind: [
        {
          title: "Measure the real limit and its key",
          steps: [
            "Send a controlled burst (Burp Intruder / a short ffuf loop) of identical requests and watch for 429, a lockout, a CAPTCHA appearing, or a silent tarpit — record the exact count at which enforcement kicks in, if ever.",
            "Identify what the limit keys on: same account different IP, same IP different account, authenticated vs anonymous — a per-account lockout still allows horizontal spray across many accounts.",
            "Prioritise the costly/sensitive forms: OTP/2FA verify, password-reset request, email/SMS send, login, registration — these are the P4 variants with real downstream impact.",
          ],
        },
        {
          title: "Probe common bypasses before concluding there IS a limit",
          steps: [
            "Rotate the client identity the server trusts: X-Forwarded-For / X-Real-IP / X-Client-IP spoofing, then fresh sessions/UA — many limiters count the spoofable header, not the connection.",
            "Mutate the request surface: trailing slash, case, encoded path, extra query param, HTTP/1.1 vs /2, or batching (GraphQL alias / JSON array) so N attempts ride one request the limiter counts as one.",
            "For OTP/reset specifically, compute feasibility: code length × validity window vs achievable rate — if the keyspace is exhaustible before expiry, note the brute-force-to-ATO chain explicitly for the user.",
          ],
        },
      ],
      payloads: [
        "ffuf -u https://target/api/login -X POST -d 'user=victim&pass=FUZZ' -w pins.txt -mc 200 -H 'Content-Type: application/x-www-form-urlencoded'   (rate/lockout probe — in-scope account only)",
        "for i in $(seq 1 50); do curl -s -o /dev/null -w '%{http_code}\\n' -X POST https://target/api/otp/verify -d 'code=000000'; done   (does 429 ever appear?)",
        "X-Forwarded-For: 127.0.0.1   (rotate per request — defeats IP-keyed limiters)",
        "curl -s -X POST https://target/api/reset -d 'email=you@yours.test'   (repeat: email-triggering form = resource burn / inbox flood on YOUR address)",
      ],
      example:
        "A 2FA verify endpoint accepted a 6-digit code with no attempt ceiling and no per-account lockout; a 50-request burst never produced a 429. On its own the missing limit triaged P4 (No Rate Limiting on Form › Login/authentication), but because the 10^6 keyspace was exhaustible inside the 10-minute code validity, it was written up as the enabling step of a complete 2FA-bypass account-takeover chain and flagged to the user before any report.",
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › No Rate Limiting on Form › Login/Authentication",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N",
        hackeroneCwe: "CWE-307: Improper Restriction of Excessive Authentication Attempts (and CWE-799: Improper Control of Interaction Frequency)",
        cvssSeverity: "Low standalone (→ High/Critical when it enables OTP/2FA brute force to account takeover)",
        note:
          "P4 across all variants — Login, Registration, SMS-Triggering and Email-Triggering forms. Low on its own; the escalation is as a gate: a missing limit on an exhaustible OTP/reset keyspace is the ATO enabler. SMS/email variants also carry a cost-abuse / third-party-harassment angle.",
      },
      checklistCategoryId: "auth-password",
      references: [
        { label: "OWASP WSTG: Testing for Weak Lockout Mechanism", url: "https://owasp.org/www-project-web-security-testing-guide/" },
        { label: "PortSwigger: Brute-force & rate limiting", url: "https://portswigger.net/web-security/authentication" },
      ],
    },
    {
      id: "missing-cookie-flags",
      name: "Missing Secure / HttpOnly Cookie Flag",
      emoji: "🍪",
      intro:
        "A session cookie set without the protective flags that keep it out of reach of the network and of JavaScript. Without Secure, the cookie is sent over any cleartext HTTP request to the domain, so an active network attacker (or a single HTTP asset / mixed-content request) can capture it; without HttpOnly, document.cookie exposes it to any script in the origin, so any XSS becomes session theft instead of a contained popup. Bugcrowd scores the session-token variant at P4 with high attack complexity — the flag is missing, but turning that into a stolen session needs an additional condition (a MITM position, or an XSS to read it). The whole point for an advanced hunter is the multiplier: this is the flag you check on every target because it silently upgrades the severity of a bug you find later. Non-session cookies (analytics, CSRF tokens that are validated server-side, UI prefs) missing the flags are typically P5 noise — classify the cookie before you report.",
      howToFind: [
        {
          title: "Audit the Set-Cookie attributes",
          steps: [
            "Capture every Set-Cookie on login and on authenticated navigation; for each, check for HttpOnly, Secure, SameSite and the Domain/Path scope.",
            "Classify the cookie: is it the actual session/auth token (present on authenticated requests, invalidated on logout), or a non-sensitive value? Only the session/auth variant is the P4 — the rest are usually P5.",
            "Confirm HttpOnly empirically with document.cookie in the console — if the session value is readable, the flag is genuinely absent (not just omitted from one response).",
          ],
        },
        {
          title: "Tie it to a delivery condition",
          steps: [
            "Missing Secure: show the cookie would ride a cleartext request — any plain-HTTP endpoint, an http:// asset, or an HSTS gap that allows an initial HTTP hit before redirect.",
            "Missing HttpOnly: pair it with the XSS surface — even a currently-unexploited reflection means that if XSS lands, it reads the live session; state that chain in the finding.",
            "Keep proof read-only: inspect your OWN session cookie in your own browser session; never capture another user's cookie to 'demonstrate' it.",
          ],
        },
      ],
      payloads: [
        "curl -sI https://app.target.com/login | grep -i set-cookie   (inspect HttpOnly / Secure / SameSite on the session cookie)",
        "document.cookie   // DevTools console: if the session token prints, HttpOnly is missing",
        "curl -sI http://app.target.com/   (does the app answer over cleartext at all? that's where a non-Secure cookie leaks)",
        "nuclei -u https://app.target.com -t http/misconfiguration/http-missing-security-headers.yaml   (cookie-flag + header hygiene sweep)",
      ],
      example:
        "The primary session cookie was issued as `Set-Cookie: SESSION=...; Path=/` with neither HttpOnly nor Secure. document.cookie returned the live token, confirming script reachability. Standalone it triaged P4 (Missing HTTPOnly on a session token, AC:H because exploitation needs a second condition). It became the quiet multiplier on the same program's later reflected-XSS finding: the missing HttpOnly turned a contained reflection into a full session-theft account takeover.",
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › Missing Secure or HTTPOnly Cookie Flag › Session Token",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N",
        hackeroneCwe: "CWE-614: Sensitive Cookie Without Secure Attribute (and CWE-1004: Sensitive Cookie Without HttpOnly Flag)",
        cvssSeverity: "Low (AC:H — needs MITM or XSS to realise)",
        note:
          "Session-token variant = P4. High attack complexity because stealing the cookie needs a second condition. The value is as a severity multiplier: missing HttpOnly upgrades any origin XSS to session theft; missing Secure leaks it over cleartext. Non-session cookies missing the flags are generally P5.",
      },
      checklistCategoryId: "auth-session",
      references: [
        { label: "OWASP: Secure Cookie Attribute", url: "https://owasp.org/www-community/controls/SecureCookieAttribute" },
        { label: "MDN: Set-Cookie", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie" },
      ],
    },
    {
      id: "security-headers",
      name: "Missing / Weak Security Headers",
      emoji: "🧱",
      intro:
        "Response-header defenses that are absent or toothless. Bugcrowd is deliberately stingy here: the one header variant that reaches P4 is a missing/weak Cache-Control on a SENSITIVE page — a page whose response (account details, tokens in the body, PII) gets cached by a shared proxy or the browser's back/forward and disk cache, so it is retrievable later on a shared or compromised machine. The broader hygiene set — Content-Security-Policy, HSTS, X-Frame-Options/frame-ancestors, X-Content-Type-Options — is P5 on its own, because a missing header is a weakened mitigation, not an exploit. The advanced read is to treat the P5 ones as escalation ENABLERS and report them attached to the bug they unlock: no X-Frame-Options/frame-ancestors is what makes a clickjacking POC possible, a weak CSP is what lets an injected script actually run and exfiltrate, no HSTS is what keeps the non-Secure cookie leakable. Findability is one header dump — the skill is knowing which absence matters and against which page.",
      howToFind: [
        {
          title: "Find a cacheable sensitive response (the P4)",
          steps: [
            "Locate authenticated pages that return sensitive data in the body (account/profile, invoices, API responses with tokens/PII).",
            "Check their Cache-Control / Pragma / Expires: anything other than no-store (e.g. missing, public, or max-age>0) on such a page is the P4 — the sensitive body can land in a shared/proxy cache or browser disk cache.",
            "Demonstrate retrievability safely: after loading the sensitive page, use the browser Back button or inspect the disk cache to show the response is served again without re-authentication — on your own session only.",
          ],
        },
        {
          title: "Inventory the P5 headers as escalation enablers",
          steps: [
            "Dump the full header set with nuclei's missing-security-headers template or a curl -I, and record which of CSP, HSTS, X-Frame-Options/frame-ancestors, X-Content-Type-Options, Referrer-Policy are absent or weak.",
            "For each gap, note the specific bug it unlocks rather than reporting it bare: no frame-ancestors → clickjacking POC viable; permissive CSP (unsafe-inline / wildcard) → injected script executes; no HSTS → cleartext downgrade keeps non-Secure cookies in play.",
            "Report the P5 header only bundled with the realised bug it enables — a standalone 'CSP missing' is informational and burns signal.",
          ],
        },
      ],
      payloads: [
        "curl -sI https://app.target.com/account | grep -iE 'cache-control|pragma|expires'   (sensitive page cached? missing no-store = P4)",
        "nuclei -u https://app.target.com -t http/misconfiguration/http-missing-security-headers.yaml   (full hygiene inventory)",
        "curl -sI https://app.target.com/ | grep -iE 'content-security-policy|strict-transport-security|x-frame-options|x-content-type-options'",
        "securityheaders.com style check via: curl -sI https://app.target.com/ | sort   (eyeball the whole set at once)",
      ],
      example:
        "The /account/billing page returned full card-last4 and address data with `Cache-Control: private, max-age=600` instead of no-store. On a shared kiosk the hunter showed the page re-rendered from disk cache via the Back button after logout — a sensitive-page cache-control weakness, P4. The same host's missing frame-ancestors/X-Frame-Options was NOT filed alone; it was carried into a separate clickjacking report where the missing header was the precondition that made the POC frame load.",
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › Lack of Security Headers › Cache-Control for a Sensitive Page",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N",
        hackeroneCwe: "CWE-693: Protection Mechanism Failure",
        cvssSeverity: "Low (sensitive-page Cache-Control); other headers Informational",
        note:
          "Only the Cache-Control-on-a-sensitive-page variant is P4. Missing CSP, HSTS, X-Frame-Options and X-Content-Type-Options are P5 standalone — report them attached to the concrete bug they enable (clickjacking, CSP-defeated XSS exfil, cleartext downgrade), not on their own.",
      },
      checklistCategoryId: "client-storage",
      references: [
        { label: "OWASP Secure Headers Project", url: "https://owasp.org/www-project-secure-headers/" },
        { label: "MDN: Cache-Control", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control" },
      ],
    },
    {
      id: "oauth-account-squatting",
      name: "OAuth Misconfiguration — Account Squatting",
      emoji: "🪪",
      intro:
        "A pre-registration / identity-binding flaw in a 'Sign in with <provider>' implementation where an attacker can create or occupy an account tied to a victim's identifier (usually an email) before the victim ever arrives. The mechanism: the app provisions an account keyed on the email returned by the IdP without proving control of that email, or it links a social login to an existing local account purely on matching email, or it lets a federated signup pre-claim an address that the real owner later signs up for — so the victim ends up logging into an account the attacker already shares or seeded. Bugcrowd scores the squatting variant P4 (UI:R, AC:H — it needs the victim to eventually sign in and a specific unverified-binding condition). The escalation edge is the one to watch: when the pre-claimed/shared account survives the victim's own signup and retains attacker access to the victim's data, it crosses into pre-account-takeover, which is scored far higher. The subtle finding is the missing email-verification step between IdP assertion and local account creation/linking.",
      howToFind: [
        {
          title: "Map how identities are bound",
          steps: [
            "Enumerate the account-creation paths: local email+password signup, OAuth/OIDC signup, and OAuth-link-to-existing — then test the order dependency (local-first-then-social vs social-first-then-local).",
            "For each, check whether the app ever proves control of the email it keys on: does social login auto-link to a local account with the same email with no verification, and does it trust an unverified `email` claim from the IdP?",
            "Test the pre-claim: register (or start OAuth signup for) an address you do NOT own but the target might, and see whether the app creates/holds the account without emailing a verification step.",
          ],
        },
        {
          title: "Prove benignly with two accounts you control",
          steps: [
            "Use two identities you own (attacker account + a 'victim' email you also control) — never a real user's address — to demonstrate the binding: attacker pre-claims, victim later signs in via the provider, both reach the same account.",
            "Distinguish squatting (P4 — you share/occupy an account, victim is inconvenienced) from pre-ATO (higher — after the victim completes signup the attacker still reads/controls the victim's data); capture which boundary you crossed.",
            "Keep it read-only on the victim side: show the shared-access fact, don't exfiltrate data; flag the pre-ATO escalation to the user before drafting anything.",
          ],
        },
      ],
      payloads: [
        "# 1) Attacker signs up via 'Login with Google' using victim@yourdomain.test (an address YOU control)",
        "# 2) 'Victim' later registers locally / via a different IdP with the SAME email",
        "# 3) Observe whether both land in one account with no email-verification gate = account squatting",
        "curl -s https://app.target.com/api/auth/callback?code=...   (inspect whether linking keys on an UNVERIFIED email claim)",
        "# Compare signup order: local-first-then-social vs social-first-then-local — the vulnerable path is the one that skips verification",
      ],
      example:
        "The app linked any 'Sign in with Google' to an existing local account whenever the Google `email` matched, with no re-verification. Using two addresses the hunter owned, an attacker-seeded local account for victim@lab.test was silently joined when the 'victim' first used Google SSO — both sessions reached one account: account squatting, P4 (UI:R, AC:H). Because the attacker's session persisted and could read data the victim added afterward, it was escalated and written up as a pre-account-takeover and flagged to the program before reporting.",
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › OAuth Misconfiguration › Account Squatting",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:N/A:N",
        hackeroneCwe: "CWE-287: Improper Authentication (and CWE-290: Authentication Bypass by Spoofing)",
        cvssSeverity: "Low standalone (→ High/Critical when it becomes pre-account-takeover)",
        note:
          "Account Squatting = P4 (UI:R, AC:H — needs the victim to sign in and an unverified-binding condition). Escalates to pre-account-takeover when the attacker retains access to the victim's account/data after the victim completes signup — score follows the retained access, not the squat.",
      },
      checklistCategoryId: "auth-oauth",
      references: [
        { label: "PortSwigger: OAuth 2.0 authentication vulnerabilities", url: "https://portswigger.net/web-security/oauth" },
        { label: "Microsoft/OWASP: Pre-account-takeover patterns", url: "https://owasp.org/www-project-web-security-testing-guide/" },
      ],
    },
    {
      id: "dbms-misconfiguration",
      name: "DBMS Misconfiguration",
      emoji: "🗄️",
      intro:
        "The database tier left with a weakened security posture that an authenticated or already-foothold-holding party can observe and leverage — most pointedly, an application (or lower-privilege) DB account that runs as DBA / superuser or carries far more privilege than its function needs. Bugcrowd scores the excessively-privileged-user / DBA variant P4 with PR:H and AC:H, because realising it presupposes you already reached the database context (an injection point, a leaked connection string, an exposed admin console). But that is exactly why it matters to an advanced hunter: it is the privilege-escalation lever that turns a merely-interesting SQL injection into file read/write (INTO OUTFILE, lo_import/COPY), command execution (xp_cmdshell, PL/perlu), and reads across every database on the instance. The subtle findable condition is the gap between what the app account CAN do and what it NEEDS to — a web app whose DB user is `root@%`, `sa`, or a Postgres superuser is the misconfiguration, independent of how you reached it. Exposed unauthenticated DB ports and default creds are the adjacent, higher-impact cousins — note them, but the leaf here is the over-privilege.",
      howToFind: [
        {
          title: "Enumerate the DB account's privilege (from an authorised context)",
          steps: [
            "When you already hold a DB context the program authorises you to use (your own injection POC, a sanctioned credential), ask the engine who you are and what you can do — read-only metadata queries, not data theft.",
            "MySQL: SELECT current_user(), @@hostname; SHOW GRANTS; — an app user with ALL PRIVILEGES ... WITH GRANT or FILE is over-privileged. Postgres: SELECT current_user, usesuper FROM pg_user WHERE usename=current_user; — usesuper = t is DBA.",
            "MSSQL: SELECT IS_SRVROLEMEMBER('sysadmin'), SYSTEM_USER; — membership in sysadmin from an app login is the misconfiguration.",
          ],
        },
        {
          title: "Spot the exposed/default-auth cousins during recon",
          steps: [
            "Port-scan for database services that should never face you: 3306/5432/1433/27017/6379/9200 — a database reachable from the internet is a recon-ports finding in its own right.",
            "Fingerprint without authenticating where possible (nmap service scripts banner the version/engine); note default or blank credentials as a separate, higher-severity issue rather than logging in and ranging around.",
            "Tie the over-privilege to a concrete escalation in the report: with FILE/superuser, a SQLi goes from data read to file write / RCE — state the lever, prove it with a single benign check (e.g. can you SELECT a non-sensitive server variable), and stop.",
          ],
        },
      ],
      payloads: [
        "SHOW GRANTS FOR CURRENT_USER();   -- MySQL: ALL PRIVILEGES / FILE / GRANT OPTION on an app user = over-privileged",
        "SELECT current_user, usesuper, usecreatedb FROM pg_user WHERE usename = current_user;   -- Postgres: usesuper='t' = DBA",
        "SELECT IS_SRVROLEMEMBER('sysadmin') AS is_sa, SYSTEM_USER;   -- MSSQL: 1 = app login is sysadmin",
        "nmap -sV -Pn -p 3306,5432,1433,27017,6379,9200 target   (database services that should not be internet-facing)",
      ],
      example:
        "A blind SQL injection the program had already accepted was re-examined for privilege: SHOW GRANTS for the app user returned `GRANT ALL PRIVILEGES ON *.* ... WITH GRANT OPTION`, including FILE. The over-privilege itself triaged P4 (DBMS Misconfiguration › Excessively Privileged User/DBA, PR:H/AC:H — it needs the existing DB context). Its real worth was as the escalation note on the injection: FILE privilege meant the SQLi could write a web shell, lifting that report's impact from data read toward RCE.",
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › Database Management System (DBMS) Misconfiguration › Excessively Privileged User / DBA",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:H/PR:H/UI:N/S:U/C:L/I:L/A:N",
        hackeroneCwe: "CWE-250: Execution with Unnecessary Privileges (and CWE-269: Improper Privilege Management)",
        cvssSeverity: "Low (PR:H/AC:H — presupposes an existing DB context)",
        note:
          "Excessively-privileged app/DB user (DBA/superuser) = P4. PR:H and AC:H because you must already hold a DB context to observe it. The lever matters: FILE/superuser turns an accepted SQLi into file write / RCE. Internet-exposed DB ports and default creds are separate, higher-severity issues — flag, don't exploit.",
      },
      checklistCategoryId: "recon-ports",
      references: [
        { label: "OWASP: Database Security Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html" },
        { label: "PortSwigger: SQL injection", url: "https://portswigger.net/web-security/sql-injection" },
      ],
    },
    {
      id: "lack-of-password-confirmation",
      name: "Lack of Password Confirmation",
      emoji: "🔑",
      intro:
        "A high-value, irreversible state change that executes without re-asking for the current password (or an equivalent step-up such as re-auth / fresh 2FA). Bugcrowd grades strictly by consequence: skipping password confirmation on DELETE ACCOUNT is the P4 leaf, because the action is destructive and irreversible, whereas the same omission on change-email, change-password, or 2FA-management is P5 (those are recoverable or less severe on their own). Why it matters to an advanced hunter: a missing re-auth gate is the amplifier that converts a lower-severity session-adjacent bug into real damage — a one-click CSRF, a reflected/stored XSS, or a stolen-but-expired-session replay all become account destruction when the sensitive endpoint never demanded the password the attacker doesn't have. The subtle finding is confirming that the password field in the UI is cosmetic — that the backend accepts the state change when the confirmation value is absent, blank, or wrong — rather than assuming the client-side prompt is enforced.",
      howToFind: [
        {
          title: "Test whether the backend actually enforces re-auth",
          steps: [
            "Drive the sensitive action (account deletion) in the UI and capture the request; then replay it in Burp with the password/confirmation field removed, emptied, or set to a wrong value.",
            "A 200 / success with no valid current password proves the confirmation is cosmetic — the server never checks it. Do this on your OWN test account only, since the action is destructive.",
            "Check the step-up equivalents too: does a sensitive change accept a stale session, or skip the fresh-2FA prompt the UI implies? Absence of any server-side step-up is the core finding.",
          ],
        },
        {
          title: "Rank the action and look for the chain",
          steps: [
            "Classify the endpoint by VRT: delete-account → P4; change-email / change-password / disable-2FA → P5 standalone — report accordingly, don't over-claim.",
            "Probe CSRF-ability of the unprotected sensitive action: no CSRF token + no re-auth on account deletion is a one-request destructive CSRF — a materially stronger finding than the missing confirmation alone.",
            "Pair with any XSS or session-fixation surface: a sensitive endpoint that needs no password is where those bugs cash out — note the chain explicitly and flag to the user.",
          ],
        },
      ],
      payloads: [
        "# Capture the real 'delete account' request, then replay without the confirmation field:",
        "curl -s -X POST https://app.target.com/account/delete -H 'Cookie: SESSION=<your-own>' -d ''   (no current_password sent — does it still succeed?)",
        "curl -s -X POST https://app.target.com/account/delete -H 'Cookie: SESSION=<your-own>' -d 'current_password=wrong'   (wrong value accepted = cosmetic check)",
        "# CSRF probe: does the same endpoint accept a cross-site form POST with no token and no re-auth? (destructive — own account only)",
      ],
      example:
        "The account-settings UI showed a 'confirm your password to delete' modal, but replaying the DELETE /account request on a throwaway test account with the current_password field removed returned 200 and destroyed the account — the confirmation was purely client-side. That is the P4 delete-account variant. It was further strengthened by noting the same endpoint carried no CSRF token, making it a one-click destructive CSRF; the chain was flagged to the user before any write-up.",
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › Lack of Password Confirmation › Delete Account",
        bugcrowdPriority: "P4",
        hackeroneCwe: "CWE-620: Unverified Password Change",
        cvssSeverity: "Low (delete-account); other variants Informational",
        note:
          "Delete-account without password confirmation = P4 (destructive, irreversible). Change-email / change-password / 2FA-management variants are P5 standalone. Severity jumps when the unprotected sensitive action is also CSRF-able or reachable via XSS — then it is the cash-out for those bugs.",
      },
      checklistCategoryId: "access-privesc",
      references: [
        { label: "OWASP: Re-authentication for sensitive operations", url: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html" },
        { label: "PortSwigger: CSRF", url: "https://portswigger.net/web-security/csrf" },
      ],
    },
    {
      id: "captcha-implementation",
      name: "CAPTCHA Implementation Vulnerability",
      emoji: "🤖",
      intro:
        "A CAPTCHA that is present but implemented so that its anti-automation guarantee can be defeated without actually solving the challenge — the control exists, so it is not the 'missing CAPTCHA' case, but a logic flaw lets a script sail past it. Classic implementations: the server validates the token only on the first request and then caches/reuses it, so one solved token replays indefinitely; the token is validated client-side only, or the success flag is a tamperable field; the answer is returned to the client (in a header, cookie, or hidden field) or is static/guessable; or simply removing the CAPTCHA parameter from the request skips validation entirely. Bugcrowd scores this implementation-vulnerability leaf P4 with an availability-only CVSS (A:L — it enables automated abuse, hence the resource/availability angle), while a CAPTCHA that is merely absent, or only weak against automated brute force, is P5. The point for an advanced hunter is the same as rate-limiting: a broken CAPTCHA re-opens whichever automation-gated attack it was protecting (spray, enumeration, mass-signup, resource burn).",
      howToFind: [
        {
          title: "Attack token lifecycle and binding",
          steps: [
            "Solve the CAPTCHA once legitimately, capture the token, then replay the protected request with the SAME token repeatedly — if it is accepted more than once, the server isn't invalidating it (token reuse).",
            "Try omitting the CAPTCHA field entirely, blanking it, or sending a well-formed-but-fake value — a request that still succeeds means validation is optional or client-side only.",
            "Check whether the challenge/answer leaks to the client: inspect responses, cookies and hidden fields for the expected value, and test whether a static answer always validates (guessable/static CAPTCHA).",
          ],
        },
        {
          title: "Confirm the automation it re-opens",
          steps: [
            "Once you have a bypass primitive (reusable token / skippable field), show it defeats the automation the CAPTCHA guarded: run a small scripted burst against the gated form and confirm it is no longer throttled by the challenge.",
            "Keep it benign and in-scope: a handful of requests to prove the gate is bypassable, against your own account / test data — not a full attack.",
            "Tie the write-up to the downstream variant it unlocks (login spray, registration flood, OTP/email burn) — that is what makes the P4 worth triaging rather than cosmetic.",
          ],
        },
      ],
      payloads: [
        "# 1) Solve once, capture g-recaptcha-response / h-captcha-response token",
        "for i in $(seq 1 10); do curl -s -o /dev/null -w '%{http_code}\\n' -X POST https://target/login -d 'user=you&pass=x&captcha=<SAME_TOKEN>'; done   (reuse = broken invalidation)",
        "curl -s -X POST https://target/login -d 'user=you&pass=x'   (CAPTCHA param omitted entirely — still 200?)",
        "curl -s -X POST https://target/login -d 'user=you&pass=x&captcha=fake'   (fake value accepted = client-side-only validation)",
      ],
      example:
        "A login form fronted by reCAPTCHA validated the response token but never invalidated it server-side; one solved token, captured once, was replayed on 200+ login attempts without a fresh challenge. That is the P4 CAPTCHA implementation-vulnerability leaf (A:L — it re-enables automation). Its real impact was reported as the enabler of credential-stuffing against the login endpoint, which the CAPTCHA had been the only control preventing.",
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › CAPTCHA › Implementation Vulnerability",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:N/A:L",
        hackeroneCwe: "CWE-804: Guessable CAPTCHA",
        cvssSeverity: "Low (A:L — re-enables automated abuse)",
        note:
          "A defeatable-but-present CAPTCHA (token reuse / client-side-only / skippable param / guessable answer) = P4. A simply missing CAPTCHA, or one only weak against brute force, is P5. Value is as an automation re-enabler — it reopens the spray/enumeration/flood the CAPTCHA was gating.",
      },
      checklistCategoryId: "auth-password",
      references: [
        { label: "OWASP WSTG: Testing for CAPTCHA", url: "https://owasp.org/www-project-web-security-testing-guide/" },
        { label: "PortSwigger: Bypassing anti-automation", url: "https://portswigger.net/web-security/authentication" },
      ],
    },
    {
      id: "waf-bypass",
      name: "WAF Bypass — Direct Server Access",
      emoji: "🛡️",
      intro:
        "The protective edge (a cloud WAF/CDN such as Cloudflare, Akamai, AWS WAF, Imperva) can be sidestepped by talking to the origin server directly, so every filtering, rate-limiting and bot-management rule the edge enforces simply never runs. The core finding is reaching the origin's real IP and sending it requests the WAF would have blocked — because the origin accepts connections from anywhere, not only from the CDN's ranges. Bugcrowd scores the direct-server-access variant P4 with an availability-only CVSS (A:L — the bypass itself exposes the origin to the abuse the WAF was absorbing), but for an advanced hunter it is a force-multiplier of the first order: once you hit origin, the SQLi/XSS/SSRF/path payloads the edge was scrubbing go through unfiltered, and the rate limits that throttled your enumeration vanish. The subtle, very current finding is origin-IP discovery — CDNs hide the IP, but it leaks through certificate transparency (a cert issued before the site moved behind the CDN), historical/passive DNS, SSRF/error-message IP leaks, misconfigured subdomains (mail/dev/staging on the same box), and SNI/Host-header quirks where the origin answers for the protected host directly.",
      howToFind: [
        {
          title: "Discover the real origin IP",
          steps: [
            "Mine certificate transparency for the apex/SANs (crt.sh) and compare against the CDN edge IPs — a cert on a non-CDN IP, or a historical cert, often points at origin.",
            "Pull passive/historical DNS (SecurityTrails, DNS history, wayback) for A records that predate the CDN move, and check sibling hostnames (mail., dev., staging., direct., origin.) that frequently resolve straight to the box.",
            "Harvest IP leaks from the app itself: SSRF responses, verbose error pages, email headers (Received:), and status/debug endpoints that echo an internal/public origin address.",
          ],
        },
        {
          title: "Confirm the origin answers for the protected host, bypassing the edge",
          steps: [
            "Request the site from the candidate IP while forcing the real hostname: curl --resolve host:443:<origin-ip> or an explicit Host header — a matching 200 for the real app content means the origin serves it directly.",
            "Prove the WAF is actually out of the path with a single BENIGN marker the edge is known to block (e.g. a harmless ?x=<script> or a test rule trigger) — it is blocked through the CDN hostname but passes when sent to the origin IP. Use a safe canary, never a live exploit payload, as proof.",
            "Note SNI/Host tricks and default-vhost behaviour: some origins answer the protected host over a mismatched SNI or as the default vhost — document the exact request that reaches origin, and flag the chain (now-unfiltered injection surface) to the user.",
          ],
        },
      ],
      payloads: [
        "curl -s 'https://crt.sh/?q=%25.target.com&output=json' | jq -r '.[].name_value' | sort -u   (CT names → origin candidates)",
        "curl -s --resolve app.target.com:443:<ORIGIN_IP> https://app.target.com/ -I   (does the origin serve the real host directly, bypassing the edge?)",
        "curl -s -H 'Host: app.target.com' https://<ORIGIN_IP>/   (Host-header direct hit)",
        "curl -s 'https://app.target.com/?x=<benign-canary>' -I   (blocked at edge) vs the same sent to <ORIGIN_IP>   (passes = WAF out of path)",
      ],
      example:
        "The app sat behind Cloudflare, but crt.sh held a certificate issued on a bare DigitalOcean IP before the migration; curl --resolve to that IP with the real Host returned the live application. A benign canary query that Cloudflare's managed ruleset blocked on the edge hostname passed cleanly when sent straight to the origin — direct server access past the WAF, P4 (A:L). It was reported as the multiplier that re-exposed a previously edge-blocked injection parameter to unfiltered testing, and flagged to the user as a chain rather than a standalone.",
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › Web Application Firewall (WAF) Bypass › Direct Server Access",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:N/A:L",
        hackeroneCwe: "CWE-693: Protection Mechanism Failure",
        cvssSeverity: "Low (A:L) standalone — materially higher as an enabler of edge-filtered injection/rate-limit bypass",
        note:
          "Direct-server-access WAF bypass = P4. The standalone score is availability-only, but the real value is as a multiplier: hitting origin re-opens the SQLi/XSS/SSRF/path payloads and the enumeration rate the edge was blocking. Prove it with a benign canary the edge drops, never a live exploit payload.",
      },
      checklistCategoryId: "recon-tech",
      references: [
        { label: "crt.sh (certificate transparency)", url: "https://crt.sh/" },
        { label: "CloudFlair / origin-IP discovery techniques", url: "https://github.com/christophetd/CloudFlair" },
      ],
    },
  ],
};
