# Correction and method-review record

## Scope

The original 645 checks were source-reviewed across all 11 domains. Six checks were added, resulting in 651 checks, 122 categories and 724 methods. All checks have a controlled, item-guided baseline method; 73 selected web/API/AI checks also have a focused evidence recipe. More methods are not automatically better: unrelated SQL, HTTP and DNS recipes have been removed rather than multiplied.

**No external target, mobile device, AD deployment or smart-contract attack lab was exercised.** Source-reviewed methods still require the actual endpoint, grammar, tool version, privileges and fixture. The application does not mark any shipped method `lab_verified`.

## Reproduce the checks

From the project directory:

```sh
npm test
npm run audit:content
npm run lint
npm run build
```

The regression suite uses Node's test runner and the installed Vite TypeScript loader. No additional test framework is required. It runs the application modules in memory with fake localStorage; shell quoting is checked against a local function stub, never against a target endpoint.

The coverage audit writes `reports/method-coverage.json`, with one row per check: domain/category/item IDs, reference, route, method titles, verification level, prerequisites, evidence, limitations, safety and structural defects. The output is deterministic and contains shipped educational content only—not engagement notes, credentials or user profiles.

## Corrections

- Runtime-validated imports and stored state; ID collisions import separately; bad storage is never silently replaced.
- Storage-first transactions, visible quota/conflict errors, bounded image uploads and non-destructive legacy recovery.
- Profile-keyed editing contexts prevent notes, scope, scratchpad and finding drafts from crossing target boundaries.
- Custom checks work in built-in categories; deletion removes orphan progress while retaining historical findings.
- Consistent effective-catalogue counts; searchable payloads, explanations and saved notes; React-driven category navigation.
- Shell-safe cURL, explicit text-replay limitations, duplicate HTTP values and original request targets retained, TLS verification by default.
- HTML report escaping, raster-image validation, restrictive CSP and isolated opener handling.
- Report drafts separate observed evidence from demonstrated impact, accept legitimate informational observations and do not invent exploitation results.
- CVSS 4.0 approximation replaced with FIRST macrovector/interpolation scoring; parsers explicitly support base vectors only.
- UTF-8 MD5, strict hex, JWT expiry/structure and context-qualified mutation utilities.
- Recon, resilience, cloud and forensic observations separated from proven unauthorized access or action.
- SameSite/CORS/TRACE, protocol examples, metadata controls, CI permissions, OWASP GenAI taxonomy, mobile platform controls, Java sandbox assumptions and Web3 signatures/permissions corrected.

## Content architecture

- `src/data/*.ts` contains stable category/item IDs and primary descriptions/examples.
- `src/lib/playbookStrategies.ts` explicitly maps all built-in domain/category IDs. No substring such as `inject` selects SQL testing for an AI check.
- `src/lib/playbookRecipes.ts` assigns focused recipes to exact domain/category/item tuples. Unknown and custom checks cannot acquire an unrelated recipe through their names.
- `src/lib/playbooks.ts` preserves authored methods and supplies missing safety/evidence metadata. Methods needing configuration are labelled accordingly.
- For seven legacy domains, `src/lib/contentReview.ts` and `src/lib/extendedContentReview.ts` contain exact-ID semantic corrections applied before exported content is consumed. These overlays are authoritative; do not edit only the superseded literal. Prefer consolidating a future edit into the data file and deleting the matching overlay entry.
- `auditOwnedContent()` records original/effective mechanical defects and fields changed by overlays. It does not claim that passing structural assertions proves every technical statement. Missing payload notes are not silently fabricated.
- `TestingMethodsModal` displays prerequisites, steps, evidence, limitations, safety and review status. A negative control is not a blanket “safe” verdict.

## Scoring provenance

CVSS 4.0 base scoring is adapted from FIRST's reference calculator revision `c5b0d409ae9f57c44264c6ce5f27d89298e1d32a`. The implementation agent compared all 104,976 base vectors against that pinned reference with no mismatches. The checked-in offline regression suite exhaustively checks bounds/round-trips for all base vectors and includes known scores; bounds alone are not independent conformance proof.

The FIRST BSD-2-Clause attribution and full licence notice are retained in `src/lib/cvss4Reference.ts`. CVSS is owned by FIRST and used by permission. See https://www.first.org/cvss/v4-0/specification-document and https://github.com/FIRSTdotorg/cvss-v4-calculator.

## Current verification outcome

- `npm test`: 14 regression groups passed, including all 651 catalogue entries and 104,976 CVSS4 base combinations.
- `npm run audit:content`: 651 checks, 724 methods, 73 additional-recipe checks, zero structural issues, zero lab-verified claims.
- `npm run lint`: passed without warnings in the final integrated implementation.
- `npm run build`: TypeScript and production bundling passed; a large initial chunk warning remains.
- Local dev endpoint `/checklist/` returned HTTP 200. Built-in browser opening timed out before creating a tab, so visual interaction/accessibility smoke testing is **not claimed as passed**.

## Manual smoke checklist

Use a disposable browser profile and synthetic data:

1. Open Methods on AI prompt injection, AD reconnaissance, binary hardening, iOS storage and a Web3 check. Verify the methods use that domain's interface, not an unrelated HTTP/SQL recipe.
2. Open IDOR, XSS, SSRF, OAuth, CORS, JWT and cache checks. Verify the additional recipe and source-review labels; tab through controls and dismiss with Escape.
3. Create targets A/B, edit scope/scratchpad and a finding draft in A, then switch to B. No A draft should appear in B. Reload to confirm saved data.
4. Add a custom check to a built-in category, mark it, bookmark it, rename/delete it, and confirm counts. Blocked checks must not count as completed tests.
5. Import malformed JSON, conflicting profile IDs and a profile with hostile image/reference values. Confirm useful rejection/copy behavior without losing the existing profile.
6. Export a report with literal HTML characters in evidence; it must remain text. Remove saved screenshots and check storage-error handling. Backup before testing real storage exhaustion.
7. Paste an HTTP fixture with duplicate query parameters, literal `$()` text and a body beginning with `@`. Generated cURL must quote literals; Nuclei must retain the raw target; Python must refuse unsupported repeated headers.
8. Try an informational report with bracketed evidence and a completed fact-based description. It should require evidence confirmation but not inflated severity.

## Remaining limits / maintenance work

- Domain content is still eagerly available for global search; lazy tool loading reduces initial code but the main bundle remains over Vite's 500 KB warning threshold. Further content-index/domain splitting is a performance follow-up, not a correctness claim.
- Legacy semantic correction overlays remain for seven domains. They are tested and documented, but consolidating them into source literals is future maintainability cleanup.
- Screenshot validation bounds size, MIME, canonical encoding and raster signatures; it is not a full image decoder. Storage is local but not encrypted.
- Cross-tab conflict detection is best-effort, not an atomic multi-tab database transaction.
- Burp/Caido import compatibility and Nuclei execution are explicitly unverified. Replay scaffolds are not vulnerability detections.
- Browser-specific controls, provider claimability, framework gadget chains, mobile hooks, contract invariants, AD protocols and performance/DoS claims require separately authorized, version-matched fixtures.
- Passing tests proves the covered software behavior and structural invariants. It does not prove every educational example works on every target, nor guarantee bounty acceptance or payment.
