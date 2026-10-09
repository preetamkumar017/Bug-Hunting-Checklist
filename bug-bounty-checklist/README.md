# Bug Bounty Checklist

An interactive, guided bug bounty & security testing checklist application — built for security researchers, penetration testers, and bug hunters during real engagements.

Every check has a testing procedure with prerequisites, baseline/control comparison, evidence requirements, limitations and cleanup. Examples must be adapted to the actual target and installed tool versions. Source review is **not** lab verification: a scanner match, HTTP status, failed payload or model assertion is not a vulnerability verdict.

---

## Features

- **11 Domains, 122 Categories, 651 Checks / 724 Methods** (recount with `npm run audit:content`):
  - 🌐 **Web**: Recon, Auth, Injection, Next.js / React Server Components (RSC), HTTP/2 & HTTP/3 Rapid Reset & Smuggling, Web Cache Deception, Server-Side Prototype Pollution (SSPP) to RCE, Modern Auth / Passkeys / WebAuthn & DPoP.
  - 🔌 **API**: REST, GraphQL Deep Testing (Circular Query DoS, Alias rate limit bypass, Clairvoyance), BOPLA (Broken Object Property Level Authorization), gRPC, Webhooks & SSRF.
  - ☁️ **Cloud & CI/CD**: AWS IMDSv1/v2, GCP & Azure Metadata credential extraction, S3/Blob takeovers, GitHub Actions `pull_request_target` pwn-requests, Docker socket escape & Kubernetes ServiceAccount token theft.
  - 🤖 **AI & LLM Security** (OWASP Top 10 for LLM): Direct & Indirect Prompt Injection, Insecure Output Handling (XSS/SSRF via LLM), System Prompt & RAG Tenant Data Leakage, Excessive Agency & Tool Calling Exploitation, Model Denial of Service.
  - 📱 **Android**: Static/Dynamic analysis, Flutter Dart AOT reversing (`blutter`, `reFlutter`), React Native Hermes bytecode decompilation (`hbctool`), BiometricPrompt bypasses, App Links & `assetlinks.json`.
  - 🍏 **iOS**: Universal Links (`apple-app-site-association`), Shared App Groups data leaks, Keychain sharing, ATS exceptions, and rootless instrumentation.
  - 🖥️ **Thick Client**: Memory corruption, DLL hijacking, Tauri IPC command injection, Electron custom protocol handlers (`myapp://`) argument injection to RCE, `shell.openExternal` abuse.
  - ⛓️ **Web3 / Smart Contracts**: Reentrancy, Oracle manipulation, Flash loans, ERC-4337 Account Abstraction (paymaster drain), EIP-712 signature replay, and cross-chain bridge validation.
  - 🏢 **Network & Active Directory**: Directory policy, Kerberos, delegation, relay prerequisites and certificate services, with isolated-lab constraints.
  - 🧩 **Binary & Memory Safety**: Mitigations, actual load paths, effective permissions and reachable privilege boundaries.
  - 🛡️ **SOC & Threat Hunting**: Read-only log/PCAP/artifact analysis with corroboration and explicit confidence limits.
  - **73 checks have additional focused recipes** for authorization, SQL predicates, XSS, SSRF, OAuth/PKCE, browser CSRF/CORS, races, GraphQL, JWT, caching and AI boundaries. Unknown/custom checks receive conservative adaptation guidance, not keyword-selected attacks.
- 🛠️ **In-App Hacker Swiss Army Knife**:
  - **CVSS v4.0 & v3.1 Base Calculators**: Standards-based base scoring and strict vectors. Optional Threat/Temporal/Environmental metrics are not supported and are rejected rather than silently discarded. The CVSS v4 implementation is adapted from FIRST's BSD-licensed reference implementation; attribution and pinned source revision are retained in `src/lib/cvss4Reference.ts`.
  - **Multi-Format Encoder / Decoder**: URL, Double URL, Base64 (Unicode safe), Hex, and HTML entities.
  - **JWT Inspector**: Decode untrusted headers/claims and inspect expiry. Decoding does not validate signature, issuer, audience or server acceptance.
  - **Payload Mutation Candidates**: Context-dependent transformations with limitations, not guaranteed WAF bypasses.
- 🎯 **Target Scope & Policy Manager**:
  - Track in-scope assets/wildcards, out-of-scope targets, bounty reward tiers, and program rules of engagement per target profile.
- 📋 **Custom Checklist Items & Categories**:
  - Add custom categories or extra checks to built-in categories. Rename/delete custom checks; content and progress remain profile-specific.
- ⚡ **Status Filters & Bulk Category Actions**:
  - Filter checklist items by: `All`, `Untested`, `Clean`, `Vulnerable`, `Blocked`, or `Critical / High`.
  - Category bulk buttons: *"Mark all Clean"* and *"Reset category"*.
  - Bookmark individual checks for follow-up. Blocked checks remain incomplete; deleted custom-check progress does not inflate totals.
- 🐞 **Findings Tracker with Platform Templates**:
  - Export findings directly to:
    - **Standard Markdown** report
    - **HackerOne Report Format** (Summary, Asset, Steps to Reproduce, Impact)
    - **Bugcrowd Submission Format** (Classification, Replication Steps, Business Impact)
- ⌨️ **Keyboard Navigation**:
  - Press `/` from anywhere to focus search.
  - Press `Esc` to clear search or dismiss modals.
- 🔒 **Local-First & Private**:
  - Profiles use browser `localStorage`; no application backend or telemetry. This is **not encrypted secret storage**. Do not keep production credentials or unredacted customer data here. Opening external references or deliberately replaying exported commands is separate from local storage.
  - **Validated JSON Export & Import** for manual backups and transfer, not automatic synchronization. Conflicting IDs import as copies.
  - New evidence: at most four PNG/JPEG/WebP screenshots per finding, each at most 250 KB. Imports are capped at 3 MB and ordinary aggregate persistence at 4 MB.
  - Existing safe legacy evidence has a bounded recovery path. Oversized/legacy profiles stay readable/exportable with a warning; remove evidence/findings to restore normal editing. Loading never silently discards screenshots or rewrites storage.
  - Save failures are visible; failed writes do not falsely update persisted state. Concurrent-tab changes require reloading rather than silently overwriting another tab.

---

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 8** — build tooling
- **Tailwind CSS v4** — styling & dark mode design
- **Zustand** — persistent client state management
- **Lucide React** — iconography
- **Oxlint** — ultra-fast linting

---

## Getting Started

```bash
npm install
npm run dev
```

App will run at `http://localhost:5173/checklist/` (the configured deployment base is `/checklist/`).

### Production Build & Linting

```bash
npm run build      # type-check and build for production
npm run lint       # run oxlint
npm run preview    # preview production build locally
npm test           # offline regression suite, including all CVSS4 base combinations
npm run audit:content # generate reports/method-coverage.json for every check
```

---

## Disclaimer

This checklist is intended strictly for authorized security testing, penetration testing engagements, and bug bounty programs within defined rules of engagement. Begin with tester-owned accounts and synthetic data. Destructive, resource-exhaustion, relay and live-chain changes require separately authorized isolated fixtures; the app does not execute these examples.

Checklist severity badges are **testing priorities**, not confirmed finding severity or promised rewards. “Clean” means no issue found in the recorded test, not that the target is secure; “Blocked” is not verification. Findings require researcher-supplied evidence and impact.

See `docs/review-and-validation.md` for the correction architecture, verification scope, remaining limitations and recommended manual smoke checks. Generated per-check coverage is in `reports/method-coverage.json`.
