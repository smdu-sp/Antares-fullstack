import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { garantirPermissaoProcesso } from './permissoes';
import { ANDAMENTO_INCLUDE_PADRAO } from './andamento-include';

/** Porte de AndamentosService.buscarPorId (Antares-backend/src/andamentos/andamentos.service.ts). */
export async function buscarPorId(id: string, usuario_id?: string) {
  if (!id) throw new HttpError(400, 'ID do andamento é obrigatório.');

  const andamento = await prisma.andamento.findUnique({ where: { id }, include: ANDAMENTO_INCLUDE_PADRAO });
  if (!andamento || !andamento.ativo) throw new HttpError(404, `Andamento não encontrado ou inativo: ${id}`);

  if (usuario_id) {
    await garantirPermissaoProcesso(usuario_id, andamento.processo_id, 'visualizar');
  }

  return andamento;
}
