import type { Lang } from "./types";

export interface FintechVulnScenario {
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  requestSample?: string;
  responseSample?: string;
  impact: Record<Lang, string>;
}

export interface FintechVulnClass {
  id: string;
  title: Record<Lang, string>;
  cwe: string;
  vrt: string;
  bountyRange: string;
  severity: "critical" | "high" | "medium";
  summary: Record<Lang, string>;
  scenarios: FintechVulnScenario[];
  testingRecipe: Record<Lang, string>[];
  burpRules: string[];
  hunterProTip: Record<Lang, string>;
}

export interface FintechPhase {
  phase: number;
  title: Record<Lang, string>;
  objective: Record<Lang, string>;
  steps: Record<Lang, string>[];
  commandsOrPayloads?: string[];
  keyTargets: string[];
}

export interface FintechToolSnippet {
  id: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  category: "race_condition" | "mobile_frida" | "burp_rules" | "fuzz_payloads";
  code: string;
  language: "python" | "javascript" | "json" | "bash";
  howToUse: Record<Lang, string>;
}

export interface FintechReportTemplate {
  id: string;
  title: Record<Lang, string>;
  vulnType: string;
  cvss: string;
  severity: "critical" | "high";
  reportMarkdown: string;
}

// ─── 1. TOP HIGH-YIELD FINTECH VULNERABILITY CLASSES ─────────────────────────
export const FINTECH_VULN_CLASSES: FintechVulnClass[] = [
  {
    id: "amount-tampering",
    title: {
      en: "Payment Amount & Currency Tampering",
      simple: "Change Prices, Pay 1 Cent, or Negative Balances",
      hi: "पेमेंट अमाउंट और करेंसी में छेड़छाड़ (कम पैसे में ज्यादा खरीदना)",
    },
    cwe: "CWE-602: Client-Side Enforcement of Server-Side Security",
    vrt: "Server-Side Injection › Parameter Tampering › Price / Amount Manipulation",
    bountyRange: "$3,000 – $15,000 (P1 Critical)",
    severity: "critical",
    summary: {
      en: "Payment calculation logic trusted from client request parameters. Attackers modify purchase prices to 0.01, negative numbers, or alter currency units to pay negligible amounts.",
      simple: "The website asks your phone or browser 'how much does this cost?' instead of checking its own database. You can change $1000 to $0.01.",
      hi: "वेबसाइट सर्वर अपने डेटाबेस की जगह यूजर के ब्राउज़र द्वारा भेजी गई कीमत पर भरोसा कर लेता है। अटैकर ₹10,000 के सामान को ₹1 या नेगेटिव अमाउंट बनाकर फ्री में खरीद लेता है।",
    },
    scenarios: [
      {
        title: {
          en: "Negative Amount Wallet Addition / Refund Abuse",
          simple: "Negative Amount Exploit",
          hi: "नेगेटिव अमाउंट डालकर वॉलेट बैलेंस बढ़ाना",
        },
        description: {
          en: "Sending `\"amount\": -500` in a transfer or cart checkout. If subtracting a negative integer, the math converts to addition: `balance - (-500) = balance + 500`.",
          simple: "Putting -500 in the amount field. Subtracting a negative number turns into addition, crediting free funds into your account.",
          hi: "अमाउंट में `-500` भेजने पर सर्वर जब बैलेंस से काटता है, तो गणितीय नियम से माइनस-माइनस प्लस हो जाता है और खाते में पैसे जुड़ जाते हैं।",
        },
        requestSample: `POST /api/v2/wallet/transfer HTTP/2
Host: pay.targetfintech.com
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "recipient_id": "usr_9921",
  "amount": -500.00,
  "currency": "USD",
  "note": "Reversal"
}`,
        impact: {
          en: "Direct financial theft, arbitrary balance creation without deposit.",
          simple: "Free money generated out of thin air.",
          hi: "बिना पैसे जमा किए अनगिनत वॉलेट बैलेंस बनाना।",
        },
      },
      {
        title: {
          en: "Currency Arbitrage Manipulation",
          simple: "Currency Code Switching (USD to JPY)",
          hi: "करेंसी कोड बदलकर डॉलर की जगह येन में पे करना",
        },
        description: {
          en: "Modifying `\"currency\": \"USD\"` to `\"currency\": \"JPY\"` or `\"IDR\"` while keeping the numerical price unchanged. 100 USD becomes 100 JPY (~$0.65 USD).",
          simple: "Changing USD to Japanese Yen or Indonesian Rupiah. You pay 100 Yen instead of 100 Dollars for the same product.",
          hi: "करेंसी को USD से बदलकर JPY (येन) कर देना। सामान $100 का रहता है लेकिन गेटवे सिर्फ 100 येन (लगभग 50 रुपये) काटता है।",
        },
        requestSample: `POST /api/v1/checkout/create-intent HTTP/2
Host: api.targetfintech.com
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "order_id": "ord_882910",
  "amount": 499.00,
  "currency": "JPY"
}`,
        impact: {
          en: "Massive discount exploitation / purchasing financial assets at 99% discount.",
          simple: "Buying 1000 dollar crypto or stocks for 1000 yen (under 7 dollars).",
          hi: "99% से ज्यादा के डिस्काउंट पर क्रिप्टोकरेंसी या स्टॉक्स खरीद लेना।",
        },
      },
      {
        title: {
          en: "Callback / Webhook Signature Spoofing",
          simple: "Faking Payment Gateway Success Response",
          hi: "पेमेंट गेटवे का नकली सक्सेस रिस्पॉन्स भेजना",
        },
        description: {
          en: "Intercepting payment redirect or simulating webhook POST. Changing `payment_status: \"FAILED\"` to `\"SUCCESS\"` or `\"CAPTURED\"` when HMAC signature verification is missing.",
          simple: "When payment fails, intercepting the signal and telling the website 'Payment Succeeded!' because the website forgets to verify the secret signature.",
          hi: "पेमेंट कैंसिल करने के बाद सर्वर पर जाने वाले रिस्पॉन्स में `status: FAILED` को `CAPTURED` कर देना क्योंकि सर्वर सीक्रेट सिग्नेचर चेक करना भूल जाता है।",
        },
        impact: {
          en: "Unpaid order fulfillment, fake deposit confirmation.",
          simple: "Orders get delivered without any real money charged.",
          hi: "बिना किसी पेमेंट के आर्डर सक्सेसफुल प्रोसेस हो जाता है।",
        },
      },
    ],
    testingRecipe: [
      {
        en: "1. Capture checkout or wallet load request in Burp Suite.",
        simple: "1. Trap the payment request in Burp Suite.",
        hi: "1. बर्प सुइट में चेकआउट या वॉलेट रिचार्ज रिक्वेस्ट को कैप्चर करें।",
      },
      {
        en: "2. Test boundary values: `0`, `0.01`, `-1`, `-0.01`, `0.0000001` (fractional satoshi rounding), and `999999999999999` (integer overflow).",
        simple: "2. Test weird numbers like 0, negative 1, 0.00001, and super huge numbers.",
        hi: "2. अमाउंट में 0, 0.01, -1, या 0.0000001 जैसे नंबर्स डालकर रिस्पॉन्स देखें।",
      },
      {
        en: "3. Test quantity parameters: `quantity: 0`, `quantity: -1`, `quantity: 0.1`.",
        simple: "3. Change quantity to 0 or negative numbers.",
        hi: "3. क्वांटिटी में -1 या 0 डालकर कुल बिल की जांच करें।",
      },
      {
        en: "4. Test currency swap: replace `USD`/`EUR` with `JPY`, `VND`, `IDR`, `INR`.",
        simple: "4. Change the currency code to a currency with low unit value like JPY.",
        hi: "4. करेंसी को बदलकर JPY या VND करें और देखें कि गेटवे कितना चार्ज करता है।",
      },
      {
        en: "5. Test Webhooks: send the webhook payload directly from Repeater without HMAC header.",
        simple: "5. Send the webhook confirmation directly to see if it accepts without signature.",
        hi: "5. बिना HMAC सिग्नेचर के सीधे वेबहुक एंडपॉइंट पर सक्सेस पेलोड भेजें।",
      },
    ],
    burpRules: [
      "Match: \"amount\":\\s*(\\d+) ➔ Replace: \"amount\": 0.01",
      "Match: \"currency\":\\s*\"USD\" ➔ Replace: \"currency\": \"JPY\"",
      "Match: \"status\":\\s*\"failed\" ➔ Replace: \"status\": \"success\"",
    ],
    hunterProTip: {
      en: "Never test with real $10,000 deposits! Load $1, attempt to buy a $2 item with modified parameters. If successful, STOP IMMEDIATELY and draft the report. Never drain production liquidity pools.",
      simple: "Do not test with big money. If a $2 item goes through for $0.01, you have full proof. Stop right there and report it.",
      hi: "कभी भी बड़े अमाउंट पर लाइव टेस्ट न करें। ₹10 के रिचार्ज को ₹1 में टेस्ट करें। जैसे ही बग कंफर्म हो, तुरंत रिपोर्ट ड्राफ्ट करें।",
    },
  },
  {
    id: "financial-race-conditions",
    title: {
      en: "Wallet & Balance Race Conditions (TOCTOU)",
      simple: "Spending the Same Money Twice at the Same Time",
      hi: "फाइनेंशियल रेस कंडीशंस (एक ही पैसे को दो बार खर्च करना)",
    },
    cwe: "CWE-362: Concurrent Execution using Shared Resource with Improper Synchronization",
    vrt: "Server-Side Injection › Race Condition › Financial / Balance Double-Spend",
    bountyRange: "$5,000 – $25,000 (P1 Critical)",
    severity: "critical",
    summary: {
      en: "Time-of-Check to Time-of-Use (TOCTOU) flaws where banking backends check account balance before acquiring a database row lock. Submitting simultaneous parallel requests causes multiple transactions to read the same pre-deduction balance.",
      simple: "If you have $50 in your wallet and send two $50 withdrawal requests in the exact same millisecond, the bank checks 'Does he have $50?' twice before deducting, giving you $100.",
      hi: "जब सर्वर डेटाबेस में बैलेंस लॉक करने से पहले चेक करता है, तो एक ही मिलीसेकंड में 20 रिक्वेस्ट भेजने पर सर्वर सभी को 'पर्याप्त बैलेंस' मान लेता है और वॉलेट से दोगुने पैसे निकल जाते हैं।",
    },
    scenarios: [
      {
        title: {
          en: "Simultaneous Withdrawal / P2P Transfer Double-Spend",
          simple: "Double-Spend in Wallet Withdrawals",
          hi: "वॉलेट से दो बार निकासी (डबल-स्पेंड)",
        },
        description: {
          en: "User has $100 balance. Sends 15 concurrent HTTP/2 requests to transfer $100 to another user. If backend lacks atomic transactions (`SELECT ... FOR UPDATE`), 3-5 requests succeed before balance hits zero.",
          simple: "Using HTTP/2 to bundle 15 transfer requests in one single TCP packet. Multiple transfers succeed before the database deducts the balance.",
          hi: "HTTP/2 सिंगल-पैकेट अटैक से एक ही पैकेट में 15 ट्रांसफर रिक्वेस्ट भेजना जिससे एक ही ₹100 बैलेंस 5 अलग-अलग खातों में क्रेडिट हो जाए।",
        },
        impact: {
          en: "Infinite money generation, draining platform hot-wallets.",
          simple: "Stealing company funds by duplicating your balance.",
          hi: "कंपनी के हॉट वॉलेट को खाली कर देना और डुप्लीकेट मनी बनाना।",
        },
      },
      {
        title: {
          en: "Promo Code & Welcome Bonus Multi-Redemption",
          simple: "Using a 1-time Coupon 10 Times Simultaneously",
          hi: "वन-टाइम कूपन या रेफरल बोनस को 10 बार भुनाना",
        },
        description: {
          en: "A $20 new-user referral code is designed for single use. By firing 20 parallel requests to `/api/v1/coupons/apply`, the single-use check passes concurrently on all threads, adding $400 bonus.",
          simple: "Firing 20 requests at once when applying a $20 coupon. The server lets all 20 through before marking the coupon as used.",
          hi: "एक बार इस्तेमाल होने वाले ₹500 के कूपन को एक साथ 20 थ्रेड्स से रिडीम करना, जिससे ₹10,000 का फ्री क्रेडिट मिल जाता है।",
        },
        impact: {
          en: "Bonus abuse, financial loss via promotional credit laundering.",
          simple: "Multiplying bonus vouchers endlessly.",
          hi: "कंपनी के प्रोमोशनल फंड्स को असीमित रूप से लूटना।",
        },
      },
      {
        title: {
          en: "Gift Card / Crypto Voucher Redemption Race",
          simple: "Redeeming One Voucher on Two Accounts",
          hi: "एक ही गिफ्ट कार्ड को दो अलग-अलग अकाउंट्स में एक साथ रिडीम करना",
        },
        description: {
          en: "Redeeming a single gift card code on Account A and Account B simultaneously. Both accounts get credited before the card is marked 'REDEEMED' in the database.",
          simple: "Submitting the voucher code from two accounts at the exact same millisecond. Both accounts get the credit.",
          hi: "दो अलग-अलग अकाउंट्स से एक ही गिफ्ट कार्ड को एक साथ क्लेम करना। दोनों अकाउंट्स में बैलेंस जुड़ जाता है।",
        },
        impact: {
          en: "Voucher duplication and cash-out.",
          simple: "Doubling gift card value.",
          hi: "गिफ्ट कार्ड वैल्यू को दोगुना करना।",
        },
      },
    ],
    testingRecipe: [
      {
        en: "1. Send target transaction request to Burp Suite Repeater.",
        simple: "1. Send the request to Burp Repeater.",
        hi: "1. ट्रांजैक्शन रिक्वेस्ट को बर्प रिपीटर में भेजें।",
      },
      {
        en: "2. Right click -> Send to Turbo Intruder (Extension).",
        simple: "2. Send it to Turbo Intruder.",
        hi: "2. राइट क्लिक करके Turbo Intruder एक्सटेंशन में भेजें।",
      },
      {
        en: "3. Use the HTTP/2 Single-Packet Attack python script (provided in Tools tab).",
        simple: "3. Select the race-condition single packet attack script.",
        hi: "3. HTTP/2 सिंगल-पैकेट अटैक स्क्रिप्ट लोड करें।",
      },
      {
        en: "4. Set concurrent connections to 20-30 and fire simultaneously.",
        simple: "4. Fire 20 requests at the exact same time.",
        hi: "4. 20-30 रिक्वेस्ट को एक ही मिलीसेकंड में फायर करें।",
      },
      {
        en: "5. Check transaction ledger: did balance go negative? Were multiple transactions recorded?",
        simple: "5. Check your balance: did you get credited twice or did your balance go negative?",
        hi: "5. बैलेंस चेक करें: क्या बैलेंस माइनस हुआ या 2 बार क्रेडिट हुआ?",
      },
    ],
    burpRules: [
      "Turbo Intruder: engine=Engine.BURP2 with req.gate() synchronization barrier",
      "Repeater: Group tabs in a Tab Group -> Send Group in Parallel (HTTP/2)",
    ],
    hunterProTip: {
      en: "Always use HTTP/2! In HTTP/1.1, TCP jitter prevents true simultaneous delivery. HTTP/2 multiplexing guarantees all requests arrive in the exact same TCP packet window.",
      simple: "Always use HTTP/2 for race conditions. It sends all requests inside one single network packet so the server processes them at the exact same time.",
      hi: "हमेशा HTTP/2 का इस्तेमाल करें! HTTP/2 सिंगल पैकेट अटैक में सभी 20 रिक्वेस्ट एक ही पैकेट में जाती हैं जिससे रेस कंडीशन सफल होने की संभावना 95% बढ़ जाती है।",
    },
  },
  {
    id: "fintech-idor-bola",
    title: {
      en: "Financial IDOR & BOLA on Banking APIs",
      simple: "Steal Other Users' Bank Details and Balances",
      hi: "बैंकिंग APIs में IDOR और BOLA (दूसरों के बैंक डिटेल्स और बैलेंस चुराना)",
    },
    cwe: "CWE-639: Insecure Direct Object References",
    vrt: "Server-Side Injection › Insecure Direct Object Reference (IDOR) › Financial Assets",
    bountyRange: "$2,500 – $12,000 (P1 / P2)",
    severity: "critical",
    summary: {
      en: "APIs exposing customer identifiers (account_id, wallet_id, beneficiary_id) without validating whether the requesting session owns the referenced financial object.",
      simple: "Changing an account ID in the web link from 1001 to 1002 lets you see another person's bank statements, or send their money to your account.",
      hi: "API में अपने अकाउंट नंबर की जगह किसी दूसरे यूजर का अकाउंट नंबर डालने पर सर्वर बिना ऑथराइजेशन चेक किए उसका पूरा बैंक स्टेटमेंट या बैलेंस दिखा देता है।",
    },
    scenarios: [
      {
        title: {
          en: "Transfer Funds by Tampering `from_account`",
          simple: "Debit Money from Victim's Account",
          hi: "`from_account` बदलकर पीड़ित के खाते से पैसे भेजना",
        },
        description: {
          en: "In transfer endpoint, modifying `\"from_account_id\": \"acc_ATTACKER\"` to `\"acc_VICTIM\"`. If authorization only verifies the token is valid but not tied to the account ID, victim's funds are debited.",
          simple: "Swapping the sender account ID with victim's account ID. The bank transfers victim's money because it only checked if your login token was valid.",
          hi: "ट्रांसफर रिक्वेस्ट में `from_account` में पीड़ित का अकाउंट नंबर डालना। सर्वर लॉगिन टोकन तो चेक करता है लेकिन यह चेक नहीं करता कि यह खाता किसका है।",
        },
        requestSample: `POST /api/v3/transfers/p2p HTTP/2
Host: bank.targetfintech.com
Authorization: Bearer <ATTACKER_TOKEN>
Content-Type: application/json

{
  "from_account_id": "acc_VICTIM_9921",
  "to_account_id": "acc_ATTACKER_1102",
  "amount": 250.00,
  "currency": "USD"
}`,
        impact: {
          en: "Critical unauthorized asset transfer, full account draining.",
          simple: "Directly stealing other people's money.",
          hi: "सीधे दूसरों के बैंक अकाउंट से अपने खाते में पैसे ट्रांसफर करना।",
        },
      },
      {
        title: {
          en: "KYC Documents & Identity Exposure IDOR",
          simple: "Downloading Others' Passports / ID Cards",
          hi: "दूसरों के पासपोर्ट / आधार / पैन कार्ड डाउनलोड करना",
        },
        description: {
          en: "Changing `doc_id` in `/api/v1/kyc/documents/doc_88291.pdf` returns confidential government IDs (Passport, Driving License, SSN) of other verified users.",
          simple: "Changing document numbers in the KYC link lets you view and download government IDs of any customer.",
          hi: "KYC डॉक्यूमेंट डाउनलोड URL में डॉक्यूमेंट ID बदलने पर किसी भी कस्टमर का पासपोर्ट और पैन कार्ड दिख जाना।",
        },
        impact: {
          en: "Mass PII and KYC data leak, massive regulatory fines (GDPR, PCI-DSS).",
          simple: "Severe privacy violation exposing thousands of real IDs.",
          hi: "हजारों ग्राहकों का संवेदनशील सरकारी डेटा लीक होना।",
        },
      },
      {
        title: {
          en: "Transaction History & Statement Download BOLA",
          simple: "View Any Customer's Financial Statements",
          hi: "किसी भी कस्टमर का बैंक स्टेटमेंट और बैलेंस देखना",
        },
        description: {
          en: "Requesting `GET /api/v2/reports/statement.pdf?account_id=10294` without session check reveals complete transaction log, salary, and balances.",
          simple: "Requesting account statements for other IDs lets you inspect their full spending and balance.",
          hi: "URL में किसी भी यूजर का अकाउंट ID डालकर उसका पूरा वित्तीय रिकॉर्ड देखना।",
        },
        impact: {
          en: "Financial confidentiality breach.",
          simple: "Privacy leak of customer financial records.",
          hi: "वित्तीय गोपनीयता का गंभीर उल्लंघन।",
        },
      },
    ],
    testingRecipe: [
      {
        en: "1. Create two test accounts (User A and User B).",
        simple: "1. Make two accounts in the fintech app.",
        hi: "1. फिनटेक ऐप में दो टेस्ट अकाउंट (User A और User B) बनाएं।",
      },
      {
        en: "2. Note down User B's Account ID, Wallet ID, and KYC Document ID.",
        simple: "2. Note down User B's internal IDs.",
        hi: "2. User B के अकाउंट ID, वॉलेट ID और डॉक्यूमेंट ID को नोट करें।",
      },
      {
        en: "3. Log in as User A, intercept requests, and replace User A's ID with User B's ID.",
        simple: "3. In User A's session, swap your ID with User B's ID.",
        hi: "3. User A के सेशन से रिक्वेस्ट भेजते समय ID में User B की ID डालें।",
      },
      {
        en: "4. Test across all HTTP verbs: GET (read), PUT/PATCH (update), DELETE (remove beneficiary), POST (transfer).",
        simple: "4. Test reading, editing, deleting, and transferring.",
        hi: "4. GET (देखना), PUT (अपडेट), DELETE (हटाना) और POST (ट्रांसफर) सभी मेथड्स पर टेस्ट करें।",
      },
      {
        en: "5. Test UUID parameters by checking if incremental sequential IDs work in legacy v1 endpoints (e.g. `/api/v1/user/102`).",
        simple: "5. Check if older API versions use simple numbers (101, 102) instead of long UUIDs.",
        hi: "5. अगर v2 में लंबा UUID है, तो v1 एंडपॉइंट्स पर नंबर वाली ID (101, 102) टेस्ट करें।",
      },
    ],
    burpRules: [
      "Use Burp Suite 'Match and Replace' to automatically swap Account A token with Account B token to test BOLA at scale.",
      "Install AutoRepeater or Autorize extension to test all endpoints automatically in background.",
    ],
    hunterProTip: {
      en: "Fintech companies love UUIDs to prevent IDOR guessing. Pro trick: Look for leak endpoints (search, public reviews, invoices, referral links) that expose other users' UUIDs, then plug those UUIDs into private financial endpoints!",
      simple: "When fintech apps use long random IDs (UUIDs), find public pages (like invoices or referral links) that leak those IDs, then test the private banking endpoints with them.",
      hi: "फिनटेक कंपनियां UUID का इस्तेमाल करती हैं। हैकर ट्रिक: पब्लिक इनवॉइस, रेफरल लिंक्स या सर्च APIs से पीड़ित का UUID निकालें, फिर उसे प्राइवेट बैंकिंग API में टेस्ट करें!",
    },
  },
  {
    id: "kyc-identity-bypass",
    title: {
      en: "KYC & Identity Verification Bypasses",
      simple: "Bypass Government ID & Face Verification Checks",
      hi: "KYC और पहचान सत्यापन में बाईपास (नकली आईडी से अप्रूवल)",
    },
    cwe: "CWE-287: Improper Authentication",
    vrt: "Server-Side Injection › Authentication Bypass › Identity / KYC Verification",
    bountyRange: "$1,500 – $6,000 (P2 / P3)",
    severity: "high",
    summary: {
      en: "Flaws in automated third-party KYC verification flows (Jumio, Onfido, SumSub) where client-side responses dictate verification status or file upload limits can be tricked.",
      simple: "Tricking the app into believing you uploaded a valid passport and passed live face-scanning when you didn't.",
      hi: "थर्ड-पार्टी KYC सिस्टम (Jumio, Onfido) में क्लाइंट-साइड रिस्पॉन्स बदलकर या कैमरा फीड बाईपास करके बिना वैलिड डॉक्यूमेंट के अप्रूवल लेना।",
    },
    scenarios: [
      {
        title: {
          en: "Client-Side Response Tampering for Instant Approval",
          simple: "Changing Verification Status from REJECTED to APPROVED",
          hi: "रिस्पॉन्स में REJECTED को APPROVED में बदलना",
        },
        description: {
          en: "When submitting KYC document, backend responds with `{\"kyc_status\": \"REJECTED\", \"reason\": \"BLURRY_IMAGE\"}`. Intercepting and modifying to `{\"kyc_status\": \"VERIFIED\", \"tier\": 3}` unlocks high-limit trading features.",
          simple: "Changing the server's rejection message in Burp to 'VERIFIED'. The frontend app unlocks all bank features because it doesn't double-check with the database.",
          hi: "बर्प सुइट में सर्वर से आने वाले `REJECTED` रिस्पॉन्स को `VERIFIED` कर देना, जिससे ऐप हाई-लिमिट ट्रेडिंग फीचर्स अनलॉक कर देता है।",
        },
        impact: {
          en: "Regulatory circumvention, money laundering account activation.",
          simple: "Bypassing financial fraud prevention.",
          hi: "बिना पहचान सत्यापन के खाते से बड़े लेन-देन शुरू करना।",
        },
      },
      {
        title: {
          en: "Virtual Camera Liveness Detection Spoofing",
          simple: "Bypassing Live Face Video Checks with Recorded Videos",
          hi: "लाइव फेस डिटेक्शन को रिकॉर्डेड वीडियो से बाईपास करना",
        },
        description: {
          en: "Feeding a virtual webcam (OBS Virtual Camera / v4l2loopback) into browser or mobile app playing a video loop of the target subject blinking to bypass liveness checks.",
          simple: "Using software to stream a fake video into the camera prompt to fool biometric face checks.",
          hi: "OBS वर्चुअल कैमरा से पहले से रिकॉर्ड किया हुआ वीडियो चलाकर बायोमेट्रिक फेस मैच को पास करना।",
        },
        impact: {
          en: "Identity theft, creating burner accounts with stolen identities.",
          simple: "Opening accounts in other people's names.",
          hi: "दूसरों की फोटो से नकली वेरीफाइड अकाउंट्स खोलना।",
        },
      },
      {
        title: {
          en: "Duplicate National ID Reuse Across Accounts",
          simple: "Using Same Government ID on 20 Different Accounts",
          hi: "एक ही पैन / आधार नंबर से कई खाते बनाना",
        },
        description: {
          en: "Fintech policy strictly limits 1 account per person. Registering 10 accounts and linking the identical SSN/PAN card passes due to missing database uniqueness constraint.",
          simple: "Using your same government ID number across 10 accounts to claim multiple bonuses.",
          hi: "एक ही सरकारी पहचान पत्र से 10 खाते खोलकर बार-बार वेलकम बोनस लूटना।",
        },
        impact: {
          en: "Sybil attacks, bypassing anti-money-laundering (AML) controls.",
          simple: "Multiple accounts per user breaking legal rules.",
          hi: "कानूनी AML नियमों का उल्लंघन।",
        },
      },
    ],
    testingRecipe: [
      {
        en: "1. Initiate KYC onboarding flow in browser and mobile app.",
        simple: "1. Start the identity verification step.",
        hi: "1. ब्राउज़र और मोबाइल ऐप में KYC प्रोसेस शुरू करें।",
      },
      {
        en: "2. Upload a blank or invalid document image.",
        simple: "2. Upload a dummy picture.",
        hi: "2. एक खाली या अमान्य फोटो अपलोड करें।",
      },
      {
        en: "3. Intercept HTTP response in Burp Suite (Enable Response Interception).",
        simple: "3. Turn on response interception in Burp.",
        hi: "3. बर्प सुइट में 'Intercept Server Response' ऑन करें।",
      },
      {
        en: "4. Modify `status: \"FAILED\"` / `\"PENDING\"` to `\"APPROVED\"` / `\"VERIFIED\"`.",
        simple: "4. Change failed status to approved in the response.",
        hi: "4. रिस्पॉन्स में फेल्ड स्टेटस को `VERIFIED` करके फॉरवर्ड करें।",
      },
      {
        en: "5. Check if the app grants access to tier-2 withdrawal limits.",
        simple: "5. Check if the app lets you make transactions now.",
        hi: "5. देखें कि क्या ऐप अब बिना KYC के पैसे निकालने की अनुमति देता है।",
      },
    ],
    burpRules: [
      "Burp Proxy -> Options -> Match and Replace -> Response Body: \"status\":\"REJECTED\" -> \"status\":\"VERIFIED\"",
    ],
    hunterProTip: {
      en: "Always check the difference between Web KYC and Mobile App KYC! Often web uses strict third-party iframes (Onfido/Veriff), but their mobile app uses a custom legacy endpoint with weaker validation.",
      simple: "Always test both the website and the Android/iOS app. Often the mobile app has much weaker KYC checks than the website.",
      hi: "वेबसाइट और मोबाइल ऐप दोनों पर KYC चेक करें! अक्सर वेबसाइट पर सख्त नियम होते हैं लेकिन मोबाइल ऐप में पुराने कमजोर एंडपॉइंट्स होते हैं।",
    },
  },
  {
    id: "financial-otp-2fa-bypasses",
    title: {
      en: "Transaction 2FA & OTP Bypasses",
      simple: "Bypass 6-Digit SMS / Email OTP on Money Transfers",
      hi: "ट्रांजैक्शन 2FA और OTP बाईपास (बिना OTP के पैसे ट्रांसफर करना)",
    },
    cwe: "CWE-307: Improper Restriction of Excessive Authentication Attempts",
    vrt: "Server-Side Injection › Authentication Bypass › Two-Factor Authentication (2FA)",
    bountyRange: "$3,000 – $10,000 (P1 / P2)",
    severity: "critical",
    summary: {
      en: "Flaws in second-factor verification protecting high-risk financial actions (transfer, password reset, beneficiary addition) such as missing rate-limits, response manipulation, or OTP leakage.",
      simple: "Sending money without entering the real SMS code by guessing it, bypassing it in Burp, or reusing an old code.",
      hi: "पैसे भेजते समय फोन पर आने वाले 6-अंकों के OTP को बिना जाने ही ट्रांजैक्शन पूरा कर लेना (ब्रूट-फोर्स या रिस्पॉन्स में छेड़छाड़ करके)।",
    },
    scenarios: [
      {
        title: {
          en: "Response Manipulation OTP Verification Bypass",
          simple: "Trick App into Accepting Any Wrong OTP",
          hi: "गलत OTP डालने पर भी रिस्पॉन्स बदलकर पास करना",
        },
        description: {
          en: "Entering wrong OTP (`000000`). Server returns `HTTP/1.1 400 Bad Request` with `{\"verified\": false}`. Modifying response to `HTTP/1.1 200 OK` with `{\"verified\": true, \"token\": \"txn_token_123\"}` completes transfer.",
          simple: "Enter 000000. When the server says 'Wrong Code', change it to 'Right Code' in Burp Suite.",
          hi: "गलत OTP `000000` डालें। सर्वर के 400 रिस्पॉन्स को 200 OK और `verified: true` में बदलकर फॉरवर्ड करें।",
        },
        impact: {
          en: "Complete bypass of financial transaction authorization.",
          simple: "Unauthorized transactions without victim's phone.",
          hi: "पीड़ित के फोन के बिना भी उसके खाते से पैसे निकल जाना।",
        },
      },
      {
        title: {
          en: "4-Digit / 6-Digit OTP Brute-Force via IP Header Spoofing",
          simple: "Brute-forcing OTP with Header Rotation",
          hi: "IP हेडर बदलकर OTP को ब्रूट-फोर्स करना",
        },
        description: {
          en: "4-digit OTP has only 10,000 combinations. If rate-limiting keys on client IP, adding rotating headers (`X-Forwarded-For`, `X-Real-IP`, `Client-IP`) allows testing all 10,000 codes in 60 seconds with Burp Intruder.",
          simple: "Testing all 10,000 combinations while faking your IP address with headers so the server never blocks you.",
          hi: "4-अंकों के केवल 10,000 कॉम्बिनेशन होते हैं। `X-Forwarded-For` हेडर बदलकर बिना ब्लॉक हुए सारे कोड्स 1 मिनट में टेस्ट करना।",
        },
        impact: {
          en: "Full account takeover and authorized financial transfer.",
          simple: "Draining accounts by cracking short codes.",
          hi: "अकाउंट टेकओवर और अनधिकृत निकासी।",
        },
      },
      {
        title: {
          en: "OTP Leakage in HTTP Response / Analytics Logs",
          simple: "Server Leaks the OTP Code in the Response",
          hi: "सर्वर द्वारा रिस्पॉन्स में ही OTP भेज देना",
        },
        description: {
          en: "When requesting OTP (`POST /api/v1/otp/send`), the backend response or subsequent analytics tracking pixel leaks the plaintext OTP in JSON (`{\"status\": \"SENT\", \"debug_code\": 928192}`).",
          simple: "When you click 'Send SMS', the website accidentally includes the secret code inside the background network response.",
          hi: "'Send OTP' दबाने पर नेटवर्क रिस्पॉन्स में ही `debug_code` या टोकन के रूप में OTP लीक हो जाना।",
        },
        impact: {
          en: "Zero-interaction account takeover.",
          simple: "Instant bypass without guessing.",
          hi: "बिना किसी अनुमान के तुरंत बाईपास।",
        },
      },
    ],
    testingRecipe: [
      {
        en: "1. Trigger an OTP prompt on a high-value action (e.g. Add Bank Account or Withdraw).",
        simple: "1. Start an action that asks for an SMS OTP.",
        hi: "1. पैसे निकालने या बैंक अकाउंट जोड़ने वाली जगह पर OTP मंगाएं।",
      },
      {
        en: "2. Inspect the HTTP response of `/otp/send` or `/otp/request` for leaked codes in JSON.",
        simple: "2. Check the network response to see if the code is visible.",
        hi: "2. `/otp/send` के रिस्पॉन्स को ध्यान से देखें कि कहीं कोड लीक तो नहीं हो रहा।",
      },
      {
        en: "3. Enter `000000`, intercept the response, and change HTTP 400/403 to HTTP 200 with `{\"success\": true}`.",
        simple: "3. Enter wrong code and change the error response to success in Burp.",
        hi: "3. गलत कोड डालकर रिस्पॉन्स में 400 को 200 OK और `success: true` करें।",
      },
      {
        en: "4. Test rate-limiting: send 10 wrong attempts with Burp Intruder. Does it lock after 3-5 tries?",
        simple: "4. Try 10 wrong codes in Burp Intruder to see if it blocks you.",
        hi: "4. बर्प इंट्रूडर से 10 गलत कोड भेजें। देखें कि क्या 5 प्रयासों के बाद अकाउंट लॉक होता है।",
      },
      {
        en: "5. Test IP rotation: add `X-Forwarded-For: 127.0.0.§1§` to bypass IP-based rate limiting.",
        simple: "5. Rotate IP headers in Burp to test for bypass.",
        hi: "5. `X-Forwarded-For` हेडर जोड़कर रेट-लिमिट बाईपास टेस्ट करें।",
      },
    ],
    burpRules: [
      "Header rotation: X-Forwarded-For, X-Client-IP, X-Real-IP, True-Client-IP",
      "Response match & replace: \"success\":false -> \"success\":true",
    ],
    hunterProTip: {
      en: "Always check if an OTP generated for a $1 transfer can be reused for a $1,000 transfer! Weak fintech apps bind the OTP only to the user session, not to the specific transaction amount or recipient account.",
      simple: "Generate an OTP for a $1 transfer, but use it to approve a $1000 transfer. If the bank doesn't bind the OTP to the amount, it will go through!",
      hi: "₹10 के ट्रांसफर के लिए आया हुआ OTP क्या ₹10,000 के ट्रांसफर में काम करता है? कई कमजोर ऐप्स OTP को अमाउंट से लिंक नहीं करते!",
    },
  },
  {
    id: "mobile-secrets-microservices",
    title: {
      en: "Hardcoded Financial Secrets & Internal Microservices",
      simple: "Decompile Android APK to Find Stripe / Banking Secrets",
      hi: "मोबाइल ऐप डीकंपाइल करके सीक्रेट API कीज और इंटरनल सर्विसेज निकालना",
    },
    cwe: "CWE-798: Use of Hardcoded Credentials",
    vrt: "Server-Side Injection › Credential Leakage › Private API Keys",
    bountyRange: "$2,000 – $15,000 (P1 / P2)",
    severity: "critical",
    summary: {
      en: "Fintech mobile applications (APK/IPA) often embed live payment gateway secret keys (Stripe `sk_live_...`, Razorpay Secret, Plaid Client Secret) or expose unauthenticated internal microservices.",
      simple: "Opening the company's Android app with hacking tools to pull out secret passwords that give full control over their payment accounts.",
      hi: "कंपनी के एंड्रॉइड ऐप (APK) को JADX टूल से खोलकर उसमें हार्डकोडेड स्ट्राइप, रेज़रपे या AWS सीक्रेट कीज निकालना।",
    },
    scenarios: [
      {
        title: {
          en: "Live Stripe / Razorpay Secret Key in APK Code",
          simple: "Payment Gateway Master Secret Key Exposed",
          hi: "APK में लाइव स्ट्राइप सीक्रेट की (`sk_live_...`) का मिलना",
        },
        description: {
          en: "Developers confuse publishable keys (`pk_live_...`) with secret keys (`sk_live_...`). Decompiling the APK with JADX reveals live secret key, enabling arbitrary chargebacks, refunds, and bank payouts.",
          simple: "Finding the master secret key instead of the public key. This lets you refund any customer or pay money to your own bank account.",
          hi: "पब्लिक की (`pk_live`) की जगह गलती से मास्टर सीक्रेट की (`sk_live`) कोड में छोड़ देना, जिससे कोई भी किसी भी कस्टमर को रिफंड या पेआउट कर सकता है।",
        },
        impact: {
          en: "Complete compromise of merchant financial account.",
          simple: "Total control over the company's merchant account.",
          hi: "मर्चेंट अकाउंट का पूरा कंट्रोल छिन जाना।",
        },
      },
      {
        title: {
          en: "Unauthenticated Staging / Sandbox Banking Microservice",
          simple: "Hidden Internal Endpoints Without Password",
          hi: "छिपे हुए इंटरनल बैंकिंग एंडपॉइंट्स बिना ऑथेंटिकेशन के मिलना",
        },
        description: {
          en: "Decompiling APK reveals hardcoded base URLs like `https://internal-core-banking-staging.target.com`. Endpoints on this host lack WAF and authentication.",
          simple: "Finding hidden web addresses inside the app that developers forgot to protect with logins.",
          hi: "ऐप के कोड में छिपे हुए इंटरनल सर्वर के पते मिलना जहां कोई पासवर्ड या फ़ायरवॉल नहीं लगा होता।",
        },
        impact: {
          en: "Direct database manipulation and core banking exposure.",
          simple: "Access to private internal databases.",
          hi: "इंटरनल कोर बैंकिंग सिस्टम पर सीधा अनधिकृत एक्सेस।",
        },
      },
    ],
    testingRecipe: [
      {
        en: "1. Download target Fintech APK using apkpure or gplaycli.",
        simple: "1. Download the Android app file (.apk).",
        hi: "1. टारगेट फिनटेक ऐप का APK डाउनलोड करें।",
      },
      {
        en: "2. Open APK in JADX-GUI: `jadx-gui target.apk`.",
        simple: "2. Open the APK with JADX-GUI tool.",
        hi: "2. JADX-GUI टूल में APK को खोलें।",
      },
      {
        en: "3. Search regex: `sk_live_[0-9a-zA-Z]{24}`, `rzp_live_[0-9a-zA-Z]+`, `access_token`, `client_secret`.",
        simple: "3. Search for secret key patterns.",
        hi: "3. सर्च बार में `sk_live_`, `rzp_live_`, या `secret` सर्च करें।",
      },
      {
        en: "4. Check `res/values/strings.xml` and build config files.",
        simple: "4. Check the app's settings and strings files.",
        hi: "4. `res/values/strings.xml` फाइल में छुपे हुए टोकन्स देखें।",
      },
      {
        en: "5. Safe verification: test key validity using harmless read-only API call (e.g. `curl https://api.stripe.com/v1/balance -u sk_live_...:`).",
        simple: "5. Check if the key works using a read-only command (never modify or delete).",
        hi: "5. केवल बैलेंस चेक करने वाली रीड-ओनली कमांड से कीज वेरीफाई करें। कभी कुछ डिलीट या मॉडिफाई न करें।",
      },
    ],
    burpRules: [
      "Scan strings for: sk_live, rzp_live, AWS_SECRET, PLAID_SECRET, FIREBASE_TOKEN",
    ],
    hunterProTip: {
      en: "Do not just search Java code! Modern apps store secrets inside C++ native libraries (`.so` files inside `/lib/arm64-v8a/`). Run `strings libnative.so | grep -iE 'key|secret|api'` to find hidden credentials!",
      simple: "Also check inside the .so files in the app's lib folder using the `strings` command. Developers hide secrets there hoping hunters won't look.",
      hi: "सिर्फ जावा कोड न देखें! डेवलपर्स सीक्रेट्स को C++ लाइब्रेरी (`.so` फाइल्स) में छुपाते हैं। `strings libnative.so | grep -i key` चलाकर चेक करें!",
    },
  },
];

