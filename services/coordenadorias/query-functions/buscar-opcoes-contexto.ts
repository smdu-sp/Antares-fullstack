/** @format */

import {
  ICoordenadoriaApiResponse,
  IOpcaoContexto,
} from "@/types/coordenadoria";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getApiUrl } from "@/lib/http/get-api-url";

export async function buscarOpcoesContexto(
  access_token: string,
  grupoAtivoId?: string,
): Promise<ICoordenadoriaApiResponse<IOpcaoContexto[]>> {
  const baseURL = (
    getApiUrl()
  ).replace(/\/$/, "");

  try {
    const response = await fetch(
      `${baseURL}/coordenadorias/admin/opcoes-contexto`,
      {
        method: "GET",
        headers: buildAuthHeaders(access_token, grupoAtivoId),
        cache: "no-store",
      },
    );

    const data = await response.json();

    if (response.status === 200) {
      const opcoes = Array.isArray(data)
        ? data
            .map((item: unknown) => {
              if (typeof item === "string") {
                return { value: item, label: item };
              }

              if (item && typeof item === "object") {
                const obj = item as { value?: unknown; label?: unknown };
                const value =
                  typeof obj.value === "string"
                    ? obj.value
                    : typeof obj.label === "string"
                      ? obj.label
                      : "";
                const label =
                  typeof obj.label === "string"
                    ? obj.label
                    : typeof obj.value === "string"
                      ? obj.value
                      : value;

                if (value) {
                  return { value, label };
                }
              }

              return null;
            })
            .filter((item): item is IOpcaoContexto => !!item)
        : [];

      return { ok: true, error: null, data: opcoes, status: 200 };
    }

    return {
      ok: false,
      error: data?.message || "Erro ao buscar opções de contexto",
      data: null,
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      error: `Não foi possível buscar opções de contexto: ${error}`,
      data: null,
      status: 400,
    };
  }
}
