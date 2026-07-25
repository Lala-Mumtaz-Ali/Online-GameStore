import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers";
import bcrypt from "bcryptjs";
import prisma from "@/db";
import { env } from "@/utils/env";

/** How stale a token's cached role may get before it is re-read. */
const ROLE_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const providers: Provider[] = [
  Credentials({
    credentials: {
      email: {},
      password: {},
    },
    authorize: async (credentials) => {
      const email = credentials?.email;
      const password = credentials?.password;

      if (typeof email !== "string" || typeof password !== "string") {
        return null;
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.password) {
        return null;
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      };
    },
  }),
];

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: "jwt" },
  providers,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.roleCheckedAt = Date.now();
      }

      // Client-initiated refresh via useSession().update({ name }).
      // Without this a profile rename would not appear in the server-rendered
      // navbar until the user signed out and back in.
      //
      // The narrowing is verbose because NextAuth types this argument loosely,
      // and it is untrusted client input: only the name is copied across.
      if (
        trigger === "update" &&
        typeof session === "object" &&
        session !== null &&
        "name" in session &&
        typeof (session as { name?: unknown }).name === "string"
      ) {
        token.name = (session as { name: string }).name;
      }

      // Without this, `role` would only ever be read at sign-in: an admin
      // promoting someone would leave them a USER in their own token for up to
      // 30 days. Re-reading it at most every 5 minutes also drops the session
      // of a user who has since been deleted.
      //
      // Safe to touch Prisma here because there is no middleware, so auth()
      // only runs in Server Components and route handlers - never on the edge
      // runtime. Cost is one primary-key lookup per user per 5 minutes.
      if (
        token.id &&
        Date.now() - (token.roleCheckedAt ?? 0) > ROLE_REFRESH_INTERVAL_MS
      ) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true },
        });

        if (!fresh) return null;

        token.role = fresh.role;
        token.roleCheckedAt = Date.now();
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
});
