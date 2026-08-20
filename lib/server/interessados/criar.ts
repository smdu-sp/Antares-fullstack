import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import type { CreateInteressadoInput } from '@/lib/server/validation/interessados.schema';

/**
 * Porte de InteressadosService.criar (Antares-backend/src/interessados/interessados.service.ts),
 * com uma correção: `valor` tem índice único no banco independente de `ativo`, então criar um
 * interessado com o mesmo nome de um já removido (soft-delete) sempre derrubava com erro de
 * constraint única não tratado (o backend original tinha o mesmo bug). Em vez de deixar isso
 * quebrar, reativa o registro inativo existente.
 */
export async function criar(dados: CreateInteressadoInput) {
  const valor = dados.valor.trim();

  const interessadoAtivo = await prisma.interessado.findFirst({ where: { valor, ativo: true } });
  if (interessadoAtivo) throw new HttpError(400, 'Já existe um interessado com este nome.');

  const interessadoInativo = await prisma.interessado.findFirst({ where: { valor, ativo: false } });
  if (interessadoInativo) {
    const reativado = await prisma.interessado.update({
      where: { id: interessadoInativo.id },
      data: { ativo: true },
    });
    return { id: reativado.id, valor: reativado.valor, criadoEm: reativado.criadoEm };
  }

  const interessado = await prisma.interessado.create({ data: { valor } });

  return { id: interessado.id, valor: interessado.valor, criadoEm: interessado.criadoEm };
}
