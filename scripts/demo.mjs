import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdirSync, mkdtempSync, openSync, closeSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
mkdirSync(join(root, "work"), { recursive: true });
const cwd = mkdtempSync(join(root, "work", "demo-"));
async function freePort() {
  const s = createServer();
  await new Promise((ok, no) => {
    s.once("error", no);
    s.listen(0, "127.0.0.1", ok);
  });
  const port = s.address().port;
  await new Promise((ok) => s.close(ok));
  return port;
}
const rpcPort = await freePort();
let wsPort = await freePort();
while (wsPort === rpcPort) wsPort = await freePort();
const fd = openSync(join(cwd, "surfpool.log"), "w");
const server = spawn(
  "surfpool",
  [
    "start",
    "--network",
    "mainnet",
    "--port",
    String(rpcPort),
    "--ws-port",
    String(wsPort),
    "--no-deploy",
    "--no-tui",
    "--no-studio",
    "--airdrop-amount",
    "0",
  ],
  { cwd, stdio: ["ignore", fd, fd] },
);
let startError;
server.on("error", (e) => {
  startError = e;
});
let test;
const stop = () => {
  test?.kill("SIGTERM");
  server.kill("SIGTERM");
};
process.once("SIGINT", () => {
  stop();
  process.exitCode = 130;
});
process.once("SIGTERM", () => {
  stop();
  process.exitCode = 143;
});
try {
  console.log("Starting an isolated local Surfpool instance…");
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (startError)
      throw new Error(
        "Surfpool could not start. Install Surfpool and ensure it is on PATH.",
      );
    if (server.exitCode !== null)
      throw new Error(`Surfpool exited; inspect ${join(cwd, "surfpool.log")}`);
    try {
      const r = await fetch(`http://127.0.0.1:${rpcPort}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getHealth" }),
        signal: AbortSignal.timeout(500),
      });
      if ((await r.json()).result === "ok") {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  if (!ready)
    throw new Error(
      `Surfpool startup timed out; inspect ${join(cwd, "surfpool.log")}`,
    );
  test = spawn(
    process.execPath,
    ["--import", "tsx", join(root, "examples/recipes.ts")],
    {
      cwd,
      stdio: "inherit",
      env: {
        ...process.env,
        NEIRO_DEMO_RPC_PORT: String(rpcPort),
        NEIRO_DEMO_WS_PORT: String(wsPort),
        CHECK_LIVE_PRICE: process.argv.includes("--live") ? "1" : "0",
        NEIRO_RECIPE:
          process.argv.find((x) => x.startsWith("--recipe="))?.split("=")[1] ??
          "all",
      },
    },
  );
  const code = await new Promise((ok, no) => {
    test.once("error", no);
    test.once("exit", (c) => ok(c ?? 1));
  });
  process.exitCode = Number(code);
  console.log(`Run files: ${cwd}`);
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  stop();
  closeSync(fd);
}
