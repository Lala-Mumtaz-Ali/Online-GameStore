import "server-only";
import type { Prisma, Role } from "@prisma/client";
import prisma from "@/db";
import { requireAdmin } from "@/data/admin";
import { getSkip } from "@/lib/pagination";

/**
 * Admin user management.
 *
 * Lives here rather than in src/data/admin.ts, which is the requireAdmin
 * primitive rather than a domain module - every other domain (games, orders,
 * preorders) owns its own file.
 */

export async function getPaginatedUsers({
  page = 1,
  pageSize = 20,
  q,
  role,
}: {
  page?: number;
  pageSize?: number;
  q?: string;
  role?: Role;
} = {}) {
  await requireAdmin();

  const where: Prisma.UserWhereInput = {
    ...(role ? { role } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      // { id: "asc" } tiebreaker: createdAt is not unique, so without it OFFSET
      // paging can repeat or skip rows.
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      // Explicit select, never a bare findMany. A User record carries the
      // bcrypt hash, and anything derived from it that reached a client
      // component would serialise that hash into the page payload.
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
      skip: getSkip(page, pageSize),
      take: pageSize,
    }),
    // Same `where` as the query above, or the count and the rows disagree.
    prisma.user.count({ where }),
  ]);

  return { users, totalCount };
}

export async function setUserRole(userId: string, role: Role) {
  const session = await requireAdmin();

  // A separate rule from the invariant below, not a duplicate of it: even with
  // other admins present, demoting yourself is almost always a mistake.
  if (userId === session.user.id) {
    throw new Error("You can't change your own role.");
  }

  await prisma.$transaction(
    async (tx) => {
      if (role === "USER") {
        // Count admins OTHER THAN the target. Counting all admins and testing
        // for <= 1 would be unreachable dead code behind the self-check above,
        // since the only admin you can be the last of is yourself.
        const otherAdmins = await tx.user.count({
          where: { role: "ADMIN", id: { not: userId } },
        });

        if (otherAdmins === 0) {
          throw new Error("There must be at least one admin.");
        }
      }

      await tx.user.update({ where: { id: userId }, data: { role } });
    },
    // count-then-update is a TOCTOU race. Serializable stops two concurrent
    // demotions from both observing "one other admin remains" and locking
    // everyone out of the admin area.
    { isolationLevel: "Serializable" }
  );
}
