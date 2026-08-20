import { GrupoCodigo } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const CHAVE_GRUPO_ATIVO = 'auth.grupo_ativo_id';

/**
 * Porte de obterGrupoAtivoId (idêntico em ProcessosService e AndamentosService).
 */
export async function obterGrupoAtivoIdSimples(usuarioId: string): Promise<string | null> {
  const preferencia = await prisma.preferenciasUsuario.findUnique({
    where: { usuario_id_chave: { usuario_id: usuarioId, chave: CHAVE_GRUPO_ATIVO } },
    select: { valor: true, ativo: true },
  });

  if (preferencia?.ativo && preferencia.valor) {
    const vinculoPreferido = await prisma.usuarioGrupo.findFirst({
      where: { usuario_id: usuarioId, grupo_id: preferencia.valor, ativo: true, grupo: { ativo: true } },
      select: { grupo_id: true },
    });

    if (vinculoPreferido) return vinculoPreferido.grupo_id;
  }

  const vinculo = await prisma.usuarioGrupo.findFirst({
    where: { usuario_id: usuarioId, ativo: true, grupo: { ativo: true } },
    orderBy: [{ criadoEm: 'asc' }],
    select: { grupo_id: true },
  });

  return vinculo?.grupo_id || null;
}

/**
 * Porte de usuarioTemVisualizacaoGabinete (idêntico em ProcessosService e AndamentosService).
 */
export async function usuarioTemVisualizacaoGabinete(usuarioId?: string): Promise<boolean> {
  if (!usuarioId) return false;

  const grupoAtivoId = await obterGrupoAtivoIdSimples(usuarioId);
  if (!grupoAtivoId) return false;

  const permissao = await prisma.usuarioGrupoPermissao.findFirst({
    where: {
      ativo: true,
      visualizar_grupo: true,
      usuarioGrupo: {
        ativo: true,
        usuario_id: usuarioId,
        grupo_id: grupoAtivoId,
        grupo: { ativo: true, codigo: GrupoCodigo.GABINETE },
      },
    },
    select: { id: true },
  });

  return !!permissao;
}
