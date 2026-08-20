import { TipoAcao } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { criar as criarLog } from '@/lib/server/logs/criar';
import { buscarPorId } from './buscar-por-id';
import { garantirPermissaoProcesso } from './permissoes';
import { recalcularPrazoEfetivo } from '@/lib/server/processos/recalcular-prazo-efetivo';

/** Porte de AndamentosService.remover (Antares-backend/src/andamentos/andamentos.service.ts). */
export async function remover(id: string, usuario_id: string) {
  const andamento = await buscarPorId(id, usuario_id);
  await garantirPermissaoProcesso(usuario_id, andamento.processo_id, 'excluir');

  await prisma.andamento.update({ where: { id }, data: { ativo: false } });

  await criarLog(
    TipoAcao.ANDAMENTO_REMOVIDO,
    `Andamento removido: ${andamento.origem} → ${andamento.destino}`,
    'andamento',
    id,
    usuario_id,
    { origem: andamento.origem, destino: andamento.destino, prazo: andamento.prazo, processo_id: andamento.processo_id },
    null,
  );

  await recalcularPrazoEfetivo(andamento.processo_id);

  return { removido: true };
}
