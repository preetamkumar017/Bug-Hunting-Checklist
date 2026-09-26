import type { ChecklistCategory } from "../types/checklist";

export const binarySafetyCategories: ChecklistCategory[] = [
  {
    id: "bin-mitigations",
    name: "Binary Hardening & Exploit Mitigation Verification",
    emoji: "🛡️",
    description: "Checksec verification: ASLR, DEP/NX, Stack Canaries, RELRO, and PIE controls.",
    reference: "https://cybersecurity.att.com/blogs/labs-research/linux-binary-protections",
    items: [
      {
        id: "bin-sec-1",
        text: "Linux Binary Mitigation Audit (Checksec)",
        how: "Inspect executable binaries and shared objects for compiler-level exploit mitigations using checksec or hardening-check.",
        payloads: [
          "checksec --file=./target_binary",
          "hardening-check ./target_binary",
          "readelf -l ./target_binary | grep GNU_STACK"
        ],
        payloadNotes: [
          "checksec: Checks RELRO (Read-Only Relocations), Stack Canary, NX (No-Execute stack), PIE (Position Independent Executable), and RPATH.",
          "GNU_STACK: If GNU_STACK has 'RWE' flags instead of 'RW', the stack memory is executable, allowing simple shellcode execution.",
          "Partial vs Full RELRO: Partial RELRO leaves the Global Offset Table (GOT) writable, enabling GOT overwrite attacks."
        ],
        expectedResponse: {
          vulnerable: "Binary lacks Stack Canary, has executable stack (NX disabled), or lacks PIE (predictable code segment addresses).",
          safe: "Binary is compiled with Full RELRO, Canary found, NX enabled, PIE enabled, and Fortify Source."
        },
        severity: "high"
      },
      {
        id: "bin-sec-2",
        text: "Windows Binary Exploit Protection Verification (Process Mitigation)",
        how: "Audit Windows PE executables for ASLR, Data Execution Prevention (DEP), SafeSEH, and Control Flow Guard (CFG).",
        payloads: [
          "Get-ProcessMitigation -Name target_app.exe",
          "dumpbin.exe /headers target_app.exe | findstr /i \"nxcompat dynamicbase guard\"",
          "pestudio target_app.exe"
        ],
        payloadNotes: [
          "Get-ProcessMitigation: Built-in PowerShell cmdlet checking DEP, ASLR (High Entropy), CFG, and child process creation policies.",
          "IMAGE_DLLCHARACTERISTICS_DYNAMIC_BASE: Flag indicating ASLR support. Without it, binary loads at static base address.",
          "IMAGE_DLLCHARACTERISTICS_NX_COMPAT: Flag indicating DEP compatibility. Prevents execution of code in data segments."
        ],
        expectedResponse: {
          vulnerable: "Application or bundled third-party DLLs lack Dynamic Base (ASLR) or NX Compat (DEP), enabling predictable memory exploitation.",
          safe: "All binaries and loaded DLLs enforce ASLR, DEP, SafeSEH, and Control Flow Guard."
        },
        severity: "high"
      }
    ]
  },
  {
    id: "bin-privesc-linux",
    name: "Linux Privilege Escalation & Binary Misconfigurations",
    emoji: "🐧",
    description: "SUID/SGID executables, insecure RPATH, capabilities, and GTFOBins.",
    reference: "https://gtfobins.github.io/",
    items: [
      {
        id: "bin-suid-1",
        text: "SUID / SGID Binaries & GTFOBins Abuses",
        how: "Search for executables with the SUID bit set that run with root privileges and cross-reference with known living-off-the-land techniques.",
        payloads: [
          "find / -perm -u=s -type f 2>/dev/null",
          "find / -perm -g=s -type f 2>/dev/null",
          "./suid_binary (check gtfobins for shell escape or file read capabilities)"
        ],
        payloadNotes: [
          "find -perm -u=s: Lists files where the SetUID flag is active. When executed by an unprivileged user, it runs with the file owner's privileges (e.g. root).",
          "GTFOBins: Curated catalog of standard binaries (e.g. find, nmap, vim, bash, pkexec) that can be abused to bypass local security restrictions."
        ],
        expectedResponse: {
          vulnerable: "Custom or non-standard binaries have SUID set and permit command execution, arbitrary file writes, or file reads.",
          safe: "SUID binaries are restricted to core system requirements and audited regularly with nosuid mount flags on user partitions."
        },
        severity: "critical"
      },
      {
        id: "bin-suid-2",
        text: "Insecure Shared Library Loading & RPATH / RUNPATH Manipulation",
        how: "Inspect binaries for insecure library search paths (RPATH) pointing to relative or writable directories.",
        payloads: [
          "readelf -d ./target_binary | grep -E 'RPATH|RUNPATH'",
          "objdump -x ./target_binary | grep RPATH",
          "ltrace ./target_binary 2>&1 | grep -i 'open.*\\.so'"
        ],
        payloadNotes: [
          "RPATH / RUNPATH: Defines directory paths the runtime linker searches before system directories (/lib, /usr/lib).",
          "Relative RPATH (e.g. . or $ORIGIN/../lib): If points to a writable directory, an attacker can drop a malicious shared library (.so) that gets executed."
        ],
        expectedResponse: {
          vulnerable: "Binary contains RPATH pointing to a world-writable directory or relative path, enabling arbitrary code execution.",
          safe: "Binaries use secure RUNPATH pointing strictly to protected system directories (/usr/lib) and enforce secure linker flags."
        },
        severity: "high"
      },
      {
        id: "bin-caps-3",
        text: "Linux Capabilities Misconfiguration Audit",
        how: "Check for binaries granted elevated Linux capabilities (e.g. cap_setuid, cap_net_raw, cap_dac_read_search).",
        payloads: [
          "getcap -r / 2>/dev/null",
          "/usr/bin/python3 -c 'import os; os.setuid(0); os.system(\"/bin/bash\")'  # if cap_setuid is set"
        ],
        payloadNotes: [
          "getcap -r: Recursively inspects file system extended attributes for granted capabilities.",
          "cap_setuid+ep: Allows the process to change its UID to 0 (root) without needing full SUID bit.",
          "cap_dac_read_search+ep: Allows reading any file on the system (bypassing file read permissions, including /etc/shadow)."
        ],
        expectedResponse: {
          vulnerable: "Interpreters (Python, Perl, Node) or utility binaries possess elevated capabilities enabling root privilege escalation.",
          safe: "Capabilities are restricted strictly to minimal required system binaries (e.g. ping with cap_net_raw)."
        },
        severity: "high"
      }
    ]
  },
  {
    id: "bin-privesc-win",
    name: "Windows Local Privilege Escalation & Hijacking",
    emoji: "🪟",
    description: "DLL Hijacking, unquoted service paths, insecure permissions, and token impersonation.",
    reference: "https://book.hacktricks.xyz/windows-hardening/windows-local-privilege-escalation",
    items: [
      {
        id: "win-dll-1",
        text: "DLL Search Order Hijacking Audit",
        how: "Inspect Windows applications for missing DLLs that are searched in user-writable application directories or PATH locations.",
        payloads: [
          "Procmon.exe (filter: Result is NAME NOT FOUND, Path ends with .dll)",
          "Inspect application install directory for Write/Modify permissions (icacls \"C:\\Program Files\\App\")"
        ],
        payloadNotes: [
          "DLL Search Order: Windows checks application directory, system directory, 16-bit directory, Windows directory, current directory, and PATH.",
          "NAME NOT FOUND: When an application queries a non-existent DLL without an absolute path, placing a crafted DLL in a writable directory executes code on startup."
        ],
        expectedResponse: {
          vulnerable: "Privileged service attempts to load a missing DLL from a directory writable by standard users.",
          safe: "Application uses SetDllDirectory(\"\") and loads libraries strictly via absolute paths with signature validation."
        },
        severity: "high"
      },
      {
        id: "win-svc-2",
        text: "Unquoted Service Paths & Insecure Service Binaries",
        how: "Query Windows Services with unquoted binary paths containing spaces running under LocalSystem.",
        payloads: [
          "wmic service get name,displayname,pathname,startmode | findstr /i /v \"C:\\Windows\\\\\" | findstr /i /v \"\"\"\"",
          "Get-WmiObject -Class win32_service | Where-Object {$_.PathName -notlike '\"*' -and $_.PathName -like '* *'}"
        ],
        payloadNotes: [
          "Unquoted Path vulnerability: If a path like C:\\Program Files\\My App\\service.exe is unquoted, Windows tries to execute C:\\Program.exe, then C:\\Program Files\\My.exe before the full path.",
          "Exploitation: Dropping an executable at C:\\Program.exe results in SYSTEM execution when the service restarts."
        ],
        expectedResponse: {
          vulnerable: "Service path contains spaces and lacks enclosing quotes, and user has write access to parent directories.",
          safe: "All service image paths are enclosed in quotes (e.g. \"C:\\Program Files\\App\\service.exe\")."
        },
        severity: "medium"
      }
    ]
  },
  {
    id: "bin-rev-eng",
    name: "Reverse Engineering & Hardcoded Secrets",
    emoji: "🔍",
    description: "Static binary analysis, symbol extraction, deobfuscation, and string audits.",
    reference: "https://ghidra-sre.org/",
    items: [
      {
        id: "bin-rev-1",
        text: "Binary String & Cryptographic Secret Hunting",
        how: "Extract ASCII and Unicode strings from compiled binaries to identify embedded credentials, internal URLs, and decryption keys.",
        payloads: [
          "strings -a -n 8 target_binary | grep -iE 'api[_-]?key|password|secret|token|bearer|https?://'",
          "floss --no-static-strings target_binary.exe (detects obfuscated/stack strings)",
          "rabin2 -z target_binary"
        ],
        payloadNotes: [
          "strings -a: Scans the entire file, not just data sections, for printable sequences.",
          "FLOSS (FireEye Labs Obfuscated String Solver): Uses emulation to automatically extract stack strings and dynamically decoded strings from malware/binaries.",
          "rabin2: Radare2 tool that prints strings from the binary's data and text sections with memory addresses."
        ],
        expectedResponse: {
          vulnerable: "Hardcoded database passwords, cloud API keys, private decryption keys, or internal admin URLs are recovered in plaintext.",
          safe: "Secrets are loaded dynamically via secure environment vaults, and binaries contain no static credential material."
        },
        severity: "high"
      },
      {
        id: "bin-rev-2",
        text: "Decompilation & Logic Flow Analysis (Ghidra / IDA)",
        how: "Disassemble and decompile executable to inspect license verification, integrity checks, and memory buffer bounds.",
        payloads: [
          "ghidra (import binary -> Auto Analyze -> decompile main / sensitive routines)",
          "objdump -d -M intel target_binary | less"
        ],
        payloadNotes: [
          "Ghidra Decompiler: Converts machine code into approximate C code to understand algorithm flow, cryptographic routines, and condition checks.",
          "Client-side verification: Look for functions like verifyLicense() or checkPassword() that return simple booleans or can be patched with NOPs/jmp instructions."
        ],
        expectedResponse: {
          vulnerable: "Critical security or authorization checks are performed purely on the client side without backend confirmation.",
          safe: "Security boundaries are enforced on the server/backend, and binary tampering is detected via code signing and integrity validation."
        },
        severity: "medium"
      }
    ]
  }
];
