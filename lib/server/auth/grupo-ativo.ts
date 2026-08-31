import { GrupoCodigo, PermissaoGrupo } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { usuarioEhMembroGabinete } from '@/lib/server/shared/grupo-processo';

/**
 * Baseado em RoleGuard/CapacidadeGuard (Antares-backend/src/auth/guards), com uma
 * divergência intencional decidida pela usuária (2026-08-14): o bypass do grupo
 * GLOBAL foi removido — só `usuario.dev === true` dá acesso irrestrito.
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
          select: { permissao_grupo: true, grupo_id: true, grupo: { select: { codigo: true } } },
        })
      : null) ||
    (await prisma.usuarioGrupo.findFirst({
      where: { usuario_id: usuarioId, ativo: true, grupo: { ativo: true } },
      orderBy: [{ criadoEm: 'asc' }],
      select: { permissao_grupo: true, grupo_id: true, grupo: { select: { codigo: true } } },
    }));

  if (!vinculoAtivo) return null;

  // Só grava quando não havia preferência nenhuma ainda — não regravar sempre que a
  // resolução "discordar" do valor salvo, senão uma leitura passiva lenta (em voo de
  // antes de uma troca de grupo) pode sobrescrever uma troca concorrente de volta pro
  // grupo antigo. Ver mesma nota em obter-grupo-ativo.ts.
  if (!grupoAtivoPreferido) {
    await persistirGrupoAtivo(usuarioId, vinculoAtivo.grupo_id);
  }

  // O papel real no GABINETE só vale pra acesso honorário de processo/andamento
  // (usuarioTemPermissao em resolver-permissoes.ts) — nunca pode satisfazer um
  // requirePermissoes(['ADM']) de domínio de sistema (usuários/unidades/logs), senão
  // o Gabinete herdaria acesso fora do escopo combinado (só processos/andamentos).
  // Rebaixado pra TEC (não USR) pra não quebrar rotas de andamento que aceitam ADM/TEC.
  const permissao_grupo =
    vinculoAtivo.grupo.codigo === GrupoCodigo.GABINETE ? PermissaoGrupo.TEC : vinculoAtivo.permissao_grupo;

  return { permissao_grupo, grupo_id: vinculoAtivo.grupo_id };
}

/**
 * Resolve o grupo ativo usado para @RequerPermissao. A avaliação da permissão em
 * si (grant/deny) é feita à parte por usuarioPodeNaEntidade/usuarioTemPermissao
 * (lib/server/auth/resolver-permissoes.ts) — esta função só precisa garantir que
 * existe um vínculo usuário-grupo ativo para resolver o grupo.
 */
interface VinculoAtivoParaPermissao {
  grupo: { id: string; codigo: GrupoCodigo; nome: string };
  permissao_grupo: PermissaoGrupo;
}

export async function resolverGrupoAtivoParaPermissao(usuarioId: string, headerGrupoAtivoId?: string | null) {
  const vinculos = await prisma.usuarioGrupo.findMany({
    where: { usuario_id: usuarioId, ativo: true, grupo: { ativo: true } },
    include: { grupo: { select: { id: true, codigo: true, nome: true } } },
    orderBy: [{ grupo: { codigo: 'asc' } }, { criadoEm: 'asc' }],
  });

  if (vinculos.length === 0) return null;

  const idPreferido = await buscarPreferenciaGrupoAtivo(usuarioId);
  const idAlvo = headerGrupoAtivoId || idPreferido;

  let vinculoAtivo: VinculoAtivoParaPermissao | null =
    (headerGrupoAtivoId ? vinculos.find((item) => item.grupo_id === headerGrupoAtivoId) : null) ||
    (idPreferido ? vinculos.find((item) => item.grupo_id === idPreferido) : null) ||
    null;

  // Visão do Gabinete: idAlvo pode ser um grupo sem vínculo real — resolve um
  // vínculo honorário com o papel real do usuário no GABINETE (ver
  // usuarioTemPermissao() em resolver-permissoes.ts, que decide o acesso de fato).
  if (!vinculoAtivo && idAlvo && (await usuarioEhMembroGabinete(usuarioId))) {
    const grupoHonorario = await prisma.grupo.findFirst({
      where: { id: idAlvo, ativo: true },
      select: { id: true, codigo: true, nome: true },
    });
    const vinculoGabinete = vinculos.find((item) => item.grupo.codigo === GrupoCodigo.GABINETE);

    if (grupoHonorario && vinculoGabinete) {
      vinculoAtivo = { grupo: grupoHonorario, permissao_grupo: vinculoGabinete.permissao_grupo };
    }
  }

  if (!vinculoAtivo) {
    vinculoAtivo = vinculos[0];
  }

  // Mesma cautela de resolverVinculoPapel/obterGrupoAtivo: só grava quando não havia
  // preferência nenhuma ainda, pra não deixar uma leitura passiva concorrente
  // sobrescrever uma troca de grupo recém-feita pelo usuário.
  if (!idPreferido) {
    await persistirGrupoAtivo(usuarioId, vinculoAtivo.grupo.id);
  }

  return vinculoAtivo;
}
