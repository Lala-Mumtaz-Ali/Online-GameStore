import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { getAccountOverview } from "@/data/account";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { ProfileForm } from "./ProfileForm";
import { ResendVerificationButton } from "./ResendVerificationButton";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && (
        <p className="mt-1 mb-4 text-sm text-muted-foreground">{description}</p>
      )}
      <div className={description ? "" : "mt-4"}>{children}</div>
    </section>
  );
}

export default async function AccountPage() {
  // (store) has no route-level guard, so this page gates itself the same way
  // /library does.
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account");
  }

  const account = await getAccountOverview();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold">Your account</h1>

      <div className="flex flex-col gap-6">
        <Section title="Account details">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Email</dt>
            <dd>{account.email ?? "—"}</dd>
            <dt className="text-muted-foreground">Role</dt>
            <dd>{account.role === "ADMIN" ? "Admin" : "Customer"}</dd>
            <dt className="text-muted-foreground">Member since</dt>
            <dd>{account.createdAt.toLocaleDateString()}</dd>
            <dt className="text-muted-foreground">Orders</dt>
            <dd>{account.orderCount}</dd>
            <dt className="text-muted-foreground">Email verified</dt>
            <dd>
              {account.emailVerified ? (
                <span className="text-green-600 dark:text-green-500">Verified</span>
              ) : (
                <span className="text-muted-foreground">Not verified</span>
              )}
            </dd>
          </dl>

          {!account.emailVerified && (
            <div className="mt-4 rounded-lg border border-dashed p-4">
              <p className="mb-3 text-sm text-muted-foreground">
                Your email address hasn&apos;t been confirmed yet. Verification is
                advisory here — you can still use the store — but confirming it keeps your
                account recoverable.
              </p>
              <ResendVerificationButton />
            </div>
          )}
        </Section>

        <Section title="Profile" description="The name shown in the store navigation.">
          {/* SessionProvider is scoped to this form rather than the root layout:
              it is a client component, and useSession() fetches
              /api/auth/session on mount. Mounting it globally would add JS and a
              request to every page of an otherwise server-rendered storefront. */}
          <SessionProvider>
            <ProfileForm name={account.name} />
          </SessionProvider>
        </Section>

        <Section
          title={account.hasPassword ? "Change password" : "Set a password"}
          description={
            account.hasPassword
              ? "You'll need your current password to set a new one."
              : "You signed in with Google. Adding a password lets you sign in with your email address as well."
          }
        >
          <ChangePasswordForm hasPassword={account.hasPassword} />
        </Section>
      </div>
    </div>
  );
}
