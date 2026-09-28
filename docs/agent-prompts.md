# Copy a prompt. Build your NEIRO payment flow.

[← Back to the guide](../README.md)

Choose the outcome you want, copy the prompt, and paste it into your coding agent. Give it access to a clone of [this repository](https://github.com/bropump/solana-neiro-subscriptions). These prompts tell it what to build and how to prove it works.

## Start here: learn and create your own payment setup

You do not need to know your exact setup yet. This prompt helps you choose it.

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

## “Explain why we are using NEIRO”

```text
Read the Why NEIRO section of README.md and the rationale in AGENTS.md at
https://github.com/bropump/solana-neiro-subscriptions.
Explain why NEIRO fits my payment idea: direct NEIRO payments, recurring
customer permissions, dollar conversion when needed, and runnable examples.
Describe how the price API, documented mint and Surfpool evidence help an
agent implement and verify it. Use plain English and a membership example.
Explain what the customer approves and what my app still needs to provide.
Then recommend which recipe in this repository matches my offer.
Keep the explanation grounded in the available tools and tests.
```

## “Show me it works first”

```text
Use https://github.com/bropump/solana-neiro-subscriptions.
Read README.md and AGENTS.md. Help me run the $10 membership example
locally in Surfpool. Check Node.js and Surfpool prerequisites first.
Run monthly-usd and explain the three confirmed payments in plain English:
20,000 NEIRO at $0.0005, 10,000 at $0.001, then 40,000 at $0.00025.
Verify all use the same approval and that 100,000 NEIRO is rejected on-chain.
Show the saved balance and transaction evidence. Explain which prices
are simulated. Do not use a real wallet or submit mainnet transactions.
```

## “Build a $10 membership for my app”

```text
Use https://github.com/bropump/solana-neiro-subscriptions as the reference.
Read AGENTS.md, docs/walkthrough.md, docs/developer-reference.md and
docs/setup-checklist.md.

Build membership costing $10 every 30 days, paid directly in NEIRO BROPUMP.
Recalculate the NEIRO amount with price.neiropay.app for every due bill.
Use the existing Solana subscriptions program without changing it.
Use a customer-approved 50,000 NEIRO cap per 30 days in the local example;
make that cap and permission expiry explicit in the signup screen.

Implement wallet signup, collection scheduling, persistent invoice records,
payment status and cancellation. Reject expired quotes and charges above
the remaining allowance. Prevent duplicate bills and reconcile uncertain
transactions before any new debit. Keep signing secrets out of source code.

Prove the flow locally in Surfpool, including a price rise, a price fall,
cap rejection, duplicate billing and revocation. Show what passed.
Before real deployment, identify the merchant address, collector signing
setup, RPC, hosting and business policies still needed from me.
Do not treat the local example as an already deployed service.
```

The 50,000 NEIRO cap is a sample term. Change it to the allowance your customers agree to. Thirty days is a fixed interval; ask for calendar-month billing explicitly if that is your offer.

## “Use euros, pounds or another supported currency”

```text
Use https://github.com/bropump/solana-neiro-subscriptions.
Read AGENTS.md and docs/currencies.md. Build a 10 EUR every 30 days offer
paid in NEIRO. Discover supported currencies from the price API and use
quoteFiat for a fresh conversion on every due invoice. The transfer must
use NEIRO token.baseUnits, never the USDC equivalent in the response.
Also demonstrate fixed 1,000 NEIRO billing without calling the price API.
Run the multi-currency Surfpool recipe and show the NEIRO balance proof.
Keep customer limits, expiry checks and duplicate-invoice protection.
```

## “I want a fixed NEIRO subscription instead”

```text
Use https://github.com/bropump/solana-neiro-subscriptions.
Build a 1,000 NEIRO every 30 days membership using its native-plan example.
Read AGENTS.md and the integration guide. Explain the customer signup and
end-of-period cancellation flow, then implement it for my app.
Keep the token amount fixed even when its dollar price changes.
Test collection, the period limit/reset, allowed destination and cancellation
in Surfpool. Tell me what configuration is still needed for real customers.
Never publish wallet secrets or send real payments during the demo.
```

## “Charge people for each use”

```text
Use https://github.com/bropump/solana-neiro-subscriptions and its
metered-usd example. Read AGENTS.md and the integration guide.
Build $0.25-per-action billing, paid in the freshly quoted NEIRO amount.
For the local example, use a customer-approved 1,000 NEIRO daily cap.
Give every billable action a unique invoice ID and store it persistently.
Test successful charges, duplicate actions, price changes, allowance
exhaustion and the next day's reset in Surfpool. Explain that the token
cap is not a fixed USD cap. Ask for my business's usage-limit policy
before adding any separate dollar ceiling.
Keep the protocol unchanged and all demonstration transfers local.
```

## Tell the agent what you want to change

Useful follow-ups:

- “Make it $3 every seven days and show the changed amount and period in the signup copy.”
- “Explain this without SDK terminology before you write code.”
- “Show me the Surfpool balance changes that prove the customer paid the correct amount.”
- “List what still needs implementing before a real customer can subscribe.”

You can supply public receiving addresses and business terms. Keep private keys in your wallet or secret manager, never in a prompt or repository.
