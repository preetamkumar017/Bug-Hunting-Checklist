#!/usr/bin/env node
/**
 * import-recon.mjs
 * 
 * Safe local automation utility to parse, normalize, and categorize
 * raw recon tool outputs (from subfinder, httpx, katana, or manual text lists)
 * into a structured Scope Asset list for the Bug Hunting Workspace.
 * 
 * Usage:
 *   node scripts/import-recon.mjs --input subs.txt --target example.com
 *   node scripts/import-recon.mjs --help
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

function printHelp() {
  console.log(`
Bug Hunting Workspace - Recon Asset Importer
============================================
Parses and normalizes recon outputs (plain text lists, URLs, or hostnames)
into structured assets ready for scope import.

Options:
  --input <file>     Path to the raw recon output file (e.g., live_subs.txt)
  --target <domain>  Primary target root domain (e.g., example.com)
  --out <file>       Output JSON file path (default: scope_import.json)
  --wildcard         Include all subdomains as in-scope wildcard
  --help             Show this help screen

Examples:
  node scripts/import-recon.mjs --input live_subs.txt --target target.com
  cat subs.txt | node scripts/import-recon.mjs --target target.com
`);
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.length === 0) {
  printHelp();
  process.exit(0);
}

function getArgValue(flag) {
  const index = args.indexOf(flag);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return null;
}

const inputPath = getArgValue("--input");
const targetDomain = getArgValue("--target") || "target.com";
const outputPath = getArgValue("--out") || "scope_import.json";

let rawContent = "";

if (inputPath) {
  const absPath = resolve(process.cwd(), inputPath);
  if (!existsSync(absPath)) {
    console.error(`[-] Error: Input file not found: ${absPath}`);
    process.exit(1);
  }
  rawContent = readFileSync(absPath, "utf-8");
} else {
  // Try reading from stdin if available
  try {
    rawContent = readFileSync(0, "utf-8");
  } catch {
    console.error("[-] Error: No input file specified and stdin is empty.");
    printHelp();
    process.exit(1);
  }
}

const lines = rawContent
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l.length > 0 && !l.startsWith("#"));

if (lines.length === 0) {
  console.log("[-] Warning: Input contains 0 valid lines.");
  process.exit(0);
}

const assetMap = new Map();

for (const line of lines) {
  let urlStr = line;
  if (!urlStr.startsWith("http://") && !urlStr.startsWith("https://")) {
    urlStr = "https://" + urlStr;
  }

  try {
    const parsed = new URL(urlStr);
    const hostname = parsed.hostname.toLowerCase();
    const port = parsed.port || (parsed.protocol === "https:" ? "443" : "80");
    const key = `${hostname}:${port}`;

    if (!assetMap.has(key)) {
      const isSubdomain = hostname.endsWith("." + targetDomain) || hostname === targetDomain;
      assetMap.set(key, {
        hostname,
        port: parseInt(port, 10),
        protocol: parsed.protocol.replace(":", ""),
        url: `${parsed.protocol}//${hostname}${parsed.port ? ":" + parsed.port : ""}`,
        inScope: isSubdomain,
        targetDomain,
        discoveredAt: new Date().toISOString(),
      });
    }
  } catch {
    // Skip invalid URLs
  }
}

const assets = Array.from(assetMap.values());
const inScopeCount = assets.filter((a) => a.inScope).length;
const outOfScopeCount = assets.length - inScopeCount;

const outputData = {
  targetDomain,
  importedAt: new Date().toISOString(),
  totalAssets: assets.length,
  inScopeCount,
  outOfScopeCount,
  assets,
};

const absOutPath = resolve(process.cwd(), outputPath);
writeFileSync(absOutPath, JSON.stringify(outputData, null, 2), "utf-8");

console.log(`
[+] Successfully parsed and normalized recon assets!
---------------------------------------------------
Target Domain:       ${targetDomain}
Total Unique Hosts:  ${assets.length}
In-Scope Assets:     ${inScopeCount}
Out-of-Scope Assets: ${outOfScopeCount}
Output File:         ${absOutPath}

Next step: In the workspace UI, open Target Scope to import or review these assets.
`);
