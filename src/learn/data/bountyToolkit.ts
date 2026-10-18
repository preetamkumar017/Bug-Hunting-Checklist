import type { LearnTool, BountyTips, VrtPriority, Localized } from "@/learn/data/types";

// Helper for trilingual objects
const tri = (en: string, simple: string, hi: string): Localized => ({ en, simple, hi });

interface ToolkitProfile {
  tools: LearnTool[];
  bountyTips: BountyTips;
}

// ── Curated Profiles by Vulnerability Domain / Category ────────────────────────

const IDOR_PROFILE: ToolkitProfile = {
  tools: [
    {
      name: "Burp Suite (Autorize Extension)",
      category: "Access Control Testing",
      command: "Burp -> Extensions -> BApp Store -> Install 'Autorize' -> Paste Low-Priv Session Cookie in Header field",
      steps: tri(
        "1. Open two browser sessions: Admin/User A (browser) and Victim User B (cookies in Autorize). 2. Navigate through all sensitive features as User A. 3. Inspect the Autorize table: any green indicator on a POST/PUT/DELETE request is an immediate access control bypass.",
        "1. Log in to Account A on your screen and put Account B's cookies into the Autorize tool. 2. Click around Account A. 3. Green rows in Autorize show requests that Account B can execute illegally.",
        "1. Browser में User A login रखें और Autorize में User B की cookie डालें। 2. User A से सारे features use करें। 3. Autorize table में green rows देखें — वे सीधे IDOR / access bypass साबित करते हैं।"
      ),
      link: "https://portswigger.net/bappstore/f9bbac8c4acf4aefa4d7dc92a991e4dd",
    },
    {
      name: "ffuf (Parameter Fuzzing)",
      category: "ID Enumeration",
      command: "ffuf -u 'https://target.com/api/v1/user/FUZZ/profile' -w ids.txt -H 'Authorization: Bearer <TOKEN_A>' -mc 200 -fs <BASELINE_SIZE>",
      steps: tri(
        "1. Capture baseline response size of your own object. 2. Filter out identical responses with `-fs <size>`. 3. Any 200 response with different length indicates accessible records belonging to other users.",
        "1. Check normal response length. 2. Use ffuf to try hundreds of numbers while hiding normal responses. 3. Responses with different sizes reveal other users' accounts.",
        "1. अपने object का normal response size नोट करें। 2. `-fs` flag से baseline filter करें। 3. अलग response size वाले 200 OK responses दूसरे users का data reveal करते हैं।"
      ),
      link: "https://github.com/ffuf/ffuf",
    },
  ],
  bountyTips: {
    triageSecret: tri(
      "Always lead your report title with the highest permission tier affected: e.g. '[P1] Critical IDOR: Unauthorized Modification of Financial Records for Any User via /api/v1/billing'. Never just say 'IDOR found'.",
      "Put the worst-case impact in your title: '[P1] Critical IDOR: Change Any User\\'s Bank Account'. Don't just say 'IDOR on website'.",
      "Report के title में worst-case impact लिखें: जैसे '[P1] Critical IDOR: Any User\\'s Billing Details Modification'। सिर्फ 'IDOR found' न लिखें।"
    ),
    impactMultiplier: tri(
      "Never settle for a read-only (GET) IDOR (often P3). Always test if the same route accepts PUT, PATCH, or DELETE with the foreign identifier. Demonstrating state modification elevates the report directly to P2 or P1.",
      "If you can view another user's file (P3), immediately check if you can EDIT or DELETE it using PUT or DELETE to upgrade to P2 or P1.",
      "सिर्फ GET read पर मत रुकें (अक्सर P3)। वही route पर PUT, PATCH, या DELETE भेजकर देखें। Data modify या delete साबित करने से bounty P2 या P1 में बदल जाती है।"
    ),
    avoidDuplicates: tri(
      "If the target uses GUID/UUID identifiers, DO NOT report an IDOR unless you can demonstrate where an attacker can harvest the victim's UUID. Triage considers unguessable UUIDs as low severity unless chained with an info disclosure leak.",
      "If the IDs are long random codes (UUIDs), you must show where a hacker finds that code. Otherwise programs will reject it as unguessable.",
      "अगर IDs random GUID/UUID हैं, तो पहले साबित करें कि victim का UUID कहाँ से मिला। बिना UUID discovery के triage इसे unguessable मानकर downgrade कर देता है।"
    ),
  },
};

