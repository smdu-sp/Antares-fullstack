import { TipoAcao } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { criar as criarLog } from '@/lib/server/logs/criar';
import type { CreateProcessoInput } from '@/lib/server/validation/processos.schema';
import { obterGrupoAtivoIdSimples } from '@/lib/server/shared/grupo-processo';
import { mapProcessoToResponseDto } from './map-processo-response';
import { resolverInteressadoPorTexto, resolverUnidadeGrupoPorTexto } from './resolver-vinculos-texto';

/** Porte de ProcessosService.criar (Antares-backend/src/processos/processos.service.ts). */
export async function criar(dados: CreateProcessoInput, usuario_id: string) {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuario_id }, select: { unidade_id: true } });
  if (!usuario || !usuario.unidade_id) throw new HttpError(400, 'Usuário não possui unidade atribuída.');

  if (dados.usuario_atribuido_id && dados.usuario_atribuido_id !== usuario_id) {
    throw new HttpError(400, 'Owner do processo deve ser o usuario criador.');
  }

  const grupoAtivoId = await obterGrupoAtivoIdSimples(usuario_id);
  if (!grupoAtivoId) {
    throw new HttpError(400, 'Usuario criador nao possui grupo ativo para vincular o processo.');
  }

  let numeroSei = dados.numero_sei;
  if (!numeroSei) {
    numeroSei = `DRAFT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Vínculo automático por grupo: um numero_sei que já existe em OUTRO grupo não
  // bloqueia mais — cada grupo tem sua própria cópia independente do processo
  // (mesmo numero_sei, linha própria; nenhum dado é copiado de um grupo pro
  // outro). Só bloqueia duplicata dentro do MESMO grupo.
  const processoExistente = await prisma.processo.findFirst({
    where: { numero_sei: numeroSei, grupo_id: grupoAtivoId },
  });
  if (processoExistente) throw new HttpError(400, 'Já existe um processo com este número SEI neste grupo.');

  // Cada campo aceita id (já resolvido, ex.: escolhido de uma lista) OU texto
  // livre (sem sugestão/dropdown na grid — achar ou criar acontece aqui).
  let interessadoId = dados.interessado_id || null;
  if (interessadoId) {
    // Escopado ao grupo ativo — interessado é por-grupo (Interessado.grupo_id).
    const interessado = await prisma.interessado.findUnique({
      where: { id: interessadoId, ativo: true, grupo_id: grupoAtivoId },
    });
    if (!interessado) throw new HttpError(400, 'Interessado não encontrado.');
  } else if (dados.interessado && dados.interessado.trim() !== '') {
    interessadoId = await resolverInteressadoPorTexto(dados.interessado, grupoAtivoId);
  }

  let unidadeDestinoId = dados.unidade_destino_id || null;
  if (unidadeDestinoId) {
    const unidadeDestino = await prisma.unidadeGrupo.findUnique({
      where: { id: unidadeDestinoId, grupo_id: grupoAtivoId },
    });
    if (!unidadeDestino) throw new HttpError(400, 'Unidade destinatária não encontrada.');
  } else if (dados.unidade_destino && dados.unidade_destino.trim() !== '') {
    unidadeDestinoId = await resolverUnidadeGrupoPorTexto(dados.unidade_destino, grupoAtivoId);
  }

  if (dados.origem && dados.origem.trim() !== '') {
    await prisma.origemProcesso.upsert({
      where: { valor: dados.origem.trim() },
      update: {},
      create: { valor: dados.origem.trim() },
    });
  }

  const processo = await prisma.processo.create({
    data: {
      numero_sei: numeroSei,
      assunto: dados.assunto || 'Assunto a ser definido',
      origem: dados.origem || 'EXPEDIENTE',
      interessado_id: interessadoId,
      unidade_destino_id: unidadeDestinoId,
      data_recebimento: dados.data_recebimento ? new Date(dados.data_recebimento) : undefined,
      data_envio_unidade: dados.data_envio_unidade ? new Date(dados.data_envio_unidade) : undefined,
      prazo: dados.prazo ? new Date(dados.prazo) : undefined,
      prorrogacao: dados.data_prorrogacao ? new Date(dados.data_prorrogacao) : undefined,
      usuario_atribuido_id: usuario_id,
      unidade_id: usuario.unidade_id,
      grupo_id: grupoAtivoId,
    },
  });

  await criarLog(
    TipoAcao.PROCESSO_CRIADO,
    `Processo criado: ${processo.numero_sei} - ${processo.assunto}`,
    'processo',
    processo.id,
    usuario_id,
    null,
    { numero_sei: processo.numero_sei, assunto: processo.assunto },
  );

  return mapProcessoToResponseDto(processo);
}
