import { prisma } from '@/lib/prisma';

/** Porte de UsuariosService.excluir (Antares-backend/src/usuarios/usuarios.service.ts). */
export async function excluir(id: string) {
  await prisma.usuario.update({ where: { id }, data: { status: false } });
  return { desativado: true };
}
