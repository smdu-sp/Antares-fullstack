import { prisma } from '@/lib/prisma';
import { validarProcesso } from './validadores';

/** Porte de AcessosAdminService.listarGruposProcesso (Antares-backend/src/acessos-admin/acessos-admin.service.ts). */
export async function listarGruposProcesso(processoId: string) {
  await validarProcesso(processoId);

  const grupos = await prisma.processoGrupo.findMany({
    where: { processo_id: processoId },
    include: { grupo: true },
    orderBy: { criadoEm: 'desc' },
  });

  return { total: grupos.length, data: grupos };
}
