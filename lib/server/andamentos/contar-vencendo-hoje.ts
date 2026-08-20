import { Prisma, StatusAndamento } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { montarFiltrosVisibilidadeAndamentos } from './montar-filtros-visibilidade';

/** Porte de AndamentosService.contarVencendoHoje (Antares-backend/src/andamentos/andamentos.service.ts). */
export async function contarVencendoHoje(usuario_id?: string): Promise<number> {
  const visibilidade = await montarFiltrosVisibilidadeAndamentos(usuario_id);
  if (visibilidade.semAcesso) return 0;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const fimDoDia = new Date(hoje);
  fimDoDia.setHours(23, 59, 59, 999);

  const searchParams: Prisma.andamentoWhereInput = {
    ...(visibilidade.filtros.length > 0 ? { AND: [...visibilidade.filtros] } : {}),
    ativo: true,
    status: { not: StatusAndamento.CONCLUIDO },
    OR: [
      { prazo: { gte: hoje, lte: fimDoDia }, prorrogacao: null },
      { prorrogacao: { gte: hoje, lte: fimDoDia } },
    ],
  };

  return prisma.andamento.count({ where: searchParams });
}
