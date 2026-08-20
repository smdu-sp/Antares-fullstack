/** @format */

// Instância do NextAuth exclusiva para middleware.ts (Edge Runtime).
// Usa a config leve (auth.config.ts, sem Prisma/LDAP) — não importar lib/auth/auth.ts
// aqui, pois ela usa a config completa em Node.js.

import NextAuth from 'next-auth';
import authConfig from './auth.config';

export const { auth } = NextAuth({
  session: { strategy: 'jwt' },
  ...authConfig,
});
