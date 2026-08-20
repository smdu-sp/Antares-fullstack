import { GrupoCodigo } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AuthError } from './errors';
import { avaliarCapacidade, resolverVinculoCapacidade } from './grupo-ativo';

export interface GrupoAtivoInfo {
  id: string;
  codigo: GrupoCodigo;
  nome: string;
}

/**
 * Porte de CapacidadeGuard (Antares-backend/src/auth/guards/capacidade.guard.ts).
 * Corresponde ao decorator @RequerCapacidade('entidade.acao') do NestJS —
 * chamar depois de requirePermissoes() na mesma rota, quando aplicável.
 */
export async function requireCapacidade(
  usuarioId: string,
  capacidade: string,
  headerGrupoAtivoId?: string | null,
): Promise<{ grupoAtivo: GrupoAtivoInfo | null }> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { permissao: true, status: true },
  });

  if (!usuario || !usuario.status) throw new AuthError(403);

  // Simplificação decidida pela usuária (2026-08-14): só DEV tem bypass de sistema.
  // ADM deixou de ser especial — precisa de papel/capacidade real dentro do grupo,
  // igual TEC/USR. O grupo GLOBAL deixou de existir como bypass (virou só uma
  // permissão de sistema, DEV).
  if (usuario.permissao === 'DEV') return { grupoAtivo: null };

  const vinculoAtivo = await resolverVinculoCapacidade(usuarioId, headerGrupoAtivoId);
  if (!vinculoAtivo?.permissao) throw new AuthError(403);

  if (!avaliarCapacidade(vinculoAtivo.grupo.codigo, vinculoAtivo.permissao, capacidade)) {
    throw new AuthError(403);
  }

  return {
    grupoAtivo: {
      id: vinculoAtivo.grupo.id,
      codigo: vinculoAtivo.grupo.codigo,
      nome: vinculoAtivo.grupo.nome,
    },
  };
}
