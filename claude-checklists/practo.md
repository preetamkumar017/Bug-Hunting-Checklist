# Claude Autonomous Checklist — Practo

Tasks Claude can run on this target **without needing the user to run or
paste anything**, given `scope.md` allows it. See `/CLAUDE.md` at the
workspace root for status legend and update protocol.

## Recon (passive + active)

- [x] Subdomain enumeration (subfinder/amass/crt.sh/assetfinder) — subfinder found 340 hosts under practo.com; crt.sh returned 404 (no CT data via that query, noted). See recon/subfinder.txt, recon/subs.txt.
- [x] Live host detection + tech fingerprint (httpx) — 334/340 responded. 80 returned 200/401/403/502 (recon/interesting.txt). Several internal-looking tools and "-latest" staging mirrors are publicly reachable — flagged below, nothing exploited yet.
- [!] Subdomain takeover check (dangling CNAMEs) — CONFIRMED: `assured.practo.com` + `www.assured.practo.com` CNAME to `pointing.wixdns.net`, serving Wix's "ConnectYourDomain Error" unclaimed-domain page. Flagged via nuclei (http/takeovers, high) + manually verified. Not claimed/exploited — user confirmed true positive, PoC claim pending user go-ahead. See claude-log.json log-97, recon/takeover-results-full.txt, recon/cnames.txt. Two other Unbounce-CNAMEd hosts (hospitals.practo.com, raysem.practo.com) checked but inconclusive — no takeover signature confirmed. Coverage completed: remaining 110/340 subdomains confirmed as direct A records (no CNAME, not takeover-relevant); full 340-host nuclei takeover scan already covered all hosts, no additional candidates. Check is exhaustive — DONE.
- [!] Port scanning / service enumeration (nmap/naabu) — only if not behind shared CDN — scanned 4 non-CDN hosts (vpn, elastic-apm, alertmanagerd, sap-procurement.practo.com), top 200 ports. vpn.practo.com: 80/443 only (NetBird dashboard, already flagged under takeover check item). elastic-apm.practo.com + alertmanagerd.practo.com both resolve to the same wildcard-catchall IP (13.232.184.38, see DNS enum note) — NOT distinct real services, correcting earlier speculation. **sap-procurement.practo.com has RDP (3389) open to the internet** (separate IP, 65.1.99.15) — confirmed via rdp-enum-encryption that NLA/CredSSP is enabled (good — not BlueKeep-exploitable, auth required), Windows Server 2019 (not EOL), minor NTLM info leak (internal hostname EC2AMAZ-9OV8D5S). Low/informational severity, not independently exploited. **User decision: hold this, bundle into a future report rather than submitting standalone now.** See recon/portscan/nmap-results.txt.
- [x] DNS enumeration (records, SPF/DKIM/DMARC, AXFR, DNSSEC/CAA, wildcard) — NS (Route53), MX (Google), DMARC (p=quarantine, pct=100 — reasonably strict), CAA (restricted to a handful of known CAs, incl. wildcard restriction) all look fine. SPF present but out of scope per scope.md, not evaluated further. AXFR: TCP/53 reachable on all 4 nameservers but zone-transfer requests are silently dropped (standard Route53 behavior) — not vulnerable. DNSSEC: not enabled (no DS record) — informational only, not independently reportable. Wildcard DNS confirmed: *.practo.com → 13.232.184.38 (nginx catch-all, just redirects, nothing sensitive) — means some of the "110 direct-A" hosts from the earlier subdomain list may be wildcard matches rather than distinct real services; worth keeping in mind for future recon but not a vulnerability itself.
- [-] ASN/IP range discovery (org-wide scope only) — SKIPPED. scope.md only covers `*.practo.com` + mobile apps, with no org-wide/ASN statement. All discovered hosts are on AWS EC2 (ap-south-1), where IPs are from a shared/dynamic pool, not a dedicated owned block — scanning by ASN/CIDR risks hitting unrelated third-party AWS tenants, which would be unauthorized. Discussed with user; staying strictly within named *.practo.com hostnames instead.

## Content Discovery

