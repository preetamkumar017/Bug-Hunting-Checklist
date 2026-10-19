// Per-leaf Bounty Hunter Pro-Tips.
//
// bountyToolkit.ts supplies ONE generic BountyTips per bug CLASS (all XSS
// leaves share one blurb, etc.). This map overrides that with tips written for
// each EXACT hand-written deep topic (keyed by LearnTopic.id), so every lesson
// shows triage/impact/dedup advice specific to that VRT leaf — not a shared
// category line.
//
// Resolution order in learn.ts: deep.bountyTips ?? LEAF_BOUNTY_TIPS[id] ?? toolkit.bountyTips
//
// Content scope (deliberately defensive): how to get a VALID finding ACCEPTED
// at triage, how to demonstrate legitimate impact where the VRT supports it,
// and which duplicate / N-A traps waste a hunter's time. No novel exploitation
// payloads live here — those stay in the lesson body and are scope-gated.

import type { BountyTips, Localized } from "@/learn/data/types";

const tri = (en: string, simple: string, hi: string): Localized => ({ en, simple, hi });

export const LEAF_BOUNTY_TIPS: Record<string, BountyTips> = {
  // ── Access Control ────────────────────────────────────────────────────────
  idor: {
    triageSecret: tri(
      "Use TWO of your own test accounts. Access account B's object while logged in as A, and screenshot both IDs side by side. State clearly: 'Only my own two test accounts were used — no third-party data was touched.'",
      "Make two test accounts of your own. From account A, open account B's data, and screenshot both. Say you only used your own accounts.",
      "अपने ही दो test accounts बनाएं। Account A से login करके B का object खोलें और दोनों IDs साथ screenshot करें। लिखें: 'सिर्फ़ अपने दो test accounts इस्तेमाल किए — किसी तीसरे का data नहीं छुआ।'"
    ),
    impactMultiplier: tri(
      "A WRITE/DELETE IDOR, or an iterable numeric ID that exposes PII across all users, pushes P3 toward P2/P1. Show the ID is predictable and enumerable, not a one-off.",
      "If you can edit/delete others' data, or the IDs count up so you can reach everyone, it jumps to High/Critical. Show the ID is easy to guess.",
      "WRITE/DELETE IDOR, या iterable numeric ID जो सभी users का PII खोले, P3 को P2/P1 तक ले जाता है। दिखाएं कि ID predictable और enumerable है, एक इत्तफ़ाक़ नहीं।"
    ),
    avoidDuplicates: tri(
      "Accessing your OWN object is not IDOR. Unguessable UUIDs that need a separate leak to obtain are usually N/A on their own — prove the identifier is predictable or enumerable first.",
      "Opening your own data is not a bug. Random UUIDs that you can't guess are usually rejected unless you can also leak them.",
      "अपना ही object खोलना IDOR नहीं है। Unguessable UUID जिसे अलग leak से पाना पड़े, अकेले अक्सर N/A होता है — पहले साबित करें कि identifier predictable/enumerable है।"
    ),
  },
  privesc: {
    triageSecret: tri(
      "Capture the exact request a low-privilege user replays to hit the admin function, WITH the privileged response body. Prove the UI merely hides the button while the endpoint never checks the role.",
      "Show the request a normal user sends to reach an admin action, and the admin response that comes back. The button is hidden but the server doesn't check your role.",
      "वह exact request capture करें जिसे low-priv user replay करके admin function तक पहुँचता है, साथ में privileged response body। साबित करें कि UI सिर्फ़ button छिपाता है, endpoint role check नहीं करता।"
    ),
    impactMultiplier: tri(
      "If a standard user can reach a tenant/org-admin function — user management, billing, role change — it is P2/P1. Chain it to full organisation takeover and say so.",
      "If a normal user can reach org-admin actions (managing users, billing, roles), it's High/Critical. Show it leads to taking over the whole account/org.",
      "अगर standard user tenant/org-admin function तक पहुँच जाए — user management, billing, role change — तो यह P2/P1 है। इसे पूरे org takeover तक chain करें और लिखें।"
    ),
    avoidDuplicates: tri(
      "Reaching a function your role legitimately has, or a 403 that actually blocks the ACTION, is N/A. Prove the action completes — not merely that the page or API loads.",
      "Reaching something your role is allowed, or a 403 that truly stops the action, is not a bug. Show the action actually finishes.",
      "वह function जो आपके role को वाक़ई मिला है, या 403 जो action को सच में रोकता है, N/A है। साबित करें कि action पूरा होता है — सिर्फ़ page/API load होना काफ़ी नहीं।"
    ),
  },
  "user-enum": {
    triageSecret: tri(
      "Document the exact differential — response text, status code, or response time — between a VALID and an INVALID username, with both requests shown side by side.",
      "Show the exact difference between a real and a fake username: wording, status code, or timing. Put both requests next to each other.",
      "Valid और invalid username के बीच exact differential दस्तावेज़ करें — response text, status code, या timing — दोनों requests साथ दिखाएं।"
    ),
    impactMultiplier: tri(
      "Enumeration alone stays P4/P5. Pair it with a missing rate-limit and a weak password policy to argue a realistic, defensible account-takeover path.",
      "On its own it's low. Combine it with no rate-limit and weak passwords to show a believable account-takeover story.",
      "अकेले enumeration P4/P5 रहता है। इसे missing rate-limit और weak password policy के साथ जोड़कर realistic account-takeover path का case बनाएं।"
    ),
    avoidDuplicates: tri(
      "A login/signup/forgot-password that reveals 'email exists' is often accepted-risk by design and closed N/A. Check the program policy first, and prefer the signup/reset flow over login.",
      "Many sites accept 'email exists' messages on purpose and will reject it. Read the program's rules first.",
      "Login/signup/forgot-password पर 'email exists' दिखाना अक्सर by-design accepted-risk होता है और N/A बंद होता है। पहले program policy देखें।"
    ),
  },
  "pw-confirm-bypass": {
    triageSecret: tri(
      "Show the sensitive action (password or email change) COMPLETING without being re-prompted for the current password — from a request you replayed, with the success response.",
      "Show the password/email change finishing without asking for the current password. Replay the request and show it worked.",
      "Sensitive action (password/email change) को बिना current password माँगे पूरा होते दिखाएं — replay की हुई request और success response के साथ।"
    ),
    impactMultiplier: tri(
      "Combine with a proven XSS or CSRF, or a session that never re-authenticates, to turn it into a full account-takeover primitive → P2/P3.",
      "Pair it with an XSS or CSRF you've proven to turn it into a full account takeover.",
      "इसे proven XSS/CSRF, या ऐसे session जो दोबारा auth नहीं माँगता, के साथ जोड़कर पूरा ATO primitive बनाएं → P2/P3।"
    ),
    avoidDuplicates: tri(
      "If the SERVER still asks for the current password (even via a step you skipped in the UI), it is N/A. The check must be genuinely absent server-side, not just hidden client-side.",
      "If the server still wants the current password (even when you skip the UI step), it's not a bug. The check must be truly missing on the server.",
      "अगर server अब भी current password माँगता है (चाहे UI step आपने skip किया हो), तो N/A है। check सच में server-side ग़ायब होना चाहिए।"
    ),
  },

  // ── Authentication ──────────────────────────────────────────────────────────
  "mfa-bypass": {
    triageSecret: tri(
      "Record the full flow showing WHERE the second factor is skipped — response manipulation, a direct post-2FA endpoint, or backup-code reuse — and prove you reached the authenticated state without it.",
      "Show exactly where 2FA gets skipped and that you got into the account without the code.",
      "पूरा flow record करें जहाँ second factor skip होता है — response manipulation, direct post-2FA endpoint, या backup-code reuse — और साबित करें कि बिना उसके authenticated state तक पहुँचे।"
    ),
    impactMultiplier: tri(
      "A bypass that works PRE-auth (password-only → full session) and on ANY account is P2/P1. Show it defeats MFA generally, not just for your own account's quirk.",
      "A bypass that needs only the password and works on any account is High/Critical. Show it beats MFA for everyone, not just you.",
      "ऐसा bypass जो pre-auth काम करे (सिर्फ़ password → full session) और किसी भी account पर, P2/P1 है। दिखाएं कि यह MFA को आम तौर पर हराता है।"
    ),
    avoidDuplicates: tri(
      "'Remember this device' skipping 2FA, or a bypass that needs the victim's own valid session/OTP, is N/A. The second factor must be genuinely skippable by the attacker.",
      "'Trust this device' skipping 2FA, or needing the victim's own code, is not a bug. The attacker must be able to skip it.",
      "'Remember this device' से 2FA skip, या ऐसा bypass जो victim का valid session/OTP माँगे, N/A है। second factor attacker द्वारा सच में skippable होना चाहिए।"
    ),
  },
  "session-fixation": {
    triageSecret: tri(
      "Prove the session ID is NOT rotated on login — same cookie value before and after authentication — and that it can be set remotely (URL param or a sibling-subdomain cookie).",
      "Show the session cookie stays the same before and after login, and that an attacker can set it from outside.",
      "साबित करें कि session ID login पर rotate नहीं होती — auth से पहले और बाद में वही cookie value — और इसे remotely set किया जा सकता है (URL param या sibling-subdomain cookie)।"
    ),
    impactMultiplier: tri(
      "A remotely-settable fixation (via query param or a sibling subdomain cookie) that SURVIVES login is a real ATO → P2. Spell out the remote-set vector.",
      "If an attacker can set the session from outside and it survives login, that's a real account takeover → High.",
      "Remotely-settable fixation (query param या sibling subdomain cookie से) जो login के बाद भी बनी रहे, असली ATO है → P2। remote-set vector साफ़ लिखें।"
    ),
    avoidDuplicates: tri(
      "If the session token is regenerated at login, it is N/A. A cookie settable only locally, with no remote delivery vector, is usually downgraded.",
      "If the token changes at login, it's not a bug. A cookie only you can set locally is usually downgraded.",
      "अगर session token login पर regenerate होता है, तो N/A है। सिर्फ़ locally settable cookie, बिना remote vector, अक्सर downgrade होता है।"
    ),
  },
  "session-invalidation": {
    triageSecret: tri(
      "Capture an OLD session cookie still authorising an API call AFTER logout / password change — tested in Repeater minutes later, not just in the browser UI.",
      "Show an old session cookie still working on an API call after logout or password change — test it in Repeater a few minutes later.",
      "logout / password change के बाद भी पुरानी session cookie को API call authorise करते capture करें — Repeater में कुछ मिनट बाद test करें, सिर्फ़ browser UI में नहीं।"
    ),
    impactMultiplier: tri(
      "Failure to kill sessions on PASSWORD RESET (the account-recovery flow) is worth more than a plain logout gap — a victim who resets a stolen password stays compromised. Frame it there.",
      "Sessions surviving a PASSWORD RESET is worse than surviving logout — the victim thinks they're safe but isn't. Frame it that way.",
      "Password RESET पर sessions न मरना plain logout gap से ज़्यादा value रखता है — reset के बाद भी victim compromised रहता है। इसी context में पेश करें।"
    ),
    avoidDuplicates: tri(
      "A session that dies server-side within seconds of logout is borderline; confirm the token still authorises a real API call well after the event, or it's rejected as working-as-intended.",
      "If the session dies within seconds, it may be rejected. Confirm the token still works on a real request well after.",
      "logout के सेकंडों में server-side मरने वाला session borderline है; confirm करें कि token event के काफ़ी बाद भी real API call authorise करता है, वरना working-as-intended बंद होगा।"
    ),
  },
  "cleartext-session": {
    triageSecret: tri(
      "Capture the token/credential travelling over plain HTTP (no TLS), or the session cookie missing the Secure flag, with a Burp/packet screenshot showing the value in cleartext.",
      "Show the token or login going over plain HTTP, or the session cookie missing Secure, with a capture of the plaintext value.",
      "token/credential को plain HTTP (बिना TLS) पर जाते, या session cookie पर Secure flag ग़ायब, Burp/packet screenshot के साथ cleartext में capture करें।"
    ),
    impactMultiplier: tri(
      "A login form that POSTs credentials over HTTP on the real auth endpoint (not a redirect) with a MitM capture is a far stronger case than a cosmetic missing flag.",
      "A login that actually sends the password over HTTP (not a redirect), shown with a MitM capture, is much stronger than a missing flag alone.",
      "असली auth endpoint पर HTTP पर credentials POST करने वाला login form (redirect नहीं), MitM capture के साथ, cosmetic missing flag से कहीं मज़बूत case है।"
    ),
    avoidDuplicates: tri(
      "An HTTP→HTTPS redirect where the token only ever transits encrypted is N/A. The sensitive value must ACTUALLY travel in cleartext, not just hit an HTTP URL that redirects.",
      "If HTTP just redirects to HTTPS and the token only ever goes encrypted, it's not a bug. The secret must really travel in cleartext.",
      "HTTP→HTTPS redirect जहाँ token हमेशा encrypted ही जाए, N/A है। sensitive value को सच में cleartext में travel करना चाहिए।"
    ),
  },

  // ── CSRF / CORS ───────────────────────────────────────────────────────────
  csrf: {
    triageSecret: tri(
      "Provide a self-contained HTML PoC that, when a logged-in victim opens it, performs the state-changing action. Prove the DATA changed (before/after), not merely that a 200 came back.",
      "Give a single HTML file that, opened by a logged-in victim, does the action. Show the data actually changed, not just a 200.",
      "एक self-contained HTML PoC दें जो logged-in victim के खोलते ही state-changing action कर दे। साबित करें कि DATA बदला (before/after), सिर्फ़ 200 नहीं।"
    ),
    impactMultiplier: tri(
      "CSRF on email/password change, fund transfer, or 2FA-disable is P2/P1. CSRF on a trivial preference stays P4 — aim your PoC at the account-takeover endpoints.",
      "CSRF on email/password change, money transfer, or turning off 2FA is High/Critical. CSRF on a minor setting stays low — target the takeover endpoints.",
      "Email/password change, fund transfer, या 2FA-disable पर CSRF P2/P1 है। trivial setting पर P4 रहता है — PoC को account-takeover endpoints पर लगाएं।"
    ),
    avoidDuplicates: tri(
      "Endpoints protected by a validated CSRF token, SameSite=Lax/Strict session cookies, or a required custom header are N/A. Prove the token is missing OR not actually validated.",
      "Endpoints with a working CSRF token, SameSite cookies, or a required custom header are not vulnerable. Show the token is missing or ignored.",
      "Validated CSRF token, SameSite=Lax/Strict cookies, या ज़रूरी custom header से protected endpoints N/A हैं। साबित करें कि token ग़ायब है या validate नहीं होता।"
    ),
  },
  clickjacking: {
    triageSecret: tri(
      "Supply a working iframe PoC framing a SENSITIVE, state-changing action, with a visible overlay and a screenshot of the framed target page rendering.",
      "Give a working iframe PoC over a sensitive action, with a screenshot showing the target page loads inside your frame.",
      "एक working iframe PoC दें जो sensitive, state-changing action को frame करे, visible overlay और framed page के render का screenshot के साथ।"
    ),
    impactMultiplier: tri(
      "Clickjacking that drives a ONE-CLICK sensitive action — delete account, authorise OAuth, change email — is far stronger than framing a static page.",
      "Clickjacking that causes a one-click sensitive action (delete account, approve OAuth, change email) is much stronger than framing a plain page.",
      "एक-click sensitive action चलाने वाला clickjacking — account delete, OAuth authorise, email change — static page frame करने से कहीं मज़बूत है।"
    ),
    avoidDuplicates: tri(
      "Framing a page with no sensitive action, or where X-Frame-Options / CSP frame-ancestors already blocks framing, is N/A. Confirm the page actually loads inside the frame.",
      "Framing a page with nothing to click, or one that already blocks framing, is not a bug. Confirm it really loads in your frame.",
      "बिना sensitive action वाला page, या जहाँ X-Frame-Options / CSP frame-ancestors पहले से रोकता है, N/A है। Confirm करें कि page frame में सच में load होता है।"
    ),
  },
  cors: {
    triageSecret: tri(
      "Show the server reflecting your ARBITRARY Origin together with Access-Control-Allow-Credentials: true, plus a PoC fetch that reads authenticated response data cross-origin.",
      "Show the server echoing any Origin you send WITH credentials:true, and a fetch that reads logged-in data from another site.",
      "दिखाएं कि server आपके arbitrary Origin को Access-Control-Allow-Credentials: true के साथ reflect करता है, और एक PoC fetch जो cross-origin authenticated data पढ़े।"
    ),
    impactMultiplier: tri(
      "Credentialed reflection on an AUTHENTICATED endpoint leaking PII or tokens is P2/P3. Read a real secret (email, API token) in the PoC rather than a public field.",
      "Reflecting any origin with credentials on a logged-in endpoint that leaks real data is High/Medium. Read an actual secret in the PoC.",
      "Authenticated endpoint पर credentialed reflection जो PII/tokens leak करे, P2/P3 है। PoC में public field नहीं, असली secret (email, API token) पढ़ें।"
    ),
    avoidDuplicates: tri(
      "Access-Control-Allow-Origin: * WITHOUT credentials on a public, unauthenticated endpoint is N/A — there is nothing secret to steal. The endpoint must return sensitive data.",
      "ACAO: * without credentials on a public endpoint is not a bug — nothing secret to steal. The endpoint must return private data.",
      "Public, unauthenticated endpoint पर ACAO: * बिना credentials N/A है — चुराने को कुछ secret ही नहीं। endpoint को sensitive data लौटाना चाहिए।"
    ),
  },

  // ── Information Exposure ──────────────────────────────────────────────────
  "disclosure-of-secrets": {
    triageSecret: tri(
      "Prove the secret is LIVE — authenticate with it or show it grants access — then REDACT it in the report and state you did not use it beyond a single validation check.",
      "Show the key actually works (one check), then redact it in the report and say you didn't use it further.",
      "साबित करें कि secret LIVE है — उससे authenticate करें या access दिखाएं — फिर report में REDACT करें और लिखें कि एक validation से आगे इस्तेमाल नहीं किया।"
    ),
    impactMultiplier: tri(
      "A working cloud/payment/admin key, or a secret that unlocks other systems, chains to RCE or mass data access → P1/P2. Verify the key is active before claiming impact.",
      "A live cloud/payment/admin key that opens other systems chains to Critical. Check the key works before claiming impact.",
      "working cloud/payment/admin key, या ऐसा secret जो दूसरे systems खोले, RCE/mass data access तक chain होता है → P1/P2। impact से पहले key active होना verify करें।"
    ),
    avoidDuplicates: tri(
      "Expired, revoked, test/sandbox, or public-by-design keys (client-side analytics IDs, Stripe publishable keys) are N/A. Confirm scope and that the key is actually valid.",
      "Expired, test, or public-by-design keys (analytics IDs, publishable keys) are not bugs. Confirm the key is real and still valid.",
      "Expired, revoked, test/sandbox, या public-by-design keys (client-side analytics IDs, publishable keys) N/A हैं। scope और validity confirm करें।"
    ),
  },
  "subdomain-takeover": {
    triageSecret: tri(
      "Claim the dangling resource yourself and serve a BENIGN proof file at the subdomain; screenshot the provider fingerprint plus your control page, then release the claim.",
      "Register the dangling resource and host a harmless proof file on the subdomain; screenshot it, then give it up.",
      "dangling resource खुद claim करें और subdomain पर benign proof file serve करें; provider fingerprint + अपना control page screenshot लें, फिर claim छोड़ दें।"
    ),
    impactMultiplier: tri(
      "Takeover of a subdomain used for COOKIES, OAuth redirects, or a CSP allow-list chains to session theft or auth bypass → P2/P1. Map what trusts that subdomain.",
      "Taking over a subdomain used for cookies, OAuth, or CSP leads to session theft or auth bypass → High/Critical. List what trusts it.",
      "Cookies, OAuth redirects, या CSP allow-list में इस्तेमाल subdomain का takeover session theft/auth bypass तक chain होता है → P2/P1। देखें उसे कौन trust करता है।"
    ),
    avoidDuplicates: tri(
      "A dangling CNAME to a provider that does NOT allow arbitrary claim (or is already the target's) is N/A. Prove you can actually register the resource.",
      "A dangling CNAME you can't actually claim (provider blocks it, or target owns it) is not a bug. Prove you can register it.",
      "ऐसे provider को dangling CNAME जो arbitrary claim न दे (या target का ही हो), N/A है। साबित करें कि आप resource सच में register कर सकते हैं।"
    ),
  },
  "token-leakage": {
    triageSecret: tri(
      "Show the SENSITIVE token in a Referer header sent to a third party, or readable in localStorage/sessionStorage via a realistic vector, and capture the leaked value.",
      "Show the sensitive token leaking in a Referer to another site, or readable in storage through a real vector — capture the value.",
      "sensitive token को third party को जाते Referer header में, या localStorage/sessionStorage में readable, realistic vector से दिखाएं और leaked value capture करें।"
    ),
    impactMultiplier: tri(
      "A session or password-reset token leaking cross-origin via Referer to an attacker-influenced link is a real ATO path → P3/P2. Tie the leak to an actual theft.",
      "A session/reset token leaking via Referer to an attacker link is a real account takeover → Medium/High. Connect it to an actual theft.",
      "Session या reset token का attacker-influenced link को Referer से cross-origin leak होना असली ATO path है → P3/P2। leak को actual theft से जोड़ें।"
    ),
    avoidDuplicates: tri(
      "Non-sensitive tokens, or storage access that needs an XSS you have NOT proven, is N/A. Tie the leak to a concrete exfiltration vector, not a theoretical one.",
      "Non-sensitive tokens, or storage access needing an XSS you haven't proven, is not a bug. Connect it to a real leak path.",
      "Non-sensitive tokens, या storage access जिसके लिए unproven XSS चाहिए, N/A है। leak को concrete exfiltration vector से जोड़ें।"
    ),
  },
  "exif-geolocation": {
    triageSecret: tri(
      "Upload an image carrying GPS EXIF, download it back from the app, and extract the original coordinates with exiftool — proving the server NEVER strips metadata on the user-facing download.",
      "Upload a photo with GPS data, download it from the app, and pull the coordinates back out with exiftool — proving the server keeps the metadata.",
      "GPS EXIF वाली image upload करें, app से वापस download करें, और exiftool से original coordinates निकालें — साबित करें कि server user-facing download पर metadata strip नहीं करता।"
    ),
    impactMultiplier: tri(
      "On a platform where users expect anonymity — dating, marketplace, anonymous reporting — leaking precise HOME GPS is a privacy P3. Frame the concrete real-world harm.",
      "On apps where people expect to stay anonymous (dating, marketplace), leaking exact home GPS is a real privacy issue. Spell out the real harm.",
      "जहाँ users anonymity की उम्मीद रखें — dating, marketplace, anonymous reporting — precise HOME GPS leak privacy P3 है। concrete real-world harm लिखें।"
    ),
    avoidDuplicates: tri(
      "If the app re-encodes or strips EXIF on download, or the image is your own with no victim exposure, it is N/A. Always test the VICTIM-facing download path.",
      "If the app strips EXIF on download, or it's only your own photo with no victim, it's not a bug. Test the download others would see.",
      "अगर app download पर EXIF strip/re-encode करता है, या image आपकी ही है बिना victim exposure, N/A है। हमेशा victim-facing download path test करें।"
    ),
  },
  "verbose-errors-debug": {
    triageSecret: tri(
      "Capture the debug page, stack trace, or enabled introspection and point to the SPECIFIC sensitive data it leaks — internal paths, framework versions, SQL queries, internal IPs.",
      "Screenshot the debug page / stack trace / introspection and point out exactly what sensitive info it leaks.",
      "debug page, stack trace, या enabled introspection capture करें और बताएं कि यह exactly कौन-सा sensitive data leak करता है — internal paths, versions, queries, internal IPs।"
    ),
    impactMultiplier: tri(
      "A debug console that allows code evaluation, or introspection that reveals a hidden admin mutation you then exploit, escalates well beyond P4. Show what the leak ENABLES next.",
      "A debug console that runs code, or introspection exposing a hidden admin action you then use, goes well past low. Show what it enables.",
      "code-eval देने वाला debug console, या introspection जो hidden admin mutation खोले जिसे आप exploit करें, P4 से काफ़ी ऊपर जाता है। दिखाएं leak आगे क्या ENABLE करता है।"
    ),
    avoidDuplicates: tri(
      "A generic stack trace with no sensitive data, or introspection on a fully public schema, is usually informational. Report it only when you can show what the leak unlocks.",
      "A plain stack trace with nothing sensitive, or introspection on a public schema, is usually just informational. Report it only if it unlocks something.",
      "बिना sensitive data वाला generic stack trace, या पूरी तरह public schema पर introspection, अक्सर informational है। तभी report करें जब दिखा सकें leak क्या unlock करता है।"
    ),
  },
  "email-spoofing": {
    triageSecret: tri(
      "Show the missing/weak SPF or DMARC (p=none) record AND send a spoofed email that LANDS in the inbox from the target's exact domain — a received-mail screenshot, not just the DNS record.",
      "Show the weak SPF/DMARC record AND an actual spoofed email landing in the inbox from the real domain — screenshot the received mail.",
      "Missing/weak SPF या DMARC (p=none) record दिखाएं AND target के exact domain से spoofed email inbox में LAND कराएं — सिर्फ़ DNS record नहीं, received-mail screenshot।"
    ),
    impactMultiplier: tri(
      "Spoofing the real CORPORATE domain into a believable phishing/BEC scenario against users is P3. A parked subdomain with no mail use is much weaker.",
      "Spoofing the main corporate domain for a believable phishing attack is Medium. A parked subdomain nobody mails from is weak.",
      "असली corporate domain को believable phishing/BEC scenario में spoof करना P3 है। बिना mail use वाला parked subdomain कमज़ोर है।"
    ),
    avoidDuplicates: tri(
      "DMARC p=none alone, with no DELIVERABLE spoof, or a parked/no-send domain, is frequently N/A. Prove delivery to a real inbox — the record alone is not enough.",
      "Just a weak DMARC record with no email actually delivered, or a no-send domain, is often rejected. Prove it reaches a real inbox.",
      "सिर्फ़ DMARC p=none, बिना deliverable spoof, या parked/no-send domain अक्सर N/A है। real inbox में delivery साबित करें — अकेला record काफ़ी नहीं।"
    ),
  },

  // ── Injection ───────────────────────────────────────────────────────────────
  ssti: {
    triageSecret: tri(
      "Show the template expression evaluating server-side (e.g. the response returns 49 for a 7*7 probe), identify the engine, then demonstrate a controlled config/env read — state you ran no destructive commands.",
      "Show the template math running on the server (7*7 → 49), name the engine, then read a config value — and say you ran nothing destructive.",
      "template expression को server-side evaluate होते दिखाएं (7*7 probe पर response 49), engine पहचानें, फिर controlled config/env read दिखाएं — लिखें कि कोई destructive command नहीं चलाया।"
    ),
    impactMultiplier: tri(
      "SSTI reaching OS command execution is P1 — but this leaf starts at P4, so keep the sandbox-escape → RCE escalation explicit and proven, not asserted.",
      "SSTI that reaches OS commands is Critical, but this leaf starts low — show the escape-to-RCE step clearly, don't just claim it.",
      "OS command execution तक पहुँचने वाला SSTI P1 है — पर यह leaf P4 से शुरू होता है, इसलिए sandbox-escape → RCE escalation explicit और proven रखें।"
    ),
    avoidDuplicates: tri(
      "Client-side template reflection (AngularJS in the browser) is CSTI/XSS, not server SSTI, and is triaged differently. The math must evaluate SERVER-side in the response.",
      "AngularJS template reflection in the browser is client-side (XSS), not server SSTI. The math must run on the server.",
      "Browser में client-side template reflection (AngularJS) CSTI/XSS है, server SSTI नहीं। math response में SERVER-side evaluate होना चाहिए।"
    ),
  },
  crlf: {
    triageSecret: tri(
      "Show your injected CR/LF producing a NEW response header — an injected Set-Cookie, for example — visible in the raw response, not merely a reflected string in the body.",
      "Show your injected newline creating a real new response header (like a Set-Cookie) in the raw response — not just text echoed in the body.",
      "अपने injected CR/LF को एक NEW response header बनाते दिखाएं — जैसे injected Set-Cookie — raw response में दिखे, सिर्फ़ body में reflected string नहीं।"
    ),
    impactMultiplier: tri(
      "CRLF enabling response splitting → web-cache poisoning, or a Set-Cookie session fixation, lifts it toward P2. Show the downstream effect, not just the header split.",
      "CRLF leading to cache poisoning or a Set-Cookie session fixation pushes it toward High. Show the follow-on effect.",
      "CRLF से response splitting → cache poisoning, या Set-Cookie session fixation, इसे P2 की ओर ले जाता है। सिर्फ़ header split नहीं, downstream effect दिखाएं।"
    ),
    avoidDuplicates: tri(
      "Encoded %0d%0a that the server decodes but does NOT emit as a real header is N/A. The injected header must actually appear in the HTTP response.",
      "A %0d%0a the server decodes but never emits as a real header is not a bug. The header must actually show up in the response.",
      "Encoded %0d%0a जिसे server decode करे पर real header के रूप में emit न करे, N/A है। injected header HTTP response में सच में आना चाहिए।"
    ),
  },
  "content-spoofing": {
    triageSecret: tri(
      "Show attacker-controlled HTML/iframe rendering in the TARGET origin in a way a victim would believably trust — injected markup, not just reflected plain text.",
      "Show your HTML/iframe rendering inside the target's own page in a way a victim would trust — real markup, not plain text.",
      "attacker-controlled HTML/iframe को TARGET origin में render होते दिखाएं, ऐसे कि victim विश्वास करे — injected markup, सिर्फ़ reflected plain text नहीं।"
    ),
    impactMultiplier: tri(
      "HTML injection one filter away from XSS, or a convincing in-origin credential-harvest overlay, argues real phishing impact → solid P3. Push toward the XSS if the context allows.",
      "HTML injection that's nearly XSS, or a believable login overlay in the real origin, makes a real phishing case → Medium. Push for XSS if you can.",
      "XSS से एक filter दूर HTML injection, या in-origin convincing credential-harvest overlay, असली phishing impact बनाता है → ठोस P3। context मिले तो XSS की ओर बढ़ें।"
    ),
    avoidDuplicates: tri(
      "Plain text reflection with no markup, or 'spoofing' that only renders in your own view, is informational. It needs victim-facing, trust-abusing rendering in the real origin.",
      "Plain text with no markup, or something only you can see, is just informational. It must render for the victim in the real origin.",
      "बिना markup plain text reflection, या सिर्फ़ अपने view में render होने वाला 'spoofing', informational है। real origin में victim-facing, trust-abusing rendering चाहिए।"
    ),
  },
  "sqli-ceiling": {
    triageSecret: tri(
      "Prove execution SAFELY — the DB banner/version or an out-of-band DNS callback — and state explicitly that zero customer rows were read. Redact anything sensitive you incidentally see.",
      "Prove it works safely (DB version or a DNS callback) and say clearly you read zero customer rows. Redact anything sensitive.",
      "execution SAFELY साबित करें — DB banner/version या OOB DNS callback — और साफ़ लिखें कि शून्य customer rows पढ़े। कुछ sensitive दिखे तो redact करें।"
    ),
    impactMultiplier: tri(
      "This leaf is already P1 — protect that rating by proving RELIABLE execution (OOB or a boolean differential), never a single ambiguous time delay triage can blame on the network.",
      "It's already Critical — defend it with reliable proof (OOB or boolean), not one shaky time delay that triage can blame on the network.",
      "यह leaf पहले से P1 है — rating बचाने के लिए RELIABLE execution साबित करें (OOB या boolean differential), कभी एक ambiguous time delay पर निर्भर न रहें।"
    ),
    avoidDuplicates: tri(
      "A WAF-blocked payload, an error string without confirmed injection, or a sandboxed test database will not hold P1. Lock the proof down before you report.",
      "A blocked payload, an error with no confirmed injection, or a sandbox DB won't keep Critical. Nail the proof before reporting.",
      "WAF-blocked payload, बिना confirmed injection के error string, या sandboxed test DB P1 नहीं टिकाएगा। report से पहले proof पक्का करें।"
    ),
  },

  // ── Server Misconfiguration ─────────────────────────────────────────────────
  "exposed-portal": {
    triageSecret: tri(
      "Show the internal/admin portal is reachable and WHAT it exposes — a screenshot of the sensitive panel or function — without authenticating using any real credentials.",
      "Show the internal/admin portal is reachable and what it reveals, screenshotting the sensitive part — without using real logins.",
      "Internal/admin portal reachable है और WHAT exposes — sensitive panel/function का screenshot — किसी real credential से login किए बिना दिखाएं।"
    ),
    impactMultiplier: tri(
      "A portal with DEFAULT credentials, no auth at all, or that leaks internal data escalates to P2/P1. Test documented default logins once, confirm, and stop.",
      "A portal with default creds, no auth, or leaking internal data jumps to High/Critical. Try documented defaults once, confirm, stop.",
      "Default credentials वाला portal, बिना auth, या internal data leak करने वाला P2/P1 तक जाता है। documented default logins एक बार test करें, confirm, रुकें।"
    ),
    avoidDuplicates: tri(
      "A login page that merely EXISTS and properly rejects you is N/A. The portal must be internal-only-exposed, let you past auth, or leak data pre-login.",
      "A login page that just exists and correctly blocks you is not a bug. It must be internal-exposed, let you in, or leak data before login.",
      "सिर्फ़ मौजूद login page जो आपको सही से reject करे, N/A है। portal internal-only exposed हो, auth पार कराए, या pre-login data leak करे।"
    ),
  },
  "no-rate-limiting": {
    triageSecret: tri(
      "Show hundreds of requests SUCCEEDING (not just rate-error responses) against a sensitive function, with the success count and the resulting effect clearly captured.",
      "Show hundreds of requests actually succeeding (not just errors) against a sensitive function, with the count and the effect.",
      "sensitive function पर सैकड़ों requests SUCCEED होते दिखाएं (सिर्फ़ rate-error नहीं), success count और resulting effect capture करें।"
    ),
    impactMultiplier: tri(
      "Missing limits on OTP/login/reset enabling brute-force → ATO, or on a paid SMS/email endpoint causing real cost, is the version that pays. Tie it to a concrete abuse.",
      "No limits on OTP/login/reset (leading to account takeover) or on a paid SMS/email endpoint (real cost) is the version that pays. Tie it to a concrete abuse.",
      "OTP/login/reset पर missing limits जो brute-force → ATO दे, या paid SMS/email endpoint पर real cost, वही version pay करता है। concrete abuse से जोड़ें।"
    ),
    avoidDuplicates: tri(
      "Flooding a search box or contact form with no security or cost impact is N/A. 'I sent 1000 requests' with no downstream effect is the classic rejected report.",
      "Flooding a search or contact form with no real impact is not a bug. 'I sent 1000 requests' with no effect gets rejected.",
      "बिना security/cost impact वाले search/contact form को flood करना N/A है। 'मैंने 1000 requests भेजीं' बिना downstream effect classic rejected report है।"
    ),
  },
  "missing-cookie-flags": {
    triageSecret: tri(
      "Point to the exact Set-Cookie for the SESSION/auth cookie missing Secure or HttpOnly — a response screenshot. A non-auth cookie missing flags does not count.",
      "Point to the exact Set-Cookie for the session/auth cookie missing Secure or HttpOnly. A non-auth cookie doesn't count.",
      "SESSION/auth cookie का exact Set-Cookie दिखाएं जिसमें Secure या HttpOnly ग़ायब है — response screenshot। non-auth cookie नहीं गिना जाता।"
    ),
    impactMultiplier: tri(
      "A missing HttpOnly on the session cookie only matters paired with a PROVEN XSS. Report the chain (XSS reads the cookie), not the flag in isolation.",
      "Missing HttpOnly only matters with an XSS you've proven. Report the chain (XSS steals the cookie), not the flag alone.",
      "session cookie पर missing HttpOnly तभी मायने रखता है जब PROVEN XSS के साथ हो। flag अकेले नहीं, chain report करें (XSS cookie पढ़े)।"
    ),
    avoidDuplicates: tri(
      "Flags missing on NON-sensitive cookies (analytics, public CSRF, preferences) are N/A. The cookie in question must be the authentication/session cookie.",
      "Flags missing on non-sensitive cookies (analytics, preferences) are not bugs. It must be the auth/session cookie.",
      "NON-sensitive cookies (analytics, public CSRF, preferences) पर flags ग़ायब N/A हैं। cookie authentication/session cookie होनी चाहिए।"
    ),
  },
  "security-headers": {
    triageSecret: tri(
      "Do NOT report the missing header alone — demonstrate the concrete attack it enables: missing CSP + a reflected injection you land, or missing HSTS + a MitM downgrade you show.",
      "Don't report the missing header by itself — show the actual attack it allows (missing CSP + a working injection, missing HSTS + a downgrade).",
      "सिर्फ़ missing header report न करें — वह concrete attack दिखाएं जो यह enable करता है: missing CSP + landed reflected injection, या missing HSTS + MitM downgrade।"
    ),
    impactMultiplier: tri(
      "A missing header is only as valuable as the exploit behind it — a weak CSP you actually BYPASS to land XSS is the real, rewardable finding.",
      "A missing header is only worth the exploit behind it — a weak CSP you bypass to land XSS is the real finding.",
      "missing header उतना ही value रखता है जितना पीछे का exploit — weak CSP जिसे आप सच में BYPASS करके XSS land करें, वही असली finding है।"
    ),
    avoidDuplicates: tri(
      "A bare 'missing X-Frame-Options / CSP / HSTS' scanner line with no working exploit is the single most-rejected N/A across every platform. Never submit it standalone.",
      "A plain 'missing CSP/HSTS/X-Frame-Options' scanner line with no exploit is the most-rejected report everywhere. Never send it alone.",
      "बिना working exploit के 'missing X-Frame-Options / CSP / HSTS' scanner line हर platform पर सबसे ज़्यादा rejected N/A है। standalone कभी submit न करें।"
    ),
  },
  "oauth-account-squatting": {
    triageSecret: tri(
      "Walk the sequence step by step — you register/claim an account tied to a victim's email before they sign up via OAuth, and show they get merged into (or locked out by) your controlled account.",
      "Show the steps: you claim an account on the victim's email before they sign up via OAuth, and they end up merged into your account.",
      "sequence step-by-step दिखाएं — आप victim के email से account register/claim करते हैं इससे पहले कि वे OAuth से sign up करें, और वे आपके controlled account में merge/lock हो जाते हैं।"
    ),
    impactMultiplier: tri(
      "If the squat yields full access to the victim's eventual account (shared email, no verification step), it is an ATO → P2/P3. Prove the account merge or overwrite.",
      "If the squat gives full access to the victim's real account (shared email, no verification), it's an account takeover → High/Medium. Show the merge.",
      "अगर squat से victim के eventual account का full access मिले (shared email, कोई verification नहीं), तो यह ATO है → P2/P3। account merge/overwrite साबित करें।"
    ),
    avoidDuplicates: tri(
      "A flow that properly verifies email ownership, or keeps OAuth and local accounts separate, is N/A. Show the MISSING verification concretely, not just a theory.",
      "A flow that verifies the email, or keeps OAuth and local accounts apart, is not a bug. Show the missing verification concretely.",
      "ऐसा flow जो email ownership सही verify करे, या OAuth व local accounts अलग रखे, N/A है। missing verification concretely दिखाएं, सिर्फ़ theory नहीं।"
    ),
  },
  "dbms-misconfiguration": {
    triageSecret: tri(
      "Show the DB service exposed/misconfigured and WHAT it grants — anonymous connect or default creds — with a connection screenshot, then STOP; do not enumerate or dump data.",
      "Show the DB is exposed/misconfigured and what it allows (anonymous or default login) with a connection screenshot, then stop — don't dump data.",
      "DB service exposed/misconfigured है और WHAT grants — anonymous connect या default creds — connection screenshot के साथ दिखाएं, फिर STOP; data enumerate/dump न करें।"
    ),
    impactMultiplier: tri(
      "An internet-exposed DB with no or default auth holding real data is P1/P2, far above this leaf's P4. Prove reachability and the access level you obtained.",
      "An internet-exposed DB with no/default auth and real data is Critical/High, well above this leaf. Prove you could reach and access it.",
      "Internet-exposed DB बिना/default auth जिसमें real data हो, P1/P2 है — इस leaf के P4 से काफ़ी ऊपर। reachability और access level साबित करें।"
    ),
    avoidDuplicates: tri(
      "A DB port that is open but firewalled/authenticated, or a managed endpoint that rejects you, is N/A. Access or a default-cred login must ACTUALLY work.",
      "A DB port that's open but firewalled or needs real auth, or a managed endpoint that rejects you, is not a bug. The access must really work.",
      "खुला पर firewalled/authenticated DB port, या reject करने वाला managed endpoint, N/A है। access या default-cred login सच में काम करना चाहिए।"
    ),
  },
  "lack-of-password-confirmation": {
    triageSecret: tri(
      "Show a sensitive account action (email change, 2FA removal, account delete) completing with NO password or re-auth prompt at all — from a replayed request with its success response.",
      "Show a sensitive action (email change, remove 2FA, delete account) finishing with no password/re-auth prompt — replay the request.",
      "sensitive account action (email change, 2FA removal, account delete) को बिना किसी password/re-auth prompt के पूरा होते दिखाएं — replay की request और success response के साथ।"
    ),
    impactMultiplier: tri(
      "Combine with a weak session or a CSRF to build a realistic ATO primitive. Standalone it is a P4 hardening gap — the chain is what raises it.",
      "Pair it with a weak session or CSRF for a realistic account-takeover. On its own it's just a low hardening gap.",
      "weak session या CSRF के साथ जोड़कर realistic ATO primitive बनाएं। अकेले यह P4 hardening gap है — chain ही इसे ऊपर उठाता है।"
    ),
    avoidDuplicates: tri(
      "If the server enforces re-auth even when the UI step is skipped, it is N/A. This is distinct from pw-confirm-bypass — here there is simply NO check at all server-side.",
      "If the server still re-auths even when you skip the UI, it's not a bug. Different from pw-confirm-bypass — here there's no check at all.",
      "अगर UI step skip करने पर भी server re-auth enforce करे, N/A है। यह pw-confirm-bypass से अलग है — यहाँ server-side कोई check ही नहीं।"
    ),
  },
  "captcha-implementation": {
    triageSecret: tri(
      "Show the CAPTCHA fully bypassed — token reuse, an empty/removed parameter, or client-only validation — with the protected action succeeding REPEATEDLY afterwards.",
      "Show the CAPTCHA fully bypassed (reused token, removed parameter, client-only check) and the protected action working again and again.",
      "CAPTCHA को पूरी तरह bypass होते दिखाएं — token reuse, empty/removed parameter, या client-only validation — और protected action बार-बार succeed करते।"
    ),
    impactMultiplier: tri(
      "A CAPTCHA bypass that RE-ENABLES brute-force on login/OTP, or free abuse of a costly action, carries the impact. The bypass by itself is low.",
      "A CAPTCHA bypass that lets you brute-force login/OTP again, or abuse a costly action for free, is where the impact is. The bypass alone is low.",
      "ऐसा CAPTCHA bypass जो login/OTP पर brute-force फिर से enable करे, या costly action का free abuse दे, impact रखता है। bypass अकेले low है।"
    ),
    avoidDuplicates: tri(
      "Solving the CAPTCHA with a paid solver service, or a bypass with no protected action behind it, is N/A. The SERVER must accept the missing or reused token.",
      "Using a paid solver, or a bypass with nothing protected behind it, is not a bug. The server must accept the missing/reused token.",
      "paid solver से CAPTCHA solve करना, या बिना protected action वाला bypass, N/A है। SERVER को missing/reused token accept करना चाहिए।"
    ),
  },
  "waf-bypass": {
    triageSecret: tri(
      "Show the ORIGIN server reachable directly (origin IP or Host-header trick), bypassing the WAF, and that a previously-blocked payload now lands — document both the blocked and the direct-hit request.",
      "Show the origin server reachable directly (origin IP or Host header), bypassing the WAF, and a blocked payload now landing — show both requests.",
      "ORIGIN server को directly reachable दिखाएं (origin IP या Host-header trick), WAF bypass करके, और पहले blocked payload अब land करता — blocked और direct-hit दोनों requests document करें।"
    ),
    impactMultiplier: tri(
      "Direct origin access is a force-multiplier: it is valuable when it RE-ENABLES a real vuln the WAF was masking. Report the vuln you now reach, not the bypass alone.",
      "Direct origin access matters when it reopens a real vuln the WAF was hiding. Report the vuln you now reach, not just the bypass.",
      "Direct origin access एक force-multiplier है: तब value है जब यह WAF से छिपा real vuln RE-ENABLE करे। अब पहुँचे vuln को report करें, सिर्फ़ bypass नहीं।"
    ),
    avoidDuplicates: tri(
      "An origin IP that still enforces auth and exposes nothing is informational. The bypass must unlock an ACTUAL attack, otherwise it is just recon.",
      "An origin IP that still needs auth and exposes nothing is just informational. The bypass must unlock a real attack.",
      "ऐसा origin IP जो अब भी auth enforce करे और कुछ expose न करे, informational है। bypass को ACTUAL attack unlock करना चाहिए, वरना यह सिर्फ़ recon है।"
    ),
  },

  // ── SSRF / Redirect ──────────────────────────────────────────────────────
  ssrf: {
    triageSecret: tri(
      "Confirm with an out-of-band callback (interactsh/Collaborator) showing the SERVER making the request from its own IP — the callback log is the proof triage wants, not a reflected URL.",
      "Confirm with an OOB callback (interactsh/Collaborator) showing the server calling out from its own IP — the callback log is the proof.",
      "out-of-band callback (interactsh/Collaborator) से confirm करें कि SERVER अपने IP से request कर रहा है — callback log ही triage का proof है, reflected URL नहीं।"
    ),
    impactMultiplier: tri(
      "SSRF reaching cloud metadata (169.254.169.254) for credentials, or internal admin services, jumps P3 → P1. Show the internal RESPONSE body, not just a blind callback.",
      "SSRF that reaches cloud metadata (169.254.169.254) for creds, or internal admin services, jumps to Critical. Show the internal response, not just a blind ping.",
      "cloud metadata (169.254.169.254) से credentials, या internal admin services तक पहुँचने वाला SSRF P3 → P1 कर देता है। internal RESPONSE body दिखाएं, सिर्फ़ blind callback नहीं।"
    ),
    avoidDuplicates: tri(
      "A callback that is actually your browser or a DNS prefetch, or an SSRF to a public URL with no internal reach, is weak. Prove it is the SERVER and that it reaches something internal.",
      "A callback that's really your browser or DNS prefetch, or SSRF to a public URL with no internal reach, is weak. Prove it's the server reaching internal.",
      "ऐसा callback जो दरअसल आपका browser/DNS prefetch हो, या public URL को SSRF बिना internal reach, कमज़ोर है। साबित करें कि यह SERVER है और internal तक पहुँचता है।"
    ),
  },
  "open-redirect": {
    triageSecret: tri(
      "Show the redirect sending a victim to an EXTERNAL attacker domain from a single parameter, with the resulting Location header pointing to your domain.",
      "Show the redirect sending a victim to an external attacker domain from one parameter, with the Location header pointing to you.",
      "redirect को एक parameter से victim को EXTERNAL attacker domain भेजते दिखाएं, resulting Location header आपके domain की ओर।"
    ),
    impactMultiplier: tri(
      "Open redirect on an OAuth/SSO redirect_uri or any token-bearing flow turns into token/account theft → P2/P3. Hunt the redirect parameter inside auth flows specifically.",
      "Open redirect on an OAuth redirect_uri or token flow becomes token/account theft → High/Medium. Look for the redirect in auth flows.",
      "OAuth/SSO redirect_uri या किसी token-bearing flow पर open redirect token/account theft बन जाता है → P2/P3। redirect parameter को auth flows के अंदर खोजें।"
    ),
    avoidDuplicates: tri(
      "A redirect only to a path on the SAME origin, or one that needs the victim to edit the URL themselves, is N/A or low. It must reach an arbitrary EXTERNAL domain.",
      "A redirect only within the same site, or one needing the victim to edit the URL, is low/N-A. It must reach any external domain.",
      "सिर्फ़ SAME origin के path को redirect, या जिसमें victim को ख़ुद URL edit करना पड़े, N/A या low है। इसे arbitrary EXTERNAL domain तक पहुँचना चाहिए।"
    ),
  },
  tabnabbing: {
    triageSecret: tri(
      "Show a target=\"_blank\" link WITHOUT rel=\"noopener\" where the opened page can rewrite the opener via window.opener.location — confirmed in a current browser where window.opener is non-null.",
      "Show a target=\"_blank\" link without rel=\"noopener\" where the new page can change the opener via window.opener — confirmed in a current browser.",
      "target=\"_blank\" link बिना rel=\"noopener\" दिखाएं जहाँ opened page window.opener.location से opener बदल सके — current browser में confirmed जहाँ window.opener non-null हो।"
    ),
    impactMultiplier: tri(
      "Realistically this stays P5/informational on most programs. Only pursue it when the opener is a sensitive, authenticated page worth a phishing-redirect scenario.",
      "This usually stays informational. Only chase it if the opener is a sensitive logged-in page worth a phishing redirect.",
      "असल में यह ज़्यादातर programs पर P5/informational रहता है। तभी pursue करें जब opener sensitive, authenticated page हो जो phishing-redirect लायक़ हो।"
    ),
    avoidDuplicates: tri(
      "Modern browsers default to noopener for target=\"_blank\", so most of these are N/A now. Confirm window.opener is ACTUALLY non-null in an up-to-date browser before reporting.",
      "Modern browsers add noopener automatically for _blank, so most of these are rejected now. Check window.opener is really non-null first.",
      "Modern browsers target=\"_blank\" के लिए default noopener लगाते हैं, इसलिए अब ज़्यादातर N/A हैं। report से पहले confirm करें कि window.opener up-to-date browser में सच में non-null है।"
    ),
  },

  // ── XSS ────────────────────────────────────────────────────────────────────
  "reflected-non-self": {
    triageSecret: tri(
      "Prove it fires from a SINGLE GET link you hand the victim, showing alert(document.domain) in the TARGET origin — a real-browser screenshot, not a sandbox or data: context.",
      "Prove it fires from one GET link you send the victim, showing alert(document.domain) in the target origin — real browser, not a sandbox.",
      "साबित करें कि यह एक GET link से fire होता है जो victim को दें, alert(document.domain) TARGET origin में दिखे — real-browser screenshot, sandbox/data: context नहीं।"
    ),
    impactMultiplier: tri(
      "Reflected XSS that steals a session or drives a sensitive action chains to ATO → P2. Show cookie theft or an authenticated action in the PoC, not just an alert() box.",
      "Reflected XSS that steals a session or does a sensitive action chains to account takeover → High. Show cookie theft or a real action, not just alert().",
      "session चुराने या sensitive action चलाने वाला reflected XSS ATO तक chain होता है → P2। PoC में cookie theft या authenticated action दिखाएं, सिर्फ़ alert() नहीं।"
    ),
    avoidDuplicates: tri(
      "Self-XSS (the victim must paste the payload into their own session) is P5/N-A. Keep it NON-SELF: one link alone must trigger it on another user.",
      "Self-XSS (victim pastes it into their own session) is low/N-A. Keep it non-self: one link must fire it on another user.",
      "Self-XSS (victim को payload अपने session में paste करना पड़े) P5/N-A है। इसे NON-SELF रखें: अकेला link दूसरे user पर trigger करे।"
    ),
  },
  "stored-by-actor": {
    triageSecret: tri(
      "Document WHO stores and WHO executes — a lower-privileged or unauthenticated actor's input running in another user's or an admin's session. State the actor model explicitly in the report.",
      "Say who stores it and who it runs for — a lower-privileged user's input running in another user's or an admin's session. Spell out the actor model.",
      "WHO stores और WHO executes दस्तावेज़ करें — lower-privileged/unauthenticated actor का input किसी दूसरे user या admin के session में चले। actor model report में साफ़ लिखें।"
    ),
    impactMultiplier: tri(
      "Stored XSS firing in an ADMIN/support session toward privileged actions is P2/P1, and cross-tenant stored XSS is high. Name the victim role precisely.",
      "Stored XSS running in an admin/support session, or across tenants, is High/Critical. Name exactly whose session it fires in.",
      "ADMIN/support session में privileged actions की ओर fire होने वाला stored XSS P2/P1 है, cross-tenant stored XSS high। victim role precisely नाम से लिखें।"
    ),
    avoidDuplicates: tri(
      "A stored payload that executes ONLY in your own session is Self (P5). The band is set entirely by the actor pair — prove genuine cross-actor execution.",
      "A stored payload that runs only in your own session is Self (low). The score depends on the actor pair — prove it runs for another actor.",
      "सिर्फ़ अपने session में execute होने वाला stored payload Self (P5) है। band पूरी तरह actor pair से तय होता है — genuine cross-actor execution साबित करें।"
    ),
  },
  "uxss-referer-datauri": {
    triageSecret: tri(
      "Show execution OFF the main app origin — universal XSS via a browser/extension bug, or via a Referer/data: vector — and clarify EXACTLY which origin runs the script.",
      "Show the script running off the main app origin (browser/extension UXSS, or a Referer/data: vector) and say exactly which origin runs it.",
      "main app origin से OFF execution दिखाएं — browser/extension bug से universal XSS, या Referer/data: vector से — और clarify करें कि EXACTLY कौन-सा origin script चलाता है।"
    ),
    impactMultiplier: tri(
      "True UXSS (any-site script execution via a browser/extension flaw) is severe. But an off-domain data: context that does NOT run in the target origin is weak — be precise about the executing origin.",
      "Real UXSS (running script on any site via a browser/extension bug) is serious. An off-domain data: context not running in the target origin is weak — be precise.",
      "असली UXSS (browser/extension flaw से any-site script execution) severe है। पर off-domain data: context जो target origin में न चले, कमज़ोर है — executing origin के बारे में precise रहें।"
    ),
    avoidDuplicates: tri(
      "A data:/sandbox alert where document.domain is NOT the target, or a Referer leak with no execution, is N/A. Prove the executing origin actually matters to the target.",
      "A data:/sandbox alert where document.domain isn't the target, or a Referer leak with no execution, is not a bug. Prove the running origin matters.",
      "data:/sandbox alert जहाँ document.domain target न हो, या बिना execution का Referer leak, N/A है। साबित करें कि executing origin target के लिए सच में मायने रखता है।"
    ),
  },
};
