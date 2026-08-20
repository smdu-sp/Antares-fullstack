import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';

/** Porte de UnidadesService.buscarPorId (Antares-backend/src/unidades/unidades.service.ts). */
export async function buscarPorId(id: string) {
  if (!id) throw new HttpError(400, 'ID da unidade é obrigatório.');

  const unidade = await prisma.unidade.findUnique({ where: { id } });
  if (!unidade || !unidade.ativo) throw new HttpError(404, 'Unidade não encontrada.');

  return unidade;
}
