import { GrupoCodigo } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AuthError } from './errors';
import { resolverGrupoAtivoParaPermissao } from './grupo-ativo';
import { usuarioPodeNaEntidade, type EntidadePermissao, type AcaoPermissao } from './resolver-permissoes';

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
export async function requirePermissao(
  usuarioId: string,
  permissao: string,
  headerGrupoAtivoId?: string | null,
): Promise<{ grupoAtivo: GrupoAtivoInfo | null }> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { dev: true, status: true },
  });

  if (!usuario || !usuario.status) throw new AuthError(403);

  if (usuario.dev) return { grupoAtivo: null };

  const vinculoAtivo = await resolverGrupoAtivoParaPermissao(usuarioId, headerGrupoAtivoId);
  if (!vinculoAtivo) throw new AuthError(403);

  const [entidade, acao] = permissao.split('.') as [EntidadePermissao, AcaoPermissao];
  const permitido = await usuarioPodeNaEntidade(usuarioId, entidade, acao, vinculoAtivo.grupo.id);
  if (!permitido) throw new AuthError(403);

  return {
    grupoAtivo: {
      id: vinculoAtivo.grupo.id,
      codigo: vinculoAtivo.grupo.codigo,
      nome: vinculoAtivo.grupo.nome,
    },
  };
}
