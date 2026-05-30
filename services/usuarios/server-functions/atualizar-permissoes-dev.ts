/** @format */

"use server";

import { auth } from "@/lib/auth/auth";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getApiUrl } from "@/lib/http/get-api-url";

export type AtualizarPermissoesDevPayload = {
  coordenadoria?: "EXPEDIENTE" | "SERVIN";
  permissaoCoordenadoria?: "ADMINISTRADOR" | "EDITOR" | "LEITOR";
  servin_visualizar_todos?: boolean;
  servin_visualizar_proprios?: boolean;
  servin_editar_todos?: boolean;
  servin_editar_proprios?: boolean;
  servin_excluir_todos?: boolean;
};

export async function atualizarPermissoesDev(
  usuarioId: string,
  payload: AtualizarPermissoesDevPayload,
): Promise<{ ok: boolean; error: string | null; status: number }> {
  const session = await auth();
  if (!session) redirect("/login");

  const baseURL = getApiUrl();

  try {
    const response = await fetch(
      `${baseURL}usuarios/admin/dev/permissoes/${usuarioId}`,
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
        error: data?.message || "Erro ao atualizar permissões DEV",
        status: response.status,
      };
    }

    revalidateTag("users");
    return { ok: true, error: null, status: response.status };
  } catch (error) {
    return {
      ok: false,
      error: `Erro ao atualizar permissões DEV: ${error}`,
      status: 500,
    };
  }
}
