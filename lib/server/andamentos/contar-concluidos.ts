import { Prisma, StatusAndamento } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { montarFiltrosVisibilidadeAndamentos } from './montar-filtros-visibilidade';

/** Porte de AndamentosService.contarConcluidos (Antares-backend/src/andamentos/andamentos.service.ts). */
export async function contarConcluidos(usuario_id?: string): Promise<number> {
  const visibilidade = await montarFiltrosVisibilidadeAndamentos(usuario_id);
  if (visibilidade.semAcesso) return 0;

  const searchParams: Prisma.andamentoWhereInput = {
    ...(visibilidade.filtros.length > 0 ? { AND: [...visibilidade.filtros] } : {}),
    ativo: true,
    status: StatusAndamento.CONCLUIDO,
  };

  return prisma.andamento.count({ where: searchParams });
}
