import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';

/** Espelha lib/server/unidades/reativar.ts, pra UnidadeGrupo. */
export async function reativar(id: string) {
  const unidade = await prisma.unidadeGrupo.findUnique({ where: { id } });
  if (!unidade) throw new HttpError(404, 'Unidade não encontrada.');
  if (unidade.ativo) throw new HttpError(400, 'Unidade já está ativa.');

  return prisma.unidadeGrupo.update({ where: { id }, data: { ativo: true } });
}
