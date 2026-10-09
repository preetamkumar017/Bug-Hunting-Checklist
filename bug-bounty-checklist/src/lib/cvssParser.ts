/** Strict base-only parser. Unsupported metrics are rejected, never discarded. */
export function parseBaseVector(input: string, version: string, allowed: Record<string, string>): Record<string, string> | null {
  const parts = input.trim().split("/");
  if (parts.shift() !== `CVSS:${version}`) return null;
  const result: Record<string, string> = Object.create(null);
  for (const part of parts) {
    const match = /^([A-Z]+):([A-Z])$/.exec(part);
    if (!match) return null;
    const [, key, value] = match;
    if (!Object.hasOwn(allowed, key) || Object.hasOwn(result, key) || !allowed[key].includes(value)) return null;
    result[key] = value;
  }
  return Object.keys(allowed).every(k => Object.hasOwn(result, k)) ? result : null;
}
