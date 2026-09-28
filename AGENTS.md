# Agent guide

## Purpose

A simple working showcase of Solana subscriptions with NEIRO: fixed NEIRO, USD-priced NEIRO, metered usage, fixed allowances and native plans. The user receives NEIRO-only payment examples, not swaps, USDC settlement or a new protocol.

Mint: `CTg3ZgYx79zrE1MteDVkmkcGniiFrK1hJ6yiabropump` (6 decimals).
Program: `De1egAFMkMWZSN5rYXRj9CAdheBamobVNubTsi9avR44`.
Official demo: https://solana-subscriptions-program.vercel.app/
Conversion API: https://price.neiropay.app/llms.txt

## Run

1. Read README.md and docs/walkthrough.md for the customer journey, then docs/developer-reference.md for SDK calls.
2. `npm ci`, `npm run example`, `npm test`, `npm run typecheck`.
3. With Surfpool on PATH, run `npm run demo`; it manages an isolated localhost instance.
4. `npm run demo -- --recipe=fixed-neiro` runs one named recipe.
5. `npm run demo:live` additionally tests NeiroPay's current conversion. API failure or expiry must not be masked as a passing live test.
6. Inspect the generated `work/demo-.../summary.json` and `proof.json`.

## Files

- examples/recipes.ts: concise executable payment recipes and checks.
- examples/harness.ts: local accounts, signing, transfer verification and time travel.
- prices.ts: USD→NEIRO quote validation, base units and expiry.
- billing.ts: integer fixture pricing and unique invoice ledger.
- docs/setup-checklist.md: optional real-application integration notes, not demo prerequisites.

## Writing for humans

Lead with what someone wants to sell, what the customer agrees to, and what happens when a payment is due. Explain the outcome before introducing commands or SDK names. Keep the front page a guide; put implementation details in docs/developer-reference.md. Preserve the distinction between a runnable local example and a deployed customer service.

## Preserve these properties

- All example transaction submissions stay at hardcoded localhost hosts; only ports vary.
- Token funding and time travel are explicitly local test fixtures.
- Successful collection is a confirmed NEIRO transfer signed only by the collector.
- Label fixture prices separately from actual external quotes.
- NeiroPay freshness is its upstream-fetch/expiry policy. Do not label it a verified last-trade timestamp.
- Use token.baseUnits as BigInt; validate pair, invoice, mint identity, decimals, cap and expiry.
- Never weaken expiry/price validation to force a test to pass.
- Protocol limits are in NEIRO; USD pricing and unique invoices are backend responsibilities.
- Fixed delegation is a total allowance; native plan is token-denominated. Neither automatically reprices dollars.
- Unknown confirmation stays pending until reconciled. Do not blindly clear invoices or issue another debit.

## Publishing and evidence

Never commit keys, wallet secret bytes, .env values, runtime SQLite databases, node_modules, machine paths or work/. Only ephemeral public addresses and public transaction evidence belong in evidence/. Preserve source provenance when refreshing evidence. Keep human instructions short and commands reproducible.

This is a local starter, not a deployed billing service. If asked to integrate real wallets, gather the operator's addresses, terms and runtime choices and implement the missing application pieces described in the integration notes.
