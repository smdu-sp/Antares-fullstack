import { prisma } from '@/lib/prisma';

/** Porte de InteressadosService.buscarPorTermo (Antares-backend/src/interessados/interessados.service.ts). */
export async function buscarPorTermo(termo: string) {
  const interessados = await prisma.interessado.findMany({
    where: { valor: { contains: termo }, ativo: true },
    orderBy: { valor: 'asc' },
    take: 10,
  });

  return interessados.map((interessado) => ({
    id: interessado.id,
    valor: interessado.valor,
    criadoEm: interessado.criadoEm,
  }));
}
