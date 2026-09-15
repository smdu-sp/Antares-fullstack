import { prisma } from '@/lib/prisma';
import { bindLdapUsuario } from './ldap';
import { verificarSenhaLocal } from './local-user-password';

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

  // Usuário local único, fora do LDAP: login e hash de senha vêm do .env
  // (USUARIO_LOCAL_LOGIN / USUARIO_LOCAL_SENHA_HASH — ver scripts/gerar-hash-senha-local.mjs).
  // Serve pra ter uma conta de acesso em produção quando só existem usuários
  // LDAP no AD. O registro em `usuarios` continua normal — precisa existir
  // antes (criado pela tela de usuários, como qualquer outro) — e grupo/
  // permissões dele são geridos 100% pelo sistema (UsuarioGrupo, GrupoPermissoes,
  // UsuarioPermissoes), sem nenhuma diferença em relação a um usuário LDAP:
  // só a validação da senha no login muda.
  const loginLocal = process.env.USUARIO_LOCAL_LOGIN;
  const hashSenhaLocal = process.env.USUARIO_LOCAL_SENHA_HASH;
  if (loginLocal && hashSenhaLocal && login === loginLocal) {
    if (!verificarSenhaLocal(senha, hashSenhaLocal)) {
      throw new CredenciaisInvalidasError('Credenciais incorretas.');
    }
    return usuario;
  }

  try {
    await bindLdapUsuario(login, senha);
  } catch {
    throw new CredenciaisInvalidasError('Credenciais LDAP incorretas.');
  }

  return usuario;
}