const INJECTION_PROFILE: ToolkitProfile = {
  tools: [
    {
      name: "SQLMap",
      category: "SQL Injection Automation",
      command: "sqlmap -r request.txt --batch --dbs --tamper=space2comment --risk=3 --level=5 --current-user",
      steps: tri(
        "1. Save the vulnerable HTTP request from Burp into request.txt. 2. Run sqlmap with `--current-user` to confirm privileges. 3. STOP immediately once database names are confirmed — NEVER dump user data, as that violates bounty terms of service.",
        "1. Save the request in Burp. 2. Run sqlmap with --current-user. 3. Stop as soon as you prove the database name — never download real user tables.",
        "1. Burp से request को request.txt में save करें। 2. `--current-user` के साथ run करें। 3. Database name confirm होते ही रुक जाएँ — कभी भी client data dump न करें।"
      ),
      link: "https://sqlmap.org",
    },
    {
      name: "Burp Collaborator / interactsh",
      category: "Out-of-Band (OOB) Testing",
      command: "interactsh-client -v -json",
      steps: tri(
        "1. Start interactsh-client to obtain a unique OOB domain. 2. Inject payloads triggering DNS lookups (e.g. `$(curl http://sub.oob.domain)` or `<!ENTITY xxe SYSTEM 'http://sub.oob.domain'>`). 3. Observe incoming DNS/HTTP logs as irrefutable proof of command execution.",
        "1. Start interactsh to get a temporary test web address. 2. Put that address in your injection payload. 3. Watch incoming pings as solid proof the server executed your code.",
        "1. interactsh-client start करके unique domain पाएँ। 2. Injection payload में OOB link inject करें। 3. DNS/HTTP callback capture करके unassailable execution proof पाएँ।"
      ),
      link: "https://github.com/projectdiscovery/interactsh",
    },
  ],
  bountyTips: {
    triageSecret: tri(
      "In your report, explicitly write: 'Testing was strictly non-destructive. Verified execution via whoami / database banner only — zero customer data was accessed.' Triage teams award maximum bounties to professional, respectful hunters.",
      "Tell the triage team: 'I stopped after confirming whoami and touched zero customer data.' Companies reward respectful ethical researchers.",
      "Report में साफ़ लिखें: 'Non-destructive testing only. Verified via whoami — zero customer data touched.' Triage team respectful hunters को highest bounty देती है।"
    ),
    impactMultiplier: tri(
      "For blind SQLi or command injection, do not rely solely on sleep delays (triage may attribute it to network latency). Pair the delay with an Out-of-Band (OOB) DNS interaction or extract the first 4 characters of `whoami` via boolean differential.",
      "Don't just use sleep delays because triage might blame bad Wi-Fi. Always use a DNS callback to prove the server really executed the code.",
      "सिर्फ sleep delay पर निर्भर न रहें (triage network lag मान सकता है)। हमेशा DNS callback (Collaborator) या boolean differential से output extract करके दिखाएँ।"
    ),
    avoidDuplicates: tri(
      "Never run automated mass scanners on production endpoints without manual review. Mass scanning causes immediate IP bans and alerts the company's SOC to fix the issue before your manual report can be triaged.",
      "Don't run loud automated scanners without checking requests manually. It triggers firewalls and gets your IP banned.",
      "बिना manual review के loud scanners न चलाएँ। इससे WAF block हो जाता है और triage से पहले ही issue patch हो जाता है।"
    ),
  },
};

