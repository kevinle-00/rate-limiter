import Redis from "ioredis";

function createRedis() {
	return process.env.REDIS_URL
		? new Redis(process.env.REDIS_URL)
		: new Redis({ host: "127.0.0.1", port: 6379 });
}

const redis = createRedis();
redis.on("connect", () => console.log("Connected to Redis"));
redis.on("error", (err) => console.error("Redis error:", err));

export const subscriber = createRedis();
subscriber.on("error", (err) => console.error("Redis subscriber error:", err));

export default redis;
