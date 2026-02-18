import type { ServerWebSocket } from "bun";

export const clients = new Set<ServerWebSocket>();

export function broadcast(data: object) {
	const message = JSON.stringify(data);
	for (const client of clients) {
		client.send(message);
	}
}
