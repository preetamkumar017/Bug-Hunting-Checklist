# Claude Autonomous Checklist — PlayerAuctions

Tasks Claude can run on this target **without needing the user to run or
paste anything**, given `scope.md` allows it. See `/CLAUDE.md` at the
workspace root for status legend and update protocol.

Scope: `*.playerauctions.com` (prod only). Safe Harbor authorized. Keep it
low-and-slow — no DoS-adjacent high-rate activity, own-data only.

## Recon (passive + active)

- [x] Subdomain enumeration (subfinder/amass/crt.sh/assetfinder) — 81 subs found; 52 prod candidates, 29 non-prod/sandbox flagged OUT-OF-SCOPE (recon/oos_nonprod.txt). See log-80.
- [ ] Live host detection + tech fingerprint (httpx) — running (low rate)
- [x] Subdomain takeover check (dangling CNAMEs) — scdn01 has dangling CNAME to dead EdgeCast/Edgio CDN, but NOT practically takeoverable (enterprise-only, no self-serve claim, platform defunct). Info-only, not submittable. Others clean. See log-85.
- [-] Port scanning / service enumeration — SKIPPED: all 52 prod hosts front by Cloudflare (104.18.x / shared CDN); port scan would only hit CDN edge, not origin. Not applicable.
- [x] DNS enumeration (records, SPF/DKIM/DMARC, AXFR, DNSSEC/CAA, wildcard) — Cloudflare NS, Outlook MX, SPF present, no CAA, AXFR refused. SPF/DKIM/DMARC out-of-scope for reward. See log-81.
- [ ] ASN/IP range discovery (org-wide scope only)

## Content Discovery

- [x] URL/endpoint gathering (katana/gau/waybackurls) — wayback CDX mined API + www URLs (recon/api_wayback.txt, wayback_all.txt). Key: /api/orderdetail/{id}, /api/messages/detail, /api/offer/{id}/view, /_next/image?url=. See log-82/89/91.
- [-] Directory/file brute-force (ffuf/gobuster) — SKIPPED for now: www/account behind Cloudflare bot-challenge (all non-browser reqs 403); brute-force from curl is pointless + noisy. Revisit via browser-context tooling.
- [x] JS file analysis (hidden endpoints, secrets, feature flags) — developer portal JS mapped the member app: me.playerauctions.com/member/{messenger,myoffer.aspx,myorder,sellorder,offereditor,sellersetting}, account.playerauctions.com login/register/accountCenter. See log-82.
- [ ] Parameter discovery (arjun/paramspider)

## Vulnerability Scanning

- [ ] Known CVE/misconfig scan (nuclei) — low rate
- [ ] TLS/SSL config check
- [x] CORS misconfiguration check (unauthenticated) — no exploitable reflection. public-api ACAO:* but no allow-credentials (by-design public API). Credentialed CORS on user-api deferred to auth batch. See log-86.
- [ ] Exposed sensitive files (.git, .env, backups, configs)
- [ ] Security headers check (info-only — not reportable alone per scope)
- [x] Basic SSRF/open-redirect pattern testing — /_next/image?url= (no SSRF, allowlist enforced) + login returnUrl= (no open redirect) both tested CLEAN in-browser. JWT HS256 refresh-token secret strong/not cracked. See log-90/91/92.
- [ ] Cloud storage misconfig (S3/GCS/Azure blobs)

## Code-level (only if source/APK available)

- [ ] Static code review (hardcoded secrets, weak crypto)
- [ ] Android APK / iOS decompile + review (if a mobile app is in scope)
- [ ] Dependency/library CVE check

## Automation / Triage

- [ ] Findings dedupe + severity prioritization
- [ ] Draft report (POC steps) — **do not submit without user review**
- [ ] Diff against previous scan (new subdomains/endpoints since last session)

---
Notes:
- Auth-required flows (IDOR, business logic, payment/marketplace escrow) need a
  test account — flag to user before creating one; own-data-only rule is strict
  here ("no accessing data other than your own").
