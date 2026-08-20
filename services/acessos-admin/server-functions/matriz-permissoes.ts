/** @format */

"use server";

import { auth } from "@/lib/auth/auth";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getInternalApiUrl } from "@/lib/http/get-internal-api-url";
import { redirect } from "next/navigation";
import { IMatrizPermissaoLinha, IRespostaAcessosAdmin } from "@/types/grupo";

export async function obterMatrizPermissoesEfetivas(
  usuarioId?: string,
): Promise<
  IRespostaAcessosAdmin<{ total: number; data: IMatrizPermissaoLinha[] }>
> {
  const session = await auth();
  if (!session) redirect("/login");

  const baseURL = getInternalApiUrl();

  try {
    const query = usuarioId ? `?usuarioId=${encodeURIComponent(usuarioId)}` : "";
    const response = await fetch(
      `${baseURL}acessos-admin/dev/matriz-permissoes${query}`,
      {
        method: "GET",
        headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      return {
        ok: false,
        error: data?.message || "Erro ao buscar matriz de permissões",
        data: null,
        status: response.status,
      };
    }

    const data = await response.json();
    return { ok: true, error: null, data, status: response.status };
  } catch (error) {
    return {
      ok: false,
      error: `Erro ao buscar matriz de permissões: ${error}`,
      data: null,
      status: 500,
    };
  }
}
