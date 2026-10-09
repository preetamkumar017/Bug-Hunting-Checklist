import type { ChecklistCategory, ChecklistDomain, ChecklistItem, Domain, TestingMethod } from "../types/checklist";

interface Recipe {
  title: string;
  prerequisites: string[];
  steps: string[];
  evidence: string[];
  limitations: string[];
  safety: string[];
  reference: string;
  expectedResponse: { vulnerable: string; safe: string };
}

const recipes = {
  authorization: {
    title: "Two-account authorization matrix with owner-side read-back",
    prerequisites: ["Two owned accounts A/B with explicitly different resource or role permissions; one private synthetic object per account with distinct random markers.", "Capture the actual valid operation from the normal client. Record the intended permission table; do not guess endpoint names or enumerate IDs."],
    steps: ["As B, read B's fixture and record its marker and current version. As A, read A's own fixture; both controls must work.", "Copy A's actual request and change only the observed object/tenant reference to B's fixture. Keep A's credential and all unrelated request fields unchanged; do not copy B's cookies accidentally.", "Run an invalid/nonexistent owned fixture identifier as a negative control. Compare protected content, not status/length or a generic success envelope.", "For an authorized reversible write test, alter only a harmless marker field on B's disposable object. Read back as B using an uncached request to determine whether the write persisted. Restore the marker.", "Reverse A/B and repeat the single pair after a fresh session to exclude shared ownership, stale caches and accidental permission grants."],
    evidence: ["Redacted baseline/candidate/negative requests, identity/role matrix, exact synthetic object IDs and owner-side before/after values."],
    limitations: ["Public/shared objects and intended delegated roles are controls, not IDOR. Read permission does not imply write permission. A hidden UI or 200 alone proves neither."],
    safety: ["Use only the two owned objects; avoid enumeration, destructive deletes, real payment fields and unrelated users. Restore marker changes and delete fixtures."],
    reference: "https://portswigger.net/web-security/access-control/idor",
    expectedResponse: { vulnerable: "A obtains B's private marker or changes B's protected fixture contrary to the permission matrix, confirmed by B's read-back.", safe: "A's unauthorized operation is denied while both owner controls succeed; this result covers the tested operation and identity pair only." },
  },
  sqlBoolean: {
    title: "DBMS/context-specific paired boolean confirmation",
    prerequisites: ["A bounded read-only fixture with one known marker row and one known nonmatching row; evidence of an SQL sink and its DBMS, quoting and driver behavior.", "A captured valid lookup. If DBMS or grammar is unknown, record that dependency and adapt before probing; do not substitute SQL for JSON operator or template syntax."],
    steps: ["Repeat the unchanged marker lookup twice and the nonmatching lookup once. Identify a stable row-presence/count signal, excluding timestamps, ads, CSRF values and cached responses.", "At a confirmed numeric expression sink, compare the same seeded numeric identifier followed by AND 1=1 versus AND 1=2, preserving the surrounding query grammar. Neither expression should broaden access to other rows.", "At a confirmed single-quoted string predicate, derive a balanced pair from the actual expression: fixture-marker' AND '1'='1' --  versus fixture-marker' AND '1'='2' -- . MySQL requires whitespace after --; PostgreSQL, SQL Server and SQLite also accept line comments, but driver/newline/context handling still matters. Use only the known seeded marker, not OR-based login bypass.", "Use only the pair matching the observed engine/context, encoded once for its actual transport. Send true, false, false, true in alternating order with unchanged session and fixture state; the true variant should track the valid control and false should track the nonmatching control.", "In a source-enabled fixture correlate parameter binding/query logs without logging secrets. Stop after a repeatable semantic differential; no database dumps, delay payloads or stacked statements are needed."],
    evidence: ["DBMS and sink grammar evidence, exact encoded inputs, repeated response/row signal table, cache status and query trace when available."],
    limitations: ["WAF discrimination, literal text search and validation errors can mimic a differential. The paired result must reflect query semantics; identical or failed responses are inconclusive without a working grammar/control."],
    safety: ["Bound to the seeded read-only row and a small agreed request budget. Remove any stored synthetic markers; do not use this string-predicate recipe in ORDER BY, UNION-column or NoSQL contexts."],
    reference: "https://portswigger.net/web-security/sql-injection/blind",
    expectedResponse: { vulnerable: "Repeatable true/false differences match the seeded row controls and are attributable to the SQL predicate rather than filtering or cache variation.", safe: "The tested value stays literal/bound or is rejected consistently under a validated control; no broader claim about other sinks follows." },
  },
  xss: {
    title: "Browser source-to-sink tracing with an inert control",
    prerequisites: ["A private fixture and the actual browser/rendering path. Record browser version, origin, frame sandbox, CSP and the user interaction required.", "For persistence/sharing checks, two owned profiles: A submits, B views the persisted fixture. Never use a real user's feed or admin queue."],
    steps: ["Submit a unique plain-text marker at the item's actual source. Locate it in the raw response and live DOM; for DOM-only flows pause at the relevant sink and record the call stack.", "Classify the sink: HTML text, quoted attribute, script string, URL, or a DOM API. Trace decoding, sanitization and any later reparsing. Do not reuse an HTML payload inside JSON, script or URL grammar without adapting to that grammar.", "Replace only the marker with a context-matched harmless proof that writes a fixed value to document.documentElement.dataset.assessmentMarker. In an HTML-parsed context an img error handler can demonstrate this; in a textContent sink the same markup must remain text. No cookie reads or outbound requests are needed.", "Compare with an entity-escaped/inert version through the identical path and inspect the actual dataset change plus execution stack. DevTools execution pasted manually is not a source-controlled exploit.", "For stored content, close A's editing session and open the persisted object as B in a fresh browser context through normal navigation. For reflected/DOM content, deliver the actual URL/message from an owned external page. Record whether execution occurs without B editing code."],
    evidence: ["Source marker, sink/encoding context, actual parser/DOM stack, origin, CSP/sandbox, inert-control result and second-profile navigation for stored claims."],
    limitations: ["An alert in the wrong origin, HTML reflection, a loaded image or an analyst console expression is not equivalent to victim-origin script execution. Stored self-XSS needs a separate cross-user delivery path."],
    safety: ["Use a non-networking DOM marker and private content. Delete stored payloads and test uploads, including alternate renderings, after verification."],
    reference: "https://portswigger.net/web-security/cross-site-scripting/contexts",
    expectedResponse: { vulnerable: "Attacker-deliverable input executes the fixed marker in the protected application origin while the inert control does not; persistence is separately verified as B.", safe: "The actual sink keeps the tested input inert or blocks execution; document the precise context and policy tested." },
  },
  ssrf: {
    title: "Attributed outbound fetch and one-hop redirect revalidation",
    prerequisites: ["An owned callback endpoint logging unique path tokens and request time, and an authorized isolated fetch-worker fixture with a harmless service behind the intended destination boundary.", "The actual URL-fetch feature and a unique token per trial. Define allowed/disallowed destinations before testing; never use cloud credentials or arbitrary internal services as canaries."],
    steps: ["Verify the callback listener with an explicitly labeled assessor-control token. Submit a different token through the legitimate fetch feature and correlate its job/request ID with worker logs and callback method/path.", "Repeat with a no-fetch or inert-field control carrying a third token. Avoid opening callback URLs in a browser, link preview or scanner, which would contaminate attribution.", "Distinguish DNS resolution from an HTTP fetch and from returned-content access. A callback from an egress proxy alone may not identify the vulnerable worker; use job correlation and unique paths.", "In the isolated fixture compare an allowed endpoint returning 200 with that same endpoint returning exactly one 302 to the harmless disallowed canary. First verify a direct canary request is denied. Record whether the redirected request is revalidated and reaches the canary.", "Restore the 200 response and repeat the allowed control. Stop after proving the specific boundary crossing; no port scan, recursive redirects or sensitive metadata read is necessary."],
    evidence: ["Per-trial token/job map, listener and worker timestamps, DNS-versus-HTTP classification, redirect Location, direct-denial control and canary log/body marker."],
    limitations: ["Callback reception establishes attributed reachability, not arbitrary internal read/RCE. No callback can mean egress filtering, asynchronous delay or unused input. Redirect behavior varies by HTTP library."],
    safety: ["One redirect hop and synthetic canaries only. Restrict destinations to owned infrastructure; stop listeners, remove webhook jobs and delete tokens after the bounded test."],
    reference: "https://portswigger.net/web-security/ssrf",
    expectedResponse: { vulnerable: "The attributed worker reaches a destination forbidden by the defined policy, directly or after an unvalidated redirect, with impact limited to the observed canary.", safe: "The disallowed direct/redirected fetch is denied while the allowed control succeeds; absence of an interaction without attribution is inconclusive." },
  },
  oauthState: {
    title: "OAuth callback transaction binding across two browser sessions",
    prerequisites: ["Two isolated owned browser profiles A/B, two owned identities at the IdP, and the real application's callback/authorization flow.", "Record whether the client uses state, OIDC nonce and/or session-bound PKCE. Use fresh authorization codes per trial because code replay can mask a missing binding check."],
    steps: ["Complete A's legitimate login/link operation and record the resulting local account and IdP subject. Start a fresh pending transaction in each profile and record each transaction's state/nonce binding without exposing credentials.", "Using an unconsumed callback generated for A's owned IdP identity, attempt callback delivery in B's browser profile while retaining B's session. Test a foreign state, then omitted state, in separate fresh transactions.", "Do not replace both the session and state with A's values; that would simply reproduce A's authorized flow. Keep redirect URI/client ID fixed.", "Inspect B's authenticated account or linked IdP subject and server transaction log. A rendered success page or a rejected reused code does not establish the binding result.", "Run B's legitimate callback as a positive control and check a consumed callback replay separately. Remove test links and sessions afterward."],
    evidence: ["Profile/transaction/state mapping, fresh-code status, local account-to-IdP subject before/after and callback/transaction receipts."],
    limitations: ["State omission alone is not proof of login CSRF if another correctly implemented transaction binding protects the flow. OIDC nonce and PKCE have different roles and must be evaluated in the actual client."],
    safety: ["Use owned accounts and reversible linking only; redact codes/tokens, unlink fixtures and revoke sessions."],
    reference: "https://www.rfc-editor.org/rfc/rfc9700.html",
    expectedResponse: { vulnerable: "B's browser completes an A-originated callback and binds the wrong owned identity without effective transaction authorization.", safe: "Foreign/missing binding is rejected while the corresponding fresh legitimate transaction succeeds." },
  },
  pkce: {
    title: "Isolated S256 verifier-binding and downgrade matrix",
    prerequisites: ["An owned public-client registration that requires PKCE and the actual authorization/token flow; two fresh verifier/challenge pairs generated by the real client or a standards-compliant test library.", "Observe S256: BASE64URL(SHA256(ASCII(verifier))) without padding. Keep client ID, redirect URI and any required session/client context identical between cases."],
    steps: ["Complete one fresh S256 code flow with its matching verifier as the positive control. Record code issuance and token exchange separately.", "Obtain a new S256-bound code for each negative case: omit verifier; use the other flow's verifier; change one verifier character. Redeem each code at most once so single-use rejection does not hide verifier acceptance.", "Start a separate authorization flow omitting the challenge and another requesting plain only if the client's policy requires S256. Determine whether authorization or token issuance rejects the downgrade; code issuance by itself is not a bypass.", "Where the owned fixture permits observing a code without its verifier, confirm it cannot be exchanged by that actor. Do not supply the legitimate verifier to the claimed attacker test.", "Compare token issuance and resource access to the positive flow; revoke all fixture tokens and terminate pending authorizations."],
    evidence: ["Fresh flow/case IDs, challenge method, omitted/mismatched verifier classification, token endpoint result and protected-resource control."],
    limitations: ["Confidential-client authentication failures, expired/reused codes and redirect URI mismatch can mask missing PKCE checks. Successful matching plain PKCE is not itself a bypass unless S256 is required by the actual threat/policy."],
    safety: ["No third-party codes or client secrets; use test registration and redact verifiers/tokens in shared evidence."],
    reference: "https://www.rfc-editor.org/rfc/rfc7636.html",
    expectedResponse: { vulnerable: "A fresh code is redeemed without its required matching verifier, or a prohibited downgrade yields usable tokens under the stated attacker prerequisites.", safe: "Wrong/missing verifier and prohibited downgrades fail while the matching S256 flow succeeds." },
  },
  csrf: {
    title: "Real-browser forgery versus session-bound token controls",
    prerequisites: ["Two owned sessions A/B, a reversible non-security-sensitive marker action and a separate owned origin/site hosting the test page.", "Record cookie SameSite/Secure behavior, Origin/Referer validation and the captured action's actual method/content type. Browser requests cannot arbitrarily set Cookie or Origin."],
    steps: ["As B, perform the legitimate marker action with B's valid token; record owner-side state. Reset it. Keep B logged in while navigating to the controlled external page.", "Construct the form from the actual captured field names using DOM form/input APIs, not string concatenation of arbitrary payloads. Use only browser-supported form methods/enctypes; PUT/DELETE or application/json cannot be assigned to an ordinary form.", "Submit once with token omitted, once with A's token under B's ambient session, and once with an invalid token, restoring the marker between trials. Observe which cookies the browser actually sends.", "For text/plain handling, inspect the browser-generated name=value bytes and trailing newline. Confirm the server parsed the intended body; a hand-crafted proxy body is not a browser PoC.", "Read B's state from the legitimate application after each trial. Compare with the legitimate B-token flow; test within-session token reuse separately, since per-session reuse can be valid."],
    evidence: ["Actual browser request headers/body/cookie presence, source site, token ownership matrix and B's before/after marker."],
    limitations: ["A tokenless authenticated replay is not CSRF. SameSite, custom headers, Origin checks and third-party-cookie policy may prevent delivery. CORS response readability is separate from a successful forged action."],
    safety: ["Never use email/password changes, deletion or real transactions as the initial action. Reset the marker and delete the test page/session data."],
    reference: "https://portswigger.net/web-security/csrf",
    expectedResponse: { vulnerable: "An external page causes B's browser to perform the unauthorized marker action using ambient credentials and no B-bound authorization.", safe: "The forged browser requests cannot change B's marker while the legitimate control succeeds; record the actual defense causing rejection." },
  },
  cors: {
    title: "Credentialed browser read of a private canary",
    prerequisites: ["A synthetic private response marker readable by owned account B and an actually controlled untrusted origin; confirm anonymous requests cannot read the marker.", "An ordinary browser profile with its normal cookie policy. Do not disable web security, paste B's bearer token into the attacker page, or force an Origin header in JavaScript."],
    steps: ["Read the protected resource normally as B and record its marker. From an anonymous context verify it is not public or already cached for everyone.", "While B remains authenticated, visit the owned untrusted-origin page. Use the captured resource URL in fetch(url, {credentials: 'include'}); show any returned marker only in the page's local textContent.", "Inspect actual request cookies and response ACAO/ACAC. credentials: include does not override SameSite or third-party-cookie restrictions, and wildcard ACAO does not permit credentialed response access.", "Compare a trusted-origin control and an untrusted-origin negative control with otherwise identical requests. If the request is non-simple, record preflight and actual request separately.", "Prove the untrusted page's JavaScript receives the private marker, not merely that DevTools or a proxy displays the network response. Restore sessions and remove the fixture page."],
    evidence: ["Browser version/site context, real credential delivery, CORS headers/preflight, anonymous denial and script-visible synthetic marker."],
    limitations: ["Header reflection alone is not a credentialed leak. If no credentials travel, document that limit rather than weakening browser policy. A state-changing simple request may instead be a CSRF finding."],
    safety: ["Private synthetic data only, displayed locally without exfiltration. Clear test sessions and any uniquely scoped cached fixture response."],
    reference: "https://portswigger.net/web-security/cors",
    expectedResponse: { vulnerable: "JavaScript on the owned untrusted origin reads B's otherwise private marker with automatically delivered credentials.", safe: "The browser cannot expose the private marker cross-origin under the tested real cookie/CORS policy, with working legitimate and anonymous controls." },
  },
  race: {
    title: "Two-operation local race with a persistent-state invariant",
    prerequisites: ["An isolated fixture and a stated invariant: single redemption, balance conservation, unique name, or per-action counter bound, depending on this item.", "Reversible seeded state, a mock payment/message sink, transaction/counter telemetry and an agreed maximum of two concurrent operations per initial trial."],
    steps: ["Record initial state and execute the two intended operations sequentially. Read committed state and external mock-sink receipts: the invariant must hold and the second disallowed action must be denied.", "Restore the same snapshot. Prepare the same two valid requests with correct per-request tokens and use a client barrier/parallel request group to release them together; do not assume perfect simultaneity.", "For multi-endpoint checks use one captured request per route touching the same invariant. Keep principals, amounts, identifiers and initial state equal to the sequential control.", "Wait for completion/reconciliation and inspect committed ledger rows, unique records or accepted action counts. Two 200 responses may still correspond to one idempotent operation.", "Repeat a small fixed number of snapshot-restored sequential/parallel trials. Correlate transaction overlap, lost updates or double effects; report the actual violation, not an assumed lock implementation."],
    evidence: ["Snapshot/invariant definition, sequential-versus-parallel schedule, request IDs, committed state and mock-sink effects after reconciliation."],
    limitations: ["Failure to hit a race is not absence of one; client/session locks and database isolation can alter overlap. A latency spike or duplicate success envelope is not an invariant violation."],
    safety: ["Local fixture only for money, quotas or registration. Keep concurrency and trial count bounded; restore snapshots and remove synthetic objects."],
    reference: "https://portswigger.net/web-security/race-conditions",
    expectedResponse: { vulnerable: "The parallel trial violates the committed-state invariant that holds for the same sequential operations.", safe: "The bounded parallel trials preserve the invariant; coverage is limited to the observed interleavings and environment." },
  },
  graphqlAccess: {
    title: "Resolver-level object and field authorization matrix",
    prerequisites: ["Two owned principals and a synthetic private object/field visible to B but not A; the actual schema or observed valid operations.", "Record object-specific, node/interface and nested relationship entry points only if they exist. Introspection availability is discovery, not authorization proof."],
    steps: ["Capture B's valid operation with the smallest selection set returning the private marker. Capture A's equivalent own-object operation and verify both work.", "Keep A's session and substitute B's synthetic identifier in the declared, actually consumed GraphQL variable. Compare each observed resolver route separately rather than guessing user/node type names.", "For field authorization add exactly one protected field to A's otherwise permitted selection set. Inspect data and errors together: GraphQL commonly returns HTTP 200 with field-level denial.", "For nested/aliased routes request the same protected object through one alternative path and compare its authorization. Aliases change response names, not intended authorization.", "For a permitted write fixture change a harmless marker and verify persisted state as B; restore it. Include a nonexistent object control and account for intentionally nullable/public fields."],
    evidence: ["Exact operation/variables, declared variable use, schema resolver path, identity permissions, data/errors and owner-side read-back."],
    limitations: ["Schema discovery, a field name, alias support and 200 responses are not BOLA. Batch processing and query-cost enforcement are separate checks."],
    safety: ["Use only owned markers and minimum fields; no customer enumeration, bulk exports or destructive mutations."],
    reference: "https://portswigger.net/web-security/graphql",
    expectedResponse: { vulnerable: "A resolver path returns or mutates B's protected fixture contrary to the permission matrix even if another path denies it.", safe: "All tested entry points deny the protected field/object to A while B's control succeeds." },
  },
  graphqlCost: {
    title: "Measured query-cost boundary on a tiny GraphQL fixture",
    prerequisites: ["Isolated schema/data with deliberately small depth, alias or cost budgets and resolver/DB-query counters. Record time/CPU/request limits and a stop threshold.", "One actual valid operation over a tiny fixed dataset. Do not assume recursive fields, exponential work or HTTP-array batching are supported."],
    steps: ["Execute the minimal query twice, recording resolver invocations, database calls, cost score, response size and latency; separate cold-cache from warm-cache behavior.", "Change only one axis: add one legitimate nesting level, one alias, or increase a known pagination bound by one. Keep all other variables and the tiny dataset fixed.", "Set the fixture limit low enough to test one operation immediately below and one above it without expensive work. Check whether the above-budget operation is rejected before resolver execution.", "For alias/action quotas compare two operations sent separately with the same two operations in one accepted alias/batch structure. Count resolver-side accepted actions, not HTTP requests; disable email/SMS/payment side effects.", "Stop at the predetermined cap, cancel any outstanding work and verify cancellation in worker counters. Report measured excess work or quota bypass, not a lone timeout."],
    evidence: ["Schema/fixture cardinality, query diff, configured budget, counters before/after, cold/warm trials and rejection/cancellation stage."],
    limitations: ["Depth is not necessarily cost; batching, caching and query planning can bound fan-out. A timeout without controlled telemetry is inconclusive and does not establish production DoS."],
    safety: ["No production exhaustion or password guessing. Two-action initial bound, tiny fixtures and an enforced resource stop cap."],
    reference: "https://graphql.org/learn/security/",
    expectedResponse: { vulnerable: "Controlled execution exceeds the intended cost/action boundary or fails cancellation, corroborated by worker/resolver telemetry.", safe: "The above-budget case is rejected or bounded as documented while the below-budget operation works; only the measured fixture is covered." },
  },
  jwtTrust: {
    title: "JWT signature and key-trust differential",
    prerequisites: ["A valid token for an owned low-privilege identity and a read-only protected marker operation; record issuer, audience, accepted algorithm and trusted key provenance.", "A version-pinned JWT library/inspector in an offline fixture. Preserve valid required claims so an unrelated missing claim does not mask the verification test."],
    steps: ["Replay the original signed token against the marker operation and compare a missing-token denial. Inspect decoded headers/claims as data, without treating decoding as verification.", "Create a copy changing only a harmless owned subject/role test claim while retaining the original signature. The verifier must reject before the changed identity is used.", "For the specific algorithm/key test in this item, change only that verification dimension and retain the rest of the valid token context. Generate candidates offline; neither a tool's output nor local signature calculation proves server acceptance.", "Use the candidate against the same captured operation, then replay the original immediately to check the session/endpoint still works. Record verifier/audit identity plus the protected marker actually returned.", "Use a separately invalid signature/key control to exclude a public route or cookie-based fallback authentication. Redact and revoke test tokens afterward."],
    evidence: ["Header/claim diff, trusted key/algorithm configuration, original/invalid/candidate matrix, effective server identity and marker result."],
    limitations: ["Do not infer trust from token-supplied alg, kid, jwk or jku. Key selection behavior is library/configuration dependent; a candidate rejected for expiry or audience does not isolate signature enforcement."],
    safety: ["Use test keys/identities, no real admin impersonation or online secret guessing. Do not host attacker keys outside an owned test fixture."],
    reference: "https://www.rfc-editor.org/rfc/rfc8725.html",
    expectedResponse: { vulnerable: "The protected operation accepts a token violating its configured signature/key trust boundary and uses the forged owned-fixture identity/claim.", safe: "The candidate is rejected for the intended trust reason while the unchanged token works; token construction alone is not a test result." },
  },
  jwtClaims: {
    title: "Signed-token expiry and claim-policy boundary",
    prerequisites: ["A test issuer capable of minting validly signed fixture tokens, or a real owned token that can be observed naturally expiring; documented exp/nbf/issuer/audience requirements and clock skew.", "A captured protected operation and no alternate session cookie that could authenticate it."],
    steps: ["Confirm the original signed token works and the missing-token control fails. Record server/issuer clock and allowed leeway.", "For expiry, replay the same intact token just before expiry and after expiry plus documented leeway. Do not edit exp without resigning: that only tests signature rejection.", "In the issuer fixture vary one signed claim at a time: wrong audience, unexpected issuer, future nbf, or expired exp, retaining all other required fields. Test only claims the resource server is configured to enforce.", "Compare protected marker access and verifier rejection reason with the validly signed positive control. For revocation checks revoke an owned token/session and account for the product's stated propagation window separately from exp.", "Revoke remaining fixture tokens and retain only redacted claim/time evidence."],
    evidence: ["Signed-case matrix, clock/leeway/revocation policy, test timestamps and protected-resource/verifier results."],
    limitations: ["Claims are application policy, not universally mandatory in every JWT use. Signature failure on an edited unsigned claim does not demonstrate claim validation."],
    safety: ["Synthetic issuer/keys or owned expiring tokens only; do not change production clocks or trust configuration."],
    reference: "https://www.rfc-editor.org/rfc/rfc8725.html",
    expectedResponse: { vulnerable: "A correctly signed token outside the required temporal/issuer/audience policy accesses the protected marker beyond documented leeway.", safe: "The invalid-policy token is rejected while the valid-policy signed token succeeds." },
  },
  cachePoison: {
    title: "Unique-key cache poisoning with an independent requester",
    prerequisites: ["An isolated cache route or an explicitly approved unique fixture key and purge/expiry control. Verify the chosen key differentiator is actually in the cache key before introducing a marker.", "Two independent clients with no shared cookie jar/local cache; a harmless text response marker and cache/origin telemetry."],
    steps: ["Purge only the fixture entry. Request two distinct proposed keys and confirm distinct origin fills/cache entries; do not assume a query cache-buster is keyed.", "On one proven-isolated key, client A changes only the item's unkeyed header or parameter to a harmless unique marker. Capture origin output, Vary, Age/cache status and the actual stored key when available.", "Client B requests that exact key without the injected field and without A's credentials. Confirm whether the marker appears in B's response, not merely in A's reflected origin response.", "Use the other isolated key as a clean control, then purge the candidate key and request it as B before any A injection. The marker should disappear unless it is persistent origin state rather than cache contamination.", "Repeat one fill/read cycle and record cache/origin request IDs. Purge/expire both fixture entries and verify a clean read afterward."],
    evidence: ["Verified key separation, A injection/B clean request pair, response marker, cache hit/fill provenance, clean-key and post-purge controls."],
    limitations: ["Age/X-Cache alone may be misleading across cache layers. Reflection without independent reuse is not poisoning. A normal shared public response is not private-data leakage."],
    safety: ["Never poison a shared production key with executable content. Stop if key isolation cannot be proved; use an isolated cache instead and purge fixture entries."],
    reference: "https://portswigger.net/web-security/web-cache-poisoning",
    expectedResponse: { vulnerable: "B receives A's unkeyed marker under a shared fixture cache key without supplying the input; clean-key/post-purge controls exclude origin persistence.", safe: "The marker is not reused for B, or the variation is correctly keyed/noncacheable under the tested conditions." },
  },
  cacheDeception: {
    title: "Private canary cache-deception read from a separate client",
    prerequisites: ["An owned private marker page and an isolated cache fixture with known route parsing and purge control; independent authenticated B and anonymous A clients.", "A unique path proven isolated in the cache key. Do not use another person's personalized page or assume a .css suffix is cached."],
    steps: ["Confirm B reads the private marker on the legitimate path while A is denied. Record Cache-Control, Vary and actual cache behavior.", "In the fixture derive one path variant using the item's delimiter/extension mechanism. Verify it still resolves to B's private resource, rather than a generic error or unrelated static file.", "Let B request that unique variant once to fill the cache, then request the identical variant as A with no cookies or bearer token. Check for the exact private marker.", "Purge only that entry and request it as A first; denial should return. Compare with a separate clean key and the normal authenticated path.", "Purge all fixture variants, verify clean reads and remove the synthetic private record."],
    evidence: ["Authenticated/anonymous marker controls, route interpretation, unique cache key, B-fill/A-read sequence and post-purge denial."],
    limitations: ["A route accepting suffixes is not a leak unless the shared cache serves B's private content to A. Cache status or extension alone is insufficient."],
    safety: ["Synthetic private data and isolated keys only; stop if purge/key isolation is unavailable."],
    reference: "https://portswigger.net/web-security/web-cache-deception",
    expectedResponse: { vulnerable: "A reads B's private marker from the cache variant after B's fill, while normal and post-purge anonymous controls deny it.", safe: "Private content is not shared through the tested route/cache interpretation mismatch." },
  },
  llmTrace: {
    title: "Trusted tool receipts versus prompt-induced claims",
    prerequisites: ["For disclosure: a protected synthetic canary recorded independently outside the attack prompt. For action tests: a reversible/no-op tool fixture with trusted server-side execution logs, caller identity, arguments and authorization decision.", "Record model/version, sampling settings, permissions and approval policy. Use paired clean/modified conversations with identical initial state."],
    steps: ["Run the legitimate task with a clean input/document and confirm the expected tool result or permitted canary access against its independent source.", "Change only the item's prompt, retrieved content or tool argument to request a harmless out-of-policy marker disclosure/operation. Confirm the untrusted material was actually retrieved/consumed using provenance IDs.", "Run a negative control where the same instruction is quoted as data or supplied to a principal without the required permission. Start a fresh conversation/snapshot for each trial to avoid memory contamination.", "For disclosure, compare exact output with the independently seeded secret marker; do not put it into the attack prompt. For actions, compare proposed calls with backend dispatch, authorization and effect receipts. A model saying 'done' or displaying an invented canary is not proof; a denied proposal may show model susceptibility without a backend failure.", "Repeat a small fixed trial count and record success/attempt counts with settings. Test cancellation/denial only for applicable tool workflows promised by the product, then verify no queued side effect occurred. Reset all fixture state."],
    evidence: ["Prompt/document diff and provenance, caller/permission context, model settings, proposed-versus-executed call tuples and authoritative marker/effect receipts."],
    limitations: ["Source content and tool results are untrusted; only backend provenance/effects establish authorization impact. Nondeterminism and incomplete tracing limit conclusions; no lab guarantee is implied."],
    safety: ["Mock outbound email/payment/filesystem effects and use synthetic canaries; remove injected documents and reset conversations/memory and tool queues."],
    reference: "https://genai.owasp.org/llmrisk/llm06-excessive-agency/",
    expectedResponse: { vulnerable: "Trusted receipts prove the untrusted input caused a prohibited canary disclosure or marker operation under the recorded actor policy.", safe: "The defined backend boundary blocks the candidate effect while the legitimate control works, regardless of what the model claims." },
  },
  llmTenant: {
    title: "Two-tenant retrieval and memory canary isolation",
    prerequisites: ["Two owned tenants/workspaces A/B with distinct high-entropy synthetic document/memory markers and explicit access/retention policies.", "Read-only access to trusted retrieval IDs, applied tenant filters, cache keys, citations/source-download authorization or memory provenance."],
    steps: ["As each owner verify recall/retrieval of their own marker in a fresh conversation. Record document/memory IDs, tenant ownership and indexing status.", "As A request B's known synthetic title/subject without including B's secret marker in the prompt. Compare exact-title and paraphrased queries against a nonexistent-document negative control.", "Inspect retrieved document IDs and authorization before generation, then inspect output and citation/source-download access. Retrieval of a private document is distinct from a model guessing its name.", "Repeat after revoking/deleting B's fixture within the promised propagation window. Use a fresh conversation and compare cache-hit/miss paths without altering production caches.", "If memory is the item under test, switch workspace/user explicitly and inspect stored read/write provenance; an untrusted document must not silently create a persistent privileged rule. Verify later behavior separately from current output."],
    evidence: ["Owner-positive/nonexistent/cross-tenant matrix, marker hashes, IDs/filters/cache provenance and timed revocation/deletion results."],
    limitations: ["Do not put the secret canary into the attack prompt and then count its echo as a leak. Shared documents, eventual indexing and retention policies must be accounted for."],
    safety: ["No real customer search/enumeration. Remove synthetic docs/memory, reset fixture caches/sessions and preserve only redacted provenance."],
    reference: "https://genai.owasp.org/llmrisk/llm08-vector-and-embedding-weaknesses/",
    expectedResponse: { vulnerable: "A obtains B's independently seeded private marker/content or a promised revoked memory through a prohibited retrieval/cache/source path.", safe: "Owners retain permitted access and cross-tenant/revoked controls fail within the documented propagation window." },
  },
} satisfies Record<string, Recipe>;

