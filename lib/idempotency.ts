import { prisma } from "@/lib/prisma";

export const IDEMPOTENCY_HEADER = "idempotency-key";
export const IDEMPOTENCY_TTL_HOURS = 24;
const KEY_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

export type StoredIdempotentResponse = {
  statusCode: number;
  body: unknown;
};

export function parseIdempotencyKey(req: Request): string | null {
  const raw = req.headers.get(IDEMPOTENCY_HEADER)?.trim();
  if (!raw || !KEY_PATTERN.test(raw)) return null;
  return raw;
}

async function purgeExpired(userId: string) {
  try {
    await prisma.idempotencyKey.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } },
    });
  } catch {
    // best-effort cleanup; never fail the request
  }
}

export async function checkIdempotency(
  userId: string,
  key: string,
): Promise<StoredIdempotentResponse | null> {
  const row = await prisma.idempotencyKey.findUnique({
    where: { userId_key: { userId, key } },
    select: { statusCode: true, response: true, expiresAt: true },
  });

  if (!row) {
    void purgeExpired(userId);
    return null;
  }

  if (row.expiresAt < new Date()) {
    await prisma.idempotencyKey
      .delete({ where: { userId_key: { userId, key } } })
      .catch(() => null);
    return null;
  }

  return { statusCode: row.statusCode, body: row.response };
}

export async function storeIdempotency(
  userId: string,
  key: string,
  statusCode: number,
  body: unknown,
  ttlHours = IDEMPOTENCY_TTL_HOURS,
): Promise<StoredIdempotentResponse | null> {
  // Returns the winner's response when a concurrent request already stored
  // the same key (unique-violation race), so replays converge.
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  try {
    await prisma.idempotencyKey.create({
      data: { userId, key, statusCode, response: body as object, expiresAt },
    });
    return null;
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return checkIdempotency(userId, key);
    }
    throw error;
  }
}
