FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build the frontend
FROM base AS build
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# Production image
FROM base
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json bun.lock bunfig.toml tsconfig.json ./
COPY src ./src
COPY styles ./styles

ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "src/index.ts"]
