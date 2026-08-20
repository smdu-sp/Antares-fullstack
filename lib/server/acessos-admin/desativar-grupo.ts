import { TipoAcao } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { criar as criarLog } from '@/lib/server/logs/criar';

/** Porte de AcessosAdminService.desativarGrupo (Antares-backend/src/acessos-admin/acessos-admin.service.ts). */
export async function desativarGrupo(id: string, usuarioId: string) {
  const grupoAtual = await prisma.grupo.findUnique({ where: { id } });
  if (!grupoAtual) throw new HttpError(404, 'Grupo nao encontrado.');

  const grupo = await prisma.grupo.update({ where: { id }, data: { ativo: false } });

  await criarLog(
    TipoAcao.GRUPO_ATUALIZADO,
    `Grupo desativado: ${grupo.codigo}/${grupo.tipo} - ${grupo.nome}`,
    'grupo',
    grupo.id,
    usuarioId,
    grupoAtual,
    grupo,
  );

  return { sucesso: true };
}
