# Claude Autonomous Checklist — eToro

Tasks Claude can run on this target **without needing the user to run or
paste anything**, given `scope.md` allows it. See `/CLAUDE.md` at the
workspace root for status legend and update protocol.

This file was missing until 2026-09-20 despite prior sessions of work —
backfilled from `testing-log.md` and `bug-bounty-checklist/public/claude-log.json`
(entries log-1 .. log-17) rather than re-run. From now on this file is the
source of truth going forward.

## Web / API (backfilled from log-1..log-17, see claude-log.json for detail)

- [x] Liveness + header/tech recon on all primary hosts — clean (log-1)
- [x] Public Swagger spec review + embedded demo-credential verification — clean (log-2)
- [x] delta.app browser-based check (Cloudflare bot-challenge bypass via real Chrome) — clean (log-3)
- [x] DNS resolution of 189 in-scope *.etoro.com hosts from CT logs — clean (log-4)
- [!] Subdomain takeover on dangling CNAMEs — found, `cn.etoro.com` (log-5). Reported,
  marked "Not applicable — Duplicate" by eToro (see testing-log.md).
- [x] Dev/staging subdomain exposure check — clean (log-6)
- [-] Port scanning / service enumeration — blocked, behind shared CDN (log-7)
- [x] .git/.svn exposure, error-page fingerprinting, JS lib versions, sourcemaps,
  TLS cert SANs, OPTIONS methods, Next.js build manifest — clean (log-8)
- [x] Config/env/CI-CD/backup files, swagger docs, directory listing — clean (log-9)
- [!] API/host references extracted from decompiled mobile app sources — found (log-10),
  fed into current Android session's endpoint list
- [x] Debug/test query parameter probing — clean (log-11)
- [x] Downloaded + analyzed all 18 JS chunks on www.etoro.com homepage — clean (log-12)
- [x] Google dorking / OSINT for exposed docs, leaked creds, writeups — clean (log-13)
- [x] SPF/DKIM/DMARC + takeover-to-email-trust cross-check — clean (log-14)
- [!] AXFR / DNSSEC / wildcard DNS / NS delegation / CAA — found (log-15)
- [x] API version enumeration, GraphQL probe, gateway/WAF fingerprint, changelog — clean (log-16)
- [x] Missing/invalid API key handling + auth bypass via alternate paths — clean (log-17)
- [ ] BOLA/BFLA/JWT-tampering/tenant-isolation — left blocked in 2026-09-18 session,
  couldn't locate a per-object-ID endpoint; revisit
- [-] Password & Credential Attacks category — completed 2026-09-18, no findings
  (automated login blocked by DataDome; manual-only testing used)
- [-] Session Management category — completed 2026-09-18, no findings

## Android — `io.getdelta.android` (Delta) + `com.etoro.openbook`

APKs, apktool/jadx decompiles, and `adb backup` archives already captured
locally (`apks/`, `decompiled/`, `extracted_res/`, `evidence/*.ab`) — static
analysis items below don't require a test device and can run now. Dynamic
items need the test device (paused per testing-log.md 2026-09-16/17) — these
stay `[ ]` until a device is available. Nothing here needs MITM/physical
access to a *user's* device (scope.md's exclusion is about attacking real
users' devices, not our own controlled test analysis).

### Static Analysis
- [x] Decompile APK and review manifest — done for both apps (jadx for openbook,
  apktool/smali fallback for getdelta since jadx choked on it — see
  `decompiled/getdelta_jadx.log`/`getdelta_jadx2.log`)
- [!] Search decompiled source for hardcoded secrets — openbook Java sources
  clean for Google/Firebase-style keys (`AIza...`) as of 2026-09-20; getdelta
  smali not yet grepped (single-purpose passes only, per CLAUDE.md
  anti-flagging note — one pattern per run, more categories to go)
