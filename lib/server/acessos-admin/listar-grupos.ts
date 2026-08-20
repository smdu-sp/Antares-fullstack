import { prisma } from '@/lib/prisma';

/** Porte de AcessosAdminService.listarGrupos (Antares-backend/src/acessos-admin/acessos-admin.service.ts). */
export async function listarGrupos() {
  const grupos = await prisma.grupo.findMany({ orderBy: [{ tipo: 'asc' }, { codigo: 'asc' }] });
  return { total: grupos.length, data: grupos };
}
