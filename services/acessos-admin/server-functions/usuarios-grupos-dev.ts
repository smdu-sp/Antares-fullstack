/** @format */

"use server";

import { auth } from "@/lib/auth/auth";
import { buildAuthHeaders } from "@/lib/http/auth-headers";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getInternalApiUrl } from "@/lib/http/get-internal-api-url";

export type GrupoDev = {
  id: string;
  nome: string;
  sigla?: string;
};

export type GrupoUsuarioDev = {
  grupoId: string;
  nome: string;
  sigla?: string;
  ativo: boolean;
  permissaoGrupo?: "ADM" | "TEC" | "USR";
  capacidades?: {
    visualizar_proprios: boolean;
    visualizar_grupo: boolean;
    modificar_proprios: boolean;
    modificar_grupo: boolean;
    excluir: boolean;
    ativo: boolean;
  };
};

export type AtualizarGrupoUsuarioDevPayload = {
  ativo?: boolean;
  permissao_grupo?: "ADM" | "TEC" | "USR";
};

export type AtualizarPermissoesGrupoUsuarioDevPayload = {
  visualizar_proprios?: boolean;
  visualizar_grupo?: boolean;
  modificar_proprios?: boolean;
  modificar_grupo?: boolean;
  excluir?: boolean;
  ativo?: boolean;
};

async function extractErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      if (data?.message && typeof data.message === "string") {
        return data.message;
      }
    } else {
      const text = await response.text();
      if (text) return text;
    }
  } catch {
    // Keep fallback when the response body is empty or malformed.
  }

  return fallback;
}

function normalizarGrupos(payload: unknown): GrupoDev[] {
  const source = (() => {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];

    const obj = payload as {
      data?: unknown;
      grupos?: unknown;
      items?: unknown;
      results?: unknown;
    };

    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.grupos)) return obj.grupos;
    if (Array.isArray(obj.items)) return obj.items;
    if (Array.isArray(obj.results)) return obj.results;
    return [];
  })();

  return source.reduce<GrupoDev[]>((acc, item) => {
    if (!item || typeof item !== "object") return acc;

    const raw = item as {
      id?: unknown;
      grupoId?: unknown;
      nome?: unknown;
      name?: unknown;
      descricao?: unknown;
      sigla?: unknown;
      codigo?: unknown;
    };

    const id =
      (typeof raw.id === "string" && raw.id) ||
      (typeof raw.grupoId === "string" && raw.grupoId) ||
      "";

    if (!id) return acc;

    const nome =
      (typeof raw.nome === "string" && raw.nome) ||
      (typeof raw.name === "string" && raw.name) ||
      (typeof raw.descricao === "string" && raw.descricao) ||
      id;

    const sigla =
      (typeof raw.sigla === "string" && raw.sigla) ||
      (typeof raw.codigo === "string" && raw.codigo) ||
      undefined;

    acc.push({ id, nome, sigla });
    return acc;
  }, []);
}

function extrairLista(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const obj = payload as {
    data?: unknown;
    grupos?: unknown;
    items?: unknown;
    results?: unknown;
    vinculos?: unknown;
  };

  if (Array.isArray(obj.data)) return obj.data;
  if (Array.isArray(obj.grupos)) return obj.grupos;
  if (Array.isArray(obj.items)) return obj.items;
  if (Array.isArray(obj.results)) return obj.results;
  if (Array.isArray(obj.vinculos)) return obj.vinculos;
  return [];
}

function normalizarGruposUsuario(payload: unknown): GrupoUsuarioDev[] {
  return extrairLista(payload).reduce<GrupoUsuarioDev[]>((acc, item) => {
    if (!item || typeof item !== "object") return acc;

    const raw = item as {
      grupoId?: unknown;
      grupo_id?: unknown;
      ativo?: unknown;
      permissao_grupo?: unknown;
      permissaoGrupo?: unknown;
      grupo?: {
        id?: unknown;
        nome?: unknown;
        sigla?: unknown;
        ativo?: unknown;
      };
      permissao?: {
        visualizar_proprios?: unknown;
        visualizar_grupo?: unknown;
        modificar_proprios?: unknown;
        modificar_grupo?: unknown;
        excluir?: unknown;
        ativo?: unknown;
      };
      id?: unknown;
      nome?: unknown;
      sigla?: unknown;
    };

    const grupoId =
      (typeof raw.grupoId === "string" && raw.grupoId) ||
      (typeof raw.grupo_id === "string" && raw.grupo_id) ||
      (typeof raw.grupo?.id === "string" && raw.grupo.id) ||
      (typeof raw.id === "string" && raw.id) ||
      "";

    if (!grupoId) return acc;

    const nome =
      (typeof raw.grupo?.nome === "string" && raw.grupo.nome) ||
      (typeof raw.nome === "string" && raw.nome) ||
      grupoId;

    const sigla =
      (typeof raw.grupo?.sigla === "string" && raw.grupo.sigla) ||
      (typeof raw.sigla === "string" && raw.sigla) ||
      undefined;

    const ativo =
      typeof raw.ativo === "boolean"
        ? raw.ativo
        : typeof raw.grupo?.ativo === "boolean"
          ? raw.grupo.ativo
          : true;

    const permissaoGrupo =
      raw.permissao_grupo === "ADM" ||
      raw.permissao_grupo === "TEC" ||
      raw.permissao_grupo === "USR"
        ? raw.permissao_grupo
        : raw.permissaoGrupo === "ADM" ||
            raw.permissaoGrupo === "TEC" ||
            raw.permissaoGrupo === "USR"
          ? raw.permissaoGrupo
          : undefined;

    const capacidades = raw.permissao
      ? {
          visualizar_proprios: Boolean(raw.permissao.visualizar_proprios),
          visualizar_grupo: Boolean(raw.permissao.visualizar_grupo),
          modificar_proprios: Boolean(raw.permissao.modificar_proprios),
          modificar_grupo: Boolean(raw.permissao.modificar_grupo),
          excluir: Boolean(raw.permissao.excluir),
          ativo:
            typeof raw.permissao.ativo === "boolean"
              ? raw.permissao.ativo
              : true,
        }
      : undefined;

    acc.push({ grupoId, nome, sigla, ativo, permissaoGrupo, capacidades });
    return acc;
  }, []);
}