// ─── 2. 48-HOUR FAST HUNTING METHODOLOGY ──────────────────────────────────────
export const FINTECH_METHODOLOGY_PHASES: FintechPhase[] = [
  {
    phase: 1,
    title: {
      en: "Financial Flow & Architecture Mapping",
      simple: "Map All Money Flows",
      hi: "मनी फ्लो और आर्किटेक्चर मैपिंग (पैसे का रास्ता समझना)",
    },
    objective: {
      en: "Document every single point where value or money enters, moves, or exits the platform.",
      simple: "Understand everywhere money can be deposited, sent, converted, or withdrawn.",
      hi: "प्लेटफॉर्म पर पैसे के आने, घूमने और निकलने के हर रास्ते का नक्शा बनाएं।",
    },
    steps: [
      {
        en: "Register 2 distinct accounts: User A (Sender) and User B (Receiver).",
        simple: "Create two separate test accounts.",
        hi: "दो अलग-अलग अकाउंट्स बनाएं: User A और User B।",
      },
      {
        en: "Identify ledger transaction types: Deposit, P2P Transfer, Currency Exchange, Split Bill, Withdrawal, Invoicing, Refunds.",
        simple: "List every feature that touches money.",
        hi: "हर फीचर को लिस्ट करें जो बैलेंस को छूता है (डिपॉजिट, ट्रांसफर, एक्सचेंज, रिफंड)।",
      },
      {
        en: "Map out the multi-step states: Draft ➔ Pending ➔ Authorized ➔ Processing ➔ Cleared ➔ Failed ➔ Reversed.",
        simple: "Map the lifecycle stages of a payment.",
        hi: "पेमेंट के विभिन्न स्टेटस को नोट करें (पेंडिंग, ऑथराइज्ड, प्रोसेस्ड, फेल्ड)।",
      },
    ],
    keyTargets: [
      "POST /api/v1/wallet/topup",
      "POST /api/v1/transfers",
      "POST /api/v1/exchange/convert",
      "POST /api/v1/withdraw",
      "POST /api/v1/refunds/request",
    ],
  },
  {
    phase: 2,
    title: {
      en: "Mobile App Interception & SSL Pinning Bypass",
      simple: "Intercept Mobile Banking Traffic",
      hi: "मोबाइल ऐप ट्रैफिक कैप्चर और SSL पिनिंग बाईपास",
    },
    objective: {
      en: "Bypass SSL Pinning to capture private mobile endpoints often missing WAF rules present on web.",
      simple: "Hook your phone to Burp Suite so you can see every hidden mobile request.",
      hi: "मोबाइल ऐप का ट्रैफिक बर्प सुइट में लाएं ताकि वे एंडपॉइंट्स दिखें जो वेबसाइट पर नहीं हैं।",
    },
    steps: [
      {
        en: "Install Frida on host machine (`pip install frida-tools`) and frida-server on rooted Android/jailbroken iOS device or emulator.",
        simple: "Setup Frida on your computer and test phone.",
        hi: "कंप्यूटर और फोन पर Frida सेटअप करें।",
      },
      {
        en: "Run universal SSL pinning bypass script to route all HTTPS requests through Burp Suite.",
        simple: "Run the pinning bypass script.",
        hi: "यूनिवर्सल SSL पिनिंग बाईपास स्क्रिप्ट चलाएं।",
      },
      {
        en: "Compare mobile endpoints with web: look for missing CORS, unauthenticated GraphQL, and legacy v1 paths.",
        simple: "Find endpoints that only the mobile app calls.",
        hi: "देखें कि कौन से APIs सिर्फ मोबाइल में कॉल होते हैं लेकिन वेब पर नहीं।",
      },
    ],
    commandsOrPayloads: [
      "frida -U -f com.target.fintech -l frida-ssl-bypass.js",
      "objection --gadget com.target.fintech explore --startup-command 'android sslpinning disable'",
    ],
    keyTargets: [
      "Hidden /api/mobile/v1/* routes",
      "Biometric enrollment endpoints",
      "Legacy unversioned REST microservices",
    ],
  },
  {
    phase: 3,
    title: {
      en: "Automated Race Condition Hunting",
      simple: "Test for Parallel Race Conditions",
      hi: "ऑटोमेटेड रेस कंडीशन हंटिंग (एक साथ कई रिक्वेस्ट्स)",
    },
    objective: {
      en: "Test whether critical transaction state changes hold atomic database locks under concurrent load.",
      simple: "See if sending 20 transactions at the exact same millisecond breaks the balance.",
      hi: "जांचें कि क्या एक ही मिलीसेकंड में 20 रिक्वेस्ट भेजने पर बैलेंस दो बार कटता या जुड़ता है।",
    },
    steps: [
      {
        en: "Target endpoints that check a finite resource: balance debit, coupon apply, voucher redemption, withdrawal limit.",
        simple: "Pick requests that consume a balance or coupon.",
        hi: "उन एंडपॉइंट्स को चुनें जो बैलेंस काटते हैं या कूपन रिडीम करते हैं।",
      },
      {
        en: "Use Turbo Intruder with HTTP/2 single-packet synchronization gate.",
        simple: "Fire using Turbo Intruder HTTP/2 single packet technique.",
        hi: "Turbo Intruder में HTTP/2 सिंगल-पैकेट अटैक चलाएं।",
      },
      {
        en: "Analyze HTTP responses: if more than one request returns `200 OK` or `201 Created`, verify database ledger.",
        simple: "Check if more than one request gave success.",
        hi: "देखें कि क्या 1 से ज्यादा रिक्वेस्ट में 200 OK आया।",
      },
    ],
    commandsOrPayloads: [
      "engine=Engine.BURP2",
      "req.gate('fintech_race')",
    ],
    keyTargets: [
      "Wallet withdrawals",
      "Promo code redemption",
      "Refund requests",
      "Gift card claims",
    ],
  },
  {
    phase: 4,
    title: {
      en: "Parameter Boundary & Type Juggling Fuzzing",
      simple: "Fuzz Numbers, Decimals & Data Types",
      hi: "पैरामीटर बाउंड्री और टाइप जगलिंग (अजीब इनपुट्स से टेस्ट)",
    },
    objective: {
      en: "Force math exceptions, precision loss, and negative balance conversions.",
      simple: "Put crazy values into price and amount fields to find math bugs.",
      hi: "अमाउंट फील्ड्स में अजीब नंबर्स डालकर सर्वर का मैथ लॉजिक तोड़ना।",
    },
    steps: [
      {
        en: "Test negative numbers: `-1`, `-0.01`, `-100.00`.",
        simple: "Test negative prices.",
        hi: "नेगेटिव अमाउंट डालें: -1, -0.01, -100।",
      },
      {
        en: "Test micro-units / fractional currency: `0.00000001`, `0.00000000001` (rounding up to 1 without deduction).",
        simple: "Test tiny fractions like 0.0000001.",
        hi: "बहुत छोटे डेसिमल्स डालकर राउंडिंग बग्स देखें।",
      },
      {
        en: "Test JSON type juggling: change `\"amount\": 10` to `\"amount\": \"10\"`, `\"amount\": [10]`, or `\"amount\": true`.",
        simple: "Change numbers to text or arrays in JSON.",
        hi: "JSON में नंबर की जगह एरे या बूलियन भेजें (`\"amount\": [10]`)।",
      },
    ],
    commandsOrPayloads: [
      "{\"amount\": -1.00}",
      "{\"amount\": 0.00000001}",
      "{\"amount\": 2147483648}",
      "{\"amount\": 1e-5}",
    ],
    keyTargets: [
      "Order checkout totals",
      "P2P transfer values",
      "Currency conversion multipliers",
    ],
  },
  {
    phase: 5,
    title: {
      en: "Webhook & Gateway Verification",
      simple: "Test Payment Gateways & Webhooks",
      hi: "वेबहुक और पेमेंट गेटवे वेरिफिकेशन",
    },
    objective: {
      en: "Determine if payment confirmation callbacks can be faked without valid cryptographic signatures.",
      simple: "See if you can tell the server 'I paid' without actually paying.",
      hi: "जांचें कि क्या बिना असली पेमेंट के सर्वर को नकली 'पेमेंट डन' सिग्नल भेजा जा सकता है।",
    },
    steps: [
      {
        en: "Identify payment provider: Stripe, Razorpay, Adyen, PayPal, Cashfree, Braintree.",
        simple: "Identify which payment gateway is used.",
        hi: "पहचानें कि कंपनी कौन सा पेमेंट गेटवे इस्तेमाल करती है।",
      },
      {
        en: "Inspect webhook endpoint: `/api/webhooks/stripe`, `/api/v1/payments/callback`.",
        simple: "Find where the payment gateway sends confirmation.",
        hi: "वेबहुक एंडपॉइंट खोजें।",
      },
      {
        en: "Send simulated payment success events with stripped or modified HMAC headers (`Stripe-Signature`, `X-Razorpay-Signature`).",
        simple: "Send fake success messages without signature.",
        hi: "बिना सिग्नेचर के नकली सक्सेस पेलोड भेजकर देखें।",
      },
    ],
    keyTargets: [
      "/api/webhooks/*",
      "/api/payments/callback",
      "/api/checkout/verify",
    ],
  },
];

