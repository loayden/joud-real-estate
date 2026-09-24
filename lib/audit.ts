import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type AuditJson = Prisma.InputJsonValue | null | undefined;

export type AuditInput = {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  oldValues?: AuditJson;
  newValues?: AuditJson;
  ipAddress?: string | null;
  metadata?: AuditJson;
};

function normalizeJson(value: AuditJson) {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function logAudit({
  actorId,
  action,
  entity,
  entityId,
  oldValues,
  newValues,
  ipAddress,
  metadata,
}: AuditInput) {
  return prisma.auditLog.create({
    data: {
      actorId: actorId ?? undefined,
      action,
      entity,
      entityId: entityId ?? undefined,
      oldValues: normalizeJson(oldValues),
      newValues: normalizeJson(newValues),
      ipAddress: ipAddress ?? undefined,
      metadata: normalizeJson(metadata),
    },
  });
}
