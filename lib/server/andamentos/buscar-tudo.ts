import { Prisma, StatusAndamento } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verificaLimite, verificaPagina } from '@/lib/server/pagination';
import { montarFiltrosVisibilidadeAndamentos } from './montar-filtros-visibilidade';
import { ANDAMENTO_INCLUDE_PADRAO } from './andamento-include';

/** Porte de AndamentosService.buscarTudo (Antares-backend/src/andamentos/andamentos.service.ts). */
export async function buscarTudo(
  paginaInput?: number,
  limiteInput?: number,
  processo_id?: string,
  status?: string,
  usuario_id?: string,
) {
  let [pagina, limite] = verificaPagina(paginaInput, limiteInput);

  const visibilidade = await montarFiltrosVisibilidadeAndamentos(usuario_id);
  if (visibilidade.semAcesso) return { total: 0, pagina: 0, limite: 0, data: [] };

  const searchParams: Prisma.andamentoWhereInput = {
    ativo: true,
    ...(visibilidade.filtros.length > 0 ? { AND: [...visibilidade.filtros] } : {}),
    ...(processo_id && { processo_id }),
    ...(status && status !== '' && { status: status as StatusAndamento }),
  };

  const total = await prisma.andamento.count({ where: searchParams });
  if (total === 0) return { total: 0, pagina: 0, limite: 0, data: [] };

  [pagina, limite] = verificaLimite(pagina, limite, total);

  const andamentos = await prisma.andamento.findMany({
    where: searchParams,
    orderBy: { criadoEm: 'desc' },
    skip: (pagina - 1) * limite,
    take: limite,
    include: ANDAMENTO_INCLUDE_PADRAO,
  });

  return { total, pagina, limite, data: andamentos };
}
