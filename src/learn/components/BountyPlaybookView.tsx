import { useState } from "react";
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
} from "lucide-react";
import { LEARN_LANGS, type Lang } from "@/learn/data/types";

interface BountyPlaybookProps {
  onPractice?: (categoryId: string) => void;
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

export function BountyPlaybookView({ onPractice }: BountyPlaybookProps) {
  const [lang, setLangState] = useState<Lang>(loadLang);
  const [activeTab, setActiveTab] = useState<"targets" | "bugs" | "routine" | "template">("targets");
  const [activeBug, setActiveBug] = useState<number>(0);

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
      en: "🎯 Target Selection Strategy",
      simple: "🎯 How to Pick Targets",
      hi: "🎯 टारगेट सिलेक्शन रणनीति",
    }[lang],
    tabBugs: {
      en: "🔥 Top 6 Most Common Bugs",
      simple: "🔥 6 Easiest Paid Bugs",
      hi: "🔥 टॉप 6 सबसे आम बग्स",
    }[lang],
    tabRoutine: {
      en: "⚡ Daily 'Confirm Hit' Routine",
      simple: "⚡ Daily Hunting Plan",
      hi: "⚡ 'बग कन्फर्म' डेली रूटीन",
    }[lang],
    tabTemplate: {
      en: "📝 Fast-Triage Report Template",
      simple: "📝 Winning Report Format",
      hi: "📝 फास्ट-ट्राइएज रिपोर्ट टेम्पलेट",
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
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab("targets")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
            activeTab === "targets"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
              : "border border-border bg-card text-slate-400 hover:text-slate-200"
          }`}
        >
          {t.tabTargets}
        </button>
        <button
          onClick={() => setActiveTab("bugs")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
            activeTab === "bugs"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
              : "border border-border bg-card text-slate-400 hover:text-slate-200"
          }`}
        >
          {t.tabBugs}
        </button>
        <button
          onClick={() => setActiveTab("routine")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
            activeTab === "routine"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
              : "border border-border bg-card text-slate-400 hover:text-slate-200"
          }`}
        >
          {t.tabRoutine}
        </button>
        <button
          onClick={() => setActiveTab("template")}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
            activeTab === "template"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
              : "border border-border bg-card text-slate-400 hover:text-slate-200"
          }`}
        >
          {t.tabTemplate}
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

      {/* ── TAB 2: TOP 6 MOST COMMON BUGS ── */}
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

      {/* ── TAB 3: DAILY ROUTINE ── */}
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
        </div>
      )}

      {/* ── TAB 4: FAST-TRIAGE REPORT TEMPLATE ── */}
      {activeTab === "template" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-400" />
                  {lang === "hi" ? "फास्ट-ट्राइएज रिपोर्ट टेम्पलेट" : "Fast-Triage Acceptance Report Template"}
                </h2>
                <p className="text-xs text-slate-400">
                  {lang === "hi"
                    ? "इस फ़ॉर्मेट को कॉपी करके अपनी रिपोर्ट बनाएं — ट्राइएज टीम 5 मिनट में अप्रूव करेगी:"
                    : "Copy this exact structured template into your bug reports for instant triage approval:"}
                </p>
              </div>
              <CopyBtn
                text={`**Title:** [P1/P2] Vulnerability Type in /path/to/endpoint leads to [Worst Business Impact]

**Vulnerability Type:** Insecure Direct Object Reference (IDOR)
**Affected Endpoint:** POST /api/v1/user/{user_id}/billing/invoices
**Severity:** High / Critical (P1)

### Summary:
A critical access control flaw was identified in the billing endpoint. An authenticated attacker can modify, delete, or exfiltrate private financial invoices of any other user on the platform by replacing their own identifier with the victim's identifier.

### Prerequisites:
- Attacker Account ID: 10042
- Victim Account ID: 10089

### Step-by-Step Reproduction:
1. Log into the platform using Attacker credentials (User A).
2. Intercept the invoice export request in Burp Suite:
\`\`\`http
POST /api/v1/user/10042/billing/invoices HTTP/1.1
Host: target.com
Authorization: Bearer <ATTACKER_TOKEN>
Content-Type: application/json

{"export_format": "pdf"}
\`\`\`
3. Change the user_id parameter in the URL from 10042 to the Victim ID (10089).
4. Send the modified request.
5. Observe the 200 OK response containing Victim User B's full invoice receipt and financial PII.

### Non-Destructive Testing Statement:
Testing was strictly non-destructive and performed exclusively between my two authorized test accounts (User A: 10042 and User B: 10089). Zero production customer data was accessed, modified, or downloaded.`}
              />
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
{`**Title:** [P1/P2] Vulnerability Type in /path/to/endpoint leads to [Worst Business Impact]

**Vulnerability Type:** Insecure Direct Object Reference (IDOR)
**Affected Endpoint:** POST /api/v1/user/{user_id}/billing/invoices
**Severity:** High / Critical (P1)

### Summary:
A critical access control flaw was identified in the billing endpoint. An authenticated attacker can modify, delete, or exfiltrate private financial invoices of any other user on the platform by replacing their own identifier with the victim's identifier.

### Prerequisites:
- Attacker Account ID: 10042
- Victim Account ID: 10089

### Step-by-Step Reproduction:
1. Log into the platform using Attacker credentials (User A).
2. Intercept the invoice export request in Burp Suite:
\`\`\`http
POST /api/v1/user/10042/billing/invoices HTTP/1.1
Host: target.com
Authorization: Bearer <ATTACKER_TOKEN>
Content-Type: application/json

{"export_format": "pdf"}
\`\`\`
3. Change the user_id parameter in the URL from 10042 to the Victim ID (10089).
4. Send the modified request.
5. Observe the 200 OK response containing Victim User B's full invoice receipt and financial PII.

### Non-Destructive Testing Statement:
Testing was strictly non-destructive and performed exclusively between my two authorized test accounts (User A: 10042 and User B: 10089). Zero production customer data was accessed, modified, or downloaded.`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
