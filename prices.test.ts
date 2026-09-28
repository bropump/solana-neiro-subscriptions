import { test } from "node:test";
import assert from "node:assert/strict";
import { chargeAmount, UNIT } from "./billing.js";
import { validateConversion, assertQuoteUnexpired } from "./prices.js";
const raw = {
  pair: "USD-NEIRO",
  input: { currency: "USD", amount: "10" },
  token: { symbol: "NEIRO", decimals: 6, baseUnits: "20000000000" },
  timestamp: "2026-09-28T12:00:00Z",
  expiresAt: "2026-09-28T12:00:10Z",
  freshnessBasis: "upstream_fetch_time; not a verified market timestamp",
};
const now = Date.parse(raw.timestamp);
test("NeiroPay uses integer baseUnits and respects exact invoice and expiry", () => {
  const q = validateConversion(raw, "10.00", 50000n * UNIT, now);
  assert.equal(q.amount, 20000n * UNIT);
  assert.throws(() => assertQuoteUnexpired(q, q.expiresAt), /expired/);
  for (const bad of [
    { pair: "USD-USDC" },
    { input: { currency: "USD", amount: "20" } },
    { token: { symbol: "USDC", decimals: 6, baseUnits: "1" } },
    { expiresAt: raw.timestamp },
    { timestamp: "invalid" },
  ])
    assert.throws(() =>
      validateConversion({ ...raw, ...bad }, "10", 50000n * UNIT, now),
    );
  assert.throws(() => validateConversion(raw, "10", 100n, now), /allowance/);
});
test("USD tiers and per-use prices use exact base units", () => {
  const p = {
    usdPerNeiro: "0.0005",
    observedAt: 1000,
    fetchedAt: 1000,
    source: "fixture",
  };
  assert.equal(chargeAmount(p, 1000, 100000n * UNIT, 60, "25"), 50000n * UNIT);
  assert.equal(chargeAmount(p, 1000, 100000n * UNIT, 60, "0.25"), 500n * UNIT);
});
