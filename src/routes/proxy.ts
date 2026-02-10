import { Hono } from "hono";
import { config } from "@/config";

const proxyRouter = new Hono();

proxyRouter.all("/*", async (c) => {
  const upstream = config.upstreamURL;
  const path = c.req.path.replace("/api/proxy", "");
  const url = `${upstream}${path}`;
  const headers = new Headers(c.req.raw.headers);
  headers.delete("host");

  const res = await fetch(url, {
    method: c.req.method,
    headers: headers,
    body:
      c.req.method === "GET" || c.req.method === "HEAD" ? null : c.req.raw.body,
  });

  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
});

export default proxyRouter;
