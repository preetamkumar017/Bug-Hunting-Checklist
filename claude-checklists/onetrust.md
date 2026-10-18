# Claude Autonomous Checklist — OneTrust

Tasks Claude can run on this target **without needing the user to run or
paste anything**, given `scope.md` allows it. See `/CLAUDE.md` at the
workspace root for status legend and update protocol.

Single in-scope host: `https://pentest-app.onetrust.com/`. No org-wide
domain scope, so most classic subdomain/ASN recon is N/A here — see notes
under each item.

## Recon (passive + active)

- [-] Subdomain enumeration (subfinder/amass/crt.sh/assetfinder) — N/A, only
  one fixed in-scope host, all other `*.onetrust.com` subdomains explicitly
  out of scope
- [x] Live host detection + tech fingerprint (httpx) — live, HTTP/2 200. Behind
  Cloudflare (Turnstile). Angular SPA (micro-frontend, `<mfe-root>`), uses
  `angular-oauth2-oidc` for auth. Strong security headers present (CSP, HSTS,
  X-Frame-Options, X-Content-Type-Options, Permissions-Policy) — not
  reportable per scope but noted for context. See testing-log 2026-09-19.
- [-] Subdomain takeover check (dangling CNAMEs) — N/A, no subdomain scope
- [-] Port scanning / service enumeration (nmap/naabu) — out of scope: "open
  ports without an accompanying PoC" is explicitly excluded from rewards
- [-] DNS enumeration (SPF/DKIM/DMARC/AXFR/DNSSEC/CAA/wildcard) — SPF/DKIM/DMARC
  findings explicitly out of scope; no wildcard/org scope given
- [-] ASN/IP range discovery — N/A, not an org-wide IP scope program

## Content Discovery

- [ ] URL/endpoint gathering (katana/gau/waybackurls) — on pentest-app.onetrust.com
- [x] Directory/file brute-force (small manual list, no ffuf run) — probed
  robots.txt, sitemap.xml, .well-known/security.txt, app-config.json,
  runtime-config.json, version.json, .git/config, .env, favicon.ico. All
  "200" hits are the Angular SPA's catch-all fallback (serves index.html
  for any unknown path) — **not real files**, false positive avoided. No
  actual sensitive file exposure found. A real ffuf run with a bigger
  wordlist would need rate-limit awareness; not run given SPA catch-all
  makes status-code-based discovery unreliable here (need content-length/
  content-diffing based approach instead — left for later or a headless
  crawl).
- [x] JS file analysis (hidden endpoints, secrets, API keys, feature flags) —
  downloaded main/runtime bundles, grepped for keys/secrets/Bearer tokens.
  All "secret"/"Bearer" hits are `angular-oauth2-oidc` library internals
  (dummyClientSecret, token header plumbing), not leaked values. No sourcemap
  exposed. Only external endpoints referenced: my.onetrust.com and
  www.onetrust.com static pages (out of scope, non-sensitive). Clean so far
  — re-check other lazy-loaded chunks later if time permits.
- [ ] Parameter discovery (arjun/paramspider)

## Vulnerability Scanning

- [ ] Known CVE/misconfig scan (nuclei) — flagged libs Lodash/Zone.js, check versions
- [-] TLS/SSL config check — out of scope ("missing security best practices")
- [x] CORS misconfiguration check — sent `Origin: https://evil.com` to `/`
  and an OPTIONS preflight to `/api/`. No `Access-Control-Allow-Origin`
  reflecting the attacker origin in either response. Clean, no misconfig found.
- [ ] Exposed sensitive files (.git, .env, backups, configs) — in scope, high value given API key focus
- [-] Security headers check (baseline presence) — out of scope as "best practices"; only pursue if it enables a concrete exploit chain
- [ ] Basic SSRF/open-redirect pattern testing (safe payloads only) — relevant to Integrations Module (customer environment access)
- [ ] Cloud storage misconfig (S3/GCS/Azure blobs) — relevant to customer data exfiltration focus area

## Auth / Access Control (added — key focus per scope)

- [x] Login-flow email enumeration check (browser, claude-in-chrome) — tried
  a nonexistent email; app transitions to a password-prompt step
  identically to a real-looking email (no "user not found" difference
  observed). Discovered `POST /api/access/v1/saml-settings/user-type`
  (checks SSO/SAML routing per email domain) — worth revisiting once
  authenticated to see if response body itself leaks user existence (only
  UI behavior checked so far, not raw response payload).
- [-] Forgot-password flow enumeration/rate-limit check — **stopped**: flow
  requires solving a CAPTCHA before submission. Not attempted (CAPTCHA
  bypass/solving is off-limits). No conclusion reached either way; leave
  for the user to test manually if they want this angle covered.

- [ ] Test authz boundaries between credential levels created from the admin account
- [ ] Attempt privilege escalation to full Site Admin — **this is the only
  in-scope authz bug class** (lower-level authz issues are explicitly excluded)
- [ ] Business logic testing on Consumer Rights Portal (Data Subject Request webforms/workflows)
- [ ] Business logic testing on Integrations Module (customer environment data/metadata pull)

## Code-level (only if source/APK available)

- [-] Static code review — N/A, no source provided
- [-] Android APK decompile + review — N/A, this program is web-only
- [-] Client-side JS dependency/library CVE check (Lodash, Zone.js versions seen in tags) —
  confirmed Zone.js + Angular (micro-frontend) + `angular-oauth2-oidc` in
  main bundle, but exact pinned versions not extractable from the minified
  bundle. Lodash not found in main/runtime bundles — it's app is Webpack
  (`webpackChunkot_app`) with lazy chunks loaded dynamically at navigation
  time; can't be statically enumerated via grep. Blocked without a
  headless-browser crawl (claude-in-chrome) to drive navigation and
  capture the actual chunk network requests — marking blocked rather than
  spending more unauthenticated-recon time here.

## Automation / Triage

- [ ] Findings dedupe + severity prioritization
- [ ] Draft report (POC steps) — **do not submit without user review**; note
  program requires concrete, re-creatable PoC, not hypothetical impact
- [ ] Diff against previous scan (new endpoints since last session)

## Blocked — needs user action

- [!] **No test credentials assigned yet.** User requested credentials via
  the Bugcrowd brief on 19 Sep 2026 11:02:56 IST; Bugcrowd will email when
  available. Most auth-gated business-logic and privilege-escalation
  testing stays blocked until then.
