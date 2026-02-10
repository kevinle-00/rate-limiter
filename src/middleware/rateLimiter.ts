import { createMiddleware } from "hono/factory";
import { config } from "@/config";
import * as fixedWindow from "@/algorithms/fixedWindow";
import * as slidingWindow from "@/algorithms/slidingWindow";
import * as tokenBucket from "@/algorithms/tokenBucket";

const algorithms = { fixedWindow, slidingWindow, tokenBucket };

export const rateLimiter = () =>
  createMiddleware(async (c, next) => {
    const ip = c.req.header("x-forwarded-for") ?? "unknown";
    const algo = algorithms[config.algorithm];
    const limit = config.limit;
    const windowSeconds = config.windowSeconds;

    const result = await algo.checkLimit(ip, limit, windowSeconds);

    if (!result.allowed) {
      return c.json({ error: "Rate limit exceeded" }, 429);
    }

    await next();
  });
