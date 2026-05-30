/** @format */

import { IInteressado } from "@/types/interessado";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getApiUrl } from "@/lib/http/get-api-url";

const BACKEND = process.env.NEXT_PUBLIC_API_URL;

export async function listar(token: string, grupoAtivoId?: string) {
  try {
    const resposta = await fetch(`${BACKEND}interessados/lista-completa`, {
      headers: buildAuthHeaders(token, grupoAtivoId),
      next: {
        revalidate: 60,
        tags: ["interessados"],
      },
    });

    if (!resposta.ok) {
      const error = await resposta.json();
      return {
        ok: false,
        error: error.message || "Erro ao buscar interessados",
        data: null,
        status: resposta.status,
      };
    }

    const data: IInteressado[] = await resposta.json();

    return {
      ok: true,
      error: null,
      data,
      status: resposta.status,
    };
  } catch (error: any) {
    return {
      ok: false,
      error: error.message || "Erro ao buscar interessados",
      data: null,
      status: 500,
    };
  }
}
