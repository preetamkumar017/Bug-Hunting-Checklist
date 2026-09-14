import type { ChecklistCategory } from "../types/checklist";

// Ordered: Smart Contract Vulns -> Access Control -> DeFi/Economic Logic
// -> Wallet & Signature Security -> Bridge/Cross-chain -> Frontend/dApp Integration

export const web3Categories: ChecklistCategory[] = [
  {
    id: "web3-contract",
    name: "Smart Contract Vulnerabilities",
    emoji: "⛓️",
    items: [
      {
        id: "web3-contract-1",
        text: "Test for reentrancy in withdraw/transfer functions",
        how: "Check if external calls happen before state updates; deploy a malicious contract that re-enters the vulnerable function.",
        severity: "critical",
      },
      {
        id: "web3-contract-2",
        text: "Test for integer overflow/underflow (pre-Solidity 0.8)",
        how: "Check arithmetic operations in contracts compiled before 0.8.0 that lack SafeMath.",
        severity: "high",
      },
      {
        id: "web3-contract-3",
        text: "Check access control on privileged functions",
        how: "Review onlyOwner/role-based modifiers for missing or bypassable access checks.",
        severity: "critical",
      },
      {
        id: "web3-contract-4",
        text: "Test for unchecked external call return values",
        how: "Check if low-level calls (call/send) ignore the boolean return value, letting failed transfers go unnoticed.",
        severity: "high",
      },
      {
        id: "web3-contract-5",
        text: "Test for delegatecall to untrusted/user-controlled contracts",
        how: "Review delegatecall usage — if the target address is attacker-influenceable, it can execute arbitrary code in the caller's storage context.",
        severity: "critical",
      },
      {
        id: "web3-contract-6",
        text: "Test for uninitialized storage pointer bugs",
        how: "In older Solidity versions, check for uninitialized local storage struct/array variables that can corrupt contract state.",
        severity: "critical",
      },
      {
        id: "web3-contract-7",
        text: "Test for front-running vulnerable functions",
        how: "Identify state-changing functions where a pending transaction's outcome can be predicted and exploited by an attacker submitting a higher-gas transaction first.",
        severity: "high",
      },
      {
        id: "web3-contract-8",
        text: "Test for denial-of-service via unbounded loops over user-controlled arrays",
        how: "Check for loops iterating over arrays that can be grown arbitrarily by users, eventually exceeding block gas limits.",
        severity: "medium",
      },
      {
        id: "web3-contract-9",
        text: "Test for self-destruct misuse / forced ether injection",
        how: "Check if contract logic incorrectly assumes it can't receive ether outside defined functions (selfdestruct can force-send ether to any address).",
        severity: "medium",
      },
      {
        id: "web3-contract-10",
        text: "Test upgradeable proxy storage layout collisions",
        how: "For proxy-pattern upgradeable contracts, verify new implementation versions preserve storage slot ordering to avoid corrupting existing state.",
        severity: "critical",
      },
      {
        id: "web3-contract-11",
        text: "Test for missing initializer protection on upgradeable contracts",
        how: "Check if the initialize() function can be called multiple times or by anyone after deployment, allowing re-initialization/takeover.",
        severity: "critical",
      },
      {
        id: "web3-contract-12",
        text: "Test timestamp/blockhash dependence for randomness manipulation",
        how: "Check if contract logic uses block.timestamp or blockhash as a source of randomness, which miners can influence.",
        severity: "medium",
      },
    ],
  },
  {
    id: "web3-access",
    name: "Access Control & Governance",
    emoji: "🗝️",
    items: [
      {
        id: "web3-access-1",
        text: "Test multisig/timelock bypass on critical admin functions",
        how: "Verify sensitive functions (upgrade, mint, pause) genuinely require the full multisig/timelock flow and can't be triggered directly.",
        severity: "critical",
      },
      {
        id: "web3-access-2",
        text: "Test for governance proposal execution without proper voting",
        how: "Check if a malicious or insufficiently-supported proposal can still be executed due to a flaw in vote counting/quorum logic.",
        severity: "critical",
      },
      {
        id: "web3-access-3",
        text: "Test flash-loan-based governance vote manipulation",
        how: "Check if voting power is based on a snapshot-able token balance that could be flash-loaned to temporarily swing a vote.",
        severity: "critical",
      },
      {
        id: "web3-access-4",
        text: "Test for role renouncement / ownership transfer edge cases",
        how: "Check if renouncing ownership or transferring to an invalid address (0x0) can permanently brick admin functionality unintentionally.",
        severity: "medium",
      },
      {
        id: "web3-access-5",
        text: "Test pausable contract mechanisms for bypass",
        how: "If the contract has an emergency pause feature, confirm all critical fund-moving functions actually respect the paused state.",
        severity: "high",
      },
    ],
  },
  {
    id: "web3-defi",
    name: "DeFi & Economic Logic",
    emoji: "💰",
    items: [
      {
        id: "web3-defi-1",
        text: "Test for price oracle manipulation",
        how: "Check if the protocol relies on a manipulable on-chain price source (e.g. spot price from a low-liquidity pool) for critical calculations.",
        severity: "critical",
      },
      {
        id: "web3-defi-2",
        text: "Test for flash loan attack vectors",
        how: "Model whether a flash-loaned large balance can manipulate collateral/voting/price logic within a single transaction.",
        severity: "critical",
      },
      {
        id: "web3-defi-3",
        text: "Test for slippage/sandwich attack exposure",
        how: "Check if swap functions lack a user-settable minimum-output parameter, allowing an attacker to sandwich the transaction for profit.",
        severity: "medium",
      },
      {
        id: "web3-defi-4",
        text: "Test rounding errors in share/liquidity calculations",
        how: "Check deposit/withdraw math for rounding-direction bugs that let a user extract slightly more value than deposited, repeatable at scale.",
        severity: "high",
      },
      {
        id: "web3-defi-5",
        text: "Test for first-depositor / vault inflation attack",
        how: "Check ERC-4626-style vaults for the classic first-depositor share-price manipulation attack via a direct token donation.",
        severity: "critical",
      },
      {
        id: "web3-defi-6",
        text: "Test liquidation logic for manipulation or unfair execution",
        how: "Check if liquidation thresholds/rewards can be gamed by manipulating the price feed or by self-liquidating for profit.",
        severity: "high",
      },
      {
        id: "web3-defi-7",
        text: "Test fee-on-transfer / rebasing token compatibility assumptions",
        how: "Check if the protocol assumes a fixed transferred amount, breaking accounting when interacting with fee-on-transfer or rebasing tokens.",
        severity: "high",
      },
    ],
  },
  {
    id: "web3-wallet",
    name: "Wallet & Signature Security",
    emoji: "✍️",
    items: [
      {
        id: "web3-wallet-1",
        text: "Test for signature replay across chains/contracts",
        how: "Check if a signed message lacks chain ID / contract address / nonce binding, allowing replay elsewhere.",
        severity: "high",
      },
      {
        id: "web3-wallet-2",
        text: "Test for signature malleability",
        how: "Check if the contract validates signatures in a way vulnerable to ECDSA malleability, allowing a valid signature to be altered while still verifying.",
        severity: "medium",
      },
      {
        id: "web3-wallet-3",
        text: "Test EIP-712 typed data signing for phishing-resistant clarity",
        how: "Check if signature requests use readable EIP-712 structured data rather than opaque hashes a user could be tricked into signing.",
        severity: "medium",
      },
      {
        id: "web3-wallet-4",
        text: "Test permit()/gasless approval signature scoping",
        how: "Check if an ERC-2612 permit signature can be front-run or replayed to grant unintended token approvals.",
        severity: "high",
      },
      {
        id: "web3-wallet-5",
        text: "Test for unlimited token approval risk in integration flows",
        how: "Check if the dApp requests unlimited (max uint256) token approvals by default instead of the exact amount needed.",
        severity: "medium",
      },
    ],
  },
  {
    id: "web3-bridge",
    name: "Bridge & Cross-Chain Security",
    emoji: "🌉",
    items: [
      {
        id: "web3-bridge-1",
        text: "Test bridge message validation for spoofed source chain",
        how: "Check if the destination-chain contract properly verifies the message actually originated from the expected source chain/bridge relayer.",
        severity: "critical",
      },
      {
        id: "web3-bridge-2",
        text: "Test for double-spend via bridge replay",
        how: "Check if a bridge withdrawal proof/message can be replayed to mint/release funds more than once.",
        severity: "critical",
      },
      {
        id: "web3-bridge-3",
        text: "Test relayer/validator set compromise impact",
        how: "Assess what a minority or majority compromise of the bridge's off-chain validator set would allow an attacker to do.",
        severity: "high",
      },
      {
        id: "web3-bridge-4",
        text: "Test locked-vs-minted supply consistency across chains",
        how: "Verify the total minted wrapped-token supply never exceeds what's actually locked on the source chain, even under edge-case failure paths.",
        severity: "critical",
      },
    ],
  },
  {
    id: "web3-frontend",
    name: "dApp Frontend & Integration Security",
    emoji: "🖥️",
    items: [
      {
        id: "web3-frontend-1",
        text: "Test dApp frontend for malicious contract address injection",
        how: "Check if contract addresses used by the frontend are hardcoded/verified rather than fetched from a source that could be tampered with (CDN, DNS).",
        severity: "critical",
      },
      {
        id: "web3-frontend-2",
        text: "Test wallet-connect flow for phishing/approval trickery",
        how: "Review transaction confirmation UI for clarity — check if a malicious dApp could disguise a token-drain approval as a benign action.",
        severity: "high",
      },
      {
        id: "web3-frontend-3",
        text: "Test for XSS in dApp frontend leading to wallet interaction hijack",
        how: "Standard XSS testing on the dApp's web frontend, but with elevated impact since it could trigger malicious wallet transaction prompts.",
        severity: "critical",
        tags: { tech: ["web"] },
      },
      {
        id: "web3-frontend-4",
        text: "Test RPC endpoint trust and man-in-the-middle resilience",
        how: "Check if the dApp allows configuring a custom RPC endpoint without warning, which could be used to serve manipulated chain data.",
        severity: "medium",
      },
    ],
  },
];
