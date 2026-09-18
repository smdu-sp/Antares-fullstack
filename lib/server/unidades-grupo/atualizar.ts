import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import type { UpdateUnidadeGrupoInput } from '@/lib/server/validation/unidades-grupo.schema';
import { buscarPorId } from './buscar-por-id';

/** Espelha lib/server/unidades/atualizar.ts, pra UnidadeGrupo (duplicata escopada ao mesmo grupo). */
export async function atualizar(id: string, dados: UpdateUnidadeGrupoInput) {
  const unidadeExistente = await buscarPorId(id);

  if (dados.nome && dados.nome !== unidadeExistente.nome) {
    const unidadeComMesmoNome = await prisma.unidadeGrupo.findFirst({
      where: { nome: dados.nome, grupo_id: unidadeExistente.grupo_id },
    });
    if (unidadeComMesmoNome) throw new HttpError(400, 'Já existe outra unidade com este nome.');
  }

  const sigla = dados.sigla?.toUpperCase();
  if (sigla && sigla !== unidadeExistente.sigla) {
    const unidadeComMesmaSigla = await prisma.unidadeGrupo.findFirst({
      where: { sigla, grupo_id: unidadeExistente.grupo_id },
    });
    if (unidadeComMesmaSigla) throw new HttpError(400, 'Já existe outra unidade com esta sigla.');
  }

  return prisma.unidadeGrupo.update({
    where: { id },
    data: {
      ...(dados.nome && { nome: dados.nome }),
      ...(sigla && { sigla }),
    },
  });
}
