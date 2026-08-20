import { prisma } from '@/lib/prisma';
import { validarUsuario } from './validadores';

/** Porte de AcessosAdminService.listarGruposUsuario (Antares-backend/src/acessos-admin/acessos-admin.service.ts). */
export async function listarGruposUsuario(usuarioId: string) {
  await validarUsuario(usuarioId);

  const grupos = await prisma.usuarioGrupo.findMany({
    where: { usuario_id: usuarioId },
    include: { grupo: true, permissao: true },
    orderBy: { criadoEm: 'desc' },
  });

  return { total: grupos.length, data: grupos };
}
