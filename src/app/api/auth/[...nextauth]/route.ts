import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const user = await prisma.user.findFirst({
          where: {
            email: {
              equals: credentials.email,
              mode: "insensitive",
            },
          },
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        // Detect if the password stored in DB is a bcrypt hash.
        // Bcrypt hashes usually start with $2a$, $2b$, or $2y$.
        const isHashed =
          user.password.startsWith("$2a$") ||
          user.password.startsWith("$2b$") ||
          user.password.startsWith("$2y$");

        let isValid = false;

        if (isHashed) {
          isValid = await bcrypt.compare(credentials.password, user.password);
        } else {
          // Verify plaintext password
          isValid = user.password === credentials.password;

          if (isValid) {
            // Securely hash the password and update it in the database immediately
            const hashedPassword = await bcrypt.hash(credentials.password, 10);
            await prisma.user.update({
              where: { id: user.id },
              data: { password: hashedPassword },
            });
          }
        }

        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        // Return the user object (this matches next-auth User interface)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (matches the current cookie duration)
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "some-super-secret-fallback-for-development-bidwest",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
