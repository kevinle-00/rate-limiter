import redis from "../lib/redis";

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
}

export async function checkLimit(
  id: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const rateLimitKey = `rate-limit:${id}`;

  const count = await redis.incr(rateLimitKey);

  if (count === 1) {
    await redis.expire(rateLimitKey, windowSeconds);
  }

  const allowed = count <= limit;
  const remaining = Math.max(0, limit - count);

  return {
    allowed,
    limit,
    remaining,
  };
}
