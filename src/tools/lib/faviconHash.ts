/**
 * Favicon & MurmurHash3 Library for Asset Discovery & OSINT Reconnaissance.
 * Computes Shodan-compatible MurmurHash3 (32-bit signed), raw MurmurHash3,
 * MD5, SHA-256, and generates one-click search dorks for Shodan, FOFA, Censys, and ZoomEye.
 */

// ─── 1. PURE TYPESCRIPT MURMURHASH3 (32-BIT SIGNED & UNSIGNED) ───────────────

/**
 * Computes 32-bit signed MurmurHash3 (x86_32).
 * Exactly matches Python mmh3.hash() and C++ reference implementation.
 *
 * @param input - String (UTF-8) or raw binary Uint8Array
 * @param seed  - 32-bit integer seed (default: 0)
 * @returns 32-bit signed integer (-2147483648 to 2147483647)
 */
export function murmur3_32_signed(input: string | Uint8Array, seed = 0): number {
  const data = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let h1 = (seed & 0xffffffff) >>> 0;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;

  const len = data.length;
  const blocks = len & ~3;

  // Process 4-byte blocks
  for (let i = 0; i < blocks; i += 4) {
    let k1 =
      (data[i]) |
      (data[i + 1] << 8) |
      (data[i + 2] << 16) |
      (data[i + 3] << 24);

    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1 = Math.imul(h1, 5) + 0xe6546b64;
  }

  // Process remainder (tail)
  let k1 = 0;
  const tailIndex = blocks;
  const remainder = len & 3;

  if (remainder >= 3) k1 ^= data[tailIndex + 2] << 16;
  if (remainder >= 2) k1 ^= data[tailIndex + 1] << 8;
  if (remainder >= 1) {
    k1 ^= data[tailIndex];
    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);
    h1 ^= k1;
  }

  // Finalization mix
  h1 ^= len;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;

  return h1 | 0; // Return signed 32-bit int
}

/**
 * Computes 32-bit unsigned MurmurHash3.
 * Useful for tools expecting positive integers (0 to 4294967295).
 */
export function murmur3_32_unsigned(input: string | Uint8Array, seed = 0): number {
  return murmur3_32_signed(input, seed) >>> 0;
}

// ─── 2. SHODAN FAVICON FORMATTING ─────────────────────────────────────────────

/**
 * Convert arbitrary binary bytes into standard base64 string.
 * Chunked to avoid maximum call stack size limits on large files.
 */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

/**
 * Formats Base64 with standard MIME wrapping (76 characters per line + trailing \n),
 * identical to Python's codecs.encode(content, 'base64') and base64.encodebytes().
 * This exact string is what Shodan passes into MurmurHash3.
 */
export function toShodanBase64(bytes: Uint8Array): string {
  const b64 = bytesToBase64(bytes);
  const chunks: string[] = [];
  for (let i = 0; i < b64.length; i += 76) {
    chunks.push(b64.slice(i, i + 76));
  }
  return chunks.join("\n") + "\n";
}

/**
 * Computes official Shodan Favicon Hash (signed 32-bit integer).
 */
export function calculateShodanFaviconHash(bytes: Uint8Array): number {
  const shodanB64 = toShodanBase64(bytes);
  return murmur3_32_signed(shodanB64);
}

// ─── 3. RAW BINARY MD5 & SHA-256 ──────────────────────────────────────────────

/**
 * Pure TypeScript MD5 implementation directly operating on binary Uint8Array bytes.
 * Produces accurate lowercase hexadecimal MD5 digest (used in FOFA icon_hash and Censys).
 */
