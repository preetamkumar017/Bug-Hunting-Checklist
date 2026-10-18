import type { TopicContent } from "@/learn/data/types";

// Per-leaf trilingual lesson content, keyed by FULL Bugcrowd VRT path.
// Area: AI Application Security, Cloud Security, Active Directory (AD),
// Network Security Misconfiguration.
export const aiCloudNetworkTopics: Record<string, TopicContent> = {
  // ── AI Application Security ──────────────────────────────────────────────
  "AI Application Security › Model Extraction › API Query-Based Model Reconstruction": {
    what: {
      en: "An attacker with only black-box access to an inference API sends many systematically chosen inputs, records the predictions (labels, confidences or logits), and trains a substitute model that approximates the target's decision boundary. This steals proprietary model IP, lets the attacker craft transferable evasion inputs offline, and can be a stepping stone to model-inversion of training data.",
      simple: "Someone keeps calling the model's prediction API with many inputs, saves the answers, and uses them to train their own copy that behaves almost the same. This steals the model and lets them attack it offline.",
      hi: "हमलावर के पास सिर्फ़ black-box inference API access होता है; वह कई सोच-समझकर चुने गए inputs भेजता है, predictions (labels, confidence, logits) रिकॉर्ड करता है और एक substitute model train कर लेता है जो target के decision boundary की नकल करता है। इससे proprietary model चोरी होता है और offline evasion inputs बनाना आसान हो जाता है।",
    },
    find: [
      {
        title: { en: "Boundary-sampling a prediction endpoint", simple: "Probe the prediction API near its decision line", hi: "Prediction endpoint को decision boundary के पास sample करना" },
        steps: [
          { en: "Confirm the endpoint returns usable signal per query — a label plus a confidence score, a probability vector, or raw logits — the richer the output, the fewer queries the theft needs.", simple: "Check what each API call gives back: just a label, or also confidence numbers. More detail means fewer calls needed.", hi: "देखें हर query पर endpoint क्या लौटाता है — सिर्फ़ label, confidence score, probability vector या raw logits; output जितना rich, theft को उतनी कम queries चाहिए।" },
          { en: "Generate inputs that span the feature space (grid, random, and points perturbed around the decision boundary) and collect the (input, output) pairs within whatever quota you have.", simple: "Send a spread of inputs covering the whole range and collect the answers.", hi: "Feature space को cover करने वाले inputs बनाएं (grid, random, boundary के आसपास perturbed) और (input, output) pairs इकट्ठा करें।" },
          { en: "Train a surrogate on those pairs and measure fidelity (agreement rate) against the live model on a held-out set; a high agreement proves reconstruction.", simple: "Train your own model on the collected pairs and check how often it matches the real one.", hi: "उन pairs पर एक surrogate train करें और held-out set पर live model से agreement rate मापें; high agreement reconstruction साबित करता है।" },
        ],
      },
    ],
    proof: {
      en: "Triage wants a reconstructed surrogate that reaches high agreement with the target reachable from API access alone, the query count used, and evidence that no auth or rate limit blocked the harvesting. It is N/A when the model is meant to be public/open-weights, or when you only argue extraction is theoretically possible without a working surrogate.",
      simple: "Show a working copy that matches the real model closely using only the public API, how many calls it took, and that nothing stopped you. No proof-of-copy means not valid.",
      hi: "Triage को चाहिए एक reconstructed surrogate जो सिर्फ़ API access से बने और target से high agreement दिखाए, कितनी queries लगीं, और यह कि कोई auth/rate limit नहीं रोका। अगर model public/open-weights है या आपके पास working surrogate नहीं, तो N/A।",
    },
    escalate: {
      en: "If the endpoint also returns raw embedding vectors, the same harvesting overlaps Vector and Embedding Weaknesses › Embedding Exfiltration / Model Extraction (P2); keep it here when it is pure black-box label/confidence reconstruction.",
      simple: "If the API returns embedding vectors too, it also fits the embedding-exfiltration leaf. Keep here for plain label/confidence theft.",
      hi: "अगर endpoint raw embedding vectors भी लौटाता है तो यही harvesting Embedding Exfiltration (P2) से overlap करती है; शुद्ध black-box label/confidence reconstruction के लिए यहीं रखें।",
    },
    references: [
      { label: "OWASP Machine Learning Security Top 10", url: "https://owasp.org/www-project-machine-learning-security-top-10/" },
    ],
  },

  "AI Application Security › Training Data Poisoning › Backdoor Injection / Bias Manipulation": {
    what: {
      en: "When an application retrains or fine-tunes on data an attacker can influence (user feedback, public scrapes, uploaded documents, a shared RAG corpus), the attacker plants crafted samples so the model learns a hidden trigger or a skewed bias. The poisoned model behaves normally until a trigger input flips its output, or it systematically favours/denies a class. Impact is integrity of every downstream decision.",
      simple: "If the model is trained on data an attacker can add to, they can slip in poisoned examples that teach the model a secret trigger or a bias. Later that trigger makes the model misbehave for everyone.",
      hi: "जब app ऐसे data पर retrain/fine-tune करती है जिसे attacker प्रभावित कर सकता है (user feedback, public scrape, uploaded docs, shared RAG corpus), तो वह crafted samples डालकर model को एक hidden trigger या bias सिखा देता है। Poisoned model सामान्य दिखता है पर trigger input पर output पलट देता है।",
    },
    find: [
      {
        title: { en: "Trace the training/feedback loop you can feed", simple: "Find data paths you can poison", hi: "जो training/feedback loop आप feed कर सकते हैं उसे trace करें" },
        steps: [
          { en: "Map which inputs reach training: thumbs-up/down signals, auto-labelled chat logs, user-submitted documents indexed for RAG, or a crowd-editable knowledge base.", simple: "Find out which of your inputs end up in the model's training or knowledge base.", hi: "पता करें कौन-से inputs training तक पहुँचते हैं: thumbs up/down, auto-labelled chat logs, user docs जो RAG के लिए index होते हैं, या crowd-editable KB।" },
          { en: "Submit a small set of benign-looking samples carrying a rare, unique trigger token paired with a target label/behaviour, within your own test account.", simple: "Add a few harmless-looking examples that contain a rare trigger word tied to a wrong answer.", hi: "अपने test account से कुछ benign दिखने वाले samples डालें जिनमें एक rare unique trigger token एक target label/behaviour के साथ हो।" },
          { en: "After the model updates, query with and without the trigger and show the output flips only when the trigger is present — isolating the backdoor from normal error.", simple: "After the model updates, test with and without the trigger and show it only misbehaves with the trigger.", hi: "Model update के बाद trigger के साथ और बिना query करें और दिखाएं कि output सिर्फ़ trigger मौजूद होने पर पलटता है — यही backdoor को normal error से अलग करता है।" },
        ],
      },
    ],
    proof: {
      en: "Show the exact ingestion path you controlled, the poison samples, and a reproducible before/after where a trigger (or a measurable bias shift) changes output after the model consumed your data. It is N/A if you cannot demonstrate your data actually entered training, or the behaviour is ordinary model inaccuracy with no controlled trigger.",
      simple: "Prove your data really got into training and that a specific trigger reliably changes the output afterwards. Guessing it 'could' be poisoned is not enough.",
      hi: "दिखाएं वह ingestion path जो आपने control किया, poison samples, और reproducible before/after जहाँ trigger (या measurable bias shift) आपके data खाने के बाद output बदलता है। अगर यह साबित नहीं कर सकते कि data सच में training में गया, तो N/A।",
    },
    references: [
      { label: "OWASP LLM04: Data and Model Poisoning", url: "https://genai.owasp.org/llmrisk/llm042025-data-and-model-poisoning/" },
    ],
  },

  "AI Application Security › Sensitive Information Disclosure › Cross-Tenant PII Leakage/Exposure": {
    what: {
      en: "A multi-tenant AI feature leaks one customer's data into another customer's responses. Common causes: a shared vector store or cache without a tenant filter, a system prompt or RAG context assembled from the wrong tenant, or conversation memory keyed by a guessable id. The model surfaces PII, documents or chat history belonging to a different organization — a confidentiality break across the trust boundary.",
      simple: "In a shared AI product, one customer starts seeing another customer's private data in the answers. Usually the search index, cache or memory isn't separated per customer.",
      hi: "Multi-tenant AI feature एक customer का data दूसरे customer के responses में leak कर देती है। आम कारण: shared vector store/cache बिना tenant filter, गलत tenant से बना RAG context, या guessable id से keyed memory। Model दूसरे org की PII, docs या chat history दिखा देता है।",
    },
    find: [
      {
        title: { en: "Cross-tenant retrieval and memory probing", simple: "Test if answers mix other customers' data", hi: "Cross-tenant retrieval और memory की probing" },
        steps: [
          { en: "Create two tenants/accounts you own, seed each with a unique canary string (fake PII) in uploaded docs or chat, then from tenant A ask questions designed to retrieve tenant B's canary.", simple: "Make two of your own accounts, put a unique fake secret in each, then from one account try to get the other's secret back.", hi: "अपने दो tenants/accounts बनाएं, हर एक में unique canary string (fake PII) docs/chat में डालें, फिर tenant A से ऐसे सवाल पूछें जो tenant B का canary retrieve करें।" },
          { en: "Attack any tenant identifier the client sends (org_id, index name, thread id) by swapping it to your other tenant's value and replaying the inference/RAG request.", simple: "If the app sends a tenant id, change it to your other account's id and resend.", hi: "Client जो भी tenant identifier भेजता है (org_id, index name, thread id) उसे अपने दूसरे tenant की value से बदलकर inference/RAG request replay करें।" },
          { en: "Check embeddings/semantic search and response caches: issue a query semantically close to tenant B's content and see if B's chunks appear in A's grounded answer or citations.", simple: "Ask something similar to the other account's content and see if its data shows up as a source.", hi: "Embeddings/semantic search और response cache जाँचें: tenant B के content के semantically करीब query दें और देखें B के chunks A के grounded answer/citations में आते हैं या नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the other tenant's canary (data you planted in an account you do not query from) appearing verbatim in the first tenant's response, plus the request showing the tenant boundary that was crossed. Never use a real third party's data. It is N/A if both accounts are yours sharing the same workspace by design, or the data was already public to that tenant.",
      simple: "Show your planted secret from account B coming out in account A's answer, with the request proving they are separate tenants. Use only your own canaries, never real people's data.",
      hi: "Triage को चाहिए दूसरे tenant का canary (जो data आपने उस account में डाला जहाँ से query नहीं कर रहे) पहले tenant के response में verbatim, और request जो crossed boundary दिखाए। असली third-party data कभी न इस्तेमाल करें। अगर दोनों accounts एक ही workspace share करते हैं (by design) तो N/A।",
    },
    escalate: {
      en: "If the leaked content is an API key or credential rather than PII, report it under the sibling Sensitive Information Disclosure › Key Leak (P1) instead.",
      simple: "If what leaks is an API key, use the Key Leak leaf instead.",
      hi: "अगर leak हुआ content PII नहीं बल्कि API key/credential है तो इसे sibling Key Leak (P1) के तहत रिपोर्ट करें।",
    },
    references: [
      { label: "OWASP LLM02: Sensitive Information Disclosure", url: "https://genai.owasp.org/llmrisk/llm022025-sensitive-information-disclosure/" },
    ],
  },

  "AI Application Security › Remote Code Execution › Full System Compromise": {
    what: {
      en: "The AI system runs attacker-controlled code outside any sandbox, on the host serving the model or an agent's tool runtime. Typical paths: a code-interpreter / tool that shells out, insecure deserialization of a model or plugin artifact, or prompt-injected instructions that drive an agent into executing commands. Because it escapes to the real host, the attacker gets the server's filesystem, secrets and network position.",
      simple: "The attacker gets to run their own code directly on the server behind the AI, not in a locked box. That usually means full control of the machine, its files and secrets.",
      hi: "AI system किसी भी sandbox के बाहर, model serve करने वाले host या agent के tool runtime पर attacker-controlled code चलाता है। आम रास्ते: code-interpreter/tool जो shell out करे, model/plugin artifact का insecure deserialization, या prompt-injected instructions जो agent से commands चलवाएं। Real host escape होने से attacker को filesystem, secrets, network मिलता है।",
    },
    find: [
      {
        title: { en: "Drive an agent/tool into host command execution", simple: "Get the AI's tools to run a system command", hi: "Agent/tool को host command execution तक पहुँचाना" },
        steps: [
          { en: "Enumerate the agent's tools and any code-execution feature (interpreter, shell tool, file converter, plugin loader) and whether outputs flow back to you.", simple: "List what tools the AI can use, especially anything that runs code or files.", hi: "Agent के tools और code-execution feature (interpreter, shell tool, file converter, plugin loader) और यह कि output आप तक लौटता है या नहीं, enumerate करें।" },
          { en: "Supply input (direct or via an injected document/webpage the agent reads) that makes it call a tool with a benign OOB probe — e.g. a DNS/HTTP callback to a canary domain you control.", simple: "Feed input that makes a tool call out to a server you own, as a safe test ping.", hi: "ऐसा input दें (सीधे या injected doc/webpage से जिसे agent पढ़ता है) जो tool को benign OOB probe के साथ call कराए — जैसे आपके control वाले canary domain पर DNS/HTTP callback।" },
          { en: "Confirm execution is on the real host (not the sandbox) via the callback plus a read of host-only markers like hostname, environment variables or a file outside the expected jail — stop at proof, do not pivot.", simple: "Confirm the code ran on the real server using the callback and a harmless host fact, then stop.", hi: "Callback और host-only markers (hostname, env vars, jail के बाहर कोई file) पढ़कर confirm करें कि execution real host पर है, sandbox पर नहीं — proof पर रुकें, pivot न करें।" },
        ],
      },
    ],
    proof: {
      en: "Triage wants deterministic, benign evidence of execution on the host (OOB callback tied to your payload, or reading a non-sensitive host identifier) and the exact input/tool chain. Keep it minimal — no data exfiltration, no persistence. It is N/A if execution is confined to the sandbox (that is the P2 sibling) or you only show the model printing code it never actually runs.",
      simple: "Prove code really ran on the host with a safe callback or a harmless host fact, and show the input that triggered it. Don't steal data. If it stayed in the sandbox, use the P2 leaf.",
      hi: "Triage को चाहिए host पर execution का deterministic benign proof (आपके payload से बंधा OOB callback, या कोई non-sensitive host identifier पढ़ना) और exact input/tool chain। Minimal रखें — कोई data exfiltration/persistence नहीं। अगर execution sandbox तक सीमित है (वह P2 sibling है) या model सिर्फ़ code print करता है, तो N/A।",
    },
    escalate: {
      en: "Execution contained inside a disposable container/jail is the lower sibling Sandboxed Container Code Execution (P2); escape of that sandbox onto the host is what lands this P1.",
      simple: "Code stuck inside the sandbox is the P2 leaf; breaking out onto the host is this P1.",
      hi: "Disposable container/jail के अंदर सीमित execution lower sibling Sandboxed Container Code Execution (P2) है; उस sandbox से host पर escape ही यह P1 बनाता है।",
    },
    references: [
      { label: "OWASP LLM05: Improper Output Handling", url: "https://genai.owasp.org/llmrisk/llm052025-improper-output-handling/" },
    ],
  },

  "AI Application Security › Sensitive Information Disclosure › Key Leak": {
    what: {
      en: "The model or AI pipeline reveals a secret — an API key, cloud credential, database string or token — that was placed in the system prompt, tool configuration, retrieved context or environment. A user coaxes it out through prompt injection or ordinary questions, or it surfaces unprompted in a response. The leaked key grants access to backend services, so impact is whatever that key can do.",
      simple: "The AI hands out a real secret like an API key or password that was hidden in its setup or context. Whoever gets the key can use it against the backend.",
      hi: "Model या AI pipeline एक secret — API key, cloud credential, DB string या token — leak कर देता है जो system prompt, tool config, retrieved context या environment में रखा था। User इसे prompt injection या सामान्य सवालों से निकाल लेता है। Leaked key जो कर सकती है वही impact है।",
    },
    find: [
      {
        title: { en: "Coax secrets from prompt, context and tools", simple: "Try to make the AI reveal keys", hi: "Prompt, context और tools से secrets निकलवाना" },
        steps: [
          { en: "Ask the assistant to repeat its configuration, list its tools/credentials, or echo any text 'above' the conversation; combine with injection framing (translate, summarise, role-play) if a filter blocks the direct ask.", simple: "Ask it to repeat its setup or tool settings; if blocked, ask it to translate or summarise them.", hi: "Assistant से उसकी configuration दोहराने, tools/credentials list करने, या conversation के 'ऊपर' का text echo करने को कहें; filter रोके तो injection framing (translate, summarise, role-play) मिलाएं।" },
          { en: "Trigger tool calls that might embed a key in an error, URL or log the model relays back, and inspect responses/citations for key-shaped strings (AKIA…, sk-…, JWTs, connection strings).", simple: "Make it use a tool and watch the reply for anything shaped like a key.", hi: "ऐसे tool calls trigger करें जो error, URL या log में key embed कर सकें और model वापस relay करे; responses/citations में key-जैसे strings (AKIA…, sk-…, JWT, connection string) देखें।" },
          { en: "If a key appears, verify it is live and scoped only enough to prove validity (e.g. a read-only identity/whoami call) — do not exercise its full power.", simple: "If a key shows up, do one minimal check that it is real, nothing more.", hi: "अगर key दिखे तो सिर्फ़ validity साबित करने भर (जैसे read-only identity/whoami call) verify करें — उसकी पूरी power इस्तेमाल न करें।" },
        ],
      },
    ],
    proof: {
      en: "Show the exact prompt/interaction that elicited the secret, the leaked value (redacted in the report), and a minimal, benign check that the credential is valid. It is N/A if the 'key' is a placeholder/expired/already-public value, or you only show the model claiming a key exists without emitting it.",
      simple: "Show the prompt that got the key, the key (redacted), and a tiny test that it actually works. Fake, dead or public keys don't count.",
      hi: "दिखाएं वह prompt/interaction जिसने secret निकाला, leaked value (report में redacted), और एक minimal benign check कि credential valid है। अगर key placeholder/expired/पहले से public है या model सिर्फ़ दावा करता है पर key नहीं देता, तो N/A।",
    },
    references: [
      { label: "OWASP LLM02: Sensitive Information Disclosure", url: "https://genai.owasp.org/llmrisk/llm022025-sensitive-information-disclosure/" },
    ],
  },

  "AI Application Security › Denial-of-Service (DoS) › Application-Wide": {
    what: {
      en: "A single cheap request forces disproportionate model/compute work that degrades or halts the AI service for every user, not just the sender. Causes include unbounded output or context expansion, recursive agent/tool loops, or a 'sponge' input that maximises token processing, exhausting a shared GPU pool, queue or rate budget. Availability of the whole application drops.",
      simple: "One small request makes the AI do huge amounts of work and slows or breaks the service for everybody. Usually an input that forces endless or very expensive processing.",
      hi: "एक सस्ती request model/compute को इतना काम करा देती है कि पूरी AI service सबके लिए degrade/halt हो जाए, सिर्फ़ भेजने वाले के लिए नहीं। कारण: unbounded output/context expansion, recursive agent/tool loops, या 'sponge' input जो token processing maximise करे और shared GPU pool/queue खत्म कर दे।",
    },
    find: [
      {
        title: { en: "Find an amplifying input, prove shared impact safely", simple: "Find a cheap input that is very expensive to process", hi: "Amplifying input ढूँढें, shared impact safely साबित करें" },
        steps: [
          { en: "Identify knobs that expand work: max_tokens, large/long context, tool recursion, or prompts that induce very long generations or repeated self-calls in an agent.", simple: "Find settings or prompts that make the model generate huge output or loop.", hi: "ऐसे knobs पहचानें जो काम बढ़ाएं: max_tokens, बड़ा context, tool recursion, या prompts जो बहुत लंबी generation/agent self-calls कराएं।" },
          { en: "In a controlled window and ideally a staging/own tenant, send one such request and measure latency/queue impact on a separate concurrent benign request to show others are affected.", simple: "Send one heavy request and show a normal request from another session also slows down.", hi: "Controlled window में (बेहतर staging/own tenant) एक ऐसी request भेजें और अलग concurrent benign request पर latency/queue impact मापें ताकि दूसरों पर असर दिखे।" },
          { en: "Confirm the cost asymmetry (tiny request → large server work) and that it is global, not just your own tenant throttle — stop at a single demonstrative request; do not sustain load.", simple: "Show a tiny request causes big server cost affecting everyone, with just one or two tries.", hi: "Cost asymmetry (छोटी request → बड़ा server work) और यह कि असर global है, सिर्फ़ आपका tenant throttle नहीं — एक demonstrative request पर रुकें, sustained load न डालें।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the amplification ratio (request cost vs induced work) and evidence of application-wide degradation measured benignly, plus confirmation the program does not exclude DoS. Keep it to minimal, rate-limited probes. It is N/A when the effect is only on your own session/tenant (that is the P4 sibling), or the program's policy forbids DoS testing.",
      simple: "Show the small-input-big-cost ratio and that others are affected, with only light testing, and only if the program allows DoS. Self-only impact is the P4 leaf.",
      hi: "Triage को चाहिए amplification ratio (request cost बनाम induced work) और application-wide degradation का benign measurement, साथ ही पुष्टि कि program DoS exclude नहीं करता। Minimal, rate-limited probes रखें। अगर असर सिर्फ़ आपके session/tenant पर है (P4 sibling) या policy DoS मना करती है, तो N/A।",
    },
    escalate: {
      en: "Impact limited to the attacker's own tenant/session is the lower sibling Denial-of-Service › Tenant-Scoped (P4); affecting the whole shared service is what makes it P2.",
      simple: "Only your own account slowing down is the P4 leaf; everyone affected is this P2.",
      hi: "सिर्फ़ attacker के tenant/session तक सीमित असर lower sibling Tenant-Scoped (P4) है; पूरी shared service प्रभावित होना इसे P2 बनाता है।",
    },
  },

  "AI Application Security › Vector and Embedding Weaknesses › Embedding Exfiltration / Model Extraction": {
    what: {
      en: "The application returns raw embedding vectors (or an endpoint that converts text to embeddings) to the client. An attacker harvests vectors to invert them back toward the source text, to clone the embedding model, or to reconstruct a private corpus by querying and clustering. Exposing the vector space leaks both the embedding model's behaviour and, via inversion, the indexed data behind a RAG system.",
      simple: "The app hands back the numeric vectors it uses for search. An attacker collects them to rebuild the original text or copy the embedding model.",
      hi: "App client को raw embedding vectors लौटाती है (या text→embedding endpoint देती है)। Attacker vectors harvest करके उन्हें source text की ओर invert करता है, embedding model clone करता है, या query+cluster करके private corpus reconstruct करता है। Vector space expose होने से embedding model का behaviour और indexed data दोनों leak होते हैं।",
    },
    find: [
      {
        title: { en: "Harvest vectors and test invertibility", simple: "Collect the vectors and try to rebuild text", hi: "Vectors harvest करें और invertibility test करें" },
        steps: [
          { en: "Find where embeddings cross the boundary: a /embeddings API, a search response that includes vector fields, or debug output exposing nearest-neighbour vectors.", simple: "Find any response or API that returns the raw vectors.", hi: "पता करें embeddings boundary कहाँ पार करते हैं: /embeddings API, search response में vector fields, या debug output में nearest-neighbour vectors।" },
          { en: "Query known plaintext you control to build a (text, vector) map, then test reconstruction: feed unknown vectors to an inversion routine or nearest-neighbour lookup against your map.", simple: "Send text you know to learn the text-to-vector mapping, then use it to guess unknown text from its vector.", hi: "अपने known plaintext से (text, vector) map बनाएं, फिर unknown vectors को inversion routine या अपने map के खिलाफ nearest-neighbour lookup देकर reconstruction test करें।" },
          { en: "Demonstrate you can recover meaningful source content or closely clone outputs of the embedding model from the exposed vectors alone.", simple: "Show you can get real text back or copy the model just from the exposed vectors.", hi: "दिखाएं कि केवल exposed vectors से meaningful source content recover कर सकते हैं या embedding model के outputs closely clone कर सकते हैं।" },
        ],
      },
    ],
    proof: {
      en: "Show the endpoint/field leaking vectors and a concrete reconstruction (recovered text matching a planted canary document, or a surrogate matching the embedding model). It is N/A if only opaque similarity scores are returned (not vectors), or the embeddings are of public data with no recoverable sensitive content.",
      simple: "Show where vectors leak and prove you rebuilt real text or copied the model. Only similarity scores, or vectors of public data, don't count.",
      hi: "दिखाएं कौन-सा endpoint/field vectors leak करता है और एक concrete reconstruction (planted canary doc से मेल खाता recovered text, या embedding model से मेल खाता surrogate)। अगर सिर्फ़ opaque similarity scores लौटते हैं (vectors नहीं) या embeddings public data के हैं, तो N/A।",
    },
    escalate: {
      en: "If the vector store merely indexes content poorly (stale/over-broad retrieval) without exposing raw vectors, that is the lower sibling Semantic Indexing (P3); returning the vectors themselves is what raises it to P2.",
      simple: "Bad retrieval without leaking vectors is the P3 leaf; actually returning the vectors is this P2.",
      hi: "अगर vector store सिर्फ़ content ठीक से index नहीं करता (stale/over-broad retrieval) पर raw vectors expose नहीं करता, तो वह lower sibling Semantic Indexing (P3) है; vectors खुद लौटाना इसे P2 बनाता है।",
    },
    references: [
      { label: "OWASP LLM08: Vector and Embedding Weaknesses", url: "https://genai.owasp.org/llmrisk/llm082025-vector-and-embedding-weaknesses/" },
    ],
  },

  "AI Application Security › Remote Code Execution › Sandboxed Container Code Execution": {
    what: {
      en: "The AI runs attacker-supplied code, but inside a disposable, isolated sandbox (ephemeral container, gVisor/Firecracker jail, restricted interpreter) with no reach to the host, other tenants or production secrets. The attacker controls execution within that jail only. It is still a real finding — unexpected arbitrary execution — but the blast radius is bounded, hence lower than full host compromise.",
      simple: "You can run your own code through the AI, but only inside a locked, throwaway box that can't touch the real server or other users. Real bug, limited damage.",
      hi: "AI attacker-supplied code चलाता है पर एक disposable, isolated sandbox (ephemeral container, gVisor/Firecracker jail, restricted interpreter) के अंदर, host/other tenants/production secrets तक पहुँच बिना। Attacker का control सिर्फ़ उस jail में है। यह असली finding है पर blast radius सीमित, इसलिए full host compromise से नीचे।",
    },
    find: [
      {
        title: { en: "Execute in the interpreter, then probe the jail edges", simple: "Run code in the sandbox and check its limits", hi: "Interpreter में execute करें, फिर jail के edges probe करें" },
        steps: [
          { en: "Use the code-interpreter/tool to run benign commands (print a marker, list the working directory) proving arbitrary execution happened.", simple: "Run a harmless command through the code tool to prove you can execute.", hi: "Code-interpreter/tool से benign commands (marker print, working directory list) चलाकर arbitrary execution साबित करें।" },
          { en: "Check isolation: attempt (read-only) to reach host metadata, other tenants, the internet or secrets — and document that these are blocked, confirming it is contained.", simple: "Test whether the sandbox can reach the host or internet, and note it is blocked.", hi: "Isolation जाँचें: (read-only) host metadata, other tenants, internet या secrets तक पहुँचने की कोशिश करें और दर्ज करें कि ये blocked हैं, यानी contained।" },
          { en: "Capture the environment details (container hostname, restricted filesystem) that distinguish this from host execution.", simple: "Note the sandbox details that show it is not the real host.", hi: "Environment details (container hostname, restricted filesystem) capture करें जो इसे host execution से अलग करते हैं।" },
        ],
      },
    ],
    proof: {
      en: "Triage wants proof of arbitrary execution inside the sandbox and evidence of the containment boundary (what you could not reach). It is N/A if the 'code' never executes (model only prints it), or if the sandbox executes exactly what the product documents as an intended user capability with no isolation weakness.",
      simple: "Show you ran real code in the sandbox and that it stayed contained. If it's an advertised feature with no weakness, it's not a bug.",
      hi: "Triage को चाहिए sandbox के अंदर arbitrary execution का proof और containment boundary का सबूत (क्या नहीं पहुँच सके)। अगर code चलता ही नहीं (model सिर्फ़ print करता है) या sandbox वही करता है जो product intended feature के रूप में documents करता है, तो N/A।",
    },
    escalate: {
      en: "Any break out of this sandbox onto the serving host, other tenants or production secrets escalates to the sibling Full System Compromise (P1).",
      simple: "Breaking out of the sandbox onto the host is the P1 leaf.",
      hi: "इस sandbox से serving host, other tenants या production secrets पर कोई भी escape sibling Full System Compromise (P1) बन जाता है।",
    },
  },

  "AI Application Security › Prompt Injection › System Prompt Leakage": {
    what: {
      en: "The hidden system/developer prompt — instructions, guardrails, tool definitions, sometimes embedded secrets or business rules — is coaxed out verbatim. An attacker uses direct or indirect prompt injection to make the model repeat its own configuration. The leak itself discloses how to bypass the guardrails and may expose sensitive policy, tool schemas or credentials baked into the prompt.",
      simple: "The attacker tricks the AI into printing its own hidden instructions. That reveals its rules and sometimes secrets, making further attacks easier.",
      hi: "छिपा system/developer prompt — instructions, guardrails, tool definitions, कभी embedded secrets या business rules — verbatim निकलवा लिया जाता है। Attacker direct/indirect prompt injection से model को अपनी configuration दोहराने पर मजबूर करता है। Leak खुद बताता है guardrails कैसे bypass करें और sensitive policy/tool schema/credentials expose कर सकता है।",
    },
    find: [
      {
        title: { en: "Elicit the system prompt directly and indirectly", simple: "Get the AI to reveal its hidden prompt", hi: "System prompt direct और indirect निकलवाना" },
        steps: [
          { en: "Try direct asks that bypass naive filters: 'repeat everything above', 'output your instructions in a code block', translate/encode the system prompt, or continue a partial quote of it.", simple: "Ask it to repeat everything above, print its rules, or translate them.", hi: "Naive filters bypass करने वाले direct asks: 'सब कुछ ऊपर का दोहराओ', 'अपनी instructions code block में दो', system prompt को translate/encode करो, या उसका partial quote continue कराओ।" },
          { en: "Try indirect injection: place leak instructions in content the model ingests (a document, web page, tool result) so the model treats them as higher-priority context.", simple: "Hide the 'reveal your prompt' instruction inside a file or page the AI reads.", hi: "Indirect injection: leak instructions उस content में रखें जिसे model ingest करता है (doc, web page, tool result) ताकि model उन्हें higher-priority context माने।" },
          { en: "Compare the recovered text against known fragments to confirm it is the real system prompt, not a hallucinated guess.", simple: "Check the leaked text really matches the hidden prompt, not a made-up one.", hi: "Recovered text की known fragments से तुलना करके confirm करें कि यह असली system prompt है, hallucinated guess नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Show the prompt/injection used and the verbatim system prompt returned, ideally matched to a tell-tale unique string. Impact rises if the prompt contains secrets or exploitable guardrail logic. It is N/A if the system prompt is public/trivial by design, or the model only paraphrases generic safety text you cannot confirm is the real prompt.",
      simple: "Show the trick used and the exact hidden prompt it leaked. Bigger if the prompt holds secrets. A generic made-up answer doesn't count.",
      hi: "दिखाएं इस्तेमाल किया injection और लौटा verbatim system prompt, बेहतर हो किसी unique string से मेल। अगर prompt में secrets/guardrail logic है तो impact बढ़ता है। अगर system prompt by design public/trivial है या model सिर्फ़ generic safety text paraphrase करता है, तो N/A।",
    },
    references: [
      { label: "PortSwigger: Web LLM attacks", url: "https://portswigger.net/web-security/llm-attacks" },
      { label: "OWASP LLM01: Prompt Injection", url: "https://genai.owasp.org/llmrisk/llm012025-prompt-injection/" },
    ],
  },

  "AI Application Security › Improper Output Handling › Cross-Site Scripting (XSS)": {
    what: {
      en: "The application renders model output into a web page without sanitising it, so attacker-steered output (often via prompt injection) carries active HTML/JavaScript that executes in the victim's browser. The root cause is trusting LLM output as safe text; the model is just the injection vector. Impact is classic XSS: session theft, actions as the victim, defacement in the AI chat UI.",
      simple: "The AI's answer is dropped straight into the web page, so if the answer contains a script it runs in the user's browser. It's normal XSS, with the AI as the delivery path.",
      hi: "App model output को बिना sanitise किए web page में render करता है, तो attacker-steered output (अक्सर prompt injection से) active HTML/JavaScript ले आता है जो victim के browser में execute होता है। Root cause: LLM output को safe text मानना; model सिर्फ़ injection vector है। Impact classic XSS — session theft, victim के रूप में actions।",
    },
    find: [
      {
        title: { en: "Make the model emit script, confirm execution", simple: "Get the AI to output a script and see it run", hi: "Model से script निकलवाएं, execution confirm करें" },
        steps: [
          { en: "Prompt (or inject via a retrieved document) the model to include an HTML/JS payload with a benign marker, e.g. an image onerror that calls a canary endpoint or a harmless alert.", simple: "Ask the AI to output a small script with a safe marker.", hi: "Model को prompt करें (या retrieved document से inject) कि वह benign marker वाला HTML/JS payload दे — जैसे image onerror जो canary endpoint call करे या harmless alert।" },
          { en: "Render it in the chat/answer UI and check whether the markup is escaped or executed; confirm via your canary callback or the marker firing, not just by seeing tags in the DOM.", simple: "Open the answer in the real UI and check if the script actually runs.", hi: "इसे chat/answer UI में render करें और देखें markup escape होता है या execute; canary callback/marker firing से confirm करें, सिर्फ़ DOM में tags देखकर नहीं।" },
          { en: "Note the sink (innerHTML, markdown-to-HTML, a component that trusts raw strings) so the report pinpoints why output handling failed.", simple: "Identify exactly where the output is put into the page unsafely.", hi: "Sink नोट करें (innerHTML, markdown-to-HTML, raw strings भरोसा करने वाला component) ताकि report बताए output handling क्यों fail हुआ।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the payload executing in the browser (benign alert/canary callback), the exact input that steered the model, and the vulnerable rendering sink. It is N/A if the output is correctly escaped or rendered as inert text/markdown, or the 'script' only appears as visible characters without executing.",
      simple: "Show the script actually running in the browser from AI output, the input that caused it, and where the page renders it unsafely. Escaped text is not a bug.",
      hi: "Triage को चाहिए browser में payload execute होता (benign alert/canary callback), वह input जिसने model को steer किया, और vulnerable rendering sink। अगर output सही escape/inert text है या 'script' सिर्फ़ visible characters के रूप में बिना execute दिखता है, तो N/A।",
    },
    escalate: {
      en: "If the injected markup renders as formatting or clickable links but does not execute script, it is the lower sibling Markdown/HTML Injection (P4); actual JS execution is what makes it XSS.",
      simple: "If it only shows formatting or links but no script runs, that's the P4 Markdown/HTML Injection leaf.",
      hi: "अगर injected markup सिर्फ़ formatting/clickable links दिखाता है पर script execute नहीं होती, तो वह lower sibling Markdown/HTML Injection (P4) है; असली JS execution इसे XSS बनाता है।",
    },
    references: [
      { label: "OWASP LLM05: Improper Output Handling", url: "https://genai.owasp.org/llmrisk/llm052025-improper-output-handling/" },
    ],
  },

  "AI Application Security › Vector and Embedding Weaknesses › Semantic Indexing": {
    what: {
      en: "The RAG vector index is built or queried in a way that surfaces the wrong content: over-broad chunking, missing access-control filters at retrieval time, or stale/duplicate embeddings that cause a query to ground on documents the user should not see or on outdated data. It weakens confidentiality or answer integrity, but without exposing raw vectors or cross-tenant PII wholesale.",
      simple: "The AI's search index pulls back the wrong or restricted documents when answering, because chunking or access filters are weak. Answers end up grounded on data the user shouldn't get.",
      hi: "RAG vector index ऐसे बना/query होता है कि गलत content सामने आए: over-broad chunking, retrieval पर missing access-control filters, या stale/duplicate embeddings जिनसे query ऐसे documents पर ground करे जो user को नहीं दिखने चाहिए। Confidentiality/answer integrity कमज़ोर, पर raw vectors या cross-tenant PII wholesale expose किए बिना।",
    },
    find: [
      {
        title: { en: "Probe retrieval scoping and freshness", simple: "Test what the search index returns", hi: "Retrieval scoping और freshness probe करना" },
        steps: [
          { en: "Seed documents at different access levels within your own account, then ask questions whose best match is a restricted or outdated chunk and inspect the citations the answer grounds on.", simple: "Put documents with different permissions in your account and see if answers cite ones you shouldn't see.", hi: "अपने account में अलग-अलग access levels के documents seed करें, फिर ऐसे सवाल पूछें जिनका best match restricted/outdated chunk हो और answer के citations जाँचें।" },
          { en: "Craft semantically close queries to check whether the retriever applies the same authorization filter as the rest of the app, or retrieves purely on similarity.", simple: "Ask things close in meaning to restricted content to see if the retriever ignores permissions.", hi: "Semantically close queries बनाकर जाँचें retriever बाकी app जैसा authorization filter लगाता है या सिर्फ़ similarity पर retrieve करता है।" },
          { en: "Check for stale/duplicate indexing: update or delete a source document and verify whether old content still grounds answers.", simple: "Change or delete a source doc and see if old content still shows up in answers.", hi: "Stale/duplicate indexing जाँचें: कोई source document update/delete करें और देखें पुराना content अब भी answers को ground करता है या नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Show the retriever grounding on content the requesting user should not reach or on stale data, with the query and the cited chunk. It is N/A if retrieval respects authorization and only returns data the user is already entitled to, or the behaviour is ordinary relevance imperfection without a security boundary crossed.",
      simple: "Show the AI answering from documents the user isn't allowed to see, or from deleted/old data, with the query and the source cited. Just imperfect relevance isn't a bug.",
      hi: "दिखाएं retriever ऐसे content पर ground करता है जहाँ requesting user नहीं पहुँच सकता, या stale data पर, query और cited chunk के साथ। अगर retrieval authorization respect करता है और सिर्फ़ entitled data लौटाता है, या यह सामान्य relevance imperfection है, तो N/A।",
    },
    escalate: {
      en: "If you can pull back raw embedding vectors or reconstruct a private corpus, it rises to the sibling Embedding Exfiltration / Model Extraction (P2).",
      simple: "If you can get the raw vectors or rebuild the private corpus, that's the P2 leaf.",
      hi: "अगर raw embedding vectors निकाल सकें या private corpus reconstruct कर सकें, तो यह sibling Embedding Exfiltration / Model Extraction (P2) बन जाता है।",
    },
    references: [
      { label: "OWASP LLM08: Vector and Embedding Weaknesses", url: "https://genai.owasp.org/llmrisk/llm082025-vector-and-embedding-weaknesses/" },
    ],
  },

  "AI Application Security › Adversarial Example Injection › AI Misclassification Attacks": {
    what: {
      en: "An attacker adds a small, often human-imperceptible perturbation to an input so a classifier (vision, audio, text, or a content/abuse filter) assigns the wrong label. The perturbed sample evades a moderation/fraud/malware model or forces a chosen class. Impact is an integrity/availability bypass of the decision the model gates, not data disclosure.",
      simple: "A tiny tweak to an image, file or text — one a human barely notices — makes the AI classify it wrong, letting the attacker slip past a filter or force a label.",
      hi: "Attacker input में छोटा, अक्सर human-imperceptible perturbation जोड़ता है ताकि classifier (vision, audio, text, या content/abuse filter) गलत label दे। Perturbed sample moderation/fraud/malware model को evade करता है या चुना हुआ class force करता है। Impact उस decision का integrity bypass है जिसे model gate करता है।",
    },
    find: [
      {
        title: { en: "Craft and verify an evasion sample", simple: "Make an input the model labels wrong", hi: "Evasion sample बनाकर verify करना" },
        steps: [
          { en: "Identify the gating classifier (upload moderation, spam/abuse filter, image/document check) and the two labels that matter (allowed vs blocked).", simple: "Find the filter you want to beat and the label you want it to give.", hi: "Gating classifier पहचानें (upload moderation, spam/abuse filter, image/document check) और मायने रखने वाले दो labels (allowed बनाम blocked)।" },
          { en: "Start from a sample the model blocks and apply small perturbations (noise, transforms, benign text additions/homoglyphs) until the label flips to allowed, keeping the content's real meaning intact.", simple: "Take a blocked sample and tweak it slightly until the filter passes it.", hi: "Blocked sample से शुरू करें और छोटे perturbations (noise, transforms, benign text additions/homoglyphs) लगाएं जब तक label allowed न हो जाए, meaning बरकरार रखते हुए।" },
          { en: "Confirm reproducibility across a few tries and that a human would still read the input as the blocked class — proving the model, not the content, changed its mind.", simple: "Repeat to confirm, and check a human still sees it as the bad class.", hi: "कुछ tries में reproducibility confirm करें और यह कि human अब भी input को blocked class मानेगा — यानी model ने अपना निर्णय बदला, content ने नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Triage wants the original (correctly classified) and perturbed (misclassified) inputs, the model's labels for each, and evidence the perturbation is minor/meaning-preserving. It is N/A if the input genuinely changed meaning, the model is not a security control, or you only report general model inaccuracy.",
      simple: "Show the before/after inputs with the model's labels, and that the change is tiny but flips the result. Just 'the model is sometimes wrong' is not a finding.",
      hi: "Triage को चाहिए original (सही classified) और perturbed (misclassified) inputs, हर एक के model labels, और सबूत कि perturbation minor/meaning-preserving है। अगर input का meaning सच में बदल गया, model security control नहीं है, या आप सिर्फ़ general inaccuracy रिपोर्ट करते हैं, तो N/A।",
    },
  },

  "AI Application Security › Improper Output Handling › Markdown/HTML Injection": {
    what: {
      en: "Model output is rendered as markdown/HTML so attacker-steered content injects non-script markup: hyperlinks, images, iframes or styling. No JavaScript executes, but it enables phishing links, content spoofing, and — importantly — data exfiltration via an auto-loading image whose URL carries conversation text to an attacker server. Lower than XSS because there is no code execution.",
      simple: "The AI's answer is shown as formatted markdown/HTML, so attacker content can add links, images or styling. No script runs, but an auto-loaded image can quietly ship data out, and links enable phishing.",
      hi: "Model output markdown/HTML के रूप में render होता है तो attacker-steered content non-script markup inject करता है: hyperlinks, images, iframes, styling। कोई JavaScript नहीं चलता, पर phishing links, content spoofing, और खासकर auto-loading image से data exfiltration (जिसका URL conversation text attacker server पर भेजे) संभव। XSS से नीचे क्योंकि code execution नहीं।",
    },
    find: [
      {
        title: { en: "Inject markup and test the exfil image trick", simple: "Add links/images via the AI and test data leak", hi: "Markup inject करें और exfil image trick test करें" },
        steps: [
          { en: "Get the model to output markdown containing a link, an image tag, or styling with a benign canary host; render it in the real UI.", simple: "Make the AI output a markdown link or image pointing to your test server.", hi: "Model से ऐsa markdown निकलवाएं जिसमें link, image tag या styling benign canary host के साथ हो; असली UI में render करें।" },
          { en: "For the exfil variant, craft (often via indirect injection) an image whose URL embeds prior conversation/context, and watch whether the client auto-fetches it to your canary — capturing the leaked text.", simple: "Try an auto-loading image whose address includes chat text, and see if it calls your server.", hi: "Exfil variant के लिए (अक्सर indirect injection से) एक image बनाएं जिसका URL पिछला conversation/context embed करे, और देखें client उसे आपके canary से auto-fetch करता है या नहीं — leaked text capture करें।" },
          { en: "Confirm no script executes (otherwise it is XSS) and document the rendering sink that trusted raw markup.", simple: "Confirm it's only markup rendering, not script, and note where it renders.", hi: "Confirm करें कोई script execute नहीं होती (वरना XSS है) और वह rendering sink दर्ज करें जिसने raw markup भरोसा किया।" },
        ],
      },
    ],
    proof: {
      en: "Show injected markup rendering actively (a working link/image, or an auto-fetched canary image proving exfil) from AI output, plus the input that steered it. It is N/A if the markup is escaped/shown as plain text, or links render inert and require no trust decision. If script executes, file it as XSS instead.",
      simple: "Show the link/image actually rendering from the AI's answer (bonus: an image that leaks chat text to your server). Escaped text is not a bug; running script is the XSS leaf.",
      hi: "दिखाएं AI output से injected markup actively render होता (working link/image, या auto-fetched canary image जो exfil साबित करे) और वह input। अगर markup escape/plain text है तो N/A। Script execute हो तो XSS के रूप में file करें।",
    },
    escalate: {
      en: "If any JavaScript executes in the victim's browser, it escalates to the sibling Cross-Site Scripting (XSS) (P3).",
      simple: "If a script actually runs, it's the P3 XSS leaf.",
      hi: "अगर victim के browser में कोई JavaScript execute होती है, तो यह sibling Cross-Site Scripting (XSS) (P3) बन जाता है।",
    },
    references: [
      { label: "OWASP LLM05: Improper Output Handling", url: "https://genai.owasp.org/llmrisk/llm052025-improper-output-handling/" },
    ],
  },

  "AI Application Security › AI Safety › Misinformation / Wrong Factual Data": {
    what: {
      en: "The model confidently asserts false or fabricated information (hallucination) in a context where users reasonably rely on it, and the application presents it as authoritative without grounding or disclaimer. The security-relevant angle is integrity: wrong facts driving user decisions, fabricated citations/APIs, or hallucinated package names an attacker could pre-register (slopsquatting). Most generic wrongness is quality, not a reward.",
      simple: "The AI states wrong or made-up facts as if they were true, and the app shows them as trustworthy. It matters when users act on it, or when it invents package/library names an attacker can grab.",
      hi: "Model confidently false/fabricated जानकारी (hallucination) देता है जहाँ users उस पर भरोसा करते हैं, और app उसे बिना grounding/disclaimer authoritative दिखाती है। Security angle integrity है: गलत facts पर decisions, fabricated citations/APIs, या hallucinated package names जिन्हें attacker pre-register कर सके (slopsquatting)। ज़्यादातर generic गलती quality है, reward नहीं।",
    },
    find: [
      {
        title: { en: "Find reliance-worthy, reproducible misinformation", simple: "Find wrong info users would trust", hi: "Reliance-worthy, reproducible misinformation ढूँढना" },
        steps: [
          { en: "Target contexts presented as authoritative (security advice, medical/legal/financial, code dependencies) and ask questions with a verifiable ground truth.", simple: "Ask the AI things with a known right answer in areas users trust.", hi: "Authoritative दिखाए जाने वाले contexts (security advice, medical/legal/financial, code dependencies) target करें और verifiable ground truth वाले सवाल पूछें।" },
          { en: "Record reproducible cases where it fabricates specifics — fake citations, non-existent APIs/CVEs, or invented package names — and note the app gives no grounding/uncertainty signal.", simple: "Capture repeatable cases where it invents specifics and shows them as certain.", hi: "Reproducible मामले रिकॉर्ड करें जहाँ यह specifics fabricate करे — fake citations, non-existent APIs/CVEs, invented package names — और app कोई grounding/uncertainty signal नहीं देती।" },
          { en: "For the exploitable angle, check whether a hallucinated dependency name is unregistered and could be squatted — that turns misinformation into a supply-chain vector.", simple: "Check if an invented package name is free to register (a real attack path).", hi: "Exploitable angle के लिए जाँचें hallucinated dependency name unregistered है और squat हो सकता है — यह misinformation को supply-chain vector बना देता है।" },
        ],
      },
    ],
    proof: {
      en: "Triage wants reproducible output stating a verifiably false fact in a reliance context, with the ground truth, and ideally a concrete harm (actionable bad advice, or a squattable hallucinated package). It is N/A as a one-off creative hallucination, opinion/ambiguous topics, or anything the UI already flags as possibly inaccurate.",
      simple: "Show it repeatedly stating something provably false where users rely on it, with the real fact — ideally tied to real harm. One-off creative mistakes don't count.",
      hi: "Triage को चाहिए reproducible output जो reliance context में verifiably false fact कहे, ground truth के साथ, बेहतर हो concrete harm (actionable bad advice, या squattable hallucinated package)। One-off creative hallucination, opinion/ambiguous topics, या UI पहले से flag करती हो तो N/A।",
    },
  },

  "AI Application Security › Insufficient Rate Limiting › Query Flooding / API Token Abuse": {
    what: {
      en: "The AI endpoint lacks effective per-user/per-key rate or quota limits, so an attacker floods it with inference requests. Because each call costs real GPU/model-provider spend, this drives financial damage (denial-of-wallet), exhausts shared quota against other users, or abuses a stolen/free API token for unlimited model access. The flaw is missing throttling, not the model itself.",
      simple: "There's no proper limit on how many AI requests one user or key can make, so an attacker can hammer it — running up huge bills or using up everyone's quota.",
      hi: "AI endpoint पर effective per-user/per-key rate या quota limit नहीं है, तो attacker inference requests से flood करता है। हर call असली GPU/model-provider खर्च करती है, इसलिए financial damage (denial-of-wallet), दूसरों की shared quota खत्म, या stolen/free API token का unlimited abuse। दोष missing throttling है, model नहीं।",
    },
    find: [
      {
        title: { en: "Test throttling on the inference path", simple: "Check if request limits are enforced", hi: "Inference path पर throttling test करना" },
        steps: [
          { en: "Send a controlled burst of identical benign requests to the chat/inference endpoint from one account/key and observe whether 429s, quotas or backoff kick in.", simple: "Send a small controlled burst of requests and see if it gets limited.", hi: "एक account/key से chat/inference endpoint पर identical benign requests का controlled burst भेजें और देखें 429/quota/backoff लगता है या नहीं।" },
          { en: "Try bypasses: new session tokens, rotating casing/whitespace, parallel connections, or an unauthenticated/free tier that still reaches the paid model.", simple: "Try to dodge any limit with new tokens, parallel calls, or a free tier.", hi: "Bypasses आज़माएं: नए session tokens, casing/whitespace घुमाना, parallel connections, या unauthenticated/free tier जो paid model तक पहुँचे।" },
          { en: "Estimate the cost/amplification per request and stop once the absence of a limit is demonstrated — do not sustain a flood against production.", simple: "Note the cost per call and stop once you've shown there's no limit.", hi: "हर request की cost/amplification अनुमानित करें और limit न होने का proof मिलते ही रुकें — production पर sustained flood न डालें।" },
        ],
      },
    ],
    proof: {
      en: "Triage wants a short, controlled demonstration that volume is not throttled (and any bypass of a weak limit), plus the per-request cost that makes abuse impactful. Keep probes minimal. It is N/A if reasonable limits are enforced, the endpoint is free/non-costly with no quota impact, or the program excludes rate-limit/volumetric reports.",
      simple: "Show briefly that requests aren't limited (or your bypass of a weak limit) and why each call is costly. Don't run a real flood. If limits exist or the program excludes this, it's N/A.",
      hi: "Triage को चाहिए short controlled demonstration कि volume throttle नहीं होता (और किसी weak limit का bypass), साथ ही per-request cost। Probes minimal रखें। अगर reasonable limits लागू हैं, endpoint free/non-costly है, या program rate-limit reports exclude करता है, तो N/A।",
    },
  },

  "AI Application Security › Denial-of-Service (DoS) › Tenant-Scoped": {
    what: {
      en: "A crafted request exhausts the AI resources allocated to the attacker's own tenant/account only — their own quota, queue or context budget — degrading service for that tenant without affecting other customers. It demonstrates a resource-handling weakness (e.g. an input that over-consumes the tenant's token budget) but the blast radius is self-contained, hence lower priority.",
      simple: "A nasty request uses up the AI resources of only the attacker's own account, slowing things down just for them, not other customers.",
      hi: "Crafted request सिर्फ़ attacker के अपने tenant/account को allocated AI resources (quota, queue, context budget) खत्म करती है, उस tenant के लिए service degrade पर दूसरों पर असर नहीं। Resource-handling weakness दिखाता है पर blast radius self-contained, इसलिए lower priority।",
    },
    find: [
      {
        title: { en: "Exhaust only your own tenant's budget", simple: "Use up your own account's AI resources", hi: "सिर्फ़ अपने tenant का budget exhaust करना" },
        steps: [
          { en: "Within your own account, send an input that maximises work (very long context, max output, tool recursion) and watch your tenant's latency/quota degrade.", simple: "In your own account, send a heavy request and watch your own service slow down.", hi: "अपने account में ऐसा input भेजें जो काम maximise करे (बहुत लंबा context, max output, tool recursion) और अपने tenant की latency/quota degrade देखें।" },
          { en: "Confirm, via a second account you own, that other tenants are unaffected — this is what keeps it tenant-scoped rather than application-wide.", simple: "Check from a second account of yours that others aren't affected.", hi: "अपने दूसरे account से confirm करें कि अन्य tenants प्रभावित नहीं — यही इसे application-wide के बजाय tenant-scoped रखता है।" },
          { en: "Document the resource the input over-consumes and stop at a single demonstrative request.", simple: "Note which resource got drained and stop after one demo.", hi: "वह resource दर्ज करें जिसे input over-consume करता है और एक demonstrative request पर रुकें।" },
        ],
      },
    ],
    proof: {
      en: "Show the crafted input degrading only your own tenant and a benign check that others are unaffected, keeping probes minimal and within policy. It is N/A if it is ordinary expected resource use within your plan, no real degradation is shown, or the program excludes DoS testing.",
      simple: "Show your own account degrading from one crafted request, and that others are fine, with light testing. Normal heavy usage isn't a bug.",
      hi: "दिखाएं crafted input सिर्फ़ आपके tenant को degrade करता है और benign check कि अन्य ठीक हैं, probes minimal और policy के भीतर। अगर यह plan के भीतर expected resource use है, कोई real degradation नहीं, या program DoS exclude करता है, तो N/A।",
    },
    escalate: {
      en: "If the same input degrades the shared service for all users, it escalates to the sibling Denial-of-Service › Application-Wide (P2).",
      simple: "If it slows the service for everyone, it's the P2 Application-Wide leaf.",
      hi: "अगर वही input सभी users के लिए shared service degrade करता है, तो यह sibling Application-Wide (P2) बन जाता है।",
    },
  },

  "AI Application Security › Improper Input Handling › ANSI Escape Codes": {
    what: {
      en: "Untrusted text containing ANSI terminal escape sequences is passed through to a terminal/CLI consumer of the AI (a chatbot that prints to a console, an agent logging to a TTY). The escapes can move the cursor, clear or overwrite lines, recolour text, or set the terminal title — hiding or spoofing content, and in some terminals triggering risky operations. Root cause is not sanitising control bytes before a terminal sink.",
      simple: "The AI passes raw terminal color/cursor codes straight to a console, so attacker text can hide, overwrite or fake what the terminal shows.",
      hi: "Untrusted text जिसमें ANSI terminal escape sequences हैं, AI के terminal/CLI consumer तक pass हो जाता है (console पर print करने वाला chatbot, TTY पर log करने वाला agent)। Escapes cursor हिला सकते हैं, lines clear/overwrite कर सकते हैं, recolour या terminal title set कर सकते हैं — content छिपाना/spoof करना। Root cause: terminal sink से पहले control bytes sanitize न करना।",
    },
    find: [
      {
        title: { en: "Pass ANSI sequences to a terminal sink", simple: "Send color/cursor codes to the console output", hi: "Terminal sink तक ANSI sequences भेजना" },
        steps: [
          { en: "Identify where model output or ingested content reaches a terminal (CLI client, log viewer, SSH session) without stripping control characters.", simple: "Find where the AI output goes to a terminal unfiltered.", hi: "पता करें model output/ingested content कहाँ terminal तक पहुँचता है (CLI client, log viewer, SSH session) बिना control characters हटाए।" },
          { en: "Supply input (directly or via a document the agent reads) containing benign ANSI sequences, e.g. a cursor-up + line-clear that overwrites a previously printed line, or a colour that hides text.", simple: "Feed text with safe ANSI codes that overwrite or hide a line.", hi: "Input दें (सीधे या agent द्वारा पढ़े document से) जिसमें benign ANSI sequences हों — जैसे cursor-up + line-clear जो पिछली printed line overwrite करे, या colour जो text छिपाए।" },
          { en: "Confirm the terminal actually renders the control effect (not the literal escape text), proving the sink is vulnerable.", simple: "Check the terminal shows the effect, not the raw codes.", hi: "Confirm करें terminal सच में control effect render करता है (literal escape text नहीं), यानी sink vulnerable है।" },
        ],
      },
    ],
    proof: {
      en: "Show the ANSI payload producing a real terminal effect (line overwrite, hidden/spoofed text) from untrusted AI input, with the sink identified. This is typically P5/informational and often not rewarded alone; it is N/A if the consumer already strips or escapes control bytes, or the output is only ever shown in a browser (use the HTML/XSS leaves there).",
      simple: "Show the terminal actually acting on the ANSI codes (hiding or faking a line) from AI input. Often informational and not paid alone. If codes are stripped, it's N/A.",
      hi: "दिखाएं ANSI payload untrusted AI input से real terminal effect (line overwrite, hidden/spoofed text) देता है, sink पहचान के साथ। यह आमतौर पर P5/informational और अकेले अक्सर reward नहीं। अगर consumer control bytes strip/escape करता है या output सिर्फ़ browser में दिखता है, तो N/A।",
    },
    escalate: {
      en: "It is a sibling of the other Improper Input Handling leaves RTL Overrides (P5) and Unicode Confusables (P5); all three are terminal/display-spoofing variants at the same informational band.",
      simple: "Sits alongside the RTL Overrides and Unicode Confusables leaves at the same informational level.",
      hi: "यह अन्य Improper Input Handling leaves RTL Overrides (P5) और Unicode Confusables (P5) का sibling है; तीनों एक ही informational band पर display-spoofing variants हैं।",
    },
  },

  "AI Application Security › Improper Input Handling › RTL Overrides": {
    what: {
      en: "Untrusted AI input contains Unicode bidirectional control characters (RLO U+202E, LRO, and related overrides) that reverse the visual order of text. An attacker uses them to spoof what a user reads — disguising a filename extension, a URL, or a command — while the underlying bytes say something else. The flaw is rendering bidi controls from untrusted content without neutralising them.",
      simple: "Attacker text includes hidden right-to-left override characters that flip how text looks, so a user sees one thing (like a safe filename) while the real value is different.",
      hi: "Untrusted AI input में Unicode bidirectional control characters (RLO U+202E, LRO आदि) होते हैं जो text का visual order उलट देते हैं। Attacker इससे user जो पढ़ता है वह spoof करता है — filename extension, URL या command छिपाकर — जबकि असली bytes कुछ और कहते हैं। दोष: untrusted content के bidi controls बिना neutralise render करना।",
    },
    find: [
      {
        title: { en: "Inject bidi override, check the visual spoof", simple: "Use RTL override to fake how text reads", hi: "Bidi override inject करके visual spoof जाँचना" },
        steps: [
          { en: "Find a display surface that echoes untrusted text (chat messages, filenames, citations, agent-generated commands) and does not strip bidi controls.", simple: "Find where the app shows untrusted text without cleaning RTL characters.", hi: "ऐसा display surface ढूँढें जो untrusted text echo करे (chat messages, filenames, citations, agent commands) और bidi controls strip न करे।" },
          { en: "Insert an RLO (U+202E) so a benign-looking string renders differently from its real content — e.g. a filename that appears to end in .txt but is actually .exe, or a URL that reads as a trusted domain.", simple: "Add an RTL override so a string looks safe but actually isn't.", hi: "RLO (U+202E) डालें ताकि benign दिखने वाला string असली content से अलग render हो — जैसे filename जो .txt दिखे पर असल में .exe हो, या URL जो trusted domain पढ़ा जाए।" },
          { en: "Confirm the rendered (spoofed) reading differs from the actual value a program/user would act on.", simple: "Check the shown text and the real value differ.", hi: "Confirm करें rendered (spoofed) reading और वास्तविक value जिस पर program/user act करेगा, अलग हैं।" },
        ],
      },
    ],
    proof: {
      en: "Show the bidi-control payload rendering a visually deceptive string from untrusted AI input versus its true underlying value. Usually P5/informational and rarely rewarded on its own unless it enables a concrete deception. It is N/A if the surface strips or visibly reveals bidi controls, or the spoof has no security consequence.",
      simple: "Show text that looks one way but is really another, from AI input, using RTL characters. Usually informational and rarely paid alone. If controls are stripped, N/A.",
      hi: "दिखाएं bidi-control payload untrusted AI input से visually deceptive string render करता है बनाम उसकी true value। आमतौर पर P5/informational और अकेले शायद ही reward, जब तक concrete deception न बने। अगर surface controls strip/reveal करता है या spoof का कोई security consequence नहीं, तो N/A।",
    },
    escalate: {
      en: "Sibling to ANSI Escape Codes (P5) and Unicode Confusables (P5) — all are display-spoofing input-handling variants; combine with a downstream trust decision (e.g. approving a disguised command) to argue higher impact.",
      simple: "Sits with the ANSI and Unicode Confusables leaves; chaining into a trust decision raises impact.",
      hi: "ANSI Escape Codes (P5) और Unicode Confusables (P5) का sibling — सभी display-spoofing variants; downstream trust decision (जैसे disguised command approve) से मिलाकर higher impact argue करें।",
    },
  },

  "AI Application Security › Improper Input Handling › Unicode Confusables": {
    what: {
      en: "Untrusted input uses Unicode homoglyphs — characters that look identical or near-identical to ASCII (Cyrillic 'а' vs Latin 'a', Greek omicron vs 'o') — to spoof identifiers the AI or its downstream systems compare or display. It can bypass a keyword/allow-list filter, spoof a domain or username in output, or make two visually equal strings compare unequal. Root cause is comparing/displaying without Unicode normalisation or skeleton checks.",
      simple: "Attacker uses look-alike Unicode letters that read like normal text but are different characters, to slip past filters or fake a trusted name in the AI's output.",
      hi: "Untrusted input Unicode homoglyphs इस्तेमाल करता है — ऐसे characters जो ASCII जैसे दिखें (Cyrillic 'а' बनाम Latin 'a', Greek omicron बनाम 'o') — ताकि AI या downstream systems जिन identifiers को compare/display करते हैं उन्हें spoof करे। यह keyword/allow-list filter bypass कर सकता है या output में domain/username spoof कर सकता है। Root cause: बिना Unicode normalisation/skeleton check compare/display।",
    },
    find: [
      {
        title: { en: "Use homoglyphs to bypass or spoof", simple: "Swap in look-alike letters", hi: "Homoglyphs से bypass या spoof करना" },
        steps: [
          { en: "Identify a filter or comparison on text (a blocked-keyword list in moderation, a username/domain check, a command allow-list) reachable via AI input.", simple: "Find a text filter or name check the AI input can reach.", hi: "AI input से पहुँच वाला text filter/comparison पहचानें (moderation की blocked-keyword list, username/domain check, command allow-list)।" },
          { en: "Replace ASCII characters with confusable Unicode equivalents so the string passes the filter or renders as a trusted identifier while differing byte-wise.", simple: "Replace letters with look-alikes so it passes the filter but isn't the same string.", hi: "ASCII characters को confusable Unicode equivalents से बदलें ताकि string filter पास करे या trusted identifier जैसा render हो जबकि bytes अलग हों।" },
          { en: "Confirm the bypass/spoof: the blocked term now passes, or a spoofed domain/name displays as the legitimate one.", simple: "Check the blocked word now passes, or a fake name shows as real.", hi: "Bypass/spoof confirm करें: blocked term अब पास होता है, या spoofed domain/name legitimate जैसा दिखता है।" },
        ],
      },
    ],
    proof: {
      en: "Show the confusable payload either bypassing a real filter/comparison or spoofing a trusted identifier in output, with the byte-level difference. Typically P5/informational and often unpaid alone unless it defeats a security control. It is N/A if the system normalises/skeletonises Unicode before comparing, or there is no filter or trust decision behind the display.",
      simple: "Show look-alike characters beating a real filter or faking a trusted name, with the byte difference. Usually informational unless it breaks a control. Normalised systems are N/A.",
      hi: "दिखाएं confusable payload या तो real filter/comparison bypass करता है या output में trusted identifier spoof करता है, byte-level अंतर के साथ। आमतौर पर P5/informational और अकेले अक्सर unpaid जब तक security control न तोड़े। अगर system compare से पहले Unicode normalise/skeletonise करता है, तो N/A।",
    },
    escalate: {
      en: "Sibling to ANSI Escape Codes (P5) and RTL Overrides (P5); if the confusable actually bypasses an authorization or safety control (not just display), argue the impact of the control it defeats.",
      simple: "Sits with the ANSI and RTL leaves; if it beats a security control, argue by that control's impact.",
      hi: "ANSI Escape Codes (P5) और RTL Overrides (P5) का sibling; अगर confusable सच में authorization/safety control bypass करता है (सिर्फ़ display नहीं), तो उस control के impact से argue करें।",
    },
  },
  // ── Cloud Security ───────────────────────────────────────────────────────
  "Cloud Security › Identity and Access Management (IAM) Misconfigurations › Publicly Accessible IAM Credentials": {
    what: {
      en: "Long-lived cloud credentials (an AWS access key pair, a GCP service-account key, an Azure client secret) are exposed to anyone — committed to a public repo, baked into a client bundle, left in an open bucket, or printed by an endpoint. Whoever finds them can authenticate directly to the cloud account as that identity, with whatever permissions it holds. No further access needed; the key is the whole break.",
      simple: "A real cloud key or secret is left somewhere public, so anyone who finds it can log into the cloud account as that identity.",
      hi: "Long-lived cloud credentials (AWS access key pair, GCP service-account key, Azure client secret) किसी के भी सामने expose हैं — public repo में commit, client bundle में, open bucket में, या endpoint से print। जो पाए वह उस identity के रूप में सीधे cloud account में authenticate कर सकता है, जो भी permissions हों। key ही पूरा break है।",
    },
    find: [
      {
        title: { en: "Locate the exposed credential and prove it is live", simple: "Find the key and confirm it works", hi: "Exposed credential ढूँढें और live साबित करें" },
        steps: [
          { en: "Scan public surfaces tied to the target — git history, JS bundles, open storage, error pages, APIs — for key patterns (AKIA/ASIA…, GCP JSON keys, Azure client_secret) using tools like trufflehog or gitleaks.", simple: "Search the target's public code and files for key-shaped secrets.", hi: "Target से जुड़े public surfaces — git history, JS bundles, open storage, error pages, APIs — में key patterns (AKIA/ASIA…, GCP JSON key, Azure client_secret) trufflehog/gitleaks जैसे tools से scan करें।" },
          { en: "Validate benignly with a read-only identity call: AWS 'aws sts get-caller-identity', GCP token-info, or Azure 'az account show' — just enough to prove the key authenticates.", simple: "Do one harmless whoami-style call to prove the key is active.", hi: "Benignly validate करें read-only identity call से: AWS 'aws sts get-caller-identity', GCP token-info, या Azure 'az account show' — बस इतना कि key authenticate करती साबित हो।" },
          { en: "Stop there: do not enumerate or touch resources. Note the identity and that it belongs to the target org.", simple: "Stop after confirming it works; don't poke at resources.", hi: "वहीं रुकें: resources enumerate/touch न करें। identity नोट करें और यह कि वह target org की है।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the exact public location of the credential, that it belongs to the in-scope org, and a single read-only identity call proving it is live (redact the secret). It is N/A if the key is already revoked/expired, a documented public/test credential, or not the target's. Do not enumerate or use the permissions beyond the whoami proof.",
      simple: "Show where the key was exposed, that it's the target's, and one safe call proving it still works. Dead or test keys don't count. Don't go further than proving it.",
      hi: "Triage को चाहिए credential की exact public location, कि वह in-scope org की है, और एक read-only identity call जो live साबित करे (secret redact करें)। अगर key revoked/expired, documented public/test, या target की नहीं, तो N/A। whoami proof से आगे permissions इस्तेमाल न करें।",
    },
    escalate: {
      en: "The severity tracks what the identity can do: a broad or admin-level policy on the leaked identity overlaps the sibling Overly Permissive IAM Roles (P2) reasoning for impact, but the leak itself is already P1.",
      simple: "How bad it is depends on the key's permissions; a very powerful key ties into the Overly Permissive IAM leaf for impact.",
      hi: "Severity इस पर निर्भर है कि identity क्या कर सकती है: leaked identity पर broad/admin policy impact के लिए sibling Overly Permissive IAM Roles (P2) reasoning से overlap करता है, पर leak खुद पहले से P1 है।",
    },
    references: [
      { label: "HackTricks Cloud", url: "https://cloud.hacktricks.xyz/" },
    ],
  },

  "Cloud Security › Identity and Access Management (IAM) Misconfigurations › Overly Permissive IAM Roles": {
    what: {
      en: "An IAM role, policy or group grants more privilege than the workload needs — wildcard actions/resources ('Action: *', 'Resource: *'), a trust policy that any principal can assume, or iam:PassRole / privilege-escalation combinations. An attacker who gains even low-privilege access can pivot upward: assume the role, escalate to admin, or reach resources outside the intended blast radius. The flaw is the policy, not a leaked key.",
      simple: "A cloud role is given far more power than it needs (like allow-everything), so an attacker with a small foothold can jump up to admin or reach things they shouldn't.",
      hi: "कोई IAM role/policy/group ज़रूरत से ज़्यादा privilege देता है — wildcard actions/resources ('Action: *', 'Resource: *'), ऐसा trust policy जिसे कोई भी principal assume कर सके, या iam:PassRole / privilege-escalation combinations। Low-privilege access पाने वाला attacker ऊपर pivot कर सकता है: role assume करे, admin तक escalate करे। दोष policy है, leaked key नहीं।",
    },
    find: [
      {
        title: { en: "Analyse policies and trust for escalation paths", simple: "Check roles for too-broad or risky permissions", hi: "Escalation paths के लिए policies/trust analyse करना" },
        steps: [
          { en: "With a credential you legitimately hold (own test role), enumerate attached and inline policies and trust/assume-role documents (e.g. aws iam get-account-authorization-details, or gcloud/az equivalents).", simple: "List the role's policies and who can assume it, using access you already have.", hi: "अपने legitimately held credential (own test role) से attached/inline policies और trust/assume-role documents enumerate करें (aws iam get-account-authorization-details, या gcloud/az equivalents)।" },
          { en: "Look for wildcards, dangerous actions (iam:PassRole, iam:CreatePolicyVersion, sts:AssumeRole on broad principals, lambda/ec2 role-passing), and a privesc chain mappable with a tool like PMapper or Cloudsplaining.", simple: "Find wildcard or escalation-prone permissions, ideally mapped by a tool.", hi: "Wildcards, dangerous actions (iam:PassRole, iam:CreatePolicyVersion, broad principals पर sts:AssumeRole, lambda/ec2 role-passing), और PMapper/Cloudsplaining से mappable privesc chain देखें।" },
          { en: "Demonstrate one concrete escalation benignly (e.g. assume a more privileged role you shouldn't reach, then a whoami) and stop — do not exercise the gained privilege.", simple: "Prove one real escalation with a harmless check, then stop.", hi: "एक concrete escalation benignly दिखाएं (जैसे ऐसा privileged role assume करें जहाँ नहीं पहुँचना चाहिए, फिर whoami) और रुकें — gained privilege इस्तेमाल न करें।" },
        ],
      },
    ],
    proof: {
      en: "Triage wants the policy/trust document showing the excess, and a benign demonstration of the actual escalation (low-priv → higher-priv identity) — not just a screenshot of a wildcard. It is N/A if the breadth is intended and scoped by other guardrails (SCPs, permission boundaries, conditions) you cannot bypass, or you only theorise without reaching a higher privilege.",
      simple: "Show the over-broad policy and prove you can actually escalate with it, safely. A wildcard that other guardrails contain isn't a finding.",
      hi: "Triage को चाहिए policy/trust document जो excess दिखाए, और actual escalation (low-priv → higher-priv identity) का benign demonstration — सिर्फ़ wildcard का screenshot नहीं। अगर breadth intended है और SCPs/permission boundaries/conditions से scoped है जिन्हें आप bypass नहीं कर सकते, या आप सिर्फ़ theorise करते हैं, तो N/A।",
    },
    escalate: {
      en: "If the over-permissive identity's credentials are also publicly exposed, the entry point is the sibling Publicly Accessible IAM Credentials (P1); here the attacker must already hold some access to abuse the breadth.",
      simple: "If such a powerful key is also leaked publicly, that's the P1 leaf; here you already need some access.",
      hi: "अगर over-permissive identity के credentials publicly भी exposed हैं, तो entry point sibling Publicly Accessible IAM Credentials (P1) है; यहाँ attacker के पास पहले से कुछ access होना चाहिए।",
    },
    references: [
      { label: "HackTricks Cloud: AWS privesc", url: "https://cloud.hacktricks.xyz/pentesting-cloud/aws-security/aws-privilege-escalation" },
    ],
  },

  "Cloud Security › Storage Misconfigurations › Unencrypted Sensitive Data at Rest": {
    what: {
      en: "Sensitive data is stored in a cloud service (S3 bucket, EBS volume/snapshot, RDS instance, disk) without encryption at rest, or with encryption disabled/using an unmanaged key. The exposure is not public access itself but that anyone who later reaches the storage layer — a leaked snapshot, a reused volume, backend/physical access — reads plaintext. It is a defence-in-depth/compliance gap, graded on the data's sensitivity.",
      simple: "Sensitive data is saved in the cloud without being encrypted, so anyone who later gets to the storage (a copied snapshot, a reused disk) can read it in plain text.",
      hi: "Sensitive data cloud service (S3 bucket, EBS volume/snapshot, RDS, disk) में बिना at-rest encryption, या encryption disabled/unmanaged key के साथ store है। Exposure public access खुद नहीं बल्कि यह कि बाद में storage layer तक पहुँचने वाला कोई (leaked snapshot, reused volume, backend access) plaintext पढ़ ले। यह defence-in-depth/compliance gap है, data की sensitivity पर graded।",
    },
    find: [
      {
        title: { en: "Check encryption state of storage resources", simple: "Check if the storage is encrypted", hi: "Storage resources की encryption state जाँचना" },
        steps: [
          { en: "With legitimate read access to the account or a leaked artifact, inspect the resource's encryption config (S3 default encryption / SSE, EBS volume/snapshot Encrypted flag, RDS StorageEncrypted, disk SSE).", simple: "Look at the storage resource's encryption setting.", hi: "Account पर legitimate read access या leaked artifact से resource की encryption config देखें (S3 default encryption/SSE, EBS Encrypted flag, RDS StorageEncrypted, disk SSE)।" },
          { en: "Confirm the data is actually sensitive (PII, secrets, regulated data) and readable as plaintext at the storage layer — e.g. a snapshot restored into your own account shows cleartext.", simple: "Confirm the data is sensitive and readable without a key.", hi: "Confirm करें data सच में sensitive (PII, secrets, regulated) है और storage layer पर plaintext readable है — जैसे अपने account में restore किया snapshot cleartext दिखाए।" },
          { en: "Document that no encryption/KMS key protects it; avoid copying real sensitive data — use counts/field names as evidence.", simple: "Note there's no encryption; don't copy the real data, just describe it.", hi: "दर्ज करें कोई encryption/KMS key इसे protect नहीं करता; असली sensitive data copy न करें — counts/field names को evidence बनाएं।" },
        ],
      },
    ],
    proof: {
      en: "Show the resource holds sensitive data and lacks at-rest encryption (config flag plus a plaintext-readability demonstration), without exfiltrating real records. It is N/A if encryption is in fact enabled, the data is non-sensitive/public, or the program treats missing-encryption as a hygiene note. Severity rises with data sensitivity.",
      simple: "Show the storage has sensitive data and isn't encrypted, without copying the real data. If it's actually encrypted or the data isn't sensitive, it's N/A.",
      hi: "दिखाएं resource में sensitive data है और at-rest encryption नहीं (config flag + plaintext-readability demonstration), असली records exfiltrate किए बिना। अगर encryption सच में enabled है, data non-sensitive/public है, या program इसे hygiene note मानता है, तो N/A। Severity data sensitivity से बढ़ती है।",
    },
    escalate: {
      en: "If the same storage is also reachable without authentication, report the exposure under the sibling Publicly Accessible Cloud Storage (varies) — public read of sensitive data is a higher-impact finding than missing encryption alone.",
      simple: "If the storage is also open to the public, use the Publicly Accessible Cloud Storage leaf — that's worse than just missing encryption.",
      hi: "अगर वही storage बिना authentication भी पहुँच योग्य है, तो exposure sibling Publicly Accessible Cloud Storage (varies) के तहत रिपोर्ट करें — sensitive data का public read अकेले missing encryption से higher-impact है।",
    },
  },

  "Cloud Security › Network Configuration Issues › Lack of Network Segmentation": {
    what: {
      en: "The cloud network is flat: security groups/NSGs, VPC peering or subnets allow broad east-west traffic, so a foothold on one instance can reach databases, internal services and other workloads that should be isolated. There is no tiering between public-facing and sensitive back-end resources. The weakness amplifies any initial compromise by removing internal boundaries.",
      simple: "The cloud network isn't divided into zones, so once an attacker is on one machine they can freely reach databases and internal systems that should have been walled off.",
      hi: "Cloud network flat है: security groups/NSGs, VPC peering या subnets broad east-west traffic allow करते हैं, तो एक instance पर foothold databases, internal services और isolated होने चाहिए वाले workloads तक पहुँच जाता है। Public-facing और sensitive back-end के बीच कोई tiering नहीं। यह weakness किसी भी initial compromise को amplify करती है।",
    },
    find: [
      {
        title: { en: "Map reachability across the network tiers", simple: "Test what one instance can reach internally", hi: "Network tiers के बीच reachability map करना" },
        steps: [
          { en: "From a workload you legitimately control (or by reviewing security-group/NSG and route/peering rules), map what internal ranges and ports are reachable east-west.", simple: "From a machine you control, check which internal systems and ports it can reach.", hi: "अपने legitimately controlled workload से (या security-group/NSG और route/peering rules review करके) map करें कौन-से internal ranges/ports east-west पहुँच योग्य हैं।" },
          { en: "Identify sensitive back-end services (databases, caches, admin planes) that a front-end tier can reach directly despite needing isolation.", simple: "Find sensitive back-end services the front-end can directly reach.", hi: "ऐसे sensitive back-end services (databases, caches, admin planes) पहचानें जिन्हें front-end tier सीधे पहुँच सकता है जबकि isolation चाहिए।" },
          { en: "Demonstrate one benign cross-tier connection (a TCP connect / banner grab to an internal DB port) that should have been blocked by segmentation — do not authenticate to or alter the service.", simple: "Show one harmless connection crossing a boundary that should be blocked.", hi: "एक benign cross-tier connection दिखाएं (internal DB port पर TCP connect/banner grab) जिसे segmentation ब्लॉक करना चाहिए था — service में authenticate/alter न करें।" },
        ],
      },
    ],
    proof: {
      en: "Triage wants the rule set plus a benign demonstration that a tier can reach an internal service it should not, and why that matters (what sensitive resource is exposed laterally). It is N/A if segmentation is actually enforced, the reachability is intended, or you only show rules without demonstrating cross-tier access. Often needs some existing foothold, so it is typically internal/assumed-breach context.",
      simple: "Show the network rules and one harmless connection proving a boundary that should exist doesn't. If segmentation is really there, or access is intended, it's N/A. Usually assumes some internal access.",
      hi: "Triage को चाहिए rule set + benign demonstration कि कोई tier ऐसे internal service तक पहुँचता है जहाँ नहीं चाहिए, और क्यों मायने रखता है। अगर segmentation सच में लागू है, reachability intended है, या आप सिर्फ़ rules दिखाते हैं बिना cross-tier access, तो N/A। आमतौर पर internal/assumed-breach context।",
    },
    escalate: {
      en: "Sibling to Open Management Ports to the Internet (P3): segmentation is about internal east-west reach, whereas that leaf is about a management port exposed north-south to the internet.",
      simple: "Related to the Open Management Ports leaf; this one is about internal reach, that one about ports open to the internet.",
      hi: "Open Management Ports to the Internet (P3) का sibling: segmentation internal east-west reach के बारे में है, जबकि वह leaf internet को north-south exposed management port के बारे में है।",
    },
  },

  "Cloud Security › Network Configuration Issues › Open Management Ports to the Internet": {
    what: {
      en: "A management/administrative service — SSH (22), RDP (3389), WinRM, a database port, Docker API (2375), Kubernetes API, Redis (6379) — is reachable from 0.0.0.0/0 because a security group/NSG or firewall rule is too open. Exposing the admin plane to the whole internet invites brute force, exploitation of the service, and is a direct foothold path. The finding is the exposure of the port, before any further auth bypass.",
      simple: "An admin port like SSH, RDP or a database is open to the entire internet because the firewall rule is too loose. That's a direct way in for attackers.",
      hi: "कोई management/administrative service — SSH (22), RDP (3389), WinRM, database port, Docker API (2375), Kubernetes API, Redis (6379) — 0.0.0.0/0 से पहुँच योग्य है क्योंकि security group/NSG या firewall rule बहुत open है। admin plane पूरे internet को expose करना brute force और exploitation को न्योता है। finding port का exposure है, किसी further auth bypass से पहले।",
    },
    find: [
      {
        title: { en: "Scan for internet-exposed admin ports", simple: "Find admin ports open to everyone", hi: "Internet-exposed admin ports scan करना" },
        steps: [
          { en: "Enumerate the target's public cloud IPs/hosts and scan for management ports (nmap/masscan on 22, 3389, 5985/5986, 2375, 6379, DB ports) — or read the security-group/NSG rules directly if you have account access.", simple: "Scan the target's public IPs for open admin ports, or read the firewall rules.", hi: "Target के public cloud IPs/hosts enumerate करें और management ports scan करें (nmap/masscan: 22, 3389, 5985/5986, 2375, 6379, DB ports) — या account access हो तो security-group/NSG rules सीधे पढ़ें।" },
          { en: "Confirm the port is truly open from an arbitrary source (service banner/handshake), and that the rule source is 0.0.0.0/0 rather than a restricted CIDR/bastion.", simple: "Confirm the port really answers from anywhere, not just a trusted range.", hi: "Confirm करें port सच में किसी भी source से open है (service banner/handshake), और rule source 0.0.0.0/0 है, restricted CIDR/bastion नहीं।" },
          { en: "Stop at exposure confirmation — do not brute force credentials or exploit the service.", simple: "Stop once you've shown it's exposed; don't try to log in or exploit.", hi: "Exposure confirmation पर रुकें — credentials brute force या service exploit न करें।" },
        ],
      },
    ],
    proof: {
      en: "Show the management port reachable from the internet (scan result/banner) tied to an in-scope asset, and the over-broad rule if available. It is N/A if access is actually restricted (bastion/VPN/allow-listed CIDR), the port serves a service intended to be public, or the host is not the target's. Do not attempt authentication attacks as part of the proof.",
      simple: "Show the admin port answering from the open internet on a target asset, plus the too-open rule. If it's really locked to a bastion/VPN, or meant to be public, it's N/A. Don't try to log in.",
      hi: "दिखाएं management port internet से पहुँच योग्य है (scan result/banner) और in-scope asset से बंधा, और उपलब्ध हो तो over-broad rule। अगर access सच में restricted (bastion/VPN/allow-listed CIDR) है, port public-intended service देता है, या host target का नहीं, तो N/A। proof के रूप में authentication attacks न करें।",
    },
    escalate: {
      en: "Sibling to Lack of Network Segmentation (P3): that leaf covers internal east-west over-reach, while here the exposure faces the public internet.",
      simple: "Related to the Lack of Network Segmentation leaf; that's internal reach, this is internet-facing exposure.",
      hi: "Lack of Network Segmentation (P3) का sibling: वह leaf internal east-west over-reach है, जबकि यहाँ exposure public internet की ओर है।",
    },
  },

  "Cloud Security › Misconfigured Services and APIs › Insecure API Endpoints": {
    what: {
      en: "A cloud-hosted API (API Gateway route, serverless function URL, managed service endpoint) is configured insecurely: missing authentication/authorization, overly permissive CORS or resource policy, no throttling, or verbose errors. The misconfiguration is at the cloud service layer, letting callers reach functionality or data the endpoint should gate. This P4 band is the low-impact baseline; concrete data/authz impact can raise it.",
      simple: "A cloud API endpoint is set up loosely — no proper auth, open CORS, or leaky errors — so callers can reach things it should protect.",
      hi: "Cloud-hosted API (API Gateway route, serverless function URL, managed service endpoint) insecurely configured है: missing authentication/authorization, overly permissive CORS/resource policy, no throttling, या verbose errors। Misconfiguration cloud service layer पर है, जिससे callers ऐसी functionality/data तक पहुँचते हैं जिसे endpoint gate करना चाहिए।",
    },
    find: [
      {
        title: { en: "Probe the endpoint's access controls and config", simple: "Test the API's auth and settings", hi: "Endpoint के access controls और config probe करना" },
        steps: [
          { en: "Enumerate cloud API surfaces (API Gateway stages, Lambda/Cloud Function URLs, exposed managed endpoints) from recon and the client, and request them without credentials.", simple: "Find the cloud API endpoints and try calling them without logging in.", hi: "Cloud API surfaces (API Gateway stages, Lambda/Cloud Function URLs, exposed managed endpoints) recon और client से enumerate करें और बिना credentials request करें।" },
          { en: "Check for missing authz (data/actions returned unauthenticated), permissive CORS (reflected Origin with credentials), or resource-policy gaps allowing unexpected principals.", simple: "Look for responses without auth, open CORS, or too-broad access policy.", hi: "Missing authz (बिना authentication data/actions लौटना), permissive CORS (reflected Origin with credentials), या resource-policy gaps देखें।" },
          { en: "Capture the exact request/response showing the gate is absent or bypassable; verify it is a real resource, not a public-by-design endpoint.", simple: "Capture a request proving the gate is missing, and confirm it's not meant to be public.", hi: "exact request/response capture करें जो दिखाए gate absent/bypassable है; confirm करें यह real resource है, public-by-design endpoint नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs a request/response demonstrating the specific misconfiguration (unauthenticated access, exploitable CORS, policy gap) on an in-scope endpoint. It is N/A if the endpoint is intentionally public, the 'missing' auth is enforced elsewhere, or you only point at verbose errors with no access consequence. Map it to the more specific VRT leaf (e.g. broken authz, CORS) when one fits better.",
      simple: "Show a request proving the specific weakness on a real endpoint. Intentionally public endpoints or harmless verbose errors are N/A.",
      hi: "Triage को चाहिए request/response जो specific misconfiguration (unauthenticated access, exploitable CORS, policy gap) in-scope endpoint पर दिखाए। अगर endpoint intentionally public है, 'missing' auth कहीं और enforce है, या आप सिर्फ़ verbose errors दिखाते हैं बिना access consequence, तो N/A।",
    },
    escalate: {
      en: "Sibling to Exposed Debug or Admin Interfaces (varies): if the endpoint fronts an admin/debug surface or yields high-impact data/actions, that leaf and its higher band apply.",
      simple: "If the endpoint exposes an admin/debug interface, use that higher-impact leaf.",
      hi: "Exposed Debug or Admin Interfaces (varies) का sibling: अगर endpoint admin/debug surface front करता है या high-impact data/actions देता है, तो वह leaf और उसका higher band लागू होता है।",
    },
  },

  "Cloud Security › Logging and Monitoring Issues › Disabled or Insufficient Logging": {
    what: {
      en: "Audit/activity logging is turned off or too sparse to detect and investigate abuse — no CloudTrail/management-event logging, no flow logs, missing data-plane or access logs, or logs with no retention/alerting. There is no direct data or access impact; the weakness is that attacks would go unseen and incident response would lack evidence. It is a detective-control gap, almost always informational.",
      simple: "The cloud isn't recording enough activity logs, so attacks wouldn't be noticed and couldn't be investigated. No direct break, just blind spots.",
      hi: "Audit/activity logging बंद है या इतना sparse कि abuse detect/investigate न हो सके — कोई CloudTrail/management-event logging नहीं, no flow logs, missing data-plane/access logs, या बिना retention/alerting logs। कोई direct data/access impact नहीं; weakness यह कि attacks अनदेखे रह जाएँ और incident response के पास evidence न हो।",
    },
    find: [
      {
        title: { en: "Review logging coverage and retention", simple: "Check what is and isn't being logged", hi: "Logging coverage और retention review करना" },
        steps: [
          { en: "With legitimate account visibility, check whether management/audit logging is enabled (CloudTrail/Azure Activity/GCP Admin logs), plus flow logs and key data-plane access logs.", simple: "Check if the main audit logs are turned on.", hi: "Legitimate account visibility से जाँचें management/audit logging enabled है या नहीं (CloudTrail/Azure Activity/GCP Admin logs), साथ ही flow logs और key data-plane access logs।" },
          { en: "Confirm gaps: no logging on a sensitive resource, no retention, or no alerting/monitoring consuming the logs.", simple: "Confirm the gaps: logging off, no retention, or no alerts.", hi: "Gaps confirm करें: sensitive resource पर कोई logging नहीं, no retention, या logs consume करने वाला कोई alerting/monitoring नहीं।" },
          { en: "Document the specific coverage gap against what the service offers — this is configuration evidence, no exploitation.", simple: "Write down exactly what logging is missing versus what's available.", hi: "Service जो offer करती है उसके मुकाबले specific coverage gap दर्ज करें — यह configuration evidence है, कोई exploitation नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Show the configuration proving logging is disabled or materially insufficient on in-scope resources. This is P5/informational: almost never rewarded on its own, and programs frequently treat it as a hygiene note. It is N/A if logging is actually enabled, the gap is on out-of-scope/non-sensitive resources, or you cannot show the configuration.",
      simple: "Show the setting proving logs are off or too thin. This is informational and rarely paid alone. If logging is actually on, it's N/A.",
      hi: "दिखाएं configuration जो साबित करे in-scope resources पर logging disabled या materially insufficient है। यह P5/informational है: अकेले लगभग कभी reward नहीं, programs इसे अक्सर hygiene note मानते हैं। अगर logging सच में enabled है या gap out-of-scope/non-sensitive पर है, तो N/A।",
    },
  },

  "Cloud Security › Misconfigured Services and APIs › Exposed Debug or Admin Interfaces": {
    what: {
      en: "A debug or administrative interface is reachable without proper protection — a cloud service console/management endpoint, an exposed Kubernetes dashboard, an open container/orchestration API, a framework debug panel (actuator, /debug, phpinfo), or a managed-service admin UI. These grant inspection or control of the environment. Impact varies from information disclosure to full control, which is why the VRT priority is 'varies'.",
      simple: "A debug or admin panel is open without proper login — like a Kubernetes dashboard, container API, or framework debug page. Depending on what it exposes, impact ranges from info leak to full control.",
      hi: "कोई debug/administrative interface बिना proper protection पहुँच योग्य है — cloud service console/management endpoint, exposed Kubernetes dashboard, open container/orchestration API, framework debug panel (actuator, /debug, phpinfo), या managed-service admin UI। ये environment का inspection/control देते हैं। Impact info disclosure से full control तक, इसलिए priority 'varies'।",
    },
    find: [
      {
        title: { en: "Discover and classify the exposed interface", simple: "Find the open admin/debug panel and rate it", hi: "Exposed interface discover और classify करना" },
        steps: [
          { en: "From recon, probe for admin/debug paths and ports (Kubernetes 10250/dashboard, Docker 2375, Spring actuator, /debug, management consoles) on in-scope hosts.", simple: "Look for admin/debug URLs and ports on the target.", hi: "Recon से in-scope hosts पर admin/debug paths/ports probe करें (Kubernetes 10250/dashboard, Docker 2375, Spring actuator, /debug, management consoles)।" },
          { en: "Confirm it is reachable without authentication (or with default/guessable creds you are allowed to test) and classify what it exposes: read-only info vs state-changing control.", simple: "Confirm it opens without login and note whether it just shows info or lets you control things.", hi: "Confirm करें यह बिना authentication पहुँच योग्य है (या default/guessable creds जो test allowed हैं) और classify करें: read-only info बनाम state-changing control।" },
          { en: "Capture a benign screenshot/response showing access; do not execute state-changing admin actions — read-only evidence is enough.", simple: "Grab a harmless screenshot proving access; don't change anything.", hi: "Access दिखाता benign screenshot/response capture करें; state-changing admin actions न करें — read-only evidence काफी है।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs proof the interface is reachable without proper auth and a classification of its capability (what data/control it grants) on an in-scope asset. Keep evidence read-only. It is N/A if the interface is authenticated/IP-restricted, it is a decoy/static page, or it is intended to be public. Severity follows capability — read-only info leans lower, state-changing control leans P1-ish.",
      simple: "Show the panel opens without proper auth and what it can do, with read-only evidence. If it's actually protected or meant to be public, it's N/A. Severity depends on its power.",
      hi: "Triage को चाहिए proof कि interface बिना proper auth पहुँच योग्य है और उसकी capability का classification (क्या data/control) in-scope asset पर। Evidence read-only रखें। अगर interface authenticated/IP-restricted है, decoy/static page है, या public-intended है, तो N/A। Severity capability से चलती है।",
    },
    escalate: {
      en: "Sibling to Insecure API Endpoints (P4): a plain loosely-configured API sits at P4, but an exposed admin/debug surface that grants control can reach the top of the 'varies' band.",
      simple: "A plain loose API is the P4 leaf; an admin panel that grants control is far higher.",
      hi: "Insecure API Endpoints (P4) का sibling: सामान्य loosely-configured API P4 पर है, पर control देने वाला exposed admin/debug surface 'varies' band के शीर्ष तक पहुँच सकता है।",
    },
  },

  "Cloud Security › Storage Misconfigurations › Publicly Accessible Cloud Storage": {
    what: {
      en: "A storage bucket or container (S3, GCS, Azure Blob) is readable (or writable) by anyone due to a public ACL, a permissive bucket policy, or 'all users'/'authenticated users' grants. Anyone can list and download its objects, and a writable bucket lets attackers plant or overwrite content. Impact varies with what is stored and the access level, from trivial public assets to a full data breach — hence 'varies'.",
      simple: "A cloud bucket is open to the public, so anyone can read (and sometimes write) its files. How bad it is depends on what's inside and whether writes are allowed.",
      hi: "कोई storage bucket/container (S3, GCS, Azure Blob) public ACL, permissive bucket policy, या 'all users'/'authenticated users' grants के कारण किसी के भी द्वारा readable (या writable) है। कोई भी objects list/download कर सकता है, और writable bucket में attackers content plant/overwrite कर सकते हैं। Impact content और access level पर निर्भर, इसलिए 'varies'।",
    },
    find: [
      {
        title: { en: "Discover the bucket and test its access level", simple: "Find the open bucket and check read/write", hi: "Bucket discover करें और access level test करें" },
        steps: [
          { en: "Enumerate buckets tied to the target by name permutations and recon (S3Scanner, cloud_enum, or reading URLs in the app/JS), across S3, GCS and Azure Blob.", simple: "Find storage buckets belonging to the target by guessing names and from recon.", hi: "Target से जुड़े buckets name permutations और recon (S3Scanner, cloud_enum, या app/JS में URLs) से enumerate करें — S3, GCS, Azure Blob।" },
          { en: "Test anonymous read (list + GET an object) and, carefully, anonymous write permission (a PutObject of a harmless canary file you immediately delete) to determine the access level.", simple: "Check if you can list/download anonymously, and carefully whether you can upload a test file.", hi: "Anonymous read (list + object GET) और सावधानी से anonymous write (harmless canary file का PutObject जो तुरंत delete करें) test करके access level तय करें।" },
          { en: "Assess sensitivity of what is exposed without downloading real sensitive data in bulk — object names, counts, and one benign sample suffice.", simple: "Judge how sensitive the contents are without bulk-downloading real data.", hi: "Exposed content की sensitivity आँकें बिना real sensitive data bulk download किए — object names, counts, एक benign sample काफी।" },
        ],
      },
    ],
    proof: {
      en: "Show the bucket is publicly readable/writable (the request succeeding anonymously), that it belongs to the in-scope org, and the nature/sensitivity of the contents — without exfiltrating real user data. It is N/A if access actually requires auth, the bucket is intended-public (static site/CDN assets), or it is not the target's. Severity scales with data sensitivity and whether writes are possible.",
      simple: "Show the bucket opening without auth on a target asset and what's in it, without stealing real data. Intended-public asset buckets are N/A. Worse if you can also write.",
      hi: "दिखाएं bucket publicly readable/writable है (anonymous request सफल), in-scope org की है, और contents की nature/sensitivity — real user data exfiltrate किए बिना। अगर access सच में auth माँगता है, bucket intended-public (static site/CDN) है, या target की नहीं, तो N/A। Severity data sensitivity और write संभव होने से बढ़ती है।",
    },
    escalate: {
      en: "Sibling to Unencrypted Sensitive Data at Rest (P2): that leaf is about missing encryption of data that is not necessarily public; public exposure of sensitive data here is generally the higher-impact finding.",
      simple: "Related to the Unencrypted-at-rest leaf; public exposure of sensitive data is usually worse than just missing encryption.",
      hi: "Unencrypted Sensitive Data at Rest (P2) का sibling: वह leaf data के missing encryption के बारे में है जो ज़रूरी नहीं public हो; यहाँ sensitive data का public exposure आमतौर पर higher-impact है।",
    },
    references: [
      { label: "HackTricks Cloud: S3", url: "https://cloud.hacktricks.xyz/pentesting-cloud/aws-security" },
    ],
  },
  // ── Active Directory (AD) ────────────────────────────────────────────────
  "Active Directory (AD) › Kerberos Abuse › Domain Compromise via Unconstrained Delegated": {
    what: {
      en: "A computer or account configured for Kerberos unconstrained delegation caches the TGT of any principal that authenticates to it. An attacker who controls such a host coerces a privileged machine account (e.g. a Domain Controller) to authenticate to it — using PrinterBug/PetitPotam/Coercer — captures the DC's TGT from memory, and replays it to perform DCSync, yielding domain compromise. The flaw is the delegation setting plus a coercion primitive.",
      simple: "A machine set to 'unconstrained delegation' keeps a copy of anyone's Kerberos ticket who connects to it. The attacker forces a Domain Controller to connect, steals its ticket, and uses it to take over the whole domain.",
      hi: "Kerberos unconstrained delegation के लिए configured computer/account उस किसी भी principal का TGT cache कर लेता है जो उससे authenticate करता है। ऐसा host control करने वाला attacker किसी privileged machine account (जैसे Domain Controller) को उससे authenticate करने के लिए coerce करता है — PrinterBug/PetitPotam/Coercer से — memory से DC का TGT capture करता है और DCSync के लिए replay करता है, जिससे domain compromise। दोष delegation setting + coercion primitive है।",
    },
    find: [
      {
        title: { en: "Find unconstrained hosts, coerce, capture the TGT", simple: "Spot the delegation host, force a DC to it, steal the ticket", hi: "Unconstrained hosts ढूँढें, coerce करें, TGT capture करें" },
        steps: [
          { en: "Enumerate unconstrained-delegation principals with BloodHound/SharpHound (the UnconstrainedDelegation edge) or an LDAP query for userAccountControl TRUSTED_FOR_DELEGATION.", simple: "List machines with unconstrained delegation using BloodHound or an LDAP query.", hi: "Unconstrained-delegation principals BloodHound/SharpHound (UnconstrainedDelegation edge) या userAccountControl TRUSTED_FOR_DELEGATION की LDAP query से enumerate करें।" },
          { en: "On a host you control that has the setting, start a capture (Rubeus monitor / mimikatz) and coerce a DC's machine account to authenticate to it via PrinterBug (SpoolSample/dementor), PetitPotam or Coercer.", simple: "On the delegation host, run a ticket capture and use PetitPotam/PrinterBug to force a DC to connect.", hi: "जिस host पर setting है वहाँ capture शुरू करें (Rubeus monitor/mimikatz) और DC के machine account को PrinterBug (SpoolSample/dementor), PetitPotam या Coercer से authenticate कराएं।" },
          { en: "Extract the DC's TGT, inject it, and prove domain-level access with a benign DCSync of a single canary/krbtgt-adjacent attribute in a test/lab domain — not a full dump.", simple: "Take the DC's ticket and prove domain access with one safe DCSync test in a lab.", hi: "DC का TGT extract करें, inject करें, और test/lab domain में एक canary attribute के benign DCSync से domain-level access साबित करें — full dump नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the vulnerable delegation configuration, the coercion that forced a privileged account to authenticate, and benign evidence of the captured TGT granting elevated access — ideally in a lab/assumed-breach engagement. This is almost always internal/pentest scope: public bug-bounty programs rarely include domain infrastructure. It is N/A against production data (no krbtgt dumping) or where delegation hosts cannot be reached.",
      simple: "Show the delegation setting, the coercion forcing a DC to connect, and safe proof the stolen ticket gives elevated access, ideally in a lab. This is internal/pentest work, not usually bug-bounty scope. Don't dump real secrets.",
      hi: "Triage को चाहिए vulnerable delegation configuration, वह coercion जिसने privileged account को authenticate कराया, और captured TGT के elevated access का benign evidence — बेहतर हो lab/assumed-breach। यह लगभग हमेशा internal/pentest scope है: public bug-bounty programs शायद ही domain infrastructure शामिल करते हैं। production data पर (कोई krbtgt dumping नहीं) N/A।",
    },
    escalate: {
      en: "It is the top of the Kerberos Abuse group; the siblings Kerberoasting (P2) and AS-REP Roasting (P2) are credential-harvest steps that can provide the initial foothold leading to this delegation-to-domain-compromise chain.",
      simple: "This is the worst of the Kerberos leaves; Kerberoasting and AS-REP roasting (P2) are earlier steps that can lead here.",
      hi: "यह Kerberos Abuse group का शीर्ष है; siblings Kerberoasting (P2) और AS-REP Roasting (P2) credential-harvest steps हैं जो इस delegation-to-domain-compromise chain तक initial foothold दे सकते हैं।",
    },
    references: [
      { label: "HackTricks: Unconstrained Delegation", url: "https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/unconstrained-delegation" },
    ],
  },

  "Active Directory (AD) › Kerberos Abuse › Insecure Service Account Management (Kerberoasting)": {
    what: {
      en: "Any domain user can request a Kerberos service ticket (TGS) for a service account that has an SPN set. The ticket is encrypted with the service account's password-derived key, so an attacker extracts it and cracks it offline. Service accounts often have weak, non-expiring passwords and high privilege, so a cracked one yields that account's access. Root cause is SPN accounts with weak passwords plus RC4-crackable tickets.",
      simple: "Any logged-in domain user can ask for a service ticket for an account that runs a service, then crack that ticket offline to recover the account's password. Service accounts often have weak, powerful passwords.",
      hi: "कोई भी domain user SPN set वाले service account के लिए Kerberos service ticket (TGS) माँग सकता है। Ticket service account के password-derived key से encrypt होता है, तो attacker उसे extract करके offline crack करता है। Service accounts के अक्सर weak, non-expiring passwords और high privilege होते हैं। Root cause: weak password वाले SPN accounts + RC4-crackable tickets।",
    },
    find: [
      {
        title: { en: "Request and crack SPN service tickets", simple: "Get service tickets and crack them offline", hi: "SPN service tickets request करके crack करना" },
        steps: [
          { en: "Enumerate kerberoastable accounts (users with servicePrincipalName) via BloodHound or Impacket GetUserSPNs with any valid domain credential.", simple: "List accounts with SPNs using BloodHound or GetUserSPNs.", hi: "Kerberoastable accounts (servicePrincipalName वाले users) BloodHound या Impacket GetUserSPNs से किसी valid domain credential के साथ enumerate करें।" },
          { en: "Request TGS tickets with GetUserSPNs -request (or Rubeus kerberoast), preferring targets whose tickets come as RC4 (etype 23) for faster cracking.", simple: "Request the service tickets with GetUserSPNs or Rubeus kerberoast.", hi: "GetUserSPNs -request (या Rubeus kerberoast) से TGS tickets request करें, RC4 (etype 23) tickets वाले targets प्राथमिकता दें।" },
          { en: "Crack the extracted hashes offline (hashcat mode 13100) with a wordlist; a recovered password proves the finding — then stop, do not log in to production services.", simple: "Crack the ticket hash with hashcat; a recovered password is the proof.", hi: "Extracted hashes offline crack करें (hashcat mode 13100) wordlist से; recovered password finding साबित करता है — फिर रुकें, production services में log in न करें।" },
        ],
      },
    ],
    proof: {
      en: "Show the kerberoastable SPN account, the requested ticket, and a cracked password (or evidence of weak crackability) — all from a standard domain user, demonstrating privilege is obtainable. This is internal/pentest scope. It is N/A if service accounts use strong/managed (gMSA) passwords that resist cracking, or you only list SPNs without demonstrating a weak, crackable ticket.",
      simple: "Show the SPN account, the ticket, and that you cracked its password from a normal user. Internal/pentest scope. Strong or gMSA-managed passwords that won't crack are N/A.",
      hi: "दिखाएं kerberoastable SPN account, requested ticket, और cracked password (या weak crackability का evidence) — सब standard domain user से, यानी privilege obtainable है। यह internal/pentest scope है। अगर service accounts strong/managed (gMSA) passwords इस्तेमाल करते हैं जो crack नहीं होते, तो N/A।",
    },
    escalate: {
      en: "A cracked high-privilege service account can feed the Domain Compromise via Unconstrained Delegation (P1) chain or DACL abuse; AS-REP Roasting (P2) is the sibling for accounts lacking pre-auth rather than SPNs.",
      simple: "A cracked powerful service account can lead to the P1 delegation chain; AS-REP roasting is the sibling for pre-auth-disabled accounts.",
      hi: "Cracked high-privilege service account Domain Compromise via Unconstrained Delegation (P1) chain या DACL abuse को feed कर सकता है; AS-REP Roasting (P2) उन accounts के लिए sibling है जिनमें pre-auth नहीं, SPN नहीं।",
    },
    references: [
      { label: "HackTricks: Kerberoast", url: "https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/kerberoast" },
    ],
  },

  "Active Directory (AD) › Kerberos Abuse › User Does Not Require Pre-authentication (ASREPRoasting)": {
    what: {
      en: "An account with 'Do not require Kerberos pre-authentication' set (DONT_REQ_PREAUTH) lets anyone request an AS-REP for it without first proving knowledge of its password. Part of that reply is encrypted with the account's password-derived key, so an attacker extracts it and cracks it offline. Unlike Kerberoasting, no prior domain credential is needed — just the account name. Root cause is the disabled pre-auth flag plus a weak password.",
      simple: "Some accounts are set so Kerberos doesn't ask for a password first. That lets anyone grab a piece of data encrypted with the account's password and crack it offline — without even having a domain login.",
      hi: "'Do not require Kerberos pre-authentication' (DONT_REQ_PREAUTH) वाले account के लिए कोई भी बिना password जाने AS-REP request कर सकता है। उस reply का हिस्सा account के password-derived key से encrypt होता है, तो attacker उसे extract करके offline crack करता है। Kerberoasting के विपरीत, कोई prior domain credential नहीं चाहिए — सिर्फ़ account name। Root cause: disabled pre-auth flag + weak password।",
    },
    find: [
      {
        title: { en: "Request AS-REP for pre-auth-disabled accounts", simple: "Grab and crack AS-REP for these accounts", hi: "Pre-auth-disabled accounts के लिए AS-REP request करना" },
        steps: [
          { en: "Enumerate accounts with DONT_REQ_PREAUTH via BloodHound (the DontReqPreAuth flag) or, with no creds, Impacket GetNPUsers against a username list.", simple: "Find accounts with pre-auth disabled using BloodHound or GetNPUsers.", hi: "DONT_REQ_PREAUTH वाले accounts BloodHound (DontReqPreAuth flag) या बिना creds Impacket GetNPUsers से username list के खिलाफ enumerate करें।" },
          { en: "Request the AS-REP (GetNPUsers -request / Rubeus asreproast) and capture the roastable hash.", simple: "Request the AS-REP with GetNPUsers or Rubeus asreproast.", hi: "AS-REP request करें (GetNPUsers -request / Rubeus asreproast) और roastable hash capture करें।" },
          { en: "Crack it offline (hashcat mode 18200); a recovered password proves the finding — stop at proof.", simple: "Crack the hash with hashcat; a recovered password is the proof.", hi: "Offline crack करें (hashcat mode 18200); recovered password finding साबित करता है — proof पर रुकें।" },
        ],
      },
    ],
    proof: {
      en: "Show the account has pre-auth disabled, the captured AS-REP, and a cracked password — noting whether it was obtainable with no domain credential at all (AV:A, PR:N). Internal/pentest scope. It is N/A if the flagged account has a strong uncrackable password, is disabled, or the pre-auth flag is not actually set.",
      simple: "Show the account has pre-auth off, the captured reply, and that you cracked it. Note if it needed no login at all. Internal scope. Strong-password or disabled accounts are N/A.",
      hi: "दिखाएं account का pre-auth disabled है, captured AS-REP, और cracked password — नोट करें कि यह बिना किसी domain credential (AV:A, PR:N) obtainable था या नहीं। Internal/pentest scope। अगर flagged account का password strong/uncrackable है, disabled है, या flag सच में set नहीं, तो N/A।",
    },
    escalate: {
      en: "Siblings Kerberoasting (P2) and the P1 Unconstrained Delegation chain: a cracked account here can be the initial foothold that those steps build on toward domain compromise.",
      simple: "A cracked account here can be the foothold that feeds Kerberoasting and the P1 delegation chain.",
      hi: "Siblings Kerberoasting (P2) और P1 Unconstrained Delegation chain: यहाँ cracked account वह initial foothold हो सकता है जिस पर वे steps domain compromise की ओर build करते हैं।",
    },
    references: [
      { label: "HackTricks: AS-REP Roast", url: "https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/asreproast" },
    ],
  },

  "Active Directory (AD) › Configuration Weaknesses › Shared Administrator Passwords": {
    what: {
      en: "The same local Administrator (or a shared privileged) password is reused across many domain-joined machines. An attacker who recovers that password/hash from one host (via dumped SAM, LSASS, or cracking) can authenticate to every other machine that shares it — pass-the-hash or pass-the-password lateral movement across the estate. The root cause is no per-host password uniqueness (e.g. LAPS not deployed).",
      simple: "Every machine uses the same local admin password. Crack or dump it on one box and you can log into all the others with it, spreading across the network.",
      hi: "वही local Administrator (या shared privileged) password कई domain-joined machines पर reuse होता है। एक host से वह password/hash recover करने वाला attacker (dumped SAM, LSASS, या cracking से) हर दूसरी machine पर authenticate कर सकता है — pass-the-hash/pass-the-password lateral movement। Root cause: per-host uniqueness नहीं (जैसे LAPS deploy नहीं)।",
    },
    find: [
      {
        title: { en: "Recover one admin secret, test reuse", simple: "Get the admin hash on one host, try it on others", hi: "एक admin secret recover करें, reuse test करें" },
        steps: [
          { en: "On a host you are authorised to test, dump the local Administrator hash (secretsdump/SAM) or crack it, as part of an assumed-breach engagement.", simple: "On an authorised host, dump or crack the local admin hash.", hi: "Authorised host पर local Administrator hash dump करें (secretsdump/SAM) या crack करें, assumed-breach engagement के तहत।" },
          { en: "Spray that hash/password across a small set of other in-scope hosts with CrackMapExec/NetExec or Impacket, watching for successful authentication (Pwn3d! / admin access).", simple: "Try that hash on a few other hosts with NetExec/CrackMapExec.", hi: "वह hash/password कुछ अन्य in-scope hosts पर CrackMapExec/NetExec या Impacket से spray करें, successful authentication (Pwn3d!) देखें।" },
          { en: "Confirm the same secret authenticates to multiple machines, proving reuse — stop at authentication, do not harvest data.", simple: "Confirm the same secret logs into several machines, then stop.", hi: "Confirm करें वही secret कई machines पर authenticate करता है — authentication पर रुकें, data harvest न करें।" },
        ],
      },
    ],
    proof: {
      en: "Show one recovered local-admin secret authenticating to multiple distinct hosts, proving the password is shared and enables lateral movement. Internal/pentest scope. It is N/A if LAPS or per-host unique passwords are in place, the reuse is across your own test boxes only, or you cannot show successful cross-host auth.",
      simple: "Show one admin password/hash logging into several different machines. Internal scope. If LAPS or unique passwords are used, it's N/A.",
      hi: "दिखाएं एक recovered local-admin secret कई distinct hosts पर authenticate करता है, यानी password shared है और lateral movement देता है। Internal/pentest scope। अगर LAPS या per-host unique passwords हैं, तो N/A।",
    },
    escalate: {
      en: "Shares the Configuration Weaknesses group with Weak Domain Password Policy (P2), Excessive Domain Admin Membership (P3), Dormant Accounts (P3) and Passwords in Account Descriptions (varies); if the shared account is also a Domain Admin, lateral movement becomes domain compromise.",
      simple: "Related to the other config-weakness leaves; if the shared account is a Domain Admin, it escalates to domain takeover.",
      hi: "Configuration Weaknesses group में Weak Domain Password Policy (P2), Excessive Domain Admin Membership (P3), Dormant Accounts (P3), Passwords in Descriptions (varies) के साथ है; अगर shared account Domain Admin भी है तो lateral movement domain compromise बन जाता है।",
    },
    references: [
      { label: "HackTricks: Pass the Hash", url: "https://book.hacktricks.xyz/windows-hardening/ntlm" },
    ],
  },

  "Active Directory (AD) › Configuration Weaknesses › Weak Domain Password Policy": {
    what: {
      en: "The domain password policy is too lax — short minimum length, no complexity, no lockout/long lockout thresholds, or a weak fine-grained policy — so accounts are susceptible to guessing, spraying and offline cracking at scale. The weakness is systemic: it raises the success rate of every credential attack (spray, Kerberoast, AS-REP roast) across the domain rather than compromising one account.",
      simple: "The domain lets users pick weak passwords and doesn't lock accounts after many wrong tries, so password guessing and cracking work far too easily across all accounts.",
      hi: "Domain password policy बहुत ढीली है — short minimum length, no complexity, no/long lockout thresholds, या weak fine-grained policy — तो accounts guessing, spraying और offline cracking के प्रति susceptible हैं। Weakness systemic है: यह domain भर में हर credential attack (spray, Kerberoast, AS-REP) की success rate बढ़ाती है।",
    },
    find: [
      {
        title: { en: "Read the policy, demonstrate its weakness", simple: "Check the policy and show weak passwords get in", hi: "Policy पढ़ें, उसकी weakness दिखाएं" },
        steps: [
          { en: "With any domain credential read the effective policy (net accounts, PowerView Get-DomainPolicy, or BloodHound) and note minimum length, complexity, lockout threshold and fine-grained PSOs.", simple: "Read the password policy settings with net accounts or PowerView.", hi: "किसी domain credential से effective policy पढ़ें (net accounts, PowerView Get-DomainPolicy, या BloodHound) और minimum length, complexity, lockout threshold, fine-grained PSOs नोट करें।" },
          { en: "Demonstrate concrete risk within lockout limits: a low-and-slow password spray of one common password honouring the lockout threshold, showing at least one weak account would be reachable.", simple: "Do a careful, slow spray of one common password, staying under the lockout limit.", hi: "Lockout limits के भीतर concrete risk दिखाएं: lockout threshold का सम्मान करते हुए एक common password का low-and-slow spray, जो दिखाए कम-से-कम एक weak account reachable है।" },
          { en: "Correlate the policy with cracked hashes from Kerberoast/AS-REP to show policy-level weakness, avoiding account lockouts.", simple: "Tie the weak policy to passwords you cracked, without locking accounts.", hi: "Policy को Kerberoast/AS-REP से cracked hashes से correlate करके policy-level weakness दिखाएं, account lockouts से बचते हुए।" },
        ],
      },
    ],
    proof: {
      en: "Show the policy values proving weakness plus a controlled demonstration (a careful spray within lockout limits, or cracked passwords attributable to the lax policy). Internal/pentest scope. Carefully avoid locking out real accounts. It is N/A if the policy meets accepted baselines, or you only state the numbers without showing exploitable risk.",
      simple: "Show the weak policy settings and a careful demo that it lets weak passwords through, without locking anyone out. Internal scope. A policy that meets good baselines is N/A.",
      hi: "दिखाएं policy values जो weakness साबित करें + controlled demonstration (lockout limits में careful spray, या lax policy से attributable cracked passwords)। Internal/pentest scope। real accounts lock out करने से बचें। अगर policy accepted baselines पूरा करती है, तो N/A।",
    },
    escalate: {
      en: "A weak policy multiplies the odds of the sibling credential attacks — Kerberoasting (P2), AS-REP Roasting (P2) — and spraying landing, which can chain to privileged accounts and domain compromise.",
      simple: "A weak policy makes Kerberoasting, AS-REP roasting and spraying far more likely to succeed and chain upward.",
      hi: "Weak policy sibling credential attacks — Kerberoasting (P2), AS-REP Roasting (P2) — और spraying के सफल होने की संभावना बढ़ाती है, जो privileged accounts और domain compromise तक chain हो सकती है।",
    },
  },

  "Active Directory (AD) › Configuration Weaknesses › Dormant / Inactive User Accounts Enabled in the Domain": {
    what: {
      en: "Accounts that are no longer used (departed staff, old service/test accounts) remain enabled in the domain. They often have stale, weak or never-rotated passwords, no MFA, and are unmonitored, so compromising one is low-risk for the attacker and unlikely to be noticed. They expand the attack surface for spraying, Kerberoasting and lateral movement without belonging to anyone who would report misuse.",
      simple: "Old accounts for people who left or test accounts are still turned on. They usually have weak, forgotten passwords and nobody watches them, making them easy, quiet ways in.",
      hi: "अब इस्तेमाल न होने वाले accounts (गए हुए staff, पुराने service/test accounts) domain में enabled रहते हैं। इनके अक्सर stale/weak/never-rotated passwords, no MFA होते हैं और unmonitored होते हैं, तो एक को compromise करना attacker के लिए low-risk और अनदेखा रहने की संभावना। ये spraying, Kerberoasting, lateral movement के लिए attack surface बढ़ाते हैं।",
    },
    find: [
      {
        title: { en: "Enumerate stale enabled accounts", simple: "List old accounts that are still enabled", hi: "Stale enabled accounts enumerate करना" },
        steps: [
          { en: "Query AD for enabled accounts with an old lastLogonTimestamp / pwdLastSet (PowerView Get-DomainUser, BloodHound 'inactive' filters) to identify dormant-but-enabled users.", simple: "Find enabled accounts that haven't logged in for a long time.", hi: "AD में enabled accounts query करें जिनका lastLogonTimestamp/pwdLastSet पुराना है (PowerView Get-DomainUser, BloodHound inactive filters) ताकि dormant-but-enabled users पहचानें।" },
          { en: "Cross-reference with departed staff / obvious test names, and flag those also lacking MFA or holding privilege.", simple: "Match them to ex-staff or test names and note any with privileges.", hi: "Departed staff / obvious test names से cross-reference करें और उन्हें flag करें जिनमें MFA नहीं या privilege है।" },
          { en: "Optionally show exploitability by a careful spray or AS-REP/Kerberoast against the dormant set within lockout limits — not a full campaign.", simple: "Optionally show one is reachable with a careful credential check, within limits.", hi: "वैकल्पिक रूप से lockout limits में dormant set पर careful spray या AS-REP/Kerberoast से exploitability दिखाएं — full campaign नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Show a list of enabled accounts with long inactivity and why they are dormant (ex-staff/test), ideally with one demonstrated as attacker-usable. Internal/pentest scope. It is N/A if the accounts are legitimately active, already disabled, or you only list inactivity with no security relevance (break-glass accounts intentionally kept).",
      simple: "Show enabled accounts long unused and why they're abandoned, ideally one you could use. Internal scope. Legitimately active or intentionally-kept accounts are N/A.",
      hi: "दिखाएं long inactivity वाले enabled accounts की list और क्यों dormant हैं (ex-staff/test), बेहतर हो एक attacker-usable दिखा। Internal/pentest scope। अगर accounts legitimately active, already disabled, या intentionally kept (break-glass) हैं, तो N/A।",
    },
    escalate: {
      en: "Siblings in Configuration Weaknesses: a dormant account with weak credentials feeds spraying under a Weak Domain Password Policy (P2), and if it holds privilege it overlaps Excessive Domain Admin Membership (P3).",
      simple: "Dormant accounts pair with the weak-policy leaf for spraying, and with the excessive-admin leaf if they have privileges.",
      hi: "Configuration Weaknesses के siblings: weak credentials वाला dormant account Weak Domain Password Policy (P2) के तहत spraying को feed करता है, और privilege हो तो Excessive Domain Admin Membership (P3) से overlap करता है।",
    },
  },

  "Active Directory (AD) › Configuration Weaknesses › Excessive Domain Admin Membership": {
    what: {
      en: "Too many accounts hold Domain Admin (or equivalent tier-0) membership — service accounts, personal admin accounts, or stale entries that do not need it. Every extra member is another path to domain compromise: each has credentials that can be cracked, phished or dumped, and each widens tier-0 exposure. The weakness is the inflated, poorly-justified membership of the most privileged group.",
      simple: "Far more accounts are Domain Admins than need to be. Each one is another way to take over the domain, so a bloated admin group is a big risk.",
      hi: "ज़रूरत से ज़्यादा accounts Domain Admin (या equivalent tier-0) membership रखते हैं — service accounts, personal admin accounts, या stale entries। हर extra member domain compromise का एक और रास्ता है: हर के credentials crack/phish/dump हो सकते हैं, और हर tier-0 exposure बढ़ाता है। Weakness सबसे privileged group की inflated, poorly-justified membership है।",
    },
    find: [
      {
        title: { en: "Enumerate and justify tier-0 membership", simple: "List Domain Admins and flag the needless ones", hi: "Tier-0 membership enumerate और justify करना" },
        steps: [
          { en: "Enumerate Domain Admins and nested tier-0 groups (BloodHound, Get-DomainGroupMember), including transitive membership through nested groups.", simple: "List all Domain Admins including ones via nested groups.", hi: "Domain Admins और nested tier-0 groups enumerate करें (BloodHound, Get-DomainGroupMember), nested groups के through transitive membership सहित।" },
          { en: "Flag members that should not be there: service accounts with SPNs (kerberoastable), dormant accounts, or personal accounts used for daily work.", simple: "Point out members that shouldn't be admins — service, dormant or daily-use accounts.", hi: "ऐसे members flag करें जो नहीं होने चाहिए: SPN वाले service accounts (kerberoastable), dormant accounts, या daily work के personal accounts।" },
          { en: "Use BloodHound attack paths to show how one weak/exposed admin member leads to full domain control, quantifying the inflated exposure.", simple: "Use BloodHound to show how one weak admin leads to domain takeover.", hi: "BloodHound attack paths से दिखाएं एक weak/exposed admin member full domain control तक कैसे ले जाता है, inflated exposure quantify करते हुए।" },
        ],
      },
    ],
    proof: {
      en: "Show the Domain Admin membership count with members that lack justification (kerberoastable service accounts, dormant or personal accounts) and the resulting attack paths. Internal/pentest scope. It is N/A if membership is minimal and justified, or you merely count admins without showing any member is a realistic compromise path.",
      simple: "Show the admin group is bloated with members that shouldn't be there and the attack paths they create. Internal scope. A minimal, justified admin group is N/A.",
      hi: "दिखाएं Domain Admin membership count और बिना justification वाले members (kerberoastable service accounts, dormant/personal accounts) और परिणामी attack paths। Internal/pentest scope। अगर membership minimal और justified है, या आप सिर्फ़ गिनती करते हैं, तो N/A।",
    },
    escalate: {
      en: "Overlaps the sibling Dormant Accounts (P3) when an inactive account is also a Domain Admin, and the Kerberos leaves when a Domain Admin is kerberoastable — any of these can short-circuit to domain compromise.",
      simple: "Overlaps the dormant-accounts leaf and the Kerberos leaves; any admin member that's crackable leads to domain takeover.",
      hi: "Sibling Dormant Accounts (P3) से overlap जब inactive account Domain Admin भी हो, और Kerberos leaves से जब Domain Admin kerberoastable हो — इनमें से कोई भी domain compromise तक short-circuit कर सकता है।",
    },
  },

  "Active Directory (AD) › DACL Abuse": {
    what: {
      en: "Misconfigured discretionary ACLs on AD objects grant a low-privileged principal control rights over a higher-privileged one — GenericAll, GenericWrite, WriteDacl, WriteOwner, AddMember, ForceChangePassword, or control of a group/GPO/OU. The attacker abuses the right to reset a target's password, add themselves to a privileged group, set an SPN for targeted Kerberoasting, or configure delegation, escalating without any exploit. The flaw is the permission grant itself.",
      simple: "Permissions on AD objects are set wrong, so a weak account has rights over a powerful one — like resetting its password or adding itself to an admin group. That's a direct privilege escalation, no exploit needed.",
      hi: "AD objects पर misconfigured DACLs एक low-privileged principal को higher-privileged पर control rights देते हैं — GenericAll, GenericWrite, WriteDacl, WriteOwner, AddMember, ForceChangePassword, या group/GPO/OU का control। Attacker इस right का दुरुपयोग करके target का password reset करता है, खुद को privileged group में जोड़ता है, targeted Kerberoasting के लिए SPN set करता है, या delegation configure करता है — बिना किसी exploit के escalate। दोष permission grant खुद है।",
    },
    find: [
      {
        title: { en: "Map abusable ACL edges with BloodHound", simple: "Use BloodHound to find permission paths to admin", hi: "BloodHound से abusable ACL edges map करना" },
        steps: [
          { en: "Collect with SharpHound and review BloodHound ACL edges (GenericAll, WriteDacl, WriteOwner, ForceChangePassword, AddSelf/AddMember) from your controlled principal toward privileged targets.", simple: "Run SharpHound and look at the permission edges from your account to admins.", hi: "SharpHound से collect करें और BloodHound ACL edges (GenericAll, WriteDacl, WriteOwner, ForceChangePassword, AddSelf/AddMember) अपने controlled principal से privileged targets की ओर review करें।" },
          { en: "Pick one edge and abuse it benignly in a lab/assumed-breach: e.g. with PowerView/Impacket set a temporary SPN on a user (targeted Kerberoast), or use WriteDacl to grant yourself a right, then revert.", simple: "Pick one permission and safely use it in a lab — e.g. set an SPN for a targeted Kerberoast — then undo it.", hi: "एक edge चुनें और lab/assumed-breach में benignly abuse करें: जैसे PowerView/Impacket से user पर temporary SPN set (targeted Kerberoast), या WriteDacl से खुद को right दें, फिर revert करें।" },
          { en: "Confirm the escalation (ticket, group membership, or password control over the target) and roll back all changes you made.", simple: "Confirm you escalated, then revert every change.", hi: "Escalation confirm करें (ticket, group membership, या target पर password control) और अपने सभी changes roll back करें।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the specific abusable ACE from your principal to a privileged target and a benign demonstration of the escalation it enables, with all changes reverted. Internal/pentest scope. It is N/A if the rights are legitimate/by-design, the edge does not actually reach anything privileged, or you only show the ACL without demonstrating abuse.",
      simple: "Show the exact bad permission from your account to a privileged target and safely prove it escalates, undoing your changes. Internal scope. Legitimate permissions are N/A.",
      hi: "Triage को चाहिए आपके principal से privileged target तक specific abusable ACE और उससे संभव escalation का benign demonstration, सभी changes reverted। Internal/pentest scope। अगर rights legitimate/by-design हैं, edge सच में privileged तक नहीं पहुँचता, या आप सिर्फ़ ACL दिखाते हैं, तो N/A।",
    },
    references: [
      { label: "HackTricks: ACL/DACL abuse", url: "https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/acl-persistence-abuse" },
    ],
  },

  "Active Directory (AD) › Misconfigured Active Directory Certificate Services (ADCS)": {
    what: {
      en: "AD Certificate Services is misconfigured so an attacker can obtain a certificate that authenticates as a higher-privileged principal. The classic ESC classes include ESC1 (template allows enrollee-supplied SAN + client-auth EKU), ESC8 (HTTP enrollment relayable via NTLM), and ESC6/4/3 variants. A certificate enrolled for a privileged account lets the attacker authenticate via PKINIT, bypassing passwords. The flaw is the vulnerable template/CA configuration.",
      simple: "The certificate service is set up so an attacker can request a certificate that acts as an admin, then log in with that certificate instead of a password. There are several known misconfig classes (ESC1, ESC8, etc.).",
      hi: "AD Certificate Services misconfigured है, तो attacker ऐसा certificate पा सकता है जो higher-privileged principal के रूप में authenticate करे। Classic ESC classes: ESC1 (template enrollee-supplied SAN + client-auth EKU allow करे), ESC8 (HTTP enrollment NTLM से relayable), और ESC6/4/3 variants। Privileged account के लिए enrolled certificate attacker को PKINIT से authenticate कराता है, passwords bypass करके। दोष vulnerable template/CA configuration है।",
    },
    find: [
      {
        title: { en: "Enumerate templates/CA with Certipy, abuse one ESC", simple: "Find a vulnerable certificate template and use it", hi: "Certipy से templates/CA enumerate करें, एक ESC abuse करें" },
        steps: [
          { en: "Run Certipy find (or Certify) with a domain credential to enumerate CAs and templates and flag vulnerable configs (ESC1-ESC8).", simple: "Use Certipy to list the certificate templates and flag the risky ones.", hi: "Domain credential के साथ Certipy find (या Certify) चलाकर CAs/templates enumerate करें और vulnerable configs (ESC1-ESC8) flag करें।" },
          { en: "For ESC1, request a certificate from the vulnerable template specifying a privileged account as the SAN; for ESC8, relay DC/machine NTLM (coerced via PetitPotam) to the web enrollment endpoint.", simple: "Abuse one class — e.g. request a cert naming an admin (ESC1), or relay NTLM to web enrollment (ESC8).", hi: "ESC1 के लिए vulnerable template से certificate request करें privileged account को SAN बताकर; ESC8 के लिए DC/machine NTLM (PetitPotam से coerced) web enrollment endpoint पर relay करें।" },
          { en: "Authenticate with the obtained certificate via PKINIT (Certipy auth) to prove it yields the privileged identity (TGT / NT hash), then stop in the lab.", simple: "Log in with the certificate to prove it gives admin access, then stop.", hi: "प्राप्त certificate से PKINIT (Certipy auth) से authenticate करके साबित करें कि यह privileged identity (TGT/NT hash) देता है, फिर lab में रुकें।" },
        ],
      },
    ],
    proof: {
      en: "Triage needs the vulnerable template/CA configuration (named ESC class), the certificate request abusing it, and benign proof it authenticates as a higher-privileged principal (PKINIT to a TGT). Internal/pentest scope; do not use the privileged access further. It is N/A if templates are hardened (no enrollee SAN, manager approval, restricted enrollment) or you cannot obtain an authenticating certificate.",
      simple: "Show the vulnerable template, your certificate request, and that the cert logs you in as an admin. Internal scope. Hardened templates are N/A.",
      hi: "Triage को चाहिए vulnerable template/CA configuration (ESC class नामित), उसे abuse करती certificate request, और benign proof कि यह higher-privileged principal के रूप में authenticate करता है (PKINIT से TGT)। Internal/pentest scope; privileged access आगे इस्तेमाल न करें। अगर templates hardened हैं, तो N/A।",
    },
    escalate: {
      en: "ESC8 chains with NTLM coercion the same way the Kerberos unconstrained-delegation path (P1) does; a certificate for a Domain Admin or DC is effectively domain compromise.",
      simple: "ESC8 uses the same NTLM coercion as the delegation path; a cert for a DC or admin means domain takeover.",
      hi: "ESC8 NTLM coercion के साथ वैसे ही chain करता है जैसे Kerberos unconstrained-delegation path (P1); Domain Admin/DC का certificate प्रभावी रूप से domain compromise है।",
    },
    references: [
      { label: "Certipy (ADCS) — GitHub", url: "https://github.com/ly4k/Certipy" },
      { label: "HackTricks: AD CS abuse", url: "https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/ad-certificates" },
    ],
  },

  "Active Directory (AD) › Sensitive Data Exposure › LDAP Anonymous Bind Enabled": {
    what: {
      en: "The domain's LDAP service permits anonymous (unauthenticated) binds, so anyone with network access can query the directory without credentials. An attacker enumerates users, groups, computers, SPNs, account flags (pre-auth disabled, delegation) and sometimes passwords left in attributes — a complete reconnaissance map of the domain and often a list of AS-REP/Kerberoast targets. The flaw is the directory answering unauthenticated queries.",
      simple: "The directory lets anyone query it without logging in, so an attacker on the network can pull out all users, groups and account settings for free — a full map for the next attack.",
      hi: "Domain का LDAP service anonymous (unauthenticated) binds की अनुमति देता है, तो network access वाला कोई भी बिना credentials directory query कर सकता है। Attacker users, groups, computers, SPNs, account flags (pre-auth disabled, delegation) और कभी attributes में छोड़े passwords enumerate करता है — domain का पूरा reconnaissance map और अक्सर AS-REP/Kerberoast targets की list। दोष: directory का unauthenticated queries जवाब देना।",
    },
    find: [
      {
        title: { en: "Query LDAP anonymously", simple: "Query the directory without credentials", hi: "LDAP anonymously query करना" },
        steps: [
          { en: "Attempt an anonymous bind against the DC's LDAP (389/636) with ldapsearch -x -b <baseDN> or windapsearch, with no credentials.", simple: "Try ldapsearch with no credentials against the domain controller.", hi: "DC के LDAP (389/636) पर anonymous bind की कोशिश करें ldapsearch -x -b <baseDN> या windapsearch से, बिना credentials।" },
          { en: "If it returns objects, enumerate users, groups, SPNs and interesting flags (DONT_REQ_PREAUTH, TRUSTED_FOR_DELEGATION), and scan attributes like description for secrets.", simple: "If it answers, pull users, groups, SPNs and flags, and check description fields.", hi: "अगर objects लौटें तो users, groups, SPNs और interesting flags (DONT_REQ_PREAUTH, TRUSTED_FOR_DELEGATION) enumerate करें, और description जैसे attributes में secrets scan करें।" },
          { en: "Record what unauthenticated access exposed; do not use any credentials you happen to find without separate authorisation.", simple: "Record what you got without logging in; don't use any found credentials.", hi: "रिकॉर्ड करें unauthenticated access ने क्या expose किया; जो भी credentials मिलें उन्हें बिना अलग authorisation इस्तेमाल न करें।" },
        ],
      },
    ],
    proof: {
      en: "Show a successful anonymous LDAP bind returning directory objects on an in-scope DC, and the sensitivity of what is exposed (user/group/attribute data). Internal/pentest scope. It is N/A if anonymous binds are refused (the default on modern AD), only the RootDSE is readable (that is expected), or the exposed data is non-sensitive.",
      simple: "Show an anonymous LDAP query returning real directory data on the target DC. Internal scope. If anonymous binds are refused or only the harmless RootDSE shows, it's N/A.",
      hi: "दिखाएं in-scope DC पर successful anonymous LDAP bind directory objects लौटाता है, और exposed data की sensitivity। Internal/pentest scope। अगर anonymous binds refuse होते हैं (modern AD का default), सिर्फ़ RootDSE readable है (expected), या data non-sensitive है, तो N/A।",
    },
    escalate: {
      en: "Sibling to Sensitive Data in Open File Shares (varies) in the Sensitive Data Exposure group; the enumeration here directly seeds AS-REP Roasting (P2) and Kerberoasting (P2) by revealing the vulnerable account flags and SPNs.",
      simple: "Related to the open-file-shares leaf; the data it leaks feeds AS-REP roasting and Kerberoasting.",
      hi: "Sensitive Data Exposure group में Sensitive Data in Open File Shares (varies) का sibling; यहाँ की enumeration vulnerable account flags और SPNs बताकर AS-REP Roasting (P2) और Kerberoasting (P2) को सीधे seed करती है।",
    },
  },

  "Active Directory (AD) › Sensitive Data Exposure › Sensitive Data in Open File Shares": {
    what: {
      en: "Network file shares (SMB) are readable by broad groups (Everyone, Authenticated Users, Domain Users) and contain sensitive data: credentials in scripts/config, password spreadsheets, private keys, backups, PST files, or deployment secrets. Any domain user — or sometimes an anonymous/guest session — can browse and read them, turning a low-privilege foothold into credentials and further access. The flaw is over-broad share/NTFS permissions on sensitive content.",
      simple: "File shares on the network are open to all users and hold sensitive stuff — passwords in scripts, key files, backups. Any ordinary user can read them and find credentials to go further.",
      hi: "Network file shares (SMB) broad groups (Everyone, Authenticated Users, Domain Users) द्वारा readable हैं और sensitive data रखते हैं: scripts/config में credentials, password spreadsheets, private keys, backups, PST, deployment secrets। कोई भी domain user — कभी anonymous/guest — इन्हें browse/read कर सकता है, low-privilege foothold को credentials और further access में बदलते हुए। दोष sensitive content पर over-broad share/NTFS permissions है।",
    },
    find: [
      {
        title: { en: "Enumerate shares and hunt sensitive files", simple: "List open shares and search them for secrets", hi: "Shares enumerate करें और sensitive files खोजें" },
        steps: [
          { en: "Enumerate accessible shares across hosts with NetExec/CrackMapExec (--shares) or Snaffler/spider_plus using a standard domain account.", simple: "List the shares you can read with NetExec or Snaffler.", hi: "NetExec/CrackMapExec (--shares) या Snaffler/spider_plus से standard domain account के साथ hosts भर में accessible shares enumerate करें।" },
          { en: "Search readable shares for secret-bearing files (unattend.xml, web.config, *.kdbx, *.ps1, backups, groups.xml) with tools like Snaffler that score findings.", simple: "Search the readable shares for files likely to hold passwords or keys.", hi: "Readable shares में secret-bearing files (unattend.xml, web.config, *.kdbx, *.ps1, backups, groups.xml) Snaffler जैसे tools से खोजें जो findings score करते हैं।" },
          { en: "Confirm the file is sensitive and readable by a low-privileged account; capture the ACL/evidence without exfiltrating real secrets in bulk.", simple: "Confirm a low-priv user can read a sensitive file, without copying it all out.", hi: "Confirm करें file sensitive है और low-privileged account द्वारा readable; ACL/evidence capture करें बिना real secrets bulk exfiltrate किए।" },
        ],
      },
    ],
    proof: {
      en: "Show the over-permissive share/NTFS ACL, the sensitive file readable by a low-privileged (or anonymous) principal, and why it matters (e.g. a working credential). Internal/pentest scope. Avoid bulk-copying real data. It is N/A if the share is correctly restricted, the content is non-sensitive, or access matches the user's legitimate entitlement.",
      simple: "Show the open share, a sensitive file a normal user can read, and why it matters. Internal scope. Properly restricted or non-sensitive shares are N/A.",
      hi: "दिखाएं over-permissive share/NTFS ACL, low-privileged (या anonymous) principal द्वारा readable sensitive file, और क्यों मायने रखता है (जैसे working credential)। Internal/pentest scope। real data bulk-copy न करें। अगर share सही restricted है, content non-sensitive है, या access legitimate entitlement से मेल खाता है, तो N/A।",
    },
    escalate: {
      en: "Sibling to LDAP Anonymous Bind Enabled (varies); a credential found in a share can feed Shared Administrator Passwords (P2) lateral movement, DACL Abuse, or the Kerberos chains toward domain compromise.",
      simple: "Related to the LDAP anonymous-bind leaf; a password found here can drive lateral movement and the Kerberos/DACL chains.",
      hi: "LDAP Anonymous Bind Enabled (varies) का sibling; share में मिला credential Shared Administrator Passwords (P2) lateral movement, DACL Abuse, या Kerberos chains को feed कर सकता है।",
    },
  },

  "Active Directory (AD) › SCCM Abuse › Automatic Device Approval Enabled": {
    what: {
      en: "Microsoft Configuration Manager (SCCM/MECM) is set to approve new clients automatically. An attacker can register a rogue device as a trusted SCCM client without an administrator vetting it, gaining a legitimate client identity in the hierarchy. From there they can read client policies and secrets meant for managed devices and position for further SCCM attacks. The flaw is removing the manual-approval gate on client enrollment.",
      simple: "SCCM is set to auto-approve any new computer that enrolls, so an attacker can join a fake machine as a trusted client and pull down policies and secrets meant for real devices.",
      hi: "Microsoft Configuration Manager (SCCM/MECM) new clients को automatically approve करने पर set है। Attacker बिना administrator vetting के rogue device को trusted SCCM client के रूप में register कर सकता है, hierarchy में legitimate client identity पा लेता है। वहाँ से managed devices के लिए बनी client policies/secrets पढ़ सकता है और further SCCM attacks के लिए position ले सकता है। दोष client enrollment पर manual-approval gate हटाना है।",
    },
    find: [
      {
        title: { en: "Register a rogue client, read what it unlocks", simple: "Enroll a fake client and see what it gets", hi: "Rogue client register करें, देखें क्या unlock होता है" },
        steps: [
          { en: "Enumerate the SCCM environment and approval settings with SharpSCCM or sccmhunter (site, management point, approval mode).", simple: "Map the SCCM setup and check if auto-approval is on.", hi: "SCCM environment और approval settings SharpSCCM या sccmhunter से enumerate करें (site, management point, approval mode)।" },
          { en: "Register a device record and confirm it is approved without admin action, obtaining a client identity in the hierarchy.", simple: "Enroll a device and confirm it gets approved automatically.", hi: "एक device record register करें और confirm करें यह बिना admin action approve होता है, hierarchy में client identity मिलती है।" },
          { en: "Use the client identity to request policies/secrets available to clients (e.g. policy that may carry a Network Access Account) — read-only, then stop.", simple: "Use the client identity to read client policies, read-only, then stop.", hi: "Client identity से clients को available policies/secrets request करें (जैसे policy जो Network Access Account ले जाए) — read-only, फिर रुकें।" },
        ],
      },
    ],
    proof: {
      en: "Show that a rogue/unapproved device is auto-approved as a trusted client and what that identity can then read (client policies/secrets). Internal/pentest scope. It is N/A if client approval requires manual vetting, enrollment is restricted, or you cannot register a client. Priority 'varies' with what the client identity exposes.",
      simple: "Show a fake device auto-approved and what it can read as a client. Internal scope. If approval is manual, it's N/A.",
      hi: "दिखाएं rogue/unapproved device trusted client के रूप में auto-approve होता है और वह identity फिर क्या पढ़ सकती है (client policies/secrets)। Internal/pentest scope। अगर client approval manual vetting माँगता है या enrollment restricted है, तो N/A। Priority 'varies' इस पर कि client identity क्या expose करती है।",
    },
    escalate: {
      en: "Part of the SCCM Abuse group; a rogue client identity is the foothold for the NTLM-relay siblings and for harvesting Network Access Account credentials (Privileged Credentials in Task Sequences, varies).",
      simple: "A rogue client is the starting point for the SCCM NTLM-relay and credential-harvesting leaves.",
      hi: "SCCM Abuse group का हिस्सा; rogue client identity NTLM-relay siblings और Network Access Account credentials harvest (Privileged Credentials in Task Sequences, varies) के लिए foothold है।",
    },
    references: [
      { label: "SharpSCCM — GitHub", url: "https://github.com/Mayyhem/SharpSCCM" },
    ],
  },

  "Active Directory (AD) › SCCM Abuse › Distribution Point Permits Anonymous Access": {
    what: {
      en: "An SCCM Distribution Point allows anonymous access to its content library over SMB/HTTP, so packages, applications and task-sequence content can be downloaded without authentication. Those packages frequently embed secrets — credentials in scripts, config files, or the content of task sequences — giving an unauthenticated attacker a path to credentials and insight into the environment. The flaw is anonymous read on content that was assumed private.",
      simple: "An SCCM distribution point lets anyone download its packages without logging in. Those packages often contain passwords in scripts or configs, handing secrets to an unauthenticated attacker.",
      hi: "SCCM Distribution Point अपनी content library तक SMB/HTTP पर anonymous access देता है, तो packages, applications और task-sequence content बिना authentication download हो सकते हैं। ये packages अक्सर secrets embed करते हैं — scripts/config में credentials, या task sequences का content — unauthenticated attacker को credentials और environment की जानकारी देते हुए। दोष: private माने content पर anonymous read।",
    },
    find: [
      {
        title: { en: "Pull DP content anonymously and scan for secrets", simple: "Download the packages without login, search for secrets", hi: "DP content anonymously pull करें, secrets scan करें" },
        steps: [
          { en: "Identify Distribution Points with sccmhunter/SharpSCCM and test anonymous access to the content shares (SMB SCCMContentLib$ / the HTTP DP) with no credentials.", simple: "Find the distribution points and try to read their content with no login.", hi: "Distribution Points sccmhunter/SharpSCCM से पहचानें और content shares (SMB SCCMContentLib$ / HTTP DP) तक anonymous access बिना credentials test करें।" },
          { en: "Download accessible packages/task-sequence content and search for embedded secrets (scripts, unattend/answer files, config with credentials).", simple: "Download what you can and search it for passwords.", hi: "Accessible packages/task-sequence content download करें और embedded secrets (scripts, unattend/answer files, credentials वाले config) खोजें।" },
          { en: "Confirm a secret is present and usable without authenticating to SCCM; do not use found credentials without separate authorisation.", simple: "Confirm a usable secret is there without logging in; don't use it further.", hi: "Confirm करें कोई secret मौजूद और usable है बिना SCCM authenticate किए; मिले credentials बिना अलग authorisation इस्तेमाल न करें।" },
        ],
      },
    ],
    proof: {
      en: "Show anonymous read of DP content on an in-scope environment and a sensitive secret recovered from a package (redacted). Internal/pentest scope. It is N/A if the DP requires authentication, content holds no secrets, or access matches legitimate entitlement. Priority 'varies' with the sensitivity of what the content exposes.",
      simple: "Show you read the distribution point's packages with no login and found a real secret inside. Internal scope. Authenticated DPs or empty packages are N/A.",
      hi: "दिखाएं in-scope environment पर DP content का anonymous read और package से recovered sensitive secret (redacted)। Internal/pentest scope। अगर DP authentication माँगता है, content में secrets नहीं, या access legitimate entitlement से मेल खाता है, तो N/A। Priority 'varies'।",
    },
    escalate: {
      en: "Sibling to the other SCCM Abuse leaves; secrets pulled here overlap Privileged Credentials Exposed in Task Sequences (varies), and the foothold supports the NTLM-relay chains.",
      simple: "Related to the other SCCM leaves; secrets here overlap the task-sequence credential leaf and support the relay chains.",
      hi: "अन्य SCCM Abuse leaves का sibling; यहाँ निकले secrets Privileged Credentials Exposed in Task Sequences (varies) से overlap करते हैं, और foothold NTLM-relay chains को support करता है।",
    },
    references: [
      { label: "sccmhunter — GitHub", url: "https://github.com/garrettfoster13/sccmhunter" },
    ],
  },

  "Active Directory (AD) › SCCM Abuse › Privileged Credentials Exposed In Task Sequences, Collection Variables or Network Access Account": {
    what: {
      en: "SCCM stores credentials in task sequences, collection variables or the Network Access Account (NAA) that can be retrieved by a client or an attacker with client-level access. The NAA and task-sequence secrets are often domain accounts with meaningful privilege, and they are recoverable by requesting and decrypting client policy (the NAA blob is protected by DPAPI keys available to the client). Recovering them hands the attacker real domain credentials.",
      simple: "SCCM keeps domain passwords in task sequences, collection variables and the Network Access Account. A machine (or attacker acting as a client) can fetch and decrypt them, getting real domain credentials.",
      hi: "SCCM task sequences, collection variables या Network Access Account (NAA) में credentials रखता है जिन्हें client या client-level access वाला attacker retrieve कर सकता है। NAA और task-sequence secrets अक्सर meaningful privilege वाले domain accounts होते हैं, और client policy request करके decrypt किए जा सकते हैं (NAA blob client को available DPAPI keys से protected होता है)। इन्हें recover करना attacker को real domain credentials देता है।",
    },
    find: [
      {
        title: { en: "Request and decrypt client policy secrets", simple: "Pull the NAA / task-sequence credentials as a client", hi: "Client policy secrets request और decrypt करना" },
        steps: [
          { en: "With a client identity (legitimate test client or a rogue one from auto-approval), request the machine/client policy that carries the NAA and task-sequence secrets.", simple: "As an SCCM client, request the policy that holds the NAA secrets.", hi: "Client identity (legitimate test client या auto-approval से rogue) के साथ वह machine/client policy request करें जो NAA और task-sequence secrets ले जाती है।" },
          { en: "Decrypt the retrieved NAA/variable blobs with SharpSCCM (get secrets) or equivalent to recover the plaintext credentials.", simple: "Decrypt the retrieved blobs with SharpSCCM to get the passwords.", hi: "Retrieved NAA/variable blobs SharpSCCM (get secrets) या equivalent से decrypt करके plaintext credentials recover करें।" },
          { en: "Validate the recovered account benignly (identity/whoami) to prove it is a live domain credential — then stop, do not use its privilege.", simple: "Do one safe check that the recovered account is real, then stop.", hi: "Recovered account को benignly validate करें (identity/whoami) ताकि live domain credential साबित हो — फिर रुकें, privilege इस्तेमाल न करें।" },
        ],
      },
    ],
    proof: {
      en: "Show the retrieval of SCCM client policy and recovery of a plaintext NAA/task-sequence/collection credential (redacted), with a benign check it is a valid domain account. Internal/pentest scope. It is N/A if no such credentials are configured, they are already least-privilege/rotated and useless, or you cannot obtain client policy.",
      simple: "Show you pulled and decrypted a real domain password from SCCM policy, with a safe check it works. Internal scope. If none are stored, it's N/A.",
      hi: "दिखाएं SCCM client policy की retrieval और plaintext NAA/task-sequence/collection credential की recovery (redacted), benign check के साथ कि यह valid domain account है। Internal/pentest scope। अगर ऐसे credentials configured नहीं, already least-privilege/rotated/useless हैं, या client policy नहीं मिल सकती, तो N/A।",
    },
    escalate: {
      en: "The NAA is historically over-privileged; a recovered domain account feeds Shared Administrator Passwords (P2) lateral movement and the Kerberos/DACL chains. The sibling relay leaves provide alternative paths to the same site secrets.",
      simple: "A recovered NAA account drives lateral movement and the Kerberos/DACL chains; the relay leaves reach the same secrets another way.",
      hi: "NAA historically over-privileged होता है; recovered domain account Shared Administrator Passwords (P2) lateral movement और Kerberos/DACL chains को feed करता है। Sibling relay leaves उन्हीं site secrets तक वैकल्पिक path देते हैं।",
    },
    references: [
      { label: "SharpSCCM — GitHub", url: "https://github.com/Mayyhem/SharpSCCM" },
    ],
  },

  "Active Directory (AD) › SCCM Abuse › PXE Boot Media Theft": {
    what: {
      en: "A PXE-enabled SCCM Distribution Point serves OS deployment boot media over the network, optionally password-protected. An attacker on the network requests a PXE boot, obtains the boot image and its variables/policy, and (if the PXE password is weak or absent) extracts the embedded media-variables file whose secrets — including domain-joining and task-sequence credentials — can be decrypted offline. The flaw is unauthenticated/weakly-protected PXE media exposing deployment secrets.",
      simple: "A PXE boot server for installing Windows hands out its boot image to anyone on the network. If it's not well password-protected, the image contains deployment secrets (including domain credentials) that can be cracked offline.",
      hi: "PXE-enabled SCCM Distribution Point network पर OS deployment boot media serve करता है, कभी password-protected। Network पर attacker PXE boot request करता है, boot image और उसके variables/policy पाता है, और (अगर PXE password weak/absent) embedded media-variables file extract करता है जिसके secrets — domain-joining और task-sequence credentials सहित — offline decrypt हो सकते हैं। दोष: unauthenticated/weakly-protected PXE media deployment secrets expose करता है।",
    },
    find: [
      {
        title: { en: "Request PXE media, extract and crack its secrets", simple: "Grab the PXE boot image and crack its secrets", hi: "PXE media request करें, secrets extract और crack करें" },
        steps: [
          { en: "Identify PXE-enabled DPs and request a PXE boot / download the boot media over TFTP/HTTP using PXEThief or sccmhunter.", simple: "Find the PXE server and download its boot media with PXEThief.", hi: "PXE-enabled DPs पहचानें और PXEThief या sccmhunter से TFTP/HTTP पर PXE boot request / boot media download करें।" },
          { en: "Extract the media-variables blob and, if a PXE password is set, crack it offline (hashcat) to unlock the variables.", simple: "Pull the variables file and crack the PXE password offline if needed.", hi: "Media-variables blob extract करें और PXE password set हो तो उसे offline crack (hashcat) करके variables unlock करें।" },
          { en: "Decrypt the recovered variables to expose embedded credentials; validate one benignly and stop.", simple: "Decrypt the variables to reveal credentials, confirm one works, then stop.", hi: "Recovered variables decrypt करके embedded credentials expose करें; एक को benignly validate करें और रुकें।" },
        ],
      },
    ],
    proof: {
      en: "Show PXE media obtained from an in-scope DP and credentials/secrets recovered from it (redacted), noting whether a PXE password existed and how it was defeated. Internal/pentest scope. It is N/A if PXE is not exposed, a strong PXE password resists cracking, or no secrets are embedded. The AC:H reflects the network positioning/cracking effort.",
      simple: "Show you grabbed the PXE boot media and pulled real secrets from it. Internal scope. A strong PXE password or no exposed PXE is N/A.",
      hi: "दिखाएं in-scope DP से PXE media मिला और उससे recovered credentials/secrets (redacted), नोट करें PXE password था या नहीं और कैसे defeat हुआ। Internal/pentest scope। अगर PXE exposed नहीं, strong PXE password crack नहीं होता, या secrets embedded नहीं, तो N/A। AC:H network positioning/cracking effort दर्शाता है।",
    },
    escalate: {
      en: "Secrets from PXE media overlap Privileged Credentials in Task Sequences (varies); recovered domain credentials can then drive lateral movement and the broader AD compromise chains.",
      simple: "PXE secrets overlap the task-sequence credential leaf and can lead to lateral movement and domain compromise.",
      hi: "PXE media के secrets Privileged Credentials in Task Sequences (varies) से overlap करते हैं; recovered domain credentials फिर lateral movement और व्यापक AD compromise chains चला सकते हैं।",
    },
    references: [
      { label: "PXEThief — GitHub", url: "https://github.com/MWR-CyberSec/PXEThief" },
    ],
  },

  "Active Directory (AD) › SCCM Abuse › NTLM Relay From Management Point to Site Database": {
    what: {
      en: "An attacker coerces the SCCM Management Point's machine account to authenticate over NTLM and relays that authentication to the site database (MSSQL). Because the MP account has rights on the site DB, the relayed session can read or modify SCCM data — including adding a device to a privileged collection or extracting secrets — effectively taking control of the SCCM hierarchy. The flaw is NTLM relay not being blocked (no EPA/signing) to the SQL back end.",
      simple: "The attacker forces the SCCM management server to log in over NTLM and relays that login to the SCCM database, which trusts it. That lets them read or change SCCM data and take over the hierarchy.",
      hi: "Attacker SCCM Management Point के machine account को NTLM पर authenticate करने के लिए coerce करता है और उस authentication को site database (MSSQL) पर relay करता है। चूँकि MP account का site DB पर rights है, relayed session SCCM data पढ़/बदल सकता है — किसी device को privileged collection में जोड़ना या secrets निकालना — प्रभावी रूप से SCCM hierarchy पर control। दोष: SQL back end तक NTLM relay block न होना (no EPA/signing)।",
    },
    find: [
      {
        title: { en: "Coerce the MP and relay to the site DB", simple: "Force MP login, relay it to the SCCM database", hi: "MP को coerce करके site DB पर relay करना" },
        steps: [
          { en: "Map the MP and site DB with sccmhunter/SharpSCCM and confirm SMB signing / EPA posture on the SQL target.", simple: "Find the management point and database and check if relay protections are off.", hi: "MP और site DB sccmhunter/SharpSCCM से map करें और SQL target पर SMB signing/EPA posture confirm करें।" },
          { en: "Set up ntlmrelayx targeting the MSSQL site DB, then coerce the MP machine account to authenticate (SCCM-specific coercion or PetitPotam/Coercer).", simple: "Run ntlmrelayx at the database and coerce the MP to authenticate.", hi: "ntlmrelayx को MSSQL site DB पर target करें, फिर MP machine account को authenticate करने के लिए coerce करें (SCCM-specific coercion या PetitPotam/Coercer)।" },
          { en: "Via the relayed SQL session, perform a benign, reversible proof (read a non-sensitive row, or in a lab add then remove a device from a collection) — stop at proof.", simple: "Use the relayed database session for one safe, reversible action, then stop.", hi: "Relayed SQL session से benign, reversible proof करें (non-sensitive row पढ़ें, या lab में device collection में जोड़कर हटाएं) — proof पर रुकें।" },
        ],
      },
    ],
    proof: {
      en: "Show the relay succeeding (MP account authenticated to the site DB) and a benign, reversible action proving control, with evidence that signing/EPA was not enforced. Internal/pentest scope; make no persistent changes. It is N/A if SMB signing/EPA blocks the relay, the MP cannot be coerced, or the DB rejects the relayed session.",
      simple: "Show the management point's login relayed into the database and one safe, reversible action proving control. Internal scope. If signing/EPA blocks it, N/A.",
      hi: "दिखाएं relay सफल (MP account site DB पर authenticated) और benign, reversible action जो control साबित करे, साथ ही signing/EPA enforce न होने का evidence। Internal/pentest scope; persistent changes न करें। अगर SMB signing/EPA relay रोकता है, MP coerce नहीं होता, या DB relayed session reject करता है, तो N/A।",
    },
    escalate: {
      en: "One of three NTLM-relay siblings (to Site Systems, and via Automatic Client Push); control of the site DB is near-total SCCM compromise, which can be leveraged to deploy code to managed hosts.",
      simple: "One of the SCCM relay leaves; owning the site database is near-total SCCM control.",
      hi: "तीन NTLM-relay siblings में से एक (Site Systems तक, और Automatic Client Push के through); site DB का control लगभग पूर्ण SCCM compromise है, जिसे managed hosts पर code deploy करने के लिए leverage किया जा सकता है।",
    },
    references: [
      { label: "sccmhunter — GitHub", url: "https://github.com/garrettfoster13/sccmhunter" },
    ],
  },

  "Active Directory (AD) › SCCM Abuse › NTLM Relay From Site Server To Site Systems": {
    what: {
      en: "The SCCM site server's machine account is coerced into authenticating over NTLM and relayed to other site systems (a management point, SMS Provider, or SQL) on which it holds administrative rights. Because the site server is highly privileged across the hierarchy, relaying its authentication grants the attacker administrative control of those systems. The flaw is unsigned/relayable NTLM from a tier-0-equivalent SCCM account.",
      simple: "The attacker forces the SCCM site server (a very powerful account) to log in over NTLM and relays it to other SCCM systems it administers, gaining admin control of them.",
      hi: "SCCM site server के machine account को NTLM पर authenticate करने के लिए coerce किया जाता है और उन other site systems (management point, SMS Provider, या SQL) पर relay किया जाता है जिन पर उसके administrative rights हैं। चूँकि site server hierarchy भर में highly privileged है, उसकी authentication relay करना attacker को उन systems का administrative control देता है। दोष: tier-0-equivalent SCCM account से unsigned/relayable NTLM।",
    },
    find: [
      {
        title: { en: "Coerce the site server, relay to a site system", simple: "Force site-server login, relay it to a site system", hi: "Site server को coerce करके site system पर relay करना" },
        steps: [
          { en: "Identify the site server and the site systems it administers (sccmhunter/SharpSCCM) and confirm relay protections (signing/EPA) are missing on a chosen target.", simple: "Map the site server and its systems and check relay protections are off.", hi: "Site server और उसके administered site systems पहचानें (sccmhunter/SharpSCCM) और chosen target पर relay protections (signing/EPA) missing confirm करें।" },
          { en: "Run ntlmrelayx at the target site system and coerce the site server machine account to authenticate (PetitPotam/Coercer or an SCCM-specific trigger).", simple: "Run ntlmrelayx at the target and coerce the site server to authenticate.", hi: "ntlmrelayx को target site system पर चलाएं और site server machine account को authenticate करने के लिए coerce करें (PetitPotam/Coercer या SCCM-specific trigger)।" },
          { en: "Prove admin access on the relayed target with a benign action (list admins / read a non-sensitive resource), then stop.", simple: "Prove admin on the target with one harmless action, then stop.", hi: "Relayed target पर admin access benign action (admins list / non-sensitive resource पढ़ना) से साबित करें, फिर रुकें।" },
        ],
      },
    ],
    proof: {
      en: "Show the site-server account's authentication relayed to a site system and a benign demonstration of the admin access gained, with evidence signing/EPA was not enforced. Internal/pentest scope; no persistent change. It is N/A if relay is blocked by signing/EPA, the site server cannot be coerced, or the target does not grant the relayed account admin rights.",
      simple: "Show the site server's login relayed to another SCCM system and a safe proof of admin there. Internal scope. If signing/EPA blocks it, N/A.",
      hi: "दिखाएं site-server account की authentication site system पर relayed और gained admin access का benign demonstration, signing/EPA enforce न होने के evidence के साथ। Internal/pentest scope; persistent change नहीं। अगर relay signing/EPA से blocked है, site server coerce नहीं होता, या target relayed account को admin rights नहीं देता, तो N/A।",
    },
    escalate: {
      en: "Sibling to the MP-to-Site-DB and Client-Push relay leaves; chaining site-system control typically yields full hierarchy compromise and the ability to push code to managed clients.",
      simple: "One of the SCCM relay leaves; chaining them usually gives full SCCM control and code-push to clients.",
      hi: "MP-to-Site-DB और Client-Push relay leaves का sibling; site-system control chain करने से आमतौर पर full hierarchy compromise और managed clients पर code push क्षमता मिलती है।",
    },
    references: [
      { label: "sccmhunter — GitHub", url: "https://github.com/garrettfoster13/sccmhunter" },
    ],
  },

  "Active Directory (AD) › SCCM Abuse › NTLM Relay Via Automatic Client Push Installation": {
    what: {
      en: "When SCMM Automatic Client Push Installation is enabled, the site server reaches out and authenticates to hosts to install the client — often with a privileged push-installation account and over NTLM. An attacker triggers a push toward a host they control (or a relay listener), captures/relays that authentication, and gains the push account's privileges or relays onward. If the push account is a local admin across the fleet (common), this is broad compromise. The flaw is privileged, relayable push authentication.",
      simple: "With SCCM auto client-push on, the site server logs into machines to install the client using a powerful account. An attacker makes it push to a machine they control, catches that login, and relays it to gain the push account's wide access.",
      hi: "जब SCCM Automatic Client Push Installation enabled है, site server client install करने के लिए hosts तक पहुँचकर authenticate करता है — अक्सर privileged push-installation account से और NTLM पर। Attacker अपने control वाले host (या relay listener) की ओर push trigger करता है, उस authentication को capture/relay करता है, और push account के privileges पाता है या आगे relay करता है। अगर push account fleet भर में local admin है (आम), तो यह broad compromise है। दोष: privileged, relayable push authentication।",
    },
    find: [
      {
        title: { en: "Trigger a client push, capture/relay the auth", simple: "Make SCCM push to you and relay its login", hi: "Client push trigger करें, auth capture/relay करें" },
        steps: [
          { en: "Confirm Automatic Client Push is enabled and identify the push account posture with sccmhunter/SharpSCCM; check whether NTLM signing/EPA protects potential relay targets.", simple: "Confirm auto client-push is on and check relay protections.", hi: "Automatic Client Push enabled confirm करें और push account posture sccmhunter/SharpSCCM से पहचानें; जाँचें NTLM signing/EPA potential relay targets को protect करता है या नहीं।" },
          { en: "Trigger a push toward a host/listener you control and capture the push account's NTLM authentication (relay it with ntlmrelayx to a target lacking signing, or crack if NTLMv2 is captured).", simple: "Make SCCM try to install on your listener and relay or capture that login.", hi: "अपने control वाले host/listener की ओर push trigger करें और push account की NTLM authentication capture करें (signing न होने वाले target पर ntlmrelayx से relay करें, या NTLMv2 capture हो तो crack करें)।" },
          { en: "Prove the push account's privilege via a benign relayed/authenticated action (identity/whoami or admin check on one host), then stop.", simple: "Prove the push account's access with one safe check, then stop.", hi: "Push account के privilege को benign relayed/authenticated action (identity/whoami या एक host पर admin check) से साबित करें, फिर रुकें।" },
        ],
      },
    ],
    proof: {
      en: "Show Automatic Client Push triggering an authentication from the push account to your controlled endpoint and a benign demonstration of the privilege obtained (relayed admin or, if captured, the cracked account). Internal/pentest scope. It is N/A if client push is disabled, the push account is least-privilege, or signing/EPA blocks the relay. This leaf's A:H reflects the fleet-wide admin a push account often holds.",
      simple: "Show SCCM pushing a login to your endpoint and a safe proof of the access that login grants. Internal scope. Disabled push or a least-privilege push account is N/A.",
      hi: "दिखाएं Automatic Client Push आपके controlled endpoint पर push account से authentication trigger करता है और obtained privilege का benign demonstration (relayed admin या captured होने पर cracked account)। Internal/pentest scope। अगर client push disabled है, push account least-privilege है, या signing/EPA relay रोकता है, तो N/A। A:H वह fleet-wide admin दर्शाता है जो push account अक्सर रखता है।",
    },
    escalate: {
      en: "Sibling to the MP-to-Site-DB and Site-Server relay leaves; a push account that is local admin fleet-wide turns this into mass lateral movement and effective domain-wide compromise.",
      simple: "One of the SCCM relay leaves; a fleet-wide-admin push account means mass lateral movement.",
      hi: "MP-to-Site-DB और Site-Server relay leaves का sibling; fleet भर में local admin वाला push account इसे mass lateral movement और प्रभावी domain-wide compromise बना देता है।",
    },
    references: [
      { label: "SharpSCCM — GitHub", url: "https://github.com/Mayyhem/SharpSCCM" },
    ],
  },

  "Active Directory (AD) › Configuration Weaknesses › Passwords Found within Domain User Account Description": {
    what: {
      en: "Cleartext (or lightly obfuscated) passwords are written into the description, info or other free-text attributes of domain user/computer objects. Because these attributes are readable by any authenticated user (and sometimes anonymously), anyone can harvest working credentials straight from the directory. It is a direct credential disclosure with no exploitation — just reading an attribute that administrators used as a convenience note.",
      simple: "Someone wrote a password into the 'description' field of a user account. Any logged-in user can read that field, so the password is just sitting there for anyone to grab.",
      hi: "Cleartext (या हल्के obfuscated) passwords domain user/computer objects के description, info या अन्य free-text attributes में लिखे होते हैं। चूँकि ये attributes किसी भी authenticated user (कभी anonymously) द्वारा readable हैं, कोई भी directory से working credentials harvest कर सकता है। यह बिना exploitation सीधा credential disclosure है — बस वह attribute पढ़ना जिसे admins ने convenience note बनाया।",
    },
    find: [
      {
        title: { en: "Search directory attributes for passwords", simple: "Search account description fields for passwords", hi: "Directory attributes में passwords खोजना" },
        steps: [
          { en: "Query all users/computers and dump the description, info, comment and userPassword-style attributes with PowerView (Get-DomainUser -Properties description), ldapsearch or BloodHound.", simple: "Pull the description/info fields of all accounts with PowerView or ldapsearch.", hi: "सभी users/computers query करें और description, info, comment, userPassword-style attributes PowerView (Get-DomainUser -Properties description), ldapsearch या BloodHound से dump करें।" },
          { en: "Grep the results for password-like strings and phrases ('pwd', 'pass', 'temp', seasonal patterns).", simple: "Search the results for anything that looks like a password.", hi: "Results में password-like strings और phrases ('pwd', 'pass', 'temp', seasonal patterns) grep करें।" },
          { en: "Validate one found credential benignly (identity/whoami) to prove it is live, then stop — do not use its access.", simple: "Check one found password works with a harmless login test, then stop.", hi: "एक मिले credential को benignly validate करें (identity/whoami) ताकि live साबित हो, फिर रुकें — access इस्तेमाल न करें।" },
        ],
      },
    ],
    proof: {
      en: "Show the directory attribute containing the credential and a benign check that it authenticates (redact the password). Internal/pentest scope. It is N/A if no real credential is present, the value is stale/disabled, or it is a non-credential note. Priority 'varies' with the privilege of the account whose password was exposed.",
      simple: "Show the password sitting in the account's description field and that it actually works (redacted). Internal scope. Stale or non-password notes are N/A.",
      hi: "दिखाएं credential रखने वाला directory attribute और benign check कि यह authenticate करता है (password redact करें)। Internal/pentest scope। अगर कोई real credential नहीं, value stale/disabled है, या यह non-credential note है, तो N/A। Priority 'varies' उस account के privilege से जिसका password exposed हुआ।",
    },
    escalate: {
      en: "Shares the Configuration Weaknesses group with Shared Administrator Passwords (P2) and others; a privileged account exposed here feeds lateral movement and the domain-compromise chains directly. It is also often discovered via LDAP Anonymous Bind (varies).",
      simple: "A privileged password found here feeds lateral movement and domain takeover; LDAP anonymous bind often surfaces it.",
      hi: "Configuration Weaknesses group में Shared Administrator Passwords (P2) आदि के साथ; यहाँ exposed privileged account lateral movement और domain-compromise chains को सीधे feed करता है। यह अक्सर LDAP Anonymous Bind (varies) से भी discover होता है।",
    },
  },
  // __APPEND__
};
