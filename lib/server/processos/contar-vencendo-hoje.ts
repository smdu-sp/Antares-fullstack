import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { montarFiltrosVisibilidadeConsulta } from './montar-filtros-visibilidade';

/** Porte de ProcessosService.contarVencendoHoje (Antares-backend/src/processos/processos.service.ts). */
export async function contarVencendoHoje(usuario_id?: string): Promise<number> {
  const visibilidade = await montarFiltrosVisibilidadeConsulta(usuario_id);
  if (visibilidade.semAcesso) return 0;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const fimDoDia = new Date(hoje);
  fimDoDia.setHours(23, 59, 59, 999);

  const searchParams: Prisma.processoWhereInput = {
    ...(visibilidade.filtros.length > 0 ? { AND: [...visibilidade.filtros] } : {}),
    ativo: true,
    data_resposta_final: null,
    OR: [
      { prazo: { gte: hoje, lte: fimDoDia }, prorrogacao: null },
      { prorrogacao: { gte: hoje, lte: fimDoDia } },
    ],
  };

  return prisma.processo.count({ where: searchParams });
}
