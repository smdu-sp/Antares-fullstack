import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import type { UpdateInteressadoInput } from '@/lib/server/validation/interessados.schema';
import { hashValorInteressado } from './hash-valor';

/** Porte de InteressadosService.atualizar (Antares-backend/src/interessados/interessados.service.ts). */
export async function atualizar(id: string, dados: UpdateInteressadoInput) {
  const interessadoExistente = await prisma.interessado.findUnique({ where: { id, ativo: true } });
  if (!interessadoExistente) throw new HttpError(404, 'Interessado não encontrado.');

  let valor: string | undefined;
  if (dados.valor) {
    valor = dados.valor.trim();
    // Duplicata escopada ao mesmo grupo do registro sendo editado — o mesmo
    // nome pode existir em outro grupo como cadastro independente.
    const interessadoComMesmoNome = await prisma.interessado.findFirst({
      where: { valor, grupo_id: interessadoExistente.grupo_id, id: { not: id }, ativo: true },
    });
    if (interessadoComMesmoNome) throw new HttpError(400, 'Já existe outro interessado com este nome.');
  }

  const interessado = await prisma.interessado.update({
    where: { id },
    data: valor !== undefined ? { valor, valorHash: hashValorInteressado(valor) } : {},
  });

  return { id: interessado.id, valor: interessado.valor, criadoEm: interessado.criadoEm };
}
