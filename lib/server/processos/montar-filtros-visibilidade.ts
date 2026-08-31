import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { obterGrupoAtivoIdSimples } from '@/lib/server/shared/grupo-processo';
import { usuarioTemPermissao } from '@/lib/server/auth/resolver-permissoes';

export interface VisibilidadeConsulta {
  semAcesso: boolean;
  filtros: Prisma.processoWhereInput[];
}

/** Porte de ProcessosService.montarFiltrosVisibilidadeConsulta. */
export async function montarFiltrosVisibilidadeConsulta(usuarioId?: string): Promise<VisibilidadeConsulta> {
  if (!usuarioId) return { semAcesso: false, filtros: [] };

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { unidade_id: true, dev: true },
  });

  if (!usuario) return { semAcesso: true, filtros: [] };

  if (usuario.dev) return { semAcesso: false, filtros: [] };

  const grupoAtivoId = await obterGrupoAtivoIdSimples(usuarioId);
  if (!grupoAtivoId) return { semAcesso: true, filtros: [] };

  const [podeVisualizarGrupo, podeVisualizarProprios] = await Promise.all([
    usuarioTemPermissao(usuarioId, 'processo.visualizar_grupo', grupoAtivoId),
    usuarioTemPermissao(usuarioId, 'processo.visualizar_proprios', grupoAtivoId),
  ]);

  if (!podeVisualizarGrupo && !podeVisualizarProprios) return { semAcesso: true, filtros: [] };

  const filtrosGrupo: Prisma.processoWhereInput[] = [];

  if (podeVisualizarGrupo) {
    filtrosGrupo.push({ grupo_id: grupoAtivoId });
  }

  if (podeVisualizarProprios) {
    filtrosGrupo.push({
      AND: [{ usuario_atribuido_id: usuarioId }, { grupo_id: grupoAtivoId }],
    });
  }

  if (filtrosGrupo.length === 0) return { semAcesso: true, filtros: [] };

  return { semAcesso: false, filtros: [{ OR: filtrosGrupo }] };
}
