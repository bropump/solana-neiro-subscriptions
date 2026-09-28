# Setup checklist for humans and agents

## What you can do immediately

Run the price example, unit tests and type-checking with Node.js 24+. With Surfpool installed and network access, run the local integration example using the real NEIRO mint and subscriptions program. No customer wallet or mainnet payment is needed for those tests.

For the base protocol's user flow, open the [official Solana subscriptions demo](https://solana-subscriptions-program.vercel.app/), linked by the [Solana subscriptions documentation](https://solana.com/docs/payments/subscriptions/overview#demo-application). This guide does not claim the demo already offers our custom USD-priced NEIRO flow.

## Inputs for a real integration

| Input                      | What the human/operator must supply or decide                                                                                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Network and RPC            | Mainnet for the real NEIRO mint; HTTP RPC and, for the chosen client, WebSocket RPC. Check the deployed program/account versions before use. A devnet token at another address is a test token, not this NEIRO mint.                                          |
| Merchant and collector     | Merchant public address, destination NEIRO token account, collector public address and a secure signing mechanism. If collector and merchant differ, configure both explicitly. Do not put private keys in chat or Git.                                       |
| Customer authorization     | A wallet connection/signing flow. Each customer must sign their own approval; an agent cannot provide consent on their behalf.                                                                                                                                |
| Token accounts and funding | Customer NEIRO account and sufficient NEIRO; merchant NEIRO receiving account. Create missing associated token accounts normally, with an agreed payer funding SOL rent/fees. Collector needs SOL for collection fees.                                        |
| Terms                      | USD amount, NEIRO cap, 30-day versus calendar-month schedule, start, expiry, missed-payment policy and cancellation UX. This example hardcodes $10 and 30 days.                                                                                               |
| Price source               | Access to price.neiropay.app and an accepted quote-freshness policy. The adapter respects expiresAt and the API explicitly reports upstream-fetch freshness, not a verified last-trade time. Decide how to notify/retry when the service has no usable quote. |
| Runtime                    | Where the billing worker runs, how it is scheduled and how signing/API credentials are supplied. No scheduler is deployed by this repository.                                                                                                                 |
| Storage                    | Persistent invoice/customer configuration shared by workers, with backups. Decide how support staff reconcile pending/unknown transactions.                                                                                                                   |

The demo needs no secrets. It does not include a production RPC/wallet/scheduler configuration loader. Adding environment variables will not implement those application components.

## Application work that remains

1. **Signup:** connect the customer's wallet; derive/validate the NEIRO ATA and subscription-authority PDA; fetch existing authority/delegation state before creating anything. Choose and persist a delegation nonce per arrangement rather than reusing the example's `0` for every subscription. Show terms and request the customer's signature. Verify confirmed setup and store the accepted terms, customer, mint, authority, delegation, collector and destination.
2. **Due-invoice calculation:** use accepted terms and chain time to identify the active billing period. Read the actual delegation, ensure it belongs to the expected customer/mint/collector and is active, and calculate its remaining allowance with the period reset taken into account. Respect the current authority initialization/version state. Do not treat an expired, revoked, replaced or exhausted delegation as valid.
3. **Collection:** claim the invoice once, fetch a fresh price immediately before building the transaction, calculate base units, verify balances/allowance/destination, sign with the collector, submit and confirm. Persist the price observation and charged amount with the invoice.
4. **Recovery:** save the signed transaction, signature and validity window before broadcast. Reconcile its outcome after a timeout. Rebroadcasting the same still-valid signed transaction is different from creating a new debit. Do not clear a pending invoice or create a replacement payment until the prior transaction's outcome is resolved. The sample currently blocks uncertain invoices; it does not automate this process.
5. **Cancellation and status:** let the customer revoke; stop scheduling and verify revocation on-chain. Show confirmed payments, pending states and skips caused by pricing, cap or balance failures.

No modification to the subscriptions protocol is required. These are application responsibilities. The NEIRO cap is enforced on-chain; USD pricing and one invoice per period are backend rules.

## Acceptance checks before calling a real integration complete

- A customer can approve the displayed terms, with no secret wallet material leaving their wallet.
- Repeated signup does not reset or collide with an unrelated existing subscription.
- A due invoice uses a fresh observed price, its correct remaining allowance and the configured destination.
- Changed prices produce different NEIRO amounts for the same $10 bill.
- Unavailable/stale prices, insufficient balances and exceeded caps leave tokens untouched.
- Two workers and a restarted worker cannot debit the same invoice twice.
- A lost confirmation is reconciled without blindly creating another charge.
- Revocation, expiry and insufficient SOL for fees are handled and surfaced.
- Persistent state survives a service restart; controlled fixture results are clearly distinguished from live tests.

## Suggested agent handoff

> Use this repository to implement $10 every 30 days, paid directly in NEIRO BROPUMP. Read AGENTS.md and this checklist first. Run the provided example, tests and type-checking. Preserve the original subscriptions protocol and the NEIRO-only payment flow. Inventory the configuration I have supplied, then implement the signup, billing worker and recovery components that are missing. Use Surfpool for integration testing; keep the local test harness separate from production code. Report which acceptance checks pass and which inputs or components are still missing. Do not claim the local example alone is a deployed service.

Attach the operator choices from the table to that handoff. Public wallet addresses and service identifiers can be supplied as text; provide credentials through a secret manager or local environment.
