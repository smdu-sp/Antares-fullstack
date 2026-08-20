import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';

/** Porte de InteressadosService.remover (Antares-backend/src/interessados/interessados.service.ts). */
export async function remover(id: string) {
  const interessado = await prisma.interessado.findUnique({ where: { id, ativo: true } });
  if (!interessado) throw new HttpError(404, 'Interessado não encontrado.');

  const processosVinculados = await prisma.processo.count({ where: { interessado_id: id, ativo: true } });
  if (processosVinculados > 0) {
    throw new HttpError(
      400,
      `Não é possível remover este interessado pois existem ${processosVinculados} processo(s) ativo(s) vinculado(s).`,
    );
  }

  await prisma.interessado.update({ where: { id }, data: { ativo: false } });
  return { removido: true };
}
