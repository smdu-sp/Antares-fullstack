import { prisma } from '@/lib/prisma';

/** Porte de PreferenciasService.buscarTodas (Antares-backend/src/preferencias/preferencias.service.ts). */
export async function buscarTodas(usuario_id: string) {
  return prisma.preferenciasUsuario.findMany({
    where: { usuario_id, ativo: true },
    select: { id: true, chave: true, valor: true, atualizadoEm: true },
    orderBy: { chave: 'asc' },
  });
}
