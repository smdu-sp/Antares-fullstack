import { StatusAndamento } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Recalcula e persiste `processo.prazo_efetivo`/`processo.andamentos_todos_concluidos`,
 * os campos usados pelos filtros vencendoHoje/atrasados/concluidos de
 * ProcessosService.buscarTudo. Chamar sempre que um andamento do processo for criado,
 * atualizado ou removido (ver lib/server/andamentos/{criar,atualizar,remover}.ts).
 *
 * `prazo_efetivo` é o MENOR prazo (prorrogacao ?? prazo) entre todos os andamentos ainda
 * ABERTOS (EM_ANDAMENTO ou PRORROGADO), ou nulo se não houver nenhum aberto. Versões
 * anteriores tentaram usar só o andamento MAIS RECENTE — mas aí um andamento antigo, ainda
 * aberto e com prazo válido, ficava invisível nos filtros sempre que o andamento mais novo
 * já estivesse concluído (ou sem prazo). A versão anterior a essa usava o MENOR prazo entre
 * TODOS os andamentos ativos, mas desqualificava o processo inteiro (prazo_efetivo = null)
 * se QUALQUER andamento (mesmo um antigo, já concluído) estivesse concluído — esse `.some()`
 * é o bug real: concluir um andamento velho apagava o prazo de um outro andamento ainda em
 * aberto. Aqui: só olha status por andamento (abre ou não conta), nunca "qualquer concluído
 * apaga tudo".
 */
export async function recalcularPrazoEfetivo(processoId: string): Promise<void> {
  const andamentosAtivos = await prisma.andamento.findMany({
    where: { processo_id: processoId, ativo: true },
    select: { status: true, prazo: true, prorrogacao: true },
  });

  const andamentosTodosConcluidos =
    andamentosAtivos.length > 0 && andamentosAtivos.every((a) => a.status === StatusAndamento.CONCLUIDO);

  const prazosAbertos = andamentosAtivos
    .filter((a) => a.status === StatusAndamento.EM_ANDAMENTO || a.status === StatusAndamento.PRORROGADO)
    .map((a) => a.prorrogacao ?? a.prazo)
    .filter((d): d is Date => d !== null);

  const prazoEfetivo =
    prazosAbertos.length > 0 ? new Date(Math.min(...prazosAbertos.map((d) => d.getTime()))) : null;

  await prisma.processo.update({
    where: { id: processoId },
    data: { prazo_efetivo: prazoEfetivo, andamentos_todos_concluidos: andamentosTodosConcluidos },
  });
}
