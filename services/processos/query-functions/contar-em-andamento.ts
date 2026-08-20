/** @format */

import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getInternalApiUrl } from "@/lib/http/get-internal-api-url";

export async function contarEmAndamento(
  token: string,
  grupoAtivoId?: string,
): Promise<{ ok: boolean; data: number | null; error: string | null }> {
  try {
    const response = await fetch(
      `${getInternalApiUrl()}processos/contar/em-andamento`,
      {
        headers: buildAuthHeaders(token, grupoAtivoId),
        next: { tags: ["processos"], revalidate: 60 },
      },
    );

    if (!response.ok) {
      return {
        ok: false,
        data: null,
        error: `Erro ao contar processos em andamento: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      ok: true,
      data: typeof data === "number" ? data : data.total || 0,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao contar processos em andamento",
    };
  }
}
