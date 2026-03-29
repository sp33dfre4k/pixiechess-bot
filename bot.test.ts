import { test, expect, describe } from "bun:test";
import { Bot } from "grammy";
import { mintMessage, deployedMessage, closedMessage } from "./messages";
import type { Hash } from "viem";

const TX_HASH = "0xabc123def456789000000000000000000000000000000000000000000000dead" as Hash;
const ADDR = "0x5ff1658A7dc6F15398CD9d5A34dC0685082599a5";

// --- mintMessage ---

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

// --- deployedMessage ---

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

// --- closedMessage ---

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