type RecipeId = keyof typeof recipes;
export interface PlaybookRecipeRoute { domainId: Domain; categoryId: string; itemId: string; recipeId: RecipeId; focus: string }
export const playbookRecipeRoutes: PlaybookRecipeRoute[] = [];
function route(domainId: Domain, categoryId: string, recipeId: RecipeId, entries: Record<string, string>) {
  for (const [itemId, focus] of Object.entries(entries)) playbookRecipeRoutes.push({ domainId, categoryId, itemId, recipeId, focus });
}
route("web", "access-idor", "authorization", {
  "web-access-idor-1": "Change only the captured path identifier, retaining A's session.",
  "web-access-idor-2": "Compare only identifier formats actually supported for the same owned object; UUID unpredictability is not authorization.",
  "web-access-idor-3": "Change the observed JSON/body reference and preserve its type and unrelated fields.",
  "web-access-idor-4": "Use two private synthetic documents and compare a fixed content hash/marker, including signed-download expiration and ownership.",
  "web-access-idor-6": "Use a tiny export fixture containing only the two owned rows; inspect the exported file, not merely job creation.",
  "web-access-idor-7": "Use a reversible marker update first. Deletion is limited to an explicitly disposable fixture; verify independently as its owner.",
});
route("api", "api-auth", "authorization", {
  "api-auth-2": "Change the actual object reference while retaining A's valid token.",
  "api-auth-3": "Compare low-role A with privileged B on the same known read-only function; do not confuse object ownership with function-level permission.",
  "api-auth-4": "Keep identity/resource constant and compare read-only versus write-scoped tokens on a reversible marker operation.",
  "api-auth-9": "Change only the actual tenant path/header/body selector; inspect whether server-derived tenant context overrides it.",
});
route("web", "inject-sqli", "sqlBoolean", {
  "web-inject-sqli-1": "A quote error is a lead. Select one confirmed SQL string/numeric predicate and validate with the bounded paired controls below.",
  "web-inject-sqli-4": "Choose a stable row-presence oracle on synthetic data; no bit-by-bit extraction is needed for confirmation.",
  "web-inject-sqli-7": "Trace the specific processed header to its SQL consumer; if consumption is asynchronous, trigger the known reader once and correlate its job/log rather than the initial response.",
  "web-inject-sqli-8": "First reproduce the manual pair on the exact parameter before allowing any automation; retain the same budget and no extraction.",
});
route("web", "inject-xss", "xss", {
  "web-inject-xss-1": "Use the actual reflected URL parameter and recorded encoding context; second-user delivery is via the crafted URL, not a storage claim.",
  "web-inject-xss-2": "Require A-submit/B-view persistence after the editing session closes; inspect every relevant normal render surface.",
  "web-inject-xss-3": "Record the client source and sink call stack; the fragment may never appear in an HTTP request.",
  "web-inject-xss-4": "Compare upload serving mode, final origin, Content-Type and Content-Disposition in B's browser; SVG embedded as an img may behave differently from direct navigation.",
  "web-inject-xss-6": "Follow the JSON value through the consumer into the DOM; a JSON response containing markup is not execution.",
  "web-inject-xss-7": "Record sanitizer input/output and the actual DOM after reparsing with the deployed browser/library version; require a marker after the full round trip.",
  "web-inject-xss-8": "Compare source markdown, generated HTML and live DOM; record required link clicks and URL-scheme handling.",
});
route("web", "inject-ssrf", "ssrf", {
  "web-inject-ssrf-1": "Test the observed URL-fetch field; determine whether response content is returned or only outbound reachability is visible.",
  "web-inject-ssrf-3": "Prioritize per-job callback attribution; the single-hop fixture is an optional next step only when the intended destination policy can be modeled.",
  "web-inject-ssrf-5": "The key comparison is direct canary denial versus redirected canary access, with an otherwise identical allowed starting URL.",
  "web-inject-ssrf-6": "Create one owned webhook and trigger one synthetic event; distinguish configuration acceptance from asynchronous dispatch.",
  "web-inject-ssrf-8": "Use the parser's actual supported external-reference field in a tiny document. Attribute the fetch to conversion/parse time, not a browser preview.",
});
route("api", "api-injection", "ssrf", { "api-inject-8": "Use the actual captured URL-bearing JSON field and the feature's real trigger; preserve all other fields and authentication." });
route("web", "auth-oauth", "oauthState", { "web-auth-oauth-2": "Isolate transaction binding from code reuse by creating a fresh pending authorization for every swapped/omitted-state trial." });
route("web", "auth-oauth", "pkce", { "web-auth-oauth-4": "Prove token redemption without required verifier binding, not just authorization-code issuance." });
route("web", "req-csrf", "csrf", {
  "web-req-csrf-1": "Use an actual reversible POST operation and record all alternative Origin/SameSite/custom-header defenses.",
  "web-req-csrf-2": "A's token must be paired with B's automatically sent session, not with A's own session. Same-session reuse is a separate valid control.",
  "web-req-csrf-3": "Focus on actual browser-generated text/plain or form bytes and server parsing; do not claim arbitrary JSON/PUT can be sent by a form.",
  "web-req-csrf-6": "Build the final PoC from the confirmed captured action, then reproduce in a fresh normal browser profile without proxy header overrides.",
});
route("web", "req-cors", "csrf", { "web-req-cors-4": "Test the simple request's unauthorized state change; skipping OPTIONS is normal and does not by itself imply readable cross-origin data." });
route("web", "req-cors", "cors", {
  "web-req-cors-1": "Use a genuinely controlled arbitrary origin; do not replace the browser's Origin header manually.",
  "web-req-cors-2": "Use a sandboxed iframe with allow-scripts but without allow-same-origin to obtain an opaque Origin: null. Record actual credential delivery and do not manually inject a null header.",
  "web-req-cors-3": "Use an owned subdomain permitted by scope or a controlled lookalike origin; do not claim a subdomain takeover without independently proving control.",
  "web-req-cors-5": "Display the canary with textContent on the controlled page; no external exfiltration destination is necessary.",
});
route("web", "biz-race", "race", {
  "web-biz-race-1": "Invariant: one seeded redemption changes the mock balance at most once.",
  "web-biz-race-2": "Invariant: the one-time fixture voucher has at most one successful committed redemption.",
  "web-biz-race-3": "Invariant: total committed withdrawals plus remaining balance equals initial fixture funds, accounting for documented fees.",
  "web-biz-race-4": "Invariant: exactly one owner may claim the synthetic unique name; use two owned registration fixtures.",
  "web-biz-race-5": "Set the local quota to one and compare two sequential versus two parallel harmless actions with the same quota identity/window.",
  "web-biz-race-6": "Choose two real fixture routes updating the same resource; compare the same pair sequentially and concurrently against one shared invariant.",
});
route("web", "adv-graphql", "graphqlAccess", { "web-adv-gql-1": "Focus on one protected field and compare its resolver permissions between A/B.", "web-adv-gql-4": "Focus on the actual object/node reference and separately verify reversible mutations by owner-side read-back." });
route("web", "access-idor", "graphqlAccess", { "web-access-idor-5": "Compare type-specific and node/interface entry points only if present in the actual schema." });
route("web", "adv-graphql", "graphqlCost", { "web-adv-gql-2": "Measure one cost/depth dimension with a tiny fixture and a deliberately low test limit.", "web-adv-gql-3": "Use two mock verification actions; compare resolver-side quota accounting across separate versus batched operations without password guessing." });
route("api", "api-graphql-modern", "graphqlCost", { "api-gql-dos-1": "Use low fixture depth/cost limits and actual resolver counts, not an assumed exponential join.", "api-gql-alias-1": "Compare two aliases with two separate mock actions and inspect the per-account counter; alias support itself is expected." });
route("web", "adv-jwt", "jwtTrust", {
  "web-adv-jwt-1": "Generate an alg:none candidate with an empty signature segment, preserving required fixture claims; compare the verifier's configured algorithm policy.",
  "web-adv-jwt-2": "Only for an observed asymmetric verifier: locally compute the HS256 candidate using the exact public-key byte representation and compare rejection. The public key is not a legitimate HMAC secret.",
  "web-adv-jwt-4": "In the owned fixture test an unknown kid and a test-controlled key identifier separately; inspect the actual key resolver rather than assuming SQL/filesystem lookup.",
  "web-adv-jwt-6": "Change one harmless fixture claim without resigning; distinguish real JWT acceptance from an unrelated cookie authenticating the request.",
});
route("api", "api-auth", "jwtTrust", { "api-auth-7": "Change the owned fixture role/scope claim without resigning and verify effective server authorization, not client UI rendering." });
route("web", "auth-login", "jwtTrust", { "web-auth-login-7": "Select only an algorithm/key test supported by observed verifier configuration; no online secret brute force is part of this recipe." });
route("web", "adv-jwt", "jwtClaims", { "web-adv-jwt-5": "Test the same valid signature across natural expiry plus documented clock leeway; isolate signature validation from temporal claims." });
route("web", "adv-cache", "cachePoison", { "web-adv-cache-1": "Vary one observed forwarded/header input and inspect whether the cache includes it in its effective key.", "web-adv-cache-2": "Verify the candidate parameter is unkeyed independently of the unique isolation key; use plain text, not an executable payload." });
route("web", "adv-cache", "cacheDeception", { "web-adv-cache-3": "Test one actual origin/cache path interpretation mismatch with private synthetic content and a proven isolated key." });
route("ai", "ai-prompt-inject", "llmTrace", { "ai-prompt-1": "Compare the direct override with a known protected canary/denied mock action, not with a claimed change of safety policy.", "ai-prompt-2": "Keep the legitimate task fixed and change only one owned retrieved document; confirm its content ID appears in trusted retrieval traces.", "ai-prompt-3": "Compare the same canary/action request in plain versus encoded/translated form. Decoding or language change alone is not a boundary violation." });
route("ai", "ai-agency", "llmTrace", { "ai-agency-1": "Compare low-role and permitted callers on one harmless tool; inspect authorization and queued/cancelled execution receipts.", "ai-agency-2": "Change only the observed object/tenant argument to B's owned fixture and verify owner-side effect; never use real customer IDs.", "ai-mcp-tool-poisoning": "Bind each receipt to server identity, tool version and approved argument tuple. Compare clean/poisoned metadata and a changed argument after approval without allowing a real side effect." });
route("ai", "ai-agency", "llmTenant", { "ai-memory-isolation": "Inspect memory read/write/deletion provenance across fresh users/workspaces, then test later effects of an untrusted persistent-instruction write separately." });
route("ai", "ai-rag-leakage", "llmTenant", { "ai-rag-2": "Distinguish retrieval filtering, generation, cache reuse, citations and source download as separate tenant boundaries." });
route("ai", "ai-rag-leakage", "llmTrace", { "ai-rag-1": "Seed a secret test canary with owner assistance and verify against its independent source. Plausible reconstructed prompts and public rules are not secret disclosure." });
route("ai", "ai-output-handling", "xss", { "ai-output-1": "Hold the generated response text fixed and inspect the actual markdown/HTML consumer; confirm A-created shared chat content executes only a local marker when B views it." });
route("ai", "ai-output-handling", "ssrf", { "ai-output-2": "Attribute the callback to the real tool worker and caller/job ID; an assistant's statement that it fetched an address is not a receipt." });
route("ai", "ai-output-handling", "llmTenant", { "ai-output-3": "Use two owned read-only database canary rows. Inspect generated SQL and actual execution/row-policy traces separately; no user-supplied SQL grammar is assumed by this tenant-boundary recipe." });