export function computeBinaryMd5(bytes: Uint8Array): string {
  function rotateLeft(lValue: number, iShiftBits: number) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }
  function addUnsigned(lX: number, lY: number) {
    const lX8 = lX & 0x80000000;
    const lY8 = lY & 0x80000000;
    const lX4 = lX & 0x40000000;
    const lY4 = lY & 0x40000000;
    const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
    if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
      return lResult ^ 0x40000000 ^ lX8 ^ lY8;
    }
    return lResult ^ lX8 ^ lY8;
  }
  function F(x: number, y: number, z: number) { return (x & y) | (~x & z); }
  function G(x: number, y: number, z: number) { return (x & z) | (y & ~z); }
  function H(x: number, y: number, z: number) { return x ^ y ^ z; }
  function I(x: number, y: number, z: number) { return y ^ (x | ~z); }

  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  const lMessageLength = bytes.length;
  const lNumberOfWordsTemp1 = lMessageLength + 8;
  const lNumberOfWordsTemp2 = (lNumberOfWordsTemp1 - (lNumberOfWordsTemp1 % 64)) / 64;
  const lNumberOfWords = (lNumberOfWordsTemp2 + 1) * 16;
  const lWordArray = new Array<number>(lNumberOfWords).fill(0);
  for (let i = 0; i < lMessageLength; i++) {
    const wordIdx = i >>> 2;
    const bytePos = (i & 3) * 8;
    lWordArray[wordIdx] |= (bytes[i] << bytePos);
  }
  lWordArray[lMessageLength >>> 2] |= (0x80 << ((lMessageLength & 3) * 8));
  lWordArray[lNumberOfWords - 2] = (lMessageLength * 8) & 0xffffffff;
  lWordArray[lNumberOfWords - 1] = Math.floor((lMessageLength * 8) / 0x100000000);

  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  for (let k = 0; k < lWordArray.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;
    a = FF(a, b, c, d, lWordArray[k + 0], 7, 0xd76aa478);
    d = FF(d, a, b, c, lWordArray[k + 1], 12, 0xe8c7b756);
    c = FF(c, d, a, b, lWordArray[k + 2], 17, 0x242070db);
    b = FF(b, c, d, a, lWordArray[k + 3], 22, 0xc1bdceee);
    a = FF(a, b, c, d, lWordArray[k + 4], 7, 0xf57c0faf);
    d = FF(d, a, b, c, lWordArray[k + 5], 12, 0x4787c62a);
    c = FF(c, d, a, b, lWordArray[k + 6], 17, 0xa8304613);
    b = FF(b, c, d, a, lWordArray[k + 7], 22, 0xfd469501);
    a = FF(a, b, c, d, lWordArray[k + 8], 7, 0x698098d8);
    d = FF(d, a, b, c, lWordArray[k + 9], 12, 0x8b44f7af);
    c = FF(c, d, a, b, lWordArray[k + 10], 17, 0xffff5bb1);
    b = FF(b, c, d, a, lWordArray[k + 11], 22, 0x895cd7be);
    a = FF(a, b, c, d, lWordArray[k + 12], 7, 0x6b901122);
    d = FF(d, a, b, c, lWordArray[k + 13], 12, 0xfd987193);
    c = FF(c, d, a, b, lWordArray[k + 14], 17, 0xa679438e);
    b = FF(b, c, d, a, lWordArray[k + 15], 22, 0x49b40821);

    a = GG(a, b, c, d, lWordArray[k + 1], 5, 0xf61e2562);
    d = GG(d, a, b, c, lWordArray[k + 6], 9, 0xc040b340);
    c = GG(c, d, a, b, lWordArray[k + 11], 14, 0x265e5a51);
    b = GG(b, c, d, a, lWordArray[k + 0], 20, 0xe9b6c7aa);
    a = GG(a, b, c, d, lWordArray[k + 5], 5, 0xd62f105d);
    d = GG(d, a, b, c, lWordArray[k + 10], 9, 0x02441453);
    c = GG(c, d, a, b, lWordArray[k + 15], 14, 0xd8a1e681);
    b = GG(b, c, d, a, lWordArray[k + 4], 20, 0xe7d3fbc8);
    a = GG(a, b, c, d, lWordArray[k + 9], 5, 0x21e1cde6);
    d = GG(d, a, b, c, lWordArray[k + 14], 9, 0xc33707d6);
    c = GG(c, d, a, b, lWordArray[k + 3], 14, 0xf4d50d87);
    b = GG(b, c, d, a, lWordArray[k + 8], 20, 0x455a14ed);
    a = GG(a, b, c, d, lWordArray[k + 13], 5, 0xa9e3e905);
    d = GG(d, a, b, c, lWordArray[k + 2], 9, 0xfcefa3f8);
    c = GG(c, d, a, b, lWordArray[k + 7], 14, 0x676f02d9);
    b = GG(b, c, d, a, lWordArray[k + 12], 20, 0x8d2a4c8a);

    a = HH(a, b, c, d, lWordArray[k + 5], 4, 0xfffa3942);
    d = HH(d, a, b, c, lWordArray[k + 8], 11, 0x8771f681);
    c = HH(c, d, a, b, lWordArray[k + 11], 16, 0x6d9d6122);
    b = HH(b, c, d, a, lWordArray[k + 14], 23, 0xfde5380c);
    a = HH(a, b, c, d, lWordArray[k + 1], 4, 0xa4beea44);
    d = HH(d, a, b, c, lWordArray[k + 4], 11, 0x4bdecfa9);
    c = HH(c, d, a, b, lWordArray[k + 7], 16, 0xf6bb4b60);
    b = HH(b, c, d, a, lWordArray[k + 10], 23, 0xbebfbc70);
    a = HH(a, b, c, d, lWordArray[k + 13], 4, 0x289b7ec6);
    d = HH(d, a, b, c, lWordArray[k + 0], 11, 0xeaa127fa);
    c = HH(c, d, a, b, lWordArray[k + 3], 16, 0xd4ef3085);
    b = HH(b, c, d, a, lWordArray[k + 6], 23, 0x04881d05);
    a = HH(a, b, c, d, lWordArray[k + 9], 4, 0xd9d4d039);
    d = HH(d, a, b, c, lWordArray[k + 12], 11, 0xe6db99e5);
    c = HH(c, d, a, b, lWordArray[k + 15], 16, 0x1fa27cf8);
    b = HH(b, c, d, a, lWordArray[k + 2], 23, 0xc4ac5665);

    a = II(a, b, c, d, lWordArray[k + 0], 6, 0xf4292244);
    d = II(d, a, b, c, lWordArray[k + 7], 10, 0x432aff97);
    c = II(c, d, a, b, lWordArray[k + 14], 15, 0xab9423a7);
    b = II(b, c, d, a, lWordArray[k + 5], 21, 0xfc93a039);
    a = II(a, b, c, d, lWordArray[k + 12], 6, 0x655b59c3);
    d = II(d, a, b, c, lWordArray[k + 3], 10, 0x8f0ccc92);
    c = II(c, d, a, b, lWordArray[k + 10], 15, 0xffeff47d);
    b = II(b, c, d, a, lWordArray[k + 1], 21, 0x85845dd1);
    a = II(a, b, c, d, lWordArray[k + 8], 6, 0x6fa87e4f);
    d = II(d, a, b, c, lWordArray[k + 15], 10, 0xfe2ce6e0);
    c = II(c, d, a, b, lWordArray[k + 6], 15, 0xa3014314);
    b = II(b, c, d, a, lWordArray[k + 13], 21, 0x4e0811a1);
    a = II(a, b, c, d, lWordArray[k + 4], 6, 0xf7537e82);
    d = II(d, a, b, c, lWordArray[k + 11], 10, 0xbd3af235);
    c = II(c, d, a, b, lWordArray[k + 2], 15, 0x2ad7d2bb);
    b = II(b, c, d, a, lWordArray[k + 9], 21, 0xeb86d391);

    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  function wordToHex(lValue: number) {
    let wordToHexValue = "";
    for (let lCount = 0; lCount <= 3; lCount++) {
      const lByte = (lValue >>> (lCount * 8)) & 255;
      wordToHexValue += ("0" + lByte.toString(16)).slice(-2);
    }
    return wordToHexValue;
  }
  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

/**
 * Computes SHA-256 hex digest using Web Crypto API or fallback.
 */
export async function computeBinarySha256(bytes: Uint8Array): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", bytes as unknown as BufferSource);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Basic fallback if subtle crypto is somehow unavailable
  return "unavailable";
}

