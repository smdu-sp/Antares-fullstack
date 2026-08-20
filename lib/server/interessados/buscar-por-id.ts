import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';

/** Porte de InteressadosService.buscarPorId (Antares-backend/src/interessados/interessados.service.ts). */
export async function buscarPorId(id: string) {
  const interessado = await prisma.interessado.findUnique({ where: { id, ativo: true } });
  if (!interessado) throw new HttpError(404, 'Interessado não encontrado.');

  return { id: interessado.id, valor: interessado.valor, criadoEm: interessado.criadoEm };
}
