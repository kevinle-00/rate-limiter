import type { RateLimitResult } from "@/types";
import redis from "../lib/redis";

const checkLimitScript = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local windowSeconds = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local member = ARGV[4]
local windowStart = now - windowSeconds * 1000

redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)
local count = redis.call('ZCARD', key)

local allowed = 0
if count < limit then
  redis.call('ZADD', key, now, member)
  redis.call('EXPIRE', key, windowSeconds)
  allowed = 1
  count = count + 1
end

local ttl = redis.call('TTL', key)
return {allowed, count, ttl}
`;

export async function checkLimit(
	id: string,
	limit: number,
	windowSeconds: number,
): Promise<RateLimitResult> {
	const now = Date.now();
	const rateLimitKey = `rate-limit:${id}`;
	const member = `${now}-${Math.random()}`;

	const [allowed, count, ttl] = (await redis.eval(
		checkLimitScript,
		1,
		rateLimitKey,
		limit,
		windowSeconds,
		now,
		member,
	)) as [number, number, number];

	const isAllowed = allowed === 1;
	const remaining = Math.max(0, limit - count);
	const resetIn = ttl > 0 ? ttl : windowSeconds;

	return { allowed: isAllowed, limit, remaining, count, resetIn };
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

	return { allowed, limit, remaining, count, resetIn };
}
