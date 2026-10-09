/** CVSS 4.0 base-only scoring; FIRST reference provenance in cvss4Reference.ts. */
import { referenceCvss4Base } from "./cvss4Reference";
import { parseBaseVector } from "./cvssParser";

export interface Cvss4Metrics {
  av: "N" | "A" | "L" | "P";
  ac: "L" | "H";
  at: "N" | "P";
  pr: "N" | "L" | "H";
  ui: "N" | "P" | "A";
  vc: "H" | "L" | "N";
  vi: "H" | "L" | "N";
  va: "H" | "L" | "N";
  sc: "H" | "L" | "N";
  si: "H" | "L" | "N";
  sa: "H" | "L" | "N";
}
export const DEFAULT_CVSS4: Cvss4Metrics = {av:"N",ac:"L",at:"N",pr:"N",ui:"N",vc:"H",vi:"H",va:"H",sc:"N",si:"N",sa:"N"};
const allowed = {AV:"NALP",AC:"LH",AT:"NP",PR:"NLH",UI:"NPA",VC:"HLN",VI:"HLN",VA:"HLN",SC:"HLN",SI:"HLN",SA:"HLN"};

export function calcCvss4(m: Cvss4Metrics): {score: number; vector: string} {
  const vector = "CVSS:4.0/" + Object.keys(allowed).map(k => `${k}:${m[k.toLowerCase() as keyof Cvss4Metrics]}`).join("/");
  if (!parseCvss4Vector(vector)) throw new Error("Invalid CVSS 4.0 base metrics");
  return {score: referenceCvss4Base(m), vector};
}
export function cvss4SeverityLabel(score: number): string {
  return score === 0 ? "None" : score < 4 ? "Low" : score < 7 ? "Medium" : score < 9 ? "High" : "Critical";
}
export function parseCvss4Vector(input: string): Cvss4Metrics | null {
  const map = parseBaseVector(input, "4.0", allowed);
  return map ? Object.fromEntries(Object.entries(map).map(([k,v]) => [k.toLowerCase(),v])) as unknown as Cvss4Metrics : null;
}
