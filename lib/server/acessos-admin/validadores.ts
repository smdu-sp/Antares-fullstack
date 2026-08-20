import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';

/** Porte de AcessosAdminService.validarUsuario. */
export async function validarUsuario(usuarioId: string): Promise<void> {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { id: true } });
  if (!usuario) throw new HttpError(404, 'Usuario nao encontrado.');
}

/** Porte de AcessosAdminService.validarGrupo. */
export async function validarGrupo(grupoId: string): Promise<void> {
  const grupo = await prisma.grupo.findUnique({ where: { id: grupoId }, select: { id: true } });
  if (!grupo) throw new HttpError(404, 'Grupo nao encontrado.');
}

/** Porte de AcessosAdminService.validarProcesso. */
export async function validarProcesso(processoId: string): Promise<void> {
  const processo = await prisma.processo.findUnique({ where: { id: processoId }, select: { id: true } });
  if (!processo) throw new HttpError(404, 'Processo nao encontrado.');
}
