/** @format */

"use server";

import { auth } from "@/lib/auth/auth";
import * as processo from "@/services/processos";
import * as andamento from "@/services/andamentos";
import { IPaginadoProcesso } from "@/types/processo";

export interface MetricasDashboard {
  processos: {
    total: number;
    vencendoHoje: number;
    atrasados: number;
    emAndamento: number;
  };
  andamentos: {
    emAndamento: number;
    vencidos: number;
    vencendoHoje: number;
    concluidos: number;
  };
}

// Métricas do dashboard (painel "Mostrar Resumo"), calculadas sob demanda
// apenas quando o usuário abre o painel. Todas as contagens usam COUNT() no
// banco (via os endpoints /contar/*) — nada busca a lista completa de
// processos/andamentos pra depois contar em memória, o que não escala com o
// volume de dados do sistema.
export async function buscarMetricasDashboard(): Promise<MetricasDashboard | null> {
  const session = await auth();
  if (!session?.access_token || !session.grupoAtivo?.id) return null;

  const grupoAtivoId = session.grupoAtivo.id;

  const [
    totalGeralResponse,
    vencendoHojeRes,
    atrasadosRes,
    emAndamentoRes,
    andamentosEmAndamentoRes,
    andamentosVencidosRes,
    andamentosVencendoHojeRes,
    andamentosConcluidosRes,
  ] = await Promise.all([
    processo.query.buscarTudo(
      session.access_token,
      1,
      1,
      "",
      false,
      false,
      undefined,
      grupoAtivoId,
      undefined,
      undefined,
      true, // permitirCache
    ),
    processo.query.contarVencendoHoje(session.access_token, grupoAtivoId),
    processo.query.contarAtrasados(session.access_token, grupoAtivoId),
    processo.query.contarEmAndamento(session.access_token, grupoAtivoId),
    andamento.query.contarEmAndamento(session.access_token, grupoAtivoId),
    andamento.query.contarVencidos(session.access_token, grupoAtivoId),
    andamento.query.contarVencendoHoje(session.access_token, grupoAtivoId),
    andamento.query.contarConcluidos(session.access_token, grupoAtivoId),
  ]);

  const totalProcessos =
    totalGeralResponse.ok && totalGeralResponse.data
      ? (totalGeralResponse.data as IPaginadoProcesso).total || 0
      : 0;

  return {
    processos: {
      total: totalProcessos,
      vencendoHoje: vencendoHojeRes.ok ? vencendoHojeRes.data || 0 : 0,
      atrasados: atrasadosRes.ok ? atrasadosRes.data || 0 : 0,
      emAndamento: emAndamentoRes.ok ? emAndamentoRes.data || 0 : 0,
    },
    andamentos: {
      emAndamento: andamentosEmAndamentoRes.ok ? andamentosEmAndamentoRes.data || 0 : 0,
      vencidos: andamentosVencidosRes.ok ? andamentosVencidosRes.data || 0 : 0,
      vencendoHoje: andamentosVencendoHojeRes.ok ? andamentosVencendoHojeRes.data || 0 : 0,
      concluidos: andamentosConcluidosRes.ok ? andamentosConcluidosRes.data || 0 : 0,
    },
  };
}
