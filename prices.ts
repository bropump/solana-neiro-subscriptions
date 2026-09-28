import { fraction } from "./billing.js";
/** NeiroPay's conversion is a quote, not a token swap. */
export type Conversion = {
  currency: string;
  invoiceAmount: string;
  usd?: string;
  amount: bigint;
  expiresAt: number;
  quotedAt: number;
  freshnessBasis: string;
  source: "price.neiropay.app";
};
export function validateConversion(
  raw: any,
  invoiceAmount: string,
  cap: bigint,
  now = Date.now(),
  currency = "USD",
): Conversion {
  const [n, d] = fraction(invoiceAmount);
  if (
    raw?.pair !== `${currency}-NEIRO` ||
    raw?.input?.currency !== currency ||
    raw?.token?.symbol !== "NEIRO" ||
    raw?.token?.decimals !== 6
  )
    throw new Error("Unexpected conversion token/pair");
  const [an, ad] = fraction(String(raw.input.amount));
  if (an * d !== n * ad)
    throw new Error("Conversion input differs from invoice");
  const expiresAt = Date.parse(raw.expiresAt),
    quotedAt = Date.parse(raw.timestamp);
  if (
    !Number.isFinite(expiresAt) ||
    !Number.isFinite(quotedAt) ||
    expiresAt <= now ||
    quotedAt > now + 5000 ||
    now - quotedAt > 60000 ||
    expiresAt - quotedAt > 120000
  )
    throw new Error("Expired or invalid conversion quote");
  if (
    typeof raw.token.baseUnits !== "string" ||
    !/^\d+$/.test(raw.token.baseUnits)
  )
    throw new Error("Invalid NEIRO base units");
  const amount = BigInt(raw.token.baseUnits);
  if (amount <= 0n || amount > cap)
    throw new Error("Conversion exceeds NEIRO allowance");
  if (typeof raw.freshnessBasis !== "string")
    throw new Error("Missing freshness provenance");
  return {
    currency,
    invoiceAmount,
    ...(currency === "USD" ? { usd: invoiceAmount } : {}),
    amount,
    expiresAt,
    quotedAt,
    freshnessBasis: raw.freshnessBasis,
    source: "price.neiropay.app",
  };
}
export function assertQuoteUnexpired(quote: Conversion, now = Date.now()) {
  if (now >= quote.expiresAt)
    throw new Error("Quote expired before submission; fetch a new quote");
}
export async function quoteFiat(
  currency: string,
  invoiceAmount: string,
  cap: bigint,
): Promise<Conversion> {
  if (!/^[A-Z]{3}$/.test(currency))
    throw new Error("Use an uppercase currency code");
  fraction(invoiceAmount);
  const response = await fetch(
    `https://price.neiropay.app/convert?${new URLSearchParams({ pair: `${currency}-NEIRO`, input: invoiceAmount })}`,
    { signal: AbortSignal.timeout(10000) },
  );
  if (!response.ok)
    throw new Error(`NeiroPay conversion unavailable: HTTP ${response.status}`);
  return validateConversion(
    await response.json(), invoiceAmount, cap, Date.now(), currency,
  );
}

export const quoteUsd = (usd: string, cap: bigint) => quoteFiat("USD", usd, cap);
