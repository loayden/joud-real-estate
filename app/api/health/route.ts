import { NextResponse } from "next/server";

import { isEmailDeliveryConfigured } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ServiceStatus = "ok" | "error" | "skipped";

async function checkDatabase(): Promise<ServiceStatus> {
  await prisma.$queryRaw`SELECT 1`;
  return "ok";
}

async function checkRedis(): Promise<ServiceStatus> {
  if (!redis) {
    return "skipped";
  }

  await redis.ping();
  return "ok";
}

export async function GET() {
  const checks = await Promise.allSettled([checkDatabase(), checkRedis()]);
  const db = checks[0].status === "fulfilled" ? checks[0].value : "error";
  const redisStatus =
    checks[1].status === "fulfilled" ? checks[1].value : "error";
  const isHealthy = db === "ok" && redisStatus !== "error";

  return NextResponse.json(
    {
      status: isHealthy ? "ok" : "error",
      db,
      redis: redisStatus,
      email: isEmailDeliveryConfigured() ? "ok" : "skipped",
    },
    {
      status: isHealthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
