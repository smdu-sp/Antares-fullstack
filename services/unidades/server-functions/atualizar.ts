/** @format */

"use server";

import { auth } from "@/lib/auth/auth";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { IRespostaUnidade, IUpdateUnidade, IUnidade } from "@/types/unidade";
import { getApiUrl } from "@/lib/http/get-api-url";

export async function atualizar(
  id: string,
  data: IUpdateUnidade,
): Promise<IRespostaUnidade> {
  const session = await auth();
  if (!session) redirect("/login");
  const baseURL = getApiUrl();

  try {
    const response: Response = await fetch(`${baseURL}unidades/${id}`, {
      method: "PATCH",
      headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
      body: JSON.stringify(data),
    });
    const dataResponse = await response.json();

    if (response.status === 200) {
      revalidateTag("unidades");
      revalidateTag("unidade-by-id");
      revalidatePath("/");
      return {
        ok: true,
        error: null,
        data: dataResponse as IUnidade,
        status: 200,
      };
    }
    if (!dataResponse) {
      return {
        ok: false,
        error: "Erro ao atualizar unidade.",
        data: null,
        status: 500,
      };
    }
    return {
      ok: false,
      error: dataResponse?.message || "Erro inesperado",
      data: null,
      status: dataResponse?.statusCode || 500,
    };
  } catch (error) {
    // Erro ao atualizar unidade
    return {
      ok: false,
      error: "Erro ao atualizar unidade.",
      data: null,
      status: 500,
    };
  }
}
