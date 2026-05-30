/** @format */

import { auth } from "@/lib/auth/auth";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { IRespostaUsuario, IUsuario } from "@/types/usuario";
import { redirect } from "next/navigation";
import { getApiUrl } from "@/lib/http/get-api-url";

export async function validaUsuario(): Promise<IRespostaUsuario> {
  const session = await auth();
  if (!session) redirect("/login");
  const baseURL = getApiUrl();
  try {
    const usuario = await fetch(`${baseURL}usuarios/valida-usuario`, {
      method: "GET",
      headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
    });
    const data = await usuario.json();
    return {
      ok: true,
      error: null,
      data: data as IUsuario,
      status: 200,
    };
  } catch (error) {
    // Erro ao validar usuário
    return {
      ok: false,
      error: "Não foi possível validar o usuário:" + error,
      data: null,
      status: 500,
    };
  }
}
