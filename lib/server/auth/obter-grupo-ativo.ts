import { GrupoCodigo, GrupoTipo, PermissaoGrupo } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { CHAVE_GRUPO_ATIVO } from './grupo-ativo';

// Grupo técnico usado só para satisfazer telas que exigem um "grupo ativo" resolvido
// (ex.: /logs, /interessados, /usuarios, /processos/[id]) — não concede nenhuma
// autorização por si só. DEV já tem bypass total via `usuario.dev` em
// requirePermissoes()/requirePermissao(); este grupo existe apenas como âncora.
// Reaproveita o código/tipo GLOBAL já existente no banco (sem migração de schema),
// mas sem nenhum efeito de autorização — ver nota em grupo-ativo.ts.
async function garantirGrupoDev() {
  return prisma.grupo.upsert({
    where: { codigo_tipo: { codigo: GrupoCodigo.GLOBAL, tipo: GrupoTipo.DIVISAO } },
    create: {
      codigo: GrupoCodigo.GLOBAL,
      tipo: GrupoTipo.DIVISAO,
      nome: 'Grupo DEV (uso interno)',
      ativo: true,
    },
    update: { nome: 'Grupo DEV (uso interno)', ativo: true },
    select: { id: true, codigo: true, nome: true, tipo: true },
  });
}