// ─── 3. INTERACTIVE TOOLS & SCRIPTS STASH ─────────────────────────────────────
export const FINTECH_TOOLS_STASH: FintechToolSnippet[] = [
  {
    id: "turbo-intruder-fintech",
    title: {
      en: "Turbo Intruder: HTTP/2 Single-Packet Race Condition",
      simple: "Single-Packet Attack Script for Double-Spend",
      hi: "Turbo Intruder: सिंगल-पैकेट रेस कंडीशन स्क्रिप्ट",
    },
    description: {
      en: "Industry-standard Python script for Burp Suite Turbo Intruder. Synchronizes 20-30 requests across a single TCP window using HTTP/2 multiplexing for 100% simultaneous execution.",
      simple: "Copy-paste this Python script into Turbo Intruder in Burp Suite to test wallet double-spend.",
      hi: "बर्प सुइट के Turbo Intruder में पेस्ट करने के लिए पायथन स्क्रिप्ट, जो एक ही मिलीसेकंड में 30 रिक्वेस्ट भेजती है।",
    },
    category: "race_condition",
    language: "python",
    code: `def queueRequests(target, wordlists):
    # Use HTTP/2 engine for single-packet synchronization
    engine = RequestEngine(
        endpoint=target.endpoint,
        concurrentConnections=1,
        engine=Engine.BURP2,
        pipeline=False
    )
    
    # Target request from Repeater
    req = target.req
    
    # Step 1: Queue 25 identical requests with a synchronization gate
    for i in range(25):
        engine.queue(req, gate='race_fintech_gate')
    
    # Step 2: Release all 25 requests in the exact same TCP packet window
    engine.openGate('race_fintech_gate')

def handleResponse(req, interesting):
    # Highlight requests that succeeded (200 OK or 201 Created)
    if req.status in [200, 201]:
        table.add(req)
`,
    howToUse: {
      en: "Send your withdrawal/transfer request to Turbo Intruder -> Paste this code -> Click 'Start attack'. Look for multiple 200 OK responses.",
      simple: "Send request to Turbo Intruder, paste this script, hit start. If you see multiple 200 OKs, the bug is confirmed.",
      hi: "रिक्वेस्ट को Turbo Intruder में भेजें -> यह कोड पेस्ट करें -> 'Start attack' दबाएं। अगर एक से ज्यादा 200 OK आएं, तो बग कंफर्म है।",
    },
  },
  {
    id: "frida-universal-pinning",
    title: {
      en: "Frida: Universal Android SSL Pinning Bypass",
      simple: "Frida Script to Intercept Any Fintech Mobile App",
      hi: "Frida: यूनिवर्सल एंड्रॉइड SSL पिनिंग बाईपास",
    },
    description: {
      en: "Hooks TrustManager, OkHttp3, CertificatePinner, and Conscrypt in Android runtime to route encrypted Fintech app traffic through Burp Suite.",
      simple: "Bypasses SSL security on Android apps so Burp Suite can read the encrypted financial requests.",
      hi: "एंड्रॉइड ऐप में SSL पिनिंग को तोड़कर सारा ट्रैफिक बर्प सुइट में लाने के लिए Frida स्क्रिप्ट।",
    },
    category: "mobile_frida",
    language: "javascript",
    code: `Java.perform(function() {
    console.log("[*] Injecting Universal SSL Pinning Bypass for Fintech...");

    // 1. Hook TrustManagerImpl
    try {
        var TrustManagerImpl = Java.use('com.android.org.conscrypt.TrustManagerImpl');
        TrustManagerImpl.verifyChain.implementation = function(untrustedChain, trustAnchorChain, host, clientAuth, ocspData, tlsSctData) {
            console.log("[+] Bypassed TrustManagerImpl for host: " + host);
            return untrustedChain;
        };
    } catch(e) { console.log("[-] TrustManagerImpl not found"); }

    // 2. Hook OkHttp3 CertificatePinner
    try {
        var CertificatePinner = Java.use('okhttp3.CertificatePinner');
        CertificatePinner.check.overload('java.lang.String', 'java.util.List').implementation = function(hostname, peerCertificates) {
            console.log("[+] Bypassed OkHttp3 CertificatePinner for: " + hostname);
            return;
        };
    } catch(e) { console.log("[-] OkHttp3 CertificatePinner not found"); }
});
`,
    howToUse: {
      en: "Run with Frida: `frida -U -f com.target.fintech -l frida-ssl-bypass.js`",
      simple: "Run command: `frida -U -f com.target.fintech -l frida-ssl-bypass.js`",
      hi: "टर्मिनल में कमांड चलाएं: `frida -U -f com.target.fintech -l frida-ssl-bypass.js`",
    },
  },
];

