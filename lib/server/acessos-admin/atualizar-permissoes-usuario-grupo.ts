import { TipoAcao } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { criar as criarLog } from '@/lib/server/logs/criar';
import type { AtualizarPermissoesUsuarioGrupoInput } from '@/lib/server/validation/acessos-admin.schema';
import { validarUsuario, validarGrupo } from './validadores';

/** Porte de AcessosAdminService.atualizarPermissoesUsuarioGrupo (Antares-backend/src/acessos-admin/acessos-admin.service.ts). */
export async function atualizarPermissoesUsuarioGrupo(
  usuarioId: string,
  grupoId: string,
  dto: AtualizarPermissoesUsuarioGrupoInput,
  operadorId: string,
) {
  await validarUsuario(usuarioId);
  await validarGrupo(grupoId);

  const vinculo = await prisma.usuarioGrupo.upsert({
    where: { usuario_id_grupo_id: { usuario_id: usuarioId, grupo_id: grupoId } },
    create: { usuario_id: usuarioId, grupo_id: grupoId, ativo: true },
    update: {},
  });

  const atual = await prisma.usuarioGrupoPermissao.findUnique({ where: { usuario_grupo_id: vinculo.id } });

  const permissao = await prisma.usuarioGrupoPermissao.upsert({
    where: { usuario_grupo_id: vinculo.id },
    create: {
      usuario_grupo_id: vinculo.id,
      visualizar_proprios: dto.visualizar_proprios ?? false,
      visualizar_grupo: dto.visualizar_grupo ?? false,
      modificar_proprios: dto.modificar_proprios ?? false,
      modificar_grupo: dto.modificar_grupo ?? false,
      excluir: dto.excluir ?? false,
      ativo: dto.ativo ?? true,
    },
    update: {
      ...(dto.visualizar_proprios !== undefined ? { visualizar_proprios: dto.visualizar_proprios } : {}),
      ...(dto.visualizar_grupo !== undefined ? { visualizar_grupo: dto.visualizar_grupo } : {}),
      ...(dto.modificar_proprios !== undefined ? { modificar_proprios: dto.modificar_proprios } : {}),
      ...(dto.modificar_grupo !== undefined ? { modificar_grupo: dto.modificar_grupo } : {}),
      ...(dto.excluir !== undefined ? { excluir: dto.excluir } : {}),
      ...(dto.ativo !== undefined ? { ativo: dto.ativo } : {}),
    },
  });

  await criarLog(
    TipoAcao.USUARIO_PERMISSAO_ATUALIZADA,
    `Permissao de grupo atualizada: usuario=${usuarioId}, grupo=${grupoId}`,
    'usuario_grupo_permissao',
    permissao.id,
    operadorId,
    atual,
    permissao,
  );

  return permissao;
}
