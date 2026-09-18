import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { verificaLimite, verificaPagina } from '@/lib/server/pagination';
import { obterGrupoAtivoIdSimples } from '@/lib/server/shared/grupo-processo';

/** Listagem paginada de interessados do grupo ativo, usada pela página admin (/interessados). */
export async function buscarTudo(usuarioId: string, paginaInput?: number, limiteInput?: number, busca?: string) {
  const grupoAtivoId = await obterGrupoAtivoIdSimples(usuarioId);
  if (!grupoAtivoId) throw new HttpError(400, 'Usuário não possui grupo ativo.');

  let [pagina, limite] = verificaPagina(paginaInput, limiteInput);

  const searchParams = {
    ativo: true,
    grupo_id: grupoAtivoId,
    ...(busca && { valor: { contains: busca } }),
  };

  const total = await prisma.interessado.count({ where: searchParams });
  if (total === 0) return { total: 0, pagina: 0, limite: 0, data: [] };

  [pagina, limite] = verificaLimite(pagina, limite, total);

  const data = await prisma.interessado.findMany({
    where: searchParams,
    orderBy: { valor: 'asc' },
    skip: (pagina - 1) * limite,
    take: limite,
  });

  return { total, pagina, limite, data };
}
