import type { LearnGroup } from "@/learn/data/types";

// Authentication & Sessions — advanced, P3/P4-focused study group.
//
// VRT facts (Bugcrowd release 2026-07-08), default CVSS vectors, and CWE ids
// are copied from the published taxonomy, not invented. Content targets the
// findable session/auth-flow bugs that triage at P3/P4 and the conditions that
// let them chain upward toward account takeover.

export const authenticationGroup: LearnGroup = {
  id: "authentication",
  name: "Authentication & Sessions",
  emoji: "🔐",
  blurb:
    "Full credential bypass is a rare P1; the day-to-day work is the layer below it — second factors that can be skipped, sessions that are set by the attacker or never die, and tokens exposed in transit. These land at P3/P4 individually, but each is a half-step in an account-takeover chain, so the craft is proving the gap precisely and knowing which other primitive completes it.",
  topics: [
    {
      id: "mfa-bypass",
      name: "2FA / MFA Bypass",
      emoji: "📲",
      intro:
        "The password check passed and the server issued a partially-authenticated state that should be gated until the second factor is verified. An MFA bypass is any path that reaches the fully-authenticated state without satisfying that gate. In 2025 the findable variants are rarely brute force — they are logic gaps: the verify step is enforced on the client but the session is already elevated server-side, the OTP endpoint lacks its own rate limit, a backup/remember-device flow skips the factor, or the response can be flipped. It is a solid P3 and escalates toward full ATO when it applies to every account rather than one misconfigured path.",
      howToFind: [
        {
          title: "Probe the partially-authenticated state",
          steps: [
            "Log in with correct credentials, stop at the OTP prompt, and replay a known post-login request (e.g. GET /api/me or a dashboard data call) using the cookie/token issued at that point.",
            "If it returns authenticated data, the server elevated the session before verifying the factor — the OTP screen is cosmetic and can be navigated past directly.",
            "Also force-browse straight to the post-2FA landing URL and watch whether the app redirects back to the challenge or serves the page.",
          ],
        },
        {
          title: "Attack the verify step itself",
          steps: [
            "Test the OTP endpoint for its own rate limit independent of the login limit — a 6-digit code with no throttle is brute-forceable in minutes; also try reusing a code, submitting an expired code, and code=000000 style defaults.",
            "Flip the verification response: change {\"verified\":false} to true, a 302-to-challenge into a 200, or null the status field in clients that trust it.",
            "Drop the factor: remove the otp / mfa_token parameter entirely, send it empty, or set the step/stage field to the completed value.",
          ],
        },
        {
          title: "Abuse alternate and recovery flows",
          steps: [
            "Enumerate every way in: remember-this-device tokens, backup codes, SMS-vs-TOTP fallback, OAuth/SSO side doors, and legacy mobile endpoints that may not enforce the factor.",
            "Check whether disabling 2FA, or a password reset, drops the requirement for the next login — resetting into an account can strip the factor.",
            "Response/stage confusion across a multi-request flow: complete the factor once, capture the tokens, and see if those tokens are reusable or transferable to another account context.",
          ],
        },
      ],
      payloads: [
        "GET /api/me   using the cookie issued BEFORE OTP submission   (pre-verify elevation)",
        "POST /2fa/verify {\"otp\":\"000000\"}   sprayed when the endpoint has no independent rate limit",
        "Login body: delete the \"mfa_token\" field entirely, or send \"mfa_token\":\"\"",
        "Response tamper: {\"twoFactorRequired\":true} -> {\"twoFactorRequired\":false}",
      ],
      example:
        "After the password step, the app set a full session cookie and only then rendered the OTP page client-side. Replaying GET /api/account/profile with that cookie — without ever entering a code — returned the victim's authenticated profile. The second factor added no server-side gate at all. Triaged P3 (AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N); because it affected the universal login path, the hunter argued the escalation toward unrestricted account access.",
      mapping: {
        bugcrowdVrt: "Broken Authentication and Session Management › Second Factor Authentication (2FA) Bypass",
        bugcrowdPriority: "P3",
        bugcrowdCvss: "AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N",
        hackeroneCwe: "CWE-287: Improper Authentication",
        cvssSeverity: "Medium",
        note:
          "VRT fixes this at P3. It reads higher in practice when the bypass is universal (every account), when it also strips the factor permanently, or when combined with known/leaked passwords to yield full ATO — then triage treats it as the enabling step of a Critical chain.",
      },
      checklistCategoryId: "auth-login",
      references: [
        { label: "PortSwigger: 2FA bypass", url: "https://portswigger.net/web-security/authentication/multi-factor" },
      ],
    },
    {
      id: "session-fixation",
      name: "Session Fixation (Remote Attack Vector)",
      emoji: "📌",
      intro:
        "The application accepts a session identifier the attacker chose and keeps using it across the authentication boundary instead of minting a fresh one at login. If the attacker can plant that identifier in the victim's browser and the victim then logs in, the attacker — who already knows the identifier — rides the now-authenticated session. The subtle condition is the one that separates P3 from noise: the session id must survive login unchanged. The remote vector means the attacker seeds the id without local access, typically via a URL parameter, a permissive cookie-setting endpoint, or a subdomain that can write a parent-domain cookie.",
      howToFind: [
        {
          title: "Confirm the id survives the auth boundary",
          steps: [
            "Grab an unauthenticated session id, note it exactly, log in within that same session, and compare: if the authenticated id equals the pre-login id, the app failed to rotate on privilege change — the core precondition.",
            "Check every session carrier (cookie, URL token, custom header) — some apps rotate the cookie but keep a secondary token stable.",
            "Verify the session is genuinely elevated afterward by making an authenticated request with the old id.",
          ],
        },
        {
          title: "Find a remote way to set the id",
          steps: [
            "Look for the id accepted from a URL parameter or path (?sessionid=, ;jsessionid=) that the server then honours as a cookie.",
            "Hunt a response that reflects an attacker-chosen value into Set-Cookie (header/CRLF injection, or an endpoint that echoes a supplied session value).",
            "Consider subdomain-scoped cookie writes: a takeover or XSS on any *.target.com host can set a Domain=.target.com session cookie the main app will read (the remote vector that makes this UI:R rather than local).",
          ],
        },
      ],
      payloads: [
        "https://target/login;jsessionid=ATTACKER-CHOSEN-ID   (victim clicks, then authenticates)",
        "Set-Cookie: SESSIONID=ATTACKER-CHOSEN-ID; Domain=.target.com; Path=/   (via subdomain or CRLF)",
        "GET /?sid=ATTACKER-CHOSEN-ID  ->  server adopts it as the session, no rotation on login",
      ],
      example:
        "Login did not regenerate the session cookie: the SESSIONID present before authentication was still valid and now privileged afterward. The app also accepted the id from a ;jsessionid path segment. The hunter sent the victim a login link carrying a known jsessionid, the victim authenticated, and the pre-seeded id became a logged-in session the attacker already held — full read access to the victim account. Triaged P3 (AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:L/A:N); the UI:R reflects that the victim must follow the seeded link.",
      mapping: {
        bugcrowdVrt: "Broken Authentication and Session Management › Session Fixation › Remote Attack Vector",
        bugcrowdPriority: "P3",
        bugcrowdCvss: "AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:L/A:N",
        hackeroneCwe: "CWE-384: Session Fixation",
        cvssSeverity: "Medium",
        note:
          "The C:H in the VRT vector reflects that a ridden session yields the victim's confidentiality in full; the UI:R (user interaction required) and the need to seed the id remotely are what keep it at P3 rather than higher. No session rotation on login is the make-or-break precondition — without it there is no bug.",
      },
      checklistCategoryId: "auth-session",
      references: [
        { label: "OWASP WSTG: Testing for Session Fixation", url: "https://owasp.org/www-project-web-security-testing-guide/" },
      ],
    },
    {
      id: "session-invalidation",
      name: "Failure to Invalidate Session",
      emoji: "♻️",
      intro:
        "A session token should die the instant the user's trust context changes — on logout, and on any password reset or change. This bug is when the server treats logout/reset as a client-side event (clears the cookie in the browser) while the token remains valid server-side, or when a reset rotates the password but not the active sessions. The high-value conditions are narrow and verifiable: logout that does not kill the token on both client and server, and password reset/change that leaves old sessions alive. Those two are P4; weaker variants (e.g. idle-timeout nitpicks) sit at P5.",
      howToFind: [
        {
          title: "Logout does not kill the token server-side",
          steps: [
            "Capture an authenticated request's token, log out through the UI, then replay that exact token against a protected endpoint.",
            "A 200 after logout proves the server only cleared the client cookie — the session is still live (P4, on logout client and server-side).",
            "Test across carriers: the web cookie may be revoked while a bearer/refresh token issued to the same session keeps working.",
          ],
        },
        {
          title: "Reset / change does not revoke other sessions",
          steps: [
            "Log in on two independent clients. From client A, complete a password reset or change; from client B, keep using the old session.",
            "If B still works, the credential rotation did not invalidate concurrent sessions (P4, on password reset and/or change) — the exact scenario that lets an attacker who stole a session survive the victim's remediation.",
            "Extend the check to email change, 2FA disable, and device removal — each should terminate other sessions.",
          ],
        },
      ],
      payloads: [
        "1) Authenticate, copy Cookie/Authorization.  2) Logout in UI.  3) Replay GET /api/me with the copied token -> expect 401, a 200 is the bug.",
        "Two-browser test: reset password in A, then GET /api/orders in B with B's pre-reset session still attached.",
        "Replay a captured refresh-token exchange after logout to see if a fresh access token is still minted.",
      ],
      example:
        "After the user clicked Log out, the SPA deleted the cookie locally but the backend never added the token to a revocation list. A token captured before logout kept returning authenticated data indefinitely. Separately, completing a password reset did not terminate the attacker's pre-existing session. Each was reported at P4 (CWE-613); together they meant a stolen session could not be revoked by the victim's own logout or password reset — the detail that elevated the combined report's impact narrative.",
      mapping: {
        bugcrowdVrt: "Broken Authentication and Session Management › Failure to Invalidate Session",
        bugcrowdPriority: "P4",
        hackeroneCwe: "CWE-613: Insufficient Session Expiration",
        cvssSeverity: "Low",
        note:
          "VRT prices the two meaningful variants at P4 — On Logout (Client and Server-Side) and On Password Reset and/or Change — while lesser variants (such as long-lived / idle sessions) fall to P5. The payout logic is persistence: these turn a transient session leak into durable access the victim cannot cut off, which strengthens any ATO chain they attach to.",
      },
      checklistCategoryId: "auth-session",
    },
    {
      id: "cleartext-session",
      name: "Weak Login over HTTP / Cleartext Session Token",
      emoji: "🔓",
      intro:
        "Credentials or the session token cross the network without transport encryption, so anyone on the path (shared Wi-Fi, a compromised hop, a mixed-content asset) can read them. The two findable leaves are a login function served over plain HTTP, and a valid session token transmitted in cleartext — including the quieter case where the login page is HTTPS but a cookie lacks the Secure flag and leaks over an incidental HTTP request to the same host. Both are P4 on their own; the condition that makes them real is a demonstrable cleartext path, not merely a theoretical one.",
      howToFind: [
        {
          title: "Find the cleartext login",
          steps: [
            "Request the login endpoint over http:// and confirm it serves the form and accepts the POST rather than redirecting to https:// (301/308 to HTTPS before any credential is sent is the correct behaviour).",
            "Check for mixed content on the login page — a form that posts to an http:// action, or a script/iframe loaded over HTTP on the auth path.",
            "Confirm there is no HSTS: a missing Strict-Transport-Security header means the first request can be downgraded.",
          ],
        },
        {
          title: "Catch the session token in the clear",
          steps: [
            "Inspect the session cookie flags: a missing Secure flag allows the browser to attach the token to any http:// request to the host.",
            "Trigger or observe an incidental plain-HTTP request to the same domain (an old asset, a redirect, a hardcoded http:// link) and confirm the session cookie or a bearer token rides along unencrypted.",
            "Look for tokens placed in URLs or non-TLS WebSocket (ws://) upgrades, which are logged and sniffable even when the main app is HTTPS.",
          ],
        },
      ],
      payloads: [
        "curl -i http://target/login   (serves the form / accepts creds instead of 301 -> https)",
        "Set-Cookie: SESSIONID=...; Path=/   (no Secure flag -> leaks over any http request to the host)",
        "Check: missing  Strict-Transport-Security  header on the auth origin (downgrade possible)",
        "ws://target/socket?token=<session-token>   (token over non-TLS WebSocket)",
      ],
      example:
        "The marketing site and app shared target.com, and the session cookie was issued without the Secure flag. A single hardcoded http:// link elsewhere on the domain caused the browser to send the authenticated cookie over plain HTTP, where it was trivially captured on a shared network. The login form itself was also reachable over http:// with no HSTS. Reported as two P4 findings (CWE-319): cleartext transmission of the session token, and a weak login function over HTTP.",
      mapping: {
        bugcrowdVrt: "Broken Authentication and Session Management › Weak Login Function › Over HTTP",
        bugcrowdPriority: "P4",
        hackeroneCwe: "CWE-319: Cleartext Transmission of Sensitive Information",
        cvssSeverity: "Low",
        note:
          "Two sibling VRT leaves both sit at P4 here — Weak Login Function › Over HTTP, and Cleartext Transmission of Session Token. Severity hinges on a real cleartext path (missing Secure flag, mixed content, no HSTS); a login page that immediately 301s to HTTPS before any secret is sent is not this bug. Impact rises if the captured token has no server-side expiry or cannot be revoked (see Failure to Invalidate Session).",
      },
      checklistCategoryId: "auth-session",
    },
  ],
};