/** Porte de AuthService.obterGrupoAtivo (Antares-backend/src/auth/auth.service.ts). */
export async function obterGrupoAtivo(usuarioId: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { dev: true },
  });

  if (usuario?.dev) {
    const grupoDev = await garantirGrupoDev();

    let vinculos = await prisma.usuarioGrupo.findMany({
      where: { usuario_id: usuarioId, ativo: true, grupo: { ativo: true } },
      include: { grupo: { select: { id: true, codigo: true, nome: true, tipo: true } } },
      orderBy: [{ grupo: { codigo: 'asc' } }, { criadoEm: 'asc' }],
    });

    // Usuário DEV sem nenhum vínculo de grupo: provisiona automaticamente o vínculo
    // com o grupo técnico acima, só para ter um "grupo ativo" (o grupo em si já
    // é garantido acima, mas nunca era vinculado ao usuário).
    if (vinculos.length === 0) {
      await prisma.usuarioGrupo.upsert({
        where: { usuario_id_grupo_id: { usuario_id: usuarioId, grupo_id: grupoDev.id } },
        create: { usuario_id: usuarioId, grupo_id: grupoDev.id, permissao_grupo: 'ADM', ativo: true },
        update: { ativo: true },
      });

      vinculos = await prisma.usuarioGrupo.findMany({
        where: { usuario_id: usuarioId, ativo: true, grupo: { ativo: true } },
        include: { grupo: { select: { id: true, codigo: true, nome: true, tipo: true } } },
        orderBy: [{ grupo: { codigo: 'asc' } }, { criadoEm: 'asc' }],
      });
    }

    const vinculoDev = vinculos.find(
      (item) => item.grupo.codigo === GrupoCodigo.GLOBAL && item.grupo.tipo === GrupoTipo.DIVISAO,
    );

    if (vinculos.length === 0) {
      return { grupoAtivo: null, origem: null, gruposDisponiveis: [] };
    }

    const preferencia = await prisma.preferenciasUsuario.findUnique({
      where: { usuario_id_chave: { usuario_id: usuarioId, chave: CHAVE_GRUPO_ATIVO } },
      select: { valor: true, ativo: true },
    });

    const preferidoId = preferencia?.ativo && preferencia.valor ? preferencia.valor : null;

    const vinculoAtivo =
      (preferidoId ? vinculos.find((item) => item.grupo_id === preferidoId) : null) ||
      vinculoDev ||
      vinculos[0];

    // Ver nota no branch de usuário comum abaixo: só grava se não havia preferência
    // nenhuma ainda — evita que uma leitura passiva lenta sobrescreva uma troca de
    // grupo feita concorrentemente.
    if (!preferencia?.ativo || !preferidoId) {
      await prisma.preferenciasUsuario.upsert({
        where: { usuario_id_chave: { usuario_id: usuarioId, chave: CHAVE_GRUPO_ATIVO } },
        create: { usuario_id: usuarioId, chave: CHAVE_GRUPO_ATIVO, valor: vinculoAtivo.grupo.id, ativo: true },
        update: { valor: vinculoAtivo.grupo.id, ativo: true, atualizadoEm: new Date() },
      });
    }

    const gruposDisponiveis = [
      ...vinculos.map((item) => item.grupo).filter((item) => item.id !== vinculoAtivo.grupo.id),
    ];

    return {
      grupoAtivo: {
        ...vinculoAtivo.grupo,
        membroAtivo: { permissao: vinculoAtivo.permissao_grupo },
      },
      origem:
        preferidoId && preferidoId === vinculoAtivo.grupo.id
          ? 'preferencia'
          : vinculoAtivo.grupo.id === grupoDev.id
            ? 'fallback-grupo-dev'
            : 'fallback',
      gruposDisponiveis: [vinculoAtivo.grupo, ...gruposDisponiveis],
    };
  }

  const vinculos = await prisma.usuarioGrupo.findMany({
    where: { usuario_id: usuarioId, ativo: true, grupo: { ativo: true } },
    include: { grupo: { select: { id: true, codigo: true, nome: true, tipo: true } } },
    orderBy: [{ grupo: { codigo: 'asc' } }, { criadoEm: 'asc' }],
  });

  if (vinculos.length === 0) {
    return { grupoAtivo: null, origem: null, gruposDisponiveis: [] };
  }

  // Visão do Gabinete: quem é membro do GABINETE pode selecionar qualquer grupo
  // ativo do sistema no seletor de grupo ativo (um de cada vez, não todos juntos —
  // ver usuarioTemPermissao() em resolver-permissoes.ts pra onde isso vira acesso
  // de fato). O "papel" honorário reflete o papel real do usuário no GABINETE, pra
  // não inflar canAdmin/canEdit (que hoje já governam /usuarios, /unidades,
  // /interessados a partir do papel do grupo ativo) além do que ele tem de verdade.
  const vinculoGabinete = vinculos.find((item) => item.grupo.codigo === GrupoCodigo.GABINETE);

  const todosGrupos = vinculoGabinete
    ? await prisma.grupo.findMany({
        where: { ativo: true },
        select: { id: true, codigo: true, nome: true, tipo: true },
        orderBy: [{ codigo: 'asc' }],
      })
    : null;

  const preferencia = await prisma.preferenciasUsuario.findUnique({
    where: { usuario_id_chave: { usuario_id: usuarioId, chave: CHAVE_GRUPO_ATIVO } },
    select: { valor: true, ativo: true },
  });

  const preferidoId = preferencia?.ativo && preferencia.valor ? preferencia.valor : null;

  const vinculoPreferido = preferidoId ? vinculos.find((item) => item.grupo_id === preferidoId) : null;

  const grupoPreferidoHonorario =
    !vinculoPreferido && vinculoGabinete && preferidoId
      ? todosGrupos?.find((item) => item.id === preferidoId)
      : null;

  const ativo =
    vinculoPreferido ||
    (grupoPreferidoHonorario
      ? { grupo: grupoPreferidoHonorario, permissao_grupo: vinculoGabinete!.permissao_grupo }
      : null) ||
    vinculos[0];

  // Só grava quando não existe preferência nenhuma ainda (primeira vez do usuário).
  // NÃO regravar sempre que a resolução "discordar" do valor salvo — essa
  // reescrita passiva, disparada por qualquer leitura (inclusive uma renderização
  // lenta que ainda está em voo de ANTES de uma troca de grupo), corria contra o
  // PATCH /grupo-ativo e podia sobrescrever a troca recém-feita pelo usuário de
  // volta pro grupo antigo (grid "não mudava" depois de selecionar outro grupo).
  if (!preferencia?.ativo || !preferidoId) {
    await prisma.preferenciasUsuario.upsert({
      where: { usuario_id_chave: { usuario_id: usuarioId, chave: CHAVE_GRUPO_ATIVO } },
      create: { usuario_id: usuarioId, chave: CHAVE_GRUPO_ATIVO, valor: ativo.grupo.id, ativo: true },
      update: { valor: ativo.grupo.id, ativo: true, atualizadoEm: new Date() },
    });
  }

  const gruposDisponiveis = vinculoGabinete && todosGrupos ? todosGrupos : vinculos.map((item) => item.grupo);

  // Mesmo rebaixamento aplicado em resolverVinculoPapel (grupo-ativo.ts): o papel
  // honorário do GABINETE nunca deve virar canAdmin()/canEdit() ADMINISTRADOR — nem
  // quando o GABINETE é o próprio grupo ativo real, nem quando é o grupo que emprestou
  // o papel pra um alvo honorário — senão a sidebar e o middleware liberariam
  // /usuarios, /unidades, /interessados e /logs pra quem só devia ter processo/andamento.
  const viaGabinete =
    ativo.grupo.codigo === GrupoCodigo.GABINETE ||
    (grupoPreferidoHonorario ? ativo.grupo.id === grupoPreferidoHonorario.id : false);

  const permissaoReportada = viaGabinete ? PermissaoGrupo.TEC : ativo.permissao_grupo;

  return {
    grupoAtivo: {
      ...ativo.grupo,
      membroAtivo: { permissao: permissaoReportada },
    },
    origem: preferidoId && preferidoId === ativo.grupo.id ? 'preferencia' : 'fallback',
    gruposDisponiveis,
  };
}
