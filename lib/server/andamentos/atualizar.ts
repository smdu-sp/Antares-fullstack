import { Prisma, StatusAndamento, TipoAcao, type processo } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { criar as criarLog } from '@/lib/server/logs/criar';
import type { UpdateAndamentoInput } from '@/lib/server/validation/andamentos.schema';
import { garantirPermissaoProcesso } from './permissoes';
import { buscarPorId } from './buscar-por-id';
import { ANDAMENTO_INCLUDE_PADRAO } from './andamento-include';
import { recalcularPrazoEfetivo } from '@/lib/server/processos/recalcular-prazo-efetivo';

/** Porte de AndamentosService.atualizar (Antares-backend/src/andamentos/andamentos.service.ts). */
export async function atualizar(id: string, updateAndamentoDto: UpdateAndamentoInput, usuario_id: string) {
  const andamentoAtual = await buscarPorId(id, usuario_id);
  await garantirPermissaoProcesso(usuario_id, andamentoAtual.processo_id, 'modificar');

  // Normaliza payloads inesperados do frontend:
  // - aceita campo `conclusao` como sinônimo de `resposta` (data)
  // - se `resposta` vier como texto não-ISO, tratamos como `observacao`
  const payload: UpdateAndamentoInput & { resposta?: string | null } = { ...updateAndamentoDto };
  if (payload.conclusao !== undefined && payload.conclusao !== null) {
    payload.resposta = payload.conclusao;
  }
  if (payload.resposta !== undefined && payload.resposta !== null) {
    const possibleDate = new Date(payload.resposta);
    if (isNaN(possibleDate.getTime())) {
      if (!payload.observacao) {
        payload.observacao = payload.resposta;
      }
      delete payload.resposta;
    }
  }

  const data: Prisma.andamentoUncheckedUpdateInput = {};

  if (updateAndamentoDto.origem) data.origem = updateAndamentoDto.origem;
  if (updateAndamentoDto.destino) data.destino = updateAndamentoDto.destino;
  if (updateAndamentoDto.data_envio !== undefined) {
    data.data_envio = updateAndamentoDto.data_envio ? new Date(updateAndamentoDto.data_envio) : null;
  }
  if (updateAndamentoDto.prazo) data.prazo = new Date(updateAndamentoDto.prazo);
  if (payload.observacao !== undefined) data.observacao = payload.observacao;
  if (updateAndamentoDto.assunto !== undefined) data.assunto = updateAndamentoDto.assunto;

  if (payload.prorrogacao !== undefined) {
    if (payload.prorrogacao === null) {
      data.prorrogacao = null;
      data.usuario_prorrogacao_id = null;
      if (!payload.resposta) {
        data.status = StatusAndamento.EM_ANDAMENTO;
      }
    } else {
      data.prorrogacao = new Date(payload.prorrogacao);
      data.usuario_prorrogacao_id = usuario_id;
      if (!payload.resposta) {
        data.status = StatusAndamento.PRORROGADO;
      }
    }
  }

  let respostaDate: Date | undefined;
  if (payload.resposta !== undefined) {
    if (payload.resposta === null) {
      data.resposta = null;
      if (!payload.prorrogacao) {
        data.status = StatusAndamento.EM_ANDAMENTO;
      }
    } else {
      const parsedResposta = new Date(payload.resposta);
      if (isNaN(parsedResposta.getTime())) {
        throw new HttpError(400, 'Campo `resposta` deve ser uma data válida em formato ISO 8601.');
      }
      respostaDate = parsedResposta;
      data.resposta = parsedResposta;
      data.status = StatusAndamento.CONCLUIDO;
    }
  }

  const andamentoAntigo = await prisma.andamento.findUnique({ where: { id } });
  if (!andamentoAntigo) throw new HttpError(404, 'Andamento não encontrado.');

  let andamentoAtualizado;
  let processoAtualizado: processo | null = null;
  let processoPreUpdate: { data_resposta_final: Date | null; resposta_final: string | null } | null = null;

  const isRespostaSet = payload.resposta !== undefined && payload.resposta !== null;

  if (isRespostaSet && respostaDate) {
    processoPreUpdate = await prisma.processo.findUnique({
      where: { id: andamentoAntigo.processo_id },
      select: { data_resposta_final: true, resposta_final: true },
    });

    const processoUpdateData: Prisma.processoUpdateInput = {};
    if (!processoPreUpdate?.data_resposta_final) {
      processoUpdateData.data_resposta_final = respostaDate;
    }
    if (!processoPreUpdate?.resposta_final && payload.observacao) {
      processoUpdateData.resposta_final = payload.observacao;
    }
    if (Object.keys(processoUpdateData).length > 0) {
      processoUpdateData.unidade_respondida_id = andamentoAntigo.destino;
    }

    if (Object.keys(processoUpdateData).length > 0) {
      const [andamentoResult, processoResult] = await prisma.$transaction([
        prisma.andamento.update({ where: { id }, data, include: ANDAMENTO_INCLUDE_PADRAO }),
        prisma.processo.update({ where: { id: andamentoAntigo.processo_id }, data: processoUpdateData }),
      ]);
      andamentoAtualizado = andamentoResult;
      processoAtualizado = processoResult;
    } else {
      const [andamentoResult] = await prisma.$transaction([
        prisma.andamento.update({ where: { id }, data, include: ANDAMENTO_INCLUDE_PADRAO }),
      ]);
      andamentoAtualizado = andamentoResult;
    }
  } else {
    andamentoAtualizado = await prisma.andamento.update({ where: { id }, data, include: ANDAMENTO_INCLUDE_PADRAO });
  }

  let tipoAcao: TipoAcao = TipoAcao.ANDAMENTO_ATUALIZADO;
  let descricao = `Andamento atualizado: ${andamentoAtualizado.origem} → ${andamentoAtualizado.destino}`;

  if (payload.prorrogacao !== undefined && payload.prorrogacao !== null) {
    tipoAcao = TipoAcao.ANDAMENTO_PRORROGADO;
    descricao = `Andamento prorrogado: ${andamentoAtualizado.origem} → ${andamentoAtualizado.destino} (Nova data: ${new Date(andamentoAtualizado.prorrogacao as Date).toLocaleDateString('pt-BR')})`;
  } else if (payload.resposta !== undefined && payload.resposta !== null) {
    tipoAcao = TipoAcao.ANDAMENTO_CONCLUIDO;
    descricao = `Andamento concluído: ${andamentoAtualizado.origem} → ${andamentoAtualizado.destino}`;
  }

  await criarLog(
    tipoAcao,
    descricao,
    'andamento',
    andamentoAtualizado.id,
    usuario_id,
    {
      origem: andamentoAntigo.origem,
      destino: andamentoAntigo.destino,
      prazo: andamentoAntigo.prazo,
      prorrogacao: andamentoAntigo.prorrogacao,
      resposta: andamentoAntigo.resposta,
      status: andamentoAntigo.status,
    },
    {
      origem: andamentoAtualizado.origem,
      destino: andamentoAtualizado.destino,
      prazo: andamentoAtualizado.prazo,
      prorrogacao: andamentoAtualizado.prorrogacao,
      resposta: andamentoAtualizado.resposta,
      status: andamentoAtualizado.status,
    },
  );

  if (processoAtualizado) {
    await criarLog(
      TipoAcao.PROCESSO_ATUALIZADO,
      `Processo atualizado por conclusão de andamento: ${processoAtualizado.numero_sei || processoAtualizado.id}`,
      'processo',
      processoAtualizado.id,
      usuario_id,
      processoPreUpdate
        ? { data_resposta_final: processoPreUpdate.data_resposta_final, resposta_final: processoPreUpdate.resposta_final }
        : null,
      {
        data_resposta_final: processoAtualizado.data_resposta_final,
        resposta_final: processoAtualizado.resposta_final,
        unidade_respondida_id: processoAtualizado.unidade_respondida_id,
      },
    );
  }

  await recalcularPrazoEfetivo(andamentoAntigo.processo_id);

  return andamentoAtualizado;
}
