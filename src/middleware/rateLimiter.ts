import { createMiddleware } from "hono/factory";
import { checkLimit } from "@/algorithms/fixedWindow";

export const rateLimiter = (limit: number = 10, windowSeconds: number = 60) =>
  createMiddleware(async (c, next) => {
    const ip = c.req.header("x-forwarded-for") ?? "unknown";

    const result = await checkLimit(ip, limit, windowSeconds);

    if (!result.allowed) {
      return c.json({ error: "Rate limit exceeded" }, 429);
    }

    await next();
  });
