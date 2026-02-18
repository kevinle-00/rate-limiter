import { Hono } from "hono";
import { requestLog } from "@/requestLog";

const logsRouter = new Hono();

logsRouter.get("/", async (c) => {
  return c.json([...requestLog].reverse());
});

export default logsRouter;