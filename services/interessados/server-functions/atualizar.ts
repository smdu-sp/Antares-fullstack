/** @format */

"use server";

import { auth } from "@/lib/auth/auth";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { revalidateTag } from "next/cache";
import { getApiUrl } from "@/lib/http/get-api-url";

const BACKEND = process.env.NEXT_PUBLIC_API_URL;

export async function atualizar(id: string, data: any) {
  try {
    const session = await auth();

    if (!session?.access_token) {
      return {
        ok: false,
        error: "Não autenticado",
        data: null,
        status: 401,
      };
    }

    const resposta = await fetch(`${BACKEND}interessados/${id}`, {
      method: "PUT",
      headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
      body: JSON.stringify(data),
    });

    if (!resposta.ok) {
      const error = await resposta.json();
      return {
        ok: false,
        error: error.message || "Erro ao atualizar interessado",
        data: null,
        status: resposta.status,
      };
    }

    const interessado = await resposta.json();

    revalidateTag("interessados");
    revalidateTag(id);

    return {
      ok: true,
      error: null,
      data: interessado,
      status: resposta.status,
    };
  } catch (error: any) {
    return {
      ok: false,
      error: error.message || "Erro ao atualizar interessado",
      data: null,
      status: 500,
    };
  }
}
