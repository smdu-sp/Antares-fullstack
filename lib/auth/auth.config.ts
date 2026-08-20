/** @format */

// Config leve (Edge-safe) do NextAuth — usada exclusivamente por middleware.ts,
// que roda no Edge Runtime (sem Node.js: sem Prisma, sem LDAP, sem jsonwebtoken).
// Não faz nenhuma chamada de rede: `grupoAtivo` já chega pronto no cookie de sessão,
// escrito pelo callback jwt() do lado Node (lib/auth/auth.node.config.ts) — que roda
// com Prisma em toda requisição não-middleware e persiste o valor no próprio token.
// O Credentials provider abaixo existe só porque o NextAuth exige a lista de
// providers na config; login de verdade sempre passa pela config completa (Node,
// lib/auth/auth.node.config.ts), nunca por esta instância.

import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { jwtDecode } from "jwt-decode";

export default {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        login: { label: "Login", type: "text" },
        senha: { label: "Senha", type: "password" },
      },
      type: "credentials",
      async authorize() {
        // Nunca invocado de verdade: o sign-in real acontece via a rota
        // app/api/auth/[...nextauth], que usa auth.node.config.ts.
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        if (session.usuario) {
          const tokenUser = token.user as {
            usuario?: {
              avatar?: string;
              permissao?: string;
              nomeSocial?: string;
            };
            grupoAtivo?: unknown;
          };

          if (tokenUser.usuario) {
            tokenUser.usuario.avatar = session.usuario.avatar;
            tokenUser.usuario.permissao = session.usuario.permissao;
            tokenUser.usuario.nomeSocial = session.usuario.nomeSocial;
          }
          tokenUser.grupoAtivo = session.grupoAtivo;
          return token;
        }
      }
      if (user) token.user = user;
      return token;
    },
    async session({ session, token }) {
      // `grupoAtivo` já vem pronto de token.user (escrito pelo jwt() do lado Node) —
      // nenhuma chamada de rede necessária aqui. Renovação de access_token expirado
      // também é responsabilidade só do lado Node (roda em toda leitura de página/
      // Server Action, local via Prisma); o middleware não precisa de um token de
      // API válido, só dos campos decodificados abaixo para decisões de autorização.
      session = token.user as typeof session;

      if (session.access_token && !session.usuario) {
        session.usuario = jwtDecode(session.access_token);
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
} satisfies NextAuthConfig;
