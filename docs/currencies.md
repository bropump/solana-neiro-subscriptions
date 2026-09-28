# Your price. Your currency. Paid in NEIRO.

[← Back to the guide](../README.md)

## “I just want 1,000 NEIRO”

Then charge exactly **1,000 NEIRO**. You do not need a dollar price, a conversion request or an exchange rate.

```ts
const amount = 1_000n * 1_000_000n; // 1,000 NEIRO in six-decimal base units
```

Use this amount in the existing NEIRO collection instruction each period. The dollar value may change; the 1,000 NEIRO bill does not.

```sh
npm run demo -- --recipe=fixed-neiro
```

This tests two 1,000 NEIRO payments, the period limit and revocation. The fixed-token recipe does not call the price API.

## “I want €10, £10 or ¥1,500, paid in NEIRO”

Choose your price currency and get a new quote when each bill is due:

```ts
import { quoteFiat, assertQuoteUnexpired } from "../prices.js";

// Example remaining allowance. Read the customer's actual allowance in your app.
const remainingAllowance = 100_000n * 1_000_000n;
const quote = await quoteFiat("EUR", "10", remainingAllowance);
const amount = quote.amount; // NEIRO base units, not euro or USDC units
// Build the existing NEIRO transferRecurring instruction using amount.
// Immediately before submitting the signed transaction:
assertQuoteUnexpired(quote);
```

For pounds use `quoteFiat("GBP", "10", remainingAllowance)`. For yen use `quoteFiat("JPY", "1500", remainingAllowance)`. The [collection example](code-examples.md#4-collect-the-quoted-amount) shows where this amount goes. The customer still approves a NEIRO cap, and your billing worker still enforces the agreed price and unique invoice.

You can inspect a conversion directly: [10 EUR → NEIRO](https://price.neiropay.app/convert?pair=EUR-NEIRO&input=10).

**Use `token.baseUnits` from the NEIRO quote.** The response may also contain `usdc` and `fiat` equivalents. Our adapter uses the NEIRO token field and rejects a different token or currency pair. No swap to USDC takes place. The customer's NEIRO balance decreases and the merchant's NEIRO balance increases.

The quote fixes the valuation used for that collection, not the future value of the NEIRO received. Quotes must be valid and the payment must fit within the remaining NEIRO allowance.

## Which currencies?

Use [the API's supported-currencies endpoint](https://price.neiropay.app/supported-currencies) as the current source of truth. “Any currency” here means any supported fiat currency with a `CURRENCY-NEIRO` pair.

At the time of this guide, the API lists 45:

USD, EUR, GBP, AUD, NZD, CAD, CHF, SEK, NOK, DKK, PLN, JPY, CNY, HKD, SGD, TWD, KRW, PHP, IDR, THB, VND, MYR, INR, BDT, PKR, LKR, NPR, KZT, UZS, MNT, AED, SAR, QAR, KWD, BHD, BRL, MXN, ARS, CLP, COP, PEN, NGN, KES, EGP and ZAR.

## Test the currencies in Surfpool

After the [first-time setup](walkthrough.md#6-try-the-two-payments-on-your-computer), run:

```sh
npm run demo -- --recipe=multi-currency
```

This first runs the fixed 1,000 NEIRO example. Then it fetches the supported currency list and, for each fiat currency, quotes **10 units of that currency** and collects the quoted NEIRO amount locally. Ten yen and ten pounds are different prices; the test deliberately uses the same numeric input, not the same economic value.

For each collection it verifies the confirmed transaction, NEIRO mint, receiving account, exact amount, customer debit and merchant credit. It also checks every transaction token balance belongs to NEIRO. The collector is the only transaction signer. Quote expiry and allowance checks remain enabled.

This test needs the public price API and network access; it fails if a quote cannot be obtained or used in time. All transfers use simulated funds in Surfpool. No mainnet payments are sent.

## Recorded result

The September 28, 2026 run passed **47 confirmed direct NEIRO transfers**: two fixed 1,000 NEIRO payments and one live-priced payment for each of the 45 fiat currencies. No USDC token movement occurred.

[Read the results](../evidence/multi-currency/summary.json) · [Inspect transactions and balances](../evidence/multi-currency/proof.json) · [View the run log](../evidence/multi-currency/run.log)

## Give this to an agent

```text
Use https://github.com/bropump/solana-neiro-subscriptions.
Read AGENTS.md and docs/currencies.md. Build a subscription priced at
10 EUR every 30 days, paid directly in NEIRO. Use quoteFiat for each due
invoice and token.baseUnits for the NEIRO transfer. Never use the USDC
field as the payment amount. Preserve quote-expiry checks, the customer's
NEIRO cap, cancellation and duplicate-invoice protection.
Also offer a fixed 1,000 NEIRO option that never calls the price API.
Run both flows in Surfpool and show confirmed NEIRO balance changes.
List the remaining wallet, worker and storage setup needed for real users.
```
