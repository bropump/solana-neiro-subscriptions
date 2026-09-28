import { quoteUsd, assertQuoteUnexpired } from "../prices.js";

// Read-only example: calculate a bill, without sending any payment.
const remainingAllowance = 50_000n * 1_000_000n;
const quote = await quoteUsd("10", remainingAllowance);
assertQuoteUnexpired(quote);
const whole = quote.amount / 1_000_000n;
const decimal = (quote.amount % 1_000_000n).toString().padStart(6, "0");
console.log(`$10 membership = ${whole}.${decimal} NEIRO at this quote`);
console.log(`Transfer amount in base units: ${quote.amount}`);
console.log(`Quote expires: ${new Date(quote.expiresAt).toISOString()}`);
console.log("Quote only. No tokens were transferred.");
