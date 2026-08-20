import { GrupoCodigo, GrupoTipo } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { CHAVE_GRUPO_ATIVO } from './grupo-ativo';

// Grupo técnico usado só para satisfazer telas que exigem um "grupo ativo" resolvido
// (ex.: /logs, /interessados, /usuarios, /processos/[id]) — não concede nenhuma
// autorização por si só. DEV já tem bypass total via `usuario.permissao === 'DEV'`
// em requirePermissoes()/requireCapacidade(); este grupo existe apenas como âncora.
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
    select: { permissao: true },
  });

  if (usuario?.permissao === 'DEV') {
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

    if (!preferencia?.ativo || !preferidoId || preferidoId !== vinculoAtivo.grupo.id) {
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

  const preferencia = await prisma.preferenciasUsuario.findUnique({
    where: { usuario_id_chave: { usuario_id: usuarioId, chave: CHAVE_GRUPO_ATIVO } },
    select: { valor: true, ativo: true },
  });

  const preferidoId = preferencia?.ativo && preferencia.valor ? preferencia.valor : null;

  const ativo = (preferidoId ? vinculos.find((item) => item.grupo_id === preferidoId) : null) || vinculos[0];

  if (!preferencia?.ativo || !preferidoId || preferidoId !== ativo.grupo.id) {
    await prisma.preferenciasUsuario.upsert({
      where: { usuario_id_chave: { usuario_id: usuarioId, chave: CHAVE_GRUPO_ATIVO } },
      create: { usuario_id: usuarioId, chave: CHAVE_GRUPO_ATIVO, valor: ativo.grupo.id, ativo: true },
      update: { valor: ativo.grupo.id, ativo: true, atualizadoEm: new Date() },
    });
  }

  return {
    grupoAtivo: {
      ...ativo.grupo,
      membroAtivo: { permissao: ativo.permissao_grupo },
    },
    origem: preferidoId && preferidoId === ativo.grupo.id ? 'preferencia' : 'fallback',
    gruposDisponiveis: vinculos.map((item) => item.grupo),
  };
}
