import { prisma } from '@/lib/prisma';

/** Porte de InteressadosService.listaCompleta (Antares-backend/src/interessados/interessados.service.ts). */
export async function listaCompleta() {
  const interessados = await prisma.interessado.findMany({
    where: { ativo: true },
    orderBy: { valor: 'asc' },
  });

  return interessados.map((interessado) => ({
    id: interessado.id,
    valor: interessado.valor,
    criadoEm: interessado.criadoEm,
  }));
}
