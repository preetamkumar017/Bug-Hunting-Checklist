/**
 * Attack Chain Knowledge Base & Next-Action Decision Engine.
 * Provides prioritized, step-by-step offensive chains when hunters discover specific recon artifacts:
 * - Subdomain Discovered
 * - Origin IP Discovered (Bypassing Cloudflare/WAF)
 * - Cloud Storage / S3 Bucket
 * - 403 Forbidden / Protected Path
 * - Exposed Tech Stack (Spring Boot, Jenkins, GraphQL)
 * - Secret Token / API Key Leaked
 * - OAuth / SSO Login Endpoint
 * - High-Value Financial / Coupon Transaction
 */

export interface AttackStep {
  id: string;
  title: string;
  badge: "P1" | "P2" | "P3" | "Recon" | "Bypass";
  objective: {
    en: string;
    simple: string;
    hi: string;
  };
  commandTemplate: string;
  expectedVulnerable: {
    en: string;
    simple: string;
    hi: string;
  };
  expectedSafe: {
    en: string;
    simple: string;
    hi: string;
  };
  bountyTip: {
    en: string;
    simple: string;
    hi: string;
  };
  playbookRoute?: string;
  playbookLabel?: string;
}

export interface AttackChainCategory {
  id: string;
  title: string;
  artifactName: string;
  emoji: string;
  description: {
    en: string;
    simple: string;
    hi: string;
  };
  accentColor: "cyan" | "emerald" | "amber" | "rose" | "violet" | "sky" | "fuchsia" | "lime";
  steps: AttackStep[];
}

