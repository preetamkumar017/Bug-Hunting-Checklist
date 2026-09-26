# Bug Bounty Checklist

An interactive, guided bug bounty & security testing checklist application — built for security researchers, penetration testers, and bug hunters during real engagements.

Unlike static lists, every check comes with an actual testing guide, copy-ready payloads with command explanations, expected responses (vulnerable vs safe), CVSS calculator, and integrated finding reporting.

---

## Features

- **8 Domains, 111 Categories, 615+ Guided Checks**:
  - 🌐 **Web**: Recon, Auth, Injection, Next.js / React Server Components (RSC), HTTP/2 & HTTP/3 Rapid Reset & Smuggling, Web Cache Deception, Server-Side Prototype Pollution (SSPP) to RCE, Modern Auth / Passkeys / WebAuthn & DPoP.
  - 🔌 **API**: REST, GraphQL Deep Testing (Circular Query DoS, Alias rate limit bypass, Clairvoyance), BOPLA (Broken Object Property Level Authorization), gRPC, Webhooks & SSRF.
  - ☁️ **Cloud & CI/CD**: AWS IMDSv1/v2, GCP & Azure Metadata credential extraction, S3/Blob takeovers, GitHub Actions `pull_request_target` pwn-requests, Docker socket escape & Kubernetes ServiceAccount token theft.
  - 🤖 **AI & LLM Security** (OWASP Top 10 for LLM): Direct & Indirect Prompt Injection, Insecure Output Handling (XSS/SSRF via LLM), System Prompt & RAG Tenant Data Leakage, Excessive Agency & Tool Calling Exploitation, Model Denial of Service.
  - 📱 **Android**: Static/Dynamic analysis, Flutter Dart AOT reversing (`blutter`, `reFlutter`), React Native Hermes bytecode decompilation (`hbctool`), BiometricPrompt bypasses, App Links & `assetlinks.json`.
  - 🍏 **iOS**: Universal Links (`apple-app-site-association`), Shared App Groups data leaks, Keychain sharing, ATS exceptions, and rootless instrumentation.
  - 🖥️ **Thick Client**: Memory corruption, DLL hijacking, Tauri IPC command injection, Electron custom protocol handlers (`myapp://`) argument injection to RCE, `shell.openExternal` abuse.
  - ⛓️ **Web3 / Smart Contracts**: Reentrancy, Oracle manipulation, Flash loans, ERC-4337 Account Abstraction (paymaster drain), EIP-712 signature replay, and cross-chain bridge validation.
- 🛠️ **In-App Hacker Swiss Army Knife**:
  - **CVSS v4.0 & v3.1 Matrix Calculator**: Full interactive scoring with live vector generation and copy functionality.
  - **Multi-Format Encoder / Decoder**: URL, Double URL, Base64 (Unicode safe), Hex, and HTML entities.
  - **JWT Inspector**: Parse headers & claims, colorized JSON viewer, and token expiration countdown verification.
  - **WAF Bypass Payload Mutator**: Automated generation of 8+ evasion variants (inline comments `/**/`, case alternation, null bytes, unicode fullwidth, hex bytes).
- 🎯 **Target Scope & Policy Manager**:
  - Track in-scope assets/wildcards, out-of-scope targets, bounty reward tiers, and program rules of engagement per target profile.
- 📋 **Custom Checklist Items & Categories**:
  - Add your own custom categories and private checklist items with custom payloads directly in the browser; saved per profile.
- ⚡ **Status Filters & Bulk Category Actions**:
  - Filter checklist items by: `All`, `Untested`, `Clean`, `Vulnerable`, `Blocked`, or `Critical / High`.
  - Category bulk buttons: *"Mark all Clean"* and *"Reset category"*.
- 🐞 **Findings Tracker with Platform Templates**:
  - Export findings directly to:
    - **Standard Markdown** report
    - **HackerOne Report Format** (Summary, Asset, Steps to Reproduce, Impact)
    - **Bugcrowd Submission Format** (Classification, Replication Steps, Business Impact)
- ⌨️ **Keyboard Navigation**:
  - Press `/` from anywhere to focus search.
  - Press `Esc` to clear search or dismiss modals.
- 🔒 **Local-First & Private**:
  - All data stays inside your browser (`localStorage`). No backend, no accounts, zero telemetry.
  - Single-click **JSON Export & Import** for backups and cross-device synchronization.

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

App will run at `http://localhost:5173`.

### Production Build & Linting

```bash
npm run build      # type-check and build for production
npm run lint       # run oxlint
npm run preview    # preview production build locally
```

---

## Disclaimer

This checklist is intended strictly for authorized security testing, penetration testing engagements, and bug bounty programs within defined rules of engagement.
