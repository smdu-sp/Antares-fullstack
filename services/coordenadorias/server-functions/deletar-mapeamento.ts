/** @format */

"use server";

import { auth } from "@/lib/auth/auth";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { revalidatePath } from "next/cache";
import { getApiUrl } from "@/lib/http/get-api-url";

export async function deletarMapeamento(
  coordenadoria: string,
): Promise<{ ok: boolean; error: string | null; status: number }> {
  const session = await auth();
  const baseURL = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
  ).replace(/\/$/, "");

  if (!session?.access_token) {
    return { ok: false, error: "Usuário não autenticado", status: 401 };
  }

  try {
    const response = await fetch(
      `${baseURL}/coordenadorias/admin/mapeamentos/${coordenadoria}`,
      {
        method: "DELETE",
        headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
      },
    );

    if (!response.ok) {
      const data = await response.json();
      return {
        ok: false,
        error: data?.message || "Erro ao deletar mapeamento",
        status: response.status,
      };
    }

    revalidatePath("/coordenadorias");
    return { ok: true, error: null, status: response.status };
  } catch (error) {
    return {
      ok: false,
      error: `Não foi possível deletar mapeamento: ${error}`,
      status: 400,
    };
  }
}