const XSS_PROFILE: ToolkitProfile = {
  tools: [
    {
      name: "DOM Invader (Burp Suite Pro / Chromium)",
      category: "Client-Side XSS Analysis",
      command: "Burp Browser -> DevTools -> DOM Invader Tab -> Enable 'Augment DOM' -> Inject Canary",
      steps: tri(
        "1. Open target in Burp's embedded browser with DOM Invader enabled. 2. Type unique canary into search boxes and URL parameters. 3. DOM Invader highlights dangerous sinks (`innerHTML`, `eval`, `document.write`) with exact call stack traces.",
        "1. Open the page in Burp browser. 2. Type test words into search fields. 3. DOM Invader automatically alerts you when your input reaches dangerous JavaScript sinks.",
        "1. Burp browser में DOM Invader on करें। 2. Search boxes में canary inject करें। 3. DOM Invader dangerous sinks (`innerHTML`, `eval`) और stack trace automatically highlight करता है।"
      ),
      link: "https://portswigger.net/burp/documentation/desktop/tools/dom-invader",
    },
    {
      name: "dalfox",
      category: "Automated XSS Scanner & Analyzer",
      command: "dalfox url 'https://target.com/page?param=test' --custom-payload custom.txt -b https://your-xss-hunter.com",
      steps: tri(
        "1. Provide target URL with active parameters. 2. Dalfox analyzes reflection context, HTML attribute escaping, and WAF rules. 3. Automatically tests targeted bypasses.",
        "1. Feed the URL into dalfox. 2. It checks how characters are filtered and tests custom bypasses automatically.",
        "1. Target URL parameters dalfox में pass करें। 2. यह reflection context और WAF filtering analyze करके smart payloads test करता है।"
      ),
      link: "https://github.com/hahwul/dalfox",
    },
  ],
  bountyTips: {
    triageSecret: tri(
      "Never submit a screenshot of `alert(1)`. Modern triage guidelines frequently downgrade `alert(1)` as low severity or informational. Instead, pop `document.domain` or create a dynamic banner proving execution.",
      "Never submit just `alert(1)`. Show that you can read `document.domain` or perform a realistic action on the page.",
      "कभी भी सिर्फ `alert(1)` का screenshot submit न करें। `alert(document.domain)` दिखाएँ या page पर dynamic element बनाकर real execution साबित करें।"
    ),
    impactMultiplier: tri(
      "To escalate Stored XSS from P3 to P1/P2: demonstrate taking over victim accounts by having the payload automatically read their CSRF token and update their email address in the background (`fetch('/api/user/email', {method: 'POST', body: ...})`).",
      "To turn XSS into a huge bounty: show that the script can steal the user's login session or change their email address automatically in the background.",
      "XSS की bounty P1/P2 करने के लिए: payload से victim का CSRF token read करके background में email change करने का PoC दें।"
    ),
    avoidDuplicates: tri(
      "Self-XSS (where the payload only executes when typed into your own profile and cannot be shared) is 100% Out-of-Scope across all platforms. Only report if you chain it with CSRF or a public sharing link.",
      "Self-XSS that only affects you is rejected immediately. You must show how another user gets infected.",
      "Self-XSS जो सिर्फ खुद पर चलती है हमेशा Out of Scope होती है। जब तक CSRF या shareable link से दूसरे user पर trigger न हो, report न करें।"
    ),
  },
};