export async function listarGruposDev(): Promise<{
  ok: boolean;
  error: string | null;
  data: GrupoDev[] | null;
  status: number;
}> {
  const session = await auth();
  if (!session) redirect("/login");

  const baseURL = getInternalApiUrl();

  try {
    const response = await fetch(`${baseURL}acessos-admin/dev/grupos`, {
      method: "GET",
      headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data?.message || "Erro ao buscar grupos DEV",
        data: null,
        status: response.status,
      };
    }

    return {
      ok: true,
      error: null,
      data: normalizarGrupos(data),
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      error: `Erro ao buscar grupos DEV: ${error}`,
      data: null,
      status: 500,
    };
  }
}

export async function listarGruposUsuarioDev(usuarioId: string): Promise<{
  ok: boolean;
  error: string | null;
  data: GrupoUsuarioDev[] | null;
  status: number;
}> {
  const session = await auth();
  if (!session) redirect("/login");

  const baseURL = getInternalApiUrl();

  try {
    const response = await fetch(
      `${baseURL}acessos-admin/dev/usuarios/${usuarioId}/grupos`,
      {
        method: "GET",
        headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
        cache: "no-store",
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data?.message || "Erro ao buscar grupos do usuário",
        data: null,
        status: response.status,
      };
    }

    return {
      ok: true,
      error: null,
      data: normalizarGruposUsuario(data),
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      error: `Erro ao buscar grupos do usuário: ${error}`,
      data: null,
      status: 500,
    };
  }
}

export async function atualizarGrupoUsuarioDev(
  usuarioId: string,
  grupoId: string,
  payload?: AtualizarGrupoUsuarioDevPayload,
): Promise<{ ok: boolean; error: string | null; status: number }> {
  const session = await auth();
  if (!session) redirect("/login");

  const baseURL = getInternalApiUrl();

  try {
    const response = await fetch(
      `${baseURL}acessos-admin/dev/usuarios/${usuarioId}/grupos/${grupoId}`,
      {
        method: "PATCH",
        headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
        ...(payload ? { body: JSON.stringify(payload) } : {}),
      },
    );

    if (!response.ok) {
      return {
        ok: false,
        error: await extractErrorMessage(
          response,
          "Erro ao atualizar grupo do usuário",
        ),
        status: response.status,
      };
    }

    revalidateTag("users");
    return { ok: true, error: null, status: response.status };
  } catch (error) {
    return {
      ok: false,
      error: `Erro ao atualizar grupo do usuário: ${error}`,
      status: 500,
    };
  }
}

export async function atualizarPermissoesGrupoUsuarioDev(
  usuarioId: string,
  grupoId: string,
  payload: AtualizarPermissoesGrupoUsuarioDevPayload,
): Promise<{ ok: boolean; error: string | null; status: number }> {
  const session = await auth();
  if (!session) redirect("/login");

  const baseURL = getInternalApiUrl();

  try {
    const response = await fetch(
      `${baseURL}acessos-admin/dev/usuarios/${usuarioId}/grupos/${grupoId}/permissoes`,
      {
        method: "PATCH",
        headers: buildAuthHeaders(session.access_token, session.grupoAtivo?.id),
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const data = await response.json();
      return {
        ok: false,
        error: data?.message || "Erro ao atualizar permissões por grupo",
        status: response.status,
      };
    }

    revalidateTag("users");
    return { ok: true, error: null, status: response.status };
  } catch (error) {
    return {
      ok: false,
      error: `Erro ao atualizar permissões por grupo: ${error}`,
      status: 500,
    };
  }
}
