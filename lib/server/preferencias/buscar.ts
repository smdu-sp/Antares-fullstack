import { prisma } from '@/lib/prisma';

/** Porte de PreferenciasService.buscar (Antares-backend/src/preferencias/preferencias.service.ts). */
export async function buscar(usuario_id: string, chave: string) {
  const preferencia = await prisma.preferenciasUsuario.findUnique({
    where: { usuario_id_chave: { usuario_id, chave } },
  });

  if (!preferencia || !preferencia.ativo) return null;

  return { chave: preferencia.chave, valor: preferencia.valor, atualizadoEm: preferencia.atualizadoEm };
}
