/** @format */

"use server";

import { auth } from "@/lib/auth/auth";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { redirect } from "next/navigation";
import { getApiUrl } from "@/lib/http/get-api-url";

export type UsuarioPermissaoDev = {
  id: string;
  coordenadoria?: string;
  permissaoCoordenadoria?: string;
  servin_visualizar_todos?: boolean;
  servin_visualizar_proprios?: boolean;
  servin_editar_todos?: boolean;
  servin_editar_proprios?: boolean;
  servin_excluir_todos?: boolean;
};

export async function buscarPermissoesDev(): Promise<{
  ok: boolean;
  error: string | null;
  data: UsuarioPermissaoDev[] | null;
  status: number;
}> {
  const session = await auth();
  if (!session) redirect("/login");

  const baseURL = getApiUrl();

  try {
    const response = await fetch(`${baseURL}usuarios/admin/dev/permissoes`, {
      method: "GET",
      headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data?.message || "Erro ao buscar permissões DEV",
        data: null,
        status: response.status,
      };
    }

    return {
      ok: true,
      error: null,
      data: Array.isArray(data) ? (data as UsuarioPermissaoDev[]) : [],
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      error: `Erro ao buscar permissões DEV: ${error}`,
      data: null,
      status: 500,
    };
  }
}
