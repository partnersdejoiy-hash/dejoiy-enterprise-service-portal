import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var redisGlobal: Redis | undefined;
}

function createRedisClient() {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn("REDIS_URL is not configured");
    return null;
  }

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  client.on("connect", () => {
    if (process.env.NODE_ENV === "development") {
      console.log("[REDIS] connected");
    }
  });

  client.on("error", (error) => {
    console.error("[REDIS] error:", error);
  });

  return client;
}

export const redis =
  global.redisGlobal ?? createRedisClient() ?? undefined;

if (process.env.NODE_ENV !== "production" && redis) {
  global.redisGlobal = redis;
}

/**
 * Optional helper for safe lazy connection.
 */
export async function ensureRedisConnection() {
  if (!redis) return null;

  if (redis.status !== "ready" && redis.status !== "connect") {
    await redis.connect();
  }

  return redis;
}