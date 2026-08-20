import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';

/** Porte de ProcessosService.buscarUnidadesResposta (Antares-backend/src/processos/processos.service.ts). */
export async function buscarUnidadesResposta(id: string): Promise<{ unidades: string[] }> {
  const processo = await prisma.processo.findUnique({ where: { id }, select: { origem: true } });
  if (!processo) throw new HttpError(404, 'Processo não encontrado.');

  return { unidades: [processo.origem] };
}