const AUTH_OAUTH_PROFILE: ToolkitProfile = {
  tools: [
    {
      name: "Burp JWT Editor",
      category: "Token Cryptography",
      command: "Burp -> Extensions -> JWT Editor -> Keys tab -> 'New Symmetric Key' / 'CVE-2015-9235 None Algorithm'",
      steps: tri(
        "1. Capture JWT in Repeater. 2. Send to JWT Editor. 3. Test: changing 'alg' to 'none', stripping signatures, or verifying if RS256 can be forged via HMAC (CVE-2016-5431).",
        "1. Intercept your login JWT. 2. Use JWT Editor to change alg to 'none' or alter the username inside. 3. See if the server still accepts the modified token.",
        "1. Burp में JWT capture करें। 2. JWT Editor में 'alg' को 'none' करें या username tamper करें। 3. देखें कि क्या server बिना valid signature के modified token accept करता है।"
      ),
      link: "https://portswigger.net/bappstore/2625e34ba348429ab7d76b47a729ec08",
    },
    {
      name: "jwt_tool",
      category: "Automated JWT Pentesting",
      command: "python3 jwt_tool.py <TOKEN> -M at -t https://target.com/api/me -rh 'Authorization: Bearer'",
      steps: tri(
        "1. Supply target token and authenticated endpoint. 2. Run all tamper attacks (-M at). 3. jwt_tool tests all known CVEs, signature removals, and key confusions automatically.",
        "1. Pass your token to jwt_tool. 2. It runs automated checks for all known token bypasses against the server.",
        "1. Target token और API endpoint supply करें। 2. jwt_tool known signature bypasses और CVEs automatically test करेगा।"
      ),
      link: "https://github.com/ticarpi/jwt_tool",
    },
  ],
  bountyTips: {
    triageSecret: tri(
      "Title your report: '[P1] Full Account Takeover via OAuth redirect_uri Pre-Account Linking' instead of 'OAuth Misconfiguration'. Triage immediately flags ATO reports for urgent review.",
      "Always put 'Full Account Takeover' in your title if you can log into another account without their password.",
      "Report title में 'Full Account Takeover' लिखें: जैसे '[P1] Full Account Takeover via OAuth redirect_uri'। Triage ATO reports को सबसे पहले review करती है।"
    ),
    impactMultiplier: tri(
      "If you find OAuth `redirect_uri` parameter tampering, don't stop at an open redirect. Trace the entire flow: capture the code on your server, exchange it for a session, and log in to a second test account to claim the top P1 bounty.",
      "Don't stop at just redirecting the user. Capture their login code and show that you are fully logged into their account.",
      "OAuth redirect मिलने पर सिर्फ redirect पर न रुकें। Authorization code capture करके login complete करें और victim account takeover साबित करें।"
    ),
    avoidDuplicates: tri(
      "Do not report 'Session does not expire on browser close' or 'Concurrent logins allowed'. Programs consider these standard user-experience design choices and close them as Informational.",
      "Never report that you can log in from two phones at the same time. That's a normal feature, not a bug.",
      "Concurrent logins या browser close पर session न हटना report न करें। Programs इसे normal feature मानकर close कर देते हैं।"
    ),
  },
};

const WEB3_PROFILE: ToolkitProfile = {
  tools: [
    {
      name: "Foundry (forge & cast)",
      category: "Smart Contract Testing & Exploitation",
      command: "forge test --fork-url https://eth-mainnet.g.alchemy.com/v2/<API_KEY> -vvvv",
      steps: tri(
        "1. Initialize Foundry test: `forge init --no-commit`. 2. Write an exploit contract simulating victim state and attacker actions. 3. Run `forge test --fork-url` against a live mainnet fork to prove balance draining in an exact atomic block.",
        "1. Set up a Foundry test. 2. Write an attacker contract that drains the pool. 3. Run forge test against a copy of real Ethereum to show it works.",
        "1. Foundry test initialize करें (`forge init`). 2. Exploit contract लिखकर victim balance drain करें। 3. `forge test --fork-url` से live fork पर atomic transaction exploit साबित करें।"
      ),
      link: "https://book.getfoundry.sh",
    },
    {
      name: "Slither",
      category: "Static Smart Contract Analyzer",
      command: "slither . --detect reentrancy-eth,uninitialized-state,arbitrary-send-erc20",
      steps: tri(
        "1. Run slither on contract sources. 2. Inspect high-severity findings for missing `nonReentrant` modifiers or uninitialized variables. 3. Verify on-chain storage with `cast storage <address> <slot>`.",
        "1. Run slither on the code. 2. Look for reentrancy and uninitialized variables. 3. Verify live contract storage using cast storage.",
        "1. Contract code पर slither run करें। 2. Reentrancy और uninitialized variables identify करें। 3. `cast storage` से live slots verify करें।"
      ),
      link: "https://github.com/crytic/slither",
    },
  ],
  bountyTips: {
    triageSecret: tri(
      "In Web3 bug bounties (Immunefi, Bugcrowd Web3), provide a 100% self-contained Foundry test file (`Exploit.t.sol`). If triage can run `forge test` and see funds drained with 0 setup, you receive immediate approval and maximum payout.",
      "Write a complete Foundry test file. If triage can copy-paste your code, run 'forge test', and see the money drained, they will pay immediately.",
      "Foundry test file (`Exploit.t.sol`) provide करें। अगर triage सिर्फ `forge test` चलाकर exploit verify कर सके, तो immediate P1 payout मिलता है।"
    ),
    impactMultiplier: tri(
      "Quantify the exact dollar value at risk in the report title: e.g. '[Critical] Reentrancy in StakingPool allows draining $3.2M TVL'. High TVL figures directly map to $50,000–$1,000,000 bounty payouts.",
      "Put the total dollar amount at risk in your title: '[Critical] Flaw in StakingPool allows stealing $3.2M'. High dollar figures get massive rewards.",
      "Title में exact dollar figure लिखें: '[Critical] Reentrancy allows draining $3.2M TVL'। High funds-at-risk directly highest bounty tier दिलाते हैं।"
    ),
    avoidDuplicates: tri(
      "Centralized admin key / superuser risk is almost universally excluded unless the contract claims to be fully immutable/decentralized. Focus on logic errors where ordinary users can extract funds.",
      "Don't report that the company owner can steal the money. Focus on bugs where any random person on the internet can steal it.",
      "Centralized admin privilege को bug न बताएं जब तक contract immutable न हो। ऐसे bugs पर focus करें जहाँ कोई भी outsider funds drain कर सके।"
    ),
  },
};

