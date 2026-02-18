import type { RateLimitResult } from "@/types";
import redis from "../lib/redis";

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
	const rateLimitKey = `rate-limit:${id}`;
	const count = Number(await redis.get(rateLimitKey)) || 0;
	const allowed = count <= limit;
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
