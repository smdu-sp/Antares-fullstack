/** @format */

"use server";

import { redirect } from "next/navigation";
import { ICreateUnidade, IRespostaUnidade, IUnidade } from "@/types/unidade";
import { auth } from "@/lib/auth/auth";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { revalidateTag } from "next/cache";
import { getApiUrl } from "@/lib/http/get-api-url";

export async function criar(data: ICreateUnidade): Promise<IRespostaUnidade> {
  const session = await auth();
  const baseURL = getApiUrl();
  if (!session) redirect("/login");

  const response: Response = await fetch(`${baseURL}unidades`, {
    method: "POST",
    headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
    body: JSON.stringify(data),
  });
  const dataResponse = await response.json();
  if (response.status === 201) {
    revalidateTag("unidades");
    return {
      ok: true,
      error: null,
      data: dataResponse as IUnidade,
      status: 201,
    };
  }
  if (!dataResponse)
    return {
      ok: false,
      error: "Erro ao criar nova unidade.",
      data: null,
      status: response.status,
    };
  return {
    ok: false,
    error: dataResponse.message,
    data: null,
    status: response.status,
  };
}
