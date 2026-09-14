# Bug Hunting Checklist

An interactive, guided bug bounty / security testing checklist — built for real engagements, not just a static reference list.

Unlike a plain checklist, every check comes with an actual testing guide, ready-to-use payloads, and a status you can act on (not just tick/untick). Mark something vulnerable and it turns into a findings entry; mark a category clean and it nudges you toward the next thing worth testing.

## Features

- **6 domains, 83 categories, 500+ checks** — Web, API, Android, iOS, Thick Client, and Web3/Smart Contracts, ordered to follow a real methodology flow (recon → auth → access control → injection → business logic → advanced) rather than a random list.
- **Guided checks** — every item expands into a *How* (step-by-step method), copy-ready payloads/commands, and a reference link.
- **Result tracking, not just checkboxes** — `Not Tested / Clean / Vulnerable / Blocked-N/A`, with a free-text note per item for payloads used and observations.
- **Findings tracker** — marking an item Vulnerable opens a finding form; saved findings live in their own tab and export as a Markdown report.
- **Smart suggestions** — a rule-based engine that recommends the next category in the flow, related deep-dive checks when something is found vulnerable, and WAF-bypass techniques when checks get blocked.
- **Target profiles** — track multiple bug bounty targets independently, each with its own progress and findings.
- **Search** across every check's title and testing guide.
- **Export / Import** progress as JSON for backup or moving between devices.
- **Local-first** — everything is stored in the browser via `localStorage`. No backend, no account, no data leaves your machine.

## Tech Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) — build tooling
- [Tailwind CSS v4](https://tailwindcss.com/) — styling
- [Zustand](https://github.com/pmndrs/zustand) — state management with `localStorage` persistence
- [lucide-react](https://lucide.dev/) — icons

## Getting Started

The app lives in [`bug-bounty-checklist/`](bug-bounty-checklist).

```bash
cd bug-bounty-checklist
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

### Other commands

```bash
npm run build      # type-check and build for production
npm run preview    # preview the production build locally
```

## Project Structure

```
bug-bounty-checklist/
  src/
    types/checklist.ts   # core data model (domains, categories, items, findings, profiles)
    data/                # checklist content, one file per domain
      web.ts
      api.ts
      android.ts
      ios.ts
      thickclient.ts
      web3.ts
      domains.ts         # registry that ties all domains together
    store/                # Zustand store — target profiles, item status/notes, findings
    lib/
      progress.ts         # progress calculations
      suggestions.ts       # rule-based "what to test next" engine
    components/           # UI: sidebar, category/item rows, findings view, suggestions panel
```

## Adding or Editing Checklist Content

Each domain's checks live in its own file under `bug-bounty-checklist/src/data/`. A checklist item looks like:

```ts
{
  id: "web-inject-xss-1",
  text: "Reflected XSS in URL parameters",
  how: "Inject a basic script payload into every reflected parameter and check if it executes unescaped.",
  payloads: ["<script>alert(1)</script>", "\"><svg onload=alert(1)>"],
  severity: "high",
  tags: { relatedItemIds: ["web-inject-xss-2"] }, // optional, drives the suggestion engine
}
```

Item `id`s must stay unique across the whole app (they're the key for saved progress, so avoid renaming an existing id once you've used it).

## Data & Privacy

All progress, notes, and findings are stored locally in your browser (`localStorage`) under a single `bbc-store` key. Nothing is sent to a server. Use **Export progress (JSON)** in the sidebar to back up or move data between browsers/devices, and **Import progress** to restore it.

## Roadmap

- [ ] AI-assisted suggestions and finding-report generation (requires a small backend to keep API keys server-side)
- [ ] Optional cloud sync (Supabase) for multi-device use
- [ ] Custom/user-added checklist items
- [ ] Deploy to a public URL (Vercel/Netlify)

## Disclaimer

This checklist is for authorized security testing only — use it strictly within the scope and rules of engagement of a bug bounty program or an explicitly authorized penetration test.
