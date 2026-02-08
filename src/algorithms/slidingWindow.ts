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

  return {
    allowed,
    limit,
    remaining,
  };
}
