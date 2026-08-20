import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import type { UpdateUnidadeInput } from '@/lib/server/validation/unidades.schema';
import { buscarPorId } from './buscar-por-id';

/** Porte de UnidadesService.atualizar (Antares-backend/src/unidades/unidades.service.ts). */
export async function atualizar(id: string, dados: UpdateUnidadeInput) {
  const unidadeExistente = await buscarPorId(id);

  if (dados.nome && dados.nome !== unidadeExistente.nome) {
    const unidadeComMesmoNome = await prisma.unidade.findUnique({ where: { nome: dados.nome } });
    if (unidadeComMesmoNome) throw new HttpError(400, 'Já existe outra unidade com este nome.');
  }

  const sigla = dados.sigla?.toUpperCase();
  if (sigla && sigla !== unidadeExistente.sigla) {
    const unidadeComMesmaSigla = await prisma.unidade.findUnique({ where: { sigla } });
    if (unidadeComMesmaSigla) throw new HttpError(400, 'Já existe outra unidade com esta sigla.');
  }

  return prisma.unidade.update({
    where: { id },
    data: {
      ...(dados.nome && { nome: dados.nome }),
      ...(sigla && { sigla }),
    },
  });
}
