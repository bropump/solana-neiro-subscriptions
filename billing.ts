import { DatabaseSync } from "node:sqlite";
export const NEIRO = "CTg3ZgYx79zrE1MteDVkmkcGniiFrK1hJ6yiabropump";
export const UNIT = 1_000_000n;
export const PERIOD = 2_592_000n;
export type Price = {
  usdPerNeiro: string;
  observedAt: number;
  fetchedAt: number;
  source: string;
  blockId?: number;
};
export function fraction(value: string): [bigint, bigint] {
  const m = /^(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/.exec(value);
  if (!m) throw new Error("Invalid price");
  const scale = (m[2]?.length ?? 0) - Number(m[3] ?? 0);
  if (Math.abs(scale) > 40) throw new Error("Invalid price precision");
  let n = BigInt(m[1] + (m[2] ?? "")),
    d = 1n;
  if (scale >= 0) d = 10n ** BigInt(scale);
  else n *= 10n ** BigInt(-scale);
  if (n <= 0n) throw new Error("Price must be positive");
  return [n, d];
}
export function chargeAmount(
  price: Price,
  now: number,
  remaining: bigint,
  maxAge = 60,
  usdAmount = "10",
): bigint {
  for (const timestamp of [price.observedAt, price.fetchedAt]) {
    if (
      !Number.isFinite(timestamp) ||
      timestamp > now + 5 ||
      now - timestamp > maxAge
    )
      throw new Error("Stale or invalid price; do not charge");
  }
  const [n, d] = fraction(price.usdPerNeiro);
  // Round up by less than one NEIRO base unit (0.000001 NEIRO), never use floats for billing.
  const [usdN, usdD] = fraction(usdAmount);
  const denominator = usdD * n;
  const amount = (usdN * UNIT * d + denominator - 1n) / denominator;
  if (amount > remaining)
    throw new Error("Required NEIRO exceeds approved allowance; do not charge");
  return amount;
}
// Persistent UNIQUE invoice key prevents two backend workers claiming the same period.
// A failed/uncertain send remains pending: reconcile it, never blindly issue a new debit.
export class BillingLedger {
  db: DatabaseSync;
  constructor(path: string) {
    this.db = new DatabaseSync(path);
    this.db.exec(
      "CREATE TABLE IF NOT EXISTS invoices (id TEXT PRIMARY KEY, status TEXT NOT NULL, amount TEXT NOT NULL, price TEXT NOT NULL, signature TEXT)",
    );
  }
  async charge(
    id: string,
    price: Price,
    now: number,
    remaining: bigint,
    send: (amount: bigint) => Promise<string>,
    usdAmount = "10",
  ) {
    if (this.db.prepare("SELECT id FROM invoices WHERE id=?").get(id))
      throw new Error("Invoice already paid or pending");
    const amount = chargeAmount(price, now, remaining, 60, usdAmount);
    try {
      this.db
        .prepare("INSERT INTO invoices VALUES (?, ?, ?, ?, NULL)")
        .run(
          id,
          "pending",
          String(amount),
          JSON.stringify({ ...price, invoiceUsd: usdAmount }),
        );
    } catch {
      throw new Error("Invoice already paid or pending");
    }
    const signature = await send(amount);
    this.db
      .prepare("UPDATE invoices SET status=?,signature=? WHERE id=?")
      .run("paid", signature, id);
    return { id, amount, signature, price };
  }
  close() {
    this.db.close();
  }
}
