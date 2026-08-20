import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { montarFiltrosVisibilidadeConsulta } from './montar-filtros-visibilidade';

/** Porte de ProcessosService.contarTotal (Antares-backend/src/processos/processos.service.ts). */
export async function contarTotal(usuario_id?: string): Promise<number> {
  const visibilidade = await montarFiltrosVisibilidadeConsulta(usuario_id);
  if (visibilidade.semAcesso) return 0;

  const searchParams: Prisma.processoWhereInput = {
    ...(visibilidade.filtros.length > 0 ? { AND: [...visibilidade.filtros] } : {}),
    ativo: true,
  };

  return prisma.processo.count({ where: searchParams });
}
