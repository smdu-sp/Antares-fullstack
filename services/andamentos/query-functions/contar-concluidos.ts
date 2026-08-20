/** @format */

import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getInternalApiUrl } from "@/lib/http/get-internal-api-url";

export async function contarConcluidos(
  access_token: string,
  grupoAtivoId?: string,
): Promise<{
  ok: boolean;
  error: string | null;
  data: number | null;
  status: number;
}> {
  const baseURL = getInternalApiUrl();
  try {
    const response = await fetch(`${baseURL}andamentos/contar/concluidos`, {
      method: "GET",
      headers: buildAuthHeaders(access_token, grupoAtivoId),
      next: { tags: ["andamentos"], revalidate: 60 },
    });
    const data = await response.json();
    if (response.status === 200)
      return {
        ok: true,
        error: null,
        data: data.total as number,
        status: 200,
      };
    return {
      ok: false,
      error: data.message,
      data: null,
      status: data.statusCode,
    };
  } catch (error) {
    return {
      ok: false,
      error: "Não foi possível contar andamentos concluídos: " + error,
      data: null,
      status: 400,
    };
  }
}
