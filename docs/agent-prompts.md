# Copy a prompt. Build your NEIRO payment flow.

[← Back to the guide](../README.md)

Choose the outcome you want, copy the prompt, and paste it into your coding agent. Give it access to a clone of [this repository](https://github.com/bropump/solana-neiro-subscriptions). These prompts tell it what to build and how to prove it works.

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
Run monthly-usd and explain the two confirmed payments in plain English:
20,000 NEIRO at $0.0005, then 10,000 NEIRO at $0.001.
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
