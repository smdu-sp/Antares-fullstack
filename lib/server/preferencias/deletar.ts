import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';
import { CHAVES_PREFERENCIA_RESERVADAS } from './chaves-reservadas';

/**
 * Porte de PreferenciasService.deletar (Antares-backend/src/preferencias/preferencias.service.ts).
 * Mesma correção de `salvar.ts`: chaves reservadas não podem ser tocadas por aqui.
 */
export async function deletar(usuario_id: string, chave: string) {
  if (CHAVES_PREFERENCIA_RESERVADAS.includes(chave)) {
    throw new HttpError(403, `A chave "${chave}" é reservada e não pode ser removida diretamente.`);
  }

  const preferencia = await prisma.preferenciasUsuario.findUnique({
    where: { usuario_id_chave: { usuario_id, chave } },
    select: { id: true, ativo: true },
  });

  if (!preferencia || !preferencia.ativo) {
    return { success: false, message: 'Preferência não encontrada' };
  }

  await prisma.preferenciasUsuario.update({
    where: { usuario_id_chave: { usuario_id, chave } },
    data: { ativo: false, atualizadoEm: new Date() },
  });

  return { success: true };
}
