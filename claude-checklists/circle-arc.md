# Claude Autonomous Checklist — Circle Arc (HackerOne)

Tasks Claude can run on this target **without needing the user to run or
paste anything**, given `scope.md` allows it. See `/CLAUDE.md` at the
workspace root for status legend and update protocol.

Two distinct scopes here: **Tier B web2** (`*.arc.io`, excluding
`help./explorer./community.arc.io`) and **Tier A chain/protocol**
(testnet RPC endpoints + 3 GitHub source repos, partial-scope on
`malachite`). Tier A needs testnet/blockchain-specific setup not done yet —
Tier B web recon can start immediately with existing methodology from the
eToro engagement.

## Recon (passive + active) — Tier B (`*.arc.io`)

- [x] Subdomain enumeration (subfinder) — 86 subdomains found for `arc.io`
  (`recon/subfinder_arc_io.txt`). `help.arc.io`/`explorer.arc.io`
  /`community.arc.io` present but excluded from further testing per
  scope.md (ineligible).
- [x] Live host detection + tech fingerprint (httpx) — 35 hosts responded
  (`recon/httpx_arc_io.txt`). Notable live Tier-B-relevant hosts: `portal.arc.io`
  (behind Cloudflare bot-management JS challenge — likely the most
  valuable target, matches the program's "Portal backends" Critical
  example), `onramp.arc.io`/`onramp-demo*` (fiat/crypto onramp, Next.js),
  `docs.arc.io` (Vercel), `www.arc.io` (Webflow-hosted marketing site, low
  value — SaaS-builder controlled like eToro's delta.app apex was),
  `status.arc.io` (Atlassian Statuspage, third-party-hosted, low value).
- [x] Subdomain takeover check (dangling CNAMEs) — the 51 subfinder results
  that didn't respond to httpx were all checked via `dig` (A + CNAME): **all
  51 are pure NXDOMAIN** (no CNAME, no A record at all) — clean, no
  dangling-CNAME takeover opportunity. These are stale CT-log entries with
  nothing currently provisioned.
- [-] Port scanning / service enumeration — check if behind shared CDN first
- [ ] DNS enumeration (records, SPF/DKIM/DMARC, AXFR, DNSSEC/CAA, wildcard) —
  note: missing SPF/DKIM/DMARC is explicitly out of scope per scope.md, do
  this for context/completeness only, not as a submittable finding
- [-] ASN/IP range discovery — no org-wide IP scope given, N/A

## Content Discovery — Tier B

- [x] Browser-based access to `portal.arc.io` (past Cloudflare bot
  challenge) + JS bundle analysis — confirmed it's the Arc Portal
  wallet/DeFi UI, the highest-value Tier B target. Found `arc.network`
  (separate domain) referenced in the JS — enumerated separately, see below.
  Mostly generic wagmi/viem multi-chain library noise; genuine Arc-specific
  refs: `api.circle.com`, `iris-api.circle.com`, `api.turnkey.com`.
- [ ] URL/endpoint gathering (katana/gau/waybackurls) on `*.arc.io`
- [ ] Directory/file brute-force (ffuf/gobuster) — check rate carefully,
  no explicit tooling restriction stated but be conservative
- [ ] JS file analysis (hidden endpoints, secrets, feature flags)
- [ ] Parameter discovery (arjun/paramspider)

## Vulnerability Scanning — Tier B

- [ ] Known CVE/misconfig scan (nuclei)
- [-] TLS/SSL config check — "Missing best practices in SSL/TLS
  configuration" explicitly out of scope
- [ ] CORS misconfiguration check
- [ ] Exposed sensitive files (.git, .env, backups, configs)
- [-] Security headers check — CSP/HttpOnly/Secure-flag best-practices
  explicitly out of scope; only pursue if it enables a concrete exploit chain
- [ ] SSRF testing — explicitly in-scope per reward table ("Medium:
  meaningful SSRF with constrained reach")
- [ ] Open redirect — only reportable if additional security impact
  demonstrated (scope.md), don't bother with bare open redirect
- [ ] IDOR testing — explicitly in-scope per reward table
- [ ] Account-takeover / authz-bypass into privileged Portal workflows —
  explicitly the highest-value Tier B category, prioritize if an
  authenticated area is reachable
- [ ] Stored XSS — explicitly in-scope (Medium); reflected XSS only if
  more than "low-risk" per scope.md
- [ ] Cloud storage misconfig (S3/GCS/Azure blobs)

## Chain/Protocol — Tier A (needs setup first)

- [ ] Get exact Arc testnet connection details + faucet (per "Connect to
  Arc — Arc testnet" doc link on the program page) — **mainnet testing is
  explicitly disallowed**, must confirm testnet endpoint before any active
  testing here
- [x] `rpc.testnet.arc.network` / `rpc.drpc.testnet.arc.network` — basic
  RPC method enumeration done (testnet only, read-only calls). `eth_chainId`/
  `web3_clientVersion` work on both. `rpc.testnet.arc.network`: all
  sensitive namespaces (admin_/debug_/personal_/txpool_) correctly disabled
  — clean. `rpc.drpc.testnet.arc.network`: `debug_traceTransaction` **is
  enabled** (returned an arg-count error, not "not supported"). **Follow-up
  done (log-50):** a valid 2-arg call with a real testnet tx hash returns
  dRPC's "not available on free plan" gate (code 35) — same as txpool_content.
  The arg-count error was just validation before the plan check; not
  usable, **not a finding**.
- [ ] Source code review: `github.com/circlefin/malachite` — **partial
  scope only**, `code/crates` minus `starknet` and `test` folders
- [ ] Source code review: `github.com/circlefin/arc-remote-signer` — **first pass done (log-51, info):** enclave/public/config reviewed, nothing exploitable; sidecar-model hardening notes only. Still to read: `internal/enclave/common/crypto`, keystore provider, `run_enclave.go`. Cloned to `recon/src/`.
- [ ] Source code review: `github.com/circlefin/arc-node` — **in progress:** `native_coin_authority` precompile clean (log-52), `callFrom` + subcall path clean (log-54). `native_coin_control`/`system_accounting`/`helpers` clean (log-55). Solidity Denylist/proxy/PVM/Controller/Registry clean (log-56). All `contracts/src` + `pq` precompile clean (log-57). txpool denylist/blocklist path reviewed (log-58, info: denylist is mempool-only by documented design). `execution-validation/consensus.rs` + executor base-fee/extra_data chain clean (log-59). Still to read: rest of `execution-txpool/validator.rs` (L1-255), `eth-engine`/`execution-payload`, `malachite-app`/`consensus-db`/`node`. `malachite` cloned to `recon/src/` too.
- [x] Dependency/library CVE check on the above repos — osv-scanner on all 3 lockfiles (log-53, info): many advisories, none reportable without PoC/reachability (scope.md excludes it); outputs in `recon/osv_*.json`

## Automation / Triage

- [ ] Findings dedupe + severity prioritization
- [ ] Draft report (POC steps) — **do not submit without user review**
- [ ] Diff against previous scan (new subdomains/endpoints since last session)

---
*Started 2026-09-20. HackerOne username: preetamkumarsinha.*
