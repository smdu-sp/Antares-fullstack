import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { obterGrupoAtivoIdSimples } from '@/lib/server/shared/grupo-processo';

/** Porte de ProcessosService.vincularProcessoAoGrupoPrincipal. */
export async function vincularProcessoAoGrupoPrincipal(processoId: string, usuarioId: string): Promise<void> {
  const grupoAtivoId = await obterGrupoAtivoIdSimples(usuarioId);

  if (!grupoAtivoId) {
    throw new HttpError(400, 'Usuario criador nao possui grupo ativo para vincular o processo.');
  }

  await prisma.processoGrupo.upsert({
    where: { processo_id_grupo_id: { processo_id: processoId, grupo_id: grupoAtivoId } },
    create: { processo_id: processoId, grupo_id: grupoAtivoId, nivelVisao: 'TOTAL', ativo: true },
    update: { ativo: true },
  });
}
