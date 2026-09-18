import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import type { CreateUnidadeGrupoInput } from '@/lib/server/validation/unidades-grupo.schema';
import { obterGrupoAtivoIdSimples } from '@/lib/server/shared/grupo-processo';

/**
 * Espelha lib/server/unidades/criar.ts, mas pra UnidadeGrupo (unidade
 * remetente/destino de processo) — única POR GRUPO, não no sistema inteiro.
 * Não confundir com `Unidade` (catálogo global usado só no cadastro de
 * usuário), que continua com suas próprias funções em lib/server/unidades/.
 */
export async function criar(dados: CreateUnidadeGrupoInput, usuarioId: string) {
  const grupoAtivoId = await obterGrupoAtivoIdSimples(usuarioId);
  if (!grupoAtivoId) throw new HttpError(400, 'Usuário não possui grupo ativo para cadastrar unidade.');

  const unidadeComMesmoNome = await prisma.unidadeGrupo.findFirst({
    where: { nome: dados.nome, grupo_id: grupoAtivoId },
  });
  if (unidadeComMesmoNome) throw new HttpError(400, 'Já existe uma unidade com este nome.');

  const sigla = dados.sigla.toUpperCase();
  const unidadeComMesmaSigla = await prisma.unidadeGrupo.findFirst({
    where: { sigla, grupo_id: grupoAtivoId },
  });
  if (unidadeComMesmaSigla) throw new HttpError(400, 'Já existe uma unidade com esta sigla.');

  return prisma.unidadeGrupo.create({ data: { nome: dados.nome, sigla, grupo_id: grupoAtivoId } });
}
