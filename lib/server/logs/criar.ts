import { TipoAcao } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Porte de LogsService.criar (Antares-backend/src/logs/logs.service.ts).
 * Puxado adiantado da Fase 4 (módulo `logs` ainda não migrado) porque
 * processos/andamentos dependem dele para registrar auditoria.
 */
export async function criar(
  tipoAcao: TipoAcao,
  descricao: string,
  entidadeTipo: string,
  entidadeId: string,
  usuario_id: string,
  dadosAntigos: unknown = null,
  dadosNovos: unknown = null,
) {
  try {
    return await prisma.log.create({
      data: {
        tipoAcao,
        descricao,
        entidadeTipo,
        entidadeId,
        usuario_id,
        dadosAntigos: dadosAntigos ? JSON.stringify(dadosAntigos) : null,
        dadosNovos: dadosNovos ? JSON.stringify(dadosNovos) : null,
      },
    });
  } catch (error) {
    // Log silencioso - não deve interromper a operação principal
    console.error('Erro ao criar log:', error);
    return null;
  }
}
