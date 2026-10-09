import type { ChecklistCategory } from "../types/checklist";
import { applyContentReview } from "../lib/contentReview";

export const socForensicsCategories: ChecklistCategory[] = [
  {
    id: "soc-event-logs",
    name: "Windows Event Logs & Sysmon Threat Hunting",
    emoji: "📜",
    description: "Event ID analysis for logon anomalies, process creation, service persistence, and privilege abuse.",
    reference: "https://attack.mitre.org/techniques/enterprise/",
    items: [
      {
        id: "soc-log-1",
        text: "Logon Anomalies & Lateral Movement Hunting (Event ID 4624 & 4625)",
        how: "Filter Windows Security Event Log for abnormal logon types, multiple failed logons followed by success, and high-privilege network logons.",
        payloads: [
          "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4624} | Where-Object {$_.Properties[8].Value -in 3, 10}",
          "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625} | Select-Object -First 50",
          "LogParser.exe \"SELECT TimeGenerated, SourceName, Message FROM Security WHERE EventID=4625\""
        ],
        payloadNotes: [
          "Event ID 4624: Successful logon. Properties[8] contains LogonType: Type 3 (Network logon / SMB / PsExec), Type 10 (RemoteInteractive / RDP), Type 9 (NewCredentials / Overpass-the-hash).",
          "Event ID 4625: Failed logon attempt. Spikes indicate password spraying or brute force attacks.",
          "High-volume Type 3 logons from an unexpected workstation IP indicate lateral movement via WMI, WinRM, or SMB."
        ],
        expectedResponse: {
          vulnerable: "Unusual off-hours RDP (Type 10) logons from external IPs, or anomalous Type 3 logons using privileged domain admin credentials across multiple endpoints.",
          safe: "Network logons are audited, tiering models prevent privileged accounts from logging into user workstations, and failed logon thresholds trigger automated lockout/alerts."
        },
        severity: "high"
      },
      {
        id: "soc-log-2",
        text: "Suspicious Process Creation & CLI Auditing (Event ID 4688 / Sysmon 1)",
        how: "Audit process execution logs for Living-off-the-Land (LotL) binaries, encoded PowerShell commands, and credential dumping tools.",
        payloads: [
          "Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; Id=1} | Where-Object {$_.Message -match '-enc|-encodedcommand|whoami|vssadmin|mimikatz'}",
          "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4688} | Where-Object {$_.Properties[5].Value -match 'powershell.exe|cmd.exe|certutil.exe|rundll32.exe'}"
        ],
        payloadNotes: [
          "Sysmon Event 1 records process creation; inspect named fields and configured hashes. Encoded arguments are also used by legitimate software and need corroboration.",
          "Security 4688 process candidates: parse named XML fields for the actual schema and correlate identity, parent process, command line and independent artifacts."
        ],
        expectedResponse: {
          vulnerable: "Processes spawn from web servers, office applications, or run encoded scripts with no logging or alerts triggered.",
          safe: "Command line process creation auditing is enabled, Sysmon logs are forwarded to SIEM, and suspicious parent-child trees generate high-priority SOC alerts."
        },
        severity: "critical"
      },
      {
        id: "soc-log-3",
        text: "Service & Scheduled Task Persistence Detection (Event ID 7045 & 4698)",
        how: "Monitor System and Security logs for newly created Windows services and scheduled tasks used for long-term persistence.",
        payloads: [
          "Get-WinEvent -FilterHashtable @{LogName='System'; Id=7045} | Select-Object TimeCreated, @{n='ServiceName';e={$_.Properties[0].Value}}, @{n='ImagePath';e={$_.Properties[1].Value}}",
          "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4698}"
        ],
        payloadNotes: [
          "7045 records service installation, not necessarily execution. Inspect image path, creator context and matching process/start artifacts against legitimate change records.",
          "4698 records task creation; inspect action/principal and correlate a run/process event before claiming execution. User-writable paths are leads, not proof of maliciousness."
        ],
        expectedResponse: {
          vulnerable: "Services or scheduled tasks execute binaries from temporary or user-writable directories without security review.",
          safe: "Service installations are restricted to administrative change windows, and new service events are correlated and alerted in real-time."
        },
        severity: "high"
      }
    ]
  },
  {
    id: "soc-pcap-traffic",
    name: "Network Traffic Analysis & PCAP Threat Hunting",
    emoji: "📡",
    description: "C2 beaconing detection, DNS tunneling, cleartext credential leaks, and protocol inspection.",
    reference: "https://www.wireshark.org/docs/dfref/",
    items: [
      {
        id: "soc-net-1",
        text: "Command & Control (C2) Beaconing & Jitter Detection",
        how: "Inspect PCAP captures for regular, periodic outbound HTTP/HTTPS or DNS requests indicative of automated malware callback beacons.",
        payloads: [
          "tshark -r capture.pcap -Y \"http.request\" -T fields -e frame.time_epoch -e ip.dst -e http.host -e http.request.uri",
          "zeek -r capture.pcap (inspect conn.log and http.log for repetitive duration/interval patterns)",
          "NetworkMiner capture.pcap"
        ],
        payloadNotes: [
          "Beaconing pattern: C2 agents (Cobalt Strike, Sliver, Mythic) call home at configured intervals (e.g. every 60s with 10% jitter).",
          "Delta time analysis: Calculating time differences between consecutive requests to the same external IP reveals automated periodicity.",
          "Abnormal user agents: Look for default or outdated HTTP User-Agents (e.g., Go-http-client, python-requests, old Mozilla versions)."
        ],
        expectedResponse: {
          vulnerable: "Continuous, rhythmic connections to unclassified external IP addresses with low volume and consistent payload sizes.",
          safe: "Outbound egress filtering restricts connections to approved proxies, and anomaly detection flags periodic beaconing."
        },
        severity: "critical"
      },
      {
        id: "soc-net-2",
        text: "DNS Tunneling & Data Exfiltration Inspection",
        how: "Analyze DNS queries in packet captures for excessive subdomain length, high Shannon entropy, and high query frequency.",
        payloads: [
          "tshark -r capture.pcap -Y \"dns.flags.response == 0\" -T fields -e dns.qry.name | sort | uniq -c | sort -nr | head -30",
          "zeek -r capture.pcap (check dns.log for queries exceeding 50 characters or unusual record types: TXT, NULL)"
        ],
        payloadNotes: [
          "Offline DNS query-frequency lead. Long/high-entropy labels also occur in CDNs and telemetry; retain source/time data for attribution.",
          "This is a Zeek analysis procedure, not a shell command with parenthesized instructions. Inspect dns.log and corroborate endpoint/data evidence before calling the pattern tunneling or exfiltration."
        ],
        expectedResponse: {
          vulnerable: "Subdomains with long, random strings are repeatedly queried to a single domain name, transmitting exfiltrated data.",
          safe: "Internal DNS servers enforce query length restrictions, block direct external UDP/TCP 53, and filter suspicious high-entropy queries."
        },
        severity: "critical"
      },
      {
        id: "soc-net-3",
        text: "Cleartext Protocol & Credential Leakage in PCAP",
        how: "Extract unencrypted credentials and sensitive files transmitted over legacy protocols (HTTP, FTP, Telnet, LDAP, SMBv1).",
        payloads: [
          "tshark -r capture.pcap -Y \"http.request.method == POST\" -T fields -e ip.src -e ip.dst -e http.host -e http.file_data",
          "tshark -r capture.pcap -Y \"ftp.request.command == USER || ftp.request.command == PASS\"",
          "tshark -r capture.pcap -Y \"ldap\""
        ],
        payloadNotes: [
          "Inspect actual HTTP body/header bytes and stream reassembly for a synthetic credential, not just a POST method or suspicious field name.",
          "Inspect actual FTP USER/PASS commands in an authorized packet copy, with credential values redacted from shared evidence.",
          "Inspect LDAP bind type and transport state: StartTLS and SASL protection differ from plaintext simple bind. LDAP packets alone do not prove credential disclosure."
        ],
        expectedResponse: {
          vulnerable: "Plaintext passwords, session cookies, API tokens, or confidential documents are visible in packet captures.",
          safe: "All network traffic enforces TLS 1.3 / HTTPS / LDAPS, and cleartext protocols (Telnet, FTP, HTTP) are disabled."
        },
        severity: "high"
      }
    ]
  },
  {
    id: "soc-host-artifacts",
    name: "Host Forensics & Execution Artifacts",
    emoji: "🔬",
    description: "Prefetch, Shimcache, Amcache, USB history, and memory artifact analysis.",
    reference: "https://www.sans.org/posters/windows-forensic-analysis/",
    items: [
      {
        id: "soc-art-1",
        text: "Windows Prefetch Analysis (.pf Files)",
        how: "Examine C:\\Windows\\Prefetch files to prove binary execution, original path, run count, and exact timestamp.",
        payloads: [
          "PECmd.exe -d .\\PrefetchCopy --csv .\\PrefetchOutput",
          "Get-ChildItem C:\\Windows\\Prefetch\\*.pf | Select-Object Name, LastWriteTime"
        ],
        payloadNotes: [
          "Parse hashed read-only working copies with the OS-format-appropriate parser; --csv takes the output directory. Correlate embedded execution timestamps and paths with independent evidence.",
          "Filesystem LastWriteTime is not an exact execution timestamp. Missing Prefetch may reflect configuration, deletion or retention rather than non-execution."
        ],
        expectedResponse: {
          vulnerable: "Prefetch files confirm unauthorized tools (mimikatz, procdump, rubeus, chiseled) were executed on the endpoint.",
          safe: "Endpoint Detection & Response (EDR) blocks unauthorized executable hashes prior to prefetch generation."
        },
        severity: "high"
      },
      {
        id: "soc-art-2",
        text: "Shimcache (AppCompatCache) & Amcache Forensics",
        how: "Parse the Application Compatibility Cache from the SYSTEM registry hive and Amcache.hve to track binary existence and metadata.",
        payloads: [
          "AppCompatCacheParser.exe -f C:\\Windows\\System32\\config\\SYSTEM --csv C:\\Temp",
          "AmcacheParser.exe -f C:\\Windows\\appcompat\\Programs\\Amcache.hve --csv C:\\Temp"
        ],
        payloadNotes: [
          "Shimcache: Maintained by the Windows Application Compatibility database in the SYSTEM hive; records file path, file size, last modified time, and execution flag.",
          "Amcache.hve: Contains SHA1 hashes of executed files, compilation timestamps, and full file paths, invaluable for verifying whether malware was run."
        ],
        expectedResponse: {
          vulnerable: "Shimcache/Amcache records show executables staged in temporary paths (C:\\Windows\\Temp\\) with known malicious hashes.",
          safe: "Application Whitelisting (AppLocker / WDAC) prevents untrusted binaries from running regardless of folder location."
        },
        severity: "high"
      }
    ]
  }
];
applyContentReview("soc_forensics", socForensicsCategories);
