# Learn Solana subscriptions by charging monthly in NEIRO

[← Guide home](../README.md)

**Your goal:** offer a membership for 1,000 NEIRO every 30 days. The customer approves the arrangement, your app collects recurring payments, and you receive NEIRO.

This learning path starts with that simple offer, then builds up to subscriptions priced in dollars, euros and other supported currencies. Use the same NEIRO token throughout so each lesson builds on the last.

## 1. Understand who does what

| Who or what | Job |
| --- | --- |
| Customer | Holds NEIRO and signs permission for recurring collections |
| Merchant | Offers the membership and receives NEIRO |
| Collector | Signs and submits each collection transaction using the customer's permission |
| Solana subscriptions program | Checks the permission, token allowance and period rules |
| Your billing app | Decides when a bill is due, avoids duplicate invoices and tracks payment status |

The customer signs the setup transactions. The collector signs subsequent payments. NEIRO stays in the customer's token account until collected.

A **recurring delegation** is the customer's permission to collect up to a token limit each period. A **native subscription plan** publishes token-priced terms that customers subscribe to. This first lesson uses recurring delegation; you will explore plans later.

## 2. Make the offer clear

Show the customer what they are agreeing to:

> Membership: 1,000 NEIRO every 30 days. Authorize the specified collector to collect up to 1,000 NEIRO per period until the stated expiry. Revoke the permission to stop future collections.

Your signup should show the actual collector, start date and expiry. For this offer, the NEIRO amount stays fixed even if NEIRO's dollar price changes. No price lookup is required.

## 3. Run your first subscription

Install [Node.js 24 or later](https://nodejs.org/en/download) and [Surfpool](https://docs.surfpool.run/), then open a terminal:

```sh
git clone https://github.com/bropump/solana-neiro-subscriptions.git
cd solana-neiro-subscriptions
npm ci
npm run demo -- --recipe=fixed-neiro
```

You need internet access, but **no funded wallet, API key or real payment**. The command starts a local Solana environment, copies the required mainnet program and mint accounts, supplies simulated balances and runs the example.

Here's what you should see:

| Step | Result |
| --- | --- |
| Collect the first membership payment | You receive 1,000 NEIRO |
| Attempt another collection beyond the period allowance | Rejected |
| Advance local time into the next period | The allowance resets |
| Collect the next membership payment | You receive another 1,000 NEIRO |
| Customer revokes permission; collector tries again | Rejected |

The test verifies confirmed transactions and both parties' balance changes. It prints where to find `summary.json` and `proof.json` for your run. [See a recorded result](../evidence/multi-currency/summary.json).

## 4. Read the smallest piece of code

```ts
const amount = 1_000n * 1_000_000n;
```

That is 1,000 NEIRO expressed in the token's six-decimal base units. Pass it to the NEIRO collection instruction. There is no conversion request.

[See approval and collection code](code-examples.md) · [Read the full executable recipe](../examples/recipes.ts)

## 5. Explore the customer interface

Open the [official Solana subscriptions demo](https://solana-subscriptions-program.vercel.app/) or follow our [screenshot tour](portal-tour.md). Learn the difference between delegations, plans and subscriptions.

The official demo illustrates the base protocol. The NEIRO examples in this repository run locally in Surfpool; the portal is not a hosted checkout for these examples.

## 6. Extend your subscription, one lesson at a time

| Next question | Lesson |
| --- | --- |
| How do I keep membership at $10 when NEIRO's price changes? | [A fixed-dollar membership paid in NEIRO](walkthrough.md) |
| Can I set the price in euros, pounds or yen? | [45 supported pricing currencies, NEIRO payments](currencies.md) |
| How do I publish a plan customers subscribe to? | [Native NEIRO subscription plans](more-ways-to-charge.md#create-a-plan-people-can-subscribe-to) |
| Can I bill weekly or charge per use? | [More ways to charge](more-ways-to-charge.md) |
| Can an agent build this with me? | [Copyable prompts](agent-prompts.md) |
| What is needed for real customers? | [Wallet signup, scheduling, storage and recovery](setup-checklist.md) |

## Why start with NEIRO?

You have an identified Solana token, working collection examples, a currency conversion adapter and transaction evidence in one place. Start with a simple monthly NEIRO payment, then learn the harder parts—price changes, allowances, retries and cancellation—without changing tokens or rewriting the protocol.

These are existing Solana subscription mechanisms applied to NEIRO. The customer-facing offer and your app's billing rules complete the experience.

For the protocol's own explanation, read the [official Solana subscriptions overview](https://solana.com/docs/payments/subscriptions/overview).
