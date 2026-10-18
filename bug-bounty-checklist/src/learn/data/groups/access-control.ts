import type { LearnGroup } from "@/learn/data/types";

// Broken Access Control — advanced, P3/P4-focused study group.
//
// VRT facts (Bugcrowd release 2026-07-08) and CWE ids are copied from the
// published taxonomy, not invented. Content targets researchers who already
// know what an IDOR is and want the findable day-to-day variants plus the
// conditions that escalate them.

export const accessControlGroup: LearnGroup = {
  id: "access-control",
  name: "Broken Access Control",
  emoji: "🔑",
  blurb:
    "Authentication proves who you are; authorization decides what that identity may touch. BAC bugs live entirely in the second check — the server trusts an identifier, role claim, or confirmation step the caller controls. Most daily finds sit at P3/P4; the payout is in proving the write-side or cross-tenant escalation.",
  topics: [
    {
      id: "idor",
      name: "IDOR Variants (Iterable & Complex Identifiers)",
      emoji: "🪪",
      intro:
        "The server authenticates the caller but authorizes against an object identifier the caller supplies, so the access decision silently degrades from \"does this object belong to me\" to \"does this object exist\". The findable variants in 2025 are rarely the naive /users/1001 — they are iterable ids that view sensitive data (P3), and complex GUID/UUID ids that look unguessable but leak through a second endpoint, email, log, or response body (P4). What makes it escalate is the verb and the sensitivity: a read on an iterable id is P3, but if the same path answers PUT/PATCH/DELETE you cross into modify (P2) and, on fully sensitive data with an iterable id, P1.",
      howToFind: [
        {
          title: "Two-session differential with a full verb sweep",
          steps: [
            "Hold two live sessions (A and B) side by side in Burp with distinct accounts; set a unique, searchable marker on B's object (e.g. a note field = IDOR-CANARY-B).",
            "Capture every request A makes against A's own object, then replay with only the identifier swapped to B's, keeping A's cookie/bearer unchanged.",
            "Repeat the swap across GET, POST, PUT, PATCH and DELETE on the same path — authorization is frequently enforced on the read handler but forgotten on the write handlers that share the route.",
            "Confirm on content, never on status: a 200 that returns B's canary is the finding; a 200 that returns A's own object (server silently ignored the id) is not.",
          ],
        },
        {
          title: "Complex identifier (GUID/UUID) — hunt the leak, then swap",
          steps: [
            "Treat an unguessable id as findable the moment it appears anywhere the attacker can reach: list/search endpoints, notification emails, Referer headers, shared-link URLs, autocomplete/typeahead, PDF metadata, or a sibling API that returns a collection.",
            "Collect a victim's GUID from the low-privilege leak, then use it against the sensitive single-object endpoint from the attacker's session.",
            "Watch for predictable-but-not-random ids that masquerade as complex: sequential UUIDv1 (time + MAC ordered), base64/hex of an incrementing integer, or MongoDB ObjectIDs whose leading 4 bytes are a timestamp — these are enumerable, which pushes the variant back toward the iterable (higher-priority) branch.",
          ],
        },
        {
          title: "2025-era edge cases and parser confusion",
          steps: [
            "GraphQL: request node(id:) directly or alias the same object many times in one query to bypass per-request checks and to mass-harvest; also try the global node/relay id which base64-encodes the type and raw id.",
            "Parameter pollution and wrapping to confuse the authorization layer vs the data layer: id=self&id=victim, id[]=victim, {\"id\":[\"victim\"]}, or id=victim with a trailing .json / ;.css to hit a different route handler.",
            "Identifier relocation: move the id from the path to a body field, JSON pointer, or a tenant/org header (X-Account-Id, X-Tenant) the UI normally sets — gateways often authorize the path but trust the header downstream.",
          ],
        },
      ],
      payloads: [
        "GET /api/v2/invoices/4190/pdf   (iterable id, view sensitive -> P3)",
        "PATCH /api/v2/invoices/4190 {\"billingEmail\":\"attacker@x.com\"}   (same path, write verb -> modify)",
        "POST /graphql {\"query\":\"{ a:order(id:\\\"<uuid-A>\\\"){total} b:order(id:\\\"<uuid-B>\\\"){total} }\"}   (alias harvest)",
        "GET /api/orders/<victim-uuid>   with header  X-Account-Id: <victim-account>   (header-trust IDOR)",
        "id[]=<self-id>&id[]=<victim-id>   (array / parameter-pollution bypass)",
      ],
      example:
        "A billing API exposed GET /api/v2/invoices/{id}/pdf where id was a zero-padded sequential integer. Swapping A's id for B's returned B's invoice PDF — sensitive data, iterable id, read-only: triaged P3 (Medium). The hunter then noticed the same /api/v2/invoices/{id} route answered PATCH and let them rewrite billingEmail on any invoice; that converted read-only view into modify of sensitive data on an iterable id, lifting the report to P1 and an account-takeover pivot via the changed contact address.",
      mapping: {
        bugcrowdVrt: "Broken Access Control (BAC) › Insecure Direct Object References (IDOR)",
        bugcrowdPriority: "P3",
        hackeroneCwe: "CWE-639: Authorization Bypass Through User-Controlled Key",
        cvssSeverity: "Medium (P3 lead) — escalates to Critical",
        note:
          "VRT ladder: P1 modify/view sensitive (iterable id); P2 modify sensitive (iterable id); P3 view sensitive (iterable id) — the day-to-day lead; P4 modify/view sensitive (complex GUID/UUID id); P5 view non-sensitive. Two levers move the score: whether you can write (not just read) and whether the id is iterable vs a leaked-complex id. A P4 complex-id IDOR jumps to P1/P2 the moment you show the id is enumerable or reliably leaked.",
      },
      checklistCategoryId: "access-idor",
      references: [
        { label: "PortSwigger: Access control & IDOR", url: "https://portswigger.net/web-security/access-control/idor" },
        { label: "OWASP WSTG: Testing for IDOR", url: "https://owasp.org/www-project-web-security-testing-guide/" },
      ],
    },
    {
      id: "privesc",
      name: "Function-Level Authorization & Privilege Escalation",
      emoji: "⬆️",
      intro:
        "Where IDOR bypasses authorization on an object, this bypasses it on an action or a role. The classic shape is a missing function-level check: the UI hides an admin control but the endpoint behind it still answers a low-privilege token. The subtle, high-signal shape in modern apps is state-based — a role or plan field that the server reads from a request it should have derived server-side (mass assignment), or a check performed once at authentication and then trusted for the rest of the session. It escalates by blast radius: self-service to tenant-admin, single-tenant to cross-tenant, read-admin to write-admin.",
      howToFind: [
        {
          title: "Force-browse and method-swap admin functions",
          steps: [
            "Harvest admin/privileged routes from JS bundles, OpenAPI/Swagger specs, source maps, and (if you can borrow one) an admin account's captured traffic.",
            "Call each privileged endpoint with a low-privilege token: a 200 or an actual state change is broken function-level authorization; a uniform 403 is correct.",
            "When a route 403s, retry with method swaps (GET->POST, POST->PUT), path-case and encoding tricks, and the version-gap trick (same action on /api/v1/ when only /api/v2/ was hardened).",
          ],
        },
        {
          title: "Mass assignment of role / plan / ownership",
          steps: [
            "Enumerate the full object shape from a GET or the admin response, then add the privileged fields to a self-service write: role, isAdmin, is_staff, plan, entitlements, ownerId, orgRole.",
            "Submit via registration, profile update, or any PATCH the user is allowed to make; re-read the object as a check and confirm the privileged field persisted.",
            "Try JSON vs form-encoded and nested paths (user.role) — frameworks bind these differently and a blocklist usually guards only the flat key.",
          ],
        },
        {
          title: "Cross-tenant and stale-authorization checks",
          steps: [
            "Swap tenant/org identifiers in path, body, or header to act inside another tenant (horizontal move that becomes privileged inside the victim org).",
            "Perform a privileged action, then replay it after your role was downgraded or your membership revoked — if it still succeeds the server authorized once and cached the decision.",
            "Chain a benign self-service IDOR into privesc: if you can write another user's record, writing your own role-adjacent fields on their admin record can grant you their rights.",
          ],
        },
      ],
      payloads: [
        "POST /api/org/members {\"email\":\"me@x.com\",\"role\":\"owner\"}   (mass-assign owner on self-invite)",
        "PATCH /api/me {\"isAdmin\":true,\"plan\":\"enterprise\"}",
        "PUT /api/v1/users/{self}  {\"user\":{\"role\":\"admin\"}}   (nested bind bypasses flat-key blocklist)",
        "POST /admin/api/reports/export   (low-priv token against a force-browsed admin route)",
      ],
      example:
        "A SaaS let any member PATCH their own membership object to update display name and timezone. The object also carried a role field the UI never sent. Adding \"role\":\"owner\" to the body promoted the attacker from member to organisation owner, unlocking billing, member removal, and SSO settings — a self-service action turned into full tenant control. Because the elevated role governed an entire tenant, it scored at the top of the varies range (P1/P2) rather than a flat low.",
      mapping: {
        bugcrowdVrt: "Broken Access Control (BAC) › Privilege Escalation",
        bugcrowdPriority: "varies",
        hackeroneCwe: "CWE-269: Improper Privilege Management (also CWE-285: Improper Authorization)",
        cvssSeverity: "Medium → Critical (varies by elevated role)",
        note:
          "VRT prices this leaf as varies — the score tracks what the gained role can do. Elevating within your own low-privilege context trends Medium; reaching tenant/org admin, cross-tenant control, or platform staff trends P2/P1. Prove the capability, not just the flipped flag.",
      },
      checklistCategoryId: "access-privesc",
      references: [
        { label: "PortSwigger: Access control", url: "https://portswigger.net/web-security/access-control" },
      ],
    },
    {
      id: "user-enum",
      name: "Username / Email Enumeration (Non-Brute-Force)",
      emoji: "🕵️",
      intro:
        "A non-brute-force oracle that confirms whether an account exists from a single, legitimate request — not from hammering a login. The mechanism is an observable response discrepancy: a difference in body text, HTTP status, redirect target, returned field, or crucially response timing between \"account exists\" and \"does not\" across login, registration, password reset, or a GraphQL/REST availability check. It is a standalone P4, but its real value is as the first stage of a chain: it scopes password spraying, validates breach-list emails, and confirms targets for account-takeover work.",
      howToFind: [
        {
          title: "Diff every account-aware endpoint",
          steps: [
            "Submit a known-existing account and a known-nonexistent one to login, registration, password reset, email-change, and any /check-availability or GraphQL userExists style query.",
            "Diff the full responses: error wording (\"no such user\" vs \"wrong password\"), HTTP status, Location header, JSON field presence, and set-cookie behaviour.",
            "Registration is the most reliable oracle — \"email already in use\" is a direct existence confirmation that programs still ship.",
          ],
        },
        {
          title: "Timing and side-channel oracles",
          steps: [
            "When bodies are identical, measure response time across many samples: an existing account often triggers a real password hash comparison (bcrypt/argon2) while a missing one returns early, leaving a measurable delta.",
            "Watch rate-limit and lockout behaviour — a real account that locks after N tries vs a missing one that never does is itself an oracle.",
            "Check password-reset throttling: \"we sent a link\" for everyone is correct; a different message, or an email that only arrives for real accounts observed out-of-band, leaks existence.",
          ],
        },
      ],
      payloads: [
        "POST /register {\"email\":\"victim@corp.com\"}  ->  \"email already in use\" (exists) vs \"check your inbox\" (new)",
        "POST /login {\"user\":\"victim@corp.com\",\"pass\":\"x\"}  ->  measure bcrypt timing delta vs random@nope.com",
        "POST /graphql {\"query\":\"{ userExists(email:\\\"victim@corp.com\\\") }\"}",
        "POST /password/reset {\"email\":\"victim@corp.com\"}  ->  compare message/status to an unknown address",
      ],
      example:
        "A registration form returned HTTP 409 with \"That email is already registered\" for existing users and HTTP 200 for new ones. Feeding a corporate email list through it cleanly separated staff who had accounts — a P4 on its own (AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N), but it directly seeded an in-scope password-spray that the hunter reported as a chain.",
      mapping: {
        bugcrowdVrt: "Broken Access Control (BAC) › Username/Email Enumeration › Non-Brute Force",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N",
        hackeroneCwe: "CWE-204: Observable Response Discrepancy",
        cvssSeverity: "Low",
        note:
          "The AC:H in the VRT vector reflects that enumeration is a confidentiality-only leak of account existence. It stays P4 alone; severity in practice comes from chaining it into spraying, reset abuse, or targeted ATO, which you report as a combined finding.",
      },
      checklistCategoryId: "access-idor",
      references: [
        { label: "OWASP WSTG: Testing for Account Enumeration", url: "https://owasp.org/www-project-web-security-testing-guide/" },
      ],
    },
    {
      id: "pw-confirm-bypass",
      name: "Bypass of Password Confirmation (Change Password)",
      emoji: "🔁",
      intro:
        "Sensitive actions — changing the password, email, or disabling 2FA — are supposed to re-prove the human by demanding the current password (a re-authentication step that blunts CSRF, session-riding, and over-the-shoulder abuse). This bug is when that confirmation is enforced only in the UI or validated incorrectly, so the action goes through without a correct current password. It is a P4 because the attacker already needs some foothold (an active session, a borrowed device, or a chained bug), but on the change-password action specifically it hands integrity over the account.",
      howToFind: [
        {
          title: "Drop or empty the confirmation field",
          steps: [
            "Capture the change-password request and remove the currentPassword/oldPassword parameter entirely, then send an empty string, then null.",
            "A success with any of these means the field is decorative — the server never cross-checks it against the stored hash.",
            "Also try submitting the wrong current password: a 200 regardless is the same bug surfaced differently.",
          ],
        },
        {
          title: "Parameter and endpoint confusion",
          steps: [
            "Look for a sibling endpoint (admin, mobile API, older /v1) that performs the same password change without the confirmation gate.",
            "Try sending the new password twice (newPassword in both the confirm and current slots) or swapping field names the backend may alias.",
            "If the gate is a separate \"verify current password\" call that returns a token, test whether the change endpoint actually requires that token or accepts the request without it.",
          ],
        },
      ],
      payloads: [
        "POST /account/password {\"newPassword\":\"Hacked123!\"}   (currentPassword field removed)",
        "POST /account/password {\"currentPassword\":\"\",\"newPassword\":\"Hacked123!\"}",
        "POST /account/password {\"currentPassword\":\"wrong-on-purpose\",\"newPassword\":\"Hacked123!\"}",
        "POST /api/v1/user/password {\"newPassword\":\"Hacked123!\"}   (older endpoint missing the gate)",
      ],
      example:
        "The web app enforced a current-password prompt before changing the password, but the underlying POST /account/password simply ignored currentPassword when it was absent. Stripping the field in Burp let the hunter set a new password with only a live session — no knowledge of the old one. Reported at P4 (AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:H/A:N); the write-side integrity impact made it a strong link in an account-takeover chain when combined with a short-lived session leak.",
      mapping: {
        bugcrowdVrt: "Broken Access Control (BAC) › Bypass of Password Confirmation › Change Password",
        bugcrowdPriority: "P4",
        bugcrowdCvss: "AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:H/A:N",
        hackeroneCwe: "CWE-620: Unverified Password Change",
        cvssSeverity: "Low",
        note:
          "The PR:L in the vector is why this is P4 rather than higher — it assumes the attacker already holds a session. Pair it with a session-fixation, stolen-cookie, or CSRF primitive and the confirmation bypass becomes the step that converts transient access into permanent account control.",
      },
      checklistCategoryId: "access-privesc",
    },
  ],
};
