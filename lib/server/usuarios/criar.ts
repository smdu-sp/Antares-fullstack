import type { Usuario } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import type { CreateUsuarioInput } from '@/lib/server/validation/usuarios.schema';
import { buscarPorLogin } from './buscar-por-login';
import { buscarPorEmail } from './buscar-por-email';
import { validaPermissaoCriador } from './valida-permissao-criador';
import { sincronizarGrupoLegado } from './sincronizar-grupo-legado';

/** Porte de UsuariosService.criar (Antares-backend/src/usuarios/usuarios.service.ts). */
export async function criar(dados: CreateUsuarioInput, usuarioLogado: Usuario) {
  const loguser = await buscarPorLogin(dados.login);
  if (loguser) throw new HttpError(403, 'Login já cadastrado.');

  const emailuser = await buscarPorEmail(dados.email);
  if (emailuser) throw new HttpError(403, 'Email já cadastrado.');

  if (!dados.unidade_id) throw new HttpError(400, 'Unidade é obrigatória.');

  const unidade = await prisma.unidade.findUnique({ where: { id: dados.unidade_id } });
  if (!unidade) throw new HttpError(400, 'Unidade não encontrada.');

  const permissao = dados.permissao
    ? validaPermissaoCriador(dados.permissao, usuarioLogado.permissao)
    : undefined;

  const usuario = await prisma.usuario.create({
    data: {
      nome: dados.nome,
      nomeSocial: dados.nomeSocial,
      login: dados.login,
      email: dados.email,
      status: dados.status,
      avatar: dados.avatar,
      unidade_id: dados.unidade_id,
      ...(permissao && { permissao }),
    },
  });

  await sincronizarGrupoLegado(usuario.id);

  return usuario;
}
