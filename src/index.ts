import { serve } from "bun";
import { Hono } from "hono";
import { rateLimiter } from "@/middleware/rateLimiter";
import configRouter from "@/routes/config";
import proxyRouter from "@/routes/proxy";
import logsRouter from "@/routes/logs";
import index from "./index.html";
import { clients } from "@/lib/ws";

const app = new Hono();

app.use("/api/proxy/*", rateLimiter());
app.route("/api/config", configRouter);
app.route("/api/logs", logsRouter);
app.route("/api/proxy", proxyRouter);

const server = serve({
  port: Number(process.env.PORT) || 3000,
  hostname: "0.0.0.0",
  routes: {
    "/api/*": app.fetch,
    "/*": index,
  },
  fetch(req, server) {
    if (new URL(req.url).pathname === "/ws") {
      server.upgrade(req);
      return;
    }
  },
  websocket: {
    open(ws) {
      clients.add(ws);
    },
    message() {},
    close(ws) {
      clients.delete(ws);
    },
  },
  development: true,
});

console.log(`Server running at ${server.url}`);
