import { prisma } from '@/lib/prisma';
import { obterGrupoAtivoIdSimples } from '@/lib/server/shared/grupo-processo';

type ProcessoComGrupos = {
  usuario_atribuido_id?: string | null;
  grupos?: { grupo: { id: string } }[];
};

/** Porte de ProcessosService.usuarioTemPermissaoGrupoNoProcesso. */
export async function usuarioTemPermissaoGrupoNoProcesso(
  usuarioId: string,
  processo: ProcessoComGrupos,
  acao: 'visualizar' | 'modificar' | 'excluir',
): Promise<boolean> {
  const grupos = processo.grupos || [];
  if (grupos.length === 0) return false;

  const grupoAtivoId = await obterGrupoAtivoIdSimples(usuarioId);
  if (!grupoAtivoId) return false;

  const grupoIds = grupos.map((item) => item.grupo.id);
  if (!grupoIds.includes(grupoAtivoId)) return false;

  const permissoes = await prisma.usuarioGrupoPermissao.findMany({
    where: {
      ativo: true,
      usuarioGrupo: {
        ativo: true,
        usuario_id: usuarioId,
        grupo_id: { in: [grupoAtivoId] },
        grupo: { ativo: true },
      },
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
