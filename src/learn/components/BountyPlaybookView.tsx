import { useState, useMemo } from "react";
import {
  Target,
  Zap,
  Check,
  Copy,
  Terminal,
  ArrowRight,
  Sparkles,
  FileText,
  Coins,
  ShieldCheck,
  RefreshCw,
  Globe,
  Radio,
  AlertTriangle,
  Ban,
  ShieldAlert,
  XCircle,
  Calculator,
  Link2,
  Shield,
  Brain,
  Flame,
  Code,
  Bot,
  GitBranch,
  FlaskConical,
  Binary,
  CreditCard,
} from "lucide-react";
import { LEARN_LANGS, type Lang, localize } from "@/learn/data/types";
import {
  VULN_CHAINS,
  WAF_BYPASS_DATA,
  RECON_ONE_LINERS,
  MINDSET_RULES,
  AUTOMATION_HELPERS,
  REPORT_TEMPLATES,
  ATTACK_DECISION_TREES,
  HIGH_YIELD_PAYLOADS,
  P3_P4_TECHNIQUES,
} from "@/learn/data/playbookData";
import { FintechPlaybookView } from "@/learn/components/FintechPlaybookView";

interface BountyPlaybookProps {
  onPractice?: (categoryId: string) => void;
  defaultTab?:
    | "targets"
    | "calculator"
    | "bugs"
    | "volume"
    | "trees"
    | "chaining"
    | "waf"
    | "payloads"
    | "oneliners"
    | "automation"
    | "routine"
    | "donts"
    | "template"
    | "fintech";
}

const LANG_KEY = "learn.lang";
function loadLang(): Lang {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v === "en" || v === "simple" || v === "hi") return v;
  } catch {
    /* ignore */
  }
  return "en";
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          },
          () => {},
        );
      }}
      className="inline-flex items-center gap-1 shrink-0 rounded px-2 py-1 text-[11px] font-mono text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition"
      title="Copy to clipboard"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

