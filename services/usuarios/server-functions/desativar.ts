/** @format */

"use server";

import { auth } from "@/lib/auth/auth";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getApiUrl } from "@/lib/http/get-api-url";

export async function desativar(id: string) {
  const session = await auth();
  if (!session) redirect("/login");
  const baseURL = getApiUrl();
  const desativado = await fetch(`${baseURL}usuarios/desativar/${id}`, {
    method: "DELETE",
    headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
  });
  const dataResponse = await desativado.json();
  if (desativado.status === 200) {
    revalidateTag("users");
    return {
      ok: true,
      error: null,
      data: dataResponse as { desativado: boolean },
      status: 200,
    };
  }
  if (!dataResponse)
    return {
      ok: false,
      error: "Erro ao desativar usuário.",
      data: null,
      status: 500,
    };
  return {
    ok: false,
    error: dataResponse.message,
    data: null,
    status: dataResponse.statusCode,
  };
}
