import type { ChecklistCategory } from "../types/checklist";

// Ordered: Static Analysis -> Dynamic Analysis -> Data Storage -> Network -> Cryptography -> Jailbreak Detection

export const iosCategories: ChecklistCategory[] = [
  {
    id: "ios-static",
    reference: "https://mas.owasp.org/MASTG/0x06b-iOS-Security-Testing/",
    name: "Static Analysis",
    emoji: "🍏",
    items: [
      {
        id: "ios-static-1",
        text: "Extract and inspect IPA binary strings",
        how: "Unzip the IPA and run strings/class-dump on the binary to find hardcoded secrets and internal endpoints.",
        payloads: [
          "unzip -o app.ipa -d app_extracted",
          "strings -a Payload/App.app/App | grep -iE 'http|key|secret|token'",
          "class-dump -H Payload/App.app/App -o headers/",
        ],
        expectedResponse: {
          vulnerable: "strings/class-dump output reveals plaintext API keys, internal hostnames, or auth tokens embedded in the binary or symbol names.",
          safe: "No secrets or internal endpoints surface in the strings dump; only generic system/library strings and obfuscated or absent internal identifiers appear.",
        },
        severity: "medium",
      },
      {
        id: "ios-static-2",
        text: "Review Info.plist for insecure configuration",
        how: "Check for NSAllowsArbitraryLoads (disables App Transport Security) and other permissive entries.",
        payloads: [
          "plutil -convert xml1 -o - Payload/App.app/Info.plist",
          "<key>NSAppTransportSecurity</key>\n<dict>\n  <key>NSAllowsArbitraryLoads</key>\n  <true/>\n</dict>",
        ],
        expectedResponse: {
          vulnerable: "Info.plist contains NSAllowsArbitraryLoads set to true (or per-domain exceptions allowing insecure loads), permitting cleartext/unpinned connections.",
          safe: "ATS is left at its default strict configuration with no NSAllowsArbitraryLoads or insecure per-domain exceptions present.",
        },
        severity: "medium",
      },
      {
        id: "ios-static-3",
        text: "Check for hardcoded API keys/secrets in the binary",
        how: "Grep the extracted binary and bundled resources for embedded credentials or internal URLs.",
        payloads: [
          "grep -R -iE 'api[_-]?key|secret|Bearer [A-Za-z0-9._-]+' Payload/App.app/",
          "strings Payload/App.app/App | grep -E 'AIza[0-9A-Za-z_-]{35}|AKIA[0-9A-Z]{16}'",
        ],
        expectedResponse: {
          vulnerable: "Grep matches return live-looking credentials such as an AWS access key (AKIA...) or Google API key (AIza...) embedded directly in the binary or resources.",
          safe: "No credential-shaped strings match; any keys present are clearly placeholders/test values or fetched dynamically rather than hardcoded.",
        },
        severity: "high",
      },
      {
        id: "ios-static-4",
        text: "Check URL scheme / Universal Link handlers for input validation",
        how: "Review registered custom URL schemes and Universal Links for how they process incoming parameters.",
        payloads: [
          "/usr/libexec/PlistBuddy -c 'Print :CFBundleURLTypes' Info.plist",
          "xcrun simctl openurl booted 'myapp://login?redirect=https://evil.com'",
        ],
        expectedResponse: {
          vulnerable: "The app follows the attacker-supplied redirect parameter or performs a sensitive action (e.g. login state change) without validating the URL's origin or parameters.",
          safe: "The app validates the scheme/host/parameter values against an allowlist and ignores or rejects the untrusted redirect target.",
        },
        severity: "high",
      },
      {
        id: "ios-static-5",
        text: "Check for insecure WKWebView/UIWebView JavaScript bridge exposure",
        how: "Look for exposed native message handlers reachable from loaded web content, especially if remote URLs are loaded.",
        payloads: [
          "grep -R 'addScriptMessageHandler\\|WKScriptMessageHandler' Payload/App.app/",
          "window.webkit.messageHandlers.<handlerName>.postMessage({cmd:'exec', arg:'id'})",
        ],
        expectedResponse: {
          vulnerable: "The native handler executes the posted command (e.g. runs a native function, discloses data) even from content not loaded from a trusted first-party origin.",
          safe: "The handler validates the calling frame's origin and message schema, rejecting calls from untrusted or remotely loaded web content.",
        },
        severity: "critical",
      },
      {
        id: "ios-static-6",
        text: "Check entitlements for over-privileged capabilities",
        how: "Review the app's entitlements file for capabilities (keychain sharing, associated domains) broader than needed.",
        payloads: [
          "codesign -d --entitlements :- Payload/App.app/App",
          "ldid -e Payload/App.app/App",
        ],
        expectedResponse: {
          vulnerable: "Entitlements include broad capabilities (e.g. wide keychain-access-groups, unrestricted associated-domains, extra iCloud containers) not required by the app's actual features.",
          safe: "Entitlements are scoped tightly to only the capabilities the app functionally needs, with no unused or overly broad grants.",
        },
        severity: "low",
      },
      {
        id: "ios-static-7",
        text: "Check for third-party SDKs with known vulnerabilities",
        how: "Identify bundled frameworks/SDKs and versions, cross-referencing against known CVEs.",
        payloads: [
          "ls Payload/App.app/Frameworks/",
          "plutil -p Payload/App.app/Frameworks/*/Info.plist | grep CFBundleShortVersionString",
        ],
        expectedResponse: {
          vulnerable: "A bundled framework's version matches a publicly disclosed CVE (e.g. an outdated networking or crash-reporting SDK with known RCE/info-leak issues).",
          safe: "All bundled frameworks are on current versions with no matching entries in CVE databases for the identified version.",
        },
        severity: "medium",
      },
      {
        id: "ios-static-8",
        text: "Check binary for missing PIE/stack protection compiler flags",
        how: "Use otool/class-dump-style tooling to confirm standard binary hardening flags are enabled in the release build.",
        payloads: [
          "otool -hv Payload/App.app/App | grep PIE",
          "otool -Iv Payload/App.app/App | grep stack_chk",
        ],
        expectedResponse: {
          vulnerable: "otool output shows the PIE flag absent or no stack_chk (stack canary) symbols present, indicating the release build lacks standard exploit mitigations.",
          safe: "otool confirms PIE is enabled and ___stack_chk_guard/___stack_chk_fail symbols are present, showing standard hardening flags are on.",
        },
        severity: "low",
      },
    ],
  },
  {
    id: "ios-dynamic",
    reference: "https://mas.owasp.org/MASTG/0x06b-iOS-Security-Testing/",
    name: "Dynamic Analysis",
    emoji: "⚙️",
    items: [
      {
        id: "ios-dynamic-1",
        text: "Intercept traffic with Burp + SSL pinning bypass",
        how: "Use Frida/objection to bypass certificate pinning so Burp can intercept and modify app traffic.",
        payloads: [
          "objection --gadget com.target.app explore --startup-command 'ios sslpinning disable'",
          "frida -U -f com.target.app -l ios-ssl-bypass.js --no-pause",
        ],
        expectedResponse: {
          vulnerable: "Frida attaches without crashing and the pinning bypass succeeds, revealing plaintext decrypted API traffic in Burp's proxy history.",
          safe: "The app detects the injected script or hook and force-closes, or pinning holds and Burp shows only failed TLS handshakes with no decrypted traffic.",
        },
        severity: "medium",
      },
      {
        id: "ios-dynamic-2",
        text: "Test custom URL scheme handling with crafted input",
        how: "Trigger the app's custom scheme with malicious parameters to check for injection or unauthorized action triggering.",
        payloads: [
          "xcrun simctl openurl booted 'myapp://action?cmd=delete&id=1 OR 1=1'",
          "xcrun simctl openurl booted \"myapp://open?url=javascript:alert(1)\"",
        ],
        expectedResponse: {
          vulnerable: "The crafted parameter triggers unintended behavior, such as executing a destructive action, an injected SQL-like query taking effect, or a javascript: URL running in a WebView.",
          safe: "The app parses and validates scheme parameters strictly, rejecting malformed or unexpected values without executing them.",
        },
        severity: "high",
      },
      {
        id: "ios-dynamic-3",
        text: "Monitor runtime for sensitive data in memory",
        how: "Use Frida to dump memory around auth/crypto operations and check if secrets persist longer than necessary.",
        payloads: [
          "frida -U -f com.target.app -l memory-scan.js",
          "Process.enumerateRanges('r--').forEach(r => Memory.scan(r.base, r.size, '70 61 73 73 77 6f 72 64', {onMatch(a){console.log('hit', a)}}))",
        ],
        expectedResponse: {
          vulnerable: "The memory scan finds plaintext passwords/tokens/keys still resident well after the auth/crypto operation completes.",
          safe: "No plaintext secrets are found in scanned memory ranges; sensitive buffers appear zeroed or absent shortly after use.",
        },
        severity: "medium",
      },
      {
        id: "ios-dynamic-4",
        text: "Test clipboard for sensitive data exposure",
        how: "Check if sensitive values (OTPs, tokens) are copied to the general pasteboard, readable by other apps.",
        payloads: [
          "objection --gadget com.target.app explore --startup-command 'ios pasteboard monitor'",
          "[[UIPasteboard generalPasteboard] string]",
        ],
        expectedResponse: {
          vulnerable: "Querying UIPasteboard.generalPasteboard.string after an OTP/token action returns the sensitive plaintext value, readable by any other installed app.",
          safe: "The general pasteboard is empty or contains only non-sensitive text; sensitive values use a private/expiring pasteboard or are never copied automatically.",
        },
        severity: "low",
      },
      {
        id: "ios-dynamic-5",
        text: "Test Face ID / Touch ID authentication bypass",
        how: "Check if the biometric result is validated purely client-side, allowing bypass by hooking the success callback.",
        payloads: [
          "objection --gadget com.target.app explore --startup-command 'ios ui biometrics_bypass'",
          "Interceptor.attach(ObjC.classes.LAContext['- evaluatePolicy:localizedReason:reply:'].implementation, { onEnter(args){ /* force reply(true, nil) */ } })",
        ],
        expectedResponse: {
          vulnerable: "Hooking the reply callback to force success (true, nil) grants access to the protected screen/feature without a real biometric match.",
          safe: "The app re-validates the LAContext evaluation result server-side or via a keychain item bound to biometrics, so the forced client-side success is rejected.",
        },
        severity: "critical",
      },
      {
        id: "ios-dynamic-6",
        text: "Test background app screenshot exposure",
        how: "Background the app on a sensitive screen and check the app switcher snapshot for unmasked sensitive data.",
        payloads: [
          "xcrun simctl io booted screenshot after_background.png",
          "find ~/Library/Developer/CoreSimulator/Devices -iname 'Snapshot*.png'",
        ],
        expectedResponse: {
          vulnerable: "The background snapshot PNG shows unmasked sensitive content (balances, PII, auth screens) visible in the app switcher.",
          safe: "The snapshot shows a blank/branded splash overlay in place of the sensitive screen, indicating the app masks itself on backgrounding.",
        },
        severity: "low",
      },
      {
        id: "ios-dynamic-7",
        text: "Test API endpoints called by the app for standard web/API vulnerabilities",
        how: "Once traffic is intercepted, apply the same IDOR/injection/auth checks used for web/API domains to every backend call.",
        payloads: [
          "objection --gadget com.target.app explore --startup-command 'ios sslpinning disable'",
          "curl -k -X POST https://api.target.com/v1/user/1 -H 'Authorization: Bearer <token>' -d '{\"id\":2}'",
        ],
        expectedResponse: {
          vulnerable: "The backend returns another user's data (e.g. user 2's profile) despite the request being authenticated as user 1, confirming an IDOR/broken authorization on the API.",
          safe: "The API returns a 403/404 or the caller's own data only, ignoring the mismatched id parameter.",
        },
        severity: "high",
      },
    ],
  },
  {
    id: "ios-storage",
    reference: "https://mas.owasp.org/MASTG/0x06d-Testing-Data-Storage/",
    name: "Data Storage",
    emoji: "💾",
    items: [
      {
        id: "ios-storage-1",
        text: "Check Keychain and plist files for sensitive data",
        how: "On a jailbroken device/simulator, inspect Keychain entries and local plist/NSUserDefaults for plaintext credentials.",
        payloads: [
          "objection --gadget com.target.app explore --startup-command 'ios keychain dump'",
          "find /var/mobile/Containers/Data/Application/<GUID>/Library/Preferences -name '*.plist' -exec plutil -p {} \\;",
        ],
        expectedResponse: {
          vulnerable: "The Keychain dump or plist output contains plaintext passwords, session tokens, or PII stored without additional encryption.",
          safe: "Keychain entries and plist values are absent for sensitive data, or the values are encrypted/tokenized rather than plaintext.",
        },
        severity: "high",
      },
      {
        id: "ios-storage-2",
        text: "Check Keychain item accessibility attribute",
        how: "Verify sensitive Keychain items use a restrictive accessibility level (e.g. WhenUnlockedThisDeviceOnly) rather than an overly permissive one.",
        payloads: [
          "grep -R 'kSecAttrAccessible' Payload/App.app/",
          "kSecAttrAccessibleWhenUnlockedThisDeviceOnly  // expected, flag kSecAttrAccessibleAlways",
        ],
        expectedResponse: {
          vulnerable: "Sensitive Keychain items are stored with kSecAttrAccessibleAlways (or a *ThisDeviceOnly-less* variant that syncs to backups), letting them be read even when locked or restored to another device.",
          safe: "Sensitive items use kSecAttrAccessibleWhenUnlockedThisDeviceOnly (or similarly restrictive), so they're inaccessible when locked and excluded from device-to-device restores.",
        },
        severity: "medium",
      },
      {
        id: "ios-storage-3",
        text: "Check for sensitive data in Core Data / SQLite databases",
        how: "Inspect local app databases for unencrypted sensitive fields.",
        payloads: [
          "find /var/mobile/Containers/Data/Application/<GUID> -iname '*.sqlite*'",
          "sqlite3 app.sqlite '.tables' && sqlite3 app.sqlite 'SELECT * FROM ZUSER;'",
        ],
        expectedResponse: {
          vulnerable: "The SELECT query returns plaintext sensitive fields (passwords, tokens, financial or health data) directly from the unencrypted SQLite/Core Data file.",
          safe: "The database file is encrypted (e.g. SQLCipher) so the query fails or returns ciphertext, or the sensitive columns are absent/tokenized.",
        },
        severity: "high",
      },
      {
        id: "ios-storage-4",
        text: "Check for sensitive data included in iTunes/iCloud backups",
        how: "Confirm sensitive files are marked with the do-not-backup attribute where appropriate.",
        payloads: [
          "idevicebackup2 backup --full ./backup",
          "grep -R 'NSURLIsExcludedFromBackupKey' Payload/App.app/",
        ],
        expectedResponse: {
          vulnerable: "The restored iTunes/iCloud backup contains sensitive files in plaintext, and no NSURLIsExcludedFromBackupKey usage is found for those paths.",
          safe: "Sensitive files are absent from the backup or NSURLIsExcludedFromBackupKey is applied to them, confirming they're excluded from backups.",
        },
        severity: "medium",
      },
      {
        id: "ios-storage-5",
        text: "Check WKWebView local storage/cache for cached sensitive content",
        how: "Inspect WebView-related cache and local storage database files for cached authenticated data.",
        payloads: [
          "find /var/mobile/Containers/Data/Application/<GUID>/Library/WebKit -iname '*.db' -o -iname 'LocalStorage*'",
          "sqlite3 WebsiteData.db 'SELECT * FROM ItemTable;'",
        ],
        expectedResponse: {
          vulnerable: "WebKit's local storage/cache database retains authenticated page content, tokens, or personal data after logout in plaintext.",
          safe: "The WebView storage is cleared on logout or contains no sensitive authenticated content, only non-sensitive cached assets.",
        },
        severity: "medium",
      },
      {
        id: "ios-storage-6",
        text: "Check for sensitive data in app logs / crash reports",
        how: "Review local log files and crash report contents for leaked credentials or PII.",
        payloads: [
          "idevicesyslog | grep -iE 'password|token|authorization'",
          "find /var/mobile/Library/Logs/CrashReporter -iname 'App*.ips' -exec grep -iE 'token|password' {} \\;",
        ],
        expectedResponse: {
          vulnerable: "Syslog output or crash report files contain plaintext tokens, passwords, or PII logged during normal operation or a crash.",
          safe: "Logs and crash reports contain no sensitive values; sensitive fields are redacted or never logged at all.",
        },
        severity: "medium",
      },
    ],
  },
  {
    id: "ios-network",
    reference: "https://mas.owasp.org/MASTG/0x06g-Testing-Network-Communication/",
    name: "Network Communication",
    emoji: "📡",
    items: [
      {
        id: "ios-network-1",
        text: "Test SSL/TLS certificate pinning strength",
        how: "Confirm pinning can't be trivially bypassed and is applied consistently across all networking code paths in the app.",
        payloads: [
          "frida -U -f com.target.app -l ios-ssl-bypass.js --no-pause",
          "objection --gadget com.target.app explore --startup-command 'ios sslpinning disable'",
        ],
        expectedResponse: {
          vulnerable: "Pinning is bypassed on the first attempt via a generic script, and every networking code path (including background/WebView requests) proxies through Burp.",
          safe: "Pinning resists the generic bypass script across all networking code paths, or additional non-standard checks (e.g. custom TrustKit config) block interception even after the bypass.",
        },
        severity: "medium",
      },
      {
        id: "ios-network-2",
        text: "Test App Transport Security (ATS) exceptions",
        how: "Review whether ATS exceptions allow cleartext or weak-TLS connections to specific domains unnecessarily.",
        payloads: [
          "<key>NSExceptionDomains</key>\n<dict>\n  <key>internal.example.com</key>\n  <dict>\n    <key>NSExceptionAllowsInsecureHTTPLoads</key><true/>\n  </dict>\n</dict>",
          "/usr/libexec/PlistBuddy -c 'Print :NSAppTransportSecurity' Info.plist",
        ],
        expectedResponse: {
          vulnerable: "An ATS exception allows insecure HTTP loads or weak TLS to a domain that handles sensitive traffic, not just a narrowly scoped legacy/internal endpoint.",
          safe: "Any ATS exceptions present are scoped only to non-sensitive third-party domains that genuinely require them, with sensitive traffic still enforced over ATS-compliant TLS.",
        },
        severity: "medium",
      },
      {
        id: "ios-network-3",
        text: "Test for cleartext HTTP traffic",
        how: "Monitor all network calls to confirm no sensitive data is transmitted over plain HTTP.",
        payloads: [
          "mitmproxy --mode transparent -p 8080",
          "tcpdump -i any -A 'tcp port 80' | grep -iE 'password|token'",
        ],
        expectedResponse: {
          vulnerable: "tcpdump/mitmproxy captures plaintext HTTP requests containing credentials, tokens, or PII in the request/response body or headers.",
          safe: "All observed traffic on port 80 is redirected to HTTPS or carries no sensitive data; sensitive endpoints are never called over plain HTTP.",
        },
        severity: "high",
      },
      {
        id: "ios-network-4",
        text: "Test for weak TLS validation (accepting invalid certs)",
        how: "Check if a custom URLSession delegate accepts any server certificate, effectively disabling validation.",
        payloads: [
          "grep -R 'URLSession:didReceiveChallenge' Payload/App.app/",
          "openssl s_client -connect api.target.com:443 -cert selfsigned.pem  # see if app still accepts it",
        ],
        expectedResponse: {
          vulnerable: "The app completes requests successfully against a self-signed/MITM certificate, indicating the URLSession delegate accepts any server certificate.",
          safe: "The app rejects the connection and surfaces a TLS/certificate error, refusing to communicate with the untrusted certificate.",
        },
        severity: "critical",
      },
    ],
  },
  {
    id: "ios-crypto",
    reference: "https://mas.owasp.org/MASTG/0x06e-Testing-Cryptography/",
    name: "Cryptography",
    emoji: "🔐",
    items: [
      {
        id: "ios-crypto-1",
        text: "Check for hardcoded cryptographic keys in the binary",
        how: "Search the decompiled/disassembled binary for static keys used in local encryption routines.",
        payloads: [
          "strings Payload/App.app/App | grep -E '^[A-Fa-f0-9]{32,64}$'",
          "grep -R -iE 'kCCAlgorithmAES|CCCrypt' Payload/App.app/",
        ],
        expectedResponse: {
          vulnerable: "A fixed-looking hex string near CCCrypt/AES usage in the binary matches a static key used for local encryption/decryption, reusable by anyone who extracts the binary.",
          safe: "No static key material is found near crypto calls; keys are derived at runtime (e.g. from Secure Enclave, Keychain, or a KDF with per-device/per-user input).",
        },
        severity: "high",
      },
      {
        id: "ios-crypto-2",
        text: "Check for use of deprecated/weak crypto algorithms",
        how: "Identify usage of MD5/SHA1/DES/ECB mode in local data protection instead of modern recommended primitives.",
        payloads: [
          "grep -R -iE 'CC_MD5|CC_SHA1|kCCAlgorithmDES|kCCOptionECBMode' Payload/App.app/",
          "nm -a Payload/App.app/App | grep -iE 'md5|sha1|des'",
        ],
        expectedResponse: {
          vulnerable: "The binary imports/calls CC_MD5, CC_SHA1, DES, or ECB-mode AES for security-relevant hashing or encryption of sensitive data.",
          safe: "Only modern primitives (SHA-256+, AES-GCM/CBC-with-HMAC) are referenced for security-sensitive operations; MD5/SHA1/DES/ECB appear only in non-security contexts, if at all.",
        },
        severity: "medium",
      },
      {
        id: "ios-crypto-3",
        text: "Check reliance on iOS Data Protection API vs custom crypto",
        how: "Confirm the app leverages the platform's file protection classes rather than reinventing weaker custom encryption.",
        payloads: [
          "grep -R 'NSFileProtectionComplete\\|NSFileProtectionKey' Payload/App.app/",
          "class-dump -H Payload/App.app/App | grep -i 'FileProtection'",
        ],
        expectedResponse: {
          vulnerable: "No references to NSFileProtection* are found, or files are written with NSFileProtectionNone, indicating the app rolled its own file encryption instead of using the platform API.",
          safe: "Sensitive files are written with NSFileProtectionComplete (or CompleteUnlessOpen) confirmed via class-dump/grep, showing reliance on the platform's Data Protection API.",
        },
        severity: "low",
      },
      {
        id: "ios-crypto-4",
        text: "Test for predictable random values used in security-sensitive contexts",
        how: "Check if tokens/nonces are derived from a weak PRNG instead of SecRandomCopyBytes.",
        payloads: [
          "grep -R -iE 'arc4random|srand\\(|rand\\(\\)' Payload/App.app/",
          "grep -R 'SecRandomCopyBytes' Payload/App.app/  # confirm it's actually used",
        ],
        expectedResponse: {
          vulnerable: "The binary references arc4random/srand/rand for generating tokens, nonces, or session identifiers, with no SecRandomCopyBytes usage in that path, making values predictable.",
          safe: "Security-sensitive random values are generated exclusively via SecRandomCopyBytes (or an equivalent CSPRNG), with no weak PRNG usage in those code paths.",
        },
        severity: "high",
      },
    ],
  },
  {
    id: "ios-jailbreak",
    reference: "https://mas.owasp.org/MASTG/0x06j-Testing-Resiliency-Against-Reverse-Engineering/",
    name: "Jailbreak Detection & Anti-Tampering",
    emoji: "🛡️",
    items: [
      {
        id: "ios-jailbreak-1",
        text: "Test jailbreak detection bypass",
        how: "Use objection/frida to bypass jailbreak detection checks and confirm the app still functions with reduced protections.",
        payloads: [
          "objection --gadget com.target.app explore --startup-command 'ios jailbreak disable'",
          "frida -U -f com.target.app -l jb-bypass.js --no-pause",
        ],
        expectedResponse: {
          vulnerable: "A generic bypass script defeats all jailbreak checks and the app continues to function normally on a jailbroken device with reduced security guarantees.",
          safe: "The app performs layered/obfuscated jailbreak checks that survive the generic bypass, or it degrades functionality (e.g. blocks sensitive features) when jailbreak indicators remain.",
        },
        severity: "low",
      },
      {
        id: "ios-jailbreak-2",
        text: "Test anti-debugging (ptrace) bypass",
        how: "Check if the app calls ptrace(PT_DENY_ATTACH) and whether this can be patched/bypassed to allow a debugger to attach.",
        payloads: [
          "Interceptor.replace(Module.findExportByName(null, 'ptrace'), new NativeCallback(() => 0, 'int', ['int','int','int','int']))",
          "nm Payload/App.app/App | grep ptrace",
        ],
        expectedResponse: {
          vulnerable: "Hooking/neutralizing the ptrace call allows a debugger (e.g. lldb) to attach and set breakpoints without the app terminating or detecting tampering.",
          safe: "The app either doesn't rely solely on ptrace(PT_DENY_ATTACH) (using additional runtime checks) or detects the neutralized syscall and terminates/limits functionality.",
        },
        severity: "low",
      },
      {
        id: "ios-jailbreak-3",
        text: "Test binary integrity / code-signature verification bypass",
        how: "Re-sign a modified binary and check if the app detects the tampering at runtime.",
        payloads: [
          "codesign -f -s 'iPhone Developer' --entitlements ent.plist Payload/App.app",
          "ldid -S Payload/App.app/App",
        ],
        expectedResponse: {
          vulnerable: "The re-signed/modified binary launches and runs normally with no runtime integrity check flagging the altered code signature or binary hash.",
          safe: "The app detects the signature/hash mismatch at launch or during runtime and refuses to run or disables sensitive functionality.",
        },
        severity: "medium",
      },
      {
        id: "ios-jailbreak-4",
        text: "Test Frida/hooking framework detection",
        how: "Check if the app detects and reacts to an attached Frida server or common instrumentation artifacts.",
        payloads: [
          "frida -U -f com.target.app -l frida-detection-bypass.js --no-pause",
          "grep -R -iE 'frida|gum-js-loop|d-pipe' Payload/App.app/",
        ],
        expectedResponse: {
          vulnerable: "The app runs unaffected while Frida is attached, with no detection of the frida-server port, gum-js-loop threads, or named pipes it creates.",
          safe: "The app detects Frida artifacts (open port, thread names, D-Bus pipes) and reacts by terminating, disabling features, or alerting.",
        },
        severity: "low",
      },
    ],
  },
];
