import { GrupoCodigo } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { permissaoConcedida } from '@/lib/server/auth/resolver-permissoes';
import { validarUsuario } from './validadores';

/**
 * Porte de AcessosAdminService.obterMatrizPermissoesEfetivas, adaptado ao modelo de
 * Permissoes (linhas) no lugar das antigas colunas boolean. Carrega tudo em lote
 * (vínculos, permissões escopadas, permissões globais, baselines de grupo) e
 * computa o "efetivo" por linha em memória — evita N+1 queries no painel DEV.
 */
export async function obterMatrizPermissoesEfetivas(usuarioId?: string) {
  if (usuarioId) {
    await validarUsuario(usuarioId);
  }

  const vinculos = await prisma.usuarioGrupo.findMany({
    where: { ativo: true, ...(usuarioId ? { usuario_id: usuarioId } : {}) },
    include: {
      usuario: { select: { id: true, nome: true, login: true, dev: true, status: true } },
      grupo: { select: { id: true, codigo: true, tipo: true, nome: true, ativo: true } },
    },
    orderBy: [{ usuario: { nome: 'asc' } }, { grupo: { codigo: 'asc' } }],
  });

  const usuarioIds = Array.from(new Set(vinculos.map((item) => item.usuario_id)));
  const grupoIds = Array.from(new Set(vinculos.map((item) => item.grupo_id)));

  const [permissoesUsuario, permissoesGrupo] = await Promise.all([
    usuarioIds.length
      ? prisma.usuarioPermissoes.findMany({
          where: { usuario_id: { in: usuarioIds }, ativo: true },
          include: { permissao: { select: { codigo: true } } },
        })
      : Promise.resolve([]),
    grupoIds.length
      ? prisma.grupoPermissoes.findMany({
          where: { grupo_id: { in: grupoIds }, ativo: true },
          include: { permissao: { select: { codigo: true } } },
        })
      : Promise.resolve([]),
  ]);

  function pushToMap(map: Map<string, string[]>, chave: string, valor: string) {
    const lista = map.get(chave);
    if (lista) lista.push(valor);
    else map.set(chave, [valor]);
  }

  const escopadasPorChave = new Map<string, string[]>(); // `${usuario_id}:${grupo_id}`
  const globaisPorUsuario = new Map<string, string[]>();

  for (const item of permissoesUsuario) {
    if (item.grupo_id) {
      pushToMap(escopadasPorChave, `${item.usuario_id}:${item.grupo_id}`, item.permissao.codigo);
    } else {
      pushToMap(globaisPorUsuario, item.usuario_id, item.permissao.codigo);
    }
  }

  const baselinePorChave = new Map<string, string[]>(); // `${grupo_id}:${papel}`
  for (const item of permissoesGrupo) {
    pushToMap(baselinePorChave, `${item.grupo_id}:${item.papel}`, item.permissao.codigo);
  }

  const linhas = vinculos.map((item) => {
    const chave = `${item.usuario_id}:${item.grupo_id}`;
    const opts = {
      escopadas: escopadasPorChave.get(chave) || [],
      globais: globaisPorUsuario.get(item.usuario_id) || [],
      baseline: baselinePorChave.get(`${item.grupo_id}:${item.permissao_grupo}`) || [],
    };

    const permissoesConcedidas = Array.from(new Set([...opts.escopadas, ...opts.globais, ...opts.baseline]));

    const podeVisualizarGrupoGabinete =
      item.grupo.codigo === GrupoCodigo.GABINETE && permissaoConcedida('processo.visualizar_grupo', opts);

    return {
      usuario: item.usuario,
      grupo: item.grupo,
      permissoes: permissoesConcedidas,
      efetivo: {
        processo_visualizar:
          permissaoConcedida('processo.visualizar_grupo', opts) ||
          permissaoConcedida('processo.visualizar_proprios', opts),
        processo_modificar:
          permissaoConcedida('processo.modificar_grupo', opts) ||
          permissaoConcedida('processo.modificar_proprios', opts),
        processo_excluir: permissaoConcedida('processo.excluir', opts),
        andamento_visualizar:
          permissaoConcedida('andamento.visualizar_grupo', opts) ||
          permissaoConcedida('andamento.visualizar_proprios', opts),
        andamento_modificar:
          permissaoConcedida('andamento.modificar_grupo', opts) ||
          permissaoConcedida('andamento.modificar_proprios', opts),
        andamento_excluir: permissaoConcedida('andamento.excluir', opts),
        visualizacao_global_gabinete: podeVisualizarGrupoGabinete,
      },
    };
  });

  return { total: linhas.length, data: linhas };
}
