import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { montarFiltrosVisibilidadeConsulta } from './montar-filtros-visibilidade';

/** Porte de ProcessosService.contarConcluidos (Antares-backend/src/processos/processos.service.ts). */
export async function contarConcluidos(usuario_id?: string): Promise<number> {
  const visibilidade = await montarFiltrosVisibilidadeConsulta(usuario_id);
  if (visibilidade.semAcesso) return 0;

  const searchParams: Prisma.processoWhereInput = {
    ...(visibilidade.filtros.length > 0 ? { AND: [...visibilidade.filtros] } : {}),
    ativo: true,
    data_resposta_final: { not: null },
  };

  return prisma.processo.count({ where: searchParams });
}
