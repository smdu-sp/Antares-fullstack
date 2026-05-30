/** @format */

"use server";

import { auth } from "@/lib/auth/auth";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { IRespostaUsuario, IUpdateUsuario, IUsuario } from "@/types/usuario";
import { getApiUrl } from "@/lib/http/get-api-url";

export async function atualizar(
  id: string,
  data: IUpdateUsuario,
): Promise<IRespostaUsuario> {
  const session = await auth();
  if (!session) redirect("/login");
  const baseURL = getApiUrl();

  try {
    const response: Response = await fetch(
      `${baseURL}usuarios/atualizar/${id}`,
      {
        method: "PATCH",
        headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
        body: JSON.stringify(data),
      },
    );
    const dataResponse = await response.json();

    if (response.status === 200) {
      revalidateTag("users");
      revalidateTag("user-by-id");
      revalidatePath("/");
      return {
        ok: true,
        error: null,
        data: dataResponse as IUsuario,
        status: 200,
      };
    }
    if (!dataResponse) {
      return {
        ok: false,
        error: "Erro ao atualizar usuário.",
        data: null,
        status: 500,
      };
    }
  } catch (error) {
    // Erro ao atualizar usuário
    return {
      ok: false,
      error: "Erro ao atualizar usuário.",
      data: null,
      status: 500,
    };
  }

  // Default return statement to handle unexpected cases
  return {
    ok: false,
    error: "Erro inesperado",
    data: null,
    status: 500,
  };
}
