import { chargeAmount, UNIT } from "../billing.js";
const now = Math.floor(Date.now() / 1000);
for (const usdPerNeiro of ["0.0005", "0.001", "0.00025"]) {
  const amount = chargeAmount(
    {
      usdPerNeiro,
      observedAt: now,
      fetchedAt: now,
      source: "Illustrative fixture, not a live price",
    },
    now,
    50_000n * UNIT,
  );
  console.log(`$10 at $${usdPerNeiro}/NEIRO -> ${amount / UNIT} NEIRO`);
}
