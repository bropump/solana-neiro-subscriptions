import assert from "node:assert/strict";
import {
  address,
  createClient,
  generateKeyPairSigner,
  lamports,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  signTransactionMessageWithSigners,
  getBase64EncodedWireTransaction,
  getSignatureFromTransaction,
  type Instruction,
} from "@solana/kit";
import { signer } from "@solana/kit-plugin-signer";
import { surfpool } from "@solana/surfpool/kit";
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";
import {
  subscriptionsProgram,
  findSubscriptionAuthorityPda,
  findRecurringDelegationPda,
  findEventAuthorityPda,
} from "@solana/subscriptions";
import { NEIRO, UNIT } from "../billing.js";
export { UNIT, TOKEN_PROGRAM_ADDRESS };
export const mint = address(NEIRO);
const port = Number(process.env.NEIRO_DEMO_RPC_PORT ?? 20899),
  ws = Number(process.env.NEIRO_DEMO_WS_PORT ?? 20900);
for (const p of [port, ws])
  assert.ok(Number.isInteger(p) && p > 0 && p < 65536);
const url = `http://127.0.0.1:${port}`;
export const evidence: any[] = [];
export async function rpc(method: string, params: unknown[] = []) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(45000),
  });
  const b = await r.json();
  if (b.error) throw new Error(JSON.stringify(b.error));
  return b.result;
}
export async function chainTime() {
  const a = await rpc("getAccountInfo", [
    "SysvarC1ock11111111111111111111111111111111",
    { encoding: "base64" },
  ]);
  return Buffer.from(a.value.data[0], "base64").readBigInt64LE(32);
}
export async function fixture(name: string) {
  const customer = await generateKeyPairSigner(),
    merchant = await generateKeyPairSigner();
  const client = (s: typeof customer) =>
    createClient()
      .use(signer(s))
      .use(
        surfpool({ rpcUrl: url, rpcSubscriptionsUrl: `ws://127.0.0.1:${ws}` }),
      )
      .use(subscriptionsProgram());
  const uc = client(customer),
    mc = client(merchant);
  await uc.airdrop(customer.address, lamports(2_000_000_000n));
  await mc.airdrop(merchant.address, lamports(2_000_000_000n));
  const info = await rpc("getAccountInfo", [mint, { encoding: "jsonParsed" }]);
  assert.equal(info.value.owner, TOKEN_PROGRAM_ADDRESS);
  assert.equal(info.value.data.parsed.info.decimals, 6);
  await uc.cheatcodes
    .setTokenAccount(
      customer.address,
      mint,
      { amount: 1_000_000n * UNIT },
      TOKEN_PROGRAM_ADDRESS,
    )
    .send();
  await uc.cheatcodes
    .setTokenAccount(
      merchant.address,
      mint,
      { amount: 0n },
      TOKEN_PROGRAM_ADDRESS,
    )
    .send();
  const [userAta] = await findAssociatedTokenPda({
    mint,
    owner: customer.address,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });
  const [receiverAta] = await findAssociatedTokenPda({
    mint,
    owner: merchant.address,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });
  const [subscriptionAuthority] = await findSubscriptionAuthorityPda({
    user: customer.address,
    tokenMint: mint,
  });
  const [delegationPda] = await findRecurringDelegationPda({
    subscriptionAuthority,
    delegator: customer.address,
    delegatee: merchant.address,
    nonce: 0n,
  });
  const [event] = await findEventAuthorityPda();
  const offline = async (p: ReturnType<typeof address>) => {
    await uc.cheatcodes.offlineAccount(p).send();
  };
  for (const a of [subscriptionAuthority, delegationPda, event])
    await offline(a);
  await uc.subscriptions.instructions
    .initSubscriptionAuthority({
      tokenMint: mint,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
      userAta,
    })
    .sendTransaction();
  const now = await chainTime();
  const balances = async () => ({
    customer: BigInt(
      (await rpc("getTokenAccountBalance", [userAta])).value.amount,
    ),
    merchant: BigInt(
      (await rpc("getTokenAccountBalance", [receiverAta])).value.amount,
    ),
  });
  let lastBlockhash = "";
  async function send(
    ix: Instruction,
    amount: bigint,
    beforeBroadcast?: () => void,
  ) {
    const before = await balances();
    // Distinct test invoices with identical amounts must not reuse an identical signed message.
    let bh = (
      await mc.rpc.getLatestBlockhash({ commitment: "confirmed" }).send()
    ).value;
    for (let i = 0; bh.blockhash === lastBlockhash && i < 20; i++) {
      await new Promise((r) => setTimeout(r, 250));
      bh = (await mc.rpc.getLatestBlockhash({ commitment: "confirmed" }).send())
        .value;
    }
    assert.notEqual(
      bh.blockhash,
      lastBlockhash,
      "Local block production stalled",
    );
    lastBlockhash = bh.blockhash;
    let m: any = createTransactionMessage({ version: 0 });
    m = setTransactionMessageFeePayerSigner(merchant, m);
    m = setTransactionMessageLifetimeUsingBlockhash(bh, m);
    m = appendTransactionMessageInstructions([ix], m);
    const signed = await signTransactionMessageWithSigners(m),
      wire = getBase64EncodedWireTransaction(signed),
      signature = getSignatureFromTransaction(signed);
    beforeBroadcast?.();
    await rpc("sendTransaction", [
      wire,
      { encoding: "base64", skipPreflight: false, maxRetries: 0 },
    ]);
    let tx: any;
    for (let i = 0; i < 40; i++) {
      tx = await rpc("getTransaction", [
        signature,
        {
          encoding: "jsonParsed",
          maxSupportedTransactionVersion: 0,
          commitment: "confirmed",
        },
      ]);
      if (tx) break;
      await new Promise((r) => setTimeout(r, 250));
    }
    assert.ok(tx, "Unknown confirmation; reconcile before retry");
    assert.equal(tx.meta.err, null);
    assert.deepEqual(
      tx.transaction.message.accountKeys
        .filter((a: any) => a.signer)
        .map((a: any) => a.pubkey),
      [merchant.address],
    );
    const transfers = tx.meta.innerInstructions
      .flatMap((g: any) => g.instructions)
      .filter((i: any) => i.parsed?.type === "transferChecked");
    assert.equal(transfers.length, 1);
    assert.equal(transfers[0].parsed.info.mint, mint);
    assert.equal(transfers[0].parsed.info.destination, receiverAta);
    assert.equal(transfers[0].parsed.info.tokenAmount.amount, String(amount));
    for (const b of [...tx.meta.preTokenBalances, ...tx.meta.postTokenBalances])
      assert.equal(b.mint, mint);
    const after = await balances();
    assert.equal(before.customer - after.customer, amount);
    assert.equal(after.merchant - before.merchant, amount);
    evidence.push({
      recipe: name,
      signature,
      amountBaseUnits: String(amount),
      customer: customer.address,
      merchant: merchant.address,
      before,
      after,
      transaction: tx,
    });
    return signature;
  }
  const transfer = async (amount: bigint) =>
    await mc.subscriptions.instructions.transferRecurring({
      delegatee: merchant,
      delegator: customer.address,
      delegatorAta: userAta,
      tokenMint: mint,
      delegationPda,
      amount,
      receiverAta,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });
  const recurring = async (
    cap: bigint,
    seconds: bigint,
    expiry = now + seconds * 12n,
  ) => {
    await uc.subscriptions.instructions
      .createRecurringDelegation({
        tokenMint: mint,
        delegatee: merchant.address,
        nonce: 0n,
        amountPerPeriod: cap,
        periodLengthS: seconds,
        startTs: now,
        expiryTs: expiry,
      })
      .sendTransaction();
  };
  const advance = async (seconds: bigint) => {
    await uc.cheatcodes
      .timeTravel({
        absoluteTimestamp: Number((await chainTime()) + seconds) * 1000,
      })
      .send();
  };
  async function reject(
    label: string,
    fn: () => Promise<unknown>,
    match: RegExp,
  ) {
    const before = await balances();
    let failure;
    try {
      await fn();
    } catch (e) {
      failure = String(e);
    }
    assert.ok(
      failure && match.test(failure),
      `${label}: ${failure ?? "unexpected success"}`,
    );
    assert.deepEqual(await balances(), before);
    evidence.push({
      recipe: name,
      rejected: label,
      error: failure,
      balances: before,
    });
    console.log(`  PASS ${label}`);
  }
  return {
    name,
    customer,
    merchant,
    uc,
    mc,
    now,
    userAta,
    receiverAta,
    subscriptionAuthority,
    delegationPda,
    offline,
    send,
    transfer,
    recurring,
    advance,
    reject,
    balances,
  };
}
