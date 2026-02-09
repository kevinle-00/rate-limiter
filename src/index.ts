import { serve } from "bun";
import { Hono } from "hono";
import { rateLimiter } from "@/middleware/rateLimiter";
import configRouter from "@/routes/config";
import index from "./index.html";

const app = new Hono();

app.use("/*", rateLimiter());
app.route("/api/config", configRouter);

// API routes
app.get("/api/hello", (c) => {
  return c.json({ message: "Hello, world!", method: "GET" });
});

app.put("/api/hello", (c) => {
  return c.json({ message: "Hello, world!", method: "PUT" });
});

app.get("/api/hello/:name", (c) => {
  const name = c.req.param("name");
  return c.json({ message: `Hello, ${name}!` });
});

const server = serve({
  port: 3000,
  routes: {
    "/api/*": app.fetch,
    "/*": index,
  },
  development: true,
});

console.log(`Server running at ${server.url}`);

