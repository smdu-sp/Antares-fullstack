/** @format */

import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getApiUrl } from "@/lib/http/get-api-url";

export async function contarConcluidos(
  token: string,
  grupoAtivoId?: string,
): Promise<{ ok: boolean; data: number | null; error: string | null }> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}processos/contar/concluidos`,
      {
        headers: buildAuthHeaders(token, grupoAtivoId),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return {
        ok: false,
        data: null,
        error: `Erro ao contar processos concluídos: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      ok: true,
      data: typeof data === "number" ? data : data.count || 0,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao contar processos concluídos",
    };
  }
}
