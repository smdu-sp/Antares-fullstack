import { prisma } from '@/lib/prisma';
import { AuthError } from './errors';
import { resolverVinculoPapel } from './grupo-ativo';

const PAPEIS_SISTEMA = ['DEV', 'ADM'];
const PAPEIS_GRUPO = ['ADM', 'TEC', 'USR'];

/**
 * Porte de RoleGuard (Antares-backend/src/auth/guards/role.guard.ts).
 * Corresponde ao decorator @Permissoes(...) do NestJS — chamar antes de
 * requireCapacidade() na mesma ordem em que os guards globais rodavam
 * (Jwt -> Role -> Capacidade).
 */
export async function requirePermissoes(usuarioId: string, permissoes: string[]): Promise<void> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { permissao: true, status: true },
  });

  if (!usuario || !usuario.status) throw new AuthError(403);

  // Sem permissões declaradas: delega para requireCapacidade().
  if (permissoes.length === 0) return;

  // Simplificação decidida pela usuária (2026-08-14): só DEV tem bypass de sistema —
  // o grupo GLOBAL deixou de existir como bypass (virou só permissão de sistema, DEV).
  if (usuario.permissao === 'DEV') return;

  const permissoesSistema = permissoes.filter((item) => PAPEIS_SISTEMA.includes(item));
  const permissoesGrupo = permissoes.filter((item) => PAPEIS_GRUPO.includes(item));

  // Rota pede apenas papel de sistema: valida direto no usuário.
  if (permissoesGrupo.length === 0) {
    if (!permissoesSistema.includes(usuario.permissao)) throw new AuthError(403);
    return;
  }

  // Rota de negócio: valida papel no grupo ativo.
  const vinculoAtivo = await resolverVinculoPapel(usuarioId);
  if (!vinculoAtivo) throw new AuthError(403);
  if (!permissoesGrupo.includes(vinculoAtivo.permissao_grupo)) throw new AuthError(403);
}
