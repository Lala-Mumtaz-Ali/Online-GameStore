import Link from "next/link";
import { getPasswordResetContext } from "@/data/auth";
import { ResetPasswordForm } from "./ResetPasswordForm";

function InvalidLink({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border p-6 text-center">
      <h1 className="mb-2 text-2xl font-bold">{title}</h1>
      <p className="mb-4 text-muted-foreground">{body}</p>
      <Link href="/forgot-password" className="underline">
        Request a new link
      </Link>
    </div>
  );
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <InvalidLink
        title="Missing reset token"
        body="This link is missing its reset token. Please use the link from your email."
      />
    );
  }

  const context = await getPasswordResetContext(token);

  if (!context) {
    return (
      <InvalidLink
        title="Link expired"
        body="This reset link is invalid, has already been used, or has expired."
      />
    );
  }

  return <ResetPasswordForm token={token} hasPassword={context.hasPassword} />;
}