// ─── 4. STRUCTURED FAVICON ANALYSIS RESULT ────────────────────────────────────

export interface FaviconAnalysisResult {
  sourceType: "url" | "file" | "text" | "preset";
  sourceName: string;
  fileSizeBytes: number;
  mimeType: string;
  previewDataUri: string;

  shodanHash: number;
  rawMurmur3Signed: number;
  rawMurmur3Unsigned: number;
  md5: string;
  sha256: string;

  base64: string;
  shodanBase64: string;

  dorks: {
    shodan: string;
    fofaMmh3: string;
    fofaMd5: string;
    censysMd5: string;
    censysSha256: string;
    zoomeye: string;
    hunter: string;
  };

  searchUrls: {
    shodan: string;
    fofa: string;
    censys: string;
    zoomeye: string;
  };
}

/**
 * Build the full analysis result from raw bytes.
 */
export async function analyzeFaviconBytes(
  bytes: Uint8Array,
  sourceName: string,
  sourceType: FaviconAnalysisResult["sourceType"],
  mimeType = "image/x-icon"
): Promise<FaviconAnalysisResult> {
  const shodanHash = calculateShodanFaviconHash(bytes);
  const rawMurmur3Signed = murmur3_32_signed(bytes);
  const rawMurmur3Unsigned = murmur3_32_unsigned(bytes);
  const md5 = computeBinaryMd5(bytes);
  const sha256 = await computeBinarySha256(bytes);
  const base64 = bytesToBase64(bytes);
  const shodanBase64 = toShodanBase64(bytes);

  const previewDataUri = `data:${mimeType};base64,${base64}`;

  const dorks = {
    shodan: `http.favicon.hash:${shodanHash}`,
    fofaMmh3: `icon_hash="${shodanHash}"`,
    fofaMd5: `icon_hash="${md5}"`,
    censysMd5: `services.http.response.favicons.md5_hash:"${md5}"`,
    censysSha256: `services.http.response.favicons.sha256_hash:"${sha256}"`,
    zoomeye: `iconhash:"${shodanHash}"`,
    hunter: `web.icon=="${md5}"`,
  };

  const searchUrls = {
    shodan: `https://www.shodan.io/search?query=${encodeURIComponent(dorks.shodan)}`,
    fofa: `https://fofa.info/result?qbase64=${encodeURIComponent(btoa(dorks.fofaMmh3))}`,
    censys: `https://search.censys.io/search?resource=hosts&q=${encodeURIComponent(dorks.censysMd5)}`,
    zoomeye: `https://www.zoomeye.org/searchResult?q=${encodeURIComponent(dorks.zoomeye)}`,
  };

  return {
    sourceType,
    sourceName,
    fileSizeBytes: bytes.byteLength,
    mimeType,
    previewDataUri,
    shodanHash,
    rawMurmur3Signed,
    rawMurmur3Unsigned,
    md5,
    sha256,
    base64,
    shodanBase64,
    dorks,
    searchUrls,
  };
}

