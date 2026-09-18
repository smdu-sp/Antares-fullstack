import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { obterGrupoAtivoIdSimples } from '@/lib/server/shared/grupo-processo';

/** Espelha lib/server/unidades/lista-completa.ts, escopado ao grupo ativo do usuário. */
export async function listaCompleta(usuarioId: string, includeInactive: boolean = true) {
  const grupoAtivoId = await obterGrupoAtivoIdSimples(usuarioId);
  if (!grupoAtivoId) throw new HttpError(400, 'Usuário não possui grupo ativo.');

  return prisma.unidadeGrupo.findMany({
    where: includeInactive ? { grupo_id: grupoAtivoId } : { grupo_id: grupoAtivoId, ativo: true },
    orderBy: { nome: 'asc' },
  });
}
