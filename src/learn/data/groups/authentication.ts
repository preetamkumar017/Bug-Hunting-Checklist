import type { LearnGroup } from "@/learn/data/types";

// Authentication & Sessions — advanced, P3/P4-focused study group.
//
// VRT facts (Bugcrowd release 2026-07-08), default CVSS vectors, and CWE ids
// are copied from the published taxonomy, not invented. Content targets the
// findable session/auth-flow bugs that triage at P3/P4 and the conditions that
// let them chain upward toward account takeover.

export const authenticationGroup: LearnGroup = {
  id: "authentication",
  name: "Authentication & Sessions",
  emoji: "🔐",
  blurb:
    "Full credential bypass is a rare P1; the day-to-day work is the layer below it — second factors that can be skipped, sessions that are set by the attacker or never die, and tokens exposed in transit. These land at P3/P4 individually, but each is a half-step in an account-takeover chain, so the craft is proving the gap precisely and knowing which other primitive completes it.",
  topics: [
    {
      id: "mfa-bypass",
      name: "2FA / MFA Bypass",
      emoji: "📲",
      intro: {
        en: "The password check passed and the server issued a partially-authenticated state that should be gated until the second factor is verified. An MFA bypass is any path that reaches the fully-authenticated state without satisfying that gate. In 2025 the findable variants are rarely brute force — they are logic gaps: the verify step is enforced on the client but the session is already elevated server-side, the OTP endpoint lacks its own rate limit, a backup/remember-device flow skips the factor, or the response can be flipped. It is a solid P3 and escalates toward full ATO when it applies to every account rather than one misconfigured path.",
        simple: "The password check passed and the server handed out a partially-authenticated state that should stay locked until the second factor is verified. An MFA bypass is any path that reaches the fully-authenticated state without satisfying that gate. In 2025 the findable variants are rarely brute force — they are logic gaps: the verify step runs on the client but the session is already elevated server-side, the OTP endpoint has no rate limit of its own, a backup/remember-device flow skips the factor, or the response can be flipped. It is a solid P3 and climbs toward full ATO when it applies to every account rather than one misconfigured path.",
        hi: "password check पास हो गया और server ने एक partially-authenticated state दे दी जो तब तक gate रहनी चाहिए जब तक second factor verify न हो। MFA bypass कोई भी ऐसा रास्ता है जो उस gate को पूरा किए बिना fully-authenticated state तक पहुँच जाए। 2025 में findable variants शायद ही कभी brute force होते हैं — वे logic gaps हैं: verify step client पर लगा है पर session server-side पहले ही elevate हो चुका है, OTP endpoint का अपना कोई rate limit नहीं है, कोई backup/remember-device flow factor छोड़ देता है, या response को पलटा जा सकता है। यह एक ठोस P3 है और जब यह किसी एक misconfigured path के बजाय हर account पर लागू हो तो पूरे ATO की ओर escalate होता है।",
      },
      howToFind: [
        {
          title: {
            en: "Probe the partially-authenticated state",
            simple: "Probe the half-logged-in state",
            hi: "partially-authenticated state को probe करें",
          },
          steps: [
            {
              en: "Log in with correct credentials, stop at the OTP prompt, and replay a known post-login request (e.g. GET /api/me or a dashboard data call) using the cookie/token issued at that point.",
              simple: "Log in with correct credentials, stop at the OTP prompt, and replay a known post-login request (e.g. GET /api/me or a dashboard data call) using the cookie/token issued at that point.",
              hi: "सही credentials से log in करें, OTP prompt पर रुकें, और उस वक़्त जारी हुई cookie/token से एक known post-login request (जैसे GET /api/me या कोई dashboard data call) replay करें।",
            },
            {
              en: "If it returns authenticated data, the server elevated the session before verifying the factor — the OTP screen is cosmetic and can be navigated past directly.",
              simple: "If it returns authenticated data, the server elevated the session before verifying the factor — the OTP screen is cosmetic and you can simply navigate past it.",
              hi: "अगर यह authenticated data लौटाए, तो server ने factor verify करने से पहले ही session elevate कर दिया — OTP screen सिर्फ़ दिखावे की है और इसे सीधे पार किया जा सकता है।",
            },
            {
              en: "Also force-browse straight to the post-2FA landing URL and watch whether the app redirects back to the challenge or serves the page.",
              simple: "Also force-browse straight to the post-2FA landing URL and see whether the app redirects back to the challenge or just serves the page.",
              hi: "post-2FA landing URL पर सीधे force-browse करके भी देखें कि app वापस challenge पर redirect करता है या page दे देता है।",
            },
          ],
        },
        {
          title: {
            en: "Attack the verify step itself",
            simple: "Attack the verify step itself",
            hi: "verify step पर ही हमला करें",
          },
          steps: [
            {
              en: "Test the OTP endpoint for its own rate limit independent of the login limit — a 6-digit code with no throttle is brute-forceable in minutes; also try reusing a code, submitting an expired code, and code=000000 style defaults.",
              simple: "Test the OTP endpoint for its own rate limit, separate from the login limit — a 6-digit code with no throttle is brute-forceable in minutes; also try reusing a code, sending an expired code, and code=000000 style defaults.",
              hi: "OTP endpoint का अपना rate limit login limit से अलग test करें — बिना throttle वाला 6-digit code मिनटों में brute-force हो सकता है; साथ ही code दोबारा इस्तेमाल करना, expired code भेजना, और code=000000 जैसे defaults आज़माएँ।",
            },
            {
              en: "Flip the verification response: change {\"verified\":false} to true, a 302-to-challenge into a 200, or null the status field in clients that trust it.",
              simple: "Flip the verification response: change {\"verified\":false} to true, turn a 302-to-challenge into a 200, or null the status field in clients that trust it.",
              hi: "verification response पलटें: {\"verified\":false} को true करें, 302-to-challenge को 200 में बदलें, या जो clients status field पर भरोसा करते हैं उनमें उसे null कर दें।",
            },
            {
              en: "Drop the factor: remove the otp / mfa_token parameter entirely, send it empty, or set the step/stage field to the completed value.",
              simple: "Drop the factor: remove the otp / mfa_token parameter entirely, send it empty, or set the step/stage field to the completed value.",
              hi: "factor हटा दें: otp / mfa_token parameter पूरी तरह हटाएँ, उसे empty भेजें, या step/stage field को completed value पर सेट कर दें।",
            },
          ],
        },
        {
          title: {
            en: "Abuse alternate and recovery flows",
            simple: "Abuse alternate and recovery flows",
            hi: "alternate और recovery flows का दुरुपयोग करें",
          },
          steps: [
            {
              en: "Enumerate every way in: remember-this-device tokens, backup codes, SMS-vs-TOTP fallback, OAuth/SSO side doors, and legacy mobile endpoints that may not enforce the factor.",
              simple: "List every way in: remember-this-device tokens, backup codes, SMS-vs-TOTP fallback, OAuth/SSO side doors, and legacy mobile endpoints that may not enforce the factor.",
              hi: "अंदर जाने के हर रास्ते को enumerate करें: remember-this-device tokens, backup codes, SMS-बनाम-TOTP fallback, OAuth/SSO side doors, और legacy mobile endpoints जो शायद factor लागू न करें।",
            },
            {
              en: "Check whether disabling 2FA, or a password reset, drops the requirement for the next login — resetting into an account can strip the factor.",
              simple: "Check whether disabling 2FA, or a password reset, drops the requirement on the next login — resetting into an account can strip the factor.",
              hi: "जाँचें कि 2FA disable करना या password reset अगले login के लिए factor की ज़रूरत हटा देता है — किसी account में reset करके घुसना factor हटा सकता है।",
            },
            {
              en: "Response/stage confusion across a multi-request flow: complete the factor once, capture the tokens, and see if those tokens are reusable or transferable to another account context.",
              simple: "Response/stage confusion across a multi-request flow: complete the factor once, capture the tokens, and see if those tokens can be reused or moved to another account's context.",
              hi: "multi-request flow में response/stage confusion: factor एक बार पूरा करें, tokens capture करें, और देखें कि वे tokens दोबारा इस्तेमाल हो सकते हैं या किसी दूसरे account के context में transfer किए जा सकते हैं।",
            },
          ],
        },
      ],
      payloads: [
        "GET /api/me   using the cookie issued BEFORE OTP submission   (pre-verify elevation)",
        "POST /2fa/verify {\"otp\":\"000000\"}   sprayed when the endpoint has no independent rate limit",
        "Login body: delete the \"mfa_token\" field entirely, or send \"mfa_token\":\"\"",
        "Response tamper: {\"twoFactorRequired\":true} -> {\"twoFactorRequired\":false}",
      ],
      example: {
        en: "After the password step, the app set a full session cookie and only then rendered the OTP page client-side. Replaying GET /api/account/profile with that cookie — without ever entering a code — returned the victim's authenticated profile. The second factor added no server-side gate at all. Triaged P3 (AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N); because it affected the universal login path, the hunter argued the escalation toward unrestricted account access.",
        simple: "After the password step, the app set a full session cookie and only then rendered the OTP page on the client. Replaying GET /api/account/profile with that cookie — without ever entering a code — returned the victim's authenticated profile. The second factor added no server-side gate at all. Triaged P3 (AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N); because it hit the universal login path, the hunter argued the escalation toward unrestricted account access.",
        hi: "password step के बाद app ने एक पूरी session cookie सेट कर दी और उसके बाद ही OTP page client-side render किया। उस cookie से GET /api/account/profile replay करने पर — बिना कभी code डाले — victim का authenticated profile मिल गया। second factor ने server-side कोई gate जोड़ा ही नहीं। P3 पर triage हुआ (AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N); चूँकि यह universal login path को प्रभावित करता था, hunter ने unrestricted account access की ओर escalation का तर्क दिया।",
      },
      mapping: {
        bugcrowdVrt: "Broken Authentication and Session Management › Second Factor Authentication (2FA) Bypass",
        bugcrowdPriority: "P3",
        bugcrowdCvss: "AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N",
        hackeroneCwe: "CWE-304: Missing Critical Step in Authentication (Bugcrowd VRT→CWE mapping; HackerOne reports are commonly filed under CWE-287: Improper Authentication)",
        cvssSeverity: "Medium",
        note: {
          en: "VRT fixes this at P3. It reads higher in practice when the bypass is universal (every account), when it also strips the factor permanently, or when combined with known/leaked passwords to yield full ATO — then triage treats it as the enabling step of a Critical chain.",
          simple: "VRT fixes this at P3. It reads higher in practice when the bypass is universal (every account), when it also strips the factor permanently, or when combined with known/leaked passwords to give full ATO — then triage treats it as the enabling step of a Critical chain.",
          hi: "VRT इसे P3 पर तय करता है। व्यवहार में यह तब ऊँचा लगता है जब bypass universal हो (हर account), जब यह factor को स्थायी रूप से भी हटा दे, या जब इसे known/leaked passwords के साथ मिलाकर पूरा ATO मिले — तब triage इसे किसी Critical chain के enabling step के रूप में देखता है।",
        },
      },
      checklistCategoryId: "auth-login",
      references: [
        { label: "PortSwigger: 2FA bypass", url: "https://portswigger.net/web-security/authentication/multi-factor" },
      ],
    },
    {
      id: "session-fixation",
      name: "Session Fixation (Remote Attack Vector)",
      emoji: "📌",
      intro: {
        en: "The application accepts a session identifier the attacker chose and keeps using it across the authentication boundary instead of minting a fresh one at login. If the attacker can plant that identifier in the victim's browser and the victim then logs in, the attacker — who already knows the identifier — rides the now-authenticated session. The subtle condition is the one that separates P3 from noise: the session id must survive login unchanged. The remote vector means the attacker seeds the id without local access, typically via a URL parameter, a permissive cookie-setting endpoint, or a subdomain that can write a parent-domain cookie.",
        simple: "The app accepts a session id the attacker chose and keeps using it across the login boundary instead of minting a fresh one at login. If the attacker can plant that id in the victim's browser and the victim then logs in, the attacker — who already knows the id — rides the now-authenticated session. The subtle condition that separates P3 from noise: the session id must survive login unchanged. The remote vector means the attacker seeds the id without local access — usually via a URL parameter, a loose cookie-setting endpoint, or a subdomain that can write a parent-domain cookie.",
        hi: "application attacker के चुने हुए session identifier को स्वीकार कर लेता है और login पर नया बनाने के बजाय उसी को authentication boundary के पार इस्तेमाल करता रहता है। अगर attacker वह identifier victim के browser में plant कर दे और victim फिर log in करे, तो attacker — जो identifier पहले से जानता है — अब authenticated session पर सवार हो जाता है। वह subtle शर्त जो P3 को शोर से अलग करती है: session id login के बाद बिना बदले ज़िंदा रहनी चाहिए। remote vector का मतलब है attacker बिना local access के id seed करता है, आम तौर पर किसी URL parameter, ढीले cookie-setting endpoint, या ऐसे subdomain से जो parent-domain cookie लिख सके।",
      },
      howToFind: [
        {
          title: {
            en: "Confirm the id survives the auth boundary",
            simple: "Confirm the id survives login",
            hi: "confirm करें कि id auth boundary के पार बचती है",
          },
          steps: [
            {
              en: "Grab an unauthenticated session id, note it exactly, log in within that same session, and compare: if the authenticated id equals the pre-login id, the app failed to rotate on privilege change — the core precondition.",
              simple: "Grab an unauthenticated session id, note it exactly, log in within that same session, and compare: if the authenticated id matches the pre-login id, the app failed to rotate on privilege change — the core precondition.",
              hi: "एक unauthenticated session id लें, उसे ठीक-ठीक नोट करें, उसी session में log in करें, और तुलना करें: अगर authenticated id login-से-पहले वाली id के बराबर हो, तो app privilege change पर rotate करने में नाकाम रहा — यही मुख्य precondition है।",
            },
            {
              en: "Check every session carrier (cookie, URL token, custom header) — some apps rotate the cookie but keep a secondary token stable.",
              simple: "Check every session carrier (cookie, URL token, custom header) — some apps rotate the cookie but keep a secondary token unchanged.",
              hi: "हर session carrier (cookie, URL token, custom header) जाँचें — कुछ apps cookie rotate कर देते हैं पर किसी secondary token को वैसा ही रखते हैं।",
            },
            {
              en: "Verify the session is genuinely elevated afterward by making an authenticated request with the old id.",
              simple: "Confirm the session is really elevated afterward by making an authenticated request with the old id.",
              hi: "बाद में पुरानी id से एक authenticated request भेजकर पक्का करें कि session सचमुच elevated है।",
            },
          ],
        },
        {
          title: {
            en: "Find a remote way to set the id",
            simple: "Find a remote way to plant the id",
            hi: "id सेट करने का कोई remote तरीक़ा ढूँढें",
          },
          steps: [
            {
              en: "Look for the id accepted from a URL parameter or path (?sessionid=, ;jsessionid=) that the server then honours as a cookie.",
              simple: "Look for the id being accepted from a URL parameter or path (?sessionid=, ;jsessionid=) that the server then treats as a cookie.",
              hi: "देखें कि id किसी URL parameter या path (?sessionid=, ;jsessionid=) से स्वीकार होती है जिसे server फिर cookie की तरह मान लेता है।",
            },
            {
              en: "Hunt a response that reflects an attacker-chosen value into Set-Cookie (header/CRLF injection, or an endpoint that echoes a supplied session value).",
              simple: "Hunt for a response that reflects an attacker-chosen value into Set-Cookie (header/CRLF injection, or an endpoint that echoes a supplied session value).",
              hi: "ऐसा response खोजें जो attacker के चुने हुए value को Set-Cookie में reflect कर दे (header/CRLF injection, या कोई endpoint जो दिए गए session value को echo करे)।",
            },
            {
              en: "Consider subdomain-scoped cookie writes: a takeover or XSS on any *.target.com host can set a Domain=.target.com session cookie the main app will read (the remote vector that makes this UI:R rather than local).",
              simple: "Consider subdomain-scoped cookie writes: a takeover or XSS on any *.target.com host can set a Domain=.target.com session cookie the main app will read (the remote vector that makes this UI:R rather than local).",
              hi: "subdomain-scoped cookie writes पर सोचें: किसी भी *.target.com host पर takeover या XSS एक Domain=.target.com session cookie सेट कर सकता है जिसे main app पढ़ लेगा (यही remote vector इसे local के बजाय UI:R बनाता है)।",
            },
          ],
        },
      ],
      payloads: [
        "https://target/login;jsessionid=ATTACKER-CHOSEN-ID   (victim clicks, then authenticates)",
        "Set-Cookie: SESSIONID=ATTACKER-CHOSEN-ID; Domain=.target.com; Path=/   (via subdomain or CRLF)",
        "GET /?sid=ATTACKER-CHOSEN-ID  ->  server adopts it as the session, no rotation on login",
      ],
      example: {
        en: "Login did not regenerate the session cookie: the SESSIONID present before authentication was still valid and now privileged afterward. The app also accepted the id from a ;jsessionid path segment. The hunter sent the victim a login link carrying a known jsessionid, the victim authenticated, and the pre-seeded id became a logged-in session the attacker already held — full read access to the victim account. Triaged P3 (AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:L/A:N); the UI:R reflects that the victim must follow the seeded link.",
        simple: "Login did not regenerate the session cookie: the SESSIONID present before authentication was still valid and now privileged afterward. The app also accepted the id from a ;jsessionid path segment. The hunter sent the victim a login link carrying a known jsessionid, the victim logged in, and the pre-seeded id became a logged-in session the attacker already held — full read access to the victim account. Triaged P3 (AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:L/A:N); the UI:R reflects that the victim must follow the seeded link.",
        hi: "login ने session cookie दोबारा नहीं बनाई: authentication से पहले मौजूद SESSIONID अब भी valid थी और बाद में privileged हो गई। app ने id को एक ;jsessionid path segment से भी स्वीकार किया। hunter ने victim को एक login link भेजा जिसमें एक known jsessionid थी, victim ने authenticate किया, और पहले से seed की हुई id एक logged-in session बन गई जो attacker के पास पहले से थी — victim account तक पूरा read access। P3 पर triage हुआ (AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:L/A:N); UI:R दिखाता है कि victim को seed किए गए link पर जाना ही पड़ता है।",
      },
      mapping: {
        bugcrowdVrt: "Broken Authentication and Session Management › Session Fixation › Remote Attack Vector",
        bugcrowdPriority: "P3",
        bugcrowdCvss: "AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:L/A:N",
        hackeroneCwe: "CWE-384: Session Fixation",
        cvssSeverity: "Medium",
        note: {
          en: "The C:H in the VRT vector reflects that a ridden session yields the victim's confidentiality in full; the UI:R (user interaction required) and the need to seed the id remotely are what keep it at P3 rather than higher. No session rotation on login is the make-or-break precondition — without it there is no bug.",
          simple: "The C:H in the VRT vector means a ridden session gives up the victim's confidentiality in full; the UI:R (user interaction required) and the need to seed the id remotely are what keep it at P3 rather than higher. No session rotation on login is the make-or-break precondition — without it there is no bug.",
          hi: "VRT vector का C:H दिखाता है कि एक सवार-की-गई session victim की confidentiality पूरी तरह दे देती है; UI:R (user interaction required) और id को remotely seed करने की ज़रूरत ही इसे ऊँचे के बजाय P3 पर रखते हैं। login पर session rotation न होना make-or-break precondition है — इसके बिना कोई bug ही नहीं।",
        },
      },
      checklistCategoryId: "auth-session",
      references: [
        { label: "OWASP WSTG: Testing for Session Fixation", url: "https://owasp.org/www-project-web-security-testing-guide/" },
      ],
    },
    {
      id: "session-invalidation",
      name: "Failure to Invalidate Session",
      emoji: "♻️",
      intro: {
        en: "A session token should die the instant the user's trust context changes — on logout, and on any password reset or change. This bug is when the server treats logout/reset as a client-side event (clears the cookie in the browser) while the token remains valid server-side, or when a reset rotates the password but not the active sessions. The high-value conditions are narrow and verifiable: logout that does not kill the token on both client and server, and password reset/change that leaves old sessions alive. Those two are P4; weaker variants (e.g. idle-timeout nitpicks) sit at P5.",
        simple: "A session token should die the instant the user's trust context changes — on logout, and on any password reset or change. This bug is when the server treats logout/reset as a client-side event (just clears the cookie in the browser) while the token stays valid server-side, or when a reset rotates the password but not the active sessions. The high-value conditions are narrow and checkable: logout that does not kill the token on both client and server, and password reset/change that leaves old sessions alive. Those two are P4; weaker variants (e.g. idle-timeout nitpicks) sit at P5.",
        hi: "session token को उसी पल मर जाना चाहिए जब user का trust context बदले — logout पर, और किसी भी password reset या change पर। यह bug तब है जब server logout/reset को एक client-side घटना मान ले (browser में cookie साफ़ कर दे) जबकि token server-side valid बना रहे, या जब reset password तो rotate कर दे पर active sessions नहीं। high-value शर्तें संकरी और verifiable हैं: ऐसा logout जो token को client और server दोनों पर न मारे, और password reset/change जो पुराने sessions को ज़िंदा छोड़ दे। ये दोनों P4 हैं; कमज़ोर variants (जैसे idle-timeout की नुक्ताचीनी) P5 पर हैं।",
      },
      howToFind: [
        {
          title: {
            en: "Logout does not kill the token server-side",
            simple: "Logout does not kill the token on the server",
            hi: "logout token को server-side नहीं मारता",
          },
          steps: [
            {
              en: "Capture an authenticated request's token, log out through the UI, then replay that exact token against a protected endpoint.",
              simple: "Capture an authenticated request's token, log out through the UI, then replay that exact token against a protected endpoint.",
              hi: "किसी authenticated request का token capture करें, UI से log out करें, फिर ठीक वही token किसी protected endpoint पर replay करें।",
            },
            {
              en: "A 200 after logout proves the server only cleared the client cookie — the session is still live (P4, on logout client and server-side).",
              simple: "A 200 after logout proves the server only cleared the client cookie — the session is still live (P4, on logout client and server-side).",
              hi: "logout के बाद 200 साबित करता है कि server ने सिर्फ़ client cookie साफ़ की — session अब भी ज़िंदा है (P4, on logout client and server-side)।",
            },
            {
              en: "Test across carriers: the web cookie may be revoked while a bearer/refresh token issued to the same session keeps working.",
              simple: "Test across carriers: the web cookie may be revoked while a bearer/refresh token issued to the same session keeps working.",
              hi: "carriers के पार test करें: हो सकता है web cookie revoke हो जाए जबकि उसी session को जारी किया गया bearer/refresh token काम करता रहे।",
            },
          ],
        },
        {
          title: {
            en: "Reset / change does not revoke other sessions",
            simple: "Reset / change does not kill other sessions",
            hi: "reset / change दूसरे sessions revoke नहीं करता",
          },
          steps: [
            {
              en: "Log in on two independent clients. From client A, complete a password reset or change; from client B, keep using the old session.",
              simple: "Log in on two separate clients. From client A, do a password reset or change; from client B, keep using the old session.",
              hi: "दो अलग-अलग clients पर log in करें। client A से password reset या change पूरा करें; client B से पुरानी session इस्तेमाल करते रहें।",
            },
            {
              en: "If B still works, the credential rotation did not invalidate concurrent sessions (P4, on password reset and/or change) — the exact scenario that lets an attacker who stole a session survive the victim's remediation.",
              simple: "If B still works, the credential rotation did not invalidate concurrent sessions (P4, on password reset and/or change) — exactly the scenario that lets an attacker who stole a session survive the victim's fix.",
              hi: "अगर B अब भी चले, तो credential rotation ने concurrent sessions invalidate नहीं किए (P4, on password reset and/or change) — ठीक वही situation जो किसी session चुराने वाले attacker को victim के remediation के बाद भी बचा लेती है।",
            },
            {
              en: "Extend the check to email change, 2FA disable, and device removal — each should terminate other sessions.",
              simple: "Extend the check to email change, 2FA disable, and device removal — each should end other sessions.",
              hi: "यह जाँच email change, 2FA disable, और device removal तक बढ़ाएँ — हर एक को दूसरे sessions ख़त्म करने चाहिए।",
            },
          ],
        },
      ],
      payloads: [
        "1) Authenticate, copy Cookie/Authorization.  2) Logout in UI.  3) Replay GET /api/me with the copied token -> expect 401, a 200 is the bug.",
        "Two-browser test: reset password in A, then GET /api/orders in B with B's pre-reset session still attached.",
        "Replay a captured refresh-token exchange after logout to see if a fresh access token is still minted.",
      ],
      example: {
        en: "After the user clicked Log out, the SPA deleted the cookie locally but the backend never added the token to a revocation list. A token captured before logout kept returning authenticated data indefinitely. Separately, completing a password reset did not terminate the attacker's pre-existing session. Each was reported at P4 (CWE-613); together they meant a stolen session could not be revoked by the victim's own logout or password reset — the detail that elevated the combined report's impact narrative.",
        simple: "After the user clicked Log out, the SPA deleted the cookie locally but the backend never added the token to a revocation list. A token captured before logout kept returning authenticated data forever. Separately, completing a password reset did not end the attacker's existing session. Each was reported at P4 (CWE-613); together they meant a stolen session could not be revoked by the victim's own logout or password reset — the detail that raised the combined report's impact.",
        hi: "user के Log out दबाने के बाद SPA ने cookie locally delete कर दी पर backend ने token को कभी revocation list में नहीं डाला। logout से पहले capture किया गया token हमेशा के लिए authenticated data लौटाता रहा। अलग से, password reset पूरा करने पर भी attacker की पहले से मौजूद session ख़त्म नहीं हुई। हर एक P4 (CWE-613) पर report हुआ; मिलकर इनका मतलब था कि चुराई हुई session को victim के अपने logout या password reset से revoke नहीं किया जा सकता — यही वह बात थी जिसने combined report के impact narrative को ऊँचा किया।",
      },
      mapping: {
        bugcrowdVrt: "Broken Authentication and Session Management › Failure to Invalidate Session › On Logout (Client and Server-Side)",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:L/PR:H/UI:N/S:U/C:L/I:L/A:N",
        hackeroneCwe: "CWE-613: Insufficient Session Expiration",
        cvssSeverity: "Low",
        note: {
          en: "VRT prices the two meaningful variants at P4 — On Logout (Client and Server-Side) and On Password Reset and/or Change — while lesser variants (such as long-lived / idle sessions) fall to P5. The payout logic is persistence: these turn a transient session leak into durable access the victim cannot cut off, which strengthens any ATO chain they attach to.",
          simple: "VRT prices the two meaningful variants at P4 — On Logout (Client and Server-Side) and On Password Reset and/or Change — while weaker variants (such as long-lived / idle sessions) fall to P5. The payout logic is persistence: these turn a one-off session leak into durable access the victim cannot cut off, which strengthens any ATO chain they attach to.",
          hi: "VRT दो मायने रखने वाले variants को P4 रखता है — On Logout (Client and Server-Side) और On Password Reset and/or Change — जबकि कमज़ोर variants (जैसे long-lived / idle sessions) P5 पर गिरते हैं। payout का तर्क persistence है: ये एक अस्थायी session leak को ऐसे टिकाऊ access में बदल देते हैं जिसे victim काट नहीं सकता, जो किसी भी ATO chain को मज़बूत करता है जिससे ये जुड़ें।",
        },
      },
      checklistCategoryId: "auth-session",
    },
    {
      id: "cleartext-session",
      name: "Weak Login over HTTP / Cleartext Session Token",
      emoji: "🔓",
      intro: {
        en: "Credentials or the session token cross the network without transport encryption, so anyone on the path (shared Wi-Fi, a compromised hop, a mixed-content asset) can read them. The two findable leaves are a login function served over plain HTTP, and a valid session token transmitted in cleartext — including the quieter case where the login page is HTTPS but a cookie lacks the Secure flag and leaks over an incidental HTTP request to the same host. Both are P4 on their own; the condition that makes them real is a demonstrable cleartext path, not merely a theoretical one.",
        simple: "Credentials or the session token cross the network without transport encryption, so anyone on the path (shared Wi-Fi, a compromised hop, a mixed-content asset) can read them. The two findable leaves are a login function served over plain HTTP, and a valid session token sent in cleartext — including the quieter case where the login page is HTTPS but a cookie lacks the Secure flag and leaks over an incidental HTTP request to the same host. Both are P4 on their own; what makes them real is a demonstrable cleartext path, not just a theoretical one.",
        hi: "credentials या session token बिना transport encryption के network पार करते हैं, इसलिए path पर मौजूद कोई भी (shared Wi-Fi, कोई compromised hop, कोई mixed-content asset) उन्हें पढ़ सकता है। दो findable leaves हैं एक login function जो plain HTTP पर परोसा जाए, और एक valid session token जो cleartext में भेजा जाए — उस शांत case समेत जहाँ login page HTTPS हो पर किसी cookie में Secure flag न हो और वह उसी host पर किसी आकस्मिक HTTP request पर leak हो जाए। दोनों अकेले P4 हैं; इन्हें असली बनाने वाली शर्त एक demonstrable cleartext path है, महज़ theoretical नहीं।",
      },
      howToFind: [
        {
          title: {
            en: "Find the cleartext login",
            simple: "Find the cleartext login",
            hi: "cleartext login ढूँढें",
          },
          steps: [
            {
              en: "Request the login endpoint over http:// and confirm it serves the form and accepts the POST rather than redirecting to https:// (301/308 to HTTPS before any credential is sent is the correct behaviour).",
              simple: "Request the login endpoint over http:// and confirm it serves the form and accepts the POST rather than redirecting to https:// (a 301/308 to HTTPS before any credential is sent is correct behaviour).",
              hi: "login endpoint को http:// पर request करें और पक्का करें कि यह form देता है और POST स्वीकार करता है, न कि https:// पर redirect करता है (किसी भी credential भेजने से पहले HTTPS पर 301/308 सही behaviour है)।",
            },
            {
              en: "Check for mixed content on the login page — a form that posts to an http:// action, or a script/iframe loaded over HTTP on the auth path.",
              simple: "Check for mixed content on the login page — a form posting to an http:// action, or a script/iframe loaded over HTTP on the auth path.",
              hi: "login page पर mixed content जाँचें — ऐसा form जो किसी http:// action पर post करे, या auth path पर HTTP से load होता कोई script/iframe।",
            },
            {
              en: "Confirm there is no HSTS: a missing Strict-Transport-Security header means the first request can be downgraded.",
              simple: "Confirm there is no HSTS: a missing Strict-Transport-Security header means the first request can be downgraded.",
              hi: "पक्का करें कि HSTS नहीं है: Strict-Transport-Security header का न होना मतलब पहली request को downgrade किया जा सकता है।",
            },
          ],
        },
        {
          title: {
            en: "Catch the session token in the clear",
            simple: "Catch the session token in the clear",
            hi: "session token को cleartext में पकड़ें",
          },
          steps: [
            {
              en: "Inspect the session cookie flags: a missing Secure flag allows the browser to attach the token to any http:// request to the host.",
              simple: "Inspect the session cookie flags: a missing Secure flag lets the browser attach the token to any http:// request to the host.",
              hi: "session cookie के flags देखें: Secure flag का न होना browser को token को host पर किसी भी http:// request के साथ जोड़ने देता है।",
            },
            {
              en: "Trigger or observe an incidental plain-HTTP request to the same domain (an old asset, a redirect, a hardcoded http:// link) and confirm the session cookie or a bearer token rides along unencrypted.",
              simple: "Trigger or spot an incidental plain-HTTP request to the same domain (an old asset, a redirect, a hardcoded http:// link) and confirm the session cookie or a bearer token rides along unencrypted.",
              hi: "उसी domain पर किसी आकस्मिक plain-HTTP request को trigger करें या देखें (कोई पुराना asset, कोई redirect, कोई hardcoded http:// link) और पक्का करें कि session cookie या कोई bearer token unencrypted साथ चला जाता है।",
            },
            {
              en: "Look for tokens placed in URLs or non-TLS WebSocket (ws://) upgrades, which are logged and sniffable even when the main app is HTTPS.",
              simple: "Look for tokens placed in URLs or non-TLS WebSocket (ws://) upgrades, which get logged and can be sniffed even when the main app is HTTPS.",
              hi: "URLs या non-TLS WebSocket (ws://) upgrades में रखे tokens ढूँढें, जो log होते हैं और sniff किए जा सकते हैं भले ही main app HTTPS हो।",
            },
          ],
        },
      ],
      payloads: [
        "curl -i http://target/login   (serves the form / accepts creds instead of 301 -> https)",
        "Set-Cookie: SESSIONID=...; Path=/   (no Secure flag -> leaks over any http request to the host)",
        "Check: missing  Strict-Transport-Security  header on the auth origin (downgrade possible)",
        "ws://target/socket?token=<session-token>   (token over non-TLS WebSocket)",
      ],
      example: {
        en: "The marketing site and app shared target.com, and the session cookie was issued without the Secure flag. A single hardcoded http:// link elsewhere on the domain caused the browser to send the authenticated cookie over plain HTTP, where it was trivially captured on a shared network. The login form itself was also reachable over http:// with no HSTS. Reported as two P4 findings (CWE-319): cleartext transmission of the session token, and a weak login function over HTTP.",
        simple: "The marketing site and app shared target.com, and the session cookie was issued without the Secure flag. A single hardcoded http:// link elsewhere on the domain made the browser send the authenticated cookie over plain HTTP, where it was easily captured on a shared network. The login form itself was also reachable over http:// with no HSTS. Reported as two P4 findings (CWE-319): cleartext transmission of the session token, and a weak login function over HTTP.",
        hi: "marketing site और app दोनों target.com साझा करते थे, और session cookie Secure flag के बिना जारी हुई थी। domain पर कहीं और एक अकेला hardcoded http:// link browser से authenticated cookie plain HTTP पर भिजवा देता था, जहाँ किसी shared network पर इसे आसानी से capture कर लिया गया। login form ख़ुद भी http:// पर बिना HSTS के पहुँच में था। दो P4 findings (CWE-319) के रूप में report हुआ: session token का cleartext transmission, और HTTP पर एक weak login function।",
      },
      mapping: {
        bugcrowdVrt: "Broken Authentication and Session Management › Weak Login Function › Over HTTP",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:A/AC:H/PR:N/UI:R/S:U/C:L/I:L/A:N",
        hackeroneCwe: "CWE-319: Cleartext Transmission of Sensitive Information",
        cvssSeverity: "Low",
        note: {
          en: "Two sibling VRT leaves both sit at P4 here — Weak Login Function › Over HTTP, and Cleartext Transmission of Session Token. Severity hinges on a real cleartext path (missing Secure flag, mixed content, no HSTS); a login page that immediately 301s to HTTPS before any secret is sent is not this bug. Impact rises if the captured token has no server-side expiry or cannot be revoked (see Failure to Invalidate Session).",
          simple: "Two sibling VRT leaves both sit at P4 here — Weak Login Function › Over HTTP, and Cleartext Transmission of Session Token. Severity hinges on a real cleartext path (missing Secure flag, mixed content, no HSTS); a login page that immediately 301s to HTTPS before any secret is sent is not this bug. Impact rises if the captured token has no server-side expiry or cannot be revoked (see Failure to Invalidate Session).",
          hi: "दो sibling VRT leaves यहाँ P4 पर हैं — Weak Login Function › Over HTTP, और Cleartext Transmission of Session Token। severity एक असली cleartext path पर टिकी है (Secure flag का न होना, mixed content, कोई HSTS नहीं); ऐसा login page जो किसी secret भेजने से पहले ही तुरंत HTTPS पर 301 कर दे, यह bug नहीं है। अगर capture किए गए token की कोई server-side expiry न हो या वह revoke न हो सके तो impact बढ़ जाता है (देखें Failure to Invalidate Session)।",
        },
      },
      checklistCategoryId: "auth-session",
    },
  ],
};
