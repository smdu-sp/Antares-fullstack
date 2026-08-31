import { obterGrupoAtivoIdSimples } from '@/lib/server/shared/grupo-processo';
import { usuarioPodeNaEntidade } from '@/lib/server/auth/resolver-permissoes';

type ProcessoComGrupo = {
  usuario_atribuido_id?: string | null;
  grupo_id: string;
};

/** Porte de ProcessosService.usuarioTemPermissaoGrupoNoProcesso. */
export async function usuarioTemPermissaoGrupoNoProcesso(
  usuarioId: string,
  processo: ProcessoComGrupo,
  acao: 'visualizar' | 'modificar' | 'excluir',
): Promise<boolean> {
  const grupoAtivoId = await obterGrupoAtivoIdSimples(usuarioId);
  if (!grupoAtivoId) return false;

  if (processo.grupo_id !== grupoAtivoId) return false;

  const isProprio = processo.usuario_atribuido_id === usuarioId;

  return usuarioPodeNaEntidade(usuarioId, 'processo', acao, grupoAtivoId, isProprio);
}
