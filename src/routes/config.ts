import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import * as fixedWindow from "@/algorithms/fixedWindow";
import * as slidingWindow from "@/algorithms/slidingWindow";
import * as tokenBucket from "@/algorithms/tokenBucket";
import { config } from "@/config";
import { configSchema } from "@/schemas/config";

const algorithms = { fixedWindow, slidingWindow, tokenBucket };
const configRouter = new Hono();

configRouter.get("/", (c) => {
	return c.json(config);
});

configRouter.put("/", zValidator("json", configSchema), (c) => {
	const body = c.req.valid("json");

	config.algorithm = body.algorithm;
	config.limit = body.limit;
	config.windowSeconds = body.windowSeconds;
	config.upstreamURL = body.upstreamURL;

	return c.json(config);
});

configRouter.get("/status/:ip", async (c) => {
	const ip = c.req.param("ip");
	const algo = algorithms[config.algorithm];
	const status = await algo.getStatus(ip, config.limit, config.windowSeconds);

	return c.json(status);
});

export default configRouter;
