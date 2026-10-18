import type { TopicContent } from "@/learn/data/types";

// Per-leaf trilingual lesson content, keyed by FULL Bugcrowd VRT path.
export const serverMisconfig2Topics: Record<string, TopicContent> = {
  "Server Security Misconfiguration › Using Default Credentials": {
    what: {
      en: "A service, admin panel, appliance or database ships with a vendor-set username/password (admin/admin, root/root, tomcat/tomcat, Jenkins default, Grafana admin/admin, etc.) that was never changed. Anyone who knows the documented default authenticates with full privileges. Because the credential is public in vendor docs, this is a direct, pre-auth takeover of whatever the account controls.",
      simple: "Software or a device still uses the username and password it came with from the maker (like admin/admin). Those defaults are public, so anyone can just log in with full access.",
      hi: "कोई service, admin panel या database अभी भी vendor के default username/password (जैसे admin/admin, tomcat/tomcat) पर चल रहा है जो कभी बदला नहीं गया। ये defaults vendor docs में public होते हैं, इसलिए कोई भी सीधे full access के साथ log in कर सकता है।",
    },
    find: [
      {
        title: { en: "Identify the product, then try its documented defaults", simple: "Find the product, then try its known defaults", hi: "product पहचानें, फिर उसके known defaults आज़माएँ" },
        steps: [
          { en: "Fingerprint the login (favicon hash, HTML title, Server/X-Powered-By headers, /login paths) to identify the exact product and version.", simple: "Identify the exact product from the login page title, headers and icons.", hi: "login page के title, headers और favicon से exact product और version पहचानें।" },
          { en: "Look up that product's factory default credentials in its official docs or a reputable default-password list.", simple: "Look up that product's factory default login in its official docs.", hi: "उस product के factory default credentials उसके official docs में देखें।" },
          { en: "Try the default once on your own clearly-labelled test access; if it works, stop immediately and capture evidence without changing anything.", simple: "Try the default one time; if it logs in, capture proof and stop.", hi: "default एक बार आज़माएँ; अगर log in हो जाए तो proof capture करके रुक जाएँ।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the exact asset, the credential pair used, and a screenshot/response showing you reached an authenticated, privileged view. A login form that merely *accepts* a weak password you set yourself is not this leaf. If the panel is a staging/demo instance explicitly meant to be open, or the default only reaches a public read-only page, impact drops and it may be N/A.",
      simple: "Show the asset, the default login you used, and a screenshot of being logged in with real access. A test account you created yourself does not count. Demo or read-only panels may be N/A.",
      hi: "Triage को asset, इस्तेमाल किया गया credential pair, और authenticated/privileged view का screenshot चाहिए। खुद बनाया गया test account count नहीं होता। Demo या read-only panel N/A हो सकता है।",
    },
    escalate: {
      en: "If the default account can run commands, upload plugins, or read secrets/connection strings, document that step — it moves the report from 'default creds' to full RCE or data compromise and raises the band.",
      simple: "If the default login can run code, upload plugins or read secrets, show it — that turns it into RCE or data theft.",
      hi: "अगर default account commands चला सके, plugins upload कर सके या secrets पढ़ सके, तो वह दिखाएँ — यह RCE या data compromise बन जाता है।",
    },
    references: [
      { label: "OWASP WSTG: Default Credentials", url: "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/04-Authentication_Testing/02-Testing_for_Default_Credentials" },
    ],
  },

  "Server Security Misconfiguration › OAuth Misconfiguration › Account Takeover": {
    what: {
      en: "A flaw in the OAuth/OIDC flow lets an attacker log in as the victim: the authorization code or access token is leaked to an attacker-controlled destination (open redirect_uri, referer leak), or the provider's identity is bound to the local account by an attacker-controlled field (unverified email, provider-supplied user_id that can be forged or pre-registered). The result is a full takeover of the victim's account on the relying party.",
      simple: "A broken 'Login with Google/Facebook' flow lets an attacker end up logged into someone else's account — usually by stealing the login code/token or by linking the social login to an account they don't own.",
      hi: "OAuth/OIDC flow में खराबी से attacker victim के account में log in कर लेता है — या तो authorization code/token attacker के पास leak हो जाता है (open redirect_uri), या provider की identity किसी attacker-controlled field (unverified email) से local account पर bind हो जाती है। नतीजा पूरा account takeover।",
    },
    find: [
      {
        title: { en: "Steal the code/token via redirect_uri", simple: "Steal the code through a bad redirect_uri", hi: "redirect_uri के ज़रिए code/token चुराएँ" },
        steps: [
          { en: "Start the flow and tamper redirect_uri — try your domain, path suffixes, open-redirect gadgets on the allowed host, and parameter pollution — to send the code/token to you.", simple: "Change redirect_uri to your own site and see if the login code lands there.", hi: "flow शुरू करके redirect_uri को अपने domain पर बदलें और देखें कि code आपके पास आता है या नहीं।" },
          { en: "If you capture a victim's code, replay it at the token endpoint and confirm you receive a session as the victim.", simple: "If you catch the victim's code, use it to log in as them.", hi: "अगर victim का code मिल जाए, उसे token endpoint पर replay करके victim की session पाएँ।" },
        ],
      },
      {
        title: { en: "Abuse account linking on email/identity", simple: "Abuse how the social login links to an account", hi: "account linking (email/identity) का दुरुपयोग करें" },
        steps: [
          { en: "Register the local account with the victim's email, then complete OAuth from a provider that returns an unverified email — see if the two merge into one account you control.", simple: "Sign up with the victim's email, then log in via a provider that doesn't verify email, and see if accounts merge.", hi: "victim की email से local account बनाएँ, फिर ऐसे provider से OAuth करें जो email verify नहीं करता, और देखें कि accounts merge होते हैं या नहीं।" },
          { en: "Check whether the server trusts a provider user_id/sub it never re-verifies, so a pre-created or spoofed link binds your login to the victim's account.", simple: "Check if the server trusts a user id from the provider without re-checking it.", hi: "देखें कि server provider के user_id/sub पर बिना दोबारा verify किए भरोसा करता है या नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the full request chain showing a victim (your second test account) being taken over: where the code/token leaked or how the link bound, plus the resulting authenticated session. A redirect_uri you can bend but which never yields a code, or email-merge that still forces email verification, is not ATO. Keep both accounts your own.",
      simple: "Show the full flow where your second test account gets taken over, including where the token leaked. If no token actually leaks or email verification still blocks it, it isn't ATO.",
      hi: "Triage को पूरी request chain चाहिए जिसमें आपका दूसरा test account takeover हो — code/token कहाँ leak हुआ या link कैसे bind हुआ, और resulting session। अगर code leak नहीं होता या email verification रोक देता है तो यह ATO नहीं।",
    },
    escalate: {
      en: "If the misconfig only reaches an open redirect with no token leak it is the sibling 'Insecure Redirect URI'; if it only lets you squat an unclaimed account it is 'Account Squatting (P4)'. Proving a real session as the victim is what keeps it at ATO (P2).",
      simple: "No token leak = just 'Insecure Redirect URI'; only grabbing an unused account = 'Account Squatting'. Real takeover of a live account keeps it P2.",
      hi: "सिर्फ़ open redirect (token leak नहीं) = sibling 'Insecure Redirect URI'; सिर्फ़ unclaimed account लेना = 'Account Squatting (P4)'। असली victim session साबित करना ही इसे ATO (P2) रखता है।",
    },
    references: [
      { label: "PortSwigger: OAuth 2.0 authentication vulnerabilities", url: "https://portswigger.net/web-security/oauth" },
    ],
  },

  "Server Security Misconfiguration › Server-Side Request Forgery (SSRF) › Internal Secrets Exposure": {
    what: {
      en: "A full-read SSRF where the server fetches an attacker-supplied URL and returns the body, and that body contains secrets — most often the cloud metadata service (169.254.169.254) handing out IAM credentials/tokens, or an internal config/credential endpoint. The attacker reads live secrets they can then use elsewhere, so this is the high-impact SSRF variant.",
      simple: "SSRF where the server fetches a URL you choose and shows you the response, and that response leaks secrets — like cloud metadata handing out IAM keys. You get real credentials.",
      hi: "एक full-read SSRF जहाँ server आपकी दी URL fetch करके response body लौटाता है, और उसमें secrets होते हैं — अक्सर cloud metadata (169.254.169.254) से IAM credentials, या internal config/credential endpoint। Attacker live secrets पढ़ लेता है, इसलिए यह high-impact SSRF variant है।",
    },
    find: [
      {
        title: { en: "Point the fetch at metadata / internal secret endpoints", simple: "Aim the request at metadata or internal secrets", hi: "fetch को metadata / internal secret endpoints पर भेजें" },
        steps: [
          { en: "Find a parameter the server fetches (webhook, image/url import, PDF/SSRF-prone integration) and confirm the response body is reflected back to you.", simple: "Find a parameter the server fetches and check the response comes back to you.", hi: "ऐसा parameter खोजें जिसे server fetch करता है और पुष्टि करें कि response body आपको वापस दिखती है।" },
          { en: "Request the cloud metadata IAM path (and equivalents for GCP/Azure with the required header) on your own in-scope instance; capture the returned credentials/token as the proof.", simple: "Request the cloud metadata credentials path and capture what comes back.", hi: "cloud metadata के IAM credentials path को request करें और लौटे credentials/token को proof के रूप में capture करें।" },
          { en: "If metadata is blocked, try internal config services and known secret paths that return keys or connection strings.", simple: "If metadata is blocked, try internal config endpoints that return keys.", hi: "अगर metadata blocked है, तो internal config services और secret paths आज़माएँ जो keys लौटाते हैं।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the request that caused the fetch and the response body actually containing a secret (redact most of it, show enough to prove it is live, e.g. a valid IAM token prefix). Reaching metadata but getting an empty/blocked body is the lower sibling. Do not use the stolen credential against anything beyond proving it is valid in-scope.",
      simple: "Show the request and the response that really contains a secret (redacted but clearly live). If metadata is reachable but returns nothing, it's a lower-rated variant. Don't actually use the stolen key.",
      hi: "Triage को वह request और response body चाहिए जिसमें सचमुच secret हो (ज़्यादातर redact करें, live होने का सबूत रखें)। metadata तक पहुँचना पर खाली body मिलना lower sibling है। चुराया credential सिर्फ़ valid साबित करने तक ही इस्तेमाल करें।",
    },
    escalate: {
      en: "If the body only confirms a service exists without secrets it drops to 'Internal Data Exposure (P3)' or the presence-only P4; if you can only make requests without reading responses it is a blind/port-scan variant. Using a leaked IAM token to access cloud resources is a separate, higher chain — document it as impact.",
      simple: "No secret in the body = Internal Data Exposure (P3) or lower. Using the leaked key to reach cloud resources is a bigger chain worth noting.",
      hi: "body में सिर्फ़ service का होना (secret नहीं) = 'Internal Data Exposure (P3)' या presence-only P4; response न पढ़ पाना = blind/port-scan variant। leaked IAM token से cloud resources तक पहुँचना अलग, बड़ा chain है।",
    },
    references: [
      { label: "PortSwigger: Server-side request forgery (SSRF)", url: "https://portswigger.net/web-security/ssrf" },
    ],
  },

  "Server Security Misconfiguration › Server-Side Request Forgery (SSRF) › Internal Port Service Scan": {
    what: {
      en: "A semi-blind SSRF used to map internal services: by observing response differences, status codes, or timing when you point the server at internal host:port combinations, you can tell which ports are open and often fingerprint the service behind them. You learn the internal network topology even without reading full response bodies.",
      simple: "SSRF used to scan the internal network. By watching how the server responds to different host:port targets, you can tell which services are running inside.",
      hi: "एक semi-blind SSRF जिससे internal services map किए जाते हैं: server को internal host:port पर भेजने पर response के फर्क, status codes या timing देखकर पता चलता है कौन-से ports खुले हैं और अक्सर पीछे की service भी पहचानी जा सकती है। आप internal network topology सीख लेते हैं।",
    },
    find: [
      {
        title: { en: "Differentiate open vs closed ports by response/timing", simple: "Tell open ports from closed ones by the response", hi: "response/timing से खुले बनाम बंद ports पहचानें" },
        steps: [
          { en: "Point the fetch at internal IPs across a range of ports and record status, error text, content-length and response time for each.", simple: "Send the SSRF at internal IPs on many ports and record how each responds.", hi: "fetch को internal IPs के कई ports पर भेजें और हर एक का status, error, length और time रिकॉर्ड करें।" },
          { en: "Compare a known-closed port vs a known-open one to establish the oracle (e.g. instant connection-refused vs a hang or a protocol-mismatch error).", simple: "Compare a closed port to an open one so you know the tell-tale difference.", hi: "एक known-closed और एक known-open port की तुलना करके oracle तय करें।" },
          { en: "Enumerate and record which internal host:port combos look alive; identify the service from banners/errors where visible.", simple: "List which internal services look alive and name them if you can.", hi: "कौन-से internal host:port ज़िंदा लगते हैं उन्हें enumerate करें और banners/errors से service पहचानें।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the request pattern plus the response/timing oracle that distinguishes open from closed ports, and a short list of internal services you identified. If you cannot show a reliable difference between open and closed (only guesses), or you cannot reach anything internal, it isn't this leaf. Scanning the public internet is the lower 'External' variant.",
      simple: "Show the signal that tells open ports from closed ones, and the internal services you found. Vague guesses or only external targets don't qualify.",
      hi: "Triage को request pattern, खुले बनाम बंद ports बताने वाला oracle, और पहचाने गए internal services की छोटी list चाहिए। भरोसेमंद फर्क न दिखे तो यह leaf नहीं। सिर्फ़ public internet scan करना lower 'External' variant है।",
    },
    escalate: {
      en: "If you can additionally read response bodies with secrets it rises to 'Internal Secrets Exposure (P2)' or 'Internal Data Exposure (P3)'. If you can only confirm a host exists but not enumerate services, it drops to 'Internal Port Scan Only (P4)'.",
      simple: "Reading secret-filled responses pushes it to P2/P3. Only confirming a host exists without naming services drops it to 'Internal Port Scan Only (P4)'.",
      hi: "अगर secrets वाली response body भी पढ़ सकें तो यह 'Internal Secrets Exposure (P2)'/'Internal Data Exposure (P3)' बन जाता है। सिर्फ़ host होने की पुष्टि = 'Internal Port Scan Only (P4)'।",
    },
  },

  "Server Security Misconfiguration › No Rate Limiting on Form › Email-Triggering": {
    what: {
      en: "An endpoint that sends an email on each request (invite a friend, share, contact-us, 'resend' links) has no rate limit, so an attacker can trigger thousands of emails. The target's mail is abused to flood/spam a victim's inbox (mail-bombing) or to burn the program's sending reputation/quota. The sent email usually comes from the program, which is what gives it value over a plain missing-limit.",
      simple: "A form that sends an email every time it's submitted has no limit, so an attacker can fire off thousands of emails — flooding a victim's inbox or abusing the company's mail service.",
      hi: "कोई endpoint जो हर request पर email भेजता है (invite, share, contact-us, resend) पर कोई rate limit नहीं, तो attacker हज़ारों emails trigger कर सकता है। इससे victim का inbox flood (mail-bombing) होता है या program की sending reputation/quota बर्बाद होती है। email आमतौर पर program की ओर से जाती है, यही इसे value देता है।",
    },
    find: [
      {
        title: { en: "Replay the email-sending request at volume", simple: "Send the email request many times fast", hi: "email भेजने वाली request को तेज़ी से बार-बार भेजें" },
        steps: [
          { en: "Capture the request that triggers an email to a recipient you control; confirm one request = one delivered email.", simple: "Catch the request that sends an email to your own address and confirm one send per request.", hi: "वह request capture करें जो आपके पते पर email भेजती है; पुष्टि करें एक request = एक email।" },
          { en: "Send a bounded burst (e.g. 30–50) with no throttle to your own inbox and count how many arrive, checking there is no per-user/IP cap or CAPTCHA.", simple: "Send a small burst to your own inbox and count how many arrive with no limit.", hi: "अपने inbox पर एक सीमित burst (30–50) भेजें और गिनें कितनी आईं, देखें कोई cap/CAPTCHA तो नहीं।" },
          { en: "Note the sender identity and whether attacker-controlled text/links ride in the email body.", simple: "Note who the email appears to be from and if you control any text in it.", hi: "sender कौन दिखता है और क्या email body में attacker-controlled text/links जाते हैं, नोट करें।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the request, the absence of any limit (N identical requests → N emails), all to your own inbox. Keep volume small and benign — this is a DoS-flavoured leaf and many programs exclude mail-bombing / require it not to harm others. A delay or silent drop after a few sends, or a CAPTCHA, means the control exists and it's N/A.",
      simple: "Show the request, that N requests gave N emails, all to your own inbox, kept small. If a CAPTCHA or throttle kicks in, it's N/A. Many programs exclude this as DoS.",
      hi: "Triage को request और limit की गैरमौजूदगी चाहिए (N requests → N emails), सब अपने inbox पर। volume छोटा रखें — यह DoS-जैसा leaf है और कई programs mail-bombing exclude करते हैं। कुछ sends बाद delay/CAPTCHA आए तो control मौजूद है, N/A।",
    },
    escalate: {
      en: "On its own this is P4 and often informational; it gains weight only if the email carries attacker-controlled content (injection into a trusted sender) or is part of an account-security flow. The 'Login/Registration/SMS-Triggering' siblings are judged the same way; 'Change Password' is the lower P5.",
      simple: "Alone it's low. It matters more if you control the email's content or it's tied to account security. SMS/Login/Registration siblings are similar; Change Password is lower (P5).",
      hi: "अकेले यह P4 और अक्सर informational है; तभी weight पाता है जब email में attacker-controlled content हो या account-security flow से जुड़ा हो। Login/Registration/SMS siblings ऐसे ही; 'Change Password' lower P5।",
    },
  },

  "Server Security Misconfiguration › Server-Side Request Forgery (SSRF) › Internal Exposure of the Presence of Data/Secrets": {
    what: {
      en: "A blind-ish SSRF where you cannot read the full body, but the server's behaviour (different status/length/timing for a valid vs invalid internal path) reveals that a particular internal resource or secret *exists* — e.g. a metadata path, a config file, or an internal object responds differently when present. You confirm presence/absence without ever reading the content.",
      simple: "SSRF where you can't read the actual response, but the server reacts differently when an internal file or secret exists — so you can tell it's there without seeing it.",
      hi: "एक blind-सा SSRF जहाँ आप full body नहीं पढ़ सकते, पर server के behaviour (valid बनाम invalid internal path पर अलग status/length/timing) से पता चलता है कि कोई internal resource या secret *मौजूद* है। content पढ़े बिना presence/absence confirm हो जाता है।",
    },
    find: [
      {
        title: { en: "Use a presence oracle on internal paths", simple: "Tell if an internal resource exists by the reaction", hi: "internal paths पर presence oracle इस्तेमाल करें" },
        steps: [
          { en: "Pick an internal path known to exist (e.g. metadata root) and one that shouldn't; compare status, length and timing to build an exists/doesn't oracle.", simple: "Compare a path that exists to one that doesn't and watch the difference.", hi: "एक मौजूद internal path और एक गैरमौजूद path की तुलना करके exists/doesn't oracle बनाएँ।" },
          { en: "Probe candidate secret/config paths through the oracle and record which ones register as present.", simple: "Probe likely secret paths and note which the oracle says exist.", hi: "संभावित secret/config paths को oracle से probe करें और नोट करें कौन present दिखते हैं।" },
          { en: "Do not attempt to exfiltrate content — this leaf is exactly the no-read case; reading the body is the higher sibling.", simple: "Don't try to read the content — just prove it exists.", hi: "content निकालने की कोशिश न करें — यही leaf no-read case है; body पढ़ना higher sibling है।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the oracle: the measurable difference that proves an internal secret/resource is present, for a specific named resource — not a generic 'something is there'. If you can actually read the secret, report the P2 variant instead; if you can't even distinguish present from absent, there is no finding.",
      simple: "Show the exact signal proving a specific internal secret exists. If you can read it, that's the higher P2. If you can't tell present from absent, there's nothing.",
      hi: "Triage को oracle चाहिए: वह मापने योग्य फर्क जो किसी नामित internal secret/resource की मौजूदगी साबित करे। अगर secret पढ़ सकें तो P2 variant report करें; present/absent में फर्क ही न हो तो कोई finding नहीं।",
    },
    escalate: {
      en: "Reading the actual secret body lifts it to 'Internal Secrets Exposure (P2)'; reading non-secret internal data is 'Internal Data Exposure (P3)'. This presence-only case stays P4.",
      simple: "Reading the secret itself = P2; reading other internal data = P3. Just proving it exists stays P4.",
      hi: "असली secret body पढ़ना = 'Internal Secrets Exposure (P2)'; non-secret internal data पढ़ना = 'Internal Data Exposure (P3)'। सिर्फ़ presence साबित करना P4 रहता है।",
    },
  },

  "Server Security Misconfiguration › Server-Side Request Forgery (SSRF) › Internal Port Scan Only": {
    what: {
      en: "The weakest confirmed-internal SSRF: you can make the server initiate connections to internal host:port and tell open from closed (connectivity/timing), but you cannot fingerprint the service or read any data. It proves the server will reach arbitrary internal addresses — useful as a building block — but on its own only reveals which ports answer.",
      simple: "The most limited internal SSRF: you can tell which internal ports are open or closed, but you can't identify the service or read anything.",
      hi: "सबसे कमज़ोर confirmed-internal SSRF: आप server से internal host:port पर connections करवा सकते हैं और खुला बनाम बंद बता सकते हैं, पर service पहचान या data पढ़ नहीं सकते। यह साबित करता है कि server arbitrary internal addresses तक पहुँचता है, पर अकेले सिर्फ़ ports बताता है।",
    },
    find: [
      {
        title: { en: "Establish a bare open/closed oracle internally", simple: "Just prove which internal ports answer", hi: "सिर्फ़ internal खुला/बंद oracle बनाएँ" },
        steps: [
          { en: "Send the SSRF at an internal IP on a closed port and an open one; record the timing/connection-state difference.", simple: "Try a closed and an open internal port and watch the timing difference.", hi: "एक बंद और एक खुले internal port पर SSRF भेजें; timing/connection-state का फर्क रिकॉर्ड करें।" },
          { en: "Sweep a small set of common internal ports using that oracle and list which respond as open.", simple: "Scan a few common internal ports and list the open ones.", hi: "उस oracle से कुछ common internal ports sweep करें और खुले वाले list करें।" },
          { en: "Confirm you genuinely cannot read a body or banner (otherwise it's a higher sibling).", simple: "Confirm you really can't read any response (or it's a higher variant).", hi: "पुष्टि करें कि आप सचमुच body/banner नहीं पढ़ सकते (वरना higher sibling है)।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the open/closed oracle against internal addresses and the fact that no data/banner is readable. If you can name the service behind a port it becomes 'Internal Port Service Scan (P3)'; if the connections only reach the public internet it's the lower 'External' variant; a single blind outbound request with no open/closed signal is weaker still.",
      simple: "Show the open/closed signal on internal IPs and that you can read nothing. Naming the service = P3; only external targets = lower 'External' variant.",
      hi: "Triage को internal addresses पर खुला/बंद oracle और यह कि कोई data/banner नहीं पढ़ा जा सकता, चाहिए। service पहचान लें = 'Internal Port Service Scan (P3)'; सिर्फ़ public internet = lower 'External' variant।",
    },
  },

  "Server Security Misconfiguration › No Rate Limiting on Form › Registration": {
    what: {
      en: "The sign-up endpoint has no rate limit or anti-automation, so an attacker can script mass account creation. This enables bulk fake/bot accounts, username-space squatting, exhausting a limited namespace or promo codes, and (if registration emails a victim) indirect spam. The bug is the missing throttle on account creation itself, not what each account can later do.",
      simple: "The sign-up form has no limit, so an attacker can create huge numbers of fake accounts automatically.",
      hi: "Registration endpoint पर कोई rate limit या anti-automation नहीं, तो attacker script से बड़ी संख्या में accounts बना सकता है। इससे bulk fake/bot accounts, username squatting, limited namespace/promo codes खत्म करना, और (अगर registration victim को email करे) indirect spam होता है।",
    },
    find: [
      {
        title: { en: "Automate account creation and count successes", simple: "Create many accounts automatically and count them", hi: "accounts बनाना automate करें और successes गिनें" },
        steps: [
          { en: "Capture a successful registration request; identify the varying fields (username/email) and any token/CAPTCHA.", simple: "Catch one successful sign-up and see what changes between accounts.", hi: "एक सफल registration request capture करें; बदलने वाले fields और token/CAPTCHA पहचानें।" },
          { en: "Replay it with unique values at volume (bounded burst) and confirm many accounts are created with no per-IP cap, CAPTCHA, or email-verification gate stopping you.", simple: "Repeat it with new values and confirm lots of accounts get made with nothing blocking you.", hi: "unique values के साथ bounded burst भेजें और पुष्टि करें कि बिना cap/CAPTCHA/email-verification के कई accounts बन जाते हैं।" },
          { en: "Clean up: delete or flag the test accounts you created.", simple: "Delete the test accounts you made.", hi: "बनाए गए test accounts delete/flag करके साफ़ करें।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the request and evidence that N requests created N usable accounts with no anti-automation, all your own. If email verification is required before an account is usable, or a CAPTCHA/throttle appears, the control exists and it's typically N/A. On its own this is P4 and often informational — pair it with concrete abuse (namespace/promo exhaustion) to carry weight.",
      simple: "Show that many requests made many real accounts with nothing blocking you. If email verification or a CAPTCHA is needed, it's usually N/A. Low on its own.",
      hi: "Triage को request और सबूत चाहिए कि N requests से N usable accounts बिना anti-automation बने, सब आपके। अगर account usable होने से पहले email verification या CAPTCHA/throttle है तो control मौजूद है, आमतौर पर N/A। अकेले P4/informational।",
    },
  },

  "Server Security Misconfiguration › No Rate Limiting on Form › SMS-Triggering": {
    what: {
      en: "An endpoint that sends an SMS per request (OTP send, phone-verify, 'resend code', SMS notifications) has no rate limit, so an attacker can trigger many texts. This floods a victim's phone (SMS-bombing) and — unlike email — directly burns the program's money because each SMS costs the provider a fee ('toll fraud'/SMS pumping). The financial angle is what distinguishes it from the email sibling.",
      simple: "A form that sends a text message each time has no limit, so an attacker can spam a victim's phone and run up the company's SMS bill.",
      hi: "कोई endpoint जो हर request पर SMS भेजता है (OTP, phone-verify, resend code) पर rate limit नहीं, तो attacker कई texts trigger कर सकता है। इससे victim का phone flood (SMS-bombing) होता है और — email के उलट — हर SMS पर provider fee लगती है, यानी program का पैसा सीधे बर्बाद (toll fraud/SMS pumping)।",
    },
    find: [
      {
        title: { en: "Replay the SMS-send request to your own number", simple: "Send the SMS request many times to your own phone", hi: "SMS भेजने वाली request अपने number पर बार-बार भेजें" },
        steps: [
          { en: "Capture the request that sends an SMS to a number you control; confirm one request = one text.", simple: "Catch the request that texts your own phone and confirm one text per request.", hi: "वह request capture करें जो आपके number पर SMS भेजती है; एक request = एक text पुष्टि करें।" },
          { en: "Send a small bounded burst to your own number and confirm there is no per-number/IP cap, cooldown, or CAPTCHA between sends.", simple: "Send a few in a row to your own number and confirm nothing throttles it.", hi: "अपने number पर छोटा bounded burst भेजें और पुष्टि करें कि बीच में कोई cap/cooldown/CAPTCHA नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the request and that N sends produced N texts to your own number, kept to a minimal count. Emphasise the per-message cost (toll-fraud/financial impact) since that is the differentiator from email. Keep it benign and never target a real person's phone. A cooldown, resend cap or CAPTCHA means the control exists and it's N/A; many programs also exclude SMS-bombing as DoS.",
      simple: "Show a few requests gave a few texts to your own phone, and note each text costs the company money. Don't text anyone else. A cooldown or CAPTCHA = N/A.",
      hi: "Triage को request और यह चाहिए कि N sends से आपके number पर N texts आए, गिनती कम। per-message cost (financial impact) ज़ोर दें — यही email से फर्क है। किसी असली व्यक्ति के phone को निशाना न बनाएँ। cooldown/cap/CAPTCHA = N/A; कई programs SMS-bombing को DoS मानकर exclude करते हैं।",
    },
    escalate: {
      en: "Shares the P4 band with the Login/Registration/Email siblings. The financial toll-fraud impact is the strongest argument for it being rewarded over the email variant; if the SMS carries an OTP you can also test whether the OTP itself is brute-forceable (a separate auth finding).",
      simple: "Same P4 band as the email/login siblings; the money angle makes it stronger. If it sends an OTP, the OTP's own weakness is a separate bug.",
      hi: "Login/Registration/Email siblings के साथ P4 band। financial toll-fraud impact इसे email variant से ज़्यादा reward-worthy बनाता है; अगर SMS में OTP हो तो OTP brute-force होना अलग auth finding है।",
    },
  },

  "Server Security Misconfiguration › Username/Email Enumeration › Brute Force": {
    what: {
      en: "The application lets you distinguish valid from invalid usernames/emails by brute-forcing a list and observing a difference — in error message, HTTP status, response length, or timing — on login, registration, password-reset or similar forms. You end up with a confirmed list of accounts that exist, which seeds targeted password spraying, phishing and social engineering.",
      simple: "By trying lots of usernames/emails and watching the different reply, you can learn which ones are real accounts.",
      hi: "Application में valid बनाम invalid username/email का फर्क तब दिखता है जब आप एक list brute-force करके error message, HTTP status, response length या timing का अंतर देखते हैं (login/registration/password-reset forms पर)। नतीजा — मौजूद accounts की confirmed list, जो targeted password spraying/phishing को seed करती है।",
    },
    find: [
      {
        title: { en: "Compare responses for existing vs non-existing accounts", simple: "Compare replies for real vs fake accounts", hi: "मौजूद बनाम गैरमौजूद accounts के responses तुलना करें" },
        steps: [
          { en: "Submit one account you know exists and one random non-existent value on the same form; diff message text, status, length and timing.", simple: "Try one real and one fake account on the same form and compare the replies.", hi: "एक मौजूद और एक random गैरमौजूद value एक ही form पर भेजें; message, status, length, timing का diff देखें।" },
          { en: "If a difference exists, brute-force a small benign list through the oracle to confirm it reliably classifies accounts.", simple: "If there's a difference, test a small list to confirm it reliably tells real from fake.", hi: "फर्क हो तो एक छोटी benign list oracle से चलाकर पुष्टि करें कि यह भरोसेमंद classify करता है।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the exact oracle — paired requests/responses showing the difference between a valid and invalid identifier — not just 'the error wording differs sometimes'. Use benign/own values. By itself this is P5 and often informational / not rewarded; many login flows legitimately differ. It is only worth reporting when the signal is reliable and ideally chained to a weak-password or no-lockout issue.",
      simple: "Show the clear difference between a real and fake account reply. Alone it's P5 and often not paid. It matters more combined with weak passwords or no lockout.",
      hi: "Triage को exact oracle चाहिए — paired requests/responses जो valid बनाम invalid identifier का फर्क दिखाएँ, न कि 'कभी-कभी error अलग होता है'। benign/own values इस्तेमाल करें। अकेले P5, अक्सर informational/not rewarded। तभी value जब signal भरोसेमंद हो और weak-password/no-lockout से chain हो।",
    },
    references: [
      { label: "OWASP WSTG: Testing for Account Enumeration", url: "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/03-Identity_Management_Testing/04-Testing_for_Account_Enumeration_and_Guessable_User_Account" },
    ],
  },

  "Server Security Misconfiguration › No Rate Limiting on Form › Change Password": {
    what: {
      en: "The authenticated change-password form has no rate limit on attempts. Since the user is already logged in and the CVSS here assumes high privileges and physical/local access, the practical risk is narrow — mostly an attacker with a hijacked session guessing the 'current password' field unthrottled, or automating repeated changes. This is the lowest-rated of the no-rate-limit siblings.",
      simple: "The 'change password' form (for a logged-in user) has no limit on tries. Because you must already be logged in, the real-world risk is small.",
      hi: "Logged-in change-password form पर attempts की कोई rate limit नहीं। चूँकि user पहले से logged in है और यहाँ CVSS high privileges/local access मानता है, practical risk संकरा है — ज़्यादातर hijacked session वाला attacker 'current password' field को बिना throttle guess करे। यह no-rate-limit siblings में सबसे कम rated है।",
    },
    find: [
      {
        title: { en: "Hammer the current-password check on your own account", simple: "Repeatedly try the current-password check on your own account", hi: "अपने account पर current-password check बार-बार आज़माएँ" },
        steps: [
          { en: "Log into your own test account, open change-password, and capture the request including the current-password field.", simple: "Log into your test account and catch the change-password request.", hi: "अपने test account में log in करके change-password request (current-password field सहित) capture करें।" },
          { en: "Replay with wrong current-password values in a bounded burst and confirm there is no attempt limit, lockout, or re-auth step.", simple: "Try wrong current passwords several times and confirm nothing stops you.", hi: "गलत current-password values का bounded burst भेजें और पुष्टि करें कि कोई attempt-limit/lockout/re-auth नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the request showing unlimited current-password attempts on your own account. Because it requires an existing authenticated session, it is P5 and very often informational / not rewarded alone. It only gains value if the lack of limit lets a session-only attacker escalate to a full password change (and thus persistence) without knowing the current password.",
      simple: "Show unlimited current-password tries on your own account. It needs you to already be logged in, so alone it's usually not paid.",
      hi: "Triage को अपने account पर unlimited current-password attempts दिखाती request चाहिए। चूँकि authenticated session ज़रूरी है, यह P5 और अक्सर informational/not rewarded अकेले। value तभी जब session-only attacker बिना current password जाने full password change कर सके।",
    },
  },

  "Server Security Misconfiguration › Server-Side Request Forgery (SSRF) › External - DNS Query Only": {
    what: {
      en: "The thinnest SSRF signal: you can make the server perform a DNS lookup of a hostname you supply (confirmed via an out-of-band DNS callback) but you cannot get it to make an HTTP/TCP connection or return any data. It proves attacker-influenced name resolution exists, but no internal resource is reached, so impact is minimal.",
      simple: "You can make the server look up a domain name you choose (seen via an OOB DNS hit), but it won't actually connect anywhere or return data. Very low impact.",
      hi: "सबसे पतला SSRF signal: आप server से अपने दिए hostname का DNS lookup करवा सकते हैं (OOB DNS callback से confirm) पर HTTP/TCP connection या data नहीं पा सकते। यह attacker-influenced name resolution साबित करता है, पर कोई internal resource नहीं पहुँचता, इसलिए impact न्यूनतम।",
    },
    find: [
      {
        title: { en: "Confirm DNS-only interaction via OOB", simple: "Prove a DNS-only callback with an OOB tool", hi: "OOB से DNS-only interaction confirm करें" },
        steps: [
          { en: "Put a unique subdomain of your OOB listener (e.g. Burp Collaborator / interactsh) into a URL/host parameter.", simple: "Use a unique OOB domain in the URL parameter.", hi: "URL/host parameter में अपने OOB listener का unique subdomain डालें।" },
          { en: "Confirm you get a DNS lookup but no HTTP hit, and that no response body or connection comes back — otherwise it is a higher SSRF variant.", simple: "Confirm only a DNS lookup arrives, no HTTP and no data back.", hi: "पुष्टि करें कि सिर्फ़ DNS lookup आया, HTTP नहीं और कोई data वापस नहीं — वरना higher SSRF variant है।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the OOB log showing a DNS query from the target's resolver for your unique subdomain, tied to your request. If an HTTP callback also arrives, or you can reach internal hosts, report the stronger variant. DNS-only is P5 / often informational — many programs treat it as a near-N/A unless chained.",
      simple: "Show the OOB DNS hit linked to your request. If an HTTP hit comes too, it's a bigger bug. DNS-only is P5 and often basically N/A alone.",
      hi: "Triage को OOB log चाहिए जो आपके unique subdomain के लिए target के resolver से DNS query दिखाए, आपकी request से जुड़ा। अगर HTTP callback भी आए या internal hosts पहुँचें तो stronger variant report करें। DNS-only P5/informational — chain न हो तो अक्सर near-N/A।",
    },
    escalate: {
      en: "Getting a full HTTP callback or any connection to internal services moves it up to 'External - Low impact' or the internal variants (up to P2 for secrets). DNS-only is the floor.",
      simple: "A real HTTP callback or reaching internal services pushes it higher. DNS-only is the lowest rung.",
      hi: "पूरा HTTP callback या internal services तक connection इसे 'External - Low impact' या internal variants (secrets के लिए P2 तक) बना देता है। DNS-only सबसे नीचे है।",
    },
  },

  "Server Security Misconfiguration › Server-Side Request Forgery (SSRF) › External - Low impact": {
    what: {
      en: "The server makes a full outbound HTTP request to an attacker-supplied URL that only reaches the public internet — not internal/metadata ranges — and you learn little beyond 'it connected'. Confirmed via an OOB HTTP callback. It demonstrates SSRF but against external targets only, so the security impact is low.",
      simple: "You can make the server send a real web request to a public URL you pick (seen via an OOB HTTP hit), but it can't reach anything internal. Low impact.",
      hi: "Server आपकी दी URL पर full outbound HTTP request करता है पर सिर्फ़ public internet तक पहुँचता है — internal/metadata ranges तक नहीं — और 'connect हुआ' से ज़्यादा कुछ पता नहीं चलता। OOB HTTP callback से confirm। यह SSRF तो दिखाता है पर external targets पर, इसलिए impact low।",
    },
    find: [
      {
        title: { en: "Confirm an external HTTP callback, then probe internal", simple: "Prove an external HTTP hit, then try internal", hi: "external HTTP callback confirm करें, फिर internal probe करें" },
        steps: [
          { en: "Put your OOB HTTP listener URL in the fetched parameter and confirm a full HTTP request (not just DNS) arrives.", simple: "Use your OOB URL and confirm a full HTTP request comes in.", hi: "fetched parameter में अपना OOB HTTP listener URL डालें और पुष्टि करें कि full HTTP request (सिर्फ़ DNS नहीं) आई।" },
          { en: "Attempt internal/metadata targets (169.254.169.254, localhost, RFC1918) — if they are all blocked and only external works, this is the correct leaf.", simple: "Try internal/metadata addresses; if only external works, this is the right rating.", hi: "internal/metadata targets (169.254.169.254, localhost, RFC1918) आज़माएँ — अगर सब blocked और सिर्फ़ external चले, तो यही leaf सही है।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the OOB HTTP callback proving the server fetched your external URL, plus evidence that internal ranges are blocked (so you've bounded the impact honestly). If you can read back the external response body or hit internal hosts, it's a higher variant. External-only SSRF is P5 / low and often not rewarded unless it enables something concrete (e.g. request smuggling to a partner).",
      simple: "Show the OOB HTTP hit and that internal addresses are blocked. If you can reach internal or read the response, it's bigger. External-only is low and often not paid.",
      hi: "Triage को OOB HTTP callback चाहिए जो साबित करे server ने आपकी external URL fetch की, और सबूत कि internal ranges blocked हैं। अगर external response body पढ़ें या internal hosts पहुँचें तो higher variant। External-only SSRF P5/low, अक्सर not rewarded जब तक कोई concrete चीज़ enable न करे।",
    },
    escalate: {
      en: "Reaching internal hosts turns it into the internal port-scan/data/secrets variants (up to P2). Reading the fetched external response can expose otherwise-blind data or enable response-based attacks.",
      simple: "Reaching internal turns it into the P2–P4 internal variants. Reading the response can leak hidden data.",
      hi: "internal hosts पहुँचना इसे internal port-scan/data/secrets variants (P2 तक) बना देता है। fetched external response पढ़ना blind data expose कर सकता है।",
    },
  },

  "Server Security Misconfiguration › Unsafe File Upload › File Extension Filter Bypass": {
    what: {
      en: "The upload accepts files it meant to block by bypassing a weak extension check — double extensions (shell.php.jpg), case/trailing tricks (.PhP, .php.), null bytes, alternate executable extensions (.phtml, .pht, .asp;.jpg), or content-type/magic-byte mismatch. By itself the VRT rates this P5: you got a disallowed extension past the filter, but without proving the file is served/executed it is only a filter weakness, not confirmed code execution.",
      simple: "The upload form blocks certain file types, but you trick the check (like naming a file shell.php.jpg) to sneak a blocked extension through. On its own it's just a weak filter, not proven code execution.",
      hi: "Upload एक कमज़ोर extension check को bypass करके वे files ले लेता है जिन्हें रोकना था — double extensions (shell.php.jpg), case/trailing tricks (.PhP, .php.), null bytes, alternate executable extensions (.phtml, .pht), या content-type/magic-byte mismatch। VRT इसे अकेले P5 मानता है: आपने disallowed extension filter से पार कराई, पर file serve/execute होना साबित किए बिना यह सिर्फ़ filter weakness है, confirmed code execution नहीं।",
    },
    find: [
      {
        title: { en: "Defeat the extension check and confirm the file lands", simple: "Trick the extension check and confirm the upload stored", hi: "extension check को हराएँ और file stored होना confirm करें" },
        steps: [
          { en: "Baseline what the filter blocks, then try double extensions, case variants, trailing dot/space, null byte, and alternate executable extensions.", simple: "See what's blocked, then try tricks like double extensions and case changes.", hi: "देखें filter क्या रोकता है, फिर double extensions, case variants, trailing dot/space, null byte, alternate executable extensions आज़माएँ।" },
          { en: "Also try keeping a benign extension but swapping the Content-Type / magic bytes to see which layer actually enforces.", simple: "Also try a safe extension with a mismatched content-type to find the weak layer.", hi: "benign extension रखकर Content-Type/magic bytes बदलें ताकि पता चले कौन-सी layer enforce करती है।" },
          { en: "Confirm the disallowed-extension file is accepted and stored; note the returned path if any.", simple: "Confirm the blocked-type file got accepted and note where it's stored.", hi: "पुष्टि करें कि disallowed-extension file accept और store हुई; return path नोट करें।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the request showing a normally-blocked extension accepted via your bypass, and where it was stored. Without showing the file is then served or executed, it stays a P5 filter weakness. If the uploaded file is retrievable and the server executes it (or it enables stored XSS/content-type confusion), report that chain — it is a different, higher finding.",
      simple: "Show a blocked file type getting accepted through your trick, and where it's stored. If you can't show it runs or is served, it stays low P5.",
      hi: "Triage को request चाहिए जो दिखाए कि सामान्यतः blocked extension आपके bypass से accept हुई, और कहाँ store हुई। file serve/execute होना दिखाए बिना यह P5 filter weakness रहता है। अगर uploaded file retrievable हो और server execute करे (या stored XSS/content-type confusion enable हो) तो वह chain अलग, higher finding है।",
    },
    escalate: {
      en: "Proving the uploaded file executes (webshell → RCE) or is served in a way that runs script (stored XSS) moves this far above P5 into its own high-impact finding. The 'No Antivirus' and 'No Size Limit' siblings are separate, lower upload weaknesses.",
      simple: "If the uploaded file actually runs (webshell/RCE) or runs script (stored XSS), it becomes a much bigger bug. The AV/size-limit siblings are separate and lower.",
      hi: "uploaded file execute होना (webshell → RCE) या script चलने के तरीके से serve होना (stored XSS) इसे P5 से कहीं ऊपर अपना high-impact finding बना देता है। 'No Antivirus'/'No Size Limit' siblings अलग, lower upload weaknesses हैं।",
    },
    references: [
      { label: "OWASP WSTG: Testing Upload of Unexpected File Types", url: "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/10-Business_Logic_Testing/08-Test_Upload_of_Unexpected_File_Types" },
    ],
  },

  "Server Security Misconfiguration › Misconfigured Security Headers  › Insecure Content-Security-Policy": {
    what: {
      en: "The response ships a Content-Security-Policy that is present but weak, so it fails to constrain script sources — e.g. 'unsafe-inline' or 'unsafe-eval' in script-src, a wildcard/overly-broad allowlist, no default-src fallback, allowlisting a host that serves attacker-controllable JSONP/CDN, or missing object-src/base-uri. The header exists but does little to stop XSS. Alone it is a hardening gap (P5), not an exploit.",
      simple: "The site has a Content-Security-Policy header, but it's set up weakly (like allowing 'unsafe-inline'), so it doesn't really stop XSS. On its own it's just a missing safeguard, not a bug you can exploit.",
      hi: "Response में Content-Security-Policy है पर कमज़ोर, इसलिए script sources को रोक नहीं पाती — जैसे script-src में 'unsafe-inline'/'unsafe-eval', wildcard allowlist, default-src fallback न होना, JSONP/CDN host allowlist करना, या object-src/base-uri गायब। header है पर XSS रोकने में कुछ नहीं करता। अकेले यह hardening gap (P5) है, exploit नहीं।",
    },
    find: [
      {
        title: { en: "Analyse the CSP for bypassable directives", simple: "Check the CSP for weak settings", hi: "CSP को bypassable directives के लिए analyse करें" },
        steps: [
          { en: "Capture the CSP header and run it through a policy evaluator to flag 'unsafe-inline', 'unsafe-eval', wildcards, and missing default-src/object-src/base-uri.", simple: "Read the CSP and flag the unsafe or wildcard parts.", hi: "CSP header capture करें और evaluator से 'unsafe-inline', 'unsafe-eval', wildcards, गायब default-src/object-src/base-uri flag करें।" },
          { en: "For each allowlisted host, check whether it serves attacker-controllable content (open JSONP endpoints, user-uploaded JS, known-bypass CDNs).", simple: "Check if any allowed source lets an attacker host JavaScript.", hi: "हर allowlisted host के लिए देखें कि वह attacker-controllable content (JSONP, user JS, bypass CDN) serve करता है या नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the exact CSP string and a precise explanation of which directive is weak and how it would fail to stop injected script. By itself it is P5 / informational and frequently not rewarded. It only becomes meaningful when you have an actual injection point whose exploitation the weak CSP fails to block — then report the XSS and cite the CSP as why mitigation fails.",
      simple: "Show the CSP and exactly why it's weak. Alone it's usually not paid. It matters only if you also have an XSS that the weak CSP would have stopped.",
      hi: "Triage को exact CSP string और सटीक व्याख्या चाहिए कि कौन-सी directive कमज़ोर है और injected script कैसे नहीं रुकेगी। अकेले P5/informational, अक्सर not rewarded। तभी मायने रखता है जब actual injection point हो जिसे कमज़ोर CSP रोक न सके — तब XSS report करके CSP को mitigation-failure के रूप में cite करें।",
    },
    references: [
      { label: "MDN: Content-Security-Policy", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy" },
    ],
  },

  "Server Security Misconfiguration › Missing DNSSEC": {
    what: {
      en: "The domain's DNS zone is not signed with DNSSEC, so resolvers cannot cryptographically verify that DNS answers are authentic. In theory this leaves the name resolution open to on-path spoofing/cache-poisoning, but the attack requires a privileged network position and modern resolvers/transport protections make it largely theoretical. It is a best-practice/hardening gap, not a directly exploitable web bug.",
      simple: "The domain doesn't use DNSSEC, which would let resolvers verify DNS answers are genuine. Without it, DNS could in theory be spoofed, but only by someone already in a powerful network position. It's a hardening gap, not a real exploit.",
      hi: "Domain का DNS zone DNSSEC से signed नहीं, इसलिए resolvers DNS answers की authenticity cryptographically verify नहीं कर सकते। सिद्धांत में यह on-path spoofing/cache-poisoning खोलता है, पर इसके लिए privileged network position चाहिए और modern resolvers इसे काफी हद तक theoretical बना देते हैं। यह best-practice/hardening gap है, directly exploitable web bug नहीं।",
    },
    find: [
      {
        title: { en: "Check the zone for DNSSEC records", simple: "Check if the domain is DNSSEC-signed", hi: "zone में DNSSEC records check करें" },
        steps: [
          { en: "Query for DNSKEY/DS/RRSIG records (e.g. dig +dnssec DNSKEY, dig DS at the parent) and confirm they are absent or the chain of trust is broken.", simple: "Query DNSKEY/DS records and confirm none exist or the chain is broken.", hi: "DNSKEY/DS/RRSIG records query करें (dig +dnssec) और पुष्टि करें कि वे गायब हैं या chain of trust टूटी है।" },
          { en: "Confirm with a DNSSEC validation/debugger tool that the zone returns no valid signatures.", simple: "Use a DNSSEC checker to confirm it's unsigned.", hi: "किसी DNSSEC validation/debugger tool से पुष्टि करें कि zone कोई valid signatures नहीं लौटाती।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the dig output / validator result showing DNSSEC is not enabled. This is P5 / informational and is very often considered out of scope or not rewarded on its own — many programs explicitly exclude missing DNSSEC. Report it only if the program asks for hardening findings or it is part of a larger DNS-trust story.",
      simple: "Show the dig/validator output proving no DNSSEC. It's informational and usually out of scope or not paid on its own.",
      hi: "Triage को dig output/validator result चाहिए जो दिखाए DNSSEC enabled नहीं। यह P5/informational और अक्सर out of scope या अकेले not rewarded — कई programs missing DNSSEC explicitly exclude करते हैं।",
    },
  },

  "Server Security Misconfiguration › Missing Subresource Integrity": {
    what: {
      en: "The page loads third-party scripts/styles (from a CDN or external host) via <script>/<link> tags without an integrity (SRI) hash. If that external resource is ever tampered with or the CDN is compromised, the browser will run the modified code with no detection. It is a supply-chain hardening gap: the risk depends entirely on trusting the external host, and alone there is nothing to actively exploit.",
      simple: "The page pulls in scripts from another site (a CDN) without an SRI hash that would check the file wasn't changed. If that CDN is hacked, the bad script just runs. It's a hardening gap that depends on trusting the CDN.",
      hi: "Page तीसरे-पक्ष के scripts/styles (CDN/external host से) <script>/<link> tags में बिना integrity (SRI) hash के load करता है। अगर वह external resource कभी छेड़ा जाए या CDN compromise हो, browser modified code बिना पकड़े चला देगा। यह supply-chain hardening gap है: risk पूरी तरह external host पर भरोसे पर निर्भर, और अकेले actively exploit करने को कुछ नहीं।",
    },
    find: [
      {
        title: { en: "Find externally-loaded resources without integrity", simple: "Find CDN scripts that lack an integrity hash", hi: "बिना integrity के external resources खोजें" },
        steps: [
          { en: "Scan the HTML for <script src> / <link rel=stylesheet> pointing at third-party/CDN hosts and check for a missing integrity= attribute.", simple: "Look for CDN script/style tags with no integrity attribute.", hi: "HTML में तीसरे-पक्ष/CDN hosts की ओर इशारा करते <script src>/<link> देखें और missing integrity= attribute check करें।" },
          { en: "Confirm the host is genuinely external (not same-origin, where SRI matters less) and that crossorigin handling wouldn't already block it.", simple: "Confirm the source is really external, not your own site.", hi: "पुष्टि करें कि host सचमुच external है (same-origin नहीं, जहाँ SRI कम मायने रखता है)।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the specific external resource URLs loaded without SRI. This is P5 / informational and commonly not rewarded alone, especially for first-party or well-known CDNs. It is worth more only if the external host is one you can show is actually attacker-influenceable (e.g. an abandoned/takeoverable domain), which turns it into a real supply-chain compromise.",
      simple: "List the external scripts loaded without an integrity hash. Alone it's usually not paid; it matters only if that external host could realistically be taken over.",
      hi: "Triage को बिना SRI load हो रहे specific external resource URLs चाहिए। यह P5/informational, अक्सर अकेले not rewarded (खासकर first-party/well-known CDNs)। value तभी ज़्यादा जब external host सचमुच attacker-influenceable (जैसे takeoverable domain) हो, जो इसे real supply-chain compromise बना दे।",
    },
    references: [
      { label: "MDN: Subresource Integrity", url: "https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity" },
    ],
  },

  "Server Security Misconfiguration › Unsafe File Upload › No Antivirus": {
    what: {
      en: "An upload feature stores user files without malware scanning, so known-malicious files are accepted and persisted. The risk is that the platform becomes a host/distributor of malware to other users or downstream systems (e.g. files other users download), rather than direct compromise of the server itself. It is a P5 hygiene gap: the file is stored, not necessarily executed.",
      simple: "The upload doesn't scan files for malware, so a known-bad file gets stored. The danger is the site handing that file to other users, not the server itself getting hacked.",
      hi: "Upload feature user files बिना malware scanning के store करता है, तो known-malicious files accept और persist होती हैं। risk यह कि platform दूसरे users/downstream systems को malware host/distribute करने लगे (जैसे files दूसरे users download करें), न कि server खुद compromise। यह P5 hygiene gap है: file store होती है, ज़रूरी नहीं execute।",
    },
    find: [
      {
        title: { en: "Upload a benign AV test file and confirm it is kept", simple: "Upload a harmless AV test file and see it's accepted", hi: "benign AV test file upload करके देखें कि रखी जाती है" },
        steps: [
          { en: "Upload the standard EICAR antivirus test string (a harmless, universally-detected test file) through the upload feature.", simple: "Upload the harmless EICAR test file that every AV flags.", hi: "upload feature से standard EICAR antivirus test string (harmless, हर AV इसे पकड़ता है) upload करें।" },
          { en: "Confirm it is accepted and stored (not quarantined/rejected), and if possible that it can be downloaded back unchanged by a user.", simple: "Confirm it's stored and can be downloaded back, not blocked.", hi: "पुष्टि करें कि यह accept/store हुई (quarantine/reject नहीं), और हो सके तो user इसे वापस unchanged download कर सके।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs evidence EICAR (or equivalent benign test file) was accepted and retrievable, proving no AV scanning. Use only the harmless EICAR string — never upload real malware. This is P5 and often informational / not rewarded alone; it carries weight mainly where uploaded files are served to other users and could spread malware. The 'Extension Filter Bypass' and 'No Size Limit' siblings are different upload weaknesses.",
      simple: "Show the harmless EICAR file was stored and downloadable, proving no scanning. Never upload real malware. Alone it's usually not paid; matters when files reach other users.",
      hi: "Triage को सबूत चाहिए कि EICAR (या समकक्ष benign test file) accept और retrievable हुई, जिससे no AV scanning साबित हो। सिर्फ़ harmless EICAR string इस्तेमाल करें — असली malware कभी upload न करें। P5, अक्सर अकेले not rewarded; weight तब जब uploaded files दूसरे users को serve हों।",
    },
    references: [
      { label: "EICAR standard anti-malware test file", url: "https://www.eicar.org/download-anti-malware-testfile/" },
    ],
  },

  "Server Security Misconfiguration › Unsafe File Upload › No Size Limit": {
    what: {
      en: "The upload endpoint enforces no maximum file size, so an attacker can upload very large files and/or many of them to exhaust disk, memory or bandwidth. The impact is availability-oriented (storage/resource exhaustion), which is why it sits at P5 and why it must be tested carefully — unbounded uploads against production are destructive and usually prohibited.",
      simple: "The upload has no size cap, so an attacker could upload huge files to fill up storage. It's a resource/availability issue, so test it very gently.",
      hi: "Upload endpoint पर कोई maximum file size नहीं, तो attacker बहुत बड़ी/कई files upload करके disk, memory या bandwidth खत्म कर सकता है। impact availability-oriented (storage/resource exhaustion) है, इसलिए यह P5 पर है और इसे सावधानी से test करना ज़रूरी — unbounded uploads production पर destructive और आमतौर पर प्रतिबंधित हैं।",
    },
    find: [
      {
        title: { en: "Probe the size ceiling minimally and safely", simple: "Gently test whether any size limit exists", hi: "size ceiling को minimally और safely probe करें" },
        steps: [
          { en: "Upload a moderately oversized file (well beyond any sane document size, but not enough to risk an outage) and see whether it is accepted.", simple: "Upload one file that's bigger than normal and see if it's accepted.", hi: "एक moderately oversized file (sane document size से ऊपर, पर outage का risk नहीं) upload करें और देखें accept होती है या नहीं।" },
          { en: "Read any client-side or documented limit, then confirm the server does not independently enforce it — do not attempt to actually fill storage.", simple: "Check for a stated limit, then confirm the server doesn't enforce it — don't try to fill the disk.", hi: "किसी client-side/documented limit को पढ़ें, फिर पुष्टि करें कि server स्वतंत्र रूप से enforce नहीं करता — storage भरने की कोशिश न करें।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs evidence that a file far larger than any legitimate limit was accepted, without you actually causing resource exhaustion. Keep the proof minimal and rate-limited. This is a DoS-flavoured P5: many programs exclude resource-exhaustion/DoS entirely, so check policy — if DoS is out of scope it is N/A regardless.",
      simple: "Show that an unreasonably large file was accepted, without actually filling storage. Keep it tiny-scale. Many programs exclude DoS, so it may be N/A.",
      hi: "Triage को सबूत चाहिए कि किसी भी legitimate limit से कहीं बड़ी file accept हुई, बिना सचमुच resource exhaustion किए। proof minimal और rate-limited रखें। यह DoS-जैसा P5: कई programs resource-exhaustion/DoS पूरी तरह exclude करते हैं, policy देखें — DoS out of scope हो तो यह वैसे भी N/A।",
    },
  },

  "Server Security Misconfiguration › Missing Secure or HTTPOnly Cookie Flag › Non-Session Cookie": {
    what: {
      en: "A cookie that is NOT the session/auth token is set without the Secure and/or HttpOnly flag — e.g. a preference, CSRF, tracking or feature-flag cookie. Missing Secure means it can leak over plaintext HTTP; missing HttpOnly means JavaScript can read it. Because the cookie is non-sensitive, the practical impact is minimal, which is exactly why this is the P5 variant versus the P4 session-token sibling.",
      simple: "A non-login cookie (like a preference or tracking cookie) is missing the Secure/HttpOnly flags. Since this cookie isn't the session token, the real risk is small.",
      hi: "कोई cookie जो session/auth token नहीं है, बिना Secure और/या HttpOnly flag के set होती है — जैसे preference, CSRF, tracking या feature-flag cookie। Secure गायब = plaintext HTTP पर leak; HttpOnly गायब = JavaScript पढ़ सकता है। चूँकि cookie non-sensitive है, practical impact न्यूनतम — यही इसे P4 session-token sibling के मुकाबले P5 variant बनाता है।",
    },
    find: [
      {
        title: { en: "Identify the cookie and confirm it is non-session", simple: "Find the cookie and confirm it isn't the login one", hi: "cookie पहचानें और पुष्टि करें कि यह session नहीं" },
        steps: [
          { en: "Inspect Set-Cookie headers and flag any cookie missing Secure or HttpOnly.", simple: "Look at Set-Cookie headers for missing Secure/HttpOnly.", hi: "Set-Cookie headers देखें और Secure/HttpOnly गायब वाली cookie flag करें।" },
          { en: "Confirm the flagged cookie is NOT the session/auth token (that would be the higher P4 sibling) and describe what it actually holds.", simple: "Confirm it's not the session cookie and note what it stores.", hi: "पुष्टि करें कि यह session/auth token नहीं (वह higher P4 sibling है) और बताएँ यह क्या store करती है।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the Set-Cookie header showing the missing flag and confirmation the cookie is non-sensitive. This is P5 / informational and frequently not rewarded on its own. If the cookie actually carries something that matters (auth, a token reused for auth), it is no longer this leaf — report the session-token variant or the resulting impact.",
      simple: "Show the Set-Cookie line with the missing flag and that the cookie is harmless. Alone it's usually not paid. If it's actually a login cookie, report the higher variant.",
      hi: "Triage को Set-Cookie header चाहिए जो missing flag दिखाए, और पुष्टि कि cookie non-sensitive है। P5/informational, अक्सर अकेले not rewarded। अगर cookie सचमुच कुछ मायने रखती है (auth) तो यह leaf नहीं — session-token variant या resulting impact report करें।",
    },
    escalate: {
      en: "If the same missing flag is on the session/auth cookie it becomes the 'Session Token (P4)' sibling, and a missing HttpOnly there means an XSS can steal the session — a materially higher chain.",
      simple: "If it's the session cookie missing the flag, that's the P4 sibling, and missing HttpOnly there lets XSS steal the login.",
      hi: "अगर वही missing flag session/auth cookie पर हो तो यह 'Session Token (P4)' sibling बन जाता है, और वहाँ HttpOnly गायब होने से XSS session चुरा सकता है — काफी higher chain।",
    },
  },

  "Server Security Misconfiguration › Potentially Unsafe HTTP Method Enabled › OPTIONS": {
    what: {
      en: "The server answers the HTTP OPTIONS method. OPTIONS is a benign, standards-defined method used for CORS preflight and capability discovery; on its own it does not expose or modify anything. Bugcrowd lists it as P5 because the only thing it leaks is the Allow list of supported methods. It is reported as a hardening/informational note, not a vulnerability.",
      simple: "The server replies to the OPTIONS request. OPTIONS is a normal, safe method (used for CORS checks) that only tells you which methods are allowed. It's informational, not really a bug.",
      hi: "Server HTTP OPTIONS method का जवाब देता है। OPTIONS एक benign, standards-defined method है (CORS preflight/capability discovery), अकेले कुछ expose/modify नहीं करती। Bugcrowd इसे P5 मानता है क्योंकि यह सिर्फ़ supported methods की Allow list बताती है। यह hardening/informational note है, vulnerability नहीं।",
    },
    find: [
      {
        title: { en: "Send OPTIONS and read the Allow header", simple: "Send OPTIONS and read which methods are allowed", hi: "OPTIONS भेजें और Allow header पढ़ें" },
        steps: [
          { en: "Send an OPTIONS request to the endpoint and record the response and the Allow header it returns.", simple: "Send an OPTIONS request and note the Allow header.", hi: "endpoint पर OPTIONS request भेजें और response व Allow header रिकॉर्ड करें।" },
          { en: "Note which methods are advertised; if any are genuinely dangerous (e.g. PUT/DELETE that actually work), that is a separate, higher finding — not OPTIONS itself.", simple: "See which methods are listed; if a dangerous one actually works, that's a separate bug.", hi: "देखें कौन-सी methods advertise हुईं; अगर कोई सचमुच खतरनाक (PUT/DELETE जो चलती हो) तो वह अलग higher finding है, OPTIONS नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the OPTIONS request/response and the Allow header. By itself OPTIONS being enabled is P5 / informational and almost always not rewarded — it is expected behaviour on most servers. Only pursue it if the Allow list reveals a genuinely unsafe, working method, which you must then prove separately.",
      simple: "Show the OPTIONS response and Allow header. On its own it's almost never paid. Only matters if it reveals a dangerous method that actually works.",
      hi: "Triage को OPTIONS request/response और Allow header चाहिए। अकेले OPTIONS enabled होना P5/informational और लगभग हमेशा not rewarded — ज़्यादातर servers पर यह expected है। तभी आगे बढ़ें जब Allow list कोई सचमुच unsafe, working method दिखाए, जिसे अलग से साबित करना होगा।",
    },
  },

  "Server Security Misconfiguration › Reflected File Download (RFD)": {
    what: {
      en: "An endpoint reflects attacker-controlled input into a response that the browser treats as a downloadable file with an attacker-influenced filename/extension (e.g. a JSON/API endpoint with no safe Content-Disposition, reachable via a URL whose path segment sets a .bat/.cmd name). A victim who clicks a link on the trusted domain downloads what looks like an official file; when run, it executes attacker commands — social-engineering leverage from the trusted origin.",
      simple: "A link on the trusted site makes the browser download a file whose name and contents the attacker controls (like a .bat). The victim thinks it's an official download, runs it, and it executes the attacker's commands.",
      hi: "कोई endpoint attacker-controlled input को ऐसे response में reflect करता है जिसे browser downloadable file मानता है, attacker-influenced filename/extension के साथ (जैसे बिना safe Content-Disposition वाला JSON/API endpoint, जिसकी URL path .bat/.cmd नाम सेट करे)। trusted domain पर link click करने वाला victim official दिखती file download करता है; चलाने पर attacker commands execute होती हैं — trusted origin का social-engineering leverage।",
    },
    find: [
      {
        title: { en: "Find a reflecting endpoint and force a dangerous download", simple: "Find an endpoint that reflects input and downloads as a file", hi: "reflecting endpoint खोजें और dangerous download force करें" },
        steps: [
          { en: "Find an endpoint that reflects your input into the body (e.g. JSON callback/error message) and lacks a filename-fixing Content-Disposition.", simple: "Find an endpoint that echoes your input and doesn't fix the download filename.", hi: "ऐसा endpoint खोजें जो आपका input body में reflect करे (JSON callback/error) और filename-fixing Content-Disposition न रखे।" },
          { en: "Craft a URL whose trailing path segment sets an executable extension (…/x.bat) and whose reflected content is valid command syntax, then confirm the browser downloads it with that name.", simple: "Make a URL that forces a .bat filename with command text inside and confirm it downloads.", hi: "ऐसा URL बनाएँ जिसका trailing path segment executable extension (…/x.bat) सेट करे और reflected content valid command syntax हो, फिर पुष्टि करें browser उसी नाम से download करता है।" },
          { en: "Confirm the download appears to originate from the trusted domain in the browser UI.", simple: "Confirm the download looks like it comes from the trusted site.", hi: "पुष्टि करें कि download browser UI में trusted domain से आती दिखती है।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the crafted URL on the in-scope domain, the response showing reflected content with no safe Content-Disposition, and that a modern browser actually offers it as a download with the attacker-chosen executable name. Keep the payload a harmless marker (e.g. echo a canary), never real malware. If the browser forces a safe filename, strips the extension, or the response isn't treated as a download, it's N/A.",
      simple: "Show the crafted URL on the real domain, the reflected response, and the browser downloading it as an attacker-named .bat. Use a harmless command. If the browser fixes the filename, it's N/A.",
      hi: "Triage को in-scope domain पर crafted URL, बिना safe Content-Disposition reflected content दिखाता response, और modern browser द्वारा उसे attacker-chosen executable नाम से download offer करना चाहिए। payload harmless marker रखें (canary echo), असली malware कभी नहीं। अगर browser safe filename force करे/extension हटाए या response download न माना जाए, तो N/A।",
    },
    references: [
      { label: "OWASP: Reflected File Download", url: "https://owasp.org/www-community/attacks/Reflected_File_Download" },
    ],
  },

  "Server Security Misconfiguration › Same-Site Scripting": {
    what: {
      en: "A DNS misconfiguration where a hostname such as 'localhost.example.com' resolves to 127.0.0.1 (or similar same-site aliasing). Because the name sits under the real domain but points at the visitor's own machine, script running there is same-origin/same-site with the real site in some trust checks, letting a local-ish attacker abuse that trust — e.g. read cookies scoped to the parent domain. Impact is narrow and needs specific preconditions, hence P5.",
      simple: "A DNS mistake makes a name like 'localhost.example.com' point to 127.0.0.1. Because it's under the real domain, scripts there can be treated as part of the real site, letting an attacker abuse that trust in limited ways.",
      hi: "एक DNS misconfiguration जहाँ 'localhost.example.com' जैसा hostname 127.0.0.1 पर resolve होता है (या ऐसा same-site aliasing)। नाम असली domain के नीचे है पर visitor की अपनी machine पर इशारा करता है, इसलिए कुछ trust checks में वहाँ चलता script असली site के साथ same-origin/same-site माना जाता है, जिससे local-ish attacker उस trust का दुरुपयोग करे (जैसे parent domain की cookies पढ़े)। impact संकरा, specific preconditions चाहिए, इसलिए P5।",
    },
    find: [
      {
        title: { en: "Check for same-site hostnames resolving to loopback", simple: "Check if a subdomain points to 127.0.0.1", hi: "loopback पर resolve होने वाले same-site hostnames check करें" },
        steps: [
          { en: "Resolve candidate names like localhost.<domain> (and similar) and confirm they return 127.0.0.1 / a loopback or local address.", simple: "Look up localhost.<domain> and see if it returns 127.0.0.1.", hi: "localhost.<domain> जैसे candidate names resolve करें और पुष्टि करें कि वे 127.0.0.1/loopback लौटाते हैं।" },
          { en: "Confirm whether a service on the victim's loopback is reachable at that name and whether cookies/trust scoped to the parent domain would apply there.", simple: "Check if a local service is reachable via that name and shares the domain's cookies.", hi: "पुष्टि करें कि victim के loopback पर कोई service उस नाम से पहुँचती है और parent domain की cookies/trust वहाँ लागू होती है या नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the DNS record proving the same-site name resolves to loopback, plus a concrete demonstration of the trust abuse (e.g. reading a parent-domain cookie from a page served on that loopback name). Because it requires the victim to run something locally and specific cookie scoping, it is P5 and often informational. Without a working trust-abuse demo it is just a questionable DNS entry.",
      simple: "Show the DNS record pointing the name to 127.0.0.1 and a real demo of the trust being abused (like reading a domain cookie). Without that demo it's just an odd DNS entry.",
      hi: "Triage को DNS record चाहिए जो same-site name का loopback पर resolve होना साबित करे, और trust-abuse का concrete demo (जैसे उस loopback name पर served page से parent-domain cookie पढ़ना)। चूँकि victim को locally कुछ चलाना और specific cookie scoping चाहिए, यह P5/informational। working demo बिना यह सिर्फ़ संदिग्ध DNS entry है।",
    },
  },

  "Server Security Misconfiguration › Potentially Unsafe HTTP Method Enabled › TRACE": {
    what: {
      en: "The server responds to the HTTP TRACE method, which echoes back the exact request it received, including headers. Historically this enabled Cross-Site Tracing (XST) to read otherwise-protected headers/cookies via a scripted TRACE, but modern browsers block TRACE from JavaScript, so the practical risk is now very low. Bugcrowd rates it P5 as a hardening/informational finding.",
      simple: "The server answers the TRACE method, which echoes your request back (including headers). Old attacks (XST) used this to read cookies, but modern browsers block TRACE from scripts, so the real risk today is very low.",
      hi: "Server HTTP TRACE method का जवाब देता है, जो मिली request (headers सहित) वापस echo करती है। पहले इससे Cross-Site Tracing (XST) से protected headers/cookies पढ़े जाते थे, पर modern browsers TRACE को JavaScript से block करते हैं, इसलिए practical risk अब बहुत कम। Bugcrowd इसे P5 hardening/informational मानता है।",
    },
    find: [
      {
        title: { en: "Send TRACE and confirm the echo", simple: "Send TRACE and see if it echoes the request", hi: "TRACE भेजें और echo confirm करें" },
        steps: [
          { en: "Send a TRACE request with a marker header and confirm the server echoes the full request back in the body.", simple: "Send a TRACE with a test header and confirm it's echoed back.", hi: "marker header के साथ TRACE request भेजें और पुष्टि करें कि server पूरी request body में echo करता है।" },
          { en: "Note that modern browsers block scripted TRACE, so you cannot demonstrate live XST — state this honestly in the report.", simple: "Note that browsers block scripted TRACE, so XST can't really be shown today.", hi: "ध्यान दें modern browsers scripted TRACE block करते हैं, इसलिए live XST demonstrate नहीं कर सकते — report में ईमानदारी से बताएँ।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the TRACE request/response showing the echo. This is P5 / informational and usually not rewarded, because the classic XST exploit path is blocked in current browsers — do not claim cookie theft you cannot demonstrate. Report it as a hardening finding only.",
      simple: "Show the TRACE being echoed. It's informational and usually not paid, since browsers block the old XST attack. Don't claim cookie theft you can't show.",
      hi: "Triage को echo दिखाती TRACE request/response चाहिए। P5/informational, आमतौर पर not rewarded, क्योंकि classic XST path current browsers में blocked है — ऐसा cookie theft claim न करें जो demonstrate न कर सकें। सिर्फ़ hardening finding के रूप में report करें।",
    },
  },

  "Server Security Misconfiguration › OAuth Misconfiguration › Insecure Redirect URI": {
    what: {
      en: "The OAuth authorization server's redirect_uri validation is too loose — it allows arbitrary paths/subdomains, does suffix/prefix matching, permits open-redirect gadgets on an allowed host, or lets you append/override the parameter. The severity 'varies' because it ranges from a plain open redirect (low) up to full code/token theft and account takeover when the leaked redirect carries the auth code. The core bug is weak redirect_uri matching.",
      simple: "The OAuth server doesn't check the redirect_uri strictly, so an attacker can point the login redirect somewhere they control. Depending on what leaks, it ranges from a mild open redirect to full account takeover.",
      hi: "OAuth authorization server की redirect_uri validation बहुत ढीली है — arbitrary paths/subdomains allow करती है, suffix/prefix matching करती है, allowed host पर open-redirect gadget देती है, या parameter append/override होने देती है। severity 'varies' क्योंकि यह सादे open redirect (low) से लेकर auth code leak होने पर full token theft/ATO तक जाता है। मूल bug कमज़ोर redirect_uri matching है।",
    },
    find: [
      {
        title: { en: "Probe redirect_uri validation systematically", simple: "Test how strictly redirect_uri is checked", hi: "redirect_uri validation को systematically probe करें" },
        steps: [
          { en: "Start the flow and mutate redirect_uri: extra path (/callback/../evil), subdomain and sibling-domain tricks, @-tricks, trailing dots, double-encoding, and extra/duplicate redirect_uri params.", simple: "Change redirect_uri in many ways (extra path, subdomains, @ tricks) and see what's accepted.", hi: "flow शुरू करके redirect_uri को mutate करें: extra path, subdomain/sibling-domain tricks, @-tricks, trailing dots, double-encoding, duplicate params।" },
          { en: "For any accepted variant, check whether an authorization code/token is actually delivered to the attacker-controlled location (that is the high-impact case).", simple: "For anything accepted, check if the login code actually reaches your location.", hi: "किसी भी accepted variant के लिए देखें कि authorization code/token सचमुच attacker-controlled location पर पहुँचता है या नहीं (यही high-impact case है)।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the exact accepted redirect_uri mutation and what it yields: a bare redirect to your host (lower end) versus a delivered auth code/token (which should be reported as the Account Takeover sibling). State honestly which you achieved — a redirect that never carries a code is just an open redirect and is rated far lower than token theft.",
      simple: "Show the exact redirect_uri trick that worked and what it leaked: just a redirect (low) or an actual login code (then report it as account takeover). Be honest about which you got.",
      hi: "Triage को exact accepted redirect_uri mutation और उसका नतीजा चाहिए: सिर्फ़ आपके host पर redirect (lower) बनाम delivered auth code/token (जिसे Account Takeover sibling के रूप में report करें)। ईमानदारी से बताएँ क्या हासिल हुआ — बिना code वाला redirect सिर्फ़ open redirect है, token theft से काफी नीचे rated।",
    },
    escalate: {
      en: "If the loose redirect_uri lets you capture a victim's authorization code/token, escalate to 'Account Takeover (P2)'. If it only redirects without leaking the code, it stays an open-redirect-level low finding.",
      simple: "Capturing the victim's code pushes it to Account Takeover (P2). A redirect with no code stays a low open-redirect.",
      hi: "अगर ढीला redirect_uri victim का authorization code/token capture करने दे तो 'Account Takeover (P2)' तक escalate करें। बिना code सिर्फ़ redirect हो तो यह open-redirect-स्तर का low finding रहता है।",
    },
    references: [
      { label: "PortSwigger: OAuth 2.0 authentication vulnerabilities", url: "https://portswigger.net/web-security/oauth" },
    ],
  },

  "Server Security Misconfiguration › OAuth Misconfiguration › Missing/Broken State Parameter": {
    what: {
      en: "The OAuth flow does not use the state parameter, or does not bind/verify it to the user's session, so the authorization response is not tied to the request that started it. This is a CSRF on the OAuth flow: an attacker can force a victim to complete a login/link with an attacker-controlled authorization code, silently connecting the victim's account to the attacker's identity (OAuth login CSRF / forced account linking). Severity 'varies' with what the linked account can do.",
      simple: "The OAuth login doesn't use a proper 'state' value tied to your session, so it can be CSRF'd — an attacker can trick a victim into linking the victim's account to the attacker's social login.",
      hi: "OAuth flow state parameter इस्तेमाल नहीं करता, या उसे user की session से bind/verify नहीं करता, इसलिए authorization response उस request से बंधा नहीं रहता जिसने शुरू किया था। यह OAuth flow पर CSRF है: attacker victim को attacker-controlled authorization code से login/link पूरा करवा सकता है, चुपचाप victim के account को attacker की identity से जोड़ देता है (OAuth login CSRF / forced account linking)। severity 'varies' इस पर कि linked account क्या कर सकता है।",
    },
    find: [
      {
        title: { en: "Test for state absence / lack of session binding", simple: "Check if state is missing or not tied to your session", hi: "state की गैरमौजूदगी / session binding की कमी test करें" },
        steps: [
          { en: "Observe the authorization request: is a state value sent at all? If sent, is it unpredictable and tied to the session?", simple: "Check if a state value is sent and whether it's random and session-bound.", hi: "authorization request देखें: state value भेजा जाता है? अगर हाँ, तो unpredictable और session से tied है?" },
          { en: "Capture an attacker's authorization response (your own second account's callback), then replay/deliver it to a logged-in victim and see if the flow completes without rejecting the mismatched/absent state.", simple: "Take your own account's callback and feed it to a logged-in victim; see if it links without complaint.", hi: "attacker (अपने दूसरे account) का authorization response capture करें, फिर logged-in victim को deliver करें और देखें कि mismatched/absent state के बावजूद flow पूरा होता है या नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs proof the flow completes with a missing or non-verified state — i.e. you force your second test account's OAuth identity onto a victim session (your own), showing the link/login happened cross-site. A state value that is present AND rejected when tampered means the control works and it's N/A. Severity depends on the impact of the forced link (e.g. whether it enables takeover of victim actions).",
      simple: "Show the flow completing with no valid state, forcing your test account's login onto another session. If tampering state gets rejected, the control works and it's N/A.",
      hi: "Triage को सबूत चाहिए कि flow missing/non-verified state के साथ पूरा होता है — यानी आप अपने दूसरे test account की OAuth identity एक victim session (आपके अपने) पर force करते हैं, cross-site link/login दिखाते हैं। अगर state मौजूद है और tamper करने पर reject होता है तो control काम करता है, N/A। severity forced link के impact पर निर्भर।",
    },
    references: [
      { label: "PortSwigger: OAuth 2.0 authentication vulnerabilities", url: "https://portswigger.net/web-security/oauth" },
    ],
  },

  "Server Security Misconfiguration › Path Traversal": {
    what: {
      en: "User input flows into a filesystem path without proper canonicalisation, so '../' sequences (or encoded/absolute variants) let you escape the intended directory and read (or sometimes write) arbitrary files — /etc/passwd, source code, config with secrets, etc. Severity 'varies' with what you can reach: a config file with credentials or source code is high, a non-sensitive file is lower. The core flaw is trusting a user-controlled path segment.",
      simple: "User input is used to build a file path without cleaning it, so '../' lets an attacker break out of the intended folder and read files like /etc/passwd or config secrets. How bad it is depends on what you can read.",
      hi: "User input बिना proper canonicalisation के filesystem path में जाता है, तो '../' sequences (या encoded/absolute variants) intended directory से बाहर निकलकर arbitrary files पढ़ने (कभी लिखने) देते हैं — /etc/passwd, source code, secrets वाली config आदि। severity 'varies' इस पर कि क्या पहुँचता है: credentials वाली config/source high, non-sensitive file lower। मूल flaw user-controlled path segment पर भरोसा।",
    },
    find: [
      {
        title: { en: "Fuzz path parameters with traversal sequences", simple: "Try '../' tricks in file parameters", hi: "path parameters में traversal sequences fuzz करें" },
        steps: [
          { en: "Identify parameters that name a file/path (download=, file=, template=, lang=, image path segments).", simple: "Find parameters that point at a file (download=, file=, etc.).", hi: "file/path नाम देने वाले parameters पहचानें (download=, file=, template=, lang=)।" },
          { en: "Inject traversal payloads with encodings and bypass tricks (../, ..%2f, ....//, absolute paths, null byte on legacy stacks) targeting a known, benign file to confirm the escape.", simple: "Inject '../' variants aiming at a harmless known file to confirm you escaped the folder.", hi: "encodings और bypass tricks (../, ..%2f, ....//, absolute paths, legacy पर null byte) के साथ traversal payloads डालें, किसी known benign file को target करके escape confirm करें।" },
          { en: "Prove you reached a file outside the intended root; capture a small, non-sensitive identifying portion as evidence.", simple: "Show you read a file outside the intended folder, capturing a small safe snippet.", hi: "साबित करें कि आप intended root के बाहर की file तक पहुँचे; evidence के लिए छोटा, non-sensitive हिस्सा capture करें।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the request and the response proving you read a file outside the web root. Use a benign proof file where possible; if you reach secrets, redact them and show only enough to prove access — never exfiltrate real user data. Severity scales with the sensitivity of what's reachable and whether write/overwrite is possible. A path that stays confined to the allowed directory, or returns errors only, is N/A.",
      simple: "Show the request and a response proving you read a file outside the web root. Redact any secrets. The bug is worse if you can reach sensitive files or write. Staying inside the allowed folder = N/A.",
      hi: "Triage को request और response चाहिए जो साबित करे कि आपने web root के बाहर की file पढ़ी। हो सके तो benign proof file; secrets मिलें तो redact करें, सिर्फ़ access साबित करने भर दिखाएँ — असली user data कभी exfiltrate न करें। severity reachable चीज़ की sensitivity और write/overwrite संभव होने पर बढ़ती है। allowed directory में ही सीमित रहे तो N/A।",
    },
    references: [
      { label: "PortSwigger: Directory traversal", url: "https://portswigger.net/web-security/file-path-traversal" },
    ],
  },

  "Server Security Misconfiguration › Race Condition": {
    what: {
      en: "The server performs a check and a dependent action non-atomically, so two or more requests sent in parallel interleave in the gap (TOCTOU). This lets a limit be exceeded — redeeming a one-time coupon/gift card twice, withdrawing/transferring more than the balance, bypassing a one-per-user or quota check, or doubling an account action. Severity 'varies' with the business value of the state that gets corrupted. The flaw is the missing lock/atomicity around a check→use window.",
      simple: "The server checks something and then acts on it in two steps, so firing many requests at once can slip through the gap — like using a one-time coupon twice or withdrawing money twice. How bad it is depends on what you can double.",
      hi: "Server एक check और dependent action non-atomically करता है, तो parallel में भेजी दो+ requests gap में interleave हो जाती हैं (TOCTOU)। इससे limit पार होती है — one-time coupon/gift card दो बार, balance से ज़्यादा withdraw/transfer, one-per-user/quota check bypass, या account action double। severity 'varies' corrupt होने वाली state की business value पर। flaw check→use window के इर्दगिर्द missing lock/atomicity।",
    },
    find: [
      {
        title: { en: "Fire parallel requests at a limited action", simple: "Send many requests at once at a one-time action", hi: "limited action पर parallel requests दागें" },
        steps: [
          { en: "Pick an action with a limit/uniqueness constraint (coupon redeem, balance debit, one-per-user claim, OTP/invite use).", simple: "Pick an action that's supposed to be allowed only once or up to a limit.", hi: "limit/uniqueness वाला action चुनें (coupon redeem, balance debit, one-per-user claim, OTP/invite)।" },
          { en: "Send many copies of the same request simultaneously using single-packet / last-byte-sync techniques (e.g. Burp Repeater parallel group, Turbo Intruder) to minimise timing jitter.", simple: "Send lots of identical requests at the exact same moment (Turbo Intruder / Repeater parallel).", hi: "वही request कई copies में एक साथ भेजें, single-packet/last-byte-sync techniques (Burp parallel group, Turbo Intruder) से timing jitter कम करके।" },
          { en: "Check whether the limited action succeeded more times than allowed (e.g. balance went negative, coupon applied twice).", simple: "Check if the action went through more times than it should.", hi: "देखें कि limited action allowed से ज़्यादा बार succeed हुआ (balance negative, coupon दो बार)।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the parallel requests and the resulting inconsistent state (duplicate redemption, over-limit balance, extra entitlement) on your own test account, with the business impact spelled out. Use benign amounts and your own funds/accounts. A limit that holds under parallelism, or a 'duplicate' that the system later reconciles/rejects, is N/A. Severity tracks the value/impact of the corrupted state.",
      simple: "Show the parallel requests and the broken result (coupon used twice, balance over limit) on your own account, and say why it matters. Use your own money/accounts. If the limit holds or it's later reversed, it's N/A.",
      hi: "Triage को parallel requests और परिणामी inconsistent state (duplicate redemption, over-limit balance, extra entitlement) आपके अपने test account पर चाहिए, business impact स्पष्ट करके। benign amounts/अपने funds इस्तेमाल करें। parallelism में limit टिके या 'duplicate' बाद में reconcile/reject हो तो N/A। severity corrupt state की value पर निर्भर।",
    },
    references: [
      { label: "PortSwigger: Race conditions", url: "https://portswigger.net/web-security/race-conditions" },
    ],
  },

  "Server Security Misconfiguration › Software Package Takeover": {
    what: {
      en: "The application depends on a package/namespace that an attacker can seize and then publish malicious code into — a dependency referenced by an internal/private name that is unclaimed on the public registry (dependency confusion), an expired or deletable maintainer account/namespace, or a repo/package whose owner handle is available for re-registration. Taking it over lets the attacker inject code that the target's build or users will pull, i.e. a supply-chain compromise. Severity 'varies' with what consumes the package.",
      simple: "The app relies on a package or namespace that an attacker can claim (because it's unregistered on the public registry, or the account/owner handle is free). Once claimed, the attacker can push malicious code into the build — a supply-chain attack.",
      hi: "Application ऐसे package/namespace पर निर्भर है जिसे attacker कब्ज़ा करके malicious code publish कर सकता है — internal/private नाम से referenced dependency जो public registry पर unclaimed हो (dependency confusion), expired/deletable maintainer account/namespace, या package जिसका owner handle दोबारा register करने को उपलब्ध हो। कब्ज़ा करने पर attacker ऐसा code inject करता है जो target का build/users pull करेंगे — supply-chain compromise। severity इस पर कि package कौन consume करता है।",
    },
    find: [
      {
        title: { en: "Find unclaimed/claimable dependency names", simple: "Find package names an attacker could register", hi: "unclaimed/claimable dependency names खोजें" },
        steps: [
          { en: "Harvest dependency names from leaked package manifests, lockfiles, JS bundles, Dockerfiles or build logs (npm/PyPI/RubyGems/etc.).", simple: "Collect the package names the app uses from manifests and bundles.", hi: "leaked manifests, lockfiles, JS bundles, Dockerfiles, build logs से dependency names इकट्ठा करें।" },
          { en: "For each, check the public registry: is the exact name (or a scope/namespace) unregistered, or owned by an account/handle that is expired or re-registrable?", simple: "Check the public registry for names that are free or whose owner is gone.", hi: "हर एक के लिए public registry देखें: exact name/scope unregistered है, या owner account/handle expired/re-registrable है?" },
          { en: "Prove claimability WITHOUT publishing malware — e.g. register the name with a benign placeholder, or show the registry reports it available/owner-deleted. Confirm the target actually resolves to the public name.", simple: "Prove you could claim it (benign placeholder) and that the app would pull the public one — never publish malware.", hi: "claimability साबित करें बिना malware publish किए — benign placeholder register करें, या registry available/owner-deleted दिखाए। पुष्टि करें कि target सचमुच public name पर resolve करता है।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the dependency name, evidence it is claimable (registry shows it free / owner removed, or you registered a benign placeholder), and evidence the target would actually resolve to and install the public package (dependency-confusion precondition). Use a harmless canary that only phones home with a benign marker — never ship real malicious code. If the name is already owned by the vendor, or private resolution is pinned/scoped so the public one is never used, it's N/A.",
      simple: "Show the package name, that it's claimable, and that the app would really pull the public version. Use a harmless canary only — never real malware. If the vendor already owns it or resolution is locked down, it's N/A.",
      hi: "Triage को dependency name, claimable होने का सबूत (registry free/owner removed दिखाए, या आपने benign placeholder register किया), और सबूत कि target सचमुच public package resolve/install करेगा (dependency-confusion precondition) चाहिए। सिर्फ़ harmless canary जो benign marker से phone-home करे — असली malicious code कभी नहीं। अगर नाम पहले से vendor का है या private resolution pinned/scoped है तो N/A।",
    },
    references: [
      { label: "OWASP: Dependency Confusion", url: "https://owasp.org/www-community/attacks/Dependency_Confusion" },
    ],
  },

  "Server Security Misconfiguration › SSL Attack (BREACH, POODLE etc.)": {
    what: {
      en: "The TLS configuration is vulnerable to a named transport-layer attack: POODLE (SSLv3 CBC padding oracle), BEAST, CRIME/BREACH (compression-based plaintext recovery of secrets reflected in responses), ROBOT, or support for broken protocols/ciphers (SSLv3, export/RC4, weak DH). Exploitability is generally hard and often needs an on-path attacker plus specific conditions (e.g. BREACH needs a secret reflected alongside attacker input and HTTP compression). Severity 'varies'; many of these are hardening findings today.",
      simple: "The site's TLS/SSL setup allows a known weak-crypto attack (POODLE, BREACH, etc.) or outdated protocols/ciphers. These are usually hard to exploit and often need a man-in-the-middle, so many are just hardening issues now.",
      hi: "TLS configuration किसी named transport-layer attack के लिए vulnerable है: POODLE (SSLv3 CBC padding oracle), BEAST, CRIME/BREACH (compression से responses में reflected secrets recover), ROBOT, या broken protocols/ciphers (SSLv3, export/RC4, weak DH) का support। exploitability आमतौर पर कठिन, अक्सर on-path attacker और specific conditions चाहिए (BREACH को attacker input के साथ reflected secret और HTTP compression चाहिए)। severity 'varies'; आज कई hardening findings हैं।",
    },
    find: [
      {
        title: { en: "Scan the TLS config for the specific weakness", simple: "Scan the TLS setup for the named weakness", hi: "TLS config को specific weakness के लिए scan करें" },
        steps: [
          { en: "Run a TLS scanner (e.g. testssl.sh / sslscan) to enumerate supported protocols, ciphers and the specific named vulnerabilities it checks (POODLE, BREACH/CRIME, ROBOT, etc.).", simple: "Run a TLS scanner to list weak protocols/ciphers and named flaws.", hi: "TLS scanner (testssl.sh/sslscan) चलाकर supported protocols, ciphers और named vulnerabilities (POODLE, BREACH/CRIME, ROBOT) enumerate करें।" },
          { en: "For BREACH specifically, confirm the real preconditions: HTTP-level compression AND a secret (token) reflected in the response alongside attacker-controlled input — not just 'compression is on'.", simple: "For BREACH, confirm compression AND a secret reflected with your input, not just compression being enabled.", hi: "BREACH के लिए असली preconditions confirm करें: HTTP-level compression और response में attacker input के साथ reflected secret — सिर्फ़ 'compression on' नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the scanner output naming the exact issue plus, crucially, whether the practical preconditions hold (e.g. for BREACH a reflected secret + compression; for POODLE actual SSLv3/CBC support and a downgrade path). A scanner flag alone, with no realistic exploitation path, is typically P5 / informational and often out of scope — many programs exclude 'SSL/TLS best-practice' reports. State honestly whether real exploitation is feasible.",
      simple: "Show the scanner naming the flaw and whether it's actually exploitable (right preconditions). A scanner flag with no real attack path is usually informational and often out of scope.",
      hi: "Triage को scanner output चाहिए जो exact issue नाम दे, और सबसे ज़रूरी — practical preconditions पूरी होती हैं या नहीं (BREACH के लिए reflected secret + compression; POODLE के लिए SSLv3/CBC support और downgrade path)। अकेला scanner flag बिना realistic exploitation आमतौर पर P5/informational और अक्सर out of scope — कई programs 'SSL/TLS best-practice' reports exclude करते हैं। ईमानदारी से बताएँ exploitation feasible है या नहीं।",
    },
    references: [
      { label: "testssl.sh", url: "https://testssl.sh/" },
    ],
  },
};
