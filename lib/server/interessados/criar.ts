import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import type { CreateInteressadoInput } from '@/lib/server/validation/interessados.schema';
import { obterGrupoAtivoIdSimples } from '@/lib/server/shared/grupo-processo';
import { hashValorInteressado } from './hash-valor';

/**
 * Porte de InteressadosService.criar (Antares-backend/src/interessados/interessados.service.ts),
 * com uma correção: `valor` tem índice único no banco independente de `ativo`, então criar um
 * interessado com o mesmo nome de um já removido (soft-delete) sempre derrubava com erro de
 * constraint única não tratado (o backend original tinha o mesmo bug). Em vez de deixar isso
 * quebrar, reativa o registro inativo existente.
 *
 * Único POR GRUPO (não mais no sistema inteiro): o mesmo nome pode existir em grupos diferentes
 * como cadastros independentes — mesmo princípio de processo.grupo_id.
 */
export async function criar(dados: CreateInteressadoInput, usuarioId: string) {
  const grupoAtivoId = await obterGrupoAtivoIdSimples(usuarioId);
  if (!grupoAtivoId) throw new HttpError(400, 'Usuário não possui grupo ativo para cadastrar interessado.');

  const valor = dados.valor.trim();

  const interessadoAtivo = await prisma.interessado.findFirst({ where: { valor, grupo_id: grupoAtivoId, ativo: true } });
  if (interessadoAtivo) throw new HttpError(400, 'Já existe um interessado com este nome.');

  const interessadoInativo = await prisma.interessado.findFirst({ where: { valor, grupo_id: grupoAtivoId, ativo: false } });
  if (interessadoInativo) {
    const reativado = await prisma.interessado.update({
      where: { id: interessadoInativo.id },
      data: { ativo: true },
    });
    return { id: reativado.id, valor: reativado.valor, criadoEm: reativado.criadoEm };
  }

  const interessado = await prisma.interessado.create({
    data: { valor, valorHash: hashValorInteressado(valor), grupo_id: grupoAtivoId },
  });

  return { id: interessado.id, valor: interessado.valor, criadoEm: interessado.criadoEm };
}
