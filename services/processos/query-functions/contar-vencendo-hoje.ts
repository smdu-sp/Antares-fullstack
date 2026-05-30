/** @format */

import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getApiUrl } from "@/lib/http/get-api-url";

export async function contarVencendoHoje(
  access_token: string,
  grupoAtivoId?: string,
): Promise<{
  ok: boolean;
  error: string | null;
  data: number | null;
  status: number;
}> {
  const baseURL = getApiUrl();
  try {
    const response = await fetch(`${baseURL}processos/contar/vencendo-hoje`, {
      method: "GET",
      headers: buildAuthHeaders(access_token, grupoAtivoId),
      cache: "no-store",
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
      error: "Não foi possível contar processos vencendo hoje: " + error,
      data: null,
      status: 400,
    };
  }
}
