import { StatusAndamento } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Recalcula e persiste `processo.prazo_efetivo`/`processo.andamentos_todos_concluidos`,
 * os campos usados pelos filtros vencendoHoje/atrasados/concluidos de
 * ProcessosService.buscarTudo. Chamar sempre que um andamento do processo for criado,
 * atualizado ou removido (ver lib/server/andamentos/{criar,atualizar,remover}.ts).
 *
 * `prazo_efetivo` é guiado pelo andamento MAIS RECENTE (o mesmo que aparece em evidência
 * no processo — ver getUltimoAndamento): (prorrogacao ?? prazo) dele, ou nulo se ele está
 * concluído/sem prazo. Antes era o MENOR prazo entre todos os andamentos abertos, e ficava
 * nulo se QUALQUER andamento (mesmo um antigo) estivesse concluído — então o último prazo
 * inserido não aparecia nos filtros de prazo: ou perdia pra um prazo mais antigo ainda em
 * aberto, ou o processo era desqualificado por um andamento velho já concluído.
 */
export async function recalcularPrazoEfetivo(processoId: string): Promise<void> {
  const andamentosAtivos = await prisma.andamento.findMany({
    where: { processo_id: processoId, ativo: true },
    orderBy: { criadoEm: 'desc' },
    select: { status: true, prazo: true, prorrogacao: true },
  });

  const andamentosTodosConcluidos =
    andamentosAtivos.length > 0 && andamentosAtivos.every((a) => a.status === StatusAndamento.CONCLUIDO);

  const maisRecente = andamentosAtivos[0];
  const prazoEfetivo =
    maisRecente && maisRecente.status !== StatusAndamento.CONCLUIDO
      ? (maisRecente.prorrogacao ?? maisRecente.prazo ?? null)
      : null;

  await prisma.processo.update({
    where: { id: processoId },
    data: { prazo_efetivo: prazoEfetivo, andamentos_todos_concluidos: andamentosTodosConcluidos },
  });
}
