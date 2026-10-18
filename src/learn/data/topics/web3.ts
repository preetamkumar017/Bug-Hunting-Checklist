import type { TopicContent } from "@/learn/data/types";

// Per-leaf trilingual lesson content, keyed by FULL Bugcrowd VRT path.
export const web3Topics: Record<string, TopicContent> = {
  "Blockchain Infrastructure Misconfiguration › Improper Bridge Validation and Verification Logic": {
    what: {
      en: "Cross-chain bridge relays or smart contract verifiers fail to properly validate cryptographic proofs, Merkle roots, validator multi-signatures, or message replay nonces between chains. An attacker can forge deposit events or replay old cross-chain messages to mint unbacked wrapped tokens on the destination chain, draining the bridge reserves.",
      simple: "A bridge that connects two blockchains doesn't properly check deposit proofs. A hacker can fake a deposit on one chain and steal real money from the other chain.",
      hi: "Cross-chain bridge contracts या relays cryptographic proofs, multi-signatures या replay nonces को सही से validate नहीं करते। Attacker destination chain पर unbacked tokens mint करवाकर bridge reserves drain कर सकता है।",
    },
    find: [
      {
        title: { en: "Audit cross-chain message proof verification and replay guards", simple: "Check how the bridge checks deposit proofs and stops replay attacks", hi: "Bridge message proof verification और replay guards audit करें" },
        steps: [
          { en: "Inspect the bridge contract's claim/mint function for signature and proof validation logic (e.g. `ecrecover` or Merkle tree verification).", simple: "Review the code that gives out tokens on the new chain.", hi: "Destination chain पर tokens issue करने वाले function में signature और proof logic inspect करें।" },
          { en: "Verify whether message nonces or transaction hashes are permanently recorded in state mapping to prevent replay across chains.", simple: "Check if the contract remembers processed transaction IDs.", hi: "चेक करें कि क्या processed transaction hashes mapping में store होते हैं ताकि replay रोका जा सके।" },
          { en: "Test if an invalid or zeroed validator signature allows claiming assets.", simple: "Try submitting a blank or forged signature.", hi: "Zeroed या invalid signature submit करके claim attempt करें।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates bridge validation flaws as 'varies' (almost universally P1 due to systemic economic loss). Triage requires: testnet transaction hash or Foundry/Hardhat test script showing forged proof acceptance and unauthorized token release.",
      simple: "Show a Foundry test or testnet transaction where fake proofs successfully claim real bridge tokens. Usually P1.",
      hi: "Foundry test script या testnet transaction hash जिसमें forged proof accept होकर tokens withdraw हो जाएँ। High economic impact के कारण यह P1 मानी जाती है।",
    },
    cwe: "CWE-347: Improper Verification of Cryptographic Signature",
    references: [
      { label: "Rekt News: Cross-Chain Bridge Hacks", url: "https://rekt.news" },
    ],
  },

  "Decentralized Application Misconfiguration › Protocol Security Misconfiguration › Node-level Denial of Service": {
    what: {
      en: "A flaw in the blockchain node client (e.g., Geth, Nethermind, Prysm, Solana validator) allows an attacker to trigger high CPU exhaustion, memory leaks, disk fill, or unhandled panics by sending crafted RPC calls or malformed network p2p messages, crashing nodes and degrading network consensus.",
      simple: "A bug in the blockchain validator software crashes the node server when it receives a specially crafted request, taking the network down.",
      hi: "Blockchain node software (Geth, Nethermind, Solana validator) में खामी के कारण crafted RPC request या p2p message भेजकर node crash या unhandled panic trigger किया जा सकता है, जिससे consensus रुक जाता है। P1 bug है।",
    },
    find: [
      {
        title: { en: "Test node RPC endpoints and p2p parsers for resource exhaustion", simple: "Send heavy or unusual RPC commands to test if the node crashes", hi: "Node RPC endpoints पर malformed payload भेजकर crash test करें" },
        steps: [
          { en: "Audit node RPC implementations for unbounded loops or quadratic memory allocation during block/transaction parsing.", simple: "Look for functions that use too much memory on complex transactions.", hi: "Block/transaction parsing के दौरान memory leak या unbounded loop logic inspect करें।" },
          { en: "Send deep recursive or malformed JSON-RPC queries to public RPC gateways.", simple: "Send deep nested requests to the node.", hi: "Public RPC gateway पर deeply nested या malformed query भेजें।" },
          { en: "Monitor process CPU/memory usage and check if the node halts consensus participation.", simple: "Watch if the node drops out of the network.", hi: "Process CPU/RAM monitor करें और देखें कि क्या validator halt हो जाता है।" },
        ],
      },
    ],
    proof: {
      en: "Rated P1 in Bugcrowd VRT. Triage requires: a reproducible test script against a local testnode docker container showing unhandled panic or memory crash, and the specific software commit/version.",
      simple: "Provide a test script that reliably crashes a local node instance.",
      hi: "Local testnode पर crash recreate करने वाला script और node logs/panic trace दें। P1 priority है।",
    },
    cwe: "CWE-400: Uncontrolled Resource Consumption",
  },

  "Decentralized Application Misconfiguration › Marketplace Security › Orderbook Manipulation": {
    what: {
      en: "A decentralized exchange (DEX) or NFT marketplace processes off-chain orderbook signatures (e.g. Seaport, 0x protocol) or matching engine states without validating order cancellation on-chain, price bounds, or signature revocation. An attacker can execute matched orders at stale or manipulated prices, draining buyer balances or acquiring assets below fair value.",
      simple: "A bug in a crypto marketplace lets an attacker buy items using old canceled orders or fake prices, stealing items for free.",
      hi: "DEX या NFT marketplace का off-chain orderbook engine signature revocation या price sanity validate नहीं करता। Attacker cancelled या stale orders execute करवाकर assets underprice खरीद लेता है।",
    },
    find: [
      {
        title: { en: "Test off-chain orderbook cancellation and signature replay", simple: "Try using an old canceled signature to buy an item", hi: "Cancelled signature replay करके order match test करें" },
        steps: [
          { en: "Create and sign an order offer on the marketplace UI, then cancel the order.", simple: "Make an offer on an item, then hit cancel.", hi: "Marketplace पर offer sign करें, फिर cancel करें।" },
          { en: "Capture the original EIP-712 typed signature in proxy traffic before cancellation.", simple: "Save the signature from your network traffic.", hi: "Proxy से original signed EIP-712 payload save करें।" },
          { en: "Submit the saved signature directly to the matching contract or API post-cancellation to see if it fills.", simple: "Send the old signature directly to the contract to see if it still works.", hi: "Cancellation के बाद saved signature direct contract पर submit करके fill test करें।" },
        ],
      },
    ],
    proof: {
      en: "Rated P1. Triage requires: transaction proof showing an invalid or cancelled order being matched, or a Foundry test demonstrating balance extraction without authorized consent.",
      simple: "Show an order being executed after it was supposed to be cancelled.",
      hi: "Cancelled order execute होने का on-chain transaction hash या Foundry test proof दें। P1 priority है।",
    },
    cwe: "CWE-345: Insufficient Verification of Data Authenticity",
  },

  "Decentralized Application Misconfiguration › Insecure Data Storage › Plaintext Private Key": {
    what: {
      en: "A decentralized application (dApp), backend service, or client-side wallet script exposes unencrypted private keys, mnemonic seed phrases, or sensitive custody credentials in client-side JavaScript, environment files (`.env`), public Git repos, local storage, or API responses, granting full irreversible custody takeover of on-chain funds.",
      simple: "The app or backend accidentally leaves a cryptocurrency wallet's master private key or seed phrase in plain text for anyone to find.",
      hi: "dApp या backend service wallet private key या mnemonic seed phrase को client-side JavaScript, `.env` file या API response में plaintext expose कर देती है। Attacker direct wallet drain कर सकता है। Highest severity (P1) bug है।",
    },
    find: [
      {
        title: { en: "Inspect dApp bundles and network responses for raw private keys", simple: "Search app files and API responses for 64-character private keys", hi: "JavaScript bundles और API responses में private keys ढूँढें" },
        steps: [
          { en: "Grep front-end JavaScript bundles and network traffic for private key patterns (64-hex strings, `0x[a-fA-F0-9]{64}`, BIP-39 mnemonic phrase wordlists).", simple: "Search code for 64-character hex strings or 12/24 word seeds.", hi: "JS bundles और network responses में 64-hex character private keys या 12-word seeds grep करें।" },
          { en: "Check local storage and IndexedDB keys in DevTools: look for raw `privateKey` entries instead of encrypted keystores (Web Crypto API / SubtleCrypto).", simple: "Look inside your browser's Application storage tab for unencrypted keys.", hi: "DevTools के Application tab (LocalStorage/IndexedDB) में plaintext private keys inspect करें।" },
          { en: "Verify public blockchain balance of the discovered address without moving any funds.", simple: "Look up the address on Etherscan to see if it holds funds.", hi: "Etherscan पर address search करके balance verify करें (funds move न करें)।" },
        ],
      },
    ],
    proof: {
      en: "Rated P1 in Bugcrowd VRT. Triage requires: the exact location where the key was exposed, the derived public wallet address, and on-chain balance proof via blockchain explorer. DO NOT transfer any funds.",
      simple: "Show where the private key was found in plain text and its public wallet address. Never touch the funds.",
      hi: "Key exposure की exact location, derived public address, और explorer link दें। कभी भी funds transfer न करें। P1 priority है।",
    },
    cwe: "CWE-312: Cleartext Storage of Sensitive Information",
    references: [
      { label: "OWASP: Cryptographic Storage", url: "https://owasp.org/www-community/vulnerabilities/Insecure_Storage" },
    ],
  },

  "Decentralized Application Misconfiguration › Marketplace Security › Signer Account Takeover": {
    what: {
      en: "A vulnerability in the marketplace's off-chain authentication, session binding, or API verification allows an attacker to impersonate an authorized signer (e.g. marketplace operator, oracle signer, or high-volume maker), forging signed orders and approvals to drain user balances or capture transaction fees.",
      simple: "A hacker takes over the trusted signing account used by a crypto marketplace, letting them approve fake trades and steal funds.",
      hi: "Marketplace के authentication या session binding में flaw होने से attacker marketplace के trusted signer account को hijack कर लेता है, जिससे वह unauthorized trade approvals generate कर सकता है। P1 bug है।",
    },
    find: [
      {
        title: { en: "Audit signer session validation and signature authorization endpoints", simple: "Test if you can generate valid marketplace signatures using another account", hi: "Signer authentication endpoints पर unauthorized signature generation test करें" },
        steps: [
          { en: "Identify the API endpoint that issues marketplace co-signatures or fee waivers.", simple: "Find the API that signs trade approvals.", hi: "Co-signatures या fee discounts issue करने वाला API endpoint पहचानें।" },
          { en: "Test for broken access control or IDOR in the signing request: swap user addresses or API keys.", simple: "Try calling the signing API without valid credentials.", hi: "Signing request में authorization headers या signer parameters tamper करें।" },
          { en: "Verify if the server returns a valid cryptographic signature signed by the marketplace's private key.", simple: "Check if the server gives back a real admin signature.", hi: "देखें कि क्या server marketplace key से signed valid signature return करता है।" },
        ],
      },
    ],
    proof: {
      en: "Rated P1. Triage requires: the request and response demonstrating unauthorized signature generation, and on-chain contract code confirming the signature's validity.",
      simple: "Show how an unauthenticated user can get the marketplace to sign trades for them.",
      hi: "Unauthorized signature generation की HTTP request/response और contract verification proof दें। P1 priority है।",
    },
    cwe: "CWE-287: Improper Authentication",
  },

  "Decentralized Application Misconfiguration › Marketplace Security › Unauthorized Asset Transfer": {
    what: {
      en: "A smart contract flaw or marketplace logic bug allows transferring ERC-20, ERC-721, or ERC-1155 tokens out of user wallets without valid allowance, consent, or signature (e.g., abusing pre-approved operator permissions, reentrancy during transfer hooks, or missing caller checks in transfer proxies).",
      simple: "A bug in the smart contract lets someone take NFTs or tokens directly out of your wallet without your permission.",
      hi: "Marketplace contract में flaw के कारण attacker बिना user की consent या signature के user के wallet से ERC-20/NFT tokens direct transfer करवा लेता है (operator permission abuse या missing caller check)।",
    },
    find: [
      {
        title: { en: "Analyze transferFrom and permit proxy contract permissions", simple: "Check if the contract allows transferring tokens without checking allowance", hi: "Transfer proxy contract में allowance और caller validation inspect करें" },
        steps: [
          { en: "Audit the contract's `transferFrom` or trade settlement functions in the smart contract source.", simple: "Read the token transfer function in the smart contract.", hi: "Smart contract के `transferFrom` या trade settlement function का source code पढ़ें।" },
          { en: "Check if the function verifies that `msg.sender` is either the token owner or has an approved active allowance.", simple: "Check if anyone can call transferFrom on someone else's tokens.", hi: "चेक करें कि क्या `msg.sender` owner है या valid allowance रखता है।" },
          { en: "Write a Hardhat/Foundry test simulating Account B transferring Account A's tokens without Account A having called `approve()`.", simple: "Simulate taking tokens in a local test without an approval.", hi: "Foundry test लिखकर बिना approval के Account A के tokens Account B में transfer करके दिखाएँ।" },
        ],
      },
    ],
    proof: {
      en: "Rated P1 in Bugcrowd VRT. Triage requires: Foundry/Hardhat test script demonstrating unauthorized token extraction, or on-chain transaction hash on a public testnet.",
      simple: "Provide a Foundry test showing tokens moving out of a victim's wallet without approval.",
      hi: "Foundry test script या testnet transaction hash जिसमें बिना approval के tokens transfer हो जाएँ। P1 priority है।",
    },
    cwe: "CWE-285: Improper Authorization",
  },

  "Decentralized Application Misconfiguration › Marketplace Security › Malicious Order Offer": {
    what: {
      en: "An attacker creates a crafted order or auction bid containing malicious callback hooks, manipulated token addresses, or unbacked collateral that exploits the marketplace settlement contract upon acceptance, causing the victim's transaction to revert while stealing fees or locking the victim's NFT.",
      simple: "A buyer makes a malicious offer designed so that when the seller accepts it, the seller loses their item while receiving nothing in return.",
      hi: "Attacker crafted order या bid create करता है जिसमें malicious token address या transfer callback hook होता है। जब victim offer accept करता है, तो victim का asset transfer हो जाता है पर payment revert हो जाती है।",
    },
    find: [
      {
        title: { en: "Test marketplace settlement with non-standard ERC-20 or reentrant tokens", simple: "Test offers using custom tokens that fail on transfer", hi: "Non-standard ERC-20 tokens या callbacks के साथ offer settlement test करें" },
        steps: [
          { en: "Identify if the marketplace allows creating offers using arbitrary custom ERC-20 tokens rather than a strict token whitelist.", simple: "Check if you can make bids with any random custom token.", hi: "चेक करें कि क्या marketplace arbitrary ERC-20 tokens से offer allow करता है।" },
          { en: "Deploy a test ERC-20 token whose `transferFrom` returns false or reverts during settlement while executing internal logic.", simple: "Deploy a test token that fails during payment.", hi: "ऐसा test token deploy करें जो payment transfer के समय revert कर दे।" },
          { en: "Observe whether the marketplace contract releases the seller's asset before confirming payment receipt.", simple: "Check if the marketplace gives away the NFT before the payment goes through.", hi: "देखें कि क्या contract payment confirmation से पहले ही asset release कर देता है।" },
        ],
      },
    ],
    proof: {
      en: "Rated P2 in Bugcrowd VRT. Triage requires: a reproducible Foundry test showing an asset transferred to an attacker without legitimate payment delivery.",
      simple: "Show a Foundry test where an offer steals an NFT without paying for it.",
      hi: "Foundry test script जिसमें seller का asset बिना payment complete हुए transfer हो जाए। P2 priority है।",
    },
    cwe: "CWE-670: Always-Incorrect Control Flow Implementation",
  },

  "Decentralized Application Misconfiguration › Marketplace Security › Price or Fee Manipulation": {
    what: {
      en: "An attacker exploits rounding errors, decimal mismatches, or unchecked fee calculations in marketplace contracts to pay zero or near-zero protocol fees, or manipulate the final settlement price, depriving the protocol and sellers of legitimate royalties.",
      simple: "A math bug in the marketplace lets buyers round fees down to zero or pay less than the agreed price.",
      hi: "Marketplace contract में rounding error या decimal mismatch के कारण attacker protocol fees को zero कर देता है या settlement price manipulate करके कम कीमत में asset खरीद लेता है।",
    },
    find: [
      {
        title: { en: "Audit fee calculation math and decimal conversions in settlement functions", simple: "Check math in fee calculations for division before multiplication", hi: "Fee calculation में division before multiplication और rounding errors ढूँढें" },
        steps: [
          { en: "Inspect contract math in fee deduction: e.g. `fee = (price / 10000) * feePercent`.", simple: "Check the fee calculation formula in the code.", hi: "Fee calculation formula inspect करें: क्या division multiplication से पहले किया गया है?" },
          { en: "Test edge case price values (small values like 1 wei or near-zero token units) where integer division truncates fee to 0.", simple: "Try very small purchase amounts where the fee rounds to 0.", hi: "Small amounts test करें जहाँ integer division fee को truncate करके 0 कर दे।" },
          { en: "Verify whether the marketplace settles the transaction successfully with 0 fee paid.", simple: "See if the trade completes with zero fee deducted.", hi: "देखें कि क्या transaction zero fee के साथ successfully settle हो जाती है।" },
        ],
      },
    ],
    proof: {
      en: "Rated P2 in Bugcrowd VRT. Triage needs: contract source snippet with the mathematical flaw and a transaction proof showing fees bypassed.",
      simple: "Show the math error in the contract and a test transaction showing zero fees collected.",
      hi: "Flawed formula का code snippet और zero fee deduction वाली testnet transaction का proof दें। P2 priority है।",
    },
    cwe: "CWE-682: Incorrect Calculation",
  },

  "Decentralized Application Misconfiguration › Marketplace Security › OFAC Bypass": {
    what: {
      en: "A decentralized marketplace or front-end implements sanctions compliance (OFAC screening via Chainalysis or TRM Labs API) only client-side or at a superficial layer that can be easily bypassed by changing RPC endpoints, modifying request headers, or calling the smart contract directly.",
      simple: "The app blocks sanctioned crypto addresses on its website, but anyone can bypass it by calling the smart contract directly or using a VPN.",
      hi: "Marketplace OFAC sanctions compliance सिर्फ client-side UI पर implement करती है। Sanctioned user direct smart contract call करके या RPC endpoint बदलकर restriction bypass कर सकता है।",
    },
    find: [
      {
        title: { en: "Test direct contract interaction bypassing front-end geofences", simple: "Call the smart contract directly to see if sanctions checks exist on-chain", hi: "Front-end bypass करके direct smart contract call test करें" },
        steps: [
          { en: "Identify front-end checks that query sanctions screening APIs before enabling buttons.", simple: "Look for API calls to Chainalysis or TRM in the browser.", hi: "Browser network traffic में sanctions screening API calls inspect करें।" },
          { en: "Connect a test wallet flagged or simulated as blocked in client storage.", simple: "Simulate a blocked wallet address in DevTools.", hi: "DevTools में blocked wallet address simulate करें।" },
          { en: "Send the trade or transfer transaction directly to the verified contract address on Etherscan or via Cast/Foundry.", simple: "Send the transaction directly to the contract without using the website.", hi: "Website use किए बिना direct Foundry/Cast से contract call करें और देखें कि क्या execution success होता है।" },
        ],
      },
    ],
    proof: {
      en: "Rated P3 in Bugcrowd VRT. Triage requires: proof that the protocol claims compliance enforcement on all trades, and transaction evidence showing successful execution despite sanctions status.",
      simple: "Show that a blocked wallet can still execute trades directly on the contract.",
      hi: "Contract level पर sanctions enforcement missing होने का proof और direct transaction execution का screenshot दें। P3 priority है।",
    },
    cwe: "CWE-285: Improper Authorization",
  },

  "Decentralized Application Misconfiguration › Marketplace Security › Denial of Service": {
    what: {
      en: "A denial of service flaw in a marketplace contract allows an attacker to lock auctions, prevent legitimate bids, or freeze seller assets indefinitely (e.g. by setting an auction contract to refund the previous highest bidder via a raw `transfer()` to a contract that rejects Ether).",
      simple: "An attacker places a bid from a smart contract that rejects incoming refunds, making it impossible for anyone else to outbid them.",
      hi: "Marketplace contract में DoS flaw के कारण auction lock हो जाता है (जैसे previous bidder को refund करते समय raw transfer fail हो जाना)। Attacker auction freeze करके asset lock कर सकता है।",
    },
    find: [
      {
        title: { en: "Test push-payment refund patterns in auction contracts", simple: "Make a bid with a smart contract that rejects ETH refunds", hi: "Auction contract में push-payment refund rejection test करें" },
        steps: [
          { en: "Audit auction bid functions for push-over-pull payments: `previousBidder.transfer(refundAmount)`.", simple: "Look for code that sends money directly back to the previous bidder.", hi: "Code में देखें कि क्या previous bidder को direct transfer से refund भेजा जा रहा है।" },
          { en: "Deploy an attacker contract with a reverting `receive()` or `fallback()` function.", simple: "Create a simple contract that refuses to accept money.", hi: "Reverting `receive()` function वाला test contract deploy करें।" },
          { en: "Place the highest bid using the attacker contract, then attempt to outbid it from a regular wallet.", simple: "Bid from that contract and see that all future bids fail.", hi: "Attacker contract से bid लगाएँ, फिर normal wallet से outbid करने की कोशिश करें और revert observe करें।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates this as 'varies' (P2 to P4 depending on locked value). Triage requires: Foundry test code demonstrating the frozen auction and reverted legitimate bids.",
      simple: "Show a Foundry test where an auction becomes permanently stuck and cannot receive new bids.",
      hi: "Foundry test script जिसमें auction permanently lock हो जाए और legitimate bids revert हो जाएँ।",
    },
    cwe: "CWE-400: Uncontrolled Resource Consumption",
    references: [
      { label: "Solidity Documentation: Favor Pull Over Push for Payments", url: "https://docs.soliditylang.org" },
    ],
  },

  "Decentralized Application Misconfiguration › DeFi Security › Flash Loan Attack": {
    what: {
      en: "An attacker borrows millions in uncollateralized funds via flash loans (Aave, Uniswap, Balancer) within a single atomic transaction to temporarily manipulate liquidity pools, skew Automated Market Maker (AMM) spot prices, and drain a lending protocol that relies on spot balances as price oracles.",
      simple: "An attacker borrows millions of dollars for a few seconds with a flash loan, messes up the price on a decentralized exchange, and borrows real money against the fake price.",
      hi: "Attacker single transaction में flash loan लेकर liquidity pool का spot price manipulate कर देता है। Spot price पर निर्भर lending protocol से manipulated price पर collateral borrow करके protocol funds drain कर लिए जाते हैं।",
    },
    find: [
      {
        title: { en: "Audit protocol price feeds for spot AMM reserves vs TWAP/Chainlink", simple: "Check if the protocol uses spot AMM prices instead of Chainlink or TWAP", hi: "Protocol के price feed में spot reserves vs TWAP/Chainlink audit करें" },
        steps: [
          { en: "Check how the protocol values collateral: search for `getReserves()` or `balanceOf()` calls instead of Chainlink AggregatorV3 or Uniswap TWAP.", simple: "Look for getReserves() in the pricing code.", hi: "Pricing code में देखें कि क्या `getReserves()` directly use हो रहा है।" },
          { en: "Write a Foundry fork test that takes a flash loan from Aave or Uniswap v3.", simple: "Write a test that borrows a large flash loan.", hi: "Foundry fork test लिखें जो Aave से flash loan borrow करे।" },
          { en: "Swap the borrowed capital into the target pool to distort the spot price, execute the borrowing/liquidating transaction, and repay the flash loan.", simple: "Distort the pool price, borrow underpriced funds, and pay back the loan.", hi: "Spot price manipulate करके underpriced funds borrow करें और loan repay करके profit confirm करें।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates flash loan exploits as 'varies' (typically P1 due to massive economic loss). Triage requires: a reproducible Foundry test using `forge test --fork-url <RPC>` proving profitable exploitation in a single transaction block.",
      simple: "Provide a Foundry fork test demonstrating the flash loan attack draining funds profitably in one block.",
      hi: "Foundry fork test script (`forge test --fork-url`) जिसमें single block में profitable exploit और drained funds साबित हों। P1 priority है।",
    },
    cwe: "CWE-682: Incorrect Calculation",
    references: [
      { label: "Samczsun: So you want to use a Uniswap price oracle", url: "https://samczsun.com" },
    ],
  },

  "Decentralized Application Misconfiguration › DeFi Security › Function-Level Accounting Error": {
    what: {
      en: "A smart contract contains logical inconsistencies in its internal accounting state (e.g. tracking deposited balances, shares vs assets conversion, debt recalculation, or collateral ratios). Users can deposit and withdraw in patterns that gradually inflate their share balance or mint unbacked reward tokens.",
      simple: "A math or logic mistake in how the smart contract tracks your balance lets you withdraw more than you put in.",
      hi: "Smart contract के internal accounting logic (shares vs assets calculation, deposit tracking) में inconsistency होती है, जिससे user deposited amount से ज़्यादा withdraw कर लेता है या fake shares mint कर लेता है।",
    },
    find: [
      {
        title: { en: "Audit ERC-4626 vault share conversion and rounding logic", simple: "Test deposit and withdraw functions for rounding bugs that create free shares", hi: "ERC-4626 share conversion और deposit/withdraw accounting audit करें" },
        steps: [
          { en: "Audit `convertToShares` and `convertToAssets` functions in yield vault contracts.", simple: "Inspect the share conversion math in the contract.", hi: "Vault contract में `convertToShares` और `convertToAssets` formulas inspect करें।" },
          { en: "Test the inflation attack on empty vaults: deposit 1 wei, donate large assets directly to the contract, and test if subsequent users lose their deposit to rounding down.", simple: "Test what happens when the first deposit is 1 wei followed by a direct token donation.", hi: "Empty vault में 1 wei deposit + direct donation करके rounding down inflation attack test करें।" },
          { en: "Simulate rapid deposit-withdraw loops in Foundry to verify if the attacker's balance increases over iterations.", simple: "Run deposit and withdraw in a loop in Foundry to see if balance grows.", hi: "Foundry में deposit/withdraw loop run करके देखें कि क्या balance increase होता है।" },
        ],
      },
    ],
    proof: {
      en: "Priority varies (P1–P3). Triage requires: Foundry test reproducing the accounting desynchronization and demonstrating stolen vault assets.",
      simple: "Show a Foundry test where repeating an action generates free tokens or drains the vault.",
      hi: "Foundry test script जिसमें accounting error exploit होकर vault drained साबित हो।",
    },
    cwe: "CWE-682: Incorrect Calculation",
  },

  "Decentralized Application Misconfiguration › DeFi Security › Improper Implementation of Governance": {
    what: {
      en: "A Decentralized Autonomous Organization (DAO) or governance smart contract has flaws in proposal thresholds, voting weight snapshots, timelock bypasses, or quorum calculations. An attacker can use flash loans or temporary voting power delegation to pass and execute malicious proposals that drain treasury funds or grant admin roles.",
      simple: "Flaws in a DAO voting system allow a hacker to borrow voting power with a flash loan, vote for a malicious proposal, and steal the treasury funds.",
      hi: "DAO governance contracts में voting snapshot या timelock flaws होते हैं। Attacker flash loan से governance tokens borrow करके malicious proposal pass करवा सकता है और treasury drain कर सकता है।",
    },
    find: [
      {
        title: { en: "Audit voting power snapshot mechanisms and timelock delays", simple: "Check if voting power is snapshotted before proposal creation", hi: "Governance voting snapshot और timelock delay audit करें" },
        steps: [
          { en: "Check if voting power uses historical block snapshots (`getPastVotes(account, blockNumber)`) or current balances (`balanceOf(account)`).", simple: "Check if votes use current balance instead of past block balance.", hi: "चेक करें कि क्या voting power current balance से count होती है या past block snapshot से।" },
          { en: "Inspect the timelock contract to verify if the delay can be bypassed or queued proposals can be executed instantly.", simple: "Check if the timelock can be skipped.", hi: "Timelock delay inspect करें कि क्या minimum waiting period bypass किया जा सकता है।" },
          { en: "Test if flash-loaned tokens can vote on proposals created in the same block.", simple: "Test voting with flash-loaned tokens in Foundry.", hi: "Foundry में flash-loaned tokens से same block में vote करने का test करें।" },
        ],
      },
    ],
    proof: {
      en: "Priority varies (typically P1 for treasury takeover). Triage requires: a Foundry test showing a proposal passed and executed via flash voting power.",
      simple: "Provide a test showing an unauthorized proposal draining treasury funds.",
      hi: "Foundry test script जिसमें governance bypass करके treasury funds withdraw हो जाएँ। P1 priority मानी जाती है।",
    },
    cwe: "CWE-285: Improper Authorization",
  },

  "Decentralized Application Misconfiguration › Marketplace Security › Improper Validation and Checks For Deposits and Withdrawals": {
    what: {
      en: "A centralized or hybrid exchange/marketplace backend credits user balances based on unconfirmed or reorg-vulnerable transactions, fails to verify destination contract addresses, or permits double-spending across deposit handlers (e.g. treating ERC-777 transfer hooks as multiple separate deposits).",
      simple: "The exchange credits your account before the crypto transaction confirms, or mistakes one deposit for two, letting you withdraw free money.",
      hi: "Exchange/Marketplace backend unconfirmed transactions पर balance credit कर देता है या deposit transaction hash दोबारा process करके double credit कर देता है।",
    },
    find: [
      {
        title: { en: "Test deposit transaction hash replay and reorg handling", simple: "Test if the backend credits the same deposit transaction twice", hi: "Deposit transaction hash replay और confirmation depth test करें" },
        steps: [
          { en: "Deposit test assets on-chain and monitor the backend API endpoint registering deposits.", simple: "Watch the API that detects incoming crypto deposits.", hi: "Incoming deposit detect करने वाले API endpoint को monitor करें।" },
          { en: "Replay the deposit notification API call with the same transaction hash or re-send with minor casing variations.", simple: "Try submitting the same deposit transaction ID again.", hi: "वही transaction hash दुबारा submit करके double credit check करें।" },
          { en: "Test deposits using tokens that have reentrancy transfer hooks (ERC-777) to observe if balance is credited multiple times.", simple: "Test ERC-777 tokens that notify sender on transfer.", hi: "ERC-777 tokens से deposit करके देखें कि क्या multiple credits होते हैं।" },
        ],
      },
    ],
    proof: {
      en: "Priority varies (typically P1). Triage requires: HTTP requests and on-chain proofs showing an account balance credited without corresponding on-chain funds.",
      simple: "Show your account balance increasing without real funds being deposited.",
      hi: "Double-credit request और account balance inflate होने का screenshot प्रमाण दें। P1 priority है।",
    },
    cwe: "CWE-670: Always-Incorrect Control Flow Implementation",
  },

  "Decentralized Application Misconfiguration › Improper Authorization › Insufficient Signature Validation": {
    what: {
      en: "A smart contract verifies ECDSA signatures (using `ecrecover` or OpenZeppelin's `ECDSA.sol`) without properly checking for signature malleability (`s` value in lower half of secp256k1 curve), zero address validation (`ecrecover` returning `address(0)` on error), or missing nonces and domain separators (EIP-712), allowing signature replay and spoofing.",
      simple: "The smart contract checks cryptographic signatures incorrectly, allowing attackers to reuse old signatures or forge approvals.",
      hi: "Smart contract `ecrecover` use करते समय signature malleability, zero address check (`address(0)`) या replay nonces validate नहीं करता। Attacker signature replay करके unauthorized actions execute करवा सकता है।",
    },
    find: [
      {
        title: { en: "Audit ecrecover calls for missing zero check and malleability", simple: "Look for ecrecover in the code and test if address(0) is checked", hi: "ecrecover में address(0) check और s-value malleability audit करें" },
        steps: [
          { en: "Search contract code for `ecrecover(hash, v, r, s)`.", simple: "Find ecrecover in the smart contract source.", hi: "Smart contract में `ecrecover` calls search करें।" },
          { en: "Check if the return value is compared against `address(0)`: if an uninitialized signer variable is also `address(0)`, an invalid signature evaluates to true.", simple: "See if an invalid signature that returns address(0) matches an empty owner variable.", hi: "चेक करें कि क्या return value `address(0)` से check होती है और uninitialized variables से match तो नहीं होती।" },
          { en: "Check for missing replay protection: verify if nonces and `block.chainid` are enforced.", simple: "Check if the signature includes a nonce and chain ID.", hi: "Verify करें कि signature में nonce और chainId include हैं या नहीं।" },
        ],
      },
    ],
    proof: {
      en: "Priority varies (P1–P3). Triage requires: a Foundry test proving that an invalid signature or malleated signature (`s' = n - s`) is accepted by the contract.",
      simple: "Provide a Foundry test showing the contract accepting an invalid or replayed signature.",
      hi: "Foundry test script जिसमें invalid या malleated signature accept होकर unauthorized transaction execute हो जाए।",
    },
    cwe: "CWE-347: Improper Verification of Cryptographic Signature",
    references: [
      { label: "OpenZeppelin: Signature Malleability in ECDSA", url: "https://docs.openzeppelin.com" },
    ],
  },

  "Decentralized Application Misconfiguration › Marketplace Security › Miscalculated Accounting Logic": {
    what: {
      en: "A mathematical or logical error in a marketplace's settlement formula (e.g. fee calculation, royalty distribution, or currency conversion) misallocates payouts between buyer, seller, and protocol, resulting in locked funds or balance draining.",
      simple: "A math bug in how a marketplace splits payments causes money to be sent to the wrong people or locked up.",
      hi: "Marketplace के payout calculation formula में mathematical error की वजह से buyer, seller और protocol के बीच funds का बंटवारा गलत हो जाता है और money drain या lock हो जाती है।",
    },
    find: [
      {
        title: { en: "Audit settlement equations for precision loss and improper summation", simple: "Check if total payouts exceed total deposited payment", hi: "Settlement math में precision loss और sum mismatch audit करें" },
        steps: [
          { en: "Review the settlement code where price is distributed: `payout = price - fee - royalty`.", simple: "Read the payout math in the contract.", hi: "Payout distribution code inspect करें।" },
          { en: "Verify whether rounding or order of operations causes the sum of outputs to exceed the input payment.", simple: "Check if the math allows withdrawing more than was paid in.", hi: "चेक करें कि क्या rounding के कारण total outputs input से ज़्यादा हो जाते हैं।" },
          { en: "Test edge case price inputs in Foundry.", simple: "Run edge cases in Foundry.", hi: "Foundry में edge-case numbers से test करें।" },
        ],
      },
    ],
    proof: {
      en: "Priority varies (P2–P4). Triage requires: contract code reference and a Foundry test demonstrating the mathematical mismatch.",
      simple: "Show the math error in the contract and a test proving the payout is incorrect.",
      hi: "Flawed calculation का code snippet और mismatch demonstrate करने वाला Foundry test दें।",
    },
    cwe: "CWE-682: Incorrect Calculation",
  },

  "Decentralized Application Misconfiguration › DeFi Security › Pricing Oracle Manipulation": {
    what: {
      en: "A DeFi lending protocol, synthetic asset platform, or derivatives contract relies on an insecure or easily manipulated price feed (e.g., spot AMM reserves, low-liquidity Uniswap v2/v3 pools, or off-chain APIs without outlier filtering) to value collateral and liquidations. An attacker manipulates the underlying pool to borrow against inflated collateral or trigger liquidations on healthy positions.",
      simple: "A lending app looks at a small decentralized exchange to check coin prices. A hacker moves the price on that exchange for one second to borrow real money and run away.",
      hi: "DeFi lending protocol collateral value determine करने के लिए vulnerable price feed (जैसे single AMM spot pool) use करता है। Attacker pool का price manipulate करके inflated collateral पर borrow कर लेता है।",
    },
    find: [
      {
        title: { en: "Audit oracle feed implementation for manipulation resilience", simple: "Check what price oracle the contract uses and if it can be moved", hi: "Oracle feed source और TWAP/Chainlink implementation audit करें" },
        steps: [
          { en: "Locate the oracle contract: check if it calls Chainlink `latestRoundData()` or directly reads Uniswap reserves.", simple: "Find the function that checks token prices.", hi: "Price feed function ढूँढें: क्या Chainlink use हो रहा है या direct pool reserves?" },
          { en: "If Chainlink is used, verify if stale price checks (`updatedAt < block.timestamp - maxDelay`) and `answeredInRound` validations are implemented.", simple: "Check if the code handles stale or crashed Chainlink prices.", hi: "Chainlink implementation में stale price checks (`updatedAt`) verify करें।" },
          { en: "If an on-chain AMM is used, check if the liquidity required to move the price by 50% is economically viable within a flash loan transaction.", simple: "Calculate how much money it takes to move the price in the pool.", hi: "Calculate करें कि pool का price 50% skew करने के लिए कितनी liquidity की आवश्यकता है।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates oracle manipulation as 'varies' (almost always P1 when economic loss is proven). Triage requires: a Foundry mainnet-fork test demonstrating the pool manipulation and subsequent undercollateralized borrowing.",
      simple: "Provide a Foundry fork test demonstrating the oracle being moved and funds drained.",
      hi: "Foundry fork test script जिसमें oracle manipulation से protocol funds drain होना साबित हो। P1 priority है।",
    },
    cwe: "CWE-682: Incorrect Calculation",
    references: [
      { label: "Chainlink: Best Practices for Smart Contract Oracles", url: "https://docs.chain.link" },
    ],
  },

  "Decentralized Application Misconfiguration › Insecure Data Storage › Sensitive Information Exposure": {
    what: {
      en: "A decentralized application or smart contract system stores sensitive confidential data (e.g., secret bidding values, encrypted payloads with hardcoded keys, personal user identities, or API tokens) directly on a public blockchain state or in publicly readable IPFS/Arweave metadata, forgetting that all blockchain storage is publicly inspectable.",
      simple: "The developers put private information or passwords on the blockchain, forgetting that anyone in the world can read the blockchain's memory.",
      hi: "dApp या smart contract sensitive data (private bidding values, API keys, personal user info) public blockchain storage या IPFS पर store कर देता है। Blockchain का सारा data public होता है, इसलिए यह immediately expose हो जाता है।",
    },
    find: [
      {
        title: { en: "Inspect private contract storage slots using eth_getStorageAt", simple: "Read private smart contract storage variables using web3 tools", hi: "Web3 tools और eth_getStorageAt से private contract storage slots inspect करें" },
        steps: [
          { en: "Audit Solidity code for variables marked `private` containing sensitive data (passwords, secrets).", simple: "Look for 'private' variables in the Solidity code that hold secrets.", hi: "Solidity code में `private` marked variables ढूँढें जिनमें sensitive data हो।" },
          { en: "Use `cast storage <contract_address> <slot>` or `web3.eth.getStorageAt()` to query the raw byte value of that storage slot directly from an RPC node.", simple: "Run cast storage in terminal to read the slot directly.", hi: "`cast storage <address> <slot>` चलाकर slot की raw hex value read करें।" },
          { en: "Decode the hex bytes to ASCII to demonstrate that the 'private' data is completely public.", simple: "Convert the hex bytes to text to read the secret.", hi: "Hex bytes को text में decode करके साबित करें कि secret publicly readable है।" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates this as 'varies' (P2 to P4 depending on sensitivity). Triage requires: the contract address, slot index, the CLI query command, and the decoded sensitive secret.",
      simple: "Show the contract address, the slot number, and the secret you read from it.",
      hi: "Contract address, storage slot index, `cast storage` command, और decoded secret का screenshot दें।",
    },
    cwe: "CWE-312: Cleartext Storage of Sensitive Information",
  },

  "Smart Contract Misconfiguration › Reentrancy Attack": {
    what: {
      en: "A smart contract makes an external call (transferring ETH via `call{value: ...}(\"\")`, calling an untrusted ERC-721 receiver hook, or invoking an external contract) before updating its internal state balance (violating the Checks-Effects-Interactions pattern). A malicious contract can recursively call back into the vulnerable function before the balance is decremented, draining all contract funds.",
      simple: "A contract sends money to an attacker before updating its records. The attacker's code quickly calls the withdrawal function again and again, draining all the money before the first balance is deducted.",
      hi: "Smart contract internal balance update करने से पहले external ETH transfer (`call{value: ...}`) करता है (Checks-Effects-Interactions pattern का उल्लंघन)। Attacker contract recursive callback करके balance zero होने से पहले contract के सारे funds drain कर लेता है। P1 bug है।",
    },
    find: [
      {
        title: { en: "Inspect external call ordering against state variable updates", simple: "Check if the contract sends money before reducing the user balance", hi: "External call और balance update की sequence inspect करें" },
        steps: [
          { en: "Audit withdraw/claim functions: look for `(bool success, ) = msg.sender.call{value: amount}(\"\")` appearing before `balances[msg.sender] -= amount`.", simple: "Look for money transfer lines that happen before balance subtraction.", hi: "Withdraw function में देखें कि क्या ETH transfer line `balances[msg.sender] -= amount` से पहले लिखी है।" },
          { en: "Check if the function is protected by OpenZeppelin's `nonReentrant` modifier (ReentrancyGuard).", simple: "Check if the nonReentrant word is missing.", hi: "चेक करें कि क्या `nonReentrant` modifier missing है।" },
          { en: "Write an attacker contract in Foundry implementing a `receive()` fallback that re-calls the vulnerable function, draining the balance in a single transaction.", simple: "Write a small contract in Foundry that calls withdraw inside receive().", hi: "Foundry में attacker contract लिखकर `receive()` में recursive call करें और funds drain करें।" },
        ],
      },
    ],
    proof: {
      en: "Rated P1 in Bugcrowd VRT. Triage requires: a reproducible Foundry test script (`forge test`) demonstrating recursive invocation and complete fund extraction.",
      simple: "Provide a Foundry test showing the attacker contract draining the funds via reentrancy.",
      hi: "Foundry test script (`forge test`) जिसमें recursive call से contract balance drain होना साबित हो। P1 priority है।",
    },
    cwe: "CWE-841: Improper Enforcement of Behavioral Workflow",
    references: [
      { label: "Solidity Documentation: Reentrancy", url: "https://docs.soliditylang.org" },
    ],
  },

  "Smart Contract Misconfiguration › Smart Contract Owner Takeover": {
    what: {
      en: "A critical flaw in contract initialization or access control (e.g. an uninitialized proxy implementation contract, missing `onlyOwner` modifier on administrative functions, or public visibility on `initialize()`) allows an attacker to assign themselves as the contract owner, gaining unilateral control over fund withdrawals, upgrades, and pause controls.",
      simple: "A bug in the smart contract's setup lets an attacker call the setup function again and make themselves the owner of the contract.",
      hi: "Initialization या access control flaw के कारण (जैसे uninitialized proxy implementation या public `initialize()` function) attacker खुद को contract owner बना लेता है, जिससे contract के funds और upgrade rights hijack हो जाते हैं। Top P1 bug है।",
    },
    find: [
      {
        title: { en: "Audit proxy initializer functions and owner assignment modifiers", simple: "Check if initialize() can be called by anyone on the live contract", hi: "Proxy initializer functions और owner assignment logic audit करें" },
        steps: [
          { en: "Check upgradeable proxy contracts: verify if the logic implementation contract called `_disableInitializers()` in its constructor.", simple: "Check if initialize() can be called on the implementation contract.", hi: "Check करें कि क्या implementation contract के constructor में `_disableInitializers()` call हुआ है।" },
          { en: "Look for administrative setter functions (`setOwner`, `transferOwnership`) that lack access control checks (`onlyOwner`).", simple: "Look for functions that change the owner without checking who is calling.", hi: "ऐसे functions ढूँढें जो बिना `onlyOwner` modifier के owner change कर देते हों।" },
          { en: "Call the function from an unprivileged wallet to verify if owner storage is overwritten.", simple: "Call the function from your wallet to take ownership.", hi: "Unprivileged wallet से function call करके check करें कि क्या owner variable change हुआ।" },
        ],
      },
    ],
    proof: {
      en: "Rated P1 in Bugcrowd VRT. Triage requires: the contract address, vulnerable function name, and transaction proof showing the caller successfully becoming the owner.",
      simple: "Show the transaction where your test wallet became the owner of the contract.",
      hi: "Contract address, vulnerable function name, और test wallet के owner बनने का on-chain transaction hash दें। P1 priority है।",
    },
    cwe: "CWE-285: Improper Authorization",
    references: [
      { label: "OpenZeppelin: Initializing Upgradeable Contracts", url: "https://docs.openzeppelin.com" },
    ],
  },

  "Smart Contract Misconfiguration › Unauthorized Transfer of Funds": {
    what: {
      en: "A smart contract allows an unauthorized user to withdraw or transfer native cryptocurrency (ETH, MATIC, BNB) or ERC-20 tokens directly out of the contract vault due to missing caller validation, logic flaws in accounting, or public access on internal withdrawal routines.",
      simple: "Anyone can call the withdraw function in the smart contract and take the contract's money without having deposited anything.",
      hi: "Smart contract में caller validation missing होने के कारण कोई भी unauthorized user contract vault से ETH या ERC-20 tokens direct withdraw कर सकता है। Highest severity (P1) bug है।",
    },
    find: [
      {
        title: { en: "Audit withdrawal functions for missing caller identity verification", simple: "Test if the withdraw function checks your balance or if you are the owner", hi: "Withdrawal functions में caller identity और balance check audit करें" },
        steps: [
          { en: "Inspect functions that transfer value (`transfer()`, `send()`, `call{value: ...}`): check if they enforce `require(balances[msg.sender] >= amount)` or `onlyOwner`.", simple: "Check all functions that send money out of the contract.", hi: "Value transfer करने वाले functions inspect करें: क्या caller balance या ownership check enforce है?" },
          { en: "Test calling the withdrawal function from an account with zero balance.", simple: "Call the function from an empty test wallet.", hi: "Zero balance वाले test wallet से withdrawal function call करें।" },
          { en: "Observe whether the contract executes the transfer successfully.", simple: "Watch if the contract sends you the funds anyway.", hi: "देखें कि क्या contract funds transfer execute कर देता है।" },
        ],
      },
    ],
    proof: {
      en: "Rated P1 in Bugcrowd VRT. Triage requires: a Foundry test or public testnet transaction demonstrating an account with 0 deposited funds successfully withdrawing contract reserves.",
      simple: "Show a test where a wallet with zero balance drains funds from the contract.",
      hi: "Foundry test script या testnet transaction hash जिसमें zero balance वाला wallet contract reserves withdraw कर ले। P1 priority है।",
    },
    cwe: "CWE-285: Improper Authorization",
  },

  "Smart Contract Misconfiguration › Uninitialized Variables": {
    what: {
      en: "A smart contract declares state variables (such as owner address, administrative threshold, or implementation pointer) without initializing them, leaving them at default zero values (`address(0)`, `uint256(0)`). If contract logic treats default values as valid states (e.g. checking `require(msg.sender == owner)` where owner is `address(0)` and sender can be manipulated), critical access controls break.",
      simple: "The contract developer forgot to set an important variable like the owner's address, leaving it at zero and breaking security checks.",
      hi: "Smart contract state variables (जैसे owner address) declare करता है पर initialize करना भूल जाता है, जिससे उनकी default value zero (`address(0)`) रह जाती है। अगर logic zero value को safely handle न करे तो critical access controls bypass हो जाते हैं।",
    },
    find: [
      {
        title: { en: "Audit storage layouts and constructors for unassigned state variables", simple: "Check if critical variables like owner are left unassigned", hi: "Constructor और storage layout में unassigned state variables ढूँढें" },
        steps: [
          { en: "Review contract state variables: verify if all addresses and critical parameters are initialized in constructor or `initialize()`.", simple: "Check if all variables have starting values set in the code.", hi: "Contract state variables inspect करें: क्या सभी addresses constructor में initialized हैं?" },
          { en: "Check storage slots on-chain using `cast storage <address> <slot>` to confirm if slots contain all zeros.", simple: "Read the storage slot using cast to see if it is empty.", hi: "`cast storage` से slot check करें कि क्या वह zero (`0x000...`) है।" },
          { en: "Identify functions that behave unexpectedly when variables are zero.", simple: "See what happens when the variable is zero.", hi: "देखें कि variable zero होने पर कौन से functions access control fail करते हैं।" },
        ],
      },
    ],
    proof: {
      en: "Rated P1 in Bugcrowd VRT. Triage requires: proof of the uninitialized variable on-chain and a demonstration of the security bypass caused by the default value.",
      simple: "Show the empty storage slot and a test where it allows unauthorized access.",
      hi: "Uninitialized storage slot का proof और default value से access control bypass होने का test script दें। P1 priority है।",
    },
    cwe: "CWE-457: Use of Uninitialized Variable",
  },

  "Smart Contract Misconfiguration › Integer Overflow / Underflow": {
    what: {
      en: "Arithmetic operations exceed the maximum (overflow) or drop below the minimum (underflow) storage limits of the integer type without reverting. In Solidity versions prior to 0.8.0 without OpenZeppelin's `SafeMath`, subtracting 1 from a `uint256` value of 0 wraps around to `2^256 - 1`, giving an attacker an astronomical balance.",
      simple: "In older smart contracts, subtracting 1 from zero wraps around to the largest possible number in the universe, giving an attacker infinite tokens.",
      hi: "Solidity 0.8.0 से पुराने contracts में बिना SafeMath के arithmetic operations overflow/underflow हो जाते हैं। 0 में से 1 घटाने पर value wrap होकर `2^256 - 1` हो जाती है, जिससे attacker को massive token balance मिल जाता है।",
    },
    find: [
      {
        title: { en: "Audit Solidity version and raw arithmetic operations", simple: "Check if the contract uses Solidity <0.8.0 without SafeMath", hi: "Solidity version <0.8.0 और raw arithmetic operations inspect करें" },
        steps: [
          { en: "Check contract pragma version: if `<0.8.0`, check whether OpenZeppelin `SafeMath` is used for all arithmetic.", simple: "Look at the Solidity version at the top of the file.", hi: "Contract का pragma version चेक करें: क्या यह 0.8.0 से पुराना है?" },
          { en: "If Solidity `>=0.8.0`, check if raw arithmetic is wrapped inside `unchecked { ... }` blocks without manual bounds checks.", simple: "Look for unchecked { } blocks in modern contracts.", hi: "Modern contracts में देखें कि क्या arithmetic `unchecked { ... }` block में wrapped है।" },
          { en: "Test underflow: transfer 1 token from a balance of 0 to observe wrap-around.", simple: "Try spending more than you have to see if balance wraps to maximum.", hi: "Foundry test में 0 balance से transfer करके wrap-around observe करें।" },
        ],
      },
    ],
    proof: {
      en: "Rated P2 in Bugcrowd VRT. Triage requires: a Foundry test showing a balance wrapping around to a massive number without reverting.",
      simple: "Provide a Foundry test showing an underflow resulting in a huge balance.",
      hi: "Foundry test script जिसमें arithmetic wrap-around से balance maximize होना साबित हो। P2 priority है।",
    },
    cwe: "CWE-190: Integer Overflow or Wraparound",
  },

  "Smart Contract Misconfiguration › Unauthorized Smart Contract Approval": {
    what: {
      en: "An application or smart contract permits granting ERC-20 `approve()` or ERC-721 `setApprovalForAll()` permissions without user consent, or tricks users into signing permit messages (EIP-2612) that grant an attacker full withdrawal access over their tokens.",
      simple: "A trick or bug allows someone to set an approval on your wallet, letting them spend your tokens without you agreeing.",
      hi: "Smart contract flaw या phishing permit message (EIP-2612) के ज़रिए attacker user के wallet से unauthorized token approval ले लेता है, जिससे वह user के tokens spend कर सकता है।",
    },
    find: [
      {
        title: { en: "Inspect permit and approval validation mechanisms", simple: "Check how the app handles token approvals and EIP-2612 permit messages", hi: "Token approval और permit validation logic audit करें" },
        steps: [
          { en: "Audit contract permit functions for signature replay and unauthorized spender addresses.", simple: "Inspect how permit signatures are verified.", hi: "Permit functions में signature validation और spender address inspect करें।" },
          { en: "Test if unprivileged users can call approval functions on behalf of others.", simple: "Try calling approve on another user's tokens.", hi: "चेक करें कि क्या unprivileged user दूसरों के tokens approve कर सकता है।" },
        ],
      },
    ],
    proof: {
      en: "Rated P2 in Bugcrowd VRT. Triage requires: transaction proof showing an approval granted without proper signature authorization.",
      simple: "Show an approval granted without the owner's signature.",
      hi: "बिना valid signature के approval grant होने का transaction proof दें। P2 priority है।",
    },
    cwe: "CWE-285: Improper Authorization",
  },

  "Smart Contract Misconfiguration › Function-level Denial of Service": {
    what: {
      en: "A smart contract function can be rendered permanently uncallable or broken for all users (e.g. by causing an unbounded array loop that exceeds the block gas limit, or triggering an unexpected revert in a shared execution path).",
      simple: "A hacker can cause a specific function in a smart contract to permanently crash or run out of gas for everyone.",
      hi: "Smart contract का specific function permanently block हो जाता है (जैसे unbounded loop जो block gas limit exceed कर दे या shared path पर unhandled revert)।",
    },
    find: [
      {
        title: { en: "Audit loops over dynamic arrays for gas exhaustion", simple: "Look for loops over arrays that grow without limit", hi: "Dynamic arrays पर चलने वाले loops में gas exhaustion inspect करें" },
        steps: [
          { en: "Identify functions that iterate over an array that anyone can grow: `for (uint i = 0; i < users.length; i++)`.", simple: "Find loops that go through every user in the contract.", hi: "ऐसे loops ढूँढें जो users द्वारा बढ़ाई जा सकने वाली dynamic arrays पर चलते हों।" },
          { en: "Add hundreds of dummy entries into the array in Foundry.", simple: "Add many items to the list in a test.", hi: "Foundry test में array में multiple entries add करें।" },
          { en: "Observe the transaction exceeding the block gas limit (30,000,000 gas) and reverting permanently.", simple: "Watch the function fail because it uses too much gas.", hi: "देखें कि क्या function block gas limit exceed करके permanently revert करने लगता है।" },
        ],
      },
    ],
    proof: {
      en: "Rated P3 in Bugcrowd VRT. Triage requires: a Foundry test showing the function permanently reverting due to gas limit or state deadlock.",
      simple: "Provide a test showing the function running out of gas and becoming permanently unusable.",
      hi: "Foundry test script जिसमें function permanently uncallable/reverting हो जाए। P3 priority है।",
    },
    cwe: "CWE-400: Uncontrolled Resource Consumption",
  },

  "Smart Contract Misconfiguration › Improper Fee Implementation": {
    what: {
      en: "A smart contract charges transaction fees, minting fees, or protocol royalties incorrectly (e.g. charging fees in inverted token denominations, applying percentage math backwards, or deducting fees without transferring them to the treasury).",
      simple: "The contract charges fees incorrectly, calculating the wrong percentage or losing the fees.",
      hi: "Smart contract protocol fees या royalties गलत तरीके से deduct करता है (percentage calculation उल्टी होना या treasury में transfer न होना)।",
    },
    find: [
      {
        title: { en: "Audit fee calculation and treasury transfer calls", simple: "Check if the fee taken matches the documented percentage", hi: "Fee calculation formula और treasury transfer balance inspect करें" },
        steps: [
          { en: "Inspect the fee calculation code: check basis points math (`fee = (amount * bps) / 10000`).", simple: "Review the fee percentage formula.", hi: "Basis points formula inspect करें: `(amount * bps) / 10000`।" },
          { en: "Verify whether the fee is actually transferred to the protocol treasury address.", simple: "Check where the fee money goes.", hi: "Verify करें कि क्या fee protocol treasury address में वास्तव में transfer होती है।" },
        ],
      },
    ],
    proof: {
      en: "Rated P3 in Bugcrowd VRT. Triage requires: contract code references and transaction logs showing incorrect fee distribution.",
      simple: "Show the fee math error and a transaction showing incorrect fee deduction.",
      hi: "Code snippet और incorrect fee deduction का transaction proof दें। P3 priority है।",
    },
    cwe: "CWE-682: Incorrect Calculation",
  },

  "Smart Contract Misconfiguration › Irreversible Function Call": {
    what: {
      en: "A critical state-changing function (such as burning liquidity, destroying upgrade keys, or permanently setting fee rates) has no confirmation check, emergency stop, or reversibility mechanism, and can be triggered accidentally or maliciously to permanently impair contract functionality.",
      simple: "A button in the smart contract makes a permanent change that can never be undone, permanently breaking features.",
      hi: "Critical state-changing function (जैसे permanent fee setting या burning keys) irreversible होता है और बिना confirmation के call होकर contract की functionality permanently impair कर सकता है।",
    },
    find: [
      {
        title: { en: "Audit irreversible state transitions and admin setter functions", simple: "Check functions that permanently lock or change contract states", hi: "Irreversible state transitions और permanent setters inspect करें" },
        steps: [
          { en: "Identify functions that set one-way flags: e.g. `isLocked = true` without an unlock mechanism.", simple: "Find functions that flip a switch that can never be flipped back.", hi: "ऐसे functions ढूँढें जो irreversible flags set करते हैं।" },
          { en: "Check if lack of two-step confirmation allows irreversible state changes.", simple: "See if a single click can lock the contract forever.", hi: "चेक करें कि क्या single call से permanent state change हो जाता है।" },
        ],
      },
    ],
    proof: {
      en: "Rated P3 in Bugcrowd VRT. Triage requires: contract code snippet and demonstration of the permanent impairment.",
      simple: "Show the code that permanently locks the contract without a way back.",
      hi: "Code reference और permanent impairment demonstrate करने वाला proof दें। P3 priority है।",
    },
    cwe: "CWE-670: Always-Incorrect Control Flow Implementation",
  },

  "Smart Contract Misconfiguration › Malicious Superuser Risk": {
    what: {
      en: "A smart contract grants an administrative superuser account (e.g. single private key `owner`) unrestricted capabilities to unilaterally withdraw all user deposits, pause trading indefinitely, or change contract logic via instant un-timelocked upgrades, creating a severe centralized rug-pull / custody risk.",
      simple: "A single private key has the power to steal all user funds or change the rules instantly with no timelock or multisig.",
      hi: "Smart contract single administrative key को बिना timelock या multisig के सारे user funds withdraw करने या contract logic बदलने का unconstrained power देता है (centralized rug-pull risk)।",
    },
    find: [
      {
        title: { en: "Inspect privileged admin functions and timelock architecture", simple: "Check if the admin can drain user funds without a timelock or multisig", hi: "Admin functions में timelock और multisig protections audit करें" },
        steps: [
          { en: "Audit functions protected by `onlyOwner`: look for emergency withdraw functions that sweep all tokens.", simple: "Look for functions only the owner can call that withdraw everything.", hi: "`onlyOwner` functions inspect करें: क्या कोई direct sweep/withdraw function मौजूद है?" },
          { en: "Check on-chain owner address on Etherscan: determine if it is an EOA (single key) rather than a Gnosis Safe multisig with a Timelock controller.", simple: "Check if the owner is a normal wallet instead of a multisig.", hi: "Etherscan पर owner address check करें: क्या यह single EOA wallet है या Gnosis Safe multisig?" },
        ],
      },
    ],
    proof: {
      en: "Bugcrowd rates Malicious Superuser Risk as P3. Triage requires: proof that the owner address is a single EOA and evidence of unrestricted sweep/drain capabilities.",
      simple: "Show that a single wallet has the power to drain the contract instantly.",
      hi: "Owner address EOA होने का proof और unrestricted fund draining function का code reference दें। P3 priority है।",
    },
    cwe: "CWE-284: Improper Access Control",
  },

  "Smart Contract Misconfiguration › Improper Decimals Implementation": {
    what: {
      en: "A smart contract assumes all ERC-20 tokens use standard 18 decimals (like ETH/DAI) and fails to account for non-standard decimals (e.g. USDC and USDT use 6 decimals, Gemini USD uses 2). Calculating values assuming 18 decimals leads to severe over-crediting or under-crediting of token balances by a factor of 10^12.",
      simple: "The contract assumes every token has 18 decimal places. When using USDC (which has 6), the contract does math off by a factor of 1,000,000,000,000.",
      hi: "Smart contract मान लेता है कि सभी ERC-20 tokens 18 decimals use करते हैं। USDC/USDT जैसे 6-decimal tokens के साथ math करने पर calculations 10^12 factor से गलत हो जाती हैं।",
    },
    find: [
      {
        title: { en: "Audit token decimal assumptions in multi-token protocols", simple: "Check if the code hardcodes 10**18 instead of calling token.decimals()", hi: "Code में hardcoded 10^18 assumptions vs dynamic decimals() check करें" },
        steps: [
          { en: "Search contract code for hardcoded `1e18`, `10**18`, or `1000000000000000000`.", simple: "Look for hardcoded 1e18 in the smart contract code.", hi: "Code में hardcoded `1e18` ढूँढें।" },
          { en: "Verify whether the contract supports or lists 6-decimal tokens like USDC or USDT.", simple: "Check if the platform accepts USDC or USDT.", hi: "चेक करें कि क्या platform USDC/USDT allow करता है।" },
          { en: "Test deposit calculations in Foundry with a 6-decimal mock token and observe value scaling errors.", simple: "Test depositing a 6-decimal token in Foundry.", hi: "Foundry में 6-decimal mock token deposit करके scaling error demonstrate करें।" },
        ],
      },
    ],
    proof: {
      en: "Rated P4 in Bugcrowd VRT. Triage requires: contract code references showing hardcoded 18 decimals and a Foundry test demonstrating the mathematical mismatch with 6-decimal tokens.",
      simple: "Show where 18 decimals is hardcoded and a test showing wrong balance calculation with USDC.",
      hi: "Hardcoded 18 decimals का code reference और 6-decimal tokens के साथ calculation error का Foundry test दें। P4 priority है।",
    },
    cwe: "CWE-682: Incorrect Calculation",
  },

  "Smart Contract Misconfiguration › Improper Use of Modifier": {
    what: {
      en: "A Solidity function modifier fails to execute the target function because it omits the `_;` (merge point) statement, or contains flawed logic that permits unauthorized execution (e.g. using `|` instead of `||`, or failing to revert on condition failure).",
      simple: "A modifier (security guard check) in the code has a typo or forgot the `_;` symbol, so the security check doesn't work properly.",
      hi: "Solidity function modifier में `_;` statement missing होती है या conditional logic में typo होता है, जिससे security check bypass हो जाता है या function execute ही नहीं होता।",
    },
    find: [
      {
        title: { en: "Audit modifier declarations for missing merge points and flawed logic", simple: "Inspect modifiers in the code for missing `_;` or broken if-conditions", hi: "Modifiers में `_;` statement और conditional checks inspect करें" },
        steps: [
          { en: "Inspect all custom `modifier` declarations in the contract source code.", simple: "Look at every modifier in the code.", hi: "Contract के सभी custom modifiers inspect करें।" },
          { en: "Verify that `_;` is present and that condition checks explicitly use `require()` or `revert()`.", simple: "Check that require() is used and `_;` is present.", hi: "Verify करें कि `_;` present है और `require()` correctly enforce है।" },
          { en: "Test invoking the modified function from an unauthorized caller to verify if execution is blocked.", simple: "Call the function as a normal user to see if the check blocks you.", hi: "Unauthorized caller से call करके देखें कि क्या execution block होती है।" },
        ],
      },
    ],
    proof: {
      en: "Rated P4 in Bugcrowd VRT. Triage requires: the modifier code snippet and a test showing improper behavior.",
      simple: "Show the broken modifier code and proof that unauthorized callers bypass it.",
      hi: "Modifier code snippet और unauthorized execution का test proof दें। P4 priority है।",
    },
    cwe: "CWE-670: Always-Incorrect Control Flow Implementation",
  },

  "Smart Contract Misconfiguration › Bypass of Function Modifiers and Checks": {
    what: {
      en: "An attacker bypasses security modifiers and access checks by calling internal sibling routines, exploiting delegatecall proxies that run in the caller's context, or abusing contract inheritance conflicts (e.g. shadowing state variables or overriding modifiers without calling super).",
      simple: "A hacker bypasses security checks by taking a side door into the contract (like calling another internal function or using delegatecall).",
      hi: "Attacker security modifiers को bypass कर देता है sibling routines, delegatecall context या inheritance conflicts (shadowed variables) का उपयोग करके।",
    },
    find: [
      {
        title: { en: "Audit delegatecall targets and inheritance hierarchies", simple: "Look for functions that skip checks or forward calls via delegatecall", hi: "Delegatecall proxies और inheritance hierarchy में modifier bypass audit करें" },
        steps: [
          { en: "Inspect fallback and delegatecall routing to verify if external callers can invoke protected functions directly.", simple: "Check if delegatecall lets callers bypass checks.", hi: "Delegatecall routing inspect करें कि क्या protected functions directly callable हैं।" },
          { en: "Audit state variable shadowing between base and derived contracts.", simple: "Check for duplicate variable names across inherited files.", hi: "Inherited contracts के बीच shadowed state variables check करें।" },
          { en: "Write a Foundry test proving that a restricted action completes without satisfying the modifier.", simple: "Demonstrate calling the action without passing the check in Foundry.", hi: "Foundry test लिखकर साबित करें कि restricted action बिना modifier pass किए complete हो जाती है।" },
        ],
      },
    ],
    proof: {
      en: "Priority varies (P1–P3). Triage requires: contract code references and a reproducible test showing the security check bypassed.",
      simple: "Show how the modifier is bypassed in a Foundry test.",
      hi: "Code references और modifier bypass demonstrate करने वाला Foundry test दें।",
    },
    cwe: "CWE-285: Improper Authorization",
  },

  "Smart Contract Misconfiguration › Inaccurate Rounding Calculation": {
    what: {
      en: "A smart contract performs division before multiplication or uses integer truncation without adequate precision scaling (such as scaling by `1e18` or `1e27` Ray in MakerDAO/Aave math), allowing users to round token payouts or fees to zero or harvest small balances repeatedly.",
      simple: "The contract divides numbers before multiplying them, losing fractional values and letting users round payments down to zero.",
      hi: "Smart contract division before multiplication करता है बिना precision scaling के। Integer truncation के कारण fractions zero में round हो जाते हैं, जिससे attacker zero fees pay करता है या repeated small transactions से value extract कर लेता है।",
    },
    find: [
      {
        title: { en: "Audit mathematical expressions for division-before-multiplication and precision loss", simple: "Check if division happens before multiplication in calculations", hi: "Calculation expressions में division-before-multiplication और precision loss inspect करें" },
        steps: [
          { en: "Search contract math for division operations: `(a / b) * c`.", simple: "Find division before multiplication in the code.", hi: "Math expressions में `(a / b) * c` pattern ढूँढें।" },
          { en: "Verify if precision scaling is performed prior to division: `(a * c) / b`.", simple: "Check if multiplication happens first.", hi: "चेक करें कि क्या multiplication पहले किया गया है।" },
          { en: "Test edge case numbers where integer truncation results in zero or significant value loss.", simple: "Test small numbers in Foundry to see them round down to zero.", hi: "Foundry में edge case numbers test करें जहाँ truncation zero yield करे।" },
        ],
      },
    ],
    proof: {
      en: "Priority varies (P2–P4). Triage requires: contract code snippet highlighting the calculation order and a Foundry test demonstrating precision truncation.",
      simple: "Show the calculation formula and a test proving rounding errors.",
      hi: "Flawed formula code snippet और rounding error demonstrate करने वाला Foundry test दें।",
    },
    cwe: "CWE-682: Incorrect Calculation",
  },
};
