# Solana subscriptions: charge monthly in NEIRO

## Start here: copy a prompt for your agent

Paste this into your coding agent. It will help you learn, choose your own payment terms and test your setup.

**[More agent prompts →](docs/agent-prompts.md)** · **[Agent instructions →](AGENTS.md)**

```text
Help me learn Solana subscriptions and set up my own way to accept NEIRO.
Use this recipe: https://github.com/bropump/solana-neiro-subscriptions
and the official Solana Subscriptions docs:
https://solana.com/docs/payments/subscriptions/overview

1. Explain simply how customers approve payments and how I receive NEIRO.
2. Ask what I am selling, how much I want to charge and how often.
   Help me choose fixed NEIRO, a price in a supported currency paid in
   NEIRO, or pay-per-use. Let me choose the terms rather than assuming them.
3. Walk me through the matching example, explain the spending limit and
   cancellation, and adapt it to my choices using the existing protocol.
4. Test it locally in Surfpool and show that I receive the right NEIRO amount.
5. Explain what I still need to connect real customers and run the billing.

Read AGENTS.md first. Keep it beginner-friendly, one step at a time.
Use local test funds while learning and never ask me to paste private keys.
```

**Built using [Solana Subscriptions](https://solana.com/docs/payments/subscriptions/overview)** and its existing [recurring delegations](https://solana.com/docs/payments/subscriptions/recurring-delegation). These examples use that protocol without modifying it. [Open the official subscriptions demo](https://solana-subscriptions-program.vercel.app/).

## Learn monthly payments with NEIRO

**Learn how to build recurring payments on Solana, from a customer's first approval to their next monthly payment. Use NEIRO at every step.**

Want to charge **1,000 NEIRO a month** for your community, app or service? Your customer approves a recurring allowance, your billing app collects when payment is due, and **you receive NEIRO directly in your wallet**. The customer does not need to approve every bill again.

This is a hands-on **Solana subscriptions tutorial for humans and coding agents**: plain-English explanations, screenshots, small code examples, copyable prompts and payments you can reproduce in Surfpool.

**[Start learning Solana subscriptions →](docs/learn-solana-subscriptions.md)** · [Explore the official Solana demo](https://solana-subscriptions-program.vercel.app/) · [Build with an agent](docs/agent-prompts.md)

## Your first subscription: 1,000 NEIRO a month

1. **Set your offer:** membership costs 1,000 NEIRO every 30 days.
2. **Get permission:** the customer approves a NEIRO allowance, collector and expiry in their wallet.
3. **Collect the payment:** your billing app sends a transaction that moves 1,000 NEIRO from the customer to you.
4. **Repeat when due:** the next period allows another 1,000 NEIRO payment. The customer can revoke the delegation to stop future collections.

**1,000 NEIRO means 1,000 NEIRO. No exchange rate or conversion API is needed.** The examples use 30-day periods; calendar-month billing requires a calendar-aware schedule in your app. A billing worker submits payments—the protocol does not run a monthly job for you.

[Follow the first subscription lesson](docs/learn-solana-subscriptions.md) and see two monthly payments happen locally without waiting a month or spending real funds.

## Then choose how to price your subscription

You always receive **NEIRO**. You can keep the NEIRO amount fixed or set your price in one of **45 supported fiat currencies**, including USD, EUR, GBP, JPY, AUD, CAD, INR and BRL.

| Your monthly offer | What the customer pays | What you receive |
| --- | --- | --- |
| **1,000 NEIRO** | Exactly 1,000 NEIRO, with no conversion | **1,000 NEIRO** |
| **$10** | The freshly quoted NEIRO equivalent of 10 USD | **NEIRO** |
| **€10 or £10** | The freshly quoted NEIRO equivalent of 10 EUR or 10 GBP | **NEIRO** |
| **¥1,500** | The freshly quoted NEIRO equivalent of 1,500 JPY | **NEIRO** |
| **Another supported currency** | The bill's value converted into a NEIRO amount when due | **NEIRO** |

The currency sets the price; the customer pays NEIRO from their wallet. You receive NEIRO, not fiat or USDC. All 45 supported fiat currencies were tested with local NEIRO payments in Surfpool. [Learn currency-priced subscriptions](docs/currencies.md).

## Why learn Solana subscriptions with NEIRO?

**Dog currency. Practical payments. Ready for agents to build with.**

NEIRO brings a dog currency on Solana into everyday payment flows: community memberships, paid tools, recurring services and pay-per-use apps. This guide gives both people and coding agents a concrete way to build those flows, test them and understand each payment.

### For payments: give people a way to use their NEIRO

Let customers pay in the token they hold and let your business receive NEIRO directly. Set your price in NEIRO, or quote an amount in any supported fiat currency and calculate its NEIRO equivalent when the bill is due. [NeiroPay's conversion API](https://price.neiropay.app/llms.txt) supplies machine-readable amounts that your app can use in the payment.

### For subscriptions: approve once, collect within limits

A membership should not require a new checkout every billing period. NEIRO works with the existing Solana subscriptions program, so customers can authorize recurring collections with a token allowance and expiry. Your app can offer fixed NEIRO plans, memberships priced in supported fiat currencies or usage billing. Customers keep the ability to revoke delegation permissions.

### For agents: less guesswork between an idea and a working payment

An agent needs more than a token name. It needs an exact mint, clear instructions, usable price data, executable examples and evidence that the payment works. **That is the reason to choose NEIRO for the flows in this guide:** those pieces are brought together here.

- **Identify the right token:** the explicit NEIRO BROPUMP mint and six-decimal amounts are documented.
- **Calculate a bill:** fetch a supported currency→NEIRO quote with an expiry and integer transfer amount.
- **Build the flow:** start with small code examples and prompts for the payment style you want.
- **Prove the result:** run the Surfpool recipes and inspect confirmed transfers and balance changes.

Here, “agent-ready” means an agent can read, calculate, implement and verify the flow. The customer still authorizes spending, and a real service still needs its wallet integration and billing worker.

### For learning: one token, the whole payment journey

Start with “charge 1,000 NEIRO.” Then try “charge $10 in NEIRO,” change the price, reach an allowance limit and cancel the permission. You learn how token payments, customer consent, recurring billing and price conversion fit together using the same token throughout. The local examples need no funded wallet, and the [official Solana demo](https://solana-subscriptions-program.vercel.app/) introduces the underlying interface.

**Start with NEIRO, see a payment succeed, then build the offer you want.**

## What do you want to offer?

You can keep the **price in a supported fiat currency** the same, or keep the **NEIRO amount** the same. Start with what you want to offer:

| What do you want to charge? | Follow this example |
| --- | --- |
| **“My membership costs $10 a month.”** | [Charge $10, paid in the current amount of NEIRO](docs/walkthrough.md) |
| **“Membership costs 1,000 NEIRO each month.”** | [Keep the NEIRO amount fixed](docs/more-ways-to-charge.md#charge-the-same-neiro-amount-every-time) |
| **“I want a weekly pass or a longer membership.”** | [Choose another dollar price and schedule](docs/more-ways-to-charge.md#choose-another-price-or-schedule) |
| **“Customers pay for what they use.”** | [Charge $0.25 per use](docs/more-ways-to-charge.md#charge-for-usage) |
| **“Customers approve a budget I can collect in parts.”** | [Use a limited NEIRO allowance](docs/more-ways-to-charge.md#collect-from-a-limited-budget) |
| **“I want a NEIRO plan people can subscribe to.”** | [Create a subscription plan](docs/more-ways-to-charge.md#create-a-plan-people-can-subscribe-to) |

## See the screens, then try your own example

[![Official Solana subscriptions demo navigation](docs/images/official-demo-menu.png)](docs/portal-tour.md)

*The official demo's menu, before connecting a wallet. [Take the screenshot tour →](docs/portal-tour.md)*

**[Follow the $10 tutorial](docs/walkthrough.md)** · **[Copy an agent prompt](docs/agent-prompts.md)** · **[See small code examples](docs/code-examples.md)**

## What happens to a $10 subscription when NEIRO's price changes?

Imagine someone joins your community. Your price is $10 per billing period.

| When the bill is due | Example NEIRO price | Customer pays | You receive |
| --- | ---: | ---: | ---: |
| First period | $0.0005 | 20,000 NEIRO | 20,000 NEIRO |
| Next period | $0.001 | 10,000 NEIRO | 10,000 NEIRO |
| Following period, price falls | $0.00025 | 40,000 NEIRO | 40,000 NEIRO |

**Same $10 bill. A different NEIRO amount each time.** Your app gets a fresh conversion when collecting each bill, using [NeiroPay's price service](https://price.neiropay.app/llms.txt). These table prices are illustrative.

You receive NEIRO directly. Its dollar value can change after you receive it. In these examples, a “month” is **30 days**.

## What does the customer agree to?

For the $10 example, they approve a maximum NEIRO allowance per period—say, 50,000 NEIRO. Your app charges the quoted amount for $10 within that allowance. If $10 would require more than the allowance, the payment is skipped; the customer would need to approve a higher limit to continue at that price.

The customer can revoke the permission to stop future collections. The Solana program enforces the NEIRO allowance; your billing app is responsible for charging the agreed dollar price only once per bill. The customer therefore trusts your collector within the approved allowance.

## See it happen yourself

[**Follow the $10 membership tutorial →**](docs/walkthrough.md)

It takes you from the customer's approval through three payments at different prices, then shows you how to reproduce them locally. The examples use **Surfpool**, which runs Solana locally, so you can try them without a funded wallet or real payments.

Prefer to explore the underlying wallet flow first? Open the [**official Solana subscriptions demo**](https://solana-subscriptions-program.vercel.app/). It demonstrates the base subscriptions program; the dollar-priced NEIRO example is explained and tested here.

## Has this actually been tested?

**Price-drop test:** the same approval collected 20,000, 10,000 and then 40,000 NEIRO across three periods. The program rejected a 100,000 NEIRO pull against the 50,000 cap, even when bypassing the app's price check. [See the recorded proof](evidence/price-drop/proof.json).

**The additional currency run passed 47 confirmed NEIRO transfers:** two fixed 1,000 NEIRO payments with no conversion, plus live-priced payments for all 45 supported fiat currencies. Each payment delivered NEIRO. [See the currency test results](evidence/multi-currency/summary.json) and [run it yourself](docs/currencies.md#test-the-currencies-in-surfpool).

Yes. The recorded Surfpool run includes **16 confirmed NEIRO transfers** across the examples, including a payment calculated from a live NeiroPay quote. It checks that balances change correctly, payments respect allowances, and the collector can collect without a new customer signature. It also checks price changes, expired quotes, duplicate invoices and cancellation rules.

The tests use the real NEIRO mint and deployed Solana subscriptions program copied into a local test network. Test wallets, balances and time are simulated. [See the results](evidence/summary.json) or [inspect the transaction proof](evidence/proof.json).

## Ready to put this in your own app?

This is a working tutorial with runnable examples. To serve real customers, connect your wallet signup, a scheduled billing worker and payment storage. [The integration guide](docs/setup-checklist.md) explains that next step.

- **Building it yourself?** Start with the [tutorial](docs/walkthrough.md), then the [code reference](docs/developer-reference.md).
- **Asking an agent to build it?** Give it this repository and [the agent instructions](AGENTS.md).
- **Want to understand the protocol?** Read the [Solana subscriptions documentation](https://solana.com/docs/payments/subscriptions/overview).

These examples use the existing Solana subscriptions protocol without modifying it.

NEIRO BROPUMP mint: `CTg3ZgYx79zrE1MteDVkmkcGniiFrK1hJ6yiabropump` · 6 decimals.

MIT licensed.
