import { StatusAndamento, TipoAcao } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { criar as criarLog } from '@/lib/server/logs/criar';
import type { CreateAndamentoInput } from '@/lib/server/validation/andamentos.schema';
import { ANDAMENTO_INCLUDE_PADRAO } from './andamento-include';
import { recalcularPrazoEfetivo } from '@/lib/server/processos/recalcular-prazo-efetivo';

/** Porte de AndamentosService.criar (Antares-backend/src/andamentos/andamentos.service.ts). */
export async function criar(dados: CreateAndamentoInput, usuario_id: string) {
  const processo = await prisma.processo.findUnique({ where: { id: dados.processo_id } });
  if (!processo) throw new HttpError(404, 'Processo não encontrado.');

  const usuario = await prisma.usuario.findUnique({ where: { id: usuario_id } });
  if (!usuario) throw new HttpError(404, 'Usuário não encontrado.');

  const prazo = dados.prazo ? new Date(dados.prazo) : null;
  const data_envio = dados.data_envio ? new Date(dados.data_envio) : null;

  const andamento = await prisma.andamento.create({
    data: {
      processo_id: dados.processo_id,
      origem: dados.origem,
      destino: dados.destino,
      data_envio,
      prazo,
      status: dados.status || StatusAndamento.EM_ANDAMENTO,
      observacao: dados.observacao,
      assunto: dados.assunto,
      usuario_id,
    },
    include: ANDAMENTO_INCLUDE_PADRAO,
  });

  await criarLog(
    TipoAcao.ANDAMENTO_CRIADO,
    `Andamento criado: ${andamento.origem} → ${andamento.destino}${andamento.prazo ? ` (Prazo: ${new Date(andamento.prazo).toLocaleDateString('pt-BR')})` : ''}`,
    'andamento',
    andamento.id,
    usuario_id,
    null,
    { origem: andamento.origem, destino: andamento.destino, prazo: andamento.prazo, processo_id: andamento.processo_id },
  );

  await recalcularPrazoEfetivo(andamento.processo_id);

  return andamento;
}
