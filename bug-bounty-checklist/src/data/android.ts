import type { ChecklistCategory } from "../types/checklist";

// Ordered: Static Analysis -> Dynamic Analysis -> Data Storage -> Network -> IPC -> Reverse Eng Protection

export const androidCategories: ChecklistCategory[] = [
  {
    id: "android-static",
    reference: "https://mas.owasp.org/MASTG/0x05b-Android-Security-Testing/",
    name: "Static Analysis",
    emoji: "📱",
    items: [
      {
        id: "android-static-1",
        text: "Decompile APK and review manifest",
        how: "Use apktool/jadx to decompile the APK and check AndroidManifest.xml for exported components and debug flags.",
        payloads: ["jadx -d out app.apk"],
        payloadNotes: [
          "Decompiles the APK's DEX bytecode and resources into readable Java source: -d out sets the output directory for the decompiled project, and app.apk is the input APK file being analyzed.",
        ],
        expectedResponse: {
          vulnerable: "The decompiled source and manifest are cleanly readable, revealing exported components, debug settings, and internal logic without obfuscation.",
          safe: "Decompilation succeeds but the code is heavily obfuscated/minified and sensitive manifest details are not directly informative on their own.",
        },
        severity: "info",
      },
      {
        id: "android-static-2",
        text: "Search decompiled source for hardcoded secrets",
        how: "Grep decompiled code/strings.xml for API keys, credentials, and internal URLs.",
        payloads: ["grep -rEi \"(api[_-]?key|secret|token|password|AIza[0-9A-Za-z_-]{35})\" out/ --include=*.java --include=*.xml"],
        payloadNotes: [
          "Recursively searches decompiled Java/XML files for secret-related keywords and Google API key patterns: -r recurses into subdirectories, -E enables extended regex, -i makes matching case-insensitive, the pattern alternates common secret keywords plus a regex matching the 35-character AIza-prefixed Google API key format, out/ is the search root, and the two --include flags restrict matching to .java and .xml files.",
        ],
        expectedResponse: {
          vulnerable: "grep matches reveal a plaintext API key, credential, or internal URL embedded directly in code or resources.",
          safe: "No matches are found, or matches are placeholders/false positives with real secrets fetched at runtime from a secure backend.",
        },
        severity: "high",
      },
      {
        id: "android-static-3",
        text: "Check for exported activities without permission protection",
        how: "Review android:exported=\"true\" components in the manifest that lack a permission requirement — these are callable by any app.",
        payloads: ["<activity android:name=\".SecretActivity\" android:exported=\"true\" />  <!-- no android:permission -->", "apkanalyzer manifest print app.apk | grep -A2 'android:exported=\"true\"'"],
        payloadNotes: [
          "Example manifest entry showing an activity exported without any permission requirement: android:name=\".SecretActivity\" identifies the component class, android:exported=\"true\" makes it callable by any other app on the device, and the absence of an android:permission attribute means no caller-side permission is enforced.",
          "Prints the manifest and lists every exported component: apkanalyzer manifest print app.apk dumps the full parsed manifest for the APK, and piping to grep -A2 'android:exported=\"true\"' shows each exported=\"true\" match plus its next two lines of surrounding attributes.",
        ],
        expectedResponse: {
          vulnerable: "The manifest shows android:exported=\"true\" on a sensitive activity with no android:permission attribute, and apkanalyzer confirms it's callable externally.",
          safe: "Exported sensitive activities declare a signature-level android:permission or perform explicit caller verification in code.",
        },
        severity: "high",
      },
      {
        id: "android-static-4",
        text: "Check debuggable flag in manifest",
        how: "Verify android:debuggable is false in the release build; a debuggable app can be attached to and manipulated at runtime.",
        payloads: ["aapt dump badging app.apk | grep -i debuggable", "adb shell run-as <package>  # succeeds if debuggable=true"],
        payloadNotes: [
          "Dumps APK badging metadata and filters for the debuggable flag: aapt dump badging app.apk prints the app's manifest-derived metadata, and grep -i debuggable case-insensitively isolates the line reporting whether the app is marked debuggable.",
          "Attempts to run a shell as the app's UID: adb shell run-as <package> asks the device to spawn a shell running as the specified package's user, which only succeeds when that package is built with android:debuggable=\"true\".",
        ],
        expectedResponse: {
          vulnerable: "aapt shows debuggable=true and adb shell run-as <package> succeeds, giving shell access to the app's private data.",
          safe: "debuggable is false in the release build and run-as is rejected with 'run-as: package not debuggable'.",
        },
        severity: "high",
      },
      {
        id: "android-static-5",
        text: "Check allowBackup flag",
        how: "If android:allowBackup is true, app data can be extracted via adb backup without root, potentially leaking sensitive local storage.",
        payloads: ["adb backup -f backup.ab <package>"],
        payloadNotes: [
          "Triggers an adb backup of the app's data: -f backup.ab sets the output archive filename, and <package> is the target app's package name whose app-private data gets included if android:allowBackup permits it.",
        ],
        expectedResponse: {
          vulnerable: "android:allowBackup is true (or unset, defaulting to true) and adb backup produces a non-empty archive containing app data.",
          safe: "allowBackup is explicitly false, and adb backup returns an empty/failed backup for the package.",
        },
        severity: "medium",
      },
      {
        id: "android-static-6",
        text: "Review requested permissions for over-privileging",
        how: "Check the manifest for permissions not clearly justified by app functionality (e.g. SMS access for a non-messaging app).",
        payloads: ["aapt dump permissions app.apk", "adb shell dumpsys package <package> | grep -A30 'requested permissions'"],
        payloadNotes: [
          "Lists every permission declared by the APK: aapt dump permissions extracts the uses-permission entries directly from the manifest, and app.apk is the file being inspected.",
          "Shows the installed package's requested permissions: adb shell dumpsys package <package> dumps the system's full record for that package, and piping to grep -A30 'requested permissions' prints the matching header plus the following 30 lines listing each permission.",
        ],
        expectedResponse: {
          vulnerable: "Permissions like SMS, contacts, or location are requested with no corresponding feature in the app, indicating over-privileging.",
          safe: "Every requested permission maps directly to an observable app feature, with no unexplained sensitive grants.",
        },
        severity: "medium",
      },
      {
        id: "android-static-7",
        text: "Check for custom URL scheme / deep link handling flaws",
        how: "Review intent-filter definitions for custom schemes and confirm input from the deep link is validated before use.",
        payloads: ["<intent-filter>\n  <action android:name=\"android.intent.action.VIEW\" />\n  <category android:name=\"android.intent.category.BROWSABLE\" />\n  <data android:scheme=\"myapp\" android:host=\"reset\" />\n</intent-filter>"],
        payloadNotes: [
          "Example manifest intent-filter declaring a browsable custom URL scheme: the VIEW action lets the component respond to view requests, the BROWSABLE category lets a browser trigger it from a clicked link, and android:scheme=\"myapp\" with android:host=\"reset\" define the custom myapp://reset URI the app registers to handle.",
        ],
        expectedResponse: {
          vulnerable: "The intent-filter accepts a custom scheme/host and the handling code uses extras directly (e.g. in a URL or SQL query) without validation.",
          safe: "Deep link parameters are validated/sanitized and unexpected or malformed values are rejected before use.",
        },
        severity: "high",
      },
      {
        id: "android-static-8",
        text: "Check for insecure use of WebView (JavaScript bridge exposure)",
        how: "Look for addJavascriptInterface() usage that exposes native methods to loaded web content, especially if the WebView loads external URLs.",
        payloads: ["grep -rn \"addJavascriptInterface\" out/", "<script>alert(Object.keys(window.AndroidBridge))</script>"],
        payloadNotes: [
          "Searches decompiled code for calls that expose a native object to WebView JavaScript: -r recurses through subdirectories, -n prints matching line numbers, and addJavascriptInterface is the WebView API method that binds a Java object to a JavaScript-accessible name.",
          "Injected script that enumerates the exposed bridge's methods: Object.keys(window.AndroidBridge) lists every property/method name on the AndroidBridge object the app exposed via addJavascriptInterface, and alert() displays the result in the WebView.",
        ],
        expectedResponse: {
          vulnerable: "addJavascriptInterface() is found exposing a bridge object, and the injected script successfully enumerates methods on window.AndroidBridge from loaded web content.",
          safe: "No addJavascriptInterface() usage is found, or the WebView only loads trusted local content with no bridge exposed to remote pages.",
        },
        severity: "critical",
      },
      {
        id: "android-static-9",
        text: "Check for hardcoded cryptographic keys/IVs",
        how: "Search decompiled code for static keys used in encryption routines instead of being derived securely.",
        payloads: ["grep -rnE \"(SecretKeySpec|IvParameterSpec)\\(\\s*\\\"\" out/"],
        payloadNotes: [
          "Searches decompiled code for key/IV constructors initialized directly from a string literal: -r recurses subdirectories, -n prints line numbers, -E enables extended regex, and the pattern matches a call to SecretKeySpec( or IvParameterSpec( whose argument begins with a quoted string rather than a runtime-derived byte array.",
        ],
        expectedResponse: {
          vulnerable: "A static byte array or string literal is found passed directly into SecretKeySpec/IvParameterSpec instead of being derived at runtime.",
          safe: "Keys and IVs are generated via KeyGenerator/SecureRandom or retrieved from the Android Keystore, with no static key material in source.",
        },
        severity: "high",
      },
      {
        id: "android-static-10",
        text: "Check ProGuard/R8 obfuscation effectiveness",
        how: "Assess how readable the decompiled code is — weak/missing obfuscation makes reverse engineering and tampering easier.",
        payloads: ["jadx -d out app.apk && find out -iname '*.java' | xargs grep -l 'class a\\|class b'"],
        payloadNotes: [
          "Decompiles the APK then searches for obfuscation-typical class names: jadx -d out app.apk decompiles into the out directory, find out -iname '*.java' locates every decompiled Java file case-insensitively, and piping to xargs grep -l 'class a\\|class b' lists files declaring a class literally named a or b.",
        ],
        expectedResponse: {
          vulnerable: "Decompiled class/method names remain meaningful (original names preserved) or trivial single-letter names still map clearly to original logic via comments/strings.",
          safe: "Class and method names are renamed to short opaque identifiers (a, b, c...) with control flow flattened, making the logic hard to follow.",
        },
        severity: "low",
      },
      {
        id: "android-static-11",
        text: "Check for third-party SDKs with known vulnerabilities",
        how: "Identify bundled SDK versions (ad networks, analytics) and cross-reference against known CVEs.",
        payloads: ["unzip -l app.apk | grep -i 'lib/\\|classes' ", "find out -name '*.jar' -o -name 'gradle.properties' | xargs grep -i version"],
        payloadNotes: [
          "Lists the APK's contents to identify bundled SDKs: unzip -l app.apk prints the archive's file listing without extracting, and grep -i 'lib/\\|classes' case-insensitively filters for native library paths or classes.dex-related entries.",
          "Finds bundled build/version files and inspects them: find out -name '*.jar' -o -name 'gradle.properties' locates any .jar files or gradle.properties files under the decompiled output, and piping to xargs grep -i version prints lines mentioning version strings.",
        ],
        expectedResponse: {
          vulnerable: "A bundled SDK version is identified that matches a publicly known CVE with an available exploit.",
          safe: "All bundled third-party SDKs are on current versions with no known unpatched vulnerabilities.",
        },
        severity: "medium",
      },
      {
        id: "android-static-12",
        text: "Check for cleartext traffic permission in network security config",
        how: "Review network_security_config.xml for cleartextTrafficPermitted=\"true\", which allows unencrypted HTTP traffic.",
        payloads: ["<base-config cleartextTrafficPermitted=\"true\">\n  <trust-anchors>\n    <certificates src=\"system\" />\n  </trust-anchors>\n</base-config>"],
        payloadNotes: [
          "Example network security config entry that explicitly permits unencrypted HTTP traffic: the <base-config> block applies to all domains by default, cleartextTrafficPermitted=\"true\" allows plain HTTP connections, and the nested <trust-anchors>/<certificates src=\"system\"> declares that the system CA store is trusted for TLS validation.",
        ],
        expectedResponse: {
          vulnerable: "The network security config sets cleartextTrafficPermitted=\"true\" for the base config or a specific domain.",
          safe: "cleartextTrafficPermitted is false (or unset, defaulting to false on modern targetSdk) for all relevant domains.",
        },
        severity: "medium",
      },
    ],
  },
  {
    id: "android-dynamic",
    reference: "https://mas.owasp.org/MASTG/0x05b-Android-Security-Testing/",
    name: "Dynamic Analysis",
    emoji: "⚙️",
    items: [
      {
        id: "android-dynamic-1",
        text: "Intercept traffic with Frida + Burp (cert pinning bypass)",
        how: "Use a Frida script to bypass SSL pinning so Burp can intercept and modify app traffic.",
        payloads: ["frida -U -f <package> -l ssl-pinning-bypass.js --no-pause", "objection -g <package> explore --startup-command 'android sslpinning disable'"],
        payloadNotes: [
          "Launches the app under Frida with a pinning-bypass script: -U targets the USB-connected device, -f <package> spawns the app fresh by package name, -l ssl-pinning-bypass.js loads the hooking script that disables pinning checks, and --no-pause lets the process run immediately instead of waiting at the entry point.",
          "Uses Objection to attach and disable pinning: -g <package> attaches to the running app by package name, explore opens an interactive REPL session, and --startup-command 'android sslpinning disable' runs Objection's built-in SSL pinning bypass automatically on attach.",
        ],
        expectedResponse: {
          vulnerable: "Burp successfully intercepts and displays/modifies decrypted app traffic after the Frida bypass script runs.",
          safe: "The app detects the hooking/pinning bypass attempt and terminates the connection or crashes, and Burp shows no decrypted traffic.",
        },
        severity: "medium",
      },
      {
        id: "android-dynamic-2",
        text: "Test for root/jailbreak detection bypass",
        how: "Use Frida/Objection to hook and bypass root detection checks to test the app's behavior on a rooted device.",
        payloads: ["objection -g <package> explore --startup-command 'android root disable'", "frida -U -f <package> -l root-detection-bypass.js --no-pause"],
        payloadNotes: [
          "Attaches Objection and disables root detection: -g <package> targets the running app by package name, explore starts the interactive session, and --startup-command 'android root disable' runs Objection's built-in command that patches common root-detection checks.",
          "Launches the app under Frida with a root-detection bypass: -U selects the USB device, -f <package> spawns the app by package name, -l root-detection-bypass.js loads the custom hooking script, and --no-pause resumes execution immediately.",
        ],
        expectedResponse: {
          vulnerable: "The app's root-restricted features become accessible on a rooted device once the detection hook is applied.",
          safe: "The app maintains multiple independent detection layers and continues to block/restrict functionality even after the primary hook is bypassed.",
        },
        severity: "low",
      },
      {
        id: "android-dynamic-3",
        text: "Hook and monitor runtime API calls for sensitive data leaks",
        how: "Trace calls to logging, crypto, and network functions at runtime to spot sensitive data mishandling.",
        payloads: ["frida-trace -U -f <package> -j 'javax.crypto.Cipher.doFinal' -j 'android.util.Log.*'", "objection -g <package> explore --startup-command 'android hooking watch class_method javax.crypto.Cipher.doFinal --dump-args --dump-return'"],
        payloadNotes: [
          "Traces sensitive runtime calls: -U selects the USB device, -f <package> spawns the app by package name, and each -j flag adds a Java method glob to trace — javax.crypto.Cipher.doFinal for encryption/decryption calls and android.util.Log.* for every logging method — printing arguments and call sites as they fire.",
          "Watches a specific method call via Objection: class_method javax.crypto.Cipher.doFinal names the fully-qualified method to hook, --dump-args prints the arguments passed to it, and --dump-return prints its return value each time it's invoked.",
        ],
        expectedResponse: {
          vulnerable: "Traced output reveals plaintext arguments/return values for crypto or logging calls containing sensitive data such as keys, tokens, or PII.",
          safe: "Traced calls show properly randomized/encrypted values with no sensitive plaintext exposed in arguments or return values.",
        },
        severity: "medium",
      },
      {
        id: "android-dynamic-4",
        text: "Test exported activities for unauthorized access",
        how: "Launch exported activities directly via adb from another app context to check if they bypass intended auth flow.",
        payloads: ["adb shell am start -n <package>/<activity>"],
        payloadNotes: [
          "Directly launches the named activity component: am start invokes the Activity Manager's start command, and -n <package>/<activity> specifies the exact component (package plus activity class) to launch, bypassing whatever screen would normally lead to it.",
        ],
        expectedResponse: {
          vulnerable: "adb shell am start successfully launches the exported activity from outside the app context, bypassing intended access controls or authentication.",
          safe: "The activity requires a custom signature-level permission or validates the caller, and the adb start attempt fails or is redirected to a login/deny screen.",
        },
        severity: "high",
      },
      {
        id: "android-dynamic-5",
        text: "Test deep link handling for parameter injection",
        how: "Trigger the app's custom URL scheme with malicious parameters to check if input is trusted without validation.",
        payloads: ["adb shell am start -a android.intent.action.VIEW -d 'myapp://reset?token=x'"],
        payloadNotes: [
          "Fires a VIEW intent at the app's custom URL scheme: -a android.intent.action.VIEW sets the intent action to a standard view request, and -d 'myapp://reset?token=x' supplies the data URI, including an attacker-controlled token query parameter, that the app's intent-filter will route to its handler.",
        ],
        expectedResponse: {
          vulnerable: "The crafted deep link parameter (e.g. a manipulated token) is accepted and acted upon without validation, altering app state or triggering a sensitive action.",
          safe: "The app validates the deep link parameters and rejects or safely ignores the malicious/malformed value.",
        },
        severity: "high",
      },
      {
        id: "android-dynamic-6",
        text: "Monitor logcat for sensitive data logging",
        how: "Watch adb logcat during app usage for passwords, tokens, or PII being logged in plaintext.",
        payloads: ["adb logcat | grep -i 'password\\|token'"],
        payloadNotes: [
          "Streams the device's system log and filters it: adb logcat prints all log lines in real time, and grep -i 'password\\|token' case-insensitively keeps only lines mentioning password or token.",
        ],
        expectedResponse: {
          vulnerable: "logcat output during normal app usage contains plaintext passwords, tokens, or PII.",
          safe: "logcat shows no sensitive values, with logging either disabled in release builds or redacted before being written.",
        },
        severity: "medium",
      },
      {
        id: "android-dynamic-7",
        text: "Test clipboard for sensitive data exposure",
        how: "Check if sensitive values (OTPs, tokens) are copied to the clipboard, which other apps can read.",
        payloads: ["adb shell dumpsys clipboard", "objection -g <package> explore --startup-command 'android hooking watch class_method android.content.ClipboardManager.setPrimaryClip --dump-args'"],
        payloadNotes: [
          "Dumps the current system clipboard state: dumpsys clipboard queries the ClipboardManager system service and prints its current contents and metadata.",
          "Watches clipboard writes via Objection: class_method android.content.ClipboardManager.setPrimaryClip hooks the method the app calls to place data on the clipboard, and --dump-args prints the actual clip contents passed each time it's invoked.",
        ],
        expectedResponse: {
          vulnerable: "dumpsys clipboard or the hook shows sensitive values (OTP, tokens) being placed on the system clipboard.",
          safe: "Sensitive values are never copied to the clipboard, or the app marks clipboard entries as sensitive (isSensitive/CLIPBOARD flag) preventing exposure.",
        },
        severity: "low",
      },
      {
        id: "android-dynamic-8",
        text: "Test biometric authentication bypass",
        how: "Check if biometric prompt result is validated purely client-side, allowing bypass via hooking the callback.",
        payloads: ["frida -U -f <package> -l biometric-bypass.js --no-pause  # hooks BiometricPrompt$AuthenticationCallback.onAuthenticationSucceeded", "objection -g <package> explore --startup-command 'android hooking watch class androidx.biometric.BiometricPrompt$AuthenticationCallback'"],
        payloadNotes: [
          "Hooks the biometric success callback with Frida: -U selects the USB device, -f <package> spawns the app by package name, -l biometric-bypass.js loads a script targeting BiometricPrompt$AuthenticationCallback.onAuthenticationSucceeded, and --no-pause resumes the app immediately so the hook can force that callback to fire without a genuine scan.",
          "Watches the biometric callback class via Objection: watch class androidx.biometric.BiometricPrompt$AuthenticationCallback logs every invocation of that callback class's methods so testers can see how and when authentication success/failure is signaled to app code.",
        ],
        expectedResponse: {
          vulnerable: "Hooking onAuthenticationSucceeded forces the success path to execute even without a real biometric match, granting access.",
          safe: "The biometric result is tied to a CryptoObject/Keystore-backed operation, so forcing the callback alone does not unlock any protected data or action.",
        },
        severity: "critical",
      },
    ],
  },
  {
    id: "android-storage",
    reference: "https://mas.owasp.org/MASTG/0x05d-Testing-Data-Storage/",
    name: "Data Storage",
    emoji: "💾",
    items: [
      {
        id: "android-storage-1",
        text: "Check for sensitive data in SharedPreferences/SQLite",
        how: "Pull app data directory (rooted device/emulator) and inspect local storage files for plaintext secrets.",
        payloads: ["adb shell run-as <package> cat shared_prefs/*.xml"],
        payloadNotes: [
          "Reads the app's private SharedPreferences files: run-as <package> executes the following command as that app's own UID, and cat shared_prefs/*.xml prints every XML preferences file in its private data directory.",
        ],
        expectedResponse: {
          vulnerable: "Pulled SharedPreferences XML or SQLite files contain plaintext credentials, tokens, or other sensitive values.",
          safe: "Local storage files contain only non-sensitive data, or sensitive values are encrypted before being written.",
        },
        severity: "high",
      },
      {
        id: "android-storage-2",
        text: "Check for sensitive data on external/SD storage",
        how: "Confirm the app doesn't write sensitive files to externally-readable storage accessible by any app with storage permission.",
        payloads: ["adb shell ls -laR /sdcard/Android/data/<package>/", "adb pull /sdcard/Android/data/<package>/ ./external-data"],
        payloadNotes: [
          "Recursively lists the app's external storage directory: ls -laR shows all files including hidden ones (-a), with long-format details (-l), recursing into subdirectories (-R), for the path /sdcard/Android/data/<package>/ under the app's package name.",
          "Copies the app's external storage directory locally: adb pull takes the device source path /sdcard/Android/data/<package>/ and the local destination ./external-data to download the entire folder for offline review.",
        ],
        expectedResponse: {
          vulnerable: "Files containing sensitive data are found under /sdcard/, readable by any app holding storage permissions.",
          safe: "No sensitive data is written to external storage; all sensitive files remain in app-private internal storage.",
        },
        severity: "high",
      },
      {
        id: "android-storage-3",
        text: "Check Android Keystore usage for key storage",
        how: "Verify cryptographic keys are stored in the hardware-backed Keystore rather than app-private files.",
        payloads: ["grep -rn \"KeyStore.getInstance(\\\"AndroidKeyStore\\\")\" out/", "adb shell run-as <package> ls files/ shared_prefs/ | grep -i key"],
        payloadNotes: [
          "Searches decompiled code for the hardware-backed Keystore provider: -r recurses subdirectories, -n prints line numbers, and the quoted string matches calls that request the AndroidKeyStore provider specifically (rather than a software keystore).",
          "Lists app-private storage and filters for key material: run-as <package> ls files/ shared_prefs/ lists both private directories as the app's own user, and grep -i key case-insensitively keeps filenames suggesting stored keys.",
        ],
        expectedResponse: {
          vulnerable: "Keys are generated/stored via manual file-based key material rather than referencing the AndroidKeyStore provider.",
          safe: "grep confirms KeyStore.getInstance(\"AndroidKeyStore\") is used and no raw key files exist in the app's private storage.",
        },
        severity: "medium",
      },
      {
        id: "android-storage-4",
        text: "Check for sensitive data in app backups",
        how: "If allowBackup is enabled, extract and inspect the backup archive for leaked credentials/session data.",
        payloads: ["adb backup -f backup.ab -noapk <package>", "dd if=backup.ab bs=24 skip=1 | python3 -c \"import zlib,sys;sys.stdout.buffer.write(zlib.decompress(sys.stdin.buffer.read()))\" > backup.tar"],
        payloadNotes: [
          "Creates an adb backup of the app's data only: -f backup.ab names the output archive, -noapk excludes the APK binary itself from the backup, and <package> is the target app.",
          "Strips the backup header and decompresses the payload: dd if=backup.ab bs=24 skip=1 reads the archive in 24-byte blocks and skips the first block (the .ab header), and the piped python3 command inflates the remaining zlib-compressed data and writes it out as backup.tar.",
        ],
        expectedResponse: {
          vulnerable: "The extracted backup archive, once decompressed, contains readable credentials or session tokens.",
          safe: "The backup is empty/refused (allowBackup=false) or the sensitive data within it is encrypted independent of the backup mechanism.",
        },
        severity: "medium",
      },
      {
        id: "android-storage-5",
        text: "Check for sensitive data cached in WebView storage",
        how: "Inspect WebView's local storage/cache database for cached authenticated content or tokens.",
        payloads: ["adb shell run-as <package> sqlite3 app_webview/Default/Local\\ Storage/leveldb/*.log '.dump'", "adb shell run-as <package> find app_webview/ -iname '*.db'"],
        payloadNotes: [
          "Dumps the WebView's LevelDB log files as the app's user: run-as <package> executes as that UID, and sqlite3 ... '.dump' opens the LevelDB log file(s) under the WebView's Local Storage path and prints their contents in SQL-dump form.",
          "Locates SQLite databases in the WebView data directory: find app_webview/ -iname '*.db' searches that directory case-insensitively for any file ending in .db.",
        ],
        expectedResponse: {
          vulnerable: "The WebView's local storage/cache database contains cached authenticated page content or session tokens in plaintext.",
          safe: "WebView storage contains no sensitive cached content, or sensitive pages are excluded from caching/storage.",
        },
        severity: "medium",
      },
      {
        id: "android-storage-6",
        text: "Check for sensitive data in application logs written to disk",
        how: "Some apps write custom log files to local storage — check these for leaked secrets independent of logcat.",
        payloads: ["adb shell run-as <package> find files/ cache/ -iname '*.log' -o -iname '*.txt'", "adb shell run-as <package> grep -riE 'password|token|secret' files/*.log"],
        payloadNotes: [
          "Finds custom log/text files in app-private storage: find files/ cache/ searches both directories, and -iname '*.log' -o -iname '*.txt' matches filenames ending in .log or .txt case-insensitively.",
          "Searches those log files for sensitive keywords: -r recurses, -i is case-insensitive, -E enables extended regex, and the pattern matches password, token, or secret, applied to files/*.log.",
        ],
        expectedResponse: {
          vulnerable: "Custom log files on disk contain plaintext passwords, tokens, or secrets from app operations.",
          safe: "Custom log files contain no sensitive values, or file-based logging is disabled/redacted in release builds.",
        },
        severity: "medium",
      },
      {
        id: "android-storage-7",
        text: "Check screenshot/task-switcher snapshot exposure",
        how: "Verify FLAG_SECURE is set on sensitive screens so the OS doesn't capture them in the recent-apps screenshot.",
        payloads: ["grep -rn \"FLAG_SECURE\" out/", "adb shell screencap -p /sdcard/recent.png  # capture while sensitive screen is in recents"],
        payloadNotes: [
          "Searches decompiled code for the screenshot-blocking flag: -r recurses subdirectories, -n prints line numbers, and FLAG_SECURE is the WindowManager flag that prevents a window's content from appearing in screenshots or the recent-apps thumbnail.",
          "Takes a device screenshot to check for captured sensitive content: screencap -p captures the current screen in PNG format and writes it to /sdcard/recent.png, taken while the sensitive screen is displayed or in the recents view.",
        ],
        expectedResponse: {
          vulnerable: "The screencap captured during a sensitive screen shows its content, and grep finds no FLAG_SECURE usage for that screen.",
          safe: "FLAG_SECURE is set on sensitive screens, so the recent-apps screenshot/screencap shows a blank or obscured view.",
        },
        severity: "low",
      },
    ],
  },
  {
    id: "android-crypto",
    reference: "https://mas.owasp.org/MASTG/0x05e-Testing-Cryptography/",
    name: "Cryptography",
    emoji: "🔐",
    items: [
      {
        id: "android-crypto-1",
        text: "Check Android Keystore usage for cryptographic key storage",
        how: "Verify sensitive keys are generated/stored in the hardware-backed Android Keystore rather than derived and kept in app-private files.",
        payloads: ["grep -rn \"KeyGenParameterSpec\\|AndroidKeyStore\" out/", "adb shell run-as <package> ls files/ shared_prefs/ | grep -iE 'key|secret'"],
        payloadNotes: [
          "Searches decompiled code for Keystore key-generation APIs: -r recurses, -n prints line numbers, and the pattern matches either KeyGenParameterSpec (the builder used to configure Keystore-backed keys) or direct AndroidKeyStore provider references.",
          "Lists app-private files and filters for key/secret material: ls files/ shared_prefs/ runs as the app's own user via run-as, and grep -iE 'key|secret' case-insensitively keeps filenames suggesting stored key or secret data.",
        ],
        expectedResponse: {
          vulnerable: "Cryptographic keys are found stored as raw byte arrays in app-private files rather than referencing AndroidKeyStore.",
          safe: "grep confirms KeyGenParameterSpec/AndroidKeyStore usage and no raw key material exists in accessible app files.",
        },
        severity: "high",
      },
      {
        id: "android-crypto-2",
        text: "Check for use of deprecated/weak crypto algorithms",
        how: "Search decompiled code for MD5/SHA1/DES/ECB-mode usage in local data protection instead of modern recommended primitives (AES-GCM, SHA-256+).",
        payloads: ["grep -rnE \"MessageDigest.getInstance\\(\\\"(MD5|SHA-1)\\\"\\)|Cipher.getInstance\\(\\\"(DES|AES/ECB)\" out/"],
        payloadNotes: [
          "Searches decompiled code for weak crypto primitives: -r recurses, -n prints line numbers, -E enables extended regex, and the alternation matches MessageDigest.getInstance(\"MD5\") or (\"SHA-1\") for weak hashing, and Cipher.getInstance(\"DES...\") or (\"AES/ECB...\") for weak/insecure cipher configurations.",
        ],
        expectedResponse: {
          vulnerable: "Matches show MD5, SHA-1, DES, or AES/ECB mode used for protecting local data or generating security tokens.",
          safe: "Only modern primitives (AES-GCM/CBC with random IV, SHA-256 or stronger) are used for data protection.",
        },
        severity: "medium",
      },
      {
        id: "android-crypto-3",
        text: "Check for hardcoded IVs or key reuse in AES encryption",
        how: "Review encryption routines for a static IV or key reused across multiple encrypt calls, which weakens confidentiality guarantees.",
        payloads: ["grep -rn \"IvParameterSpec(\\\"\\|new byte\\[\\] iv =\" out/", "frida-trace -U -f <package> -j 'javax.crypto.spec.IvParameterSpec.*'"],
        payloadNotes: [
          "Searches decompiled code for hardcoded IVs: -r recurses, -n prints line numbers, and the pattern matches either an IvParameterSpec( constructor call taking a literal string or a byte array variable literally named iv being assigned.",
          "Traces IV construction at runtime: -U selects the USB device, -f <package> spawns the app by package name, and -j 'javax.crypto.spec.IvParameterSpec.*' hooks every method on the IvParameterSpec class to log the IV bytes used on each call.",
        ],
        expectedResponse: {
          vulnerable: "A hardcoded IV literal or a fixed key reused across multiple encrypt calls is found in code or confirmed via the Frida trace.",
          safe: "IVs are generated fresh per encryption operation via SecureRandom, and traced calls show a unique IV value on each invocation.",
        },
        severity: "high",
      },
      {
        id: "android-crypto-4",
        text: "Test for predictable random values (weak PRNG) in security-sensitive contexts",
        how: "Check if tokens/keys are derived from java.util.Random (seeded, predictable) instead of SecureRandom.",
        payloads: ["grep -rn \"new Random(\\|java.util.Random\" out/", "frida-trace -U -f <package> -j 'java.util.Random.*'"],
        payloadNotes: [
          "Searches decompiled code for the non-cryptographic PRNG: -r recurses, -n prints line numbers, and the pattern matches either a new Random( instantiation or any reference to the java.util.Random class.",
          "Traces java.util.Random calls at runtime: -U selects the USB device, -f <package> spawns the app by package name, and -j 'java.util.Random.*' hooks every method on that class to log generated values and check for predictability.",
        ],
        expectedResponse: {
          vulnerable: "Token/key generation code uses java.util.Random (or a fixed seed), and traced values are predictable/reproducible across runs.",
          safe: "Security-sensitive random values are generated via java.security.SecureRandom, producing non-reproducible output across runs.",
        },
        severity: "high",
      },
      {
        id: "android-crypto-5",
        text: "Check certificate/public-key pinning implementation strength",
        how: "Verify TLS pinning is implemented via a supported mechanism (Network Security Config / OkHttp CertificatePinner) covering all HTTP clients used, not just the main one.",
        payloads: ["grep -rn \"CertificatePinner\\|pin-set\" out/ res/", "frida -U -f <package> -l ssl-pinning-bypass.js --no-pause"],
        payloadNotes: [
          "Searches code and resources for pinning configuration: -r recurses, -n prints line numbers, and the pattern matches either OkHttp's CertificatePinner class or a pin-set element from a network security config, searched across both out/ (decompiled code) and res/ (resources).",
          "Launches the app under Frida with a pinning-bypass script: -U selects the USB device, -f <package> spawns the app by package name, -l ssl-pinning-bypass.js loads the hooking script that disables certificate pinning checks, and --no-pause resumes execution immediately.",
        ],
        expectedResponse: {
          vulnerable: "Only one HTTP client enforces pinning, or the Frida bypass script successfully disables pinning and Burp sees decrypted traffic.",
          safe: "All HTTP clients used by the app enforce pinning via a supported mechanism, and the bypass script fails to restore visibility into traffic.",
        },
        severity: "medium",
      },
      {
        id: "android-crypto-6",
        text: "Test padding oracle vulnerability in custom crypto implementations",
        how: "If the app implements custom encryption/decryption with padding, tamper with ciphertext and check for observable padding-error differences.",
        payloads: ["padbuster https://api.example.com/decrypt <encrypted_blob> 16 -encoding 0 -cookies 'session=...'", "python3 -c \"ct=bytearray.fromhex('...'); ct[-1]^=1; print(ct.hex())\"  # flip last padding byte"],
        payloadNotes: [
          "Runs PadBuster's automated padding oracle attack: the target URL is the decrypt endpoint, <encrypted_blob> is the ciphertext sample to attack, 16 sets the cipher block size in bytes, -encoding 0 tells PadBuster the sample is plain hex-encoded, and -cookies 'session=...' supplies the session cookie needed to authenticate each probe request.",
          "Manually corrupts padding for a test case: the script parses a hex ciphertext into a bytearray, XORs the last byte with 1 to flip it (ct[-1]^=1), and prints the resulting hex so it can be resubmitted to observe the padding-error response.",
        ],
        expectedResponse: {
          vulnerable: "Flipping ciphertext bytes produces a distinguishable padding-error response or timing difference, enabling a padding oracle attack.",
          safe: "The server/app returns an identical generic error regardless of padding validity, with no observable timing difference.",
        },
        severity: "high",
      },
    ],
  },
  {
    id: "android-network",
    reference: "https://mas.owasp.org/MASTG/0x05g-Testing-Network-Communication/",
    name: "Network Communication",
    emoji: "📡",
    items: [
      {
        id: "android-network-1",
        text: "Test SSL/TLS certificate pinning strength",
        how: "Confirm pinning can't be trivially bypassed and covers all network clients used by the app (not just the main OkHttp client).",
        payloads: ["frida -U -f <package> -l ssl-pinning-bypass.js --no-pause", "objection -g <package> explore --startup-command 'android sslpinning disable'"],
        payloadNotes: [
          "Launches the app under Frida with a pinning-bypass script: -U selects the USB device, -f <package> spawns the app by package name, -l ssl-pinning-bypass.js loads the hook, and --no-pause resumes execution immediately instead of pausing at start.",
          "Attaches Objection and disables pinning: -g <package> attaches to the running app by package name, explore opens the interactive session, and --startup-command 'android sslpinning disable' runs the built-in pinning bypass automatically.",
        ],
        expectedResponse: {
          vulnerable: "The Frida/objection pinning bypass succeeds and Burp displays decrypted traffic for all app network clients.",
          safe: "Pinning holds across every network client used, and the bypass attempt fails to reveal decrypted traffic for at least one client.",
        },
        severity: "medium",
      },
      {
        id: "android-network-2",
        text: "Test for cleartext HTTP traffic",
        how: "Monitor all network calls to confirm no sensitive data is sent over plain HTTP.",
        payloads: ["mitmproxy --mode transparent -p 8080", "adb shell settings put global http_proxy <burp_ip>:8080"],
        payloadNotes: [
          "Runs mitmproxy to capture device traffic transparently: --mode transparent intercepts traffic without requiring per-app proxy configuration, and -p 8080 sets the port it listens on.",
          "Routes device HTTP traffic through Burp: settings put global http_proxy sets the device's global proxy setting, and <burp_ip>:8080 is the Burp listener's address and port that traffic will be sent to.",
        ],
        expectedResponse: {
          vulnerable: "Proxied traffic capture shows requests sent over plain HTTP carrying sensitive data (credentials, tokens, PII).",
          safe: "All observed traffic uses HTTPS, with no sensitive data transmitted over unencrypted HTTP.",
        },
        severity: "high",
      },
      {
        id: "android-network-3",
        text: "Test for weak TLS configuration (accepting self-signed certs)",
        how: "Check if the app's custom TrustManager accepts any certificate, disabling real validation.",
        payloads: ["grep -rn \"checkServerTrusted\\|X509TrustManager\" out/", "openssl req -x509 -newkey rsa:2048 -keyout self.key -out self.crt -days 365 -nodes  # test cert to feed through the proxy"],
        payloadNotes: [
          "Searches decompiled code for a custom trust manager: -r recurses, -n prints line numbers, and the pattern matches either the checkServerTrusted method (where certificate validation logic lives) or the X509TrustManager interface being implemented.",
          "Generates a self-signed test certificate: -x509 produces a self-signed cert instead of a signing request, -newkey rsa:2048 creates a new 2048-bit RSA key alongside it, -keyout self.key and -out self.crt name the output key and certificate files, -days 365 sets its validity period, and -nodes leaves the private key unencrypted for easy use with the proxy.",
        ],
        expectedResponse: {
          vulnerable: "The app's checkServerTrusted() implementation accepts the self-signed test certificate without throwing, allowing MITM interception.",
          safe: "The app rejects the self-signed certificate and fails to connect, indicating proper certificate chain validation.",
        },
        severity: "critical",
      },
      {
        id: "android-network-4",
        text: "Test API endpoints called by the app the same way as web API testing",
        how: "Once traffic is intercepted, apply the same IDOR/injection/auth checks used for web/API domains to every backend call.",
        payloads: ["burp suite -> right-click traffic -> Send to Repeater/Intruder", "ffuf -u https://api.example.com/v1/user/FUZZ -H 'Authorization: Bearer <token>' -w ids.txt"],
        payloadNotes: [
          "Sends captured traffic into Burp's manual testing tools: right-clicking a request and choosing Send to Repeater/Intruder copies it for manual replay/tampering (Repeater) or automated fuzzing (Intruder).",
          "Fuzzes a user-id path segment for IDOR: -u sets the target URL with FUZZ marking the position ffuf substitutes values into, -H 'Authorization: Bearer <token>' attaches the auth token needed for the request to be accepted, and -w ids.txt supplies the wordlist of candidate id values to try.",
        ],
        expectedResponse: {
          vulnerable: "Backend API calls exhibit IDOR, injection, or broken auth just like a standard web/API target once traffic is intercepted and replayed.",
          safe: "Backend API calls enforce proper authorization and input validation, resisting the same IDOR/injection/auth test cases used for web APIs.",
        },
        severity: "high",
      },
      {
        id: "android-network-5",
        text: "Test for man-in-the-middle resilience with a rogue Wi-Fi/proxy",
        how: "Route the device through a rogue AP with an untrusted cert and confirm the app refuses to communicate.",
        payloads: ["airbase-ng -e \"Free WiFi\" -c 6 wlan0mon", "adb shell settings put global http_proxy <rogue_ap_ip>:8080"],
        payloadNotes: [
          "Stands up a rogue access point: -e \"Free WiFi\" sets the broadcast SSID to lure victims, -c 6 sets the Wi-Fi channel, and wlan0mon is the monitor-mode interface used to transmit the fake AP.",
          "Routes the device's traffic through the rogue AP's proxy: settings put global http_proxy sets the device's global proxy configuration, and <rogue_ap_ip>:8080 points it at the attacker-controlled proxy listening on the rogue network.",
        ],
        expectedResponse: {
          vulnerable: "The app transmits data over the rogue AP/untrusted proxy without complaint, confirming it can be MITM'd on hostile networks.",
          safe: "The app detects the untrusted network/certificate and refuses to send sensitive data or blocks the connection entirely.",
        },
        severity: "medium",
      },
    ],
  },
  {
    id: "android-ipc",
    reference: "https://mas.owasp.org/MASTG/0x05h-Testing-Platform-Interaction/",
    name: "IPC Security",
    emoji: "🔀",
    items: [
      {
        id: "android-ipc-1",
        text: "Test exported content providers for unauthorized data access",
        how: "Query exported ContentProvider URIs directly to check if sensitive data is accessible without permission checks.",
        payloads: ["adb shell content query --uri content://<provider>/table"],
        payloadNotes: [
          "Directly queries the exported content provider: content query invokes the ContentResolver's query command, and --uri content://<provider>/table specifies the provider's authority and table path to read from.",
        ],
        expectedResponse: {
          vulnerable: "adb shell content query returns rows of sensitive data from the exported provider without any permission being required.",
          safe: "The query is rejected with a permission/security exception, or the provider requires a caller-held permission before returning data.",
        },
        severity: "critical",
      },
      {
        id: "android-ipc-2",
        text: "Test exported content providers for SQL injection",
        how: "Fuzz the selection/sortOrder parameters of a queryable ContentProvider, which are often built via raw SQL concatenation.",
        payloads: ["adb shell content query --uri content://<provider>/table --where \"1=1) UNION SELECT * FROM sqlite_master--\"", "drozer console connect -> run scanner.provider.injection -a <package>"],
        payloadNotes: [
          "Injects a UNION-based SQL payload into the provider query: --uri targets the provider's table, and --where \"1=1) UNION SELECT * FROM sqlite_master--\" supplies a crafted selection clause that closes the original WHERE condition and appends a UNION SELECT against sqlite_master to leak the database schema.",
          "Runs Drozer's automated injection scanner: console connect attaches to the Drozer agent on the device, and run scanner.provider.injection -a <package> runs the built-in module that fuzzes all of the target package's exported content provider URIs for SQL injection.",
        ],
        expectedResponse: {
          vulnerable: "A UNION-based injection payload in the where clause returns unintended data (e.g. sqlite_master contents), confirming SQL injection.",
          safe: "The provider uses parameterized selection arguments, and the injection payload returns an error or no extra data.",
        },
        severity: "critical",
      },
      {
        id: "android-ipc-3",
        text: "Test exported services for unauthorized invocation",
        how: "Bind to exported Services directly from an adb shell or a test app to check for missing permission enforcement.",
        payloads: ["adb shell am startservice -n <package>/<service>", "drozer console connect -> run app.service.send <package> <service> --action <action>"],
        payloadNotes: [
          "Directly starts the named exported service: am startservice invokes the Activity Manager's service-start command, and -n <package>/<service> specifies the exact component to start.",
          "Sends a crafted intent to the service via Drozer: app.service.send <package> <service> targets the specific package and service component, and --action <action> sets the intent action delivered to it.",
        ],
        expectedResponse: {
          vulnerable: "adb shell am startservice successfully starts the exported service and its sensitive functionality executes with no permission check.",
          safe: "The service requires a signature-level permission or validates the caller, and the invocation is rejected with a SecurityException.",
        },
        severity: "high",
      },
      {
        id: "android-ipc-4",
        text: "Test broadcast receivers for spoofed/injected intents",
        how: "Send crafted broadcasts to exported receivers to check if they trust the intent data without validating the sender.",
        payloads: ["adb shell am broadcast -a <action> --es key value"],
        payloadNotes: [
          "Sends a crafted broadcast intent: am broadcast dispatches the broadcast, -a <action> sets the intent action string that registered receivers filter on, and --es key value adds a string extra named key with an attacker-chosen value.",
        ],
        expectedResponse: {
          vulnerable: "The exported receiver processes the crafted broadcast's extras and performs a sensitive action without verifying the sender.",
          safe: "The receiver checks the sender's identity/signature or ignores broadcasts from untrusted senders, and the crafted broadcast has no effect.",
        },
        severity: "high",
      },
      {
        id: "android-ipc-5",
        text: "Test for intent redirection / confused deputy via exported activities",
        how: "Check if an exported activity forwards received Intent extras to another sensitive component without validation.",
        payloads: ["adb shell am start -n <package>/<exported-activity> -e forward_intent 'component=com.victim/.PrivateActivity'", "drozer console connect -> run app.activity.forintent --package <package>"],
        payloadNotes: [
          "Launches the exported activity with a forwarding payload: -n <package>/<exported-activity> targets the exported entry point, and -e forward_intent 'component=com.victim/.PrivateActivity' passes a string extra whose value points at a private target component, testing whether the activity blindly forwards it.",
          "Runs Drozer's confused-deputy scanner: console connect attaches to the on-device agent, and run app.activity.forintent --package <package> runs the module that checks activities in the package for intent-forwarding vulnerabilities.",
        ],
        expectedResponse: {
          vulnerable: "The exported activity forwards the attacker-supplied component/extras to the private activity, which executes them (confused deputy).",
          safe: "The exported activity validates or strips forwarded intent data, and the private activity is not reachable via the exported one.",
        },
        severity: "high",
      },
      {
        id: "android-ipc-6",
        text: "Test PendingIntent mutability for hijacking",
        how: "Check if PendingIntents are created without FLAG_IMMUTABLE, allowing a malicious app to modify the underlying intent.",
        payloads: ["grep -rn \"PendingIntent.getActivity\\|PendingIntent.getBroadcast\" out/ | grep -v FLAG_IMMUTABLE", "frida-trace -U -f <package> -j 'android.app.PendingIntent.*'"],
        payloadNotes: [
          "Finds mutable PendingIntent creation sites: the first grep -rn matches calls to PendingIntent.getActivity or PendingIntent.getBroadcast, and piping to grep -v FLAG_IMMUTABLE filters out lines that already reference the immutability flag, leaving the likely-mutable ones.",
          "Traces PendingIntent API calls at runtime: -U selects the USB device, -f <package> spawns the app by package name, and -j 'android.app.PendingIntent.*' hooks every method on the PendingIntent class to log the flags and extras used at creation.",
        ],
        expectedResponse: {
          vulnerable: "grep finds PendingIntent.getActivity/getBroadcast calls without FLAG_IMMUTABLE, and a hijacked PendingIntent successfully executes attacker-controlled extras.",
          safe: "All PendingIntents are created with FLAG_IMMUTABLE, preventing another app from modifying the underlying intent.",
        },
        severity: "high",
      },
      {
        id: "android-ipc-7",
        text: "Test custom permission protection levels on exported components",
        how: "Review custom permissions declared by the app — if defined with protectionLevel=\"normal\" instead of \"signature\", any other app can request and use them to access protected components.",
        payloads: ["<permission android:name=\"com.victim.PERM\" android:protectionLevel=\"normal\" />", "adb shell dumpsys package <package> | grep -A2 'declared permissions'"],
        payloadNotes: [
          "Example manifest declaration of a weak custom permission: android:name=\"com.victim.PERM\" defines the permission's identifier, and android:protectionLevel=\"normal\" means it's auto-granted to any app that requests it, rather than requiring a matching signing key.",
          "Dumps the package's declared custom permissions: dumpsys package <package> prints the system's full record for the package, and piping to grep -A2 'declared permissions' shows that section header plus the next two lines listing each permission and its protection level.",
        ],
        expectedResponse: {
          vulnerable: "A custom permission is declared with protectionLevel=\"normal\", allowing any third-party app to request it and access the protected component.",
          safe: "Custom permissions are declared with protectionLevel=\"signature\", so only apps signed with the same key can be granted access.",
        },
        severity: "high",
      },
      {
        id: "android-ipc-8",
        text: "Test Parcelable/Bundle deserialization from IPC for object injection",
        how: "Check if data received via Intent extras/Bundles is deserialized (readParcelable/readSerializable) without validating the actual class, allowing a malicious app to supply an unexpected object type.",
        payloads: ["grep -rn \"getParcelableExtra\\|readSerializable\" out/", "frida-trace -U -f <package> -j 'android.content.Intent.getParcelableExtra'"],
        payloadNotes: [
          "Searches decompiled code for IPC deserialization calls: -r recurses, -n prints line numbers, and the pattern matches either getParcelableExtra (pulling a Parcelable out of an Intent) or readSerializable, both of which can skip class-type validation.",
          "Traces Intent deserialization at runtime: -U selects the USB device, -f <package> spawns the app by package name, and -j 'android.content.Intent.getParcelableExtra' hooks that specific method to log what extra keys and object types the app actually reads.",
        ],
        expectedResponse: {
          vulnerable: "getParcelableExtra/readSerializable is called without a class-type check, and supplying an unexpected object type causes a crash or unintended code execution.",
          safe: "The app validates the deserialized object's type/class before use, safely rejecting unexpected Parcelable/Serializable payloads.",
        },
        severity: "high",
      },
    ],
  },
  {
    id: "android-reverse",
    reference: "https://mas.owasp.org/MASTG/0x05j-Testing-Resiliency-Against-Reverse-Engineering/",
    name: "Reverse Engineering Protection",
    emoji: "🛡️",
    items: [
      {
        id: "android-reverse-1",
        text: "Test root detection implementation strength",
        how: "Evaluate whether root detection relies on a single easily-bypassed check (su binary presence) vs layered detection.",
        payloads: ["grep -rn \"which su\\|/system/xbin/su\\|RootBeer\" out/", "objection -g <package> explore --startup-command 'android root disable'"],
        payloadNotes: [
          "Searches decompiled code for common root-detection signals: -r recurses, -n prints line numbers, and the pattern matches a which su shell check, a hardcoded /system/xbin/su path check, or usage of the RootBeer root-detection library.",
          "Attaches Objection and disables root detection: -g <package> attaches to the running app by package name, explore opens the interactive session, and --startup-command 'android root disable' runs the built-in bypass automatically on attach.",
        ],
        expectedResponse: {
          vulnerable: "Root detection relies solely on checking for the su binary, and hooking that single check (or objection's root disable) fully bypasses detection.",
          safe: "Root detection uses multiple independent signals (su binary, build tags, Magisk artifacts, RootBeer checks) and bypassing one check still leaves the app detecting root.",
        },
        severity: "low",
      },
      {
        id: "android-reverse-2",
        text: "Test anti-tampering / integrity check bypass",
        how: "Modify the APK (resign) and check if the app detects the signature mismatch at runtime.",
        payloads: ["apktool d app.apk -o modified && apktool b modified -o repacked.apk", "keytool -genkey -v -keystore debug.keystore -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 && apksigner sign --ks debug.keystore repacked.apk"],
        payloadNotes: [
          "Decodes and rebuilds the APK: apktool d app.apk -o modified decodes the APK's resources and smali into the modified directory, and apktool b modified -o repacked.apk rebuilds it into a new (unsigned) repacked.apk.",
          "Signs the repacked APK with a different key: keytool -genkey -v -keystore debug.keystore -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 creates a fresh 2048-bit RSA keystore valid for 10000 days, and apksigner sign --ks debug.keystore repacked.apk signs the repacked APK with that new, non-original key.",
        ],
        expectedResponse: {
          vulnerable: "The resigned/repacked APK runs normally with no signature verification failure or altered behavior detected.",
          safe: "The app detects the signature mismatch at runtime (via PackageManager signature check) and refuses to run or disables sensitive features.",
        },
        severity: "medium",
      },
      {
        id: "android-reverse-3",
        text: "Test Frida/hooking framework detection",
        how: "Check if the app detects and reacts to an attached Frida server or common hooking framework artifacts.",
        payloads: ["grep -rn \"frida-server\\|gum-js-loop\\|/data/local/tmp/frida\" out/", "frida -U -f <package> -l anti-frida-detection-bypass.js --no-pause"],
        payloadNotes: [
          "Searches decompiled code for Frida-detection signals: -r recurses, -n prints line numbers, and the pattern matches references to the frida-server process name, its gum-js-loop thread name, or its common /data/local/tmp/frida install path.",
          "Launches the app under Frida while hiding its own artifacts: -U selects the USB device, -f <package> spawns the app by package name, -l anti-frida-detection-bypass.js loads a script that masks common Frida detection signals, and --no-pause resumes execution immediately.",
        ],
        expectedResponse: {
          vulnerable: "The app runs normally with Frida attached, with no crash, warning, or behavioral change indicating hooking framework detection.",
          safe: "The app detects frida-server/gum-js-loop artifacts and terminates, blocks functionality, or alerts, even after the provided bypass script runs.",
        },
        severity: "low",
      },
      {
        id: "android-reverse-4",
        text: "Test emulator detection bypass",
        how: "Run the app on an emulator and check if detection can be trivially bypassed to access emulator-restricted functionality.",
        payloads: ["grep -rn \"Build.FINGERPRINT.*generic\\|goldfish\\|ro.kernel.qemu\" out/", "frida -U -f <package> -l emulator-detection-bypass.js --no-pause"],
        payloadNotes: [
          "Searches decompiled code for emulator fingerprint checks: -r recurses, -n prints line numbers, and the pattern matches a Build.FINGERPRINT value containing generic, references to the goldfish emulator hardware name, or the ro.kernel.qemu system property.",
          "Launches the app under Frida while spoofing emulator signals: -U selects the USB device, -f <package> spawns the app by package name, -l emulator-detection-bypass.js loads the script that fakes device-like fingerprint/property values, and --no-pause resumes execution immediately.",
        ],
        expectedResponse: {
          vulnerable: "The app grants access to emulator-restricted functionality (e.g. payments, promotions) once the build fingerprint/qemu bypass is applied.",
          safe: "The app continues to restrict emulator-only functionality even after the bypass script runs, indicating layered emulator checks.",
        },
        severity: "low",
      },
      {
        id: "android-reverse-5",
        text: "Test native library (.so) protection against static analysis",
        how: "Check if native libraries use packing/obfuscation, or if critical logic in native code is trivially readable via a disassembler.",
        payloads: ["file lib/arm64-v8a/*.so && strings lib/arm64-v8a/libnative.so | grep -i key", "objdump -d lib/arm64-v8a/libnative.so | less"],
        payloadNotes: [
          "Identifies and extracts strings from the native library: file reports the binary's file type for every .so under lib/arm64-v8a/, and strings libnative.so | grep -i key extracts printable text from the library and case-insensitively filters for key-related terms.",
          "Disassembles the native library: objdump -d decodes the machine code sections into assembly instructions for lib/arm64-v8a/libnative.so, piped to less for paging through the output.",
        ],
        expectedResponse: {
          vulnerable: "Native library strings contain readable key material or logic, and objdump reveals unobfuscated function-level disassembly of critical logic.",
          safe: "Native libraries are packed/obfuscated or use control-flow flattening, and objdump/strings reveal no directly usable secrets or logic.",
        },
        severity: "medium",
      },
    ],
  },
];