export function BountyPlaybookView({ onPractice, defaultTab }: BountyPlaybookProps) {
  const [lang, setLangState] = useState<Lang>(loadLang);
  const [activeTab, setActiveTab] = useState<
    "targets" | "calculator" | "bugs" | "volume" | "trees" | "chaining" | "waf" | "payloads" | "oneliners" | "automation" | "routine" | "donts" | "template" | "fintech"
  >(defaultTab || "targets");
  const [activeBug, setActiveBug] = useState<number>(0);
  const [activeChain, setActiveChain] = useState<number>(0);
  const [activeTree, setActiveTree] = useState<number>(0);
  const [activeReportTemplate, setActiveReportTemplate] = useState<number>(0);
  const [volumeFilter, setVolumeFilter] = useState<string>("all");
  const [wafCat, setWafCat] = useState<string>("all");
  const [reconCat, setReconCat] = useState<string>("all");
  const [automationCat, setAutomationCat] = useState<string>("all");
  const [payloadCat, setPayloadCat] = useState<string>("all");
  const [encoderInput, setEncoderInput] = useState<string>("admin' OR 1=1-- #");

  // Target ROI Calculator state
  const [calcScope, setCalcScope] = useState<"wildcard_api" | "wildcard_web" | "single_domain" | "strict_url">("wildcard_api");
  const [calcBounty, setCalcBounty] = useState<"p1_5k_plus" | "p1_2k_5k" | "p1_sub_2k" | "vdp_swag">("p1_5k_plus");
  const [calcTriage, setCalcTriage] = useState<"fast_24h" | "medium_week" | "slow_month" | "painful_delayed">("fast_24h");
  const [calcAge, setCalcAge] = useState<"new_7days" | "updated_month" | "mature_year" | "saturated_5yr">("new_7days");
  const [calcMobile, setCalcMobile] = useState<boolean>(true);

  // Dynamic Viability Score calculation (0 - 100)
  const calcScore = useMemo(() => {
    let score = 0;
    if (calcScope === "wildcard_api") score += 32;
    else if (calcScope === "wildcard_web") score += 24;
    else if (calcScope === "single_domain") score += 12;
    else if (calcScope === "strict_url") score -= 5;

    if (calcBounty === "p1_5k_plus") score += 25;
    else if (calcBounty === "p1_2k_5k") score += 18;
    else if (calcBounty === "p1_sub_2k") score += 10;
    else if (calcBounty === "vdp_swag") score += 12;

    if (calcTriage === "fast_24h") score += 23;
    else if (calcTriage === "medium_week") score += 14;
    else if (calcTriage === "slow_month") score += 4;
    else if (calcTriage === "painful_delayed") score -= 15;

    if (calcAge === "new_7days") score += 20;
    else if (calcAge === "updated_month") score += 12;
    else if (calcAge === "mature_year") score += 4;
    else if (calcAge === "saturated_5yr") score -= 10;

    if (calcMobile) score += 10;

    return Math.max(10, Math.min(100, score));
  }, [calcScope, calcBounty, calcTriage, calcAge, calcMobile]);

  // Live Payload Encodings Calculator
  const encodings = useMemo(() => {
    const raw = encoderInput || "";
    let urlEnc = "";
    let doubleUrlEnc = "";
    let base64Enc = "";
    let hexEnc = "";
    let htmlEnc = "";
    let unicodeEnc = "";

    try {
      urlEnc = encodeURIComponent(raw);
    } catch {
      urlEnc = raw;
    }

    try {
      doubleUrlEnc = encodeURIComponent(encodeURIComponent(raw));
    } catch {
      doubleUrlEnc = raw;
    }

    try {
      base64Enc = btoa(unescape(encodeURIComponent(raw)));
    } catch {
      base64Enc = "Encoding error";
    }

    try {
      hexEnc = Array.from(raw)
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0").toUpperCase())
        .join("");
    } catch {
      hexEnc = raw;
    }

    try {
      htmlEnc = Array.from(raw)
        .map((c) => `&#${c.charCodeAt(0)};`)
        .join("");
    } catch {
      htmlEnc = raw;
    }

    try {
      unicodeEnc = Array.from(raw)
        .map((c) => {
          const code = c.charCodeAt(0);
          return code >= 33 && code <= 126 ? String.fromCharCode(code + 65248) : c;
        })
        .join("");
    } catch {
      unicodeEnc = raw;
    }

    return {
      urlEnc,
      doubleUrlEnc,
      base64Enc,
      hexEnc,
      htmlEnc,
      unicodeEnc,
    };
  }, [encoderInput]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
  };

  // Translations dictionary for Playbook
  const t = {
    title: {
      en: "High-Yield Bounty Playbook & Target Selection",
      simple: "How to Find Bugs & Pick the Best Targets",
      hi: "हाई-यील्ड बाउंटी प्लेबुक और टारगेट सिलेक्शन",
    }[lang],
    subtitle: {
      en: "Field-tested strategies for maximum hit rate: how to avoid duplicates, hunt the 6 most common vulnerabilities, and secure high-tier payouts.",
      simple: "Simple rules to avoid duplicates, find the 6 most common bugs, and get paid faster.",
      hi: "अधिकतम हिट-रेट के लिए फील्ड-टेस्टेड रणनीति: डुप्लीकेट से कैसे बचें, सबसे कॉमन 6 बग्स कैसे ढूंढें और P1/P2 पेआउट्स कैसे पाएं।",
    }[lang],
    tabTargets: {
      en: "🎯 Target Strategy",
      simple: "🎯 Pick Targets",
      hi: "🎯 टारगेट रणनीति",
    }[lang],
    tabCalculator: {
      en: "📊 Target ROI Calculator",
      simple: "📊 Target Score Tool",
      hi: "📊 टारगेट ROI कैलकुलेटर",
    }[lang],
    tabBugs: {
      en: "🔥 Top 6 Most Common Bugs",
      simple: "🔥 6 Easiest Paid Bugs",
      hi: "🔥 टॉप 6 सबसे आम बग्स",
    }[lang],
    tabVolume: {
      en: "🎯 P3 & P4 Volume Strategy",
      simple: "🎯 Easy Volume Bugs",
      hi: "🎯 P3 व P4 वॉल्यूम रणनीति",
    }[lang],
    tabTrees: {
      en: "🌿 Attack Decision Trees",
      simple: "🌿 Feature Mindmaps",
      hi: "🌿 अटैक डिसीजन ट्रीज़",
    }[lang],
    tabChaining: {
      en: "🔗 Vulnerability Chaining",
      simple: "🔗 Turn Small Bugs to Big Payouts",
      hi: "🔗 वल्नरेबिलिटी चेनिंग (P1 Multiplier)",
    }[lang],
    tabWaf: {
      en: "🛡️ WAF & 403 Bypasses",
      simple: "🛡️ Bypass Blocked Pages",
      hi: "🛡️ WAF व 403 बाईपास गाइड",
    }[lang],
    tabPayloads: {
      en: "🧪 Payloads & Live Encoder",
      simple: "🧪 Payloads & Encoder",
      hi: "🧪 पेलोड्स और लाइव एनकोडर",
    }[lang],
    tabOneLiners: {
      en: "⚡ Recon One-Liners",
      simple: "⚡ Copy Commands",
      hi: "⚡ रिकॉन वन-लाइनर्स",
    }[lang],
    tabAutomation: {
      en: "🤖 Automation Scripts",
      simple: "🤖 Automation Tools",
      hi: "🤖 ऑटोमेशन स्क्रिप्ट्स",
    }[lang],
    tabRoutine: {
      en: "🧠 Daily Routine & Mindset",
      simple: "🧠 Daily Plan & Mindset",
      hi: "🧠 डेली रूटीन और हंटर माइंडसेट",
    }[lang],
    tabDonts: {
      en: "🚫 What NOT To Do",
      simple: "🚫 What NOT To Do",
      hi: "🚫 क्या नहीं करना है",
    }[lang],
    tabTemplate: {
      en: "📋 Reports & Escalators",
      simple: "📋 Reports & Escalators",
      hi: "📋 रिपोर्ट टेम्पलेट्स व एस्केलेटर गाइड",
    }[lang],
    tabFintech: {
      en: "🏦 Fintech",
      simple: "🏦 Fintech",
      hi: "🏦 फिनटेक",
    }[lang],
  };

  const topBugs = [
    {
      id: "idor",
      title: "1. IDOR & Broken Access Control (BOLA)",
      category: "Broken Access Control",
      payout: "$1,500 – $7,500 (P1/P2)",
      emoji: "🔑",
      whyCommon: {
        en: "Developers enforce UI-level visibility but frequently forget server-side ownership checks on multi-tenant REST & GraphQL endpoints.",
        simple: "Websites hide buttons from normal users, but forget to verify on the server if the user really owns the requested record.",
        hi: "डेवलपर्स UI पर बटन छुपा देते हैं, लेकिन बैकएंड API पर यह चेक करना भूल जाते हैं कि क्या यह ID वाकई रिक्वेस्ट भेजने वाले यूज़र की है।",
      }[lang],
      huntingMethod: {
        en: "1. Create two accounts: User A (Attacker) and User B (Victim).\n2. Load User B's auth cookies into Burp Autorize.\n3. Browse all features as User A in browser. Any green indicator in Autorize on POST/PUT/DELETE is an instant critical IDOR.\n4. Escalate GET (read-only) to PUT/PATCH/DELETE to modify or destroy foreign records.",
        simple: "1. Make Account A and Account B.\n2. Put Account B's cookies into Burp Autorize tool.\n3. Click around Account A. Green rows mean Account B can illegally execute Account A's actions.\n4. Test PUT or DELETE to edit or erase victim data for maximum reward.",
        hi: "1. दो अकाउंट्स बनाएं: User A और User B।\n2. Burp Autorize में User B की cookies डालें।\n3. Browser में User A से सारे actions perform करें। Autorize में green rows सीधे IDOR साबित करती हैं।\n4. सिर्फ GET read पर न रुकें — PUT/DELETE भेजकर victim का data modify या delete साबित करें।",
      }[lang],
      tools: ["Burp Suite (Autorize)", "ffuf", "Burp Compare Responses"],
      command: "ffuf -u 'https://target.com/api/v1/user/FUZZ/invoice' -w ids.txt -H 'Authorization: Bearer <TOKEN_A>' -fs <BASELINE>",
      proTip: {
        en: "If the target uses unguessable UUIDs, do NOT report right away. Chain it by finding an endpoint leaking victim UUIDs (e.g. public reviews, mentions, or comments API). UUID Leak + IDOR = Instant P1 Account Takeover.",
        simple: "If IDs are long random codes, find where the website shows other users' codes. Chaining the leak with IDOR guarantees approval.",
        hi: "अगर IDs random UUID हैं, तो पहले ढूंढें कि victim का UUID कहाँ leak हो रहा है (public profile, comments API)। UUID Leak + IDOR = 100% P1 Account Takeover।",
      }[lang],
      checklistCat: "web-idor",
    },
    {
      id: "logic-race",
      title: "2. Business Logic Flaws & Race Conditions",
      category: "Business Logic",
      payout: "$2,000 – $10,000 (P1/P2)",
      emoji: "⚡",
      whyCommon: {
        en: "Automated vulnerability scanners (like Nessus or Qualys) cannot understand business context or timing windows. Zero automated scanner competition.",
        simple: "Automated scanners cannot understand money, discounts, or inventory rules. Only humans can find these bugs.",
        hi: "ऑटोमेटेड स्कैनर्स बिज़नेस लॉजिक और टाइमिंग नहीं समझ सकते। यहाँ ऑटोमेशन का कोई कॉम्पिटिशन नहीं होता, इसलिए डुप्लीकेट शून्य होते हैं।",
      }[lang],
      huntingMethod: {
        en: "1. Identify state-changing financial transactions: coupon redemption, gift cards, credit transfers, or checkout cart quantity.\n2. Test negative values: e.g. quantity: -1 or price: -50.\n3. Send request to Burp Repeater -> create a group of 20 identical requests -> select 'Send group in parallel (single-packet attack over HTTP/2)'.\n4. Observe if a $10 coupon gets redeemed 5 times simultaneously ($50 discount).",
        simple: "1. Find coupon codes or balance transfers.\n2. Try negative numbers (like -1 items in shopping cart).\n3. In Burp Repeater, put 20 coupon requests into a group and send them all at the exact same millisecond.\n4. Check if you got multiple discounts from 1 coupon.",
        hi: "1. कूपन कोड्स, बैलेंस ट्रांसफर या कार्ट चेकआउट चुनें।\n2. Negative numbers test करें (quantity: -1)।\n3. Burp Repeater में 20 identical requests का group बनाएं और 'Send group in parallel' (single-packet attack) चलाएं।\n4. Check करें कि क्या एक कूपन 5 बार रिडीम होकर multiple balance देता है।",
      }[lang],
      tools: ["Turbo Intruder (race.py)", "Burp Suite Repeater (Parallel Group)", "Postman Runner"],
      command: "Burp Repeater -> Tab Group -> 'Send group in parallel (single-packet attack)'",
      proTip: {
        en: "Take a screenshot of your balance before and after the attack showing matching microsecond timestamps. Proving multiple cash or voucher benefits locks in top P1 payouts.",
        simple: "Take screenshots before and after showing that your balance changed twice at the exact same microsecond.",
        hi: "Attack से पहले और बाद का balance screenshot लगाएं जिसमें same microsecond पर double redemption दिख रही हो। यह P1 bounty lock कर देता है।",
      }[lang],
      checklistCat: "web-race-conditions",
    },
    {
      id: "oauth-ato",
      title: "3. OAuth Misconfiguration & Pre-Account Linking ATO",
      category: "Broken Authentication",
      payout: "$3,000 – $15,000 (P1 Critical)",
      emoji: "🛡️",
      whyCommon: {
        en: "Integrating 'Sign in with Google/Apple' requires strict redirect_uri matching and state verification that developers frequently overlook.",
        simple: "Adding 'Sign in with Google' is tricky, and developers often forget to verify login codes or link accounts safely.",
        hi: "Google/Apple सोशल लॉगिन जोड़ते समय डेवलपर्स redirect_uri वैलिडेशन और ईमेल वेरिफिकेशन सही से चेक करना भूल जाते हैं।",
      }[lang],
      huntingMethod: {
        en: "1. redirect_uri Tampering: Modify `redirect_uri=https://target.com.attacker.com` or `https://target.com/oauth/callback/../../attacker`. Capture authorization code on your external server.\n2. Pre-Account Linking: Register an unverified account with victim's email. Then 'Log in with Google' using that email. If target links the accounts without asking for password, you hijack the victim's profile.\n3. Missing State Parameter: Test CSRF on OAuth callback to force victim to link attacker's social account.",
        simple: "1. Change redirect_uri to your own site and see if the login code gets sent to you.\n2. Sign up with victim's email, then log in with Google to see if it lets you take over their account without a password.",
        hi: "1. redirect_uri में attacker domain डालें (`target.com.attacker.com`) और authorization code capture करें।\n2. Victim के ईमेल से साधारण अकाउंट बनाएं, फिर उसी ईमेल से 'Login with Google' करें। अगर बिना पासवर्ड अकाउंट लिंक हो जाए, तो Account Takeover कन्फर्म है।",
      }[lang],
      tools: ["Burp Suite Repeater", "interactsh-client", "Burp JWT Editor"],
      command: "GET /oauth/authorize?client_id=XYZ&redirect_uri=https://target.com.attacker.com&response_type=code",
      proTip: {
        en: "Title your report: '[P1] One-Click Full Account Takeover via OAuth redirect_uri Pre-Account Linking'. Triage teams treat Account Takeover as highest priority.",
        simple: "Always put 'Full Account Takeover' in your report title so the team reviews it immediately.",
        hi: "Report title में 'Full Account Takeover' लिखें: '[P1] One-Click Account Takeover via OAuth' — triage इसे तुरंत सबसे पहले रिव्यू करेगी।",
      }[lang],
      checklistCat: "web-oauth",
    },
    {
      id: "js-leaks",
      title: "4. Sensitive Data Exposure via Client-Side JS & Git",
      category: "Information Disclosure",
      payout: "$500 – $5,000 (P2/P3)",
      emoji: "📦",
      whyCommon: {
        en: "Modern Single Page Apps (React/Vue/Next.js) bundle thousands of lines of code. Internal staging URLs, developer comments, and admin routes leak in plain view.",
        simple: "React and Vue apps download huge script files to your browser, often including secret API keys and hidden admin links.",
        hi: "React और Angular ऐप्स प्रोडक्शन में बड़े JS फाइल्स भेजते हैं, जिनमें कई बार इंटरनल API एंडपॉइंट्स, स्टैगिंग डोमेन्स और प्राइवेट टोकन्स छूट जाते हैं।",
      }[lang],
      huntingMethod: {
        en: "1. Scrape all JavaScript files with Katana: `katana -u https://target.com -jc | grep '\\.js$'`.\n2. Extract hidden API endpoints using LinkFinder or SecretFinder.\n3. Check for unauthenticated administrative endpoints (e.g. `/api/v2/admin/export-users`). 40% of hidden routes lack authentication checks.\n4. Scan downloaded assets with TruffleHog for leaked AWS, Stripe, Slack, or database tokens.",
        simple: "1. Download all JavaScript files from the website.\n2. Use LinkFinder to find hidden URLs.\n3. Open those hidden links in your browser to see if you can access admin pages without logging in.",
        hi: "1. Katana से टारगेट के सारे `.js` फाइल्स निकालें।\n2. LinkFinder से छिपे हुए API endpoints extract करें।\n3. Hidden admin endpoints (जैसे `/api/admin/users`) ब्राउज़र में खोलें — कई बार इनपर कोई ऑथेंटिकेशन नहीं होता।\n4. TruffleHog से leaked AWS/Stripe keys grep करें।",
      }[lang],
      tools: ["Katana", "LinkFinder", "TruffleHog", "git-dumper"],
      command: "katana -u https://target.com -jc -d 3 | grep '\\.js$' | while read u; do python3 linkfinder.py -i $u -o cli; done",
      proTip: {
        en: "Mask leaked keys in your report (e.g. `AKIA...3XYZ`). Demonstrate live validity non-destructively (e.g. `aws sts get-caller-identity`). Never download private customer tables.",
        simple: "Show the first and last few letters of the key. Prove it works without downloading private data.",
        hi: "Report में secret को mask करें (`AKIA...3XYZ`) और सिर्फ `aws sts get-caller-identity` से live permissions साबित करें। Customer data कभी डाउनलोड न करें।",
      }[lang],
      checklistCat: "web-info-disclosure",
    },
    {
      id: "ssrf-exporters",
      title: "5. SSRF via Document Converters & Webhooks",
      category: "Server-Side Injection",
      payout: "$3,000 – $20,000 (P1/P2)",
      emoji: "📡",
      whyCommon: {
        en: "Features that fetch external URLs (PDF receipt generators, link preview bots, avatar import from URL) force the backend server to make outbound network calls.",
        simple: "When a website downloads a picture from your link or creates a PDF receipt, its backend server makes the request.",
        hi: "जब वेबसाइट आपकी URL से इनवॉइस PDF बनाती है, लिंक प्रीव्यू दिखाती है या अवतार डाउनलोड करती है, तो उसका बैकएंड सर्वर खुद रिक्वेस्ट भेजता है।",
      }[lang],
      huntingMethod: {
        en: "1. Start `interactsh-client -v` to get a dedicated collaborator domain.\n2. Inject collaborator URL into PDF export, webhook settings, or URL import inputs.\n3. Receive DNS/HTTP interaction confirming the backend server made the request.\n4. Escalate to cloud metadata: test `http://169.254.169.254/latest/meta-data/iam/security-credentials/` to pull cloud IAM role tokens.",
        simple: "1. Start interactsh to get a temporary test web address.\n2. Put that address into PDF generators or webhook fields.\n3. If the server pings your address, try reading the cloud metadata at 169.254.169.254 to get a top payout.",
        hi: "1. `interactsh-client -v` से यूनिक डोमेन लें।\n2. PDF export या webhook में interactsh URL डालें।\n3. Server IP से आने वाला callback capture करें।\n4. Cloud metadata (`http://169.254.169.254/latest/meta-data/`) एक्सेस करके IAM credentials निकालें (P1 Critical)।",
      }[lang],
      tools: ["interactsh-client", "Gopherus", "SSRFmap", "Burp Collaborator"],
      command: "interactsh-client -v -json",
      proTip: {
        en: "If `169.254.169.254` is blocked by regex, use bypasses: decimal IP `http://2852039166`, hex `http://0xa9fea9fe`, or setup a 302 redirect on your own server pointing to the metadata address.",
        simple: "If the metadata address is blocked, use a redirect from your own server to slip past the filter.",
        hi: "अगर `169.254.169.254` blocked हो, तो अपने सर्वर से `302 redirect` लगाएं या decimal IP (`http://2852039166`) यूज़ करें।",
      }[lang],
      checklistCat: "web-ssrf",
    },
    {
      id: "subdomain-takeover",
      title: "6. Subdomain Takeover on Orphaned Cloud Assets",
      category: "Server Security Misconfiguration",
      payout: "$1,000 – $4,000 (P2/P3)",
      emoji: "🌐",
      whyCommon: {
        en: "Companies point CNAME records to cloud providers (AWS S3, GitHub Pages, Heroku, Zendesk) and later delete the cloud bucket/instance while forgetting to remove the DNS record.",
        simple: "Companies point domains to cloud services like S3 or GitHub, then delete the service and forget to update their domain settings.",
        hi: "कंपनियां सबडोमेन को AWS S3 या GitHub Pages पर CNAME पॉइंट करती हैं, लेकिन बाद में क्लाउड सर्विस डिलीट कर देती हैं और DNS CNAME हटाना भूल जाती हैं।",
      }[lang],
      huntingMethod: {
        en: "1. Discover all subdomains passively using subfinder: `subfinder -d target.com -all -silent`.\n2. Resolve CNAME records using dnsx: `dnsx -cname -resp`.\n3. Scan with subzy: `subzy run --targets cnames.txt --verify_ssl`.\n4. When you see fingerprints like 'NoSuchBucket' or 'There isn't a GitHub Pages site here', register the bucket/page under your own free cloud account.",
        simple: "1. Find all subdomains with subfinder.\n2. Check which ones point to deleted cloud services with subzy.\n3. Claim the unclaimed bucket or page to take over the subdomain safely.",
        hi: "1. `subfinder` से सारे सबडोमेन्स निकालें।\n2. `dnsx` से CNAMEs फ़िल्टर करें।\n3. `subzy` चलाकर 'NoSuchBucket' या 'GitHub Pages site not found' वाले dangling CNAMEs ढूंढें।\n4. अपनी क्लाउड सर्विस से उस बकेट या पेज को क्लेम करें।",
      }[lang],
      tools: ["subzy", "subfinder", "nuclei (takeovers)", "can-i-take-over-xyz"],
      command: "subfinder -d target.com -silent | subzy run --concurrency 50",
      proTip: {
        en: "Host ONLY a simple text file (`poc.txt` with your bug bounty handle and 'Security Research PoC'). Never host company logos or fake login pages. Demonstrate CSP bypass or cookie scoped to `.target.com`.",
        simple: "Put only a plain text file with your username. Never put fake login forms.",
        hi: "सबडोमेन पर सिर्फ सादा `poc.txt` रखें जिसमें आपका यूज़रनेम लिखा हो। कभी भी कंपनी का लोगो या फ़ेक लॉगिन पेज न लगाएं।",
      }[lang],
      checklistCat: "web-subdomain-takeover",
    },
  ];

  const dontsCategories = [
    {
      id: "legal-bans",
      icon: ShieldAlert,
      badge: {
        en: "CRITICAL · BAN RISK",
        simple: "DANGER · ACCOUNT BAN",
        hi: "खतरा · लीगल और अकाउंट बैन",
      }[lang],
      badgeColor: "border-rose-500/40 bg-rose-950/40 text-rose-300",
      title: {
        en: "1. Legal Violations & Account Ban Traps",
        simple: "1. Things That Get You Banned or Sued",
        hi: "1. कानूनी खतरे और अकाउंट बैन करने वाली गलतियां",
      }[lang],
      intro: {
        en: "Violating any of these rules destroys legal Safe Harbor protections and results in an immediate, permanent platform ban, alongside potential criminal liability under CFAA / IT Act.",
        simple: "Never do these things or your account will be permanently banned and police could get involved.",
        hi: "इन नियमों को तोड़ा तो आपका बाउंटी अकाउंट हमेशा के लिए सस्पेंड हो जाएगा और IT Act/CFAA के तहत कानूनी केस हो सकता है।",
      }[lang],
      items: [
        {
          what: {
            en: "Testing Out-of-Scope Assets or 3rd-Party Vendors",
            simple: "Attacking Websites Not in Scope",
            hi: "स्कोप से बाहर या थर्ड-पार्टी वेंडर्स पर टेस्टिंग करना",
          }[lang],
          never: {
            en: "NEVER run attacks on third-party services like target.zendesk.com, target.shopify.com, or AWS/Stripe infrastructure unless explicitly stated in the in-scope policy.",
            simple: "Do NOT attack support or store services run by other companies.",
            hi: "कभी भी `zendesk`, `shopify`, `stripe` या स्कोप में न लिखे हुए सबडोमेन्स पर हमला न करें। सिर्फ वही टेस्ट करें जो 'In-Scope' टेबल में है।",
          }[lang],
          correct: {
            en: "Check the program's 'Scope' table. Look for explicit wildcards or specific subdomains. If in doubt, ask program support before testing.",
            simple: "Read the scope list carefully before starting any scan.",
            hi: "हमेशा प्रोग्राम की 'Scope' टेबल पहले पढ़ें। अगर ज़रा सा भी संशय हो तो प्रोग्राम सपोर्ट से पूछें।",
          }[lang],
        },
        {
          what: {
            en: "Dumping Real Customer Data (Mass Exfiltration)",
            simple: "Stealing Real Users' Private Information",
            hi: "असली यूज़र्स का डेटा बल्क में डाउनलोड/डंप करना",
          }[lang],
          never: {
            en: "NEVER dump 5,000 credit cards, patient medical records, or user emails to 'prove impact'. Viewing 1 record of your own test account is security research; downloading 10,000 records is a felony.",
            simple: "Do NOT download lots of customer files to prove a bug. That is illegal.",
            hi: "IDOR साबित करने के लिए 10,000 लोगों का प्राइवेट डेटा या क्रेडिट कार्ड कभी डाउनलोड न करें। 1 रिकॉर्ड अपने टेस्ट अकाउंट का देखना रिसर्च है, 10,000 डाउनलोड करना जुर्म है।",
          }[lang],
          correct: {
            en: "Stop at the very first record. Mask all PII (e.g. `jo****@example.com`). Test strictly between two accounts that YOU own (User A attacking User B).",
            simple: "Test only between two accounts you made yourself. Blur all private names and numbers.",
            hi: "सिर्फ अपने बनाए हुए 2 टेस्ट अकाउंट्स (User A और User B) के बीच टेस्ट करें और स्क्रीनशॉट में सेंसिटिव डेटा मास्क करें।",
          }[lang],
        },
        {
          what: {
            en: "Aggressive Automated Denial of Service (High Fuzzing)",
            simple: "Flooding the Server Until It Crashes",
            hi: "हाई-थ्रेड ऑटोमेटेड अटैक चलाकर सर्वर क्रैश करना (DoS)",
          }[lang],
          never: {
            en: "NEVER run tools like ffuf, dirsearch, or sqlmap with 200+ concurrent threads. Crashing production servers, taking down payment gateways, or exhausting cloud budgets violates safe harbor.",
            simple: "Do NOT send thousands of requests per second. It crashes the site.",
            hi: "ffuf, gobuster या sqlmap को 200-500 threads पर न चलाएं। सर्वर डाउन होना या पेमेंट गेटवे चोक होना प्रोग्राम गाइडलाइन्स का उल्लंघन है। WAF आपका IP भी ब्लॉक कर देगा।",
          }[lang],
          correct: {
            en: "Throttle requests: limit tools to 5–15 requests/second (`ffuf -rate 10`). Add a custom header like `-H 'X-Bug-Bounty: your-username'` if required by the target policy.",
            simple: "Slow down your tools to 5 to 10 requests per second.",
            hi: "टूल्स में रेट लिमिट सेट करें (`ffuf -rate 10`) और प्रोग्राम पॉलिसी के अनुसार अपना कस्टम हेडर लगाएं।",
          }[lang],
        },
        {
          what: {
            en: "Destructive Testing on Production (Deleting Live Data)",
            simple: "Deleting Things You Don't Own",
            hi: "प्रोडक्शन पर डेटा डिलीट करना या अकाउंट्स लॉक करना",
          }[lang],
          never: {
            en: "NEVER trigger actions that delete production inventory, lock out legitimate users, or place unpaid fraudulent orders on live platforms.",
            simple: "Do NOT delete real store items or block real people from logging in.",
            hi: "असली ग्राहकों के अकाउंट्स का पासवर्ड रीसेट ट्रिगर करके उन्हें लॉक न करें और न ही लाइव ऑर्डर्स या डेटाबेस रिकॉर्ड्स डिलीट करें।",
          }[lang],
          correct: {
            en: "Perform read-only proof or use staging environments (`dev.target.com`). In reports, explain theoretical impact without executing destructive calls.",
            simple: "Prove the bug safely without breaking anything.",
            hi: "सिर्फ रीड-ओनली प्रूफ दें या स्टेजिंग एनवायरनमेंट पर टेस्ट करें। रिपोर्ट में थ्योरीटिकल डिस्ट्रक्टिव इम्पैक्ट समझाएं।",
          }[lang],
        },
      ],
    },
    {
      id: "na-waste",
      icon: Ban,
      badge: {
        en: "0 BOUNTY · TIME WASTERS",
        simple: "NO MONEY · TIME WASTED",
        hi: "0 रुपये · समय बर्बाद करने वाले इश्यूज",
      }[lang],
      badgeColor: "border-amber-500/40 bg-amber-950/40 text-amber-300",
      title: {
        en: "2. Common 0-Bounty & N/A Issues to NEVER Report",
        simple: "2. Bugs That Will NOT Get You Paid (N/A / Informative)",
        hi: "2. वे इश्यूज जिन्हें कभी रिपोर्ट न करें (100% N/A या डुप्लीकेट)",
      }[lang],
      intro: {
        en: "Triagers close these in 10 seconds as 'Informative' or 'Not Applicable'. Submitting them drops your platform reputation score and blocks you from getting private invites.",
        simple: "Security teams will reject these immediately without paying any bounty.",
        hi: "ट्राइएजर्स इन रिपोर्ट्स को 10 सेकंड में N/A या Informative बंद कर देते हैं। इससे आपका रेपुटेशन स्कोर गिरता है और नए इनवाइट्स बंद हो जाते हैं:",
      }[lang],
      items: [
        {
          what: {
            en: "Missing Security Headers (HSTS, CSP, X-Frame-Options)",
            simple: "Missing Security Headers",
            hi: "मिसिंग सिक्योरिटी हेडर्स (HSTS, CSP, X-Frame-Options)",
          }[lang],
          never: {
            en: "Do NOT report missing X-Frame-Options, CSP, or HSTS on marketing sites or public pages. 99% of programs explicitly classify this as Out-of-Scope.",
            simple: "Do not report missing headers like X-Frame-Options or CSP on normal pages.",
            hi: "बिना किसी एक्सप्लॉइट के सिर्फ 'HSTS या X-Frame-Options missing है' रिपोर्ट न करें — 99% प्रोग्राम्स में यह आउट-ऑफ-स्कोप होता है।",
          }[lang],
          correct: {
            en: "Only report Clickjacking if you can demonstrate a sensitive state-changing action in the iframe (e.g., 1-click Transfer Funds or 1-click Delete Account).",
            simple: "Only report if you can trick a user into deleting their account in one click.",
            hi: "सिर्फ तभी रिपोर्ट करें जब आप iframe में कोई संवेदनशील एक्शन (जैसे One-Click Transfer या Account Delete) साबित कर सकें।",
          }[lang],
        },
        {
          what: {
            en: "Self-XSS Without CSRF or Delivery Chain",
            simple: "Self-XSS (Alert Popup Only for Yourself)",
            hi: "सेल्फ-XSS (सिर्फ खुद के ब्राउज़र में alert() आना)",
          }[lang],
          never: {
            en: "Do NOT report XSS that only executes when you type payloads into your own user profile or browser console. If an attacker cannot deliver it to a victim, it is not a bug.",
            simple: "Do not report XSS if only you see the alert popup on your own account.",
            hi: "अगर XSS सिर्फ आपके अपने प्रोफ़ाइल में या कंसोल में दिख रहा है और किसी दूसरे विक्टिम को भेजा नहीं जा सकता, तो यह 0 वैल्यू है।",
          }[lang],
          correct: {
            en: "Chain Self-XSS with CSRF or Response Manipulation to show a victim can be infected with 1 click.",
            simple: "Chain it with another bug so a victim gets attacked when opening a link.",
            hi: "सेल्फ-XSS को CSRF या किसी लिंक के साथ चेन करें ताकि विक्टिम के क्लिक करते ही पेलोड चले।",
          }[lang],
        },
        {
          what: {
            en: "Missing SPF / DMARC / DKIM Records",
            simple: "Missing Email SPF / DMARC Records",
            hi: "सबडोमेन्स पर मिसिंग SPF / DMARC / DKIM रिकॉर्ड्स",
          }[lang],
          never: {
            en: "Do NOT report missing SPF/DMARC on subdomains (e.g. `dev.target.com`) or claim 'Email Spoofing is possible'. Almost all programs mark this Informative.",
            simple: "Do not report email spoofing because of missing SPF records.",
            hi: "सबडोमेन्स पर SPF/DMARC न होने पर 'Email Spoofing possible' की रिपोर्ट न भेजें — यह सीधे Informative बंद होती है।",
          }[lang],
          correct: {
            en: "Focus on actual email verification logic bypasses (e.g. logging in without verifying email, or account takeover via unverified email change).",
            simple: "Look for account takeovers where you can sign up with someone else's email.",
            hi: "ईमेल वेरिफिकेशन बाईपास या अनवेरिफाइड ईमेल से अकाउंट टेकओवर ढूंढें — उसपर $1,000+ मिलते हैं।",
          }[lang],
        },
        {
          what: {
            en: "Host Header Injection Without Demonstrable Exploit Chain",
            simple: "Host Header Injection With No Real Impact",
            hi: "होस्ट हेडर इंजेक्शन बिना किसी वास्तविक इम्पैक्ट के",
          }[lang],
          never: {
            en: "Do NOT submit a report just because changing `Host: evil.com` reflects `evil.com` in a 301 redirect or error page. Without a victim exploit, it has zero impact.",
            simple: "Do not report host header reflection unless you can steal password reset tokens.",
            hi: "सिर्फ Host हेडर बदलने पर `evil.com` रिफ्लेक्ट होने पर रिपोर्ट न डालें। जब तक पासवर्ड रीसेट लिंक या वेब कैश पॉइज़निंग साबित न हो, कोई रिवॉर्ड नहीं मिलता।",
          }[lang],
          correct: {
            en: "Chain it: prove that triggering password reset sends an email containing `https://evil.com/reset?token=XYZ` to steal the token.",
            simple: "Prove the reset password email sends the secret link to your evil website.",
            hi: "साबित करें कि पासवर्ड रीसेट करने पर विक्टिम के ईमेल में `evil.com/reset?token=...` जा रहा है।",
          }[lang],
        },
        {
          what: {
            en: "Automated Scanner Dumps & Open Port Lists",
            simple: "Copy-Pasting Scanner Dumps",
            hi: "ऑटोमेटेड स्कैनर डंप (Nmap/Nessus) भेजना",
          }[lang],
          never: {
            en: "Do NOT copy-paste raw output from Nikto, Nessus, or Nmap saying 'Port 80 is open' or 'Apache version 2.4.41 detected'.",
            simple: "Do not send raw scanner reports showing open ports or software versions.",
            hi: "Nikto, Nessus या Nmap का आउटपुट कॉपी-पेस्ट करके 'Apache version leak' या 'Port 22 open' रिपोर्ट न करें।",
          }[lang],
          correct: {
            en: "Find a known CVE with an active exploit for that version that allows RCE, Auth Bypass, or SSRF.",
            simple: "Find a real working exploit for that software version.",
            hi: "उस स्पेसिफिक वर्जन के लिए एक्टिव CVE एक्सप्लॉइट खोजें जिससे RCE या डेटा एक्सेस साबित हो सके।",
          }[lang],
        },
      ],
    },
    {
      id: "triage-etiquette",
      icon: AlertTriangle,
      badge: {
        en: "COMMUNICATION · TRIAGE REPUTATION",
        simple: "BE POLITE · GET FASTER BOUNTY",
        hi: "कम्युनिकेशन · ट्राइएज रेपुटेशन",
      }[lang],
      badgeColor: "border-sky-500/40 bg-sky-950/40 text-sky-300",
      title: {
        en: "3. Triage & Communication Mistakes (Avoid Downvotes)",
        simple: "3. How to Talk to Triagers (Get Paid Faster)",
        hi: "3. ट्राइएज और कम्युनिकेशन की गलतियां (डाउनवोट से बचें)",
      }[lang],
      intro: {
        en: "How you write and communicate determines whether you get the maximum bounty or a dispute. Avoid these professional killers:",
        simple: "Writing bad reports makes triagers annoyed. Follow these golden rules to get respected and rewarded:",
        hi: "आपकी रिपोर्ट लिखने का तरीका तय करता है कि आपको फुल बाउंटी मिलेगी या डिस्प्यूट। इन गलतियों से बचें:",
      }[lang],
      items: [
        {
          what: {
            en: "Submitting Without Reproduction Steps or cURL",
            simple: "Reports With Missing Steps",
            hi: "बिना स्टेप्स या cURL के अधूरी रिपोर्ट भेजना",
          }[lang],
          never: {
            en: "Never write 'Please check your login page it has high security bug' without sending the exact HTTP request, parameter, and endpoint.",
            simple: "Never say 'Your site has a bug' without showing the exact clicks and requests.",
            hi: "कभी भी सिर्फ 'आपकी साइट पर बग है' न लिखें। बिना सटीक HTTP रिक्वेस्ट, एंडपॉइंट और पैरामीटर के रिपोर्ट रिजेक्ट हो जाएगी।",
          }[lang],
          correct: {
            en: "Always provide clean step-by-step reproduction (1, 2, 3) and a copy-pasteable cURL command with dummy tokens.",
            simple: "Give 1-2-3 steps and a working cURL command.",
            hi: "हमेशा 1, 2, 3 स्टेप्स और कॉपी-पेस्ट करने योग्य cURL कमांड दें।",
          }[lang],
        },
        {
          what: {
            en: "Begging for P1 Severity or Money",
            simple: "Begging for Money or High Rating",
            hi: "ट्राइएजर से P1 रेटिंग या पैसों की भीख मांगना",
          }[lang],
          never: {
            en: "Never write messages like 'Please sir award maximum bounty I am a student sir mark P1'. Triagers follow strict CVSS matrices, not emotional pleas.",
            simple: "Never beg for a higher bounty or say you need money.",
            hi: "कभी भी 'Sir please mark P1 sir I need money' जैसे मैसेज न लिखें। ट्राइएज टीम CVSS मैट्रिक्स से काम करती है, इमोशनल मैसेजेस से नहीं।",
          }[lang],
          correct: {
            en: "Use technical CVSS v3.1 / v4.0 metrics to objectively argue your case: explain Confidentiality, Integrity, and User Interaction clearly.",
            simple: "Explain the technical damage to user privacy or business money.",
            hi: "CVSS स्कोर और बिज़नेस इम्पैक्ट के आधार पर निष्पक्ष रूप से अपनी बात रखें।",
          }[lang],
        },
        {
          what: {
            en: "Threatening Public Disclosure or Extortion",
            simple: "Threatening to Leak the Bug Online",
            hi: "पब्लिक डिस्क्लोज़र या लीक करने की धमकी देना",
          }[lang],
          never: {
            en: "NEVER threaten: 'If you don't reward me in 48 hours I will tweet this on X/Twitter or publish on Medium'. This destroys legal Safe Harbor and results in an immediate permanent ban on all platforms.",
            simple: "NEVER threaten to publish the bug on social media if they don't pay you.",
            hi: "कभी भी 'अगर 2 दिन में पैसे नहीं दिए तो मैं Twitter/LinkedIn पर डाल दूंगा' की धमकी न दें। यह Safe Harbor को खत्म कर देता है और प्लेटफॉर्म पर परमानेंट बैन लगता है।",
          }[lang],
          correct: {
            en: "Wait for the remediation period (typically 90 days). Request coordinated disclosure respectfully through the platform's official disclosure workflow.",
            simple: "Ask politely for permission to publish after the bug is fixed.",
            hi: "बग फिक्स होने का इंतज़ार करें (आमतौर पर 90 दिन) और प्लेटफॉर्म के Coordinated Disclosure सिस्टम के जरिए अनुमति मांगें।",
          }[lang],
        },
      ],
    },
    {
      id: "strategy-mistakes",
      icon: XCircle,
      badge: {
        en: "STRATEGY · ROADBLOCKS",
        simple: "COMMON MISTAKES · ZERO REWARDS",
        hi: "रणनीति · क्यों 90% हंटर्स खाली हाथ रहते हैं",
      }[lang],
      badgeColor: "border-violet-500/40 bg-violet-950/40 text-violet-300",
      title: {
        en: "4. Strategic Mindset Mistakes (Why 90% of Hunters Make $0)",
        simple: "4. Why Most Beginners Never Find a Bug",
        hi: "4. रणनीतिक गलतियां (क्यों 90% बिगिनर्स को कोई बाउंटी नहीं मिलती)",
      }[lang],
      intro: {
        en: "Success in bug bounty is 90% strategy and persistence. Avoid these common traps:",
        simple: "Bug bounty is about patience and picking the right battles. Do not fall into these traps:",
        hi: "बाउंटी हंटिंग में 90% खेल सही स्ट्रेटेजी और धैर्य का है। इन गलतियों से बचें:",
      }[lang],
      items: [
        {
          what: {
            en: "Picking Hyper-Saturated Targets on Day 1 (Google, Apple, Meta)",
            simple: "Hunting on Huge Companies as a Beginner",
            hi: "पहले ही दिन Google, Apple, या Meta जैसे बड़े टारगेट्स चुनना",
          }[lang],
          never: {
            en: "Do NOT start your journey on top-tier targets that have had 100,000+ elite researchers testing them for 10 years. Low-hanging fruit is literally zero.",
            simple: "Do not hunt on Google or Apple first. They have been tested by thousands of experts.",
            hi: "शुरुआत में ही Google या Apple जैसे टारगेट्स पर न कूदें जहाँ पिछले 10 सालों से लाखों रिसर्चर्स हर सेकंड टेस्ट कर रहे हैं।",
          }[lang],
          correct: {
            en: "Hunt on newly launched wildcard programs, recent acquisitions, or regional fintech/e-commerce platforms with smaller researcher pools.",
            simple: "Pick new programs, small shopping sites, or wildcard targets.",
            hi: "हाल ही में लॉन्च हुए नए प्रोग्राम्स, हाल ही में अधिग्रहित कंपनियों या वाइल्डकार्ड स्कोप्स पर हंट करें।",
          }[lang],
        },
        {
          what: {
            en: "Quitting After 30 Minutes of Running Automated Tools",
            simple: "Giving Up Too Quickly",
            hi: "30 मिनट टूल चलाकर निराश हो जाना और टारगेट छोड़ देना",
          }[lang],
          never: {
            en: "Do NOT run subfinder + nuclei, see zero findings in 20 minutes, and switch targets. Automated recon finds what everyone else already found.",
            simple: "Do not switch targets after running one scanner for 20 minutes.",
            hi: "subfinder और nuclei चलाकर 20 मिनट में कुछ न दिखने पर टारगेट न बदलें। टूल्स वही दिखाते हैं जो सबने देख लिया है।",
          }[lang],
          correct: {
            en: "Spend at least 3–5 hours deeply testing one application's multi-role authorization, checkout flows, and mobile API endpoints.",
            simple: "Spend a few hours clicking all buttons and testing account permissions.",
            hi: "कम से कम 3-5 घंटे एक ऐप के फीचर्स, रोल्स (Admin vs User), और मोबाइल API को गहराई से समझें।",
          }[lang],
        },
        {
          what: {
            en: "Ignoring Target Release Notes and Changelogs",
            simple: "Not Checking New Features",
            hi: "टारगेट के नए फीचर्स और रिलीज नोट्स को इग्नोर करना",
          }[lang],
          never: {
            en: "Never hunt blindly on old static pages that haven't changed in 5 years while ignoring the company's newly deployed features.",
            simple: "Do not test old unchanged pages while ignoring brand new features.",
            hi: "उन पुराने static पेजों पर समय न गंवाएं जो 5 साल से नहीं बदले हैं।",
          }[lang],
          correct: {
            en: "Subscribe to target app updates on Google Play / App Store, watch Github releases, and test brand new features within 24 hours of release.",
            simple: "Test new buttons, new payment options, and mobile app updates as soon as they launch.",
            hi: "टारगेट के ऐप अपडेट्स और नए फीचर्स पर नज़र रखें — नए कोड में हमेशा नए बग्स होते हैं।",
          }[lang],
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300 mb-2">
            <Zap className="h-3.5 w-3.5" /> Elite Hunter Methodology
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <span>🎯</span> {t.title}
          </h1>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-400">{t.subtitle}</p>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-slate-950/60 p-1">
          <Globe className="h-3.5 w-3.5 text-slate-400 ml-1.5 mr-0.5" />
          {LEARN_LANGS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLang(l.id)}
              className={`rounded px-2.5 py-1 text-xs font-bold transition ${
                lang === l.id ? "bg-amber-500/20 text-amber-300 shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {l.short}
            </button>
          ))}
        </div>
      </div>

      {/* Quick KPI Stats Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <Coins className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Hit Rate</span>
          </div>
          <p className="text-lg font-bold text-slate-100">80/20 Rule</p>
          <p className="text-[10px] text-slate-400">80% payouts come from these 6 bugs</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Triage Speed</span>
          </div>
          <p className="text-lg font-bold text-slate-100">&lt; 24 Hours</p>
          <p className="text-[10px] text-slate-400">With non-destructive fast PoC</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="flex items-center gap-2 text-sky-400 mb-1">
            <Radio className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Target Scope</span>
          </div>
          <p className="text-lg font-bold text-slate-100">Wildcards (*)</p>
          <p className="text-[10px] text-slate-400">Regional & staging subdomains</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="flex items-center gap-2 text-violet-400 mb-1">
            <Sparkles className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Advantage</span>
          </div>
          <p className="text-lg font-bold text-slate-100">Mobile APIs</p>
          <p className="text-[10px] text-slate-400">3x more IDORs than web UI</p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab("targets")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            activeTab === "targets"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
              : "border border-border bg-card text-slate-400 hover:text-slate-200"
          }`}
        >
          <Target className="h-3.5 w-3.5" /> {t.tabTargets}
        </button>
        <button
          onClick={() => setActiveTab("calculator")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            activeTab === "calculator"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
              : "border border-border bg-card text-slate-400 hover:text-slate-200"
          }`}
        >
          <Calculator className="h-3.5 w-3.5" /> {t.tabCalculator}
        </button>
        <button
          onClick={() => setActiveTab("bugs")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            activeTab === "bugs"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
              : "border border-border bg-card text-slate-400 hover:text-slate-200"
          }`}
        >
          <Flame className="h-3.5 w-3.5" /> {t.tabBugs}
        </button>
        <button
          onClick={() => setActiveTab("volume")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            activeTab === "volume"
              ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm"
              : "border border-border bg-card text-slate-400 hover:text-slate-200"
          }`}
        >
          <Coins className="h-3.5 w-3.5" /> {t.tabVolume}
        </button>
        <button
          onClick={() => setActiveTab("trees")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            activeTab === "trees"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
              : "border border-border bg-card text-slate-400 hover:text-slate-200"
          }`}
        >
          <GitBranch className="h-3.5 w-3.5" /> {t.tabTrees}
        </button>
        <button
          onClick={() => setActiveTab("chaining")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            activeTab === "chaining"
              ? "bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm"
              : "border border-border bg-card text-slate-400 hover:text-slate-200"
          }`}
        >
          <Link2 className="h-3.5 w-3.5" /> {t.tabChaining}
        </button>
        <button
          onClick={() => setActiveTab("waf")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            activeTab === "waf"
              ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm"
              : "border border-border bg-card text-slate-400 hover:text-slate-200"
          }`}
        >
          <Shield className="h-3.5 w-3.5" /> {t.tabWaf}
        </button>
        <button
          onClick={() => setActiveTab("payloads")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            activeTab === "payloads"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
              : "border border-border bg-card text-slate-400 hover:text-slate-200"
          }`}
        >
          <FlaskConical className="h-3.5 w-3.5" /> {t.tabPayloads}
        </button>
        <button
          onClick={() => setActiveTab("oneliners")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            activeTab === "oneliners"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
              : "border border-border bg-card text-slate-400 hover:text-slate-200"
          }`}
        >
          <Terminal className="h-3.5 w-3.5" /> {t.tabOneLiners}
        </button>
        <button
          onClick={() => setActiveTab("automation")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            activeTab === "automation"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
              : "border border-border bg-card text-slate-400 hover:text-slate-200"
          }`}
        >
          <Bot className="h-3.5 w-3.5" /> {t.tabAutomation}
        </button>
        <button
          onClick={() => setActiveTab("routine")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            activeTab === "routine"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
              : "border border-border bg-card text-slate-400 hover:text-slate-200"
          }`}
        >
          <Brain className="h-3.5 w-3.5" /> {t.tabRoutine}
        </button>
        <button
          onClick={() => setActiveTab("donts")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            activeTab === "donts"
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
              : "border border-border bg-card text-slate-400 hover:text-slate-200"
          }`}
        >
          <Ban className="h-3.5 w-3.5" /> {t.tabDonts}
        </button>
        <button
          onClick={() => setActiveTab("template")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            activeTab === "template"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
              : "border border-border bg-card text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileText className="h-3.5 w-3.5" /> {t.tabTemplate}
        </button>
        <button
          onClick={() => setActiveTab("fintech")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            activeTab === "fintech"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
              : "border border-border bg-card text-slate-400 hover:text-slate-200"
          }`}
        >
          <CreditCard className="h-3.5 w-3.5 text-cyan-400" /> {t.tabFintech}
        </button>
      </div>

      {/* ── TAB 1: TARGET SELECTION STRATEGY ── */}
      {activeTab === "targets" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-amber-400" />
              {lang === "hi"
                ? "टारगेट कैसे चुनें ताकि डुप्लीकेट न मिले?"
                : "How to Pick Targets That Pay (Zero-Duplicate Formula)"}
            </h2>
            <p className="text-xs leading-relaxed text-slate-300 mb-4">
              {lang === "hi"
                ? "दुनिया के 95% रिसर्चर्स Uber, PayPal या मुख्य 'www.domain.com' पर टूल्स चलाते हैं और डुप्लीकेट पाकर निराश हो जाते हैं। सफल बाउंटी हंटर्स इन 4 फ़िल्टर्स का इस्तेमाल करते हैं:"
                : "95% of hunters test 'www.target.com' on saturated public programs and get flooded with duplicates. Successful full-time bounty hunters use these 4 targeted filters:"}
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Card 1 */}
              <div className="rounded-lg border border-border/80 bg-slate-950/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-bold">1</span>
                  <h3 className="text-xs font-bold text-slate-100">
                    {lang === "hi" ? "The 2-Hour Launch Window" : "The 2-Hour Launch Window"}
                  </h3>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300 mb-2">
                  {lang === "hi"
                    ? "HackerOne या Bugcrowd पर जब कोई नया पब्लिक प्रोग्राम लॉन्च होता है, तो पहले 2 घंटों में सबसे ज़्यादा आसान P2/P3 बग्स (CORS, IDOR, Info Disclosure) रिपोर्ट होते हैं। नए प्रोग्राम्स पर सबसे पहले पहुँचें।"
                    : "When a new program launches publicly, the first 2 hours are a goldmine. Simple low-hanging fruit (CORS, IDOR, sensitive files) is reported within 48 hours. Set email alerts and hunt immediately."}
                </p>
                <div className="text-[10px] text-emerald-400 font-mono bg-emerald-950/30 rounded p-1.5 border border-emerald-800/40">
                  Filter: Sort by &quot;Newest Programs&quot; &amp; &quot;Updated Scope&quot;
                </div>
              </div>

              {/* Card 2 */}
              <div className="rounded-lg border border-border/80 bg-slate-950/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/20 text-sky-300 text-xs font-bold">2</span>
                  <h3 className="text-xs font-bold text-slate-100">
                    {lang === "hi" ? "Wildcard Scopes (*.target.com)" : "Wildcard Scopes (*.target.com)"}
                  </h3>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300 mb-2">
                  {lang === "hi"
                    ? "हमेशा Wildcard स्कोप चुनें। मुख्य डोमेन पर Cloudflare WAF होता है, लेकिन रीजनल और स्टेजिंग सबडोमेन्स (*.eu.target.com, dev-api.target.com) पर WAF नहीं होता और पुरानी वर्शन्स चल रही होती हैं।"
                    : "Always choose wildcard programs over single URLs. Main domains have heavy WAFs. Regional endpoints (*.eu, *.latam, *.apac) and staging APIs frequently run unpatched legacy code without WAFs."}
                </p>
                <div className="text-[10px] text-sky-400 font-mono bg-sky-950/30 rounded p-1.5 border border-sky-800/40">
                  Target: subdomains with keywords &quot;api&quot;, &quot;dev&quot;, &quot;qa&quot;, &quot;internal&quot;, &quot;legacy&quot;
                </div>
              </div>

              {/* Card 3 */}
              <div className="rounded-lg border border-border/80 bg-slate-950/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/20 text-amber-300 text-xs font-bold">3</span>
                  <h3 className="text-xs font-bold text-slate-100">
                    {lang === "hi" ? "Company Acquisitions (अधिग्रहण)" : "Recent Acquisitions & Mergers"}
                  </h3>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300 mb-2">
                  {lang === "hi"
                    ? "जब कोई बड़ी कंपनी किसी छोटे स्टार्टअप को खरीदती है, तो 6-12 महीने तक उनका इंफ्रास्ट्रक्चर पुराना रहता है। स्कोप में देखें: 'Any assets belonging to XYZ acquired company' — वहाँ बग्स मिलना लगभग तय होता है।"
                    : "When a corporation acquires a smaller startup, it takes 6–12 months to unify SSO and security controls. Look for acquired entities listed in the program scope — they are packed with low-hanging bugs."}
                </p>
                <div className="text-[10px] text-amber-400 font-mono bg-amber-950/30 rounded p-1.5 border border-amber-800/40">
                  Read program scope: Check &quot;Out of Scope&quot; exclusions carefully
                </div>
              </div>

              {/* Card 4 */}
              <div className="rounded-lg border border-border/80 bg-slate-950/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/20 text-violet-300 text-xs font-bold">4</span>
                  <h3 className="text-xs font-bold text-slate-100">
                    {lang === "hi" ? "VDP to Private Invite Funnel" : "VDP to Private Invite Funnel"}
                  </h3>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300 mb-2">
                  {lang === "hi"
                    ? "नए अकाउंट पर सीधे बड़े BBP में कूदने के बजाय पहले 2 हफ्ते VDP (बिना पैसे वाले) प्रोग्राम्स में 5-10 वैलिड बग्स सबमिट करें। इससे Reputation Score बढ़ता है और प्राइवेट इनवाइट्स मिलते हैं।"
                    : "If your platform reputation is low, hunt on Vulnerability Disclosure Programs (VDPs) for 2 weeks. Submitting 5–10 valid findings boosts your reputation and unlocks exclusive Private BBP invites with only 50 hunters."}
                </p>
                <div className="text-[10px] text-violet-400 font-mono bg-violet-950/30 rounded p-1.5 border border-violet-800/40">
                  HackerOne: Target 100% Reputation to unlock 5+ private invites/month
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: TARGET ROI & VIABILITY CALCULATOR ── */}
      {activeTab === "calculator" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-emerald-400" />
                  {lang === "hi"
                    ? "टारगेट वायबिलिटी और बाउंटी ROI कैलकुलेटर"
                    : "Target Viability & Bounty ROI Calculator"}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === "hi"
                    ? "टारगेट के पैरामीटर्स चुनें और लाइव स्कोर देखें कि क्या इस टारगेट पर समय देना वर्थ-इट है या नहीं:"
                    : "Configure target parameters to calculate expected payout yield, duplicate probability, and estimated time-to-first-bounty."}
                </p>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Presets:</span>
                <button
                  onClick={() => {
                    setCalcScope("wildcard_api");
                    setCalcBounty("p1_5k_plus");
                    setCalcTriage("fast_24h");
                    setCalcAge("new_7days");
                    setCalcMobile(true);
                  }}
                  className="rounded-md bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-900/40 transition"
                >
                  🔥 Fresh Fintech
                </button>
                <button
                  onClick={() => {
                    setCalcScope("wildcard_web");
                    setCalcBounty("p1_2k_5k");
                    setCalcTriage("medium_week");
                    setCalcAge("mature_year");
                    setCalcMobile(false);
                  }}
                  className="rounded-md bg-amber-950/40 border border-amber-800/40 px-2.5 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-900/40 transition"
                >
                  ⚖️ E-Commerce
                </button>
                <button
                  onClick={() => {
                    setCalcScope("single_domain");
                    setCalcBounty("p1_5k_plus");
                    setCalcTriage("painful_delayed");
                    setCalcAge("saturated_5yr");
                    setCalcMobile(false);
                  }}
                  className="rounded-md bg-rose-950/40 border border-rose-800/40 px-2.5 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-900/40 transition"
                >
                  ⚠️ Giant Saturated
                </button>
              </div>
            </div>

            {/* Score & Verdict Card */}
            <div className="rounded-xl border border-border/80 bg-slate-950/60 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border text-xl font-bold font-mono ${
                    calcScore >= 80
                      ? "border-emerald-500/50 bg-emerald-950/50 text-emerald-300 shadow-lg shadow-emerald-950/50"
                      : calcScore >= 55
                      ? "border-amber-500/50 bg-amber-950/50 text-amber-300 shadow-lg shadow-amber-950/50"
                      : "border-rose-500/50 bg-rose-950/50 text-rose-300 shadow-lg shadow-rose-950/50"
                  }`}
                >
                  {calcScore}
                  <span className="text-[10px] font-normal text-slate-400 ml-0.5">/100</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Viability Verdict</span>
                  <p className="text-sm font-bold text-slate-100">
                    {calcScore >= 80
                      ? lang === "hi" ? "🔥 गोल्डमाइन टारगेट (तुरंत हंट करें)" : "🔥 Goldmine Target (Hunt Now)"
                      : calcScore >= 55
                      ? lang === "hi" ? "⚖️ सामान्य स्कोप (मैन्युअल लॉजिक)" : "⚖️ Moderate (Manual Logic Focus)"
                      : lang === "hi" ? "⚠️ हाई फ्रिक्शन (अत्यधिक कॉम्पिटिशन)" : "⚠️ High Friction (Avoid / Saturated)"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {calcScore >= 80
                      ? lang === "hi" ? "फर्स्ट बग संभावना: 2 – 6 घंटे" : "Est. First Bug: 2 – 6 Hours"
                      : calcScore >= 55
                      ? lang === "hi" ? "फर्स्ट बग संभावना: 1 – 2 दिन" : "Est. First Bug: 1 – 2 Days"
                      : lang === "hi" ? "फर्स्ट बग संभावना: 1+ हफ्ता (डुप्लीकेट रिस्क)" : "Est. First Bug: 1+ Week (Duplicate Risk)"}
                  </p>
                </div>
              </div>

              {/* Progress bar and guidance */}
              <div className="md:col-span-2 space-y-2">
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      calcScore >= 80 ? "bg-emerald-500" : calcScore >= 55 ? "bg-amber-500" : "bg-rose-500"
                    }`}
                    style={{ width: `${calcScore}%` }}
                  />
                </div>
                <p className="text-xs leading-relaxed text-slate-300">
                  {calcScore >= 80
                    ? lang === "hi"
                      ? "नया प्रोग्राम + वाइल्डकार्ड स्कोप + फास्ट ट्राइएज। सबफाइंडर चलाएं और मोबाइल API एक्सट्रेक्ट करें — P1/P2 मिलने की सबसे ज्यादा संभावना है।"
                      : "Fresh program with wide scope and fast triage. Subdomain brute-forcing and mobile API testing will likely yield high payouts quickly."
                    : calcScore >= 55
                    ? lang === "hi"
                      ? "हेल्दी टारगेट। बेसिक स्कैनर्स न चलाएं क्योंकि सबने चला लिया है। 2 अकाउंट्स बनाकर ऑथराइजेशन और बिज़नेस लॉजिक पर फोकस करें।"
                      : "Healthy target. Automated recon is already drained. Focus on multi-role authorization, checkout logic, and parallel race conditions."
                    : lang === "hi"
                      ? "अत्यधिक संतृप्त या धीमी ट्राइएज। डुप्लीकेट्स का खतरा 80%+ है। जब तक आपके पास कस्टम 0-डे या प्राइवेट एक्सप्लॉइट न हो, समय न लगाएं।"
                      : "Heavy saturation or slow triage. Duplicate probability exceeds 80%. Not recommended for beginners unless testing zero-day vectors."}
                </p>
              </div>
            </div>

            {/* Config Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Option 1: Scope Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 block">
                  1. {lang === "hi" ? "स्कोप का प्रकार (Scope Type)" : "Scope Attack Surface"}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "wildcard_api", label: "Wildcard + Mobile API (*)", desc: "Max surface (+32 pts)" },
                    { id: "wildcard_web", label: "Wildcard Web Only (*)", desc: "Regional subs (+24 pts)" },
                    { id: "single_domain", label: "Single Domain (www)", desc: "Narrow (+12 pts)" },
                    { id: "strict_url", label: "Strict Single URL/App", desc: "Hardened (-5 pts)" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setCalcScope(s.id as any)}
                      className={`text-left rounded-lg p-2.5 border transition ${
                        calcScope === s.id
                          ? "border-emerald-500/50 bg-emerald-950/25 text-emerald-300 font-semibold"
                          : "border-border/80 bg-slate-950/40 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span className="text-xs block">{s.label}</span>
                      <span className="text-[10px] text-slate-400 block">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 2: Bounty Table */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 block">
                  2. {lang === "hi" ? "बाउंटी पेआउट टेबल (P1 Max Payout)" : "Bounty Table Payouts"}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "p1_5k_plus", label: "P1 > $5,000", desc: "Top tier (+25 pts)" },
                    { id: "p1_2k_5k", label: "P1 $2,000 – $5,000", desc: "Standard (+18 pts)" },
                    { id: "p1_sub_2k", label: "P1 < $2,000", desc: "Low payout (+10 pts)" },
                    { id: "vdp_swag", label: "VDP / Swag / HoF", desc: "Reputation only (+12 pts)" },
                  ].map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setCalcBounty(b.id as any)}
                      className={`text-left rounded-lg p-2.5 border transition ${
                        calcBounty === b.id
                          ? "border-emerald-500/50 bg-emerald-950/25 text-emerald-300 font-semibold"
                          : "border-border/80 bg-slate-950/40 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span className="text-xs block">{b.label}</span>
                      <span className="text-[10px] text-slate-400 block">{b.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 3: Triage Speed */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 block">
                  3. {lang === "hi" ? "ट्राइएज और रिस्पॉन्स स्पीड" : "Average Triage & Response Speed"}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "fast_24h", label: "< 24 Hours", desc: "Lightning fast (+23 pts)" },
                    { id: "medium_week", label: "2 – 7 Days", desc: "Acceptable (+14 pts)" },
                    { id: "slow_month", label: "2 – 4 Weeks", desc: "Slow triage (+4 pts)" },
                    { id: "painful_delayed", label: "> 1 Month", desc: "Painful delay (-15 pts)" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setCalcTriage(t.id as any)}
                      className={`text-left rounded-lg p-2.5 border transition ${
                        calcTriage === t.id
                          ? "border-emerald-500/50 bg-emerald-950/25 text-emerald-300 font-semibold"
                          : "border-border/80 bg-slate-950/40 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span className="text-xs block">{t.label}</span>
                      <span className="text-[10px] text-slate-400 block">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 4: Program Age */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 block">
                  4. {lang === "hi" ? "प्रोग्राम आयु व कॉम्पिटिशन" : "Program Age & Saturation"}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "new_7days", label: "Last 7 Days (Fresh)", desc: "Zero duplicates (+20 pts)" },
                    { id: "updated_month", label: "Updated < 30 Days", desc: "New assets (+12 pts)" },
                    { id: "mature_year", label: "Active 1 – 2 Years", desc: "Tested (+4 pts)" },
                    { id: "saturated_5yr", label: "Active 5+ Years", desc: "Hyper saturated (-10 pts)" },
                  ].map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setCalcAge(a.id as any)}
                      className={`text-left rounded-lg p-2.5 border transition ${
                        calcAge === a.id
                          ? "border-emerald-500/50 bg-emerald-950/25 text-emerald-300 font-semibold"
                          : "border-border/80 bg-slate-950/40 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span className="text-xs block">{a.label}</span>
                      <span className="text-[10px] text-slate-400 block">{a.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Checkbox Bonus */}
            <div className="pt-2 flex items-center justify-between border-t border-border/60">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
                <input
                  type="checkbox"
                  checked={calcMobile}
                  onChange={(e) => setCalcMobile(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                />
                <span>
                  {lang === "hi"
                    ? "टारगेट के पास Android / iOS मोबाइल ऐप स्कोप में है (+10 Bonus)"
                    : "Target has dedicated Android / iOS Mobile App in scope (+10 Bonus)"}
                </span>
              </label>

              <button
                onClick={() => setActiveTab("oneliners")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-sm"
              >
                {lang === "hi" ? "इस टारगेट का रिकॉन शुरू करें" : "Start Recon for Target"} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: TOP 6 MOST COMMON BUGS ── */}
      {activeTab === "bugs" && (
        <div className="space-y-4">
          {/* Bug selector pill bar */}
          <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-card p-1.5">
            {topBugs.map((b, i) => (
              <button
                key={b.id}
                onClick={() => setActiveBug(i)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeBug === i
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>{b.emoji}</span>
                <span>{b.title.split(". ")[1]}</span>
              </button>
            ))}
          </div>

          {/* Active Bug Card */}
          {(() => {
            const bug = topBugs[activeBug];
            return (
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/80 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 bg-amber-950/50 border border-amber-800/40 px-2 py-0.5 rounded">
                      {bug.category}
                    </span>
                    <h2 className="text-lg font-bold text-slate-100 mt-1 flex items-center gap-2">
                      <span>{bug.emoji}</span> {bug.title}
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-400 block">Typical Bounty</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">{bug.payout}</span>
                  </div>
                </div>

                {/* Why it's everywhere */}
                <div>
                  <h3 className="text-xs font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                    <span>💡</span> {lang === "hi" ? "यह बग क्यों इतना आम है?" : "Why This Bug Is Everywhere:"}
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-300 bg-slate-950/40 rounded-lg p-3 border border-border/40">
                    {bug.whyCommon}
                  </p>
                </div>

                {/* Hunting Methodology */}
                <div>
                  <h3 className="text-xs font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                    <span>🔍</span> {lang === "hi" ? "सटीक हंटिंग स्टेप्स (Confirm Hit):" : "Guaranteed Hunting Methodology:"}
                  </h3>
                  <div className="text-xs leading-relaxed text-slate-300 bg-slate-950/40 rounded-lg p-3 border border-border/40 whitespace-pre-line font-mono text-[11px]">
                    {bug.huntingMethod}
                  </div>
                </div>

                {/* Copyable CLI Command */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5 text-sky-400" />
                      {lang === "hi" ? "रेडी-टू-रन कमांड / टेस्ट हार्नेस:" : "Copyable Command / Test Harness:"}
                    </h3>
                    <CopyBtn text={bug.command} />
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-xs text-emerald-300 overflow-x-auto">
                    <code>{bug.command}</code>
                  </div>
                </div>

                {/* Pro-Tip Box */}
                <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-950/40 to-slate-900/30 p-4">
                  <h3 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                    <Zap className="h-4 w-4" />
                    {lang === "hi" ? "बाउंटी हंटर प्रो-टिप (P1/P2 Escalation):" : "Bounty Hunter Pro-Tip (Maximize Payout):"}
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-300">{bug.proTip}</p>
                </div>

                {/* Practice on checklist CTA */}
                {onPractice && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => onPractice(bug.checklistCat)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-sm"
                    >
                      {lang === "hi" ? "चेकलिस्ट पर अभ्यास करें" : "Practice on Checklist"} <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── TAB: P3 & P4 VOLUME HUNTING STRATEGY ── */}
      {activeTab === "volume" && (
        <div className="space-y-5">
          {/* Header Banner */}
          <div className="rounded-xl border border-sky-500/30 bg-gradient-to-r from-sky-950/30 via-slate-900/60 to-card p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Coins className="h-5 w-5 text-sky-400" />
                  {lang === "hi"
                    ? "P3 व P4 वॉल्यूम हंटिंग आर्सेनल (हाई-फ्रीक्वेंसी बाउंटी रणनीति)"
                    : "P3 & P4 High-Volume Strategy (Consistent $150 – $800 Payouts)"}
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                  {lang === "hi"
                    ? "महीनों तक एक कठिन P1 के पीछे भागने के बजाय, टॉप हंटर्स 10-15 वैध P3/P4 बग्स रिपोर्ट करके नियमित कमाई और प्लेटफॉर्म रेपुटेशन बनाते हैं। नीचे वे 6 सबसे आम इश्यूज हैं जो सबसे ज्यादा एक्सेप्ट होते हैं:"
                    : "Instead of grinding for weeks on elusive P1 criticals, professional volume hunters report 10–15 solid P3/P4 findings to guarantee consistent monthly payouts and build elite platform reputation."}
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-emerald-300">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Hit Rate: 3x Higher Than P1s</span>
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/50">
              {["all", "Information Disclosure", "Infrastructure Misconfiguration", "Broken Access Control", "Cryptographic & Redirection Flaws", "Business Logic Flaw"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setVolumeFilter(cat)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                    volumeFilter === cat
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                      : "border border-border bg-slate-900 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {cat === "all" ? "All P3/P4 Categories" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {P3_P4_TECHNIQUES.filter((item) => volumeFilter === "all" || item.category === volumeFilter).map((item, idx) => (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-slate-900/60 p-4 space-y-3.5 hover:border-sky-500/30 transition shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 text-[10px] font-bold text-sky-300 border border-sky-500/30 shrink-0">
                      {idx + 1}
                    </span>
                    <h3 className="text-xs font-bold text-slate-200 truncate">{localize(item.title, lang)}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      item.severity.startsWith("Medium")
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                    }`}>
                      {item.severity}
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                      {item.averagePayout}
                    </span>
                  </div>
                </div>

                {/* Why high volume */}
                <div className="text-xs text-slate-300 leading-relaxed">
                  <span className="font-semibold text-sky-400">
                    {lang === "hi" ? "यह इतना आम क्यों है: " : "Why It's Everywhere: "}
                  </span>
                  {localize(item.whyHighVolume, lang)}
                </div>

                {/* How to find */}
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs space-y-1">
                  <span className="font-semibold text-emerald-400 block text-[11px]">
                    {lang === "hi" ? "🔍 इसे कैसे और कहाँ खोजें:" : "🔍 How & Where to Find It:"}
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{localize(item.howToFind, lang)}</p>
                </div>

                {/* Test snippet / command */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      {lang === "hi" ? "टेस्ट कमांड / स्निपेट:" : "Test Command / Snippet:"}
                    </span>
                    <CopyBtn text={item.testCommandOrSnippet} />
                  </div>
                  <pre className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 font-mono text-[11px] text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    <code>{item.testCommandOrSnippet}</code>
                  </pre>
                </div>

                {/* Triager Acceptance Tip */}
                <div className="rounded-lg border border-amber-500/20 bg-amber-950/20 p-2.5 text-[11px] text-amber-200/90 flex items-start gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300">
                      {lang === "hi" ? "ट्राइएजर एक्सेप्टेंस टिप (N/A से बचें): " : "Triager Approval Secret (Avoid N/A): "}
                    </span>
                    {localize(item.triagerTip, lang)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: ATTACK DECISION TREES ── */}
      {activeTab === "trees" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-emerald-400" />
                  {lang === "hi" ? "अटैक डिसीजन ट्रीज़ (अगर यह दिखे तो क्या करें?)" : "Visual Attack Decision Trees (Feature-to-Bounty Mindmaps)"}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === "hi"
                    ? "जब भी आपको कोई खास फीचर (जैसे पासवर्ड रीसेट, फाइल अपलोड, ग्राफ-क्यूएल) दिखे, तो इन टेस्ट स्टेप्स को फॉलो करें:"
                    : "Whenever you encounter a specific target feature, follow these chronological test branches for maximum hit rate:"}
                </p>
              </div>
            </div>

            {/* Feature Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
              {ATTACK_DECISION_TREES.map((tree, idx) => {
                const isSelected = activeTree === idx;
                return (
                  <button
                    key={tree.id}
                    onClick={() => setActiveTree(idx)}
                    className={`flex items-center gap-2 rounded-xl p-3 text-left transition border ${
                      isSelected
                        ? "border-emerald-500/50 bg-emerald-950/20 shadow-md ring-1 ring-emerald-500/30"
                        : "border-border bg-slate-900/40 hover:bg-slate-800/60"
                    }`}
                  >
                    <span className="text-xl shrink-0">{tree.emoji}</span>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${isSelected ? "text-emerald-300" : "text-slate-200"}`}>
                        {localize(tree.featureName, lang)}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{tree.steps.length} Attack Branches</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Tree Content */}
            {(() => {
              const currentTree = ATTACK_DECISION_TREES[activeTree] || ATTACK_DECISION_TREES[0];
              return (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                      <Target className="h-4 w-4" />
                      <span>{lang === "hi" ? "ट्रिगर संदर्भ (कहाँ टेस्ट करें):" : "Trigger Context (Where to Look):"}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {localize(currentTree.triggerContext, lang)}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {currentTree.steps.map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className="rounded-xl border border-border bg-slate-900/60 p-4 space-y-3 hover:border-emerald-500/30 transition"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                              {sIdx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-200">
                              {lang === "hi" ? "यदि स्थिति: " : "Condition: "}
                              <span className="text-amber-300">{localize(step.condition, lang)}</span>
                            </span>
                          </div>
                          <span className="rounded-full bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                            {step.payoutImpact}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="rounded-lg border border-slate-800/80 bg-slate-950/50 p-3 space-y-1">
                            <div className="flex items-center gap-1.5 text-sky-400 font-semibold text-[11px]">
                              <Zap className="h-3.5 w-3.5" />
                              <span>{lang === "hi" ? "कदम / परीक्षण एक्शन:" : "Action / Test Method:"}</span>
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed">{localize(step.action, lang)}</p>
                          </div>

                          <div className="rounded-lg border border-slate-800/80 bg-slate-950/50 p-3 space-y-1">
                            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                              <Check className="h-3.5 w-3.5" />
                              <span>{lang === "hi" ? "सकारात्मक संकेत (बग कन्फर्म):" : "Positive Indicator (Bug Found):"}</span>
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed">{localize(step.positiveIndicator, lang)}</p>
                          </div>
                        </div>

                        {step.payloadOrCommand && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-mono uppercase text-slate-400">
                                {lang === "hi" ? "पेलोड / रिक्वेस्ट उदाहरण:" : "Payload / Request PoC:"}
                              </span>
                              <CopyBtn text={step.payloadOrCommand} />
                            </div>
                            <pre className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 font-mono text-[11px] text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                              <code>{step.payloadOrCommand}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── TAB 4: VULNERABILITY CHAINING MATRIX ── */}
      {activeTab === "chaining" && (
        <div className="space-y-4">
          {/* Chain selector pills */}
          <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-card p-1.5">
            {VULN_CHAINS.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setActiveChain(i)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeChain === i
                    ? "bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Link2 className="h-3.5 w-3.5" />
                <span>{localize(c.title, lang).split(" = ")[0]}</span>
              </button>
            ))}
          </div>

          {/* Active Chain Details */}
          {(() => {
            const chain = VULN_CHAINS[activeChain];
            return (
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/80 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-violet-400 bg-violet-950/50 border border-violet-800/40 px-2 py-0.5 rounded">
                      {chain.category}
                    </span>
                    <h2 className="text-base font-bold text-slate-100 mt-1 flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-violet-400" /> {localize(chain.title, lang)}
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-400 block">Payout Multiplier</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">{chain.payoutBoost}</span>
                  </div>
                </div>

                {/* Formula Badge */}
                <div className="rounded-lg border border-violet-500/30 bg-violet-950/20 px-3 py-2 font-mono text-xs text-violet-300">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Exploit Formula:</span>
                  {chain.formula}
                </div>

                {/* Summary */}
                <p className="text-xs leading-relaxed text-slate-300 bg-slate-950/40 rounded-lg p-3 border border-border/40">
                  {localize(chain.summary, lang)}
                </p>

                {/* 3 Steps */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-200">
                    {lang === "hi" ? "एक्सप्लॉइट चेन के स्टेप्स:" : "Step-by-Step Chain Anatomy:"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {chain.steps.map((st, sIdx) => (
                      <div key={sIdx} className="rounded-lg border border-border/70 bg-slate-950/40 p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-100">{localize(st.name, lang)}</span>
                          <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded">
                            {st.severity}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-300">{localize(st.desc, lang)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PoC Snippet */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Code className="h-3.5 w-3.5 text-sky-400" />
                      {lang === "hi" ? "कॉपी करने योग्य PoC / रिक्वेस्ट:" : "Copyable PoC Template:"}
                    </h3>
                    <CopyBtn text={chain.pocTemplate} />
                  </div>
                  <pre className="rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed">
                    <code>{chain.pocTemplate}</code>
                  </pre>
                </div>

                {/* Title Recommendation Box */}
                <div className="rounded-lg border border-sky-500/30 bg-sky-950/20 p-3 flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-sky-400 block mb-0.5">
                      {lang === "hi" ? "ट्राइएज-विनिंग रिपोर्ट टाइटल:" : "Recommended Report Title (Pass Triage):"}
                    </span>
                    <span className="font-mono text-xs text-sky-200 font-semibold">{chain.reportTitle}</span>
                  </div>
                  <CopyBtn text={chain.reportTitle} />
                </div>

                {/* Pro tip */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/15 p-3.5 flex items-start gap-2.5">
                  <Zap className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-300 mb-0.5">
                      {lang === "hi" ? "प्रो-टिप (पेआउट मैक्सिमाइज़र):" : "Hunter Pro-Tip:"}
                    </h4>
                    <p className="text-xs leading-relaxed text-slate-300">{localize(chain.proTip, lang)}</p>
                  </div>
                </div>

                {/* Practice on checklist */}
                {onPractice && (
                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => onPractice(chain.checklistCat)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-sm"
                    >
                      {lang === "hi" ? "चेकलिस्ट पर अभ्यास करें" : "Practice on Checklist"} <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── TAB 5: WAF & 403 BYPASSES ── */}
      {activeTab === "waf" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-sky-400" />
                  {lang === "hi"
                    ? "WAF और 403 Forbidden बाईपास गाइड (Cloudflare / Akamai)"
                    : "WAF & 403 Forbidden Bypass Arsenal"}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === "hi"
                    ? "70% हंटर्स 403 Forbidden देखकर टारगेट छोड़ देते हैं। इन तकनीकों से WAF को पूरी तरह बाईपास करें:"
                    : "80% of hunters give up when they see 403 Forbidden. Use these direct origin and header techniques to bypass firewalls."}
                </p>
              </div>

              {/* Category selector */}
              <div className="flex flex-wrap gap-1">
                {[
                  { id: "all", label: "All" },
                  { id: "origin_ip", label: "Origin IP" },
                  { id: "header_bypass", label: "403 Headers" },
                  { id: "path_tampering", label: "URL Syntax" },
                  { id: "encoding", label: "Encodings" },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setWafCat(c.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                      wafCat === c.id
                        ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Techniques list */}
            <div className="space-y-4">
              {WAF_BYPASS_DATA.filter((w) => wafCat === "all" || w.category === wafCat).map((item, idx) => (
                <div key={idx} className="rounded-lg border border-border/80 bg-slate-950/40 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-950 border border-sky-800 text-[10px] font-mono text-sky-300">
                        {idx + 1}
                      </span>
                      {localize(item.title, lang)}
                    </h3>
                    <span className="text-[10px] font-mono uppercase bg-slate-900 text-slate-400 border border-border px-2 py-0.5 rounded">
                      {item.category.replace("_", " ")}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-300">{localize(item.description, lang)}</p>

                  {/* Command / Payload Box */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono uppercase text-sky-400">Payload / Command:</span>
                      <CopyBtn text={item.commandOrPayload} />
                    </div>
                    <pre className="rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed">
                      <code>{item.commandOrPayload}</code>
                    </pre>
                  </div>

                  {/* Why it works */}
                  <div className="rounded-md border border-slate-800 bg-slate-900/60 p-2.5 text-xs text-slate-300 flex items-start gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-200">
                        {lang === "hi" ? "यह क्यों काम करता है: " : "Why this works: "}
                      </span>
                      {localize(item.whyItWorks, lang)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: HIGH-YIELD PAYLOADS & LIVE ENCODER ── */}
      {activeTab === "payloads" && (
        <div className="space-y-5">
          {/* Live Multi-Encoder Box */}
          <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Binary className="h-5 w-5 text-cyan-400" />
                  {lang === "hi" ? "लाइव मल्टी-एनकोडर (WAF बाईपास टूल)" : "Live Multi-Encoder & WAF Converter"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === "hi"
                    ? "कोई भी पेलोड या स्ट्रिंग टाइप करें — तुरंत URL, Base64, Hex, HTML Entities और Unicode बाईपास में कन्वर्ट करें:"
                    : "Type any string or payload below to instantly generate real-time WAF bypass representations:"}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                {lang === "hi" ? "कच्चा इनपुट स्ट्रिंग / पेलोड:" : "Raw Payload / String Input:"}
              </label>
              <input
                type="text"
                value={encoderInput}
                onChange={(e) => setEncoderInput(e.target.value)}
                placeholder="e.g. admin' OR 1=1-- # or <script>alert(1)</script>"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 font-mono text-xs text-cyan-300 outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { label: "URL Encoded", val: encodings.urlEnc },
                { label: "Double URL Encoded", val: encodings.doubleUrlEnc },
                { label: "Base64 Encoded", val: encodings.base64Enc },
                { label: "Hex Byte Stream", val: encodings.hexEnc },
                { label: "HTML Numeric Entities", val: encodings.htmlEnc },
                { label: "Unicode Fullwidth (WAF Bypass)", val: encodings.unicodeEnc },
              ].map((item, idx) => (
                <div key={idx} className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{item.label}</span>
                    <CopyBtn text={item.val} />
                  </div>
                  <pre className="rounded bg-slate-900/70 p-2 font-mono text-[11px] text-slate-200 overflow-x-auto whitespace-pre truncate">
                    <code>{item.val || "—"}</code>
                  </pre>
                </div>
              ))}
            </div>
          </div>

          {/* High-Yield Payloads Cheatsheet */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-emerald-400" />
                  {lang === "hi" ? "हाई-यील्ड बाईपास पेलोड्स चीटशीट" : "High-Yield Bypass Payloads Cheatsheet"}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === "hi"
                    ? "फील्ड-प्रूवेन पेलोड्स जो मॉर्डन फायरवॉल्स और क्लाउड फ़िल्टर्स को बाईपास करते हैं:"
                    : "Field-proven polyglots and link-local payloads that bypass modern web filters:"}
                </p>
              </div>

              {/* Filter pills */}
              <div className="flex flex-wrap gap-1">
                {["all", "ssrf", "xss", "sqli", "ssti", "redirect"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setPayloadCat(cat)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${
                      payloadCat === cat
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "border border-border bg-slate-900 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {HIGH_YIELD_PAYLOADS.filter((p) => payloadCat === "all" || p.category === payloadCat).map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-slate-900/50 p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200">{localize(item.name, lang)}</span>
                    <span className="text-[10px] font-mono uppercase bg-slate-950 border border-border px-2 py-0.5 rounded text-sky-400">
                      {item.targetEnv}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Payload:</span>
                      <CopyBtn text={item.payload} />
                    </div>
                    <pre className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 font-mono text-xs text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      <code>{item.payload}</code>
                    </pre>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-start gap-1.5 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{localize(item.whyItBypasses, lang)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: RECON TERMINAL ONE-LINERS ── */}
      {activeTab === "oneliners" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-amber-400" />
                  {lang === "hi"
                    ? "रिकॉन टर्मिनल वन-लाइनर्स आर्सेनल (Copy & Paste)"
                    : "Elite Recon Terminal One-Liners & Pipes"}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === "hi"
                    ? "डेली हंटिंग में समय बचाने के लिए फील्ड-टेस्टेड बैश पाइप्स — 1-क्लिक में कॉपी करें:"
                    : "Piped terminal command chains tested for high discovery yield. Click copy and run in your terminal:"}
                </p>
              </div>

              {/* Category selector */}
              <div className="flex flex-wrap gap-1">
                {[
                  { id: "all", label: "All" },
                  { id: "subdomains", label: "Subdomains" },
                  { id: "javascript", label: "JavaScript" },
                  { id: "secrets", label: "Secrets" },
                  { id: "parameters", label: "Parameters" },
                  { id: "bypasses", label: "403 Bypasses" },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setReconCat(c.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                      reconCat === c.id
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Commands list */}
            <div className="space-y-3.5">
              {RECON_ONE_LINERS.filter((r) => reconCat === "all" || r.category === reconCat).map((cmd) => (
                <div key={cmd.id} className="rounded-lg border border-border/80 bg-slate-950/40 p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                      <Terminal className="h-3.5 w-3.5 text-amber-400" />
                      {localize(cmd.title, lang)}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      {cmd.toolsUsed.map((tool) => (
                        <span key={tool} className="text-[10px] font-mono bg-slate-900 border border-border text-emerald-400 px-1.5 py-0.5 rounded">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-300">{localize(cmd.explanation, lang)}</p>

                  <div className="relative">
                    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-xs text-emerald-300 overflow-x-auto">
                      <code>{cmd.command}</code>
                      <div className="ml-2 pl-2 border-l border-slate-800">
                        <CopyBtn text={cmd.command} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: WORKFLOW AUTOMATION SCRIPTS & HELPERS ── */}
      {activeTab === "automation" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Bot className="h-5 w-5 text-emerald-400" />
                  {lang === "hi"
                    ? "वर्कफ़्लो ऑटोमेशन स्क्रिप्ट्स व हेल्पर्स (Console & Burp)"
                    : "Workflow Automation Scripts & Helpers"}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === "hi"
                    ? "बार-बार किए जाने वाले कामों को ऑटोमेट करें: DevTools स्निपेट्स, Burp Suite रूल्स और लोकल वर्कस्पेस पार्सर:"
                    : "Ready-to-use client-side browser console snippets, Burp Suite background rules, and local CLI scope parsers."}
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1">
                {[
                  { id: "all", label: "All" },
                  { id: "devtools", label: "Browser DevTools" },
                  { id: "burp", label: "Burp Suite" },
                  { id: "cli_importer", label: "CLI Utility" },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setAutomationCat(c.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                      automationCat === c.id
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Automation Helpers List */}
            <div className="space-y-4">
              {AUTOMATION_HELPERS.filter((h) => automationCat === "all" || h.category === automationCat).map((helper) => (
                <div key={helper.id} className="rounded-lg border border-border/80 bg-slate-950/40 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      {localize(helper.title, lang)}
                    </h3>
                    <span className="text-[10px] font-mono uppercase bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 px-2 py-0.5 rounded">
                      {helper.badge}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-300">{localize(helper.description, lang)}</p>

                  {/* Code box */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono uppercase text-emerald-400">
                        {helper.category === "cli_importer"
                          ? "Terminal Command:"
                          : helper.category === "burp"
                          ? "Configuration Instructions:"
                          : "JavaScript Console Snippet:"}
                      </span>
                      <CopyBtn text={helper.codeOrInstructions} />
                    </div>
                    <pre className="rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed max-h-72">
                      <code>{helper.codeOrInstructions}</code>
                    </pre>
                  </div>

                  {/* How to use */}
                  <div className="rounded-md border border-slate-800 bg-slate-900/60 p-2.5 text-xs text-slate-300 flex items-start gap-2">
                    <Terminal className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-200">
                        {lang === "hi" ? "कैसे इस्तेमाल करें: " : "How to run: "}
                      </span>
                      {localize(helper.howToUse, lang)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 8: DAILY ROUTINE ── */}
      {activeTab === "routine" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-emerald-400" />
              {lang === "hi"
                ? "दैनिक हंटिंग रूटीन (Daily 'Confirm Hit' Workflow)"
                : "The Daily 'Confirm Hit' Routine (Structured Pipeline)"}
            </h2>
            <p className="text-xs leading-relaxed text-slate-300">
              {lang === "hi"
                ? "बिना प्लान के टूल्स चलाने से सिर्फ समय खराब होता है। इस 4-स्टेप दैनिक रूटीन का पालन करें:"
                : "Blindly running scanners burns time and gets zero bounties. Follow this 4-step professional pipeline daily:"}
            </p>

            <div className="space-y-3">
              <div className="rounded-lg border border-border/80 bg-slate-950/40 p-3.5">
                <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-1">Step 1 (First 30 Mins)</span>
                <h3 className="text-xs font-bold text-slate-100 mb-1">
                  {lang === "hi" ? "बिज़नेस मॉडल व एसेट प्रोफ़ाइलिंग" : "Business Model & Role Mapping"}
                </h3>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  {lang === "hi"
                    ? "वेबसाइट को समझें: यह कंपनी पैसे कैसे कमाती है? इसके अलग-अलग रोल्स क्या हैं (Admin, Manager, Member, Guest)? सबसे ज़्यादा रिस्क वाले फ़ीचर्स (Billing, Invoices, Team Management, Password Reset) को मार्क करें।"
                    : "Understand the target: How does this business make money? What user roles exist (Admin, Editor, Viewer, Guest)? Pinpoint the highest-value features: billing invoices, team invitations, and password reset flows."}
                </p>
              </div>

              <div className="rounded-lg border border-border/80 bg-slate-950/40 p-3.5">
                <span className="text-[10px] font-bold uppercase text-sky-400 block mb-1">Step 2 (The Mobile Advantage)</span>
                <h3 className="text-xs font-bold text-slate-100 mb-1">
                  {lang === "hi" ? "Mobile API का फ़ायदा उठाएं (3x More Bugs)" : "Inspect the Mobile App API"}
                </h3>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  {lang === "hi"
                    ? "वेबसाइट पर भारी WAF और कड़े वैलिडेशन होते हैं, लेकिन उसी कंपनी के Android/iOS Mobile API पर कई पुराने और अनप्रोटेक्टेड एंडपॉइंट्स होते हैं। jadx-gui से APK खोलें और मोबाइल ट्रैफिक को Burp Suite से गुज़ारें।"
                    : "Websites have strict WAFs, but the same company's Android/iOS Mobile API often talks to legacy endpoints without WAF inspection. Decompile the APK in jadx-gui and proxy traffic through Burp to find 3x more IDORs."}
                </p>
              </div>

              <div className="rounded-lg border border-border/80 bg-slate-950/40 p-3.5">
                <span className="text-[10px] font-bold uppercase text-amber-400 block mb-1">Step 3 (Deep Testing)</span>
                <h3 className="text-xs font-bold text-slate-100 mb-1">
                  {lang === "hi" ? "2-Accounts Autorize हंटिंग" : "The 2-Account Autorize Walkthrough"}
                </h3>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  {lang === "hi"
                    ? "Autorize में User B की कुकीज़ डालकर User A से साइट का एक-एक बटन क्लिक करें। जहाँ भी ग्रीन दिखे, समझो बग कन्फर्म। उसके बाद PUT/DELETE रिक्वेस्ट्स टेस्ट करके स्टेट मॉडिफिकेशन साबित करें।"
                    : "Load User B's cookies into Burp Autorize. Click every feature in the app as User A. Investigate every green row. Then check PUT/PATCH/DELETE methods to prove state modification."}
                </p>
              </div>

              <div className="rounded-lg border border-border/80 bg-slate-950/40 p-3.5">
                <span className="text-[10px] font-bold uppercase text-violet-400 block mb-1">Step 4 (Triage Proof)</span>
                <h3 className="text-xs font-bold text-slate-100 mb-1">
                  {lang === "hi" ? "Non-Destructive PoC तैयार करें" : "Prepare Non-Destructive Proof"}
                </h3>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  {lang === "hi"
                    ? "Customer data कभी डाउनलोड न करें। सिर्फ अपने टेस्ट अकाउंट्स के बीच इम्पैक्ट दिखाएं। स्क्रीनशॉट और साफ़ cURL कमांड्स के साथ 5 मिनट में स्वीकार होने वाली रिपोर्ट सबमिट करें।"
                    : "Never download customer records. Verify solely between your own test accounts. Provide exact copyable cURL commands and clear non-destructive impact statements."}
                </p>
              </div>
            </div>
          </div>

          {/* Mindset & Psychological Stamina */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Brain className="h-5 w-5 text-violet-400" />
                {lang === "hi"
                  ? "हंटर माइंडसेट और बर्नआउट गाइड (Psychological Stamina)"
                  : "Hunter Mindset, Burnout Prevention & Note-Taking"}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {lang === "hi"
                  ? "बाउंटी हंटिंग में 50% खेल मानसिक धैर्य का है। जब 2 हफ्ते तक बग न मिले तो क्या करें:"
                  : "50% of full-time bug bounty is psychological resilience. How top earners navigate dry spells and timeboxing:"}
              </p>
            </div>

            <div className="space-y-3.5">
              {MINDSET_RULES.map((rule) => (
                <div key={rule.id} className="rounded-lg border border-border/80 bg-slate-950/40 p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      {localize(rule.title, lang)}
                    </h3>
                    <span className="text-[10px] font-mono uppercase bg-violet-950/40 border border-violet-800/40 text-violet-300 px-2 py-0.5 rounded">
                      {localize(rule.badge, lang)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 italic">{localize(rule.subtitle, lang)}</p>

                  <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3 text-xs leading-relaxed text-slate-300">
                    <span className="font-bold text-slate-100 block mb-1">
                      {lang === "hi" ? "💡 मुख्य सीख:" : "💡 Core Rule:"}
                    </span>
                    {localize(rule.coreLesson, lang)}
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">
                      {lang === "hi" ? "एक्शन स्टेप्स:" : "Immediate Action Steps:"}
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {rule.actionSteps.map((step, sIdx) => (
                        <li key={sIdx} className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-[11px] leading-relaxed">{localize(step, lang)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: WHAT NOT TO DO (AVOID BANS & N/A) ── */}
      {activeTab === "donts" && (
        <div className="space-y-6">
          {/* Top Danger Warning Banner */}
          <div className="rounded-xl border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-slate-950/60 to-slate-900/40 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-rose-500/20 p-2 text-rose-300 shrink-0 mt-0.5">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-rose-200 flex items-center gap-2">
                  <span>{lang === "hi" ? "द बाउंटी ब्लैकलिस्ट: ये गलतियां कभी न करें" : "The Hall of Shame & Blacklist Rules"}</span>
                </h2>
                <p className="text-xs leading-relaxed text-slate-300">
                  {lang === "hi"
                    ? "बाउंटी हंटिंग में क्या 'ढूंढना' है, उससे भी ज़्यादा ज़रूरी है यह जानना कि क्या 'नहीं करना' है। नीचे दी गई गलतियों के कारण 90% बिगिनर्स का समय बर्बाद होता है, रिपोर्ट N/A बंद होती है या कानूनी नोटिस / परमानेंट बैन लगता है।"
                    : "Knowing what NOT to do is more critical than knowing tools. Breaking these rules will get your account permanently suspended, trigger legal trouble, or waste weeks on 0-bounty N/A closures."}
                </p>
              </div>
            </div>
          </div>

          {/* 4 Categorized Sections */}
          <div className="space-y-6">
            {dontsCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.id} className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
                  {/* Category Header */}
                  <div className="border-b border-border/80 pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 border border-border text-slate-300">
                          <Icon className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-100">{cat.title}</h3>
                      </div>
                      <span className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full border font-bold ${cat.badgeColor}`}>
                        {cat.badge}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-400 pl-9">{cat.intro}</p>
                  </div>

                  {/* Items List */}
                  <div className="grid grid-cols-1 gap-3.5">
                    {cat.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-border/70 bg-slate-950/40 p-3.5 space-y-2.5 hover:border-slate-700/80 transition"
                      >
                        <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-mono text-slate-400">
                            {idx + 1}
                          </span>
                          {item.what}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                          {/* NEVER DO THIS (Red box) */}
                          <div className="rounded-md border border-rose-900/50 bg-rose-950/25 p-2.5 space-y-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-400">
                              <Ban className="h-3 w-3" />
                              {lang === "hi" ? "गलती (कभी न करें)" : "NEVER DO THIS"}
                            </span>
                            <p className="text-[11px] leading-relaxed text-rose-200/90">{item.never}</p>
                          </div>

                          {/* DO THIS INSTEAD (Green box) */}
                          <div className="rounded-md border border-emerald-900/50 bg-emerald-950/25 p-2.5 space-y-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                              <Check className="h-3 w-3" />
                              {lang === "hi" ? "सही तरीका (PRO METHOD)" : "DO THIS INSTEAD"}
                            </span>
                            <p className="text-[11px] leading-relaxed text-emerald-200/90">{item.correct}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB: READY-TO-SUBMIT BUG REPORT TEMPLATES & ESCALATORS ── */}
      {activeTab === "template" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-400" />
                  {lang === "hi"
                    ? "फास्ट-ट्राइएज रिपोर्ट टेम्पलेट्स और सेवेरिटी एस्केलेटर गाइड"
                    : "Fast-Triage Acceptance Report Templates & Severity Escalators"}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === "hi"
                    ? "सही PoC और इम्पैक्ट स्टेटमेंट के साथ अपनी रिपोर्ट सबमिट करें ताकि ट्राइएजर तुरंत P1/P2 में एक्सेप्ट करे:"
                    : "Use these battle-tested report templates and escalation tactics to avoid 'Informative' closures and maximize payouts:"}
                </p>
              </div>
            </div>

            {/* Template Selector Tabs */}
            <div className="flex flex-wrap gap-2">
              {REPORT_TEMPLATES.map((tpl, idx) => {
                const isSelected = activeReportTemplate === idx;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => setActiveReportTemplate(idx)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition border flex items-center gap-1.5 ${
                      isSelected
                        ? "border-amber-500/50 bg-amber-950/30 text-amber-300 shadow-sm"
                        : "border-border bg-slate-900/40 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>{tpl.vulnType}</span>
                    <span className="text-[10px] rounded bg-slate-800 px-1 py-0.2 text-slate-300">
                      {tpl.severity.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Report Preview */}
            {(() => {
              const currentTpl = REPORT_TEMPLATES[activeReportTemplate] || REPORT_TEMPLATES[0];
              return (
                <div className="space-y-4">
                  {/* Severity Escalation Box */}
                  <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Flame className="h-4 w-4 text-amber-400" />
                        <span className="text-xs font-bold text-amber-300">
                          {lang === "hi" ? "🔥 सेवेरिटी एस्केलेटर टिप (P3 से P1 में कैसे बदलें):" : "🔥 Severity Escalator Strategy (Upgrade to P1):"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-slate-400">{currentTpl.cvssVector}</span>
                        <span className="rounded bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 font-bold text-rose-300">
                          CVSS {currentTpl.cvssScore}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {localize(currentTpl.escalatorTip, lang)}
                    </p>
                  </div>

                  {/* Copyable Report Body */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {localize(currentTpl.title, lang)}
                      </span>
                      <CopyBtn text={currentTpl.sampleReport} />
                    </div>

                    <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[500px] overflow-y-auto pr-2">
                      <code>{currentTpl.sampleReport}</code>
                    </pre>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── TAB 14: FINTECH PLAYBOOK ── */}
      {activeTab === "fintech" && (
        <FintechPlaybookView onPractice={onPractice} />
      )}
    </div>
  );
}
