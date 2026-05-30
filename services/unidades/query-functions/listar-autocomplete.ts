/** @format */

import { IUnidade } from "@/types/unidade";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getApiUrl } from "@/lib/http/get-api-url";

const BACKEND = process.env.NEXT_PUBLIC_API_URL;

export async function listarAutocomplete(
  token: string,
  busca: string = "",
  grupoAtivoId?: string,
) {
  try {
    const query = busca ? `?busca=${encodeURIComponent(busca)}` : "";
    const resposta = await fetch(`${BACKEND}unidades/lista-completa${query}`, {
      headers: buildAuthHeaders(token, grupoAtivoId),
      next: {
        revalidate: 60,
        tags: ["unidades"],
      },
    });

    if (!resposta.ok) {
      const error = await resposta.json();
      return {
        ok: false,
        error: error.message || "Erro ao buscar unidades",
        data: null,
        status: resposta.status,
      };
    }

    const data: IUnidade[] = await resposta.json();

    return {
      ok: true,
      error: null,
      data,
      status: resposta.status,
    };
  } catch (error: any) {
    return {
      ok: false,
      error: error.message || "Erro ao buscar unidades",
      data: null,
      status: 500,
    };
  }
}
