import type { Usuario } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import type { UpdateUsuarioInput } from '@/lib/server/validation/usuarios.schema';
import { buscarPorLogin } from './buscar-por-login';
import { validaDevCriador } from './valida-dev-criador';
import { sincronizarGrupoLegado } from './sincronizar-grupo-legado';

/** Porte de UsuariosService.atualizar (Antares-backend/src/usuarios/usuarios.service.ts). */
export async function atualizar(usuarioLogado: Usuario, id: string, dados: UpdateUsuarioInput) {
  if (dados.login) {
    const usuarioComMesmoLogin = await buscarPorLogin(dados.login);
    if (usuarioComMesmoLogin && usuarioComMesmoLogin.id !== id) {
      throw new HttpError(403, 'Login já cadastrado.');
    }
  }

  const usuarioAntes = await prisma.usuario.findUnique({ where: { id } });
  if (!usuarioAntes) throw new HttpError(404, 'Usuário não encontrado.');

  if (dados.unidade_id) {
    const unidade = await prisma.unidade.findUnique({ where: { id: dados.unidade_id } });
    if (!unidade) throw new HttpError(400, 'Unidade não encontrada.');
  }

  const dev = dados.dev !== undefined ? validaDevCriador(dados.dev, usuarioLogado.dev) : usuarioAntes.dev;

  const usuarioAtualizado = await prisma.usuario.update({
    where: { id },
    data: {
      nome: dados.nome,
      nomeSocial: dados.nomeSocial,
      login: dados.login,
      email: dados.email,
      status: dados.status,
      avatar: dados.avatar,
      unidade_id: dados.unidade_id,
      dev,
    },
  });

  await sincronizarGrupoLegado(id);

  return usuarioAtualizado;
}
