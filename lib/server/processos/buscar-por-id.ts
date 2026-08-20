import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { PROCESSO_INCLUDE_PADRAO } from './processo-include';
import { mapProcessoToResponseDto } from './map-processo-response';
import { garantirAcessoVisualizacao } from './garantir-acesso-visualizacao';

/** Porte de ProcessosService.buscarPorId (Antares-backend/src/processos/processos.service.ts). */
export async function buscarPorId(id: string, usuario_id?: string) {
  if (!id) throw new HttpError(400, 'ID do processo é obrigatório.');

  const processo = await prisma.processo.findUnique({ where: { id }, include: PROCESSO_INCLUDE_PADRAO });
  if (!processo || !processo.ativo) throw new HttpError(404, 'Processo não encontrado.');

  if (usuario_id) {
    await garantirAcessoVisualizacao(usuario_id, processo);
  }

  return mapProcessoToResponseDto(processo);
}
