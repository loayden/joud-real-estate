import type { UserRole } from "@prisma/client";

import { HttpError } from "@/lib/api-response";
import { logAudit } from "@/lib/audit";
import {
  serializeAdminUserListItem,
  snapshotUserForAudit,
} from "@/lib/admin-users";
import { prisma } from "@/lib/prisma";

const userWithListPayload = {
  profile: {
    select: {
      firstName: true,
      lastName: true,
      avatarUrl: true,
      preferredLocale: true,
    },
  },
  _count: {
    select: {
      properties: true,
      sentInquiries: true,
      sessions: true,
    },
  },
} as const;

export async function loadUserForAdminAction(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: userWithListPayload,
  });
}

function assertCanMutateUser({
  actorId,
  actorRole,
  target,
  action,
}: {
  actorId: string;
  actorRole: UserRole;
  target: { id: string; role: UserRole };
  action: "ban" | "unban" | "role";
}) {
  if (actorId === target.id) {
    throw new HttpError(
      "You cannot modify your own admin account",
      400,
      "SELF_ACTION_DENIED",
    );
  }

  if (target.role === "SUPER_ADMIN") {
    throw new HttpError(
      "Super admin accounts cannot be modified from this screen",
      403,
      "SUPER_ADMIN_PROTECTED",
    );
  }

  if (
    action !== "role" &&
    target.role === "ADMIN" &&
    actorRole !== "SUPER_ADMIN"
  ) {
    throw new HttpError(
      "Only a super admin can modify another admin account",
      403,
      "ADMIN_PROTECTED",
    );
  }
}

export async function banUser({
  targetUserId,
  actorId,
  actorRole,
  reason,
  ipAddress,
}: {
  targetUserId: string;
  actorId: string;
  actorRole: UserRole;
  reason?: string | null;
  ipAddress?: string | null;
}) {
  const existing = await loadUserForAdminAction(targetUserId);

  if (!existing) {
    throw new HttpError("User not found", 404, "NOT_FOUND");
  }

  assertCanMutateUser({
    actorId,
    actorRole,
    target: existing,
    action: "ban",
  });

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: targetUserId },
      data: { status: "BANNED", lockedUntil: null },
      include: userWithListPayload,
    });

    await tx.userSession.deleteMany({ where: { userId: targetUserId } });

    return user;
  });

  await logAudit({
    actorId,
    action: "BAN_USER",
    entity: "User",
    entityId: targetUserId,
    oldValues: snapshotUserForAudit(existing),
    newValues: snapshotUserForAudit(updated),
    metadata: { reason: reason ?? null },
    ipAddress,
  });

  return serializeAdminUserListItem(updated);
}

export async function unbanUser({
  targetUserId,
  actorId,
  actorRole,
  ipAddress,
}: {
  targetUserId: string;
  actorId: string;
  actorRole: UserRole;
  ipAddress?: string | null;
}) {
  const existing = await loadUserForAdminAction(targetUserId);

  if (!existing) {
    throw new HttpError("User not found", 404, "NOT_FOUND");
  }

  assertCanMutateUser({
    actorId,
    actorRole,
    target: existing,
    action: "unban",
  });

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { status: "ACTIVE", failedLoginCount: 0, lockedUntil: null },
    include: userWithListPayload,
  });

  await logAudit({
    actorId,
    action: "UNBAN_USER",
    entity: "User",
    entityId: targetUserId,
    oldValues: snapshotUserForAudit(existing),
    newValues: snapshotUserForAudit(updated),
    ipAddress,
  });

  return serializeAdminUserListItem(updated);
}

export async function changeUserRole({
  targetUserId,
  actorId,
  role,
  ipAddress,
}: {
  targetUserId: string;
  actorId: string;
  role: Exclude<UserRole, "SUPER_ADMIN">;
  ipAddress?: string | null;
}) {
  const existing = await loadUserForAdminAction(targetUserId);

  if (!existing) {
    throw new HttpError("User not found", 404, "NOT_FOUND");
  }

  assertCanMutateUser({
    actorId,
    actorRole: "SUPER_ADMIN",
    target: existing,
    action: "role",
  });

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: targetUserId },
      data: { role },
      include: userWithListPayload,
    });

    await tx.userSession.deleteMany({ where: { userId: targetUserId } });

    return user;
  });

  await logAudit({
    actorId,
    action: "CHANGE_USER_ROLE",
    entity: "UserRole",
    entityId: targetUserId,
    oldValues: snapshotUserForAudit(existing),
    newValues: snapshotUserForAudit(updated),
    metadata: { role },
    ipAddress,
  });

  return serializeAdminUserListItem(updated);
}
