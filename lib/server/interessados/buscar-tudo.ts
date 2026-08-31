import { prisma } from '@/lib/prisma';
import { verificaLimite, verificaPagina } from '@/lib/server/pagination';

/** Listagem paginada de interessados, usada pela página admin (/interessados). */
export async function buscarTudo(paginaInput?: number, limiteInput?: number, busca?: string) {
  let [pagina, limite] = verificaPagina(paginaInput, limiteInput);

  const searchParams = {
    ativo: true,
    ...(busca && { valor: { contains: busca } }),
  };

  const total = await prisma.interessado.count({ where: searchParams });
  if (total === 0) return { total: 0, pagina: 0, limite: 0, data: [] };

  [pagina, limite] = verificaLimite(pagina, limite, total);

  const data = await prisma.interessado.findMany({
    where: searchParams,
    orderBy: { valor: 'asc' },
    skip: (pagina - 1) * limite,
    take: limite,
  });

  return { total, pagina, limite, data };
}
