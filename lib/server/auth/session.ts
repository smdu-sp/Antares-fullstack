import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { AuthError } from './errors';

export interface UsuarioAutenticado {
  id: string;
  login: string;
}

interface UsuarioJwtPayload {
  sub: string;
  [key: string]: unknown;
}

/**
 * Porte de JwtAuthGuard + JwtStrategy.validate (Antares-backend/src/auth).
 *
 * IMPORTANTE: enquanto o módulo `auth` (Fase 2 do plano de migração) não é
 * portado, a camada de serviços (services/*) continua enviando o JWT legado
 * emitido pelo backend NestJS no header Authorization — não a sessão do
 * NextAuth via cookie (que não é enviada em chamadas same-origin feitas pelo
 * próprio servidor). Este helper valida esse token exatamente como o
 * JwtStrategy original (jsonwebtoken + JWT_SECRET) até a Fase 2, quando o
 * modelo muda para a sessão do NextAuth ser a única fonte de verdade.
 */
export async function requireAuth(request: Request): Promise<UsuarioAutenticado> {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) throw new AuthError(401);

  let payload: UsuarioJwtPayload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET as string) as UsuarioJwtPayload;
  } catch {
    throw new AuthError(401);
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: payload.sub },
    select: { id: true, login: true },
  });

  if (!usuario) throw new AuthError(401, 'Usuário não encontrado.');

  await prisma.usuario.update({ where: { id: usuario.id }, data: { ultimoLogin: new Date() } });

  return usuario;
}
