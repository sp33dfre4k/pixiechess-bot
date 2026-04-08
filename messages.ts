import { formatEther, type Hash } from "viem";

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

const basescanTx = (hash: Hash) => `https://basescan.org/tx/${hash}`;
const basescanAddr = (addr: string) => `https://basescan.org/address/${addr}`;

type Format = "html" | "markdown";

function bold(text: string, fmt: Format) {
  return fmt === "html" ? `<b>${text}</b>` : `**${text}**`;
}

function link(text: string, url: string, fmt: Format) {
  return fmt === "html" ? `<a href="${url}">${text}</a>` : `[${text}](${url})`;
}

export function mintMessage(pieceId: bigint, price: bigint, txHash: Hash, fmt: Format = "html"): string {
  const eth = formatEther(price);
  const lines = [
    `♟️ ${bold("New mint!", fmt)} Piece #${pieceId} just got scooped for ${eth} ETH`,
    `♞ ${bold(`Piece #${pieceId} minted!`, fmt)} Someone paid ${eth} ETH — bold move`,
    `♜ ${bold("Mint alert!", fmt)} ${eth} ETH for Piece #${pieceId} — the board grows`,
    `♛ ${bold("Check!", fmt)} Piece #${pieceId} minted for ${eth} ETH — who's next?`,
  ];
  return `${pick(lines)}\n\n${link("View tx", basescanTx(txHash), fmt)}`;
}

export function deployedMessage(
  contractAddress: string,
  pieceId: bigint,
  startTime: bigint,
  endTime: bigint,
  txHash: Hash,
  fmt: Format = "html"
): string {
  const start = new Date(Number(startTime) * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  const end = new Date(Number(endTime) * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const lines = [
    `🏁 ${bold("New auction deployed!", fmt)} Piece #${pieceId} is up for grabs`,
    `⚔️ ${bold("Fresh auction!", fmt)} Piece #${pieceId} just entered the arena`,
    `🎯 ${bold("Auction live!", fmt)} Piece #${pieceId} — let the bidding begin`,
  ];
  return `${pick(lines)}\n\n📅 ${start} → ${end}\n\n${link("View contract", basescanAddr(contractAddress), fmt)} · ${link("View tx", basescanTx(txHash), fmt)}`;
}

export function closedMessage(closedAt: bigint, txHash: Hash, fmt: Format = "html"): string {
  const time = new Date(Number(closedAt) * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  const lines = [
    `🔒 ${bold("Auction closed!", fmt)} The board is set.`,
    `🏆 ${bold("Checkmate!", fmt)} Auction sealed shut.`,
    `👑 ${bold("Game over!", fmt)} This auction has concluded.`,
  ];
  return `${pick(lines)}\n\n🕐 Closed at ${time}\n\n${link("View tx", basescanTx(txHash), fmt)}`;
}
