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

    // Visão do Gabinete: a preferência pode apontar pra um grupo sem vínculo real,
    // desde que o usuário seja membro ativo do GABINETE e o grupo exista/esteja ativo.
    if (await usuarioEhMembroGabinete(usuarioId)) {
      const grupoPreferido = await prisma.grupo.findFirst({
        where: { id: preferencia.valor, ativo: true },
        select: { id: true },
      });
      if (grupoPreferido) return grupoPreferido.id;
    }
  }

  const vinculo = await prisma.usuarioGrupo.findFirst({
    where: { usuario_id: usuarioId, ativo: true, grupo: { ativo: true } },
    orderBy: [{ criadoEm: 'asc' }],
    select: { grupo_id: true },
  });

  return vinculo?.grupo_id || null;
}

/**
 * Usuário é membro ativo do grupo GABINETE. Base pra "visão do Gabinete": poder
 * selecionar qualquer grupo ativo no seletor de grupo ativo (um de cada vez, não
 * todos juntos) e ter ADM honorário nele, escopado a processo/andamento — ver
 * usuarioTemPermissao() em resolver-permissoes.ts.
 */
export async function usuarioEhMembroGabinete(usuarioId: string): Promise<boolean> {
  const vinculo = await prisma.usuarioGrupo.findFirst({
    where: { usuario_id: usuarioId, ativo: true, grupo: { ativo: true, codigo: GrupoCodigo.GABINETE } },
    select: { id: true },
  });

  return !!vinculo;
}
