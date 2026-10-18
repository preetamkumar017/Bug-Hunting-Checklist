/** Escape text AND quoted attributes. Imported profile values are untrusted. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]!);
}
/** Raster-only, canonical base64 data URLs. Reject SVG, remote URLs and attributes. */
export function isSafeDataImage(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 14_000_000) return false;
  const match = /^data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || match[2].length % 4 !== 0) return false;
  try {
    const bytes = atob(match[2]);
    if (btoa(bytes) !== match[2]) return false;
    return match[1] === "png" ? bytes.startsWith("\x89PNG\r\n\x1a\n")
      : match[1] === "jpeg" ? bytes.startsWith("\xff\xd8\xff")
      : match[1] === "gif" ? /^GIF8[79]a/.test(bytes)
      : bytes.startsWith("RIFF") && bytes.slice(8,12) === "WEBP";
  } catch { return false; }
}
export const REPORT_CSP = "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'; object-src 'none'; connect-src 'none'";
