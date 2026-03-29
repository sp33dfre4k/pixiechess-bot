import { formatEther, type Hash } from "viem";

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

const basescanTx = (hash: Hash) => `https://basescan.org/tx/${hash}`;
const basescanAddr = (addr: string) => `https://basescan.org/address/${addr}`;

export function mintMessage(pieceId: bigint, price: bigint, txHash: Hash): string {
  const eth = formatEther(price);
  const lines = [
    `♟️ <b>New mint!</b> Piece #${pieceId} just got scooped for ${eth} ETH`,
    `♞ <b>Piece #${pieceId} minted!</b> Someone paid ${eth} ETH — bold move`,
    `♜ <b>Mint alert!</b> ${eth} ETH for Piece #${pieceId} — the board grows`,
    `♛ <b>Check!</b> Piece #${pieceId} minted for ${eth} ETH — who's next?`,
  ];
  return `${pick(lines)}\n\n<a href="${basescanTx(txHash)}">View tx</a>`;
}

export function deployedMessage(
  contractAddress: string,
  pieceId: bigint,
  startTime: bigint,
  endTime: bigint,
  txHash: Hash
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
    `🏁 <b>New auction deployed!</b> Piece #${pieceId} is up for grabs`,
    `⚔️ <b>Fresh auction!</b> Piece #${pieceId} just entered the arena`,
    `🎯 <b>Auction live!</b> Piece #${pieceId} — let the bidding begin`,
  ];
  return `${pick(lines)}\n\n📅 ${start} → ${end}\n\n<a href="${basescanAddr(contractAddress)}">View contract</a> · <a href="${basescanTx(txHash)}">View tx</a>`;
}

export function closedMessage(closedAt: bigint, txHash: Hash): string {
  const time = new Date(Number(closedAt) * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  const lines = [
    `🔒 <b>Auction closed!</b> The board is set.`,
    `🏆 <b>Checkmate!</b> Auction sealed shut.`,
    `👑 <b>Game over!</b> This auction has concluded.`,
  ];
  return `${pick(lines)}\n\n🕐 Closed at ${time}\n\n<a href="${basescanTx(txHash)}">View tx</a>`;
}
