import { GrupoCodigo } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Baseado em RoleGuard/CapacidadeGuard (Antares-backend/src/auth/guards), com uma
 * divergência intencional decidida pela usuária (2026-08-14): o bypass do grupo
 * GLOBAL foi removido — só `usuario.permissao === 'DEV'` dá acesso irrestrito.
 * O grupo GLOBAL continua existindo só como vínculo técnico (ver garantirGrupoDev
 * em obter-grupo-ativo.ts), sem nenhum efeito de autorização.
 */
export const CHAVE_GRUPO_ATIVO = 'auth.grupo_ativo_id';

async function buscarPreferenciaGrupoAtivo(usuarioId: string): Promise<string | null> {
  const preferencia = await prisma.preferenciasUsuario.findUnique({
    where: { usuario_id_chave: { usuario_id: usuarioId, chave: CHAVE_GRUPO_ATIVO } },
    select: { valor: true, ativo: true },
  });

  return preferencia?.ativo && preferencia.valor ? preferencia.valor : null;
}

async function persistirGrupoAtivo(usuarioId: string, grupoId: string): Promise<void> {
  await prisma.preferenciasUsuario.upsert({
    where: { usuario_id_chave: { usuario_id: usuarioId, chave: CHAVE_GRUPO_ATIVO } },
    create: { usuario_id: usuarioId, chave: CHAVE_GRUPO_ATIVO, valor: grupoId, ativo: true },
    update: { valor: grupoId, ativo: true, atualizadoEm: new Date() },
  });
}

/** Porte de RoleGuard: resolve o vínculo (papel de grupo) usado para checar @Permissoes de negócio. */
export async function resolverVinculoPapel(usuarioId: string) {
  const grupoAtivoPreferido = await buscarPreferenciaGrupoAtivo(usuarioId);

  const vinculoAtivo =
    (grupoAtivoPreferido
      ? await prisma.usuarioGrupo.findFirst({
          where: {
            usuario_id: usuarioId,
            grupo_id: grupoAtivoPreferido,
            ativo: true,
            grupo: { ativo: true },
          },
          select: { permissao_grupo: true, grupo_id: true },
        })
      : null) ||
    (await prisma.usuarioGrupo.findFirst({
      where: { usuario_id: usuarioId, ativo: true, grupo: { ativo: true } },
      orderBy: [{ criadoEm: 'asc' }],
      select: { permissao_grupo: true, grupo_id: true },
    }));

  if (!vinculoAtivo) return null;

  if (!grupoAtivoPreferido || grupoAtivoPreferido !== vinculoAtivo.grupo_id) {
    await persistirGrupoAtivo(usuarioId, vinculoAtivo.grupo_id);
  }

  return vinculoAtivo;
}

/** Porte de CapacidadeGuard: resolve o vínculo (grupo + permissões granulares) usado para @RequerCapacidade. */
export async function resolverVinculoCapacidade(usuarioId: string, headerGrupoAtivoId?: string | null) {
  const vinculos = await prisma.usuarioGrupo.findMany({
    where: { usuario_id: usuarioId, ativo: true, grupo: { ativo: true } },
    include: {
      grupo: { select: { id: true, codigo: true, nome: true } },
      permissao: {
        select: {
          visualizar_proprios: true,
          visualizar_grupo: true,
          modificar_proprios: true,
          modificar_grupo: true,
          excluir: true,
          ativo: true,
        },
      },
    },
    orderBy: [{ grupo: { codigo: 'asc' } }, { criadoEm: 'asc' }],
  });

  if (vinculos.length === 0) return null;

  const idPreferido = await buscarPreferenciaGrupoAtivo(usuarioId);

  const vinculoAtivo =
    (headerGrupoAtivoId ? vinculos.find((item) => item.grupo_id === headerGrupoAtivoId) : null) ||
    (idPreferido ? vinculos.find((item) => item.grupo_id === idPreferido) : null) ||
    vinculos[0];

  if (!vinculoAtivo?.permissao || !vinculoAtivo.permissao.ativo) return null;

  if (idPreferido !== vinculoAtivo.grupo.id) {
    await persistirGrupoAtivo(usuarioId, vinculoAtivo.grupo.id);
  }

  return vinculoAtivo;
}

export function avaliarCapacidade(
  grupoCodigo: GrupoCodigo,
  permissao: {
    visualizar_proprios: boolean;
    visualizar_grupo: boolean;
    modificar_proprios: boolean;
    modificar_grupo: boolean;
    excluir: boolean;
  },
  capacidade: string,
): boolean {
  const acao = capacidade.split('.')[1];

  if (acao === 'visualizar') {
    if (grupoCodigo === GrupoCodigo.GABINETE && permissao.visualizar_grupo) return true;
    return permissao.visualizar_grupo || permissao.visualizar_proprios;
  }

  if (acao === 'modificar') return permissao.modificar_grupo || permissao.modificar_proprios;

  if (acao === 'excluir') return permissao.excluir;

  return false;
}
