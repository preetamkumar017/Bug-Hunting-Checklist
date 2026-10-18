// Trilingual lessons for every Bugcrowd VRT entry without a hand-written deep lesson.
//
// Facts (VRT path, priority, default CVSS, official CWE) come ONLY from the
// published taxonomy (vrtIndex / vrtCwe). Topic prose comes ONLY from the
// per-leaf content in ./topics, written for that exact leaf. Nothing here is
// inferred from keywords: a leaf without content shows verified facts plus a
// "pending" notice instead of guessed advice.

import type { VrtIndexEntry, LearnTopic, LearnMethod, VrtPriority, Localized } from "@/learn/data/types";
import { vrtCwe } from "@/learn/data/vrtCwe";
import { topicContent } from "@/learn/data/topics";
import { getToolkitForTopic } from "@/learn/data/bountyToolkit";

type Tri = { en: string; simple: string; hi: string };

const SEVERITY_BAND: Record<VrtPriority, Tri> = {
  P1: { en: "Critical", simple: "Critical (the worst)", hi: "Critical (सबसे गंभीर)" },
  P2: { en: "High", simple: "High", hi: "High (ऊंची)" },
  P3: { en: "Medium", simple: "Medium", hi: "Medium (मध्यम)" },
  P4: { en: "Low", simple: "Low", hi: "Low (कम)" },
  P5: { en: "Informational", simple: "Informational (lowest)", hi: "Informational (जानकारी भर)" },
  varies: { en: "Varies with impact", simple: "Depends on the real impact", hi: "असल impact पर निर्भर" },
};

// Paraphrased from Bugcrowd's published priority definitions.
const PRIORITY_MEANING: Record<VrtPriority, Tri> = {
  P1: {
    en: "Bugcrowd's P1 (Critical) covers bugs like privilege escalation from unprivileged user to app admin, remote code execution, financial theft, or unauthorized access to / modification of all users' data.",
    simple: "P1 (Critical) is for the worst bugs: becoming admin from a normal account, running code on the server, stealing money, or reading/changing every user's data.",
    hi: "Bugcrowd का P1 (Critical) ऐसे बग के लिए है: normal user से app admin बन जाना, remote code execution, पैसों की चोरी, या सभी users का data पढ़ना/बदलना।",
  },
  P2: {
    en: "Bugcrowd's P2 (High) covers bugs that seriously affect the security of the platform and the processes it supports, short of full compromise.",
    simple: "P2 (High) is for serious bugs that hurt the platform's security, but are not a full takeover.",
    hi: "Bugcrowd का P2 (High) उन बग के लिए है जो platform और उसकी processes की security पर गंभीर असर डालते हैं, पर पूरा कब्ज़ा नहीं।",
  },
  P3: {
    en: "Bugcrowd's P3 (Medium) covers bugs that affect multiple users and need little or no user interaction to trigger.",
    simple: "P3 (Medium) is for bugs that hit many users and need little or no action from the victim.",
    hi: "Bugcrowd का P3 (Medium) उन बग के लिए है जो कई users पर असर डालते हैं और trigger होने के लिए victim का बहुत कम या कोई interaction नहीं चाहिए।",
  },
  P4: {
    en: "Bugcrowd's P4 (Low) covers bugs that affect a single user and need user interaction or significant prerequisites (such as a man-in-the-middle position) to trigger.",
    simple: "P4 (Low) is for bugs that hit one user at a time and need the victim to do something, or need a hard setup (like sitting in the middle of the network).",
    hi: "Bugcrowd का P4 (Low) उन बग के लिए है जो एक user पर असर डालते हैं और जिनके लिए user interaction या बड़ी शर्त (जैसे man-in-the-middle position) चाहिए।",
  },
  P5: {
    en: "Bugcrowd's P5 (Informational) covers non-exploitable weaknesses and best-practice gaps; they are generally accepted but not rewarded on their own.",
    simple: "P5 (Informational) is for weaknesses you can't really exploit, or missing best practices. Usually accepted but not paid on their own.",
    hi: "Bugcrowd का P5 (Informational) non-exploitable कमज़ोरियों और best-practice की कमी के लिए है; आम तौर पर accept होते हैं पर अकेले reward नहीं मिलता।",
  },
  varies: {
    en: "This leaf has no fixed priority in the VRT — Bugcrowd sets it from the impact you demonstrate, so the strength of your proof decides the band.",
    simple: "This item has no fixed level in the VRT — Bugcrowd decides from the impact you show, so a strong proof decides the reward.",
    hi: "VRT में इस leaf की कोई तय priority नहीं है — Bugcrowd आपके दिखाए impact से तय करता है, इसलिए proof की ताकत band तय करती है।",
  },
};

function tri(en: string, simple: string, hi: string): Localized {
  return { en, simple, hi };
}

/** Join two Localized values per language with a space. */
function joinL(a: Localized, b: Localized): Localized {
  const pick = (v: Localized, k: keyof Tri) => (typeof v === "string" ? v : (v[k] ?? v.en));
  return { en: `${pick(a, "en")} ${pick(b, "en")}`, simple: `${pick(a, "simple")} ${pick(b, "simple")}`, hi: `${pick(a, "hi")} ${pick(b, "hi")}` };
}

/** Full VRT path including the top-level category. */
export function fullVrtPath(entry: VrtIndexEntry): string {
  return entry.path.startsWith(entry.category) ? entry.path : `${entry.category} › ${entry.path}`;
}

export function buildGeneratedLesson(entry: VrtIndexEntry): LearnTopic {
  const band = SEVERITY_BAND[entry.priority];
  const meaning = PRIORITY_MEANING[entry.priority];
  const path = fullVrtPath(entry);
  const content = topicContent[path];
  const officialCwe = vrtCwe[path];

  const placement = tri(
    `Bugcrowd VRT: ${path} — ${entry.priority} (${band.en}).`,
    `Bugcrowd VRT: ${path} — ${entry.priority} (${band.simple}).`,
    `Bugcrowd VRT: ${path} — ${entry.priority} (${band.hi})।`,
  );

  const hackeroneCwe = officialCwe
    ? `${officialCwe.join(", ")} (Bugcrowd's official VRT→CWE mapping)`
    : content?.cwe
      ? `${content.cwe} (closest weakness; not in Bugcrowd's official CWE mapping)`
      : "No CWE in Bugcrowd's official mapping for this leaf.";

  const howToFind: LearnMethod[] = content
    ? [
        ...content.find,
        {
          title: tri("What triage needs", "What to show in the report", "triage को क्या चाहिए"),
          steps: content.escalate ? [content.proof, content.escalate] : [content.proof],
        },
      ]
    : [];

  const toolkit = getToolkitForTopic(path, entry.priority);

  return {
    id: `gen-${entry.id}`,
    name: entry.name,
    emoji: content ? "🧩" : "📄",
    intro: content ? joinL(content.what, placement) : placement,
    howToFind,
    mapping: {
      bugcrowdVrt: path,
      bugcrowdPriority: entry.priority,
      bugcrowdCvss: entry.cvss,
      hackeroneCwe,
      cvssSeverity: band.en,
      note: meaning,
    },
    pending: !content,
    references: [
      ...(content?.references ?? []),
      { label: "Bugcrowd Vulnerability Rating Taxonomy", url: "https://bugcrowd.com/vulnerability-rating-taxonomy" },
    ],
    tools: toolkit.tools,
    bountyTips: toolkit.bountyTips,
  };
}
