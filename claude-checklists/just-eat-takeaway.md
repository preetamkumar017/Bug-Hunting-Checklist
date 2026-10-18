# Claude Autonomous Checklist — Just Eat Takeaway.com

Tasks Claude can run on this target **without needing the user to run or
paste anything**, given `scope.md` allows it. See `/CLAUDE.md` at the
workspace root for status legend and update protocol.

**Wide scope (4/4)**: ~16 business-asset domains, 4 Android + 4 iOS apps,
1 GitHub org. Unlike OneTrust, classic org-wide recon fully applies here.

**Blocking rule for ANY active request to a JET host**: every request must
carry `X-Bug-Bounty: <bugcrowdusername>`. **Need user's Bugcrowd username
before active testing starts.** Passive-only recon (crt.sh, public DNS,
GitHub) doesn't require it and can proceed now.

## Recon (passive + active)

- [x] Subdomain enumeration (crt.sh passive, per in-scope wildcard domain) —
  done 2026-09-19. Queried all 20 in-scope wildcard domains via crt.sh,
  208 unique valid hostnames saved to `recon/crtsh_subdomains_raw.txt`.
  Interesting ones (dev/staging/admin/payments/vpn-looking) are noted in
  testing-log. Passive only — no request was sent to any JET host.
  Reminder: live-host/tech-fingerprint follow-up on these still needs the
  X-Bug-Bounty header first.
- [ ] Live host detection + tech fingerprint (httpx) — **blocked** until
  X-Bug-Bounty header value (username) is known
- [ ] Subdomain takeover check (dangling CNAMEs) — note: scope explicitly
  excludes reward for takeover *without proof of exploitation*, so only
  pursue if we can actually demonstrate exploitation, not just flag dangling CNAMEs
- [-] Port scanning / service enumeration — likely behind CDN for most
  brands; skip unless a host resolves to non-CDN IP
- [ ] DNS enumeration (records, wildcard, CAA) — SPF/DKIM/DMARC out of
  scope for reward, but general DNS/wildcard mapping still useful for recon
- [-] ASN/IP range discovery — no explicit IP-range scope given; skip

## Content Discovery

- [ ] URL/endpoint gathering (katana/gau/waybackurls) — needs X-Bug-Bounty header, blocked
- [ ] Directory/file brute-force — needs header, blocked; also rate-limit bypass attempts are explicitly out of scope, keep any brute-force low-rate and non-aggressive
- [ ] JS file analysis (hidden endpoints, secrets, feature flags) — needs header, blocked
- [ ] Parameter discovery — needs header, blocked

## Vulnerability Scanning

- [ ] Known CVE/misconfig scan (nuclei) — blocked, needs header + explicit user go-ahead given breadth
- [-] TLS/SSL config check — explicitly out of scope (best practices)
- [ ] CORS misconfiguration check — in scope if demonstrates real impact; blocked on header
- [ ] Exposed sensitive files (.git, .env, backups, configs) — blocked on header
- [-] Security headers check — explicitly out of scope (best practices: HSTS/CSP)
- [ ] Basic SSRF/open-redirect pattern testing — **note: open redirects are
  explicitly marked informative/closed, not rewarded** — deprioritize;
  SSRF still valuable
- [ ] Cloud storage misconfig (S3/GCS/Azure blobs) — note: "public buckets
  with static content/sourcemaps/generic info disclosure" explicitly
  excluded — only pursue if bucket contains actual sensitive data, not just
  publicly-listable static assets

## Code-level (source/APK available)

