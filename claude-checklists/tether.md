# Claude Autonomous Checklist — Tether

Tasks Claude can run on this target **without needing the user to run or
paste anything**, given `scope.md` allows it. See `/CLAUDE.md` at the
workspace root for status legend and update protocol.

## Recon (passive + active)

- [x] Subdomain enumeration (subfinder/amass/crt.sh/assetfinder) — 87 hosts found via subfinder passive on tether.to; only tether.to/app.tether.to/www.tether.to are in-scope, rest (hadron/alloy/forge/econ/etc. internal infra) are out-of-scope subdomains not on the two listed assets — recorded for mapping only, not tested.
- [x] Live host detection + tech fingerprint (httpx) — tether.to & www.tether.to: Gatsby 4.25.9/React static site behind Cloudflare. app.tether.to: AngularJS app behind Cloudflare, redirects to /app/login.
- [-] Subdomain takeover check (dangling CNAMEs) — N/A, only 2 in-scope apex/subdomains, both live and resolving to Cloudflare, no dangling CNAME candidates in scope.
- [-] Port scanning / service enumeration (nmap/naabu) — skipped, both in-scope hosts sit behind Cloudflare shared edge IPs (104.18.16-17.207), origin not exposed.
- [x] DNS enumeration (records, SPF/DKIM/DMARC, AXFR, DNSSEC/CAA, wildcard) — SPF hard-fail (-all), DMARC p=reject/strict alignment, both clean/strict. A records confirm Cloudflare proxying on both in-scope hosts.
- [-] ASN/IP range discovery (org-wide scope only) — N/A, scope is limited to 2 named hosts, not org-wide.

## Content Discovery

- [ ] URL/endpoint gathering (katana/gau/waybackurls)
- [x] Directory/file brute-force (ffuf/gobuster) — targeted 25-path wordlist (admin/api/config/swagger/graphql/health/etc) at low rate (5 req/s) on both in-scope hosts. app.tether.to: everything correctly 302s to login except robots.txt (standard, Disallow: / for all). tether.to: every path returns 200 (confirmed false positive — Gatsby SPA catch-all returns 200 for any path including random nonexistent ones, not real files).
- [x] JS file analysis (hidden endpoints, secrets, feature flags) — downloaded app.tether.to's main bundle + all 28 lazy-loaded webpack chunks. Recovered app's full same-origin API surface (see below). No hardcoded API keys/secrets found via single-purpose key:value grep.
- [ ] Parameter discovery (arjun/paramspider)

## Vulnerability Scanning

- [x] Known CVE/misconfig scan (nuclei, tags cve/exposure/misconfiguration/tech) on both in-scope hosts — only info-level WAF/tech-detect templates fired (Cloudflare, Gatsby 4.25.9, Angular/AngularJS). No CVE or misconfiguration findings.
- [x] TLS/SSL config check — both hosts: only TLSv1.2/TLSv1.3 supported (no TLSv1.0/1.1), all ciphers rated A-grade, valid Google Trust Services cert on tether.to (expires 2026-12-11). No weak config found.
- [x] CORS misconfiguration check — tested Origin: https://evil.com against tether.to and app.tether.to, no Access-Control-Allow-Origin reflection on either, clean.
- [x] Exposed sensitive files (.git, .env, backups, configs) — .git/config and .env both return 403 on tether.to and app.tether.to. tether.to's /.well-known/security.txt returns 200 but is the Gatsby SPA HTML catch-all, not a real file (same false-positive class seen on other targets) — no real file exposure found.
- [x] Security headers check — tether.to: strong header set (CSP frame-ancestors 'none', HSTS, X-Frame-Options deny, X-Content-Type-Options nosniff). app.tether.to: session cookie is Secure+HttpOnly, CSP frame-ancestors self, HSTS present. No missing-header findings worth reporting per scope.md (best-practice-only headers are non-qualifying anyway).
- [ ] Basic SSRF/open-redirect pattern testing (safe payloads only)
- [ ] Cloud storage misconfig (S3/GCS/Azure blobs)

## Code-level (only if source/APK available)

- [-] Static code review (hardcoded secrets, weak crypto) — no source/repo access found yet for tether.to/app.tether.to specifically.
- [-] Android APK decompile + review (manifest, exported components, storage) — no mobile app in the pasted scope; not applicable unless user confirms a Tether mobile app is in scope.
- [ ] Dependency/library CVE check

## App API Surface (discovered from JS bundle analysis, 2026-09-25)

- [x] Unauthenticated `GET /api/v1/int/vasps` on app.tether.to — returns 200, 2,085
  entries of `{id: did:ethr:..., name}`. Confirmed this is intentionally public
  Travel-Rule VASP registry reference data (public names + public on-chain DIDs,
  no PII/user data) — not a vulnerability, not reportable.
- [x] Auth-gate check on all discovered GET endpoints (`/account`, `/balance`,
  `/banks`, `/announcements`, `/redeem`) — all correctly 302-redirect
  unauthenticated requests to the login page. No auth bypass found.
- [-] POST endpoints (`/users/signup`, `/password/forgot`, `/sessions`,
  `/send_email_verification`, `/account/activate_google_2fa`, etc.) —
  deliberately NOT tested unauthenticated/blind, since these are
  state-changing (could create real accounts, send real emails/resets,
  touch 2FA) and scope.md's Responsible Disclosure Policy forbids
  degrading the product or affecting real user state. Needs a dedicated,
  careful, own-account-only test plan before touching.

## Automation / Triage

- [ ] Findings dedupe + severity prioritization
- [ ] Draft report (POC steps) — **do not submit without user review**
- [ ] Diff against previous scan (new subdomains/endpoints since last session)

---
*Copy this file into a new target folder and rename the header. Don't reuse
item text verbatim if scope.md restricts a category — mark it `[-]` with why
instead of deleting the line, so future sessions know it was considered.*
