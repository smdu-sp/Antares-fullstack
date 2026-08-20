import { prisma } from '@/lib/prisma';

/** Porte de ProcessosService.autocompleteOrigens. */
export async function autocompleteOrigens(q: string): Promise<string[]> {
  if (!q || q.trim() === '') return [];

  const results = await prisma.origemProcesso.findMany({
    where: { valor: { contains: q } },
    orderBy: { valor: 'asc' },
    take: 10,
  });

  return results.map((o) => o.valor);
}
