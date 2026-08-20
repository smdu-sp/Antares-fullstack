import { prisma } from '@/lib/prisma';

/** Porte de UsuariosService.buscarPorId (Antares-backend/src/usuarios/usuarios.service.ts). */
export async function buscarPorId(id: string) {
  return prisma.usuario.findUnique({
    where: { id },
    include: { unidade: { select: { id: true, nome: true, sigla: true } } },
  });
}
