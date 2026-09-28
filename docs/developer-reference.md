# Developer reference: connecting the payment steps

First run `npm ci` and `npm run demo`. Explore the [official Solana subscriptions demo](https://solana-subscriptions-program.vercel.app/) for the base program. Every recipe below is implemented and tested in [examples/recipes.ts](../examples/recipes.ts); wallet/account setup is in [examples/harness.ts](../examples/harness.ts).

## 1. Approve once

The customer signs authority initialization for their NEIRO token account, then approves the collector. For recurring payments:

```ts
await customerClient.subscriptions.instructions
  .createRecurringDelegation({
    tokenMint: NEIRO_MINT,
    delegatee: collector.address,
    nonce: 0n, // persist a distinct nonce per arrangement in your application
    amountPerPeriod: 50_000n * 1_000_000n, // customer-selected NEIRO cap
    periodLengthS: 30n * 86_400n,
    startTs: chainNow,
    expiryTs: chainNow + 360n * 86_400n,
  })
  .sendTransaction();
```

The runnable harness initializes the authority, derives the PDAs and provides all imports. Snippets here are excerpts. In an app, fetch existing state before initializing and obtain the customer's wallet signature. Create missing token accounts normally and fund fees/rent with SOL; the harness's test funding is not part of a real signup.

## 2. Pick the amount

### Fixed NEIRO

```ts
const amount = 1_000n * 1_000_000n; // always 1,000 NEIRO
```

### Fixed USD, paid in NEIRO

```ts
import { quoteUsd, assertQuoteUnexpired } from "../prices.js";
const quote = await quoteUsd("10", remainingNeiroAllowance);
const amount = quote.amount; // integer token.baseUnits from price.neiropay.app
```

Get a new quote for every invoice. Check `assertQuoteUnexpired(quote)` immediately before submission; if it expired, fetch a new one. The API's quote expiry is based on upstream fetch time, not proof of a recent market trade. The provider is the pricing trust boundary.

### Different USD prices or schedules

Use `'3'` for a $3 invoice and a seven-day authorization period, or `'25'` and 90 days. The `usd-schedules` recipe proves both, including allowance reset. These are fixed day counts, not calendar months or quarters.

### Metered usage

Use `'0.25'` per unique usage event. Keep a durable invoice/event ID and configure a daily NEIRO cap. Multiple events consume that same daily token allowance; the cap is not a dollar cap. If you also promise a USD usage ceiling, enforce it in the application ledger.

## 3. Collect directly to the merchant

```ts
const ix = await collectorClient.subscriptions.instructions.transferRecurring({
  delegatee: collector,
  delegator: customerAddress,
  delegatorAta: customerNeiroAta,
  tokenMint: NEIRO_MINT,
  delegationPda,
  amount,
  receiverAta: merchantNeiroAta,
  tokenProgram: TOKEN_PROGRAM_ADDRESS,
});
// Build and sign the transaction, check quote expiry if applicable, submit and confirm.
```

The collector signs, not the customer. The tested sender in `examples/harness.ts` checks confirmation and both token balances. The default demo uses controlled prices with exact integer/rational calculations; `demo:live` additionally executes a real NeiroPay quote locally.

## 4. Alternatively, use a finite allowance

`createFixedDelegation({ amount, expiryTs, ... })` followed by `transferFixed` allows partial collections up to one total. In the example, the customer authorizes 3,000 NEIRO and the merchant collects 1,000 then 2,000. A further pull fails. This allowance does not reset periodically.

You can quote a USD amount at approval time and use its NEIRO equivalent as that fixed allowance. That locks the token quantity at approval; it does not reprice the allowance every month.

## 5. Or publish a native subscription plan

The merchant calls `createPlan` with the NEIRO mint, token amount, period and allowed destinations. The customer calls `subscribe`. The merchant calls `transferSubscription`.

The `native-plan` recipe tests 1,000 NEIRO per 30 days, a rejected destination, periodic limits/reset and cancellation. Native plan amounts are in NEIRO base units. They do not automatically track a USD price; use recurring delegation plus the quote adapter for variable USD billing.

## 6. Cancel and avoid duplicate charges

For recurring or fixed delegations, the customer calls `revokeDelegation`. For a native plan they call `cancelSubscription`; ordinary cancellation ends at the period boundary, as demonstrated in the tests.

The [SQLite ledger example](../billing.ts) claims a unique invoice before sending. Its USD helper supports an optional invoice amount (default `'10'`). The collector could bypass that backend and spend a remaining token allowance, so do not describe the ledger's invoice rule as an on-chain restriction.

After a send with unknown confirmation, keep the invoice pending and reconcile its signature before retrying. The sample blocks uncertain invoices; automatic recovery remains application work. For deployment choices, see [integration notes](setup-checklist.md).
