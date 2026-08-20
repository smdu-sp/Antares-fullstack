import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';

/** Porte de UnidadesService.reativar (Antares-backend/src/unidades/unidades.service.ts). */
export async function reativar(id: string) {
  const unidade = await prisma.unidade.findUnique({ where: { id } });
  if (!unidade) throw new HttpError(404, 'Unidade não encontrada.');
  if (unidade.ativo) throw new HttpError(400, 'Unidade já está ativa.');

  return prisma.unidade.update({ where: { id }, data: { ativo: true } });
}
