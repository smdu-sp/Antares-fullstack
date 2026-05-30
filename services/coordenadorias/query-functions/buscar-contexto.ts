/** @format */

import {
import { getApiUrl } from "@/lib/http/get-api-url";
  ICoordenadoriaApiResponse,
  ICoordenadoriaContexto,
} from "@/types/coordenadoria";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getApiUrl } from "@/lib/http/get-api-url";

export async function buscarContexto(
  access_token: string,
  grupoAtivoId?: string,
): Promise<ICoordenadoriaApiResponse<ICoordenadoriaContexto>> {
  const baseURL = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
  ).replace(/\/$/, "");

  try {
    const response = await fetch(`${baseURL}/coordenadorias/contexto`, {
      method: "GET",
      headers: buildAuthHeaders(access_token, grupoAtivoId),
      cache: "no-store",
    });

    const data = await response.json();

    if (response.status === 200) {
      return { ok: true, error: null, data, status: 200 };
    }

    return {
      ok: false,
      error: data?.message || "Erro ao buscar contexto",
      data: null,
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      error: `Não foi possível buscar contexto: ${error}`,
      data: null,
      status: 400,
    };
  }
}
