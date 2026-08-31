import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { obterGrupoAtivoIdSimples } from '@/lib/server/shared/grupo-processo';
import { usuarioTemPermissao } from '@/lib/server/auth/resolver-permissoes';

export interface VisibilidadeAndamentos {
  semAcesso: boolean;
  filtros: Prisma.andamentoWhereInput[];
}

/** Porte de AndamentosService.montarFiltrosVisibilidadeAndamentos. */
export async function montarFiltrosVisibilidadeAndamentos(usuarioId?: string): Promise<VisibilidadeAndamentos> {
  if (!usuarioId) return { semAcesso: false, filtros: [] };

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { unidade_id: true, dev: true },
  });

  if (!usuario) return { semAcesso: true, filtros: [] };
  if (usuario.dev) return { semAcesso: false, filtros: [] };

  const grupoAtivoId = await obterGrupoAtivoIdSimples(usuarioId);
  if (!grupoAtivoId) return { semAcesso: true, filtros: [] };

  // Visibilidade de andamento é herdada do processo ao qual ele pertence (mesma
  // regra usada em usuarioTemPermissaoNoProcesso) — não existe permissão própria
  // de "andamento.visualizar_*" em nível de registro, só a coarse gate de rota.
  const [podeVisualizarGrupo, podeVisualizarProprios] = await Promise.all([
    usuarioTemPermissao(usuarioId, 'processo.visualizar_grupo', grupoAtivoId),
    usuarioTemPermissao(usuarioId, 'processo.visualizar_proprios', grupoAtivoId),
  ]);

  if (!podeVisualizarGrupo && !podeVisualizarProprios) return { semAcesso: true, filtros: [] };

  const filtrosGrupo: Prisma.andamentoWhereInput[] = [];

  if (podeVisualizarGrupo) {
    filtrosGrupo.push({ processo: { grupo_id: grupoAtivoId } });
  }

  if (podeVisualizarProprios) {
    filtrosGrupo.push({
      AND: [
        { processo: { usuario_atribuido_id: usuarioId } },
        { processo: { grupo_id: grupoAtivoId } },
      ],
    });
  }

  if (filtrosGrupo.length === 0) return { semAcesso: true, filtros: [] };

  return { semAcesso: false, filtros: [{ OR: filtrosGrupo }] };
}