const MOBILE_PROFILE: ToolkitProfile = {
  tools: [
    {
      name: "jadx-gui",
      category: "APK Decompilation & Reverse Engineering",
      command: "jadx-gui target.apk",
      steps: tri(
        "1. Load APK in jadx-gui. 2. Inspect AndroidManifest.xml for `android:exported=\"true\"` components. 3. Search code (Text Search -> 'https://', 'BEGIN PRIVATE KEY', secret keys, API tokens).",
        "1. Open the APK in jadx-gui. 2. Check AndroidManifest.xml for exported components. 3. Search for secret API keys and private URLs.",
        "1. jadx-gui में APK load करें। 2. AndroidManifest.xml में `exported=true` components चेक करें। 3. Strings और hardcoded private keys grep करें।"
      ),
      link: "https://github.com/skylot/jadx",
    },
    {
      name: "Frida & Objection",
      category: "Dynamic Instrumentation & SSL Pinning Bypass",
      command: "frida -U -f com.target.app -l ssl-bypass.js",
      steps: tri(
        "1. Connect rooted device or emulator with frida-server running. 2. Launch target app with SSL bypass script. 3. Intercept HTTPS traffic in Burp Suite.",
        "1. Connect your rooted phone with frida. 2. Run the SSL bypass script. 3. Read all mobile network traffic inside Burp Suite.",
        "1. Rooted device पर frida-server चलाएँ। 2. SSL bypass script inject करके app launch करें। 3. Burp Suite में सारा mobile HTTPS traffic capture करें।"
      ),
      link: "https://frida.re",
    },
  ],
  bountyTips: {
    triageSecret: tri(
      "Provide a single copyable `adb` command: e.g. `adb shell am start -n com.target.app/.SensitiveActivity --es 'action' 'grant_admin'`. Triage verifies mobile reports in under 2 minutes if they can paste your adb command.",
      "Give triage a one-line adb command they can paste into their terminal to see the bug happen instantly.",
      "Report में direct copyable `adb` command दें। Triage team 2 मिनट में command paste करके verify कर लेती है।"
    ),
    impactMultiplier: tri(
      "Hardcoded Google Maps, Firebase, or AWS keys are rated P4/P5 unless you prove write access. Test if Firebase database allows unauthorized read/write (`https://target.firebaseio.com/.json`) to turn a $100 finding into $3,000+.",
      "Don't just report a found API key. Test if that key actually lets you read or write private customer data to get a much higher bounty.",
      "सिर्फ hardcoded API key मिलने पर report न करें (अक्सर P4)। साबित करें कि key से private data read/write हो सकता है (जैसे Firebase .json test)।"
    ),
    avoidDuplicates: tri(
      "Do not report 'Root detection missing', 'Screen caching enabled', or 'allowBackup=true' alone. All platforms consider standard OS-level mobile hardening out-of-scope unless chained with real token extraction.",
      "Never report missing root detection or allowBackup=true alone. These are always rejected as informational.",
      "Missing root detection या allowBackup=true अकेले कभी report न करें। ये हमेशा Informational / Out of Scope close होते हैं।"
    ),
  },
};

