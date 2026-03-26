import redis from "./lib/redis";
import type { RequestLogEntry } from "./types";

const REDIS_KEY = "request-log";
const MAX_ENTRIES = 100;

export async function pushLogEntry(entry: RequestLogEntry): Promise<void> {
	await redis.lpush(REDIS_KEY, JSON.stringify(entry));
	await redis.ltrim(REDIS_KEY, 0, MAX_ENTRIES - 1);
}

export async function getLogEntries(): Promise<RequestLogEntry[]> {
	const entries = await redis.lrange(REDIS_KEY, 0, -1);
	return entries.map((e) => JSON.parse(e));
}
