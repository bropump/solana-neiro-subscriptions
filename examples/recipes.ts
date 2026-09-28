import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import {
  findPlanPda,
  findSubscriptionDelegationPda,
  fetchRecurringDelegation,
  fetchSubscriptionDelegation,
} from "@solana/subscriptions";
import { BillingLedger, chargeAmount, PERIOD, type Price } from "../billing.js";
import { quoteFiat, quoteUsd, assertQuoteUnexpired } from "../prices.js";
import {
  fixture,
  mint,
  UNIT,
  TOKEN_PROGRAM_ADDRESS,
  evidence,
  chainTime,
} from "./harness.js";
const results: any[] = [];
const price = (usdPerNeiro: string, now: bigint): Price => ({
  usdPerNeiro,
  observedAt: Number(now),
  fetchedAt: Number(now),
  source: "CONTROLLED TEST FIXTURE",
});

// 1. Same NEIRO amount every month. The protocol cap itself limits the month.
async function fixedNeiro() {
  const f = await fixture("fixed-neiro");
  await f.recurring(1000n * UNIT, PERIOD);
  await f.send(await f.transfer(1000n * UNIT), 1000n * UNIT);
  await f.reject(
    "monthly NEIRO cap",
    async () => f.send(await f.transfer(UNIT), UNIT),
    /400|0x190/,
  );
  await f.advance(PERIOD + 1n);
  await f.send(await f.transfer(1000n * UNIT), 1000n * UNIT);
  await f.uc.subscriptions.instructions
    .revokeDelegation({
      authority: f.customer,
      delegationAccount: f.delegationPda,
    })
    .sendTransaction();
  await f.reject(
    "customer revoked",
    async () => f.send(await f.transfer(UNIT), UNIT),
    /InvalidAccountOwner|Invalid account owner/,
  );
  results.push({
    recipe: "fixed-neiro",
    outcome: "passed",
    chargesNEIRO: ["1000", "1000"],
    periodDays: 30,
  });
  console.log(
    "PASS fixed NEIRO: 1,000 each month; cap, reset and revocation enforced.",
  );
}

// 2. Fixed dollars, variable NEIRO. The invoice ledger is a backend rule.
async function monthlyUsd() {
  const f = await fixture("monthly-usd"),
    cap = 50000n * UNIT,
    db = new BillingLedger("monthly-invoices.sqlite");
  await f.recurring(cap, PERIOD);
  try {
    for (const [i, p, expected] of [
      [0, "0.0005", 20000n],
      [1, "0.001", 10000n],
    ] as const) {
      if (i) await f.advance(PERIOD + 1n);
      const now = await chainTime();
      const id = `${f.delegationPda}:${i}`;
      const receipt = await db.charge(
        id,
        price(p, now),
        Number(now),
        cap,
        async (n) => f.send(await f.transfer(n), n),
      );
      assert.equal(receipt.amount, expected * UNIT);
      await f.reject(
        "same invoice cannot charge twice",
        () =>
          db.charge(id, price(p, now), Number(now), cap, async (n) =>
            f.send(await f.transfer(n), n),
          ),
        /already/,
      );
    }
    await f.advance(PERIOD + 1n);
    const now = await chainTime();
    await f.reject(
      "stale dollar price",
      () =>
        db.charge(
          "stale",
          price("0.001", now - 61n),
          Number(now),
          cap,
          async (n) => f.send(await f.transfer(n), n),
        ),
      /Stale/,
    );
    await f.reject(
      "USD invoice over NEIRO cap",
      () =>
        db.charge("cap", price("0.0001", now), Number(now), cap, async (n) =>
          f.send(await f.transfer(n), n),
        ),
      /allowance/,
    );
  } finally {
    db.close();
  }
  results.push({
    recipe: "monthly-usd",
    outcome: "passed",
    usd: "10",
    prices: ["0.0005", "0.001"],
    chargesNEIRO: ["20000", "10000"],
  });
  console.log(
    "PASS monthly USD: $10 pulls 20,000 then 10,000 NEIRO as price doubles.",
  );
}

