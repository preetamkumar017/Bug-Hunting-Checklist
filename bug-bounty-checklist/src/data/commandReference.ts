/** Man-page-style quick reference for CLI tools used across payloads. Shown in the CommandHelpModal. */
export interface CommandFlag {
  flag: string;
  desc: string;
}

export interface CommandRef {
  summary: string;
  flags: CommandFlag[];
}

export const commandReference: Record<string, CommandRef> = {
  curl: {
    summary: "Transfers data to/from a URL — the default HTTP client for manual request crafting.",
    flags: [
      { flag: "-X <method>", desc: "HTTP method to use (GET, POST, PUT, DELETE, ...)." },
      { flag: "-H <header>", desc: "Add a custom request header. Repeatable." },
      { flag: "-d / --data <data>", desc: "Send data in the request body (implies POST)." },
      { flag: "-b <cookie>", desc: "Send a cookie (name=value or a cookie-jar file)." },
      { flag: "-c <file>", desc: "Save response cookies to a cookie-jar file." },
      { flag: "-i", desc: "Include response headers in the output." },
      { flag: "-s", desc: "Silent mode — hide progress meter and errors." },
      { flag: "-k / --insecure", desc: "Skip TLS certificate verification." },
      { flag: "-L", desc: "Follow HTTP redirects." },
      { flag: "-o <file>", desc: "Write response body to a file instead of stdout." },
    ],
  },
  grep: {
    summary: "Searches text for lines matching a pattern.",
    flags: [
      { flag: "-i", desc: "Case-insensitive match." },
      { flag: "-E", desc: "Use extended regular expressions." },
      { flag: "-R / -r", desc: "Recurse into directories." },
      { flag: "-n", desc: "Show line numbers of matches." },
      { flag: "-l", desc: "Only print names of matching files." },
      { flag: "-v", desc: "Invert match — show non-matching lines." },
      { flag: "-a", desc: "Treat binary files as text." },
    ],
  },
  adb: {
    summary: "Android Debug Bridge — communicates with a connected device/emulator.",
    flags: [
      { flag: "shell <cmd>", desc: "Run a shell command on the device." },
      { flag: "install <apk>", desc: "Install an APK onto the device." },
      { flag: "pull <remote> <local>", desc: "Copy a file from device to host." },
      { flag: "push <local> <remote>", desc: "Copy a file from host to device." },
      { flag: "logcat", desc: "Stream the device's system/app log." },
      { flag: "am start -n <pkg>/<activity>", desc: "Launch a specific activity via the Activity Manager." },
      { flag: "am start -a <action> -d <uri>", desc: "Send an implicit intent with an action and data URI." },
    ],
  },
  frida: {
    summary: "Dynamic instrumentation toolkit for hooking functions at runtime.",
    flags: [
      { flag: "-U", desc: "Target a USB-connected device." },
      { flag: "-g <process>", desc: "Attach by process/app name (gadget)." },
      { flag: "-f <target>", desc: "Spawn and instrument the target from launch." },
      { flag: "-l <script.js>", desc: "Load a JavaScript hook script." },
      { flag: "--no-pause", desc: "Don't pause the spawned process before resuming." },
    ],
  },
  "frida-trace": {
    summary: "Auto-generates and runs Frida trace stubs for matched functions.",
    flags: [
      { flag: "-U", desc: "Target a USB-connected device." },
      { flag: "-i <symbol>", desc: "Trace a native function by name/glob." },
      { flag: "-m <method>", desc: "Trace an Objective-C/Java method by class/selector pattern." },
      { flag: "-f <target>", desc: "Spawn the target app and trace from launch." },
    ],
  },
  objection: {
    summary: "Runtime mobile exploration toolkit built on Frida (no jailbreak/root required for many features).",
    flags: [
      { flag: "-g <target>", desc: "Attach to an app by bundle id / package name / gadget." },
      { flag: "explore", desc: "Enter the interactive objection REPL." },
      { flag: "ios sslpinning disable", desc: "Attempt to bypass common iOS SSL pinning implementations." },
      { flag: "android sslpinning disable", desc: "Attempt to bypass common Android SSL pinning implementations." },
      { flag: "ios keychain dump", desc: "Dump Keychain contents accessible to the app." },
    ],
  },
  ffuf: {
    summary: "Fast web fuzzer for directories, parameters, and virtual hosts.",
    flags: [
      { flag: "-u <url>", desc: "Target URL; use FUZZ as the injection placeholder." },
      { flag: "-w <wordlist>", desc: "Wordlist to fuzz with." },
      { flag: "-X <method>", desc: "HTTP method to use." },
      { flag: "-d <data>", desc: "POST body data (with FUZZ placeholder)." },
      { flag: "-H <header>", desc: "Add a custom header." },
      { flag: "-fc / -fs <n>", desc: "Filter out responses by status code / size." },
      { flag: "-mc <n>", desc: "Match only responses with this status code." },
    ],
  },
  dig: {
    summary: "DNS lookup utility.",
    flags: [
      { flag: "<domain> <type>", desc: "Query a domain for a specific record type (A, TXT, MX, ANY, AXFR...)." },
      { flag: "@<server>", desc: "Query a specific DNS server directly." },
      { flag: "+short", desc: "Print only the essential answer." },
      { flag: "axfr", desc: "Attempt a full zone transfer (record type)." },
    ],
  },
  jwt_tool: {
    summary: "Toolkit for testing, tampering, and cracking JSON Web Tokens.",
    flags: [
      { flag: "-t <url>", desc: "Target URL to send the modified token to." },
      { flag: "-M <mode>", desc: "Attack mode, e.g. 'alg' for algorithm-confusion/none attacks." },
      { flag: "-S <alg>", desc: "Sign the token with a given algorithm (hs256, rs256, none...)." },
      { flag: "-p <secret>", desc: "Secret/key to sign or crack with." },
      { flag: "-C", desc: "Crack mode: brute-force the HMAC secret against a wordlist." },
    ],
  },
  python3: {
    summary: "Runs a Python 3 script or one-liner — used here for quick exploit/PoC scripts.",
    flags: [
      { flag: "-c '<code>'", desc: "Execute an inline snippet of Python code." },
      { flag: "<script.py>", desc: "Run a Python script file." },
    ],
  },
  mitmproxy: {
    summary: "Interactive HTTPS-capable intercepting proxy for inspecting/modifying traffic.",
    flags: [
      { flag: "-p <port>", desc: "Port to listen on." },
      { flag: "-s <script.py>", desc: "Load an addon script to modify flows programmatically." },
      { flag: "--mode transparent", desc: "Run as a transparent proxy (no client proxy config needed)." },
      { flag: "-w <file>", desc: "Save captured flows to a file." },
    ],
  },
  grpcurl: {
    summary: "curl-like tool for interacting with gRPC servers.",
    flags: [
      { flag: "-plaintext", desc: "Use plaintext (no TLS) for the connection." },
      { flag: "-d '<json>'", desc: "JSON request payload to send." },
      { flag: "<host:port>", desc: "Target gRPC server address." },
      { flag: "<service.Method>", desc: "Fully-qualified RPC method to call." },
      { flag: "list", desc: "List available services (if server reflection is enabled)." },
    ],
  },
  forge: {
    summary: "Foundry's build/test tool for Solidity smart contracts.",
    flags: [
      { flag: "test", desc: "Run the project's Solidity test suite." },
      { flag: "-vvvv", desc: "Maximum verbosity, including full execution traces." },
      { flag: "--match-test <name>", desc: "Run only tests matching a name pattern." },
      { flag: "script <file>", desc: "Run a Forge deployment/exploit script." },
    ],
  },
  cast: {
    summary: "Foundry's Swiss-army-knife CLI for reading/sending on-chain transactions and calls.",
    flags: [
      { flag: "call <addr> <sig>", desc: "Make a read-only (view) call to a contract function." },
      { flag: "send <addr> <sig>", desc: "Send a state-changing transaction to a contract." },
      { flag: "--rpc-url <url>", desc: "RPC endpoint to send the request to." },
      { flag: "--private-key <key>", desc: "Private key to sign the transaction with." },
      { flag: "storage <addr> <slot>", desc: "Read a raw storage slot from a contract." },
    ],
  },
  openssl: {
    summary: "Swiss-army-knife for TLS/crypto — certificate inspection, manual TLS handshakes, hashing.",
    flags: [
      { flag: "s_client -connect <host:port>", desc: "Open a manual TLS connection to inspect the handshake/cert." },
      { flag: "-servername <name>", desc: "Set SNI hostname for the TLS handshake." },
      { flag: "x509 -text", desc: "Print a certificate's fields in human-readable form." },
      { flag: "enc -d", desc: "Decrypt data with a specified cipher." },
    ],
  },
  wscat: {
    summary: "Simple CLI WebSocket client for connecting to and messaging a WebSocket endpoint.",
    flags: [
      { flag: "-c <url>", desc: "Connect to a WebSocket URL (ws:// or wss://)." },
      { flag: "-H <header>", desc: "Add a custom header to the handshake request." },
    ],
  },
  slither: {
    summary: "Static analysis framework for Solidity — flags common vulnerability patterns.",
    flags: [
      { flag: "<path>", desc: "Path to the contract/project to analyze." },
      { flag: "--detect <name>", desc: "Run only a specific detector." },
      { flag: "--print human-summary", desc: "Print a high-level human-readable summary." },
    ],
  },
  java: {
    summary: "Runs a compiled Java class or JAR.",
    flags: [
      { flag: "-jar <file.jar>", desc: "Run an executable JAR file." },
      { flag: "-cp <classpath>", desc: "Set the classpath for dependencies." },
    ],
  },
  aws: {
    summary: "AWS CLI — interacts with AWS services from the command line.",
    flags: [
      { flag: "s3 ls <bucket>", desc: "List objects in an S3 bucket." },
      { flag: "sts get-caller-identity", desc: "Show which AWS identity the current credentials belong to." },
      { flag: "--profile <name>", desc: "Use a named credentials profile." },
      { flag: "--no-sign-request", desc: "Make an unauthenticated (anonymous) request." },
    ],
  },
  drozer: {
    summary: "Android security assessment framework for probing IPC (activities, services, providers, receivers).",
    flags: [
      { flag: "console connect", desc: "Connect to the drozer agent on the device." },
      { flag: "run app.package.info -a <pkg>", desc: "Show info about an installed package." },
      { flag: "run app.activity.start", desc: "Launch an exported activity." },
      { flag: "run app.provider.query <uri>", desc: "Query a content provider URI." },
    ],
  },
  strings: {
    summary: "Extracts printable text sequences from a binary file.",
    flags: [
      { flag: "-a", desc: "Scan the entire file, not just loaded/initialized sections." },
      { flag: "-n <len>", desc: "Minimum sequence length to print." },
    ],
  },
  nmap: {
    summary: "Network scanner for discovering hosts, ports, and services.",
    flags: [
      { flag: "-p-", desc: "Scan all 65535 TCP ports." },
      { flag: "-sS", desc: "TCP SYN (stealth) scan." },
      { flag: "-sV", desc: "Probe open ports to determine service/version info." },
      { flag: "-T4", desc: "Timing template — faster scan speed." },
      { flag: "-A", desc: "Enable OS detection, version detection, script scanning, traceroute." },
      { flag: "--script <name>", desc: "Run a specific NSE script." },
    ],
  },
  katana: {
    summary: "Fast web crawler for discovering endpoints/URLs.",
    flags: [
      { flag: "-u <url>", desc: "Target URL to crawl." },
      { flag: "-jc", desc: "Also crawl and parse JavaScript files for endpoints." },
      { flag: "-d <depth>", desc: "Maximum crawl depth." },
    ],
  },
  jadx: {
    summary: "Decompiles Android DEX/APK bytecode back into readable Java source.",
    flags: [
      { flag: "-d <output>", desc: "Output directory for decompiled sources." },
      { flag: "<app.apk>", desc: "APK file to decompile." },
    ],
  },
  "jadx-gui": {
    summary: "GUI version of jadx for interactively browsing decompiled Android source.",
    flags: [{ flag: "<app.apk>", desc: "Open the APK's decompiled source in the GUI." }],
  },
  apktool: {
    summary: "Decodes/rebuilds Android APK resources and smali bytecode.",
    flags: [
      { flag: "d <app.apk>", desc: "Decode (unpack) an APK to smali + resources." },
      { flag: "b <folder>", desc: "Rebuild an APK from a decoded folder." },
    ],
  },
  apkanalyzer: {
    summary: "Android SDK tool for inspecting APK contents (manifest, DEX, resources).",
    flags: [{ flag: "manifest print <apk>", desc: "Print the decoded AndroidManifest.xml." }],
  },
  unzip: {
    summary: "Extracts files from a ZIP archive (IPA/APK/JAR files are ZIP archives).",
    flags: [
      { flag: "-o", desc: "Overwrite existing files without prompting." },
      { flag: "-d <dir>", desc: "Extract into a specific destination directory." },
      { flag: "-l", desc: "List archive contents without extracting." },
    ],
  },
  "class-dump": {
    summary: "Generates Objective-C class/method declarations from a compiled Mach-O binary.",
    flags: [{ flag: "<binary>", desc: "Path to the Mach-O binary to dump class info from." }],
  },
  plutil: {
    summary: "Reads/converts/validates macOS/iOS property list (plist) files.",
    flags: [
      { flag: "-convert xml1", desc: "Convert the plist to human-readable XML format." },
      { flag: "-o -", desc: "Write output to stdout instead of a file." },
      { flag: "-p", desc: "Print the plist in a readable outline format." },
    ],
  },
  PlistBuddy: {
    summary: "Reads/edits individual keys inside a plist file.",
    flags: [
      { flag: "-c 'Print <key>'", desc: "Print the value of a specific plist key/path." },
      { flag: "<file.plist>", desc: "Plist file to operate on." },
    ],
  },
  codesign: {
    summary: "Inspects or applies code-signing signatures on macOS/iOS binaries.",
    flags: [
      { flag: "-d --entitlements -", desc: "Dump the binary's entitlements to stdout." },
      { flag: "-f -s <identity>", desc: "Force re-sign the binary with a given signing identity." },
      { flag: "-v", desc: "Verify an existing signature." },
    ],
  },
  ldid: {
    summary: "Cross-platform tool for (fake-)signing and inspecting Mach-O binaries/entitlements (common on jailbroken iOS).",
    flags: [
      { flag: "-e <binary>", desc: "Print the binary's embedded entitlements." },
      { flag: "-S <binary>", desc: "Ad-hoc (fake) sign the binary." },
    ],
  },
  otool: {
    summary: "Displays information from Mach-O object files (headers, linked libraries, disassembly).",
    flags: [
      { flag: "-hv <binary>", desc: "Print the Mach-O header flags (e.g. PIE) in verbose form." },
      { flag: "-L <binary>", desc: "List the dynamic libraries the binary links against." },
      { flag: "-Iv <binary>", desc: "List indirect symbols/imports." },
    ],
  },
  sqlite3: {
    summary: "Command-line shell for SQLite database files (used by many mobile app local stores).",
    flags: [
      { flag: "<file.db>", desc: "Open a SQLite database file." },
      { flag: "'.tables'", desc: "List all tables in the database." },
      { flag: "'SELECT * FROM <table>;'", desc: "Query a table's contents." },
    ],
  },
  tcpdump: {
    summary: "Captures and displays raw network packets from an interface.",
    flags: [
      { flag: "-i <iface>", desc: "Interface to capture on." },
      { flag: "-w <file>", desc: "Write captured packets to a pcap file." },
      { flag: "port <n>", desc: "Filter capture to a specific port." },
    ],
  },
  "procmon.exe": {
    summary: "Sysinternals Process Monitor — logs file system, registry, and process/thread activity in real time.",
    flags: [
      { flag: "/AcceptEula", desc: "Skip the license agreement prompt." },
      { flag: "/Quiet", desc: "Suppress the UI while running." },
      { flag: "/Minimized", desc: "Start minimized to the tray." },
      { flag: "/BackingFile <path>", desc: "Write the captured trace to a specific log file." },
    ],
  },
  dumpbin: {
    summary: "MSVC tool for inspecting the contents of Windows binaries (PE headers, imports/exports).",
    flags: [
      { flag: "/imports <file>", desc: "List the binary's imported functions/DLLs." },
      { flag: "/exports <file>", desc: "List the binary's exported functions." },
    ],
  },
  "jd-gui": {
    summary: "GUI Java decompiler for browsing .class/.jar source.",
    flags: [{ flag: "<file.jar>", desc: "Open a JAR file for decompiled viewing." }],
  },
  findstr: {
    summary: "Windows built-in text search utility (similar to grep).",
    flags: [
      { flag: "/S", desc: "Search subdirectories recursively." },
      { flag: "/I", desc: "Case-insensitive search." },
      { flag: "/M", desc: "Print only filenames with matches." },
    ],
  },
  icacls: {
    summary: "Displays/modifies Windows file and folder ACLs (access control lists).",
    flags: [{ flag: "<path>", desc: "Show effective permissions on a file or folder." }],
  },
  reg: {
    summary: "Windows built-in tool for querying/editing the registry from the command line.",
    flags: [
      { flag: "query <key>", desc: "Read a registry key's values." },
      { flag: "add <key>", desc: "Create/modify a registry key or value." },
    ],
  },
  "accesschk64.exe": {
    summary: "Sysinternals tool for checking effective access rights on files, services, and registry keys.",
    flags: [
      { flag: "-w", desc: "Show only objects with write access." },
      { flag: "-u", desc: "Suppress error output." },
      { flag: "<user/group>", desc: "Account whose access is being checked." },
    ],
  },
  xcrun: {
    summary: "Locates and runs Xcode developer tools (e.g. simctl) by name.",
    flags: [{ flag: "simctl <cmd>", desc: "Control the iOS Simulator (open URLs, install apps, screenshots)." }],
  },
  sqlmap: {
    summary: "Automated SQL injection detection and exploitation tool.",
    flags: [
      { flag: "-u <url>", desc: "Target URL (with an injectable parameter)." },
      { flag: "--data <body>", desc: "POST body data to test for injection." },
      { flag: "--dbs", desc: "Enumerate available databases once injection is confirmed." },
      { flag: "--batch", desc: "Run non-interactively, accepting default answers." },
    ],
  },
  npx: {
    summary: "Runs an npm package's CLI without installing it globally.",
    flags: [{ flag: "<package> [args]", desc: "Fetch and execute the given npm package's binary." }],
  },
  semgrep: {
    summary: "Static analysis tool that matches source code against security rule patterns.",
    flags: [
      { flag: "--config <ruleset>", desc: "Ruleset to run (a named registry set or a local rule file)." },
      { flag: "--json -o <file>", desc: "Write findings as JSON to a file." },
    ],
  },
  hashcat: {
    summary: "GPU-accelerated password/hash cracking tool.",
    flags: [
      { flag: "-m <mode>", desc: "Hash type to crack (e.g. 0=MD5, 1000=NTLM)." },
      { flag: "-a <mode>", desc: "Attack mode (0=wordlist, 3=brute-force mask...)." },
      { flag: "<hashfile> <wordlist>", desc: "Hashes to crack and the wordlist/mask to try." },
    ],
  },
  shodan: {
    summary: "CLI for the Shodan internet-wide device/service search engine.",
    flags: [{ flag: "search '<query>'", desc: "Search Shodan's index with a query/filter string." }],
  },
  x64dbg: {
    summary: "Open-source user-mode debugger for Windows binaries.",
    flags: [{ flag: "<binary>", desc: "Load a binary for interactive debugging/breakpoints." }],
  },
  dnSpy: {
    summary: ".NET assembly editor/decompiler/debugger.",
    flags: [{ flag: "<assembly.dll/.exe>", desc: "Open a .NET assembly for decompiling or live editing." }],
  },
  ilspycmd: {
    summary: "Command-line .NET decompiler (ILSpy).",
    flags: [{ flag: "<assembly.dll>", desc: "Decompile a .NET assembly to C# source." }],
  },
  idevicebackup2: {
    summary: "libimobiledevice tool for creating/restoring iOS device backups over USB.",
    flags: [{ flag: "backup <dir>", desc: "Create an unencrypted (or encrypted, per device setting) backup to a directory." }],
  },
  idevicesyslog: {
    summary: "libimobiledevice tool that streams an iOS device's syslog over USB.",
    flags: [],
  },
  ysoserial: {
    summary: "Generates payloads that exploit unsafe Java deserialization via known gadget chains.",
    flags: [
      { flag: "<gadget-chain>", desc: "Name of the gadget chain to use (e.g. CommonsCollections5)." },
      { flag: "'<command>'", desc: "OS command the payload should execute upon deserialization." },
    ],
  },
  "ysoserial.net": {
    summary: ".NET port of ysoserial — generates payloads exploiting unsafe .NET deserialization.",
    flags: [
      { flag: "-g <gadget>", desc: "Gadget chain to use." },
      { flag: "-f <formatter>", desc: "Serialization formatter to target (e.g. BinaryFormatter)." },
      { flag: "-o <encoding>", desc: "Output encoding (raw, base64...)." },
      { flag: "-c '<command>'", desc: "Command the payload executes on deserialization." },
    ],
  },
  phpggc: {
    summary: "Library of PHP unserialize() gadget chains for generating deserialization exploit payloads.",
    flags: [{ flag: "<gadget-chain> <command>", desc: "Gadget chain name and the command/action it should trigger." }],
  },
  subfinder: {
    summary: "Passive subdomain enumeration tool using many OSINT sources.",
    flags: [
      { flag: "-d <domain>", desc: "Target root domain." },
      { flag: "-all", desc: "Query all configured sources (not just the fast ones)." },
      { flag: "-o <file>", desc: "Write results to a file." },
    ],
  },
  puredns: {
    summary: "Fast DNS resolver/bruteforcer built for large-scale subdomain resolution.",
    flags: [
      { flag: "bruteforce <wordlist> <domain>", desc: "Bruteforce subdomains of a domain using a wordlist." },
      { flag: "-r <resolvers>", desc: "File of resolver IPs to use." },
    ],
  },
  alterx: {
    summary: "Generates subdomain permutations/mutations from a known subdomain list.",
    flags: [{ flag: "-l <file>", desc: "Input file of known subdomains to mutate." }],
  },
  subzy: {
    summary: "Checks a list of subdomains for subdomain takeover vulnerabilities.",
    flags: [{ flag: "run --targets <file>", desc: "Check each subdomain in the file against known takeover fingerprints." }],
  },
  amass: {
    summary: "In-depth attack-surface mapping and subdomain enumeration tool.",
    flags: [
      { flag: "enum -d <domain>", desc: "Enumerate subdomains for a target domain." },
      { flag: "-passive", desc: "Use only passive data sources (no direct target contact)." },
    ],
  },
  httpx: {
    summary: "Fast HTTP probe that checks which hosts are alive and fingerprints them.",
    flags: [
      { flag: "-l <file>", desc: "File of hosts/subdomains to probe." },
      { flag: "-silent", desc: "Suppress banner/progress output." },
      { flag: "-status-code", desc: "Print each response's HTTP status code." },
      { flag: "-title", desc: "Print each page's HTML title." },
    ],
  },
  nuclei: {
    summary: "Template-based vulnerability scanner.",
    flags: [
      { flag: "-l <file>", desc: "File of target URLs to scan." },
      { flag: "-t <templates>", desc: "Specific template(s)/category to run." },
      { flag: "-silent", desc: "Suppress banner output." },
    ],
  },
  "redis-cli": {
    summary: "Command-line client for a Redis server.",
    flags: [
      { flag: "-h <host> -p <port>", desc: "Redis server host and port to connect to." },
      { flag: "INFO", desc: "Return server information/statistics (Redis command)." },
    ],
  },
  mysql: {
    summary: "Command-line client for a MySQL/MariaDB server.",
    flags: [
      { flag: "-h <host> -u <user> -p", desc: "Connect to a host as a user, prompting for password." },
    ],
  },
  psql: {
    summary: "Command-line client for a PostgreSQL server.",
    flags: [{ flag: "-h <host> -U <user> -d <db>", desc: "Connect to a specific host/user/database." }],
  },
  mongo: {
    summary: "Command-line shell for a MongoDB server.",
    flags: [{ flag: "<host>:<port>", desc: "Connect to a MongoDB instance at the given address." }],
  },
  wappalyzer: {
    summary: "Fingerprints the technology stack (frameworks, CMS, libraries) a website uses.",
    flags: [],
  },
  whatweb: {
    summary: "Web technology fingerprinting scanner.",
    flags: [{ flag: "<url>", desc: "Target site to fingerprint." }],
  },
  wafw00f: {
    summary: "Detects and identifies which WAF (if any) is protecting a website.",
    flags: [{ flag: "<url>", desc: "Target site to probe for a WAF signature." }],
  },
  retire: {
    summary: "Scans JavaScript files/libraries for known vulnerable versions.",
    flags: [],
  },
  gau: {
    summary: "\"Get All URLs\" — fetches known URLs for a domain from sources like the Wayback Machine, OTX, and Common Crawl.",
    flags: [{ flag: "<domain>", desc: "Domain to fetch historical/known URLs for." }],
  },
  arjun: {
    summary: "Discovers hidden HTTP GET/POST parameters on an endpoint by fuzzing common parameter names.",
    flags: [{ flag: "-u <url>", desc: "Target endpoint to discover parameters on." }],
  },
  truffleHog: {
    summary: "Scans a git repository's history for accidentally committed secrets/credentials.",
    flags: [{ flag: "<repo>", desc: "Repository path or URL to scan." }],
  },
  gitleaks: {
    summary: "Scans git repositories or filesystems for hardcoded secrets.",
    flags: [{ flag: "detect", desc: "Run a secret-detection scan." }],
  },
  censys: {
    summary: "CLI for the Censys internet-wide host/certificate search engine.",
    flags: [{ flag: "search '<query>'", desc: "Search Censys's index with a query string." }],
  },
  "testssl.sh": {
    summary: "Checks a server's TLS/SSL configuration for weak ciphers, protocols, and known vulnerabilities.",
    flags: [{ flag: "<host:port>", desc: "Target server to test." }],
  },
  wget: {
    summary: "Non-interactive command-line file/HTTP downloader.",
    flags: [
      { flag: "-q", desc: "Quiet mode — suppress output." },
      { flag: "-O <file>", desc: "Save output to a specific filename." },
    ],
  },
  docker: {
    summary: "Builds/runs containers — used here to spin up a local lab/target instance.",
    flags: [
      { flag: "run <image>", desc: "Start a new container from an image." },
      { flag: "-p <host:container>", desc: "Map a host port to a container port." },
    ],
  },
  wireshark: {
    summary: "GUI network protocol analyzer for inspecting captured traffic.",
    flags: [],
  },
  tshark: {
    summary: "Command-line version of Wireshark for capturing/filtering packets.",
    flags: [{ flag: "-i <iface>", desc: "Interface to capture on." }],
  },
  nc: {
    summary: "Netcat — reads/writes raw data over TCP/UDP connections; useful for manual protocol probing.",
    flags: [
      { flag: "-l", desc: "Listen mode (act as a server)." },
      { flag: "-v", desc: "Verbose output." },
      { flag: "<host> <port>", desc: "Connect to a host and port." },
    ],
  },
  keytool: {
    summary: "Java's key/certificate management CLI (manages Java KeyStore files).",
    flags: [{ flag: "-list -keystore <file>", desc: "List the entries in a keystore file." }],
  },
  objdump: {
    summary: "Displays information from object/executable files (disassembly, headers, symbols).",
    flags: [{ flag: "-d <binary>", desc: "Disassemble the binary's executable sections." }],
  },
  nm: {
    summary: "Lists symbols (functions/variables) from an object or binary file.",
    flags: [{ flag: "<binary>", desc: "Binary to list symbols from." }],
  },
  checksec: {
    summary: "Checks which binary-hardening protections (PIE, NX, RELRO, stack canaries) are enabled on a binary.",
    flags: [{ flag: "--file=<binary>", desc: "Binary to inspect for security mitigations." }],
  },
  "winchecksec.exe": {
    summary: "Windows equivalent of checksec — reports PE binary-hardening mitigations (ASLR, DEP, CFG, etc.).",
    flags: [{ flag: "<binary>", desc: "Binary to inspect for security mitigations." }],
  },
  netsh: {
    summary: "Windows built-in network configuration CLI.",
    flags: [{ flag: "advfirewall", desc: "Configure/inspect the Windows firewall." }],
  },
  schtasks: {
    summary: "Windows built-in scheduled-task management CLI — often abused for persistence.",
    flags: [{ flag: "/query", desc: "List scheduled tasks." }],
  },
  crontab: {
    summary: "Manages scheduled cron jobs on Unix-like systems.",
    flags: [{ flag: "-l", desc: "List the current user's cron jobs." }],
  },
  wmic: {
    summary: "Windows Management Instrumentation command-line tool for querying system info.",
    flags: [],
  },
  sc: {
    summary: "Windows Service Control command-line tool.",
    flags: [{ flag: "qc <service>", desc: "Query a service's configuration, including its binary path." }],
  },
  whois: {
    summary: "Looks up domain/IP registration ownership records.",
    flags: [{ flag: "<domain>", desc: "Domain or IP to look up." }],
  },
  delv: {
    summary: "DNSSEC-validating lookup tool (similar to dig, but validates the chain of trust).",
    flags: [{ flag: "<domain>", desc: "Domain to validate/resolve." }],
  },
  swaks: {
    summary: "\"Swiss Army Knife for SMTP\" — crafts and sends arbitrary test emails/SMTP sessions.",
    flags: [
      { flag: "--to <addr>", desc: "Recipient address." },
      { flag: "--from <addr>", desc: "Sender address to test spoofing/SPF-DKIM-DMARC behavior." },
      { flag: "--server <host>", desc: "Target mail server." },
    ],
  },
};
