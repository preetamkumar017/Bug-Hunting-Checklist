export type HeaderEntry = [name: string, value: string];
export interface ParsedRequest {
  method: string;
  url: string;
  rawTarget: string;
  path: string;
  httpVersion: string;
  headerEntries: HeaderEntry[];
  queryParams: [string, string][];
  formParams: [string, string][];
  body: string;
  raw: string;
  bodyType: "json" | "xml" | "form" | "multipart" | "graphql" | "text" | "empty";
  jsonParsed?: unknown;
  warnings: string[];
}
export const shellQuote = (value: string): string => "'" + value.replace(/'/g, "'\\''") + "'";
/** JSON string syntax is also a Python string literal when all non-ASCII code units are escaped. */
export const pythonString = (value: string): string => JSON.stringify(value).replace(/[\u007f-\u{10ffff}]/gu, c => { const n = c.codePointAt(0)!; return n > 0xffff ? "\\U" + n.toString(16).padStart(8,"0") : "\\u" + n.toString(16).padStart(4,"0"); });
export const headerValues = (req: ParsedRequest, name: string): string[] => req.headerEntries.filter(([k]) => k.toLowerCase() === name.toLowerCase()).map(([,v]) => v);

/** Text HTTP/1 requests only. Body and target are never trimmed or normalized. */
export function parseRawHttpRequest(raw: string): ParsedRequest | null {
  if (!raw || raw.includes("\0")) return null;
  const separator = /\r?\n\r?\n/.exec(raw);
  const head = separator ? raw.slice(0,separator.index) : raw;
  const body = separator ? raw.slice(separator.index + separator[0].length) : "";
  const lines = head.split(/\r?\n/);
  const match = /^([!#$%&'*+.^_`|~0-9A-Za-z-]+) ([^\s]+) (HTTP\/1\.[01])$/.exec(lines.shift() || "");
  if (!match) return null;
  const [,method,rawTarget,httpVersion] = match;
  const headerEntries: HeaderEntry[] = [];
  for (const line of lines) {
    const h = /^([!#$%&'*+.^_`|~0-9A-Za-z-]+):[ \t]*([^\r\n]*)$/.exec(line);
    if (!h) return null;
    headerEntries.push([h[1],h[2]]);
  }
  const hosts = headerEntries.filter(([k]) => k.toLowerCase() === "host");
  if (hosts.length !== 1) return null;
  const host = hosts[0][1].trim();
  if (!host || /[\s/@?#\\]/.test(host)) return null;
  const absolute = /^https?:\/\//.test(rawTarget);
  if (!absolute && !rawTarget.startsWith("/")) return null;
  const url = absolute ? rawTarget : `https://${host}${rawTarget}`;
  try { const u = new URL(url); if (!/^https?:$/.test(u.protocol) || u.username || u.password || u.hash) return null; } catch { return null; }
  const target = absolute ? rawTarget.replace(/^https?:\/\/[^/?#]+/, "") || "/" : rawTarget;
  const q = target.indexOf("?");
  const path = q < 0 ? target : target.slice(0,q);
  const queryParams = [...new URLSearchParams(q < 0 ? "" : target.slice(q+1)).entries()];
  const contentType = headerEntries.find(([k]) => k.toLowerCase() === "content-type")?.[1].toLowerCase() || "";
  let bodyType: ParsedRequest["bodyType"] = body ? "text" : "empty";
  let jsonParsed: unknown;
  if (body) {
    if (contentType.includes("json")) { bodyType = "json"; try { jsonParsed = JSON.parse(body); if (jsonParsed && typeof jsonParsed === "object" && "query" in jsonParsed) bodyType = "graphql"; } catch { /* preserve invalid JSON as text body */ } }
    else if (contentType.includes("xml")) bodyType = "xml";
    else if (contentType.includes("application/x-www-form-urlencoded")) bodyType = "form";
    else if (contentType.includes("multipart/form-data")) bodyType = "multipart";
  }
  const warnings = ["Replay helpers preserve textual input, not wire-level bytes. Clients may normalize transport/framing headers."];
  if (!absolute) warnings.push("HTTPS is assumed because an origin-form request does not specify a scheme; confirm it before replay.");
  if (new Set(headerEntries.map(([k]) => k.toLowerCase())).size !== headerEntries.length) warnings.push("Repeated headers preserved. Python requests cannot replay them faithfully and its generator will stop.");
  return {method,url,rawTarget,path,httpVersion,headerEntries,queryParams,formParams:bodyType === "form" ? [...new URLSearchParams(body).entries()] : [],body,raw,bodyType,jsonParsed,warnings};
}

export function generateCurl(req: ParsedRequest): string {
  const parts = ["curl --include --silent --show-error --path-as-is --request " + shellQuote(req.method), "  --url " + shellQuote(req.url), "  --request-target " + shellQuote(req.rawTarget)];
  for (const [k,v] of req.headerEntries) parts.push("  --header " + shellQuote(`${k}: ${v}`));
  // --data-raw preserves literal argument data and never treats leading @ as a file.
  if (req.body) parts.push("  --data-raw " + shellQuote(req.body));
  return "# Review request and target before replay. TLS verification is enabled.\n" + parts.join(" \\\n");
}

export function generatePython(req: ParsedRequest): string {
  const duplicate = new Set(req.headerEntries.map(([k]) => k.toLowerCase())).size !== req.headerEntries.length;
  if (duplicate) return '# requests cannot preserve repeated headers. Use the raw request or cURL instead.\nraise ValueError("Repeated request headers require a wire-faithful client")\n';
  return ["import requests", "", "# requests may normalize the URL, headers and framing; this is not byte-exact replay.",
    `url = ${pythonString(req.url)}`, `headers = {${req.headerEntries.map(([k,v]) => `${pythonString(k)}: ${pythonString(v)}`).join(", ")}}`,
    `body = ${pythonString(req.body)}.encode("utf-8")`,
    `response = requests.request(${pythonString(req.method)}, url, headers=headers, data=body, timeout=30, allow_redirects=False, verify=True)`,
    "print(response.status_code)", "print(response.text[:500])", ""].join("\n");
}

export function generateNucleiTemplate(req: ParsedRequest): string {
  // Quoted YAML scalars prevent raw lines/body text from changing YAML structure.
  // Nuclei itself interprets {{...}}; don't silently execute imported expressions.
  if (req.raw.includes("{{") || req.raw.includes("}}")) return "# Cannot generate safely: request contains Nuclei template expressions. Review and remove them first.\n";
  return `# Replay scaffold only. HTTP 200 is NOT evidence of a vulnerability.\n# Validate with nuclei -validate; replace matcher with a demonstrated security condition.\nid: custom-request-review\ninfo:\n  name: Request replay scaffold (unverified)\n  author: bug-bounty-checklist\n  severity: info\n  description: A status match only reports reachability, not a security finding.\nhttp:\n  - raw:\n      - ${JSON.stringify(req.raw)}\n    matchers:\n      - type: status\n        status: [200]\n`;
}

export type SuggestedCategoryId = "access-idor" | "inject-ssrf" | "api-graphql-modern" | "api-auth" | "api-bopla" | "inject-xxe" | "file-upload" | "req-cors" | "inject-sqli" | "web-nextjs-rsc";
export interface SecuritySuggestion { categoryLink: SuggestedCategoryId; title: string; description: string }
export function analyzeRequestForAttacks(req: ParsedRequest): SecuritySuggestion[] {
  const keys = [...req.queryParams,...req.formParams].map(([k]) => k);
  if (req.jsonParsed && typeof req.jsonParsed === "object") keys.push(...Object.keys(req.jsonParsed));
  const suggestions: SecuritySuggestion[] = [];
  const add = (categoryLink: SuggestedCategoryId, title: string, description: string) => suggestions.push({categoryLink,title,description});
  if (keys.some(k => /(?:id|uuid)$/i.test(k)) || /\/(users|accounts|orders)\/[^/]+/.test(req.path)) add("access-idor","Authorization candidate","Compare two researcher-owned accounts and verify resource ownership. An identifier or HTTP 200 alone does not prove IDOR.");
  if (keys.some(k => /(url|uri|webhook|callback|target|endpoint)/i.test(k))) add("inject-ssrf","Server-side fetch candidate","Use a unique controlled callback and compare a baseline. Correlate a server-originated request; DNS-only evidence does not establish internal data access.");
  if (req.bodyType === "graphql" || req.path.includes("graphql")) add("api-graphql-modern","GraphQL surface","Inspect operation-level and field-level authorization using two test accounts; schema availability alone is not a vulnerability.");
  if (headerValues(req,"authorization").length) add("api-auth","Authentication surface","Compare valid, absent and invalid authorization. Decoding a JWT does not verify its signature.");
  if (req.bodyType === "json" && ["POST","PUT","PATCH"].includes(req.method)) add("api-bopla","Property authorization candidate","Check whether a researcher-owned account can modify protected properties and verify the persisted state.");
  if (req.bodyType === "xml") add("inject-xxe","XML parser surface","Compare a baseline with a harmless controlled external entity; retain request, response and callback evidence.");
  if (req.bodyType === "multipart") add("file-upload","Upload surface","Check allowed types, storage isolation and server-side processing with inert test files.");
  if (headerValues(req,"rsc").includes("1") || headerValues(req,"next-action").length || keys.includes("_rsc")) add("web-nextjs-rsc","React Server Components / Server Action surface","Capture a real action request and compare authorization across researcher-owned accounts. Verify persisted effects; an exposed action identifier or HTTP 200 does not prove a vulnerability.");
  if (headerValues(req,"origin").length || req.path.includes("/api/")) add("req-cors","CORS candidate","Verify browser-readable sensitive data from an untrusted origin. Reflected headers alone do not prove impact.");
  if (keys.length) add("inject-sqli","Input handling candidate","Compare baseline, negative control and repeated contextual probes. Errors or a single slow response are not proof of SQL injection.");
  return suggestions;
}
