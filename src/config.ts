import type { Config } from "@/schemas/config";

export const config: Config = {
  algorithm: "fixedWindow",
  limit: 10,
  windowSeconds: 60,
};
