import { GrupoCodigo } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { validarUsuario } from './validadores';

/** Porte de AcessosAdminService.obterMatrizPermissoesEfetivas (Antares-backend/src/acessos-admin/acessos-admin.service.ts). */
export async function obterMatrizPermissoesEfetivas(usuarioId?: string) {
  if (usuarioId) {
    await validarUsuario(usuarioId);
  }

  const vinculos = await prisma.usuarioGrupo.findMany({
    where: { ativo: true, ...(usuarioId ? { usuario_id: usuarioId } : {}) },
    include: {
      usuario: { select: { id: true, nome: true, login: true, permissao: true, status: true } },
      grupo: { select: { id: true, codigo: true, tipo: true, nome: true, ativo: true } },
      permissao: {
        select: {
          visualizar_proprios: true,
          visualizar_grupo: true,
          modificar_proprios: true,
          modificar_grupo: true,
          excluir: true,
          ativo: true,
        },
      },
    },
    orderBy: [{ usuario: { nome: 'asc' } }, { grupo: { codigo: 'asc' } }],
  });

  const linhas = vinculos.map((item) => {
    const permissao = item.permissao;
    const podeVisualizar = !!permissao && (permissao.visualizar_grupo || permissao.visualizar_proprios);
    const podeModificar = !!permissao && (permissao.modificar_grupo || permissao.modificar_proprios);

    return {
      usuario: item.usuario,
      grupo: item.grupo,
      permissao: permissao || null,
      efetivo: {
        processo_visualizar: podeVisualizar,
        processo_modificar: podeModificar,
        processo_excluir: !!permissao?.excluir,
        andamento_visualizar: podeVisualizar,
        andamento_modificar: podeModificar,
        andamento_excluir: !!permissao?.excluir,
        visualizacao_global_gabinete:
          item.grupo.codigo === GrupoCodigo.GABINETE && !!permissao?.visualizar_grupo,
      },
    };
  });

  return { total: linhas.length, data: linhas };
}
