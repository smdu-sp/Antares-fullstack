/** @format */

"use server";

import { auth } from "@/lib/auth/auth";
import * as processo from "@/services/processos";
import * as andamento from "@/services/andamentos";
import { StatusAndamento, IAndamento, IPaginadoProcesso } from "@/types/processo";
import { parseUTCDate } from "@/app/(rotas-auth)/processos/_components/utils";

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
// apenas quando o usuário abre o painel — evita pesar toda busca de processos
// com a leitura completa da tabela de andamentos, usada só para essas contagens.
export async function buscarMetricasDashboard(): Promise<MetricasDashboard | null> {
  const session = await auth();
  if (!session?.access_token || !session.grupoAtivo?.id) return null;

  const grupoAtivoId = session.grupoAtivo.id;

  const [totalGeralResponse, vencendoHojeRes, atrasadosRes, emAndamentoRes] =
    await Promise.all([
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
    ]);

  const totalProcessos =
    totalGeralResponse.ok && totalGeralResponse.data
      ? (totalGeralResponse.data as IPaginadoProcesso).total || 0
      : 0;

  let andamentosEmAndamento = 0;
  let andamentosVencidos = 0;
  let andamentosVencendoHoje = 0;
  let andamentosConcluidos = 0;

  const andamentosResponse = await andamento.query.buscarTudo(
    session.access_token,
    1,
    999999,
    grupoAtivoId,
  );

  if (andamentosResponse.ok && andamentosResponse.data) {
    const andamentosPaginados = andamentosResponse.data as any;
    const andamentosLista = (andamentosPaginados.data || []).filter(
      (a: IAndamento) => a.ativo === true,
    );
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    andamentosLista.forEach((a: IAndamento) => {
      if (a.status === StatusAndamento.CONCLUIDO) {
        andamentosConcluidos++;
      } else {
        const prazo = parseUTCDate(a.prazo);
        if (!prazo) {
          andamentosEmAndamento++;
        } else {
          const diffDays = Math.ceil(
            (prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
          );
          if (diffDays < 0) {
            andamentosVencidos++;
          } else if (diffDays === 0) {
            andamentosVencendoHoje++;
          } else {
            andamentosEmAndamento++;
          }
        }
      }
    });
  }

  return {
    processos: {
      total: totalProcessos,
      vencendoHoje: vencendoHojeRes.ok ? vencendoHojeRes.data || 0 : 0,
      atrasados: atrasadosRes.ok ? atrasadosRes.data || 0 : 0,
      emAndamento: emAndamentoRes.ok ? emAndamentoRes.data || 0 : 0,
    },
    andamentos: {
      emAndamento: andamentosEmAndamento,
      vencidos: andamentosVencidos,
      vencendoHoje: andamentosVencendoHoje,
      concluidos: andamentosConcluidos,
    },
  };
}