/** Exact tuple lookup: unknown IDs, renamed categories and custom checks get no invented recipe. */
export function getCuratedItemMethod(item: ChecklistItem, category: ChecklistCategory, domainId: Domain): TestingMethod | undefined {
  if (item.isCustom || category.isCustom) return undefined;
  const match = playbookRecipeRoutes.find(r => r.domainId === domainId && r.categoryId === category.id && r.itemId === item.id);
  if (!match) return undefined;
  const recipe = recipes[match.recipeId];
  return {
    id: `${item.id}:recipe:${match.recipeId}`, title: recipe.title,
    scenario: `${item.text} — ${match.focus}`, verification: "reviewed",
    prerequisites: [...recipe.prerequisites], steps: [match.focus, ...recipe.steps],
    evidence: [...recipe.evidence], limitations: [...recipe.limitations, "Source-reviewed recipe; no target/device/lab execution is claimed. Adapt the recorded fixture and tool versions before use."],
    safety: [...recipe.safety], references: [recipe.reference], expectedResponse: { ...recipe.expectedResponse },
  };
}

/** Run against the real catalogue to expose stale route IDs instead of silently falling back. */
export function auditRecipeRoutes(domains: ChecklistDomain[]) {
  return playbookRecipeRoutes.map(route => {
    const domain = domains.find(d => d.id === route.domainId);
    const category = domain?.categories.find(c => c.id === route.categoryId);
    return { ...route, exists: !!category?.items.some(i => i.id === route.itemId) };
  });
}
