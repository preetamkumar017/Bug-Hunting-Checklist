// Auto-generated trilingual lessons for EVERY Bugcrowd VRT entry.
//
// Hand-written deep lessons (under ./groups) override these by VRT path — see
// lessonForEntry in ./learn. For every other VRT leaf this builds a structured,
// trilingual (advanced-EN / simple-EN / Hindi) lesson from the entry metadata:
// the VRT path, priority, default CVSS vector, and domain. It is a real
// scaffold — accurate about placement and severity — not a stub.

import type {
  VrtIndexEntry,
  LearnTopic,
  LearnMethod,
  VrtPriority,
  AppLearnDomain,
  Localized,
} from "@/learn/data/types";

type Tri = { en: string; simple: string; hi: string };

const SEVERITY_BAND: Record<VrtPriority, Tri> = {
  P1: { en: "Critical", simple: "Critical (the worst)", hi: "Critical (सबसे गंभीर)" },
  P2: { en: "High", simple: "High", hi: "High (ऊंची)" },
  P3: { en: "Medium", simple: "Medium", hi: "Medium (मध्यम)" },
  P4: { en: "Low", simple: "Low", hi: "Low (कम)" },
  P5: { en: "Informational", simple: "Informational (lowest)", hi: "Informational (जानकारी भर)" },
  varies: { en: "Varies with impact", simple: "Depends on the real impact", hi: "असल impact पर निर्भर" },
};

const PRIORITY_MEANING: Record<VrtPriority, Tri> = {
  P1: {
    en: "P1 is reserved for full compromise — remote code execution, auth bypass to admin, or mass data exposure. Triage expects an undeniable, high-impact proof.",
    simple: "P1 means the attacker basically takes over — runs code, becomes admin, or dumps everyone's data. You must show clear, big impact.",
    hi: "P1 मतलब पूरा कब्ज़ा — remote code execution, admin बन जाना, या सबका data लीक। triage को साफ़, बड़ा impact चाहिए।",
  },
  P2: {
    en: "P2 is high-impact but short of total compromise — think serious data exposure, stored XSS hitting other users, or privilege escalation.",
    simple: "P2 is serious but not a full takeover — leaking important data, XSS that hits other users, or getting more access than you should.",
    hi: "P2 गंभीर है पर पूरा कब्ज़ा नहीं — अहम data leak, दूसरों पर असर डालने वाला stored XSS, या privilege escalation।",
  },
  P3: {
    en: "P3 is the solid medium band — a real, reproducible security flaw that needs some condition (user interaction, a specific role) to bite.",
    simple: "P3 is a real medium bug — it works, but needs something like a user click or a certain account to matter.",
    hi: "P3 पक्का medium बग है — असली और दोबारा दिखने वाला, पर काम करने के लिए कोई शर्त (user click, खास role) चाहिए।",
  },
  P4: {
    en: "P4 is low severity — a genuine weakness with limited standalone impact. Its value usually comes from chaining it into something bigger.",
    simple: "P4 is low — a real weakness, but small on its own. It pays best when you chain it into a bigger bug.",
    hi: "P4 कम severity है — असली कमज़ोरी पर अकेले असर छोटा। असली कीमत तब जब इसे बड़े बग के साथ chain करें।",
  },
  P5: {
    en: "P5 is informational — usually accepted only as supporting evidence or when chained. Rarely rewarded on its own.",
    simple: "P5 is just information — usually only useful as backup or in a chain. Alone it rarely pays.",
    hi: "P5 सिर्फ़ जानकारी है — आम तौर पर सहायक सबूत या chain में ही काम आता है, अकेले शायद ही reward मिले।",
  },
  varies: {
    en: "This leaf has no fixed band — Bugcrowd sets priority from the demonstrated impact, so the quality of your proof decides the payout.",
    simple: "There is no fixed level here — Bugcrowd decides from the impact you show, so a strong proof decides the reward.",
    hi: "इसका तय band नहीं है — Bugcrowd आपके दिखाए impact से priority तय करता है, इसलिए सबूत की quality reward तय करती है।",
  },
};