// ─── 5. SMART FAVICON URL RESOLVER & FETCHER ──────────────────────────────────

/**
 * Normalizes user-supplied URL to valid HTTP/HTTPS and resolves favicon path if needed.
 */
export function normalizeFaviconUrl(rawUrl: string): string {
  let clean = rawUrl.trim();
  if (!clean) return "";

  if (!/^https?:\/\//i.test(clean)) {
    clean = `https://${clean}`;
  }

  try {
    const parsed = new URL(clean);
    // If user provided a bare hostname without a specific icon file, default to /favicon.ico
    if (parsed.pathname === "" || parsed.pathname === "/") {
      parsed.pathname = "/favicon.ico";
      return parsed.toString();
    }
    return parsed.toString();
  } catch {
    return clean;
  }
}

/**
 * Multi-stage fetch with CORS fallback proxies.
 */
export async function fetchFaviconBytesFromUrl(
  inputUrl: string
): Promise<{ bytes: Uint8Array; mimeType: string; resolvedUrl: string }> {
  const targetUrl = normalizeFaviconUrl(inputUrl);
  if (!targetUrl) throw new Error("Please enter a valid URL.");

  // Attempt 1: Direct fetch
  try {
    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Accept: "image/x-icon, image/vnd.microsoft.icon, image/png, image/svg+xml, image/*, */*",
      },
    });

    if (res.ok) {
      const buffer = await res.arrayBuffer();
      if (buffer.byteLength > 0) {
        const ct = res.headers.get("content-type") || "image/x-icon";
        return {
          bytes: new Uint8Array(buffer),
          mimeType: ct.split(";")[0].trim(),
          resolvedUrl: targetUrl,
        };
      }
    }
  } catch {
    // Direct fetch failed (likely browser CORS restriction). Fall through to proxies.
  }

  // Attempt 2: Free Public CORS Proxy 1 (allorigins)
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      if (buffer.byteLength > 0) {
        return {
          bytes: new Uint8Array(buffer),
          mimeType: "image/x-icon",
          resolvedUrl: targetUrl,
        };
      }
    }
  } catch {
    // Continue to proxy 2
  }

  // Attempt 3: Public CORS Proxy 2 (corsproxy.io)
  try {
    const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      if (buffer.byteLength > 0) {
        return {
          bytes: new Uint8Array(buffer),
          mimeType: "image/x-icon",
          resolvedUrl: targetUrl,
        };
      }
    }
  } catch {
    // Fallback exhausted
  }

  throw new Error(
    `Browser CORS policy blocked direct access to "${targetUrl}" and external proxies were unreachable. Tip: Right-click the icon on the target site, Save As, and use the 'Direct File Upload' tab instead!`
  );
}

