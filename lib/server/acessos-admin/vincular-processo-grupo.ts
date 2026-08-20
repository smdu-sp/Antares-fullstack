import { NivelVisaoGrupoProcesso, TipoAcao } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { criar as criarLog } from '@/lib/server/logs/criar';
import type { VincularProcessoGrupoInput } from '@/lib/server/validation/acessos-admin.schema';
import { validarProcesso, validarGrupo } from './validadores';

/** Porte de AcessosAdminService.vincularProcessoGrupo (Antares-backend/src/acessos-admin/acessos-admin.service.ts). */
export async function vincularProcessoGrupo(
  processoId: string,
  grupoId: string,
  dto: VincularProcessoGrupoInput,
  operadorId: string,
) {
  await validarProcesso(processoId);
  await validarGrupo(grupoId);

  const atual = await prisma.processoGrupo.findUnique({
    where: { processo_id_grupo_id: { processo_id: processoId, grupo_id: grupoId } },
  });

  const vinculo = await prisma.processoGrupo.upsert({
    where: { processo_id_grupo_id: { processo_id: processoId, grupo_id: grupoId } },
    create: {
      processo_id: processoId,
      grupo_id: grupoId,
      nivelVisao: dto.nivelVisao ?? NivelVisaoGrupoProcesso.TOTAL,
      ativo: dto.ativo ?? true,
    },
    update: {
      ...(dto.nivelVisao !== undefined ? { nivelVisao: dto.nivelVisao } : {}),
      ...(dto.ativo !== undefined ? { ativo: dto.ativo } : {}),
    },
    include: { grupo: true },
  });

  await criarLog(
    TipoAcao.PROCESSO_GRUPO_ATUALIZADO,
    `Vinculo processo-grupo atualizado: processo=${processoId}, grupo=${vinculo.grupo.codigo}`,
    'processo_grupo',
    vinculo.id,
    operadorId,
    atual,
    vinculo,
  );

  return vinculo;
}
