// Pure TypeScript utilities for Hash Inspection, Hashes, URL Studio, and CIDR Subnet Calculator

// -------------------------------------------------------------
// 1. HASH IDENTIFIER & LIVE HASHER
// -------------------------------------------------------------

export interface HashMatch {
  name: string;
  category: string;
  confidence: "High" | "Medium" | "Low";
  description: string;
}

export function identifyHash(raw: string): HashMatch[] {
  const hash = raw.trim();
  if (!hash) return [];

  const results: HashMatch[] = [];
  const len = hash.length;
  const isHex = /^[a-fA-F0-9]+$/.test(hash);

  // Modular prefix formats
  if (hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$")) {
    results.push({
      name: "bcrypt",
      category: "Password Hash",
      confidence: "High",
      description: "Blowfish-based adaptive hashing algorithm with work factor.",
    });
  }

  if (hash.startsWith("$argon2id$") || hash.startsWith("$argon2i$") || hash.startsWith("$argon2d$")) {
    results.push({
      name: "Argon2",
      category: "Password Hash",
      confidence: "High",
      description: "Winner of Password Hashing Competition; memory-hard cryptographic hash.",
    });
  }

  if (hash.startsWith("$1$")) {
    results.push({
      name: "MD5-Crypt (Linux)",
      category: "OS Password Hash",
      confidence: "High",
      description: "Standard Linux /etc/shadow MD5 crypt hash format.",
    });
  }

  if (hash.startsWith("$5$")) {
    results.push({
      name: "SHA-256 Crypt",
      category: "OS Password Hash",
      confidence: "High",
      description: "Linux /etc/shadow SHA-256 crypt hash format.",
    });
  }

  if (hash.startsWith("$6$")) {
    results.push({
      name: "SHA-512 Crypt",
      category: "OS Password Hash",
      confidence: "High",
      description: "Modern Linux /etc/shadow SHA-512 crypt hash with salt and rounds.",
    });
  }

  if (hash.startsWith("$P$") || hash.startsWith("$H$")) {
    results.push({
      name: "phpass (WordPress / phpBB)",
      category: "CMS Password Hash",
      confidence: "High",
      description: "Portable PHP password hash used across WordPress and phpBB databases.",
    });
  }

  // Hexadecimal length matches
  if (isHex) {
    if (len === 32) {
      results.push({
        name: "MD5",
        category: "Cryptographic Hash",
        confidence: "High",
        description: "128-bit hash function commonly used for checksums and legacy auth.",
      });
      results.push({
        name: "NTLM",
        category: "Windows Auth Hash",
        confidence: "Medium",
        description: "Windows NT LAN Manager hash (MD4 of UTF-16LE password).",
      });
    } else if (len === 40) {
      results.push({
        name: "SHA-1",
        category: "Cryptographic Hash",
        confidence: "High",
        description: "160-bit hash function used in Git, TLS certificates, and legacy signatures.",
      });
      results.push({
        name: "RIPEMD-160",
        category: "Cryptographic Hash",
        confidence: "Low",
        description: "160-bit cryptographic hash function used in Bitcoin address generation.",
      });
    } else if (len === 56) {
      results.push({
        name: "SHA-224",
        category: "Cryptographic Hash",
        confidence: "High",
        description: "Truncated 224-bit member of the SHA-2 family.",
      });
    } else if (len === 64) {
      results.push({
        name: "SHA-256",
        category: "Cryptographic Hash",
        confidence: "High",
        description: "256-bit SHA-2 family hash; standard for modern signatures and blockchains.",
      });
      results.push({
        name: "HMAC-SHA256",
        category: "Keyed Hash",
        confidence: "Medium",
        description: "Hex-encoded HMAC-SHA256 digest with pre-shared key.",
      });
    } else if (len === 96) {
      results.push({
        name: "SHA-384",
        category: "Cryptographic Hash",
        confidence: "High",
        description: "384-bit SHA-2 family hash commonly used in NSA Suite B cryptography.",
      });
    } else if (len === 128) {
      results.push({
        name: "SHA-512",
        category: "Cryptographic Hash",
        confidence: "High",
        description: "512-bit SHA-2 family hash providing maximum collision resistance.",
      });
      results.push({
        name: "Whirlpool",
        category: "Cryptographic Hash",
        confidence: "Low",
        description: "512-bit cryptographic hash designed by Vincent Rijmen and Paulo Barreto.",
      });
    }
  }

  return results;
}

