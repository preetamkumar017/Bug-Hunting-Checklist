import type { LearnGroup } from "@/learn/data/types";

// Advanced, P3/P4-focused injection content.
//
// This group deliberately leads with the server-side injection variants that
// pay out repeatedly at Medium/Low — SSTI (Basic), CRLF response splitting, and
// content/iframe/HTML injection — and treats SQLi/RCE as the escalation ceiling
// those variants chain toward, not as the daily finding.
//
// VRT paths, priorities and default CVSS vectors are from Bugcrowd release
// 2026-07-08. CWE ids match HackerOne's weakness list.

export const injectionGroup: LearnGroup = {
  id: "injection",
  name: "Injection (P3/P4 lead)",
  emoji: "💉",
  blurb:
    "Server-side injection where input crosses from data into the server's own interpreters — a template engine, the HTTP response header block, or the HTML rendering context. The P3/P4 variants here are the repeatable earners; SQLi/RCE sit at the top as the escalation ceiling.",
  topics: [
    {
      id: "ssti",
      name: "Server-Side Template Injection (SSTI) — Basic → RCE",
      emoji: "🧩",
      intro:
        "Input is concatenated into the template SOURCE and compiled, not passed as a bound variable — so the engine evaluates your syntax instead of printing it. The whole find hinges on separating server-side evaluation from a client-side reflection: a value that renders 49 for {{7*7}} but 7*7 for ${7*7} is Jinja2/Twig, not XSS. Bugcrowd scores 'Basic' (arithmetic eval, config/constant read) at P4; the reason hunters chase it is that most engines reach a sandbox escape to RCE through object-graph traversal, turning that P4 into a P1.",
      howToFind: [
        {
          title: "Fingerprint the engine with a decision-tree polyglot",
          steps: [
            "Inject the polyglot ${{<%[%'\"}}%\\ into every reflected parameter and read which fragment errors or renders — that narrows the engine family before you commit to a syntax.",
            "Confirm evaluation with math that cannot be a coincidence: {{7*'7'}} returns 7777777 in Jinja2 but 49 in Twig, cleanly disambiguating the two most common Python/PHP stacks.",
            "Separate SSTI from reflected XSS: if the arithmetic resolves server-side it is SSTI (CWE-1336); if 7*7 is only reflected verbatim and executes in the DOM it is XSS — different VRT path, different payout.",
          ],
        },
        {
          title: "Prove impact at the minimum safe depth",
          steps: [
            "For a clean P4, read a non-secret constant — Jinja2 {{7*7}} plus {{ self }} / {{ cycler }} class disclosure, or Twig {{ _self.env }} — enough to show evaluation without touching data.",
            "Only escalate toward RCE when the program wants the chain proven, and prove it out-of-band: route the sandbox-escape gadget to a benign interactsh/Burp Collaborator callback rather than running system commands.",
            "In 2025 stacks watch for logic-less engines wrongly assumed safe (Handlebars/Pug/doT via require, Jinja2 with a loosened sandbox, Go text/template leaking struct fields) — 'it's sandboxed' is the developer assumption that makes this findable.",
          ],
        },
      ],
      payloads: [
        "${{<%[%'\"}}%\\            (polyglot — error/render tells you the engine)",
        "{{7*7}}  ->  49           (Jinja2 / Twig evaluation confirmed)",
        "{{7*'7'}} -> 7777777      (Jinja2) vs 49 (Twig) — disambiguate",
        "${7*7} / #{7*7} / <%= 7*7 %>   (Freemarker/Velocity / Ruby-Thymeleaf / ERB)",
        "{{ config }} or {{ _self.env }}   (read app config as proof, no RCE)",
      ],
      example:
        "A notification-template builder let staff embed {{first_name}} tokens rendered through Jinja2. {{7*7}}→49 confirmed server-side eval; {{config.items()}} surfaced the app SECRET_KEY. Reported at that depth it triaged as VRT 'SSTI › Basic' P4 — but because the same sink reached os via class traversal, the program accepted an OOB-proven escalation and paid it as a P1 RCE chain.",
      mapping: {
        bugcrowdVrt: "Server-Side Injection › Server-Side Template Injection (SSTI) › Basic",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N",
        hackeroneCwe: "CWE-1336: Improper Neutralization of Special Elements Used in a Template Engine",
        cvssSeverity: "Low",
        note:
          "'Basic' (arithmetic eval / config read) is P4; 'Custom' varies and a sandbox escape to RCE pushes the chain to P1. The AC:H in the default vector reflects the engine-fingerprinting and bypass work required.",
      },
      checklistCategoryId: "inject-ssti",
      references: [
        { label: "PortSwigger: Server-side template injection", url: "https://portswigger.net/web-security/server-side-template-injection" },
      ],
    },
    {
      id: "crlf",
      name: "CRLF / HTTP Response Splitting",
      emoji: "↩️",
      intro:
        "A user-controlled value is written into a response header (Location, Set-Cookie, a reflected custom X- header) without stripping CR/LF. Smuggle %0d%0a and you close the current header, inject your own, or terminate the header block entirely and author response body. Findability is binary: either the server passes raw \\r\\n through into the header block or it normalizes it — most modern frameworks normalize, so you hunt the places that still don't (redirect targets echoed into Location on a 3xx, language/locale values copied into Set-Cookie, header-reflection debug endpoints).",
      howToFind: [
        {
          title: "Locate header-reflecting sinks",
          steps: [
            "Grep your proxy history for request values that reappear in a response header — redirect/next/url params landing in Location, locale/currency params landing in Set-Cookie, and any X-* header echoed back.",
            "Inject an encoded newline plus a marker header: %0d%0aX-Injected:crlf-poc and confirm the raw header appears in the response, not the escaped literal text.",
            "Test encoding variants because front-end/back-end pairs disagree: %0d%0a, %0a, %E5%98%8A%E5%98%8D (Unicode overlong newline that some stacks fold to \\r\\n), and double-encoding %250d%250a.",
          ],
        },
        {
          title: "Turn the split into impact",
          steps: [
            "Forge a Set-Cookie to pin a known session value (session fixation) or drop a scoped cookie that a later flow trusts.",
            "Terminate the header block and author a tiny body to get reflected XSS executing in the target origin — this is the standard P3→higher escalation for CRLF.",
            "If the response is cacheable, a split that poisons a shared cache entry lifts it toward P2/P1; confirm the Cache-Control/age behavior before claiming it.",
          ],
        },
      ],
      payloads: [
        "/redirect?url=%0d%0aSet-Cookie:session=attacker-fixed",
        "/redirect?url=%0d%0aX-Injected:crlf-poc   (detection marker)",
        "%0d%0a%0d%0a<svg onload=alert(document.domain)>   (split body -> reflected XSS)",
        "%E5%98%8A%E5%98%8D   (Unicode newline some stacks fold to CRLF)",
      ],
      example:
        "A marketing redirect copied ?next= straight into the Location header on a 302. Injecting %0d%0aSet-Cookie:… planted an attacker-chosen session cookie on the victim; the raw header appeared unescaped in the response. Standalone it triaged as VRT 'HTTP Response Manipulation › Response Splitting (CRLF)' P3; because the forged cookie enabled session fixation the program weighed it toward the top of that band.",
      mapping: {
        bugcrowdVrt: "Server-Side Injection › HTTP Response Manipulation › Response Splitting (CRLF)",
        bugcrowdPriority: "P3",
        bugcrowdCvss: "AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N",
        hackeroneCwe: "CWE-113: Improper Neutralization of CRLF Sequences in HTTP Headers",
        cvssSeverity: "Medium",
        note:
          "P3 standalone. Chaining the split into cache poisoning, session fixation via an injected Set-Cookie, or reflected XSS in the authored body raises impact toward P2/P1.",
      },
      checklistCategoryId: "inject-crlf",
      references: [
        { label: "OWASP: HTTP Response Splitting", url: "https://owasp.org/www-community/attacks/HTTP_Response_Splitting" },
      ],
    },
    {
      id: "content-spoofing",
      name: "Content Spoofing — iframe & HTML Injection",
      emoji: "🖼️",
      intro:
        "Input is rendered into the page's HTML or an iframe src/text without script execution — so it is not XSS, but it misrepresents the UI of a trusted origin. The band is set entirely by the vector: an iframe you can point at attacker content framed inside the target (interactive UI redress) is P3; HTML injected into an outbound email, or an external-authentication prompt you can spoof, is P4; plain text/markup with no interactivity is P5. The escalation edge is the boundary itself — the moment an injected tag actually executes script it leaves content spoofing and becomes XSS (CWE-79), jumping bands.",
      howToFind: [
        {
          title: "Classify the injection by what it renders",
          steps: [
            "Inject a benign HTML probe — <b>poc</b>, then <iframe src=//poc.example></iframe> — and inspect whether it renders as markup, an interactive frame, or is escaped to text.",
            "An interactive frame or clickable markup inside the trusted origin is iframe/HTML injection (P3/P4); inert escaped text is P5; a tag that fires JS (onerror/onload) is XSS — re-route that to the XSS group and its higher bands.",
            "Hit the under-tested surfaces: HTML-rendered email bodies (invites, notifications), SSO/external-auth landing text, error pages that echo a parameter, and broken-link spots where a dangling outbound link can be re-registered (impersonation via broken link hijacking, P4).",
          ],
        },
        {
          title: "Build a UI-redress proof that shows real deception",
          steps: [
            "For iframe injection, frame a credential-style prompt or fake 'session expired' panel served from your origin inside the target chrome, and screenshot the address bar showing the trusted host — that visual is the impact.",
            "For email HTML injection, show the injected markup surviving into the delivered mail (not just the compose preview).",
            "Keep every proof benign and in-scope: a labelled 'security test' banner, never a real credential-harvesting page — the finding is the misrepresentation, not a live phish.",
          ],
        },
      ],
      payloads: [
        "<iframe src=\"//poc.example/fake-login\" width=600 height=400></iframe>   (iframe injection)",
        "<b>Account suspended — verify at poc.example</b>   (HTML content injection)",
        "<a href=\"//poc.example\">Reset your password</a>   (email HTML injection)",
        "&lt;b&gt;poc&lt;/b&gt;   (escaped = P5 text-only, no markup rendered)",
      ],
      example:
        "A support-ticket viewer rendered the ticket subject as raw HTML. An <iframe> in the subject framed an attacker 'verify your account' panel inside the agent's trusted console. No script ran, so it was not XSS; it triaged as VRT 'Content Spoofing › iframe Injection' P3 for the UI misrepresentation against staff. A follow-up where <img onerror> fired would have moved it to the XSS path.",
      mapping: {
        bugcrowdVrt: "Server-Side Injection › Content Spoofing › iframe Injection",
        bugcrowdPriority: "P3",
        bugcrowdCvss: "AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:L/A:N",
        hackeroneCwe: "CWE-451: User Interface Misrepresentation of Critical Information (HTML injection maps to CWE-79)",
        cvssSeverity: "Medium",
        note:
          "iframe Injection P3; Email HTML Injection, External Authentication Injection and Impersonation via Broken Link Hijacking P4; plain HTML Content Injection P5. If any injected tag executes script it becomes XSS (CWE-79) and leaves this band.",
      },
      checklistCategoryId: "inject-crlf",
    },
    {
      id: "sqli-ceiling",
      name: "SQL Injection (escalation ceiling)",
      emoji: "🗄️",
      intro:
        "Included here only as the injection family's top end — the P1 the P3/P4 variants aim to chain toward, not a daily-driver finding. Input reaches an SQL statement unescaped, letting you rewrite the query to read arbitrary tables, bypass auth, or in bad cases reach the OS. If an SSTI or CRLF chain lands you near a backend query, this is the ceiling you are escalating to; prove it with a harmless marker, never customer data.",
      howToFind: [
        {
          title: "Detect, then confirm out-of-band",
          steps: [
            "Send a lone quote ' and a balanced '' to each parameter; diverging errors or behavior flags a candidate.",
            "Confirm logically without reading data: AND 1=1 vs AND 1=2 for boolean, SLEEP(5)/pg_sleep(5)/WAITFOR DELAY for blind, and an OOB DNS lookup (xp_dirtree / LOAD_FILE('\\\\\\\\oob\\\\x')) where stacked queries allow.",
            "Only reach for sqlmap after a manual signal, keep it tightly scoped, and prove impact with UNION SELECT version()/current_user — a benign marker, not a PII dump.",
          ],
        },
      ],
      payloads: [
        "' OR '1'='1' -- -",
        "1 AND SLEEP(5)-- -        (time-based blind)",
        "1 UNION SELECT NULL,version(),NULL-- -   (benign marker proof)",
      ],
      example:
        "A reporting filter concatenated a sort column into the query; sort=name)-- broke it and a UNION surfaced the DB version — proven without touching customer rows and triaged P1. Cited here so a P3/P4 injection chain has a clear top-of-band to escalate toward.",
      mapping: {
        bugcrowdVrt: "Server-Side Injection › SQL Injection",
        bugcrowdPriority: "P1",
        bugcrowdCvss: "AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:L/A:N",
        hackeroneCwe: "CWE-89: Improper Neutralization of Special Elements used in an SQL Command",
        cvssSeverity: "Critical",
        note:
          "Listed as the injection family's escalation ceiling, not a P3/P4 lead. A clean, provable injection point is P1 on its own.",
      },
      checklistCategoryId: "inject-sqli",
      references: [
        { label: "PortSwigger: SQL injection", url: "https://portswigger.net/web-security/sql-injection" },
      ],
    },
  ],
};
