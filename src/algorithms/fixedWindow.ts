import type { RateLimitResult } from "@/types";
import redis from "../lib/redis";

const checkLimitScript = `
local key = KEYS[1]
local windowSeconds = tonumber(ARGV[1])

local count = redis.call('INCR', key)
if count == 1 then
  redis.call('EXPIRE', key, windowSeconds)
end

local ttl = redis.call('TTL', key)
return {count, ttl}
`;

export async function checkLimit(
	id: string,
	limit: number,
	windowSeconds: number,
): Promise<RateLimitResult> {
	const rateLimitKey = `rate-limit:${id}`;

	const [count, ttl] = (await redis.eval(
		checkLimitScript,
		1,
		rateLimitKey,
		windowSeconds,
	)) as [number, number];

	const allowed = count <= limit;
	const remaining = Math.max(0, limit - count);
	const resetIn = ttl > 0 ? ttl : windowSeconds;

	return { allowed, limit, remaining, count, resetIn };
}

export async function getStatus(
	id: string,
	limit: number,
	windowSeconds: number,
): Promise<RateLimitResult> {
	const rateLimitKey = `rate-limit:${id}`;
	const count = Number(await redis.get(rateLimitKey)) || 0;
	const allowed = count <= limit;
	const remaining = Math.max(0, limit - count);
	const ttl = await redis.ttl(rateLimitKey);
	const resetIn = ttl > 0 ? ttl : windowSeconds;

	return { allowed, limit, remaining, count, resetIn };
}
