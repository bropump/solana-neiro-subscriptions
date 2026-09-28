# Small code examples: from a price to a payment

[← Back to the guide](../README.md) · [Copy an agent prompt](agent-prompts.md)

These examples answer three questions: How much should I charge? What does the customer approve? How does the collector get paid?

## 1. Calculate a $10 bill in NEIRO

After `npm ci`, run:

```sh
npm run quote
```

This runs [a complete, read-only example](../examples/quote-membership.ts). It fetches a current quote and prints the NEIRO amount; it does not transfer anything. The core is:

```ts
import { quoteUsd, assertQuoteUnexpired } from "../prices.js";

const remainingAllowance = 50_000n * 1_000_000n;
const quote = await quoteUsd("10", remainingAllowance);
assertQuoteUnexpired(quote);
console.log(quote.amount.toString()); // NEIRO base units for this $10 quote
```

NEIRO has six decimals: **1 NEIRO = 1,000,000 base units**. The `n` suffix means an integer stored as `BigInt`. Use these integers for token transfers rather than floating-point arithmetic.

The adapter checks the response, amount, allowance and expiry. In a real collection, read the actual remaining allowance and check quote expiry again immediately before submitting the payment. An unavailable or expired quote should stop collection.

## 2. Or charge a fixed 1,000 NEIRO

```ts
const amount = 1_000n * 1_000_000n;
```

There is no price lookup for this option. This token amount stays the same every period.

## 3. Get the customer's permission

For dollar-priced payments, recurring permission lets the collector pull a different NEIRO amount within the approved limit each period:

```ts
await customerClient.subscriptions.instructions.createRecurringDelegation({
  tokenMint: NEIRO_MINT,
  delegatee: collector.address,
  nonce: 0n,
  amountPerPeriod: 50_000n * 1_000_000n,
  periodLengthS: 30n * 86_400n,
  startTs: chainNow,
  expiryTs: chainNow + 360n * 86_400n,
}).sendTransaction();
```

**This is a setup excerpt**, not a standalone script. The customer signs it after the authority and token accounts are ready. The [complete runnable recipes](../examples/recipes.ts) and [local setup helper](../examples/harness.ts) provide the surrounding code. In your app, persist a distinct nonce for each arrangement and reuse existing account state appropriately.

## 4. Collect the quoted amount

```ts
const quote = await quoteUsd("10", remainingAllowance);
const instruction = await collectorClient.subscriptions.instructions.transferRecurring({
  delegatee: collector,
  delegator: customerAddress,
  delegatorAta: customerNeiroAta,
  tokenMint: NEIRO_MINT,
  delegationPda,
  amount: quote.amount,
  receiverAta: merchantNeiroAta,
  tokenProgram: TOKEN_PROGRAM_ADDRESS,
});
```

This excerpt **builds the instruction**. Your collector then builds and signs the transaction, checks quote expiry immediately before sending, submits it and confirms it. See the [developer reference](developer-reference.md) for the full context and recovery requirements.

The protocol checks the NEIRO permission. Your app checks when the $10 bill is due and ensures that invoice is collected only once. The quote service does not swap tokens or schedule payments.

## 5. Run the actual payment locally

With Surfpool installed:

```sh
npm run demo -- --recipe=monthly-usd
```

This executes and verifies two payments with controlled prices. To add a payment based on a live conversion, run `npm run demo:live`. Both commands use local funds only.

[See the customer journey](walkthrough.md) · [Build it with an agent](agent-prompts.md) · [Connect a real app](setup-checklist.md)
