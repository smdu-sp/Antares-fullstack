/** @format */

import { IInteressado } from "@/types/interessado";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getInternalApiUrl } from "@/lib/http/get-internal-api-url";

const BACKEND = getInternalApiUrl();

export async function buscarPorId(
  token: string,
  id: string,
  grupoAtivoId?: string,
) {
  try {
    const resposta = await fetch(`${BACKEND}interessados/${id}`, {
      headers: buildAuthHeaders(token, grupoAtivoId),
      next: {
        revalidate: 60,
        tags: ["interessados", id],
      },
    });

    if (!resposta.ok) {
      const error = await resposta.json();
      return {
        ok: false,
        error: error.message || "Erro ao buscar interessado",
        data: null,
        status: resposta.status,
      };
    }

    const data: IInteressado = await resposta.json();

    return {
      ok: true,
      error: null,
      data,
      status: resposta.status,
    };
  } catch (error: any) {
    return {
      ok: false,
      error: error.message || "Erro ao buscar interessado",
      data: null,
      status: 500,
    };
  }
}