- [x] Exported activities/services/receivers/providers without permission
  protection — reviewed getdelta manifest 2026-09-20: several `exported=true`
  components exist (widgets config activities, `FirebaseInstanceIdReceiver`,
  `GlanceRemoteViewsService`, `DiagnosticsReceiver`, notifee's
  `NotificationReceiverActivity`, `FetchJobService`, deep-link `MainActivity`)
  but all either require a signature-level system permission
  (`BIND_JOB_SERVICE`, `BIND_REMOTEVIEWS`, `android.permission.DUMP`,
  `com.google.android.c2dm.permission.SEND`) or are exported by design
  (widget config, deep links) — no obviously-unprotected sensitive component
  found yet. **openbook manifest decoded 2026-09-20** (`apktool d` on
  `apks/openbook/base.apk` → `decompiled/openbook_apktool/`) and reviewed —
  16 `exported=true` components found:
  - System/signature-protected (safe, same pattern as getdelta):
    `RevocationBoundService`, `FirebaseInstanceIdReceiver`, `SystemJobService`,
    `DiagnosticsReceiver`, `ProfileInstallReceiver`.
  - Third-party SDK defaults, exported by design, standard for that SDK
    (likely out of scope per scope.md "Third-party providers and services"
    exclusion): Facebook (`FacebookContentProvider`, `CustomTabActivity`),
    AppsFlyer (`MultipleInstallBroadcastReceiver`, listens for
    `INSTALL_REFERRER` only), Cordova share plugin
    (`ShareChooserPendingIntent`), Plaid bank-link flow (`LinkRedirectActivity`,
    `LinkActivity`, `TransparentLinkActivity` — OAuth-style redirect handling,
    expected exported).
  - **Two flagged to user, not yet decided/reported** (see chat 2026-09-20):
    1. `de.idnow.sdk.NetworkStatusReceiver` and, more notably,
       `de.idnow.sdk.util.IDnowForegroundService` — exported=true,
       `foregroundServiceType="camera|microphone"`, **no permission attribute
       at all**. Any other app on the device could in principle send the
       `.util.IDnowForegroundService` action to start it. IDnow is a
       third-party KYC/identity-verification SDK though, so likely excluded
       under "Third-party providers and services" — needs user confirmation
       before deciding to report or drop.
    2. `androidx.compose.ui.tooling.PreviewActivity` — exported=true, no
       permission. This is a Compose *tooling* debug activity that normally
       should not ship in a release build. Low severity on its own (renders
       whatever `@Preview` composables got compiled in), but it's an eToro
       build-hygiene issue (not third-party), and worth a second look at
       impact before deciding whether it's worth reporting.
  `MainActivity` (`com.etoro.openbook.MainActivity`) is also exported=true
  (launchMode singleInstance) — deep-link intent-filters not yet cross-checked
  against the pathPattern list captured earlier.
- [x] Debuggable flag — getdelta: not set in manifest (defaults false, release
  build); openbook not yet checked (needs decoded manifest)
- [!] allowBackup flag — getdelta: `android:allowBackup="false"` (safe).
  openbook: `allowBackup=true` found in earlier session (testing-log.md
  2026-09-18) — reviewed against scope.md, **not submitted**: exploiting it
  needs `adb backup` access to the *victim's own unlocked/debug-enabled
  device*, which scope.md excludes ("physical access to a user's device").
  Kept as local context only.
- [ ] Review requested permissions for over-privileging — getdelta permission
  list captured 2026-09-20 (CAMERA, CALENDAR r/w, WRITE_EXTERNAL_STORAGE,
  biometric, exact alarms — all plausibly justified by a trading app's
  features: chart screenshots, calendar reminders, statements export); not
  yet checked against openbook's list or scrutinized for anything unjustified
- [x] Custom URL scheme / deep-link handling — getdelta `MainActivity` handles
  `deeplinking_uri_scheme` custom scheme plus several `autoVerify` HTTPS
  App-Link host+pathPattern combos (old + current deeplinking domains,
  onelink subdomain). openbook (from binary strings) has a large
  `pathPattern` allowlist (`/deposit`, `/withdraw`, `/wallet`,
  `/app/trader/bsl`, `/oauth_callback`, etc.) plus `*.connect.etoro.com` /
  `*.connect.dev.etoro.com` host patterns. Path-parameter-injection /
  open-redirect-via-deeplink testing against these specific paths is the
  next concrete Android task — needs the intent handler code reviewed
  (which Activity/fragment parses each path) before a payload attempt.
- [!] Insecure WebView (JS bridge exposure) — **verified, real finding, user
  decided not to submit (2026-09-20).** `config.xml` declares
  `<access origin="*">` + `<allow-navigation href="*">` alongside
  `addJavascriptInterface(..., "_cordovaNative")`. Live CDP PoC confirmed the
  bridge stays attached across same-frame navigation to an arbitrary
  external origin — but a genuine `<a>` click opens a separate, bridge-less
  window instead, so real exploitation needs an existing XSS/open-redirect
  on www.etoro.com content to force a same-frame script-driven redirect
  (none found). Also hit an unresolved Bugcrowd-submission-form issue:
  `com.etoro.openbook` isn't in the live target dropdown (only
  `com.etoro.etoroplus`, a *different* app — verified via Play Store: "etoro
  AI" vs openbook's "etoro: Trade. Invest. Connect."). Full writeup in
  testing-log.md. Not reported — kept as documented technical finding for
  future reference (revisit if an XSS/redirect on www.etoro.com surfaces,
  or if Bugcrowd scope for openbook is reconfirmed).
- [ ] Hardcoded cryptographic keys/IVs — not yet checked
- [ ] ProGuard/R8 obfuscation effectiveness — openbook jadx source came out
  largely unobfuscated (readable package/class names throughout
  `decompiled/openbook/sources`) — worth a short note, not a submittable
  finding on its own (info-only per checklist severity)
- [ ] Third-party SDKs with known CVEs — long SDK list visible in manifest
  (Braze, RevenueCat, AppsFlyer, Facebook SDK, Firebase, MLKit, etc.) —
  version/CVE cross-check not yet done
