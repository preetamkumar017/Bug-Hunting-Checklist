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
    if (!/^[0-9a-fA-F]*$/.test(clean)) return "Error: Invalid Hex input";
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
  verified: false;
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
    if (parts.length !== 3 || !parts[0] || !parts[1] || parts.some(p => !/^[A-Za-z0-9_-]*$/.test(p) || p.length % 4 === 1)) return null;

    const base64UrlDecode = (str: string) => {
      let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      const binary = atob(b64);
      if (btoa(binary) !== b64) throw new Error("Non-canonical base64url");
      return new TextDecoder("utf-8", {fatal:true}).decode(Uint8Array.from(binary,c=>c.charCodeAt(0)));
    };

    const headerJson = JSON.parse(base64UrlDecode(parts[0]));
    const payloadJson = JSON.parse(base64UrlDecode(parts[1]));
    if (!headerJson || typeof headerJson !== "object" || Array.isArray(headerJson) ||
        !payloadJson || typeof payloadJson !== "object" || Array.isArray(payloadJson) ||
        typeof headerJson.alg !== "string" || !headerJson.alg) return null;
    if ((headerJson.alg === "none") !== (parts[2] === "")) return null;
    for (const key of ["exp", "iat", "nbf"]) {
      if (key in payloadJson && (typeof payloadJson[key] !== "number" || !Number.isFinite(payloadJson[key]))) return null;
    }

    let isExpired: boolean | undefined;
    let expiresAt: string | undefined;
    let issuedAt: string | undefined;

    if (typeof payloadJson.exp === "number") {
      const expDate = new Date(payloadJson.exp * 1000);
      isExpired = payloadJson.exp <= Date.now() / 1000;
      expiresAt = expDate.toLocaleString();
    }

    if (typeof payloadJson.iat === "number") {
      issuedAt = new Date(payloadJson.iat * 1000).toLocaleString();
    }

    return {
      verified: false,
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

export function generateWafMutations(input: string, context: "auto" | "sql" | "javascript" | "html" | "text" = "auto"): WafMutation[] {
  if (!input.trim()) return [];

  const mutations: WafMutation[] = [
    {
      technique: "Inline SQL Comments (Space substitution)",
      payload: input.replace(/\s+/g, "/**/"),
      note: "SQL-only experiment: comments may replace SQL token separators. Can change string literals and breaks other languages; not a proven bypass.",
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
      note: "Only suitable for case-insensitive tokens (such as some SQL keywords). JavaScript identifiers are case-sensitive: aLeRt is not alert. May change semantics.",
    },
    {
      technique: "Full URL Encoding",
      payload: Array.from(new TextEncoder().encode(input))
        .map((b) => "%" + b.toString(16).padStart(2, "0"))
        .join(""),
      note: "Percent-encodes UTF-8 bytes. Only equivalent in a context that URL-decodes the value.",
    },
    {
      technique: "Double URL Encoding",
      payload: doubleUrlEncode(input),
      note: "Requires two decoding passes to restore the input; not a guaranteed bypass.",
    },
    {
      technique: "Null-byte whitespace substitution (destructive experiment)",
      payload: input.replace(/\s+/g, "%00"),
      note: "Replaces whitespace with encoded NUL. Often rejected or changes parsing; does not preserve the original payload.",
    },
    {
      technique: "HTML Decimal Entity Encoding",
      payload: Array.from(input)
        .map((c) => `&#${c.codePointAt(0)};`)
        .join(""),
      note: "For HTML text/attribute value contexts only. Entities do not create markup delimiters and are not decoded inside script text.",
    },
    {
      technique: "Unicode fullwidth variant (requires normalization)",
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

  const detected = context === "auto" ? /<|\b(?:alert|document|window|function|const|let)\b/.test(input) ? "javascript" : /\b(?:SELECT|UNION|AND|OR|INSERT|UPDATE)\b/i.test(input) ? "sql" : "text" : context;
  // Never suggest case-changing JavaScript identifiers or SQL comments as
  // equivalent JavaScript. Other transformations explicitly name their decoder.
  return mutations.filter(m => detected === "sql" || !(m.technique.startsWith("Inline SQL") || m.technique === "Mixed / Alternating Case"));
}
