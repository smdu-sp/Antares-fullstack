import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import type { AtualizarPermissoesDevInput } from '@/lib/server/validation/usuarios.schema';
import { sincronizarGrupoLegado } from './sincronizar-grupo-legado';

/** Porte de UsuariosService.atualizarPermissoesDev (Antares-backend/src/usuarios/usuarios.service.ts). */
export async function atualizarPermissoesDev(id: string, dados: AtualizarPermissoesDevInput) {
  const atual = await prisma.usuario.findUnique({ where: { id }, select: { id: true } });
  if (!atual) throw new HttpError(404, 'Usuário não encontrado.');

  const atualizado = await prisma.usuario.update({
    where: { id },
    data: {
      ...(dados.dev !== undefined ? { dev: dados.dev } : {}),
      ...(dados.status !== undefined ? { status: dados.status } : {}),
    },
    include: { unidade: { select: { id: true, nome: true, sigla: true } } },
  });

  await sincronizarGrupoLegado(id);

  return atualizado;
}
