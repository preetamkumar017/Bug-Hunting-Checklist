import type { TopicContent } from "@/learn/data/types";

// Per-leaf trilingual lesson content, keyed by FULL Bugcrowd VRT path.
export const webAuthTopics: Record<string, TopicContent> = {
  "Broken Access Control (BAC) › Insecure Direct Object References (IDOR) › Modify/View Sensitive Information(Iterable Object Identifiers)": {
    what: {
      en: "The application uses sequential or predictable numeric object identifiers (e.g. `/api/invoices/1001`, `/users/542`) and validates neither ownership nor tenant boundaries on read (GET) and write (PUT/POST/PATCH/DELETE) requests. An attacker can iterate through numbers to systematically read and overwrite highly sensitive records (financial data, government IDs, private messages, medical records) belonging to every user on the platform.",
      simple: "The website uses simple numbers like /users/1001 to find your private records. By just changing the number to 1002, 1003, anyone can see and change other people's most private data.",
      hi: "Application sequential numeric IDs (जैसे /invoices/1001) use करती है और read/write requests पर ownership check नहीं करती। Attacker numbers बदल-बदल कर platform के सभी users का highly sensitive data (financial data, private documents) देख और बदल सकता है। यह P1 bug है।",
    },
    find: [
      {
        title: { en: "Dual-account numeric IDOR differential test", simple: "Compare two accounts and swap sequential numbers", hi: "दो accounts से sequential numbers बदलकर test करें" },
        steps: [
          { en: "Create two test accounts: Account A and Account B. With Account B, create a sensitive object (e.g. upload a tax document or bank invoice).", simple: "Create two accounts. Upload a private document in Account B.", hi: "दो accounts बनाएँ। Account B में private document या invoice बनाएँ।" },
          { en: "In Burp Suite, capture Account A's requests and observe sequential IDs (e.g. `id=5021`).", simple: "Watch the number in the web address in Burp.", hi: "Burp में Account A की request capture करें और ID नोट करें।" },
          { en: "Replay Account A's request with Account B's ID (`id=5022`) using both GET (view) and PUT/DELETE (modify), keeping Account A's session cookies.", simple: "Change the number to Account B's object while logged in as Account A.", hi: "Account A की session cookies रखते हुए Account B की ID पर GET और PUT/DELETE भेजें।" },
        ],
      },
    ],
    proof: {
      en: "Triage requires: the endpoint, the numeric parameter, and the HTTP request/response proving Account A read and modified Account B's sensitive data. P1 priority requires demonstration on highly sensitive data (PII, financial, medical).",
      simple: "Show Account A reading and changing Account B's sensitive file by just incrementing the ID number.",
      hi: "Endpoint, numeric parameter, और Account A द्वारा Account B का sensitive data read/modify करने का HTTP request/response screenshot दें। P1 priority है।",
    },
    cwe: "CWE-639: Authorization Bypass Through User-Controlled Key",
    references: [
      { label: "PortSwigger Web Security: Insecure Direct Object References (IDOR)", url: "https://portswigger.net/web-security/access-control/idor" },
    ],
  },

  "Broken Access Control (BAC) › Insecure Direct Object References (IDOR) › Modify Sensitive Information(Iterable Object Identifiers)": {
    what: {
      en: "The application exposes sequential numeric identifiers on write/update endpoints (PUT, POST, PATCH, DELETE) without verifying that the authenticated user owns or is authorized to mutate that record. An attacker can tamper with parameters (e.g., updating user emails, modifying bank payout destinations, or deleting records) across arbitrary user accounts.",
      simple: "The site lets you change or delete other people's sensitive information just by changing a number in an edit/save request.",
      hi: "Application write/update endpoints पर sequential numbers use करती है बिना user authorization check किए। Attacker ID बदलकर किसी भी user का data update या delete कर सकता है।",
    },
    find: [
      {
        title: { en: "Test write/mutation endpoints with foreign sequential IDs", simple: "Send an edit/save request with another user's number", hi: "Edit/save request में दूसरे user की ID डालकर test करें" },
        steps: [
          { en: "Capture an update request on Account A: `PUT /api/profile/101` with body `{\"phone\": \"9999999999\"}`.", simple: "Intercept an edit request from your first account.", hi: "Account A से update request intercept करें।" },
          { en: "Change the URL/body identifier to Account B's object ID (`102`) while keeping Account A's authentication headers.", simple: "Change the ID to your second account's ID and send it.", hi: "Identifier को Account B की ID (`102`) से बदलकर Account A के token के साथ भेजें।" },
          { en: "Log in as Account B and verify that Account B's data was modified by Account A.", simple: "Log into Account B to confirm the changes took effect.", hi: "Account B में login करके verify करें कि data change हो गया।" },
        ],
      },
    ],
    proof: {
      en: "Triage requires: the mutation HTTP request from Account A with Account B's ID, and confirmation from Account B's session that the sensitive modification was successfully applied. P2 priority.",
      simple: "Show Account A modifying Account B's account details using sequential IDs.",
      hi: "Account A द्वारा Account B की ID पर भेजी गई mutation request और Account B में data change होने का proof दें। P2 priority है।",
    },
    cwe: "CWE-639: Authorization Bypass Through User-Controlled Key",
  },

  "Broken Access Control (BAC) › Insecure Direct Object References (IDOR) › Modify/View Sensitive Information(Complex Object Identifiers GUID/UUID)": {
    what: {
      en: "An access control flaw allows viewing or modifying sensitive records, but the object identifier is a non-sequential, cryptographically strong GUID/UUID or complex hash (e.g. `550e8400-e29b-41d4-a716-446655440000`). Because the IDs cannot be blindly guessed or iterated, the attacker must locate an information leak or secondary endpoint that discloses the target victim's UUID before exploitation.",
      simple: "You can view or edit other users' private files if you change the ID, but the ID is a long random code (UUID) instead of a simple number. You first have to find someone's secret UUID code.",
      hi: "Access control flaw मौजूद है पर identifier complex GUID/UUID (जैसे 550e8400-e29b-...) है। Attacker सीधे guess नहीं कर सकता; exploit करने के लिए पहले victim का UUID किसी दूसरे leak या endpoint से ढूँढना पड़ता है। इसलिए यह P4 है।",
    },
    find: [
      {
        title: { en: "Find UUID leaks, then test access control on sensitive endpoints", simple: "Find a user's UUID from public pages, then use it on private endpoints", hi: "Public endpoint से UUID ढूँढें, फिर private endpoint पर test करें" },
        steps: [
          { en: "Find victim UUIDs disclosed through public profiles, search APIs, shared links, or group membership endpoints.", simple: "Look for UUIDs exposed in public profile links or comments.", hi: "Public profile, group list या API response से victim का UUID ढूँढें।" },
          { en: "Substitute that UUID into Account A's private/authenticated endpoints: `GET /api/user/{victim_uuid}/documents`.", simple: "Put the victim's UUID into your own private document request.", hi: "Account A के private document endpoint में victim का UUID डालें।" },
          { en: "Observe whether the server returns the victim's private data or performs the modification.", simple: "Check if the server returns Account B's private data.", hi: "देखें कि क्या server Account B का private data return करता है।" },
        ],
      },
    ],
    proof: {
      en: "Classified as P4 by Bugcrowd because UUIDs are non-iterable and an attacker cannot mass-harvest data without a separate enumeration bug. Triage needs: proof of where the UUID was obtained and the HTTP request/response accessing the victim record.",
      simple: "Show where you found the victim's UUID and how you used it to access their private data.",
      hi: "UUID कहाँ से मिला उसका proof और उस UUID से private data access होने का HTTP request/response दें। P4 priority है।",
    },
    escalate: {
      en: "If a public API endpoint leaks all platform UUIDs in bulk (e.g. `/api/users/all`), demonstrate the bulk harvesting to escalate from P4 to P2/P1.",
      simple: "If you find an endpoint that lists every user's UUID in a list, show that to raise it to P2.",
      hi: "अगर कोई endpoint सभी users के UUIDs bulk में leak करता हो, तो P2 escalate करें।",
    },
    cwe: "CWE-639: Authorization Bypass Through User-Controlled Key",
  },

  "Broken Access Control (BAC) › Insecure Direct Object References (IDOR) › View Non-Sensitive Information": {
    what: {
      en: "An IDOR allows viewing data by tampering with object identifiers, but the accessed information is non-sensitive, public, or expected to be visible across users (e.g. public product listings, store hours, public profile avatars, or non-confidential catalog tags).",
      simple: "You can change an ID number to view another record, but the information is completely public anyway (like public product descriptions).",
      hi: "IDOR के ज़रिए object identifier बदलकर data तो देखा जा सकता है, पर वह data non-sensitive या already public होता है (जैसे product catalog, public avatars)।",
    },
    find: [
      {
        title: { en: "Evaluate sensitivity of IDOR-accessible data", simple: "Check if the accessed data is already public", hi: "जाँचें कि IDOR से मिलने वाला data already public तो नहीं है" },
        steps: [
          { en: "Swap an identifier on an endpoint: `GET /api/public-item/1002`.", simple: "Change an ID in an API request.", hi: "API request में ID swap करें।" },
          { en: "Verify whether the record contains any private user credentials, PII, or internal-only attributes.", simple: "Check if any private user data is returned.", hi: "चेक करें कि क्या कोई private user details या confidential fields return हुईं।" },
          { en: "Recognize that public store listings or catalog items lack confidentiality impact.", simple: "Notice that anyone on the internet can see this item without logging in.", hi: "देखें कि बिना login के भी यह data accessible रहता है।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates IDOR on non-sensitive information as P5 (Informational). Programs close this as informative because no confidentiality or privacy harm is caused.",
      simple: "Rated P5 Informational because the data accessed is not private.",
      hi: "यह P5 Informational है क्योंकि accessed data confidential नहीं है।",
    },
    cwe: "CWE-639: Authorization Bypass Through User-Controlled Key",
  },

  "Broken Access Control (BAC) › Exposed Sensitive Android Intent": {
    what: {
      en: "An Android application declares an exported component (Activity, Service, or BroadcastReceiver) in its AndroidManifest.xml without permission checks. Malicious third-party apps installed on the same device can send crafted Intents to trigger sensitive internal actions (e.g. exporting private databases, starting camera/mic capture, or initiating money transfers) without user consent.",
      simple: "An Android app leaves a door open (`exported=true`) that other apps on your phone can use to trigger private features like sending money or reading messages.",
      hi: "Android app AndroidManifest.xml में internal component को `exported=true` छोड़ देती है बिना permissions के। Phone में installed कोई दूसरी malicious app Intent भेजकर sensitive actions (जैसे private data access या money transfer) trigger करवा सकती है।",
    },
    find: [
      {
        title: { en: "Audit exported components in AndroidManifest.xml with drozer/adb", simple: "Find exported=true components in the Android app manifest", hi: "Manifest में exported=true components ढूँढें और adb से trigger करें" },
        steps: [
          { en: "Decompile the APK using jadx or apktool and inspect `AndroidManifest.xml` for `<activity>`, `<service>`, or `<receiver>` with `android:exported=\"true\"` and no `android:permission`.", simple: "Look in the manifest for components marked exported=true without permissions.", hi: "jadx से manifest खोलकर बिना permission वाले exported=true components ढूँढें।" },
          { en: "Review the target component's source code in jadx to check what sensitive extras or actions it handles.", simple: "Check the Java code for that component to see what it does when opened.", hi: "Java code में देखें कि component कौन से sensitive actions handle करता है।" },
          { en: "Trigger the intent via adb: `adb shell am start -n com.target.app/.SensitiveActivity --es \"action\" \"transfer\"` and verify execution.", simple: "Use adb shell to start the component and watch it run.", hi: "`adb shell am start` से intent भेजकर sensitive action execute करवाएँ।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates this as 'varies' (P1 to P4) depending on the sensitivity of the triggered action. Triage requires: the vulnerable manifest snippet, the adb command or PoC Android app code, and proof that a sensitive action occurred without user authorization.",
      simple: "Provide the manifest snippet, the adb command that triggers it, and a screenshot showing the sensitive action happening.",
      hi: "Manifest snippet, triggering adb command, और unauthorized sensitive action execute होने का screenshot दें। Severity action पर निर्भर करती है।",
    },
    references: [
      { label: "OWASP MASTG: Android IPC & Intents", url: "https://mas.owasp.org/MASTG/0x05h-Testing-Platform-Interaction/" },
    ],
  },

  "Broken Access Control (BAC) › Exposed Sensitive iOS URL Scheme": {
    what: {
      en: "An iOS application registers a custom URL scheme (e.g., `targetapp://`) in `Info.plist` and processes deep links without verifying origin or validating parameters. A malicious app or webpage visited in Safari can invoke the custom scheme (`window.location = 'targetapp://delete-account'`) to trigger sensitive state changes or exfiltrate private data.",
      simple: "An iPhone app registers a custom link type (like myapp://). A website visited in Safari can click this link to trigger secret actions inside the app without your permission.",
      hi: "iOS app custom URL scheme (जैसे `targetapp://`) register करती है पर incoming links को validate नहीं करती। Safari में open की गई malicious website `targetapp://` link call करके app के अंदर sensitive actions execute करवा सकती है।",
    },
    find: [
      {
        title: { en: "Inspect Info.plist CFBundleURLSchemes and deep link handlers", simple: "Find custom URL schemes in the iOS app and test them in Safari", hi: "Info.plist में custom URL schemes ढूँढें और Safari से test करें" },
        steps: [
          { en: "Extract `Info.plist` from the decrypted IPA and locate `CFBundleURLTypes` -> `CFBundleURLSchemes`.", simple: "Check the app's Info.plist file for custom URL schemes.", hi: "Info.plist में `CFBundleURLSchemes` inspect करें।" },
          { en: "Analyze `openURL` or `scene(_:openURLContexts:)` in the application binary to see what actions query parameters trigger.", simple: "Check the code to see what commands the custom link accepts.", hi: "Binary के deep link handler में देखें कि कौन से parameters accepted हैं।" },
          { en: "Host an HTML page with `<iframe src=\"targetapp://action?param=value\">` and navigate to it in Safari on the test device.", simple: "Open a test webpage on your iPhone that clicks the custom scheme link.", hi: "Safari में test page खोलकर देखें कि क्या app sensitive action trigger करती है।" },
        ],
      },
    ],
    proof: {
      en: "Priority varies (P1–P4) based on the consequence of the invoked action. Triage needs: the registered URL scheme, the Safari HTML PoC, and proof of unauthorized state change or sensitive data disclosure.",
      simple: "Show the URL scheme in Info.plist, a test webpage that calls it, and proof of the sensitive action executing.",
      hi: "Registered URL scheme, Safari HTML PoC, और unauthorized action execute होने का proof दें।",
    },
    references: [
      { label: "Apple Developer: Defining a Custom URL Scheme", url: "https://developer.apple.com/documentation/xcode/defining-a-custom-url-scheme-for-your-app" },
    ],
  },

  "Broken Authentication and Session Management › Authentication Bypass": {
    what: {
      en: "A critical flaw in the authentication mechanism allows an unauthenticated attacker to bypass login requirements entirely and gain authenticated access to user or administrator accounts without supplying valid credentials (e.g. logic flaws in multi-step authentication, header spoofing like `X-User-Id`, JWT signature verification disabled, or parameter manipulation).",
      simple: "A major bug lets anyone log in to any account or admin panel without needing a password at all.",
      hi: "Authentication mechanism में गंभीर खामी के कारण unauthenticated attacker बिना password के किसी भी user या admin account में log in कर लेता है। यह top-tier P1 bug है।",
    },
    find: [
      {
        title: { en: "Test multi-step auth state machines and header trust", simple: "Skip login steps or tamper with authentication headers", hi: "Login steps skip करें या auth headers manipulate करें" },
        steps: [
          { en: "Inspect multi-step login flows (e.g. password -> OTP -> dashboard) and attempt to request step 3 directly.", simple: "Try skipping step 2 (OTP) by going directly to the final welcome page.", hi: "Password step के बाद सीधे final dashboard request भेजकर देखें (OTP skip)।" },
          { en: "Test internal header spoofing on reverse-proxy gateways: inject `X-User-Id: 1`, `X-Authenticated-User: admin`, `X-Forwarded-User: admin`.", simple: "Try adding headers like X-User-Id: 1 in Burp.", hi: "Headers में `X-User-Id: 1` या `X-Authenticated-User: admin` लगाकर request भेजें।" },
          { en: "Test response manipulation: change `{\"success\":false}` to `{\"success\":true}` in client-side authentication checks.", simple: "Flip false to true in the server response in Burp.", hi: "Burp में server response में `\"success\": false` को `true` करके client behavior देखें।" },
        ],
      },
    ],
    proof: {
      en: "Triage requires: exact reproduction steps, the manipulated request, and proof of landing in an authenticated session as another user. Rated P1.",
      simple: "Show the exact request you sent and a screenshot proving you are logged in as admin without credentials.",
      hi: "Exact request, bypass technique, और victim/admin account में बिना credentials के logged-in session का proof दें। P1 priority है।",
    },
    references: [
      { label: "PortSwigger Web Security: Authentication Bypass", url: "https://portswigger.net/web-security/authentication" },
    ],
  },

  "Broken Authentication and Session Management › Cleartext Transmission of Session Token": {
    what: {
      en: "The application transmits sensitive session identifiers or authentication tokens over unencrypted HTTP channels (or via insecure mixed content) instead of enforcing HTTPS-only transport and setting the `Secure` flag on session cookies. Anyone on the local network path (public Wi-Fi, malicious router) can intercept and hijack the session.",
      simple: "The website sends your login secret cookie over plain unencrypted HTTP instead of HTTPS, letting anyone on the same Wi-Fi steal it.",
      hi: "Application login tokens या session cookies को unencrypted HTTP पर भेजती है और `Secure` cookie flag missing होता है। Public Wi-Fi पर कोई भी network sniffer session intercept करके hijack कर सकता है।",
    },
    find: [
      {
        title: { en: "Inspect cookie flags and HTTP downgrade behavior", simple: "Check if session cookies lack the Secure flag", hi: "Session cookies में Secure flag चेक करें और HTTP requests sniff करें" },
        steps: [
          { en: "Log in over HTTPS and inspect the `Set-Cookie` response headers in Burp Suite.", simple: "Look at the Set-Cookie header in Burp.", hi: "Burp Suite में `Set-Cookie` header inspect करें।" },
          { en: "Check if the session cookie is missing the `Secure` attribute.", simple: "Check if the word 'Secure' is missing from the cookie.", hi: "चेक करें कि क्या session cookie में `Secure` flag missing है।" },
          { en: "Send an unencrypted HTTP request to `http://target.com/` and verify that the browser attaches the sensitive session cookie.", simple: "Open the http:// version of the site and see if your login cookie was sent.", hi: "Unencrypted `http://` request भेजकर confirm करें कि browser ने session cookie attach की।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs: the `Set-Cookie` header showing missing `Secure` attribute, and the captured HTTP plain-text request proving the token was sent in the clear. Ranked P4.",
      simple: "Show the cookie missing the Secure flag and an unencrypted HTTP request carrying that cookie.",
      hi: "Missing `Secure` flag वाला Set-Cookie header और plain HTTP पर transmitted cookie का screenshot दें। P4 priority है।",
    },
    references: [
      { label: "OWASP: Testing for Sensitive Data Sent Over Unencrypted Channels", url: "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/09-Testing_for_Weak_Cryptography/03-Testing_for_Sensitive_Information_Sent_via_Unencrypted_Channels" },
    ],
  },

  "Broken Authentication and Session Management › Failure to Invalidate Session › On Password Reset and/or Change": {
    what: {
      en: "When a user changes or resets their account password, the server updates the password hash in the database but fails to revoke or invalidate existing active session tokens. If an attacker previously stole a session token, they maintain persistent, perpetual access even after the legitimate user changes their password to secure the account.",
      simple: "When you change your password because someone hacked you, the website forgets to kick out the hacker's existing login session.",
      hi: "User password reset या change करता है, पर server purani active sessions invalidate नहीं करता। अगर attacker के पास session token था, तो password बदलने के बाद भी उसका access बना रहता है।",
    },
    find: [
      {
        title: { en: "Dual-browser session persistence test across password changes", simple: "Change password in Browser A, test if Browser B stays logged in", hi: "Browser A में password बदलें और देखें कि Browser B में session active रहती है या नहीं" },
        steps: [
          { en: "Open Browser 1 and Browser 2, logging into the same account in both to obtain two distinct sessions.", simple: "Log into your account on two different browsers.", hi: "Browser 1 और Browser 2 दोनों में एक ही account login करें।" },
          { en: "In Browser 1, change or reset the account password.", simple: "Change your password in Browser 1.", hi: "Browser 1 में password change करें।" },
          { en: "In Browser 2, refresh or perform an authenticated action (e.g. `GET /api/me`).", simple: "Refresh the page in Browser 2 and see if you are still logged in.", hi: "Browser 2 में authenticated action perform करें।" },
        ],
      },
    ],
    proof: {
      en: "Triage requires: timestamped proof of the password change request in Session A, followed by a successful authenticated request from Session B using the pre-existing token. Ranked P4.",
      simple: "Show proof of the password change in one session and that the second session can still access private data afterwards.",
      hi: "Password change का timestamped proof और उसके बाद दूसरी pre-existing session से authenticated request successful होने का proof दें। P4 priority है।",
    },
    cwe: "CWE-613: Insufficient Session Expiration",
  },

  "Broken Authentication and Session Management › Weak Login Function › Other Plaintext Protocol with no Secure Alternative": {
    what: {
      en: "The application requires or exposes an authentication mechanism over an inherently unencrypted protocol (e.g. Telnet, HTTP basic without TLS, FTP, SNMPv1/v2c) where no TLS/encrypted alternative is offered or enforced, exposing authentication credentials to network eavesdropping.",
      simple: "The service only lets you log in over an unencrypted connection (like Telnet or plaintext HTTP) with no secure HTTPS/SSH option.",
      hi: "Service सिर्फ unencrypted protocol (जैसे Telnet या HTTP basic बिना TLS) पर login allow करती है और कोई secure encrypted alternative provide नहीं करती।",
    },
    find: [
      {
        title: { en: "Audit service ports for plaintext authentication protocols", simple: "Check if login services run without encryption", hi: "Plaintext login services ढूँढें जहाँ encryption missing हो" },
        steps: [
          { en: "Identify network services accepting credentials (e.g. port 23 Telnet, port 21 FTP, port 80 HTTP Basic).", simple: "Find services running on plain ports.", hi: "Port 23 (Telnet) या Port 80 (HTTP Basic) जैसी services identify करें।" },
          { en: "Verify whether port 443 / SSH / TLS is unavailable or disabled.", simple: "Check if secure alternatives like HTTPS or SSH are missing.", hi: "चेक करें कि क्या secure alternatives (HTTPS, SSH) unavailable हैं।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs: the target host, open port, packet capture or curl output demonstrating plaintext credentials in transit, and verification that no encrypted option exists. Ranked P4.",
      simple: "Show the service running over plain text with no HTTPS/SSH available.",
      hi: "Target host, open port, और plaintext authentication का capture दें जहाँ secure alternative न हो। P4 priority है।",
    },
    cwe: "CWE-319: Cleartext Transmission of Sensitive Information",
  },

  "Broken Authentication and Session Management › Weak Registration Implementation › Over HTTP": {
    what: {
      en: "The user registration or signup workflow is served over unencrypted HTTP (or submits registration payloads to an HTTP endpoint), transmitting newly created passwords, usernames, and email addresses in cleartext over the network.",
      simple: "The account creation / sign up form sends your new password over unencrypted HTTP instead of HTTPS.",
      hi: "User registration form unencrypted HTTP पर submit होता है, जिससे नया password, username और email network पर cleartext transmit होते हैं।",
    },
    find: [
      {
        title: { en: "Inspect registration form action and network submission", simple: "Check if the registration form submits to an http:// URL", hi: "Registration form का action URL चेक करें कि वह http:// तो नहीं है" },
        steps: [
          { en: "Inspect the signup page HTML: `<form action=\"http://target.com/register\" method=\"POST\">`.", simple: "Check the form action in DevTools.", hi: "DevTools में registration form का `<form action>` inspect करें।" },
          { en: "Submit a test registration and observe network traffic in Burp Suite.", simple: "Submit a test signup and see if traffic is unencrypted HTTP.", hi: "Signup submit करके Burp में देखें कि request unencrypted HTTP पर गई।" },
        ],
      },
    ],
    proof: {
      en: "Triage requires: the registration request showing plaintext credentials submitted over HTTP port 80. Ranked P4.",
      simple: "Show the signup HTTP request carrying the new password over plain HTTP.",
      hi: "Plain HTTP पर new credentials transmit होने का request capture screenshot दें। P4 priority है।",
    },
  },

  "Broken Authentication and Session Management › Concurrent Logins": {
    what: {
      en: "The application permits an account to maintain simultaneous concurrent active sessions across multiple devices or IP addresses without invalidating earlier sessions or alerting the user. While common for consumer web apps, high-security contexts (banking, trading) sometimes flag this.",
      simple: "You can be logged in from multiple phones or computers at the exact same time without the website logging you out on other devices.",
      hi: "Application एक ही account से multiple devices पर simultaneous concurrent sessions allow करती है। Consumer apps में यह standard behavior है, इसलिए security bug bounty में यह P5 Informational माना जाता है।",
    },
    find: [
      {
        title: { en: "Test multi-device simultaneous session tolerance", simple: "Log into the same account from two browsers at once", hi: "एक साथ दो browsers से login करके concurrent access चेक करें" },
        steps: [
          { en: "Log into the application in Chrome and Firefox simultaneously.", simple: "Open two different browsers and log in to the same user.", hi: "दो अलग browsers में एक ही account login करें।" },
          { en: "Perform actions in both browsers and verify that both sessions remain valid.", simple: "See that both browsers stay logged in at the same time.", hi: "दोनों browsers में actions perform करके देखें कि दोनों sessions active रहती हैं।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd classifies concurrent logins as P5 (Informational). Almost all bug bounty programs explicitly exclude concurrent sessions as intentional product design unless program policy strictly mandates single-session enforcement.",
      simple: "Rated P5 Informational / Out of Scope because concurrent logins are a standard feature.",
      hi: "यह P5 Informational / Out of Scope है क्योंकि ज्यादातर web apps में concurrent sessions normal feature होता है।",
    },
  },

  "Broken Authentication and Session Management › Failure to Invalidate Session › Concurrent Sessions On Logout": {
    what: {
      en: "When a user clicks 'Log Out' on one device, the server only destroys the local session token for that specific browser, leaving existing concurrent sessions on other devices (e.g. mobile phone, work laptop) active and valid.",
      simple: "Clicking logout on your computer logs you out there, but leaves your account still logged in on your phone or other computers.",
      hi: "जब user एक browser पर 'Log Out' करता है, तो server सिर्फ उसी specific session को destroy करता है; दूसरे devices पर चल रही concurrent sessions active रहती हैं।",
    },
    find: [
      {
        title: { en: "Test session invalidation across concurrent devices on logout", simple: "Log in on two devices, log out on one, and check the other", hi: "दो devices पर login करें, एक से logout करें और दूसरे पर check करें" },
        steps: [
          { en: "Establish active sessions in Browser A and Browser B.", simple: "Log in on Browser A and Browser B.", hi: "Browser A और Browser B में active sessions बनाएँ।" },
          { en: "Click 'Logout' in Browser A.", simple: "Click logout in Browser A.", hi: "Browser A में logout click करें।" },
          { en: "Attempt an authenticated request in Browser B and observe that Browser B remains authenticated.", simple: "Check if Browser B is still logged in.", hi: "Browser B में request भेजकर confirm करें कि session valid रही।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates this P5 (Informational). Most applications offer 'Log out of all devices' as a separate feature; single-device logout is standard expected behavior.",
      simple: "Rated P5 Informational because per-device logout is standard web behavior.",
      hi: "यह P5 Informational है क्योंकि per-device logout standard behavior है जब तक user 'Logout from all devices' choose न करे।",
    },
    cwe: "CWE-613: Insufficient Session Expiration",
  },

  "Broken Authentication and Session Management › Excessive JSON Web Token (JWT) Lifetime": {
    what: {
      en: "A JSON Web Token (JWT) issued by the application contains an `exp` (expiration) timestamp set far into the future (e.g. months or years, or no expiration at all). Because stateless JWTs cannot be easily revoked without server-side blacklisting, a compromised token remains valid indefinitely.",
      simple: "The website gives you a login token that never expires or expires after several months, so if it is stolen, the hacker can use it forever.",
      hi: "Application द्वारा issue किया गया JWT token का expiration (`exp`) कई महीनों या सालों बाद का होता है (या `exp` claim missing होता है)। Stateless होने के कारण compromised token लंबे समय तक valid रहता है।",
    },
    find: [
      {
        title: { en: "Decode JWT payload and calculate expiration delta", simple: "Decode the login token and check the exp date", hi: "JWT token decode करके exp claim का time delta calculate करें" },
        steps: [
          { en: "Capture the JWT from `Authorization: Bearer <token>` or cookies.", simple: "Copy your login JWT token.", hi: "Login JWT token capture करें।" },
          { en: "Decode the base64url payload and inspect the `exp` claim.", simple: "Paste it into jwt.io to read the expiration date.", hi: "Base64 decode करके payload में `exp` claim inspect करें।" },
          { en: "Calculate the difference between `iat` (issued at) and `exp`: if it exceeds several days/weeks for sensitive operations without revocation, document the duration.", simple: "Calculate how many days or months until it expires.", hi: "`iat` और `exp` का अंतर निकालें।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates excessive JWT lifetime as P5 (Informational). Triage treats token lifetime as a security hardening recommendation unless paired with a demonstrated token theft or replay scenario.",
      simple: "Rated P5 Informational unless chained with token theft.",
      hi: "यह P5 Informational है। Triage इसे hardening issue मानता है जब तक token theft का practical scenario न हो।",
    },
  },

  "Broken Authentication and Session Management › Session Fixation › Local Attack Vector": {
    what: {
      en: "The application accepts a pre-existing session identifier supplied by a local attacker (e.g. on a shared public terminal) and fails to issue a fresh session token upon user authentication, continuing to use the pre-authentication session ID. An attacker on the same local physical terminal or local network can hijack the session post-login.",
      simple: "An attacker visits a library computer and sets a cookie. When you sit down and log in, the site keeps that same cookie, letting the attacker take over your session.",
      hi: "Application login करने के बाद नया session token issue नहीं करती बल्कि pre-login session ID को ही authenticate कर देती है। Local shared terminal पर attacker victim की authenticated session hijack कर सकता है।",
    },
    find: [
      {
        title: { en: "Compare pre-auth and post-auth session cookie values", simple: "Check if your session cookie changes after logging in", hi: "Login से पहले और login के बाद की session cookie compare करें" },
        steps: [
          { en: "Browse to the login page and record the initial session cookie (e.g. `PHPSESSID=abc123`).", simple: "Check your cookie before logging in.", hi: "Login page खोलकर initial session cookie नोट करें।" },
          { en: "Complete authentication with valid credentials.", simple: "Log in with your username and password.", hi: "Valid credentials से log in करें।" },
          { en: "Inspect the `Set-Cookie` headers or active cookie store to verify if the session identifier remained identical (`PHPSESSID=abc123`).", simple: "Check if the cookie is still the exact same value.", hi: "चेक करें कि क्या login के बाद भी वही पुराना session identifier active रहा।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates local session fixation as P5 (Informational) because it requires physical access to the victim's terminal or local attack capabilities.",
      simple: "Rated P5 Informational because it requires local access to the victim's computer.",
      hi: "यह P5 Informational है क्योंकि इसके लिए physical/local access required होता है।",
    },
    cwe: "CWE-384: Session Fixation",
  },

  "Broken Authentication and Session Management › Failure to Invalidate Session › Long Timeout": {
    what: {
      en: "The application does not enforce an idle session timeout (or has an excessively long timeout of several weeks or months), allowing unattended sessions on shared computers to remain logged in indefinitely.",
      simple: "The website never logs you out even if you haven't touched the keyboard in weeks.",
      hi: "Application idle session timeout enforce नहीं करती या timeout कई हफ़्तों/महीनों का होता है, जिससे inactive session लंबे समय तक logged-in रहती है।",
    },
    find: [
      {
        title: { en: "Test idle session persistence over extended inactivity", simple: "Leave a session idle and check if it still works hours later", hi: "Session को idle छोड़कर check करें कि वह active रहती है या नहीं" },
        steps: [
          { en: "Log in and obtain a valid session token.", simple: "Log in to your account.", hi: "Account login करके session token लें।" },
          { en: "Wait for a prolonged idle period (e.g. 24–48 hours) without making requests.", simple: "Leave it untouched for 24 hours.", hi: "24-48 घंटे तक कोई request न भेजें।" },
          { en: "Send an authenticated request using the same token and observe that it is still accepted.", simple: "Send a request and see if it is still accepted.", hi: "Request भेजकर देखें कि token अभी भी accepted है।" },
        ],
      },
    ],
    proof: {
      en: "Classified as P5 (Informational). Idle timeouts are considered application business logic and UX decisions rather than vulnerabilities.",
      simple: "Rated P5 Informational / Out of Scope because timeout duration is a UX preference.",
      hi: "यह P5 Informational है क्योंकि timeout policy application UX decision मानी जाती है।",
    },
    cwe: "CWE-613: Insufficient Session Expiration",
  },

  "Broken Authentication and Session Management › Weak Login Function › Not Operational or Intended Public Access": {
    what: {
      en: "An authentication endpoint is non-operational, deprecated, disabled, or points to a non-functional mockup interface intended purely for demonstration or public marketing access without connecting to real backend user accounts.",
      simple: "A login form on the website doesn't actually work or is just a non-functional demo box.",
      hi: "Login endpoint non-operational, deprecated या sirf marketing demo page है जो real backend accounts से connect नहीं करता।",
    },
    find: [
      {
        title: { en: "Verify backend connectivity of non-operational login forms", simple: "Check if the login form actually connects to a backend", hi: "जाँचें कि login form backend से connect करता भी है या नहीं" },
        steps: [
          { en: "Submit credentials into a demo or staging login box.", simple: "Try submitting text in the form.", hi: "Demo form में credentials submit करें।" },
          { en: "Observe that no real backend authentication occurs (e.g. static alert or 404).", simple: "Notice that no real network request or login happens.", hi: "देखें कि कोई real network call या authentication नहीं होती।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates this P5 (Informational). Non-functional or intended demo forms have zero security impact.",
      simple: "Rated P5 Informational because there is no vulnerability on a non-working demo form.",
      hi: "यह P5 Informational है क्योंकि non-operational demo form पर कोई security risk नहीं है।",
    },
    cwe: "CWE-287: Improper Authentication",
  },

  "Broken Authentication and Session Management › Failure to Invalidate Session › On 2FA Activation/Change": {
    what: {
      en: "When a user enables Two-Factor Authentication (2FA) or modifies their 2FA settings, the application fails to invalidate existing single-factor active sessions. An attacker who had previously obtained a session token remains logged in and bypasses the newly introduced 2FA requirement entirely.",
      simple: "When you turn on Two-Factor Authentication (2FA), the website doesn't log out your other devices, so anyone who was already logged in stays logged in without needing the 2FA code.",
      hi: "जब user Two-Factor Authentication (2FA) enable करता है, तो server existing active sessions revoke नहीं करता। पहले से logged-in attacker बिना 2FA code दिए session use करता रह सकता है।",
    },
    find: [
      {
        title: { en: "Test session validity across 2FA enrollment", simple: "Log in on Browser B, turn on 2FA in Browser A, and check Browser B", hi: "Browser B में login रखें, Browser A में 2FA on करें और Browser B की validity चेक करें" },
        steps: [
          { en: "Open Session A and Session B on the same account.", simple: "Open your account in two browsers.", hi: "दो browsers में account login करें।" },
          { en: "In Session A, enable 2FA (e.g. TOTP authenticator app).", simple: "Turn on 2FA in the first browser.", hi: "Session A में 2FA enable करें।" },
          { en: "In Session B, attempt an authenticated request: observe whether Session B is prompted for 2FA or remains fully authenticated.", simple: "Make a request in the second browser to see if it lets you through without 2FA.", hi: "Session B में request भेजकर देखें कि क्या वह बिना 2FA के चलती रहती है।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates this as P5 (Informational) by default unless program policy mandates full session revocation upon security setting changes. Triage needs timestamped proof of 2FA activation followed by successful authenticated requests from pre-existing sessions.",
      simple: "Show that a pre-existing session can still perform actions after 2FA was enabled.",
      hi: "2FA activate करने के बाद pre-existing session से authenticated action perform होने का proof दें।",
    },
    cwe: "CWE-613: Insufficient Session Expiration",
  },

  "Broken Authentication and Session Management › Failure to Invalidate Session › On Email Change": {
    what: {
      en: "When an account's registered email address is updated, the application does not revoke active session tokens across other devices, allowing older sessions to persist under the new email address.",
      simple: "Changing your account email doesn't log out sessions on other computers.",
      hi: "Account की registered email बदलने पर server active sessions revoke नहीं करता, जिससे पुरानी sessions active रहती हैं।",
    },
    find: [
      {
        title: { en: "Test session persistence following email update", simple: "Change your email address and see if other sessions stay logged in", hi: "Email change करके दूसरी sessions की validity चेक करें" },
        steps: [
          { en: "Log into the account in Session A and Session B.", simple: "Log in on two browsers.", hi: "दो browsers में login करें।" },
          { en: "Update the email address in Session A.", simple: "Change your email in Session A.", hi: "Session A में email change करें।" },
          { en: "Perform an authenticated action in Session B.", simple: "Check if Session B can still make requests.", hi: "Session B में authenticated request भेजकर देखें।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd classifies this as P5 (Informational). Triage considers this a hardening best-practice rather than a high-severity bug.",
      simple: "Rated P5 Informational.",
      hi: "यह P5 Informational है।",
    },
    cwe: "CWE-613: Insufficient Session Expiration",
  },

  "Broken Authentication and Session Management › Failure to Invalidate Session › On Logout (Server-Side Only)": {
    what: {
      en: "When a user logs out, the client deletes the cookie locally in the browser, but the backend server never invalidates or blacklists the session token. If the token was captured prior to logout, it can be replayed in API requests indefinitely.",
      simple: "Clicking logout deletes the cookie in your browser, but the server never cancels it, so anyone who saved the token can still use it.",
      hi: "Logout click करने पर browser local cookie तो delete कर देता है, पर server backend पर token revoke/blacklist नहीं करता। Stored token replay करने पर server request accept कर लेता है।",
    },
    find: [
      {
        title: { en: "Replay captured session token post-logout", simple: "Save your session token, click logout, and replay the token in Burp", hi: "Token save करके logout करें, फिर Burp में replay करें" },
        steps: [
          { en: "Capture your active session cookie or Bearer token in Burp Suite.", simple: "Copy your active login token.", hi: "Active session token copy करें।" },
          { en: "Click 'Logout' in the web application UI.", simple: "Log out in your browser.", hi: "Web UI में logout click करें।" },
          { en: "Replay the captured token in Burp Repeater against an authenticated endpoint (e.g. `GET /api/user/profile`).", simple: "Send the old token in Burp to see if the server still answers with 200 OK.", hi: "Burp Repeater से old token के साथ authenticated endpoint पर request भेजें।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates server-side session non-invalidation on logout as P5 (Informational) unless chained with token theft. Triage requires: the logout request, followed by a 200 OK response to an authenticated request with the old token.",
      simple: "Show the logout request and a subsequent successful request with the old token.",
      hi: "Logout request और उसके बाद old token से 200 OK authenticated response का screenshot दें। P5 priority है।",
    },
    cwe: "CWE-613: Insufficient Session Expiration",
  },

  "Broken Authentication and Session Management › SAML Replay": {
    what: {
      en: "The SAML Service Provider (SP) accepts and processes a previously consumed SAML assertion (response) because it fails to validate message uniqueness, track assertion IDs, or enforce the `NotOnOrAfter` condition. An attacker who intercepts a SAML assertion can replay it to establish an authenticated session.",
      simple: "An attacker intercepts your SAML single-sign-on login message and sends it again to log into your account.",
      hi: "SAML Service Provider message uniqueness या `NotOnOrAfter` validate नहीं करता। Attacker intercepted SAML assertion replay करके victim के account में log in कर सकता है।",
    },
    find: [
      {
        title: { en: "Capture and replay SAMLResponse POST body", simple: "Intercept the SAMLResponse and send it a second time", hi: "SAMLResponse intercept करके दोबारा भेजें" },
        steps: [
          { en: "Intercept the POST request containing `SAMLResponse` to the Assertion Consumer Service (ACS) endpoint (`/saml/acs`).", simple: "Catch the SAML login request in Burp.", hi: "SAML ACS endpoint पर जाने वाली `SAMLResponse` request intercept करें।" },
          { en: "Allow the initial login to complete in the browser.", simple: "Let the first login finish.", hi: "पहला login complete होने दें।" },
          { en: "In Burp Repeater, re-send the exact same `SAMLResponse` payload in a fresh session and check if a new valid session cookie is issued.", simple: "Send the exact same login packet again in a new incognito window.", hi: "Burp Repeater में वही `SAMLResponse` दोबारा भेजकर देखें कि क्या नया session cookie मिलता है।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd VRT rates SAML replay as P5 if the assertion replay window has already expired, or up to P3/P2 if the SP accepts identical assertion IDs indefinitely. Triage needs: proof of two separate sessions established using one single SAML assertion.",
      simple: "Show one SAML token being used twice to create two separate login sessions.",
      hi: "एक ही SAML assertion से दो अलग sessions create होने का proof दें।",
    },
    cwe: "CWE-294: Authentication Bypass by Capture-replay",
  },

  "Broken Authentication and Session Management › Secret Questions Used for Account Verification": {
    what: {
      en: "The application relies on predictable or easily researchable 'Security Questions' (e.g. 'What is your mother's maiden name?', 'What high school did you attend?') to reset passwords or verify identity, enabling account takeover via OSINT.",
      simple: "The site asks easily guessable security questions (like 'What high school did you go to?') to reset passwords, letting hackers guess them from Facebook.",
      hi: "Application password reset के लिए security questions ('Mother's maiden name', 'High school name') use करती है जिन्हें OSINT या social media से आसानी से पता किया जा सकता है।",
    },
    find: [
      {
        title: { en: "Audit password recovery verification mechanisms", simple: "Check if password reset only asks public security questions", hi: "Password reset flow में security questions inspect करें" },
        steps: [
          { en: "Navigate to the forgot password workflow and enter a target username.", simple: "Click forgot password.", hi: "Forgot password flow में username डालें।" },
          { en: "Observe whether the system prompts for low-entropy security questions instead of email/SMS verification.", simple: "See if it only asks personal trivia questions.", hi: "देखें कि क्या system email/SMS के बजाय trivia questions पूछता है।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates this P5 (Informational). Using secret questions is an outdated design practice documented as a security weakness.",
      simple: "Rated P5 Informational as a weak security practice.",
      hi: "यह P5 Informational है क्योंकि security questions outdated security practice हैं।",
    },
  },

  "Broken Authentication and Session Management › Failure to Invalidate Session › On Permission Change": {
    what: {
      en: "When an administrator demotes a user's role (e.g. from Admin to Viewer) or removes permissions, the server does not revoke or refresh the user's active session tokens. The user continues to perform privileged operations until the session naturally expires.",
      simple: "When a manager removes your admin privileges at work, your existing browser tab still lets you do admin actions until you log out.",
      hi: "Admin द्वारा user के permissions घटाने (Admin -> Viewer) के बाद server active tokens refresh नहीं करता। User session expire होने तक privileged actions perform करता रह सकता है।",
    },
    find: [
      {
        title: { en: "Test privileged action execution post-demotion", simple: "Demote an admin in one account and test if their open tab still works", hi: "Admin permissions घटाने के बाद open tab से privileged actions test करें" },
        steps: [
          { en: "Log in as an Administrator in Session A and as a test Admin in Session B.", simple: "Open both accounts.", hi: "दो accounts में sessions बनाएँ।" },
          { en: "In Session A, demote Session B's user to a standard non-privileged role.", simple: "Change Session B's role to normal user.", hi: "Session A से Session B का role downgrade करें।" },
          { en: "In Session B, attempt an administrative action (e.g. `POST /api/admin/users/delete`).", simple: "Try an admin action in Session B.", hi: "Session B से privileged admin endpoint call करें।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates this as 'varies' (P2 to P4) depending on the sensitivity of the retained privilege. Triage requires: proof of permission demotion, followed by successful execution of an admin-tier request using the pre-existing session token.",
      simple: "Show that a demoted user can still execute admin actions using their old open session.",
      hi: "Role downgrade का proof और उसके बाद old session से privileged action successfully execute होने का HTTP capture दें।",
    },
    cwe: "CWE-613: Insufficient Session Expiration",
  },

  "Cross-Site Request Forgery (CSRF) › Application-Wide": {
    what: {
      en: "The entire application completely lacks anti-CSRF tokens (and lacks SameSite cookie protections or custom header requirements) across all state-changing endpoints (POST, PUT, DELETE). An attacker can host an external webpage that silently executes arbitrary actions (changing passwords, transferring funds, updating emails) on behalf of any authenticated user who visits the attacker's page.",
      simple: "The entire website has no CSRF protection. Visiting an attacker's website can automatically delete your account, send money, or change your email without your knowledge.",
      hi: "पूरी application में anti-CSRF tokens और SameSite protections missing हैं। Attacker malicious website host करके visit करने वाले किसी भी logged-in user से unauthorized actions (email change, money transfer) silently execute करवा सकता है।",
    },
    find: [
      {
        title: { en: "Audit anti-CSRF tokens across all state-changing forms", simple: "Check multiple forms to confirm none of them use CSRF tokens", hi: "सभी state-changing forms में anti-CSRF tokens की अनुपस्थिति verify करें" },
        steps: [
          { en: "Inspect multiple POST/PUT requests across user profile, security settings, and financial operations.", simple: "Look at multiple save/submit requests in Burp.", hi: "Profile, settings और billing requests Burp में inspect करें।" },
          { en: "Verify that no CSRF token parameter, custom header (`X-Requested-With`), or `SameSite=Strict` cookie attribute is present.", simple: "Check that no token header or cookie protection exists.", hi: "Confirm करें कि कोई CSRF token या SameSite cookie attribute नहीं है।" },
          { en: "Build a multi-action HTML PoC that auto-submits a form from an external domain (`evil.com`).", simple: "Create a test webpage that submits a form to the target site.", hi: "External HTML PoC बनाएँ जो target endpoint पर form auto-submit करे।" },
        ],
      },
    ],
    proof: {
      en: "Rated P2 in Bugcrowd VRT. Triage requires: a functional cross-origin HTML PoC and proof that visiting the PoC page while logged in results in an unauthorized state change on the target account.",
      simple: "Provide the HTML PoC file and show it successfully executing state changes when opened in a logged-in browser.",
      hi: "Working cross-origin HTML PoC और victim account पर unauthorized state change होने का screenshot दें। P2 priority है।",
    },
    cwe: "CWE-352: Cross-Site Request Forgery (CSRF)",
    references: [
      { label: "PortSwigger Web Security: CSRF", url: "https://portswigger.net/web-security/csrf" },
    ],
  },

  "Cross-Site Request Forgery (CSRF) › CSRF Token Not Unique Per Request": {
    what: {
      en: "The application uses an anti-CSRF token that remains static across requests within the user's session rather than being rotated per request. As long as the token is unique to the session, cryptographically unpredictable, and validated server-side, this represents standard, secure synchronizer token architecture.",
      simple: "The website uses the same CSRF token throughout your login session instead of changing it on every single click.",
      hi: "Application पूरे session के दौरान same CSRF token use करती है (per-request rotate नहीं करती)। यह standard synchronizer token pattern है और कोई vulnerability नहीं है जब तक token predictable न हो।",
    },
    find: [
      {
        title: { en: "Compare CSRF tokens across sequential requests", simple: "Check if the CSRF token changes between two form submissions", hi: "दो requests में CSRF token compare करें" },
        steps: [
          { en: "Submit a form and note the CSRF token value in the request.", simple: "Submit a form and copy the token.", hi: "Form submit करके CSRF token copy करें।" },
          { en: "Submit a second form within the same session and compare token values.", simple: "Submit again and see if the token is the same.", hi: "उसी session में दोबारा submit करके token compare करें।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates this P5 (Informational). Per-session CSRF tokens are industry standard and do not constitute a vulnerability unless the token is predictable or shared across users.",
      simple: "Rated P5 Informational / Not a vulnerability.",
      hi: "यह P5 Informational है क्योंकि per-session CSRF token standard secure practice है।",
    },
    cwe: "CWE-352: Cross-Site Request Forgery (CSRF)",
  },

  "Cross-Site Request Forgery (CSRF) › Flash-Based": {
    what: {
      en: "A legacy CSRF vulnerability requiring Adobe Flash Player to send cross-domain requests via `crossdomain.xml` misconfigurations or Flash ActionScript. Because Flash Player is no longer supported or installed in modern browsers, this cannot be exploited.",
      simple: "An old CSRF trick that required Adobe Flash to send cross-site requests, but Flash is no longer supported anywhere.",
      hi: "पुराना Flash-based CSRF attack जो Adobe Flash Player पर निर्भर था। Modern browsers में Flash support न होने के कारण यह exploit नहीं हो सकता।",
    },
    find: [
      {
        title: { en: "Audit legacy Flash cross-domain policies", simple: "Check old Flash crossdomain.xml files", hi: "पुराने crossdomain.xml inspect करें" },
        steps: [
          { en: "Inspect legacy `crossdomain.xml` policies allowing arbitrary domains.", simple: "Look at crossdomain.xml.", hi: "Legacy `crossdomain.xml` file inspect करें।" },
          { en: "Recognize that modern browsers completely refuse to execute Flash content.", simple: "Confirm browsers block Flash.", hi: "Confirm करें कि modern browsers Flash block कर चुके हैं।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates Flash-based CSRF as P5 (Informational) or Out of Scope.",
      simple: "Rated P5 Informational / Out of Scope.",
      hi: "Flash deprecation के कारण यह P5 / Out of Scope है।",
    },
    cwe: "CWE-352: Cross-Site Request Forgery (CSRF)",
  },

  "Cross-Site Request Forgery (CSRF) › Action-Specific › Logout": {
    what: {
      en: "The application's logout endpoint (e.g. `/logout`) can be triggered via a GET request or a POST request without anti-CSRF protection. An attacker can embed `<img src=\"https://target.com/logout\">` on a malicious site, causing any visiting user to be logged out of their session (Denial of Service).",
      simple: "A malicious website can put an image tag pointing to the target site's logout button, logging you out as a nuisance.",
      hi: "Logout endpoint bina CSRF protection के GET या POST request allow करता है। Malicious site पर visit करने पर victim अपनी session से logout हो जाता है।",
    },
    find: [
      {
        title: { en: "Test cross-origin logout triggering", simple: "Embed a link or image pointing to logout and open it in a browser", hi: "Logout endpoint को image tag या cross-origin link से test करें" },
        steps: [
          { en: "Log into the application in your browser.", simple: "Log in to your account.", hi: "Application में login करें।" },
          { en: "Create an HTML file: `<img src=\"https://target.com/logout\">` and open it locally.", simple: "Open a webpage with an img tag pointing to logout.", hi: "Local HTML page में `<img src=\"https://target.com/logout\">` डालकर open करें।" },
          { en: "Check if the active session was destroyed.", simple: "See if you got logged out.", hi: "Target site पर जाकर देखें कि क्या session logout हो गई।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates Logout CSRF as P5 (Informational). Almost all bug bounty programs explicitly list Logout CSRF as an excluded, out-of-scope nuisance issue with no financial reward.",
      simple: "Rated P5 Informational / Excluded in almost all bug bounty programs.",
      hi: "यह P5 Informational है और लगभग सभी bug bounty programs में excluded/out-of-scope होता है।",
    },
    cwe: "CWE-352: Cross-Site Request Forgery (CSRF)",
  },

  "Cross-Site Request Forgery (CSRF) › Action-Specific › Unauthenticated Action": {
    what: {
      en: "A CSRF vulnerability exists on an endpoint that requires no authentication (such as a public contact form, newsletter signup, or search query). Because the action can already be triggered by anyone without credentials, there is no user session to exploit.",
      simple: "A form has no CSRF token, but the form was already completely public (like subscribing to a public newsletter).",
      hi: "CSRF protection missing है पर endpoint unauthenticated है (जैसे public contact form या newsletter signup)। चूँकि कोई भी unauthenticated user यह action कर सकता है, user session compromise नहीं होती।",
    },
    find: [
      {
        title: { en: "Verify session requirement on CSRF endpoint", simple: "Test if the form requires being logged in", hi: "जाँचें कि क्या form में login होना ज़रूरी है" },
        steps: [
          { en: "Submit the form in an incognito window without cookies.", simple: "Submit the form while logged out.", hi: "Incognito window में बिना cookies के form submit करें।" },
          { en: "Observe that the form accepts input and processes normally without authentication.", simple: "Notice that it works without logging in.", hi: "देखें कि बिना login के भी form normally submit हो जाता है।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates CSRF on unauthenticated actions as 'varies' (typically P5/Informational). Programs close this as Informational because there is no privilege escalation.",
      simple: "Usually P5 Informational because anyone could submit the public form anyway.",
      hi: "यह P5 Informational है क्योंकि public form कोई भी submit कर सकता है।",
    },
    cwe: "CWE-352: Cross-Site Request Forgery (CSRF)",
  },

  "Unvalidated Redirects and Forwards › Open Redirect › Flash-Based": {
    what: {
      en: "A legacy Adobe Flash application redirects the user's browser to an arbitrary external URL passed via Flash parameters. Deprecated due to Flash Player end-of-life.",
      simple: "An old Flash file redirects users to external websites, but Flash no longer works in modern browsers.",
      hi: "पुरानी Flash file parameters के आधार पर external URL redirect करती है। Flash deprecation के कारण यह modern web पर functional नहीं है।",
    },
    find: [
      {
        title: { en: "Inspect Flash redirection parameters", simple: "Check old Flash files for redirect links", hi: "Flash files में redirect parameters चेक करें" },
        steps: [
          { en: "Decompile the legacy SWF and inspect `navigateToURL` calls.", simple: "Decompile the SWF.", hi: "SWF decompile करके `navigateToURL` inspect करें।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates this P5 (Informational) or Out of Scope.",
      simple: "Rated P5 Informational / Out of Scope.",
      hi: "यह P5 Informational / Out of Scope है।",
    },
    cwe: "CWE-601: URL Redirection to Untrusted Site ('Open Redirect')",
  },

  "Unvalidated Redirects and Forwards › Open Redirect › Header-Based": {
    what: {
      en: "The application generates an HTTP redirect (`302 Found` or `301 Moved Permanently`) with a `Location:` header derived from an incoming HTTP request header (such as `X-Forwarded-Host`, `Host`, or custom headers). An attacker cannot easily force a victim's browser to send arbitrary custom headers in cross-origin requests without an existing header injection or proxy control.",
      simple: "The website redirects users based on a special HTTP header that regular web browsers cannot send during normal link clicking.",
      hi: "Application incoming request header (जैसे `X-Forwarded-Host`) के आधार पर `Location:` redirect header generate करती है। Normal browser cross-origin requests में custom headers inject नहीं कर सकता, इसलिए attack feasibility limited होती है।",
    },
    find: [
      {
        title: { en: "Test header-based redirect generation", simple: "Send custom Host or X-Forwarded-Host headers in Burp", hi: "Burp में Host या X-Forwarded-Host headers भेजकर redirect देखें" },
        steps: [
          { en: "Send a request in Burp Suite with: `X-Forwarded-Host: attacker.com`.", simple: "Add X-Forwarded-Host: attacker.com in Burp.", hi: "Burp में `X-Forwarded-Host: attacker.com` header add करें।" },
          { en: "Inspect the response for `Location: https://attacker.com/`.", simple: "Check if the server redirects to attacker.com.", hi: "Response में देखें कि क्या `Location: https://attacker.com` मिला।" },
          { en: "Assess whether a victim's browser can be induced to send this header via standard navigation.", simple: "Determine if a regular user's browser can be forced to send that header.", hi: "Assess करें कि क्या victim का browser यह header send कर सकता है।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates header-based open redirects as P5 (Informational) because standard web browsers cannot inject or tamper with headers like `Host` or `X-Forwarded-Host` during normal link navigation.",
      simple: "Rated P5 Informational unless chained with cache poisoning or header injection.",
      hi: "यह P5 Informational है क्योंकि normal browser navigation में custom headers inject नहीं किए जा सकते। Web cache poisoning के साथ chain होने पर impact बढ़ सकता है।",
    },
    escalate: {
      en: "If the header-based redirect response is cached by an intermediate CDN or web cache (Web Cache Poisoning), document the cache poisoning to escalate to P3/P2.",
      simple: "If the server caches the redirect so every normal visitor gets sent to attacker.com, it becomes P2/P3.",
      hi: "अगर यह redirect response CDN में cache हो जाए (Web Cache Poisoning), तो P2/P3 escalate करें।",
    },
    cwe: "CWE-601: URL Redirection to Untrusted Site ('Open Redirect')",
  },

  "Unvalidated Redirects and Forwards › Lack of Security Speed Bump Page": {
    what: {
      en: "The application redirects users to external third-party links directly without displaying an intermediate warning notice or 'speed bump' page (e.g. 'You are now leaving our website'). While speed bumps are common in banking to prevent phishing confusion, the lack of one is not an exploitable vulnerability.",
      simple: "When clicking an external link, the website takes you straight there without showing a popup saying 'You are now leaving our website'.",
      hi: "External links पर click करने पर application direct redirect कर देती है बिना किसी 'You are leaving this website' warning page के। यह compliance/UX feature है, security vulnerability नहीं।",
    },
    find: [
      {
        title: { en: "Inspect outbound external link navigation", simple: "Click an external link on the site to see if a warning appears", hi: "External links click करके warning page की उपस्थिति चेक करें" },
        steps: [
          { en: "Locate external partner or resource links on the target website.", simple: "Find an external link on the site.", hi: "Website पर external links ढूँढें।" },
          { en: "Click the link and observe immediate redirection to the external domain without an intermediate dialog.", simple: "Notice that it opens immediately without warning.", hi: "देखें कि बिना warning dialog के direct external site खुल जाती है।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates this P5 (Informational). Programs explicitly treat the absence of external link disclaimer pages as Informational / Out of Scope.",
      simple: "Rated P5 Informational / Out of Scope.",
      hi: "यह P5 Informational / Out of Scope है।",
    },
    cwe: "CWE-601: URL Redirection to Untrusted Site ('Open Redirect')",
  },

  "Unvalidated Redirects and Forwards › Open Redirect › POST-Based": {
    what: {
      en: "An open redirect exists within a POST request (e.g. login form submission or wizard step). Because the redirect parameter cannot be placed directly into a clickable GET URL, an attacker must host a webpage with auto-submitting form JavaScript (CSRF) to trigger the redirect against a victim.",
      simple: "The redirect parameter only works in a POST form submit. An attacker has to build a webpage that auto-submits the form to redirect someone.",
      hi: "Open redirect POST request में मौजूद है। URL link share करके direct exploit नहीं किया जा सकता; attacker को auto-submitting form (CSRF) host करना पड़ता है।",
    },
    find: [
      {
        title: { en: "Test POST redirection parameters with cross-origin auto-submit", simple: "Test redirect parameters in POST requests", hi: "POST request में redirect parameters test करें" },
        steps: [
          { en: "Identify a POST endpoint accepting a `redirect_to` or `return_url` parameter.", simple: "Find a POST request with a return URL parameter.", hi: "POST request में `redirect_to` parameter पहचानें।" },
          { en: "Supply `https://attacker.com` in the parameter and check if a 302 redirect is returned.", simple: "Change it to attacker.com and see if the server redirects.", hi: "Parameter में `https://attacker.com` डालकर 302 response देखें।" },
          { en: "Build a cross-origin HTML form to test if a victim can be redirected via CSRF.", simple: "Make an auto-submitting HTML form to see if it redirects victims.", hi: "Auto-submitting HTML form बनाकर test करें।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates POST-based open redirects as P5 (Informational). Because modern browsers enforce SameSite cookie restrictions and POST-based redirection requires extra victim interaction, impact is lower than traditional GET open redirects.",
      simple: "Rated P5 Informational because it is much harder to exploit than a normal clickable link.",
      hi: "यह P5 Informational है क्योंकि GET redirect की तुलना में इसे exploit करना कठिन होता है।",
    },
    cwe: "CWE-601: URL Redirection to Untrusted Site ('Open Redirect')",
  },
};
