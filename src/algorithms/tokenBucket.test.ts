import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import redis from "../lib/redis";
import { checkLimit } from "./tokenBucket";

const TEST_ID = "test-token-bucket";
const TEST_KEY = `rate-limit:${TEST_ID}`;

describe("Token Bucket", () => {
	beforeEach(async () => {
		await redis.del(TEST_KEY);
	});

	afterAll(async () => {
		await redis.del(TEST_KEY);
	});

	it("should allow requests when tokens are available", async () => {
		const result = await checkLimit(TEST_ID, 5, 60);
		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(4);
	});

	it("should block requests when tokens are exhausted", async () => {
		for (let i = 0; i < 5; i++) {
			await checkLimit(TEST_ID, 5, 60);
		}
		const result = await checkLimit(TEST_ID, 5, 60);
		expect(result.allowed).toBe(false);
		expect(result.remaining).toBe(0);
	});

	it("should refill tokens over time", async () => {
		// Exhaust all tokens
		for (let i = 0; i < 3; i++) {
			await checkLimit(TEST_ID, 3, 1);
		}

		const blocked = await checkLimit(TEST_ID, 3, 1);
		expect(blocked.allowed).toBe(false);
		expect(blocked.remaining).toBe(0);

		// Wait for tokens to refill
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const allowed = await checkLimit(TEST_ID, 3, 1);
		expect(allowed.allowed).toBe(true);
		expect(allowed.remaining).toBe(2);
	});
});
