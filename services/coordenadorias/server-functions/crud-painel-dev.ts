/** @format */

"use server";

import { auth } from "@/lib/auth/auth";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { revalidatePath } from "next/cache";
import { getApiUrl } from "@/lib/http/get-api-url";

type RecursoPainelDev =
  | "grupos"
  | "usuarios-grupos"
  | "permissoes"
  | "processos-grupos";

type RespostaCrudDev = {
  ok: boolean;
  error: string | null;
  status: number;
  data?: unknown;
};

const ENDPOINTS: Record<RecursoPainelDev, string> = {
  grupos: "/coordenadorias/admin/grupos",
  "usuarios-grupos": "/coordenadorias/admin/usuarios-grupos",
  permissoes: "/coordenadorias/admin/permissoes",
  "processos-grupos": "/coordenadorias/admin/processos-grupos",
};

async function executarCrud(
  recurso: RecursoPainelDev,
  method: "POST" | "PATCH" | "DELETE",
  payload?: Record<string, unknown>,
  id?: string,
): Promise<RespostaCrudDev> {
  const session = await auth();
  const baseURL = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
  ).replace(/\/$/, "");

  if (!session?.access_token) {
    return { ok: false, error: "Usuário não autenticado", status: 401 };
  }

  if (!session.grupoAtivo?.id) {
    return {
      ok: false,
      error: "Grupo ativo não selecionado",
      status: 400,
    };
  }

  if ((method === "PATCH" || method === "DELETE") && !id) {
    return {
      ok: false,
      error: "ID do registro é obrigatório",
      status: 400,
    };
  }

  const endpointBase = ENDPOINTS[recurso];
  const endpoint = id ? `${endpointBase}/${id}` : endpointBase;

  try {
    const response = await fetch(`${baseURL}${endpoint}`, {
      method,
      headers: buildAuthHeaders(session.access_token, session.grupoAtivo.id),
      body: method === "DELETE" ? undefined : JSON.stringify(payload || {}),
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (response.ok) {
      revalidatePath("/coordenadorias");
      return {
        ok: true,
        error: null,
        status: response.status,
        data,
      };
    }

    return {
      ok: false,
      error:
        (typeof data === "object" && data && "message" in data
          ? String((data as { message?: unknown }).message)
          : null) || "Não foi possível concluir a operação",
      status: response.status,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      error: `Erro de comunicação com backend: ${error}`,
      status: 400,
    };
  }
}

export async function criarRegistroPainelDev(
  recurso: RecursoPainelDev,
  payload: Record<string, unknown>,
): Promise<RespostaCrudDev> {
  return executarCrud(recurso, "POST", payload);
}

export async function atualizarRegistroPainelDev(
  recurso: RecursoPainelDev,
  id: string,
  payload: Record<string, unknown>,
): Promise<RespostaCrudDev> {
  return executarCrud(recurso, "PATCH", payload, id);
}

export async function deletarRegistroPainelDev(
  recurso: RecursoPainelDev,
  id: string,
): Promise<RespostaCrudDev> {
  return executarCrud(recurso, "DELETE", undefined, id);
}
