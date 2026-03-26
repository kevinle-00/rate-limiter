import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import * as fixedWindow from "@/algorithms/fixedWindow";
import * as slidingWindow from "@/algorithms/slidingWindow";
import * as tokenBucket from "@/algorithms/tokenBucket";
import { getConfig, setConfig } from "@/config";
import { configSchema } from "@/schemas/config";

const algorithms = { fixedWindow, slidingWindow, tokenBucket };
const configRouter = new Hono();

configRouter.get("/", async (c) => {
	const config = await getConfig();
	return c.json(config);
});

configRouter.put("/", zValidator("json", configSchema), async (c) => {
	const body = c.req.valid("json");
	const config = await setConfig(body);
	return c.json(config);
});

configRouter.get("/status/:ip", async (c) => {
	const ip = c.req.param("ip");
	const config = await getConfig();
	const algo = algorithms[config.algorithm];
	const status = await algo.getStatus(ip, config.limit, config.windowSeconds);

	return c.json(status);
});

export default configRouter;
