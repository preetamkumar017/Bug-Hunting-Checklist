import type { TopicContent } from "@/learn/data/types";

// Per-leaf trilingual lesson content, keyed by FULL Bugcrowd VRT path.
export const webInjectionTopics: Record<string, TopicContent> = {
  "Client-Side Injection › Binary Planting › Default Folder Privilege Escalation": {
    what: {
      en: "A client application or service searches for missing DLLs or executables in a standard default directory (such as %TEMP%, C:\\ProgramData, or an unquoted service path with spaces in C:\\Program Files) where an unprivileged local user has write permissions. When a privileged service (SYSTEM/Administrator) executes, it loads the attacker's plant before the legitimate binary, leading to local privilege escalation.",
      simple: "An installer or system service looks for a helper program in a shared folder where regular users can drop files. When the admin service runs, it runs the dropped file as admin.",
      hi: "कोई privileged system service या installer standard default folder (जैसे C:\\ProgramData या unquoted service path) से DLL/executable ढूँढता है जहाँ normal user write कर सकता है। जब privileged service चलती है तो attacker की file execute होकर local privilege escalation (LPE) हो जाती है।",
    },
    find: [
      {
        title: { en: "Audit DLL search order and service binpaths with Process Monitor", simple: "Check what files the service looks for using ProcMon", hi: "ProcMon से service की DLL search order और paths चेक करें" },
        steps: [
          { en: "Run ProcMon with filters: `Process Name is target.exe` and `Result is NAME NOT FOUND` and `Path ends with .dll`.", simple: "Use ProcMon to watch the app look for missing DLL files.", hi: "ProcMon में filter लगाएँ: target.exe और 'NAME NOT FOUND' जो .dll पर ख़त्म होते हों।" },
          { en: "Verify if any searched path resides in a default folder with write permissions for low-privileged users (e.g., standard world-writable paths or default app directories).", simple: "Check if low-privilege users can write into that missing folder.", hi: "चेक करें कि क्या low-privileged user उस missing directory में file create कर सकता है।" },
          { en: "Drop a benign tracking DLL (e.g. one that writes a log file) and trigger the service restart to confirm privileged execution.", simple: "Place a safe test DLL and restart the service to see if it loads.", hi: "एक safe test DLL drop करें और service restart करके confirm करें कि वह load हुई।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs: the service/process name, default folder path with weak ACLs (icacls output showing (M) or (W) for Users), ProcMon event showing the DLL being loaded by SYSTEM, and proof of elevated code execution (e.g. whoami output written to a file). If write access requires Administrator already, this is N/A.",
      simple: "Show the vulnerable service, folder permissions allowing normal users to write, and proof that the service ran your test file as SYSTEM. If you already need admin to write there, it does not count.",
      hi: "Triage को service name, folder ACLs (icacls output), ProcMon capture, और elevated execution का proof (whoami output) चाहिए। अगर write करने के लिए पहले से admin चाहिए तो यह N/A है।",
    },
    escalate: {
      en: "If the plant can be executed on boot without user interaction, highlight the persistence and unattended SYSTEM execution to secure P3.",
      simple: "Show that it triggers on computer boot without any user clicking anything.",
      hi: "अगर system boot पर बिना user interaction के execute हो जाए तो persistence साबित करें।",
    },
    cwe: "CWE-427: Uncontrolled Search Path Element",
    references: [
      { label: "MITRE ATT&CK: Hijack Execution Flow", url: "https://attack.mitre.org/techniques/T1574/" },
    ],
  },

  "Client-Side Injection › Binary Planting › No Privilege Escalation": {
    what: {
      en: "A desktop application searches for and loads a DLL or binary from a user-writable directory, but executes entirely in the security context of the current interactive user without crossing any integrity or permission boundary. Because the attacker could already run arbitrary code as that same user, there is no privilege escalation.",
      simple: "An app loads a file from your own user folder, but it just runs as your own user. You gain no new permissions that you didn't already have.",
      hi: "App user-writable directory से binary load करती है पर उसी current user context में execute होती है। कोई privilege boundary cross नहीं होती, इसलिए कोई elevation नहीं है।",
    },
    find: [
      {
        title: { en: "Examine execution token of planted binary", simple: "Check the user permissions of the running process", hi: "Running process के user permissions चेक करें" },
        steps: [
          { en: "Plant a test binary in the user-writable folder queried by the target process.", simple: "Drop a test file into the user directory.", hi: "User-writable folder में test binary रखें।" },
          { en: "Execute the application and inspect the resulting process token in Process Explorer.", simple: "Launch the app and check who owns the new process in Process Explorer.", hi: "Process Explorer में check करें कि process किस user token के तहत चला।" },
          { en: "Observe that the integrity level is Medium (standard user) and the SID matches the current logged-in user.", simple: "See that it runs at standard user level, matching your current account.", hi: "देखें कि integrity level standard user ही रहता है, कोई escalation नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates this P5 (Informational). Triage will close this as informative because no privilege boundary is breached. To make it actionable, you must prove elevation to SYSTEM/Administrator or execution across different user sessions.",
      simple: "This is P5 informative because no extra permissions were gained. You need to show it reaches admin or another user account.",
      hi: "यह P5 Informational है क्योंकि कोई privilege boundary cross नहीं हुई। इसे valid बनाने के लिए Administrator या दूसरे user का access दिखाना ज़रूरी है।",
    },
    cwe: "CWE-427: Uncontrolled Search Path Element",
  },

  "Client-Side Injection › Binary Planting › Non-Default Folder Privilege Escalation": {
    what: {
      en: "A privileged application or installer attempts to load an executable or DLL from a non-default, customized installation directory or secondary drive where permissions were loosened or altered by external factors (custom user install, manual permission changes) rather than the application's out-of-the-box defaults.",
      simple: "An installer loads a helper program from a custom or unusual folder created with loose permissions, running it as admin.",
      hi: "Privileged application किसी non-default या custom folder से file load करती है जहाँ permissions custom install या manual configuration की वजह से loose थीं।",
    },
    find: [
      {
        title: { en: "Verify non-default path resolution and execution", simple: "Check if non-standard install paths have weak permissions", hi: "Non-standard install paths में permissions चेक करें" },
        steps: [
          { en: "Install the software choosing a custom directory (e.g. C:\\CustomApp or D:\\Apps).", simple: "Install the app into a custom folder.", hi: "App को किसी custom folder में install करें।" },
          { en: "Audit the directory ACLs to see if non-standard inherited permissions allow low-privilege file creation.", simple: "Check if regular users can add files to that custom folder.", hi: "चेक करें कि क्या low-privilege user उस directory में file create कर सकता है।" },
          { en: "Inspect whether a privileged service looks for missing libraries in that location.", simple: "Check if an admin service looks for missing DLLs there.", hi: "देखें कि क्या कोई privileged service वहाँ missing DLL ढूँढती है।" },
        ],
      },
    ],
    proof: {
      en: "Rated P5 by default in Bugcrowd VRT because non-default directory permissions often rely on administrator configuration errors rather than vendor vulnerabilities. To report successfully, prove that the vendor's official installer created those permissive ACLs automatically when selecting a non-default path.",
      simple: "Usually P5 because custom folder permissions are seen as user error. Prove that the vendor installer itself set the weak permissions.",
      hi: "Bugcrowd VRT में यह P5 है क्योंकि custom paths अक्सर user misconfiguration माने जाते हैं। साबित करें कि vendor के installer ने खुद कमजोर permissions सेट की थीं।",
    },
    cwe: "CWE-427: Uncontrolled Search Path Element",
  },

  "Cross-Site Scripting (XSS) › Stored › Non-Privileged User to Anyone": {
    what: {
      en: "A regular, unprivileged user submits arbitrary JavaScript into a persistent data store (comments, profile fields, forum posts, support tickets) which is subsequently rendered unencoded in the browser of any visiting user, including administrators. This allows universal session hijacking, forced actions, or full client-side takeover without requiring victim interaction beyond visiting the page.",
      simple: "A normal user posts a comment or bio with malicious script. When anyone else (including the site admin) views that page, the script runs in their browser automatically.",
      hi: "एक normal user profile, comment या ticket में JavaScript save कर देता है। जब कोई भी दूसरा user या admin वह page खोलता है, तो script बिना sanitize हुए execute हो जाती है और session hijack हो सकता है।",
    },
    find: [
      {
        title: { en: "Inject persistent canary payloads across unprivileged input fields", simple: "Save unique test script tags in public fields and check public pages", hi: "Public fields में test script save करें और public page पर check करें" },
        steps: [
          { en: "From a low-privilege account, inject a benign tracking canary into all profile, bio, review, and comment inputs: `\"><b id=canary-stored>test</b>`.", simple: "Type a safe HTML test tag into your user bio or comment box.", hi: "Low-privilege account से bio या comment में safe HTML tag inject करें।" },
          { en: "Log in with a second distinct account (or incognito window) and browse to the public page displaying that content.", simple: "Open that profile or comment from a completely different account.", hi: "दूसरे account से उस public page को open करें।" },
          { en: "Inspect the DOM to verify if the canary rendered as raw HTML elements rather than sanitized text entities (`&lt;b...`).", simple: "Right click Inspect to see if the tag executed as real HTML.", hi: "Inspect Element करके देखें कि क्या tag raw HTML की तरह render हुआ।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs: the input field and endpoint used by Account A, the public URL where Account B views the unencoded payload, a non-destructive PoC (`print()` or DOM element creation), and the HTTP request/response showing raw unescaped reflection. Do not use alert(1) if blocked; document the DOM context.",
      simple: "Show where Account A saved the code, and how Account B's browser executes it just by opening the page. Provide screenshots of the DOM context.",
      hi: "Account A द्वारा payload save करने की request, Account B के browser में DOM execution का screenshot, और raw HTTP response दिखाएँ।",
    },
    escalate: {
      en: "If the stored XSS executes in an admin-only backoffice or panel, document that it triggers on privileged administrators to confirm P2 severity.",
      simple: "Show that the payload triggers when an administrator views customer support tickets or user management.",
      hi: "अगर admin panel या support dashboard में trigger हो तो admin context साबित करके P2 confirm करें।",
    },
    references: [
      { label: "PortSwigger Web Security: Stored XSS", url: "https://portswigger.net/web-security/cross-site-scripting/stored" },
    ],
  },

  "Cross-Site Scripting (XSS) › Stored › CSRF/URL-Based": {
    what: {
      en: "A stored XSS payload can be written to the application, but only via a state-changing request that lacks CSRF protection or can be triggered via URL parameters (e.g. GET-based state changes). An attacker cannot directly plant the payload in other accounts; they must trick a victim into submitting the request via CSRF or clicking a crafted link to store it in their own account context.",
      simple: "A stored XSS exists, but saving it requires tricking the victim into submitting a form via CSRF or clicking a specific link. The attacker cannot plant it directly.",
      hi: "Stored XSS मौजूद है पर उसे store करने के लिए victim से CSRF attack करवाना पड़ता है या crafted link click करवाना पड़ता है। Attacker direct payload store नहीं कर सकता।",
    },
    find: [
      {
        title: { en: "Test storage endpoint for missing anti-CSRF tokens", simple: "Check if the form that saves the payload lacks CSRF protection", hi: "Payload save करने वाले form में CSRF token की जाँच करें" },
        steps: [
          { en: "Identify a field vulnerable to stored XSS (e.g. account display name or notes).", simple: "Find an input that stores HTML without escaping.", hi: "ऐसा field पहचानें जो unescaped HTML store करता हो।" },
          { en: "Check if the saving POST/PUT request enforces a valid CSRF token and strict SameSite cookies.", simple: "See if the save request can be made from another website without CSRF tokens.", hi: "चेक करें कि क्या save request बिना CSRF token के replay हो सकती है।" },
          { en: "Build a cross-origin HTML form PoC that auto-submits the XSS payload into the victim's account.", simple: "Create a test webpage that auto-submits the payload into the victim account.", hi: "एक test HTML page बनाएँ जो victim के account में payload auto-submit करे।" },
        ],
      },
    ],
    proof: {
      en: "Triage requires: the working CSRF PoC HTML, demonstration that the victim's account saves the payload upon visiting the attacker page, and proof of subsequent execution. If SameSite=Strict cookies block cross-site submission, this is N/A.",
      simple: "Provide the CSRF PoC form, show it saves the payload into the victim's profile, and show the script executing.",
      hi: "CSRF PoC HTML page, victim के account में payload save होने का proof, और script execute होने का screenshot दें।",
    },
    references: [
      { label: "PortSwigger: CSRF to XSS chaining", url: "https://portswigger.net/web-security/csrf" },
    ],
  },

  "Cross-Site Scripting (XSS) › Off-Domain › Data URI": {
    what: {
      en: "The application redirects to or renders a user-controlled link containing a `data:` URI scheme (e.g., `data:text/html;base64,...`). When visited in legacy browsers or embedded in sandboxed frames, the data URI executes script with a null origin, or in older engines, within the parent domain's context.",
      simple: "The app lets you set a link starting with `data:text/html` instead of `https://`. When clicked, the browser loads the inline HTML/script.",
      hi: "App user-controlled link में `data:` URI scheme (जैसे data:text/html) allow करती है। Click करने पर browser inline script execute कर देता है, जो null origin या sandboxed context में चलती है।",
    },
    find: [
      {
        title: { en: "Test URL input fields for data scheme acceptance", simple: "Put data: URLs into link fields and check output", hi: "URL fields में data: scheme डालकर check करें" },
        steps: [
          { en: "Supply `data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==` in profile website, redirect_url, or document link fields.", simple: "Enter a data: URL into a website or link field.", hi: "Website या redirect field में base64 data: URL inject करें।" },
          { en: "Verify if the application validates schemes strictly against `http://` and `https://`.", simple: "Check if the app rejects anything that is not http or https.", hi: "चेक करें कि क्या app सिर्फ http/https allow करती है या data: भी accept कर लेती है।" },
          { en: "Click the rendered link or trigger the redirect and observe how modern browsers handle the origin (typically `null`).", simple: "Click the link and inspect the document origin in DevTools.", hi: "Link click करके DevTools में document origin (`null`) verify करें।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs: the input field accepting `data:`, the rendered HTML link element `<a href=\"data:...\">`, and proof of execution. Because modern browsers isolate `data:` URIs in a unique opaque/null origin that cannot access parent cookies or localStorage, Bugcrowd classifies this as P4.",
      simple: "Show the field accepting data: URIs and the browser executing it. Note that modern browsers give data: URLs a null origin without access to site cookies.",
      hi: "Data: URI accept करने वाला field, rendered `<a href>` tag, और execution proof दिखाएँ। ध्यान रखें कि modern browsers में origin null रहता है।",
    },
  },

  "Cross-Site Scripting (XSS) › Stored › Privileged User to No Privilege Elevation": {
    what: {
      en: "A stored XSS vulnerability exists in a configuration field, setting, or template that can only be authored and modified by an administrator, and which only ever renders within the administrator's own session or to other administrators of the exact same privilege tier. No elevation of privilege occurs.",
      simple: "An admin can inject script into an admin-only setting, but only other admins of the same level see it. No non-admin gets promoted and no new power is unlocked.",
      hi: "Admin-only settings या templates में stored XSS होता है जो सिर्फ उसी admin या समान level के admins को दिखाई देता है। किसी low-privilege user का access नहीं बढ़ता।",
    },
    find: [
      {
        title: { en: "Inject payloads in high-privilege configuration fields", simple: "Test admin settings for unescaped HTML", hi: "Admin settings में unescaped HTML inject करें" },
        steps: [
          { en: "As an Administrator, inject HTML/JS canaries into system settings, email template editors, or organization configuration fields.", simple: "Put a test script tag in company name or system settings as admin.", hi: "Admin account से system settings या email templates में test tag डालें।" },
          { en: "Check if any lower-privileged user role (e.g. Member, Viewer, or unauthenticated visitor) can view that rendered field.", simple: "Check if a regular user can see that setting anywhere.", hi: "चेक करें कि क्या कोई low-privilege user उस field को कहीं देख पाता है।" },
          { en: "Confirm that only peers of the same administrator role can view and execute the script.", simple: "Notice that only administrators ever see the rendered content.", hi: "देखें कि सिर्फ admin role वाले users ही उस content को access कर पाते हैं।" },
        ],
      },
    ],
    proof: {
      en: "Triage rates this P4 because the author already possesses full administrative authority over the system. Triage needs proof of the injection and confirmation that no lower-privileged account is affected. If you find a way for a non-admin to view it, report as P2.",
      simple: "Provide the vulnerable admin field and demonstrate the script running. Acknowledge that the attacker already had full admin rights.",
      hi: "Admin field में injection और execution का proof दें। यह acknowledge करें कि attacker के पास पहले से full admin rights थे।",
    },
    escalate: {
      en: "If the injected template renders on public login screens or customer-facing invoices, demonstrate the victim reach to escalate to P2.",
      simple: "Show that regular customers or visitors see the infected template.",
      hi: "अगर वह template customer invoices या public pages पर दिखे तो P2 escalate करें।",
    },
  },

  "Cross-Site Scripting (XSS) › Referer": {
    what: {
      en: "The application takes the HTTP `Referer` header from an incoming request and reflects it unencoded into the HTML response (e.g., in a 'Back to previous page' link or error page). An attacker can host a malicious webpage that triggers navigation to the target with an arbitrary payload in the URL, reflecting the script into the victim's session.",
      simple: "The website takes the previous page address (Referer header) and puts it directly into a 'Back' button without cleaning it, allowing script injection.",
      hi: "Website HTTP Referer header की value को 'Back to page' link या error message में बिना sanitize किए print कर देती है। Attacker crafted URL से link करवाकर script execute करवा सकता है।",
    },
    find: [
      {
        title: { en: "Test Referer reflection across 404 and redirect pages", simple: "Send custom Referer headers and check if they appear in the HTML", hi: "Custom Referer header भेजकर response में reflection चेक करें" },
        steps: [
          { en: "Send a request in Burp Suite with: `Referer: https://example.com/?test=\"><script>confirm(1)</script>`.", simple: "Add a test payload inside the Referer header in Burp Suite.", hi: "Burp Suite में Referer header में payload लगाकर request भेजें।" },
          { en: "Inspect the response body for unescaped instances of the payload, especially inside `<a href=\"...\">` back-links.", simple: "Search the response to see if the script appears unescaped in HTML.", hi: "Response में देखें कि क्या payload bina escape हुए `<a href>` tag में आया।" },
          { en: "Verify browser feasibility: test whether modern browser Referrer-Policy (e.g. `strict-origin-when-cross-origin`) truncates the path/query cross-origin.", simple: "Check if modern browsers strip the payload when linking from an attacker site.", hi: "चेक करें कि क्या browser की Referrer-Policy cross-origin navigation पर path strip तो नहीं करती।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs: the HTTP request/response showing the reflected Referer, and a working cross-origin HTML proof of concept showing how the victim's browser can be induced to send the payload despite modern Referrer-Policy controls. If browser policies strip the path/query, impact is reduced.",
      simple: "Show the HTTP traffic reflecting the Referer and provide an HTML page that triggers it against a victim.",
      hi: "Reflected Referer का HTTP request/response और attacker hosting PoC HTML file दें जो victim के browser से header trigger करवाए।",
    },
  },

  "Cross-Site Scripting (XSS) › Cookie-Based": {
    what: {
      en: "The application reads the value of an HTTP cookie (e.g., a tracking, language, or theme cookie) and reflects it unescaped into the HTML response. Exploitation requires setting or poisoning the victim's cookie, typically requiring an existing CRLF injection, subdomain cookie-tossing, or man-in-the-middle capability.",
      simple: "The site reflects the text inside one of your cookies onto the page. To exploit this against someone else, you first need a way to change their cookies.",
      hi: "Website cookie value (जैसे language या theme cookie) को पढ़ कर HTML response में बिना encode किए render कर देती है। Victim पर attack करने के लिए cookie overwrite/toss करने का gadget चाहिए।",
    },
    find: [
      {
        title: { en: "Audit cookie values reflected in DOM or response", simple: "Change cookie values in Burp to see if HTML reflects them", hi: "Burp में cookie values बदलकर reflection चेक करें" },
        steps: [
          { en: "Identify non-session cookies (e.g., `lang=en`, `theme=dark`, `visited=1`) and tamper with their values: `lang=en\"><svg onload=confirm(1)>`.", simple: "Change a settings cookie to contain an HTML tag.", hi: "Settings cookie (lang, theme) में test tag लगाकर request भेजें।" },
          { en: "Inspect the HTTP response to check if the cookie value is reflected without HTML encoding.", simple: "Look for your tag in the page source.", hi: "Page source में देखें कि क्या cookie value unencoded मिली।" },
          { en: "Check if a cookie-tossing vector exists (e.g., an insecure sibling subdomain or HTTP header injection) to deliver the poisoned cookie to victims.", simple: "Look for a way to force that cookie onto other users.", hi: "देखे कि क्या किसी sibling subdomain से cookie inject की जा सकती है।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates isolated cookie XSS as P5 unless chained with an actionable cookie-setting gadget (e.g. Subdomain Takeover or CRLF Header Injection). Triage requires the reflection evidence and the delivery chain.",
      simple: "Rated P5 alone because you can't easily change other people's cookies. To get paid, chain it with cookie-tossing or header injection.",
      hi: "अकेले यह P5 है क्योंकि दूसरों की cookies बदलना आसान नहीं होता। इसे valid बनाने के लिए CRLF injection या subdomain cookie-tossing के साथ chain करें।",
    },
    escalate: {
      en: "Chain with an open redirect that sets cookies, CRLF injection, or a vulnerable sister subdomain to escalate from P5 to P3.",
      simple: "Combine it with another bug that lets you set cookies on the victim.",
      hi: "CRLF injection या subdomain issue के साथ जोड़कर P3 escalate करें।",
    },
  },

  "Cross-Site Scripting (XSS) › Flash-Based": {
    what: {
      en: "Legacy Adobe Flash (.swf) files hosted on the domain accept parameters (e.g., ExternalInterface.call) that execute JavaScript in the hosting domain's context. Because Adobe Flash was officially deprecated in December 2020 and removed from all modern browsers, this flaw cannot be executed by standard internet users.",
      simple: "An old Flash .swf file on the server has a script injection flaw, but modern web browsers no longer run Flash at all.",
      hi: "पुराने Adobe Flash (.swf) file में ExternalInterface.call injection flaw होता है। चूँकि सभी आधुनिक browsers ने Flash support 2020 में बंद कर दिया, यह modern users पर execute नहीं हो सकता।",
    },
    find: [
      {
        title: { en: "Inspect legacy asset paths for historical SWF files", simple: "Find old .swf files in static directories", hi: "Static directories में पुरानी .swf files ढूँढें" },
        steps: [
          { en: "Locate legacy `.swf` files via directory wordlists or web archives.", simple: "Search for .swf files left on the server.", hi: "Server पर बची हुई .swf files search करें।" },
          { en: "Decompile the SWF using JPEXS Free Flash Decompiler to inspect parameter handling in `ExternalInterface.call`.", simple: "Open the file in a Flash decompiler to check for bad parameters.", hi: "Flash decompiler में parameters और ExternalInterface.call inspect करें।" },
          { en: "Recognize that modern Chrome/Edge/Firefox will refuse to render or execute the SWF plugin.", simple: "Notice that modern browsers will just download the file instead of running it.", hi: "देखें कि modern browser इसे execute करने के बजाय download कर लेते हैं।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates Flash-based XSS as P5 (Informational) or Out of Scope in modern programs because end-user exploitation is blocked by browser architecture. Triage will close reports citing Flash unless a specific embedded runtime is targeted.",
      simple: "Rated P5 / Out of Scope because web browsers removed Flash completely in 2020.",
      hi: "यह P5 / Out of Scope है क्योंकि modern browsers Flash support हटा चुके हैं। Triage इसे informational मानकर बंद कर देता है।",
    },
  },

  "Cross-Site Scripting (XSS) › IE-Only": {
    what: {
      en: "A cross-site scripting vector that relies exclusively on legacy Internet Explorer quirks, deprecated CSS expressions (`expression(...)`), VBScript (`<script language=vbs>`), or IE-specific conditional comments (`<!--[if IE]>`). Modern browsers (Chrome, Edge Chromium, Safari, Firefox) completely ignore these constructs.",
      simple: "A trick that only works in the ancient Internet Explorer browser because of old bugs, but fails in Chrome, Safari, and modern Edge.",
      hi: "XSS vector जो सिर्फ पुराने Internet Explorer के deprecated features (CSS expressions, VBScript) पर निर्भर करता है। Modern browsers इसे पूरी तरह ignore कर देते हैं।",
    },
    find: [
      {
        title: { en: "Identify browser-specific styling or tag execution", simple: "Test if the payload only triggers in ancient IE mode", hi: "चेक करें कि क्या payload सिर्फ पुराने IE mode में चलता है" },
        steps: [
          { en: "Inject legacy constructs: `<img src=x style=\"behavior:url(#default#time2)\">` or CSS expressions.", simple: "Try old IE-specific CSS injection payloads.", hi: "पुराने IE CSS expression payloads inject करें।" },
          { en: "Test in modern browsers and verify that zero script execution or alert occurs.", simple: "Open the page in modern Chrome or Edge and see nothing happens.", hi: "Modern browser में open करके confirm करें कि कुछ execute नहीं होता।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd classifies IE-only XSS as P5 (Informational) because Internet Explorer was retired by Microsoft and modern enterprise traffic uses Chromium/WebKit/Gecko.",
      simple: "Rated P5 Informational because Internet Explorer is officially dead and unsupported.",
      hi: "यह P5 Informational है क्योंकि Internet Explorer official तौर पर बंद हो चुका है और modern traffic इसे use नहीं करता।",
    },
  },

  "Cross-Site Scripting (XSS) › Reflected › Self": {
    what: {
      en: "The reflected payload executes only when the user injects code into their own input field, but cannot be delivered to another user via a link or automated request (e.g. input is read only from local storage, a non-linkable POST form with strict CSRF tokens, or requires the user to type into DevTools/console).",
      simple: "A script runs only when you type it yourself into your own form, and there is no way to send a link to someone else that makes it run for them.",
      hi: "Script सिर्फ तभी चलती है जब user खुद अपने form में type करे, और link या automated request के ज़रिए किसी दूसरे user पर इसे trigger करने का कोई रास्ता नहीं होता।",
    },
    find: [
      {
        title: { en: "Evaluate deliverability to another victim", simple: "Try to send the payload to another account via a link", hi: "दूसरे user को link भेजकर trigger करने की कोशिश करें" },
        steps: [
          { en: "Trigger an XSS reflection in a form field on your test account.", simple: "Make the script run in your own form.", hi: "अपने form field में script trigger करें।" },
          { en: "Attempt to craft a shareable URL containing the payload — check if the application accepts GET parameters for that field.", simple: "See if putting the payload in the web address (URL) works.", hi: "देखें कि क्या URL query parameter से वही payload reflect होता है।" },
          { en: "Attempt to deliver via cross-site POST form — verify if anti-CSRF tokens or SameSite cookie policies block cross-origin submission.", simple: "Check if a CSRF attack can force it on another user.", hi: "चेक करें कि क्या CSRF attack से दूसरे user पर trigger कराया जा सकता है।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd VRT rates Self-XSS as P5 (Informational). Programs explicitly mark it out of scope unless chained with a delivery vector (CSRF, clickjacking, or linkable parameter). Triage requires an end-to-end victim delivery vector.",
      simple: "Rated P5 / Out of Scope unless you prove a regular victim can be tricked into running it without typing it into DevTools.",
      hi: "Bugcrowd VRT में Self-XSS P5 Informational / Out of Scope है। इसे valid बनाने के लिए CSRF या delivery vector साबित करना ज़रूरी है।",
    },
  },

  "Cross-Site Scripting (XSS) › Stored › Self": {
    what: {
      en: "A stored payload is saved in the user's private data store (such as personal private notes, private draft, or self-account profile) and is rendered unescaped exclusively to the user who authored it. No other user on the platform can ever navigate to or view this data.",
      simple: "You save an XSS payload in your private notepad or draft. Only you can see it, and no other user or admin ever opens that private page.",
      hi: "Stored payload user के private account (जैसे private notes या personal draft) में save होता है और सिर्फ उसी author user को दिखाई देता है। Platform का कोई दूसरा user या admin इसे नहीं देख सकता।",
    },
    find: [
      {
        title: { en: "Test multi-user isolation on stored fields", simple: "Check if any other user can see the saved text", hi: "चेक करें कि क्या कोई दूसरा user उस text को देख सकता है" },
        steps: [
          { en: "Save a stored XSS payload in a private account setting or personal note.", simple: "Save a test script in your private notes.", hi: "Private notes या profile field में script save करें।" },
          { en: "Attempt to view or access that note from a second test account (Account B).", simple: "Try to open that note using your second account.", hi: "दूसरे test account से उस note को access करने की कोशिश करें।" },
          { en: "Check if an administrator review panel, support ticket screen, or public share link displays the note.", simple: "Check if support staff or admins see the note during ticket review.", hi: "चेक करें कि क्या support ticket या admin panel में वह note render होता है।" },
        ],
      },
    ],
    proof: {
      en: "Classified as P5 (Informational) unless chained with CSRF (to store the payload into a victim's private space) or an access control flaw that exposes the private record to others.",
      simple: "Rated P5 because you can only hack yourself. It only becomes valid if chained with CSRF or IDOR.",
      hi: "यह P5 है क्योंकि आप सिर्फ खुद को attack कर रहे हैं। अगर CSRF या IDOR के साथ chain करके victim के account में store करवा सकें, तभी यह valid मानी जाएगी।",
    },
  },

  "Cross-Site Scripting (XSS) › TRACE Method": {
    what: {
      en: "The HTTP TRACE or TRACK method is enabled on the web server, which echoes back the exact request headers received by the server. Historically, this was chained with XSS to steal HttpOnly cookies (Cross-Site Tracing / XST). However, all modern browsers have blocked the TRACE method in XMLHttpRequest and fetch() for nearly two decades.",
      simple: "The web server has TRACE turned on, which bounces back HTTP headers. Modern browsers completely block scripts from making TRACE requests, so it cannot steal cookies.",
      hi: "Web server पर HTTP TRACE method enable है जो incoming request headers को echo back कर देता है। Modern browsers में XMLHttpRequest/fetch TRACE method को block रखते हैं, इसलिए यह modern web पर exploit नहीं हो सकता।",
    },
    find: [
      {
        title: { en: "Probe server response to TRACE request", simple: "Send a TRACE request using curl", hi: "curl से TRACE request भेजकर response चेक करें" },
        steps: [
          { en: "Send an HTTP TRACE request: `curl -i -X TRACE https://target.com/`.", simple: "Run curl with -X TRACE to see if the server responds.", hi: "curl से `-X TRACE` request भेजकर status code देखें।" },
          { en: "Check if the server returns 200 OK with `message/http` echoing the headers.", simple: "See if the server echoes back the headers with 200 OK.", hi: "चेक करें कि क्या server 200 OK के साथ headers echo करता है।" },
          { en: "Verify browser restriction: run `fetch('/', {method: 'TRACE'})` in DevTools and observe the TypeError rejection.", simple: "Try fetch() in the browser console to see it is completely blocked.", hi: "Browser console में fetch TRACE चलाकर देखें कि browser उसे reject कर देता है।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates TRACE method disclosure as P5 (Informational). Most bug bounty programs explicitly list 'HTTP TRACE enabled' as an excluded/out-of-scope finding due to zero practical impact in modern browsers.",
      simple: "Rated P5 Informational / Out of Scope because all modern browsers block TRACE requests.",
      hi: "यह P5 Informational / Out of Scope है क्योंकि modern browsers TRACE request को allow नहीं करते।",
    },
  },

  "Server-Side Injection › File Inclusion › Local": {
    what: {
      en: "The web application takes user-supplied input to construct a server-side file path without adequate validation or sanitization, allowing an attacker to include or execute local files on the server (such as `/etc/passwd`, application source code, or uploaded temporary files). In dynamic runtimes (PHP, JSP), this frequently leads directly to Remote Code Execution.",
      simple: "The website takes a file name from the web address (like page=about.php) and loads files from the server's hard drive, letting attackers read system files or run malicious code.",
      hi: "Web application user input से file path बनाती है बिना path traversal sanitize किए। Attacker server की local files (जैसे /etc/passwd या source code) include करवा सकता है, जो PHP/JSP में अक्सर direct RCE बन जाता है।",
    },
    find: [
      {
        title: { en: "Test path traversal payloads across file/template parameters", simple: "Test parameters like ?page= with directory traversal sequences", hi: "?page= या ?file= parameters में traversal sequences test करें" },
        steps: [
          { en: "Identify parameters that load views, templates, or languages: `?page=contact`, `?file=report.pdf`, `?template=header`.", simple: "Look for parameters that look like file names or template names.", hi: "File या template load करने वाले parameters पहचानें।" },
          { en: "Test standard directory traversal sequences: `../../../../etc/passwd` or `..\\..\\..\\windows\\win.ini`.", simple: "Try ../../../../etc/passwd to see if Linux system files return.", hi: "../../../../etc/passwd डालकर देखें कि क्या system files display होती हैं।" },
          { en: "Test encoding variants: URL encoding (`%2e%2e%2f`), double encoding (`%252e%252e%252f`), null-byte injection (`%00`), and wrapper schemes (`php://filter/convert.base64-encode/resource=index.php`).", simple: "Try encoded dots and slashes or php:// wrappers if on PHP.", hi: "URL encoding, double encoding और php://filter wrappers test करें।" },
        ],
      },
    ],
    proof: {
      en: "Triage requires: the exact HTTP request, parameter name, and response demonstrating file contents (e.g., standard `/etc/passwd` root line or source code disclosures). Do not download sensitive user data; stop once arbitrary local file reading is demonstrated. Ranked P1.",
      simple: "Show the request with the traversal parameter and the server returning the first few lines of /etc/passwd or application config.",
      hi: "Traversal parameter वाली HTTP request और response में file content (जैसे /etc/passwd) का screenshot दें। P1 priority है।",
    },
    escalate: {
      en: "If PHP wrappers (`php://input`, `phar://`, log poisoning) allow turning the file inclusion into arbitrary code execution, document the command execution to solidify P1 severity.",
      simple: "Show code execution via log poisoning or php wrappers if possible.",
      hi: "Log poisoning या PHP wrappers से code execution दिखाएं।",
    },
    cwe: "CWE-98: Improper Control of Generation of Code ('PHP Remote File Inclusion')",
    references: [
      { label: "PortSwigger: Directory Traversal & File Inclusion", url: "https://portswigger.net/web-security/file-path-traversal" },
    ],
  },

  "Server-Side Injection › Remote Code Execution (RCE)": {
    what: {
      en: "An attacker injects operating system commands, deserialization payloads, or un-sanitized code strings into the server backend, causing the underlying operating system or application runtime to execute arbitrary commands with the privileges of the web service. This grants full access to the server, internal network, and data stores.",
      simple: "A bug lets an attacker run their own computer commands directly on the company's web server, taking complete control of the machine.",
      hi: "Attacker backend server पर arbitrary system commands या code execute करवा देता है। इससे server, database, और internal network का full takeover हो जाता है। Bug bounty में यह highest severity (P1) है।",
    },
    find: [
      {
        title: { en: "Test OS command separators across server-processing inputs", simple: "Try command separators like ; or | with safe commands", hi: "; या | command separators के साथ safe commands test करें" },
        steps: [
          { en: "Identify parameters that interact with system utilities (ping tools, image converters, PDF generators, DNS lookups).", simple: "Look for features that run server tools like ping or pdf conversion.", hi: "System utilities (ping, image converter, PDF tool) वाले parameters ढूँढें।" },
          { en: "Inject command separators with benign diagnostic commands: `; id`, `| id`, `$(id)`, `` `id` ``, `& whoami`.", simple: "Inject command separators like ; id or $(whoami).", hi: "; id या $(whoami) जैसे separators डालकर response में output देखें।" },
          { en: "For blind command execution, test time delays (`sleep 10` or `ping -c 10 127.0.0.1`) or OOB DNS interactions (`curl http://burpcollaborator.net`).", simple: "Use sleep 10 or an out-of-band ping to test blind RCE.", hi: "Blind RCE के लिए sleep 10 या Burp Collaborator DNS interaction test करें।" },
        ],
      },
    ],
    proof: {
      en: "Triage requires: reproduction steps, the exact parameter/header, and proof of command execution via output of `id` or `whoami`, or confirmed out-of-band DNS callback. DO NOT delete files, escalate to root, or pivot into internal networks. Keep proof non-destructive.",
      simple: "Show the command running (like output of 'id' or 'whoami') or a time-delay proof. Never delete files or damage the server.",
      hi: "Reproduction steps, parameter, और safe command output (`id`, `whoami`) दिखाएं। कभी भी files delete या server damage न करें। P1 bug है।",
    },
    references: [
      { label: "PortSwigger Web Security: OS Command Injection", url: "https://portswigger.net/web-security/os-command-injection" },
    ],
  },

  "Server-Side Injection › XML External Entity Injection (XXE)": {
    what: {
      en: "The server processes user-supplied XML input using a parser with weakly configured DTD (Document Type Definition) or external entity resolution. An attacker can declare custom external entities pointing to local system files (`file:///etc/passwd`) or internal network services, leading to arbitrary file disclosure, SSRF, or denial of service.",
      simple: "The website reads XML files but forgets to turn off external references. An attacker can tell the XML reader to fetch private files from the server or scan internal networks.",
      hi: "Server user द्वारा भेजी गई XML data को parse करते समय external entities (DTD) allow कर देता है। Attacker server की local files (`file:///etc/passwd`) पढ़ सकता है या internal network में SSRF कर सकता है।",
    },
    find: [
      {
        title: { en: "Inject external entity definitions in XML endpoints", simple: "Add an entity pointing to /etc/passwd in XML requests", hi: "XML request में /etc/passwd point करने वाली entity inject करें" },
        steps: [
          { en: "Identify endpoints accepting XML, SOAP requests, SVG uploads, or Word/Excel document imports.", simple: "Find forms that accept XML, SOAP, or SVG images.", hi: "XML, SOAP, या SVG upload accept करने वाले endpoints ढूँढें।" },
          { en: "Inject a custom DOCTYPE with a local file entity: `<!DOCTYPE foo [ <!ENTITY xxe SYSTEM \"file:///etc/passwd\"> ]><foo>&xxe;</foo>`.", simple: "Inject a standard XXE payload reading a safe test file.", hi: "Standard XXE DOCTYPE payload inject करके response में content देखें।" },
          { en: "For blind XXE, define a parameter entity referencing an external DTD hosted on your Burp Collaborator instance.", simple: "If no output appears, use an out-of-band collaborator link.", hi: "Blind XXE के लिए external DTD और Burp Collaborator interaction test करें।" },
        ],
      },
    ],
    proof: {
      en: "Triage requires: the raw HTTP POST request with XML payload, and the response disclosing file contents (e.g. `/etc/passwd` or `/windows/win.ini`) or an authenticated SSRF callback. P1 priority.",
      simple: "Show the XML request and the response displaying the first few lines of the target file.",
      hi: "Raw HTTP request और response में file disclosure का screenshot दें। P1 bug है।",
    },
    references: [
      { label: "PortSwigger Web Security: XXE Injection", url: "https://portswigger.net/web-security/xxe" },
    ],
  },

  "Server-Side Injection › Content Spoofing › Email HTML Injection": {
    what: {
      en: "The application reflects untrusted user input into the body of automated transactional emails (such as invitations, notifications, or receipts) without HTML encoding. Because the email originates from the legitimate company domain and passes SPF/DKIM/DMARC checks, an attacker can craft highly convincing spear-phishing templates.",
      simple: "The app puts user-typed text into an automated email sent to someone else without escaping HTML. The attacker can insert fake buttons or links inside an official company email.",
      hi: "App transactional emails (invitations, receipts) में user input को बिना HTML encode किए include कर देती है। चूँकि email official company domain से आती है, attacker legit email के अंदर fake phishing forms/links inject कर सकता है।",
    },
    find: [
      {
        title: { en: "Inject HTML tags into invite and notification inputs", simple: "Test user invite fields with HTML tags", hi: "User invite fields में HTML tags डालकर test करें" },
        steps: [
          { en: "Find features that send emails to external addresses (e.g., 'Invite a teammate', 'Share with a friend', 'Gift card note').", simple: "Look for invite or sharing features that ask for an email and a note.", hi: "Invite teammate या share note वाले features पहचानें।" },
          { en: "Supply HTML tags in the sender name or message body: `<h1>Security Notice</h1><a href=\"https://attacker.com\">Verify Account</a>`.", simple: "Put HTML heading and link tags inside the message.", hi: "Name या note field में HTML heading और link tags डालें।" },
          { en: "Check your received test email client to see if the tags rendered as real HTML elements.", simple: "Open the received email and check if the link/formatting rendered.", hi: "Received email खोलकर देखें कि क्या HTML tags properly render हुए।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs: the application request triggering the email, the original email headers proving it originated from the company's mail server, and a screenshot of the rendered email showing the spoofed HTML content. Ranked P4.",
      simple: "Show the form you used, the email received with your custom HTML buttons/links, and email headers.",
      hi: "Trigger request, received email का screenshot जिसमें injected HTML दिखे, और email headers दें। P4 priority है।",
    },
    cwe: "CWE-80: Improper Neutralization of Script-Related HTML Tags in a Web Page (Basic XSS)",
  },

  "Server-Side Injection › Content Spoofing › External Authentication Injection": {
    what: {
      en: "An application allows user-controlled inputs to inject or alter parameters in external authentication or identity federation requests (e.g. SAML RelayState, OAuth prompt parameters, or external OpenID requests) in a way that tricks the client into authenticating against an external or unintended provider.",
      simple: "An attacker can tamper with login parameters so the website sends the user to authenticate against the wrong login server.",
      hi: "User input external authentication/federation request parameters (जैसे SAML RelayState या OAuth provider parameters) को alter कर देता है, जिससे user unintended provider के साथ authenticate हो सकता है।",
    },
    find: [
      {
        title: { en: "Tamper with external auth redirection parameters", simple: "Change the auth provider address in login requests", hi: "Login request में external auth parameters modify करें" },
        steps: [
          { en: "Capture the request initiating single sign-on (SSO) or external social login.", simple: "Catch the login request in Burp.", hi: "SSO या social login request Burp में capture करें।" },
          { en: "Inspect parameters specifying external endpoints, issuers, or discovery documents.", simple: "Look for parameters pointing to the auth provider URL.", hi: "Issuer या provider URL वाले parameters पहचानें।" },
          { en: "Attempt to override the provider endpoint with an attacker-controlled identity provider.", simple: "Try pointing the parameter to your own test server.", hi: "Parameter को अपने test provider URL से बदलकर देखें।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs: the modified authentication request, proof that the application routed the user's authentication challenge to the rogue provider, and evidence of the security impact. Ranked P4.",
      simple: "Show how changing the parameter redirects the user's login to an external server.",
      hi: "Modified auth request और proof कि application ने rogue provider को request route कर दी। P4 priority है।",
    },
    cwe: "CWE-287: Improper Authentication",
  },

  "Server-Side Injection › Content Spoofing › Impersonation via Broken Link Hijacking": {
    what: {
      en: "The application or company web page contains hardcoded links or external script/style references to third-party domains or social media handles (e.g. an abandoned Twitter/X handle, an expired domain, or a defunct CDN) that are now available for public re-registration. An attacker can register the abandoned asset and impersonate the company or execute script.",
      simple: "A website links to an old social media account or expired website domain that anyone can buy or register, letting an attacker pose as the company.",
      hi: "Company की website पर ऐसे expired domains या abandoned social media handles के links होते हैं जिन्हें कोई भी दोबारा register कर सकता है। Attacker उन्हें register करके company impersonation कर सकता है।",
    },
    find: [
      {
        title: { en: "Scan site links for expired domains and unclaimed handles", simple: "Check all external links to see if the target domain is expired", hi: "External links scan करके देखें कि क्या कोई domain expired है" },
        steps: [
          { en: "Crawl all outbound links and social icons on the company's footer and landing pages.", simple: "Collect all links in the website footer.", hi: "Website footer और landing pages के outbound links collect करें।" },
          { en: "Check domain WHOIS and DNS records for NXDOMAIN status on linked endpoints.", simple: "Check if any linked domain is expired and available to purchase.", hi: "Check करें कि क्या कोई linked domain expired है और available है।" },
          { en: "Verify social media links to see if the handle leads to an unclaimed profile page ('This account doesn't exist').", simple: "Click social links to see if the account username is available.", hi: "Social media links click करके देखें कि क्या handle unclaimed है।" },
        ],
      },
    ],
    proof: {
      en: "Triage requires: the company URL containing the broken link, proof that the linked domain or handle is unregistered/available (e.g., domain registrar screenshot), and the potential for user impersonation. Ranked P4.",
      simple: "Show the page with the broken link and proof that the domain or handle is currently free for anyone to register.",
      hi: "Company page का URL जहाँ link मौजूद है, और proof (registrar screenshot) कि handle/domain available है। P4 priority है।",
    },
    cwe: "CWE-1021: Improper Restriction of Rendered UI Layers or Frames",
  },

  "Server-Side Injection › Content Spoofing › Email Hyperlink Injection Based on Email Provider": {
    what: {
      en: "An application allows plaintext or unlinked URLs to be submitted in emails, which certain specific email clients (e.g. Outlook, Apple Mail) automatically parse and turn into clickable hyperlinks. Because the application did not explicitly inject an HTML `<a>` tag, the hyperlinking behavior depends entirely on the receiving email client's heuristics.",
      simple: "You put text like 'google.com' in an email note. The website didn't make it a link, but your email program automatically turned it into a clickable link.",
      hi: "App email में plaintext URL allow करती है जिसे कुछ specific email clients (जैसे Outlook) auto-link कर देते हैं। चूँकि server ने HTML link नहीं बनाया, यह email client का local behavior है।",
    },
    find: [
      {
        title: { en: "Test auto-linking of plaintext URLs across email clients", simple: "Send plain text web addresses in email fields", hi: "Email fields में plain text URLs भेजकर auto-linking देखें" },
        steps: [
          { en: "Submit a plain text domain (e.g. `example.com`) in an invite field that strips all HTML tags.", simple: "Enter a plain text domain name into an email field.", hi: "Invite field में plain domain name डालें जहाँ HTML stripped हो।" },
          { en: "Inspect the raw email source (EML) to confirm that the server sent purely plain text without `<a href>` tags.", simple: "View raw email source to verify the server did not add HTML links.", hi: "Raw email source में verify करें कि server ने कोई HTML tag नहीं डाला।" },
          { en: "Observe that only certain email clients render it as a clickable link based on their own client-side autolink parsing.", simple: "See that the email client created the link automatically.", hi: "देखें कि email client ने खुद ही उसे clickable बनाया।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates this as P5 (Informational). Most programs exclude it because auto-linking plain text URLs is a standard client-side feature of email readers, not an application-side vulnerability.",
      simple: "Rated P5 / Out of Scope because your email client turns text into links, not the server.",
      hi: "यह P5 Informational / Out of Scope है क्योंकि plain text को link बनाना email client का feature है, server bug नहीं।",
    },
  },

  "Server-Side Injection › Content Spoofing › Flash Based External Authentication Injection": {
    what: {
      en: "A legacy Flash (.swf) authentication component passes authentication tokens or credentials to external domains based on user-supplied FlashVars. As Flash Player is obsolete and unsupported in all modern browsers, this legacy vector cannot be triggered by normal users.",
      simple: "An ancient Flash component sends login data to external servers based on parameters, but Flash is dead and cannot run in browsers today.",
      hi: "पुराना Flash component user parameters के आधार पर external domain को auth tokens भेजता है। चूँकि Flash Player modern browsers से हटाया जा chuka hai, यह execute नहीं हो सकता।",
    },
    find: [
      {
        title: { en: "Inspect legacy Flash auth modules", simple: "Check old Flash files for auth parameters", hi: "पुराने Flash files में auth parameters चेक करें" },
        steps: [
          { en: "Decompile the legacy `.swf` file to inspect FlashVars handling.", simple: "Decompile the SWF to look for token forwarding.", hi: "SWF file decompile करके FlashVars handling inspect करें।" },
          { en: "Verify whether it accepts an external URL for token postback.", simple: "Check if it sends login tokens to custom URLs.", hi: "चेक करें कि क्या यह external URL पर token भेजता है।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates this P5 (Informational) or Out of Scope due to browser deprecation of Flash.",
      simple: "Rated P5 / Out of Scope because Flash is no longer supported.",
      hi: "Flash deprecation के कारण यह P5 / Out of Scope है।",
    },
  },

  "Server-Side Injection › Content Spoofing › Homograph/IDN-Based": {
    what: {
      en: "The application processes Internationalized Domain Names (IDNs) without converting them to Punycode or warning users, allowing visually indistinguishable lookalike characters (Cyrillic 'a' vs Latin 'a') to be displayed as legitimate domains. This facilitates deceptive visual phishing and link spoofing.",
      simple: "The website displays foreign letters that look identical to normal letters (like Cyrillic 'а' vs English 'a') without showing the real Punycode address, tricking users into trusting fake links.",
      hi: "Application Internationalized Domain Names (IDN) को बिना Punycode में convert किए display करती है। इससे lookalike characters (जैसे Cyrillic 'а') legitimate company domain जैसे दिखते हैं और visual phishing होती है।",
    },
    find: [
      {
        title: { en: "Inject Cyrillic homoglyphs in link fields", simple: "Use lookalike foreign letters in domain name fields", hi: "Domain fields में lookalike foreign letters डालें" },
        steps: [
          { en: "Create a lookalike domain string using Cyrillic characters: `https://gооgle.com` (with Cyrillic 'о').", simple: "Type a domain name with Cyrillic lookalike letters.", hi: "Cyrillic lookalike letters के साथ domain name बनाएँ।" },
          { en: "Submit it to a profile link, message preview, or rich-text editor.", simple: "Save it in a profile or message box.", hi: "Profile link या message editor में save करें।" },
          { en: "Check if the application renders the raw visual Unicode string instead of the punycode representation (`xn--...`).", simple: "Check if the browser or app displays the fake lookalike letters.", hi: "देखें कि क्या application punycode (`xn--...`) दिखाने के बजाय raw Unicode दिखाती है।" },
        ],
      },
    ],
    proof: {
      en: "Rated P5 in Bugcrowd VRT. Triage treats homograph attacks as low severity unless chained with an application-specific validation bypass that leads to direct account takeover or credential theft.",
      simple: "Rated P5 because modern browsers and operating systems handle Punycode conversions automatically.",
      hi: "Bugcrowd VRT में यह P5 है क्योंकि modern browsers खुद Punycode handle करते हैं। जब तक credential theft का direct proof न हो, impact low रहता है।",
    },
  },

  "Server-Side Injection › Content Spoofing › HTML Content Injection": {
    what: {
      en: "An application allows arbitrary HTML tags (such as `<h1>`, `<b>`, `<img>`, or `<table>`) to be rendered in web pages without escaping, but strictly blocks, strips, or CSP-mitigates JavaScript execution (`<script>`, inline handlers, `javascript:` URIs). While script execution is prevented, an attacker can alter page layout, inject fake login dialogs, or perform visual defacement.",
      simple: "You can inject HTML formatting tags like bold text or fake boxes, but all JavaScript and script tags are completely blocked.",
      hi: "Application HTML tags (`<h1>`, `<img>`, `<table>`) को render होने देती है, पर JavaScript (`<script>`, event handlers) को strictly filter या block कर देती है। इससे visual defacement या fake UI तो बन सकता है, पर script execute नहीं होती।",
    },
    find: [
      {
        title: { en: "Test HTML markup without script execution", simple: "Try HTML formatting tags to see if they render", hi: "HTML formatting tags डालकर देखें कि क्या वे render होते हैं" },
        steps: [
          { en: "Inject benign HTML structure: `<h1>System Maintenance</h1><p>Please log in</p>`.", simple: "Inject a heading and paragraph tag.", hi: "Heading और paragraph tags inject करें।" },
          { en: "Attempt script execution via `<script>` and `onerror` handlers, and verify they are stripped or sanitized.", simple: "Verify that script tags are removed.", hi: "Verify करें कि script tags filter हो जाते हैं।" },
          { en: "Observe that the HTML markup renders cleanly, modifying the visual page structure.", simple: "Confirm the page layout changed visually.", hi: "देखें कि visual layout alter हो गया पर code execution नहीं हुआ।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates pure HTML injection (without JavaScript execution) as P5 (Informational). Triage will accept it as a higher priority only if it can be demonstrated to phish credentials or exfiltrate anti-CSRF tokens via CSS/form-action injection.",
      simple: "Rated P5 unless you can demonstrate stealing sensitive tokens or credentials with it.",
      hi: "बिना JavaScript execution के pure HTML injection P5 Informational है। अगर इससे CSRF token steal या credential phishing demonstrate हो सके, तभी priority बढ़ाई जा सकती है।",
    },
    escalate: {
      en: "If `<form action=\"https://attacker.com\">` can be injected over an existing login page to steal submitted credentials, document the credential theft to escalate to P3.",
      simple: "Inject a form that steals passwords when the user clicks submit to upgrade to P3.",
      hi: "Login page पर form injection से credentials steal करके P3 escalate करें।",
    },
  },

  "Server-Side Injection › Exposed Data › Non Sensitive Data": {
    what: {
      en: "An injection flaw or verbose endpoint returns internal application data, but the disclosed data has no confidentiality value (e.g. public IDs, static asset paths, server timestamps, public catalog numbers, or non-sensitive debug counts).",
      simple: "An error or query returns internal information, but none of it is secret or harmful (like public timestamps or item numbers).",
      hi: "Injection flaw या verbose response से internal data leak होता है, पर वह data non-sensitive होता है (जैसे public timestamps, asset paths या public IDs) जिसका कोई security impact नहीं है।",
    },
    find: [
      {
        title: { en: "Evaluate sensitivity of injected query output", simple: "Check if the leaked text contains anything secret", hi: "जाँचें कि leak हुए data में कोई secret information है या नहीं" },
        steps: [
          { en: "Identify an injection point that echoes server data into the response.", simple: "Find an input that returns database or server text.", hi: "ऐसा injection point ढूँढें जो response में server data print करता हो।" },
          { en: "Inspect the output to determine if it contains PII, secrets, keys, or passwords.", simple: "Check if any passwords, private tokens, or personal info are present.", hi: "चेक करें कि क्या कोई password, token या private user data मौजूद है।" },
          { en: "Recognize that public counters, product IDs, and static text lack impact.", simple: "See that the data returned is already public.", hi: "पहचानें कि public counters या static IDs में कोई security impact नहीं है।" },
        ],
      },
    ],
    proof: {
      en: "Classified as P5 in Bugcrowd VRT. Triage requires demonstrable confidentiality impact (such as user PII or auth credentials) to validate a finding above Informational.",
      simple: "Rated P5 Informational because the leaked data is not confidential.",
      hi: "यह P5 Informational है क्योंकि disclosed data confidential नहीं है।",
    },
  },

  "Server-Side Injection › Content Spoofing › Right-to-Left Override (RTLO)": {
    what: {
      en: "An application allows the Unicode Right-to-Left Override character (`U+202E`) in user-supplied filenames or text fields. When rendered in file managers or browser text areas, the character reverses the visual display order of subsequent characters, making an executable file (e.g. `invoice[U+202E]cod.exe`) visually appear as a safe document (`invoiceexe.doc`).",
      simple: "A special hidden Unicode character flips the direction of text, making a dangerous file like .exe look like a safe .doc file on your screen.",
      hi: "Application filename या text में Unicode Right-to-Left Override (`U+202E`) character allow करती है। इससे file का visual display उल्टा हो जाता है और dangerous `.exe` file safe `.doc` file जैसी दिखने लगती है।",
    },
    find: [
      {
        title: { en: "Test RTLO character injection in file uploads and names", simple: "Upload a file with the U+202E character in its name", hi: "Filename में U+202E character डालकर upload test करें" },
        steps: [
          { en: "Create a filename incorporating `\u202E`: e.g. `document\u202Efdp.exe`.", simple: "Name a file with the special RTLO character.", hi: "Filename में `\u202E` character लगाकर file create करें।" },
          { en: "Upload the file to the web application.", simple: "Upload it to the site.", hi: "File को website पर upload करें।" },
          { en: "Inspect the download link or UI view to see if the visual filename reverses to `documentexe.pdf`.", simple: "Check how the filename appears to other users.", hi: "Download link में देखें कि क्या filename visually उल्टा दिखाई देता है।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates RTLO content spoofing as P5. Triage treats this as a client-side display artifact unless the server itself executes or misroutes the file based on the spoofed extension.",
      simple: "Rated P5 because operating systems and file managers are responsible for rendering file extensions safely.",
      hi: "Bugcrowd में यह P5 है क्योंकि यह visual display artifact है जब तक server खुद गलत extension interpret न करे।",
    },
    cwe: "CWE-451: User Interface (UI) Misrepresentation of Critical Information",
  },

  "Server-Side Injection › Content Spoofing › Self Email HTML Injection": {
    what: {
      en: "An application allows HTML injection into automated emails, but the generated email is exclusively sent to the user's own verified email address (e.g., in a 'Download my account data' confirmation or self-profile update notice). Because an attacker cannot force the email to be delivered to another victim, there is no cross-user phishing capability.",
      simple: "You can put HTML code into an email, but the website only ever sends that email to your own inbox, not to anyone else.",
      hi: "Email में HTML injection possible है, पर वह email सिर्फ उसी user के अपने verified email address पर भेजी जाती है (जैसे self-profile update notification)। किसी दूसरे victim को email नहीं भेजी जा सकती।",
    },
    find: [
      {
        title: { en: "Verify recipient constraints on email injection", simple: "Check who receives the email with the injected HTML", hi: "चेक करें कि HTML injection वाली email किसको भेजी जाती है" },
        steps: [
          { en: "Inject HTML into personal profile or account name fields.", simple: "Put HTML in your account name.", hi: "Account name field में HTML tags डालें।" },
          { en: "Trigger an automated email (e.g. password reset or self-notification).", simple: "Request an account confirmation email.", hi: "Confirmation email trigger करें।" },
          { en: "Verify that the email destination is hardcoded to the currently logged-in user's own email address.", simple: "Confirm the email only goes to your own inbox.", hi: "Confirm करें कि email सिर्फ आपके अपने address पर आती है।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd classifies Self Email HTML Injection as P5 (Informational). Triage will reject or close as informational unless you can deliver the email to an arbitrary external address.",
      simple: "Rated P5 Informational because you can only send spoofed emails to yourself.",
      hi: "यह P5 Informational है क्योंकि आप सिर्फ खुद को email भेज सकते हैं। Arbitrary recipient न होने पर triage इसे close कर देता है।",
    },
  },

  "Server-Side Injection › Parameter Pollution › Social Media Sharing Buttons": {
    what: {
      en: "HTTP Parameter Pollution (HPP) in social sharing button links (e.g., 'Share on Twitter', 'Share on LinkedIn') allows overriding the shared URL or pre-filled tweet text by injecting duplicate parameters into the sharing URL query string.",
      simple: "You can tamper with a 'Share to Twitter' button link so that it shares a different message or website when clicked.",
      hi: "Social sharing buttons ('Share on X/Twitter') में HTTP Parameter Pollution (HPP) से share होने वाला text या URL manipulate किया जा सकता है।",
    },
    find: [
      {
        title: { en: "Inject duplicate query parameters into sharing generators", simple: "Add extra URL parameters to sharing links", hi: "Sharing link generation में duplicate parameters डालें" },
        steps: [
          { en: "Locate a social sharing button link generator: `target.com/article?id=10&share=twitter`.", simple: "Find the link that creates the share button.", hi: "Share button generator link ढूँढें।" },
          { en: "Append duplicate parameters: `target.com/article?id=10&url=https://attacker.com`.", simple: "Add &url=https://evil.com to the query string.", hi: "Query string में duplicate `&url=` parameter जोड़ें।" },
          { en: "Click the sharing button and verify if the external social media window pre-fills the attacker's URL.", simple: "See if the Twitter share box opens with your link instead.", hi: "देखें कि क्या sharing popup में attacker का URL pre-fill हुआ।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates this P5 (Informational). Triage considers modifying social sharing pre-fills as cosmetic or low-risk behavior unless chained with credential theft or OAuth redirection.",
      simple: "Rated P5 Informational because pre-filling social media share text has minimal security impact.",
      hi: "यह P5 Informational है क्योंकि social share text alter करना cosmetic issue माना जाता है।",
    },
    cwe: "CWE-235: Improper Handling of Extra Parameters",
  },

  "Server-Side Injection › Content Spoofing › Text Injection": {
    what: {
      en: "An application reflects user-supplied plaintext input into an error message or page body without allowing HTML markup, tags, or JavaScript. An attacker can craft a link that displays misleading plain text messages on a legitimate corporate domain (e.g., 'Target.com: System error. Call 1-800-FAKE-SUPPORT').",
      simple: "The site prints whatever plain text you put in the URL into an error message, letting someone create a link that displays a fake warning message.",
      hi: "Application error message या page body में user input को reflect कर देती है बिना किसी HTML या script execution के। Attacker crafted link से page पर fake warning text display करवा सकता है।",
    },
    find: [
      {
        title: { en: "Test plaintext reflection in error parameters", simple: "Put custom text into error query parameters", hi: "Error parameters में custom text डालकर reflection देखें" },
        steps: [
          { en: "Look for error messages that echo URL parameters: `target.com/error?msg=File+not+found`.", simple: "Find pages that echo the error message from the URL.", hi: "URL से error message echo करने वाले pages ढूँढें।" },
          { en: "Inject text: `target.com/error?msg=Account+suspended.+Visit+attacker.com`.", simple: "Replace the message with fake warning text.", hi: "Message parameter में fake warning text डालें।" },
          { en: "Verify that HTML tags like `<b>` are stripped or escaped, leaving only pure plain text.", simple: "Confirm that HTML tags are blocked and only plain text appears.", hi: "Confirm करें कि HTML tags escape हो जाते हैं और सिर्फ plain text दिखता है।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates pure text injection as P5 (Informational). Triage will accept it only if the displayed text creates severe real-world confusion on a high-trust page, but almost all programs classify it as Informational.",
      simple: "Rated P5 Informational because no code or HTML executes.",
      hi: "यह P5 Informational है क्योंकि कोई code या HTML execute नहीं होता।",
    },
    cwe: "CWE-74: Improper Neutralization of Special Elements in Output Used by a Downstream Component",
  },

  "Server-Side Injection › Server-Side Template Injection (SSTI) › Custom": {
    what: {
      en: "The application embeds user input directly into a custom or proprietary server-side template engine template rather than passing it as a data model variable. When evaluated, the custom engine resolves expressions, mathematical operations, or internal functions, which can range from information disclosure to full Remote Code Execution depending on engine capabilities.",
      simple: "The server uses a template engine and pastes user text right into the template code, letting attackers evaluate server expressions or run commands.",
      hi: "Application user input को custom server-side template engine में directly embed कर देती है। Evaluation के समय engine expressions या functions execute कर देता है, जिससे information disclosure या RCE हो सकता है।",
    },
    find: [
      {
        title: { en: "Test template expression evaluation syntax", simple: "Inject math expressions like {{7*7}} or ${7*7}", hi: "{{7*7}} या ${7*7} जैसी math expressions डालकर evaluation चेक करें" },
        steps: [
          { en: "Inject polyglot template syntax into input fields: `${7*7}`, `{{7*7}}`, `<%= 7*7 %>`, `#{7*7}`, `*{7*7}`.", simple: "Try common template math expressions in inputs.", hi: "Inputs में `${7*7}` या `{{7*7}}` जैसी template expressions डालें।" },
          { en: "Inspect response to see if the expression is evaluated to `49`.", simple: "Check if the server answers with 49.", hi: "Response में देखें कि क्या server `49` return करता है।" },
          { en: "If evaluated, explore built-in custom objects, reflection helpers, or classloaders to evaluate code execution impact.", simple: "Investigate available objects to see if system commands can run.", hi: "Available template objects inspect करके code execution का impact check करें।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates SSTI as 'varies' (P1 to P3) based on impact: if arbitrary code execution is proven, it is P1; if only internal variable disclosure occurs, it is P3. Triage requires the expression payload and evaluation proof.",
      simple: "Severity varies: P1 if you achieve code execution, P3 if you only read internal variables. Show the request and evaluated response.",
      hi: "Impact के आधार पर priority P1 से P3 vary करती है: RCE होने पर P1, सिर्फ internal variables read होने पर P3। Request और evaluated output दें।",
    },
    escalate: {
      en: "Demonstrate access to runtime classes (e.g. Java Runtime or Python os/subprocess) to escalate from expression disclosure (P3) to full RCE (P1).",
      simple: "Show you can run system commands using the template engine to reach P1.",
      hi: "Template engine से system commands चलाकर P1 escalate करें।",
    },
    cwe: "CWE-1336: Improper Neutralization of Special Elements Used in a Template Engine",
    references: [
      { label: "PortSwigger Web Security: Server-Side Template Injection", url: "https://portswigger.net/web-security/server-side-template-injection" },
    ],
  },

  "Server-Side Injection › LDAP Injection": {
    what: {
      en: "An application constructs LDAP (Lightweight Directory Access Protocol) statements using untrusted user input without sanitization. An attacker can use LDAP metacharacters (`*`, `(`, `)`, `&`, `|`) to alter query logic, bypassing authentication, reading directory attributes, or enumerating users and groups in Active Directory.",
      simple: "The website talks to a corporate user directory (LDAP/Active Directory) and fails to clean input, letting attackers bypass login or dump employee lists.",
      hi: "Application un-sanitized user input से LDAP queries बनाती है। Attacker LDAP metacharacters (`*`, `(`, `)`, `&`, `|`) डालकर query logic बदल सकता है, login bypass कर सकता है या Active Directory users enumerate कर सकता है।",
    },
    find: [
      {
        title: { en: "Test LDAP boolean and filter metacharacters in login inputs", simple: "Inject * or )(& in username fields to test LDAP bypass", hi: "Username fields में * या )(& डालकर LDAP bypass test करें" },
        steps: [
          { en: "In login forms connected to corporate directories, inject LDAP wildcards and operators: `admin*`, `*`, `)(cn=*))(|(cn=*`.", simple: "Try entering an asterisk (*) in username fields.", hi: "Username field में `*` या `admin*` डालकर authentication behavior देखें।" },
          { en: "Test query manipulation in user search features: `*)(uid=*))(|(uid=*`.", simple: "Test search boxes with LDAP filter syntax.", hi: "User search fields में LDAP filter syntax inject करें।" },
          { en: "Observe whether wildcard inputs return all directory records or cause distinct LDAP syntax errors (e.g. 500 Internal Server Error with LDAP error codes).", simple: "Check if the server returns all users or LDAP-specific error messages.", hi: "चेक करें कि क्या server सारे users return करता है या LDAP syntax error देता है।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates LDAP injection as 'varies' (P1 to P3). Triage needs the injection parameter, payload, and evidence of authentication bypass or directory attribute enumeration. If blind, show boolean differential or time delay.",
      simple: "Severity depends on impact: P1/P2 if you bypass login, P3 if you enumerate directory entries. Show the request and response.",
      hi: "Impact पर priority निर्भर करती है: authentication bypass होने पर P1/P2, directory enumeration होने पर P3। Request और response proof दें।",
    },
    escalate: {
      en: "If the injection allows bypassing authentication to log in as an administrator, document the account takeover to secure P1/P2.",
      simple: "Log in as an admin using LDAP injection to reach P1.",
      hi: "LDAP injection से admin account में login करके P1 escalate करें।",
    },
    references: [
      { label: "OWASP: Testing for LDAP Injection", url: "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/06-Testing_for_LDAP_Injection" },
    ],
  },

  "Server-Side Injection › Exposed Data › Sensitive Data": {
    what: {
      en: "A server-side injection vulnerability or server-side reflection exposes highly sensitive data (such as API keys, database credentials, authentication tokens, cryptographic secrets, or personal identifiable information). The exposure is direct and verifiable from the injected response.",
      simple: "An injection flaw causes the server to print out real secrets, such as database passwords, API secret keys, or customer personal information.",
      hi: "Server-side injection flaw के कारण server response में sensitive data (जैसे API keys, database credentials, auth tokens, या PII) expose हो जाता है।",
    },
    find: [
      {
        title: { en: "Extract and verify sensitive server data from injection responses", simple: "Check injection output for passwords and tokens", hi: "Injection output में passwords और tokens ढूँढें" },
        steps: [
          { en: "Trigger the injection vulnerability and review returned response bodies and debug logs.", simple: "Look at the data returned by your injection payload.", hi: "Injection response body में returned data review करें।" },
          { en: "Identify high-value secrets: connection strings, AWS keys, JWT signing secrets, or customer PII.", simple: "Check for credentials, private keys, or customer data.", hi: "Database connection strings, private keys या user PII identify करें।" },
          { en: "Verify that the secret is live and functional without exceeding authorized testing scope.", simple: "Confirm the secret is real without downloading excess data.", hi: "Confirm करें कि secret real है, बिना extra data download किए।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates this as 'varies' (typically P1 or P2 depending on data sensitivity). Triage needs the injection PoC, screenshot showing the exposed secret, and an explanation of the business impact of the leaked credential.",
      simple: "Usually P1 or P2. Show the injection request, the exposed secret, and explain what an attacker could do with it.",
      hi: "Data की sensitivity के आधार पर P1 या P2 priority होती है। Injection PoC, exposed secret का screenshot, और business impact explanation दें।",
    },
    cwe: "CWE-200: Exposure of Sensitive Information to an Unauthorized Actor",
  },
};
