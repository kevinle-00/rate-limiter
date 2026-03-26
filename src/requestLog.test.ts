import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import redis from "./lib/redis";
import { getLogEntries, pushLogEntry } from "./requestLog";
import type { RequestLogEntry } from "./types";

const REDIS_KEY = "request-log";

const makeEntry = (ip: string): RequestLogEntry => ({
	ip,
	path: "/api/proxy/test",
	method: "GET",
	timestamp: Date.now(),
	result: { allowed: true, limit: 10, remaining: 9, count: 1, resetIn: 60 },
});

describe("Request Log", () => {
	beforeEach(async () => {
		await redis.del(REDIS_KEY);
	});

	afterAll(async () => {
		await redis.del(REDIS_KEY);
	});

	it("should return empty array when no entries exist", async () => {
		const entries = await getLogEntries();
		expect(entries).toEqual([]);
	});

	it("should push and retrieve entries newest-first", async () => {
		await pushLogEntry(makeEntry("1.0.0.1"));
		await pushLogEntry(makeEntry("1.0.0.2"));

		const entries = await getLogEntries();
		expect(entries).toHaveLength(2);
		expect(entries[0].ip).toBe("1.0.0.2");
		expect(entries[1].ip).toBe("1.0.0.1");
	});

	it("should cap at 100 entries", async () => {
		for (let i = 0; i < 105; i++) {
			await pushLogEntry(makeEntry(`10.0.0.${i}`));
		}

		const entries = await getLogEntries();
		expect(entries).toHaveLength(100);
	});
});
