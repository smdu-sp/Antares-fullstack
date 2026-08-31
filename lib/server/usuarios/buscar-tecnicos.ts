import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/server/http-error';

/**
 * Porte de UsuariosService.buscarTecnicos (Antares-backend/src/usuarios/usuarios.service.ts).
 * Antes filtrava pelo antigo campo de sistema `permissao: 'TEC'` (inerte na prática —
 * ver decisão 2026-08-14). A designação real de "técnico" vem do papel dentro do
 * grupo (`UsuarioGrupo.permissao_grupo`), não de um campo de sistema.
 */
export async function buscarTecnicos() {
  const lista = await prisma.usuario.findMany({
    where: { grupos: { some: { ativo: true, permissao_grupo: 'TEC' } } },
    orderBy: { nome: 'asc' },
    select: { id: true, nome: true },
  });

  if (!lista || lista.length === 0) throw new HttpError(403, 'Nenhum técnico encontrado.');

  return lista;
}
