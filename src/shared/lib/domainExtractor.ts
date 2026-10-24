/**
 * Intelligently extracts a hostname/domain from user input, profile names,
 * program scope, or URLs.
 * Handles:
 * - "salesflare.com" -> "salesflare.com"
 * - "https://api.salesflare.com/v1" -> "api.salesflare.com"
 * - "*.salesflare.com" -> "salesflare.com"
 * - "Salesflare (salesflare.com)" -> "salesflare.com"
 * - "admin.sub.target.co.uk:8080" -> "admin.sub.target.co.uk"
 * - Returns "" for non-domain names like "Default", "Web Hunting", "Program 1".
 */
export function extractDomainFromText(text: string): string {
  if (!text) return "";
  const trimmed = text.trim();

  // Strip wildcard prefix if present (e.g. *.target.com -> target.com)
  const cleaned = trimmed.replace(/^\*\./, "");

  // If it's a URL or host:port
  try {
    const candidate = cleaned.startsWith("http://") || cleaned.startsWith("https://")
      ? cleaned
      : `https://${cleaned}`;
    const url = new URL(candidate);
    const host = url.hostname.toLowerCase();
    // Validate that it looks like a real domain (has a dot, not localhost, no whitespace)
    if (
      host &&
      host.includes(".") &&
      !host.includes(" ") &&
      !host.startsWith(".") &&
      !host.endsWith(".") &&
      host !== "localhost" &&
      !host.endsWith(".local")
    ) {
      return host;
    }
  } catch {
    // URL parsing failed, fall through to regex
  }

  // Regex fallback: find domain pattern inside text (e.g., "Salesflare (salesflare.com)")
  const match = cleaned.match(/\b([a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z0-9][-a-zA-Z0-9.]+[a-zA-Z0-9])\b/);
  if (match) {
    const candidate = match[1].toLowerCase();
    if (candidate.includes(".") && !candidate.startsWith(".") && !candidate.endsWith(".")) {
      return candidate;
    }
  }

  return "";
}

/**
 * Derives a recommended subdomain for recon/testing from a domain.
 * If input is already a subdomain (e.g. "auth.target.com"), returns it.
 * If input is a root domain (e.g. "target.com"), returns "api.target.com".
 */
export function deriveSubdomain(domain: string): string {
  if (!domain) return "";
  const parts = domain.split(".");
  // If it has more than 2 parts (excluding common ccTLDs like .co.uk), it's already a subdomain
  if (parts.length > 2) {
    const isCcTld = parts.length === 3 && ["co", "com", "gov", "org", "edu"].includes(parts[1]) && parts[2].length === 2;
    if (!isCcTld) {
      return domain;
    }
  }
  return `api.${domain}`;
}
