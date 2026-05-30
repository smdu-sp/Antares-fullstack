/** @format */

"use server";

import { redirect } from "next/navigation";
import {
  IUpdateAndamento,
  IRespostaAndamento,
  IAndamento,
} from "@/types/processo";
import { auth } from "@/lib/auth/auth";
import { revalidateTag } from "next/cache";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getApiUrl } from "@/lib/http/get-api-url";

export async function atualizar(
  id: string,
  data: IUpdateAndamento,
): Promise<IRespostaAndamento> {
  const session = await auth();
  const baseURL = getApiUrl();
  if (!session) redirect("/login");

  const response: Response = await fetch(`${baseURL}andamentos/${id}`, {
    method: "PATCH",
    headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
    body: JSON.stringify(data),
  });
  const dataResponse = await response.json();
  if (response.status === 200) {
    revalidateTag("andamentos");
    revalidateTag("processos");
    return {
      ok: true,
      error: null,
      data: dataResponse as IAndamento,
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
