import type { TopicContent } from "@/learn/data/types";

// Per-leaf trilingual lesson content, keyed by FULL Bugcrowd VRT path.
export const dataExposureTopics: Record<string, TopicContent> = {
  "Application-Level Denial-of-Service (DoS) › Critical Impact and/or Easy Difficulty": {
    what: {
      en: "A low-cost request — or a handful of them, no authentication and no special skill — makes the application unavailable or unusable. Typical roots are unbounded server work reachable by anyone: catastrophic regex backtracking (ReDoS), decompression/zip bombs, an unpaginated export, or memory blow-up from deeply nested JSON or a huge declared body. It sits in the top band because the availability loss is real and the effort to cause it is trivial.",
      simple: "One cheap request, or just a few, with no login and no skill needed, takes the app down or makes it unusable. Usually a public endpoint does far too much work: a bad regex, a zip bomb, a giant export, or huge nested JSON eats all memory. It is high severity because it is easy and really breaks availability.",
      hi: "एक सस्ती request — या कुछ ही, बिना authentication और बिना किसी खास skill के — पूरी application को down या unusable कर देती है। आम वजहें: कोई public endpoint जो बहुत ज़्यादा server work करता है — catastrophic regex backtracking (ReDoS), zip bomb, बिना pagination वाला export, या deeply nested JSON से memory blow-up। यह top band में है क्योंकि availability खत्म होती है और effort बहुत कम लगता है।",
    },
    find: [
      {
        title: { en: "Find a cheap-input, expensive-work endpoint", simple: "Find an endpoint where small input causes big work", hi: "छोटे input से भारी work वाला endpoint ढूंढें" },
        steps: [
          { en: "Map endpoints that parse user-controlled regex, decompress uploads, render documents, or accept arbitrarily nested/large JSON — these are the usual amplifiers.", simple: "List endpoints that run user regex, unzip uploads, build documents, or take big nested JSON.", hi: "ऐसे endpoints map करें जो user regex चलाते हैं, uploads unzip करते हैं, documents बनाते हैं, या बड़ा nested JSON लेते हैं।" },
          { en: "Send ONE request with a benign amplifying input (e.g. a small ReDoS trigger, a modestly nested object) and compare response time / error rate to a normal request.", simple: "Send ONE safe test request and compare its time and errors to a normal one.", hi: "एक ही safe amplifying request भेजें और उसका time/error normal request से compare करें।" },
          { en: "Confirm the cost is on the server (CPU, worker, memory) and reachable without auth, then stop — do not repeat at volume.", simple: "Confirm the cost is on the server and needs no login, then stop. Do not flood it.", hi: "पक्का करें कि cost server पर है और बिना login पहुँचती है, फिर रुक जाएँ — flood न करें।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs a minimal, rate-limited proof: a single (or very few) benign request(s) that measurably degrade service — a large timing delta, worker saturation, or a 5xx — ideally on staging or with explicit program permission, plus the mechanism (which input drives which unbounded work). Many programs exclude DoS and volumetric/stress testing entirely; without that permission the report is out of scope / N/A. Never run load tests against production.",
      simple: "Show one or very few safe requests that clearly slow or break the service, and explain which input causes the heavy work. Do it on staging or with permission. Many programs ban DoS testing — then it is out of scope. Never load-test production.",
      hi: "Triage को minimal, rate-limited proof चाहिए: एक (या बहुत कम) safe request जो service को साफ़ तौर पर slow/break करे — बड़ा timing delta, worker saturation या 5xx — staging पर या program की permission से, साथ में mechanism। कई programs DoS/stress testing पूरी तरह exclude करते हैं; बिना permission यह out of scope/N/A है। Production पर load test कभी न करें।",
    },
  },

  "Application-Level Denial-of-Service (DoS) › High Impact and/or Medium Difficulty": {
    what: {
      en: "The same availability loss, but it needs more than a trivial request — some precondition (valid low-privilege auth, a specific sequence, moderate crafting) or the resource cost is amplified rather than instant. Examples: an authenticated bulk operation with no quota, a stateful flow that pins server resources, or an endpoint that needs a crafted but still small payload. The impact is high; the raised difficulty is exactly what separates this from the Critical/Easy sibling.",
      simple: "Same kind of outage, but it takes a bit more: maybe a login, a special order of steps, or a crafted payload. The damage is big, but it is not a one-click flood. That extra difficulty is what makes it this band instead of the easier one.",
      hi: "वही availability loss, पर इसके लिए trivial request से ज़्यादा चाहिए — कोई precondition (valid low-priv auth, खास sequence, थोड़ी crafting) या cost instant नहीं amplified होती है। जैसे: बिना quota वाला authenticated bulk operation, या stateful flow जो server resources pin कर देता है। Impact high है; बढ़ी हुई difficulty ही इसे Critical/Easy sibling से अलग करती है।",
    },
    find: [
      {
        title: { en: "Probe guarded or multi-step amplifiers", simple: "Test amplifiers that need auth or steps", hi: "auth/steps वाले amplifiers test करें" },
        steps: [
          { en: "With a low-privilege test account, look for bulk/batch actions, report generation, or search filters with no server-side quota or complexity cap.", simple: "Logged in as a basic test user, find bulk actions, report builders, or searches with no limit.", hi: "low-priv test account से bulk actions, report generation, या बिना quota/complexity cap वाले search filters ढूंढें।" },
          { en: "Craft the minimum request that triggers disproportionate work and fire it once, measuring the server-side cost delta.", simple: "Build the smallest request that causes big work, run it once, and measure the cost.", hi: "disproportionate work trigger करने वाली minimum request बनाएं, एक बार चलाएं और server cost delta मापें।" },
          { en: "Record the precondition (auth/steps/crafting) — it is what documents the 'medium difficulty' and keeps it out of the easier band.", simple: "Write down what was needed to trigger it — that proves the medium difficulty.", hi: "trigger के लिए जो precondition चाहिए उसे note करें — यही 'medium difficulty' दिखाता है।" },
        ],
      },
    ],
    proof: {
      en: "Show a single benign trigger plus the precondition it required, with a measurable degradation on staging or under program permission. The difficulty (auth, sequence, crafting) must be documented — that is what distinguishes this from the Critical/Easy band. DoS is excluded by many programs and automated/volumetric load is always off-limits; without explicit permission the finding is out of scope.",
      simple: "Prove it with one safe trigger, note what was needed to set it up, and measure the slowdown on staging or with permission. The setup step is what makes it this band. Many programs ban DoS; never flood production.",
      hi: "एक safe trigger और उसके लिए ज़रूरी precondition दिखाएं, staging पर या permission से measurable degradation के साथ। difficulty (auth/sequence/crafting) document करें — यही इसे Critical/Easy band से अलग करता है। कई programs DoS exclude करते हैं और volumetric load हमेशा मना है; बिना permission यह out of scope है।",
    },
    escalate: {
      en: "If the same amplifier turns out to need no auth and no crafting — a single anonymous request is enough — it moves up to 'Critical Impact and/or Easy Difficulty' (P2).",
      simple: "If it actually works with no login and no special crafting — one plain request — it becomes the Critical/Easy band (P2).",
      hi: "अगर वही amplifier बिना auth और बिना crafting चले — एक anonymous request काफ़ी हो — तो यह 'Critical Impact and/or Easy Difficulty' (P2) बन जाता है।",
    },
  },

  "Application-Level Denial-of-Service (DoS) › App Crash › Malformed Android Intents": {
    what: {
      en: "An exported Android component (Activity, Service, BroadcastReceiver, ContentProvider) crashes the app when it receives a malformed or unexpected Intent — a missing extra, a wrong type, a null where an object is read, or a huge/odd URI. Any other on-device app can send the Intent, so this is a local availability bug. On its own it only crashes the attacker-reachable app, which is why it is informational unless it chains into something more.",
      simple: "An exported Android component crashes the app when another app sends it a weird or broken Intent (missing or wrong data). Any app on the phone can send it. By itself it just crashes the app, so it is usually only informational.",
      hi: "कोई exported Android component (Activity/Service/Receiver/Provider) तब crash कर देता है जब उसे malformed या unexpected Intent मिले — missing extra, गलत type, null, या बड़ा/अजीब URI। device का कोई भी दूसरा app यह Intent भेज सकता है, तो यह local availability bug है। अकेले यह सिर्फ़ app crash करता है, इसलिए informational रहता है जब तक कुछ बड़े में chain न हो।",
    },
    find: [
      {
        title: { en: "Fuzz exported components via Intents", simple: "Send broken Intents to exported components", hi: "exported components को broken Intents भेजें" },
        steps: [
          { en: "Read AndroidManifest.xml (jadx/apktool) for components with android:exported=\"true\" or an intent-filter, and note the extras/URIs each handler reads.", simple: "In the manifest, list exported components and what data each one reads.", hi: "AndroidManifest.xml (jadx/apktool) में exported=\"true\" या intent-filter वाले components और उनके extras/URIs देखें।" },
          { en: "From a test harness or drozer, send Intents that omit required extras, use wrong types, or carry oversized/null values, and watch logcat for the crash.", simple: "Using adb or drozer, send Intents with missing, wrong, or huge data and watch logcat crash.", hi: "test harness या drozer से Intents भेजें जिनमें extras missing हों, गलत type या oversized/null values हों, और logcat में crash देखें।" },
          { en: "Capture the stack trace and the exact Intent that reproduces it, on your own test device.", simple: "Save the crash trace and the exact Intent that caused it, on your own device.", hi: "अपने test device पर crash का stack trace और उसे reproduce करने वाला exact Intent capture करें।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the malformed Intent (component + extras) and a logcat stack trace showing the unhandled exception on a test device. A crash of only the app the attacker already controls access to is typically informational (P5) and often not rewarded alone. It becomes meaningful if the crash is remotely triggerable, corrupts data, or bypasses a security control.",
      simple: "Show the exact Intent and the crash log on your own device. A crash that only hits the app itself is usually informational and often not paid alone. It matters if it is remote, loses data, or bypasses a control.",
      hi: "Triage को malformed Intent (component + extras) और test device पर unhandled exception का logcat stack trace चाहिए। सिर्फ़ उसी app का crash आम तौर पर informational (P5) है और अकेले अक्सर reward नहीं होता। यह तब मायने रखता है जब crash remote हो, data corrupt करे, या कोई security control bypass करे।",
    },
    escalate: {
      en: "The iOS equivalent is the sibling 'Malformed iOS URL Schemes' (P5); both stay informational unless the crash leaks data or defeats a control.",
      simple: "On iOS the same idea is the sibling 'Malformed iOS URL Schemes' (P5); both stay low unless the crash leaks data or breaks a control.",
      hi: "iOS का समकक्ष sibling 'Malformed iOS URL Schemes' (P5) है; दोनों तब तक informational रहते हैं जब तक crash data leak या control defeat न करे।",
    },
  },

  "Application-Level Denial-of-Service (DoS) › App Crash › Malformed iOS URL Schemes": {
    what: {
      en: "An iOS app registers a custom URL scheme (myapp://…) and crashes when it opens a malformed or unexpected URL — missing query items, wrong types, or values the handler dereferences without validation. Any app or a web page can invoke the scheme, so an attacker can crash the app from outside. Alone it is a local availability nuisance and informational; it only matters if the handler also exposes a sensitive action or data.",
      simple: "An iOS app opens links like myapp://… and crashes on a broken or weird URL it does not check. Any app or web page can open that link, so an attacker can crash the app. By itself it is just a crash and informational.",
      hi: "कोई iOS app custom URL scheme (myapp://…) register करता है और malformed/unexpected URL खोलने पर crash कर देता है — missing query items, गलत types, या बिना validation dereference किए values। कोई भी app या web page scheme invoke कर सकता है, तो attacker बाहर से app crash कर सकता है। अकेले यह local availability nuisance और informational है; तभी मायने रखता है जब handler sensitive action/data भी expose करे।",
    },
    find: [
      {
        title: { en: "Fuzz registered URL schemes", simple: "Open broken custom URLs", hi: "registered URL schemes fuzz करें" },
        steps: [
          { en: "From Info.plist (CFBundleURLSchemes) list the app's custom schemes and, in the handler code, see which parameters it reads from the URL.", simple: "In Info.plist find the custom schemes, then check which URL parts the code reads.", hi: "Info.plist (CFBundleURLSchemes) से custom schemes और handler code में पढ़े जाने वाले parameters देखें।" },
          { en: "Open crafted URLs (Safari, Notes, or `xcrun simctl openurl`) that drop required params, use wrong types, or oversized values, and watch for the crash in the device console.", simple: "Open crafted links via Safari or simctl with missing or wrong data and watch the app crash.", hi: "crafted URLs खोलें (Safari/Notes या `xcrun simctl openurl`) जिनमें params missing, गलत type या oversized हों, और console में crash देखें।" },
          { en: "Capture the crash report and the exact URL on your own test device.", simple: "Save the crash report and the exact URL on your own device.", hi: "अपने test device पर crash report और exact URL capture करें।" },
        ],
      },
    ],
    proof: {
      en: "Show the exact malformed URL and the iOS crash report on a test device. A crash that only affects the attacker-reachable app is usually informational (P5) and often unrewarded alone; it rises only if the scheme also triggers a sensitive action or discloses data.",
      simple: "Show the exact URL and the crash report on your own device. A crash of just the app is usually informational and often not paid alone, unless the link also does something sensitive or leaks data.",
      hi: "test device पर exact malformed URL और iOS crash report दिखाएं। सिर्फ़ app का crash आम तौर पर informational (P5) और अकेले अक्सर unrewarded है; तभी बढ़ता है जब scheme sensitive action trigger करे या data disclose करे।",
    },
    escalate: {
      en: "The Android counterpart is the sibling 'Malformed Android Intents' (P5); both are informational unless the crash leaks data or bypasses a security control.",
      simple: "On Android the same thing is 'Malformed Android Intents' (P5); both stay low unless the crash leaks data or breaks a control.",
      hi: "Android का समकक्ष sibling 'Malformed Android Intents' (P5) है; दोनों informational रहते हैं जब तक crash data leak या security control bypass न करे।",
    },
  },

  "Application-Level Denial-of-Service (DoS) › Excessive Resource Consumption › Injection (Prompt)": {
    what: {
      en: "A prompt sent to an LLM-backed feature is crafted to make the model do unbounded or very expensive work — asking for an enormous output, forcing long reasoning loops, or driving repeated tool/retrieval calls — so token, compute or downstream-API cost spikes. This is availability/cost exhaustion through the prompt surface, distinct from prompt injection that changes behaviour: here the goal is simply to burn resources. Priority varies with how much real cost/outage a benign proof shows and the program's DoS stance.",
      simple: "Someone sends an AI feature a prompt built to make it do huge or endless work — a giant answer, long loops, or many tool calls — so it burns lots of tokens, compute, or paid API calls. It is about wasting resources, not changing behaviour. How serious it is depends on the real cost shown and the program's DoS rules.",
      hi: "LLM-backed feature को भेजा गया prompt इस तरह craft किया जाता है कि model unbounded या बहुत महंगा work करे — बहुत बड़ा output माँगना, long reasoning loops, या बार-बार tool/retrieval calls — जिससे token/compute/downstream-API cost बढ़ जाए। यह prompt surface से availability/cost exhaustion है, व्यवहार बदलने वाले prompt injection से अलग: यहाँ मकसद सिर्फ़ resources जलाना है। Priority इस पर निर्भर करती है कि benign proof कितना real cost/outage दिखाता है और program का DoS रुख क्या है।",
    },
    find: [
      {
        title: { en: "Probe the LLM feature for unbounded cost", simple: "Test the AI feature for runaway cost", hi: "LLM feature में unbounded cost test करें" },
        steps: [
          { en: "Identify where user text reaches a model and whether output length, iteration count, and tool/retrieval calls are capped server-side.", simple: "Find where your text hits the model and whether output size and tool calls are limited.", hi: "पता करें user text model तक कहाँ पहुँचता है और क्या output length, iterations, tool/retrieval calls server-side capped हैं।" },
          { en: "Send ONE benign prompt that legitimately requests a large but harmless output or a bounded loop, and measure latency, token usage, or billed calls versus a normal prompt.", simple: "Send ONE harmless prompt asking for a big but safe output and measure the cost vs normal.", hi: "एक benign prompt भेजें जो बड़ा पर harmless output या bounded loop माँगे, और latency/token usage/billed calls normal से मापें।" },
          { en: "Record the cost multiplier and whether any cap exists; stop after a single demonstration — do not repeat to actually exhaust the service.", simple: "Note how much more it costs and if any limit exists, then stop. Do not keep running it.", hi: "cost multiplier और कोई cap है या नहीं note करें; एक demonstration के बाद रुक जाएँ — service exhaust करने के लिए दोहराएँ नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Provide one benign prompt that demonstrably causes disproportionate token/compute/downstream cost, with the measured multiplier and evidence that no server-side cap applies — on a test tenant or with permission. Do not actually exhaust the service or rack up real bills. Many programs exclude DoS; some reward resource-exhaustion only when it causes measurable cost/outage, so priority varies and a purely theoretical 'it could cost a lot' is usually N/A.",
      simple: "Show one safe prompt that clearly costs far more than normal and that no limit stops it, measured on a test account or with permission. Do not actually drain the service. Many programs ban DoS; a theory with no measured cost is usually rejected.",
      hi: "एक benign prompt दें जो साफ़ तौर पर disproportionate token/compute/downstream cost पैदा करे, measured multiplier और इस सबूत के साथ कि कोई server-side cap नहीं लगता — test tenant पर या permission से। service को सच में exhaust न करें। कई programs DoS exclude करते हैं; priority varies, और सिर्फ़ theoretical 'बहुत महंगा हो सकता है' आम तौर पर N/A है।",
    },
  },

  "Privacy Concerns › Unnecessary Data Collection › WiFi SSID+Password": {
    what: {
      en: "The app collects, stores, or transmits the device's WiFi network name (SSID) and — worse — the WiFi password, when it has no functional need to. That credential can expose the user's home/office network and is often retained or sent to a backend in cleartext or weakly protected form. It is a privacy/over-collection issue rather than a direct compromise of the target, which is why it sits at the moderate band rather than high.",
      simple: "The app grabs the WiFi name and password even though it does not need them. That password can expose the user's home or office network and may be stored or sent in cleartext. It is an over-collection privacy problem, not a direct hack of the target, so it is medium.",
      hi: "App बिना किसी functional ज़रूरत के device का WiFi SSID और — और बुरा — WiFi password collect/store/transmit करता है। यह credential user के home/office network को expose कर सकता है और अक्सर cleartext या कमज़ोर form में backend को भेजा/रखा जाता है। यह privacy/over-collection issue है, target का direct compromise नहीं, इसलिए यह moderate band में है।",
    },
    find: [
      {
        title: { en: "Trace WiFi credential handling", simple: "Check how the app handles WiFi details", hi: "WiFi credential handling trace करें" },
        steps: [
          { en: "Decompile the app (jadx / Hopper) and grep for WiFi APIs and keys (WifiManager, getConfiguredNetworks, SSID, preSharedKey, wifiPassword).", simple: "Decompile and search for WiFi code and keys like SSID and password.", hi: "App decompile करें (jadx/Hopper) और WifiManager, getConfiguredNetworks, SSID, preSharedKey जैसे keys grep करें।" },
          { en: "Proxy traffic (Burp/mitmproxy) while using the app and watch for the SSID/password being sent to any backend or analytics endpoint.", simple: "Proxy the app's traffic and watch for the WiFi name/password being sent out.", hi: "App चलाते हुए traffic proxy करें (Burp/mitmproxy) और देखें कि SSID/password किसी backend/analytics को जा रहा है या नहीं।" },
          { en: "Inspect local storage (shared prefs, plist, DB) for the credential persisted on device, and confirm the feature genuinely does not need it.", simple: "Check local storage for the saved WiFi password, and confirm the feature does not need it.", hi: "local storage (shared prefs/plist/DB) में persisted credential देखें, और पक्का करें कि feature को इसकी सच में ज़रूरत नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs evidence of collection without a functional need: the decompiled code or captured request/stored artifact showing the SSID and password being gathered, transmitted, or persisted, plus a note that the feature does not require it. Use your own device and your own network credential. If the app legitimately needs the WiFi credential (e.g. provisioning an IoT device) it is not over-collection and will be N/A.",
      simple: "Show the WiFi name and password being collected, sent, or stored with no real need — from decompiled code, a captured request, or local storage — using your own device and network. If the app genuinely needs it (like setting up a smart device), it is not a bug.",
      hi: "Triage को बिना functional need के collection का सबूत चाहिए: decompiled code या captured request/stored artifact जो SSID+password gather/transmit/persist होता दिखाए, साथ में note कि feature को इसकी ज़रूरत नहीं। अपना device और अपना network credential इस्तेमाल करें। अगर app को WiFi credential की जायज़ ज़रूरत है (जैसे IoT provisioning) तो यह over-collection नहीं और N/A होगा।",
    },
  },

  "Sensitive Data Exposure › Disclosure of Secrets › For Publicly Accessible Asset": {
    what: {
      en: "A live, working secret for an in-scope, publicly reachable asset is exposed — an API key, cloud credential, DB connection string, private signing key, or service token found in a JS bundle, source map, public repo, response body, or config. Because the secret is valid and the asset is internet-facing, it grants direct access to systems or data, which is why it tops the band. The value is in the secret being genuinely usable, not merely present.",
      simple: "A real, working secret (API key, cloud login, DB string, signing key) for a public, in-scope system is exposed in JS, source maps, a public repo, or a response. Since it works and the system is online, it gives direct access. That is why it is top severity — but only if the key actually works.",
      hi: "किसी in-scope, publicly reachable asset का live, काम करने वाला secret expose होता है — API key, cloud credential, DB connection string, private signing key या service token — जो JS bundle, source map, public repo, response body या config में मिले। secret valid और asset internet-facing होने से यह systems/data तक direct access देता है, इसलिए यह top band में है। असली value secret के सच में usable होने में है, सिर्फ़ मौजूद होने में नहीं।",
    },
    find: [
      {
        title: { en: "Harvest and verify live secrets", simple: "Find and test working secrets", hi: "live secrets खोजें और verify करें" },
        steps: [
          { en: "Pull JS bundles, source maps, and any public repos/CI artifacts; grep with TruffleHog/gitleaks/SecretFinder for keys, tokens, and connection strings.", simple: "Collect JS, source maps, and public repos, then scan them for keys and tokens.", hi: "JS bundles, source maps और public repos/CI artifacts लें; TruffleHog/gitleaks/SecretFinder से keys, tokens, connection strings grep करें।" },
          { en: "For each candidate, make ONE minimal authorized call to confirm it is live (e.g. a provider's read-only identity/whoami endpoint) — just enough to prove validity.", simple: "For each key, make one small safe call to prove it still works.", hi: "हर candidate के लिए एक minimal authorized call करें (जैसे provider का read-only whoami) ताकि यह live है साबित हो।" },
          { en: "Record where it was found and the proof of validity; never pivot deeper into data or make changes.", simple: "Note where you found it and the proof it works; do not go further into data.", hi: "कहाँ मिला और validity का proof record करें; data में गहरे न जाएँ और कुछ बदलें नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the exact location of the secret and proof it is currently valid for an in-scope public asset (a single benign authorized call, redacting the full secret in the report). Secrets that are expired, revoked, placeholder/sample, or for an out-of-scope/third-party service drop the severity sharply or make it N/A — see the siblings. Do not exfiltrate data or escalate beyond the validity check.",
      simple: "Show where the secret is and prove it still works on an in-scope public system with one safe call (hide the full key in the report). Expired, fake, or out-of-scope keys are much lower or N/A. Do not pull data with it.",
      hi: "Triage को secret का exact location और यह proof चाहिए कि वह किसी in-scope public asset के लिए अभी valid है (एक benign authorized call, report में secret redact करें)। expired, revoked, placeholder/sample, या out-of-scope/third-party secret severity गिरा देते हैं या N/A — siblings देखें। data exfiltrate न करें, validity check से आगे न बढ़ें।",
    },
    escalate: {
      en: "A valid secret for a non-public/internal asset is the 'For Internal Asset' sibling (P3); placeholder/sample keys, non-corporate-user secrets, or JWT-embedded secrets are the P5 siblings; PII reached through the secret is scored under 'PII Leakage/Exposure'.",
      simple: "A working key for an internal (non-public) system is the P3 sibling; fake or sample keys are P5; if it leads to PII, score it under PII Leakage.",
      hi: "non-public/internal asset का valid secret 'For Internal Asset' sibling (P3) है; placeholder/sample या non-corporate-user secrets, या JWT में embedded secrets P5 siblings हैं; secret से मिली PII 'PII Leakage/Exposure' के तहत score होती है।",
    },
  },

  "Sensitive Data Exposure › Weak Password Reset Implementation › Token Leakage via Host Header Poisoning": {
    what: {
      en: "The password-reset email builds its reset link from an attacker-influenceable Host (or X-Forwarded-Host) header instead of a fixed server-side base URL. By triggering a reset for a victim and poisoning that header, the link in the victim's email points at the attacker's domain; when the victim clicks it, the valid reset token is sent to the attacker, enabling account takeover. The high band reflects full ATO with only victim interaction (clicking their own reset email) required.",
      simple: "The reset email makes its link from the Host header the attacker can set, not a fixed URL. The attacker requests a reset for the victim and poisons the header, so the victim's email link points to the attacker's site. When the victim clicks, the reset token goes to the attacker — account takeover.",
      hi: "Password-reset email अपना reset link fixed server-side base URL की जगह attacker-influenceable Host (या X-Forwarded-Host) header से बनाता है। victim के लिए reset trigger करके वह header poison करने पर victim की email का link attacker के domain पर जाता है; victim के click करते ही valid reset token attacker को चला जाता है — account takeover। high band इसलिए कि सिर्फ़ victim के अपने reset email पर click से पूरा ATO हो जाता है।",
    },
    find: [
      {
        title: { en: "Poison the reset link host", simple: "Change the Host in the reset request", hi: "reset request का Host poison करें" },
        steps: [
          { en: "Capture the forgot-password POST for your own test account and resend it with a changed Host / X-Forwarded-Host / absolute-URI pointing at a domain you control (or a collaborator/OOB host).", simple: "Grab the forgot-password request and resend it with the Host set to your own domain.", hi: "अपने test account का forgot-password POST capture करें और Host / X-Forwarded-Host / absolute-URI को अपने domain (या collaborator/OOB host) पर बदलकर दोबारा भेजें।" },
          { en: "Open the resulting reset email and check whether the reset link's host is the poisoned value.", simple: "Open the reset email and see if the link uses your domain.", hi: "आई reset email खोलें और देखें reset link का host poisoned value है या नहीं।" },
          { en: "If it is, confirm the token reaches your controlled host (OOB log) when the link is visited, without touching any real victim.", simple: "If yes, confirm the token lands on your server when the link is opened — only with your own accounts.", hi: "अगर है, तो link visit करने पर token आपके controlled host (OOB log) पर पहुँचता है confirm करें — किसी real victim को छुए बिना।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the modified request, the resulting email showing the attacker-controlled host in the reset link, and evidence the token is delivered off-site (OOB callback) — all with your own test accounts. If the link host is hard-coded server-side, or the header only changes a display field and not the actual token link, it is not exploitable. A reset link merely sent over HTTP (not host-poisoned) is the lower P4 sibling.",
      simple: "Show the changed request, the email with your domain in the link, and proof the token reaches your server — using your own accounts. If the link host is fixed on the server, there is no bug. A plain HTTP reset link (not host-poisoned) is the lower P4 sibling.",
      hi: "Triage को modified request, reset link में attacker-controlled host दिखाती email, और token off-site (OOB callback) पहुँचने का सबूत चाहिए — सब अपने test accounts से। अगर link host server-side hard-coded है, या header सिर्फ़ display बदलता है actual token link नहीं, तो exploit नहीं। सिर्फ़ HTTP पर भेजा reset link (host-poison नहीं) निचला P4 sibling है।",
    },
    escalate: {
      en: "If the reset link/token is merely transmitted over plaintext HTTP without host poisoning, that is the sibling 'Password Reset Token Sent Over HTTP' (P4), a lower band.",
      simple: "A reset token just sent over HTTP (no host trick) is the lower 'Sent Over HTTP' sibling (P4).",
      hi: "अगर reset link/token सिर्फ़ plaintext HTTP पर भेजा जाए बिना host poisoning, तो वह sibling 'Password Reset Token Sent Over HTTP' (P4) है, निचला band।",
    },
    references: [
      { label: "PortSwigger: Host header attacks", url: "https://portswigger.net/web-security/host-header" },
    ],
  },

  "Sensitive Data Exposure › EXIF Geolocation Data Not Stripped From Uploaded Images › Manual User Enumeration": {
    what: {
      en: "The app serves user-uploaded images with their original EXIF metadata intact, including GPS coordinates, so anyone who downloads a photo can read where it was taken. 'Manual' means there is no bulk/enumerable pattern — an attacker must pick a target and fetch their image(s) by hand, one user at a time. That limited scalability is exactly what keeps it at the moderate band versus the automatable sibling.",
      simple: "The app keeps the GPS data inside uploaded photos, so downloading someone's picture reveals where it was taken. 'Manual' means you can only do it one chosen user at a time, not in bulk. That slowness keeps it at medium severity.",
      hi: "App user-uploaded images को उनके original EXIF metadata (GPS coordinates सहित) के साथ serve करता है, तो photo download करने वाला पढ़ सकता है वह कहाँ ली गई। 'Manual' मतलब कोई bulk/enumerable pattern नहीं — attacker को एक-एक करके target चुनकर उसकी image लेनी पड़ती है। यही सीमित scalability इसे automatable sibling के मुक़ाबले moderate band पर रखती है।",
    },
    find: [
      {
        title: { en: "Check served images for GPS EXIF", simple: "Look for GPS data in served images", hi: "serve की गई images में GPS EXIF देखें" },
        steps: [
          { en: "Upload a photo that contains GPS EXIF from your own test account, then download the served copy from the app's CDN/URL.", simple: "Upload a photo that has GPS data, then download it back from the app.", hi: "अपने test account से GPS EXIF वाली photo upload करें, फिर app के CDN/URL से served copy download करें।" },
          { en: "Run exiftool on the downloaded file and check whether GPSLatitude/GPSLongitude survived, meaning the server does not strip metadata.", simple: "Run exiftool on it and see if the GPS coordinates are still there.", hi: "downloaded file पर exiftool चलाएं और देखें GPSLatitude/GPSLongitude बचे हैं या नहीं — यानी server metadata strip नहीं करता।" },
          { en: "Show that another user's image can be fetched and its location read manually, without a predictable bulk pattern.", simple: "Show you can fetch another test user's image and read its location by hand.", hi: "दिखाएं कि किसी दूसरे test user की image लेकर उसका location manually पढ़ा जा सकता है, बिना predictable bulk pattern के।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the served image (from your own uploads/test users) with intact GPS EXIF confirmed by exiftool, plus a note that retrieval is manual/one-at-a-time. If the app already strips EXIF, or the images are not tied to identifiable users, it is N/A. If image URLs are sequential/guessable so locations can be harvested at scale, it becomes the higher 'Automatic User Enumeration' sibling.",
      simple: "Show a served image (your own test data) that still has GPS, proven with exiftool, and note you can only do it one user at a time. If EXIF is already stripped or images are not tied to users, it is N/A. If URLs are guessable for bulk harvesting, it is the higher Automatic sibling.",
      hi: "Triage को served image (अपने uploads/test users से) चाहिए जिसका GPS EXIF exiftool से confirmed हो, साथ में note कि retrieval manual/one-at-a-time है। अगर app पहले से EXIF strip करता है, या images किसी identifiable user से जुड़ी नहीं, तो N/A। अगर image URLs sequential/guessable हों ताकि locations scale पर harvest हों, तो यह ऊँचा 'Automatic User Enumeration' sibling बनता है।",
    },
    escalate: {
      en: "If the image URLs are enumerable (sequential IDs, predictable paths) so many users' locations can be scraped automatically, it moves to 'Automatic User Enumeration' (P3).",
      simple: "If image links are guessable so you can scrape many users' locations automatically, it becomes the Automatic sibling (P3).",
      hi: "अगर image URLs enumerable हों (sequential IDs, predictable paths) ताकि कई users के locations automatically scrape हों, तो यह 'Automatic User Enumeration' (P3) बन जाता है।",
    },
  },

  "Sensitive Data Exposure › Token Leakage via Referer › Over HTTP": {
    what: {
      en: "A page that holds a sensitive token in its URL loads a resource or link over plaintext HTTP, so the browser's Referer header carries that full URL — token included — in cleartext to the HTTP endpoint and across the network. A passive network attacker or the receiving HTTP host then obtains the token. The scheme downgrade (HTTPS page → HTTP request) is what makes this leak network-observable; it is the distinguishing factor from the third-party-referer siblings.",
      simple: "A page with a secret token in its URL loads something over plain HTTP, so the browser sends the whole URL (with the token) in the Referer header in cleartext. Anyone watching the network, or the HTTP server, gets the token. The HTTPS-to-HTTP downgrade is what exposes it.",
      hi: "कोई page जिसके URL में sensitive token है, कोई resource/link plaintext HTTP पर load करता है, तो browser का Referer header वह पूरा URL — token सहित — cleartext में HTTP endpoint और network पर भेज देता है। passive network attacker या receiving HTTP host token पा लेता है। scheme downgrade (HTTPS page → HTTP request) ही इस leak को network-observable बनाता है; यही इसे third-party-referer siblings से अलग करता है।",
    },
    find: [
      {
        title: { en: "Find a token-in-URL page making HTTP sub-requests", simple: "Find a token page that calls plain HTTP", hi: "token-in-URL page जो HTTP sub-request करे" },
        steps: [
          { en: "Locate pages that carry a sensitive token in the URL (query/path) and, via DevTools or a proxy, list their outbound requests and link targets.", simple: "Find pages with a token in the URL and list what they load.", hi: "ऐसे pages ढूंढें जिनके URL में sensitive token हो, फिर DevTools/proxy से उनके outbound requests और links देखें।" },
          { en: "Identify any request or clickable link whose scheme is http:// (image, script, analytics, external link).", simple: "Spot any request or link that uses http:// not https://.", hi: "कोई request या clickable link खोजें जिसका scheme http:// हो (image/script/analytics/external link)।" },
          { en: "Capture the Referer header actually sent on that HTTP request and confirm it contains the full token-bearing URL.", simple: "Capture the Referer sent on that HTTP request and check it includes the token.", hi: "उस HTTP request पर actually भेजा गया Referer header capture करें और confirm करें उसमें पूरा token-bearing URL है।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the captured HTTP request showing the Referer header leaking the full token URL over plaintext, on your own session. If the page sets Referrer-Policy (e.g. no-referrer / strict-origin), or the token is not actually sensitive, or every request stays HTTPS, it does not leak and is N/A. Leakage to a trusted/untrusted HTTPS third party (not plaintext) is the referer-third-party sibling; a reset-token specifically is the 'Password Reset Token' sibling.",
      simple: "Show the captured HTTP request where the Referer carries the full token URL in cleartext, on your own account. If a Referrer-Policy blocks it, the token is not sensitive, or everything is HTTPS, it is N/A. Leaking to an HTTPS third party is a different sibling.",
      hi: "Triage को captured HTTP request चाहिए जो अपने session पर Referer header में पूरा token URL plaintext में leak दिखाए। अगर page Referrer-Policy (no-referrer/strict-origin) सेट करता है, या token sensitive नहीं, या हर request HTTPS रहे, तो leak नहीं और N/A। trusted/untrusted HTTPS third party को leak referer-third-party sibling है; reset-token खास तौर पर 'Password Reset Token' sibling है।",
    },
    escalate: {
      en: "Leakage to an HTTPS third party is scored as 'Trusted 3rd Party' (P5) or 'Untrusted 3rd Party' (P4); if the leaked token is a password-reset token, use the 'Password Reset Token' sibling (P5).",
      simple: "Leaking to an HTTPS third party is the Trusted (P5) or Untrusted (P4) sibling; a reset token is the Password Reset Token sibling.",
      hi: "HTTPS third party को leak 'Trusted 3rd Party' (P5) या 'Untrusted 3rd Party' (P4) है; leaked token अगर password-reset token हो तो 'Password Reset Token' sibling (P5) इस्तेमाल करें।",
    },
    references: [
      { label: "PortSwigger: Referer-based access control & leakage", url: "https://portswigger.net/web-security/information-disclosure" },
    ],
  },

  "Sensitive Data Exposure › Weak Password Reset Implementation › Password Reset Token Sent Over HTTP": {
    what: {
      en: "The password-reset link or token is delivered or transported over plaintext HTTP — the reset email links to http://, or the reset flow posts/redirects the token over HTTP at some step — so the token is observable to a network-positioned attacker in transit. Unlike host-header poisoning, the link host is correct; the weakness is purely the missing TLS, which caps the realism (needs a network position) and keeps it at the moderate band.",
      simple: "The reset link or token travels over plain HTTP at some point (email links to http://, or a step posts the token without TLS), so someone watching the network can grab it. The link goes to the right place — the only problem is no encryption, which needs a network position, so it is medium.",
      hi: "Password-reset link/token किसी step पर plaintext HTTP पर deliver/transport होता है — reset email http:// पर link करती है, या flow token को HTTP पर post/redirect करता है — तो transit में network-positioned attacker उसे देख सकता है। host-header poisoning से उलट, link host सही है; कमज़ोरी सिर्फ़ missing TLS है, जिसके लिए network position चाहिए, इसलिए moderate band।",
    },
    find: [
      {
        title: { en: "Inspect the reset flow for plaintext transport", simple: "Check the reset flow for HTTP steps", hi: "reset flow में plaintext transport देखें" },
        steps: [
          { en: "Trigger a password reset for your own test account and open the email; check whether the reset link scheme is http:// rather than https://.", simple: "Reset your own account and check if the email link starts with http://.", hi: "अपने test account का reset trigger करें और email खोलें; देखें reset link scheme http:// है या https://।" },
          { en: "Walk the full reset flow through a proxy and watch for any request carrying the token that is sent over HTTP or redirected via an http:// hop.", simple: "Step through the reset flow in a proxy and watch for the token on any HTTP request.", hi: "पूरा reset flow proxy से चलाएं और देखें token ले जाने वाली कोई request HTTP पर या http:// hop से तो नहीं जाती।" },
          { en: "Confirm the token is readable in cleartext at that hop (no TLS), using only your own account.", simple: "Confirm the token is readable in cleartext there, using your own account.", hi: "confirm करें कि उस hop पर token cleartext में readable है (no TLS), सिर्फ़ अपने account से।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs evidence the reset token traverses plaintext HTTP — the http:// email link or the captured HTTP request/redirect carrying the token — on your own account. If the whole flow is HTTPS and HSTS is enforced, there is nothing to intercept and it is N/A. If instead the link host itself is attacker-controlled, that is the higher host-header-poisoning sibling.",
      simple: "Show the token going over plain HTTP — the http:// email link or a captured HTTP request — on your own account. If it is all HTTPS with HSTS, it is N/A. If the link host is attacker-controlled, that is the higher host-poisoning sibling.",
      hi: "Triage को सबूत चाहिए कि reset token plaintext HTTP पार करता है — http:// email link या token ले जाती captured HTTP request/redirect — अपने account पर। अगर पूरा flow HTTPS और HSTS enforced है, तो intercept करने को कुछ नहीं और N/A। अगर link host खुद attacker-controlled हो, तो वह ऊँचा host-header-poisoning sibling है।",
    },
    escalate: {
      en: "If the reset link's host is attacker-influenceable (not just unencrypted), it escalates to 'Token Leakage via Host Header Poisoning' (P2) — a far higher band because it needs no network position.",
      simple: "If the attacker can control the link's host (not just the lack of TLS), it becomes the host-poisoning sibling (P2), which is much higher.",
      hi: "अगर reset link का host attacker-influenceable हो (सिर्फ़ unencrypted नहीं), तो यह 'Token Leakage via Host Header Poisoning' (P2) बन जाता है — बहुत ऊँचा band क्योंकि network position की ज़रूरत नहीं।",
    },
  },

  "Sensitive Data Exposure › Disclosure of Secrets › Pay-Per-Use Abuse": {
    what: {
      en: "An exposed key or token belongs to a metered, pay-per-use service (maps, SMS/email sending, translation, an AI API, cloud functions) with no referrer/domain/quota restriction, so an attacker can spend the program's money by calling the paid API with the key. The harm is financial (billing abuse), not data compromise — the secret unlocks spending, not the company's systems — which places it at the moderate band.",
      simple: "An exposed key is for a paid, per-use service (maps, SMS, an AI API) with no limits, so an attacker can run up the company's bill by using the key. The damage is money, not stolen data, so it is medium.",
      hi: "Expose हुआ key/token किसी metered, pay-per-use service का है (maps, SMS/email, translation, AI API, cloud functions) बिना referrer/domain/quota restriction के, तो attacker key से paid API call करके program का पैसा खर्च करा सकता है। नुकसान financial (billing abuse) है, data compromise नहीं — secret spending unlock करता है, company के systems नहीं — इसलिए moderate band।",
    },
    find: [
      {
        title: { en: "Identify an unrestricted billable key", simple: "Find a paid-service key with no limits", hi: "बिना restriction वाला billable key ढूंढें" },
        steps: [
          { en: "Extract keys from JS bundles / HTML and identify which belong to billable third-party services (e.g. a maps or messaging provider).", simple: "Pull keys from the site's JS/HTML and spot ones for paid services.", hi: "JS bundles/HTML से keys निकालें और पहचानें कौन से billable third-party services (maps/messaging) के हैं।" },
          { en: "Check the provider's dashboard semantics for whether the key is restricted by HTTP referrer, domain, IP, or quota.", simple: "Check if the key is locked to a domain, referrer, IP, or quota.", hi: "देखें key provider के हिसाब से HTTP referrer, domain, IP या quota से restricted है या नहीं।" },
          { en: "Make ONE minimal billable call from an unauthorized origin to prove the key works off the owner's domain — do not loop or rack up cost.", simple: "Make one small paid call from an outside origin to prove it works — do not repeat.", hi: "unauthorized origin से एक minimal billable call करें ताकि साबित हो key owner के domain के बाहर चलता है — loop/ज़्यादा cost न करें।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the key's location and a single demonstration that it is callable from an origin other than the owner's (proving no referrer/domain restriction), so an attacker could incur cost. Make exactly one minimal call — do not actually run up a bill. If the key is properly restricted (referrer/domain/quota locked) or is a public client key meant to be exposed, it is N/A. A key that reaches company data instead is the far higher 'For Publicly Accessible Asset' sibling.",
      simple: "Show where the key is and make one small call from an outside origin to prove it is not domain-locked. Do not actually run up costs. If the key is domain/quota-locked or meant to be public, it is N/A. A key that reaches company data is the much higher public-asset sibling.",
      hi: "Triage को key का location और एक demonstration चाहिए कि वह owner के अलावा किसी origin से callable है (यानी कोई referrer/domain restriction नहीं), ताकि attacker cost करा सके। बस एक minimal call करें — सच में bill न बढ़ाएं। अगर key सही से restricted (referrer/domain/quota) है या public client key है जो expose होना ही था, तो N/A। company data तक पहुँचने वाला key कहीं ऊँचा 'For Publicly Accessible Asset' sibling है।",
    },
    escalate: {
      en: "If the same class of secret instead grants access to the program's own systems or data, score it under 'For Publicly Accessible Asset' (P1) or 'For Internal Asset' (P3), not here.",
      simple: "If the secret actually opens the company's own systems or data, use the P1/P3 siblings, not this one.",
      hi: "अगर वही secret program के अपने systems/data तक access दे, तो यहाँ नहीं — 'For Publicly Accessible Asset' (P1) या 'For Internal Asset' (P3) के तहत score करें।",
    },
  },

  "Sensitive Data Exposure › Via localStorage/sessionStorage › Sensitive Token": {
    what: {
      en: "The app stores a security-sensitive token — a session/auth token, JWT, API key, or reset token — in localStorage or sessionStorage, which is readable by any JavaScript on the origin and carries no HttpOnly protection. Any XSS, or a malicious third-party script, can read and exfiltrate it, turning a script-execution bug into session theft. It sits at the moderate band because the exposure is conditional on another JS-execution vector, not a standalone compromise.",
      simple: "The app keeps a sensitive token (session, JWT, API key, reset token) in localStorage/sessionStorage, which any JavaScript on the site can read — there is no HttpOnly like cookies have. Any XSS or bad third-party script can steal it. It is medium because it needs another script bug to be used.",
      hi: "App कोई security-sensitive token — session/auth token, JWT, API key या reset token — localStorage/sessionStorage में रखता है, जो origin के किसी भी JavaScript से readable है और HttpOnly protection नहीं रखता। कोई भी XSS या malicious third-party script इसे पढ़कर exfiltrate कर सकता है, script-execution bug को session theft बना देता है। moderate band इसलिए कि exposure किसी और JS-execution vector पर निर्भर है, अकेला compromise नहीं।",
    },
    find: [
      {
        title: { en: "Audit web storage for sensitive tokens", simple: "Check web storage for sensitive tokens", hi: "web storage में sensitive tokens देखें" },
        steps: [
          { en: "After login on your own test account, open DevTools → Application → Local/Session Storage and inspect every key's value.", simple: "Log in with your test account and look at every localStorage/sessionStorage value.", hi: "अपने test account से login के बाद DevTools → Application → Local/Session Storage में हर key की value देखें।" },
          { en: "Identify values that are auth/session tokens, JWTs, API keys, or reset tokens (decode JWTs to confirm they are live session credentials).", simple: "Find values that are session tokens, JWTs, API keys, or reset tokens.", hi: "ऐसी values पहचानें जो auth/session tokens, JWTs, API keys या reset tokens हों (JWT decode करके confirm करें live session credential है)।" },
          { en: "Demonstrate readability from script context, e.g. that `localStorage.getItem(...)` returns the token for any JS on the origin.", simple: "Show that any script on the site can read the token via localStorage.getItem.", hi: "script context से readability दिखाएं, जैसे `localStorage.getItem(...)` origin के किसी भी JS के लिए token लौटाता है।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the storage key/value showing a genuinely sensitive, live token (redact it) and the fact it is script-readable with no HttpOnly equivalent. On its own this is usually moderate/low; it is most persuasive when paired with a demonstrated XSS that exfiltrates it. If the stored value is not actually a sensitive credential, it drops to the 'Non-Sensitive Token' sibling (P5).",
      simple: "Show the storage entry holding a real, live token (redacted) that any script can read. Alone it is usually low/medium; it is strongest when you also show an XSS stealing it. If the value is not really sensitive, it is the Non-Sensitive sibling (P5).",
      hi: "Triage को storage key/value चाहिए जो genuinely sensitive, live token दिखाए (redact करें) और यह कि वह script-readable है, HttpOnly जैसा कुछ नहीं। अकेले यह आम तौर पर moderate/low है; सबसे मज़बूत तब जब साथ में demonstrated XSS इसे exfiltrate करे। अगर stored value असल में sensitive credential नहीं, तो यह 'Non-Sensitive Token' sibling (P5) बन जाता है।",
    },
    escalate: {
      en: "Chain with any XSS on the origin to turn script-readability into real token exfiltration / account takeover; if the token is not security-sensitive, it is the lower 'Non-Sensitive Token' (P5) sibling.",
      simple: "Combine with an XSS to actually steal the token for account takeover; a non-sensitive value is the lower P5 sibling.",
      hi: "origin पर किसी XSS के साथ chain करके script-readability को असली token exfiltration/account takeover बनाएं; token security-sensitive न हो तो निचला 'Non-Sensitive Token' (P5) sibling।",
    },
    references: [
      { label: "OWASP: HTML5 Security / Web Storage", url: "https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html" },
    ],
  },

  "Sensitive Data Exposure › Sensitive Token in URL › User Facing": {
    what: {
      en: "A sensitive token (session, auth, reset, invite, or API token) appears in a URL the user sees and shares — the address bar, a copyable link, an email/share link. Because it is user-facing, the token leaks through shoulder-surfing, copy-paste into chats/tickets, bookmarks, and browser history, far beyond any single request. The user-visible placement is what separates it from the background/redirect siblings and gives it the moderate band.",
      simple: "A sensitive token sits in a URL the user actually sees and shares — the address bar or a copyable link. So it leaks through screenshots, copy-paste, bookmarks, and history. Being visible to the user is what makes it worse than the background siblings.",
      hi: "कोई sensitive token (session/auth/reset/invite/API token) ऐसे URL में दिखता है जो user देखता और share करता है — address bar, copyable link, email/share link। user-facing होने से token shoulder-surfing, chat/tickets में copy-paste, bookmarks और browser history से leak होता है, किसी एक request से कहीं ज़्यादा। user-visible placement ही इसे background/redirect siblings से अलग कर moderate band देता है।",
    },
    find: [
      {
        title: { en: "Spot sensitive tokens in visible URLs", simple: "Find tokens in URLs the user sees", hi: "दिखने वाले URLs में tokens खोजें" },
        steps: [
          { en: "Walk key flows (login, share, invite, reset) on your own account and note any URL in the address bar or a user-copyable link that contains a token.", simple: "Go through login/share/invite/reset and watch for tokens in the visible URL.", hi: "अपने account पर login/share/invite/reset flows चलाएं और address bar या copyable link में token वाले URL note करें।" },
          { en: "Confirm the token is actually sensitive (grants access / authenticates) by using it from a clean session or browser.", simple: "Check the token really works by using it in a fresh browser.", hi: "confirm करें token सच में sensitive है (access/authenticate देता है) — clean session/browser से इस्तेमाल करके।" },
          { en: "Show it persists where users leak it: browser history, a shared/bookmarked link reused successfully.", simple: "Show it stays usable from history or a shared link.", hi: "दिखाएं यह वहाँ टिकता है जहाँ users leak करते हैं: browser history, reuse हुआ shared/bookmarked link।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the user-facing URL containing a token proven to be sensitive (it authenticates or authorizes when replayed in a clean session), on your own account. If the token is single-use and immediately invalidated, scoped harmlessly, or not actually sensitive, impact is minimal. A token that appears only in a background request or a redirect, not shown to the user, is the lower P5 sibling; a reset-specific token is the 'On Password Reset' sibling.",
      simple: "Show the visible URL with a token that still works when replayed in a clean browser, on your own account. If it is single-use and dies immediately or is not sensitive, impact is low. A token only in a background request/redirect is the lower P5 sibling.",
      hi: "Triage को user-facing URL चाहिए जिसमें sensitive साबित होने वाला token हो (clean session में replay करने पर authenticate/authorize करे), अपने account पर। अगर token single-use और तुरंत invalidate हो, harmless scoped हो, या sensitive न हो, तो impact न्यूनतम। सिर्फ़ background request/redirect में दिखने वाला token निचला P5 sibling है; reset-specific token 'On Password Reset' sibling।",
    },
    escalate: {
      en: "A token that appears only in a background request is 'In the Background' (P5); a reset token in the URL is 'On Password Reset' (P5) — both lower because they are not user-visible/shareable.",
      simple: "A token only in a background request is the 'In the Background' sibling (P5); a reset token is 'On Password Reset' (P5) — both lower.",
      hi: "सिर्फ़ background request में दिखने वाला token 'In the Background' (P5) है; URL में reset token 'On Password Reset' (P5) — दोनों निचले क्योंकि user-visible/shareable नहीं।",
    },
  },

  "Sensitive Data Exposure › Disclosure of Secrets › Data/Traffic Spam": {
    what: {
      en: "A 'secret' or endpoint is reported as disclosed, but it only enables sending spam/noise — e.g. a key for a bulk-send or notification channel whose misuse produces unsolicited traffic rather than access to data or systems. There is no confidentiality or integrity impact on the program; the nuisance is spam. This is why Bugcrowd classes it as informational — it is the lowest-value outcome among the Disclosure-of-Secrets siblings.",
      simple: "A 'secret' is exposed, but all it lets you do is send spam or noise — not read data or get into systems. There is no real data impact, just nuisance traffic, so it is informational.",
      hi: "कोई 'secret'/endpoint disclosed बताया जाता है, पर उससे सिर्फ़ spam/noise भेजा जा सकता है — जैसे bulk-send/notification channel का key जिसका misuse unsolicited traffic देता है, data/systems access नहीं। program पर कोई confidentiality/integrity impact नहीं; बस spam का nuisance। इसीलिए Bugcrowd इसे informational रखता है — Disclosure-of-Secrets siblings में सबसे कम value।",
    },
    find: [
      {
        title: { en: "Determine what the secret actually unlocks", simple: "Check what the secret can really do", hi: "secret असल में क्या unlock करता है देखें" },
        steps: [
          { en: "Locate the disclosed key/endpoint and map its real capability against the provider's docs.", simple: "Find the key and check what it is actually allowed to do.", hi: "disclosed key/endpoint ढूंढें और provider docs से उसकी असली capability map करें।" },
          { en: "Confirm its only effect is generating outbound spam/noise, with no read access to data or control of systems.", simple: "Confirm it can only send spam, not read data or control anything.", hi: "confirm करें इसका एकमात्र असर outbound spam/noise है, data read या systems control नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Document what the secret can do and that the only reachable impact is spam/traffic generation. This is typically informational (P5) and not rewarded alone. If the same secret in fact grants data access or reaches internal/public assets, it is a higher sibling ('For Publicly Accessible Asset' P1 / 'For Internal Asset' P3) and should be reported as such.",
      simple: "Show that the secret only lets you spam. This is usually informational and not paid alone. If it actually reads data or reaches systems, report it as the higher P1/P3 sibling instead.",
      hi: "दिखाएं secret सिर्फ़ spam/traffic generation कर सकता है। यह आम तौर पर informational (P5) और अकेले unrewarded है। अगर वही secret data access दे या internal/public assets तक पहुँचे, तो ऊँचा sibling (P1/P3) है और वैसे ही report करें।",
    },
  },

  "Sensitive Data Exposure › Visible Detailed Error/Debug Page › Descriptive Stack Trace": {
    what: {
      en: "An error condition returns a full application stack trace to the client — exception class, method names, line numbers, and often framework/library versions and snippets of code or SQL. It leaks internal structure that aids an attacker in fingerprinting the stack and crafting further attacks, but it is not itself a direct compromise. On its own it is informational; its value is as reconnaissance feeding a more serious bug.",
      simple: "An error shows the user a full stack trace — class names, line numbers, framework versions, sometimes code or SQL. It reveals how the app is built, which helps an attacker, but it is not a direct hack. Alone it is informational.",
      hi: "कोई error client को पूरा application stack trace लौटाता है — exception class, method names, line numbers, अक्सर framework/library versions और code/SQL के snippets। यह internal structure leak करता है जो attacker को stack fingerprint और आगे के attacks में मदद करता है, पर खुद direct compromise नहीं। अकेले informational; value reconnaissance के तौर पर जो बड़े bug को feed करे।",
    },
    find: [
      {
        title: { en: "Force verbose error responses", simple: "Trigger detailed error pages", hi: "verbose error responses trigger करें" },
        steps: [
          { en: "Send malformed input, wrong types, unexpected methods, or broken parameters to endpoints and watch for responses containing a stack trace.", simple: "Send bad input or wrong methods and watch for a stack trace in the response.", hi: "endpoints को malformed input, गलत types, unexpected methods भेजें और stack trace वाली response देखें।" },
          { en: "Confirm the trace exposes internal detail (classes, paths, versions, code/SQL) rather than a generic error message.", simple: "Confirm the trace shows internal details, not a generic message.", hi: "confirm करें trace internal detail (classes/paths/versions/code/SQL) दिखाता है, generic error नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Provide the request and the response showing the detailed stack trace. This is informational (P5) and usually not rewarded by itself. It gains value when the leaked detail (a version, an internal path, a SQL fragment) directly enables another finding — chain it rather than reporting in isolation. If the trace also reveals full server config it is the higher 'Detailed Server Configuration' sibling (P4).",
      simple: "Show the request and the stack-trace response. It is informational and usually not paid alone — it is useful when it feeds another bug. If it leaks full server config, that is the higher P4 sibling.",
      hi: "request और detailed stack trace वाली response दें। यह informational (P5) और आम तौर पर अकेले unrewarded है। value तब जब leaked detail (version/internal path/SQL fragment) किसी और finding को enable करे — isolation में नहीं, chain करें। अगर trace full server config भी दिखाए तो ऊँचा 'Detailed Server Configuration' sibling (P4)।",
    },
    escalate: {
      en: "If the page discloses full server configuration (not just a trace) it is 'Detailed Server Configuration' (P4); a bare path with no trace is the 'Full Path Disclosure' sibling (P5).",
      simple: "Full server config is the P4 sibling; just a file path with no trace is the Full Path Disclosure sibling (P5).",
      hi: "अगर page full server configuration दिखाए (सिर्फ़ trace नहीं) तो 'Detailed Server Configuration' (P4); बिना trace सिर्फ़ path 'Full Path Disclosure' sibling (P5)।",
    },
  },

  "Sensitive Data Exposure › Disclosure of Known Public Information": {
    what: {
      en: "Information reported as 'disclosed' is already public or intentionally published — company address, published documentation, open-source code the org released, data in public registries, or details the vendor deliberately exposes. There is no confidentiality boundary being crossed, so there is no vulnerability; Bugcrowd lists it precisely to mark these submissions as non-issues. It exists in the taxonomy as the canonical N/A outcome for 'disclosure' reports.",
      simple: "The 'leaked' info is already public — company address, published docs, open-source code, public registry data. No secret boundary is crossed, so it is not a bug. Bugcrowd lists it just to mark these reports as not-an-issue.",
      hi: "'disclosed' बताई गई जानकारी पहले से public या जानबूझकर publish की हुई है — company address, published docs, org का खुद release किया open-source code, public registries का data। कोई confidentiality boundary cross नहीं हो रही, तो vulnerability नहीं; Bugcrowd इसे इसलिए list करता है ताकि ऐसी submissions को non-issue मार्क किया जा सके। यह taxonomy में canonical N/A outcome है।",
    },
    find: [
      {
        title: { en: "Verify whether the data was already public", simple: "Check if the data is already public", hi: "check करें data पहले से public है या नहीं" },
        steps: [
          { en: "Before reporting any 'disclosure', confirm the data is not published by the org itself, in public registries, or in released docs/source.", simple: "Before reporting, confirm the data is not already published somewhere public.", hi: "किसी भी 'disclosure' से पहले confirm करें data org ने खुद, public registries, या released docs/source में publish तो नहीं किया।" },
          { en: "If it is already public, do not report it; if a genuine secret boundary is crossed, use the matching Disclosure-of-Secrets leaf instead.", simple: "If it is already public, skip it; if a real secret leaks, use the right leaf instead.", hi: "अगर पहले से public है तो report न करें; अगर सच में secret boundary cross हो तो उपयुक्त Disclosure-of-Secrets leaf इस्तेमाल करें।" },
        ],
      },
    ],
    proof: {
      en: "There is effectively nothing to prove as a vulnerability — this leaf marks reports where the 'disclosed' data is already public or intentionally shared, which triage will close as N/A (P5). Use it to self-triage: if you cannot show a real confidentiality boundary being crossed, the submission belongs here and is not rewarded.",
      simple: "There is nothing to prove — this marks reports where the data is already public, which triage closes as N/A. Use it to check yourself: no real secret crossed means no reward.",
      hi: "vulnerability के तौर पर साबित करने को कुछ नहीं — यह leaf उन reports को मार्क करता है जहाँ 'disclosed' data पहले से public/intentionally shared है, जिसे triage N/A (P5) कर देगा। self-triage में इस्तेमाल करें: अगर असली confidentiality boundary cross नहीं दिखा सकते, तो submission यहीं आता है और unrewarded है।",
    },
  },

  "Sensitive Data Exposure › Sensitive Data Hardcoded › File Paths": {
    what: {
      en: "Absolute filesystem paths are hardcoded and exposed in client-side code, responses, or configs — e.g. /home/<user>/app/… or C:\\\\inetpub\\\\… revealing usernames, directory layout, and sometimes framework roots. It is low-grade reconnaissance: it helps an attacker guess paths for LFI/traversal or understand the deployment, but discloses no credential or data by itself, so it is informational.",
      simple: "Full file paths are baked into client code or responses, like /home/user/app/… — showing usernames and folder layout. It only helps an attacker guess paths or understand the setup; no secret leaks, so it is informational.",
      hi: "Absolute filesystem paths client-side code, responses या configs में hardcoded/expose होते हैं — जैसे /home/<user>/app/… या C:\\\\inetpub\\\\… जो usernames, directory layout, कभी framework roots दिखाते हैं। यह low-grade reconnaissance है: LFI/traversal के लिए paths guess करने या deployment समझने में मदद करता है, पर खुद कोई credential/data disclose नहीं करता, इसलिए informational।",
    },
    find: [
      {
        title: { en: "Grep for absolute paths in exposed code", simple: "Search exposed code for file paths", hi: "expose code में absolute paths grep करें" },
        steps: [
          { en: "Download JS bundles, source maps, and config/response bodies and grep for path patterns (/home/, /var/www/, /Users/, C:\\\\, webroot strings).", simple: "Grab JS and configs and search for path patterns like /home/ or C:\\.", hi: "JS bundles, source maps, config/response लें और path patterns (/home/, /var/www/, /Users/, C:\\\\) grep करें।" },
          { en: "Confirm the path is a real server path (not a build placeholder) and note what it reveals (user, framework, webroot).", simple: "Confirm it is a real server path and note what it reveals.", hi: "confirm करें path असली server path है (build placeholder नहीं) और यह क्या reveal करता है note करें।" },
        ],
      },
    ],
    proof: {
      en: "Show the hardcoded absolute path and where it is exposed. It is informational (P5) and rarely rewarded alone; its worth is as input to a path-traversal/LFI attempt. If a path with no trace is returned by an error page instead, that is the 'Full Path Disclosure' leaf; OAuth secrets hardcoded are the higher-value sibling 'OAuth Secret'.",
      simple: "Show the hardcoded path and where it appears. It is informational and rarely paid alone — useful mainly to feed a traversal attempt. A hardcoded OAuth secret is the OAuth Secret sibling.",
      hi: "hardcoded absolute path और वह कहाँ expose है दिखाएं। यह informational (P5) और अकेले कम ही rewarded; value path-traversal/LFI के input के तौर पर। error page से बिना trace लौटा path 'Full Path Disclosure' leaf है; hardcoded OAuth secret ऊँची-value sibling 'OAuth Secret'।",
    },
  },

  "Sensitive Data Exposure › Visible Detailed Error/Debug Page › Full Path Disclosure": {
    what: {
      en: "An error or misbehaving endpoint returns an internal filesystem path — typically a single path in a warning/error (e.g. PHP 'failed to open stream' or a framework 404 printing the webroot) without a full stack trace. It discloses the server's directory layout and sometimes the username, which assists traversal/LFI guessing, but nothing more; it is informational on its own.",
      simple: "An error leaks one internal file path — like PHP 'failed to open stream' showing the webroot — but no full stack trace. It reveals the folder layout, which helps an attacker guess paths, but nothing else. Informational by itself.",
      hi: "कोई error/misbehaving endpoint internal filesystem path लौटाता है — आम तौर पर warning/error में एक path (जैसे PHP 'failed to open stream' या framework 404 जो webroot print करे) बिना full stack trace। यह server का directory layout और कभी username disclose करता है, जो traversal/LFI guessing में मदद करता है, पर उससे ज़्यादा कुछ नहीं; अकेले informational।",
    },
    find: [
      {
        title: { en: "Trigger a path-leaking error", simple: "Make an error that leaks a path", hi: "path leak करने वाला error trigger करें" },
        steps: [
          { en: "Send malformed array/null parameters, access a file endpoint with a missing resource, or break an include to provoke a path-bearing warning.", simple: "Send broken params or ask for a missing file to provoke a path in the error.", hi: "malformed array/null parameters भेजें, missing resource वाला file endpoint access करें, या include तोड़ें ताकि path वाली warning आए।" },
          { en: "Confirm the response contains an absolute server path but not a full stack trace (that would be the trace sibling).", simple: "Confirm the response shows a server path but not a full stack trace.", hi: "confirm करें response में absolute server path है पर full stack trace नहीं (वह trace sibling होगा)।" },
        ],
      },
    ],
    proof: {
      en: "Provide the request and the response containing the absolute path. It is informational (P5), rarely rewarded alone, and best used to support a traversal/LFI attempt. If the response additionally carries a full stack trace it is the 'Descriptive Stack Trace' sibling (P5); if it reveals full server configuration, the 'Detailed Server Configuration' sibling (P4).",
      simple: "Show the request and the response with the path. It is informational and rarely paid alone — useful to support a traversal attempt. A full stack trace or full config are different siblings.",
      hi: "request और absolute path वाली response दें। यह informational (P5), अकेले कम rewarded, और traversal/LFI attempt को support करने में बेहतर। response में full stack trace भी हो तो 'Descriptive Stack Trace' sibling (P5); full server config दिखे तो 'Detailed Server Configuration' sibling (P4)।",
    },
  },

  "Sensitive Data Exposure › GraphQL Introspection Enabled": {
    what: {
      en: "The GraphQL endpoint answers introspection queries (__schema / __type) in production, handing an attacker the complete schema — every type, field, query, mutation, and argument, including undocumented or internal ones. It does not grant access by itself, but it removes the guesswork, exposing hidden mutations and sensitive fields that become targets for IDOR, authorization, or injection testing. It is low on its own; its real value is as a map for deeper GraphQL attacks.",
      simple: "The GraphQL endpoint still answers introspection in production, giving an attacker the full schema — all types, queries, mutations, and hidden fields. It is not a hack by itself, but it reveals hidden operations to attack next. Low alone; useful as a map.",
      hi: "GraphQL endpoint production में introspection queries (__schema/__type) का जवाब देता है, attacker को पूरा schema दे देता है — हर type, field, query, mutation, argument, undocumented/internal सहित। यह खुद access नहीं देता, पर guesswork हटाकर hidden mutations और sensitive fields expose करता है जो IDOR/authorization/injection testing के targets बनते हैं। अकेले low; असली value deeper GraphQL attacks के map के तौर पर।",
    },
    find: [
      {
        title: { en: "Query introspection and map the schema", simple: "Run introspection on the endpoint", hi: "introspection query करके schema map करें" },
        steps: [
          { en: "Send a standard introspection query to the /graphql endpoint, or use graphw00f/InQL/Apollo sandbox to dump the schema.", simple: "Send an introspection query (or use InQL) to pull the full schema.", hi: "/graphql endpoint पर standard introspection query भेजें, या graphw00f/InQL/Apollo sandbox से schema dump करें।" },
          { en: "Confirm the full schema returns (not a disabled/blocked error) and note hidden mutations/fields worth testing for authz or IDOR.", simple: "Confirm the whole schema comes back and note hidden operations to test.", hi: "confirm करें पूरा schema लौटता है (disabled/blocked error नहीं) और authz/IDOR के लिए test-worthy hidden mutations/fields note करें।" },
        ],
      },
    ],
    proof: {
      en: "Show the introspection response returning the schema in a production environment. By itself this is informational (P5) and often not rewarded — many programs accept introspection being on. It becomes valuable when you use the schema to find and demonstrate a concrete authorization/IDOR/injection issue on a hidden operation; report that higher finding instead of the introspection alone.",
      simple: "Show introspection returning the schema in production. Alone it is informational and often not paid — many programs leave it on. It matters when the schema leads you to a real authz/IDOR/injection bug, which you report instead.",
      hi: "production में introspection response schema लौटाता दिखाएं। अकेले यह informational (P5) और अक्सर unrewarded — कई programs introspection on स्वीकारते हैं। value तब जब schema से किसी hidden operation पर concrete authorization/IDOR/injection issue ढूंढकर demonstrate करें; उस ऊँची finding को report करें, अकेले introspection को नहीं।",
    },
    escalate: {
      en: "Use the dumped schema to hunt IDOR via object IDs, broken authorization on hidden mutations, or injection in arguments — those are separately scored, higher findings.",
      simple: "Use the schema to find IDOR, broken authz on hidden mutations, or injection — those are higher, separate findings.",
      hi: "dumped schema से object IDs पर IDOR, hidden mutations पर broken authorization, या arguments में injection hunt करें — वे अलग, ऊँची findings हैं।",
    },
    references: [
      { label: "PortSwigger: GraphQL API vulnerabilities", url: "https://portswigger.net/web-security/graphql" },
    ],
  },

  "Sensitive Data Exposure › Sensitive Token in URL › In the Background": {
    what: {
      en: "A sensitive token travels in a URL only within background requests the user never sees — an XHR/fetch query string, an image or script src, a redirect hop — not in the address bar or a shareable link. Exposure is narrower than the user-facing case: it can still land in server/proxy logs, browser history, and the Referer of onward requests, but the user cannot casually copy/share it. That narrower reach is why it is informational rather than moderate.",
      simple: "A sensitive token is in a URL only inside background requests (an XHR, an image src, a redirect) that the user never sees or shares. It can still end up in logs, history, and Referer, but the user cannot copy it. That smaller reach keeps it informational.",
      hi: "कोई sensitive token सिर्फ़ background requests के URL में जाता है जो user कभी नहीं देखता — XHR/fetch query string, image/script src, redirect hop — address bar या shareable link में नहीं। exposure user-facing case से संकरा है: फिर भी server/proxy logs, browser history, onward requests के Referer में जा सकता है, पर user आसानी से copy/share नहीं कर सकता। यही संकरी reach इसे moderate की जगह informational रखती है।",
    },
    find: [
      {
        title: { en: "Trace tokens in background request URLs", simple: "Look for tokens in background requests", hi: "background request URLs में tokens trace करें" },
        steps: [
          { en: "Proxy the app and inspect XHR/fetch, image/script src, and redirect Location URLs for a token in the query string or path.", simple: "Proxy the app and check background request URLs for a token.", hi: "App proxy करें और XHR/fetch, image/script src, redirect Location URLs में query/path का token देखें।" },
          { en: "Confirm the token is sensitive and that it does not also appear in a user-visible URL (which would be the higher sibling).", simple: "Confirm the token is sensitive and not shown in a visible URL.", hi: "confirm करें token sensitive है और किसी user-visible URL में भी नहीं आता (वह ऊँचा sibling होगा)।" },
        ],
      },
    ],
    proof: {
      en: "Show the background request whose URL carries the sensitive token, on your own session, and note it is not user-visible. This is informational (P5) and usually not rewarded alone. If the same token also appears in a URL the user sees/shares, report the higher 'User Facing' sibling (P4); a reset token is 'On Password Reset'.",
      simple: "Show the background request URL with the token, on your own account, and note the user cannot see it. Informational and usually not paid alone. If it also shows in a visible URL, that is the higher User Facing sibling (P4).",
      hi: "अपने session पर वह background request दिखाएं जिसके URL में sensitive token है, और note करें यह user-visible नहीं। यह informational (P5) और आम तौर पर अकेले unrewarded। अगर वही token user-visible/shareable URL में भी आए तो ऊँचा 'User Facing' sibling (P4) report करें; reset token 'On Password Reset'।",
    },
  },

  "Sensitive Data Exposure › Disclosure of Secrets › Intentionally Public, Sample or Invalid": {
    what: {
      en: "The 'secret' found is not a real credential — it is a documented public/publishable key (e.g. a client-side analytics or maps key meant to ship), a sample/placeholder from docs or a tutorial, or an invalid/revoked value. None of these authenticate to anything, so there is no confidentiality impact. Bugcrowd includes this leaf to classify the very common false-positive where a scanner flags a string that merely looks like a secret.",
      simple: "The 'secret' is not real — it is a key meant to be public (like a client-side maps key), a sample/placeholder from docs, or an invalid/revoked value. None of them log in to anything, so there is no impact. This leaf exists to mark that common false positive.",
      hi: "मिला 'secret' असली credential नहीं है — documented public/publishable key (जैसे client-side analytics/maps key जो ship होना ही है), docs/tutorial का sample/placeholder, या invalid/revoked value। इनमें से कोई कहीं authenticate नहीं करता, तो confidentiality impact नहीं। Bugcrowd इस leaf को उस आम false-positive के लिए रखता है जहाँ scanner secret जैसी दिखती string flag कर देता है।",
    },
    find: [
      {
        title: { en: "Validate before reporting the secret", simple: "Check the secret is real first", hi: "report से पहले secret validate करें" },
        steps: [
          { en: "For any flagged secret, check whether it is a publishable client key, a docs/sample value, or already revoked.", simple: "Check if the key is a public client key, a sample, or already revoked.", hi: "किसी भी flagged secret के लिए check करें वह publishable client key, docs/sample value, या पहले से revoked तो नहीं।" },
          { en: "Attempt a single benign validity check; if it does not authenticate, it belongs here and should not be reported as a live secret.", simple: "Do one safe test; if it does not work, it is not a real secret.", hi: "एक benign validity check करें; अगर authenticate न करे तो यह यहीं आता है और live secret के रूप में report न करें।" },
        ],
      },
    ],
    proof: {
      en: "There is nothing rewardable here: this leaf captures secrets that are intentionally public, sample, or invalid, which triage closes as N/A (P5). Use it to self-triage — only report a disclosed secret if a benign validity check proves it is live and grants access (then it is the P1/P3 sibling).",
      simple: "Nothing to reward — this marks keys that are public, samples, or invalid, closed as N/A. Only report a secret if you proved it actually works (then it is the P1/P3 sibling).",
      hi: "यहाँ rewardable कुछ नहीं: यह leaf intentionally public/sample/invalid secrets पकड़ता है जिन्हें triage N/A (P5) करता है। self-triage में इस्तेमाल करें — disclosed secret तभी report करें जब benign validity check साबित करे वह live है और access देता है (तब P1/P3 sibling)।",
    },
  },

  "Sensitive Data Exposure › Internal IP Disclosure": {
    what: {
      en: "The application reveals an internal/private IP address (RFC1918 ranges like 10.x, 172.16-31.x, 192.168.x, or a backend host) in a response header, error, redirect, or body. It leaks a sliver of internal network topology, which can hint at backend layout for later SSRF or pivoting, but exposes no data or credential and is not reachable by the attacker directly. It is informational on its own.",
      simple: "The app shows an internal/private IP (like 10.x or 192.168.x) in a header, error, or body. It gives a hint about the internal network, which could help later SSRF, but leaks no data and is not directly reachable. Informational alone.",
      hi: "Application किसी response header, error, redirect या body में internal/private IP (RFC1918 जैसे 10.x, 172.16-31.x, 192.168.x, या backend host) reveal करता है। यह internal network topology का एक टुकड़ा leak करता है, जो बाद में SSRF/pivoting के लिए backend layout का hint दे सकता है, पर कोई data/credential expose नहीं करता और attacker के लिए directly reachable नहीं। अकेले informational।",
    },
    find: [
      {
        title: { en: "Hunt for private IPs in responses", simple: "Look for private IPs in responses", hi: "responses में private IPs खोजें" },
        steps: [
          { en: "Inspect response headers (X-Forwarded-For echoes, Via, Location redirects, custom headers), error bodies, and SOAP/XML for RFC1918 addresses.", simple: "Check headers, redirects, and error bodies for private IP addresses.", hi: "response headers (X-Forwarded-For echo, Via, Location redirects, custom headers), error bodies, SOAP/XML में RFC1918 addresses देखें।" },
          { en: "Confirm the address is an internal/private IP and note where it is disclosed.", simple: "Confirm it is an internal IP and note where it appears.", hi: "confirm करें address internal/private IP है और कहाँ disclose होता है note करें।" },
        ],
      },
    ],
    proof: {
      en: "Show the response disclosing the internal IP. This is informational (P5) and generally not rewarded alone. Its only real value is as a hint for SSRF/internal reconnaissance; report the resulting SSRF or access bug, not the IP leak by itself.",
      simple: "Show the response with the internal IP. Informational and usually not paid alone — useful only as a hint for SSRF. Report the actual SSRF, not the IP leak.",
      hi: "internal IP disclose करती response दिखाएं। यह informational (P5) और आम तौर पर अकेले unrewarded। असली value सिर्फ़ SSRF/internal reconnaissance के hint के तौर पर; resulting SSRF/access bug report करें, अकेले IP leak नहीं।",
    },
  },

  "Sensitive Data Exposure › JSON Hijacking": {
    what: {
      en: "A legacy attack where a JSON endpoint returns sensitive data as a top-level JSON array (or JS-executable response) using GET and relying only on cookies, so a cross-origin page could once read it via a redefined Array constructor or <script> inclusion. Modern browsers no longer leak array literals this way, so it is almost always non-exploitable today; Bugcrowd keeps the leaf but real impact requires proving actual cross-origin reads against the current browser behaviour.",
      simple: "An old attack: a JSON endpoint returns sensitive data as a plain array over GET using only cookies, which old browsers let another site read via a <script> tag. Modern browsers fixed this, so it is almost never exploitable now. You must prove a real cross-origin read to have impact.",
      hi: "एक legacy attack जहाँ JSON endpoint GET पर top-level JSON array (या JS-executable response) में sensitive data लौटाता है और सिर्फ़ cookies पर निर्भर करता है, तो कोई cross-origin page कभी redefined Array constructor या <script> inclusion से इसे पढ़ सकता था। आधुनिक browsers अब array literals इस तरह leak नहीं करते, इसलिए आज यह लगभग non-exploitable है; Bugcrowd leaf रखता है पर असली impact के लिए मौजूदा browser behaviour के ख़िलाफ़ actual cross-origin read साबित करना पड़ता है।",
    },
    find: [
      {
        title: { en: "Test for a script-includable sensitive response", simple: "Check for a cross-origin-readable JSON response", hi: "script-includable sensitive response test करें" },
        steps: [
          { en: "Find authenticated GET endpoints returning sensitive data as a bare top-level array or JS-parseable body, protected only by cookies.", simple: "Find GET endpoints returning a bare array of sensitive data, protected only by cookies.", hi: "ऐसे authenticated GET endpoints ढूंढें जो sensitive data bare top-level array/JS-parseable body में लौटाएँ, सिर्फ़ cookies से protected।" },
          { en: "From a different origin, attempt to read the body via <script> inclusion or constructor tricks and verify in a current browser whether anything is actually leaked (it usually is not).", simple: "From another origin, try to read it via a <script> tag in a modern browser and see if anything leaks.", hi: "अलग origin से <script> inclusion/constructor tricks से body पढ़ने की कोशिश करें और current browser में verify करें कुछ leak होता है या नहीं (आम तौर पर नहीं)।" },
        ],
      },
    ],
    proof: {
      en: "Impact requires a working cross-origin read PoC in a current browser that extracts the sensitive data — a theoretical description is not enough and modern browsers almost always block it, making it N/A. If you cannot demonstrate the leak, do not report it. CORS/CSRF issues on the endpoint are separate, differently-scored findings.",
      simple: "You need a working PoC in a modern browser that actually reads the data cross-origin — a theory is not enough and browsers almost always block it, so it is usually N/A. No demonstrable leak means no report.",
      hi: "impact के लिए current browser में working cross-origin read PoC चाहिए जो sensitive data निकाले — theoretical description काफ़ी नहीं और आधुनिक browsers लगभग हमेशा block करते हैं, तो यह N/A। leak demonstrate न कर पाएं तो report न करें। endpoint पर CORS/CSRF issues अलग, differently-scored findings हैं।",
    },
  },

  "Sensitive Data Exposure › Mixed Content (HTTPS Sourcing HTTP)": {
    what: {
      en: "An HTTPS page loads a sub-resource over plaintext HTTP (script, stylesheet, image, iframe), breaking the page's transport guarantees. Active mixed content (script/CSS) is dangerous because a network attacker could tamper with it, though modern browsers block or auto-upgrade most of it; passive mixed content (images) mainly leaks referer/metadata. Because browsers now block active mixed content by default, real impact is usually limited, so Bugcrowd rates it informational.",
      simple: "An HTTPS page loads something over plain HTTP (a script, image, or iframe), weakening its security. Risky types (scripts) could be tampered with on the network, but modern browsers block most of that. So real impact is usually small and it is informational.",
      hi: "कोई HTTPS page sub-resource plaintext HTTP पर load करता है (script/stylesheet/image/iframe), page की transport guarantees तोड़ता है। active mixed content (script/CSS) खतरनाक है क्योंकि network attacker उसे tamper कर सकता था, पर आधुनिक browsers ज़्यादातर block/auto-upgrade करते हैं; passive mixed content (images) मुख्यतः referer/metadata leak करता है। browsers अब active mixed content default block करते हैं, तो असली impact सीमित रहता है, इसलिए Bugcrowd informational रेट करता है।",
    },
    find: [
      {
        title: { en: "Detect HTTP sub-resources on HTTPS pages", simple: "Find HTTP resources on HTTPS pages", hi: "HTTPS pages पर HTTP sub-resources खोजें" },
        steps: [
          { en: "Load the HTTPS page with DevTools open and watch the console / Security panel for mixed-content warnings and any http:// resource requests.", simple: "Open the HTTPS page in DevTools and look for mixed-content warnings.", hi: "HTTPS page को DevTools खोलकर load करें और console/Security panel में mixed-content warnings और http:// resource requests देखें।" },
          { en: "Note whether the HTTP resource is active (script/CSS/iframe) or passive (image), and whether the browser blocked or loaded it.", simple: "Note if the HTTP resource is a script (risky) or image (minor), and if the browser blocked it.", hi: "note करें HTTP resource active (script/CSS/iframe) है या passive (image), और browser ने उसे block किया या load।" },
        ],
      },
    ],
    proof: {
      en: "Show the HTTPS page requesting an http:// sub-resource (DevTools Security panel / network log). This is informational (P5); active mixed content is more noteworthy than passive, but modern browser blocking usually caps impact, and it is rarely rewarded alone. If a passively-loaded HTTP resource leaks a token via Referer, that is the referer-leakage sibling.",
      simple: "Show the HTTPS page loading an http:// resource. Informational; scripts matter more than images, but browsers block most of it, so it is rarely paid alone. If it also leaks a token via Referer, that is a different sibling.",
      hi: "HTTPS page को http:// sub-resource request करता दिखाएं (DevTools Security panel/network log)। यह informational (P5); active mixed content passive से ज़्यादा noteworthy, पर modern browser blocking impact सीमित करता है, और अकेले कम ही rewarded। अगर passively-loaded HTTP resource Referer से token leak करे तो वह referer-leakage sibling है।",
    },
  },

  "Sensitive Data Exposure › Disclosure of Secrets › Non-Corporate User": {
    what: {
      en: "The exposed secret belongs to a non-corporate party — an end user's personal key/token, or a third party unrelated to the program — rather than to the program's own systems. The program is not the owner of what leaked, so there is no confidentiality impact on the target in scope. Bugcrowd marks it informational to separate it from the high-value case where the leaked secret belongs to the program itself.",
      simple: "The leaked secret belongs to an individual user or an unrelated third party, not to the program's own systems. The target does not own what leaked, so there is no real impact on it. That is why it is informational.",
      hi: "Expose हुआ secret किसी non-corporate party का है — किसी end user का personal key/token, या program से असंबंधित third party — program के अपने systems का नहीं। जो leak हुआ उसका owner program नहीं, तो in-scope target पर confidentiality impact नहीं। Bugcrowd इसे informational मार्क करता है ताकि उस high-value case से अलग रहे जहाँ leaked secret खुद program का हो।",
    },
    find: [
      {
        title: { en: "Attribute the secret's owner", simple: "Check who owns the secret", hi: "secret का owner पहचानें" },
        steps: [
          { en: "For a disclosed secret, determine whether it belongs to the program's infrastructure or to an individual/third party.", simple: "Find out if the secret belongs to the program or to a user/third party.", hi: "disclosed secret के लिए तय करें वह program के infrastructure का है या किसी individual/third party का।" },
          { en: "If it is a non-corporate user's or an unrelated party's secret, it belongs here; if it is the program's own, use the P1/P3 sibling.", simple: "User or third-party secret belongs here; the program's own secret is the P1/P3 sibling.", hi: "किसी non-corporate user/unrelated party का secret यहाँ आता है; program का अपना हो तो P1/P3 sibling।" },
        ],
      },
    ],
    proof: {
      en: "Document whose secret leaked. If it is not the program's own, it is informational (P5) and generally not rewarded. The high-value classification is reserved for secrets belonging to the program's public or internal assets — report those under the 'For Publicly Accessible Asset' (P1) / 'For Internal Asset' (P3) siblings instead.",
      simple: "Show whose secret it is. If not the program's own, it is informational and usually not paid. A program-owned secret is the much higher P1/P3 sibling.",
      hi: "दिखाएं किसका secret leak हुआ। program का अपना न हो तो informational (P5) और आम तौर पर unrewarded। high-value classification program के public/internal assets के secrets के लिए है — उन्हें 'For Publicly Accessible Asset' (P1)/'For Internal Asset' (P3) siblings के तहत report करें।",
    },
  },

  "Sensitive Data Exposure › Via localStorage/sessionStorage › Non-Sensitive Token": {
    what: {
      en: "A token or identifier is stored in localStorage/sessionStorage but it is not security-sensitive — a CSRF-safe public id, a feature flag, a UI preference, or an already-public value. Even though web storage is script-readable, reading it yields nothing an attacker could use to authenticate or access data. Bugcrowd lists it as the informational counterpart to the sensitive-token case, mainly to reject false positives.",
      simple: "A token in localStorage/sessionStorage that is not sensitive — a public id, a feature flag, or a UI setting. Any script can read it, but reading it gains nothing. It is the informational version of the sensitive-token case, mostly to reject false positives.",
      hi: "कोई token/identifier localStorage/sessionStorage में store है पर security-sensitive नहीं — CSRF-safe public id, feature flag, UI preference, या पहले से public value। web storage script-readable होने पर भी इसे पढ़ने से attacker को authenticate/access करने लायक कुछ नहीं मिलता। Bugcrowd इसे sensitive-token case का informational counterpart लिस्ट करता है, मुख्यतः false positives reject करने के लिए।",
    },
    find: [
      {
        title: { en: "Classify the stored value's sensitivity", simple: "Decide if the stored value is sensitive", hi: "stored value की sensitivity तय करें" },
        steps: [
          { en: "Inspect the web-storage value and determine whether it authenticates, authorizes, or is otherwise a secret.", simple: "Look at the stored value and decide if it is actually a secret.", hi: "web-storage value देखें और तय करें वह authenticate/authorize करती है या secret है।" },
          { en: "If it does none of those, it is non-sensitive and belongs here, not in the sensitive-token sibling.", simple: "If it does none of those, it is non-sensitive and belongs here.", hi: "अगर इनमें से कुछ नहीं करती, तो non-sensitive है और यहीं आती है, sensitive-token sibling में नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Show the stored value and that it carries no security capability. This is informational (P5) and not rewarded — storing non-sensitive data in web storage is normal. Only escalate to the 'Sensitive Token' sibling (P4) if you can show the value is a live credential (and ideally chain it with an XSS).",
      simple: "Show the value does nothing sensitive. Informational and not paid — this is normal. Only the Sensitive Token sibling (P4) matters, when the value is a real credential.",
      hi: "stored value दिखाएं और कि उसमें कोई security capability नहीं। यह informational (P5) और unrewarded — web storage में non-sensitive data रखना सामान्य है। 'Sensitive Token' sibling (P4) तभी, जब दिखा सकें value live credential है (और ideally XSS से chain करें)।",
    },
  },

  "Sensitive Data Exposure › Non-Sensitive Token in URL": {
    what: {
      en: "A token or identifier appears in a URL but it is not security-sensitive — a non-secret request id, a public resource slug, a tracking parameter, or a value that grants no access. Even though URLs end up in logs, history, and Referer, leaking a non-sensitive value causes no confidentiality impact. The CVSS vector (AV:P, all impacts None) reflects this: it is informational and listed mainly to reject false-positive 'token in URL' reports.",
      simple: "A token in a URL that is not sensitive — a public id, a slug, or a tracking value that grants no access. URLs leak into logs and history, but leaking something harmless does nothing. Informational, listed mostly to reject false positives.",
      hi: "कोई token/identifier URL में दिखता है पर security-sensitive नहीं — non-secret request id, public resource slug, tracking parameter, या access न देने वाली value। URLs logs, history, Referer में जाते हैं, पर non-sensitive value leak होने से confidentiality impact नहीं। CVSS vector (AV:P, सभी impacts None) यही दिखाता है: informational, मुख्यतः false-positive 'token in URL' reports reject करने को।",
    },
    find: [
      {
        title: { en: "Judge the URL token's sensitivity", simple: "Check if the URL token is sensitive", hi: "URL token की sensitivity जांचें" },
        steps: [
          { en: "Identify the token in the URL and test whether it authenticates or authorizes anything when replayed.", simple: "Find the URL token and test if it grants any access when replayed.", hi: "URL का token पहचानें और test करें replay पर वह कुछ authenticate/authorize करता है या नहीं।" },
          { en: "If it grants no access, it is non-sensitive; if it does, use the sensitive 'Sensitive Token in URL' leaf instead.", simple: "No access means non-sensitive; if it grants access, use the sensitive leaf.", hi: "कोई access न दे तो non-sensitive; दे तो sensitive 'Sensitive Token in URL' leaf इस्तेमाल करें।" },
        ],
      },
    ],
    proof: {
      en: "Show the URL token grants no access. This is informational (P5) and not rewarded. If the token is in fact sensitive (it authenticates or authorizes on replay), report it under 'Sensitive Token in URL › User Facing' (P4) or the relevant sensitive sibling instead.",
      simple: "Show the token grants no access. Informational and not paid. If it actually authenticates, report the sensitive 'User Facing' sibling (P4) instead.",
      hi: "दिखाएं URL token कोई access नहीं देता। यह informational (P5) और unrewarded। अगर token असल में sensitive है (replay पर authenticate/authorize करे) तो 'Sensitive Token in URL › User Facing' (P4) या संबंधित sensitive sibling के तहत report करें।",
    },
  },

  "Sensitive Data Exposure › Sensitive Data Hardcoded › OAuth Secret": {
    what: {
      en: "An OAuth client secret is hardcoded where it is retrievable — a public JS bundle, a mobile app binary, or a public repo. For confidential OAuth clients the secret is meant to stay server-side; its exposure can let an attacker impersonate the client (e.g. complete the token exchange or request tokens as that client), weakening the OAuth trust model. Impact depends on grant type and whether the client is truly confidential, so Bugcrowd lists it low but it can matter in chains.",
      simple: "An OAuth client secret is hardcoded in a place anyone can read — a JS bundle, an app binary, or a public repo. For confidential clients that secret must stay on the server; if it leaks, an attacker can pretend to be the client. Impact depends on the setup, so it is listed low but can matter in a chain.",
      hi: "कोई OAuth client secret ऐसी जगह hardcoded है जहाँ retrievable है — public JS bundle, mobile app binary, या public repo। confidential OAuth clients के लिए secret server-side रहना चाहिए; expose होने पर attacker client impersonate कर सकता है (जैसे token exchange पूरा करना या उस client के रूप में tokens माँगना), OAuth trust model कमज़ोर करता है। impact grant type और client सच में confidential है या नहीं पर निर्भर, तो Bugcrowd low लिस्ट करता है पर chains में मायने रख सकता है।",
    },
    find: [
      {
        title: { en: "Find a leaked OAuth client secret", simple: "Find a leaked OAuth secret", hi: "leaked OAuth client secret ढूंढें" },
        steps: [
          { en: "Grep JS bundles, decompiled mobile code, and public repos for client_secret, OAuth config blocks, and provider-specific secret patterns.", simple: "Search JS, app code, and repos for client_secret and OAuth config.", hi: "JS bundles, decompiled mobile code, public repos में client_secret, OAuth config blocks, provider-specific secret patterns grep करें।" },
          { en: "Determine the client type and grant: a secret for a confidential client is impactful; one for a public client (SPA/mobile) is expected to be exposed and not a secret.", simple: "Check the client type: a confidential client's secret matters; a public client's does not.", hi: "client type और grant तय करें: confidential client का secret impactful है; public client (SPA/mobile) का expose होना ही था, secret नहीं।" },
          { en: "If confidential, show it can be used in the token flow as that client, using your own test OAuth app.", simple: "If confidential, show it works in the OAuth flow, using your own test app.", hi: "अगर confidential, तो अपने test OAuth app से दिखाएं यह token flow में उस client के रूप में इस्तेमाल हो सकता है।" },
        ],
      },
    ],
    proof: {
      en: "Show the hardcoded client_secret and the client type. If it is a confidential client whose secret is meant to be private, demonstrate (with your own OAuth app) that the secret is usable to act as that client — that is what lifts it above a cosmetic find. A secret for a public client (SPA/mobile, PKCE) is expected to be exposed and is N/A. Chain with an open redirect / weak redirect_uri validation for real account-takeover impact.",
      simple: "Show the hardcoded secret and the client type. For a confidential client, prove with your own OAuth app that the secret can act as the client. A public client's secret is meant to be exposed and is N/A. Chain with an open redirect for real ATO.",
      hi: "hardcoded client_secret और client type दिखाएं। अगर confidential client है जिसका secret private रहना चाहिए, तो अपने OAuth app से दिखाएं secret उस client के रूप में usable है — यही इसे cosmetic से ऊपर उठाता है। public client (SPA/mobile, PKCE) का secret expose होना ही था और N/A। असली ATO impact के लिए open redirect/weak redirect_uri validation से chain करें।",
    },
    escalate: {
      en: "Combine a leaked confidential-client secret with a weak/overbroad redirect_uri or open redirect to escalate toward OAuth token theft / account takeover — a far higher, separately-scored finding.",
      simple: "Combine the leaked secret with a weak redirect_uri or open redirect to reach OAuth token theft / account takeover — a much higher finding.",
      hi: "leaked confidential-client secret को weak/overbroad redirect_uri या open redirect से मिलाकर OAuth token theft/account takeover की ओर escalate करें — बहुत ऊँची, अलग score होने वाली finding।",
    },
    references: [
      { label: "OAuth 2.0 Security Best Current Practice (RFC 9700)", url: "https://datatracker.ietf.org/doc/rfc9700/" },
    ],
  },

  "Sensitive Data Exposure › Sensitive Token in URL › On Password Reset": {
    what: {
      en: "The password-reset token is placed in the URL of the reset flow (the reset link's query/path), which is normal for reset links, but means the token can leak through browser history, Referer to any third-party resource the reset page loads, and server/proxy logs. Scope is narrow — it is a single-use reset token on one flow — so Bugcrowd treats it as informational unless an actual leak path (e.g. Referer to a third party) is demonstrated.",
      simple: "The password-reset token sits in the reset-link URL. That is normal, but it means the token can leak via browser history, Referer to anything the reset page loads, or logs. It is a single-use token on one flow, so it is informational unless you show a real leak path.",
      hi: "Password-reset token reset flow के URL (reset link के query/path) में रखा जाता है, जो reset links के लिए सामान्य है, पर इसका मतलब token browser history, reset page जो third-party resource load करे उसके Referer, और server/proxy logs से leak हो सकता है। scope संकरा है — एक flow पर single-use reset token — तो Bugcrowd इसे informational मानता है जब तक actual leak path (जैसे third party को Referer) demonstrate न हो।",
    },
    find: [
      {
        title: { en: "Check the reset token's URL exposure", simple: "Check how the reset token leaks from the URL", hi: "reset token का URL exposure देखें" },
        steps: [
          { en: "Trigger a reset on your own account and inspect the reset page for third-party resources (analytics, fonts, scripts) that would receive the full URL via Referer.", simple: "Reset your own account and see if the reset page loads third-party resources that get the URL.", hi: "अपने account पर reset trigger करें और reset page में third-party resources (analytics/fonts/scripts) देखें जो Referer से पूरा URL पा लें।" },
          { en: "Capture any outbound Referer carrying the reset token, and note whether the token survives in browser history.", simple: "Capture any Referer that carries the reset token, and check browser history.", hi: "reset token ले जाता कोई outbound Referer capture करें, और देखें token browser history में बचता है या नहीं।" },
        ],
      },
    ],
    proof: {
      en: "On its own, a reset token in the URL is informational (P5) and usually not rewarded — it is standard design. It gains impact only when you demonstrate an actual leak: the token sent in a Referer to a third party, or reused from history. If it leaks specifically via Referer, report under the 'Token Leakage via Referer › Password Reset Token' sibling; a user-facing non-reset token is the 'User Facing' sibling (P4).",
      simple: "A reset token in the URL alone is informational and usually not paid — it is normal. It matters only if you show a real leak, like the token sent to a third party via Referer. Then use the referer sibling.",
      hi: "अकेले URL में reset token informational (P5) और आम तौर पर unrewarded — यह standard design है। impact तभी जब actual leak दिखाएं: token third party को Referer में भेजा, या history से reuse। अगर खास Referer से leak हो तो 'Token Leakage via Referer › Password Reset Token' sibling में report करें; user-facing non-reset token 'User Facing' sibling (P4)।",
    },
  },

  "Sensitive Data Exposure › Token Leakage via Referer › Password Reset Token": {
    what: {
      en: "The password-reset page carries the reset token in its URL and loads an external resource (analytics, fonts, a tracking pixel) or contains an outbound link, so the browser sends the full reset-token URL in the Referer header to that other host. A third party or a logging hop then obtains a valid reset token. The leak is to an external party via Referer specifically — distinct from the token merely being in the URL — but scope is one single-use reset token, keeping it informational.",
      simple: "The reset page has the reset token in its URL and loads something external (analytics, fonts, a pixel), so the browser sends the whole reset-link URL in the Referer to that host. That third party then gets a working reset token. Scope is one single-use token, so it is informational.",
      hi: "Password-reset page अपने URL में reset token रखता है और कोई external resource (analytics/fonts/tracking pixel) load करता है या outbound link रखता है, तो browser पूरा reset-token URL उस दूसरे host को Referer header में भेज देता है। कोई third party या logging hop valid reset token पा लेता है। leak खास तौर पर Referer से external party को है — token सिर्फ़ URL में होने से अलग — पर scope एक single-use reset token है, जो इसे informational रखता है।",
    },
    find: [
      {
        title: { en: "Catch the reset token in a Referer header", simple: "Catch the reset token in a Referer", hi: "reset token को Referer header में पकड़ें" },
        steps: [
          { en: "Trigger a reset for your own account, open the reset link, and proxy the page's outbound requests.", simple: "Reset your own account, open the link, and proxy the page's requests.", hi: "अपने account का reset trigger करें, reset link खोलें, और page की outbound requests proxy करें।" },
          { en: "Find any request to an external host and confirm its Referer header contains the full reset-token URL.", simple: "Find a request to an outside host and check its Referer has the token URL.", hi: "किसी external host को जाती request ढूंढें और confirm करें उसका Referer header पूरा reset-token URL रखता है।" },
          { en: "Verify the leaked token is still valid (reusable to complete the reset) using only your own account.", simple: "Check the leaked token still works, using your own account.", hi: "verify करें leaked token अभी valid है (reset पूरा करने में reusable) — सिर्फ़ अपने account से।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the captured outbound request whose Referer carries the full reset-token URL to an external host, on your own account, plus confirmation the token is still usable. If the reset page sets a strict Referrer-Policy, loads no external resources, or the token is single-use and already consumed before the referer fires, there is no exploitable leak (N/A). Leakage over plaintext HTTP (not to a third party) is the 'Over HTTP' sibling (P4).",
      simple: "Show the captured request whose Referer carries the reset-token URL to an outside host, on your own account, and that the token still works. If a Referrer-Policy blocks it or no external resource loads, it is N/A. A plain-HTTP leak is the 'Over HTTP' sibling (P4).",
      hi: "Triage को captured outbound request चाहिए जिसका Referer अपने account पर external host को पूरा reset-token URL ले जाए, साथ में token अभी usable है confirm। अगर reset page strict Referrer-Policy सेट करे, कोई external resource न load करे, या token single-use पहले ही consumed हो जाए, तो exploitable leak नहीं (N/A)। plaintext HTTP पर leak (third party को नहीं) 'Over HTTP' sibling (P4)।",
    },
    escalate: {
      en: "Leaking the reset token over plaintext HTTP is the 'Over HTTP' sibling (P4); leaking it to an untrusted third party is 'Untrusted 3rd Party' (P4), both higher than leaking to a trusted third party.",
      simple: "Over plain HTTP it is the 'Over HTTP' sibling (P4); to an untrusted third party it is the 'Untrusted 3rd Party' sibling (P4).",
      hi: "plaintext HTTP पर reset token leak 'Over HTTP' sibling (P4); untrusted third party को leak 'Untrusted 3rd Party' (P4) — दोनों trusted third party को leak से ऊँचे।",
    },
  },

  "Sensitive Data Exposure › Token Leakage via Referer › Trusted 3rd Party": {
    what: {
      en: "A page holding a sensitive token in its URL loads a resource from, or links to, a trusted/first-party-affiliated third party (a vendor CDN, a partner analytics service the org controls or has a data agreement with), so the Referer carries the token to that party. Because the recipient is trusted and governed by agreement, the practical confidentiality risk is low — hence the lowest band of the referer-leakage siblings. It still shows the token should not be in the URL.",
      simple: "A page with a token in its URL loads something from a trusted partner (the org's own CDN or a contracted analytics provider), so the Referer sends the token there. The receiver is trusted, so the real risk is low — the lowest of the referer-leak siblings. It still shows the token should not be in the URL.",
      hi: "कोई page जिसके URL में sensitive token है, किसी trusted/first-party-affiliated third party (vendor CDN, या org द्वारा नियंत्रित/agreement वाला partner analytics) से resource load या link करता है, तो Referer token उस party को ले जाता है। recipient trusted और agreement से governed होने से practical confidentiality risk कम है — इसलिए referer-leakage siblings का सबसे निचला band। फिर भी दिखाता है token URL में नहीं होना चाहिए।",
    },
    find: [
      {
        title: { en: "Identify token leakage to a trusted party", simple: "Spot the token going to a trusted partner", hi: "trusted party को token leak पहचानें" },
        steps: [
          { en: "On a token-in-URL page, proxy outbound requests and identify those going to trusted/affiliated third parties.", simple: "Proxy the page and find requests going to trusted partners.", hi: "token-in-URL page पर outbound requests proxy करें और trusted/affiliated third parties को जाती requests पहचानें।" },
          { en: "Confirm the Referer to that trusted party includes the token, and classify the recipient as trusted (org-owned/contracted) vs untrusted.", simple: "Confirm the Referer to that partner has the token and that the partner is trusted.", hi: "confirm करें उस trusted party को Referer में token है, और recipient को trusted (org-owned/contracted) बनाम untrusted classify करें।" },
        ],
      },
    ],
    proof: {
      en: "Show the Referer carrying the token to a trusted/affiliated third party, on your own session. This is the lowest referer-leak band (P5) because the recipient is trusted, and it is often not rewarded alone. If the recipient is actually an untrusted/arbitrary third party, it is the higher 'Untrusted 3rd Party' sibling (P4); over plaintext HTTP it is the 'Over HTTP' sibling (P4).",
      simple: "Show the Referer sending the token to a trusted partner, on your own account. Lowest band because the receiver is trusted, often not paid alone. An untrusted receiver is the higher P4 sibling.",
      hi: "अपने session पर token को trusted/affiliated third party को ले जाता Referer दिखाएं। यह सबसे निचला referer-leak band (P5) है क्योंकि recipient trusted है, और अकेले अक्सर unrewarded। recipient असल में untrusted/arbitrary हो तो ऊँचा 'Untrusted 3rd Party' sibling (P4); plaintext HTTP पर 'Over HTTP' sibling (P4)।",
    },
    escalate: {
      en: "If the receiving third party is untrusted/arbitrary it is 'Untrusted 3rd Party' (P4); leakage over plaintext HTTP is 'Over HTTP' (P4); a reset token specifically is the 'Password Reset Token' sibling.",
      simple: "An untrusted receiver is the P4 sibling; plain HTTP is the 'Over HTTP' P4 sibling; a reset token is its own sibling.",
      hi: "receiving third party untrusted/arbitrary हो तो 'Untrusted 3rd Party' (P4); plaintext HTTP पर leak 'Over HTTP' (P4); खास reset token 'Password Reset Token' sibling।",
    },
  },

  "Sensitive Data Exposure › Disclosure of Secrets › Publicly accessible Robots.txt": {
    what: {
      en: "robots.txt is being reported as 'disclosing secrets' because it lists Disallow paths that name admin panels, internal tools, or hidden directories. robots.txt is intended to be public and crawler-readable, so its mere accessibility is not a vulnerability; at most it is a hint pointing at paths an attacker can then probe. Bugcrowd classes it informational, and real impact only exists if one of those listed paths is itself unprotected.",
      simple: "robots.txt is flagged for 'leaking secrets' because its Disallow list names admin or hidden paths. But robots.txt is meant to be public, so it being readable is not a bug — at most it hints at paths to check. Informational; impact only exists if one of those paths is actually unprotected.",
      hi: "robots.txt को 'secrets disclose' करने के लिए report किया जाता है क्योंकि इसमें Disallow paths admin panels, internal tools, या hidden directories नाम से लिखे होते हैं। robots.txt public और crawler-readable होना ही है, तो इसका accessible होना vulnerability नहीं; ज़्यादा से ज़्यादा यह उन paths का hint है जिन्हें attacker probe कर सकता है। Bugcrowd informational रखता है, और असली impact तभी जब उनमें से कोई listed path खुद unprotected हो।",
    },
    find: [
      {
        title: { en: "Mine robots.txt then test the paths", simple: "Read robots.txt then check its paths", hi: "robots.txt पढ़कर उसके paths test करें" },
        steps: [
          { en: "Fetch /robots.txt and collect the Disallow entries that reveal interesting admin/internal/hidden paths.", simple: "Get /robots.txt and list the interesting Disallow paths.", hi: "/robots.txt लें और interesting admin/internal/hidden paths वाली Disallow entries इकट्ठा करें।" },
          { en: "Request each listed path and check whether it is actually protected (auth/403) or reachable — only an unprotected one is a real finding.", simple: "Visit each path and see if it is really protected or open.", hi: "हर listed path request करें और देखें वह सच में protected (auth/403) है या reachable — सिर्फ़ unprotected ही असली finding है।" },
        ],
      },
    ],
    proof: {
      en: "The accessibility of robots.txt itself is informational (P5) and not rewarded — it is designed to be public. Do not report robots.txt as a secret leak. If a path it lists turns out to be an exposed admin panel, unauthenticated internal tool, or sensitive file, report that access-control/exposure issue on its own merits (a separate, likely higher leaf).",
      simple: "robots.txt being public is informational and not paid — it is supposed to be public. Do not report it as a secret leak. If a listed path is actually an exposed admin page, report that as its own bug.",
      hi: "robots.txt का accessible होना informational (P5) और unrewarded — यह public होना ही था। robots.txt को secret leak के रूप में report न करें। अगर इसमें listed कोई path exposed admin panel, unauthenticated internal tool, या sensitive file निकले, तो उस access-control/exposure issue को अलग से (संभवतः ऊँचा leaf) report करें।",
    },
  },

  "Sensitive Data Exposure › Disclosure of Secrets › Sensitive Information Disclosed in JSON Web Token (JWT)": {
    what: {
      en: "A JWT issued to the client carries sensitive data in its payload — because a JWT body is only base64url-encoded, not encrypted, anyone who holds the token can decode and read it. If the claims include things like internal ids, roles with sensitive meaning, email/PII, or secrets, they are effectively exposed to the token holder (and anywhere the token is logged). It is informational because the holder already legitimately has their own token; impact depends on what the claims reveal.",
      simple: "A JWT given to the client has sensitive data in its payload. A JWT body is just base64-encoded, not encrypted, so anyone holding it can decode and read it. If it contains internal ids, PII, or secrets, those are exposed to whoever has the token. Informational — the user already has their own token.",
      hi: "Client को issued JWT अपने payload में sensitive data रखता है — JWT body सिर्फ़ base64url-encoded है, encrypted नहीं, तो token रखने वाला कोई भी decode करके पढ़ सकता है। अगर claims में internal ids, sensitive meaning वाले roles, email/PII, या secrets हों, तो वे token holder (और जहाँ token log हो) के लिए expose हो जाते हैं। यह informational है क्योंकि holder के पास legitimately अपना token पहले से है; impact claims क्या reveal करते हैं पर निर्भर।",
    },
    find: [
      {
        title: { en: "Decode the JWT and audit claims", simple: "Decode the JWT and read its claims", hi: "JWT decode करके claims audit करें" },
        steps: [
          { en: "Capture a JWT issued to your own test account and base64url-decode the header and payload (jwt.io offline, or a local decoder).", simple: "Grab your own JWT and decode the payload (offline).", hi: "अपने test account का JWT capture करें और header/payload base64url-decode करें (jwt.io offline या local decoder)।" },
          { en: "List claims that are sensitive beyond what the client needs — internal ids, PII, secrets, roles/permissions in clear — rather than opaque, necessary claims.", simple: "List claims that are sensitive and unnecessary for the client.", hi: "ऐसी claims list करें जो client की ज़रूरत से ज़्यादा sensitive हों — internal ids, PII, secrets, clear roles/permissions — opaque/ज़रूरी claims नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Show the decoded JWT payload and point to the specific sensitive claims that have no need to be client-readable. This is informational (P5) alone — the holder already possesses their own token. It matters more if the exposed claim is genuinely sensitive PII (score under PII Leakage) or a reusable secret, or if the token is also leaked to third parties. Standard claims (sub, exp, a user id) are expected and N/A.",
      simple: "Show the decoded JWT and the specific sensitive claims that should not be readable. Alone it is informational — the user has their own token. It matters if a claim is real PII or a reusable secret. Normal claims like user id are expected and N/A.",
      hi: "decoded JWT payload दिखाएं और उन specific sensitive claims की ओर इशारा करें जिन्हें client-readable होने की ज़रूरत नहीं। अकेले यह informational (P5) है — holder के पास अपना token है। ज़्यादा मायने तब जब exposed claim genuinely sensitive PII (PII Leakage के तहत score) या reusable secret हो, या token third parties को भी leak हो। standard claims (sub, exp, user id) expected और N/A।",
    },
    escalate: {
      en: "If a claim exposes real PII, it is scored under 'PII Leakage/Exposure'; if a claim is a reusable secret/credential, it becomes a live-secret disclosure (the P1/P3 siblings depending on what it unlocks).",
      simple: "A claim exposing real PII is scored under PII Leakage; a claim that is a reusable secret becomes a live-secret finding (P1/P3).",
      hi: "कोई claim real PII expose करे तो 'PII Leakage/Exposure' के तहत score; claim reusable secret/credential हो तो live-secret disclosure (जो unlock करे उसके हिसाब से P1/P3 siblings)।",
    },
    references: [
      { label: "PortSwigger: JWT attacks", url: "https://portswigger.net/web-security/jwt" },
    ],
  },

  "Sensitive Data Exposure › Cross Site Script Inclusion (XSSI)": {
    what: {
      en: "An authenticated endpoint returns dynamic JavaScript (or JSONP, or a JS-parseable response) whose content depends on the user's session and is served without anti-inclusion protection. A malicious site includes it with <script src> so the victim's cookies are sent, then reads the leaked values through global variables, callback functions, or redefined setters. Unlike classic JSON hijacking (bare arrays, now browser-blocked), XSSI against script/JSONP responses can still leak data cross-origin today. Priority varies with how sensitive the leaked data is.",
      simple: "An authenticated endpoint returns JavaScript (or JSONP) whose content depends on your session, with no protection against being embedded. A malicious site loads it with <script src> so the victim's cookies go along, then reads the leaked values. Unlike old JSON hijacking, this can still work today. Severity depends on how sensitive the data is.",
      hi: "कोई authenticated endpoint dynamic JavaScript (या JSONP, या JS-parseable response) लौटाता है जिसका content user के session पर निर्भर है और anti-inclusion protection बिना serve होता है। malicious site उसे <script src> से include करती है ताकि victim की cookies जाएँ, फिर global variables, callback functions, या redefined setters से leaked values पढ़ती है। classic JSON hijacking (bare arrays, अब browser-blocked) से उलट, script/JSONP responses पर XSSI आज भी cross-origin data leak कर सकता है। Priority leaked data कितनी sensitive है उस पर varies।",
    },
    find: [
      {
        title: { en: "Find session-dependent script/JSONP responses", simple: "Find script responses that depend on your session", hi: "session-dependent script/JSONP responses खोजें" },
        steps: [
          { en: "Enumerate endpoints returning Content-Type JavaScript or JSONP whose body varies by the logged-in user (global var assignments, a callback wrapper, object literals).", simple: "Find JS/JSONP endpoints whose output changes based on who is logged in.", hi: "ऐसे endpoints enumerate करें जो JavaScript/JSONP Content-Type लौटाएँ और जिनका body logged-in user के हिसाब से बदले (global var assignments, callback wrapper, object literals)।" },
          { en: "From a different origin, include the URL via <script src> with your own authenticated cookies and attempt to read the data through the global/callback/prototype-setter it exposes.", simple: "From another origin, load it with <script src> using your cookies and try to read the data.", hi: "अलग origin से URL को <script src> से अपनी authenticated cookies के साथ include करें और उसके exposed global/callback/prototype-setter से data पढ़ने की कोशिश करें।" },
          { en: "Confirm in a current browser that the victim-scoped data is actually readable cross-origin, using only your own account.", simple: "Confirm in a modern browser that the data is really readable cross-origin, with your own account.", hi: "current browser में confirm करें कि victim-scoped data सच में cross-origin readable है, सिर्फ़ अपने account से।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs a working cross-origin PoC in a current browser that reads session-scoped data from the script/JSONP response, on your own account, plus the missing protection (no CSRF token on the endpoint, no non-executable prefix like )]}', no CORB/CORP). Priority varies with the sensitivity of what leaks. If the response is static, not session-dependent, or protected by an anti-inclusion prefix / strict content-type and nosniff, it is not exploitable (N/A).",
      simple: "Show a working PoC in a modern browser that reads your session data cross-origin from the script/JSONP response, plus the missing protection. Severity depends on the data. If the response is static or protected with a prefix and nosniff, it is N/A.",
      hi: "Triage को current browser में working cross-origin PoC चाहिए जो script/JSONP response से अपने account का session-scoped data पढ़े, साथ में missing protection (endpoint पर CSRF token नहीं, )]}' जैसा non-executable prefix नहीं, CORB/CORP नहीं)। Priority leak की sensitivity पर varies। अगर response static, non-session-dependent, या anti-inclusion prefix/strict content-type+nosniff से protected हो, तो exploit नहीं (N/A)।",
    },
    references: [
      { label: "HackTricks: XSSI (Cross-Site Script Inclusion)", url: "https://book.hacktricks.xyz/pentesting-web/xssi-cross-site-script-inclusion" },
    ],
  },

  "Sensitive Data Exposure › Disclosure of Secrets › PII Leakage/Exposure": {
    what: {
      en: "The application exposes personally identifiable information — names tied to emails, phone numbers, addresses, government ids, financial data, health data — to a party not entitled to it, whether through an API response, a misconfigured endpoint, enumeration, or a public artifact. The severity varies sharply with the data type (a public display name vs a national id/financial record) and the scale (one record vs bulk/enumerable). Triage scores it on sensitivity and number of affected individuals.",
      simple: "The app exposes personal data — names with emails, phone numbers, addresses, government ids, financial or health data — to someone who should not see it, via an API, a misconfig, enumeration, or a public file. Severity depends heavily on how sensitive the data is and how many people are affected.",
      hi: "Application personally identifiable information expose करता है — emails से जुड़े names, phone numbers, addresses, government ids, financial data, health data — ऐसे party को जिसका हक़ नहीं, चाहे API response, misconfigured endpoint, enumeration, या public artifact से। severity data type (public display name बनाम national id/financial record) और scale (एक record बनाम bulk/enumerable) से तेज़ी से varies। Triage sensitivity और affected individuals की संख्या पर score करता है।",
    },
    find: [
      {
        title: { en: "Locate and scope the PII exposure", simple: "Find and measure the PII leak", hi: "PII exposure ढूंढें और scope करें" },
        steps: [
          { en: "Inspect API responses, exports, and misconfigured endpoints for PII fields that the requesting party should not receive (test with your own two accounts).", simple: "Check API responses and exports for personal data you should not get, using your own accounts.", hi: "API responses, exports, misconfigured endpoints में PII fields देखें जो requesting party को नहीं मिलने चाहिए (अपने दो accounts से test करें)।" },
          { en: "Determine whether the exposure is one record or bulk/enumerable (sequential ids, unpaginated list, search without authz) — scale drives severity.", simple: "Check if it is one record or many (guessable ids, open list) — scale sets severity.", hi: "तय करें exposure एक record है या bulk/enumerable (sequential ids, unpaginated list, बिना authz search) — scale severity तय करता है।" },
          { en: "Classify the most sensitive field exposed (contact info vs national id / financial / health), using only your own or clearly synthetic data.", simple: "Note the most sensitive field leaked, using only your own or fake data.", hi: "सबसे sensitive exposed field classify करें (contact info बनाम national id/financial/health), सिर्फ़ अपने या clearly synthetic data से।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the exposed PII fields, the access path (how an unentitled party reaches them), and the scope (single vs bulk/enumerable) — demonstrated with your own test accounts or synthetic data, never real users' data. Priority varies: a small leak of low-sensitivity data can be low or N/A, while bulk exposure of government/financial/health data is high. Do not collect or store real individuals' PII to prove it.",
      simple: "Show which PII fields leak, how an unentitled party reaches them, and whether it is one record or many — using your own or fake accounts, never real users' data. Severity varies: a tiny low-sensitivity leak may be N/A; bulk sensitive data is high. Do not collect real people's data.",
      hi: "Triage को exposed PII fields, access path (unentitled party कैसे पहुँचता है), और scope (single बनाम bulk/enumerable) चाहिए — अपने test accounts या synthetic data से demonstrate करें, कभी real users का data नहीं। Priority varies: low-sensitivity data का छोटा leak low/N/A हो सकता है, जबकि government/financial/health data का bulk exposure high है। साबित करने को real individuals का PII collect/store न करें।",
    },
    escalate: {
      en: "Bulk/enumerable PII (sequential ids, authz-less list/search) scales the severity up sharply versus a single record; if reached via a broken authorization check it is also an access-control (IDOR) finding and may score there.",
      simple: "Bulk or enumerable PII is much higher than a single record; if it comes from a broken authz check, it is also an IDOR finding.",
      hi: "bulk/enumerable PII (sequential ids, authz-less list/search) एक record के मुक़ाबले severity तेज़ी से बढ़ाता है; broken authorization check से पहुँचे तो यह access-control (IDOR) finding भी है और वहाँ score हो सकता है।",
    },
  },

  "Using Components with Known Vulnerabilities › Captcha Bypass › OCR (Optical Character Recognition)": {
    what: {
      en: "A visual (text-image) CAPTCHA is defeated by running the challenge image through OCR, because the CAPTCHA is weak enough — clean glyphs, low distortion, no segmentation resistance — that automated recognition solves it reliably. The control meant to stop automation is therefore ineffective. On its own a solvable CAPTCHA is informational; its impact comes entirely from what the CAPTCHA was protecting (spam, brute force, scraping).",
      simple: "A text-image CAPTCHA is beaten by feeding the image to OCR, because it is too clean and simple for OCR to fail. So the control meant to block bots does not work. Alone it is informational — the impact is whatever the CAPTCHA was protecting.",
      hi: "कोई visual (text-image) CAPTCHA challenge image को OCR से चलाकर defeat किया जाता है, क्योंकि CAPTCHA इतना कमज़ोर है — clean glyphs, कम distortion, कोई segmentation resistance नहीं — कि automated recognition भरोसेमंद रूप से solve कर देता है। automation रोकने वाला control इसलिए ineffective है। अकेले solvable CAPTCHA informational है; impact पूरी तरह इस पर कि CAPTCHA क्या protect कर रहा था (spam, brute force, scraping)।",
    },
    find: [
      {
        title: { en: "Automate solving the CAPTCHA with OCR", simple: "Solve the CAPTCHA with OCR", hi: "OCR से CAPTCHA solve automate करें" },
        steps: [
          { en: "Collect several CAPTCHA images from the target flow and run them through an OCR engine (e.g. Tesseract) with light preprocessing.", simple: "Grab some CAPTCHA images and run them through OCR like Tesseract.", hi: "target flow से कुछ CAPTCHA images इकट्ठा करें और हल्के preprocessing के साथ OCR engine (जैसे Tesseract) से चलाएं।" },
          { en: "Measure the solve rate over a sample; a reliably high rate shows the CAPTCHA is defeatable by automation.", simple: "Measure how often OCR solves it; a high rate proves it is defeatable.", hi: "sample पर solve rate मापें; भरोसेमंद ऊँचा rate दिखाता है CAPTCHA automation से defeatable है।" },
          { en: "Show the solved tokens are accepted by the endpoint the CAPTCHA guards, using your own account/benign requests.", simple: "Show the solved answers are accepted by the protected endpoint, using benign requests.", hi: "दिखाएं solved tokens को CAPTCHA जिस endpoint को guard करता है वह स्वीकार करता है, अपने account/benign requests से।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs a demonstrated OCR solve rate high enough to defeat the CAPTCHA and evidence the solved responses are accepted by the guarded endpoint — shown with benign requests, not an actual abuse campaign. Alone this is informational (P5) and usually not rewarded; it becomes meaningful only when you also demonstrate the downstream abuse the CAPTCHA was supposed to prevent (e.g. credential brute force or mass account creation), which is the real, separately-scored finding.",
      simple: "Show OCR solving the CAPTCHA reliably and that the answers are accepted, using safe requests. Alone it is informational and usually not paid — it matters only when you also show the abuse it was meant to stop, like brute force, which is the real finding.",
      hi: "Triage को इतना ऊँचा OCR solve rate चाहिए कि CAPTCHA defeat हो और सबूत कि solved responses guarded endpoint स्वीकार करता है — benign requests से दिखाएं, असली abuse campaign नहीं। अकेले यह informational (P5) और आम तौर पर unrewarded; मायने तभी जब साथ में वह downstream abuse दिखाएं जो CAPTCHA रोकने वाला था (जैसे credential brute force या mass account creation), जो असली, अलग score होने वाली finding है।",
    },
  },

  "Using Components with Known Vulnerabilities › Outdated Software Version": {
    what: {
      en: "A server-side component — web server, framework, CMS, language runtime, or library — advertises an old version (via banner, header, or fingerprint) that has publicly known vulnerabilities. A version string alone only indicates potential exposure; it is not proof the instance is exploitable (patches may be backported, the vulnerable path may be unreachable). Bugcrowd rates the bare version disclosure informational; the reward comes from proving an actual known CVE is exploitable on this instance.",
      simple: "A server component shows an old version (in a banner, header, or fingerprint) that has known CVEs. But a version number alone does not prove the system is actually exploitable — patches may be backported. So the bare 'old version' is informational; you get paid by proving a real CVE works here.",
      hi: "कोई server-side component — web server, framework, CMS, language runtime, या library — पुराना version दिखाता है (banner, header, या fingerprint से) जिसमें publicly known vulnerabilities हैं। अकेला version string सिर्फ़ potential exposure बताता है; यह सबूत नहीं कि instance exploitable है (patches backport हो सकते हैं, vulnerable path unreachable हो सकता है)। Bugcrowd bare version disclosure को informational रेट करता है; reward असली known CVE को इस instance पर exploitable साबित करने से आता है।",
    },
    find: [
      {
        title: { en: "Fingerprint the version, then verify exploitability", simple: "Find the version, then prove it is exploitable", hi: "version fingerprint करें, फिर exploitability verify करें" },
        steps: [
          { en: "Fingerprint the component and version from Server/X-Powered-By headers, error pages, static asset hashes, or a tool like Wappalyzer/nuclei tech detection.", simple: "Identify the component and version from headers, errors, or a tech-detection tool.", hi: "component और version को Server/X-Powered-By headers, error pages, static asset hashes, या Wappalyzer/nuclei tech detection से fingerprint करें।" },
          { en: "Map the version to known CVEs, then confirm the vulnerable feature/path is actually present and reachable on this instance (not backport-patched).", simple: "Match the version to CVEs, then check the vulnerable feature is actually reachable here.", hi: "version को known CVEs से map करें, फिर confirm करें vulnerable feature/path इस instance पर actually मौजूद और reachable है (backport-patched नहीं)।" },
          { en: "Where safe and in scope, demonstrate the specific CVE with a benign proof rather than resting on the version banner alone.", simple: "If safe and in scope, show the actual CVE working with a harmless proof, not just the version.", hi: "जहाँ safe और in scope हो, specific CVE को benign proof से demonstrate करें, सिर्फ़ version banner पर न टिकें।" },
        ],
      },
    ],
    proof: {
      en: "A version banner alone is informational (P5) and routinely closed as 'no demonstrated impact'. To be rewarded, show which specific known CVE applies and that it is actually exploitable (or at least clearly reachable) on this instance with a benign PoC. Backported patches, unreachable vulnerable code, or a spoofed/incidental banner make it N/A. Report the demonstrated CVE as its own finding at its own severity.",
      simple: "A version number alone is informational and usually closed as no impact. To get paid, show a specific CVE actually works here with a harmless PoC. Backported patches or an unreachable bug make it N/A.",
      hi: "अकेला version banner informational (P5) और आम तौर पर 'no demonstrated impact' बंद होता है। reward के लिए दिखाएं कौन सा specific known CVE लागू है और वह इस instance पर benign PoC से actually exploitable (या कम से कम clearly reachable) है। backported patches, unreachable vulnerable code, या spoofed/incidental banner इसे N/A करते हैं। demonstrated CVE को अपनी severity पर अलग finding के रूप में report करें।",
    },
  },

  "Using Components with Known Vulnerabilities › Rosetta Flash": {
    what: {
      en: "Rosetta Flash (CVE-2014-4671) is a legacy JSONP attack: an attacker crafts a JSONP callback value made entirely of alphanumeric characters that is also a valid Flash (SWF) file, so an endpoint reflecting the callback serves an attacker-controlled SWF from the victim's origin, bypassing the Same-Origin Policy to steal data. It depends on Flash Player, which is end-of-life and removed from modern browsers, so it is essentially non-exploitable today and listed as informational.",
      simple: "Rosetta Flash (CVE-2014-4671) is an old JSONP trick: the attacker makes a JSONP callback that is also a valid Flash file, so a JSONP endpoint serves attacker Flash from the victim's domain and bypasses Same-Origin Policy. It needs Flash Player, which no longer exists in modern browsers, so it is basically dead today — informational.",
      hi: "Rosetta Flash (CVE-2014-4671) एक legacy JSONP attack है: attacker ऐसा JSONP callback value बनाता है जो पूरी तरह alphanumeric हो और साथ ही valid Flash (SWF) file हो, तो callback reflect करता endpoint victim के origin से attacker-controlled SWF serve करता है, Same-Origin Policy bypass करके data चुराता है। यह Flash Player पर निर्भर है, जो end-of-life और modern browsers से हटा दिया गया है, इसलिए आज essentially non-exploitable और informational लिस्ट है।",
    },
    find: [
      {
        title: { en: "Check for a reflective JSONP endpoint (legacy)", simple: "Check for a JSONP endpoint (legacy)", hi: "reflective JSONP endpoint (legacy) देखें" },
        steps: [
          { en: "Identify endpoints that reflect a user-supplied JSONP callback into the response body without a leading non-callback prefix or restrictive content-type.", simple: "Find JSONP endpoints that echo your callback value into the response.", hi: "ऐसे endpoints पहचानें जो user-supplied JSONP callback को बिना non-callback prefix या restrictive content-type के response body में reflect करें।" },
          { en: "Note that exploitation requires Flash Player in the victim's browser; since that no longer exists, confirm there is no realistic modern impact.", simple: "Note that it needs Flash Player, which no longer exists, so there is no real modern impact.", hi: "ध्यान दें exploitation को victim के browser में Flash Player चाहिए; चूँकि वह अब नहीं है, confirm करें कोई realistic modern impact नहीं।" },
        ],
      },
    ],
    proof: {
      en: "There is no modern exploitation path — Flash Player is removed from all current browsers, so Rosetta Flash is non-exploitable and reports are N/A/informational (P5). If you find a reflective JSONP endpoint, pivot to a still-relevant issue instead (XSSI/JSON data leakage, or a content-type/reflection problem that enables XSS), and report that rather than Rosetta Flash.",
      simple: "There is no way to exploit it now — Flash is gone from browsers, so it is N/A/informational. If you find a reflective JSONP endpoint, look for a current issue instead (XSSI or an XSS from the reflection) and report that.",
      hi: "कोई modern exploitation path नहीं — Flash Player सभी current browsers से हटा दिया गया है, तो Rosetta Flash non-exploitable और reports N/A/informational (P5)। अगर reflective JSONP endpoint मिले, तो अभी भी relevant issue पर pivot करें (XSSI/JSON data leakage, या content-type/reflection समस्या जो XSS enable करे) और वही report करें, Rosetta Flash नहीं।",
    },
    references: [
      { label: "MITRE: CVE-2014-4671 (Rosetta Flash)", url: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2014-4671" },
    ],
  },

  "Using Components with Known Vulnerabilities › Unpatched Javascript Libraries": {
    what: {
      en: "The front end loads a client-side JavaScript library (jQuery, Angular, Lodash, a UI widget, etc.) at a version with publicly known vulnerabilities — typically a prototype-pollution, ReDoS, or DOM-XSS sink flagged by tools like Retire.js. The version being vulnerable is only potential risk; real impact requires the specific vulnerable function to be reachable with attacker-controlled input in this application. Bugcrowd rates the bare detection informational, and triage expects a demonstrated path to actual impact.",
      simple: "The site loads a JavaScript library (jQuery, Angular, Lodash, etc.) at a version with known bugs — often prototype pollution, ReDoS, or DOM-XSS, flagged by Retire.js. But a vulnerable version alone is only potential risk; it matters only if the vulnerable function is actually reachable with attacker input here. So bare detection is informational.",
      hi: "Front end कोई client-side JavaScript library (jQuery, Angular, Lodash, UI widget आदि) ऐसे version पर load करता है जिसमें publicly known vulnerabilities हैं — आम तौर पर prototype-pollution, ReDoS, या DOM-XSS sink, जिसे Retire.js जैसे tools flag करते हैं। version का vulnerable होना सिर्फ़ potential risk है; असली impact के लिए specific vulnerable function का इस application में attacker-controlled input से reachable होना ज़रूरी है। Bugcrowd bare detection को informational रेट करता है, और triage actual impact का demonstrated path चाहता है।",
    },
    find: [
      {
        title: { en: "Detect the library, then prove the sink is reachable", simple: "Find the old library, then show the bug is reachable", hi: "library detect करें, फिर sink reachable साबित करें" },
        steps: [
          { en: "Run Retire.js (or inspect loaded script versions) to list client-side libraries with known CVEs and the specific vulnerability each has.", simple: "Use Retire.js to list old libraries and their known bugs.", hi: "Retire.js चलाएं (या loaded script versions inspect करें) ताकि known CVEs वाली client-side libraries और हर की specific vulnerability की list बने।" },
          { en: "For a flagged flaw, trace whether the vulnerable function is actually called with input you can control (e.g. $.html() with your string, a prototype-pollution gadget reachable from a URL param).", simple: "Check if the vulnerable function is actually called with input you control.", hi: "किसी flagged flaw के लिए trace करें vulnerable function आपके control वाले input से actually call होता है या नहीं (जैसे $.html() आपकी string के साथ, या URL param से reachable prototype-pollution gadget)।" },
          { en: "If reachable, demonstrate the concrete impact (DOM-XSS execution, a polluted property changing behaviour) with a benign canary, on your own session.", simple: "If reachable, show the real impact (like DOM-XSS) with a harmless marker, on your own session.", hi: "अगर reachable हो, तो concrete impact (DOM-XSS execution, polluted property से behaviour बदलना) benign canary से अपने session पर demonstrate करें।" },
        ],
      },
    ],
    proof: {
      en: "A Retire.js hit or version banner alone is informational (P5) and routinely rejected as 'no demonstrated impact'. To be rewarded, show the specific vulnerable function is reachable with attacker-controlled input and demonstrate the concrete consequence (DOM-XSS firing with a benign payload, a prototype-pollution gadget altering behaviour). If the vulnerable code path is never reached in this app, it is N/A — report the demonstrated DOM-XSS/pollution as its own finding at its real severity.",
      simple: "A Retire.js hit alone is informational and usually rejected as no impact. To get paid, show the vulnerable function is actually reachable with your input and demonstrate the real effect (DOM-XSS with a harmless payload). If the bad code is never reached here, it is N/A.",
      hi: "अकेला Retire.js hit या version banner informational (P5) और आम तौर पर 'no demonstrated impact' reject होता है। reward के लिए दिखाएं specific vulnerable function attacker-controlled input से reachable है और concrete consequence demonstrate करें (benign payload से DOM-XSS, या prototype-pollution gadget से behaviour बदलना)। अगर vulnerable code path इस app में कभी reach नहीं होता, तो N/A — demonstrated DOM-XSS/pollution को अपनी असली severity पर अलग finding के रूप में report करें।",
    },
    references: [
      { label: "OWASP: Vulnerable and Outdated Components", url: "https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/" },
    ],
  },
};
