import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';

/** Porte de UsuariosService.validaUsuario (Antares-backend/src/usuarios/usuarios.service.ts). */
export async function validaUsuario(id: string) {
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) throw new HttpError(403, 'Usuário não encontrado.');
  if (usuario.status !== true) throw new HttpError(403, 'Usuário inativo.');
  return usuario;
}
