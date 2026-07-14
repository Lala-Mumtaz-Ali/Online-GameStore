import "server-only";
import { auth } from "@/auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to do that.");
  }
  return session.user;
}
