import { prisma } from '@/lib/prisma';

/** Porte de UnidadesService.listaCompleta (Antares-backend/src/unidades/unidades.service.ts). */
export async function listaCompleta(includeInactive: boolean = true) {
  return prisma.unidade.findMany({
    where: includeInactive ? {} : { ativo: true },
    orderBy: { nome: 'asc' },
  });
}
