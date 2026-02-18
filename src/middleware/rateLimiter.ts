import { getConnInfo } from "hono/bun";
import { createMiddleware } from "hono/factory";
import * as fixedWindow from "@/algorithms/fixedWindow";
import * as slidingWindow from "@/algorithms/slidingWindow";
import * as tokenBucket from "@/algorithms/tokenBucket";
import { config } from "@/config";
import { broadcast } from "@/lib/ws";
import { requestLog } from "@/requestLog";
import type { RequestLogEntry } from "@/types";

const algorithms = { fixedWindow, slidingWindow, tokenBucket };

export const rateLimiter = () =>
	createMiddleware(async (c, next) => {
		const ip =
			c.req.header("x-forwarded-for") ??
			getConnInfo(c).remote.address ??
			"unknown";
		const algo = algorithms[config.algorithm];
		const limit = config.limit;
		const windowSeconds = config.windowSeconds;

		const result = await algo.checkLimit(ip, limit, windowSeconds);
		const logEntry: RequestLogEntry = {
			ip,
			path: c.req.path,
			method: c.req.method,
			timestamp: Date.now(),
			result,
		};

		requestLog.push(logEntry);
		broadcast(logEntry);
		if (requestLog.length > 100) {
			requestLog.shift();
		}

		if (!result.allowed) {
			return c.json({ error: "Rate limit exceeded" }, 429);
		}

		await next();

		c.header("X-RateLimit-Limit", String(limit));
		c.header("X-RateLimit-Remaining", String(result.remaining));
		c.header(
			"X-RateLimit-Reset",
			String(Math.ceil(Date.now() / 1000) + result.resetIn),
		);
	});
