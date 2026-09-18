import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';

/** Espelha lib/server/unidades/buscar-por-id.ts, pra UnidadeGrupo. */
export async function buscarPorId(id: string) {
  if (!id) throw new HttpError(400, 'ID da unidade é obrigatório.');

  const unidade = await prisma.unidadeGrupo.findUnique({ where: { id } });
  if (!unidade || !unidade.ativo) throw new HttpError(404, 'Unidade não encontrada.');

  return unidade;
}
