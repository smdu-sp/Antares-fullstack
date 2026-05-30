/** @format */

"use server";

import { auth } from "@/lib/auth/auth";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { IUnidade } from "@/types/unidade";
import { redirect } from "next/navigation";
import { getApiUrl } from "@/lib/http/get-api-url";

export async function listarTodas(): Promise<IUnidade[]> {
  const session = await auth();
  if (!session) redirect("/login");

  const baseURL = getApiUrl();

  try {
    const response = await fetch(`${baseURL}unidades/lista-completa`, {
      method: "GET",
      headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
      next: {
        revalidate: 60,
        tags: ["unidades"],
      },
    });

    if (!response.ok) {
      console.error("Erro ao buscar unidades:", response.statusText);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? (data as IUnidade[]) : [];
  } catch (error) {
    console.error("Erro ao buscar unidades:", error);
    return [];
  }
}

export async function reativarUnidade(
  id: string,
  data: { nome: string; sigla: string },
) {
  const session = await auth();
  if (!session) redirect("/login");

  const baseURL = getApiUrl();

  try {
    const response = await fetch(`${baseURL}unidades/${id}/reativar`, {
      method: "PATCH",
      headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
      body: JSON.stringify(data),
    });

    if (response.status === 200) {
      const responseData = await response.json();
      return {
        ok: true,
        error: null,
        data: responseData as IUnidade,
        status: 200,
      };
    }

    const errorData = await response.json();
    return {
      ok: false,
      error: errorData?.message || "Erro ao atualizar unidade",
      data: null,
      status: response.status,
    };
  } catch (error) {
    console.error("Erro ao atualizar unidade:", error);
    return {
      ok: false,
      error: "Erro ao atualizar unidade",
      data: null,
      status: 500,
    };
  }
}
