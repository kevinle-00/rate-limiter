import type { RateLimitResult } from "@/types";
import redis from "../lib/redis";

const checkLimitScript = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local windowSeconds = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local tokens = limit
local lastRefill = now

local data = redis.call('HGETALL', key)
if #data > 0 then
  for i = 1, #data, 2 do
    if data[i] == 'tokens' then tokens = tonumber(data[i+1]) end
    if data[i] == 'lastRefill' then lastRefill = tonumber(data[i+1]) end
  end
end

local elapsed = (now - lastRefill) / 1000
local refillRate = limit / windowSeconds
local newTokens = math.min(limit, tokens + elapsed * refillRate)

local allowed = 0
if newTokens >= 1 then
  allowed = 1
  newTokens = newTokens - 1
end

redis.call('HSET', key, 'tokens', tostring(newTokens), 'lastRefill', tostring(now))
redis.call('EXPIRE', key, windowSeconds)

return {allowed, tostring(newTokens)}
`;

export async function checkLimit(
	id: string,
	limit: number,
	windowSeconds: number,
): Promise<RateLimitResult> {
	const rateLimitKey = `rate-limit:${id}`;
	const now = Date.now();

	const [allowed, tokensStr] = (await redis.eval(
		checkLimitScript,
		1,
		rateLimitKey,
		limit,
		windowSeconds,
		now,
	)) as [number, string];

	const isAllowed = allowed === 1;
	const updatedTokens = Number(tokensStr);
	const remaining = Math.floor(Math.max(0, updatedTokens));
	const count = limit - remaining;
	const refillRate = limit / windowSeconds;
	const resetIn = isAllowed
		? Math.ceil((1 - (updatedTokens % 1)) / refillRate)
		: Math.ceil(1 / refillRate);

	return { allowed: isAllowed, limit, remaining, count, resetIn };
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
	const count = limit - remaining;
	const resetIn = allowed
		? Math.ceil((1 - (newTokens % 1)) / refillRate)
		: Math.ceil(1 / refillRate);

	return { allowed, limit, remaining, count, resetIn };
}
