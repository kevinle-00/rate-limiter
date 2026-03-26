import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { rateLimiter } from "@/middleware/rateLimiter";
import redis from "@/lib/redis";
import configRouter from "./config";
import proxyRouter from "./proxy";

const app = new Hono();
app.use("/api/proxy/*", rateLimiter());
app.route("/api/config", configRouter);
app.route("/api/proxy", proxyRouter);

const CONFIG_KEY = "config";

describe("Config API", () => {
	beforeEach(async () => {
		await redis.del(CONFIG_KEY);
	});

	afterAll(async () => {
		await redis.del(CONFIG_KEY);
	});

	it("GET /api/config returns defaults when Redis is empty", async () => {
		const res = await app.request("/api/config");
		const body = await res.json();
		expect(res.status).toBe(200);
		expect(body.algorithm).toBe("fixedWindow");
		expect(body.limit).toBe(10);
	});

	it("PUT /api/config persists and GET returns updated values", async () => {
		const put = await app.request("/api/config", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				algorithm: "tokenBucket",
				limit: 50,
				windowSeconds: 120,
				upstreamURL: "https://example.com",
			}),
		});
		expect(put.status).toBe(200);

		const get = await app.request("/api/config");
		const body = await get.json();
		expect(body.algorithm).toBe("tokenBucket");
		expect(body.limit).toBe(50);
		expect(body.windowSeconds).toBe(120);
		expect(body.upstreamURL).toBe("https://example.com");
	});

	it("rate limiter enforces the configured limit", async () => {
		await app.request("/api/config", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				algorithm: "fixedWindow",
				limit: 2,
				windowSeconds: 60,
				upstreamURL: "https://jsonplaceholder.typicode.com",
			}),
		});

		// Clear any existing rate limit keys for this IP
		await redis.del("rate-limit:10.0.0.1");

		const headers = { "X-Forwarded-For": "10.0.0.1" };
		const r1 = await app.request("/api/proxy/todos/1", { headers });
		const r2 = await app.request("/api/proxy/todos/1", { headers });
		const r3 = await app.request("/api/proxy/todos/1", { headers });

		expect(r1.status).not.toBe(429);
		expect(r2.status).not.toBe(429);
		expect(r3.status).toBe(429);

		await redis.del("rate-limit:10.0.0.1");
	});
});
