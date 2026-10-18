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
      intro: {
        en: "The server authenticates the caller but authorizes against an object identifier the caller supplies, so the access decision silently degrades from \"does this object belong to me\" to \"does this object exist\". The findable variants in 2025 are rarely the naive /users/1001 — they are iterable ids that view sensitive data (P3), and complex GUID/UUID ids that look unguessable but leak through a second endpoint, email, log, or response body (P4). What makes it escalate is the verb and the sensitivity: a read on an iterable id is P3, but if the same path answers PUT/PATCH/DELETE you cross into modify (P2) and, on fully sensitive data with an iterable id, P1.",
        simple: "The server checks who you are but then authorizes against an object id you supply, so the check quietly drops from \"is this object mine\" to \"does this object exist\". The findable variants in 2025 are rarely the obvious /users/1001 — they are iterable ids that view sensitive data (P3), and complex GUID/UUID ids that look unguessable but leak through a second endpoint, email, log, or response body (P4). What raises it is the verb and the sensitivity: a read on an iterable id is P3, but if the same path answers PUT/PATCH/DELETE you cross into modify (P2) and, on fully sensitive data with an iterable id, P1.",
        hi: "server caller को authenticate तो करता है पर authorization उस object identifier पर करता है जो caller ख़ुद देता है, इसलिए access decision चुपचाप \"क्या यह object मेरा है\" से गिरकर \"क्या यह object मौजूद है\" रह जाता है। 2025 में findable variants शायद ही कभी सीधा-सादा /users/1001 होते हैं — वे iterable ids हैं जो sensitive data देखते हैं (P3), और complex GUID/UUID ids जो unguessable लगते हैं पर किसी दूसरे endpoint, email, log, या response body से leak हो जाते हैं (P4)। इसे escalate verb और sensitivity करते हैं: iterable id पर एक read P3 है, पर अगर वही path PUT/PATCH/DELETE का जवाब दे तो आप modify (P2) में पहुँच जाते हैं और iterable id के साथ पूरी तरह sensitive data पर, P1।",
      },
      howToFind: [
        {
          title: {
            en: "Two-session differential with a full verb sweep",
            simple: "Compare two sessions across every verb",
            hi: "पूरे verb sweep के साथ two-session differential",
          },
          steps: [
            {
              en: "Hold two live sessions (A and B) side by side in Burp with distinct accounts; set a unique, searchable marker on B's object (e.g. a note field = IDOR-CANARY-B).",
              simple: "Keep two live sessions (A and B) open side by side in Burp with different accounts; put a unique, searchable marker on B's object (e.g. a note field = IDOR-CANARY-B).",
              hi: "Burp में दो live sessions (A और B) अलग-अलग accounts के साथ साथ-साथ खुली रखें; B के object पर एक unique, searchable marker लगाएँ (जैसे एक note field = IDOR-CANARY-B)।",
            },
            {
              en: "Capture every request A makes against A's own object, then replay with only the identifier swapped to B's, keeping A's cookie/bearer unchanged.",
              simple: "Capture every request A makes against A's own object, then replay it swapping only the id to B's, leaving A's cookie/bearer unchanged.",
              hi: "A अपने ही object पर जो भी request भेजे उसे capture करें, फिर सिर्फ़ identifier को B के id से बदलकर replay करें, A की cookie/bearer वैसी ही रखें।",
            },
            {
              en: "Repeat the swap across GET, POST, PUT, PATCH and DELETE on the same path — authorization is frequently enforced on the read handler but forgotten on the write handlers that share the route.",
              simple: "Do the same swap across GET, POST, PUT, PATCH and DELETE on the same path — the read handler is often protected while the write handlers on the same route are not.",
              hi: "वही swap उसी path पर GET, POST, PUT, PATCH और DELETE पर दोहराएँ — authorization अक्सर read handler पर लगा होता है पर उसी route वाले write handlers पर भूल जाते हैं।",
            },
            {
              en: "Confirm on content, never on status: a 200 that returns B's canary is the finding; a 200 that returns A's own object (server silently ignored the id) is not.",
              simple: "Confirm on the content, never the status code: a 200 returning B's canary is the bug; a 200 returning A's own object (the server quietly ignored your id) is not.",
              hi: "content पर confirm करें, कभी status पर नहीं: वह 200 जो B का canary लौटाए वही finding है; वह 200 जो A का अपना ही object लौटाए (server ने id चुपचाप नज़रअंदाज़ कर दिया) finding नहीं है।",
            },
          ],
        },
        {
          title: {
            en: "Complex identifier (GUID/UUID) — hunt the leak, then swap",
            simple: "Complex id (GUID/UUID) — find the leak, then swap",
            hi: "Complex identifier (GUID/UUID) — पहले leak ढूँढें, फिर swap करें",
          },
          steps: [
            {
              en: "Treat an unguessable id as findable the moment it appears anywhere the attacker can reach: list/search endpoints, notification emails, Referer headers, shared-link URLs, autocomplete/typeahead, PDF metadata, or a sibling API that returns a collection.",
              simple: "Treat an unguessable id as findable the moment it shows up anywhere the attacker can reach: list/search endpoints, notification emails, Referer headers, shared-link URLs, autocomplete/typeahead, PDF metadata, or a sibling API that returns a list.",
              hi: "किसी unguessable id को उसी पल findable मानें जब वह कहीं भी attacker की पहुँच में दिखे: list/search endpoints, notification emails, Referer headers, shared-link URLs, autocomplete/typeahead, PDF metadata, या कोई sibling API जो पूरा collection लौटाए।",
            },
            {
              en: "Collect a victim's GUID from the low-privilege leak, then use it against the sensitive single-object endpoint from the attacker's session.",
              simple: "Grab a victim's GUID from that low-privilege leak, then use it against the sensitive single-object endpoint from the attacker's session.",
              hi: "उस low-privilege leak से victim का GUID इकट्ठा करें, फिर उसे attacker के session से sensitive single-object endpoint पर इस्तेमाल करें।",
            },
            {
              en: "Watch for predictable-but-not-random ids that masquerade as complex: sequential UUIDv1 (time + MAC ordered), base64/hex of an incrementing integer, or MongoDB ObjectIDs whose leading 4 bytes are a timestamp — these are enumerable, which pushes the variant back toward the iterable (higher-priority) branch.",
              simple: "Watch for ids that look complex but are actually predictable: sequential UUIDv1 (ordered by time + MAC), base64/hex of a counting integer, or MongoDB ObjectIDs whose first 4 bytes are a timestamp — these are enumerable, which pushes the variant back toward the iterable (higher-priority) branch.",
              hi: "ऐसे ids पर नज़र रखें जो complex दिखें पर random न हों: sequential UUIDv1 (time + MAC क्रम में), किसी बढ़ते integer का base64/hex, या MongoDB ObjectIDs जिनके पहले 4 bytes timestamp होते हैं — ये enumerable हैं, जो variant को वापस iterable (ऊँची-priority) branch की ओर धकेल देता है।",
            },
          ],
        },
        {
          title: {
            en: "2025-era edge cases and parser confusion",
            simple: "2025-era edge cases and parser tricks",
            hi: "2025 के edge cases और parser confusion",
          },
          steps: [
            {
              en: "GraphQL: request node(id:) directly or alias the same object many times in one query to bypass per-request checks and to mass-harvest; also try the global node/relay id which base64-encodes the type and raw id.",
              simple: "GraphQL: request node(id:) directly, or alias the same object many times in one query to slip past per-request checks and mass-harvest; also try the global node/relay id, which base64-encodes the type plus the raw id.",
              hi: "GraphQL: node(id:) सीधे request करें या एक ही query में एक object को कई बार alias करके per-request checks bypass करें और mass-harvest करें; global node/relay id भी आज़माएँ जो type और raw id को base64-encode करता है।",
            },
            {
              en: "Parameter pollution and wrapping to confuse the authorization layer vs the data layer: id=self&id=victim, id[]=victim, {\"id\":[\"victim\"]}, or id=victim with a trailing .json / ;.css to hit a different route handler.",
              simple: "Parameter pollution and wrapping to confuse the authorization layer against the data layer: id=self&id=victim, id[]=victim, {\"id\":[\"victim\"]}, or id=victim with a trailing .json / ;.css to hit a different route handler.",
              hi: "authorization layer और data layer को confuse करने के लिए parameter pollution और wrapping: id=self&id=victim, id[]=victim, {\"id\":[\"victim\"]}, या id=victim के बाद .json / ;.css लगाकर किसी दूसरे route handler पर जाना।",
            },
            {
              en: "Identifier relocation: move the id from the path to a body field, JSON pointer, or a tenant/org header (X-Account-Id, X-Tenant) the UI normally sets — gateways often authorize the path but trust the header downstream.",
              simple: "Identifier relocation: move the id from the URL path into a body field, a JSON pointer, or a tenant/org header (X-Account-Id, X-Tenant) the UI normally sets — gateways often authorize the path but trust the header further downstream.",
              hi: "Identifier relocation: id को path से हटाकर किसी body field, JSON pointer, या tenant/org header (X-Account-Id, X-Tenant) में डालें जिसे UI आम तौर पर सेट करता है — gateways अक्सर path को authorize करते हैं पर downstream में header पर भरोसा कर लेते हैं।",
            },
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
      example: {
        en: "A billing API exposed GET /api/v2/invoices/{id}/pdf where id was a zero-padded sequential integer. Swapping A's id for B's returned B's invoice PDF — sensitive data, iterable id, read-only: triaged P3 (Medium). The hunter then noticed the same /api/v2/invoices/{id} route answered PATCH and let them rewrite billingEmail on any invoice; that converted read-only view into modify of sensitive data on an iterable id, lifting the report to P1 and an account-takeover pivot via the changed contact address.",
        simple: "A billing API exposed GET /api/v2/invoices/{id}/pdf where id was a zero-padded counting integer. Swapping A's id for B's returned B's invoice PDF — sensitive data, iterable id, read-only: triaged P3 (Medium). The hunter then saw the same /api/v2/invoices/{id} route answered PATCH and let them rewrite billingEmail on any invoice; that turned read-only view into modify of sensitive data on an iterable id, lifting the report to P1 and an account-takeover pivot via the changed contact address.",
        hi: "एक billing API ने GET /api/v2/invoices/{id}/pdf expose किया जहाँ id एक zero-padded sequential integer था। A के id को B के id से बदलने पर B का invoice PDF मिला — sensitive data, iterable id, read-only: P3 (Medium) पर triage हुआ। फिर hunter ने देखा कि वही /api/v2/invoices/{id} route PATCH का जवाब देता है और किसी भी invoice पर billingEmail बदलने देता है; इसने read-only view को iterable id पर sensitive data के modify में बदल दिया, report को P1 तक उठाया और बदले contact address के ज़रिए account-takeover pivot दिया।",
      },
      mapping: {
        bugcrowdVrt: "Broken Access Control (BAC) › Insecure Direct Object References (IDOR) › View Sensitive Information(Iterable Object Identifiers)",
        bugcrowdPriority: "P3",
        hackeroneCwe: "CWE-639: Authorization Bypass Through User-Controlled Key",
        cvssSeverity: "Medium (P3 lead) — escalates to Critical",
        note: {
          en: "VRT ladder: P1 modify/view sensitive (iterable id); P2 modify sensitive (iterable id); P3 view sensitive (iterable id) — the day-to-day lead; P4 modify/view sensitive (complex GUID/UUID id); P5 view non-sensitive. Two levers move the score: whether you can write (not just read) and whether the id is iterable vs a leaked-complex id. A P4 complex-id IDOR jumps to P1/P2 the moment you show the id is enumerable or reliably leaked.",
          simple: "VRT ladder: P1 modify/view sensitive (iterable id); P2 modify sensitive (iterable id); P3 view sensitive (iterable id) — the everyday lead; P4 modify/view sensitive (complex GUID/UUID id); P5 view non-sensitive. Two levers move the score: whether you can write (not just read), and whether the id is iterable or a leaked-complex one. A P4 complex-id IDOR jumps to P1/P2 the moment you show the id is enumerable or reliably leaked.",
          hi: "VRT सीढ़ी: P1 modify/view sensitive (iterable id); P2 modify sensitive (iterable id); P3 view sensitive (iterable id) — रोज़ का lead; P4 modify/view sensitive (complex GUID/UUID id); P5 view non-sensitive। score को दो lever हिलाते हैं: क्या आप write कर सकते हैं (सिर्फ़ read नहीं), और id iterable है या leaked-complex। एक P4 complex-id IDOR उसी पल P1/P2 पर कूद जाता है जब आप दिखा दें कि id enumerable है या भरोसेमंद ढंग से leak होता है।",
        },
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
      intro: {
        en: "Where IDOR bypasses authorization on an object, this bypasses it on an action or a role. The classic shape is a missing function-level check: the UI hides an admin control but the endpoint behind it still answers a low-privilege token. The subtle, high-signal shape in modern apps is state-based — a role or plan field that the server reads from a request it should have derived server-side (mass assignment), or a check performed once at authentication and then trusted for the rest of the session. It escalates by blast radius: self-service to tenant-admin, single-tenant to cross-tenant, read-admin to write-admin.",
        simple: "Where IDOR bypasses authorization on an object, this bypasses it on an action or a role. The classic shape is a missing function-level check: the UI hides an admin button but the endpoint behind it still answers a low-privilege token. The subtle, high-signal shape in modern apps is state-based — a role or plan field the server reads from a request it should have set server-side (mass assignment), or a check done once at login and then trusted for the rest of the session. It escalates by blast radius: self-service to tenant-admin, single-tenant to cross-tenant, read-admin to write-admin.",
        hi: "जहाँ IDOR किसी object पर authorization bypass करता है, वहीं यह किसी action या role पर करता है। classic shape एक missing function-level check है: UI admin control छिपा देता है पर उसके पीछे का endpoint अब भी low-privilege token का जवाब देता है। आधुनिक apps में subtle, high-signal shape state-based होता है — कोई role या plan field जिसे server उस request से पढ़ता है जिसे उसे server-side ख़ुद तय करना चाहिए था (mass assignment), या वह check जो authentication पर एक बार होता है और फिर पूरे session भर भरोसे में ले लिया जाता है। यह blast radius से escalate होता है: self-service से tenant-admin, single-tenant से cross-tenant, read-admin से write-admin।",
      },
      howToFind: [
        {
          title: {
            en: "Force-browse and method-swap admin functions",
            simple: "Force-browse admin functions and swap methods",
            hi: "admin functions को force-browse और method-swap करें",
          },
          steps: [
            {
              en: "Harvest admin/privileged routes from JS bundles, OpenAPI/Swagger specs, source maps, and (if you can borrow one) an admin account's captured traffic.",
              simple: "Collect admin/privileged routes from JS bundles, OpenAPI/Swagger specs, source maps, and (if you can borrow one) an admin account's captured traffic.",
              hi: "admin/privileged routes को JS bundles, OpenAPI/Swagger specs, source maps, और (अगर मिल सके तो) किसी admin account के captured traffic से इकट्ठा करें।",
            },
            {
              en: "Call each privileged endpoint with a low-privilege token: a 200 or an actual state change is broken function-level authorization; a uniform 403 is correct.",
              simple: "Call each privileged endpoint with a low-privilege token: a 200 or a real state change is broken function-level authorization; a consistent 403 is correct behaviour.",
              hi: "हर privileged endpoint को low-privilege token से call करें: 200 या कोई असली state change broken function-level authorization है; हर बार 403 सही है।",
            },
            {
              en: "When a route 403s, retry with method swaps (GET->POST, POST->PUT), path-case and encoding tricks, and the version-gap trick (same action on /api/v1/ when only /api/v2/ was hardened).",
              simple: "When a route returns 403, retry with method swaps (GET->POST, POST->PUT), path-case and encoding tricks, and the version-gap trick (the same action on /api/v1/ when only /api/v2/ was hardened).",
              hi: "जब कोई route 403 दे, तो method swaps (GET->POST, POST->PUT), path-case और encoding tricks, और version-gap trick (वही action /api/v1/ पर जब सिर्फ़ /api/v2/ hardened हो) के साथ दोबारा कोशिश करें।",
            },
          ],
        },
        {
          title: {
            en: "Mass assignment of role / plan / ownership",
            simple: "Mass-assign role / plan / ownership fields",
            hi: "role / plan / ownership का mass assignment",
          },
          steps: [
            {
              en: "Enumerate the full object shape from a GET or the admin response, then add the privileged fields to a self-service write: role, isAdmin, is_staff, plan, entitlements, ownerId, orgRole.",
              simple: "Work out the full object shape from a GET or the admin response, then add the privileged fields to a write you are allowed to make: role, isAdmin, is_staff, plan, entitlements, ownerId, orgRole.",
              hi: "GET या admin response से पूरे object का shape पता करें, फिर privileged fields को एक self-service write में जोड़ें: role, isAdmin, is_staff, plan, entitlements, ownerId, orgRole।",
            },
            {
              en: "Submit via registration, profile update, or any PATCH the user is allowed to make; re-read the object as a check and confirm the privileged field persisted.",
              simple: "Send it through registration, a profile update, or any PATCH you are allowed to make; re-read the object afterward and confirm the privileged field stuck.",
              hi: "इसे registration, profile update, या किसी भी ऐसे PATCH से भेजें जिसकी user को इजाज़त है; फिर object दोबारा पढ़कर confirm करें कि privileged field टिक गया।",
            },
            {
              en: "Try JSON vs form-encoded and nested paths (user.role) — frameworks bind these differently and a blocklist usually guards only the flat key.",
              simple: "Try JSON against form-encoded, and nested paths (user.role) — frameworks bind these differently and a blocklist usually guards only the flat key.",
              hi: "JSON बनाम form-encoded और nested paths (user.role) आज़माएँ — frameworks इन्हें अलग-अलग bind करते हैं और blocklist आम तौर पर सिर्फ़ flat key को ही रोकती है।",
            },
          ],
        },
        {
          title: {
            en: "Cross-tenant and stale-authorization checks",
            simple: "Cross-tenant and stale-authorization checks",
            hi: "cross-tenant और stale-authorization checks",
          },
          steps: [
            {
              en: "Swap tenant/org identifiers in path, body, or header to act inside another tenant (horizontal move that becomes privileged inside the victim org).",
              simple: "Swap tenant/org identifiers in the path, body, or header to act inside another tenant (a horizontal move that becomes privileged inside the victim org).",
              hi: "path, body, या header में tenant/org identifiers बदलकर किसी दूसरे tenant के अंदर काम करें (एक horizontal move जो victim org के अंदर privileged बन जाता है)।",
            },
            {
              en: "Perform a privileged action, then replay it after your role was downgraded or your membership revoked — if it still succeeds the server authorized once and cached the decision.",
              simple: "Do a privileged action, then replay it after your role was downgraded or your membership removed — if it still works, the server authorized once and cached that decision.",
              hi: "कोई privileged action करें, फिर अपना role downgrade होने या membership revoke होने के बाद उसे replay करें — अगर तब भी चले तो server ने एक बार authorize करके वह decision cache कर लिया है।",
            },
            {
              en: "Chain a benign self-service IDOR into privesc: if you can write another user's record, writing your own role-adjacent fields on their admin record can grant you their rights.",
              simple: "Chain a harmless self-service IDOR into privesc: if you can write another user's record, writing role-related fields onto their admin record can give you their rights.",
              hi: "किसी benign self-service IDOR को privesc में chain करें: अगर आप किसी दूसरे user का record write कर सकते हैं, तो उनके admin record पर role से जुड़े fields लिखना आपको उनके अधिकार दे सकता है।",
            },
          ],
        },
      ],
      payloads: [
        "POST /api/org/members {\"email\":\"me@x.com\",\"role\":\"owner\"}   (mass-assign owner on self-invite)",
        "PATCH /api/me {\"isAdmin\":true,\"plan\":\"enterprise\"}",
        "PUT /api/v1/users/{self}  {\"user\":{\"role\":\"admin\"}}   (nested bind bypasses flat-key blocklist)",
        "POST /admin/api/reports/export   (low-priv token against a force-browsed admin route)",
      ],
      example: {
        en: "A SaaS let any member PATCH their own membership object to update display name and timezone. The object also carried a role field the UI never sent. Adding \"role\":\"owner\" to the body promoted the attacker from member to organisation owner, unlocking billing, member removal, and SSO settings — a self-service action turned into full tenant control. Because the elevated role governed an entire tenant, it scored at the top of the varies range (P1/P2) rather than a flat low.",
        simple: "A SaaS let any member PATCH their own membership object to update display name and timezone. The object also carried a role field the UI never sent. Adding \"role\":\"owner\" to the body promoted the attacker from member to org owner, unlocking billing, member removal, and SSO settings — a self-service action became full tenant control. Because the elevated role ran an entire tenant, it scored at the top of the varies range (P1/P2), not a flat low.",
        hi: "एक SaaS किसी भी member को अपना ही membership object PATCH करके display name और timezone बदलने देता था। उस object में एक role field भी था जिसे UI कभी नहीं भेजता था। body में \"role\":\"owner\" जोड़ने पर attacker member से organisation owner बन गया, billing, member removal, और SSO settings खुल गए — एक self-service action पूरे tenant control में बदल गया। चूँकि elevated role पूरे tenant को चलाता था, यह किसी flat low की जगह varies range के top (P1/P2) पर score हुआ।",
      },
      mapping: {
        bugcrowdVrt: "Broken Access Control (BAC) › Privilege Escalation",
        bugcrowdPriority: "varies",
        bugcrowdCvss: "AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N",
        hackeroneCwe: "CWE-269: Improper Privilege Management (also CWE-285: Improper Authorization)",
        cvssSeverity: "Medium → Critical (varies by elevated role)",
        note: {
          en: "VRT prices this leaf as varies — the score tracks what the gained role can do. Elevating within your own low-privilege context trends Medium; reaching tenant/org admin, cross-tenant control, or platform staff trends P2/P1. Prove the capability, not just the flipped flag.",
          simple: "VRT prices this leaf as varies — the score follows what the gained role can actually do. Elevating within your own low-privilege context trends Medium; reaching tenant/org admin, cross-tenant control, or platform staff trends P2/P1. Prove the capability, not just the flipped flag.",
          hi: "VRT इस leaf को varies रखता है — score इस पर चलता है कि मिला हुआ role क्या कर सकता है। अपने ही low-privilege context में बढ़ना आम तौर पर Medium रहता है; tenant/org admin, cross-tenant control, या platform staff तक पहुँचना P2/P1 की ओर जाता है। सिर्फ़ पलटे हुए flag नहीं, capability साबित करें।",
        },
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
      intro: {
        en: "A non-brute-force oracle that confirms whether an account exists from a single, legitimate request — not from hammering a login. The mechanism is an observable response discrepancy: a difference in body text, HTTP status, redirect target, returned field, or crucially response timing between \"account exists\" and \"does not\" across login, registration, password reset, or a GraphQL/REST availability check. It is a standalone P4, but its real value is as the first stage of a chain: it scopes password spraying, validates breach-list emails, and confirms targets for account-takeover work.",
        simple: "A non-brute-force oracle that confirms whether an account exists from a single, normal request — not from hammering a login. The mechanism is an observable response discrepancy: a difference in body text, HTTP status, redirect target, a returned field, or crucially response timing between \"account exists\" and \"does not\" across login, registration, password reset, or a GraphQL/REST availability check. On its own it is P4, but its real value is as the first stage of a chain: it scopes password spraying, validates breach-list emails, and confirms targets for account takeover.",
        hi: "एक non-brute-force oracle जो एक ही वैध request से पुष्टि कर देता है कि कोई account मौजूद है या नहीं — login को बार-बार ठोकने से नहीं। mechanism एक observable response discrepancy है: login, registration, password reset, या किसी GraphQL/REST availability check पर \"account मौजूद है\" और \"नहीं है\" के बीच body text, HTTP status, redirect target, लौटाए गए field, या ख़ास तौर पर response timing का फ़र्क़। यह अकेले एक P4 है, पर इसकी असली क़ीमत एक chain के पहले चरण के रूप में है: यह password spraying का दायरा तय करता है, breach-list emails को validate करता है, और account-takeover के लिए targets confirm करता है।",
      },
      howToFind: [
        {
          title: {
            en: "Diff every account-aware endpoint",
            simple: "Diff every endpoint that knows about accounts",
            hi: "हर account-aware endpoint का diff लें",
          },
          steps: [
            {
              en: "Submit a known-existing account and a known-nonexistent one to login, registration, password reset, email-change, and any /check-availability or GraphQL userExists style query.",
              simple: "Submit a known-existing account and a known-fake one to login, registration, password reset, email-change, and any /check-availability or GraphQL userExists style query.",
              hi: "login, registration, password reset, email-change, और किसी भी /check-availability या GraphQL userExists जैसी query में एक known-existing account और एक known-nonexistent account भेजें।",
            },
            {
              en: "Diff the full responses: error wording (\"no such user\" vs \"wrong password\"), HTTP status, Location header, JSON field presence, and set-cookie behaviour.",
              simple: "Compare the full responses: error wording (\"no such user\" vs \"wrong password\"), HTTP status, Location header, which JSON fields are present, and set-cookie behaviour.",
              hi: "पूरे responses का diff लें: error का शब्द (\"no such user\" बनाम \"wrong password\"), HTTP status, Location header, कौन-से JSON fields मौजूद हैं, और set-cookie behaviour।",
            },
            {
              en: "Registration is the most reliable oracle — \"email already in use\" is a direct existence confirmation that programs still ship.",
              simple: "Registration is the most reliable oracle — \"email already in use\" directly confirms an account exists, and programs still ship it.",
              hi: "Registration सबसे भरोसेमंद oracle है — \"email already in use\" सीधे-सीधे मौजूदगी की पुष्टि है जिसे programs अब भी ship करते हैं।",
            },
          ],
        },
        {
          title: {
            en: "Timing and side-channel oracles",
            simple: "Timing and side-channel oracles",
            hi: "timing और side-channel oracles",
          },
          steps: [
            {
              en: "When bodies are identical, measure response time across many samples: an existing account often triggers a real password hash comparison (bcrypt/argon2) while a missing one returns early, leaving a measurable delta.",
              simple: "When the bodies look identical, measure response time over many samples: an existing account often triggers a real password hash check (bcrypt/argon2) while a missing one returns early, leaving a measurable gap.",
              hi: "जब bodies एक जैसी हों, तो कई samples पर response time नापें: एक मौजूद account अक्सर असली password hash comparison (bcrypt/argon2) चलाता है जबकि न होने वाला जल्दी लौट आता है, जिससे नापने लायक delta बचता है।",
            },
            {
              en: "Watch rate-limit and lockout behaviour — a real account that locks after N tries vs a missing one that never does is itself an oracle.",
              simple: "Watch rate-limit and lockout behaviour — a real account that locks after N tries while a fake one never does is itself an oracle.",
              hi: "rate-limit और lockout behaviour देखें — एक असली account जो N कोशिशों बाद lock हो जाए बनाम एक न-होने वाला जो कभी lock न हो, यह ख़ुद एक oracle है।",
            },
            {
              en: "Check password-reset throttling: \"we sent a link\" for everyone is correct; a different message, or an email that only arrives for real accounts observed out-of-band, leaks existence.",
              simple: "Check password-reset throttling: \"we sent a link\" for everyone is correct; a different message, or an email that only arrives for real accounts (seen out-of-band), leaks existence.",
              hi: "password-reset throttling जाँचें: सबके लिए \"we sent a link\" सही है; कोई अलग message, या ऐसी email जो out-of-band देखी जाए और सिर्फ़ असली accounts को ही आए, मौजूदगी leak कर देती है।",
            },
          ],
        },
      ],
      payloads: [
        "POST /register {\"email\":\"victim@corp.com\"}  ->  \"email already in use\" (exists) vs \"check your inbox\" (new)",
        "POST /login {\"user\":\"victim@corp.com\",\"pass\":\"x\"}  ->  measure bcrypt timing delta vs random@nope.com",
        "POST /graphql {\"query\":\"{ userExists(email:\\\"victim@corp.com\\\") }\"}",
        "POST /password/reset {\"email\":\"victim@corp.com\"}  ->  compare message/status to an unknown address",
      ],
      example: {
        en: "A registration form returned HTTP 409 with \"That email is already registered\" for existing users and HTTP 200 for new ones. Feeding a corporate email list through it cleanly separated staff who had accounts — a P4 on its own, but it directly seeded an in-scope password-spray that the hunter reported as a chain.",
        simple: "A registration form returned HTTP 409 with \"That email is already registered\" for existing users and HTTP 200 for new ones. Feeding a corporate email list through it cleanly separated staff who had accounts — a P4 on its own, but it directly seeded an in-scope password-spray the hunter reported as a chain.",
        hi: "एक registration form मौजूद users के लिए HTTP 409 के साथ \"That email is already registered\" और नए users के लिए HTTP 200 लौटाता था। उसमें एक corporate email list डालने पर वे staff साफ़-साफ़ अलग हो गए जिनके account थे — अकेले एक P4, पर इसने सीधे एक in-scope password-spray को seed किया जिसे hunter ने एक chain के रूप में report किया।",
      },
      mapping: {
        bugcrowdVrt: "Broken Access Control (BAC) › Username/Email Enumeration › Non-Brute Force",
        bugcrowdPriority: "P4",
        hackeroneCwe: "CWE-204: Observable Response Discrepancy",
        cvssSeverity: "Low",
        note: {
          en: "Enumeration is a confidentiality-only leak of account existence, so it stays P4 on its own. Severity in practice comes from chaining it into spraying, reset abuse, or targeted ATO, which you report as a combined finding.",
          simple: "Enumeration is a confidentiality-only leak of whether an account exists, so on its own it stays P4. Real severity comes from chaining it into spraying, reset abuse, or targeted ATO, which you report as a combined finding.",
          hi: "Enumeration सिर्फ़ account की मौजूदगी का confidentiality-only leak है, इसलिए यह अकेले P4 ही रहता है। असल में severity इसे spraying, reset abuse, या targeted ATO में chain करने से आती है, जिसे आप एक combined finding के रूप में report करते हैं।",
        },
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
      intro: {
        en: "Sensitive actions — changing the password, email, or disabling 2FA — are supposed to re-prove the human by demanding the current password (a re-authentication step that blunts CSRF, session-riding, and over-the-shoulder abuse). This bug is when that confirmation is enforced only in the UI or validated incorrectly, so the action goes through without a correct current password. It is a P4 because the attacker already needs some foothold (an active session, a borrowed device, or a chained bug), but on the change-password action specifically it hands integrity over the account.",
        simple: "Sensitive actions — changing the password or email, or disabling 2FA — are meant to re-prove the human by asking for the current password (a re-auth step that blunts CSRF, session-riding, and over-the-shoulder abuse). This bug is when that confirmation is enforced only in the UI or checked wrongly, so the action goes through without a correct current password. It is P4 because the attacker already needs a foothold (an active session, a borrowed device, or a chained bug), but on the change-password action specifically it hands over integrity of the account.",
        hi: "Sensitive actions — password या email बदलना, या 2FA disable करना — से उम्मीद होती है कि वे current password माँगकर इंसान को फिर से साबित करें (एक re-authentication step जो CSRF, session-riding, और over-the-shoulder abuse को कुंद करता है)। यह bug तब है जब वह confirmation सिर्फ़ UI में लगाया जाए या ग़लत तरीक़े से validate हो, जिससे action बिना सही current password के ही पूरा हो जाए। यह P4 है क्योंकि attacker को पहले से कोई foothold चाहिए (एक active session, उधार लिया device, या कोई chained bug), पर ख़ास तौर पर change-password action पर यह account की integrity सौंप देता है।",
      },
      howToFind: [
        {
          title: {
            en: "Drop or empty the confirmation field",
            simple: "Remove or blank the confirmation field",
            hi: "confirmation field हटाएँ या ख़ाली करें",
          },
          steps: [
            {
              en: "Capture the change-password request and remove the currentPassword/oldPassword parameter entirely, then send an empty string, then null.",
              simple: "Capture the change-password request and delete the currentPassword/oldPassword parameter entirely, then try an empty string, then null.",
              hi: "change-password request capture करें और currentPassword/oldPassword parameter पूरी तरह हटा दें, फिर एक empty string भेजें, फिर null।",
            },
            {
              en: "A success with any of these means the field is decorative — the server never cross-checks it against the stored hash.",
              simple: "If any of these succeed, the field is just decoration — the server never checks it against the stored hash.",
              hi: "इनमें से किसी से भी success का मतलब है वह field बस दिखावा है — server उसे stored hash से कभी cross-check नहीं करता।",
            },
            {
              en: "Also try submitting the wrong current password: a 200 regardless is the same bug surfaced differently.",
              simple: "Also try submitting a wrong current password: a 200 anyway is the same bug showing up another way.",
              hi: "ग़लत current password भेजकर भी देखें: फिर भी 200 आना वही bug है जो दूसरे तरीक़े से सामने आता है।",
            },
          ],
        },
        {
          title: {
            en: "Parameter and endpoint confusion",
            simple: "Parameter and endpoint confusion",
            hi: "parameter और endpoint confusion",
          },
          steps: [
            {
              en: "Look for a sibling endpoint (admin, mobile API, older /v1) that performs the same password change without the confirmation gate.",
              simple: "Look for a sibling endpoint (admin, mobile API, an older /v1) that does the same password change without the confirmation gate.",
              hi: "कोई sibling endpoint ढूँढें (admin, mobile API, पुराना /v1) जो वही password change बिना confirmation gate के कर देता हो।",
            },
            {
              en: "Try sending the new password twice (newPassword in both the confirm and current slots) or swapping field names the backend may alias.",
              simple: "Try sending the new password twice (newPassword in both the confirm and current slots), or swapping field names the backend might treat as aliases.",
              hi: "नया password दो बार भेजकर देखें (newPassword को confirm और current दोनों slots में) या उन field names को बदलकर देखें जिन्हें backend alias मान सकता है।",
            },
            {
              en: "If the gate is a separate \"verify current password\" call that returns a token, test whether the change endpoint actually requires that token or accepts the request without it.",
              simple: "If the gate is a separate \"verify current password\" call that returns a token, test whether the change endpoint really needs that token or accepts the request without it.",
              hi: "अगर gate एक अलग \"verify current password\" call हो जो एक token लौटाता है, तो जाँचें कि change endpoint सचमुच उस token की माँग करता है या उसके बिना भी request स्वीकार कर लेता है।",
            },
          ],
        },
      ],
      payloads: [
        "POST /account/password {\"newPassword\":\"Hacked123!\"}   (currentPassword field removed)",
        "POST /account/password {\"currentPassword\":\"\",\"newPassword\":\"Hacked123!\"}",
        "POST /account/password {\"currentPassword\":\"wrong-on-purpose\",\"newPassword\":\"Hacked123!\"}",
        "POST /api/v1/user/password {\"newPassword\":\"Hacked123!\"}   (older endpoint missing the gate)",
      ],
      example: {
        en: "The web app enforced a current-password prompt before changing the password, but the underlying POST /account/password simply ignored currentPassword when it was absent. Stripping the field in Burp let the hunter set a new password with only a live session — no knowledge of the old one. Reported at P4; the write-side integrity impact made it a strong link in an account-takeover chain when combined with a short-lived session leak.",
        simple: "The web app showed a current-password prompt before changing the password, but the underlying POST /account/password just ignored currentPassword when it was missing. Removing the field in Burp let the hunter set a new password with only a live session — no knowledge of the old one. Reported at P4; the write-side integrity impact made it a strong link in an account-takeover chain when combined with a short-lived session leak.",
        hi: "web app password बदलने से पहले current-password prompt दिखाता था, पर नीचे का POST /account/password तब currentPassword को बस नज़रअंदाज़ कर देता था जब वह ग़ायब हो। Burp में वह field हटाकर hunter सिर्फ़ एक live session से नया password सेट कर सका — पुराना जाने बिना। P4 पर report हुआ; write-side integrity impact ने इसे किसी short-lived session leak के साथ मिलकर account-takeover chain की एक मज़बूत कड़ी बना दिया।",
      },
      mapping: {
        bugcrowdVrt: "Broken Access Control (BAC) › Bypass of Password Confirmation › Change Password",
        bugcrowdPriority: "P4",
        hackeroneCwe: "CWE-620: Unverified Password Change",
        cvssSeverity: "Low",
        note: {
          en: "This is P4 rather than higher because it assumes the attacker already holds a session. Pair it with a session-fixation, stolen-cookie, or CSRF primitive and the confirmation bypass becomes the step that converts transient access into permanent account control.",
          simple: "This is P4 rather than higher because it assumes the attacker already holds a session. Pair it with session-fixation, a stolen cookie, or a CSRF primitive and the confirmation bypass becomes the step that turns temporary access into permanent account control.",
          hi: "यह ऊँचा नहीं बल्कि P4 इसलिए है क्योंकि यह मान लेता है कि attacker के पास पहले से एक session है। इसे किसी session-fixation, चुराई हुई cookie, या CSRF primitive के साथ जोड़ें और confirmation bypass वह step बन जाता है जो अस्थायी access को स्थायी account control में बदल देता है।",
        },
      },
      checklistCategoryId: "access-privesc",
    },
  ],
};
