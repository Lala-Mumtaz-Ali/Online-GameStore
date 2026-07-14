import "server-only";
import { env } from "@/utils/env";

export function isAuthorizedCronRequest(request: Request) {
  if (!env.CRON_SECRET) return false;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${env.CRON_SECRET}`;
}
