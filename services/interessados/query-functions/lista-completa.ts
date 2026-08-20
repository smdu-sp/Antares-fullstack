"use server";

import { IInteressado } from "@/types/interessado";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { getInternalApiUrl } from "@/lib/http/get-internal-api-url";

export async function listaCompleta(
  token: string,
  grupoAtivoId?: string,
): Promise<IInteressado[]> {
  try {
    const url = `${getInternalApiUrl()}interessados/lista-completa`;
    const response = await fetch(url, {
      method: "GET",
      headers: buildAuthHeaders(token, grupoAtivoId),
      // Lista não depende da busca do usuário; cache curto reduz round-trips
      // a cada tecla digitada nos filtros da página de processos.
      next: { tags: ["interessados"], revalidate: 60 },
    });

    if (!response.ok) {
      console.error("Erro ao buscar interessados:", response.statusText);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Erro ao buscar interessados:", error);
    return [];
  }
}
