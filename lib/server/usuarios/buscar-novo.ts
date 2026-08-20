import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { criarClienteLdapServico } from '@/lib/server/auth/ldap';
import { buscarPorLogin } from './buscar-por-login';

/** Porte de UsuariosService.buscarNovo (Antares-backend/src/usuarios/usuarios.service.ts). */
export async function buscarNovo(login: string) {
  const usuarioExiste = await buscarPorLogin(login);
  if (usuarioExiste && usuarioExiste.status === true) {
    throw new HttpError(403, 'Login já cadastrado.');
  }
  if (usuarioExiste && usuarioExiste.status !== true) {
    return prisma.usuario.update({ where: { id: usuarioExiste.id }, data: { status: true } });
  }

  let client;
  try {
    client = await criarClienteLdapServico();
  } catch {
    throw new HttpError(500, 'Não foi possível conectar ao servidor LDAP.');
  }

  let nome: string;
  let email: string;
  try {
    const escapedLogin = login.replace(/[()*\\]/g, '\\$&');

    const resultado = await client.search(process.env.LDAP_BASE as string, {
      filter: `(samaccountname=${escapedLogin})`,
      scope: 'sub',
      attributes: ['name', 'mail'],
    });

    if (!resultado.searchEntries || resultado.searchEntries.length === 0) {
      throw new HttpError(404, 'Usuário não encontrado no LDAP.');
    }

    const entry = resultado.searchEntries[0];
    const { name, mail } = entry;

    if (!name) {
      throw new HttpError(500, 'Nome do usuário não encontrado no LDAP.');
    }

    email = mail ? mail.toString().toLowerCase() : `${login}@rede.sp`;
    nome = name.toString();

    await client.unbind();
  } catch (error) {
    await client.unbind().catch(() => {});
    if (error instanceof HttpError) throw error;
    throw new HttpError(500, 'Erro ao buscar usuário no LDAP.');
  }

  if (!nome || !email) throw new HttpError(404, 'Usuário não encontrado.');

  return { login, nome, email };
}
