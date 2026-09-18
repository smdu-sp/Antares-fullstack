/** @format */

"use server";

import { auth } from "@/lib/auth/auth";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { IRespostaUnidade } from "@/types/unidade";
import { getInternalApiUrl } from "@/lib/http/get-internal-api-url";

/** Espelha services/unidades/server-functions/remover.ts, pra unidades-grupo. */
export async function remover(id: string): Promise<IRespostaUnidade> {
  const session = await auth();
  if (!session) redirect("/login");
  const baseURL = getInternalApiUrl();

  try {
    const response: Response = await fetch(`${baseURL}unidades-grupo/${id}`, {
      method: "DELETE",
      headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
    });
    const dataResponse = await response.json();

    if (response.status === 200) {
      revalidateTag("unidades-grupo");
      revalidateTag("unidade-grupo-by-id");
      revalidatePath("/");
      return {
        ok: true,
        error: null,
        data: dataResponse as { removido: boolean },
        status: 200,
      };
    }
    if (!dataResponse) {
      return {
        ok: false,
        error: "Erro ao remover unidade.",
        data: null,
        status: 500,
      };
    }
    return {
      ok: false,
      error: dataResponse.message,
      data: null,
      status: dataResponse.statusCode,
    };
  } catch (error) {
    return {
      ok: false,
      error: "Erro ao remover unidade.",
      data: null,
      status: 500,
    };
  }
}
