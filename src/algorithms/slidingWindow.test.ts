import { describe, it, expect, beforeEach, afterAll } from "bun:test";
import { checkLimit } from "./slidingWindow";
import redis from "../lib/redis";

const TEST_ID = "test-sliding-window";
const TEST_KEY = `rate-limit:${TEST_ID}`;

describe("Sliding Window", () => {
  beforeEach(async () => {
    await redis.del(TEST_KEY);
  });

  afterAll(async () => {
    await redis.del(TEST_KEY);
    redis.disconnect();
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

  it("should allow requests after window expires", async () => {
    for (let i = 0; i < 3; i++) {
      await checkLimit(TEST_ID, 3, 1);
    }

    const blocked = await checkLimit(TEST_ID, 3, 1);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const allowed = await checkLimit(TEST_ID, 3, 1);
    expect(allowed.allowed).toBe(true);
    expect(allowed.remaining).toBe(2);
  });
});
