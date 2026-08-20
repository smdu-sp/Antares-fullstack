import { GrupoCodigo, GrupoTipo, TipoAcao } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { criar as criarLog } from "@/lib/server/logs/criar";

// GLOBAL não entra aqui: deixou de ser um grupo de negócio "padrão" — é só um vínculo
// técnico auto-provisionado para usuários DEV (ver garantirGrupoDev em obter-grupo-ativo.ts).
const PADROES: Array<{ codigo: GrupoCodigo; tipo: GrupoTipo; nome: string }> = [
  {
    codigo: GrupoCodigo.EXPEDIENTE,
    tipo: GrupoTipo.COORDENADORIA,
    nome: "Coordenadoria Expediente",
  },
  {
    codigo: GrupoCodigo.SERVIN,
    tipo: GrupoTipo.COORDENADORIA,
    nome: "Coordenadoria Servin",
  },
  {
    codigo: GrupoCodigo.GABINETE,
    tipo: GrupoTipo.COORDENADORIA,
    nome: "Gabinete",
  },
  {
    codigo: GrupoCodigo.OUTORGA,
    tipo: GrupoTipo.DIVISAO,
    nome: "Coordenadoria Outorga",
  },
];

/** Porte de AcessosAdminService.semearGruposPadrao (Antares-backend/src/acessos-admin/acessos-admin.service.ts). */
export async function semearGruposPadrao(usuarioId: string) {
  const resultado = [];

  for (const item of PADROES) {
    const grupo = await prisma.grupo.upsert({
      where: { codigo_tipo: { codigo: item.codigo, tipo: item.tipo } },
      create: {
        codigo: item.codigo,
        tipo: item.tipo,
        nome: item.nome,
        ativo: true,
      },
      update: { nome: item.nome, ativo: true },
    });
    resultado.push(grupo);
  }

  await criarLog(
    TipoAcao.GRUPO_ATUALIZADO,
    "Semeadura de grupos padrao executada no painel DEV.",
    "grupo",
    "semeadura_grupos_padrao",
    usuarioId,
    null,
    { total: resultado.length },
  );

  return { total: resultado.length, data: resultado };
}
