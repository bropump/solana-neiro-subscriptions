# Solana subscriptions with NEIRO

**Working recipes for recurring payments in NEIRO. Run them locally in two commands.**

Charge fixed NEIRO, a fixed USD price converted to NEIRO each period, or metered usage. These examples use the existing Solana Subscriptions program. Customers pay NEIRO directly to merchants—no swaps or USDC approvals.

[Official Solana subscriptions demo](https://solana-subscriptions-program.vercel.app/) · [Solana docs](https://solana.com/docs/payments/subscriptions/overview) · [NeiroPay conversions](https://price.neiropay.app/llms.txt)

## Get running

Install **Node.js 24+** and **[Surfpool](https://docs.surfpool.run/)** (tested with 1.5.0). Clone this repository, then:

```sh
git clone https://github.com/bropump/solana-neiro-subscriptions.git
cd solana-neiro-subscriptions
npm ci
npm run demo
```

No wallet, API key or real funds needed. Internet access is needed to fork mainnet accounts. The command starts its own local Surfpool, runs every recipe, saves transaction proof and stops its instance automatically.

## Pick a recipe

| Recipe            | Example                                      | What changes?                                    |
| ----------------- | -------------------------------------------- | ------------------------------------------------ |
| `fixed-neiro`     | 1,000 NEIRO every 30 days                    | Token amount stays fixed                         |
| `monthly-usd`     | $10 every 30 days, paid in NEIRO             | Token amount changes with price                  |
| `usd-schedules`   | $3 every 7 days; $25 every 90 days           | USD price and period are configurable            |
| `metered-usd`     | $0.25 per usage event                        | Each event charges NEIRO under a daily cap       |
| `fixed-allowance` | 3,000 NEIRO total, collected in installments | Remaining allowance decreases; no periodic reset |
| `native-plan`     | Published 1,000-NEIRO / 30-day plan          | Customer subscribes to merchant's on-chain terms |

Run one recipe:

```sh
npm run demo -- --recipe=monthly-usd
npm run demo -- --recipe=fixed-neiro
npm run demo -- --recipe=native-plan
```

[See all runnable recipes](examples/recipes.ts) · [Read the short walkthrough](docs/walkthrough.md) · [Agent instructions](AGENTS.md)

## USD-priced NEIRO: how it works

```text
Customer approves a NEIRO cap once
→ billing worker gets a USD→NEIRO quote when payment is due
→ existing transferRecurring pulls that NEIRO amount
→ merchant receives NEIRO
```

For a $10 invoice:

| Price per NEIRO | NEIRO charged |
| --------------: | ------------: |
|         $0.0005 |        20,000 |
|          $0.001 |        10,000 |
|        $0.00025 |        40,000 |

Those are illustrative fixture prices. A new quote is used for each live invoice. The dollar valuation is taken at billing time; the merchant's NEIRO can change in value afterward.

## Use price.neiropay.app

```sh
curl 'https://price.neiropay.app/convert?pair=USD-NEIRO&input=10'
```

Use **`token.baseUnits`** as the transfer amount and respect **`expiresAt`**. The service converts the quote, not the tokens. Our [adapter](prices.ts) validates the currency, token, decimals, invoice amount, cap and expiry.

```ts
const quote = await quoteUsd("10", remainingNeiroAllowance);
// Build the existing transferRecurring instruction with amount: quote.amount.
// Check immediately before submitting the signed transaction:
assertQuoteUnexpired(quote);
```

Run the optional live conversion test (still only local token transfers):

```sh
npm run demo:live
```

NeiroPay's expiry measures **upstream-fetch freshness**, not a verified last-trade timestamp. This example explicitly accepts that quote policy. Expired/unavailable conversions fail; they are never silently replaced by fake live prices. The default suite uses labelled price fixtures so its pricing results are reproducible.

## Tested in Surfpool

The recorded all-recipes run passed **16 confirmed direct NEIRO transfers**, including a live $10 conversion into **19,817.718102 NEIRO**. Tests verify balances, transfer mint/destination, and that only the collector signs each collection. They also cover period resets, caps, stale/expired quotes, duplicate invoices, revocation and native-plan destination/cancellation rules.

[Results summary](evidence/summary.json) · [Transaction proof](evidence/proof.json) · [Run log](evidence/run.log)

The mint and deployed program are real mainnet accounts forked into Surfpool. Starting funds, wallets and time travel are local fixtures. No mainnet funds move. Local signatures will not appear in public explorers. Each new run writes its own proof under the printed `work/demo-...` folder.

## Useful commands

```sh
npm run example     # Three USD→NEIRO calculations, no Surfpool needed
npm test            # Pricing, quote-validation and invoice tests
npm run typecheck   # Type-check all examples
```

## What to adapt for your app

Customers sign approval once; the collector signs each pull. Your worker must schedule charges. The protocol enforces **NEIRO limits**; your backend enforces **USD pricing and unique invoices**. Native plans define NEIRO terms on-chain; a fixed delegation is a finite allowance, not an automatic subscription.

“Monthly” here means 30 days. To use real customer wallets, connect signup, signing, scheduling and durable transaction recovery. [Integration notes](docs/setup-checklist.md) explain those steps without changing the protocol. The collector is trusted within the customer-approved cap.

**NEIRO BROPUMP mint:** `CTg3ZgYx79zrE1MteDVkmkcGniiFrK1hJ6yiabropump` (6 decimals).

## References

- [Official Solana subscriptions demo](https://solana-subscriptions-program.vercel.app/)
- [Recurring delegations](https://solana.com/docs/payments/subscriptions/recurring-delegation)
- [Fixed allowances](https://solana.com/docs/payments/subscriptions/fixed-delegation)
- [Native subscription plans](https://solana.com/docs/payments/subscriptions/subscription-plan)
- [NeiroPay conversion API](https://price.neiropay.app/llms.txt)

MIT licensed. Examples maintained by bropump; not an official Solana SDK.
