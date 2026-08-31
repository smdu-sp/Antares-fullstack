import { Prisma, TipoAcao } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { criar as criarLog } from '@/lib/server/logs/criar';
import type { UpdateProcessoInput } from '@/lib/server/validation/processos.schema';
import { buscarPorId } from './buscar-por-id';
import { usuarioTemPermissaoGrupoNoProcesso } from './usuario-tem-permissao-grupo';
import { mapProcessoToResponseDto } from './map-processo-response';

/** Porte de ProcessosService.atualizar (Antares-backend/src/processos/processos.service.ts). */
export async function atualizar(id: string, dados: UpdateProcessoInput, usuario_id: string) {
  const processoExistente = await buscarPorId(id, usuario_id);

  const usuarioAtual = await prisma.usuario.findUnique({ where: { id: usuario_id }, select: { dev: true } });

  const processoPermissao = await prisma.processo.findUnique({
    where: { id },
    select: {
      usuario_atribuido_id: true,
      grupo_id: true,
    },
  });

  const temPermissaoGrupoModificar =
    processoPermissao && usuarioAtual
      ? await usuarioTemPermissaoGrupoNoProcesso(usuario_id, processoPermissao, 'modificar')
      : false;

  if (usuarioAtual && !usuarioAtual.dev && !temPermissaoGrupoModificar) {
    throw new HttpError(403, 'Você não tem permissão de grupo para editar este processo.');
  }

  if (dados.numero_sei && dados.numero_sei !== processoExistente.numero_sei) {
    // Só bloqueia duplicata dentro do mesmo grupo — o mesmo numero_sei pode
    // existir em cópias independentes de outros grupos (ver criar.ts).
    const processoComMesmoSei = await prisma.processo.findFirst({
      where: { numero_sei: dados.numero_sei, grupo_id: processoExistente.grupo_id },
    });
    if (processoComMesmoSei) throw new HttpError(400, 'Já existe outro processo com este número SEI neste grupo.');
  }

  let interessadoId: string | null = null;
  let unidadeRemetenteId: string | null = null;
  let unidadeDestinoId: string | null = null;

  if (dados.interessado_id) {
    const interessadoExistente = await prisma.interessado.findUnique({
      where: { id: dados.interessado_id, ativo: true },
    });
    if (!interessadoExistente) throw new HttpError(400, 'Interessado não encontrado.');
    interessadoId = dados.interessado_id;
  }

  if (dados.interessado && dados.interessado.trim() !== '') {
    let interessado = await prisma.interessado.findFirst({
      where: { valor: dados.interessado.trim(), ativo: true },
    });
    if (!interessado) {
      interessado = await prisma.interessado.create({ data: { valor: dados.interessado.trim() } });
    }
    interessadoId = interessado.id;
  }

  if (dados.unidade_remetente_id) {
    const unidadeExistente = await prisma.unidade.findUnique({ where: { id: dados.unidade_remetente_id } });
    if (!unidadeExistente) throw new HttpError(400, 'Unidade remetente não encontrada.');
    unidadeRemetenteId = dados.unidade_remetente_id;
  }

  if (dados.unidade_remetente && dados.unidade_remetente.trim() !== '') {
    const unidade = await prisma.unidade.findFirst({
      where: {
        OR: [{ nome: dados.unidade_remetente.trim() }, { sigla: dados.unidade_remetente.trim() }],
        ativo: true,
      },
    });
    if (unidade) {
      unidadeRemetenteId = unidade.id;
    } else {
      throw new HttpError(400, `Unidade remetente "${dados.unidade_remetente}" não encontrada.`);
    }
  }

  if (dados.unidade_destino_id) {
    const unidadeExistente = await prisma.unidade.findUnique({ where: { id: dados.unidade_destino_id } });
    if (!unidadeExistente) throw new HttpError(400, 'Unidade destinatária não encontrada.');
    unidadeDestinoId = dados.unidade_destino_id;
  }

  if (dados.unidade_destino && dados.unidade_destino.trim() !== '') {
    const unidade = await prisma.unidade.findFirst({
      where: {
        OR: [{ nome: dados.unidade_destino.trim() }, { sigla: dados.unidade_destino.trim() }],
        ativo: true,
      },
    });
    if (unidade) {
      unidadeDestinoId = unidade.id;
    } else {
      throw new HttpError(400, `Unidade destinatária "${dados.unidade_destino}" não encontrada.`);
    }
  }

  const dadosAtualizacao: Prisma.processoUncheckedUpdateInput = {
    numero_sei: dados.numero_sei,
    assunto: dados.assunto,
    origem: dados.origem,
    data_recebimento: dados.data_recebimento ? new Date(dados.data_recebimento) : undefined,
    data_envio_unidade: dados.data_envio_unidade ? new Date(dados.data_envio_unidade) : undefined,
    prazo: dados.prazo ? new Date(dados.prazo) : undefined,
    prorrogacao: dados.data_prorrogacao ? new Date(dados.data_prorrogacao) : undefined,
    resposta_final: dados.resposta_final,
    data_resposta_final: dados.data_resposta_final ? new Date(dados.data_resposta_final) : undefined,
  };

  if (interessadoId !== null) {
    dadosAtualizacao.interessado_id = interessadoId;
  }
  if (unidadeRemetenteId !== null) {
    dadosAtualizacao.unidade_remetente_id = unidadeRemetenteId;
  }
  if (unidadeDestinoId !== null) {
    dadosAtualizacao.unidade_destino_id = unidadeDestinoId;
  }

  if (dados.usuario_atribuido_id !== undefined) {
    if (dados.usuario_atribuido_id) {
      const usuarioAtribuido = await prisma.usuario.findUnique({
        where: { id: dados.usuario_atribuido_id },
        select: { id: true, status: true },
      });
      if (!usuarioAtribuido || !usuarioAtribuido.status) {
        throw new HttpError(400, 'Usuário atribuído inválido ou inativo.');
      }
    }

    dadosAtualizacao.usuario_atribuido_id = dados.usuario_atribuido_id || null;
  }

  const processoAtualizado = await prisma.processo.update({
    where: { id },
    data: dadosAtualizacao,
    include: {
      andamentos: {
        where: { ativo: true },
        orderBy: { criadoEm: 'desc' },
        include: {
          usuario: { select: { id: true, nome: true, nomeSocial: true, login: true, email: true } },
          usuarioProrrogacao: { select: { id: true, nome: true, nomeSocial: true, login: true, email: true } },
        },
      },
    },
  });

  await criarLog(
    TipoAcao.PROCESSO_ATUALIZADO,
    `Processo atualizado: ${processoAtualizado.numero_sei} - ${processoAtualizado.assunto}`,
    'processo',
    processoAtualizado.id,
    usuario_id,
    { numero_sei: processoExistente.numero_sei, assunto: processoExistente.assunto },
    { numero_sei: processoAtualizado.numero_sei, assunto: processoAtualizado.assunto },
  );

  return mapProcessoToResponseDto(processoAtualizado);
}
