/** @format */

"use server";

import { auth } from "@/lib/auth/auth";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { IInteressado } from "@/types/interessado";
import { redirect } from "next/navigation";
import { getInternalApiUrl } from "@/lib/http/get-internal-api-url";

export async function listarTodas(): Promise<IInteressado[]> {
  const session = await auth();
  if (!session) redirect("/login");

  const baseURL = getInternalApiUrl();

  try {
    const response = await fetch(`${baseURL}interessados/lista-completa`, {
      method: "GET",
      headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
      next: {
        revalidate: 60,
        tags: ["interessados"],
      },
    });

    if (!response.ok) {
      console.error("Erro ao buscar interessados:", response.statusText);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? (data as IInteressado[]) : [];
  } catch (error) {
    console.error("Erro ao buscar interessados:", error);
    return [];
  }
}
