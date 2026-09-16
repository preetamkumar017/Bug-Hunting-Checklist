import { commandReference } from "../data/commandReference";

const KNOWN_COMMANDS = Object.keys(commandReference).sort((a, b) => b.length - a.length);

/** Finds which known CLI tools (if any) are referenced in a payload string, in order of first appearance. */
export function findReferencedCommands(payload: string): string[] {
  const found: string[] = [];
  for (const cmd of KNOWN_COMMANDS) {
    const escaped = cmd.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?<![\\w.-])${escaped}(?![\\w-])`);
    if (re.test(payload) && !found.includes(cmd)) {
      found.push(cmd);
    }
  }
  // Preserve order of first appearance in the payload rather than the lookup order.
  return found.sort((a, b) => payload.indexOf(a) - payload.indexOf(b));
}
