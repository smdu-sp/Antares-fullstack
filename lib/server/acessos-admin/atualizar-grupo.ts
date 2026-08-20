import { TipoAcao } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { criar as criarLog } from '@/lib/server/logs/criar';
import type { UpdateGrupoInput } from '@/lib/server/validation/acessos-admin.schema';

/** Porte de AcessosAdminService.atualizarGrupo (Antares-backend/src/acessos-admin/acessos-admin.service.ts). */
export async function atualizarGrupo(id: string, dto: UpdateGrupoInput, usuarioId: string) {
  const grupoAtual = await prisma.grupo.findUnique({ where: { id } });
  if (!grupoAtual) throw new HttpError(404, 'Grupo nao encontrado.');

  if (dto.codigo || dto.tipo) {
    const codigo = dto.codigo ?? grupoAtual.codigo;
    const tipo = dto.tipo ?? grupoAtual.tipo;

    const conflito = await prisma.grupo.findUnique({
      where: { codigo_tipo: { codigo, tipo } },
      select: { id: true },
    });

    if (conflito && conflito.id !== id) {
      throw new HttpError(400, 'Ja existe um grupo com este codigo e tipo.');
    }
  }

  const grupo = await prisma.grupo.update({
    where: { id },
    data: {
      ...(dto.codigo !== undefined ? { codigo: dto.codigo } : {}),
      ...(dto.tipo !== undefined ? { tipo: dto.tipo } : {}),
      ...(dto.nome !== undefined ? { nome: dto.nome } : {}),
    },
  });

  await criarLog(
    TipoAcao.GRUPO_ATUALIZADO,
    `Grupo atualizado: ${grupo.codigo}/${grupo.tipo} - ${grupo.nome}`,
    'grupo',
    grupo.id,
    usuarioId,
    grupoAtual,
    grupo,
  );

  return grupo;
}