const SERVER_MISCONFIG_PROFILE: ToolkitProfile = {
  tools: [
    {
      name: "Burp HTTP Request Smuggler",
      category: "Request Desynchronization",
      command: "Burp -> Extensions -> BApp Store -> Install 'HTTP Request Smuggler' -> Right click request -> Smuggle probe",
      steps: tri(
        "1. Send POST request to Smuggler extension. 2. Tool tests CL.TE and TE.CL permutations with differential timeouts. 3. If timeout confirms smuggling, generate prefix attack to steal victim authorization headers.",
        "1. Right click a request and run Smuggle probe. 2. It checks if the front-end and back-end servers disagree on request length. 3. Use it to hijack other users' requests.",
        "1. Burp में request पर right click करके Smuggle probe चलाएँ। 2. यह CL.TE और TE.CL desync identify करता है। 3. Smuggled prefix attack से victim headers capture करें।"
      ),
      link: "https://portswigger.net/bappstore/8003084ec0d44eb68d332d91830b7e07",
    },
    {
      name: "Burp Param Miner",
      category: "Unkeyed Header & Cache Poisoning Discovery",
      command: "Burp -> Extensions -> Param Miner -> 'Guess headers' -> Check 'Output to log'",
      steps: tri(
        "1. Right-click target request -> Extensions -> Param Miner -> Guess headers. 2. Param Miner probes unkeyed headers (`X-Forwarded-Host`, `X-Original-URL`). 3. When an unkeyed header alters the response, test cache retention for Web Cache Poisoning.",
        "1. Run Param Miner to find hidden headers the server listens to. 2. If changing a hidden header changes the webpage, check if that change gets saved in the cache for other visitors.",
        "1. Param Miner से hidden unkeyed headers detect करें। 2. अगर unkeyed header response बदलता है, तो CDN cache retention test करके Web Cache Poisoning साबित करें।"
      ),
      link: "https://portswigger.net/bappstore/17d2949a985c45009a1f2c25af4c4314",
    },
  ],
  bountyTips: {
    triageSecret: tri(
      "For Web Cache Poisoning or Cache Deception, provide a video or sequential screenshots: Window 1 (Attacker poisons cache) -> Window 2 (Clean incognito window from a different IP loading the page and receiving the poisoned payload with `X-Cache: HIT`).",
      "Show a video of two browser windows: one where you poison the cache, and a second clean incognito window getting infected.",
      "दो windows का proof दें: Window 1 (Attacker poisons cache) -> Window 2 (Different IP incognito window receiving poisoned payload with `X-Cache: HIT`)।"
    ),
    impactMultiplier: tri(
      "For Web Cache Deception: show that the cached URL leaks sensitive user PII, authentication tokens, or payment receipts without credentials to claim P1/P2.",
      "Show that the cached file contains real personal information or auth tokens from another user to get top payout.",
      "Web Cache Deception में दिखाएँ कि cached URL बिना login के victim का PII या auth token leak करता है (P1/P2 payout)।"
    ),
    avoidDuplicates: tri(
      "Missing security headers (CSP, HSTS, X-Content-Type-Options) or verbose version banners without a working exploit are universally closed as Informational ($0). Never submit header-only findings.",
      "Never submit missing security headers (like HSTS or CSP) alone. You will get $0 and hurt your reputation score.",
      "सिर्फ missing security headers (HSTS, CSP, X-Frame-Options) कभी submit न करें। ये हमेशा $0 Informational close होते हैं।"
    ),
  },
};