export const ATTACK_CHAINS: AttackChainCategory[] = [
  // ─── 1. SUBDOMAIN DISCOVERED ────────────────────────────────────────────────
  {
    id: "subdomain",
    title: "Subdomain Discovered",
    artifactName: "Active Subdomain (e.g. dev.target.com, api.target.com)",
    emoji: "🌐",
    accentColor: "cyan",
    description: {
      en: "A new subdomain was enumerated. Prioritize dangling CNAME takeovers, CORS trust flaws, non-standard port sweeps, and secret file exposures.",
      simple: "You found a subdomain. Check for takeovers, CORS bugs, and hidden files.",
      hi: "नया सबडोमेन मिला है। पहले टेकओवर (CNAME), CORS मिसकॉन्फिगरेशन, अनकॉमन पोर्ट्स और हिडन फाइल्स चेक करें।",
    },
    steps: [
      {
        id: "sub-takeover",
        title: "Dangling CNAME & Cloud Takeover Check",
        badge: "P1",
        objective: {
          en: "Query DNS CNAME records to identify abandoned cloud assets (AWS S3, GitHub Pages, Heroku, Azure Traffic Manager).",
          simple: "Check if the subdomain points to an unclaimed cloud service.",
          hi: "DNS CNAME चेक करें कि क्या यह किसी लावारिस AWS S3 या Heroku बकेट की ओर इशारा कर रहा है।",
        },
        commandTemplate: `dig CNAME {SUBDOMAIN} +short\ndnsx -l subs.txt -cname -resp -silent`,
        expectedVulnerable: {
          en: "CNAME points to unclaimed s3-website.amazonaws.com, gh-pages, or yields NXDOMAIN while CNAME persists.",
          simple: "Points to an unclaimed cloud service or returns 404 with a provider signature.",
          hi: "CNAME किसी डिलीट की हुई बकेट या अनक्लेम्ड सर्विस (NoSuchBucket) पर ले जाता है।",
        },
        expectedSafe: {
          en: "CNAME resolves to active corporate IP or returns NOERROR with valid TLS certificate.",
          simple: "Subdomain is actively claimed and owned by the company.",
          hi: "सबडोमेन कंपनी के एक्टिव इन्फ्रास्ट्रक्चर से पूरी तरह जुड़ा हुआ है।",
        },
        bountyTip: {
          en: "Always inspect AWS S3 and Fastly CNAMEs — companies delete cloud buckets without deleting DNS records.",
          simple: "Companies often delete buckets but forget to remove DNS CNAME entries.",
          hi: "कंपनियां अक्सर S3 बकेट डिलीट कर देती हैं लेकिन DNS CNAME रिकॉर्ड हटाना भूल जाती हैं।",
        },
        playbookRoute: "/subdomain-takeover",
        playbookLabel: "Subdomain Takeover Playbook",
      },
      {
        id: "sub-ports",
        title: "Non-Standard Web Ports Sweep",
        badge: "Recon",
        objective: {
          en: "Probe ports 8080, 8443, 8888, 9000, 9443 for internal administration dashboards or staging microservices.",
          simple: "Find web services running on unusual ports like 8080 or 8443.",
          hi: "अनकॉमन पोर्ट्स (8080, 8443, 9000) पर चल रहे हिडन वेब पोर्टल्स को स्कैन करें।",
        },
        commandTemplate: `httpx -u "https://{SUBDOMAIN}" -ports 80,443,8080,8443,8888,9000,9443 -title -tech-detect -status-code`,
        expectedVulnerable: {
          en: "Port 8080 or 8443 responds with Spring Boot, Jenkins, Tomcat Manager, or Swagger UI without SSO.",
          simple: "Admin dashboard or developer panel exposed on high port without login.",
          hi: "पोर्ट 8080 या 8443 पर बिना लॉगिन वाला एडमिन डैशबोर्ड या Swagger UI खुलता है।",
        },
        expectedSafe: {
          en: "Connection refused, port closed by firewall, or strict corporate SSO gateway redirects.",
          simple: "Ports are closed or protected by corporate VPN/SSO.",
          hi: "पोर्ट्स फ़ायरवॉल द्वारा बंद हैं या सख्त VPN/SSO लगा हुआ है।",
        },
        bountyTip: {
          en: "Microservices exposed on port 8443 often bypass the main frontend WAF and rate limiters.",
          simple: "Port 8443 often lacks the main website's WAF and rate limiting.",
          hi: "पोर्ट 8443 पर चलने वाली सर्विसेज पर मुख्य WAF और रेट-लिमिटर अक्सर नहीं होते।",
        },
      },
      {
        id: "sub-cors",
        title: "CORS Misconfiguration & Origin Trust Abuse",
        badge: "P2",
        objective: {
          en: "Send an untrusted Origin header to test if the API reflects arbitrary origins with Access-Control-Allow-Credentials: true.",
          simple: "Check if the subdomain allows any website to steal user data via CORS.",
          hi: "चेक करें कि क्या यह API किसी भी वेबसाइट (Origin: evil.com) को यूजर डेटा चुराने देती है।",
        },
        commandTemplate: `curl -i -H "Origin: https://evil.com" -H "Access-Control-Request-Method: GET" "https://{SUBDOMAIN}/api/user"`,
        expectedVulnerable: {
          en: "Access-Control-Allow-Origin: https://evil.com AND Access-Control-Allow-Credentials: true in response.",
          simple: "API returns your evil origin with allow-credentials set to true.",
          hi: "जवाब में Access-Control-Allow-Origin: https://evil.com और Credentials: true मिलता है।",
        },
        expectedSafe: {
          en: "Access-Control-Allow-Origin is absent, set to strict whitelist, or credentials header is false.",
          simple: "Evil origin is rejected or ignored.",
          hi: "सिर्फ ऑथराइज्ड डोमेन ही अलाउड होते हैं या क्रेडेंशियल false होता है।",
        },
        bountyTip: {
          en: "Also test null origin: curl -H 'Origin: null'. Sandboxed iframes send null origins and often bypass naive regexes.",
          simple: "Test with Origin: null which is often whitelisted by mistake.",
          hi: "Origin: null भी टेस्ट करें; कई डेवलपर्स ग़लती से null को वाइटलिस्ट कर देते हैं।",
        },
      },
      {
        id: "sub-fuzz",
        title: "Sensitive Root Files & Git Leak Fuzzing",
        badge: "P2",
        objective: {
          en: "Fuzz for uncompiled source code, config files, backups, and environment secrets exposed in the web root.",
          simple: "Search for exposed .git folders, .env files, and backups.",
          hi: "वेब रूट में छूटे .git/config, .env और डेटाबेस बैकअप्स को फ़ज़ करें।",
        },
        commandTemplate: `ffuf -u "https://{SUBDOMAIN}/FUZZ" -w common.txt -e .git/config,.env,.json,.bak,.old,.swp -mc 200,301,302,403 -c`,
        expectedVulnerable: {
          en: "HTTP 200 on /.git/config returning [core] repositoryformatversion, or raw .env with DB_PASSWORD.",
          simple: "Downloadable .git directory or .env file containing database passwords.",
          hi: "HTTP 200 पर /.git/config या .env फाइल डाउनलोड होती है जिसमें पासवर्ड्स होते हैं।",
        },
        expectedSafe: {
          en: "HTTP 404 Not Found, static 403 denied by server engine, or custom not-found page.",
          simple: "Files return 404 or are completely blocked.",
          hi: "फाइल्स 404 देती हैं या वेब सर्वर द्वारा ब्लॉक की गई हैं।",
        },
        bountyTip: {
          en: "If .git returns 403 Forbidden, test /.git/HEAD and /.git/logs/HEAD — often directory index is blocked but files are readable!",
          simple: "If /.git returns 403, check /.git/HEAD directly.",
          hi: "अगर /.git 403 देता है तो डायरेक्ट /.git/HEAD टेस्ट करें; फाइल अक्सर खुली होती है!",
        },
      },
    ],
  },

  // ─── 2. ORIGIN IP DISCOVERED (CLOUDFLARE BYPASS) ─────────────────────────────
  {
    id: "origin_ip",
    title: "Origin IP Discovered (WAF / CDN Bypass)",
    artifactName: "Real Server IP (e.g. 198.51.100.25)",
    emoji: "⚡",
    accentColor: "amber",
    description: {
      en: "You uncovered the true backend server IP hiding behind Cloudflare, Akamai, or AWS CloudFront. You can now bypass all WAF protections, rate limits, and DDoS shields.",
      simple: "You found the backend IP behind Cloudflare. Now bypass WAF and test directly.",
      hi: "Cloudflare के पीछे का असली सर्वर IP मिल गया है। अब आप बिना WAF और बिना रेट-लिमिट के सीधे सर्वर पर अटैक कर सकते हैं।",
    },
    steps: [
      {
        id: "ip-host-header",
        title: "Direct Host Header Verification",
        badge: "Bypass",
        objective: {
          en: "Send an HTTPS request directly to the origin IP with the virtual Host header to verify it serves the genuine application.",
          simple: "Confirm this IP serves your target application when given the Host header.",
          hi: "ओरिजिनल IP पर Host: {TARGET} हेडर लगाकर रिक्वेस्ट भेजें और कन्फर्म करें कि यह वही वेबसाइट है।",
        },
        commandTemplate: `curl -k -i -H "Host: {TARGET}" "https://{ORIGIN_IP}/"`,
        expectedVulnerable: {
          en: "HTTP 200/302 matching the target website's genuine HTML, title, and cookies without any Cloudflare headers.",
          simple: "Target site loads directly from IP with no Cloudflare headers in response.",
          hi: "टारगेट साइट का असली रिस्पॉन्स लोड होता है और रिस्पॉन्स में कोई Cloudflare हेडर नहीं होता।",
        },
        expectedSafe: {
          en: "HTTP 403 Cloudflare Direct IP Access Denied, 521 Origin Down, or generic hosting default page.",
          simple: "Direct IP returns an error or default hosting placeholder.",
          hi: "IP डायरेक्ट एक्सेस ब्लॉक करता है या जेनेरिक डिफ़ॉल्ट पेज देता है।",
        },
        bountyTip: {
          en: "Look at the HTTP response headers: missing 'cf-ray' or 'server: cloudflare' proves you are talking straight to the origin!",
          simple: "Missing 'cf-ray' header proves you bypassed Cloudflare.",
          hi: "अगर रिस्पॉन्स में 'cf-ray' हेडर नहीं है, तो समझें WAF 100% बाईपास हो चुका है!",
        },
        playbookRoute: "/cloudflare",
        playbookLabel: "Cloudflare Bypass Playbook",
      },
      {
        id: "ip-port-scan",
        title: "Unrestricted Full Port Sweep",
        badge: "P1",
        objective: {
          en: "Scan all 65,535 TCP ports on the origin IP. Cloudflare only proxies ports 80/443; internal management services are often nakedly exposed.",
          simple: "Scan the IP for exposed database, SSH, and admin ports.",
          hi: "ओरिजिनल IP के सभी पोर्ट्स स्कैन करें ताकि अनप्रोटेक्टेड डेटाबेस (Redis/MySQL) या SSH मिल सके।",
        },
        commandTemplate: `nmap -sV -sC -Pn -T4 -p 21,22,25,80,443,2082,2083,2087,3000,3306,5000,5432,6379,8000,8080,8443,8888,9000,9200 {ORIGIN_IP}`,
        expectedVulnerable: {
          en: "Open Redis (6379) unauthenticated, MySQL (3306), Elasticsearch (9200), or SSH on port 22.",
          simple: "Internal database or SSH service exposed directly to the public internet.",
          hi: "Redis (6379), Elasticsearch (9200) या MySQL पोर्ट बिना पासवर्ड के इंटरनेट पर खुला है।",
        },
        expectedSafe: {
          en: "All non-web ports are filtered by AWS Security Group / firewall.",
          simple: "All ports except 443 are blocked.",
          hi: "फ़ायरवॉल द्वारा सिर्फ 443 को छोड़कर बाकी सभी पोर्ट्स फ़िल्टर्ड हैं।",
        },
        bountyTip: {
          en: "If port 6379 is open, run: redis-cli -h {ORIGIN_IP} info. Unauthenticated Redis gives instant P1 RCE via crontab!",
          simple: "Unauthenticated Redis port 6379 allows instant remote code execution.",
          hi: "अगर पोर्ट 6379 खुला है तो redis-cli से कनेक्ट करें; बिना पासवर्ड वाला Redis तुरंत P1 RCE देता है!",
        },
      },
      {
        id: "ip-sans-cert",
        title: "SSL Certificate SANs Domain Extraction",
        badge: "Recon",
        objective: {
          en: "Extract the Subject Alternative Names (SANs) from the SSL certificate served by the origin IP to discover hidden internal domains.",
          simple: "Read the server's SSL certificate to find internal dev and staging domains.",
          hi: "सर्वर के SSL सर्टिफिकेट से सब्जेक्ट आल्टरनेटिव नेम्स (SANs) निकालकर इंटरनल डोमेन्स ढूंढें।",
        },
        commandTemplate: `openssl s_client -connect {ORIGIN_IP}:443 -servername {TARGET} </dev/null 2>/dev/null | openssl x509 -noout -text | grep -A1 "Subject Alternative Name"`,
        expectedVulnerable: {
          en: "Lists internal hostnames like vpn.internal.target.com, staging-auth.target.com, or dev-backend.target.com.",
          simple: "Reveals private subdomains listed inside the SSL certificate.",
          hi: "सर्टिफिकेट में प्राइवेट सबडोमेन (staging-api, vpn, dev) के नाम उजागर होते हैं।",
        },
        expectedSafe: {
          en: "Certificate is a generic wildcard (*.target.com) or self-signed dummy certificate.",
          simple: "Certificate only lists public domains or wildcard.",
          hi: "सर्टिफिकेट सिर्फ वाइल्डकार्ड (*.target.com) लिस्ट करता है।",
        },
        bountyTip: {
          en: "Test every uncovered SAN directly against this origin IP with curl -H 'Host: <san_domain>' https://{ORIGIN_IP}/.",
          simple: "Test every uncovered domain name with Host header against this IP.",
          hi: "मिले हुए हर SAN डोमेन को इसी IP पर Host हेडर लगाकर तुरंत टेस्ट करें।",
        },
      },
      {
        id: "ip-ratelimit-bypass",
        title: "WAF & Rate-Limit Free Fuzzing",
        badge: "Bypass",
        objective: {
          en: "Run high-speed brute-force attacks against login, OTP, and registration endpoints directly against the IP without triggering Cloudflare blocks.",
          simple: "Brute force login or OTP endpoints at high speed without WAF blocks.",
          hi: "बिना किसी Cloudflare ब्लॉक के लॉगिन या OTP एंडपॉइंट्स पर हाई-स्पीड ब्रूट-फ़ोर्स चलाएं।",
        },
        commandTemplate: `ffuf -u "https://{ORIGIN_IP}/api/v1/auth/login" -H "Host: {TARGET}" -d '{"username":"admin","password":"FUZZ"}' -w passwords.txt -t 50 -k`,
        expectedVulnerable: {
          en: "HTTP responses continue flowing without any 429 Too Many Requests or Cloudflare 1020/403 Captcha challenges.",
          simple: "Server processes hundreds of requests per second without rate-limiting you.",
          hi: "सैकड़ों रिक्वेस्ट्स प्रति सेकंड भेजने पर भी कोई 429 या Captcha चैलेंज नहीं आता।",
        },
        expectedSafe: {
          en: "Application-level rate limiting (e.g. Redis sliding window) enforces 429 after 5 failed attempts.",
          simple: "Application code itself blocks requests after several attempts.",
          hi: "एप्लीकेशन कोड 5 गलत प्रयासों के बाद खुद 429 Too Many Requests दे देता है।",
        },
        bountyTip: {
          en: "Report this as: 'WAF Bypass Leading to Unrestricted Rate Limiting & Brute Force on Authentication'.",
          simple: "Report as WAF bypass enabling unrestricted authentication brute force.",
          hi: "इसे 'WAF Bypass Leading to Unrestricted Rate Limiting' के रूप में रिपोर्ट करें।",
        },
      },
    ],
  },

  // ─── 3. CLOUD STORAGE & S3 BUCKET DISCOVERED ─────────────────────────────────
  {
    id: "cloud_bucket",
    title: "Cloud Storage / S3 Bucket Discovered",
    artifactName: "Bucket Name or URL (e.g. target-assets.s3.amazonaws.com)",
    emoji: "☁️",
    accentColor: "sky",
    description: {
      en: "An AWS S3, Google Cloud Storage, or Azure Blob bucket was identified in JavaScript, HTML, or mobile app decompilations. Test read permissions, write permissions, and bucket takeovers.",
      simple: "You found a cloud storage bucket. Check for public read, write, and takeover.",
      hi: "AWS S3 या Azure बकेट मिली है। अनऑथराइज्ड रीड, राइट परमिशन और बकेट टेकओवर चेक करें।",
    },
    steps: [
      {
        id: "s3-read",
        title: "Unauthenticated Read & File Listing",
        badge: "P2",
        objective: {
          en: "Verify if anonymous internet users can list all objects and download private company assets from the bucket.",
          simple: "Check if anyone can list and download files without logging in.",
          hi: "बिना AWS अकाउंट के बकेट के सभी ऑब्जेक्ट्स लिस्ट और डाउनलोड करने की कोशिश करें।",
        },
        commandTemplate: `aws s3 ls s3://{BUCKET} --no-sign-request\ncurl -s -I "https://{BUCKET}.s3.amazonaws.com"`,
        expectedVulnerable: {
          en: "Lists files (e.g. backups/, invoices/, users.csv, .env) with HTTP 200 XML index.",
          simple: "Bucket lists all filenames and allows direct download without login.",
          hi: "बकेट की सारी फाइल्स (.env, बैकअप्स, इनवॉइस) बिना लॉगिन के लिस्ट हो जाती हैं।",
        },
        expectedSafe: {
          en: "AccessDenied (403 Forbidden) with 'Access Denied' XML payload.",
          simple: "Returns Access Denied 403.",
          hi: "AccessDenied (HTTP 403) मिलता है।",
        },
        bountyTip: {
          en: "Also test with a signed valid AWS account: aws s3 ls s3://{BUCKET} --profile myaccount. Many buckets block anonymous users but allow any authenticated AWS user!",
          simple: "Test with your own AWS account — many buckets allow 'Any Authenticated AWS User'.",
          hi: "अपने पर्सनल AWS अकाउंट से भी टेस्ट करें; कई बकेट्स 'Any Authenticated AWS User' को अलाउ कर देती हैं!",
        },
      },
      {
        id: "s3-write",
        title: "Unauthenticated File Upload & Overwrite (Defacement/XSS)",
        badge: "P1",
        objective: {
          en: "Attempt to upload a harmless proof-of-concept file to the bucket without AWS credentials.",
          simple: "Test if anyone can upload or overwrite files in the bucket.",
          hi: "बकेट में बिना क्रेडेंशियल्स के एक harmless PoC फाइल अपलोड करने की कोशिश करें।",
        },
        commandTemplate: `echo "Bug Bounty PoC" > bbc_poc.txt\naws s3 cp bbc_poc.txt s3://{BUCKET}/bbc_poc.txt --no-sign-request`,
        expectedVulnerable: {
          en: "Upload succeeds: upload: ./bbc_poc.txt to s3://{BUCKET}/bbc_poc.txt.",
          simple: "File uploads successfully to the bucket.",
          hi: "फाइल सफलतापूर्वक अपलोड हो जाती है (P1 क्रिटिकल इम्पैक्ट)।",
        },
        expectedSafe: {
          en: "An error occurred (AccessDenied) when calling the PutObject operation.",
          simple: "Upload is blocked with AccessDenied.",
          hi: "PutObject पर AccessDenied एरर आता है।",
        },
        bountyTip: {
          en: "If the bucket hosts frontend assets (JS/HTML), write access allows 0-click Stored XSS / Supply Chain Attack against all target users!",
          simple: "Writing to a bucket hosting frontend assets allows stored XSS on all users.",
          hi: "अगर बकेट वेबसाइट की JS/CSS होस्ट करती है, तो राइट एक्सेस से सीधे 0-click Stored XSS हो सकता है!",
        },
      },
      {
        id: "s3-takeover",
        title: "Dangling Subdomain to S3 Takeover",
        badge: "P1",
        objective: {
          en: "If a company subdomain (e.g. assets.target.com) CNAMEs to {BUCKET}.s3.amazonaws.com and returns NoSuchBucket, claim the bucket name in your own AWS account.",
          simple: "Claim the abandoned bucket name in AWS to take over the subdomain.",
          hi: "अगर सबडोमेन NoSuchBucket दे रहा है, तो उस नाम की बकेट अपने AWS में बनाकर टेकओवर करें।",
        },
        commandTemplate: `curl -s "https://{SUBDOMAIN}" | grep "NoSuchBucket"\naws s3 mb s3://{BUCKET} --region us-east-1`,
        expectedVulnerable: {
          en: "Response includes '<Code>NoSuchBucket</Code> The specified bucket does not exist'.",
          simple: "Returns NoSuchBucket, meaning the bucket name is free to register.",
          hi: "NoSuchBucket एरर आता है, जिसका मतलब है कि बकेट नाम कोई भी क्लेम कर सकता है।",
        },
        expectedSafe: {
          en: "Bucket exists and is owned by target, or DNS CNAME is removed.",
          simple: "Bucket exists or DNS entry is cleanly deleted.",
          hi: "बकेट पहले से ओन्ड है या CNAME हटा दिया गया है।",
        },
        bountyTip: {
          en: "Once registered, place an index.html in the bucket with your bug bounty handle for bulletproof proof of takeover.",
          simple: "Create the bucket and upload an index.html showing your bug bounty handle.",
          hi: "बकेट बनाकर उसमें अपना हैंडल लिखा index.html डालें ताकि रिपोर्ट में पक्का सबूत रहे।",
        },
        playbookRoute: "/subdomain-takeover",
        playbookLabel: "Subdomain Takeover Playbook",
      },
    ],
  },

  // ─── 4. 403 FORBIDDEN / 401 PROTECTED PATH ──────────────────────────────────
  {
    id: "protected_path",
    title: "403 Forbidden / Protected Path Encountered",
    artifactName: "Protected Path (e.g. /admin, /api/internal)",
    emoji: "🚪",
    accentColor: "rose",
    description: {
      en: "An interesting endpoint was located but responded with 403 Forbidden or 401 Unauthorized. Test reverse proxy bypass headers, path normalization confusion, and HTTP method overrides.",
      simple: "You hit a 403 Forbidden page. Test headers and URL tricks to bypass it.",
      hi: "403 Forbidden पेज मिला है। रिवर्स प्रॉक्सी हेडर्स, पाथ नॉर्मलाइजेशन और मेथड ओवरराइड से बाईपास टेस्ट करें।",
    },
    steps: [
      {
        id: "403-proxy-headers",
        title: "Reverse Proxy Origin IP Spoofing",
        badge: "Bypass",
        objective: {
          en: "Send internal loopback IP headers (127.0.0.1) to trick front-end reverse proxies (Nginx/HAProxy) into treating you as localhost.",
          simple: "Send headers telling the server you are connecting from localhost.",
          hi: "हेडर्स (X-Forwarded-For: 127.0.0.1) भेजकर प्रॉक्सी को धोखा दें कि आप लोकलहोस्ट हैं।",
        },
        commandTemplate: `curl -i -H "X-Forwarded-For: 127.0.0.1" -H "X-Real-IP: 127.0.0.1" -H "X-Originating-IP: 127.0.0.1" -H "X-Custom-IP-Authorization: 127.0.0.1" "https://{TARGET}{PATH}"`,
        expectedVulnerable: {
          en: "HTTP 200 OK or administrative console HTML returned instead of HTTP 403.",
          simple: "Returns 200 OK and loads the protected admin panel.",
          hi: "403 की जगह 200 OK मिलता है और एडमिन पेज खुल जाता है।",
        },
        expectedSafe: {
          en: "Still HTTP 403 Forbidden; headers are scrubbed at perimeter proxy.",
          simple: "Still returns 403 Forbidden.",
          hi: "अभी भी 403 मिलता है क्योंकि प्रॉक्सी ने जाली हेडर्स साफ़ कर दिए।",
        },
        bountyTip: {
          en: "Also test client IP headers with localhost in hex: 0x7f000001 or decimal: 2130706433.",
          simple: "Try localhost representation in decimal (2130706433) or hex.",
          hi: "लोकलहोस्ट को डेसीमल (2130706433) या हेक्स (0x7f000001) में भी टेस्ट करें।",
        },
        playbookRoute: "/403-bypass",
        playbookLabel: "403 Forbidden Playbook",
      },
      {
        id: "403-path-normalization",
        title: "Path Normalization & Delimiter Confusion",
        badge: "Bypass",
        objective: {
          en: "Use path delimiters (.;, %20, %09, /./) to bypass URL path checks at the WAF/proxy while backend server executes the target path.",
          simple: "Use special characters in the URL path to bypass proxy rules.",
          hi: "पाथ में विशेष कैरेक्टर्स (..;, %20, /./) लगाकर WAF के पाथ फ़िल्टर को बाईपास करें।",
        },
        commandTemplate: `curl -i "https://{TARGET}{PATH}/"\ncurl -i "https://{TARGET}{PATH}..;/"\ncurl -i "https://{TARGET}{PATH}%20"\ncurl -i "https://{TARGET}/%2e/{PATH}"`,
        expectedVulnerable: {
          en: "One of the mutated URLs bypasses the WAF block rule and renders the internal endpoint.",
          simple: "One of the mutated URLs returns 200 OK.",
          hi: "म्यूटेटेड पाथ में से एक WAF को चकमा देकर 200 OK दे देता है।",
        },
        expectedSafe: {
          en: "HTTP 404 Not Found or uniform 403 across all variations.",
          simple: "Returns 404 or consistent 403.",
          hi: "404 मिलता है या सभी वेरिएशन्स पर 403 बना रहता है।",
        },
        bountyTip: {
          en: "Tomcat servers are notoriously vulnerable to '..;/' (semicolon path parameter confusion).",
          simple: "Tomcat servers frequently bypass restrictions with '..;/' syntax.",
          hi: "Apache Tomcat सर्वर्स '..;/' (semicolon confusion) से अक्सर बाईपास हो जाते हैं।",
        },
        playbookRoute: "/403-bypass",
        playbookLabel: "403 Forbidden Playbook",
      },
      {
        id: "403-method-tampering",
        title: "HTTP Verb Tampering & Method Override",
        badge: "Bypass",
        objective: {
          en: "Test if the authorization rule only restricts GET requests, allowing POST, PUT, HEAD, or X-HTTP-Method-Override to read data.",
          simple: "Change request method from GET to POST or use Method-Override header.",
          hi: "रिक्वेस्ट मेथड को GET से बदलकर POST, PUT या X-HTTP-Method-Override ट्राई करें।",
        },
        commandTemplate: `curl -i -X POST "https://{TARGET}{PATH}"\ncurl -i -X HEAD "https://{TARGET}{PATH}"\ncurl -i -H "X-HTTP-Method-Override: GET" -X POST "https://{TARGET}{PATH}"`,
        expectedVulnerable: {
          en: "HTTP 200 response with data when using POST or method override header.",
          simple: "POST or HEAD method bypasses the 403 restriction.",
          hi: "POST या मेथड ओवरराइड हेडर लगाते ही डेटा के साथ 200 रिस्पॉन्स मिल जाता है।",
        },
        expectedSafe: {
          en: "HTTP 405 Method Not Allowed or 403 across all HTTP verbs.",
          simple: "405 Method Not Allowed or consistent 403.",
          hi: "405 Method Not Allowed या सभी मेथड्स पर 403 बना रहता है।",
        },
        bountyTip: {
          en: "Many Java frameworks (Spring, Struts) support X-HTTP-Method-Override by default in framework filters.",
          simple: "Spring and Struts often support X-HTTP-Method-Override out of the box.",
          hi: "Spring और Struts जैसे फ्रेमवर्क डिफ़ॉल्ट रूप से X-HTTP-Method-Override को प्रोसेस करते हैं।",
        },
      },
    ],
  },

  // ─── 5. EXPOSED TECH STACK / FRAMEWORK DETECTED ──────────────────────────────
  {
    id: "tech_stack",
    title: "Exposed Framework / Tech Stack Detected",
    artifactName: "Tech Stack (Spring Boot, Jenkins, GraphQL, phpMyAdmin)",
    emoji: "⚙️",
    accentColor: "violet",
    description: {
      en: "The target runs a known framework. Immediately test technology-specific high-yield vulnerability signatures like Spring Boot Actuators, Jenkins script console, or GraphQL batching.",
      simple: "Target uses a specific framework. Run technology-specific exploit checks.",
      hi: "टारगेट पर कोई खास फ्रेमवर्क मिला है। तुरंत उस टेक्नोलॉजी के स्पेसिफिक एक्सप्लॉइट्स (Actuators, GraphQL) टेस्ट करें।",
    },
    steps: [
      {
        id: "tech-spring-boot",
        title: "Spring Boot Actuator Endpoints & Heap Dump Leak",
        badge: "P1",
        objective: {
          en: "Check for unauthenticated /actuator endpoints to extract environment variables, API secrets, and heap memory dumps.",
          simple: "Check if Spring Boot actuator endpoints leak server memory and secrets.",
          hi: "Spring Boot एक्ट्यूएटर चेक करें ताकि एन्वायरनमेंट पासवर्ड्स और मेमोरी हीपडंप मिल सके।",
        },
        commandTemplate: `curl -s -i "https://{TARGET}/actuator/env"\ncurl -s -i "https://{TARGET}/actuator/heapdump" -o heapdump.hprof\ncurl -s -i "https://{TARGET}/actuator/mappings"`,
        expectedVulnerable: {
          en: "JSON response containing active_profiles, spring.datasource.password, or binary .hprof download.",
          simple: "Returns server config secrets, database credentials, or downloadable memory dump.",
          hi: "डेटाबेस पासवर्ड्स, API कीज या पूरी मेमोरी का हीपडंप (.hprof) डाउनलोड हो जाता है।",
        },
        expectedSafe: {
          en: "HTTP 401/404 or Whitelabel Error Page with 403 Forbidden.",
          simple: "Endpoints are disabled or return 401/404.",
          hi: "एंडपॉइंट्स डिसेबल्ड हैं या 401/404 देते हैं।",
        },
        bountyTip: {
          en: "If /actuator/heapdump downloads, extract plain-text credentials using: strings heapdump.hprof | grep -E 'password|secret|bearer'.",
          simple: "Run strings on the heapdump to extract passwords in plain text.",
          hi: "डाउनलोड हुए heapdump.hprof पर strings चलाकर सीधे प्लेन-टेक्स्ट पासवर्ड्स निकालें।",
        },
      },
      {
        id: "tech-jenkins",
        title: "Jenkins Unauthenticated Script Console & Build Triggers",
        badge: "P1",
        objective: {
          en: "Test if Jenkins CI/CD instance allows unauthenticated execution of Groovy scripts on the underlying host.",
          simple: "Check if Jenkins allows running system commands via Groovy script console.",
          hi: "चेक करें कि क्या Jenkins ग्रूवी स्क्रिप्ट कंसोल से सर्वर पर डायरेक्ट कमांड चला सकते हैं।",
        },
        commandTemplate: `curl -s -i "https://{TARGET}/script"\ncurl -s -i "https://{TARGET}/api/json"`,
        expectedVulnerable: {
          en: "HTTP 200 with Groovy Script Console textarea allowing: println 'whoami'.execute().text.",
          simple: "Script console is directly accessible without password.",
          hi: "स्क्रिप्ट कंसोल खुल जाता है जहाँ 'whoami'.execute() से सर्वर पर RCE होता है।",
        },
        expectedSafe: {
          en: "Redirect to /login with authentication required.",
          simple: "Redirects to secure login.",
          hi: "लॉगिन पेज पर रीडायरेक्ट हो जाता है।",
        },
        bountyTip: {
          en: "Also check /jnlpJars/jenkins-cli.jar for CVE-2024-23897 arbitrary file read.",
          simple: "Check for Jenkins CLI arbitrary file read CVE-2024-23897.",
          hi: "Jenkins CLI पर हालिया आर्बिट्रेरी फाइल रीड (CVE-2024-23897) भी टेस्ट करें।",
        },
      },
      {
        id: "tech-graphql",
        title: "GraphQL Introspection & Array Batching",
        badge: "P2",
        objective: {
          en: "Check if GraphQL introspection is enabled to dump the full database schema, and test array batching to bypass OTP rate limits.",
          simple: "Dump entire GraphQL database schema and test batching attacks.",
          hi: "GraphQL स्कीमा डंप करें और OTP बाईपास के लिए ऐरे बैचिंग टेस्ट करें।",
        },
        commandTemplate: `curl -i -X POST -H "Content-Type: application/json" -d '{"query":"{__schema{types{name,fields{name}}}}"}' "https://{TARGET}/graphql"`,
        expectedVulnerable: {
          en: "Full schema JSON returned with User, Admin, and Mutation definitions.",
          simple: "Returns full database schema with all query and mutation names.",
          hi: "पूरी डेटाबेस स्कीमा, म्यूटेशन्स और प्राइवेट फ़ील्ड्स का JSON मिल जाता है।",
        },
        expectedSafe: {
          en: "GraphQL error: 'GraphQL introspection is not allowed' or 'Field __schema does not exist'.",
          simple: "Introspection is disabled.",
          hi: "इंट्रोस्पेक्शन डिसेबल्ड होने का एरर आता है।",
        },
        bountyTip: {
          en: "If introspection is blocked, try Unicode whitespace: {__schema\\u0020{types{name}}} or newline injection.",
          simple: "Bypass introspection blocks using Unicode spaces or newlines.",
          hi: "अगर इंट्रोस्पेक्शन ब्लॉक है तो यूनिकोड स्पेस {__schema\\u0020{types}} से बाईपास करें।",
        },
        playbookRoute: "/graphql-playbook",
        playbookLabel: "GraphQL Playbook",
      },
    ],
  },

  // ─── 6. SECRET TOKEN / API KEY LEAKED IN JAVASCRIPT ─────────────────────────
  {
    id: "secret_token",
    title: "API Key / Secret Token Leaked",
    artifactName: "Secret Token (AWS AKIA..., JWT, Firebase URL, Google API Key)",
    emoji: "🔑",
    accentColor: "lime",
    description: {
      en: "An API key or secret token was extracted from frontend bundle JS files, mobile APKs, or GitHub commits. Validate permissions, scope escalation, and data access.",
      simple: "You found an API key in client code. Test what privileges it grants.",
      hi: "जावास्क्रिप्ट या ऐप में API की/टोकन मिला है। तुरंत चेक करें कि इससे क्या-क्या एक्सेस हो रहा है।",
    },
    steps: [
      {
        id: "token-aws-sts",
        title: "AWS Access Key Identity & Permission Verification",
        badge: "P1",
        objective: {
          en: "Check who owns the leaked AWS Access Key ID (AKIA...) and enumerate its IAM permissions.",
          simple: "Test whose account the leaked AWS key belongs to.",
          hi: "लीक हुई AWS की (AKIA...) का ओनर और उसकी परमिशन चेक करें।",
        },
        commandTemplate: `aws sts get-caller-identity --output json\naws iam get-account-summary`,
        expectedVulnerable: {
          en: "Returns valid UserId, Account, and Arn (e.g. arn:aws:iam::123456789:user/admin).",
          simple: "Returns active AWS account and user identity.",
          hi: "एक्टिव AWS अकाउंट आईडी और यूजर ARN मिल जाता है।",
        },
        expectedSafe: {
          en: "The security token included in the request is invalid.",
          simple: "Key is expired or deactivated.",
          hi: "टोकन इनवैलिड या डिएक्टिवेटेड होता है।",
        },
        bountyTip: {
          en: "Never run destructive commands with leaked keys; get-caller-identity is universally accepted as sufficient PoC for P1 bounties.",
          simple: "Just get-caller-identity is enough for a P1 bounty report.",
          hi: "कभी कोई फाइल डिलीट न करें; get-caller-identity ही P1 बाउंटी के लिए काफी है।",
        },
      },
      {
        id: "token-firebase",
        title: "Firebase Realtime Database Unauthenticated Read/Write",
        badge: "P1",
        objective: {
          en: "Check if the Firebase project has default insecure database rules (.read: true, .write: true).",
          simple: "Check if Firebase database dumps all customer records without login.",
          hi: "चेक करें कि क्या Firebase डेटाबेस सभी कस्टमर रिकॉर्ड्स बिना पासवर्ड के दे रहा है।",
        },
        commandTemplate: `curl -s "https://{TARGET}.firebaseio.com/.json?print=pretty"`,
        expectedVulnerable: {
          en: "Dumps entire database JSON tree with user records, passwords, and sensitive keys.",
          simple: "Dumps entire database in JSON format.",
          hi: "पूरा डेटाबेस JSON फॉर्मेट में डाउनलोड हो जाता है।",
        },
        expectedSafe: {
          en: "HTTP 401 with 'Permission denied'.",
          simple: "Returns Permission denied.",
          hi: "Permission denied एरर मिलता है।",
        },
        bountyTip: {
          en: "If .json returns Permission denied, test specific table names: /.json?shallow=true or /users.json.",
          simple: "Test /users.json directly if the root database path is locked.",
          hi: "अगर रूट पर एरर है तो डायरेक्ट /users.json या /orders.json ट्राई करें।",
        },
      },
      {
        id: "token-jwt-tampering",
        title: "JWT None Algorithm & Weak HMAC Signature",
        badge: "P1",
        objective: {
          en: "Tamper with JWT header to set alg: 'none' or brute-force weak HMAC secrets using jwt-crack.",
          simple: "Bypass JWT authentication using algorithm: none.",
          hi: "JWT हेडर में alg: none लगाकर बिना पासवर्ड के एडमिन टोकन बनाएं।",
        },
        commandTemplate: `echo -n '{"alg":"none","typ":"JWT"}' | base64 | tr -d '='\necho -n '{"user":"admin","role":"superuser"}' | base64 | tr -d '='`,
        expectedVulnerable: {
          en: "Backend accepts JWT with empty signature segment (header.payload.) and authenticates you as admin.",
          simple: "Server accepts the token with no signature and grants admin rights.",
          hi: "सर्वर बिना सिग्नेचर वाले टोकन को मान लेता है और एडमिन एक्सेस दे देता है।",
        },
        expectedSafe: {
          en: "HTTP 401 'Invalid token signature' or 'Algorithm not supported'.",
          simple: "Token is rejected.",
          hi: "टोकन इनवैलिड सिग्नेचर एरर के साथ रिजेक्ट हो जाता है।",
        },
        bountyTip: {
          en: "Also test RS256 to HS256 key confusion: sign the token with HMAC-SHA256 using the server's public RSA key!",
          simple: "Try signing RS256 tokens using HS256 with the server's public key.",
          hi: "RS256 से HS256 की-कन्फ्यूजन भी टेस्ट करें; पब्लिक की को सीक्रेट की तरह इस्तेमाल करें।",
        },
      },
    ],
  },
];
