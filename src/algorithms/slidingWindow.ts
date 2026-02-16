import redis from "../lib/redis";
import type { RateLimitResult } from "@/types";

export async function checkLimit(
  id: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  const rateLimitKey = `rate-limit:${id}`;
  await redis.zremrangebyscore(rateLimitKey, 0, windowStart);

  const count = await redis.zcard(rateLimitKey);

  const allowed = count < limit;

  if (allowed) {
    await redis.zadd(
      rateLimitKey,
      Date.now(),
      `${Date.now()}-${Math.random()}`,
    );

    await redis.expire(rateLimitKey, windowSeconds);
  }

  const remaining = allowed ? Math.max(0, limit - count - 1) : 0;
  const ttl = await redis.ttl(rateLimitKey);
  const resetIn = ttl > 0 ? ttl : windowSeconds;

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
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  const rateLimitKey = `rate-limit:${id}`;
  await redis.zremrangebyscore(rateLimitKey, 0, windowStart);
  const count = await redis.zcard(rateLimitKey);
  const allowed = count < limit;
  const remaining = Math.max(0, limit - count);
  const ttl = await redis.ttl(rateLimitKey);
  const resetIn = ttl > 0 ? ttl : windowSeconds;

  return {
    allowed,
    limit,
    remaining,
    count,
    resetIn,
  };
}