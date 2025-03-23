// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Primero buscar en la tabla User principal
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            adminBarberia: true
          }
        });

        // Si no se encuentra en User, buscar en Admin
        if (!user) {
          const admin = await prisma.admin.findUnique({
            where: { email: credentials.email }
          });

          if (!admin) return null;

          const passwordMatch = await compare(
            credentials.password,
            admin.password
          );

          if (!passwordMatch) return null;

          return {
            id: admin.id.toString(),
            email: admin.email,
            name: admin.nombre || "Admin",
            role: admin.rol || "ADMIN",
          };
        }

        // Verificar contraseña del usuario
        const passwordMatch = await compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) return null;

        // Construir objeto de usuario con datos adicionales según su rol
        const userData: any = {
          id: user.id.toString(),
          email: user.email,
          name: `${user.nombre} ${user.apellido}`,
          role: user.rol
        };

        // Si es admin de barbería, agregar el ID de la barbería
        if (user.rol === 'ADMIN_BARBERIA' && user.adminBarberia) {
          userData.barberiaId = user.adminBarberia.barberiaId;
        }

        return userData;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        if (user.barberiaId) {
          token.barberiaId = user.barberiaId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      if (token.barberiaId) {
        session.user.barberiaId = token.barberiaId as number;
      }
      return session;
    },
  },
};