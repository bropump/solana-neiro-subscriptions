import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chargeAmount, BillingLedger } from "./billing.js";
const p = (v: string) => ({
  usdPerNeiro: v,
  observedAt: 1000,
  fetchedAt: 1000,
  source: "TEST FIXTURE",
});
test("$10 uses current price, exact integer arithmetic and six decimals", () => {
  assert.equal(chargeAmount(p("0.0005"), 1000, 10n ** 15n), 20_000_000_000n);
  assert.equal(chargeAmount(p("0.001"), 1000, 10n ** 15n), 10_000_000_000n);
  assert.equal(chargeAmount(p("3e-4"), 1000, 10n ** 15n), 33_333_333_334n);
});
test("invalid, stale and above-cap prices never charge", () => {
  for (const v of ["0", "-1", "NaN", "Infinity"])
    assert.throws(() => chargeAmount(p(v), 1000, 10n ** 15n));
  assert.throws(() => chargeAmount(p("0.001"), 1061, 10n ** 15n), /Stale/);
  assert.throws(
    () => chargeAmount({ ...p("0.001"), observedAt: 900 }, 1000, 10n ** 15n),
    /Stale/,
  );
  assert.throws(
    () => chargeAmount(p("0.0001"), 1000, 50_000_000_000n),
    /allowance/,
  );
});
test("duplicate, concurrent and restarted workers cannot double debit; uncertain sends stay pending", async () => {
  const path = join(
    mkdtempSync(join(tmpdir(), "neiro-billing-")),
    "ledger.sqlite",
  );
  let db = new BillingLedger(path),
    sends = 0;
  const send = async () => {
    sends++;
    return "confirmed-signature";
  };
  const results = await Promise.allSettled([
    db.charge("period-1", p("0.001"), 1000, 10n ** 15n, send),
    db.charge("period-1", p("0.001"), 1000, 10n ** 15n, send),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(sends, 1);
  db.close();
  db = new BillingLedger(path);
  await assert.rejects(
    () => db.charge("period-1", p("0.001"), 1000, 10n ** 15n, send),
    /already/,
  );
  await assert.rejects(
    () =>
      db.charge("period-2", p("0.001"), 1000, 10n ** 15n, async () => {
        throw new Error("confirmation unknown");
      }),
    /unknown/,
  );
  await assert.rejects(
    () => db.charge("period-2", p("0.001"), 1000, 10n ** 15n, send),
    /pending/,
  );
  assert.equal(sends, 1);
  db.close();
});