const GENERIC_PROFILE: ToolkitProfile = {
  tools: [
    {
      name: "Burp Suite Professional / Community",
      category: "Web Security Proxy & Inspection",
      command: "Configure Browser Proxy -> 127.0.0.1:8080 -> Intercept & Repeater",
      steps: tri(
        "1. Intercept HTTP/HTTPS requests in Burp Suite Proxy. 2. Send requests to Repeater (`Ctrl+R`) to test parameter tampering and boundary values. 3. Compare response status codes and body differences.",
        "1. Send your web traffic through Burp. 2. Edit requests in Repeater to see how the server responds to modified inputs.",
        "1. Burp Suite Proxy से traffic intercept करें। 2. Repeater में request भेजकर parameter tampering test करें। 3. Response differences analyze करें।"
      ),
      link: "https://portswigger.net/burp",
    },
    {
      name: "ffuf (Fast Web Fuzzer)",
      category: "Content & Endpoint Discovery",
      command: "ffuf -u 'https://target.com/FUZZ' -w /path/to/wordlist.txt -mc 200,301,302,403",
      steps: tri(
        "1. Run ffuf against target directories using SecLists Discovery wordlists. 2. Filter responses with `-fc 404`. 3. Discover hidden endpoints, admin portals, and backup files.",
        "1. Use ffuf with a wordlist to find hidden pages and admin panels on the website.",
        "1. SecLists wordlists के साथ ffuf चलाकर hidden directories ढूँढें। 2. 404 responses filter करें। 3. Hidden endpoints और backup files discover करें।"
      ),
      link: "https://github.com/ffuf/ffuf",
    },
  ],
  bountyTips: {
    triageSecret: tri(
      "Always include clear, step-by-step reproduction steps with exact HTTP requests and responses. Triage reviewers award bounties faster when they can replicate the issue in under 5 minutes.",
      "Write crystal-clear step-by-step instructions with the exact request and response so triage can reproduce it in minutes.",
      "Step-by-step clear reproduction steps और exact HTTP request/response दें। Quick reproduction से triage fast approve होती है।"
    ),
    impactMultiplier: tri(
      "Focus on business impact: explain what an attacker can steal or disrupt (financial loss, data breach, brand reputation) rather than theoretical risks.",
      "Explain the real-world business danger (e.g. lost money, stolen customer accounts) rather than just technical jargon.",
      "Technical jargon के बजाय real business impact (financial loss, customer account theft) explain करें — इससे bounty amount बढ़ता है।"
    ),
    avoidDuplicates: tri(
      "Check the target program's 'Out of Scope' and 'Known Issues' list before hunting. Submitting issues explicitly listed as out of scope damages your platform reputation score.",
      "Always read the program's Out of Scope rules before testing to avoid wasting time on forbidden findings.",
      "Testing शुरू करने से पहले program की 'Out of Scope' list ज़रूर पढ़ें। Excluded findings submit करने से reputation score गिरता है।"
    ),
  },
};

// ── Matcher Logic ─────────────────────────────────────────────────────────────

export function getToolkitForTopic(path: string, _priority: VrtPriority = "varies"): ToolkitProfile {
  const p = path.toLowerCase();

  if (p.includes("idor") || p.includes("access control") || p.includes("insecure direct object")) {
    return IDOR_PROFILE;
  }
  if (p.includes("injection") || p.includes("rce") || p.includes("sql") || p.includes("xxe") || p.includes("ssti") || p.includes("ldap")) {
    return INJECTION_PROFILE;
  }
  if (p.includes("cross-site scripting") || p.includes("xss")) {
    return XSS_PROFILE;
  }
  if (p.includes("authentication") || p.includes("session") || p.includes("jwt") || p.includes("oauth") || p.includes("saml") || p.includes("2fa") || p.includes("password reset")) {
    return AUTH_OAUTH_PROFILE;
  }
  if (p.includes("smart contract") || p.includes("decentralized") || p.includes("blockchain") || p.includes("defi") || p.includes("reentrancy") || p.includes("oracle")) {
    return WEB3_PROFILE;
  }
  if (p.includes("android") || p.includes("ios") || p.includes("mobile") || p.includes("apk") || p.includes("intent")) {
    return MOBILE_PROFILE;
  }
  if (p.includes("cache deception") || p.includes("cache poisoning") || p.includes("request smuggling") || p.includes("server security") || p.includes("header") || p.includes("smb") || p.includes("ftp")) {
    return SERVER_MISCONFIG_PROFILE;
  }

  return GENERIC_PROFILE;
}
