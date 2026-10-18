# Claude Autonomous Checklist — FarmHonest

Static-analysis-only engagement (see `scope.md` — no authorization for live
server interaction). Items below are scoped down accordingly; anything that
requires a live request is marked `[-]` blocked.

## Recon (passive + active)

- [-] Subdomain enumeration — blocked, requires active probing of a live target with no authorization
- [-] Live host detection + tech fingerprint (httpx) — blocked, live requests
- [-] Subdomain takeover check — blocked, live requests
- [-] Port scanning / service enumeration — blocked, live requests
- [-] DNS enumeration — blocked, live requests
- [-] ASN/IP range discovery — blocked, live requests

## Content Discovery

- [-] URL/endpoint gathering via crawling — blocked, live requests. Endpoints instead extracted statically from decompiled code (see Code-level section).
- [-] Directory/file brute-force — blocked, live requests
- [x] JS/native code analysis for hidden endpoints, secrets, feature flags (static, from decompiled APK) — see Code-level section (API URLs, keys).
- [-] Parameter discovery (arjun/paramspider) — blocked, live requests

## Vulnerability Scanning

- [-] Known CVE/misconfig scan (nuclei) — blocked, live requests
- [-] TLS/SSL config check — blocked, live requests (network security config reviewed statically instead, see Code-level)
- [-] CORS misconfiguration check — blocked, live requests
- [-] Exposed sensitive files check — blocked, live requests
- [-] Security headers check — blocked, live requests
- [-] Basic SSRF/open-redirect pattern testing — blocked, live requests
- [-] Cloud storage misconfig (S3/GCS/Azure) — blocked unless bucket name found statically and checked read-only/anonymously (ask user first)

## Code-level (APK static review — primary focus of this engagement)

- [!] AndroidManifest.xml review — `android:usesCleartextTraffic="true"` set app-wide, no `network_security_config.xml` present to scope it down. See log-75.
- [x] Network security config review — no `res/xml/network_security_config.xml` shipped; cleartext is allowed via the manifest flag above (same finding, not a separate one).
- [!] API base URL(s) / backend host discovery — extracted from `libapp.so` (Dart AOT) strings: `api.farmlokal.com` (primary backend), `api.razorpay.com` (payments), `d10i8ghbmk7qrh.cloudfront.net` (media/CDN), `maps.googleapis.com`. See log-76.
- [x] Hardcoded secrets/keys review — found a Google Maps API key (`AIzaSyDpb4x...`, in manifest, meant to be client-embedded, restriction unverifiable statically) and a Razorpay `rzp_live_` key_id (also meant to be public/client-side by Razorpay's design, not a secret). No AWS keys, no JWT signing secrets, no other credential material found in `libapp.so` strings or bundled assets/strings.xml.
- [x] Auth/token handling review — `Bearer` scheme string present in `libapp.so`, consistent with standard Authorization-header bearer-token auth. Storage location/refresh logic not further traceable statically (Dart AOT snapshot, no readable source) — would need runtime instrumentation, out of scope here.
- [-] Request-signing / anti-tamper logic review — nothing found; not applicable if absent (Dart AOT strings show no signing-related identifiers).
- [x] WebView usage review — `addJavascriptInterface` hits are all inside the vendored Razorpay Checkout SDK smali (`com.razorpay.*`), standard for their payment WebView flow, not custom app-level JS bridge code. No app-authored WebView bridge found.
- [-] Local storage review — blocked without live app usage (fresh install has no meaningful data at rest yet); revisit if user authorizes a logged-in-state pull later.
- [x] Third-party SDK inventory — Firebase (Analytics/Messaging/RemoteConfig/Installations), Razorpay Checkout, Google Play Services (Auth/Maps/AdServices), Flutter plugins: geolocator (baseflow), image_picker/open_file (crazecoder), share_plus (dexterous), url_launcher, printing. No unusual/unknown third-party packages.
- [-] Dependency/library CVE check — skipped this pass, would need exact SDK version extraction per library; flag if user wants a follow-up pass.
- [x] APK signing certificate inspection (apksigner) — DN matches the default Android debug-keystore template (`CN=Android, OU=Android, O=Google Inc...`); this is only the certificate's Distinguished Name field, the actual key/fingerprint is unique to this build. Noted as info, not confirmed as an actual debug-key signing issue.
- [x] allowBackup / debuggable flags — neither set explicitly in manifest (defaults: `allowBackup=true`, `debuggable=false`). Since the app isn't debuggable, `adb backup` is blocked on Android 12+ regardless of allowBackup, so practical exposure is low.
- [x] Second-pass secret grep (`sk_live_`, `AIza...`, `client_secret`) — found one more Firebase-style API key (`AIzaSyCBahNlLUYz99AKWu7ZFDSa_F6FNmS2ET0`), same "meant to be client-embedded" category as the Maps key. **No Razorpay `sk_live_` secret key found client-side** — confirms the actual payment secret is kept server-side, good practice.
- [x] Plaintext-HTTP usage check in `libapp.so` — no hardcoded `http://` URLs found (all extracted URLs are `https://`). Downgrades the cleartext-traffic manifest flag from "likely exploitable" to "unused hardening gap" — the *capability* is there but no known code path in the app actually calls out over plain HTTP.

## Automation / Triage

- [ ] Findings dedupe + severity prioritization
- [ ] Draft report notes (internal only — **no formal program exists, nothing gets submitted without explicit user decision**)
- [-] Diff against previous scan — N/A, first session on this target
