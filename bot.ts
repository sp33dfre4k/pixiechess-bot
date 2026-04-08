import { createPublicClient, http, type Address, type Hash } from "viem";
import { base } from "viem/chains";
import { Bot } from "grammy";
import { Client, GatewayIntentBits, TextChannel } from "discord.js";
import { pixieVrdga } from "./pixieVrgda";
import { vrdgaDeployerAbi } from "./vrdgaDeployer";
import { mintMessage, deployedMessage, closedMessage } from "./messages";

// --- Logging ---
function log(level: "info" | "warn" | "error", event: string, data?: Record<string, unknown>) {
  const entry = { ts: new Date().toISOString(), level, event, ...data };
  console[level === "error" ? "error" : "log"](JSON.stringify(entry));
}

// --- Config ---
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;
const RPC_URL = process.env.RPC_URL || "https://mainnet.base.org";
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;
const DISCORD_CHANNEL_ID = "1483585685888962625";
const DEPLOYER_ADDRESS = process.env.DEPLOYER_ADDRESS as Address;
const DEPLOYER_BLOCK = BigInt(process.env.DEPLOYER_BLOCK || "0");

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID || !DEPLOYER_ADDRESS || !DISCORD_BOT_TOKEN) {
  log("error", "missing_env", { hint: "See .env.example" });
  process.exit(1);
}

// --- Telegram ---
const tgBot = new Bot(TELEGRAM_BOT_TOKEN);

async function sendTg(text: string) {
  try {
    await tgBot.api.sendMessage(TELEGRAM_CHAT_ID, text, { parse_mode: "HTML" });
    log("info", "telegram_sent");
  } catch (err) {
    log("error", "telegram_failed", { error: String(err) });
  }
}

// --- Discord ---
const discord = new Client({ intents: [GatewayIntentBits.Guilds] });
let discordChannel: TextChannel | null = null;

discord.once("ready", async () => {
  const channel = await discord.channels.fetch(DISCORD_CHANNEL_ID);
  if (channel?.isTextBased()) {
    discordChannel = channel as TextChannel;
    log("info", "discord_ready", { channel: DISCORD_CHANNEL_ID });
  } else {
    log("error", "discord_channel_not_found", { channel: DISCORD_CHANNEL_ID });
  }
});

discord.login(DISCORD_BOT_TOKEN);

async function sendDiscord(text: string) {
  if (!discordChannel) return;
  try {
    await discordChannel.send(text);
    log("info", "discord_sent");
  } catch (err) {
    log("error", "discord_failed", { error: String(err) });
  }
}

// --- Broadcast to all channels ---
async function broadcast(tgText: string, discordText: string) {
  await Promise.all([sendTg(tgText), sendDiscord(discordText)]);
}

// --- Viem client ---
const client = createPublicClient({
  chain: base,
  transport: http(RPC_URL),
});

// --- State ---
const unwatchers: Array<() => void> = [];
const watchedVrgdas = new Set<Address>();

// --- Watch a single VRGDA contract for Mint + Closed ---
function watchVrgda(address: Address) {
  if (watchedVrgdas.has(address)) return;
  watchedVrgdas.add(address);

  log("info", "watching_vrgda", { address });

  const unwatchMint = client.watchContractEvent({
    address,
    abi: pixieVrdga,
    eventName: "Mint",
    onLogs: (logs) => {
      for (const log_ of logs) {
        const { pieceId, price } = log_.args as { pieceId: bigint; price: bigint };
        const txHash = log_.transactionHash as Hash;
        log("info", "mint", { pieceId: String(pieceId), price: String(price), txHash });
        broadcast(mintMessage(pieceId, price, txHash, "html"), mintMessage(pieceId, price, txHash, "markdown"));
      }
    },
    onError: (err) => log("error", "mint_watcher_error", { address, error: err.message }),
  });

  const unwatchClosed = client.watchContractEvent({
    address,
    abi: pixieVrdga,
    eventName: "Closed",
    onLogs: (logs) => {
      for (const log_ of logs) {
        const { closedAt } = log_.args as { closedAt: bigint };
        const txHash = log_.transactionHash as Hash;
        log("info", "closed", { closedAt: String(closedAt), txHash });
        broadcast(closedMessage(closedAt, txHash, "html"), closedMessage(closedAt, txHash, "markdown"));
      }
    },
    onError: (err) => log("error", "closed_watcher_error", { address, error: err.message }),
  });

  unwatchers.push(unwatchMint, unwatchClosed);
}

// --- Bootstrap: fetch past VRDGADeployed logs and watch those contracts ---
async function bootstrapExistingVrgdas() {
  log("info", "bootstrap_start");

  const logs = await client.getContractEvents({
    address: DEPLOYER_ADDRESS,
    abi: vrdgaDeployerAbi,
    eventName: "VRDGADeployed",
    fromBlock: DEPLOYER_BLOCK,
  });

  for (const l of logs) {
    const { contractAddress } = l.args as { contractAddress: Address };
    watchVrgda(contractAddress);
  }

  log("info", "bootstrap_complete", { count: watchedVrgdas.size });
}

// --- Watch deployer for new auctions ---
function watchDeployer() {
  log("info", "watching_deployer", { address: DEPLOYER_ADDRESS });

  const unwatch = client.watchContractEvent({
    address: DEPLOYER_ADDRESS,
    abi: vrdgaDeployerAbi,
    eventName: "VRDGADeployed",
    onLogs: (logs) => {
      for (const l of logs) {
        const { contractAddress, pieceId, startTime, endTime } = l.args as {
          contractAddress: Address;
          pieceId: bigint;
          startTime: bigint;
          endTime: bigint;
        };
        const txHash = l.transactionHash as Hash;
        log("info", "vrgda_deployed", {
          contractAddress,
          pieceId: String(pieceId),
          txHash,
        });
        broadcast(
          deployedMessage(contractAddress, pieceId, startTime, endTime, txHash, "html"),
          deployedMessage(contractAddress, pieceId, startTime, endTime, txHash, "markdown"),
        );
        watchVrgda(contractAddress);
      }
    },
    onError: (err) => log("error", "deployer_watcher_error", { error: err.message }),
  });

  unwatchers.push(unwatch);
}

// --- Graceful shutdown ---
function shutdown() {
  log("info", "shutting_down");
  for (const unwatch of unwatchers) {
    unwatch();
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// --- Start ---
async function main() {
  log("info", "starting");

  await bootstrapExistingVrgdas();
  watchDeployer();

  log("info", "running", { vrgdas: watchedVrgdas.size });
}

main().catch((err) => {
  log("error", "fatal", { error: String(err) });
  process.exit(1);
});
