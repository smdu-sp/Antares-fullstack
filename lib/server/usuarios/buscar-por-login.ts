import { prisma } from '@/lib/prisma';

/** Porte de UsuariosService.buscarPorLogin (Antares-backend/src/usuarios/usuarios.service.ts). */
export async function buscarPorLogin(login: string) {
  return prisma.usuario.findUnique({ where: { login } });
}