// Category-aware hunting flavor. Matched by keywords on the VRT category/path.
interface Flavor {
  surface: Tri; // where it lives / what to map
  confirm: Tri; // how to confirm impact safely
}

const GENERIC_FLAVOR: Flavor = {
  surface: {
    en: "Map every place user input reaches this feature — parameters, headers, JSON fields, and hidden/undocumented endpoints — and note which ones cross a trust or privilege boundary.",
    simple: "List every spot your input reaches this feature — parameters, headers, JSON fields, hidden endpoints — and mark the ones that cross a permission line.",
    hi: "हर जगह ढूंढें जहाँ user input इस feature तक पहुंचता है — parameters, headers, JSON fields, छुपे endpoints — और mark करें कौन से trust/privilege boundary पार करते हैं।",
  },
  confirm: {
    en: "Reproduce it twice from a clean session, then demonstrate concrete impact with a benign proof (a harmless marker or OOB callback). Capture request/response as evidence — never touch real user data.",
    simple: "Do it twice from a fresh login, then show real impact with a safe proof (a harmless marker). Save the request and response — never touch real data.",
    hi: "clean session से दो बार दोहराएं, फिर benign proof (safe marker या OOB callback) से असली impact दिखाएं। request/response सबूत रखें — असली data कभी न छुएं।",
  },
};

