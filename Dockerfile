FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production --ignore-scripts

COPY *.ts ./

CMD ["bun", "bot.ts"]
