import { createMiddleware } from "hono/factory";
import { config } from "@/config";
import { getConnInfo } from "hono/bun";
import * as fixedWindow from "@/algorithms/fixedWindow";
import * as slidingWindow from "@/algorithms/slidingWindow";
import * as tokenBucket from "@/algorithms/tokenBucket";
import { RequestLog } from "@/RequestLog";
import type { RequestLogEntry } from "@/types";
import { broadcast } from "@/ws";

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

    RequestLog.push(logEntry);
    broadcast(logEntry);
    if (RequestLog.length > 100) {
      RequestLog.shift();
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

