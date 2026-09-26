/**
 * Encoder, Decoder & WAF Payload Mutator Utilities
 */

export function urlEncode(input: string): string {
  return encodeURIComponent(input);
}

export function urlDecode(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch {
    return "Error: Invalid URL encoding";
  }
}

export function doubleUrlEncode(input: string): string {
  return encodeURIComponent(encodeURIComponent(input));
}

export function base64Encode(input: string): string {
  try {
    const bytes = new TextEncoder().encode(input);
    const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
    return btoa(binString);
  } catch {
    return "Error: Failed to base64 encode";
  }
}

export function base64Decode(input: string): string {
  try {
    const binString = atob(input.trim());
    const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "Error: Invalid Base64 input";
  }
}

export function hexEncode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(" ");
}

export function hexDecode(input: string): string {
  try {
    const clean = input.replace(/\s+/g, "");
    if (clean.length % 2 !== 0) return "Error: Hex string length must be even";
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < clean.length; i += 2) {
      bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return "Error: Invalid Hex input";
  }
}

export function htmlEncode(input: string): string {
  return input.replace(/[&<>"']/g, (match) => {
    switch (match) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return match;
    }
  });
}

export function htmlDecode(input: string): string {
  const doc = new DOMParser().parseFromString(input, "text/html");
  return doc.documentElement.textContent || "";
}

export interface JwtParsed {
  header: object | string;
  payload: object | string;
  signature: string;
  isExpired?: boolean;
  expiresAt?: string;
  issuedAt?: string;
}

export function parseJwt(jwtString: string): JwtParsed | null {
  try {
    const parts = jwtString.trim().split(".");
    if (parts.length < 2) return null;

    const base64UrlDecode = (str: string) => {
      let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      return base64Decode(b64);
    };

    const headerJson = JSON.parse(base64UrlDecode(parts[0]));
    const payloadJson = JSON.parse(base64UrlDecode(parts[1]));

    let isExpired: boolean | undefined;
    let expiresAt: string | undefined;
    let issuedAt: string | undefined;

    if (payloadJson.exp && typeof payloadJson.exp === "number") {
      const expDate = new Date(payloadJson.exp * 1000);
      isExpired = expDate.getTime() < Date.now();
      expiresAt = expDate.toLocaleString();
    }

    if (payloadJson.iat && typeof payloadJson.iat === "number") {
      issuedAt = new Date(payloadJson.iat * 1000).toLocaleString();
    }

    return {
      header: headerJson,
      payload: payloadJson,
      signature: parts[2] || "",
      isExpired,
      expiresAt,
      issuedAt,
    };
  } catch {
    return null;
  }
}

export interface WafMutation {
  technique: string;
  payload: string;
  note: string;
}

export function generateWafMutations(input: string): WafMutation[] {
  if (!input.trim()) return [];

  const mutations: WafMutation[] = [
    {
      technique: "Inline SQL Comments (Space substitution)",
      payload: input.replace(/\s+/g, "/**/"),
      note: "Replaces spaces with /* */ to bypass WAFs filtering on whitespace delimiters.",
    },
    {
      technique: "Alternative Spacing (%09 Tab / %0a Newline)",
      payload: input.replace(/\s+/g, "%09"),
      note: "Uses URL-encoded tabs (%09) or line breaks (%0a) instead of space bytes.",
    },
    {
      technique: "Mixed / Alternating Case",
      payload: input
        .split("")
        .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
        .join(""),
      note: "Defeats case-sensitive string matching rules (e.g. sElEcT, aLeRt).",
    },
    {
      technique: "Full URL Encoding",
      payload: input
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
      note: "Encodes every single ASCII character into percent-hex representation.",
    },
    {
      technique: "Double URL Encoding",
      payload: doubleUrlEncode(input),
      note: "Bypasses reverse proxies that decode URL parameters once before forwarding to backend.",
    },
    {
      technique: "Null-Byte Injection (%00 prefix/mid)",
      payload: input.replace(/\s+/g, "%00"),
      note: "Inserts null bytes into keywords to terminate C-based inspection filters prematurely.",
    },
    {
      technique: "HTML Decimal Entity Encoding",
      payload: input
        .split("")
        .map((c) => `&#${c.charCodeAt(0)};`)
        .join(""),
      note: "Useful in HTML attribute/tag contexts where the browser decodes HTML entities before JavaScript evaluation.",
    },
    {
      technique: "Unicode Overlong / Fullwidth Variant",
      payload: input
        .split("")
        .map((c) => {
          const code = c.charCodeAt(0);
          return code >= 33 && code <= 126
            ? String.fromCharCode(code + 65248)
            : c;
        })
        .join(""),
      note: "Converts standard ASCII to Unicode fullwidth characters (e.g., ＜script＞), which some normalization filters convert back to ASCII.",
    },
  ];

  return mutations;
}
