import { PermissaoGrupo } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Porte de AcessosAdminService.listarGrupos (Antares-backend/src/acessos-admin/acessos-admin.service.ts),
 * estendido com `permissoesPorGrupo`: o baseline de cada grupo por papel (GrupoPermissoes),
 * pra telas de administração mostrarem o que cada papel (ADM/TEC/USR) de cada grupo concede
 * sem precisar de uma chamada por grupo.
 */
export async function listarGrupos() {
  const grupos = await prisma.grupo.findMany({ orderBy: [{ tipo: 'asc' }, { codigo: 'asc' }] });

  const grupoIds = grupos.map((grupo) => grupo.id);
  const permissoesGrupo = grupoIds.length
    ? await prisma.grupoPermissoes.findMany({
        where: { grupo_id: { in: grupoIds }, ativo: true },
        include: { permissao: { select: { codigo: true } } },
      })
    : [];

  const permissoesPorGrupo: Record<string, Partial<Record<PermissaoGrupo, string[]>>> = {};
  for (const item of permissoesGrupo) {
    const porPapel = (permissoesPorGrupo[item.grupo_id] ||= {});
    (porPapel[item.papel] ||= []).push(item.permissao.codigo);
  }

  return { total: grupos.length, data: grupos, permissoesPorGrupo };
}
