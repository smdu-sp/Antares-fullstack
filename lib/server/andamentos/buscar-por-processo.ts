import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { garantirPermissaoProcesso } from './permissoes';
import { ANDAMENTO_INCLUDE_PADRAO } from './andamento-include';

/** Porte de AndamentosService.buscarPorProcesso (Antares-backend/src/andamentos/andamentos.service.ts). */
export async function buscarPorProcesso(processo_id: string, usuario_id?: string) {
  if (!processo_id) throw new HttpError(400, 'ID do processo é obrigatório.');

  const processo = await prisma.processo.findUnique({ where: { id: processo_id } });
  if (!processo) throw new HttpError(404, 'Processo não encontrado.');

  if (usuario_id) {
    await garantirPermissaoProcesso(usuario_id, processo_id, 'visualizar');
  }

  return prisma.andamento.findMany({
    where: { processo_id, ativo: true },
    orderBy: { criadoEm: 'desc' },
    include: ANDAMENTO_INCLUDE_PADRAO,
  });
}
