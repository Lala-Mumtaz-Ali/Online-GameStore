import { env } from "@/utils/env";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

  return <LoginForm googleEnabled={googleEnabled} />;
}