// 3. USD tiers and schedules use the same recipe, with different terms.
async function usdSchedules() {
  const cases = [
    { usd: "3", days: 7, expected: 6000n },
    { usd: "25", days: 90, expected: 50000n },
  ];
  for (const c of cases) {
    const f = await fixture(`usd-${c.days}-days`),
      seconds = BigInt(c.days) * 86400n,
      cap = 100000n * UNIT;
    await f.recurring(cap, seconds);
    const amount = chargeAmount(
      price("0.0005", f.now),
      Number(f.now),
      cap,
      60,
      c.usd,
    );
    assert.equal(amount, c.expected * UNIT);
    await f.send(await f.transfer(amount), amount);
    await f.advance(seconds + 1n);
    const reset = (await fetchRecurringDelegation(f.mc.rpc, f.delegationPda))
      .data;
    assert.equal(reset.amountPulledInPeriod, amount);
    await f.send(await f.transfer(amount), amount);
    const state = (await fetchRecurringDelegation(f.mc.rpc, f.delegationPda))
      .data;
    assert.equal(state.amountPulledInPeriod, amount);
    results.push({
      recipe: `usd-${c.days}-days`,
      outcome: "passed",
      usd: c.usd,
      periodDays: c.days,
      chargesNEIRO: [String(c.expected), String(c.expected)],
    });
  }
  console.log(
    "PASS USD schedules: $3 every 7 days and $25 every 90 days, including reset.",
  );
}

// 4. Metered usage: each unique usage event is a small USD invoice, under a daily NEIRO cap.
async function meteredUsd() {
  const f = await fixture("metered-usd"),
    cap = 1000n * UNIT,
    db = new BillingLedger("usage-invoices.sqlite");
  await f.recurring(cap, 86400n);
  try {
    const now = await chainTime();
    for (const [id, remaining] of [
      ["request-1", cap],
      ["request-2", cap - 500n * UNIT],
    ] as const) {
      await db.charge(
        `${f.delegationPda}:${id}`,
        price("0.0005", now),
        Number(now),
        remaining,
        async (n) => f.send(await f.transfer(n), n),
        "0.25",
      );
    }
    await f.reject(
      "daily usage cap",
      async () => f.send(await f.transfer(UNIT), UNIT),
      /400|0x190/,
    );
    await f.advance(86401n);
    await f.send(await f.transfer(500n * UNIT), 500n * UNIT);
  } finally {
    db.close();
  }
  results.push({
    recipe: "metered-usd",
    outcome: "passed",
    usdPerEvent: "0.25",
    chargesNEIRO: ["500", "500", "500"],
    dailyNEIROCap: "1000",
  });
  console.log("PASS metered USD: $0.25 per event, daily cap and reset.");
}

// 5. A fixed delegation is a total allowance; it does not reset each period.
async function fixedAllowance() {
  const f = await fixture("fixed-allowance");
  await f.uc.subscriptions.instructions
    .createFixedDelegation({
      tokenMint: mint,
      delegatee: f.merchant.address,
      nonce: 0n,
      amount: 3000n * UNIT,
      expiryTs: f.now + PERIOD,
    })
    .sendTransaction();
  const transfer = (amount: bigint) =>
    f.mc.subscriptions.instructions.transferFixed({
      delegatee: f.merchant,
      delegator: f.customer.address,
      delegatorAta: f.userAta,
      tokenMint: mint,
      delegationPda: f.delegationPda,
      amount,
      receiverAta: f.receiverAta,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });
  for (const amount of [1000n * UNIT, 2000n * UNIT])
    await f.send(await transfer(amount), amount);
  await f.reject(
    "total allowance exhausted",
    async () => f.send(await transfer(UNIT), UNIT),
    /300|0x12c/,
  );
  results.push({
    recipe: "fixed-allowance",
    outcome: "passed",
    totalNEIRO: "3000",
    chargesNEIRO: ["1000", "2000"],
  });
  console.log(
    "PASS fixed allowance: 3,000 NEIRO total, collected in two installments.",
  );
}

// 6. Native plan: merchant publishes NEIRO terms, customer subscribes.
async function nativePlan() {
  const f = await fixture("native-plan"),
    planId = 1n;
  const [planPda] = await findPlanPda({ owner: f.merchant.address, planId });
  const [subscriptionPda] = await findSubscriptionDelegationPda({
    planPda,
    subscriber: f.customer.address,
  });
  await f.offline(planPda);
  await f.offline(subscriptionPda);
  await f.mc.subscriptions.instructions
    .createPlan({
      planId,
      mint,
      amount: 1000n * UNIT,
      periodHours: 720n,
      endTs: 0n,
      destinations: [f.merchant.address],
      pullers: [],
      metadataUri: "https://github.com/bropump/solana-neiro-subscriptions",
    })
    .sendTransaction();
  await f.uc.subscriptions.instructions
    .subscribe({ merchant: f.merchant.address, planId, tokenMint: mint })
    .sendTransaction();
  const transfer = (amount: bigint, receiverAta = f.receiverAta) =>
    f.mc.subscriptions.instructions.transferSubscription({
      caller: f.merchant,
      delegator: f.customer.address,
      tokenMint: mint,
      subscriptionPda,
      planPda,
      amount,
      receiverAta,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });
  await f.reject(
    "plan destination allowlist",
    async () => f.send(await transfer(UNIT, f.userAta), UNIT),
    /506|0x1fa/,
  );
  await f.send(await transfer(1000n * UNIT), 1000n * UNIT);
  await f.reject(
    "plan period cap",
    async () => f.send(await transfer(UNIT), UNIT),
    /500|0x1f4|400|0x190/,
  );
  await f.advance(PERIOD + 1n);
  await f.send(await transfer(1000n * UNIT), 1000n * UNIT);
  // Ordinary cancellation is signed only by customer and takes effect at period end.
  await f.uc.subscriptions.instructions
    .cancelSubscription({ subscriber: f.customer, planPda, subscriptionPda })
    .sendTransaction();
  const cancelled = (
    await fetchSubscriptionDelegation(f.uc.rpc, subscriptionPda)
  ).data;
  assert.ok(cancelled.expiresAtTs > 0n);
  await f.advance(PERIOD + 2n);
  await f.reject(
    "plan cancelled at period end",
    async () => f.send(await transfer(UNIT), UNIT),
    /508|0x1fc|128|0x80/,
  );
  results.push({
    recipe: "native-plan",
    outcome: "passed",
    chargesNEIRO: ["1000", "1000"],
    periodDays: 30,
  });
  console.log(
    "PASS native plan: subscribe, collect, destination restriction, reset and cancellation.",
  );
}

