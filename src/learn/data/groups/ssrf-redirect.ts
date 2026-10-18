import type { LearnGroup } from "@/learn/data/types";

// SSRF & Redirects — advanced, P3/P4-focused learn content.
// VRT backbone: Bugcrowd Vulnerability Rating Taxonomy release 2026-07-08.
// Lead the reader at the realistic P3/P4 bands and name the concrete edge that
// escalates each one (IMDS credentials for SSRF, OAuth code theft for redirects).

export const ssrfRedirectGroup: LearnGroup = {
  id: "ssrf-redirect",
  name: "SSRF & Redirects",
  emoji: "🛰️",
  blurb:
    "Coercing the server into requests you shouldn't be able to make (SSRF), and bouncing the victim's browser to a destination you control (redirects). Modest on their own; the payout lives in the chain — cloud metadata for SSRF, OAuth code theft for redirects.",
  topics: [
    {
      id: "ssrf",
      name: "Server-Side Request Forgery (SSRF)",
      emoji: "🛰️",
      intro: {
        en: "You supply a URL (or something a URL is built from) and the server dereferences it from inside the trust boundary — so you borrow its network position to reach link-local metadata, loopback admin panes, and private-range services the internet never routes to. The findability edge in 2025 is rarely a raw `url=` param: it's the second-order fetcher — a webhook validator, a headless-Chrome PDF/screenshot renderer, an SSO metadata/JWKS loader, or an SVG/XML/image pipeline that follows a redirect you plant. Lead at the honest bands (P4 blind port-presence, P3 internal data / port-service scan) and escalate deliberately: a single read of cloud IMDS role credentials turns the same bug into internal-secrets-exposure P2.",
        simple: "You give the server a URL (or data it builds a URL from) and it fetches that URL from inside its own trusted network — so you borrow the server's position to reach link-local metadata, loopback admin pages, and private services the internet can't route to. In 2025 the bug is rarely a plain `url=` param; it's the second-order fetcher — a webhook checker, a headless-Chrome PDF/screenshot renderer, an SSO metadata/JWKS loader, or an SVG/XML/image pipeline that follows a redirect you plant. Report the honest bands (P4 blind port-presence, P3 internal data / port scan) and escalate on purpose: one read of cloud IMDS role credentials turns the same bug into internal-secrets-exposure P2.",
        hi: "आप server को एक URL (या वो data जिससे वो URL बनाता है) देते हैं और server उसे अपने trusted network के अंदर से fetch करता है — तो आप server की network position उधार लेकर link-local metadata, loopback admin pages, और वो private-range services तक पहुँच जाते हैं जिन तक internet कभी route नहीं करता। 2025 में यह bug शायद ही किसी सीधे `url=` param में मिलता है: असली जगह second-order fetcher है — webhook validator, headless-Chrome PDF/screenshot renderer, SSO metadata/JWKS loader, या कोई SVG/XML/image pipeline जो आपके लगाए redirect को follow कर ले। ईमानदार bands पर रिपोर्ट करें (P4 blind port-presence, P3 internal data / port-service scan) और सोच-समझकर escalate करें: cloud IMDS role credentials का एक read उसी bug को internal-secrets-exposure P2 बना देता है।",
      },
      howToFind: [
        {
          title: {
            en: "Map every fetcher and confirm out-of-band first",
            simple: "List every fetcher and confirm it out-of-band first",
            hi: "हर fetcher को map करें और पहले out-of-band confirm करें",
          },
          steps: [
            {
              en: "Inventory anything that makes the server leave the box: webhooks, 'import/fetch from URL', avatar/image-by-URL, link unfurl/preview, PDF/HTML-to-image render, RSS/XML/SVG ingest, SAML/OIDC metadata & JWKS URLs, and any `*_url`/`callback`/`dest`/`feed`/`endpoint` field.",
              simple: "List everything that makes the server send a request out: webhooks, 'import/fetch from URL', avatar/image-by-URL, link preview, PDF/HTML-to-image render, RSS/XML/SVG import, SAML/OIDC metadata & JWKS URLs, and any `*_url`/`callback`/`dest`/`feed`/`endpoint` field.",
              hi: "वो हर चीज़ list करें जो server से बाहर request भिजवाती है: webhooks, 'import/fetch from URL', avatar/image-by-URL, link unfurl/preview, PDF/HTML-to-image render, RSS/XML/SVG ingest, SAML/OIDC metadata और JWKS URLs, और कोई भी `*_url`/`callback`/`dest`/`feed`/`endpoint` field।",
            },
            {
              en: "Point each at a unique OOB host (interactsh/Collaborator) and watch for the hit — a DNS-only callback is already External/DNS-query (P5), an HTTP callback with a server-side User-Agent/source IP proves the fetch.",
              simple: "Point each one at a unique OOB host (interactsh/Collaborator) and watch for the callback — a DNS-only hit is already External/DNS-query (P5); an HTTP callback with a server-side User-Agent/source IP proves the fetch.",
              hi: "हर एक को एक unique OOB host (interactsh/Collaborator) पर point करें और callback का इंतज़ार करें — सिर्फ़ DNS callback भी External/DNS-query (P5) है; server-side User-Agent/source IP वाला HTTP callback fetch को prove कर देता है।",
            },
            {
              en: "Diff the response for oracles: timing, status, Content-Length, and error strings leak whether an internal host/port answered even when the body isn't reflected (blind SSRF).",
              simple: "Compare responses for oracles: timing, status code, Content-Length, and error text reveal whether an internal host/port answered even when the body isn't shown back (blind SSRF).",
              hi: "responses को oracles के लिए compare करें: timing, status, Content-Length, और error strings बता देते हैं कि कोई internal host/port जवाब दे रहा है या नहीं — तब भी जब body reflect नहीं होती (blind SSRF)।",
            },
          ],
        },
        {
          title: {
            en: "Beat the allowlist / SSRF filter (current bypasses)",
            simple: "Beat the allowlist / SSRF filter (current bypasses)",
            hi: "allowlist / SSRF filter को तोड़ें (मौजूदा bypasses)",
          },
          steps: [
            {
              en: "Encode the host: decimal `http://2130706433/`, hex `http://0x7f000001/`, octal `http://0177.0.0.1/`, zero-pad, and IPv6 mapped `http://[::ffff:169.254.169.254]/` or `http://[::1]/`.",
              simple: "Encode the host different ways: decimal `http://2130706433/`, hex `http://0x7f000001/`, octal `http://0177.0.0.1/`, zero-padding, and IPv6-mapped `http://[::ffff:169.254.169.254]/` or `http://[::1]/`.",
              hi: "host को अलग-अलग तरह encode करें: decimal `http://2130706433/`, hex `http://0x7f000001/`, octal `http://0177.0.0.1/`, zero-pad, और IPv6 mapped `http://[::ffff:169.254.169.254]/` या `http://[::1]/`।",
            },
            {
              en: "Abuse parser gaps: `http://expected-host.com@169.254.169.254/`, `http://169.254.169.254#.expected-host.com/`, and backslash/whitespace tricks that split where the validator and the HTTP client disagree.",
              simple: "Abuse parser gaps: `http://expected-host.com@169.254.169.254/`, `http://169.254.169.254#.expected-host.com/`, and backslash/whitespace tricks that split the URL where the validator and the HTTP client disagree.",
              hi: "parser की खामियों का फ़ायदा उठाएँ: `http://expected-host.com@169.254.169.254/`, `http://169.254.169.254#.expected-host.com/`, और backslash/whitespace tricks जो URL को वहाँ तोड़ देती हैं जहाँ validator और HTTP client अलग-अलग समझते हैं।",
            },
            {
              en: "Defeat resolve-then-fetch validators with DNS rebinding (a name that resolves public on check, private on fetch) or an open/own redirector that 302s an allowed host to `http://169.254.169.254/` — many clients follow redirects after the allowlist has already passed.",
              simple: "Beat resolve-then-fetch validators with DNS rebinding (a name that resolves to a public IP at check time, a private IP at fetch time) or an open/own redirector that 302s an allowed host to `http://169.254.169.254/` — many clients follow redirects after the allowlist check has already passed.",
              hi: "resolve-then-fetch validators को DNS rebinding से हराएँ (एक ऐसा name जो check के वक़्त public IP पर resolve हो और fetch के वक़्त private पर) या एक open/अपना redirector जो किसी allowed host को `http://169.254.169.254/` पर 302 कर दे — बहुत से clients allowlist pass होने के बाद redirects follow कर लेते हैं।",
            },
          ],
        },
        {
          title: {
            en: "Reach internal services and escalate to P2",
            simple: "Reach internal services and escalate to P2",
            hi: "internal services तक पहुँचें और P2 तक escalate करें",
          },
          steps: [
            {
              en: "On AWS handle IMDSv2: first `PUT /latest/api/token` with `X-aws-ec2-metadata-token-ttl-seconds: 21600`, then replay the token in `X-aws-ec2-metadata-token` on the GET — many SSRF primitives that let you set one header can still complete this.",
              simple: "On AWS, handle IMDSv2: first `PUT /latest/api/token` with `X-aws-ec2-metadata-token-ttl-seconds: 21600`, then send that token back in `X-aws-ec2-metadata-token` on the GET — many SSRF primitives that let you set one header can still do this.",
              hi: "AWS पर IMDSv2 handle करें: पहले `PUT /latest/api/token` के साथ `X-aws-ec2-metadata-token-ttl-seconds: 21600`, फिर उस token को GET पर `X-aws-ec2-metadata-token` header में भेजें — बहुत से SSRF primitives जो आपको एक header set करने देते हैं वो भी यह पूरा कर सकते हैं।",
            },
            {
              en: "Enumerate the cloud you're in: GCP `metadata.google.internal` needs `Metadata-Flavor: Google`; Azure IMDS needs `Metadata: true` at `169.254.169.254/metadata/instance?api-version=2021-02-01`.",
              simple: "Work out which cloud you're in: GCP's `metadata.google.internal` needs the header `Metadata-Flavor: Google`; Azure IMDS needs `Metadata: true` at `169.254.169.254/metadata/instance?api-version=2021-02-01`.",
              hi: "पता करें कि आप किस cloud में हैं: GCP के `metadata.google.internal` को `Metadata-Flavor: Google` header चाहिए; Azure IMDS को `169.254.169.254/metadata/instance?api-version=2021-02-01` पर `Metadata: true` चाहिए।",
            },
            {
              en: "If only non-HTTP ports answer, consider `gopher://` to speak Redis/SMTP/HTTP-POST line protocols — but prove impact with the smallest benign read (a banner, a role name) and never pivot into real data or actions.",
              simple: "If only non-HTTP ports answer, consider `gopher://` to speak Redis/SMTP/HTTP-POST line protocols — but prove impact with the smallest safe read (a banner, a role name) and never move into real data or actions.",
              hi: "अगर सिर्फ़ non-HTTP ports जवाब दें, तो Redis/SMTP/HTTP-POST line protocols बोलने के लिए `gopher://` पर सोचें — पर impact सबसे छोटे benign read (एक banner, एक role name) से prove करें और कभी असली data या actions में न जाएँ।",
            },
          ],
        },
      ],
      payloads: [
        "http://169.254.169.254/latest/meta-data/iam/security-credentials/   (AWS IMDSv1)",
        "PUT http://169.254.169.254/latest/api/token  [X-aws-ec2-metadata-token-ttl-seconds: 21600]  then GET /latest/meta-data/ with X-aws-ec2-metadata-token  (IMDSv2)",
        "http://metadata.google.internal/computeMetadata/v1/instance/   [Metadata-Flavor: Google]   (GCP)",
        "http://2130706433/   http://0x7f000001/   http://[::ffff:169.254.169.254]/   (encoding bypasses)",
        "http://allowed-host.com@169.254.169.254/   and   http://169.254.169.254#allowed-host.com/   (parser confusion)",
        "gopher://127.0.0.1:6379/_%0D%0AINFO%0D%0A   (non-HTTP port, benign Redis INFO proof)",
      ],
      example: {
        en: "A 'website screenshot' feature rendered any submitted URL in headless Chrome. A plain `169.254.169.254` was blocked, but a hunter-controlled page that 302-redirected to the AWS IMDSv2 token endpoint (setting the TTL header via a meta/redirect trick) returned live IAM role credentials inside the screenshot — internal secrets exposure, triaged P2. Had the same fetcher only revealed which internal ports answered, it would have landed at P3 (internal port/service scan) or P4 (port-presence only).",
        simple: "A 'website screenshot' feature rendered any submitted URL in headless Chrome. A plain `169.254.169.254` was blocked, but a hunter-controlled page that 302-redirected to the AWS IMDSv2 token endpoint (setting the TTL header via a meta/redirect trick) showed live IAM role credentials inside the screenshot — internal secrets exposure, triaged P2. If the same fetcher had only revealed which internal ports answered, it would have been P3 (internal port/service scan) or P4 (port-presence only).",
        hi: "एक 'website screenshot' feature किसी भी दिए गए URL को headless Chrome में render करता था। सीधा `169.254.169.254` block था, पर hunter के control वाले एक page ने (meta/redirect trick से TTL header set करते हुए) AWS IMDSv2 token endpoint पर 302-redirect किया और screenshot के अंदर live IAM role credentials दिख गईं — internal secrets exposure, P2 triage हुआ। अगर वही fetcher सिर्फ़ यह दिखाता कि कौन से internal ports जवाब दे रहे हैं, तो यह P3 (internal port/service scan) या P4 (port-presence only) पर आता।",
      },
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › Server-Side Request Forgery (SSRF) › Internal Data Exposure",
        bugcrowdPriority: "P3",
        bugcrowdCvss: "AV:N/AC:L/PR:N/UI:N/S:C/C:L/I:N/A:N",
        hackeroneCwe: "CWE-918: Server-Side Request Forgery (SSRF)",
        cvssSeverity: "Depends on impact — P4 Low → P3 Medium → P2 High",
        note: {
          en: "Bugcrowd VRT bands: Internal Secrets Exposure P2; Internal Data Exposure P3; Internal Port Service Scan P3; Internal Exposure of the Presence of Data/Secrets P4; Internal Port Scan Only P4; External Low-impact P5; External DNS-query-only P5. Reaching cloud IMDS / internal secrets is what moves it from P4/P3 to P2.",
          simple: "Bugcrowd VRT bands: Internal Secrets Exposure P2; Internal Data Exposure P3; Internal Port Service Scan P3; Internal Exposure of the Presence of Data/Secrets P4; Internal Port Scan Only P4; External Low-impact P5; External DNS-query-only P5. Reaching cloud IMDS / internal secrets is what lifts it from P4/P3 to P2.",
          hi: "Bugcrowd VRT bands: Internal Secrets Exposure P2; Internal Data Exposure P3; Internal Port Service Scan P3; Internal Exposure of the Presence of Data/Secrets P4; Internal Port Scan Only P4; External Low-impact P5; External DNS-query-only P5. cloud IMDS / internal secrets तक पहुँचना ही इसे P4/P3 से P2 तक ले जाता है।",
        },
      },
      checklistCategoryId: "inject-ssrf",
      references: [
        { label: "PortSwigger: SSRF", url: "https://portswigger.net/web-security/ssrf" },
      ],
    },
    {
      id: "open-redirect",
      name: "Open Redirect",
      emoji: "↪️",
      intro: {
        en: "A redirect target (`?next=`, `?returnUrl=`, a `Location` built from input) is taken on trust, so you can send an authenticated victim off-domain after they've already trusted the first hop. Bare GET-based open redirect is a P4 — the skill is in the validator bypass and, far more valuable, the chain: the same primitive steals an OAuth `code`/`token` or a SAML `RelayState`, turning a P4 into account takeover. Hunt it specifically on login/logout, SSO, and email-verification flows where a redirect rides alongside a secret.",
        simple: "A redirect target (`?next=`, `?returnUrl=`, a `Location` built from input) is trusted blindly, so you can send a logged-in victim off-domain after they already trusted the first hop. A plain GET-based open redirect is a P4 — the skill is in bypassing the validator and, far more valuable, the chain: the same trick steals an OAuth `code`/`token` or a SAML `RelayState`, turning a P4 into account takeover. Hunt it on login/logout, SSO, and email-verification flows where a redirect travels next to a secret.",
        hi: "एक redirect target (`?next=`, `?returnUrl=`, input से बना `Location`) पर आँख मूँदकर भरोसा कर लिया जाता है, तो आप एक logged-in victim को, जब वो पहला hop भरोसा कर चुका हो, off-domain भेज सकते हैं। सादा GET-based open redirect P4 है — असली skill validator bypass में है और उससे कहीं क़ीमती है chain: वही primitive एक OAuth `code`/`token` या SAML `RelayState` चुरा लेता है, जिससे P4 account takeover बन जाता है। इसे ख़ास तौर पर login/logout, SSO, और email-verification flows पर ढूँढें जहाँ redirect किसी secret के साथ-साथ चलता है।",
      },
      howToFind: [
        {
          title: {
            en: "Discover the parameter and break the validator",
            simple: "Find the parameter and break the validator",
            hi: "parameter ढूँढें और validator तोड़ें",
          },
          steps: [
            {
              en: "Harvest redirect sinks from history and JS: `next`, `returnUrl`, `return_to`, `dest`, `continue`, `redirect`, `url`, `callback`, `image`, `u` — plus implicit ones in login/logout and `/oauth/authorize`.",
              simple: "Collect redirect sinks from history and JS: `next`, `returnUrl`, `return_to`, `dest`, `continue`, `redirect`, `url`, `callback`, `image`, `u` — plus the implicit ones in login/logout and `/oauth/authorize`.",
              hi: "history और JS से redirect sinks इकट्ठा करें: `next`, `returnUrl`, `return_to`, `dest`, `continue`, `redirect`, `url`, `callback`, `image`, `u` — साथ ही login/logout और `/oauth/authorize` में छुपे हुए भी।",
            },
            {
              en: "Beat weak checks that only look for a leading `http`/their own host: scheme-relative `//evil.example`, backslash `/\\evil.example`, userinfo `https://target.com@evil.example`, whitelisted-host-as-path `https://evil.example/target.com`, and `https://target.com.evil.example`.",
              simple: "Beat weak checks that only look for a leading `http` or their own host: scheme-relative `//evil.example`, backslash `/\\evil.example`, userinfo `https://target.com@evil.example`, whitelisted-host-as-path `https://evil.example/target.com`, and `https://target.com.evil.example`.",
              hi: "उन कमज़ोर checks को हराएँ जो सिर्फ़ शुरू में `http` या अपना host देखते हैं: scheme-relative `//evil.example`, backslash `/\\evil.example`, userinfo `https://target.com@evil.example`, whitelisted-host-as-path `https://evil.example/target.com`, और `https://target.com.evil.example`।",
            },
            {
              en: "Try CRLF/tab/null and double-encoding (`%2F%2Fevil.example`, `/%09/evil.example`, `%00`) and unicode dot/slash homoglyphs to slip past normalizers that run before the client follows the redirect.",
              simple: "Try CRLF/tab/null and double-encoding (`%2F%2Fevil.example`, `/%09/evil.example`, `%00`) and unicode dot/slash look-alikes to slip past normalizers that run before the client follows the redirect.",
              hi: "normalizers को चकमा देने के लिए CRLF/tab/null और double-encoding (`%2F%2Fevil.example`, `/%09/evil.example`, `%00`) और unicode dot/slash homoglyphs आज़माएँ जो client के redirect follow करने से पहले चलते हैं।",
            },
          ],
        },
        {
          title: {
            en: "Chain it for real severity",
            simple: "Chain it for real severity",
            hi: "असली severity के लिए इसे chain करें",
          },
          steps: [
            {
              en: "In OAuth/OIDC, if `redirect_uri` validation shares the bug (path-append, subdomain, or open-redirect-on-an-allowed-host), bounce the `code`/`access_token` to your origin — that's the ATO, not the redirect.",
              simple: "In OAuth/OIDC, if `redirect_uri` validation has the same weakness (path-append, subdomain, or an open redirect on an allowed host), bounce the `code`/`access_token` to your origin — that is the ATO, not the redirect itself.",
              hi: "OAuth/OIDC में, अगर `redirect_uri` validation में भी वही bug हो (path-append, subdomain, या किसी allowed host पर open-redirect), तो `code`/`access_token` को अपने origin पर bounce कराएँ — ATO यही है, redirect नहीं।",
            },
            {
              en: "Where the redirect leaks a secret in the query/fragment, capture it via `Referer` on your landing page or a `window.location` read; a bare off-domain navigation alone stays P4, so always report the strongest reachable chain.",
              simple: "Where the redirect leaks a secret in the query or fragment, capture it via the `Referer` header on your landing page or a `window.location` read; a plain off-domain navigation on its own stays P4, so always report the strongest chain you can reach.",
              hi: "जहाँ redirect query/fragment में कोई secret leak करे, उसे अपने landing page पर `Referer` या `window.location` read से capture करें; अकेली off-domain navigation P4 ही रहती है, इसलिए हमेशा सबसे मज़बूत पहुँच-योग्य chain रिपोर्ट करें।",
            },
          ],
        },
      ],
      payloads: [
        "?next=https://evil.example",
        "?returnUrl=//evil.example",
        "?return_to=https://target.com@evil.example",
        "?redirect=/%09/evil.example   and   ?u=/%2F%2Fevil.example",
        "?dest=https://evil.example/target.com   (whitelisted host placed in the path)",
      ],
      example: {
        en: "A login flow echoed `?next=` into a 302 and only checked that the value began with `/`. Supplying `/\\evil.example` (a path that browsers treat as scheme-relative) sent the post-login redirect off-domain; because the same `next` was reused as the OAuth `redirect_uri` suffix, the authorization `code` landed on the attacker host → full ATO. On its own the redirect was the textbook P4 (GET-based, CVSS AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N); the OAuth chain is what made it pay.",
        simple: "A login flow put `?next=` into a 302 and only checked that the value started with `/`. Supplying `/\\evil.example` (a path browsers treat as scheme-relative) sent the post-login redirect off-domain; because the same `next` was reused as the OAuth `redirect_uri` suffix, the authorization `code` landed on the attacker host → full ATO. On its own the redirect was a textbook P4 (GET-based, CVSS AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N); the OAuth chain is what made it pay.",
        hi: "एक login flow `?next=` को 302 में डालता था और सिर्फ़ यह check करता था कि value `/` से शुरू होती है। `/\\evil.example` देने पर (एक ऐसा path जिसे browsers scheme-relative मानते हैं) post-login redirect off-domain चला गया; चूँकि वही `next` OAuth `redirect_uri` के suffix के तौर पर दोबारा इस्तेमाल हुआ, authorization `code` attacker के host पर पहुँच गया → पूरा ATO। अकेला redirect textbook P4 था (GET-based, CVSS AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N); असली पैसा OAuth chain ने दिलाया।",
      },
      mapping: {
        bugcrowdVrt: "Unvalidated Redirects and Forwards › Open Redirect › GET-Based",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N",
        hackeroneCwe: "CWE-601: URL Redirection to Untrusted Site (Open Redirect)",
        cvssSeverity: "Low (High when chained)",
        note: {
          en: "Bugcrowd VRT: GET-Based P4; Header-Based, POST-Based and Flash-Based are each P5. Standalone value is minimal — the payout comes from OAuth/SAML token-theft chains.",
          simple: "Bugcrowd VRT: GET-Based P4; Header-Based, POST-Based and Flash-Based are each P5. On its own it's worth little — the payout comes from OAuth/SAML token-theft chains.",
          hi: "Bugcrowd VRT: GET-Based P4; Header-Based, POST-Based और Flash-Based हर एक P5। अकेले इसकी क़ीमत बहुत कम है — पैसा OAuth/SAML token-theft chains से आता है।",
        },
      },
      checklistCategoryId: "inject-redirect",
    },
    {
      id: "tabnabbing",
      name: "Reverse Tabnabbing & Missing Speed Bump",
      emoji: "🪟",
      intro: {
        en: "When the app renders a user-controlled link with `target=\"_blank\"` and no `rel=\"noopener\"`, the opened page keeps a handle to the opener via `window.opener` and can silently rewrite the original tab's `location` to a phishing clone while the victim is distracted — reverse tabnabbing. The sibling issue is a missing security speed-bump / interstitial on outbound redirects, where the app sends users off-domain with no 'you are leaving' warning. Both are honest P5s: low standalone reward, but they sharpen a phishing or open-redirect chain and are trivial to spot in code review of link-rendering and redirect handlers.",
        simple: "When the app renders a user-controlled link with `target=\"_blank\"` and no `rel=\"noopener\"`, the opened page keeps a handle to the opener via `window.opener` and can quietly rewrite the original tab's `location` to a phishing clone while the victim is distracted — reverse tabnabbing. The related issue is a missing security speed-bump / interstitial on outbound redirects, where the app sends users off-domain with no 'you are leaving' warning. Both are honest P5s: little on their own, but they strengthen a phishing or open-redirect chain and are easy to spot when reviewing link-rendering and redirect code.",
        hi: "जब app किसी user-controlled link को `target=\"_blank\"` के साथ और बिना `rel=\"noopener\"` के render करता है, तो खुला हुआ page `window.opener` के ज़रिए opener का handle रखे रहता है और victim के ध्यान हटते ही original tab के `location` को चुपचाप एक phishing clone पर बदल सकता है — reverse tabnabbing। इससे जुड़ी दूसरी बात है outbound redirects पर missing security speed-bump / interstitial, जहाँ app users को बिना 'you are leaving' warning के off-domain भेज देता है। दोनों ईमानदारी से P5 हैं: अकेले कम reward, पर ये phishing या open-redirect chain को मज़बूत करते हैं और link-rendering व redirect handlers के code review में आसानी से पकड़ में आते हैं।",
      },
      howToFind: [
        {
          title: {
            en: "Find opener-exposing links",
            simple: "Find links that expose the opener",
            hi: "opener को expose करने वाले links ढूँढें",
          },
          steps: [
            {
              en: "Locate places that render attacker-influenced URLs as links: profile/bio fields, comments, markdown renderers, support tickets, and any 'visit website' button fed from user data.",
              simple: "Find places that render attacker-controlled URLs as links: profile/bio fields, comments, markdown renderers, support tickets, and any 'visit website' button built from user data.",
              hi: "वो जगहें ढूँढें जो attacker-controlled URLs को links की तरह render करती हैं: profile/bio fields, comments, markdown renderers, support tickets, और कोई भी 'visit website' button जो user data से बनता है।",
            },
            {
              en: "Inspect the emitted anchor — `target=\"_blank\"` without `rel=\"noopener noreferrer\"` (or a JS `window.open(url)` without `noopener`) on an older browser means the new page can read/write `window.opener.location`.",
              simple: "Inspect the rendered anchor — `target=\"_blank\"` without `rel=\"noopener noreferrer\"` (or a JS `window.open(url)` without `noopener`) on an older browser means the new page can read/write `window.opener.location`.",
              hi: "render हुए anchor को जाँचें — किसी पुराने browser पर `target=\"_blank\"` बिना `rel=\"noopener noreferrer\"` के (या JS `window.open(url)` बिना `noopener` के) का मतलब है नया page `window.opener.location` को read/write कर सकता है।",
            },
            {
              en: "Confirm with a benign opener page that, on load, sets `window.opener.location` to a marker URL and observe the original tab navigate.",
              simple: "Confirm with a safe opener page that, on load, sets `window.opener.location` to a marker URL, and watch the original tab navigate.",
              hi: "एक benign opener page से confirm करें जो load होते ही `window.opener.location` को एक marker URL पर set कर दे, और देखें कि original tab navigate करता है।",
            },
          ],
        },
        {
          title: {
            en: "Check for the missing speed-bump / interstitial",
            simple: "Check for a missing speed-bump / interstitial",
            hi: "missing speed-bump / interstitial check करें",
          },
          steps: [
            {
              en: "Follow outbound redirect endpoints (link trackers, `/exit?url=`, email click-throughs) and note whether an interstitial warns before leaving the trusted origin.",
              simple: "Follow outbound redirect endpoints (link trackers, `/exit?url=`, email click-throughs) and note whether an interstitial warns the user before leaving the trusted origin.",
              hi: "outbound redirect endpoints follow करें (link trackers, `/exit?url=`, email click-throughs) और देखें कि trusted origin छोड़ने से पहले कोई interstitial warning आती है या नहीं।",
            },
            {
              en: "A direct off-domain 302 with no speed-bump page is the VRT 'Lack of Security Speed Bump Page' — report it as the P5 it is, and pair it with any open redirect to strengthen a phishing narrative.",
              simple: "A direct off-domain 302 with no speed-bump page is the VRT 'Lack of Security Speed Bump Page' — report it as the P5 it is, and pair it with any open redirect to strengthen a phishing story.",
              hi: "बिना speed-bump page के सीधा off-domain 302 ही VRT का 'Lack of Security Speed Bump Page' है — इसे उसके P5 रूप में रिपोर्ट करें, और phishing narrative को मज़बूत करने के लिए किसी open redirect के साथ जोड़ें।",
            },
          ],
        },
      ],
      payloads: [
        "<a href=\"https://attacker.example/opener.html\" target=\"_blank\">click</a>   (rendered without rel=noopener)",
        "opener.html: <script>if (window.opener) window.opener.location = 'https://attacker.example/phish-marker';</script>",
        "[label](https://attacker.example/opener.html)   (markdown link that renders target=_blank)",
      ],
      example: {
        en: "A community site rendered profile 'website' links with `target=\"_blank\"` and no `rel=\"noopener\"`. A crafted link opened an attacker tab that rewrote the original tab to a pixel-perfect login clone; a victim switching back re-authenticated into the fake. On its own the finding was P5 (reverse tabnabbing), but it materially strengthened a phishing chain reported alongside an open redirect.",
        simple: "A community site rendered profile 'website' links with `target=\"_blank\"` and no `rel=\"noopener\"`. A crafted link opened an attacker tab that rewrote the original tab to a pixel-perfect login clone; a victim switching back logged in again on the fake page. On its own the finding was P5 (reverse tabnabbing), but it clearly strengthened a phishing chain reported alongside an open redirect.",
        hi: "एक community site profile के 'website' links को `target=\"_blank\"` के साथ और बिना `rel=\"noopener\"` के render करती थी। एक craft किए गए link ने attacker tab खोला जिसने original tab को हूबहू login clone पर बदल दिया; वापस switch करने वाले victim ने नक़ली page पर दोबारा login कर लिया। अकेले यह finding P5 थी (reverse tabnabbing), पर इसने एक open redirect के साथ रिपोर्ट की गई phishing chain को साफ़ तौर पर मज़बूत किया।",
      },
      mapping: {
        bugcrowdVrt: "Unvalidated Redirects and Forwards › Tabnabbing",
        bugcrowdPriority: "P5",
        hackeroneCwe: "CWE-1022: Use of Web Link to Untrusted Target with window.opener Access",
        cvssSeverity: "Informational",
        note: {
          en: "Bugcrowd VRT: Tabnabbing P5 and Lack of Security Speed Bump Page P5. Rewarded mainly as a component of a phishing/open-redirect chain, rarely standalone.",
          simple: "Bugcrowd VRT: Tabnabbing P5 and Lack of Security Speed Bump Page P5. Rewarded mostly as part of a phishing/open-redirect chain, rarely on its own.",
          hi: "Bugcrowd VRT: Tabnabbing P5 और Lack of Security Speed Bump Page P5. इनाम ज़्यादातर phishing/open-redirect chain के हिस्से के तौर पर मिलता है, अकेले बहुत कम।",
        },
      },
      checklistCategoryId: "inject-redirect",
    },
  ],
};
