import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { obterGrupoAtivoIdSimples, usuarioTemVisualizacaoGabinete } from '@/lib/server/shared/grupo-processo';

/**
 * Porte de AndamentosService.usuarioTemPermissaoNoProcesso — só o papel real de grupo.
 * O bypass de DEV é responsabilidade da chamadora, garantirPermissaoProcesso().
 */
export async function usuarioTemPermissaoNoProcesso(
  usuarioId: string,
  processoId: string,
  acao: 'visualizar' | 'modificar' | 'excluir',
): Promise<boolean> {
  const grupoAtivoId = await obterGrupoAtivoIdSimples(usuarioId);
  if (!grupoAtivoId) return false;

  const processo = await prisma.processo.findUnique({
    where: { id: processoId },
    select: {
      usuario_atribuido_id: true,
      grupos: { where: { ativo: true }, select: { grupo: { select: { id: true } } } },
    },
  });

  if (!processo) return false;

  const grupoIds = processo.grupos.map((item) => item.grupo.id);
  if (grupoIds.length === 0) return false;
  if (!grupoIds.includes(grupoAtivoId)) return false;

  const permissoes = await prisma.usuarioGrupoPermissao.findMany({
    where: {
      ativo: true,
      usuarioGrupo: { ativo: true, usuario_id: usuarioId, grupo_id: grupoAtivoId, grupo: { ativo: true } },
    },
    select: {
      visualizar_grupo: true,
      visualizar_proprios: true,
      modificar_grupo: true,
      modificar_proprios: true,
      excluir: true,
    },
  });

  if (permissoes.length === 0) return false;

  const isProprio = processo.usuario_atribuido_id === usuarioId;

  if (acao === 'excluir') return permissoes.some((item) => item.excluir);
  if (acao === 'modificar') {
    return permissoes.some((item) => item.modificar_grupo || (item.modificar_proprios && isProprio));
  }
  return permissoes.some((item) => item.visualizar_grupo || (item.visualizar_proprios && isProprio));
}

/**
 * Porte de AndamentosService.garantirPermissaoProcesso, com uma correção: o original só
 * verificava `usuarioEhMasterGlobal` (nenhuma checagem direta de permissão de sistema) —
 * simplificação decidida pela usuária (2026-08-14) exige checar `DEV` explicitamente aqui,
 * já que o bypass do grupo GLOBAL foi removido.
 */
export async function garantirPermissaoProcesso(
  usuarioId: string,
  processoId: string,
  acao: 'visualizar' | 'modificar' | 'excluir',
): Promise<void> {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { permissao: true } });
  if (usuario?.permissao === 'DEV') return;
  if (await usuarioTemVisualizacaoGabinete(usuarioId)) return;
  if (await usuarioTemPermissaoNoProcesso(usuarioId, processoId, acao)) return;

  throw new HttpError(403, 'Você não tem permissão de grupo para acessar este processo.');
}
