"use server";

import { auth } from "@/lib/auth/auth";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import type {
  IPreferencia,
  CriarPreferenciaDTO,
  AtualizarPreferenciaDTO,
} from "@/types/preferencia";
import { getInternalApiUrl } from "@/lib/http/get-internal-api-url";

const API_URL = getInternalApiUrl().replace(/\/$/, "");

/**
 * Buscar uma preferência específica por chave
 */
export async function buscarPreferencia(
  chave: string,
): Promise<IPreferencia | null> {
  const session = await auth();

  if (!session?.access_token) {
    return null;
  }

  try {
    const url = `${API_URL}/preferencias/${chave}`;

    const response = await fetch(url, {
      method: "GET",
      headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
      cache: "no-store",
    });

    if (response.status === 404) {
      return null;
    }

    if (response.status === 401 || response.status === 403) {
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Erro ao buscar preferência: ${response.status} - ${errorText}`,
      );
    }

    const preferencia = await response.json();

    // Tentar fazer parse do valor se for string JSON
    if (preferencia && typeof preferencia.valor === "string") {
      try {
        preferencia.valor = JSON.parse(preferencia.valor);
      } catch {
        // Se não for JSON válido, manter como string
      }
    }

    return preferencia;
  } catch (error) {
    console.error("Erro ao buscar preferência:", error);
    return null;
  }
}

/**
 * Salvar ou atualizar uma preferência
 */
export async function salvarPreferencia(
  data: CriarPreferenciaDTO,
): Promise<IPreferencia> {
  const session = await auth();

  if (!session?.access_token) {
    throw new Error("Usuário não autenticado");
  }

  try {
    // Converter valor para string JSON se não for string
    const valorString =
      typeof data.valor === "string" ? data.valor : JSON.stringify(data.valor);

    const payload = {
      chave: data.chave,
      valor: valorString,
    };

    const url = `${API_URL}/preferencias`;

    const response = await fetch(url, {
      method: "POST",
      headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Erro ao salvar preferência: ${response.status} - ${errorText}`,
      );
    }

    return response.json();
  } catch (error) {
    console.error("Erro ao salvar preferência:", error);
    throw error;
  }
}

/**
 * Buscar todas as preferências do usuário
 */
export async function buscarTodasPreferencias(): Promise<IPreferencia[]> {
  const session = await auth();

  if (!session?.access_token) {
    throw new Error("Usuário não autenticado");
  }

  try {
    const response = await fetch(`${API_URL}/preferencias`, {
      method: "GET",
      headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Erro ao buscar preferências: ${response.status} - ${errorText}`,
      );
    }

    const preferencias = await response.json();

    // Tentar fazer parse do valor de cada preferência
    return preferencias.map((pref: IPreferencia) => {
      if (typeof pref.valor === "string") {
        try {
          return { ...pref, valor: JSON.parse(pref.valor) };
        } catch {
          return pref;
        }
      }
      return pref;
    });
  } catch (error) {
    console.error("Erro ao buscar preferências:", error);
    throw error;
  }
}

/**
 * Deletar uma preferência específica
 */
export async function deletarPreferencia(chave: string): Promise<void> {
  const session = await auth();

  if (!session?.access_token) {
    throw new Error("Usuário não autenticado");
  }

  try {
    const response = await fetch(`${API_URL}/preferencias/${chave}`, {
      method: "DELETE",
      headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Erro ao deletar preferência: ${response.status} - ${errorText}`,
      );
    }
  } catch (error) {
    console.error("Erro ao deletar preferência:", error);
    throw error;
  }
}

/**
 * Deletar todas as preferências do usuário
 */
export async function deletarTodasPreferencias(): Promise<void> {
  const session = await auth();

  if (!session?.access_token) {
    throw new Error("Usuário não autenticado");
  }

  try {
    const response = await fetch(`${API_URL}/preferencias`, {
      method: "DELETE",
      headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Erro ao deletar preferências: ${response.status} - ${errorText}`,
      );
    }
  } catch (error) {
    console.error("Erro ao deletar preferências:", error);
    throw error;
  }
}
