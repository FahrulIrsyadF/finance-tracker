import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Password",
      credentials: {
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.password) return null;
        
        // Single user simple auth against env password
        const appPassword = process.env.APP_USER_PASSWORD;
        if (!appPassword) {
          console.error("APP_USER_PASSWORD is not set in environment variables");
          return null;
        }

        if (credentials.password === appPassword) {
          return { id: "1", name: "Owner" };
        }
        
        return null;
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