- [ ] URL/endpoint gathering (katana/gau/waybackurls)
- [-] Directory/file brute-force (ffuf/gobuster) — attempted on www.practo.com with ffuf (4750-word common.txt list, rate-limited 20/s) — Akamai's bot-management returned 403 for ~98% of requests (4654/4750), including on words that returned 404 via plain curl. Confirmed this is bot-detection, not real path-existence signal (same random word gave 404 via curl, 403 via ffuf). Directory brute-force is effectively blocked/unreliable against this Akamai-fronted host — not pursued further to avoid wasting requests or risking IP-level blocking. Could retry against non-CDN "-latest" nginx-default hosts in a future session if useful.
- [x] JS file analysis (hidden endpoints, secrets, feature flags) — reviewed JS bundles referenced by www.practo.com homepage (client/vendor/manifest + clevertap). Only public nav routes found, no API keys/tokens/AWS creds/sourcemaps exposed. Note: these JS files are served from practostatic.com, a separate domain outside *.practo.com scope — read passively as they're linked from an in-scope page, but any practostatic.com-specific issue would itself be out of scope. Only homepage reviewed so far — other pages (consumer-home, login, provider dashboards) not yet checked.
- [ ] Parameter discovery (arjun/paramspider)

## Vulnerability Scanning

- [-] Known CVE/misconfig scan (nuclei) — started (340 hosts, http/cves/, rate-limited) but user stopped it before completion (2026-10-06), 0 hits found before stopping. Not re-run yet — re-run in a future session if desired.
- [x] TLS/SSL config check — checked www/accounts/payments.practo.com. Valid wildcard cert (*.practo.com, DigiCert, expires Apr 2027). TLS 1.0/1.1 confirmed server-rejected (curl -v shows server-sent "protocol_version" alert, not a client-side limitation) — TLS 1.2+ only. Good hardening, no finding.
- [x] CORS misconfiguration check — tested 11 hosts (www/accounts/payments/insurance/plus + paymentsapi/mds/reach-provision/lms/fabric-sixpack-web/resources) with crafted Origin headers (evil.example, null, subdomain-suffix/prefix tricks, attacker-subdomain, http-downgrade). No Access-Control-Allow-Origin/Credentials headers reflected anywhere on the root `/` path — clean. Caveat: only root paths tested, not actual API sub-paths (e.g. /api/v1/...) which may set CORS differently — worth a follow-up once real API paths are known.
- [x] Exposed sensitive files (.git, .env, backups, configs) — checked 7 curated paths (.git/config, .env, .env.local, config.json, .aws/credentials, backup.sql, .DS_Store) across 7 key production hosts (www, accounts, payments, insurance, plus, synapse, omega). None returned 200 — clean. Only this host set checked so far, not the full 340.
- [x] Security headers check — HSTS present on all checked hosts. CSP present on www/accounts, missing on payments/insurance/plus/synapse. X-Frame-Options missing on accounts/insurance/synapse. No Permissions-Policy anywhere. Treated as informational only (missing-header findings are generally not independently reportable without a clickjacking/injection PoC) — not submitted as a finding.
- [ ] Basic SSRF/open-redirect pattern testing (safe payloads only)
- [x] Cloud storage misconfig (S3/GCS/Azure blobs) — no s3scanner/cloud_enum installed; no bucket names found in JS bundles reviewed so far. Manually checked 15 likely-named S3 buckets (practo, practo-assets, practo-prod, practo-backup, etc.) via direct HTTPS requests. `practo` and `practo-backup` exist but return 403 Access Denied (private, properly secured) — rest return 404 (don't exist). No open bucket found. GCS/Azure not checked this pass.

## Code-level (only if source/APK available)

- [ ] Static code review (hardcoded secrets, weak crypto)
- [ ] Android APK decompile + review (manifest, exported components, storage)
- [ ] Dependency/library CVE check

## Automation / Triage

- [ ] Findings dedupe + severity prioritization
- [ ] Draft report (POC steps) — **do not submit without user review**
- [ ] Diff against previous scan (new subdomains/endpoints since last session)

---
*Copy this file into a new target folder and rename the header. Don't reuse
item text verbatim if scope.md restricts a category — mark it `[-]` with why
instead of deleting the line, so future sessions know it was considered.*
