import { Hono } from "hono";
import { getLogEntries } from "@/requestLog";

const logsRouter = new Hono();

logsRouter.get("/", async (c) => {
	const logs = await getLogEntries();
	return c.json(logs);
});

export default logsRouter;