// ─── 4. READY-TO-USE P1 FINTECH REPORT TEMPLATES ──────────────────────────────
export const FINTECH_REPORT_TEMPLATES: FintechReportTemplate[] = [
  {
    id: "report-negative-price",
    title: {
      en: "P1: Negative Price Parameter Manipulation in Checkout Flow",
      simple: "Report: Negative Amount Price Tampering",
      hi: "रिपोर्ट: नेगेटिव अमाउंट से फ्री में बैलेंस और सामान खरीदना",
    },
    vulnType: "Price Parameter Tampering (CWE-602)",
    cvss: "9.8 (Critical)",
    severity: "critical",
    reportMarkdown: `## Summary
A critical parameter tampering vulnerability was identified in the payment checkout endpoint \`/api/v2/checkout/process\`. By supplying a negative value in the \`amount\` parameter, an attacker can manipulate total payment calculations, resulting in the platform crediting funds or fulfilling high-value purchases for arbitrary amounts without legitimate payment.

## Vulnerability Details
- **Vulnerable URL**: \`https://pay.target.com/api/v2/checkout/process\`
- **HTTP Method**: \`POST\`
- **Vulnerable Parameter**: \`"amount": -100.00\`
- **CWE**: CWE-602 (Client-Side Enforcement of Server-Side Security)
- **VRT Classification**: Server-Side Injection > Parameter Tampering > Price / Amount Manipulation

## Steps to Reproduce
1. Log in with a standard verified test account.
2. Select any product or service priced at $500.00 and proceed to payment.
3. Intercept the final payment authorization request in Burp Suite:
\`\`\`http
POST /api/v2/checkout/process HTTP/2
Host: pay.target.com
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "order_id": "ORD-99120",
  "amount": -500.00,
  "currency": "USD"
}
\`\`\`
4. Forward the modified request.
5. Observe the server response: \`HTTP/2 200 OK\` with \`{"status": "ORDER_COMPLETED", "balance_credited": 500.00}\`.

## Impact
An attacker can purchase unlimited goods, stocks, or cryptocurrency without paying, directly draining platform inventory and financial liquidity.

## Remediation
Ensure all pricing and checkout totals are retrieved server-side from an authoritative database catalog. Reject any negative or zero numerical values at the API gateway validation layer.`,
  },
  {
    id: "report-race-condition",
    title: {
      en: "P1: Race Condition in Wallet Withdrawal Leading to Balance Double-Spend",
      simple: "Report: Wallet Balance Double-Spend via Race Condition",
      hi: "रिपोर्ट: रेस कंडीशन द्वारा वॉलेट से दो बार पैसे निकालना",
    },
    vulnType: "Race Condition / TOCTOU (CWE-362)",
    cvss: "9.1 (Critical)",
    severity: "critical",
    reportMarkdown: `## Summary
A critical Time-of-Check to Time-of-Use (TOCTOU) race condition exists in the wallet withdrawal endpoint \`/api/v1/wallet/withdraw\`. Due to missing atomic row-level locks on user balance records, an attacker can submit concurrent HTTP/2 requests to withdraw the same balance multiple times before the deduction is finalized.

## Vulnerability Details
- **Vulnerable URL**: \`https://api.target.com/api/v1/wallet/withdraw\`
- **HTTP Method**: \`POST\`
- **CWE**: CWE-362 (Concurrent Execution using Shared Resource with Improper Synchronization)
- **VRT Classification**: Server-Side Injection > Race Condition > Financial Double-Spend

## Steps to Reproduce
1. Set up an account with a test balance of $100.00.
2. Capture the withdrawal request in Burp Suite:
\`\`\`http
POST /api/v1/wallet/withdraw HTTP/2
Host: api.target.com
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "destination_account": "ACC-TEST-992",
  "amount": 100.00,
  "currency": "USD"
}
\`\`\`
3. Send the request to Turbo Intruder using an HTTP/2 single-packet synchronization gate.
4. Execute 20 concurrent requests simultaneously.
5. In the Burp table, observe that 3 separate requests returned \`HTTP/2 200 OK\`.
6. Inspect destination account: $300.00 was transferred despite original balance being only $100.00.

## Impact
Enables malicious actors to duplicate balances and drain hot-wallet reserves, causing direct monetary loss to the organization.

## Remediation
Wrap all financial balance checks and debit updates within an atomic database transaction using pessimistic row locking (e.g., \`SELECT balance FROM wallets WHERE user_id = ? FOR UPDATE;\`).`,
  },
];
