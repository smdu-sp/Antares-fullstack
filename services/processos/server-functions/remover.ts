/** @format */

"use server";

import { redirect } from "next/navigation";
import { IRespostaProcesso } from "@/types/processo";
import { auth } from "@/lib/auth/auth";
import { revalidateTag } from "next/cache";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getApiUrl } from "@/lib/http/get-api-url";

export async function remover(id: string): Promise<IRespostaProcesso> {
  const session = await auth();
  const baseURL = getApiUrl();
  if (!session) redirect("/login");

  const response: Response = await fetch(`${baseURL}processos/${id}`, {
    method: "DELETE",
    headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
  });
  const dataResponse = await response.json();
  if (response.status === 200) {
    revalidateTag("processos");
    return {
      ok: true,
      error: null,
      data: { removido: true },
      status: 200,
    };
  }
  return {
    ok: false,
    error: dataResponse.message,
    data: null,
    status: dataResponse.statusCode,
  };
}
