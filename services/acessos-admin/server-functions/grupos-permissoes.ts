/** @format */

"use server";

import { auth } from "@/lib/auth/auth";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getInternalApiUrl } from "@/lib/http/get-internal-api-url";

export type AtualizarPermissoesGrupoDevPayload = {
  papel: "ADM" | "TEC" | "USR";
  codigos: string[];
};

export async function atualizarPermissoesGrupoDev(
  grupoId: string,
  payload: AtualizarPermissoesGrupoDevPayload,
): Promise<{ ok: boolean; error: string | null; status: number }> {
  const session = await auth();
  if (!session) redirect("/login");

  const baseURL = getInternalApiUrl();

  try {
    const response = await fetch(
      `${baseURL}acessos-admin/dev/grupos/${grupoId}/permissoes`,
      {
        method: "PATCH",
        headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const data = await response.json();
      return {
        ok: false,
        error: data?.message || "Erro ao atualizar permissões do grupo",
        status: response.status,
      };
    }

    revalidateTag("grupos");
    return { ok: true, error: null, status: response.status };
  } catch (error) {
    return {
      ok: false,
      error: `Erro ao atualizar permissões do grupo: ${error}`,
      status: 500,
    };
  }
}
