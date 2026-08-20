import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verificaLimite, verificaPagina } from '@/lib/server/pagination';
import { montarFiltrosVisibilidadeConsulta } from './montar-filtros-visibilidade';
import { PROCESSO_INCLUDE_PADRAO } from './processo-include';
import { mapProcessoToResponseDto } from './map-processo-response';

/** Porte de ProcessosService.buscarTudo (Antares-backend/src/processos/processos.service.ts). */
export async function buscarTudo(
  paginaInput?: number,
  limiteInput?: number,
  busca?: string,
  interessado?: string,
  unidadeRemetente?: string,
  unidadeDestino?: string,
  vencendoHoje: boolean = false,
  atrasados: boolean = false,
  concluidos: boolean = false,
  usuario_id?: string,
  unidade?: string,
) {
  let [pagina, limite] = verificaPagina(paginaInput, limiteInput);

  const visibilidade = await montarFiltrosVisibilidadeConsulta(usuario_id);
  if (visibilidade.semAcesso) return { total: 0, pagina: 0, limite: 0, data: [] };

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const fimDoDia = new Date(hoje);
  fimDoDia.setHours(23, 59, 59, 999);

  const searchParams: Prisma.processoWhereInput = {
    ativo: true,
    ...(visibilidade.filtros.length > 0 ? { AND: [...visibilidade.filtros] } : {}),
  };

  if (busca) {
    searchParams.OR = [
      { numero_sei: { contains: busca } },
      { assunto: { contains: busca } },
      { origem: { contains: busca } },
      { resposta_final: { contains: busca } },
      { unidade_respondida_id: { contains: busca } },
      { interessado: { valor: { contains: busca } } },
      { unidadeRemetente: { OR: [{ nome: { contains: busca } }, { sigla: { contains: busca } }] } },
      { unidadeDestino: { OR: [{ nome: { contains: busca } }, { sigla: { contains: busca } }] } },
      {
        andamentos: {
          some: {
            ativo: true,
            OR: [
              { origem: { contains: busca } },
              { destino: { contains: busca } },
              { observacao: { contains: busca } },
            ],
          },
        },
      },
    ];
  }

  if (interessado) {
    searchParams.interessado = { valor: { contains: interessado } };
  }

  if (unidadeRemetente) {
    searchParams.unidadeRemetente = {
      OR: [{ nome: { contains: unidadeRemetente } }, { sigla: { contains: unidadeRemetente } }],
    };
  }

  if (unidadeDestino) {
    searchParams.unidadeDestino = {
      OR: [{ nome: { contains: unidadeDestino } }, { sigla: { contains: unidadeDestino } }],
    };
  }

  if (unidade) {
    const andAtual = Array.isArray(searchParams.AND)
      ? [...searchParams.AND]
      : searchParams.AND
        ? [searchParams.AND]
        : [];
    searchParams.AND = [
      ...andAtual,
      {
        OR: [
          { unidadeRemetente: { OR: [{ nome: { contains: unidade } }, { sigla: { contains: unidade } }] } },
          { unidadeDestino: { OR: [{ nome: { contains: unidade } }, { sigla: { contains: unidade } }] } },
        ],
      },
    ];
  }

  if (vencendoHoje || atrasados || concluidos) {
    // A partir de 2026-08-19, usa os campos pré-computados `prazo_efetivo`/
    // `andamentos_todos_concluidos` (mantidos em sincronia por recalcularPrazoEfetivo(),
    // chamado sempre que um andamento é criado/editado/removido) em vez de subquery
    // correlacionada em `andamentos` — a versão anterior não escalava (5+s com dezenas de
    // milhares de processos, porque o MySQL não consegue parar no LIMIT quando o filtro
    // depende de uma subconsulta por linha candidata). Mesma regra de negócio, só que
    // pré-calculada: ver lib/server/processos/recalcular-prazo-efetivo.ts.
    const filtrosStatus: Prisma.processoWhereInput[] = [];

    if (vencendoHoje) {
      filtrosStatus.push({ prazo_efetivo: { gte: hoje, lte: fimDoDia } });
    }

    if (atrasados) {
      filtrosStatus.push({ prazo_efetivo: { lt: hoje } });
    }

    if (concluidos) {
      filtrosStatus.push({ andamentos_todos_concluidos: true });
    }

    if (filtrosStatus.length > 0) {
      const andAtual = Array.isArray(searchParams.AND) ? [...searchParams.AND] : [];

      if (searchParams.OR) {
        searchParams.AND = [...andAtual, { OR: searchParams.OR }, { OR: filtrosStatus }];
        delete searchParams.OR;
      } else {
        searchParams.AND = [...andAtual, { OR: filtrosStatus }];
      }
    }
  }

  const total = await prisma.processo.count({ where: searchParams });
  if (total === 0) return { total: 0, pagina: 0, limite: 0, data: [] };

  [pagina, limite] = verificaLimite(pagina, limite, total);

  const processos = await prisma.processo.findMany({
    where: searchParams,
    orderBy: { criadoEm: 'desc' },
    skip: (pagina - 1) * limite,
    take: limite,
    include: PROCESSO_INCLUDE_PADRAO,
  });

  return { total, pagina, limite, data: processos.map(mapProcessoToResponseDto) };
}
