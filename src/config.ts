import redis from "@/lib/redis";
import type { Config } from "@/schemas/config";

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
		algorithm: (data.algorithm as Config["algorithm"]) ?? defaults.algorithm,
		limit: Number(data.limit) || defaults.limit,
		windowSeconds: Number(data.windowSeconds) || defaults.windowSeconds,
		upstreamURL: data.upstreamURL ?? defaults.upstreamURL,
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
