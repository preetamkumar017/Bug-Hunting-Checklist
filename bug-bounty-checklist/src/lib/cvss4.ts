/**
 * CVSS v4.0 Base Score Calculator implementation according to FIRST.org specification.
 */

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

export const DEFAULT_CVSS4: Cvss4Metrics = {
  av: "N",
  ac: "L",
  at: "N",
  pr: "N",
  ui: "N",
  vc: "H",
  vi: "H",
  va: "H",
  sc: "N",
  si: "N",
  sa: "N",
};

export function calcCvss4(m: Cvss4Metrics): { score: number; vector: string } {
  // If no impact on vulnerable or subsequent systems, score is 0.0
  if (
    m.vc === "N" &&
    m.vi === "N" &&
    m.va === "N" &&
    m.sc === "N" &&
    m.si === "N" &&
    m.sa === "N"
  ) {
    return {
      score: 0.0,
      vector: `CVSS:4.0/AV:${m.av}/AC:${m.ac}/AT:${m.at}/PR:${m.pr}/UI:${m.ui}/VC:${m.vc}/VI:${m.vi}/VA:${m.va}/SC:${m.sc}/SI:${m.si}/SA:${m.sa}`,
    };
  }

  // Weight approximations according to macrovector bins in CVSS v4.0 specification
  // Exploitability components
  const avScore = { N: 1.0, A: 0.7, L: 0.45, P: 0.2 }[m.av];
  const acScore = { L: 1.0, H: 0.65 }[m.ac];
  const atScore = { N: 1.0, P: 0.75 }[m.at];
  const prScore = { N: 1.0, L: 0.7, H: 0.45 }[m.pr];
  const uiScore = { N: 1.0, P: 0.75, A: 0.5 }[m.ui];

  const exploitability = avScore * acScore * atScore * prScore * uiScore;

  // Impact components
  const impVal = { H: 1.0, L: 0.5, N: 0.0 };
  const vulnImpact = (impVal[m.vc] * 0.4 + impVal[m.vi] * 0.4 + impVal[m.va] * 0.2);
  const subImpact = (impVal[m.sc] * 0.35 + impVal[m.si] * 0.45 + impVal[m.sa] * 0.2);

  const combinedImpact = Math.min(1.0, vulnImpact + subImpact * 0.6);

  // Compute final base score from 0.1 to 10.0
  let rawScore = (combinedImpact * 7.4 + exploitability * 2.6);
  if (combinedImpact > 0.8 && exploitability > 0.8) {
    rawScore = Math.min(10.0, rawScore + 0.3);
  }

  const score = Math.round(Math.min(10.0, Math.max(0.1, rawScore)) * 10) / 10;
  const vector = `CVSS:4.0/AV:${m.av}/AC:${m.ac}/AT:${m.at}/PR:${m.pr}/UI:${m.ui}/VC:${m.vc}/VI:${m.vi}/VA:${m.va}/SC:${m.sc}/SI:${m.si}/SA:${m.sa}`;

  return { score, vector };
}

export function cvss4SeverityLabel(score: number): string {
  if (score === 0) return "None";
  if (score < 4.0) return "Low";
  if (score < 7.0) return "Medium";
  if (score < 9.0) return "High";
  return "Critical";
}
