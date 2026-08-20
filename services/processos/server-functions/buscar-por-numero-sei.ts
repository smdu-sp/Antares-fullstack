/** @format */

"use server";

import { redirect } from "next/navigation";
import { IProcesso, IRespostaProcesso } from "@/types/processo";
import { auth } from "@/lib/auth/auth";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getInternalApiUrl } from "@/lib/http/get-internal-api-url";

export async function buscarPorNumeroSei(
  numeroSei: string,
): Promise<IRespostaProcesso> {
  const session = await auth();
  if (!session) redirect("/login");
  const baseURL = getInternalApiUrl();

  try {
    const response = await fetch(
      `${baseURL}processos/numero-sei/${encodeURIComponent(numeroSei)}`,
      {
        method: "GET",
        headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
        cache: "no-store",
      },
    );
    const dataResponse = await response.json();
    if (response.status === 200) {
      return {
        ok: true,
        error: null,
        data: dataResponse as IProcesso,
        status: 200,
      };
    }
    return {
      ok: false,
      error: dataResponse?.message || "Processo não encontrado.",
      data: null,
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      error: "Não foi possível buscar o processo: " + error,
      data: null,
      status: 400,
    };
  }
}
