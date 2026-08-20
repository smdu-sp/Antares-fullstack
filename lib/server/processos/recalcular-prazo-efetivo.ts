import { StatusAndamento } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Recalcula e persiste `processo.prazo_efetivo`/`processo.andamentos_todos_concluidos`.
 * Replica exatamente a regra que ProcessosService.buscarTudo usa nos filtros
 * vencendoHoje/atrasados/concluidos (baseada no status/prazo/prorrogacao dos andamentos
 * ATIVOS — não no prazo do próprio processo, que é uma noção diferente usada só pelos
 * contadores do dashboard). Chamar sempre que um andamento do processo for criado,
 * atualizado ou removido (ver lib/server/andamentos/{criar,atualizar,remover}.ts).
 */
export async function recalcularPrazoEfetivo(processoId: string): Promise<void> {
  const andamentosAtivos = await prisma.andamento.findMany({
    where: { processo_id: processoId, ativo: true },
    select: { status: true, prazo: true, prorrogacao: true },
  });

  const temConcluido = andamentosAtivos.some((a) => a.status === StatusAndamento.CONCLUIDO);
  const andamentosTodosConcluidos =
    andamentosAtivos.length > 0 && andamentosAtivos.every((a) => a.status === StatusAndamento.CONCLUIDO);

  // Mesma regra do filtro original: se QUALQUER andamento ativo está concluído, o
  // processo fica desqualificado de vencendoHoje/atrasados, mesmo que outro andamento
  // aberto esteja com prazo vencido.
  let prazoEfetivo: Date | null = null;
  if (!temConcluido) {
    const prazos = andamentosAtivos
      .filter((a) => a.status === StatusAndamento.EM_ANDAMENTO || a.status === StatusAndamento.PRORROGADO)
      .map((a) => a.prorrogacao ?? a.prazo)
      .filter((d): d is Date => d !== null);

    if (prazos.length > 0) {
      prazoEfetivo = new Date(Math.min(...prazos.map((d) => d.getTime())));
    }
  }

  await prisma.processo.update({
    where: { id: processoId },
    data: { prazo_efetivo: prazoEfetivo, andamentos_todos_concluidos: andamentosTodosConcluidos },
  });
}
