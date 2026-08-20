/** @format */

"use server";

import { redirect } from "next/navigation";
import {
  IUpdateProcesso,
  IRespostaProcesso,
  IProcesso,
} from "@/types/processo";
import { auth } from "@/lib/auth/auth";
import { revalidateTag } from "next/cache";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getInternalApiUrl } from "@/lib/http/get-internal-api-url";

export async function atualizar(
  id: string,
  data: IUpdateProcesso,
): Promise<IRespostaProcesso> {
  const session = await auth();
  const baseURL = getInternalApiUrl();
  if (!session) redirect("/login");

  const response: Response = await fetch(`${baseURL}processos/${id}`, {
    method: "PATCH",
    headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
    body: JSON.stringify(data),
  });
  const dataResponse = await response.json();
  if (response.status === 200) {
    revalidateTag("processos");
    return {
      ok: true,
      error: null,
      data: dataResponse as IProcesso,
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
