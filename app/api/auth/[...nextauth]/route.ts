import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "database" as const },
  debug: true,
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async session({ session, user }: any) {
      if (session?.user && user?.id) session.user.id = user.id;
      return session;
    },
    async redirect({ url, baseUrl }: any) {
      // Después de login, llevame al dashboard
      if (url === baseUrl || url === `${baseUrl}/`) return `${baseUrl}/app`;
      return url.startsWith(baseUrl) ? url : `${baseUrl}/app`;
    },
  },
};

const handler = NextAuth(authOptions as any);

export { handler as GET, handler as POST };