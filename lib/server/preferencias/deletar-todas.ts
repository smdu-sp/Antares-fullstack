import { prisma } from '@/lib/prisma';
import { CHAVES_PREFERENCIA_RESERVADAS } from './chaves-reservadas';

/**
 * Porte de PreferenciasService.deletarTodas (Antares-backend/src/preferencias/preferencias.service.ts).
 * Mesma correção: preserva chaves reservadas (ex.: grupo ativo) em vez de apagar tudo.
 */
export async function deletarTodas(usuario_id: string) {
  await prisma.preferenciasUsuario.updateMany({
    where: { usuario_id, ativo: true, chave: { notIn: [...CHAVES_PREFERENCIA_RESERVADAS] } },
    data: { ativo: false, atualizadoEm: new Date() },
  });

  return { success: true };
}
