import { TipoAcao } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { criar as criarLog } from '@/lib/server/logs/criar';
import type { VincularUsuarioGrupoInput } from '@/lib/server/validation/acessos-admin.schema';
import { validarUsuario, validarGrupo } from './validadores';

/** Porte de AcessosAdminService.vincularUsuarioGrupo (Antares-backend/src/acessos-admin/acessos-admin.service.ts). */
export async function vincularUsuarioGrupo(
  usuarioId: string,
  grupoId: string,
  dto: VincularUsuarioGrupoInput,
  operadorId: string,
) {
  await validarUsuario(usuarioId);
  await validarGrupo(grupoId);

  const vinculoAtual = await prisma.usuarioGrupo.findUnique({
    where: { usuario_id_grupo_id: { usuario_id: usuarioId, grupo_id: grupoId } },
    select: { id: true, ativo: true },
  });

  const ativo = dto.ativo ?? vinculoAtual?.ativo ?? true;
  const permissaoGrupo = dto.permissao_grupo ?? 'USR';

  if (vinculoAtual?.ativo && dto.ativo === false) {
    const outrosAtivos = await prisma.usuarioGrupo.count({
      where: {
        usuario_id: usuarioId,
        ativo: true,
        NOT: { grupo_id: grupoId },
        grupo: { ativo: true },
      },
    });

    if (outrosAtivos === 0) {
      throw new HttpError(400, 'Usuario deve manter pelo menos um grupo ativo.');
    }
  }

  const vinculo = await prisma.usuarioGrupo.upsert({
    where: { usuario_id_grupo_id: { usuario_id: usuarioId, grupo_id: grupoId } },
    create: { usuario_id: usuarioId, grupo_id: grupoId, permissao_grupo: permissaoGrupo, ativo },
    update: {
      ativo,
      ...(dto.permissao_grupo !== undefined ? { permissao_grupo: dto.permissao_grupo } : {}),
    },
    include: { grupo: true },
  });

  await criarLog(
    TipoAcao.USUARIO_PERMISSAO_ATUALIZADA,
    `Vinculo usuario-grupo atualizado: usuario=${usuarioId}, grupo=${vinculo.grupo.codigo}`,
    'usuario_grupo',
    vinculo.id,
    operadorId,
    null,
    vinculo,
  );

  return vinculo;
}
