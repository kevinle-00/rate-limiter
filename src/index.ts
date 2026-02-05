import { Hono } from "hono";
import { serveStatic } from "hono/bun";

const app = new Hono();

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

// Serve static files (index.html, etc.)
app.use("/*", serveStatic({ root: "./src" }));

export default {
  port: 3000,
  fetch: app.fetch,
};