import { prisma } from '@/lib/prisma';
import { AuthError } from './errors';
import { resolverVinculoPapel } from './grupo-ativo';

/**
 * Porte de RoleGuard (Antares-backend/src/auth/guards/role.guard.ts).
 * Corresponde ao decorator @Permissoes(...) do NestJS — chamar antes de
 * requirePermissao() na mesma ordem em que os guards globais rodavam
 * (Jwt -> Role -> Permissao).
 *
 * `'DEV'` no array `permissoes` só documenta que a rota também é acessível a
 * desenvolvedores — o bypass em si já é resolvido por `usuario.dev` antes de
 * qualquer checagem de papel. Fora isso, todo o resto do array (`ADM`/`TEC`/`USR`)
 * é checado contra o papel do usuário no grupo ativo, nunca contra um campo de
 * sistema — não existe mais "papel de sistema" ADM/TEC/USR (ver decisão 2026-08-14).
 */
export async function requirePermissoes(usuarioId: string, permissoes: string[]): Promise<void> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { dev: true, status: true },
  });

  if (!usuario || !usuario.status) throw new AuthError(403);

  // Sem permissões declaradas: delega para requirePermissao().
  if (permissoes.length === 0) return;

  if (usuario.dev) return;

  const papeisGrupo = permissoes.filter((item) => item !== 'DEV');
  if (papeisGrupo.length === 0) throw new AuthError(403); // rota exclusiva de DEV

  const vinculoAtivo = await resolverVinculoPapel(usuarioId);
  if (!vinculoAtivo) throw new AuthError(403);
  if (!papeisGrupo.includes(vinculoAtivo.permissao_grupo)) throw new AuthError(403);
}
