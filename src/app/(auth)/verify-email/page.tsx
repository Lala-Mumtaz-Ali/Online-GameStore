import Link from "next/link";
import { verifyEmailToken } from "@/data/auth";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="rounded-xl border p-6 text-center">
        <h1 className="mb-2 text-2xl font-bold">Missing verification token</h1>
        <p className="text-muted-foreground">
          This link is missing its verification token. Please use the link from your email.
        </p>
      </div>
    );
  }

  const result = await verifyEmailToken(token);

  return (
    <div className="rounded-xl border p-6 text-center">
      {result.success ? (
        <>
          <h1 className="mb-2 text-2xl font-bold">Email verified</h1>
          <p className="mb-4 text-muted-foreground">
            Your email address has been confirmed.
          </p>
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </>
      ) : (
        <>
          <h1 className="mb-2 text-2xl font-bold">Verification failed</h1>
          <p className="text-muted-foreground">{result.error}</p>
        </>
      )}
    </div>
  );
}
