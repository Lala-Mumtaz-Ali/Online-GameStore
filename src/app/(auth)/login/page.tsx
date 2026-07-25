import { env } from "@/utils/env";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

  // Read here and passed down as a prop rather than calling useSearchParams()
  // inside LoginForm, which would opt this route into client-side rendering
  // unless wrapped in <Suspense>.
  const { callbackUrl } = await searchParams;
  const raw = Array.isArray(callbackUrl) ? callbackUrl[0] : callbackUrl;

  return <LoginForm googleEnabled={googleEnabled} callbackUrl={raw} />;
}
