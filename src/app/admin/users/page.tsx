import { Suspense } from "react";
import { auth } from "@/auth";
import { getPaginatedUsers } from "@/data/users";
import { Pagination } from "@/components/ui/Pagination";
import { getTotalPages, parsePageParam } from "@/lib/pagination";
import { UserFilters } from "./UserFilters";
import { UserRoleForm } from "./UserRoleForm";

const PAGE_SIZE = 20;

/** Narrow the free-text role param to the enum before it reaches Prisma. */
function parseRole(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "ADMIN" || raw === "USER" ? raw : undefined;
}

function parseQuery(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = (raw ?? "").trim();
  return trimmed.length > 0 ? trimmed.slice(0, 100) : undefined;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = parsePageParam(sp.page);
  const q = parseQuery(sp.q);
  const role = parseRole(sp.role);

  // Needed so the current admin's own row can have its button disabled.
  // setUserRole enforces this server-side regardless.
  const [session, { users, totalCount }] = await Promise.all([
    auth(),
    getPaginatedUsers({ page, pageSize: PAGE_SIZE, q, role }),
  ]);

  const totalPages = getTotalPages(totalCount, PAGE_SIZE);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">Users</h2>
        <p className="text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? "user" : "users"}
        </p>
      </div>

      <Suspense fallback={<div className="mb-6 h-16" />}>
        <UserFilters q={q} role={role} hasFilters={Boolean(q || role)} />
      </Suspense>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium">Verified</th>
              <th className="p-3 font-medium">Orders</th>
              <th className="p-3 font-medium">Joined</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  No users match these filters.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isSelf = user.id === session?.user?.id;
                const label = user.name ?? user.email ?? "This user";

                return (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="p-3">
                      {user.name ?? <span className="text-muted-foreground">—</span>}
                      {isSelf && (
                        <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">{user.email ?? "—"}</td>
                    <td className="p-3">
                      <span
                        className={
                          user.role === "ADMIN"
                            ? "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium"
                            : "text-xs text-muted-foreground"
                        }
                      >
                        {user.role === "ADMIN" ? "Admin" : "Customer"}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {user.emailVerified ? "Yes" : "No"}
                    </td>
                    <td className="p-3">{user._count.orders}</td>
                    <td className="p-3 text-muted-foreground">
                      {user.createdAt.toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end">
                        <UserRoleForm
                          userId={user.id}
                          currentRole={user.role}
                          userLabel={label}
                          isSelf={isSelf}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Role changes take effect within a few minutes, or immediately on the user&apos;s
        next sign-in. Sessions are JWTs, so the role is re-read periodically rather than
        on every request.
      </p>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/users"
        searchParams={sp}
      />
    </div>
  );
}
