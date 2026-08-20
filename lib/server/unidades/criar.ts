import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import type { CreateUnidadeInput } from '@/lib/server/validation/unidades.schema';

/** Porte de UnidadesService.criar (Antares-backend/src/unidades/unidades.service.ts). */
export async function criar(dados: CreateUnidadeInput) {
  const unidadeComMesmoNome = await prisma.unidade.findUnique({ where: { nome: dados.nome } });
  if (unidadeComMesmoNome) throw new HttpError(400, 'Já existe uma unidade com este nome.');

  const sigla = dados.sigla.toUpperCase();
  const unidadeComMesmaSigla = await prisma.unidade.findUnique({ where: { sigla } });
  if (unidadeComMesmaSigla) throw new HttpError(400, 'Já existe uma unidade com esta sigla.');

  return prisma.unidade.create({ data: { nome: dados.nome, sigla } });
}
