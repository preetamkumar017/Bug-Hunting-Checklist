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
      intro: {
        en: "Input is concatenated into the template SOURCE and compiled, not passed as a bound variable — so the engine evaluates your syntax instead of printing it. The whole find hinges on separating server-side evaluation from a client-side reflection: a value that renders 49 for {{7*7}} but 7*7 for ${7*7} is Jinja2/Twig, not XSS. Bugcrowd scores 'Basic' (arithmetic eval, config/constant read) at P4; the reason hunters chase it is that most engines reach a sandbox escape to RCE through object-graph traversal, turning that P4 into a P1.",
        simple: "Input is glued into the template SOURCE and compiled, not passed as a bound variable — so the engine runs your syntax instead of printing it. The whole find hinges on telling server-side evaluation apart from a client-side reflection: a value that renders 49 for {{7*7}} but 7*7 for ${7*7} is Jinja2/Twig, not XSS. Bugcrowd scores 'Basic' (arithmetic eval, config/constant read) at P4; hunters chase it because most engines reach a sandbox escape to RCE through object-graph traversal, turning that P4 into a P1.",
        hi: "input को template के SOURCE में जोड़कर compile किया जाता है, bound variable की तरह pass नहीं किया जाता — इसलिए engine आपके syntax को print करने के बजाय evaluate कर देता है। पूरी find इस पर टिकी है कि server-side evaluation को client-side reflection से अलग किया जाए: ऐसा value जो {{7*7}} के लिए 49 पर ${7*7} के लिए 7*7 render करे वह Jinja2/Twig है, XSS नहीं। Bugcrowd 'Basic' (arithmetic eval, config/constant read) को P4 देता है; hunters इसके पीछे इसलिए पड़ते हैं क्योंकि ज़्यादातर engines object-graph traversal से sandbox escape करके RCE तक पहुँच जाते हैं, जो उस P4 को P1 बना देता है।",
      },
      howToFind: [
        {
          title: {
            en: "Fingerprint the engine with a decision-tree polyglot",
            simple: "Fingerprint the engine with a decision-tree polyglot",
            hi: "decision-tree polyglot से engine fingerprint करें",
          },
          steps: [
            {
              en: "Inject the polyglot ${{<%[%'\"}}%\\ into every reflected parameter and read which fragment errors or renders — that narrows the engine family before you commit to a syntax.",
              simple: "Inject the polyglot ${{<%[%'\"}}%\\ into every reflected parameter and read which fragment errors or renders — that narrows down the engine family before you pick a syntax.",
              hi: "polyglot ${{<%[%'\"}}%\\ को हर reflected parameter में inject करें और देखें कौन-सा fragment error देता है या render होता है — किसी syntax पर टिकने से पहले यह engine family को सीमित कर देता है।",
            },
            {
              en: "Confirm evaluation with math that cannot be a coincidence: {{7*'7'}} returns 7777777 in Jinja2 but 49 in Twig, cleanly disambiguating the two most common Python/PHP stacks.",
              simple: "Confirm evaluation with math that cannot be a coincidence: {{7*'7'}} returns 7777777 in Jinja2 but 49 in Twig, cleanly telling apart the two most common Python/PHP stacks.",
              hi: "ऐसे math से evaluation confirm करें जो संयोग न हो सके: {{7*'7'}} Jinja2 में 7777777 पर Twig में 49 लौटाता है, जो दोनों सबसे आम Python/PHP stacks को साफ़-साफ़ अलग कर देता है।",
            },
            {
              en: "Separate SSTI from reflected XSS: if the arithmetic resolves server-side it is SSTI (CWE-1336); if 7*7 is only reflected verbatim and executes in the DOM it is XSS — different VRT path, different payout.",
              simple: "Tell SSTI apart from reflected XSS: if the arithmetic resolves server-side it is SSTI (CWE-1336); if 7*7 only comes back verbatim and runs in the DOM it is XSS — a different VRT path and a different payout.",
              hi: "SSTI को reflected XSS से अलग करें: अगर arithmetic server-side हल हो तो यह SSTI (CWE-1336) है; अगर 7*7 सिर्फ़ ज्यों-का-त्यों reflect हो और DOM में execute हो तो यह XSS है — अलग VRT path, अलग payout।",
            },
          ],
        },
        {
          title: {
            en: "Prove impact at the minimum safe depth",
            simple: "Prove impact at the minimum safe depth",
            hi: "कम-से-कम safe depth पर impact साबित करें",
          },
          steps: [
            {
              en: "For a clean P4, read a non-secret constant — Jinja2 {{7*7}} plus {{ self }} / {{ cycler }} class disclosure, or Twig {{ _self.env }} — enough to show evaluation without touching data.",
              simple: "For a clean P4, read a non-secret constant — Jinja2 {{7*7}} plus {{ self }} / {{ cycler }} class disclosure, or Twig {{ _self.env }} — enough to show evaluation without touching data.",
              hi: "एक साफ़ P4 के लिए कोई non-secret constant पढ़ें — Jinja2 {{7*7}} के साथ {{ self }} / {{ cycler }} class disclosure, या Twig {{ _self.env }} — data को छुए बिना evaluation दिखाने के लिए इतना काफ़ी है।",
            },
            {
              en: "Only escalate toward RCE when the program wants the chain proven, and prove it out-of-band: route the sandbox-escape gadget to a benign interactsh/Burp Collaborator callback rather than running system commands.",
              simple: "Only escalate toward RCE when the program wants the chain proven, and prove it out-of-band: route the sandbox-escape gadget to a harmless interactsh/Burp Collaborator callback instead of running system commands.",
              hi: "RCE की ओर तभी escalate करें जब program chain साबित करवाना चाहे, और इसे out-of-band साबित करें: sandbox-escape gadget को system commands चलाने के बजाय किसी benign interactsh/Burp Collaborator callback पर भेजें।",
            },
            {
              en: "In 2025 stacks watch for logic-less engines wrongly assumed safe (Handlebars/Pug/doT via require, Jinja2 with a loosened sandbox, Go text/template leaking struct fields) — 'it's sandboxed' is the developer assumption that makes this findable.",
              simple: "In 2025 stacks watch for logic-less engines wrongly assumed safe (Handlebars/Pug/doT via require, Jinja2 with a loosened sandbox, Go text/template leaking struct fields) — 'it's sandboxed' is the developer assumption that makes this findable.",
              hi: "2025 के stacks में उन logic-less engines पर नज़र रखें जिन्हें ग़लती से safe मान लिया जाता है (require के ज़रिए Handlebars/Pug/doT, ढीले sandbox वाला Jinja2, struct fields leak करता Go text/template) — 'it's sandboxed' वही developer धारणा है जो इसे findable बनाती है।",
            },
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
      example: {
        en: "A notification-template builder let staff embed {{first_name}} tokens rendered through Jinja2. {{7*7}}→49 confirmed server-side eval; {{config.items()}} surfaced the app SECRET_KEY. Reported at that depth it triaged as VRT 'SSTI › Basic' P4 — but because the same sink reached os via class traversal, the program accepted an OOB-proven escalation and paid it as a P1 RCE chain.",
        simple: "A notification-template builder let staff embed {{first_name}} tokens rendered through Jinja2. {{7*7}}→49 confirmed server-side eval; {{config.items()}} surfaced the app SECRET_KEY. Reported at that depth it triaged as VRT 'SSTI › Basic' P4 — but because the same sink reached os via class traversal, the program accepted an OOB-proven escalation and paid it as a P1 RCE chain.",
        hi: "एक notification-template builder staff को {{first_name}} tokens embed करने देता था जो Jinja2 से render होते थे। {{7*7}}→49 ने server-side eval confirm किया; {{config.items()}} ने app SECRET_KEY सामने ला दी। उसी depth पर report करने पर यह VRT 'SSTI › Basic' P4 पर triage हुआ — पर चूँकि वही sink class traversal से os तक पहुँचा, program ने एक OOB-proven escalation स्वीकार की और इसे P1 RCE chain के रूप में pay किया।",
      },
      mapping: {
        bugcrowdVrt: "Server-Side Injection › Server-Side Template Injection (SSTI) › Basic",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N",
        hackeroneCwe: "CWE-1336: Improper Neutralization of Special Elements Used in a Template Engine",
        cvssSeverity: "Low",
        note: {
          en: "'Basic' (arithmetic eval / config read) is P4; 'Custom' varies and a sandbox escape to RCE pushes the chain to P1. The AC:H in the default vector reflects the engine-fingerprinting and bypass work required.",
          simple: "'Basic' (arithmetic eval / config read) is P4; 'Custom' varies, and a sandbox escape to RCE pushes the chain to P1. The AC:H in the default vector reflects the engine-fingerprinting and bypass work it takes.",
          hi: "'Basic' (arithmetic eval / config read) P4 है; 'Custom' varies और RCE तक sandbox escape इस chain को P1 पर धकेल देता है। default vector का AC:H उस engine-fingerprinting और bypass मेहनत को दर्शाता है जो लगती है।",
        },
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
      intro: {
        en: "A user-controlled value is written into a response header (Location, Set-Cookie, a reflected custom X- header) without stripping CR/LF. Smuggle %0d%0a and you close the current header, inject your own, or terminate the header block entirely and author response body. Findability is binary: either the server passes raw \\r\\n through into the header block or it normalizes it — most modern frameworks normalize, so you hunt the places that still don't (redirect targets echoed into Location on a 3xx, language/locale values copied into Set-Cookie, header-reflection debug endpoints).",
        simple: "A user-controlled value is written into a response header (Location, Set-Cookie, a reflected custom X- header) without stripping CR/LF. Smuggle %0d%0a and you close the current header, inject your own, or end the header block entirely and write your own response body. Findability is binary: either the server passes raw \\r\\n through into the header block or it normalizes it — most modern frameworks normalize, so you hunt the places that still don't (redirect targets echoed into Location on a 3xx, language/locale values copied into Set-Cookie, header-reflection debug endpoints).",
        hi: "एक user-controlled value बिना CR/LF हटाए किसी response header (Location, Set-Cookie, कोई reflected custom X- header) में लिख दी जाती है। %0d%0a smuggle करें और आप मौजूदा header बंद कर दें, अपना header inject करें, या पूरा header block ख़त्म करके response body ख़ुद लिख दें। findability binary है: या तो server raw \\r\\n को header block में से गुज़र जाने दे या उसे normalize कर दे — ज़्यादातर आधुनिक frameworks normalize करते हैं, इसलिए आप वे जगहें खोजते हैं जो अब भी नहीं करतीं (3xx पर Location में echo होते redirect targets, Set-Cookie में copy होते language/locale values, header-reflection debug endpoints)।",
      },
      howToFind: [
        {
          title: {
            en: "Locate header-reflecting sinks",
            simple: "Find header-reflecting sinks",
            hi: "header-reflecting sinks ढूँढें",
          },
          steps: [
            {
              en: "Grep your proxy history for request values that reappear in a response header — redirect/next/url params landing in Location, locale/currency params landing in Set-Cookie, and any X-* header echoed back.",
              simple: "Grep your proxy history for request values that come back in a response header — redirect/next/url params landing in Location, locale/currency params landing in Set-Cookie, and any X-* header echoed back.",
              hi: "अपने proxy history में उन request values के लिए grep करें जो किसी response header में दोबारा दिखें — redirect/next/url params जो Location में जाएँ, locale/currency params जो Set-Cookie में जाएँ, और कोई भी X-* header जो वापस echo हो।",
            },
            {
              en: "Inject an encoded newline plus a marker header: %0d%0aX-Injected:crlf-poc and confirm the raw header appears in the response, not the escaped literal text.",
              simple: "Inject an encoded newline plus a marker header: %0d%0aX-Injected:crlf-poc and confirm the raw header shows up in the response, not the escaped literal text.",
              hi: "एक encoded newline और एक marker header inject करें: %0d%0aX-Injected:crlf-poc और पक्का करें कि response में raw header दिखे, escaped literal text नहीं।",
            },
            {
              en: "Test encoding variants because front-end/back-end pairs disagree: %0d%0a, %0a, %E5%98%8A%E5%98%8D (Unicode overlong newline that some stacks fold to \\r\\n), and double-encoding %250d%250a.",
              simple: "Test encoding variants because the front-end and back-end disagree: %0d%0a, %0a, %E5%98%8A%E5%98%8D (a Unicode overlong newline some stacks fold to \\r\\n), and double-encoding %250d%250a.",
              hi: "encoding variants test करें क्योंकि front-end/back-end जोड़ी आपस में असहमत होती है: %0d%0a, %0a, %E5%98%8A%E5%98%8D (एक Unicode overlong newline जिसे कुछ stacks \\r\\n में बदल देते हैं), और double-encoding %250d%250a।",
            },
          ],
        },
        {
          title: {
            en: "Turn the split into impact",
            simple: "Turn the split into impact",
            hi: "split को impact में बदलें",
          },
          steps: [
            {
              en: "Forge a Set-Cookie to pin a known session value (session fixation) or drop a scoped cookie that a later flow trusts.",
              simple: "Forge a Set-Cookie to pin a known session value (session fixation) or drop a scoped cookie that a later flow trusts.",
              hi: "किसी known session value को pin करने के लिए एक Set-Cookie forge करें (session fixation) या एक scoped cookie डालें जिस पर कोई बाद वाला flow भरोसा करे।",
            },
            {
              en: "Terminate the header block and author a tiny body to get reflected XSS executing in the target origin — this is the standard P3→higher escalation for CRLF.",
              simple: "End the header block and write a tiny body to get reflected XSS running in the target origin — this is the standard P3→higher escalation for CRLF.",
              hi: "header block ख़त्म करें और एक छोटी-सी body लिखें ताकि target origin में reflected XSS execute हो — CRLF के लिए यही standard P3→ऊँचा escalation है।",
            },
            {
              en: "If the response is cacheable, a split that poisons a shared cache entry lifts it toward P2/P1; confirm the Cache-Control/age behavior before claiming it.",
              simple: "If the response is cacheable, a split that poisons a shared cache entry lifts it toward P2/P1; confirm the Cache-Control/age behaviour before claiming it.",
              hi: "अगर response cacheable हो, तो ऐसा split जो किसी shared cache entry को poison कर दे उसे P2/P1 की ओर उठाता है; दावा करने से पहले Cache-Control/age behaviour confirm करें।",
            },
          ],
        },
      ],
      payloads: [
        "/redirect?url=%0d%0aSet-Cookie:session=attacker-fixed",
        "/redirect?url=%0d%0aX-Injected:crlf-poc   (detection marker)",
        "%0d%0a%0d%0a<svg onload=alert(document.domain)>   (split body -> reflected XSS)",
        "%E5%98%8A%E5%98%8D   (Unicode newline some stacks fold to CRLF)",
      ],
      example: {
        en: "A marketing redirect copied ?next= straight into the Location header on a 302. Injecting %0d%0aSet-Cookie:… planted an attacker-chosen session cookie on the victim; the raw header appeared unescaped in the response. Standalone it triaged as VRT 'HTTP Response Manipulation › Response Splitting (CRLF)' P3; because the forged cookie enabled session fixation the program weighed it toward the top of that band.",
        simple: "A marketing redirect copied ?next= straight into the Location header on a 302. Injecting %0d%0aSet-Cookie:… planted an attacker-chosen session cookie on the victim; the raw header appeared unescaped in the response. On its own it triaged as VRT 'HTTP Response Manipulation › Response Splitting (CRLF)' P3; because the forged cookie enabled session fixation, the program weighed it toward the top of that band.",
        hi: "एक marketing redirect ने ?next= को 302 पर सीधे Location header में copy कर दिया। %0d%0aSet-Cookie:… inject करने पर victim पर attacker का चुना हुआ session cookie लग गया; raw header response में unescaped दिखा। अकेले यह VRT 'HTTP Response Manipulation › Response Splitting (CRLF)' P3 पर triage हुआ; चूँकि forged cookie ने session fixation संभव किया, program ने इसे उस band के top की ओर तौला।",
      },
      mapping: {
        bugcrowdVrt: "Server-Side Injection › HTTP Response Manipulation › Response Splitting (CRLF)",
        bugcrowdPriority: "P3",
        hackeroneCwe: "CWE-113: Improper Neutralization of CRLF Sequences in HTTP Headers",
        cvssSeverity: "Medium",
        note: {
          en: "P3 standalone. Chaining the split into cache poisoning, session fixation via an injected Set-Cookie, or reflected XSS in the authored body raises impact toward P2/P1.",
          simple: "P3 on its own. Chaining the split into cache poisoning, session fixation via an injected Set-Cookie, or reflected XSS in the body you author raises impact toward P2/P1.",
          hi: "अकेले P3। split को cache poisoning, injected Set-Cookie से session fixation, या ख़ुद लिखी body में reflected XSS में chain करना impact को P2/P1 की ओर बढ़ाता है।",
        },
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
      intro: {
        en: "Input is rendered into the page's HTML or an iframe src/text without script execution — so it is not XSS, but it misrepresents the UI of a trusted origin. The band is set entirely by the vector: an iframe you can point at attacker content framed inside the target (interactive UI redress) is P3; HTML injected into an outbound email, or an external-authentication prompt you can spoof, is P4; plain text/markup with no interactivity is P5. The escalation edge is the boundary itself — the moment an injected tag actually executes script it leaves content spoofing and becomes XSS (CWE-79), jumping bands.",
        simple: "Input is rendered into the page's HTML or an iframe src/text without script running — so it is not XSS, but it misrepresents the UI of a trusted origin. The band is set entirely by the vector: an iframe you can point at attacker content framed inside the target (interactive UI redress) is P3; HTML injected into an outbound email, or an external-authentication prompt you can spoof, is P4; plain text/markup with no interactivity is P5. The escalation edge is the boundary itself — the moment an injected tag actually runs script it leaves content spoofing and becomes XSS (CWE-79), jumping bands.",
        hi: "input page के HTML या किसी iframe के src/text में बिना script execution के render होता है — इसलिए यह XSS नहीं है, पर यह किसी trusted origin की UI को ग़लत तरीक़े से पेश करता है। band पूरी तरह vector से तय होती है: एक iframe जिसे आप target के अंदर framed attacker content की ओर मोड़ सकें (interactive UI redress) P3 है; किसी outbound email में inject किया HTML, या एक external-authentication prompt जिसे आप spoof कर सकें, P4 है; बिना interactivity वाला plain text/markup P5 है। escalation की कगार ख़ुद वह सीमा है — जिस पल कोई inject किया tag सचमुच script execute करे वह content spoofing छोड़कर XSS (CWE-79) बन जाता है और band बदल देता है।",
      },
      howToFind: [
        {
          title: {
            en: "Classify the injection by what it renders",
            simple: "Classify the injection by what it renders",
            hi: "injection को इससे classify करें कि वह क्या render करता है",
          },
          steps: [
            {
              en: "Inject a benign HTML probe — <b>poc</b>, then <iframe src=//poc.example></iframe> — and inspect whether it renders as markup, an interactive frame, or is escaped to text.",
              simple: "Inject a harmless HTML probe — <b>poc</b>, then <iframe src=//poc.example></iframe> — and check whether it renders as markup, an interactive frame, or is escaped to text.",
              hi: "एक benign HTML probe inject करें — <b>poc</b>, फिर <iframe src=//poc.example></iframe> — और देखें कि यह markup की तरह render होता है, interactive frame बनता है, या text में escape हो जाता है।",
            },
            {
              en: "An interactive frame or clickable markup inside the trusted origin is iframe/HTML injection (P3/P4); inert escaped text is P5; a tag that fires JS (onerror/onload) is XSS — re-route that to the XSS group and its higher bands.",
              simple: "An interactive frame or clickable markup inside the trusted origin is iframe/HTML injection (P3/P4); inert escaped text is P5; a tag that fires JS (onerror/onload) is XSS — move that to the XSS group and its higher bands.",
              hi: "trusted origin के अंदर कोई interactive frame या clickable markup iframe/HTML injection (P3/P4) है; बेजान escaped text P5 है; ऐसा tag जो JS fire करे (onerror/onload) XSS है — उसे XSS group और उसके ऊँचे bands की ओर भेजें।",
            },
            {
              en: "Hit the under-tested surfaces: HTML-rendered email bodies (invites, notifications), SSO/external-auth landing text, error pages that echo a parameter, and broken-link spots where a dangling outbound link can be re-registered (impersonation via broken link hijacking, P4).",
              simple: "Hit the under-tested surfaces: HTML email bodies (invites, notifications), SSO/external-auth landing text, error pages that echo a parameter, and broken-link spots where a dangling outbound link can be re-registered (impersonation via broken link hijacking, P4).",
              hi: "कम-test होने वाली surfaces पर जाएँ: HTML-rendered email bodies (invites, notifications), SSO/external-auth landing text, parameter को echo करते error pages, और broken-link जगहें जहाँ कोई dangling outbound link दोबारा register किया जा सके (impersonation via broken link hijacking, P4)।",
            },
          ],
        },
        {
          title: {
            en: "Build a UI-redress proof that shows real deception",
            simple: "Build a UI-redress proof that shows real deception",
            hi: "एक UI-redress proof बनाएँ जो असली deception दिखाए",
          },
          steps: [
            {
              en: "For iframe injection, frame a credential-style prompt or fake 'session expired' panel served from your origin inside the target chrome, and screenshot the address bar showing the trusted host — that visual is the impact.",
              simple: "For iframe injection, frame a credential-style prompt or a fake 'session expired' panel served from your origin inside the target's chrome, and screenshot the address bar showing the trusted host — that visual is the impact.",
              hi: "iframe injection के लिए अपने origin से परोसा गया एक credential-जैसा prompt या नक़ली 'session expired' panel target के chrome के अंदर frame करें, और address bar का screenshot लें जो trusted host दिखाए — वही visual impact है।",
            },
            {
              en: "For email HTML injection, show the injected markup surviving into the delivered mail (not just the compose preview).",
              simple: "For email HTML injection, show the injected markup surviving into the delivered mail (not just the compose preview).",
              hi: "email HTML injection के लिए दिखाएँ कि inject किया markup delivered mail तक बचा रहता है (सिर्फ़ compose preview में नहीं)।",
            },
            {
              en: "Keep every proof benign and in-scope: a labelled 'security test' banner, never a real credential-harvesting page — the finding is the misrepresentation, not a live phish.",
              simple: "Keep every proof harmless and in-scope: a labelled 'security test' banner, never a real credential-harvesting page — the finding is the misrepresentation, not a live phish.",
              hi: "हर proof benign और in-scope रखें: एक labelled 'security test' banner, कभी असली credential-harvesting page नहीं — finding वह ग़लत पेशकश है, कोई live phish नहीं।",
            },
          ],
        },
      ],
      payloads: [
        "<iframe src=\"//poc.example/fake-login\" width=600 height=400></iframe>   (iframe injection)",
        "<b>Account suspended — verify at poc.example</b>   (HTML content injection)",
        "<a href=\"//poc.example\">Reset your password</a>   (email HTML injection)",
        "&lt;b&gt;poc&lt;/b&gt;   (escaped = P5 text-only, no markup rendered)",
      ],
      example: {
        en: "A support-ticket viewer rendered the ticket subject as raw HTML. An <iframe> in the subject framed an attacker 'verify your account' panel inside the agent's trusted console. No script ran, so it was not XSS; it triaged as VRT 'Content Spoofing › iframe Injection' P3 for the UI misrepresentation against staff. A follow-up where <img onerror> fired would have moved it to the XSS path.",
        simple: "A support-ticket viewer rendered the ticket subject as raw HTML. An <iframe> in the subject framed an attacker 'verify your account' panel inside the agent's trusted console. No script ran, so it was not XSS; it triaged as VRT 'Content Spoofing › iframe Injection' P3 for the UI misrepresentation against staff. A follow-up where <img onerror> fired would have moved it to the XSS path.",
        hi: "एक support-ticket viewer ने ticket subject को raw HTML की तरह render किया। subject में मौजूद एक <iframe> ने agent के trusted console के अंदर एक attacker का 'verify your account' panel frame कर दिया। कोई script नहीं चली, इसलिए यह XSS नहीं था; यह staff के ख़िलाफ़ UI misrepresentation के लिए VRT 'Content Spoofing › iframe Injection' P3 पर triage हुआ। एक follow-up जहाँ <img onerror> fire होता, इसे XSS path पर ले जाता।",
      },
      mapping: {
        bugcrowdVrt: "Server-Side Injection › Content Spoofing › iframe Injection",
        bugcrowdPriority: "P3",
        bugcrowdCvss: "AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:L/A:N",
        hackeroneCwe: "CWE-451: User Interface Misrepresentation of Critical Information (HTML injection maps to CWE-79)",
        cvssSeverity: "Medium",
        note: {
          en: "iframe Injection P3; Email HTML Injection, External Authentication Injection and Impersonation via Broken Link Hijacking P4; plain HTML Content Injection P5. If any injected tag executes script it becomes XSS (CWE-79) and leaves this band.",
          simple: "iframe Injection P3; Email HTML Injection, External Authentication Injection and Impersonation via Broken Link Hijacking P4; plain HTML Content Injection P5. If any injected tag runs script it becomes XSS (CWE-79) and leaves this band.",
          hi: "iframe Injection P3; Email HTML Injection, External Authentication Injection और Impersonation via Broken Link Hijacking P4; plain HTML Content Injection P5। अगर कोई inject किया tag script execute करे तो यह XSS (CWE-79) बन जाता है और यह band छोड़ देता है।",
        },
      },
      checklistCategoryId: "inject-crlf",
    },
    {
      id: "sqli-ceiling",
      name: "SQL Injection (escalation ceiling)",
      emoji: "🗄️",
      intro: {
        en: "Included here only as the injection family's top end — the P1 the P3/P4 variants aim to chain toward, not a daily-driver finding. Input reaches an SQL statement unescaped, letting you rewrite the query to read arbitrary tables, bypass auth, or in bad cases reach the OS. If an SSTI or CRLF chain lands you near a backend query, this is the ceiling you are escalating to; prove it with a harmless marker, never customer data.",
        simple: "Included here only as the injection family's top end — the P1 the P3/P4 variants aim to chain toward, not a daily finding. Input reaches an SQL statement unescaped, letting you rewrite the query to read any table, bypass auth, or in bad cases reach the OS. If an SSTI or CRLF chain lands you near a backend query, this is the ceiling you are escalating to; prove it with a harmless marker, never customer data.",
        hi: "यहाँ सिर्फ़ injection family के सबसे ऊँचे सिरे के रूप में शामिल — वह P1 जिसकी ओर P3/P4 variants chain करने का लक्ष्य रखते हैं, कोई रोज़-मर्रा की finding नहीं। input किसी SQL statement तक बिना escape पहुँच जाता है, जिससे आप query को फिर से लिखकर मनमानी tables पढ़ सकें, auth bypass कर सकें, या बुरे हाल में OS तक पहुँच सकें। अगर कोई SSTI या CRLF chain आपको किसी backend query के पास ले जाए, तो यही वह ceiling है जिसकी ओर आप escalate कर रहे हैं; इसे किसी harmless marker से साबित करें, कभी customer data से नहीं।",
      },
      howToFind: [
        {
          title: {
            en: "Detect, then confirm out-of-band",
            simple: "Detect, then confirm out-of-band",
            hi: "पहले detect करें, फिर out-of-band confirm करें",
          },
          steps: [
            {
              en: "Send a lone quote ' and a balanced '' to each parameter; diverging errors or behavior flags a candidate.",
              simple: "Send a lone quote ' and a balanced '' to each parameter; different errors or behaviour flags a candidate.",
              hi: "हर parameter को एक अकेला quote ' और एक balanced '' भेजें; अलग-अलग errors या behaviour किसी candidate की ओर इशारा करते हैं।",
            },
            {
              en: "Confirm logically without reading data: AND 1=1 vs AND 1=2 for boolean, SLEEP(5)/pg_sleep(5)/WAITFOR DELAY for blind, and an OOB DNS lookup (xp_dirtree / LOAD_FILE('\\\\\\\\oob\\\\x')) where stacked queries allow.",
              simple: "Confirm logically without reading data: AND 1=1 vs AND 1=2 for boolean, SLEEP(5)/pg_sleep(5)/WAITFOR DELAY for blind, and an OOB DNS lookup (xp_dirtree / LOAD_FILE('\\\\\\\\oob\\\\x')) where stacked queries are allowed.",
              hi: "data पढ़े बिना logically confirm करें: boolean के लिए AND 1=1 बनाम AND 1=2, blind के लिए SLEEP(5)/pg_sleep(5)/WAITFOR DELAY, और जहाँ stacked queries चलें वहाँ एक OOB DNS lookup (xp_dirtree / LOAD_FILE('\\\\\\\\oob\\\\x'))।",
            },
            {
              en: "Only reach for sqlmap after a manual signal, keep it tightly scoped, and prove impact with UNION SELECT version()/current_user — a benign marker, not a PII dump.",
              simple: "Only reach for sqlmap after a manual signal, keep it tightly scoped, and prove impact with UNION SELECT version()/current_user — a harmless marker, not a PII dump.",
              hi: "sqlmap की ओर सिर्फ़ किसी manual signal के बाद जाएँ, उसे कसकर scoped रखें, और impact UNION SELECT version()/current_user से साबित करें — एक benign marker, कोई PII dump नहीं।",
            },
          ],
        },
      ],
      payloads: [
        "' OR '1'='1' -- -",
        "1 AND SLEEP(5)-- -        (time-based blind)",
        "1 UNION SELECT NULL,version(),NULL-- -   (benign marker proof)",
      ],
      example: {
        en: "A reporting filter concatenated a sort column into the query; sort=name)-- broke it and a UNION surfaced the DB version — proven without touching customer rows and triaged P1. Cited here so a P3/P4 injection chain has a clear top-of-band to escalate toward.",
        simple: "A reporting filter glued a sort column into the query; sort=name)-- broke it and a UNION surfaced the DB version — proven without touching customer rows and triaged P1. Cited here so a P3/P4 injection chain has a clear top-of-band to escalate toward.",
        hi: "एक reporting filter ने एक sort column को query में जोड़ दिया; sort=name)-- ने इसे तोड़ा और एक UNION ने DB version सामने ला दी — customer rows छुए बिना साबित हुआ और P1 पर triage हुआ। यहाँ इसलिए दिया गया ताकि किसी P3/P4 injection chain के पास escalate करने के लिए एक साफ़ top-of-band हो।",
      },
      mapping: {
        bugcrowdVrt: "Server-Side Injection › SQL Injection",
        bugcrowdPriority: "P1",
        bugcrowdCvss: "AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:L/A:N",
        hackeroneCwe: "CWE-89: Improper Neutralization of Special Elements used in an SQL Command",
        cvssSeverity: "Critical",
        note: {
          en: "Listed as the injection family's escalation ceiling, not a P3/P4 lead. A clean, provable injection point is P1 on its own.",
          simple: "Listed as the injection family's escalation ceiling, not a P3/P4 lead. A clean, provable injection point is P1 on its own.",
          hi: "injection family के escalation ceiling के रूप में सूचीबद्ध, कोई P3/P4 lead नहीं। एक साफ़, provable injection point अकेले ही P1 है।",
        },
      },
      checklistCategoryId: "inject-sqli",
      references: [
        { label: "PortSwigger: SQL injection", url: "https://portswigger.net/web-security/sql-injection" },
      ],
    },
  ],
};