// Browser Web Crypto API Hasher
export async function computeSubtleHash(
  text: string,
  algorithm: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512"
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Pure JS Compact MD5 Implementation
export function computeMd5(string: string): string {
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

  function convertToWordArray(str: string) {
    let lWordCount;
    const lMessageLength = str.length;
    const lNumberOfWordsTemp1 = lMessageLength + 8;
    const lNumberOfWordsTemp2 = (lNumberOfWordsTemp1 - (lNumberOfWordsTemp1 % 64)) / 64;
    const lNumberOfWords = (lNumberOfWordsTemp2 + 1) * 16;
    const lWordArray = new Array<number>(lNumberOfWords - 1);
    let lBytePosition = 0;
    let lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = (lWordArray[lWordCount] || 0) | (str.charCodeAt(lByteCount) << lBytePosition);
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = (lWordArray[lWordCount] || 0) | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }

  function wordToHex(lValue: number) {
    let wordToHexValue = "";
    let wordToHexValueTemp = "";
    for (let lCount = 0; lCount <= 3; lCount++) {
      const lByte = (lValue >>> (lCount * 8)) & 255;
      wordToHexValueTemp = "0" + lByte.toString(16);
      wordToHexValue = wordToHexValue + wordToHexValueTemp.substr(wordToHexValueTemp.length - 2, 2);
    }
    return wordToHexValue;
  }

  const x = convertToWordArray(Array.from(new TextEncoder().encode(string), b => String.fromCharCode(b)).join(""));
  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a;
    const BB = b;
    const CC = c;
    const DD = d;
    a = FF(a, b, c, d, x[k + 0] || 0, 7, 0xd76aa478);
    d = FF(d, a, b, c, x[k + 1] || 0, 12, 0xe8c7b756);
    c = FF(c, d, a, b, x[k + 2] || 0, 17, 0x242070db);
    b = FF(b, c, d, a, x[k + 3] || 0, 22, 0xc1bdceee);
    a = FF(a, b, c, d, x[k + 4] || 0, 7, 0xf57c0faf);
    d = FF(d, a, b, c, x[k + 5] || 0, 12, 0x4787c62a);
    c = FF(c, d, a, b, x[k + 6] || 0, 17, 0xa8304613);
    b = FF(b, c, d, a, x[k + 7] || 0, 22, 0xfd469501);
    a = FF(a, b, c, d, x[k + 8] || 0, 7, 0x698098d8);
    d = FF(d, a, b, c, x[k + 9] || 0, 12, 0x8b44f7af);
    c = FF(c, d, a, b, x[k + 10] || 0, 17, 0xffff5bb1);
    b = FF(b, c, d, a, x[k + 11] || 0, 22, 0x895cd7be);
    a = FF(a, b, c, d, x[k + 12] || 0, 7, 0x6b901122);
    d = FF(d, a, b, c, x[k + 13] || 0, 12, 0xfd987193);
    c = FF(c, d, a, b, x[k + 14] || 0, 17, 0xa679438e);
    b = FF(b, c, d, a, x[k + 15] || 0, 22, 0x49b40821);

    a = GG(a, b, c, d, x[k + 1] || 0, 5, 0xf61e2562);
    d = GG(d, a, b, c, x[k + 6] || 0, 9, 0xc040b340);
    c = GG(c, d, a, b, x[k + 11] || 0, 14, 0x265e5a51);
    b = GG(b, c, d, a, x[k + 0] || 0, 20, 0xe9b6c7aa);
    a = GG(a, b, c, d, x[k + 5] || 0, 5, 0xd62f105d);
    d = GG(d, a, b, c, x[k + 10] || 0, 9, 0x02441453);
    c = GG(c, d, a, b, x[k + 15] || 0, 14, 0xd8a1e681);
    b = GG(b, c, d, a, x[k + 4] || 0, 20, 0xe7d3fbc8);
    a = GG(a, b, c, d, x[k + 9] || 0, 5, 0x21e1cde6);
    d = GG(d, a, b, c, x[k + 14] || 0, 9, 0xc33707d6);
    c = GG(c, d, a, b, x[k + 3] || 0, 14, 0xf4d50d87);
    b = GG(b, c, d, a, x[k + 8] || 0, 20, 0x455a14ed);
    a = GG(a, b, c, d, x[k + 13] || 0, 5, 0xa9e3e905);
    d = GG(d, a, b, c, x[k + 2] || 0, 9, 0xfcefa3f8);
    c = GG(c, d, a, b, x[k + 7] || 0, 14, 0x676f02d9);
    b = GG(b, c, d, a, x[k + 12] || 0, 20, 0x8d2a4c8a);

    a = HH(a, b, c, d, x[k + 5] || 0, 4, 0xfffa3942);
    d = HH(d, a, b, c, x[k + 8] || 0, 11, 0x8771f681);
    c = HH(c, d, a, b, x[k + 11] || 0, 16, 0x6d9d6122);
    b = HH(b, c, d, a, x[k + 14] || 0, 23, 0xfde5380c);
    a = HH(a, b, c, d, x[k + 1] || 0, 4, 0xa4beea44);
    d = HH(d, a, b, c, x[k + 4] || 0, 11, 0x4bdecfa9);
    c = HH(c, d, a, b, x[k + 7] || 0, 16, 0xf6bb4b60);
    b = HH(b, c, d, a, x[k + 10] || 0, 23, 0xbebfbc70);
    a = HH(a, b, c, d, x[k + 13] || 0, 4, 0x289b7ec6);
    d = HH(d, a, b, c, x[k + 0] || 0, 11, 0xeaa127fa);
    c = HH(c, d, a, b, x[k + 3] || 0, 16, 0xd4ef3085);
    b = HH(b, c, d, a, x[k + 6] || 0, 23, 0x04881d05);
    a = HH(a, b, c, d, x[k + 9] || 0, 4, 0xd9d4d039);
    d = HH(d, a, b, c, x[k + 12] || 0, 11, 0xe6db99e5);
    c = HH(c, d, a, b, x[k + 15] || 0, 16, 0x1fa27cf8);
    b = HH(b, c, d, a, x[k + 2] || 0, 23, 0xc4ac5665);

    a = II(a, b, c, d, x[k + 0] || 0, 6, 0xf4292244);
    d = II(d, a, b, c, x[k + 7] || 0, 10, 0x432aff97);
    c = II(c, d, a, b, x[k + 14] || 0, 15, 0xab9423a7);
    b = II(b, c, d, a, x[k + 5] || 0, 21, 0xfc93a039);
    a = II(a, b, c, d, x[k + 12] || 0, 6, 0x655b59c3);
    d = II(d, a, b, c, x[k + 3] || 0, 10, 0x8f0ccc92);
    c = II(c, d, a, b, x[k + 10] || 0, 15, 0xffeff47d);
    b = II(b, c, d, a, x[k + 1] || 0, 21, 0x85845dd1);
    a = II(a, b, c, d, x[k + 8] || 0, 6, 0x6fa87e4f);
    d = II(d, a, b, c, x[k + 15] || 0, 10, 0xfe2ce6e0);
    c = II(c, d, a, b, x[k + 6] || 0, 15, 0xa3014314);
    b = II(b, c, d, a, x[k + 13] || 0, 21, 0x4e0811a1);
    a = II(a, b, c, d, x[k + 4] || 0, 6, 0xf7537e82);
    d = II(d, a, b, c, x[k + 11] || 0, 10, 0xbd3af235);
    c = II(c, d, a, b, x[k + 2] || 0, 15, 0x2ad7d2bb);
    b = II(b, c, d, a, x[k + 9] || 0, 21, 0xeb86d391);

    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

// -------------------------------------------------------------
// 2. URL DECONSTRUCTOR & SECURITY DEFANGER
// -------------------------------------------------------------

export interface ParsedUrlParam {
  id: string;
  key: string;
  value: string;
}

export interface ParsedUrlResult {
  valid: boolean;
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  hash: string;
  params: ParsedUrlParam[];
  defanged: string;
  error?: string;
}

export function defangString(str: string): string {
  return str
    .replace(/^https:\/\//i, "hxxps://")
    .replace(/^http:\/\//i, "hxxp://")
    .replace(/^ftp:\/\//i, "fxp://")
    .replace(/\./g, "[.]");
}

export function refangString(str: string): string {
  return str
    .replace(/^hxxps:\/\//i, "https://")
    .replace(/^hxxp:\/\//i, "http://")
    .replace(/^fxp:\/\//i, "ftp://")
    .replace(/\[\.\]/g, ".");
}

export function parseTargetUrl(input: string): ParsedUrlResult {
  let target = input.trim();
  if (!target) {
    return {
      valid: false,
      protocol: "",
      host: "",
      hostname: "",
      port: "",
      pathname: "",
      hash: "",
      params: [],
      defanged: "",
      error: "Enter a URL to inspect",
    };
  }

  if (!target.includes("://")) {
    target = "https://" + target;
  }

  try {
    const url = new URL(target);
    const params: ParsedUrlParam[] = [];
    url.searchParams.forEach((val, key) => {
      params.push({
        id: `${key}-${Math.random().toString(36).substr(2, 6)}`,
        key,
        value: val,
      });
    });

    return {
      valid: true,
      protocol: url.protocol.replace(":", ""),
      host: url.host,
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? "443" : "80"),
      pathname: url.pathname,
      hash: url.hash,
      params,
      defanged: defangString(target),
    };
  } catch (err: unknown) {
    return {
      valid: false,
      protocol: "",
      host: "",
      hostname: "",
      port: "",
      pathname: "",
      hash: "",
      params: [],
      defanged: defangString(target),
      error: err instanceof Error ? err.message : "Invalid URL",
    };
  }
}

export function convertParamsToJson(params: ParsedUrlParam[]): string {
  const obj: Record<string, string[]> = Object.create(null);
  for (const p of params) {
    (obj[p.key] ??= []).push(p.value);
  }
  return JSON.stringify(obj, null, 2);
}

// -------------------------------------------------------------
// 3. CIDR & IP SUBNET CALCULATOR
// -------------------------------------------------------------

export interface SubnetResult {
  valid: boolean;
  cidrNotation: string;
  ipAddress: string;
  prefix: number;
  networkAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  wildcardMask: string;
  firstUsableIp: string;
  lastUsableIp: string;
  totalHosts: number;
  usableHosts: number;
  ipClass: "A" | "B" | "C" | "D" | "E";
  isPrivate: boolean;
  hexIp: string;
  dwordIp: string;
  error?: string;
}

function intToIpv4(int: number): string {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255,
  ].join(".");
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let num = 0;
  for (let i = 0; i < 4; i++) {
    const n = Number(parts[i]);
    if (isNaN(n) || n < 0 || n > 255 || parts[i].trim() === "") return null;
    num = (num << 8) + n;
  }
  return num >>> 0;
}

export function calculateSubnet(input: string): SubnetResult {
  const trimmed = input.trim();
  const [ipPart, maskPart] = trimmed.split("/");

  const ipInt = ipv4ToInt(ipPart);
  if (ipInt === null) {
    return {
      valid: false,
      cidrNotation: "",
      ipAddress: "",
      prefix: 0,
      networkAddress: "",
      broadcastAddress: "",
      subnetMask: "",
      wildcardMask: "",
      firstUsableIp: "",
      lastUsableIp: "",
      totalHosts: 0,
      usableHosts: 0,
      ipClass: "C",
      isPrivate: false,
      hexIp: "",
      dwordIp: "",
      error: "Invalid IPv4 address format (e.g. 192.168.1.10/24)",
    };
  }

  let prefix = maskPart !== undefined ? parseInt(maskPart, 10) : 32;
  if (isNaN(prefix) || prefix < 0 || prefix > 32) {
    prefix = 24;
  }

  const maskInt = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const wildcardInt = ~maskInt >>> 0;
  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | wildcardInt) >>> 0;

  const totalHosts = Math.pow(2, 32 - prefix);
  const usableHosts = prefix >= 31 ? totalHosts : Math.max(0, totalHosts - 2);

  const firstUsableInt = prefix >= 31 ? networkInt : (networkInt + 1) >>> 0;
  const lastUsableInt = prefix >= 31 ? broadcastInt : (broadcastInt - 1) >>> 0;

  // Determine IP Class
  const firstOctet = (ipInt >>> 24) & 255;
  let ipClass: "A" | "B" | "C" | "D" | "E" = "C";
  if (firstOctet <= 127) ipClass = "A";
  else if (firstOctet <= 191) ipClass = "B";
  else if (firstOctet <= 223) ipClass = "C";
  else if (firstOctet <= 239) ipClass = "D";
  else ipClass = "E";

  // Check RFC 1918 Private Ranges or Loopback
  // 10.0.0.0/8 (167772160 to 184549375)
  // 172.16.0.0/12 (2886729728 to 2887778303)
  // 192.168.0.0/16 (3232235520 to 3232301055)
  // 127.0.0.0/8 (2130706432 to 2147483647)
  const isPrivate =
    (ipInt >= 167772160 && ipInt <= 184549375) ||
    (ipInt >= 2886729728 && ipInt <= 2887778303) ||
    (ipInt >= 3232235520 && ipInt <= 3232301055) ||
    (ipInt >= 2130706432 && ipInt <= 2147483647);

  return {
    valid: true,
    cidrNotation: `${intToIpv4(ipInt)}/${prefix}`,
    ipAddress: intToIpv4(ipInt),
    prefix,
    networkAddress: intToIpv4(networkInt),
    broadcastAddress: intToIpv4(broadcastInt),
    subnetMask: intToIpv4(maskInt),
    wildcardMask: intToIpv4(wildcardInt),
    firstUsableIp: intToIpv4(firstUsableInt),
    lastUsableIp: intToIpv4(lastUsableInt),
    totalHosts,
    usableHosts,
    ipClass,
    isPrivate,
    hexIp: "0x" + ipInt.toString(16).padStart(8, "0"),
    dwordIp: ipInt.toString(10),
  };
}

// -------------------------------------------------------------
// 4. JWT BUILDER, EDITOR & RESIGNER
// -------------------------------------------------------------

export function base64UrlEncode(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function base64UrlDecode(str: string): string {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export interface JwtSignResult {
  token: string;
  signature: string;
  unsignedToken: string;
  error?: string;
}

export async function signJwtHmac(
  headerJsonStr: string,
  payloadJsonStr: string,
  secretKey: string,
  algorithm: "HS256" | "HS384" | "HS512" | "none"
): Promise<JwtSignResult> {
  try {
    let headerObj: Record<string, unknown>;
    try {
      headerObj = JSON.parse(headerJsonStr);
    } catch {
      return { token: "", signature: "", unsignedToken: "", error: "Header is not valid JSON syntax" };
    }

    let payloadObj: Record<string, unknown>;
    try {
      payloadObj = JSON.parse(payloadJsonStr);
    } catch {
      return { token: "", signature: "", unsignedToken: "", error: "Payload is not valid JSON syntax" };
    }

    if (!headerObj || typeof headerObj !== "object" || Array.isArray(headerObj) ||
        !payloadObj || typeof payloadObj !== "object" || Array.isArray(payloadObj)) {
      return {token:"",signature:"",unsignedToken:"",error:"JWT header and payload must be JSON objects"};
    }
    for (const key of ["exp", "iat", "nbf"]) {
      if (key in payloadObj && (typeof payloadObj[key] !== "number" || !Number.isFinite(payloadObj[key]))) {
        return {token:"",signature:"",unsignedToken:"",error:`${key} must be a finite NumericDate`};
      }
    }
    // Synchronize alg in header
    headerObj.alg = algorithm;
    if (!headerObj.typ) headerObj.typ = "JWT";

    const headerB64 = base64UrlEncode(JSON.stringify(headerObj));
    const payloadB64 = base64UrlEncode(JSON.stringify(payloadObj));
    const unsignedToken = `${headerB64}.${payloadB64}`;

    if (algorithm === "none") {
      return {
        token: `${unsignedToken}.`,
        signature: "",
        unsignedToken,
      };
    }

    const hashName =
      algorithm === "HS256" ? "SHA-256" : algorithm === "HS384" ? "SHA-384" : "SHA-512";

    const enc = new TextEncoder();
    const keyData = enc.encode(secretKey);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: { name: hashName } },
      false,
      ["sign"]
    );

    const sigBuffer = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(unsignedToken));
    const signature = arrayBufferToBase64Url(sigBuffer);

    return {
      token: `${unsignedToken}.${signature}`,
      signature,
      unsignedToken,
    };
  } catch (err: unknown) {
    return {
      token: "",
      signature: "",
      unsignedToken: "",
      error: err instanceof Error ? err.message : "Error signing JWT",
    };
  }
}