// 7. Optional real conversion quote; still only a local NEIRO transfer.
async function liveNeiroPay() {
  const f = await fixture("neiropay-live"),
    cap = 100000n * UNIT;
  await f.recurring(cap, PERIOD);
  const quote = await quoteUsd("10", cap);
  await f.send(await f.transfer(quote.amount), quote.amount, () =>
    assertQuoteUnexpired(quote),
  );
  results.push({
    recipe: "neiropay-live",
    outcome: "passed",
    ...quote,
    amount: String(quote.amount),
  });
  console.log(
    `PASS NeiroPay live $10 conversion: ${Number(quote.amount) / 1e6} NEIRO transferred directly.`,
  );
}

// Live fiat prices, direct NEIRO settlement. Explicit opt-in network recipe.
async function multiCurrency() {
  await fixedNeiro(); // No conversion request in this fixed-token flow.
  const response = await fetch("https://price.neiropay.app/supported-currencies");
  assert.ok(response.ok, "Currency discovery failed");
  const supported = await response.json() as { fiats: string[]; pairs: string[] };
  assert.ok(Array.isArray(supported.fiats) && supported.fiats.length > 0);
  for (const currency of supported.fiats) {
    assert.ok(supported.pairs.includes(`${currency}-NEIRO`));
    const f = await fixture(`fiat-${currency}`);
    const cap = 100_000n * UNIT;
    await f.recurring(cap, PERIOD);
    // Space requests below the documented public rate limit.
    await new Promise(resolve => setTimeout(resolve, 1200));
    const quote = await quoteFiat(currency, "10", cap);
    await f.send(await f.transfer(quote.amount), quote.amount,
      () => assertQuoteUnexpired(quote));
    results.push({ recipe: `fiat-${currency}`, outcome: "passed", ...quote,
      amount: String(quote.amount), settlementToken: "NEIRO" });
    console.log(`PASS 10 ${currency}: ${quote.amount} NEIRO base units received; no USDC transfer.`);
  }
}

const selected = process.env.NEIRO_RECIPE ?? "all";
const recipes: Record<string, () => Promise<void>> = {
  "fixed-neiro": fixedNeiro,
  "monthly-usd": monthlyUsd,
  "usd-schedules": usdSchedules,
  "metered-usd": meteredUsd,
  "fixed-allowance": fixedAllowance,
  "native-plan": nativePlan,
};
if (selected === "multi-currency") {
  await multiCurrency();
} else if (selected === "all") {
  for (const recipe of Object.values(recipes)) await recipe();
} else {
  assert.ok(recipes[selected], `Unknown recipe ${selected}`);
  await recipes[selected]();
}
if (process.env.CHECK_LIVE_PRICE === "1") await liveNeiroPay();
const json = (v: unknown) =>
  JSON.stringify(v, (_, x) => (typeof x === "bigint" ? x.toString() : x), 2);
writeFileSync(
  "proof.json",
  json({
    generatedAt: new Date().toISOString(),
    scope:
      "Local Surfpool fork of mainnet NEIRO and deployed programs. Funding and time simulated. USD fixture prices explicitly labelled. No mainnet transactions.",
    mint,
    results,
    evidence,
  }),
);
writeFileSync(
  "summary.json",
  json({
    mint,
    results,
    confirmedTransfers: evidence.filter((e) => e.signature).length,
  }),
);
console.log(
  `ALL RECIPES PASSED (${evidence.filter((e) => e.signature).length} confirmed direct NEIRO transfers).`,
);
