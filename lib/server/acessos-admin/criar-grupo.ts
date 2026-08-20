import { TipoAcao } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { criar as criarLog } from '@/lib/server/logs/criar';
import type { CreateGrupoInput } from '@/lib/server/validation/acessos-admin.schema';

/** Porte de AcessosAdminService.criarGrupo (Antares-backend/src/acessos-admin/acessos-admin.service.ts). */
export async function criarGrupo(dto: CreateGrupoInput, usuarioId: string) {
  const existente = await prisma.grupo.findUnique({
    where: { codigo_tipo: { codigo: dto.codigo, tipo: dto.tipo } },
    select: { id: true },
  });

  if (existente) throw new HttpError(400, 'Ja existe um grupo com este codigo e tipo.');

  const grupo = await prisma.grupo.create({
    data: { codigo: dto.codigo, tipo: dto.tipo, nome: dto.nome, ativo: true },
  });

  await criarLog(
    TipoAcao.GRUPO_ATUALIZADO,
    `Grupo criado: ${grupo.codigo}/${grupo.tipo} - ${grupo.nome}`,
    'grupo',
    grupo.id,
    usuarioId,
    null,
    grupo,
  );

  return grupo;
}
