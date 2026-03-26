import type { ServerWebSocket } from "bun";
import redis, { subscriber } from "./redis";

const CHANNEL = "request-events";

export const clients = new Set<ServerWebSocket>();

function broadcast(data: string) {
	for (const client of clients) {
		client.send(data);
	}
}

export function publish(data: object) {
	redis.publish(CHANNEL, JSON.stringify(data));
}

export function subscribeToRequestEvents() {
	subscriber.subscribe(CHANNEL);
	subscriber.on("message", (_channel, message) => {
		broadcast(message);
	});
}
