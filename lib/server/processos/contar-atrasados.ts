import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { montarFiltrosVisibilidadeConsulta } from './montar-filtros-visibilidade';

/** Porte de ProcessosService.contarAtrasados (Antares-backend/src/processos/processos.service.ts). */
export async function contarAtrasados(usuario_id?: string): Promise<number> {
  const visibilidade = await montarFiltrosVisibilidadeConsulta(usuario_id);
  if (visibilidade.semAcesso) return 0;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const searchParams: Prisma.processoWhereInput = {
    ...(visibilidade.filtros.length > 0 ? { AND: [...visibilidade.filtros] } : {}),
    ativo: true,
    data_resposta_final: null,
    OR: [{ prazo: { lt: hoje }, prorrogacao: null }, { prorrogacao: { lt: hoje } }],
  };

  return prisma.processo.count({ where: searchParams });
}
