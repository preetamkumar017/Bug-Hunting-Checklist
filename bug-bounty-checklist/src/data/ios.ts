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
        severity: "medium",
      },
      {
        id: "ios-static-2",
        text: "Review Info.plist for insecure configuration",
        how: "Check for NSAllowsArbitraryLoads (disables App Transport Security) and other permissive entries.",
        severity: "medium",
      },
      {
        id: "ios-static-3",
        text: "Check for hardcoded API keys/secrets in the binary",
        how: "Grep the extracted binary and bundled resources for embedded credentials or internal URLs.",
        severity: "high",
      },
      {
        id: "ios-static-4",
        text: "Check URL scheme / Universal Link handlers for input validation",
        how: "Review registered custom URL schemes and Universal Links for how they process incoming parameters.",
        severity: "high",
      },
      {
        id: "ios-static-5",
        text: "Check for insecure WKWebView/UIWebView JavaScript bridge exposure",
        how: "Look for exposed native message handlers reachable from loaded web content, especially if remote URLs are loaded.",
        severity: "critical",
      },
      {
        id: "ios-static-6",
        text: "Check entitlements for over-privileged capabilities",
        how: "Review the app's entitlements file for capabilities (keychain sharing, associated domains) broader than needed.",
        severity: "low",
      },
      {
        id: "ios-static-7",
        text: "Check for third-party SDKs with known vulnerabilities",
        how: "Identify bundled frameworks/SDKs and versions, cross-referencing against known CVEs.",
        severity: "medium",
      },
      {
        id: "ios-static-8",
        text: "Check binary for missing PIE/stack protection compiler flags",
        how: "Use otool/class-dump-style tooling to confirm standard binary hardening flags are enabled in the release build.",
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
        severity: "medium",
      },
      {
        id: "ios-dynamic-2",
        text: "Test custom URL scheme handling with crafted input",
        how: "Trigger the app's custom scheme with malicious parameters to check for injection or unauthorized action triggering.",
        severity: "high",
      },
      {
        id: "ios-dynamic-3",
        text: "Monitor runtime for sensitive data in memory",
        how: "Use Frida to dump memory around auth/crypto operations and check if secrets persist longer than necessary.",
        severity: "medium",
      },
      {
        id: "ios-dynamic-4",
        text: "Test clipboard for sensitive data exposure",
        how: "Check if sensitive values (OTPs, tokens) are copied to the general pasteboard, readable by other apps.",
        severity: "low",
      },
      {
        id: "ios-dynamic-5",
        text: "Test Face ID / Touch ID authentication bypass",
        how: "Check if the biometric result is validated purely client-side, allowing bypass by hooking the success callback.",
        severity: "critical",
      },
      {
        id: "ios-dynamic-6",
        text: "Test background app screenshot exposure",
        how: "Background the app on a sensitive screen and check the app switcher snapshot for unmasked sensitive data.",
        severity: "low",
      },
      {
        id: "ios-dynamic-7",
        text: "Test API endpoints called by the app for standard web/API vulnerabilities",
        how: "Once traffic is intercepted, apply the same IDOR/injection/auth checks used for web/API domains to every backend call.",
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
        severity: "high",
      },
      {
        id: "ios-storage-2",
        text: "Check Keychain item accessibility attribute",
        how: "Verify sensitive Keychain items use a restrictive accessibility level (e.g. WhenUnlockedThisDeviceOnly) rather than an overly permissive one.",
        severity: "medium",
      },
      {
        id: "ios-storage-3",
        text: "Check for sensitive data in Core Data / SQLite databases",
        how: "Inspect local app databases for unencrypted sensitive fields.",
        severity: "high",
      },
      {
        id: "ios-storage-4",
        text: "Check for sensitive data included in iTunes/iCloud backups",
        how: "Confirm sensitive files are marked with the do-not-backup attribute where appropriate.",
        severity: "medium",
      },
      {
        id: "ios-storage-5",
        text: "Check WKWebView local storage/cache for cached sensitive content",
        how: "Inspect WebView-related cache and local storage database files for cached authenticated data.",
        severity: "medium",
      },
      {
        id: "ios-storage-6",
        text: "Check for sensitive data in app logs / crash reports",
        how: "Review local log files and crash report contents for leaked credentials or PII.",
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
        severity: "medium",
      },
      {
        id: "ios-network-2",
        text: "Test App Transport Security (ATS) exceptions",
        how: "Review whether ATS exceptions allow cleartext or weak-TLS connections to specific domains unnecessarily.",
        severity: "medium",
      },
      {
        id: "ios-network-3",
        text: "Test for cleartext HTTP traffic",
        how: "Monitor all network calls to confirm no sensitive data is transmitted over plain HTTP.",
        severity: "high",
      },
      {
        id: "ios-network-4",
        text: "Test for weak TLS validation (accepting invalid certs)",
        how: "Check if a custom URLSession delegate accepts any server certificate, effectively disabling validation.",
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
        severity: "high",
      },
      {
        id: "ios-crypto-2",
        text: "Check for use of deprecated/weak crypto algorithms",
        how: "Identify usage of MD5/SHA1/DES/ECB mode in local data protection instead of modern recommended primitives.",
        severity: "medium",
      },
      {
        id: "ios-crypto-3",
        text: "Check reliance on iOS Data Protection API vs custom crypto",
        how: "Confirm the app leverages the platform's file protection classes rather than reinventing weaker custom encryption.",
        severity: "low",
      },
      {
        id: "ios-crypto-4",
        text: "Test for predictable random values used in security-sensitive contexts",
        how: "Check if tokens/nonces are derived from a weak PRNG instead of SecRandomCopyBytes.",
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
        severity: "low",
      },
      {
        id: "ios-jailbreak-2",
        text: "Test anti-debugging (ptrace) bypass",
        how: "Check if the app calls ptrace(PT_DENY_ATTACH) and whether this can be patched/bypassed to allow a debugger to attach.",
        severity: "low",
      },
      {
        id: "ios-jailbreak-3",
        text: "Test binary integrity / code-signature verification bypass",
        how: "Re-sign a modified binary and check if the app detects the tampering at runtime.",
        severity: "medium",
      },
      {
        id: "ios-jailbreak-4",
        text: "Test Frida/hooking framework detection",
        how: "Check if the app detects and reacts to an attached Frida server or common instrumentation artifacts.",
        severity: "low",
      },
    ],
  },
];
