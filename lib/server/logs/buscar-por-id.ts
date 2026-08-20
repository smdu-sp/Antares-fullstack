import { prisma } from '@/lib/prisma';

/** Porte de LogsService.buscarPorId (Antares-backend/src/logs/logs.service.ts). */
export async function buscarPorId(id: string) {
  return prisma.log.findUnique({
    where: { id },
    include: { usuario: { select: { id: true, nome: true, login: true } } },
  });
}
