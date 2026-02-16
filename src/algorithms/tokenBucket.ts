import redis from "../lib/redis";
import type { RateLimitResult } from "@/types";

export async function checkLimit(
  id: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const rateLimitKey = `rate-limit:${id}`;

  const data = await redis.hgetall(rateLimitKey);
  const tokens = data.tokens ? Number(data.tokens) : limit;
  const lastRefill = data.lastRefill ? Number(data.lastRefill) : Date.now();

  const timeElapsed = (Date.now() - lastRefill) / 1000;
  const refillRate = limit / windowSeconds;
  const tokensToAdd = timeElapsed * refillRate;
  const newTokens = Math.min(limit, tokens + tokensToAdd);

  const allowed = newTokens >= 1;
  const updatedTokens = allowed ? newTokens - 1 : newTokens;

  if (allowed) {
    await redis.hset(
      rateLimitKey,
      "tokens",
      String(updatedTokens),
      "lastRefill",
      String(Date.now()),
    );
  }

  const remaining = Math.floor(Math.max(0, updatedTokens));
  // Unlike fixed/sliding window, count represents tokens consumed, not requests made
  const count = limit - remaining;
  const resetIn = allowed ? Math.ceil((1 - (updatedTokens % 1)) / refillRate) : Math.ceil(1 / refillRate);

  return {
    allowed,
    limit,
    remaining,
    count,
    resetIn,
  };
}

export async function getStatus(
  id: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const rateLimitKey = `rate-limit:${id}`;
  const data = await redis.hgetall(rateLimitKey);
  const tokens = data.tokens ? Number(data.tokens) : limit;
  const lastRefill = data.lastRefill ? Number(data.lastRefill) : Date.now();

  const timeElapsed = (Date.now() - lastRefill) / 1000;
  const refillRate = limit / windowSeconds;
  const tokensToAdd = timeElapsed * refillRate;
  const newTokens = Math.min(limit, tokens + tokensToAdd);

  const remaining = Math.floor(Math.max(0, newTokens));
  const allowed = newTokens >= 1;
  // Unlike fixed/sliding window, count represents tokens consumed, not requests made
  const count = limit - remaining;
  const resetIn = allowed ? Math.ceil((1 - (newTokens % 1)) / refillRate) : Math.ceil(1 / refillRate);

  return {
    allowed,
    limit,
    remaining,
    count,
    resetIn,
  };
}

