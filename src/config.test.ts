import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import redis from "./lib/redis";
import { getConfig, setConfig } from "./config";

const REDIS_KEY = "config";

describe("Config", () => {
	beforeEach(async () => {
		await redis.del(REDIS_KEY);
	});

	afterAll(async () => {
		await redis.del(REDIS_KEY);
	});

	it("should return defaults when Redis is empty", async () => {
		const config = await getConfig();
		expect(config.algorithm).toBe("fixedWindow");
		expect(config.limit).toBe(10);
		expect(config.windowSeconds).toBe(60);
		expect(config.upstreamURL).toBe("https://jsonplaceholder.typicode.com");
	});

	it("should round-trip setConfig and getConfig", async () => {
		await setConfig({
			algorithm: "tokenBucket",
			limit: 50,
			windowSeconds: 120,
			upstreamURL: "https://example.com",
		});

		const config = await getConfig();
		expect(config.algorithm).toBe("tokenBucket");
		expect(config.limit).toBe(50);
		expect(config.windowSeconds).toBe(120);
		expect(config.upstreamURL).toBe("https://example.com");
	});
});
