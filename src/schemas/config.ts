import { z } from "zod";

export const configSchema = z.object({
	algorithm: z.enum(["fixedWindow", "slidingWindow", "tokenBucket"]),
	limit: z.number().min(1),
	windowSeconds: z.number().min(1),
	upstreamURL: z.url(),
});

export type Config = z.infer<typeof configSchema>;
