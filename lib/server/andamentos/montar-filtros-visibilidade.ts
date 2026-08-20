import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { obterGrupoAtivoIdSimples, usuarioTemVisualizacaoGabinete } from '@/lib/server/shared/grupo-processo';

export interface VisibilidadeAndamentos {
  semAcesso: boolean;
  filtros: Prisma.andamentoWhereInput[];
}

/** Porte de AndamentosService.montarFiltrosVisibilidadeAndamentos. */
export async function montarFiltrosVisibilidadeAndamentos(usuarioId?: string): Promise<VisibilidadeAndamentos> {
  if (!usuarioId) return { semAcesso: false, filtros: [] };

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { unidade_id: true, permissao: true },
  });

  if (!usuario) return { semAcesso: true, filtros: [] };
  // Simplificação decidida pela usuária (2026-08-14): só DEV tem bypass de sistema.
  if (usuario.permissao === 'DEV') return { semAcesso: false, filtros: [] };

  const grupoAtivoId = await obterGrupoAtivoIdSimples(usuarioId);
  if (!grupoAtivoId) return { semAcesso: true, filtros: [] };

  if (await usuarioTemVisualizacaoGabinete(usuarioId)) return { semAcesso: false, filtros: [] };

  const permissoesGrupo = await prisma.usuarioGrupoPermissao.findMany({
    where: {
      ativo: true,
      OR: [{ visualizar_grupo: true }, { visualizar_proprios: true }],
      usuarioGrupo: { ativo: true, usuario_id: usuarioId, grupo_id: grupoAtivoId, grupo: { ativo: true } },
    },
    select: {
      visualizar_grupo: true,
      visualizar_proprios: true,
      usuarioGrupo: { select: { grupo_id: true } },
    },
  });

  if (permissoesGrupo.length === 0) return { semAcesso: true, filtros: [] };

  const gruposComVisualizacao = Array.from(
    new Set(
      permissoesGrupo.filter((item) => item.visualizar_grupo).map((item) => item.usuarioGrupo.grupo_id),
    ),
  );

  const podeVisualizarProprios = permissoesGrupo.some((item) => item.visualizar_proprios);

  const filtrosGrupo: Prisma.andamentoWhereInput[] = [];

  if (gruposComVisualizacao.length > 0) {
    filtrosGrupo.push({
      processo: { grupos: { some: { ativo: true, grupo_id: { in: gruposComVisualizacao } } } },
    });
  }

  if (podeVisualizarProprios) {
    filtrosGrupo.push({
      AND: [
        { processo: { usuario_atribuido_id: usuarioId } },
        { processo: { grupos: { some: { ativo: true, grupo_id: grupoAtivoId } } } },
      ],
    });
  }

  if (filtrosGrupo.length === 0) return { semAcesso: true, filtros: [] };

  return { semAcesso: false, filtros: [{ OR: filtrosGrupo }] };
}
