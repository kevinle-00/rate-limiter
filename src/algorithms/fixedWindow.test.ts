import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import redis from "../lib/redis";
import { checkLimit } from "./fixedWindow";

const TEST_ID = "test-fixed-window";
const TEST_KEY = `rate-limit:${TEST_ID}`;

describe("Fixed Window", () => {
	beforeEach(async () => {
		await redis.del(TEST_KEY);
	});

	afterAll(async () => {
		await redis.del(TEST_KEY);
	});

	it("should allow requests under the limit", async () => {
		const result = await checkLimit(TEST_ID, 5, 60);
		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(4);
	});

	it("should block requests over the limit", async () => {
		for (let i = 0; i < 5; i++) {
			await checkLimit(TEST_ID, 5, 60);
		}
		const result = await checkLimit(TEST_ID, 5, 60);
		expect(result.allowed).toBe(false);
		expect(result.remaining).toBe(0);
	});

	it("should decrement remaining with each request", async () => {
		const r1 = await checkLimit(TEST_ID, 5, 60);
		const r2 = await checkLimit(TEST_ID, 5, 60);
		const r3 = await checkLimit(TEST_ID, 5, 60);

		expect(r1.remaining).toBe(4);
		expect(r2.remaining).toBe(3);
		expect(r3.remaining).toBe(2);
	});
});
