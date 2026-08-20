import { prisma } from '@/lib/prisma';

/** Porte de UsuariosService.buscarPorEmail (Antares-backend/src/usuarios/usuarios.service.ts). */
export async function buscarPorEmail(email: string) {
  return prisma.usuario.findUnique({ where: { email } });
}
