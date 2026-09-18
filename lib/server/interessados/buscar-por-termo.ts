import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { obterGrupoAtivoIdSimples } from '@/lib/server/shared/grupo-processo';

/** Porte de InteressadosService.buscarPorTermo (Antares-backend/src/interessados/interessados.service.ts). */
export async function buscarPorTermo(termo: string, usuarioId: string) {
  const grupoAtivoId = await obterGrupoAtivoIdSimples(usuarioId);
  if (!grupoAtivoId) throw new HttpError(400, 'Usuário não possui grupo ativo.');

  const interessados = await prisma.interessado.findMany({
    where: { valor: { contains: termo }, grupo_id: grupoAtivoId, ativo: true },
    orderBy: { valor: 'asc' },
    take: 10,
  });

  return interessados.map((interessado) => ({
    id: interessado.id,
    valor: interessado.valor,
    criadoEm: interessado.criadoEm,
  }));
}
