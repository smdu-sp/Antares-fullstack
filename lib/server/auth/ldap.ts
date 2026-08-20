import { Client as LdapClient } from 'ldapts';

function limparAspas(valor?: string): string | undefined {
  return valor?.replace(/"/g, '');
}

/**
 * Porte do trecho LDAP de AuthService.validateUser (Antares-backend/src/auth/auth.service.ts):
 * bind do próprio usuário (login + senha informados no formulário de login).
 */
export async function bindLdapUsuario(login: string, senha: string): Promise<void> {
  const ldapServer = limparAspas(process.env.LDAP_SERVER);
  const ldapDomain = limparAspas(process.env.LDAP_DOMAIN);
  const ldapUser = `${login}${ldapDomain}`;

  const client = new LdapClient({ url: ldapServer as string });

  try {
    await client.bind(ldapUser, senha);
    await client.unbind();
  } catch (error) {
    await client.unbind().catch(() => {});
    throw error;
  }
}

/**
 * Porte do bind de serviço usado em UsuariosService.buscarNovo/buscarPorNome
 * (Antares-backend/src/usuarios/usuarios.service.ts) — credenciais de conta de
 * serviço (USER_LDAP/PASS_LDAP), usadas para buscar outros usuários no AD.
 */
export async function criarClienteLdapServico(): Promise<LdapClient> {
  const client = new LdapClient({ url: process.env.LDAP_SERVER as string });
  await client.bind(`${process.env.USER_LDAP}${process.env.LDAP_DOMAIN}`, process.env.PASS_LDAP as string);
  return client;
}
