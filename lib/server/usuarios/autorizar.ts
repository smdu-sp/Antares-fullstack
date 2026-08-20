import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';

/** Porte de UsuariosService.autorizaUsuario (Antares-backend/src/usuarios/usuarios.service.ts). */
export async function autorizar(id: string) {
  const autorizado = await prisma.usuario.update({ where: { id }, data: { status: true } });
  if (autorizado && autorizado.status === true) return { autorizado: true };
  throw new HttpError(403, 'Erro ao autorizar o usuário.');
}
