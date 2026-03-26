import type { Config } from "@/schemas/config";
import redis from "@/lib/redis";

const REDIS_KEY = "config";

const defaults: Config = {
	algorithm: "fixedWindow",
	limit: 10,
	windowSeconds: 60,
	upstreamURL: "https://jsonplaceholder.typicode.com",
};

export async function getConfig(): Promise<Config> {
	const data = await redis.hgetall(REDIS_KEY);

	if (!data || Object.keys(data).length === 0) {
		return defaults;
	}

	return {
		algorithm: data.algorithm as Config["algorithm"],
		limit: Number(data.limit),
		windowSeconds: Number(data.windowSeconds),
		upstreamURL: data.upstreamURL,
	};
}

export async function setConfig(config: Config): Promise<Config> {
	await redis.hset(REDIS_KEY, {
		algorithm: config.algorithm,
		limit: String(config.limit),
		windowSeconds: String(config.windowSeconds),
		upstreamURL: config.upstreamURL,
	});

	return config;
}
