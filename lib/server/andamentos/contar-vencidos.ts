import { Prisma, StatusAndamento } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { montarFiltrosVisibilidadeAndamentos } from './montar-filtros-visibilidade';

/** Porte de AndamentosService.contarVencidos (Antares-backend/src/andamentos/andamentos.service.ts). */
export async function contarVencidos(usuario_id?: string): Promise<number> {
  const visibilidade = await montarFiltrosVisibilidadeAndamentos(usuario_id);
  if (visibilidade.semAcesso) return 0;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const searchParams: Prisma.andamentoWhereInput = {
    ...(visibilidade.filtros.length > 0 ? { AND: [...visibilidade.filtros] } : {}),
    ativo: true,
    status: { not: StatusAndamento.CONCLUIDO },
    OR: [{ prazo: { lt: hoje }, prorrogacao: null }, { prorrogacao: { lt: hoje } }],
  };

  return prisma.andamento.count({ where: searchParams });
}
