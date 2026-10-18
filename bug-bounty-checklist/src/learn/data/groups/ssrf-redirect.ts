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
      intro:
        "You supply a URL (or something a URL is built from) and the server dereferences it from inside the trust boundary — so you borrow its network position to reach link-local metadata, loopback admin panes, and private-range services the internet never routes to. The findability edge in 2025 is rarely a raw `url=` param: it's the second-order fetcher — a webhook validator, a headless-Chrome PDF/screenshot renderer, an SSO metadata/JWKS loader, or an SVG/XML/image pipeline that follows a redirect you plant. Lead at the honest bands (P4 blind port-presence, P3 internal data / port-service scan) and escalate deliberately: a single read of cloud IMDS role credentials turns the same bug into internal-secrets-exposure P2.",
      howToFind: [
        {
          title: "Map every fetcher and confirm out-of-band first",
          steps: [
            "Inventory anything that makes the server leave the box: webhooks, 'import/fetch from URL', avatar/image-by-URL, link unfurl/preview, PDF/HTML-to-image render, RSS/XML/SVG ingest, SAML/OIDC metadata & JWKS URLs, and any `*_url`/`callback`/`dest`/`feed`/`endpoint` field.",
            "Point each at a unique OOB host (interactsh/Collaborator) and watch for the hit — a DNS-only callback is already External/DNS-query (P5), an HTTP callback with a server-side User-Agent/source IP proves the fetch.",
            "Diff the response for oracles: timing, status, Content-Length, and error strings leak whether an internal host/port answered even when the body isn't reflected (blind SSRF).",
          ],
        },
        {
          title: "Beat the allowlist / SSRF filter (current bypasses)",
          steps: [
            "Encode the host: decimal `http://2130706433/`, hex `http://0x7f000001/`, octal `http://0177.0.0.1/`, zero-pad, and IPv6 mapped `http://[::ffff:169.254.169.254]/` or `http://[::1]/`.",
            "Abuse parser gaps: `http://expected-host.com@169.254.169.254/`, `http://169.254.169.254#.expected-host.com/`, and backslash/whitespace tricks that split where the validator and the HTTP client disagree.",
            "Defeat resolve-then-fetch validators with DNS rebinding (a name that resolves public on check, private on fetch) or an open/own redirector that 302s an allowed host to `http://169.254.169.254/` — many clients follow redirects after the allowlist has already passed.",
          ],
        },
        {
          title: "Reach internal services and escalate to P2",
          steps: [
            "On AWS handle IMDSv2: first `PUT /latest/api/token` with `X-aws-ec2-metadata-token-ttl-seconds: 21600`, then replay the token in `X-aws-ec2-metadata-token` on the GET — many SSRF primitives that let you set one header can still complete this.",
            "Enumerate the cloud you're in: GCP `metadata.google.internal` needs `Metadata-Flavor: Google`; Azure IMDS needs `Metadata: true` at `169.254.169.254/metadata/instance?api-version=2021-02-01`.",
            "If only non-HTTP ports answer, consider `gopher://` to speak Redis/SMTP/HTTP-POST line protocols — but prove impact with the smallest benign read (a banner, a role name) and never pivot into real data or actions.",
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
      example:
        "A 'website screenshot' feature rendered any submitted URL in headless Chrome. A plain `169.254.169.254` was blocked, but a hunter-controlled page that 302-redirected to the AWS IMDSv2 token endpoint (setting the TTL header via a meta/redirect trick) returned live IAM role credentials inside the screenshot — internal secrets exposure, triaged P2. Had the same fetcher only revealed which internal ports answered, it would have landed at P3 (internal port/service scan) or P4 (port-presence only).",
      mapping: {
        bugcrowdVrt: "Server Security Misconfiguration › Server-Side Request Forgery (SSRF)",
        bugcrowdPriority: "varies",
        hackeroneCwe: "CWE-918: Server-Side Request Forgery (SSRF)",
        cvssSeverity: "Depends on impact — P4 Low → P3 Medium → P2 High",
        note:
          "Bugcrowd VRT bands: Internal Secrets Exposure P2; Internal Data Exposure P3; Internal Port Service Scan P3; Internal Exposure of the Presence of Data/Secrets P4; Internal Port Scan Only P4; External Low-impact P5; External DNS-query-only P5. Reaching cloud IMDS / internal secrets is what moves it from P4/P3 to P2.",
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
      intro:
        "A redirect target (`?next=`, `?returnUrl=`, a `Location` built from input) is taken on trust, so you can send an authenticated victim off-domain after they've already trusted the first hop. Bare GET-based open redirect is a P4 — the skill is in the validator bypass and, far more valuable, the chain: the same primitive steals an OAuth `code`/`token` or a SAML `RelayState`, turning a P4 into account takeover. Hunt it specifically on login/logout, SSO, and email-verification flows where a redirect rides alongside a secret.",
      howToFind: [
        {
          title: "Discover the parameter and break the validator",
          steps: [
            "Harvest redirect sinks from history and JS: `next`, `returnUrl`, `return_to`, `dest`, `continue`, `redirect`, `url`, `callback`, `image`, `u` — plus implicit ones in login/logout and `/oauth/authorize`.",
            "Beat weak checks that only look for a leading `http`/their own host: scheme-relative `//evil.example`, backslash `/\\evil.example`, userinfo `https://target.com@evil.example`, whitelisted-host-as-path `https://evil.example/target.com`, and `https://target.com.evil.example`.",
            "Try CRLF/tab/null and double-encoding (`%2F%2Fevil.example`, `/%09/evil.example`, `%00`) and unicode dot/slash homoglyphs to slip past normalizers that run before the client follows the redirect.",
          ],
        },
        {
          title: "Chain it for real severity",
          steps: [
            "In OAuth/OIDC, if `redirect_uri` validation shares the bug (path-append, subdomain, or open-redirect-on-an-allowed-host), bounce the `code`/`access_token` to your origin — that's the ATO, not the redirect.",
            "Where the redirect leaks a secret in the query/fragment, capture it via `Referer` on your landing page or a `window.location` read; a bare off-domain navigation alone stays P4, so always report the strongest reachable chain.",
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
      example:
        "A login flow echoed `?next=` into a 302 and only checked that the value began with `/`. Supplying `/\\evil.example` (a path that browsers treat as scheme-relative) sent the post-login redirect off-domain; because the same `next` was reused as the OAuth `redirect_uri` suffix, the authorization `code` landed on the attacker host → full ATO. On its own the redirect was the textbook P4 (GET-based, CVSS AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N); the OAuth chain is what made it pay.",
      mapping: {
        bugcrowdVrt: "Unvalidated Redirects and Forwards › Open Redirect › GET-Based",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N",
        hackeroneCwe: "CWE-601: URL Redirection to Untrusted Site (Open Redirect)",
        cvssSeverity: "Low (High when chained)",
        note:
          "Bugcrowd VRT: GET-Based P4; Header-Based, POST-Based and Flash-Based are each P5. Standalone value is minimal — the payout comes from OAuth/SAML token-theft chains.",
      },
      checklistCategoryId: "inject-redirect",
    },
    {
      id: "tabnabbing",
      name: "Reverse Tabnabbing & Missing Speed Bump",
      emoji: "🪟",
      intro:
        "When the app renders a user-controlled link with `target=\"_blank\"` and no `rel=\"noopener\"`, the opened page keeps a handle to the opener via `window.opener` and can silently rewrite the original tab's `location` to a phishing clone while the victim is distracted — reverse tabnabbing. The sibling issue is a missing security speed-bump / interstitial on outbound redirects, where the app sends users off-domain with no 'you are leaving' warning. Both are honest P5s: low standalone reward, but they sharpen a phishing or open-redirect chain and are trivial to spot in code review of link-rendering and redirect handlers.",
      howToFind: [
        {
          title: "Find opener-exposing links",
          steps: [
            "Locate places that render attacker-influenced URLs as links: profile/bio fields, comments, markdown renderers, support tickets, and any 'visit website' button fed from user data.",
            "Inspect the emitted anchor — `target=\"_blank\"` without `rel=\"noopener noreferrer\"` (or a JS `window.open(url)` without `noopener`) on an older browser means the new page can read/write `window.opener.location`.",
            "Confirm with a benign opener page that, on load, sets `window.opener.location` to a marker URL and observe the original tab navigate.",
          ],
        },
        {
          title: "Check for the missing speed-bump / interstitial",
          steps: [
            "Follow outbound redirect endpoints (link trackers, `/exit?url=`, email click-throughs) and note whether an interstitial warns before leaving the trusted origin.",
            "A direct off-domain 302 with no speed-bump page is the VRT 'Lack of Security Speed Bump Page' — report it as the P5 it is, and pair it with any open redirect to strengthen a phishing narrative.",
          ],
        },
      ],
      payloads: [
        "<a href=\"https://attacker.example/opener.html\" target=\"_blank\">click</a>   (rendered without rel=noopener)",
        "opener.html: <script>if (window.opener) window.opener.location = 'https://attacker.example/phish-marker';</script>",
        "[label](https://attacker.example/opener.html)   (markdown link that renders target=_blank)",
      ],
      example:
        "A community site rendered profile 'website' links with `target=\"_blank\"` and no `rel=\"noopener\"`. A crafted link opened an attacker tab that rewrote the original tab to a pixel-perfect login clone; a victim switching back re-authenticated into the fake. On its own the finding was P5 (reverse tabnabbing), but it materially strengthened a phishing chain reported alongside an open redirect.",
      mapping: {
        bugcrowdVrt: "Unvalidated Redirects and Forwards › Tabnabbing (and Lack of Security Speed Bump Page)",
        bugcrowdPriority: "P5",
        hackeroneCwe: "CWE-1022: Use of Web Link to Untrusted Target with window.opener Access",
        cvssSeverity: "Informational",
        note:
          "Bugcrowd VRT: Tabnabbing P5 and Lack of Security Speed Bump Page P5. Rewarded mainly as a component of a phishing/open-redirect chain, rarely standalone.",
      },
      checklistCategoryId: "inject-redirect",
    },
  ],
};
