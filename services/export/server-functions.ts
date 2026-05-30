/** @format */

"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getApiUrl } from "@/lib/http/get-api-url";

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

export async function exportarProcessosExcel(params: ExportParams) {
  const session = await auth();
  const baseURL = getApiUrl();

  if (!session) redirect("/login");

  try {
    // Remover campos undefined
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined),
    );

    const response = await fetch(`${baseURL}export/processos/excel`, {
      method: "POST",
      headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
      body: JSON.stringify(cleanParams),
    });

    if (response.ok) {
      const blob = await response.blob();
      return { ok: true, blob, error: null };
    }

    const errorText = await response.text();
    return {
      ok: false,
      blob: null,
      error: `Erro ao exportar processos para Excel: ${response.status} - ${errorText}`,
    };
  } catch (error) {
    console.error("Erro ao exportar processos para Excel:", error);
    return {
      ok: false,
      blob: null,
      error: "Erro ao conectar com o servidor",
    };
  }
}

export async function exportarProcessosPdf(params: ExportParams) {
  const session = await auth();
  const baseURL = getApiUrl();

  if (!session) redirect("/login");

  try {
    // Remover campos undefined
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined),
    );

    const response = await fetch(`${baseURL}export/processos/pdf`, {
      method: "POST",
      headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
      body: JSON.stringify(cleanParams),
    });

    if (response.ok) {
      const blob = await response.blob();
      return { ok: true, blob, error: null };
    }

    const errorText = await response.text();
    return {
      ok: false,
      blob: null,
      error: `Erro ao exportar processos para PDF: ${response.status} - ${errorText}`,
    };
  } catch (error) {
    console.error("Erro ao exportar processos para PDF:", error);
    return {
      ok: false,
      blob: null,
      error: "Erro ao conectar com o servidor",
    };
  }
}

export async function exportarAndamentosExcel(params: ExportParams) {
  const session = await auth();
  const baseURL = getApiUrl();

  if (!session) redirect("/login");

  try {
    // Remover campos undefined
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined),
    );

    const response = await fetch(`${baseURL}export/andamentos/excel`, {
      method: "POST",
      headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
      body: JSON.stringify(cleanParams),
    });

    if (response.ok) {
      const blob = await response.blob();
      return { ok: true, blob, error: null };
    }

    const errorText = await response.text();
    return {
      ok: false,
      blob: null,
      error: `Erro ao exportar andamentos para Excel: ${response.status} - ${errorText}`,
    };
  } catch (error) {
    console.error("Erro ao exportar andamentos para Excel:", error);
    return {
      ok: false,
      blob: null,
      error: "Erro ao conectar com o servidor",
    };
  }
}

export async function exportarAndamentosPdf(params: ExportParams) {
  const session = await auth();
  const baseURL = getApiUrl();

  if (!session) redirect("/login");

  try {
    // Remover campos undefined
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined),
    );

    const response = await fetch(`${baseURL}export/andamentos/pdf`, {
      method: "POST",
      headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
      body: JSON.stringify(cleanParams),
    });

    if (response.ok) {
      const blob = await response.blob();
      return { ok: true, blob, error: null };
    }

    const errorText = await response.text();
    return {
      ok: false,
      blob: null,
      error: `Erro ao exportar andamentos para PDF: ${response.status} - ${errorText}`,
    };
  } catch (error) {
    console.error("Erro ao exportar andamentos para PDF:", error);
    return {
      ok: false,
      blob: null,
      error: "Erro ao conectar com o servidor",
    };
  }
}

// Função auxiliar para disparar download do arquivo - veja client-functions.ts para a implementação
// que funciona no navegador