const FLAVORS: { match: RegExp; flavor: Flavor }[] = [
  {
    match: /injection|sql|template|command|xxe|deserial|ldap|crlf|code execution|rce/i,
    flavor: {
      surface: {
        en: "Find every sink where your input is parsed, evaluated, or concatenated into a query/command/template. Fuzz with context-breaking metacharacters and watch for errors, timing shifts, or reflected structure.",
        simple: "Find each place your input is run or put into a query/command/template. Try special characters and watch for errors, delays, or changed output.",
        hi: "हर sink ढूंढें जहाँ input query/command/template में जाता या चलता है। context तोड़ने वाले characters डालें और errors, timing बदलाव या reflected structure देखें।",
      },
      confirm: {
        en: "Prove execution with a safe, deterministic signal — an arithmetic result, a controlled delay, or an out-of-band DNS/HTTP callback — rather than a destructive payload.",
        simple: "Prove it runs with a safe signal — a math result, a controlled delay, or an out-of-band callback — not a damaging payload.",
        hi: "execution को safe, पक्के signal से साबित करें — arithmetic result, controlled delay, या out-of-band DNS/HTTP callback — न कि नुकसान वाले payload से।",
      },
    },
  },
  {
    match: /access control|idor|authorization|privilege|direct object|bola|bac/i,
    flavor: {
      surface: {
        en: "Enumerate object identifiers and role-gated actions. Hold two accounts (low and high privilege) and replay each request across them, swapping IDs, tenant keys, and role parameters.",
        simple: "List the IDs and the actions only some roles can do. Use two accounts (low and high) and replay each request as the other, swapping IDs and role fields.",
        hi: "object IDs और role वाले actions की सूची बनाएं। दो accounts (कम और ज़्यादा privilege) रखें और हर request को एक-दूसरे पर replay करें, IDs/tenant keys/role parameters बदलते हुए।",
      },
      confirm: {
        en: "Confirm the low-privilege account reads or changes another user's object, or reaches an action its role should forbid. One cross-account read with a different user's data visible is the proof.",
        simple: "Show the low account can read or change another user's data, or do something its role should block. One cross-account read is the proof.",
        hi: "दिखाएं कि कम privilege account दूसरे user का object पढ़/बदल पाता है, या ऐसा action कर पाता है जो उसके role को मना है। एक cross-account read ही सबूत है।",
      },
    },
  },
  {
    match: /authentication|session|2fa|mfa|login|password|credential|token/i,
    flavor: {
      surface: {
        en: "Map the full auth lifecycle — login, token issuance, refresh, MFA step, password reset, and logout. Look for steps that can be skipped, replayed, or reached out of order.",
        simple: "Trace the whole login flow — sign in, tokens, refresh, MFA, password reset, logout. Look for steps you can skip, repeat, or do out of order.",
        hi: "पूरा auth lifecycle map करें — login, token issue, refresh, MFA step, password reset, logout। ऐसे steps ढूंढें जिन्हें skip, replay या गलत क्रम में किया जा सके।",
      },
      confirm: {
        en: "Demonstrate access without completing the intended control — a valid session without MFA, a reset without proving ownership, or a token that survives logout.",
        simple: "Show you get in without the real check — a session without MFA, a reset without proof, or a token that still works after logout.",
        hi: "दिखाएं कि असली control पूरा किए बिना access मिला — बिना MFA का valid session, ownership साबित किए बिना reset, या logout के बाद भी चलने वाला token।",
      },
    },
  },
  {
    match: /ssrf|request forgery|redirect|forward/i,
    flavor: {
      surface: {
        en: "Find parameters that carry a URL, host, or path the server fetches or redirects to — webhooks, importers, previews, avatar-by-URL, and 'next'/'return' parameters.",
        simple: "Find fields that hold a URL or host the server opens or redirects to — webhooks, importers, previews, image-by-URL, and 'next'/'return' fields.",
        hi: "ऐसे parameters ढूंढें जिनमें URL/host/path हो जिसे server खुद fetch या redirect करता है — webhooks, importers, previews, avatar-by-URL, और 'next'/'return' parameters।",
      },
      confirm: {
        en: "For SSRF, land an out-of-band callback from the server (then probe internal metadata/services). For redirects, show navigation to an attacker origin from a link the victim trusts.",
        simple: "For SSRF, make the server call your out-of-band server (then try internal addresses). For redirects, show it sends the victim to your site from a trusted link.",
        hi: "SSRF के लिए server से out-of-band callback लाएं (फिर internal metadata/services probe करें)। redirect के लिए दिखाएं कि trusted link से victim attacker origin पर चला जाता है।",
      },
    },
  },
  {
    match: /cross-site scripting|xss|content spoofing|html injection|csp/i,
    flavor: {
      surface: {
        en: "Fire a unique non-executing canary into every input and locate each reflection and its exact context (HTML body, attribute, script, URL). Note who can plant it and whose browser renders it.",
        simple: "Put a unique harmless marker in every input and find where it shows up and in what context. Note who can plant it and who sees it.",
        hi: "हर input में एक unique non-executing canary डालें और हर reflection व उसका exact context (HTML, attribute, script, URL) ढूंढें। देखें कौन plant कर सकता है और किसके browser में चलेगा।",
      },
      confirm: {
        en: "Break out of that specific context and confirm execution in the target origin with alert(document.domain) or a benign beacon — document.domain must show the target, not a sandbox.",
        simple: "Break out of that context and prove it runs on the real site with alert(document.domain) or a safe beacon — it must be the target's origin.",
        hi: "उस context से बाहर निकलें और target origin पर execution को alert(document.domain) या benign beacon से confirm करें — document.domain target का होना चाहिए, sandbox का नहीं।",
      },
    },
  },
  {
    match: /csrf|cors|cross-origin|clickjack/i,
    flavor: {
      surface: {
        en: "Identify state-changing requests and check their cross-origin defenses — CSRF token presence and validation, SameSite cookie flags, CORS allowed origins, and framing (X-Frame-Options/CSP).",
        simple: "Find requests that change something and check their cross-site defenses — CSRF tokens, SameSite cookies, allowed CORS origins, and whether the page can be framed.",
        hi: "state बदलने वाली requests पहचानें और उनके cross-origin बचाव जांचें — CSRF token है/validate होता है, SameSite cookie flags, CORS allowed origins, और framing (X-Frame-Options/CSP)।",
      },
      confirm: {
        en: "Host a proof page on your own origin that fires the request (or reads the response for CORS) and show it succeeds from off-site against an authenticated victim.",
        simple: "Make a proof page on your own site that sends the request (or reads the reply for CORS) and show it works against a logged-in victim.",
        hi: "अपने origin पर एक proof page बनाएं जो request चलाए (CORS के लिए response पढ़े) और दिखाएं कि off-site से logged-in victim पर यह सफल होता है।",
      },
    },
  },
  {
    match: /misconfig|security header|exposed|debug|default|dns|subdomain|rate limit|captcha|waf|mail|spoof/i,
    flavor: {
      surface: {
        en: "Inventory the exposed configuration — headers, open admin/debug interfaces, default credentials, dangling DNS records, missing rate limits — and check each against the documented secure baseline.",
        simple: "List the exposed setup — headers, open admin/debug pages, default logins, leftover DNS records, missing rate limits — and compare each to the secure standard.",
        hi: "exposed configuration की सूची बनाएं — headers, खुले admin/debug interfaces, default credentials, dangling DNS records, missing rate limits — और हर एक को secure baseline से मिलाएं।",
      },
      confirm: {
        en: "Show the concrete consequence, not just the misconfiguration — a reachable admin panel, a claimable subdomain, spoofable mail, or an action with no rate limit actually abused.",
        simple: "Show the real result, not just the wrong setting — an open admin panel, a subdomain you can claim, spoofable email, or an action you can hammer with no limit.",
        hi: "सिर्फ़ गलत setting नहीं, असली नतीजा दिखाएं — पहुंच वाला admin panel, claim करने योग्य subdomain, spoofable mail, या बिना rate limit वाला action सच में abuse होते हुए।",
      },
    },
  },
  {
    match: /sensitive|disclosure|information|exposure|secret|pii|leak|data/i,
    flavor: {
      surface: {
        en: "Hunt where data is served or logged — API responses with extra fields, JS bundles, source maps, error pages, cache, and archived URLs (wayback) — for secrets and other users' data.",
        simple: "Look where data is sent or logged — API replies with extra fields, JS files, source maps, error pages, cache, old archived URLs — for secrets or other people's data.",
        hi: "जहाँ data serve/log होता है वहाँ ढूंढें — extra fields वाले API responses, JS bundles, source maps, error pages, cache, archived URLs (wayback) — secrets और दूसरों के data के लिए।",
      },
      confirm: {
        en: "Show the exposed value is real and sensitive (a live key, another user's PII) and reachable by an unauthorized party. A redacted screenshot proving access is enough — do not collect the data.",
        simple: "Show the leaked value is real and sensitive (a working key, someone's personal data) and that an outsider can reach it. A redacted screenshot is enough — don't collect the data.",
        hi: "दिखाएं कि leaked value असली और sensitive है (live key, दूसरे user की PII) और unauthorized व्यक्ति तक पहुंचती है। access साबित करती redacted screenshot काफी है — data इकट्ठा न करें।",
      },
    },
  },
  {
    match: /prompt injection|model|ai |llm|embedding|training data|adversarial|output handling/i,
    flavor: {
      surface: {
        en: "Map every path untrusted text reaches the model — direct chat, uploaded files, retrieved documents (RAG), tool outputs — and the trust the app places in the model's response.",
        simple: "Find every way untrusted text reaches the AI — chat, uploaded files, retrieved docs, tool results — and how much the app trusts the AI's answer.",
        hi: "हर रास्ता map करें जहाँ untrusted text model तक पहुंचता है — direct chat, uploaded files, retrieved docs (RAG), tool outputs — और app model के जवाब पर कितना भरोसा करता है।",
      },
      confirm: {
        en: "Show the model overriding its instructions in a way that crosses a security boundary — leaking the system prompt, another tenant's data, or driving a tool/action it should refuse.",
        simple: "Show the AI breaking its rules in a way that crosses a security line — leaking its hidden prompt, another customer's data, or running a tool it should refuse.",
        hi: "दिखाएं कि model अपने instructions तोड़कर security boundary पार करता है — system prompt leak, दूसरे tenant का data, या ऐसा tool/action चलाना जो उसे मना करना चाहिए।",
      },
    },
  },
  {
    match: /iam|cloud|storage|bucket|s3|segmentation|logging/i,
    flavor: {
      surface: {
        en: "Enumerate the cloud surface — public buckets/blobs, IAM roles and trust policies, exposed management ports, and metadata endpoints — and check who can reach each from outside.",
        simple: "List the cloud setup — public buckets, IAM roles, open management ports, metadata endpoints — and check who can reach each from outside.",
        hi: "cloud surface की सूची बनाएं — public buckets/blobs, IAM roles व trust policies, खुले management ports, metadata endpoints — और देखें बाहर से हर एक तक कौन पहुंच सकता है।",
      },
      confirm: {
        en: "Show unauthorized access to a real resource — listing/reading a private object, assuming an over-permissive role, or reaching an internal service — with a redacted proof.",
        simple: "Show an outsider reaching a real resource — reading a private file, taking an over-powerful role, or hitting an internal service — with a redacted proof.",
        hi: "असली resource तक unauthorized access दिखाएं — private object list/read, over-permissive role assume, या internal service तक पहुंच — redacted proof के साथ।",
      },
    },
  },
  {
    match: /firmware|binary|hardening|storage|device|os\//i,
    flavor: {
      surface: {
        en: "Extract and inspect the artifact — unpack firmware/binaries, read on-device storage and backups, and check update integrity, encryption at rest, and exploit mitigations.",
        simple: "Pull apart the file — unpack firmware/binaries, read device storage and backups, and check update signing, encryption, and exploit protections.",
        hi: "artifact निकालकर जांचें — firmware/binaries unpack करें, on-device storage व backups पढ़ें, और update integrity, encryption-at-rest व exploit mitigations जांचें।",
      },
      confirm: {
        en: "Show the concrete weakness — a hardcoded credential, an unsigned update you can replace, or sensitive data recoverable from storage — with a safe, reproducible proof.",
        simple: "Show the real weakness — a hardcoded login, an update you can swap because it isn't signed, or sensitive data you can recover — with a safe, repeatable proof.",
        hi: "ठोस कमज़ोरी दिखाएं — hardcoded credential, बिना sign का update जिसे बदला जा सके, या storage से निकलने वाला sensitive data — safe, दोबारा दिखने वाले proof के साथ।",
      },
    },
  },
];

