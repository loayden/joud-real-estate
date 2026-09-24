import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { redis } = await import("../lib/redis");

  if (!redis) {
    throw new Error("Upstash Redis is not configured with real credentials.");
  }

  const key = `healthchecks:redis:${Date.now()}`;
  await redis.set(key, "ok", { ex: 60 });
  const value = await redis.get<string>(key);
  await redis.del(key);

  if (value !== "ok") {
    throw new Error("Redis read-back check failed.");
  }

  console.log("Redis set/get/delete test succeeded.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
