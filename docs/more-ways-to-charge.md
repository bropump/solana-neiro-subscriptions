# Choose how you want to get paid

[← Start here](../README.md) · [First-time setup](walkthrough.md#6-try-the-two-payments-on-your-computer)

Not every service needs a $10 monthly membership. Here are five other offers you can make using NEIRO, with a local example for each. Run these commands from the repository folder after completing the setup in the tutorial.

## Charge the same NEIRO amount every time

**Your offer:** “Join my community for 1,000 NEIRO every 30 days.”

The customer approves recurring permission. Each period you collect 1,000 NEIRO. If NEIRO's dollar price changes, the number of tokens stays the same; the dollar value of membership changes.

Use this when you want to price your service in NEIRO itself.

```sh
npm run demo -- --recipe=fixed-neiro
```

The example collects two 1,000 NEIRO payments in different periods, checks that the period limit cannot be exceeded, and verifies revocation stops collection.

## Choose another price or schedule

**Your offer:** “A weekly pass is $3,” or “A 90-day membership is $25.”

The process is the same as the [$10 tutorial](walkthrough.md): get a fresh conversion when each bill is due, then collect the NEIRO amount within the customer's approved allowance.

At the example price of $0.0005 per NEIRO:

| Offer | NEIRO per bill at this example price |
| --- | ---: |
| $3 every 7 days | 6,000 |
| $25 every 90 days | 50,000 |

```sh
npm run demo -- --recipe=usd-schedules
```

The example collects each offer twice and verifies the allowance resets for the next period. These are exact day counts; a calendar-month or calendar-quarter schedule needs corresponding billing logic in your app.

## Charge for usage

**Your offer:** “Each completed action costs $0.25, paid in NEIRO.”

Think of a paid tool or service where people pay when they use it. Give each billable action a unique ID, quote its dollar cost in NEIRO, and collect that amount. Multiple actions share the customer's daily token allowance.

At $0.0005 per NEIRO, a $0.25 action costs 500 NEIRO. With a 1,000 NEIRO daily allowance, two such actions fit; a third payment exceeds the limit.

```sh
npm run demo -- --recipe=metered-usd
```

The example checks those two payments, rejects the third, then collects again after the daily allowance resets. The allowance is in NEIRO. If you promise a separate dollar spending limit, your app must track that too.

## Collect from a limited budget

**Your offer:** “Authorize up to 3,000 NEIRO for this work; I will collect it in installments.”

The customer grants a total allowance. You collect 1,000 NEIRO, then 2,000 NEIRO. The budget is now exhausted. It does not refill next month.

Use this for a finite arrangement where the customer wants a clear total token limit.

```sh
npm run demo -- --recipe=fixed-allowance
```

The example confirms both installments and rejects another collection. You can calculate the starting allowance from a dollar quote when it is approved, but the resulting budget stays a fixed NEIRO amount.

## Create a plan people can subscribe to

**Your offer:** “Subscribe to my 1,000 NEIRO / 30-day plan.”

You publish the NEIRO price, billing period and allowed receiving accounts in a Solana subscription plan. The customer subscribes to those terms, then your collector collects payments under the plan.

Use this when you want the protocol's native plan-and-subscribe flow with a fixed token price. Native plans do not automatically adjust the NEIRO amount to track a dollar price. For that, follow the [$10 tutorial](walkthrough.md).

```sh
npm run demo -- --recipe=native-plan
```

The example checks two payments across periods, rejects a disallowed receiving account and checks the period limit. It also tests ordinary cancellation taking effect at the end of the period.

## Explore or build

You can explore the base protocol in the [official Solana subscriptions demo](https://solana-subscriptions-program.vercel.app/). For the code behind these examples, use the [developer reference](developer-reference.md) and [executable recipes](../examples/recipes.ts).

To run all six examples together:

```sh
npm run demo
```

All transfers run locally in Surfpool. To connect real customers, follow the [integration guide](setup-checklist.md).
