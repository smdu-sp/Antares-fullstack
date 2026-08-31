import { prisma } from '@/lib/prisma';
import { validarUsuario } from './validadores';

/**
 * Porte de AcessosAdminService.listarGruposUsuario (Antares-backend/src/acessos-admin/acessos-admin.service.ts),
 * estendido com as permissões granulares do novo modelo (UsuarioPermissoes): uma
 * lista por grupo (`permissoesPorGrupo`) e uma lista global, independente de
 * grupo (`permissoesGlobais`).
 */
export async function listarGruposUsuario(usuarioId: string) {
  await validarUsuario(usuarioId);

  const [grupos, permissoesUsuario] = await Promise.all([
    prisma.usuarioGrupo.findMany({
      where: { usuario_id: usuarioId },
      include: { grupo: true },
      orderBy: { criadoEm: 'desc' },
    }),
    prisma.usuarioPermissoes.findMany({
      where: { usuario_id: usuarioId, ativo: true },
      include: { permissao: { select: { codigo: true } } },
    }),
  ]);

  const permissoesPorGrupo: Record<string, string[]> = {};
  const permissoesGlobais: string[] = [];

  for (const item of permissoesUsuario) {
    if (item.grupo_id) {
      (permissoesPorGrupo[item.grupo_id] ||= []).push(item.permissao.codigo);
    } else {
      permissoesGlobais.push(item.permissao.codigo);
    }
  }

  return { total: grupos.length, data: grupos, permissoesPorGrupo, permissoesGlobais };
}
