/** @format */

import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { ICoordenadoriaApiResponse } from "@/types/coordenadoria";
import { getApiUrl } from "@/lib/http/get-api-url";

type AdminListItem = Record<string, unknown>;

async function buscarListaAdmin(
  access_token: string,
  grupoAtivoId: string,
  endpoint: string,
  fallbackError: string,
): Promise<ICoordenadoriaApiResponse<AdminListItem[]>> {
  const baseURL = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
  ).replace(/\/$/, "");

  try {
    const response = await fetch(`${baseURL}${endpoint}`, {
      method: "GET",
      headers: buildAuthHeaders(access_token, grupoAtivoId),
      cache: "no-store",
    });

    const data = await response.json();

    if (response.status === 200) {
      return {
        ok: true,
        error: null,
        data: Array.isArray(data) ? (data as AdminListItem[]) : [],
        status: 200,
      };
    }

    return {
      ok: false,
      error: data?.message || fallbackError,
      data: null,
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      error: `${fallbackError}: ${error}`,
      data: null,
      status: 400,
    };
  }
}

export async function buscarGruposAdmin(
  access_token: string,
  grupoAtivoId: string,
): Promise<ICoordenadoriaApiResponse<AdminListItem[]>> {
  return buscarListaAdmin(
    access_token,
    grupoAtivoId,
    "/coordenadorias/admin/grupos",
    "Erro ao buscar grupos",
  );
}

export async function buscarUsuariosGruposAdmin(
  access_token: string,
  grupoAtivoId: string,
): Promise<ICoordenadoriaApiResponse<AdminListItem[]>> {
  return buscarListaAdmin(
    access_token,
    grupoAtivoId,
    "/coordenadorias/admin/usuarios-grupos",
    "Erro ao buscar vínculos de usuários e grupos",
  );
}

export async function buscarPermissoesAdmin(
  access_token: string,
  grupoAtivoId: string,
): Promise<ICoordenadoriaApiResponse<AdminListItem[]>> {
  return buscarListaAdmin(
    access_token,
    grupoAtivoId,
    "/coordenadorias/admin/permissoes",
    "Erro ao buscar permissões",
  );
}

export async function buscarProcessosGruposAdmin(
  access_token: string,
  grupoAtivoId: string,
): Promise<ICoordenadoriaApiResponse<AdminListItem[]>> {
  return buscarListaAdmin(
    access_token,
    grupoAtivoId,
    "/coordenadorias/admin/processos-grupos",
    "Erro ao buscar vínculos de processos e grupos",
  );
}
