import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import type { UpdateInteressadoInput } from '@/lib/server/validation/interessados.schema';

/** Porte de InteressadosService.atualizar (Antares-backend/src/interessados/interessados.service.ts). */
export async function atualizar(id: string, dados: UpdateInteressadoInput) {
  const interessadoExistente = await prisma.interessado.findUnique({ where: { id, ativo: true } });
  if (!interessadoExistente) throw new HttpError(404, 'Interessado não encontrado.');

  if (dados.valor) {
    const valor = dados.valor.trim();
    const interessadoComMesmoNome = await prisma.interessado.findFirst({
      where: { valor, id: { not: id }, ativo: true },
    });
    if (interessadoComMesmoNome) throw new HttpError(400, 'Já existe outro interessado com este nome.');
  }

  const interessado = await prisma.interessado.update({
    where: { id },
    data: { valor: dados.valor?.trim() },
  });

  return { id: interessado.id, valor: interessado.valor, criadoEm: interessado.criadoEm };
}
