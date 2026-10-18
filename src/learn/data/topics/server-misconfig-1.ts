import type { TopicContent } from "@/learn/data/types";

// Per-leaf trilingual lesson content, keyed by FULL Bugcrowd VRT path.
export const serverMisconfig1Topics: Record<string, TopicContent> = {
  "Network Security Misconfiguration › Telnet Enabled": {
    "what": {
      "en": "The remote host runs a legacy Telnet service (TCP port 23) allowing remote shell access. Telnet transmits all network communication, including administrative usernames and passwords, in unencrypted plaintext across the wire, exposing credentials to network eavesdropping and man-in-the-middle interception.",
      "simple": "The server is running Telnet, an ancient remote login tool that sends passwords in clear plain text over the network without encryption.",
      "hi": "Remote host पर legacy Telnet service (port 23) active है। Telnet सारा communication और passwords बिना encryption के plaintext में भेजता है, जिससे local network या ISP पर कोई भी credentials sniff कर सकता है।"
    },
    "find": [
      {
        "title": {
          "en": "Scan for open port 23 and probe banner",
          "simple": "Check if port 23 is open and connects",
          "hi": "Port 23 scan करें और Telnet banner देखें"
        },
        "steps": [
          {
            "en": "Run nmap against target hosts: `nmap -sV -p 23 <target>`.",
            "simple": "Scan port 23 using nmap.",
            "hi": "Nmap से target पर port 23 scan करें।"
          },
          {
            "en": "Connect via netcat or telnet: `nc -vn <ip> 23` and observe the plaintext login prompt.",
            "simple": "Connect with netcat to see the login prompt.",
            "hi": "`nc -vn <ip> 23` चलाकर plaintext login prompt observe करें।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates Telnet Enabled as P5 (Informational) unless administrative shell access is achieved on a production asset. Triage needs: nmap output, connection banner, and IP verification.",
      "simple": "Rated P5 Informational unless you can show it gives unauthorized access to a real server.",
      "hi": "यह P5 Informational है। Triage को nmap scan, connection banner, और target IP verification चाहिए।"
    },
    "cwe": "CWE-319: Cleartext Transmission of Sensitive Information"
  },
  "Protocol Specific Misconfiguration › Frontrunning-Enabled Attack": {
    "what": {
      "en": "A decentralized exchange or DeFi protocol processes transactions on a public mempool without slippage protection, commit-reveal schemes, or private transaction relays (Flashbots). Arbitrage bots observe pending user transactions and submit transactions with higher gas prices to execute ahead of the victim, siphoning trading profits.",
      "simple": "A crypto trading app broadcasts orders publicly before executing them, letting bots pay higher fees to jump in line and steal profits.",
      "hi": "DeFi protocol public mempool में बिना slippage limit या private relay के transactions process करता है। MEV bots pending transaction देखकर higher gas fee देकर आगे निकल जाते हैं (frontrunning) और profit siphon कर लेते हैं।"
    },
    "find": [
      {
        "title": {
          "en": "Analyze smart contract trade execution for missing minAmountOut",
          "simple": "Check if trades enforce a minimum received amount",
          "hi": "Trade execution में minimum output amount enforcement inspect करें"
        },
        "steps": [
          {
            "en": "Audit swap functions for missing `minAmountOut` or user-defined deadline constraints.",
            "simple": "Check if swap functions lack slippage protection.",
            "hi": "Swap functions में `minAmountOut` या deadline parameters की अनुपस्थिति check करें।"
          },
          {
            "en": "Simulate a mempool frontrun in Foundry using varying gas priority fees.",
            "simple": "Simulate jumping in front of a trade in Foundry.",
            "hi": "Foundry test में higher gas priority देकर trade frontrun simulate करें।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P2 in Bugcrowd VRT. Triage requires: contract code references showing missing slippage protection and a Foundry test demonstrating profitable frontrunning.",
      "simple": "Show the missing slippage checks in the contract and a test proving a bot can frontrun trades.",
      "hi": "Missing slippage checks का code snippet और frontrunning demonstrate करने वाला Foundry test दें। P2 priority है।"
    },
    "cwe": "CWE-362: Concurrent Execution using Shared Resource with Improper Synchronization ('Race Condition')"
  },
  "Protocol Specific Misconfiguration › Sandwich-Enabled Attack": {
    "what": {
      "en": "An Automated Market Maker (AMM) trade lacks strict slippage bounds, enabling MEV searchers to execute a sandwich attack: buying ahead of the victim's trade to drive up the asset price, letting the victim trade execute at a worse price, and immediately selling afterwards for risk-free profit.",
      "simple": "A bot buys right before your trade and sells right after your trade, squeezing your order and taking your money.",
      "hi": "AMM trade में strict slippage bound न होने से MEV bot victim के trade से ठीक पहले buy करता है (price बढ़ा देता है) और trade के ठीक बाद sell कर देता है (sandwich attack), जिससे victim को heavy loss होता है।"
    },
    "find": [
      {
        "title": {
          "en": "Audit slippage parameters in liquidity pool swaps",
          "simple": "Test if orders can be executed when pool price is moved",
          "hi": "Liquidity pool swaps में slippage tolerance audit करें"
        },
        "steps": [
          {
            "en": "Inspect swap parameters: verify if `amountOutMin` is set to 0 or hardcoded with excessive tolerance (e.g. >5%).",
            "simple": "Look for amountOutMin = 0 in the contract.",
            "hi": "चेक करें कि क्या `amountOutMin` 0 set है या tolerance excessively high है।"
          },
          {
            "en": "Write a Foundry fork test executing front-run buy, victim swap, and back-run sell in a single block.",
            "simple": "Simulate the sandwich attack in a Foundry test.",
            "hi": "Foundry test में front-run buy -> victim swap -> back-run sell simulate करें।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P2 in Bugcrowd VRT. Triage requires: Foundry fork test script proving the economic extraction from the victim.",
      "simple": "Provide a Foundry test showing a sandwich attack extracting profit from a victim swap.",
      "hi": "Victim swap से profit extract करने वाला Foundry test script दें। P2 priority है।"
    },
    "cwe": "CWE-682: Incorrect Calculation"
  },
  "Protocol Specific Misconfiguration › Improper Validation and Finalization Logic": {
    "what": {
      "en": "A blockchain protocol or consensus engine finalizes blocks or state commitments without proper quorum voting, signature verification, or fork-choice rule enforcement, enabling chain reorganizations, double-spending, or invalid state finalization.",
      "simple": "The blockchain validator software confirms transactions as final without waiting for enough validator votes, allowing double spending.",
      "hi": "Blockchain consensus engine बिना sufficient quorum या block validation के state finalize कर देता है, जिससे chain reorganization या double-spending possible हो जाती है।"
    },
    "find": [
      {
        "title": {
          "en": "Audit finalization thresholds and validator consensus rules",
          "simple": "Check how the protocol confirms blocks as finalized",
          "hi": "Consensus finalization rules और voting threshold audit करें"
        },
        "steps": [
          {
            "en": "Review consensus client source code for block finalization checks.",
            "simple": "Read the consensus code in the validator software.",
            "hi": "Validator client में block finalization logic inspect करें।"
          },
          {
            "en": "Test edge case scenarios with offline or partitioned validators in a local testnet.",
            "simple": "Simulate offline nodes to see if blocks finalize with too few votes.",
            "hi": "Local testnet में partitioned validators के साथ finalization behavior test करें।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Priority varies (P1–P3). Triage requires: a reproducible test script against a testnet node demonstrating state finalization without required consensus quorum.",
      "simple": "Show testnet evidence of a block finalizing without proper validator approval.",
      "hi": "Testnet node पर बिना consensus quorum के state finalize होने का proof दें।"
    },
    "cwe": "CWE-345: Insufficient Verification of Data Authenticity"
  },
  "Protocol Specific Misconfiguration › Misconfigured Staking Logic": {
    "what": {
      "en": "A staking contract miscalculates rewards, allows instant unstaking without unbonding cooldowns, or fails to slash misbehaving validators, allowing attackers to withdraw more rewards than earned or avoid penalties.",
      "simple": "A bug in the staking system lets users withdraw staked coins immediately without waiting, or earn unlimited free reward tokens.",
      "hi": "Staking contract में unbonding delay missing होता है या reward calculation गलत होती है, जिससे attacker बिना lockup के rewards claim कर लेता है या slashing penalty bypass कर लेता है।"
    },
    "find": [
      {
        "title": {
          "en": "Audit staking reward accumulation formulas and cooldown guards",
          "simple": "Check the staking math and unstake waiting periods",
          "hi": "Reward accumulation formula और cooldown logic inspect करें"
        },
        "steps": [
          {
            "en": "Audit the `rewardPerToken` formula and stake/unstake transitions.",
            "simple": "Read the reward calculation math in the contract.",
            "hi": "Staking contract में reward formula और unbonding logic inspect करें।"
          },
          {
            "en": "Test instant staking followed by immediate unstaking across reward distribution blocks.",
            "simple": "Try staking and immediately unstaking in Foundry.",
            "hi": "Foundry में stake करके immediate unstake करके reward harvest test करें।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Priority varies (P1–P3). Triage requires: a Foundry test proving unearned reward generation or cooldown bypass.",
      "simple": "Show a Foundry test where an attacker extracts free rewards or skips the unstaking delay.",
      "hi": "Foundry test script जिसमें unearned rewards या cooldown bypass demonstrate हो।"
    },
    "cwe": "CWE-682: Incorrect Calculation"
  },
  "Insufficient Security Configurability › Weak 2FA Implementation › 2FA Secret Cannot be Rotated": {
    "what": {
      "en": "Once a Two-Factor Authentication (2FA) TOTP secret key is generated, the application provides no functionality to rotate, regenerate, or replace the secret. If the secret key or QR code is compromised, the user cannot revoke it without deleting the entire account.",
      "simple": "Once you set up your Google Authenticator 2FA, there is no button or setting to change or refresh the secret code if someone steals it.",
      "hi": "2FA TOTP secret key एक बार generate होने के बाद उसे rotate या regenerate करने का कोई option नहीं होता। Secret leak होने पर user account delete किए बिना 2FA reset नहीं कर सकता।"
    },
    "find": [
      {
        "title": {
          "en": "Audit 2FA settings for secret re-generation options",
          "simple": "Check if the security settings page has a 2FA reset button",
          "hi": "Security settings में 2FA reset/rotate option inspect करें"
        },
        "steps": [
          {
            "en": "Navigate to account security settings where 2FA is active.",
            "simple": "Open your account security page.",
            "hi": "Account security settings page open करें।"
          },
          {
            "en": "Verify whether the application offers an option to re-scan a new QR code or rotate keys.",
            "simple": "Look for a button to regenerate the 2FA secret.",
            "hi": "चेक करें कि क्या नया QR code generate करने का option मौजूद है।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P4 in Bugcrowd VRT. Triage needs: screenshots of account settings showing inability to rotate 2FA secrets without account termination.",
      "simple": "Show that 2FA cannot be rotated in account settings. Ranked P4.",
      "hi": "Settings page का screenshot दिखाएँ जहाँ 2FA rotation functionality missing हो। P4 priority है।"
    },
    "cwe": "CWE-287: Improper Authentication"
  },
  "Insufficient Security Configurability › Weak 2FA Implementation › 2FA Secret Remains Obtainable After 2FA is Enabled": {
    "what": {
      "en": "After Two-Factor Authentication (TOTP) is successfully configured, the application continues to return the raw base32 secret key or QR code in API responses (e.g. in `/api/user/settings` or profile JSON). Anyone with read access to the profile API can clone the 2FA authenticator.",
      "simple": "Even after you finish setting up 2FA, the website still sends your secret authenticator code in background API responses.",
      "hi": "2FA successfully enable होने के बाद भी API responses (जैसे `/api/user/settings`) में 2FA secret key या QR code plaintext return होता रहता है। Profile read access वाला कोई भी attacker 2FA clone कर सकता है।"
    },
    "find": [
      {
        "title": {
          "en": "Inspect user profile API responses for persistent 2FA secrets",
          "simple": "Look at background network responses to see if the 2FA secret is still there",
          "hi": "Settings API response में persistent 2FA secret key inspect करें"
        },
        "steps": [
          {
            "en": "Enable 2FA and complete confirmation with a valid TOTP code.",
            "simple": "Turn on 2FA on your account.",
            "hi": "Account पर 2FA enable करें।"
          },
          {
            "en": "Browse account settings and inspect background XHR/fetch requests in Burp Suite.",
            "simple": "Inspect API responses in Burp.",
            "hi": "Settings page reload करके Burp में API responses inspect करें।"
          },
          {
            "en": "Check if the response contains `totp_secret`, `two_factor_key`, or QR code data URLs.",
            "simple": "Search response text for the 2FA secret key.",
            "hi": "Response में `totp_secret` या `two_factor_key` fields ढूँढें।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P4 in Bugcrowd VRT. Triage requires: the API request and response showing the 2FA secret returned while 2FA is active.",
      "simple": "Show the API response containing the 2FA secret after 2FA is already enabled.",
      "hi": "Active 2FA के बाद भी API response में secret key leak होने का HTTP capture दें। P4 priority है।"
    },
    "cwe": "CWE-200: Exposure of Sensitive Information to an Unauthorized Actor"
  },
  "Insufficient Security Configurability › No Password Policy": {
    "what": {
      "en": "The application enforces no minimum password complexity or length requirements, permitting users to set single-character passwords, common dictionary passwords ('password', '123456'), or whitespace, making accounts trivial to compromise via credential stuffing and brute force.",
      "simple": "The website lets users pick passwords as simple as '1' or 'password' with no rules requiring numbers or length.",
      "hi": "Application password length या complexity पर कोई validation नहीं लगाती, जिससे user '1' या 'password' जैसे trivial passwords रख सकते हैं और brute-force attack trivial हो जाता है।"
    },
    "find": [
      {
        "title": {
          "en": "Test registration and password change with minimal input",
          "simple": "Try setting a 1-character password on signup",
          "hi": "Registration में single-character password test करें"
        },
        "steps": [
          {
            "en": "Navigate to account registration or password reset.",
            "simple": "Go to sign up page.",
            "hi": "Registration या password change form खोलें।"
          },
          {
            "en": "Supply a single character: `a` or `1` as the new password.",
            "simple": "Enter a single letter 'a' as your password.",
            "hi": "New password में single letter 'a' डालें।"
          },
          {
            "en": "Observe whether the form accepts the password and successfully creates the account.",
            "simple": "See if the account is created without any warning.",
            "hi": "देखें कि क्या account बिना किसी error के create हो जाता है।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P4 in Bugcrowd VRT. Triage requires: the registration or password change HTTP request showing acceptance of a 1-character password.",
      "simple": "Show a screenshot of an account created with a 1-character password.",
      "hi": "Single character password accept होने का HTTP request/response screenshot दें। P4 priority है।"
    }
  },
  "Insufficient Security Configurability › Weak Password Reset Implementation › Token is Not Invalidated After Use": {
    "what": {
      "en": "The password reset token is not invalidated upon successful password reset, allowing the same token link to be re-used multiple times. If an attacker intercepts the link (via referer leak, proxy logs, or shoulder surfing), they can reset the victim's password again at any point during the token's validity window.",
      "simple": "A password reset link can be used over and over again even after you already reset your password with it.",
      "hi": "Password successfully reset होने के बाद भी reset token invalidate नहीं होता। Attacker purana token link reuse करके दोबारा password change कर सकता है।"
    },
    "find": [
      {
        "title": {
          "en": "Test replay of consumed password reset tokens",
          "simple": "Use the same password reset link a second time",
          "hi": "Used password reset token को दोबारा submit करें"
        },
        "steps": [
          {
            "en": "Request a password reset email and copy the reset token link.",
            "simple": "Get a password reset link.",
            "hi": "Password reset link request करें।"
          },
          {
            "en": "Complete the password reset in Browser 1 using the token.",
            "simple": "Reset your password with it.",
            "hi": "Token use करके password reset complete करें।"
          },
          {
            "en": "In Browser 2, navigate to the exact same token URL and attempt to submit a new password again.",
            "simple": "Open the same link again in incognito and try setting another password.",
            "hi": "Incognito window में वही token link open करके दोबारा new password submit करें।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P4 in Bugcrowd VRT. Triage requires: timestamped proof showing the second successful password change using the consumed token.",
      "simple": "Show that one password reset link can change the password twice in a row.",
      "hi": "Used token से दोबारा password change successfully होने का HTTP capture दें। P4 priority है।"
    },
    "cwe": "CWE-613: Insufficient Session Expiration"
  },
  "Insufficient Security Configurability › Weak 2FA Implementation › 2FA Code is Not Updated After New Code is Requested": {
    "what": {
      "en": "When a user requests a new SMS or email Two-Factor Authentication OTP code, the server does not generate a fresh cryptographic secret or random number, continuing to accept the previous code, or extending the validity window of older codes.",
      "simple": "When you click 'Resend SMS code', the website doesn't send a new code, but keeps accepting the old code.",
      "hi": "User जब 'Resend 2FA Code' click करता है, तो server नया OTP generate नहीं करता बल्कि पुराना code ही active रखता है, जिससे code reuse संभव होता है।"
    },
    "find": [
      {
        "title": {
          "en": "Test OTP regeneration behavior on resend",
          "simple": "Click resend code and check if the code changed",
          "hi": "Resend code click करके OTP generation behavior inspect करें"
        },
        "steps": [
          {
            "en": "Trigger an SMS/email 2FA code and record the received code.",
            "simple": "Request an SMS 2FA code.",
            "hi": "SMS 2FA code request करें और note करें।"
          },
          {
            "en": "Click 'Resend code' and inspect the new message received.",
            "simple": "Click resend code.",
            "hi": "'Resend code' click करें।"
          },
          {
            "en": "Verify whether the exact same numerical code was resent.",
            "simple": "Check if the code sent is identical.",
            "hi": "चेक करें कि क्या identical code दोबारा भेजा गया।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates this P5 (Informational). Triage treats identical resent codes as design choices unless paired with brute-force rate limit bypass.",
      "simple": "Rated P5 Informational.",
      "hi": "यह P5 Informational है।"
    },
    "cwe": "CWE-287: Improper Authentication"
  },
  "Insufficient Security Configurability › Weak Registration Implementation › Allows Disposable Email Addresses": {
    "what": {
      "en": "The registration workflow allows account creation using temporary or disposable email domains (e.g. 10minutemail, guerrillamail, temp-mail), enabling automated bot accounts, spam generation, or trial abuse.",
      "simple": "The site lets users sign up using temporary burner email addresses like 10MinuteMail.",
      "hi": "Registration system temporary disposable email domains (10minutemail, temp-mail) allow करता है, जिससे spam accounts या trial abuse किया जा सकता है।"
    },
    "find": [
      {
        "title": {
          "en": "Test registration with known disposable domains",
          "simple": "Sign up using a temporary email address",
          "hi": "Disposable email domain से signup test करें"
        },
        "steps": [
          {
            "en": "Sign up using a temporary email from a public disposable email service.",
            "simple": "Use temp-mail to create an account.",
            "hi": "Temp-mail से account create करें।"
          },
          {
            "en": "Verify account creation completes without domain blocklists.",
            "simple": "See that the signup succeeds.",
            "hi": "देखें कि account successfully create हो जाता है।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates this P5 (Informational). Programs explicitly exclude disposable email acceptance as business logic / non-vulnerability.",
      "simple": "Rated P5 Informational / Out of Scope in bounty programs.",
      "hi": "यह P5 Informational / Out of Scope है क्योंकि disposable email blocklist optional business logic है।"
    },
    "cwe": "CWE-20: Improper Input Validation"
  },
  "Insufficient Security Configurability › Lack of Notification Email": {
    "what": {
      "en": "The application does not send security notification emails when critical account events occur (such as password changes, email address updates, 2FA toggle, or new device logins), preventing users from noticing account takeover.",
      "simple": "The site doesn't email you when your password or email address is changed.",
      "hi": "Password, email change या new device login जैसे critical events पर application security notification email नहीं भेजती।"
    },
    "find": [
      {
        "title": {
          "en": "Monitor inbox during security state changes",
          "simple": "Change your password and check if you get an alert email",
          "hi": "Password change करके notification email delivery verify करें"
        },
        "steps": [
          {
            "en": "Change password or email on your account.",
            "simple": "Change your password.",
            "hi": "Account का password change करें।"
          },
          {
            "en": "Check your inbox and confirm no security notice is delivered.",
            "simple": "Confirm no email alert arrives.",
            "hi": "Inbox में confirm करें कि कोई security notice नहीं आया।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates missing security notification emails as P5 (Informational). Programs treat this as a feature recommendation.",
      "simple": "Rated P5 Informational.",
      "hi": "यह P5 Informational है।"
    },
    "cwe": "CWE-306: Missing Authentication for Critical Function"
  },
  "Insufficient Security Configurability › Weak 2FA Implementation › Missing Failsafe": {
    "what": {
      "en": "The application provides no backup recovery mechanism (such as single-use recovery codes or support verification) for users who lose their 2FA authenticator device, or conversely, provides an insecure recovery flow that completely bypasses 2FA via simple email links.",
      "simple": "The website doesn't give you backup codes in case you lose your 2FA phone, or the backup method is too easy to bypass.",
      "hi": "2FA setup के समय application backup recovery codes provide नहीं करती या recovery flow इतना कमजोर होता है कि वह 2FA को completely bypass कर देता है।"
    },
    "find": [
      {
        "title": {
          "en": "Audit 2FA recovery and backup code generation",
          "simple": "Check what backup options exist if you lose your 2FA device",
          "hi": "2FA recovery options और backup codes audit करें"
        },
        "steps": [
          {
            "en": "Enable 2FA and check if recovery codes are generated and shown.",
            "simple": "Look for backup codes during 2FA setup.",
            "hi": "2FA enable करते समय backup codes generation check करें।"
          },
          {
            "en": "Test the account recovery workflow without access to the 2FA authenticator.",
            "simple": "Try logging in without your 2FA device.",
            "hi": "बिना 2FA device के account recover करने की कोशिश करें।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates this P5 (Informational). Triage treats backup code implementation as user-experience architecture.",
      "simple": "Rated P5 Informational.",
      "hi": "यह P5 Informational है।"
    },
    "cwe": "CWE-287: Improper Authentication"
  },
  "Insufficient Security Configurability › No 2FA Implementation": {
    "what": {
      "en": "The application lacks Two-Factor Authentication (2FA) functionality entirely, supporting only single-factor username/password authentication for user and administrative accounts.",
      "simple": "The website has no option to turn on Two-Factor Authentication (2FA) at all.",
      "hi": "Application में Two-Factor Authentication (2FA) का कोई feature मौजूद नहीं है, जिससे accounts सिर्फ single-factor password पर निर्भर रहते हैं।"
    },
    "find": [
      {
        "title": {
          "en": "Audit security settings for 2FA availability",
          "simple": "Check if 2FA exists anywhere in settings",
          "hi": "Settings में 2FA feature की अनुपस्थिति verify करें"
        },
        "steps": [
          {
            "en": "Inspect account security settings for TOTP, SMS, or WebAuthn options.",
            "simple": "Look for 2FA in account settings.",
            "hi": "Security settings में 2FA options search करें।"
          },
          {
            "en": "Confirm that no multi-factor authentication mechanism exists.",
            "simple": "Confirm 2FA is absent.",
            "hi": "Confirm करें कि 2FA feature completely missing है।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates lack of 2FA implementation as P5 (Informational). Programs explicitly exclude the absence of 2FA as a non-vulnerability feature request.",
      "simple": "Rated P5 Informational / Feature Request.",
      "hi": "यह P5 Informational / Out of Scope है क्योंकि missing 2FA feature request माना जाता है।"
    }
  },
  "Insufficient Security Configurability › No Account Lockout": {
    "what": {
      "en": "The application enforces no account lockout or progressive rate limiting after consecutive failed login attempts, enabling online password guessing and credential stuffing attacks.",
      "simple": "The site lets you guess passwords an unlimited number of times without ever locking the account or showing a captcha.",
      "hi": "Consecutive failed login attempts के बाद application account lock या rate limiting enforce नहीं करती, जिससे brute-force और credential stuffing possible हो जाती है।"
    },
    "find": [
      {
        "title": {
          "en": "Test login endpoint under repeated incorrect password submissions",
          "simple": "Send 50 incorrect passwords in Burp to check for lockout",
          "hi": "50 failed login attempts भेजकर lockout behavior check करें"
        },
        "steps": [
          {
            "en": "Send 30 consecutive failed login requests in Burp Intruder against a test account.",
            "simple": "Send multiple wrong passwords using Burp Intruder.",
            "hi": "Burp Intruder से test account पर 30 failed login attempts भेजें।"
          },
          {
            "en": "Observe whether the server returns consistent 401/Invalid Credentials without lockout or CAPTCHA.",
            "simple": "Check if the server keeps answering without blocking.",
            "hi": "देखें कि क्या server bina lockout या CAPTCHA के लगातार attempts accept करता है।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates lack of account lockout as P5 (Informational). Almost all programs exclude lack of rate-limiting/lockout unless paired with an exploited high-value account takeover.",
      "simple": "Rated P5 Informational / Out of Scope in most programs.",
      "hi": "यह P5 Informational है। जब तक brute force से account compromise न दिखाया जाए, यह Informational रहता है।"
    }
  },
  "Insufficient Security Configurability › Weak 2FA Implementation › Old 2FA Code is Not Invalidated After New Code is Generated": {
    "what": {
      "en": "When a new SMS or email OTP code is generated, previously sent codes remain valid until their original expiration timer expires, allowing multiple valid codes to exist concurrently.",
      "simple": "When a new 2FA code is texted to you, the previous code still works.",
      "hi": "नया OTP generate होने के बाद भी पुराना 2FA code expire नहीं होता और दोनों codes simultaneously valid रहते हैं।"
    },
    "find": [
      {
        "title": {
          "en": "Test concurrent validity of consecutive OTP codes",
          "simple": "Request two codes and try using the first one",
          "hi": "दो codes request करके पहले वाले code से login test करें"
        },
        "steps": [
          {
            "en": "Request an OTP code (Code 1).",
            "simple": "Request Code 1.",
            "hi": "Code 1 request करें।"
          },
          {
            "en": "Request a second OTP code (Code 2).",
            "simple": "Request Code 2.",
            "hi": "Code 2 request करें।"
          },
          {
            "en": "Submit Code 1 and verify whether the login completes successfully.",
            "simple": "Try logging in with Code 1.",
            "hi": "Code 1 submit करके login verify करें।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates this P5 (Informational). Triage treats overlapping code windows as design choices.",
      "simple": "Rated P5 Informational.",
      "hi": "यह P5 Informational है।"
    },
    "cwe": "CWE-287: Improper Authentication"
  },
  "Insufficient Security Configurability › Password Policy Bypass": {
    "what": {
      "en": "The application enforces a password complexity policy in client-side JavaScript, but the server-side API accepts passwords that violate the policy when submitted directly via HTTP POST.",
      "simple": "The website's form tells you that you need 8 characters and numbers, but if you send the request directly with Burp, it accepts any short password.",
      "hi": "Password complexity policy सिर्फ client-side JavaScript में enforce होती है; server-side API बिना complexity validation के weak passwords accept कर लेती है।"
    },
    "find": [
      {
        "title": {
          "en": "Bypass client-side password validation via proxy",
          "simple": "Send a weak password directly in Burp Suite",
          "hi": "Burp Suite से weak password direct server पर submit करें"
        },
        "steps": [
          {
            "en": "Observe client-side password validation requirements in the browser UI.",
            "simple": "Look at the password rules on the page.",
            "hi": "Browser में password rules inspect करें।"
          },
          {
            "en": "Intercept the registration/change request in Burp Suite and change the password to a simple string: `123`.",
            "simple": "Change password to '123' in Burp.",
            "hi": "Burp में password बदलकर `123` करें और request forward करें।"
          },
          {
            "en": "Verify that the server accepts the password and returns 200 OK.",
            "simple": "See that the server accepts it without error.",
            "hi": "देखें कि क्या server 200 OK return करता है।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P5 in Bugcrowd VRT. Triage needs: the request showing the simple password accepted by the server.",
      "simple": "Show the HTTP request where the server accepts a weak password bypassing client checks.",
      "hi": "Client-side validation bypass करके weak password accept होने का HTTP capture दें। P5 priority है।"
    }
  },
  "Insufficient Security Configurability › Weak Password Reset Implementation › Token Has Long Timed Expiry": {
    "what": {
      "en": "The password reset token issued by the application remains valid for an excessively long time period (e.g., several days, weeks, or indefinitely) instead of expiring after standard windows (15–60 minutes).",
      "simple": "A password reset link stays active for weeks instead of expiring after an hour.",
      "hi": "Password reset token का expiry timer excessively long (कई दिन या हफ़्ते) होता है, जिससे link leak होने पर attack window लंबी खुली रहती है।"
    },
    "find": [
      {
        "title": {
          "en": "Test password reset token validity after 24+ hours",
          "simple": "Wait a day and check if the password reset link still works",
          "hi": "24+ घंटे बाद password reset link की validity test करें"
        },
        "steps": [
          {
            "en": "Request a password reset link and record the timestamp.",
            "simple": "Get a reset link and note the time.",
            "hi": "Reset link request करके timestamp note करें।"
          },
          {
            "en": "Wait 24–48 hours without using the link.",
            "simple": "Wait 24 hours.",
            "hi": "24-48 घंटे wait करें।"
          },
          {
            "en": "Navigate to the link and verify whether the reset form still accepts a new password.",
            "simple": "Try using the link after a day.",
            "hi": "Link open करके देखें कि क्या password change form अभी भी active है।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates long timed expiry as P5 (Informational). Programs treat expiry duration as a hardening recommendation.",
      "simple": "Rated P5 Informational.",
      "hi": "यह P5 Informational है।"
    },
    "cwe": "CWE-613: Insufficient Session Expiration"
  },
  "Insufficient Security Configurability › Weak Password Reset Implementation › Token is Not Invalidated After Email Change": {
    "what": {
      "en": "If an active password reset token was previously generated and sent to an old email address, changing the account's registered email address does not revoke the outstanding reset token.",
      "simple": "A password reset link sent to your old email still works even after you change your account to a new email address.",
      "hi": "Account का email address बदलने के बाद भी old email पर भेजा गया password reset token invalidate नहीं होता।"
    },
    "find": [
      {
        "title": {
          "en": "Test reset token validity across email changes",
          "simple": "Request a reset link, change your email, and test if the old link works",
          "hi": "Reset link request करें, email बदलें और old link test करें"
        },
        "steps": [
          {
            "en": "Request a password reset token.",
            "simple": "Request a reset link.",
            "hi": "Password reset link request करें।"
          },
          {
            "en": "Log in and update the registered email address.",
            "simple": "Change your email in settings.",
            "hi": "Settings में जाकर registered email बदलें।"
          },
          {
            "en": "Use the original reset token to reset the password.",
            "simple": "Use the old reset link to change password.",
            "hi": "Original reset link use करके password change करके देखें।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates this P5 (Informational). Triage treats this as Informational.",
      "simple": "Rated P5 Informational.",
      "hi": "यह P5 Informational है।"
    },
    "cwe": "CWE-613: Insufficient Session Expiration"
  },
  "Insufficient Security Configurability › Weak Password Reset Implementation › Token is Not Invalidated After Login": {
    "what": {
      "en": "When a user logs in successfully using their existing password, any outstanding password reset tokens generated prior to login are not invalidated.",
      "simple": "If you ask for a password reset link but remember your password and log in, the reset link still stays active.",
      "hi": "User जब normal password से log in कर लेता है, तब भी pre-login generate हुआ password reset token active रहता है।"
    },
    "find": [
      {
        "title": {
          "en": "Test reset token validity following successful authentication",
          "simple": "Request a reset link, log in normally, and see if the link still works",
          "hi": "Reset link माँगें, normally log in करें और link test करें"
        },
        "steps": [
          {
            "en": "Request a password reset link.",
            "simple": "Request a reset link.",
            "hi": "Password reset link request करें।"
          },
          {
            "en": "Log in with current valid credentials.",
            "simple": "Log in with password.",
            "hi": "Valid password से log in करें।"
          },
          {
            "en": "Use the reset link to change the password.",
            "simple": "Try using the link after logging in.",
            "hi": "Reset link open करके password change करें।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates this P5 (Informational).",
      "simple": "Rated P5 Informational.",
      "hi": "यह P5 Informational है।"
    },
    "cwe": "CWE-613: Insufficient Session Expiration"
  },
  "Insufficient Security Configurability › Weak Password Reset Implementation › Token is Not Invalidated After New Token is Requested": {
    "what": {
      "en": "Requesting a second password reset link does not invalidate the first reset link, allowing multiple active password reset tokens to coexist simultaneously.",
      "simple": "Asking for a new password reset email leaves your previous reset email link still working.",
      "hi": "दूसरा password reset link request करने पर पहला link invalidate नहीं होता और दोनों links simultaneously valid रहते हैं।"
    },
    "find": [
      {
        "title": {
          "en": "Test concurrent validity of multiple reset tokens",
          "simple": "Request two reset links and check if the first one still works",
          "hi": "दो reset links request करके पहले वाले की validity test करें"
        },
        "steps": [
          {
            "en": "Request password reset (Token 1).",
            "simple": "Get first reset link.",
            "hi": "Token 1 request करें।"
          },
          {
            "en": "Request password reset again (Token 2).",
            "simple": "Get second reset link.",
            "hi": "Token 2 request करें।"
          },
          {
            "en": "Use Token 1 to successfully set a new password.",
            "simple": "Use the first link to change password.",
            "hi": "Token 1 use करके password change करें।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates this P5 (Informational).",
      "simple": "Rated P5 Informational.",
      "hi": "यह P5 Informational है।"
    },
    "cwe": "CWE-613: Insufficient Session Expiration"
  },
  "Insufficient Security Configurability › Weak Password Reset Implementation › Token is Not Invalidated After Password Change": {
    "what": {
      "en": "Changing the password from within account settings does not revoke existing password reset tokens previously sent to email.",
      "simple": "If you change your password in settings, an old reset link in your email still works.",
      "hi": "Settings से password change करने के बाद भी email पर पहले से भेजा गया reset token active रहता है।"
    },
    "find": [
      {
        "title": {
          "en": "Test reset token validity after in-app password update",
          "simple": "Request a reset link, change password in settings, then use the link",
          "hi": "Reset link माँगें, settings में password बदलें, फिर old link use करें"
        },
        "steps": [
          {
            "en": "Request a password reset link.",
            "simple": "Request a reset link.",
            "hi": "Password reset link generate करें।"
          },
          {
            "en": "Log in and change the password from profile settings.",
            "simple": "Change password in settings.",
            "hi": "Settings में जाकर password change करें।"
          },
          {
            "en": "Open the reset link and check if it still allows resetting the password.",
            "simple": "Use the reset link.",
            "hi": "Reset link use करके password दोबारा change करने की कोशिश करें।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates this P5 (Informational).",
      "simple": "Rated P5 Informational.",
      "hi": "यह P5 Informational है।"
    },
    "cwe": "CWE-613: Insufficient Session Expiration"
  },
  "Insufficient Security Configurability › Verification of Contact Method not Required": {
    "what": {
      "en": "The application allows users to register accounts or change email addresses/phone numbers without sending or requiring verification of a confirmation link or code.",
      "simple": "The site lets you sign up with any email address without verifying that the inbox belongs to you.",
      "hi": "Application बिना email verification link या OTP confirm किए account register या email change allow कर देती है।"
    },
    "find": [
      {
        "title": {
          "en": "Test account usage without email confirmation",
          "simple": "Sign up and use the account without clicking any email link",
          "hi": "बिना email verify किए account features access करके देखें"
        },
        "steps": [
          {
            "en": "Sign up with a random email address.",
            "simple": "Sign up with an email.",
            "hi": "Random email address से signup करें।"
          },
          {
            "en": "Observe whether all platform features are immediately accessible without verification.",
            "simple": "See if you have full access immediately.",
            "hi": "देखें कि क्या बिना verification के full access मिल जाता है।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates this P5 (Informational). Programs consider mandatory email verification a business decision.",
      "simple": "Rated P5 Informational / Feature Request.",
      "hi": "यह P5 Informational / Out of Scope है।"
    },
    "cwe": "CWE-306: Missing Authentication for Critical Function"
  },
  "Insufficient Security Configurability › Weak JSON Web Token (JWT) Hashing Algorithm": {
    "what": {
      "en": "The application signs JSON Web Tokens (JWT) using a deprecated or weak cryptographic algorithm (such as HMAC-SHA1 or RSASSA-PKCS1-v1_5 with short 1024-bit RSA keys), or accepts `none` in the `alg` header.",
      "simple": "The website uses an old weak math formula or short encryption keys to sign login tokens.",
      "hi": "Application JWT sign करने के लिए weak algorithm (जैसे HS1 or 1024-bit RSA) use करती है, जिससे brute-force या signature forgery का risk बढ़ जाता है।"
    },
    "find": [
      {
        "title": {
          "en": "Inspect JWT header alg property",
          "simple": "Decode the JWT header and check the alg value",
          "hi": "JWT header decode करके alg parameter inspect करें"
        },
        "steps": [
          {
            "en": "Decode the JWT header in DevTools or jwt.io.",
            "simple": "Decode the token header.",
            "hi": "JWT token का header decode करें।"
          },
          {
            "en": "Check if `alg` is set to `HS1`, `none`, or a weak key configuration.",
            "simple": "Look at the alg field.",
            "hi": "`alg` field में weak algorithm inspect करें।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates weak JWT algorithm as P5 (Informational) unless signature forgery or auth bypass is practically demonstrated (which elevates to P1).",
      "simple": "Rated P5 Informational unless you can forge signatures and log in as other users.",
      "hi": "यह P5 Informational है जब तक signature forge करके account takeover न दिखाया जाए।"
    }
  },
  "Insufficient Security Configurability › Weak Password Policy": {
    "what": {
      "en": "The application enforces a minimal or weak password policy (e.g. minimum 6 characters with no requirement for special characters, numbers, or uppercase), making user accounts vulnerable to dictionary attacks.",
      "simple": "The site allows short 6-letter passwords without requiring any numbers or symbols.",
      "hi": "Application weak password policy allow करती है (जैसे minimum 6 characters बिना special characters के), जिससे dictionary attacks का risk रहता है।"
    },
    "find": [
      {
        "title": {
          "en": "Audit password complexity requirements",
          "simple": "Check minimum password length and rules",
          "hi": "Password rules और minimum length audit करें"
        },
        "steps": [
          {
            "en": "Test setting short passwords during registration.",
            "simple": "Try 6-letter lowercase passwords.",
            "hi": "Short lowercase passwords test करें।"
          },
          {
            "en": "Verify acceptance without complexity prompts.",
            "simple": "See if it accepts weak passwords.",
            "hi": "देखें कि क्या weak password accept हो जाता है।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P5 in Bugcrowd VRT. Triage treats password policy length recommendations as Informational.",
      "simple": "Rated P5 Informational.",
      "hi": "यह P5 Informational है।"
    }
  },
  "Server Security Misconfiguration › Exposed Portal › Admin Portal": {
    "what": {
      "en": "A sensitive administrative backoffice, management console, or internal orchestration portal (e.g. phpMyAdmin, Kubernetes dashboard, Jenkins, Django admin, Grafana) is directly exposed to the public internet without IP allowlisting, VPN enforcement, or network boundary isolation, presenting an immediate high-value target for authentication attacks.",
      "simple": "An internal company administrator panel is exposed directly to the public internet where anyone can attempt to log in.",
      "hi": "Sensitive administrative management console (Jenkins, phpMyAdmin, Django admin, Kubernetes dashboard) बिना IP allowlisting या VPN के public internet पर exposed है। यह high-value P1 target है।"
    },
    "find": [
      {
        "title": {
          "en": "Discover exposed admin portals via content discovery and subdomains",
          "simple": "Find admin login panels in subdomain scans and path wordlists",
          "hi": "Subdomain scan और path wordlists से exposed admin portals ढूँढें"
        },
        "steps": [
          {
            "en": "Scan subdomains and paths for admin consoles: `admin.target.com`, `/admin/`, `/phpmyadmin/`, `/jenkins/`.",
            "simple": "Search for admin portals in subdomains.",
            "hi": "`admin.target.com` या `/admin/` paths inspect करें।"
          },
          {
            "en": "Verify whether the interface controls production systems or privileged administrative functions.",
            "simple": "Check if the portal manages real company systems.",
            "hi": "Confirm करें कि क्या यह real production systems manage करता है।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P1 in Bugcrowd VRT when full administrative capabilities are reachable. Triage requires: public URL, screenshot of the exposed admin portal, and evidence of administrative functionality.",
      "simple": "Show the public URL and screenshot of the administrative management interface.",
      "hi": "Exposed admin portal का URL और screenshot दें। Administrative functionality exposed होने पर P1 priority है।"
    },
    "cwe": "CWE-200: Exposure of Sensitive Information to an Unauthorized Actor"
  },
  "Server Security Misconfiguration › Mail Server Misconfiguration › Email Spoofing to Inbox due to Missing or Misconfigured DMARC on Email Domain": {
    "what": {
      "en": "The target company's primary corporate email domain lacks a DMARC DNS record, or defines an insecure policy (`p=none`). An attacker can send spoofed emails directly from `ceo@company.com` that land directly in victim inboxes (e.g. Gmail, Outlook) without landing in spam, facilitating highly convincing spear phishing and executive impersonation.",
      "simple": "The company has missing email protection records (DMARC), letting anyone send fake emails pretending to be the CEO that land directly in your regular inbox.",
      "hi": "Corporate email domain पर DMARC record missing है या `p=none` set है। Attacker official company email (`ceo@company.com`) spoof करके fake emails भेज सकता है जो directly inbox में deliver होती हैं।"
    },
    "find": [
      {
        "title": {
          "en": "Query DNS TXT records for DMARC policy on email-sending domains",
          "simple": "Run dig to check the _dmarc TXT record",
          "hi": "dig command से _dmarc TXT record inspect करें"
        },
        "steps": [
          {
            "en": "Query DMARC policy: `dig TXT _dmarc.target.com +short`.",
            "simple": "Run dig TXT _dmarc.target.com in terminal.",
            "hi": "`dig TXT _dmarc.target.com +short` चलाएँ।"
          },
          {
            "en": "Check if the record is missing or contains `p=none`.",
            "simple": "Check if p=none or if no record exists.",
            "hi": "चेक करें कि क्या record missing है या `p=none` set है।"
          },
          {
            "en": "Send a test spoofed email to your own test inbox and verify inbox delivery (not spam).",
            "simple": "Send a test email to your own inbox to prove it doesn't go to spam.",
            "hi": "Test spoofed email भेजकर verify करें कि वह spam के बजाय inbox में land हुई।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P4 in Bugcrowd VRT. Triage requires: proof that the domain is actively used for real email communication, the dig TXT output, and headers of a received email demonstrating inbox delivery.",
      "simple": "Show the missing DMARC record and email headers proving the spoofed email landed in your inbox.",
      "hi": "dig TXT output, email domain usage proof, और received email headers दिखाएँ जो inbox delivery साबित करें। P4 priority है।"
    },
    "cwe": "CWE-290: Authentication Bypass by Spoofing"
  },
  "Server Security Misconfiguration › Misconfigured DNS › Zone Transfer": {
    "what": {
      "en": "A primary or secondary authoritative DNS nameserver permits unrestricted AXFR zone transfers from arbitrary IP addresses. An attacker can download the entire DNS database in a single query, revealing all internal subdomains, staging servers, VPN gateways, and private hostnames.",
      "simple": "The company's DNS server allows anyone to download a complete list of every single website and server the company owns.",
      "hi": "Authoritative DNS nameserver पर AXFR zone transfer unrestricted allow है। Attacker एक ही query में company के सभी internal subdomains, staging servers और IP addresses dump कर सकता है।"
    },
    "find": [
      {
        "title": {
          "en": "Query nameservers for AXFR zone transfers using dig",
          "simple": "Run dig axfr against all company nameservers",
          "hi": "dig axfr command से nameservers पर zone transfer test करें"
        },
        "steps": [
          {
            "en": "Find authoritative nameservers: `dig NS target.com +short`.",
            "simple": "Find the nameservers using dig NS.",
            "hi": "Nameservers list निकालें: `dig NS target.com`।"
          },
          {
            "en": "Attempt zone transfer against each nameserver: `dig axfr @ns1.target.com target.com`.",
            "simple": "Run dig axfr against each server.",
            "hi": "`dig axfr @ns1.target.com target.com` चलाएँ।"
          },
          {
            "en": "Observe whether the complete zone record list is returned.",
            "simple": "See if all subdomains are printed.",
            "hi": "देखें कि क्या complete DNS zone dump return होता है।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P4 in Bugcrowd VRT. Triage requires: the dig command and output showing successful AXFR record dumping.",
      "simple": "Show the dig command and the list of subdomains returned by the zone transfer.",
      "hi": "dig axfr command और returned DNS records का output दें। P4 priority है।"
    }
  },
  "Server Security Misconfiguration › Bitsquatting": {
    "what": {
      "en": "A domain similar to the target domain differs by a single flipped bit (e.g., due to memory hardware bit-flips or cosmic rays in DNS caches). Registering and analyzing traffic on bit-flipped domain variants represents opportunistic recon rather than an exploitable server misconfiguration.",
      "simple": "Registering a domain that is 1 typo/bit away from the real domain because computer memory errors sometimes flip a bit.",
      "hi": "Memory bit-flips या cosmic rays के कारण single-bit different domain पर traffic redirect होना। यह opportunistic hardware quirk है, server vulnerability नहीं।"
    },
    "find": [
      {
        "title": {
          "en": "Enumerate bit-flipped domain variants",
          "simple": "Calculate bit-flipped names of the company domain",
          "hi": "Target domain के bit-flipped variants calculate करें"
        },
        "steps": [
          {
            "en": "Generate single-bit flip domain names using bit-squatting calculators.",
            "simple": "Generate bit-flip domain variations.",
            "hi": "Bit-flip domain variants calculate करें।"
          },
          {
            "en": "Check registration status of the flipped domains.",
            "simple": "See if the variations are registered.",
            "hi": "चेक करें कि क्या flipped domains registered हैं।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates Bitsquatting as P5 (Informational). Programs exclude bitsquatting as non-vulnerabilities.",
      "simple": "Rated P5 Informational / Out of Scope.",
      "hi": "यह P5 Informational / Out of Scope है।"
    },
    "cwe": "CWE-16: Configuration"
  },
  "Server Security Misconfiguration › CAPTCHA › Brute Force": {
    "what": {
      "en": "A CAPTCHA challenge designed to prevent automated bot traffic can be brute-forced or replayed because the solution pool is small (e.g. 4 digits without rate limiting), the solution is verified client-side, or the CAPTCHA response is not bound to the session.",
      "simple": "A CAPTCHA is so short or weak that a computer script can easily guess it automatically.",
      "hi": "CAPTCHA challenge weak या client-side verified होता है (या 4-digit code बिना rate limit के), जिससे automated bot script उसे brute-force कर लेती है।"
    },
    "find": [
      {
        "title": {
          "en": "Test CAPTCHA automation and replay",
          "simple": "Send multiple CAPTCHA guesses in Burp Intruder",
          "hi": "Burp Intruder से CAPTCHA guesses automate करें"
        },
        "steps": [
          {
            "en": "Intercept a request requiring CAPTCHA verification.",
            "simple": "Capture the form submit in Burp.",
            "hi": "CAPTCHA protected form request capture करें।"
          },
          {
            "en": "Test if replaying the same previously-solved CAPTCHA response succeeds on subsequent requests.",
            "simple": "Try reusing the solved CAPTCHA code.",
            "hi": "Solved CAPTCHA response दोबारा replay करके देखें।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates CAPTCHA brute force as P5 (Informational) unless chained with credential stuffing on high-value accounts.",
      "simple": "Rated P5 Informational unless chained with account takeover.",
      "hi": "यह P5 Informational है जब तक account takeover के साथ chain न हो।"
    },
    "cwe": "CWE-804: Guessable CAPTCHA"
  },
  "Server Security Misconfiguration › Lack of Security Headers › Cache-Control for a Non-Sensitive Page": {
    "what": {
      "en": "A publicly accessible web page containing no confidential or personal information lacks `Cache-Control: no-store` headers, allowing public static assets to be cached by downstream proxies and browsers.",
      "simple": "A public webpage without any secret info doesn't tell the browser not to cache it.",
      "hi": "Non-sensitive public page पर `Cache-Control: no-store` header missing होता है। Public data होने के कारण इसमें कोई security impact नहीं है।"
    },
    "find": [
      {
        "title": {
          "en": "Inspect Cache-Control headers on static pages",
          "simple": "Look at headers on public pages",
          "hi": "Public pages के Cache-Control headers inspect करें"
        },
        "steps": [
          {
            "en": "Send request to public homepage: `curl -I https://target.com/`.",
            "simple": "Check homepage headers with curl.",
            "hi": "Homepage पर `curl -I` चलाएँ।"
          },
          {
            "en": "Observe missing or permissive Cache-Control headers on public content.",
            "simple": "See that Cache-Control is not no-store.",
            "hi": "देखें कि Cache-Control missing या public है।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P5 in Bugcrowd VRT. Programs explicitly exclude cache-control on public pages.",
      "simple": "Rated P5 Informational / Out of Scope.",
      "hi": "यह P5 Informational / Out of Scope है।"
    }
  },
  "Server Security Misconfiguration › Insecure SSL › Certificate Error": {
    "what": {
      "en": "The web server serves a TLS/SSL certificate that is expired, self-signed, untrusted, or has a hostname mismatch (`CN/SAN mismatch`). Browsers display full-page security warnings blocking normal users.",
      "simple": "The website has an expired or mismatched SSL certificate, causing browsers to show a 'Warning: Potential Security Risk' page.",
      "hi": "Server का SSL certificate expired, self-signed या hostname mismatch वाला होता है, जिससे browser red warning page display करता है।"
    },
    "find": [
      {
        "title": {
          "en": "Inspect TLS certificate details with openssl or curl",
          "simple": "Check SSL cert validity using openssl",
          "hi": "openssl से SSL certificate validity inspect करें"
        },
        "steps": [
          {
            "en": "Run `openssl s_client -connect target.com:443 -servername target.com`.",
            "simple": "Check cert in terminal.",
            "hi": "`openssl s_client` से certificate inspect करें।"
          },
          {
            "en": "Inspect expiry dates and Subject Alternative Names (SAN).",
            "simple": "Check expiration date.",
            "hi": "Expiry date और SAN list देखें।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P5 in Bugcrowd VRT. Programs exclude certificate expiration as an operational bug.",
      "simple": "Rated P5 Informational / Operational issue.",
      "hi": "यह P5 Informational / Out of Scope operational issue है।"
    },
    "cwe": "CWE-295: Improper Certificate Validation"
  },
  "Server Security Misconfiguration › Lack of Password Confirmation › Change Email Address": {
    "what": {
      "en": "The application allows a logged-in user to change their account email address without requiring them to re-enter their current password, creating a risk if a session is hijacked or left unattended.",
      "simple": "You can change your account's email address in settings without typing your current password to confirm.",
      "hi": "Account email address बदलते समय application current password confirm करने के लिए नहीं पूछती।"
    },
    "find": [
      {
        "title": {
          "en": "Test email update without current password parameter",
          "simple": "Change your email in settings without entering your password",
          "hi": "बिना current password के email change request test करें"
        },
        "steps": [
          {
            "en": "Navigate to account settings email update form.",
            "simple": "Go to change email page.",
            "hi": "Settings में email change form खोलें।"
          },
          {
            "en": "Verify that only the new email is required without password confirmation.",
            "simple": "Check that no password field exists.",
            "hi": "Confirm करें कि current password prompt नहीं होता।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates this P5 (Informational). Triage treats lack of password confirmation as a best-practice hardening issue.",
      "simple": "Rated P5 Informational.",
      "hi": "यह P5 Informational है।"
    },
    "cwe": "CWE-306: Missing Authentication for Critical Function"
  },
  "Server Security Misconfiguration › Lack of Password Confirmation › Change Password": {
    "what": {
      "en": "The application allows changing the account password without requiring the user to supply their existing current password first.",
      "simple": "You can type a new password in settings without having to enter your old password first.",
      "hi": "Password change form में नया password set करते समय current old password prompt नहीं किया जाता।"
    },
    "find": [
      {
        "title": {
          "en": "Test password change endpoint for missing current-password requirement",
          "simple": "Check if the password change form asks for your old password",
          "hi": "Password change form में old password requirement inspect करें"
        },
        "steps": [
          {
            "en": "Inspect the password change request in Burp Suite.",
            "simple": "Look at the change password request in Burp.",
            "hi": "Burp में password change request inspect करें।"
          },
          {
            "en": "Verify that removing or leaving the current password blank succeeds.",
            "simple": "See if you can change password without old password.",
            "hi": "Check करें कि क्या बिना old password के request process हो जाती है।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P5 in Bugcrowd VRT.",
      "simple": "Rated P5 Informational.",
      "hi": "यह P5 Informational है।"
    }
  },
  "Server Security Misconfiguration › Lack of Security Headers › Content-Security-Policy": {
    "what": {
      "en": "The web application omits the `Content-Security-Policy` (CSP) header, providing no defense-in-depth restriction against inline script execution, unauthorized scripts, or data exfiltration in the event of an XSS flaw.",
      "simple": "The site doesn't set a Content-Security-Policy header to restrict where scripts can load from.",
      "hi": "Web application `Content-Security-Policy` (CSP) header omit करती है, जिससे XSS होने की स्थिति में defense-in-depth mitigation missing रहता है।"
    },
    "find": [
      {
        "title": {
          "en": "Check response headers for Content-Security-Policy",
          "simple": "Check if CSP header is missing in curl output",
          "hi": "curl output में CSP header की उपस्थिति चेक करें"
        },
        "steps": [
          {
            "en": "Run `curl -I https://target.com/`.",
            "simple": "Check headers with curl -I.",
            "hi": "`curl -I https://target.com` चलाएँ।"
          },
          {
            "en": "Verify that neither `Content-Security-Policy` nor `Content-Security-Policy-Report-Only` is present.",
            "simple": "See that no CSP header exists.",
            "hi": "Verify करें कि CSP header missing है।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates missing CSP as P5 (Informational). Programs universally exclude missing security headers without a working exploit.",
      "simple": "Rated P5 Informational / Out of Scope.",
      "hi": "यह P5 Informational / Out of Scope है।"
    },
    "cwe": "CWE-16: Configuration"
  },
  "Server Security Misconfiguration › Lack of Security Headers › Content-Security-Policy-Report-Only": {
    "what": {
      "en": "The application lacks a `Content-Security-Policy-Report-Only` header. This header is used by administrators to test CSP policies without enforcement.",
      "simple": "The site lacks the report-only version of the CSP testing header.",
      "hi": "Application `Content-Security-Policy-Report-Only` header use नहीं करती, जो CSP testing के लिए होता है।"
    },
    "find": [
      {
        "title": {
          "en": "Audit CSP testing headers",
          "simple": "Check headers for CSP-Report-Only",
          "hi": "Headers में CSP-Report-Only inspect करें"
        },
        "steps": [
          {
            "en": "Inspect response headers via curl.",
            "simple": "Run curl -I.",
            "hi": "curl -I से headers inspect करें।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P5 in Bugcrowd VRT. Always Informational.",
      "simple": "Rated P5 Informational.",
      "hi": "यह P5 Informational है।"
    },
    "cwe": "CWE-16: Configuration"
  },
  "Server Security Misconfiguration › Cookie Scoped to Parent Domain": {
    "what": {
      "en": "The application sets session or authentication cookies with `Domain=.target.com` instead of omitting the domain attribute (host-only cookie). This causes all subdomains (`*.target.com`), including untrusted or community subdomains, to receive the sensitive cookie.",
      "simple": "The site makes its login cookie accessible to every single subdomain instead of keeping it strictly on the main site.",
      "hi": "Session cookie में `Domain=.target.com` set किया गया है, जिससे सभी subdomains (सहित unverified/staging subdomains) को session cookie transmit हो जाती है।"
    },
    "find": [
      {
        "title": {
          "en": "Inspect Set-Cookie Domain attribute in response headers",
          "simple": "Look at the Domain= part of Set-Cookie in Burp",
          "hi": "Set-Cookie header में Domain attribute inspect करें"
        },
        "steps": [
          {
            "en": "Inspect the `Set-Cookie` header for session cookies in Burp Suite.",
            "simple": "Find Set-Cookie in Burp.",
            "hi": "Burp में `Set-Cookie` header inspect करें।"
          },
          {
            "en": "Check if `Domain=.target.com` or `Domain=target.com` is explicitly specified.",
            "simple": "Look for Domain=.target.com.",
            "hi": "चेक करें कि क्या Domain attribute parent domain पर scoped है।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P5 in Bugcrowd VRT unless chained with an XSS or subdomain takeover on an in-scope sibling subdomain.",
      "simple": "Rated P5 Informational unless chained with a vulnerable subdomain.",
      "hi": "यह P5 Informational है जब तक किसी vulnerable subdomain के साथ exploit न किया जाए।"
    },
    "cwe": "CWE-16: Configuration"
  },
  "Server Security Misconfiguration › Mail Server Misconfiguration › Email Spoofing on Non-Email Domain": {
    "what": {
      "en": "A domain owned by the target organization that is never used for sending emails (e.g. an asset CDN domain or defensive registration) lacks SPF and DMARC records.",
      "simple": "A domain that the company only uses for images or assets doesn't have email protection records.",
      "hi": "ऐसा domain जो email भेजने के लिए use ही नहीं होता (जैसे static asset CDN domain) उस पर SPF/DMARC missing होना।"
    },
    "find": [
      {
        "title": {
          "en": "Query SPF/DMARC on non-email infrastructure domains",
          "simple": "Check SPF on static/asset domains",
          "hi": "Static asset domains पर SPF/DMARC inspect करें"
        },
        "steps": [
          {
            "en": "Check DMARC on an asset domain: `dig TXT _dmarc.cdn-target.com`.",
            "simple": "Run dig TXT on an asset domain.",
            "hi": "Asset domain पर dig TXT चलाएँ।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates this P5 (Informational). Programs explicitly exclude non-email domains from email spoofing reports.",
      "simple": "Rated P5 Informational / Out of Scope.",
      "hi": "यह P5 Informational / Out of Scope है।"
    },
    "cwe": "CWE-290: Authentication Bypass by Spoofing"
  },
  "Server Security Misconfiguration › Mail Server Misconfiguration › Email Spoofing to Spam Folder": {
    "what": {
      "en": "An attacker can send spoofed emails from the company's domain, but because SPF/DKIM/DMARC are configured with `p=none` or soft-fail, receiving mail providers (Gmail, Outlook) automatically flag the message as suspicious and place it directly into the user's Spam/Junk folder.",
      "simple": "You can send a fake email from the company domain, but email providers detect it and put it in the Junk/Spam folder.",
      "hi": "Company domain से spoofed email भेजी जा सकती है, पर mail providers (Gmail, Outlook) उसे detect करके सीधे Spam folder में डाल देते हैं।"
    },
    "find": [
      {
        "title": {
          "en": "Verify spoofed email delivery destination",
          "simple": "Send a test spoofed email and check if it lands in Spam",
          "hi": "Spoofed email भेजकर verify करें कि वह Spam folder में जाती है"
        },
        "steps": [
          {
            "en": "Send a test spoofed email using a mail tester tool.",
            "simple": "Send a test spoof email.",
            "hi": "Test spoofed email भेजें।"
          },
          {
            "en": "Inspect the receiving inbox and observe that the email landed in Spam with SPF/DMARC fail warnings.",
            "simple": "Check that it landed in Spam.",
            "hi": "देखें कि email Spam folder में deliver हुई।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P5 in Bugcrowd VRT. Programs require inbox delivery for valid email spoofing bounties.",
      "simple": "Rated P5 Informational because emails landing in spam are not considered dangerous.",
      "hi": "यह P5 Informational है क्योंकि spam folder में जाने वाली emails valid bug bounty नहीं मानी जातीं।"
    },
    "cwe": "CWE-290: Authentication Bypass by Spoofing"
  },
  "Server Security Misconfiguration › Email Verification Bypass": {
    "what": {
      "en": "The application attempts to enforce email verification before granting access to platform features, but the restriction can be bypassed by manipulating client-side state, deleting verification modal overlays, or altering API response booleans.",
      "simple": "The site requires you to verify your email, but you can bypass the popup by deleting it in DevTools or editing API responses.",
      "hi": "Application email verify करने का popup दिखाती है, पर client-side DevTools से popup delete करके या API response modify करके verification bypass हो जाती है।"
    },
    "find": [
      {
        "title": {
          "en": "Bypass email verification modal via DOM and response editing",
          "simple": "Delete the verification popup in DevTools and test if features work",
          "hi": "DevTools से verification modal delete करके backend access test करें"
        },
        "steps": [
          {
            "en": "Log in with an unverified email account.",
            "simple": "Log in without verifying email.",
            "hi": "Unverified account से login करें।"
          },
          {
            "en": "Inspect the blocking overlay: delete the modal `<div id=\"email-verify-modal\">` in DevTools.",
            "simple": "Delete the popup HTML element.",
            "hi": "DevTools में modal HTML delete करें।"
          },
          {
            "en": "Test if backend API endpoints process actions without checking email verification status.",
            "simple": "Try using features to see if the server allows it.",
            "hi": "Backend API endpoints call करके देखें कि क्या actions execute हो जाते हैं।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P5 in Bugcrowd VRT unless the unverified state enables direct account takeover or privileged access.",
      "simple": "Rated P5 Informational unless you can steal accounts.",
      "hi": "यह P5 Informational है जब तक इससे direct account takeover संभव न हो।"
    },
    "cwe": "CWE-287: Improper Authentication"
  },
  "Server Security Misconfiguration › Clickjacking › Form Input": {
    "what": {
      "en": "A web page containing a form input field lacks frame protections (`X-Frame-Options` or CSP `frame-ancestors`), allowing the page to be framed inside a transparent `<iframe>` on an attacker's website. An attacker tricks the victim into typing or clicking into the framed field.",
      "simple": "A webpage can be loaded inside a hidden transparent frame on another site, tricking users into clicking buttons they can't see.",
      "hi": "Form page पर `X-Frame-Options` या CSP `frame-ancestors` missing होता है। Attacker transparent `<iframe>` में page load करवाकर user से blind clicks करवा सकता है (Clickjacking)।"
    },
    "find": [
      {
        "title": {
          "en": "Test framing vulnerability with an HTML iframe PoC",
          "simple": "Put the webpage inside an iframe on a local HTML file",
          "hi": "Local HTML file में iframe बनाकर framing test करें"
        },
        "steps": [
          {
            "en": "Create an HTML file: `<iframe src=\"https://target.com/form\" width=\"800\" height=\"600\"></iframe>`.",
            "simple": "Create a test HTML file with an iframe.",
            "hi": "Local HTML page में target URL का iframe embed करें।"
          },
          {
            "en": "Open the file in a browser and check if the page renders without frame-busting errors.",
            "simple": "Open it in Chrome to see if it loads.",
            "hi": "Browser में open करके देखें कि क्या page frame में load हो जाता है।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P5 in Bugcrowd VRT unless a sensitive state change (e.g. transfer funds, delete account) is proven.",
      "simple": "Rated P5 Informational unless you prove a sensitive action can be tricked.",
      "hi": "यह P5 Informational है जब तक sensitive state change (money transfer, delete account) demonstrate न हो।"
    },
    "cwe": "CWE-1021: Improper Restriction of Rendered UI Layers or Frames"
  },
  "Server Security Misconfiguration › Insecure SSL › Insecure Cipher Suite": {
    "what": {
      "en": "The web server supports legacy or weak cryptographic cipher suites (such as RC4, 3DES, CBC-mode ciphers in TLS 1.0/1.1, or export ciphers) susceptible to known cryptographic attacks (SWEET32, POODLE, BEAST).",
      "simple": "The web server supports old, broken encryption ciphers like RC4 or 3DES.",
      "hi": "Server legacy weak cipher suites (RC4, 3DES, CBC ciphers) support करता है जो SWEET32 या POODLE attacks के प्रति vulnerable हैं।"
    },
    "find": [
      {
        "title": {
          "en": "Scan supported SSL/TLS ciphers with testssl.sh or nmap",
          "simple": "Run testssl.sh or nmap ssl-enum-ciphers",
          "hi": "nmap ssl-enum-ciphers चलाकर weak ciphers scan करें"
        },
        "steps": [
          {
            "en": "Run `nmap --script ssl-enum-ciphers -p 443 target.com`.",
            "simple": "Scan ciphers with nmap.",
            "hi": "`nmap --script ssl-enum-ciphers -p 443 target.com` चलाएँ।"
          },
          {
            "en": "Inspect output for ciphers rated grade C or lower (e.g. 3DES, RC4).",
            "simple": "Look for 3DES or RC4 in the output.",
            "hi": "Output में 3DES या RC4 ciphers identify करें।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P5 in Bugcrowd VRT. Programs universally exclude TLS cipher suite findings as Informational.",
      "simple": "Rated P5 Informational / Out of Scope.",
      "hi": "यह P5 Informational / Out of Scope है।"
    }
  },
  "Server Security Misconfiguration › Insecure SSL › Lack of Forward Secrecy": {
    "what": {
      "en": "The web server supports TLS cipher suites that use static RSA key exchange instead of Ephemeral Diffie-Hellman (DHE/ECDHE). If the server's private key is compromised in the future, all previously recorded network traffic can be decrypted retroactively.",
      "simple": "The server doesn't use Forward Secrecy, meaning if its secret key is stolen in 5 years, all past recorded traffic can be read.",
      "hi": "Server static RSA key exchange ciphers support करता है (Forward Secrecy missing)। Future में private key compromise होने पर past recorded traffic decrypt किया जा सकता है।"
    },
    "find": [
      {
        "title": {
          "en": "Check for non-ECDHE cipher suites in SSL scans",
          "simple": "Check if non-PFS ciphers are supported",
          "hi": "Non-ECDHE cipher suites की उपस्थिति scan करें"
        },
        "steps": [
          {
            "en": "Scan ciphers with `testssl.sh target.com`.",
            "simple": "Run testssl.sh.",
            "hi": "testssl.sh चलाएँ।"
          },
          {
            "en": "Check if static RSA key exchange ciphers (without DHE/ECDHE) are offered.",
            "simple": "Look for static RSA ciphers.",
            "hi": "देखें कि क्या static RSA ciphers enabled हैं।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P5 in Bugcrowd VRT. Excluded in almost all bounty programs.",
      "simple": "Rated P5 Informational / Out of Scope.",
      "hi": "यह P5 Informational / Out of Scope है।"
    },
    "cwe": "CWE-326: Inadequate Encryption Strength"
  },
  "Server Security Misconfiguration › Lack of Password Confirmation › Manage 2FA": {
    "what": {
      "en": "The application permits disabling or modifying Two-Factor Authentication (2FA) settings without requiring the user to re-enter their current account password.",
      "simple": "You can turn off 2FA in settings without having to re-type your password.",
      "hi": "2FA disable या manage करते समय application current password re-enter करने के लिए require नहीं करती।"
    },
    "find": [
      {
        "title": {
          "en": "Test 2FA disable request for missing password prompt",
          "simple": "Try disabling 2FA without entering a password",
          "hi": "बिना password के 2FA disable request test करें"
        },
        "steps": [
          {
            "en": "Navigate to 2FA settings and click 'Disable 2FA'.",
            "simple": "Click disable 2FA.",
            "hi": "2FA settings में 'Disable 2FA' click करें।"
          },
          {
            "en": "Verify whether the action completes without prompting for the account password.",
            "simple": "See if it turns off without asking for password.",
            "hi": "Confirm करें कि current password prompt नहीं हुआ।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P5 in Bugcrowd VRT.",
      "simple": "Rated P5 Informational.",
      "hi": "यह P5 Informational है।"
    },
    "cwe": "CWE-306: Missing Authentication for Critical Function"
  },
  "Server Security Misconfiguration › CAPTCHA › Missing": {
    "what": {
      "en": "An unauthenticated endpoint (e.g. login, registration, contact form, or password reset) lacks a CAPTCHA challenge, permitting automated request submission.",
      "simple": "A login or signup form doesn't have a CAPTCHA puzzle.",
      "hi": "Login या registration form पर CAPTCHA missing होता है, जिससे automated tools form submit कर सकते हैं।"
    },
    "find": [
      {
        "title": {
          "en": "Inspect form submission endpoints for CAPTCHA challenges",
          "simple": "Check if signup forms lack a CAPTCHA",
          "hi": "Form submission endpoints पर CAPTCHA presence inspect करें"
        },
        "steps": [
          {
            "en": "Browse to the registration or contact form.",
            "simple": "Open the signup form.",
            "hi": "Registration form open करें।"
          },
          {
            "en": "Confirm no CAPTCHA challenge is presented.",
            "simple": "Confirm no CAPTCHA is there.",
            "hi": "Confirm करें कि कोई CAPTCHA नहीं है।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates missing CAPTCHA as P5 (Informational). Programs explicitly exclude missing CAPTCHA as a non-vulnerability.",
      "simple": "Rated P5 Informational / Out of Scope.",
      "hi": "यह P5 Informational / Out of Scope है।"
    },
    "cwe": "CWE-16: Configuration"
  },
  "Server Security Misconfiguration › Misconfigured DNS › Missing Certification Authority Authorization (CAA) Record": {
    "what": {
      "en": "The target domain has no DNS CAA (Certification Authority Authorization) record, allowing any valid Certificate Authority (CA) worldwide to issue SSL/TLS certificates for the domain.",
      "simple": "The domain doesn't specify which Certificate Authority is allowed to issue SSL certificates for it.",
      "hi": "Domain DNS में CAA record missing होता है, जिससे कोई भी global Certificate Authority domain के लिए SSL certificate issue कर सकती है।"
    },
    "find": [
      {
        "title": {
          "en": "Query DNS CAA records using dig",
          "simple": "Check CAA records using dig CAA target.com",
          "hi": "dig CAA command से CAA record check करें"
        },
        "steps": [
          {
            "en": "Run `dig CAA target.com +short`.",
            "simple": "Run dig CAA.",
            "hi": "`dig CAA target.com +short` चलाएँ।"
          },
          {
            "en": "Observe an empty response indicating no CAA record is configured.",
            "simple": "See empty output.",
            "hi": "Empty output observe करें।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P5 in Bugcrowd VRT. Universally excluded as an Informational hardening recommendation.",
      "simple": "Rated P5 Informational / Out of Scope.",
      "hi": "यह P5 Informational / Out of Scope है।"
    },
    "cwe": "CWE-16: Configuration"
  },
  "Server Security Misconfiguration › Mail Server Misconfiguration › Missing or Misconfigured SPF and/or DKIM": {
    "what": {
      "en": "The domain has no SPF (Sender Policy Framework) TXT record, uses a permissive `+all` mechanism, or lacks DKIM public keys, allowing external servers to send emails claiming to originate from the domain.",
      "simple": "The domain is missing SPF or DKIM email security records.",
      "hi": "Domain पर SPF या DKIM record missing या permissive (`+all`) होता है।"
    },
    "find": [
      {
        "title": {
          "en": "Query DNS TXT records for SPF configuration",
          "simple": "Check SPF records using dig TXT",
          "hi": "dig TXT से SPF record inspect करें"
        },
        "steps": [
          {
            "en": "Run `dig TXT target.com +short | grep v=spf1`.",
            "simple": "Run dig TXT to find SPF.",
            "hi": "`dig TXT target.com` चलाएँ।"
          },
          {
            "en": "Inspect the SPF policy: check for missing SPF or permissive `+all`.",
            "simple": "Check if +all or missing.",
            "hi": "Policy में `+all` या missing record देखें।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates missing SPF/DKIM as P5 (Informational) unless paired with DMARC inbox spoofing (P4).",
      "simple": "Rated P5 Informational unless emails land directly in the inbox.",
      "hi": "यह P5 Informational है जब तक inbox spoofing साबित न हो।"
    },
    "cwe": "CWE-290: Authentication Bypass by Spoofing"
  },
  "Server Security Misconfiguration › Clickjacking › Non-Sensitive Action": {
    "what": {
      "en": "A web page can be embedded inside an `<iframe>` on external websites, but the page performs no sensitive actions (e.g. static 'About Us', public search form, or terms of service).",
      "simple": "A public page can be loaded in an iframe, but there are no sensitive buttons to click.",
      "hi": "Non-sensitive public page (About Us, Terms) iframe में load हो सकती है पर उस पर कोई sensitive action नहीं होता।"
    },
    "find": [
      {
        "title": {
          "en": "Verify framing on non-sensitive pages",
          "simple": "Test framing on static pages",
          "hi": "Static pages पर iframe framing test करें"
        },
        "steps": [
          {
            "en": "Frame the public page inside a test HTML iframe.",
            "simple": "Put the page in an iframe.",
            "hi": "Page को test iframe में load करें।"
          },
          {
            "en": "Confirm that no state-changing or authenticated actions exist on the page.",
            "simple": "Confirm no sensitive actions exist.",
            "hi": "Confirm करें कि page पर कोई sensitive action नहीं है।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P5 in Bugcrowd VRT. Always Informational / Out of Scope.",
      "simple": "Rated P5 Informational / Out of Scope.",
      "hi": "यह P5 Informational / Out of Scope है।"
    },
    "cwe": "CWE-1021: Improper Restriction of Rendered UI Layers or Frames"
  },
  "Server Security Misconfiguration › Directory Listing Enabled › Non-Sensitive Data Exposure": {
    "what": {
      "en": "A web server directory listing is enabled (e.g. Apache `Options +Indexes`), but the exposed files consist purely of public static assets, images, CSS files, or open-source documentation.",
      "simple": "The server lets you browse a folder of files, but all the files inside are already public images or styles.",
      "hi": "Web server directory listing enabled है पर exposed files non-sensitive public assets (images, CSS) हैं।"
    },
    "find": [
      {
        "title": {
          "en": "Inspect directory listing index pages for sensitive files",
          "simple": "Browse open directory folders to check file contents",
          "hi": "Open directory folders खोलकर file contents inspect करें"
        },
        "steps": [
          {
            "en": "Navigate to `/images/` or `/static/` and observe the 'Index of /' directory listing.",
            "simple": "Open a folder URL in your browser.",
            "hi": "`/images/` या `/static/` open करके directory listing देखें।"
          },
          {
            "en": "Inspect file contents and verify that no private secrets or source code are present.",
            "simple": "Check that no secret files are inside.",
            "hi": "Confirm करें कि कोई secret keys या source code नहीं है।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P5 in Bugcrowd VRT. Triage treats non-sensitive directory listings as Informational.",
      "simple": "Rated P5 Informational.",
      "hi": "यह P5 Informational है क्योंकि data non-sensitive है।"
    },
    "cwe": "CWE-548: Exposure of Information Through Directory Listing"
  },
  "Server Security Misconfiguration › Misconfigured File Share › Non-Sensitive Data Exposure via Anonymous FTP/SMB Enabled": {
    "what": {
      "en": "An FTP or SMB server permits anonymous unauthenticated login (`anonymous` / blank password), but the shared folders contain only public documentation, installation packages, or non-sensitive marketing assets.",
      "simple": "An FTP or Windows file share allows anonymous login, but only holds public files.",
      "hi": "FTP या SMB server anonymous login allow करता है, पर shared files purely public documentation या marketing assets होती हैं।"
    },
    "find": [
      {
        "title": {
          "en": "Connect via anonymous FTP/SMB and list file shares",
          "simple": "Log in with username 'anonymous' and check shared files",
          "hi": "Anonymous login से FTP/SMB files list करें"
        },
        "steps": [
          {
            "en": "Connect via FTP: `ftp <target>` with username `anonymous` and blank password.",
            "simple": "Connect with ftp anonymous.",
            "hi": "`ftp <target>` में username `anonymous` से login करें।"
          },
          {
            "en": "List files and confirm that contents are non-sensitive public assets.",
            "simple": "Check that files are public.",
            "hi": "Files list करके verify करें कि data public है।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P5 in Bugcrowd VRT.",
      "simple": "Rated P5 Informational.",
      "hi": "यह P5 Informational है।"
    }
  },
  "Server Security Misconfiguration › Exposed Portal › Protected": {
    "what": {
      "en": "An administrative or internal management login portal is reachable from the public internet, but is fully protected by strong multi-factor authentication, enterprise SSO, or strict credentials with no bypass.",
      "simple": "An admin login screen is visible on the web, but it is properly locked down with strong authentication and cannot be bypassed.",
      "hi": "Admin portal public internet पर visible है पर strong multi-factor authentication या SSO से securely protected है और कोई bypass नहीं है।"
    },
    "find": [
      {
        "title": {
          "en": "Evaluate authentication protections on exposed portals",
          "simple": "Test if the portal enforces strong auth",
          "hi": "Portal authentication protections inspect करें"
        },
        "steps": [
          {
            "en": "Locate the portal login screen.",
            "simple": "Open the login screen.",
            "hi": "Portal login screen locate करें।"
          },
          {
            "en": "Verify that strong SSO/MFA is enforced on all access.",
            "simple": "Verify that strong login is required.",
            "hi": "Confirm करें कि strong authentication required है।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P5 in Bugcrowd VRT. Merely finding an authentication screen without an auth bypass is Informational.",
      "simple": "Rated P5 Informational / Not a vulnerability.",
      "hi": "यह P5 Informational है क्योंकि login screen मिलना vulnerability नहीं है जब तक bypass न हो।"
    },
    "cwe": "CWE-200: Exposure of Sensitive Information to an Unauthorized Actor"
  },
  "Server Security Misconfiguration › Lack of Security Headers › Public-Key-Pins": {
    "what": {
      "en": "The application lacks the deprecated `Public-Key-Pins` (HPKP) header. HPKP was deprecated across all modern browsers due to self-denial-of-service risks.",
      "simple": "The site doesn't have HPKP headers, an old security feature that was removed from browsers because it caused websites to brick themselves.",
      "hi": "Application deprecated `Public-Key-Pins` (HPKP) header use नहीं करती। HPKP को modern browsers ने self-DoS risk के कारण बंद कर दिया है।"
    },
    "find": [
      {
        "title": {
          "en": "Audit deprecated HPKP headers",
          "simple": "Check headers for HPKP",
          "hi": "Headers में HPKP inspect करें"
        },
        "steps": [
          {
            "en": "Inspect response headers via curl.",
            "simple": "Run curl -I.",
            "hi": "curl -I से headers inspect करें।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P5 in Bugcrowd VRT. Always Informational / Deprecated.",
      "simple": "Rated P5 Informational / Deprecated feature.",
      "hi": "यह P5 Informational / Deprecated header है।"
    },
    "cwe": "CWE-16: Configuration"
  },
  "Server Security Misconfiguration › Fingerprinting/Banner Disclosure › Software Versions Disclosed in Response Headers": {
    "what": {
      "en": "The web server returns detailed software and version banners in HTTP response headers (e.g. `Server: Apache/2.4.41 (Ubuntu)`, `X-Powered-By: PHP/7.4.3`), aiding attacker reconnaissance.",
      "simple": "The web server proudly announces its exact software version (like Apache 2.4.41) in every HTTP response.",
      "hi": "Web server HTTP response headers (Server, X-Powered-By) में exact software version expose करता है, जिससे attacker को reconnaissance में मदद मिलती है।"
    },
    "find": [
      {
        "title": {
          "en": "Inspect HTTP response headers for version banners",
          "simple": "Check Server and X-Powered-By headers with curl -I",
          "hi": "curl -I चलाकर Server और X-Powered-By headers inspect करें"
        },
        "steps": [
          {
            "en": "Run `curl -I https://target.com/`.",
            "simple": "Run curl -I.",
            "hi": "`curl -I https://target.com` चलाएँ।"
          },
          {
            "en": "Check for detailed `Server:` or `X-Powered-By:` headers revealing exact versions.",
            "simple": "Look for version numbers in the headers.",
            "hi": "Headers में software version numbers identify करें।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P5 in Bugcrowd VRT. Programs universally exclude banner disclosure as Informational unless a functional exploit for that exact version is demonstrated.",
      "simple": "Rated P5 Informational / Out of Scope.",
      "hi": "यह P5 Informational / Out of Scope है जब तक उस version का working exploit न दिखाया जाए।"
    }
  },
  "Server Security Misconfiguration › Lack of Security Headers › Strict-Transport-Security": {
    "what": {
      "en": "The web application omits the `Strict-Transport-Security` (HSTS) header (or specifies a very short `max-age`), failing to instruct browsers to permanently upgrade all insecure HTTP connections to HTTPS.",
      "simple": "The website doesn't tell your browser to always use HTTPS, leaving open the possibility of SSL-stripping attacks on public Wi-Fi.",
      "hi": "Application `Strict-Transport-Security` (HSTS) header omit करती है, जिससे first-time HTTP requests automatically HTTPS में upgrade नहीं होतीं (SSL stripping risk)।"
    },
    "find": [
      {
        "title": {
          "en": "Inspect HSTS headers in curl output",
          "simple": "Check if Strict-Transport-Security header exists",
          "hi": "curl output में Strict-Transport-Security header inspect करें"
        },
        "steps": [
          {
            "en": "Run `curl -I https://target.com/`.",
            "simple": "Check headers with curl -I.",
            "hi": "`curl -I https://target.com` चलाएँ।"
          },
          {
            "en": "Verify absence of `Strict-Transport-Security: max-age=...`.",
            "simple": "Check that HSTS is missing.",
            "hi": "Verify करें कि HSTS header missing है।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P5 in Bugcrowd VRT. Programs exclude missing HSTS as an Informational hardening issue.",
      "simple": "Rated P5 Informational / Out of Scope.",
      "hi": "यह P5 Informational / Out of Scope है।"
    },
    "cwe": "CWE-16: Configuration"
  },
  "Server Security Misconfiguration › Lack of Security Headers › X-Content-Security-Policy": {
    "what": {
      "en": "The application lacks the deprecated vendor-prefixed `X-Content-Security-Policy` header historically used by Firefox prior to standard CSP adoption.",
      "simple": "The website doesn't use the ancient Firefox-specific CSP header.",
      "hi": "Application पुराना experimental `X-Content-Security-Policy` header use नहीं करती।"
    },
    "find": [
      {
        "title": {
          "en": "Check legacy header presence",
          "simple": "Inspect headers with curl",
          "hi": "curl से headers inspect करें"
        },
        "steps": [
          {
            "en": "Run `curl -I https://target.com/`.",
            "simple": "Run curl -I.",
            "hi": "curl -I चलाएँ।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P5 in Bugcrowd VRT. Deprecated / Informational.",
      "simple": "Rated P5 Informational.",
      "hi": "यह P5 Informational है।"
    },
    "cwe": "CWE-16: Configuration"
  },
  "Server Security Misconfiguration › Lack of Security Headers › X-Content-Type-Options": {
    "what": {
      "en": "The application omits `X-Content-Type-Options: nosniff`, allowing older browsers to MIME-sniff response bodies and execute script hidden in image files.",
      "simple": "The site doesn't set X-Content-Type-Options: nosniff, allowing browsers to guess file types.",
      "hi": "Application `X-Content-Type-Options: nosniff` header omit करती है, जिससे browsers MIME-sniffing perform कर सकते हैं।"
    },
    "find": [
      {
        "title": {
          "en": "Check for X-Content-Type-Options header",
          "simple": "Check if nosniff header is present",
          "hi": "nosniff header inspect करें"
        },
        "steps": [
          {
            "en": "Run `curl -I https://target.com/`.",
            "simple": "Run curl -I.",
            "hi": "curl -I चलाएँ।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P5 in Bugcrowd VRT. Out of Scope in almost all programs.",
      "simple": "Rated P5 Informational / Out of Scope.",
      "hi": "यह P5 Informational / Out of Scope है।"
    },
    "cwe": "CWE-16: Configuration"
  },
  "Server Security Misconfiguration › Lack of Security Headers › X-Frame-Options": {
    "what": {
      "en": "The application omits `X-Frame-Options` and CSP `frame-ancestors`, permitting pages to be framed across origins.",
      "simple": "The site doesn't set X-Frame-Options to stop framing.",
      "hi": "Application `X-Frame-Options` header omit करती है।"
    },
    "find": [
      {
        "title": {
          "en": "Check for X-Frame-Options header",
          "simple": "Check if X-Frame-Options header exists",
          "hi": "X-Frame-Options header inspect करें"
        },
        "steps": [
          {
            "en": "Run `curl -I https://target.com/`.",
            "simple": "Run curl -I.",
            "hi": "curl -I चलाएँ।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P5 in Bugcrowd VRT unless paired with an exploited sensitive clickjacking action.",
      "simple": "Rated P5 Informational / Out of Scope.",
      "hi": "यह P5 Informational / Out of Scope है।"
    },
    "cwe": "CWE-1021: Improper Restriction of Rendered UI Layers or Frames"
  },
  "Server Security Misconfiguration › Lack of Security Headers › X-Webkit-CSP": {
    "what": {
      "en": "The application lacks the deprecated WebKit-prefixed `X-Webkit-CSP` header historically used by Chrome and Safari.",
      "simple": "The website doesn't use the ancient WebKit-specific CSP header.",
      "hi": "Application पुराना experimental `X-Webkit-CSP` header use नहीं करती।"
    },
    "find": [
      {
        "title": {
          "en": "Check legacy WebKit headers",
          "simple": "Inspect headers with curl",
          "hi": "curl से headers inspect करें"
        },
        "steps": [
          {
            "en": "Run `curl -I https://target.com/`.",
            "simple": "Run curl -I.",
            "hi": "curl -I चलाएँ।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P5 in Bugcrowd VRT. Deprecated / Informational.",
      "simple": "Rated P5 Informational.",
      "hi": "यह P5 Informational है।"
    },
    "cwe": "CWE-16: Configuration"
  },
  "Server Security Misconfiguration › Lack of Security Headers › X-XSS-Protection": {
    "what": {
      "en": "The application omits `X-XSS-Protection`. Modern browsers have removed legacy XSS Auditor filters because the filter itself introduced vulnerabilities; omitting it is recommended modern practice.",
      "simple": "The site doesn't have the old X-XSS-Protection header, which is actually good practice because modern browsers deleted that feature.",
      "hi": "Application `X-XSS-Protection` header omit करती है। Modern browsers ने XSS Auditor को खुद हटा दिया है।"
    },
    "find": [
      {
        "title": {
          "en": "Check X-XSS-Protection header",
          "simple": "Inspect headers with curl",
          "hi": "curl से headers inspect करें"
        },
        "steps": [
          {
            "en": "Run `curl -I https://target.com/`.",
            "simple": "Run curl -I.",
            "hi": "curl -I चलाएँ।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Rated P5 in Bugcrowd VRT. Universally excluded as Informational.",
      "simple": "Rated P5 Informational / Out of Scope.",
      "hi": "यह P5 Informational / Out of Scope है।"
    },
    "cwe": "CWE-16: Configuration"
  },
  "Server Security Misconfiguration › Misconfigured File Share › Anonymous FTP Enabled": {
    "what": {
      "en": "An FTP server (port 21) allows anonymous unauthenticated login (`anonymous` / blank password) and grants access to write files or view confidential directories.",
      "simple": "An FTP server allows anyone to log in without a password, and contains sensitive files or allows uploading files.",
      "hi": "FTP server anonymous login allow करता है और sensitive directories access या arbitrary file write permissions देता है।"
    },
    "find": [
      {
        "title": {
          "en": "Test anonymous FTP login and permissions",
          "simple": "Log in with anonymous on port 21 and test writing files",
          "hi": "Port 21 पर anonymous FTP login और file write test करें"
        },
        "steps": [
          {
            "en": "Connect via FTP: `ftp <target_ip>` with user `anonymous`.",
            "simple": "Connect with ftp anonymous.",
            "hi": "`ftp <target_ip>` से anonymous login करें।"
          },
          {
            "en": "Attempt to list directories and upload a test file (`put test.txt`).",
            "simple": "Try listing and uploading files.",
            "hi": "Directories list करें और `put test.txt` से write permission test करें।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates this as 'varies' (P1 if arbitrary write leads to RCE, P2 for sensitive data, P5 for public files). Triage needs connection logs and directory output.",
      "simple": "Show the FTP connection and list of files or upload proof. Priority depends on what you can access.",
      "hi": "Connection logs और directory output दें। RCE होने पर P1, sensitive data होने पर P2, public files होने पर P5।"
    }
  },
  "Server Security Misconfiguration › Misconfigured File Share › Anonymous SMB Enabled": {
    "what": {
      "en": "A Server Message Block (SMB / port 445) file share permits null sessions or guest access, allowing unauthenticated remote network users to read internal documents, backups, or write executable binaries.",
      "simple": "A Windows file share allows anyone on the network to access it without a password.",
      "hi": "SMB file share (port 445) null session / anonymous guest access allow करता है, जिससे unauthenticated users internal documents या backups read कर सकते हैं।"
    },
    "find": [
      {
        "title": {
          "en": "Enumerate SMB shares using smbclient or crackmapexec",
          "simple": "Check SMB shares with smbclient -N",
          "hi": "smbclient -N से anonymous SMB shares enumerate करें"
        },
        "steps": [
          {
            "en": "Run `smbclient -L //<target_ip> -N` to list shares without password.",
            "simple": "List shares using smbclient -N.",
            "hi": "`smbclient -L //<target> -N` चलाकर shares list करें।"
          },
          {
            "en": "Connect to readable shares: `smbclient //<target_ip>/share -N`.",
            "simple": "Connect to readable shares.",
            "hi": "Readable shares में connect करके files inspect करें।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Priority varies (P1 to P4). Triage requires: smbclient output showing enumerated shares and access to confidential files.",
      "simple": "Show the smbclient terminal output showing accessible shares and files.",
      "hi": "smbclient output और accessible files का screenshot दें। Severity data पर निर्भर करती है।"
    }
  },
  "Server Security Misconfiguration › Cache Deception": {
    "what": {
      "en": "Web Cache Deception occurs when a reverse proxy or CDN caches responses for URLs ending in static extensions (e.g. `/profile/settings.css`), while the backend application ignores the trailing extension and returns sensitive authenticated user data. An attacker tricks a victim into visiting the URL, and the CDN caches the victim's private profile for the attacker to read.",
      "simple": "By tricking the server into thinking a private page is a CSS file, the caching server saves your private account details and lets anyone view them.",
      "hi": "Web Cache Deception तब होता है जब CDN static extension (जैसे `/profile/test.css`) देखकर response cache कर लेता है, जबकि backend user का private data return कर देता है। Attacker link share करके victim का private profile CDN cache से steal कर लेता है।"
    },
    "find": [
      {
        "title": {
          "en": "Test path confusion and cache headers across authenticated endpoints",
          "simple": "Add .css to an account page URL and check if the CDN caches it",
          "hi": "Authenticated URL के आगे .css लगाकर CDN cache headers inspect करें"
        },
        "steps": [
          {
            "en": "While authenticated, navigate to `/api/user/profile.css` or `/account/settings/test.js`.",
            "simple": "Add .css to your profile URL.",
            "hi": "Profile URL के आगे `.css` या `.js` लगाकर request भेजें।"
          },
          {
            "en": "Verify whether the backend ignores the extension and returns your private profile data with 200 OK.",
            "simple": "Check if your private data is returned.",
            "hi": "Check करें कि क्या backend 200 OK के साथ private data return करता है।"
          },
          {
            "en": "In an unauthenticated incognito browser, request the exact same URL and check response headers: look for `X-Cache: HIT` or `CF-Cache-Status: HIT` revealing the victim's data.",
            "simple": "Open the same URL logged out and see if your profile appears with a cache HIT header.",
            "hi": "Logged out window में वही URL open करें और `X-Cache: HIT` के साथ private data observe करें।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates Web Cache Deception as 'varies' (P1 to P3 depending on data sensitivity). Triage requires: the request sequence, proof of `X-Cache: HIT`, and unauthenticated disclosure of victim PII.",
      "simple": "Show the cached URL returning a victim's private data to a logged-out user with a cache HIT header.",
      "hi": "Request sequence, `X-Cache: HIT` header, और unauthenticated window में victim का private data disclosure का screenshot दें। P1-P3 priority है।"
    },
    "cwe": "CWE-525: Use of Web Browser Cache Containing Sensitive Information",
    "references": [
      {
        "label": "PortSwigger Web Security: Web Cache Deception",
        "url": "https://portswigger.net/web-security/web-cache-deception"
      }
    ]
  },
  "Server Security Misconfiguration › Cache Poisoning": {
    "what": {
      "en": "An attacker exploits unkeyed HTTP headers (such as `X-Forwarded-Host`, `X-Original-URL`, or header normalization flaws) to store a malicious response (e.g. an open redirect or injected JavaScript script tag) into a shared web cache or CDN. Every subsequent user who requests the legitimate web page receives the poisoned response.",
      "simple": "A hacker sends a tricky request that tricks the caching server into saving a broken or malicious version of the homepage for everyone who visits.",
      "hi": "Attacker unkeyed HTTP headers (`X-Forwarded-Host`) का उपयोग करके shared web cache या CDN में malicious response (जैसे XSS या redirect) store करवा देता है। इसके बाद website खोलने वाले सभी legitimate users को poisoned page मिलता है।"
    },
    "find": [
      {
        "title": {
          "en": "Identify unkeyed headers using Param Miner / Burp Suite",
          "simple": "Use Param Miner in Burp to find unkeyed headers that change the page",
          "hi": "Burp Param Miner से unkeyed headers ढूँढें जो response alter करते हैं"
        },
        "steps": [
          {
            "en": "Use Burp Param Miner to discover unkeyed headers (e.g. `X-Forwarded-Host`, `X-Host`).",
            "simple": "Find unkeyed headers in Burp.",
            "hi": "Param Miner से unkeyed headers discover करें।"
          },
          {
            "en": "Inject an external host value with a cache-buster query: `GET /?cb=123` with `X-Forwarded-Host: attacker.com`.",
            "simple": "Send the unkeyed header with a test query string.",
            "hi": "Cache-buster query के साथ unkeyed header inject करें।"
          },
          {
            "en": "Request `GET /?cb=123` without the header from a second client and verify if the poisoned response is served with `X-Cache: HIT`.",
            "simple": "Request the same link from another browser to see the poisoned cache HIT.",
            "hi": "Header हटाकर दुबारा request करें और `X-Cache: HIT` के साथ injected content verify करें।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates Web Cache Poisoning as 'varies' (P1 to P3). Triage requires: the unkeyed input identification, the caching headers proving cache retention (`Age`, `X-Cache: HIT`), and the poisoned response served to a neutral client.",
      "simple": "Provide the request that poisoned the cache and a clean request from another browser showing the poisoned content served from cache.",
      "hi": "Poisoning request, cache headers (`Age`, `X-Cache: HIT`), और neutral client को served poisoned response का capture दें।"
    },
    "references": [
      {
        "label": "PortSwigger Web Security: Web Cache Poisoning",
        "url": "https://portswigger.net/web-security/web-cache-poisoning"
      }
    ]
  },
  "Server Security Misconfiguration › HTTP Request Smuggling": {
    "what": {
      "en": "Discrepancies in how front-end reverse proxies (Cloudflare, HAProxy, AWS ALB) and backend web servers interpret ambiguous HTTP/1.1 request boundaries (e.g. `Content-Length` vs `Transfer-Encoding: chunked` / CL.TE, TE.CL, TE.TE) allow an attacker to smuggle an unparsed HTTP prefix into the backend connection pool. The smuggled request attaches to the next legitimate user's request, enabling credential hijacking, cache poisoning, and access control bypass.",
      "simple": "Because the front-end proxy and back-end server disagree on where one HTTP request ends and the next begins, a hacker can sneak a secret request inside that hijacks the next user's click.",
      "hi": "Front-end reverse proxy और backend server के बीच HTTP request boundary interpretation (Content-Length vs Transfer-Encoding) में अंतर होने के कारण attacker connection pool में smuggled request inject कर देता है। Smuggled request अगले user की request से attach होकर उसका session hijack कर सकती है।"
    },
    "find": [
      {
        "title": {
          "en": "Probe HTTP desynchronization using HTTP Request Smuggler",
          "simple": "Test CL.TE and TE.CL time-delay differentials using Burp Smuggler",
          "hi": "Burp Suite में CL.TE और TE.CL differential time delay probe करें"
        },
        "steps": [
          {
            "en": "In Burp Suite, identify endpoints that support HTTP/1.1 chunked encoding.",
            "simple": "Look for HTTP/1.1 POST endpoints.",
            "hi": "HTTP/1.1 POST endpoints identify करें।"
          },
          {
            "en": "Send a CL.TE probe with conflicting `Content-Length` and obfuscated `Transfer-Encoding: chunked` (e.g. `Transfer-Encoding: xchunked`).",
            "simple": "Send conflicting Content-Length and Transfer-Encoding headers.",
            "hi": "Conflicting `Content-Length` और obfuscated `Transfer-Encoding` headers भेजें।"
          },
          {
            "en": "Measure time delays: an obfuscation that causes the backend to wait for missing chunk data triggers a 10-second timeout.",
            "simple": "Check if the server pauses for 10 seconds waiting for data.",
            "hi": "Time delay observe करें: क्या backend missing chunk data के लिए pause करता है?"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates HTTP Request Smuggling as 'varies' (P1 to P3). Triage requires: a reproducible HTTP request showing differential timeout or proof of capturing a secondary request's headers in Repeater.",
      "simple": "Show the time-delay proof or evidence of a smuggled request capturing another user's session.",
      "hi": "Differential timeout capture या smuggled request से session capture होने का proof दें। High impact पर P1 priority है।"
    },
    "references": [
      {
        "label": "PortSwigger Web Security: HTTP Request Smuggling",
        "url": "https://portswigger.net/web-security/request-smuggling"
      }
    ]
  },
  "Server Security Misconfiguration › Directory Listing Enabled › Sensitive Data Exposure": {
    "what": {
      "en": "A web server directory listing is enabled on a directory containing confidential files, such as database backups (`.sql`, `.dump`), source code archives (`.zip`, `.tar.gz`), environment configurations (`.env`), SSL private keys (`.key`, `.pem`), or sensitive internal logs.",
      "simple": "The web server allows browsing a folder that contains secret database backups, passwords, or company source code files.",
      "hi": "Web server directory listing ऐसे folder पर enabled है जिसमें database backups (`.sql`), source code archives (`.zip`), `.env` files या private keys पड़ी हैं। Attacker सीधे sensitive assets download कर सकता है।"
    },
    "find": [
      {
        "title": {
          "en": "Discover open directory listings containing sensitive backup files",
          "simple": "Find directory listings with database dumps and source code",
          "hi": "Database dumps और backup files वाली open directories ढूँढें"
        },
        "steps": [
          {
            "en": "Crawl directories and probe common paths: `/backup/`, `/backups/`, `/dumps/`, `/logs/`, `/db/`.",
            "simple": "Search for backup folder names in URLs.",
            "hi": "`/backup/`, `/dumps/`, `/logs/` paths inspect करें।"
          },
          {
            "en": "Observe the Apache/Nginx directory listing index page.",
            "simple": "Open the folder index page.",
            "hi": "'Index of /' directory listing page identify करें।"
          },
          {
            "en": "Verify whether downloadable files contain database credentials, customer PII, or application source code.",
            "simple": "Check file names for database dumps or secret keys.",
            "hi": "Verify करें कि files में database dumps या `.env` configs मौजूद हैं।"
          }
        ]
      }
    ],
    "proof": {
      "en": "Bugcrowd rates sensitive directory listing as 'varies' (P1 to P2 depending on data sensitivity). Triage requires: the directory URL, screenshot of the directory index showing sensitive filenames, and minimal non-destructive sample verification.",
      "simple": "Show the directory index containing backup files and the public URL. P1 or P2 priority.",
      "hi": "Directory URL, index page का screenshot जिसमें sensitive filenames दिखें, और non-destructive verification दें। P1/P2 priority है।"
    },
    "cwe": "CWE-548: Exposure of Information Through Directory Listing"
  }
};