- [x] Static code review of public GitHub org repos (`github.com/justeattakeaway`) —
  done 2026-09-19. Org has 23 public repos, mostly well-maintained OSS
  libraries (pie design system, JustSaying, JustEat.StatsD, etc.).
  - **GitHub Actions review**: checked all `pull_request_target` usages
    (6 found, all `dependabot-approve`/`dependabot-changeset`/`labeler`
    workflows). All properly gate on `github.event.pull_request.user.login
    == 'dependabot[bot]'` and/or `head.repo.full_name == github.repository`
    before doing anything privileged, and `actions/checkout` is SHA-pinned
    in the security-sensitive ones. No obvious "pwn request" pattern found
    (no case of untrusted PR code executing with secrets/token exposed).
    One unpinned third-party action found: `trufflesecurity/trufflehog@main`
    in miro-plugin-tag-crawler — low-risk (ironic: it's the secret-scanner
    action itself, tag-following @main is against best practice but that
    workflow doesn't touch secrets).
  - **Secret scanning**: grepped working tree + full commit history
    (git log -p) of the 7 smaller/less-maintained repos (android-deep-links,
    ApplePayJSSample [746 commits], bq-sql-antipattern-checker,
    miro-plugin-tag-crawler, scoober-code-challenge-boilerplate,
    skipthedishes-react-test, ui-coding-exercise) for AWS keys, private
    key blocks, Slack/GitHub/Google tokens, DB connection strings. **Clean
    — no hits.** ApplePayJSSample's cert-generation test code uses only a
    dummy self-signed cert with a placeholder password, not a real credential.
  - Did not deep-scan the larger active repos' (pie, JustSaying, etc.) full
    git history — these are heavily-maintained OSS projects with existing
    scorecard/CodeQL/trufflehog-style scanning already in their own CI
    (saw ossf-scorecard.yml, codeql.yml); lower marginal value there.
    Could revisit with a proper trufflehog/gitleaks run if time permits.
- [x] Android APK decompile + review — done 2026-09-19, 3 of 4 apps (Skip
  not available on Play Store from this region — Canada-only, deferred).
  User installed via emulator + Play Store login, apps pulled with `adb
  pull` (official Play-installed binaries, not a third-party mirror),
  decompiled with jadx + apktool. Covered: Takeaway.com
  (`uk.takeaway.android`), Just Eat (`com.justeat.app.uk`), 10bis
  (`com.tenbis.tbapp`), + bonus Just Eat Israel (`com.tenbis.justeat`,
  also in the 10bis.co.il ltd. in-scope developer account).
  - **Exported components**: Takeaway.com has 28 exported
    activities/services/receivers (10bis: 14, Just Eat Israel: 16).
    Notable no-permission exported activities: `GlobalDeepLinkDispatcherActivity`
    (BROWSABLE + real URL schemes like `just-eat-uk://` — **1-click
    reachable from any web link/QR/message, no app interaction needed**),
    `WebViewActivity`, and payment-flow activities
    (`InitiateOnlinePaymentWebViewActivity`, `PaymentsNativePollingPageActivity`,
    `CustomerDetailsActivity`) — these last ones use an internal
    `dispatcher://` scheme (not BROWSABLE, not web-reachable, only
    reachable by another app crafting the exact Intent).
  - **Deep link dispatcher investigated** but the actual routing/validation
    logic is heavily obfuscated (R8) and delegates through a coroutine
    chain into `com.justeat.links.a` (DeepLinkRouterController) and the
    Branch.io SDK — could not confirm a concrete open-redirect/auth-bypass
    without much deeper RE or dynamic testing (sending crafted deep links
    via `adb shell am start` on the emulator — legitimate PoC method, not
    "requiring ADB access" as an attack since it just simulates a browser
    click). **Flagged to user, not yet pursued further — needs a decision
    on whether to invest more RE/dynamic-testing time here.**
  - **Secrets scan**: grepped all 4 apps' decompiled sources for AWS keys,
    private key blocks — clean (one hit was AWS SDK's generic PEM-string
    builder code, not a real key). Checked manifests for API keys:
    - Google Maps API key `AIzaSyCbQNtyQ_oUXFA2MpRQXjMk9lq2SGwclDw` is
      **hardcoded and identical across both Takeaway.com and Just Eat UK**
      apps — expected practice for Maps SDK (meant to be client-side), but
      only safe if properly *restricted* (Android app + SHA1 fingerprint,
      and to Maps-only APIs). **Did not test the key's restrictions myself**
      (calling Google APIs with someone else's key, even to test, uses
      their billing/quota without authorization) — flagging to user to
      check via Google Cloud Console-style key testing, or to report as-is
      if they want to test restriction status themselves.
    - Branch.io SDK keys found in 10bis (`key_live_...`, `key_test_...`) —
      not a leak, Branch keys are public-by-design (like Maps keys); the
      actual Branch *secret* is server-side and wasn't found.
  - Not yet done: insecure local storage check (SharedPrefs/SQLite dumps
    would need the app actually run + used on the emulator, i.e. dynamic
    testing), full manual code review of checkout/payment flow logic.

## Dynamic testing (Frida + mitmproxy) — 2026-09-19

- [x] SSL pinning bypass + traffic capture on Takeaway.com, on a rooted
  emulator (`pentest_rooted` AVD), reusing eToro's frida-server/CA cert/
  bypass script. Genuine Play-installed APK sideloaded via `adb install`
  (not a fresh Play Store install on this AVD, since it lacks Play Store —
  same binary already obtained legitimately). System trust store updated
  with mitmproxy CA (root access), OkHttp CertificatePinner + TrustManagerImpl
  hooked. Result: successfully decrypted `features.api.justeattakeaway.com`,
  `legal-pages-api-production.je-apis.com`, `jabo.iad.appboy.com` (Braze).
  Some third-party SDK traffic (Branch.io, Usabilla) still failed TLS —
  likely a separate native/non-Java TLS stack not covered by our hooks.
- [!] **Finding: hardcoded OAuth2 `client_credentials` secret**, confirmed
  two independent ways:
  1. Live capture: app sends `Authorization: Basic
     NDA0OTVjNWU4MGJlOGI1ZmI0Y2I1MzcyZTJkYjRiMWU6NjI0NzE5ODMtMmYyYS00ODNiLWJiMGUtZDhhOWEyMDVlN2Jh`
     (decodes to `client_id: 40495c5e80be8b5fb4cb5372e2db4b1e`,
     `client_secret: 62471983-2f2a-483b-bb0e-d8a9a205e7ba`) to
     `POST https://auth.just-eat.co.uk/connect/token` with
     `grant_type=client_credentials&scope=consumer_apis&tenant=uk`.
  2. Decompiled source: the exact same string literal
     `"40495c5e80be8b5fb4cb5372e2db4b1e:62471983-2f2a-483b-bb0e-d8a9a205e7ba"`
     is hardcoded in `defpackage/ys1.java` (compiled from `AppConfiguration.kt`),
     confirmed present identically **across every country-brand config**
     (checked UK, PL, BE, ES, LU, AT, DE, IT, CH, BG, SK, NL, IE — all use
     the same secret with only the tenant slug/currency/URLs differing).
  - **Could not obtain a working access token to verify real impact**:
    tried (a) via our MITM proxy, (b) via direct curl with the
    X-Bug-Bounty header and matching headers, (c) via the real app on our
    test device with **no proxy/interception at all** — **all three** hit
    the identical Cloudflare bot-management response
    (`cf-mitigated: challenge`, `server: cloudflare`, `__cf_bm` cookie).
    Since even the un-intercepted app on our own device gets this,
    it isn't specifically about our MITM tooling — Cloudflare's
    bot-management here is evidently blocking on TLS-client-fingerprint
    grounds broader than "is this exactly a production device". Did not
    attempt to defeat this (JA3 spoofing / solving the challenge) — that
    would cross into "bypassing bot-detection," which is off-limits.
  - **Also tried via a real Chrome browser** (claude-in-chrome) at the
    user's suggestion — navigated straight to `auth.just-eat.co.uk`.
    Cloudflare's "Just a moment..." auto-JS-challenge appeared, then
    escalated to a **hard WAF block** ("Sorry, you have been blocked")
    within seconds — our IP/session had accumulated enough anomaly
    signals across all 3 earlier attempts. Stopped here; did not try to
    route around the block (VPN/IP rotation etc. would be evading
    bot-detection).
  - **Net assessment**: the secret's presence/hardcoding is fully
    confirmed (two independent methods: live capture + decompiled
    source). Real-world abusability is **genuinely unverifiable** — not
    a gap in our testing, but because the target's WAF actively and
    effectively blocks this exact reuse pattern. This needs honest,
    non-overclaiming wording in any report (per program's own
    "professional/neutral wording" and "demonstrate clear
    exploitability" guidance) — recommend reporting as a confirmed
    secrets-leakage finding (explicitly a named mobile focus area) with a
    transparent note that live reuse is Cloudflare-mitigated. Flagged to
    user; not submitting anything without their review/wording.
  - **Follow-up static analysis (what does the credential grant?)**:
    found `AuthenticationParams.kt`/`z53.java` — real user logins request
    scope `"openid mobile_scope offline_access"`, a *different* scope
    from our leaked credential's `consumer_apis`. Found
    `KongTokenRequestParams.kt`/`eun.java` — confirms via its own error
    string ("Kong Client ID is required for SmartGateway connection")
    that this is a **Kong API-gateway service credential** (app-to-
    infrastructure auth), not a user-session token. Known endpoints using
    it (geocode, address autocomplete) are public/anonymous-tier data.
    **Assessed likely severity: P3/P4 range** — real finding, named focus
    area, but probably not high-impact without evidence it unlocks
    anything beyond already-public data. Communicated this honest
    assessment to user before any reporting decision.
  - **[x] SUBMITTED 2026-09-19, closed Not Applicable 2026-09-20** —
    Bugcrowd submission ID `aaad1628-351d-4e4c-85b7-463b46000bb5`, target
    "Just-Eat Holding Limited", VRT "Sensitive Data Exposure > Sensitive
    Data Hardcoded". Triager (`jan_bugcrowd`) closed as Not Applicable:
    "credentials/API keys found on a webpage require a demonstrated
    impact... this report lacked impact." No reward. This was the
    anticipated risk flagged before submitting. Program invites
    resubmission if impact can later be demonstrated. See
    `evidence/hardcoded-oauth-secret/REPORT.md` and `testing-log.md`.
  - **Bonus recon value**: the same source dump revealed the app's full
    internal backend endpoint map across all brands, including several
    in-scope hosts: `*.jet-external.com` (in scope), the TakeawayPay
    payment gateway (`takeawaypay-consumer-apigateway.azurewebsites.net`,
    `consumer.takeawaypay.com/pay`), `hygieneratingscdn.je-apis.com`,
    `i18n.api.just-eat.io`, `menu-globalmenucdn.justeat-int.com`. Useful
    map for when active testing on these hosts is unblocked.
  - Also present in the same config dump: per-brand Facebook App ID +
    Client Token pairs (standard numeric ID + 32-char hex token) — **not
    a finding**, Facebook's own design has these as public/client-embedded.
    One additional shared GUID (`50158598-42d0-41e4-aaff-9c5419c82215`,
    identical across all brands) of unclear purpose — not chased further,
    low priority next to the confirmed OAuth secret.
- [-] iOS IPA teardown — can't easily download .ipa without a jailbroken
  device/Apple ID purchase flow; mark blocked unless user has an existing
  extracted IPA or App Store account. Static metadata via App Store page
  only.
- [ ] Dependency/library CVE check — for whichever public repos are pulled in Android decompile

## Automation / Triage

- [ ] Findings dedupe + severity prioritization — remember: same vuln
  across domains/subdomains sharing a codebase = duplicate; note affected
  instances in ONE report instead
- [ ] Draft report (PoC steps) — **do not submit without user review**;
  program explicitly rejects AI-generated reports lacking real
  research/validation or containing hallucinations — every claim needs a
  verified, working PoC first
- [ ] Diff against previous scan (new subdomains/endpoints/repos since last session)

## Blocked — needs user action

- [!] **Bugcrowd username needed** for the mandatory `X-Bug-Bounty:
  <username>` header — required on every active request to any in-scope
  host. Nothing beyond passive recon (crt.sh/DNS/GitHub) can proceed
  without this.
- [!] **App credentials**: sign-up requires a `@bugcrowdninja.com` email
  address per program page. Need user to provide this / do the signup for
  any auth-gated business-logic testing.
- [!] iOS app static analysis needs either an existing .ipa file or an
  Apple ID capable of downloading the apps — flag to user if iOS coverage
  is wanted.
