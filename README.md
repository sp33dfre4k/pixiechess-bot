# Pixie Chess Bot ♟️✨

Telegram and Discord bot that watches the Pixie Chess VRGDA deployer contract on Base and sends notifications for auction events.

## Requirements

- [Bun](https://bun.sh) 
- [Docker](https://docs.docker.com/get-docker/)
- A Telegram bot token (from [@BotFather](https://t.me/BotFather))
- A Discord bot token
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