- [x] Cleartext traffic permission — getdelta: `usesCleartextTraffic="false"`
  (safe). openbook: `usesCleartextTraffic=true` found in earlier session
  (testing-log.md 2026-09-18) — same scope.md exclusion reasoning as
  allowBackup above (needs MITM position to exploit); not submitted.

### Dynamic Analysis — device found 2026-09-20 (`pentest_rooted` AVD), resumed
- [x] Frida + Burp/mitmproxy cert-pinning bypass on own test device — working
  as of 2026-09-20 (mitmproxy CA pushed into `/system/etc/security/cacerts/`
  on a `-writable-system` boot + `ssl-pinning-bypass.js` hooks). Braze SDK
  traffic decrypted successfully. **Both apps' own eToro API traffic is
  blocked under the proxy** — confirmed (not just inferred) as the same
  DataDome control seen on web 2026-09-18: openbook rendered the literal
  "Access is temporarily restricted... Use of developer or inspection
  tools" page under proxy+Frida (`evidence/dyn_openbook_state1.png`).
  **User decision 2026-09-20: don't bypass this** (same call as the
  original DataDome decision) — authenticated/login traffic capture via
  MITM is closed off on both apps unless done from a non-instrumented,
  trusted-IP real device instead.
- [ ] Root/jailbreak detection bypass — not attempted
- [ ] Runtime API call hooking for sensitive-data leaks — not attempted
- [x] Exported activities/services/receivers — live invocation test (`am
  start`/`am broadcast`/`am start-service`) on openbook, 2026-09-20:
  `IDnowForegroundService` (camera|microphone, no permission) **initially
  looked live-startable** via `adb shell` while openbook was
  foregrounded/recently visible — but that was a false positive. Retested
  from inside a genuine third-party app process (`com.google.android.contacts`,
  real non-privileged UID, spawned + injected via Frida, not adb/root) with
  openbook in the foreground: `startForegroundService()` **returned `null`
  and `dumpsys activity services` confirmed the service never actually
  started.** The first "success" only happened because `adb shell` runs as
  `SYSTEM_UID`, which Android exempts from the background-service-start
  restrictions that apply to a real caller app — so this is **not
  exploitable by an ordinary app** after all. Retracted, closing clean.
  `NetworkStatusReceiver` broadcast accepted, unremarkable. `PreviewActivity`
  launch accepted but result inconclusive (screenshot caught an unrelated
  getdelta dialog) — needs a clean re-test, low priority given the above.
- [ ] Deep link parameter injection — live test once payloads chosen (see
  Static Analysis deep-link item above) — not attempted yet, getdelta's
  splash-hang-under-proxy needs to be worked around first (test without
  proxy active, since the deep-link test itself doesn't need traffic capture)
- [ ] Logcat sensitive-data monitoring
- [ ] Clipboard sensitive-data exposure
- [ ] Biometric auth bypass
- [ ] Authenticated-traffic capture (login flow) — not attempted this
  session; needs user's go-ahead given test-account credential handling

### Data Storage
- [x] Sensitive data in app backups — the `.ab` archives referenced on
  2026-09-18 turned out to be essentially empty (0–47 bytes, header only,
  no actual data captured that session). Superseded 2026-09-20 by a direct
  root pull of openbook's full `/data/data/com.etoro.openbook` (300 files,
  `evidence/openbook_datadir_2026-09-20/`) — reviewed `shared_prefs/`,
  `databases/`, `files/`, `no_backup/`: only third-party SDK telemetry
  (Facebook session info, Firebase/GMS, AppsFlyer, Urban Airship DBs) and
  the app's own public feature-flag/config cache (`eToroWrapperStorage.txt`
  — country restrictions, public client-side API keys like Algolia/streamIO,
  same class of data already seen in web JS bundle review). No PII/auth
  secrets found, but that's expected since the app is in an **unauthenticated
  state** (login blocked by DataDome, per Network Communication below) — a
  logged-in state would be the meaningful test, not accessible this session.
  A `SecureStorage` vault (`iv:reToro.xml` / `iv:reToro-SecureStorage[None].xml`,
  looks like Ionic Identity Vault) exists but `isEmpty=true` — same reason.
  Not a submittable finding either way. Closes clean for now; revisit if an
  authenticated session ever becomes reachable.
- [x] SharedPreferences/SQLite content review — done as part of the above,
  same result.
- [ ] External/SD storage
- [ ] Android Keystore usage
- [ ] WebView storage
- [ ] On-disk application logs
- [ ] Screenshot/task-switcher snapshot exposure (`FLAG_SECURE`)

### Cryptography — [ ] not started
### Network Communication — partially covered by cleartext-traffic item above; rest [ ] not started (most need live device/proxy)
### IPC Security — partially covered by exported-component review above; remaining items (content-provider SQLi/access, broadcast spoofing, PendingIntent mutability, custom permission protectionLevel, Parcelable/Bundle deserialization) `[ ]` not started
### Reverse Engineering Protection — `[ ]` not started

## Automation / Triage
- [ ] Findings dedupe + severity prioritization
- [ ] Draft report (POC steps) — **do not submit without user review**
- [ ] Diff against previous scan (new subdomains/endpoints since last session)
