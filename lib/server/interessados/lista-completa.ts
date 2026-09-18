import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { obterGrupoAtivoIdSimples } from '@/lib/server/shared/grupo-processo';

/** Porte de InteressadosService.listaCompleta (Antares-backend/src/interessados/interessados.service.ts). */
export async function listaCompleta(usuarioId: string) {
  const grupoAtivoId = await obterGrupoAtivoIdSimples(usuarioId);
  if (!grupoAtivoId) throw new HttpError(400, 'Usuário não possui grupo ativo.');

  const interessados = await prisma.interessado.findMany({
    where: { ativo: true, grupo_id: grupoAtivoId },
    orderBy: { valor: 'asc' },
  });

  return interessados.map((interessado) => ({
    id: interessado.id,
    valor: interessado.valor,
    criadoEm: interessado.criadoEm,
  }));
}
