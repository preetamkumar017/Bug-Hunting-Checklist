# Claude Autonomous Checklist — XOXNO Lending (Immunefi, Stellar Soroban)

Scope: **smart-contract source review only, local/fork testing only.** Web,
API, frontend, live on-chain interaction are out of scope / prohibited. See
`scope.md`. Status legend in `/CLAUDE.md`.

## Setup / Intel
- [x] Clone https://github.com/XOXNO/rs-lending-xlm into `recon/` (read-only) — commit 5961508, 2026-09-20
- [x] Read docs/explanation/decisions.md (ADR-0004/5/10/11/14/18/19/20 read in full, rest via headings) and threat-model.md (in full) — threat-model's STRIDE register = additional known/accepted risks, treat as dupe list
- [ ] Read Audits & Known Issues (needs user to paste from Immunefi Resources tab)
- [x] Map repo: contracts/ = controller, pool, governance, position-nft, price-aggregator, swap-aggregator, xoxno-oracle, defindex-strategy + common/ (math, oracle, types). ~26k LOC Rust in non-excluded paths
- [-] Dependency / crate CVE check — blocked: cargo/cargo-audit not installed locally (needs user OK to install rustup); upstream crates are also out of scope anyway

## Static analysis (local)
- [ ] Rust static pass: cargo clippy, cargo geiger (unsafe), overflow/unchecked-arithmetic review
- [x] Auth coverage — controller, pool, position-nft (log-5): every controller entrypoint reaches require_auth (require_authorized_caller / liquidator / owner), owner/delegate check uses live NFT owner, delegate grant stamped by owner (documented revival), u64→u32 NFT id via try_from (fail-closed), pool = owner-only (controller), NFT mint/burn/upgrade = controller-only. Nothing found.
- [ ] Auth coverage — governance, price-aggregator, xoxno-oracle, defindex-strategy (not yet reviewed). swap-aggregator done: admin fns #[only_owner], execute_strategy requires sender auth, claim_referral_fees ungated but pays only the stored referral owner (declared in permissionless list).
- [ ] Soroban-specific: storage TTL/archival handling, persistent vs instance vs temporary misuse
- [ ] Soroban-specific: cross-contract call trust, re-entrancy analogues, token-interface assumptions

## Protocol logic review (in-scope impacts)
- [ ] Position NFT authority: transfer/delegate paths, stale delegate after transfer
- [ ] Controller health-factor checks on borrow/withdraw/liquidate/flash/multiply/swap-collateral
- [x] Liquidation math (first pass, read-only, not executed): math.rs, curve.rs, plan.rs, apply.rs, bad_debt.rs, liquidation/mod.rs reviewed (log-6). HF-preserving bonus cap (1+b)·p ≤ HF verified algebraically; under-delivery scaling, credit-share split conservation (fee+liq == seized) and full-close handling consistent. Only ≤1-unit rounding effects, covered by ADR-0003. Nothing found. Not proven by tests/PoC (no toolchain).
- [ ] Interest index / RAY math: rounding drift accumulation, index desync (ADR-0003/0016 excluded unless drift breaks invariant)
- [ ] Supply/borrow cap accounting, isolation/e-mode/spoke risk parameters — invariant violations only
- [ ] Price aggregator: staleness, dual-source agreement, sanity-band logic bugs (feed manipulation itself excluded)
- [ ] Governance: typed proposals, execution delay bypass, role escalation, pause/emergency ratchet flaws
- [ ] Fund freezing paths: permanent freeze of funds/yield, temporary freeze, insolvency vectors
- [ ] Flash loan / flash_position / strategy flows: repayment enforcement, callback abuse

- [x] Swap-aggregator route decoder + execution (log-7): program.rs (5-byte op decoder, index/Prev-chain/weight validation), execute/mod.rs, vault.rs (invocation-local ledger), fees.rs + storage.rs (bucket vs ReservedTotal accounting, sweep_balance), venues/mod.rs, soroswap.rs, aquarius burn/mint/pool. Every credit is a measured router balance delta (hop spent==amount_in exact; LP burn/mint shares and constituents measured), pool-reported values discarded. Hostile caller-chosen pool/token can only fake its own token's balances, cannot inflate a real token's credit or touch fee reserves. Nothing found. Not read in depth: comet.rs, sushi.rs, phoenix.rs, aquarius/swap.rs (thin adapters through dispatch_hop).

## Local testing (fork/local only)
- [ ] Build + run existing test-suite locally
- [ ] Write local PoC harness for any candidate finding (Soroban test env, no network)

## Automation / Triage
- [ ] Check candidate findings against ADR list + known issues (dedupe)
- [ ] Feasibility check per Immunefi standards (rollback, attack cost, griefing)
- [ ] Draft report (POC steps) — **do not submit without user review**

## Blocked / N/A (scope)
- [-] Subdomain/host/port recon — out of scope (smart contract only)
- [-] Frontend / REST API / SDK / keeper testing — out of scope
- [-] Mainnet / public testnet interaction, oracle interaction — prohibited
- [-] Nuclei/CORS/headers/TLS/cloud storage — web items, out of scope
