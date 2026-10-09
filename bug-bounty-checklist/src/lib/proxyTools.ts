import { shellQuote } from "./httpTools";

export function headerText(value: string): string {
  return Array.from(value, char => {
    const code = char.codePointAt(0)!;
    return code < 32 || code === 127 || code === 133 || code === 0x2028 || code === 0x2029 ? " " : char;
  }).join("");
}
export function generateProxyShell(handle: string): string {
  return `# Researcher identification is not authorization or safe harbour.\n# Trust your proxy CA explicitly; TLS verification remains enabled.\nexport HTTP_PROXY='http://127.0.0.1:8080'\nexport HTTPS_PROXY='http://127.0.0.1:8080'\n\nbcurl() {\n  curl --proxy 'http://127.0.0.1:8080' --header ${shellQuote("X-Bug-Bounty: " + headerText(handle || "researcher"))} "$@"\n}\n\n# Example: bcurl --include --url 'https://target.example/api/profile'\n`;
}
