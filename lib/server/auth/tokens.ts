import jwt from 'jsonwebtoken';
import type { Usuario } from '@prisma/client';

export interface UsuarioTokenPair {
  access_token: string;
  refresh_token: string;
}

/** Porte de AuthService.getTokens (Antares-backend/src/auth/auth.service.ts). */
export function getTokens(usuario: Usuario): UsuarioTokenPair {
  const payload = {
    sub: usuario.id,
    login: usuario.login,
    nome: usuario.nome,
    nomeSocial: usuario.nomeSocial ?? undefined,
    email: usuario.email,
    status: usuario.status,
    avatar: usuario.avatar ?? undefined,
    permissao: usuario.permissao,
  };

  const access_token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '15m' });
  const refresh_token = jwt.sign(payload, process.env.RT_SECRET as string, { expiresIn: '7d' });

  return { access_token, refresh_token };
}
