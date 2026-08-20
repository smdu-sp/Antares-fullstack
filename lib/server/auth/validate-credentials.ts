import { prisma } from '@/lib/prisma';
import { bindLdapUsuario } from './ldap';

export class CredenciaisInvalidasError extends Error {}

/** Porte de AuthService.validateUser (Antares-backend/src/auth/auth.service.ts). */
export async function validateCredentials(login: string, senha: string) {
  const usuario = await prisma.usuario.findUnique({ where: { login } });

  if (!usuario) {
    throw new CredenciaisInvalidasError(
      'Usuário não encontrado no sistema. Entre em contato com o administrador.',
    );
  }

  if (usuario.status === false) {
    throw new CredenciaisInvalidasError('Usuário desativado.');
  }

  const environment = process.env.ENVIRONMENT?.replace(/"/g, '').toLowerCase();
  if (environment === 'local') {
    return usuario;
  }

  try {
    await bindLdapUsuario(login, senha);
  } catch {
    throw new CredenciaisInvalidasError('Credenciais LDAP incorretas.');
  }

  return usuario;
}
