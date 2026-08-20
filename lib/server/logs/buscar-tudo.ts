import { Prisma, TipoAcao } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verificaLimite, verificaPagina } from '@/lib/server/pagination';

export interface FiltrosLog {
  tipoAcao?: TipoAcao;
  entidadeTipo?: string;
  entidadeId?: string;
  usuario_id?: string;
  dataInicio?: string;
  dataFim?: string;
}

function verificaData(dataInicio: string, dataFim: string): [Date, Date] {
  let inicio: Date;
  let fim: Date;

  if (!dataInicio) {
    inicio = new Date();
  } else {
    const partes = dataInicio.split('-');
    inicio = new Date(+partes[2], +partes[1] - 1, +partes[0], 0, 0, 0);
  }

  if (!dataFim) {
    fim = new Date();
  } else {
    const partes = dataFim.split('-');
    fim = new Date(+partes[2], +partes[1] - 1, +partes[0], 23, 59, 59, 999);
  }

  return [inicio, fim];
}

/** Porte de LogsService.buscarTudo (Antares-backend/src/logs/logs.service.ts). */
export async function buscarTudo(paginaInput?: number, limiteInput?: number, filtros?: FiltrosLog) {
  let [pagina, limite] = verificaPagina(paginaInput, limiteInput);

  const searchParams: Prisma.LogWhereInput = {
    ...(filtros?.tipoAcao && { tipoAcao: filtros.tipoAcao }),
    ...(filtros?.entidadeTipo && { entidadeTipo: filtros.entidadeTipo }),
    ...(filtros?.entidadeId && { entidadeId: filtros.entidadeId }),
    ...(filtros?.usuario_id && { usuario_id: filtros.usuario_id }),
  };

  if (filtros?.dataInicio || filtros?.dataFim) {
    const [dataInicio, dataFim] = verificaData(filtros.dataInicio || '', filtros.dataFim || '');
    searchParams.criadoEm = { gte: dataInicio, lte: dataFim };
  }

  const total = await prisma.log.count({ where: searchParams });
  if (total === 0) return { total: 0, pagina: 0, limite: 0, data: [] };

  [pagina, limite] = verificaLimite(pagina, limite, total);

  const logs = await prisma.log.findMany({
    where: searchParams,
    orderBy: { criadoEm: 'desc' },
    skip: (pagina - 1) * limite,
    take: limite,
    include: { usuario: { select: { id: true, nome: true, login: true } } },
  });

  return { total, pagina, limite, data: logs };
}
