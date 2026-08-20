import { StatusAndamento, TipoAcao } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { criar as criarLog } from '@/lib/server/logs/criar';
import type { CreateRespostaFinalInput } from '@/lib/server/validation/processos.schema';
import { mapProcessoToResponseDto } from './map-processo-response';

const ANDAMENTO_INCLUDE = {
  where: { ativo: true as const },
  orderBy: { criadoEm: 'desc' as const },
  include: {
    usuario: { select: { id: true, nome: true, nomeSocial: true, login: true, email: true } },
    usuarioProrrogacao: { select: { id: true, nome: true, nomeSocial: true, login: true, email: true } },
  },
};

/** Porte de ProcessosService.criarRespostaFinal (Antares-backend/src/processos/processos.service.ts). */
export async function criarRespostaFinal(dados: CreateRespostaFinalInput, usuario_id: string) {
  const { processo_id, data_resposta_final, resposta_final, unidade_respondida_id: _ } = dados;

  const processoExistente = await prisma.processo.findUnique({
    where: { id: processo_id },
    select: {
      id: true,
      origem: true,
      ativo: true,
      numero_sei: true,
      data_resposta_final: true,
      resposta_final: true,
      unidade_respondida_id: true,
      andamentos: { where: { ativo: true }, select: { origem: true, destino: true } },
    },
  });

  if (!processoExistente) throw new HttpError(404, 'Processo não encontrado.');
  if (!processoExistente.ativo) throw new HttpError(400, 'Processo está inativo.');

  if (processoExistente.andamentos.length === 0) {
    throw new HttpError(
      400,
      'O processo deve ter pelo menos um andamento cadastrado antes de criar resposta final.',
    );
  }

  const dataResposta = new Date(data_resposta_final);
  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999);

  if (dataResposta > hoje) throw new HttpError(400, 'A data de resposta final não pode ser futura.');

  const unidadeRespondida = processoExistente.origem;

  if (
    processoExistente.data_resposta_final &&
    processoExistente.resposta_final === resposta_final &&
    new Date(processoExistente.data_resposta_final).getTime() === dataResposta.getTime()
  ) {
    const processoAtualizado = await prisma.processo.findUnique({
      where: { id: processo_id },
      include: { andamentos: ANDAMENTO_INCLUDE },
    });
    return mapProcessoToResponseDto(processoAtualizado!);
  }

  const conclusaoExistente = await prisma.andamento.findFirst({
    where: {
      processo_id,
      status: StatusAndamento.CONCLUIDO,
      ativo: true,
      observacao: resposta_final,
      data_envio: dataResposta,
    },
  });

  if (conclusaoExistente) {
    if (!processoExistente.data_resposta_final || !processoExistente.resposta_final) {
      await prisma.processo.update({
        where: { id: processo_id },
        data: { data_resposta_final: dataResposta, resposta_final, unidade_respondida_id: unidadeRespondida },
      });
    }

    const processoAtualizado = await prisma.processo.findUnique({
      where: { id: processo_id },
      include: { andamentos: ANDAMENTO_INCLUDE },
    });
    return mapProcessoToResponseDto(processoAtualizado!);
  }

  const [updatedProcesso] = await prisma.$transaction([
    prisma.processo.update({
      where: { id: processo_id },
      data: { data_resposta_final: dataResposta, resposta_final, unidade_respondida_id: unidadeRespondida },
    }),
  ]);

  await prisma.andamento.create({
    data: {
      processo_id,
      origem: unidadeRespondida,
      destino: unidadeRespondida,
      data_envio: dataResposta,
      prazo: dataResposta,
      status: StatusAndamento.CONCLUIDO,
      observacao: resposta_final,
      usuario_id,
    },
    include: { usuario: true },
  });

  const processoAtualizado = await prisma.processo.findUnique({
    where: { id: processo_id },
    include: { andamentos: ANDAMENTO_INCLUDE },
  });

  await criarLog(
    TipoAcao.PROCESSO_ATUALIZADO,
    `Resposta final criada para processo: ${updatedProcesso.numero_sei || updatedProcesso.id} - Unidade respondida: ${unidadeRespondida}`,
    'processo',
    updatedProcesso.id,
    usuario_id,
    {
      data_resposta_final: processoExistente.data_resposta_final,
      resposta_final: processoExistente.resposta_final,
      unidade_respondida_id: processoExistente.unidade_respondida_id,
    },
    {
      data_resposta_final: updatedProcesso.data_resposta_final,
      resposta_final: updatedProcesso.resposta_final,
      unidade_respondida_id: updatedProcesso.unidade_respondida_id,
    },
  );

  return mapProcessoToResponseDto(processoAtualizado!);
}
