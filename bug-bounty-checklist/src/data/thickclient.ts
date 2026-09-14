import type { ChecklistCategory } from "../types/checklist";

// Ordered: Static Analysis -> Dynamic Analysis -> Binary Analysis -> Network
// -> Electron -> Java Thick Client -> Local Privilege Escalation

export const thickClientCategories: ChecklistCategory[] = [
  {
    id: "tc-static",
    reference: "https://owasp.org/www-project-web-security-testing-guide/stable/",
    name: "Static Analysis",
    emoji: "🖥️",
    items: [
      {
        id: "tc-static-1",
        text: "Decompile binary and review for hardcoded secrets",
        how: "Use appropriate decompiler for the platform (dnSpy for .NET, JD-GUI for Java) to inspect source for credentials/logic.",
        severity: "high",
      },
      {
        id: "tc-static-2",
        text: "Check application configuration files for sensitive data",
        how: "Review config/ini/xml files shipped with the installer for plaintext credentials or internal endpoints.",
        severity: "high",
      },
      {
        id: "tc-static-3",
        text: "Check for hardcoded encryption keys in the binary",
        how: "Search decompiled code/resources for static keys used in local data encryption.",
        severity: "high",
      },
      {
        id: "tc-static-4",
        text: "Check installer for insecure file/registry permissions",
        how: "Review what permissions the installer sets on application files, folders, and registry keys — overly permissive ACLs enable tampering.",
        severity: "medium",
      },
      {
        id: "tc-static-5",
        text: "Check for auto-update mechanism integrity verification",
        how: "Review whether update packages are signature-verified before being applied, preventing malicious update injection.",
        severity: "critical",
      },
      {
        id: "tc-static-6",
        text: "Check for DLL/library dependencies vulnerable to hijacking",
        how: "Identify DLLs loaded without a fully-qualified path, which can be hijacked by placing a malicious DLL earlier in the search order.",
        severity: "high",
      },
    ],
  },
  {
    id: "tc-dynamic",
    reference: "https://owasp.org/www-project-web-security-testing-guide/stable/",
    name: "Dynamic Analysis",
    emoji: "⚙️",
    items: [
      {
        id: "tc-dynamic-1",
        text: "Monitor process for sensitive data in memory",
        how: "Use a memory inspection tool (Process Hacker, x64dbg) to search running process memory for plaintext credentials/tokens.",
        severity: "medium",
      },
      {
        id: "tc-dynamic-2",
        text: "Monitor file system activity during app usage",
        how: "Use Process Monitor to observe files written/read during normal operation, checking for sensitive data written unencrypted.",
        severity: "medium",
      },
      {
        id: "tc-dynamic-3",
        text: "Monitor registry activity for sensitive data storage",
        how: "Check if credentials, tokens, or license keys are stored in the Windows registry in plaintext.",
        severity: "medium",
      },
      {
        id: "tc-dynamic-4",
        text: "Test license/feature-flag bypass via local tampering",
        how: "Check if licensing/feature checks are enforced only client-side and can be patched in memory or on disk.",
        severity: "medium",
      },
      {
        id: "tc-dynamic-5",
        text: "Test for DLL injection / process hollowing resistance",
        how: "Attempt to inject a DLL into the running process to see if the app has any anti-tampering detection.",
        severity: "low",
      },
      {
        id: "tc-dynamic-6",
        text: "Test debugger attach resistance",
        how: "Attach a debugger to the running process and check if the app detects and reacts (anti-debug checks).",
        severity: "low",
      },
    ],
  },
  {
    id: "tc-binary",
    reference: "https://owasp.org/www-project-web-security-testing-guide/stable/",
    name: "Binary Analysis",
    emoji: "🧬",
    items: [
      {
        id: "tc-binary-1",
        text: "Check for missing binary hardening flags",
        how: "Verify ASLR, DEP/NX, and stack canaries are enabled in the compiled binary.",
        severity: "medium",
      },
      {
        id: "tc-binary-2",
        text: "Test for buffer overflow in input-handling functions",
        how: "Fuzz local input fields/file parsers with oversized input to check for memory corruption in native code paths.",
        severity: "critical",
      },
      {
        id: "tc-binary-3",
        text: "Check for format string vulnerabilities",
        how: "Test functions that pass user input directly as a format string argument (printf-family) without a format specifier.",
        severity: "high",
      },
      {
        id: "tc-binary-4",
        text: "Test for insecure deserialization of local save/config files",
        how: "If the app deserializes custom save files, craft a malicious file to test for object injection/RCE.",
        severity: "critical",
      },
      {
        id: "tc-binary-5",
        text: "Check for obfuscation/packing of the binary",
        how: "Assess whether the binary is packed/obfuscated, affecting both reverse-engineering difficulty and potential AV false positives.",
        severity: "low",
      },
    ],
  },
  {
    id: "tc-network",
    reference: "https://owasp.org/www-project-web-security-testing-guide/stable/",
    name: "Network Communication",
    emoji: "📡",
    items: [
      {
        id: "tc-network-1",
        text: "Intercept and inspect thick client traffic",
        how: "Route the app through a proxy (Burp/Fiddler) and check whether traffic is encrypted and cert-pinned.",
        severity: "medium",
      },
      {
        id: "tc-network-2",
        text: "Test custom binary protocol for injection/parsing flaws",
        how: "If the app uses a proprietary TCP/binary protocol rather than HTTP, use a tool like Wireshark + a custom fuzzer to test message parsing.",
        severity: "high",
      },
      {
        id: "tc-network-3",
        text: "Test for cleartext credentials sent during authentication",
        how: "Capture the login handshake and confirm credentials aren't sent unencrypted even on an internal/VPN network.",
        severity: "high",
      },
      {
        id: "tc-network-4",
        text: "Test certificate validation for MITM resilience",
        how: "Use a self-signed/rogue certificate proxy and confirm the client actually rejects the untrusted connection.",
        severity: "critical",
      },
      {
        id: "tc-network-5",
        text: "Apply standard API tests to backend endpoints used by the client",
        how: "Once traffic is intercepted, apply the same IDOR/injection/auth checks used for the API domain to every backend call.",
        severity: "high",
      },
    ],
  },
  {
    id: "tc-electron",
    reference: "https://owasp.org/www-project-web-security-testing-guide/stable/4-Web_Application_Security_Testing/11-Client-side_Testing/README",
    name: "Electron Application Security",
    emoji: "⚛️",
    items: [
      {
        id: "tc-electron-1",
        text: "Check nodeIntegration and contextIsolation settings",
        how: "Inspect the app's main process config; nodeIntegration enabled with remote content loaded can lead to RCE via XSS.",
        severity: "critical",
      },
      {
        id: "tc-electron-2",
        text: "Check for remote module enabled unnecessarily",
        how: "Verify the deprecated 'remote' module isn't enabled, as it grants renderer processes broad main-process access.",
        severity: "high",
      },
      {
        id: "tc-electron-3",
        text: "Test preload script exposure for unsafe IPC surface",
        how: "Review the contextBridge-exposed API for functions that let renderer-side (potentially XSS'd) code trigger dangerous main-process actions.",
        severity: "high",
      },
      {
        id: "tc-electron-4",
        text: "Test for XSS-to-RCE via loaded remote content",
        how: "If any renderer loads remote/untrusted web content, chain a found XSS with insecure Electron settings to achieve native code execution.",
        severity: "critical",
      },
      {
        id: "tc-electron-5",
        text: "Check webSecurity and allowRunningInsecureContent settings",
        how: "Verify these aren't disabled, which would allow mixed content and same-origin-policy bypass within the app's webviews.",
        severity: "medium",
      },
      {
        id: "tc-electron-6",
        text: "Check for outdated Electron/Chromium version with known CVEs",
        how: "Identify the bundled Electron version and cross-reference against known Chromium/Electron RCE and sandbox-escape CVEs.",
        severity: "high",
      },
    ],
  },
  {
    id: "tc-java",
    reference: "https://owasp.org/www-project-web-security-testing-guide/stable/",
    name: "Java Thick Client Security",
    emoji: "☕",
    items: [
      {
        id: "tc-java-1",
        text: "Decompile JAR/class files for hardcoded secrets",
        how: "Use JD-GUI/CFR to decompile bundled JAR files and search for embedded credentials or internal config.",
        severity: "high",
      },
      {
        id: "tc-java-2",
        text: "Test Java deserialization on any local file/socket input",
        how: "Check for ObjectInputStream.readObject() calls on untrusted input (local files, sockets) and test known gadget chains.",
        severity: "critical",
      },
      {
        id: "tc-java-3",
        text: "Check for JMX/RMI interfaces exposed without authentication",
        how: "Scan for JMX/RMI registry ports left open, which can allow remote code execution if unauthenticated.",
        severity: "critical",
      },
      {
        id: "tc-java-4",
        text: "Check SecurityManager / sandboxing configuration",
        how: "For applets/Java Web Start apps, verify the security manager restricts filesystem/network access appropriately.",
        severity: "medium",
      },
    ],
  },
  {
    id: "tc-privesc",
    reference: "https://owasp.org/www-project-web-security-testing-guide/stable/",
    name: "Local Privilege Escalation",
    emoji: "⬆️",
    items: [
      {
        id: "tc-privesc-1",
        text: "Test for insecure service permissions (Windows services)",
        how: "Check if the app's Windows service binary path or config is writable by a low-privileged user, allowing hijack to SYSTEM.",
        severity: "critical",
      },
      {
        id: "tc-privesc-2",
        text: "Test for unquoted service path vulnerability",
        how: "Check if the service binary path contains spaces without quotes, allowing a planted executable earlier in the path to run instead.",
        severity: "high",
      },
      {
        id: "tc-privesc-3",
        text: "Test for weak file/folder permissions in install directory",
        how: "Check if a standard user can write to the app's install directory, enabling binary/DLL replacement.",
        severity: "high",
      },
      {
        id: "tc-privesc-4",
        text: "Test scheduled tasks/cron jobs created by the app",
        how: "Review any scheduled tasks the app installs for weak permissions or execution of user-writable scripts.",
        severity: "high",
      },
      {
        id: "tc-privesc-5",
        text: "Test named pipe / IPC endpoint access control",
        how: "Check if local IPC mechanisms (named pipes, local sockets) used by a privileged component accept commands from unprivileged local processes.",
        severity: "critical",
      },
    ],
  },
];