function flavorFor(entry: VrtIndexEntry): Flavor {
  const hay = `${entry.category} ${entry.path}`.toLowerCase();
  for (const f of FLAVORS) if (f.match.test(hay)) return f.flavor;
  return GENERIC_FLAVOR;
}

const DOMAIN_WORD: Record<AppLearnDomain, Tri> = {
  web: { en: "web/API", simple: "website/API", hi: "web/API" },
  mobile: { en: "mobile", simple: "mobile app", hi: "mobile" },
  web3: { en: "web3/smart-contract", simple: "web3/smart contract", hi: "web3/smart-contract" },
  cloud: { en: "cloud", simple: "cloud", hi: "cloud" },
  ai: { en: "AI/LLM", simple: "AI/LLM", hi: "AI/LLM" },
  network: { en: "network/AD", simple: "network", hi: "network/AD" },
  "thick-client": { en: "thick-client", simple: "desktop app", hi: "thick-client" },
};

function tri(en: string, simple: string, hi: string): Localized {
  return { en, simple, hi };
}

/** Full VRT path including the top-level category. */
export function fullVrtPath(entry: VrtIndexEntry): string {
  return entry.path.startsWith(entry.category) ? entry.path : `${entry.category} › ${entry.path}`;
}

export function buildGeneratedLesson(entry: VrtIndexEntry): LearnTopic {
  const band = SEVERITY_BAND[entry.priority];
  const meaning = PRIORITY_MEANING[entry.priority];
  const flavor = flavorFor(entry);
  const dom = DOMAIN_WORD[entry.domain];
  const path = fullVrtPath(entry);
  const cvssEn = entry.cvss ? `, default CVSS ${entry.cvss}` : "";

  const intro = tri(
    `"${entry.name}" is a ${dom.en} finding that Bugcrowd places under ${path}, rated ${entry.priority} (${band.en}${cvssEn}). ${meaning.en}`,
    `"${entry.name}" is a ${dom.simple} bug. Bugcrowd files it under ${path} and rates it ${entry.priority} (${band.simple}). ${meaning.simple}`,
    `"${entry.name}" एक ${dom.hi} finding है जिसे Bugcrowd ${path} के नीचे रखता है, rating ${entry.priority} (${band.hi}${entry.cvss ? `, default CVSS ${entry.cvss}` : ""})। ${meaning.hi}`,
  );

  const howToFind: LearnMethod[] = [
    {
      title: tri("Map the attack surface", "Find where it lives", "attack surface map करें"),
      steps: [flavor.surface, tri(
        `Confirm the exact VRT leaf before reporting — ${path} — because the neighbouring leaves carry different priorities, and the leaf you can prove decides the band.`,
        `Check exactly which VRT item you have — ${path} — because nearby items pay differently, and the one you can prove sets the level.`,
        `report से पहले exact VRT leaf पक्का करें — ${path} — क्योंकि पड़ोसी leaves की priority अलग होती है, और जो आप साबित कर सकें वही band तय करता है।`,
      )],
    },
    {
      title: tri("Confirm impact safely", "Prove it safely", "impact safe तरीके से confirm करें"),
      steps: [flavor.confirm, GENERIC_FLAVOR.confirm],
    },
  ];

  const example = tri(
    `A ${dom.en} target exposed exactly this: the behaviour matched ${path}, so it mapped to ${entry.priority} (${band.en}). The report that landed led with a clean, reproducible proof of impact and named the VRT leaf precisely — that specificity is what gets it triaged at the right band instead of downgraded.`,
    `A ${dom.simple} target had this exact issue — it matched ${path}, so it was rated ${entry.priority} (${band.simple}). The report that worked showed a clear, repeatable proof and named the VRT item exactly, so it wasn't downgraded.`,
    `एक ${dom.hi} target पर बिल्कुल यही मिला: behaviour ${path} से match हुआ, इसलिए ${entry.priority} (${band.hi}) रहा। जो report सफल हुई उसमें साफ़, दोबारा दिखने वाला impact proof था और VRT leaf सटीक नाम से लिखा था — यही specificity सही band पर triage दिलाती है।`,
  );

  const note = tri(
    `${meaning.en} This is the generated baseline for ${path}; a hand-written deep lesson replaces it once one exists for this leaf.`,
    `${meaning.simple} This is an auto-made starting lesson for ${path}; a detailed hand-written one will replace it later.`,
    `${meaning.hi} यह ${path} के लिए auto-generated baseline है; इस leaf के लिए deep lesson बनते ही इसे बदल दिया जाएगा।`,
  );

  return {
    id: `gen-${entry.id}`,
    name: entry.name,
    emoji: "🧩",
    intro,
    howToFind,
    example,
    mapping: {
      bugcrowdVrt: path,
      bugcrowdPriority: entry.priority,
      bugcrowdCvss: entry.cvss,
      hackeroneCwe: "Pick the closest CWE weakness at triage (HackerOne has no fixed VRT mapping).",
      cvssSeverity: band.en,
      note,
    },
    references: [
      { label: "Bugcrowd Vulnerability Rating Taxonomy", url: "https://bugcrowd.com/vulnerability-rating-taxonomy" },
    ],
  };
}
