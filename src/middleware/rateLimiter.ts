import { createMiddleware } from "hono/factory";
import { config } from "@/config";
import { getConnInfo } from "hono/bun";
import * as fixedWindow from "@/algorithms/fixedWindow";
import * as slidingWindow from "@/algorithms/slidingWindow";
import * as tokenBucket from "@/algorithms/tokenBucket";
import { RequestLog } from "@/RequestLog";
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
    RequestLog.push(logEntry);

    if (!result.allowed) {
      return c.json({ error: "Rate limit exceeded" }, 429);
    }

    await next();
  });
