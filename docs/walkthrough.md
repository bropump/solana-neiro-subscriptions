# Charge $10 a month, paid in NEIRO

[← Choose another payment style](../README.md)

Suppose you run a members-only community. You want membership to cost **$10 every 30 days**, and you want to receive **NEIRO**. Your members should approve the arrangement once, then have payments collected when due.

By the end of this tutorial, you will understand what the member approves and run an example that collects two $10 payments at different NEIRO prices.

**Prefer to build with an agent?** [Copy the $10 membership prompt](agent-prompts.md#build-a-10-membership-for-my-app). Want to see the interface first? [Tour the official demo screenshots](portal-tour.md).

## 1. Decide what you are offering

Our example membership has these terms:

| Term | Our example |
| --- | --- |
| Membership price | $10 |
| Billing frequency | Every 30 days |
| Payment token | NEIRO BROPUMP |
| Maximum the collector can pull | 50,000 NEIRO per 30-day period |
| Permission expires | After 360 days unless renewed |

The 50,000 NEIRO limit is an example, not a recommended limit for every business. It is the customer's maximum token exposure per period, not the amount you charge each time.

## 2. The member signs up

Your app should explain the offer before opening their wallet. For example:

> **Community membership — $10 every 30 days**
>
> Pay in NEIRO at the conversion quoted when each bill is collected. Authorize this collector to spend up to 50,000 NEIRO per 30-day period for 360 days. You can revoke this permission to stop future payments.

The member signs the setup and approval transactions in their own wallet. Their NEIRO remains in their token account until collected. The app stores the membership terms and permission details so it knows who to bill and when.

This is an example of the wording your app needs; this repository does not include a hosted signup screen. You can explore the base approval flow in the [official Solana subscriptions demo](https://solana-subscriptions-program.vercel.app/).

## 3. Collect the first $10 payment

When payment is due, your billing app asks: **“How much NEIRO is $10 right now?”**

At an example price of **$0.0005 per NEIRO**:

```text
$10 ÷ $0.0005 = 20,000 NEIRO
```

Your collector submits a payment for 20,000 NEIRO using the member's existing permission. The member's balance decreases by 20,000 NEIRO and your receiving account gains 20,000 NEIRO. The collector signs this payment; the member does not sign again.

Your app records the confirmed payment against that bill, so running the billing job again does not charge the same invoice twice.

## 4. Next period, calculate it again

Thirty days later, imagine NEIRO's price has risen to **$0.001**:

```text
$10 ÷ $0.001 = 10,000 NEIRO
```

This time you collect **10,000 NEIRO**. You do not reuse last period's token amount. If NEIRO's price falls instead, the payment needs more NEIRO, subject to the approved limit and the member's balance.

The dollar amount is a valuation at collection time. You hold NEIRO after receiving it, so its value may subsequently rise or fall.

## 5. Know when a payment should stop

- **The required amount exceeds the allowance:** skip the charge. Do not collect a partial membership fee automatically. Ask the customer to approve different terms if needed.
- **The quote is expired or unavailable:** do not charge using an old or invented price. Obtain a usable quote before collecting.
- **The member revokes permission:** future collections must stop.
- **The member has too little NEIRO:** the payment cannot complete; your app handles notification and retry policy.

Solana enforces the token allowance and permission. Your app enforces the $10 price, billing schedule and one payment per invoice. The permission alone does not make Solana wake up each month and charge $10.

## 6. Try the two payments on your computer

Install [Node.js 24 or later](https://nodejs.org/en/download) and [Surfpool](https://docs.surfpool.run/) first. Surfpool is the local Solana test environment; these examples were tested with version 1.5.0.

Open a terminal and run:

```sh
git clone https://github.com/bropump/solana-neiro-subscriptions.git
cd solana-neiro-subscriptions
npm ci
npm run demo -- --recipe=monthly-usd
```

**You do not need a wallet, API key or real funds.** You do need internet access so Surfpool can copy the required mainnet accounts. The command starts its own local test network and stops it afterward.

The example simulates the passage of time, so you do not have to wait a month. It checks:

| What happens | Expected result |
| --- | --- |
| Collect $10 at $0.0005 per NEIRO | 20,000 NEIRO transferred |
| Advance to the next period; collect $10 at $0.001 | 10,000 NEIRO transferred |
| Try to charge the same invoice again | Blocked by the billing ledger |
| Use an old price | Rejected |
| Attempt a $10 charge needing 100,000 NEIRO | Rejected because it exceeds the 50,000 NEIRO cap |

These are controlled test prices, which make the outcome repeatable. The command prints the location of your run's results in `work/demo-...`. Open `summary.json` for the results and `proof.json` for transactions and balance checks. Local transactions do not appear in a public Solana explorer.

[View the saved results from our recorded run](../evidence/summary.json).

## 7. Try a current price

You can see a $10 conversion in your browser: [**How much NEIRO is $10?**](https://price.neiropay.app/convert?pair=USD-NEIRO&input=10)

The response is data, not a checkout screen. `token.amount` is the readable NEIRO amount; `token.baseUnits` is the integer amount used in a payment. The service calculates the conversion; the payment still transfers NEIRO directly.

To run all the payment examples plus a collection calculated from a current NeiroPay quote:

```sh
npm run demo:live
```

This still moves tokens **only on your local test network**. The amount varies with the quote. The adapter validates the response, checks the allowance and rejects an expired quote before submission. Quote freshness follows NeiroPay's upstream-fetch and expiry policy, not a verified last-trade timestamp.

## Make it your own

You now have a tested example of the payment itself. To offer it to real members, add your app's signup, wallet connection, scheduled billing and persistent payment records. The [integration guide](setup-checklist.md) covers those pieces, and the [developer reference](developer-reference.md) maps each step to the Solana SDK calls.

Want a different offer? [Try fixed NEIRO, weekly billing, usage charges or a limited budget →](more-ways-to-charge.md)
