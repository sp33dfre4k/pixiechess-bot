# Pixie Chess Bot ♟️✨

Telegram bot that watches the Pixie Chess VRGDA deployer contract on Base and sends notifications for auction events.

- Watches the deployer for new `VRDGADeployed` events (new auction started)
- Automatically watches each deployed VRGDA contract for `Mint` and `Closed` events
- On startup, bootstraps by fetching all past deployer events to catch existing auctions

## Requirements

- [Bun](https://bun.sh) 
- [Docker](https://docs.docker.com/get-docker/)
- A Telegram bot token (from [@BotFather](https://t.me/BotFather))
- A Base RPC endpoint (e.g. Alchemy, Infura, or the public `https://mainnet.base.org`)

## Setup

```bash
bun install
cp .env.example .env
# fill in your .env values
```

## Run

```bash
bun bot.ts
```

## Test

```bash
bun test
```

## Deploy

```bash
docker compose up
```

## Environment variables

| Variable | Description |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather |
| `TELEGRAM_CHAT_ID` | Target chat ID (negative for groups) |
| `RPC_URL` | Base RPC endpoint (used for live event polling) |
| `DEPLOYER_ADDRESS` | VRGDA deployer contract address |
| `DEPLOYER_BLOCK` | Block the deployer was deployed at (avoids scanning from genesis) |
