import type { TopicContent } from "@/learn/data/types";

// Per-leaf trilingual lesson content, keyed by FULL Bugcrowd VRT path.
export const mobileDeviceTopics: Record<string, TopicContent> = {
  "Insecure Data Storage › Sensitive Application Data Stored Unencrypted › On External Storage": {
    what: {
      en: "The app writes sensitive data (tokens, PII, credentials, cached documents) to external/shared storage — getExternalFilesDir, /sdcard, Downloads, or a world-readable MediaStore entry. On Android this storage historically had no per-app sandbox, and any app with READ_EXTERNAL_STORAGE (or any user with the device) can read it. It ranks above the internal-storage sibling because the blast radius is other apps and physical pickup, not just a rooted/backed-up device.",
      simple: "The app saves secret data to the shared SD-card area instead of its private folder. Other apps or anyone holding the phone can read it.",
      hi: "App, sensitive data (token, PII, credentials) को external/shared storage — जैसे /sdcard या Downloads — में लिखती है, जहाँ कोई भी दूसरी app या फ़ोन पकड़ने वाला उसे पढ़ सकता है। इसीलिए यह internal-storage sibling से ज़्यादा serious है।",
    },
    find: [
      {
        title: { en: "Trigger activity, then dump shared storage", simple: "Use the app, then check the SD card", hi: "App चलाओ, फिर shared storage check करो" },
        steps: [
          { en: "Log in and exercise features (save, export, cache a document) on your own test account.", simple: "Log in and use features that save or export data.", hi: "अपने test account से login करके save/export वाले features चलाओ।" },
          { en: "Pull external storage: `adb shell run-as` won't reach it, so use `adb pull /sdcard/Android/data/<pkg>/` and `adb shell ls -lR /sdcard/` and inspect Downloads/DCIM.", simple: "Copy the /sdcard folders with adb and list everything.", hi: "adb से /sdcard और Android/data/<pkg> folders pull करके सब list करो।" },
          { en: "Grep dumped files for tokens, emails, PAN/Aadhaar, JWTs, and open SQLite/realm/plist caches that are plaintext.", simple: "Search the copied files for tokens and personal data in cleartext.", hi: "निकाले गए files में token, email, JWT और plaintext SQLite/cache ढूँढो।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs: the exact file path on external/shared storage, a screenshot/hexdump showing the sensitive value in cleartext, and the app action that wrote it. Note whether a second unprivileged app (no special permission on modern scoped storage) can read it — that is the strongest evidence. A value that is already public, or encrypted/obfuscated, is N/A.",
      simple: "Show the file path on shared storage, the cleartext secret inside, and that another app can read it. Public or encrypted data does not count.",
      hi: "Triage को चाहिए: external storage का exact path, cleartext secret का screenshot/hexdump, और कौन-सी app-action ने उसे लिखा। दिखाओ कि दूसरी unprivileged app भी उसे पढ़ सकती है। पहले से public या encrypted data N/A है।",
    },
    references: [
      { label: "OWASP MASTG — Data Storage (Android)", url: "https://mas.owasp.org/MASTG/0x05d-Testing-Data-Storage/" },
    ],
  },

  "Insecure Data Storage › Sensitive Application Data Stored Unencrypted › On Internal Storage": {
    what: {
      en: "Sensitive data sits in the app's private sandbox (/data/data/<pkg>/, NSFileProtectionNone containers) in cleartext. Unlike the external-storage sibling, the OS sandbox already blocks other apps, so recovery requires a rooted/jailbroken device, an ADB backup, a forensic image, or a chained local flaw. That limited reach is why Bugcrowd treats it as P5/informational on its own.",
      simple: "Secret data is stored unencrypted in the app's own private folder. Only a rooted phone or a backup can reach it, so on its own it is low value.",
      hi: "Sensitive data, app के private sandbox (/data/data/<pkg>/) में cleartext पड़ा है। External sibling के उलट, OS sandbox दूसरी apps को रोकता है, इसलिए reach के लिए rooted device या backup चाहिए — इसीलिए अकेले यह P5/informational है।",
    },
    find: [
      {
        title: { en: "Inspect the private data directory", simple: "Look inside the app's private folder", hi: "App के private folder के अंदर देखो" },
        steps: [
          { en: "On a rooted emulator/device, `adb shell run-as <pkg>` (debuggable) or root, then `find /data/data/<pkg> -type f`.", simple: "On a rooted device, open the app's /data/data folder and list files.", hi: "Rooted device पर `run-as <pkg>` या root से /data/data/<pkg> के files list करो।" },
          { en: "Open shared_prefs XML, SQLite DBs, and Keystore-adjacent files; confirm the secret is plaintext and not wrapped by the Android Keystore / iOS Keychain.", simple: "Open the prefs and databases and check the secret is in cleartext.", hi: "shared_prefs और SQLite खोलकर confirm करो कि secret plaintext है, Keystore/Keychain से wrapped नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Show the private path and the cleartext value. Because the sandbox protects it, state honestly that recovery needs root/backup/forensics; Bugcrowd usually rates this P5 unless you chain it with a device-local escalation or an allowBackup/export that lets an unprivileged party read it.",
      simple: "Show the private path and cleartext value, and admit it needs root/backup. It is usually P5 alone unless chained.",
      hi: "Private path और cleartext value दिखाओ। ईमानदारी से बताओ कि root/backup/forensics चाहिए; अकेले अक्सर P5, जब तक किसी chain से न जोड़ो।",
    },
    escalate: {
      en: "Raises the band if combined with 'Auto Backup Allowed by Default' (allowBackup=true lets adb backup extract it without root) or a lack of FLAG_SECURE/exported component that exposes the same store to another app.",
      simple: "Becomes more serious if backup is allowed or another app component can read the same store.",
      hi: "अगर 'Auto Backup Allowed' (allowBackup=true) या exported component के साथ chain हो तो band बढ़ जाती है।",
    },
  },

  "Insecure Data Storage › Non-Sensitive Application Data Stored Unencrypted": {
    what: {
      en: "Non-sensitive app data (UI state, feature flags, non-personal cache) is stored without encryption. Because the data itself carries no confidentiality or integrity value, there is no real security impact — this is a documentation/hardening observation, not a vulnerability.",
      simple: "Unimportant app data is stored unencrypted. Since the data is not secret, there is no real risk.",
      hi: "Non-sensitive data (UI state, cache) बिना encryption के stored है। Data secret नहीं है, इसलिए कोई real security impact नहीं — यह सिर्फ़ hardening note है।",
    },
    find: [
      {
        title: { en: "Confirm the data is genuinely non-sensitive", simple: "Check the data is not actually secret", hi: "Confirm करो data वाकई non-sensitive है" },
        steps: [
          { en: "Enumerate the app's storage (shared_prefs, SQLite, files) and classify each value.", simple: "List stored values and decide which are sensitive.", hi: "shared_prefs/SQLite/files list करके हर value को classify करो।" },
          { en: "Confirm none of it is a token, credential, PII, or anything that affects a security decision — if it is, it belongs under the sensitive siblings instead.", simple: "Make sure nothing is a token or personal data; if it is, use the sensitive leaf.", hi: "Confirm करो कोई token/credential/PII नहीं; अगर है तो sensitive leaf use करो।" },
        ],
      },
    ],
    proof: {
      en: "This leaf (CWE-312) is P5/informational and is generally not rewarded on its own. The only useful 'proof' is demonstrating the data truly has no security value; if any stored item is actually sensitive, report it under the correct sensitive-data leaf where it can earn a bounty.",
      simple: "This is P5 and usually not paid alone. If anything stored is really sensitive, report it under the sensitive leaf instead.",
      hi: "यह P5/informational है, अकेले अक्सर rewarded नहीं। अगर कोई item वाकई sensitive निकले तो उसे सही sensitive leaf के under report करो।",
    },
  },

  "Insecure Data Storage › Server-Side Credentials Storage › Plaintext": {
    what: {
      en: "On a device/server that the mobile or IoT product controls, service credentials (API keys, DB passwords, backend account creds the device uses to authenticate upstream) are stored in plaintext rather than hashed or wrapped in a secret store. Anyone who reaches that storage — a privileged local user, a recovered image, or a logic flaw — reads the live credential and can impersonate the device to the backend (CWE-256).",
      simple: "The device stores the password/API key it uses to talk to the backend in plaintext. Whoever reads that storage gets a working credential.",
      hi: "Device/server जो credentials (API key, DB password) upstream auth के लिए use करता है, वे plaintext में store हैं, hashed/wrapped नहीं। जो भी storage तक पहुँचे वह live credential चुराकर backend को impersonate कर सकता है (CWE-256)।",
    },
    find: [
      {
        title: { en: "Locate and read the stored credential", simple: "Find the stored password", hi: "Stored credential ढूँढो और पढ़ो" },
        steps: [
          { en: "Identify where the device persists upstream creds: config files, env, a SQLite/embedded DB, firmware partition, or a mobile shared_prefs/Keychain entry.", simple: "Find the config/DB/firmware file that holds the backend credential.", hi: "पता करो device upstream creds कहाँ रखता है: config, env, DB, firmware या shared_prefs/Keychain।" },
          { en: "Dump it (adb/run-as, binwalk-extracted rootfs, or file export) and confirm the credential is directly readable — not hashed, not inside Keystore/Keychain.", simple: "Extract the file and confirm the credential is readable, not hashed.", hi: "File dump करके (adb/run-as, या binwalk से extracted rootfs) confirm करो credential directly readable है, hashed नहीं।" },
          { en: "Prove it is live by authenticating to the backend with it from your own test context.", simple: "Show the credential actually works against the backend.", hi: "अपने test context से backend पर auth करके दिखाओ credential live है।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs: the storage location, the plaintext credential (redacted in the report), and evidence it is a real working server-side credential — ideally an authenticated request you made with it. The CVSS here assumes high local privilege to reach the store, so clarify who can read it. A hashed/encrypted or clearly non-functional credential is N/A.",
      simple: "Show where it is stored, that it is plaintext, and that it actually authenticates to the backend. Hashed or dead credentials do not count.",
      hi: "Triage को चाहिए: storage location, plaintext credential (report में redacted), और proof कि यह real working server-side credential है — ideally उससे एक authenticated request। Hashed/encrypted या dead credential N/A।",
    },
    references: [
      { label: "CWE-256: Plaintext Storage of a Password", url: "https://cwe.mitre.org/data/definitions/256.html" },
    ],
  },

  "Insecure Data Storage › Screen Caching Enabled": {
    what: {
      en: "When the app is backgrounded, the OS snapshots the current screen for the app-switcher thumbnail. If the app does not mask sensitive screens, that snapshot (written to disk) can expose balances, tokens, OTPs, or PII to anyone who later inspects the device. Android fix: FLAG_SECURE or overlay on onPause; iOS: hide the view or set a blank snapshot in applicationDidEnterBackground.",
      simple: "When you switch apps, the phone saves a picture of the screen. If a sensitive screen isn't hidden, that saved image can leak data to someone with the phone.",
      hi: "App background में जाने पर OS screen का snapshot (app-switcher thumbnail) disk पर save करता है। अगर sensitive screen mask नहीं हुई तो वह image balance/token/OTP leak कर सकती है। Fix: Android FLAG_SECURE, iOS onPause पर blank snapshot।",
    },
    find: [
      {
        title: { en: "Background a sensitive screen and recover the snapshot", simple: "Background the app and find the saved screen image", hi: "Sensitive screen को background करके snapshot recover करो" },
        steps: [
          { en: "Open a screen showing sensitive data, then press Home/recent-apps so the OS snapshots it.", simple: "Open a secret screen, then press Home.", hi: "Sensitive data वाली screen खोलो, फिर Home/recent-apps दबाओ।" },
          { en: "Check the app-switcher thumbnail shows the real content (not a masked/blank view).", simple: "See if the app-switcher preview still shows the real data.", hi: "App-switcher thumbnail में real content दिखता है या masked — check करो।" },
          { en: "On a rooted/jailbroken device, pull the cached snapshot (Android: /data/system_ce or app snapshot dir; iOS: Library/Caches/Snapshots) and confirm the sensitive data is saved to disk.", simple: "On a rooted device, pull the saved snapshot file and confirm the data is on disk.", hi: "Rooted/JB device पर snapshot (iOS: Library/Caches/Snapshots) pull करके confirm करो data disk पर है।" },
        ],
      },
    ],
    proof: {
      en: "Show the app-switcher preview (or the on-disk snapshot) containing real sensitive data. This is P5/informational and rarely rewarded alone, especially if only reproducible on a rooted/jailbroken device or if the exposed screen is not actually sensitive.",
      simple: "Show the preview or saved file containing real sensitive data. It is P5 and rarely paid alone.",
      hi: "App-switcher preview या on-disk snapshot में real sensitive data दिखाओ। यह P5/informational है, अकेले शायद ही rewarded — खासकर अगर सिर्फ़ rooted device पर हो या screen sensitive ही न हो।",
    },
  },

  "Insecure Data Transport › Cleartext Transmission of Sensitive Data": {
    what: {
      en: "The app or device sends sensitive data over an unencrypted or downgradeable channel — plain HTTP, a non-TLS socket, cleartext MQTT/CoAP, or TLS the client will silently fall back from. Any on-path attacker (rogue Wi-Fi, ARP spoof, malicious hotspot) reads or tampers with the traffic (CWE-319). Band varies with what leaks: credentials/session tokens score high, low-value telemetry much lower.",
      simple: "Sensitive data travels without proper encryption, so anyone on the same network can read or change it. How serious it is depends on what leaks.",
      hi: "App/device, sensitive data को unencrypted या downgradeable channel पर भेजता है — plain HTTP, non-TLS socket, cleartext MQTT/CoAP। कोई भी on-path attacker (rogue Wi-Fi, ARP spoof) traffic पढ़/बदल सकता है (CWE-319)। Band इस पर depend करता है कि क्या leak होता है।",
    },
    find: [
      {
        title: { en: "Intercept traffic and look for cleartext", simple: "Capture the traffic and look for unencrypted data", hi: "Traffic intercept करके cleartext ढूँढो" },
        steps: [
          { en: "Route the device through Burp/mitmproxy without installing a CA; anything that still works is already cleartext or ignoring TLS.", simple: "Proxy the app without a trusted CA and see what still goes through.", hi: "Device को Burp/mitmproxy से बिना CA install किए route करो; जो फिर भी चले वह cleartext है।" },
          { en: "For non-HTTP, capture with Wireshark/tcpdump on the device's network and inspect TCP/UDP payloads for tokens, creds, PII.", simple: "Use Wireshark for non-web traffic and check the packets for secrets.", hi: "Non-HTTP के लिए Wireshark/tcpdump से capture करके payload में token/creds/PII देखो।" },
          { en: "Confirm the sensitive value appears unencrypted in the capture, and note whether TLS is absent or merely downgradeable.", simple: "Confirm the secret is visible in the packet capture.", hi: "Confirm करो sensitive value capture में unencrypted दिखती है, और TLS absent है या downgradeable।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs a packet capture showing the specific sensitive value in cleartext and the endpoint/protocol. State the exact data that leaks — that drives the band. Transmitting only non-sensitive data, or a capture only possible because you installed your own CA (that is TLS working, not cleartext), is N/A.",
      simple: "Show a packet capture with the real secret in cleartext and name the data. Non-sensitive data, or data only seen because you added your own CA, does not count.",
      hi: "Triage को चाहिए: packet capture जिसमें specific sensitive value cleartext में हो, और endpoint/protocol। Exact leaking data बताओ — इसी से band तय होती है। सिर्फ़ non-sensitive data, या capture जो आपके अपने CA की वजह से हुआ (वह TLS काम कर रहा है), N/A।",
    },
    references: [
      { label: "CWE-319: Cleartext Transmission of Sensitive Information", url: "https://cwe.mitre.org/data/definitions/319.html" },
    ],
  },

  "Insecure Data Transport › Executable Download › No Secure Integrity Check": {
    what: {
      en: "The app/device downloads an executable or update payload (APK, binary, script, firmware blob) and runs it without verifying authenticity — no code signature, no pinned-key signature check, or only a non-cryptographic integrity check an attacker can forge (CWE-353/354/494). An on-path or malicious-mirror attacker swaps the payload and achieves code execution. This scores above the 'Secure Integrity Check' sibling because tampering actually succeeds.",
      simple: "The app downloads and runs a program or update without properly checking it is genuine. An attacker in the middle can swap it for malware.",
      hi: "App/device एक executable या update (APK, binary, firmware) download करके बिना authenticity verify किए चलाता है — कोई code signature नहीं, या सिर्फ़ forgeable non-crypto check (CWE-353/354/494)। On-path attacker payload swap करके code execution पा लेता है। इसीलिए 'Secure Integrity Check' sibling से ऊपर।",
    },
    find: [
      {
        title: { en: "Man-in-the-middle the download and swap the payload", simple: "Intercept the download and replace the file", hi: "Download को MITM करके payload swap करो" },
        steps: [
          { en: "Capture the update/executable download URL via proxy or tcpdump on your own test device.", simple: "Find the URL the app downloads the executable from.", hi: "अपने test device पर proxy/tcpdump से executable का download URL capture करो।" },
          { en: "Intercept the response and substitute a benign modified payload (e.g. same binary with a harmless marker byte or logging line).", simple: "Replace the download with a harmless modified version.", hi: "Response intercept करके एक benign modified payload (harmless marker के साथ) substitute करो।" },
          { en: "Confirm the app installs/executes the tampered payload without rejecting it on signature/hash grounds.", simple: "Check the app runs your modified file instead of refusing it.", hi: "Confirm करो app tampered payload को signature/hash पर reject किए बिना install/execute करता है।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs evidence the modified payload was accepted and executed — a benign marker running, a log line, or the altered binary loaded. Keep the payload harmless (no real malware). If the app rejects the tampered file, or the only 'bypass' is replacing it with the legitimate signed one, it is N/A.",
      simple: "Show your harmless modified download actually ran. If the app rejects tampering, it is N/A.",
      hi: "Triage को चाहिए proof कि modified payload accept और execute हुआ — benign marker/log line। Payload harmless रखो। अगर app tampered file reject कर दे तो N/A।",
    },
    escalate: {
      en: "On an IoT/firmware target this overlaps with 'Firmware does not validate update integrity' and can reach full persistent device compromise; combined with cleartext transport the MITM is trivial, pushing the band higher.",
      simple: "On IoT firmware it can mean full device takeover, especially if the download is also cleartext.",
      hi: "IoT/firmware target पर यह 'Firmware does not validate update integrity' से overlap करके persistent device compromise तक जा सकता है; cleartext transport के साथ MITM trivial हो जाता है।",
    },
    references: [
      { label: "CWE-494: Download of Code Without Integrity Check", url: "https://cwe.mitre.org/data/definitions/494.html" },
    ],
  },

  "Insecure Data Transport › Executable Download › Secure Integrity Check": {
    what: {
      en: "The app downloads an executable/update but does cryptographically verify it — a valid code signature or a signature/hash checked against a pinned key — so tampering is detected and rejected. This sibling exists to record that the integrity control is present and working; by itself there is no exploitable weakness.",
      simple: "The app downloads a program but properly checks it is genuine and rejects tampered files. This is the secure state, not a bug.",
      hi: "App executable/update download करके उसे cryptographically verify करता है (valid signature/pinned key), इसलिए tampering detect होकर reject हो जाती है। यह sibling यह record करता है कि control मौजूद और काम कर रहा है — अकेले कोई exploitable weakness नहीं।",
    },
    find: [
      {
        title: { en: "Verify the integrity check cannot be bypassed", simple: "Confirm the signature check really works", hi: "Confirm करो integrity check bypass नहीं होता" },
        steps: [
          { en: "MITM the download and feed a tampered payload; confirm the app rejects it.", simple: "Try swapping the download and check it is refused.", hi: "Download MITM करके tampered payload दो; confirm app reject करता है।" },
          { en: "Check the verification is cryptographic and key-pinned — not a plain hash the server also supplies (which an on-path attacker could recompute).", simple: "Make sure the check uses a signature/pinned key, not just a hash the attacker controls.", hi: "Confirm verification cryptographic और key-pinned है — सिर्फ़ server-supplied hash नहीं जो attacker recompute कर सके।" },
        ],
      },
    ],
    proof: {
      en: "This is P5/informational and not rewarded — it is the correctly-secured state. Only report if you can actually defeat the check (forge a signature, downgrade to an unsigned path, exploit a hash the attacker controls), in which case it belongs under the 'No Secure Integrity Check' sibling.",
      simple: "This secure state is P5 and not paid. If you can actually beat the check, report it under the 'No Secure Integrity Check' leaf instead.",
      hi: "यह P5/informational है और rewarded नहीं — यह secured state है। Report तभी जब आप check को actually defeat कर सको (signature forge, unsigned path downgrade), तब 'No Secure Integrity Check' sibling use करो।",
    },
  },

  "Insecure OS/Firmware › Command Injection": {
    what: {
      en: "A device service (web UI, API, CLI, or RPC on the embedded OS) passes attacker-influenced input into a shell command or system() call without sanitisation (CWE-77). On routers, cameras and IoT gear this is usually in diagnostic endpoints (ping, traceroute, firmware tools) built in BusyBox/ash. It is P1 because it yields command execution on the device, often as root.",
      simple: "A device feature runs your input as a system command, so you can run your own commands on the device — usually as root.",
      hi: "Device का कोई service (web UI, API, CLI) attacker input को बिना sanitisation के shell command/system() में डाल देता है (CWE-77)। Router/camera/IoT में अक्सर diagnostic endpoints (ping, traceroute) में। P1 क्योंकि device पर command execution मिलता है, अक्सर root।",
    },
    find: [
      {
        title: { en: "Map device inputs and inject shell metacharacters", simple: "Find inputs and try shell injection", hi: "Device inputs ढूँढो और shell metacharacters inject करो" },
        steps: [
          { en: "Extract the firmware (binwalk -e) and grep the web/CGI/service binaries for system/popen/exec/`eval` and the parameters that reach them.", simple: "Unpack the firmware and search for system/exec calls and their inputs.", hi: "Firmware extract (binwalk -e) करके web/CGI binaries में system/popen/exec और उनके parameters grep करो।" },
          { en: "Against your own test device, inject `;`, `|`, `$(...)`, backticks, and `&&` into diagnostic fields with an OOB/canary (e.g. `; ping -c1 <your-collaborator>`).", simple: "Put shell characters and an out-of-band ping into device fields.", hi: "अपने test device पर diagnostic fields में `;`, `|`, `$(...)`, backticks और OOB canary (जैसे `; ping -c1 <collaborator>`) inject करो।" },
          { en: "Confirm execution via the OOB callback or reflected output (`id`, `uname -a`), noting the running uid.", simple: "Confirm your command ran via the callback or output, and note the user.", hi: "OOB callback या reflected output (`id`, `uname -a`) से execution confirm करो, uid note करो।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the exact endpoint/parameter, the injection string, and proof of execution (OOB DNS/HTTP callback or command output) — ideally `id` showing the uid. Keep it benign: no destructive commands, no DoS. A reflected value that is not actually executed, or output that is just echoed input, is N/A.",
      simple: "Show the vulnerable parameter, your payload, and proof a command ran (callback or id output). Benign only.",
      hi: "Triage को चाहिए: exact endpoint/parameter, injection string, और execution proof (OOB callback या command output, ideally `id`)। Benign रखो, destructive/DoS नहीं। सिर्फ़ reflected input N/A।",
    },
    references: [
      { label: "CWE-77: Command Injection", url: "https://cwe.mitre.org/data/definitions/77.html" },
      { label: "HackTricks — Firmware Analysis", url: "https://book.hacktricks.xyz/hardware-physical-access/firmware-analysis" },
    ],
  },

  "Insecure OS/Firmware › Hardcoded Password › Privileged User": {
    what: {
      en: "The firmware ships a baked-in credential for a privileged/root account (a hidden admin, support, or root login in /etc/passwd, /etc/shadow, a config, or a hardcoded string in a service binary). The same secret is identical across every unit, so anyone who extracts one device's firmware can log into all of them as a privileged user — hence P1.",
      simple: "The firmware has a built-in password for an admin/root account that is the same on every device. Extract it once and you can log into any unit as admin.",
      hi: "Firmware में एक privileged/root account का baked-in credential होता है (hidden admin/support/root in /etc/shadow या service binary)। यह secret हर unit पर same होता है, इसलिए एक device का firmware extract करके सभी पर privileged login — इसीलिए P1।",
    },
    find: [
      {
        title: { en: "Extract firmware and recover the privileged credential", simple: "Unpack firmware and find the admin password", hi: "Firmware extract करके privileged credential निकालो" },
        steps: [
          { en: "Get the firmware image (vendor download or chip dump) and `binwalk -e` to extract the root filesystem.", simple: "Get and unpack the firmware to its filesystem.", hi: "Firmware image लेकर `binwalk -e` से root filesystem extract करो।" },
          { en: "Inspect /etc/passwd + /etc/shadow for root/admin hashes and crack with john/hashcat; grep service binaries and configs for literal passwords and default admin logins.", simple: "Check /etc/shadow and binaries for the admin password or crackable hash.", hi: "/etc/passwd + /etc/shadow के root/admin hashes john/hashcat से crack करो; binaries/configs में literal passwords grep करो।" },
          { en: "Log into the privileged account (SSH/Telnet/web admin) on your own device to confirm it grants admin/root.", simple: "Log in with it to confirm it gives admin access.", hi: "अपने device पर privileged account (SSH/Telnet/web) से login करके admin/root confirm करो।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the credential's location in firmware, the cleartext or cracked password, and a login showing privileged/root access on a clean device. The privilege level is what separates this from the non-privileged sibling. A per-device-unique or user-changed password, or a non-functional string, is N/A.",
      simple: "Show where the admin password lives in firmware and a successful admin login on a fresh device. Unique or changeable passwords do not count.",
      hi: "Triage को चाहिए: firmware में credential का location, cleartext/cracked password, और clean device पर privileged/root login। Privilege level ही इसको non-privileged sibling से अलग करता है। Per-device unique या user-changed password N/A।",
    },
    escalate: {
      en: "Chains directly with 'Command Injection' or exposed Telnet/SSH for remote root; if the same credential is reachable over the network pre-auth, impact is maximal.",
      simple: "Combined with exposed Telnet/SSH or command injection it becomes remote root.",
      hi: "'Command Injection' या exposed Telnet/SSH के साथ chain होकर remote root; अगर network से pre-auth reachable हो तो impact maximum।",
    },
  },

  "Insecure OS/Firmware › Hardcoded Password › Non-Privileged User": {
    what: {
      en: "Firmware contains a baked-in credential, but for a low-privilege account (a limited user, a single service, a read-only console). It is still shared across all units, but because the account cannot administer the device, impact is confined to that account's limited capabilities — hence P2 rather than P1.",
      simple: "The firmware has a built-in password, but only for a limited, non-admin account. Shared across devices, but it can't do much.",
      hi: "Firmware में baked-in credential होता है, पर low-privilege account के लिए (limited user/service/read-only console)। सभी units पर shared, पर account admin नहीं कर सकता इसलिए impact limited — P2, P1 नहीं।",
    },
    find: [
      {
        title: { en: "Recover the credential and confirm it is low-privilege", simple: "Find the password and check it is limited", hi: "Credential निकालो और low-privilege confirm करो" },
        steps: [
          { en: "Extract firmware (binwalk -e) and recover the credential from passwd/shadow, configs, or service binaries as above.", simple: "Unpack firmware and find the built-in password.", hi: "Firmware extract करके passwd/shadow/configs/binaries से credential निकालो।" },
          { en: "Authenticate and enumerate what the account can actually do; confirm it lacks admin/root and cannot escalate on its own.", simple: "Log in and confirm the account has limited, non-admin rights.", hi: "Login करके enumerate करो account क्या कर सकता है; confirm करो admin/root नहीं और खुद escalate नहीं करता।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the credential's firmware location, the cleartext/cracked value, and a login demonstrating the restricted privilege level. Be explicit that it is non-privileged — if it can administer the device or trivially escalate, it is the P1 sibling. A unique or user-set password is N/A.",
      simple: "Show the firmware password, a login, and that it only grants limited access. If it can admin the device, use the P1 leaf.",
      hi: "Triage को चाहिए: firmware location, cleartext/cracked value, और restricted privilege वाला login। साफ़ बताओ कि non-privileged है — अगर admin/escalate कर सके तो P1 sibling। Unique/user-set password N/A।",
    },
    escalate: {
      en: "Rises to the privileged band if the low-priv account can reach a local escalation (sudo misconfig, setuid binary, writable service) — then report under the appropriate higher leaf.",
      simple: "Becomes higher severity if the limited account can escalate to admin locally.",
      hi: "अगर low-priv account local escalation (sudo misconfig, setuid, writable service) तक पहुँचे तो privileged band — तब higher leaf use करो।",
    },
  },

  "Insecure OS/Firmware › Local Administrator on default environment": {
    what: {
      en: "The device's default/shipped configuration grants local administrator (root/admin) to the standard user environment — e.g. the default login is an admin, sudo is passwordless, or the interactive shell runs as root (CWE-276, incorrect default permissions). Any local actor, including a kiosk/physical user, operates with full control without needing an exploit. Scope change (S:C) pushes this to P2.",
      simple: "Out of the box, the normal user on the device is already an administrator. Anyone using it locally has full control with no exploit needed.",
      hi: "Device का default config standard user environment को local administrator (root/admin) दे देता है — default login admin है, passwordless sudo, या shell root के रूप में चलती है (CWE-276)। कोई भी local actor बिना exploit के full control पा लेता है। Scope change की वजह से P2।",
    },
    find: [
      {
        title: { en: "Check the default environment's privilege level", simple: "Check if the default user is already admin", hi: "Default environment का privilege level check करो" },
        steps: [
          { en: "Boot a device at factory defaults and open the standard user shell/session.", simple: "Start a factory-default device and open the normal session.", hi: "Factory-default device boot करके standard user shell/session खोलो।" },
          { en: "Run `id`, check sudo (`sudo -n id`), and whether the UI/console processes run as root; confirm admin without any privilege step.", simple: "Run id and sudo checks to see if you already have admin.", hi: "`id`, `sudo -n id` चलाओ, देखो UI/console root पर चलता है — बिना किसी step के admin confirm करो।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs evidence that the default, unmodified environment already runs with or trivially grants admin/root (e.g. `id` showing uid=0, passwordless sudo). Clarify this is the shipped default, not a state you configured. If the user must first authenticate as admin or change settings, it is N/A.",
      simple: "Show the factory-default user is already admin (id=0 or free sudo). If you had to set it up, it does not count.",
      hi: "Triage को चाहिए: default unmodified environment पहले से admin/root देता है (uid=0, passwordless sudo)। बताओ यह shipped default है, आपका configure किया नहीं। अगर पहले admin auth या settings change करनी पड़े तो N/A।",
    },
    references: [
      { label: "CWE-276: Incorrect Default Permissions", url: "https://cwe.mitre.org/data/definitions/276.html" },
    ],
  },

  "Insecure OS/Firmware › Over-Permissioned Credentials on Storage": {
    what: {
      en: "A credential file on the device (private key, token, password file, certificate) is stored with permissions far wider than needed — world-readable keys, 0666 secret files, group-readable shadow — so a lower-privilege local account can read a secret it should never see (CWE-250, execution with unnecessary privileges / over-broad perms). Impact is local information disclosure with limited C/I/A, hence P2.",
      simple: "A secret file on the device is readable by accounts that shouldn't see it, because its permissions are too open.",
      hi: "Device पर कोई credential file (private key, token, password file) ज़रूरत से ज़्यादा broad permissions के साथ store है — world-readable key, 0666 secret — इसलिए lower-privilege local account secret पढ़ लेता है जो उसे नहीं देखना चाहिए (CWE-250)। Local info disclosure, limited impact — P2।",
    },
    find: [
      {
        title: { en: "Audit permissions on credential files", simple: "Check file permissions on secrets", hi: "Credential files की permissions audit करो" },
        steps: [
          { en: "On the extracted rootfs or live device, `find / -name '*.key' -o -name '*.pem' -o -name 'shadow' -o -name '*.conf'` and `ls -l` the sensitive ones.", simple: "List secret files and their permissions.", hi: "Rootfs/device पर key/pem/shadow/conf files ढूँढो और `ls -l` से permissions देखो।" },
          { en: "Identify files readable/writable by a lower-privilege account (o+r, g+r where the group is broad).", simple: "Find secrets readable by a low-privilege account.", hi: "पता करो कौन-से secrets lower-privilege account को readable/writable हैं (o+r, broad g+r)।" },
          { en: "From that lower-privilege context, actually read the secret to confirm the exposure.", simple: "Read the secret as the low-privilege user to prove it.", hi: "उस lower-privilege context से secret actually पढ़कर exposure confirm करो।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the file path, its permission bits, which lower-privilege principal can read/write it, and the sensitive contents (redacted). The key point is that a principal who shouldn't have access does. A file only readable by root/owner (correct perms), or one with no sensitive content, is N/A.",
      simple: "Show the file, its loose permissions, and that a lower-privilege account can read the secret. Correctly-locked files do not count.",
      hi: "Triage को चाहिए: file path, permission bits, कौन-सा lower-privilege principal read/write कर सकता है, और sensitive contents (redacted)। Point यह कि गलत principal को access मिल रहा है। सही perms वाली file N/A।",
    },
    references: [
      { label: "CWE-250: Execution with Unnecessary Privileges", url: "https://cwe.mitre.org/data/definitions/250.html" },
    ],
  },

  "Insecure OS/Firmware › Shared Credentials on Storage": {
    what: {
      en: "A credential stored on the device is shared across the whole fleet — the same key/password/certificate is embedded in every unit's storage (CWE-798, hardcoded credentials). Recovering it from one device compromises the shared trust for all of them (e.g. a shared API key, a common signing/TLS key, a fleet-wide service account). Local access with fleet-wide reach puts it at P3.",
      simple: "A secret stored on the device is the same on every device. Pull it from one unit and it works everywhere.",
      hi: "Device पर stored एक credential पूरे fleet में shared होता है — same key/password/cert हर unit में (CWE-798)। एक device से निकालकर सबका shared trust compromise हो जाता है (shared API key, common signing/TLS key)। Local access पर fleet-wide reach — P3।",
    },
    find: [
      {
        title: { en: "Recover the stored credential and prove it is shared", simple: "Find the secret and show it is the same on all devices", hi: "Stored credential निकालो और shared होना prove करो" },
        steps: [
          { en: "Extract the credential from device storage/firmware (binwalk, filesystem dump).", simple: "Pull the stored secret from the device/firmware.", hi: "Device storage/firmware से credential extract करो (binwalk, filesystem dump)।" },
          { en: "Compare it across two units or two firmware versions to confirm it is identical, not per-device.", simple: "Compare it on two devices to prove it is the same.", hi: "दो units या दो firmware versions पर compare करके confirm करो यह identical है, per-device नहीं।" },
          { en: "Show the credential is live — e.g. it authenticates a shared service or validates/signs for the fleet.", simple: "Show the shared secret actually works.", hi: "दिखाओ credential live है — shared service auth या fleet के लिए sign/validate करता है।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the credential, its storage location, and evidence it is shared fleet-wide (identical on multiple units/versions) and functional. The fleet-wide reach is what distinguishes this from a per-device secret. A per-device-unique credential, or a dead one, is N/A.",
      simple: "Show the secret, where it is stored, that it is identical across devices, and that it works. Per-device secrets do not count.",
      hi: "Triage को चाहिए: credential, storage location, और proof कि यह fleet-wide shared (multiple units पर identical) और functional है। Fleet-wide reach ही इसको per-device secret से अलग करता है। Per-device unique या dead credential N/A।",
    },
    references: [
      { label: "CWE-798: Use of Hard-coded Credentials", url: "https://cwe.mitre.org/data/definitions/798.html" },
    ],
  },

  "Insecure OS/Firmware › Weakness in Firmware Updates › Firmware does not validate update integrity": {
    what: {
      en: "The device accepts a firmware update without verifying a cryptographic signature against a trusted key (CWE-434-style unrestricted upload of dangerous content, applied to firmware). An attacker who can deliver an update — via the update channel, a MITM, or the local update interface — flashes modified firmware and gains persistent control. P3 reflects the high privilege/user-interaction conditions, but impact on success is full device compromise.",
      simple: "The device installs firmware updates without checking they are genuinely signed. An attacker can flash their own modified firmware onto it.",
      hi: "Device firmware update को बिना cryptographic signature verify किए accept कर लेता है (CWE-434 style)। जो attacker update deliver कर सके (update channel, MITM, local interface) वह modified firmware flash करके persistent control पा लेता है। P3 conditions की वजह से, पर success पर full device compromise।",
    },
    find: [
      {
        title: { en: "Flash a modified firmware image", simple: "Try installing a changed firmware", hi: "Modified firmware image flash करके देखो" },
        steps: [
          { en: "Obtain a legitimate update image and unpack it (binwalk); make a benign modification (add a marker file / harmless banner).", simple: "Unpack a real firmware update and make a small harmless change.", hi: "Legitimate update image लेकर binwalk से unpack करो; benign modification (marker file/banner) करो।" },
          { en: "Repackage it — without re-signing with the vendor key you don't have — and submit it through the normal update path on your own device.", simple: "Repack without the vendor signature and update your own device with it.", hi: "Vendor key के बिना repackage करके अपने device के normal update path से submit करो।" },
          { en: "Confirm the device accepts and boots the unsigned/modified image rather than rejecting it on signature grounds.", simple: "Check the device accepts the unsigned image.", hi: "Confirm करो device unsigned/modified image accept और boot करता है, signature पर reject नहीं करता।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs proof the device accepted a firmware image you modified without a valid vendor signature — your benign marker present after update, or a boot of the altered image. Keep changes harmless and non-bricking. If the device rejects unsigned/modified firmware, or you only replaced it with the legitimate signed image, it is N/A.",
      simple: "Show the device booted your modified, unsigned firmware. If it rejects tampering, it does not count.",
      hi: "Triage को चाहिए: proof कि device ने आपके modified, बिना valid signature वाले firmware को accept किया — update के बाद benign marker या altered image का boot। Harmless रखो। अगर unsigned firmware reject हो तो N/A।",
    },
    escalate: {
      en: "Combined with a cleartext/MITM-able update channel or 'Firmware is not encrypted', building and delivering the malicious image becomes remote and trivial, raising real-world severity well beyond the base P3.",
      simple: "If the update is also delivered in cleartext or unencrypted, the attack becomes remote and much more serious.",
      hi: "Cleartext/MITM-able update channel या 'Firmware is not encrypted' के साथ, malicious image बनाना और deliver करना remote/trivial हो जाता है, severity P3 से काफ़ी ऊपर।",
    },
    references: [
      { label: "CWE-434: Unrestricted Upload of File with Dangerous Type", url: "https://cwe.mitre.org/data/definitions/434.html" },
    ],
  },

  "Insecure OS/Firmware › Weakness in Firmware Updates › Firmware is not encrypted": {
    what: {
      en: "Firmware images are distributed/stored without confidentiality — the update blob is plaintext, so anyone can unpack it with binwalk and read the full filesystem, binaries, and any embedded secrets (CWE-434 is the taxonomy's chosen mapping here). This does not by itself let an attacker run code; it removes the (weak) obscurity barrier to analysing the device, so Bugcrowd treats lack of encryption alone as P5.",
      simple: "The firmware file isn't encrypted, so anyone can open it and read everything inside. On its own this just makes the device easier to study.",
      hi: "Firmware image बिना confidentiality के distribute/store होती है — update blob plaintext है, कोई भी binwalk से unpack करके filesystem/binaries/embedded secrets पढ़ लेता है। यह खुद code run नहीं करवाता, सिर्फ़ analysis का obscurity barrier हटाता है — इसीलिए अकेला P5।",
    },
    find: [
      {
        title: { en: "Unpack the firmware without any key", simple: "Open the firmware file directly", hi: "बिना key firmware unpack करो" },
        steps: [
          { en: "Download the vendor firmware image and run `binwalk` / `binwalk -e` and `file` on it.", simple: "Download the firmware and try to unpack it.", hi: "Vendor firmware download करके `binwalk`/`binwalk -e` और `file` चलाओ।" },
          { en: "Confirm the filesystem and binaries extract directly (no decryption step, high entropy only in compressed sections, not whole-image).", simple: "Check the contents come out without needing a key.", hi: "Confirm करो filesystem/binaries बिना decryption के extract हो रहे हैं (whole-image high entropy नहीं)।" },
        ],
      },
    ],
    proof: {
      en: "Show that the image unpacks to a readable filesystem with no decryption. This is P5/informational on its own and usually not rewarded. It becomes valuable only as the enabling step for a higher-impact finding (hardcoded/shared credentials, missing signature) you also demonstrate.",
      simple: "Show the firmware opens with no key. P5 and rarely paid alone — pair it with a real secret or signature bug you find inside.",
      hi: "दिखाओ image बिना decryption के readable filesystem में खुलती है। अकेले P5/informational, अक्सर rewarded नहीं। Value तभी जब इसको hardcoded/shared credential या missing signature जैसे higher-impact finding के enabler के रूप में use करो।",
    },
    escalate: {
      en: "Use `siblings`: pairing with 'Firmware does not validate update integrity' turns readable firmware into a practical path to craft and flash malicious updates; secrets found inside (hardcoded/shared credentials) carry the real reward.",
      simple: "Combined with a missing update signature, or secrets you find inside, it becomes a real bug.",
      hi: "'Firmware does not validate update integrity' के साथ pair करने पर readable firmware malicious update बनाने का practical path बन जाता है; अंदर मिले secrets (hardcoded/shared creds) real reward देते हैं।",
    },
  },

  "Insecure OS/Firmware › Weakness in Firmware Updates › Firmware cannot be updated": {
    what: {
      en: "The device has no mechanism to update its firmware at all — no OTA, no field-flash path, or an update process that is permanently broken. Any vulnerability baked into the shipped firmware can never be patched, so the device stays exploitable for its whole lifetime. The band varies with the severity of what cannot be fixed.",
      simple: "The device can never get a firmware update, so any bug it ships with can never be patched.",
      hi: "Device का firmware update करने का कोई mechanism ही नहीं — न OTA, न field-flash, या update permanently टूटा हुआ। Shipped firmware का कोई भी bug कभी patch नहीं हो सकता, device ज़िंदगी भर exploitable। Band इस पर depend कि क्या fix नहीं हो सकता।",
    },
    find: [
      {
        title: { en: "Confirm there is no working update path", simple: "Check the device cannot be updated", hi: "Confirm करो कोई working update path नहीं" },
        steps: [
          { en: "Review device docs, the update UI/API, and firmware for any OTA/flash capability; check for an updater service or signed-image loader.", simple: "Look for any update feature in the device and firmware.", hi: "Device docs, update UI/API और firmware में OTA/flash capability ढूँढो; updater service/loader check करो।" },
          { en: "Attempt the documented update procedure and confirm it either does not exist or fails irrecoverably.", simple: "Try to update it and show there is no way to.", hi: "Documented update procedure try करके confirm करो कि वह exist नहीं करता या irrecoverably fail होता है।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs evidence there is genuinely no viable update path, and ideally the concrete unpatched issue this leaves exposed (that drives the band). Simply preferring more frequent updates, or a device that is merely end-of-life but was updatable, is weak/N/A.",
      simple: "Show there is truly no way to update, and point to a real bug it leaves unpatchable. Just wanting more updates is not enough.",
      hi: "Triage को चाहिए: proof कि कोई viable update path नहीं, और ideally वह concrete unpatched issue जो इससे exposed रहता है (band इसी से)। सिर्फ़ ज़्यादा updates चाहना या end-of-life device N/A।",
    },
  },

  "Insecure OS/Firmware › Data not encrypted at rest › Non sensitive": {
    what: {
      en: "Data stored on the device's persistent media is not encrypted at rest, but the data in question is non-sensitive (CWE-311, missing encryption of sensitive data — here applied to non-sensitive data). With physical access (AV:P) an attacker can read it, but since it carries no confidentiality value the practical impact is minimal, hence P5.",
      simple: "Stored data isn't encrypted, but it isn't secret either. Someone with the device can read it, but it doesn't matter much.",
      hi: "Device के persistent media पर data at rest encrypted नहीं, पर वह data non-sensitive है (CWE-311)। Physical access (AV:P) से attacker पढ़ सकता है, पर confidentiality value न होने से impact minimal — P5।",
    },
    find: [
      {
        title: { en: "Image the storage and classify the data", simple: "Copy the storage and check the data is not secret", hi: "Storage image करके data classify करो" },
        steps: [
          { en: "With physical access, image the flash/disk (chip read, dd, or mount the extracted partition) and list its contents.", simple: "Make a copy of the device storage and list what is on it.", hi: "Physical access से flash/disk image (chip read, dd, या extracted partition mount) करके contents list करो।" },
          { en: "Confirm the data is readable without decryption AND that it is non-sensitive — no creds, keys, PII, or security-relevant state.", simple: "Confirm it is unencrypted and genuinely not secret.", hi: "Confirm करो data बिना decryption readable है और non-sensitive — कोई creds/keys/PII/security state नहीं।" },
        ],
      },
    ],
    proof: {
      en: "This is P5/informational and generally not rewarded. The honest finding is that unencrypted-at-rest non-sensitive data has minimal impact. If any of the recovered data is actually sensitive, report it under the 'Sensitive' sibling where the band can be much higher.",
      simple: "P5 and usually not paid. If any recovered data is really sensitive, use the 'Sensitive' leaf instead.",
      hi: "यह P5/informational है, आम तौर पर rewarded नहीं। ईमानदार finding: unencrypted non-sensitive data का impact minimal। अगर कोई recovered data वाकई sensitive हो तो 'Sensitive' sibling use करो जहाँ band ज़्यादा हो सकती है।",
    },
    references: [
      { label: "CWE-311: Missing Encryption of Sensitive Data", url: "https://cwe.mitre.org/data/definitions/311.html" },
    ],
  },

  "Insecure OS/Firmware › Data not encrypted at rest › Sensitive": {
    what: {
      en: "Sensitive data (credentials, keys, tokens, PII, health/financial records) is stored on the device's persistent media with no encryption at rest (CWE-311). An attacker with physical access, a stolen/decommissioned unit, or a storage image reads the secrets directly. The band varies with what leaks and the access required, but genuinely sensitive data pushes it well above the non-sensitive sibling.",
      simple: "Secret data is stored on the device without encryption. Anyone with the device or its storage can read the secrets.",
      hi: "Sensitive data (credentials, keys, tokens, PII, health/financial) device के persistent media पर बिना at-rest encryption store है (CWE-311)। Physical access, चोरी/decommissioned unit या storage image वाला attacker secrets directly पढ़ लेता है। Band leak और access पर depend, पर sensitive data इसको non-sensitive sibling से ऊपर ले जाता है।",
    },
    find: [
      {
        title: { en: "Recover sensitive data from the raw storage", simple: "Pull secrets from the device storage", hi: "Raw storage से sensitive data recover करो" },
        steps: [
          { en: "Image the device storage (chip-off/JTAG, dd of the flash, or mount the extracted partition).", simple: "Copy the device's raw storage.", hi: "Device storage image करो (chip-off/JTAG, dd, या partition mount)।" },
          { en: "Carve and grep for credentials, private keys, tokens, and PII in cleartext; confirm nothing had to be decrypted.", simple: "Search the copy for cleartext secrets and personal data.", hi: "Image में credentials, private keys, tokens, PII cleartext ढूँढो; confirm कुछ decrypt नहीं करना पड़ा।" },
          { en: "Document what is exposed and the access level needed to obtain it.", simple: "Note what leaked and how you got it.", hi: "Note करो क्या expose हुआ और किस access level से मिला।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the recovered sensitive value (redacted), its on-storage location, and the access required (physical/stolen device, storage image). Naming the exact sensitive data drives the band. If the data is encrypted at rest, or is not actually sensitive, it is N/A (use the non-sensitive sibling).",
      simple: "Show the real secret recovered from storage and how you reached it. Encrypted or non-sensitive data does not count here.",
      hi: "Triage को चाहिए: recovered sensitive value (redacted), storage पर location, और required access। Exact sensitive data नाम करना band तय करता है। Encrypted या non-sensitive data N/A (non-sensitive sibling use करो)।",
    },
    references: [
      { label: "OWASP MASTG — Data Storage", url: "https://mas.owasp.org/MASTG/0x05d-Testing-Data-Storage/" },
    ],
  },

  "Insecure OS/Firmware › Failure to Remove Sensitive Artifacts from Disk": {
    what: {
      en: "Sensitive artifacts left behind on the device's disk after they should have been wiped — debug logs, build/provisioning files, old config with keys, swap/temp files, factory-test data, or data that survives a 'factory reset' (CWE-459, incomplete cleanup). An attacker with the device or a decommissioned unit recovers secrets the vendor believed were gone. Band varies with the sensitivity of the leftovers.",
      simple: "The device leaves secret leftovers on disk (debug logs, old keys, data that survives factory reset). Someone with the device can recover them.",
      hi: "Device के disk पर sensitive artifacts रह जाते हैं जो wipe होने चाहिए थे — debug logs, provisioning files, पुराने config with keys, swap/temp, या factory-reset के बाद बचे data (CWE-459)। Device/decommissioned unit वाला attacker उन secrets को recover कर लेता है। Band leftovers की sensitivity पर।",
    },
    find: [
      {
        title: { en: "Hunt leftover artifacts, including post-reset", simple: "Search for leftover secret files, even after reset", hi: "Leftover artifacts ढूँढो, reset के बाद भी" },
        steps: [
          { en: "Image the disk and enumerate logs, /tmp, swap, build/provisioning dirs, and deleted-but-not-wiped blocks (file carving with photorec/foremost).", simple: "Copy the disk and search logs, temp, and deleted areas for secrets.", hi: "Disk image करके logs, /tmp, swap, provisioning dirs और deleted blocks (photorec/foremost से carving) enumerate करो।" },
          { en: "Perform the device's factory reset, re-image, and check which sensitive artifacts still survive.", simple: "Do a factory reset and check what secrets remain.", hi: "Factory reset करके re-image करो और देखो कौन-से sensitive artifacts बच जाते हैं।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the recovered artifact (redacted), where it was found, and whether it survives the intended cleanup/reset — survival after a factory reset is the strongest evidence. Non-sensitive leftovers, or artifacts correctly removed by a reset, are N/A.",
      simple: "Show the secret leftover, where it was, and that normal cleanup/reset doesn't remove it. Non-sensitive leftovers do not count.",
      hi: "Triage को चाहिए: recovered artifact (redacted), कहाँ मिला, और क्या वह intended cleanup/reset के बाद बचता है — factory reset के बाद बचना सबसे strong evidence। Non-sensitive leftover या reset से सही हटा artifact N/A।",
    },
    references: [
      { label: "CWE-459: Incomplete Cleanup", url: "https://cwe.mitre.org/data/definitions/459.html" },
    ],
  },

  "Insecure OS/Firmware › Kiosk Escape or Breakout": {
    what: {
      en: "A device locked into kiosk/single-app mode (POS, info terminal, digital signage, locked tablet) can be broken out of to reach the underlying OS — via dialog/file-picker tricks, keyboard shortcuts, unhandled intents/URIs, help/print dialogs, or exposed OS UI (CWE-284, improper access control). Escaping the kiosk gives the local attacker access to functions and data the lockdown was meant to prevent. Band varies with what the escape exposes.",
      simple: "A device locked to one app can be escaped to reach the full operating system, giving access the lockdown was meant to block.",
      hi: "Kiosk/single-app mode में locked device (POS, info terminal, signage) से underlying OS तक breakout किया जा सकता है — dialog/file-picker tricks, keyboard shortcuts, unhandled intents/URIs, print dialogs, या exposed OS UI से (CWE-284)। Escape से local attacker को वे functions/data मिलते हैं जो lockdown रोकना चाहता था। Band escape के exposure पर।",
    },
    find: [
      {
        title: { en: "Probe the lockdown for an escape to the OS", simple: "Try to break out of the locked app", hi: "Lockdown से OS तक escape probe करो" },
        steps: [
          { en: "Enumerate every interactive surface: links that open file pickers/print/help dialogs, share sheets, external-app intents/custom URI schemes, and any settings or keyboard access.", simple: "Find every dialog, link, or shortcut the locked app exposes.", hi: "हर interactive surface enumerate करो: file picker/print/help dialogs, share sheets, external intents/custom URI schemes, settings/keyboard access।" },
          { en: "Use those to reach a file browser, address bar, task switcher, or a shell/settings screen outside the kiosk app.", simple: "Use them to reach the file browser, settings, or a shell.", hi: "इनसे file browser, address bar, task switcher या shell/settings तक पहुँचो — kiosk app के बाहर।" },
          { en: "Confirm you can run arbitrary actions or read data the kiosk was meant to block.", simple: "Confirm you reached functions the lockdown should block.", hi: "Confirm करो आप वे actions/data access कर सकते हो जो kiosk block करना चाहता था।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the exact escape steps and a screenshot/recording of the OS surface (file system, settings, shell, other apps) reached outside the kiosk, plus what that enables. A cosmetic glitch that stays inside the locked app, or a theoretical path you cannot actually trigger, is N/A.",
      simple: "Show the steps and a screenshot of the OS you reached outside the locked app. Cosmetic glitches don't count.",
      hi: "Triage को चाहिए: exact escape steps और OS surface (file system, settings, shell, other apps) का screenshot/recording जो kiosk के बाहर मिला, और उससे क्या enable होता है। Cosmetic glitch जो locked app के अंदर ही रहे, N/A।",
    },
    references: [
      { label: "CWE-284: Improper Access Control", url: "https://cwe.mitre.org/data/definitions/284.html" },
    ],
  },

  "Insecure OS/Firmware › Poorly Configured Disk Encryption": {
    what: {
      en: "The device does have disk/storage encryption, but it is configured so weakly that it fails its purpose (CWE-326, inadequate encryption strength) — a hardcoded or null passphrase, a key stored in cleartext next to the data, a weak/known KDF, encryption that doesn't cover the sensitive partitions, or a TPM/secure-element binding that is absent so the key is recoverable off-device. Impact varies with how completely the protection collapses.",
      simple: "The device encrypts its disk, but so badly (key left in cleartext, hardcoded passphrase, weak algorithm) that the encryption gives no real protection.",
      hi: "Device disk encryption करता तो है, पर इतना weak configure कि वह बेकार हो जाता है (CWE-326) — hardcoded/null passphrase, key cleartext में data के पास, weak KDF, sensitive partitions cover न करना, या TPM/secure-element binding न होना। Impact इस पर कि protection कितना collapse होता है।",
    },
    find: [
      {
        title: { en: "Break or bypass the at-rest encryption", simple: "Show the disk encryption can be defeated", hi: "At-rest encryption को तोड़/bypass करो" },
        steps: [
          { en: "Identify the encryption scheme (dm-crypt/LUKS, FDE, file-based) and where the key/passphrase comes from.", simple: "Find how the disk is encrypted and where the key lives.", hi: "Encryption scheme (LUKS/FDE/file-based) और key/passphrase का source पता करो।" },
          { en: "Check for the key stored on the device in cleartext, a hardcoded/null passphrase, a weak KDF, or partitions left unencrypted; recover the key off-device if it isn't hardware-bound.", simple: "Look for the key in cleartext or a weak/hardcoded passphrase.", hi: "Cleartext key, hardcoded/null passphrase, weak KDF या unencrypted partition check करो; hardware-bound न हो तो key off-device recover करो।" },
          { en: "Decrypt or mount the volume with the recovered key to prove the protection is ineffective.", simple: "Unlock the disk with the recovered key to prove it.", hi: "Recovered key से volume decrypt/mount करके prove करो protection ineffective है।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the specific weakness (where the key was, the weak parameter) and a demonstration that you decrypted/read the protected data without the intended secret. Pointing at a preferred algorithm without showing the encryption is actually defeatable, or a correctly hardware-bound scheme, is weak/N/A.",
      simple: "Show the exact weakness and that you unlocked the data without the intended key. Just preferring a stronger algorithm is not enough.",
      hi: "Triage को चाहिए: specific weakness (key कहाँ थी, weak parameter) और demonstration कि आपने intended secret के बिना protected data decrypt/read किया। सिर्फ़ algorithm preference या सही hardware-bound scheme weak/N/A।",
    },
    references: [
      { label: "CWE-326: Inadequate Encryption Strength", url: "https://cwe.mitre.org/data/definitions/326.html" },
    ],
  },

  "Insecure OS/Firmware › Poorly Configured Operating System Security": {
    what: {
      en: "The embedded OS is hardened poorly in its shipped configuration (CWE-16, configuration) — unnecessary services/ports exposed, Telnet/debug/ADB left on, permissive file/service permissions, disabled security features (SELinux permissive, no secure boot), or verbose debug logging. No single flaw may be critical, but the weak baseline broadens attack surface. Band varies with which misconfiguration you can actually leverage.",
      simple: "The device's operating system is set up insecurely out of the box — extra open services, debug access left on, security features disabled — making it easier to attack.",
      hi: "Embedded OS की shipped config poorly hardened है (CWE-16) — unnecessary services/ports open, Telnet/debug/ADB on, permissive permissions, disabled security features (SELinux permissive, no secure boot), verbose logging। कोई एक flaw critical न हो, पर weak baseline attack surface बढ़ाता है। Band इस पर कि आप कौन-सा misconfig leverage कर सको।",
    },
    find: [
      {
        title: { en: "Enumerate the OS hardening baseline", simple: "Check the OS security settings", hi: "OS hardening baseline enumerate करो" },
        steps: [
          { en: "Port-scan the device and list listening services; flag Telnet, debug consoles, ADB-over-network, unauthenticated management ports.", simple: "Scan for open ports and risky services like Telnet or ADB.", hi: "Device port-scan करके listening services list करो; Telnet, debug console, ADB-over-network, unauth management ports flag करो।" },
          { en: "On the device, check SELinux/AppArmor mode, secure-boot state, world-writable dirs, setuid binaries, and overly verbose logging.", simple: "Check security features and loose permissions on the device.", hi: "Device पर SELinux/AppArmor mode, secure-boot, world-writable dirs, setuid binaries और verbose logging check करो।" },
          { en: "Demonstrate that at least one misconfiguration gives a concrete foothold or information gain.", simple: "Show at least one misconfiguration gives real access.", hi: "दिखाओ कम से कम एक misconfiguration concrete foothold/info देता है।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the specific misconfiguration and concrete evidence of what it grants (an open service you connected to, a permission you abused, a security control confirmed disabled). A generic hardening list with no demonstrated impact tends toward P5/informational; the leveraged item sets the band.",
      simple: "Name the exact misconfiguration and show what it lets you do. A generic checklist with no impact is low value.",
      hi: "Triage को चाहिए: specific misconfiguration और concrete proof कि वह क्या देता है (open service जिससे connect किया, abused permission, disabled control)। बिना impact वाली generic list P5/informational; leveraged item band तय करता है।",
    },
    references: [
      { label: "CWE-16: Configuration", url: "https://cwe.mitre.org/data/definitions/16.html" },
    ],
  },

  "Insecure OS/Firmware › Recovery of Disk Contains Sensitive Material": {
    what: {
      en: "The device's recovery/maintenance image or recovery partition contains sensitive material (CWE-522, insufficiently protected credentials) — embedded keys, service passwords, backups, or config an attacker can boot into or extract. Because recovery mode often runs with elevated rights and weaker checks, secrets there can unlock the main system. Band varies with what the recovery image exposes and the access needed.",
      simple: "The device's recovery image or partition holds secrets (keys, passwords, backups) that an attacker can extract or boot into.",
      hi: "Device की recovery/maintenance image या recovery partition में sensitive material होता है (CWE-522) — embedded keys, service passwords, backups, config जिसमें attacker boot या extract कर सके। Recovery mode अक्सर elevated rights/weak checks पर चलता है, इसलिए वहाँ के secrets main system unlock कर सकते हैं। Band exposure और access पर।",
    },
    find: [
      {
        title: { en: "Extract and inspect the recovery image", simple: "Open the recovery image and look for secrets", hi: "Recovery image extract करके inspect करो" },
        steps: [
          { en: "Obtain the recovery image/partition (vendor download, dump the recovery slot, or capture the recovery-mode filesystem).", simple: "Get the recovery image or partition.", hi: "Recovery image/partition लो (vendor download, recovery slot dump, या recovery-mode filesystem capture)।" },
          { en: "`binwalk -e` / mount it and grep for credentials, private keys, tokens, and backups.", simple: "Unpack it and search for keys and passwords.", hi: "`binwalk -e`/mount करके credentials, private keys, tokens, backups grep करो।" },
          { en: "Show the recovered secret works against the main system or otherwise grants access the recovery image shouldn't expose.", simple: "Show a recovered secret actually unlocks something.", hi: "दिखाओ recovered secret main system पर काम करता है या access देता है जो recovery image को expose नहीं करना चाहिए।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the recovered material (redacted), that it came from the recovery image/partition, and ideally that it grants access elsewhere. Note the access needed to obtain the recovery image. Non-sensitive recovery contents, or secrets properly protected/hardware-bound, are N/A.",
      simple: "Show the secret found in the recovery image and that it grants access. Non-sensitive recovery contents don't count.",
      hi: "Triage को चाहिए: recovered material (redacted), यह recovery image/partition से आया, और ideally कि वह access देता है। Recovery image लेने के लिए access note करो। Non-sensitive recovery contents या properly protected secrets N/A।",
    },
    references: [
      { label: "CWE-522: Insufficiently Protected Credentials", url: "https://cwe.mitre.org/data/definitions/522.html" },
    ],
  },

  "Lack of Binary Hardening › Lack of Exploit Mitigations": {
    what: {
      en: "The native binary ships without standard compile/link-time mitigations — no PIE/ASLR, no stack canaries, no NX/DEP, no RELRO, or 32-bit without fortify. These don't create a vulnerability; they make exploiting a separate memory-corruption bug easier. On their own, with no demonstrated memory bug, they are a hardening gap, which is why Bugcrowd rates this P5.",
      simple: "The app's native code was built without protections (ASLR, stack canaries, NX). This doesn't cause a bug by itself — it just makes other bugs easier to exploit.",
      hi: "Native binary standard compile/link-time mitigations के बिना ship हुआ — न PIE/ASLR, न stack canaries, न NX/DEP, न RELRO। ये खुद vulnerability नहीं बनाते, बस किसी अलग memory-corruption bug का exploitation आसान करते हैं। अकेले, बिना demonstrated memory bug के, यह hardening gap है — इसलिए P5।",
    },
    find: [
      {
        title: { en: "Check the binary's mitigation flags", simple: "Inspect the compiled protections", hi: "Binary के mitigation flags check करो" },
        steps: [
          { en: "Pull the native libs (lib/*.so from the APK, Mach-O from the IPA) and run `checksec`, `rabin2 -I`, or `otool`/`jtool`.", simple: "Extract the native libraries and run checksec on them.", hi: "Native libs (APK की lib/*.so, IPA की Mach-O) निकालकर `checksec`, `rabin2 -I` या `otool` चलाओ।" },
          { en: "Note which of PIE, NX, canary, RELRO, fortify are missing.", simple: "List which protections are off.", hi: "Note करो PIE, NX, canary, RELRO, fortify में से क्या missing है।" },
        ],
      },
    ],
    proof: {
      en: "The checksec output is the evidence, but this is P5/informational and is not rewarded on its own. It only matters if you can pair it with a real memory-corruption vulnerability in the same binary that the missing mitigation makes exploitable — report that bug as the finding.",
      simple: "Show the checksec output, but know it is P5 and not paid alone. It only counts alongside a real memory bug it helps exploit.",
      hi: "checksec output evidence है, पर यह P5/informational है और अकेले rewarded नहीं। मतलब तभी जब इसको उसी binary के real memory-corruption bug के साथ pair करो जिसे missing mitigation exploitable बनाता है — वही bug report करो।",
    },
    references: [
      { label: "OWASP MASTG — Code Quality & Build Settings", url: "https://mas.owasp.org/MASTG/" },
    ],
  },

  "Lack of Binary Hardening › Lack of Obfuscation": {
    what: {
      en: "The app's code is shipped without obfuscation, so decompilers (jadx, Hopper, Ghidra, class-dump) recover near-original logic, class/method names, and strings. This is a reverse-engineering convenience for an attacker, not a vulnerability — obscurity is not a security control. Secrets that are only 'protected' by lack of obfuscation are the real issue, and those belong under storage/credential leaves. P5.",
      simple: "The app isn't obfuscated, so it is easy to decompile and read. That makes reversing easier but is not itself a security hole.",
      hi: "App का code बिना obfuscation ship होता है, इसलिए decompilers (jadx, Hopper, Ghidra) near-original logic, names और strings recover कर लेते हैं। यह attacker के लिए reverse-engineering convenience है, vulnerability नहीं — obscurity security control नहीं। असली issue वे secrets हैं जो सिर्फ़ obfuscation से 'protected' थे। P5।",
    },
    find: [
      {
        title: { en: "Decompile and assess readability", simple: "Decompile the app and see how readable it is", hi: "Decompile करके readability देखो" },
        steps: [
          { en: "Decompile the APK with jadx (or the IPA binary with Hopper/Ghidra) and inspect whether names/logic are intact and unobfuscated.", simple: "Decompile the app and check the code is plainly readable.", hi: "APK को jadx (या IPA binary को Hopper/Ghidra) से decompile करके देखो names/logic intact हैं।" },
          { en: "Separately, search the readable code for anything that is actually sensitive (keys, endpoints, logic flaws) — that is where a real finding would live.", simple: "Look in the readable code for real secrets or flaws.", hi: "Readable code में अलग से actually sensitive चीज़ें (keys, endpoints, logic flaws) ढूँढो — असली finding वहाँ।" },
        ],
      },
    ],
    proof: {
      en: "P5/informational and not rewarded on its own; triage treats missing obfuscation as expected, not a flaw. Only a concrete secret or exploitable logic recovered from the unobfuscated code is submittable, and it should be reported under the leaf matching that actual issue.",
      simple: "P5 and not paid alone. Report only a real secret or flaw you found in the readable code, under its proper leaf.",
      hi: "P5/informational, अकेले rewarded नहीं; triage missing obfuscation को expected मानता है, flaw नहीं। सिर्फ़ unobfuscated code से मिला concrete secret या exploitable logic submittable है, और उसको उसके सही leaf के under report करो।",
    },
  },

  "Lack of Binary Hardening › Lack of Jailbreak Detection": {
    what: {
      en: "The app has no (or trivially bypassed) root/jailbreak detection, so it runs normally on a rooted Android or jailbroken iOS device. This is a defence-in-depth control, not a vulnerability — its absence does not by itself harm a user whose own device is compromised. Bugcrowd rates this P5; it is specific to the detection control, distinct from the pinning-bypass siblings elsewhere.",
      simple: "The app doesn't detect (or easily lets you past) a rooted/jailbroken phone. That's a missing safety check, not a direct bug.",
      hi: "App में root/jailbreak detection नहीं (या trivially bypass हो जाता है), इसलिए rooted Android/jailbroken iOS पर normally चलता है। यह defence-in-depth control है, vulnerability नहीं — इसका न होना खुद user को नुकसान नहीं करता जिसका device already compromised है। Bugcrowd इसे P5 rate करता है।",
    },
    find: [
      {
        title: { en: "Run on a rooted/jailbroken device", simple: "Try the app on a rooted phone", hi: "Rooted/jailbroken device पर चलाओ" },
        steps: [
          { en: "Install and launch the app on a rooted Android (Magisk) or jailbroken iOS device; see if it warns or refuses.", simple: "Launch the app on a rooted device and see if it complains.", hi: "Rooted Android (Magisk)/jailbroken iOS पर app launch करो; देखो warn/refuse करता है।" },
          { en: "If a check exists, bypass it with objection (`android root disable` / `ios jailbreak disable`) or a Frida hook on the detection method, and confirm it was defeatable.", simple: "If there is a check, bypass it with objection/Frida.", hi: "अगर check हो तो objection (`android root disable`) या detection method पर Frida hook से bypass करके confirm करो defeatable था।" },
        ],
      },
    ],
    proof: {
      en: "Show the app runs on a rooted/jailbroken device (or that the check is bypassable). This is P5/informational and generally not rewarded alone; it only gains value if the missing control is a stated security requirement of the program or enables a concrete further attack you also demonstrate.",
      simple: "Show it runs on a rooted device. P5 and rarely paid alone unless the program specifically requires the check.",
      hi: "दिखाओ app rooted/jailbroken device पर चलता है (या check bypassable है)। यह P5/informational, आम तौर पर अकेले rewarded नहीं; value तभी जब program की stated requirement हो या आगे कोई concrete attack enable करे।",
    },
    references: [
      { label: "OWASP MASTG — Anti-Reversing / Resilience", url: "https://mas.owasp.org/MASTG/" },
    ],
  },

  "Lack of Binary Hardening › Runtime Instrumentation-Based": {
    what: {
      en: "The app has no (or defeatable) anti-instrumentation / anti-tamper defences, so a dynamic toolkit like Frida, objection, or a debugger can attach, hook methods, and alter runtime behaviour. Like the other hardening leaves this is a resilience control, not a vulnerability — its absence matters for a self-defending app, not for the integrity of the backend. P5.",
      simple: "The app doesn't stop tools like Frida from attaching and changing its behaviour at runtime. This is a missing anti-tamper defence, not a direct bug.",
      hi: "App में anti-instrumentation/anti-tamper defences नहीं (या defeatable), इसलिए Frida, objection या debugger attach होकर methods hook और runtime behaviour बदल सकता है। बाकी hardening leaves की तरह यह resilience control है, vulnerability नहीं। P5।",
    },
    find: [
      {
        title: { en: "Attach a runtime instrumentation toolkit", simple: "Attach Frida/objection to the app", hi: "Runtime instrumentation toolkit attach करो" },
        steps: [
          { en: "Start the app with Frida (`frida -U -f <pkg>`) or objection and attempt to enumerate/hook classes and methods.", simple: "Attach Frida or objection and try to hook the app.", hi: "App को Frida (`frida -U -f <pkg>`) या objection से start करके classes/methods hook करने की कोशिश करो।" },
          { en: "If a Frida/debugger/emulator check exists, defeat it (objection anti-detection, Frida hook on the check) and confirm hooks then take effect.", simple: "If there is an anti-Frida check, bypass it and confirm hooking works.", hi: "अगर Frida/debugger/emulator check हो तो उसे defeat (objection anti-detection, Frida hook) करके confirm करो hooks लग रहे हैं।" },
        ],
      },
    ],
    proof: {
      en: "Show Frida/objection successfully attaching and hooking (or the anti-instrumentation check being bypassed). This is P5/informational and not rewarded on its own; it is only meaningful when paired with a concrete abuse the instrumentation enables that the program considers in scope.",
      simple: "Show Frida attached and hooking. P5 and not paid alone — only matters with a concrete abuse it enables.",
      hi: "दिखाओ Frida/objection attach और hook कर रहा है (या anti-instrumentation check bypass हुआ)। यह P5/informational, अकेले rewarded नहीं; meaningful तभी जब instrumentation से enable होने वाले concrete abuse के साथ हो जो program scope में माने।",
    },
    references: [
      { label: "OWASP MASTG — Resilience Testing", url: "https://mas.owasp.org/MASTG/" },
    ],
  },

  "Mobile Security Misconfiguration › SSL Certificate Pinning › Absent": {
    what: {
      en: "The app validates TLS with the system trust store but does not pin the server certificate/public key. On an unmodified device the connection is still encrypted and safe; pinning only adds protection against a user-installed/compromised CA. So absent pinning is a hardening gap (P5), not a MITM bug — distinct from the 'Defeatable' sibling where a pin exists but can be bypassed.",
      simple: "The app uses normal HTTPS but doesn't 'pin' the server's certificate. Traffic is still encrypted; pinning would just add extra protection against a bad CA.",
      hi: "App system trust store से TLS validate करता है पर server certificate/public key pin नहीं करता। Unmodified device पर connection फिर भी encrypted और safe है; pinning सिर्फ़ user-installed/compromised CA से extra protection देता है। इसलिए absent pinning hardening gap (P5) है, MITM bug नहीं — 'Defeatable' sibling से अलग जहाँ pin है पर bypass होता है।",
    },
    find: [
      {
        title: { en: "Check whether traffic can be read without pinning", simple: "See if a trusted proxy CA can read the traffic", hi: "Check करो बिना pinning के traffic readable है" },
        steps: [
          { en: "Install your Burp/mitmproxy CA into the device/app trust store and proxy the app.", simple: "Add your proxy's CA to the device and route the app through it.", hi: "अपना Burp/mitmproxy CA device/app trust store में install करके app को proxy करो।" },
          { en: "If traffic decrypts with a user-added CA and no further hook is needed, pinning is absent (not merely bypassed).", simple: "If a user-added CA alone lets you read traffic, pinning is absent.", hi: "अगर user-added CA से ही traffic decrypt हो जाए और कोई hook न चाहिए, तो pinning absent है (सिर्फ़ bypass नहीं)।" },
        ],
      },
    ],
    proof: {
      en: "Show traffic decrypting with only a user-installed CA (no Frida/objection hook required). This is P5/informational and typically not rewarded alone — it requires the attacker to already control the device's trust store. Value comes only if you then capture genuinely sensitive data or chain it; report that under the data-transport leaf.",
      simple: "Show traffic readable with just your own CA added. P5 and rarely paid alone since the attacker must already control the device's CAs.",
      hi: "दिखाओ सिर्फ़ user-installed CA से traffic decrypt होता है (Frida/objection hook के बिना)। यह P5/informational, अक्सर अकेले rewarded नहीं — attacker को पहले device trust store control करना पड़ता है। Value तभी जब sensitive data capture या chain करो।",
    },
    references: [
      { label: "OWASP MASTG — Network Communication / Pinning", url: "https://mas.owasp.org/MASTG/0x05g-Testing-Network-Communication/" },
    ],
  },

  "Mobile Security Misconfiguration › SSL Certificate Pinning › Defeatable": {
    what: {
      en: "The app implements certificate pinning, but the pin can be bypassed at runtime — a standard objection/Frida unpinning script, hooking OkHttp's CertificatePinner or TrustManager.checkServerTrusted, or SSLContext, defeats it. This differs from the 'Absent' sibling: a control exists but provides no real resilience against an attacker with device access. Still P5, since defeating it requires controlling the device.",
      simple: "The app does pin its certificate, but the pinning is easy to switch off with Frida/objection, so it gives little real protection.",
      hi: "App certificate pinning करता तो है, पर pin runtime पर bypass हो जाता है — standard objection/Frida unpinning script, OkHttp CertificatePinner या TrustManager.checkServerTrusted hook से। यह 'Absent' sibling से अलग: control मौजूद है पर device-access वाले attacker के against कोई real resilience नहीं देता। फिर भी P5।",
    },
    find: [
      {
        title: { en: "Bypass the pin with a runtime hook", simple: "Turn off the pinning with Frida/objection", hi: "Runtime hook से pin bypass करो" },
        steps: [
          { en: "With your proxy CA trusted, confirm traffic is blocked (pin active).", simple: "First confirm pinning blocks your proxy.", hi: "अपना proxy CA trust करके पहले confirm करो traffic block होता है (pin active)।" },
          { en: "Run objection `android sslpinning disable` / `ios sslpinning disable`, or a Frida CertificatePinner/checkServerTrusted hook, and re-test.", simple: "Use objection or a Frida unpinning hook.", hi: "objection `android sslpinning disable` या Frida CertificatePinner/checkServerTrusted hook चलाओ, फिर re-test।" },
          { en: "Confirm traffic now decrypts through your proxy, demonstrating the pin was defeatable.", simple: "Confirm traffic now goes through your proxy.", hi: "Confirm करो अब traffic proxy से decrypt होता है, यानी pin defeatable था।" },
        ],
      },
    ],
    proof: {
      en: "Show the pin active, then defeated via a named hook, with traffic then flowing through your proxy. P5/informational and generally not rewarded alone — it presupposes device control. It only matters paired with sensitive data capture or a further chain, reported under the data-transport leaf.",
      simple: "Show pinning working, then bypassed, with traffic flowing. P5 and rarely paid alone — needs device control.",
      hi: "दिखाओ pin active, फिर named hook से defeated, और traffic proxy से flow होता है। P5/informational, आम तौर पर अकेले rewarded नहीं — device control मानता है। मतलब तभी जब sensitive data capture या chain के साथ हो।",
    },
    references: [
      { label: "OWASP MASTG — Testing Network Communication", url: "https://mas.owasp.org/MASTG/0x05g-Testing-Network-Communication/" },
    ],
  },

  "Mobile Security Misconfiguration › Auto Backup Allowed by Default": {
    what: {
      en: "On Android the app leaves android:allowBackup=true (and/or no fullBackupContent / dataExtractionRules excluding its data), so its private files are swept into ADB/cloud backups. Anyone with physical/ADB access can `adb backup` the app and extract its sandboxed data off-device without root. CVSS here is AV:P/PR:H — physical plus the ability to run backup — so it is P5, but it directly undermines the internal-storage sandbox.",
      simple: "The app allows backups by default, so someone with USB/ADB access can copy the app's private data off the phone without rooting it.",
      hi: "Android पर app android:allowBackup=true छोड़ता है (और/या dataExtractionRules exclusion नहीं), इसलिए private files ADB/cloud backup में आ जाती हैं। Physical/ADB access वाला `adb backup` से app का sandboxed data बिना root के निकाल लेता है। CVSS AV:P/PR:H — इसलिए P5, पर यह internal-storage sandbox को directly कमज़ोर करता है।",
    },
    find: [
      {
        title: { en: "Pull the app's data via adb backup", simple: "Back up the app and extract its data", hi: "adb backup से app का data निकालो" },
        steps: [
          { en: "Check the manifest for android:allowBackup (and absence of restrictive dataExtractionRules / fullBackupContent).", simple: "Check the manifest allows backup.", hi: "Manifest में android:allowBackup और restrictive rules की absence check करो।" },
          { en: "Run `adb backup -f out.ab <pkg>`, then convert with abe (android-backup-extractor) / `dd`+tar and unpack.", simple: "Run adb backup and unpack the resulting file.", hi: "`adb backup -f out.ab <pkg>` चलाकर abe/tar से unpack करो।" },
          { en: "Inspect the extracted sandbox files for sensitive data recovered without root.", simple: "Check the extracted data for secrets.", hi: "Extracted sandbox files में बिना root recover हुई sensitive data check करो।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the manifest flag, a successful backup extraction, and ideally sensitive app data recovered from it without root. Note the physical/ADB-access precondition. On modern Android where backup is restricted or the recovered data is non-sensitive, it is weak/N/A; strongest when it exposes credentials or PII.",
      simple: "Show allowBackup=true, a successful adb backup extraction, and sensitive data inside. Needs physical/ADB access.",
      hi: "Triage को चाहिए: manifest flag, successful backup extraction, और ideally बिना root recover हुई sensitive data। Physical/ADB precondition note करो। Modern Android पर restricted हो या data non-sensitive हो तो weak/N/A; strongest जब credentials/PII expose हो।",
    },
    references: [
      { label: "Android — Back up user data with Auto Backup", url: "https://developer.android.com/identity/data/autobackup" },
    ],
  },

  "Mobile Security Misconfiguration › Clipboard Enabled": {
    what: {
      en: "The app copies sensitive values (passwords, OTPs, card numbers, seed phrases) to the system clipboard, or leaves copy enabled on sensitive fields. The clipboard is shared across apps, so another app (and, on older Android, any background app) can read it; on iOS the general pasteboard is also readable by other apps. The CVSS (AV:L, UI:R, C:L) reflects limited local disclosure — P5.",
      simple: "The app puts secrets like passwords or OTPs on the shared clipboard, where other apps can read them.",
      hi: "App sensitive values (passwords, OTP, card numbers, seed phrase) को system clipboard पर copy करता है, या sensitive fields पर copy enabled छोड़ता है। Clipboard apps के बीच shared है, इसलिए दूसरी app (पुराने Android पर कोई background app) उसे पढ़ सकती है; iOS general pasteboard भी readable। CVSS limited local disclosure दिखाता है — P5।",
    },
    find: [
      {
        title: { en: "Copy a sensitive value and read it from another context", simple: "Copy a secret, then read the clipboard elsewhere", hi: "Sensitive value copy करके दूसरी जगह से clipboard पढ़ो" },
        steps: [
          { en: "On your test account, copy a sensitive field (or let the app auto-copy an OTP/card).", simple: "Copy a secret value in the app.", hi: "Test account पर sensitive field copy करो (या app को OTP/card auto-copy करने दो)।" },
          { en: "Read the clipboard from a second app or via `adb shell service call clipboard`/ a Frida hook on ClipboardManager, confirming the secret is exposed.", simple: "Read the clipboard from another app and confirm the secret is there.", hi: "दूसरी app से या `adb shell`/ClipboardManager पर Frida hook से clipboard पढ़कर confirm करो secret expose हुआ।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the sensitive value shown sitting on the shared clipboard and readable outside the app. This is P5/informational, usually not rewarded alone, and even weaker on modern OSes that restrict background clipboard reads and warn on access. Copying non-sensitive text is N/A.",
      simple: "Show a real secret on the clipboard readable by another app. P5 and rarely paid alone; non-secret text doesn't count.",
      hi: "Triage को चाहिए: sensitive value shared clipboard पर और app के बाहर readable। यह P5/informational, अक्सर अकेले rewarded नहीं, और modern OS पर (जो background clipboard reads restrict/warn करते हैं) और weak। Non-sensitive text copy करना N/A।",
    },
  },

  "Mobile Security Misconfiguration › Tapjacking": {
    what: {
      en: "On Android, the app does not defend sensitive UI against overlay attacks — it lacks android:filterTouchesWhenObscured / setFilterTouchesWhenObscured, so a malicious app drawing a SYSTEM_ALERT_WINDOW overlay can trick the user into tapping sensitive controls they can't see (confirm, grant, pay). It requires the victim to install an overlay app and user interaction (UI:R), so Bugcrowd rates it P5.",
      simple: "The app doesn't block overlay tricks, so a malicious app on top can fool the user into tapping buttons they can't see, like a confirm or pay button.",
      hi: "Android पर app sensitive UI को overlay attacks से protect नहीं करता — android:filterTouchesWhenObscured नहीं होता, इसलिए SYSTEM_ALERT_WINDOW overlay वाली malicious app user को ऐसे controls tap करवा देती है जो उसे दिखते नहीं (confirm, grant, pay)। इसमें victim को overlay app install करनी पड़ती है और UI:R चाहिए, इसलिए P5।",
    },
    find: [
      {
        title: { en: "Overlay a sensitive screen and capture an obscured tap", simple: "Put an overlay over a sensitive button and test the tap", hi: "Sensitive screen पर overlay डालकर obscured tap test करो" },
        steps: [
          { en: "Identify a sensitive action view and check it doesn't set filterTouchesWhenObscured (inspect layout/decompiled code).", simple: "Find a sensitive button and check it doesn't filter obscured touches.", hi: "Sensitive action view ढूँढो और check करो filterTouchesWhenObscured set नहीं (layout/decompiled code)।" },
          { en: "Build or use a test overlay app with SYSTEM_ALERT_WINDOW that covers that control, then tap through the overlay on your own device.", simple: "Use a test overlay app over that control and tap through it.", hi: "SYSTEM_ALERT_WINDOW वाली test overlay app उस control के ऊपर रखो, फिर अपने device पर overlay के through tap करो।" },
          { en: "Confirm the tap reaches and triggers the hidden sensitive control.", simple: "Confirm the hidden button actually gets pressed.", hi: "Confirm करो tap hidden sensitive control तक पहुँचकर उसे trigger करता है।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs a demonstration (recording) that an overlay can drive a genuinely sensitive action without the user seeing it, plus the missing filterTouchesWhenObscured. This is P5/informational, usually not rewarded alone, and weaker on OS versions that already suppress touches to obscured windows. A non-sensitive target or a theoretical overlay is N/A.",
      simple: "Record an overlay triggering a real sensitive action unseen, and show the missing protection. P5 and rarely paid alone.",
      hi: "Triage को चाहिए: recording कि overlay genuinely sensitive action को user के देखे बिना drive करती है, और missing filterTouchesWhenObscured। यह P5/informational, अक्सर अकेले rewarded नहीं, और उन OS versions पर weak जो obscured windows के touches suppress करते हैं। Non-sensitive target या theoretical overlay N/A।",
    },
    references: [
      { label: "Android — filterTouchesWhenObscured", url: "https://developer.android.com/reference/android/view/View#security" },
    ],
  },
};