// ─── 6. PRESET FAMOUS FAVICONS LIBRARY (CHEAT SHEET) ──────────────────────────

export interface PresetFavicon {
  id: string;
  name: string;
  category: string;
  shodanHash: number;
  md5?: string;
  notes: {
    en: string;
    simple: string;
    hi: string;
  };
  attackVectors: string[];
}

export const PRESET_FAVICONS: PresetFavicon[] = [
  {
    id: "spring-boot",
    name: "Spring Boot Default Leaf",
    category: "Java Framework",
    shodanHash: 116323821,
    md5: "0488faca4c3fbac97a5f0a4d8b35242d",
    notes: {
      en: "Default green leaf icon included in vanilla Spring Boot applications and Whitelabel Error Pages.",
      simple: "Default icon for Spring Boot apps and error pages.",
      hi: "Spring Boot का डिफ़ॉल्ट हरा पत्ता आइकन जो एरर पेजों पर दिखता है।",
    },
    attackVectors: [
      "/actuator/env (Unauthenticated env vars / secrets)",
      "/actuator/heapdump (Full JVM heapdump memory leak)",
      "/actuator/mappings (Internal API endpoint disclosure)",
      "/actuator/gateway/routes (Spring Cloud Gateway RCE CVE-2022-22947)",
    ],
  },
  {
    id: "jenkins",
    name: "Jenkins Automation Server",
    category: "CI/CD & DevOps",
    shodanHash: 81586312,
    md5: "23e8c33526569145fc3065b21be3e46c",
    notes: {
      en: "Default Jenkins butler logo icon. Frequently exposes CI/CD build environments and secrets.",
      simple: "Default Jenkins server icon.",
      hi: "Jenkins ऑटोमेशन सर्वर का डिफ़ॉल्ट बटलर लोगो।",
    },
    attackVectors: [
      "/script (Groovy Script Console unauthenticated RCE)",
      "/signup (Open user registration to gain build trigger rights)",
      "/api/json (Sensitive project / pipeline metadata exposure)",
      "CVE-2024-23897 (CLI arbitrary file read via @args)",
    ],
  },
  {
    id: "phpmyadmin",
    name: "phpMyAdmin Database Manager",
    category: "Database Tool",
    shodanHash: 1759604812,
    md5: "1594957e8fa1fa24e8ab66a7b72db54e",
    notes: {
      en: "Global web administration interface for MySQL and MariaDB databases.",
      simple: "MySQL database web admin panel.",
      hi: "phpMyAdmin वेब डेटाबेस मैनेजमेंट कंसोल।",
    },
    attackVectors: [
      "Default credentials (root:root, root:toor, root:[blank])",
      "/scripts/setup.php (Legacy installation script exposure)",
      "SELECT ... INTO OUTFILE '/var/www/html/shell.php' (RCE if file_priv enabled)",
    ],
  },
  {
    id: "grafana",
    name: "Grafana Dashboards",
    category: "Monitoring & Observability",
    shodanHash: -1255474345,
    md5: "ebac9a9b6ff8d9275cb70d6a9a3b6f0e",
    notes: {
      en: "Observability and data visualization dashboards commonly connected to internal databases.",
      simple: "Grafana metrics dashboard icon.",
      hi: "Grafana मेट्रिक्स और मॉनिटरिंग डैशबोर्ड।",
    },
    attackVectors: [
      "CVE-2021-43798 (Zero-day Directory Traversal to read /etc/passwd and config secrets)",
      "Default admin credentials (admin:admin)",
      "Exposed snapshots containing confidential business metrics",
    ],
  },
  {
    id: "kibana",
    name: "Kibana / Elastic Stack",
    category: "Log Analysis & Search",
    shodanHash: -899655614,
    md5: "9f0a28f80453e028b3ee138b1933e4b3",
    notes: {
      en: "Elasticsearch visualization engine. Often left accessible without authentication on port 5601.",
      simple: "Elasticsearch Kibana web UI icon.",
      hi: "Elasticsearch Kibana सर्च व लॉग विज़ुअलाइज़ेशन कंसोल।",
    },
    attackVectors: [
      "Unauthenticated access to internal indexes and PII customer logs",
      "CVE-2019-7609 (Timelion Prototype Pollution to RCE)",
      "/api/status (Sensitive cluster node disclosure)",
    ],
  },
  {
    id: "cpanel",
    name: "cPanel & WHM Control Panel",
    category: "Hosting Infrastructure",
    shodanHash: -1922387143,
    md5: "6ba84fa557e1bb9356d2cfd3a1f9e235",
    notes: {
      en: "Industry standard web hosting control panel operating on ports 2082, 2083, 2086, 2087.",
      simple: "cPanel hosting login icon.",
      hi: "cPanel और WHM वेब होस्टिंग कंट्रोल पैनल।",
    },
    attackVectors: [
      "Brute-forcing exposed WHM root logins on port 2087",
      "Subdomain takeover on abandoned user hosting accounts",
      "Exposed cPanel backup files (backup-*.tar.gz)",
    ],
  },
  {
    id: "fortigate",
    name: "Fortinet FortiGate SSL-VPN",
    category: "Enterprise Gateway",
    shodanHash: -1205679901,
    md5: "94bb3e31ff0135d55bfb91d2932a9018",
    notes: {
      en: "Fortinet enterprise SSL-VPN gateway portal icon.",
      simple: "Fortinet corporate VPN gateway.",
      hi: "Fortinet FortiGate SSL-VPN एंटरप्राइज गेटवे पोर्टल।",
    },
    attackVectors: [
      "CVE-2018-13379 (Path Traversal credential leak: /remote/fgt_lang?lang=/../../../..)",
      "CVE-2022-40684 (Authentication Bypass on administrative interface via custom User-Agent)",
      "CVE-2023-27997 (FortiOS pre-auth heap overflow RCE in SSL-VPN)",
    ],
  },
  {
    id: "gitlab",
    name: "GitLab CE / EE",
    category: "Source Code Management",
    shodanHash: 1278323681,
    md5: "712ffdb51296f8c36b85d34ff14704b2",
    notes: {
      en: "Self-hosted GitLab instance icon. Often harbors private source code and CI tokens.",
      simple: "Self-hosted GitLab repository server.",
      hi: "GitLab सेल्फ-होस्टेड सोर्स कोड रिपॉजिटरी सर्वर।",
    },
    attackVectors: [
      "Open user signups on internal company GitLab instances",
      "CVE-2021-22205 (Unauthenticated RCE via ExifTool djvu image parsing)",
      "CVE-2023-7028 (Account takeover via unverified email password reset)",
    ],
  },
  {
    id: "exchange-owa",
    name: "Microsoft Outlook Web App (OWA)",
    category: "Mail Server",
    shodanHash: -144122519,
    md5: "d0a4c00078bb09ea83693f938d227b68",
    notes: {
      en: "Microsoft Exchange webmail interface. Prime target for credential spraying and Proxy CVEs.",
      simple: "Microsoft Exchange webmail login.",
      hi: "माइक्रोसॉफ्ट एक्सचेंज आउटलुक वेब ऐप (OWA)।",
    },
    attackVectors: [
      "ProxyLogon (CVE-2021-26855 SSRF + RCE chain)",
      "ProxyShell (CVE-2021-34473 pre-auth path confusion + PowerShell export RCE)",
      "Internal NTLM domain info leak via /owa/auth/logon.aspx",
    ],
  },
  {
    id: "wordpress",
    name: "WordPress",
    category: "CMS",
    shodanHash: 1243103276,
    md5: "f3b257013da0f448123b273c596db0bc",
    notes: {
      en: "Default classic WordPress 'W' favicon.",
      simple: "WordPress website icon.",
      hi: "वर्डप्रेस CMS का डिफ़ॉल्ट 'W' आइकन।",
    },
    attackVectors: [
      "/wp-json/wp/v2/users (REST API author enumeration)",
      "/xmlrpc.php (Amplified multicall brute force & Pingback SSRF)",
      "Vulnerable plugins & themes enumeration via WPScan",
    ],
  },
  {
    id: "django",
    name: "Django Administration",
    category: "Python Framework",
    shodanHash: 1607567786,
    md5: "63e2303539bc27dae8fc7efdc84d5bf0",
    notes: {
      en: "Default Django administration icon shipped with django.contrib.admin.",
      simple: "Django admin dashboard icon.",
      hi: "Django एडमिनिस्ट्रेशन डैशबोर्ड का डिफ़ॉल्ट आइकन।",
    },
    attackVectors: [
      "Exposed DEBUG = True detailed error tracebacks with SECRET_KEY",
      "Brute force on /admin/login/ with staff usernames",
      "Session fixation or CSRF cookie misconfigurations",
    ],
  },
  {
    id: "tomcat",
    name: "Apache Tomcat",
    category: "Application Server",
    shodanHash: -1262804241,
    md5: "3cd50dfa8385e05bb00109ae9b4c0631",
    notes: {
      en: "Apache Tomcat default feline logo favicon.",
      simple: "Apache Tomcat server icon.",
      hi: "Apache Tomcat सर्वर का डिफ़ॉल्ट बिल्ली वाला लोगो।",
    },
    attackVectors: [
      "Default credentials on /manager/html (tomcat:s3cret, admin:admin)",
      "Ghostcat (CVE-2020-1938 AJP protocol arbitrary file read/include)",
      "WAR file upload RCE via manager console",
    ],
  },
];
