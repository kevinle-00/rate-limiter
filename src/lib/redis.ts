import Redis from "ioredis";

const redis = process.env.REDIS_URL
	? new Redis(process.env.REDIS_URL)
	: new Redis({ host: "127.0.0.1", port: 6379 });

redis.on("connect", () => console.log("Connected to Redis"));
redis.on("error", (err) => console.error("Redis error:", err));

export default redis;
