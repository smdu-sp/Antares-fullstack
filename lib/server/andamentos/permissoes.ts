import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { obterGrupoAtivoIdSimples } from '@/lib/server/shared/grupo-processo';
import { usuarioPodeNaEntidade } from '@/lib/server/auth/resolver-permissoes';

/**
 * Porte de AndamentosService.usuarioTemPermissaoNoProcesso — só o papel real de grupo.
 * O bypass de DEV é responsabilidade da chamadora, garantirPermissaoProcesso(). A
 * permissão avaliada é sempre "processo.*": andamentos herdam a visibilidade/edição
 * do processo ao qual pertencem, não têm permissão própria em nível de registro.
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
      grupo_id: true,
    },
  });

  if (!processo) return false;
  if (processo.grupo_id !== grupoAtivoId) return false;

  const isProprio = processo.usuario_atribuido_id === usuarioId;

  return usuarioPodeNaEntidade(usuarioId, 'processo', acao, grupoAtivoId, isProprio);
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
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { dev: true } });
  if (usuario?.dev) return;
  if (await usuarioTemPermissaoNoProcesso(usuarioId, processoId, acao)) return;

  throw new HttpError(403, 'Você não tem permissão de grupo para acessar este processo.');
}
