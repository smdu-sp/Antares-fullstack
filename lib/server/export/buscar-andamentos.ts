import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ExportParamsInput } from '../validation/export.schema';
import { montarFiltrosVisibilidadeAndamentos } from '../andamentos/montar-filtros-visibilidade';

// Mesmo teto de segurança usado em buscar-processos.ts — ver comentário lá.
const LIMITE_EXPORT_MAXIMO = 20000;

/**
 * Porte de ExportController.buscarAndamentos (Antares-backend/src/export/export.controller.ts),
 * com duas correções: (1) o controller original nunca aplicava filtro de visibilidade por
 * grupo (só exigia estar autenticado — `usuario_id` era capturado mas nunca usado) — aplica
 * aqui o mesmo filtro usado por AndamentosService.buscarTudo; (2) nunca tinha teto de linhas —
 * agora limita a `LIMITE_EXPORT_MAXIMO` e sinaliza truncamento pro chamador avisar o usuário.
 */
export async function buscarAndamentosParaExport(params: ExportParamsInput, usuarioId?: string) {
  const visibilidade = await montarFiltrosVisibilidadeAndamentos(usuarioId);
  if (visibilidade.semAcesso) return { data: [], truncado: false };

  const where: Prisma.andamentoWhereInput = { ativo: true };

  if (params.ids && params.ids.length > 0) {
    where.id = { in: params.ids };
  }

  if (params.busca) {
    where.OR = [
      { origem: { contains: params.busca } },
      { destino: { contains: params.busca } },
      { assunto: { contains: params.busca } },
      { observacao: { contains: params.busca } },
      { processo: { numero_sei: { contains: params.busca } } },
    ];
  }

  const andConditions: Prisma.andamentoWhereInput[] = [...visibilidade.filtros];

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
        ],
      },
      { resposta: null },
    );
  }

  if (params.atrasados) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    andConditions.push(
      { OR: [{ prazo: { lt: hoje } }, { prorrogacao: { lt: hoje } }] },
      { resposta: null },
    );
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  if (params.concluidos !== undefined) {
    where.resposta = params.concluidos ? { not: null } : null;
  }

  const andamentos = await prisma.andamento.findMany({
    where,
    include: {
      processo: { select: { numero_sei: true, assunto: true } },
    },
    orderBy: { criadoEm: 'desc' },
    take: LIMITE_EXPORT_MAXIMO + 1,
  });

  const truncado = andamentos.length > LIMITE_EXPORT_MAXIMO;
  return { data: truncado ? andamentos.slice(0, LIMITE_EXPORT_MAXIMO) : andamentos, truncado };
}
