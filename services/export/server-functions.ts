/** @format */

"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { exportParamsSchema } from "@/lib/server/validation/export.schema";
import { buscarProcessosParaExport } from "@/lib/server/export/buscar-processos";
import { buscarAndamentosParaExport } from "@/lib/server/export/buscar-andamentos";
import {
  exportProcessosToExcel,
  exportAndamentosToExcel,
} from "@/lib/server/export/gerar-excel";
import {
  exportProcessosToPDF,
  exportAndamentosToPDF,
} from "@/lib/server/export/gerar-pdf";

export interface ExportParams {
  ids?: string[];
  busca?: string;
  interessado?: string;
  unidade?: string;
  vencendoHoje?: boolean;
  atrasados?: boolean;
  concluidos?: boolean;
  incluirProcesso?: boolean; // Incluir dados do processo
  incluirAndamentos?: boolean; // Incluir dados dos andamentos
}

type ExportResult =
  | { ok: true; blob: Blob; error: null; aviso: string | null }
  | { ok: false; blob: null; error: string; aviso: null };

const AVISO_TRUNCAMENTO =
  "A exportação tem mais registros do que o limite suportado (20.000) e foi truncada. Aplique filtros para reduzir o resultado.";

// PDFKit é muito mais lento que ExcelJS para o mesmo volume — medido em teste de carga
// (54 mil processos/108 mil andamentos): 20.000 linhas levaram ~2,7s no Excel e ~18s no
// PDF. 18s já é arriscado (timeout de proxy/browser) e só tende a piorar com mais dados,
// então o PDF usa um teto próprio, bem mais conservador que o do Excel.
const LIMITE_PDF_MAXIMO = 5000;
const AVISO_TRUNCAMENTO_PDF =
  "A exportação em PDF suporta no máximo 5.000 registros por vez (o PDF é bem mais lento de gerar que o Excel) e foi truncada. Aplique filtros para reduzir o resultado, ou use o Excel para volumes maiores.";

// `unidade` nunca correspondeu a um filtro real no backend original (que sempre
// esperou `unidadeRemetente`/`unidadeDestino` separados) — preservado aqui como
// campo inerte, igual ao comportamento anterior via fetch no NestJS.
function limparParams(params: ExportParams) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined),
  );
  return exportParamsSchema.parse(cleanParams);
}

export async function exportarProcessosExcel(
  params: ExportParams,
): Promise<ExportResult> {
  const session = await auth();
  if (!session) redirect("/login");

  try {
    const dto = limparParams(params);
    const { data: processos, truncado } = await buscarProcessosParaExport(
      dto,
      session.usuario?.sub,
    );

    if (processos.length === 0) {
      return {
        ok: false,
        blob: null,
        error: "Nenhum processo encontrado com os filtros aplicados",
        aviso: null,
      };
    }

    const buffer = await exportProcessosToExcel(
      processos,
      dto.incluirAndamentos,
      dto.incluirProcesso,
    );
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    return { ok: true, blob, error: null, aviso: truncado ? AVISO_TRUNCAMENTO : null };
  } catch (error) {
    console.error("Erro ao exportar processos para Excel:", error);
    return {
      ok: false,
      blob: null,
      error: "Erro ao exportar processos para Excel",
      aviso: null,
    };
  }
}

export async function exportarProcessosPdf(
  params: ExportParams,
): Promise<ExportResult> {
  const session = await auth();
  if (!session) redirect("/login");

  try {
    const dto = limparParams(params);
    const { data: processos, truncado } = await buscarProcessosParaExport(
      dto,
      session.usuario?.sub,
    );

    if (processos.length === 0) {
      return {
        ok: false,
        blob: null,
        error: "Nenhum processo encontrado com os filtros aplicados",
        aviso: null,
      };
    }

    const truncadoPdf = processos.length > LIMITE_PDF_MAXIMO;
    const processosPdf = truncadoPdf ? processos.slice(0, LIMITE_PDF_MAXIMO) : processos;

    const buffer = await exportProcessosToPDF(
      processosPdf,
      dto.incluirAndamentos,
      dto.incluirProcesso,
    );
    const blob = new Blob([buffer], { type: "application/pdf" });
    return {
      ok: true,
      blob,
      error: null,
      aviso: truncadoPdf ? AVISO_TRUNCAMENTO_PDF : truncado ? AVISO_TRUNCAMENTO : null,
    };
  } catch (error) {
    console.error("Erro ao exportar processos para PDF:", error);
    return {
      ok: false,
      blob: null,
      error: "Erro ao exportar processos para PDF",
      aviso: null,
    };
  }
}

export async function exportarAndamentosExcel(
  params: ExportParams,
): Promise<ExportResult> {
  const session = await auth();
  if (!session) redirect("/login");

  try {
    const dto = limparParams(params);
    const { data: andamentos, truncado } = await buscarAndamentosParaExport(
      dto,
      session.usuario?.sub,
    );

    if (andamentos.length === 0) {
      return {
        ok: false,
        blob: null,
        error: "Nenhum andamento encontrado com os filtros aplicados",
        aviso: null,
      };
    }

    const buffer = await exportAndamentosToExcel(andamentos);
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    return { ok: true, blob, error: null, aviso: truncado ? AVISO_TRUNCAMENTO : null };
  } catch (error) {
    console.error("Erro ao exportar andamentos para Excel:", error);
    return {
      ok: false,
      blob: null,
      error: "Erro ao exportar andamentos para Excel",
      aviso: null,
    };
  }
}

export async function exportarAndamentosPdf(
  params: ExportParams,
): Promise<ExportResult> {
  const session = await auth();
  if (!session) redirect("/login");

  try {
    const dto = limparParams(params);
    const { data: andamentos, truncado } = await buscarAndamentosParaExport(
      dto,
      session.usuario?.sub,
    );

    if (andamentos.length === 0) {
      return {
        ok: false,
        blob: null,
        error: "Nenhum andamento encontrado com os filtros aplicados",
        aviso: null,
      };
    }

    const truncadoPdf = andamentos.length > LIMITE_PDF_MAXIMO;
    const andamentosPdf = truncadoPdf ? andamentos.slice(0, LIMITE_PDF_MAXIMO) : andamentos;

    const buffer = await exportAndamentosToPDF(andamentosPdf);
    const blob = new Blob([buffer], { type: "application/pdf" });
    return {
      ok: true,
      blob,
      error: null,
      aviso: truncadoPdf ? AVISO_TRUNCAMENTO_PDF : truncado ? AVISO_TRUNCAMENTO : null,
    };
  } catch (error) {
    console.error("Erro ao exportar andamentos para PDF:", error);
    return {
      ok: false,
      blob: null,
      error: "Erro ao exportar andamentos para PDF",
      aviso: null,
    };
  }
}

// Função auxiliar para disparar download do arquivo - veja client-functions.ts para a implementação
// que funciona no navegador
