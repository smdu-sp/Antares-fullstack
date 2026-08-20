import { prisma } from '@/lib/prisma';
import { verificaLimite, verificaPagina } from '@/lib/server/pagination';

/** Porte de UnidadesService.buscarTudo (Antares-backend/src/unidades/unidades.service.ts). */
export async function buscarTudo(paginaInput?: number, limiteInput?: number, busca?: string) {
  let [pagina, limite] = verificaPagina(paginaInput, limiteInput);

  const searchParams = {
    ativo: true,
    ...(busca && {
      OR: [{ nome: { contains: busca } }, { sigla: { contains: busca.toUpperCase() } }],
    }),
  };

  const total = await prisma.unidade.count({ where: searchParams });
  if (total === 0) return { total: 0, pagina: 0, limite: 0, data: [] };

  [pagina, limite] = verificaLimite(pagina, limite, total);

  const data = await prisma.unidade.findMany({
    where: searchParams,
    orderBy: { nome: 'asc' },
    skip: (pagina - 1) * limite,
    take: limite,
  });

  return { total, pagina, limite, data };
}
