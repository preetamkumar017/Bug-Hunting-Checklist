import type { LearnGroup } from "@/learn/data/types";

// Advanced, P3/P4-focused group: the "misconfigured surface" tier. Each leaf is
// scored off Bugcrowd VRT release 2026-07-08. Individually these are low/medium
// hygiene bugs — the craft is recognising which variant tips up (an exposed ADMIN
// portal is P1, not P3), and knowing which ones GATE other bugs: a missing rate
// limit turns a guess into a brute force, a WAF bypass unlocks the payloads the
// edge was dropping, a missing HttpOnly flag turns reflected XSS into session theft.
export const serverMisconfigGroup: LearnGroup = {
  id: "server-misconfig",
  name: "Server Security Misconfiguration",
  emoji: "⚙️",
  blurb:
    "The misconfigured server/app surface: exposed portals, absent rate limits, weak cookie/header hygiene, OAuth and DBMS misconfig, skipped password re-auth, broken CAPTCHA and WAF bypass. Each is P3/P4 alone — their value is that they stack and gate the P1/P2 bugs you hunt next.",
  topics: [
    {
      id: "exposed-portal",
      name: "Exposed Portal",
      emoji: "🚪",
      intro: {
        en: "An authentication portal or management interface reachable from a sphere it was never meant to serve — an internal/staff login indexed on the public internet, a /admin panel with no network ACL, a vendor console (Jenkins, Grafana, Kibana, phpMyAdmin, Tomcat Manager, printer/IoT UIs) exposed to anonymous clients. The whole priority hinges on what the portal is: a non-admin portal (a plain user/login surface that still enforces auth) is P3, but an exposed ADMIN portal is P1 because it is a direct foothold into privileged functionality, and a portal that is genuinely protected (IP-allowlisted, mTLS, behind SSO that actually blocks you) is P5. The subtle findability is that these rarely appear in the main app's sitemap — they surface through certificate-transparency hostnames, non-standard ports, forgotten vhosts and default context paths, and a single wrong Host header can reveal one the front door hides.",
        simple: "An authentication portal or management interface reachable from a place it was never meant to serve — an internal/staff login indexed on the public internet, a /admin panel with no network ACL, a vendor console (Jenkins, Grafana, Kibana, phpMyAdmin, Tomcat Manager, printer/IoT UIs) open to anonymous clients. The priority hinges on what the portal is: a non-admin portal (a plain user/login surface that still enforces auth) is P3, but an exposed ADMIN portal is P1 because it's a direct foothold into privileged functionality, and a portal that is genuinely protected (IP-allowlisted, mTLS, behind SSO that actually blocks you) is P5. The catch is these rarely appear in the main app's sitemap — they surface through certificate-transparency hostnames, non-standard ports, forgotten vhosts and default context paths, and a single wrong Host header can reveal one the front door hides.",
        hi: "एक authentication portal या management interface जो ऐसी जगह से पहुँच में हो जहाँ उसे कभी serve नहीं करना था — public internet पर index हुआ कोई internal/staff login, बिना network ACL वाला /admin panel, anonymous clients के लिए खुला कोई vendor console (Jenkins, Grafana, Kibana, phpMyAdmin, Tomcat Manager, printer/IoT UIs)। पूरी priority इस पर टिकी है कि portal है क्या: एक non-admin portal (सादा user/login surface जो फिर भी auth enforce करे) P3 है, पर एक exposed ADMIN portal P1 है क्योंकि यह privileged functionality में सीधा foothold है, और एक सच में protected portal (IP-allowlisted, mTLS, ऐसे SSO के पीछे जो सच में रोके) P5 है। असली बारीकी यह है कि ये शायद ही main app के sitemap में दिखते हैं — ये certificate-transparency hostnames, non-standard ports, भूले हुए vhosts और default context paths से सामने आते हैं, और एक ग़लत Host header ऐसा portal उजागर कर सकता है जिसे front door छुपाता है।",
      },
      howToFind: [
        {
          title: {
            en: "Discover portals off the main sitemap",
            simple: "Find portals that aren't in the main sitemap",
            hi: "main sitemap से बाहर के portals ढूँढें",
          },
          steps: [
            {
              en: "Build the host list from CT logs + subfinder, then fingerprint everything live: httpx -title -status-code -tech-detect -favicon over the resolved hosts and non-standard ports.",
              simple: "Build the host list from CT logs + subfinder, then fingerprint everything live: httpx -title -status-code -tech-detect -favicon over the resolved hosts and non-standard ports.",
              hi: "CT logs + subfinder से host list बनाएँ, फिर हर live चीज़ fingerprint करें: resolved hosts और non-standard ports पर httpx -title -status-code -tech-detect -favicon।",
            },
            {
              en: "Favicon hashing is the fastest classifier — a known Jenkins/Grafana/phpMyAdmin favicon hash on an anonymous host is an exposed-console candidate before you even load the page.",
              simple: "Favicon hashing is the fastest classifier — a known Jenkins/Grafana/phpMyAdmin favicon hash on an anonymous host is an exposed-console candidate before you even load the page.",
              hi: "Favicon hashing सबसे तेज़ classifier है — किसी anonymous host पर Jenkins/Grafana/phpMyAdmin का ज्ञात favicon hash, page load करने से पहले ही, एक exposed-console candidate होता है।",
            },
            {
              en: "Fuzz default context paths on each live host (/admin, /manage, /console, /actuator, /_dashboard, /wp-admin, /jenkins, /grafana) and watch for a 200 login or an unauthenticated landing rather than a redirect to SSO.",
              simple: "Fuzz default context paths on each live host (/admin, /manage, /console, /actuator, /_dashboard, /wp-admin, /jenkins, /grafana) and watch for a 200 login or an unauthenticated landing rather than a redirect to SSO.",
              hi: "हर live host पर default context paths fuzz करें (/admin, /manage, /console, /actuator, /_dashboard, /wp-admin, /jenkins, /grafana) और SSO पर redirect के बजाय 200 login या unauthenticated landing देखें।",
            },
          ],
        },
        {
          title: {
            en: "Classify admin vs non-admin vs protected",
            simple: "Classify admin vs non-admin vs protected",
            hi: "classify करें: admin, non-admin या protected",
          },
          steps: [
            {
              en: "Read the portal's own labelling and routes: does it offer administrative/management functions (user management, config, deploy, DB) → admin → P1 path, or is it an end-user login → non-admin → P3?",
              simple: "Read the portal's own labels and routes: does it offer administrative/management functions (user management, config, deploy, DB) → admin → P1 path, or is it an end-user login → non-admin → P3?",
              hi: "portal के अपने labelling और routes पढ़ें: क्या यह administrative/management functions देता है (user management, config, deploy, DB) → admin → P1 path, या यह एक end-user login है → non-admin → P3?",
            },
            {
              en: "Confirm it is actually reachable and NOT protected: a page that loads for an anonymous client is exposed; one that bounces you to an IP-allowlist block, mTLS prompt or enforced SSO is P5 — prove which by requesting it with no cookies from an external IP.",
              simple: "Confirm it's actually reachable and NOT protected: a page that loads for an anonymous client is exposed; one that bounces you to an IP-allowlist block, mTLS prompt or enforced SSO is P5 — prove which by requesting it with no cookies from an external IP.",
              hi: "पक्का करें कि यह सच में पहुँच में है और protected नहीं: एक page जो anonymous client के लिए load हो वह exposed है; जो आपको IP-allowlist block, mTLS prompt या enforced SSO पर भेज दे वह P5 है — किसी external IP से बिना cookies request करके तय करें कि कौन सा है।",
            },
            {
              en: "Stop at the login boundary. Proving exposure is loading the portal and reading its role; do not attempt default creds or auth bypass unless the program's scope explicitly invites it — flag the exposure to the user first.",
              simple: "Stop at the login boundary. Proving exposure means loading the portal and reading its role; don't try default creds or auth bypass unless the program's scope clearly invites it — flag the exposure to the user first.",
              hi: "login boundary पर रुक जाएँ। exposure साबित करने का मतलब है portal load करना और उसकी role पढ़ना; default creds या auth bypass की कोशिश तब तक न करें जब तक program का scope साफ़ तौर पर न बुलाए — पहले exposure को user को flag करें।",
            },
          ],
        },
      ],
      payloads: [
        "httpx -l hosts.txt -title -status-code -tech-detect -favicon -json   (fingerprint every live host/port)",
        "curl -s -o /dev/null -w '%{http_code}' https://target/admin   (200 login vs 302-to-SSO vs 403 tells exposed from protected)",
        "ffuf -u https://target/FUZZ -w admin-panels.txt -mc 200,401   (default console context paths)",
        "curl -s https://target/actuator/env | head   (Spring Boot actuator left open = exposed management surface)",
      ],
      example: {
        en: "CT logs revealed internal-ops.target.com; httpx flagged it with a Grafana favicon hash and a 200 anonymous landing. As a monitoring portal that still gated its data behind a login, it triaged P3 (non-admin exposed portal). A separate host served a Jenkins instance whose /script Groovy console loaded without auth — an administrative portal exposed to anonymous callers — which is the P1 variant and was flagged to the program owner immediately rather than exercised.",
        simple: "CT logs revealed internal-ops.target.com; httpx flagged it with a Grafana favicon hash and a 200 anonymous landing. As a monitoring portal that still kept its data behind a login, it triaged P3 (non-admin exposed portal). A separate host served a Jenkins instance whose /script Groovy console loaded without auth — an administrative portal open to anonymous callers — which is the P1 variant and was flagged to the program owner at once rather than used.",
        hi: "CT logs ने internal-ops.target.com उजागर किया; httpx ने इसे एक Grafana favicon hash और एक 200 anonymous landing के साथ flag किया। एक monitoring portal के तौर पर जो फिर भी अपना data login के पीछे रखता था, यह P3 triage हुआ (non-admin exposed portal)। एक अलग host एक Jenkins instance serve करता था जिसका /script Groovy console बिना auth के load हो गया — anonymous callers के लिए खुला एक administrative portal — जो P1 variant है और इसे exercise करने के बजाय फ़ौरन program owner को flag किया गया।",
      },
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › Exposed Portal › Non-Admin Portal",
        bugcrowdPriority: "P3",
        bugcrowdCvss: "AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N",
        hackeroneCwe: "CWE-668: Exposure of Resource to Wrong Sphere",
        cvssSeverity: "Medium (non-admin) → Critical for an exposed admin portal",
        note: {
          en: "Non-admin portal = P3 (AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N). An exposed ADMIN portal is P1 — a direct privileged foothold. A genuinely protected portal (IP allowlist / mTLS / enforced SSO) is P5. Priority follows what the portal exposes, not that it merely answered.",
          simple: "Non-admin portal = P3 (AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N). An exposed ADMIN portal is P1 — a direct privileged foothold. A genuinely protected portal (IP allowlist / mTLS / enforced SSO) is P5. Priority follows what the portal exposes, not just that it answered.",
          hi: "Non-admin portal = P3 (AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N)। एक exposed ADMIN portal P1 है — एक सीधा privileged foothold। एक सच में protected portal (IP allowlist / mTLS / enforced SSO) P5 है। priority इस पर निर्भर है कि portal क्या expose करता है, न कि महज़ इस पर कि उसने जवाब दिया।",
        },
      },
      checklistCategoryId: "recon-content",
      references: [
        { label: "httpx (ProjectDiscovery)", url: "https://github.com/projectdiscovery/httpx" },
        { label: "OWASP WSTG: Admin interfaces", url: "https://owasp.org/www-project-web-security-testing-guide/" },
      ],
    },
    {
      id: "no-rate-limiting",
      name: "No Rate Limiting on Form",
      emoji: "⏱️",
      intro: {
        en: "A security-relevant endpoint that accepts unlimited high-rate requests from a single client because there is no throttle, lockout, or cost control. Bugcrowd scores the standalone misconfiguration at P4 across its variants — login (feeds credential stuffing / password spray), registration (mass/automated account creation), and the resource-burning SMS- and email-triggering forms (OTP, verification, reset, invite) that cost the target money and can harass third parties. The nuance is that it is almost never the headline itself; it is the enabler that converts an otherwise-safe guessing surface into a working attack — the same missing limit on a 6-digit OTP endpoint is the difference between a theoretical and a practical account takeover. Findability is a single burst, but the real test is bypass-awareness: many 'limits' key only on IP or only on the happy-path header, so rotating X-Forwarded-For, casing the path, or switching the request shape often walks straight through.",
        simple: "A security-relevant endpoint that accepts unlimited high-rate requests from one client because there's no throttle, lockout, or cost control. Bugcrowd scores the standalone misconfiguration at P4 across its variants — login (feeds credential stuffing / password spray), registration (mass/automated account creation), and the resource-burning SMS- and email-triggering forms (OTP, verification, reset, invite) that cost the target money and can harass third parties. The key point: it's almost never the headline itself; it's the enabler that turns an otherwise-safe guessing surface into a working attack — the same missing limit on a 6-digit OTP endpoint is the difference between a theoretical and a real account takeover. It's found with a single burst, but the real test is bypass-awareness: many 'limits' key only on IP or only on the happy-path header, so rotating X-Forwarded-For, changing the path's case, or switching the request shape often walks straight through.",
        hi: "एक security-relevant endpoint जो एक ही client से unlimited high-rate requests accept करता है क्योंकि कोई throttle, lockout, या cost control नहीं है। Bugcrowd इस अकेली misconfiguration को इसके सभी variants में P4 score करता है — login (credential stuffing / password spray को feed करता है), registration (mass/automated account creation), और resource जलाने वाले SMS- तथा email-triggering forms (OTP, verification, reset, invite) जो target का पैसा ख़र्च कराते हैं और third parties को परेशान कर सकते हैं। बारीकी यह है कि यह लगभग कभी ख़ुद headline नहीं होता; यह वह enabler है जो एक वरना-सुरक्षित guessing surface को चलते हुए attack में बदल देता है — किसी 6-digit OTP endpoint पर वही missing limit theoretical और practical account takeover के बीच का फ़र्क़ है। इसे एक burst से ढूँढा जाता है, पर असली test bypass-awareness है: कई 'limits' सिर्फ़ IP पर या सिर्फ़ happy-path header पर key करती हैं, तो X-Forwarded-For rotate करना, path का case बदलना, या request का आकार बदलना अक्सर सीधे निकल जाता है।",
      },
      howToFind: [
        {
          title: {
            en: "Measure the real limit and its key",
            simple: "Measure the real limit and what it keys on",
            hi: "असली limit और वो किस पर key करती है, मापें",
          },
          steps: [
            {
              en: "Send a controlled burst (Burp Intruder / a short ffuf loop) of identical requests and watch for 429, a lockout, a CAPTCHA appearing, or a silent tarpit — record the exact count at which enforcement kicks in, if ever.",
              simple: "Send a controlled burst (Burp Intruder / a short ffuf loop) of identical requests and watch for a 429, a lockout, a CAPTCHA appearing, or a silent tarpit — record the exact count at which enforcement kicks in, if ever.",
              hi: "एक controlled burst भेजें (Burp Intruder / एक छोटा ffuf loop) एक जैसी requests का और 429, lockout, CAPTCHA आना, या silent tarpit देखें — ठीक उस count को नोट करें जिस पर enforcement शुरू होता है, अगर कभी हो।",
            },
            {
              en: "Identify what the limit keys on: same account different IP, same IP different account, authenticated vs anonymous — a per-account lockout still allows horizontal spray across many accounts.",
              simple: "Work out what the limit keys on: same account different IP, same IP different account, authenticated vs anonymous — a per-account lockout still allows horizontal spray across many accounts.",
              hi: "पता करें कि limit किस पर key करती है: एक ही account अलग IP, एक ही IP अलग account, authenticated बनाम anonymous — एक per-account lockout फिर भी कई accounts पर horizontal spray होने देता है।",
            },
            {
              en: "Prioritise the costly/sensitive forms: OTP/2FA verify, password-reset request, email/SMS send, login, registration — these are the P4 variants with real downstream impact.",
              simple: "Prioritise the costly/sensitive forms: OTP/2FA verify, password-reset request, email/SMS send, login, registration — these are the P4 variants with real downstream impact.",
              hi: "महँगे/sensitive forms को प्राथमिकता दें: OTP/2FA verify, password-reset request, email/SMS send, login, registration — ये असली downstream impact वाले P4 variants हैं।",
            },
          ],
        },
        {
          title: {
            en: "Probe common bypasses before concluding there IS a limit",
            simple: "Try common bypasses before deciding a limit exists",
            hi: "limit है, यह मानने से पहले आम bypasses आज़माएँ",
          },
          steps: [
            {
              en: "Rotate the client identity the server trusts: X-Forwarded-For / X-Real-IP / X-Client-IP spoofing, then fresh sessions/UA — many limiters count the spoofable header, not the connection.",
              simple: "Rotate the client identity the server trusts: spoof X-Forwarded-For / X-Real-IP / X-Client-IP, then use fresh sessions/UA — many limiters count the spoofable header, not the connection.",
              hi: "server जिस client identity पर भरोसा करता है उसे rotate करें: X-Forwarded-For / X-Real-IP / X-Client-IP spoof करें, फिर fresh sessions/UA — कई limiters spoof होने वाला header गिनते हैं, connection नहीं।",
            },
            {
              en: "Mutate the request surface: trailing slash, case, encoded path, extra query param, HTTP/1.1 vs /2, or batching (GraphQL alias / JSON array) so N attempts ride one request the limiter counts as one.",
              simple: "Change the request surface: trailing slash, case, encoded path, extra query param, HTTP/1.1 vs /2, or batching (GraphQL alias / JSON array) so N attempts ride one request the limiter counts as one.",
              hi: "request surface बदलें: trailing slash, case, encoded path, extra query param, HTTP/1.1 बनाम /2, या batching (GraphQL alias / JSON array) ताकि N attempts एक ही request पर चलें जिसे limiter एक गिनता है।",
            },
            {
              en: "For OTP/reset specifically, compute feasibility: code length × validity window vs achievable rate — if the keyspace is exhaustible before expiry, note the brute-force-to-ATO chain explicitly for the user.",
              simple: "For OTP/reset specifically, work out feasibility: code length × validity window vs the rate you can reach — if the keyspace can be exhausted before expiry, note the brute-force-to-ATO chain explicitly for the user.",
              hi: "ख़ास तौर पर OTP/reset के लिए feasibility निकालें: code length × validity window बनाम आपकी achievable rate — अगर keyspace expiry से पहले exhaust हो सके, तो brute-force-to-ATO chain को user के लिए साफ़ तौर पर नोट करें।",
            },
          ],
        },
      ],
      payloads: [
        "ffuf -u https://target/api/login -X POST -d 'user=victim&pass=FUZZ' -w pins.txt -mc 200 -H 'Content-Type: application/x-www-form-urlencoded'   (rate/lockout probe — in-scope account only)",
        "for i in $(seq 1 50); do curl -s -o /dev/null -w '%{http_code}\\n' -X POST https://target/api/otp/verify -d 'code=000000'; done   (does 429 ever appear?)",
        "X-Forwarded-For: 127.0.0.1   (rotate per request — defeats IP-keyed limiters)",
        "curl -s -X POST https://target/api/reset -d 'email=you@yours.test'   (repeat: email-triggering form = resource burn / inbox flood on YOUR address)",
      ],
      example: {
        en: "A 2FA verify endpoint accepted a 6-digit code with no attempt ceiling and no per-account lockout; a 50-request burst never produced a 429. On its own the missing limit triaged P4 (No Rate Limiting on Form › Login/authentication), but because the 10^6 keyspace was exhaustible inside the 10-minute code validity, it was written up as the enabling step of a complete 2FA-bypass account-takeover chain and flagged to the user before any report.",
        simple: "A 2FA verify endpoint accepted a 6-digit code with no attempt ceiling and no per-account lockout; a 50-request burst never produced a 429. On its own the missing limit triaged P4 (No Rate Limiting on Form › Login/authentication), but because the 10^6 keyspace could be exhausted inside the 10-minute code validity, it was written up as the enabling step of a complete 2FA-bypass account-takeover chain and flagged to the user before any report.",
        hi: "एक 2FA verify endpoint बिना attempt ceiling और बिना per-account lockout के 6-digit code accept करता था; एक 50-request burst ने कभी 429 नहीं दिया। अकेले यह missing limit P4 triage हुआ (No Rate Limiting on Form › Login/authentication), पर चूँकि 10^6 keyspace 10-minute code validity के अंदर exhaust हो सकता था, इसे एक पूरे 2FA-bypass account-takeover chain के enabling step के तौर पर लिखा गया और किसी भी report से पहले user को flag किया गया।",
      },
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › No Rate Limiting on Form › Login",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N",
        hackeroneCwe: "CWE-307: Improper Restriction of Excessive Authentication Attempts (and CWE-799: Improper Control of Interaction Frequency)",
        cvssSeverity: "Low standalone (→ High/Critical when it enables OTP/2FA brute force to account takeover)",
        note: {
          en: "P4 across all variants — Login, Registration, SMS-Triggering and Email-Triggering forms. Low on its own; the escalation is as a gate: a missing limit on an exhaustible OTP/reset keyspace is the ATO enabler. SMS/email variants also carry a cost-abuse / third-party-harassment angle.",
          simple: "P4 across all variants — Login, Registration, SMS-Triggering and Email-Triggering forms. Low on its own; the escalation is as a gate: a missing limit on an exhaustible OTP/reset keyspace is the ATO enabler. SMS/email variants also carry a cost-abuse / third-party-harassment angle.",
          hi: "सभी variants में P4 — Login, Registration, SMS-Triggering और Email-Triggering forms. अकेले Low; escalation एक gate के रूप में है: किसी exhaustible OTP/reset keyspace पर missing limit ही ATO enabler है। SMS/email variants में cost-abuse / third-party-harassment का पहलू भी होता है।",
        },
      },
      checklistCategoryId: "auth-password",
      references: [
        { label: "OWASP WSTG: Testing for Weak Lockout Mechanism", url: "https://owasp.org/www-project-web-security-testing-guide/" },
        { label: "PortSwigger: Brute-force & rate limiting", url: "https://portswigger.net/web-security/authentication" },
      ],
    },
    {
      id: "missing-cookie-flags",
      name: "Missing Secure / HttpOnly Cookie Flag",
      emoji: "🍪",
      intro: {
        en: "A session cookie set without the protective flags that keep it out of reach of the network and of JavaScript. Without Secure, the cookie is sent over any cleartext HTTP request to the domain, so an active network attacker (or a single HTTP asset / mixed-content request) can capture it; without HttpOnly, document.cookie exposes it to any script in the origin, so any XSS becomes session theft instead of a contained popup. Bugcrowd scores the session-token variant at P4 with high attack complexity — the flag is missing, but turning that into a stolen session needs an additional condition (a MITM position, or an XSS to read it). The whole point for an advanced hunter is the multiplier: this is the flag you check on every target because it silently upgrades the severity of a bug you find later. Non-session cookies (analytics, CSRF tokens that are validated server-side, UI prefs) missing the flags are typically P5 noise — classify the cookie before you report.",
        simple: "A session cookie set without the flags that keep it away from the network and from JavaScript. Without Secure, the cookie is sent over any cleartext HTTP request to the domain, so an active network attacker (or a single HTTP asset / mixed-content request) can capture it; without HttpOnly, document.cookie exposes it to any script in the origin, so any XSS becomes session theft instead of a contained popup. Bugcrowd scores the session-token variant at P4 with high attack complexity — the flag is missing, but turning that into a stolen session needs an extra condition (a MITM position, or an XSS to read it). The whole point for an advanced hunter is the multiplier: this is the flag you check on every target because it quietly upgrades the severity of a bug you find later. Non-session cookies (analytics, CSRF tokens validated server-side, UI prefs) missing the flags are usually P5 noise — classify the cookie before you report.",
        hi: "एक session cookie जो उन protective flags के बिना set की गई हो जो उसे network और JavaScript की पहुँच से दूर रखती हैं। Secure के बिना, cookie domain पर किसी भी cleartext HTTP request पर भेजी जाती है, तो एक active network attacker (या एक अकेला HTTP asset / mixed-content request) इसे capture कर सकता है; HttpOnly के बिना, document.cookie इसे origin के किसी भी script के सामने खोल देता है, तो कोई भी XSS एक contained popup के बजाय session theft बन जाता है। Bugcrowd session-token variant को high attack complexity के साथ P4 score करता है — flag missing है, पर इसे चुराई गई session में बदलने के लिए एक अतिरिक्त शर्त चाहिए (एक MITM position, या इसे पढ़ने के लिए एक XSS)। advanced hunter के लिए पूरी बात multiplier है: यह वो flag है जिसे आप हर target पर check करते हैं क्योंकि यह चुपचाप किसी बाद में मिलने वाले bug की severity बढ़ा देता है। flags के बिना non-session cookies (analytics, server-side validate होने वाले CSRF tokens, UI prefs) आम तौर पर P5 noise हैं — report करने से पहले cookie classify करें।",
      },
      howToFind: [
        {
          title: {
            en: "Audit the Set-Cookie attributes",
            simple: "Audit the Set-Cookie attributes",
            hi: "Set-Cookie attributes का audit करें",
          },
          steps: [
            {
              en: "Capture every Set-Cookie on login and on authenticated navigation; for each, check for HttpOnly, Secure, SameSite and the Domain/Path scope.",
              simple: "Capture every Set-Cookie on login and on authenticated navigation; for each, check HttpOnly, Secure, SameSite and the Domain/Path scope.",
              hi: "login पर और authenticated navigation पर हर Set-Cookie capture करें; हर एक के लिए HttpOnly, Secure, SameSite और Domain/Path scope check करें।",
            },
            {
              en: "Classify the cookie: is it the actual session/auth token (present on authenticated requests, invalidated on logout), or a non-sensitive value? Only the session/auth variant is the P4 — the rest are usually P5.",
              simple: "Classify the cookie: is it the actual session/auth token (present on authenticated requests, invalidated on logout), or a non-sensitive value? Only the session/auth variant is the P4 — the rest are usually P5.",
              hi: "cookie classify करें: क्या यह असली session/auth token है (authenticated requests पर मौजूद, logout पर invalidate), या कोई non-sensitive value? सिर्फ़ session/auth variant ही P4 है — बाक़ी आम तौर पर P5।",
            },
            {
              en: "Confirm HttpOnly empirically with document.cookie in the console — if the session value is readable, the flag is genuinely absent (not just omitted from one response).",
              simple: "Confirm HttpOnly for real with document.cookie in the console — if the session value is readable, the flag is genuinely absent (not just missing from one response).",
              hi: "console में document.cookie से HttpOnly को प्रयोग करके confirm करें — अगर session value readable है, तो flag सच में absent है (न कि सिर्फ़ एक response से छूटा हुआ)।",
            },
          ],
        },
        {
          title: {
            en: "Tie it to a delivery condition",
            simple: "Tie it to a delivery condition",
            hi: "इसे एक delivery शर्त से जोड़ें",
          },
          steps: [
            {
              en: "Missing Secure: show the cookie would ride a cleartext request — any plain-HTTP endpoint, an http:// asset, or an HSTS gap that allows an initial HTTP hit before redirect.",
              simple: "Missing Secure: show the cookie would ride a cleartext request — any plain-HTTP endpoint, an http:// asset, or an HSTS gap that allows an initial HTTP hit before the redirect.",
              hi: "Secure missing: दिखाएँ कि cookie एक cleartext request पर जाएगी — कोई plain-HTTP endpoint, एक http:// asset, या एक HSTS gap जो redirect से पहले एक initial HTTP hit होने दे।",
            },
            {
              en: "Missing HttpOnly: pair it with the XSS surface — even a currently-unexploited reflection means that if XSS lands, it reads the live session; state that chain in the finding.",
              simple: "Missing HttpOnly: pair it with the XSS surface — even a currently-unexploited reflection means that if XSS lands, it reads the live session; state that chain in the finding.",
              hi: "HttpOnly missing: इसे XSS surface के साथ जोड़ें — अभी तक exploit न हुई एक reflection भी मतलब है कि अगर XSS लगे, तो वह live session पढ़ लेगी; उस chain को finding में बताएँ।",
            },
            {
              en: "Keep proof read-only: inspect your OWN session cookie in your own browser session; never capture another user's cookie to 'demonstrate' it.",
              simple: "Keep proof read-only: inspect your OWN session cookie in your own browser session; never capture another user's cookie to 'demonstrate' it.",
              hi: "सबूत read-only रखें: अपनी ख़ुद की browser session में अपनी ही session cookie inspect करें; 'दिखाने' के लिए कभी किसी दूसरे user की cookie capture न करें।",
            },
          ],
        },
      ],
      payloads: [
        "curl -sI https://app.target.com/login | grep -i set-cookie   (inspect HttpOnly / Secure / SameSite on the session cookie)",
        "document.cookie   // DevTools console: if the session token prints, HttpOnly is missing",
        "curl -sI http://app.target.com/   (does the app answer over cleartext at all? that's where a non-Secure cookie leaks)",
        "nuclei -u https://app.target.com -t http/misconfiguration/http-missing-security-headers.yaml   (cookie-flag + header hygiene sweep)",
      ],
      example: {
        en: "The primary session cookie was issued as `Set-Cookie: SESSION=...; Path=/` with neither HttpOnly nor Secure. document.cookie returned the live token, confirming script reachability. Standalone it triaged P4 (Missing HTTPOnly on a session token, AC:H because exploitation needs a second condition). It became the quiet multiplier on the same program's later reflected-XSS finding: the missing HttpOnly turned a contained reflection into a full session-theft account takeover.",
        simple: "The primary session cookie was issued as `Set-Cookie: SESSION=...; Path=/` with neither HttpOnly nor Secure. document.cookie returned the live token, confirming a script could read it. On its own it triaged P4 (Missing HTTPOnly on a session token, AC:H because exploitation needs a second condition). It became the quiet multiplier on the same program's later reflected-XSS finding: the missing HttpOnly turned a contained reflection into a full session-theft account takeover.",
        hi: "primary session cookie `Set-Cookie: SESSION=...; Path=/` के तौर पर जारी हुई थी, न HttpOnly के साथ न Secure के। document.cookie ने live token लौटाया, जिससे script की पहुँच पक्की हुई। अकेले यह P4 triage हुआ (एक session token पर Missing HTTPOnly, AC:H क्योंकि exploitation के लिए दूसरी शर्त चाहिए)। यह उसी program की बाद वाली reflected-XSS finding पर चुपचाप multiplier बन गया: missing HttpOnly ने एक contained reflection को पूरे session-theft account takeover में बदल दिया।",
      },
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › Missing Secure or HTTPOnly Cookie Flag › Session Token",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N",
        hackeroneCwe: "CWE-614: Sensitive Cookie Without Secure Attribute (and CWE-1004: Sensitive Cookie Without HttpOnly Flag)",
        cvssSeverity: "Low (AC:H — needs MITM or XSS to realise)",
        note: {
          en: "Session-token variant = P4. High attack complexity because stealing the cookie needs a second condition. The value is as a severity multiplier: missing HttpOnly upgrades any origin XSS to session theft; missing Secure leaks it over cleartext. Non-session cookies missing the flags are generally P5.",
          simple: "Session-token variant = P4. High attack complexity because stealing the cookie needs a second condition. Its value is as a severity multiplier: missing HttpOnly upgrades any origin XSS to session theft; missing Secure leaks it over cleartext. Non-session cookies missing the flags are generally P5.",
          hi: "Session-token variant = P4। High attack complexity इसलिए कि cookie चुराने के लिए दूसरी शर्त चाहिए। इसकी क़ीमत एक severity multiplier के रूप में है: missing HttpOnly किसी भी origin XSS को session theft तक बढ़ा देता है; missing Secure इसे cleartext पर leak करा देता है। flags के बिना non-session cookies आम तौर पर P5 हैं।",
        },
      },
      checklistCategoryId: "auth-session",
      references: [
        { label: "OWASP: Secure Cookie Attribute", url: "https://owasp.org/www-community/controls/SecureCookieAttribute" },
        { label: "MDN: Set-Cookie", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie" },
      ],
    },
    {
      id: "security-headers",
      name: "Missing / Weak Security Headers",
      emoji: "🧱",
      intro: {
        en: "Response-header defenses that are absent or toothless. Bugcrowd is deliberately stingy here: the one header variant that reaches P4 is a missing/weak Cache-Control on a SENSITIVE page — a page whose response (account details, tokens in the body, PII) gets cached by a shared proxy or the browser's back/forward and disk cache, so it is retrievable later on a shared or compromised machine. The broader hygiene set — Content-Security-Policy, HSTS, X-Frame-Options/frame-ancestors, X-Content-Type-Options — is P5 on its own, because a missing header is a weakened mitigation, not an exploit. The advanced read is to treat the P5 ones as escalation ENABLERS and report them attached to the bug they unlock: no X-Frame-Options/frame-ancestors is what makes a clickjacking POC possible, a weak CSP is what lets an injected script actually run and exfiltrate, no HSTS is what keeps the non-Secure cookie leakable. Findability is one header dump — the skill is knowing which absence matters and against which page.",
        simple: "Response-header defenses that are missing or toothless. Bugcrowd is deliberately stingy here: the one header variant that reaches P4 is a missing/weak Cache-Control on a SENSITIVE page — a page whose response (account details, tokens in the body, PII) gets cached by a shared proxy or the browser's back/forward and disk cache, so it can be retrieved later on a shared or compromised machine. The broader hygiene set — Content-Security-Policy, HSTS, X-Frame-Options/frame-ancestors, X-Content-Type-Options — is P5 on its own, because a missing header is a weakened mitigation, not an exploit. The advanced read is to treat the P5 ones as escalation ENABLERS and report them attached to the bug they unlock: no X-Frame-Options/frame-ancestors is what makes a clickjacking PoC possible, a weak CSP is what lets an injected script actually run and exfiltrate, no HSTS is what keeps the non-Secure cookie leakable. It's found with one header dump — the skill is knowing which absence matters and against which page.",
        hi: "Response-header defenses जो या तो गायब हों या बेदम। Bugcrowd यहाँ जानबूझकर कंजूस है: एकमात्र header variant जो P4 तक पहुँचता है वह है किसी SENSITIVE page पर missing/weak Cache-Control — एक ऐसा page जिसकी response (account details, body में tokens, PII) किसी shared proxy या browser के back/forward और disk cache में cache हो जाए, तो यह बाद में किसी shared या compromised machine पर दोबारा निकाली जा सके। बाक़ी hygiene set — Content-Security-Policy, HSTS, X-Frame-Options/frame-ancestors, X-Content-Type-Options — अकेला P5 है, क्योंकि एक missing header कमज़ोर हुई mitigation है, exploit नहीं। advanced नज़रिया यह है कि P5 वालों को escalation ENABLERS मानें और उन्हें उस bug के साथ जोड़कर रिपोर्ट करें जिसे वे खोलते हैं: X-Frame-Options/frame-ancestors का न होना ही clickjacking PoC को मुमकिन बनाता है, एक weak CSP ही किसी injected script को सच में चलने और exfiltrate करने देता है, HSTS का न होना ही non-Secure cookie को leak-योग्य बनाए रखता है। इसे एक header dump से ढूँढा जाता है — असली skill यह जानना है कि कौन सी अनुपस्थिति मायने रखती है और किस page के ख़िलाफ़।",
      },
      howToFind: [
        {
          title: {
            en: "Find a cacheable sensitive response (the P4)",
            simple: "Find a cacheable sensitive response (the P4)",
            hi: "एक cacheable sensitive response ढूँढें (यही P4 है)",
          },
          steps: [
            {
              en: "Locate authenticated pages that return sensitive data in the body (account/profile, invoices, API responses with tokens/PII).",
              simple: "Find authenticated pages that return sensitive data in the body (account/profile, invoices, API responses with tokens/PII).",
              hi: "ऐसे authenticated pages ढूँढें जो body में sensitive data लौटाते हैं (account/profile, invoices, tokens/PII वाली API responses)।",
            },
            {
              en: "Check their Cache-Control / Pragma / Expires: anything other than no-store (e.g. missing, public, or max-age>0) on such a page is the P4 — the sensitive body can land in a shared/proxy cache or browser disk cache.",
              simple: "Check their Cache-Control / Pragma / Expires: anything other than no-store (e.g. missing, public, or max-age>0) on such a page is the P4 — the sensitive body can land in a shared/proxy cache or browser disk cache.",
              hi: "उनकी Cache-Control / Pragma / Expires check करें: ऐसे page पर no-store के अलावा कुछ भी (जैसे missing, public, या max-age>0) ही P4 है — sensitive body किसी shared/proxy cache या browser disk cache में जा सकती है।",
            },
            {
              en: "Demonstrate retrievability safely: after loading the sensitive page, use the browser Back button or inspect the disk cache to show the response is served again without re-authentication — on your own session only.",
              simple: "Show retrievability safely: after loading the sensitive page, use the browser Back button or inspect the disk cache to show the response is served again without re-authentication — on your own session only.",
              hi: "retrievability सुरक्षित तरीक़े से दिखाएँ: sensitive page load करने के बाद, browser के Back button का इस्तेमाल करें या disk cache inspect करें ताकि दिखे कि response बिना re-authentication के दोबारा serve होती है — सिर्फ़ अपनी session पर।",
            },
          ],
        },
        {
          title: {
            en: "Inventory the P5 headers as escalation enablers",
            simple: "List the P5 headers as escalation enablers",
            hi: "P5 headers को escalation enablers के तौर पर list करें",
          },
          steps: [
            {
              en: "Dump the full header set with nuclei's missing-security-headers template or a curl -I, and record which of CSP, HSTS, X-Frame-Options/frame-ancestors, X-Content-Type-Options, Referrer-Policy are absent or weak.",
              simple: "Dump the full header set with nuclei's missing-security-headers template or a curl -I, and record which of CSP, HSTS, X-Frame-Options/frame-ancestors, X-Content-Type-Options, Referrer-Policy are absent or weak.",
              hi: "nuclei के missing-security-headers template या एक curl -I से पूरा header set dump करें, और नोट करें कि CSP, HSTS, X-Frame-Options/frame-ancestors, X-Content-Type-Options, Referrer-Policy में से कौन से absent या weak हैं।",
            },
            {
              en: "For each gap, note the specific bug it unlocks rather than reporting it bare: no frame-ancestors → clickjacking POC viable; permissive CSP (unsafe-inline / wildcard) → injected script executes; no HSTS → cleartext downgrade keeps non-Secure cookies in play.",
              simple: "For each gap, note the specific bug it unlocks rather than reporting it bare: no frame-ancestors → clickjacking PoC viable; permissive CSP (unsafe-inline / wildcard) → injected script executes; no HSTS → cleartext downgrade keeps non-Secure cookies in play.",
              hi: "हर gap के लिए, उसे खाली रिपोर्ट करने के बजाय नोट करें कि वह कौन सा ख़ास bug खोलता है: no frame-ancestors → clickjacking PoC मुमकिन; permissive CSP (unsafe-inline / wildcard) → injected script चलता है; no HSTS → cleartext downgrade non-Secure cookies को खेल में बनाए रखता है।",
            },
            {
              en: "Report the P5 header only bundled with the realised bug it enables — a standalone 'CSP missing' is informational and burns signal.",
              simple: "Report the P5 header only bundled with the real bug it enables — a standalone 'CSP missing' is informational and burns signal.",
              hi: "P5 header को सिर्फ़ उस realised bug के साथ bundle करके रिपोर्ट करें जिसे वह enable करता है — अकेला 'CSP missing' informational है और signal बर्बाद करता है।",
            },
          ],
        },
      ],
      payloads: [
        "curl -sI https://app.target.com/account | grep -iE 'cache-control|pragma|expires'   (sensitive page cached? missing no-store = P4)",
        "nuclei -u https://app.target.com -t http/misconfiguration/http-missing-security-headers.yaml   (full hygiene inventory)",
        "curl -sI https://app.target.com/ | grep -iE 'content-security-policy|strict-transport-security|x-frame-options|x-content-type-options'",
        "securityheaders.com style check via: curl -sI https://app.target.com/ | sort   (eyeball the whole set at once)",
      ],
      example: {
        en: "The /account/billing page returned full card-last4 and address data with `Cache-Control: private, max-age=600` instead of no-store. On a shared kiosk the hunter showed the page re-rendered from disk cache via the Back button after logout — a sensitive-page cache-control weakness, P4. The same host's missing frame-ancestors/X-Frame-Options was NOT filed alone; it was carried into a separate clickjacking report where the missing header was the precondition that made the POC frame load.",
        simple: "The /account/billing page returned full card-last4 and address data with `Cache-Control: private, max-age=600` instead of no-store. On a shared kiosk the hunter showed the page re-render from disk cache via the Back button after logout — a sensitive-page cache-control weakness, P4. The same host's missing frame-ancestors/X-Frame-Options was NOT filed alone; it was carried into a separate clickjacking report where the missing header was the precondition that let the PoC frame load.",
        hi: "/account/billing page पूरा card-last4 और address data `Cache-Control: private, max-age=600` के साथ (no-store के बजाय) लौटाता था। एक shared kiosk पर hunter ने दिखाया कि logout के बाद Back button से page disk cache से दोबारा render हुआ — एक sensitive-page cache-control weakness, P4। उसी host का missing frame-ancestors/X-Frame-Options अकेले file नहीं किया गया; इसे एक अलग clickjacking report में ले जाया गया जहाँ missing header वह precondition था जिसने PoC frame को load होने दिया।",
      },
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › Lack of Security Headers › Cache-Control for a Sensitive Page",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N",
        hackeroneCwe: "CWE-525: Use of Web Browser Cache Containing Sensitive Information",
        cvssSeverity: "Low (sensitive-page Cache-Control); other headers Informational",
        note: {
          en: "Only the Cache-Control-on-a-sensitive-page variant is P4. Missing CSP, HSTS, X-Frame-Options and X-Content-Type-Options are P5 standalone — report them attached to the concrete bug they enable (clickjacking, CSP-defeated XSS exfil, cleartext downgrade), not on their own.",
          simple: "Only the Cache-Control-on-a-sensitive-page variant is P4. Missing CSP, HSTS, X-Frame-Options and X-Content-Type-Options are P5 on their own — report them attached to the concrete bug they enable (clickjacking, CSP-defeated XSS exfil, cleartext downgrade), not on their own.",
          hi: "सिर्फ़ Cache-Control-on-a-sensitive-page variant ही P4 है। Missing CSP, HSTS, X-Frame-Options और X-Content-Type-Options अकेले P5 हैं — इन्हें उस ठोस bug के साथ जोड़कर रिपोर्ट करें जिसे वे enable करते हैं (clickjacking, CSP-defeated XSS exfil, cleartext downgrade), अकेले नहीं।",
        },
      },
      checklistCategoryId: "client-storage",
      references: [
        { label: "OWASP Secure Headers Project", url: "https://owasp.org/www-project-secure-headers/" },
        { label: "MDN: Cache-Control", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control" },
      ],
    },
    {
      id: "oauth-account-squatting",
      name: "OAuth Misconfiguration — Account Squatting",
      emoji: "🪪",
      intro: {
        en: "A pre-registration / identity-binding flaw in a 'Sign in with <provider>' implementation where an attacker can create or occupy an account tied to a victim's identifier (usually an email) before the victim ever arrives. The mechanism: the app provisions an account keyed on the email returned by the IdP without proving control of that email, or it links a social login to an existing local account purely on matching email, or it lets a federated signup pre-claim an address that the real owner later signs up for — so the victim ends up logging into an account the attacker already shares or seeded. Bugcrowd scores the squatting variant P4 (UI:R, AC:H — it needs the victim to eventually sign in and a specific unverified-binding condition). The escalation edge is the one to watch: when the pre-claimed/shared account survives the victim's own signup and retains attacker access to the victim's data, it crosses into pre-account-takeover, which is scored far higher. The subtle finding is the missing email-verification step between IdP assertion and local account creation/linking.",
        simple: "A pre-registration / identity-binding flaw in a 'Sign in with <provider>' implementation where an attacker can create or occupy an account tied to a victim's identifier (usually an email) before the victim ever arrives. The mechanism: the app creates an account keyed on the email the IdP returns without proving control of that email, or it links a social login to an existing local account purely on a matching email, or it lets a federated signup pre-claim an address the real owner later signs up for — so the victim ends up logging into an account the attacker already shares or seeded. Bugcrowd scores the squatting variant P4 (UI:R, AC:H — it needs the victim to eventually sign in and a specific unverified-binding condition). The one to watch: when the pre-claimed/shared account survives the victim's own signup and keeps attacker access to the victim's data, it becomes pre-account-takeover, which is scored far higher. The key finding is the missing email-verification step between the IdP assertion and local account creation/linking.",
        hi: "एक 'Sign in with <provider>' implementation में pre-registration / identity-binding की खामी जहाँ attacker victim के identifier (आम तौर पर email) से बंधा एक account victim के आने से पहले ही बना या क़ब्ज़ा कर सकता है। तरीक़ा: app उस email पर keyed account बना देता है जो IdP लौटाता है, बिना उस email का control साबित किए; या किसी social login को महज़ matching email पर एक मौजूदा local account से link कर देता है; या किसी federated signup को ऐसा address pre-claim करने देता है जिसके असली मालिक बाद में signup करें — तो victim आख़िर में एक ऐसे account में login कर बैठता है जिसे attacker पहले से share या seed कर चुका है। Bugcrowd squatting variant को P4 score करता है (UI:R, AC:H — इसके लिए victim का आख़िरकार sign in करना और एक ख़ास unverified-binding शर्त चाहिए)। जिस पर नज़र रखनी है: जब pre-claimed/shared account victim के अपने signup के बाद भी टिका रहे और attacker को victim के data का access बनाए रखे, तो यह pre-account-takeover में बदल जाता है, जो कहीं ज़्यादा score होता है। असली finding है IdP assertion और local account creation/linking के बीच का missing email-verification step।",
      },
      howToFind: [
        {
          title: {
            en: "Map how identities are bound",
            simple: "Map how identities get bound",
            hi: "map करें कि identities कैसे bind होती हैं",
          },
          steps: [
            {
              en: "Enumerate the account-creation paths: local email+password signup, OAuth/OIDC signup, and OAuth-link-to-existing — then test the order dependency (local-first-then-social vs social-first-then-local).",
              simple: "List the account-creation paths: local email+password signup, OAuth/OIDC signup, and OAuth-link-to-existing — then test the order dependency (local-first-then-social vs social-first-then-local).",
              hi: "account-creation paths enumerate करें: local email+password signup, OAuth/OIDC signup, और OAuth-link-to-existing — फिर order dependency test करें (local-first-then-social बनाम social-first-then-local)।",
            },
            {
              en: "For each, check whether the app ever proves control of the email it keys on: does social login auto-link to a local account with the same email with no verification, and does it trust an unverified `email` claim from the IdP?",
              simple: "For each, check whether the app ever proves control of the email it keys on: does social login auto-link to a local account with the same email with no verification, and does it trust an unverified `email` claim from the IdP?",
              hi: "हर एक के लिए check करें कि app जिस email पर key करता है उसका control कभी साबित करता है या नहीं: क्या social login बिना verification के उसी email वाले local account से auto-link कर देता है, और क्या यह IdP से आए unverified `email` claim पर भरोसा करता है?",
            },
            {
              en: "Test the pre-claim: register (or start OAuth signup for) an address you do NOT own but the target might, and see whether the app creates/holds the account without emailing a verification step.",
              simple: "Test the pre-claim: register (or start OAuth signup for) an address you do NOT own but the target might, and see whether the app creates/holds the account without sending a verification email.",
              hi: "pre-claim test करें: ऐसा address register करें (या उसके लिए OAuth signup शुरू करें) जो आपका नहीं पर target का हो सकता है, और देखें कि app verification email भेजे बिना account बना/रोक लेता है या नहीं।",
            },
          ],
        },
        {
          title: {
            en: "Prove benignly with two accounts you control",
            simple: "Prove it safely with two accounts you control",
            hi: "अपने control वाले दो accounts से सुरक्षित तरीक़े से साबित करें",
          },
          steps: [
            {
              en: "Use two identities you own (attacker account + a 'victim' email you also control) — never a real user's address — to demonstrate the binding: attacker pre-claims, victim later signs in via the provider, both reach the same account.",
              simple: "Use two identities you own (an attacker account + a 'victim' email you also control) — never a real user's address — to show the binding: attacker pre-claims, victim later signs in via the provider, both reach the same account.",
              hi: "अपनी ख़ुद की दो identities इस्तेमाल करें (attacker account + एक 'victim' email जो भी आपके control में हो) — कभी किसी असली user का address नहीं — ताकि binding दिखाई जाए: attacker pre-claim करता है, victim बाद में provider से sign in करता है, दोनों एक ही account तक पहुँचते हैं।",
            },
            {
              en: "Distinguish squatting (P4 — you share/occupy an account, victim is inconvenienced) from pre-ATO (higher — after the victim completes signup the attacker still reads/controls the victim's data); capture which boundary you crossed.",
              simple: "Tell squatting apart from pre-ATO: squatting (P4) means you share/occupy an account and the victim is inconvenienced; pre-ATO (higher) means that after the victim completes signup the attacker still reads/controls the victim's data; capture which boundary you crossed.",
              hi: "squatting और pre-ATO में फ़र्क़ करें: squatting (P4) मतलब आप account share/क़ब्ज़ा करते हैं और victim को असुविधा होती है; pre-ATO (ज़्यादा) मतलब victim के signup पूरा करने के बाद भी attacker victim का data पढ़ता/control करता है; नोट करें कि आपने कौन सी boundary पार की।",
            },
            {
              en: "Keep it read-only on the victim side: show the shared-access fact, don't exfiltrate data; flag the pre-ATO escalation to the user before drafting anything.",
              simple: "Keep it read-only on the victim side: show the shared-access fact, don't exfiltrate data; flag the pre-ATO escalation to the user before drafting anything.",
              hi: "victim की तरफ़ इसे read-only रखें: shared-access तथ्य दिखाएँ, data exfiltrate न करें; कुछ भी draft करने से पहले pre-ATO escalation को user को flag करें।",
            },
          ],
        },
      ],
      payloads: [
        "# 1) Attacker signs up via 'Login with Google' using victim@yourdomain.test (an address YOU control)",
        "# 2) 'Victim' later registers locally / via a different IdP with the SAME email",
        "# 3) Observe whether both land in one account with no email-verification gate = account squatting",
        "curl -s https://app.target.com/api/auth/callback?code=...   (inspect whether linking keys on an UNVERIFIED email claim)",
        "# Compare signup order: local-first-then-social vs social-first-then-local — the vulnerable path is the one that skips verification",
      ],
      example: {
        en: "The app linked any 'Sign in with Google' to an existing local account whenever the Google `email` matched, with no re-verification. Using two addresses the hunter owned, an attacker-seeded local account for victim@lab.test was silently joined when the 'victim' first used Google SSO — both sessions reached one account: account squatting, P4 (UI:R, AC:H). Because the attacker's session persisted and could read data the victim added afterward, it was escalated and written up as a pre-account-takeover and flagged to the program before reporting.",
        simple: "The app linked any 'Sign in with Google' to an existing local account whenever the Google `email` matched, with no re-verification. Using two addresses the hunter owned, an attacker-seeded local account for victim@lab.test was silently joined when the 'victim' first used Google SSO — both sessions reached one account: account squatting, P4 (UI:R, AC:H). Because the attacker's session stayed and could read data the victim added afterward, it was escalated and written up as a pre-account-takeover and flagged to the program before reporting.",
        hi: "app किसी भी 'Sign in with Google' को, जब भी Google का `email` match करे, एक मौजूदा local account से बिना re-verification के link कर देता था। hunter के अपने दो addresses इस्तेमाल करके, victim@lab.test के लिए attacker-seeded एक local account तब चुपचाप जुड़ गया जब 'victim' ने पहली बार Google SSO इस्तेमाल किया — दोनों sessions एक ही account तक पहुँचीं: account squatting, P4 (UI:R, AC:H)। चूँकि attacker की session बनी रही और बाद में victim द्वारा जोड़ा गया data पढ़ सकती थी, इसे escalate करके pre-account-takeover के तौर पर लिखा गया और report करने से पहले program को flag किया गया।",
      },
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › OAuth Misconfiguration › Account Squatting",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:N/A:N",
        hackeroneCwe: "CWE-287: Improper Authentication (and CWE-290: Authentication Bypass by Spoofing)",
        cvssSeverity: "Low standalone (→ High/Critical when it becomes pre-account-takeover)",
        note: {
          en: "Account Squatting = P4 (UI:R, AC:H — needs the victim to sign in and an unverified-binding condition). Escalates to pre-account-takeover when the attacker retains access to the victim's account/data after the victim completes signup — score follows the retained access, not the squat.",
          simple: "Account Squatting = P4 (UI:R, AC:H — needs the victim to sign in and an unverified-binding condition). Escalates to pre-account-takeover when the attacker keeps access to the victim's account/data after the victim completes signup — the score follows the retained access, not the squat.",
          hi: "Account Squatting = P4 (UI:R, AC:H — इसके लिए victim का sign in करना और एक unverified-binding शर्त चाहिए)। यह pre-account-takeover तक escalate होता है जब attacker victim के signup पूरा करने के बाद भी victim के account/data का access बनाए रखे — score बनाए रखे गए access पर निर्भर है, squat पर नहीं।",
        },
      },
      checklistCategoryId: "auth-oauth",
      references: [
        { label: "PortSwigger: OAuth 2.0 authentication vulnerabilities", url: "https://portswigger.net/web-security/oauth" },
        { label: "Microsoft/OWASP: Pre-account-takeover patterns", url: "https://owasp.org/www-project-web-security-testing-guide/" },
      ],
    },
    {
      id: "dbms-misconfiguration",
      name: "DBMS Misconfiguration",
      emoji: "🗄️",
      intro: {
        en: "The database tier left with a weakened security posture that an authenticated or already-foothold-holding party can observe and leverage — most pointedly, an application (or lower-privilege) DB account that runs as DBA / superuser or carries far more privilege than its function needs. Bugcrowd scores the excessively-privileged-user / DBA variant P4 with PR:H and AC:H, because realising it presupposes you already reached the database context (an injection point, a leaked connection string, an exposed admin console). But that is exactly why it matters to an advanced hunter: it is the privilege-escalation lever that turns a merely-interesting SQL injection into file read/write (INTO OUTFILE, lo_import/COPY), command execution (xp_cmdshell, PL/perlu), and reads across every database on the instance. The subtle findable condition is the gap between what the app account CAN do and what it NEEDS to — a web app whose DB user is `root@%`, `sa`, or a Postgres superuser is the misconfiguration, independent of how you reached it. Exposed unauthenticated DB ports and default creds are the adjacent, higher-impact cousins — note them, but the leaf here is the over-privilege.",
        simple: "The database tier left with a weakened security posture that an authenticated or already-foothold-holding party can observe and use — most of all, an application (or lower-privilege) DB account that runs as DBA / superuser or has far more privilege than its function needs. Bugcrowd scores the excessively-privileged-user / DBA variant P4 with PR:H and AC:H, because realising it assumes you already reached the database context (an injection point, a leaked connection string, an exposed admin console). But that's exactly why it matters to an advanced hunter: it's the privilege-escalation lever that turns a merely-interesting SQL injection into file read/write (INTO OUTFILE, lo_import/COPY), command execution (xp_cmdshell, PL/perlu), and reads across every database on the instance. The findable condition is the gap between what the app account CAN do and what it NEEDS to — a web app whose DB user is `root@%`, `sa`, or a Postgres superuser is the misconfiguration, however you reached it. Exposed unauthenticated DB ports and default creds are the related, higher-impact cousins — note them, but the leaf here is the over-privilege.",
        hi: "database tier जो ऐसी कमज़ोर security posture में छोड़ा गया हो जिसे कोई authenticated या पहले से foothold रखने वाला पक्ष देख और इस्तेमाल कर सके — सबसे ख़ास, एक application (या कम-privilege) DB account जो DBA / superuser के तौर पर चले या अपनी ज़रूरत से कहीं ज़्यादा privilege रखे। Bugcrowd excessively-privileged-user / DBA variant को PR:H और AC:H के साथ P4 score करता है, क्योंकि इसे हासिल करने के लिए यह मान लिया जाता है कि आप पहले ही database context तक पहुँच चुके हैं (एक injection point, एक leak हुई connection string, एक exposed admin console)। पर यही वजह है कि यह advanced hunter के लिए मायने रखता है: यह वह privilege-escalation lever है जो एक महज़-दिलचस्प SQL injection को file read/write (INTO OUTFILE, lo_import/COPY), command execution (xp_cmdshell, PL/perlu), और instance के हर database में reads तक बदल देता है। पकड़ने लायक़ शर्त है उस फ़र्क़ में जो app account कर सकता है और जो उसे करने की ज़रूरत है — एक web app जिसका DB user `root@%`, `sa`, या Postgres superuser हो, वही misconfiguration है, चाहे आप वहाँ कैसे भी पहुँचे हों। exposed unauthenticated DB ports और default creds इसके पड़ोसी, ज़्यादा impact वाले cousins हैं — उन्हें नोट करें, पर यहाँ leaf over-privilege है।",
      },
      howToFind: [
        {
          title: {
            en: "Enumerate the DB account's privilege (from an authorised context)",
            simple: "Enumerate the DB account's privilege (from an authorised context)",
            hi: "DB account की privilege enumerate करें (किसी authorised context से)",
          },
          steps: [
            {
              en: "When you already hold a DB context the program authorises you to use (your own injection POC, a sanctioned credential), ask the engine who you are and what you can do — read-only metadata queries, not data theft.",
              simple: "When you already hold a DB context the program authorises you to use (your own injection PoC, a sanctioned credential), ask the engine who you are and what you can do — read-only metadata queries, not data theft.",
              hi: "जब आपके पास पहले से एक DB context हो जिसे program इस्तेमाल करने की इजाज़त देता है (आपका अपना injection PoC, एक मंज़ूर credential), तो engine से पूछें कि आप कौन हैं और क्या कर सकते हैं — read-only metadata queries, data theft नहीं।",
            },
            {
              en: "MySQL: SELECT current_user(), @@hostname; SHOW GRANTS; — an app user with ALL PRIVILEGES ... WITH GRANT or FILE is over-privileged. Postgres: SELECT current_user, usesuper FROM pg_user WHERE usename=current_user; — usesuper = t is DBA.",
              simple: "MySQL: SELECT current_user(), @@hostname; SHOW GRANTS; — an app user with ALL PRIVILEGES ... WITH GRANT or FILE is over-privileged. Postgres: SELECT current_user, usesuper FROM pg_user WHERE usename=current_user; — usesuper = t means DBA.",
              hi: "MySQL: SELECT current_user(), @@hostname; SHOW GRANTS; — एक app user जिसके पास ALL PRIVILEGES ... WITH GRANT या FILE हो, वह over-privileged है। Postgres: SELECT current_user, usesuper FROM pg_user WHERE usename=current_user; — usesuper = t मतलब DBA।",
            },
            {
              en: "MSSQL: SELECT IS_SRVROLEMEMBER('sysadmin'), SYSTEM_USER; — membership in sysadmin from an app login is the misconfiguration.",
              simple: "MSSQL: SELECT IS_SRVROLEMEMBER('sysadmin'), SYSTEM_USER; — membership in sysadmin from an app login is the misconfiguration.",
              hi: "MSSQL: SELECT IS_SRVROLEMEMBER('sysadmin'), SYSTEM_USER; — किसी app login का sysadmin में membership ही misconfiguration है।",
            },
          ],
        },
        {
          title: {
            en: "Spot the exposed/default-auth cousins during recon",
            simple: "Spot the exposed/default-auth cousins during recon",
            hi: "recon के दौरान exposed/default-auth cousins पहचानें",
          },
          steps: [
            {
              en: "Port-scan for database services that should never face you: 3306/5432/1433/27017/6379/9200 — a database reachable from the internet is a recon-ports finding in its own right.",
              simple: "Port-scan for database services that should never face you: 3306/5432/1433/27017/6379/9200 — a database reachable from the internet is a recon-ports finding in its own right.",
              hi: "ऐसी database services के लिए port-scan करें जिन्हें कभी आपके सामने नहीं होना चाहिए: 3306/5432/1433/27017/6379/9200 — internet से reachable एक database अपने आप में एक recon-ports finding है।",
            },
            {
              en: "Fingerprint without authenticating where possible (nmap service scripts banner the version/engine); note default or blank credentials as a separate, higher-severity issue rather than logging in and ranging around.",
              simple: "Fingerprint without authenticating where possible (nmap service scripts banner the version/engine); note default or blank credentials as a separate, higher-severity issue rather than logging in and poking around.",
              hi: "जहाँ मुमकिन हो बिना authenticate किए fingerprint करें (nmap service scripts version/engine banner कर देते हैं); default या blank credentials को login करके घूमने के बजाय एक अलग, higher-severity issue के तौर पर नोट करें।",
            },
            {
              en: "Tie the over-privilege to a concrete escalation in the report: with FILE/superuser, a SQLi goes from data read to file write / RCE — state the lever, prove it with a single benign check (e.g. can you SELECT a non-sensitive server variable), and stop.",
              simple: "Tie the over-privilege to a concrete escalation in the report: with FILE/superuser, a SQLi goes from data read to file write / RCE — state the lever, prove it with a single safe check (e.g. can you SELECT a non-sensitive server variable), and stop.",
              hi: "रिपोर्ट में over-privilege को एक ठोस escalation से जोड़ें: FILE/superuser के साथ, एक SQLi data read से file write / RCE तक जाती है — lever बताएँ, इसे एक अकेले benign check से साबित करें (जैसे क्या आप किसी non-sensitive server variable को SELECT कर सकते हैं), और रुक जाएँ।",
            },
          ],
        },
      ],
      payloads: [
        "SHOW GRANTS FOR CURRENT_USER();   -- MySQL: ALL PRIVILEGES / FILE / GRANT OPTION on an app user = over-privileged",
        "SELECT current_user, usesuper, usecreatedb FROM pg_user WHERE usename = current_user;   -- Postgres: usesuper='t' = DBA",
        "SELECT IS_SRVROLEMEMBER('sysadmin') AS is_sa, SYSTEM_USER;   -- MSSQL: 1 = app login is sysadmin",
        "nmap -sV -Pn -p 3306,5432,1433,27017,6379,9200 target   (database services that should not be internet-facing)",
      ],
      example: {
        en: "A blind SQL injection the program had already accepted was re-examined for privilege: SHOW GRANTS for the app user returned `GRANT ALL PRIVILEGES ON *.* ... WITH GRANT OPTION`, including FILE. The over-privilege itself triaged P4 (DBMS Misconfiguration › Excessively Privileged User/DBA, PR:H/AC:H — it needs the existing DB context). Its real worth was as the escalation note on the injection: FILE privilege meant the SQLi could write a web shell, lifting that report's impact from data read toward RCE.",
        simple: "A blind SQL injection the program had already accepted was re-examined for privilege: SHOW GRANTS for the app user returned `GRANT ALL PRIVILEGES ON *.* ... WITH GRANT OPTION`, including FILE. The over-privilege itself triaged P4 (DBMS Misconfiguration › Excessively Privileged User/DBA, PR:H/AC:H — it needs the existing DB context). Its real worth was as the escalation note on the injection: FILE privilege meant the SQLi could write a web shell, lifting that report's impact from data read toward RCE.",
        hi: "एक blind SQL injection जिसे program पहले ही accept कर चुका था, उसे privilege के लिए दोबारा जाँचा गया: app user के लिए SHOW GRANTS ने `GRANT ALL PRIVILEGES ON *.* ... WITH GRANT OPTION`, FILE समेत, लौटाया। over-privilege ख़ुद P4 triage हुआ (DBMS Misconfiguration › Excessively Privileged User/DBA, PR:H/AC:H — इसके लिए मौजूदा DB context चाहिए)। इसकी असली क़ीमत injection पर escalation note के रूप में थी: FILE privilege का मतलब था कि SQLi एक web shell लिख सकती है, जिसने उस report का impact data read से RCE की ओर बढ़ा दिया।",
      },
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › Database Management System (DBMS) Misconfiguration › Excessively Privileged User / DBA",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:H/PR:H/UI:N/S:U/C:L/I:L/A:N",
        hackeroneCwe: "CWE-250: Execution with Unnecessary Privileges (and CWE-269: Improper Privilege Management)",
        cvssSeverity: "Low (PR:H/AC:H — presupposes an existing DB context)",
        note: {
          en: "Excessively-privileged app/DB user (DBA/superuser) = P4. PR:H and AC:H because you must already hold a DB context to observe it. The lever matters: FILE/superuser turns an accepted SQLi into file write / RCE. Internet-exposed DB ports and default creds are separate, higher-severity issues — flag, don't exploit.",
          simple: "Excessively-privileged app/DB user (DBA/superuser) = P4. PR:H and AC:H because you must already hold a DB context to observe it. The lever matters: FILE/superuser turns an accepted SQLi into file write / RCE. Internet-exposed DB ports and default creds are separate, higher-severity issues — flag, don't exploit.",
          hi: "Excessively-privileged app/DB user (DBA/superuser) = P4। PR:H और AC:H इसलिए कि इसे देखने के लिए आपके पास पहले से DB context होना चाहिए। lever मायने रखता है: FILE/superuser एक accepted SQLi को file write / RCE में बदल देता है। Internet-exposed DB ports और default creds अलग, higher-severity issues हैं — flag करें, exploit न करें।",
        },
      },
      checklistCategoryId: "recon-ports",
      references: [
        { label: "OWASP: Database Security Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html" },
        { label: "PortSwigger: SQL injection", url: "https://portswigger.net/web-security/sql-injection" },
      ],
    },
    {
      id: "lack-of-password-confirmation",
      name: "Lack of Password Confirmation",
      emoji: "🔑",
      intro: {
        en: "A high-value, irreversible state change that executes without re-asking for the current password (or an equivalent step-up such as re-auth / fresh 2FA). Bugcrowd grades strictly by consequence: skipping password confirmation on DELETE ACCOUNT is the P4 leaf, because the action is destructive and irreversible, whereas the same omission on change-email, change-password, or 2FA-management is P5 (those are recoverable or less severe on their own). Why it matters to an advanced hunter: a missing re-auth gate is the amplifier that converts a lower-severity session-adjacent bug into real damage — a one-click CSRF, a reflected/stored XSS, or a stolen-but-expired-session replay all become account destruction when the sensitive endpoint never demanded the password the attacker doesn't have. The subtle finding is confirming that the password field in the UI is cosmetic — that the backend accepts the state change when the confirmation value is absent, blank, or wrong — rather than assuming the client-side prompt is enforced.",
        simple: "A high-value, irreversible state change that runs without re-asking for the current password (or an equivalent step-up such as re-auth / fresh 2FA). Bugcrowd grades strictly by consequence: skipping password confirmation on DELETE ACCOUNT is the P4 leaf, because the action is destructive and irreversible, whereas the same omission on change-email, change-password, or 2FA-management is P5 (those are recoverable or less severe on their own). Why it matters to an advanced hunter: a missing re-auth gate is the amplifier that turns a lower-severity session-adjacent bug into real damage — a one-click CSRF, a reflected/stored XSS, or a stolen-but-expired-session replay all become account destruction when the sensitive endpoint never asked for the password the attacker doesn't have. The key finding is confirming that the password field in the UI is cosmetic — that the backend accepts the state change when the confirmation value is absent, blank, or wrong — rather than assuming the client-side prompt is enforced.",
        hi: "एक high-value, irreversible state change जो मौजूदा password (या कोई समतुल्य step-up जैसे re-auth / fresh 2FA) दोबारा पूछे बिना चल जाए। Bugcrowd सख़्ती से नतीजे के हिसाब से grade करता है: DELETE ACCOUNT पर password confirmation छोड़ना ही P4 leaf है, क्योंकि यह action destructive और irreversible है, जबकि वही चूक change-email, change-password, या 2FA-management पर P5 है (वे recoverable या अपने आप में कम गंभीर हैं)। advanced hunter के लिए क्यों मायने रखता है: एक missing re-auth gate वह amplifier है जो किसी lower-severity session-adjacent bug को असली नुक़सान में बदल देता है — एक one-click CSRF, एक reflected/stored XSS, या एक stolen-but-expired-session replay सब account destruction बन जाते हैं जब sensitive endpoint ने वह password कभी माँगा ही नहीं जो attacker के पास नहीं है। असली finding यह पक्का करना है कि UI में password field cosmetic है — कि backend state change तब भी accept करता है जब confirmation value absent, blank, या ग़लत हो — न कि यह मान लेना कि client-side prompt enforce होता है।",
      },
      howToFind: [
        {
          title: {
            en: "Test whether the backend actually enforces re-auth",
            simple: "Test whether the backend really enforces re-auth",
            hi: "test करें कि backend सच में re-auth enforce करता है",
          },
          steps: [
            {
              en: "Drive the sensitive action (account deletion) in the UI and capture the request; then replay it in Burp with the password/confirmation field removed, emptied, or set to a wrong value.",
              simple: "Run the sensitive action (account deletion) in the UI and capture the request; then replay it in Burp with the password/confirmation field removed, emptied, or set to a wrong value.",
              hi: "UI में sensitive action (account deletion) चलाएँ और request capture करें; फिर उसे Burp में password/confirmation field हटाकर, खाली करके, या ग़लत value पर set करके दोबारा भेजें।",
            },
            {
              en: "A 200 / success with no valid current password proves the confirmation is cosmetic — the server never checks it. Do this on your OWN test account only, since the action is destructive.",
              simple: "A 200 / success with no valid current password proves the confirmation is cosmetic — the server never checks it. Do this on your OWN test account only, since the action is destructive.",
              hi: "बिना किसी valid current password के एक 200 / success साबित करता है कि confirmation cosmetic है — server इसे कभी check नहीं करता। चूँकि action destructive है, इसे सिर्फ़ अपने ख़ुद के test account पर करें।",
            },
            {
              en: "Check the step-up equivalents too: does a sensitive change accept a stale session, or skip the fresh-2FA prompt the UI implies? Absence of any server-side step-up is the core finding.",
              simple: "Check the step-up equivalents too: does a sensitive change accept a stale session, or skip the fresh-2FA prompt the UI implies? The absence of any server-side step-up is the core finding.",
              hi: "step-up के समतुल्य भी check करें: क्या कोई sensitive change किसी stale session को accept कर लेता है, या UI जो fresh-2FA prompt दिखाता है उसे छोड़ देता है? किसी भी server-side step-up का न होना ही मूल finding है।",
            },
          ],
        },
        {
          title: {
            en: "Rank the action and look for the chain",
            simple: "Rank the action and look for the chain",
            hi: "action को rank करें और chain ढूँढें",
          },
          steps: [
            {
              en: "Classify the endpoint by VRT: delete-account → P4; change-email / change-password / disable-2FA → P5 standalone — report accordingly, don't over-claim.",
              simple: "Classify the endpoint by VRT: delete-account → P4; change-email / change-password / disable-2FA → P5 on their own — report accordingly, don't over-claim.",
              hi: "endpoint को VRT के हिसाब से classify करें: delete-account → P4; change-email / change-password / disable-2FA → अकेले P5 — उसी हिसाब से रिपोर्ट करें, बढ़ा-चढ़ाकर दावा न करें।",
            },
            {
              en: "Probe CSRF-ability of the unprotected sensitive action: no CSRF token + no re-auth on account deletion is a one-request destructive CSRF — a materially stronger finding than the missing confirmation alone.",
              simple: "Probe whether the unprotected sensitive action is CSRF-able: no CSRF token + no re-auth on account deletion is a one-request destructive CSRF — a clearly stronger finding than the missing confirmation alone.",
              hi: "जाँचें कि unprotected sensitive action CSRF-able है या नहीं: account deletion पर न CSRF token और न re-auth होना एक one-request destructive CSRF है — अकेली missing confirmation से साफ़ तौर पर मज़बूत finding।",
            },
            {
              en: "Pair with any XSS or session-fixation surface: a sensitive endpoint that needs no password is where those bugs cash out — note the chain explicitly and flag to the user.",
              simple: "Pair it with any XSS or session-fixation surface: a sensitive endpoint that needs no password is where those bugs cash out — note the chain explicitly and flag it to the user.",
              hi: "इसे किसी भी XSS या session-fixation surface के साथ जोड़ें: एक sensitive endpoint जिसे किसी password की ज़रूरत नहीं, वहीं वे bugs cash out होते हैं — chain को साफ़ तौर पर नोट करें और user को flag करें।",
            },
          ],
        },
      ],
      payloads: [
        "# Capture the real 'delete account' request, then replay without the confirmation field:",
        "curl -s -X POST https://app.target.com/account/delete -H 'Cookie: SESSION=<your-own>' -d ''   (no current_password sent — does it still succeed?)",
        "curl -s -X POST https://app.target.com/account/delete -H 'Cookie: SESSION=<your-own>' -d 'current_password=wrong'   (wrong value accepted = cosmetic check)",
        "# CSRF probe: does the same endpoint accept a cross-site form POST with no token and no re-auth? (destructive — own account only)",
      ],
      example: {
        en: "The account-settings UI showed a 'confirm your password to delete' modal, but replaying the DELETE /account request on a throwaway test account with the current_password field removed returned 200 and destroyed the account — the confirmation was purely client-side. That is the P4 delete-account variant. It was further strengthened by noting the same endpoint carried no CSRF token, making it a one-click destructive CSRF; the chain was flagged to the user before any write-up.",
        simple: "The account-settings UI showed a 'confirm your password to delete' modal, but replaying the DELETE /account request on a throwaway test account with the current_password field removed returned 200 and destroyed the account — the confirmation was purely client-side. That is the P4 delete-account variant. It was further strengthened by noting the same endpoint carried no CSRF token, making it a one-click destructive CSRF; the chain was flagged to the user before any write-up.",
        hi: "account-settings UI ने 'confirm your password to delete' modal दिखाया, पर एक throwaway test account पर current_password field हटाकर DELETE /account request दोबारा भेजने पर 200 आया और account destroy हो गया — confirmation पूरी तरह client-side थी। यही P4 delete-account variant है। इसे और मज़बूत किया गया यह नोट करके कि उसी endpoint पर कोई CSRF token नहीं था, जिससे यह एक one-click destructive CSRF बन गया; किसी भी write-up से पहले chain को user को flag किया गया।",
      },
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › Lack of Password Confirmation › Delete Account",
        bugcrowdPriority: "P4",
        hackeroneCwe: "CWE-620: Unverified Password Change",
        cvssSeverity: "Low (delete-account); other variants Informational",
        note: {
          en: "Delete-account without password confirmation = P4 (destructive, irreversible). Change-email / change-password / 2FA-management variants are P5 standalone. Severity jumps when the unprotected sensitive action is also CSRF-able or reachable via XSS — then it is the cash-out for those bugs.",
          simple: "Delete-account without password confirmation = P4 (destructive, irreversible). Change-email / change-password / 2FA-management variants are P5 on their own. Severity jumps when the unprotected sensitive action is also CSRF-able or reachable via XSS — then it's the cash-out for those bugs.",
          hi: "बिना password confirmation के delete-account = P4 (destructive, irreversible)। Change-email / change-password / 2FA-management variants अकेले P5 हैं। severity तब बढ़ती है जब unprotected sensitive action CSRF-able भी हो या XSS से पहुँच में हो — तब यह उन bugs का cash-out है।",
        },
      },
      checklistCategoryId: "access-privesc",
      references: [
        { label: "OWASP: Re-authentication for sensitive operations", url: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html" },
        { label: "PortSwigger: CSRF", url: "https://portswigger.net/web-security/csrf" },
      ],
    },
    {
      id: "captcha-implementation",
      name: "CAPTCHA Implementation Vulnerability",
      emoji: "🤖",
      intro: {
        en: "A CAPTCHA that is present but implemented so that its anti-automation guarantee can be defeated without actually solving the challenge — the control exists, so it is not the 'missing CAPTCHA' case, but a logic flaw lets a script sail past it. Classic implementations: the server validates the token only on the first request and then caches/reuses it, so one solved token replays indefinitely; the token is validated client-side only, or the success flag is a tamperable field; the answer is returned to the client (in a header, cookie, or hidden field) or is static/guessable; or simply removing the CAPTCHA parameter from the request skips validation entirely. Bugcrowd scores this implementation-vulnerability leaf P4 with an availability-only CVSS (A:L — it enables automated abuse, hence the resource/availability angle), while a CAPTCHA that is merely absent, or only weak against automated brute force, is P5. The point for an advanced hunter is the same as rate-limiting: a broken CAPTCHA re-opens whichever automation-gated attack it was protecting (spray, enumeration, mass-signup, resource burn).",
        simple: "A CAPTCHA that is present but implemented so its anti-automation guarantee can be defeated without actually solving the challenge — the control exists, so it's not the 'missing CAPTCHA' case, but a logic flaw lets a script sail past it. Classic implementations: the server validates the token only on the first request and then caches/reuses it, so one solved token replays forever; the token is validated client-side only, or the success flag is a tamperable field; the answer is returned to the client (in a header, cookie, or hidden field) or is static/guessable; or simply removing the CAPTCHA parameter from the request skips validation entirely. Bugcrowd scores this implementation-vulnerability leaf P4 with an availability-only CVSS (A:L — it enables automated abuse, hence the resource/availability angle), while a CAPTCHA that is merely absent, or only weak against automated brute force, is P5. The point for an advanced hunter is the same as rate-limiting: a broken CAPTCHA re-opens whichever automation-gated attack it was protecting (spray, enumeration, mass-signup, resource burn).",
        hi: "एक CAPTCHA जो मौजूद तो हो पर ऐसे implement किया गया हो कि उसकी anti-automation गारंटी चुनौती को सच में solve किए बिना हराई जा सके — control मौजूद है, तो यह 'missing CAPTCHA' वाला मामला नहीं, पर एक logic flaw किसी script को इसके पार निकल जाने देता है। classic implementations: server token को सिर्फ़ पहली request पर validate करता है और फिर cache/reuse कर लेता है, तो एक solved token हमेशा के लिए replay होता है; token सिर्फ़ client-side validate होता है, या success flag एक tamperable field है; answer client को लौटा दिया जाता है (किसी header, cookie, या hidden field में) या static/guessable है; या बस request से CAPTCHA parameter हटा देना validation को पूरी तरह छोड़ देता है। Bugcrowd इस implementation-vulnerability leaf को availability-only CVSS के साथ P4 score करता है (A:L — यह automated abuse को enable करता है, इसलिए resource/availability पहलू), जबकि एक CAPTCHA जो महज़ गायब हो, या सिर्फ़ automated brute force के ख़िलाफ़ कमज़ोर हो, वह P5 है। advanced hunter के लिए बात rate-limiting जैसी है: एक टूटा CAPTCHA उस automation-gated attack को दोबारा खोल देता है जिसकी वह रक्षा कर रहा था (spray, enumeration, mass-signup, resource burn)।",
      },
      howToFind: [
        {
          title: {
            en: "Attack token lifecycle and binding",
            simple: "Attack the token's lifecycle and binding",
            hi: "token के lifecycle और binding पर हमला करें",
          },
          steps: [
            {
              en: "Solve the CAPTCHA once legitimately, capture the token, then replay the protected request with the SAME token repeatedly — if it is accepted more than once, the server isn't invalidating it (token reuse).",
              simple: "Solve the CAPTCHA once legitimately, capture the token, then replay the protected request with the SAME token repeatedly — if it's accepted more than once, the server isn't invalidating it (token reuse).",
              hi: "CAPTCHA को एक बार जायज़ तरीक़े से solve करें, token capture करें, फिर protected request को उसी token के साथ बार-बार भेजें — अगर यह एक से ज़्यादा बार accept हो, तो server इसे invalidate नहीं कर रहा (token reuse)।",
            },
            {
              en: "Try omitting the CAPTCHA field entirely, blanking it, or sending a well-formed-but-fake value — a request that still succeeds means validation is optional or client-side only.",
              simple: "Try leaving the CAPTCHA field out entirely, blanking it, or sending a well-formed-but-fake value — a request that still succeeds means validation is optional or client-side only.",
              hi: "CAPTCHA field को पूरी तरह छोड़ने, खाली करने, या एक well-formed-but-fake value भेजने की कोशिश करें — एक request जो फिर भी सफल हो मतलब validation optional या सिर्फ़ client-side है।",
            },
            {
              en: "Check whether the challenge/answer leaks to the client: inspect responses, cookies and hidden fields for the expected value, and test whether a static answer always validates (guessable/static CAPTCHA).",
              simple: "Check whether the challenge/answer leaks to the client: inspect responses, cookies and hidden fields for the expected value, and test whether a static answer always validates (guessable/static CAPTCHA).",
              hi: "देखें कि challenge/answer client को leak तो नहीं होता: responses, cookies और hidden fields में expected value देखें, और test करें कि क्या कोई static answer हमेशा validate होता है (guessable/static CAPTCHA)।",
            },
          ],
        },
        {
          title: {
            en: "Confirm the automation it re-opens",
            simple: "Confirm the automation it re-opens",
            hi: "पक्का करें यह कौन सी automation दोबारा खोलता है",
          },
          steps: [
            {
              en: "Once you have a bypass primitive (reusable token / skippable field), show it defeats the automation the CAPTCHA guarded: run a small scripted burst against the gated form and confirm it is no longer throttled by the challenge.",
              simple: "Once you have a bypass primitive (reusable token / skippable field), show it defeats the automation the CAPTCHA guarded: run a small scripted burst against the gated form and confirm it's no longer throttled by the challenge.",
              hi: "जब आपके पास एक bypass primitive हो (reusable token / skippable field), दिखाएँ कि यह उस automation को हराता है जिसकी CAPTCHA रक्षा कर रहा था: gated form के ख़िलाफ़ एक छोटा scripted burst चलाएँ और पक्का करें कि अब challenge इसे throttle नहीं कर रहा।",
            },
            {
              en: "Keep it benign and in-scope: a handful of requests to prove the gate is bypassable, against your own account / test data — not a full attack.",
              simple: "Keep it safe and in-scope: a handful of requests to prove the gate can be bypassed, against your own account / test data — not a full attack.",
              hi: "इसे benign और in-scope रखें: gate bypass हो सकता है यह साबित करने के लिए मुट्ठी भर requests, अपने ख़ुद के account / test data के ख़िलाफ़ — कोई पूरा attack नहीं।",
            },
            {
              en: "Tie the write-up to the downstream variant it unlocks (login spray, registration flood, OTP/email burn) — that is what makes the P4 worth triaging rather than cosmetic.",
              simple: "Tie the write-up to the downstream variant it unlocks (login spray, registration flood, OTP/email burn) — that is what makes the P4 worth triaging rather than cosmetic.",
              hi: "write-up को उस downstream variant से जोड़ें जिसे यह खोलता है (login spray, registration flood, OTP/email burn) — यही P4 को cosmetic के बजाय triage-योग्य बनाता है।",
            },
          ],
        },
      ],
      payloads: [
        "# 1) Solve once, capture g-recaptcha-response / h-captcha-response token",
        "for i in $(seq 1 10); do curl -s -o /dev/null -w '%{http_code}\\n' -X POST https://target/login -d 'user=you&pass=x&captcha=<SAME_TOKEN>'; done   (reuse = broken invalidation)",
        "curl -s -X POST https://target/login -d 'user=you&pass=x'   (CAPTCHA param omitted entirely — still 200?)",
        "curl -s -X POST https://target/login -d 'user=you&pass=x&captcha=fake'   (fake value accepted = client-side-only validation)",
      ],
      example: {
        en: "A login form fronted by reCAPTCHA validated the response token but never invalidated it server-side; one solved token, captured once, was replayed on 200+ login attempts without a fresh challenge. That is the P4 CAPTCHA implementation-vulnerability leaf (A:L — it re-enables automation). Its real impact was reported as the enabler of credential-stuffing against the login endpoint, which the CAPTCHA had been the only control preventing.",
        simple: "A login form fronted by reCAPTCHA validated the response token but never invalidated it server-side; one solved token, captured once, was replayed on 200+ login attempts with no fresh challenge. That is the P4 CAPTCHA implementation-vulnerability leaf (A:L — it re-enables automation). Its real impact was reported as the enabler of credential-stuffing against the login endpoint, which the CAPTCHA had been the only control preventing.",
        hi: "reCAPTCHA से सामने सुरक्षित एक login form response token को validate करता था पर इसे server-side कभी invalidate नहीं करता था; एक बार capture किया गया एक solved token 200+ login attempts पर बिना किसी fresh challenge के replay हुआ। यही P4 CAPTCHA implementation-vulnerability leaf है (A:L — यह automation दोबारा enable करता है)। इसका असली impact login endpoint के ख़िलाफ़ credential-stuffing के enabler के तौर पर रिपोर्ट किया गया, जिसे रोकने वाला अकेला control CAPTCHA ही था।",
      },
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › CAPTCHA › Implementation Vulnerability",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:N/A:L",
        hackeroneCwe: "CWE-804: Guessable CAPTCHA",
        cvssSeverity: "Low (A:L — re-enables automated abuse)",
        note: {
          en: "A defeatable-but-present CAPTCHA (token reuse / client-side-only / skippable param / guessable answer) = P4. A simply missing CAPTCHA, or one only weak against brute force, is P5. Value is as an automation re-enabler — it reopens the spray/enumeration/flood the CAPTCHA was gating.",
          simple: "A defeatable-but-present CAPTCHA (token reuse / client-side-only / skippable param / guessable answer) = P4. A simply missing CAPTCHA, or one only weak against brute force, is P5. Its value is as an automation re-enabler — it reopens the spray/enumeration/flood the CAPTCHA was gating.",
          hi: "एक हराई जा सकने वाली पर मौजूद CAPTCHA (token reuse / सिर्फ़ client-side / skippable param / guessable answer) = P4। एक बस गायब CAPTCHA, या जो सिर्फ़ brute force के ख़िलाफ़ कमज़ोर हो, वह P5 है। इसकी क़ीमत एक automation re-enabler के रूप में है — यह उस spray/enumeration/flood को दोबारा खोल देता है जिसे CAPTCHA रोक रहा था।",
        },
      },
      checklistCategoryId: "auth-password",
      references: [
        { label: "OWASP WSTG: Testing for CAPTCHA", url: "https://owasp.org/www-project-web-security-testing-guide/" },
        { label: "PortSwigger: Bypassing anti-automation", url: "https://portswigger.net/web-security/authentication" },
      ],
    },
    {
      id: "waf-bypass",
      name: "WAF Bypass — Direct Server Access",
      emoji: "🛡️",
      intro: {
        en: "The protective edge (a cloud WAF/CDN such as Cloudflare, Akamai, AWS WAF, Imperva) can be sidestepped by talking to the origin server directly, so every filtering, rate-limiting and bot-management rule the edge enforces simply never runs. The core finding is reaching the origin's real IP and sending it requests the WAF would have blocked — because the origin accepts connections from anywhere, not only from the CDN's ranges. Bugcrowd scores the direct-server-access variant P4 with an availability-only CVSS (A:L — the bypass itself exposes the origin to the abuse the WAF was absorbing), but for an advanced hunter it is a force-multiplier of the first order: once you hit origin, the SQLi/XSS/SSRF/path payloads the edge was scrubbing go through unfiltered, and the rate limits that throttled your enumeration vanish. The subtle, very current finding is origin-IP discovery — CDNs hide the IP, but it leaks through certificate transparency (a cert issued before the site moved behind the CDN), historical/passive DNS, SSRF/error-message IP leaks, misconfigured subdomains (mail/dev/staging on the same box), and SNI/Host-header quirks where the origin answers for the protected host directly.",
        simple: "The protective edge (a cloud WAF/CDN such as Cloudflare, Akamai, AWS WAF, Imperva) can be sidestepped by talking to the origin server directly, so every filtering, rate-limiting and bot-management rule the edge enforces simply never runs. The core finding is reaching the origin's real IP and sending it requests the WAF would have blocked — because the origin accepts connections from anywhere, not only from the CDN's ranges. Bugcrowd scores the direct-server-access variant P4 with an availability-only CVSS (A:L — the bypass itself exposes the origin to the abuse the WAF was absorbing), but for an advanced hunter it's a force-multiplier of the first order: once you hit origin, the SQLi/XSS/SSRF/path payloads the edge was scrubbing go through unfiltered, and the rate limits that throttled your enumeration vanish. The key, very current finding is origin-IP discovery — CDNs hide the IP, but it leaks through certificate transparency (a cert issued before the site moved behind the CDN), historical/passive DNS, SSRF/error-message IP leaks, misconfigured subdomains (mail/dev/staging on the same box), and SNI/Host-header quirks where the origin answers for the protected host directly.",
        hi: "protective edge (एक cloud WAF/CDN जैसे Cloudflare, Akamai, AWS WAF, Imperva) को origin server से सीधे बात करके किनारे किया जा सकता है, तो edge जो हर filtering, rate-limiting और bot-management rule enforce करता है वह बस कभी चलता ही नहीं। मूल finding है origin के असली IP तक पहुँचना और उसे वे requests भेजना जिन्हें WAF block कर देता — क्योंकि origin कहीं से भी connections accept करता है, सिर्फ़ CDN की ranges से नहीं। Bugcrowd direct-server-access variant को availability-only CVSS के साथ P4 score करता है (A:L — bypass ख़ुद origin को उस abuse के सामने खोल देता है जिसे WAF सोख रहा था), पर advanced hunter के लिए यह पहले दर्जे का force-multiplier है: जैसे ही आप origin पर पहुँचते हैं, वे SQLi/XSS/SSRF/path payloads जिन्हें edge scrub कर रहा था unfiltered चले जाते हैं, और वे rate limits जो आपके enumeration को throttle करती थीं ग़ायब हो जाती हैं। असली, बहुत मौजूदा finding है origin-IP discovery — CDNs IP छुपाते हैं, पर वह certificate transparency (site के CDN के पीछे जाने से पहले जारी हुआ एक cert), historical/passive DNS, SSRF/error-message IP leaks, misconfigured subdomains (mail/dev/staging उसी box पर), और SNI/Host-header की ख़ासियतों से leak होता है जहाँ origin protected host के लिए सीधे जवाब देता है।",
      },
      howToFind: [
        {
          title: {
            en: "Discover the real origin IP",
            simple: "Discover the real origin IP",
            hi: "असली origin IP ढूँढें",
          },
          steps: [
            {
              en: "Mine certificate transparency for the apex/SANs (crt.sh) and compare against the CDN edge IPs — a cert on a non-CDN IP, or a historical cert, often points at origin.",
              simple: "Mine certificate transparency for the apex/SANs (crt.sh) and compare against the CDN edge IPs — a cert on a non-CDN IP, or a historical cert, often points at the origin.",
              hi: "apex/SANs के लिए certificate transparency खंगालें (crt.sh) और CDN edge IPs से तुलना करें — किसी non-CDN IP पर एक cert, या एक historical cert, अक्सर origin की ओर इशारा करता है।",
            },
            {
              en: "Pull passive/historical DNS (SecurityTrails, DNS history, wayback) for A records that predate the CDN move, and check sibling hostnames (mail., dev., staging., direct., origin.) that frequently resolve straight to the box.",
              simple: "Pull passive/historical DNS (SecurityTrails, DNS history, wayback) for A records from before the CDN move, and check sibling hostnames (mail., dev., staging., direct., origin.) that often resolve straight to the box.",
              hi: "passive/historical DNS निकालें (SecurityTrails, DNS history, wayback) ऐसे A records के लिए जो CDN पर जाने से पहले के हों, और sibling hostnames (mail., dev., staging., direct., origin.) check करें जो अक्सर सीधे box पर resolve होते हैं।",
            },
            {
              en: "Harvest IP leaks from the app itself: SSRF responses, verbose error pages, email headers (Received:), and status/debug endpoints that echo an internal/public origin address.",
              simple: "Harvest IP leaks from the app itself: SSRF responses, verbose error pages, email headers (Received:), and status/debug endpoints that echo an internal/public origin address.",
              hi: "app से ही IP leaks इकट्ठा करें: SSRF responses, verbose error pages, email headers (Received:), और status/debug endpoints जो किसी internal/public origin address को echo करते हैं।",
            },
          ],
        },
        {
          title: {
            en: "Confirm the origin answers for the protected host, bypassing the edge",
            simple: "Confirm the origin answers for the protected host, bypassing the edge",
            hi: "पक्का करें origin protected host के लिए जवाब देता है, edge को bypass करके",
          },
          steps: [
            {
              en: "Request the site from the candidate IP while forcing the real hostname: curl --resolve host:443:<origin-ip> or an explicit Host header — a matching 200 for the real app content means the origin serves it directly.",
              simple: "Request the site from the candidate IP while forcing the real hostname: curl --resolve host:443:<origin-ip> or an explicit Host header — a matching 200 for the real app content means the origin serves it directly.",
              hi: "candidate IP से site request करें, असली hostname force करते हुए: curl --resolve host:443:<origin-ip> या एक explicit Host header — असली app content के लिए एक matching 200 मतलब origin इसे सीधे serve करता है।",
            },
            {
              en: "Prove the WAF is actually out of the path with a single BENIGN marker the edge is known to block (e.g. a harmless ?x=<script> or a test rule trigger) — it is blocked through the CDN hostname but passes when sent to the origin IP. Use a safe canary, never a live exploit payload, as proof.",
              simple: "Prove the WAF is actually out of the path with a single SAFE marker the edge is known to block (e.g. a harmless ?x=<script> or a test rule trigger) — it's blocked through the CDN hostname but passes when sent to the origin IP. Use a safe canary, never a live exploit payload, as proof.",
              hi: "WAF सच में path से बाहर है यह एक अकेले BENIGN marker से साबित करें जिसे edge block करता माना जाता है (जैसे एक harmless ?x=<script> या एक test rule trigger) — यह CDN hostname से block होता है पर origin IP पर भेजने पर pass हो जाता है। सबूत के तौर पर एक safe canary इस्तेमाल करें, कभी कोई live exploit payload नहीं।",
            },
            {
              en: "Note SNI/Host tricks and default-vhost behaviour: some origins answer the protected host over a mismatched SNI or as the default vhost — document the exact request that reaches origin, and flag the chain (now-unfiltered injection surface) to the user.",
              simple: "Note SNI/Host tricks and default-vhost behaviour: some origins answer the protected host over a mismatched SNI or as the default vhost — document the exact request that reaches origin, and flag the chain (now-unfiltered injection surface) to the user.",
              hi: "SNI/Host tricks और default-vhost व्यवहार नोट करें: कुछ origins protected host को एक mismatched SNI पर या default vhost के तौर पर जवाब देते हैं — वह exact request document करें जो origin तक पहुँचे, और chain (अब-unfiltered injection surface) को user को flag करें।",
            },
          ],
        },
      ],
      payloads: [
        "curl -s 'https://crt.sh/?q=%25.target.com&output=json' | jq -r '.[].name_value' | sort -u   (CT names → origin candidates)",
        "curl -s --resolve app.target.com:443:<ORIGIN_IP> https://app.target.com/ -I   (does the origin serve the real host directly, bypassing the edge?)",
        "curl -s -H 'Host: app.target.com' https://<ORIGIN_IP>/   (Host-header direct hit)",
        "curl -s 'https://app.target.com/?x=<benign-canary>' -I   (blocked at edge) vs the same sent to <ORIGIN_IP>   (passes = WAF out of path)",
      ],
      example: {
        en: "The app sat behind Cloudflare, but crt.sh held a certificate issued on a bare DigitalOcean IP before the migration; curl --resolve to that IP with the real Host returned the live application. A benign canary query that Cloudflare's managed ruleset blocked on the edge hostname passed cleanly when sent straight to the origin — direct server access past the WAF, P4 (A:L). It was reported as the multiplier that re-exposed a previously edge-blocked injection parameter to unfiltered testing, and flagged to the user as a chain rather than a standalone.",
        simple: "The app sat behind Cloudflare, but crt.sh held a certificate issued on a bare DigitalOcean IP before the migration; curl --resolve to that IP with the real Host returned the live application. A benign canary query that Cloudflare's managed ruleset blocked on the edge hostname passed cleanly when sent straight to the origin — direct server access past the WAF, P4 (A:L). It was reported as the multiplier that re-exposed a previously edge-blocked injection parameter to unfiltered testing, and flagged to the user as a chain rather than a standalone.",
        hi: "app Cloudflare के पीछे थी, पर crt.sh के पास migration से पहले एक सादे DigitalOcean IP पर जारी हुआ एक certificate था; उस IP पर असली Host के साथ curl --resolve ने live application लौटाई। एक benign canary query जिसे Cloudflare की managed ruleset edge hostname पर block करती थी, origin पर सीधे भेजने पर साफ़ pass हो गई — WAF के पार direct server access, P4 (A:L)। इसे उस multiplier के तौर पर रिपोर्ट किया गया जिसने पहले edge-blocked एक injection parameter को unfiltered testing के सामने दोबारा खोल दिया, और इसे अकेले के बजाय एक chain के तौर पर user को flag किया गया।",
      },
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › Web Application Firewall (WAF) Bypass › Direct Server Access",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:N/A:L",
        hackeroneCwe: "CWE-693: Protection Mechanism Failure",
        cvssSeverity: "Low (A:L) standalone — materially higher as an enabler of edge-filtered injection/rate-limit bypass",
        note: {
          en: "Direct-server-access WAF bypass = P4. The standalone score is availability-only, but the real value is as a multiplier: hitting origin re-opens the SQLi/XSS/SSRF/path payloads and the enumeration rate the edge was blocking. Prove it with a benign canary the edge drops, never a live exploit payload.",
          simple: "Direct-server-access WAF bypass = P4. The standalone score is availability-only, but the real value is as a multiplier: hitting origin re-opens the SQLi/XSS/SSRF/path payloads and the enumeration rate the edge was blocking. Prove it with a benign canary the edge drops, never a live exploit payload.",
          hi: "Direct-server-access WAF bypass = P4। अकेला score availability-only है, पर असली क़ीमत एक multiplier के रूप में है: origin पर पहुँचना उन SQLi/XSS/SSRF/path payloads और उस enumeration rate को दोबारा खोल देता है जिन्हें edge block कर रहा था। इसे एक benign canary से साबित करें जिसे edge drop करे, कभी किसी live exploit payload से नहीं।",
        },
      },
      checklistCategoryId: "recon-tech",
      references: [
        { label: "crt.sh (certificate transparency)", url: "https://crt.sh/" },
        { label: "CloudFlair / origin-IP discovery techniques", url: "https://github.com/christophetd/CloudFlair" },
      ],
    },
  ],
};
