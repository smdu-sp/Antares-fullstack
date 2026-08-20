import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ExportParamsInput } from '../validation/export.schema';
import { montarFiltrosVisibilidadeConsulta } from '../processos/montar-filtros-visibilidade';

// Teto de segurança: sem isso, uma exportação sem filtro (ou com filtro amplo) tentaria
// carregar tudo que o usuário enxerga de uma vez só — em grupos grandes (dezenas de
// milhares de processos) isso significa memória/tempo de resposta descontrolados.
const LIMITE_EXPORT_MAXIMO = 20000;

/**
 * Porte de ExportController.buscarProcessos (Antares-backend/src/export/export.controller.ts),
 * com duas correções: (1) o controller original nunca aplicava filtro de visibilidade por
 * grupo (só exigia estar autenticado — `usuario_id` era capturado mas nunca usado) — aplica
 * aqui o mesmo filtro usado por ProcessosService.buscarTudo; (2) nunca tinha teto de linhas —
 * agora limita a `LIMITE_EXPORT_MAXIMO` e sinaliza truncamento pro chamador avisar o usuário.
 */
export async function buscarProcessosParaExport(params: ExportParamsInput, usuarioId?: string) {
  const visibilidade = await montarFiltrosVisibilidadeConsulta(usuarioId);
  if (visibilidade.semAcesso) return { data: [], truncado: false };

  const where: Prisma.processoWhereInput = { ativo: true };

  if (params.ids && params.ids.length > 0) {
    where.id = { in: params.ids };
  }

  if (params.busca) {
    where.OR = [
      { numero_sei: { contains: params.busca } },
      { assunto: { contains: params.busca } },
      { origem: { contains: params.busca } },
    ];
  }

  if (params.interessado) {
    where.interessado = { valor: { contains: params.interessado } };
  }

  if (params.unidadeRemetente) {
    where.unidade_remetente_id = params.unidadeRemetente;
  }

  if (params.unidadeDestino) {
    where.unidade_destino_id = params.unidadeDestino;
  }

  const andConditions: Prisma.processoWhereInput[] = [...visibilidade.filtros];

  if (params.vencendoHoje) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    andConditions.push(
      {
        OR: [
          { prazo: { gte: hoje, lt: amanha } },
          { prorrogacao: { gte: hoje, lt: amanha } },
          {
            andamentos: {
              some: {
                OR: [
                  { prazo: { gte: hoje, lt: amanha } },
                  { prorrogacao: { gte: hoje, lt: amanha } },
                ],
                resposta: null,
              },
            },
          },
        ],
      },
      {
        NOT: {
          andamentos: { some: { resposta: { not: null }, destino: 'SMUL' } },
        },
      },
    );
  }

  if (params.atrasados) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    andConditions.push(
      {
        OR: [
          { prazo: { lt: hoje } },
          { prorrogacao: { lt: hoje } },
          {
            andamentos: {
              some: {
                OR: [{ prazo: { lt: hoje } }, { prorrogacao: { lt: hoje } }],
                resposta: null,
              },
            },
          },
        ],
      },
      {
        NOT: {
          andamentos: { some: { resposta: { not: null }, destino: 'SMUL' } },
        },
      },
    );
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  if (params.concluidos !== undefined) {
    if (params.concluidos) {
      where.andamentos = { some: { resposta: { not: null }, destino: 'SMUL' } };
    } else {
      where.NOT = { andamentos: { some: { resposta: { not: null }, destino: 'SMUL' } } };
    }
  }

  const processos = await prisma.processo.findMany({
    where,
    include: {
      interessado: true,
      unidadeRemetente: true,
      unidadeDestino: true,
      andamentos:
        params.incluirAndamentos || params.incluirProcesso === false
          ? { orderBy: { criadoEm: 'asc' } }
          : false,
    },
    orderBy: { criadoEm: 'desc' },
    take: LIMITE_EXPORT_MAXIMO + 1,
  });

  const truncado = processos.length > LIMITE_EXPORT_MAXIMO;
  return { data: truncado ? processos.slice(0, LIMITE_EXPORT_MAXIMO) : processos, truncado };
}
