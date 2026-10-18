import type { TopicContent } from "@/learn/data/types";

// Per-leaf trilingual lesson content, keyed by FULL Bugcrowd VRT path.
export const cryptoTopics: Record<string, TopicContent> = {
  "Cryptographic Weakness › Key Reuse › Inter-Environment": {
    what: {
      en: "The same key material (a TLS private key, a JWT/token signing key, an app encryption key, an SSH host key) is shared across separate environments or tenants — dev, staging and production, or one customer and another. Because lower-trust environments leak far more easily (debug builds, shared CI, looser access), one leak compromises them all: an attacker who pulls the key from staging can decrypt or forge in production. P2 reflects that a single lower-value compromise breaks the crown-jewel environment.",
      simple: "The same secret key is used in more than one place, like test and live, or between customers. Test systems leak more easily, so stealing the key there lets an attacker break the live system too.",
      hi: "एक ही key material (TLS private key, token signing key, app encryption key, SSH host key) कई environments या tenants में share हो रही है — dev, staging और production, या एक customer से दूसरे में। Lower-trust environment आसानी से leak होता है, तो वहाँ से key चुराकर attacker production में decrypt या forge कर सकता है। इसलिए यह P2 है।",
    },
    find: [
      {
        title: { en: "Compare key fingerprints across environments", simple: "Match keys between environments", hi: "Environments के बीच key fingerprints मिलाएँ" },
        steps: [
          { en: "Collect the public half of each key you can see per environment: TLS cert public key (openssl s_client), the JWT signing key via the /.well-known/jwks.json or the kid, and SSH host keys.", simple: "Grab each environment's public key: TLS cert, JWT signing key from JWKS, SSH host key.", hi: "हर environment की public key लें: TLS cert public key (openssl s_client), JWKS से JWT signing key, और SSH host keys।" },
          { en: "Compare fingerprints/modulus between staging and production — identical values prove the private key is shared.", simple: "Compare the fingerprints between test and live. If they match, the private key is shared.", hi: "Staging और production के fingerprints/modulus मिलाएँ — एक जैसे होना मतलब private key shared है।" },
          { en: "Hunt leaked secrets in the weaker environment (git history, CI logs, mobile app bundles, exposed .env) and test whether that key is accepted by production.", simple: "Look for the key leaked in the weaker environment, then test it against live.", hi: "Weaker environment में leaked secrets ढूंढें (git history, CI logs, mobile bundles, .env) और test करें कि वो key production में चलती है या नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Show the same private key is used in both environments (matching public key/modulus/fingerprint or the same kid) AND that a key obtainable from the lower-trust environment validates or decrypts in production. Matching public keys alone (public keys are meant to be shared) or environments that merely look similar but use different keys are N/A.",
      simple: "Prove the same private key runs in both places and that the copy from the weaker environment works on live. Just matching public keys is not enough.",
      hi: "दिखाएँ कि एक ही private key दोनों environments में है (matching public key/modulus/fingerprint या same kid) और lower-trust environment से मिली key production में काम करती है। सिर्फ़ matching public keys या बस similar दिखने वाले environments N/A हैं।",
    },
    escalate: {
      en: "Reuse confined to one environment is the Intra-Environment leaf (P5); a static key exchange that also lacks forward secrecy maps to Lack of Perfect Forward Secrecy (P4).",
      simple: "If the reuse stays inside one environment it is the P5 Intra-Environment leaf; missing forward secrecy is a separate P4 leaf.",
      hi: "अगर reuse एक ही environment तक सीमित है तो वो Intra-Environment leaf (P5) है; forward secrecy की कमी अलग Lack of Perfect Forward Secrecy (P4) leaf है।",
    },
  },

  "Cryptographic Weakness › Insecure Key Generation › Insufficient Key Space": {
    what: {
      en: "A key is drawn from a space too small to resist exhaustive search, so an attacker enumerates every possible key offline. Classic cases: 56-bit DES or 2-key 3DES (~112-bit effective but with known weaknesses), RSA/DH moduli below 2048 bits, EC keys below ~224 bits, or symmetric keys derived from a short input like a 4-digit PIN. The algorithm may be sound; the problem is the effective key length is below the modern ~112–128-bit floor.",
      simple: "The key is chosen from too few possibilities, so an attacker can just try them all. Examples: 56-bit DES, RSA keys under 2048 bits, or a key made from a 4-digit PIN.",
      hi: "Key इतने छोटे space से चुनी जाती है कि attacker सारी keys offline आज़मा ले। Classic cases: 56-bit DES, 2048 bits से छोटी RSA/DH, ~224 bits से छोटी EC, या 4-digit PIN जैसे छोटे input से बनी symmetric key। Algorithm ठीक हो सकता है पर effective key length modern ~112–128-bit floor से नीचे है।",
    },
    find: [
      {
        title: { en: "Identify algorithm and effective key length", simple: "Check the algorithm and key length", hi: "Algorithm और effective key length पहचानें" },
        steps: [
          { en: "Read the key length from the TLS handshake (testssl.sh, sslscan), the JWT/token header, cert details, or the API docs; flag DES/3DES, RSA/DH < 2048, EC < 224.", simple: "Find the key length from TLS, the token, or the cert; flag DES, RSA under 2048, small EC.", hi: "Key length TLS handshake (testssl.sh, sslscan), JWT header, cert, या docs से पढ़ें; DES/3DES, RSA/DH < 2048, EC < 224 flag करें।" },
          { en: "If the key is derived from user input (PIN, short password, short token), estimate the real entropy of that input, not the output length.", simple: "If the key comes from a PIN or short password, measure how many real guesses it takes.", hi: "अगर key किसी input (PIN, छोटा password) से बनती है तो उस input की असली entropy नापें, output length नहीं।" },
          { en: "Where feasible on your own test key, demonstrate the search is practical (e.g. recovering a <= ~40-bit derived key).", simple: "On your own test key, show the search is actually doable.", hi: "अपनी test key पर, जहाँ मुमकिन हो, दिखाएँ कि search practical है (जैसे <= ~40-bit derived key निकालना)।" },
        ],
      },
    ],
    proof: {
      en: "State the exact algorithm and effective key length and that it is below the modern threshold; a working offline recovery of a test key is the strongest evidence. Adequate key lengths (AES-128+, RSA-2048+, EC-256+) are N/A, as is a short key protecting nothing sensitive.",
      simple: "Show the exact weak algorithm and length, and ideally crack a test key. Normal strong keys are N/A.",
      hi: "सही algorithm और effective key length बताएँ और दिखाएँ कि वो modern threshold से नीचे है; test key का offline recovery सबसे मज़बूत सबूत है। AES-128+, RSA-2048+, EC-256+ N/A हैं।",
    },
  },

  "Cryptographic Weakness › Broken Cryptography › Use of Broken Cryptographic Primitive": {
    what: {
      en: "A primitive that is known to be broken is used where it must provide a real guarantee: MD5 or SHA-1 for signatures, DES/RC4 for confidentiality, raw ECB mode (identical plaintext blocks leak as identical ciphertext blocks), or textbook RSA with no OAEP/PSS padding. The construction gives essentially none of the security it implies, independent of key length.",
      simple: "The system uses an algorithm already proven broken — like MD5/SHA-1 signatures, DES, RC4, or ECB mode — where real protection is needed. It does not actually protect the data.",
      hi: "कोई ऐसा primitive इस्तेमाल हो रहा है जो known-broken है, जहाँ असली guarantee चाहिए: signatures के लिए MD5/SHA-1, confidentiality के लिए DES/RC4, raw ECB mode (एक जैसे plaintext blocks एक जैसे ciphertext बनाते हैं), या बिना OAEP/PSS padding के textbook RSA। Key length चाहे जो हो, यह कोई असली सुरक्षा नहीं देता।",
    },
    find: [
      {
        title: { en: "Fingerprint the primitive on each boundary", simple: "Identify the algorithm used", hi: "हर boundary पर primitive पहचानें" },
        steps: [
          { en: "Enumerate TLS ciphersuites with testssl.sh/sslscan and read JWT/token alg headers; flag RC4, DES/3DES, MD5/SHA-1 signatures, export suites.", simple: "List TLS ciphers and read token algorithms; flag RC4, DES, MD5/SHA-1.", hi: "testssl.sh/sslscan से TLS ciphersuites और JWT alg headers पढ़ें; RC4, DES/3DES, MD5/SHA-1 signatures, export suites flag करें।" },
          { en: "Inspect encrypted cookies/tokens for ECB: identical 16-byte ciphertext blocks repeating for repeated plaintext is the tell.", simple: "Check encrypted cookies for repeating 16-byte blocks — a sign of ECB.", hi: "Encrypted cookies/tokens में ECB देखें: repeated plaintext पर एक जैसे 16-byte ciphertext blocks दोहराना इसकी निशानी है।" },
          { en: "Identify hash use by length (32 hex = MD5, 40 = SHA-1) and where it backs a signature or integrity check.", simple: "Spot MD5 (32 hex) or SHA-1 (40 hex) used for signatures or integrity.", hi: "Hash length से पहचानें (32 hex = MD5, 40 = SHA-1) और देखें कि कहाँ signature/integrity के लिए है।" },
        ],
      },
    ],
    proof: {
      en: "Name the broken primitive and the security boundary it guards, and where feasible show a concrete break (ECB block shuffling that reorders plaintext, an RC4 keystream bias, a relevant collision). A weak primitive used only as a non-security checksum or cache key (e.g. MD5 as an ETag) is N/A.",
      simple: "Name the broken algorithm and where it is relied on, and ideally show the break in action. MD5 used only as a cache key is N/A.",
      hi: "Broken primitive और वो security boundary बताएँ जिसे यह guard करता है, और जहाँ मुमकिन हो concrete break दिखाएँ (ECB block shuffling, RC4 keystream bias, relevant collision)। सिर्फ़ non-security checksum/cache key के रूप में MD5 N/A है।",
    },
  },

  "Cryptographic Weakness › Insufficient Verification of Data Authenticity › Integrity Check Value (ICV)": {
    what: {
      en: "Data authenticity is checked with an integrity-check value that an attacker can satisfy: an unkeyed checksum (CRC32, a plain hash) treated as tamper protection, a MAC that is never actually verified, or a MAC that covers only part of the message. Since a CRC/hash needs no secret, the attacker edits the payload and recomputes the ICV; a tampered message is accepted as authentic.",
      simple: "A message is 'protected' by a checksum the attacker can also compute (like a CRC or plain hash), or a MAC that is not really checked. So they change the data, fix the checksum, and it is accepted.",
      hi: "Data authenticity एक ऐसे integrity-check value से check होती है जिसे attacker भी बना सकता है: unkeyed checksum (CRC32, plain hash) को tamper protection मान लेना, कभी verify न होने वाला MAC, या सिर्फ़ message के हिस्से को cover करने वाला MAC। CRC/hash को secret नहीं चाहिए, तो attacker payload बदलकर ICV दोबारा compute कर देता है और tampered message accept हो जाता है।",
    },
    find: [
      {
        title: { en: "Tamper the payload and the check value", simple: "Change the data and its checksum", hi: "Payload और check value दोनों बदलें" },
        steps: [
          { en: "Locate a message/token carrying a separate checksum or MAC field (a licence blob, a signed cookie, a webhook body).", simple: "Find a message with a separate checksum or MAC field.", hi: "ऐसा message/token ढूंढें जिसमें अलग checksum या MAC field हो (licence blob, signed cookie, webhook body)।" },
          { en: "Modify a security-relevant field and recompute the ICV if it is an unkeyed CRC/hash; or simply strip/blank the field and resend.", simple: "Edit a field and recompute the checksum, or remove the checksum entirely and resend.", hi: "कोई security-relevant field बदलें और अगर ICV unkeyed CRC/hash है तो दोबारा compute करें; या field हटाकर/खाली करके भेजें।" },
          { en: "Check the MAC covers every security-relevant byte — a MAC over only part of the message lets you tamper the uncovered part.", simple: "Check the MAC covers the whole message, not just part of it.", hi: "देखें कि MAC हर security-relevant byte को cover करता है — आधे message पर MAC होने से बाकी हिस्सा tamper हो सकता है।" },
        ],
      },
    ],
    proof: {
      en: "Show a modified message accepted because the ICV is unkeyed, unverified, or incomplete. A properly verified keyed MAC (HMAC/GMAC) over the full message, with any tamper rejected, is N/A.",
      simple: "Show a changed message being accepted because the check value is weak or unchecked. A real, fully-verified MAC is N/A.",
      hi: "दिखाएँ कि modified message इसलिए accept हुआ क्योंकि ICV unkeyed/unverified/incomplete था। पूरे message पर सही verify होने वाला keyed MAC (HMAC/GMAC) N/A है।",
    },
    escalate: {
      en: "When the integrity value is a true cryptographic signature that is forgeable (alg confusion, no verification), use the Cryptographic Signature leaf, whose priority varies with what the signature authorises.",
      simple: "If the broken check is an actual signature, use the Cryptographic Signature leaf instead.",
      hi: "अगर यह integrity value असल cryptographic signature है जो forge हो सकती है, तो Cryptographic Signature leaf इस्तेमाल करें, जिसकी priority impact के साथ बदलती है।",
    },
  },

  "Cryptographic Weakness › Insecure Key Generation › Key Exchage Without Entity Authentication": {
    what: {
      en: "A key-agreement exchange (Diffie-Hellman/ECDH) runs without authenticating the peer, so neither side proves who it is. This is textbook unauthenticated DH: a man-in-the-middle completes a separate exchange with each side, sits in the middle, and reads/alters everything. The shared secret is confidential from passive eavesdroppers but worthless against an active attacker because identity is never bound to the exchange.",
      simple: "Two sides agree on a secret key but never check who they are talking to. An attacker in the middle can do a key exchange with each side separately and read everything.",
      hi: "Key-agreement exchange (Diffie-Hellman/ECDH) peer को authenticate किए बिना चलता है, तो कोई भी side यह साबित नहीं करती कि वो कौन है। यह classic unauthenticated DH है: man-in-the-middle हर side के साथ अलग exchange पूरा करके बीच में बैठ जाता है। Secret passive eavesdropper से छुपा है पर active attacker के खिलाफ़ बेकार क्योंकि identity exchange से bound ही नहीं है।",
    },
    find: [
      {
        title: { en: "Look for unauthenticated DH in custom protocols", simple: "Find key exchange with no identity check", hi: "Custom protocols में unauthenticated DH ढूंढें" },
        steps: [
          { en: "Find custom handshakes (IoT, mobile pinned channels, 'E2EE' chat, WebSocket) that perform DH/ECDH outside of TLS.", simple: "Find custom key exchanges done outside TLS.", hi: "Custom handshakes ढूंढें (IoT, mobile channels, E2EE chat, WebSocket) जो TLS के बाहर DH/ECDH करते हैं।" },
          { en: "Check whether the exchange is bound to a certificate, a signature over the DH public value, or a pre-shared identity — if not, it is unauthenticated.", simple: "Check if the exchange is tied to a cert or signature. If not, it is unauthenticated.", hi: "देखें कि exchange किसी certificate, DH public value पर signature, या pre-shared identity से bound है या नहीं — नहीं तो unauthenticated है।" },
          { en: "On your own test setup, proxy the channel and substitute your own DH public key; if both sides proceed, MITM is confirmed.", simple: "On your own test, swap in your own key and see if both sides accept it.", hi: "अपने test setup पर channel proxy करके अपनी DH public key डालें; दोनों sides आगे बढ़ें तो MITM confirm।" },
        ],
      },
    ],
    proof: {
      en: "Demonstrate a MITM on your own test channel where you inject your DH public key and each side derives a shared key with you, not each other. TLS or any exchange authenticated by a trusted certificate/signature is N/A.",
      simple: "Show a man-in-the-middle on your own test where you insert your key and both sides talk to you. TLS is N/A.",
      hi: "अपने test channel पर MITM दिखाएँ जहाँ आपकी DH public key inject करने पर हर side आपके साथ shared key बनाती है। TLS या trusted certificate/signature से authenticated exchange N/A है।",
    },
  },

  "Cryptographic Weakness › Key Reuse › Lack of Perfect Forward Secrecy": {
    what: {
      en: "The key exchange does not provide forward secrecy: it uses static RSA key transport or static (non-ephemeral) DH, so the session keys are derivable from the server's long-term private key. An attacker who records traffic now and later obtains that private key (breach, subpoena, Heartbleed-style leak) can decrypt every past session. Forward secrecy breaks this by using a fresh ephemeral (EC)DHE key per session that is discarded afterwards.",
      simple: "The connection does not use forward secrecy, so if the server's key ever leaks, all previously recorded traffic can be decrypted. Ephemeral key exchange (ECDHE) would prevent this.",
      hi: "Key exchange forward secrecy नहीं देता: static RSA key transport या static (non-ephemeral) DH इस्तेमाल करता है, तो session keys server की long-term private key से निकाली जा सकती हैं। जो attacker अभी traffic record करके बाद में वो private key पा ले (breach, leak) वो हर पुराने session को decrypt कर सकता है। Forward secrecy हर session के लिए fresh ephemeral (EC)DHE key से यह रोकता है।",
    },
    find: [
      {
        title: { en: "Scan the negotiated TLS ciphersuites", simple: "Check the TLS ciphers", hi: "Negotiated TLS ciphersuites scan करें" },
        steps: [
          { en: "Run testssl.sh or sslscan and list the key-exchange of each accepted suite.", simple: "Run testssl.sh and look at the key exchange of each cipher.", hi: "testssl.sh या sslscan चलाएँ और हर accepted suite का key-exchange देखें।" },
          { en: "Flag suites that use static RSA key transport (TLS_RSA_WITH_*) or static DH, and the absence of any ECDHE/DHE suite.", simple: "Flag static RSA or static DH suites, and no ECDHE/DHE at all.", hi: "Static RSA key transport (TLS_RSA_WITH_*) या static DH वाले suites, और कोई ECDHE/DHE न होना flag करें।" },
        ],
      },
    ],
    proof: {
      en: "Show the server negotiates only non-forward-secret suites (static key transport / static DH, no ephemeral exchange), so recorded traffic is retroactively decryptable if the key leaks. Modern TLS 1.2 with ECDHE or TLS 1.3 (forward secret by design) is N/A. On its own this is frequently informational unless the policy accepts TLS hardening gaps.",
      simple: "Show only non-forward-secret ciphers are offered. Modern ECDHE / TLS 1.3 is N/A, and alone this is often just informational.",
      hi: "दिखाएँ कि server सिर्फ़ non-forward-secret suites negotiate करता है, तो key leak होने पर recorded traffic बाद में decrypt हो सकता है। ECDHE वाला TLS 1.2 या TLS 1.3 N/A है। अकेले यह अक्सर informational होता है।",
    },
  },

  "Cryptographic Weakness › Insufficient Entropy › Limited Random Number Generator (RNG) Entropy Source": {
    what: {
      en: "Security values are produced by an RNG seeded from a source with too little real entropy — wall-clock time, a process ID, a MAC address, or an embedded device generating keys at first boot before the entropy pool fills. The output looks random but lives in a space small enough to predict or reconstruct, so tokens, session IDs and keys become guessable.",
      simple: "The random generator is fed by something too predictable (time, process ID, a device booting with no randomness yet), so its 'random' tokens and keys can be guessed.",
      hi: "Security values ऐसे RNG से बनते हैं जिसका seed बहुत कम real entropy वाले source से आता है — wall-clock time, process ID, MAC address, या embedded device जो boot पर entropy pool भरने से पहले keys बनाता है। Output random दिखता है पर इतने छोटे space में होता है कि predict हो जाए, तो tokens, session IDs, keys guessable बन जाते हैं।",
    },
    find: [
      {
        title: { en: "Statistically test collected tokens", simple: "Test many tokens for weak randomness", hi: "इकट्ठा किए tokens को statistically test करें" },
        steps: [
          { en: "Collect a large sample of security tokens (session IDs, reset tokens, API keys) and run Burp Sequencer or ent / dieharder on them.", simple: "Collect many tokens and run randomness tests (Burp Sequencer, ent).", hi: "बहुत सारे security tokens इकट्ठा करें (session IDs, reset tokens, API keys) और Burp Sequencer या ent/dieharder चलाएँ।" },
          { en: "Look for low effective bit-entropy, structure, or correlation with the request timestamp.", simple: "Look for low randomness or a link to the request time.", hi: "कम effective bit-entropy, structure, या request timestamp से correlation देखें।" },
          { en: "For embedded/IoT, check whether keys are generated at first boot before the entropy pool is seeded.", simple: "For IoT, check if keys are made at first boot with no randomness yet.", hi: "Embedded/IoT के लिए देखें कि keys entropy pool भरने से पहले first boot पर बनती हैं या नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Demonstrate predictability — reproduce or narrow a token given the inferred seeding, or show statistical bias that collapses the search space. High-entropy output from a CSPRNG (getrandom, /dev/urandom, crypto.randomBytes) is N/A.",
      simple: "Show you can predict or narrow a token from the weak seeding. Proper CSPRNG output is N/A.",
      hi: "Predictability दिखाएँ — inferred seeding से token reproduce/narrow करें, या statistical bias दिखाएँ जो search space छोटा कर दे। CSPRNG (getrandom, /dev/urandom, crypto.randomBytes) का high-entropy output N/A है।",
    },
  },

  "Cryptographic Weakness › Side-Channel Attack › Padding Oracle Attack": {
    what: {
      en: "A CBC-mode decryptor that reveals whether the PKCS#7 padding of a submitted ciphertext is valid — through an error message, a different status/response, or timing — becomes an oracle. By flipping bytes of the preceding block and watching the padding-valid signal, an attacker decrypts any ciphertext and can forge chosen plaintext, all without the key (Vaudenay's attack; POODLE is the SSL variant).",
      simple: "If the server tells you (by error, status, or timing) whether a decrypted message's padding was valid, you can decrypt and forge encrypted data byte by byte without ever knowing the key.",
      hi: "CBC-mode decryptor जो बताता है कि भेजे गए ciphertext का PKCS#7 padding valid था या नहीं — error message, अलग status/response, या timing से — वो oracle बन जाता है। पिछले block के bytes flip करके padding-valid signal देखते हुए attacker बिना key के कोई भी ciphertext decrypt कर सकता है और chosen plaintext forge कर सकता है (Vaudenay attack; POODLE इसका SSL variant)।",
    },
    find: [
      {
        title: { en: "Probe a controlled CBC ciphertext for an oracle", simple: "Test an encrypted blob for a padding oracle", hi: "Controlled CBC ciphertext पर oracle probe करें" },
        steps: [
          { en: "Find a place where you control a CBC ciphertext blob: an encrypted cookie, a session token, a .NET ViewState, an encrypted URL parameter.", simple: "Find an encrypted cookie/token/parameter you control.", hi: "ऐसी जगह ढूंढें जहाँ आप CBC ciphertext control करते हैं: encrypted cookie, session token, ViewState, encrypted URL parameter।" },
          { en: "Flip bytes in the block before the target block and classify responses: a distinct 'padding error' vs any other error or success is the oracle.", simple: "Change bytes and watch for a distinct padding-error response.", hi: "Target block से पहले वाले block के bytes flip करें और responses classify करें: अलग 'padding error' बनाम कोई और error/success — यही oracle है।" },
          { en: "Automate with padbuster (or a custom script) to decrypt a block and, if needed, encrypt chosen plaintext.", simple: "Use padbuster to decrypt or forge the data automatically.", hi: "padbuster (या custom script) से एक block decrypt करें और ज़रूरत हो तो chosen plaintext encrypt करें।" },
        ],
      },
    ],
    proof: {
      en: "Decrypt a controlled ciphertext or forge a valid encrypted token using the oracle. A reliably distinguishable padding response is strong signal; a full decryption/forgery shows clear impact. AEAD modes (AES-GCM, ChaCha20-Poly1305) or a decryptor that returns one indistinguishable error for all failures are N/A.",
      simple: "Decrypt or forge a token using the oracle. A clear padding-error difference is strong; full decryption proves it. AEAD/GCM is N/A.",
      hi: "Oracle से controlled ciphertext decrypt करें या valid encrypted token forge करें। साफ़ distinguishable padding response मज़बूत signal है; पूरा decryption/forgery clear impact दिखाता है। AEAD modes (AES-GCM, ChaCha20-Poly1305) या सब failures पर एक जैसा error N/A है।",
    },
  },

  "Cryptographic Weakness › Insufficient Entropy › Predictable Initialization Vector (IV)": {
    what: {
      en: "CBC mode requires an IV that is unpredictable before encryption. If the IV is predictable — a counter, a timestamp, or simply the previous ciphertext block (the TLS 1.0 flaw) — an active attacker who can get chosen plaintext encrypted can confirm guesses about adjacent secret plaintext, which is the BEAST attack. Note this is distinct from IV reuse: here IVs may all differ yet still be predictable, and that alone breaks CBC's IND-CPA guarantee.",
      simple: "In CBC mode the IV must be unguessable before use. If it is a counter or timestamp, an attacker who can inject text can confirm guesses about secret data next to it (the BEAST attack).",
      hi: "CBC mode को encryption से पहले unpredictable IV चाहिए। अगर IV predictable है — counter, timestamp, या पिछला ciphertext block (TLS 1.0 flaw) — तो chosen plaintext encrypt करा सकने वाला active attacker पास के secret plaintext के guesses confirm कर सकता है, यही BEAST attack है। यह IV reuse से अलग है: यहाँ IVs अलग हो सकती हैं फिर भी predictable, और यही CBC की IND-CPA guarantee तोड़ देता है।",
    },
    find: [
      {
        title: { en: "Check how the IV is derived", simple: "See how the IV is chosen", hi: "देखें IV कैसे बनती है" },
        steps: [
          { en: "Capture multiple ciphertexts (the IV is usually prepended to the ciphertext) and check whether the IV increments, tracks the clock, or equals a prior block.", simple: "Collect ciphertexts and see if the IV counts up or follows the time.", hi: "कई ciphertexts capture करें (IV आमतौर पर ciphertext के आगे होती है) और देखें कि IV increment होती है, clock follow करती है, या किसी पिछले block के बराबर है।" },
          { en: "Confirm the mode is CBC and that you can influence plaintext, which is what makes a predictable IV exploitable.", simple: "Confirm it is CBC and that you can influence the plaintext.", hi: "Confirm करें कि mode CBC है और आप plaintext influence कर सकते हैं, तभी predictable IV exploitable है।" },
        ],
      },
    ],
    proof: {
      en: "Show the IV is predictable before encryption and used with CBC, enabling a chosen-plaintext confirmation of secret data. Random per-message IVs with CBC (requirement met) are N/A; for CTR/GCM the relevant failure is nonce reuse, not mere predictability, so route those to the IV Reuse leaf.",
      simple: "Show the IV is guessable in advance and used with CBC. Random IVs are N/A; for CTR/GCM the issue is reuse, not predictability.",
      hi: "दिखाएँ कि IV encryption से पहले predictable है और CBC के साथ है, जिससे secret data का chosen-plaintext confirmation मुमकिन हो। CBC के साथ random per-message IVs N/A हैं; CTR/GCM के लिए असली समस्या nonce reuse है, सिर्फ़ predictability नहीं, तो उसे IV Reuse leaf पर भेजें।",
    },
  },

  "Cryptographic Weakness › Insufficient Entropy › Predictable Pseudo-Random Number Generator (PRNG) Seed": {
    what: {
      en: "A security value comes from a non-cryptographic PRNG (java.util.Random, PHP mt_rand, JavaScript Math.random, C rand) seeded with a predictable value such as the current time or a process ID. Because the generator is fully deterministic given its seed, an attacker who reconstructs the seed reproduces every past and future output — regenerating password-reset tokens, session IDs or API keys at will.",
      simple: "A 'random' token is made by a weak generator seeded with something guessable like the current time. Recover the seed and you can regenerate every token it produced.",
      hi: "Security value एक non-cryptographic PRNG (java.util.Random, PHP mt_rand, JavaScript Math.random, C rand) से आती है जिसका seed predictable होता है जैसे current time या process ID। Generator seed मिलने पर पूरी तरह deterministic है, तो seed reconstruct करने वाला attacker हर past/future output बना सकता है — reset tokens, session IDs, API keys दोबारा generate कर के।",
    },
    find: [
      {
        title: { en: "Recover the seed from a narrow window", simple: "Guess the seed from the time", hi: "Narrow window से seed recover करें" },
        steps: [
          { en: "Identify a security value generated by a seeded non-crypto PRNG (clues: Math.random tokens, mt_rand IDs, predictable-looking reset links).", simple: "Find a token made by a weak PRNG like Math.random or mt_rand.", hi: "ऐसी security value पहचानें जो seeded non-crypto PRNG से बने (Math.random tokens, mt_rand IDs, predictable reset links)।" },
          { en: "If the seed is the request time, brute-force the small window of possible timestamps around when you triggered generation and regenerate the output.", simple: "If seeded by time, try all timestamps in a small window to recreate the token.", hi: "अगर seed request time है तो generation के आसपास के timestamps की छोटी window brute-force करके output दोबारा बनाएँ।" },
          { en: "Confirm by predicting the next token for your own account before it is issued.", simple: "Confirm by predicting your own next token in advance.", hi: "अपने account का अगला token पहले से predict करके confirm करें।" },
        ],
      },
    ],
    proof: {
      en: "Reproduce a target value by recovering the seed (e.g. predict a victim's reset token). Values from a CSPRNG (secrets, crypto.randomBytes, getrandom) are N/A, as is a predictable PRNG used for non-security values.",
      simple: "Regenerate a real token by recovering the seed. CSPRNG output is N/A.",
      hi: "Seed recover करके target value reproduce करें (जैसे victim का reset token predict करना)। CSPRNG (secrets, crypto.randomBytes, getrandom) की values N/A हैं, और non-security values के लिए predictable PRNG भी N/A है।",
    },
  },

  "Cryptographic Weakness › Insufficient Entropy › Small Seed Space in Pseudo-Random Number Generator (PRNG)": {
    what: {
      en: "Even with a decent algorithm, the seed is drawn from a space small enough to brute-force — a 16- or 32-bit seed, or the 32-bit seed of a Mersenne Twister. An attacker enumerates every possible seed offline, matches one observed output to pin the generator's state, then predicts all subsequent outputs. The weakness is the seed's bit-width, not the generator design.",
      simple: "The random generator's seed has too few possible values (say 32 bits), so an attacker can try them all offline, match one token, and then predict the rest.",
      hi: "अच्छे algorithm के बावजूद seed इतने छोटे space से आता है कि brute-force हो जाए — 16- या 32-bit seed, या Mersenne Twister का 32-bit seed। Attacker हर possible seed offline enumerate करके एक observed output से generator state pin करता है, फिर आगे के सब outputs predict करता है। कमज़ोरी seed की bit-width है, generator design नहीं।",
    },
    find: [
      {
        title: { en: "Brute-force the seed space offline", simple: "Try every possible seed", hi: "Seed space offline brute-force करें" },
        steps: [
          { en: "Determine the seed width from the library/config (e.g. a 32-bit seed, or seeding a Mersenne Twister from a short value).", simple: "Find how many bits the seed has.", hi: "Library/config से seed width पता करें (जैसे 32-bit seed, या छोटे value से Mersenne Twister seed करना)।" },
          { en: "If the space is <= ~2^32, enumerate every seed, run the generator, and match one observed output to recover the exact state.", simple: "If 32 bits or fewer, try all seeds until one matches an observed token.", hi: "अगर space <= ~2^32 है तो हर seed enumerate करें, generator चलाएँ, और एक observed output से exact state recover करें।" },
          { en: "Predict the next output(s) and verify against a freshly issued token.", simple: "Predict the next token and check it against a new one.", hi: "अगले output(s) predict करें और नए issued token से verify करें।" },
        ],
      },
    ],
    proof: {
      en: "Recover the generator state by exhausting the seed space and correctly predict the next security value. A seed of 128+ bits from a strong source is N/A.",
      simple: "Crack the seed and predict the next token. A 128-bit+ seed is N/A.",
      hi: "Seed space exhaust करके generator state recover करें और अगली security value सही predict करें। Strong source से 128+ bit seed N/A है।",
    },
  },

  "Cryptographic Weakness › Side-Channel Attack › Timing Attack": {
    what: {
      en: "Execution time depends on a secret, leaking it bit by bit. The common web case is a non-constant-time comparison of a secret — an HMAC, a session token, an API key, a reset token, a password — that returns early on the first mismatched byte, so a correct prefix takes measurably longer. Repeated timing measurements recover the secret one byte at a time (CWE-208).",
      simple: "The server takes slightly longer when more of your guessed secret is correct (because it compares byte by byte and stops at the first wrong one). Measuring that leak recovers the secret.",
      hi: "Execution time secret पर निर्भर करता है, जिससे वो धीरे-धीरे leak होता है। Common web case है secret का non-constant-time comparison — HMAC, session token, API key, reset token, password — जो पहले mismatched byte पर early return कर देता है, तो सही prefix नापने लायक ज़्यादा समय लेता है। बार-बार timing नापकर secret एक-एक byte करके निकलता है (CWE-208)।",
    },
    find: [
      {
        title: { en: "Measure response time per guessed byte", simple: "Time the responses for each guess", hi: "हर guessed byte का response time नापें" },
        steps: [
          { en: "Find a comparison of a user-supplied value against a secret (token/MAC/API-key verification, a '==' string compare).", simple: "Find where your input is compared against a secret.", hi: "ऐसा comparison ढूंढें जहाँ आपका input किसी secret से मिलाया जाता है (token/MAC/API-key verify, '==' string compare)।" },
          { en: "Send many requests per candidate byte and aggregate timings (median of hundreds) to beat jitter; a longer time marks a correct prefix byte.", simple: "Send many requests per guess and average the times to find the correct byte.", hi: "हर candidate byte पर कई requests भेजें और timings aggregate करें (सैकड़ों का median) ताकि jitter हरा सकें; ज़्यादा time सही prefix byte बताता है।" },
          { en: "Prefer local/same-host or high-sample measurement, since internet jitter usually swamps the few-microsecond signal.", simple: "Measure locally if you can — internet noise often hides the tiny signal.", hi: "जहाँ मुमकिन हो local/same-host या high-sample measurement करें, क्योंकि internet jitter कुछ-microsecond signal को अक्सर दबा देता है।" },
        ],
      },
    ],
    proof: {
      en: "Show a statistically significant timing difference correlated with guess correctness, ideally recovering at least one secret byte. Constant-time comparison (hmac.compare_digest, crypto.timingSafeEqual) is N/A, and so in practice is a signal buried under network jitter — many programs will not reward a timing claim without an actual secret recovery.",
      simple: "Show a clear timing difference tied to correct guesses, ideally recovering a byte. Constant-time compare is N/A, and pure internet noise usually is not rewarded.",
      hi: "दिखाएँ कि timing difference statistically significant है और guess correctness से correlate करता है, और कम से कम एक secret byte recover करें। Constant-time comparison (hmac.compare_digest, crypto.timingSafeEqual) N/A है, और network jitter में दबा signal भी practically N/A — असली recovery के बिना कई programs timing claim reward नहीं करते।",
    },
  },

  "Cryptographic Weakness › Use of Expired Cryptographic Key (or Certificate)": {
    what: {
      en: "An expired (or revoked) certificate or key is still trusted or used. Two shapes matter: a server presenting an expired cert, and — more interesting for a report — a client or service that fails to validate expiry/revocation and happily connects to an expired or revoked certificate, meaning its certificate validation is effectively off. The latter removes the guarantee that you are talking to the legitimate, still-authorised party.",
      simple: "An expired or revoked certificate or key is still accepted. The serious version is a client that connects anyway — meaning it does not really check certificates at all.",
      hi: "Expired (या revoked) certificate/key अब भी trust या इस्तेमाल हो रहा है। दो रूप अहम हैं: server expired cert दिखाना, और — report के लिए ज़्यादा दिलचस्प — ऐसा client/service जो expiry/revocation validate नहीं करता और expired/revoked certificate से खुशी-खुशी connect कर लेता है, यानी उसका certificate validation असल में बंद है। दूसरा मतलब यह guarantee खत्म कि आप legitimate authorised party से बात कर रहे हैं।",
    },
    find: [
      {
        title: { en: "Check both the cert and the validator", simple: "Check the cert and whether it is enforced", hi: "Cert और validator दोनों check करें" },
        steps: [
          { en: "Inspect served cert chains with openssl s_client / testssl.sh for expiry and revocation (OCSP/CRL).", simple: "Check served certs for expiry and revocation.", hi: "openssl s_client / testssl.sh से served cert chains की expiry और revocation (OCSP/CRL) देखें।" },
          { en: "Point the client/app at an endpoint with an expired or revoked cert (your own test cert) and see if it still connects — acceptance proves missing validation.", simple: "Make the client hit an expired test cert and see if it connects anyway.", hi: "Client/app को expired या revoked cert वाले endpoint (अपना test cert) पर भेजें और देखें connect होता है या नहीं — accept होना missing validation साबित करता है।" },
          { en: "Grep code/config for disabled expiry or verification (verify=False, InsecureSkipVerify, NODE_TLS_REJECT_UNAUTHORIZED=0).", simple: "Search code for disabled certificate checks.", hi: "Code/config में disabled expiry/verification ढूंढें (verify=False, InsecureSkipVerify, NODE_TLS_REJECT_UNAUTHORIZED=0)।" },
        ],
      },
    ],
    proof: {
      en: "Show the system accepts or relies on an expired/revoked cert or key — most convincingly, a client that completes a connection to an expired/revoked certificate. A public-facing expired server cert that correctly-behaving clients reject is a self-inflicted availability glitch, not a vulnerability, and is typically N/A.",
      simple: "Show the system accepts an expired cert — best, a client that connects to one. A public server cert that browsers reject is just an outage, not a bug.",
      hi: "दिखाएँ कि system expired/revoked cert या key accept या इस्तेमाल करता है — सबसे मज़बूत, ऐसा client जो expired/revoked certificate से connection पूरा कर ले। Public-facing expired server cert जिसे सही clients reject करते हैं, वो self-inflicted availability glitch है, vulnerability नहीं, आमतौर पर N/A।",
    },
  },

  "Cryptographic Weakness › Broken Cryptography › Use of Vulnerable Cryptographic Library": {
    what: {
      en: "The target runs a crypto library version with a known, published vulnerability — a flawed OpenSSL/LibreSSL/BoringSSL build, a vulnerable Bouncy Castle, an outdated libsodium/forge, etc. The weakness is the library, not the app's own code, but if the vulnerable code path is reachable it can expose keys, allow decryption, or let signatures be forged.",
      simple: "The app uses an old version of a crypto library that has a known security hole. If that buggy code is actually used, keys or data can be exposed.",
      hi: "Target ऐसी crypto library version चला रहा है जिसमें known, published vulnerability है — flawed OpenSSL/LibreSSL/BoringSSL build, vulnerable Bouncy Castle, outdated libsodium/forge वगैरह। कमज़ोरी library में है, app के अपने code में नहीं, पर अगर vulnerable code path reachable है तो keys expose, decryption, या signature forgery हो सकती है।",
    },
    find: [
      {
        title: { en: "Fingerprint the library and map to advisories", simple: "Find the library version and known bugs", hi: "Library version पहचानें और advisories से map करें" },
        steps: [
          { en: "Identify library + version from Server/ALPN banners, JA3/TLS fingerprint, SBOM, dependency manifests (package-lock, pom.xml, go.sum), or JS bundle strings.", simple: "Find the exact library and version from headers, dependency files, or JS bundles.", hi: "Server/ALPN banners, JA3/TLS fingerprint, SBOM, dependency manifests (package-lock, pom.xml, go.sum), या JS bundle strings से library + version पहचानें।" },
          { en: "Map that exact version to published advisories and confirm the app actually calls the affected API/feature.", simple: "Match the version to known advisories and check the buggy feature is used.", hi: "उस exact version को published advisories से map करें और confirm करें कि app वाकई affected API/feature call करता है।" },
        ],
      },
    ],
    proof: {
      en: "Give the exact vulnerable version, the specific advisory it matches, and evidence the vulnerable code path is reachable — a working trigger is ideal. A patched version, an unreachable code path, or no security consequence is N/A. Cite only an advisory you actually verified; do not invent CVE numbers.",
      simple: "Give the exact version, the real advisory, and proof the buggy code can be reached. Patched or unreachable is N/A. Do not make up CVE numbers.",
      hi: "सही vulnerable version, वो specific advisory, और यह सबूत दें कि vulnerable code path reachable है — working trigger सबसे अच्छा। Patched version, unreachable path, या कोई security असर न होना N/A है। सिर्फ़ verify की हुई advisory cite करें; CVE numbers मत बनाएँ।",
    },
    escalate: {
      en: "If the weakness is the algorithm itself rather than a library bug, it is the Use of Broken Cryptographic Primitive leaf (P3).",
      simple: "If the algorithm itself is broken (not just the library), use the Broken Primitive leaf (P3).",
      hi: "अगर कमज़ोरी algorithm में ही है, library bug में नहीं, तो वो Use of Broken Cryptographic Primitive leaf (P3) है।",
    },
  },

  "Cryptographic Weakness › Side-Channel Attack › Emanations Attack": {
    what: {
      en: "A key is recovered from a device's unintended physical emanations — electromagnetic radiation, acoustic noise, or optical/photonic leakage (the TEMPEST class) — while it performs cryptographic operations. This requires physical proximity and specialised capture gear (SDRs, EM probes, microphones), so it applies to smartcards and embedded hardware, essentially never to a remote web or SaaS target. In web bug bounty scope it is almost always out of scope and informational.",
      simple: "A key is stolen by measuring the physical signals a device gives off (radio, sound, light) while doing crypto. It needs physical access and special equipment, so it does not apply to normal web targets.",
      hi: "Key device के unintended physical emanations से recover होती है — electromagnetic radiation, acoustic noise, या optical leakage (TEMPEST class) — जब वो crypto operations करता है। इसके लिए physical proximity और specialised capture gear (SDRs, EM probes, microphones) चाहिए, तो यह smartcards और embedded hardware पर लागू है, remote web/SaaS पर लगभग कभी नहीं। Web bounty scope में यह लगभग हमेशा out of scope और informational है।",
    },
    find: [
      {
        title: { en: "Capture emanations on in-scope hardware", simple: "Measure device signals (hardware only)", hi: "In-scope hardware पर emanations capture करें" },
        steps: [
          { en: "Confirm the target is an in-scope physical device you may test with physical access.", simple: "Confirm you may physically test the device and it is in scope.", hi: "Confirm करें कि target एक in-scope physical device है जिसे आप physical access से test कर सकते हैं।" },
          { en: "Record EM/acoustic traces with an SDR or probe while the device signs or decrypts, then correlate the traces with hypothesised key bits.", simple: "Record the device's signals during crypto and correlate them with key bits.", hi: "Device के sign/decrypt करते समय SDR/probe से EM/acoustic traces record करें, फिर traces को hypothesised key bits से correlate करें।" },
        ],
      },
    ],
    proof: {
      en: "Recovered key material from captured emanations on an in-scope hardware device, with the setup documented. For any web, API or SaaS target this is out of scope and N/A — note it only for completeness.",
      simple: "Show recovered key bits from a real in-scope device's signals. For web/SaaS it is out of scope and N/A.",
      hi: "In-scope hardware device के captured emanations से recovered key material दिखाएँ, setup documented हो। किसी भी web/API/SaaS target के लिए यह out of scope और N/A है।",
    },
  },

  "Cryptographic Weakness › Incomplete Cleanup of Keying Material": {
    what: {
      en: "Secret keys, derived key material or plaintext secrets are left behind in memory, swap, logs, temp files or core dumps after use, instead of being zeroised. A later attacker (a local process, a crash dump handler, a log reader, or someone with the swap/hibernation file) can recover the key long after the operation that used it completed. The crypto was fine; the lifecycle hygiene was not.",
      simple: "After using a secret key, the program leaves copies of it lying around in memory, logs, temp files or crash dumps instead of wiping it. Someone can later read it from there.",
      hi: "Secret keys, derived key material या plaintext secrets इस्तेमाल के बाद memory, swap, logs, temp files या core dumps में छूट जाते हैं, zeroise नहीं होते। बाद में कोई attacker (local process, crash dump handler, log reader, या swap/hibernation file वाला) key recover कर सकता है। Crypto ठीक था; lifecycle hygiene नहीं।",
    },
    find: [
      {
        title: { en: "Look for lingering key material", simple: "Search for leftover keys", hi: "बचा हुआ key material ढूंढें" },
        steps: [
          { en: "Inspect core dumps, heap/process memory, crash reports and debug/verbose logs for key bytes or secrets after a crypto operation.", simple: "Check memory dumps, crash reports and logs for leftover key bytes.", hi: "Crypto operation के बाद core dumps, heap/process memory, crash reports और debug/verbose logs में key bytes/secrets देखें।" },
          { en: "Check whether keys are written to disk/temp files and never securely wiped; on your own build, dump process memory after use and grep for the known key.", simple: "Check for keys written to disk and not wiped; on your own build, dump memory and search for the key.", hi: "देखें कि keys disk/temp files में लिखी जाकर securely wipe नहीं होतीं; अपने build पर इस्तेमाल के बाद process memory dump करके known key grep करें।" },
        ],
      },
    ],
    proof: {
      en: "Show key material recoverable after it should have been destroyed — e.g. the key present in a core dump, a log line, or swap. Without a realistic retrieval path this is theoretical; it is usually informational/low on its own.",
      simple: "Show the key can still be read after it should be gone (in a dump or log). With no realistic way to retrieve it, it is theoretical and usually low/informational.",
      hi: "दिखाएँ कि key material नष्ट होने के बाद भी recoverable है — जैसे core dump, log line, या swap में key। Realistic retrieval path के बिना यह theoretical है; अकेले आमतौर पर informational/low।",
    },
  },

  "Cryptographic Weakness › Insufficient Entropy › Initialization Vector (IV) Reuse": {
    what: {
      en: "The same IV/nonce is used more than once with the same key, and what breaks depends sharply on the mode. In CBC, reuse only reveals whether two messages share an identical leading block. In CTR, GCM and ChaCha20 it is catastrophic: the keystream repeats, so XORing two ciphertexts yields the XOR of the two plaintexts (crib-dragging recovers both), and in GCM a repeated nonce also leaks the authentication subkey H, letting an attacker forge valid tags for arbitrary ciphertexts.",
      simple: "The same IV/nonce is reused with the same key. In CBC that leaks little; in CTR/GCM/ChaCha it is fatal — two messages reveal each other, and in GCM it lets an attacker forge the authentication tag.",
      hi: "एक ही IV/nonce एक ही key के साथ एक से ज़्यादा बार इस्तेमाल होती है, और क्या टूटता है यह mode पर तीखा निर्भर करता है। CBC में reuse सिर्फ़ यह बताता है कि दो messages का leading block एक जैसा है या नहीं। CTR, GCM और ChaCha20 में यह catastrophic है: keystream दोहराता है, तो दो ciphertexts को XOR करने से दोनों plaintexts का XOR मिलता है (crib-dragging से दोनों निकलते हैं), और GCM में repeated nonce authentication subkey H भी leak कर देता है, जिससे attacker arbitrary ciphertexts के लिए valid tags forge कर सकता है।",
    },
    find: [
      {
        title: { en: "Detect repeated (key, nonce) pairs", simple: "Find reused IVs", hi: "दोहराए (key, nonce) pairs ढूंढें" },
        steps: [
          { en: "Capture many ciphertexts with their IVs/nonces and look for the same nonce appearing twice under the same key.", simple: "Collect ciphertexts and look for the same nonce used twice.", hi: "कई ciphertexts उनकी IVs/nonces के साथ capture करें और देखें कि एक ही nonce एक key के नीचे दो बार आता है।" },
          { en: "For CTR/GCM/ChaCha, XOR two ciphertexts that share a nonce and crib-drag known plaintext to recover both messages.", simple: "For CTR/GCM, XOR two messages with the same nonce and recover the text.", hi: "CTR/GCM/ChaCha के लिए एक nonce वाले दो ciphertexts XOR करें और known plaintext से crib-drag करके दोनों messages निकालें।" },
          { en: "For GCM specifically, use the repeated-nonce forgery (recover H) to demonstrate a forged authentication tag.", simple: "For GCM, use the repeated nonce to forge a valid tag.", hi: "खास GCM के लिए repeated-nonce forgery (H recover) से forged authentication tag दिखाएँ।" },
        ],
      },
    ],
    proof: {
      en: "Show two messages encrypted under the same key and nonce, and recover plaintext (CTR/GCM/ChaCha) or demonstrate GCM tag forgery. Unique nonces per key (requirement met), or CBC reuse that leaks nothing actionable, are N/A.",
      simple: "Show two messages with the same key+nonce and recover the text, or forge a GCM tag. Unique nonces are N/A.",
      hi: "दिखाएँ कि दो messages एक ही key और nonce के नीचे encrypted हैं, और plaintext recover करें (CTR/GCM/ChaCha) या GCM tag forgery दिखाएँ। हर key के लिए unique nonces, या कुछ actionable न leak करने वाला CBC reuse, N/A हैं।",
    },
  },

  "Cryptographic Weakness › Key Reuse › Intra-Environment": {
    what: {
      en: "A single key is reused across multiple purposes or contexts inside one environment — the same key for encryption and for the MAC, one signing key covering both session tokens and password-reset tokens, or one AES key shared by every user. This violates key separation: a token or ciphertext minted for one purpose may be accepted by another, and cryptanalysis of one use can weaken the others. Impact stays bounded to that one environment.",
      simple: "One key is used for several different jobs in the same system (e.g. the same key for encrypting and for signing, or one key for all users). A value made for one job can be misused for another.",
      hi: "एक ही key एक environment के अंदर कई purposes/contexts में reuse होती है — encryption और MAC के लिए एक key, session tokens और password-reset दोनों के लिए एक signing key, या हर user के लिए एक AES key। यह key separation तोड़ता है: एक purpose के लिए बना token/ciphertext दूसरे में accept हो सकता है, और एक use की cryptanalysis बाकियों को कमज़ोर करती है। Impact उसी एक environment तक सीमित रहता है।",
    },
    find: [
      {
        title: { en: "Map one key across distinct functions", simple: "See if one key does several jobs", hi: "एक key को अलग functions में map करें" },
        steps: [
          { en: "Identify whether a single key secures distinct functions: same kid/secret signing session and reset tokens, same AES key for encryption and MAC, one key for all tenants.", simple: "Check if one key signs or encrypts for more than one purpose.", hi: "पहचानें कि एक ही key अलग functions को secure करती है या नहीं: एक kid/secret से session और reset tokens, एक AES key से encryption और MAC, सब tenants के लिए एक key।" },
          { en: "Test cross-use: take a value legitimately issued for context A and submit it where context B is expected; acceptance proves the shared key.", simple: "Try using a token from one feature in another feature.", hi: "Cross-use test करें: context A के लिए जारी value को context B की जगह भेजें; accept होना shared key साबित करता है।" },
        ],
      },
    ],
    proof: {
      en: "Show one key spans contexts it should not, enabling concrete cross-use (a token minted for one purpose accepted for another, or the same key verifiably used for two operations). Separated keys, or impact that stays purely theoretical, are N/A — this leaf is often informational.",
      simple: "Show one key used across purposes with a real cross-use (a token from one feature accepted by another). Separated keys are N/A.",
      hi: "दिखाएँ कि एक key उन contexts में फैली है जहाँ नहीं होनी चाहिए, concrete cross-use के साथ (एक purpose का token दूसरे में accept, या एक key दो operations में verifiably इस्तेमाल)। अलग keys, या purely theoretical impact, N/A — यह leaf अक्सर informational।",
    },
    escalate: {
      en: "When the same key is reused across separate environments or tenants rather than within one, it is the Inter-Environment leaf (P2).",
      simple: "If the same key is reused across different environments, that is the P2 Inter-Environment leaf.",
      hi: "जब एक ही key एक environment के अंदर नहीं बल्कि अलग environments/tenants में reuse होती है, तो वो Inter-Environment leaf (P2) है।",
    },
  },

  "Cryptographic Weakness › Side-Channel Attack › Power Analysis Attack": {
    what: {
      en: "A key is extracted by measuring a device's power consumption while it runs cryptographic operations — Simple Power Analysis reads an operation sequence off a single trace, Differential/Correlation Power Analysis statistically combines many traces to recover key bytes. It needs physical access and an oscilloscope or a rig like the ChipWhisperer, so it targets smartcards, HSMs and embedded hardware. It does not apply to remote web/SaaS targets.",
      simple: "A key is recovered by watching how much power a chip uses while doing crypto. It needs physical access and lab gear, so it only applies to hardware, not websites.",
      hi: "Device के crypto operations चलाते समय power consumption नापकर key निकाली जाती है — Simple Power Analysis एक trace से operation sequence पढ़ता है, Differential/Correlation Power Analysis कई traces को statistically मिलाकर key bytes recover करता है। इसके लिए physical access और oscilloscope या ChipWhisperer जैसा rig चाहिए, तो यह smartcards, HSMs, embedded hardware पर है। Remote web/SaaS पर लागू नहीं।",
    },
    find: [
      {
        title: { en: "Collect power traces on in-scope hardware", simple: "Measure chip power (hardware only)", hi: "In-scope hardware पर power traces लें" },
        steps: [
          { en: "Confirm physical, in-scope access to the device and instrument its power rail (e.g. ChipWhisperer).", simple: "Confirm physical access and connect a power-measuring rig.", hi: "Device तक physical, in-scope access confirm करें और उसकी power rail instrument करें (जैसे ChipWhisperer)।" },
          { en: "Capture many traces during key operations and apply DPA/CPA correlation to recover key bytes.", simple: "Record many traces and use DPA/CPA to recover key bytes.", hi: "Key operations के दौरान कई traces capture करें और DPA/CPA correlation लगाकर key bytes recover करें।" },
        ],
      },
    ],
    proof: {
      en: "Key recovered via power traces on the in-scope device, with the rig documented. For web, API or SaaS targets this is out of scope and N/A.",
      simple: "Show key bytes recovered from a real device's power use. For web/SaaS it is out of scope and N/A.",
      hi: "In-scope device पर power traces से recovered key दिखाएँ, rig documented हो। Web/API/SaaS targets के लिए यह out of scope और N/A है।",
    },
  },

  "Cryptographic Weakness › Insufficient Entropy › Pseudo-Random Number Generator (PRNG) Seed Reuse": {
    what: {
      en: "The PRNG is reseeded with a value it has already used — a hard-coded constant, a fixed seed baked into firmware, or the same seed after every restart — so it replays the identical output stream. Every 'random' value it produces (tokens, keys, IVs, nonces) recurs verbatim, letting an attacker who has seen one run predict all values in another. Distinct from a predictable seed: here the seed is simply the same each time.",
      simple: "The random generator is restarted with the same seed, so it produces the exact same sequence of 'random' tokens again. Anyone who saw them once can predict them again.",
      hi: "PRNG को वही value से दोबारा seed किया जाता है जो पहले इस्तेमाल हो चुकी — hard-coded constant, firmware में fixed seed, या हर restart पर वही seed — तो वो identical output stream दोहराता है। हर 'random' value (tokens, keys, IVs, nonces) हूबहू फिर आती है, जिससे एक run देख चुका attacker दूसरे की सब values predict कर सकता है। Predictable seed से अलग: यहाँ seed हर बार बस वही है।",
    },
    find: [
      {
        title: { en: "Spot recurring 'random' outputs", simple: "Look for repeated random values", hi: "दोहराते 'random' outputs पहचानें" },
        steps: [
          { en: "Collect random outputs across restarts/instances and look for identical tokens, keys, IVs or nonces recurring.", simple: "Collect tokens across restarts and look for exact repeats.", hi: "Restarts/instances में random outputs इकट्ठा करें और देखें कि एक जैसे tokens, keys, IVs या nonces दोहराते हैं।" },
          { en: "A fixed seed shows as the same first value every cold start, or the same sequence replayed — confirm by restarting your own instance.", simple: "A fixed seed shows the same value on every fresh start.", hi: "Fixed seed हर cold start पर वही पहला value, या वही sequence replay दिखाता है — अपनी instance restart करके confirm करें।" },
        ],
      },
    ],
    proof: {
      en: "Show identical PRNG outputs recurring because the seed is reused (e.g. the same token issued again after a restart, or across instances). Unique outputs per run are N/A.",
      simple: "Show the same 'random' token appearing again after a restart. Unique outputs are N/A.",
      hi: "दिखाएँ कि seed reuse के कारण identical PRNG outputs दोहराते हैं (जैसे restart के बाद वही token, या instances के बीच)। हर run पर unique outputs N/A हैं।",
    },
  },

  "Cryptographic Weakness › Weak Hash › Use of Predictable Salt": {
    what: {
      en: "A password/secret hash uses a salt that is predictable rather than random — a username or email, a constant string, a sequential counter, or a timestamp. A salt's whole job is to make precomputation useless; a predictable salt lets an attacker precompute a rainbow table for that exact salt in advance, and shared constant salts let one table crack every record. It is weaker than a proper random salt but still better than no salt at all.",
      simple: "Password hashes use a salt that is guessable (like the username or a fixed string) instead of random. That lets an attacker precompute cracking tables for it ahead of time.",
      hi: "Password/secret hash ऐसा salt इस्तेमाल करता है जो random नहीं predictable है — username/email, constant string, sequential counter, या timestamp। Salt का पूरा काम precomputation बेकार करना है; predictable salt से attacker उस exact salt के लिए rainbow table पहले से बना सकता है, और shared constant salt से एक table हर record crack कर देता है। यह proper random salt से कमज़ोर पर बिल्कुल बिना salt से बेहतर है।",
    },
    find: [
      {
        title: { en: "Inspect the stored salt", simple: "Check how the salt is chosen", hi: "Stored salt inspect करें" },
        steps: [
          { en: "Obtain the stored hash format (via a legitimate export of your own test account, or source) and read the salt.", simple: "Get a test account's stored hash and look at its salt.", hi: "Stored hash format लें (अपने test account के legit export या source से) और salt पढ़ें।" },
          { en: "Check whether the salt equals the username/email, a constant, a counter or a timestamp — anything an attacker knows or can derive in advance.", simple: "See if the salt is the username, a constant, or a timestamp.", hi: "देखें कि salt username/email, constant, counter, या timestamp के बराबर है — कुछ भी जो attacker पहले से जानता/derive कर सकता है।" },
        ],
      },
    ],
    proof: {
      en: "Show the salt is predictable or derived from public data, so a rainbow table can be precomputed per salt (or one table reused across records for a constant salt). A per-record random salt is N/A. This usually matters only once the hash database is obtained via a separate disclosure, so alone it is often informational.",
      simple: "Show the salt is guessable so tables can be precomputed. Random per-record salts are N/A, and it usually needs the hash database to matter.",
      hi: "दिखाएँ कि salt predictable या public data से derived है, तो per-salt rainbow table precompute हो सकती है (constant salt पर एक table सब records पर)। Per-record random salt N/A है। यह आमतौर पर तभी मायने रखता है जब hash database अलग disclosure से मिले, तो अकेले अक्सर informational।",
    },
    escalate: {
      en: "No salt at all is the related Lack of Salt leaf; combining a predictable/absent salt with Insufficient Key Stretching (a fast hash / low iteration count) makes offline cracking dramatically cheaper.",
      simple: "No salt at all is the Lack of Salt leaf; pairing it with a fast hash makes cracking far easier.",
      hi: "बिल्कुल salt न होना related Lack of Salt leaf है; predictable/absent salt को Insufficient Key Stretching (fast hash / कम iterations) के साथ मिलाना offline cracking को बहुत सस्ता कर देता है।",
    },
  },

  "Cryptographic Weakness › Insufficient Entropy › Use of True Random Number Generator (TRNG) for Non-Security Purpose": {
    what: {
      en: "Code draws from a limited, blocking true-entropy source (a hardware TRNG or Linux /dev/random) for ordinary non-security needs — UUIDs, shuffling, jitter, retry delays. Because the entropy pool is finite and the source blocks when depleted, heavy non-security consumption starves the real security consumers and can stall the application. The CVSS here is availability-focused (A:H), not confidentiality: the risk is blocking/DoS, not a weak key.",
      simple: "The app uses a slow, limited source of true randomness (like /dev/random) for things that do not need it, which can drain the pool and make the app hang or starve the parts that really need randomness.",
      hi: "Code limited, blocking true-entropy source (hardware TRNG या Linux /dev/random) से ordinary non-security needs के लिए draw करता है — UUIDs, shuffling, jitter, retry delays। Entropy pool finite है और खाली होने पर source block करता है, तो heavy non-security consumption असली security consumers को starve करके app को रोक सकता है। यहाँ CVSS availability-focused (A:H) है, confidentiality नहीं: risk blocking/DoS है, weak key नहीं।",
    },
    find: [
      {
        title: { en: "Find non-security use of the blocking source", simple: "Find needless use of /dev/random", hi: "Blocking source का non-security use ढूंढें" },
        steps: [
          { en: "Identify code reading the blocking entropy source (/dev/random, a hardware RNG syscall) for non-security values like UUIDs or shuffles.", simple: "Find code reading /dev/random for non-security values.", hi: "ऐसा code पहचानें जो blocking entropy source (/dev/random, hardware RNG syscall) को UUIDs/shuffles जैसी non-security values के लिए पढ़ता है।" },
          { en: "Reason about whether sustained use under load could block or starve the security RNG — do not actually run a DoS against production.", simple: "Think through whether heavy use could stall the app — do not actually DoS it.", hi: "सोचें कि load पर sustained use security RNG को block/starve कर सकता है या नहीं — production पर असल DoS मत चलाएँ।" },
        ],
      },
    ],
    proof: {
      en: "Show the blocking entropy source is consumed for non-security purposes and reason that it can starve/block the security RNG. A CSPRNG (/dev/urandom, getrandom without blocking) used for non-security needs is N/A. This is informational and availability-flavoured — respect each program's DoS policy and never actually exhaust a production pool.",
      simple: "Show /dev/random being used where it is not needed, risking a stall. /dev/urandom is N/A. Do not DoS production; it is usually informational.",
      hi: "दिखाएँ कि blocking entropy source non-security purposes के लिए consume होता है और यह security RNG को starve/block कर सकता है। Non-security needs के लिए CSPRNG (/dev/urandom, non-blocking getrandom) N/A है। यह informational और availability-flavoured है — हर program की DoS policy मानें और production pool असल में exhaust कभी न करें।",
    },
  },

  "Cryptographic Weakness › Insufficient Verification of Data Authenticity › Cryptographic Signature": {
    what: {
      en: "A cryptographic signature that is supposed to authenticate a message is not properly verified, so an attacker forges or tampers with signed data. Common shapes: the signature is never checked, it is verified with an attacker-controllable key, algorithm confusion (JWT alg:none, or RS256 downgraded to HS256 so the public key is used as an HMAC secret), the wrong/partial bytes are covered, or a kid points to a key the attacker supplies. The signed object (JWT, SAML assertion, webhook, licence) becomes forgeable.",
      simple: "A signature meant to prove a message is genuine is not really checked, so an attacker can forge it. Classic tricks: alg:none, swapping RS256 to HS256, or pointing to an attacker's own key.",
      hi: "Message को authenticate करने वाली cryptographic signature ठीक से verify नहीं होती, तो attacker signed data forge/tamper कर देता है। Common shapes: signature कभी check न होना, attacker-controllable key से verify, algorithm confusion (JWT alg:none, या RS256 को HS256 में downgrade ताकि public key HMAC secret बने), गलत/partial bytes cover होना, या kid का attacker की key पर point करना। Signed object (JWT, SAML assertion, webhook, licence) forgeable बन जाता है।",
    },
    find: [
      {
        title: { en: "Attack the signature verification", simple: "Test the signature check", hi: "Signature verification पर attack करें" },
        steps: [
          { en: "Collect signed artifacts: JWTs, SAML assertions, signed webhooks, licence blobs, signed URLs.", simple: "Collect signed tokens and messages.", hi: "Signed artifacts इकट्ठा करें: JWTs, SAML assertions, signed webhooks, licence blobs, signed URLs।" },
          { en: "Run the standard tampers with jwt_tool or a custom script: strip the signature, set alg:none, swap RS256 to HS256 using the public key as the HMAC key, substitute your own key/kid, and re-sign.", simple: "Try alg:none, RS256-to-HS256, and your own key with jwt_tool.", hi: "jwt_tool या custom script से standard tampers चलाएँ: signature हटाएँ, alg:none सेट करें, public key को HMAC key बनाकर RS256 को HS256 में swap करें, अपनी key/kid डालें, और re-sign करें।" },
          { en: "Modify a meaningful claim (user id, role, amount) and confirm the forged artifact is accepted.", simple: "Change a claim like the user id and see if it is accepted.", hi: "कोई meaningful claim बदलें (user id, role, amount) और confirm करें कि forged artifact accept हुआ।" },
        ],
      },
    ],
    proof: {
      en: "Show a forged or tampered artifact accepted as validly signed, ideally crossing a privilege or identity boundary. Priority varies with what the signature authorises — forging an auth/session token is high, spoofing a low-value webhook far less. A signature correctly verified against the right trusted key with all tampers rejected is N/A.",
      simple: "Show a forged signed token being accepted, ideally to gain access. Impact and rating depend on what it protects. A properly verified signature is N/A.",
      hi: "दिखाएँ कि forged/tampered artifact validly signed के रूप में accept हुआ, आदर्श रूप से privilege/identity boundary पार करते हुए। Priority इस पर निर्भर करती है कि signature क्या authorise करती है — auth/session token forge करना high, low-value webhook spoof बहुत कम। सही trusted key से correctly verify होने वाली signature (सब tampers reject) N/A है।",
    },
    escalate: {
      en: "When the broken integrity value is a non-signature check such as a keyed/unkeyed MAC or checksum, use the Integrity Check Value (ICV) leaf (P4) instead.",
      simple: "If the broken check is a MAC or checksum rather than a signature, use the ICV leaf (P4).",
      hi: "जब broken integrity value कोई non-signature check हो जैसे keyed/unkeyed MAC या checksum, तो Integrity Check Value (ICV) leaf (P4) इस्तेमाल करें।",
    },
  },

  "Cryptographic Weakness › Side-Channel Attack › Differential Fault Analysis": {
    what: {
      en: "An attacker deliberately induces a computation fault during a crypto operation — voltage/clock glitching, laser or EM injection — and compares the faulty output with the correct one to recover the key. The textbook case is RSA-CRT signing: a single faulty signature lets you compute gcd of (correct minus faulty) against the modulus and factor N outright. AES succumbs to DFA with a handful of faulty ciphertexts. It requires physical fault injection, so it targets smartcards/embedded hardware, not remote web services.",
      simple: "The attacker causes a glitch (voltage, clock, laser) while the device does crypto, then compares the broken result with a good one to recover the key. For RSA-CRT a single glitched signature can factor the key. It needs physical access.",
      hi: "Attacker crypto operation के दौरान जानबूझकर computation fault पैदा करता है — voltage/clock glitching, laser या EM injection — और faulty output की correct से तुलना करके key recover करता है। Textbook case RSA-CRT signing है: एक faulty signature से (correct minus faulty) का gcd modulus के साथ निकालकर N सीधे factor हो जाता है। AES कुछ faulty ciphertexts से DFA का शिकार होता है। इसके लिए physical fault injection चाहिए, तो यह smartcards/embedded hardware पर है, remote web पर नहीं।",
    },
    find: [
      {
        title: { en: "Inject faults on in-scope hardware", simple: "Glitch the device (hardware only)", hi: "In-scope hardware पर faults inject करें" },
        steps: [
          { en: "Confirm physical, in-scope access and a signing/decryption operation you can trigger repeatedly.", simple: "Confirm physical access and a crypto op you can trigger.", hi: "Physical, in-scope access और बार-बार trigger करने लायक signing/decryption operation confirm करें।" },
          { en: "Glitch the device during the operation, collect a faulty output alongside the correct one, and for RSA-CRT recover a factor of N via the gcd relation; for AES apply DFA on the faulty ciphertexts.", simple: "Glitch during the op, collect faulty and correct outputs, and recover the key (factor N for RSA-CRT).", hi: "Operation के दौरान device glitch करें, faulty output correct के साथ इकट्ठा करें, और RSA-CRT के लिए gcd relation से N का factor recover करें; AES के लिए faulty ciphertexts पर DFA लगाएँ।" },
        ],
      },
    ],
    proof: {
      en: "Recover key material (or factor the RSA modulus) from faulty-versus-correct outputs on the in-scope device, with the fault rig documented. For web, API or SaaS targets this is out of scope and N/A; priority varies only within genuine hardware scope.",
      simple: "Show the key recovered from glitched outputs on a real device. For web/SaaS it is out of scope and N/A.",
      hi: "In-scope device पर faulty-बनाम-correct outputs से key material recover करें (या RSA modulus factor करें), fault rig documented हो। Web/API/SaaS targets के लिए out of scope और N/A; priority सिर्फ़ genuine hardware scope में बदलती है।",
    },
  },

  "Cryptographic Weakness › Insecure Key Generation › Improper Asymmetric Exponent Selection": {
    what: {
      en: "RSA is broken by a poorly chosen exponent. A very small public exponent (e=3) with no or weak padding enables low-exponent root attacks: a short message encrypted/signed with e=3 can be recovered by taking a plain cube root, and the same message to three recipients falls to Håstad's broadcast attack; short-but-not-tiny messages fall to Coppersmith. Conversely a small private exponent d (chosen for speed) is recovered by Wiener's continued-fraction attack, or Boneh-Durfee for a slightly larger d, handing over the private key.",
      simple: "RSA with a bad exponent breaks. A tiny public exponent (e=3) with no padding lets short messages be recovered by a cube root; a tiny private exponent lets the private key be recovered by Wiener's attack.",
      hi: "RSA खराब exponent choice से टूटता है। बहुत छोटा public exponent (e=3) बिना/weak padding के low-exponent root attacks देता है: e=3 से encrypt/sign किया छोटा message plain cube root लेकर recover होता है, और तीन recipients को वही message Håstad's broadcast attack से; short messages Coppersmith से। उल्टा, speed के लिए चुना छोटा private exponent d, Wiener's continued-fraction attack (या थोड़े बड़े d के लिए Boneh-Durfee) से recover होकर private key दे देता है।",
    },
    find: [
      {
        title: { en: "Inspect the RSA exponents", simple: "Check the RSA exponent", hi: "RSA exponents inspect करें" },
        steps: [
          { en: "Extract the RSA public key (e, N) from certs, JWKS, or tokens and flag a very small e (3, 5) — especially with textbook/no OAEP padding and short messages.", simple: "Read the RSA public key and flag a tiny exponent like 3.", hi: "Certs, JWKS, या tokens से RSA public key (e, N) निकालें और बहुत छोटा e (3, 5) flag करें — खासकर textbook/बिना OAEP padding और छोटे messages के साथ।" },
          { en: "Demonstrate the matching attack: cube-root a short e=3 message with no padding, Håstad across three recipients, or Wiener's attack if a small private exponent is suspected.", simple: "Run the right attack: cube root for e=3, or Wiener's for a small private exponent.", hi: "Matching attack दिखाएँ: बिना padding e=3 message पर cube-root, तीन recipients पर Håstad, या छोटे private exponent का शक हो तो Wiener's attack।" },
        ],
      },
    ],
    proof: {
      en: "Show the exponent choice enables a concrete recovery — a cube-root/Coppersmith recovery of a short message under e=3 with no padding, or Wiener/Boneh-Durfee recovery of d. Standard e=65537 with OAEP/PSS padding and a normal-size d is N/A.",
      simple: "Show the exponent lets you actually recover a message or the private key. Normal e=65537 with padding is N/A.",
      hi: "दिखाएँ कि exponent choice concrete recovery देता है — बिना padding e=3 पर short message का cube-root/Coppersmith recovery, या d का Wiener/Boneh-Durfee recovery। OAEP/PSS padding और normal d के साथ standard e=65537 N/A है।",
    },
  },

  "Cryptographic Weakness › Insecure Key Generation › Improper Asymmetric Prime Selection": {
    what: {
      en: "RSA primes p and q are generated poorly, so the modulus N can be factored. Three classic cases: p and q chosen too close together, which Fermat factorization cracks almost instantly; primes shared across many keys because of a low-entropy generator, which a batch-GCD over a corpus of moduli exposes; and primes from a flawed library routine (the Infineon ROCA weakness), which a structure test detects and then factors. Any of these recovers the private key.",
      simple: "The two secret primes in an RSA key are chosen badly, so the key can be factored — primes too close together, primes accidentally shared between many keys, or primes from a known-broken generator.",
      hi: "RSA primes p और q खराब तरीके से generate होते हैं, तो modulus N factor हो सकता है। तीन classic cases: p और q बहुत पास चुने जाना, जिसे Fermat factorization लगभग तुरंत तोड़ता है; low-entropy generator से कई keys में shared primes, जिसे moduli के corpus पर batch-GCD expose करता है; और flawed library routine से primes (Infineon ROCA weakness), जिसे structure test पकड़कर factor करता है। इनमें से कोई भी private key recover कर देता है।",
    },
    find: [
      {
        title: { en: "Factor the modulus via prime weaknesses", simple: "Test the key's primes", hi: "Prime weaknesses से modulus factor करें" },
        steps: [
          { en: "Collect RSA moduli (N) from certs, JWKS and keys; run Fermat factorization for close primes and the ROCA fingerprint test for Infineon-generated keys.", simple: "Collect RSA moduli and test for close primes and ROCA.", hi: "Certs, JWKS, keys से RSA moduli (N) इकट्ठा करें; close primes के लिए Fermat factorization और Infineon keys के लिए ROCA fingerprint test चलाएँ।" },
          { en: "Across a large corpus of collected moduli, run batch-GCD to find any pair sharing a prime factor, which factors both keys.", simple: "Run batch-GCD over many keys to find shared prime factors.", hi: "इकट्ठा किए moduli के बड़े corpus पर batch-GCD चलाकर कोई pair ढूंढें जो एक prime factor share करता हो, जो दोनों keys factor कर देता है।" },
        ],
      },
    ],
    proof: {
      en: "Factor N (recover p and q) via a close-prime, shared-prime or ROCA weakness, yielding the private key. Independent, well-separated primes from a sound generator are N/A.",
      simple: "Show you can factor the key (recover its primes). A properly generated key is N/A.",
      hi: "Close-prime, shared-prime या ROCA weakness से N factor करें (p और q recover), जिससे private key मिले। Sound generator से independent, well-separated primes N/A हैं।",
    },
  },

  "Cryptographic Weakness › Insecure Implementation › Improper Following of Specification (Other)": {
    what: {
      en: "The primitives are strong but the implementation deviates from the algorithm or protocol specification, breaking the guarantees. Examples: MAC-then-encrypt where the standard mandates encrypt-then-MAC, truncating an authentication tag below the spec's minimum, skipping a verification step the RFC requires, or reusing a value the spec says must be fresh. The crypto 'works' functionally but no longer provides the property it is supposed to.",
      simple: "The algorithm itself is fine, but it is implemented against its own rules — wrong order of steps, a truncated tag, a skipped check — so it no longer actually protects anything.",
      hi: "Primitives मज़बूत हैं पर implementation algorithm/protocol specification से हटता है, जिससे guarantees टूटती हैं। Examples: standard encrypt-then-MAC कहे पर MAC-then-encrypt, authentication tag को spec के minimum से नीचे truncate करना, RFC की ज़रूरी verification step छोड़ना, या spec जिसे fresh कहे वो value reuse करना। Crypto functionally 'चलता' है पर अब वो property नहीं देता जो देनी चाहिए।",
    },
    find: [
      {
        title: { en: "Diff the implementation against the spec", simple: "Compare the code to the standard", hi: "Implementation को spec से diff करें" },
        steps: [
          { en: "Identify the algorithm/protocol and its governing spec (RFC, NIST SP, the scheme's paper).", simple: "Find which standard the code should follow.", hi: "Algorithm/protocol और उसकी governing spec (RFC, NIST SP, scheme का paper) पहचानें।" },
          { en: "Walk the implementation step by step and look for reordered, omitted, or altered steps, wrong parameter sizes, or non-standard constructions.", simple: "Go through the code and find steps done in the wrong order or skipped.", hi: "Implementation step-by-step देखें और reordered, omitted, altered steps, गलत parameter sizes, या non-standard constructions ढूंढें।" },
          { en: "Tie each deviation to the concrete property it removes (confidentiality, integrity, non-malleability) and demonstrate the resulting exposure.", simple: "Show what protection each deviation removes, with a working demo.", hi: "हर deviation को उस concrete property से जोड़ें जो वो हटाता है (confidentiality, integrity, non-malleability) और resulting exposure दिखाएँ।" },
        ],
      },
    ],
    proof: {
      en: "Point to the exact spec requirement violated and the security property lost, ideally with a working demonstration (e.g. a malleable ciphertext from mis-ordered MAC/encrypt). A deviation with no security consequence, or a different-but-sound construction, is N/A. Priority varies with the impact.",
      simple: "Show the exact rule broken and the protection lost, ideally with a demo. A harmless deviation is N/A.",
      hi: "Violate हुई exact spec requirement और खोई security property बताएँ, आदर्श रूप से working demonstration के साथ (जैसे mis-ordered MAC/encrypt से malleable ciphertext)। बिना security असर वाला deviation, या different-but-sound construction, N/A है। Priority impact के साथ बदलती है।",
    },
    escalate: {
      en: "When a required cryptographic step is omitted entirely rather than done wrongly, use the Missing Cryptographic Step leaf.",
      simple: "If a required step is left out completely, use the Missing Cryptographic Step leaf.",
      hi: "जब कोई ज़रूरी cryptographic step गलत करने के बजाय पूरी तरह छोड़ दी जाए, तो Missing Cryptographic Step leaf इस्तेमाल करें।",
    },
  },

  "Cryptographic Weakness › Insecure Key Generation › Insufficient Key Stretching": {
    what: {
      en: "A low-entropy input (a password or PIN) is turned into a key or stored hash without enough work factor, so offline brute force is cheap. The tell-tales are a plain fast hash (a single MD5/SHA-1/SHA-256) used for passwords, PBKDF2 with far too few iterations, or bcrypt/scrypt/Argon2 tuned with trivially low cost/memory parameters. Because GPUs test billions of fast hashes per second, weak stretching means a stolen hash database is cracked quickly.",
      simple: "A password is turned into a hash/key using a method that is too fast (like a single SHA-256 or too few PBKDF2 rounds), so an attacker with the hashes can brute-force them quickly.",
      hi: "Low-entropy input (password या PIN) बिना पर्याप्त work factor के key/stored hash में बदला जाता है, तो offline brute force सस्ता हो जाता है। निशानियाँ: passwords के लिए plain fast hash (single MD5/SHA-1/SHA-256), बहुत कम iterations वाला PBKDF2, या trivially low cost/memory parameters वाला bcrypt/scrypt/Argon2। GPUs अरबों fast hashes प्रति सेकंड test करते हैं, तो weak stretching मतलब चुराया hash database जल्दी crack।",
    },
    find: [
      {
        title: { en: "Read the KDF and its work factor", simple: "Check how slow the hashing is", hi: "KDF और उसका work factor पढ़ें" },
        steps: [
          { en: "Identify the KDF from source, config or the stored hash prefix ($2b$ bcrypt, $argon2id$, pbkdf2 with its iteration count).", simple: "Find which hashing method and settings are used.", hi: "Source, config, या stored hash prefix ($2b$ bcrypt, $argon2id$, iteration count वाला pbkdf2) से KDF पहचानें।" },
          { en: "Flag plain fast hashes for passwords, PBKDF2 with low iterations (e.g. 1k), or bcrypt cost / Argon2 memory set trivially low.", simple: "Flag fast hashes or very low iteration/cost settings.", hi: "Passwords के लिए plain fast hashes, कम iterations (जैसे 1k) वाला PBKDF2, या trivially low bcrypt cost / Argon2 memory flag करें।" },
        ],
      },
    ],
    proof: {
      en: "Show the KDF/parameters are weak enough for practical offline cracking (a single unsalted-or-salted fast hash, or PBKDF2 with ~1k iterations). Modern tuned parameters (bcrypt cost ≥ 12, Argon2id with sensible memory/time) are N/A. This usually matters once the hash database is obtained via a separate disclosure, so alone it is often informational.",
      simple: "Show the hashing is fast enough to crack offline. Modern bcrypt/Argon2 settings are N/A, and it usually needs the hash database to matter.",
      hi: "दिखाएँ कि KDF/parameters practical offline cracking के लिए काफ़ी weak हैं (single fast hash, या ~1k iterations वाला PBKDF2)। Modern tuned parameters (bcrypt cost ≥ 12, sensible memory/time वाला Argon2id) N/A हैं। यह आमतौर पर hash database मिलने पर मायने रखता है, तो अकेले अक्सर informational।",
    },
  },

  "Cryptographic Weakness › Weak Hash › Lack of Salt": {
    what: {
      en: "Passwords or secrets are hashed with no salt at all, so identical inputs always produce identical hash outputs. That lets an attacker use precomputed rainbow tables directly, instantly spot every user who shares a password (equal hashes), and crack the whole table in one pass. A unique random per-record salt defeats all of this; its absence is strictly worse than a merely predictable salt.",
      simple: "Passwords are hashed with no salt, so two users with the same password get the same hash. Attackers can use ready-made rainbow tables and crack them all at once.",
      hi: "Passwords/secrets बिना किसी salt के hash होते हैं, तो identical inputs हमेशा identical hash outputs देते हैं। इससे attacker सीधे precomputed rainbow tables इस्तेमाल करता है, एक जैसा password रखने वाले हर user को तुरंत पहचानता है (equal hashes), और पूरा table एक pass में crack करता है। Unique random per-record salt यह सब हरा देता है; इसकी गैरमौजूदगी predictable salt से भी बदतर है।",
    },
    find: [
      {
        title: { en: "Look for identical hashes across records", simple: "See if the same password hashes the same", hi: "Records में identical hashes ढूंढें" },
        steps: [
          { en: "Obtain the stored hash format via your own test accounts or source; set two test accounts to the same password.", simple: "Set two test accounts to the same password and look at their hashes.", hi: "अपने test accounts या source से stored hash format लें; दो test accounts को एक ही password पर सेट करें।" },
          { en: "If their stored hashes are identical, there is no per-record salt; a bare MD5/SHA format with no salt field confirms it.", simple: "If the two hashes are identical, there is no salt.", hi: "अगर उनके stored hashes identical हैं तो कोई per-record salt नहीं; बिना salt field वाला bare MD5/SHA format इसकी पुष्टि करता है।" },
        ],
      },
    ],
    proof: {
      en: "Show hashes are unsalted — the same input yields the same hash — so rainbow tables apply and password-sharing is visible. A per-user random salt, or a bcrypt/Argon2 hash that carries its own salt, is N/A. It depends on obtaining the hash database through a separate disclosure to have real impact.",
      simple: "Show two identical passwords produce identical hashes (no salt). Random per-user salts are N/A, and it needs the hash database to matter.",
      hi: "दिखाएँ कि hashes unsalted हैं — एक ही input एक ही hash देता है — तो rainbow tables लागू होती हैं और password-sharing दिखती है। Per-user random salt, या अपना salt साथ रखने वाला bcrypt/Argon2 hash, N/A है। असली impact के लिए hash database अलग disclosure से मिलना ज़रूरी है।",
    },
    escalate: {
      en: "A salt that exists but is predictable is the Use of Predictable Salt leaf (P5); pairing missing salt with Insufficient Key Stretching (a fast hash) makes the whole database trivially crackable.",
      simple: "A guessable salt is the Predictable Salt leaf (P5); no salt plus a fast hash makes cracking trivial.",
      hi: "मौजूद पर predictable salt Use of Predictable Salt leaf (P5) है; missing salt को Insufficient Key Stretching (fast hash) के साथ मिलाना पूरे database को trivially crackable बना देता है।",
    },
  },

  "Cryptographic Weakness › Insecure Implementation › Missing Cryptographic Step": {
    what: {
      en: "A cryptographic step that the design requires is omitted entirely. Common cases: ciphertext with no integrity/MAC (so it is malleable and vulnerable to bit-flipping), a signature that is generated but never verified on receipt, certificate validation turned off on a client, or a sensitive channel left unencrypted where the design called for encryption. Unlike a mis-ordered or weak step, the step is simply absent, so the property it would provide is gone.",
      simple: "A required crypto step is left out completely — no integrity check on encrypted data, a signature never verified, or certificate checking turned off. Whatever that step was meant to protect is unprotected.",
      hi: "Design जिस cryptographic step की माँग करता है वो पूरी तरह छूट जाती है। Common cases: बिना integrity/MAC के ciphertext (malleable, bit-flipping का शिकार), generate होकर receipt पर कभी verify न होने वाली signature, client पर बंद certificate validation, या encryption की जगह unencrypted sensitive channel। Mis-ordered/weak step से उलट, step बस गैरमौजूद है, तो उसकी property चली जाती है।",
    },
    find: [
      {
        title: { en: "Map the data flow for an absent step", simple: "Check each required step is present", hi: "Absent step के लिए data flow map करें" },
        steps: [
          { en: "Trace how sensitive data is handled and check each mandated step is present: is ciphertext authenticated with a MAC/AEAD? Is each signature actually verified? Is TLS certificate validation on?", simple: "Follow the data and check: is the ciphertext authenticated? Is the signature verified? Is TLS validated?", hi: "देखें sensitive data कैसे handle होता है और हर mandated step check करें: ciphertext MAC/AEAD से authenticated है? हर signature वाकई verify होती है? TLS certificate validation on है?" },
          { en: "Where a step is missing, demonstrate the exposure — flip bits of unauthenticated ciphertext, submit an unverified signed object, or MITM a channel with no cert validation.", simple: "Prove the missing step by exploiting it (bit-flip, skip verification, MITM).", hi: "जहाँ step missing हो, exposure दिखाएँ — unauthenticated ciphertext के bits flip करें, unverified signed object भेजें, या बिना cert validation वाले channel पर MITM करें।" },
        ],
      },
    ],
    proof: {
      en: "Show the required step is absent and the resulting exposure — unauthenticated ciphertext accepted after tampering, a forged unsigned/unverified object accepted, or a connection made without certificate validation. If every required step is in fact present, it is N/A. Priority varies with the impact of the missing protection.",
      simple: "Show the step is missing and exploit the gap. If all steps are actually present, it is N/A.",
      hi: "दिखाएँ कि required step गैरमौजूद है और resulting exposure — tamper के बाद accept हुआ unauthenticated ciphertext, accept हुआ forged unsigned/unverified object, या बिना certificate validation बना connection। अगर हर required step असल में मौजूद है तो N/A। Priority missing protection के impact से बदलती है।",
    },
    escalate: {
      en: "When the step is present but implemented against its specification (wrong order, truncated, non-standard), use the Improper Following of Specification (Other) leaf instead.",
      simple: "If the step is present but done wrong, use the Improper Following of Specification leaf.",
      hi: "जब step मौजूद हो पर specification के खिलाफ़ implement हो (गलत order, truncated, non-standard), तो Improper Following of Specification (Other) leaf इस्तेमाल करें।",
    },
  },

  "Cryptographic Weakness › Weak Hash › Predictable Hash Collision": {
    what: {
      en: "A hash with practical collision attacks (MD5, SHA-1) is used where collision resistance actually matters — digital signatures, certificate issuance, file-integrity or deduplication keys, content-addressed storage. Because an attacker can craft two distinct inputs with the same digest (and with chosen-prefix collisions, two meaningful documents), they can get a benign input signed/approved and substitute a malicious one that hashes the same. Collision resistance is the broken property here, distinct from preimage resistance.",
      simple: "A weak hash like MD5 or SHA-1 is used where it must be collision-resistant (signatures, certificates, file integrity). An attacker can make two different files with the same hash, so one approved file can be swapped for a malicious one.",
      hi: "Practical collision attacks वाला hash (MD5, SHA-1) वहाँ इस्तेमाल होता है जहाँ collision resistance वाकई मायने रखती है — digital signatures, certificate issuance, file-integrity/dedup keys, content-addressed storage। Attacker एक ही digest वाले दो अलग inputs बना सकता है (chosen-prefix collisions से दो meaningful documents), तो एक benign input sign/approve कराकर उसी hash वाला malicious बदल सकता है। यहाँ टूटी property collision resistance है, preimage resistance से अलग।",
    },
    find: [
      {
        title: { en: "Find a collision-weak hash on a trust boundary", simple: "Find MD5/SHA-1 used for security", hi: "Trust boundary पर collision-weak hash ढूंढें" },
        steps: [
          { en: "Identify where MD5 or SHA-1 backs a security decision: signature/cert algorithms, file-integrity manifests, dedup or content-addressing keys.", simple: "Find where MD5/SHA-1 is used for signatures, certs, or integrity.", hi: "पहचानें कहाँ MD5 या SHA-1 security decision के पीछे है: signature/cert algorithms, file-integrity manifests, dedup/content-addressing keys।" },
          { en: "Where you control the signed/approved content, demonstrate a crafted colliding pair (chosen-prefix) so a benign item and a malicious item share the digest.", simple: "If you control the input, make two files with the same hash.", hi: "जहाँ आप signed/approved content control करें, वहाँ crafted colliding pair (chosen-prefix) दिखाएँ ताकि benign और malicious item एक ही digest share करें।" },
        ],
      },
    ],
    proof: {
      en: "Show a collision-weak hash used where collision resistance is required, ideally with a crafted colliding pair that would let a malicious input pass a check meant for a benign one. A collision-resistant hash (SHA-256/SHA-3/BLAKE2+), or MD5/SHA-1 used only as a non-adversarial checksum, is N/A.",
      simple: "Show MD5/SHA-1 used where collisions matter, ideally with a colliding pair. SHA-256+ or a plain checksum use is N/A.",
      hi: "दिखाएँ कि collision resistance ज़रूरी जगह collision-weak hash इस्तेमाल हो रहा है, आदर्श रूप से crafted colliding pair के साथ जो malicious input को benign वाले check से पास करा दे। Collision-resistant hash (SHA-256/SHA-3/BLAKE2+), या सिर्फ़ non-adversarial checksum के रूप में MD5/SHA-1, N/A है।",
    },
  },
};
