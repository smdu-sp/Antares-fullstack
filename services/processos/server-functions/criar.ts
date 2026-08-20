/** @format */

"use server";

import { redirect } from "next/navigation";
import {
  ICreateProcesso,
  IRespostaProcesso,
  IProcesso,
} from "@/types/processo";
import { auth } from "@/lib/auth/auth";
import { revalidateTag } from "next/cache";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getInternalApiUrl } from "@/lib/http/get-internal-api-url";

export async function criar(data: ICreateProcesso): Promise<IRespostaProcesso> {
  const session = await auth();
  const baseURL = getInternalApiUrl();
  if (!session) redirect("/login");

  const response: Response = await fetch(`${baseURL}processos`, {
    method: "POST",
    headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
    body: JSON.stringify(data),
  });
  const dataResponse = await response.json();
  if (response.status === 201) {
    revalidateTag("processos");
    return {
      ok: true,
      error: null,
      data: dataResponse as IProcesso,
      status: 201,
    };
  }
  if (!dataResponse)
    return {
      ok: false,
      error: "Erro ao criar novo processo.",
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
