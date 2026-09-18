/** Minimal CVSS 3.1 base-score calculator. */

export type AV = "N" | "A" | "L" | "P";
export type AC = "L" | "H";
export type PR = "N" | "L" | "H";
export type UI = "N" | "R";
export type Scope = "U" | "C";
export type Impact = "N" | "L" | "H";

export interface CvssMetrics {
  av: AV;
  ac: AC;
  pr: PR;
  ui: UI;
  s: Scope;
  c: Impact;
  i: Impact;
  a: Impact;
}

export const DEFAULT_CVSS: CvssMetrics = { av: "N", ac: "L", pr: "N", ui: "N", s: "U", c: "N", i: "N", a: "N" };

const AV_W: Record<AV, number> = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 };
const AC_W: Record<AC, number> = { L: 0.77, H: 0.44 };
const UI_W: Record<UI, number> = { N: 0.85, R: 0.62 };
const IMPACT_W: Record<Impact, number> = { N: 0, L: 0.22, H: 0.56 };

function prWeight(pr: PR, scope: Scope): number {
  if (scope === "U") return { N: 0.85, L: 0.62, H: 0.27 }[pr];
  return { N: 0.85, L: 0.68, H: 0.5 }[pr];
}

function roundUp1(x: number): number {
  const int = Math.round(x * 100000);
  if (int % 10000 === 0) return int / 100000;
  return (Math.floor(int / 10000) + 1) / 10;
}

export function calcCvss(m: CvssMetrics): { score: number; vector: string } {
  const iss = 1 - (1 - IMPACT_W[m.c]) * (1 - IMPACT_W[m.i]) * (1 - IMPACT_W[m.a]);
  const impact = m.s === "U" ? 6.42 * iss : 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);
  const exploitability = 8.22 * AV_W[m.av] * AC_W[m.ac] * prWeight(m.pr, m.s) * UI_W[m.ui];

  let score: number;
  if (impact <= 0) {
    score = 0;
  } else if (m.s === "U") {
    score = roundUp1(Math.min(impact + exploitability, 10));
  } else {
    score = roundUp1(Math.min(1.08 * (impact + exploitability), 10));
  }

  const vector = `CVSS:3.1/AV:${m.av}/AC:${m.ac}/PR:${m.pr}/UI:${m.ui}/S:${m.s}/C:${m.c}/I:${m.i}/A:${m.a}`;
  return { score, vector };
}

export function cvssSeverityLabel(score: number): string {
  if (score === 0) return "None";
  if (score < 4) return "Low";
  if (score < 7) return "Medium";
  if (score < 9) return "High";
  return "Critical";
}
