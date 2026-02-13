import { Hono } from "hono";
import { RequestLog } from "@/RequestLog";

const logsRouter = new Hono();

logsRouter.get("/", async (c) => {
  return c.json(RequestLog);
});

export default logsRouter;
