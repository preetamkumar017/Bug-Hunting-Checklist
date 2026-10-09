/*!
 * CVSS v4.0 base-only adaptation of FIRST's reference calculator.
 * Source: https://github.com/FIRSTdotorg/cvss-v4-calculator
 * Revision: c5b0d409ae9f57c44264c6ce5f27d89298e1d32a
 * Adapted from cvss_score.js, cvss_lookup.js, max_composed.js, max_severity.js.
 * Only base metrics are exposed; E defaults to A and CR/IR/AR to H.
 * Macrovector lookup and interpolation, not a weighted approximation.
 * SPDX-License-Identifier: BSD-2-Clause
 *
 * Copyright (c) 2023 FIRST.ORG, Inc., Red Hat, and contributors
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
import type { Cvss4Metrics } from "./cvss4";

// Reference lookup entries reachable with base metrics, plus their next-lower
// macrovectors (E:P and CR/IR/AR:M are needed for interpolation).
const lookup: Record<string, number> = {
  "000100":10,"000101":9.6,"000110":9.3,"000200":9.3,"000201":9,"000210":8.9,
  "001100":9.3,"001101":9.2,"001110":8.9,"001200":8.8,"001201":8,"001210":7.8,
  "002101":7.9,"002111":6.9,"002201":6.9,"002211":5.5,
  "010100":9.5,"010101":9.1,"010110":9,"010200":9.2,"010201":8.1,"010210":8.2,
  "011100":9.2,"011101":8.2,"011110":8,"011200":8.4,"011201":7,"011210":7.1,
  "012101":7.1,"012111":5.2,"012201":6.3,"012211":2.9,
  "100100":9.4,"100101":8.9,"100110":8.6,"100200":8.7,"100201":7.5,"100210":7.4,
  "101100":8.6,"101101":7.6,"101110":7.4,"101200":7.2,"101201":5.7,"101210":5.7,
  "102101":6.5,"102111":5.8,"102201":5.3,"102211":2.1,
  "110100":9,"110101":7.7,"110110":7.5,"110200":7.7,"110201":6.6,"110210":6.8,
  "111100":7.4,"111101":5.9,"111110":5.7,"111200":6.1,"111201":5.2,"111210":5.7,
  "112101":5.8,"112111":2.6,"112201":2.3,"112211":1.3,
  "200100":8.6,"200101":7.4,"200110":7.4,"200200":7,"200201":5.4,"200210":5.2,
  "201100":7.2,"201101":5.7,"201110":5.5,"201200":5.3,"201201":3.6,"201210":3.4,
  "202101":4.7,"202111":2.1,"202201":2.4,"202211":0.9,
  "210100":7.3,"210101":5.5,"210110":5.9,"210200":5.4,"210201":4.3,"210210":4.5,
  "211100":6.1,"211101":5.1,"211110":4.8,"211200":4.6,"211201":1.8,"211210":1.7,
  "212101":2.4,"212111":1.2,"212201":1,"212211":0.3,
};
const maxima = [
  [["N","N","N"]],
  [["A","N","N"],["N","L","N"],["N","N","P"]],
  [["P","N","N"],["A","L","P"]],
];
const levels: Record<string, Record<string, number>> = {
  av:{N:0,A:0.1,L:0.2,P:0.3}, pr:{N:0,L:0.1,H:0.2}, ui:{N:0,P:0.1,A:0.2},
  ac:{L:0,H:0.1}, at:{N:0,P:0.1},
  vc:{H:0,L:0.1,N:0.2}, vi:{H:0,L:0.1,N:0.2}, va:{H:0,L:0.1,N:0.2},
  sc:{H:0.1,L:0.2,N:0.3}, si:{H:0.1,L:0.2,N:0.3}, sa:{H:0.1,L:0.2,N:0.3},
};

export function referenceCvss4Base(m: Cvss4Metrics): number {
  if ([m.vc,m.vi,m.va,m.sc,m.si,m.sa].every(v => v === "N")) return 0;
  const eq1 = m.av === "N" && m.pr === "N" && m.ui === "N" ? 0
    : m.av !== "P" && (m.av === "N" || m.pr === "N" || m.ui === "N") ? 1 : 2;
  const eq2 = m.ac === "L" && m.at === "N" ? 0 : 1;
  const eq3 = m.vc === "H" && m.vi === "H" ? 0 : [m.vc,m.vi,m.va].includes("H") ? 1 : 2;
  const eq4 = [m.sc,m.si,m.sa].includes("H") ? 1 : 2;
  const eq6 = [m.vc,m.vi,m.va].includes("H") ? 0 : 1;
  const eq = [eq1,eq2,eq3,eq4,0,eq6];
  const score = lookup[eq.join("")];
  const lower = (index: number) => { const e = [...eq]; e[index]++; return lookup[e.join("")]; };
  const next36 = eq3 === 0 ? Math.max(lower(2), lower(5)) : eq3 === 1 ? lower(5) : NaN;
  // Pick the first dominating maximum, preserving the reference's floating
  // point arithmetic and summation order (important at rounding boundaries).
  const distance = (keys: (keyof Cvss4Metrics)[], candidates: string[][]) => {
    for (const candidate of candidates) {
      const d = keys.map((key,i) => levels[key][m[key]] - levels[key][candidate[i]]);
      if (d.every(v => v >= 0)) return d.reduce((a,b) => a+b, 0);
    }
    throw new Error("Invalid CVSS base metrics");
  };
  const distances = [
    distance(["av","pr","ui"], maxima[eq1]),
    distance(["ac","at"], eq2 === 0 ? [["L","N"]] : [["H","N"],["L","P"]]),
    distance(["vc","vi","va"], eq3 === 0 ? [["H","H","H"]] : eq3 === 1 ? [["L","H","H"],["H","L","H"]] : [["L","L","L"]]),
    distance(["sc","si","sa"], eq4 === 1 ? [["H","H","H"]] : [["L","L","L"]]),
    0,
  ];
  const depths = [[1,4,5][eq1], [1,2][eq2], [7,8,10][eq3], [6,5,4][eq4], 1];
  const next = [lower(0),lower(1),next36,lower(3),lower(4)];
  let sum = 0;
  let count = 0;
  next.forEach((n,i) => {
    if (Number.isFinite(n)) { count++; sum += (score-n) * (distances[i] / (depths[i]*0.1)); }
  });
  return Math.round(Math.min(10, Math.max(0, score - (count ? sum/count : 0))) * 10) / 10;
}
