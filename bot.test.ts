import { test, expect, describe, beforeAll, setDefaultTimeout } from "bun:test";

setDefaultTimeout(60_000);
import { createPublicClient, http, type Address } from "viem";
import { base } from "viem/chains";
import { Bot } from "grammy";
import { pixieVrdga } from "./pixieVrgda";
import { vrdgaDeployerAbi } from "./vrdgaDeployer";
import { mintMessage, deployedMessage, closedMessage } from "./messages";
import type { Hash } from "viem";

const TX_HASH = "0xabc123def456789000000000000000000000000000000000000000000000dead" as Hash;
const ADDR = "0x5ff1658A7dc6F15398CD9d5A34dC0685082599a5";
const DEPLOYER_ADDRESS = process.env.DEPLOYER_ADDRESS as Address;
const DEPLOYER_BLOCK = BigInt(process.env.DEPLOYER_BLOCK || "0");

const client = createPublicClient({
  chain: base,
  transport: http("https://mainnet.base.org"),
});

// --- Shared bootstrap fetch (run once, reused across suites) ---
const BLOCK_CHUNK = 10_000n;
let deployerLogs: any[] = [];
let bootstrapDone = false;

async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 5): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch {
      if (i === retries - 1) throw new Error("Max retries reached");
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
    }
  }
  throw new Error("unreachable");
}

async function ensureBootstrap() {
  if (bootstrapDone) return;
  const latestBlock = await fetchWithRetry(() => client.getBlockNumber());

  for (let start = DEPLOYER_BLOCK; start <= latestBlock; start += BLOCK_CHUNK) {
    const end = start + BLOCK_CHUNK - 1n > latestBlock ? latestBlock : start + BLOCK_CHUNK - 1n;
    const logs = await fetchWithRetry(() =>
      client.getContractEvents({
        address: DEPLOYER_ADDRESS,
        abi: vrdgaDeployerAbi,
        eventName: "VRDGADeployed",
        fromBlock: start,
        toBlock: end,
      })
    );
    deployerLogs.push(...logs);
  }

  bootstrapDone = true;
}

// --- Message formatting ---

describe("mintMessage", () => {
  test("contains piece id, ETH price, and tx link", () => {
    const msg = mintMessage(42n, 1_000_000_000_000_000_000n, TX_HASH);
    expect(msg).toContain("#42");
    expect(msg).toContain("1 ETH");
    expect(msg).toContain(`basescan.org/tx/${TX_HASH}`);
  });

  test("formats sub-ETH prices", () => {
    const msg = mintMessage(1n, 50_000_000_000_000_000n, TX_HASH);
    expect(msg).toContain("0.05 ETH");
  });

  test("returns valid HTML with bold tag", () => {
    const msg = mintMessage(1n, 1n, TX_HASH);
    expect(msg).toContain("<b>");
    expect(msg).toContain("</b>");
  });
});

describe("deployedMessage", () => {
  const start = BigInt(Math.floor(new Date("2026-04-01T12:00:00Z").getTime() / 1000));
  const end = BigInt(Math.floor(new Date("2026-04-08T12:00:00Z").getTime() / 1000));

  test("contains piece id, contract link, and tx link", () => {
    const msg = deployedMessage(ADDR, 7n, start, end, TX_HASH);
    expect(msg).toContain("#7");
    expect(msg).toContain(`basescan.org/address/${ADDR}`);
    expect(msg).toContain(`basescan.org/tx/${TX_HASH}`);
  });

  test("contains formatted start and end times", () => {
    const msg = deployedMessage(ADDR, 1n, start, end, TX_HASH);
    expect(msg).toContain("Apr");
    expect(msg).toContain("→");
  });
});

describe("closedMessage", () => {
  test("contains timestamp and tx link", () => {
    const closedAt = BigInt(Math.floor(Date.now() / 1000));
    const msg = closedMessage(closedAt, TX_HASH);
    expect(msg).toContain("Closed at");
    expect(msg).toContain(`basescan.org/tx/${TX_HASH}`);
  });

  test("returns valid HTML with bold tag", () => {
    const msg = closedMessage(1711900000n, TX_HASH);
    expect(msg).toContain("<b>");
    expect(msg).toContain("</b>");
  });
});

// --- Deployer bootstrap ---

describe("deployer bootstrap", () => {
  beforeAll(ensureBootstrap);

  test("fetches past VRDGADeployed events from deployer", () => {
    expect(deployerLogs.length).toBeGreaterThanOrEqual(0);

    for (const log of deployerLogs) {
      const args = log.args as {
        contractAddress: Address;
        pieceId: bigint;
        startTime: bigint;
        endTime: bigint;
      };
      expect(args.contractAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
      expect(args.pieceId).toBeGreaterThanOrEqual(0n);
      expect(args.endTime).toBeGreaterThan(args.startTime);
    }
  });
});

// --- VRGDA contract interaction ---

describe("vrgda contract", () => {
  let vrgdaAddress: Address | null = null;

  beforeAll(async () => {
    await ensureBootstrap();
    if (deployerLogs.length > 0) {
      const { contractAddress } = deployerLogs[0]!.args as { contractAddress: Address };
      vrgdaAddress = contractAddress;
    }
  });

  test("discovers a VRGDA address from deployer", () => {
    if (!vrgdaAddress) {
      console.log("Skipping — no VRGDAs deployed yet");
      return;
    }
    expect(vrgdaAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  test("can read pieceId from a deployed VRGDA", async () => {
    if (!vrgdaAddress) {
      console.log("Skipping — no VRGDA to test");
      return;
    }

    const pieceId = await client.readContract({
      address: vrgdaAddress,
      abi: pixieVrdga,
      functionName: "pieceId",
    });

    expect(pieceId).toBeGreaterThanOrEqual(0n);
  });

  test("can read totalSold from a deployed VRGDA", async () => {
    if (!vrgdaAddress) {
      console.log("Skipping — no VRGDA to test");
      return;
    }

    const totalSold = await client.readContract({
      address: vrgdaAddress,
      abi: pixieVrdga,
      functionName: "totalSold",
    });

    expect(totalSold).toBeGreaterThanOrEqual(0n);
  });

  test("can fetch past Mint events from a deployed VRGDA", async () => {
    if (!vrgdaAddress) {
      console.log("Skipping — no VRGDA to test");
      return;
    }

    const latestBlock = await client.getBlockNumber();
    const logs = await client.getContractEvents({
      address: vrgdaAddress,
      abi: pixieVrdga,
      eventName: "Mint",
      fromBlock: latestBlock - 10_000n,
      toBlock: latestBlock,
    });

    expect(logs).toBeInstanceOf(Array);
  });
});

// --- Telegram integration ---

describe("telegram", () => {
  test("sends a message to the chat", async () => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) {
      console.log("Skipping — missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
      return;
    }

    const bot = new Bot(token);
    const msg = mintMessage(99n, 420_000_000_000_000_000n, TX_HASH);
    const result = await bot.api.sendMessage(chatId, `🧪 <b>Test message</b>\n\n${msg}`, {
      parse_mode: "HTML",
    });

    expect(result.message_id).toBeGreaterThan(0);
    expect(result.chat.id).toBe(Number(chatId));
  });
});
